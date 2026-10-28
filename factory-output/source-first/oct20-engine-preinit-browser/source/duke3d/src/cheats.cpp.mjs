// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/duke3d/src/cheats.cpp
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
export const fix16_rad_to_deg_mult__header_global_9b04d0bba590cae0 = i32(3754936);
function __cxx_static_address_9b2d274ed0aa73e8b937c2aa() {
  return __cxx_static_address_9b2d274ed0aa73e8b937c2aa.reference || (__cxx_static_address_9b2d274ed0aa73e8b937c2aa.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_9b04d0bba590cae0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_ccb46a41a8eed457 = i32(1144);
function __cxx_static_address_72f7bf8d1ae646accf179147() {
  return __cxx_static_address_72f7bf8d1ae646accf179147.reference || (__cxx_static_address_72f7bf8d1ae646accf179147.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_ccb46a41a8eed457; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:43
export const KICK_HIT____header_global_237ec78e060def31 = ((((((0) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_75c0c2fbc3807c049f991acf() {
  return __cxx_static_address_75c0c2fbc3807c049f991acf.reference || (__cxx_static_address_75c0c2fbc3807c049f991acf.reference = {
    __cReference: true,
    get value() { return KICK_HIT____header_global_237ec78e060def31; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:44
export const PISTOL_RICOCHET____header_global_25aecdc528bbb06e = ((((((1) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0cfaf0f4346c2c302f70d6cf() {
  return __cxx_static_address_0cfaf0f4346c2c302f70d6cf.reference || (__cxx_static_address_0cfaf0f4346c2c302f70d6cf.reference = {
    __cReference: true,
    get value() { return PISTOL_RICOCHET____header_global_25aecdc528bbb06e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:45
export const PISTOL_BODYHIT____header_global_34ff03a5d45d9844 = ((((((2) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_689977b3cc76f8f97734c7fd() {
  return __cxx_static_address_689977b3cc76f8f97734c7fd.reference || (__cxx_static_address_689977b3cc76f8f97734c7fd.reference = {
    __cReference: true,
    get value() { return PISTOL_BODYHIT____header_global_34ff03a5d45d9844; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:46
export const PISTOL_FIRE____header_global_9650e14a442a55ca = ((((((3) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2220ce27963d70f1e5358d9a() {
  return __cxx_static_address_2220ce27963d70f1e5358d9a.reference || (__cxx_static_address_2220ce27963d70f1e5358d9a.reference = {
    __cReference: true,
    get value() { return PISTOL_FIRE____header_global_9650e14a442a55ca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:47
export const EJECT_CLIP____header_global_e2f6e8a83227cdc6 = ((((((4) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a55d853103d93d679d48493e() {
  return __cxx_static_address_a55d853103d93d679d48493e.reference || (__cxx_static_address_a55d853103d93d679d48493e.reference = {
    __cReference: true,
    get value() { return EJECT_CLIP____header_global_e2f6e8a83227cdc6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:48
export const INSERT_CLIP____header_global_c3871df9526e53a3 = ((((((5) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eb2a2bbfdb27933f6fa654a5() {
  return __cxx_static_address_eb2a2bbfdb27933f6fa654a5.reference || (__cxx_static_address_eb2a2bbfdb27933f6fa654a5.reference = {
    __cReference: true,
    get value() { return INSERT_CLIP____header_global_c3871df9526e53a3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:49
export const CHAINGUN_FIRE____header_global_677d9dfc8af1441c = ((((((6) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_87145e294a84dcd08cf58e6e() {
  return __cxx_static_address_87145e294a84dcd08cf58e6e.reference || (__cxx_static_address_87145e294a84dcd08cf58e6e.reference = {
    __cReference: true,
    get value() { return CHAINGUN_FIRE____header_global_677d9dfc8af1441c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:50
export const RPG_SHOOT____header_global_db212f9f0d4abc33 = ((((((7) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_84825a4dbb691f3d98e492f5() {
  return __cxx_static_address_84825a4dbb691f3d98e492f5.reference || (__cxx_static_address_84825a4dbb691f3d98e492f5.reference = {
    __cReference: true,
    get value() { return RPG_SHOOT____header_global_db212f9f0d4abc33; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:51
export const POOLBALLHIT____header_global_03680d117f6a5839 = ((((((8) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ff55102ade0fee6ed2227149() {
  return __cxx_static_address_ff55102ade0fee6ed2227149.reference || (__cxx_static_address_ff55102ade0fee6ed2227149.reference = {
    __cReference: true,
    get value() { return POOLBALLHIT____header_global_03680d117f6a5839; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:52
export const RPG_EXPLODE____header_global_e27348a021b40426 = ((((((9) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cd1eb096a767be9c3c461f8c() {
  return __cxx_static_address_cd1eb096a767be9c3c461f8c.reference || (__cxx_static_address_cd1eb096a767be9c3c461f8c.reference = {
    __cReference: true,
    get value() { return RPG_EXPLODE____header_global_e27348a021b40426; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:53
export const CAT_FIRE____header_global_dc8d66a48053364f = ((((((10) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_431f0adace0f335c6352d860() {
  return __cxx_static_address_431f0adace0f335c6352d860.reference || (__cxx_static_address_431f0adace0f335c6352d860.reference = {
    __cReference: true,
    get value() { return CAT_FIRE____header_global_dc8d66a48053364f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:54
export const SHRINKER_FIRE____header_global_814da5c2bb0af496 = ((((((11) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_394647c7a2939e895b854e65() {
  return __cxx_static_address_394647c7a2939e895b854e65.reference || (__cxx_static_address_394647c7a2939e895b854e65.reference = {
    __cReference: true,
    get value() { return SHRINKER_FIRE____header_global_814da5c2bb0af496; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:55
export const PIPEBOMB_BOUNCE____header_global_e61ce30564613373 = ((((((13) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e71ab68d837e80607668c6a4() {
  return __cxx_static_address_e71ab68d837e80607668c6a4.reference || (__cxx_static_address_e71ab68d837e80607668c6a4.reference = {
    __cReference: true,
    get value() { return PIPEBOMB_BOUNCE____header_global_e61ce30564613373; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:56
export const PIPEBOMB_EXPLODE____header_global_1980ffad31a41d47 = ((((((14) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4d69af35301b96ddccf9f1ef() {
  return __cxx_static_address_4d69af35301b96ddccf9f1ef.reference || (__cxx_static_address_4d69af35301b96ddccf9f1ef.reference = {
    __cReference: true,
    get value() { return PIPEBOMB_EXPLODE____header_global_1980ffad31a41d47; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:57
export const LASERTRIP_ONWALL____header_global_bab770a41739ddb6 = ((((((15) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_77e6b440789ad6a2a702a940() {
  return __cxx_static_address_77e6b440789ad6a2a702a940.reference || (__cxx_static_address_77e6b440789ad6a2a702a940.reference = {
    __cReference: true,
    get value() { return LASERTRIP_ONWALL____header_global_bab770a41739ddb6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:58
export const LASERTRIP_ARMING____header_global_6f442aff6a33da81 = ((((((16) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5f82b5348441077371e685ae() {
  return __cxx_static_address_5f82b5348441077371e685ae.reference || (__cxx_static_address_5f82b5348441077371e685ae.reference = {
    __cReference: true,
    get value() { return LASERTRIP_ARMING____header_global_6f442aff6a33da81; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:59
export const LASERTRIP_EXPLODE____header_global_4fd99439ac598cce = ((((((17) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_045c21067599e5544d2311c7() {
  return __cxx_static_address_045c21067599e5544d2311c7.reference || (__cxx_static_address_045c21067599e5544d2311c7.reference = {
    __cReference: true,
    get value() { return LASERTRIP_EXPLODE____header_global_4fd99439ac598cce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:60
export const VENT_BUST____header_global_85decc9a4385a806 = ((((((18) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5175f3749fbabe9d1ebc5ec9() {
  return __cxx_static_address_5175f3749fbabe9d1ebc5ec9.reference || (__cxx_static_address_5175f3749fbabe9d1ebc5ec9.reference = {
    __cReference: true,
    get value() { return VENT_BUST____header_global_85decc9a4385a806; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:61
export const GLASS_BREAKING____header_global_c63a57abd457667f = ((((((19) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3b3d958aeb53d439e830a854() {
  return __cxx_static_address_3b3d958aeb53d439e830a854.reference || (__cxx_static_address_3b3d958aeb53d439e830a854.reference = {
    __cReference: true,
    get value() { return GLASS_BREAKING____header_global_c63a57abd457667f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:62
export const GLASS_HEAVYBREAK____header_global_993fd52e308b01cc = ((((((20) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_20c241dcfa2f4d5777652768() {
  return __cxx_static_address_20c241dcfa2f4d5777652768.reference || (__cxx_static_address_20c241dcfa2f4d5777652768.reference = {
    __cReference: true,
    get value() { return GLASS_HEAVYBREAK____header_global_993fd52e308b01cc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:63
export const SHORT_CIRCUIT____header_global_951699843901b6c9 = ((((((21) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9bdffc7fa747b1d56787d4b1() {
  return __cxx_static_address_9bdffc7fa747b1d56787d4b1.reference || (__cxx_static_address_9bdffc7fa747b1d56787d4b1.reference = {
    __cReference: true,
    get value() { return SHORT_CIRCUIT____header_global_951699843901b6c9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:64
export const ITEM_SPLASH____header_global_de04b37167c13033 = ((((((22) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a047438c1cda1d80b03bb8d5() {
  return __cxx_static_address_a047438c1cda1d80b03bb8d5.reference || (__cxx_static_address_a047438c1cda1d80b03bb8d5.reference = {
    __cReference: true,
    get value() { return ITEM_SPLASH____header_global_de04b37167c13033; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:65
export const DUKE_GASP____header_global_b0f0ec520f9b14bd = ((((((25) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d8b8677aa34ead8f11cacb39() {
  return __cxx_static_address_d8b8677aa34ead8f11cacb39.reference || (__cxx_static_address_d8b8677aa34ead8f11cacb39.reference = {
    __cReference: true,
    get value() { return DUKE_GASP____header_global_b0f0ec520f9b14bd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:66
export const SLIM_RECOG____header_global_8b985d1c3f1ffc50 = ((((((26) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9de37ab750394ea34643f55b() {
  return __cxx_static_address_9de37ab750394ea34643f55b.reference || (__cxx_static_address_9de37ab750394ea34643f55b.reference = {
    __cReference: true,
    get value() { return SLIM_RECOG____header_global_8b985d1c3f1ffc50; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:67
export const DUKE_URINATE____header_global_9728247f80d4ad46 = ((((((28) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_94dcd46a9713715a7845e606() {
  return __cxx_static_address_94dcd46a9713715a7845e606.reference || (__cxx_static_address_94dcd46a9713715a7845e606.reference = {
    __cReference: true,
    get value() { return DUKE_URINATE____header_global_9728247f80d4ad46; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:68
export const ENDSEQVOL3SND2____header_global_151f83d2c2c83bc8 = ((((((29) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6278262f924a0f1d1e5c99af() {
  return __cxx_static_address_6278262f924a0f1d1e5c99af.reference || (__cxx_static_address_6278262f924a0f1d1e5c99af.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND2____header_global_151f83d2c2c83bc8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:69
export const ENDSEQVOL3SND3____header_global_afd309f9d27006de = ((((((30) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8c3859a35fc2d18311d1d430() {
  return __cxx_static_address_8c3859a35fc2d18311d1d430.reference || (__cxx_static_address_8c3859a35fc2d18311d1d430.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND3____header_global_afd309f9d27006de; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:70
export const DUKE_CRACK____header_global_8dbbee241309d6b7 = ((((((33) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_52dc07cfd45a60b1a0543c5a() {
  return __cxx_static_address_52dc07cfd45a60b1a0543c5a.reference || (__cxx_static_address_52dc07cfd45a60b1a0543c5a.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK____header_global_8dbbee241309d6b7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:71
export const SLIM_ATTACK____header_global_88d0363a43a1ae28 = ((((((34) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e094958eb791b938fc6a4099() {
  return __cxx_static_address_e094958eb791b938fc6a4099.reference || (__cxx_static_address_e094958eb791b938fc6a4099.reference = {
    __cReference: true,
    get value() { return SLIM_ATTACK____header_global_88d0363a43a1ae28; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:72
export const SOMETHINGHITFORCE____header_global_ae8d8eb36df9def5 = ((((((35) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_25c7f8f414ce56d1184e9855() {
  return __cxx_static_address_25c7f8f414ce56d1184e9855.reference || (__cxx_static_address_25c7f8f414ce56d1184e9855.reference = {
    __cReference: true,
    get value() { return SOMETHINGHITFORCE____header_global_ae8d8eb36df9def5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:73
export const DUKE_DRINKING____header_global_3e59a0b8de71a8eb = ((((((36) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ab6bd53faf43f214b4556381() {
  return __cxx_static_address_ab6bd53faf43f214b4556381.reference || (__cxx_static_address_ab6bd53faf43f214b4556381.reference = {
    __cReference: true,
    get value() { return DUKE_DRINKING____header_global_3e59a0b8de71a8eb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:74
export const DUKE_GRUNT____header_global_b408c25f438ec4b7 = ((((((38) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c8b8ad500f8d57e264e46e65() {
  return __cxx_static_address_c8b8ad500f8d57e264e46e65.reference || (__cxx_static_address_c8b8ad500f8d57e264e46e65.reference = {
    __cReference: true,
    get value() { return DUKE_GRUNT____header_global_b408c25f438ec4b7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:75
export const DUKE_HARTBEAT____header_global_7e36029c1be9e6d3 = ((((((39) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9ffbe5d2bf7b3a2d25077738() {
  return __cxx_static_address_9ffbe5d2bf7b3a2d25077738.reference || (__cxx_static_address_9ffbe5d2bf7b3a2d25077738.reference = {
    __cReference: true,
    get value() { return DUKE_HARTBEAT____header_global_7e36029c1be9e6d3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:76
export const DUKE_ONWATER____header_global_4932f0758c02b6b3 = ((((((40) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0f5568f4057db5b863860d90() {
  return __cxx_static_address_0f5568f4057db5b863860d90.reference || (__cxx_static_address_0f5568f4057db5b863860d90.reference = {
    __cReference: true,
    get value() { return DUKE_ONWATER____header_global_4932f0758c02b6b3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:77
export const DUKE_LAND____header_global_f2bb2ff3955376e1 = ((((((42) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b8aab8b72f575cd218ebddbb() {
  return __cxx_static_address_b8aab8b72f575cd218ebddbb.reference || (__cxx_static_address_b8aab8b72f575cd218ebddbb.reference = {
    __cReference: true,
    get value() { return DUKE_LAND____header_global_f2bb2ff3955376e1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:78
export const DUKE_WALKINDUCTS____header_global_e4aee1f50e49513c = ((((((43) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b0334f219871d00d02580cac() {
  return __cxx_static_address_b0334f219871d00d02580cac.reference || (__cxx_static_address_b0334f219871d00d02580cac.reference = {
    __cReference: true,
    get value() { return DUKE_WALKINDUCTS____header_global_e4aee1f50e49513c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:79
export const DUKE_UNDERWATER____header_global_e715a240d95c45ee = ((((((48) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_95561dbfb6d48637aebcca48() {
  return __cxx_static_address_95561dbfb6d48637aebcca48.reference || (__cxx_static_address_95561dbfb6d48637aebcca48.reference = {
    __cReference: true,
    get value() { return DUKE_UNDERWATER____header_global_e715a240d95c45ee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:80
export const DUKE_JETPACK_ON____header_global_8967ad1e4b743097 = ((((((49) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5346a7e921a4851ce10b3301() {
  return __cxx_static_address_5346a7e921a4851ce10b3301.reference || (__cxx_static_address_5346a7e921a4851ce10b3301.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_ON____header_global_8967ad1e4b743097; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:81
export const DUKE_JETPACK_IDLE____header_global_7e978b65d128ebf2 = ((((((50) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e381a43fe115cbaf0268778a() {
  return __cxx_static_address_e381a43fe115cbaf0268778a.reference || (__cxx_static_address_e381a43fe115cbaf0268778a.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_IDLE____header_global_7e978b65d128ebf2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:82
export const DUKE_JETPACK_OFF____header_global_332fdb160403a290 = ((((((51) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b549f6816daea770d6c4562d() {
  return __cxx_static_address_b549f6816daea770d6c4562d.reference || (__cxx_static_address_b549f6816daea770d6c4562d.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_OFF____header_global_332fdb160403a290; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:83
export const DUKETALKTOBOSS____header_global_bcf99f6ff6c7a537 = ((((((56) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_963c0c4ac09283319ef3b2ca() {
  return __cxx_static_address_963c0c4ac09283319ef3b2ca.reference || (__cxx_static_address_963c0c4ac09283319ef3b2ca.reference = {
    __cReference: true,
    get value() { return DUKETALKTOBOSS____header_global_bcf99f6ff6c7a537; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:84
export const SQUISHED____header_global_33f7cf6cf61f1cea = ((((((69) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ee6b6a679dd92db463e02bc2() {
  return __cxx_static_address_ee6b6a679dd92db463e02bc2.reference || (__cxx_static_address_ee6b6a679dd92db463e02bc2.reference = {
    __cReference: true,
    get value() { return SQUISHED____header_global_33f7cf6cf61f1cea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:85
export const TELEPORTER____header_global_f10aaa2864469835 = ((((((70) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4985ffd57768c477e1dc859a() {
  return __cxx_static_address_4985ffd57768c477e1dc859a.reference || (__cxx_static_address_4985ffd57768c477e1dc859a.reference = {
    __cReference: true,
    get value() { return TELEPORTER____header_global_f10aaa2864469835; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:86
export const ELEVATOR_ON____header_global_c2c069060d1e2206 = ((((((71) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0abb586ea6162aac60a755a9() {
  return __cxx_static_address_0abb586ea6162aac60a755a9.reference || (__cxx_static_address_0abb586ea6162aac60a755a9.reference = {
    __cReference: true,
    get value() { return ELEVATOR_ON____header_global_c2c069060d1e2206; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:87
export const ELEVATOR_OFF____header_global_95b76531178dec70 = ((((((73) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_15a2f0f2b0b5bbfc8b592d5c() {
  return __cxx_static_address_15a2f0f2b0b5bbfc8b592d5c.reference || (__cxx_static_address_15a2f0f2b0b5bbfc8b592d5c.reference = {
    __cReference: true,
    get value() { return ELEVATOR_OFF____header_global_95b76531178dec70; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:88
export const SUBWAY____header_global_727e5294c7ae03b7 = ((((((75) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2d8965367a13cbf0d65a3240() {
  return __cxx_static_address_2d8965367a13cbf0d65a3240.reference || (__cxx_static_address_2d8965367a13cbf0d65a3240.reference = {
    __cReference: true,
    get value() { return SUBWAY____header_global_727e5294c7ae03b7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:89
export const SWITCH_ON____header_global_b5006df60e1998bd = ((((((76) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7b82abfbd91b68830e987862() {
  return __cxx_static_address_7b82abfbd91b68830e987862.reference || (__cxx_static_address_7b82abfbd91b68830e987862.reference = {
    __cReference: true,
    get value() { return SWITCH_ON____header_global_b5006df60e1998bd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:90
export const FLUSH_TOILET____header_global_0e2ed414ae369deb = ((((((79) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4377d333c04d8bedf3e30558() {
  return __cxx_static_address_4377d333c04d8bedf3e30558.reference || (__cxx_static_address_4377d333c04d8bedf3e30558.reference = {
    __cReference: true,
    get value() { return FLUSH_TOILET____header_global_0e2ed414ae369deb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:91
export const EARTHQUAKE____header_global_3e873122ee16ca24 = ((((((81) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e37671802de6e6e3ff73025f() {
  return __cxx_static_address_e37671802de6e6e3ff73025f.reference || (__cxx_static_address_e37671802de6e6e3ff73025f.reference = {
    __cReference: true,
    get value() { return EARTHQUAKE____header_global_3e873122ee16ca24; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:92
export const END_OF_LEVEL_WARN____header_global_b39f81757c0689fd = ((((((83) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_99940dd45bf9f3bc5830d4b6() {
  return __cxx_static_address_99940dd45bf9f3bc5830d4b6.reference || (__cxx_static_address_99940dd45bf9f3bc5830d4b6.reference = {
    __cReference: true,
    get value() { return END_OF_LEVEL_WARN____header_global_b39f81757c0689fd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:93
export const WIND_AMBIENCE____header_global_a2af665bfa96e1a2 = ((((((91) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_08cbd8dd121e2ef2c0569a05() {
  return __cxx_static_address_08cbd8dd121e2ef2c0569a05.reference || (__cxx_static_address_08cbd8dd121e2ef2c0569a05.reference = {
    __cReference: true,
    get value() { return WIND_AMBIENCE____header_global_a2af665bfa96e1a2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:94
export const SOMETHING_DRIPPING____header_global_32bf58d04a659005 = ((((((92) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0f77cadd4b498f32d08b6ebf() {
  return __cxx_static_address_0f77cadd4b498f32d08b6ebf.reference || (__cxx_static_address_0f77cadd4b498f32d08b6ebf.reference = {
    __cReference: true,
    get value() { return SOMETHING_DRIPPING____header_global_32bf58d04a659005; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:95
export const BOS1_RECOG____header_global_8f5e092796ce0cd5 = ((((((97) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d7e776fd6dd0b2e31610c152() {
  return __cxx_static_address_d7e776fd6dd0b2e31610c152.reference || (__cxx_static_address_d7e776fd6dd0b2e31610c152.reference = {
    __cReference: true,
    get value() { return BOS1_RECOG____header_global_8f5e092796ce0cd5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:96
export const BOS2_RECOG____header_global_e611fc546dad4ab4 = ((((((102) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5431530fc93df48e6c4f023b() {
  return __cxx_static_address_5431530fc93df48e6c4f023b.reference || (__cxx_static_address_5431530fc93df48e6c4f023b.reference = {
    __cReference: true,
    get value() { return BOS2_RECOG____header_global_e611fc546dad4ab4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:97
export const DUKE_GETWEAPON2____header_global_6b81a2c11dedb1b2 = ((((((107) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_832fb9b34fafe14e99541e7d() {
  return __cxx_static_address_832fb9b34fafe14e99541e7d.reference || (__cxx_static_address_832fb9b34fafe14e99541e7d.reference = {
    __cReference: true,
    get value() { return DUKE_GETWEAPON2____header_global_6b81a2c11dedb1b2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:98
export const SHOTGUN_FIRE____header_global_eb7abb8fc471aedb = ((((((109) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_337d74c0c76d898da6f00686() {
  return __cxx_static_address_337d74c0c76d898da6f00686.reference || (__cxx_static_address_337d74c0c76d898da6f00686.reference = {
    __cReference: true,
    get value() { return SHOTGUN_FIRE____header_global_eb7abb8fc471aedb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:99
export const PRED_RECOG____header_global_1cdb45f442a5d1df = ((((((111) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b5de0ae66523a5af915a3c5e() {
  return __cxx_static_address_b5de0ae66523a5af915a3c5e.reference || (__cxx_static_address_b5de0ae66523a5af915a3c5e.reference = {
    __cReference: true,
    get value() { return PRED_RECOG____header_global_1cdb45f442a5d1df; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:100
export const CAPT_RECOG____header_global_daf764ea9efecc27 = ((((((117) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8b6274c1abf961677695c161() {
  return __cxx_static_address_8b6274c1abf961677695c161.reference || (__cxx_static_address_8b6274c1abf961677695c161.reference = {
    __cReference: true,
    get value() { return CAPT_RECOG____header_global_daf764ea9efecc27; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:101
export const PIG_RECOG____header_global_f45df17f672a5f0c = ((((((121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e521c3352ed5875eeae4a80c() {
  return __cxx_static_address_e521c3352ed5875eeae4a80c.reference || (__cxx_static_address_e521c3352ed5875eeae4a80c.reference = {
    __cReference: true,
    get value() { return PIG_RECOG____header_global_f45df17f672a5f0c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:102
export const RECO_ROAM____header_global_74656db27b77bd9c = ((((((125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7dc8ae8a42dc2cdb07797bd5() {
  return __cxx_static_address_7dc8ae8a42dc2cdb07797bd5.reference || (__cxx_static_address_7dc8ae8a42dc2cdb07797bd5.reference = {
    __cReference: true,
    get value() { return RECO_ROAM____header_global_74656db27b77bd9c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:103
export const RECO_RECOG____header_global_650c5dbeebceb68a = ((((((126) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_00e31ab6afa020bcdee0d3a0() {
  return __cxx_static_address_00e31ab6afa020bcdee0d3a0.reference || (__cxx_static_address_00e31ab6afa020bcdee0d3a0.reference = {
    __cReference: true,
    get value() { return RECO_RECOG____header_global_650c5dbeebceb68a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:104
export const RECO_ATTACK____header_global_a8cdc5fa3a60b047 = ((((((127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c016b29ecf715c5626317ecf() {
  return __cxx_static_address_c016b29ecf715c5626317ecf.reference || (__cxx_static_address_c016b29ecf715c5626317ecf.reference = {
    __cReference: true,
    get value() { return RECO_ATTACK____header_global_a8cdc5fa3a60b047; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:105
export const RECO_PAIN____header_global_7852ed5cb3069e1c = ((((((128) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_95cd2bbb3e1acacc3b2eb3d7() {
  return __cxx_static_address_95cd2bbb3e1acacc3b2eb3d7.reference || (__cxx_static_address_95cd2bbb3e1acacc3b2eb3d7.reference = {
    __cReference: true,
    get value() { return RECO_PAIN____header_global_7852ed5cb3069e1c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:106
export const DRON_RECOG____header_global_edc3a3ffa11c6110 = ((((((131) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_be2843550c62353b02c8b932() {
  return __cxx_static_address_be2843550c62353b02c8b932.reference || (__cxx_static_address_be2843550c62353b02c8b932.reference = {
    __cReference: true,
    get value() { return DRON_RECOG____header_global_edc3a3ffa11c6110; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:107
export const COMM_RECOG____header_global_1243738948c94431 = ((((((136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_90fba0f1144129fbdaad2b65() {
  return __cxx_static_address_90fba0f1144129fbdaad2b65.reference || (__cxx_static_address_90fba0f1144129fbdaad2b65.reference = {
    __cReference: true,
    get value() { return COMM_RECOG____header_global_1243738948c94431; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:108
export const OCTA_RECOG____header_global_448c4abd259ea518 = ((((((141) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7801aa05c1ac95de53e561a2() {
  return __cxx_static_address_7801aa05c1ac95de53e561a2.reference || (__cxx_static_address_7801aa05c1ac95de53e561a2.reference = {
    __cReference: true,
    get value() { return OCTA_RECOG____header_global_448c4abd259ea518; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:109
export const TURR_RECOG____header_global_6e08e2c0d95dc6a0 = ((((((146) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9de489c63c152ad849f86145() {
  return __cxx_static_address_9de489c63c152ad849f86145.reference || (__cxx_static_address_9de489c63c152ad849f86145.reference = {
    __cReference: true,
    get value() { return TURR_RECOG____header_global_6e08e2c0d95dc6a0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:110
export const SLIM_DYING____header_global_cb01faa0ead5e002 = ((((((149) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5d81ca43f3db27f2dd5b2569() {
  return __cxx_static_address_5d81ca43f3db27f2dd5b2569.reference || (__cxx_static_address_5d81ca43f3db27f2dd5b2569.reference = {
    __cReference: true,
    get value() { return SLIM_DYING____header_global_cb01faa0ead5e002; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:111
export const BOS3_RECOG____header_global_c05b0502fd62ee95 = ((((((151) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a44310b4a1658415a49e4ee9() {
  return __cxx_static_address_a44310b4a1658415a49e4ee9.reference || (__cxx_static_address_a44310b4a1658415a49e4ee9.reference = {
    __cReference: true,
    get value() { return BOS3_RECOG____header_global_c05b0502fd62ee95; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:112
export const BOS1_WALK____header_global_b7d0936a8c69de45 = ((((((156) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e87ca495bfece6a2df65e8fe() {
  return __cxx_static_address_e87ca495bfece6a2df65e8fe.reference || (__cxx_static_address_e87ca495bfece6a2df65e8fe.reference = {
    __cReference: true,
    get value() { return BOS1_WALK____header_global_b7d0936a8c69de45; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:113
export const THUD____header_global_5948bb33cea485d0 = ((((((158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4c4d9e3d5b9b1d42794953c5() {
  return __cxx_static_address_4c4d9e3d5b9b1d42794953c5.reference || (__cxx_static_address_4c4d9e3d5b9b1d42794953c5.reference = {
    __cReference: true,
    get value() { return THUD____header_global_5948bb33cea485d0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:114
export const WIERDSHOT_FLY____header_global_0d6828fb7150e8e0 = ((((((160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5a3f4598ad6d8c922c684462() {
  return __cxx_static_address_5a3f4598ad6d8c922c684462.reference || (__cxx_static_address_5a3f4598ad6d8c922c684462.reference = {
    __cReference: true,
    get value() { return WIERDSHOT_FLY____header_global_0d6828fb7150e8e0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:115
export const SLIM_ROAM____header_global_e98b723d4e26e8bf = ((((((163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8b38e39f9e9a4ff8fdef4b5a() {
  return __cxx_static_address_8b38e39f9e9a4ff8fdef4b5a.reference || (__cxx_static_address_8b38e39f9e9a4ff8fdef4b5a.reference = {
    __cReference: true,
    get value() { return SLIM_ROAM____header_global_e98b723d4e26e8bf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:116
export const SHOTGUN_COCK____header_global_3cdac67c09d62093 = ((((((169) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d711a0549d5f6b3a3ebe2a7d() {
  return __cxx_static_address_d711a0549d5f6b3a3ebe2a7d.reference || (__cxx_static_address_d711a0549d5f6b3a3ebe2a7d.reference = {
    __cReference: true,
    get value() { return SHOTGUN_COCK____header_global_3cdac67c09d62093; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:117
export const GENERIC_AMBIENCE17____header_global_800f942fe0588807 = ((((((177) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_98a5201368dd55a345a7cad6() {
  return __cxx_static_address_98a5201368dd55a345a7cad6.reference || (__cxx_static_address_98a5201368dd55a345a7cad6.reference = {
    __cReference: true,
    get value() { return GENERIC_AMBIENCE17____header_global_800f942fe0588807; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:118
export const BONUS_SPEECH1____header_global_65589bfab7611109 = ((((((195) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b877d31650eb2ef2ed11a712() {
  return __cxx_static_address_b877d31650eb2ef2ed11a712.reference || (__cxx_static_address_b877d31650eb2ef2ed11a712.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH1____header_global_65589bfab7611109; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:119
export const BONUS_SPEECH2____header_global_d11949d1ce96a59b = ((((((196) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fb6e7556625b0ee1ea9e74e7() {
  return __cxx_static_address_fb6e7556625b0ee1ea9e74e7.reference || (__cxx_static_address_fb6e7556625b0ee1ea9e74e7.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH2____header_global_d11949d1ce96a59b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:120
export const BONUS_SPEECH3____header_global_b28e7a74d9b46df8 = ((((((197) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_948a719aeed8471cebe024c6() {
  return __cxx_static_address_948a719aeed8471cebe024c6.reference || (__cxx_static_address_948a719aeed8471cebe024c6.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH3____header_global_b28e7a74d9b46df8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:121
export const BONUS_SPEECH4____header_global_709ea606d1cd8e63 = ((((((199) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_46ef23f22a7460b9bbba5556() {
  return __cxx_static_address_46ef23f22a7460b9bbba5556.reference || (__cxx_static_address_46ef23f22a7460b9bbba5556.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH4____header_global_709ea606d1cd8e63; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:122
export const DUKE_LAND_HURT____header_global_ede2d62b56fe1ef9 = ((((((200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_073dfbd6a16ff107c2118f7d() {
  return __cxx_static_address_073dfbd6a16ff107c2118f7d.reference || (__cxx_static_address_073dfbd6a16ff107c2118f7d.reference = {
    __cReference: true,
    get value() { return DUKE_LAND_HURT____header_global_ede2d62b56fe1ef9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:123
export const DUKE_SEARCH2____header_global_2bed7aa9fabeab79 = ((((((207) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_40f191de6a6247df26a6e303() {
  return __cxx_static_address_40f191de6a6247df26a6e303.reference || (__cxx_static_address_40f191de6a6247df26a6e303.reference = {
    __cReference: true,
    get value() { return DUKE_SEARCH2____header_global_2bed7aa9fabeab79; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:124
export const DUKE_CRACK2____header_global_ec20f51714313bb2 = ((((((208) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_11834ea3bf4909f5f722fa37() {
  return __cxx_static_address_11834ea3bf4909f5f722fa37.reference || (__cxx_static_address_11834ea3bf4909f5f722fa37.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK2____header_global_ec20f51714313bb2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:125
export const DUKE_SEARCH____header_global_195645d830801669 = ((((((209) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_53b1dae1d6343a9938bbd594() {
  return __cxx_static_address_53b1dae1d6343a9938bbd594.reference || (__cxx_static_address_53b1dae1d6343a9938bbd594.reference = {
    __cReference: true,
    get value() { return DUKE_SEARCH____header_global_195645d830801669; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:126
export const DUKE_GET____header_global_838642bc2c1a6feb = ((((((210) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b40550b70d5498d545a879b4() {
  return __cxx_static_address_b40550b70d5498d545a879b4.reference || (__cxx_static_address_b40550b70d5498d545a879b4.reference = {
    __cReference: true,
    get value() { return DUKE_GET____header_global_838642bc2c1a6feb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:127
export const DUKE_LONGTERM_PAIN____header_global_539525e5b04f54b1 = ((((((211) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_898b3cb9d478586e3e2c14c6() {
  return __cxx_static_address_898b3cb9d478586e3e2c14c6.reference || (__cxx_static_address_898b3cb9d478586e3e2c14c6.reference = {
    __cReference: true,
    get value() { return DUKE_LONGTERM_PAIN____header_global_539525e5b04f54b1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:128
export const MONITOR_ACTIVE____header_global_98ca135260da7dad = ((((((212) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6089dc0abacf1031bb54f111() {
  return __cxx_static_address_6089dc0abacf1031bb54f111.reference || (__cxx_static_address_6089dc0abacf1031bb54f111.reference = {
    __cReference: true,
    get value() { return MONITOR_ACTIVE____header_global_98ca135260da7dad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:129
export const NITEVISION_ONOFF____header_global_fe77b69f6552750e = ((((((213) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_206152dbc172e5c1b0a82d2f() {
  return __cxx_static_address_206152dbc172e5c1b0a82d2f.reference || (__cxx_static_address_206152dbc172e5c1b0a82d2f.reference = {
    __cReference: true,
    get value() { return NITEVISION_ONOFF____header_global_fe77b69f6552750e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:130
export const DUKE_CRACK_FIRST____header_global_58e86f212d817bb0 = ((((((215) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d13b9a5948d385b06543ec21() {
  return __cxx_static_address_d13b9a5948d385b06543ec21.reference || (__cxx_static_address_d13b9a5948d385b06543ec21.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK_FIRST____header_global_58e86f212d817bb0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:131
export const DUKE_USEMEDKIT____header_global_9d58584acea04529 = ((((((216) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ce24ebbde1b75e93968c95f4() {
  return __cxx_static_address_ce24ebbde1b75e93968c95f4.reference || (__cxx_static_address_ce24ebbde1b75e93968c95f4.reference = {
    __cReference: true,
    get value() { return DUKE_USEMEDKIT____header_global_9d58584acea04529; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:132
export const DUKE_TAKEPILLS____header_global_7e22304b41933a3f = ((((((217) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b2f3a90d486fa03924e74bfa() {
  return __cxx_static_address_b2f3a90d486fa03924e74bfa.reference || (__cxx_static_address_b2f3a90d486fa03924e74bfa.reference = {
    __cReference: true,
    get value() { return DUKE_TAKEPILLS____header_global_7e22304b41933a3f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:133
export const DUKE_PISSRELIEF____header_global_895d2cf23fa58189 = ((((((218) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_df8fc427cb8c6aeb9f2ae099() {
  return __cxx_static_address_df8fc427cb8c6aeb9f2ae099.reference || (__cxx_static_address_df8fc427cb8c6aeb9f2ae099.reference = {
    __cReference: true,
    get value() { return DUKE_PISSRELIEF____header_global_895d2cf23fa58189; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:134
export const SELECT_WEAPON____header_global_dbdb58d7d05006fe = ((((((219) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5102c09ae29cfe590d7117f9() {
  return __cxx_static_address_5102c09ae29cfe590d7117f9.reference || (__cxx_static_address_5102c09ae29cfe590d7117f9.reference = {
    __cReference: true,
    get value() { return SELECT_WEAPON____header_global_dbdb58d7d05006fe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:135
export const JIBBED_ACTOR5____header_global_b69d19856dbfe4dd = ((((((226) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8eb2b516dbc13bc85f747fd2() {
  return __cxx_static_address_8eb2b516dbc13bc85f747fd2.reference || (__cxx_static_address_8eb2b516dbc13bc85f747fd2.reference = {
    __cReference: true,
    get value() { return JIBBED_ACTOR5____header_global_b69d19856dbfe4dd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:136
export const JIBBED_ACTOR6____header_global_9b7596a9504f8bb1 = ((((((227) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_33fda62a875299dbdc554b69() {
  return __cxx_static_address_33fda62a875299dbdc554b69.reference || (__cxx_static_address_33fda62a875299dbdc554b69.reference = {
    __cReference: true,
    get value() { return JIBBED_ACTOR6____header_global_9b7596a9504f8bb1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:137
export const DUKE_GOTHEALTHATLOW____header_global_ce1d5ca129fd3788 = ((((((229) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_151dade55e9f2ebe36923725() {
  return __cxx_static_address_151dade55e9f2ebe36923725.reference || (__cxx_static_address_151dade55e9f2ebe36923725.reference = {
    __cReference: true,
    get value() { return DUKE_GOTHEALTHATLOW____header_global_ce1d5ca129fd3788; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:138
export const BOSSTALKTODUKE____header_global_e23395ea908eb1fd = ((((((230) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_94f62eaa4d8092911d4dbdfd() {
  return __cxx_static_address_94f62eaa4d8092911d4dbdfd.reference || (__cxx_static_address_94f62eaa4d8092911d4dbdfd.reference = {
    __cReference: true,
    get value() { return BOSSTALKTODUKE____header_global_e23395ea908eb1fd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:139
export const WAR_AMBIENCE2____header_global_8c804b618cc7932a = ((((((232) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_15be17c6ed4aa98e8b7744c2() {
  return __cxx_static_address_15be17c6ed4aa98e8b7744c2.reference || (__cxx_static_address_15be17c6ed4aa98e8b7744c2.reference = {
    __cReference: true,
    get value() { return WAR_AMBIENCE2____header_global_8c804b618cc7932a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:140
export const EXITMENUSOUND____header_global_de946d0e07d232a5 = ((((((243) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_03b64d7ace0b65edad3d390a() {
  return __cxx_static_address_03b64d7ace0b65edad3d390a.reference || (__cxx_static_address_03b64d7ace0b65edad3d390a.reference = {
    __cReference: true,
    get value() { return EXITMENUSOUND____header_global_de946d0e07d232a5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:141
export const FLY_BY____header_global_0cfe01736fe4ea12 = ((((((244) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_89c7db39d854cf32374a0e92() {
  return __cxx_static_address_89c7db39d854cf32374a0e92.reference || (__cxx_static_address_89c7db39d854cf32374a0e92.reference = {
    __cReference: true,
    get value() { return FLY_BY____header_global_0cfe01736fe4ea12; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:142
export const DUKE_SCREAM____header_global_39090e7ba0439b9c = ((((((245) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c6a33d18b4a96f4fa2abf1f8() {
  return __cxx_static_address_c6a33d18b4a96f4fa2abf1f8.reference || (__cxx_static_address_c6a33d18b4a96f4fa2abf1f8.reference = {
    __cReference: true,
    get value() { return DUKE_SCREAM____header_global_39090e7ba0439b9c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:143
export const SHRINKER_HIT____header_global_1bd177d3a55e8f41 = ((((((246) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_56bed0476443d5dfe266382e() {
  return __cxx_static_address_56bed0476443d5dfe266382e.reference || (__cxx_static_address_56bed0476443d5dfe266382e.reference = {
    __cReference: true,
    get value() { return SHRINKER_HIT____header_global_1bd177d3a55e8f41; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:144
export const RATTY____header_global_940f09ed5e8c87fa = ((((((247) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5a5903f8dbbf1b17ee1a8266() {
  return __cxx_static_address_5a5903f8dbbf1b17ee1a8266.reference || (__cxx_static_address_5a5903f8dbbf1b17ee1a8266.reference = {
    __cReference: true,
    get value() { return RATTY____header_global_940f09ed5e8c87fa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:145
export const BONUSMUSIC____header_global_3cc6e431657e4ec1 = ((((((249) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d88fafc35f32eb732118fed5() {
  return __cxx_static_address_d88fafc35f32eb732118fed5.reference || (__cxx_static_address_d88fafc35f32eb732118fed5.reference = {
    __cReference: true,
    get value() { return BONUSMUSIC____header_global_3cc6e431657e4ec1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:146
export const DUKE_GETWEAPON6____header_global_599f47b0d0680d37 = ((((((264) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cc2462a7ba497784266813ec() {
  return __cxx_static_address_cc2462a7ba497784266813ec.reference || (__cxx_static_address_cc2462a7ba497784266813ec.reference = {
    __cReference: true,
    get value() { return DUKE_GETWEAPON6____header_global_599f47b0d0680d37; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:147
export const ALIEN_SWITCH1____header_global_2c582ae2edf61cfe = ((((((272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_925209c144f3912600a7bcba() {
  return __cxx_static_address_925209c144f3912600a7bcba.reference || (__cxx_static_address_925209c144f3912600a7bcba.reference = {
    __cReference: true,
    get value() { return ALIEN_SWITCH1____header_global_2c582ae2edf61cfe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:148
export const RIPHEADNECK____header_global_75ff608beecf0f6d = ((((((284) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ffe8573977155e07e258528a() {
  return __cxx_static_address_ffe8573977155e07e258528a.reference || (__cxx_static_address_ffe8573977155e07e258528a.reference = {
    __cReference: true,
    get value() { return RIPHEADNECK____header_global_75ff608beecf0f6d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:149
export const ENDSEQVOL3SND4____header_global_6c2ed68a41b8cf12 = ((((((288) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_917e1b51bac360ada1a34eae() {
  return __cxx_static_address_917e1b51bac360ada1a34eae.reference || (__cxx_static_address_917e1b51bac360ada1a34eae.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND4____header_global_6c2ed68a41b8cf12; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:150
export const ENDSEQVOL3SND5____header_global_50bc9975f7f3791a = ((((((289) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_03189ab021294db7d6fe1be1() {
  return __cxx_static_address_03189ab021294db7d6fe1be1.reference || (__cxx_static_address_03189ab021294db7d6fe1be1.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND5____header_global_50bc9975f7f3791a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:151
export const ENDSEQVOL3SND6____header_global_149e62f97820fa8a = ((((((290) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_693fd86cc12a287c810909a8() {
  return __cxx_static_address_693fd86cc12a287c810909a8.reference || (__cxx_static_address_693fd86cc12a287c810909a8.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND6____header_global_149e62f97820fa8a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:152
export const ENDSEQVOL3SND7____header_global_1483dfb682a58ca6 = ((((((291) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bd1b364023604d1ad339767b() {
  return __cxx_static_address_bd1b364023604d1ad339767b.reference || (__cxx_static_address_bd1b364023604d1ad339767b.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND7____header_global_1483dfb682a58ca6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:153
export const ENDSEQVOL3SND8____header_global_a01a9e2af5e823f1 = ((((((292) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e1f62bea25c6ac58c0ec02cb() {
  return __cxx_static_address_e1f62bea25c6ac58c0ec02cb.reference || (__cxx_static_address_e1f62bea25c6ac58c0ec02cb.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND8____header_global_a01a9e2af5e823f1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:154
export const ENDSEQVOL3SND9____header_global_8ecf51fe6b157286 = ((((((293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8e817d8f29cfe607e9efdd3b() {
  return __cxx_static_address_8e817d8f29cfe607e9efdd3b.reference || (__cxx_static_address_8e817d8f29cfe607e9efdd3b.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND9____header_global_8ecf51fe6b157286; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:155
export const WHIPYOURASS____header_global_21307d30c4357563 = ((((((294) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6181a133951991cc234ec752() {
  return __cxx_static_address_6181a133951991cc234ec752.reference || (__cxx_static_address_6181a133951991cc234ec752.reference = {
    __cReference: true,
    get value() { return WHIPYOURASS____header_global_21307d30c4357563; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:156
export const ENDSEQVOL2SND1____header_global_3c1a52956b84cc8a = ((((((295) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0f27fb1b83e689c20de948b3() {
  return __cxx_static_address_0f27fb1b83e689c20de948b3.reference || (__cxx_static_address_0f27fb1b83e689c20de948b3.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND1____header_global_3c1a52956b84cc8a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:157
export const ENDSEQVOL2SND2____header_global_97aa246b8ec150ea = ((((((296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_975f96c542a8c5d03c3dd7f4() {
  return __cxx_static_address_975f96c542a8c5d03c3dd7f4.reference || (__cxx_static_address_975f96c542a8c5d03c3dd7f4.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND2____header_global_97aa246b8ec150ea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:158
export const ENDSEQVOL2SND3____header_global_ebc55e9cd539cce0 = ((((((297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1954e857fd01a94360c543d1() {
  return __cxx_static_address_1954e857fd01a94360c543d1.reference || (__cxx_static_address_1954e857fd01a94360c543d1.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND3____header_global_ebc55e9cd539cce0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:159
export const ENDSEQVOL2SND4____header_global_11a82b11d255f8eb = ((((((298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f255f85bb6d94012540fa36d() {
  return __cxx_static_address_f255f85bb6d94012540fa36d.reference || (__cxx_static_address_f255f85bb6d94012540fa36d.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND4____header_global_11a82b11d255f8eb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:160
export const ENDSEQVOL2SND5____header_global_e399f065a8f1b921 = ((((((299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_650af1747710902644b810d1() {
  return __cxx_static_address_650af1747710902644b810d1.reference || (__cxx_static_address_650af1747710902644b810d1.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND5____header_global_e399f065a8f1b921; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:161
export const ENDSEQVOL2SND6____header_global_02b07f6918fea69e = ((((((300) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a21b987ef3811d8f185dc1eb() {
  return __cxx_static_address_a21b987ef3811d8f185dc1eb.reference || (__cxx_static_address_a21b987ef3811d8f185dc1eb.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND6____header_global_02b07f6918fea69e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:162
export const ENDSEQVOL2SND7____header_global_85581deceda587e2 = ((((((301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_adbd398cef355e1b6be1d5a6() {
  return __cxx_static_address_adbd398cef355e1b6be1d5a6.reference || (__cxx_static_address_adbd398cef355e1b6be1d5a6.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND7____header_global_85581deceda587e2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:163
export const SOMETHINGFROZE____header_global_2995d68e63bfa0ab = ((((((303) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fe372ae4986203e3cf9d91bc() {
  return __cxx_static_address_fe372ae4986203e3cf9d91bc.reference || (__cxx_static_address_fe372ae4986203e3cf9d91bc.reference = {
    __cReference: true,
    get value() { return SOMETHINGFROZE____header_global_2995d68e63bfa0ab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:164
export const WIND_REPEAT____header_global_4a376c2d0ac663f6 = ((((((308) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_74ad18e0cd321a44bdddda22() {
  return __cxx_static_address_74ad18e0cd321a44bdddda22.reference || (__cxx_static_address_74ad18e0cd321a44bdddda22.reference = {
    __cReference: true,
    get value() { return WIND_REPEAT____header_global_4a376c2d0ac663f6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:165
export const BOS4_RECOG____header_global_779969621af2628d = ((((((342) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c242f3d504bd5f2ea50d5704() {
  return __cxx_static_address_c242f3d504bd5f2ea50d5704.reference || (__cxx_static_address_c242f3d504bd5f2ea50d5704.reference = {
    __cReference: true,
    get value() { return BOS4_RECOG____header_global_779969621af2628d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:166
export const LIGHTNING_SLAP____header_global_47a75942595347ed = ((((((351) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e20ffa2f0eb8abc4c51bf985() {
  return __cxx_static_address_e20ffa2f0eb8abc4c51bf985.reference || (__cxx_static_address_e20ffa2f0eb8abc4c51bf985.reference = {
    __cReference: true,
    get value() { return LIGHTNING_SLAP____header_global_47a75942595347ed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:167
export const THUNDER____header_global_d9f6fe12cfc77302 = ((((((352) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1ec1e336553e6ba0420b18c9() {
  return __cxx_static_address_1ec1e336553e6ba0420b18c9.reference || (__cxx_static_address_1ec1e336553e6ba0420b18c9.reference = {
    __cReference: true,
    get value() { return THUNDER____header_global_d9f6fe12cfc77302; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:168
export const INTRO4_1____header_global_0a74e6fb544cdc59 = ((((((363) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b8dae538177f97e2cf4d18b8() {
  return __cxx_static_address_b8dae538177f97e2cf4d18b8.reference || (__cxx_static_address_b8dae538177f97e2cf4d18b8.reference = {
    __cReference: true,
    get value() { return INTRO4_1____header_global_0a74e6fb544cdc59; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:169
export const INTRO4_2____header_global_48767c563d5099ea = ((((((364) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e257ec1cd9cc5957a951321() {
  return __cxx_static_address_1e257ec1cd9cc5957a951321.reference || (__cxx_static_address_1e257ec1cd9cc5957a951321.reference = {
    __cReference: true,
    get value() { return INTRO4_2____header_global_48767c563d5099ea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:170
export const INTRO4_3____header_global_47de5cc719f36c86 = ((((((365) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2e7c5a877a4781af78c9bbf1() {
  return __cxx_static_address_2e7c5a877a4781af78c9bbf1.reference || (__cxx_static_address_2e7c5a877a4781af78c9bbf1.reference = {
    __cReference: true,
    get value() { return INTRO4_3____header_global_47de5cc719f36c86; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:171
export const INTRO4_4____header_global_90d167b03de46fdb = ((((((366) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8be5ef93d3d1511b221fb8ba() {
  return __cxx_static_address_8be5ef93d3d1511b221fb8ba.reference || (__cxx_static_address_8be5ef93d3d1511b221fb8ba.reference = {
    __cReference: true,
    get value() { return INTRO4_4____header_global_90d167b03de46fdb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:172
export const INTRO4_5____header_global_564e04dff2d97974 = ((((((367) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_811951fc7899b7d840736ad4() {
  return __cxx_static_address_811951fc7899b7d840736ad4.reference || (__cxx_static_address_811951fc7899b7d840736ad4.reference = {
    __cReference: true,
    get value() { return INTRO4_5____header_global_564e04dff2d97974; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:173
export const INTRO4_6____header_global_e22e1408dd2755c1 = ((((((368) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4f219e1787a0273f272ddac2() {
  return __cxx_static_address_4f219e1787a0273f272ddac2.reference || (__cxx_static_address_4f219e1787a0273f272ddac2.reference = {
    __cReference: true,
    get value() { return INTRO4_6____header_global_e22e1408dd2755c1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:174
export const BOSS4_DEADSPEECH____header_global_1ad766d515d417f6 = ((((((370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b8e7c6426c5e7116b130d732() {
  return __cxx_static_address_b8e7c6426c5e7116b130d732.reference || (__cxx_static_address_b8e7c6426c5e7116b130d732.reference = {
    __cReference: true,
    get value() { return BOSS4_DEADSPEECH____header_global_1ad766d515d417f6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:175
export const BOSS4_FIRSTSEE____header_global_a294587f8550e741 = ((((((371) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bef56d85174b66ab7f2d5506() {
  return __cxx_static_address_bef56d85174b66ab7f2d5506.reference || (__cxx_static_address_bef56d85174b66ab7f2d5506.reference = {
    __cReference: true,
    get value() { return BOSS4_FIRSTSEE____header_global_a294587f8550e741; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:176
export const VOL4ENDSND1____header_global_772b9aa1c123e9ae = ((((((384) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f969d81cb88c89d15966f4e2() {
  return __cxx_static_address_f969d81cb88c89d15966f4e2.reference || (__cxx_static_address_f969d81cb88c89d15966f4e2.reference = {
    __cReference: true,
    get value() { return VOL4ENDSND1____header_global_772b9aa1c123e9ae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:177
export const VOL4ENDSND2____header_global_dd27c6cc7c51a444 = ((((((385) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3e879d961bf746b4056de45c() {
  return __cxx_static_address_3e879d961bf746b4056de45c.reference || (__cxx_static_address_3e879d961bf746b4056de45c.reference = {
    __cReference: true,
    get value() { return VOL4ENDSND2____header_global_dd27c6cc7c51a444; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:178
export const EXPANDERSHOOT____header_global_95c129f4016eb4ba = ((((((388) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c11d4dcf47404d2bdecbb424() {
  return __cxx_static_address_c11d4dcf47404d2bdecbb424.reference || (__cxx_static_address_c11d4dcf47404d2bdecbb424.reference = {
    __cReference: true,
    get value() { return EXPANDERSHOOT____header_global_95c129f4016eb4ba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:179
export const INTRO4_B____header_global_4d3884b7de5f281d = ((((((392) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_17cb192931809524ab91a8a2() {
  return __cxx_static_address_17cb192931809524ab91a8a2.reference || (__cxx_static_address_17cb192931809524ab91a8a2.reference = {
    __cReference: true,
    get value() { return INTRO4_B____header_global_4d3884b7de5f281d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:180
export const BIGBANG____header_global_95a643ddc80d6330 = ((((((393) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_88e1e4d862be67ea590d15b9() {
  return __cxx_static_address_88e1e4d862be67ea590d15b9.reference || (__cxx_static_address_88e1e4d862be67ea590d15b9.reference = {
    __cReference: true,
    get value() { return BIGBANG____header_global_95a643ddc80d6330; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:181
export const FLAMETHROWER_INTRO____header_global_8c6fcc2b1599dfd0 = ((((((398) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ba5c40c7476d2f1f640bec96() {
  return __cxx_static_address_ba5c40c7476d2f1f640bec96.reference || (__cxx_static_address_ba5c40c7476d2f1f640bec96.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_INTRO____header_global_8c6fcc2b1599dfd0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:182
export const FLAMETHROWER_LOOP____header_global_4c21b985261d6889 = ((((((399) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f73e6b7cc8a6a32231c3fd9f() {
  return __cxx_static_address_f73e6b7cc8a6a32231c3fd9f.reference || (__cxx_static_address_f73e6b7cc8a6a32231c3fd9f.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_LOOP____header_global_4c21b985261d6889; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:183
export const FLAMETHROWER_END____header_global_2e64e74da316b05c = ((((((400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_66bb69db74e75e1e6a29063b() {
  return __cxx_static_address_66bb69db74e75e1e6a29063b.reference || (__cxx_static_address_66bb69db74e75e1e6a29063b.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_END____header_global_2e64e74da316b05c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:184
export const E5L7_DUKE_QUIT_YOU____header_global_dd012d835b1b004d = ((((((401) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_252304a2a4774dab078a55dc() {
  return __cxx_static_address_252304a2a4774dab078a55dc.reference || (__cxx_static_address_252304a2a4774dab078a55dc.reference = {
    __cReference: true,
    get value() { return E5L7_DUKE_QUIT_YOU____header_global_dd012d835b1b004d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:187
export const SECTOREFFECTOR____header_global_fac2be1f06016583 = ((((((1) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ef970338d93feec775a1cad2() {
  return __cxx_static_address_ef970338d93feec775a1cad2.reference || (__cxx_static_address_ef970338d93feec775a1cad2.reference = {
    __cReference: true,
    get value() { return SECTOREFFECTOR____header_global_fac2be1f06016583; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:188
export const ACTIVATOR____header_global_b92bf86fe03e40a8 = ((((((2) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b52769562b0bf98c25f8c3bf() {
  return __cxx_static_address_b52769562b0bf98c25f8c3bf.reference || (__cxx_static_address_b52769562b0bf98c25f8c3bf.reference = {
    __cReference: true,
    get value() { return ACTIVATOR____header_global_b92bf86fe03e40a8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:189
export const TOUCHPLATE____header_global_9ccb74b5665b48c3 = ((((((3) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_349fd8f7b83b0a70e8a7da24() {
  return __cxx_static_address_349fd8f7b83b0a70e8a7da24.reference || (__cxx_static_address_349fd8f7b83b0a70e8a7da24.reference = {
    __cReference: true,
    get value() { return TOUCHPLATE____header_global_9ccb74b5665b48c3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:190
export const ACTIVATORLOCKED____header_global_ad8b04b6ab8a24d3 = ((((((4) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3e303b1938b7002db56bdb0c() {
  return __cxx_static_address_3e303b1938b7002db56bdb0c.reference || (__cxx_static_address_3e303b1938b7002db56bdb0c.reference = {
    __cReference: true,
    get value() { return ACTIVATORLOCKED____header_global_ad8b04b6ab8a24d3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:191
export const MUSICANDSFX____header_global_68cd94e096e517ea = ((((((5) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_757abeaff58eddcee555e52c() {
  return __cxx_static_address_757abeaff58eddcee555e52c.reference || (__cxx_static_address_757abeaff58eddcee555e52c.reference = {
    __cReference: true,
    get value() { return MUSICANDSFX____header_global_68cd94e096e517ea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:192
export const LOCATORS____header_global_386831443a41f6da = ((((((6) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9cd409a1fc080989cb2d35d6() {
  return __cxx_static_address_9cd409a1fc080989cb2d35d6.reference || (__cxx_static_address_9cd409a1fc080989cb2d35d6.reference = {
    __cReference: true,
    get value() { return LOCATORS____header_global_386831443a41f6da; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:193
export const CYCLER____header_global_31baa0ceb0b4acbb = ((((((7) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_48f44aa5e554b35a269f5f99() {
  return __cxx_static_address_48f44aa5e554b35a269f5f99.reference || (__cxx_static_address_48f44aa5e554b35a269f5f99.reference = {
    __cReference: true,
    get value() { return CYCLER____header_global_31baa0ceb0b4acbb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:194
export const MASTERSWITCH____header_global_632ca26fd7346725 = ((((((8) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5685a68a02625679042bbd59() {
  return __cxx_static_address_5685a68a02625679042bbd59.reference || (__cxx_static_address_5685a68a02625679042bbd59.reference = {
    __cReference: true,
    get value() { return MASTERSWITCH____header_global_632ca26fd7346725; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:195
export const RESPAWN____header_global_dec98206f32fe19c = ((((((9) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6e2780f691f9ec7af79c599c() {
  return __cxx_static_address_6e2780f691f9ec7af79c599c.reference || (__cxx_static_address_6e2780f691f9ec7af79c599c.reference = {
    __cReference: true,
    get value() { return RESPAWN____header_global_dec98206f32fe19c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:196
export const GPSPEED____header_global_82fa02ff0321202f = ((((((10) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9262b2f43431b58239a7ab20() {
  return __cxx_static_address_9262b2f43431b58239a7ab20.reference || (__cxx_static_address_9262b2f43431b58239a7ab20.reference = {
    __cReference: true,
    get value() { return GPSPEED____header_global_82fa02ff0321202f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:197
export const FOF____header_global_5fbb0a5de355df5b = ((((((13) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b5ab4f938594273bc9f0f331() {
  return __cxx_static_address_b5ab4f938594273bc9f0f331.reference || (__cxx_static_address_b5ab4f938594273bc9f0f331.reference = {
    __cReference: true,
    get value() { return FOF____header_global_5fbb0a5de355df5b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:198
export const ARROW____header_global_124a4a89a7a5d90a = ((((((20) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_570086f89fcaae40f53fa6c2() {
  return __cxx_static_address_570086f89fcaae40f53fa6c2.reference || (__cxx_static_address_570086f89fcaae40f53fa6c2.reference = {
    __cReference: true,
    get value() { return ARROW____header_global_124a4a89a7a5d90a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:199
export const FIRSTGUNSPRITE____header_global_ca701ab6f2bb4f70 = ((((((21) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d2f9c37e32d04fd6846fcb78() {
  return __cxx_static_address_d2f9c37e32d04fd6846fcb78.reference || (__cxx_static_address_d2f9c37e32d04fd6846fcb78.reference = {
    __cReference: true,
    get value() { return FIRSTGUNSPRITE____header_global_ca701ab6f2bb4f70; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:200
export const CHAINGUNSPRITE____header_global_489bf1716b9647f8 = ((((((22) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0256f86dfd43c86d325d036e() {
  return __cxx_static_address_0256f86dfd43c86d325d036e.reference || (__cxx_static_address_0256f86dfd43c86d325d036e.reference = {
    __cReference: true,
    get value() { return CHAINGUNSPRITE____header_global_489bf1716b9647f8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:201
export const RPGSPRITE____header_global_ae461c09d8c36093 = ((((((23) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_99bd6dc91b6c3edd37f8e350() {
  return __cxx_static_address_99bd6dc91b6c3edd37f8e350.reference || (__cxx_static_address_99bd6dc91b6c3edd37f8e350.reference = {
    __cReference: true,
    get value() { return RPGSPRITE____header_global_ae461c09d8c36093; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:202
export const FREEZESPRITE____header_global_6599c3c820cfcb9f = ((((((24) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_325e5e52839fb872f84496c0() {
  return __cxx_static_address_325e5e52839fb872f84496c0.reference || (__cxx_static_address_325e5e52839fb872f84496c0.reference = {
    __cReference: true,
    get value() { return FREEZESPRITE____header_global_6599c3c820cfcb9f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:203
export const SHRINKERSPRITE____header_global_01d33e7dd032331d = ((((((25) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_718dbd369726ebe3e0e4d92a() {
  return __cxx_static_address_718dbd369726ebe3e0e4d92a.reference || (__cxx_static_address_718dbd369726ebe3e0e4d92a.reference = {
    __cReference: true,
    get value() { return SHRINKERSPRITE____header_global_01d33e7dd032331d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:204
export const HEAVYHBOMB____header_global_b9cb7f2430cf04f7 = ((((((26) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b96ea56964972c79c7399ed5() {
  return __cxx_static_address_b96ea56964972c79c7399ed5.reference || (__cxx_static_address_b96ea56964972c79c7399ed5.reference = {
    __cReference: true,
    get value() { return HEAVYHBOMB____header_global_b9cb7f2430cf04f7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:205
export const TRIPBOMBSPRITE____header_global_97fda96174c3ec1e = ((((((27) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6593b139e63c20ef4de9f45b() {
  return __cxx_static_address_6593b139e63c20ef4de9f45b.reference || (__cxx_static_address_6593b139e63c20ef4de9f45b.reference = {
    __cReference: true,
    get value() { return TRIPBOMBSPRITE____header_global_97fda96174c3ec1e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:206
export const SHOTGUNSPRITE____header_global_7f27a0ad7db0ee08 = ((((((28) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_920e009d80e9b5e52472316f() {
  return __cxx_static_address_920e009d80e9b5e52472316f.reference || (__cxx_static_address_920e009d80e9b5e52472316f.reference = {
    __cReference: true,
    get value() { return SHOTGUNSPRITE____header_global_7f27a0ad7db0ee08; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:207
export const DEVISTATORSPRITE____header_global_b9567e66fc758fbd = ((((((29) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4eed9a825bf997f4c5cdf206() {
  return __cxx_static_address_4eed9a825bf997f4c5cdf206.reference || (__cxx_static_address_4eed9a825bf997f4c5cdf206.reference = {
    __cReference: true,
    get value() { return DEVISTATORSPRITE____header_global_b9567e66fc758fbd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:208
export const HEALTHBOX____header_global_d860167cca01e234 = ((((((30) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2d8a715e7084007a5bd65333() {
  return __cxx_static_address_2d8a715e7084007a5bd65333.reference || (__cxx_static_address_2d8a715e7084007a5bd65333.reference = {
    __cReference: true,
    get value() { return HEALTHBOX____header_global_d860167cca01e234; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:209
export const AMMOBOX____header_global_e17ad29f3e3267de = ((((((31) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1fe9b4fe2187af6843fd3c56() {
  return __cxx_static_address_1fe9b4fe2187af6843fd3c56.reference || (__cxx_static_address_1fe9b4fe2187af6843fd3c56.reference = {
    __cReference: true,
    get value() { return AMMOBOX____header_global_e17ad29f3e3267de; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:210
export const GROWSPRITEICON____header_global_51d01306edbfc240 = ((((((32) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e0e0055710c967da733140a4() {
  return __cxx_static_address_e0e0055710c967da733140a4.reference || (__cxx_static_address_e0e0055710c967da733140a4.reference = {
    __cReference: true,
    get value() { return GROWSPRITEICON____header_global_51d01306edbfc240; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:211
export const INVENTORYBOX____header_global_97117f2664308269 = ((((((33) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c101773517d386c73aa419e5() {
  return __cxx_static_address_c101773517d386c73aa419e5.reference || (__cxx_static_address_c101773517d386c73aa419e5.reference = {
    __cReference: true,
    get value() { return INVENTORYBOX____header_global_97117f2664308269; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:212
export const FREEZEAMMO____header_global_f6c1140c212ed4da = ((((((37) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_473ba5fa5e12bee7a5ed59db() {
  return __cxx_static_address_473ba5fa5e12bee7a5ed59db.reference || (__cxx_static_address_473ba5fa5e12bee7a5ed59db.reference = {
    __cReference: true,
    get value() { return FREEZEAMMO____header_global_f6c1140c212ed4da; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:213
export const AMMO____header_global_5a799e3dd68ca715 = ((((((40) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7adfbad395268c1046417992() {
  return __cxx_static_address_7adfbad395268c1046417992.reference || (__cxx_static_address_7adfbad395268c1046417992.reference = {
    __cReference: true,
    get value() { return AMMO____header_global_5a799e3dd68ca715; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:214
export const BATTERYAMMO____header_global_9747e7172f4f0a07 = ((((((41) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3ff2e28ce2826daa50d9bd7f() {
  return __cxx_static_address_3ff2e28ce2826daa50d9bd7f.reference || (__cxx_static_address_3ff2e28ce2826daa50d9bd7f.reference = {
    __cReference: true,
    get value() { return BATTERYAMMO____header_global_9747e7172f4f0a07; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:215
export const DEVISTATORAMMO____header_global_4120afc13f230c34 = ((((((42) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5c55d4d7c85b7036a6a6bef5() {
  return __cxx_static_address_5c55d4d7c85b7036a6a6bef5.reference || (__cxx_static_address_5c55d4d7c85b7036a6a6bef5.reference = {
    __cReference: true,
    get value() { return DEVISTATORAMMO____header_global_4120afc13f230c34; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:216
export const RPGAMMO____header_global_bf5f90081c0630fb = ((((((44) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_24cfd78a25e0b26632af8a39() {
  return __cxx_static_address_24cfd78a25e0b26632af8a39.reference || (__cxx_static_address_24cfd78a25e0b26632af8a39.reference = {
    __cReference: true,
    get value() { return RPGAMMO____header_global_bf5f90081c0630fb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:217
export const GROWAMMO____header_global_0f571d46d0efccdd = ((((((45) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e6db25b911df8f518756307a() {
  return __cxx_static_address_e6db25b911df8f518756307a.reference || (__cxx_static_address_e6db25b911df8f518756307a.reference = {
    __cReference: true,
    get value() { return GROWAMMO____header_global_0f571d46d0efccdd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:218
export const CRYSTALAMMO____header_global_04e41c719c91050c = ((((((46) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a3b07fb5cb5a3d745ec8e37f() {
  return __cxx_static_address_a3b07fb5cb5a3d745ec8e37f.reference || (__cxx_static_address_a3b07fb5cb5a3d745ec8e37f.reference = {
    __cReference: true,
    get value() { return CRYSTALAMMO____header_global_04e41c719c91050c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:219
export const HBOMBAMMO____header_global_8487922c52496cca = ((((((47) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_292620b5fdeece278f9d9f63() {
  return __cxx_static_address_292620b5fdeece278f9d9f63.reference || (__cxx_static_address_292620b5fdeece278f9d9f63.reference = {
    __cReference: true,
    get value() { return HBOMBAMMO____header_global_8487922c52496cca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:220
export const AMMOLOTS____header_global_26cfa5e3df8fd8c1 = ((((((48) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0fa6ece1c1c6bd966a00a2f2() {
  return __cxx_static_address_0fa6ece1c1c6bd966a00a2f2.reference || (__cxx_static_address_0fa6ece1c1c6bd966a00a2f2.reference = {
    __cReference: true,
    get value() { return AMMOLOTS____header_global_26cfa5e3df8fd8c1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:221
export const SHOTGUNAMMO____header_global_826a196c38c3aa75 = ((((((49) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9409aff4075399dbed95a3af() {
  return __cxx_static_address_9409aff4075399dbed95a3af.reference || (__cxx_static_address_9409aff4075399dbed95a3af.reference = {
    __cReference: true,
    get value() { return SHOTGUNAMMO____header_global_826a196c38c3aa75; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:222
export const COLA____header_global_72d0a0625bcad956 = ((((((51) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fa64631e2fb8e31818cffe01() {
  return __cxx_static_address_fa64631e2fb8e31818cffe01.reference || (__cxx_static_address_fa64631e2fb8e31818cffe01.reference = {
    __cReference: true,
    get value() { return COLA____header_global_72d0a0625bcad956; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:223
export const SIXPAK____header_global_99fdccd1d6759cbd = ((((((52) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e7effe247653a85118ec48ed() {
  return __cxx_static_address_e7effe247653a85118ec48ed.reference || (__cxx_static_address_e7effe247653a85118ec48ed.reference = {
    __cReference: true,
    get value() { return SIXPAK____header_global_99fdccd1d6759cbd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:224
export const FIRSTAID____header_global_a1a7f67ffcdb95a8 = ((((((53) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5b98389cb8f9ced55b4bcdef() {
  return __cxx_static_address_5b98389cb8f9ced55b4bcdef.reference || (__cxx_static_address_5b98389cb8f9ced55b4bcdef.reference = {
    __cReference: true,
    get value() { return FIRSTAID____header_global_a1a7f67ffcdb95a8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:225
export const SHIELD____header_global_e67839501c280c0f = ((((((54) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bded5fe9ae4402c261dcbdef() {
  return __cxx_static_address_bded5fe9ae4402c261dcbdef.reference || (__cxx_static_address_bded5fe9ae4402c261dcbdef.reference = {
    __cReference: true,
    get value() { return SHIELD____header_global_e67839501c280c0f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:226
export const STEROIDS____header_global_4144d6204f800c35 = ((((((55) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d01b4b9973c5e3c8bd8bbf20() {
  return __cxx_static_address_d01b4b9973c5e3c8bd8bbf20.reference || (__cxx_static_address_d01b4b9973c5e3c8bd8bbf20.reference = {
    __cReference: true,
    get value() { return STEROIDS____header_global_4144d6204f800c35; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:227
export const AIRTANK____header_global_c47ed4cb393e10fb = ((((((56) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_df7a687b8196daea6833551c() {
  return __cxx_static_address_df7a687b8196daea6833551c.reference || (__cxx_static_address_df7a687b8196daea6833551c.reference = {
    __cReference: true,
    get value() { return AIRTANK____header_global_c47ed4cb393e10fb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:228
export const JETPACK____header_global_7c4f99abfaa17ca7 = ((((((57) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3189ed29eda647821fb96b8d() {
  return __cxx_static_address_3189ed29eda647821fb96b8d.reference || (__cxx_static_address_3189ed29eda647821fb96b8d.reference = {
    __cReference: true,
    get value() { return JETPACK____header_global_7c4f99abfaa17ca7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:229
export const HEATSENSOR____header_global_724dfdcd95fb4e6d = ((((((59) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ac9660de86e103813b7f6679() {
  return __cxx_static_address_ac9660de86e103813b7f6679.reference || (__cxx_static_address_ac9660de86e103813b7f6679.reference = {
    __cReference: true,
    get value() { return HEATSENSOR____header_global_724dfdcd95fb4e6d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:230
export const ACCESSCARD____header_global_685d5d745221781f = ((((((60) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1cc3ac222f18cff421cbacc5() {
  return __cxx_static_address_1cc3ac222f18cff421cbacc5.reference || (__cxx_static_address_1cc3ac222f18cff421cbacc5.reference = {
    __cReference: true,
    get value() { return ACCESSCARD____header_global_685d5d745221781f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:231
export const BOOTS____header_global_d8222922b329954c = ((((((61) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3b1b4e045b845be15c060379() {
  return __cxx_static_address_3b1b4e045b845be15c060379.reference || (__cxx_static_address_3b1b4e045b845be15c060379.reference = {
    __cReference: true,
    get value() { return BOOTS____header_global_d8222922b329954c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:232
export const MIRRORBROKE____header_global_945f9c4057deb469 = ((((((70) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_12b298b3e096b47a81cd8e6b() {
  return __cxx_static_address_12b298b3e096b47a81cd8e6b.reference || (__cxx_static_address_12b298b3e096b47a81cd8e6b.reference = {
    __cReference: true,
    get value() { return MIRRORBROKE____header_global_945f9c4057deb469; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:233
export const CLOUDYOCEAN____header_global_2acf12caead08295 = ((((((78) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dea83dc6a472d41a6e7dbb12() {
  return __cxx_static_address_dea83dc6a472d41a6e7dbb12.reference || (__cxx_static_address_dea83dc6a472d41a6e7dbb12.reference = {
    __cReference: true,
    get value() { return CLOUDYOCEAN____header_global_2acf12caead08295; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:234
export const CLOUDYSKIES____header_global_e057d746254d76ba = ((((((79) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_10123e16a01f9ec828e43804() {
  return __cxx_static_address_10123e16a01f9ec828e43804.reference || (__cxx_static_address_10123e16a01f9ec828e43804.reference = {
    __cReference: true,
    get value() { return CLOUDYSKIES____header_global_e057d746254d76ba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:235
export const MOONSKY1____header_global_85ab40b8d294c502 = ((((((80) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_92ef827cbce89c0057088062() {
  return __cxx_static_address_92ef827cbce89c0057088062.reference || (__cxx_static_address_92ef827cbce89c0057088062.reference = {
    __cReference: true,
    get value() { return MOONSKY1____header_global_85ab40b8d294c502; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:236
export const BIGORBIT1____header_global_346c79a12fb94cd8 = ((((((84) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a0f94038bfaf4b42a3eec6b5() {
  return __cxx_static_address_a0f94038bfaf4b42a3eec6b5.reference || (__cxx_static_address_a0f94038bfaf4b42a3eec6b5.reference = {
    __cReference: true,
    get value() { return BIGORBIT1____header_global_346c79a12fb94cd8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:237
export const LA____header_global_f579ccb2f6f76b43 = ((((((89) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3fd877d0611874dbcf3dd27f() {
  return __cxx_static_address_3fd877d0611874dbcf3dd27f.reference || (__cxx_static_address_3fd877d0611874dbcf3dd27f.reference = {
    __cReference: true,
    get value() { return LA____header_global_f579ccb2f6f76b43; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:238
export const ATOMICHEALTH____header_global_ca2cd626291b6aca = ((((((100) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_355042394764b8c37014843d() {
  return __cxx_static_address_355042394764b8c37014843d.reference || (__cxx_static_address_355042394764b8c37014843d.reference = {
    __cReference: true,
    get value() { return ATOMICHEALTH____header_global_ca2cd626291b6aca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:239
export const TECHLIGHT2____header_global_8ac27316f239f0ed = ((((((120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_260dfd38678148e9bbc7cffd() {
  return __cxx_static_address_260dfd38678148e9bbc7cffd.reference || (__cxx_static_address_260dfd38678148e9bbc7cffd.reference = {
    __cReference: true,
    get value() { return TECHLIGHT2____header_global_8ac27316f239f0ed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:240
export const TECHLIGHTBUST2____header_global_d246c0fe286ae4c0 = ((((((121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f4b9b271055ad3ebe8eff3c8() {
  return __cxx_static_address_f4b9b271055ad3ebe8eff3c8.reference || (__cxx_static_address_f4b9b271055ad3ebe8eff3c8.reference = {
    __cReference: true,
    get value() { return TECHLIGHTBUST2____header_global_d246c0fe286ae4c0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:241
export const TECHLIGHT4____header_global_83f072488cd4e0f8 = ((((((122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_27a474c231764e1be468a4eb() {
  return __cxx_static_address_27a474c231764e1be468a4eb.reference || (__cxx_static_address_27a474c231764e1be468a4eb.reference = {
    __cReference: true,
    get value() { return TECHLIGHT4____header_global_83f072488cd4e0f8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:242
export const TECHLIGHTBUST4____header_global_47be78c831aa6c9e = ((((((123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ef09d5f56b1e6c0b8fc9ff94() {
  return __cxx_static_address_ef09d5f56b1e6c0b8fc9ff94.reference || (__cxx_static_address_ef09d5f56b1e6c0b8fc9ff94.reference = {
    __cReference: true,
    get value() { return TECHLIGHTBUST4____header_global_47be78c831aa6c9e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:243
export const WALLLIGHT4____header_global_b5da15d8a9d36762 = ((((((124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_42ccd80a67a5a6cfdd494fde() {
  return __cxx_static_address_42ccd80a67a5a6cfdd494fde.reference || (__cxx_static_address_42ccd80a67a5a6cfdd494fde.reference = {
    __cReference: true,
    get value() { return WALLLIGHT4____header_global_b5da15d8a9d36762; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:244
export const WALLLIGHTBUST4____header_global_16bcb7b1e5d1a3b1 = ((((((125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b29c78ddfe38937f18b78044() {
  return __cxx_static_address_b29c78ddfe38937f18b78044.reference || (__cxx_static_address_b29c78ddfe38937f18b78044.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST4____header_global_16bcb7b1e5d1a3b1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:245
export const ACCESSSWITCH____header_global_6fcc33e8abc64653 = ((((((130) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_12229aaf034b2d99f86652ba() {
  return __cxx_static_address_12229aaf034b2d99f86652ba.reference || (__cxx_static_address_12229aaf034b2d99f86652ba.reference = {
    __cReference: true,
    get value() { return ACCESSSWITCH____header_global_6fcc33e8abc64653; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:246
export const SLOTDOOR____header_global_668a19794f461ba2 = ((((((132) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b0471e6a26d6156a78727543() {
  return __cxx_static_address_b0471e6a26d6156a78727543.reference || (__cxx_static_address_b0471e6a26d6156a78727543.reference = {
    __cReference: true,
    get value() { return SLOTDOOR____header_global_668a19794f461ba2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:247
export const LIGHTSWITCH____header_global_bd0668e7937df10e = ((((((134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_54578472f9a018db825f4618() {
  return __cxx_static_address_54578472f9a018db825f4618.reference || (__cxx_static_address_54578472f9a018db825f4618.reference = {
    __cReference: true,
    get value() { return LIGHTSWITCH____header_global_bd0668e7937df10e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:248
export const SPACEDOORSWITCH____header_global_89cd8dea387824f4 = ((((((136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3001c1e93bfca7bd230ecf1d() {
  return __cxx_static_address_3001c1e93bfca7bd230ecf1d.reference || (__cxx_static_address_3001c1e93bfca7bd230ecf1d.reference = {
    __cReference: true,
    get value() { return SPACEDOORSWITCH____header_global_89cd8dea387824f4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:249
export const SPACELIGHTSWITCH____header_global_008248fb9d63b9bc = ((((((138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c6050b2cc5d30f892a075f34() {
  return __cxx_static_address_c6050b2cc5d30f892a075f34.reference || (__cxx_static_address_c6050b2cc5d30f892a075f34.reference = {
    __cReference: true,
    get value() { return SPACELIGHTSWITCH____header_global_008248fb9d63b9bc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:250
export const FRANKENSTINESWITCH____header_global_ab59ba05762a6f16 = ((((((140) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4f517e9dde0dd556dc6ba42c() {
  return __cxx_static_address_4f517e9dde0dd556dc6ba42c.reference || (__cxx_static_address_4f517e9dde0dd556dc6ba42c.reference = {
    __cReference: true,
    get value() { return FRANKENSTINESWITCH____header_global_ab59ba05762a6f16; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:251
export const NUKEBUTTON____header_global_1dd922e09857b649 = ((((((142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a3081f8f934a9e9fb687ec48() {
  return __cxx_static_address_a3081f8f934a9e9fb687ec48.reference || (__cxx_static_address_a3081f8f934a9e9fb687ec48.reference = {
    __cReference: true,
    get value() { return NUKEBUTTON____header_global_1dd922e09857b649; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:252
export const MULTISWITCH____header_global_f1bb945f284c9c1a = ((((((146) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_909dffaa9d8238c74ef6dce1() {
  return __cxx_static_address_909dffaa9d8238c74ef6dce1.reference || (__cxx_static_address_909dffaa9d8238c74ef6dce1.reference = {
    __cReference: true,
    get value() { return MULTISWITCH____header_global_f1bb945f284c9c1a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:253
export const DOORTILE5____header_global_2398639acb3c9dc8 = ((((((150) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c807f53edf2efbee9cb54245() {
  return __cxx_static_address_c807f53edf2efbee9cb54245.reference || (__cxx_static_address_c807f53edf2efbee9cb54245.reference = {
    __cReference: true,
    get value() { return DOORTILE5____header_global_2398639acb3c9dc8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:254
export const DOORTILE6____header_global_dfb8c232c3c6bd3d = ((((((151) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0f2db6eccd74ae97e6d98cb6() {
  return __cxx_static_address_0f2db6eccd74ae97e6d98cb6.reference || (__cxx_static_address_0f2db6eccd74ae97e6d98cb6.reference = {
    __cReference: true,
    get value() { return DOORTILE6____header_global_dfb8c232c3c6bd3d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:255
export const DOORTILE1____header_global_db2967db4ac80ca4 = ((((((152) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a45ef07c6312445099199cd2() {
  return __cxx_static_address_a45ef07c6312445099199cd2.reference || (__cxx_static_address_a45ef07c6312445099199cd2.reference = {
    __cReference: true,
    get value() { return DOORTILE1____header_global_db2967db4ac80ca4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:256
export const DOORTILE2____header_global_87b38512581a3234 = ((((((153) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f8d07c504e79a86a476b6917() {
  return __cxx_static_address_f8d07c504e79a86a476b6917.reference || (__cxx_static_address_f8d07c504e79a86a476b6917.reference = {
    __cReference: true,
    get value() { return DOORTILE2____header_global_87b38512581a3234; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:257
export const DOORTILE3____header_global_65d9a965e4276462 = ((((((154) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2d19d5da480bff518adb2dbb() {
  return __cxx_static_address_2d19d5da480bff518adb2dbb.reference || (__cxx_static_address_2d19d5da480bff518adb2dbb.reference = {
    __cReference: true,
    get value() { return DOORTILE3____header_global_65d9a965e4276462; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:258
export const DOORTILE4____header_global_6823c4cb69f7faea = ((((((155) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_446abdb8737293c99e94a986() {
  return __cxx_static_address_446abdb8737293c99e94a986.reference || (__cxx_static_address_446abdb8737293c99e94a986.reference = {
    __cReference: true,
    get value() { return DOORTILE4____header_global_6823c4cb69f7faea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:259
export const DOORTILE7____header_global_f1da704f44203c81 = ((((((156) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_77cfa44ebd001cae38a1972b() {
  return __cxx_static_address_77cfa44ebd001cae38a1972b.reference || (__cxx_static_address_77cfa44ebd001cae38a1972b.reference = {
    __cReference: true,
    get value() { return DOORTILE7____header_global_f1da704f44203c81; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:260
export const DOORTILE8____header_global_1cdfc0ee5057dcd6 = ((((((157) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_76f0a5caff306f7b3b342125() {
  return __cxx_static_address_76f0a5caff306f7b3b342125.reference || (__cxx_static_address_76f0a5caff306f7b3b342125.reference = {
    __cReference: true,
    get value() { return DOORTILE8____header_global_1cdfc0ee5057dcd6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:261
export const DOORTILE9____header_global_31248e576af44fd0 = ((((((158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_059ba79a785ecdb2a417470e() {
  return __cxx_static_address_059ba79a785ecdb2a417470e.reference || (__cxx_static_address_059ba79a785ecdb2a417470e.reference = {
    __cReference: true,
    get value() { return DOORTILE9____header_global_31248e576af44fd0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:262
export const DOORTILE10____header_global_4793e1576119df71 = ((((((159) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fdef4d7447ec6590383c853f() {
  return __cxx_static_address_fdef4d7447ec6590383c853f.reference || (__cxx_static_address_fdef4d7447ec6590383c853f.reference = {
    __cReference: true,
    get value() { return DOORTILE10____header_global_4793e1576119df71; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:263
export const DOORSHOCK____header_global_bfb9e655dfebb61d = ((((((160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3dbae8925c348b516ac07459() {
  return __cxx_static_address_3dbae8925c348b516ac07459.reference || (__cxx_static_address_3dbae8925c348b516ac07459.reference = {
    __cReference: true,
    get value() { return DOORSHOCK____header_global_bfb9e655dfebb61d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:264
export const DIPSWITCH____header_global_cf58d2e8208d542b = ((((((162) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5fce6d947c83140c900f6179() {
  return __cxx_static_address_5fce6d947c83140c900f6179.reference || (__cxx_static_address_5fce6d947c83140c900f6179.reference = {
    __cReference: true,
    get value() { return DIPSWITCH____header_global_cf58d2e8208d542b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:265
export const DIPSWITCH2____header_global_340dcac697b246ad = ((((((164) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6fffafbd680cc8c890adc2ce() {
  return __cxx_static_address_6fffafbd680cc8c890adc2ce.reference || (__cxx_static_address_6fffafbd680cc8c890adc2ce.reference = {
    __cReference: true,
    get value() { return DIPSWITCH2____header_global_340dcac697b246ad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:266
export const TECHSWITCH____header_global_3f6857e1b92d1ce0 = ((((((166) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e73725610bea859eacb45b52() {
  return __cxx_static_address_e73725610bea859eacb45b52.reference || (__cxx_static_address_e73725610bea859eacb45b52.reference = {
    __cReference: true,
    get value() { return TECHSWITCH____header_global_3f6857e1b92d1ce0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:267
export const DIPSWITCH3____header_global_7f20a922f81d5259 = ((((((168) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3fcfc3217815ce2130862e42() {
  return __cxx_static_address_3fcfc3217815ce2130862e42.reference || (__cxx_static_address_3fcfc3217815ce2130862e42.reference = {
    __cReference: true,
    get value() { return DIPSWITCH3____header_global_7f20a922f81d5259; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:268
export const ACCESSSWITCH2____header_global_31871f5dcbcfd390 = ((((((170) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e7c374f84e32edb20c627984() {
  return __cxx_static_address_e7c374f84e32edb20c627984.reference || (__cxx_static_address_e7c374f84e32edb20c627984.reference = {
    __cReference: true,
    get value() { return ACCESSSWITCH2____header_global_31871f5dcbcfd390; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:269
export const FLOORSLIME____header_global_62f89eb8d6cf5220 = ((((((200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6f1b38cee3fc5eeb7a6c1cf6() {
  return __cxx_static_address_6f1b38cee3fc5eeb7a6c1cf6.reference || (__cxx_static_address_6f1b38cee3fc5eeb7a6c1cf6.reference = {
    __cReference: true,
    get value() { return FLOORSLIME____header_global_62f89eb8d6cf5220; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:270
export const BIGFORCE____header_global_105848418de88548 = ((((((230) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_69307e9c40f91d8540217d04() {
  return __cxx_static_address_69307e9c40f91d8540217d04.reference || (__cxx_static_address_69307e9c40f91d8540217d04.reference = {
    __cReference: true,
    get value() { return BIGFORCE____header_global_105848418de88548; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:271
export const MASKWALL9____header_global_c4471b655072bad2 = ((((((255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_05bf0a322aa35f398b9eb85e() {
  return __cxx_static_address_05bf0a322aa35f398b9eb85e.reference || (__cxx_static_address_05bf0a322aa35f398b9eb85e.reference = {
    __cReference: true,
    get value() { return MASKWALL9____header_global_c4471b655072bad2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:272
export const SCREENBREAK1____header_global_96ecc59f548a04c5 = ((((((263) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2d9031411fa745f790e44b1e() {
  return __cxx_static_address_2d9031411fa745f790e44b1e.reference || (__cxx_static_address_2d9031411fa745f790e44b1e.reference = {
    __cReference: true,
    get value() { return SCREENBREAK1____header_global_96ecc59f548a04c5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:273
export const SCREENBREAK2____header_global_ac5a655f421fcdbd = ((((((264) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_45a18e60bcb42f2d94de6572() {
  return __cxx_static_address_45a18e60bcb42f2d94de6572.reference || (__cxx_static_address_45a18e60bcb42f2d94de6572.reference = {
    __cReference: true,
    get value() { return SCREENBREAK2____header_global_ac5a655f421fcdbd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:274
export const SCREENBREAK3____header_global_e0c6fce20716f121 = ((((((265) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_54113aa72e83490fd050ef2b() {
  return __cxx_static_address_54113aa72e83490fd050ef2b.reference || (__cxx_static_address_54113aa72e83490fd050ef2b.reference = {
    __cReference: true,
    get value() { return SCREENBREAK3____header_global_e0c6fce20716f121; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:275
export const SCREENBREAK4____header_global_898018a6f8619457 = ((((((266) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_955c35db7626d6b86777845c() {
  return __cxx_static_address_955c35db7626d6b86777845c.reference || (__cxx_static_address_955c35db7626d6b86777845c.reference = {
    __cReference: true,
    get value() { return SCREENBREAK4____header_global_898018a6f8619457; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:276
export const SCREENBREAK5____header_global_9bf8e528a83e562e = ((((((267) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_69e6dbd970c1e092c1c75951() {
  return __cxx_static_address_69e6dbd970c1e092c1c75951.reference || (__cxx_static_address_69e6dbd970c1e092c1c75951.reference = {
    __cReference: true,
    get value() { return SCREENBREAK5____header_global_9bf8e528a83e562e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:277
export const SCREENBREAK6____header_global_ed4cb9701b3344c7 = ((((((268) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fe495dccf577d3c695c65070() {
  return __cxx_static_address_fe495dccf577d3c695c65070.reference || (__cxx_static_address_fe495dccf577d3c695c65070.reference = {
    __cReference: true,
    get value() { return SCREENBREAK6____header_global_ed4cb9701b3344c7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:278
export const SCREENBREAK7____header_global_d434e21fdaae721c = ((((((269) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ccbaec013fdf73f75302a0f1() {
  return __cxx_static_address_ccbaec013fdf73f75302a0f1.reference || (__cxx_static_address_ccbaec013fdf73f75302a0f1.reference = {
    __cReference: true,
    get value() { return SCREENBREAK7____header_global_d434e21fdaae721c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:279
export const SCREENBREAK8____header_global_9aa18a336837c1db = ((((((270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2441334a0be93e6d35b27d59() {
  return __cxx_static_address_2441334a0be93e6d35b27d59.reference || (__cxx_static_address_2441334a0be93e6d35b27d59.reference = {
    __cReference: true,
    get value() { return SCREENBREAK8____header_global_9aa18a336837c1db; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:280
export const SCREENBREAK9____header_global_328d4c356d451c50 = ((((((271) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ac171003f122d6dd0705a073() {
  return __cxx_static_address_ac171003f122d6dd0705a073.reference || (__cxx_static_address_ac171003f122d6dd0705a073.reference = {
    __cReference: true,
    get value() { return SCREENBREAK9____header_global_328d4c356d451c50; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:281
export const SCREENBREAK10____header_global_856c79375736ff7b = ((((((272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_08676047325081fec7898a60() {
  return __cxx_static_address_08676047325081fec7898a60.reference || (__cxx_static_address_08676047325081fec7898a60.reference = {
    __cReference: true,
    get value() { return SCREENBREAK10____header_global_856c79375736ff7b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:282
export const SCREENBREAK11____header_global_5962b71277a38628 = ((((((273) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6adf6f45302ed1b438ad3884() {
  return __cxx_static_address_6adf6f45302ed1b438ad3884.reference || (__cxx_static_address_6adf6f45302ed1b438ad3884.reference = {
    __cReference: true,
    get value() { return SCREENBREAK11____header_global_5962b71277a38628; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:283
export const SCREENBREAK12____header_global_c7a269f259ccc2fb = ((((((274) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_08f5d5823bf0423035a0963d() {
  return __cxx_static_address_08f5d5823bf0423035a0963d.reference || (__cxx_static_address_08f5d5823bf0423035a0963d.reference = {
    __cReference: true,
    get value() { return SCREENBREAK12____header_global_c7a269f259ccc2fb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:284
export const SCREENBREAK13____header_global_b6011c0be83a33d9 = ((((((275) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b91a907e9eb3f899aefa2b6f() {
  return __cxx_static_address_b91a907e9eb3f899aefa2b6f.reference || (__cxx_static_address_b91a907e9eb3f899aefa2b6f.reference = {
    __cReference: true,
    get value() { return SCREENBREAK13____header_global_b6011c0be83a33d9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:285
export const MASKWALL1____header_global_9a3a6f8366f48ef6 = ((((((285) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_703f35d7c9aa0961b75e76a6() {
  return __cxx_static_address_703f35d7c9aa0961b75e76a6.reference || (__cxx_static_address_703f35d7c9aa0961b75e76a6.reference = {
    __cReference: true,
    get value() { return MASKWALL1____header_global_9a3a6f8366f48ef6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:286
export const W_TECHWALL1____header_global_ae4648d3164e3e1c = ((((((293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a0b49cfa4b2c972019b270ff() {
  return __cxx_static_address_a0b49cfa4b2c972019b270ff.reference || (__cxx_static_address_a0b49cfa4b2c972019b270ff.reference = {
    __cReference: true,
    get value() { return W_TECHWALL1____header_global_ae4648d3164e3e1c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:287
export const W_TECHWALL2____header_global_03187c3d34afec9d = ((((((297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1cb838da5d6ad0131cfb4a48() {
  return __cxx_static_address_1cb838da5d6ad0131cfb4a48.reference || (__cxx_static_address_1cb838da5d6ad0131cfb4a48.reference = {
    __cReference: true,
    get value() { return W_TECHWALL2____header_global_03187c3d34afec9d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:288
export const W_TECHWALL15____header_global_2bab8efe09b5c2ca = ((((((299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_67b9eda6a9a6ca848ee86180() {
  return __cxx_static_address_67b9eda6a9a6ca848ee86180.reference || (__cxx_static_address_67b9eda6a9a6ca848ee86180.reference = {
    __cReference: true,
    get value() { return W_TECHWALL15____header_global_2bab8efe09b5c2ca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:289
export const W_TECHWALL3____header_global_ee1ba14b77537a4f = ((((((301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a4a0589bac94815deff69d9e() {
  return __cxx_static_address_a4a0589bac94815deff69d9e.reference || (__cxx_static_address_a4a0589bac94815deff69d9e.reference = {
    __cReference: true,
    get value() { return W_TECHWALL3____header_global_ee1ba14b77537a4f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:290
export const W_TECHWALL4____header_global_bdda58228fa5f4df = ((((((305) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_db7c24abc7e4c06226589cf1() {
  return __cxx_static_address_db7c24abc7e4c06226589cf1.reference || (__cxx_static_address_db7c24abc7e4c06226589cf1.reference = {
    __cReference: true,
    get value() { return W_TECHWALL4____header_global_bdda58228fa5f4df; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:291
export const W_TECHWALL10____header_global_f5517c5bcabf9f9a = ((((((306) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_60abf3d81e41437fc5fe62f6() {
  return __cxx_static_address_60abf3d81e41437fc5fe62f6.reference || (__cxx_static_address_60abf3d81e41437fc5fe62f6.reference = {
    __cReference: true,
    get value() { return W_TECHWALL10____header_global_f5517c5bcabf9f9a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:292
export const W_TECHWALL16____header_global_e043bef3d7260852 = ((((((307) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_52dac3c45c8660a54ec8734b() {
  return __cxx_static_address_52dac3c45c8660a54ec8734b.reference || (__cxx_static_address_52dac3c45c8660a54ec8734b.reference = {
    __cReference: true,
    get value() { return W_TECHWALL16____header_global_e043bef3d7260852; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:293
export const WATERTILE2____header_global_723421b56e8a07fb = ((((((336) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7a4512b889b4d77bb60a88c7() {
  return __cxx_static_address_7a4512b889b4d77bb60a88c7.reference || (__cxx_static_address_7a4512b889b4d77bb60a88c7.reference = {
    __cReference: true,
    get value() { return WATERTILE2____header_global_723421b56e8a07fb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:294
export const BPANNEL1____header_global_7b260e503d581204 = ((((((341) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e751754c6ca2b45cbfaf483a() {
  return __cxx_static_address_e751754c6ca2b45cbfaf483a.reference || (__cxx_static_address_e751754c6ca2b45cbfaf483a.reference = {
    __cReference: true,
    get value() { return BPANNEL1____header_global_7b260e503d581204; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:295
export const PANNEL1____header_global_d401f40c7cdf36bf = ((((((342) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_95fccb52afa3eba0509e8c4b() {
  return __cxx_static_address_95fccb52afa3eba0509e8c4b.reference || (__cxx_static_address_95fccb52afa3eba0509e8c4b.reference = {
    __cReference: true,
    get value() { return PANNEL1____header_global_d401f40c7cdf36bf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:296
export const PANNEL2____header_global_79798d74709bb587 = ((((((343) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f0a5d181d662f134baf9ef2b() {
  return __cxx_static_address_f0a5d181d662f134baf9ef2b.reference || (__cxx_static_address_f0a5d181d662f134baf9ef2b.reference = {
    __cReference: true,
    get value() { return PANNEL2____header_global_79798d74709bb587; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:297
export const STATIC____header_global_9936e4664b9dca57 = ((((((351) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b8c3f1275864053c4fb2289f() {
  return __cxx_static_address_b8c3f1275864053c4fb2289f.reference || (__cxx_static_address_b8c3f1275864053c4fb2289f.reference = {
    __cReference: true,
    get value() { return STATIC____header_global_9936e4664b9dca57; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:298
export const W_SCREENBREAK____header_global_db15e8584b4848ed = ((((((357) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c69744a88f9d1ac703cd04b6() {
  return __cxx_static_address_c69744a88f9d1ac703cd04b6.reference || (__cxx_static_address_c69744a88f9d1ac703cd04b6.reference = {
    __cReference: true,
    get value() { return W_SCREENBREAK____header_global_db15e8584b4848ed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:299
export const W_HITTECHWALL3____header_global_fd10c10992536190 = ((((((360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2c00deaefd3f327e6eec7be1() {
  return __cxx_static_address_2c00deaefd3f327e6eec7be1.reference || (__cxx_static_address_2c00deaefd3f327e6eec7be1.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL3____header_global_fd10c10992536190; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:300
export const W_HITTECHWALL4____header_global_dc46aab01d511207 = ((((((361) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2d536a7c7ecfd93745fe638d() {
  return __cxx_static_address_2d536a7c7ecfd93745fe638d.reference || (__cxx_static_address_2d536a7c7ecfd93745fe638d.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL4____header_global_dc46aab01d511207; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:301
export const W_HITTECHWALL2____header_global_06bfcbb0eeae9dae = ((((((362) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_507f20fcbceffad6a15efd10() {
  return __cxx_static_address_507f20fcbceffad6a15efd10.reference || (__cxx_static_address_507f20fcbceffad6a15efd10.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL2____header_global_06bfcbb0eeae9dae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:302
export const W_HITTECHWALL1____header_global_920e88f76324aa80 = ((((((363) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_82dd48ab13312e0f407b34f0() {
  return __cxx_static_address_82dd48ab13312e0f407b34f0.reference || (__cxx_static_address_82dd48ab13312e0f407b34f0.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL1____header_global_920e88f76324aa80; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:303
export const MASKWALL10____header_global_b4bf491160c7d884 = ((((((387) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_db481e7e952e7b165920fa59() {
  return __cxx_static_address_db481e7e952e7b165920fa59.reference || (__cxx_static_address_db481e7e952e7b165920fa59.reference = {
    __cReference: true,
    get value() { return MASKWALL10____header_global_b4bf491160c7d884; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:304
export const MASKWALL11____header_global_010996c30d48d1dd = ((((((391) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c278b62306055a5f1e4440ea() {
  return __cxx_static_address_c278b62306055a5f1e4440ea.reference || (__cxx_static_address_c278b62306055a5f1e4440ea.reference = {
    __cReference: true,
    get value() { return MASKWALL11____header_global_010996c30d48d1dd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:305
export const DOORTILE22____header_global_82dcf8d383633762 = ((((((395) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a7d64d1f0268b804012430b4() {
  return __cxx_static_address_a7d64d1f0268b804012430b4.reference || (__cxx_static_address_a7d64d1f0268b804012430b4.reference = {
    __cReference: true,
    get value() { return DOORTILE22____header_global_82dcf8d383633762; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:306
export const FANSPRITE____header_global_b8c534a952c9f9ce = ((((((407) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0b2770e804621353aa49df76() {
  return __cxx_static_address_0b2770e804621353aa49df76.reference || (__cxx_static_address_0b2770e804621353aa49df76.reference = {
    __cReference: true,
    get value() { return FANSPRITE____header_global_b8c534a952c9f9ce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:307
export const FANSPRITEBROKE____header_global_712a253b60994e85 = ((((((411) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dbf5271d23a6cf41f7212a69() {
  return __cxx_static_address_dbf5271d23a6cf41f7212a69.reference || (__cxx_static_address_dbf5271d23a6cf41f7212a69.reference = {
    __cReference: true,
    get value() { return FANSPRITEBROKE____header_global_712a253b60994e85; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:308
export const FANSHADOW____header_global_369b9739ebec79ea = ((((((412) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7dc8ee73e180bab61451e4ff() {
  return __cxx_static_address_7dc8ee73e180bab61451e4ff.reference || (__cxx_static_address_7dc8ee73e180bab61451e4ff.reference = {
    __cReference: true,
    get value() { return FANSHADOW____header_global_369b9739ebec79ea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:309
export const FANSHADOWBROKE____header_global_5dbd9aef8d049dbd = ((((((416) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_822b68d3835aa2bf16d5ba2d() {
  return __cxx_static_address_822b68d3835aa2bf16d5ba2d.reference || (__cxx_static_address_822b68d3835aa2bf16d5ba2d.reference = {
    __cReference: true,
    get value() { return FANSHADOWBROKE____header_global_5dbd9aef8d049dbd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:310
export const DOORTILE18____header_global_758c015f89bf3433 = ((((((447) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_30bf6e6b6ffa9806e0a26fc3() {
  return __cxx_static_address_30bf6e6b6ffa9806e0a26fc3.reference || (__cxx_static_address_30bf6e6b6ffa9806e0a26fc3.reference = {
    __cReference: true,
    get value() { return DOORTILE18____header_global_758c015f89bf3433; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:311
export const DOORTILE19____header_global_c63f61cf00906ba6 = ((((((448) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6cf419538d591a6e36f2801c() {
  return __cxx_static_address_6cf419538d591a6e36f2801c.reference || (__cxx_static_address_6cf419538d591a6e36f2801c.reference = {
    __cReference: true,
    get value() { return DOORTILE19____header_global_c63f61cf00906ba6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:312
export const DOORTILE20____header_global_98b3e72ed0f9fcae = ((((((449) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b20a071e4b1012d7a92f65fc() {
  return __cxx_static_address_b20a071e4b1012d7a92f65fc.reference || (__cxx_static_address_b20a071e4b1012d7a92f65fc.reference = {
    __cReference: true,
    get value() { return DOORTILE20____header_global_98b3e72ed0f9fcae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:313
export const VIEWSCREEN2____header_global_b8b1ad0d382fc844 = ((((((499) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2461a4f95452743a8cb6c9de() {
  return __cxx_static_address_2461a4f95452743a8cb6c9de.reference || (__cxx_static_address_2461a4f95452743a8cb6c9de.reference = {
    __cReference: true,
    get value() { return VIEWSCREEN2____header_global_b8b1ad0d382fc844; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:314
export const VIEWSCREEN____header_global_b67a9b435c2380a6 = ((((((502) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_368e5591d511c5f0819c58ee() {
  return __cxx_static_address_368e5591d511c5f0819c58ee.reference || (__cxx_static_address_368e5591d511c5f0819c58ee.reference = {
    __cReference: true,
    get value() { return VIEWSCREEN____header_global_b67a9b435c2380a6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:315
export const GLASS____header_global_c3c680f01d3768bc = ((((((503) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a8bf32faffb2038694c46e6b() {
  return __cxx_static_address_a8bf32faffb2038694c46e6b.reference || (__cxx_static_address_a8bf32faffb2038694c46e6b.reference = {
    __cReference: true,
    get value() { return GLASS____header_global_c3c680f01d3768bc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:316
export const GLASS2____header_global_fa244ad2b572150c = ((((((504) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_52bc291ddc95ff8a924f772d() {
  return __cxx_static_address_52bc291ddc95ff8a924f772d.reference || (__cxx_static_address_52bc291ddc95ff8a924f772d.reference = {
    __cReference: true,
    get value() { return GLASS2____header_global_fa244ad2b572150c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:317
export const STAINGLASS1____header_global_9569310b76d5b554 = ((((((510) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_69516c8ad5f0b0afc8de4178() {
  return __cxx_static_address_69516c8ad5f0b0afc8de4178.reference || (__cxx_static_address_69516c8ad5f0b0afc8de4178.reference = {
    __cReference: true,
    get value() { return STAINGLASS1____header_global_9569310b76d5b554; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:318
export const MASKWALL5____header_global_49b925b26b63d0de = ((((((514) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a39808f532269ac7b26a8eb6() {
  return __cxx_static_address_a39808f532269ac7b26a8eb6.reference || (__cxx_static_address_a39808f532269ac7b26a8eb6.reference = {
    __cReference: true,
    get value() { return MASKWALL5____header_global_49b925b26b63d0de; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:319
export const SATELITE____header_global_20ca4bbcfc8463b7 = ((((((516) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a60970714ae6800256662840() {
  return __cxx_static_address_a60970714ae6800256662840.reference || (__cxx_static_address_a60970714ae6800256662840.reference = {
    __cReference: true,
    get value() { return SATELITE____header_global_20ca4bbcfc8463b7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:320
export const FUELPOD____header_global_68995ef43a5767b6 = ((((((517) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_18f8ddd58e5d97700c8c375f() {
  return __cxx_static_address_18f8ddd58e5d97700c8c375f.reference || (__cxx_static_address_18f8ddd58e5d97700c8c375f.reference = {
    __cReference: true,
    get value() { return FUELPOD____header_global_68995ef43a5767b6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:321
export const CRACK1____header_global_4b7bd7e169f05e79 = ((((((546) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b9803445a296526ad85a185d() {
  return __cxx_static_address_b9803445a296526ad85a185d.reference || (__cxx_static_address_b9803445a296526ad85a185d.reference = {
    __cReference: true,
    get value() { return CRACK1____header_global_4b7bd7e169f05e79; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:322
export const CRACK2____header_global_1af4909db3a74b4e = ((((((547) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_24eb704513e8bd2512361305() {
  return __cxx_static_address_24eb704513e8bd2512361305.reference || (__cxx_static_address_24eb704513e8bd2512361305.reference = {
    __cReference: true,
    get value() { return CRACK2____header_global_1af4909db3a74b4e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:323
export const CRACK3____header_global_7a9564308a0823e7 = ((((((548) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f438b4774e1d47030a872639() {
  return __cxx_static_address_f438b4774e1d47030a872639.reference || (__cxx_static_address_f438b4774e1d47030a872639.reference = {
    __cReference: true,
    get value() { return CRACK3____header_global_7a9564308a0823e7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:324
export const CRACK4____header_global_506479476dda9790 = ((((((549) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6639509d27fdd844bb3477bc() {
  return __cxx_static_address_6639509d27fdd844bb3477bc.reference || (__cxx_static_address_6639509d27fdd844bb3477bc.reference = {
    __cReference: true,
    get value() { return CRACK4____header_global_506479476dda9790; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:325
export const FOOTPRINTS____header_global_7a31f0903f49887e = ((((((550) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c11be4f6e70c43c2198c0540() {
  return __cxx_static_address_c11be4f6e70c43c2198c0540.reference || (__cxx_static_address_c11be4f6e70c43c2198c0540.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS____header_global_7a31f0903f49887e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:326
export const DOMELITE____header_global_0737cb36a7dea4d9 = ((((((551) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c13dbce7312a4b6e4db6eb42() {
  return __cxx_static_address_c13dbce7312a4b6e4db6eb42.reference || (__cxx_static_address_c13dbce7312a4b6e4db6eb42.reference = {
    __cReference: true,
    get value() { return DOMELITE____header_global_0737cb36a7dea4d9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:327
export const CAMERAPOLE____header_global_3586e3f0a5d5acb6 = ((((((554) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_834621853620c1dbe593f7f1() {
  return __cxx_static_address_834621853620c1dbe593f7f1.reference || (__cxx_static_address_834621853620c1dbe593f7f1.reference = {
    __cReference: true,
    get value() { return CAMERAPOLE____header_global_3586e3f0a5d5acb6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:328
export const CHAIR1____header_global_63b95a247f5b0abd = ((((((556) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_747c6b03924b4aaf20eab55c() {
  return __cxx_static_address_747c6b03924b4aaf20eab55c.reference || (__cxx_static_address_747c6b03924b4aaf20eab55c.reference = {
    __cReference: true,
    get value() { return CHAIR1____header_global_63b95a247f5b0abd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:329
export const CHAIR2____header_global_d075d43b02a51900 = ((((((557) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8f31bbad0a27c23029698550() {
  return __cxx_static_address_8f31bbad0a27c23029698550.reference || (__cxx_static_address_8f31bbad0a27c23029698550.reference = {
    __cReference: true,
    get value() { return CHAIR2____header_global_d075d43b02a51900; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:330
export const BROKENCHAIR____header_global_e0ce2b365edc255c = ((((((559) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1c374f77e1807ce566d04b04() {
  return __cxx_static_address_1c374f77e1807ce566d04b04.reference || (__cxx_static_address_1c374f77e1807ce566d04b04.reference = {
    __cReference: true,
    get value() { return BROKENCHAIR____header_global_e0ce2b365edc255c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:331
export const MIRROR____header_global_d9aa77d358325445 = ((((((560) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_21fe65fadde58d9620e109cb() {
  return __cxx_static_address_21fe65fadde58d9620e109cb.reference || (__cxx_static_address_21fe65fadde58d9620e109cb.reference = {
    __cReference: true,
    get value() { return MIRROR____header_global_d9aa77d358325445; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:332
export const WATERFOUNTAIN____header_global_e0443c990751730a = ((((((563) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_74d5ece75b603f8e0c76e585() {
  return __cxx_static_address_74d5ece75b603f8e0c76e585.reference || (__cxx_static_address_74d5ece75b603f8e0c76e585.reference = {
    __cReference: true,
    get value() { return WATERFOUNTAIN____header_global_e0443c990751730a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:333
export const WATERFOUNTAINBROKE____header_global_c39fc2bd3f1bee48 = ((((((567) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c7ed9e5f9d908f1fc082b31a() {
  return __cxx_static_address_c7ed9e5f9d908f1fc082b31a.reference || (__cxx_static_address_c7ed9e5f9d908f1fc082b31a.reference = {
    __cReference: true,
    get value() { return WATERFOUNTAINBROKE____header_global_c39fc2bd3f1bee48; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:334
export const FEMMAG1____header_global_b48b127302bb12af = ((((((568) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_df47c868520171aa960cda6b() {
  return __cxx_static_address_df47c868520171aa960cda6b.reference || (__cxx_static_address_df47c868520171aa960cda6b.reference = {
    __cReference: true,
    get value() { return FEMMAG1____header_global_b48b127302bb12af; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:335
export const TOILET____header_global_7713e752633f932a = ((((((569) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e260e14641e190e84308b801() {
  return __cxx_static_address_e260e14641e190e84308b801.reference || (__cxx_static_address_e260e14641e190e84308b801.reference = {
    __cReference: true,
    get value() { return TOILET____header_global_7713e752633f932a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:336
export const STALL____header_global_a68f362dbd28398e = ((((((571) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b9f5e5b499e2c8ccf36968b8() {
  return __cxx_static_address_b9f5e5b499e2c8ccf36968b8.reference || (__cxx_static_address_b9f5e5b499e2c8ccf36968b8.reference = {
    __cReference: true,
    get value() { return STALL____header_global_a68f362dbd28398e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:337
export const STALLBROKE____header_global_a4c88d33f3418e41 = ((((((573) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e9caa60f7002eb2c040ebcb() {
  return __cxx_static_address_1e9caa60f7002eb2c040ebcb.reference || (__cxx_static_address_1e9caa60f7002eb2c040ebcb.reference = {
    __cReference: true,
    get value() { return STALLBROKE____header_global_a4c88d33f3418e41; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:338
export const FEMMAG2____header_global_ed011da90e5d28e1 = ((((((577) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0dc5232084582617ccf2d2df() {
  return __cxx_static_address_0dc5232084582617ccf2d2df.reference || (__cxx_static_address_0dc5232084582617ccf2d2df.reference = {
    __cReference: true,
    get value() { return FEMMAG2____header_global_ed011da90e5d28e1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:339
export const REACTOR2____header_global_5a51479d339f1fa5 = ((((((578) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6659344b2af5e428da231a3b() {
  return __cxx_static_address_6659344b2af5e428da231a3b.reference || (__cxx_static_address_6659344b2af5e428da231a3b.reference = {
    __cReference: true,
    get value() { return REACTOR2____header_global_5a51479d339f1fa5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:340
export const REACTOR2BURNT____header_global_cceac0769acaec7a = ((((((579) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dbc6037d02610e2c3145a583() {
  return __cxx_static_address_dbc6037d02610e2c3145a583.reference || (__cxx_static_address_dbc6037d02610e2c3145a583.reference = {
    __cReference: true,
    get value() { return REACTOR2BURNT____header_global_cceac0769acaec7a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:341
export const REACTOR2SPARK____header_global_e8b489bfbaada795 = ((((((580) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6805b4ad6a3aa9f17a91a929() {
  return __cxx_static_address_6805b4ad6a3aa9f17a91a929.reference || (__cxx_static_address_6805b4ad6a3aa9f17a91a929.reference = {
    __cReference: true,
    get value() { return REACTOR2SPARK____header_global_e8b489bfbaada795; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:342
export const GRATE1____header_global_5061e5da0137a9a8 = ((((((595) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fddc1685e0fda82c5934e31c() {
  return __cxx_static_address_fddc1685e0fda82c5934e31c.reference || (__cxx_static_address_fddc1685e0fda82c5934e31c.reference = {
    __cReference: true,
    get value() { return GRATE1____header_global_5061e5da0137a9a8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:343
export const BGRATE1____header_global_5ec7537463c49a2d = ((((((596) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_17fa39a76720155d52a2d00c() {
  return __cxx_static_address_17fa39a76720155d52a2d00c.reference || (__cxx_static_address_17fa39a76720155d52a2d00c.reference = {
    __cReference: true,
    get value() { return BGRATE1____header_global_5ec7537463c49a2d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:344
export const SOLARPANNEL____header_global_fb7a565da5786451 = ((((((602) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fba0a827ff6cee95ee395a1a() {
  return __cxx_static_address_fba0a827ff6cee95ee395a1a.reference || (__cxx_static_address_fba0a827ff6cee95ee395a1a.reference = {
    __cReference: true,
    get value() { return SOLARPANNEL____header_global_fb7a565da5786451; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:345
export const NAKED1____header_global_f147499b0c7a36b9 = ((((((603) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0599fc0a3104d05ab42c13f3() {
  return __cxx_static_address_0599fc0a3104d05ab42c13f3.reference || (__cxx_static_address_0599fc0a3104d05ab42c13f3.reference = {
    __cReference: true,
    get value() { return NAKED1____header_global_f147499b0c7a36b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:346
export const ANTENNA____header_global_efb5b2e6aec4dac6 = ((((((607) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b11767508975cb8652fad2b1() {
  return __cxx_static_address_b11767508975cb8652fad2b1.reference || (__cxx_static_address_b11767508975cb8652fad2b1.reference = {
    __cReference: true,
    get value() { return ANTENNA____header_global_efb5b2e6aec4dac6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:347
export const MASKWALL12____header_global_15671ef31156a37e = ((((((609) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0bbc9246e17cf430c8ca7f6a() {
  return __cxx_static_address_0bbc9246e17cf430c8ca7f6a.reference || (__cxx_static_address_0bbc9246e17cf430c8ca7f6a.reference = {
    __cReference: true,
    get value() { return MASKWALL12____header_global_15671ef31156a37e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:348
export const TOILETBROKE____header_global_cbe9eb2852ce1c49 = ((((((615) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cbd194a27abd4d74b5f41074() {
  return __cxx_static_address_cbd194a27abd4d74b5f41074.reference || (__cxx_static_address_cbd194a27abd4d74b5f41074.reference = {
    __cReference: true,
    get value() { return TOILETBROKE____header_global_cbe9eb2852ce1c49; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:349
export const PIPE2____header_global_f245a5c45a8adcf4 = ((((((616) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7ccbc84efb358d46314dd4e2() {
  return __cxx_static_address_7ccbc84efb358d46314dd4e2.reference || (__cxx_static_address_7ccbc84efb358d46314dd4e2.reference = {
    __cReference: true,
    get value() { return PIPE2____header_global_f245a5c45a8adcf4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:350
export const PIPE1B____header_global_add50b5356958556 = ((((((617) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3e3fef618e25fccde10654ff() {
  return __cxx_static_address_3e3fef618e25fccde10654ff.reference || (__cxx_static_address_3e3fef618e25fccde10654ff.reference = {
    __cReference: true,
    get value() { return PIPE1B____header_global_add50b5356958556; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:351
export const PIPE3____header_global_f73c1898db38daac = ((((((618) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dde3d67129d88b326464832f() {
  return __cxx_static_address_dde3d67129d88b326464832f.reference || (__cxx_static_address_dde3d67129d88b326464832f.reference = {
    __cReference: true,
    get value() { return PIPE3____header_global_f73c1898db38daac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:352
export const PIPE1____header_global_6927ea592278dbe7 = ((((((619) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ba9bba49ff203e09f0a8df22() {
  return __cxx_static_address_ba9bba49ff203e09f0a8df22.reference || (__cxx_static_address_ba9bba49ff203e09f0a8df22.reference = {
    __cReference: true,
    get value() { return PIPE1____header_global_6927ea592278dbe7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:353
export const CAMERA1____header_global_ec9b3352c484c133 = ((((((621) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_176ed843103e4fabdc8f3a0b() {
  return __cxx_static_address_176ed843103e4fabdc8f3a0b.reference || (__cxx_static_address_176ed843103e4fabdc8f3a0b.reference = {
    __cReference: true,
    get value() { return CAMERA1____header_global_ec9b3352c484c133; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:354
export const PIPE2B____header_global_9fbee0903a827e22 = ((((((633) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1622a47c14e7170b2894f8ca() {
  return __cxx_static_address_1622a47c14e7170b2894f8ca.reference || (__cxx_static_address_1622a47c14e7170b2894f8ca.reference = {
    __cReference: true,
    get value() { return PIPE2B____header_global_9fbee0903a827e22; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:355
export const BOLT1____header_global_3721e3e086f987e5 = ((((((634) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0e0ce4586a441984fab45714() {
  return __cxx_static_address_0e0ce4586a441984fab45714.reference || (__cxx_static_address_0e0ce4586a441984fab45714.reference = {
    __cReference: true,
    get value() { return BOLT1____header_global_3721e3e086f987e5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:356
export const W_NUMBERS____header_global_b8f5af988dee6a1b = ((((((640) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a27d5f2b4cbe7c1d9cdc751c() {
  return __cxx_static_address_a27d5f2b4cbe7c1d9cdc751c.reference || (__cxx_static_address_a27d5f2b4cbe7c1d9cdc751c.reference = {
    __cReference: true,
    get value() { return W_NUMBERS____header_global_b8f5af988dee6a1b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:357
export const WATERDRIP____header_global_9746bf83fd8b5850 = ((((((660) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2dc5de35453464d40c7012ba() {
  return __cxx_static_address_2dc5de35453464d40c7012ba.reference || (__cxx_static_address_2dc5de35453464d40c7012ba.reference = {
    __cReference: true,
    get value() { return WATERDRIP____header_global_9746bf83fd8b5850; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:358
export const WATERBUBBLE____header_global_40e57fd795a7006b = ((((((661) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8988d15f3c8f1f0fc488f38a() {
  return __cxx_static_address_8988d15f3c8f1f0fc488f38a.reference || (__cxx_static_address_8988d15f3c8f1f0fc488f38a.reference = {
    __cReference: true,
    get value() { return WATERBUBBLE____header_global_40e57fd795a7006b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:359
export const WATERBUBBLEMAKER____header_global_2efe1affe4d2d185 = ((((((662) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d108f2574982c61298e87b88() {
  return __cxx_static_address_d108f2574982c61298e87b88.reference || (__cxx_static_address_d108f2574982c61298e87b88.reference = {
    __cReference: true,
    get value() { return WATERBUBBLEMAKER____header_global_2efe1affe4d2d185; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:360
export const W_FORCEFIELD____header_global_7d68fdc0b91c0b8e = ((((((663) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3f30f94d542d2553ddd51b0a() {
  return __cxx_static_address_3f30f94d542d2553ddd51b0a.reference || (__cxx_static_address_3f30f94d542d2553ddd51b0a.reference = {
    __cReference: true,
    get value() { return W_FORCEFIELD____header_global_7d68fdc0b91c0b8e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:361
export const VACUUM____header_global_3fa89d7d64cbebc0 = ((((((669) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_05833e93aa451080d48033d4() {
  return __cxx_static_address_05833e93aa451080d48033d4.reference || (__cxx_static_address_05833e93aa451080d48033d4.reference = {
    __cReference: true,
    get value() { return VACUUM____header_global_3fa89d7d64cbebc0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:362
export const FOOTPRINTS2____header_global_a62f998691ddc5fb = ((((((672) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7976ce80f0e6aca677213cff() {
  return __cxx_static_address_7976ce80f0e6aca677213cff.reference || (__cxx_static_address_7976ce80f0e6aca677213cff.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS2____header_global_a62f998691ddc5fb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:363
export const FOOTPRINTS3____header_global_04a6478f0968da96 = ((((((673) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_be271fe7cf7758da2073949f() {
  return __cxx_static_address_be271fe7cf7758da2073949f.reference || (__cxx_static_address_be271fe7cf7758da2073949f.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS3____header_global_04a6478f0968da96; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:364
export const FOOTPRINTS4____header_global_8636986125d88816 = ((((((674) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a37736bfd26f49bc044b48ea() {
  return __cxx_static_address_a37736bfd26f49bc044b48ea.reference || (__cxx_static_address_a37736bfd26f49bc044b48ea.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS4____header_global_8636986125d88816; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:365
export const EGG____header_global_a06720fb6a0bb686 = ((((((675) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e0b6fb12c7e79f9556738a11() {
  return __cxx_static_address_e0b6fb12c7e79f9556738a11.reference || (__cxx_static_address_e0b6fb12c7e79f9556738a11.reference = {
    __cReference: true,
    get value() { return EGG____header_global_a06720fb6a0bb686; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:366
export const SCALE____header_global_0d18bfca02ebe63a = ((((((678) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_752a1272f249c1a415626ec6() {
  return __cxx_static_address_752a1272f249c1a415626ec6.reference || (__cxx_static_address_752a1272f249c1a415626ec6.reference = {
    __cReference: true,
    get value() { return SCALE____header_global_0d18bfca02ebe63a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:367
export const CHAIR3____header_global_49a886c216aa9846 = ((((((680) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a5cf834708bc7642a94b43b5() {
  return __cxx_static_address_a5cf834708bc7642a94b43b5.reference || (__cxx_static_address_a5cf834708bc7642a94b43b5.reference = {
    __cReference: true,
    get value() { return CHAIR3____header_global_49a886c216aa9846; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:368
export const CAMERALIGHT____header_global_e0dcb57285ccdd02 = ((((((685) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_793e5454c00bb871dae5a779() {
  return __cxx_static_address_793e5454c00bb871dae5a779.reference || (__cxx_static_address_793e5454c00bb871dae5a779.reference = {
    __cReference: true,
    get value() { return CAMERALIGHT____header_global_e0dcb57285ccdd02; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:369
export const MOVIECAMERA____header_global_e85bd764f0160dc6 = ((((((686) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_16e329e16fee923bcc3a74fe() {
  return __cxx_static_address_16e329e16fee923bcc3a74fe.reference || (__cxx_static_address_16e329e16fee923bcc3a74fe.reference = {
    __cReference: true,
    get value() { return MOVIECAMERA____header_global_e85bd764f0160dc6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:370
export const IVUNIT____header_global_868987ec25962c7a = ((((((689) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_afcdab0b340f32cfcf3cf2ba() {
  return __cxx_static_address_afcdab0b340f32cfcf3cf2ba.reference || (__cxx_static_address_afcdab0b340f32cfcf3cf2ba.reference = {
    __cReference: true,
    get value() { return IVUNIT____header_global_868987ec25962c7a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:371
export const POT1____header_global_67286a74e821b8c3 = ((((((694) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_feb5c1a51180b4d2c5cb5aaa() {
  return __cxx_static_address_feb5c1a51180b4d2c5cb5aaa.reference || (__cxx_static_address_feb5c1a51180b4d2c5cb5aaa.reference = {
    __cReference: true,
    get value() { return POT1____header_global_67286a74e821b8c3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:372
export const POT2____header_global_7947c66e7dcd4b77 = ((((((695) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_799f4f923e43190140e82062() {
  return __cxx_static_address_799f4f923e43190140e82062.reference || (__cxx_static_address_799f4f923e43190140e82062.reference = {
    __cReference: true,
    get value() { return POT2____header_global_7947c66e7dcd4b77; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:373
export const POT3____header_global_3ce29461a21bd0c9 = ((((((697) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_799fc2f87d1546e1f65ce003() {
  return __cxx_static_address_799fc2f87d1546e1f65ce003.reference || (__cxx_static_address_799fc2f87d1546e1f65ce003.reference = {
    __cReference: true,
    get value() { return POT3____header_global_3ce29461a21bd0c9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:374
export const PIPE3B____header_global_771184f417a23e83 = ((((((700) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_62c09a60f85de833cd8ddea9() {
  return __cxx_static_address_62c09a60f85de833cd8ddea9.reference || (__cxx_static_address_62c09a60f85de833cd8ddea9.reference = {
    __cReference: true,
    get value() { return PIPE3B____header_global_771184f417a23e83; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:375
export const WALLLIGHT3____header_global_524baca57a1f9823 = ((((((701) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_99d7825d1ae405565a0f7043() {
  return __cxx_static_address_99d7825d1ae405565a0f7043.reference || (__cxx_static_address_99d7825d1ae405565a0f7043.reference = {
    __cReference: true,
    get value() { return WALLLIGHT3____header_global_524baca57a1f9823; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:376
export const WALLLIGHTBUST3____header_global_e7211f775792db47 = ((((((702) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5385857d6c72e524872e0a83() {
  return __cxx_static_address_5385857d6c72e524872e0a83.reference || (__cxx_static_address_5385857d6c72e524872e0a83.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST3____header_global_e7211f775792db47; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:377
export const WALLLIGHT1____header_global_8b3ebe7eaaea1b4d = ((((((703) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1cc1004ffe4505433ef06a92() {
  return __cxx_static_address_1cc1004ffe4505433ef06a92.reference || (__cxx_static_address_1cc1004ffe4505433ef06a92.reference = {
    __cReference: true,
    get value() { return WALLLIGHT1____header_global_8b3ebe7eaaea1b4d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:378
export const WALLLIGHTBUST1____header_global_0f454c71b45b6fba = ((((((704) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_258a3fd8e5e7427f42782eee() {
  return __cxx_static_address_258a3fd8e5e7427f42782eee.reference || (__cxx_static_address_258a3fd8e5e7427f42782eee.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST1____header_global_0f454c71b45b6fba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:379
export const WALLLIGHT2____header_global_dead3daea5cce0c5 = ((((((705) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_78e02973ed82facadfa26999() {
  return __cxx_static_address_78e02973ed82facadfa26999.reference || (__cxx_static_address_78e02973ed82facadfa26999.reference = {
    __cReference: true,
    get value() { return WALLLIGHT2____header_global_dead3daea5cce0c5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:380
export const WALLLIGHTBUST2____header_global_bbc500b00965740c = ((((((706) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_315697d50486600d6aee4e8b() {
  return __cxx_static_address_315697d50486600d6aee4e8b.reference || (__cxx_static_address_315697d50486600d6aee4e8b.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST2____header_global_bbc500b00965740c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:381
export const LIGHTSWITCH2____header_global_70599575a7e851f0 = ((((((712) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c939b1d692c5817ac609a0f6() {
  return __cxx_static_address_c939b1d692c5817ac609a0f6.reference || (__cxx_static_address_c939b1d692c5817ac609a0f6.reference = {
    __cReference: true,
    get value() { return LIGHTSWITCH2____header_global_70599575a7e851f0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:382
export const WAITTOBESEATED____header_global_b26dd94ef511e0c2 = ((((((716) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dee7ab98808e0b0b0e68011b() {
  return __cxx_static_address_dee7ab98808e0b0b0e68011b.reference || (__cxx_static_address_dee7ab98808e0b0b0e68011b.reference = {
    __cReference: true,
    get value() { return WAITTOBESEATED____header_global_b26dd94ef511e0c2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:383
export const DOORTILE14____header_global_734c5268dd210901 = ((((((717) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e8c04ae06672af6a8f9a364f() {
  return __cxx_static_address_e8c04ae06672af6a8f9a364f.reference || (__cxx_static_address_e8c04ae06672af6a8f9a364f.reference = {
    __cReference: true,
    get value() { return DOORTILE14____header_global_734c5268dd210901; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:384
export const STATUE____header_global_826458938cce9f61 = ((((((753) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c93233fc9909db77f0de2a07() {
  return __cxx_static_address_c93233fc9909db77f0de2a07.reference || (__cxx_static_address_c93233fc9909db77f0de2a07.reference = {
    __cReference: true,
    get value() { return STATUE____header_global_826458938cce9f61; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:385
export const MIKE____header_global_c86ec2ed85b9248e = ((((((762) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_685f0bdeb5b1cbadba2e63ba() {
  return __cxx_static_address_685f0bdeb5b1cbadba2e63ba.reference || (__cxx_static_address_685f0bdeb5b1cbadba2e63ba.reference = {
    __cReference: true,
    get value() { return MIKE____header_global_c86ec2ed85b9248e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:386
export const VASE____header_global_9ce07401d3e19038 = ((((((765) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_841aea66e606e2fac63e1581() {
  return __cxx_static_address_841aea66e606e2fac63e1581.reference || (__cxx_static_address_841aea66e606e2fac63e1581.reference = {
    __cReference: true,
    get value() { return VASE____header_global_9ce07401d3e19038; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:387
export const SUSHIPLATE1____header_global_373a463e8f67c770 = ((((((768) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_824e90b3ea97d5676ebfbc39() {
  return __cxx_static_address_824e90b3ea97d5676ebfbc39.reference || (__cxx_static_address_824e90b3ea97d5676ebfbc39.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE1____header_global_373a463e8f67c770; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:388
export const SUSHIPLATE2____header_global_50b1c3fa17865e90 = ((((((769) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e3ea695ef3ca9dd405a42b17() {
  return __cxx_static_address_e3ea695ef3ca9dd405a42b17.reference || (__cxx_static_address_e3ea695ef3ca9dd405a42b17.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE2____header_global_50b1c3fa17865e90; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:389
export const SUSHIPLATE3____header_global_f1a19dee718f9c33 = ((((((774) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_24bd0211ca677e54ff400c7b() {
  return __cxx_static_address_24bd0211ca677e54ff400c7b.reference || (__cxx_static_address_24bd0211ca677e54ff400c7b.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE3____header_global_f1a19dee718f9c33; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:390
export const SUSHIPLATE4____header_global_1a355a426a9b8655 = ((((((779) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fd360381092c2e833ad02051() {
  return __cxx_static_address_fd360381092c2e833ad02051.reference || (__cxx_static_address_fd360381092c2e833ad02051.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE4____header_global_1a355a426a9b8655; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:391
export const DOORTILE16____header_global_ad2a0b4a2fbeaa3e = ((((((781) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_51ce46b2f26aa86ac74d3900() {
  return __cxx_static_address_51ce46b2f26aa86ac74d3900.reference || (__cxx_static_address_51ce46b2f26aa86ac74d3900.reference = {
    __cReference: true,
    get value() { return DOORTILE16____header_global_ad2a0b4a2fbeaa3e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:392
export const SUSHIPLATE5____header_global_b44313e3ef9b85a1 = ((((((792) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_75d9f0e935d572ec6a69f3b2() {
  return __cxx_static_address_75d9f0e935d572ec6a69f3b2.reference || (__cxx_static_address_75d9f0e935d572ec6a69f3b2.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE5____header_global_b44313e3ef9b85a1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:393
export const OJ____header_global_27ed39b1d87a29f9 = ((((((806) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b21a82951a3cf8bf74844a8c() {
  return __cxx_static_address_b21a82951a3cf8bf74844a8c.reference || (__cxx_static_address_b21a82951a3cf8bf74844a8c.reference = {
    __cReference: true,
    get value() { return OJ____header_global_27ed39b1d87a29f9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:394
export const MASKWALL13____header_global_0ec5b0831786c40a = ((((((830) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fc70b4f6f874915fb45f7f40() {
  return __cxx_static_address_fc70b4f6f874915fb45f7f40.reference || (__cxx_static_address_fc70b4f6f874915fb45f7f40.reference = {
    __cReference: true,
    get value() { return MASKWALL13____header_global_0ec5b0831786c40a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:395
export const HURTRAIL____header_global_1d4cab6ca44fce9c = ((((((859) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_208c2f940e095d460b6210ee() {
  return __cxx_static_address_208c2f940e095d460b6210ee.reference || (__cxx_static_address_208c2f940e095d460b6210ee.reference = {
    __cReference: true,
    get value() { return HURTRAIL____header_global_1d4cab6ca44fce9c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:396
export const POWERSWITCH1____header_global_78d65378a5d93e92 = ((((((860) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b7297308f184cee2bb115a97() {
  return __cxx_static_address_b7297308f184cee2bb115a97.reference || (__cxx_static_address_b7297308f184cee2bb115a97.reference = {
    __cReference: true,
    get value() { return POWERSWITCH1____header_global_78d65378a5d93e92; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:397
export const LOCKSWITCH1____header_global_98ef989b5206ec21 = ((((((862) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_12616738f5cb5be0d802540a() {
  return __cxx_static_address_12616738f5cb5be0d802540a.reference || (__cxx_static_address_12616738f5cb5be0d802540a.reference = {
    __cReference: true,
    get value() { return LOCKSWITCH1____header_global_98ef989b5206ec21; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:398
export const POWERSWITCH2____header_global_56302492806cd589 = ((((((864) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_83bc7b7ba0bbe69276b5a727() {
  return __cxx_static_address_83bc7b7ba0bbe69276b5a727.reference || (__cxx_static_address_83bc7b7ba0bbe69276b5a727.reference = {
    __cReference: true,
    get value() { return POWERSWITCH2____header_global_56302492806cd589; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:399
export const ATM____header_global_aa75376431915ad3 = ((((((867) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e1c55bbeed151efeea3fd09c() {
  return __cxx_static_address_e1c55bbeed151efeea3fd09c.reference || (__cxx_static_address_e1c55bbeed151efeea3fd09c.reference = {
    __cReference: true,
    get value() { return ATM____header_global_aa75376431915ad3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:400
export const STATUEFLASH____header_global_71cb9dccbd42d33a = ((((((869) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_093e8de687662a13e0beabf8() {
  return __cxx_static_address_093e8de687662a13e0beabf8.reference || (__cxx_static_address_093e8de687662a13e0beabf8.reference = {
    __cReference: true,
    get value() { return STATUEFLASH____header_global_71cb9dccbd42d33a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:401
export const ATMBROKE____header_global_d13f9fa470355e86 = ((((((888) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fec3a076e3256c53f7e9cf50() {
  return __cxx_static_address_fec3a076e3256c53f7e9cf50.reference || (__cxx_static_address_fec3a076e3256c53f7e9cf50.reference = {
    __cReference: true,
    get value() { return ATMBROKE____header_global_d13f9fa470355e86; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:402
export const STRIPEBALL____header_global_02c41da0f438db85 = ((((((901) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d2a57aed174148abfc5b2f22() {
  return __cxx_static_address_d2a57aed174148abfc5b2f22.reference || (__cxx_static_address_d2a57aed174148abfc5b2f22.reference = {
    __cReference: true,
    get value() { return STRIPEBALL____header_global_02c41da0f438db85; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:403
export const QUEBALL____header_global_62e92eb4271c419a = ((((((902) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_837daaa786e3256f364e4e03() {
  return __cxx_static_address_837daaa786e3256f364e4e03.reference || (__cxx_static_address_837daaa786e3256f364e4e03.reference = {
    __cReference: true,
    get value() { return QUEBALL____header_global_62e92eb4271c419a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:404
export const POCKET____header_global_ee1e8dd54b9c629a = ((((((903) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6f5cc34896e9dddad764bf0e() {
  return __cxx_static_address_6f5cc34896e9dddad764bf0e.reference || (__cxx_static_address_6f5cc34896e9dddad764bf0e.reference = {
    __cReference: true,
    get value() { return POCKET____header_global_ee1e8dd54b9c629a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:405
export const WOODENHORSE____header_global_92a63c07f43bd68c = ((((((904) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ef3ee61754f5b5c137c873a2() {
  return __cxx_static_address_ef3ee61754f5b5c137c873a2.reference || (__cxx_static_address_ef3ee61754f5b5c137c873a2.reference = {
    __cReference: true,
    get value() { return WOODENHORSE____header_global_92a63c07f43bd68c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:406
export const TREE1____header_global_7664b260178cf4d3 = ((((((908) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d11e11a4b2dd5f51f0670523() {
  return __cxx_static_address_d11e11a4b2dd5f51f0670523.reference || (__cxx_static_address_d11e11a4b2dd5f51f0670523.reference = {
    __cReference: true,
    get value() { return TREE1____header_global_7664b260178cf4d3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:407
export const TREE2____header_global_6735a9434af85a87 = ((((((910) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_67db0390274452bab64123e6() {
  return __cxx_static_address_67db0390274452bab64123e6.reference || (__cxx_static_address_67db0390274452bab64123e6.reference = {
    __cReference: true,
    get value() { return TREE2____header_global_6735a9434af85a87; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:408
export const CACTUS____header_global_53a69fdf0a7c763f = ((((((911) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_efddba5ea9a74fc63d7125ee() {
  return __cxx_static_address_efddba5ea9a74fc63d7125ee.reference || (__cxx_static_address_efddba5ea9a74fc63d7125ee.reference = {
    __cReference: true,
    get value() { return CACTUS____header_global_53a69fdf0a7c763f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:409
export const MASKWALL2____header_global_167d4ac2cd91e039 = ((((((913) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0179409c7150ac111e83992c() {
  return __cxx_static_address_0179409c7150ac111e83992c.reference || (__cxx_static_address_0179409c7150ac111e83992c.reference = {
    __cReference: true,
    get value() { return MASKWALL2____header_global_167d4ac2cd91e039; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:410
export const MASKWALL3____header_global_01f59168b68caa43 = ((((((914) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9935bb4162f9efd8a2702159() {
  return __cxx_static_address_9935bb4162f9efd8a2702159.reference || (__cxx_static_address_9935bb4162f9efd8a2702159.reference = {
    __cReference: true,
    get value() { return MASKWALL3____header_global_01f59168b68caa43; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:411
export const MASKWALL4____header_global_11fdf63519e9440d = ((((((915) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dec87cdd6e257fc852000c1c() {
  return __cxx_static_address_dec87cdd6e257fc852000c1c.reference || (__cxx_static_address_dec87cdd6e257fc852000c1c.reference = {
    __cReference: true,
    get value() { return MASKWALL4____header_global_11fdf63519e9440d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:412
export const FIREEXT____header_global_5df602af85612c73 = ((((((916) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ae177d0cb69276fb682f7bb3() {
  return __cxx_static_address_ae177d0cb69276fb682f7bb3.reference || (__cxx_static_address_ae177d0cb69276fb682f7bb3.reference = {
    __cReference: true,
    get value() { return FIREEXT____header_global_5df602af85612c73; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:413
export const TOILETWATER____header_global_c62fbc3ed35b266f = ((((((921) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7a412fe47c70115822132ed3() {
  return __cxx_static_address_7a412fe47c70115822132ed3.reference || (__cxx_static_address_7a412fe47c70115822132ed3.reference = {
    __cReference: true,
    get value() { return TOILETWATER____header_global_c62fbc3ed35b266f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:414
export const NEON1____header_global_1537e412d646189e = ((((((925) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5e1f5d892d2adfa1a5c8d492() {
  return __cxx_static_address_5e1f5d892d2adfa1a5c8d492.reference || (__cxx_static_address_5e1f5d892d2adfa1a5c8d492.reference = {
    __cReference: true,
    get value() { return NEON1____header_global_1537e412d646189e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:415
export const NEON2____header_global_a2ccd2679474f085 = ((((((926) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bd422694b3e44269c2f6c01f() {
  return __cxx_static_address_bd422694b3e44269c2f6c01f.reference || (__cxx_static_address_bd422694b3e44269c2f6c01f.reference = {
    __cReference: true,
    get value() { return NEON2____header_global_a2ccd2679474f085; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:416
export const CACTUSBROKE____header_global_07a6ea699dc9da17 = ((((((939) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ce940cc334a5414d621c005a() {
  return __cxx_static_address_ce940cc334a5414d621c005a.reference || (__cxx_static_address_ce940cc334a5414d621c005a.reference = {
    __cReference: true,
    get value() { return CACTUSBROKE____header_global_07a6ea699dc9da17; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:417
export const BOUNCEMINE____header_global_72c754c9b646c6c3 = ((((((940) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9d73645c85d3ac62da894214() {
  return __cxx_static_address_9d73645c85d3ac62da894214.reference || (__cxx_static_address_9d73645c85d3ac62da894214.reference = {
    __cReference: true,
    get value() { return BOUNCEMINE____header_global_72c754c9b646c6c3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:418
export const BROKEFIREHYDRENT____header_global_4c42ba40433a14c6 = ((((((950) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_600ba3f1dc84739ea1e92b03() {
  return __cxx_static_address_600ba3f1dc84739ea1e92b03.reference || (__cxx_static_address_600ba3f1dc84739ea1e92b03.reference = {
    __cReference: true,
    get value() { return BROKEFIREHYDRENT____header_global_4c42ba40433a14c6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:419
export const BOX____header_global_58dc0a3b4150fde0 = ((((((951) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fdb529dbad257803799ae0ac() {
  return __cxx_static_address_fdb529dbad257803799ae0ac.reference || (__cxx_static_address_fdb529dbad257803799ae0ac.reference = {
    __cReference: true,
    get value() { return BOX____header_global_58dc0a3b4150fde0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:420
export const BULLETHOLE____header_global_bcf4571ce4d876ca = ((((((952) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_44a2d356645a038c6bf2f750() {
  return __cxx_static_address_44a2d356645a038c6bf2f750.reference || (__cxx_static_address_44a2d356645a038c6bf2f750.reference = {
    __cReference: true,
    get value() { return BULLETHOLE____header_global_bcf4571ce4d876ca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:421
export const BOTTLE1____header_global_eb4b54b280a3bd9b = ((((((954) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6963d0228946f54fa615c80a() {
  return __cxx_static_address_6963d0228946f54fa615c80a.reference || (__cxx_static_address_6963d0228946f54fa615c80a.reference = {
    __cReference: true,
    get value() { return BOTTLE1____header_global_eb4b54b280a3bd9b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:422
export const BOTTLE2____header_global_bb8f38a5f838c3e9 = ((((((955) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eda6b4bb56db81a3af0584f9() {
  return __cxx_static_address_eda6b4bb56db81a3af0584f9.reference || (__cxx_static_address_eda6b4bb56db81a3af0584f9.reference = {
    __cReference: true,
    get value() { return BOTTLE2____header_global_bb8f38a5f838c3e9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:423
export const BOTTLE3____header_global_608e26ad89682b92 = ((((((956) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ba516c84ae02c61b2735ccf7() {
  return __cxx_static_address_ba516c84ae02c61b2735ccf7.reference || (__cxx_static_address_ba516c84ae02c61b2735ccf7.reference = {
    __cReference: true,
    get value() { return BOTTLE3____header_global_608e26ad89682b92; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:424
export const BOTTLE4____header_global_f487dc49e36ac836 = ((((((957) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3b796aca06f9fe0bc5424279() {
  return __cxx_static_address_3b796aca06f9fe0bc5424279.reference || (__cxx_static_address_3b796aca06f9fe0bc5424279.reference = {
    __cReference: true,
    get value() { return BOTTLE4____header_global_f487dc49e36ac836; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:425
export const FEMPIC5____header_global_478b1eb52a92dc2e = ((((((963) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_88d2f486ba219245ed23618c() {
  return __cxx_static_address_88d2f486ba219245ed23618c.reference || (__cxx_static_address_88d2f486ba219245ed23618c.reference = {
    __cReference: true,
    get value() { return FEMPIC5____header_global_478b1eb52a92dc2e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:426
export const FEMPIC6____header_global_31da674de7899e21 = ((((((964) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b92cb327c330d3f99d3d9206() {
  return __cxx_static_address_b92cb327c330d3f99d3d9206.reference || (__cxx_static_address_b92cb327c330d3f99d3d9206.reference = {
    __cReference: true,
    get value() { return FEMPIC6____header_global_31da674de7899e21; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:427
export const FEMPIC7____header_global_09f277f7a646d723 = ((((((965) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d04d571672b243743ac63b6e() {
  return __cxx_static_address_d04d571672b243743ac63b6e.reference || (__cxx_static_address_d04d571672b243743ac63b6e.reference = {
    __cReference: true,
    get value() { return FEMPIC7____header_global_09f277f7a646d723; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:428
export const HYDROPLANT____header_global_73cb5c5a5a920d55 = ((((((969) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9903fcc1fd5dc1e946984b7f() {
  return __cxx_static_address_9903fcc1fd5dc1e946984b7f.reference || (__cxx_static_address_9903fcc1fd5dc1e946984b7f.reference = {
    __cReference: true,
    get value() { return HYDROPLANT____header_global_73cb5c5a5a920d55; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:429
export const OCEANSPRITE1____header_global_4c2a4d7646474e79 = ((((((971) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ae8a35b37370ed3882c689b0() {
  return __cxx_static_address_ae8a35b37370ed3882c689b0.reference || (__cxx_static_address_ae8a35b37370ed3882c689b0.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE1____header_global_4c2a4d7646474e79; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:430
export const OCEANSPRITE2____header_global_8b8597ffc51846f6 = ((((((972) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cf56403a44aede5ac920a958() {
  return __cxx_static_address_cf56403a44aede5ac920a958.reference || (__cxx_static_address_cf56403a44aede5ac920a958.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE2____header_global_8b8597ffc51846f6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:431
export const OCEANSPRITE3____header_global_557b1e74438deb36 = ((((((973) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_105a9dfd7164c3a3d7d7b61e() {
  return __cxx_static_address_105a9dfd7164c3a3d7d7b61e.reference || (__cxx_static_address_105a9dfd7164c3a3d7d7b61e.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE3____header_global_557b1e74438deb36; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:432
export const OCEANSPRITE4____header_global_f84b33c06632a9fb = ((((((974) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2ade6d1d031751ab4e2ab2d2() {
  return __cxx_static_address_2ade6d1d031751ab4e2ab2d2.reference || (__cxx_static_address_2ade6d1d031751ab4e2ab2d2.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE4____header_global_f84b33c06632a9fb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:433
export const OCEANSPRITE5____header_global_6be07eb31dec17c5 = ((((((975) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bd7974f0e225f1aa40767c5c() {
  return __cxx_static_address_bd7974f0e225f1aa40767c5c.reference || (__cxx_static_address_bd7974f0e225f1aa40767c5c.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE5____header_global_6be07eb31dec17c5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:434
export const GENERICPOLE____header_global_965007261bfb8700 = ((((((977) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4a942ad291ec2c3777cde8e9() {
  return __cxx_static_address_4a942ad291ec2c3777cde8e9.reference || (__cxx_static_address_4a942ad291ec2c3777cde8e9.reference = {
    __cReference: true,
    get value() { return GENERICPOLE____header_global_965007261bfb8700; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:435
export const CONE____header_global_bb51b8a9814cf94b = ((((((978) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_04f1b417be29dd63b9d02bea() {
  return __cxx_static_address_04f1b417be29dd63b9d02bea.reference || (__cxx_static_address_04f1b417be29dd63b9d02bea.reference = {
    __cReference: true,
    get value() { return CONE____header_global_bb51b8a9814cf94b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:436
export const HANGLIGHT____header_global_33c8835cabec90d9 = ((((((979) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_51a66529ccd5ccf30925f34b() {
  return __cxx_static_address_51a66529ccd5ccf30925f34b.reference || (__cxx_static_address_51a66529ccd5ccf30925f34b.reference = {
    __cReference: true,
    get value() { return HANGLIGHT____header_global_33c8835cabec90d9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:437
export const HYDRENT____header_global_b1634c66caedd725 = ((((((981) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e40d896fe22e934c890cfdab() {
  return __cxx_static_address_e40d896fe22e934c890cfdab.reference || (__cxx_static_address_e40d896fe22e934c890cfdab.reference = {
    __cReference: true,
    get value() { return HYDRENT____header_global_b1634c66caedd725; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:438
export const MASKWALL14____header_global_c704d58cb8e37225 = ((((((988) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_92d25c982315027d10d6cbde() {
  return __cxx_static_address_92d25c982315027d10d6cbde.reference || (__cxx_static_address_92d25c982315027d10d6cbde.reference = {
    __cReference: true,
    get value() { return MASKWALL14____header_global_c704d58cb8e37225; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:439
export const TIRE____header_global_2deaa0c83abcae64 = ((((((990) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_24ea9a902431748dca297b91() {
  return __cxx_static_address_24ea9a902431748dca297b91.reference || (__cxx_static_address_24ea9a902431748dca297b91.reference = {
    __cReference: true,
    get value() { return TIRE____header_global_2deaa0c83abcae64; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:440
export const PIPE5____header_global_ac6276666382f311 = ((((((994) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f842c1a5e28ad2add4da3c15() {
  return __cxx_static_address_f842c1a5e28ad2add4da3c15.reference || (__cxx_static_address_f842c1a5e28ad2add4da3c15.reference = {
    __cReference: true,
    get value() { return PIPE5____header_global_ac6276666382f311; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:441
export const PIPE6____header_global_3b5097f9b9c99302 = ((((((995) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_429c840224f8c3f8f0d131ff() {
  return __cxx_static_address_429c840224f8c3f8f0d131ff.reference || (__cxx_static_address_429c840224f8c3f8f0d131ff.reference = {
    __cReference: true,
    get value() { return PIPE6____header_global_3b5097f9b9c99302; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:442
export const PIPE4____header_global_fb26c623f5663de9 = ((((((996) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f3d80ec704bc576998aeeb84() {
  return __cxx_static_address_f3d80ec704bc576998aeeb84.reference || (__cxx_static_address_f3d80ec704bc576998aeeb84.reference = {
    __cReference: true,
    get value() { return PIPE4____header_global_fb26c623f5663de9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:443
export const PIPE4B____header_global_f3e586b9a8e7479a = ((((((997) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b2f6cb95ccf38bc5c8fc6673() {
  return __cxx_static_address_b2f6cb95ccf38bc5c8fc6673.reference || (__cxx_static_address_b2f6cb95ccf38bc5c8fc6673.reference = {
    __cReference: true,
    get value() { return PIPE4B____header_global_f3e586b9a8e7479a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:444
export const BROKEHYDROPLANT____header_global_1d7d0839f90f3dc1 = ((((((1003) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ec586b56d664eb5b18c1d112() {
  return __cxx_static_address_ec586b56d664eb5b18c1d112.reference || (__cxx_static_address_ec586b56d664eb5b18c1d112.reference = {
    __cReference: true,
    get value() { return BROKEHYDROPLANT____header_global_1d7d0839f90f3dc1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:445
export const PIPE5B____header_global_715ca84aaccc9dab = ((((((1005) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e6ccd7cf00269c73c258bff1() {
  return __cxx_static_address_e6ccd7cf00269c73c258bff1.reference || (__cxx_static_address_e6ccd7cf00269c73c258bff1.reference = {
    __cReference: true,
    get value() { return PIPE5B____header_global_715ca84aaccc9dab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:446
export const NEON3____header_global_ff44f7156d700801 = ((((((1007) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fbb289c383bc0888ea75ea48() {
  return __cxx_static_address_fbb289c383bc0888ea75ea48.reference || (__cxx_static_address_fbb289c383bc0888ea75ea48.reference = {
    __cReference: true,
    get value() { return NEON3____header_global_ff44f7156d700801; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:447
export const NEON4____header_global_16d1dede87df088d = ((((((1008) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e1bfd6a4e7b3640bb988b6e0() {
  return __cxx_static_address_e1bfd6a4e7b3640bb988b6e0.reference || (__cxx_static_address_e1bfd6a4e7b3640bb988b6e0.reference = {
    __cReference: true,
    get value() { return NEON4____header_global_16d1dede87df088d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:448
export const NEON5____header_global_528110867c03e4dd = ((((((1009) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_332307bbd0d88a3264082fa0() {
  return __cxx_static_address_332307bbd0d88a3264082fa0.reference || (__cxx_static_address_332307bbd0d88a3264082fa0.reference = {
    __cReference: true,
    get value() { return NEON5____header_global_528110867c03e4dd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:449
export const BOTTLE5____header_global_40ab7159f6f76baf = ((((((1012) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_40a65a3cd89ee686b2127825() {
  return __cxx_static_address_40a65a3cd89ee686b2127825.reference || (__cxx_static_address_40a65a3cd89ee686b2127825.reference = {
    __cReference: true,
    get value() { return BOTTLE5____header_global_40ab7159f6f76baf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:450
export const BOTTLE6____header_global_5172d63bc9564e8f = ((((((1013) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2fe793102ab2702d43650bc7() {
  return __cxx_static_address_2fe793102ab2702d43650bc7.reference || (__cxx_static_address_2fe793102ab2702d43650bc7.reference = {
    __cReference: true,
    get value() { return BOTTLE6____header_global_5172d63bc9564e8f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:451
export const BOTTLE8____header_global_c55810b54515b84c = ((((((1014) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ce1031c9f7a1e9cab050bd24() {
  return __cxx_static_address_ce1031c9f7a1e9cab050bd24.reference || (__cxx_static_address_ce1031c9f7a1e9cab050bd24.reference = {
    __cReference: true,
    get value() { return BOTTLE8____header_global_c55810b54515b84c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:452
export const SPOTLITE____header_global_07c7f5fa37ad4084 = ((((((1020) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c0f82b1ba86876ac4bbad83c() {
  return __cxx_static_address_c0f82b1ba86876ac4bbad83c.reference || (__cxx_static_address_c0f82b1ba86876ac4bbad83c.reference = {
    __cReference: true,
    get value() { return SPOTLITE____header_global_07c7f5fa37ad4084; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:453
export const MASKWALL15____header_global_e691df61928a13ba = ((((((1024) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8335332d7cb950ca2cf5f6cb() {
  return __cxx_static_address_8335332d7cb950ca2cf5f6cb.reference || (__cxx_static_address_8335332d7cb950ca2cf5f6cb.reference = {
    __cReference: true,
    get value() { return MASKWALL15____header_global_e691df61928a13ba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:454
export const BOTTLE7____header_global_b5a696c9f19b67f9 = ((((((1025) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3adc54af80b31eec03e7ed88() {
  return __cxx_static_address_3adc54af80b31eec03e7ed88.reference || (__cxx_static_address_3adc54af80b31eec03e7ed88.reference = {
    __cReference: true,
    get value() { return BOTTLE7____header_global_b5a696c9f19b67f9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:455
export const HORSEONSIDE____header_global_7c56cbcf9ac64176 = ((((((1026) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2923b298f9e226669d2d6b0b() {
  return __cxx_static_address_2923b298f9e226669d2d6b0b.reference || (__cxx_static_address_2923b298f9e226669d2d6b0b.reference = {
    __cReference: true,
    get value() { return HORSEONSIDE____header_global_7c56cbcf9ac64176; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:456
export const GLASSPIECES____header_global_c5947fa5be9b36eb = ((((((1031) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cffd0394068c49812a1e1f6e() {
  return __cxx_static_address_cffd0394068c49812a1e1f6e.reference || (__cxx_static_address_cffd0394068c49812a1e1f6e.reference = {
    __cReference: true,
    get value() { return GLASSPIECES____header_global_c5947fa5be9b36eb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:457
export const NEON6____header_global_6cca25877979ad6f = ((((((1046) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_328b1446cebb1d81b9355303() {
  return __cxx_static_address_328b1446cebb1d81b9355303.reference || (__cxx_static_address_328b1446cebb1d81b9355303.reference = {
    __cReference: true,
    get value() { return NEON6____header_global_6cca25877979ad6f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:458
export const MASKWALL6____header_global_02d3d55e333e9076 = ((((((1059) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fcbd52a102e60d646759dfe7() {
  return __cxx_static_address_fcbd52a102e60d646759dfe7.reference || (__cxx_static_address_fcbd52a102e60d646759dfe7.reference = {
    __cReference: true,
    get value() { return MASKWALL6____header_global_02d3d55e333e9076; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:459
export const RUBBERCAN____header_global_53a16e0c9b532734 = ((((((1062) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cf7d48ce46c127380d76498d() {
  return __cxx_static_address_cf7d48ce46c127380d76498d.reference || (__cxx_static_address_cf7d48ce46c127380d76498d.reference = {
    __cReference: true,
    get value() { return RUBBERCAN____header_global_53a16e0c9b532734; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:460
export const PLUG____header_global_0d3ff01858976e21 = ((((((1069) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0f8d0c68acd9060b5f273e37() {
  return __cxx_static_address_0f8d0c68acd9060b5f273e37.reference || (__cxx_static_address_0f8d0c68acd9060b5f273e37.reference = {
    __cReference: true,
    get value() { return PLUG____header_global_0d3ff01858976e21; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:461
export const OOZFILTER____header_global_8a650cc4334b4022 = ((((((1079) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_80a5103ba9c87c23d0b6ed71() {
  return __cxx_static_address_80a5103ba9c87c23d0b6ed71.reference || (__cxx_static_address_80a5103ba9c87c23d0b6ed71.reference = {
    __cReference: true,
    get value() { return OOZFILTER____header_global_8a650cc4334b4022; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:462
export const FLOORPLASMA____header_global_53e5e286bcaa9cbf = ((((((1082) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_862d062a9723ea13f16ac35c() {
  return __cxx_static_address_862d062a9723ea13f16ac35c.reference || (__cxx_static_address_862d062a9723ea13f16ac35c.reference = {
    __cReference: true,
    get value() { return FLOORPLASMA____header_global_53e5e286bcaa9cbf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:463
export const REACTOR____header_global_8997c40ad682a9f9 = ((((((1088) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b2adea06b4348117b3c305f0() {
  return __cxx_static_address_b2adea06b4348117b3c305f0.reference || (__cxx_static_address_b2adea06b4348117b3c305f0.reference = {
    __cReference: true,
    get value() { return REACTOR____header_global_8997c40ad682a9f9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:464
export const REACTORSPARK____header_global_3c8f1b5a2048e9d7 = ((((((1092) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5bf333b3dac1c2b66570206c() {
  return __cxx_static_address_5bf333b3dac1c2b66570206c.reference || (__cxx_static_address_5bf333b3dac1c2b66570206c.reference = {
    __cReference: true,
    get value() { return REACTORSPARK____header_global_3c8f1b5a2048e9d7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:465
export const REACTORBURNT____header_global_6a1840c450f2f900 = ((((((1096) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_886bd9e385d4ce0d9a134da2() {
  return __cxx_static_address_886bd9e385d4ce0d9a134da2.reference || (__cxx_static_address_886bd9e385d4ce0d9a134da2.reference = {
    __cReference: true,
    get value() { return REACTORBURNT____header_global_6a1840c450f2f900; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:466
export const DOORTILE15____header_global_638677e8c1af3594 = ((((((1102) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e1b972b9eb7723833a1a00fd() {
  return __cxx_static_address_e1b972b9eb7723833a1a00fd.reference || (__cxx_static_address_e1b972b9eb7723833a1a00fd.reference = {
    __cReference: true,
    get value() { return DOORTILE15____header_global_638677e8c1af3594; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:467
export const HANDSWITCH____header_global_4d2014698c1f931d = ((((((1111) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8aae20ecd3318a4160830b6b() {
  return __cxx_static_address_8aae20ecd3318a4160830b6b.reference || (__cxx_static_address_8aae20ecd3318a4160830b6b.reference = {
    __cReference: true,
    get value() { return HANDSWITCH____header_global_4d2014698c1f931d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:468
export const CIRCLEPANNEL____header_global_5fe4e3567823cd6c = ((((((1113) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_12cce5b1d2e9b9854c32c215() {
  return __cxx_static_address_12cce5b1d2e9b9854c32c215.reference || (__cxx_static_address_12cce5b1d2e9b9854c32c215.reference = {
    __cReference: true,
    get value() { return CIRCLEPANNEL____header_global_5fe4e3567823cd6c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:469
export const CIRCLEPANNELBROKE____header_global_1b325296df441a54 = ((((((1114) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a29eeb66b52ed15533083e0b() {
  return __cxx_static_address_a29eeb66b52ed15533083e0b.reference || (__cxx_static_address_a29eeb66b52ed15533083e0b.reference = {
    __cReference: true,
    get value() { return CIRCLEPANNELBROKE____header_global_1b325296df441a54; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:470
export const PULLSWITCH____header_global_a33a3db4e31a601e = ((((((1122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0e868a6a6fa11901cffa358b() {
  return __cxx_static_address_0e868a6a6fa11901cffa358b.reference || (__cxx_static_address_0e868a6a6fa11901cffa358b.reference = {
    __cReference: true,
    get value() { return PULLSWITCH____header_global_a33a3db4e31a601e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:471
export const MASKWALL8____header_global_f9c3b9ca87f79b8c = ((((((1124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b164ecff28c44321549725e2() {
  return __cxx_static_address_b164ecff28c44321549725e2.reference || (__cxx_static_address_b164ecff28c44321549725e2.reference = {
    __cReference: true,
    get value() { return MASKWALL8____header_global_f9c3b9ca87f79b8c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:472
export const BIGHOLE____header_global_79590b04c3375f0d = ((((((1141) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a225b5691275f7e34c2ea92a() {
  return __cxx_static_address_a225b5691275f7e34c2ea92a.reference || (__cxx_static_address_a225b5691275f7e34c2ea92a.reference = {
    __cReference: true,
    get value() { return BIGHOLE____header_global_79590b04c3375f0d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:473
export const ALIENSWITCH____header_global_2f5510a4d776afbd = ((((((1142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a70d5cb3fafed0d878d98ee1() {
  return __cxx_static_address_a70d5cb3fafed0d878d98ee1.reference || (__cxx_static_address_a70d5cb3fafed0d878d98ee1.reference = {
    __cReference: true,
    get value() { return ALIENSWITCH____header_global_2f5510a4d776afbd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:474
export const DOORTILE21____header_global_8e6a1bb2dfd1a245 = ((((((1144) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8afaf652c47131aa3e02b84b() {
  return __cxx_static_address_8afaf652c47131aa3e02b84b.reference || (__cxx_static_address_8afaf652c47131aa3e02b84b.reference = {
    __cReference: true,
    get value() { return DOORTILE21____header_global_8e6a1bb2dfd1a245; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:475
export const HANDPRINTSWITCH____header_global_e75b4ffe8ecbd1ca = ((((((1155) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2850961a12cd33b2f940944b() {
  return __cxx_static_address_2850961a12cd33b2f940944b.reference || (__cxx_static_address_2850961a12cd33b2f940944b.reference = {
    __cReference: true,
    get value() { return HANDPRINTSWITCH____header_global_e75b4ffe8ecbd1ca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:476
export const BOTTLE10____header_global_85dc07d79cd63370 = ((((((1157) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d302239cefcef0bd8bbd9d6c() {
  return __cxx_static_address_d302239cefcef0bd8bbd9d6c.reference || (__cxx_static_address_d302239cefcef0bd8bbd9d6c.reference = {
    __cReference: true,
    get value() { return BOTTLE10____header_global_85dc07d79cd63370; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:477
export const BOTTLE11____header_global_3daabd05789325c3 = ((((((1158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0907cf70c9689bcb128da347() {
  return __cxx_static_address_0907cf70c9689bcb128da347.reference || (__cxx_static_address_0907cf70c9689bcb128da347.reference = {
    __cReference: true,
    get value() { return BOTTLE11____header_global_3daabd05789325c3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:478
export const BOTTLE12____header_global_37cba4f5cd786f78 = ((((((1159) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0141fada0af5fbd943f92bc4() {
  return __cxx_static_address_0141fada0af5fbd943f92bc4.reference || (__cxx_static_address_0141fada0af5fbd943f92bc4.reference = {
    __cReference: true,
    get value() { return BOTTLE12____header_global_37cba4f5cd786f78; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:479
export const BOTTLE13____header_global_62999e9c7baed882 = ((((((1160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_817f4448a1d711722431c998() {
  return __cxx_static_address_817f4448a1d711722431c998.reference || (__cxx_static_address_817f4448a1d711722431c998.reference = {
    __cReference: true,
    get value() { return BOTTLE13____header_global_62999e9c7baed882; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:480
export const BOTTLE14____header_global_33c95692ebfdf445 = ((((((1161) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5ae360e7cc0594a5a8280169() {
  return __cxx_static_address_5ae360e7cc0594a5a8280169.reference || (__cxx_static_address_5ae360e7cc0594a5a8280169.reference = {
    __cReference: true,
    get value() { return BOTTLE14____header_global_33c95692ebfdf445; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:481
export const BOTTLE15____header_global_6d9f0e5c7399a7b2 = ((((((1162) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1106fbdc43342f34577d6499() {
  return __cxx_static_address_1106fbdc43342f34577d6499.reference || (__cxx_static_address_1106fbdc43342f34577d6499.reference = {
    __cReference: true,
    get value() { return BOTTLE15____header_global_6d9f0e5c7399a7b2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:482
export const BOTTLE16____header_global_ce3b265bb9e1c57c = ((((((1163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_242e2dd24d59f122632d3c86() {
  return __cxx_static_address_242e2dd24d59f122632d3c86.reference || (__cxx_static_address_242e2dd24d59f122632d3c86.reference = {
    __cReference: true,
    get value() { return BOTTLE16____header_global_ce3b265bb9e1c57c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:483
export const BOTTLE17____header_global_d897e799e07e226c = ((((((1164) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b38f8990b7eefa9ae509ad85() {
  return __cxx_static_address_b38f8990b7eefa9ae509ad85.reference || (__cxx_static_address_b38f8990b7eefa9ae509ad85.reference = {
    __cReference: true,
    get value() { return BOTTLE17____header_global_d897e799e07e226c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:484
export const BOTTLE18____header_global_6afac4268a76f371 = ((((((1165) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cf126f1c30d71144f7276c9c() {
  return __cxx_static_address_cf126f1c30d71144f7276c9c.reference || (__cxx_static_address_cf126f1c30d71144f7276c9c.reference = {
    __cReference: true,
    get value() { return BOTTLE18____header_global_6afac4268a76f371; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:485
export const BOTTLE19____header_global_a1d507f5299b5e73 = ((((((1166) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eb6267080d49148da04b7026() {
  return __cxx_static_address_eb6267080d49148da04b7026.reference || (__cxx_static_address_eb6267080d49148da04b7026.reference = {
    __cReference: true,
    get value() { return BOTTLE19____header_global_a1d507f5299b5e73; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:486
export const DOORTILE17____header_global_a9492d8879c32be3 = ((((((1169) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_09b27e8e23690ad5649f297d() {
  return __cxx_static_address_09b27e8e23690ad5649f297d.reference || (__cxx_static_address_09b27e8e23690ad5649f297d.reference = {
    __cReference: true,
    get value() { return DOORTILE17____header_global_a9492d8879c32be3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:487
export const MASKWALL7____header_global_fa58eca309d4cc15 = ((((((1174) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_71f48d1be33afeea4aa3b82d() {
  return __cxx_static_address_71f48d1be33afeea4aa3b82d.reference || (__cxx_static_address_71f48d1be33afeea4aa3b82d.reference = {
    __cReference: true,
    get value() { return MASKWALL7____header_global_fa58eca309d4cc15; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:488
export const DOORTILE11____header_global_058a86edad3f744f = ((((((1178) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5c059dd8982490e4ebee1619() {
  return __cxx_static_address_5c059dd8982490e4ebee1619.reference || (__cxx_static_address_5c059dd8982490e4ebee1619.reference = {
    __cReference: true,
    get value() { return DOORTILE11____header_global_058a86edad3f744f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:489
export const DOORTILE12____header_global_a08c23ef70d49b76 = ((((((1179) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_041e7aa103d5642f71321e96() {
  return __cxx_static_address_041e7aa103d5642f71321e96.reference || (__cxx_static_address_041e7aa103d5642f71321e96.reference = {
    __cReference: true,
    get value() { return DOORTILE12____header_global_a08c23ef70d49b76; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:490
export const VENDMACHINE____header_global_ccb00f69baf0c5f7 = ((((((1212) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bd68fbc83df259cac05dafec() {
  return __cxx_static_address_bd68fbc83df259cac05dafec.reference || (__cxx_static_address_bd68fbc83df259cac05dafec.reference = {
    __cReference: true,
    get value() { return VENDMACHINE____header_global_ccb00f69baf0c5f7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:491
export const COLAMACHINE____header_global_cd1b7760661d2730 = ((((((1215) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6aa354e378827d48b8759462() {
  return __cxx_static_address_6aa354e378827d48b8759462.reference || (__cxx_static_address_6aa354e378827d48b8759462.reference = {
    __cReference: true,
    get value() { return COLAMACHINE____header_global_cd1b7760661d2730; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:492
export const CRANEPOLE____header_global_0d92945f0a4f291a = ((((((1221) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e5858535afedd091fac70cf6() {
  return __cxx_static_address_e5858535afedd091fac70cf6.reference || (__cxx_static_address_e5858535afedd091fac70cf6.reference = {
    __cReference: true,
    get value() { return CRANEPOLE____header_global_0d92945f0a4f291a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:493
export const CRANE____header_global_cf9e13042f349769 = ((((((1222) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d854bbab3681e7bc85afc067() {
  return __cxx_static_address_d854bbab3681e7bc85afc067.reference || (__cxx_static_address_d854bbab3681e7bc85afc067.reference = {
    __cReference: true,
    get value() { return CRANE____header_global_cf9e13042f349769; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:494
export const BARBROKE____header_global_59fd76e0e3bfdfdd = ((((((1225) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f0a90faf07f8127cfca6a33d() {
  return __cxx_static_address_f0a90faf07f8127cfca6a33d.reference || (__cxx_static_address_f0a90faf07f8127cfca6a33d.reference = {
    __cReference: true,
    get value() { return BARBROKE____header_global_59fd76e0e3bfdfdd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:495
export const BLOODPOOL____header_global_6a6fe5eb6489cb32 = ((((((1226) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4d506a75451aebdbcccba573() {
  return __cxx_static_address_4d506a75451aebdbcccba573.reference || (__cxx_static_address_4d506a75451aebdbcccba573.reference = {
    __cReference: true,
    get value() { return BLOODPOOL____header_global_6a6fe5eb6489cb32; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:496
export const NUKEBARREL____header_global_78ba402def429f2a = ((((((1227) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9909608e2b270cabd4537551() {
  return __cxx_static_address_9909608e2b270cabd4537551.reference || (__cxx_static_address_9909608e2b270cabd4537551.reference = {
    __cReference: true,
    get value() { return NUKEBARREL____header_global_78ba402def429f2a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:497
export const NUKEBARRELDENTED____header_global_bfb6f5e586dd0f27 = ((((((1228) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d1de06d3418996fa11a1c1bc() {
  return __cxx_static_address_d1de06d3418996fa11a1c1bc.reference || (__cxx_static_address_d1de06d3418996fa11a1c1bc.reference = {
    __cReference: true,
    get value() { return NUKEBARRELDENTED____header_global_bfb6f5e586dd0f27; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:498
export const NUKEBARRELLEAKED____header_global_569c64e2aa34d420 = ((((((1229) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fd8663689e2e2cc4b345c133() {
  return __cxx_static_address_fd8663689e2e2cc4b345c133.reference || (__cxx_static_address_fd8663689e2e2cc4b345c133.reference = {
    __cReference: true,
    get value() { return NUKEBARRELLEAKED____header_global_569c64e2aa34d420; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:499
export const CANWITHSOMETHING____header_global_1bcaa8f444c2456d = ((((((1232) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cad0b9f022d5962bb2b34dc2() {
  return __cxx_static_address_cad0b9f022d5962bb2b34dc2.reference || (__cxx_static_address_cad0b9f022d5962bb2b34dc2.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING____header_global_1bcaa8f444c2456d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:500
export const MONEY____header_global_b9076a3286db5f89 = ((((((1233) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_78f21b7728685088d26aef44() {
  return __cxx_static_address_78f21b7728685088d26aef44.reference || (__cxx_static_address_78f21b7728685088d26aef44.reference = {
    __cReference: true,
    get value() { return MONEY____header_global_b9076a3286db5f89; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:501
export const BANNER____header_global_614f742c977801f6 = ((((((1236) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4449e109894666cc6e4773f2() {
  return __cxx_static_address_4449e109894666cc6e4773f2.reference || (__cxx_static_address_4449e109894666cc6e4773f2.reference = {
    __cReference: true,
    get value() { return BANNER____header_global_614f742c977801f6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:502
export const EXPLODINGBARREL____header_global_1bbb979e5093d9fe = ((((((1238) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_786100ca785c4cf846443632() {
  return __cxx_static_address_786100ca785c4cf846443632.reference || (__cxx_static_address_786100ca785c4cf846443632.reference = {
    __cReference: true,
    get value() { return EXPLODINGBARREL____header_global_1bbb979e5093d9fe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:503
export const EXPLODINGBARREL2____header_global_d9536deda09d7d64 = ((((((1239) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1487fab7308062943a0f6baf() {
  return __cxx_static_address_1487fab7308062943a0f6baf.reference || (__cxx_static_address_1487fab7308062943a0f6baf.reference = {
    __cReference: true,
    get value() { return EXPLODINGBARREL2____header_global_d9536deda09d7d64; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:504
export const FIREBARREL____header_global_714f45a07ac248c4 = ((((((1240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_300b48fece14588811ade5e6() {
  return __cxx_static_address_300b48fece14588811ade5e6.reference || (__cxx_static_address_300b48fece14588811ade5e6.reference = {
    __cReference: true,
    get value() { return FIREBARREL____header_global_714f45a07ac248c4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:505
export const SEENINE____header_global_9434786f41e4c11c = ((((((1247) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_33155581475c69851606b71f() {
  return __cxx_static_address_33155581475c69851606b71f.reference || (__cxx_static_address_33155581475c69851606b71f.reference = {
    __cReference: true,
    get value() { return SEENINE____header_global_9434786f41e4c11c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:506
export const SEENINEDEAD____header_global_1e5c53ab2807c172 = ((((((1248) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_99a9ea86b013aa30db0fc9de() {
  return __cxx_static_address_99a9ea86b013aa30db0fc9de.reference || (__cxx_static_address_99a9ea86b013aa30db0fc9de.reference = {
    __cReference: true,
    get value() { return SEENINEDEAD____header_global_1e5c53ab2807c172; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:507
export const STEAM____header_global_fe9a45d8d6b27a33 = ((((((1250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_024db309d19cf4405c216a5b() {
  return __cxx_static_address_024db309d19cf4405c216a5b.reference || (__cxx_static_address_024db309d19cf4405c216a5b.reference = {
    __cReference: true,
    get value() { return STEAM____header_global_fe9a45d8d6b27a33; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:508
export const CEILINGSTEAM____header_global_d2051fcf7be7cffc = ((((((1255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1c5a0f7c0b535c9603e336fe() {
  return __cxx_static_address_1c5a0f7c0b535c9603e336fe.reference || (__cxx_static_address_1c5a0f7c0b535c9603e336fe.reference = {
    __cReference: true,
    get value() { return CEILINGSTEAM____header_global_d2051fcf7be7cffc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:509
export const PIPE6B____header_global_dc99331f9c30cf45 = ((((((1260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1a08b42fe17b604dd8967dd6() {
  return __cxx_static_address_1a08b42fe17b604dd8967dd6.reference || (__cxx_static_address_1a08b42fe17b604dd8967dd6.reference = {
    __cReference: true,
    get value() { return PIPE6B____header_global_dc99331f9c30cf45; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:510
export const TRANSPORTERBEAM____header_global_433f1699fd918424 = ((((((1261) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5ba59662de2e07e8d910c746() {
  return __cxx_static_address_5ba59662de2e07e8d910c746.reference || (__cxx_static_address_5ba59662de2e07e8d910c746.reference = {
    __cReference: true,
    get value() { return TRANSPORTERBEAM____header_global_433f1699fd918424; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:511
export const RAT____header_global_6fa26c2e70b2387f = ((((((1267) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e6bc22b0d17e714c55fff914() {
  return __cxx_static_address_e6bc22b0d17e714c55fff914.reference || (__cxx_static_address_e6bc22b0d17e714c55fff914.reference = {
    __cReference: true,
    get value() { return RAT____header_global_6fa26c2e70b2387f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:512
export const TRASH____header_global_0c512d57c594197f = ((((((1272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4c65110c81c159ddf16afc08() {
  return __cxx_static_address_4c65110c81c159ddf16afc08.reference || (__cxx_static_address_4c65110c81c159ddf16afc08.reference = {
    __cReference: true,
    get value() { return TRASH____header_global_0c512d57c594197f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:513
export const FEMPIC1____header_global_cab8241a78b2164b = ((((((1280) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_07aa3415fbe476c34f24658e() {
  return __cxx_static_address_07aa3415fbe476c34f24658e.reference || (__cxx_static_address_07aa3415fbe476c34f24658e.reference = {
    __cReference: true,
    get value() { return FEMPIC1____header_global_cab8241a78b2164b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:514
export const FEMPIC2____header_global_08a648b328abdbc0 = ((((((1289) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_93eadfd511705cb0197f453b() {
  return __cxx_static_address_93eadfd511705cb0197f453b.reference || (__cxx_static_address_93eadfd511705cb0197f453b.reference = {
    __cReference: true,
    get value() { return FEMPIC2____header_global_08a648b328abdbc0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:515
export const BLANKSCREEN____header_global_d33e248e42ca1369 = ((((((1293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_87fc5ec7438fdc4b6fd4e81d() {
  return __cxx_static_address_87fc5ec7438fdc4b6fd4e81d.reference || (__cxx_static_address_87fc5ec7438fdc4b6fd4e81d.reference = {
    __cReference: true,
    get value() { return BLANKSCREEN____header_global_d33e248e42ca1369; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:516
export const PODFEM1____header_global_f41521032c2e9b3e = ((((((1294) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0323bc73e2b61344198b4887() {
  return __cxx_static_address_0323bc73e2b61344198b4887.reference || (__cxx_static_address_0323bc73e2b61344198b4887.reference = {
    __cReference: true,
    get value() { return PODFEM1____header_global_f41521032c2e9b3e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:517
export const FEMPIC3____header_global_ff331245a114aea6 = ((((((1298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_36ea54370ab5afa4f57b91e4() {
  return __cxx_static_address_36ea54370ab5afa4f57b91e4.reference || (__cxx_static_address_36ea54370ab5afa4f57b91e4.reference = {
    __cReference: true,
    get value() { return FEMPIC3____header_global_ff331245a114aea6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:518
export const FEMPIC4____header_global_aeb01b2d7c5421ae = ((((((1306) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_691cfebb76fcc4840425a4ce() {
  return __cxx_static_address_691cfebb76fcc4840425a4ce.reference || (__cxx_static_address_691cfebb76fcc4840425a4ce.reference = {
    __cReference: true,
    get value() { return FEMPIC4____header_global_aeb01b2d7c5421ae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:519
export const FEM1____header_global_679f2c486471431e = ((((((1312) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_13db2c2cf66c1e751316f56c() {
  return __cxx_static_address_13db2c2cf66c1e751316f56c.reference || (__cxx_static_address_13db2c2cf66c1e751316f56c.reference = {
    __cReference: true,
    get value() { return FEM1____header_global_679f2c486471431e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:520
export const FEM2____header_global_880ae6e96195a68c = ((((((1317) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_10e3ca66aa25433e7d9cd6cd() {
  return __cxx_static_address_10e3ca66aa25433e7d9cd6cd.reference || (__cxx_static_address_10e3ca66aa25433e7d9cd6cd.reference = {
    __cReference: true,
    get value() { return FEM2____header_global_880ae6e96195a68c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:521
export const FEM3____header_global_83566e4f5f59bc4c = ((((((1321) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7b6e72e80bb1006c5ea8de66() {
  return __cxx_static_address_7b6e72e80bb1006c5ea8de66.reference || (__cxx_static_address_7b6e72e80bb1006c5ea8de66.reference = {
    __cReference: true,
    get value() { return FEM3____header_global_83566e4f5f59bc4c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:522
export const FEM5____header_global_acf7ef06eb26dacc = ((((((1323) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_204c9e42dcf452ba2ff16c16() {
  return __cxx_static_address_204c9e42dcf452ba2ff16c16.reference || (__cxx_static_address_204c9e42dcf452ba2ff16c16.reference = {
    __cReference: true,
    get value() { return FEM5____header_global_acf7ef06eb26dacc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:523
export const BLOODYPOLE____header_global_991b03882445178e = ((((((1324) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9f42863a7dbe1499fe0177dc() {
  return __cxx_static_address_9f42863a7dbe1499fe0177dc.reference || (__cxx_static_address_9f42863a7dbe1499fe0177dc.reference = {
    __cReference: true,
    get value() { return BLOODYPOLE____header_global_991b03882445178e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:524
export const FEM4____header_global_705fdb55915aaea4 = ((((((1325) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bc544a79e284203cb50c8bb1() {
  return __cxx_static_address_bc544a79e284203cb50c8bb1.reference || (__cxx_static_address_bc544a79e284203cb50c8bb1.reference = {
    __cReference: true,
    get value() { return FEM4____header_global_705fdb55915aaea4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:525
export const FEM6____header_global_893d3dfda8daedf9 = ((((((1334) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8baab301ca43b072c1b14e59() {
  return __cxx_static_address_8baab301ca43b072c1b14e59.reference || (__cxx_static_address_8baab301ca43b072c1b14e59.reference = {
    __cReference: true,
    get value() { return FEM6____header_global_893d3dfda8daedf9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:526
export const FEM6PAD____header_global_fb898438d30ced9b = ((((((1335) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b49fdcb2dd7771c7d292847f() {
  return __cxx_static_address_b49fdcb2dd7771c7d292847f.reference || (__cxx_static_address_b49fdcb2dd7771c7d292847f.reference = {
    __cReference: true,
    get value() { return FEM6PAD____header_global_fb898438d30ced9b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:527
export const FEM8____header_global_87228172136bb0fd = ((((((1336) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d5183a7159b215af41af9ecf() {
  return __cxx_static_address_d5183a7159b215af41af9ecf.reference || (__cxx_static_address_d5183a7159b215af41af9ecf.reference = {
    __cReference: true,
    get value() { return FEM8____header_global_87228172136bb0fd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:528
export const HELECOPT____header_global_45f7fdad5f3605f2 = ((((((1346) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a060ff58d0265fe587a8f8f0() {
  return __cxx_static_address_a060ff58d0265fe587a8f8f0.reference || (__cxx_static_address_a060ff58d0265fe587a8f8f0.reference = {
    __cReference: true,
    get value() { return HELECOPT____header_global_45f7fdad5f3605f2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:529
export const FETUSJIB____header_global_165797e518cd6c2a = ((((((1347) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_67fc41d77a72cdb139bd337f() {
  return __cxx_static_address_67fc41d77a72cdb139bd337f.reference || (__cxx_static_address_67fc41d77a72cdb139bd337f.reference = {
    __cReference: true,
    get value() { return FETUSJIB____header_global_165797e518cd6c2a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:530
export const HOLODUKE____header_global_04b1540882b24772 = ((((((1348) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dbe370a172067a48d1ea003b() {
  return __cxx_static_address_dbe370a172067a48d1ea003b.reference || (__cxx_static_address_dbe370a172067a48d1ea003b.reference = {
    __cReference: true,
    get value() { return HOLODUKE____header_global_04b1540882b24772; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:531
export const SPACEMARINE____header_global_953202184a8cd71b = ((((((1353) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_340584636f279d3e8f5fe7fe() {
  return __cxx_static_address_340584636f279d3e8f5fe7fe.reference || (__cxx_static_address_340584636f279d3e8f5fe7fe.reference = {
    __cReference: true,
    get value() { return SPACEMARINE____header_global_953202184a8cd71b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:532
export const INDY____header_global_39c83e6fcf6e66eb = ((((((1355) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_be573018eff806f33d38249d() {
  return __cxx_static_address_be573018eff806f33d38249d.reference || (__cxx_static_address_be573018eff806f33d38249d.reference = {
    __cReference: true,
    get value() { return INDY____header_global_39c83e6fcf6e66eb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:533
export const FETUS____header_global_472ce3773ea359ec = ((((((1358) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cea285ca873b67c94d8dfb34() {
  return __cxx_static_address_cea285ca873b67c94d8dfb34.reference || (__cxx_static_address_cea285ca873b67c94d8dfb34.reference = {
    __cReference: true,
    get value() { return FETUS____header_global_472ce3773ea359ec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:534
export const FETUSBROKE____header_global_322b21075641c6b4 = ((((((1359) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9e9522f54b7545fb837abb9e() {
  return __cxx_static_address_9e9522f54b7545fb837abb9e.reference || (__cxx_static_address_9e9522f54b7545fb837abb9e.reference = {
    __cReference: true,
    get value() { return FETUSBROKE____header_global_322b21075641c6b4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:535
export const MONK____header_global_a742a328e4ed32e6 = ((((((1352) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4010f1c363af8f6cdf6064c7() {
  return __cxx_static_address_4010f1c363af8f6cdf6064c7.reference || (__cxx_static_address_4010f1c363af8f6cdf6064c7.reference = {
    __cReference: true,
    get value() { return MONK____header_global_a742a328e4ed32e6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:536
export const LUKE____header_global_a9aa97cee4d55cb9 = ((((((1354) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b2d0a2a1d77fca4a6924badf() {
  return __cxx_static_address_b2d0a2a1d77fca4a6924badf.reference || (__cxx_static_address_b2d0a2a1d77fca4a6924badf.reference = {
    __cReference: true,
    get value() { return LUKE____header_global_a9aa97cee4d55cb9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:537
export const COOLEXPLOSION1____header_global_49bd9fe9d3ee4993 = ((((((1360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c9913897d4d746998e1d01ba() {
  return __cxx_static_address_c9913897d4d746998e1d01ba.reference || (__cxx_static_address_c9913897d4d746998e1d01ba.reference = {
    __cReference: true,
    get value() { return COOLEXPLOSION1____header_global_49bd9fe9d3ee4993; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:538
export const WATERSPLASH2____header_global_1f1d9e9e23736f3a = ((((((1380) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9cb57030c60b07f0d82f4d06() {
  return __cxx_static_address_9cb57030c60b07f0d82f4d06.reference || (__cxx_static_address_9cb57030c60b07f0d82f4d06.reference = {
    __cReference: true,
    get value() { return WATERSPLASH2____header_global_1f1d9e9e23736f3a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:539
export const FIREVASE____header_global_7d0e3ea218b45219 = ((((((1390) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_15e5965ee6c8fd06114188fd() {
  return __cxx_static_address_15e5965ee6c8fd06114188fd.reference || (__cxx_static_address_15e5965ee6c8fd06114188fd.reference = {
    __cReference: true,
    get value() { return FIREVASE____header_global_7d0e3ea218b45219; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:540
export const FEM7____header_global_d1ee842a5bf8ba2f = ((((((1395) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_598295f79614de2e8cede13a() {
  return __cxx_static_address_598295f79614de2e8cede13a.reference || (__cxx_static_address_598295f79614de2e8cede13a.reference = {
    __cReference: true,
    get value() { return FEM7____header_global_d1ee842a5bf8ba2f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:541
export const APLAYERTOP____header_global_9ed56f92de613f05 = ((((((1400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6576ffcf16e414daf8633123() {
  return __cxx_static_address_6576ffcf16e414daf8633123.reference || (__cxx_static_address_6576ffcf16e414daf8633123.reference = {
    __cReference: true,
    get value() { return APLAYERTOP____header_global_9ed56f92de613f05; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:542
export const APLAYER____header_global_861d9ec5a1bab669 = ((((((1405) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f987ae6cd97298c8c9688ee5() {
  return __cxx_static_address_f987ae6cd97298c8c9688ee5.reference || (__cxx_static_address_f987ae6cd97298c8c9688ee5.reference = {
    __cReference: true,
    get value() { return APLAYER____header_global_861d9ec5a1bab669; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:543
export const PLAYERONWATER____header_global_a88ad53ce96cda58 = ((((((1420) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_abe4a3e74e7164304efae4f6() {
  return __cxx_static_address_abe4a3e74e7164304efae4f6.reference || (__cxx_static_address_abe4a3e74e7164304efae4f6.reference = {
    __cReference: true,
    get value() { return PLAYERONWATER____header_global_a88ad53ce96cda58; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:544
export const DUKELYINGDEAD____header_global_2357b5c1cf4da116 = ((((((1518) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d1ff8691617467f43de524e2() {
  return __cxx_static_address_d1ff8691617467f43de524e2.reference || (__cxx_static_address_d1ff8691617467f43de524e2.reference = {
    __cReference: true,
    get value() { return DUKELYINGDEAD____header_global_2357b5c1cf4da116; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:545
export const DUKETORSO____header_global_3c431872c768627c = ((((((1520) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_988b597d3b5f6244f54f4d43() {
  return __cxx_static_address_988b597d3b5f6244f54f4d43.reference || (__cxx_static_address_988b597d3b5f6244f54f4d43.reference = {
    __cReference: true,
    get value() { return DUKETORSO____header_global_3c431872c768627c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:546
export const DUKEGUN____header_global_a521bf667ccce9e9 = ((((((1528) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_da621d48ae2f098ec4bd4f10() {
  return __cxx_static_address_da621d48ae2f098ec4bd4f10.reference || (__cxx_static_address_da621d48ae2f098ec4bd4f10.reference = {
    __cReference: true,
    get value() { return DUKEGUN____header_global_a521bf667ccce9e9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:547
export const DUKELEG____header_global_965117d8d580e0e5 = ((((((1536) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e8cd99f19219df613867decd() {
  return __cxx_static_address_e8cd99f19219df613867decd.reference || (__cxx_static_address_e8cd99f19219df613867decd.reference = {
    __cReference: true,
    get value() { return DUKELEG____header_global_965117d8d580e0e5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:548
export const SHARK____header_global_972a75aafcbb4077 = ((((((1550) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e6950853eebeaee70a4a4cc() {
  return __cxx_static_address_1e6950853eebeaee70a4a4cc.reference || (__cxx_static_address_1e6950853eebeaee70a4a4cc.reference = {
    __cReference: true,
    get value() { return SHARK____header_global_972a75aafcbb4077; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:549
export const BLOOD____header_global_e1d59ea47277b22b = ((((((1620) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c31b07c8a9af40e15ce55fe5() {
  return __cxx_static_address_c31b07c8a9af40e15ce55fe5.reference || (__cxx_static_address_c31b07c8a9af40e15ce55fe5.reference = {
    __cReference: true,
    get value() { return BLOOD____header_global_e1d59ea47277b22b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:550
export const FIRELASER____header_global_b2bf42c75bbb5daf = ((((((1625) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_317b597bc67a7acac2104bab() {
  return __cxx_static_address_317b597bc67a7acac2104bab.reference || (__cxx_static_address_317b597bc67a7acac2104bab.reference = {
    __cReference: true,
    get value() { return FIRELASER____header_global_b2bf42c75bbb5daf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:551
export const TRANSPORTERSTAR____header_global_ef713041ac1a930a = ((((((1630) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3f19ddc94a92219805e01baa() {
  return __cxx_static_address_3f19ddc94a92219805e01baa.reference || (__cxx_static_address_3f19ddc94a92219805e01baa.reference = {
    __cReference: true,
    get value() { return TRANSPORTERSTAR____header_global_ef713041ac1a930a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:552
export const SPIT____header_global_c302861d8085bba4 = ((((((1636) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_20e93cb9ecea0b7a35739394() {
  return __cxx_static_address_20e93cb9ecea0b7a35739394.reference || (__cxx_static_address_20e93cb9ecea0b7a35739394.reference = {
    __cReference: true,
    get value() { return SPIT____header_global_c302861d8085bba4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:553
export const LOOGIE____header_global_7068a365bbf54348 = ((((((1637) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_26f932a7b3facdba661759f4() {
  return __cxx_static_address_26f932a7b3facdba661759f4.reference || (__cxx_static_address_26f932a7b3facdba661759f4.reference = {
    __cReference: true,
    get value() { return LOOGIE____header_global_7068a365bbf54348; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:554
export const FIST____header_global_7547f81610840ffb = ((((((1640) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7bd7fdcb32d7c95a38de8c84() {
  return __cxx_static_address_7bd7fdcb32d7c95a38de8c84.reference || (__cxx_static_address_7bd7fdcb32d7c95a38de8c84.reference = {
    __cReference: true,
    get value() { return FIST____header_global_7547f81610840ffb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:555
export const FREEZEBLAST____header_global_7973c0b7d89a07f5 = ((((((1641) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1bf9db04fd89d7d5fd9977bc() {
  return __cxx_static_address_1bf9db04fd89d7d5fd9977bc.reference || (__cxx_static_address_1bf9db04fd89d7d5fd9977bc.reference = {
    __cReference: true,
    get value() { return FREEZEBLAST____header_global_7973c0b7d89a07f5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:556
export const SHRINKSPARK____header_global_e2e615ae0e25f610 = ((((((1646) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c385d577256ca34cc1d658e1() {
  return __cxx_static_address_c385d577256ca34cc1d658e1.reference || (__cxx_static_address_c385d577256ca34cc1d658e1.reference = {
    __cReference: true,
    get value() { return SHRINKSPARK____header_global_e2e615ae0e25f610; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:557
export const TONGUE____header_global_832d5b3690423bae = ((((((1647) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0417190536871c1fd087016e() {
  return __cxx_static_address_0417190536871c1fd087016e.reference || (__cxx_static_address_0417190536871c1fd087016e.reference = {
    __cReference: true,
    get value() { return TONGUE____header_global_832d5b3690423bae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:558
export const MORTER____header_global_706896f9c9759e25 = ((((((1650) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_82ce850c6ea760c4f144d79c() {
  return __cxx_static_address_82ce850c6ea760c4f144d79c.reference || (__cxx_static_address_82ce850c6ea760c4f144d79c.reference = {
    __cReference: true,
    get value() { return MORTER____header_global_706896f9c9759e25; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:559
export const SHRINKEREXPLOSION____header_global_9b0107e6568bdc34 = ((((((1656) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1376ca38bdec0aa44d7f2fda() {
  return __cxx_static_address_1376ca38bdec0aa44d7f2fda.reference || (__cxx_static_address_1376ca38bdec0aa44d7f2fda.reference = {
    __cReference: true,
    get value() { return SHRINKEREXPLOSION____header_global_9b0107e6568bdc34; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:560
export const RADIUSEXPLOSION____header_global_2e6e7da2909d9770 = ((((((1670) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_df3ce456d9f51ec4436887e4() {
  return __cxx_static_address_df3ce456d9f51ec4436887e4.reference || (__cxx_static_address_df3ce456d9f51ec4436887e4.reference = {
    __cReference: true,
    get value() { return RADIUSEXPLOSION____header_global_2e6e7da2909d9770; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:561
export const FORCERIPPLE____header_global_cd13d833f2986dd7 = ((((((1671) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_384d1b0011f69070547fa5e4() {
  return __cxx_static_address_384d1b0011f69070547fa5e4.reference || (__cxx_static_address_384d1b0011f69070547fa5e4.reference = {
    __cReference: true,
    get value() { return FORCERIPPLE____header_global_cd13d833f2986dd7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:562
export const LIZTROOP____header_global_a8c63bbfd1e8b3ae = ((((((1680) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f93a6ac209ea2934b1e0b561() {
  return __cxx_static_address_f93a6ac209ea2934b1e0b561.reference || (__cxx_static_address_f93a6ac209ea2934b1e0b561.reference = {
    __cReference: true,
    get value() { return LIZTROOP____header_global_a8c63bbfd1e8b3ae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:563
export const LIZTROOPRUNNING____header_global_24c3f136b27b9ab9 = ((((((1681) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e02bd2d33743c1b1e514f95b() {
  return __cxx_static_address_e02bd2d33743c1b1e514f95b.reference || (__cxx_static_address_e02bd2d33743c1b1e514f95b.reference = {
    __cReference: true,
    get value() { return LIZTROOPRUNNING____header_global_24c3f136b27b9ab9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:564
export const LIZTROOPSTAYPUT____header_global_0b92664e78aa736e = ((((((1682) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8d86aad4f8cf7179fc2694c3() {
  return __cxx_static_address_8d86aad4f8cf7179fc2694c3.reference || (__cxx_static_address_8d86aad4f8cf7179fc2694c3.reference = {
    __cReference: true,
    get value() { return LIZTROOPSTAYPUT____header_global_0b92664e78aa736e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:565
export const LIZTROOPSHOOT____header_global_0a9ce408467f771a = ((((((1715) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b90cfe63f30935e5f84b5e51() {
  return __cxx_static_address_b90cfe63f30935e5f84b5e51.reference || (__cxx_static_address_b90cfe63f30935e5f84b5e51.reference = {
    __cReference: true,
    get value() { return LIZTROOPSHOOT____header_global_0a9ce408467f771a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:566
export const LIZTROOPJETPACK____header_global_3eb46822fe92f485 = ((((((1725) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_000d62c70dc13e1ff769b66d() {
  return __cxx_static_address_000d62c70dc13e1ff769b66d.reference || (__cxx_static_address_000d62c70dc13e1ff769b66d.reference = {
    __cReference: true,
    get value() { return LIZTROOPJETPACK____header_global_3eb46822fe92f485; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:567
export const LIZTROOPONTOILET____header_global_671f1e67a476128a = ((((((1741) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2d9e318d226bf2cf5e4b5c29() {
  return __cxx_static_address_2d9e318d226bf2cf5e4b5c29.reference || (__cxx_static_address_2d9e318d226bf2cf5e4b5c29.reference = {
    __cReference: true,
    get value() { return LIZTROOPONTOILET____header_global_671f1e67a476128a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:568
export const LIZTROOPJUSTSIT____header_global_8f44a02a7560df6d = ((((((1742) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0c12fb9974d2f1168fd45d82() {
  return __cxx_static_address_0c12fb9974d2f1168fd45d82.reference || (__cxx_static_address_0c12fb9974d2f1168fd45d82.reference = {
    __cReference: true,
    get value() { return LIZTROOPJUSTSIT____header_global_8f44a02a7560df6d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:569
export const LIZTROOPDUCKING____header_global_b534e320c483103f = ((((((1744) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1902f6d63c99aeada3ec26a3() {
  return __cxx_static_address_1902f6d63c99aeada3ec26a3.reference || (__cxx_static_address_1902f6d63c99aeada3ec26a3.reference = {
    __cReference: true,
    get value() { return LIZTROOPDUCKING____header_global_b534e320c483103f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:570
export const HEADJIB1____header_global_0e3cfe5ee2f49610 = ((((((1768) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a4cb3db03be890274c9a047a() {
  return __cxx_static_address_a4cb3db03be890274c9a047a.reference || (__cxx_static_address_a4cb3db03be890274c9a047a.reference = {
    __cReference: true,
    get value() { return HEADJIB1____header_global_0e3cfe5ee2f49610; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:571
export const ARMJIB1____header_global_d21b2d188d57312e = ((((((1772) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fd363fee60d23a3a225da29e() {
  return __cxx_static_address_fd363fee60d23a3a225da29e.reference || (__cxx_static_address_fd363fee60d23a3a225da29e.reference = {
    __cReference: true,
    get value() { return ARMJIB1____header_global_d21b2d188d57312e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:572
export const LEGJIB1____header_global_37d25bc510f43ca0 = ((((((1776) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c01fbd69e34796100eff7007() {
  return __cxx_static_address_c01fbd69e34796100eff7007.reference || (__cxx_static_address_c01fbd69e34796100eff7007.reference = {
    __cReference: true,
    get value() { return LEGJIB1____header_global_37d25bc510f43ca0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:573
export const OCTABRAIN____header_global_97ab8abe5472ead5 = ((((((1820) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_733d14b4df56b44268dea286() {
  return __cxx_static_address_733d14b4df56b44268dea286.reference || (__cxx_static_address_733d14b4df56b44268dea286.reference = {
    __cReference: true,
    get value() { return OCTABRAIN____header_global_97ab8abe5472ead5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:574
export const OCTABRAINSTAYPUT____header_global_aeb3c0c8fd0c8157 = ((((((1821) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d876b5c48732f42a7bec6a8d() {
  return __cxx_static_address_d876b5c48732f42a7bec6a8d.reference || (__cxx_static_address_d876b5c48732f42a7bec6a8d.reference = {
    __cReference: true,
    get value() { return OCTABRAINSTAYPUT____header_global_aeb3c0c8fd0c8157; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:575
export const INNERJAW____header_global_f7e1eafafc808cd6 = ((((((1860) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8130e27ffa129858676e93af() {
  return __cxx_static_address_8130e27ffa129858676e93af.reference || (__cxx_static_address_8130e27ffa129858676e93af.reference = {
    __cReference: true,
    get value() { return INNERJAW____header_global_f7e1eafafc808cd6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:576
export const DRONE____header_global_cf8119407cc3a7ef = ((((((1880) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_599b9705940658cd1f09a28c() {
  return __cxx_static_address_599b9705940658cd1f09a28c.reference || (__cxx_static_address_599b9705940658cd1f09a28c.reference = {
    __cReference: true,
    get value() { return DRONE____header_global_cf8119407cc3a7ef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:577
export const EXPLOSION2____header_global_e23f683d3390b4f2 = ((((((1890) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_968028f2e1046cff7ad8ef52() {
  return __cxx_static_address_968028f2e1046cff7ad8ef52.reference || (__cxx_static_address_968028f2e1046cff7ad8ef52.reference = {
    __cReference: true,
    get value() { return EXPLOSION2____header_global_e23f683d3390b4f2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:578
export const COMMANDER____header_global_fc19ff23a8dfd46b = ((((((1920) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_51e752f53fefcd60ed44d533() {
  return __cxx_static_address_51e752f53fefcd60ed44d533.reference || (__cxx_static_address_51e752f53fefcd60ed44d533.reference = {
    __cReference: true,
    get value() { return COMMANDER____header_global_fc19ff23a8dfd46b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:579
export const COMMANDERSTAYPUT____header_global_e952cff7302c656e = ((((((1921) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4ba6fcf9e1a885c5d29513b3() {
  return __cxx_static_address_4ba6fcf9e1a885c5d29513b3.reference || (__cxx_static_address_4ba6fcf9e1a885c5d29513b3.reference = {
    __cReference: true,
    get value() { return COMMANDERSTAYPUT____header_global_e952cff7302c656e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:580
export const RECON____header_global_58e0ac3a50479bc3 = ((((((1960) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_763bb09751e255f25769798c() {
  return __cxx_static_address_763bb09751e255f25769798c.reference || (__cxx_static_address_763bb09751e255f25769798c.reference = {
    __cReference: true,
    get value() { return RECON____header_global_58e0ac3a50479bc3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:581
export const TANK____header_global_137dcd2bf41ac97e = ((((((1975) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_22350a9667c1b330efdd46c9() {
  return __cxx_static_address_22350a9667c1b330efdd46c9.reference || (__cxx_static_address_22350a9667c1b330efdd46c9.reference = {
    __cReference: true,
    get value() { return TANK____header_global_137dcd2bf41ac97e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:582
export const PIGCOP____header_global_9f5bb22185e99bea = ((((((2000) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_174929ace052b55095b32a61() {
  return __cxx_static_address_174929ace052b55095b32a61.reference || (__cxx_static_address_174929ace052b55095b32a61.reference = {
    __cReference: true,
    get value() { return PIGCOP____header_global_9f5bb22185e99bea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:583
export const PIGCOPSTAYPUT____header_global_afdbe5be567547f7 = ((((((2001) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8a4d97a8508d1e34ecf4e253() {
  return __cxx_static_address_8a4d97a8508d1e34ecf4e253.reference || (__cxx_static_address_8a4d97a8508d1e34ecf4e253.reference = {
    __cReference: true,
    get value() { return PIGCOPSTAYPUT____header_global_afdbe5be567547f7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:584
export const PIGCOPDIVE____header_global_1f1528ac052bcc99 = ((((((2045) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6ae31e30e3dacd52b3098ed7() {
  return __cxx_static_address_6ae31e30e3dacd52b3098ed7.reference || (__cxx_static_address_6ae31e30e3dacd52b3098ed7.reference = {
    __cReference: true,
    get value() { return PIGCOPDIVE____header_global_1f1528ac052bcc99; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:585
export const LIZMAN____header_global_4e5e778752bc156f = ((((((2120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dd3247d5b2f627e331f9e654() {
  return __cxx_static_address_dd3247d5b2f627e331f9e654.reference || (__cxx_static_address_dd3247d5b2f627e331f9e654.reference = {
    __cReference: true,
    get value() { return LIZMAN____header_global_4e5e778752bc156f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:586
export const LIZMANSTAYPUT____header_global_cf3ba697b26b44b6 = ((((((2121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_36dd0465c3417e51848a3f29() {
  return __cxx_static_address_36dd0465c3417e51848a3f29.reference || (__cxx_static_address_36dd0465c3417e51848a3f29.reference = {
    __cReference: true,
    get value() { return LIZMANSTAYPUT____header_global_cf3ba697b26b44b6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:587
export const LIZMANSPITTING____header_global_794da72e36da05a4 = ((((((2150) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6532041ee32d781144c876ef() {
  return __cxx_static_address_6532041ee32d781144c876ef.reference || (__cxx_static_address_6532041ee32d781144c876ef.reference = {
    __cReference: true,
    get value() { return LIZMANSPITTING____header_global_794da72e36da05a4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:588
export const LIZMANFEEDING____header_global_b28aae735c564e4a = ((((((2160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_66e02bb7c7415ec93576f15d() {
  return __cxx_static_address_66e02bb7c7415ec93576f15d.reference || (__cxx_static_address_66e02bb7c7415ec93576f15d.reference = {
    __cReference: true,
    get value() { return LIZMANFEEDING____header_global_b28aae735c564e4a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:589
export const LIZMANJUMP____header_global_2bcdd2e6074f4ffc = ((((((2165) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7b35a7fa2e50fac18ff8a993() {
  return __cxx_static_address_7b35a7fa2e50fac18ff8a993.reference || (__cxx_static_address_7b35a7fa2e50fac18ff8a993.reference = {
    __cReference: true,
    get value() { return LIZMANJUMP____header_global_2bcdd2e6074f4ffc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:590
export const FECES____header_global_8b1522226b16e001 = ((((((2200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_57d5da55da97d62107f970b4() {
  return __cxx_static_address_57d5da55da97d62107f970b4.reference || (__cxx_static_address_57d5da55da97d62107f970b4.reference = {
    __cReference: true,
    get value() { return FECES____header_global_8b1522226b16e001; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:591
export const LIZMANHEAD1____header_global_a96ae7dad9e3ff88 = ((((((2201) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8d4c4847505e3b0139e789d7() {
  return __cxx_static_address_8d4c4847505e3b0139e789d7.reference || (__cxx_static_address_8d4c4847505e3b0139e789d7.reference = {
    __cReference: true,
    get value() { return LIZMANHEAD1____header_global_a96ae7dad9e3ff88; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:592
export const LIZMANARM1____header_global_7571ec0dd2f1df93 = ((((((2205) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c5415f10ea9f18716041cb26() {
  return __cxx_static_address_c5415f10ea9f18716041cb26.reference || (__cxx_static_address_c5415f10ea9f18716041cb26.reference = {
    __cReference: true,
    get value() { return LIZMANARM1____header_global_7571ec0dd2f1df93; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:593
export const LIZMANLEG1____header_global_9b47adb91a0102bc = ((((((2209) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_149a4a1d19b8f90e15f65758() {
  return __cxx_static_address_149a4a1d19b8f90e15f65758.reference || (__cxx_static_address_149a4a1d19b8f90e15f65758.reference = {
    __cReference: true,
    get value() { return LIZMANLEG1____header_global_9b47adb91a0102bc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:594
export const EXPLOSION2BOT____header_global_97e32db74eb2401a = ((((((2219) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_01b98107b42c51dcdb1f154e() {
  return __cxx_static_address_01b98107b42c51dcdb1f154e.reference || (__cxx_static_address_01b98107b42c51dcdb1f154e.reference = {
    __cReference: true,
    get value() { return EXPLOSION2BOT____header_global_97e32db74eb2401a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:595
export const JIBS1____header_global_b8535c3364f46ff6 = ((((((2245) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c8fe568a082ec0ece441f00f() {
  return __cxx_static_address_c8fe568a082ec0ece441f00f.reference || (__cxx_static_address_c8fe568a082ec0ece441f00f.reference = {
    __cReference: true,
    get value() { return JIBS1____header_global_b8535c3364f46ff6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:596
export const JIBS2____header_global_c9228ba684d15495 = ((((((2250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_94b43f899b6f8b3ba79b8946() {
  return __cxx_static_address_94b43f899b6f8b3ba79b8946.reference || (__cxx_static_address_94b43f899b6f8b3ba79b8946.reference = {
    __cReference: true,
    get value() { return JIBS2____header_global_c9228ba684d15495; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:597
export const JIBS3____header_global_7d7598ba2d9d12db = ((((((2255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ea4e672ed5e9ccb5f63cb557() {
  return __cxx_static_address_ea4e672ed5e9ccb5f63cb557.reference || (__cxx_static_address_ea4e672ed5e9ccb5f63cb557.reference = {
    __cReference: true,
    get value() { return JIBS3____header_global_7d7598ba2d9d12db; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:598
export const JIBS4____header_global_dbb7c89d16d4a3b4 = ((((((2260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_753b0a825f0304acfb706d9c() {
  return __cxx_static_address_753b0a825f0304acfb706d9c.reference || (__cxx_static_address_753b0a825f0304acfb706d9c.reference = {
    __cReference: true,
    get value() { return JIBS4____header_global_dbb7c89d16d4a3b4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:599
export const JIBS5____header_global_04bb446a922f748d = ((((((2265) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aec761a8e1a54246afcd90f3() {
  return __cxx_static_address_aec761a8e1a54246afcd90f3.reference || (__cxx_static_address_aec761a8e1a54246afcd90f3.reference = {
    __cReference: true,
    get value() { return JIBS5____header_global_04bb446a922f748d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:600
export const BURNING____header_global_5e6bfe5a1a97fbc2 = ((((((2270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_49bfe0f9d9b8ff889faff942() {
  return __cxx_static_address_49bfe0f9d9b8ff889faff942.reference || (__cxx_static_address_49bfe0f9d9b8ff889faff942.reference = {
    __cReference: true,
    get value() { return BURNING____header_global_5e6bfe5a1a97fbc2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:601
export const FIRE____header_global_6b8ef146658a960f = ((((((2271) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8528cc9c115104d3db82091a() {
  return __cxx_static_address_8528cc9c115104d3db82091a.reference || (__cxx_static_address_8528cc9c115104d3db82091a.reference = {
    __cReference: true,
    get value() { return FIRE____header_global_6b8ef146658a960f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:602
export const JIBS6____header_global_70afc2dcd15973be = ((((((2286) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5b792da34d0005a256d8acbd() {
  return __cxx_static_address_5b792da34d0005a256d8acbd.reference || (__cxx_static_address_5b792da34d0005a256d8acbd.reference = {
    __cReference: true,
    get value() { return JIBS6____header_global_70afc2dcd15973be; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:603
export const BLOODSPLAT1____header_global_d90d65d2fb7e4676 = ((((((2296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_922b7693834085bbac39216e() {
  return __cxx_static_address_922b7693834085bbac39216e.reference || (__cxx_static_address_922b7693834085bbac39216e.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT1____header_global_d90d65d2fb7e4676; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:604
export const BLOODSPLAT3____header_global_91c402131a9f068e = ((((((2297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2fcc1e1f4f236ce4159b52ba() {
  return __cxx_static_address_2fcc1e1f4f236ce4159b52ba.reference || (__cxx_static_address_2fcc1e1f4f236ce4159b52ba.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT3____header_global_91c402131a9f068e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:605
export const BLOODSPLAT2____header_global_9cc06d3d52e3fcca = ((((((2298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d205cde1940859f42130de80() {
  return __cxx_static_address_d205cde1940859f42130de80.reference || (__cxx_static_address_d205cde1940859f42130de80.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT2____header_global_9cc06d3d52e3fcca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:606
export const BLOODSPLAT4____header_global_1f93703d715befae = ((((((2299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0171c586f7b4ef376d5a2930() {
  return __cxx_static_address_0171c586f7b4ef376d5a2930.reference || (__cxx_static_address_0171c586f7b4ef376d5a2930.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT4____header_global_1f93703d715befae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:607
export const OOZ____header_global_acc3fa4f0163c647 = ((((((2300) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_46be4f17771520a75085b2b3() {
  return __cxx_static_address_46be4f17771520a75085b2b3.reference || (__cxx_static_address_46be4f17771520a75085b2b3.reference = {
    __cReference: true,
    get value() { return OOZ____header_global_acc3fa4f0163c647; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:608
export const OOZ2____header_global_d87343a513d73f7e = ((((((2309) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_580cea4b0918b4eddc0b6adc() {
  return __cxx_static_address_580cea4b0918b4eddc0b6adc.reference || (__cxx_static_address_580cea4b0918b4eddc0b6adc.reference = {
    __cReference: true,
    get value() { return OOZ2____header_global_d87343a513d73f7e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:609
export const WALLBLOOD1____header_global_adbc5b8674de4788 = ((((((2301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b5d5c06863e297e2b31d1b74() {
  return __cxx_static_address_b5d5c06863e297e2b31d1b74.reference || (__cxx_static_address_b5d5c06863e297e2b31d1b74.reference = {
    __cReference: true,
    get value() { return WALLBLOOD1____header_global_adbc5b8674de4788; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:610
export const WALLBLOOD2____header_global_c1e8a9f9ae9c0266 = ((((((2302) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_64074d7f4d092e722a1a9653() {
  return __cxx_static_address_64074d7f4d092e722a1a9653.reference || (__cxx_static_address_64074d7f4d092e722a1a9653.reference = {
    __cReference: true,
    get value() { return WALLBLOOD2____header_global_c1e8a9f9ae9c0266; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:611
export const WALLBLOOD3____header_global_6fb260bd27790208 = ((((((2303) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0f45afb970f9179790ee0738() {
  return __cxx_static_address_0f45afb970f9179790ee0738.reference || (__cxx_static_address_0f45afb970f9179790ee0738.reference = {
    __cReference: true,
    get value() { return WALLBLOOD3____header_global_6fb260bd27790208; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:612
export const WALLBLOOD4____header_global_2bbb369133a531c6 = ((((((2304) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f44f27263ba12eecb698b00a() {
  return __cxx_static_address_f44f27263ba12eecb698b00a.reference || (__cxx_static_address_f44f27263ba12eecb698b00a.reference = {
    __cReference: true,
    get value() { return WALLBLOOD4____header_global_2bbb369133a531c6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:613
export const WALLBLOOD5____header_global_6e1d5b8c456a31d7 = ((((((2305) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_35a96963fe5982d2ffdff2ac() {
  return __cxx_static_address_35a96963fe5982d2ffdff2ac.reference || (__cxx_static_address_35a96963fe5982d2ffdff2ac.reference = {
    __cReference: true,
    get value() { return WALLBLOOD5____header_global_6e1d5b8c456a31d7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:614
export const WALLBLOOD7____header_global_3f0d7a827c02c425 = ((((((2307) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_402b7fbcd3e35ecbcf286a25() {
  return __cxx_static_address_402b7fbcd3e35ecbcf286a25.reference || (__cxx_static_address_402b7fbcd3e35ecbcf286a25.reference = {
    __cReference: true,
    get value() { return WALLBLOOD7____header_global_3f0d7a827c02c425; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:615
export const WALLBLOOD8____header_global_9f769786623de446 = ((((((2308) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0fbd2635bd212bbd838edfed() {
  return __cxx_static_address_0fbd2635bd212bbd838edfed.reference || (__cxx_static_address_0fbd2635bd212bbd838edfed.reference = {
    __cReference: true,
    get value() { return WALLBLOOD8____header_global_9f769786623de446; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:616
export const BURNING2____header_global_123f30440361aafd = ((((((2310) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f3817e4de8080efa57e3f3e9() {
  return __cxx_static_address_f3817e4de8080efa57e3f3e9.reference || (__cxx_static_address_f3817e4de8080efa57e3f3e9.reference = {
    __cReference: true,
    get value() { return BURNING2____header_global_123f30440361aafd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:617
export const FIRE2____header_global_804b756fe0612d8a = ((((((2311) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6e22b3b6e386e94b63a79291() {
  return __cxx_static_address_6e22b3b6e386e94b63a79291.reference || (__cxx_static_address_6e22b3b6e386e94b63a79291.reference = {
    __cReference: true,
    get value() { return FIRE2____header_global_804b756fe0612d8a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:618
export const CRACKKNUCKLES____header_global_ab7b3c7f3841f878 = ((((((2324) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d4c554a1df712b7952662923() {
  return __cxx_static_address_d4c554a1df712b7952662923.reference || (__cxx_static_address_d4c554a1df712b7952662923.reference = {
    __cReference: true,
    get value() { return CRACKKNUCKLES____header_global_ab7b3c7f3841f878; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:619
export const SMALLSMOKE____header_global_1e55be3a21e5cbea = ((((((2329) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d0d6165b8c055de3b9dce000() {
  return __cxx_static_address_d0d6165b8c055de3b9dce000.reference || (__cxx_static_address_d0d6165b8c055de3b9dce000.reference = {
    __cReference: true,
    get value() { return SMALLSMOKE____header_global_1e55be3a21e5cbea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:620
export const FLOORFLAME____header_global_7a28a9267c37ae9e = ((((((2333) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2b5641b1a2280cb4cc103bce() {
  return __cxx_static_address_2b5641b1a2280cb4cc103bce.reference || (__cxx_static_address_2b5641b1a2280cb4cc103bce.reference = {
    __cReference: true,
    get value() { return FLOORFLAME____header_global_7a28a9267c37ae9e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:621
export const ROTATEGUN____header_global_e4a5d0b037cf406d = ((((((2360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d3b29412e775b4f91d2b64ff() {
  return __cxx_static_address_d3b29412e775b4f91d2b64ff.reference || (__cxx_static_address_d3b29412e775b4f91d2b64ff.reference = {
    __cReference: true,
    get value() { return ROTATEGUN____header_global_e4a5d0b037cf406d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:622
export const GREENSLIME____header_global_0ae682f1f94f5783 = ((((((2370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a1c45660b98fe97c30aaa3a2() {
  return __cxx_static_address_a1c45660b98fe97c30aaa3a2.reference || (__cxx_static_address_a1c45660b98fe97c30aaa3a2.reference = {
    __cReference: true,
    get value() { return GREENSLIME____header_global_0ae682f1f94f5783; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:623
export const WATERDRIPSPLASH____header_global_460f0f3805b310d4 = ((((((2380) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1bbbf35c3a1955907bf2fff7() {
  return __cxx_static_address_1bbbf35c3a1955907bf2fff7.reference || (__cxx_static_address_1bbbf35c3a1955907bf2fff7.reference = {
    __cReference: true,
    get value() { return WATERDRIPSPLASH____header_global_460f0f3805b310d4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:624
export const SCRAP6____header_global_86a2934266b4a492 = ((((((2390) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_71d13aedc1a95175f5183e62() {
  return __cxx_static_address_71d13aedc1a95175f5183e62.reference || (__cxx_static_address_71d13aedc1a95175f5183e62.reference = {
    __cReference: true,
    get value() { return SCRAP6____header_global_86a2934266b4a492; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:625
export const SCRAP1____header_global_58a82336c75629ee = ((((((2400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f1cf6ac1a850ed1cceb74958() {
  return __cxx_static_address_f1cf6ac1a850ed1cceb74958.reference || (__cxx_static_address_f1cf6ac1a850ed1cceb74958.reference = {
    __cReference: true,
    get value() { return SCRAP1____header_global_58a82336c75629ee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:626
export const SCRAP2____header_global_9c1852007de61f23 = ((((((2404) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e329cb7a72552c04bacc3d6() {
  return __cxx_static_address_1e329cb7a72552c04bacc3d6.reference || (__cxx_static_address_1e329cb7a72552c04bacc3d6.reference = {
    __cReference: true,
    get value() { return SCRAP2____header_global_9c1852007de61f23; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:627
export const SCRAP3____header_global_987d7078d0e4642f = ((((((2408) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_993d9bd7e63e3794f16e6524() {
  return __cxx_static_address_993d9bd7e63e3794f16e6524.reference || (__cxx_static_address_993d9bd7e63e3794f16e6524.reference = {
    __cReference: true,
    get value() { return SCRAP3____header_global_987d7078d0e4642f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:628
export const SCRAP4____header_global_ccc21e189de317d3 = ((((((2412) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e3eac39ae5c838fd8bd85e26() {
  return __cxx_static_address_e3eac39ae5c838fd8bd85e26.reference || (__cxx_static_address_e3eac39ae5c838fd8bd85e26.reference = {
    __cReference: true,
    get value() { return SCRAP4____header_global_ccc21e189de317d3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:629
export const SCRAP5____header_global_8e62fde30b4da991 = ((((((2416) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0c4b4ed97720a52d069fb643() {
  return __cxx_static_address_0c4b4ed97720a52d069fb643.reference || (__cxx_static_address_0c4b4ed97720a52d069fb643.reference = {
    __cReference: true,
    get value() { return SCRAP5____header_global_8e62fde30b4da991; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:630
export const ORGANTIC____header_global_1549c1acacc34fc6 = ((((((2420) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_42fe1696de9b0e03b7e84fee() {
  return __cxx_static_address_42fe1696de9b0e03b7e84fee.reference || (__cxx_static_address_42fe1696de9b0e03b7e84fee.reference = {
    __cReference: true,
    get value() { return ORGANTIC____header_global_1549c1acacc34fc6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:631
export const BETAVERSION____header_global_f56ae82abf8ad960 = ((((((2440) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1f995e4020908ad365dea8b3() {
  return __cxx_static_address_1f995e4020908ad365dea8b3.reference || (__cxx_static_address_1f995e4020908ad365dea8b3.reference = {
    __cReference: true,
    get value() { return BETAVERSION____header_global_f56ae82abf8ad960; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:632
export const SELECTDIR____header_global_5a6545efa93d4de4 = ((((((2444) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ec7b7fe01bfe0a23014ff249() {
  return __cxx_static_address_ec7b7fe01bfe0a23014ff249.reference || (__cxx_static_address_ec7b7fe01bfe0a23014ff249.reference = {
    __cReference: true,
    get value() { return SELECTDIR____header_global_5a6545efa93d4de4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:633
export const F1HELP____header_global_3f9839613eb2471f = ((((((2445) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b09cfa926c5b1ec8948a348c() {
  return __cxx_static_address_b09cfa926c5b1ec8948a348c.reference || (__cxx_static_address_b09cfa926c5b1ec8948a348c.reference = {
    __cReference: true,
    get value() { return F1HELP____header_global_3f9839613eb2471f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:634
export const GROWSPARK____header_global_16bf3dacf41c7045 = ((((((2448) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_11a5e041341df166d45e646f() {
  return __cxx_static_address_11a5e041341df166d45e646f.reference || (__cxx_static_address_11a5e041341df166d45e646f.reference = {
    __cReference: true,
    get value() { return GROWSPARK____header_global_16bf3dacf41c7045; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:635
export const MENUSCREEN____header_global_79452881b729c5c7 = ((((((2456) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d6a9bc1c177b14e0d4533cb3() {
  return __cxx_static_address_d6a9bc1c177b14e0d4533cb3.reference || (__cxx_static_address_d6a9bc1c177b14e0d4533cb3.reference = {
    __cReference: true,
    get value() { return MENUSCREEN____header_global_79452881b729c5c7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:636
export const MENUBAR____header_global_f0e39db3f0b41d54 = ((((((2457) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d6a824990d176801b8359e30() {
  return __cxx_static_address_d6a824990d176801b8359e30.reference || (__cxx_static_address_d6a824990d176801b8359e30.reference = {
    __cReference: true,
    get value() { return MENUBAR____header_global_f0e39db3f0b41d54; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:637
export const KILLSICON____header_global_0e953d79491ff635 = ((((((2458) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f5d63cb1ec6e2bbf86b6e670() {
  return __cxx_static_address_f5d63cb1ec6e2bbf86b6e670.reference || (__cxx_static_address_f5d63cb1ec6e2bbf86b6e670.reference = {
    __cReference: true,
    get value() { return KILLSICON____header_global_0e953d79491ff635; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:638
export const FIRSTAID_ICON____header_global_81ef02b72a6f4501 = ((((((2460) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_36b3a49de60c869666af4215() {
  return __cxx_static_address_36b3a49de60c869666af4215.reference || (__cxx_static_address_36b3a49de60c869666af4215.reference = {
    __cReference: true,
    get value() { return FIRSTAID_ICON____header_global_81ef02b72a6f4501; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:639
export const HEAT_ICON____header_global_1029008a9ba5d2f3 = ((((((2461) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d8a7f246c08e488af6b8c8ef() {
  return __cxx_static_address_d8a7f246c08e488af6b8c8ef.reference || (__cxx_static_address_d8a7f246c08e488af6b8c8ef.reference = {
    __cReference: true,
    get value() { return HEAT_ICON____header_global_1029008a9ba5d2f3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:640
export const BOTTOMSTATUSBAR____header_global_70f43e4dc3bf0a24 = ((((((2462) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f5065f850ada991a4ddb9e3e() {
  return __cxx_static_address_f5065f850ada991a4ddb9e3e.reference || (__cxx_static_address_f5065f850ada991a4ddb9e3e.reference = {
    __cReference: true,
    get value() { return BOTTOMSTATUSBAR____header_global_70f43e4dc3bf0a24; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:641
export const BOOT_ICON____header_global_33a6442dea2486f9 = ((((((2463) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_05ad8db76131bfa75a524e53() {
  return __cxx_static_address_05ad8db76131bfa75a524e53.reference || (__cxx_static_address_05ad8db76131bfa75a524e53.reference = {
    __cReference: true,
    get value() { return BOOT_ICON____header_global_33a6442dea2486f9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:642
export const FRAGBAR____header_global_4f39758e66590f85 = ((((((2465) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4d8d5afea88d9420c84286b8() {
  return __cxx_static_address_4d8d5afea88d9420c84286b8.reference || (__cxx_static_address_4d8d5afea88d9420c84286b8.reference = {
    __cReference: true,
    get value() { return FRAGBAR____header_global_4f39758e66590f85; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:643
export const JETPACK_ICON____header_global_77cd9cb2785ae527 = ((((((2467) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0446d92c61214cf730756e93() {
  return __cxx_static_address_0446d92c61214cf730756e93.reference || (__cxx_static_address_0446d92c61214cf730756e93.reference = {
    __cReference: true,
    get value() { return JETPACK_ICON____header_global_77cd9cb2785ae527; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:644
export const AIRTANK_ICON____header_global_8bf52d8f4ba733d9 = ((((((2468) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a81b19ca5a4e40e2d5ffe9da() {
  return __cxx_static_address_a81b19ca5a4e40e2d5ffe9da.reference || (__cxx_static_address_a81b19ca5a4e40e2d5ffe9da.reference = {
    __cReference: true,
    get value() { return AIRTANK_ICON____header_global_8bf52d8f4ba733d9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:645
export const STEROIDS_ICON____header_global_aa5370680fe6a055 = ((((((2469) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f045d4eb62050ab967854d2d() {
  return __cxx_static_address_f045d4eb62050ab967854d2d.reference || (__cxx_static_address_f045d4eb62050ab967854d2d.reference = {
    __cReference: true,
    get value() { return STEROIDS_ICON____header_global_aa5370680fe6a055; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:646
export const HOLODUKE_ICON____header_global_bce10ab024671c65 = ((((((2470) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_04972f1615bee7b4aaba1de9() {
  return __cxx_static_address_04972f1615bee7b4aaba1de9.reference || (__cxx_static_address_04972f1615bee7b4aaba1de9.reference = {
    __cReference: true,
    get value() { return HOLODUKE_ICON____header_global_bce10ab024671c65; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:647
export const ACCESS_ICON____header_global_b3245c8f3d4defb1 = ((((((2471) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_48c8fbd69bcb56020f575079() {
  return __cxx_static_address_48c8fbd69bcb56020f575079.reference || (__cxx_static_address_48c8fbd69bcb56020f575079.reference = {
    __cReference: true,
    get value() { return ACCESS_ICON____header_global_b3245c8f3d4defb1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:648
export const DIGITALNUM____header_global_d001932a592a82f6 = ((((((2472) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_16c2386ae3309e496f300a81() {
  return __cxx_static_address_16c2386ae3309e496f300a81.reference || (__cxx_static_address_16c2386ae3309e496f300a81.reference = {
    __cReference: true,
    get value() { return DIGITALNUM____header_global_d001932a592a82f6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:649
export const DUKECAR____header_global_fe3d2670ec46124f = ((((((2491) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d362476d6f1bbfec394e0ebc() {
  return __cxx_static_address_d362476d6f1bbfec394e0ebc.reference || (__cxx_static_address_d362476d6f1bbfec394e0ebc.reference = {
    __cReference: true,
    get value() { return DUKECAR____header_global_fe3d2670ec46124f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:650
export const CAMCORNER____header_global_25cdf33f1610b9af = ((((((2482) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_59e1479873b4b31760ade363() {
  return __cxx_static_address_59e1479873b4b31760ade363.reference || (__cxx_static_address_59e1479873b4b31760ade363.reference = {
    __cReference: true,
    get value() { return CAMCORNER____header_global_25cdf33f1610b9af; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:651
export const CAMLIGHT____header_global_0e45e1dcd0349df7 = ((((((2484) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b5aa89b9cea08274a819cf74() {
  return __cxx_static_address_b5aa89b9cea08274a819cf74.reference || (__cxx_static_address_b5aa89b9cea08274a819cf74.reference = {
    __cReference: true,
    get value() { return CAMLIGHT____header_global_0e45e1dcd0349df7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:652
export const SLIDEBAR____header_global_511a11d58ac33610 = ((((((2489) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_30adb589e622cf7fe6fdf656() {
  return __cxx_static_address_30adb589e622cf7fe6fdf656.reference || (__cxx_static_address_30adb589e622cf7fe6fdf656.reference = {
    __cReference: true,
    get value() { return SLIDEBAR____header_global_511a11d58ac33610; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:653
export const DREALMS____header_global_4790d0a7608a6b2e = ((((((2492) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9cada7cdfd57bf2fefadbf18() {
  return __cxx_static_address_9cada7cdfd57bf2fefadbf18.reference || (__cxx_static_address_9cada7cdfd57bf2fefadbf18.reference = {
    __cReference: true,
    get value() { return DREALMS____header_global_4790d0a7608a6b2e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:654
export const BETASCREEN____header_global_e3490ccfde6a7d78 = ((((((2493) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_37d7a515977af17c1bb9b57d() {
  return __cxx_static_address_37d7a515977af17c1bb9b57d.reference || (__cxx_static_address_37d7a515977af17c1bb9b57d.reference = {
    __cReference: true,
    get value() { return BETASCREEN____header_global_e3490ccfde6a7d78; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:655
export const WINDOWBORDER1____header_global_0005b47bf6b2e78c = ((((((2494) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0eea53e15c06eb051298f573() {
  return __cxx_static_address_0eea53e15c06eb051298f573.reference || (__cxx_static_address_0eea53e15c06eb051298f573.reference = {
    __cReference: true,
    get value() { return WINDOWBORDER1____header_global_0005b47bf6b2e78c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:656
export const TEXTBOX____header_global_88e71f9df1199339 = ((((((2495) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cbf4c4787804af65fb313941() {
  return __cxx_static_address_cbf4c4787804af65fb313941.reference || (__cxx_static_address_cbf4c4787804af65fb313941.reference = {
    __cReference: true,
    get value() { return TEXTBOX____header_global_88e71f9df1199339; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:657
export const WINDOWBORDER2____header_global_fa15c236fecf071f = ((((((2496) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5d52126befe60b43b78f9da3() {
  return __cxx_static_address_5d52126befe60b43b78f9da3.reference || (__cxx_static_address_5d52126befe60b43b78f9da3.reference = {
    __cReference: true,
    get value() { return WINDOWBORDER2____header_global_fa15c236fecf071f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:658
export const DUKENUKEM____header_global_9c172476e6a2bc80 = ((((((2497) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_976d9cfaf1e0423e73cae117() {
  return __cxx_static_address_976d9cfaf1e0423e73cae117.reference || (__cxx_static_address_976d9cfaf1e0423e73cae117.reference = {
    __cReference: true,
    get value() { return DUKENUKEM____header_global_9c172476e6a2bc80; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:659
export const THREEDEE____header_global_fe316158881e7ca2 = ((((((2498) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3223d387650c8465e96d2c77() {
  return __cxx_static_address_3223d387650c8465e96d2c77.reference || (__cxx_static_address_3223d387650c8465e96d2c77.reference = {
    __cReference: true,
    get value() { return THREEDEE____header_global_fe316158881e7ca2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:660
export const INGAMEDUKETHREEDEE____header_global_e06c4a2b0362a2c8 = ((((((2499) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0020de89ff53aa5e4dfadf34() {
  return __cxx_static_address_0020de89ff53aa5e4dfadf34.reference || (__cxx_static_address_0020de89ff53aa5e4dfadf34.reference = {
    __cReference: true,
    get value() { return INGAMEDUKETHREEDEE____header_global_e06c4a2b0362a2c8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:661
export const TENSCREEN____header_global_1165e289da9fa5bf = ((((((2500) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_808467db21829eb0dee07457() {
  return __cxx_static_address_808467db21829eb0dee07457.reference || (__cxx_static_address_808467db21829eb0dee07457.reference = {
    __cReference: true,
    get value() { return TENSCREEN____header_global_1165e289da9fa5bf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:662
export const PLUTOPAKSPRITE____header_global_bc30e401f8909822 = ((((((2501) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_47a70bcaa88764c9c6cb92e7() {
  return __cxx_static_address_47a70bcaa88764c9c6cb92e7.reference || (__cxx_static_address_47a70bcaa88764c9c6cb92e7.reference = {
    __cReference: true,
    get value() { return PLUTOPAKSPRITE____header_global_bc30e401f8909822; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:663
export const DEVISTATOR____header_global_56f00631077fc9b9 = ((((((2510) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3bb615bdc24ba7aa14dd42a4() {
  return __cxx_static_address_3bb615bdc24ba7aa14dd42a4.reference || (__cxx_static_address_3bb615bdc24ba7aa14dd42a4.reference = {
    __cReference: true,
    get value() { return DEVISTATOR____header_global_56f00631077fc9b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:664
export const KNEE____header_global_cfa741c7c4be8e30 = ((((((2521) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d6ec03a218a73f283c3d0e54() {
  return __cxx_static_address_d6ec03a218a73f283c3d0e54.reference || (__cxx_static_address_d6ec03a218a73f283c3d0e54.reference = {
    __cReference: true,
    get value() { return KNEE____header_global_cfa741c7c4be8e30; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:665
export const CROSSHAIR____header_global_6f4b94f1359949b5 = ((((((2523) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e40fa1fb84019b8b06d35829() {
  return __cxx_static_address_e40fa1fb84019b8b06d35829.reference || (__cxx_static_address_e40fa1fb84019b8b06d35829.reference = {
    __cReference: true,
    get value() { return CROSSHAIR____header_global_6f4b94f1359949b5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:666
export const FIRSTGUN____header_global_665790e07aa8a24f = ((((((2524) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6783e04135ed5f4ce1c7143e() {
  return __cxx_static_address_6783e04135ed5f4ce1c7143e.reference || (__cxx_static_address_6783e04135ed5f4ce1c7143e.reference = {
    __cReference: true,
    get value() { return FIRSTGUN____header_global_665790e07aa8a24f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:667
export const FIRSTGUNRELOAD____header_global_3bcc9001b228dead = ((((((2528) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_be3659b5e3549c70466c2df1() {
  return __cxx_static_address_be3659b5e3549c70466c2df1.reference || (__cxx_static_address_be3659b5e3549c70466c2df1.reference = {
    __cReference: true,
    get value() { return FIRSTGUNRELOAD____header_global_3bcc9001b228dead; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:668
export const SHELL____header_global_9e1d816ef3335196 = ((((((2533) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_060205c7a49eec42e05fadb9() {
  return __cxx_static_address_060205c7a49eec42e05fadb9.reference || (__cxx_static_address_060205c7a49eec42e05fadb9.reference = {
    __cReference: true,
    get value() { return SHELL____header_global_9e1d816ef3335196; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:669
export const SHOTGUNSHELL____header_global_737b34156cf93fb7 = ((((((2535) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7de1984a78d57590e4530267() {
  return __cxx_static_address_7de1984a78d57590e4530267.reference || (__cxx_static_address_7de1984a78d57590e4530267.reference = {
    __cReference: true,
    get value() { return SHOTGUNSHELL____header_global_737b34156cf93fb7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:670
export const CHAINGUN____header_global_1b279e3b32a17d93 = ((((((2536) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_19780be71d82636de8e291e4() {
  return __cxx_static_address_19780be71d82636de8e291e4.reference || (__cxx_static_address_19780be71d82636de8e291e4.reference = {
    __cReference: true,
    get value() { return CHAINGUN____header_global_1b279e3b32a17d93; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:671
export const RPGGUN____header_global_4ebb205e1acd766e = ((((((2544) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8f6a92bd05d8ebbba8f45e91() {
  return __cxx_static_address_8f6a92bd05d8ebbba8f45e91.reference || (__cxx_static_address_8f6a92bd05d8ebbba8f45e91.reference = {
    __cReference: true,
    get value() { return RPGGUN____header_global_4ebb205e1acd766e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:672
export const FREEZE____header_global_3171a85df2c60c8c = ((((((2548) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d5eb827f9e3d17b87c1b63d0() {
  return __cxx_static_address_d5eb827f9e3d17b87c1b63d0.reference || (__cxx_static_address_d5eb827f9e3d17b87c1b63d0.reference = {
    __cReference: true,
    get value() { return FREEZE____header_global_3171a85df2c60c8c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:673
export const SHRINKER____header_global_f90074ceacdc5a30 = ((((((2556) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_92b6c57799b4fc915beb11cf() {
  return __cxx_static_address_92b6c57799b4fc915beb11cf.reference || (__cxx_static_address_92b6c57799b4fc915beb11cf.reference = {
    __cReference: true,
    get value() { return SHRINKER____header_global_f90074ceacdc5a30; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:674
export const HANDHOLDINGLASER____header_global_0ceccb540a01f1ef = ((((((2563) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ce627117f9d99ca3ffa98f26() {
  return __cxx_static_address_ce627117f9d99ca3ffa98f26.reference || (__cxx_static_address_ce627117f9d99ca3ffa98f26.reference = {
    __cReference: true,
    get value() { return HANDHOLDINGLASER____header_global_0ceccb540a01f1ef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:675
export const TRIPBOMB____header_global_68a9e2ec394c58f0 = ((((((2566) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_55a76deae308cf36861f0f8a() {
  return __cxx_static_address_55a76deae308cf36861f0f8a.reference || (__cxx_static_address_55a76deae308cf36861f0f8a.reference = {
    __cReference: true,
    get value() { return TRIPBOMB____header_global_68a9e2ec394c58f0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:676
export const LASERLINE____header_global_1078ec1ca58ae751 = ((((((2567) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c3b5c2638c2fc4483579a694() {
  return __cxx_static_address_c3b5c2638c2fc4483579a694.reference || (__cxx_static_address_c3b5c2638c2fc4483579a694.reference = {
    __cReference: true,
    get value() { return LASERLINE____header_global_1078ec1ca58ae751; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:677
export const HANDHOLDINGACCESS____header_global_a27429460ed80fba = ((((((2568) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4c435d78bcf771a3297be52e() {
  return __cxx_static_address_4c435d78bcf771a3297be52e.reference || (__cxx_static_address_4c435d78bcf771a3297be52e.reference = {
    __cReference: true,
    get value() { return HANDHOLDINGACCESS____header_global_a27429460ed80fba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:678
export const HANDREMOTE____header_global_5c1c3ea7e0adc761 = ((((((2570) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d2501ab61f6525f0f7091e26() {
  return __cxx_static_address_d2501ab61f6525f0f7091e26.reference || (__cxx_static_address_d2501ab61f6525f0f7091e26.reference = {
    __cReference: true,
    get value() { return HANDREMOTE____header_global_5c1c3ea7e0adc761; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:679
export const HANDTHROW____header_global_235d4dc11f297969 = ((((((2573) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0a0dba538d5560a56d2a7c62() {
  return __cxx_static_address_0a0dba538d5560a56d2a7c62.reference || (__cxx_static_address_0a0dba538d5560a56d2a7c62.reference = {
    __cReference: true,
    get value() { return HANDTHROW____header_global_235d4dc11f297969; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:680
export const TIP____header_global_354b06cc8a63b426 = ((((((2576) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_454b5a060dc5746f65922d1b() {
  return __cxx_static_address_454b5a060dc5746f65922d1b.reference || (__cxx_static_address_454b5a060dc5746f65922d1b.reference = {
    __cReference: true,
    get value() { return TIP____header_global_354b06cc8a63b426; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:681
export const SCUBAMASK____header_global_6c1a855d9bf5dc5f = ((((((2581) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_822e27573e01f981cdb02bd0() {
  return __cxx_static_address_822e27573e01f981cdb02bd0.reference || (__cxx_static_address_822e27573e01f981cdb02bd0.reference = {
    __cReference: true,
    get value() { return SCUBAMASK____header_global_6c1a855d9bf5dc5f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:682
export const FORCESPHERE____header_global_e303b11679180ce1 = ((((((2590) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_df1e0fc48f6a8b3796565fb5() {
  return __cxx_static_address_df1e0fc48f6a8b3796565fb5.reference || (__cxx_static_address_df1e0fc48f6a8b3796565fb5.reference = {
    __cReference: true,
    get value() { return FORCESPHERE____header_global_e303b11679180ce1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:683
export const SHOTSPARK1____header_global_c526d9bc3c3f580a = ((((((2595) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5aaa631944ab3b3f03c42804() {
  return __cxx_static_address_5aaa631944ab3b3f03c42804.reference || (__cxx_static_address_5aaa631944ab3b3f03c42804.reference = {
    __cReference: true,
    get value() { return SHOTSPARK1____header_global_c526d9bc3c3f580a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:684
export const RPG____header_global_7052d0e5bcf876c8 = ((((((2605) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a4b97fe9227e4b07eef436c6() {
  return __cxx_static_address_a4b97fe9227e4b07eef436c6.reference || (__cxx_static_address_a4b97fe9227e4b07eef436c6.reference = {
    __cReference: true,
    get value() { return RPG____header_global_7052d0e5bcf876c8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:685
export const LASERSITE____header_global_314b2230dad8de5f = ((((((2612) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_85a8679b54890b6da30c8e14() {
  return __cxx_static_address_85a8679b54890b6da30c8e14.reference || (__cxx_static_address_85a8679b54890b6da30c8e14.reference = {
    __cReference: true,
    get value() { return LASERSITE____header_global_314b2230dad8de5f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:686
export const SHOTGUN____header_global_0b00992558c2a1b4 = ((((((2613) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7ab9dbc21ec2bedfe9dab146() {
  return __cxx_static_address_7ab9dbc21ec2bedfe9dab146.reference || (__cxx_static_address_7ab9dbc21ec2bedfe9dab146.reference = {
    __cReference: true,
    get value() { return SHOTGUN____header_global_0b00992558c2a1b4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:687
export const BOSS1____header_global_86b64120fb90faf7 = ((((((2630) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_22e0f66fed165179ac662359() {
  return __cxx_static_address_22e0f66fed165179ac662359.reference || (__cxx_static_address_22e0f66fed165179ac662359.reference = {
    __cReference: true,
    get value() { return BOSS1____header_global_86b64120fb90faf7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:688
export const BOSS1STAYPUT____header_global_e70a4ac106a30209 = ((((((2631) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_49ecc93f0a04d7a402f0c282() {
  return __cxx_static_address_49ecc93f0a04d7a402f0c282.reference || (__cxx_static_address_49ecc93f0a04d7a402f0c282.reference = {
    __cReference: true,
    get value() { return BOSS1STAYPUT____header_global_e70a4ac106a30209; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:689
export const BOSS1SHOOT____header_global_e53ffec9d057adaf = ((((((2660) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5bbe56b4238c53e452c9a5bb() {
  return __cxx_static_address_5bbe56b4238c53e452c9a5bb.reference || (__cxx_static_address_5bbe56b4238c53e452c9a5bb.reference = {
    __cReference: true,
    get value() { return BOSS1SHOOT____header_global_e53ffec9d057adaf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:690
export const BOSS1LOB____header_global_5c314e0a5c04e529 = ((((((2670) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_17ea1fc5f05194160b6901a0() {
  return __cxx_static_address_17ea1fc5f05194160b6901a0.reference || (__cxx_static_address_17ea1fc5f05194160b6901a0.reference = {
    __cReference: true,
    get value() { return BOSS1LOB____header_global_5c314e0a5c04e529; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:691
export const BOSSTOP____header_global_55fd25dad5f8b937 = ((((((2696) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ad6a769511057ef9b6c9f30e() {
  return __cxx_static_address_ad6a769511057ef9b6c9f30e.reference || (__cxx_static_address_ad6a769511057ef9b6c9f30e.reference = {
    __cReference: true,
    get value() { return BOSSTOP____header_global_55fd25dad5f8b937; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:692
export const BOSS2____header_global_3d9d4f43b1590b24 = ((((((2710) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d5242647565e3f322cac6de0() {
  return __cxx_static_address_d5242647565e3f322cac6de0.reference || (__cxx_static_address_d5242647565e3f322cac6de0.reference = {
    __cReference: true,
    get value() { return BOSS2____header_global_3d9d4f43b1590b24; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:693
export const BOSS3____header_global_b7afd2b01e313777 = ((((((2760) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_78eceaaf449f0f9d658b930c() {
  return __cxx_static_address_78eceaaf449f0f9d658b930c.reference || (__cxx_static_address_78eceaaf449f0f9d658b930c.reference = {
    __cReference: true,
    get value() { return BOSS3____header_global_b7afd2b01e313777; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:694
export const SPINNINGNUKEICON____header_global_4032e99002554185 = ((((((2813) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_91bc315b0d5ba90d6b416569() {
  return __cxx_static_address_91bc315b0d5ba90d6b416569.reference || (__cxx_static_address_91bc315b0d5ba90d6b416569.reference = {
    __cReference: true,
    get value() { return SPINNINGNUKEICON____header_global_4032e99002554185; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:695
export const SMALLFNTCURSOR____header_global_b52e5fa62f8a01c4 = ((((((2821) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2b911386e6b684636be0f0dc() {
  return __cxx_static_address_2b911386e6b684636be0f0dc.reference || (__cxx_static_address_2b911386e6b684636be0f0dc.reference = {
    __cReference: true,
    get value() { return SMALLFNTCURSOR____header_global_b52e5fa62f8a01c4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:696
export const STARTALPHANUM____header_global_5c4de1e588e255d0 = ((((((2822) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3c899a1d89ffba7eaa94b6df() {
  return __cxx_static_address_3c899a1d89ffba7eaa94b6df.reference || (__cxx_static_address_3c899a1d89ffba7eaa94b6df.reference = {
    __cReference: true,
    get value() { return STARTALPHANUM____header_global_5c4de1e588e255d0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:697
export const ENDALPHANUM____header_global_f332ecdbc2648ac3 = ((((((2915) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_01dec8473dd99c3b9ea10c9e() {
  return __cxx_static_address_01dec8473dd99c3b9ea10c9e.reference || (__cxx_static_address_01dec8473dd99c3b9ea10c9e.reference = {
    __cReference: true,
    get value() { return ENDALPHANUM____header_global_f332ecdbc2648ac3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:698
export const BIGALPHANUM____header_global_62080eda5aae207a = ((((((2940) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b736a35c6c0f13ab07ffc1b7() {
  return __cxx_static_address_b736a35c6c0f13ab07ffc1b7.reference || (__cxx_static_address_b736a35c6c0f13ab07ffc1b7.reference = {
    __cReference: true,
    get value() { return BIGALPHANUM____header_global_62080eda5aae207a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:699
export const BIGPERIOD____header_global_f6be44982b394c51 = ((((((3002) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_57d57dde4c53a414470d37ea() {
  return __cxx_static_address_57d57dde4c53a414470d37ea.reference || (__cxx_static_address_57d57dde4c53a414470d37ea.reference = {
    __cReference: true,
    get value() { return BIGPERIOD____header_global_f6be44982b394c51; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:700
export const BIGCOMMA____header_global_a14e036bb57c90c9 = ((((((3003) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_20586d0239447680b6ec7ee2() {
  return __cxx_static_address_20586d0239447680b6ec7ee2.reference || (__cxx_static_address_20586d0239447680b6ec7ee2.reference = {
    __cReference: true,
    get value() { return BIGCOMMA____header_global_a14e036bb57c90c9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:701
export const BIGX____header_global_d570bb15fec5f21d = ((((((3004) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_79dc06d8f51ad58f6174a4eb() {
  return __cxx_static_address_79dc06d8f51ad58f6174a4eb.reference || (__cxx_static_address_79dc06d8f51ad58f6174a4eb.reference = {
    __cReference: true,
    get value() { return BIGX____header_global_d570bb15fec5f21d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:702
export const BIGQ____header_global_5ba98561ecb3ac1b = ((((((3005) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b86445ef78554c5e92a2f778() {
  return __cxx_static_address_b86445ef78554c5e92a2f778.reference || (__cxx_static_address_b86445ef78554c5e92a2f778.reference = {
    __cReference: true,
    get value() { return BIGQ____header_global_5ba98561ecb3ac1b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:703
export const BIGSEMI____header_global_38a942d5a9b29ca7 = ((((((3006) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ea36d6aa7c509c6d7f45bcd6() {
  return __cxx_static_address_ea36d6aa7c509c6d7f45bcd6.reference || (__cxx_static_address_ea36d6aa7c509c6d7f45bcd6.reference = {
    __cReference: true,
    get value() { return BIGSEMI____header_global_38a942d5a9b29ca7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:704
export const BIGCOLIN____header_global_e9f3e0e67767d5be = ((((((3007) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7a8774407261f46139e192fb() {
  return __cxx_static_address_7a8774407261f46139e192fb.reference || (__cxx_static_address_7a8774407261f46139e192fb.reference = {
    __cReference: true,
    get value() { return BIGCOLIN____header_global_e9f3e0e67767d5be; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:705
export const THREEBYFIVE____header_global_2ceec95da1779bbf = ((((((3010) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0114b429b6ac88c69119eab2() {
  return __cxx_static_address_0114b429b6ac88c69119eab2.reference || (__cxx_static_address_0114b429b6ac88c69119eab2.reference = {
    __cReference: true,
    get value() { return THREEBYFIVE____header_global_2ceec95da1779bbf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:706
export const BIGAPPOS____header_global_14ddbb5e3e01ebe2 = ((((((3022) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b3aa16aa6e30f1db20a3f123() {
  return __cxx_static_address_b3aa16aa6e30f1db20a3f123.reference || (__cxx_static_address_b3aa16aa6e30f1db20a3f123.reference = {
    __cReference: true,
    get value() { return BIGAPPOS____header_global_14ddbb5e3e01ebe2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:707
export const MINIFONT____header_global_839b5845caa194fe = ((((((3072) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_86583b2320eefcffc73411ae() {
  return __cxx_static_address_86583b2320eefcffc73411ae.reference || (__cxx_static_address_86583b2320eefcffc73411ae.reference = {
    __cReference: true,
    get value() { return MINIFONT____header_global_839b5845caa194fe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:708
export const RESPAWNMARKERRED____header_global_7ea7469818173c4e = ((((((3190) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_92ee6b46239be7e59c7c0d1e() {
  return __cxx_static_address_92ee6b46239be7e59c7c0d1e.reference || (__cxx_static_address_92ee6b46239be7e59c7c0d1e.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERRED____header_global_7ea7469818173c4e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:709
export const RESPAWNMARKERYELLOW____header_global_90b86bb82c0e2a3a = ((((((3200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_959eeaa72089106895ede870() {
  return __cxx_static_address_959eeaa72089106895ede870.reference || (__cxx_static_address_959eeaa72089106895ede870.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERYELLOW____header_global_90b86bb82c0e2a3a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:710
export const RESPAWNMARKERGREEN____header_global_87303cbd4c14ff51 = ((((((3210) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_995ff0d73bfb9263a311372b() {
  return __cxx_static_address_995ff0d73bfb9263a311372b.reference || (__cxx_static_address_995ff0d73bfb9263a311372b.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERGREEN____header_global_87303cbd4c14ff51; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:711
export const BONUSSCREEN____header_global_2cd39e7a504754f6 = ((((((3240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_caaa7c1954d55b37ee85dac2() {
  return __cxx_static_address_caaa7c1954d55b37ee85dac2.reference || (__cxx_static_address_caaa7c1954d55b37ee85dac2.reference = {
    __cReference: true,
    get value() { return BONUSSCREEN____header_global_2cd39e7a504754f6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:712
export const VIEWBORDER____header_global_6a090db2666c9c1f = ((((((3250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_84c59941b50b578d24d2e5d4() {
  return __cxx_static_address_84c59941b50b578d24d2e5d4.reference || (__cxx_static_address_84c59941b50b578d24d2e5d4.reference = {
    __cReference: true,
    get value() { return VIEWBORDER____header_global_6a090db2666c9c1f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:713
export const VICTORY1____header_global_c74b2ffb527dc569 = ((((((3260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2686fff0723a54618c5efa48() {
  return __cxx_static_address_2686fff0723a54618c5efa48.reference || (__cxx_static_address_2686fff0723a54618c5efa48.reference = {
    __cReference: true,
    get value() { return VICTORY1____header_global_c74b2ffb527dc569; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:714
export const ORDERING____header_global_7df7d2c3fdc8b5cd = ((((((3270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6ae98c97ec41f5b60ae556be() {
  return __cxx_static_address_6ae98c97ec41f5b60ae556be.reference || (__cxx_static_address_6ae98c97ec41f5b60ae556be.reference = {
    __cReference: true,
    get value() { return ORDERING____header_global_7df7d2c3fdc8b5cd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:715
export const TEXTSTORY____header_global_c16736f6200b5f5d = ((((((3280) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5e6dc3b8f2d19f3495bc8b55() {
  return __cxx_static_address_5e6dc3b8f2d19f3495bc8b55.reference || (__cxx_static_address_5e6dc3b8f2d19f3495bc8b55.reference = {
    __cReference: true,
    get value() { return TEXTSTORY____header_global_c16736f6200b5f5d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:716
export const LOADSCREEN____header_global_81ca1e68aa3a6b54 = ((((((3281) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5953d568330eb545ba65b7de() {
  return __cxx_static_address_5953d568330eb545ba65b7de.reference || (__cxx_static_address_5953d568330eb545ba65b7de.reference = {
    __cReference: true,
    get value() { return LOADSCREEN____header_global_81ca1e68aa3a6b54; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:717
export const BORNTOBEWILDSCREEN____header_global_084974b0bb12f810 = ((((((3370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_95a257bd1f42388c58c9e273() {
  return __cxx_static_address_95a257bd1f42388c58c9e273.reference || (__cxx_static_address_95a257bd1f42388c58c9e273.reference = {
    __cReference: true,
    get value() { return BORNTOBEWILDSCREEN____header_global_084974b0bb12f810; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:718
export const BLIMP____header_global_43fea9372e627192 = ((((((3400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1cfb09c64fca6f4e3b95983c() {
  return __cxx_static_address_1cfb09c64fca6f4e3b95983c.reference || (__cxx_static_address_1cfb09c64fca6f4e3b95983c.reference = {
    __cReference: true,
    get value() { return BLIMP____header_global_43fea9372e627192; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:719
export const FEM9____header_global_3bd224c21febe3bb = ((((((3450) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_40e9f58e93717e68bb9efc67() {
  return __cxx_static_address_40e9f58e93717e68bb9efc67.reference || (__cxx_static_address_40e9f58e93717e68bb9efc67.reference = {
    __cReference: true,
    get value() { return FEM9____header_global_3bd224c21febe3bb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:720
export const FRAMEEFFECT1_13____header_global_3abd23c537529a61 = ((((((3999) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_42d93c804263d4842dff84cf() {
  return __cxx_static_address_42d93c804263d4842dff84cf.reference || (__cxx_static_address_42d93c804263d4842dff84cf.reference = {
    __cReference: true,
    get value() { return FRAMEEFFECT1_13____header_global_3abd23c537529a61; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:721
export const FRAMEEFFECT1____header_global_3d1176d549c389bb = ((((((4095) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e2cfb6602e96ff080e15dded() {
  return __cxx_static_address_e2cfb6602e96ff080e15dded.reference || (__cxx_static_address_e2cfb6602e96ff080e15dded.reference = {
    __cReference: true,
    get value() { return FRAMEEFFECT1____header_global_3d1176d549c389bb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:722
export const PANNEL3____header_global_75065402f303f520 = ((((((4099) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_70b2ea30a3fb38fbb5a0d51a() {
  return __cxx_static_address_70b2ea30a3fb38fbb5a0d51a.reference || (__cxx_static_address_70b2ea30a3fb38fbb5a0d51a.reference = {
    __cReference: true,
    get value() { return PANNEL3____header_global_75065402f303f520; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:723
export const SCREENBREAK14____header_global_e16672155a14abc0 = ((((((4120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aefbcfdc4955612f2f890772() {
  return __cxx_static_address_aefbcfdc4955612f2f890772.reference || (__cxx_static_address_aefbcfdc4955612f2f890772.reference = {
    __cReference: true,
    get value() { return SCREENBREAK14____header_global_e16672155a14abc0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:724
export const SCREENBREAK15____header_global_4d3af1b1e4ae8b4a = ((((((4123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b56751e1979b53be2ba81d33() {
  return __cxx_static_address_b56751e1979b53be2ba81d33.reference || (__cxx_static_address_b56751e1979b53be2ba81d33.reference = {
    __cReference: true,
    get value() { return SCREENBREAK15____header_global_4d3af1b1e4ae8b4a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:725
export const SCREENBREAK19____header_global_7060d376f8617cd7 = ((((((4125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cf2d3532aba9347f25453323() {
  return __cxx_static_address_cf2d3532aba9347f25453323.reference || (__cxx_static_address_cf2d3532aba9347f25453323.reference = {
    __cReference: true,
    get value() { return SCREENBREAK19____header_global_7060d376f8617cd7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:726
export const SCREENBREAK16____header_global_55c945120fea9459 = ((((((4127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_645d3a8b587de80406cd481d() {
  return __cxx_static_address_645d3a8b587de80406cd481d.reference || (__cxx_static_address_645d3a8b587de80406cd481d.reference = {
    __cReference: true,
    get value() { return SCREENBREAK16____header_global_55c945120fea9459; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:727
export const SCREENBREAK17____header_global_af8c0e2971b295a8 = ((((((4128) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_505bb4ae35982e54c4d58d11() {
  return __cxx_static_address_505bb4ae35982e54c4d58d11.reference || (__cxx_static_address_505bb4ae35982e54c4d58d11.reference = {
    __cReference: true,
    get value() { return SCREENBREAK17____header_global_af8c0e2971b295a8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:728
export const SCREENBREAK18____header_global_1553bade5be0fefd = ((((((4129) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5554742236335596ebcdcad2() {
  return __cxx_static_address_5554742236335596ebcdcad2.reference || (__cxx_static_address_5554742236335596ebcdcad2.reference = {
    __cReference: true,
    get value() { return SCREENBREAK18____header_global_1553bade5be0fefd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:729
export const W_TECHWALL11____header_global_b3f0565fff6603b2 = ((((((4130) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0c99b0ae6057a54d124853bb() {
  return __cxx_static_address_0c99b0ae6057a54d124853bb.reference || (__cxx_static_address_0c99b0ae6057a54d124853bb.reference = {
    __cReference: true,
    get value() { return W_TECHWALL11____header_global_b3f0565fff6603b2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:730
export const W_TECHWALL12____header_global_e7a670c1e9ce3050 = ((((((4131) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6279c386343b48bbcc59d79e() {
  return __cxx_static_address_6279c386343b48bbcc59d79e.reference || (__cxx_static_address_6279c386343b48bbcc59d79e.reference = {
    __cReference: true,
    get value() { return W_TECHWALL12____header_global_e7a670c1e9ce3050; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:731
export const W_TECHWALL13____header_global_8e68272db651ffcc = ((((((4132) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d544cb60d77ae537e1c080a2() {
  return __cxx_static_address_d544cb60d77ae537e1c080a2.reference || (__cxx_static_address_d544cb60d77ae537e1c080a2.reference = {
    __cReference: true,
    get value() { return W_TECHWALL13____header_global_8e68272db651ffcc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:732
export const W_TECHWALL14____header_global_190030730c9ad5e5 = ((((((4133) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_00fb0e223cc70fcb896b725e() {
  return __cxx_static_address_00fb0e223cc70fcb896b725e.reference || (__cxx_static_address_00fb0e223cc70fcb896b725e.reference = {
    __cReference: true,
    get value() { return W_TECHWALL14____header_global_190030730c9ad5e5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:733
export const W_TECHWALL5____header_global_64ba3caca08ec237 = ((((((4134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_425cab7e0544a678d5ecc769() {
  return __cxx_static_address_425cab7e0544a678d5ecc769.reference || (__cxx_static_address_425cab7e0544a678d5ecc769.reference = {
    __cReference: true,
    get value() { return W_TECHWALL5____header_global_64ba3caca08ec237; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:734
export const W_TECHWALL6____header_global_8963e11768940ff6 = ((((((4136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8e24f7a05f9d2a92e303dfea() {
  return __cxx_static_address_8e24f7a05f9d2a92e303dfea.reference || (__cxx_static_address_8e24f7a05f9d2a92e303dfea.reference = {
    __cReference: true,
    get value() { return W_TECHWALL6____header_global_8963e11768940ff6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:735
export const W_TECHWALL7____header_global_a8db9988351da7a7 = ((((((4138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6c99742e1ee813f61e9e678c() {
  return __cxx_static_address_6c99742e1ee813f61e9e678c.reference || (__cxx_static_address_6c99742e1ee813f61e9e678c.reference = {
    __cReference: true,
    get value() { return W_TECHWALL7____header_global_a8db9988351da7a7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:736
export const W_TECHWALL8____header_global_36a2fa2c18b453ca = ((((((4140) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_16dc583a737482b70f918c70() {
  return __cxx_static_address_16dc583a737482b70f918c70.reference || (__cxx_static_address_16dc583a737482b70f918c70.reference = {
    __cReference: true,
    get value() { return W_TECHWALL8____header_global_36a2fa2c18b453ca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:737
export const W_TECHWALL9____header_global_014371f19b8db570 = ((((((4142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_67b60b4133e7e17531804d3e() {
  return __cxx_static_address_67b60b4133e7e17531804d3e.reference || (__cxx_static_address_67b60b4133e7e17531804d3e.reference = {
    __cReference: true,
    get value() { return W_TECHWALL9____header_global_014371f19b8db570; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:738
export const BPANNEL3____header_global_3046942c4843298f = ((((((4100) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7671041b6b754c317a63b6b7() {
  return __cxx_static_address_7671041b6b754c317a63b6b7.reference || (__cxx_static_address_7671041b6b754c317a63b6b7.reference = {
    __cReference: true,
    get value() { return BPANNEL3____header_global_3046942c4843298f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:739
export const W_HITTECHWALL16____header_global_9fc0685ce5d1f158 = ((((((4144) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0bc4ea4c675413f43ccdb2ac() {
  return __cxx_static_address_0bc4ea4c675413f43ccdb2ac.reference || (__cxx_static_address_0bc4ea4c675413f43ccdb2ac.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL16____header_global_9fc0685ce5d1f158; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:740
export const W_HITTECHWALL10____header_global_1f0a52dc162b4f35 = ((((((4145) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_64b7aae4f374ed62e69e8ab2() {
  return __cxx_static_address_64b7aae4f374ed62e69e8ab2.reference || (__cxx_static_address_64b7aae4f374ed62e69e8ab2.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL10____header_global_1f0a52dc162b4f35; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:741
export const W_HITTECHWALL15____header_global_c1638d88992377d6 = ((((((4147) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8669904ed5c84734ba4eeb05() {
  return __cxx_static_address_8669904ed5c84734ba4eeb05.reference || (__cxx_static_address_8669904ed5c84734ba4eeb05.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL15____header_global_c1638d88992377d6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:742
export const W_MILKSHELF____header_global_7cb00b82436331f6 = ((((((4181) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_83e2573b1e04b1c61c5afee1() {
  return __cxx_static_address_83e2573b1e04b1c61c5afee1.reference || (__cxx_static_address_83e2573b1e04b1c61c5afee1.reference = {
    __cReference: true,
    get value() { return W_MILKSHELF____header_global_7cb00b82436331f6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:743
export const W_MILKSHELFBROKE____header_global_f3e821a38a55e07e = ((((((4203) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9fc387194239cbdd1787c100() {
  return __cxx_static_address_9fc387194239cbdd1787c100.reference || (__cxx_static_address_9fc387194239cbdd1787c100.reference = {
    __cReference: true,
    get value() { return W_MILKSHELFBROKE____header_global_f3e821a38a55e07e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:744
export const PURPLELAVA____header_global_327f487035905550 = ((((((4240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0fa88b844784008de76bc067() {
  return __cxx_static_address_0fa88b844784008de76bc067.reference || (__cxx_static_address_0fa88b844784008de76bc067.reference = {
    __cReference: true,
    get value() { return PURPLELAVA____header_global_327f487035905550; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:745
export const TARGET____header_global_ec5b4e6e43fef857 = ((((((4359) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c949e3f541e15128576d86f7() {
  return __cxx_static_address_c949e3f541e15128576d86f7.reference || (__cxx_static_address_c949e3f541e15128576d86f7.reference = {
    __cReference: true,
    get value() { return TARGET____header_global_ec5b4e6e43fef857; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:746
export const DUCK____header_global_a843d2d97b7a2a2e = ((((((4361) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_16b94565638b9c8315b8a22d() {
  return __cxx_static_address_16b94565638b9c8315b8a22d.reference || (__cxx_static_address_16b94565638b9c8315b8a22d.reference = {
    __cReference: true,
    get value() { return DUCK____header_global_a843d2d97b7a2a2e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:747
export const PUKE____header_global_016f78bcb782b2de = ((((((4389) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_643066a2a5baf44aca50197b() {
  return __cxx_static_address_643066a2a5baf44aca50197b.reference || (__cxx_static_address_643066a2a5baf44aca50197b.reference = {
    __cReference: true,
    get value() { return PUKE____header_global_016f78bcb782b2de; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:748
export const DOORTILE23____header_global_51ebf5af9f586f0e = ((((((4391) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5008d3c3488148f27ad7a082() {
  return __cxx_static_address_5008d3c3488148f27ad7a082.reference || (__cxx_static_address_5008d3c3488148f27ad7a082.reference = {
    __cReference: true,
    get value() { return DOORTILE23____header_global_51ebf5af9f586f0e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:749
export const SPEAKER____header_global_28f5e838deaa91f8 = ((((((4397) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2271b4bd4797a52475b831e4() {
  return __cxx_static_address_2271b4bd4797a52475b831e4.reference || (__cxx_static_address_2271b4bd4797a52475b831e4.reference = {
    __cReference: true,
    get value() { return SPEAKER____header_global_28f5e838deaa91f8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:750
export const MAIL____header_global_76e5bc228a3e357d = ((((((4410) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_72672ea2a21d3a77c7c8dd7b() {
  return __cxx_static_address_72672ea2a21d3a77c7c8dd7b.reference || (__cxx_static_address_72672ea2a21d3a77c7c8dd7b.reference = {
    __cReference: true,
    get value() { return MAIL____header_global_76e5bc228a3e357d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:751
export const HOTMEAT____header_global_c83db49e4ca665e9 = ((((((4427) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4a2c9a8a9c92bb6060ef1b37() {
  return __cxx_static_address_4a2c9a8a9c92bb6060ef1b37.reference || (__cxx_static_address_4a2c9a8a9c92bb6060ef1b37.reference = {
    __cReference: true,
    get value() { return HOTMEAT____header_global_c83db49e4ca665e9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:752
export const TRIPODCAMERA____header_global_71b317cc63455bc1 = ((((((4444) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_98d1570ff3ffe07c65f452b6() {
  return __cxx_static_address_98d1570ff3ffe07c65f452b6.reference || (__cxx_static_address_98d1570ff3ffe07c65f452b6.reference = {
    __cReference: true,
    get value() { return TRIPODCAMERA____header_global_71b317cc63455bc1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:753
export const PAPER____header_global_437bb42782da1c09 = ((((((4460) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_de546689880d040e7fed4f5b() {
  return __cxx_static_address_de546689880d040e7fed4f5b.reference || (__cxx_static_address_de546689880d040e7fed4f5b.reference = {
    __cReference: true,
    get value() { return PAPER____header_global_437bb42782da1c09; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:754
export const GENERICPOLE2____header_global_469ba6910253050f = ((((((4465) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_45f2d956a3d2b4f29dc32d7c() {
  return __cxx_static_address_45f2d956a3d2b4f29dc32d7c.reference || (__cxx_static_address_45f2d956a3d2b4f29dc32d7c.reference = {
    __cReference: true,
    get value() { return GENERICPOLE2____header_global_469ba6910253050f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:755
export const XXXSTACY____header_global_8e68d2d0235b5097 = ((((((4470) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dbddd66a4665a11a581202d4() {
  return __cxx_static_address_dbddd66a4665a11a581202d4.reference || (__cxx_static_address_dbddd66a4665a11a581202d4.reference = {
    __cReference: true,
    get value() { return XXXSTACY____header_global_8e68d2d0235b5097; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:756
export const LETTER____header_global_51311c49ffbb8883 = ((((((4502) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_69b0723b6e19b37cd0439fce() {
  return __cxx_static_address_69b0723b6e19b37cd0439fce.reference || (__cxx_static_address_69b0723b6e19b37cd0439fce.reference = {
    __cReference: true,
    get value() { return LETTER____header_global_51311c49ffbb8883; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:757
export const SIDEBOLT1____header_global_57e075e134294a25 = ((((((4525) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1bb6e622fced4e047e6e2d7f() {
  return __cxx_static_address_1bb6e622fced4e047e6e2d7f.reference || (__cxx_static_address_1bb6e622fced4e047e6e2d7f.reference = {
    __cReference: true,
    get value() { return SIDEBOLT1____header_global_57e075e134294a25; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:758
export const FOODOBJECT16____header_global_99a3333824c8f255 = ((((((4545) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8ab9b9d04a4ef80202fe73f3() {
  return __cxx_static_address_8ab9b9d04a4ef80202fe73f3.reference || (__cxx_static_address_8ab9b9d04a4ef80202fe73f3.reference = {
    __cReference: true,
    get value() { return FOODOBJECT16____header_global_99a3333824c8f255; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:759
export const TAMPON____header_global_1241bf87ee4277ff = ((((((4557) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0b0c6aec350bf6928c9f7f7a() {
  return __cxx_static_address_0b0c6aec350bf6928c9f7f7a.reference || (__cxx_static_address_0b0c6aec350bf6928c9f7f7a.reference = {
    __cReference: true,
    get value() { return TAMPON____header_global_1241bf87ee4277ff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:760
export const CANWITHSOMETHING2____header_global_7e6435dfb70e8832 = ((((((4580) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b424755fa8e46f56089527de() {
  return __cxx_static_address_b424755fa8e46f56089527de.reference || (__cxx_static_address_b424755fa8e46f56089527de.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING2____header_global_7e6435dfb70e8832; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:761
export const CANWITHSOMETHING3____header_global_fd319e5e18102169 = ((((((4581) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cd494809709711b26c675992() {
  return __cxx_static_address_cd494809709711b26c675992.reference || (__cxx_static_address_cd494809709711b26c675992.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING3____header_global_fd319e5e18102169; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:762
export const CANWITHSOMETHING4____header_global_45c2bdbc24b18881 = ((((((4582) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bffec184eee0597fe22a769d() {
  return __cxx_static_address_bffec184eee0597fe22a769d.reference || (__cxx_static_address_bffec184eee0597fe22a769d.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING4____header_global_45c2bdbc24b18881; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:763
export const DOLPHIN1____header_global_6c32863b418b819c = ((((((4591) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f50b1b0209f73e0867392ec6() {
  return __cxx_static_address_f50b1b0209f73e0867392ec6.reference || (__cxx_static_address_f50b1b0209f73e0867392ec6.reference = {
    __cReference: true,
    get value() { return DOLPHIN1____header_global_6c32863b418b819c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:764
export const DOLPHIN2____header_global_6c8f07dfbb58d057 = ((((((4592) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d05e9687a97dffc9f9b17563() {
  return __cxx_static_address_d05e9687a97dffc9f9b17563.reference || (__cxx_static_address_d05e9687a97dffc9f9b17563.reference = {
    __cReference: true,
    get value() { return DOLPHIN2____header_global_6c8f07dfbb58d057; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:765
export const NEWBEAST____header_global_8ab193953c096dbe = ((((((4610) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d4eac374c6f7d68a24330c41() {
  return __cxx_static_address_d4eac374c6f7d68a24330c41.reference || (__cxx_static_address_d4eac374c6f7d68a24330c41.reference = {
    __cReference: true,
    get value() { return NEWBEAST____header_global_8ab193953c096dbe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:766
export const NEWBEASTSTAYPUT____header_global_63194fcc8b32df15 = ((((((4611) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_23f6dc120467d05308c5fce8() {
  return __cxx_static_address_23f6dc120467d05308c5fce8.reference || (__cxx_static_address_23f6dc120467d05308c5fce8.reference = {
    __cReference: true,
    get value() { return NEWBEASTSTAYPUT____header_global_63194fcc8b32df15; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:767
export const BOSS4____header_global_f82c93e76ef4bc53 = ((((((4740) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ad2d277f7e3e24588eb35618() {
  return __cxx_static_address_ad2d277f7e3e24588eb35618.reference || (__cxx_static_address_ad2d277f7e3e24588eb35618.reference = {
    __cReference: true,
    get value() { return BOSS4____header_global_f82c93e76ef4bc53; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:768
export const BOSS4STAYPUT____header_global_09510f17231c2f3d = ((((((4741) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c25e94ccc4cc75cabcf1f946() {
  return __cxx_static_address_c25e94ccc4cc75cabcf1f946.reference || (__cxx_static_address_c25e94ccc4cc75cabcf1f946.reference = {
    __cReference: true,
    get value() { return BOSS4STAYPUT____header_global_09510f17231c2f3d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:769
export const FEM10____header_global_7ddac940a5d5886a = ((((((4864) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cc4a6e9cd120f74cf87e5137() {
  return __cxx_static_address_cc4a6e9cd120f74cf87e5137.reference || (__cxx_static_address_cc4a6e9cd120f74cf87e5137.reference = {
    __cReference: true,
    get value() { return FEM10____header_global_7ddac940a5d5886a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:770
export const TOUGHGAL____header_global_a126c595861a8d1f = ((((((4866) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c7ab96c92984d0605b7db686() {
  return __cxx_static_address_c7ab96c92984d0605b7db686.reference || (__cxx_static_address_c7ab96c92984d0605b7db686.reference = {
    __cReference: true,
    get value() { return TOUGHGAL____header_global_a126c595861a8d1f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:771
export const MAN____header_global_7c312747f1efcab8 = ((((((4871) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_38529d1b6b1d4c9b3ad7baae() {
  return __cxx_static_address_38529d1b6b1d4c9b3ad7baae.reference || (__cxx_static_address_38529d1b6b1d4c9b3ad7baae.reference = {
    __cReference: true,
    get value() { return MAN____header_global_7c312747f1efcab8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:772
export const MAN2____header_global_6e5d41994f342db1 = ((((((4872) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bffd26d5bc523b7d702895d8() {
  return __cxx_static_address_bffd26d5bc523b7d702895d8.reference || (__cxx_static_address_bffd26d5bc523b7d702895d8.reference = {
    __cReference: true,
    get value() { return MAN2____header_global_6e5d41994f342db1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:773
export const WOMAN____header_global_e8be42429a7d22d5 = ((((((4874) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_40d6cf45cceec4e75231291d() {
  return __cxx_static_address_40d6cf45cceec4e75231291d.reference || (__cxx_static_address_40d6cf45cceec4e75231291d.reference = {
    __cReference: true,
    get value() { return WOMAN____header_global_e8be42429a7d22d5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:774
export const NATURALLIGHTNING____header_global_c0b707a588f46dfc = ((((((4890) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_43c3d93ba22bab9d3a15b07f() {
  return __cxx_static_address_43c3d93ba22bab9d3a15b07f.reference || (__cxx_static_address_43c3d93ba22bab9d3a15b07f.reference = {
    __cReference: true,
    get value() { return NATURALLIGHTNING____header_global_c0b707a588f46dfc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:775
export const WEATHERWARN____header_global_165caecfd8bc25b5 = ((((((4893) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_52e06dca6a9f7898c1bde54c() {
  return __cxx_static_address_52e06dca6a9f7898c1bde54c.reference || (__cxx_static_address_52e06dca6a9f7898c1bde54c.reference = {
    __cReference: true,
    get value() { return WEATHERWARN____header_global_165caecfd8bc25b5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:776
export const DUKETAG____header_global_3240514a9b3f050c = ((((((4900) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fd01966625d0e8b928269711() {
  return __cxx_static_address_fd01966625d0e8b928269711.reference || (__cxx_static_address_fd01966625d0e8b928269711.reference = {
    __cReference: true,
    get value() { return DUKETAG____header_global_3240514a9b3f050c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:777
export const SIGN1____header_global_d94970d3891a2867 = ((((((4909) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_144f1982daf77b9943f6ad3d() {
  return __cxx_static_address_144f1982daf77b9943f6ad3d.reference || (__cxx_static_address_144f1982daf77b9943f6ad3d.reference = {
    __cReference: true,
    get value() { return SIGN1____header_global_d94970d3891a2867; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:778
export const SIGN2____header_global_d42f020761a49269 = ((((((4912) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4896b823e178febe6b7d82f8() {
  return __cxx_static_address_4896b823e178febe6b7d82f8.reference || (__cxx_static_address_4896b823e178febe6b7d82f8.reference = {
    __cReference: true,
    get value() { return SIGN2____header_global_d42f020761a49269; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:779
export const JURYGUY____header_global_4469e3eb8f8ec2d8 = ((((((4943) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_931af10e697493e4fab2b63d() {
  return __cxx_static_address_931af10e697493e4fab2b63d.reference || (__cxx_static_address_931af10e697493e4fab2b63d.reference = {
    __cReference: true,
    get value() { return JURYGUY____header_global_4469e3eb8f8ec2d8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:780
export const WIDESCREENSTATUSBAR____header_global_720c018a1e75cddb = ((((((5120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_515296d418b8cf149da6cf19() {
  return __cxx_static_address_515296d418b8cf149da6cf19.reference || (__cxx_static_address_515296d418b8cf149da6cf19.reference = {
    __cReference: true,
    get value() { return WIDESCREENSTATUSBAR____header_global_720c018a1e75cddb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:781
export const RPGGUNWIDE____header_global_17ccb5beb38583f7 = ((((((5121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_61f5815ed745e6579c7dd9b4() {
  return __cxx_static_address_61f5815ed745e6579c7dd9b4.reference || (__cxx_static_address_61f5815ed745e6579c7dd9b4.reference = {
    __cReference: true,
    get value() { return RPGGUNWIDE____header_global_17ccb5beb38583f7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:782
export const FIRSTGUNRELOADWIDE____header_global_5aefe07f37a28f82 = ((((((5122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4deb9d522be6b35230058ae7() {
  return __cxx_static_address_4deb9d522be6b35230058ae7.reference || (__cxx_static_address_4deb9d522be6b35230058ae7.reference = {
    __cReference: true,
    get value() { return FIRSTGUNRELOADWIDE____header_global_5aefe07f37a28f82; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:783
export const FREEZEWIDE____header_global_3a732484d350802b = ((((((5123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c04d5feb546fa3f36377fb48() {
  return __cxx_static_address_c04d5feb546fa3f36377fb48.reference || (__cxx_static_address_c04d5feb546fa3f36377fb48.reference = {
    __cReference: true,
    get value() { return FREEZEWIDE____header_global_3a732484d350802b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:784
export const FREEZEFIREWIDE____header_global_e9bf05d8b162a3a1 = ((((((5124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_78d0a2ebced98a71ce6f19bf() {
  return __cxx_static_address_78d0a2ebced98a71ce6f19bf.reference || (__cxx_static_address_78d0a2ebced98a71ce6f19bf.reference = {
    __cReference: true,
    get value() { return FREEZEFIREWIDE____header_global_e9bf05d8b162a3a1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:785
export const SHRINKERWIDE____header_global_42a0f47d33c48b58 = ((((((5127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0979124dd86b9fa4360b00c2() {
  return __cxx_static_address_0979124dd86b9fa4360b00c2.reference || (__cxx_static_address_0979124dd86b9fa4360b00c2.reference = {
    __cReference: true,
    get value() { return SHRINKERWIDE____header_global_42a0f47d33c48b58; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:786
export const CRACKKNUCKLESWIDE____header_global_8db1c0e6a6552639 = ((((((5129) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9655fbc99584ffd6c155fe7d() {
  return __cxx_static_address_9655fbc99584ffd6c155fe7d.reference || (__cxx_static_address_9655fbc99584ffd6c155fe7d.reference = {
    __cReference: true,
    get value() { return CRACKKNUCKLESWIDE____header_global_8db1c0e6a6552639; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:787
export const FLAMETHROWERSPRITE____header_global_4977f5be19e73200 = ((((((5134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_13551476bc8d69b3b58d480c() {
  return __cxx_static_address_13551476bc8d69b3b58d480c.reference || (__cxx_static_address_13551476bc8d69b3b58d480c.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERSPRITE____header_global_4977f5be19e73200; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:788
export const FLAMETHROWERAMMO____header_global_d7b761085423d67e = ((((((5135) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2cc92f19bdb1531c71fb2c62() {
  return __cxx_static_address_2cc92f19bdb1531c71fb2c62.reference || (__cxx_static_address_2cc92f19bdb1531c71fb2c62.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERAMMO____header_global_d7b761085423d67e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:789
export const FLAMETHROWER____header_global_1a8cfc1402f8033e = ((((((5138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aef79c5a0f6da4e1ba5ca721() {
  return __cxx_static_address_aef79c5a0f6da4e1ba5ca721.reference || (__cxx_static_address_aef79c5a0f6da4e1ba5ca721.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER____header_global_1a8cfc1402f8033e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:790
export const FLAMETHROWERFIRE____header_global_5a5e42e90f30c93d = ((((((5139) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_22dcc9fa31a4b8469723c54b() {
  return __cxx_static_address_22dcc9fa31a4b8469723c54b.reference || (__cxx_static_address_22dcc9fa31a4b8469723c54b.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERFIRE____header_global_5a5e42e90f30c93d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:791
export const FLAMETHROWERFLAME____header_global_5e725743b927c0e8 = ((((((1891) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_82ba1aecc7b130a48051e96f() {
  return __cxx_static_address_82ba1aecc7b130a48051e96f.reference || (__cxx_static_address_82ba1aecc7b130a48051e96f.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERFLAME____header_global_5e725743b927c0e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:792
export const FLAMETHROWERPILOT____header_global_30b867446c0cd849 = ((((((5174) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4e1b23a484b482e0c5330c87() {
  return __cxx_static_address_4e1b23a484b482e0c5330c87.reference || (__cxx_static_address_4e1b23a484b482e0c5330c87.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERPILOT____header_global_30b867446c0cd849; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:793
export const FIREBALL____header_global_537d75e761b099dc = ((((((5163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c58dc44ae26fb55e8e3754f3() {
  return __cxx_static_address_c58dc44ae26fb55e8e3754f3.reference || (__cxx_static_address_c58dc44ae26fb55e8e3754f3.reference = {
    __cReference: true,
    get value() { return FIREBALL____header_global_537d75e761b099dc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:794
export const ONFIRE____header_global_2ac52924865dc045 = ((((((5152) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_de9c3d8b1117a7f9827070b8() {
  return __cxx_static_address_de9c3d8b1117a7f9827070b8.reference || (__cxx_static_address_de9c3d8b1117a7f9827070b8.reference = {
    __cReference: true,
    get value() { return ONFIRE____header_global_2ac52924865dc045; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:795
export const ONFIRESMOKE____header_global_fd3479afee37bebe = ((((((5143) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_27c292406a77a66c9fbbe9a8() {
  return __cxx_static_address_27c292406a77a66c9fbbe9a8.reference || (__cxx_static_address_27c292406a77a66c9fbbe9a8.reference = {
    __cReference: true,
    get value() { return ONFIRESMOKE____header_global_fd3479afee37bebe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:796
export const BURNEDCORPSE____header_global_0d74db1ed1bd991d = ((((((5173) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8111663ff3e5fe14047d3440() {
  return __cxx_static_address_8111663ff3e5fe14047d3440.reference || (__cxx_static_address_8111663ff3e5fe14047d3440.reference = {
    __cReference: true,
    get value() { return BURNEDCORPSE____header_global_0d74db1ed1bd991d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:797
export const WHISPYSMOKE____header_global_3d1dad89d4392a7b = ((((((5268) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_830e9bac32dfb221668fca11() {
  return __cxx_static_address_830e9bac32dfb221668fca11.reference || (__cxx_static_address_830e9bac32dfb221668fca11.reference = {
    __cReference: true,
    get value() { return WHISPYSMOKE____header_global_3d1dad89d4392a7b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:798
export const FIREFLY____header_global_dec3d6ca9dceb422 = ((((((5180) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_262f4a7ded4a0e072c2a85c9() {
  return __cxx_static_address_262f4a7ded4a0e072c2a85c9.reference || (__cxx_static_address_262f4a7ded4a0e072c2a85c9.reference = {
    __cReference: true,
    get value() { return FIREFLY____header_global_dec3d6ca9dceb422; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:799
export const FIREFLYSHRINKEFFECT____header_global_fb24778b03bf8db2 = ((((((5360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6080675978a8aa775b745c74() {
  return __cxx_static_address_6080675978a8aa775b745c74.reference || (__cxx_static_address_6080675978a8aa775b745c74.reference = {
    __cReference: true,
    get value() { return FIREFLYSHRINKEFFECT____header_global_fb24778b03bf8db2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:800
export const FIREFLYGROWEFFECT____header_global_039f549fb610ed3d = ((((((5367) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b1917be39c123944922b1796() {
  return __cxx_static_address_b1917be39c123944922b1796.reference || (__cxx_static_address_b1917be39c123944922b1796.reference = {
    __cReference: true,
    get value() { return FIREFLYGROWEFFECT____header_global_039f549fb610ed3d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:801
export const FIREFLYFLYINGEFFECT____header_global_310e9ca8d463335a = ((((((5296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3f2912c169933f93586d2996() {
  return __cxx_static_address_3f2912c169933f93586d2996.reference || (__cxx_static_address_3f2912c169933f93586d2996.reference = {
    __cReference: true,
    get value() { return FIREFLYFLYINGEFFECT____header_global_310e9ca8d463335a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:802
export const BOSS5____header_global_e8fcd07d39a6f8e8 = ((((((5310) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_70a359973f004bca69648ed0() {
  return __cxx_static_address_70a359973f004bca69648ed0.reference || (__cxx_static_address_70a359973f004bca69648ed0.reference = {
    __cReference: true,
    get value() { return BOSS5____header_global_e8fcd07d39a6f8e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:803
export const BOSS5STAYPUT____header_global_30700de51634857f = ((((((5311) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9d4744af3165f01c8aac0954() {
  return __cxx_static_address_9d4744af3165f01c8aac0954.reference || (__cxx_static_address_9d4744af3165f01c8aac0954.reference = {
    __cReference: true,
    get value() { return BOSS5STAYPUT____header_global_30700de51634857f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:804
export const LAVAPOOL____header_global_44766d57a52859d1 = ((((((5304) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eb254ff6236ce3dc0ad7d181() {
  return __cxx_static_address_eb254ff6236ce3dc0ad7d181.reference || (__cxx_static_address_eb254ff6236ce3dc0ad7d181.reference = {
    __cReference: true,
    get value() { return LAVAPOOL____header_global_44766d57a52859d1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:805
export const LAVASPLASH____header_global_916dee2f44cbb4ea = ((((((5371) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_78389787476788dd9820b323() {
  return __cxx_static_address_78389787476788dd9820b323.reference || (__cxx_static_address_78389787476788dd9820b323.reference = {
    __cReference: true,
    get value() { return LAVASPLASH____header_global_916dee2f44cbb4ea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:806
export const LAVAPOOLBUBBLE____header_global_8cd5dc4bbdaf50d9 = ((((((5207) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_94e6667f71cb5eed0b353442() {
  return __cxx_static_address_94e6667f71cb5eed0b353442.reference || (__cxx_static_address_94e6667f71cb5eed0b353442.reference = {
    __cReference: true,
    get value() { return LAVAPOOLBUBBLE____header_global_8cd5dc4bbdaf50d9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:807
export const BOSS2STAYPUT____header_global_2e07f4a108dda69d = ((((((2711) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2735c14292262791ee1ac1d4() {
  return __cxx_static_address_2735c14292262791ee1ac1d4.reference || (__cxx_static_address_2735c14292262791ee1ac1d4.reference = {
    __cReference: true,
    get value() { return BOSS2STAYPUT____header_global_2e07f4a108dda69d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:808
export const BOSS3STAYPUT____header_global_8878cb5b80d38821 = ((((((2761) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_176c7cb6a7eabda03516f4ea() {
  return __cxx_static_address_176c7cb6a7eabda03516f4ea.reference || (__cxx_static_address_176c7cb6a7eabda03516f4ea.reference = {
    __cReference: true,
    get value() { return BOSS3STAYPUT____header_global_8878cb5b80d38821; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:809
export const E32_TILE5736____header_global_d0097d97308c4a68 = ((((((5736) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d3c28f1e6ce80f8814bac5ca() {
  return __cxx_static_address_d3c28f1e6ce80f8814bac5ca.reference || (__cxx_static_address_d3c28f1e6ce80f8814bac5ca.reference = {
    __cReference: true,
    get value() { return E32_TILE5736____header_global_d0097d97308c4a68; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:810
export const E32_TILE5737____header_global_d917139f7a8b9114 = ((((((5737) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ec2d9b966f15755b991f62bd() {
  return __cxx_static_address_ec2d9b966f15755b991f62bd.reference || (__cxx_static_address_ec2d9b966f15755b991f62bd.reference = {
    __cReference: true,
    get value() { return E32_TILE5737____header_global_d917139f7a8b9114; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:811
export const E32_TILE5846____header_global_b378d7cd6ee20237 = ((((((5846) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_43637353be63c64d3f94fcbf() {
  return __cxx_static_address_43637353be63c64d3f94fcbf.reference || (__cxx_static_address_43637353be63c64d3f94fcbf.reference = {
    __cReference: true,
    get value() { return E32_TILE5846____header_global_b378d7cd6ee20237; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/network.h:180
export const cSnapshotMemUsage__header_global_9a00cc0b09a77e97 = u64((BigInt(u64(64)) * BigInt((BigInt((BigInt((BigInt(72) * BigInt(u64(16384)))) + BigInt((BigInt(96) * BigInt(u64(4096)))))) + BigInt((BigInt(296) * BigInt(u64(16384))))))));
function __cxx_static_address_88a6636862297601a9db7304() {
  return __cxx_static_address_88a6636862297601a9db7304.reference || (__cxx_static_address_88a6636862297601a9db7304.reference = {
    __cReference: true,
    get value() { return cSnapshotMemUsage__header_global_9a00cc0b09a77e97; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/cheats.cpp:28
export let CheatStrings = [(() => { const row = new Uint8Array(20); row.set([99, 111, 114, 110, 104, 111, 108, 105, 111]); return row; })(), (() => { const row = new Uint8Array(20); row.set([115, 116, 117, 102, 102]); return row; })(), (() => { const row = new Uint8Array(20); row.set([115, 99, 111, 116, 116, 121, 35, 35, 35]); return row; })(), (() => { const row = new Uint8Array(20); row.set([99, 111, 111, 114, 100, 115]); return row; })(), (() => { const row = new Uint8Array(20); row.set([118, 105, 101, 119]); return row; })(), (() => { const row = new Uint8Array(20); row.set([116, 105, 109, 101]); return row; })(), (() => { const row = new Uint8Array(20); row.set([117, 110, 108, 111, 99, 107]); return row; })(), (() => { const row = new Uint8Array(20); row.set([99, 97, 115, 104, 109, 97, 110]); return row; })(), (() => { const row = new Uint8Array(20); row.set([105, 116, 101, 109, 115]); return row; })(), (() => { const row = new Uint8Array(20); row.set([114, 97, 116, 101]); return row; })(), (() => { const row = new Uint8Array(20); row.set([115, 107, 105, 108, 108, 35]); return row; })(), (() => { const row = new Uint8Array(20); row.set([98, 101, 116, 97]); return row; })(), (() => { const row = new Uint8Array(20); row.set([104, 121, 112, 101, 114]); return row; })(), (() => { const row = new Uint8Array(20); row.set([109, 111, 110, 115, 116, 101, 114, 115]); return row; })(), (() => { const row = new Uint8Array(20); row.set([60, 82, 69, 83, 69, 82, 86, 69, 68, 62]); return row; })(), (() => { const row = new Uint8Array(20); row.set([60, 82, 69, 83, 69, 82, 86, 69, 68, 62]); return row; })(), (() => { const row = new Uint8Array(20); row.set([116, 111, 100, 100]); return row; })(), (() => { const row = new Uint8Array(20); row.set([115, 104, 111, 119, 109, 97, 112]); return row; })(), (() => { const row = new Uint8Array(20); row.set([107, 114, 111, 122]); return row; })(), (() => { const row = new Uint8Array(20); row.set([97, 108, 108, 101, 110]); return row; })(), (() => { const row = new Uint8Array(20); row.set([99, 108, 105, 112]); return row; })(), (() => { const row = new Uint8Array(20); row.set([119, 101, 97, 112, 111, 110, 115]); return row; })(), (() => { const row = new Uint8Array(20); row.set([105, 110, 118, 101, 110, 116, 111, 114, 121]); return row; })(), (() => { const row = new Uint8Array(20); row.set([107, 101, 121, 115]); return row; })(), (() => { const row = new Uint8Array(20); row.set([100, 101, 98, 117, 103]); return row; })(), (() => { const row = new Uint8Array(20); row.set([60, 82, 69, 83, 69, 82, 86, 69, 68, 62]); return row; })(), (() => { const row = new Uint8Array(20); row.set([99, 103, 115]); return row; })()];
function __cxx_static_address_9242639a81f78d24d7dae084() {
  return __cxx_static_address_9242639a81f78d24d7dae084.reference || (__cxx_static_address_9242639a81f78d24d7dae084.reference = {
    __cReference: true,
    get value() { return CheatStrings; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_d238b7ad127aa2ef = i32(2147483647);
function __cxx_static_address_d66dffb6f5b68a3e465f20e3() {
  return __cxx_static_address_d66dffb6f5b68a3e465f20e3.reference || (__cxx_static_address_d66dffb6f5b68a3e465f20e3.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_d238b7ad127aa2ef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_695ea3b91de2ae72 = i32(2147483648);
function __cxx_static_address_8577e87cb63dbd84389e8fce() {
  return __cxx_static_address_8577e87cb63dbd84389e8fce.reference || (__cxx_static_address_8577e87cb63dbd84389e8fce.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_695ea3b91de2ae72; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_816709ec904bb5f3 = i32(2147483648);
function __cxx_static_address_18d7e27fd7ad8abb4192df43() {
  return __cxx_static_address_18d7e27fd7ad8abb4192df43.reference || (__cxx_static_address_18d7e27fd7ad8abb4192df43.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_816709ec904bb5f3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_9b3c8ff4d9abbe3c = i32(65536);
function __cxx_static_address_e34662f0c97df8b12c4ba37e() {
  return __cxx_static_address_e34662f0c97df8b12c4ba37e.reference || (__cxx_static_address_e34662f0c97df8b12c4ba37e.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_9b3c8ff4d9abbe3c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_c1bcf2a83fa5e94d = i32(32768);
function __cxx_static_address_8d4ec40429e680ac9215e1ec() {
  return __cxx_static_address_8d4ec40429e680ac9215e1ec.reference || (__cxx_static_address_8d4ec40429e680ac9215e1ec.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_c1bcf2a83fa5e94d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_0e21beb54621cd1e = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_1d1656d9e57f0488a48cdc36() {
  return __cxx_static_address_1d1656d9e57f0488a48cdc36.reference || (__cxx_static_address_1d1656d9e57f0488a48cdc36.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_0e21beb54621cd1e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/cheats.cpp:61
export let CheatDescriptions = [(() => { const row = new Uint8Array(64); row.set([84, 111, 103, 103, 108, 101, 32, 71, 111, 100, 32, 77, 111, 100, 101]); return row; })(), (() => { const row = new Uint8Array(64); row.set([71, 105, 118, 101, 32, 69, 118, 101, 114, 121, 116, 104, 105, 110, 103]); return row; })(), (() => { const row = new Uint8Array(64); row.set([76, 101, 118, 101, 108, 32, 87, 97, 114, 112]); return row; })(), (() => { const row = new Uint8Array(64); row.set([84, 111, 103, 103, 108, 101, 32, 67, 111, 111, 114, 100, 105, 110, 97, 116, 101, 32, 68, 105, 115, 112, 108, 97, 121]); return row; })(), (() => { const row = new Uint8Array(64); row.set([84, 111, 103, 103, 108, 101, 32, 51, 114, 100, 45, 80, 101, 114, 115, 111, 110, 32, 86, 105, 101, 119]); return row; })(), (() => { const row = new Uint8Array(64); row.set([]); return row; })(), (() => { const row = new Uint8Array(64); row.set([84, 111, 103, 103, 108, 101, 32, 65, 108, 108, 32, 76, 111, 99, 107, 115]); return row; })(), (() => { const row = new Uint8Array(64); row.set([84, 111, 103, 103, 108, 101, 32, 67, 97, 115, 104, 109, 97, 110]); return row; })(), (() => { const row = new Uint8Array(64); row.set([71, 105, 118, 101, 32, 65, 108, 108, 32, 73, 116, 101, 109, 115]); return row; })(), (() => { const row = new Uint8Array(64); row.set([84, 111, 103, 103, 108, 101, 32, 70, 114, 97, 109, 101, 114, 97, 116, 101, 32, 68, 105, 115, 112, 108, 97, 121]); return row; })(), (() => { const row = new Uint8Array(64); row.set([67, 104, 97, 110, 103, 101, 32, 83, 107, 105, 108, 108]); return row; })(), (() => { const row = new Uint8Array(64); row.set([]); return row; })(), (() => { const row = new Uint8Array(64); row.set([84, 111, 103, 103, 108, 101, 32, 72, 121, 112, 101, 114]); return row; })(), (() => { const row = new Uint8Array(64); row.set([84, 111, 103, 103, 108, 101, 32, 77, 111, 110, 115, 116, 101, 114, 115]); return row; })(), (() => { const row = new Uint8Array(64); row.set([]); return row; })(), (() => { const row = new Uint8Array(64); row.set([]); return row; })(), (() => { const row = new Uint8Array(64); row.set([77, 97, 116, 116, 32, 83, 97, 101, 116, 116, 108, 101, 114, 46, 32, 32, 109, 97, 116, 116, 115, 64, 115, 97, 101, 116, 116, 108, 101, 114, 46, 99, 111, 109]); return row; })(), (() => { const row = new Uint8Array(64); row.set([84, 111, 103, 103, 108, 101, 32, 83, 104, 111, 119, 32, 65, 108, 108, 32, 77, 97, 112]); return row; })(), (() => { const row = new Uint8Array(64); row.set([]); return row; })(), (() => { const row = new Uint8Array(64); row.set([]); return row; })(), (() => { const row = new Uint8Array(64); row.set([84, 111, 103, 103, 108, 101, 32, 67, 108, 105, 112, 112, 105, 110, 103]); return row; })(), (() => { const row = new Uint8Array(64); row.set([71, 105, 118, 101, 32, 87, 101, 97, 112, 111, 110, 115]); return row; })(), (() => { const row = new Uint8Array(64); row.set([71, 105, 118, 101, 32, 73, 110, 118, 101, 110, 116, 111, 114, 121]); return row; })(), (() => { const row = new Uint8Array(64); row.set([71, 105, 118, 101, 32, 75, 101, 121, 115]); return row; })(), (() => { const row = new Uint8Array(64); row.set([84, 111, 103, 103, 108, 101, 32, 68, 101, 98, 117, 103, 32, 68, 97, 116, 97, 32, 68, 117, 109, 112]); return row; })(), (() => { const row = new Uint8Array(64); row.set([]); return row; })(), (() => { const row = new Uint8Array(64); row.set([]); return row; })()];
function __cxx_static_address_f2359210823cf29cddd4ef6b() {
  return __cxx_static_address_f2359210823cf29cddd4ef6b.reference || (__cxx_static_address_f2359210823cf29cddd4ef6b.reference = {
    __cReference: true,
    get value() { return CheatDescriptions; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/cheats.cpp:92
export const CheatFunctionFlags = new Uint32Array([u32(i32((1 << i32(1)))), u32(i32((1 << i32(2)))), u32(i32((1 << i32(12)))), u32(i32((1 << i32(19)))), u32(i32((1 << i32(8)))), u32(0), u32(i32((1 << i32(10)))), u32(i32((1 << i32(0)))), u32(i32((1 << i32(4)))), u32(i32((1 << i32(15)))), u32(i32((1 << i32(13)))), u32(i32((1 << i32(16)))), u32(i32((1 << i32(7)))), u32(i32((1 << i32(14)))), u32(0), u32(0), u32(i32((1 << i32(17)))), u32(i32((1 << i32(9)))), u32(i32((1 << i32(1)))), u32(i32((1 << i32(18)))), u32(i32((1 << i32(11)))), u32(i32((1 << i32(3)))), u32(i32((1 << i32(5)))), u32(i32((1 << i32(6)))), u32(i32((1 << i32(20)))), u32(0), u32(i32((i32((1 << i32(1))) | i32((1 << i32(2))))))]);
function __cxx_static_address_37e681b1f840123dceef7c8f() {
  return __cxx_static_address_37e681b1f840123dceef7c8f.reference || (__cxx_static_address_37e681b1f840123dceef7c8f.reference = {
    __cReference: true,
    get value() { return CheatFunctionFlags; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/cheats.cpp:125
export const CheatFunctionIDs = (() => { const items = new Uint8Array(27); items.set([((7) & 255), ((0) & 255), ((1) & 255), ((21) & 255), ((8) & 255), ((22) & 255), ((23) & 255), ((12) & 255), ((4) & 255), ((17) & 255), ((6) & 255), ((20) & 255), ((2) & 255), ((10) & 255), ((13) & 255), ((9) & 255), ((11) & 255), ((16) & 255), ((19) & 255), ((3) & 255), ((24) & 255)]); return items; })();
function __cxx_static_address_1d715005c1358c3d7934169d() {
  return __cxx_static_address_1d715005c1358c3d7934169d.reference || (__cxx_static_address_1d715005c1358c3d7934169d.reference = {
    __cReference: true,
    get value() { return CheatFunctionIDs; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/cheats.cpp:253
export let g_cheatBufLen = 0;
export function __cxx_global_cell_a9b90504bf79a7dea1586b8d() {
  return __cxx_global_cell_a9b90504bf79a7dea1586b8d.reference || (__cxx_global_cell_a9b90504bf79a7dea1586b8d.reference = {
    __cReference: true,
    get value() { return g_cheatBufLen; },
    set value(__cxx_lvalue_0) { g_cheatBufLen = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/cheats.cpp:254
export let cheatbuf = new Int8Array(20);
function __cxx_static_address_7f0193ca2ce7ced3eacfb4e0() {
  return __cxx_static_address_7f0193ca2ce7ced3eacfb4e0.reference || (__cxx_static_address_7f0193ca2ce7ced3eacfb4e0.reference = {
    __cReference: true,
    get value() { return cheatbuf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_16261aa24cd43dcc = new Uint8Array([((1) & 255), ((2) & 255), ((4) & 255), ((8) & 255), ((16) & 255), ((32) & 255), ((64) & 255), ((128) & 255)]);
function __cxx_static_address_57d6c6022cb4869292826a92() {
  return __cxx_static_address_57d6c6022cb4869292826a92.reference || (__cxx_static_address_57d6c6022cb4869292826a92.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_16261aa24cd43dcc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:172
export const g_defaultVideoModes__header_global_84da429b8117eaff = [cMarkAggregate(({"x": 2560, "y": 1440})), cMarkAggregate(({"x": 2560, "y": 1200})), cMarkAggregate(({"x": 2560, "y": 1080})), cMarkAggregate(({"x": 1920, "y": 1440})), cMarkAggregate(({"x": 1920, "y": 1200})), cMarkAggregate(({"x": 1920, "y": 1080})), cMarkAggregate(({"x": 1680, "y": 1050})), cMarkAggregate(({"x": 1600, "y": 1200})), cMarkAggregate(({"x": 1600, "y": 900})), cMarkAggregate(({"x": 1366, "y": 768})), cMarkAggregate(({"x": 1280, "y": 1024})), cMarkAggregate(({"x": 1280, "y": 960})), cMarkAggregate(({"x": 1280, "y": 720})), cMarkAggregate(({"x": 1152, "y": 864})), cMarkAggregate(({"x": 1024, "y": 768})), cMarkAggregate(({"x": 1024, "y": 600})), cMarkAggregate(({"x": 800, "y": 600})), cMarkAggregate(({"x": 640, "y": 480})), cMarkAggregate(({"x": 640, "y": 400})), cMarkAggregate(({"x": 512, "y": 384})), cMarkAggregate(({"x": 480, "y": 360})), cMarkAggregate(({"x": 400, "y": 300})), cMarkAggregate(({"x": 320, "y": 240})), cMarkAggregate(({"x": 320, "y": 200})), cMarkAggregate(({"x": 0, "y": 0}))];
function __cxx_static_address_9b26891dfd0e7bbf4de21ac6() {
  return __cxx_static_address_9b26891dfd0e7bbf4de21ac6.reference || (__cxx_static_address_9b26891dfd0e7bbf4de21ac6.reference = {
    __cReference: true,
    get value() { return g_defaultVideoModes__header_global_84da429b8117eaff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:188
export const g_keyAsciiTable__header_global_00488148f747784a = new Uint8Array([((0) & 255), ((0) & 255), 49, 50, 51, 52, 53, 54, 55, 56, 57, 48, 45, 61, ((0) & 255), ((0) & 255), 113, 119, 101, 114, 116, 121, 117, 105, 111, 112, 91, 93, ((0) & 255), ((0) & 255), 97, 115, 100, 102, 103, 104, 106, 107, 108, 59, ((39) & 255), 96, ((0) & 255), ((92) & 255), 122, 120, 99, 118, 98, 110, 109, 44, 46, 47, ((0) & 255), 42, ((0) & 255), ((32) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255)]);
function __cxx_static_address_74ebc35d11c48fa0d052299f() {
  return __cxx_static_address_74ebc35d11c48fa0d052299f.reference || (__cxx_static_address_74ebc35d11c48fa0d052299f.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTable__header_global_00488148f747784a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:196
export const g_keyAsciiTableShift__header_global_15aceab5f93ce2e7 = new Uint8Array([((0) & 255), ((0) & 255), 33, 64, 35, 36, 37, 94, 38, 42, 40, 41, 95, 43, ((0) & 255), ((0) & 255), 81, 87, 69, 82, 84, 89, 85, 73, 79, 80, 123, 125, ((0) & 255), ((0) & 255), 65, 83, 68, 70, 71, 72, 74, 75, 76, 58, 34, 126, ((0) & 255), 124, 90, 88, 67, 86, 66, 78, 77, 60, 62, 63, ((0) & 255), 42, ((0) & 255), ((32) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255)]);
function __cxx_static_address_5c94cb0903b3b1c4f7f07290() {
  return __cxx_static_address_5c94cb0903b3b1c4f7f07290.reference || (__cxx_static_address_5c94cb0903b3b1c4f7f07290.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTableShift__header_global_15aceab5f93ce2e7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:895
export const pow2long__header_global_3a7dce18835c3d3f = new Int32Array([1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576, 2097152, 4194304, 8388608, 16777216, 33554432, 67108864, 134217728, 268435456, 536870912, 1073741824, 2147483647]);
function __cxx_static_address_67070299b496f65f7a84156c() {
  return __cxx_static_address_67070299b496f65f7a84156c.reference || (__cxx_static_address_67070299b496f65f7a84156c.reference = {
    __cReference: true,
    get value() { return pow2long__header_global_3a7dce18835c3d3f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:907
export const pow2ulong__header_global_138f33fe163ad308 = new Uint32Array([u32(1), u32(2), u32(4), u32(8), u32(16), u32(32), u32(64), u32(128), u32(256), u32(512), u32(1024), u32(2048), u32(4096), u32(8192), u32(16384), u32(32768), u32(65536), u32(131072), u32(262144), u32(524288), u32(1048576), u32(2097152), u32(4194304), u32(8388608), u32(16777216), u32(33554432), u32(67108864), u32(134217728), u32(268435456), u32(536870912), u32(1073741824), u32(2147483648n)]);
function __cxx_static_address_e8259c9ecb5f82d3b387df0b() {
  return __cxx_static_address_e8259c9ecb5f82d3b387df0b.reference || (__cxx_static_address_e8259c9ecb5f82d3b387df0b.reference = {
    __cReference: true,
    get value() { return pow2ulong__header_global_138f33fe163ad308; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:919
export const pow264__header_global_91cd9cdd899fb3c1 = new BigInt64Array([BigInt(i64(1)), BigInt(i64(2)), BigInt(i64(4)), BigInt(i64(8)), BigInt(i64(16)), BigInt(i64(32)), BigInt(i64(64)), BigInt(i64(128)), BigInt(i64(256)), BigInt(i64(512)), BigInt(i64(1024)), BigInt(i64(2048)), BigInt(i64(4096)), BigInt(i64(8192)), BigInt(i64(16384)), BigInt(i64(32768)), BigInt(i64(65536)), BigInt(i64(131072)), BigInt(i64(262144)), BigInt(i64(524288)), BigInt(i64(1048576)), BigInt(i64(2097152)), BigInt(i64(4194304)), BigInt(i64(8388608)), BigInt(i64(16777216)), BigInt(i64(33554432)), BigInt(i64(67108864)), BigInt(i64(134217728)), BigInt(i64(268435456)), BigInt(i64(536870912)), BigInt(i64(1073741824)), BigInt(2147483648n), BigInt(4294967296n), BigInt(8589934592n), BigInt(17179869184n), BigInt(34359738368n), BigInt(68719476736n), BigInt(137438953472n), BigInt(274877906944n), BigInt(549755813888n), BigInt(1099511627776n), BigInt(2199023255552n), BigInt(4398046511104n), BigInt(8796093022208n), BigInt(17592186044416n), BigInt(35184372088832n), BigInt(70368744177664n), BigInt(140737488355328n), BigInt(281474976710656n), BigInt(562949953421312n), BigInt(1125899906842624n), BigInt(2251799813685248n), BigInt(4503599627370496n), BigInt(9007199254740992n), BigInt(18014398509481984n), BigInt(36028797018963968n), BigInt(72057594037927936n), BigInt(144115188075855872n), BigInt(288230376151711744n), BigInt(576460752303423488n), BigInt(1152921504606846976n), BigInt(2305843009213693952n), BigInt(4611686018427387904n), BigInt(9223372036854775807n)]);
function __cxx_static_address_4a1cda448ccd1895c480933b() {
  return __cxx_static_address_4a1cda448ccd1895c480933b.reference || (__cxx_static_address_4a1cda448ccd1895c480933b.reference = {
    __cReference: true,
    get value() { return pow264__header_global_91cd9cdd899fb3c1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export function ARRAY_SIZE__header_263a0c827266(arg0) {
  return u64(27n);
}
