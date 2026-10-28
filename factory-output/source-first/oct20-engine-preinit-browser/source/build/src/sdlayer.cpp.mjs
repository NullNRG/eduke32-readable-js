// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/build/src/sdlayer.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
import { curpalettefaded } from "./palette.cpp.mjs";
import { __cxx_global_cell_ee6f4502eccd328f27b46fb8 } from "./baselayer.cpp.mjs";
import { g_keyAsciiFIFO } from "./baselayer.cpp.mjs";
import { __cxx_global_cell_a6fc8c10b0aec7fd31285ec6 } from "./baselayer.cpp.mjs";
import { __cxx_global_cell_e05bfe76ea6b9140ad7ed9e7 } from "./baselayer.cpp.mjs";
import { __cxx_global_cell_11016d3c7177543e564ab46c } from "./compat.cpp.mjs";
import { softsurface_setPalette } from "./softsurface.cpp.mjs";

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
export const fix16_rad_to_deg_mult__header_global_ee3d6a8a30e73686 = i32(3754936);
function __cxx_static_address_cb34a7085bc0cd6548dfe089() {
  return __cxx_static_address_cb34a7085bc0cd6548dfe089.reference || (__cxx_static_address_cb34a7085bc0cd6548dfe089.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_ee3d6a8a30e73686; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_c96b47cd1f0672f5 = i32(1144);
function __cxx_static_address_c0a7914c7528a7d4c702056a() {
  return __cxx_static_address_c0a7914c7528a7d4c702056a.reference || (__cxx_static_address_c0a7914c7528a7d4c702056a.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_c96b47cd1f0672f5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/vec.h:9
export function __cxx_record_vec2_2150e186aab2ebda() {
  return __cxx_record_vec2_2150e186aab2ebda.type || (__cxx_record_vec2_2150e186aab2ebda.type = class __cxx_record_vec2_2150e186aab2ebda__implementation {
  constructor() {
    this.x = undefined;
    this.y = undefined;
  }
  __cxx_operator_729d876abe4b118e(rhs) {
    return cMarkAggregate(Object.assign(Object.create(__cxx_record_vec2_2150e186aab2ebda().prototype), cMarkAggregate(({"x": i32(Math.imul(this.x, rhs.x)), "y": i32(Math.imul(this.y, rhs.y))}))));
  }
});
}

// C/C++ source: source/build/src/sdlayer.cpp:57
export let linked = cZeroAggregate({"record": {"major": {"scalar": "unsigned char"}, "minor": {"scalar": "unsigned char"}, "patch": {"scalar": "unsigned char"}}});
function __cxx_static_address_b3a946a86164333a07ed9373() {
  return __cxx_static_address_b3a946a86164333a07ed9373.reference || (__cxx_static_address_b3a946a86164333a07ed9373.reference = {
    __cReference: true,
    get value() { return linked; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/sdlayer.cpp:63
export function startwin_open() {
  return i32(0);
}

// C/C++ source: source/build/src/sdlayer.cpp:64
export function startwin_close() {
  return i32(0);
}

// C/C++ source: source/build/src/sdlayer.cpp:65
export function startwin_puts(s) {
  (s = s);
  return i32(0);
}

// C/C++ source: source/build/src/sdlayer.cpp:66
export function startwin_idle(s) {
  (s = s);
  return i32(0);
}

// C/C++ source: source/build/src/sdlayer.cpp:67
export function startwin_settitle(s) {
  (s = s);
  return i32(0);
}

// C/C++ source: source/build/src/sdlayer.cpp:68
export function startwin_run() {
  return i32(0);
}

// C/C++ source: source/build/src/sdlayer.cpp:69
export function startwin_isopen() {
  return Boolean(false);
}

// C/C++ source: source/build/src/sdlayer.cpp:80
export let inputchecked = i32(0);
export function __cxx_global_cell_442ee18d0bd3b7af452b37d9() {
  return __cxx_global_cell_442ee18d0bd3b7af452b37d9.reference || (__cxx_global_cell_442ee18d0bd3b7af452b37d9.reference = {
    __cReference: true,
    get value() { return inputchecked; },
    set value(__cxx_lvalue_0) { inputchecked = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/sdlayer.cpp:82
export let quitevent = ((((0) & 255)) & 255);
export function __cxx_global_cell_2eb868e64aeb8bef352d4729() {
  return __cxx_global_cell_2eb868e64aeb8bef352d4729.reference || (__cxx_global_cell_2eb868e64aeb8bef352d4729.reference = {
    __cReference: true,
    get value() { return quitevent; },
    set value(__cxx_lvalue_0) { quitevent = ((__cxx_lvalue_0) & 255); }
  });
}

export let appactive = ((((1) & 255)) & 255);
export function __cxx_global_cell_026e4893be4e21af32359651() {
  return __cxx_global_cell_026e4893be4e21af32359651.reference || (__cxx_global_cell_026e4893be4e21af32359651.reference = {
    __cReference: true,
    get value() { return appactive; },
    set value(__cxx_lvalue_0) { appactive = ((__cxx_lvalue_0) & 255); }
  });
}

export let novideo = ((((0) & 255)) & 255);
export function __cxx_global_cell_468c46341ac515257fedfe76() {
  return __cxx_global_cell_468c46341ac515257fedfe76.reference || (__cxx_global_cell_468c46341ac515257fedfe76.reference = {
    __cReference: true,
    get value() { return novideo; },
    set value(__cxx_lvalue_0) { novideo = ((__cxx_lvalue_0) & 255); }
  });
}

// C/C++ source: source/build/src/sdlayer.cpp:85
export let sdl_surface = null;
function __cxx_static_address_36c1ac07e31aed8d3265cb02() {
  return __cxx_static_address_36c1ac07e31aed8d3265cb02.reference || (__cxx_static_address_36c1ac07e31aed8d3265cb02.reference = {
    __cReference: true,
    get value() { return sdl_surface; },
    set value(__cxx_lvalue_0) { sdl_surface = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/src/sdlayer.cpp:87
export let sdl_resize = cMarkAggregate(Object.assign(Object.create(__cxx_record_vec2_2150e186aab2ebda().prototype), ({"x": cZeroAggregate({"scalar": "int"}), "y": cZeroAggregate({"scalar": "int"})})));
function __cxx_static_address_6767ac62baba5bd380c8777b() {
  return __cxx_static_address_6767ac62baba5bd380c8777b.reference || (__cxx_static_address_6767ac62baba5bd380c8777b.reference = {
    __cReference: true,
    get value() { return sdl_resize; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/sdlayer.cpp:88
export let sdl_minimized = 0;
function __cxx_static_address_113e1d18026c11b638a523cd() {
  return __cxx_static_address_113e1d18026c11b638a523cd.reference || (__cxx_static_address_113e1d18026c11b638a523cd.reference = {
    __cReference: true,
    get value() { return sdl_minimized; },
    set value(__cxx_lvalue_0) { sdl_minimized = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/sdlayer.cpp:91
export let sdl_window = null;
function __cxx_static_address_1807b37dcb1d3a7c8be4b656() {
  return __cxx_static_address_1807b37dcb1d3a7c8be4b656.reference || (__cxx_static_address_1807b37dcb1d3a7c8be4b656.reference = {
    __cReference: true,
    get value() { return sdl_window; },
    set value(__cxx_lvalue_0) { sdl_window = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/src/sdlayer.cpp:92
export let sdl_context = null;
function __cxx_static_address_b25927d643c9a78f2c95356f() {
  return __cxx_static_address_b25927d643c9a78f2c95356f.reference || (__cxx_static_address_b25927d643c9a78f2c95356f.reference = {
    __cReference: true,
    get value() { return sdl_context; },
    set value(__cxx_lvalue_0) { sdl_context = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/src/sdlayer.cpp:93
export let vsync_unsupported = 0;
function __cxx_static_address_0cb7862380d719c241f6375a() {
  return __cxx_static_address_0cb7862380d719c241f6375a.reference || (__cxx_static_address_0cb7862380d719c241f6375a.reference = {
    __cReference: true,
    get value() { return vsync_unsupported; },
    set value(__cxx_lvalue_0) { vsync_unsupported = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/sdlayer.cpp:96
export let vsync_renderlayer = 0;
function __cxx_static_address_4aa781b00af78a297342921a() {
  return __cxx_static_address_4aa781b00af78a297342921a.reference || (__cxx_static_address_4aa781b00af78a297342921a.reference = {
    __cReference: true,
    get value() { return vsync_renderlayer; },
    set value(__cxx_lvalue_0) { vsync_renderlayer = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/sdlayer.cpp:97
export let maxrefreshfreq = i32(0);
export function __cxx_global_cell_bbb4a9ec7fb6f0c4ded01621() {
  return __cxx_global_cell_bbb4a9ec7fb6f0c4ded01621.reference || (__cxx_global_cell_bbb4a9ec7fb6f0c4ded01621.reference = {
    __cReference: true,
    get value() { return maxrefreshfreq; },
    set value(__cxx_lvalue_0) { maxrefreshfreq = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/sdlayer.cpp:98
export let xres = i32((-1));
export function __cxx_global_cell_56bd65d018548900199db93f() {
  return __cxx_global_cell_56bd65d018548900199db93f.reference || (__cxx_global_cell_56bd65d018548900199db93f.reference = {
    __cReference: true,
    get value() { return xres; },
    set value(__cxx_lvalue_0) { xres = i32(__cxx_lvalue_0); }
  });
}

export let yres = i32((-1));
export function __cxx_global_cell_18fd7bea782d2fdc86805764() {
  return __cxx_global_cell_18fd7bea782d2fdc86805764.reference || (__cxx_global_cell_18fd7bea782d2fdc86805764.reference = {
    __cReference: true,
    get value() { return yres; },
    set value(__cxx_lvalue_0) { yres = i32(__cxx_lvalue_0); }
  });
}

export let bpp = i32(0);
export function __cxx_global_cell_b3926346e92cac557f00175c() {
  return __cxx_global_cell_b3926346e92cac557f00175c.reference || (__cxx_global_cell_b3926346e92cac557f00175c.reference = {
    __cReference: true,
    get value() { return bpp; },
    set value(__cxx_lvalue_0) { bpp = i32(__cxx_lvalue_0); }
  });
}

export let fullscreen = i32(0);
export function __cxx_global_cell_b58ae57ccd52d0f91d0874d6() {
  return __cxx_global_cell_b58ae57ccd52d0f91d0874d6.reference || (__cxx_global_cell_b58ae57ccd52d0f91d0874d6.reference = {
    __cReference: true,
    get value() { return fullscreen; },
    set value(__cxx_lvalue_0) { fullscreen = i32(__cxx_lvalue_0); }
  });
}

export let bytesperline = 0;
export function __cxx_global_cell_56606cfee73eb8d6c7d57541() {
  return __cxx_global_cell_56606cfee73eb8d6c7d57541.reference || (__cxx_global_cell_56606cfee73eb8d6c7d57541.reference = {
    __cReference: true,
    get value() { return bytesperline; },
    set value(__cxx_lvalue_0) { bytesperline = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/sdlayer.cpp:99
export let refreshfreq = 59;
export function __cxx_global_cell_84c518e352f66f31d8eaf74c() {
  return __cxx_global_cell_84c518e352f66f31d8eaf74c.reference || (__cxx_global_cell_84c518e352f66f31d8eaf74c.reference = {
    __cReference: true,
    get value() { return refreshfreq; },
    set value(__cxx_lvalue_0) { refreshfreq = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/src/sdlayer.cpp:100
export let frameplace = i64(0);
export function __cxx_global_cell_f0c9c3446e396d6353338d7e() {
  return __cxx_global_cell_f0c9c3446e396d6353338d7e.reference || (__cxx_global_cell_f0c9c3446e396d6353338d7e.reference = {
    __cReference: true,
    get value() { return frameplace; },
    set value(__cxx_lvalue_0) { frameplace = i64(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_093baef6a1feb6b6 = i32(2147483647);
function __cxx_static_address_8e7f645703434fab23407abc() {
  return __cxx_static_address_8e7f645703434fab23407abc.reference || (__cxx_static_address_8e7f645703434fab23407abc.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_093baef6a1feb6b6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_ac5cc53a58df79e7 = i32(2147483648);
function __cxx_static_address_d4f3851ccbd957b09ca355ea() {
  return __cxx_static_address_d4f3851ccbd957b09ca355ea.reference || (__cxx_static_address_d4f3851ccbd957b09ca355ea.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_ac5cc53a58df79e7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_5377101bf3f82cd9 = i32(2147483648);
function __cxx_static_address_66c7591c516e33c2aa8b6a62() {
  return __cxx_static_address_66c7591c516e33c2aa8b6a62.reference || (__cxx_static_address_66c7591c516e33c2aa8b6a62.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_5377101bf3f82cd9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_920416620894b39b = i32(65536);
function __cxx_static_address_9a782fecd34cda2cb0cb7e0f() {
  return __cxx_static_address_9a782fecd34cda2cb0cb7e0f.reference || (__cxx_static_address_9a782fecd34cda2cb0cb7e0f.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_920416620894b39b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_62cc3068420b56ba = i32(32768);
function __cxx_static_address_e68422c3096b8da6b24d73ef() {
  return __cxx_static_address_e68422c3096b8da6b24d73ef.reference || (__cxx_static_address_e68422c3096b8da6b24d73ef.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_62cc3068420b56ba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_7e8639f9b3f99b36 = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_de5fb47eeff4d3fb05948117() {
  return __cxx_static_address_de5fb47eeff4d3fb05948117.reference || (__cxx_static_address_de5fb47eeff4d3fb05948117.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_7e8639f9b3f99b36; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/sdlayer.cpp:101
export let lockcount = i32(0);
export function __cxx_global_cell_82b1d07c07b2d44b437f8e68() {
  return __cxx_global_cell_82b1d07c07b2d44b437f8e68.reference || (__cxx_global_cell_82b1d07c07b2d44b437f8e68.reference = {
    __cReference: true,
    get value() { return lockcount; },
    set value(__cxx_lvalue_0) { lockcount = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/sdlayer.cpp:102
export let modechange = ((((1) & 255)) & 255);
export function __cxx_global_cell_1fc8813e2419d4023365727f() {
  return __cxx_global_cell_1fc8813e2419d4023365727f.reference || (__cxx_global_cell_1fc8813e2419d4023365727f.reference = {
    __cReference: true,
    get value() { return modechange; },
    set value(__cxx_lvalue_0) { modechange = ((__cxx_lvalue_0) & 255); }
  });
}

// C/C++ source: source/build/src/sdlayer.cpp:103
export let offscreenrendering = ((((0) & 255)) & 255);
export function __cxx_global_cell_93d7c17084d3a8832fd9f6c6() {
  return __cxx_global_cell_93d7c17084d3a8832fd9f6c6.reference || (__cxx_global_cell_93d7c17084d3a8832fd9f6c6.reference = {
    __cReference: true,
    get value() { return offscreenrendering; },
    set value(__cxx_lvalue_0) { offscreenrendering = ((__cxx_lvalue_0) & 255); }
  });
}

// C/C++ source: source/build/src/sdlayer.cpp:104
export let videomodereset = ((((0) & 255)) & 255);
export function __cxx_global_cell_be076cccfa4a217ba3cad38e() {
  return __cxx_global_cell_be076cccfa4a217ba3cad38e.reference || (__cxx_global_cell_be076cccfa4a217ba3cad38e.reference = {
    __cReference: true,
    get value() { return videomodereset; },
    set value(__cxx_lvalue_0) { videomodereset = ((__cxx_lvalue_0) & 255); }
  });
}

// C/C++ source: source/build/src/sdlayer.cpp:105
export let nofog = i32(0);
export function __cxx_global_cell_312bd94d4e503ddb77232cb4() {
  return __cxx_global_cell_312bd94d4e503ddb77232cb4.reference || (__cxx_global_cell_312bd94d4e503ddb77232cb4.reference = {
    __cReference: true,
    get value() { return nofog; },
    set value(__cxx_lvalue_0) { nofog = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/sdlayer.cpp:107
export let sysgamma = Array.from({ length: 3 }, () => new Uint16Array(256));
function __cxx_static_address_23e29cf0928ef78b6f37ee25() {
  return __cxx_static_address_23e29cf0928ef78b6f37ee25.reference || (__cxx_static_address_23e29cf0928ef78b6f37ee25.reference = {
    __cReference: true,
    get value() { return sysgamma; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/sdlayer.cpp:114
export let lastvidgcb = new Float32Array(2);
function __cxx_static_address_b7667aed095ebace4c73b0ae() {
  return __cxx_static_address_b7667aed095ebace4c73b0ae.reference || (__cxx_static_address_b7667aed095ebace4c73b0ae.reference = {
    __cReference: true,
    get value() { return lastvidgcb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/sdlayer.cpp:120
export let appicon = null;
function __cxx_static_address_feff729a4afb22c72f286a77() {
  return __cxx_static_address_feff729a4afb22c72f286a77.reference || (__cxx_static_address_feff729a4afb22c72f286a77.reference = {
    __cReference: true,
    get value() { return appicon; },
    set value(__cxx_lvalue_0) { appicon = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/src/sdlayer.cpp:125
export let m_initprintf = 0;
function __cxx_static_address_9d6af81b93470456d23952cd() {
  return __cxx_static_address_9d6af81b93470456d23952cd.reference || (__cxx_static_address_9d6af81b93470456d23952cd.reference = {
    __cReference: true,
    get value() { return m_initprintf; },
    set value(__cxx_lvalue_0) { m_initprintf = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/sdlayer.cpp:127
export let g_ImGui_IO = null;
function __cxx_static_address_3df1a205758f5dda30781d01() {
  return __cxx_static_address_3df1a205758f5dda30781d01.reference || (__cxx_static_address_3df1a205758f5dda30781d01.reference = {
    __cReference: true,
    get value() { return g_ImGui_IO; },
    set value(__cxx_lvalue_0) { g_ImGui_IO = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/src/sdlayer.cpp:128
export let g_ImGuiCaptureInput = Boolean(true);
export function __cxx_global_cell_0350f6cc5858cd66e50c3714() {
  return __cxx_global_cell_0350f6cc5858cd66e50c3714.reference || (__cxx_global_cell_0350f6cc5858cd66e50c3714.reference = {
    __cReference: true,
    get value() { return g_ImGuiCaptureInput; },
    set value(__cxx_lvalue_0) { g_ImGuiCaptureInput = Boolean(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/sdlayer.cpp:130
export let g_ImGuiCapturedDevices = 0;
export function __cxx_global_cell_a784f64073c8e6317721f5a6() {
  return __cxx_global_cell_a784f64073c8e6317721f5a6.reference || (__cxx_global_cell_a784f64073c8e6317721f5a6.reference = {
    __cReference: true,
    get value() { return g_ImGuiCapturedDevices; },
    set value(__cxx_lvalue_0) { g_ImGuiCapturedDevices = ((__cxx_lvalue_0) & 255); }
  });
}

// C/C++ source: source/build/src/sdlayer.cpp:334
export function attach_debugger_here() {

}

// C/C++ source: source/build/src/sdlayer.cpp:800
export function debugprintf(f, ...__cxx_varargs) {
  (f = f);
  return i32(0);
}

// C/C++ source: source/build/src/sdlayer.cpp:827
export let joydev = null;
function __cxx_static_address_9bcc038ce6382964e70f2374() {
  return __cxx_static_address_9bcc038ce6382964e70f2374.reference || (__cxx_static_address_9bcc038ce6382964e70f2374.reference = {
    __cReference: true,
    get value() { return joydev; },
    set value(__cxx_lvalue_0) { joydev = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/src/sdlayer.cpp:829
export let controller = null;
function __cxx_static_address_e515be6fd81f17336a26bdc9() {
  return __cxx_static_address_e515be6fd81f17336a26bdc9.reference || (__cxx_static_address_e515be6fd81f17336a26bdc9.reference = {
    __cReference: true,
    get value() { return controller; },
    set value(__cxx_lvalue_0) { controller = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/src/sdlayer.cpp:830
export let gameControllerDBLoaded = false;
function __cxx_static_address_458e8b34185fcfefb7603898() {
  return __cxx_static_address_458e8b34185fcfefb7603898.reference || (__cxx_static_address_458e8b34185fcfefb7603898.reference = {
    __cReference: true,
    get value() { return gameControllerDBLoaded; },
    set value(__cxx_lvalue_0) { gameControllerDBLoaded = Boolean(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/sdlayer.cpp:887
export let numjoysticks = 0;
function __cxx_static_address_358ef267a617a1927024295f() {
  return __cxx_static_address_358ef267a617a1927024295f.reference || (__cxx_static_address_358ef267a617a1927024295f.reference = {
    __cReference: true,
    get value() { return numjoysticks; },
    set value(__cxx_lvalue_0) { numjoysticks = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/sdlayer.cpp:1355
export function sortmodes(a_, b_) {
  let a = b_;
  let b = a_;
  let x;
  if (((x = i32((i32(cRecordObject(a).fs) - i32(cRecordObject(b).fs)))) != 0)) {
    return i32(x);
  }
  if (((x = i32((i32(cRecordObject(a).bpp) - i32(cRecordObject(b).bpp)))) != 0)) {
    return i32(x);
  }
  if (((x = i32((cRecordObject(a).xdim - cRecordObject(b).xdim))) != 0)) {
    return i32(x);
  }
  if (((x = i32((cRecordObject(a).ydim - cRecordObject(b).ydim))) != 0)) {
    return i32(x);
  }
  return i32(0);
}

// C/C++ source: source/build/src/sdlayer.cpp:1370
export let modeschecked = ((((0) & 255)) & 255);
function __cxx_static_address_3c52322206130a3fcc904774() {
  return __cxx_static_address_3c52322206130a3fcc904774.reference || (__cxx_static_address_3c52322206130a3fcc904774.reference = {
    __cReference: true,
    get value() { return modeschecked; },
    set value(__cxx_lvalue_0) { modeschecked = ((__cxx_lvalue_0) & 255); }
  });
}

// C/C++ source: source/build/src/sdlayer.cpp:1543
export let g_ImGuiFrameActive = false;
export function __cxx_global_cell_5cb269532aae3035c2189ab8() {
  return __cxx_global_cell_5cb269532aae3035c2189ab8.reference || (__cxx_global_cell_5cb269532aae3035c2189ab8.reference = {
    __cReference: true,
    get value() { return g_ImGuiFrameActive; },
    set value(__cxx_lvalue_0) { g_ImGuiFrameActive = Boolean(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/sdlayer.cpp:1940
export function videoResetMode() {
  (videomodereset = ((((1) & 255)) & 255));
  (modeschecked = ((((0) & 255)) & 255));
}

// C/C++ source: source/build/src/sdlayer.cpp:2027
export function videoEndDrawing() {
  if ((bpp > 8)) {
    if ((!Boolean(offscreenrendering))) {
      (frameplace = i64(0));
    }
    return;
  }
  if ((!Boolean(frameplace))) {
    return;
  }
  if ((lockcount > 1)) {
    ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous - 1)); __cxx_lvalue_0.value = next; return previous; })(__cxx_global_cell_82b1d07c07b2d44b437f8e68());
    return;
  }
  if ((!Boolean(offscreenrendering))) {
    (frameplace = i64(0));
  }
  if ((lockcount == 0)) {
    return;
  }
  (lockcount = i32(0));
}

// C/C++ source: source/build/src/sdlayer.cpp:2203
export function videoUpdatePalette(start, num) {
  (start = i32(start));
  (num = i32(num));
  if ((bpp > 8)) {
    return i32(0);
  }
  {
    if (sdl_surface) {
      softsurface_setPalette(curpalettefaded, cRecordObject(cRecordObject(sdl_surface).format).Rmask, cRecordObject(cRecordObject(sdl_surface).format).Gmask, cRecordObject(cRecordObject(sdl_surface).format).Bmask);
    }
  }
  return i32(0);
}

export let sdlappicon = cZeroAggregate({"record": {"height": {"scalar": "int"}, "pixels": {"pointer": true}, "width": {"scalar": "int"}}});
export function __cxx_global_cell_2089c0bc3ad32484ac117017() {
  return __cxx_global_cell_2089c0bc3ad32484ac117017.reference || (__cxx_global_cell_2089c0bc3ad32484ac117017.reference = {
    __cReference: true,
    get value() { return sdlappicon; },
    set value(__cxx_lvalue_0) { throw new TypeError("record address cannot replace original object storage"); }
  });
}

// C/C++ source: source/build/src/sdlayer.cpp:2327
export function handleevents_updatemousestate(state) {
  (__cxx_global_cell_e05bfe76ea6b9140ad7ed9e7().value = ((((((i32(state) == 0) ? 3 : 1)) & 255)) & 255));
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_bb6efa1861c3764c = new Uint8Array([((1) & 255), ((2) & 255), ((4) & 255), ((8) & 255), ((16) & 255), ((32) & 255), ((64) & 255), ((128) & 255)]);
function __cxx_static_address_c29e735be0ca84fbb5adedc3() {
  return __cxx_static_address_c29e735be0ca84fbb5adedc3.reference || (__cxx_static_address_c29e735be0ca84fbb5adedc3.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_bb6efa1861c3764c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:172
export const g_defaultVideoModes__header_global_a19ca09ee2b13510 = [cMarkAggregate(Object.assign(Object.create(__cxx_record_vec2_2150e186aab2ebda().prototype), cMarkAggregate(({"x": 2560, "y": 1440})))), cMarkAggregate(Object.assign(Object.create(__cxx_record_vec2_2150e186aab2ebda().prototype), cMarkAggregate(({"x": 2560, "y": 1200})))), cMarkAggregate(Object.assign(Object.create(__cxx_record_vec2_2150e186aab2ebda().prototype), cMarkAggregate(({"x": 2560, "y": 1080})))), cMarkAggregate(Object.assign(Object.create(__cxx_record_vec2_2150e186aab2ebda().prototype), cMarkAggregate(({"x": 1920, "y": 1440})))), cMarkAggregate(Object.assign(Object.create(__cxx_record_vec2_2150e186aab2ebda().prototype), cMarkAggregate(({"x": 1920, "y": 1200})))), cMarkAggregate(Object.assign(Object.create(__cxx_record_vec2_2150e186aab2ebda().prototype), cMarkAggregate(({"x": 1920, "y": 1080})))), cMarkAggregate(Object.assign(Object.create(__cxx_record_vec2_2150e186aab2ebda().prototype), cMarkAggregate(({"x": 1680, "y": 1050})))), cMarkAggregate(Object.assign(Object.create(__cxx_record_vec2_2150e186aab2ebda().prototype), cMarkAggregate(({"x": 1600, "y": 1200})))), cMarkAggregate(Object.assign(Object.create(__cxx_record_vec2_2150e186aab2ebda().prototype), cMarkAggregate(({"x": 1600, "y": 900})))), cMarkAggregate(Object.assign(Object.create(__cxx_record_vec2_2150e186aab2ebda().prototype), cMarkAggregate(({"x": 1366, "y": 768})))), cMarkAggregate(Object.assign(Object.create(__cxx_record_vec2_2150e186aab2ebda().prototype), cMarkAggregate(({"x": 1280, "y": 1024})))), cMarkAggregate(Object.assign(Object.create(__cxx_record_vec2_2150e186aab2ebda().prototype), cMarkAggregate(({"x": 1280, "y": 960})))), cMarkAggregate(Object.assign(Object.create(__cxx_record_vec2_2150e186aab2ebda().prototype), cMarkAggregate(({"x": 1280, "y": 720})))), cMarkAggregate(Object.assign(Object.create(__cxx_record_vec2_2150e186aab2ebda().prototype), cMarkAggregate(({"x": 1152, "y": 864})))), cMarkAggregate(Object.assign(Object.create(__cxx_record_vec2_2150e186aab2ebda().prototype), cMarkAggregate(({"x": 1024, "y": 768})))), cMarkAggregate(Object.assign(Object.create(__cxx_record_vec2_2150e186aab2ebda().prototype), cMarkAggregate(({"x": 1024, "y": 600})))), cMarkAggregate(Object.assign(Object.create(__cxx_record_vec2_2150e186aab2ebda().prototype), cMarkAggregate(({"x": 800, "y": 600})))), cMarkAggregate(Object.assign(Object.create(__cxx_record_vec2_2150e186aab2ebda().prototype), cMarkAggregate(({"x": 640, "y": 480})))), cMarkAggregate(Object.assign(Object.create(__cxx_record_vec2_2150e186aab2ebda().prototype), cMarkAggregate(({"x": 640, "y": 400})))), cMarkAggregate(Object.assign(Object.create(__cxx_record_vec2_2150e186aab2ebda().prototype), cMarkAggregate(({"x": 512, "y": 384})))), cMarkAggregate(Object.assign(Object.create(__cxx_record_vec2_2150e186aab2ebda().prototype), cMarkAggregate(({"x": 480, "y": 360})))), cMarkAggregate(Object.assign(Object.create(__cxx_record_vec2_2150e186aab2ebda().prototype), cMarkAggregate(({"x": 400, "y": 300})))), cMarkAggregate(Object.assign(Object.create(__cxx_record_vec2_2150e186aab2ebda().prototype), cMarkAggregate(({"x": 320, "y": 240})))), cMarkAggregate(Object.assign(Object.create(__cxx_record_vec2_2150e186aab2ebda().prototype), cMarkAggregate(({"x": 320, "y": 200})))), cMarkAggregate(Object.assign(Object.create(__cxx_record_vec2_2150e186aab2ebda().prototype), cMarkAggregate(({"x": 0, "y": 0}))))];
function __cxx_static_address_6610e82ad8b3dac81373b255() {
  return __cxx_static_address_6610e82ad8b3dac81373b255.reference || (__cxx_static_address_6610e82ad8b3dac81373b255.reference = {
    __cReference: true,
    get value() { return g_defaultVideoModes__header_global_a19ca09ee2b13510; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:188
export const g_keyAsciiTable__header_global_e0315c00aee82342 = new Uint8Array([((0) & 255), ((0) & 255), 49, 50, 51, 52, 53, 54, 55, 56, 57, 48, 45, 61, ((0) & 255), ((0) & 255), 113, 119, 101, 114, 116, 121, 117, 105, 111, 112, 91, 93, ((0) & 255), ((0) & 255), 97, 115, 100, 102, 103, 104, 106, 107, 108, 59, ((39) & 255), 96, ((0) & 255), ((92) & 255), 122, 120, 99, 118, 98, 110, 109, 44, 46, 47, ((0) & 255), 42, ((0) & 255), ((32) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255)]);
function __cxx_static_address_a3fbcdbf6cb7d9e264ce099d() {
  return __cxx_static_address_a3fbcdbf6cb7d9e264ce099d.reference || (__cxx_static_address_a3fbcdbf6cb7d9e264ce099d.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTable__header_global_e0315c00aee82342; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:196
export const g_keyAsciiTableShift__header_global_288e11816b172bec = new Uint8Array([((0) & 255), ((0) & 255), 33, 64, 35, 36, 37, 94, 38, 42, 40, 41, 95, 43, ((0) & 255), ((0) & 255), 81, 87, 69, 82, 84, 89, 85, 73, 79, 80, 123, 125, ((0) & 255), ((0) & 255), 65, 83, 68, 70, 71, 72, 74, 75, 76, 58, 34, 126, ((0) & 255), 124, 90, 88, 67, 86, 66, 78, 77, 60, 62, 63, ((0) & 255), 42, ((0) & 255), ((32) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255)]);
function __cxx_static_address_efb79ba6d28a4db07d04f7e3() {
  return __cxx_static_address_efb79ba6d28a4db07d04f7e3.reference || (__cxx_static_address_efb79ba6d28a4db07d04f7e3.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTableShift__header_global_288e11816b172bec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:895
export const pow2long__header_global_1344c1eedea669f9 = new Int32Array([1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576, 2097152, 4194304, 8388608, 16777216, 33554432, 67108864, 134217728, 268435456, 536870912, 1073741824, 2147483647]);
function __cxx_static_address_b99b9eb92262b0cb91d0d901() {
  return __cxx_static_address_b99b9eb92262b0cb91d0d901.reference || (__cxx_static_address_b99b9eb92262b0cb91d0d901.reference = {
    __cReference: true,
    get value() { return pow2long__header_global_1344c1eedea669f9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:907
export const pow2ulong__header_global_13af12a96e6bc5c8 = new Uint32Array([u32(1), u32(2), u32(4), u32(8), u32(16), u32(32), u32(64), u32(128), u32(256), u32(512), u32(1024), u32(2048), u32(4096), u32(8192), u32(16384), u32(32768), u32(65536), u32(131072), u32(262144), u32(524288), u32(1048576), u32(2097152), u32(4194304), u32(8388608), u32(16777216), u32(33554432), u32(67108864), u32(134217728), u32(268435456), u32(536870912), u32(1073741824), u32(2147483648n)]);
function __cxx_static_address_73e0c2b75512bd62ab4f9cfe() {
  return __cxx_static_address_73e0c2b75512bd62ab4f9cfe.reference || (__cxx_static_address_73e0c2b75512bd62ab4f9cfe.reference = {
    __cReference: true,
    get value() { return pow2ulong__header_global_13af12a96e6bc5c8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:919
export const pow264__header_global_7021f25436c9b8b6 = new BigInt64Array([BigInt(i64(1)), BigInt(i64(2)), BigInt(i64(4)), BigInt(i64(8)), BigInt(i64(16)), BigInt(i64(32)), BigInt(i64(64)), BigInt(i64(128)), BigInt(i64(256)), BigInt(i64(512)), BigInt(i64(1024)), BigInt(i64(2048)), BigInt(i64(4096)), BigInt(i64(8192)), BigInt(i64(16384)), BigInt(i64(32768)), BigInt(i64(65536)), BigInt(i64(131072)), BigInt(i64(262144)), BigInt(i64(524288)), BigInt(i64(1048576)), BigInt(i64(2097152)), BigInt(i64(4194304)), BigInt(i64(8388608)), BigInt(i64(16777216)), BigInt(i64(33554432)), BigInt(i64(67108864)), BigInt(i64(134217728)), BigInt(i64(268435456)), BigInt(i64(536870912)), BigInt(i64(1073741824)), BigInt(2147483648n), BigInt(4294967296n), BigInt(8589934592n), BigInt(17179869184n), BigInt(34359738368n), BigInt(68719476736n), BigInt(137438953472n), BigInt(274877906944n), BigInt(549755813888n), BigInt(1099511627776n), BigInt(2199023255552n), BigInt(4398046511104n), BigInt(8796093022208n), BigInt(17592186044416n), BigInt(35184372088832n), BigInt(70368744177664n), BigInt(140737488355328n), BigInt(281474976710656n), BigInt(562949953421312n), BigInt(1125899906842624n), BigInt(2251799813685248n), BigInt(4503599627370496n), BigInt(9007199254740992n), BigInt(18014398509481984n), BigInt(36028797018963968n), BigInt(72057594037927936n), BigInt(144115188075855872n), BigInt(288230376151711744n), BigInt(576460752303423488n), BigInt(1152921504606846976n), BigInt(2305843009213693952n), BigInt(4611686018427387904n), BigInt(9223372036854775807n)]);
function __cxx_static_address_7753289a0a1614ce5c84bbc5() {
  return __cxx_static_address_7753289a0a1614ce5c84bbc5.reference || (__cxx_static_address_7753289a0a1614ce5c84bbc5.reference = {
    __cReference: true,
    get value() { return pow264__header_global_7021f25436c9b8b6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export function ARRAY_SIZE__header_0e5dad7260e0(arg0) {
  return u64(32n);
}

// C/C++ source: source/build/src/sdlayer.cpp:1451
export function xaligned_free__header_8fde0869932d(ptr) {
  _sm_free(__cxx_global_cell_11016d3c7177543e564ab46c().value, ptr);
}

// C/C++ source: source/build/src/sdlayer.cpp:1450
export function xfree__header_8455ed0a4ad7(ptr) {
  _sm_free(__cxx_global_cell_11016d3c7177543e564ab46c().value, ptr);
}

export function SILENCE_UNUSED__header_07304f9ee8ae(arg0, arg1) {

}

export function SILENCE_UNUSED__header_25eb5216ac4d(arg0, arg1) {

}

export function ARRAY_SIZE__header_a7771eb202e2(arg0) {
  return u64(7n);
}

export function ARRAY_SIZE__header_c8618bd4f297(arg0) {
  return u64(22n);
}

export function clamp__header_3b54a66910be(__cxx_in, min, max) {
  return i32(((__cxx_in <= i32(min)) ? i32(min) : ((__cxx_in >= i32(max)) ? i32(max) : __cxx_in)));
}

export function SILENCE_UNUSED__header_6c4dd990742e(arg0, arg1) {

}

// C/C++ source: source/build/src/sdlayer.cpp:311
export function keyBufferFull__header_2416764f7b64() {
  return i32((i32((i32((i32(__cxx_global_cell_ee6f4502eccd328f27b46fb8().value) + 1)) & i32((64 - 1)))) == i32(__cxx_global_cell_a6fc8c10b0aec7fd31285ec6().value)));
}

// C/C++ source: source/build/src/sdlayer.cpp:316
export function keyBufferInsert__header_d7a503e0bd19(code) {
  ((cDeref(cPointerOffset(g_keyAsciiFIFO, __cxx_global_cell_ee6f4502eccd328f27b46fb8().value, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = ((code) & 255));
  (__cxx_global_cell_ee6f4502eccd328f27b46fb8().value = ((((i32((i32((i32(__cxx_global_cell_ee6f4502eccd328f27b46fb8().value) + 1)) & i32((64 - 1))))) & 255)) & 255));
}

// C/C++ source: source/build/include/smmalloc.h:849
export function _sm_allocator_thread_cache_destroy(allocator) {
  if (cPointerCompare(allocator, null, "==")) {
    return;
  }
  cRecordObject(allocator).DestroyThreadCache();
}

// C/C++ source: source/build/include/smmalloc.h:859
export function _sm_malloc(allocator, bytesCount, alignment) {
  return cRecordObject(allocator).Alloc(bytesCount, alignment);
}

// C/C++ source: source/build/include/smmalloc.h:864
export function _sm_free(allocator, p) {
  return cRecordObject(allocator).Free(p);
}

// Original Clang-generated fragment; imports existing owner storage.
export { wm_msgbox } from "./_source_legacy_sdlayer_cpp_011c586b5633.mjs";

// Verified same-original-unit fragment storage exports.
export function __cxx_private_cell_9d6af81b93470456d23952cd() { return __cxx_static_address_9d6af81b93470456d23952cd(); }

// Original Clang-generated fragment; imports existing owner storage.
export { initsystem } from "./_source_legacy_sdlayer_cpp_cfc5a8e8ca29.mjs";

// Original Clang-generated fragment; imports existing owner storage.
export { videoGetDisplayName } from "./_source_legacy_sdlayer_cpp_1a43efbfb76c.mjs";

// Verified same-original-unit fragment storage exports.
export function __cxx_private_cell_1807b37dcb1d3a7c8be4b656() { return __cxx_static_address_1807b37dcb1d3a7c8be4b656(); }
export function __cxx_private_cell_b7667aed095ebace4c73b0ae() { return __cxx_static_address_b7667aed095ebace4c73b0ae(); }

// Original Clang-generated fragment; imports existing owner storage.
export { videoSetGamma } from "./_source_legacy_sdlayer_cpp_3a76314144e9.mjs";
