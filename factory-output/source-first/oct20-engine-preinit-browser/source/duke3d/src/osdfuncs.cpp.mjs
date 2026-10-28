// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/duke3d/src/osdfuncs.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
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
export const fix16_rad_to_deg_mult__header_global_051498419a074576 = i32(3754936);
function __cxx_static_address_db75271c9003f051b9fe3d91() {
  return __cxx_static_address_db75271c9003f051b9fe3d91.reference || (__cxx_static_address_db75271c9003f051b9fe3d91.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_051498419a074576; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_0a9e29107e38f84f = i32(1144);
function __cxx_static_address_167ba92105a96946801b1f62() {
  return __cxx_static_address_167ba92105a96946801b1f62.reference || (__cxx_static_address_167ba92105a96946801b1f62.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_0a9e29107e38f84f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:43
export const KICK_HIT____header_global_a3320930c5dba8dc = ((((((0) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6714449aad6c436a5510ec24() {
  return __cxx_static_address_6714449aad6c436a5510ec24.reference || (__cxx_static_address_6714449aad6c436a5510ec24.reference = {
    __cReference: true,
    get value() { return KICK_HIT____header_global_a3320930c5dba8dc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:44
export const PISTOL_RICOCHET____header_global_53427f1cad99ba51 = ((((((1) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8a40d4ec4b6f791424de0962() {
  return __cxx_static_address_8a40d4ec4b6f791424de0962.reference || (__cxx_static_address_8a40d4ec4b6f791424de0962.reference = {
    __cReference: true,
    get value() { return PISTOL_RICOCHET____header_global_53427f1cad99ba51; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:45
export const PISTOL_BODYHIT____header_global_6590d5a28b1d403d = ((((((2) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4435f1b9538ee9118abdeff9() {
  return __cxx_static_address_4435f1b9538ee9118abdeff9.reference || (__cxx_static_address_4435f1b9538ee9118abdeff9.reference = {
    __cReference: true,
    get value() { return PISTOL_BODYHIT____header_global_6590d5a28b1d403d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:46
export const PISTOL_FIRE____header_global_49a3cb0d981ef5c4 = ((((((3) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0272b23506591d3635d2fc34() {
  return __cxx_static_address_0272b23506591d3635d2fc34.reference || (__cxx_static_address_0272b23506591d3635d2fc34.reference = {
    __cReference: true,
    get value() { return PISTOL_FIRE____header_global_49a3cb0d981ef5c4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:47
export const EJECT_CLIP____header_global_cc1cd1e0b9c62e6b = ((((((4) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_11e67e8377f3bb3a293133f5() {
  return __cxx_static_address_11e67e8377f3bb3a293133f5.reference || (__cxx_static_address_11e67e8377f3bb3a293133f5.reference = {
    __cReference: true,
    get value() { return EJECT_CLIP____header_global_cc1cd1e0b9c62e6b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:48
export const INSERT_CLIP____header_global_7f50865a22b07bb3 = ((((((5) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1aba948994368b4b5abaed47() {
  return __cxx_static_address_1aba948994368b4b5abaed47.reference || (__cxx_static_address_1aba948994368b4b5abaed47.reference = {
    __cReference: true,
    get value() { return INSERT_CLIP____header_global_7f50865a22b07bb3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:49
export const CHAINGUN_FIRE____header_global_0cb036ecd06ec5de = ((((((6) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a361296d5d9a5f03be7048bf() {
  return __cxx_static_address_a361296d5d9a5f03be7048bf.reference || (__cxx_static_address_a361296d5d9a5f03be7048bf.reference = {
    __cReference: true,
    get value() { return CHAINGUN_FIRE____header_global_0cb036ecd06ec5de; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:50
export const RPG_SHOOT____header_global_c90d1ff9d77e3208 = ((((((7) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_abba0cebf615b82018ca5d27() {
  return __cxx_static_address_abba0cebf615b82018ca5d27.reference || (__cxx_static_address_abba0cebf615b82018ca5d27.reference = {
    __cReference: true,
    get value() { return RPG_SHOOT____header_global_c90d1ff9d77e3208; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:51
export const POOLBALLHIT____header_global_e8673561da399d8e = ((((((8) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4c576e752d030eb045fe5218() {
  return __cxx_static_address_4c576e752d030eb045fe5218.reference || (__cxx_static_address_4c576e752d030eb045fe5218.reference = {
    __cReference: true,
    get value() { return POOLBALLHIT____header_global_e8673561da399d8e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:52
export const RPG_EXPLODE____header_global_1937484dbeeca620 = ((((((9) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d4bf120dddad216c7a3e04f1() {
  return __cxx_static_address_d4bf120dddad216c7a3e04f1.reference || (__cxx_static_address_d4bf120dddad216c7a3e04f1.reference = {
    __cReference: true,
    get value() { return RPG_EXPLODE____header_global_1937484dbeeca620; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:53
export const CAT_FIRE____header_global_52819a5de4efd906 = ((((((10) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_45c49917aade13c9c56d2aaa() {
  return __cxx_static_address_45c49917aade13c9c56d2aaa.reference || (__cxx_static_address_45c49917aade13c9c56d2aaa.reference = {
    __cReference: true,
    get value() { return CAT_FIRE____header_global_52819a5de4efd906; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:54
export const SHRINKER_FIRE____header_global_0b590004fe56756f = ((((((11) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_49bca56cb2d27d99b1e5781c() {
  return __cxx_static_address_49bca56cb2d27d99b1e5781c.reference || (__cxx_static_address_49bca56cb2d27d99b1e5781c.reference = {
    __cReference: true,
    get value() { return SHRINKER_FIRE____header_global_0b590004fe56756f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:55
export const PIPEBOMB_BOUNCE____header_global_fe35992df2bc395f = ((((((13) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_af5a79c996ab262f0b07e30c() {
  return __cxx_static_address_af5a79c996ab262f0b07e30c.reference || (__cxx_static_address_af5a79c996ab262f0b07e30c.reference = {
    __cReference: true,
    get value() { return PIPEBOMB_BOUNCE____header_global_fe35992df2bc395f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:56
export const PIPEBOMB_EXPLODE____header_global_eda3c7046e25dca7 = ((((((14) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8d91e8a49bbbc63285cba7f6() {
  return __cxx_static_address_8d91e8a49bbbc63285cba7f6.reference || (__cxx_static_address_8d91e8a49bbbc63285cba7f6.reference = {
    __cReference: true,
    get value() { return PIPEBOMB_EXPLODE____header_global_eda3c7046e25dca7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:57
export const LASERTRIP_ONWALL____header_global_30a9ef0682ee4ef3 = ((((((15) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_50233f061d09a9651195c2b7() {
  return __cxx_static_address_50233f061d09a9651195c2b7.reference || (__cxx_static_address_50233f061d09a9651195c2b7.reference = {
    __cReference: true,
    get value() { return LASERTRIP_ONWALL____header_global_30a9ef0682ee4ef3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:58
export const LASERTRIP_ARMING____header_global_cba185afafca5068 = ((((((16) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_416820d190ea9e4e6d26e0d6() {
  return __cxx_static_address_416820d190ea9e4e6d26e0d6.reference || (__cxx_static_address_416820d190ea9e4e6d26e0d6.reference = {
    __cReference: true,
    get value() { return LASERTRIP_ARMING____header_global_cba185afafca5068; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:59
export const LASERTRIP_EXPLODE____header_global_f81b5c7f92c031ef = ((((((17) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_907b8ea4f8a4798918a7968c() {
  return __cxx_static_address_907b8ea4f8a4798918a7968c.reference || (__cxx_static_address_907b8ea4f8a4798918a7968c.reference = {
    __cReference: true,
    get value() { return LASERTRIP_EXPLODE____header_global_f81b5c7f92c031ef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:60
export const VENT_BUST____header_global_ce00f33df5ea5ee5 = ((((((18) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_815770796ecd5f9c9d608b15() {
  return __cxx_static_address_815770796ecd5f9c9d608b15.reference || (__cxx_static_address_815770796ecd5f9c9d608b15.reference = {
    __cReference: true,
    get value() { return VENT_BUST____header_global_ce00f33df5ea5ee5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:61
export const GLASS_BREAKING____header_global_3b23224ae69ee99c = ((((((19) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6d804acddfd979fd6516c31f() {
  return __cxx_static_address_6d804acddfd979fd6516c31f.reference || (__cxx_static_address_6d804acddfd979fd6516c31f.reference = {
    __cReference: true,
    get value() { return GLASS_BREAKING____header_global_3b23224ae69ee99c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:62
export const GLASS_HEAVYBREAK____header_global_cc1eb40628a85d5d = ((((((20) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ae2143861d90f5cf088a74b8() {
  return __cxx_static_address_ae2143861d90f5cf088a74b8.reference || (__cxx_static_address_ae2143861d90f5cf088a74b8.reference = {
    __cReference: true,
    get value() { return GLASS_HEAVYBREAK____header_global_cc1eb40628a85d5d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:63
export const SHORT_CIRCUIT____header_global_2933a4ae5e4c2dd9 = ((((((21) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_932fa893fd086579ac2fed39() {
  return __cxx_static_address_932fa893fd086579ac2fed39.reference || (__cxx_static_address_932fa893fd086579ac2fed39.reference = {
    __cReference: true,
    get value() { return SHORT_CIRCUIT____header_global_2933a4ae5e4c2dd9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:64
export const ITEM_SPLASH____header_global_d3d8c0844f79b637 = ((((((22) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6501d1ac9745b06a8fdeebc3() {
  return __cxx_static_address_6501d1ac9745b06a8fdeebc3.reference || (__cxx_static_address_6501d1ac9745b06a8fdeebc3.reference = {
    __cReference: true,
    get value() { return ITEM_SPLASH____header_global_d3d8c0844f79b637; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:65
export const DUKE_GASP____header_global_977457656245625a = ((((((25) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_df87a1d4ccba4a0a58f1fa57() {
  return __cxx_static_address_df87a1d4ccba4a0a58f1fa57.reference || (__cxx_static_address_df87a1d4ccba4a0a58f1fa57.reference = {
    __cReference: true,
    get value() { return DUKE_GASP____header_global_977457656245625a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:66
export const SLIM_RECOG____header_global_99e34a95f4043e91 = ((((((26) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_19487dc1348ce0b5724549fc() {
  return __cxx_static_address_19487dc1348ce0b5724549fc.reference || (__cxx_static_address_19487dc1348ce0b5724549fc.reference = {
    __cReference: true,
    get value() { return SLIM_RECOG____header_global_99e34a95f4043e91; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:67
export const DUKE_URINATE____header_global_487c3acbf3ed904d = ((((((28) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8c57feeef77b958785b9189f() {
  return __cxx_static_address_8c57feeef77b958785b9189f.reference || (__cxx_static_address_8c57feeef77b958785b9189f.reference = {
    __cReference: true,
    get value() { return DUKE_URINATE____header_global_487c3acbf3ed904d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:68
export const ENDSEQVOL3SND2____header_global_4cd7075930f34e81 = ((((((29) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b04cc4cd956a683d3c61419c() {
  return __cxx_static_address_b04cc4cd956a683d3c61419c.reference || (__cxx_static_address_b04cc4cd956a683d3c61419c.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND2____header_global_4cd7075930f34e81; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:69
export const ENDSEQVOL3SND3____header_global_283baaa8f8f694e1 = ((((((30) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_332686489ec1f966323582e5() {
  return __cxx_static_address_332686489ec1f966323582e5.reference || (__cxx_static_address_332686489ec1f966323582e5.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND3____header_global_283baaa8f8f694e1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:70
export const DUKE_CRACK____header_global_716867f91f4c9afa = ((((((33) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b27996c9832c5e9b10406b81() {
  return __cxx_static_address_b27996c9832c5e9b10406b81.reference || (__cxx_static_address_b27996c9832c5e9b10406b81.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK____header_global_716867f91f4c9afa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:71
export const SLIM_ATTACK____header_global_426cc19bbd9dd4fb = ((((((34) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6f0b9e8d31b5116516175108() {
  return __cxx_static_address_6f0b9e8d31b5116516175108.reference || (__cxx_static_address_6f0b9e8d31b5116516175108.reference = {
    __cReference: true,
    get value() { return SLIM_ATTACK____header_global_426cc19bbd9dd4fb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:72
export const SOMETHINGHITFORCE____header_global_4b4cee22eb4684d1 = ((((((35) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2ebda0d9acc8bf2a42ee18a7() {
  return __cxx_static_address_2ebda0d9acc8bf2a42ee18a7.reference || (__cxx_static_address_2ebda0d9acc8bf2a42ee18a7.reference = {
    __cReference: true,
    get value() { return SOMETHINGHITFORCE____header_global_4b4cee22eb4684d1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:73
export const DUKE_DRINKING____header_global_6e215545f9c81739 = ((((((36) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4e023d3cf0f46dcc6c0f20c8() {
  return __cxx_static_address_4e023d3cf0f46dcc6c0f20c8.reference || (__cxx_static_address_4e023d3cf0f46dcc6c0f20c8.reference = {
    __cReference: true,
    get value() { return DUKE_DRINKING____header_global_6e215545f9c81739; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:74
export const DUKE_GRUNT____header_global_174585fa768adf89 = ((((((38) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ab399bef92d3433757f9ef2e() {
  return __cxx_static_address_ab399bef92d3433757f9ef2e.reference || (__cxx_static_address_ab399bef92d3433757f9ef2e.reference = {
    __cReference: true,
    get value() { return DUKE_GRUNT____header_global_174585fa768adf89; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:75
export const DUKE_HARTBEAT____header_global_df144934f3bb79ea = ((((((39) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_45ea64dc0155b4cb83526d60() {
  return __cxx_static_address_45ea64dc0155b4cb83526d60.reference || (__cxx_static_address_45ea64dc0155b4cb83526d60.reference = {
    __cReference: true,
    get value() { return DUKE_HARTBEAT____header_global_df144934f3bb79ea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:76
export const DUKE_ONWATER____header_global_054ba56f1011f4da = ((((((40) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_63012452ed4e34d665ddf066() {
  return __cxx_static_address_63012452ed4e34d665ddf066.reference || (__cxx_static_address_63012452ed4e34d665ddf066.reference = {
    __cReference: true,
    get value() { return DUKE_ONWATER____header_global_054ba56f1011f4da; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:77
export const DUKE_LAND____header_global_cf125ebe781f9d4a = ((((((42) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ae2310c56fe583d16b22f13d() {
  return __cxx_static_address_ae2310c56fe583d16b22f13d.reference || (__cxx_static_address_ae2310c56fe583d16b22f13d.reference = {
    __cReference: true,
    get value() { return DUKE_LAND____header_global_cf125ebe781f9d4a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:78
export const DUKE_WALKINDUCTS____header_global_ee983fe879c7ea99 = ((((((43) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1f28702baab6cd238fe4830c() {
  return __cxx_static_address_1f28702baab6cd238fe4830c.reference || (__cxx_static_address_1f28702baab6cd238fe4830c.reference = {
    __cReference: true,
    get value() { return DUKE_WALKINDUCTS____header_global_ee983fe879c7ea99; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:79
export const DUKE_UNDERWATER____header_global_692ec5ef78474035 = ((((((48) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3bd7f39275fe9aadedc882fc() {
  return __cxx_static_address_3bd7f39275fe9aadedc882fc.reference || (__cxx_static_address_3bd7f39275fe9aadedc882fc.reference = {
    __cReference: true,
    get value() { return DUKE_UNDERWATER____header_global_692ec5ef78474035; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:80
export const DUKE_JETPACK_ON____header_global_f8cc28da1998e9e7 = ((((((49) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a02d6df114508f9c44bc53b1() {
  return __cxx_static_address_a02d6df114508f9c44bc53b1.reference || (__cxx_static_address_a02d6df114508f9c44bc53b1.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_ON____header_global_f8cc28da1998e9e7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:81
export const DUKE_JETPACK_IDLE____header_global_987ce4794edc5535 = ((((((50) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e67f57bcb6efa1ced292327a() {
  return __cxx_static_address_e67f57bcb6efa1ced292327a.reference || (__cxx_static_address_e67f57bcb6efa1ced292327a.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_IDLE____header_global_987ce4794edc5535; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:82
export const DUKE_JETPACK_OFF____header_global_d228440ac5364fd1 = ((((((51) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1a5ff917350e4999d6c1775f() {
  return __cxx_static_address_1a5ff917350e4999d6c1775f.reference || (__cxx_static_address_1a5ff917350e4999d6c1775f.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_OFF____header_global_d228440ac5364fd1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:83
export const DUKETALKTOBOSS____header_global_02925a52b5e3071e = ((((((56) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_069aad6408e7452b4a8dc157() {
  return __cxx_static_address_069aad6408e7452b4a8dc157.reference || (__cxx_static_address_069aad6408e7452b4a8dc157.reference = {
    __cReference: true,
    get value() { return DUKETALKTOBOSS____header_global_02925a52b5e3071e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:84
export const SQUISHED____header_global_c2df66ec298b2390 = ((((((69) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c00c1c570119b540777ea549() {
  return __cxx_static_address_c00c1c570119b540777ea549.reference || (__cxx_static_address_c00c1c570119b540777ea549.reference = {
    __cReference: true,
    get value() { return SQUISHED____header_global_c2df66ec298b2390; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:85
export const TELEPORTER____header_global_397bf9ee14fae19b = ((((((70) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a0c0bffe0dff1bb647f6f26d() {
  return __cxx_static_address_a0c0bffe0dff1bb647f6f26d.reference || (__cxx_static_address_a0c0bffe0dff1bb647f6f26d.reference = {
    __cReference: true,
    get value() { return TELEPORTER____header_global_397bf9ee14fae19b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:86
export const ELEVATOR_ON____header_global_6285d93ad00735e3 = ((((((71) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eb2e0be47bc338b2eb0a71a5() {
  return __cxx_static_address_eb2e0be47bc338b2eb0a71a5.reference || (__cxx_static_address_eb2e0be47bc338b2eb0a71a5.reference = {
    __cReference: true,
    get value() { return ELEVATOR_ON____header_global_6285d93ad00735e3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:87
export const ELEVATOR_OFF____header_global_84d4876e671b2b2c = ((((((73) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3f7e510be75550eacf8fb30e() {
  return __cxx_static_address_3f7e510be75550eacf8fb30e.reference || (__cxx_static_address_3f7e510be75550eacf8fb30e.reference = {
    __cReference: true,
    get value() { return ELEVATOR_OFF____header_global_84d4876e671b2b2c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:88
export const SUBWAY____header_global_2715d0253881ee48 = ((((((75) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_419fd32e126147efaa6abc7f() {
  return __cxx_static_address_419fd32e126147efaa6abc7f.reference || (__cxx_static_address_419fd32e126147efaa6abc7f.reference = {
    __cReference: true,
    get value() { return SUBWAY____header_global_2715d0253881ee48; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:89
export const SWITCH_ON____header_global_722370c847b62a32 = ((((((76) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8cf135171340b94d616a6c1e() {
  return __cxx_static_address_8cf135171340b94d616a6c1e.reference || (__cxx_static_address_8cf135171340b94d616a6c1e.reference = {
    __cReference: true,
    get value() { return SWITCH_ON____header_global_722370c847b62a32; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:90
export const FLUSH_TOILET____header_global_5fea07d22cc22aa5 = ((((((79) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8ad8fa650ae8f366f8176043() {
  return __cxx_static_address_8ad8fa650ae8f366f8176043.reference || (__cxx_static_address_8ad8fa650ae8f366f8176043.reference = {
    __cReference: true,
    get value() { return FLUSH_TOILET____header_global_5fea07d22cc22aa5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:91
export const EARTHQUAKE____header_global_66da34a799f21c13 = ((((((81) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d2e5558a716e58da39f0e0e5() {
  return __cxx_static_address_d2e5558a716e58da39f0e0e5.reference || (__cxx_static_address_d2e5558a716e58da39f0e0e5.reference = {
    __cReference: true,
    get value() { return EARTHQUAKE____header_global_66da34a799f21c13; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:92
export const END_OF_LEVEL_WARN____header_global_80e08bb13df96eb5 = ((((((83) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7c1f60d54ea17c3e884fb381() {
  return __cxx_static_address_7c1f60d54ea17c3e884fb381.reference || (__cxx_static_address_7c1f60d54ea17c3e884fb381.reference = {
    __cReference: true,
    get value() { return END_OF_LEVEL_WARN____header_global_80e08bb13df96eb5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:93
export const WIND_AMBIENCE____header_global_38b0bb318fe43f15 = ((((((91) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fda76e4f4901de500fdeef52() {
  return __cxx_static_address_fda76e4f4901de500fdeef52.reference || (__cxx_static_address_fda76e4f4901de500fdeef52.reference = {
    __cReference: true,
    get value() { return WIND_AMBIENCE____header_global_38b0bb318fe43f15; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:94
export const SOMETHING_DRIPPING____header_global_b389ccee376c4842 = ((((((92) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2dacf9628c2eee8472b729b1() {
  return __cxx_static_address_2dacf9628c2eee8472b729b1.reference || (__cxx_static_address_2dacf9628c2eee8472b729b1.reference = {
    __cReference: true,
    get value() { return SOMETHING_DRIPPING____header_global_b389ccee376c4842; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:95
export const BOS1_RECOG____header_global_b95808b0282ccd78 = ((((((97) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5a65396079761f6c75069740() {
  return __cxx_static_address_5a65396079761f6c75069740.reference || (__cxx_static_address_5a65396079761f6c75069740.reference = {
    __cReference: true,
    get value() { return BOS1_RECOG____header_global_b95808b0282ccd78; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:96
export const BOS2_RECOG____header_global_677d1cf7dfd3d42b = ((((((102) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8a76d134db07966c5bfeeae2() {
  return __cxx_static_address_8a76d134db07966c5bfeeae2.reference || (__cxx_static_address_8a76d134db07966c5bfeeae2.reference = {
    __cReference: true,
    get value() { return BOS2_RECOG____header_global_677d1cf7dfd3d42b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:97
export const DUKE_GETWEAPON2____header_global_0292e900105cc6e9 = ((((((107) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e9c9cccde4734130d064a8ad() {
  return __cxx_static_address_e9c9cccde4734130d064a8ad.reference || (__cxx_static_address_e9c9cccde4734130d064a8ad.reference = {
    __cReference: true,
    get value() { return DUKE_GETWEAPON2____header_global_0292e900105cc6e9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:98
export const SHOTGUN_FIRE____header_global_8dddb1f946cf8b22 = ((((((109) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c700106ebbcc78ee328f5479() {
  return __cxx_static_address_c700106ebbcc78ee328f5479.reference || (__cxx_static_address_c700106ebbcc78ee328f5479.reference = {
    __cReference: true,
    get value() { return SHOTGUN_FIRE____header_global_8dddb1f946cf8b22; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:99
export const PRED_RECOG____header_global_6c1b9fcf33eec7d9 = ((((((111) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_47ed8da046d71a44cfccd9e7() {
  return __cxx_static_address_47ed8da046d71a44cfccd9e7.reference || (__cxx_static_address_47ed8da046d71a44cfccd9e7.reference = {
    __cReference: true,
    get value() { return PRED_RECOG____header_global_6c1b9fcf33eec7d9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:100
export const CAPT_RECOG____header_global_8ae0534441872cf8 = ((((((117) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_820468a8c583d77286e898a7() {
  return __cxx_static_address_820468a8c583d77286e898a7.reference || (__cxx_static_address_820468a8c583d77286e898a7.reference = {
    __cReference: true,
    get value() { return CAPT_RECOG____header_global_8ae0534441872cf8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:101
export const PIG_RECOG____header_global_5c1a803712b0cc5f = ((((((121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b0d90adaaa62a0a213ec46d0() {
  return __cxx_static_address_b0d90adaaa62a0a213ec46d0.reference || (__cxx_static_address_b0d90adaaa62a0a213ec46d0.reference = {
    __cReference: true,
    get value() { return PIG_RECOG____header_global_5c1a803712b0cc5f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:102
export const RECO_ROAM____header_global_88100479e172bf9e = ((((((125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dce46c879f954eb1bc276f83() {
  return __cxx_static_address_dce46c879f954eb1bc276f83.reference || (__cxx_static_address_dce46c879f954eb1bc276f83.reference = {
    __cReference: true,
    get value() { return RECO_ROAM____header_global_88100479e172bf9e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:103
export const RECO_RECOG____header_global_c7b13c59deb21285 = ((((((126) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5d55c7322a7989adf71e1277() {
  return __cxx_static_address_5d55c7322a7989adf71e1277.reference || (__cxx_static_address_5d55c7322a7989adf71e1277.reference = {
    __cReference: true,
    get value() { return RECO_RECOG____header_global_c7b13c59deb21285; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:104
export const RECO_ATTACK____header_global_de40629da21497f3 = ((((((127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3383bd01705f4610bd371f07() {
  return __cxx_static_address_3383bd01705f4610bd371f07.reference || (__cxx_static_address_3383bd01705f4610bd371f07.reference = {
    __cReference: true,
    get value() { return RECO_ATTACK____header_global_de40629da21497f3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:105
export const RECO_PAIN____header_global_31e15532793f268b = ((((((128) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_26b76d27ad6df1100085a5e8() {
  return __cxx_static_address_26b76d27ad6df1100085a5e8.reference || (__cxx_static_address_26b76d27ad6df1100085a5e8.reference = {
    __cReference: true,
    get value() { return RECO_PAIN____header_global_31e15532793f268b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:106
export const DRON_RECOG____header_global_736f28f3858d5a89 = ((((((131) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_740c56ebe8fbbf2464223072() {
  return __cxx_static_address_740c56ebe8fbbf2464223072.reference || (__cxx_static_address_740c56ebe8fbbf2464223072.reference = {
    __cReference: true,
    get value() { return DRON_RECOG____header_global_736f28f3858d5a89; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:107
export const COMM_RECOG____header_global_8f29fb2153a2bcd8 = ((((((136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_36722a33c5c0fb4c00ffb6a0() {
  return __cxx_static_address_36722a33c5c0fb4c00ffb6a0.reference || (__cxx_static_address_36722a33c5c0fb4c00ffb6a0.reference = {
    __cReference: true,
    get value() { return COMM_RECOG____header_global_8f29fb2153a2bcd8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:108
export const OCTA_RECOG____header_global_d2c0e62148bb8f09 = ((((((141) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_617850ab765c1571e277cc96() {
  return __cxx_static_address_617850ab765c1571e277cc96.reference || (__cxx_static_address_617850ab765c1571e277cc96.reference = {
    __cReference: true,
    get value() { return OCTA_RECOG____header_global_d2c0e62148bb8f09; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:109
export const TURR_RECOG____header_global_83cf74db45f2de31 = ((((((146) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cf6e65795b5f7970ba08e625() {
  return __cxx_static_address_cf6e65795b5f7970ba08e625.reference || (__cxx_static_address_cf6e65795b5f7970ba08e625.reference = {
    __cReference: true,
    get value() { return TURR_RECOG____header_global_83cf74db45f2de31; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:110
export const SLIM_DYING____header_global_3517ff46dba9a1e8 = ((((((149) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d100fdb54677c7b7da058a68() {
  return __cxx_static_address_d100fdb54677c7b7da058a68.reference || (__cxx_static_address_d100fdb54677c7b7da058a68.reference = {
    __cReference: true,
    get value() { return SLIM_DYING____header_global_3517ff46dba9a1e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:111
export const BOS3_RECOG____header_global_c5aecdf32e6d50e0 = ((((((151) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cc0dc0dac7c03e871db8a5d9() {
  return __cxx_static_address_cc0dc0dac7c03e871db8a5d9.reference || (__cxx_static_address_cc0dc0dac7c03e871db8a5d9.reference = {
    __cReference: true,
    get value() { return BOS3_RECOG____header_global_c5aecdf32e6d50e0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:112
export const BOS1_WALK____header_global_f4fabf95b24cdd95 = ((((((156) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_915c059cbe4866d2ad61687d() {
  return __cxx_static_address_915c059cbe4866d2ad61687d.reference || (__cxx_static_address_915c059cbe4866d2ad61687d.reference = {
    __cReference: true,
    get value() { return BOS1_WALK____header_global_f4fabf95b24cdd95; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:113
export const THUD____header_global_c3fd9c1b9f33556d = ((((((158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_04359c3a76371daa6bb684ac() {
  return __cxx_static_address_04359c3a76371daa6bb684ac.reference || (__cxx_static_address_04359c3a76371daa6bb684ac.reference = {
    __cReference: true,
    get value() { return THUD____header_global_c3fd9c1b9f33556d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:114
export const WIERDSHOT_FLY____header_global_41136d37a8ff43c4 = ((((((160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_17282a57dc347b3d3594701d() {
  return __cxx_static_address_17282a57dc347b3d3594701d.reference || (__cxx_static_address_17282a57dc347b3d3594701d.reference = {
    __cReference: true,
    get value() { return WIERDSHOT_FLY____header_global_41136d37a8ff43c4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:115
export const SLIM_ROAM____header_global_a595c0809baa8000 = ((((((163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f029ea2c21f9c1bbadbc704e() {
  return __cxx_static_address_f029ea2c21f9c1bbadbc704e.reference || (__cxx_static_address_f029ea2c21f9c1bbadbc704e.reference = {
    __cReference: true,
    get value() { return SLIM_ROAM____header_global_a595c0809baa8000; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:116
export const SHOTGUN_COCK____header_global_e527ffdc669abb05 = ((((((169) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f67621468026f17d0b17bb21() {
  return __cxx_static_address_f67621468026f17d0b17bb21.reference || (__cxx_static_address_f67621468026f17d0b17bb21.reference = {
    __cReference: true,
    get value() { return SHOTGUN_COCK____header_global_e527ffdc669abb05; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:117
export const GENERIC_AMBIENCE17____header_global_81c84583e290de32 = ((((((177) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_75d0f22a82b876707504caa8() {
  return __cxx_static_address_75d0f22a82b876707504caa8.reference || (__cxx_static_address_75d0f22a82b876707504caa8.reference = {
    __cReference: true,
    get value() { return GENERIC_AMBIENCE17____header_global_81c84583e290de32; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:118
export const BONUS_SPEECH1____header_global_8c43f6aa3a80e042 = ((((((195) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a6c0ea29b442ac2a087ba96d() {
  return __cxx_static_address_a6c0ea29b442ac2a087ba96d.reference || (__cxx_static_address_a6c0ea29b442ac2a087ba96d.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH1____header_global_8c43f6aa3a80e042; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:119
export const BONUS_SPEECH2____header_global_d69c946de67622b9 = ((((((196) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f4dd2b83daeac821d8b207a8() {
  return __cxx_static_address_f4dd2b83daeac821d8b207a8.reference || (__cxx_static_address_f4dd2b83daeac821d8b207a8.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH2____header_global_d69c946de67622b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:120
export const BONUS_SPEECH3____header_global_4e3572248d689f67 = ((((((197) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dddcf47d5025abf30a55dbc9() {
  return __cxx_static_address_dddcf47d5025abf30a55dbc9.reference || (__cxx_static_address_dddcf47d5025abf30a55dbc9.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH3____header_global_4e3572248d689f67; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:121
export const BONUS_SPEECH4____header_global_01bdeddd50d73880 = ((((((199) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fc2f069c5c774ea944653468() {
  return __cxx_static_address_fc2f069c5c774ea944653468.reference || (__cxx_static_address_fc2f069c5c774ea944653468.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH4____header_global_01bdeddd50d73880; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:122
export const DUKE_LAND_HURT____header_global_bc8f463fb8395de1 = ((((((200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_582cecc1b70618d185e3c90f() {
  return __cxx_static_address_582cecc1b70618d185e3c90f.reference || (__cxx_static_address_582cecc1b70618d185e3c90f.reference = {
    __cReference: true,
    get value() { return DUKE_LAND_HURT____header_global_bc8f463fb8395de1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:123
export const DUKE_SEARCH2____header_global_7859e4b1c6dfafe4 = ((((((207) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_04ee1d647ac35f1438f91da6() {
  return __cxx_static_address_04ee1d647ac35f1438f91da6.reference || (__cxx_static_address_04ee1d647ac35f1438f91da6.reference = {
    __cReference: true,
    get value() { return DUKE_SEARCH2____header_global_7859e4b1c6dfafe4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:124
export const DUKE_CRACK2____header_global_ef5b844b22b34c6d = ((((((208) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8e2255ae8f9e6888c08867a2() {
  return __cxx_static_address_8e2255ae8f9e6888c08867a2.reference || (__cxx_static_address_8e2255ae8f9e6888c08867a2.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK2____header_global_ef5b844b22b34c6d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:125
export const DUKE_SEARCH____header_global_8bcff01e7b1facf6 = ((((((209) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ccd3cf2d4cb09bd3359e3f01() {
  return __cxx_static_address_ccd3cf2d4cb09bd3359e3f01.reference || (__cxx_static_address_ccd3cf2d4cb09bd3359e3f01.reference = {
    __cReference: true,
    get value() { return DUKE_SEARCH____header_global_8bcff01e7b1facf6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:126
export const DUKE_GET____header_global_b079665424a96981 = ((((((210) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_01f9358735129c315a446557() {
  return __cxx_static_address_01f9358735129c315a446557.reference || (__cxx_static_address_01f9358735129c315a446557.reference = {
    __cReference: true,
    get value() { return DUKE_GET____header_global_b079665424a96981; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:127
export const DUKE_LONGTERM_PAIN____header_global_194f1c888a57ef6d = ((((((211) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0873dcd311b9a961d153f058() {
  return __cxx_static_address_0873dcd311b9a961d153f058.reference || (__cxx_static_address_0873dcd311b9a961d153f058.reference = {
    __cReference: true,
    get value() { return DUKE_LONGTERM_PAIN____header_global_194f1c888a57ef6d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:128
export const MONITOR_ACTIVE____header_global_c129eac8ac0d1905 = ((((((212) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ca0ace63c813a7c92fd66106() {
  return __cxx_static_address_ca0ace63c813a7c92fd66106.reference || (__cxx_static_address_ca0ace63c813a7c92fd66106.reference = {
    __cReference: true,
    get value() { return MONITOR_ACTIVE____header_global_c129eac8ac0d1905; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:129
export const NITEVISION_ONOFF____header_global_56d44f71f50fe53e = ((((((213) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ab99974ef5cfe9dde4403937() {
  return __cxx_static_address_ab99974ef5cfe9dde4403937.reference || (__cxx_static_address_ab99974ef5cfe9dde4403937.reference = {
    __cReference: true,
    get value() { return NITEVISION_ONOFF____header_global_56d44f71f50fe53e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:130
export const DUKE_CRACK_FIRST____header_global_30dead2f90e724c7 = ((((((215) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b7ca326046c4d2e5bbd19ef8() {
  return __cxx_static_address_b7ca326046c4d2e5bbd19ef8.reference || (__cxx_static_address_b7ca326046c4d2e5bbd19ef8.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK_FIRST____header_global_30dead2f90e724c7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:131
export const DUKE_USEMEDKIT____header_global_3dfbc68c6f79e578 = ((((((216) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2960697d3ee4d89e04f302c2() {
  return __cxx_static_address_2960697d3ee4d89e04f302c2.reference || (__cxx_static_address_2960697d3ee4d89e04f302c2.reference = {
    __cReference: true,
    get value() { return DUKE_USEMEDKIT____header_global_3dfbc68c6f79e578; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:132
export const DUKE_TAKEPILLS____header_global_c3e14f2aa16cc45a = ((((((217) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1ec045904305bc3f5cfe84c2() {
  return __cxx_static_address_1ec045904305bc3f5cfe84c2.reference || (__cxx_static_address_1ec045904305bc3f5cfe84c2.reference = {
    __cReference: true,
    get value() { return DUKE_TAKEPILLS____header_global_c3e14f2aa16cc45a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:133
export const DUKE_PISSRELIEF____header_global_58c3a42ebc0892b3 = ((((((218) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9a1fed9cec2aa77b6599144e() {
  return __cxx_static_address_9a1fed9cec2aa77b6599144e.reference || (__cxx_static_address_9a1fed9cec2aa77b6599144e.reference = {
    __cReference: true,
    get value() { return DUKE_PISSRELIEF____header_global_58c3a42ebc0892b3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:134
export const SELECT_WEAPON____header_global_48e25dd40cc0bb8a = ((((((219) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4afb4e75697efcc7111c44c7() {
  return __cxx_static_address_4afb4e75697efcc7111c44c7.reference || (__cxx_static_address_4afb4e75697efcc7111c44c7.reference = {
    __cReference: true,
    get value() { return SELECT_WEAPON____header_global_48e25dd40cc0bb8a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:135
export const JIBBED_ACTOR5____header_global_c869856a563218a1 = ((((((226) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_162c5d239b75267aa6929e1b() {
  return __cxx_static_address_162c5d239b75267aa6929e1b.reference || (__cxx_static_address_162c5d239b75267aa6929e1b.reference = {
    __cReference: true,
    get value() { return JIBBED_ACTOR5____header_global_c869856a563218a1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:136
export const JIBBED_ACTOR6____header_global_555f68c3ac145bf9 = ((((((227) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9f68ee11d19434b4e3660012() {
  return __cxx_static_address_9f68ee11d19434b4e3660012.reference || (__cxx_static_address_9f68ee11d19434b4e3660012.reference = {
    __cReference: true,
    get value() { return JIBBED_ACTOR6____header_global_555f68c3ac145bf9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:137
export const DUKE_GOTHEALTHATLOW____header_global_f9f08190985295b5 = ((((((229) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_86e658a7edb726b60ffe3918() {
  return __cxx_static_address_86e658a7edb726b60ffe3918.reference || (__cxx_static_address_86e658a7edb726b60ffe3918.reference = {
    __cReference: true,
    get value() { return DUKE_GOTHEALTHATLOW____header_global_f9f08190985295b5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:138
export const BOSSTALKTODUKE____header_global_c4ac379b9e5a646f = ((((((230) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ecc59c6860247db7892f7f51() {
  return __cxx_static_address_ecc59c6860247db7892f7f51.reference || (__cxx_static_address_ecc59c6860247db7892f7f51.reference = {
    __cReference: true,
    get value() { return BOSSTALKTODUKE____header_global_c4ac379b9e5a646f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:139
export const WAR_AMBIENCE2____header_global_2ac0ef9969fb6505 = ((((((232) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_69a0b85966f2726d2a58e25f() {
  return __cxx_static_address_69a0b85966f2726d2a58e25f.reference || (__cxx_static_address_69a0b85966f2726d2a58e25f.reference = {
    __cReference: true,
    get value() { return WAR_AMBIENCE2____header_global_2ac0ef9969fb6505; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:140
export const EXITMENUSOUND____header_global_eae9ea66ae800123 = ((((((243) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4efa2f78d63f78161daa8576() {
  return __cxx_static_address_4efa2f78d63f78161daa8576.reference || (__cxx_static_address_4efa2f78d63f78161daa8576.reference = {
    __cReference: true,
    get value() { return EXITMENUSOUND____header_global_eae9ea66ae800123; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:141
export const FLY_BY____header_global_4099354d4ee69271 = ((((((244) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7079c41e8b89bc6cd9265ada() {
  return __cxx_static_address_7079c41e8b89bc6cd9265ada.reference || (__cxx_static_address_7079c41e8b89bc6cd9265ada.reference = {
    __cReference: true,
    get value() { return FLY_BY____header_global_4099354d4ee69271; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:142
export const DUKE_SCREAM____header_global_f4151be205ffa94c = ((((((245) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7770a761171f33e2b5d986ab() {
  return __cxx_static_address_7770a761171f33e2b5d986ab.reference || (__cxx_static_address_7770a761171f33e2b5d986ab.reference = {
    __cReference: true,
    get value() { return DUKE_SCREAM____header_global_f4151be205ffa94c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:143
export const SHRINKER_HIT____header_global_496ada6e2286b5f4 = ((((((246) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b25fd3322d3cc74682e16eaf() {
  return __cxx_static_address_b25fd3322d3cc74682e16eaf.reference || (__cxx_static_address_b25fd3322d3cc74682e16eaf.reference = {
    __cReference: true,
    get value() { return SHRINKER_HIT____header_global_496ada6e2286b5f4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:144
export const RATTY____header_global_a74e22e7b149d381 = ((((((247) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2073abc77fbec607c3cd49bc() {
  return __cxx_static_address_2073abc77fbec607c3cd49bc.reference || (__cxx_static_address_2073abc77fbec607c3cd49bc.reference = {
    __cReference: true,
    get value() { return RATTY____header_global_a74e22e7b149d381; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:145
export const BONUSMUSIC____header_global_aa95cba68dec4fb0 = ((((((249) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d309dedd9c2dbae91ec123b2() {
  return __cxx_static_address_d309dedd9c2dbae91ec123b2.reference || (__cxx_static_address_d309dedd9c2dbae91ec123b2.reference = {
    __cReference: true,
    get value() { return BONUSMUSIC____header_global_aa95cba68dec4fb0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:146
export const DUKE_GETWEAPON6____header_global_61a8e3d7e2f8ed60 = ((((((264) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d6b52bcd4383373b765b7791() {
  return __cxx_static_address_d6b52bcd4383373b765b7791.reference || (__cxx_static_address_d6b52bcd4383373b765b7791.reference = {
    __cReference: true,
    get value() { return DUKE_GETWEAPON6____header_global_61a8e3d7e2f8ed60; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:147
export const ALIEN_SWITCH1____header_global_e0f1ea842f6a2da1 = ((((((272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eebae341e12e756cf46d0084() {
  return __cxx_static_address_eebae341e12e756cf46d0084.reference || (__cxx_static_address_eebae341e12e756cf46d0084.reference = {
    __cReference: true,
    get value() { return ALIEN_SWITCH1____header_global_e0f1ea842f6a2da1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:148
export const RIPHEADNECK____header_global_590ad169e9ce8496 = ((((((284) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ea61241c472f0901a0539264() {
  return __cxx_static_address_ea61241c472f0901a0539264.reference || (__cxx_static_address_ea61241c472f0901a0539264.reference = {
    __cReference: true,
    get value() { return RIPHEADNECK____header_global_590ad169e9ce8496; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:149
export const ENDSEQVOL3SND4____header_global_a700b720803aa985 = ((((((288) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_75bea718b6f89f5b9c234f4d() {
  return __cxx_static_address_75bea718b6f89f5b9c234f4d.reference || (__cxx_static_address_75bea718b6f89f5b9c234f4d.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND4____header_global_a700b720803aa985; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:150
export const ENDSEQVOL3SND5____header_global_7dc1e54b5cd715b6 = ((((((289) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e19297d3632d92164a9a1161() {
  return __cxx_static_address_e19297d3632d92164a9a1161.reference || (__cxx_static_address_e19297d3632d92164a9a1161.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND5____header_global_7dc1e54b5cd715b6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:151
export const ENDSEQVOL3SND6____header_global_e24ae799e383b389 = ((((((290) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a73654ea6fd58956faab4acc() {
  return __cxx_static_address_a73654ea6fd58956faab4acc.reference || (__cxx_static_address_a73654ea6fd58956faab4acc.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND6____header_global_e24ae799e383b389; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:152
export const ENDSEQVOL3SND7____header_global_eb64751efe78b0d4 = ((((((291) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4d29bd06a960609a33061d55() {
  return __cxx_static_address_4d29bd06a960609a33061d55.reference || (__cxx_static_address_4d29bd06a960609a33061d55.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND7____header_global_eb64751efe78b0d4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:153
export const ENDSEQVOL3SND8____header_global_46eebe7e8ee75ed4 = ((((((292) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3a2ee85c2fcfd1c70926d965() {
  return __cxx_static_address_3a2ee85c2fcfd1c70926d965.reference || (__cxx_static_address_3a2ee85c2fcfd1c70926d965.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND8____header_global_46eebe7e8ee75ed4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:154
export const ENDSEQVOL3SND9____header_global_be7be594d790e8e1 = ((((((293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6cfc4a88f3178a7690b3a7e1() {
  return __cxx_static_address_6cfc4a88f3178a7690b3a7e1.reference || (__cxx_static_address_6cfc4a88f3178a7690b3a7e1.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND9____header_global_be7be594d790e8e1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:155
export const WHIPYOURASS____header_global_2625b4184e94cf00 = ((((((294) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3eac757a1bcad5c1e2230d74() {
  return __cxx_static_address_3eac757a1bcad5c1e2230d74.reference || (__cxx_static_address_3eac757a1bcad5c1e2230d74.reference = {
    __cReference: true,
    get value() { return WHIPYOURASS____header_global_2625b4184e94cf00; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:156
export const ENDSEQVOL2SND1____header_global_c5769eeca300af1e = ((((((295) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_67bf908b58587dd0fec7c9b7() {
  return __cxx_static_address_67bf908b58587dd0fec7c9b7.reference || (__cxx_static_address_67bf908b58587dd0fec7c9b7.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND1____header_global_c5769eeca300af1e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:157
export const ENDSEQVOL2SND2____header_global_480f4d8bbfb0116d = ((((((296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6e2056c6d9735da6b84b5151() {
  return __cxx_static_address_6e2056c6d9735da6b84b5151.reference || (__cxx_static_address_6e2056c6d9735da6b84b5151.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND2____header_global_480f4d8bbfb0116d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:158
export const ENDSEQVOL2SND3____header_global_719a98523d7862cf = ((((((297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_95cb736321fc0414bbc1463e() {
  return __cxx_static_address_95cb736321fc0414bbc1463e.reference || (__cxx_static_address_95cb736321fc0414bbc1463e.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND3____header_global_719a98523d7862cf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:159
export const ENDSEQVOL2SND4____header_global_15e8f81144807f58 = ((((((298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_faaecf8c307e88caef3b9a4e() {
  return __cxx_static_address_faaecf8c307e88caef3b9a4e.reference || (__cxx_static_address_faaecf8c307e88caef3b9a4e.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND4____header_global_15e8f81144807f58; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:160
export const ENDSEQVOL2SND5____header_global_4ca5673e102b96b4 = ((((((299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4c6d9a940463d5b35cf75311() {
  return __cxx_static_address_4c6d9a940463d5b35cf75311.reference || (__cxx_static_address_4c6d9a940463d5b35cf75311.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND5____header_global_4ca5673e102b96b4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:161
export const ENDSEQVOL2SND6____header_global_96cf33c75cb06a4e = ((((((300) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3e607c90151f8232dbc4d1dd() {
  return __cxx_static_address_3e607c90151f8232dbc4d1dd.reference || (__cxx_static_address_3e607c90151f8232dbc4d1dd.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND6____header_global_96cf33c75cb06a4e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:162
export const ENDSEQVOL2SND7____header_global_ec06e5dc73122447 = ((((((301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dc702a7a92b25ff2deb1e384() {
  return __cxx_static_address_dc702a7a92b25ff2deb1e384.reference || (__cxx_static_address_dc702a7a92b25ff2deb1e384.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND7____header_global_ec06e5dc73122447; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:163
export const SOMETHINGFROZE____header_global_7eb184b245ccc718 = ((((((303) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_518f15eab25f76e4c5264930() {
  return __cxx_static_address_518f15eab25f76e4c5264930.reference || (__cxx_static_address_518f15eab25f76e4c5264930.reference = {
    __cReference: true,
    get value() { return SOMETHINGFROZE____header_global_7eb184b245ccc718; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:164
export const WIND_REPEAT____header_global_e0abdf5b9965ad16 = ((((((308) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_be2adda57a1b40bcd6255640() {
  return __cxx_static_address_be2adda57a1b40bcd6255640.reference || (__cxx_static_address_be2adda57a1b40bcd6255640.reference = {
    __cReference: true,
    get value() { return WIND_REPEAT____header_global_e0abdf5b9965ad16; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:165
export const BOS4_RECOG____header_global_d6f42af9143515b5 = ((((((342) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_23cbbb3e4a192ce18ed762d9() {
  return __cxx_static_address_23cbbb3e4a192ce18ed762d9.reference || (__cxx_static_address_23cbbb3e4a192ce18ed762d9.reference = {
    __cReference: true,
    get value() { return BOS4_RECOG____header_global_d6f42af9143515b5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:166
export const LIGHTNING_SLAP____header_global_6dd74c190dc0c0e3 = ((((((351) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2ac1f75a72c95b3d1eda4ef3() {
  return __cxx_static_address_2ac1f75a72c95b3d1eda4ef3.reference || (__cxx_static_address_2ac1f75a72c95b3d1eda4ef3.reference = {
    __cReference: true,
    get value() { return LIGHTNING_SLAP____header_global_6dd74c190dc0c0e3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:167
export const THUNDER____header_global_e6e2fe65480825b8 = ((((((352) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3565f669e596bc15f4018cb2() {
  return __cxx_static_address_3565f669e596bc15f4018cb2.reference || (__cxx_static_address_3565f669e596bc15f4018cb2.reference = {
    __cReference: true,
    get value() { return THUNDER____header_global_e6e2fe65480825b8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:168
export const INTRO4_1____header_global_ce98e25e1361d12c = ((((((363) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0b6a4df65034cd03490090c0() {
  return __cxx_static_address_0b6a4df65034cd03490090c0.reference || (__cxx_static_address_0b6a4df65034cd03490090c0.reference = {
    __cReference: true,
    get value() { return INTRO4_1____header_global_ce98e25e1361d12c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:169
export const INTRO4_2____header_global_78dc6ddb5a0945f7 = ((((((364) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0860c762c4406077fd10cacf() {
  return __cxx_static_address_0860c762c4406077fd10cacf.reference || (__cxx_static_address_0860c762c4406077fd10cacf.reference = {
    __cReference: true,
    get value() { return INTRO4_2____header_global_78dc6ddb5a0945f7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:170
export const INTRO4_3____header_global_780215617f1b40bc = ((((((365) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2d05ca5670ccf4ae90c01d34() {
  return __cxx_static_address_2d05ca5670ccf4ae90c01d34.reference || (__cxx_static_address_2d05ca5670ccf4ae90c01d34.reference = {
    __cReference: true,
    get value() { return INTRO4_3____header_global_780215617f1b40bc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:171
export const INTRO4_4____header_global_9127bdeb27b1735b = ((((((366) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_657281ac21aa7cc985ba3837() {
  return __cxx_static_address_657281ac21aa7cc985ba3837.reference || (__cxx_static_address_657281ac21aa7cc985ba3837.reference = {
    __cReference: true,
    get value() { return INTRO4_4____header_global_9127bdeb27b1735b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:172
export const INTRO4_5____header_global_fa9c781c8b0eed68 = ((((((367) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6fbecd3f5ddace193aacb035() {
  return __cxx_static_address_6fbecd3f5ddace193aacb035.reference || (__cxx_static_address_6fbecd3f5ddace193aacb035.reference = {
    __cReference: true,
    get value() { return INTRO4_5____header_global_fa9c781c8b0eed68; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:173
export const INTRO4_6____header_global_1d810f8a6d308eea = ((((((368) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_05dff91f02c5d4dfa7d4a1f3() {
  return __cxx_static_address_05dff91f02c5d4dfa7d4a1f3.reference || (__cxx_static_address_05dff91f02c5d4dfa7d4a1f3.reference = {
    __cReference: true,
    get value() { return INTRO4_6____header_global_1d810f8a6d308eea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:174
export const BOSS4_DEADSPEECH____header_global_893c084a43470dc1 = ((((((370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_63190c867d71c79a86b85886() {
  return __cxx_static_address_63190c867d71c79a86b85886.reference || (__cxx_static_address_63190c867d71c79a86b85886.reference = {
    __cReference: true,
    get value() { return BOSS4_DEADSPEECH____header_global_893c084a43470dc1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:175
export const BOSS4_FIRSTSEE____header_global_d535b130db16610e = ((((((371) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ed1414c4c7eb6674d84378e0() {
  return __cxx_static_address_ed1414c4c7eb6674d84378e0.reference || (__cxx_static_address_ed1414c4c7eb6674d84378e0.reference = {
    __cReference: true,
    get value() { return BOSS4_FIRSTSEE____header_global_d535b130db16610e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:176
export const VOL4ENDSND1____header_global_966d509800da866d = ((((((384) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_32289cc8fcb1b90253fcf355() {
  return __cxx_static_address_32289cc8fcb1b90253fcf355.reference || (__cxx_static_address_32289cc8fcb1b90253fcf355.reference = {
    __cReference: true,
    get value() { return VOL4ENDSND1____header_global_966d509800da866d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:177
export const VOL4ENDSND2____header_global_27514d87b52a15b3 = ((((((385) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a5707f12bf312623787ff034() {
  return __cxx_static_address_a5707f12bf312623787ff034.reference || (__cxx_static_address_a5707f12bf312623787ff034.reference = {
    __cReference: true,
    get value() { return VOL4ENDSND2____header_global_27514d87b52a15b3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:178
export const EXPANDERSHOOT____header_global_712d095ac6bdf05b = ((((((388) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5f8c904e319f0624e41cb1e3() {
  return __cxx_static_address_5f8c904e319f0624e41cb1e3.reference || (__cxx_static_address_5f8c904e319f0624e41cb1e3.reference = {
    __cReference: true,
    get value() { return EXPANDERSHOOT____header_global_712d095ac6bdf05b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:179
export const INTRO4_B____header_global_e5fdb69752d30550 = ((((((392) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_006ffbd45d8412242ef218a4() {
  return __cxx_static_address_006ffbd45d8412242ef218a4.reference || (__cxx_static_address_006ffbd45d8412242ef218a4.reference = {
    __cReference: true,
    get value() { return INTRO4_B____header_global_e5fdb69752d30550; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:180
export const BIGBANG____header_global_621253bdb0d568e6 = ((((((393) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e68e55651a5cd532adbe0a0() {
  return __cxx_static_address_1e68e55651a5cd532adbe0a0.reference || (__cxx_static_address_1e68e55651a5cd532adbe0a0.reference = {
    __cReference: true,
    get value() { return BIGBANG____header_global_621253bdb0d568e6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:181
export const FLAMETHROWER_INTRO____header_global_ca96c1f8cd3314a8 = ((((((398) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_27a7a815a0a33bc5f4615b4c() {
  return __cxx_static_address_27a7a815a0a33bc5f4615b4c.reference || (__cxx_static_address_27a7a815a0a33bc5f4615b4c.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_INTRO____header_global_ca96c1f8cd3314a8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:182
export const FLAMETHROWER_LOOP____header_global_2a744a1dda7dd640 = ((((((399) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_49c1b3a6c294e48d37ec1e63() {
  return __cxx_static_address_49c1b3a6c294e48d37ec1e63.reference || (__cxx_static_address_49c1b3a6c294e48d37ec1e63.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_LOOP____header_global_2a744a1dda7dd640; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:183
export const FLAMETHROWER_END____header_global_03f9a6692869bf44 = ((((((400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d737437707c0a977d6af619f() {
  return __cxx_static_address_d737437707c0a977d6af619f.reference || (__cxx_static_address_d737437707c0a977d6af619f.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_END____header_global_03f9a6692869bf44; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:184
export const E5L7_DUKE_QUIT_YOU____header_global_2e06c6ff01d02bd8 = ((((((401) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0be940981c69a70356eeeb64() {
  return __cxx_static_address_0be940981c69a70356eeeb64.reference || (__cxx_static_address_0be940981c69a70356eeeb64.reference = {
    __cReference: true,
    get value() { return E5L7_DUKE_QUIT_YOU____header_global_2e06c6ff01d02bd8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:187
export const SECTOREFFECTOR____header_global_c86077995e97d4ce = ((((((1) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2b6b7b1947c851fa735d3f43() {
  return __cxx_static_address_2b6b7b1947c851fa735d3f43.reference || (__cxx_static_address_2b6b7b1947c851fa735d3f43.reference = {
    __cReference: true,
    get value() { return SECTOREFFECTOR____header_global_c86077995e97d4ce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:188
export const ACTIVATOR____header_global_a652496d8758363b = ((((((2) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_172b00f66f66f6eebb744e56() {
  return __cxx_static_address_172b00f66f66f6eebb744e56.reference || (__cxx_static_address_172b00f66f66f6eebb744e56.reference = {
    __cReference: true,
    get value() { return ACTIVATOR____header_global_a652496d8758363b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:189
export const TOUCHPLATE____header_global_9515b097b5fb69a6 = ((((((3) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_246c2876f9b9274b470410fe() {
  return __cxx_static_address_246c2876f9b9274b470410fe.reference || (__cxx_static_address_246c2876f9b9274b470410fe.reference = {
    __cReference: true,
    get value() { return TOUCHPLATE____header_global_9515b097b5fb69a6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:190
export const ACTIVATORLOCKED____header_global_2be2675c296ec236 = ((((((4) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_da5286d8d5789647069684ac() {
  return __cxx_static_address_da5286d8d5789647069684ac.reference || (__cxx_static_address_da5286d8d5789647069684ac.reference = {
    __cReference: true,
    get value() { return ACTIVATORLOCKED____header_global_2be2675c296ec236; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:191
export const MUSICANDSFX____header_global_0aab3be93f3c5c3e = ((((((5) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_83919ec285a45cffd341c642() {
  return __cxx_static_address_83919ec285a45cffd341c642.reference || (__cxx_static_address_83919ec285a45cffd341c642.reference = {
    __cReference: true,
    get value() { return MUSICANDSFX____header_global_0aab3be93f3c5c3e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:192
export const LOCATORS____header_global_64d3925899d1fe6d = ((((((6) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b34e52af66c84691d6665a27() {
  return __cxx_static_address_b34e52af66c84691d6665a27.reference || (__cxx_static_address_b34e52af66c84691d6665a27.reference = {
    __cReference: true,
    get value() { return LOCATORS____header_global_64d3925899d1fe6d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:193
export const CYCLER____header_global_e7eee67538604d42 = ((((((7) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4b821feae7ad420b73f6a883() {
  return __cxx_static_address_4b821feae7ad420b73f6a883.reference || (__cxx_static_address_4b821feae7ad420b73f6a883.reference = {
    __cReference: true,
    get value() { return CYCLER____header_global_e7eee67538604d42; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:194
export const MASTERSWITCH____header_global_69cbe7de6d6dace2 = ((((((8) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_928125364795799dafc818af() {
  return __cxx_static_address_928125364795799dafc818af.reference || (__cxx_static_address_928125364795799dafc818af.reference = {
    __cReference: true,
    get value() { return MASTERSWITCH____header_global_69cbe7de6d6dace2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:195
export const RESPAWN____header_global_46a74c1785b40e29 = ((((((9) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d04771b0924cd044dd7121f0() {
  return __cxx_static_address_d04771b0924cd044dd7121f0.reference || (__cxx_static_address_d04771b0924cd044dd7121f0.reference = {
    __cReference: true,
    get value() { return RESPAWN____header_global_46a74c1785b40e29; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:196
export const GPSPEED____header_global_147d3607a125e3b1 = ((((((10) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ddb274ee5ec338cb20f371df() {
  return __cxx_static_address_ddb274ee5ec338cb20f371df.reference || (__cxx_static_address_ddb274ee5ec338cb20f371df.reference = {
    __cReference: true,
    get value() { return GPSPEED____header_global_147d3607a125e3b1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:197
export const FOF____header_global_6cec00dfa859065d = ((((((13) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b5423c57ad004788cc969555() {
  return __cxx_static_address_b5423c57ad004788cc969555.reference || (__cxx_static_address_b5423c57ad004788cc969555.reference = {
    __cReference: true,
    get value() { return FOF____header_global_6cec00dfa859065d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:198
export const ARROW____header_global_31ce536f25a52c1f = ((((((20) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c1b5be18afe0903f3f8f745e() {
  return __cxx_static_address_c1b5be18afe0903f3f8f745e.reference || (__cxx_static_address_c1b5be18afe0903f3f8f745e.reference = {
    __cReference: true,
    get value() { return ARROW____header_global_31ce536f25a52c1f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:199
export const FIRSTGUNSPRITE____header_global_d85c35928cb9c06a = ((((((21) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4a7bd58257bf0a0ed1b30e77() {
  return __cxx_static_address_4a7bd58257bf0a0ed1b30e77.reference || (__cxx_static_address_4a7bd58257bf0a0ed1b30e77.reference = {
    __cReference: true,
    get value() { return FIRSTGUNSPRITE____header_global_d85c35928cb9c06a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:200
export const CHAINGUNSPRITE____header_global_e54e9886feb497b5 = ((((((22) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fea6244b614e27cca8437f99() {
  return __cxx_static_address_fea6244b614e27cca8437f99.reference || (__cxx_static_address_fea6244b614e27cca8437f99.reference = {
    __cReference: true,
    get value() { return CHAINGUNSPRITE____header_global_e54e9886feb497b5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:201
export const RPGSPRITE____header_global_2b1627cbd66fde79 = ((((((23) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_37a0b7092f7ae664300a7ffa() {
  return __cxx_static_address_37a0b7092f7ae664300a7ffa.reference || (__cxx_static_address_37a0b7092f7ae664300a7ffa.reference = {
    __cReference: true,
    get value() { return RPGSPRITE____header_global_2b1627cbd66fde79; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:202
export const FREEZESPRITE____header_global_c55d1fd57866f81d = ((((((24) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9e85fa3c9a96b01470ee7d3d() {
  return __cxx_static_address_9e85fa3c9a96b01470ee7d3d.reference || (__cxx_static_address_9e85fa3c9a96b01470ee7d3d.reference = {
    __cReference: true,
    get value() { return FREEZESPRITE____header_global_c55d1fd57866f81d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:203
export const SHRINKERSPRITE____header_global_2184a8b54bb50c73 = ((((((25) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3829ce6dcd15096da8664413() {
  return __cxx_static_address_3829ce6dcd15096da8664413.reference || (__cxx_static_address_3829ce6dcd15096da8664413.reference = {
    __cReference: true,
    get value() { return SHRINKERSPRITE____header_global_2184a8b54bb50c73; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:204
export const HEAVYHBOMB____header_global_5def86a29361947b = ((((((26) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c31eedb0ca9991636a76a048() {
  return __cxx_static_address_c31eedb0ca9991636a76a048.reference || (__cxx_static_address_c31eedb0ca9991636a76a048.reference = {
    __cReference: true,
    get value() { return HEAVYHBOMB____header_global_5def86a29361947b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:205
export const TRIPBOMBSPRITE____header_global_3b441400dbddecb2 = ((((((27) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e39cb10f51e27928c32c79ee() {
  return __cxx_static_address_e39cb10f51e27928c32c79ee.reference || (__cxx_static_address_e39cb10f51e27928c32c79ee.reference = {
    __cReference: true,
    get value() { return TRIPBOMBSPRITE____header_global_3b441400dbddecb2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:206
export const SHOTGUNSPRITE____header_global_85a8574664beff26 = ((((((28) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_84393f1d2589748af4180be4() {
  return __cxx_static_address_84393f1d2589748af4180be4.reference || (__cxx_static_address_84393f1d2589748af4180be4.reference = {
    __cReference: true,
    get value() { return SHOTGUNSPRITE____header_global_85a8574664beff26; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:207
export const DEVISTATORSPRITE____header_global_599582de6db3cb83 = ((((((29) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a7a57cc41598339af1d2eca3() {
  return __cxx_static_address_a7a57cc41598339af1d2eca3.reference || (__cxx_static_address_a7a57cc41598339af1d2eca3.reference = {
    __cReference: true,
    get value() { return DEVISTATORSPRITE____header_global_599582de6db3cb83; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:208
export const HEALTHBOX____header_global_21e93590644a2031 = ((((((30) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b1a35e1a1acf4f6827ee803f() {
  return __cxx_static_address_b1a35e1a1acf4f6827ee803f.reference || (__cxx_static_address_b1a35e1a1acf4f6827ee803f.reference = {
    __cReference: true,
    get value() { return HEALTHBOX____header_global_21e93590644a2031; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:209
export const AMMOBOX____header_global_a92f1ff16ca38dd7 = ((((((31) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b99d216b0d91f96a640fe048() {
  return __cxx_static_address_b99d216b0d91f96a640fe048.reference || (__cxx_static_address_b99d216b0d91f96a640fe048.reference = {
    __cReference: true,
    get value() { return AMMOBOX____header_global_a92f1ff16ca38dd7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:210
export const GROWSPRITEICON____header_global_c3c6a767e3406af2 = ((((((32) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8954ddb159b6996119ff4b1a() {
  return __cxx_static_address_8954ddb159b6996119ff4b1a.reference || (__cxx_static_address_8954ddb159b6996119ff4b1a.reference = {
    __cReference: true,
    get value() { return GROWSPRITEICON____header_global_c3c6a767e3406af2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:211
export const INVENTORYBOX____header_global_830fab5137b009c5 = ((((((33) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_30370ff28897cbdb2201537b() {
  return __cxx_static_address_30370ff28897cbdb2201537b.reference || (__cxx_static_address_30370ff28897cbdb2201537b.reference = {
    __cReference: true,
    get value() { return INVENTORYBOX____header_global_830fab5137b009c5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:212
export const FREEZEAMMO____header_global_4689ae4a516d45da = ((((((37) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4db700ee5b785c5aea05b3cc() {
  return __cxx_static_address_4db700ee5b785c5aea05b3cc.reference || (__cxx_static_address_4db700ee5b785c5aea05b3cc.reference = {
    __cReference: true,
    get value() { return FREEZEAMMO____header_global_4689ae4a516d45da; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:213
export const AMMO____header_global_a84299a027eb21bf = ((((((40) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3e402a3d0fef1427e4408372() {
  return __cxx_static_address_3e402a3d0fef1427e4408372.reference || (__cxx_static_address_3e402a3d0fef1427e4408372.reference = {
    __cReference: true,
    get value() { return AMMO____header_global_a84299a027eb21bf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:214
export const BATTERYAMMO____header_global_b314a89ddcd9890c = ((((((41) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_49eb6847cdb0272b44ab6fe6() {
  return __cxx_static_address_49eb6847cdb0272b44ab6fe6.reference || (__cxx_static_address_49eb6847cdb0272b44ab6fe6.reference = {
    __cReference: true,
    get value() { return BATTERYAMMO____header_global_b314a89ddcd9890c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:215
export const DEVISTATORAMMO____header_global_49a32c982484046b = ((((((42) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8f7d10baa0ae25206425f03b() {
  return __cxx_static_address_8f7d10baa0ae25206425f03b.reference || (__cxx_static_address_8f7d10baa0ae25206425f03b.reference = {
    __cReference: true,
    get value() { return DEVISTATORAMMO____header_global_49a32c982484046b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:216
export const RPGAMMO____header_global_b7dbac0cfe38bb5c = ((((((44) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_01a0840bf60fea43eb9bc394() {
  return __cxx_static_address_01a0840bf60fea43eb9bc394.reference || (__cxx_static_address_01a0840bf60fea43eb9bc394.reference = {
    __cReference: true,
    get value() { return RPGAMMO____header_global_b7dbac0cfe38bb5c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:217
export const GROWAMMO____header_global_1e23856ac079c291 = ((((((45) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2ec30ec32609665184a1de45() {
  return __cxx_static_address_2ec30ec32609665184a1de45.reference || (__cxx_static_address_2ec30ec32609665184a1de45.reference = {
    __cReference: true,
    get value() { return GROWAMMO____header_global_1e23856ac079c291; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:218
export const CRYSTALAMMO____header_global_dbd83be1e57b6e90 = ((((((46) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_159cbff4e7a71edae0090d66() {
  return __cxx_static_address_159cbff4e7a71edae0090d66.reference || (__cxx_static_address_159cbff4e7a71edae0090d66.reference = {
    __cReference: true,
    get value() { return CRYSTALAMMO____header_global_dbd83be1e57b6e90; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:219
export const HBOMBAMMO____header_global_821acb1abd58ddce = ((((((47) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_043a63a4f3149189b1471537() {
  return __cxx_static_address_043a63a4f3149189b1471537.reference || (__cxx_static_address_043a63a4f3149189b1471537.reference = {
    __cReference: true,
    get value() { return HBOMBAMMO____header_global_821acb1abd58ddce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:220
export const AMMOLOTS____header_global_ea1d7db84804b8c3 = ((((((48) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_19fa8572504910e07b324d89() {
  return __cxx_static_address_19fa8572504910e07b324d89.reference || (__cxx_static_address_19fa8572504910e07b324d89.reference = {
    __cReference: true,
    get value() { return AMMOLOTS____header_global_ea1d7db84804b8c3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:221
export const SHOTGUNAMMO____header_global_c1f30d4d1fe6f6c8 = ((((((49) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bf659c80bf13aae2aa743c5d() {
  return __cxx_static_address_bf659c80bf13aae2aa743c5d.reference || (__cxx_static_address_bf659c80bf13aae2aa743c5d.reference = {
    __cReference: true,
    get value() { return SHOTGUNAMMO____header_global_c1f30d4d1fe6f6c8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:222
export const COLA____header_global_840ce157a57fe188 = ((((((51) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_36bfa2fd78fa8ee7026e638c() {
  return __cxx_static_address_36bfa2fd78fa8ee7026e638c.reference || (__cxx_static_address_36bfa2fd78fa8ee7026e638c.reference = {
    __cReference: true,
    get value() { return COLA____header_global_840ce157a57fe188; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:223
export const SIXPAK____header_global_7bfc0defc23e34a0 = ((((((52) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d3772ca4adfeafca0f017968() {
  return __cxx_static_address_d3772ca4adfeafca0f017968.reference || (__cxx_static_address_d3772ca4adfeafca0f017968.reference = {
    __cReference: true,
    get value() { return SIXPAK____header_global_7bfc0defc23e34a0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:224
export const FIRSTAID____header_global_28c455deb5af1cb4 = ((((((53) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_800b2180425e3c11423d229d() {
  return __cxx_static_address_800b2180425e3c11423d229d.reference || (__cxx_static_address_800b2180425e3c11423d229d.reference = {
    __cReference: true,
    get value() { return FIRSTAID____header_global_28c455deb5af1cb4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:225
export const SHIELD____header_global_0917c197d37c7f7f = ((((((54) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aba9bbc023b2930e041dc642() {
  return __cxx_static_address_aba9bbc023b2930e041dc642.reference || (__cxx_static_address_aba9bbc023b2930e041dc642.reference = {
    __cReference: true,
    get value() { return SHIELD____header_global_0917c197d37c7f7f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:226
export const STEROIDS____header_global_081e91a2dd4a3aab = ((((((55) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_86d4a2cc22d914b03a54ff3b() {
  return __cxx_static_address_86d4a2cc22d914b03a54ff3b.reference || (__cxx_static_address_86d4a2cc22d914b03a54ff3b.reference = {
    __cReference: true,
    get value() { return STEROIDS____header_global_081e91a2dd4a3aab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:227
export const AIRTANK____header_global_b8f2735b763eb19c = ((((((56) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a088c5dc46caa6a567b6849b() {
  return __cxx_static_address_a088c5dc46caa6a567b6849b.reference || (__cxx_static_address_a088c5dc46caa6a567b6849b.reference = {
    __cReference: true,
    get value() { return AIRTANK____header_global_b8f2735b763eb19c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:228
export const JETPACK____header_global_53228c3c8d63f477 = ((((((57) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_21d35e5e9a60e08a131e1113() {
  return __cxx_static_address_21d35e5e9a60e08a131e1113.reference || (__cxx_static_address_21d35e5e9a60e08a131e1113.reference = {
    __cReference: true,
    get value() { return JETPACK____header_global_53228c3c8d63f477; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:229
export const HEATSENSOR____header_global_b1e2e40e4abda6ff = ((((((59) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4f4163ed535a66106c519706() {
  return __cxx_static_address_4f4163ed535a66106c519706.reference || (__cxx_static_address_4f4163ed535a66106c519706.reference = {
    __cReference: true,
    get value() { return HEATSENSOR____header_global_b1e2e40e4abda6ff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:230
export const ACCESSCARD____header_global_543ab04959fd1bdd = ((((((60) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9acf109eae7ddbc8f538b694() {
  return __cxx_static_address_9acf109eae7ddbc8f538b694.reference || (__cxx_static_address_9acf109eae7ddbc8f538b694.reference = {
    __cReference: true,
    get value() { return ACCESSCARD____header_global_543ab04959fd1bdd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:231
export const BOOTS____header_global_0998a224cf5a0162 = ((((((61) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6585b14babdf8dfc0bd86613() {
  return __cxx_static_address_6585b14babdf8dfc0bd86613.reference || (__cxx_static_address_6585b14babdf8dfc0bd86613.reference = {
    __cReference: true,
    get value() { return BOOTS____header_global_0998a224cf5a0162; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:232
export const MIRRORBROKE____header_global_8e2de5f110b08ed3 = ((((((70) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_43cd3dc47a7417d04f2a4cf8() {
  return __cxx_static_address_43cd3dc47a7417d04f2a4cf8.reference || (__cxx_static_address_43cd3dc47a7417d04f2a4cf8.reference = {
    __cReference: true,
    get value() { return MIRRORBROKE____header_global_8e2de5f110b08ed3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:233
export const CLOUDYOCEAN____header_global_ba9eb727903e01c6 = ((((((78) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c328b5575accb7666febaccf() {
  return __cxx_static_address_c328b5575accb7666febaccf.reference || (__cxx_static_address_c328b5575accb7666febaccf.reference = {
    __cReference: true,
    get value() { return CLOUDYOCEAN____header_global_ba9eb727903e01c6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:234
export const CLOUDYSKIES____header_global_8bb580278e9beb41 = ((((((79) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_409d92afdcfa2afb0d0c3c30() {
  return __cxx_static_address_409d92afdcfa2afb0d0c3c30.reference || (__cxx_static_address_409d92afdcfa2afb0d0c3c30.reference = {
    __cReference: true,
    get value() { return CLOUDYSKIES____header_global_8bb580278e9beb41; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:235
export const MOONSKY1____header_global_bcb4c75b15864fbd = ((((((80) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_74ab6d8c689a83d442ba9c21() {
  return __cxx_static_address_74ab6d8c689a83d442ba9c21.reference || (__cxx_static_address_74ab6d8c689a83d442ba9c21.reference = {
    __cReference: true,
    get value() { return MOONSKY1____header_global_bcb4c75b15864fbd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:236
export const BIGORBIT1____header_global_877af123ef9d7018 = ((((((84) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_efe04f90faef4c2f715a6684() {
  return __cxx_static_address_efe04f90faef4c2f715a6684.reference || (__cxx_static_address_efe04f90faef4c2f715a6684.reference = {
    __cReference: true,
    get value() { return BIGORBIT1____header_global_877af123ef9d7018; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:237
export const LA____header_global_a74c614edb4c0a54 = ((((((89) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_da004472ef084e9429779350() {
  return __cxx_static_address_da004472ef084e9429779350.reference || (__cxx_static_address_da004472ef084e9429779350.reference = {
    __cReference: true,
    get value() { return LA____header_global_a74c614edb4c0a54; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:238
export const ATOMICHEALTH____header_global_484a3c8e6fd19258 = ((((((100) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6f6f869d1f2a34427f092abc() {
  return __cxx_static_address_6f6f869d1f2a34427f092abc.reference || (__cxx_static_address_6f6f869d1f2a34427f092abc.reference = {
    __cReference: true,
    get value() { return ATOMICHEALTH____header_global_484a3c8e6fd19258; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:239
export const TECHLIGHT2____header_global_1416c188d29f7af4 = ((((((120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4a8cdc86ef405200826256ca() {
  return __cxx_static_address_4a8cdc86ef405200826256ca.reference || (__cxx_static_address_4a8cdc86ef405200826256ca.reference = {
    __cReference: true,
    get value() { return TECHLIGHT2____header_global_1416c188d29f7af4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:240
export const TECHLIGHTBUST2____header_global_ee7a0f810f90b505 = ((((((121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8965aba768b0168934804f8d() {
  return __cxx_static_address_8965aba768b0168934804f8d.reference || (__cxx_static_address_8965aba768b0168934804f8d.reference = {
    __cReference: true,
    get value() { return TECHLIGHTBUST2____header_global_ee7a0f810f90b505; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:241
export const TECHLIGHT4____header_global_29a1f94ffe98a32e = ((((((122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_59b6ce9af150fe728d07babd() {
  return __cxx_static_address_59b6ce9af150fe728d07babd.reference || (__cxx_static_address_59b6ce9af150fe728d07babd.reference = {
    __cReference: true,
    get value() { return TECHLIGHT4____header_global_29a1f94ffe98a32e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:242
export const TECHLIGHTBUST4____header_global_d4ef96ac95cfe8b0 = ((((((123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6533815f8391bc8799ddcd11() {
  return __cxx_static_address_6533815f8391bc8799ddcd11.reference || (__cxx_static_address_6533815f8391bc8799ddcd11.reference = {
    __cReference: true,
    get value() { return TECHLIGHTBUST4____header_global_d4ef96ac95cfe8b0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:243
export const WALLLIGHT4____header_global_a557c6f0912bd13d = ((((((124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a02bed6625400ef9e89ecf71() {
  return __cxx_static_address_a02bed6625400ef9e89ecf71.reference || (__cxx_static_address_a02bed6625400ef9e89ecf71.reference = {
    __cReference: true,
    get value() { return WALLLIGHT4____header_global_a557c6f0912bd13d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:244
export const WALLLIGHTBUST4____header_global_fcee11f5d13c35fa = ((((((125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_71fb5d80088409adccf616c9() {
  return __cxx_static_address_71fb5d80088409adccf616c9.reference || (__cxx_static_address_71fb5d80088409adccf616c9.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST4____header_global_fcee11f5d13c35fa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:245
export const ACCESSSWITCH____header_global_bf73151f387500e7 = ((((((130) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_69aad4be4284b8e8d200c49f() {
  return __cxx_static_address_69aad4be4284b8e8d200c49f.reference || (__cxx_static_address_69aad4be4284b8e8d200c49f.reference = {
    __cReference: true,
    get value() { return ACCESSSWITCH____header_global_bf73151f387500e7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:246
export const SLOTDOOR____header_global_869316eeeeee65e7 = ((((((132) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f06a6a8017ac69c714826712() {
  return __cxx_static_address_f06a6a8017ac69c714826712.reference || (__cxx_static_address_f06a6a8017ac69c714826712.reference = {
    __cReference: true,
    get value() { return SLOTDOOR____header_global_869316eeeeee65e7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:247
export const LIGHTSWITCH____header_global_b42072b169d105db = ((((((134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_56ca7ffbbe0e6ff05c7d7e29() {
  return __cxx_static_address_56ca7ffbbe0e6ff05c7d7e29.reference || (__cxx_static_address_56ca7ffbbe0e6ff05c7d7e29.reference = {
    __cReference: true,
    get value() { return LIGHTSWITCH____header_global_b42072b169d105db; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:248
export const SPACEDOORSWITCH____header_global_8589f80397ffdc9f = ((((((136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8f27bbe52f6ea49badad871e() {
  return __cxx_static_address_8f27bbe52f6ea49badad871e.reference || (__cxx_static_address_8f27bbe52f6ea49badad871e.reference = {
    __cReference: true,
    get value() { return SPACEDOORSWITCH____header_global_8589f80397ffdc9f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:249
export const SPACELIGHTSWITCH____header_global_016011f2f0a23ed5 = ((((((138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_243005b43c10392fd2b95b5d() {
  return __cxx_static_address_243005b43c10392fd2b95b5d.reference || (__cxx_static_address_243005b43c10392fd2b95b5d.reference = {
    __cReference: true,
    get value() { return SPACELIGHTSWITCH____header_global_016011f2f0a23ed5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:250
export const FRANKENSTINESWITCH____header_global_e90a380efd693089 = ((((((140) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ec4a9f7526c850d11c213b24() {
  return __cxx_static_address_ec4a9f7526c850d11c213b24.reference || (__cxx_static_address_ec4a9f7526c850d11c213b24.reference = {
    __cReference: true,
    get value() { return FRANKENSTINESWITCH____header_global_e90a380efd693089; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:251
export const NUKEBUTTON____header_global_0435a84047c2766e = ((((((142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d6fc2377cc7e97cd66d6d25e() {
  return __cxx_static_address_d6fc2377cc7e97cd66d6d25e.reference || (__cxx_static_address_d6fc2377cc7e97cd66d6d25e.reference = {
    __cReference: true,
    get value() { return NUKEBUTTON____header_global_0435a84047c2766e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:252
export const MULTISWITCH____header_global_07016924956a48cc = ((((((146) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_35f17ebe698512dc5c5525e2() {
  return __cxx_static_address_35f17ebe698512dc5c5525e2.reference || (__cxx_static_address_35f17ebe698512dc5c5525e2.reference = {
    __cReference: true,
    get value() { return MULTISWITCH____header_global_07016924956a48cc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:253
export const DOORTILE5____header_global_2498797a6d3ca54d = ((((((150) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4329f2aeeeac69fb04f599e2() {
  return __cxx_static_address_4329f2aeeeac69fb04f599e2.reference || (__cxx_static_address_4329f2aeeeac69fb04f599e2.reference = {
    __cReference: true,
    get value() { return DOORTILE5____header_global_2498797a6d3ca54d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:254
export const DOORTILE6____header_global_4f0b884e36002f51 = ((((((151) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fa79efd2553f077a78dd256d() {
  return __cxx_static_address_fa79efd2553f077a78dd256d.reference || (__cxx_static_address_fa79efd2553f077a78dd256d.reference = {
    __cReference: true,
    get value() { return DOORTILE6____header_global_4f0b884e36002f51; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:255
export const DOORTILE1____header_global_33f18e51d5938ef7 = ((((((152) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e71dde900b4eff1c8a190642() {
  return __cxx_static_address_e71dde900b4eff1c8a190642.reference || (__cxx_static_address_e71dde900b4eff1c8a190642.reference = {
    __cReference: true,
    get value() { return DOORTILE1____header_global_33f18e51d5938ef7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:256
export const DOORTILE2____header_global_987d8b3b2f4fe08f = ((((((153) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f044b282ba46fa771a3236c8() {
  return __cxx_static_address_f044b282ba46fa771a3236c8.reference || (__cxx_static_address_f044b282ba46fa771a3236c8.reference = {
    __cReference: true,
    get value() { return DOORTILE2____header_global_987d8b3b2f4fe08f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:257
export const DOORTILE3____header_global_50f3a1dea5d81f56 = ((((((154) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_050ee688fcd95a6f81c86234() {
  return __cxx_static_address_050ee688fcd95a6f81c86234.reference || (__cxx_static_address_050ee688fcd95a6f81c86234.reference = {
    __cReference: true,
    get value() { return DOORTILE3____header_global_50f3a1dea5d81f56; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:258
export const DOORTILE4____header_global_c24cfe30c8e2edc4 = ((((((155) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_16b75bba21ee8962a8d3ba34() {
  return __cxx_static_address_16b75bba21ee8962a8d3ba34.reference || (__cxx_static_address_16b75bba21ee8962a8d3ba34.reference = {
    __cReference: true,
    get value() { return DOORTILE4____header_global_c24cfe30c8e2edc4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:259
export const DOORTILE7____header_global_fd1225e1feddae8b = ((((((156) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_38240effca244b54aec91a3d() {
  return __cxx_static_address_38240effca244b54aec91a3d.reference || (__cxx_static_address_38240effca244b54aec91a3d.reference = {
    __cReference: true,
    get value() { return DOORTILE7____header_global_fd1225e1feddae8b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:260
export const DOORTILE8____header_global_8cb713d0adb2581e = ((((((157) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_df23a40d6b3b4baa8525fe6d() {
  return __cxx_static_address_df23a40d6b3b4baa8525fe6d.reference || (__cxx_static_address_df23a40d6b3b4baa8525fe6d.reference = {
    __cReference: true,
    get value() { return DOORTILE8____header_global_8cb713d0adb2581e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:261
export const DOORTILE9____header_global_e50302d73e5f84b9 = ((((((158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3b0aa942661b2df01d3bb77c() {
  return __cxx_static_address_3b0aa942661b2df01d3bb77c.reference || (__cxx_static_address_3b0aa942661b2df01d3bb77c.reference = {
    __cReference: true,
    get value() { return DOORTILE9____header_global_e50302d73e5f84b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:262
export const DOORTILE10____header_global_d24e61b5d0bab3b3 = ((((((159) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b958d1a675bbd32ca08ee267() {
  return __cxx_static_address_b958d1a675bbd32ca08ee267.reference || (__cxx_static_address_b958d1a675bbd32ca08ee267.reference = {
    __cReference: true,
    get value() { return DOORTILE10____header_global_d24e61b5d0bab3b3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:263
export const DOORSHOCK____header_global_1cd0c7b507ae730d = ((((((160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_96165dafcf9152f342a6db59() {
  return __cxx_static_address_96165dafcf9152f342a6db59.reference || (__cxx_static_address_96165dafcf9152f342a6db59.reference = {
    __cReference: true,
    get value() { return DOORSHOCK____header_global_1cd0c7b507ae730d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:264
export const DIPSWITCH____header_global_3b5f5140c6460bc6 = ((((((162) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_685469736f588610a34efcad() {
  return __cxx_static_address_685469736f588610a34efcad.reference || (__cxx_static_address_685469736f588610a34efcad.reference = {
    __cReference: true,
    get value() { return DIPSWITCH____header_global_3b5f5140c6460bc6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:265
export const DIPSWITCH2____header_global_fc5b5a2699750e2d = ((((((164) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2596f9caed49aa45e6aa4e41() {
  return __cxx_static_address_2596f9caed49aa45e6aa4e41.reference || (__cxx_static_address_2596f9caed49aa45e6aa4e41.reference = {
    __cReference: true,
    get value() { return DIPSWITCH2____header_global_fc5b5a2699750e2d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:266
export const TECHSWITCH____header_global_9411ae1f0b663bf0 = ((((((166) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_38ff40ed14084ac4e9635bfc() {
  return __cxx_static_address_38ff40ed14084ac4e9635bfc.reference || (__cxx_static_address_38ff40ed14084ac4e9635bfc.reference = {
    __cReference: true,
    get value() { return TECHSWITCH____header_global_9411ae1f0b663bf0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:267
export const DIPSWITCH3____header_global_60a8ad4e880213b7 = ((((((168) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a2375f1ddba19d485a7b0e15() {
  return __cxx_static_address_a2375f1ddba19d485a7b0e15.reference || (__cxx_static_address_a2375f1ddba19d485a7b0e15.reference = {
    __cReference: true,
    get value() { return DIPSWITCH3____header_global_60a8ad4e880213b7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:268
export const ACCESSSWITCH2____header_global_1e29ec734756bb9e = ((((((170) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e87f461bfb7cb94e87a788a() {
  return __cxx_static_address_1e87f461bfb7cb94e87a788a.reference || (__cxx_static_address_1e87f461bfb7cb94e87a788a.reference = {
    __cReference: true,
    get value() { return ACCESSSWITCH2____header_global_1e29ec734756bb9e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:269
export const FLOORSLIME____header_global_d7772cd8b05e03f4 = ((((((200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_252ea1a3cea7ac27f187b780() {
  return __cxx_static_address_252ea1a3cea7ac27f187b780.reference || (__cxx_static_address_252ea1a3cea7ac27f187b780.reference = {
    __cReference: true,
    get value() { return FLOORSLIME____header_global_d7772cd8b05e03f4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:270
export const BIGFORCE____header_global_7a033457723f6aed = ((((((230) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9b2b250e201c131c949a8130() {
  return __cxx_static_address_9b2b250e201c131c949a8130.reference || (__cxx_static_address_9b2b250e201c131c949a8130.reference = {
    __cReference: true,
    get value() { return BIGFORCE____header_global_7a033457723f6aed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:271
export const MASKWALL9____header_global_1fa9bb96d915dcf8 = ((((((255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5818ca1d85a35ec0e5550acf() {
  return __cxx_static_address_5818ca1d85a35ec0e5550acf.reference || (__cxx_static_address_5818ca1d85a35ec0e5550acf.reference = {
    __cReference: true,
    get value() { return MASKWALL9____header_global_1fa9bb96d915dcf8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:272
export const SCREENBREAK1____header_global_d236ef3942a4a5ba = ((((((263) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9f60091aff61e8d78be8a106() {
  return __cxx_static_address_9f60091aff61e8d78be8a106.reference || (__cxx_static_address_9f60091aff61e8d78be8a106.reference = {
    __cReference: true,
    get value() { return SCREENBREAK1____header_global_d236ef3942a4a5ba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:273
export const SCREENBREAK2____header_global_d652041420e3df56 = ((((((264) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bc551384e607e894bc7353f6() {
  return __cxx_static_address_bc551384e607e894bc7353f6.reference || (__cxx_static_address_bc551384e607e894bc7353f6.reference = {
    __cReference: true,
    get value() { return SCREENBREAK2____header_global_d652041420e3df56; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:274
export const SCREENBREAK3____header_global_5fc9d733ce1913ed = ((((((265) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_10297b28cc4d7e7fd65793af() {
  return __cxx_static_address_10297b28cc4d7e7fd65793af.reference || (__cxx_static_address_10297b28cc4d7e7fd65793af.reference = {
    __cReference: true,
    get value() { return SCREENBREAK3____header_global_5fc9d733ce1913ed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:275
export const SCREENBREAK4____header_global_de4a9ebb79eb44b5 = ((((((266) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fe53e52f13614a8432db84bf() {
  return __cxx_static_address_fe53e52f13614a8432db84bf.reference || (__cxx_static_address_fe53e52f13614a8432db84bf.reference = {
    __cReference: true,
    get value() { return SCREENBREAK4____header_global_de4a9ebb79eb44b5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:276
export const SCREENBREAK5____header_global_505f273d69e7c025 = ((((((267) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a78f0d6e8c27aac996bad701() {
  return __cxx_static_address_a78f0d6e8c27aac996bad701.reference || (__cxx_static_address_a78f0d6e8c27aac996bad701.reference = {
    __cReference: true,
    get value() { return SCREENBREAK5____header_global_505f273d69e7c025; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:277
export const SCREENBREAK6____header_global_2a8d7b0dde19c9ad = ((((((268) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_73aeee50047963631b466381() {
  return __cxx_static_address_73aeee50047963631b466381.reference || (__cxx_static_address_73aeee50047963631b466381.reference = {
    __cReference: true,
    get value() { return SCREENBREAK6____header_global_2a8d7b0dde19c9ad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:278
export const SCREENBREAK7____header_global_badb5d7554efbfaa = ((((((269) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b6a2df250a3d9528f8a6480f() {
  return __cxx_static_address_b6a2df250a3d9528f8a6480f.reference || (__cxx_static_address_b6a2df250a3d9528f8a6480f.reference = {
    __cReference: true,
    get value() { return SCREENBREAK7____header_global_badb5d7554efbfaa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:279
export const SCREENBREAK8____header_global_535c11e4a3b03cf7 = ((((((270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_34474a76035ca3c4aea458d0() {
  return __cxx_static_address_34474a76035ca3c4aea458d0.reference || (__cxx_static_address_34474a76035ca3c4aea458d0.reference = {
    __cReference: true,
    get value() { return SCREENBREAK8____header_global_535c11e4a3b03cf7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:280
export const SCREENBREAK9____header_global_96ff0c31ed30e554 = ((((((271) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4ee1a6103dd9e731c7a442cc() {
  return __cxx_static_address_4ee1a6103dd9e731c7a442cc.reference || (__cxx_static_address_4ee1a6103dd9e731c7a442cc.reference = {
    __cReference: true,
    get value() { return SCREENBREAK9____header_global_96ff0c31ed30e554; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:281
export const SCREENBREAK10____header_global_39a6b552868246a8 = ((((((272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e8d0c5c1370426c1d4d447e5() {
  return __cxx_static_address_e8d0c5c1370426c1d4d447e5.reference || (__cxx_static_address_e8d0c5c1370426c1d4d447e5.reference = {
    __cReference: true,
    get value() { return SCREENBREAK10____header_global_39a6b552868246a8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:282
export const SCREENBREAK11____header_global_ee0720ecf622d000 = ((((((273) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8e1a5abaaeebbf2bed23a1bc() {
  return __cxx_static_address_8e1a5abaaeebbf2bed23a1bc.reference || (__cxx_static_address_8e1a5abaaeebbf2bed23a1bc.reference = {
    __cReference: true,
    get value() { return SCREENBREAK11____header_global_ee0720ecf622d000; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:283
export const SCREENBREAK12____header_global_1cbd00d3c6000ac0 = ((((((274) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_75e5b68a4fb189f53ab2c08c() {
  return __cxx_static_address_75e5b68a4fb189f53ab2c08c.reference || (__cxx_static_address_75e5b68a4fb189f53ab2c08c.reference = {
    __cReference: true,
    get value() { return SCREENBREAK12____header_global_1cbd00d3c6000ac0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:284
export const SCREENBREAK13____header_global_e4c38baa8798b4c7 = ((((((275) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7cc82f237f2ad40c3dfc1ba9() {
  return __cxx_static_address_7cc82f237f2ad40c3dfc1ba9.reference || (__cxx_static_address_7cc82f237f2ad40c3dfc1ba9.reference = {
    __cReference: true,
    get value() { return SCREENBREAK13____header_global_e4c38baa8798b4c7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:285
export const MASKWALL1____header_global_75f3dbdc5ca75d6a = ((((((285) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_129daa97e281a50c4c6fabc4() {
  return __cxx_static_address_129daa97e281a50c4c6fabc4.reference || (__cxx_static_address_129daa97e281a50c4c6fabc4.reference = {
    __cReference: true,
    get value() { return MASKWALL1____header_global_75f3dbdc5ca75d6a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:286
export const W_TECHWALL1____header_global_786b1d9e8fa9212b = ((((((293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5ce40089eb58f80ca4e11ebd() {
  return __cxx_static_address_5ce40089eb58f80ca4e11ebd.reference || (__cxx_static_address_5ce40089eb58f80ca4e11ebd.reference = {
    __cReference: true,
    get value() { return W_TECHWALL1____header_global_786b1d9e8fa9212b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:287
export const W_TECHWALL2____header_global_ef0413178465ec61 = ((((((297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d23e7be229e6d36c1d8b7b20() {
  return __cxx_static_address_d23e7be229e6d36c1d8b7b20.reference || (__cxx_static_address_d23e7be229e6d36c1d8b7b20.reference = {
    __cReference: true,
    get value() { return W_TECHWALL2____header_global_ef0413178465ec61; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:288
export const W_TECHWALL15____header_global_0eb6383381a83131 = ((((((299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9bff916711e4b52afe6a39a6() {
  return __cxx_static_address_9bff916711e4b52afe6a39a6.reference || (__cxx_static_address_9bff916711e4b52afe6a39a6.reference = {
    __cReference: true,
    get value() { return W_TECHWALL15____header_global_0eb6383381a83131; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:289
export const W_TECHWALL3____header_global_b5c985eb2dbe303b = ((((((301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_67b7fa6c65e23b3f327e0e9d() {
  return __cxx_static_address_67b7fa6c65e23b3f327e0e9d.reference || (__cxx_static_address_67b7fa6c65e23b3f327e0e9d.reference = {
    __cReference: true,
    get value() { return W_TECHWALL3____header_global_b5c985eb2dbe303b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:290
export const W_TECHWALL4____header_global_171e7ee2c83253e6 = ((((((305) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_12787c17d32d0b6d9f1b0cdb() {
  return __cxx_static_address_12787c17d32d0b6d9f1b0cdb.reference || (__cxx_static_address_12787c17d32d0b6d9f1b0cdb.reference = {
    __cReference: true,
    get value() { return W_TECHWALL4____header_global_171e7ee2c83253e6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:291
export const W_TECHWALL10____header_global_9c3db9fe85cdba2b = ((((((306) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e313cec8bcd0f87ba3dce3f3() {
  return __cxx_static_address_e313cec8bcd0f87ba3dce3f3.reference || (__cxx_static_address_e313cec8bcd0f87ba3dce3f3.reference = {
    __cReference: true,
    get value() { return W_TECHWALL10____header_global_9c3db9fe85cdba2b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:292
export const W_TECHWALL16____header_global_6853f933c6079126 = ((((((307) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7f61152fa9806302f9b13336() {
  return __cxx_static_address_7f61152fa9806302f9b13336.reference || (__cxx_static_address_7f61152fa9806302f9b13336.reference = {
    __cReference: true,
    get value() { return W_TECHWALL16____header_global_6853f933c6079126; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:293
export const WATERTILE2____header_global_e197731cec84b5f9 = ((((((336) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b202bc09965e5dc6c60c2cc7() {
  return __cxx_static_address_b202bc09965e5dc6c60c2cc7.reference || (__cxx_static_address_b202bc09965e5dc6c60c2cc7.reference = {
    __cReference: true,
    get value() { return WATERTILE2____header_global_e197731cec84b5f9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:294
export const BPANNEL1____header_global_16252b9f6de3a384 = ((((((341) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6ebc1e505a2d0e0a0b588f8b() {
  return __cxx_static_address_6ebc1e505a2d0e0a0b588f8b.reference || (__cxx_static_address_6ebc1e505a2d0e0a0b588f8b.reference = {
    __cReference: true,
    get value() { return BPANNEL1____header_global_16252b9f6de3a384; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:295
export const PANNEL1____header_global_7ac1729c094a2d72 = ((((((342) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_20ff3d008b3f6cb1eb4eedca() {
  return __cxx_static_address_20ff3d008b3f6cb1eb4eedca.reference || (__cxx_static_address_20ff3d008b3f6cb1eb4eedca.reference = {
    __cReference: true,
    get value() { return PANNEL1____header_global_7ac1729c094a2d72; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:296
export const PANNEL2____header_global_027b1e5ef5897a63 = ((((((343) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_495e500ff8151af66229a61f() {
  return __cxx_static_address_495e500ff8151af66229a61f.reference || (__cxx_static_address_495e500ff8151af66229a61f.reference = {
    __cReference: true,
    get value() { return PANNEL2____header_global_027b1e5ef5897a63; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:297
export const STATIC____header_global_f9df63684f9277c4 = ((((((351) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3cc08b5f55257b1bf84bd727() {
  return __cxx_static_address_3cc08b5f55257b1bf84bd727.reference || (__cxx_static_address_3cc08b5f55257b1bf84bd727.reference = {
    __cReference: true,
    get value() { return STATIC____header_global_f9df63684f9277c4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:298
export const W_SCREENBREAK____header_global_acadb7bf8b59c4fe = ((((((357) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c2756a9b69ddbfa778ba0bf9() {
  return __cxx_static_address_c2756a9b69ddbfa778ba0bf9.reference || (__cxx_static_address_c2756a9b69ddbfa778ba0bf9.reference = {
    __cReference: true,
    get value() { return W_SCREENBREAK____header_global_acadb7bf8b59c4fe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:299
export const W_HITTECHWALL3____header_global_30e448753324f2d1 = ((((((360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b586b6d57efa794a151f3caa() {
  return __cxx_static_address_b586b6d57efa794a151f3caa.reference || (__cxx_static_address_b586b6d57efa794a151f3caa.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL3____header_global_30e448753324f2d1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:300
export const W_HITTECHWALL4____header_global_e662105413817bc5 = ((((((361) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_54660b290d28c0f71b7f2b4a() {
  return __cxx_static_address_54660b290d28c0f71b7f2b4a.reference || (__cxx_static_address_54660b290d28c0f71b7f2b4a.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL4____header_global_e662105413817bc5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:301
export const W_HITTECHWALL2____header_global_38c011cdea907e09 = ((((((362) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c99b0184eb1ba9d7bef667a6() {
  return __cxx_static_address_c99b0184eb1ba9d7bef667a6.reference || (__cxx_static_address_c99b0184eb1ba9d7bef667a6.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL2____header_global_38c011cdea907e09; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:302
export const W_HITTECHWALL1____header_global_a5480d1b97b9590b = ((((((363) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5c5b156024c9e15cf7069c75() {
  return __cxx_static_address_5c5b156024c9e15cf7069c75.reference || (__cxx_static_address_5c5b156024c9e15cf7069c75.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL1____header_global_a5480d1b97b9590b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:303
export const MASKWALL10____header_global_f10ec5363d7dbce5 = ((((((387) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5c376f1c20e7ab358ad5a859() {
  return __cxx_static_address_5c376f1c20e7ab358ad5a859.reference || (__cxx_static_address_5c376f1c20e7ab358ad5a859.reference = {
    __cReference: true,
    get value() { return MASKWALL10____header_global_f10ec5363d7dbce5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:304
export const MASKWALL11____header_global_c228872f23855867 = ((((((391) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fd2efff6125510aee1f00154() {
  return __cxx_static_address_fd2efff6125510aee1f00154.reference || (__cxx_static_address_fd2efff6125510aee1f00154.reference = {
    __cReference: true,
    get value() { return MASKWALL11____header_global_c228872f23855867; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:305
export const DOORTILE22____header_global_70c3b2643bb8b04e = ((((((395) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4720d4a03e57a86b7d552e22() {
  return __cxx_static_address_4720d4a03e57a86b7d552e22.reference || (__cxx_static_address_4720d4a03e57a86b7d552e22.reference = {
    __cReference: true,
    get value() { return DOORTILE22____header_global_70c3b2643bb8b04e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:306
export const FANSPRITE____header_global_d9947277d4115257 = ((((((407) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_50de22a21931c06df640aba8() {
  return __cxx_static_address_50de22a21931c06df640aba8.reference || (__cxx_static_address_50de22a21931c06df640aba8.reference = {
    __cReference: true,
    get value() { return FANSPRITE____header_global_d9947277d4115257; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:307
export const FANSPRITEBROKE____header_global_75b3d7f570c82442 = ((((((411) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4211e8e93bd1387fa14cad66() {
  return __cxx_static_address_4211e8e93bd1387fa14cad66.reference || (__cxx_static_address_4211e8e93bd1387fa14cad66.reference = {
    __cReference: true,
    get value() { return FANSPRITEBROKE____header_global_75b3d7f570c82442; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:308
export const FANSHADOW____header_global_c0323d4e2510c920 = ((((((412) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_adccc34695d7eea4131b4fbd() {
  return __cxx_static_address_adccc34695d7eea4131b4fbd.reference || (__cxx_static_address_adccc34695d7eea4131b4fbd.reference = {
    __cReference: true,
    get value() { return FANSHADOW____header_global_c0323d4e2510c920; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:309
export const FANSHADOWBROKE____header_global_e2b89de24108cb24 = ((((((416) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b9dd8d559f64bd5b2ba86253() {
  return __cxx_static_address_b9dd8d559f64bd5b2ba86253.reference || (__cxx_static_address_b9dd8d559f64bd5b2ba86253.reference = {
    __cReference: true,
    get value() { return FANSHADOWBROKE____header_global_e2b89de24108cb24; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:310
export const DOORTILE18____header_global_9c7f4506ec529c54 = ((((((447) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7af06ba6315216b64285c581() {
  return __cxx_static_address_7af06ba6315216b64285c581.reference || (__cxx_static_address_7af06ba6315216b64285c581.reference = {
    __cReference: true,
    get value() { return DOORTILE18____header_global_9c7f4506ec529c54; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:311
export const DOORTILE19____header_global_6be58a855ec67d36 = ((((((448) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_261922b93f03a90420acf5af() {
  return __cxx_static_address_261922b93f03a90420acf5af.reference || (__cxx_static_address_261922b93f03a90420acf5af.reference = {
    __cReference: true,
    get value() { return DOORTILE19____header_global_6be58a855ec67d36; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:312
export const DOORTILE20____header_global_5b6844a2f8a9c8bd = ((((((449) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fdb02a0f9502affb525f56fb() {
  return __cxx_static_address_fdb02a0f9502affb525f56fb.reference || (__cxx_static_address_fdb02a0f9502affb525f56fb.reference = {
    __cReference: true,
    get value() { return DOORTILE20____header_global_5b6844a2f8a9c8bd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:313
export const VIEWSCREEN2____header_global_782d7361517a1b8c = ((((((499) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_89d1072e2585ff428ec8e531() {
  return __cxx_static_address_89d1072e2585ff428ec8e531.reference || (__cxx_static_address_89d1072e2585ff428ec8e531.reference = {
    __cReference: true,
    get value() { return VIEWSCREEN2____header_global_782d7361517a1b8c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:314
export const VIEWSCREEN____header_global_a1055e911bdc359d = ((((((502) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6d3c54c913f5120b732f214b() {
  return __cxx_static_address_6d3c54c913f5120b732f214b.reference || (__cxx_static_address_6d3c54c913f5120b732f214b.reference = {
    __cReference: true,
    get value() { return VIEWSCREEN____header_global_a1055e911bdc359d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:315
export const GLASS____header_global_9f9dec3c5877fe6a = ((((((503) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4ee1f286122d9898e7bc0fb8() {
  return __cxx_static_address_4ee1f286122d9898e7bc0fb8.reference || (__cxx_static_address_4ee1f286122d9898e7bc0fb8.reference = {
    __cReference: true,
    get value() { return GLASS____header_global_9f9dec3c5877fe6a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:316
export const GLASS2____header_global_12e6373de7797d14 = ((((((504) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b46d0d2008092dad1fd0d976() {
  return __cxx_static_address_b46d0d2008092dad1fd0d976.reference || (__cxx_static_address_b46d0d2008092dad1fd0d976.reference = {
    __cReference: true,
    get value() { return GLASS2____header_global_12e6373de7797d14; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:317
export const STAINGLASS1____header_global_1477f855323d4674 = ((((((510) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d4e06599e3c7b36bfb49270b() {
  return __cxx_static_address_d4e06599e3c7b36bfb49270b.reference || (__cxx_static_address_d4e06599e3c7b36bfb49270b.reference = {
    __cReference: true,
    get value() { return STAINGLASS1____header_global_1477f855323d4674; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:318
export const MASKWALL5____header_global_aafe91ea524d8fb3 = ((((((514) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7c6290d3d233f561a23e0ee5() {
  return __cxx_static_address_7c6290d3d233f561a23e0ee5.reference || (__cxx_static_address_7c6290d3d233f561a23e0ee5.reference = {
    __cReference: true,
    get value() { return MASKWALL5____header_global_aafe91ea524d8fb3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:319
export const SATELITE____header_global_307d63afcdbfea60 = ((((((516) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_282bddef5224f4324aed0d26() {
  return __cxx_static_address_282bddef5224f4324aed0d26.reference || (__cxx_static_address_282bddef5224f4324aed0d26.reference = {
    __cReference: true,
    get value() { return SATELITE____header_global_307d63afcdbfea60; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:320
export const FUELPOD____header_global_1cae9ae205f6608d = ((((((517) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9536f4a4dbaf08e154ba9f12() {
  return __cxx_static_address_9536f4a4dbaf08e154ba9f12.reference || (__cxx_static_address_9536f4a4dbaf08e154ba9f12.reference = {
    __cReference: true,
    get value() { return FUELPOD____header_global_1cae9ae205f6608d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:321
export const CRACK1____header_global_b65563e063b5086d = ((((((546) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_235130d5dd984c99e17f0721() {
  return __cxx_static_address_235130d5dd984c99e17f0721.reference || (__cxx_static_address_235130d5dd984c99e17f0721.reference = {
    __cReference: true,
    get value() { return CRACK1____header_global_b65563e063b5086d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:322
export const CRACK2____header_global_c044ee9f6d56098f = ((((((547) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_feca99655aa1090e66766ddf() {
  return __cxx_static_address_feca99655aa1090e66766ddf.reference || (__cxx_static_address_feca99655aa1090e66766ddf.reference = {
    __cReference: true,
    get value() { return CRACK2____header_global_c044ee9f6d56098f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:323
export const CRACK3____header_global_f86e3b6bde48d8be = ((((((548) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d3accf573c786fc1df12699e() {
  return __cxx_static_address_d3accf573c786fc1df12699e.reference || (__cxx_static_address_d3accf573c786fc1df12699e.reference = {
    __cReference: true,
    get value() { return CRACK3____header_global_f86e3b6bde48d8be; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:324
export const CRACK4____header_global_cd5c8a392347e2d7 = ((((((549) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1249a8541190a805c93b62d9() {
  return __cxx_static_address_1249a8541190a805c93b62d9.reference || (__cxx_static_address_1249a8541190a805c93b62d9.reference = {
    __cReference: true,
    get value() { return CRACK4____header_global_cd5c8a392347e2d7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:325
export const FOOTPRINTS____header_global_eddbefbb1f60c8c1 = ((((((550) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_44ffcba7692799a78527ce2d() {
  return __cxx_static_address_44ffcba7692799a78527ce2d.reference || (__cxx_static_address_44ffcba7692799a78527ce2d.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS____header_global_eddbefbb1f60c8c1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:326
export const DOMELITE____header_global_3837c6f99108e8b0 = ((((((551) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ca87615d35b95a3ceea70a00() {
  return __cxx_static_address_ca87615d35b95a3ceea70a00.reference || (__cxx_static_address_ca87615d35b95a3ceea70a00.reference = {
    __cReference: true,
    get value() { return DOMELITE____header_global_3837c6f99108e8b0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:327
export const CAMERAPOLE____header_global_49f463fccbcb4b89 = ((((((554) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dba9db6964bb1f440e71474f() {
  return __cxx_static_address_dba9db6964bb1f440e71474f.reference || (__cxx_static_address_dba9db6964bb1f440e71474f.reference = {
    __cReference: true,
    get value() { return CAMERAPOLE____header_global_49f463fccbcb4b89; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:328
export const CHAIR1____header_global_66d39713d5407e3e = ((((((556) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_000487841079029660d772bf() {
  return __cxx_static_address_000487841079029660d772bf.reference || (__cxx_static_address_000487841079029660d772bf.reference = {
    __cReference: true,
    get value() { return CHAIR1____header_global_66d39713d5407e3e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:329
export const CHAIR2____header_global_45730cf267ac4908 = ((((((557) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e29814016aa2162cbae37ece() {
  return __cxx_static_address_e29814016aa2162cbae37ece.reference || (__cxx_static_address_e29814016aa2162cbae37ece.reference = {
    __cReference: true,
    get value() { return CHAIR2____header_global_45730cf267ac4908; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:330
export const BROKENCHAIR____header_global_7c46602f5d075f42 = ((((((559) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b764c7c9d27a36011c9e9447() {
  return __cxx_static_address_b764c7c9d27a36011c9e9447.reference || (__cxx_static_address_b764c7c9d27a36011c9e9447.reference = {
    __cReference: true,
    get value() { return BROKENCHAIR____header_global_7c46602f5d075f42; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:331
export const MIRROR____header_global_ea9377b09f119631 = ((((((560) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7e2f729b92f46ba34dddfbc9() {
  return __cxx_static_address_7e2f729b92f46ba34dddfbc9.reference || (__cxx_static_address_7e2f729b92f46ba34dddfbc9.reference = {
    __cReference: true,
    get value() { return MIRROR____header_global_ea9377b09f119631; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:332
export const WATERFOUNTAIN____header_global_d95a28dcc52b0dac = ((((((563) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3b18187ab2c2959564778d33() {
  return __cxx_static_address_3b18187ab2c2959564778d33.reference || (__cxx_static_address_3b18187ab2c2959564778d33.reference = {
    __cReference: true,
    get value() { return WATERFOUNTAIN____header_global_d95a28dcc52b0dac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:333
export const WATERFOUNTAINBROKE____header_global_8ec0b538dedc99e3 = ((((((567) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3e2ed76fbdc0dfe032c916d9() {
  return __cxx_static_address_3e2ed76fbdc0dfe032c916d9.reference || (__cxx_static_address_3e2ed76fbdc0dfe032c916d9.reference = {
    __cReference: true,
    get value() { return WATERFOUNTAINBROKE____header_global_8ec0b538dedc99e3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:334
export const FEMMAG1____header_global_deb0a5b54c688a0b = ((((((568) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_083de2c07b6d1fdb544e82df() {
  return __cxx_static_address_083de2c07b6d1fdb544e82df.reference || (__cxx_static_address_083de2c07b6d1fdb544e82df.reference = {
    __cReference: true,
    get value() { return FEMMAG1____header_global_deb0a5b54c688a0b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:335
export const TOILET____header_global_26fadd6bd9216943 = ((((((569) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dfb83cf54711f248a3f4a70b() {
  return __cxx_static_address_dfb83cf54711f248a3f4a70b.reference || (__cxx_static_address_dfb83cf54711f248a3f4a70b.reference = {
    __cReference: true,
    get value() { return TOILET____header_global_26fadd6bd9216943; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:336
export const STALL____header_global_e579d53ff57a1ded = ((((((571) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_76c43cf1d961301f7e6b765c() {
  return __cxx_static_address_76c43cf1d961301f7e6b765c.reference || (__cxx_static_address_76c43cf1d961301f7e6b765c.reference = {
    __cReference: true,
    get value() { return STALL____header_global_e579d53ff57a1ded; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:337
export const STALLBROKE____header_global_2b713d2054627e44 = ((((((573) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cbe5b130e00a7c87e3ce0833() {
  return __cxx_static_address_cbe5b130e00a7c87e3ce0833.reference || (__cxx_static_address_cbe5b130e00a7c87e3ce0833.reference = {
    __cReference: true,
    get value() { return STALLBROKE____header_global_2b713d2054627e44; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:338
export const FEMMAG2____header_global_666de59f18a617b8 = ((((((577) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6d3324da9a2b4d1b0c747170() {
  return __cxx_static_address_6d3324da9a2b4d1b0c747170.reference || (__cxx_static_address_6d3324da9a2b4d1b0c747170.reference = {
    __cReference: true,
    get value() { return FEMMAG2____header_global_666de59f18a617b8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:339
export const REACTOR2____header_global_a454cc91d691155b = ((((((578) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c5e6450dcebaa1311dea77db() {
  return __cxx_static_address_c5e6450dcebaa1311dea77db.reference || (__cxx_static_address_c5e6450dcebaa1311dea77db.reference = {
    __cReference: true,
    get value() { return REACTOR2____header_global_a454cc91d691155b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:340
export const REACTOR2BURNT____header_global_9c82cf39b1ab655e = ((((((579) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dd40dfee9228d88bd5bbe2fd() {
  return __cxx_static_address_dd40dfee9228d88bd5bbe2fd.reference || (__cxx_static_address_dd40dfee9228d88bd5bbe2fd.reference = {
    __cReference: true,
    get value() { return REACTOR2BURNT____header_global_9c82cf39b1ab655e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:341
export const REACTOR2SPARK____header_global_27b322aad09daa64 = ((((((580) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d2dc648757e5562325826b7c() {
  return __cxx_static_address_d2dc648757e5562325826b7c.reference || (__cxx_static_address_d2dc648757e5562325826b7c.reference = {
    __cReference: true,
    get value() { return REACTOR2SPARK____header_global_27b322aad09daa64; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:342
export const GRATE1____header_global_3a619ea101f3be49 = ((((((595) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_34495f1c7694da7d7410a890() {
  return __cxx_static_address_34495f1c7694da7d7410a890.reference || (__cxx_static_address_34495f1c7694da7d7410a890.reference = {
    __cReference: true,
    get value() { return GRATE1____header_global_3a619ea101f3be49; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:343
export const BGRATE1____header_global_4d2b44858d876790 = ((((((596) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8cbf97a41eb4005ba6c7b293() {
  return __cxx_static_address_8cbf97a41eb4005ba6c7b293.reference || (__cxx_static_address_8cbf97a41eb4005ba6c7b293.reference = {
    __cReference: true,
    get value() { return BGRATE1____header_global_4d2b44858d876790; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:344
export const SOLARPANNEL____header_global_d2ba3409c7c9b872 = ((((((602) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_887c046bfa3bbf501e3e19c2() {
  return __cxx_static_address_887c046bfa3bbf501e3e19c2.reference || (__cxx_static_address_887c046bfa3bbf501e3e19c2.reference = {
    __cReference: true,
    get value() { return SOLARPANNEL____header_global_d2ba3409c7c9b872; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:345
export const NAKED1____header_global_a84c08efa405b217 = ((((((603) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c9e2e771cae1664fabe71547() {
  return __cxx_static_address_c9e2e771cae1664fabe71547.reference || (__cxx_static_address_c9e2e771cae1664fabe71547.reference = {
    __cReference: true,
    get value() { return NAKED1____header_global_a84c08efa405b217; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:346
export const ANTENNA____header_global_272c01a7bf4a834d = ((((((607) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e4faf638578832d4759639ae() {
  return __cxx_static_address_e4faf638578832d4759639ae.reference || (__cxx_static_address_e4faf638578832d4759639ae.reference = {
    __cReference: true,
    get value() { return ANTENNA____header_global_272c01a7bf4a834d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:347
export const MASKWALL12____header_global_8b9e7b6ca311424d = ((((((609) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d57893c4368ee5cebd52f7c4() {
  return __cxx_static_address_d57893c4368ee5cebd52f7c4.reference || (__cxx_static_address_d57893c4368ee5cebd52f7c4.reference = {
    __cReference: true,
    get value() { return MASKWALL12____header_global_8b9e7b6ca311424d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:348
export const TOILETBROKE____header_global_136bebd581cc3a4b = ((((((615) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_28b422ba7aeac5d56abc1cee() {
  return __cxx_static_address_28b422ba7aeac5d56abc1cee.reference || (__cxx_static_address_28b422ba7aeac5d56abc1cee.reference = {
    __cReference: true,
    get value() { return TOILETBROKE____header_global_136bebd581cc3a4b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:349
export const PIPE2____header_global_e0995b8b90adab2c = ((((((616) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ac010b0028b4f1470197d182() {
  return __cxx_static_address_ac010b0028b4f1470197d182.reference || (__cxx_static_address_ac010b0028b4f1470197d182.reference = {
    __cReference: true,
    get value() { return PIPE2____header_global_e0995b8b90adab2c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:350
export const PIPE1B____header_global_574f5dfc928ba133 = ((((((617) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a1e3b4497af6b07a9a914ac3() {
  return __cxx_static_address_a1e3b4497af6b07a9a914ac3.reference || (__cxx_static_address_a1e3b4497af6b07a9a914ac3.reference = {
    __cReference: true,
    get value() { return PIPE1B____header_global_574f5dfc928ba133; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:351
export const PIPE3____header_global_aab4f3db119ea1c4 = ((((((618) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_232fabc5369f05b937457c27() {
  return __cxx_static_address_232fabc5369f05b937457c27.reference || (__cxx_static_address_232fabc5369f05b937457c27.reference = {
    __cReference: true,
    get value() { return PIPE3____header_global_aab4f3db119ea1c4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:352
export const PIPE1____header_global_3cf266c48289f870 = ((((((619) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f0c270e0df62e6b32b72e5e6() {
  return __cxx_static_address_f0c270e0df62e6b32b72e5e6.reference || (__cxx_static_address_f0c270e0df62e6b32b72e5e6.reference = {
    __cReference: true,
    get value() { return PIPE1____header_global_3cf266c48289f870; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:353
export const CAMERA1____header_global_83f4057bab8b0473 = ((((((621) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_502ec8f7d254df945ae30b30() {
  return __cxx_static_address_502ec8f7d254df945ae30b30.reference || (__cxx_static_address_502ec8f7d254df945ae30b30.reference = {
    __cReference: true,
    get value() { return CAMERA1____header_global_83f4057bab8b0473; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:354
export const PIPE2B____header_global_6a83acf19410012a = ((((((633) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e7c1a873eb0b1aa02c93cf1a() {
  return __cxx_static_address_e7c1a873eb0b1aa02c93cf1a.reference || (__cxx_static_address_e7c1a873eb0b1aa02c93cf1a.reference = {
    __cReference: true,
    get value() { return PIPE2B____header_global_6a83acf19410012a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:355
export const BOLT1____header_global_e00cf3cd67eaab7d = ((((((634) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4df9bc31ae0ee7e81831d30d() {
  return __cxx_static_address_4df9bc31ae0ee7e81831d30d.reference || (__cxx_static_address_4df9bc31ae0ee7e81831d30d.reference = {
    __cReference: true,
    get value() { return BOLT1____header_global_e00cf3cd67eaab7d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:356
export const W_NUMBERS____header_global_1eb2d053fdeb45b6 = ((((((640) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1d0a1f8b70a832e28d00dff6() {
  return __cxx_static_address_1d0a1f8b70a832e28d00dff6.reference || (__cxx_static_address_1d0a1f8b70a832e28d00dff6.reference = {
    __cReference: true,
    get value() { return W_NUMBERS____header_global_1eb2d053fdeb45b6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:357
export const WATERDRIP____header_global_f8cb60940f177db2 = ((((((660) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9d2b2cb73edcfa97b80ca119() {
  return __cxx_static_address_9d2b2cb73edcfa97b80ca119.reference || (__cxx_static_address_9d2b2cb73edcfa97b80ca119.reference = {
    __cReference: true,
    get value() { return WATERDRIP____header_global_f8cb60940f177db2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:358
export const WATERBUBBLE____header_global_866b1f1b9f6dc81b = ((((((661) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bd042c5bc399830b49fae3b7() {
  return __cxx_static_address_bd042c5bc399830b49fae3b7.reference || (__cxx_static_address_bd042c5bc399830b49fae3b7.reference = {
    __cReference: true,
    get value() { return WATERBUBBLE____header_global_866b1f1b9f6dc81b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:359
export const WATERBUBBLEMAKER____header_global_51242c41b20f19e1 = ((((((662) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_779cd25e671a46be3c60998a() {
  return __cxx_static_address_779cd25e671a46be3c60998a.reference || (__cxx_static_address_779cd25e671a46be3c60998a.reference = {
    __cReference: true,
    get value() { return WATERBUBBLEMAKER____header_global_51242c41b20f19e1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:360
export const W_FORCEFIELD____header_global_9937de77db6c015a = ((((((663) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3156fd22d689e21bcb82ab9c() {
  return __cxx_static_address_3156fd22d689e21bcb82ab9c.reference || (__cxx_static_address_3156fd22d689e21bcb82ab9c.reference = {
    __cReference: true,
    get value() { return W_FORCEFIELD____header_global_9937de77db6c015a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:361
export const VACUUM____header_global_ffaeba61267f1d32 = ((((((669) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_01215632e49d2f9bffbe6ed4() {
  return __cxx_static_address_01215632e49d2f9bffbe6ed4.reference || (__cxx_static_address_01215632e49d2f9bffbe6ed4.reference = {
    __cReference: true,
    get value() { return VACUUM____header_global_ffaeba61267f1d32; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:362
export const FOOTPRINTS2____header_global_afd5d89310853e72 = ((((((672) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_20ece1c3d0c7b1da802ad30f() {
  return __cxx_static_address_20ece1c3d0c7b1da802ad30f.reference || (__cxx_static_address_20ece1c3d0c7b1da802ad30f.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS2____header_global_afd5d89310853e72; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:363
export const FOOTPRINTS3____header_global_837ff31ce692732e = ((((((673) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c79b47fde69f30994c75f889() {
  return __cxx_static_address_c79b47fde69f30994c75f889.reference || (__cxx_static_address_c79b47fde69f30994c75f889.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS3____header_global_837ff31ce692732e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:364
export const FOOTPRINTS4____header_global_7a20912b69e78b1a = ((((((674) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1c96382db5d9399f75f92410() {
  return __cxx_static_address_1c96382db5d9399f75f92410.reference || (__cxx_static_address_1c96382db5d9399f75f92410.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS4____header_global_7a20912b69e78b1a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:365
export const EGG____header_global_efdc4aece2de8f8c = ((((((675) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_59b19edc16eb722f70e5b934() {
  return __cxx_static_address_59b19edc16eb722f70e5b934.reference || (__cxx_static_address_59b19edc16eb722f70e5b934.reference = {
    __cReference: true,
    get value() { return EGG____header_global_efdc4aece2de8f8c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:366
export const SCALE____header_global_ed8689477156f753 = ((((((678) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_552741a1ad9301a13df64e86() {
  return __cxx_static_address_552741a1ad9301a13df64e86.reference || (__cxx_static_address_552741a1ad9301a13df64e86.reference = {
    __cReference: true,
    get value() { return SCALE____header_global_ed8689477156f753; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:367
export const CHAIR3____header_global_c6554c1dd2133184 = ((((((680) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cfb0f3c89ebbb82385811883() {
  return __cxx_static_address_cfb0f3c89ebbb82385811883.reference || (__cxx_static_address_cfb0f3c89ebbb82385811883.reference = {
    __cReference: true,
    get value() { return CHAIR3____header_global_c6554c1dd2133184; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:368
export const CAMERALIGHT____header_global_fa6327e0205dd398 = ((((((685) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b51a2105a73f6b71917f0d3e() {
  return __cxx_static_address_b51a2105a73f6b71917f0d3e.reference || (__cxx_static_address_b51a2105a73f6b71917f0d3e.reference = {
    __cReference: true,
    get value() { return CAMERALIGHT____header_global_fa6327e0205dd398; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:369
export const MOVIECAMERA____header_global_e858f5b5b6c386f9 = ((((((686) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6a1bfe03f821d32cb98b1aaa() {
  return __cxx_static_address_6a1bfe03f821d32cb98b1aaa.reference || (__cxx_static_address_6a1bfe03f821d32cb98b1aaa.reference = {
    __cReference: true,
    get value() { return MOVIECAMERA____header_global_e858f5b5b6c386f9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:370
export const IVUNIT____header_global_10119da82a14d81c = ((((((689) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e5bf2fea3dc81953ca391dd9() {
  return __cxx_static_address_e5bf2fea3dc81953ca391dd9.reference || (__cxx_static_address_e5bf2fea3dc81953ca391dd9.reference = {
    __cReference: true,
    get value() { return IVUNIT____header_global_10119da82a14d81c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:371
export const POT1____header_global_c70d3a9a37ac6f88 = ((((((694) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e9a0e85a5df4ff70edee8c23() {
  return __cxx_static_address_e9a0e85a5df4ff70edee8c23.reference || (__cxx_static_address_e9a0e85a5df4ff70edee8c23.reference = {
    __cReference: true,
    get value() { return POT1____header_global_c70d3a9a37ac6f88; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:372
export const POT2____header_global_23b9d7ac188466d9 = ((((((695) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_605520746d761ecd4d728b3d() {
  return __cxx_static_address_605520746d761ecd4d728b3d.reference || (__cxx_static_address_605520746d761ecd4d728b3d.reference = {
    __cReference: true,
    get value() { return POT2____header_global_23b9d7ac188466d9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:373
export const POT3____header_global_c3c5a7f1e54109fc = ((((((697) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4623342f7a0e213f1a18f736() {
  return __cxx_static_address_4623342f7a0e213f1a18f736.reference || (__cxx_static_address_4623342f7a0e213f1a18f736.reference = {
    __cReference: true,
    get value() { return POT3____header_global_c3c5a7f1e54109fc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:374
export const PIPE3B____header_global_78a959b445add4b2 = ((((((700) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_19e3bcaff200cbc213cc2ab0() {
  return __cxx_static_address_19e3bcaff200cbc213cc2ab0.reference || (__cxx_static_address_19e3bcaff200cbc213cc2ab0.reference = {
    __cReference: true,
    get value() { return PIPE3B____header_global_78a959b445add4b2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:375
export const WALLLIGHT3____header_global_a4bcd9e6a154b807 = ((((((701) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9858b5b8da1d3d8d844757a9() {
  return __cxx_static_address_9858b5b8da1d3d8d844757a9.reference || (__cxx_static_address_9858b5b8da1d3d8d844757a9.reference = {
    __cReference: true,
    get value() { return WALLLIGHT3____header_global_a4bcd9e6a154b807; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:376
export const WALLLIGHTBUST3____header_global_d805e0826b54c416 = ((((((702) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c1ef3b51d69c9ab777ed0f99() {
  return __cxx_static_address_c1ef3b51d69c9ab777ed0f99.reference || (__cxx_static_address_c1ef3b51d69c9ab777ed0f99.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST3____header_global_d805e0826b54c416; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:377
export const WALLLIGHT1____header_global_4bebc28ea2226d00 = ((((((703) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d69fbd91d72bf51796de2146() {
  return __cxx_static_address_d69fbd91d72bf51796de2146.reference || (__cxx_static_address_d69fbd91d72bf51796de2146.reference = {
    __cReference: true,
    get value() { return WALLLIGHT1____header_global_4bebc28ea2226d00; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:378
export const WALLLIGHTBUST1____header_global_da71a56c829b8249 = ((((((704) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_662e481e6b89fc969b532a7d() {
  return __cxx_static_address_662e481e6b89fc969b532a7d.reference || (__cxx_static_address_662e481e6b89fc969b532a7d.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST1____header_global_da71a56c829b8249; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:379
export const WALLLIGHT2____header_global_a58e7098662c2d21 = ((((((705) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7fcc886dd08d91faf8d1cac0() {
  return __cxx_static_address_7fcc886dd08d91faf8d1cac0.reference || (__cxx_static_address_7fcc886dd08d91faf8d1cac0.reference = {
    __cReference: true,
    get value() { return WALLLIGHT2____header_global_a58e7098662c2d21; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:380
export const WALLLIGHTBUST2____header_global_6bf3dc90f29205b9 = ((((((706) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ecafb5667ea5c472f731dd5b() {
  return __cxx_static_address_ecafb5667ea5c472f731dd5b.reference || (__cxx_static_address_ecafb5667ea5c472f731dd5b.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST2____header_global_6bf3dc90f29205b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:381
export const LIGHTSWITCH2____header_global_5c5ec799fdf05a81 = ((((((712) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7d9e1db7e40dff3d72bc18b5() {
  return __cxx_static_address_7d9e1db7e40dff3d72bc18b5.reference || (__cxx_static_address_7d9e1db7e40dff3d72bc18b5.reference = {
    __cReference: true,
    get value() { return LIGHTSWITCH2____header_global_5c5ec799fdf05a81; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:382
export const WAITTOBESEATED____header_global_fdf66f1a84d3f23b = ((((((716) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9d74bea0062f3b2de5b1e1c6() {
  return __cxx_static_address_9d74bea0062f3b2de5b1e1c6.reference || (__cxx_static_address_9d74bea0062f3b2de5b1e1c6.reference = {
    __cReference: true,
    get value() { return WAITTOBESEATED____header_global_fdf66f1a84d3f23b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:383
export const DOORTILE14____header_global_dd2acc0f99075e35 = ((((((717) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d45d0dfbf29bff8996d94d2c() {
  return __cxx_static_address_d45d0dfbf29bff8996d94d2c.reference || (__cxx_static_address_d45d0dfbf29bff8996d94d2c.reference = {
    __cReference: true,
    get value() { return DOORTILE14____header_global_dd2acc0f99075e35; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:384
export const STATUE____header_global_5b2e74d8ccf74c3f = ((((((753) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d222fca7943459891de52ace() {
  return __cxx_static_address_d222fca7943459891de52ace.reference || (__cxx_static_address_d222fca7943459891de52ace.reference = {
    __cReference: true,
    get value() { return STATUE____header_global_5b2e74d8ccf74c3f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:385
export const MIKE____header_global_3bf1768a1acea5e4 = ((((((762) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_88743c0fada7947462e90c97() {
  return __cxx_static_address_88743c0fada7947462e90c97.reference || (__cxx_static_address_88743c0fada7947462e90c97.reference = {
    __cReference: true,
    get value() { return MIKE____header_global_3bf1768a1acea5e4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:386
export const VASE____header_global_0a5b3bbcd831e484 = ((((((765) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_413681049779b53cb7b71ec8() {
  return __cxx_static_address_413681049779b53cb7b71ec8.reference || (__cxx_static_address_413681049779b53cb7b71ec8.reference = {
    __cReference: true,
    get value() { return VASE____header_global_0a5b3bbcd831e484; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:387
export const SUSHIPLATE1____header_global_9719236f1d12f485 = ((((((768) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4c33df01c648302b88326805() {
  return __cxx_static_address_4c33df01c648302b88326805.reference || (__cxx_static_address_4c33df01c648302b88326805.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE1____header_global_9719236f1d12f485; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:388
export const SUSHIPLATE2____header_global_4d07059c260e95b8 = ((((((769) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_590d9eb4dcade4206c2686b1() {
  return __cxx_static_address_590d9eb4dcade4206c2686b1.reference || (__cxx_static_address_590d9eb4dcade4206c2686b1.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE2____header_global_4d07059c260e95b8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:389
export const SUSHIPLATE3____header_global_8ee16373c1b1a17d = ((((((774) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_111638abbfe5220ec6eb3203() {
  return __cxx_static_address_111638abbfe5220ec6eb3203.reference || (__cxx_static_address_111638abbfe5220ec6eb3203.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE3____header_global_8ee16373c1b1a17d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:390
export const SUSHIPLATE4____header_global_031102774693e9eb = ((((((779) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_945330b124d525dfaeb831b2() {
  return __cxx_static_address_945330b124d525dfaeb831b2.reference || (__cxx_static_address_945330b124d525dfaeb831b2.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE4____header_global_031102774693e9eb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:391
export const DOORTILE16____header_global_b0327a9fbf83e14e = ((((((781) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b5fda2310cbb522d316f4090() {
  return __cxx_static_address_b5fda2310cbb522d316f4090.reference || (__cxx_static_address_b5fda2310cbb522d316f4090.reference = {
    __cReference: true,
    get value() { return DOORTILE16____header_global_b0327a9fbf83e14e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:392
export const SUSHIPLATE5____header_global_7663ad4b2f7103f5 = ((((((792) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3f1958394b95c267a80a4617() {
  return __cxx_static_address_3f1958394b95c267a80a4617.reference || (__cxx_static_address_3f1958394b95c267a80a4617.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE5____header_global_7663ad4b2f7103f5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:393
export const OJ____header_global_06b6da81b0c59a7a = ((((((806) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a627910338eedd17a7498638() {
  return __cxx_static_address_a627910338eedd17a7498638.reference || (__cxx_static_address_a627910338eedd17a7498638.reference = {
    __cReference: true,
    get value() { return OJ____header_global_06b6da81b0c59a7a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:394
export const MASKWALL13____header_global_e5379e274485f058 = ((((((830) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3265446d05aeb47cf8a0bea9() {
  return __cxx_static_address_3265446d05aeb47cf8a0bea9.reference || (__cxx_static_address_3265446d05aeb47cf8a0bea9.reference = {
    __cReference: true,
    get value() { return MASKWALL13____header_global_e5379e274485f058; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:395
export const HURTRAIL____header_global_461543eebb2667b7 = ((((((859) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_31fd3f698661546269b62619() {
  return __cxx_static_address_31fd3f698661546269b62619.reference || (__cxx_static_address_31fd3f698661546269b62619.reference = {
    __cReference: true,
    get value() { return HURTRAIL____header_global_461543eebb2667b7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:396
export const POWERSWITCH1____header_global_5f6f2b1fbc395fcd = ((((((860) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e0eddc267aca236b9a5c4d0e() {
  return __cxx_static_address_e0eddc267aca236b9a5c4d0e.reference || (__cxx_static_address_e0eddc267aca236b9a5c4d0e.reference = {
    __cReference: true,
    get value() { return POWERSWITCH1____header_global_5f6f2b1fbc395fcd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:397
export const LOCKSWITCH1____header_global_93fb731d31ed5883 = ((((((862) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1505f7991d8d3055cd521153() {
  return __cxx_static_address_1505f7991d8d3055cd521153.reference || (__cxx_static_address_1505f7991d8d3055cd521153.reference = {
    __cReference: true,
    get value() { return LOCKSWITCH1____header_global_93fb731d31ed5883; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:398
export const POWERSWITCH2____header_global_7b085162e2297525 = ((((((864) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dde75b0061d2c22f181a97ce() {
  return __cxx_static_address_dde75b0061d2c22f181a97ce.reference || (__cxx_static_address_dde75b0061d2c22f181a97ce.reference = {
    __cReference: true,
    get value() { return POWERSWITCH2____header_global_7b085162e2297525; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:399
export const ATM____header_global_8d24e7aad358a49a = ((((((867) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a6f4cacd7533a0c44339e827() {
  return __cxx_static_address_a6f4cacd7533a0c44339e827.reference || (__cxx_static_address_a6f4cacd7533a0c44339e827.reference = {
    __cReference: true,
    get value() { return ATM____header_global_8d24e7aad358a49a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:400
export const STATUEFLASH____header_global_7d785d919b6260ed = ((((((869) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1605a407f5242597a6df1d41() {
  return __cxx_static_address_1605a407f5242597a6df1d41.reference || (__cxx_static_address_1605a407f5242597a6df1d41.reference = {
    __cReference: true,
    get value() { return STATUEFLASH____header_global_7d785d919b6260ed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:401
export const ATMBROKE____header_global_f7e750df58848a25 = ((((((888) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_792c058866ae255dbf33f4f1() {
  return __cxx_static_address_792c058866ae255dbf33f4f1.reference || (__cxx_static_address_792c058866ae255dbf33f4f1.reference = {
    __cReference: true,
    get value() { return ATMBROKE____header_global_f7e750df58848a25; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:402
export const STRIPEBALL____header_global_3f2a30bfe7695721 = ((((((901) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8a7c16cd7e1c1db9f11bf431() {
  return __cxx_static_address_8a7c16cd7e1c1db9f11bf431.reference || (__cxx_static_address_8a7c16cd7e1c1db9f11bf431.reference = {
    __cReference: true,
    get value() { return STRIPEBALL____header_global_3f2a30bfe7695721; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:403
export const QUEBALL____header_global_1430a34e27f041fb = ((((((902) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2a5a590caadc47831b8dfb24() {
  return __cxx_static_address_2a5a590caadc47831b8dfb24.reference || (__cxx_static_address_2a5a590caadc47831b8dfb24.reference = {
    __cReference: true,
    get value() { return QUEBALL____header_global_1430a34e27f041fb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:404
export const POCKET____header_global_b37a576e1cc628ee = ((((((903) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5b60ba9e598e3cfc7f152c1a() {
  return __cxx_static_address_5b60ba9e598e3cfc7f152c1a.reference || (__cxx_static_address_5b60ba9e598e3cfc7f152c1a.reference = {
    __cReference: true,
    get value() { return POCKET____header_global_b37a576e1cc628ee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:405
export const WOODENHORSE____header_global_c4639eab265c7017 = ((((((904) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_489cae9aca2c33398b249186() {
  return __cxx_static_address_489cae9aca2c33398b249186.reference || (__cxx_static_address_489cae9aca2c33398b249186.reference = {
    __cReference: true,
    get value() { return WOODENHORSE____header_global_c4639eab265c7017; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:406
export const TREE1____header_global_6581ea6821edc48a = ((((((908) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_98df7e4c875a3362b79f7fa5() {
  return __cxx_static_address_98df7e4c875a3362b79f7fa5.reference || (__cxx_static_address_98df7e4c875a3362b79f7fa5.reference = {
    __cReference: true,
    get value() { return TREE1____header_global_6581ea6821edc48a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:407
export const TREE2____header_global_b49aaf9cb2ba6707 = ((((((910) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fe76606db17229e9f2486fe6() {
  return __cxx_static_address_fe76606db17229e9f2486fe6.reference || (__cxx_static_address_fe76606db17229e9f2486fe6.reference = {
    __cReference: true,
    get value() { return TREE2____header_global_b49aaf9cb2ba6707; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:408
export const CACTUS____header_global_6e98cc7b8b1d1b2d = ((((((911) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5089457d8978fe21b2a7d87f() {
  return __cxx_static_address_5089457d8978fe21b2a7d87f.reference || (__cxx_static_address_5089457d8978fe21b2a7d87f.reference = {
    __cReference: true,
    get value() { return CACTUS____header_global_6e98cc7b8b1d1b2d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:409
export const MASKWALL2____header_global_80528c6120547059 = ((((((913) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ea9745f192c48cbd8132a380() {
  return __cxx_static_address_ea9745f192c48cbd8132a380.reference || (__cxx_static_address_ea9745f192c48cbd8132a380.reference = {
    __cReference: true,
    get value() { return MASKWALL2____header_global_80528c6120547059; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:410
export const MASKWALL3____header_global_8d6df46bd5c07e03 = ((((((914) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b7af042640ca2aad167a18ac() {
  return __cxx_static_address_b7af042640ca2aad167a18ac.reference || (__cxx_static_address_b7af042640ca2aad167a18ac.reference = {
    __cReference: true,
    get value() { return MASKWALL3____header_global_8d6df46bd5c07e03; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:411
export const MASKWALL4____header_global_948188a280276c32 = ((((((915) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_55687814e1486dd46f830479() {
  return __cxx_static_address_55687814e1486dd46f830479.reference || (__cxx_static_address_55687814e1486dd46f830479.reference = {
    __cReference: true,
    get value() { return MASKWALL4____header_global_948188a280276c32; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:412
export const FIREEXT____header_global_1faec34078e8a5ce = ((((((916) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7cbfb806699405601133b1ae() {
  return __cxx_static_address_7cbfb806699405601133b1ae.reference || (__cxx_static_address_7cbfb806699405601133b1ae.reference = {
    __cReference: true,
    get value() { return FIREEXT____header_global_1faec34078e8a5ce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:413
export const TOILETWATER____header_global_fada0ea7d8a6348a = ((((((921) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0a6632de0a1d18b1cefee8f6() {
  return __cxx_static_address_0a6632de0a1d18b1cefee8f6.reference || (__cxx_static_address_0a6632de0a1d18b1cefee8f6.reference = {
    __cReference: true,
    get value() { return TOILETWATER____header_global_fada0ea7d8a6348a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:414
export const NEON1____header_global_f6c840b6e49c92bc = ((((((925) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_779a2720a3fa4055a334f7e9() {
  return __cxx_static_address_779a2720a3fa4055a334f7e9.reference || (__cxx_static_address_779a2720a3fa4055a334f7e9.reference = {
    __cReference: true,
    get value() { return NEON1____header_global_f6c840b6e49c92bc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:415
export const NEON2____header_global_f573e74ee087e2cc = ((((((926) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fcfbf7672db4901bde330dc9() {
  return __cxx_static_address_fcfbf7672db4901bde330dc9.reference || (__cxx_static_address_fcfbf7672db4901bde330dc9.reference = {
    __cReference: true,
    get value() { return NEON2____header_global_f573e74ee087e2cc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:416
export const CACTUSBROKE____header_global_cf8212ecaa722687 = ((((((939) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5fbe939745738a556cda5710() {
  return __cxx_static_address_5fbe939745738a556cda5710.reference || (__cxx_static_address_5fbe939745738a556cda5710.reference = {
    __cReference: true,
    get value() { return CACTUSBROKE____header_global_cf8212ecaa722687; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:417
export const BOUNCEMINE____header_global_78501126d6f0df82 = ((((((940) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1a22398e430768a781320aa0() {
  return __cxx_static_address_1a22398e430768a781320aa0.reference || (__cxx_static_address_1a22398e430768a781320aa0.reference = {
    __cReference: true,
    get value() { return BOUNCEMINE____header_global_78501126d6f0df82; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:418
export const BROKEFIREHYDRENT____header_global_af7de37ce43cd3b6 = ((((((950) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9bdc1b0776c6f23d64e7f3e0() {
  return __cxx_static_address_9bdc1b0776c6f23d64e7f3e0.reference || (__cxx_static_address_9bdc1b0776c6f23d64e7f3e0.reference = {
    __cReference: true,
    get value() { return BROKEFIREHYDRENT____header_global_af7de37ce43cd3b6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:419
export const BOX____header_global_b8be30c395cf5a19 = ((((((951) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3bbd5325de6db0bf9468ef1b() {
  return __cxx_static_address_3bbd5325de6db0bf9468ef1b.reference || (__cxx_static_address_3bbd5325de6db0bf9468ef1b.reference = {
    __cReference: true,
    get value() { return BOX____header_global_b8be30c395cf5a19; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:420
export const BULLETHOLE____header_global_fd3ae05fe31d915a = ((((((952) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_15f5ac2b23a16b1b6677604e() {
  return __cxx_static_address_15f5ac2b23a16b1b6677604e.reference || (__cxx_static_address_15f5ac2b23a16b1b6677604e.reference = {
    __cReference: true,
    get value() { return BULLETHOLE____header_global_fd3ae05fe31d915a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:421
export const BOTTLE1____header_global_f9ac6f59f247e77a = ((((((954) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2516fd0ed875ee95b29fef5d() {
  return __cxx_static_address_2516fd0ed875ee95b29fef5d.reference || (__cxx_static_address_2516fd0ed875ee95b29fef5d.reference = {
    __cReference: true,
    get value() { return BOTTLE1____header_global_f9ac6f59f247e77a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:422
export const BOTTLE2____header_global_341488442e9c2db0 = ((((((955) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e4c61bd40d842e3159dfd89a() {
  return __cxx_static_address_e4c61bd40d842e3159dfd89a.reference || (__cxx_static_address_e4c61bd40d842e3159dfd89a.reference = {
    __cReference: true,
    get value() { return BOTTLE2____header_global_341488442e9c2db0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:423
export const BOTTLE3____header_global_d3ab047f287996f8 = ((((((956) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_342ace19afea791cdf593426() {
  return __cxx_static_address_342ace19afea791cdf593426.reference || (__cxx_static_address_342ace19afea791cdf593426.reference = {
    __cReference: true,
    get value() { return BOTTLE3____header_global_d3ab047f287996f8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:424
export const BOTTLE4____header_global_cec1b6758c1b3a93 = ((((((957) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_45ee2ac0a5b4e1614735adda() {
  return __cxx_static_address_45ee2ac0a5b4e1614735adda.reference || (__cxx_static_address_45ee2ac0a5b4e1614735adda.reference = {
    __cReference: true,
    get value() { return BOTTLE4____header_global_cec1b6758c1b3a93; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:425
export const FEMPIC5____header_global_a5781c226b00b90b = ((((((963) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c286b3a897e27146b1bcc096() {
  return __cxx_static_address_c286b3a897e27146b1bcc096.reference || (__cxx_static_address_c286b3a897e27146b1bcc096.reference = {
    __cReference: true,
    get value() { return FEMPIC5____header_global_a5781c226b00b90b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:426
export const FEMPIC6____header_global_ad5c0c100b5c7f19 = ((((((964) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fb7f210ba612d64161389b0e() {
  return __cxx_static_address_fb7f210ba612d64161389b0e.reference || (__cxx_static_address_fb7f210ba612d64161389b0e.reference = {
    __cReference: true,
    get value() { return FEMPIC6____header_global_ad5c0c100b5c7f19; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:427
export const FEMPIC7____header_global_26f2685917bac446 = ((((((965) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3a5e1eb92adbccebad836dd7() {
  return __cxx_static_address_3a5e1eb92adbccebad836dd7.reference || (__cxx_static_address_3a5e1eb92adbccebad836dd7.reference = {
    __cReference: true,
    get value() { return FEMPIC7____header_global_26f2685917bac446; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:428
export const HYDROPLANT____header_global_3b43ed54a6d9628a = ((((((969) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0ce49bef78878b6ce8bb3e31() {
  return __cxx_static_address_0ce49bef78878b6ce8bb3e31.reference || (__cxx_static_address_0ce49bef78878b6ce8bb3e31.reference = {
    __cReference: true,
    get value() { return HYDROPLANT____header_global_3b43ed54a6d9628a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:429
export const OCEANSPRITE1____header_global_124059302e03c814 = ((((((971) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7e6d56bfb6ea9967591c0635() {
  return __cxx_static_address_7e6d56bfb6ea9967591c0635.reference || (__cxx_static_address_7e6d56bfb6ea9967591c0635.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE1____header_global_124059302e03c814; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:430
export const OCEANSPRITE2____header_global_a84e8d40395aea73 = ((((((972) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a2868a4092d5cf58d1337a57() {
  return __cxx_static_address_a2868a4092d5cf58d1337a57.reference || (__cxx_static_address_a2868a4092d5cf58d1337a57.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE2____header_global_a84e8d40395aea73; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:431
export const OCEANSPRITE3____header_global_75f3ceb5e6ab4767 = ((((((973) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c84ae21797a2f0b97a419291() {
  return __cxx_static_address_c84ae21797a2f0b97a419291.reference || (__cxx_static_address_c84ae21797a2f0b97a419291.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE3____header_global_75f3ceb5e6ab4767; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:432
export const OCEANSPRITE4____header_global_666f3a4a7110acca = ((((((974) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6dbe462f6cb5a8f702802317() {
  return __cxx_static_address_6dbe462f6cb5a8f702802317.reference || (__cxx_static_address_6dbe462f6cb5a8f702802317.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE4____header_global_666f3a4a7110acca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:433
export const OCEANSPRITE5____header_global_c724e8ae980858df = ((((((975) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_813c041361fcf9d88563be1d() {
  return __cxx_static_address_813c041361fcf9d88563be1d.reference || (__cxx_static_address_813c041361fcf9d88563be1d.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE5____header_global_c724e8ae980858df; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:434
export const GENERICPOLE____header_global_5fdb1e312a114566 = ((((((977) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_02b3400970c4e13131b0569a() {
  return __cxx_static_address_02b3400970c4e13131b0569a.reference || (__cxx_static_address_02b3400970c4e13131b0569a.reference = {
    __cReference: true,
    get value() { return GENERICPOLE____header_global_5fdb1e312a114566; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:435
export const CONE____header_global_621f753c3d5780b1 = ((((((978) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_190825213f94ac2719ff80c8() {
  return __cxx_static_address_190825213f94ac2719ff80c8.reference || (__cxx_static_address_190825213f94ac2719ff80c8.reference = {
    __cReference: true,
    get value() { return CONE____header_global_621f753c3d5780b1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:436
export const HANGLIGHT____header_global_75e2fc7c795b94aa = ((((((979) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8f3d1578018a97bd95e4b4d6() {
  return __cxx_static_address_8f3d1578018a97bd95e4b4d6.reference || (__cxx_static_address_8f3d1578018a97bd95e4b4d6.reference = {
    __cReference: true,
    get value() { return HANGLIGHT____header_global_75e2fc7c795b94aa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:437
export const HYDRENT____header_global_ef829eef049f6fda = ((((((981) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f4864916052423d46ea135d8() {
  return __cxx_static_address_f4864916052423d46ea135d8.reference || (__cxx_static_address_f4864916052423d46ea135d8.reference = {
    __cReference: true,
    get value() { return HYDRENT____header_global_ef829eef049f6fda; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:438
export const MASKWALL14____header_global_65c904c8eb8cc4d7 = ((((((988) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a7c4082c25e1bad54ab994cd() {
  return __cxx_static_address_a7c4082c25e1bad54ab994cd.reference || (__cxx_static_address_a7c4082c25e1bad54ab994cd.reference = {
    __cReference: true,
    get value() { return MASKWALL14____header_global_65c904c8eb8cc4d7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:439
export const TIRE____header_global_5a29aef21c20899f = ((((((990) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e61d6501ad0f95cb0af4f234() {
  return __cxx_static_address_e61d6501ad0f95cb0af4f234.reference || (__cxx_static_address_e61d6501ad0f95cb0af4f234.reference = {
    __cReference: true,
    get value() { return TIRE____header_global_5a29aef21c20899f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:440
export const PIPE5____header_global_3b655a2e43974ba6 = ((((((994) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5e19464f460db6cdffae8ac9() {
  return __cxx_static_address_5e19464f460db6cdffae8ac9.reference || (__cxx_static_address_5e19464f460db6cdffae8ac9.reference = {
    __cReference: true,
    get value() { return PIPE5____header_global_3b655a2e43974ba6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:441
export const PIPE6____header_global_ee7cee24b7e2b855 = ((((((995) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fb3f79e51d5863d1b63002c3() {
  return __cxx_static_address_fb3f79e51d5863d1b63002c3.reference || (__cxx_static_address_fb3f79e51d5863d1b63002c3.reference = {
    __cReference: true,
    get value() { return PIPE6____header_global_ee7cee24b7e2b855; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:442
export const PIPE4____header_global_1d23c1a6f6790a77 = ((((((996) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8bb349a70f577895d6cbc7fc() {
  return __cxx_static_address_8bb349a70f577895d6cbc7fc.reference || (__cxx_static_address_8bb349a70f577895d6cbc7fc.reference = {
    __cReference: true,
    get value() { return PIPE4____header_global_1d23c1a6f6790a77; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:443
export const PIPE4B____header_global_69fe06fda97aebe7 = ((((((997) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cea29cd8b7c07cb528d9b2dc() {
  return __cxx_static_address_cea29cd8b7c07cb528d9b2dc.reference || (__cxx_static_address_cea29cd8b7c07cb528d9b2dc.reference = {
    __cReference: true,
    get value() { return PIPE4B____header_global_69fe06fda97aebe7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:444
export const BROKEHYDROPLANT____header_global_0db8b43f4bfdf286 = ((((((1003) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3e2078bc0c93c1e552b3f4b4() {
  return __cxx_static_address_3e2078bc0c93c1e552b3f4b4.reference || (__cxx_static_address_3e2078bc0c93c1e552b3f4b4.reference = {
    __cReference: true,
    get value() { return BROKEHYDROPLANT____header_global_0db8b43f4bfdf286; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:445
export const PIPE5B____header_global_ee205bc70b7f9f43 = ((((((1005) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5ff0d12902fe273ff97b31c5() {
  return __cxx_static_address_5ff0d12902fe273ff97b31c5.reference || (__cxx_static_address_5ff0d12902fe273ff97b31c5.reference = {
    __cReference: true,
    get value() { return PIPE5B____header_global_ee205bc70b7f9f43; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:446
export const NEON3____header_global_c273477c91e2364f = ((((((1007) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_db3a0c8b83464f4af8657824() {
  return __cxx_static_address_db3a0c8b83464f4af8657824.reference || (__cxx_static_address_db3a0c8b83464f4af8657824.reference = {
    __cReference: true,
    get value() { return NEON3____header_global_c273477c91e2364f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:447
export const NEON4____header_global_4beca2ba541c67e0 = ((((((1008) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e64e266a9b2e3bcf797368d5() {
  return __cxx_static_address_e64e266a9b2e3bcf797368d5.reference || (__cxx_static_address_e64e266a9b2e3bcf797368d5.reference = {
    __cReference: true,
    get value() { return NEON4____header_global_4beca2ba541c67e0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:448
export const NEON5____header_global_35780a586ccbc290 = ((((((1009) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7f1ccf7cb362cf2febae6b8e() {
  return __cxx_static_address_7f1ccf7cb362cf2febae6b8e.reference || (__cxx_static_address_7f1ccf7cb362cf2febae6b8e.reference = {
    __cReference: true,
    get value() { return NEON5____header_global_35780a586ccbc290; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:449
export const BOTTLE5____header_global_460184884688c57b = ((((((1012) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9f4f5bafaf2542cc70d093b1() {
  return __cxx_static_address_9f4f5bafaf2542cc70d093b1.reference || (__cxx_static_address_9f4f5bafaf2542cc70d093b1.reference = {
    __cReference: true,
    get value() { return BOTTLE5____header_global_460184884688c57b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:450
export const BOTTLE6____header_global_dec647a474276527 = ((((((1013) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2a91cd2f0afbbc8e3ee8bab6() {
  return __cxx_static_address_2a91cd2f0afbbc8e3ee8bab6.reference || (__cxx_static_address_2a91cd2f0afbbc8e3ee8bab6.reference = {
    __cReference: true,
    get value() { return BOTTLE6____header_global_dec647a474276527; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:451
export const BOTTLE8____header_global_515ddf5d710747c5 = ((((((1014) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9a53d4e64fafbba8d05ce37b() {
  return __cxx_static_address_9a53d4e64fafbba8d05ce37b.reference || (__cxx_static_address_9a53d4e64fafbba8d05ce37b.reference = {
    __cReference: true,
    get value() { return BOTTLE8____header_global_515ddf5d710747c5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:452
export const SPOTLITE____header_global_f210ac4890119367 = ((((((1020) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e2670e0e522f2d0d1484a3e5() {
  return __cxx_static_address_e2670e0e522f2d0d1484a3e5.reference || (__cxx_static_address_e2670e0e522f2d0d1484a3e5.reference = {
    __cReference: true,
    get value() { return SPOTLITE____header_global_f210ac4890119367; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:453
export const MASKWALL15____header_global_11e21e9bb515695e = ((((((1024) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_392630743cd62b8b509bb4bc() {
  return __cxx_static_address_392630743cd62b8b509bb4bc.reference || (__cxx_static_address_392630743cd62b8b509bb4bc.reference = {
    __cReference: true,
    get value() { return MASKWALL15____header_global_11e21e9bb515695e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:454
export const BOTTLE7____header_global_2cd3bad210113fd5 = ((((((1025) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_280674bd967bddb39665ead4() {
  return __cxx_static_address_280674bd967bddb39665ead4.reference || (__cxx_static_address_280674bd967bddb39665ead4.reference = {
    __cReference: true,
    get value() { return BOTTLE7____header_global_2cd3bad210113fd5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:455
export const HORSEONSIDE____header_global_cdda87947c3100f5 = ((((((1026) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7f7fa88721a138c76ac943d9() {
  return __cxx_static_address_7f7fa88721a138c76ac943d9.reference || (__cxx_static_address_7f7fa88721a138c76ac943d9.reference = {
    __cReference: true,
    get value() { return HORSEONSIDE____header_global_cdda87947c3100f5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:456
export const GLASSPIECES____header_global_8a423b257f4fd61f = ((((((1031) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ef6b1becc674b8934ce41681() {
  return __cxx_static_address_ef6b1becc674b8934ce41681.reference || (__cxx_static_address_ef6b1becc674b8934ce41681.reference = {
    __cReference: true,
    get value() { return GLASSPIECES____header_global_8a423b257f4fd61f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:457
export const NEON6____header_global_1f33dcb6f78f8735 = ((((((1046) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_58e4e5c4aed48cd3ad4e1c33() {
  return __cxx_static_address_58e4e5c4aed48cd3ad4e1c33.reference || (__cxx_static_address_58e4e5c4aed48cd3ad4e1c33.reference = {
    __cReference: true,
    get value() { return NEON6____header_global_1f33dcb6f78f8735; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:458
export const MASKWALL6____header_global_91013889e257315f = ((((((1059) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5e3b5755fb1d8bfda4381306() {
  return __cxx_static_address_5e3b5755fb1d8bfda4381306.reference || (__cxx_static_address_5e3b5755fb1d8bfda4381306.reference = {
    __cReference: true,
    get value() { return MASKWALL6____header_global_91013889e257315f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:459
export const RUBBERCAN____header_global_1eaa0709b54a95f8 = ((((((1062) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e76987da5ad5c70da473d5b() {
  return __cxx_static_address_1e76987da5ad5c70da473d5b.reference || (__cxx_static_address_1e76987da5ad5c70da473d5b.reference = {
    __cReference: true,
    get value() { return RUBBERCAN____header_global_1eaa0709b54a95f8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:460
export const PLUG____header_global_d323c208527ca269 = ((((((1069) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_39ba2c7994fefc96e09e237e() {
  return __cxx_static_address_39ba2c7994fefc96e09e237e.reference || (__cxx_static_address_39ba2c7994fefc96e09e237e.reference = {
    __cReference: true,
    get value() { return PLUG____header_global_d323c208527ca269; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:461
export const OOZFILTER____header_global_2b9dff0928b9e3a7 = ((((((1079) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b8ad2672cf81f245e7473d28() {
  return __cxx_static_address_b8ad2672cf81f245e7473d28.reference || (__cxx_static_address_b8ad2672cf81f245e7473d28.reference = {
    __cReference: true,
    get value() { return OOZFILTER____header_global_2b9dff0928b9e3a7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:462
export const FLOORPLASMA____header_global_ffd5c5f8912c1751 = ((((((1082) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6321bb4f829b16d1367e0f9d() {
  return __cxx_static_address_6321bb4f829b16d1367e0f9d.reference || (__cxx_static_address_6321bb4f829b16d1367e0f9d.reference = {
    __cReference: true,
    get value() { return FLOORPLASMA____header_global_ffd5c5f8912c1751; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:463
export const REACTOR____header_global_310aedff2de22019 = ((((((1088) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4c2bcaaebd779d1eca6a3a86() {
  return __cxx_static_address_4c2bcaaebd779d1eca6a3a86.reference || (__cxx_static_address_4c2bcaaebd779d1eca6a3a86.reference = {
    __cReference: true,
    get value() { return REACTOR____header_global_310aedff2de22019; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:464
export const REACTORSPARK____header_global_bdae268ff0e940d8 = ((((((1092) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e60636fb974362431ba033ca() {
  return __cxx_static_address_e60636fb974362431ba033ca.reference || (__cxx_static_address_e60636fb974362431ba033ca.reference = {
    __cReference: true,
    get value() { return REACTORSPARK____header_global_bdae268ff0e940d8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:465
export const REACTORBURNT____header_global_fb40feede235d5e0 = ((((((1096) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b38b6bc570bb7756f01cedc4() {
  return __cxx_static_address_b38b6bc570bb7756f01cedc4.reference || (__cxx_static_address_b38b6bc570bb7756f01cedc4.reference = {
    __cReference: true,
    get value() { return REACTORBURNT____header_global_fb40feede235d5e0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:466
export const DOORTILE15____header_global_f3cd9c58ab89937f = ((((((1102) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e7ca429bd1e18e0609dceb2c() {
  return __cxx_static_address_e7ca429bd1e18e0609dceb2c.reference || (__cxx_static_address_e7ca429bd1e18e0609dceb2c.reference = {
    __cReference: true,
    get value() { return DOORTILE15____header_global_f3cd9c58ab89937f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:467
export const HANDSWITCH____header_global_3a4e8616ee1d7642 = ((((((1111) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_829d32e3cafae370b99d6283() {
  return __cxx_static_address_829d32e3cafae370b99d6283.reference || (__cxx_static_address_829d32e3cafae370b99d6283.reference = {
    __cReference: true,
    get value() { return HANDSWITCH____header_global_3a4e8616ee1d7642; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:468
export const CIRCLEPANNEL____header_global_f4b06982e1bde58c = ((((((1113) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_97a3b6f8cec7be299d0b2274() {
  return __cxx_static_address_97a3b6f8cec7be299d0b2274.reference || (__cxx_static_address_97a3b6f8cec7be299d0b2274.reference = {
    __cReference: true,
    get value() { return CIRCLEPANNEL____header_global_f4b06982e1bde58c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:469
export const CIRCLEPANNELBROKE____header_global_71f05fff58e1b54e = ((((((1114) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2a89e649768f763c16f0fce9() {
  return __cxx_static_address_2a89e649768f763c16f0fce9.reference || (__cxx_static_address_2a89e649768f763c16f0fce9.reference = {
    __cReference: true,
    get value() { return CIRCLEPANNELBROKE____header_global_71f05fff58e1b54e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:470
export const PULLSWITCH____header_global_89407edb058559f6 = ((((((1122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a2aa5eead861c2373e4d5c70() {
  return __cxx_static_address_a2aa5eead861c2373e4d5c70.reference || (__cxx_static_address_a2aa5eead861c2373e4d5c70.reference = {
    __cReference: true,
    get value() { return PULLSWITCH____header_global_89407edb058559f6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:471
export const MASKWALL8____header_global_03f325dfa42ab99a = ((((((1124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_efc99e7185bce0e9e37746cc() {
  return __cxx_static_address_efc99e7185bce0e9e37746cc.reference || (__cxx_static_address_efc99e7185bce0e9e37746cc.reference = {
    __cReference: true,
    get value() { return MASKWALL8____header_global_03f325dfa42ab99a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:472
export const BIGHOLE____header_global_c1e8fadd870b7e4d = ((((((1141) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_60bbf6c3ec40eaed062f27c6() {
  return __cxx_static_address_60bbf6c3ec40eaed062f27c6.reference || (__cxx_static_address_60bbf6c3ec40eaed062f27c6.reference = {
    __cReference: true,
    get value() { return BIGHOLE____header_global_c1e8fadd870b7e4d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:473
export const ALIENSWITCH____header_global_c3015ff1693958c6 = ((((((1142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ffaac8c8adb7ab0d41e630fc() {
  return __cxx_static_address_ffaac8c8adb7ab0d41e630fc.reference || (__cxx_static_address_ffaac8c8adb7ab0d41e630fc.reference = {
    __cReference: true,
    get value() { return ALIENSWITCH____header_global_c3015ff1693958c6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:474
export const DOORTILE21____header_global_c81e4aeb8fc12019 = ((((((1144) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3868c76ff90414fdf36d6b54() {
  return __cxx_static_address_3868c76ff90414fdf36d6b54.reference || (__cxx_static_address_3868c76ff90414fdf36d6b54.reference = {
    __cReference: true,
    get value() { return DOORTILE21____header_global_c81e4aeb8fc12019; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:475
export const HANDPRINTSWITCH____header_global_0d5248a740019227 = ((((((1155) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9a8e2938c87e4c93478576c8() {
  return __cxx_static_address_9a8e2938c87e4c93478576c8.reference || (__cxx_static_address_9a8e2938c87e4c93478576c8.reference = {
    __cReference: true,
    get value() { return HANDPRINTSWITCH____header_global_0d5248a740019227; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:476
export const BOTTLE10____header_global_f784d3e0f28b6c19 = ((((((1157) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b3c8ab75d0f812b8d9ee8364() {
  return __cxx_static_address_b3c8ab75d0f812b8d9ee8364.reference || (__cxx_static_address_b3c8ab75d0f812b8d9ee8364.reference = {
    __cReference: true,
    get value() { return BOTTLE10____header_global_f784d3e0f28b6c19; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:477
export const BOTTLE11____header_global_44248386133b1f75 = ((((((1158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8208b3041750b6d0d0943801() {
  return __cxx_static_address_8208b3041750b6d0d0943801.reference || (__cxx_static_address_8208b3041750b6d0d0943801.reference = {
    __cReference: true,
    get value() { return BOTTLE11____header_global_44248386133b1f75; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:478
export const BOTTLE12____header_global_6e88c1a8989965de = ((((((1159) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9d1155a4b1e05c233219eea7() {
  return __cxx_static_address_9d1155a4b1e05c233219eea7.reference || (__cxx_static_address_9d1155a4b1e05c233219eea7.reference = {
    __cReference: true,
    get value() { return BOTTLE12____header_global_6e88c1a8989965de; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:479
export const BOTTLE13____header_global_fdcf98e8dff48bc5 = ((((((1160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_80319d3b34f9fa529e920c23() {
  return __cxx_static_address_80319d3b34f9fa529e920c23.reference || (__cxx_static_address_80319d3b34f9fa529e920c23.reference = {
    __cReference: true,
    get value() { return BOTTLE13____header_global_fdcf98e8dff48bc5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:480
export const BOTTLE14____header_global_00eb75e1e0536d52 = ((((((1161) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_68c0bf41fa5c8366c991a88c() {
  return __cxx_static_address_68c0bf41fa5c8366c991a88c.reference || (__cxx_static_address_68c0bf41fa5c8366c991a88c.reference = {
    __cReference: true,
    get value() { return BOTTLE14____header_global_00eb75e1e0536d52; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:481
export const BOTTLE15____header_global_e2f07027c7966f52 = ((((((1162) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2981a2bd9dead11779c9bf75() {
  return __cxx_static_address_2981a2bd9dead11779c9bf75.reference || (__cxx_static_address_2981a2bd9dead11779c9bf75.reference = {
    __cReference: true,
    get value() { return BOTTLE15____header_global_e2f07027c7966f52; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:482
export const BOTTLE16____header_global_0265ef7e0a84259d = ((((((1163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2a24e777d915e2ebad06cae3() {
  return __cxx_static_address_2a24e777d915e2ebad06cae3.reference || (__cxx_static_address_2a24e777d915e2ebad06cae3.reference = {
    __cReference: true,
    get value() { return BOTTLE16____header_global_0265ef7e0a84259d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:483
export const BOTTLE17____header_global_e61ce1fcc415ec9e = ((((((1164) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aa31a63cb9a4fa304811004f() {
  return __cxx_static_address_aa31a63cb9a4fa304811004f.reference || (__cxx_static_address_aa31a63cb9a4fa304811004f.reference = {
    __cReference: true,
    get value() { return BOTTLE17____header_global_e61ce1fcc415ec9e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:484
export const BOTTLE18____header_global_68068483ef3692d4 = ((((((1165) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e70ccd8167ac066f794acee9() {
  return __cxx_static_address_e70ccd8167ac066f794acee9.reference || (__cxx_static_address_e70ccd8167ac066f794acee9.reference = {
    __cReference: true,
    get value() { return BOTTLE18____header_global_68068483ef3692d4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:485
export const BOTTLE19____header_global_719127364f94f023 = ((((((1166) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3ea945048cfd3bb5daaf4ccb() {
  return __cxx_static_address_3ea945048cfd3bb5daaf4ccb.reference || (__cxx_static_address_3ea945048cfd3bb5daaf4ccb.reference = {
    __cReference: true,
    get value() { return BOTTLE19____header_global_719127364f94f023; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:486
export const DOORTILE17____header_global_a4417e45c171bebf = ((((((1169) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e0ba353a69fbdf7f1ee373d() {
  return __cxx_static_address_1e0ba353a69fbdf7f1ee373d.reference || (__cxx_static_address_1e0ba353a69fbdf7f1ee373d.reference = {
    __cReference: true,
    get value() { return DOORTILE17____header_global_a4417e45c171bebf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:487
export const MASKWALL7____header_global_e7dbe32fbd00d86c = ((((((1174) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0163503181da6d17bc9da863() {
  return __cxx_static_address_0163503181da6d17bc9da863.reference || (__cxx_static_address_0163503181da6d17bc9da863.reference = {
    __cReference: true,
    get value() { return MASKWALL7____header_global_e7dbe32fbd00d86c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:488
export const DOORTILE11____header_global_7e9d1fc745862a98 = ((((((1178) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_464dc4b947a3a7e63c102646() {
  return __cxx_static_address_464dc4b947a3a7e63c102646.reference || (__cxx_static_address_464dc4b947a3a7e63c102646.reference = {
    __cReference: true,
    get value() { return DOORTILE11____header_global_7e9d1fc745862a98; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:489
export const DOORTILE12____header_global_e86b53ed5a59d8e0 = ((((((1179) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eabe34a8b99f9b3327757abf() {
  return __cxx_static_address_eabe34a8b99f9b3327757abf.reference || (__cxx_static_address_eabe34a8b99f9b3327757abf.reference = {
    __cReference: true,
    get value() { return DOORTILE12____header_global_e86b53ed5a59d8e0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:490
export const VENDMACHINE____header_global_3cf990eae17ff8d8 = ((((((1212) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fd13bc4f2d29e7b104a4e67e() {
  return __cxx_static_address_fd13bc4f2d29e7b104a4e67e.reference || (__cxx_static_address_fd13bc4f2d29e7b104a4e67e.reference = {
    __cReference: true,
    get value() { return VENDMACHINE____header_global_3cf990eae17ff8d8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:491
export const COLAMACHINE____header_global_88f951e7a4846725 = ((((((1215) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_00809c23adbfc328057104f9() {
  return __cxx_static_address_00809c23adbfc328057104f9.reference || (__cxx_static_address_00809c23adbfc328057104f9.reference = {
    __cReference: true,
    get value() { return COLAMACHINE____header_global_88f951e7a4846725; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:492
export const CRANEPOLE____header_global_9a2f8ff58c5e51a3 = ((((((1221) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_764f9aaf5808b7500234e546() {
  return __cxx_static_address_764f9aaf5808b7500234e546.reference || (__cxx_static_address_764f9aaf5808b7500234e546.reference = {
    __cReference: true,
    get value() { return CRANEPOLE____header_global_9a2f8ff58c5e51a3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:493
export const CRANE____header_global_e384d49703bb1b29 = ((((((1222) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6f8a93ae87341233c6433617() {
  return __cxx_static_address_6f8a93ae87341233c6433617.reference || (__cxx_static_address_6f8a93ae87341233c6433617.reference = {
    __cReference: true,
    get value() { return CRANE____header_global_e384d49703bb1b29; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:494
export const BARBROKE____header_global_f1735fe25c191815 = ((((((1225) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_502323b6322950d201b7de6e() {
  return __cxx_static_address_502323b6322950d201b7de6e.reference || (__cxx_static_address_502323b6322950d201b7de6e.reference = {
    __cReference: true,
    get value() { return BARBROKE____header_global_f1735fe25c191815; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:495
export const BLOODPOOL____header_global_e5b1fde0ad7ace08 = ((((((1226) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_09e6970140fce3f99d2844e2() {
  return __cxx_static_address_09e6970140fce3f99d2844e2.reference || (__cxx_static_address_09e6970140fce3f99d2844e2.reference = {
    __cReference: true,
    get value() { return BLOODPOOL____header_global_e5b1fde0ad7ace08; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:496
export const NUKEBARREL____header_global_befc9102da1bc307 = ((((((1227) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_18f04c53ef97e51ea2cf4fca() {
  return __cxx_static_address_18f04c53ef97e51ea2cf4fca.reference || (__cxx_static_address_18f04c53ef97e51ea2cf4fca.reference = {
    __cReference: true,
    get value() { return NUKEBARREL____header_global_befc9102da1bc307; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:497
export const NUKEBARRELDENTED____header_global_37ad3b5140f2da97 = ((((((1228) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_202a604d801f04109128ff31() {
  return __cxx_static_address_202a604d801f04109128ff31.reference || (__cxx_static_address_202a604d801f04109128ff31.reference = {
    __cReference: true,
    get value() { return NUKEBARRELDENTED____header_global_37ad3b5140f2da97; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:498
export const NUKEBARRELLEAKED____header_global_fd810208d423f2c8 = ((((((1229) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bef301bec2f54a1694b965c1() {
  return __cxx_static_address_bef301bec2f54a1694b965c1.reference || (__cxx_static_address_bef301bec2f54a1694b965c1.reference = {
    __cReference: true,
    get value() { return NUKEBARRELLEAKED____header_global_fd810208d423f2c8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:499
export const CANWITHSOMETHING____header_global_84b3406fbbfe169f = ((((((1232) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_af84ab001965e216f4e9c083() {
  return __cxx_static_address_af84ab001965e216f4e9c083.reference || (__cxx_static_address_af84ab001965e216f4e9c083.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING____header_global_84b3406fbbfe169f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:500
export const MONEY____header_global_b675437e511a0ef7 = ((((((1233) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_832fb4510f130406cd00c818() {
  return __cxx_static_address_832fb4510f130406cd00c818.reference || (__cxx_static_address_832fb4510f130406cd00c818.reference = {
    __cReference: true,
    get value() { return MONEY____header_global_b675437e511a0ef7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:501
export const BANNER____header_global_1d736312c6ce31b7 = ((((((1236) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_635ea8a41909a1aa2f661d6e() {
  return __cxx_static_address_635ea8a41909a1aa2f661d6e.reference || (__cxx_static_address_635ea8a41909a1aa2f661d6e.reference = {
    __cReference: true,
    get value() { return BANNER____header_global_1d736312c6ce31b7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:502
export const EXPLODINGBARREL____header_global_af9cd946caf94ea5 = ((((((1238) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_70825df5500e0e2d6851b829() {
  return __cxx_static_address_70825df5500e0e2d6851b829.reference || (__cxx_static_address_70825df5500e0e2d6851b829.reference = {
    __cReference: true,
    get value() { return EXPLODINGBARREL____header_global_af9cd946caf94ea5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:503
export const EXPLODINGBARREL2____header_global_a89a5c4d71dc65ea = ((((((1239) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4e8fea42edc79998a0e6ab14() {
  return __cxx_static_address_4e8fea42edc79998a0e6ab14.reference || (__cxx_static_address_4e8fea42edc79998a0e6ab14.reference = {
    __cReference: true,
    get value() { return EXPLODINGBARREL2____header_global_a89a5c4d71dc65ea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:504
export const FIREBARREL____header_global_44098eff7ff99bd9 = ((((((1240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ad7285eee4466e13c0c5f444() {
  return __cxx_static_address_ad7285eee4466e13c0c5f444.reference || (__cxx_static_address_ad7285eee4466e13c0c5f444.reference = {
    __cReference: true,
    get value() { return FIREBARREL____header_global_44098eff7ff99bd9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:505
export const SEENINE____header_global_595fbcc879c42a3a = ((((((1247) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_004b129f7d0e9ce8c3d5cb7c() {
  return __cxx_static_address_004b129f7d0e9ce8c3d5cb7c.reference || (__cxx_static_address_004b129f7d0e9ce8c3d5cb7c.reference = {
    __cReference: true,
    get value() { return SEENINE____header_global_595fbcc879c42a3a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:506
export const SEENINEDEAD____header_global_5b6ed8f9c0600d0f = ((((((1248) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_17953ad62e46b3a7c8338e75() {
  return __cxx_static_address_17953ad62e46b3a7c8338e75.reference || (__cxx_static_address_17953ad62e46b3a7c8338e75.reference = {
    __cReference: true,
    get value() { return SEENINEDEAD____header_global_5b6ed8f9c0600d0f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:507
export const STEAM____header_global_1a78004f99f2dda0 = ((((((1250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_474d2ba0ad11363d50a75861() {
  return __cxx_static_address_474d2ba0ad11363d50a75861.reference || (__cxx_static_address_474d2ba0ad11363d50a75861.reference = {
    __cReference: true,
    get value() { return STEAM____header_global_1a78004f99f2dda0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:508
export const CEILINGSTEAM____header_global_24f76953d12babed = ((((((1255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1799dd4651d87e9cc220cf87() {
  return __cxx_static_address_1799dd4651d87e9cc220cf87.reference || (__cxx_static_address_1799dd4651d87e9cc220cf87.reference = {
    __cReference: true,
    get value() { return CEILINGSTEAM____header_global_24f76953d12babed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:509
export const PIPE6B____header_global_dee336c714a2fec9 = ((((((1260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1563072dc615bfe4461f6736() {
  return __cxx_static_address_1563072dc615bfe4461f6736.reference || (__cxx_static_address_1563072dc615bfe4461f6736.reference = {
    __cReference: true,
    get value() { return PIPE6B____header_global_dee336c714a2fec9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:510
export const TRANSPORTERBEAM____header_global_68f525f05976b2b9 = ((((((1261) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_76f533b726902fcf0ed11f42() {
  return __cxx_static_address_76f533b726902fcf0ed11f42.reference || (__cxx_static_address_76f533b726902fcf0ed11f42.reference = {
    __cReference: true,
    get value() { return TRANSPORTERBEAM____header_global_68f525f05976b2b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:511
export const RAT____header_global_650460ec317fb908 = ((((((1267) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dad3b8ec57ee4d1aae6c328c() {
  return __cxx_static_address_dad3b8ec57ee4d1aae6c328c.reference || (__cxx_static_address_dad3b8ec57ee4d1aae6c328c.reference = {
    __cReference: true,
    get value() { return RAT____header_global_650460ec317fb908; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:512
export const TRASH____header_global_5fcdac4b2ee21a87 = ((((((1272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e2ebe18f5f4f088763e3d8f0() {
  return __cxx_static_address_e2ebe18f5f4f088763e3d8f0.reference || (__cxx_static_address_e2ebe18f5f4f088763e3d8f0.reference = {
    __cReference: true,
    get value() { return TRASH____header_global_5fcdac4b2ee21a87; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:513
export const FEMPIC1____header_global_e42326092b49f92b = ((((((1280) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9b29b3c648dcee3c5813a5b9() {
  return __cxx_static_address_9b29b3c648dcee3c5813a5b9.reference || (__cxx_static_address_9b29b3c648dcee3c5813a5b9.reference = {
    __cReference: true,
    get value() { return FEMPIC1____header_global_e42326092b49f92b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:514
export const FEMPIC2____header_global_30bc1dc83c69973c = ((((((1289) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5553ae1a929f3aeffea781cf() {
  return __cxx_static_address_5553ae1a929f3aeffea781cf.reference || (__cxx_static_address_5553ae1a929f3aeffea781cf.reference = {
    __cReference: true,
    get value() { return FEMPIC2____header_global_30bc1dc83c69973c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:515
export const BLANKSCREEN____header_global_a6bb55c91dbdda28 = ((((((1293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_831c348ede08183f11ddf7e3() {
  return __cxx_static_address_831c348ede08183f11ddf7e3.reference || (__cxx_static_address_831c348ede08183f11ddf7e3.reference = {
    __cReference: true,
    get value() { return BLANKSCREEN____header_global_a6bb55c91dbdda28; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:516
export const PODFEM1____header_global_b3b8f2b6c4d51879 = ((((((1294) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_130716ed0ce521460aa6db39() {
  return __cxx_static_address_130716ed0ce521460aa6db39.reference || (__cxx_static_address_130716ed0ce521460aa6db39.reference = {
    __cReference: true,
    get value() { return PODFEM1____header_global_b3b8f2b6c4d51879; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:517
export const FEMPIC3____header_global_f9d66d426b4dc2b5 = ((((((1298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_598b799765bc67f619e96231() {
  return __cxx_static_address_598b799765bc67f619e96231.reference || (__cxx_static_address_598b799765bc67f619e96231.reference = {
    __cReference: true,
    get value() { return FEMPIC3____header_global_f9d66d426b4dc2b5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:518
export const FEMPIC4____header_global_be41a103f3ea39d3 = ((((((1306) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f5baadbb8b5553e4208e3ad1() {
  return __cxx_static_address_f5baadbb8b5553e4208e3ad1.reference || (__cxx_static_address_f5baadbb8b5553e4208e3ad1.reference = {
    __cReference: true,
    get value() { return FEMPIC4____header_global_be41a103f3ea39d3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:519
export const FEM1____header_global_72fb1c2cfe165e90 = ((((((1312) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e05794a5f6a7c8947e7762c0() {
  return __cxx_static_address_e05794a5f6a7c8947e7762c0.reference || (__cxx_static_address_e05794a5f6a7c8947e7762c0.reference = {
    __cReference: true,
    get value() { return FEM1____header_global_72fb1c2cfe165e90; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:520
export const FEM2____header_global_fecbb49ad93cb379 = ((((((1317) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ded2cde0ca91fe195a498915() {
  return __cxx_static_address_ded2cde0ca91fe195a498915.reference || (__cxx_static_address_ded2cde0ca91fe195a498915.reference = {
    __cReference: true,
    get value() { return FEM2____header_global_fecbb49ad93cb379; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:521
export const FEM3____header_global_32f6a53cc549f4de = ((((((1321) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a30f8c00de0906c9de32ef77() {
  return __cxx_static_address_a30f8c00de0906c9de32ef77.reference || (__cxx_static_address_a30f8c00de0906c9de32ef77.reference = {
    __cReference: true,
    get value() { return FEM3____header_global_32f6a53cc549f4de; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:522
export const FEM5____header_global_a4527745a8f28f72 = ((((((1323) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_562da18864f6b25225d0d48f() {
  return __cxx_static_address_562da18864f6b25225d0d48f.reference || (__cxx_static_address_562da18864f6b25225d0d48f.reference = {
    __cReference: true,
    get value() { return FEM5____header_global_a4527745a8f28f72; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:523
export const BLOODYPOLE____header_global_9b1853ef1eed0fbd = ((((((1324) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bb50cde8fc05212b3969c071() {
  return __cxx_static_address_bb50cde8fc05212b3969c071.reference || (__cxx_static_address_bb50cde8fc05212b3969c071.reference = {
    __cReference: true,
    get value() { return BLOODYPOLE____header_global_9b1853ef1eed0fbd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:524
export const FEM4____header_global_2cb21cd6e176bd1c = ((((((1325) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3aa1962c20e3e320845921d6() {
  return __cxx_static_address_3aa1962c20e3e320845921d6.reference || (__cxx_static_address_3aa1962c20e3e320845921d6.reference = {
    __cReference: true,
    get value() { return FEM4____header_global_2cb21cd6e176bd1c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:525
export const FEM6____header_global_6a9d7be1fc4c82e8 = ((((((1334) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3c0ba0060823bff40aedce8d() {
  return __cxx_static_address_3c0ba0060823bff40aedce8d.reference || (__cxx_static_address_3c0ba0060823bff40aedce8d.reference = {
    __cReference: true,
    get value() { return FEM6____header_global_6a9d7be1fc4c82e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:526
export const FEM6PAD____header_global_42aba4104253d463 = ((((((1335) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_625fc28d554335e6b4ff6897() {
  return __cxx_static_address_625fc28d554335e6b4ff6897.reference || (__cxx_static_address_625fc28d554335e6b4ff6897.reference = {
    __cReference: true,
    get value() { return FEM6PAD____header_global_42aba4104253d463; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:527
export const FEM8____header_global_7aa813180323fb38 = ((((((1336) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_441852e4b6990deee92abf79() {
  return __cxx_static_address_441852e4b6990deee92abf79.reference || (__cxx_static_address_441852e4b6990deee92abf79.reference = {
    __cReference: true,
    get value() { return FEM8____header_global_7aa813180323fb38; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:528
export const HELECOPT____header_global_aa420a4940495f4f = ((((((1346) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7731d0e1035c78bc20e47c42() {
  return __cxx_static_address_7731d0e1035c78bc20e47c42.reference || (__cxx_static_address_7731d0e1035c78bc20e47c42.reference = {
    __cReference: true,
    get value() { return HELECOPT____header_global_aa420a4940495f4f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:529
export const FETUSJIB____header_global_ee91d440d463de63 = ((((((1347) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6005c92a57ab5a2c481b3c75() {
  return __cxx_static_address_6005c92a57ab5a2c481b3c75.reference || (__cxx_static_address_6005c92a57ab5a2c481b3c75.reference = {
    __cReference: true,
    get value() { return FETUSJIB____header_global_ee91d440d463de63; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:530
export const HOLODUKE____header_global_163e3d5f7c4d60d3 = ((((((1348) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8f7e21fcaa16eebce3d11e80() {
  return __cxx_static_address_8f7e21fcaa16eebce3d11e80.reference || (__cxx_static_address_8f7e21fcaa16eebce3d11e80.reference = {
    __cReference: true,
    get value() { return HOLODUKE____header_global_163e3d5f7c4d60d3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:531
export const SPACEMARINE____header_global_9b0f9e25dd6cb008 = ((((((1353) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e100ed5e2fb52c89f100569() {
  return __cxx_static_address_1e100ed5e2fb52c89f100569.reference || (__cxx_static_address_1e100ed5e2fb52c89f100569.reference = {
    __cReference: true,
    get value() { return SPACEMARINE____header_global_9b0f9e25dd6cb008; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:532
export const INDY____header_global_a710e94d1148fb9a = ((((((1355) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ac413df2becd81a5e348ceeb() {
  return __cxx_static_address_ac413df2becd81a5e348ceeb.reference || (__cxx_static_address_ac413df2becd81a5e348ceeb.reference = {
    __cReference: true,
    get value() { return INDY____header_global_a710e94d1148fb9a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:533
export const FETUS____header_global_501577ebbc6f42a3 = ((((((1358) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0e6f78ce2fa81f49ba3449a0() {
  return __cxx_static_address_0e6f78ce2fa81f49ba3449a0.reference || (__cxx_static_address_0e6f78ce2fa81f49ba3449a0.reference = {
    __cReference: true,
    get value() { return FETUS____header_global_501577ebbc6f42a3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:534
export const FETUSBROKE____header_global_b56acd9536c34983 = ((((((1359) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9fb77fb6d01bc4a0423e9d4f() {
  return __cxx_static_address_9fb77fb6d01bc4a0423e9d4f.reference || (__cxx_static_address_9fb77fb6d01bc4a0423e9d4f.reference = {
    __cReference: true,
    get value() { return FETUSBROKE____header_global_b56acd9536c34983; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:535
export const MONK____header_global_7ed77d86666482e0 = ((((((1352) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4f7d6469f92b8aa294745295() {
  return __cxx_static_address_4f7d6469f92b8aa294745295.reference || (__cxx_static_address_4f7d6469f92b8aa294745295.reference = {
    __cReference: true,
    get value() { return MONK____header_global_7ed77d86666482e0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:536
export const LUKE____header_global_4cf315a26194c82f = ((((((1354) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_edb99ae0a8c170877f1581bc() {
  return __cxx_static_address_edb99ae0a8c170877f1581bc.reference || (__cxx_static_address_edb99ae0a8c170877f1581bc.reference = {
    __cReference: true,
    get value() { return LUKE____header_global_4cf315a26194c82f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:537
export const COOLEXPLOSION1____header_global_789163e1cc72b8d1 = ((((((1360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_49b2bde404c0d77265d3e920() {
  return __cxx_static_address_49b2bde404c0d77265d3e920.reference || (__cxx_static_address_49b2bde404c0d77265d3e920.reference = {
    __cReference: true,
    get value() { return COOLEXPLOSION1____header_global_789163e1cc72b8d1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:538
export const WATERSPLASH2____header_global_a838d3550b2821bf = ((((((1380) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e69477548684db2daed5f9ff() {
  return __cxx_static_address_e69477548684db2daed5f9ff.reference || (__cxx_static_address_e69477548684db2daed5f9ff.reference = {
    __cReference: true,
    get value() { return WATERSPLASH2____header_global_a838d3550b2821bf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:539
export const FIREVASE____header_global_dd7f784a25c9c08a = ((((((1390) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9d93a054546c8306df53622a() {
  return __cxx_static_address_9d93a054546c8306df53622a.reference || (__cxx_static_address_9d93a054546c8306df53622a.reference = {
    __cReference: true,
    get value() { return FIREVASE____header_global_dd7f784a25c9c08a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:540
export const FEM7____header_global_b4b653a40363835b = ((((((1395) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9b0ed6a69a31d435d3c6d29d() {
  return __cxx_static_address_9b0ed6a69a31d435d3c6d29d.reference || (__cxx_static_address_9b0ed6a69a31d435d3c6d29d.reference = {
    __cReference: true,
    get value() { return FEM7____header_global_b4b653a40363835b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:541
export const APLAYERTOP____header_global_098437209a04b911 = ((((((1400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d7a36cf7432dc31a7a9630ef() {
  return __cxx_static_address_d7a36cf7432dc31a7a9630ef.reference || (__cxx_static_address_d7a36cf7432dc31a7a9630ef.reference = {
    __cReference: true,
    get value() { return APLAYERTOP____header_global_098437209a04b911; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:542
export const APLAYER____header_global_3457124407e2bff8 = ((((((1405) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_32b113e709d995ee13e1a552() {
  return __cxx_static_address_32b113e709d995ee13e1a552.reference || (__cxx_static_address_32b113e709d995ee13e1a552.reference = {
    __cReference: true,
    get value() { return APLAYER____header_global_3457124407e2bff8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:543
export const PLAYERONWATER____header_global_b02603599452c833 = ((((((1420) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_35673fae1f979c6151aec907() {
  return __cxx_static_address_35673fae1f979c6151aec907.reference || (__cxx_static_address_35673fae1f979c6151aec907.reference = {
    __cReference: true,
    get value() { return PLAYERONWATER____header_global_b02603599452c833; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:544
export const DUKELYINGDEAD____header_global_9b7fcd9a7ff0efe7 = ((((((1518) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f59e4740e7442c38e290765f() {
  return __cxx_static_address_f59e4740e7442c38e290765f.reference || (__cxx_static_address_f59e4740e7442c38e290765f.reference = {
    __cReference: true,
    get value() { return DUKELYINGDEAD____header_global_9b7fcd9a7ff0efe7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:545
export const DUKETORSO____header_global_343bdb1f53583eab = ((((((1520) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e73337a7ecf3e8b43f853dc2() {
  return __cxx_static_address_e73337a7ecf3e8b43f853dc2.reference || (__cxx_static_address_e73337a7ecf3e8b43f853dc2.reference = {
    __cReference: true,
    get value() { return DUKETORSO____header_global_343bdb1f53583eab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:546
export const DUKEGUN____header_global_29710ab0ced4f1e7 = ((((((1528) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cdd317c74c874a1c3e14b6e9() {
  return __cxx_static_address_cdd317c74c874a1c3e14b6e9.reference || (__cxx_static_address_cdd317c74c874a1c3e14b6e9.reference = {
    __cReference: true,
    get value() { return DUKEGUN____header_global_29710ab0ced4f1e7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:547
export const DUKELEG____header_global_948d0706d612a52e = ((((((1536) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f45b5f0dab30793993600363() {
  return __cxx_static_address_f45b5f0dab30793993600363.reference || (__cxx_static_address_f45b5f0dab30793993600363.reference = {
    __cReference: true,
    get value() { return DUKELEG____header_global_948d0706d612a52e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:548
export const SHARK____header_global_6b10626c1c261c00 = ((((((1550) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a587473aea2946d4227d7293() {
  return __cxx_static_address_a587473aea2946d4227d7293.reference || (__cxx_static_address_a587473aea2946d4227d7293.reference = {
    __cReference: true,
    get value() { return SHARK____header_global_6b10626c1c261c00; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:549
export const BLOOD____header_global_be941a9ee19e7b4f = ((((((1620) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_19d27d5a41a021ebd2e0ce42() {
  return __cxx_static_address_19d27d5a41a021ebd2e0ce42.reference || (__cxx_static_address_19d27d5a41a021ebd2e0ce42.reference = {
    __cReference: true,
    get value() { return BLOOD____header_global_be941a9ee19e7b4f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:550
export const FIRELASER____header_global_c3a5c87c0c32f5c7 = ((((((1625) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3b29babd563e198ee19ceaf3() {
  return __cxx_static_address_3b29babd563e198ee19ceaf3.reference || (__cxx_static_address_3b29babd563e198ee19ceaf3.reference = {
    __cReference: true,
    get value() { return FIRELASER____header_global_c3a5c87c0c32f5c7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:551
export const TRANSPORTERSTAR____header_global_7adbb8b38072d14f = ((((((1630) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b8b1c47aa7c4ea592f306fdd() {
  return __cxx_static_address_b8b1c47aa7c4ea592f306fdd.reference || (__cxx_static_address_b8b1c47aa7c4ea592f306fdd.reference = {
    __cReference: true,
    get value() { return TRANSPORTERSTAR____header_global_7adbb8b38072d14f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:552
export const SPIT____header_global_796fc0ce44488951 = ((((((1636) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_815f8a49d828e87833eb51f0() {
  return __cxx_static_address_815f8a49d828e87833eb51f0.reference || (__cxx_static_address_815f8a49d828e87833eb51f0.reference = {
    __cReference: true,
    get value() { return SPIT____header_global_796fc0ce44488951; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:553
export const LOOGIE____header_global_12118bd4bbf8ac07 = ((((((1637) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2f4ce8e15ccd887c0fc96c8f() {
  return __cxx_static_address_2f4ce8e15ccd887c0fc96c8f.reference || (__cxx_static_address_2f4ce8e15ccd887c0fc96c8f.reference = {
    __cReference: true,
    get value() { return LOOGIE____header_global_12118bd4bbf8ac07; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:554
export const FIST____header_global_a9b40565feff5cb6 = ((((((1640) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9f37472ecd3e9813784cf040() {
  return __cxx_static_address_9f37472ecd3e9813784cf040.reference || (__cxx_static_address_9f37472ecd3e9813784cf040.reference = {
    __cReference: true,
    get value() { return FIST____header_global_a9b40565feff5cb6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:555
export const FREEZEBLAST____header_global_26f3a96d6b3fac7a = ((((((1641) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_10d4b2ca6efeeab99d84d91b() {
  return __cxx_static_address_10d4b2ca6efeeab99d84d91b.reference || (__cxx_static_address_10d4b2ca6efeeab99d84d91b.reference = {
    __cReference: true,
    get value() { return FREEZEBLAST____header_global_26f3a96d6b3fac7a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:556
export const SHRINKSPARK____header_global_17204d17d6ee21a5 = ((((((1646) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_154247b5a339ddcde16377e9() {
  return __cxx_static_address_154247b5a339ddcde16377e9.reference || (__cxx_static_address_154247b5a339ddcde16377e9.reference = {
    __cReference: true,
    get value() { return SHRINKSPARK____header_global_17204d17d6ee21a5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:557
export const TONGUE____header_global_8d122cbdad57f32f = ((((((1647) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6903695dcfded49ef705f13e() {
  return __cxx_static_address_6903695dcfded49ef705f13e.reference || (__cxx_static_address_6903695dcfded49ef705f13e.reference = {
    __cReference: true,
    get value() { return TONGUE____header_global_8d122cbdad57f32f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:558
export const MORTER____header_global_ac88a86e8ccc7c27 = ((((((1650) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_49d5aae5d402e67b537e1781() {
  return __cxx_static_address_49d5aae5d402e67b537e1781.reference || (__cxx_static_address_49d5aae5d402e67b537e1781.reference = {
    __cReference: true,
    get value() { return MORTER____header_global_ac88a86e8ccc7c27; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:559
export const SHRINKEREXPLOSION____header_global_93122fba7cf1ac25 = ((((((1656) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1a3e6cfc32567b43709301d6() {
  return __cxx_static_address_1a3e6cfc32567b43709301d6.reference || (__cxx_static_address_1a3e6cfc32567b43709301d6.reference = {
    __cReference: true,
    get value() { return SHRINKEREXPLOSION____header_global_93122fba7cf1ac25; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:560
export const RADIUSEXPLOSION____header_global_04de42b4533b44af = ((((((1670) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2275147b446df6ca06c7e240() {
  return __cxx_static_address_2275147b446df6ca06c7e240.reference || (__cxx_static_address_2275147b446df6ca06c7e240.reference = {
    __cReference: true,
    get value() { return RADIUSEXPLOSION____header_global_04de42b4533b44af; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:561
export const FORCERIPPLE____header_global_7dd6df5b4bc7db35 = ((((((1671) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_82b713fac6393e66820c5947() {
  return __cxx_static_address_82b713fac6393e66820c5947.reference || (__cxx_static_address_82b713fac6393e66820c5947.reference = {
    __cReference: true,
    get value() { return FORCERIPPLE____header_global_7dd6df5b4bc7db35; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:562
export const LIZTROOP____header_global_f0a0708e0b449c31 = ((((((1680) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1913c12ebf2dff5b6d971daf() {
  return __cxx_static_address_1913c12ebf2dff5b6d971daf.reference || (__cxx_static_address_1913c12ebf2dff5b6d971daf.reference = {
    __cReference: true,
    get value() { return LIZTROOP____header_global_f0a0708e0b449c31; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:563
export const LIZTROOPRUNNING____header_global_6c5d2e19e821d4b2 = ((((((1681) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4d9ecae376a9c48f8525b42c() {
  return __cxx_static_address_4d9ecae376a9c48f8525b42c.reference || (__cxx_static_address_4d9ecae376a9c48f8525b42c.reference = {
    __cReference: true,
    get value() { return LIZTROOPRUNNING____header_global_6c5d2e19e821d4b2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:564
export const LIZTROOPSTAYPUT____header_global_47e8176878120606 = ((((((1682) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_645c554170f3ed4f32e8e8aa() {
  return __cxx_static_address_645c554170f3ed4f32e8e8aa.reference || (__cxx_static_address_645c554170f3ed4f32e8e8aa.reference = {
    __cReference: true,
    get value() { return LIZTROOPSTAYPUT____header_global_47e8176878120606; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:565
export const LIZTROOPSHOOT____header_global_5a642a47d372e556 = ((((((1715) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0b78c918c0a0487dd35cc29e() {
  return __cxx_static_address_0b78c918c0a0487dd35cc29e.reference || (__cxx_static_address_0b78c918c0a0487dd35cc29e.reference = {
    __cReference: true,
    get value() { return LIZTROOPSHOOT____header_global_5a642a47d372e556; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:566
export const LIZTROOPJETPACK____header_global_0e507ad653379000 = ((((((1725) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2463c23c9a75d9beae4376b7() {
  return __cxx_static_address_2463c23c9a75d9beae4376b7.reference || (__cxx_static_address_2463c23c9a75d9beae4376b7.reference = {
    __cReference: true,
    get value() { return LIZTROOPJETPACK____header_global_0e507ad653379000; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:567
export const LIZTROOPONTOILET____header_global_f3357d97c09ed874 = ((((((1741) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d9f982a7fc2ab615ad5fc25a() {
  return __cxx_static_address_d9f982a7fc2ab615ad5fc25a.reference || (__cxx_static_address_d9f982a7fc2ab615ad5fc25a.reference = {
    __cReference: true,
    get value() { return LIZTROOPONTOILET____header_global_f3357d97c09ed874; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:568
export const LIZTROOPJUSTSIT____header_global_f0ca67719f097de3 = ((((((1742) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_77be3cc5f2cfa125abe2db54() {
  return __cxx_static_address_77be3cc5f2cfa125abe2db54.reference || (__cxx_static_address_77be3cc5f2cfa125abe2db54.reference = {
    __cReference: true,
    get value() { return LIZTROOPJUSTSIT____header_global_f0ca67719f097de3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:569
export const LIZTROOPDUCKING____header_global_2c4318e5d2f6e52c = ((((((1744) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ed5703169ee180bd41e5d035() {
  return __cxx_static_address_ed5703169ee180bd41e5d035.reference || (__cxx_static_address_ed5703169ee180bd41e5d035.reference = {
    __cReference: true,
    get value() { return LIZTROOPDUCKING____header_global_2c4318e5d2f6e52c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:570
export const HEADJIB1____header_global_e9e487cb1e4b2860 = ((((((1768) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7882d606bf7309dba2925362() {
  return __cxx_static_address_7882d606bf7309dba2925362.reference || (__cxx_static_address_7882d606bf7309dba2925362.reference = {
    __cReference: true,
    get value() { return HEADJIB1____header_global_e9e487cb1e4b2860; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:571
export const ARMJIB1____header_global_c69c7379407fc523 = ((((((1772) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c6007468a05c12de47a67f07() {
  return __cxx_static_address_c6007468a05c12de47a67f07.reference || (__cxx_static_address_c6007468a05c12de47a67f07.reference = {
    __cReference: true,
    get value() { return ARMJIB1____header_global_c69c7379407fc523; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:572
export const LEGJIB1____header_global_f659d32b2cf51a83 = ((((((1776) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bebe9f9ce80dd7575da98056() {
  return __cxx_static_address_bebe9f9ce80dd7575da98056.reference || (__cxx_static_address_bebe9f9ce80dd7575da98056.reference = {
    __cReference: true,
    get value() { return LEGJIB1____header_global_f659d32b2cf51a83; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:573
export const OCTABRAIN____header_global_19bde86d215b7e80 = ((((((1820) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0bfdcfe09e513de666e62400() {
  return __cxx_static_address_0bfdcfe09e513de666e62400.reference || (__cxx_static_address_0bfdcfe09e513de666e62400.reference = {
    __cReference: true,
    get value() { return OCTABRAIN____header_global_19bde86d215b7e80; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:574
export const OCTABRAINSTAYPUT____header_global_639cdc8e2bda0d48 = ((((((1821) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6f68ece0c4b44fb07beec83f() {
  return __cxx_static_address_6f68ece0c4b44fb07beec83f.reference || (__cxx_static_address_6f68ece0c4b44fb07beec83f.reference = {
    __cReference: true,
    get value() { return OCTABRAINSTAYPUT____header_global_639cdc8e2bda0d48; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:575
export const INNERJAW____header_global_601b502dd77fea94 = ((((((1860) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0c4cb993426eae0cd5e8db63() {
  return __cxx_static_address_0c4cb993426eae0cd5e8db63.reference || (__cxx_static_address_0c4cb993426eae0cd5e8db63.reference = {
    __cReference: true,
    get value() { return INNERJAW____header_global_601b502dd77fea94; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:576
export const DRONE____header_global_1a85db7b202a622c = ((((((1880) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_befbf1d4d25548a6637c2d06() {
  return __cxx_static_address_befbf1d4d25548a6637c2d06.reference || (__cxx_static_address_befbf1d4d25548a6637c2d06.reference = {
    __cReference: true,
    get value() { return DRONE____header_global_1a85db7b202a622c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:577
export const EXPLOSION2____header_global_4a5ffe89613dc11b = ((((((1890) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f26fad6749d5e179d62afd15() {
  return __cxx_static_address_f26fad6749d5e179d62afd15.reference || (__cxx_static_address_f26fad6749d5e179d62afd15.reference = {
    __cReference: true,
    get value() { return EXPLOSION2____header_global_4a5ffe89613dc11b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:578
export const COMMANDER____header_global_e23cde83e12f3b65 = ((((((1920) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7dfabca2a6c0ac395cfc2c86() {
  return __cxx_static_address_7dfabca2a6c0ac395cfc2c86.reference || (__cxx_static_address_7dfabca2a6c0ac395cfc2c86.reference = {
    __cReference: true,
    get value() { return COMMANDER____header_global_e23cde83e12f3b65; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:579
export const COMMANDERSTAYPUT____header_global_011497ab9f0f3966 = ((((((1921) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_04ec7d1850c20256e92716e8() {
  return __cxx_static_address_04ec7d1850c20256e92716e8.reference || (__cxx_static_address_04ec7d1850c20256e92716e8.reference = {
    __cReference: true,
    get value() { return COMMANDERSTAYPUT____header_global_011497ab9f0f3966; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:580
export const RECON____header_global_c41aa1548ef66ebb = ((((((1960) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3e00797940ccfd40b45e4668() {
  return __cxx_static_address_3e00797940ccfd40b45e4668.reference || (__cxx_static_address_3e00797940ccfd40b45e4668.reference = {
    __cReference: true,
    get value() { return RECON____header_global_c41aa1548ef66ebb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:581
export const TANK____header_global_dc49e9c4ac004b6f = ((((((1975) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_92068c329b92b15aa3e115d7() {
  return __cxx_static_address_92068c329b92b15aa3e115d7.reference || (__cxx_static_address_92068c329b92b15aa3e115d7.reference = {
    __cReference: true,
    get value() { return TANK____header_global_dc49e9c4ac004b6f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:582
export const PIGCOP____header_global_56787d75e9301281 = ((((((2000) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5cc1281e5518c521b1c08de0() {
  return __cxx_static_address_5cc1281e5518c521b1c08de0.reference || (__cxx_static_address_5cc1281e5518c521b1c08de0.reference = {
    __cReference: true,
    get value() { return PIGCOP____header_global_56787d75e9301281; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:583
export const PIGCOPSTAYPUT____header_global_4b439125d381a052 = ((((((2001) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_568626ed98fe8e0f95aadfc3() {
  return __cxx_static_address_568626ed98fe8e0f95aadfc3.reference || (__cxx_static_address_568626ed98fe8e0f95aadfc3.reference = {
    __cReference: true,
    get value() { return PIGCOPSTAYPUT____header_global_4b439125d381a052; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:584
export const PIGCOPDIVE____header_global_2b80abca7d4886ef = ((((((2045) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0bc4ea8c4fa29c5c798e1a78() {
  return __cxx_static_address_0bc4ea8c4fa29c5c798e1a78.reference || (__cxx_static_address_0bc4ea8c4fa29c5c798e1a78.reference = {
    __cReference: true,
    get value() { return PIGCOPDIVE____header_global_2b80abca7d4886ef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:585
export const LIZMAN____header_global_77f9441689c79d50 = ((((((2120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_86df9228062f5d919eb6f306() {
  return __cxx_static_address_86df9228062f5d919eb6f306.reference || (__cxx_static_address_86df9228062f5d919eb6f306.reference = {
    __cReference: true,
    get value() { return LIZMAN____header_global_77f9441689c79d50; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:586
export const LIZMANSTAYPUT____header_global_e72cc470931b9f0f = ((((((2121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e963c7427bc496759fac88ee() {
  return __cxx_static_address_e963c7427bc496759fac88ee.reference || (__cxx_static_address_e963c7427bc496759fac88ee.reference = {
    __cReference: true,
    get value() { return LIZMANSTAYPUT____header_global_e72cc470931b9f0f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:587
export const LIZMANSPITTING____header_global_82ad1f61160451d8 = ((((((2150) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e196b905bced9707336fa8cc() {
  return __cxx_static_address_e196b905bced9707336fa8cc.reference || (__cxx_static_address_e196b905bced9707336fa8cc.reference = {
    __cReference: true,
    get value() { return LIZMANSPITTING____header_global_82ad1f61160451d8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:588
export const LIZMANFEEDING____header_global_5450f57f34f8ab93 = ((((((2160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_867bffd15918f3527a065b4f() {
  return __cxx_static_address_867bffd15918f3527a065b4f.reference || (__cxx_static_address_867bffd15918f3527a065b4f.reference = {
    __cReference: true,
    get value() { return LIZMANFEEDING____header_global_5450f57f34f8ab93; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:589
export const LIZMANJUMP____header_global_a7497826bf60c3a9 = ((((((2165) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_92acdba3e051b60683e90310() {
  return __cxx_static_address_92acdba3e051b60683e90310.reference || (__cxx_static_address_92acdba3e051b60683e90310.reference = {
    __cReference: true,
    get value() { return LIZMANJUMP____header_global_a7497826bf60c3a9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:590
export const FECES____header_global_57dbc008c0ef2e17 = ((((((2200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_73e3116e24d1c9e13dffa0cd() {
  return __cxx_static_address_73e3116e24d1c9e13dffa0cd.reference || (__cxx_static_address_73e3116e24d1c9e13dffa0cd.reference = {
    __cReference: true,
    get value() { return FECES____header_global_57dbc008c0ef2e17; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:591
export const LIZMANHEAD1____header_global_77f988d16cd26017 = ((((((2201) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4c1b65e48405c5cf116f3d68() {
  return __cxx_static_address_4c1b65e48405c5cf116f3d68.reference || (__cxx_static_address_4c1b65e48405c5cf116f3d68.reference = {
    __cReference: true,
    get value() { return LIZMANHEAD1____header_global_77f988d16cd26017; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:592
export const LIZMANARM1____header_global_278e5f9539da9d9f = ((((((2205) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9670df13a7d0a0db30c4343a() {
  return __cxx_static_address_9670df13a7d0a0db30c4343a.reference || (__cxx_static_address_9670df13a7d0a0db30c4343a.reference = {
    __cReference: true,
    get value() { return LIZMANARM1____header_global_278e5f9539da9d9f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:593
export const LIZMANLEG1____header_global_81cd5deb3a23f5af = ((((((2209) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fd2a7c420c9d586ec3d3eb3d() {
  return __cxx_static_address_fd2a7c420c9d586ec3d3eb3d.reference || (__cxx_static_address_fd2a7c420c9d586ec3d3eb3d.reference = {
    __cReference: true,
    get value() { return LIZMANLEG1____header_global_81cd5deb3a23f5af; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:594
export const EXPLOSION2BOT____header_global_f98a3967174473f9 = ((((((2219) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f330799b4644443ce159e763() {
  return __cxx_static_address_f330799b4644443ce159e763.reference || (__cxx_static_address_f330799b4644443ce159e763.reference = {
    __cReference: true,
    get value() { return EXPLOSION2BOT____header_global_f98a3967174473f9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:595
export const JIBS1____header_global_3295c6e7d8d48741 = ((((((2245) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_287464e3362a4e37cd327b51() {
  return __cxx_static_address_287464e3362a4e37cd327b51.reference || (__cxx_static_address_287464e3362a4e37cd327b51.reference = {
    __cReference: true,
    get value() { return JIBS1____header_global_3295c6e7d8d48741; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:596
export const JIBS2____header_global_3d297f56d1801e0d = ((((((2250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_248d3d1aeb98a5fdf5efcd29() {
  return __cxx_static_address_248d3d1aeb98a5fdf5efcd29.reference || (__cxx_static_address_248d3d1aeb98a5fdf5efcd29.reference = {
    __cReference: true,
    get value() { return JIBS2____header_global_3d297f56d1801e0d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:597
export const JIBS3____header_global_ddf2620f94593e57 = ((((((2255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aa698a47577993a82e2ca0a3() {
  return __cxx_static_address_aa698a47577993a82e2ca0a3.reference || (__cxx_static_address_aa698a47577993a82e2ca0a3.reference = {
    __cReference: true,
    get value() { return JIBS3____header_global_ddf2620f94593e57; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:598
export const JIBS4____header_global_8991cbaf793145a0 = ((((((2260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_959f949d6e6f73050eb61670() {
  return __cxx_static_address_959f949d6e6f73050eb61670.reference || (__cxx_static_address_959f949d6e6f73050eb61670.reference = {
    __cReference: true,
    get value() { return JIBS4____header_global_8991cbaf793145a0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:599
export const JIBS5____header_global_dde9ba7833fa3e9f = ((((((2265) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3cc7410a4d0472708dbc8df7() {
  return __cxx_static_address_3cc7410a4d0472708dbc8df7.reference || (__cxx_static_address_3cc7410a4d0472708dbc8df7.reference = {
    __cReference: true,
    get value() { return JIBS5____header_global_dde9ba7833fa3e9f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:600
export const BURNING____header_global_8b3a44729a31481c = ((((((2270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3da16249efcc77627dfb1ba3() {
  return __cxx_static_address_3da16249efcc77627dfb1ba3.reference || (__cxx_static_address_3da16249efcc77627dfb1ba3.reference = {
    __cReference: true,
    get value() { return BURNING____header_global_8b3a44729a31481c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:601
export const FIRE____header_global_3fd5ad1c4bc37b00 = ((((((2271) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a113617a363807c6400ef4f3() {
  return __cxx_static_address_a113617a363807c6400ef4f3.reference || (__cxx_static_address_a113617a363807c6400ef4f3.reference = {
    __cReference: true,
    get value() { return FIRE____header_global_3fd5ad1c4bc37b00; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:602
export const JIBS6____header_global_251743308c00de05 = ((((((2286) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f787de403b824bb0bff64333() {
  return __cxx_static_address_f787de403b824bb0bff64333.reference || (__cxx_static_address_f787de403b824bb0bff64333.reference = {
    __cReference: true,
    get value() { return JIBS6____header_global_251743308c00de05; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:603
export const BLOODSPLAT1____header_global_1b0087005fa78d45 = ((((((2296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_caf8d41e39e8afd969014517() {
  return __cxx_static_address_caf8d41e39e8afd969014517.reference || (__cxx_static_address_caf8d41e39e8afd969014517.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT1____header_global_1b0087005fa78d45; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:604
export const BLOODSPLAT3____header_global_82a5b01e367364b3 = ((((((2297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e9bf8f94181f187538dcf80f() {
  return __cxx_static_address_e9bf8f94181f187538dcf80f.reference || (__cxx_static_address_e9bf8f94181f187538dcf80f.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT3____header_global_82a5b01e367364b3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:605
export const BLOODSPLAT2____header_global_e635bff630f890fc = ((((((2298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dfb8fefdd2fc343558ee34f9() {
  return __cxx_static_address_dfb8fefdd2fc343558ee34f9.reference || (__cxx_static_address_dfb8fefdd2fc343558ee34f9.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT2____header_global_e635bff630f890fc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:606
export const BLOODSPLAT4____header_global_0a4074cf54ade8f5 = ((((((2299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_af009a8162ed878a2fc0caa6() {
  return __cxx_static_address_af009a8162ed878a2fc0caa6.reference || (__cxx_static_address_af009a8162ed878a2fc0caa6.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT4____header_global_0a4074cf54ade8f5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:607
export const OOZ____header_global_6c4ec4e96c5c993f = ((((((2300) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d3a4bc9212ed6c79a60dc772() {
  return __cxx_static_address_d3a4bc9212ed6c79a60dc772.reference || (__cxx_static_address_d3a4bc9212ed6c79a60dc772.reference = {
    __cReference: true,
    get value() { return OOZ____header_global_6c4ec4e96c5c993f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:608
export const OOZ2____header_global_4947e00d54af7409 = ((((((2309) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f85668262e23d52cc85f28d0() {
  return __cxx_static_address_f85668262e23d52cc85f28d0.reference || (__cxx_static_address_f85668262e23d52cc85f28d0.reference = {
    __cReference: true,
    get value() { return OOZ2____header_global_4947e00d54af7409; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:609
export const WALLBLOOD1____header_global_e9a31a3b2506c2d2 = ((((((2301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c4e220bbcf3d1275a6cd02e4() {
  return __cxx_static_address_c4e220bbcf3d1275a6cd02e4.reference || (__cxx_static_address_c4e220bbcf3d1275a6cd02e4.reference = {
    __cReference: true,
    get value() { return WALLBLOOD1____header_global_e9a31a3b2506c2d2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:610
export const WALLBLOOD2____header_global_257636f4658d074a = ((((((2302) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8352022e37f30d930b19cf7e() {
  return __cxx_static_address_8352022e37f30d930b19cf7e.reference || (__cxx_static_address_8352022e37f30d930b19cf7e.reference = {
    __cReference: true,
    get value() { return WALLBLOOD2____header_global_257636f4658d074a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:611
export const WALLBLOOD3____header_global_a56298644001cbb4 = ((((((2303) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_858d43f9e1c41a7143250cc4() {
  return __cxx_static_address_858d43f9e1c41a7143250cc4.reference || (__cxx_static_address_858d43f9e1c41a7143250cc4.reference = {
    __cReference: true,
    get value() { return WALLBLOOD3____header_global_a56298644001cbb4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:612
export const WALLBLOOD4____header_global_49dc06dd1c148607 = ((((((2304) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ee19294f216ee6fd388a66eb() {
  return __cxx_static_address_ee19294f216ee6fd388a66eb.reference || (__cxx_static_address_ee19294f216ee6fd388a66eb.reference = {
    __cReference: true,
    get value() { return WALLBLOOD4____header_global_49dc06dd1c148607; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:613
export const WALLBLOOD5____header_global_7eb3cd2636b7327f = ((((((2305) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a479bd363c72629f9a442c76() {
  return __cxx_static_address_a479bd363c72629f9a442c76.reference || (__cxx_static_address_a479bd363c72629f9a442c76.reference = {
    __cReference: true,
    get value() { return WALLBLOOD5____header_global_7eb3cd2636b7327f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:614
export const WALLBLOOD7____header_global_2105105e0f7df473 = ((((((2307) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_db92cc432106d176da98532b() {
  return __cxx_static_address_db92cc432106d176da98532b.reference || (__cxx_static_address_db92cc432106d176da98532b.reference = {
    __cReference: true,
    get value() { return WALLBLOOD7____header_global_2105105e0f7df473; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:615
export const WALLBLOOD8____header_global_b0d11c48edc7a1b9 = ((((((2308) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_09399c581661f331ccb136ff() {
  return __cxx_static_address_09399c581661f331ccb136ff.reference || (__cxx_static_address_09399c581661f331ccb136ff.reference = {
    __cReference: true,
    get value() { return WALLBLOOD8____header_global_b0d11c48edc7a1b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:616
export const BURNING2____header_global_3de43b816f79dd62 = ((((((2310) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8fbb6e62f575b15be098a644() {
  return __cxx_static_address_8fbb6e62f575b15be098a644.reference || (__cxx_static_address_8fbb6e62f575b15be098a644.reference = {
    __cReference: true,
    get value() { return BURNING2____header_global_3de43b816f79dd62; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:617
export const FIRE2____header_global_d9ba07f3140c70a6 = ((((((2311) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1ab01cd713b1d6350f623905() {
  return __cxx_static_address_1ab01cd713b1d6350f623905.reference || (__cxx_static_address_1ab01cd713b1d6350f623905.reference = {
    __cReference: true,
    get value() { return FIRE2____header_global_d9ba07f3140c70a6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:618
export const CRACKKNUCKLES____header_global_c394bdd836c29f52 = ((((((2324) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_84414f6b534bd77c21ceaa1f() {
  return __cxx_static_address_84414f6b534bd77c21ceaa1f.reference || (__cxx_static_address_84414f6b534bd77c21ceaa1f.reference = {
    __cReference: true,
    get value() { return CRACKKNUCKLES____header_global_c394bdd836c29f52; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:619
export const SMALLSMOKE____header_global_3b6e82aa39d00329 = ((((((2329) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aa841c4e2aab36d263203b97() {
  return __cxx_static_address_aa841c4e2aab36d263203b97.reference || (__cxx_static_address_aa841c4e2aab36d263203b97.reference = {
    __cReference: true,
    get value() { return SMALLSMOKE____header_global_3b6e82aa39d00329; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:620
export const FLOORFLAME____header_global_29fb453346626a31 = ((((((2333) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f353ecc97b90abd7c5ecc060() {
  return __cxx_static_address_f353ecc97b90abd7c5ecc060.reference || (__cxx_static_address_f353ecc97b90abd7c5ecc060.reference = {
    __cReference: true,
    get value() { return FLOORFLAME____header_global_29fb453346626a31; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:621
export const ROTATEGUN____header_global_12006c1e6b66c4c6 = ((((((2360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_26a974811926965e8700d2d6() {
  return __cxx_static_address_26a974811926965e8700d2d6.reference || (__cxx_static_address_26a974811926965e8700d2d6.reference = {
    __cReference: true,
    get value() { return ROTATEGUN____header_global_12006c1e6b66c4c6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:622
export const GREENSLIME____header_global_afe27339fbaf8600 = ((((((2370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_785bdfc14621cd390d85cb56() {
  return __cxx_static_address_785bdfc14621cd390d85cb56.reference || (__cxx_static_address_785bdfc14621cd390d85cb56.reference = {
    __cReference: true,
    get value() { return GREENSLIME____header_global_afe27339fbaf8600; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:623
export const WATERDRIPSPLASH____header_global_7a5f8eb5b5adccc7 = ((((((2380) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6ad0ac8aa8c9e4165d06e60a() {
  return __cxx_static_address_6ad0ac8aa8c9e4165d06e60a.reference || (__cxx_static_address_6ad0ac8aa8c9e4165d06e60a.reference = {
    __cReference: true,
    get value() { return WATERDRIPSPLASH____header_global_7a5f8eb5b5adccc7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:624
export const SCRAP6____header_global_d43544729e27e6ab = ((((((2390) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_10bde3116178c361b09eb51e() {
  return __cxx_static_address_10bde3116178c361b09eb51e.reference || (__cxx_static_address_10bde3116178c361b09eb51e.reference = {
    __cReference: true,
    get value() { return SCRAP6____header_global_d43544729e27e6ab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:625
export const SCRAP1____header_global_36c2e18790019ae7 = ((((((2400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_27e8af71e946d63b3e93ff85() {
  return __cxx_static_address_27e8af71e946d63b3e93ff85.reference || (__cxx_static_address_27e8af71e946d63b3e93ff85.reference = {
    __cReference: true,
    get value() { return SCRAP1____header_global_36c2e18790019ae7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:626
export const SCRAP2____header_global_edc2509d3e46ecfb = ((((((2404) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_107f6f71e94f6608770d7df6() {
  return __cxx_static_address_107f6f71e94f6608770d7df6.reference || (__cxx_static_address_107f6f71e94f6608770d7df6.reference = {
    __cReference: true,
    get value() { return SCRAP2____header_global_edc2509d3e46ecfb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:627
export const SCRAP3____header_global_cc314dc27fdc4ad1 = ((((((2408) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_93f36822049414958200489f() {
  return __cxx_static_address_93f36822049414958200489f.reference || (__cxx_static_address_93f36822049414958200489f.reference = {
    __cReference: true,
    get value() { return SCRAP3____header_global_cc314dc27fdc4ad1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:628
export const SCRAP4____header_global_98643556444fcfa3 = ((((((2412) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0e584267c414b51e4ad8b4a3() {
  return __cxx_static_address_0e584267c414b51e4ad8b4a3.reference || (__cxx_static_address_0e584267c414b51e4ad8b4a3.reference = {
    __cReference: true,
    get value() { return SCRAP4____header_global_98643556444fcfa3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:629
export const SCRAP5____header_global_2c01a3657b21d85c = ((((((2416) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_58676e23b75669d4ca6f2bc6() {
  return __cxx_static_address_58676e23b75669d4ca6f2bc6.reference || (__cxx_static_address_58676e23b75669d4ca6f2bc6.reference = {
    __cReference: true,
    get value() { return SCRAP5____header_global_2c01a3657b21d85c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:630
export const ORGANTIC____header_global_12c7242f1a2b834b = ((((((2420) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9f452cfd68d1e1310ad937c5() {
  return __cxx_static_address_9f452cfd68d1e1310ad937c5.reference || (__cxx_static_address_9f452cfd68d1e1310ad937c5.reference = {
    __cReference: true,
    get value() { return ORGANTIC____header_global_12c7242f1a2b834b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:631
export const BETAVERSION____header_global_9d3157bc7d8e306a = ((((((2440) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cb1ac1fcd702f9da4bb3d812() {
  return __cxx_static_address_cb1ac1fcd702f9da4bb3d812.reference || (__cxx_static_address_cb1ac1fcd702f9da4bb3d812.reference = {
    __cReference: true,
    get value() { return BETAVERSION____header_global_9d3157bc7d8e306a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:632
export const SELECTDIR____header_global_f335263aa7ce2d92 = ((((((2444) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_18a0644e645bae823c6eabaf() {
  return __cxx_static_address_18a0644e645bae823c6eabaf.reference || (__cxx_static_address_18a0644e645bae823c6eabaf.reference = {
    __cReference: true,
    get value() { return SELECTDIR____header_global_f335263aa7ce2d92; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:633
export const F1HELP____header_global_53cb9d5bf897c617 = ((((((2445) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c9c1fb26a3e6345364bed46a() {
  return __cxx_static_address_c9c1fb26a3e6345364bed46a.reference || (__cxx_static_address_c9c1fb26a3e6345364bed46a.reference = {
    __cReference: true,
    get value() { return F1HELP____header_global_53cb9d5bf897c617; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:634
export const GROWSPARK____header_global_89adb4e692037d2d = ((((((2448) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_73e252be45a6aa2b4a2efc03() {
  return __cxx_static_address_73e252be45a6aa2b4a2efc03.reference || (__cxx_static_address_73e252be45a6aa2b4a2efc03.reference = {
    __cReference: true,
    get value() { return GROWSPARK____header_global_89adb4e692037d2d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:635
export const MENUSCREEN____header_global_d288143a63ddd36e = ((((((2456) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f8ef1ca70db2e887f2b0fb45() {
  return __cxx_static_address_f8ef1ca70db2e887f2b0fb45.reference || (__cxx_static_address_f8ef1ca70db2e887f2b0fb45.reference = {
    __cReference: true,
    get value() { return MENUSCREEN____header_global_d288143a63ddd36e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:636
export const MENUBAR____header_global_8ec9dab08cbd0aaa = ((((((2457) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3096b5ce9c6b78dc130935ac() {
  return __cxx_static_address_3096b5ce9c6b78dc130935ac.reference || (__cxx_static_address_3096b5ce9c6b78dc130935ac.reference = {
    __cReference: true,
    get value() { return MENUBAR____header_global_8ec9dab08cbd0aaa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:637
export const KILLSICON____header_global_3689b033dda17b08 = ((((((2458) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fdef49cb0e6a6aa5fae7617d() {
  return __cxx_static_address_fdef49cb0e6a6aa5fae7617d.reference || (__cxx_static_address_fdef49cb0e6a6aa5fae7617d.reference = {
    __cReference: true,
    get value() { return KILLSICON____header_global_3689b033dda17b08; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:638
export const FIRSTAID_ICON____header_global_21b8cf010584194e = ((((((2460) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_09cbafd978cb0daaf2418dd8() {
  return __cxx_static_address_09cbafd978cb0daaf2418dd8.reference || (__cxx_static_address_09cbafd978cb0daaf2418dd8.reference = {
    __cReference: true,
    get value() { return FIRSTAID_ICON____header_global_21b8cf010584194e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:639
export const HEAT_ICON____header_global_efae3a932690fc39 = ((((((2461) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c2a2faabf61f49212fb1b15e() {
  return __cxx_static_address_c2a2faabf61f49212fb1b15e.reference || (__cxx_static_address_c2a2faabf61f49212fb1b15e.reference = {
    __cReference: true,
    get value() { return HEAT_ICON____header_global_efae3a932690fc39; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:640
export const BOTTOMSTATUSBAR____header_global_d10fe1a5abbe92ac = ((((((2462) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_51dc5b15c27d9304872ff6ec() {
  return __cxx_static_address_51dc5b15c27d9304872ff6ec.reference || (__cxx_static_address_51dc5b15c27d9304872ff6ec.reference = {
    __cReference: true,
    get value() { return BOTTOMSTATUSBAR____header_global_d10fe1a5abbe92ac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:641
export const BOOT_ICON____header_global_740946f9bc7168de = ((((((2463) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_89324d8a8c4f1c055364b766() {
  return __cxx_static_address_89324d8a8c4f1c055364b766.reference || (__cxx_static_address_89324d8a8c4f1c055364b766.reference = {
    __cReference: true,
    get value() { return BOOT_ICON____header_global_740946f9bc7168de; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:642
export const FRAGBAR____header_global_552d3262e9599536 = ((((((2465) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_362663119eccc35ee427afc5() {
  return __cxx_static_address_362663119eccc35ee427afc5.reference || (__cxx_static_address_362663119eccc35ee427afc5.reference = {
    __cReference: true,
    get value() { return FRAGBAR____header_global_552d3262e9599536; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:643
export const JETPACK_ICON____header_global_d21e992b68ab89d4 = ((((((2467) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_19043170ee5e5c77b00375b0() {
  return __cxx_static_address_19043170ee5e5c77b00375b0.reference || (__cxx_static_address_19043170ee5e5c77b00375b0.reference = {
    __cReference: true,
    get value() { return JETPACK_ICON____header_global_d21e992b68ab89d4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:644
export const AIRTANK_ICON____header_global_c20aaea57cf8941f = ((((((2468) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8063e837ae01c51f7696be26() {
  return __cxx_static_address_8063e837ae01c51f7696be26.reference || (__cxx_static_address_8063e837ae01c51f7696be26.reference = {
    __cReference: true,
    get value() { return AIRTANK_ICON____header_global_c20aaea57cf8941f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:645
export const STEROIDS_ICON____header_global_4a8e90cac1e1492c = ((((((2469) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3dc12c02e5d77d4d388d4654() {
  return __cxx_static_address_3dc12c02e5d77d4d388d4654.reference || (__cxx_static_address_3dc12c02e5d77d4d388d4654.reference = {
    __cReference: true,
    get value() { return STEROIDS_ICON____header_global_4a8e90cac1e1492c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:646
export const HOLODUKE_ICON____header_global_5b52ed61ab488660 = ((((((2470) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5771474918ebffb5184a6eb1() {
  return __cxx_static_address_5771474918ebffb5184a6eb1.reference || (__cxx_static_address_5771474918ebffb5184a6eb1.reference = {
    __cReference: true,
    get value() { return HOLODUKE_ICON____header_global_5b52ed61ab488660; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:647
export const ACCESS_ICON____header_global_fd09f2008e072148 = ((((((2471) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_46f1a531622bb76e0580cb02() {
  return __cxx_static_address_46f1a531622bb76e0580cb02.reference || (__cxx_static_address_46f1a531622bb76e0580cb02.reference = {
    __cReference: true,
    get value() { return ACCESS_ICON____header_global_fd09f2008e072148; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:648
export const DIGITALNUM____header_global_e9d091a8a8d06ab9 = ((((((2472) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8feb3a7bf8f1c73042f28b54() {
  return __cxx_static_address_8feb3a7bf8f1c73042f28b54.reference || (__cxx_static_address_8feb3a7bf8f1c73042f28b54.reference = {
    __cReference: true,
    get value() { return DIGITALNUM____header_global_e9d091a8a8d06ab9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:649
export const DUKECAR____header_global_151c32c4cf02de6d = ((((((2491) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f4dc9b072ffad5b5a8ad9b14() {
  return __cxx_static_address_f4dc9b072ffad5b5a8ad9b14.reference || (__cxx_static_address_f4dc9b072ffad5b5a8ad9b14.reference = {
    __cReference: true,
    get value() { return DUKECAR____header_global_151c32c4cf02de6d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:650
export const CAMCORNER____header_global_28dc03426f6a3fd9 = ((((((2482) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_634edc8e98f9b1e098472535() {
  return __cxx_static_address_634edc8e98f9b1e098472535.reference || (__cxx_static_address_634edc8e98f9b1e098472535.reference = {
    __cReference: true,
    get value() { return CAMCORNER____header_global_28dc03426f6a3fd9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:651
export const CAMLIGHT____header_global_dfebd7bcb1340f8a = ((((((2484) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e299eedc7077ba968e55ed15() {
  return __cxx_static_address_e299eedc7077ba968e55ed15.reference || (__cxx_static_address_e299eedc7077ba968e55ed15.reference = {
    __cReference: true,
    get value() { return CAMLIGHT____header_global_dfebd7bcb1340f8a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:652
export const SLIDEBAR____header_global_61986abf582c8c80 = ((((((2489) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c90ceff3d8b4972f404faab1() {
  return __cxx_static_address_c90ceff3d8b4972f404faab1.reference || (__cxx_static_address_c90ceff3d8b4972f404faab1.reference = {
    __cReference: true,
    get value() { return SLIDEBAR____header_global_61986abf582c8c80; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:653
export const DREALMS____header_global_c516875a2a23dc67 = ((((((2492) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0cfba52991fe91aec6045223() {
  return __cxx_static_address_0cfba52991fe91aec6045223.reference || (__cxx_static_address_0cfba52991fe91aec6045223.reference = {
    __cReference: true,
    get value() { return DREALMS____header_global_c516875a2a23dc67; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:654
export const BETASCREEN____header_global_40cefa01be72ad48 = ((((((2493) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ba41df8c7a4c53218f391bff() {
  return __cxx_static_address_ba41df8c7a4c53218f391bff.reference || (__cxx_static_address_ba41df8c7a4c53218f391bff.reference = {
    __cReference: true,
    get value() { return BETASCREEN____header_global_40cefa01be72ad48; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:655
export const WINDOWBORDER1____header_global_85ac9c8c9af1fc2f = ((((((2494) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2a476fb7a93192eda04e9b6a() {
  return __cxx_static_address_2a476fb7a93192eda04e9b6a.reference || (__cxx_static_address_2a476fb7a93192eda04e9b6a.reference = {
    __cReference: true,
    get value() { return WINDOWBORDER1____header_global_85ac9c8c9af1fc2f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:656
export const TEXTBOX____header_global_0201e712ddd856f8 = ((((((2495) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f1b6b839077ab2650d6d07ad() {
  return __cxx_static_address_f1b6b839077ab2650d6d07ad.reference || (__cxx_static_address_f1b6b839077ab2650d6d07ad.reference = {
    __cReference: true,
    get value() { return TEXTBOX____header_global_0201e712ddd856f8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:657
export const WINDOWBORDER2____header_global_2dd171d6c8ac4828 = ((((((2496) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_63da02057f5f139cae6b95c6() {
  return __cxx_static_address_63da02057f5f139cae6b95c6.reference || (__cxx_static_address_63da02057f5f139cae6b95c6.reference = {
    __cReference: true,
    get value() { return WINDOWBORDER2____header_global_2dd171d6c8ac4828; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:658
export const DUKENUKEM____header_global_b5216c60d6435d60 = ((((((2497) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ed675b27350e09904eee7bf5() {
  return __cxx_static_address_ed675b27350e09904eee7bf5.reference || (__cxx_static_address_ed675b27350e09904eee7bf5.reference = {
    __cReference: true,
    get value() { return DUKENUKEM____header_global_b5216c60d6435d60; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:659
export const THREEDEE____header_global_4d611ae1914819a3 = ((((((2498) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3f14ba93936c297308b410a5() {
  return __cxx_static_address_3f14ba93936c297308b410a5.reference || (__cxx_static_address_3f14ba93936c297308b410a5.reference = {
    __cReference: true,
    get value() { return THREEDEE____header_global_4d611ae1914819a3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:660
export const INGAMEDUKETHREEDEE____header_global_4bd59f6b561b9047 = ((((((2499) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c320f2428bc306fcd5d607c3() {
  return __cxx_static_address_c320f2428bc306fcd5d607c3.reference || (__cxx_static_address_c320f2428bc306fcd5d607c3.reference = {
    __cReference: true,
    get value() { return INGAMEDUKETHREEDEE____header_global_4bd59f6b561b9047; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:661
export const TENSCREEN____header_global_8fac7c85ee2176e5 = ((((((2500) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_edf3901e4c93cbbdd040476f() {
  return __cxx_static_address_edf3901e4c93cbbdd040476f.reference || (__cxx_static_address_edf3901e4c93cbbdd040476f.reference = {
    __cReference: true,
    get value() { return TENSCREEN____header_global_8fac7c85ee2176e5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:662
export const PLUTOPAKSPRITE____header_global_885fb7db11768ad1 = ((((((2501) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_69f7f198e9a1e05a833800d4() {
  return __cxx_static_address_69f7f198e9a1e05a833800d4.reference || (__cxx_static_address_69f7f198e9a1e05a833800d4.reference = {
    __cReference: true,
    get value() { return PLUTOPAKSPRITE____header_global_885fb7db11768ad1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:663
export const DEVISTATOR____header_global_f702bf203ec90263 = ((((((2510) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bac71bf47602d29fc55ed80e() {
  return __cxx_static_address_bac71bf47602d29fc55ed80e.reference || (__cxx_static_address_bac71bf47602d29fc55ed80e.reference = {
    __cReference: true,
    get value() { return DEVISTATOR____header_global_f702bf203ec90263; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:664
export const KNEE____header_global_29ab818de89ff643 = ((((((2521) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_959c07d52a864cb6190dbc6e() {
  return __cxx_static_address_959c07d52a864cb6190dbc6e.reference || (__cxx_static_address_959c07d52a864cb6190dbc6e.reference = {
    __cReference: true,
    get value() { return KNEE____header_global_29ab818de89ff643; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:665
export const CROSSHAIR____header_global_a8e1d5da426ba3da = ((((((2523) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_23cd175c5dc55d98154ba595() {
  return __cxx_static_address_23cd175c5dc55d98154ba595.reference || (__cxx_static_address_23cd175c5dc55d98154ba595.reference = {
    __cReference: true,
    get value() { return CROSSHAIR____header_global_a8e1d5da426ba3da; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:666
export const FIRSTGUN____header_global_1ab3de76eb4953a6 = ((((((2524) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eb3213ef977046a692598e3b() {
  return __cxx_static_address_eb3213ef977046a692598e3b.reference || (__cxx_static_address_eb3213ef977046a692598e3b.reference = {
    __cReference: true,
    get value() { return FIRSTGUN____header_global_1ab3de76eb4953a6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:667
export const FIRSTGUNRELOAD____header_global_190ac3dee77dcc60 = ((((((2528) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9dfd048abad6d8d2dfd04c09() {
  return __cxx_static_address_9dfd048abad6d8d2dfd04c09.reference || (__cxx_static_address_9dfd048abad6d8d2dfd04c09.reference = {
    __cReference: true,
    get value() { return FIRSTGUNRELOAD____header_global_190ac3dee77dcc60; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:668
export const SHELL____header_global_cb26169ad4f0637d = ((((((2533) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3a95647cfe2f845f67457aac() {
  return __cxx_static_address_3a95647cfe2f845f67457aac.reference || (__cxx_static_address_3a95647cfe2f845f67457aac.reference = {
    __cReference: true,
    get value() { return SHELL____header_global_cb26169ad4f0637d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:669
export const SHOTGUNSHELL____header_global_314827b8abb70bdf = ((((((2535) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_338331ee9a154afad31a381e() {
  return __cxx_static_address_338331ee9a154afad31a381e.reference || (__cxx_static_address_338331ee9a154afad31a381e.reference = {
    __cReference: true,
    get value() { return SHOTGUNSHELL____header_global_314827b8abb70bdf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:670
export const CHAINGUN____header_global_da87a8bc2037c39b = ((((((2536) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ff230cd1b8e56de53bb78c8a() {
  return __cxx_static_address_ff230cd1b8e56de53bb78c8a.reference || (__cxx_static_address_ff230cd1b8e56de53bb78c8a.reference = {
    __cReference: true,
    get value() { return CHAINGUN____header_global_da87a8bc2037c39b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:671
export const RPGGUN____header_global_07dbd35825d3bfe9 = ((((((2544) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f7beabd4d370f212713dcd35() {
  return __cxx_static_address_f7beabd4d370f212713dcd35.reference || (__cxx_static_address_f7beabd4d370f212713dcd35.reference = {
    __cReference: true,
    get value() { return RPGGUN____header_global_07dbd35825d3bfe9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:672
export const FREEZE____header_global_a2f795edcf348017 = ((((((2548) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_41ce66cfa0507b05c199da33() {
  return __cxx_static_address_41ce66cfa0507b05c199da33.reference || (__cxx_static_address_41ce66cfa0507b05c199da33.reference = {
    __cReference: true,
    get value() { return FREEZE____header_global_a2f795edcf348017; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:673
export const SHRINKER____header_global_0a8943dcca9561dc = ((((((2556) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_64ef41fa7a5aed4d1a7bcf13() {
  return __cxx_static_address_64ef41fa7a5aed4d1a7bcf13.reference || (__cxx_static_address_64ef41fa7a5aed4d1a7bcf13.reference = {
    __cReference: true,
    get value() { return SHRINKER____header_global_0a8943dcca9561dc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:674
export const HANDHOLDINGLASER____header_global_b07e37148f04d5ea = ((((((2563) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c7fc618790726b943c7e1856() {
  return __cxx_static_address_c7fc618790726b943c7e1856.reference || (__cxx_static_address_c7fc618790726b943c7e1856.reference = {
    __cReference: true,
    get value() { return HANDHOLDINGLASER____header_global_b07e37148f04d5ea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:675
export const TRIPBOMB____header_global_985c169871ce121c = ((((((2566) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5a70f929bbc252c1c1b9c7d1() {
  return __cxx_static_address_5a70f929bbc252c1c1b9c7d1.reference || (__cxx_static_address_5a70f929bbc252c1c1b9c7d1.reference = {
    __cReference: true,
    get value() { return TRIPBOMB____header_global_985c169871ce121c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:676
export const LASERLINE____header_global_1fcf31cd2d392f19 = ((((((2567) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b6c4a2aa8ea5ef637d30f1e5() {
  return __cxx_static_address_b6c4a2aa8ea5ef637d30f1e5.reference || (__cxx_static_address_b6c4a2aa8ea5ef637d30f1e5.reference = {
    __cReference: true,
    get value() { return LASERLINE____header_global_1fcf31cd2d392f19; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:677
export const HANDHOLDINGACCESS____header_global_591a64e188359a0c = ((((((2568) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9697211b1ffa9c8bd701a04d() {
  return __cxx_static_address_9697211b1ffa9c8bd701a04d.reference || (__cxx_static_address_9697211b1ffa9c8bd701a04d.reference = {
    __cReference: true,
    get value() { return HANDHOLDINGACCESS____header_global_591a64e188359a0c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:678
export const HANDREMOTE____header_global_b21a47fadb9708b0 = ((((((2570) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d9b782e9a105e52cb40fd02f() {
  return __cxx_static_address_d9b782e9a105e52cb40fd02f.reference || (__cxx_static_address_d9b782e9a105e52cb40fd02f.reference = {
    __cReference: true,
    get value() { return HANDREMOTE____header_global_b21a47fadb9708b0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:679
export const HANDTHROW____header_global_03ce9c1eabaa9bad = ((((((2573) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_102ccf2dcd8ba220ae87687c() {
  return __cxx_static_address_102ccf2dcd8ba220ae87687c.reference || (__cxx_static_address_102ccf2dcd8ba220ae87687c.reference = {
    __cReference: true,
    get value() { return HANDTHROW____header_global_03ce9c1eabaa9bad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:680
export const TIP____header_global_20ee333d4e336e28 = ((((((2576) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eb48d898cf554c6fedd7ba83() {
  return __cxx_static_address_eb48d898cf554c6fedd7ba83.reference || (__cxx_static_address_eb48d898cf554c6fedd7ba83.reference = {
    __cReference: true,
    get value() { return TIP____header_global_20ee333d4e336e28; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:681
export const SCUBAMASK____header_global_4160c66ebb1ed513 = ((((((2581) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_621e6963189971d9841257f2() {
  return __cxx_static_address_621e6963189971d9841257f2.reference || (__cxx_static_address_621e6963189971d9841257f2.reference = {
    __cReference: true,
    get value() { return SCUBAMASK____header_global_4160c66ebb1ed513; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:682
export const FORCESPHERE____header_global_0d4af35292fc4f3c = ((((((2590) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9ead578c0e31f0e539f26bb9() {
  return __cxx_static_address_9ead578c0e31f0e539f26bb9.reference || (__cxx_static_address_9ead578c0e31f0e539f26bb9.reference = {
    __cReference: true,
    get value() { return FORCESPHERE____header_global_0d4af35292fc4f3c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:683
export const SHOTSPARK1____header_global_6439ac6a91c2565d = ((((((2595) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_36703f7f727e2ff0ff0427af() {
  return __cxx_static_address_36703f7f727e2ff0ff0427af.reference || (__cxx_static_address_36703f7f727e2ff0ff0427af.reference = {
    __cReference: true,
    get value() { return SHOTSPARK1____header_global_6439ac6a91c2565d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:684
export const RPG____header_global_d01f4bbb382352b8 = ((((((2605) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8f2e16009c4a81a3694064c5() {
  return __cxx_static_address_8f2e16009c4a81a3694064c5.reference || (__cxx_static_address_8f2e16009c4a81a3694064c5.reference = {
    __cReference: true,
    get value() { return RPG____header_global_d01f4bbb382352b8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:685
export const LASERSITE____header_global_505768337d8d4e77 = ((((((2612) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_70f12753dce659c5501b9475() {
  return __cxx_static_address_70f12753dce659c5501b9475.reference || (__cxx_static_address_70f12753dce659c5501b9475.reference = {
    __cReference: true,
    get value() { return LASERSITE____header_global_505768337d8d4e77; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:686
export const SHOTGUN____header_global_5fc8b4a3500e0ac1 = ((((((2613) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d94f6c0e04789f1d7360658b() {
  return __cxx_static_address_d94f6c0e04789f1d7360658b.reference || (__cxx_static_address_d94f6c0e04789f1d7360658b.reference = {
    __cReference: true,
    get value() { return SHOTGUN____header_global_5fc8b4a3500e0ac1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:687
export const BOSS1____header_global_51325f9a1dde8744 = ((((((2630) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f434a330594ef7a8886bb8ef() {
  return __cxx_static_address_f434a330594ef7a8886bb8ef.reference || (__cxx_static_address_f434a330594ef7a8886bb8ef.reference = {
    __cReference: true,
    get value() { return BOSS1____header_global_51325f9a1dde8744; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:688
export const BOSS1STAYPUT____header_global_bd831d4231b038a8 = ((((((2631) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_30d91f5cbc42a3bb4a69202a() {
  return __cxx_static_address_30d91f5cbc42a3bb4a69202a.reference || (__cxx_static_address_30d91f5cbc42a3bb4a69202a.reference = {
    __cReference: true,
    get value() { return BOSS1STAYPUT____header_global_bd831d4231b038a8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:689
export const BOSS1SHOOT____header_global_24583ca6be40111d = ((((((2660) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f286a1def471a5c160a38f2b() {
  return __cxx_static_address_f286a1def471a5c160a38f2b.reference || (__cxx_static_address_f286a1def471a5c160a38f2b.reference = {
    __cReference: true,
    get value() { return BOSS1SHOOT____header_global_24583ca6be40111d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:690
export const BOSS1LOB____header_global_44f779f7f61ad833 = ((((((2670) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e0e5796a03f4378d9e7f38be() {
  return __cxx_static_address_e0e5796a03f4378d9e7f38be.reference || (__cxx_static_address_e0e5796a03f4378d9e7f38be.reference = {
    __cReference: true,
    get value() { return BOSS1LOB____header_global_44f779f7f61ad833; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:691
export const BOSSTOP____header_global_ce5e35a2d9db101f = ((((((2696) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d966af405f0247be21fdfcbe() {
  return __cxx_static_address_d966af405f0247be21fdfcbe.reference || (__cxx_static_address_d966af405f0247be21fdfcbe.reference = {
    __cReference: true,
    get value() { return BOSSTOP____header_global_ce5e35a2d9db101f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:692
export const BOSS2____header_global_93e51df5331d36be = ((((((2710) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_60801a07446286231aa15917() {
  return __cxx_static_address_60801a07446286231aa15917.reference || (__cxx_static_address_60801a07446286231aa15917.reference = {
    __cReference: true,
    get value() { return BOSS2____header_global_93e51df5331d36be; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:693
export const BOSS3____header_global_840420513bb46f2f = ((((((2760) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b34825611f9b68d0cb2f5dcc() {
  return __cxx_static_address_b34825611f9b68d0cb2f5dcc.reference || (__cxx_static_address_b34825611f9b68d0cb2f5dcc.reference = {
    __cReference: true,
    get value() { return BOSS3____header_global_840420513bb46f2f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:694
export const SPINNINGNUKEICON____header_global_58813007f973601a = ((((((2813) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6cebd184e13488cf566e7870() {
  return __cxx_static_address_6cebd184e13488cf566e7870.reference || (__cxx_static_address_6cebd184e13488cf566e7870.reference = {
    __cReference: true,
    get value() { return SPINNINGNUKEICON____header_global_58813007f973601a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:695
export const SMALLFNTCURSOR____header_global_eea2518a1f0ca5d3 = ((((((2821) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2133193eea219fe0b3ce91b8() {
  return __cxx_static_address_2133193eea219fe0b3ce91b8.reference || (__cxx_static_address_2133193eea219fe0b3ce91b8.reference = {
    __cReference: true,
    get value() { return SMALLFNTCURSOR____header_global_eea2518a1f0ca5d3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:696
export const STARTALPHANUM____header_global_8bde4a4ac8b9d2b4 = ((((((2822) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_19483bff93a2c03ade8cb285() {
  return __cxx_static_address_19483bff93a2c03ade8cb285.reference || (__cxx_static_address_19483bff93a2c03ade8cb285.reference = {
    __cReference: true,
    get value() { return STARTALPHANUM____header_global_8bde4a4ac8b9d2b4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:697
export const ENDALPHANUM____header_global_d79c3fbadece19fa = ((((((2915) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_32206d323a67d21d4707af73() {
  return __cxx_static_address_32206d323a67d21d4707af73.reference || (__cxx_static_address_32206d323a67d21d4707af73.reference = {
    __cReference: true,
    get value() { return ENDALPHANUM____header_global_d79c3fbadece19fa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:698
export const BIGALPHANUM____header_global_96302a28ae815f4f = ((((((2940) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_57b994e55cd1800f651365dd() {
  return __cxx_static_address_57b994e55cd1800f651365dd.reference || (__cxx_static_address_57b994e55cd1800f651365dd.reference = {
    __cReference: true,
    get value() { return BIGALPHANUM____header_global_96302a28ae815f4f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:699
export const BIGPERIOD____header_global_744fc8180723b99e = ((((((3002) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_df43d7ac94c2c94417b59dbb() {
  return __cxx_static_address_df43d7ac94c2c94417b59dbb.reference || (__cxx_static_address_df43d7ac94c2c94417b59dbb.reference = {
    __cReference: true,
    get value() { return BIGPERIOD____header_global_744fc8180723b99e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:700
export const BIGCOMMA____header_global_5b3e6e0337346dae = ((((((3003) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_972dbcacfa55ac9dffd2dbd5() {
  return __cxx_static_address_972dbcacfa55ac9dffd2dbd5.reference || (__cxx_static_address_972dbcacfa55ac9dffd2dbd5.reference = {
    __cReference: true,
    get value() { return BIGCOMMA____header_global_5b3e6e0337346dae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:701
export const BIGX____header_global_806ccc0cee5b63d2 = ((((((3004) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bbbd3aa5765e8e209f4adf94() {
  return __cxx_static_address_bbbd3aa5765e8e209f4adf94.reference || (__cxx_static_address_bbbd3aa5765e8e209f4adf94.reference = {
    __cReference: true,
    get value() { return BIGX____header_global_806ccc0cee5b63d2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:702
export const BIGQ____header_global_d154639f136e3d7b = ((((((3005) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f41f66d07a7cc68ab409ab38() {
  return __cxx_static_address_f41f66d07a7cc68ab409ab38.reference || (__cxx_static_address_f41f66d07a7cc68ab409ab38.reference = {
    __cReference: true,
    get value() { return BIGQ____header_global_d154639f136e3d7b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:703
export const BIGSEMI____header_global_e162a13f99e50b16 = ((((((3006) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0e8f4274b4a1c41739ee6605() {
  return __cxx_static_address_0e8f4274b4a1c41739ee6605.reference || (__cxx_static_address_0e8f4274b4a1c41739ee6605.reference = {
    __cReference: true,
    get value() { return BIGSEMI____header_global_e162a13f99e50b16; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:704
export const BIGCOLIN____header_global_e375478888112ed5 = ((((((3007) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4195fc6c1c4313afe0b09dea() {
  return __cxx_static_address_4195fc6c1c4313afe0b09dea.reference || (__cxx_static_address_4195fc6c1c4313afe0b09dea.reference = {
    __cReference: true,
    get value() { return BIGCOLIN____header_global_e375478888112ed5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:705
export const THREEBYFIVE____header_global_dc98e9d98a321c7f = ((((((3010) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ad31fc832ee87870f93d4476() {
  return __cxx_static_address_ad31fc832ee87870f93d4476.reference || (__cxx_static_address_ad31fc832ee87870f93d4476.reference = {
    __cReference: true,
    get value() { return THREEBYFIVE____header_global_dc98e9d98a321c7f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:706
export const BIGAPPOS____header_global_7eb5362de2d22eeb = ((((((3022) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_71d6d1adb53abc6eb72db995() {
  return __cxx_static_address_71d6d1adb53abc6eb72db995.reference || (__cxx_static_address_71d6d1adb53abc6eb72db995.reference = {
    __cReference: true,
    get value() { return BIGAPPOS____header_global_7eb5362de2d22eeb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:707
export const MINIFONT____header_global_a29a8d49521a119a = ((((((3072) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f72dbf944801974e76380d43() {
  return __cxx_static_address_f72dbf944801974e76380d43.reference || (__cxx_static_address_f72dbf944801974e76380d43.reference = {
    __cReference: true,
    get value() { return MINIFONT____header_global_a29a8d49521a119a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:708
export const RESPAWNMARKERRED____header_global_2277b1a8c43db0a2 = ((((((3190) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eebb78e6161e1c2fd520c903() {
  return __cxx_static_address_eebb78e6161e1c2fd520c903.reference || (__cxx_static_address_eebb78e6161e1c2fd520c903.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERRED____header_global_2277b1a8c43db0a2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:709
export const RESPAWNMARKERYELLOW____header_global_1b952602afe1fb33 = ((((((3200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1a53ad45de609776e308d460() {
  return __cxx_static_address_1a53ad45de609776e308d460.reference || (__cxx_static_address_1a53ad45de609776e308d460.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERYELLOW____header_global_1b952602afe1fb33; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:710
export const RESPAWNMARKERGREEN____header_global_97814e50a48bd9ce = ((((((3210) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9516d814d8fa2c5330a696e1() {
  return __cxx_static_address_9516d814d8fa2c5330a696e1.reference || (__cxx_static_address_9516d814d8fa2c5330a696e1.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERGREEN____header_global_97814e50a48bd9ce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:711
export const BONUSSCREEN____header_global_2ffc2ff1d0285d68 = ((((((3240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_96f8870d02ff23283727fce3() {
  return __cxx_static_address_96f8870d02ff23283727fce3.reference || (__cxx_static_address_96f8870d02ff23283727fce3.reference = {
    __cReference: true,
    get value() { return BONUSSCREEN____header_global_2ffc2ff1d0285d68; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:712
export const VIEWBORDER____header_global_b27de6952356706b = ((((((3250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ca4055d3b3e8db77bc438a2b() {
  return __cxx_static_address_ca4055d3b3e8db77bc438a2b.reference || (__cxx_static_address_ca4055d3b3e8db77bc438a2b.reference = {
    __cReference: true,
    get value() { return VIEWBORDER____header_global_b27de6952356706b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:713
export const VICTORY1____header_global_be380a01e98fa116 = ((((((3260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_09689fd28c42aff0af286090() {
  return __cxx_static_address_09689fd28c42aff0af286090.reference || (__cxx_static_address_09689fd28c42aff0af286090.reference = {
    __cReference: true,
    get value() { return VICTORY1____header_global_be380a01e98fa116; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:714
export const ORDERING____header_global_4ea70bb248ed47e7 = ((((((3270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4bdb0edb1bb192d6c29866e7() {
  return __cxx_static_address_4bdb0edb1bb192d6c29866e7.reference || (__cxx_static_address_4bdb0edb1bb192d6c29866e7.reference = {
    __cReference: true,
    get value() { return ORDERING____header_global_4ea70bb248ed47e7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:715
export const TEXTSTORY____header_global_d3a3e1d442375780 = ((((((3280) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8bf59a35085175b87a20aa28() {
  return __cxx_static_address_8bf59a35085175b87a20aa28.reference || (__cxx_static_address_8bf59a35085175b87a20aa28.reference = {
    __cReference: true,
    get value() { return TEXTSTORY____header_global_d3a3e1d442375780; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:716
export const LOADSCREEN____header_global_702dac3d9f4f972f = ((((((3281) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b68d69009588df2d1424db6d() {
  return __cxx_static_address_b68d69009588df2d1424db6d.reference || (__cxx_static_address_b68d69009588df2d1424db6d.reference = {
    __cReference: true,
    get value() { return LOADSCREEN____header_global_702dac3d9f4f972f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:717
export const BORNTOBEWILDSCREEN____header_global_7b42927cd16c6219 = ((((((3370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_36acf1864f451e6065a64814() {
  return __cxx_static_address_36acf1864f451e6065a64814.reference || (__cxx_static_address_36acf1864f451e6065a64814.reference = {
    __cReference: true,
    get value() { return BORNTOBEWILDSCREEN____header_global_7b42927cd16c6219; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:718
export const BLIMP____header_global_beca5095a7caeff2 = ((((((3400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5c057ecf1bb313a37851db03() {
  return __cxx_static_address_5c057ecf1bb313a37851db03.reference || (__cxx_static_address_5c057ecf1bb313a37851db03.reference = {
    __cReference: true,
    get value() { return BLIMP____header_global_beca5095a7caeff2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:719
export const FEM9____header_global_86dd939ab64a28d4 = ((((((3450) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4853342454fbf90a63f6bb33() {
  return __cxx_static_address_4853342454fbf90a63f6bb33.reference || (__cxx_static_address_4853342454fbf90a63f6bb33.reference = {
    __cReference: true,
    get value() { return FEM9____header_global_86dd939ab64a28d4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:720
export const FRAMEEFFECT1_13____header_global_7c4bac22640a6724 = ((((((3999) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f4c89164bff5b9ce1599e945() {
  return __cxx_static_address_f4c89164bff5b9ce1599e945.reference || (__cxx_static_address_f4c89164bff5b9ce1599e945.reference = {
    __cReference: true,
    get value() { return FRAMEEFFECT1_13____header_global_7c4bac22640a6724; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:721
export const FRAMEEFFECT1____header_global_bb3a25e34c7b6334 = ((((((4095) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_53b803fbbd88e4a7e3ce95c2() {
  return __cxx_static_address_53b803fbbd88e4a7e3ce95c2.reference || (__cxx_static_address_53b803fbbd88e4a7e3ce95c2.reference = {
    __cReference: true,
    get value() { return FRAMEEFFECT1____header_global_bb3a25e34c7b6334; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:722
export const PANNEL3____header_global_8003333f1bb8a7eb = ((((((4099) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_69d76cfd665d23381df3a47a() {
  return __cxx_static_address_69d76cfd665d23381df3a47a.reference || (__cxx_static_address_69d76cfd665d23381df3a47a.reference = {
    __cReference: true,
    get value() { return PANNEL3____header_global_8003333f1bb8a7eb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:723
export const SCREENBREAK14____header_global_9be7ef1f657211ba = ((((((4120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2a3b3120ef6668e6edf25bb1() {
  return __cxx_static_address_2a3b3120ef6668e6edf25bb1.reference || (__cxx_static_address_2a3b3120ef6668e6edf25bb1.reference = {
    __cReference: true,
    get value() { return SCREENBREAK14____header_global_9be7ef1f657211ba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:724
export const SCREENBREAK15____header_global_9a0fc28272682c15 = ((((((4123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e66519be9fb02704b787cb97() {
  return __cxx_static_address_e66519be9fb02704b787cb97.reference || (__cxx_static_address_e66519be9fb02704b787cb97.reference = {
    __cReference: true,
    get value() { return SCREENBREAK15____header_global_9a0fc28272682c15; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:725
export const SCREENBREAK19____header_global_772034c47e948501 = ((((((4125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1f7e9b8d0715c4e8dba335fb() {
  return __cxx_static_address_1f7e9b8d0715c4e8dba335fb.reference || (__cxx_static_address_1f7e9b8d0715c4e8dba335fb.reference = {
    __cReference: true,
    get value() { return SCREENBREAK19____header_global_772034c47e948501; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:726
export const SCREENBREAK16____header_global_eb52707aed608a87 = ((((((4127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_62ac97809112d89af02a0b45() {
  return __cxx_static_address_62ac97809112d89af02a0b45.reference || (__cxx_static_address_62ac97809112d89af02a0b45.reference = {
    __cReference: true,
    get value() { return SCREENBREAK16____header_global_eb52707aed608a87; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:727
export const SCREENBREAK17____header_global_62f27e3a1a7f4c82 = ((((((4128) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ec67123a72a7af7e9b6177d5() {
  return __cxx_static_address_ec67123a72a7af7e9b6177d5.reference || (__cxx_static_address_ec67123a72a7af7e9b6177d5.reference = {
    __cReference: true,
    get value() { return SCREENBREAK17____header_global_62f27e3a1a7f4c82; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:728
export const SCREENBREAK18____header_global_afe86ae077c17b6a = ((((((4129) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_99107d811dcfd61d052dad39() {
  return __cxx_static_address_99107d811dcfd61d052dad39.reference || (__cxx_static_address_99107d811dcfd61d052dad39.reference = {
    __cReference: true,
    get value() { return SCREENBREAK18____header_global_afe86ae077c17b6a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:729
export const W_TECHWALL11____header_global_e52f41f2f20c85f2 = ((((((4130) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a93da885d5cbc55b8c3907b8() {
  return __cxx_static_address_a93da885d5cbc55b8c3907b8.reference || (__cxx_static_address_a93da885d5cbc55b8c3907b8.reference = {
    __cReference: true,
    get value() { return W_TECHWALL11____header_global_e52f41f2f20c85f2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:730
export const W_TECHWALL12____header_global_bf2451c94eaa3051 = ((((((4131) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d1e34069253261fc3274be8e() {
  return __cxx_static_address_d1e34069253261fc3274be8e.reference || (__cxx_static_address_d1e34069253261fc3274be8e.reference = {
    __cReference: true,
    get value() { return W_TECHWALL12____header_global_bf2451c94eaa3051; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:731
export const W_TECHWALL13____header_global_b2706c383329d5b1 = ((((((4132) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a29d017f2cd0e4ab7e850bb5() {
  return __cxx_static_address_a29d017f2cd0e4ab7e850bb5.reference || (__cxx_static_address_a29d017f2cd0e4ab7e850bb5.reference = {
    __cReference: true,
    get value() { return W_TECHWALL13____header_global_b2706c383329d5b1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:732
export const W_TECHWALL14____header_global_90fd354d0a15b170 = ((((((4133) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_db8521b472f229fe6668c023() {
  return __cxx_static_address_db8521b472f229fe6668c023.reference || (__cxx_static_address_db8521b472f229fe6668c023.reference = {
    __cReference: true,
    get value() { return W_TECHWALL14____header_global_90fd354d0a15b170; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:733
export const W_TECHWALL5____header_global_555d71eaa60322f0 = ((((((4134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_da6c3aa12ba794bcae452cf6() {
  return __cxx_static_address_da6c3aa12ba794bcae452cf6.reference || (__cxx_static_address_da6c3aa12ba794bcae452cf6.reference = {
    __cReference: true,
    get value() { return W_TECHWALL5____header_global_555d71eaa60322f0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:734
export const W_TECHWALL6____header_global_899ff3fc7a6b0817 = ((((((4136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6dc82058e02ffc65da04d136() {
  return __cxx_static_address_6dc82058e02ffc65da04d136.reference || (__cxx_static_address_6dc82058e02ffc65da04d136.reference = {
    __cReference: true,
    get value() { return W_TECHWALL6____header_global_899ff3fc7a6b0817; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:735
export const W_TECHWALL7____header_global_922d73b0862f5bf5 = ((((((4138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_46a5bfbc89898060cb9151e3() {
  return __cxx_static_address_46a5bfbc89898060cb9151e3.reference || (__cxx_static_address_46a5bfbc89898060cb9151e3.reference = {
    __cReference: true,
    get value() { return W_TECHWALL7____header_global_922d73b0862f5bf5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:736
export const W_TECHWALL8____header_global_29835364bcc9ece5 = ((((((4140) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c890e8a9373e60ab6b8c1ec3() {
  return __cxx_static_address_c890e8a9373e60ab6b8c1ec3.reference || (__cxx_static_address_c890e8a9373e60ab6b8c1ec3.reference = {
    __cReference: true,
    get value() { return W_TECHWALL8____header_global_29835364bcc9ece5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:737
export const W_TECHWALL9____header_global_70bcea6e072e5836 = ((((((4142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1245075754e5b8976ecae8cc() {
  return __cxx_static_address_1245075754e5b8976ecae8cc.reference || (__cxx_static_address_1245075754e5b8976ecae8cc.reference = {
    __cReference: true,
    get value() { return W_TECHWALL9____header_global_70bcea6e072e5836; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:738
export const BPANNEL3____header_global_d7b554db74e4970a = ((((((4100) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_68a593cfaefd90aa2421d91d() {
  return __cxx_static_address_68a593cfaefd90aa2421d91d.reference || (__cxx_static_address_68a593cfaefd90aa2421d91d.reference = {
    __cReference: true,
    get value() { return BPANNEL3____header_global_d7b554db74e4970a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:739
export const W_HITTECHWALL16____header_global_bf2c50db20ca6a78 = ((((((4144) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_833cf9fcf88ab4cfe82ee8f6() {
  return __cxx_static_address_833cf9fcf88ab4cfe82ee8f6.reference || (__cxx_static_address_833cf9fcf88ab4cfe82ee8f6.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL16____header_global_bf2c50db20ca6a78; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:740
export const W_HITTECHWALL10____header_global_9fec93e31335032c = ((((((4145) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3ad29debd5df3347105cc256() {
  return __cxx_static_address_3ad29debd5df3347105cc256.reference || (__cxx_static_address_3ad29debd5df3347105cc256.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL10____header_global_9fec93e31335032c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:741
export const W_HITTECHWALL15____header_global_00144c91a2d9311e = ((((((4147) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e3e6ce17b84570285e2c9f14() {
  return __cxx_static_address_e3e6ce17b84570285e2c9f14.reference || (__cxx_static_address_e3e6ce17b84570285e2c9f14.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL15____header_global_00144c91a2d9311e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:742
export const W_MILKSHELF____header_global_6021dacfc0a202ce = ((((((4181) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ad4b46b50febff1c0a3b5993() {
  return __cxx_static_address_ad4b46b50febff1c0a3b5993.reference || (__cxx_static_address_ad4b46b50febff1c0a3b5993.reference = {
    __cReference: true,
    get value() { return W_MILKSHELF____header_global_6021dacfc0a202ce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:743
export const W_MILKSHELFBROKE____header_global_8f801687aaf236dc = ((((((4203) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b3e93592292e26ba584d86d1() {
  return __cxx_static_address_b3e93592292e26ba584d86d1.reference || (__cxx_static_address_b3e93592292e26ba584d86d1.reference = {
    __cReference: true,
    get value() { return W_MILKSHELFBROKE____header_global_8f801687aaf236dc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:744
export const PURPLELAVA____header_global_1ced060615fbd602 = ((((((4240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c390f0e539b227b87c02428e() {
  return __cxx_static_address_c390f0e539b227b87c02428e.reference || (__cxx_static_address_c390f0e539b227b87c02428e.reference = {
    __cReference: true,
    get value() { return PURPLELAVA____header_global_1ced060615fbd602; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:745
export const TARGET____header_global_823156f27c07bc73 = ((((((4359) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a3b34ceb653a3efb84b56d2a() {
  return __cxx_static_address_a3b34ceb653a3efb84b56d2a.reference || (__cxx_static_address_a3b34ceb653a3efb84b56d2a.reference = {
    __cReference: true,
    get value() { return TARGET____header_global_823156f27c07bc73; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:746
export const DUCK____header_global_6f754acb7b89f3a9 = ((((((4361) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7fa8498fbd224b8c361ba6e4() {
  return __cxx_static_address_7fa8498fbd224b8c361ba6e4.reference || (__cxx_static_address_7fa8498fbd224b8c361ba6e4.reference = {
    __cReference: true,
    get value() { return DUCK____header_global_6f754acb7b89f3a9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:747
export const PUKE____header_global_76bc736d00772ba8 = ((((((4389) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0641e1ec7482a4f99adf4edb() {
  return __cxx_static_address_0641e1ec7482a4f99adf4edb.reference || (__cxx_static_address_0641e1ec7482a4f99adf4edb.reference = {
    __cReference: true,
    get value() { return PUKE____header_global_76bc736d00772ba8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:748
export const DOORTILE23____header_global_a73d3c41545d3706 = ((((((4391) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f6dc826fb60a8e2bb5efa87d() {
  return __cxx_static_address_f6dc826fb60a8e2bb5efa87d.reference || (__cxx_static_address_f6dc826fb60a8e2bb5efa87d.reference = {
    __cReference: true,
    get value() { return DOORTILE23____header_global_a73d3c41545d3706; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:749
export const SPEAKER____header_global_39566af22654346a = ((((((4397) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_370700318770ccc733a4ffd5() {
  return __cxx_static_address_370700318770ccc733a4ffd5.reference || (__cxx_static_address_370700318770ccc733a4ffd5.reference = {
    __cReference: true,
    get value() { return SPEAKER____header_global_39566af22654346a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:750
export const MAIL____header_global_69ff540d66139146 = ((((((4410) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c1aca2776013ff162b791018() {
  return __cxx_static_address_c1aca2776013ff162b791018.reference || (__cxx_static_address_c1aca2776013ff162b791018.reference = {
    __cReference: true,
    get value() { return MAIL____header_global_69ff540d66139146; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:751
export const HOTMEAT____header_global_5694d1c5b0559501 = ((((((4427) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1bcf0cbdb1d43fef06b27f0d() {
  return __cxx_static_address_1bcf0cbdb1d43fef06b27f0d.reference || (__cxx_static_address_1bcf0cbdb1d43fef06b27f0d.reference = {
    __cReference: true,
    get value() { return HOTMEAT____header_global_5694d1c5b0559501; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:752
export const TRIPODCAMERA____header_global_1d0ce95a5c91c1a8 = ((((((4444) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_02213776e7d87fddcf73bdd2() {
  return __cxx_static_address_02213776e7d87fddcf73bdd2.reference || (__cxx_static_address_02213776e7d87fddcf73bdd2.reference = {
    __cReference: true,
    get value() { return TRIPODCAMERA____header_global_1d0ce95a5c91c1a8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:753
export const PAPER____header_global_3a97dc64de19c02c = ((((((4460) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_24f612695ddb1a89456735bf() {
  return __cxx_static_address_24f612695ddb1a89456735bf.reference || (__cxx_static_address_24f612695ddb1a89456735bf.reference = {
    __cReference: true,
    get value() { return PAPER____header_global_3a97dc64de19c02c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:754
export const GENERICPOLE2____header_global_efa0ff7e4608ee80 = ((((((4465) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d32e66ebdfdf5ff66ae34e9f() {
  return __cxx_static_address_d32e66ebdfdf5ff66ae34e9f.reference || (__cxx_static_address_d32e66ebdfdf5ff66ae34e9f.reference = {
    __cReference: true,
    get value() { return GENERICPOLE2____header_global_efa0ff7e4608ee80; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:755
export const XXXSTACY____header_global_545ad8538f016ac5 = ((((((4470) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_12dce55bb23e39d0b47001de() {
  return __cxx_static_address_12dce55bb23e39d0b47001de.reference || (__cxx_static_address_12dce55bb23e39d0b47001de.reference = {
    __cReference: true,
    get value() { return XXXSTACY____header_global_545ad8538f016ac5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:756
export const LETTER____header_global_c3dcfe5eaca53f24 = ((((((4502) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_228e6cf0295b0f213d81ff64() {
  return __cxx_static_address_228e6cf0295b0f213d81ff64.reference || (__cxx_static_address_228e6cf0295b0f213d81ff64.reference = {
    __cReference: true,
    get value() { return LETTER____header_global_c3dcfe5eaca53f24; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:757
export const SIDEBOLT1____header_global_92bec2e34cbc5e95 = ((((((4525) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c46e5f764553834771da29b5() {
  return __cxx_static_address_c46e5f764553834771da29b5.reference || (__cxx_static_address_c46e5f764553834771da29b5.reference = {
    __cReference: true,
    get value() { return SIDEBOLT1____header_global_92bec2e34cbc5e95; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:758
export const FOODOBJECT16____header_global_fc6d3e40bfd49052 = ((((((4545) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7072d83883bd726998b3cc03() {
  return __cxx_static_address_7072d83883bd726998b3cc03.reference || (__cxx_static_address_7072d83883bd726998b3cc03.reference = {
    __cReference: true,
    get value() { return FOODOBJECT16____header_global_fc6d3e40bfd49052; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:759
export const TAMPON____header_global_63491910853e44a1 = ((((((4557) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aadaec85c443dcf3f926e55a() {
  return __cxx_static_address_aadaec85c443dcf3f926e55a.reference || (__cxx_static_address_aadaec85c443dcf3f926e55a.reference = {
    __cReference: true,
    get value() { return TAMPON____header_global_63491910853e44a1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:760
export const CANWITHSOMETHING2____header_global_cce9d2d2b5414793 = ((((((4580) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cc02a57a99d963c383f529d8() {
  return __cxx_static_address_cc02a57a99d963c383f529d8.reference || (__cxx_static_address_cc02a57a99d963c383f529d8.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING2____header_global_cce9d2d2b5414793; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:761
export const CANWITHSOMETHING3____header_global_6a32ac85be31459a = ((((((4581) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c6a15dc3e33fa474dbec00c1() {
  return __cxx_static_address_c6a15dc3e33fa474dbec00c1.reference || (__cxx_static_address_c6a15dc3e33fa474dbec00c1.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING3____header_global_6a32ac85be31459a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:762
export const CANWITHSOMETHING4____header_global_66b1c015432594b4 = ((((((4582) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f3b9bde0d08fa37b14500c8a() {
  return __cxx_static_address_f3b9bde0d08fa37b14500c8a.reference || (__cxx_static_address_f3b9bde0d08fa37b14500c8a.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING4____header_global_66b1c015432594b4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:763
export const DOLPHIN1____header_global_e0301166298f52c1 = ((((((4591) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f1b4add1222067f72033df40() {
  return __cxx_static_address_f1b4add1222067f72033df40.reference || (__cxx_static_address_f1b4add1222067f72033df40.reference = {
    __cReference: true,
    get value() { return DOLPHIN1____header_global_e0301166298f52c1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:764
export const DOLPHIN2____header_global_314ca54f1c631666 = ((((((4592) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fba8a89064e9e51114fdb93b() {
  return __cxx_static_address_fba8a89064e9e51114fdb93b.reference || (__cxx_static_address_fba8a89064e9e51114fdb93b.reference = {
    __cReference: true,
    get value() { return DOLPHIN2____header_global_314ca54f1c631666; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:765
export const NEWBEAST____header_global_7de817bf998b60bd = ((((((4610) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a027e074b098379daf64b488() {
  return __cxx_static_address_a027e074b098379daf64b488.reference || (__cxx_static_address_a027e074b098379daf64b488.reference = {
    __cReference: true,
    get value() { return NEWBEAST____header_global_7de817bf998b60bd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:766
export const NEWBEASTSTAYPUT____header_global_d74279fcbabd1213 = ((((((4611) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5f9b71d52c3cd9cb945a6f30() {
  return __cxx_static_address_5f9b71d52c3cd9cb945a6f30.reference || (__cxx_static_address_5f9b71d52c3cd9cb945a6f30.reference = {
    __cReference: true,
    get value() { return NEWBEASTSTAYPUT____header_global_d74279fcbabd1213; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:767
export const BOSS4____header_global_005a3c13a8c9d5e2 = ((((((4740) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_09e34d4a7931bd2c24a05d83() {
  return __cxx_static_address_09e34d4a7931bd2c24a05d83.reference || (__cxx_static_address_09e34d4a7931bd2c24a05d83.reference = {
    __cReference: true,
    get value() { return BOSS4____header_global_005a3c13a8c9d5e2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:768
export const BOSS4STAYPUT____header_global_c0d52b493bec598e = ((((((4741) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_22107134470bd0f903d072a3() {
  return __cxx_static_address_22107134470bd0f903d072a3.reference || (__cxx_static_address_22107134470bd0f903d072a3.reference = {
    __cReference: true,
    get value() { return BOSS4STAYPUT____header_global_c0d52b493bec598e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:769
export const FEM10____header_global_f726497d9eb2cfa6 = ((((((4864) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d1f8b08d8eab07b5b34df803() {
  return __cxx_static_address_d1f8b08d8eab07b5b34df803.reference || (__cxx_static_address_d1f8b08d8eab07b5b34df803.reference = {
    __cReference: true,
    get value() { return FEM10____header_global_f726497d9eb2cfa6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:770
export const TOUGHGAL____header_global_1d20bf76d66e761d = ((((((4866) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a3313eda6f9e3c16b7a82480() {
  return __cxx_static_address_a3313eda6f9e3c16b7a82480.reference || (__cxx_static_address_a3313eda6f9e3c16b7a82480.reference = {
    __cReference: true,
    get value() { return TOUGHGAL____header_global_1d20bf76d66e761d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:771
export const MAN____header_global_74d163820c0c5b91 = ((((((4871) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dca51817cd7cf9d797f900cd() {
  return __cxx_static_address_dca51817cd7cf9d797f900cd.reference || (__cxx_static_address_dca51817cd7cf9d797f900cd.reference = {
    __cReference: true,
    get value() { return MAN____header_global_74d163820c0c5b91; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:772
export const MAN2____header_global_0e2a60f4d19db8c3 = ((((((4872) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_89e1bdfcb10b91e9484aa974() {
  return __cxx_static_address_89e1bdfcb10b91e9484aa974.reference || (__cxx_static_address_89e1bdfcb10b91e9484aa974.reference = {
    __cReference: true,
    get value() { return MAN2____header_global_0e2a60f4d19db8c3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:773
export const WOMAN____header_global_6460c75586721ead = ((((((4874) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2115e9569bc074e9ebc9dce7() {
  return __cxx_static_address_2115e9569bc074e9ebc9dce7.reference || (__cxx_static_address_2115e9569bc074e9ebc9dce7.reference = {
    __cReference: true,
    get value() { return WOMAN____header_global_6460c75586721ead; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:774
export const NATURALLIGHTNING____header_global_9cc68b796d4e4420 = ((((((4890) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_deed3a2e4cdd6cf23302d431() {
  return __cxx_static_address_deed3a2e4cdd6cf23302d431.reference || (__cxx_static_address_deed3a2e4cdd6cf23302d431.reference = {
    __cReference: true,
    get value() { return NATURALLIGHTNING____header_global_9cc68b796d4e4420; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:775
export const WEATHERWARN____header_global_8c9cff91701fb68c = ((((((4893) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7afb93f5197a0557546218a9() {
  return __cxx_static_address_7afb93f5197a0557546218a9.reference || (__cxx_static_address_7afb93f5197a0557546218a9.reference = {
    __cReference: true,
    get value() { return WEATHERWARN____header_global_8c9cff91701fb68c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:776
export const DUKETAG____header_global_fed6b311284d111a = ((((((4900) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6ee2884c883445ecb2c4cc81() {
  return __cxx_static_address_6ee2884c883445ecb2c4cc81.reference || (__cxx_static_address_6ee2884c883445ecb2c4cc81.reference = {
    __cReference: true,
    get value() { return DUKETAG____header_global_fed6b311284d111a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:777
export const SIGN1____header_global_0a90f247b077d50e = ((((((4909) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e685901317e8f8fdd40f2525() {
  return __cxx_static_address_e685901317e8f8fdd40f2525.reference || (__cxx_static_address_e685901317e8f8fdd40f2525.reference = {
    __cReference: true,
    get value() { return SIGN1____header_global_0a90f247b077d50e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:778
export const SIGN2____header_global_679e68c51da837c3 = ((((((4912) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c933ff3a53f923ccccd02d4c() {
  return __cxx_static_address_c933ff3a53f923ccccd02d4c.reference || (__cxx_static_address_c933ff3a53f923ccccd02d4c.reference = {
    __cReference: true,
    get value() { return SIGN2____header_global_679e68c51da837c3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:779
export const JURYGUY____header_global_8de86516eb2d1513 = ((((((4943) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0e56a6cf0525ab0acf05309d() {
  return __cxx_static_address_0e56a6cf0525ab0acf05309d.reference || (__cxx_static_address_0e56a6cf0525ab0acf05309d.reference = {
    __cReference: true,
    get value() { return JURYGUY____header_global_8de86516eb2d1513; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:780
export const WIDESCREENSTATUSBAR____header_global_8a1450a3eaa4e42d = ((((((5120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f84139db260a337cfd2263e9() {
  return __cxx_static_address_f84139db260a337cfd2263e9.reference || (__cxx_static_address_f84139db260a337cfd2263e9.reference = {
    __cReference: true,
    get value() { return WIDESCREENSTATUSBAR____header_global_8a1450a3eaa4e42d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:781
export const RPGGUNWIDE____header_global_0776b1c2cf841422 = ((((((5121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_264c66635e39ac72ba71b3da() {
  return __cxx_static_address_264c66635e39ac72ba71b3da.reference || (__cxx_static_address_264c66635e39ac72ba71b3da.reference = {
    __cReference: true,
    get value() { return RPGGUNWIDE____header_global_0776b1c2cf841422; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:782
export const FIRSTGUNRELOADWIDE____header_global_c5c314f4b9e3c173 = ((((((5122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9fc941b6a93a75bbeab99177() {
  return __cxx_static_address_9fc941b6a93a75bbeab99177.reference || (__cxx_static_address_9fc941b6a93a75bbeab99177.reference = {
    __cReference: true,
    get value() { return FIRSTGUNRELOADWIDE____header_global_c5c314f4b9e3c173; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:783
export const FREEZEWIDE____header_global_aab23a202d481db1 = ((((((5123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ce926a9d69d8b8cbeb704e1a() {
  return __cxx_static_address_ce926a9d69d8b8cbeb704e1a.reference || (__cxx_static_address_ce926a9d69d8b8cbeb704e1a.reference = {
    __cReference: true,
    get value() { return FREEZEWIDE____header_global_aab23a202d481db1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:784
export const FREEZEFIREWIDE____header_global_ed9c32ec326f6f1f = ((((((5124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_93db94eef9c0b7e39c53bfc6() {
  return __cxx_static_address_93db94eef9c0b7e39c53bfc6.reference || (__cxx_static_address_93db94eef9c0b7e39c53bfc6.reference = {
    __cReference: true,
    get value() { return FREEZEFIREWIDE____header_global_ed9c32ec326f6f1f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:785
export const SHRINKERWIDE____header_global_af83ce11cd58cc23 = ((((((5127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d9e486017385944c1ce5e429() {
  return __cxx_static_address_d9e486017385944c1ce5e429.reference || (__cxx_static_address_d9e486017385944c1ce5e429.reference = {
    __cReference: true,
    get value() { return SHRINKERWIDE____header_global_af83ce11cd58cc23; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:786
export const CRACKKNUCKLESWIDE____header_global_fff8a651ca51bacf = ((((((5129) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1f0be4043ea890079f493ebc() {
  return __cxx_static_address_1f0be4043ea890079f493ebc.reference || (__cxx_static_address_1f0be4043ea890079f493ebc.reference = {
    __cReference: true,
    get value() { return CRACKKNUCKLESWIDE____header_global_fff8a651ca51bacf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:787
export const FLAMETHROWERSPRITE____header_global_910803f79a9d7758 = ((((((5134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4a375d65b9e3fecdaeaef0c6() {
  return __cxx_static_address_4a375d65b9e3fecdaeaef0c6.reference || (__cxx_static_address_4a375d65b9e3fecdaeaef0c6.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERSPRITE____header_global_910803f79a9d7758; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:788
export const FLAMETHROWERAMMO____header_global_43dc0be1cfa28483 = ((((((5135) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dcbaab9078754b2e7a16754c() {
  return __cxx_static_address_dcbaab9078754b2e7a16754c.reference || (__cxx_static_address_dcbaab9078754b2e7a16754c.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERAMMO____header_global_43dc0be1cfa28483; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:789
export const FLAMETHROWER____header_global_50f1311f1c2c7ff6 = ((((((5138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f390df333584c3d5ab0c45a2() {
  return __cxx_static_address_f390df333584c3d5ab0c45a2.reference || (__cxx_static_address_f390df333584c3d5ab0c45a2.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER____header_global_50f1311f1c2c7ff6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:790
export const FLAMETHROWERFIRE____header_global_bd2f47ade9e9c07b = ((((((5139) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_00014857378713f7fd69d4db() {
  return __cxx_static_address_00014857378713f7fd69d4db.reference || (__cxx_static_address_00014857378713f7fd69d4db.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERFIRE____header_global_bd2f47ade9e9c07b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:791
export const FLAMETHROWERFLAME____header_global_473a52e64961a604 = ((((((1891) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6d7f16cb371c477e6d406373() {
  return __cxx_static_address_6d7f16cb371c477e6d406373.reference || (__cxx_static_address_6d7f16cb371c477e6d406373.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERFLAME____header_global_473a52e64961a604; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:792
export const FLAMETHROWERPILOT____header_global_0d5b12e639815834 = ((((((5174) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_143ac9eda53fc209a19ab123() {
  return __cxx_static_address_143ac9eda53fc209a19ab123.reference || (__cxx_static_address_143ac9eda53fc209a19ab123.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERPILOT____header_global_0d5b12e639815834; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:793
export const FIREBALL____header_global_ddc82a34c2976378 = ((((((5163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f3262cd507a87732bd3e3363() {
  return __cxx_static_address_f3262cd507a87732bd3e3363.reference || (__cxx_static_address_f3262cd507a87732bd3e3363.reference = {
    __cReference: true,
    get value() { return FIREBALL____header_global_ddc82a34c2976378; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:794
export const ONFIRE____header_global_2d287c654a8d154f = ((((((5152) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_78455107e43d420401957221() {
  return __cxx_static_address_78455107e43d420401957221.reference || (__cxx_static_address_78455107e43d420401957221.reference = {
    __cReference: true,
    get value() { return ONFIRE____header_global_2d287c654a8d154f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:795
export const ONFIRESMOKE____header_global_ecdf9b06c10e29ab = ((((((5143) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_194dfd05456f7ec13649cf7a() {
  return __cxx_static_address_194dfd05456f7ec13649cf7a.reference || (__cxx_static_address_194dfd05456f7ec13649cf7a.reference = {
    __cReference: true,
    get value() { return ONFIRESMOKE____header_global_ecdf9b06c10e29ab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:796
export const BURNEDCORPSE____header_global_bbaed0ed8517fa47 = ((((((5173) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_95055138103e8593ee0e9e12() {
  return __cxx_static_address_95055138103e8593ee0e9e12.reference || (__cxx_static_address_95055138103e8593ee0e9e12.reference = {
    __cReference: true,
    get value() { return BURNEDCORPSE____header_global_bbaed0ed8517fa47; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:797
export const WHISPYSMOKE____header_global_05da473a4a5d3551 = ((((((5268) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_48a986537cb8fb03747f6670() {
  return __cxx_static_address_48a986537cb8fb03747f6670.reference || (__cxx_static_address_48a986537cb8fb03747f6670.reference = {
    __cReference: true,
    get value() { return WHISPYSMOKE____header_global_05da473a4a5d3551; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:798
export const FIREFLY____header_global_2cc16d590f921c58 = ((((((5180) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4fae9ccd06146183e0f2c30a() {
  return __cxx_static_address_4fae9ccd06146183e0f2c30a.reference || (__cxx_static_address_4fae9ccd06146183e0f2c30a.reference = {
    __cReference: true,
    get value() { return FIREFLY____header_global_2cc16d590f921c58; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:799
export const FIREFLYSHRINKEFFECT____header_global_0793241c3e6f7218 = ((((((5360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_71e58f0df5d0daf487202d8f() {
  return __cxx_static_address_71e58f0df5d0daf487202d8f.reference || (__cxx_static_address_71e58f0df5d0daf487202d8f.reference = {
    __cReference: true,
    get value() { return FIREFLYSHRINKEFFECT____header_global_0793241c3e6f7218; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:800
export const FIREFLYGROWEFFECT____header_global_5eafe94af6ae1a5e = ((((((5367) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2d32b57cf88bca6bb2117eb2() {
  return __cxx_static_address_2d32b57cf88bca6bb2117eb2.reference || (__cxx_static_address_2d32b57cf88bca6bb2117eb2.reference = {
    __cReference: true,
    get value() { return FIREFLYGROWEFFECT____header_global_5eafe94af6ae1a5e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:801
export const FIREFLYFLYINGEFFECT____header_global_8170c91f5f44c81f = ((((((5296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_62eca127e3c67851dfa42887() {
  return __cxx_static_address_62eca127e3c67851dfa42887.reference || (__cxx_static_address_62eca127e3c67851dfa42887.reference = {
    __cReference: true,
    get value() { return FIREFLYFLYINGEFFECT____header_global_8170c91f5f44c81f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:802
export const BOSS5____header_global_59ccbc35e865fffd = ((((((5310) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f90a845dc23e5c9675a649a3() {
  return __cxx_static_address_f90a845dc23e5c9675a649a3.reference || (__cxx_static_address_f90a845dc23e5c9675a649a3.reference = {
    __cReference: true,
    get value() { return BOSS5____header_global_59ccbc35e865fffd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:803
export const BOSS5STAYPUT____header_global_0718642fee451839 = ((((((5311) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_736b047e90e7b28bd0d231ce() {
  return __cxx_static_address_736b047e90e7b28bd0d231ce.reference || (__cxx_static_address_736b047e90e7b28bd0d231ce.reference = {
    __cReference: true,
    get value() { return BOSS5STAYPUT____header_global_0718642fee451839; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:804
export const LAVAPOOL____header_global_3ffbc8d7d1d951f0 = ((((((5304) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a6fc8f0dd787527dde7bf77d() {
  return __cxx_static_address_a6fc8f0dd787527dde7bf77d.reference || (__cxx_static_address_a6fc8f0dd787527dde7bf77d.reference = {
    __cReference: true,
    get value() { return LAVAPOOL____header_global_3ffbc8d7d1d951f0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:805
export const LAVASPLASH____header_global_e5128d5b2c9c1c51 = ((((((5371) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4888d6889c4351a4851e6f55() {
  return __cxx_static_address_4888d6889c4351a4851e6f55.reference || (__cxx_static_address_4888d6889c4351a4851e6f55.reference = {
    __cReference: true,
    get value() { return LAVASPLASH____header_global_e5128d5b2c9c1c51; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:806
export const LAVAPOOLBUBBLE____header_global_ddbd6df25c8f9183 = ((((((5207) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aa299d0ceb7942c042059966() {
  return __cxx_static_address_aa299d0ceb7942c042059966.reference || (__cxx_static_address_aa299d0ceb7942c042059966.reference = {
    __cReference: true,
    get value() { return LAVAPOOLBUBBLE____header_global_ddbd6df25c8f9183; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:807
export const BOSS2STAYPUT____header_global_f607b76b9dff446d = ((((((2711) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_551d80b462b44e85dd04567e() {
  return __cxx_static_address_551d80b462b44e85dd04567e.reference || (__cxx_static_address_551d80b462b44e85dd04567e.reference = {
    __cReference: true,
    get value() { return BOSS2STAYPUT____header_global_f607b76b9dff446d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:808
export const BOSS3STAYPUT____header_global_d575855984a97640 = ((((((2761) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_10e319b1d5f458f4629885d9() {
  return __cxx_static_address_10e319b1d5f458f4629885d9.reference || (__cxx_static_address_10e319b1d5f458f4629885d9.reference = {
    __cReference: true,
    get value() { return BOSS3STAYPUT____header_global_d575855984a97640; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:809
export const E32_TILE5736____header_global_43abec39caeb2b98 = ((((((5736) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a20f88a6c0ddfba568cb7830() {
  return __cxx_static_address_a20f88a6c0ddfba568cb7830.reference || (__cxx_static_address_a20f88a6c0ddfba568cb7830.reference = {
    __cReference: true,
    get value() { return E32_TILE5736____header_global_43abec39caeb2b98; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:810
export const E32_TILE5737____header_global_c4dcdc61d215d4b9 = ((((((5737) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c48b7b1dc2fb185816630a86() {
  return __cxx_static_address_c48b7b1dc2fb185816630a86.reference || (__cxx_static_address_c48b7b1dc2fb185816630a86.reference = {
    __cReference: true,
    get value() { return E32_TILE5737____header_global_c4dcdc61d215d4b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:811
export const E32_TILE5846____header_global_3333695fa9817fc1 = ((((((5846) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9d33d44873a51f9965b69b70() {
  return __cxx_static_address_9d33d44873a51f9965b69b70.reference || (__cxx_static_address_9d33d44873a51f9965b69b70.reference = {
    __cReference: true,
    get value() { return E32_TILE5846____header_global_3333695fa9817fc1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/network.h:180
export const cSnapshotMemUsage__header_global_2333086c2c0700e5 = u64((BigInt(u64(64)) * BigInt((BigInt((BigInt((BigInt(72) * BigInt(u64(16384)))) + BigInt((BigInt(96) * BigInt(u64(4096)))))) + BigInt((BigInt(296) * BigInt(u64(16384))))))));
function __cxx_static_address_e482fb74d0b7d367bd23d0eb() {
  return __cxx_static_address_e482fb74d0b7d367bd23d0eb.reference || (__cxx_static_address_e482fb74d0b7d367bd23d0eb.reference = {
    __cReference: true,
    get value() { return cSnapshotMemUsage__header_global_2333086c2c0700e5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/osdfuncs.cpp:31
export let osdhightile = i32(1);
export function __cxx_global_cell_83bb4ed8abf068673e649a53() {
  return __cxx_global_cell_83bb4ed8abf068673e649a53.reference || (__cxx_global_cell_83bb4ed8abf068673e649a53.reference = {
    __cReference: true,
    get value() { return osdhightile; },
    set value(__cxx_lvalue_0) { osdhightile = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/osdfuncs.cpp:36
export let osdscale = Math.fround(Math.fround(1));
export function __cxx_global_cell_c050ad972e45044e662a1262() {
  return __cxx_global_cell_c050ad972e45044e662a1262.reference || (__cxx_global_cell_c050ad972e45044e662a1262.reference = {
    __cReference: true,
    get value() { return osdscale; },
    set value(__cxx_lvalue_0) { osdscale = Math.fround(__cxx_lvalue_0); }
  });
}

export let osdrscale = Math.fround(Math.fround(1));
export function __cxx_global_cell_675a671ba8b11019fd9494af() {
  return __cxx_global_cell_675a671ba8b11019fd9494af.reference || (__cxx_global_cell_675a671ba8b11019fd9494af.reference = {
    __cReference: true,
    get value() { return osdrscale; },
    set value(__cxx_lvalue_0) { osdrscale = Math.fround(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_758ebcf04ef56c10 = i32(2147483647);
function __cxx_static_address_15495815719e4ce434ea4a5d() {
  return __cxx_static_address_15495815719e4ce434ea4a5d.reference || (__cxx_static_address_15495815719e4ce434ea4a5d.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_758ebcf04ef56c10; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_86fe8f55fdc6a208 = i32(2147483648);
function __cxx_static_address_4d313840fb10f8627fc8fb21() {
  return __cxx_static_address_4d313840fb10f8627fc8fb21.reference || (__cxx_static_address_4d313840fb10f8627fc8fb21.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_86fe8f55fdc6a208; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_e3af9b4b8dd485bf = i32(2147483648);
function __cxx_static_address_945c6a12380f47780616069a() {
  return __cxx_static_address_945c6a12380f47780616069a.reference || (__cxx_static_address_945c6a12380f47780616069a.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_e3af9b4b8dd485bf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_7564c66000049032 = i32(65536);
function __cxx_static_address_4377321b1af4dbda0895a211() {
  return __cxx_static_address_4377321b1af4dbda0895a211.reference || (__cxx_static_address_4377321b1af4dbda0895a211.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_7564c66000049032; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_4169bab39a33db61 = i32(32768);
function __cxx_static_address_8c66d91b52bf5ee3c89ad0eb() {
  return __cxx_static_address_8c66d91b52bf5ee3c89ad0eb.reference || (__cxx_static_address_8c66d91b52bf5ee3c89ad0eb.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_4169bab39a33db61; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_9d6a63f3e92218bc = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_11d25db9f02f97c98f04b785() {
  return __cxx_static_address_11d25db9f02f97c98f04b785.reference || (__cxx_static_address_11d25db9f02f97c98f04b785.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_9d6a63f3e92218bc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/osdfuncs.cpp:45
export function GAME_isspace(ch) {
  return i32(((ch == 32) || (ch == 9)));
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_e30eb7768d1362e1 = new Uint8Array([((1) & 255), ((2) & 255), ((4) & 255), ((8) & 255), ((16) & 255), ((32) & 255), ((64) & 255), ((128) & 255)]);
function __cxx_static_address_11905fd927ebd2a9bbc11a8e() {
  return __cxx_static_address_11905fd927ebd2a9bbc11a8e.reference || (__cxx_static_address_11905fd927ebd2a9bbc11a8e.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_e30eb7768d1362e1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:172
export const g_defaultVideoModes__header_global_23257533bb10cbc1 = [cMarkAggregate(({"x": 2560, "y": 1440})), cMarkAggregate(({"x": 2560, "y": 1200})), cMarkAggregate(({"x": 2560, "y": 1080})), cMarkAggregate(({"x": 1920, "y": 1440})), cMarkAggregate(({"x": 1920, "y": 1200})), cMarkAggregate(({"x": 1920, "y": 1080})), cMarkAggregate(({"x": 1680, "y": 1050})), cMarkAggregate(({"x": 1600, "y": 1200})), cMarkAggregate(({"x": 1600, "y": 900})), cMarkAggregate(({"x": 1366, "y": 768})), cMarkAggregate(({"x": 1280, "y": 1024})), cMarkAggregate(({"x": 1280, "y": 960})), cMarkAggregate(({"x": 1280, "y": 720})), cMarkAggregate(({"x": 1152, "y": 864})), cMarkAggregate(({"x": 1024, "y": 768})), cMarkAggregate(({"x": 1024, "y": 600})), cMarkAggregate(({"x": 800, "y": 600})), cMarkAggregate(({"x": 640, "y": 480})), cMarkAggregate(({"x": 640, "y": 400})), cMarkAggregate(({"x": 512, "y": 384})), cMarkAggregate(({"x": 480, "y": 360})), cMarkAggregate(({"x": 400, "y": 300})), cMarkAggregate(({"x": 320, "y": 240})), cMarkAggregate(({"x": 320, "y": 200})), cMarkAggregate(({"x": 0, "y": 0}))];
function __cxx_static_address_c9bb82a25825941c1de28c6e() {
  return __cxx_static_address_c9bb82a25825941c1de28c6e.reference || (__cxx_static_address_c9bb82a25825941c1de28c6e.reference = {
    __cReference: true,
    get value() { return g_defaultVideoModes__header_global_23257533bb10cbc1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:188
export const g_keyAsciiTable__header_global_2813eb77db7c6bab = new Uint8Array([((0) & 255), ((0) & 255), 49, 50, 51, 52, 53, 54, 55, 56, 57, 48, 45, 61, ((0) & 255), ((0) & 255), 113, 119, 101, 114, 116, 121, 117, 105, 111, 112, 91, 93, ((0) & 255), ((0) & 255), 97, 115, 100, 102, 103, 104, 106, 107, 108, 59, ((39) & 255), 96, ((0) & 255), ((92) & 255), 122, 120, 99, 118, 98, 110, 109, 44, 46, 47, ((0) & 255), 42, ((0) & 255), ((32) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255)]);
function __cxx_static_address_3485c0e5560d6bf9c1788b4f() {
  return __cxx_static_address_3485c0e5560d6bf9c1788b4f.reference || (__cxx_static_address_3485c0e5560d6bf9c1788b4f.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTable__header_global_2813eb77db7c6bab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:196
export const g_keyAsciiTableShift__header_global_bc55cd516a1f3d2c = new Uint8Array([((0) & 255), ((0) & 255), 33, 64, 35, 36, 37, 94, 38, 42, 40, 41, 95, 43, ((0) & 255), ((0) & 255), 81, 87, 69, 82, 84, 89, 85, 73, 79, 80, 123, 125, ((0) & 255), ((0) & 255), 65, 83, 68, 70, 71, 72, 74, 75, 76, 58, 34, 126, ((0) & 255), 124, 90, 88, 67, 86, 66, 78, 77, 60, 62, 63, ((0) & 255), 42, ((0) & 255), ((32) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255)]);
function __cxx_static_address_4f7f8f46f7ed3c5c9eaa49ad() {
  return __cxx_static_address_4f7f8f46f7ed3c5c9eaa49ad.reference || (__cxx_static_address_4f7f8f46f7ed3c5c9eaa49ad.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTableShift__header_global_bc55cd516a1f3d2c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:895
export const pow2long__header_global_0bd93c3a5d53f2ee = new Int32Array([1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576, 2097152, 4194304, 8388608, 16777216, 33554432, 67108864, 134217728, 268435456, 536870912, 1073741824, 2147483647]);
function __cxx_static_address_b2f8fee0586a2e89fde3676e() {
  return __cxx_static_address_b2f8fee0586a2e89fde3676e.reference || (__cxx_static_address_b2f8fee0586a2e89fde3676e.reference = {
    __cReference: true,
    get value() { return pow2long__header_global_0bd93c3a5d53f2ee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:907
export const pow2ulong__header_global_e19f93e627d75e55 = new Uint32Array([u32(1), u32(2), u32(4), u32(8), u32(16), u32(32), u32(64), u32(128), u32(256), u32(512), u32(1024), u32(2048), u32(4096), u32(8192), u32(16384), u32(32768), u32(65536), u32(131072), u32(262144), u32(524288), u32(1048576), u32(2097152), u32(4194304), u32(8388608), u32(16777216), u32(33554432), u32(67108864), u32(134217728), u32(268435456), u32(536870912), u32(1073741824), u32(2147483648n)]);
function __cxx_static_address_c648f520e1201a80b80e13ab() {
  return __cxx_static_address_c648f520e1201a80b80e13ab.reference || (__cxx_static_address_c648f520e1201a80b80e13ab.reference = {
    __cReference: true,
    get value() { return pow2ulong__header_global_e19f93e627d75e55; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:919
export const pow264__header_global_f6b386c983d4f5db = new BigInt64Array([BigInt(i64(1)), BigInt(i64(2)), BigInt(i64(4)), BigInt(i64(8)), BigInt(i64(16)), BigInt(i64(32)), BigInt(i64(64)), BigInt(i64(128)), BigInt(i64(256)), BigInt(i64(512)), BigInt(i64(1024)), BigInt(i64(2048)), BigInt(i64(4096)), BigInt(i64(8192)), BigInt(i64(16384)), BigInt(i64(32768)), BigInt(i64(65536)), BigInt(i64(131072)), BigInt(i64(262144)), BigInt(i64(524288)), BigInt(i64(1048576)), BigInt(i64(2097152)), BigInt(i64(4194304)), BigInt(i64(8388608)), BigInt(i64(16777216)), BigInt(i64(33554432)), BigInt(i64(67108864)), BigInt(i64(134217728)), BigInt(i64(268435456)), BigInt(i64(536870912)), BigInt(i64(1073741824)), BigInt(2147483648n), BigInt(4294967296n), BigInt(8589934592n), BigInt(17179869184n), BigInt(34359738368n), BigInt(68719476736n), BigInt(137438953472n), BigInt(274877906944n), BigInt(549755813888n), BigInt(1099511627776n), BigInt(2199023255552n), BigInt(4398046511104n), BigInt(8796093022208n), BigInt(17592186044416n), BigInt(35184372088832n), BigInt(70368744177664n), BigInt(140737488355328n), BigInt(281474976710656n), BigInt(562949953421312n), BigInt(1125899906842624n), BigInt(2251799813685248n), BigInt(4503599627370496n), BigInt(9007199254740992n), BigInt(18014398509481984n), BigInt(36028797018963968n), BigInt(72057594037927936n), BigInt(144115188075855872n), BigInt(288230376151711744n), BigInt(576460752303423488n), BigInt(1152921504606846976n), BigInt(2305843009213693952n), BigInt(4611686018427387904n), BigInt(9223372036854775807n)]);
function __cxx_static_address_a08591b5514eb4d3812d9125() {
  return __cxx_static_address_a08591b5514eb4d3812d9125.reference || (__cxx_static_address_a08591b5514eb4d3812d9125.reference = {
    __cReference: true,
    get value() { return pow264__header_global_f6b386c983d4f5db; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
