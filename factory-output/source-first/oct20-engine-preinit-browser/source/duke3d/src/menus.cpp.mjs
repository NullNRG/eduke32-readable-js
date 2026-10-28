// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/duke3d/src/menus.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.

function cCopyTrivialClass(value, C, fields) {
  if (!(value instanceof C)) throw new TypeError('C++ trivial class copy type mismatch');
  const copy=Object.create(C.prototype);
  for (const field of fields) copy[field]=value[field];
  return copy;
}

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
export const fix16_rad_to_deg_mult__header_global_1cc119b8151d974e = i32(3754936);
function __cxx_static_address_662cb26fd43733e09d338f83() {
  return __cxx_static_address_662cb26fd43733e09d338f83.reference || (__cxx_static_address_662cb26fd43733e09d338f83.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_1cc119b8151d974e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_6ae65180b7cee0fd = i32(1144);
function __cxx_static_address_dc965d516c23cace8fe034e3() {
  return __cxx_static_address_dc965d516c23cace8fe034e3.reference || (__cxx_static_address_dc965d516c23cace8fe034e3.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_6ae65180b7cee0fd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:43
export const KICK_HIT____header_global_e13287691ec0bab1 = ((((((0) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bd4abab836abde56a66d86d6() {
  return __cxx_static_address_bd4abab836abde56a66d86d6.reference || (__cxx_static_address_bd4abab836abde56a66d86d6.reference = {
    __cReference: true,
    get value() { return KICK_HIT____header_global_e13287691ec0bab1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:44
export const PISTOL_RICOCHET____header_global_dd0b58924b4097f5 = ((((((1) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4113c17d0d61a431a534a164() {
  return __cxx_static_address_4113c17d0d61a431a534a164.reference || (__cxx_static_address_4113c17d0d61a431a534a164.reference = {
    __cReference: true,
    get value() { return PISTOL_RICOCHET____header_global_dd0b58924b4097f5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:45
export const PISTOL_BODYHIT____header_global_6a54858f1c7b20f9 = ((((((2) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dc466bcef0305628ef2d075a() {
  return __cxx_static_address_dc466bcef0305628ef2d075a.reference || (__cxx_static_address_dc466bcef0305628ef2d075a.reference = {
    __cReference: true,
    get value() { return PISTOL_BODYHIT____header_global_6a54858f1c7b20f9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:46
export const PISTOL_FIRE____header_global_e5965e9dcd84cf53 = ((((((3) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b86f28c475f0a0684beb6b4f() {
  return __cxx_static_address_b86f28c475f0a0684beb6b4f.reference || (__cxx_static_address_b86f28c475f0a0684beb6b4f.reference = {
    __cReference: true,
    get value() { return PISTOL_FIRE____header_global_e5965e9dcd84cf53; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:47
export const EJECT_CLIP____header_global_b650ab53819f3728 = ((((((4) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b0ec320c14a6cee12e522f65() {
  return __cxx_static_address_b0ec320c14a6cee12e522f65.reference || (__cxx_static_address_b0ec320c14a6cee12e522f65.reference = {
    __cReference: true,
    get value() { return EJECT_CLIP____header_global_b650ab53819f3728; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:48
export const INSERT_CLIP____header_global_be4437907df325b6 = ((((((5) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cb4cd3668874102515f6615b() {
  return __cxx_static_address_cb4cd3668874102515f6615b.reference || (__cxx_static_address_cb4cd3668874102515f6615b.reference = {
    __cReference: true,
    get value() { return INSERT_CLIP____header_global_be4437907df325b6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:49
export const CHAINGUN_FIRE____header_global_04172afe88e39468 = ((((((6) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_891b16d924090cce7d4d2f72() {
  return __cxx_static_address_891b16d924090cce7d4d2f72.reference || (__cxx_static_address_891b16d924090cce7d4d2f72.reference = {
    __cReference: true,
    get value() { return CHAINGUN_FIRE____header_global_04172afe88e39468; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:50
export const RPG_SHOOT____header_global_844a81317bee8a75 = ((((((7) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e4bb24b67dcb435984a4c12b() {
  return __cxx_static_address_e4bb24b67dcb435984a4c12b.reference || (__cxx_static_address_e4bb24b67dcb435984a4c12b.reference = {
    __cReference: true,
    get value() { return RPG_SHOOT____header_global_844a81317bee8a75; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:51
export const POOLBALLHIT____header_global_a66161d7500aa175 = ((((((8) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7cf8d9d06cb24f6cc28bd561() {
  return __cxx_static_address_7cf8d9d06cb24f6cc28bd561.reference || (__cxx_static_address_7cf8d9d06cb24f6cc28bd561.reference = {
    __cReference: true,
    get value() { return POOLBALLHIT____header_global_a66161d7500aa175; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:52
export const RPG_EXPLODE____header_global_05d29927f91967d2 = ((((((9) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3abbe97fd17fe3e0d19c5199() {
  return __cxx_static_address_3abbe97fd17fe3e0d19c5199.reference || (__cxx_static_address_3abbe97fd17fe3e0d19c5199.reference = {
    __cReference: true,
    get value() { return RPG_EXPLODE____header_global_05d29927f91967d2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:53
export const CAT_FIRE____header_global_23cf506e5df8bace = ((((((10) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_573de0279c350749df322fa2() {
  return __cxx_static_address_573de0279c350749df322fa2.reference || (__cxx_static_address_573de0279c350749df322fa2.reference = {
    __cReference: true,
    get value() { return CAT_FIRE____header_global_23cf506e5df8bace; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:54
export const SHRINKER_FIRE____header_global_809c272bd1079bd9 = ((((((11) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e6522d331e7b51f61da88a1() {
  return __cxx_static_address_1e6522d331e7b51f61da88a1.reference || (__cxx_static_address_1e6522d331e7b51f61da88a1.reference = {
    __cReference: true,
    get value() { return SHRINKER_FIRE____header_global_809c272bd1079bd9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:55
export const PIPEBOMB_BOUNCE____header_global_4dd83d6a0fa310b2 = ((((((13) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_72cc7254313392bc0e1fc681() {
  return __cxx_static_address_72cc7254313392bc0e1fc681.reference || (__cxx_static_address_72cc7254313392bc0e1fc681.reference = {
    __cReference: true,
    get value() { return PIPEBOMB_BOUNCE____header_global_4dd83d6a0fa310b2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:56
export const PIPEBOMB_EXPLODE____header_global_24d5e77c0bff5fca = ((((((14) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4fbbe42fd785603297bf4ecc() {
  return __cxx_static_address_4fbbe42fd785603297bf4ecc.reference || (__cxx_static_address_4fbbe42fd785603297bf4ecc.reference = {
    __cReference: true,
    get value() { return PIPEBOMB_EXPLODE____header_global_24d5e77c0bff5fca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:57
export const LASERTRIP_ONWALL____header_global_b1cb50a19dcc1036 = ((((((15) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_34dd21b572d5ad98a2414d6c() {
  return __cxx_static_address_34dd21b572d5ad98a2414d6c.reference || (__cxx_static_address_34dd21b572d5ad98a2414d6c.reference = {
    __cReference: true,
    get value() { return LASERTRIP_ONWALL____header_global_b1cb50a19dcc1036; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:58
export const LASERTRIP_ARMING____header_global_3d181e47bdfdc7c5 = ((((((16) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cab0fe07ff32d03734d10bde() {
  return __cxx_static_address_cab0fe07ff32d03734d10bde.reference || (__cxx_static_address_cab0fe07ff32d03734d10bde.reference = {
    __cReference: true,
    get value() { return LASERTRIP_ARMING____header_global_3d181e47bdfdc7c5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:59
export const LASERTRIP_EXPLODE____header_global_34dec7bfc4570d8e = ((((((17) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7b276a8155207c7620de079f() {
  return __cxx_static_address_7b276a8155207c7620de079f.reference || (__cxx_static_address_7b276a8155207c7620de079f.reference = {
    __cReference: true,
    get value() { return LASERTRIP_EXPLODE____header_global_34dec7bfc4570d8e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:60
export const VENT_BUST____header_global_ba9a854c625e1579 = ((((((18) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5f856fa6c86b6f8ad0c59dc2() {
  return __cxx_static_address_5f856fa6c86b6f8ad0c59dc2.reference || (__cxx_static_address_5f856fa6c86b6f8ad0c59dc2.reference = {
    __cReference: true,
    get value() { return VENT_BUST____header_global_ba9a854c625e1579; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:61
export const GLASS_BREAKING____header_global_89b5124aea092950 = ((((((19) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0803544bb3382ddfd3ae612f() {
  return __cxx_static_address_0803544bb3382ddfd3ae612f.reference || (__cxx_static_address_0803544bb3382ddfd3ae612f.reference = {
    __cReference: true,
    get value() { return GLASS_BREAKING____header_global_89b5124aea092950; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:62
export const GLASS_HEAVYBREAK____header_global_882171eb1b662bef = ((((((20) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aa8c878aec06918297447f89() {
  return __cxx_static_address_aa8c878aec06918297447f89.reference || (__cxx_static_address_aa8c878aec06918297447f89.reference = {
    __cReference: true,
    get value() { return GLASS_HEAVYBREAK____header_global_882171eb1b662bef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:63
export const SHORT_CIRCUIT____header_global_707969b941a443aa = ((((((21) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d1f00237193d9c8fb90d0ae5() {
  return __cxx_static_address_d1f00237193d9c8fb90d0ae5.reference || (__cxx_static_address_d1f00237193d9c8fb90d0ae5.reference = {
    __cReference: true,
    get value() { return SHORT_CIRCUIT____header_global_707969b941a443aa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:64
export const ITEM_SPLASH____header_global_813bbf484c84d38a = ((((((22) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4ea3ab1ffdb5c3e26d9208ab() {
  return __cxx_static_address_4ea3ab1ffdb5c3e26d9208ab.reference || (__cxx_static_address_4ea3ab1ffdb5c3e26d9208ab.reference = {
    __cReference: true,
    get value() { return ITEM_SPLASH____header_global_813bbf484c84d38a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:65
export const DUKE_GASP____header_global_82370f0553c01b43 = ((((((25) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4414249571d5244addd4fff9() {
  return __cxx_static_address_4414249571d5244addd4fff9.reference || (__cxx_static_address_4414249571d5244addd4fff9.reference = {
    __cReference: true,
    get value() { return DUKE_GASP____header_global_82370f0553c01b43; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:66
export const SLIM_RECOG____header_global_972a1c756ca31f81 = ((((((26) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a293ac9e509f5bf89a752308() {
  return __cxx_static_address_a293ac9e509f5bf89a752308.reference || (__cxx_static_address_a293ac9e509f5bf89a752308.reference = {
    __cReference: true,
    get value() { return SLIM_RECOG____header_global_972a1c756ca31f81; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:67
export const DUKE_URINATE____header_global_f1017534a669a6e8 = ((((((28) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e3f5e5afc6869fd09d34cd15() {
  return __cxx_static_address_e3f5e5afc6869fd09d34cd15.reference || (__cxx_static_address_e3f5e5afc6869fd09d34cd15.reference = {
    __cReference: true,
    get value() { return DUKE_URINATE____header_global_f1017534a669a6e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:68
export const ENDSEQVOL3SND2____header_global_d2ce9b3c3ba1218d = ((((((29) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b6d5513a91c92f5ccee27139() {
  return __cxx_static_address_b6d5513a91c92f5ccee27139.reference || (__cxx_static_address_b6d5513a91c92f5ccee27139.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND2____header_global_d2ce9b3c3ba1218d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:69
export const ENDSEQVOL3SND3____header_global_873290c7a4d1bf2e = ((((((30) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0655edc6e44967aec53299b0() {
  return __cxx_static_address_0655edc6e44967aec53299b0.reference || (__cxx_static_address_0655edc6e44967aec53299b0.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND3____header_global_873290c7a4d1bf2e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:70
export const DUKE_CRACK____header_global_1c0b3332cb2185fa = ((((((33) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9dba131d606ffeff96bd87a8() {
  return __cxx_static_address_9dba131d606ffeff96bd87a8.reference || (__cxx_static_address_9dba131d606ffeff96bd87a8.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK____header_global_1c0b3332cb2185fa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:71
export const SLIM_ATTACK____header_global_30ef7e8f25c76b29 = ((((((34) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5947cc01be50787f2d568675() {
  return __cxx_static_address_5947cc01be50787f2d568675.reference || (__cxx_static_address_5947cc01be50787f2d568675.reference = {
    __cReference: true,
    get value() { return SLIM_ATTACK____header_global_30ef7e8f25c76b29; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:72
export const SOMETHINGHITFORCE____header_global_7dc7edefb44871be = ((((((35) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3faa503dfda5ada04b9b3d9e() {
  return __cxx_static_address_3faa503dfda5ada04b9b3d9e.reference || (__cxx_static_address_3faa503dfda5ada04b9b3d9e.reference = {
    __cReference: true,
    get value() { return SOMETHINGHITFORCE____header_global_7dc7edefb44871be; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:73
export const DUKE_DRINKING____header_global_e3c09cf82a40fb28 = ((((((36) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f42f0b8a81265e8e4bb8ee24() {
  return __cxx_static_address_f42f0b8a81265e8e4bb8ee24.reference || (__cxx_static_address_f42f0b8a81265e8e4bb8ee24.reference = {
    __cReference: true,
    get value() { return DUKE_DRINKING____header_global_e3c09cf82a40fb28; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:74
export const DUKE_GRUNT____header_global_ee52ee5e5ab57a74 = ((((((38) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ff4aa95522f4cc36242d9f69() {
  return __cxx_static_address_ff4aa95522f4cc36242d9f69.reference || (__cxx_static_address_ff4aa95522f4cc36242d9f69.reference = {
    __cReference: true,
    get value() { return DUKE_GRUNT____header_global_ee52ee5e5ab57a74; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:75
export const DUKE_HARTBEAT____header_global_601e7ccd47457664 = ((((((39) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_66d3bd52cd66ae2154360803() {
  return __cxx_static_address_66d3bd52cd66ae2154360803.reference || (__cxx_static_address_66d3bd52cd66ae2154360803.reference = {
    __cReference: true,
    get value() { return DUKE_HARTBEAT____header_global_601e7ccd47457664; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:76
export const DUKE_ONWATER____header_global_a2a623a4034ed306 = ((((((40) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b254bdf4684e426d77cdc56c() {
  return __cxx_static_address_b254bdf4684e426d77cdc56c.reference || (__cxx_static_address_b254bdf4684e426d77cdc56c.reference = {
    __cReference: true,
    get value() { return DUKE_ONWATER____header_global_a2a623a4034ed306; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:77
export const DUKE_LAND____header_global_fb9cb1d7fdcb1550 = ((((((42) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7a798e6de79d399326b3b9f9() {
  return __cxx_static_address_7a798e6de79d399326b3b9f9.reference || (__cxx_static_address_7a798e6de79d399326b3b9f9.reference = {
    __cReference: true,
    get value() { return DUKE_LAND____header_global_fb9cb1d7fdcb1550; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:78
export const DUKE_WALKINDUCTS____header_global_2e80880ca34ba964 = ((((((43) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7562860ef81c89aa25eebaac() {
  return __cxx_static_address_7562860ef81c89aa25eebaac.reference || (__cxx_static_address_7562860ef81c89aa25eebaac.reference = {
    __cReference: true,
    get value() { return DUKE_WALKINDUCTS____header_global_2e80880ca34ba964; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:79
export const DUKE_UNDERWATER____header_global_df1de08c3af08268 = ((((((48) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4871100387a934751f81ab1e() {
  return __cxx_static_address_4871100387a934751f81ab1e.reference || (__cxx_static_address_4871100387a934751f81ab1e.reference = {
    __cReference: true,
    get value() { return DUKE_UNDERWATER____header_global_df1de08c3af08268; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:80
export const DUKE_JETPACK_ON____header_global_d3d1906e672f8121 = ((((((49) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b97143724d7d4674da0bad47() {
  return __cxx_static_address_b97143724d7d4674da0bad47.reference || (__cxx_static_address_b97143724d7d4674da0bad47.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_ON____header_global_d3d1906e672f8121; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:81
export const DUKE_JETPACK_IDLE____header_global_0874a845fcb78d65 = ((((((50) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3e3c7ca9a1883375c124209b() {
  return __cxx_static_address_3e3c7ca9a1883375c124209b.reference || (__cxx_static_address_3e3c7ca9a1883375c124209b.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_IDLE____header_global_0874a845fcb78d65; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:82
export const DUKE_JETPACK_OFF____header_global_e20432b19e98680b = ((((((51) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7ee0cfb62c6ca5da832b4510() {
  return __cxx_static_address_7ee0cfb62c6ca5da832b4510.reference || (__cxx_static_address_7ee0cfb62c6ca5da832b4510.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_OFF____header_global_e20432b19e98680b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:83
export const DUKETALKTOBOSS____header_global_0860c06ad3b360b9 = ((((((56) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0c0a4d83f346c7b82129fd1b() {
  return __cxx_static_address_0c0a4d83f346c7b82129fd1b.reference || (__cxx_static_address_0c0a4d83f346c7b82129fd1b.reference = {
    __cReference: true,
    get value() { return DUKETALKTOBOSS____header_global_0860c06ad3b360b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:84
export const SQUISHED____header_global_cf411461ffa22639 = ((((((69) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_874bf669e74fd9786746be20() {
  return __cxx_static_address_874bf669e74fd9786746be20.reference || (__cxx_static_address_874bf669e74fd9786746be20.reference = {
    __cReference: true,
    get value() { return SQUISHED____header_global_cf411461ffa22639; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:85
export const TELEPORTER____header_global_5be557922413b673 = ((((((70) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2ed646ded18acdca921d5791() {
  return __cxx_static_address_2ed646ded18acdca921d5791.reference || (__cxx_static_address_2ed646ded18acdca921d5791.reference = {
    __cReference: true,
    get value() { return TELEPORTER____header_global_5be557922413b673; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:86
export const ELEVATOR_ON____header_global_4a745a05af0d62d1 = ((((((71) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8a0fbc2a13c30ff40e661c73() {
  return __cxx_static_address_8a0fbc2a13c30ff40e661c73.reference || (__cxx_static_address_8a0fbc2a13c30ff40e661c73.reference = {
    __cReference: true,
    get value() { return ELEVATOR_ON____header_global_4a745a05af0d62d1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:87
export const ELEVATOR_OFF____header_global_1cce5ea7f721d686 = ((((((73) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c00cd9e6bd80e44689960c6f() {
  return __cxx_static_address_c00cd9e6bd80e44689960c6f.reference || (__cxx_static_address_c00cd9e6bd80e44689960c6f.reference = {
    __cReference: true,
    get value() { return ELEVATOR_OFF____header_global_1cce5ea7f721d686; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:88
export const SUBWAY____header_global_647e8bd45336fc26 = ((((((75) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c97d404374f0a12d5502431b() {
  return __cxx_static_address_c97d404374f0a12d5502431b.reference || (__cxx_static_address_c97d404374f0a12d5502431b.reference = {
    __cReference: true,
    get value() { return SUBWAY____header_global_647e8bd45336fc26; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:89
export const SWITCH_ON____header_global_69f21ff1132ecea8 = ((((((76) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c3993240c83b6003a82ab3d3() {
  return __cxx_static_address_c3993240c83b6003a82ab3d3.reference || (__cxx_static_address_c3993240c83b6003a82ab3d3.reference = {
    __cReference: true,
    get value() { return SWITCH_ON____header_global_69f21ff1132ecea8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:90
export const FLUSH_TOILET____header_global_4488063b242154bd = ((((((79) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_655951e82485c161070de391() {
  return __cxx_static_address_655951e82485c161070de391.reference || (__cxx_static_address_655951e82485c161070de391.reference = {
    __cReference: true,
    get value() { return FLUSH_TOILET____header_global_4488063b242154bd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:91
export const EARTHQUAKE____header_global_6ca46f9411a144fe = ((((((81) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_004459ae8fe948b70c4ae778() {
  return __cxx_static_address_004459ae8fe948b70c4ae778.reference || (__cxx_static_address_004459ae8fe948b70c4ae778.reference = {
    __cReference: true,
    get value() { return EARTHQUAKE____header_global_6ca46f9411a144fe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:92
export const END_OF_LEVEL_WARN____header_global_d1704642fbe60836 = ((((((83) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_90e9127559178e0b842f7e5d() {
  return __cxx_static_address_90e9127559178e0b842f7e5d.reference || (__cxx_static_address_90e9127559178e0b842f7e5d.reference = {
    __cReference: true,
    get value() { return END_OF_LEVEL_WARN____header_global_d1704642fbe60836; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:93
export const WIND_AMBIENCE____header_global_18cf32510aefe088 = ((((((91) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5f93f2806cd54dc8edff5bf3() {
  return __cxx_static_address_5f93f2806cd54dc8edff5bf3.reference || (__cxx_static_address_5f93f2806cd54dc8edff5bf3.reference = {
    __cReference: true,
    get value() { return WIND_AMBIENCE____header_global_18cf32510aefe088; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:94
export const SOMETHING_DRIPPING____header_global_f603aba7cf525070 = ((((((92) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2eb08ecff4cda6c39cf8d84d() {
  return __cxx_static_address_2eb08ecff4cda6c39cf8d84d.reference || (__cxx_static_address_2eb08ecff4cda6c39cf8d84d.reference = {
    __cReference: true,
    get value() { return SOMETHING_DRIPPING____header_global_f603aba7cf525070; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:95
export const BOS1_RECOG____header_global_0cbe334835a8957a = ((((((97) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ce54d08535ba61794f1ca706() {
  return __cxx_static_address_ce54d08535ba61794f1ca706.reference || (__cxx_static_address_ce54d08535ba61794f1ca706.reference = {
    __cReference: true,
    get value() { return BOS1_RECOG____header_global_0cbe334835a8957a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:96
export const BOS2_RECOG____header_global_2b4e0db9cc6662a0 = ((((((102) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_48596b51a0e3e83866b41dbf() {
  return __cxx_static_address_48596b51a0e3e83866b41dbf.reference || (__cxx_static_address_48596b51a0e3e83866b41dbf.reference = {
    __cReference: true,
    get value() { return BOS2_RECOG____header_global_2b4e0db9cc6662a0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:97
export const DUKE_GETWEAPON2____header_global_ee6e848541a5ba73 = ((((((107) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_17f782bf0cec95308bc7641b() {
  return __cxx_static_address_17f782bf0cec95308bc7641b.reference || (__cxx_static_address_17f782bf0cec95308bc7641b.reference = {
    __cReference: true,
    get value() { return DUKE_GETWEAPON2____header_global_ee6e848541a5ba73; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:98
export const SHOTGUN_FIRE____header_global_5596245987f93e72 = ((((((109) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_51fd5366b975c54c301fba70() {
  return __cxx_static_address_51fd5366b975c54c301fba70.reference || (__cxx_static_address_51fd5366b975c54c301fba70.reference = {
    __cReference: true,
    get value() { return SHOTGUN_FIRE____header_global_5596245987f93e72; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:99
export const PRED_RECOG____header_global_4ace5fe30e932f5d = ((((((111) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0ba11b8f1c5248ced6c99b5e() {
  return __cxx_static_address_0ba11b8f1c5248ced6c99b5e.reference || (__cxx_static_address_0ba11b8f1c5248ced6c99b5e.reference = {
    __cReference: true,
    get value() { return PRED_RECOG____header_global_4ace5fe30e932f5d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:100
export const CAPT_RECOG____header_global_aecc956240888f3b = ((((((117) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6055da43688a16ca35af2892() {
  return __cxx_static_address_6055da43688a16ca35af2892.reference || (__cxx_static_address_6055da43688a16ca35af2892.reference = {
    __cReference: true,
    get value() { return CAPT_RECOG____header_global_aecc956240888f3b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:101
export const PIG_RECOG____header_global_87c6d6d480fdf7ce = ((((((121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c8286181396931314b8892b8() {
  return __cxx_static_address_c8286181396931314b8892b8.reference || (__cxx_static_address_c8286181396931314b8892b8.reference = {
    __cReference: true,
    get value() { return PIG_RECOG____header_global_87c6d6d480fdf7ce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:102
export const RECO_ROAM____header_global_016e3892fe6ea83d = ((((((125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d314b756abd0dd09cc25b180() {
  return __cxx_static_address_d314b756abd0dd09cc25b180.reference || (__cxx_static_address_d314b756abd0dd09cc25b180.reference = {
    __cReference: true,
    get value() { return RECO_ROAM____header_global_016e3892fe6ea83d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:103
export const RECO_RECOG____header_global_1245412287dd2c3b = ((((((126) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_03c5a93bdf11afdee0443628() {
  return __cxx_static_address_03c5a93bdf11afdee0443628.reference || (__cxx_static_address_03c5a93bdf11afdee0443628.reference = {
    __cReference: true,
    get value() { return RECO_RECOG____header_global_1245412287dd2c3b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:104
export const RECO_ATTACK____header_global_e3353214546718e1 = ((((((127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_82e4b71fb58de1392d973bb3() {
  return __cxx_static_address_82e4b71fb58de1392d973bb3.reference || (__cxx_static_address_82e4b71fb58de1392d973bb3.reference = {
    __cReference: true,
    get value() { return RECO_ATTACK____header_global_e3353214546718e1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:105
export const RECO_PAIN____header_global_14fde5151ad8c5b3 = ((((((128) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c62a9683c57f10373235e584() {
  return __cxx_static_address_c62a9683c57f10373235e584.reference || (__cxx_static_address_c62a9683c57f10373235e584.reference = {
    __cReference: true,
    get value() { return RECO_PAIN____header_global_14fde5151ad8c5b3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:106
export const DRON_RECOG____header_global_675a03c54790a991 = ((((((131) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b0d3391bdbe08875dfc39319() {
  return __cxx_static_address_b0d3391bdbe08875dfc39319.reference || (__cxx_static_address_b0d3391bdbe08875dfc39319.reference = {
    __cReference: true,
    get value() { return DRON_RECOG____header_global_675a03c54790a991; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:107
export const COMM_RECOG____header_global_307904f64b33a2eb = ((((((136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a66cb625fb3258be9f3fe608() {
  return __cxx_static_address_a66cb625fb3258be9f3fe608.reference || (__cxx_static_address_a66cb625fb3258be9f3fe608.reference = {
    __cReference: true,
    get value() { return COMM_RECOG____header_global_307904f64b33a2eb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:108
export const OCTA_RECOG____header_global_df22cfd79993461d = ((((((141) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_85117db7dbdab6d174c531d9() {
  return __cxx_static_address_85117db7dbdab6d174c531d9.reference || (__cxx_static_address_85117db7dbdab6d174c531d9.reference = {
    __cReference: true,
    get value() { return OCTA_RECOG____header_global_df22cfd79993461d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:109
export const TURR_RECOG____header_global_6164a2ef8d029ba9 = ((((((146) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a683e2f61aa7d807429c5077() {
  return __cxx_static_address_a683e2f61aa7d807429c5077.reference || (__cxx_static_address_a683e2f61aa7d807429c5077.reference = {
    __cReference: true,
    get value() { return TURR_RECOG____header_global_6164a2ef8d029ba9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:110
export const SLIM_DYING____header_global_770cdd7e926560d7 = ((((((149) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_351793f094bdacfcd71e12cf() {
  return __cxx_static_address_351793f094bdacfcd71e12cf.reference || (__cxx_static_address_351793f094bdacfcd71e12cf.reference = {
    __cReference: true,
    get value() { return SLIM_DYING____header_global_770cdd7e926560d7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:111
export const BOS3_RECOG____header_global_ad3915d9e646bfb0 = ((((((151) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1f3773d8f683e0e198b65ecf() {
  return __cxx_static_address_1f3773d8f683e0e198b65ecf.reference || (__cxx_static_address_1f3773d8f683e0e198b65ecf.reference = {
    __cReference: true,
    get value() { return BOS3_RECOG____header_global_ad3915d9e646bfb0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:112
export const BOS1_WALK____header_global_0840ad912d53b329 = ((((((156) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c7fc4c73770ceea9bc1a9194() {
  return __cxx_static_address_c7fc4c73770ceea9bc1a9194.reference || (__cxx_static_address_c7fc4c73770ceea9bc1a9194.reference = {
    __cReference: true,
    get value() { return BOS1_WALK____header_global_0840ad912d53b329; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:113
export const THUD____header_global_4d1b3936b94c84ed = ((((((158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_434e4b6aac0abe727f8c3d47() {
  return __cxx_static_address_434e4b6aac0abe727f8c3d47.reference || (__cxx_static_address_434e4b6aac0abe727f8c3d47.reference = {
    __cReference: true,
    get value() { return THUD____header_global_4d1b3936b94c84ed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:114
export const WIERDSHOT_FLY____header_global_79fe4869aa79e0c8 = ((((((160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_affbf90d57fdd490f36dba5c() {
  return __cxx_static_address_affbf90d57fdd490f36dba5c.reference || (__cxx_static_address_affbf90d57fdd490f36dba5c.reference = {
    __cReference: true,
    get value() { return WIERDSHOT_FLY____header_global_79fe4869aa79e0c8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:115
export const SLIM_ROAM____header_global_5bbcc35754f6b799 = ((((((163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5de2a67fea8d221af62396a3() {
  return __cxx_static_address_5de2a67fea8d221af62396a3.reference || (__cxx_static_address_5de2a67fea8d221af62396a3.reference = {
    __cReference: true,
    get value() { return SLIM_ROAM____header_global_5bbcc35754f6b799; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:116
export const SHOTGUN_COCK____header_global_8ab73bc5408c2b4d = ((((((169) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e34347591b57d332caef0eb9() {
  return __cxx_static_address_e34347591b57d332caef0eb9.reference || (__cxx_static_address_e34347591b57d332caef0eb9.reference = {
    __cReference: true,
    get value() { return SHOTGUN_COCK____header_global_8ab73bc5408c2b4d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:117
export const GENERIC_AMBIENCE17____header_global_cdb4d46dcc7bbcbd = ((((((177) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dd44cefa54a5f86abe7d86ff() {
  return __cxx_static_address_dd44cefa54a5f86abe7d86ff.reference || (__cxx_static_address_dd44cefa54a5f86abe7d86ff.reference = {
    __cReference: true,
    get value() { return GENERIC_AMBIENCE17____header_global_cdb4d46dcc7bbcbd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:118
export const BONUS_SPEECH1____header_global_906b3378b5f10c6e = ((((((195) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5b357e8d373e5a3ad542f10e() {
  return __cxx_static_address_5b357e8d373e5a3ad542f10e.reference || (__cxx_static_address_5b357e8d373e5a3ad542f10e.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH1____header_global_906b3378b5f10c6e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:119
export const BONUS_SPEECH2____header_global_d3ab5b64806e1112 = ((((((196) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_561900a216a351131df92337() {
  return __cxx_static_address_561900a216a351131df92337.reference || (__cxx_static_address_561900a216a351131df92337.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH2____header_global_d3ab5b64806e1112; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:120
export const BONUS_SPEECH3____header_global_677a1913ce441b5f = ((((((197) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2b63c330a0e46cf3919790a6() {
  return __cxx_static_address_2b63c330a0e46cf3919790a6.reference || (__cxx_static_address_2b63c330a0e46cf3919790a6.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH3____header_global_677a1913ce441b5f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:121
export const BONUS_SPEECH4____header_global_dbbc2b22825576ed = ((((((199) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_98327a7157b4072ba0b6fe00() {
  return __cxx_static_address_98327a7157b4072ba0b6fe00.reference || (__cxx_static_address_98327a7157b4072ba0b6fe00.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH4____header_global_dbbc2b22825576ed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:122
export const DUKE_LAND_HURT____header_global_ec5c1b34a3d47ac5 = ((((((200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_93164477d18f5c41828c1e39() {
  return __cxx_static_address_93164477d18f5c41828c1e39.reference || (__cxx_static_address_93164477d18f5c41828c1e39.reference = {
    __cReference: true,
    get value() { return DUKE_LAND_HURT____header_global_ec5c1b34a3d47ac5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:123
export const DUKE_SEARCH2____header_global_e87818a74073f0e9 = ((((((207) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3fed8866ded886ec0ca4cd64() {
  return __cxx_static_address_3fed8866ded886ec0ca4cd64.reference || (__cxx_static_address_3fed8866ded886ec0ca4cd64.reference = {
    __cReference: true,
    get value() { return DUKE_SEARCH2____header_global_e87818a74073f0e9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:124
export const DUKE_CRACK2____header_global_e854757d1c03b8fb = ((((((208) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4325477bed19091af1d45cab() {
  return __cxx_static_address_4325477bed19091af1d45cab.reference || (__cxx_static_address_4325477bed19091af1d45cab.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK2____header_global_e854757d1c03b8fb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:125
export const DUKE_SEARCH____header_global_d0b4295ec8605377 = ((((((209) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_94cb9c7051748a3355c42387() {
  return __cxx_static_address_94cb9c7051748a3355c42387.reference || (__cxx_static_address_94cb9c7051748a3355c42387.reference = {
    __cReference: true,
    get value() { return DUKE_SEARCH____header_global_d0b4295ec8605377; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:126
export const DUKE_GET____header_global_81835caffb406550 = ((((((210) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c28cbd9fd40b3c2c31fc2ba7() {
  return __cxx_static_address_c28cbd9fd40b3c2c31fc2ba7.reference || (__cxx_static_address_c28cbd9fd40b3c2c31fc2ba7.reference = {
    __cReference: true,
    get value() { return DUKE_GET____header_global_81835caffb406550; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:127
export const DUKE_LONGTERM_PAIN____header_global_99e4dd4099294511 = ((((((211) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f13545e5fcd4186c9b664f0e() {
  return __cxx_static_address_f13545e5fcd4186c9b664f0e.reference || (__cxx_static_address_f13545e5fcd4186c9b664f0e.reference = {
    __cReference: true,
    get value() { return DUKE_LONGTERM_PAIN____header_global_99e4dd4099294511; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:128
export const MONITOR_ACTIVE____header_global_35e57f81f0821acd = ((((((212) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3b9e92f99ae39e43f9662de6() {
  return __cxx_static_address_3b9e92f99ae39e43f9662de6.reference || (__cxx_static_address_3b9e92f99ae39e43f9662de6.reference = {
    __cReference: true,
    get value() { return MONITOR_ACTIVE____header_global_35e57f81f0821acd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:129
export const NITEVISION_ONOFF____header_global_257469a576bdf882 = ((((((213) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eb1f2238b89a7dc579670df4() {
  return __cxx_static_address_eb1f2238b89a7dc579670df4.reference || (__cxx_static_address_eb1f2238b89a7dc579670df4.reference = {
    __cReference: true,
    get value() { return NITEVISION_ONOFF____header_global_257469a576bdf882; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:130
export const DUKE_CRACK_FIRST____header_global_18aae5cc71d3cc9d = ((((((215) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_399eec182223554afcf316f2() {
  return __cxx_static_address_399eec182223554afcf316f2.reference || (__cxx_static_address_399eec182223554afcf316f2.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK_FIRST____header_global_18aae5cc71d3cc9d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:131
export const DUKE_USEMEDKIT____header_global_51b9f32db5908375 = ((((((216) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_22332d80f9c9d81d45f5e19e() {
  return __cxx_static_address_22332d80f9c9d81d45f5e19e.reference || (__cxx_static_address_22332d80f9c9d81d45f5e19e.reference = {
    __cReference: true,
    get value() { return DUKE_USEMEDKIT____header_global_51b9f32db5908375; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:132
export const DUKE_TAKEPILLS____header_global_a927176e76573dfb = ((((((217) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9b978dcb8c46b751380fb89b() {
  return __cxx_static_address_9b978dcb8c46b751380fb89b.reference || (__cxx_static_address_9b978dcb8c46b751380fb89b.reference = {
    __cReference: true,
    get value() { return DUKE_TAKEPILLS____header_global_a927176e76573dfb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:133
export const DUKE_PISSRELIEF____header_global_ae18d98b6a56916a = ((((((218) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_58d3e930108fad8d224e45e5() {
  return __cxx_static_address_58d3e930108fad8d224e45e5.reference || (__cxx_static_address_58d3e930108fad8d224e45e5.reference = {
    __cReference: true,
    get value() { return DUKE_PISSRELIEF____header_global_ae18d98b6a56916a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:134
export const SELECT_WEAPON____header_global_a47aadfb4f69c919 = ((((((219) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_03aa9dfd5caa3a0d3574b8ee() {
  return __cxx_static_address_03aa9dfd5caa3a0d3574b8ee.reference || (__cxx_static_address_03aa9dfd5caa3a0d3574b8ee.reference = {
    __cReference: true,
    get value() { return SELECT_WEAPON____header_global_a47aadfb4f69c919; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:135
export const JIBBED_ACTOR5____header_global_16ec0ff6e21604d3 = ((((((226) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_878b6811c1254200fe098cf4() {
  return __cxx_static_address_878b6811c1254200fe098cf4.reference || (__cxx_static_address_878b6811c1254200fe098cf4.reference = {
    __cReference: true,
    get value() { return JIBBED_ACTOR5____header_global_16ec0ff6e21604d3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:136
export const JIBBED_ACTOR6____header_global_6e0a9dcff9ffdba2 = ((((((227) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f8c6eb2d5dfffb982189c303() {
  return __cxx_static_address_f8c6eb2d5dfffb982189c303.reference || (__cxx_static_address_f8c6eb2d5dfffb982189c303.reference = {
    __cReference: true,
    get value() { return JIBBED_ACTOR6____header_global_6e0a9dcff9ffdba2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:137
export const DUKE_GOTHEALTHATLOW____header_global_516080bc23a570f0 = ((((((229) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_60d15383e396c9db27d9811a() {
  return __cxx_static_address_60d15383e396c9db27d9811a.reference || (__cxx_static_address_60d15383e396c9db27d9811a.reference = {
    __cReference: true,
    get value() { return DUKE_GOTHEALTHATLOW____header_global_516080bc23a570f0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:138
export const BOSSTALKTODUKE____header_global_ef22e17f76ab50ab = ((((((230) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cf8c581fabf8ca48a626dd13() {
  return __cxx_static_address_cf8c581fabf8ca48a626dd13.reference || (__cxx_static_address_cf8c581fabf8ca48a626dd13.reference = {
    __cReference: true,
    get value() { return BOSSTALKTODUKE____header_global_ef22e17f76ab50ab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:139
export const WAR_AMBIENCE2____header_global_6ca1d9fd7e4d2e5f = ((((((232) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c5e7db17a4b4d8cffa300765() {
  return __cxx_static_address_c5e7db17a4b4d8cffa300765.reference || (__cxx_static_address_c5e7db17a4b4d8cffa300765.reference = {
    __cReference: true,
    get value() { return WAR_AMBIENCE2____header_global_6ca1d9fd7e4d2e5f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:140
export const EXITMENUSOUND____header_global_608919a5f2506169 = ((((((243) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_978307d7a73d9c41c8cc94de() {
  return __cxx_static_address_978307d7a73d9c41c8cc94de.reference || (__cxx_static_address_978307d7a73d9c41c8cc94de.reference = {
    __cReference: true,
    get value() { return EXITMENUSOUND____header_global_608919a5f2506169; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:141
export const FLY_BY____header_global_8713e8a245367f28 = ((((((244) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ec1e9544988e932db33d51ee() {
  return __cxx_static_address_ec1e9544988e932db33d51ee.reference || (__cxx_static_address_ec1e9544988e932db33d51ee.reference = {
    __cReference: true,
    get value() { return FLY_BY____header_global_8713e8a245367f28; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:142
export const DUKE_SCREAM____header_global_f461f0c51b0797b1 = ((((((245) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_73e9901e3223a39199e24e9a() {
  return __cxx_static_address_73e9901e3223a39199e24e9a.reference || (__cxx_static_address_73e9901e3223a39199e24e9a.reference = {
    __cReference: true,
    get value() { return DUKE_SCREAM____header_global_f461f0c51b0797b1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:143
export const SHRINKER_HIT____header_global_7b54888e19e352cb = ((((((246) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4414db60eb682febbc80478b() {
  return __cxx_static_address_4414db60eb682febbc80478b.reference || (__cxx_static_address_4414db60eb682febbc80478b.reference = {
    __cReference: true,
    get value() { return SHRINKER_HIT____header_global_7b54888e19e352cb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:144
export const RATTY____header_global_49c202828110d673 = ((((((247) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_07902ae1e4e27e38a13a44c1() {
  return __cxx_static_address_07902ae1e4e27e38a13a44c1.reference || (__cxx_static_address_07902ae1e4e27e38a13a44c1.reference = {
    __cReference: true,
    get value() { return RATTY____header_global_49c202828110d673; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:145
export const BONUSMUSIC____header_global_7d1b3609889f36f8 = ((((((249) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3678fedb2da83d712ee3d512() {
  return __cxx_static_address_3678fedb2da83d712ee3d512.reference || (__cxx_static_address_3678fedb2da83d712ee3d512.reference = {
    __cReference: true,
    get value() { return BONUSMUSIC____header_global_7d1b3609889f36f8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:146
export const DUKE_GETWEAPON6____header_global_a6b0dbdc8ef0c872 = ((((((264) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_42e380bc21a6c492ae06253a() {
  return __cxx_static_address_42e380bc21a6c492ae06253a.reference || (__cxx_static_address_42e380bc21a6c492ae06253a.reference = {
    __cReference: true,
    get value() { return DUKE_GETWEAPON6____header_global_a6b0dbdc8ef0c872; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:147
export const ALIEN_SWITCH1____header_global_fcd19dd17b081f36 = ((((((272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d4fc32e3634dd6b79eb95459() {
  return __cxx_static_address_d4fc32e3634dd6b79eb95459.reference || (__cxx_static_address_d4fc32e3634dd6b79eb95459.reference = {
    __cReference: true,
    get value() { return ALIEN_SWITCH1____header_global_fcd19dd17b081f36; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:148
export const RIPHEADNECK____header_global_bf92fbeec7608867 = ((((((284) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ac2d601686b365e58d6aae76() {
  return __cxx_static_address_ac2d601686b365e58d6aae76.reference || (__cxx_static_address_ac2d601686b365e58d6aae76.reference = {
    __cReference: true,
    get value() { return RIPHEADNECK____header_global_bf92fbeec7608867; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:149
export const ENDSEQVOL3SND4____header_global_35eda15d3d53e5eb = ((((((288) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1139792ce47f1b421a3161c7() {
  return __cxx_static_address_1139792ce47f1b421a3161c7.reference || (__cxx_static_address_1139792ce47f1b421a3161c7.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND4____header_global_35eda15d3d53e5eb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:150
export const ENDSEQVOL3SND5____header_global_0e1251285c2e27ce = ((((((289) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9dae02c134a27fd399d5d05a() {
  return __cxx_static_address_9dae02c134a27fd399d5d05a.reference || (__cxx_static_address_9dae02c134a27fd399d5d05a.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND5____header_global_0e1251285c2e27ce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:151
export const ENDSEQVOL3SND6____header_global_5bdfd15867793db2 = ((((((290) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bd632513e41bfe502e427506() {
  return __cxx_static_address_bd632513e41bfe502e427506.reference || (__cxx_static_address_bd632513e41bfe502e427506.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND6____header_global_5bdfd15867793db2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:152
export const ENDSEQVOL3SND7____header_global_1148672a17560f7a = ((((((291) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0a5b82325eb460b8d0bfd428() {
  return __cxx_static_address_0a5b82325eb460b8d0bfd428.reference || (__cxx_static_address_0a5b82325eb460b8d0bfd428.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND7____header_global_1148672a17560f7a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:153
export const ENDSEQVOL3SND8____header_global_a8aa2d0507708c31 = ((((((292) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3342ea816e8c827305cf9164() {
  return __cxx_static_address_3342ea816e8c827305cf9164.reference || (__cxx_static_address_3342ea816e8c827305cf9164.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND8____header_global_a8aa2d0507708c31; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:154
export const ENDSEQVOL3SND9____header_global_1e8a0ac7f0e35a98 = ((((((293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eb60632b96fe7c9a08e720fe() {
  return __cxx_static_address_eb60632b96fe7c9a08e720fe.reference || (__cxx_static_address_eb60632b96fe7c9a08e720fe.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND9____header_global_1e8a0ac7f0e35a98; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:155
export const WHIPYOURASS____header_global_78dc9654fd5972b8 = ((((((294) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d93ac7302c85083e1f34f0e4() {
  return __cxx_static_address_d93ac7302c85083e1f34f0e4.reference || (__cxx_static_address_d93ac7302c85083e1f34f0e4.reference = {
    __cReference: true,
    get value() { return WHIPYOURASS____header_global_78dc9654fd5972b8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:156
export const ENDSEQVOL2SND1____header_global_280ef1886223b982 = ((((((295) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a7707e2ea86f58e915407972() {
  return __cxx_static_address_a7707e2ea86f58e915407972.reference || (__cxx_static_address_a7707e2ea86f58e915407972.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND1____header_global_280ef1886223b982; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:157
export const ENDSEQVOL2SND2____header_global_c775ccd62a5c3cfd = ((((((296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cb9c437200ab20c6e96beea7() {
  return __cxx_static_address_cb9c437200ab20c6e96beea7.reference || (__cxx_static_address_cb9c437200ab20c6e96beea7.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND2____header_global_c775ccd62a5c3cfd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:158
export const ENDSEQVOL2SND3____header_global_56ec39c7aed5acd5 = ((((((297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_919cd27eb1d4522b7a8c3395() {
  return __cxx_static_address_919cd27eb1d4522b7a8c3395.reference || (__cxx_static_address_919cd27eb1d4522b7a8c3395.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND3____header_global_56ec39c7aed5acd5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:159
export const ENDSEQVOL2SND4____header_global_79cc2e839b72281e = ((((((298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b502027a3a192a3bf631d54e() {
  return __cxx_static_address_b502027a3a192a3bf631d54e.reference || (__cxx_static_address_b502027a3a192a3bf631d54e.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND4____header_global_79cc2e839b72281e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:160
export const ENDSEQVOL2SND5____header_global_f03c127fd548be52 = ((((((299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6a3ea96e0bf44f8c84d360f1() {
  return __cxx_static_address_6a3ea96e0bf44f8c84d360f1.reference || (__cxx_static_address_6a3ea96e0bf44f8c84d360f1.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND5____header_global_f03c127fd548be52; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:161
export const ENDSEQVOL2SND6____header_global_2b67d715ac6e8cb5 = ((((((300) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cfe01e7445738ddbab0ede9a() {
  return __cxx_static_address_cfe01e7445738ddbab0ede9a.reference || (__cxx_static_address_cfe01e7445738ddbab0ede9a.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND6____header_global_2b67d715ac6e8cb5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:162
export const ENDSEQVOL2SND7____header_global_6635070747b855f3 = ((((((301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b1bf5cd4b512c61d292ad436() {
  return __cxx_static_address_b1bf5cd4b512c61d292ad436.reference || (__cxx_static_address_b1bf5cd4b512c61d292ad436.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND7____header_global_6635070747b855f3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:163
export const SOMETHINGFROZE____header_global_128821b50d31edbc = ((((((303) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5c0494bb684cd291c450d3e3() {
  return __cxx_static_address_5c0494bb684cd291c450d3e3.reference || (__cxx_static_address_5c0494bb684cd291c450d3e3.reference = {
    __cReference: true,
    get value() { return SOMETHINGFROZE____header_global_128821b50d31edbc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:164
export const WIND_REPEAT____header_global_832889333055a270 = ((((((308) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c2a886a70a469cc3cafb7daa() {
  return __cxx_static_address_c2a886a70a469cc3cafb7daa.reference || (__cxx_static_address_c2a886a70a469cc3cafb7daa.reference = {
    __cReference: true,
    get value() { return WIND_REPEAT____header_global_832889333055a270; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:165
export const BOS4_RECOG____header_global_4dbeb1ac8b49cd2a = ((((((342) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_646443dcb31a95e6edfdc701() {
  return __cxx_static_address_646443dcb31a95e6edfdc701.reference || (__cxx_static_address_646443dcb31a95e6edfdc701.reference = {
    __cReference: true,
    get value() { return BOS4_RECOG____header_global_4dbeb1ac8b49cd2a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:166
export const LIGHTNING_SLAP____header_global_bdf2f306118c57a0 = ((((((351) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_78d807ce77cd9fd630f31465() {
  return __cxx_static_address_78d807ce77cd9fd630f31465.reference || (__cxx_static_address_78d807ce77cd9fd630f31465.reference = {
    __cReference: true,
    get value() { return LIGHTNING_SLAP____header_global_bdf2f306118c57a0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:167
export const THUNDER____header_global_82e91ffdee29b767 = ((((((352) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dc965cf3d2bf3442b94c44ae() {
  return __cxx_static_address_dc965cf3d2bf3442b94c44ae.reference || (__cxx_static_address_dc965cf3d2bf3442b94c44ae.reference = {
    __cReference: true,
    get value() { return THUNDER____header_global_82e91ffdee29b767; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:168
export const INTRO4_1____header_global_ab73ac2e3044f43b = ((((((363) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6333e970ed2835558ac5c737() {
  return __cxx_static_address_6333e970ed2835558ac5c737.reference || (__cxx_static_address_6333e970ed2835558ac5c737.reference = {
    __cReference: true,
    get value() { return INTRO4_1____header_global_ab73ac2e3044f43b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:169
export const INTRO4_2____header_global_8339b9484e31382f = ((((((364) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0ba8e39e50fe7ed6e049eba6() {
  return __cxx_static_address_0ba8e39e50fe7ed6e049eba6.reference || (__cxx_static_address_0ba8e39e50fe7ed6e049eba6.reference = {
    __cReference: true,
    get value() { return INTRO4_2____header_global_8339b9484e31382f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:170
export const INTRO4_3____header_global_68e7e98eac8daa77 = ((((((365) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b769edab661ce1b7c301682e() {
  return __cxx_static_address_b769edab661ce1b7c301682e.reference || (__cxx_static_address_b769edab661ce1b7c301682e.reference = {
    __cReference: true,
    get value() { return INTRO4_3____header_global_68e7e98eac8daa77; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:171
export const INTRO4_4____header_global_271a608be7591650 = ((((((366) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c783a6688fdb38dd68bd563f() {
  return __cxx_static_address_c783a6688fdb38dd68bd563f.reference || (__cxx_static_address_c783a6688fdb38dd68bd563f.reference = {
    __cReference: true,
    get value() { return INTRO4_4____header_global_271a608be7591650; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:172
export const INTRO4_5____header_global_48ef6b39b63a60b6 = ((((((367) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_79a3a08c21063519048c9531() {
  return __cxx_static_address_79a3a08c21063519048c9531.reference || (__cxx_static_address_79a3a08c21063519048c9531.reference = {
    __cReference: true,
    get value() { return INTRO4_5____header_global_48ef6b39b63a60b6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:173
export const INTRO4_6____header_global_2b81d99895584c32 = ((((((368) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ef91b0bf87092ff1316cd6c3() {
  return __cxx_static_address_ef91b0bf87092ff1316cd6c3.reference || (__cxx_static_address_ef91b0bf87092ff1316cd6c3.reference = {
    __cReference: true,
    get value() { return INTRO4_6____header_global_2b81d99895584c32; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:174
export const BOSS4_DEADSPEECH____header_global_7badb384ae715126 = ((((((370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e629be4fa94b4bd744683df8() {
  return __cxx_static_address_e629be4fa94b4bd744683df8.reference || (__cxx_static_address_e629be4fa94b4bd744683df8.reference = {
    __cReference: true,
    get value() { return BOSS4_DEADSPEECH____header_global_7badb384ae715126; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:175
export const BOSS4_FIRSTSEE____header_global_85bfa50b98e98e3c = ((((((371) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9bb2eed66d2e70f36e58c34d() {
  return __cxx_static_address_9bb2eed66d2e70f36e58c34d.reference || (__cxx_static_address_9bb2eed66d2e70f36e58c34d.reference = {
    __cReference: true,
    get value() { return BOSS4_FIRSTSEE____header_global_85bfa50b98e98e3c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:176
export const VOL4ENDSND1____header_global_3da93762b4b6a5d1 = ((((((384) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_101fe8c45025c2d4b4030963() {
  return __cxx_static_address_101fe8c45025c2d4b4030963.reference || (__cxx_static_address_101fe8c45025c2d4b4030963.reference = {
    __cReference: true,
    get value() { return VOL4ENDSND1____header_global_3da93762b4b6a5d1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:177
export const VOL4ENDSND2____header_global_204296a8f7259459 = ((((((385) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d7861a1d65bfca01e5e50cfd() {
  return __cxx_static_address_d7861a1d65bfca01e5e50cfd.reference || (__cxx_static_address_d7861a1d65bfca01e5e50cfd.reference = {
    __cReference: true,
    get value() { return VOL4ENDSND2____header_global_204296a8f7259459; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:178
export const EXPANDERSHOOT____header_global_179b28628b2f231e = ((((((388) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f7b6c45f29dc34fb90085c87() {
  return __cxx_static_address_f7b6c45f29dc34fb90085c87.reference || (__cxx_static_address_f7b6c45f29dc34fb90085c87.reference = {
    __cReference: true,
    get value() { return EXPANDERSHOOT____header_global_179b28628b2f231e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:179
export const INTRO4_B____header_global_c9957032ba1ae420 = ((((((392) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_13d95cc7debf245169e8fd3d() {
  return __cxx_static_address_13d95cc7debf245169e8fd3d.reference || (__cxx_static_address_13d95cc7debf245169e8fd3d.reference = {
    __cReference: true,
    get value() { return INTRO4_B____header_global_c9957032ba1ae420; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:180
export const BIGBANG____header_global_a1ce443f3270d9ea = ((((((393) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6eeb5c4ac0fda2dd87054717() {
  return __cxx_static_address_6eeb5c4ac0fda2dd87054717.reference || (__cxx_static_address_6eeb5c4ac0fda2dd87054717.reference = {
    __cReference: true,
    get value() { return BIGBANG____header_global_a1ce443f3270d9ea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:181
export const FLAMETHROWER_INTRO____header_global_15e191516941c213 = ((((((398) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c4a04febef7b4c5cf19de666() {
  return __cxx_static_address_c4a04febef7b4c5cf19de666.reference || (__cxx_static_address_c4a04febef7b4c5cf19de666.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_INTRO____header_global_15e191516941c213; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:182
export const FLAMETHROWER_LOOP____header_global_40832db79ca4940e = ((((((399) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_760815617b7ec4bb1edc1e4a() {
  return __cxx_static_address_760815617b7ec4bb1edc1e4a.reference || (__cxx_static_address_760815617b7ec4bb1edc1e4a.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_LOOP____header_global_40832db79ca4940e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:183
export const FLAMETHROWER_END____header_global_518ad369bba3e2e7 = ((((((400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_79dd0ea4ae7f7f5c02dddc7d() {
  return __cxx_static_address_79dd0ea4ae7f7f5c02dddc7d.reference || (__cxx_static_address_79dd0ea4ae7f7f5c02dddc7d.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_END____header_global_518ad369bba3e2e7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:184
export const E5L7_DUKE_QUIT_YOU____header_global_9b4e50a7d2bc6f4d = ((((((401) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1cdae818abe10ec3da6f204e() {
  return __cxx_static_address_1cdae818abe10ec3da6f204e.reference || (__cxx_static_address_1cdae818abe10ec3da6f204e.reference = {
    __cReference: true,
    get value() { return E5L7_DUKE_QUIT_YOU____header_global_9b4e50a7d2bc6f4d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:187
export const SECTOREFFECTOR____header_global_65489e40563d516a = ((((((1) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bc1a0244d2ca7b77be9a00a3() {
  return __cxx_static_address_bc1a0244d2ca7b77be9a00a3.reference || (__cxx_static_address_bc1a0244d2ca7b77be9a00a3.reference = {
    __cReference: true,
    get value() { return SECTOREFFECTOR____header_global_65489e40563d516a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:188
export const ACTIVATOR____header_global_a3850bfbba28bf27 = ((((((2) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7821a394c0c8c1229312f17f() {
  return __cxx_static_address_7821a394c0c8c1229312f17f.reference || (__cxx_static_address_7821a394c0c8c1229312f17f.reference = {
    __cReference: true,
    get value() { return ACTIVATOR____header_global_a3850bfbba28bf27; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:189
export const TOUCHPLATE____header_global_a3659aae8dab9bd0 = ((((((3) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_30b54b1057cf2e9cc8a4a56d() {
  return __cxx_static_address_30b54b1057cf2e9cc8a4a56d.reference || (__cxx_static_address_30b54b1057cf2e9cc8a4a56d.reference = {
    __cReference: true,
    get value() { return TOUCHPLATE____header_global_a3659aae8dab9bd0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:190
export const ACTIVATORLOCKED____header_global_2df4cf761f8c5990 = ((((((4) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e074fbfedbb0249fb9cba679() {
  return __cxx_static_address_e074fbfedbb0249fb9cba679.reference || (__cxx_static_address_e074fbfedbb0249fb9cba679.reference = {
    __cReference: true,
    get value() { return ACTIVATORLOCKED____header_global_2df4cf761f8c5990; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:191
export const MUSICANDSFX____header_global_e7bb058048a50ddc = ((((((5) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_92bf2ff53de40587d280cae5() {
  return __cxx_static_address_92bf2ff53de40587d280cae5.reference || (__cxx_static_address_92bf2ff53de40587d280cae5.reference = {
    __cReference: true,
    get value() { return MUSICANDSFX____header_global_e7bb058048a50ddc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:192
export const LOCATORS____header_global_9d7e96bebd849515 = ((((((6) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_180cdd5699f30e0ab4066e13() {
  return __cxx_static_address_180cdd5699f30e0ab4066e13.reference || (__cxx_static_address_180cdd5699f30e0ab4066e13.reference = {
    __cReference: true,
    get value() { return LOCATORS____header_global_9d7e96bebd849515; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:193
export const CYCLER____header_global_5eb9323745cf7840 = ((((((7) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fe0fcbaf6e0b442ec1f8313f() {
  return __cxx_static_address_fe0fcbaf6e0b442ec1f8313f.reference || (__cxx_static_address_fe0fcbaf6e0b442ec1f8313f.reference = {
    __cReference: true,
    get value() { return CYCLER____header_global_5eb9323745cf7840; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:194
export const MASTERSWITCH____header_global_4cc3467ad35ab348 = ((((((8) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eefc7374325a2681b839fbd7() {
  return __cxx_static_address_eefc7374325a2681b839fbd7.reference || (__cxx_static_address_eefc7374325a2681b839fbd7.reference = {
    __cReference: true,
    get value() { return MASTERSWITCH____header_global_4cc3467ad35ab348; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:195
export const RESPAWN____header_global_9965d005dcc035de = ((((((9) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ff7c9b6955806173c26a2093() {
  return __cxx_static_address_ff7c9b6955806173c26a2093.reference || (__cxx_static_address_ff7c9b6955806173c26a2093.reference = {
    __cReference: true,
    get value() { return RESPAWN____header_global_9965d005dcc035de; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:196
export const GPSPEED____header_global_97380161f56ceed6 = ((((((10) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_25c27f93b35bd1a09885dcff() {
  return __cxx_static_address_25c27f93b35bd1a09885dcff.reference || (__cxx_static_address_25c27f93b35bd1a09885dcff.reference = {
    __cReference: true,
    get value() { return GPSPEED____header_global_97380161f56ceed6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:197
export const FOF____header_global_611c95c00d7d08ca = ((((((13) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3e617fc505439a47b128f3e9() {
  return __cxx_static_address_3e617fc505439a47b128f3e9.reference || (__cxx_static_address_3e617fc505439a47b128f3e9.reference = {
    __cReference: true,
    get value() { return FOF____header_global_611c95c00d7d08ca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:198
export const ARROW____header_global_762f36d5e4a91788 = ((((((20) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_941eeb8851249146af46dc6b() {
  return __cxx_static_address_941eeb8851249146af46dc6b.reference || (__cxx_static_address_941eeb8851249146af46dc6b.reference = {
    __cReference: true,
    get value() { return ARROW____header_global_762f36d5e4a91788; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:199
export const FIRSTGUNSPRITE____header_global_766fd434e64e93d2 = ((((((21) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_02d3d954a50c4393ae0084e0() {
  return __cxx_static_address_02d3d954a50c4393ae0084e0.reference || (__cxx_static_address_02d3d954a50c4393ae0084e0.reference = {
    __cReference: true,
    get value() { return FIRSTGUNSPRITE____header_global_766fd434e64e93d2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:200
export const CHAINGUNSPRITE____header_global_aa0b8a4201fd12e6 = ((((((22) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_daa4c4eac9cb10b92e12f180() {
  return __cxx_static_address_daa4c4eac9cb10b92e12f180.reference || (__cxx_static_address_daa4c4eac9cb10b92e12f180.reference = {
    __cReference: true,
    get value() { return CHAINGUNSPRITE____header_global_aa0b8a4201fd12e6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:201
export const RPGSPRITE____header_global_1621450c8241ab7a = ((((((23) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3a341e23b847f4e3522e2fb2() {
  return __cxx_static_address_3a341e23b847f4e3522e2fb2.reference || (__cxx_static_address_3a341e23b847f4e3522e2fb2.reference = {
    __cReference: true,
    get value() { return RPGSPRITE____header_global_1621450c8241ab7a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:202
export const FREEZESPRITE____header_global_68cad3450781e503 = ((((((24) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6c75ff32965a5ecbc6f9a1c1() {
  return __cxx_static_address_6c75ff32965a5ecbc6f9a1c1.reference || (__cxx_static_address_6c75ff32965a5ecbc6f9a1c1.reference = {
    __cReference: true,
    get value() { return FREEZESPRITE____header_global_68cad3450781e503; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:203
export const SHRINKERSPRITE____header_global_b0c80b62bcf73078 = ((((((25) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1ac25e70c02b5358495032df() {
  return __cxx_static_address_1ac25e70c02b5358495032df.reference || (__cxx_static_address_1ac25e70c02b5358495032df.reference = {
    __cReference: true,
    get value() { return SHRINKERSPRITE____header_global_b0c80b62bcf73078; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:204
export const HEAVYHBOMB____header_global_209be419e316faa7 = ((((((26) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_47c0ef57ad5812542d0fab89() {
  return __cxx_static_address_47c0ef57ad5812542d0fab89.reference || (__cxx_static_address_47c0ef57ad5812542d0fab89.reference = {
    __cReference: true,
    get value() { return HEAVYHBOMB____header_global_209be419e316faa7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:205
export const TRIPBOMBSPRITE____header_global_fd68fff7590edc28 = ((((((27) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_53201455d1a33931c7b2c2ab() {
  return __cxx_static_address_53201455d1a33931c7b2c2ab.reference || (__cxx_static_address_53201455d1a33931c7b2c2ab.reference = {
    __cReference: true,
    get value() { return TRIPBOMBSPRITE____header_global_fd68fff7590edc28; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:206
export const SHOTGUNSPRITE____header_global_b99e07666dad8686 = ((((((28) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_684a5c9529ced3753e9a9c18() {
  return __cxx_static_address_684a5c9529ced3753e9a9c18.reference || (__cxx_static_address_684a5c9529ced3753e9a9c18.reference = {
    __cReference: true,
    get value() { return SHOTGUNSPRITE____header_global_b99e07666dad8686; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:207
export const DEVISTATORSPRITE____header_global_70dbb82118a1b933 = ((((((29) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_972353eb8e52bb5a9196e92e() {
  return __cxx_static_address_972353eb8e52bb5a9196e92e.reference || (__cxx_static_address_972353eb8e52bb5a9196e92e.reference = {
    __cReference: true,
    get value() { return DEVISTATORSPRITE____header_global_70dbb82118a1b933; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:208
export const HEALTHBOX____header_global_4949a47c80ce5b61 = ((((((30) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_31faac5b2539d36869736dde() {
  return __cxx_static_address_31faac5b2539d36869736dde.reference || (__cxx_static_address_31faac5b2539d36869736dde.reference = {
    __cReference: true,
    get value() { return HEALTHBOX____header_global_4949a47c80ce5b61; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:209
export const AMMOBOX____header_global_089d28f731a9b95f = ((((((31) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eefdff889fc4726b75a97d40() {
  return __cxx_static_address_eefdff889fc4726b75a97d40.reference || (__cxx_static_address_eefdff889fc4726b75a97d40.reference = {
    __cReference: true,
    get value() { return AMMOBOX____header_global_089d28f731a9b95f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:210
export const GROWSPRITEICON____header_global_eef17b996a45e83e = ((((((32) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_82694bb9896bf55ae93e04d3() {
  return __cxx_static_address_82694bb9896bf55ae93e04d3.reference || (__cxx_static_address_82694bb9896bf55ae93e04d3.reference = {
    __cReference: true,
    get value() { return GROWSPRITEICON____header_global_eef17b996a45e83e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:211
export const INVENTORYBOX____header_global_84f811affefb6489 = ((((((33) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_50f9386a13f1a2860b4a3a60() {
  return __cxx_static_address_50f9386a13f1a2860b4a3a60.reference || (__cxx_static_address_50f9386a13f1a2860b4a3a60.reference = {
    __cReference: true,
    get value() { return INVENTORYBOX____header_global_84f811affefb6489; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:212
export const FREEZEAMMO____header_global_9a0eadcac584209f = ((((((37) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c4e6b801d6e443b777b0ade6() {
  return __cxx_static_address_c4e6b801d6e443b777b0ade6.reference || (__cxx_static_address_c4e6b801d6e443b777b0ade6.reference = {
    __cReference: true,
    get value() { return FREEZEAMMO____header_global_9a0eadcac584209f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:213
export const AMMO____header_global_1d6df9a008f04009 = ((((((40) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0bbf203f44288c7050e0cde4() {
  return __cxx_static_address_0bbf203f44288c7050e0cde4.reference || (__cxx_static_address_0bbf203f44288c7050e0cde4.reference = {
    __cReference: true,
    get value() { return AMMO____header_global_1d6df9a008f04009; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:214
export const BATTERYAMMO____header_global_272a78c1f3f17d37 = ((((((41) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0d933074a906916f48ebb0b8() {
  return __cxx_static_address_0d933074a906916f48ebb0b8.reference || (__cxx_static_address_0d933074a906916f48ebb0b8.reference = {
    __cReference: true,
    get value() { return BATTERYAMMO____header_global_272a78c1f3f17d37; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:215
export const DEVISTATORAMMO____header_global_13b25b010e85f74e = ((((((42) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b0138a2d05a1d62d54d9698d() {
  return __cxx_static_address_b0138a2d05a1d62d54d9698d.reference || (__cxx_static_address_b0138a2d05a1d62d54d9698d.reference = {
    __cReference: true,
    get value() { return DEVISTATORAMMO____header_global_13b25b010e85f74e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:216
export const RPGAMMO____header_global_68c27e7ca4dc15b4 = ((((((44) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e0bace82ff91c2560df57cc() {
  return __cxx_static_address_1e0bace82ff91c2560df57cc.reference || (__cxx_static_address_1e0bace82ff91c2560df57cc.reference = {
    __cReference: true,
    get value() { return RPGAMMO____header_global_68c27e7ca4dc15b4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:217
export const GROWAMMO____header_global_6fe15cf77bdf580d = ((((((45) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cf10311ca018747921a7752b() {
  return __cxx_static_address_cf10311ca018747921a7752b.reference || (__cxx_static_address_cf10311ca018747921a7752b.reference = {
    __cReference: true,
    get value() { return GROWAMMO____header_global_6fe15cf77bdf580d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:218
export const CRYSTALAMMO____header_global_b3d9cd736ea4daaf = ((((((46) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_20130eb5f526fcb921531b8b() {
  return __cxx_static_address_20130eb5f526fcb921531b8b.reference || (__cxx_static_address_20130eb5f526fcb921531b8b.reference = {
    __cReference: true,
    get value() { return CRYSTALAMMO____header_global_b3d9cd736ea4daaf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:219
export const HBOMBAMMO____header_global_8839ad6d4d8644f5 = ((((((47) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0c8996938756dd8fbde7d943() {
  return __cxx_static_address_0c8996938756dd8fbde7d943.reference || (__cxx_static_address_0c8996938756dd8fbde7d943.reference = {
    __cReference: true,
    get value() { return HBOMBAMMO____header_global_8839ad6d4d8644f5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:220
export const AMMOLOTS____header_global_3d428d1de729395a = ((((((48) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dd22fd269c08246b668f2eb6() {
  return __cxx_static_address_dd22fd269c08246b668f2eb6.reference || (__cxx_static_address_dd22fd269c08246b668f2eb6.reference = {
    __cReference: true,
    get value() { return AMMOLOTS____header_global_3d428d1de729395a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:221
export const SHOTGUNAMMO____header_global_ea680e358a9840e6 = ((((((49) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_51ef55db115f30c5db8a4a37() {
  return __cxx_static_address_51ef55db115f30c5db8a4a37.reference || (__cxx_static_address_51ef55db115f30c5db8a4a37.reference = {
    __cReference: true,
    get value() { return SHOTGUNAMMO____header_global_ea680e358a9840e6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:222
export const COLA____header_global_7c412d61f71fcda7 = ((((((51) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f1207f307936527dc3d2aad5() {
  return __cxx_static_address_f1207f307936527dc3d2aad5.reference || (__cxx_static_address_f1207f307936527dc3d2aad5.reference = {
    __cReference: true,
    get value() { return COLA____header_global_7c412d61f71fcda7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:223
export const SIXPAK____header_global_3d0d258c59e3fc2e = ((((((52) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1eed527e86d0645a0dd6790e() {
  return __cxx_static_address_1eed527e86d0645a0dd6790e.reference || (__cxx_static_address_1eed527e86d0645a0dd6790e.reference = {
    __cReference: true,
    get value() { return SIXPAK____header_global_3d0d258c59e3fc2e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:224
export const FIRSTAID____header_global_a069c52ce10c6702 = ((((((53) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ddb8320a62fc0b99fcfa7bbd() {
  return __cxx_static_address_ddb8320a62fc0b99fcfa7bbd.reference || (__cxx_static_address_ddb8320a62fc0b99fcfa7bbd.reference = {
    __cReference: true,
    get value() { return FIRSTAID____header_global_a069c52ce10c6702; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:225
export const SHIELD____header_global_30f9eb412e1bb5dc = ((((((54) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a227ff504c2fe8e6d4732fc9() {
  return __cxx_static_address_a227ff504c2fe8e6d4732fc9.reference || (__cxx_static_address_a227ff504c2fe8e6d4732fc9.reference = {
    __cReference: true,
    get value() { return SHIELD____header_global_30f9eb412e1bb5dc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:226
export const STEROIDS____header_global_07473ad1e2ee699a = ((((((55) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0c966e3349a840d5ed12eb4e() {
  return __cxx_static_address_0c966e3349a840d5ed12eb4e.reference || (__cxx_static_address_0c966e3349a840d5ed12eb4e.reference = {
    __cReference: true,
    get value() { return STEROIDS____header_global_07473ad1e2ee699a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:227
export const AIRTANK____header_global_4f1e6b76ce0cbb7e = ((((((56) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_56d510d6d5b08fbcaa3c010f() {
  return __cxx_static_address_56d510d6d5b08fbcaa3c010f.reference || (__cxx_static_address_56d510d6d5b08fbcaa3c010f.reference = {
    __cReference: true,
    get value() { return AIRTANK____header_global_4f1e6b76ce0cbb7e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:228
export const JETPACK____header_global_7c3ccef65e2c144e = ((((((57) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f1665e578533f9eb04cef21c() {
  return __cxx_static_address_f1665e578533f9eb04cef21c.reference || (__cxx_static_address_f1665e578533f9eb04cef21c.reference = {
    __cReference: true,
    get value() { return JETPACK____header_global_7c3ccef65e2c144e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:229
export const HEATSENSOR____header_global_85e535cae5b04070 = ((((((59) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_85e2eadf3585856df0f393a1() {
  return __cxx_static_address_85e2eadf3585856df0f393a1.reference || (__cxx_static_address_85e2eadf3585856df0f393a1.reference = {
    __cReference: true,
    get value() { return HEATSENSOR____header_global_85e535cae5b04070; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:230
export const ACCESSCARD____header_global_17df8de21629846a = ((((((60) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_94a80fadc128fe9bf2c99da0() {
  return __cxx_static_address_94a80fadc128fe9bf2c99da0.reference || (__cxx_static_address_94a80fadc128fe9bf2c99da0.reference = {
    __cReference: true,
    get value() { return ACCESSCARD____header_global_17df8de21629846a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:231
export const BOOTS____header_global_35f0f253f0f449f7 = ((((((61) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fb6560ec68dff82216a021d8() {
  return __cxx_static_address_fb6560ec68dff82216a021d8.reference || (__cxx_static_address_fb6560ec68dff82216a021d8.reference = {
    __cReference: true,
    get value() { return BOOTS____header_global_35f0f253f0f449f7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:232
export const MIRRORBROKE____header_global_dc371042450eb921 = ((((((70) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c62bdbe7fb2dd1aa3207538b() {
  return __cxx_static_address_c62bdbe7fb2dd1aa3207538b.reference || (__cxx_static_address_c62bdbe7fb2dd1aa3207538b.reference = {
    __cReference: true,
    get value() { return MIRRORBROKE____header_global_dc371042450eb921; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:233
export const CLOUDYOCEAN____header_global_018dfcc67965be9c = ((((((78) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_add8d0947b957f93b0927211() {
  return __cxx_static_address_add8d0947b957f93b0927211.reference || (__cxx_static_address_add8d0947b957f93b0927211.reference = {
    __cReference: true,
    get value() { return CLOUDYOCEAN____header_global_018dfcc67965be9c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:234
export const CLOUDYSKIES____header_global_c4b46722184c136c = ((((((79) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7a95042ac0dc646233990582() {
  return __cxx_static_address_7a95042ac0dc646233990582.reference || (__cxx_static_address_7a95042ac0dc646233990582.reference = {
    __cReference: true,
    get value() { return CLOUDYSKIES____header_global_c4b46722184c136c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:235
export const MOONSKY1____header_global_99baafb8aa9cc120 = ((((((80) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7eae4b748c977eac941714d3() {
  return __cxx_static_address_7eae4b748c977eac941714d3.reference || (__cxx_static_address_7eae4b748c977eac941714d3.reference = {
    __cReference: true,
    get value() { return MOONSKY1____header_global_99baafb8aa9cc120; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:236
export const BIGORBIT1____header_global_26cf8c1f34de59b1 = ((((((84) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a0fc0051ea5a804d06219a4b() {
  return __cxx_static_address_a0fc0051ea5a804d06219a4b.reference || (__cxx_static_address_a0fc0051ea5a804d06219a4b.reference = {
    __cReference: true,
    get value() { return BIGORBIT1____header_global_26cf8c1f34de59b1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:237
export const LA____header_global_edec651ee4b8a834 = ((((((89) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8f4bbf84a3407f1696c8ff59() {
  return __cxx_static_address_8f4bbf84a3407f1696c8ff59.reference || (__cxx_static_address_8f4bbf84a3407f1696c8ff59.reference = {
    __cReference: true,
    get value() { return LA____header_global_edec651ee4b8a834; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:238
export const ATOMICHEALTH____header_global_f324836b374455fe = ((((((100) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2d8874fb7f8b425eadf319e2() {
  return __cxx_static_address_2d8874fb7f8b425eadf319e2.reference || (__cxx_static_address_2d8874fb7f8b425eadf319e2.reference = {
    __cReference: true,
    get value() { return ATOMICHEALTH____header_global_f324836b374455fe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:239
export const TECHLIGHT2____header_global_732cc2d86ff5e73c = ((((((120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_384927aa9ceafdc47941faa4() {
  return __cxx_static_address_384927aa9ceafdc47941faa4.reference || (__cxx_static_address_384927aa9ceafdc47941faa4.reference = {
    __cReference: true,
    get value() { return TECHLIGHT2____header_global_732cc2d86ff5e73c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:240
export const TECHLIGHTBUST2____header_global_51a2d7cd1e81432d = ((((((121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1791c3996a4706ba60cdadc3() {
  return __cxx_static_address_1791c3996a4706ba60cdadc3.reference || (__cxx_static_address_1791c3996a4706ba60cdadc3.reference = {
    __cReference: true,
    get value() { return TECHLIGHTBUST2____header_global_51a2d7cd1e81432d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:241
export const TECHLIGHT4____header_global_7bf2a3bde383facf = ((((((122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_78391942f4be30806e6438a5() {
  return __cxx_static_address_78391942f4be30806e6438a5.reference || (__cxx_static_address_78391942f4be30806e6438a5.reference = {
    __cReference: true,
    get value() { return TECHLIGHT4____header_global_7bf2a3bde383facf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:242
export const TECHLIGHTBUST4____header_global_17fea4fff1e4347f = ((((((123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5111b0c843cc04a31b4c74ea() {
  return __cxx_static_address_5111b0c843cc04a31b4c74ea.reference || (__cxx_static_address_5111b0c843cc04a31b4c74ea.reference = {
    __cReference: true,
    get value() { return TECHLIGHTBUST4____header_global_17fea4fff1e4347f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:243
export const WALLLIGHT4____header_global_24bc8679a7807d81 = ((((((124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2df4a0dbcd82b165b5d08b70() {
  return __cxx_static_address_2df4a0dbcd82b165b5d08b70.reference || (__cxx_static_address_2df4a0dbcd82b165b5d08b70.reference = {
    __cReference: true,
    get value() { return WALLLIGHT4____header_global_24bc8679a7807d81; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:244
export const WALLLIGHTBUST4____header_global_445581a2426955ee = ((((((125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ee5425eee8c486a11f49157a() {
  return __cxx_static_address_ee5425eee8c486a11f49157a.reference || (__cxx_static_address_ee5425eee8c486a11f49157a.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST4____header_global_445581a2426955ee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:245
export const ACCESSSWITCH____header_global_8f7575fcd5847791 = ((((((130) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6f81b24aa14e53f5289b217a() {
  return __cxx_static_address_6f81b24aa14e53f5289b217a.reference || (__cxx_static_address_6f81b24aa14e53f5289b217a.reference = {
    __cReference: true,
    get value() { return ACCESSSWITCH____header_global_8f7575fcd5847791; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:246
export const SLOTDOOR____header_global_121240410e5193e1 = ((((((132) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7e8b90bbe89da02b887fddab() {
  return __cxx_static_address_7e8b90bbe89da02b887fddab.reference || (__cxx_static_address_7e8b90bbe89da02b887fddab.reference = {
    __cReference: true,
    get value() { return SLOTDOOR____header_global_121240410e5193e1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:247
export const LIGHTSWITCH____header_global_0795b444f2fb29f6 = ((((((134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7d6e5e6bd10a312eebe97e27() {
  return __cxx_static_address_7d6e5e6bd10a312eebe97e27.reference || (__cxx_static_address_7d6e5e6bd10a312eebe97e27.reference = {
    __cReference: true,
    get value() { return LIGHTSWITCH____header_global_0795b444f2fb29f6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:248
export const SPACEDOORSWITCH____header_global_c6617f70975cc57f = ((((((136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b439c00d5ff94dcc906f7b9d() {
  return __cxx_static_address_b439c00d5ff94dcc906f7b9d.reference || (__cxx_static_address_b439c00d5ff94dcc906f7b9d.reference = {
    __cReference: true,
    get value() { return SPACEDOORSWITCH____header_global_c6617f70975cc57f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:249
export const SPACELIGHTSWITCH____header_global_1641fa2688aa9c02 = ((((((138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_017d86765ece8db793ee1455() {
  return __cxx_static_address_017d86765ece8db793ee1455.reference || (__cxx_static_address_017d86765ece8db793ee1455.reference = {
    __cReference: true,
    get value() { return SPACELIGHTSWITCH____header_global_1641fa2688aa9c02; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:250
export const FRANKENSTINESWITCH____header_global_6a5c9629a2e1813a = ((((((140) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_94ad003300c452428ef51d68() {
  return __cxx_static_address_94ad003300c452428ef51d68.reference || (__cxx_static_address_94ad003300c452428ef51d68.reference = {
    __cReference: true,
    get value() { return FRANKENSTINESWITCH____header_global_6a5c9629a2e1813a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:251
export const NUKEBUTTON____header_global_d077efbc4e1bb8c6 = ((((((142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_45dbf0c242ab255b5bcff88a() {
  return __cxx_static_address_45dbf0c242ab255b5bcff88a.reference || (__cxx_static_address_45dbf0c242ab255b5bcff88a.reference = {
    __cReference: true,
    get value() { return NUKEBUTTON____header_global_d077efbc4e1bb8c6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:252
export const MULTISWITCH____header_global_9df5df4691149b22 = ((((((146) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2dda4d323a4e22126f3c619b() {
  return __cxx_static_address_2dda4d323a4e22126f3c619b.reference || (__cxx_static_address_2dda4d323a4e22126f3c619b.reference = {
    __cReference: true,
    get value() { return MULTISWITCH____header_global_9df5df4691149b22; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:253
export const DOORTILE5____header_global_1a79367802771ae1 = ((((((150) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_38bb6c8bae4820c33f9b1939() {
  return __cxx_static_address_38bb6c8bae4820c33f9b1939.reference || (__cxx_static_address_38bb6c8bae4820c33f9b1939.reference = {
    __cReference: true,
    get value() { return DOORTILE5____header_global_1a79367802771ae1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:254
export const DOORTILE6____header_global_c35f4dac318969c7 = ((((((151) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_daf0499ae47318a4bab2c57c() {
  return __cxx_static_address_daf0499ae47318a4bab2c57c.reference || (__cxx_static_address_daf0499ae47318a4bab2c57c.reference = {
    __cReference: true,
    get value() { return DOORTILE6____header_global_c35f4dac318969c7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:255
export const DOORTILE1____header_global_7c0c15a87ceff822 = ((((((152) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_95ea2d5168c64625b1fc4105() {
  return __cxx_static_address_95ea2d5168c64625b1fc4105.reference || (__cxx_static_address_95ea2d5168c64625b1fc4105.reference = {
    __cReference: true,
    get value() { return DOORTILE1____header_global_7c0c15a87ceff822; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:256
export const DOORTILE2____header_global_7ab4e6d259b65179 = ((((((153) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_18235081e6626eaa6c6f9277() {
  return __cxx_static_address_18235081e6626eaa6c6f9277.reference || (__cxx_static_address_18235081e6626eaa6c6f9277.reference = {
    __cReference: true,
    get value() { return DOORTILE2____header_global_7ab4e6d259b65179; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:257
export const DOORTILE3____header_global_9cc1108ba314391a = ((((((154) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_94214561bb8b7a5f950c9746() {
  return __cxx_static_address_94214561bb8b7a5f950c9746.reference || (__cxx_static_address_94214561bb8b7a5f950c9746.reference = {
    __cReference: true,
    get value() { return DOORTILE3____header_global_9cc1108ba314391a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:258
export const DOORTILE4____header_global_4d2a76a7ecde5570 = ((((((155) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6422c31321c48452f69af2ee() {
  return __cxx_static_address_6422c31321c48452f69af2ee.reference || (__cxx_static_address_6422c31321c48452f69af2ee.reference = {
    __cReference: true,
    get value() { return DOORTILE4____header_global_4d2a76a7ecde5570; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:259
export const DOORTILE7____header_global_43194be6bba555d7 = ((((((156) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7ce7d0671ef6ee77096ba7e9() {
  return __cxx_static_address_7ce7d0671ef6ee77096ba7e9.reference || (__cxx_static_address_7ce7d0671ef6ee77096ba7e9.reference = {
    __cReference: true,
    get value() { return DOORTILE7____header_global_43194be6bba555d7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:260
export const DOORTILE8____header_global_3c925209622f3284 = ((((((157) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5ff5f549870b1906562d0a53() {
  return __cxx_static_address_5ff5f549870b1906562d0a53.reference || (__cxx_static_address_5ff5f549870b1906562d0a53.reference = {
    __cReference: true,
    get value() { return DOORTILE8____header_global_3c925209622f3284; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:261
export const DOORTILE9____header_global_3d3d2776adcce856 = ((((((158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_892154b2f0c484c4ff8e4369() {
  return __cxx_static_address_892154b2f0c484c4ff8e4369.reference || (__cxx_static_address_892154b2f0c484c4ff8e4369.reference = {
    __cReference: true,
    get value() { return DOORTILE9____header_global_3d3d2776adcce856; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:262
export const DOORTILE10____header_global_2cb5f71a4ce2c2b0 = ((((((159) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_128d8c750989acd49ae9a9c3() {
  return __cxx_static_address_128d8c750989acd49ae9a9c3.reference || (__cxx_static_address_128d8c750989acd49ae9a9c3.reference = {
    __cReference: true,
    get value() { return DOORTILE10____header_global_2cb5f71a4ce2c2b0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:263
export const DOORSHOCK____header_global_156a7fb070dfb4a2 = ((((((160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_86bac5b83f90bec3e89f7fec() {
  return __cxx_static_address_86bac5b83f90bec3e89f7fec.reference || (__cxx_static_address_86bac5b83f90bec3e89f7fec.reference = {
    __cReference: true,
    get value() { return DOORSHOCK____header_global_156a7fb070dfb4a2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:264
export const DIPSWITCH____header_global_ef510dc4f21c2c2a = ((((((162) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a2f0611a08e8b5975cab2ade() {
  return __cxx_static_address_a2f0611a08e8b5975cab2ade.reference || (__cxx_static_address_a2f0611a08e8b5975cab2ade.reference = {
    __cReference: true,
    get value() { return DIPSWITCH____header_global_ef510dc4f21c2c2a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:265
export const DIPSWITCH2____header_global_ed1cdd5e6a0d5e93 = ((((((164) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b962d7cbc2346c201de30413() {
  return __cxx_static_address_b962d7cbc2346c201de30413.reference || (__cxx_static_address_b962d7cbc2346c201de30413.reference = {
    __cReference: true,
    get value() { return DIPSWITCH2____header_global_ed1cdd5e6a0d5e93; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:266
export const TECHSWITCH____header_global_f8cebed878c4dec9 = ((((((166) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0301feae95f8ef6594202044() {
  return __cxx_static_address_0301feae95f8ef6594202044.reference || (__cxx_static_address_0301feae95f8ef6594202044.reference = {
    __cReference: true,
    get value() { return TECHSWITCH____header_global_f8cebed878c4dec9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:267
export const DIPSWITCH3____header_global_a9398a6af15c036c = ((((((168) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3010d710990ef3e3e6a63365() {
  return __cxx_static_address_3010d710990ef3e3e6a63365.reference || (__cxx_static_address_3010d710990ef3e3e6a63365.reference = {
    __cReference: true,
    get value() { return DIPSWITCH3____header_global_a9398a6af15c036c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:268
export const ACCESSSWITCH2____header_global_fc59d01ece7661a4 = ((((((170) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3f7879b869b5854d778a1fea() {
  return __cxx_static_address_3f7879b869b5854d778a1fea.reference || (__cxx_static_address_3f7879b869b5854d778a1fea.reference = {
    __cReference: true,
    get value() { return ACCESSSWITCH2____header_global_fc59d01ece7661a4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:269
export const FLOORSLIME____header_global_c582ede7a5cacf2a = ((((((200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_008f353ac205de84393b52cc() {
  return __cxx_static_address_008f353ac205de84393b52cc.reference || (__cxx_static_address_008f353ac205de84393b52cc.reference = {
    __cReference: true,
    get value() { return FLOORSLIME____header_global_c582ede7a5cacf2a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:270
export const BIGFORCE____header_global_e837c93853278bcc = ((((((230) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2950d3956b06bface66afe4e() {
  return __cxx_static_address_2950d3956b06bface66afe4e.reference || (__cxx_static_address_2950d3956b06bface66afe4e.reference = {
    __cReference: true,
    get value() { return BIGFORCE____header_global_e837c93853278bcc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:271
export const MASKWALL9____header_global_ad839c8532a119f5 = ((((((255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7ef509da37cb6ce26c20a649() {
  return __cxx_static_address_7ef509da37cb6ce26c20a649.reference || (__cxx_static_address_7ef509da37cb6ce26c20a649.reference = {
    __cReference: true,
    get value() { return MASKWALL9____header_global_ad839c8532a119f5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:272
export const SCREENBREAK1____header_global_ad1239d7ddd76fe0 = ((((((263) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e9236d36cc70b60fb155c5d7() {
  return __cxx_static_address_e9236d36cc70b60fb155c5d7.reference || (__cxx_static_address_e9236d36cc70b60fb155c5d7.reference = {
    __cReference: true,
    get value() { return SCREENBREAK1____header_global_ad1239d7ddd76fe0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:273
export const SCREENBREAK2____header_global_22c608d76ff30653 = ((((((264) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0b8ffb3eb6ce6ddacf7e65e3() {
  return __cxx_static_address_0b8ffb3eb6ce6ddacf7e65e3.reference || (__cxx_static_address_0b8ffb3eb6ce6ddacf7e65e3.reference = {
    __cReference: true,
    get value() { return SCREENBREAK2____header_global_22c608d76ff30653; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:274
export const SCREENBREAK3____header_global_7798aa7b69afb49e = ((((((265) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4d915418bc1543a000101c76() {
  return __cxx_static_address_4d915418bc1543a000101c76.reference || (__cxx_static_address_4d915418bc1543a000101c76.reference = {
    __cReference: true,
    get value() { return SCREENBREAK3____header_global_7798aa7b69afb49e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:275
export const SCREENBREAK4____header_global_3d153f251bb3c23d = ((((((266) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1327f3b31ca54efe6b6be7f9() {
  return __cxx_static_address_1327f3b31ca54efe6b6be7f9.reference || (__cxx_static_address_1327f3b31ca54efe6b6be7f9.reference = {
    __cReference: true,
    get value() { return SCREENBREAK4____header_global_3d153f251bb3c23d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:276
export const SCREENBREAK5____header_global_f1f36009fe1be5de = ((((((267) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_05b8aace8cb60817436d92c5() {
  return __cxx_static_address_05b8aace8cb60817436d92c5.reference || (__cxx_static_address_05b8aace8cb60817436d92c5.reference = {
    __cReference: true,
    get value() { return SCREENBREAK5____header_global_f1f36009fe1be5de; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:277
export const SCREENBREAK6____header_global_27f2a268fd649085 = ((((((268) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ade686ed516a8c26e38aa84f() {
  return __cxx_static_address_ade686ed516a8c26e38aa84f.reference || (__cxx_static_address_ade686ed516a8c26e38aa84f.reference = {
    __cReference: true,
    get value() { return SCREENBREAK6____header_global_27f2a268fd649085; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:278
export const SCREENBREAK7____header_global_52c5d11f8c9dd8da = ((((((269) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_773402380c61f565d2caafe4() {
  return __cxx_static_address_773402380c61f565d2caafe4.reference || (__cxx_static_address_773402380c61f565d2caafe4.reference = {
    __cReference: true,
    get value() { return SCREENBREAK7____header_global_52c5d11f8c9dd8da; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:279
export const SCREENBREAK8____header_global_404d74cc6b966138 = ((((((270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cfde1fc347f7c1714994db7b() {
  return __cxx_static_address_cfde1fc347f7c1714994db7b.reference || (__cxx_static_address_cfde1fc347f7c1714994db7b.reference = {
    __cReference: true,
    get value() { return SCREENBREAK8____header_global_404d74cc6b966138; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:280
export const SCREENBREAK9____header_global_36afc2f78d9b97eb = ((((((271) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f8797f5b254a7b92b1a47114() {
  return __cxx_static_address_f8797f5b254a7b92b1a47114.reference || (__cxx_static_address_f8797f5b254a7b92b1a47114.reference = {
    __cReference: true,
    get value() { return SCREENBREAK9____header_global_36afc2f78d9b97eb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:281
export const SCREENBREAK10____header_global_829951b31c765a98 = ((((((272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b5038041090d93232f2f51da() {
  return __cxx_static_address_b5038041090d93232f2f51da.reference || (__cxx_static_address_b5038041090d93232f2f51da.reference = {
    __cReference: true,
    get value() { return SCREENBREAK10____header_global_829951b31c765a98; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:282
export const SCREENBREAK11____header_global_abc607fbfa893718 = ((((((273) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ddf1f83db00037f4c813bd71() {
  return __cxx_static_address_ddf1f83db00037f4c813bd71.reference || (__cxx_static_address_ddf1f83db00037f4c813bd71.reference = {
    __cReference: true,
    get value() { return SCREENBREAK11____header_global_abc607fbfa893718; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:283
export const SCREENBREAK12____header_global_33225902bec06af8 = ((((((274) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_168162ad323ed207ac6e6fd9() {
  return __cxx_static_address_168162ad323ed207ac6e6fd9.reference || (__cxx_static_address_168162ad323ed207ac6e6fd9.reference = {
    __cReference: true,
    get value() { return SCREENBREAK12____header_global_33225902bec06af8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:284
export const SCREENBREAK13____header_global_a858dfb021807779 = ((((((275) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_236f763f297538297b47e9cd() {
  return __cxx_static_address_236f763f297538297b47e9cd.reference || (__cxx_static_address_236f763f297538297b47e9cd.reference = {
    __cReference: true,
    get value() { return SCREENBREAK13____header_global_a858dfb021807779; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:285
export const MASKWALL1____header_global_e12de3a95c3196d3 = ((((((285) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_73d08b61436f67e20178f8e5() {
  return __cxx_static_address_73d08b61436f67e20178f8e5.reference || (__cxx_static_address_73d08b61436f67e20178f8e5.reference = {
    __cReference: true,
    get value() { return MASKWALL1____header_global_e12de3a95c3196d3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:286
export const W_TECHWALL1____header_global_52d220675cdc1b52 = ((((((293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a9b1fbbcf649a02ba5f35b1f() {
  return __cxx_static_address_a9b1fbbcf649a02ba5f35b1f.reference || (__cxx_static_address_a9b1fbbcf649a02ba5f35b1f.reference = {
    __cReference: true,
    get value() { return W_TECHWALL1____header_global_52d220675cdc1b52; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:287
export const W_TECHWALL2____header_global_beb43a0e97e1e114 = ((((((297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_543f750178f80efa3f30dbcd() {
  return __cxx_static_address_543f750178f80efa3f30dbcd.reference || (__cxx_static_address_543f750178f80efa3f30dbcd.reference = {
    __cReference: true,
    get value() { return W_TECHWALL2____header_global_beb43a0e97e1e114; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:288
export const W_TECHWALL15____header_global_f9986a985b1b1c5d = ((((((299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fe6ed958c5c71f40c8a1aedb() {
  return __cxx_static_address_fe6ed958c5c71f40c8a1aedb.reference || (__cxx_static_address_fe6ed958c5c71f40c8a1aedb.reference = {
    __cReference: true,
    get value() { return W_TECHWALL15____header_global_f9986a985b1b1c5d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:289
export const W_TECHWALL3____header_global_3e7136ee5a0ef5d8 = ((((((301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cdd22ed8c992f323f1cf92d5() {
  return __cxx_static_address_cdd22ed8c992f323f1cf92d5.reference || (__cxx_static_address_cdd22ed8c992f323f1cf92d5.reference = {
    __cReference: true,
    get value() { return W_TECHWALL3____header_global_3e7136ee5a0ef5d8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:290
export const W_TECHWALL4____header_global_72992c38fca72d0c = ((((((305) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7f0055b75956555c8b6149b6() {
  return __cxx_static_address_7f0055b75956555c8b6149b6.reference || (__cxx_static_address_7f0055b75956555c8b6149b6.reference = {
    __cReference: true,
    get value() { return W_TECHWALL4____header_global_72992c38fca72d0c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:291
export const W_TECHWALL10____header_global_272c84e0b860f97a = ((((((306) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ca3bffe1381c09d70772c87b() {
  return __cxx_static_address_ca3bffe1381c09d70772c87b.reference || (__cxx_static_address_ca3bffe1381c09d70772c87b.reference = {
    __cReference: true,
    get value() { return W_TECHWALL10____header_global_272c84e0b860f97a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:292
export const W_TECHWALL16____header_global_0d877840ab780418 = ((((((307) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cc65f5e9d5e21db0389fe137() {
  return __cxx_static_address_cc65f5e9d5e21db0389fe137.reference || (__cxx_static_address_cc65f5e9d5e21db0389fe137.reference = {
    __cReference: true,
    get value() { return W_TECHWALL16____header_global_0d877840ab780418; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:293
export const WATERTILE2____header_global_88398d66b3e9971c = ((((((336) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fea75a0f6947743b9de078b7() {
  return __cxx_static_address_fea75a0f6947743b9de078b7.reference || (__cxx_static_address_fea75a0f6947743b9de078b7.reference = {
    __cReference: true,
    get value() { return WATERTILE2____header_global_88398d66b3e9971c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:294
export const BPANNEL1____header_global_70ec5c9e9efaa482 = ((((((341) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b8e4fb53f745f45926637bf8() {
  return __cxx_static_address_b8e4fb53f745f45926637bf8.reference || (__cxx_static_address_b8e4fb53f745f45926637bf8.reference = {
    __cReference: true,
    get value() { return BPANNEL1____header_global_70ec5c9e9efaa482; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:295
export const PANNEL1____header_global_d83b8e39b9e7c757 = ((((((342) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8d323f0220f1c482dd68bd47() {
  return __cxx_static_address_8d323f0220f1c482dd68bd47.reference || (__cxx_static_address_8d323f0220f1c482dd68bd47.reference = {
    __cReference: true,
    get value() { return PANNEL1____header_global_d83b8e39b9e7c757; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:296
export const PANNEL2____header_global_2172fa2680aae013 = ((((((343) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3aae8a329f40d652d487661b() {
  return __cxx_static_address_3aae8a329f40d652d487661b.reference || (__cxx_static_address_3aae8a329f40d652d487661b.reference = {
    __cReference: true,
    get value() { return PANNEL2____header_global_2172fa2680aae013; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:297
export const STATIC____header_global_f8313a10f53b910e = ((((((351) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_008505b5d3bf6202de4649e7() {
  return __cxx_static_address_008505b5d3bf6202de4649e7.reference || (__cxx_static_address_008505b5d3bf6202de4649e7.reference = {
    __cReference: true,
    get value() { return STATIC____header_global_f8313a10f53b910e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:298
export const W_SCREENBREAK____header_global_2b09ed89c0c24cb5 = ((((((357) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6dd406e8185f2668b332028d() {
  return __cxx_static_address_6dd406e8185f2668b332028d.reference || (__cxx_static_address_6dd406e8185f2668b332028d.reference = {
    __cReference: true,
    get value() { return W_SCREENBREAK____header_global_2b09ed89c0c24cb5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:299
export const W_HITTECHWALL3____header_global_3e73354174739b45 = ((((((360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7e9082a80a11a14662fdebd8() {
  return __cxx_static_address_7e9082a80a11a14662fdebd8.reference || (__cxx_static_address_7e9082a80a11a14662fdebd8.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL3____header_global_3e73354174739b45; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:300
export const W_HITTECHWALL4____header_global_d5d210f464929547 = ((((((361) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e98693fd6bf8452a16ad0197() {
  return __cxx_static_address_e98693fd6bf8452a16ad0197.reference || (__cxx_static_address_e98693fd6bf8452a16ad0197.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL4____header_global_d5d210f464929547; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:301
export const W_HITTECHWALL2____header_global_d3a553be7fb2e90d = ((((((362) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_79e01cd1ec8a527453a6567a() {
  return __cxx_static_address_79e01cd1ec8a527453a6567a.reference || (__cxx_static_address_79e01cd1ec8a527453a6567a.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL2____header_global_d3a553be7fb2e90d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:302
export const W_HITTECHWALL1____header_global_3116a279cb92b74e = ((((((363) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3e79435711d73ab50b72a4d6() {
  return __cxx_static_address_3e79435711d73ab50b72a4d6.reference || (__cxx_static_address_3e79435711d73ab50b72a4d6.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL1____header_global_3116a279cb92b74e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:303
export const MASKWALL10____header_global_cf670f421bb76fc0 = ((((((387) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_994f074793c94e097711131c() {
  return __cxx_static_address_994f074793c94e097711131c.reference || (__cxx_static_address_994f074793c94e097711131c.reference = {
    __cReference: true,
    get value() { return MASKWALL10____header_global_cf670f421bb76fc0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:304
export const MASKWALL11____header_global_bc760f3ec71c95ef = ((((((391) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_48b37e7585408562c4455ab5() {
  return __cxx_static_address_48b37e7585408562c4455ab5.reference || (__cxx_static_address_48b37e7585408562c4455ab5.reference = {
    __cReference: true,
    get value() { return MASKWALL11____header_global_bc760f3ec71c95ef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:305
export const DOORTILE22____header_global_822a8406c919a4b5 = ((((((395) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f818f987ca09d86f2795a90b() {
  return __cxx_static_address_f818f987ca09d86f2795a90b.reference || (__cxx_static_address_f818f987ca09d86f2795a90b.reference = {
    __cReference: true,
    get value() { return DOORTILE22____header_global_822a8406c919a4b5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:306
export const FANSPRITE____header_global_b4abc682a60609a6 = ((((((407) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_537f70f2de492ab7005b3369() {
  return __cxx_static_address_537f70f2de492ab7005b3369.reference || (__cxx_static_address_537f70f2de492ab7005b3369.reference = {
    __cReference: true,
    get value() { return FANSPRITE____header_global_b4abc682a60609a6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:307
export const FANSPRITEBROKE____header_global_d7fc9612b9bb30cf = ((((((411) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e702829b5c10601732a24e4e() {
  return __cxx_static_address_e702829b5c10601732a24e4e.reference || (__cxx_static_address_e702829b5c10601732a24e4e.reference = {
    __cReference: true,
    get value() { return FANSPRITEBROKE____header_global_d7fc9612b9bb30cf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:308
export const FANSHADOW____header_global_90b6623d248c15e6 = ((((((412) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9e0d49124f478a52e1d75c46() {
  return __cxx_static_address_9e0d49124f478a52e1d75c46.reference || (__cxx_static_address_9e0d49124f478a52e1d75c46.reference = {
    __cReference: true,
    get value() { return FANSHADOW____header_global_90b6623d248c15e6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:309
export const FANSHADOWBROKE____header_global_b81690a5186e423a = ((((((416) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0015312e890d46b846636e40() {
  return __cxx_static_address_0015312e890d46b846636e40.reference || (__cxx_static_address_0015312e890d46b846636e40.reference = {
    __cReference: true,
    get value() { return FANSHADOWBROKE____header_global_b81690a5186e423a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:310
export const DOORTILE18____header_global_a5e8079ae008757d = ((((((447) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_14a7c3e617192b7a89728908() {
  return __cxx_static_address_14a7c3e617192b7a89728908.reference || (__cxx_static_address_14a7c3e617192b7a89728908.reference = {
    __cReference: true,
    get value() { return DOORTILE18____header_global_a5e8079ae008757d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:311
export const DOORTILE19____header_global_d56e2e8ed06041c1 = ((((((448) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_044d9864c83e8653853736a6() {
  return __cxx_static_address_044d9864c83e8653853736a6.reference || (__cxx_static_address_044d9864c83e8653853736a6.reference = {
    __cReference: true,
    get value() { return DOORTILE19____header_global_d56e2e8ed06041c1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:312
export const DOORTILE20____header_global_e31707529685737a = ((((((449) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b223e574cf44f50f686310f2() {
  return __cxx_static_address_b223e574cf44f50f686310f2.reference || (__cxx_static_address_b223e574cf44f50f686310f2.reference = {
    __cReference: true,
    get value() { return DOORTILE20____header_global_e31707529685737a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:313
export const VIEWSCREEN2____header_global_60e83c84ef1a3fbb = ((((((499) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d0f017d610b8961f10b91ec7() {
  return __cxx_static_address_d0f017d610b8961f10b91ec7.reference || (__cxx_static_address_d0f017d610b8961f10b91ec7.reference = {
    __cReference: true,
    get value() { return VIEWSCREEN2____header_global_60e83c84ef1a3fbb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:314
export const VIEWSCREEN____header_global_88b8bba870d6e239 = ((((((502) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9a165de85117d1446ab70b4d() {
  return __cxx_static_address_9a165de85117d1446ab70b4d.reference || (__cxx_static_address_9a165de85117d1446ab70b4d.reference = {
    __cReference: true,
    get value() { return VIEWSCREEN____header_global_88b8bba870d6e239; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:315
export const GLASS____header_global_20f5a9fe263d26c5 = ((((((503) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9691cb84497c5061aa47ea5f() {
  return __cxx_static_address_9691cb84497c5061aa47ea5f.reference || (__cxx_static_address_9691cb84497c5061aa47ea5f.reference = {
    __cReference: true,
    get value() { return GLASS____header_global_20f5a9fe263d26c5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:316
export const GLASS2____header_global_8243964b6dd96bfc = ((((((504) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_43cc251b42da750bbf63375b() {
  return __cxx_static_address_43cc251b42da750bbf63375b.reference || (__cxx_static_address_43cc251b42da750bbf63375b.reference = {
    __cReference: true,
    get value() { return GLASS2____header_global_8243964b6dd96bfc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:317
export const STAINGLASS1____header_global_f470840528f35ad0 = ((((((510) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_002444a59a6bea8421abadfa() {
  return __cxx_static_address_002444a59a6bea8421abadfa.reference || (__cxx_static_address_002444a59a6bea8421abadfa.reference = {
    __cReference: true,
    get value() { return STAINGLASS1____header_global_f470840528f35ad0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:318
export const MASKWALL5____header_global_24a94b22e7fa2f93 = ((((((514) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_283d267c0a2f28e65a85b2e0() {
  return __cxx_static_address_283d267c0a2f28e65a85b2e0.reference || (__cxx_static_address_283d267c0a2f28e65a85b2e0.reference = {
    __cReference: true,
    get value() { return MASKWALL5____header_global_24a94b22e7fa2f93; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:319
export const SATELITE____header_global_c912807be4a089a9 = ((((((516) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0312847eba464d653dfe5794() {
  return __cxx_static_address_0312847eba464d653dfe5794.reference || (__cxx_static_address_0312847eba464d653dfe5794.reference = {
    __cReference: true,
    get value() { return SATELITE____header_global_c912807be4a089a9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:320
export const FUELPOD____header_global_cd2bf26f5563b236 = ((((((517) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3b4fc51915251679d867049d() {
  return __cxx_static_address_3b4fc51915251679d867049d.reference || (__cxx_static_address_3b4fc51915251679d867049d.reference = {
    __cReference: true,
    get value() { return FUELPOD____header_global_cd2bf26f5563b236; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:321
export const CRACK1____header_global_13fda7b1dcc25ad8 = ((((((546) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8d266f2fc98e39d8628c3380() {
  return __cxx_static_address_8d266f2fc98e39d8628c3380.reference || (__cxx_static_address_8d266f2fc98e39d8628c3380.reference = {
    __cReference: true,
    get value() { return CRACK1____header_global_13fda7b1dcc25ad8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:322
export const CRACK2____header_global_f43b7b1b58ee531a = ((((((547) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bb9a47da5c5c126313368878() {
  return __cxx_static_address_bb9a47da5c5c126313368878.reference || (__cxx_static_address_bb9a47da5c5c126313368878.reference = {
    __cReference: true,
    get value() { return CRACK2____header_global_f43b7b1b58ee531a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:323
export const CRACK3____header_global_f295fe9bc4c328d0 = ((((((548) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2c0b17c1547ac5b4d8bdd857() {
  return __cxx_static_address_2c0b17c1547ac5b4d8bdd857.reference || (__cxx_static_address_2c0b17c1547ac5b4d8bdd857.reference = {
    __cReference: true,
    get value() { return CRACK3____header_global_f295fe9bc4c328d0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:324
export const CRACK4____header_global_0343c89e16551497 = ((((((549) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8f85c39a40e45f0d1b16f963() {
  return __cxx_static_address_8f85c39a40e45f0d1b16f963.reference || (__cxx_static_address_8f85c39a40e45f0d1b16f963.reference = {
    __cReference: true,
    get value() { return CRACK4____header_global_0343c89e16551497; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:325
export const FOOTPRINTS____header_global_eab57cfcef7915cc = ((((((550) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1791db29a66ae9cf8fb972f8() {
  return __cxx_static_address_1791db29a66ae9cf8fb972f8.reference || (__cxx_static_address_1791db29a66ae9cf8fb972f8.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS____header_global_eab57cfcef7915cc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:326
export const DOMELITE____header_global_d51ac037f78617c2 = ((((((551) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b91c8edf468e29c696daf3e6() {
  return __cxx_static_address_b91c8edf468e29c696daf3e6.reference || (__cxx_static_address_b91c8edf468e29c696daf3e6.reference = {
    __cReference: true,
    get value() { return DOMELITE____header_global_d51ac037f78617c2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:327
export const CAMERAPOLE____header_global_f18b4a9f8a0b08c7 = ((((((554) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b396d8e2fe18b1f1144c9a41() {
  return __cxx_static_address_b396d8e2fe18b1f1144c9a41.reference || (__cxx_static_address_b396d8e2fe18b1f1144c9a41.reference = {
    __cReference: true,
    get value() { return CAMERAPOLE____header_global_f18b4a9f8a0b08c7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:328
export const CHAIR1____header_global_9f6bb5afeeca435e = ((((((556) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8e8c860cbfb8485437bad6a1() {
  return __cxx_static_address_8e8c860cbfb8485437bad6a1.reference || (__cxx_static_address_8e8c860cbfb8485437bad6a1.reference = {
    __cReference: true,
    get value() { return CHAIR1____header_global_9f6bb5afeeca435e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:329
export const CHAIR2____header_global_44922692200cd7c6 = ((((((557) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_78592bdf6126d64e1d23690c() {
  return __cxx_static_address_78592bdf6126d64e1d23690c.reference || (__cxx_static_address_78592bdf6126d64e1d23690c.reference = {
    __cReference: true,
    get value() { return CHAIR2____header_global_44922692200cd7c6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:330
export const BROKENCHAIR____header_global_c6b2b0c9dd77ef33 = ((((((559) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6b9c54f0ecafb2e8dab6e458() {
  return __cxx_static_address_6b9c54f0ecafb2e8dab6e458.reference || (__cxx_static_address_6b9c54f0ecafb2e8dab6e458.reference = {
    __cReference: true,
    get value() { return BROKENCHAIR____header_global_c6b2b0c9dd77ef33; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:331
export const MIRROR____header_global_47ded146971be400 = ((((((560) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_79375c287d4988fb0306bdc1() {
  return __cxx_static_address_79375c287d4988fb0306bdc1.reference || (__cxx_static_address_79375c287d4988fb0306bdc1.reference = {
    __cReference: true,
    get value() { return MIRROR____header_global_47ded146971be400; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:332
export const WATERFOUNTAIN____header_global_74761e3f89361064 = ((((((563) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4a6fc06344d54203e171f615() {
  return __cxx_static_address_4a6fc06344d54203e171f615.reference || (__cxx_static_address_4a6fc06344d54203e171f615.reference = {
    __cReference: true,
    get value() { return WATERFOUNTAIN____header_global_74761e3f89361064; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:333
export const WATERFOUNTAINBROKE____header_global_bf7b2b74c5ba9f32 = ((((((567) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fb567a7f049ae9434e409d0e() {
  return __cxx_static_address_fb567a7f049ae9434e409d0e.reference || (__cxx_static_address_fb567a7f049ae9434e409d0e.reference = {
    __cReference: true,
    get value() { return WATERFOUNTAINBROKE____header_global_bf7b2b74c5ba9f32; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:334
export const FEMMAG1____header_global_f113a6ebd5d52a69 = ((((((568) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dc6e4b9f0316845c50ae7acc() {
  return __cxx_static_address_dc6e4b9f0316845c50ae7acc.reference || (__cxx_static_address_dc6e4b9f0316845c50ae7acc.reference = {
    __cReference: true,
    get value() { return FEMMAG1____header_global_f113a6ebd5d52a69; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:335
export const TOILET____header_global_31219d7dfc1e3d49 = ((((((569) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_54a1498fe42849bdf6d27e91() {
  return __cxx_static_address_54a1498fe42849bdf6d27e91.reference || (__cxx_static_address_54a1498fe42849bdf6d27e91.reference = {
    __cReference: true,
    get value() { return TOILET____header_global_31219d7dfc1e3d49; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:336
export const STALL____header_global_19561af2941e244e = ((((((571) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_84dad902b5371e1409af9976() {
  return __cxx_static_address_84dad902b5371e1409af9976.reference || (__cxx_static_address_84dad902b5371e1409af9976.reference = {
    __cReference: true,
    get value() { return STALL____header_global_19561af2941e244e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:337
export const STALLBROKE____header_global_47c4c095c6f10a4f = ((((((573) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dec6f27279b00b19b1013dba() {
  return __cxx_static_address_dec6f27279b00b19b1013dba.reference || (__cxx_static_address_dec6f27279b00b19b1013dba.reference = {
    __cReference: true,
    get value() { return STALLBROKE____header_global_47c4c095c6f10a4f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:338
export const FEMMAG2____header_global_147ba74194559e98 = ((((((577) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f4f3ffa9fdaf54392547c24c() {
  return __cxx_static_address_f4f3ffa9fdaf54392547c24c.reference || (__cxx_static_address_f4f3ffa9fdaf54392547c24c.reference = {
    __cReference: true,
    get value() { return FEMMAG2____header_global_147ba74194559e98; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:339
export const REACTOR2____header_global_73267b44992a872a = ((((((578) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_04f0f0720e275ee1bc26d40e() {
  return __cxx_static_address_04f0f0720e275ee1bc26d40e.reference || (__cxx_static_address_04f0f0720e275ee1bc26d40e.reference = {
    __cReference: true,
    get value() { return REACTOR2____header_global_73267b44992a872a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:340
export const REACTOR2BURNT____header_global_b632107a6d7bafcc = ((((((579) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_be0d165c6842a7bdf0e5e562() {
  return __cxx_static_address_be0d165c6842a7bdf0e5e562.reference || (__cxx_static_address_be0d165c6842a7bdf0e5e562.reference = {
    __cReference: true,
    get value() { return REACTOR2BURNT____header_global_b632107a6d7bafcc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:341
export const REACTOR2SPARK____header_global_1128f742bf3c0dd1 = ((((((580) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6e0f40d314be750a88e45161() {
  return __cxx_static_address_6e0f40d314be750a88e45161.reference || (__cxx_static_address_6e0f40d314be750a88e45161.reference = {
    __cReference: true,
    get value() { return REACTOR2SPARK____header_global_1128f742bf3c0dd1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:342
export const GRATE1____header_global_1427f6d2f06f5949 = ((((((595) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1bd3be3b08829713568056a9() {
  return __cxx_static_address_1bd3be3b08829713568056a9.reference || (__cxx_static_address_1bd3be3b08829713568056a9.reference = {
    __cReference: true,
    get value() { return GRATE1____header_global_1427f6d2f06f5949; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:343
export const BGRATE1____header_global_8e68c174243689f8 = ((((((596) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c4c888fa8216d63763f3ef9b() {
  return __cxx_static_address_c4c888fa8216d63763f3ef9b.reference || (__cxx_static_address_c4c888fa8216d63763f3ef9b.reference = {
    __cReference: true,
    get value() { return BGRATE1____header_global_8e68c174243689f8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:344
export const SOLARPANNEL____header_global_9ebf0e1a73ff5e1c = ((((((602) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ee2557ec43b9b5223555ffb6() {
  return __cxx_static_address_ee2557ec43b9b5223555ffb6.reference || (__cxx_static_address_ee2557ec43b9b5223555ffb6.reference = {
    __cReference: true,
    get value() { return SOLARPANNEL____header_global_9ebf0e1a73ff5e1c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:345
export const NAKED1____header_global_4fc4afa76b899409 = ((((((603) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_267fdb20f39a42789978dbcc() {
  return __cxx_static_address_267fdb20f39a42789978dbcc.reference || (__cxx_static_address_267fdb20f39a42789978dbcc.reference = {
    __cReference: true,
    get value() { return NAKED1____header_global_4fc4afa76b899409; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:346
export const ANTENNA____header_global_7dca4dda2a32fd5c = ((((((607) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bd249a0484376a7cd0ce1242() {
  return __cxx_static_address_bd249a0484376a7cd0ce1242.reference || (__cxx_static_address_bd249a0484376a7cd0ce1242.reference = {
    __cReference: true,
    get value() { return ANTENNA____header_global_7dca4dda2a32fd5c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:347
export const MASKWALL12____header_global_b7f119ad49d2c30a = ((((((609) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_466eff03af4db514e34f9cd2() {
  return __cxx_static_address_466eff03af4db514e34f9cd2.reference || (__cxx_static_address_466eff03af4db514e34f9cd2.reference = {
    __cReference: true,
    get value() { return MASKWALL12____header_global_b7f119ad49d2c30a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:348
export const TOILETBROKE____header_global_e7a3a89d314a5214 = ((((((615) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_02808bc0f9e0ff27e9c13542() {
  return __cxx_static_address_02808bc0f9e0ff27e9c13542.reference || (__cxx_static_address_02808bc0f9e0ff27e9c13542.reference = {
    __cReference: true,
    get value() { return TOILETBROKE____header_global_e7a3a89d314a5214; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:349
export const PIPE2____header_global_d85ada7ca9e882cb = ((((((616) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_349c8c7cc2049bcd76dfbe05() {
  return __cxx_static_address_349c8c7cc2049bcd76dfbe05.reference || (__cxx_static_address_349c8c7cc2049bcd76dfbe05.reference = {
    __cReference: true,
    get value() { return PIPE2____header_global_d85ada7ca9e882cb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:350
export const PIPE1B____header_global_b9894f68bda35cf5 = ((((((617) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9454e2390e155d9bbdb7ba1f() {
  return __cxx_static_address_9454e2390e155d9bbdb7ba1f.reference || (__cxx_static_address_9454e2390e155d9bbdb7ba1f.reference = {
    __cReference: true,
    get value() { return PIPE1B____header_global_b9894f68bda35cf5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:351
export const PIPE3____header_global_eca3c46fb1f9bd37 = ((((((618) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_92036d5f8abe5857b49c3c7c() {
  return __cxx_static_address_92036d5f8abe5857b49c3c7c.reference || (__cxx_static_address_92036d5f8abe5857b49c3c7c.reference = {
    __cReference: true,
    get value() { return PIPE3____header_global_eca3c46fb1f9bd37; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:352
export const PIPE1____header_global_cd6af347ee5105fe = ((((((619) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_77ce34f31c8985d561d98b6b() {
  return __cxx_static_address_77ce34f31c8985d561d98b6b.reference || (__cxx_static_address_77ce34f31c8985d561d98b6b.reference = {
    __cReference: true,
    get value() { return PIPE1____header_global_cd6af347ee5105fe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:353
export const CAMERA1____header_global_b301e217961083b1 = ((((((621) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_36373b86324ebdde3933b610() {
  return __cxx_static_address_36373b86324ebdde3933b610.reference || (__cxx_static_address_36373b86324ebdde3933b610.reference = {
    __cReference: true,
    get value() { return CAMERA1____header_global_b301e217961083b1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:354
export const PIPE2B____header_global_f9476a1da9b253fa = ((((((633) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d579545f1484abdf75db72a8() {
  return __cxx_static_address_d579545f1484abdf75db72a8.reference || (__cxx_static_address_d579545f1484abdf75db72a8.reference = {
    __cReference: true,
    get value() { return PIPE2B____header_global_f9476a1da9b253fa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:355
export const BOLT1____header_global_e6e75a240d198001 = ((((((634) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0d272b9522ca3694b4e114e2() {
  return __cxx_static_address_0d272b9522ca3694b4e114e2.reference || (__cxx_static_address_0d272b9522ca3694b4e114e2.reference = {
    __cReference: true,
    get value() { return BOLT1____header_global_e6e75a240d198001; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:356
export const W_NUMBERS____header_global_eceaee457af0e9b2 = ((((((640) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fbb9816a889b48a8a0cb7f20() {
  return __cxx_static_address_fbb9816a889b48a8a0cb7f20.reference || (__cxx_static_address_fbb9816a889b48a8a0cb7f20.reference = {
    __cReference: true,
    get value() { return W_NUMBERS____header_global_eceaee457af0e9b2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:357
export const WATERDRIP____header_global_3fa24358573fa0ec = ((((((660) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f4f0ebdb3248d013b2ee44ac() {
  return __cxx_static_address_f4f0ebdb3248d013b2ee44ac.reference || (__cxx_static_address_f4f0ebdb3248d013b2ee44ac.reference = {
    __cReference: true,
    get value() { return WATERDRIP____header_global_3fa24358573fa0ec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:358
export const WATERBUBBLE____header_global_d7b54bb0edc90f60 = ((((((661) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3a0fd20907ba7b7edab8deef() {
  return __cxx_static_address_3a0fd20907ba7b7edab8deef.reference || (__cxx_static_address_3a0fd20907ba7b7edab8deef.reference = {
    __cReference: true,
    get value() { return WATERBUBBLE____header_global_d7b54bb0edc90f60; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:359
export const WATERBUBBLEMAKER____header_global_ab32297bc19d5886 = ((((((662) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1a9c30cd16eb097e3c6cabe2() {
  return __cxx_static_address_1a9c30cd16eb097e3c6cabe2.reference || (__cxx_static_address_1a9c30cd16eb097e3c6cabe2.reference = {
    __cReference: true,
    get value() { return WATERBUBBLEMAKER____header_global_ab32297bc19d5886; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:360
export const W_FORCEFIELD____header_global_4d2da4b0d7c4996d = ((((((663) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_55ac2162d6300fc65198499e() {
  return __cxx_static_address_55ac2162d6300fc65198499e.reference || (__cxx_static_address_55ac2162d6300fc65198499e.reference = {
    __cReference: true,
    get value() { return W_FORCEFIELD____header_global_4d2da4b0d7c4996d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:361
export const VACUUM____header_global_f5976ae7db99e543 = ((((((669) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3fff855a16cfb68c6c9d5438() {
  return __cxx_static_address_3fff855a16cfb68c6c9d5438.reference || (__cxx_static_address_3fff855a16cfb68c6c9d5438.reference = {
    __cReference: true,
    get value() { return VACUUM____header_global_f5976ae7db99e543; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:362
export const FOOTPRINTS2____header_global_a7bbaf5a7094b407 = ((((((672) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4494871e8ba8ac1036c50a47() {
  return __cxx_static_address_4494871e8ba8ac1036c50a47.reference || (__cxx_static_address_4494871e8ba8ac1036c50a47.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS2____header_global_a7bbaf5a7094b407; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:363
export const FOOTPRINTS3____header_global_f948a62e3e412748 = ((((((673) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ff731ed53dee8fc4b59b51de() {
  return __cxx_static_address_ff731ed53dee8fc4b59b51de.reference || (__cxx_static_address_ff731ed53dee8fc4b59b51de.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS3____header_global_f948a62e3e412748; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:364
export const FOOTPRINTS4____header_global_80e1a9a711522d24 = ((((((674) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7b86a50055e98680917a56ab() {
  return __cxx_static_address_7b86a50055e98680917a56ab.reference || (__cxx_static_address_7b86a50055e98680917a56ab.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS4____header_global_80e1a9a711522d24; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:365
export const EGG____header_global_955f8deb5fa82949 = ((((((675) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1114d97066c3d9914d5d4537() {
  return __cxx_static_address_1114d97066c3d9914d5d4537.reference || (__cxx_static_address_1114d97066c3d9914d5d4537.reference = {
    __cReference: true,
    get value() { return EGG____header_global_955f8deb5fa82949; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:366
export const SCALE____header_global_ac43f49af8a207c6 = ((((((678) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_39a7363e3ad3e63a661432b5() {
  return __cxx_static_address_39a7363e3ad3e63a661432b5.reference || (__cxx_static_address_39a7363e3ad3e63a661432b5.reference = {
    __cReference: true,
    get value() { return SCALE____header_global_ac43f49af8a207c6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:367
export const CHAIR3____header_global_ddde356c2083cf2d = ((((((680) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_10146bb827fa14c9f45094a9() {
  return __cxx_static_address_10146bb827fa14c9f45094a9.reference || (__cxx_static_address_10146bb827fa14c9f45094a9.reference = {
    __cReference: true,
    get value() { return CHAIR3____header_global_ddde356c2083cf2d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:368
export const CAMERALIGHT____header_global_b2b6e7ce042ac065 = ((((((685) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8256d9862affe8941aa39dcc() {
  return __cxx_static_address_8256d9862affe8941aa39dcc.reference || (__cxx_static_address_8256d9862affe8941aa39dcc.reference = {
    __cReference: true,
    get value() { return CAMERALIGHT____header_global_b2b6e7ce042ac065; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:369
export const MOVIECAMERA____header_global_6941ef06b1c5d2aa = ((((((686) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8f4ea6ef7ddf54012b2fe321() {
  return __cxx_static_address_8f4ea6ef7ddf54012b2fe321.reference || (__cxx_static_address_8f4ea6ef7ddf54012b2fe321.reference = {
    __cReference: true,
    get value() { return MOVIECAMERA____header_global_6941ef06b1c5d2aa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:370
export const IVUNIT____header_global_df1a2efe3a0b8e07 = ((((((689) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_95f167ac9d57eb56d86dce25() {
  return __cxx_static_address_95f167ac9d57eb56d86dce25.reference || (__cxx_static_address_95f167ac9d57eb56d86dce25.reference = {
    __cReference: true,
    get value() { return IVUNIT____header_global_df1a2efe3a0b8e07; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:371
export const POT1____header_global_abf7501c2a50df8c = ((((((694) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3d1336cdf098a9c3a4c84565() {
  return __cxx_static_address_3d1336cdf098a9c3a4c84565.reference || (__cxx_static_address_3d1336cdf098a9c3a4c84565.reference = {
    __cReference: true,
    get value() { return POT1____header_global_abf7501c2a50df8c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:372
export const POT2____header_global_8d25973eb681277d = ((((((695) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a83436fc8ff2cff23938bf76() {
  return __cxx_static_address_a83436fc8ff2cff23938bf76.reference || (__cxx_static_address_a83436fc8ff2cff23938bf76.reference = {
    __cReference: true,
    get value() { return POT2____header_global_8d25973eb681277d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:373
export const POT3____header_global_cda35434bdeb3202 = ((((((697) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ca837f348d4d4ea4cae7e6ed() {
  return __cxx_static_address_ca837f348d4d4ea4cae7e6ed.reference || (__cxx_static_address_ca837f348d4d4ea4cae7e6ed.reference = {
    __cReference: true,
    get value() { return POT3____header_global_cda35434bdeb3202; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:374
export const PIPE3B____header_global_d3048bfded159fb5 = ((((((700) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fabda7f1fc31fecb2e8594f5() {
  return __cxx_static_address_fabda7f1fc31fecb2e8594f5.reference || (__cxx_static_address_fabda7f1fc31fecb2e8594f5.reference = {
    __cReference: true,
    get value() { return PIPE3B____header_global_d3048bfded159fb5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:375
export const WALLLIGHT3____header_global_7baad59ff67bf697 = ((((((701) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_892f92a095e7e87c7a8ee69e() {
  return __cxx_static_address_892f92a095e7e87c7a8ee69e.reference || (__cxx_static_address_892f92a095e7e87c7a8ee69e.reference = {
    __cReference: true,
    get value() { return WALLLIGHT3____header_global_7baad59ff67bf697; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:376
export const WALLLIGHTBUST3____header_global_114ce9545beb6bbf = ((((((702) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_10cf187ef95444bcf4d643ab() {
  return __cxx_static_address_10cf187ef95444bcf4d643ab.reference || (__cxx_static_address_10cf187ef95444bcf4d643ab.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST3____header_global_114ce9545beb6bbf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:377
export const WALLLIGHT1____header_global_154649084c84c619 = ((((((703) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e3e2ac9b5d59730265220d7c() {
  return __cxx_static_address_e3e2ac9b5d59730265220d7c.reference || (__cxx_static_address_e3e2ac9b5d59730265220d7c.reference = {
    __cReference: true,
    get value() { return WALLLIGHT1____header_global_154649084c84c619; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:378
export const WALLLIGHTBUST1____header_global_224da634ce8c4579 = ((((((704) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_245466cd613a0f41d6da36a0() {
  return __cxx_static_address_245466cd613a0f41d6da36a0.reference || (__cxx_static_address_245466cd613a0f41d6da36a0.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST1____header_global_224da634ce8c4579; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:379
export const WALLLIGHT2____header_global_85a06274e10cad08 = ((((((705) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2aa1d38341dec74147e98fdd() {
  return __cxx_static_address_2aa1d38341dec74147e98fdd.reference || (__cxx_static_address_2aa1d38341dec74147e98fdd.reference = {
    __cReference: true,
    get value() { return WALLLIGHT2____header_global_85a06274e10cad08; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:380
export const WALLLIGHTBUST2____header_global_c06a85b8fb2e26d2 = ((((((706) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_22797427397e0f6b573f36b0() {
  return __cxx_static_address_22797427397e0f6b573f36b0.reference || (__cxx_static_address_22797427397e0f6b573f36b0.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST2____header_global_c06a85b8fb2e26d2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:381
export const LIGHTSWITCH2____header_global_6bed12b785dc53f4 = ((((((712) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9449e0df81e68fbae221ddcd() {
  return __cxx_static_address_9449e0df81e68fbae221ddcd.reference || (__cxx_static_address_9449e0df81e68fbae221ddcd.reference = {
    __cReference: true,
    get value() { return LIGHTSWITCH2____header_global_6bed12b785dc53f4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:382
export const WAITTOBESEATED____header_global_e3bb7d56b0eac0be = ((((((716) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0a4b1c7f5fc5ed01b11b6ada() {
  return __cxx_static_address_0a4b1c7f5fc5ed01b11b6ada.reference || (__cxx_static_address_0a4b1c7f5fc5ed01b11b6ada.reference = {
    __cReference: true,
    get value() { return WAITTOBESEATED____header_global_e3bb7d56b0eac0be; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:383
export const DOORTILE14____header_global_f774673edcdc93d8 = ((((((717) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_98ab41b015b276a9f8b7f6f6() {
  return __cxx_static_address_98ab41b015b276a9f8b7f6f6.reference || (__cxx_static_address_98ab41b015b276a9f8b7f6f6.reference = {
    __cReference: true,
    get value() { return DOORTILE14____header_global_f774673edcdc93d8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:384
export const STATUE____header_global_282896ecc172e40f = ((((((753) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c4f9207e372c5e4babacc208() {
  return __cxx_static_address_c4f9207e372c5e4babacc208.reference || (__cxx_static_address_c4f9207e372c5e4babacc208.reference = {
    __cReference: true,
    get value() { return STATUE____header_global_282896ecc172e40f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:385
export const MIKE____header_global_fe1110a5049e8afc = ((((((762) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c975e01828925e66b711707e() {
  return __cxx_static_address_c975e01828925e66b711707e.reference || (__cxx_static_address_c975e01828925e66b711707e.reference = {
    __cReference: true,
    get value() { return MIKE____header_global_fe1110a5049e8afc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:386
export const VASE____header_global_0fcfe4a923f409d4 = ((((((765) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5793945990735d1b822f0945() {
  return __cxx_static_address_5793945990735d1b822f0945.reference || (__cxx_static_address_5793945990735d1b822f0945.reference = {
    __cReference: true,
    get value() { return VASE____header_global_0fcfe4a923f409d4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:387
export const SUSHIPLATE1____header_global_f3a37f78d92cec19 = ((((((768) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5d02545bd1b6d9b45eb3fa48() {
  return __cxx_static_address_5d02545bd1b6d9b45eb3fa48.reference || (__cxx_static_address_5d02545bd1b6d9b45eb3fa48.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE1____header_global_f3a37f78d92cec19; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:388
export const SUSHIPLATE2____header_global_f05734a34bdc7470 = ((((((769) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_551cfa9c6407f8eb25cfe176() {
  return __cxx_static_address_551cfa9c6407f8eb25cfe176.reference || (__cxx_static_address_551cfa9c6407f8eb25cfe176.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE2____header_global_f05734a34bdc7470; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:389
export const SUSHIPLATE3____header_global_071f754500dae673 = ((((((774) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_491d5c9ec6bf73b798781c91() {
  return __cxx_static_address_491d5c9ec6bf73b798781c91.reference || (__cxx_static_address_491d5c9ec6bf73b798781c91.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE3____header_global_071f754500dae673; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:390
export const SUSHIPLATE4____header_global_c45a001c5f58880a = ((((((779) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9cb4d27f592dd5276bf8f4ef() {
  return __cxx_static_address_9cb4d27f592dd5276bf8f4ef.reference || (__cxx_static_address_9cb4d27f592dd5276bf8f4ef.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE4____header_global_c45a001c5f58880a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:391
export const DOORTILE16____header_global_6f3a73f5d79fc0b0 = ((((((781) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d63fea130eff391b7dc9865b() {
  return __cxx_static_address_d63fea130eff391b7dc9865b.reference || (__cxx_static_address_d63fea130eff391b7dc9865b.reference = {
    __cReference: true,
    get value() { return DOORTILE16____header_global_6f3a73f5d79fc0b0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:392
export const SUSHIPLATE5____header_global_91b1e42ad5b18090 = ((((((792) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_06890dd358c440d1dab22e03() {
  return __cxx_static_address_06890dd358c440d1dab22e03.reference || (__cxx_static_address_06890dd358c440d1dab22e03.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE5____header_global_91b1e42ad5b18090; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:393
export const OJ____header_global_d4fc7babe6a6d0f7 = ((((((806) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_baf90ba54e9704df87f0f965() {
  return __cxx_static_address_baf90ba54e9704df87f0f965.reference || (__cxx_static_address_baf90ba54e9704df87f0f965.reference = {
    __cReference: true,
    get value() { return OJ____header_global_d4fc7babe6a6d0f7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:394
export const MASKWALL13____header_global_25fabb340a3c6efc = ((((((830) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0e0fbfa36ff46c09de64fee6() {
  return __cxx_static_address_0e0fbfa36ff46c09de64fee6.reference || (__cxx_static_address_0e0fbfa36ff46c09de64fee6.reference = {
    __cReference: true,
    get value() { return MASKWALL13____header_global_25fabb340a3c6efc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:395
export const HURTRAIL____header_global_e59f7a54bd97200c = ((((((859) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_525d7ae31ab60bc2a9848d14() {
  return __cxx_static_address_525d7ae31ab60bc2a9848d14.reference || (__cxx_static_address_525d7ae31ab60bc2a9848d14.reference = {
    __cReference: true,
    get value() { return HURTRAIL____header_global_e59f7a54bd97200c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:396
export const POWERSWITCH1____header_global_ae520965e508f8e0 = ((((((860) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a2297645e6159d9f8b143674() {
  return __cxx_static_address_a2297645e6159d9f8b143674.reference || (__cxx_static_address_a2297645e6159d9f8b143674.reference = {
    __cReference: true,
    get value() { return POWERSWITCH1____header_global_ae520965e508f8e0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:397
export const LOCKSWITCH1____header_global_bf7b20cd37118540 = ((((((862) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9f91ff6491bbc21b5e6c2ba6() {
  return __cxx_static_address_9f91ff6491bbc21b5e6c2ba6.reference || (__cxx_static_address_9f91ff6491bbc21b5e6c2ba6.reference = {
    __cReference: true,
    get value() { return LOCKSWITCH1____header_global_bf7b20cd37118540; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:398
export const POWERSWITCH2____header_global_627f7ca262ee9729 = ((((((864) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5e969d37093d3eed1944035f() {
  return __cxx_static_address_5e969d37093d3eed1944035f.reference || (__cxx_static_address_5e969d37093d3eed1944035f.reference = {
    __cReference: true,
    get value() { return POWERSWITCH2____header_global_627f7ca262ee9729; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:399
export const ATM____header_global_79962f0f3b17082b = ((((((867) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_43c631618628ac4d730c48ed() {
  return __cxx_static_address_43c631618628ac4d730c48ed.reference || (__cxx_static_address_43c631618628ac4d730c48ed.reference = {
    __cReference: true,
    get value() { return ATM____header_global_79962f0f3b17082b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:400
export const STATUEFLASH____header_global_a265e91ad13c485b = ((((((869) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f824d3dd5f1ba6d3430a2a72() {
  return __cxx_static_address_f824d3dd5f1ba6d3430a2a72.reference || (__cxx_static_address_f824d3dd5f1ba6d3430a2a72.reference = {
    __cReference: true,
    get value() { return STATUEFLASH____header_global_a265e91ad13c485b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:401
export const ATMBROKE____header_global_c37b858ec64804a3 = ((((((888) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_01fbb0db352279cd705d655c() {
  return __cxx_static_address_01fbb0db352279cd705d655c.reference || (__cxx_static_address_01fbb0db352279cd705d655c.reference = {
    __cReference: true,
    get value() { return ATMBROKE____header_global_c37b858ec64804a3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:402
export const STRIPEBALL____header_global_f391f5cd7f49400f = ((((((901) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b2bc80d9d672e559d465b89b() {
  return __cxx_static_address_b2bc80d9d672e559d465b89b.reference || (__cxx_static_address_b2bc80d9d672e559d465b89b.reference = {
    __cReference: true,
    get value() { return STRIPEBALL____header_global_f391f5cd7f49400f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:403
export const QUEBALL____header_global_53c18622453cf3c8 = ((((((902) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1213dddb023e8e42e1c0d002() {
  return __cxx_static_address_1213dddb023e8e42e1c0d002.reference || (__cxx_static_address_1213dddb023e8e42e1c0d002.reference = {
    __cReference: true,
    get value() { return QUEBALL____header_global_53c18622453cf3c8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:404
export const POCKET____header_global_f8657c5141078eca = ((((((903) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7dcc3b1136f4882783ec1d6b() {
  return __cxx_static_address_7dcc3b1136f4882783ec1d6b.reference || (__cxx_static_address_7dcc3b1136f4882783ec1d6b.reference = {
    __cReference: true,
    get value() { return POCKET____header_global_f8657c5141078eca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:405
export const WOODENHORSE____header_global_ca52d74e3e25a0cd = ((((((904) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8f2fd7ba08f0df8d23459c45() {
  return __cxx_static_address_8f2fd7ba08f0df8d23459c45.reference || (__cxx_static_address_8f2fd7ba08f0df8d23459c45.reference = {
    __cReference: true,
    get value() { return WOODENHORSE____header_global_ca52d74e3e25a0cd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:406
export const TREE1____header_global_bce065ac0de9b825 = ((((((908) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_96b6f659054c6bccf96eedb7() {
  return __cxx_static_address_96b6f659054c6bccf96eedb7.reference || (__cxx_static_address_96b6f659054c6bccf96eedb7.reference = {
    __cReference: true,
    get value() { return TREE1____header_global_bce065ac0de9b825; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:407
export const TREE2____header_global_3a0228870d2c5e7a = ((((((910) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c977258d5be047b4b92b9d71() {
  return __cxx_static_address_c977258d5be047b4b92b9d71.reference || (__cxx_static_address_c977258d5be047b4b92b9d71.reference = {
    __cReference: true,
    get value() { return TREE2____header_global_3a0228870d2c5e7a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:408
export const CACTUS____header_global_c6bf39c104e91f2f = ((((((911) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_337f40ca0ddddd40b8026129() {
  return __cxx_static_address_337f40ca0ddddd40b8026129.reference || (__cxx_static_address_337f40ca0ddddd40b8026129.reference = {
    __cReference: true,
    get value() { return CACTUS____header_global_c6bf39c104e91f2f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:409
export const MASKWALL2____header_global_1f39d99d1d4595bb = ((((((913) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bfda1152f045275e85441edd() {
  return __cxx_static_address_bfda1152f045275e85441edd.reference || (__cxx_static_address_bfda1152f045275e85441edd.reference = {
    __cReference: true,
    get value() { return MASKWALL2____header_global_1f39d99d1d4595bb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:410
export const MASKWALL3____header_global_145be78da10343e6 = ((((((914) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_102855f93987519019b72852() {
  return __cxx_static_address_102855f93987519019b72852.reference || (__cxx_static_address_102855f93987519019b72852.reference = {
    __cReference: true,
    get value() { return MASKWALL3____header_global_145be78da10343e6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:411
export const MASKWALL4____header_global_394443596b3f5e04 = ((((((915) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_180b10e6c9969a5eccb91f19() {
  return __cxx_static_address_180b10e6c9969a5eccb91f19.reference || (__cxx_static_address_180b10e6c9969a5eccb91f19.reference = {
    __cReference: true,
    get value() { return MASKWALL4____header_global_394443596b3f5e04; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:412
export const FIREEXT____header_global_b3ca9bc58372b753 = ((((((916) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0325617a3401d8757c6c80e8() {
  return __cxx_static_address_0325617a3401d8757c6c80e8.reference || (__cxx_static_address_0325617a3401d8757c6c80e8.reference = {
    __cReference: true,
    get value() { return FIREEXT____header_global_b3ca9bc58372b753; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:413
export const TOILETWATER____header_global_87a6c72393040811 = ((((((921) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1640345ff13498fff0ebcd9b() {
  return __cxx_static_address_1640345ff13498fff0ebcd9b.reference || (__cxx_static_address_1640345ff13498fff0ebcd9b.reference = {
    __cReference: true,
    get value() { return TOILETWATER____header_global_87a6c72393040811; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:414
export const NEON1____header_global_ea2962396a6ff3e9 = ((((((925) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2aca058d78c98ccaef212915() {
  return __cxx_static_address_2aca058d78c98ccaef212915.reference || (__cxx_static_address_2aca058d78c98ccaef212915.reference = {
    __cReference: true,
    get value() { return NEON1____header_global_ea2962396a6ff3e9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:415
export const NEON2____header_global_ead31028026f2d9b = ((((((926) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_952638b1e48646a5fd6cec6a() {
  return __cxx_static_address_952638b1e48646a5fd6cec6a.reference || (__cxx_static_address_952638b1e48646a5fd6cec6a.reference = {
    __cReference: true,
    get value() { return NEON2____header_global_ead31028026f2d9b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:416
export const CACTUSBROKE____header_global_93209804048e7fe6 = ((((((939) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_27bcfd90f822e0b5abdf4dd3() {
  return __cxx_static_address_27bcfd90f822e0b5abdf4dd3.reference || (__cxx_static_address_27bcfd90f822e0b5abdf4dd3.reference = {
    __cReference: true,
    get value() { return CACTUSBROKE____header_global_93209804048e7fe6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:417
export const BOUNCEMINE____header_global_30dd53cf921fc71a = ((((((940) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cc10a3d886be5970209816b4() {
  return __cxx_static_address_cc10a3d886be5970209816b4.reference || (__cxx_static_address_cc10a3d886be5970209816b4.reference = {
    __cReference: true,
    get value() { return BOUNCEMINE____header_global_30dd53cf921fc71a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:418
export const BROKEFIREHYDRENT____header_global_cdb8c89765644b1a = ((((((950) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_76176a2562a328b21afa5f94() {
  return __cxx_static_address_76176a2562a328b21afa5f94.reference || (__cxx_static_address_76176a2562a328b21afa5f94.reference = {
    __cReference: true,
    get value() { return BROKEFIREHYDRENT____header_global_cdb8c89765644b1a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:419
export const BOX____header_global_e401ccb641bbc00a = ((((((951) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4af3ed54e468afe3efb9827d() {
  return __cxx_static_address_4af3ed54e468afe3efb9827d.reference || (__cxx_static_address_4af3ed54e468afe3efb9827d.reference = {
    __cReference: true,
    get value() { return BOX____header_global_e401ccb641bbc00a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:420
export const BULLETHOLE____header_global_594c4edab2463268 = ((((((952) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9b857b0447cf399a2e88dcb2() {
  return __cxx_static_address_9b857b0447cf399a2e88dcb2.reference || (__cxx_static_address_9b857b0447cf399a2e88dcb2.reference = {
    __cReference: true,
    get value() { return BULLETHOLE____header_global_594c4edab2463268; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:421
export const BOTTLE1____header_global_b27de3cff934b850 = ((((((954) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_674581b72fd2c6c7d44be277() {
  return __cxx_static_address_674581b72fd2c6c7d44be277.reference || (__cxx_static_address_674581b72fd2c6c7d44be277.reference = {
    __cReference: true,
    get value() { return BOTTLE1____header_global_b27de3cff934b850; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:422
export const BOTTLE2____header_global_67c0cb575acff3c4 = ((((((955) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b3af9ba6c7498e0ed25e7b4b() {
  return __cxx_static_address_b3af9ba6c7498e0ed25e7b4b.reference || (__cxx_static_address_b3af9ba6c7498e0ed25e7b4b.reference = {
    __cReference: true,
    get value() { return BOTTLE2____header_global_67c0cb575acff3c4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:423
export const BOTTLE3____header_global_e836c3e9a7afefe0 = ((((((956) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cd1cece1cd347349b5b927eb() {
  return __cxx_static_address_cd1cece1cd347349b5b927eb.reference || (__cxx_static_address_cd1cece1cd347349b5b927eb.reference = {
    __cReference: true,
    get value() { return BOTTLE3____header_global_e836c3e9a7afefe0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:424
export const BOTTLE4____header_global_61698a85380d0767 = ((((((957) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_59a966326671dfb752adf5ac() {
  return __cxx_static_address_59a966326671dfb752adf5ac.reference || (__cxx_static_address_59a966326671dfb752adf5ac.reference = {
    __cReference: true,
    get value() { return BOTTLE4____header_global_61698a85380d0767; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:425
export const FEMPIC5____header_global_9b9169361e41b1bf = ((((((963) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_631a20725321d2a4e78f8852() {
  return __cxx_static_address_631a20725321d2a4e78f8852.reference || (__cxx_static_address_631a20725321d2a4e78f8852.reference = {
    __cReference: true,
    get value() { return FEMPIC5____header_global_9b9169361e41b1bf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:426
export const FEMPIC6____header_global_f4d1cb981926084c = ((((((964) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_decd94471a004259239f12ba() {
  return __cxx_static_address_decd94471a004259239f12ba.reference || (__cxx_static_address_decd94471a004259239f12ba.reference = {
    __cReference: true,
    get value() { return FEMPIC6____header_global_f4d1cb981926084c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:427
export const FEMPIC7____header_global_ef02f634611ffe36 = ((((((965) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f72899e508bb6d27588df96d() {
  return __cxx_static_address_f72899e508bb6d27588df96d.reference || (__cxx_static_address_f72899e508bb6d27588df96d.reference = {
    __cReference: true,
    get value() { return FEMPIC7____header_global_ef02f634611ffe36; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:428
export const HYDROPLANT____header_global_5aa926b0e47f4e04 = ((((((969) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0bf3f8a1b1abfde4beb1c202() {
  return __cxx_static_address_0bf3f8a1b1abfde4beb1c202.reference || (__cxx_static_address_0bf3f8a1b1abfde4beb1c202.reference = {
    __cReference: true,
    get value() { return HYDROPLANT____header_global_5aa926b0e47f4e04; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:429
export const OCEANSPRITE1____header_global_84a7ce75226a6e6b = ((((((971) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e430a01fb5f444e72d5710f6() {
  return __cxx_static_address_e430a01fb5f444e72d5710f6.reference || (__cxx_static_address_e430a01fb5f444e72d5710f6.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE1____header_global_84a7ce75226a6e6b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:430
export const OCEANSPRITE2____header_global_9ae1f8de9c367097 = ((((((972) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8bc4bbb609555557f43f6483() {
  return __cxx_static_address_8bc4bbb609555557f43f6483.reference || (__cxx_static_address_8bc4bbb609555557f43f6483.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE2____header_global_9ae1f8de9c367097; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:431
export const OCEANSPRITE3____header_global_8ac3e9f948aaad28 = ((((((973) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_703a78c5c0392153cdbe4952() {
  return __cxx_static_address_703a78c5c0392153cdbe4952.reference || (__cxx_static_address_703a78c5c0392153cdbe4952.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE3____header_global_8ac3e9f948aaad28; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:432
export const OCEANSPRITE4____header_global_5660b67debbdd125 = ((((((974) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c8f1d3d9c3d57889455eabf9() {
  return __cxx_static_address_c8f1d3d9c3d57889455eabf9.reference || (__cxx_static_address_c8f1d3d9c3d57889455eabf9.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE4____header_global_5660b67debbdd125; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:433
export const OCEANSPRITE5____header_global_b5962a0190b9f115 = ((((((975) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e70bd56073f75f8d8f261043() {
  return __cxx_static_address_e70bd56073f75f8d8f261043.reference || (__cxx_static_address_e70bd56073f75f8d8f261043.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE5____header_global_b5962a0190b9f115; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:434
export const GENERICPOLE____header_global_f361a6184eb8005d = ((((((977) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_815795e44e91ce9c74cd6009() {
  return __cxx_static_address_815795e44e91ce9c74cd6009.reference || (__cxx_static_address_815795e44e91ce9c74cd6009.reference = {
    __cReference: true,
    get value() { return GENERICPOLE____header_global_f361a6184eb8005d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:435
export const CONE____header_global_045094a82dd3e465 = ((((((978) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1a2e620cdf48e5bb2d8ca192() {
  return __cxx_static_address_1a2e620cdf48e5bb2d8ca192.reference || (__cxx_static_address_1a2e620cdf48e5bb2d8ca192.reference = {
    __cReference: true,
    get value() { return CONE____header_global_045094a82dd3e465; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:436
export const HANGLIGHT____header_global_5491ec7834cb47d3 = ((((((979) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_26e9c0a5b80688c8c15b6d78() {
  return __cxx_static_address_26e9c0a5b80688c8c15b6d78.reference || (__cxx_static_address_26e9c0a5b80688c8c15b6d78.reference = {
    __cReference: true,
    get value() { return HANGLIGHT____header_global_5491ec7834cb47d3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:437
export const HYDRENT____header_global_69d53167336419c8 = ((((((981) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_36d288ea2fb1e813aa1eb29b() {
  return __cxx_static_address_36d288ea2fb1e813aa1eb29b.reference || (__cxx_static_address_36d288ea2fb1e813aa1eb29b.reference = {
    __cReference: true,
    get value() { return HYDRENT____header_global_69d53167336419c8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:438
export const MASKWALL14____header_global_80e709e11ee468d8 = ((((((988) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_15a90fca8bc2b27d1a8d5b9a() {
  return __cxx_static_address_15a90fca8bc2b27d1a8d5b9a.reference || (__cxx_static_address_15a90fca8bc2b27d1a8d5b9a.reference = {
    __cReference: true,
    get value() { return MASKWALL14____header_global_80e709e11ee468d8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:439
export const TIRE____header_global_57429fd725447bc4 = ((((((990) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4f7255dd4a9855b1d8e485da() {
  return __cxx_static_address_4f7255dd4a9855b1d8e485da.reference || (__cxx_static_address_4f7255dd4a9855b1d8e485da.reference = {
    __cReference: true,
    get value() { return TIRE____header_global_57429fd725447bc4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:440
export const PIPE5____header_global_0a92c12bdc0ce071 = ((((((994) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6ce2c73d1f8997c3ec867a14() {
  return __cxx_static_address_6ce2c73d1f8997c3ec867a14.reference || (__cxx_static_address_6ce2c73d1f8997c3ec867a14.reference = {
    __cReference: true,
    get value() { return PIPE5____header_global_0a92c12bdc0ce071; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:441
export const PIPE6____header_global_22cdd15fb5edfab6 = ((((((995) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_13e4c887628ba19ed2bf1f0b() {
  return __cxx_static_address_13e4c887628ba19ed2bf1f0b.reference || (__cxx_static_address_13e4c887628ba19ed2bf1f0b.reference = {
    __cReference: true,
    get value() { return PIPE6____header_global_22cdd15fb5edfab6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:442
export const PIPE4____header_global_90fd0aad7078901f = ((((((996) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bedd14aec2c4362a12e38de6() {
  return __cxx_static_address_bedd14aec2c4362a12e38de6.reference || (__cxx_static_address_bedd14aec2c4362a12e38de6.reference = {
    __cReference: true,
    get value() { return PIPE4____header_global_90fd0aad7078901f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:443
export const PIPE4B____header_global_42b998917f36dcd2 = ((((((997) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_719bde235efd3dcb300d3a01() {
  return __cxx_static_address_719bde235efd3dcb300d3a01.reference || (__cxx_static_address_719bde235efd3dcb300d3a01.reference = {
    __cReference: true,
    get value() { return PIPE4B____header_global_42b998917f36dcd2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:444
export const BROKEHYDROPLANT____header_global_f958c0edfd0ec199 = ((((((1003) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8ce86a82c69273d452c44893() {
  return __cxx_static_address_8ce86a82c69273d452c44893.reference || (__cxx_static_address_8ce86a82c69273d452c44893.reference = {
    __cReference: true,
    get value() { return BROKEHYDROPLANT____header_global_f958c0edfd0ec199; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:445
export const PIPE5B____header_global_3ac5ab91539911b0 = ((((((1005) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ecfe1c825ab24dc651c7eaed() {
  return __cxx_static_address_ecfe1c825ab24dc651c7eaed.reference || (__cxx_static_address_ecfe1c825ab24dc651c7eaed.reference = {
    __cReference: true,
    get value() { return PIPE5B____header_global_3ac5ab91539911b0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:446
export const NEON3____header_global_74294cc219afa079 = ((((((1007) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5eb81846a32afa79f137befe() {
  return __cxx_static_address_5eb81846a32afa79f137befe.reference || (__cxx_static_address_5eb81846a32afa79f137befe.reference = {
    __cReference: true,
    get value() { return NEON3____header_global_74294cc219afa079; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:447
export const NEON4____header_global_fec4456229451667 = ((((((1008) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8fadec97533e0d7cb4f7e238() {
  return __cxx_static_address_8fadec97533e0d7cb4f7e238.reference || (__cxx_static_address_8fadec97533e0d7cb4f7e238.reference = {
    __cReference: true,
    get value() { return NEON4____header_global_fec4456229451667; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:448
export const NEON5____header_global_84fa8040e510e1c4 = ((((((1009) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e167e80906dcfaa8013de333() {
  return __cxx_static_address_e167e80906dcfaa8013de333.reference || (__cxx_static_address_e167e80906dcfaa8013de333.reference = {
    __cReference: true,
    get value() { return NEON5____header_global_84fa8040e510e1c4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:449
export const BOTTLE5____header_global_926d226f510286a1 = ((((((1012) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c5f3e081c714d06b2051d837() {
  return __cxx_static_address_c5f3e081c714d06b2051d837.reference || (__cxx_static_address_c5f3e081c714d06b2051d837.reference = {
    __cReference: true,
    get value() { return BOTTLE5____header_global_926d226f510286a1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:450
export const BOTTLE6____header_global_980381dac3e1a431 = ((((((1013) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0762c651074530014deb8027() {
  return __cxx_static_address_0762c651074530014deb8027.reference || (__cxx_static_address_0762c651074530014deb8027.reference = {
    __cReference: true,
    get value() { return BOTTLE6____header_global_980381dac3e1a431; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:451
export const BOTTLE8____header_global_cbb3fcf24b677006 = ((((((1014) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6e706fc8c49678948e5fbcae() {
  return __cxx_static_address_6e706fc8c49678948e5fbcae.reference || (__cxx_static_address_6e706fc8c49678948e5fbcae.reference = {
    __cReference: true,
    get value() { return BOTTLE8____header_global_cbb3fcf24b677006; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:452
export const SPOTLITE____header_global_070f832ac55430e6 = ((((((1020) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f70a0a1c1d414bdd0a85eaf1() {
  return __cxx_static_address_f70a0a1c1d414bdd0a85eaf1.reference || (__cxx_static_address_f70a0a1c1d414bdd0a85eaf1.reference = {
    __cReference: true,
    get value() { return SPOTLITE____header_global_070f832ac55430e6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:453
export const MASKWALL15____header_global_a0da9b3050e4caf2 = ((((((1024) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fcb7bd6e55e8455a49f562db() {
  return __cxx_static_address_fcb7bd6e55e8455a49f562db.reference || (__cxx_static_address_fcb7bd6e55e8455a49f562db.reference = {
    __cReference: true,
    get value() { return MASKWALL15____header_global_a0da9b3050e4caf2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:454
export const BOTTLE7____header_global_91c78cc79bf51237 = ((((((1025) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1d6d89cd96753fe64786e339() {
  return __cxx_static_address_1d6d89cd96753fe64786e339.reference || (__cxx_static_address_1d6d89cd96753fe64786e339.reference = {
    __cReference: true,
    get value() { return BOTTLE7____header_global_91c78cc79bf51237; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:455
export const HORSEONSIDE____header_global_7b2e254eafde8fa4 = ((((((1026) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_10ad888dfe6cefe602f50e50() {
  return __cxx_static_address_10ad888dfe6cefe602f50e50.reference || (__cxx_static_address_10ad888dfe6cefe602f50e50.reference = {
    __cReference: true,
    get value() { return HORSEONSIDE____header_global_7b2e254eafde8fa4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:456
export const GLASSPIECES____header_global_0afc781f9c51a383 = ((((((1031) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6260744cee0e3f401b412c13() {
  return __cxx_static_address_6260744cee0e3f401b412c13.reference || (__cxx_static_address_6260744cee0e3f401b412c13.reference = {
    __cReference: true,
    get value() { return GLASSPIECES____header_global_0afc781f9c51a383; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:457
export const NEON6____header_global_ab6a152a911075cf = ((((((1046) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bc29bb11c71d921cb899de92() {
  return __cxx_static_address_bc29bb11c71d921cb899de92.reference || (__cxx_static_address_bc29bb11c71d921cb899de92.reference = {
    __cReference: true,
    get value() { return NEON6____header_global_ab6a152a911075cf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:458
export const MASKWALL6____header_global_7cf79799d2765f7e = ((((((1059) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5dc1f8eb5217e41f18ebc608() {
  return __cxx_static_address_5dc1f8eb5217e41f18ebc608.reference || (__cxx_static_address_5dc1f8eb5217e41f18ebc608.reference = {
    __cReference: true,
    get value() { return MASKWALL6____header_global_7cf79799d2765f7e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:459
export const RUBBERCAN____header_global_217654a34ddbed47 = ((((((1062) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_51de1068ca88314883847707() {
  return __cxx_static_address_51de1068ca88314883847707.reference || (__cxx_static_address_51de1068ca88314883847707.reference = {
    __cReference: true,
    get value() { return RUBBERCAN____header_global_217654a34ddbed47; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:460
export const PLUG____header_global_fca27db94ce430cb = ((((((1069) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3a98c7af6305740aa33cc730() {
  return __cxx_static_address_3a98c7af6305740aa33cc730.reference || (__cxx_static_address_3a98c7af6305740aa33cc730.reference = {
    __cReference: true,
    get value() { return PLUG____header_global_fca27db94ce430cb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:461
export const OOZFILTER____header_global_68f67881b352c05c = ((((((1079) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5c65bf85ba63ed309cf8e6d1() {
  return __cxx_static_address_5c65bf85ba63ed309cf8e6d1.reference || (__cxx_static_address_5c65bf85ba63ed309cf8e6d1.reference = {
    __cReference: true,
    get value() { return OOZFILTER____header_global_68f67881b352c05c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:462
export const FLOORPLASMA____header_global_b2dfe842f5c1e190 = ((((((1082) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_468d266151f140fe020e5a78() {
  return __cxx_static_address_468d266151f140fe020e5a78.reference || (__cxx_static_address_468d266151f140fe020e5a78.reference = {
    __cReference: true,
    get value() { return FLOORPLASMA____header_global_b2dfe842f5c1e190; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:463
export const REACTOR____header_global_7e86f7150f849107 = ((((((1088) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dbb0f635c2f04748e14557e2() {
  return __cxx_static_address_dbb0f635c2f04748e14557e2.reference || (__cxx_static_address_dbb0f635c2f04748e14557e2.reference = {
    __cReference: true,
    get value() { return REACTOR____header_global_7e86f7150f849107; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:464
export const REACTORSPARK____header_global_03838da7ef7eff88 = ((((((1092) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_17e06b5b04bff56dcc48b060() {
  return __cxx_static_address_17e06b5b04bff56dcc48b060.reference || (__cxx_static_address_17e06b5b04bff56dcc48b060.reference = {
    __cReference: true,
    get value() { return REACTORSPARK____header_global_03838da7ef7eff88; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:465
export const REACTORBURNT____header_global_df9161aceb633168 = ((((((1096) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_00559280bc9ce1480992cec9() {
  return __cxx_static_address_00559280bc9ce1480992cec9.reference || (__cxx_static_address_00559280bc9ce1480992cec9.reference = {
    __cReference: true,
    get value() { return REACTORBURNT____header_global_df9161aceb633168; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:466
export const DOORTILE15____header_global_b6eea5e5e094735b = ((((((1102) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ea44c8a45b05d67049f02038() {
  return __cxx_static_address_ea44c8a45b05d67049f02038.reference || (__cxx_static_address_ea44c8a45b05d67049f02038.reference = {
    __cReference: true,
    get value() { return DOORTILE15____header_global_b6eea5e5e094735b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:467
export const HANDSWITCH____header_global_bc7256506905100b = ((((((1111) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a75fa4423230b7fe8e1f1017() {
  return __cxx_static_address_a75fa4423230b7fe8e1f1017.reference || (__cxx_static_address_a75fa4423230b7fe8e1f1017.reference = {
    __cReference: true,
    get value() { return HANDSWITCH____header_global_bc7256506905100b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:468
export const CIRCLEPANNEL____header_global_4ef9d80000f6daa6 = ((((((1113) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_610addf81d831cfb5b17c254() {
  return __cxx_static_address_610addf81d831cfb5b17c254.reference || (__cxx_static_address_610addf81d831cfb5b17c254.reference = {
    __cReference: true,
    get value() { return CIRCLEPANNEL____header_global_4ef9d80000f6daa6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:469
export const CIRCLEPANNELBROKE____header_global_44e080e80eed0399 = ((((((1114) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1c7ef464606794411ea56fed() {
  return __cxx_static_address_1c7ef464606794411ea56fed.reference || (__cxx_static_address_1c7ef464606794411ea56fed.reference = {
    __cReference: true,
    get value() { return CIRCLEPANNELBROKE____header_global_44e080e80eed0399; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:470
export const PULLSWITCH____header_global_803958899d76905b = ((((((1122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e893cee05b0b6c9181a58caf() {
  return __cxx_static_address_e893cee05b0b6c9181a58caf.reference || (__cxx_static_address_e893cee05b0b6c9181a58caf.reference = {
    __cReference: true,
    get value() { return PULLSWITCH____header_global_803958899d76905b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:471
export const MASKWALL8____header_global_a0c1846bcdbe54a0 = ((((((1124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7aacef0e79528fc7c2f20cde() {
  return __cxx_static_address_7aacef0e79528fc7c2f20cde.reference || (__cxx_static_address_7aacef0e79528fc7c2f20cde.reference = {
    __cReference: true,
    get value() { return MASKWALL8____header_global_a0c1846bcdbe54a0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:472
export const BIGHOLE____header_global_fd95752a0da58893 = ((((((1141) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_484e8ffa02857f10aff405a0() {
  return __cxx_static_address_484e8ffa02857f10aff405a0.reference || (__cxx_static_address_484e8ffa02857f10aff405a0.reference = {
    __cReference: true,
    get value() { return BIGHOLE____header_global_fd95752a0da58893; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:473
export const ALIENSWITCH____header_global_e4854c935f610ef2 = ((((((1142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7610ffc909c256b03dd414da() {
  return __cxx_static_address_7610ffc909c256b03dd414da.reference || (__cxx_static_address_7610ffc909c256b03dd414da.reference = {
    __cReference: true,
    get value() { return ALIENSWITCH____header_global_e4854c935f610ef2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:474
export const DOORTILE21____header_global_07a145cf98ab00de = ((((((1144) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_16d46532de99ed7f206b89e8() {
  return __cxx_static_address_16d46532de99ed7f206b89e8.reference || (__cxx_static_address_16d46532de99ed7f206b89e8.reference = {
    __cReference: true,
    get value() { return DOORTILE21____header_global_07a145cf98ab00de; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:475
export const HANDPRINTSWITCH____header_global_74c9a06aa6b4a508 = ((((((1155) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d609de0233c2303be5b5e653() {
  return __cxx_static_address_d609de0233c2303be5b5e653.reference || (__cxx_static_address_d609de0233c2303be5b5e653.reference = {
    __cReference: true,
    get value() { return HANDPRINTSWITCH____header_global_74c9a06aa6b4a508; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:476
export const BOTTLE10____header_global_0c875b1723092706 = ((((((1157) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_62d3b766702b7892693e3d41() {
  return __cxx_static_address_62d3b766702b7892693e3d41.reference || (__cxx_static_address_62d3b766702b7892693e3d41.reference = {
    __cReference: true,
    get value() { return BOTTLE10____header_global_0c875b1723092706; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:477
export const BOTTLE11____header_global_19a5f7d5ef41732a = ((((((1158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_94fb4e57781c3b895f1e9977() {
  return __cxx_static_address_94fb4e57781c3b895f1e9977.reference || (__cxx_static_address_94fb4e57781c3b895f1e9977.reference = {
    __cReference: true,
    get value() { return BOTTLE11____header_global_19a5f7d5ef41732a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:478
export const BOTTLE12____header_global_e1cd43d375a843b5 = ((((((1159) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_32780b193bcc77216f8b1ac8() {
  return __cxx_static_address_32780b193bcc77216f8b1ac8.reference || (__cxx_static_address_32780b193bcc77216f8b1ac8.reference = {
    __cReference: true,
    get value() { return BOTTLE12____header_global_e1cd43d375a843b5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:479
export const BOTTLE13____header_global_d8ee8b318c058055 = ((((((1160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_449f24a9bcb41ebb9c5f7a2c() {
  return __cxx_static_address_449f24a9bcb41ebb9c5f7a2c.reference || (__cxx_static_address_449f24a9bcb41ebb9c5f7a2c.reference = {
    __cReference: true,
    get value() { return BOTTLE13____header_global_d8ee8b318c058055; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:480
export const BOTTLE14____header_global_050bdfde4d9f5e12 = ((((((1161) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_352e72f822372469e11561bf() {
  return __cxx_static_address_352e72f822372469e11561bf.reference || (__cxx_static_address_352e72f822372469e11561bf.reference = {
    __cReference: true,
    get value() { return BOTTLE14____header_global_050bdfde4d9f5e12; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:481
export const BOTTLE15____header_global_aba8686bae9b5d5e = ((((((1162) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_72cef319a8e6f78c376834fd() {
  return __cxx_static_address_72cef319a8e6f78c376834fd.reference || (__cxx_static_address_72cef319a8e6f78c376834fd.reference = {
    __cReference: true,
    get value() { return BOTTLE15____header_global_aba8686bae9b5d5e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:482
export const BOTTLE16____header_global_7c504ef0e3894294 = ((((((1163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b66c998b4bd2a289c89edc65() {
  return __cxx_static_address_b66c998b4bd2a289c89edc65.reference || (__cxx_static_address_b66c998b4bd2a289c89edc65.reference = {
    __cReference: true,
    get value() { return BOTTLE16____header_global_7c504ef0e3894294; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:483
export const BOTTLE17____header_global_0886059cb446cb34 = ((((((1164) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7828b3c9817b87c29b19ff96() {
  return __cxx_static_address_7828b3c9817b87c29b19ff96.reference || (__cxx_static_address_7828b3c9817b87c29b19ff96.reference = {
    __cReference: true,
    get value() { return BOTTLE17____header_global_0886059cb446cb34; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:484
export const BOTTLE18____header_global_b621595c41f9ab89 = ((((((1165) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c081a0576e1abcc0f46b0756() {
  return __cxx_static_address_c081a0576e1abcc0f46b0756.reference || (__cxx_static_address_c081a0576e1abcc0f46b0756.reference = {
    __cReference: true,
    get value() { return BOTTLE18____header_global_b621595c41f9ab89; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:485
export const BOTTLE19____header_global_d6a65a6da5200cc0 = ((((((1166) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cf221451ffa7018b8658f55c() {
  return __cxx_static_address_cf221451ffa7018b8658f55c.reference || (__cxx_static_address_cf221451ffa7018b8658f55c.reference = {
    __cReference: true,
    get value() { return BOTTLE19____header_global_d6a65a6da5200cc0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:486
export const DOORTILE17____header_global_12a72ba3942cfd20 = ((((((1169) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b90592ff1e99c91c73515ab0() {
  return __cxx_static_address_b90592ff1e99c91c73515ab0.reference || (__cxx_static_address_b90592ff1e99c91c73515ab0.reference = {
    __cReference: true,
    get value() { return DOORTILE17____header_global_12a72ba3942cfd20; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:487
export const MASKWALL7____header_global_cd8d964fdeb63f2c = ((((((1174) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5483ec577f5ba757eec24e5b() {
  return __cxx_static_address_5483ec577f5ba757eec24e5b.reference || (__cxx_static_address_5483ec577f5ba757eec24e5b.reference = {
    __cReference: true,
    get value() { return MASKWALL7____header_global_cd8d964fdeb63f2c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:488
export const DOORTILE11____header_global_a360b82b123d54c0 = ((((((1178) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_799882158ab0478df29eb855() {
  return __cxx_static_address_799882158ab0478df29eb855.reference || (__cxx_static_address_799882158ab0478df29eb855.reference = {
    __cReference: true,
    get value() { return DOORTILE11____header_global_a360b82b123d54c0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:489
export const DOORTILE12____header_global_b1c74a954a276e54 = ((((((1179) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_70714ae96093ad0e1f559cae() {
  return __cxx_static_address_70714ae96093ad0e1f559cae.reference || (__cxx_static_address_70714ae96093ad0e1f559cae.reference = {
    __cReference: true,
    get value() { return DOORTILE12____header_global_b1c74a954a276e54; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:490
export const VENDMACHINE____header_global_f670a06b5b6505e8 = ((((((1212) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_939d3f76ab493678f0c62eaa() {
  return __cxx_static_address_939d3f76ab493678f0c62eaa.reference || (__cxx_static_address_939d3f76ab493678f0c62eaa.reference = {
    __cReference: true,
    get value() { return VENDMACHINE____header_global_f670a06b5b6505e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:491
export const COLAMACHINE____header_global_ea8e85573b8f5fad = ((((((1215) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_af72f8b83f8c1ad3577e5edd() {
  return __cxx_static_address_af72f8b83f8c1ad3577e5edd.reference || (__cxx_static_address_af72f8b83f8c1ad3577e5edd.reference = {
    __cReference: true,
    get value() { return COLAMACHINE____header_global_ea8e85573b8f5fad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:492
export const CRANEPOLE____header_global_bec49e4c3996bcc7 = ((((((1221) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_21048162219f8ee16fdcf73b() {
  return __cxx_static_address_21048162219f8ee16fdcf73b.reference || (__cxx_static_address_21048162219f8ee16fdcf73b.reference = {
    __cReference: true,
    get value() { return CRANEPOLE____header_global_bec49e4c3996bcc7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:493
export const CRANE____header_global_099ada985d40e14b = ((((((1222) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_654ab6286c8f9db7c0bfb3d1() {
  return __cxx_static_address_654ab6286c8f9db7c0bfb3d1.reference || (__cxx_static_address_654ab6286c8f9db7c0bfb3d1.reference = {
    __cReference: true,
    get value() { return CRANE____header_global_099ada985d40e14b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:494
export const BARBROKE____header_global_72238c5af6bd8b5d = ((((((1225) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_75a8c2c685e9e6bfc80d86d8() {
  return __cxx_static_address_75a8c2c685e9e6bfc80d86d8.reference || (__cxx_static_address_75a8c2c685e9e6bfc80d86d8.reference = {
    __cReference: true,
    get value() { return BARBROKE____header_global_72238c5af6bd8b5d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:495
export const BLOODPOOL____header_global_c9e82828bbaceba3 = ((((((1226) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_05c70e9026c5dd2c629fe4d7() {
  return __cxx_static_address_05c70e9026c5dd2c629fe4d7.reference || (__cxx_static_address_05c70e9026c5dd2c629fe4d7.reference = {
    __cReference: true,
    get value() { return BLOODPOOL____header_global_c9e82828bbaceba3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:496
export const NUKEBARREL____header_global_1f161bc2e91c7717 = ((((((1227) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_60d221e3d927bc7540bd649c() {
  return __cxx_static_address_60d221e3d927bc7540bd649c.reference || (__cxx_static_address_60d221e3d927bc7540bd649c.reference = {
    __cReference: true,
    get value() { return NUKEBARREL____header_global_1f161bc2e91c7717; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:497
export const NUKEBARRELDENTED____header_global_c77fd27ee14ca9b7 = ((((((1228) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_df90cd30ba082a952ca87193() {
  return __cxx_static_address_df90cd30ba082a952ca87193.reference || (__cxx_static_address_df90cd30ba082a952ca87193.reference = {
    __cReference: true,
    get value() { return NUKEBARRELDENTED____header_global_c77fd27ee14ca9b7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:498
export const NUKEBARRELLEAKED____header_global_b098c22ee26c1a68 = ((((((1229) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_800921b65e7640046bd17ce3() {
  return __cxx_static_address_800921b65e7640046bd17ce3.reference || (__cxx_static_address_800921b65e7640046bd17ce3.reference = {
    __cReference: true,
    get value() { return NUKEBARRELLEAKED____header_global_b098c22ee26c1a68; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:499
export const CANWITHSOMETHING____header_global_733bfa28813c3ab5 = ((((((1232) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_507625aeb74a11a70fdf7244() {
  return __cxx_static_address_507625aeb74a11a70fdf7244.reference || (__cxx_static_address_507625aeb74a11a70fdf7244.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING____header_global_733bfa28813c3ab5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:500
export const MONEY____header_global_bd7cf82244d52c6c = ((((((1233) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_298e738801e8ed7486a417be() {
  return __cxx_static_address_298e738801e8ed7486a417be.reference || (__cxx_static_address_298e738801e8ed7486a417be.reference = {
    __cReference: true,
    get value() { return MONEY____header_global_bd7cf82244d52c6c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:501
export const BANNER____header_global_7ee56a09df65bc7d = ((((((1236) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cb31b3e0e960369eb2048477() {
  return __cxx_static_address_cb31b3e0e960369eb2048477.reference || (__cxx_static_address_cb31b3e0e960369eb2048477.reference = {
    __cReference: true,
    get value() { return BANNER____header_global_7ee56a09df65bc7d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:502
export const EXPLODINGBARREL____header_global_9ed789abc8123af1 = ((((((1238) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6cfd6b68b1cf47bd1227e378() {
  return __cxx_static_address_6cfd6b68b1cf47bd1227e378.reference || (__cxx_static_address_6cfd6b68b1cf47bd1227e378.reference = {
    __cReference: true,
    get value() { return EXPLODINGBARREL____header_global_9ed789abc8123af1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:503
export const EXPLODINGBARREL2____header_global_79a52d9567bfb196 = ((((((1239) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7744f1812b6ba21427a4e55a() {
  return __cxx_static_address_7744f1812b6ba21427a4e55a.reference || (__cxx_static_address_7744f1812b6ba21427a4e55a.reference = {
    __cReference: true,
    get value() { return EXPLODINGBARREL2____header_global_79a52d9567bfb196; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:504
export const FIREBARREL____header_global_7993b25b361c378f = ((((((1240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3d14cd08343c5885779a1f14() {
  return __cxx_static_address_3d14cd08343c5885779a1f14.reference || (__cxx_static_address_3d14cd08343c5885779a1f14.reference = {
    __cReference: true,
    get value() { return FIREBARREL____header_global_7993b25b361c378f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:505
export const SEENINE____header_global_6ea71edf6b857a82 = ((((((1247) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cbdca9bf4d2d25de340ea57a() {
  return __cxx_static_address_cbdca9bf4d2d25de340ea57a.reference || (__cxx_static_address_cbdca9bf4d2d25de340ea57a.reference = {
    __cReference: true,
    get value() { return SEENINE____header_global_6ea71edf6b857a82; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:506
export const SEENINEDEAD____header_global_dd3388a5d1bb7a5a = ((((((1248) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_08abf8eb56ab170afe28440b() {
  return __cxx_static_address_08abf8eb56ab170afe28440b.reference || (__cxx_static_address_08abf8eb56ab170afe28440b.reference = {
    __cReference: true,
    get value() { return SEENINEDEAD____header_global_dd3388a5d1bb7a5a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:507
export const STEAM____header_global_e884fc9dd93ee5a2 = ((((((1250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_047456df065d548d15e01979() {
  return __cxx_static_address_047456df065d548d15e01979.reference || (__cxx_static_address_047456df065d548d15e01979.reference = {
    __cReference: true,
    get value() { return STEAM____header_global_e884fc9dd93ee5a2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:508
export const CEILINGSTEAM____header_global_dfcc1455cf385c10 = ((((((1255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_884ccb41fc0684ff01d6fc70() {
  return __cxx_static_address_884ccb41fc0684ff01d6fc70.reference || (__cxx_static_address_884ccb41fc0684ff01d6fc70.reference = {
    __cReference: true,
    get value() { return CEILINGSTEAM____header_global_dfcc1455cf385c10; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:509
export const PIPE6B____header_global_cbc22aeeaa83e51c = ((((((1260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eefb6cc9e4570817b13304f9() {
  return __cxx_static_address_eefb6cc9e4570817b13304f9.reference || (__cxx_static_address_eefb6cc9e4570817b13304f9.reference = {
    __cReference: true,
    get value() { return PIPE6B____header_global_cbc22aeeaa83e51c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:510
export const TRANSPORTERBEAM____header_global_5a64c0227b9cbf48 = ((((((1261) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_845a33f387508b5c165f05d6() {
  return __cxx_static_address_845a33f387508b5c165f05d6.reference || (__cxx_static_address_845a33f387508b5c165f05d6.reference = {
    __cReference: true,
    get value() { return TRANSPORTERBEAM____header_global_5a64c0227b9cbf48; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:511
export const RAT____header_global_67383199e64b40aa = ((((((1267) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f804b666d64c62dbf5f89eac() {
  return __cxx_static_address_f804b666d64c62dbf5f89eac.reference || (__cxx_static_address_f804b666d64c62dbf5f89eac.reference = {
    __cReference: true,
    get value() { return RAT____header_global_67383199e64b40aa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:512
export const TRASH____header_global_8ad994dcaf687f30 = ((((((1272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5a59bf6a74af64b6c6b85b7e() {
  return __cxx_static_address_5a59bf6a74af64b6c6b85b7e.reference || (__cxx_static_address_5a59bf6a74af64b6c6b85b7e.reference = {
    __cReference: true,
    get value() { return TRASH____header_global_8ad994dcaf687f30; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:513
export const FEMPIC1____header_global_d5b952ced5f801f7 = ((((((1280) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0c147939ca3a0c1289c48070() {
  return __cxx_static_address_0c147939ca3a0c1289c48070.reference || (__cxx_static_address_0c147939ca3a0c1289c48070.reference = {
    __cReference: true,
    get value() { return FEMPIC1____header_global_d5b952ced5f801f7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:514
export const FEMPIC2____header_global_538d45e83eeb27f5 = ((((((1289) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_787b26354a5b2346c36e9463() {
  return __cxx_static_address_787b26354a5b2346c36e9463.reference || (__cxx_static_address_787b26354a5b2346c36e9463.reference = {
    __cReference: true,
    get value() { return FEMPIC2____header_global_538d45e83eeb27f5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:515
export const BLANKSCREEN____header_global_8ecb8e5ce7bc8283 = ((((((1293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_650c7b26357c602d90166576() {
  return __cxx_static_address_650c7b26357c602d90166576.reference || (__cxx_static_address_650c7b26357c602d90166576.reference = {
    __cReference: true,
    get value() { return BLANKSCREEN____header_global_8ecb8e5ce7bc8283; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:516
export const PODFEM1____header_global_973b3b96f6939593 = ((((((1294) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bca304915142e33e401ac266() {
  return __cxx_static_address_bca304915142e33e401ac266.reference || (__cxx_static_address_bca304915142e33e401ac266.reference = {
    __cReference: true,
    get value() { return PODFEM1____header_global_973b3b96f6939593; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:517
export const FEMPIC3____header_global_d842f10834c33046 = ((((((1298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e9308be9cbc1f196e4090ff() {
  return __cxx_static_address_1e9308be9cbc1f196e4090ff.reference || (__cxx_static_address_1e9308be9cbc1f196e4090ff.reference = {
    __cReference: true,
    get value() { return FEMPIC3____header_global_d842f10834c33046; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:518
export const FEMPIC4____header_global_be8a8e6312fb2ad4 = ((((((1306) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3afa088c80fc9aa2e759c473() {
  return __cxx_static_address_3afa088c80fc9aa2e759c473.reference || (__cxx_static_address_3afa088c80fc9aa2e759c473.reference = {
    __cReference: true,
    get value() { return FEMPIC4____header_global_be8a8e6312fb2ad4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:519
export const FEM1____header_global_27eedba8d996f656 = ((((((1312) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_679ea148e54338742e029a1b() {
  return __cxx_static_address_679ea148e54338742e029a1b.reference || (__cxx_static_address_679ea148e54338742e029a1b.reference = {
    __cReference: true,
    get value() { return FEM1____header_global_27eedba8d996f656; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:520
export const FEM2____header_global_1d120e38879459b5 = ((((((1317) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_51764e1e7c599310b83174c7() {
  return __cxx_static_address_51764e1e7c599310b83174c7.reference || (__cxx_static_address_51764e1e7c599310b83174c7.reference = {
    __cReference: true,
    get value() { return FEM2____header_global_1d120e38879459b5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:521
export const FEM3____header_global_3cab4af3dcce699f = ((((((1321) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_038f104ad2e6eda24c39100d() {
  return __cxx_static_address_038f104ad2e6eda24c39100d.reference || (__cxx_static_address_038f104ad2e6eda24c39100d.reference = {
    __cReference: true,
    get value() { return FEM3____header_global_3cab4af3dcce699f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:522
export const FEM5____header_global_eb3dca240e2ce023 = ((((((1323) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6abd874dbcad3a92fb43f948() {
  return __cxx_static_address_6abd874dbcad3a92fb43f948.reference || (__cxx_static_address_6abd874dbcad3a92fb43f948.reference = {
    __cReference: true,
    get value() { return FEM5____header_global_eb3dca240e2ce023; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:523
export const BLOODYPOLE____header_global_4425b7df83bde1b6 = ((((((1324) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dedffdc4ca315d9577d5298d() {
  return __cxx_static_address_dedffdc4ca315d9577d5298d.reference || (__cxx_static_address_dedffdc4ca315d9577d5298d.reference = {
    __cReference: true,
    get value() { return BLOODYPOLE____header_global_4425b7df83bde1b6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:524
export const FEM4____header_global_835fac9b8b539db8 = ((((((1325) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a095cb5831ce21fa1dcf9e2c() {
  return __cxx_static_address_a095cb5831ce21fa1dcf9e2c.reference || (__cxx_static_address_a095cb5831ce21fa1dcf9e2c.reference = {
    __cReference: true,
    get value() { return FEM4____header_global_835fac9b8b539db8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:525
export const FEM6____header_global_bac938d13bc955a9 = ((((((1334) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_377124e626861ddc78aedc44() {
  return __cxx_static_address_377124e626861ddc78aedc44.reference || (__cxx_static_address_377124e626861ddc78aedc44.reference = {
    __cReference: true,
    get value() { return FEM6____header_global_bac938d13bc955a9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:526
export const FEM6PAD____header_global_84c8e932bf78fac9 = ((((((1335) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8c4b6cadda643658c9bea6ef() {
  return __cxx_static_address_8c4b6cadda643658c9bea6ef.reference || (__cxx_static_address_8c4b6cadda643658c9bea6ef.reference = {
    __cReference: true,
    get value() { return FEM6PAD____header_global_84c8e932bf78fac9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:527
export const FEM8____header_global_ffdbac2e79dc7243 = ((((((1336) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3bdf8055011d31c47b0c6934() {
  return __cxx_static_address_3bdf8055011d31c47b0c6934.reference || (__cxx_static_address_3bdf8055011d31c47b0c6934.reference = {
    __cReference: true,
    get value() { return FEM8____header_global_ffdbac2e79dc7243; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:528
export const HELECOPT____header_global_00772c2f850d981f = ((((((1346) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8829de963b2a0cbc379a1c75() {
  return __cxx_static_address_8829de963b2a0cbc379a1c75.reference || (__cxx_static_address_8829de963b2a0cbc379a1c75.reference = {
    __cReference: true,
    get value() { return HELECOPT____header_global_00772c2f850d981f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:529
export const FETUSJIB____header_global_d5a2558d32cd1ea9 = ((((((1347) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e287b2cadcd11828c69c01c1() {
  return __cxx_static_address_e287b2cadcd11828c69c01c1.reference || (__cxx_static_address_e287b2cadcd11828c69c01c1.reference = {
    __cReference: true,
    get value() { return FETUSJIB____header_global_d5a2558d32cd1ea9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:530
export const HOLODUKE____header_global_73c798634fb8b1a0 = ((((((1348) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_76fad40845a6809015cebeb9() {
  return __cxx_static_address_76fad40845a6809015cebeb9.reference || (__cxx_static_address_76fad40845a6809015cebeb9.reference = {
    __cReference: true,
    get value() { return HOLODUKE____header_global_73c798634fb8b1a0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:531
export const SPACEMARINE____header_global_cd401ea4ac2f3698 = ((((((1353) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_80eff7896246b877b0a022b5() {
  return __cxx_static_address_80eff7896246b877b0a022b5.reference || (__cxx_static_address_80eff7896246b877b0a022b5.reference = {
    __cReference: true,
    get value() { return SPACEMARINE____header_global_cd401ea4ac2f3698; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:532
export const INDY____header_global_9f933f00334b0a84 = ((((((1355) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_60cfe0f8e78fa426e702beb2() {
  return __cxx_static_address_60cfe0f8e78fa426e702beb2.reference || (__cxx_static_address_60cfe0f8e78fa426e702beb2.reference = {
    __cReference: true,
    get value() { return INDY____header_global_9f933f00334b0a84; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:533
export const FETUS____header_global_ca006c917311191d = ((((((1358) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5bd28d8bd719c414388379b3() {
  return __cxx_static_address_5bd28d8bd719c414388379b3.reference || (__cxx_static_address_5bd28d8bd719c414388379b3.reference = {
    __cReference: true,
    get value() { return FETUS____header_global_ca006c917311191d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:534
export const FETUSBROKE____header_global_14ac7cefb5e9f77e = ((((((1359) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3ea8814fd739b2f671dd4ede() {
  return __cxx_static_address_3ea8814fd739b2f671dd4ede.reference || (__cxx_static_address_3ea8814fd739b2f671dd4ede.reference = {
    __cReference: true,
    get value() { return FETUSBROKE____header_global_14ac7cefb5e9f77e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:535
export const MONK____header_global_dd652602a4fdef57 = ((((((1352) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fa350ef675af7986f5f90d3a() {
  return __cxx_static_address_fa350ef675af7986f5f90d3a.reference || (__cxx_static_address_fa350ef675af7986f5f90d3a.reference = {
    __cReference: true,
    get value() { return MONK____header_global_dd652602a4fdef57; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:536
export const LUKE____header_global_4acd86c1a5b03331 = ((((((1354) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3b53c5c011b84ee46c172261() {
  return __cxx_static_address_3b53c5c011b84ee46c172261.reference || (__cxx_static_address_3b53c5c011b84ee46c172261.reference = {
    __cReference: true,
    get value() { return LUKE____header_global_4acd86c1a5b03331; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:537
export const COOLEXPLOSION1____header_global_99b7f169de46e50e = ((((((1360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_53f6dd8610667c4bf5210584() {
  return __cxx_static_address_53f6dd8610667c4bf5210584.reference || (__cxx_static_address_53f6dd8610667c4bf5210584.reference = {
    __cReference: true,
    get value() { return COOLEXPLOSION1____header_global_99b7f169de46e50e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:538
export const WATERSPLASH2____header_global_417af0abfbc7342b = ((((((1380) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aa683b720ff94acbf29f11c6() {
  return __cxx_static_address_aa683b720ff94acbf29f11c6.reference || (__cxx_static_address_aa683b720ff94acbf29f11c6.reference = {
    __cReference: true,
    get value() { return WATERSPLASH2____header_global_417af0abfbc7342b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:539
export const FIREVASE____header_global_414420ea7add2c6b = ((((((1390) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f8f3ca61bbd42a0d251eeed2() {
  return __cxx_static_address_f8f3ca61bbd42a0d251eeed2.reference || (__cxx_static_address_f8f3ca61bbd42a0d251eeed2.reference = {
    __cReference: true,
    get value() { return FIREVASE____header_global_414420ea7add2c6b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:540
export const FEM7____header_global_9ab5684374d49224 = ((((((1395) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_31572cfe96d099de78e63211() {
  return __cxx_static_address_31572cfe96d099de78e63211.reference || (__cxx_static_address_31572cfe96d099de78e63211.reference = {
    __cReference: true,
    get value() { return FEM7____header_global_9ab5684374d49224; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:541
export const APLAYERTOP____header_global_9762e58b045bf77b = ((((((1400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2b2bca8a1c945925b480a7ee() {
  return __cxx_static_address_2b2bca8a1c945925b480a7ee.reference || (__cxx_static_address_2b2bca8a1c945925b480a7ee.reference = {
    __cReference: true,
    get value() { return APLAYERTOP____header_global_9762e58b045bf77b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:542
export const APLAYER____header_global_7fa03963cde7e19a = ((((((1405) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e552ca79f42393daa943e47() {
  return __cxx_static_address_1e552ca79f42393daa943e47.reference || (__cxx_static_address_1e552ca79f42393daa943e47.reference = {
    __cReference: true,
    get value() { return APLAYER____header_global_7fa03963cde7e19a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:543
export const PLAYERONWATER____header_global_493a8bf2d447a726 = ((((((1420) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0075727c9a6b54b825b8b8e9() {
  return __cxx_static_address_0075727c9a6b54b825b8b8e9.reference || (__cxx_static_address_0075727c9a6b54b825b8b8e9.reference = {
    __cReference: true,
    get value() { return PLAYERONWATER____header_global_493a8bf2d447a726; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:544
export const DUKELYINGDEAD____header_global_ff9a46a5b52aa368 = ((((((1518) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4632122d26dfdd8a2af6aac4() {
  return __cxx_static_address_4632122d26dfdd8a2af6aac4.reference || (__cxx_static_address_4632122d26dfdd8a2af6aac4.reference = {
    __cReference: true,
    get value() { return DUKELYINGDEAD____header_global_ff9a46a5b52aa368; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:545
export const DUKETORSO____header_global_c734f2fd9c2b4b79 = ((((((1520) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6773dea631ee0ec3b29d4a88() {
  return __cxx_static_address_6773dea631ee0ec3b29d4a88.reference || (__cxx_static_address_6773dea631ee0ec3b29d4a88.reference = {
    __cReference: true,
    get value() { return DUKETORSO____header_global_c734f2fd9c2b4b79; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:546
export const DUKEGUN____header_global_b7f034dca73ce20a = ((((((1528) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e3efeeb1076ad2870b9be58c() {
  return __cxx_static_address_e3efeeb1076ad2870b9be58c.reference || (__cxx_static_address_e3efeeb1076ad2870b9be58c.reference = {
    __cReference: true,
    get value() { return DUKEGUN____header_global_b7f034dca73ce20a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:547
export const DUKELEG____header_global_49da611820b310d8 = ((((((1536) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_04b9d0682558aa7d346c24d5() {
  return __cxx_static_address_04b9d0682558aa7d346c24d5.reference || (__cxx_static_address_04b9d0682558aa7d346c24d5.reference = {
    __cReference: true,
    get value() { return DUKELEG____header_global_49da611820b310d8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:548
export const SHARK____header_global_efaaadf17d6b4ef9 = ((((((1550) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c4964ce7066ab8d7e9cb110d() {
  return __cxx_static_address_c4964ce7066ab8d7e9cb110d.reference || (__cxx_static_address_c4964ce7066ab8d7e9cb110d.reference = {
    __cReference: true,
    get value() { return SHARK____header_global_efaaadf17d6b4ef9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:549
export const BLOOD____header_global_f397f16213f2a2e5 = ((((((1620) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_932743c741d35a0e665c7b57() {
  return __cxx_static_address_932743c741d35a0e665c7b57.reference || (__cxx_static_address_932743c741d35a0e665c7b57.reference = {
    __cReference: true,
    get value() { return BLOOD____header_global_f397f16213f2a2e5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:550
export const FIRELASER____header_global_e0f500809cd8bb20 = ((((((1625) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ba70b23ca945c5ab8e9800c6() {
  return __cxx_static_address_ba70b23ca945c5ab8e9800c6.reference || (__cxx_static_address_ba70b23ca945c5ab8e9800c6.reference = {
    __cReference: true,
    get value() { return FIRELASER____header_global_e0f500809cd8bb20; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:551
export const TRANSPORTERSTAR____header_global_05630c3c0fd829f6 = ((((((1630) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5d988cdcf37e9dcaa40c2607() {
  return __cxx_static_address_5d988cdcf37e9dcaa40c2607.reference || (__cxx_static_address_5d988cdcf37e9dcaa40c2607.reference = {
    __cReference: true,
    get value() { return TRANSPORTERSTAR____header_global_05630c3c0fd829f6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:552
export const SPIT____header_global_69f8cd6ba0d2a04e = ((((((1636) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7605f9ebe25500c80858c0d3() {
  return __cxx_static_address_7605f9ebe25500c80858c0d3.reference || (__cxx_static_address_7605f9ebe25500c80858c0d3.reference = {
    __cReference: true,
    get value() { return SPIT____header_global_69f8cd6ba0d2a04e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:553
export const LOOGIE____header_global_edd7e004ff66ceb3 = ((((((1637) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4e6857456977802ce1df331b() {
  return __cxx_static_address_4e6857456977802ce1df331b.reference || (__cxx_static_address_4e6857456977802ce1df331b.reference = {
    __cReference: true,
    get value() { return LOOGIE____header_global_edd7e004ff66ceb3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:554
export const FIST____header_global_1fdaf0f16e9193e2 = ((((((1640) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b9a791cc1784f24cc4cc84b4() {
  return __cxx_static_address_b9a791cc1784f24cc4cc84b4.reference || (__cxx_static_address_b9a791cc1784f24cc4cc84b4.reference = {
    __cReference: true,
    get value() { return FIST____header_global_1fdaf0f16e9193e2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:555
export const FREEZEBLAST____header_global_96c2b0662a0dd2da = ((((((1641) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f521cc3324b93658115462e0() {
  return __cxx_static_address_f521cc3324b93658115462e0.reference || (__cxx_static_address_f521cc3324b93658115462e0.reference = {
    __cReference: true,
    get value() { return FREEZEBLAST____header_global_96c2b0662a0dd2da; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:556
export const SHRINKSPARK____header_global_b9696c7f5ad5dcaf = ((((((1646) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_58739984d5b1fc866abc727f() {
  return __cxx_static_address_58739984d5b1fc866abc727f.reference || (__cxx_static_address_58739984d5b1fc866abc727f.reference = {
    __cReference: true,
    get value() { return SHRINKSPARK____header_global_b9696c7f5ad5dcaf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:557
export const TONGUE____header_global_5109d06f633004d6 = ((((((1647) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bfc9e56259a97f395b4c21ce() {
  return __cxx_static_address_bfc9e56259a97f395b4c21ce.reference || (__cxx_static_address_bfc9e56259a97f395b4c21ce.reference = {
    __cReference: true,
    get value() { return TONGUE____header_global_5109d06f633004d6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:558
export const MORTER____header_global_842a0bec89b5af26 = ((((((1650) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7f0f3885e856e15fd492795d() {
  return __cxx_static_address_7f0f3885e856e15fd492795d.reference || (__cxx_static_address_7f0f3885e856e15fd492795d.reference = {
    __cReference: true,
    get value() { return MORTER____header_global_842a0bec89b5af26; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:559
export const SHRINKEREXPLOSION____header_global_6d1fdd4c2dbb06c9 = ((((((1656) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b12423ae1a6d74ca8a12be55() {
  return __cxx_static_address_b12423ae1a6d74ca8a12be55.reference || (__cxx_static_address_b12423ae1a6d74ca8a12be55.reference = {
    __cReference: true,
    get value() { return SHRINKEREXPLOSION____header_global_6d1fdd4c2dbb06c9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:560
export const RADIUSEXPLOSION____header_global_37fd4b17dd573de6 = ((((((1670) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_17fd09509fc70ad4753eaa8f() {
  return __cxx_static_address_17fd09509fc70ad4753eaa8f.reference || (__cxx_static_address_17fd09509fc70ad4753eaa8f.reference = {
    __cReference: true,
    get value() { return RADIUSEXPLOSION____header_global_37fd4b17dd573de6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:561
export const FORCERIPPLE____header_global_711ab64f61828ea3 = ((((((1671) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1eb0c755ce09293aa65f514a() {
  return __cxx_static_address_1eb0c755ce09293aa65f514a.reference || (__cxx_static_address_1eb0c755ce09293aa65f514a.reference = {
    __cReference: true,
    get value() { return FORCERIPPLE____header_global_711ab64f61828ea3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:562
export const LIZTROOP____header_global_0f3c05bd2247b23a = ((((((1680) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5c81a7c770a8403b6e223f14() {
  return __cxx_static_address_5c81a7c770a8403b6e223f14.reference || (__cxx_static_address_5c81a7c770a8403b6e223f14.reference = {
    __cReference: true,
    get value() { return LIZTROOP____header_global_0f3c05bd2247b23a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:563
export const LIZTROOPRUNNING____header_global_44b537f9ad8cfa36 = ((((((1681) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9e7a342a0c75846ee2948113() {
  return __cxx_static_address_9e7a342a0c75846ee2948113.reference || (__cxx_static_address_9e7a342a0c75846ee2948113.reference = {
    __cReference: true,
    get value() { return LIZTROOPRUNNING____header_global_44b537f9ad8cfa36; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:564
export const LIZTROOPSTAYPUT____header_global_edb7a5f208d3511c = ((((((1682) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0e3f95efde6c44924bd8ae84() {
  return __cxx_static_address_0e3f95efde6c44924bd8ae84.reference || (__cxx_static_address_0e3f95efde6c44924bd8ae84.reference = {
    __cReference: true,
    get value() { return LIZTROOPSTAYPUT____header_global_edb7a5f208d3511c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:565
export const LIZTROOPSHOOT____header_global_bee3ed02f167a1f1 = ((((((1715) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6899f9e19206e22cf1aceb98() {
  return __cxx_static_address_6899f9e19206e22cf1aceb98.reference || (__cxx_static_address_6899f9e19206e22cf1aceb98.reference = {
    __cReference: true,
    get value() { return LIZTROOPSHOOT____header_global_bee3ed02f167a1f1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:566
export const LIZTROOPJETPACK____header_global_84d1ad72513fb6a4 = ((((((1725) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_24bd79026c051953a28c75fd() {
  return __cxx_static_address_24bd79026c051953a28c75fd.reference || (__cxx_static_address_24bd79026c051953a28c75fd.reference = {
    __cReference: true,
    get value() { return LIZTROOPJETPACK____header_global_84d1ad72513fb6a4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:567
export const LIZTROOPONTOILET____header_global_b9e8512c5adfb247 = ((((((1741) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cab331e3df90fa8768a512c6() {
  return __cxx_static_address_cab331e3df90fa8768a512c6.reference || (__cxx_static_address_cab331e3df90fa8768a512c6.reference = {
    __cReference: true,
    get value() { return LIZTROOPONTOILET____header_global_b9e8512c5adfb247; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:568
export const LIZTROOPJUSTSIT____header_global_74b5f929c9240bfc = ((((((1742) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8789d6a31e6de551546e390e() {
  return __cxx_static_address_8789d6a31e6de551546e390e.reference || (__cxx_static_address_8789d6a31e6de551546e390e.reference = {
    __cReference: true,
    get value() { return LIZTROOPJUSTSIT____header_global_74b5f929c9240bfc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:569
export const LIZTROOPDUCKING____header_global_6c901a0e68395090 = ((((((1744) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_66f4a94ad4b4915b71b64be7() {
  return __cxx_static_address_66f4a94ad4b4915b71b64be7.reference || (__cxx_static_address_66f4a94ad4b4915b71b64be7.reference = {
    __cReference: true,
    get value() { return LIZTROOPDUCKING____header_global_6c901a0e68395090; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:570
export const HEADJIB1____header_global_73a8eac69627ad74 = ((((((1768) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_11864a9ac9682def307d5166() {
  return __cxx_static_address_11864a9ac9682def307d5166.reference || (__cxx_static_address_11864a9ac9682def307d5166.reference = {
    __cReference: true,
    get value() { return HEADJIB1____header_global_73a8eac69627ad74; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:571
export const ARMJIB1____header_global_eb126b9deb19869c = ((((((1772) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_55a936950c5187e58ceb44de() {
  return __cxx_static_address_55a936950c5187e58ceb44de.reference || (__cxx_static_address_55a936950c5187e58ceb44de.reference = {
    __cReference: true,
    get value() { return ARMJIB1____header_global_eb126b9deb19869c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:572
export const LEGJIB1____header_global_4017032882149db0 = ((((((1776) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bf8c60a33ba32cb2302f4705() {
  return __cxx_static_address_bf8c60a33ba32cb2302f4705.reference || (__cxx_static_address_bf8c60a33ba32cb2302f4705.reference = {
    __cReference: true,
    get value() { return LEGJIB1____header_global_4017032882149db0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:573
export const OCTABRAIN____header_global_72f94a8270bd76fe = ((((((1820) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_13fd5d97ceaa64dfb961349a() {
  return __cxx_static_address_13fd5d97ceaa64dfb961349a.reference || (__cxx_static_address_13fd5d97ceaa64dfb961349a.reference = {
    __cReference: true,
    get value() { return OCTABRAIN____header_global_72f94a8270bd76fe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:574
export const OCTABRAINSTAYPUT____header_global_fe5885e1c0877eb4 = ((((((1821) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c454c56d5742ebbec253dc50() {
  return __cxx_static_address_c454c56d5742ebbec253dc50.reference || (__cxx_static_address_c454c56d5742ebbec253dc50.reference = {
    __cReference: true,
    get value() { return OCTABRAINSTAYPUT____header_global_fe5885e1c0877eb4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:575
export const INNERJAW____header_global_d0c1462ac652de9f = ((((((1860) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f9f06b30b8398ee2671baeba() {
  return __cxx_static_address_f9f06b30b8398ee2671baeba.reference || (__cxx_static_address_f9f06b30b8398ee2671baeba.reference = {
    __cReference: true,
    get value() { return INNERJAW____header_global_d0c1462ac652de9f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:576
export const DRONE____header_global_06c91c6f1013bdb6 = ((((((1880) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a154a3de960e96fc6e3af939() {
  return __cxx_static_address_a154a3de960e96fc6e3af939.reference || (__cxx_static_address_a154a3de960e96fc6e3af939.reference = {
    __cReference: true,
    get value() { return DRONE____header_global_06c91c6f1013bdb6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:577
export const EXPLOSION2____header_global_0e81de55f7bf4ca3 = ((((((1890) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b034bf7e333098030886673e() {
  return __cxx_static_address_b034bf7e333098030886673e.reference || (__cxx_static_address_b034bf7e333098030886673e.reference = {
    __cReference: true,
    get value() { return EXPLOSION2____header_global_0e81de55f7bf4ca3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:578
export const COMMANDER____header_global_aee8c02f1c0d5b7d = ((((((1920) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_06b560547b4c6a8c63ce1436() {
  return __cxx_static_address_06b560547b4c6a8c63ce1436.reference || (__cxx_static_address_06b560547b4c6a8c63ce1436.reference = {
    __cReference: true,
    get value() { return COMMANDER____header_global_aee8c02f1c0d5b7d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:579
export const COMMANDERSTAYPUT____header_global_74bab6d8b755102e = ((((((1921) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5a250b3c34d2b9b6f8e17f81() {
  return __cxx_static_address_5a250b3c34d2b9b6f8e17f81.reference || (__cxx_static_address_5a250b3c34d2b9b6f8e17f81.reference = {
    __cReference: true,
    get value() { return COMMANDERSTAYPUT____header_global_74bab6d8b755102e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:580
export const RECON____header_global_23cf88bf6fbfdf57 = ((((((1960) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d44d380bdd5267a5049882a8() {
  return __cxx_static_address_d44d380bdd5267a5049882a8.reference || (__cxx_static_address_d44d380bdd5267a5049882a8.reference = {
    __cReference: true,
    get value() { return RECON____header_global_23cf88bf6fbfdf57; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:581
export const TANK____header_global_1fd0ad2dca252df8 = ((((((1975) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f63e0c24dcd08318651242dc() {
  return __cxx_static_address_f63e0c24dcd08318651242dc.reference || (__cxx_static_address_f63e0c24dcd08318651242dc.reference = {
    __cReference: true,
    get value() { return TANK____header_global_1fd0ad2dca252df8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:582
export const PIGCOP____header_global_0f4a6f39f8beb964 = ((((((2000) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9f5308821a65036eee36be81() {
  return __cxx_static_address_9f5308821a65036eee36be81.reference || (__cxx_static_address_9f5308821a65036eee36be81.reference = {
    __cReference: true,
    get value() { return PIGCOP____header_global_0f4a6f39f8beb964; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:583
export const PIGCOPSTAYPUT____header_global_e5f0c10d9f50c881 = ((((((2001) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e1166b9a601b4d46e2c0866f() {
  return __cxx_static_address_e1166b9a601b4d46e2c0866f.reference || (__cxx_static_address_e1166b9a601b4d46e2c0866f.reference = {
    __cReference: true,
    get value() { return PIGCOPSTAYPUT____header_global_e5f0c10d9f50c881; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:584
export const PIGCOPDIVE____header_global_8dbce72e1f55e31b = ((((((2045) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0c8f9c6ee19b2d8b9b95d2ad() {
  return __cxx_static_address_0c8f9c6ee19b2d8b9b95d2ad.reference || (__cxx_static_address_0c8f9c6ee19b2d8b9b95d2ad.reference = {
    __cReference: true,
    get value() { return PIGCOPDIVE____header_global_8dbce72e1f55e31b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:585
export const LIZMAN____header_global_2e9d56d771feb65e = ((((((2120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_330fb5cbc604645e2200988d() {
  return __cxx_static_address_330fb5cbc604645e2200988d.reference || (__cxx_static_address_330fb5cbc604645e2200988d.reference = {
    __cReference: true,
    get value() { return LIZMAN____header_global_2e9d56d771feb65e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:586
export const LIZMANSTAYPUT____header_global_4bf732942afb2118 = ((((((2121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ad7cfd5a72750cc7febfafd1() {
  return __cxx_static_address_ad7cfd5a72750cc7febfafd1.reference || (__cxx_static_address_ad7cfd5a72750cc7febfafd1.reference = {
    __cReference: true,
    get value() { return LIZMANSTAYPUT____header_global_4bf732942afb2118; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:587
export const LIZMANSPITTING____header_global_bbece2a670756512 = ((((((2150) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_891a11f642f707c6c9f97857() {
  return __cxx_static_address_891a11f642f707c6c9f97857.reference || (__cxx_static_address_891a11f642f707c6c9f97857.reference = {
    __cReference: true,
    get value() { return LIZMANSPITTING____header_global_bbece2a670756512; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:588
export const LIZMANFEEDING____header_global_b46ccdd911845e95 = ((((((2160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c793865aa1c68a08ac8e1499() {
  return __cxx_static_address_c793865aa1c68a08ac8e1499.reference || (__cxx_static_address_c793865aa1c68a08ac8e1499.reference = {
    __cReference: true,
    get value() { return LIZMANFEEDING____header_global_b46ccdd911845e95; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:589
export const LIZMANJUMP____header_global_b67a234f2b8d3e75 = ((((((2165) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_62b9e97066b183beaeceaa39() {
  return __cxx_static_address_62b9e97066b183beaeceaa39.reference || (__cxx_static_address_62b9e97066b183beaeceaa39.reference = {
    __cReference: true,
    get value() { return LIZMANJUMP____header_global_b67a234f2b8d3e75; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:590
export const FECES____header_global_d8bdc3d8fed40bd1 = ((((((2200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_27d8f9a0dca98b432d4e766b() {
  return __cxx_static_address_27d8f9a0dca98b432d4e766b.reference || (__cxx_static_address_27d8f9a0dca98b432d4e766b.reference = {
    __cReference: true,
    get value() { return FECES____header_global_d8bdc3d8fed40bd1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:591
export const LIZMANHEAD1____header_global_10cd3fbf8199370d = ((((((2201) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f3e8334ce5dd7fe31fdd7d64() {
  return __cxx_static_address_f3e8334ce5dd7fe31fdd7d64.reference || (__cxx_static_address_f3e8334ce5dd7fe31fdd7d64.reference = {
    __cReference: true,
    get value() { return LIZMANHEAD1____header_global_10cd3fbf8199370d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:592
export const LIZMANARM1____header_global_d746411ffd292980 = ((((((2205) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_13eb2c6089d31ef950fb35cb() {
  return __cxx_static_address_13eb2c6089d31ef950fb35cb.reference || (__cxx_static_address_13eb2c6089d31ef950fb35cb.reference = {
    __cReference: true,
    get value() { return LIZMANARM1____header_global_d746411ffd292980; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:593
export const LIZMANLEG1____header_global_458766aae2fe2e27 = ((((((2209) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aef38a256acd2107d79863af() {
  return __cxx_static_address_aef38a256acd2107d79863af.reference || (__cxx_static_address_aef38a256acd2107d79863af.reference = {
    __cReference: true,
    get value() { return LIZMANLEG1____header_global_458766aae2fe2e27; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:594
export const EXPLOSION2BOT____header_global_8dc1f6f2d24c07a4 = ((((((2219) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a0b015ce045cf361401a3004() {
  return __cxx_static_address_a0b015ce045cf361401a3004.reference || (__cxx_static_address_a0b015ce045cf361401a3004.reference = {
    __cReference: true,
    get value() { return EXPLOSION2BOT____header_global_8dc1f6f2d24c07a4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:595
export const JIBS1____header_global_39069552a3332e5b = ((((((2245) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ac8d03bffcaaed835ef7378f() {
  return __cxx_static_address_ac8d03bffcaaed835ef7378f.reference || (__cxx_static_address_ac8d03bffcaaed835ef7378f.reference = {
    __cReference: true,
    get value() { return JIBS1____header_global_39069552a3332e5b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:596
export const JIBS2____header_global_64563f1089d0cd59 = ((((((2250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_233706dcede386fb02140874() {
  return __cxx_static_address_233706dcede386fb02140874.reference || (__cxx_static_address_233706dcede386fb02140874.reference = {
    __cReference: true,
    get value() { return JIBS2____header_global_64563f1089d0cd59; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:597
export const JIBS3____header_global_a02083d0ebc141d1 = ((((((2255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d69dffca4fd78c0c120d769f() {
  return __cxx_static_address_d69dffca4fd78c0c120d769f.reference || (__cxx_static_address_d69dffca4fd78c0c120d769f.reference = {
    __cReference: true,
    get value() { return JIBS3____header_global_a02083d0ebc141d1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:598
export const JIBS4____header_global_b03b4f446cdd61f5 = ((((((2260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_439388f0770e76122d67f3b5() {
  return __cxx_static_address_439388f0770e76122d67f3b5.reference || (__cxx_static_address_439388f0770e76122d67f3b5.reference = {
    __cReference: true,
    get value() { return JIBS4____header_global_b03b4f446cdd61f5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:599
export const JIBS5____header_global_81d584fdc53b5fc2 = ((((((2265) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_15069c31809e1c4d7b00bebe() {
  return __cxx_static_address_15069c31809e1c4d7b00bebe.reference || (__cxx_static_address_15069c31809e1c4d7b00bebe.reference = {
    __cReference: true,
    get value() { return JIBS5____header_global_81d584fdc53b5fc2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:600
export const BURNING____header_global_b133dbfbff319d8e = ((((((2270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_382c2ba6bf7025e89a0c23c0() {
  return __cxx_static_address_382c2ba6bf7025e89a0c23c0.reference || (__cxx_static_address_382c2ba6bf7025e89a0c23c0.reference = {
    __cReference: true,
    get value() { return BURNING____header_global_b133dbfbff319d8e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:601
export const FIRE____header_global_ea0bd028464b29e2 = ((((((2271) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6cc035ef195fff1ab268825c() {
  return __cxx_static_address_6cc035ef195fff1ab268825c.reference || (__cxx_static_address_6cc035ef195fff1ab268825c.reference = {
    __cReference: true,
    get value() { return FIRE____header_global_ea0bd028464b29e2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:602
export const JIBS6____header_global_8ffeb504950066b4 = ((((((2286) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f9d10b566d6ee1c6e2811e12() {
  return __cxx_static_address_f9d10b566d6ee1c6e2811e12.reference || (__cxx_static_address_f9d10b566d6ee1c6e2811e12.reference = {
    __cReference: true,
    get value() { return JIBS6____header_global_8ffeb504950066b4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:603
export const BLOODSPLAT1____header_global_6fc3d271ba24206b = ((((((2296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_108e00d0df13bc194ad19b6d() {
  return __cxx_static_address_108e00d0df13bc194ad19b6d.reference || (__cxx_static_address_108e00d0df13bc194ad19b6d.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT1____header_global_6fc3d271ba24206b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:604
export const BLOODSPLAT3____header_global_0166a9be2b35daa4 = ((((((2297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4699227a5082a0dc6d94501c() {
  return __cxx_static_address_4699227a5082a0dc6d94501c.reference || (__cxx_static_address_4699227a5082a0dc6d94501c.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT3____header_global_0166a9be2b35daa4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:605
export const BLOODSPLAT2____header_global_82522b00b32fe065 = ((((((2298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2a77118206611d858bb4c8fd() {
  return __cxx_static_address_2a77118206611d858bb4c8fd.reference || (__cxx_static_address_2a77118206611d858bb4c8fd.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT2____header_global_82522b00b32fe065; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:606
export const BLOODSPLAT4____header_global_a3115b4b89c49643 = ((((((2299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aede66d01b4ac9db4aeaa11f() {
  return __cxx_static_address_aede66d01b4ac9db4aeaa11f.reference || (__cxx_static_address_aede66d01b4ac9db4aeaa11f.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT4____header_global_a3115b4b89c49643; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:607
export const OOZ____header_global_5198f075ae24e452 = ((((((2300) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a9fb78438764a6b073d44f8b() {
  return __cxx_static_address_a9fb78438764a6b073d44f8b.reference || (__cxx_static_address_a9fb78438764a6b073d44f8b.reference = {
    __cReference: true,
    get value() { return OOZ____header_global_5198f075ae24e452; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:608
export const OOZ2____header_global_509d54e2e4b2ef26 = ((((((2309) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8dba665b629955b19f6efdf7() {
  return __cxx_static_address_8dba665b629955b19f6efdf7.reference || (__cxx_static_address_8dba665b629955b19f6efdf7.reference = {
    __cReference: true,
    get value() { return OOZ2____header_global_509d54e2e4b2ef26; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:609
export const WALLBLOOD1____header_global_be85b011a210b0e1 = ((((((2301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6b069116199cc91656cc0aad() {
  return __cxx_static_address_6b069116199cc91656cc0aad.reference || (__cxx_static_address_6b069116199cc91656cc0aad.reference = {
    __cReference: true,
    get value() { return WALLBLOOD1____header_global_be85b011a210b0e1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:610
export const WALLBLOOD2____header_global_29bcaf237159dfdd = ((((((2302) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0ea940ec72ba80c094fb393e() {
  return __cxx_static_address_0ea940ec72ba80c094fb393e.reference || (__cxx_static_address_0ea940ec72ba80c094fb393e.reference = {
    __cReference: true,
    get value() { return WALLBLOOD2____header_global_29bcaf237159dfdd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:611
export const WALLBLOOD3____header_global_2b6b5d1f964499ba = ((((((2303) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4589dd96ccf084096cc19cab() {
  return __cxx_static_address_4589dd96ccf084096cc19cab.reference || (__cxx_static_address_4589dd96ccf084096cc19cab.reference = {
    __cReference: true,
    get value() { return WALLBLOOD3____header_global_2b6b5d1f964499ba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:612
export const WALLBLOOD4____header_global_318c76b7d821421d = ((((((2304) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7febec217896a8b85c22a1d6() {
  return __cxx_static_address_7febec217896a8b85c22a1d6.reference || (__cxx_static_address_7febec217896a8b85c22a1d6.reference = {
    __cReference: true,
    get value() { return WALLBLOOD4____header_global_318c76b7d821421d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:613
export const WALLBLOOD5____header_global_8ac7afc8eead35ed = ((((((2305) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_775e482cbce4d60774046c55() {
  return __cxx_static_address_775e482cbce4d60774046c55.reference || (__cxx_static_address_775e482cbce4d60774046c55.reference = {
    __cReference: true,
    get value() { return WALLBLOOD5____header_global_8ac7afc8eead35ed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:614
export const WALLBLOOD7____header_global_5a026738547e9577 = ((((((2307) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6b765bb6021719527b428169() {
  return __cxx_static_address_6b765bb6021719527b428169.reference || (__cxx_static_address_6b765bb6021719527b428169.reference = {
    __cReference: true,
    get value() { return WALLBLOOD7____header_global_5a026738547e9577; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:615
export const WALLBLOOD8____header_global_e6b39497a4481a72 = ((((((2308) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_92d5c3ce06353523fd5536b5() {
  return __cxx_static_address_92d5c3ce06353523fd5536b5.reference || (__cxx_static_address_92d5c3ce06353523fd5536b5.reference = {
    __cReference: true,
    get value() { return WALLBLOOD8____header_global_e6b39497a4481a72; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:616
export const BURNING2____header_global_588f4af44275a8b7 = ((((((2310) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_49c02cbbb6728deb9cf66c10() {
  return __cxx_static_address_49c02cbbb6728deb9cf66c10.reference || (__cxx_static_address_49c02cbbb6728deb9cf66c10.reference = {
    __cReference: true,
    get value() { return BURNING2____header_global_588f4af44275a8b7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:617
export const FIRE2____header_global_625c090801652a13 = ((((((2311) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6668c8ef07df82ac06ae942e() {
  return __cxx_static_address_6668c8ef07df82ac06ae942e.reference || (__cxx_static_address_6668c8ef07df82ac06ae942e.reference = {
    __cReference: true,
    get value() { return FIRE2____header_global_625c090801652a13; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:618
export const CRACKKNUCKLES____header_global_5ef17bb71b543945 = ((((((2324) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_77a3fc8067e33493447b7705() {
  return __cxx_static_address_77a3fc8067e33493447b7705.reference || (__cxx_static_address_77a3fc8067e33493447b7705.reference = {
    __cReference: true,
    get value() { return CRACKKNUCKLES____header_global_5ef17bb71b543945; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:619
export const SMALLSMOKE____header_global_ecd99eead3640258 = ((((((2329) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f1113f147eebfddb935625f2() {
  return __cxx_static_address_f1113f147eebfddb935625f2.reference || (__cxx_static_address_f1113f147eebfddb935625f2.reference = {
    __cReference: true,
    get value() { return SMALLSMOKE____header_global_ecd99eead3640258; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:620
export const FLOORFLAME____header_global_d1c3b2bb77564a28 = ((((((2333) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a64720933aed0f262338f2e5() {
  return __cxx_static_address_a64720933aed0f262338f2e5.reference || (__cxx_static_address_a64720933aed0f262338f2e5.reference = {
    __cReference: true,
    get value() { return FLOORFLAME____header_global_d1c3b2bb77564a28; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:621
export const ROTATEGUN____header_global_cc5ddabdfe741ec9 = ((((((2360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e75938ded333dad3fb7acaf9() {
  return __cxx_static_address_e75938ded333dad3fb7acaf9.reference || (__cxx_static_address_e75938ded333dad3fb7acaf9.reference = {
    __cReference: true,
    get value() { return ROTATEGUN____header_global_cc5ddabdfe741ec9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:622
export const GREENSLIME____header_global_ee62a6b64f799f84 = ((((((2370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cec034a75a0a72c118e15bf8() {
  return __cxx_static_address_cec034a75a0a72c118e15bf8.reference || (__cxx_static_address_cec034a75a0a72c118e15bf8.reference = {
    __cReference: true,
    get value() { return GREENSLIME____header_global_ee62a6b64f799f84; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:623
export const WATERDRIPSPLASH____header_global_f637e77456c36450 = ((((((2380) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_01fc6f62650c4e60a955e65c() {
  return __cxx_static_address_01fc6f62650c4e60a955e65c.reference || (__cxx_static_address_01fc6f62650c4e60a955e65c.reference = {
    __cReference: true,
    get value() { return WATERDRIPSPLASH____header_global_f637e77456c36450; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:624
export const SCRAP6____header_global_9af17c48b780a0b3 = ((((((2390) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b9c27a1128c6f6f5e40e4caa() {
  return __cxx_static_address_b9c27a1128c6f6f5e40e4caa.reference || (__cxx_static_address_b9c27a1128c6f6f5e40e4caa.reference = {
    __cReference: true,
    get value() { return SCRAP6____header_global_9af17c48b780a0b3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:625
export const SCRAP1____header_global_779434d5a7261ccb = ((((((2400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d0a3683f269b26bbd79a5939() {
  return __cxx_static_address_d0a3683f269b26bbd79a5939.reference || (__cxx_static_address_d0a3683f269b26bbd79a5939.reference = {
    __cReference: true,
    get value() { return SCRAP1____header_global_779434d5a7261ccb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:626
export const SCRAP2____header_global_fc6c094af5a87311 = ((((((2404) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9a4839807b8e1e80e220449c() {
  return __cxx_static_address_9a4839807b8e1e80e220449c.reference || (__cxx_static_address_9a4839807b8e1e80e220449c.reference = {
    __cReference: true,
    get value() { return SCRAP2____header_global_fc6c094af5a87311; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:627
export const SCRAP3____header_global_0b9d666786ebf424 = ((((((2408) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1eca4aa2c25178f7bb7cda90() {
  return __cxx_static_address_1eca4aa2c25178f7bb7cda90.reference || (__cxx_static_address_1eca4aa2c25178f7bb7cda90.reference = {
    __cReference: true,
    get value() { return SCRAP3____header_global_0b9d666786ebf424; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:628
export const SCRAP4____header_global_27e18adebbd0d635 = ((((((2412) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f94582d264f3e6d745915f5b() {
  return __cxx_static_address_f94582d264f3e6d745915f5b.reference || (__cxx_static_address_f94582d264f3e6d745915f5b.reference = {
    __cReference: true,
    get value() { return SCRAP4____header_global_27e18adebbd0d635; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:629
export const SCRAP5____header_global_93531438e662fd31 = ((((((2416) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8656228d8fe94e4403a1d80b() {
  return __cxx_static_address_8656228d8fe94e4403a1d80b.reference || (__cxx_static_address_8656228d8fe94e4403a1d80b.reference = {
    __cReference: true,
    get value() { return SCRAP5____header_global_93531438e662fd31; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:630
export const ORGANTIC____header_global_8dd2f6fb9c8fa14b = ((((((2420) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b498d48e602e3a268260791d() {
  return __cxx_static_address_b498d48e602e3a268260791d.reference || (__cxx_static_address_b498d48e602e3a268260791d.reference = {
    __cReference: true,
    get value() { return ORGANTIC____header_global_8dd2f6fb9c8fa14b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:631
export const BETAVERSION____header_global_459e93060a263af2 = ((((((2440) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ecf99a698a5e648df9ea3881() {
  return __cxx_static_address_ecf99a698a5e648df9ea3881.reference || (__cxx_static_address_ecf99a698a5e648df9ea3881.reference = {
    __cReference: true,
    get value() { return BETAVERSION____header_global_459e93060a263af2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:632
export const SELECTDIR____header_global_5aba9122a6fbbc5a = ((((((2444) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aa27f9f4cb63ea38ebec59e7() {
  return __cxx_static_address_aa27f9f4cb63ea38ebec59e7.reference || (__cxx_static_address_aa27f9f4cb63ea38ebec59e7.reference = {
    __cReference: true,
    get value() { return SELECTDIR____header_global_5aba9122a6fbbc5a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:633
export const F1HELP____header_global_4de95d4d8ec13e6f = ((((((2445) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7e8655e57bba29256c637388() {
  return __cxx_static_address_7e8655e57bba29256c637388.reference || (__cxx_static_address_7e8655e57bba29256c637388.reference = {
    __cReference: true,
    get value() { return F1HELP____header_global_4de95d4d8ec13e6f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:634
export const GROWSPARK____header_global_7537dbf7afb435d1 = ((((((2448) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_19de8c0a45d6d07bfaf964d0() {
  return __cxx_static_address_19de8c0a45d6d07bfaf964d0.reference || (__cxx_static_address_19de8c0a45d6d07bfaf964d0.reference = {
    __cReference: true,
    get value() { return GROWSPARK____header_global_7537dbf7afb435d1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:635
export const MENUSCREEN____header_global_1b52870317b3483a = ((((((2456) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_15a6e3a5930ba6c71ebef515() {
  return __cxx_static_address_15a6e3a5930ba6c71ebef515.reference || (__cxx_static_address_15a6e3a5930ba6c71ebef515.reference = {
    __cReference: true,
    get value() { return MENUSCREEN____header_global_1b52870317b3483a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:636
export const MENUBAR____header_global_8a4524befe40d93a = ((((((2457) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0ea647ad4eb5cab2d6436adf() {
  return __cxx_static_address_0ea647ad4eb5cab2d6436adf.reference || (__cxx_static_address_0ea647ad4eb5cab2d6436adf.reference = {
    __cReference: true,
    get value() { return MENUBAR____header_global_8a4524befe40d93a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:637
export const KILLSICON____header_global_080e1d06af3616ac = ((((((2458) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_69c65a46f1d492e4a24868ec() {
  return __cxx_static_address_69c65a46f1d492e4a24868ec.reference || (__cxx_static_address_69c65a46f1d492e4a24868ec.reference = {
    __cReference: true,
    get value() { return KILLSICON____header_global_080e1d06af3616ac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:638
export const FIRSTAID_ICON____header_global_8724ab8d8a246050 = ((((((2460) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bce88b3745760a2447a3498b() {
  return __cxx_static_address_bce88b3745760a2447a3498b.reference || (__cxx_static_address_bce88b3745760a2447a3498b.reference = {
    __cReference: true,
    get value() { return FIRSTAID_ICON____header_global_8724ab8d8a246050; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:639
export const HEAT_ICON____header_global_da8d87f022116e3e = ((((((2461) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8bde56c5b530979a5fccb2e7() {
  return __cxx_static_address_8bde56c5b530979a5fccb2e7.reference || (__cxx_static_address_8bde56c5b530979a5fccb2e7.reference = {
    __cReference: true,
    get value() { return HEAT_ICON____header_global_da8d87f022116e3e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:640
export const BOTTOMSTATUSBAR____header_global_723ad58159dcc467 = ((((((2462) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2c1c56ed57edea8bf3b513a7() {
  return __cxx_static_address_2c1c56ed57edea8bf3b513a7.reference || (__cxx_static_address_2c1c56ed57edea8bf3b513a7.reference = {
    __cReference: true,
    get value() { return BOTTOMSTATUSBAR____header_global_723ad58159dcc467; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:641
export const BOOT_ICON____header_global_7ff01b1e8948a645 = ((((((2463) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b2fc077a4b93c7868df0b925() {
  return __cxx_static_address_b2fc077a4b93c7868df0b925.reference || (__cxx_static_address_b2fc077a4b93c7868df0b925.reference = {
    __cReference: true,
    get value() { return BOOT_ICON____header_global_7ff01b1e8948a645; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:642
export const FRAGBAR____header_global_4afda866a929bf71 = ((((((2465) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8baeee70a722b66d214102b8() {
  return __cxx_static_address_8baeee70a722b66d214102b8.reference || (__cxx_static_address_8baeee70a722b66d214102b8.reference = {
    __cReference: true,
    get value() { return FRAGBAR____header_global_4afda866a929bf71; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:643
export const JETPACK_ICON____header_global_332b5808c004e655 = ((((((2467) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b53fa90f249f8748764e1874() {
  return __cxx_static_address_b53fa90f249f8748764e1874.reference || (__cxx_static_address_b53fa90f249f8748764e1874.reference = {
    __cReference: true,
    get value() { return JETPACK_ICON____header_global_332b5808c004e655; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:644
export const AIRTANK_ICON____header_global_a7fd373f878b13b4 = ((((((2468) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_20b4a5c9356f7dcc70aa619f() {
  return __cxx_static_address_20b4a5c9356f7dcc70aa619f.reference || (__cxx_static_address_20b4a5c9356f7dcc70aa619f.reference = {
    __cReference: true,
    get value() { return AIRTANK_ICON____header_global_a7fd373f878b13b4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:645
export const STEROIDS_ICON____header_global_9f1e1944800491b8 = ((((((2469) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d1ed1b71a2d22a8c0681a396() {
  return __cxx_static_address_d1ed1b71a2d22a8c0681a396.reference || (__cxx_static_address_d1ed1b71a2d22a8c0681a396.reference = {
    __cReference: true,
    get value() { return STEROIDS_ICON____header_global_9f1e1944800491b8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:646
export const HOLODUKE_ICON____header_global_361582b4b4983f6d = ((((((2470) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ab26e0bc38f9a8165fd9a44f() {
  return __cxx_static_address_ab26e0bc38f9a8165fd9a44f.reference || (__cxx_static_address_ab26e0bc38f9a8165fd9a44f.reference = {
    __cReference: true,
    get value() { return HOLODUKE_ICON____header_global_361582b4b4983f6d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:647
export const ACCESS_ICON____header_global_ad4ed15962752c29 = ((((((2471) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b1285174559afa033eea3a3c() {
  return __cxx_static_address_b1285174559afa033eea3a3c.reference || (__cxx_static_address_b1285174559afa033eea3a3c.reference = {
    __cReference: true,
    get value() { return ACCESS_ICON____header_global_ad4ed15962752c29; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:648
export const DIGITALNUM____header_global_4a8de1dbc3474b0d = ((((((2472) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cedc5f571c9b4ad5d748bbab() {
  return __cxx_static_address_cedc5f571c9b4ad5d748bbab.reference || (__cxx_static_address_cedc5f571c9b4ad5d748bbab.reference = {
    __cReference: true,
    get value() { return DIGITALNUM____header_global_4a8de1dbc3474b0d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:649
export const DUKECAR____header_global_6422a4add9a63313 = ((((((2491) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ce3604968b38007d79b63c51() {
  return __cxx_static_address_ce3604968b38007d79b63c51.reference || (__cxx_static_address_ce3604968b38007d79b63c51.reference = {
    __cReference: true,
    get value() { return DUKECAR____header_global_6422a4add9a63313; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:650
export const CAMCORNER____header_global_e72be3bf5ca274cf = ((((((2482) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2f4396119331af05c1519c4e() {
  return __cxx_static_address_2f4396119331af05c1519c4e.reference || (__cxx_static_address_2f4396119331af05c1519c4e.reference = {
    __cReference: true,
    get value() { return CAMCORNER____header_global_e72be3bf5ca274cf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:651
export const CAMLIGHT____header_global_1d96646a0fd0f8c2 = ((((((2484) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_53072980424a2ffa1dfbae65() {
  return __cxx_static_address_53072980424a2ffa1dfbae65.reference || (__cxx_static_address_53072980424a2ffa1dfbae65.reference = {
    __cReference: true,
    get value() { return CAMLIGHT____header_global_1d96646a0fd0f8c2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:652
export const SLIDEBAR____header_global_7ddcc01007d07c65 = ((((((2489) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_07e716fd27dd55a990d63e1d() {
  return __cxx_static_address_07e716fd27dd55a990d63e1d.reference || (__cxx_static_address_07e716fd27dd55a990d63e1d.reference = {
    __cReference: true,
    get value() { return SLIDEBAR____header_global_7ddcc01007d07c65; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:653
export const DREALMS____header_global_4a2051d23601e907 = ((((((2492) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_832209e4cbd0caf87e274ec5() {
  return __cxx_static_address_832209e4cbd0caf87e274ec5.reference || (__cxx_static_address_832209e4cbd0caf87e274ec5.reference = {
    __cReference: true,
    get value() { return DREALMS____header_global_4a2051d23601e907; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:654
export const BETASCREEN____header_global_6b55977add1de04c = ((((((2493) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9de8b47188c226e4daa431ba() {
  return __cxx_static_address_9de8b47188c226e4daa431ba.reference || (__cxx_static_address_9de8b47188c226e4daa431ba.reference = {
    __cReference: true,
    get value() { return BETASCREEN____header_global_6b55977add1de04c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:655
export const WINDOWBORDER1____header_global_7b4e2ef42137e960 = ((((((2494) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7322446d1cf1a66936d33693() {
  return __cxx_static_address_7322446d1cf1a66936d33693.reference || (__cxx_static_address_7322446d1cf1a66936d33693.reference = {
    __cReference: true,
    get value() { return WINDOWBORDER1____header_global_7b4e2ef42137e960; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:656
export const TEXTBOX____header_global_019c84788af111fb = ((((((2495) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7a28eec13aac344ce545284e() {
  return __cxx_static_address_7a28eec13aac344ce545284e.reference || (__cxx_static_address_7a28eec13aac344ce545284e.reference = {
    __cReference: true,
    get value() { return TEXTBOX____header_global_019c84788af111fb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:657
export const WINDOWBORDER2____header_global_c6f6017b7e5d1720 = ((((((2496) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_026681724a88c97909d1b41a() {
  return __cxx_static_address_026681724a88c97909d1b41a.reference || (__cxx_static_address_026681724a88c97909d1b41a.reference = {
    __cReference: true,
    get value() { return WINDOWBORDER2____header_global_c6f6017b7e5d1720; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:658
export const DUKENUKEM____header_global_675b22d48ddd8cf0 = ((((((2497) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4aae2d644f6761aee2f32b57() {
  return __cxx_static_address_4aae2d644f6761aee2f32b57.reference || (__cxx_static_address_4aae2d644f6761aee2f32b57.reference = {
    __cReference: true,
    get value() { return DUKENUKEM____header_global_675b22d48ddd8cf0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:659
export const THREEDEE____header_global_2c5ab5a073e9a28c = ((((((2498) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_91816b2068fff6bbe1d1a559() {
  return __cxx_static_address_91816b2068fff6bbe1d1a559.reference || (__cxx_static_address_91816b2068fff6bbe1d1a559.reference = {
    __cReference: true,
    get value() { return THREEDEE____header_global_2c5ab5a073e9a28c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:660
export const INGAMEDUKETHREEDEE____header_global_204b4bca0e6a72c6 = ((((((2499) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_409815b5e7718a9abf77c296() {
  return __cxx_static_address_409815b5e7718a9abf77c296.reference || (__cxx_static_address_409815b5e7718a9abf77c296.reference = {
    __cReference: true,
    get value() { return INGAMEDUKETHREEDEE____header_global_204b4bca0e6a72c6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:661
export const TENSCREEN____header_global_844d333940b7abd0 = ((((((2500) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_257f3e9343ed35415b06d995() {
  return __cxx_static_address_257f3e9343ed35415b06d995.reference || (__cxx_static_address_257f3e9343ed35415b06d995.reference = {
    __cReference: true,
    get value() { return TENSCREEN____header_global_844d333940b7abd0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:662
export const PLUTOPAKSPRITE____header_global_c35c0e2b8669d13b = ((((((2501) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_758d9dac4164109008dee6f7() {
  return __cxx_static_address_758d9dac4164109008dee6f7.reference || (__cxx_static_address_758d9dac4164109008dee6f7.reference = {
    __cReference: true,
    get value() { return PLUTOPAKSPRITE____header_global_c35c0e2b8669d13b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:663
export const DEVISTATOR____header_global_86581b6fb00c722a = ((((((2510) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_15577f961b81be4f3ac24f11() {
  return __cxx_static_address_15577f961b81be4f3ac24f11.reference || (__cxx_static_address_15577f961b81be4f3ac24f11.reference = {
    __cReference: true,
    get value() { return DEVISTATOR____header_global_86581b6fb00c722a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:664
export const KNEE____header_global_24d744a030aa04b6 = ((((((2521) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c8e4a7b86f9e0ab7a19e0ec9() {
  return __cxx_static_address_c8e4a7b86f9e0ab7a19e0ec9.reference || (__cxx_static_address_c8e4a7b86f9e0ab7a19e0ec9.reference = {
    __cReference: true,
    get value() { return KNEE____header_global_24d744a030aa04b6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:665
export const CROSSHAIR____header_global_a78b05693eccde86 = ((((((2523) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4e5bb6da3ff8c6433352407b() {
  return __cxx_static_address_4e5bb6da3ff8c6433352407b.reference || (__cxx_static_address_4e5bb6da3ff8c6433352407b.reference = {
    __cReference: true,
    get value() { return CROSSHAIR____header_global_a78b05693eccde86; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:666
export const FIRSTGUN____header_global_d69558d1004e4856 = ((((((2524) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1265c80b8bdf8ec364bbeb30() {
  return __cxx_static_address_1265c80b8bdf8ec364bbeb30.reference || (__cxx_static_address_1265c80b8bdf8ec364bbeb30.reference = {
    __cReference: true,
    get value() { return FIRSTGUN____header_global_d69558d1004e4856; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:667
export const FIRSTGUNRELOAD____header_global_0c2c2558ea8ce263 = ((((((2528) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_78bfef55d6f36f65041804ae() {
  return __cxx_static_address_78bfef55d6f36f65041804ae.reference || (__cxx_static_address_78bfef55d6f36f65041804ae.reference = {
    __cReference: true,
    get value() { return FIRSTGUNRELOAD____header_global_0c2c2558ea8ce263; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:668
export const SHELL____header_global_7ebfa6f3850bd900 = ((((((2533) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_10e98254ae8bdff594f35898() {
  return __cxx_static_address_10e98254ae8bdff594f35898.reference || (__cxx_static_address_10e98254ae8bdff594f35898.reference = {
    __cReference: true,
    get value() { return SHELL____header_global_7ebfa6f3850bd900; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:669
export const SHOTGUNSHELL____header_global_8b1ba5f71374b6d0 = ((((((2535) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_78b64b1c51890cc23134276e() {
  return __cxx_static_address_78b64b1c51890cc23134276e.reference || (__cxx_static_address_78b64b1c51890cc23134276e.reference = {
    __cReference: true,
    get value() { return SHOTGUNSHELL____header_global_8b1ba5f71374b6d0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:670
export const CHAINGUN____header_global_5544dfd33064149a = ((((((2536) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8074870184b46e05847e87ad() {
  return __cxx_static_address_8074870184b46e05847e87ad.reference || (__cxx_static_address_8074870184b46e05847e87ad.reference = {
    __cReference: true,
    get value() { return CHAINGUN____header_global_5544dfd33064149a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:671
export const RPGGUN____header_global_b959e0122bc0218a = ((((((2544) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_532a0d96c9f676e30a311a13() {
  return __cxx_static_address_532a0d96c9f676e30a311a13.reference || (__cxx_static_address_532a0d96c9f676e30a311a13.reference = {
    __cReference: true,
    get value() { return RPGGUN____header_global_b959e0122bc0218a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:672
export const FREEZE____header_global_d0d70222867e3559 = ((((((2548) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6ea81e7c50e671ebd6f1663a() {
  return __cxx_static_address_6ea81e7c50e671ebd6f1663a.reference || (__cxx_static_address_6ea81e7c50e671ebd6f1663a.reference = {
    __cReference: true,
    get value() { return FREEZE____header_global_d0d70222867e3559; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:673
export const SHRINKER____header_global_d0d65fccdc471726 = ((((((2556) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_80742ae9f813f148d117cd94() {
  return __cxx_static_address_80742ae9f813f148d117cd94.reference || (__cxx_static_address_80742ae9f813f148d117cd94.reference = {
    __cReference: true,
    get value() { return SHRINKER____header_global_d0d65fccdc471726; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:674
export const HANDHOLDINGLASER____header_global_00575bfe1a0dc42e = ((((((2563) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bd7affaa96b60bb6ff0dac23() {
  return __cxx_static_address_bd7affaa96b60bb6ff0dac23.reference || (__cxx_static_address_bd7affaa96b60bb6ff0dac23.reference = {
    __cReference: true,
    get value() { return HANDHOLDINGLASER____header_global_00575bfe1a0dc42e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:675
export const TRIPBOMB____header_global_beaaeec9fb75d292 = ((((((2566) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ba1dbd0adaf9ca9d239a894e() {
  return __cxx_static_address_ba1dbd0adaf9ca9d239a894e.reference || (__cxx_static_address_ba1dbd0adaf9ca9d239a894e.reference = {
    __cReference: true,
    get value() { return TRIPBOMB____header_global_beaaeec9fb75d292; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:676
export const LASERLINE____header_global_c56e765039d82eae = ((((((2567) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b74c34132261a96942b3a3ef() {
  return __cxx_static_address_b74c34132261a96942b3a3ef.reference || (__cxx_static_address_b74c34132261a96942b3a3ef.reference = {
    __cReference: true,
    get value() { return LASERLINE____header_global_c56e765039d82eae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:677
export const HANDHOLDINGACCESS____header_global_f1a7c3d622ac133f = ((((((2568) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2c22c31029abe34d3875d54a() {
  return __cxx_static_address_2c22c31029abe34d3875d54a.reference || (__cxx_static_address_2c22c31029abe34d3875d54a.reference = {
    __cReference: true,
    get value() { return HANDHOLDINGACCESS____header_global_f1a7c3d622ac133f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:678
export const HANDREMOTE____header_global_ad48cf5d98fee568 = ((((((2570) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0e93fefad89de6ec4a2aa521() {
  return __cxx_static_address_0e93fefad89de6ec4a2aa521.reference || (__cxx_static_address_0e93fefad89de6ec4a2aa521.reference = {
    __cReference: true,
    get value() { return HANDREMOTE____header_global_ad48cf5d98fee568; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:679
export const HANDTHROW____header_global_7027e35c6d9a4391 = ((((((2573) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1dd4a4d752ef21ab9caf9af6() {
  return __cxx_static_address_1dd4a4d752ef21ab9caf9af6.reference || (__cxx_static_address_1dd4a4d752ef21ab9caf9af6.reference = {
    __cReference: true,
    get value() { return HANDTHROW____header_global_7027e35c6d9a4391; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:680
export const TIP____header_global_423087bbb19bc22a = ((((((2576) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bfdb56c6cb7e0d0f88bf8f52() {
  return __cxx_static_address_bfdb56c6cb7e0d0f88bf8f52.reference || (__cxx_static_address_bfdb56c6cb7e0d0f88bf8f52.reference = {
    __cReference: true,
    get value() { return TIP____header_global_423087bbb19bc22a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:681
export const SCUBAMASK____header_global_aa9f3d90f0e40a27 = ((((((2581) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ac1caf2189db5b32c4f7786b() {
  return __cxx_static_address_ac1caf2189db5b32c4f7786b.reference || (__cxx_static_address_ac1caf2189db5b32c4f7786b.reference = {
    __cReference: true,
    get value() { return SCUBAMASK____header_global_aa9f3d90f0e40a27; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:682
export const FORCESPHERE____header_global_f29091db64911056 = ((((((2590) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1431c03601f2e7329d8f18ab() {
  return __cxx_static_address_1431c03601f2e7329d8f18ab.reference || (__cxx_static_address_1431c03601f2e7329d8f18ab.reference = {
    __cReference: true,
    get value() { return FORCESPHERE____header_global_f29091db64911056; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:683
export const SHOTSPARK1____header_global_9bbb4f2650478bfc = ((((((2595) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_31eecd687c9f7a971a2b00a5() {
  return __cxx_static_address_31eecd687c9f7a971a2b00a5.reference || (__cxx_static_address_31eecd687c9f7a971a2b00a5.reference = {
    __cReference: true,
    get value() { return SHOTSPARK1____header_global_9bbb4f2650478bfc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:684
export const RPG____header_global_47af08ceff71a39c = ((((((2605) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_26835da7024a3dc584d0806e() {
  return __cxx_static_address_26835da7024a3dc584d0806e.reference || (__cxx_static_address_26835da7024a3dc584d0806e.reference = {
    __cReference: true,
    get value() { return RPG____header_global_47af08ceff71a39c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:685
export const LASERSITE____header_global_57c40d29ae029433 = ((((((2612) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7a45c2d912b5231710129918() {
  return __cxx_static_address_7a45c2d912b5231710129918.reference || (__cxx_static_address_7a45c2d912b5231710129918.reference = {
    __cReference: true,
    get value() { return LASERSITE____header_global_57c40d29ae029433; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:686
export const SHOTGUN____header_global_d7e949010cce4521 = ((((((2613) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d82240094a729e53daba5660() {
  return __cxx_static_address_d82240094a729e53daba5660.reference || (__cxx_static_address_d82240094a729e53daba5660.reference = {
    __cReference: true,
    get value() { return SHOTGUN____header_global_d7e949010cce4521; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:687
export const BOSS1____header_global_9896c1bbc2bd5019 = ((((((2630) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3b8a4c756d92982c610e8ea3() {
  return __cxx_static_address_3b8a4c756d92982c610e8ea3.reference || (__cxx_static_address_3b8a4c756d92982c610e8ea3.reference = {
    __cReference: true,
    get value() { return BOSS1____header_global_9896c1bbc2bd5019; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:688
export const BOSS1STAYPUT____header_global_baaeedbe485d2fa4 = ((((((2631) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7d3516f6d1a08a7074e9aeac() {
  return __cxx_static_address_7d3516f6d1a08a7074e9aeac.reference || (__cxx_static_address_7d3516f6d1a08a7074e9aeac.reference = {
    __cReference: true,
    get value() { return BOSS1STAYPUT____header_global_baaeedbe485d2fa4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:689
export const BOSS1SHOOT____header_global_a748b23e6f46ec97 = ((((((2660) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9fc0176eb88d62b432e99bbc() {
  return __cxx_static_address_9fc0176eb88d62b432e99bbc.reference || (__cxx_static_address_9fc0176eb88d62b432e99bbc.reference = {
    __cReference: true,
    get value() { return BOSS1SHOOT____header_global_a748b23e6f46ec97; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:690
export const BOSS1LOB____header_global_f32b1de146f686ea = ((((((2670) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9be8f839a17127ceb2cd2dbd() {
  return __cxx_static_address_9be8f839a17127ceb2cd2dbd.reference || (__cxx_static_address_9be8f839a17127ceb2cd2dbd.reference = {
    __cReference: true,
    get value() { return BOSS1LOB____header_global_f32b1de146f686ea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:691
export const BOSSTOP____header_global_ccb8dba6f7ee4f21 = ((((((2696) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ce68c4d87d1ae678917806e2() {
  return __cxx_static_address_ce68c4d87d1ae678917806e2.reference || (__cxx_static_address_ce68c4d87d1ae678917806e2.reference = {
    __cReference: true,
    get value() { return BOSSTOP____header_global_ccb8dba6f7ee4f21; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:692
export const BOSS2____header_global_a0e508e379c50140 = ((((((2710) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a7f998ba073fc50cec3ac102() {
  return __cxx_static_address_a7f998ba073fc50cec3ac102.reference || (__cxx_static_address_a7f998ba073fc50cec3ac102.reference = {
    __cReference: true,
    get value() { return BOSS2____header_global_a0e508e379c50140; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:693
export const BOSS3____header_global_66ead82f39d750eb = ((((((2760) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_547b6cf2724581b065af94ae() {
  return __cxx_static_address_547b6cf2724581b065af94ae.reference || (__cxx_static_address_547b6cf2724581b065af94ae.reference = {
    __cReference: true,
    get value() { return BOSS3____header_global_66ead82f39d750eb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:694
export const SPINNINGNUKEICON____header_global_a8747eac7c8f2ce8 = ((((((2813) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6c3c6f46cef0339a718cb251() {
  return __cxx_static_address_6c3c6f46cef0339a718cb251.reference || (__cxx_static_address_6c3c6f46cef0339a718cb251.reference = {
    __cReference: true,
    get value() { return SPINNINGNUKEICON____header_global_a8747eac7c8f2ce8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:695
export const SMALLFNTCURSOR____header_global_fa8909ce0d0017a6 = ((((((2821) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8a06d3ac0dea808a7ec1f9ca() {
  return __cxx_static_address_8a06d3ac0dea808a7ec1f9ca.reference || (__cxx_static_address_8a06d3ac0dea808a7ec1f9ca.reference = {
    __cReference: true,
    get value() { return SMALLFNTCURSOR____header_global_fa8909ce0d0017a6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:696
export const STARTALPHANUM____header_global_a377ac8bb8ae4440 = ((((((2822) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_63be8e94924d8e470c0bc45f() {
  return __cxx_static_address_63be8e94924d8e470c0bc45f.reference || (__cxx_static_address_63be8e94924d8e470c0bc45f.reference = {
    __cReference: true,
    get value() { return STARTALPHANUM____header_global_a377ac8bb8ae4440; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:697
export const ENDALPHANUM____header_global_b055fab9391728bc = ((((((2915) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_499760ff877e12772a296b01() {
  return __cxx_static_address_499760ff877e12772a296b01.reference || (__cxx_static_address_499760ff877e12772a296b01.reference = {
    __cReference: true,
    get value() { return ENDALPHANUM____header_global_b055fab9391728bc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:698
export const BIGALPHANUM____header_global_a35f6ace3c77d318 = ((((((2940) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f4bb887e30b5d62865d77e54() {
  return __cxx_static_address_f4bb887e30b5d62865d77e54.reference || (__cxx_static_address_f4bb887e30b5d62865d77e54.reference = {
    __cReference: true,
    get value() { return BIGALPHANUM____header_global_a35f6ace3c77d318; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:699
export const BIGPERIOD____header_global_5b154ef2d01aff42 = ((((((3002) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8482823a952546fd8a73b511() {
  return __cxx_static_address_8482823a952546fd8a73b511.reference || (__cxx_static_address_8482823a952546fd8a73b511.reference = {
    __cReference: true,
    get value() { return BIGPERIOD____header_global_5b154ef2d01aff42; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:700
export const BIGCOMMA____header_global_61167d32e128696b = ((((((3003) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_25c537f1ec55b1df2af1be06() {
  return __cxx_static_address_25c537f1ec55b1df2af1be06.reference || (__cxx_static_address_25c537f1ec55b1df2af1be06.reference = {
    __cReference: true,
    get value() { return BIGCOMMA____header_global_61167d32e128696b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:701
export const BIGX____header_global_bb24c2511d56a96b = ((((((3004) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7f19d7d673d2cd2d886f476c() {
  return __cxx_static_address_7f19d7d673d2cd2d886f476c.reference || (__cxx_static_address_7f19d7d673d2cd2d886f476c.reference = {
    __cReference: true,
    get value() { return BIGX____header_global_bb24c2511d56a96b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:702
export const BIGQ____header_global_8a9f739c069f7b75 = ((((((3005) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4908e00fbb0a97e6b48342eb() {
  return __cxx_static_address_4908e00fbb0a97e6b48342eb.reference || (__cxx_static_address_4908e00fbb0a97e6b48342eb.reference = {
    __cReference: true,
    get value() { return BIGQ____header_global_8a9f739c069f7b75; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:703
export const BIGSEMI____header_global_35b518e817f5b16c = ((((((3006) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_30dd779874980603ad4a220d() {
  return __cxx_static_address_30dd779874980603ad4a220d.reference || (__cxx_static_address_30dd779874980603ad4a220d.reference = {
    __cReference: true,
    get value() { return BIGSEMI____header_global_35b518e817f5b16c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:704
export const BIGCOLIN____header_global_43d7db120455d73f = ((((((3007) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_00f6e12d1beadec51aa94ae2() {
  return __cxx_static_address_00f6e12d1beadec51aa94ae2.reference || (__cxx_static_address_00f6e12d1beadec51aa94ae2.reference = {
    __cReference: true,
    get value() { return BIGCOLIN____header_global_43d7db120455d73f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:705
export const THREEBYFIVE____header_global_3eb39a1d02285443 = ((((((3010) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_383da0f8df22cf650c2fc313() {
  return __cxx_static_address_383da0f8df22cf650c2fc313.reference || (__cxx_static_address_383da0f8df22cf650c2fc313.reference = {
    __cReference: true,
    get value() { return THREEBYFIVE____header_global_3eb39a1d02285443; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:706
export const BIGAPPOS____header_global_a5dd4ece49c1e359 = ((((((3022) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ba7d507018bc80553a2d5b32() {
  return __cxx_static_address_ba7d507018bc80553a2d5b32.reference || (__cxx_static_address_ba7d507018bc80553a2d5b32.reference = {
    __cReference: true,
    get value() { return BIGAPPOS____header_global_a5dd4ece49c1e359; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:707
export const MINIFONT____header_global_7842cdcd10ec7165 = ((((((3072) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2dffab2d241eac999d572b54() {
  return __cxx_static_address_2dffab2d241eac999d572b54.reference || (__cxx_static_address_2dffab2d241eac999d572b54.reference = {
    __cReference: true,
    get value() { return MINIFONT____header_global_7842cdcd10ec7165; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:708
export const RESPAWNMARKERRED____header_global_911df47a99e067cf = ((((((3190) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6e929b8e7c8e5df0a1e433f7() {
  return __cxx_static_address_6e929b8e7c8e5df0a1e433f7.reference || (__cxx_static_address_6e929b8e7c8e5df0a1e433f7.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERRED____header_global_911df47a99e067cf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:709
export const RESPAWNMARKERYELLOW____header_global_daea22ddfb5e1105 = ((((((3200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2297d91aff46037229fe6e87() {
  return __cxx_static_address_2297d91aff46037229fe6e87.reference || (__cxx_static_address_2297d91aff46037229fe6e87.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERYELLOW____header_global_daea22ddfb5e1105; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:710
export const RESPAWNMARKERGREEN____header_global_8569e19ef4e548da = ((((((3210) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_438af5908502c00c0ab5fc17() {
  return __cxx_static_address_438af5908502c00c0ab5fc17.reference || (__cxx_static_address_438af5908502c00c0ab5fc17.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERGREEN____header_global_8569e19ef4e548da; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:711
export const BONUSSCREEN____header_global_e748db1c4f99ca9d = ((((((3240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9d48a71b98242d16ce5e86c5() {
  return __cxx_static_address_9d48a71b98242d16ce5e86c5.reference || (__cxx_static_address_9d48a71b98242d16ce5e86c5.reference = {
    __cReference: true,
    get value() { return BONUSSCREEN____header_global_e748db1c4f99ca9d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:712
export const VIEWBORDER____header_global_711f2eeedb1a5cd5 = ((((((3250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8de2a3e85a299f2f49aeb492() {
  return __cxx_static_address_8de2a3e85a299f2f49aeb492.reference || (__cxx_static_address_8de2a3e85a299f2f49aeb492.reference = {
    __cReference: true,
    get value() { return VIEWBORDER____header_global_711f2eeedb1a5cd5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:713
export const VICTORY1____header_global_b581d792da580bf9 = ((((((3260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6fb324342661313b8d59372c() {
  return __cxx_static_address_6fb324342661313b8d59372c.reference || (__cxx_static_address_6fb324342661313b8d59372c.reference = {
    __cReference: true,
    get value() { return VICTORY1____header_global_b581d792da580bf9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:714
export const ORDERING____header_global_06c6607bfd13e09a = ((((((3270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_546ad792fd041be29131c09c() {
  return __cxx_static_address_546ad792fd041be29131c09c.reference || (__cxx_static_address_546ad792fd041be29131c09c.reference = {
    __cReference: true,
    get value() { return ORDERING____header_global_06c6607bfd13e09a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:715
export const TEXTSTORY____header_global_292eec68c42a7503 = ((((((3280) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_239ce377c04767771d47baf9() {
  return __cxx_static_address_239ce377c04767771d47baf9.reference || (__cxx_static_address_239ce377c04767771d47baf9.reference = {
    __cReference: true,
    get value() { return TEXTSTORY____header_global_292eec68c42a7503; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:716
export const LOADSCREEN____header_global_65a1e0ca483cf37b = ((((((3281) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4f2be82218b516ba1d189b51() {
  return __cxx_static_address_4f2be82218b516ba1d189b51.reference || (__cxx_static_address_4f2be82218b516ba1d189b51.reference = {
    __cReference: true,
    get value() { return LOADSCREEN____header_global_65a1e0ca483cf37b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:717
export const BORNTOBEWILDSCREEN____header_global_d9a6f85d681174e4 = ((((((3370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ec9bac74522e2afb47e2b8ad() {
  return __cxx_static_address_ec9bac74522e2afb47e2b8ad.reference || (__cxx_static_address_ec9bac74522e2afb47e2b8ad.reference = {
    __cReference: true,
    get value() { return BORNTOBEWILDSCREEN____header_global_d9a6f85d681174e4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:718
export const BLIMP____header_global_8b7b6e612641eaaa = ((((((3400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d7c92d16d82dacb7f056c03d() {
  return __cxx_static_address_d7c92d16d82dacb7f056c03d.reference || (__cxx_static_address_d7c92d16d82dacb7f056c03d.reference = {
    __cReference: true,
    get value() { return BLIMP____header_global_8b7b6e612641eaaa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:719
export const FEM9____header_global_37f3ff7b0c026197 = ((((((3450) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b5a3a379a9906aec3e176798() {
  return __cxx_static_address_b5a3a379a9906aec3e176798.reference || (__cxx_static_address_b5a3a379a9906aec3e176798.reference = {
    __cReference: true,
    get value() { return FEM9____header_global_37f3ff7b0c026197; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:720
export const FRAMEEFFECT1_13____header_global_656538e74ed0a784 = ((((((3999) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_302e2c6b9a926f523f55667d() {
  return __cxx_static_address_302e2c6b9a926f523f55667d.reference || (__cxx_static_address_302e2c6b9a926f523f55667d.reference = {
    __cReference: true,
    get value() { return FRAMEEFFECT1_13____header_global_656538e74ed0a784; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:721
export const FRAMEEFFECT1____header_global_c56c8a3d5fae5f96 = ((((((4095) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9e91dbc156d55548088712f4() {
  return __cxx_static_address_9e91dbc156d55548088712f4.reference || (__cxx_static_address_9e91dbc156d55548088712f4.reference = {
    __cReference: true,
    get value() { return FRAMEEFFECT1____header_global_c56c8a3d5fae5f96; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:722
export const PANNEL3____header_global_aacf04c51127cc3c = ((((((4099) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d051e6e63a0e7bf6e3d0a6fc() {
  return __cxx_static_address_d051e6e63a0e7bf6e3d0a6fc.reference || (__cxx_static_address_d051e6e63a0e7bf6e3d0a6fc.reference = {
    __cReference: true,
    get value() { return PANNEL3____header_global_aacf04c51127cc3c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:723
export const SCREENBREAK14____header_global_fc06773d65d08f25 = ((((((4120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_79b0838f61eaeaa9aef09fa7() {
  return __cxx_static_address_79b0838f61eaeaa9aef09fa7.reference || (__cxx_static_address_79b0838f61eaeaa9aef09fa7.reference = {
    __cReference: true,
    get value() { return SCREENBREAK14____header_global_fc06773d65d08f25; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:724
export const SCREENBREAK15____header_global_58b634d9f5e0d665 = ((((((4123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_21c4ef5e03083bcf5a0d8d8d() {
  return __cxx_static_address_21c4ef5e03083bcf5a0d8d8d.reference || (__cxx_static_address_21c4ef5e03083bcf5a0d8d8d.reference = {
    __cReference: true,
    get value() { return SCREENBREAK15____header_global_58b634d9f5e0d665; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:725
export const SCREENBREAK19____header_global_454e068d3d993e9e = ((((((4125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e78276819fb76746a7267f71() {
  return __cxx_static_address_e78276819fb76746a7267f71.reference || (__cxx_static_address_e78276819fb76746a7267f71.reference = {
    __cReference: true,
    get value() { return SCREENBREAK19____header_global_454e068d3d993e9e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:726
export const SCREENBREAK16____header_global_103643fddbddd43f = ((((((4127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4d226408274a54931a835575() {
  return __cxx_static_address_4d226408274a54931a835575.reference || (__cxx_static_address_4d226408274a54931a835575.reference = {
    __cReference: true,
    get value() { return SCREENBREAK16____header_global_103643fddbddd43f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:727
export const SCREENBREAK17____header_global_4cd48b68372d2563 = ((((((4128) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cadfa07539dd96e783bc47df() {
  return __cxx_static_address_cadfa07539dd96e783bc47df.reference || (__cxx_static_address_cadfa07539dd96e783bc47df.reference = {
    __cReference: true,
    get value() { return SCREENBREAK17____header_global_4cd48b68372d2563; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:728
export const SCREENBREAK18____header_global_637aa47310f04c15 = ((((((4129) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0b9f24540d0a05cad1a12e00() {
  return __cxx_static_address_0b9f24540d0a05cad1a12e00.reference || (__cxx_static_address_0b9f24540d0a05cad1a12e00.reference = {
    __cReference: true,
    get value() { return SCREENBREAK18____header_global_637aa47310f04c15; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:729
export const W_TECHWALL11____header_global_bb267610cd97369c = ((((((4130) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_511816203b34d481e8aeda17() {
  return __cxx_static_address_511816203b34d481e8aeda17.reference || (__cxx_static_address_511816203b34d481e8aeda17.reference = {
    __cReference: true,
    get value() { return W_TECHWALL11____header_global_bb267610cd97369c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:730
export const W_TECHWALL12____header_global_ae8a002197b1c56f = ((((((4131) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2ee57beb433442076f252693() {
  return __cxx_static_address_2ee57beb433442076f252693.reference || (__cxx_static_address_2ee57beb433442076f252693.reference = {
    __cReference: true,
    get value() { return W_TECHWALL12____header_global_ae8a002197b1c56f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:731
export const W_TECHWALL13____header_global_edf5ef9c685e23d9 = ((((((4132) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4f568d0e0ee28dce53b9e9dc() {
  return __cxx_static_address_4f568d0e0ee28dce53b9e9dc.reference || (__cxx_static_address_4f568d0e0ee28dce53b9e9dc.reference = {
    __cReference: true,
    get value() { return W_TECHWALL13____header_global_edf5ef9c685e23d9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:732
export const W_TECHWALL14____header_global_8970cb3e113ffe52 = ((((((4133) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8c7e2b841b909968e4806a6b() {
  return __cxx_static_address_8c7e2b841b909968e4806a6b.reference || (__cxx_static_address_8c7e2b841b909968e4806a6b.reference = {
    __cReference: true,
    get value() { return W_TECHWALL14____header_global_8970cb3e113ffe52; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:733
export const W_TECHWALL5____header_global_c302c43250f36653 = ((((((4134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4d860cf45ec5b9bd1b70726f() {
  return __cxx_static_address_4d860cf45ec5b9bd1b70726f.reference || (__cxx_static_address_4d860cf45ec5b9bd1b70726f.reference = {
    __cReference: true,
    get value() { return W_TECHWALL5____header_global_c302c43250f36653; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:734
export const W_TECHWALL6____header_global_0d0791c7b8e3ad3a = ((((((4136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a8a3e95bfb6ee02f90aab8ab() {
  return __cxx_static_address_a8a3e95bfb6ee02f90aab8ab.reference || (__cxx_static_address_a8a3e95bfb6ee02f90aab8ab.reference = {
    __cReference: true,
    get value() { return W_TECHWALL6____header_global_0d0791c7b8e3ad3a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:735
export const W_TECHWALL7____header_global_01fc2ce4527e4873 = ((((((4138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_961a23c79f7ad09259287c5c() {
  return __cxx_static_address_961a23c79f7ad09259287c5c.reference || (__cxx_static_address_961a23c79f7ad09259287c5c.reference = {
    __cReference: true,
    get value() { return W_TECHWALL7____header_global_01fc2ce4527e4873; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:736
export const W_TECHWALL8____header_global_d2d3344d5e05bab1 = ((((((4140) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_15595cc10c4283bd2bf803f1() {
  return __cxx_static_address_15595cc10c4283bd2bf803f1.reference || (__cxx_static_address_15595cc10c4283bd2bf803f1.reference = {
    __cReference: true,
    get value() { return W_TECHWALL8____header_global_d2d3344d5e05bab1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:737
export const W_TECHWALL9____header_global_5c05c6705219b713 = ((((((4142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f7160f2b4eeaf77308c86cab() {
  return __cxx_static_address_f7160f2b4eeaf77308c86cab.reference || (__cxx_static_address_f7160f2b4eeaf77308c86cab.reference = {
    __cReference: true,
    get value() { return W_TECHWALL9____header_global_5c05c6705219b713; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:738
export const BPANNEL3____header_global_9cf35fb044612e4a = ((((((4100) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c594e60b6be4d32a8ce06e05() {
  return __cxx_static_address_c594e60b6be4d32a8ce06e05.reference || (__cxx_static_address_c594e60b6be4d32a8ce06e05.reference = {
    __cReference: true,
    get value() { return BPANNEL3____header_global_9cf35fb044612e4a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:739
export const W_HITTECHWALL16____header_global_699566d4d9f11dcf = ((((((4144) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e633706510f873e4c1b76c85() {
  return __cxx_static_address_e633706510f873e4c1b76c85.reference || (__cxx_static_address_e633706510f873e4c1b76c85.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL16____header_global_699566d4d9f11dcf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:740
export const W_HITTECHWALL10____header_global_7599d4044fb64d7b = ((((((4145) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5c241e874bebd2dff3bfeae1() {
  return __cxx_static_address_5c241e874bebd2dff3bfeae1.reference || (__cxx_static_address_5c241e874bebd2dff3bfeae1.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL10____header_global_7599d4044fb64d7b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:741
export const W_HITTECHWALL15____header_global_13d806c99823019f = ((((((4147) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fc88da340750f130f9328fc1() {
  return __cxx_static_address_fc88da340750f130f9328fc1.reference || (__cxx_static_address_fc88da340750f130f9328fc1.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL15____header_global_13d806c99823019f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:742
export const W_MILKSHELF____header_global_70506d003fbc874e = ((((((4181) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_236f0bc9e9bde868f0eb5248() {
  return __cxx_static_address_236f0bc9e9bde868f0eb5248.reference || (__cxx_static_address_236f0bc9e9bde868f0eb5248.reference = {
    __cReference: true,
    get value() { return W_MILKSHELF____header_global_70506d003fbc874e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:743
export const W_MILKSHELFBROKE____header_global_af99707cfc4581e1 = ((((((4203) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ef1b363f9fda4865077dacc0() {
  return __cxx_static_address_ef1b363f9fda4865077dacc0.reference || (__cxx_static_address_ef1b363f9fda4865077dacc0.reference = {
    __cReference: true,
    get value() { return W_MILKSHELFBROKE____header_global_af99707cfc4581e1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:744
export const PURPLELAVA____header_global_37e0440dc1d3d734 = ((((((4240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e7953a0a29f2ac58748dd77d() {
  return __cxx_static_address_e7953a0a29f2ac58748dd77d.reference || (__cxx_static_address_e7953a0a29f2ac58748dd77d.reference = {
    __cReference: true,
    get value() { return PURPLELAVA____header_global_37e0440dc1d3d734; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:745
export const TARGET____header_global_99b862d6f4fb7f26 = ((((((4359) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d7b7a1c3504d4a83ea50e533() {
  return __cxx_static_address_d7b7a1c3504d4a83ea50e533.reference || (__cxx_static_address_d7b7a1c3504d4a83ea50e533.reference = {
    __cReference: true,
    get value() { return TARGET____header_global_99b862d6f4fb7f26; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:746
export const DUCK____header_global_99ac641c22a8074b = ((((((4361) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3e16785a116e7d640f86c74a() {
  return __cxx_static_address_3e16785a116e7d640f86c74a.reference || (__cxx_static_address_3e16785a116e7d640f86c74a.reference = {
    __cReference: true,
    get value() { return DUCK____header_global_99ac641c22a8074b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:747
export const PUKE____header_global_4c7a3f9930a8c66d = ((((((4389) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a7b143411a6a57f2b9e055c8() {
  return __cxx_static_address_a7b143411a6a57f2b9e055c8.reference || (__cxx_static_address_a7b143411a6a57f2b9e055c8.reference = {
    __cReference: true,
    get value() { return PUKE____header_global_4c7a3f9930a8c66d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:748
export const DOORTILE23____header_global_6fdfc2a72ce4c0fa = ((((((4391) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_202fc5358e78dc8b096ea6e6() {
  return __cxx_static_address_202fc5358e78dc8b096ea6e6.reference || (__cxx_static_address_202fc5358e78dc8b096ea6e6.reference = {
    __cReference: true,
    get value() { return DOORTILE23____header_global_6fdfc2a72ce4c0fa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:749
export const SPEAKER____header_global_460a96329f5a937d = ((((((4397) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ce1484a7c3cf9cf30e95842a() {
  return __cxx_static_address_ce1484a7c3cf9cf30e95842a.reference || (__cxx_static_address_ce1484a7c3cf9cf30e95842a.reference = {
    __cReference: true,
    get value() { return SPEAKER____header_global_460a96329f5a937d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:750
export const MAIL____header_global_495c47339046864e = ((((((4410) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a1c464b4d99b6dcac80c80ac() {
  return __cxx_static_address_a1c464b4d99b6dcac80c80ac.reference || (__cxx_static_address_a1c464b4d99b6dcac80c80ac.reference = {
    __cReference: true,
    get value() { return MAIL____header_global_495c47339046864e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:751
export const HOTMEAT____header_global_e6e443be3ef9a12f = ((((((4427) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d01360a494ba024fea7dcb7d() {
  return __cxx_static_address_d01360a494ba024fea7dcb7d.reference || (__cxx_static_address_d01360a494ba024fea7dcb7d.reference = {
    __cReference: true,
    get value() { return HOTMEAT____header_global_e6e443be3ef9a12f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:752
export const TRIPODCAMERA____header_global_4ec85c78661db20f = ((((((4444) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8dbd473cc4953e66aecaacca() {
  return __cxx_static_address_8dbd473cc4953e66aecaacca.reference || (__cxx_static_address_8dbd473cc4953e66aecaacca.reference = {
    __cReference: true,
    get value() { return TRIPODCAMERA____header_global_4ec85c78661db20f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:753
export const PAPER____header_global_9a0f3411a010576a = ((((((4460) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2df0bd015faecc592c611a26() {
  return __cxx_static_address_2df0bd015faecc592c611a26.reference || (__cxx_static_address_2df0bd015faecc592c611a26.reference = {
    __cReference: true,
    get value() { return PAPER____header_global_9a0f3411a010576a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:754
export const GENERICPOLE2____header_global_904988ad6dfc5f9b = ((((((4465) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2b6a663d008a16795cd8c617() {
  return __cxx_static_address_2b6a663d008a16795cd8c617.reference || (__cxx_static_address_2b6a663d008a16795cd8c617.reference = {
    __cReference: true,
    get value() { return GENERICPOLE2____header_global_904988ad6dfc5f9b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:755
export const XXXSTACY____header_global_baf3bc96ffbef2f3 = ((((((4470) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8257e9750f7cf1f08caf1c2f() {
  return __cxx_static_address_8257e9750f7cf1f08caf1c2f.reference || (__cxx_static_address_8257e9750f7cf1f08caf1c2f.reference = {
    __cReference: true,
    get value() { return XXXSTACY____header_global_baf3bc96ffbef2f3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:756
export const LETTER____header_global_e73398e8707ee9e1 = ((((((4502) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bbda723f51492559751e2b6a() {
  return __cxx_static_address_bbda723f51492559751e2b6a.reference || (__cxx_static_address_bbda723f51492559751e2b6a.reference = {
    __cReference: true,
    get value() { return LETTER____header_global_e73398e8707ee9e1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:757
export const SIDEBOLT1____header_global_599335c6f4f925df = ((((((4525) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5f4231a65e949ccb061e99ff() {
  return __cxx_static_address_5f4231a65e949ccb061e99ff.reference || (__cxx_static_address_5f4231a65e949ccb061e99ff.reference = {
    __cReference: true,
    get value() { return SIDEBOLT1____header_global_599335c6f4f925df; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:758
export const FOODOBJECT16____header_global_1d2de2e2184f487f = ((((((4545) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a0101c2eafcc9a5fdf0d8f06() {
  return __cxx_static_address_a0101c2eafcc9a5fdf0d8f06.reference || (__cxx_static_address_a0101c2eafcc9a5fdf0d8f06.reference = {
    __cReference: true,
    get value() { return FOODOBJECT16____header_global_1d2de2e2184f487f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:759
export const TAMPON____header_global_0a7dc1979b448d9f = ((((((4557) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0c4c914aca059996659e0b41() {
  return __cxx_static_address_0c4c914aca059996659e0b41.reference || (__cxx_static_address_0c4c914aca059996659e0b41.reference = {
    __cReference: true,
    get value() { return TAMPON____header_global_0a7dc1979b448d9f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:760
export const CANWITHSOMETHING2____header_global_010eb0cb88dd1b16 = ((((((4580) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4a1340daffb741707c63e6c6() {
  return __cxx_static_address_4a1340daffb741707c63e6c6.reference || (__cxx_static_address_4a1340daffb741707c63e6c6.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING2____header_global_010eb0cb88dd1b16; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:761
export const CANWITHSOMETHING3____header_global_c25ad392c7ecdf96 = ((((((4581) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e2efbde7837218650314e797() {
  return __cxx_static_address_e2efbde7837218650314e797.reference || (__cxx_static_address_e2efbde7837218650314e797.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING3____header_global_c25ad392c7ecdf96; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:762
export const CANWITHSOMETHING4____header_global_17ec8573dd79aa3e = ((((((4582) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1bfc7e0f1d66d0c2f50f0475() {
  return __cxx_static_address_1bfc7e0f1d66d0c2f50f0475.reference || (__cxx_static_address_1bfc7e0f1d66d0c2f50f0475.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING4____header_global_17ec8573dd79aa3e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:763
export const DOLPHIN1____header_global_232a7ae786f7ed3a = ((((((4591) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b9d96ac4116c0b765146d07c() {
  return __cxx_static_address_b9d96ac4116c0b765146d07c.reference || (__cxx_static_address_b9d96ac4116c0b765146d07c.reference = {
    __cReference: true,
    get value() { return DOLPHIN1____header_global_232a7ae786f7ed3a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:764
export const DOLPHIN2____header_global_34f3f81a110d849b = ((((((4592) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e47fff101580dfa1b78360cc() {
  return __cxx_static_address_e47fff101580dfa1b78360cc.reference || (__cxx_static_address_e47fff101580dfa1b78360cc.reference = {
    __cReference: true,
    get value() { return DOLPHIN2____header_global_34f3f81a110d849b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:765
export const NEWBEAST____header_global_5dbf9037d2e34052 = ((((((4610) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_541553b1d59ad5ffb469be7f() {
  return __cxx_static_address_541553b1d59ad5ffb469be7f.reference || (__cxx_static_address_541553b1d59ad5ffb469be7f.reference = {
    __cReference: true,
    get value() { return NEWBEAST____header_global_5dbf9037d2e34052; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:766
export const NEWBEASTSTAYPUT____header_global_192237898c8c9cda = ((((((4611) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_46860ab6c3531784eb9cbbe2() {
  return __cxx_static_address_46860ab6c3531784eb9cbbe2.reference || (__cxx_static_address_46860ab6c3531784eb9cbbe2.reference = {
    __cReference: true,
    get value() { return NEWBEASTSTAYPUT____header_global_192237898c8c9cda; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:767
export const BOSS4____header_global_f46e15cfec151613 = ((((((4740) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_948b3bc6d7fff67bbf825f38() {
  return __cxx_static_address_948b3bc6d7fff67bbf825f38.reference || (__cxx_static_address_948b3bc6d7fff67bbf825f38.reference = {
    __cReference: true,
    get value() { return BOSS4____header_global_f46e15cfec151613; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:768
export const BOSS4STAYPUT____header_global_b7c63df3da665f05 = ((((((4741) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0d3c9a1c24d0ed9c374e8de7() {
  return __cxx_static_address_0d3c9a1c24d0ed9c374e8de7.reference || (__cxx_static_address_0d3c9a1c24d0ed9c374e8de7.reference = {
    __cReference: true,
    get value() { return BOSS4STAYPUT____header_global_b7c63df3da665f05; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:769
export const FEM10____header_global_fd204ca7a6a74e08 = ((((((4864) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dccc80fc996abf1a545efda3() {
  return __cxx_static_address_dccc80fc996abf1a545efda3.reference || (__cxx_static_address_dccc80fc996abf1a545efda3.reference = {
    __cReference: true,
    get value() { return FEM10____header_global_fd204ca7a6a74e08; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:770
export const TOUGHGAL____header_global_097b616bfe8a2592 = ((((((4866) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_23f865c43c75c81d9e5102bc() {
  return __cxx_static_address_23f865c43c75c81d9e5102bc.reference || (__cxx_static_address_23f865c43c75c81d9e5102bc.reference = {
    __cReference: true,
    get value() { return TOUGHGAL____header_global_097b616bfe8a2592; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:771
export const MAN____header_global_4788173fd4396fde = ((((((4871) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6e15f0b9dcba5c85759d6abd() {
  return __cxx_static_address_6e15f0b9dcba5c85759d6abd.reference || (__cxx_static_address_6e15f0b9dcba5c85759d6abd.reference = {
    __cReference: true,
    get value() { return MAN____header_global_4788173fd4396fde; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:772
export const MAN2____header_global_d8af4f5b2f41d17c = ((((((4872) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f8adf24ab9c76513e1c107e8() {
  return __cxx_static_address_f8adf24ab9c76513e1c107e8.reference || (__cxx_static_address_f8adf24ab9c76513e1c107e8.reference = {
    __cReference: true,
    get value() { return MAN2____header_global_d8af4f5b2f41d17c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:773
export const WOMAN____header_global_6999e9c345021e0e = ((((((4874) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7d0a04abf726b3a29c39e06d() {
  return __cxx_static_address_7d0a04abf726b3a29c39e06d.reference || (__cxx_static_address_7d0a04abf726b3a29c39e06d.reference = {
    __cReference: true,
    get value() { return WOMAN____header_global_6999e9c345021e0e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:774
export const NATURALLIGHTNING____header_global_2e05dd7e6e60ad38 = ((((((4890) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_98ab6727a841c33c97029b9e() {
  return __cxx_static_address_98ab6727a841c33c97029b9e.reference || (__cxx_static_address_98ab6727a841c33c97029b9e.reference = {
    __cReference: true,
    get value() { return NATURALLIGHTNING____header_global_2e05dd7e6e60ad38; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:775
export const WEATHERWARN____header_global_ebfc34b6750b18a6 = ((((((4893) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0737393693796ca7f6f6decb() {
  return __cxx_static_address_0737393693796ca7f6f6decb.reference || (__cxx_static_address_0737393693796ca7f6f6decb.reference = {
    __cReference: true,
    get value() { return WEATHERWARN____header_global_ebfc34b6750b18a6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:776
export const DUKETAG____header_global_cd7a2c733ba43f5d = ((((((4900) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5a6fa39b86a7c075f7b376b3() {
  return __cxx_static_address_5a6fa39b86a7c075f7b376b3.reference || (__cxx_static_address_5a6fa39b86a7c075f7b376b3.reference = {
    __cReference: true,
    get value() { return DUKETAG____header_global_cd7a2c733ba43f5d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:777
export const SIGN1____header_global_ab2a5a1d3fd99e8d = ((((((4909) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a2443c735ceebabb0749bf7a() {
  return __cxx_static_address_a2443c735ceebabb0749bf7a.reference || (__cxx_static_address_a2443c735ceebabb0749bf7a.reference = {
    __cReference: true,
    get value() { return SIGN1____header_global_ab2a5a1d3fd99e8d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:778
export const SIGN2____header_global_a36f1118a57beea3 = ((((((4912) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_24d47f55f3fe597c66995c29() {
  return __cxx_static_address_24d47f55f3fe597c66995c29.reference || (__cxx_static_address_24d47f55f3fe597c66995c29.reference = {
    __cReference: true,
    get value() { return SIGN2____header_global_a36f1118a57beea3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:779
export const JURYGUY____header_global_203424aa90644626 = ((((((4943) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c1eb803664b4b3f080418c69() {
  return __cxx_static_address_c1eb803664b4b3f080418c69.reference || (__cxx_static_address_c1eb803664b4b3f080418c69.reference = {
    __cReference: true,
    get value() { return JURYGUY____header_global_203424aa90644626; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:780
export const WIDESCREENSTATUSBAR____header_global_9724f1331724e20b = ((((((5120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f68f68d704151461134bfcd8() {
  return __cxx_static_address_f68f68d704151461134bfcd8.reference || (__cxx_static_address_f68f68d704151461134bfcd8.reference = {
    __cReference: true,
    get value() { return WIDESCREENSTATUSBAR____header_global_9724f1331724e20b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:781
export const RPGGUNWIDE____header_global_26e9f5fc1edda302 = ((((((5121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2e2d7d8392206204a7557887() {
  return __cxx_static_address_2e2d7d8392206204a7557887.reference || (__cxx_static_address_2e2d7d8392206204a7557887.reference = {
    __cReference: true,
    get value() { return RPGGUNWIDE____header_global_26e9f5fc1edda302; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:782
export const FIRSTGUNRELOADWIDE____header_global_dcd2e7dd5ddaeb93 = ((((((5122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fb13c6fd5585b9c508c6b758() {
  return __cxx_static_address_fb13c6fd5585b9c508c6b758.reference || (__cxx_static_address_fb13c6fd5585b9c508c6b758.reference = {
    __cReference: true,
    get value() { return FIRSTGUNRELOADWIDE____header_global_dcd2e7dd5ddaeb93; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:783
export const FREEZEWIDE____header_global_4b3794d4d800f391 = ((((((5123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aea26c64623e5ee1d299a988() {
  return __cxx_static_address_aea26c64623e5ee1d299a988.reference || (__cxx_static_address_aea26c64623e5ee1d299a988.reference = {
    __cReference: true,
    get value() { return FREEZEWIDE____header_global_4b3794d4d800f391; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:784
export const FREEZEFIREWIDE____header_global_ccfdaf6fd6ad2c0b = ((((((5124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_49d6fda24c1d8bfac10392b1() {
  return __cxx_static_address_49d6fda24c1d8bfac10392b1.reference || (__cxx_static_address_49d6fda24c1d8bfac10392b1.reference = {
    __cReference: true,
    get value() { return FREEZEFIREWIDE____header_global_ccfdaf6fd6ad2c0b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:785
export const SHRINKERWIDE____header_global_68c348f7e24fee6c = ((((((5127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_993c555eecc281fec45769c0() {
  return __cxx_static_address_993c555eecc281fec45769c0.reference || (__cxx_static_address_993c555eecc281fec45769c0.reference = {
    __cReference: true,
    get value() { return SHRINKERWIDE____header_global_68c348f7e24fee6c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:786
export const CRACKKNUCKLESWIDE____header_global_a5a8ce50992e1ba1 = ((((((5129) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e44b068ede9b908b9bbcd546() {
  return __cxx_static_address_e44b068ede9b908b9bbcd546.reference || (__cxx_static_address_e44b068ede9b908b9bbcd546.reference = {
    __cReference: true,
    get value() { return CRACKKNUCKLESWIDE____header_global_a5a8ce50992e1ba1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:787
export const FLAMETHROWERSPRITE____header_global_8fc79f595a21e91d = ((((((5134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0c5ccc0668df02af56755e6d() {
  return __cxx_static_address_0c5ccc0668df02af56755e6d.reference || (__cxx_static_address_0c5ccc0668df02af56755e6d.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERSPRITE____header_global_8fc79f595a21e91d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:788
export const FLAMETHROWERAMMO____header_global_88942c307da01476 = ((((((5135) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5100f7248a12de5d37d909bd() {
  return __cxx_static_address_5100f7248a12de5d37d909bd.reference || (__cxx_static_address_5100f7248a12de5d37d909bd.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERAMMO____header_global_88942c307da01476; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:789
export const FLAMETHROWER____header_global_337be1eba770c4fe = ((((((5138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_830164e629a769bb2dde1381() {
  return __cxx_static_address_830164e629a769bb2dde1381.reference || (__cxx_static_address_830164e629a769bb2dde1381.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER____header_global_337be1eba770c4fe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:790
export const FLAMETHROWERFIRE____header_global_5bfea375bb766025 = ((((((5139) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f638d018f6518060635a222d() {
  return __cxx_static_address_f638d018f6518060635a222d.reference || (__cxx_static_address_f638d018f6518060635a222d.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERFIRE____header_global_5bfea375bb766025; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:791
export const FLAMETHROWERFLAME____header_global_53afe3464745d5e3 = ((((((1891) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0af82b1d370b2a3a3f5b77f5() {
  return __cxx_static_address_0af82b1d370b2a3a3f5b77f5.reference || (__cxx_static_address_0af82b1d370b2a3a3f5b77f5.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERFLAME____header_global_53afe3464745d5e3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:792
export const FLAMETHROWERPILOT____header_global_e7efc46adc2d8c43 = ((((((5174) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_79070d12cbdc476088fb614e() {
  return __cxx_static_address_79070d12cbdc476088fb614e.reference || (__cxx_static_address_79070d12cbdc476088fb614e.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERPILOT____header_global_e7efc46adc2d8c43; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:793
export const FIREBALL____header_global_f7feaded7f350376 = ((((((5163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_09726dec3a1e00f3d03e72f9() {
  return __cxx_static_address_09726dec3a1e00f3d03e72f9.reference || (__cxx_static_address_09726dec3a1e00f3d03e72f9.reference = {
    __cReference: true,
    get value() { return FIREBALL____header_global_f7feaded7f350376; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:794
export const ONFIRE____header_global_bff45061321dbd89 = ((((((5152) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8bc2065101cb322124bc7a71() {
  return __cxx_static_address_8bc2065101cb322124bc7a71.reference || (__cxx_static_address_8bc2065101cb322124bc7a71.reference = {
    __cReference: true,
    get value() { return ONFIRE____header_global_bff45061321dbd89; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:795
export const ONFIRESMOKE____header_global_2e68356ab714ca5c = ((((((5143) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a360f941d7375fe721b1ecd7() {
  return __cxx_static_address_a360f941d7375fe721b1ecd7.reference || (__cxx_static_address_a360f941d7375fe721b1ecd7.reference = {
    __cReference: true,
    get value() { return ONFIRESMOKE____header_global_2e68356ab714ca5c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:796
export const BURNEDCORPSE____header_global_b96ce7d301d131b7 = ((((((5173) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3fbde0123c2753967be14106() {
  return __cxx_static_address_3fbde0123c2753967be14106.reference || (__cxx_static_address_3fbde0123c2753967be14106.reference = {
    __cReference: true,
    get value() { return BURNEDCORPSE____header_global_b96ce7d301d131b7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:797
export const WHISPYSMOKE____header_global_84771c4901b1044b = ((((((5268) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_86df01a6fcb9e37dd7492edc() {
  return __cxx_static_address_86df01a6fcb9e37dd7492edc.reference || (__cxx_static_address_86df01a6fcb9e37dd7492edc.reference = {
    __cReference: true,
    get value() { return WHISPYSMOKE____header_global_84771c4901b1044b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:798
export const FIREFLY____header_global_f7b08a075c269519 = ((((((5180) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1c924f09a9e0ddbbf6047db9() {
  return __cxx_static_address_1c924f09a9e0ddbbf6047db9.reference || (__cxx_static_address_1c924f09a9e0ddbbf6047db9.reference = {
    __cReference: true,
    get value() { return FIREFLY____header_global_f7b08a075c269519; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:799
export const FIREFLYSHRINKEFFECT____header_global_766620762f3def9a = ((((((5360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d97e99805e547690fc953822() {
  return __cxx_static_address_d97e99805e547690fc953822.reference || (__cxx_static_address_d97e99805e547690fc953822.reference = {
    __cReference: true,
    get value() { return FIREFLYSHRINKEFFECT____header_global_766620762f3def9a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:800
export const FIREFLYGROWEFFECT____header_global_f3567945dbde6cc6 = ((((((5367) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cf5380184c049956f3f47509() {
  return __cxx_static_address_cf5380184c049956f3f47509.reference || (__cxx_static_address_cf5380184c049956f3f47509.reference = {
    __cReference: true,
    get value() { return FIREFLYGROWEFFECT____header_global_f3567945dbde6cc6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:801
export const FIREFLYFLYINGEFFECT____header_global_bf841979afffcce5 = ((((((5296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_447747a9bb9cf8386114a461() {
  return __cxx_static_address_447747a9bb9cf8386114a461.reference || (__cxx_static_address_447747a9bb9cf8386114a461.reference = {
    __cReference: true,
    get value() { return FIREFLYFLYINGEFFECT____header_global_bf841979afffcce5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:802
export const BOSS5____header_global_37c3793f5e29d1b8 = ((((((5310) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_450203887d93c8c919f310de() {
  return __cxx_static_address_450203887d93c8c919f310de.reference || (__cxx_static_address_450203887d93c8c919f310de.reference = {
    __cReference: true,
    get value() { return BOSS5____header_global_37c3793f5e29d1b8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:803
export const BOSS5STAYPUT____header_global_6d7a7df55969c509 = ((((((5311) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_404116e860c35b920e1e6588() {
  return __cxx_static_address_404116e860c35b920e1e6588.reference || (__cxx_static_address_404116e860c35b920e1e6588.reference = {
    __cReference: true,
    get value() { return BOSS5STAYPUT____header_global_6d7a7df55969c509; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:804
export const LAVAPOOL____header_global_c667fbe50a27d846 = ((((((5304) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_710877081dce822057ce64a0() {
  return __cxx_static_address_710877081dce822057ce64a0.reference || (__cxx_static_address_710877081dce822057ce64a0.reference = {
    __cReference: true,
    get value() { return LAVAPOOL____header_global_c667fbe50a27d846; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:805
export const LAVASPLASH____header_global_f468f278dde76924 = ((((((5371) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_871157dd77e5cfc3f1614182() {
  return __cxx_static_address_871157dd77e5cfc3f1614182.reference || (__cxx_static_address_871157dd77e5cfc3f1614182.reference = {
    __cReference: true,
    get value() { return LAVASPLASH____header_global_f468f278dde76924; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:806
export const LAVAPOOLBUBBLE____header_global_332a72887c0efa6d = ((((((5207) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_92f965ee17abcec518a7a150() {
  return __cxx_static_address_92f965ee17abcec518a7a150.reference || (__cxx_static_address_92f965ee17abcec518a7a150.reference = {
    __cReference: true,
    get value() { return LAVAPOOLBUBBLE____header_global_332a72887c0efa6d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:807
export const BOSS2STAYPUT____header_global_ba432771935082fa = ((((((2711) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0e24f351b71c43e3594188e3() {
  return __cxx_static_address_0e24f351b71c43e3594188e3.reference || (__cxx_static_address_0e24f351b71c43e3594188e3.reference = {
    __cReference: true,
    get value() { return BOSS2STAYPUT____header_global_ba432771935082fa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:808
export const BOSS3STAYPUT____header_global_81afa95bb91c7174 = ((((((2761) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_251d27f319bba15ab77f7b5a() {
  return __cxx_static_address_251d27f319bba15ab77f7b5a.reference || (__cxx_static_address_251d27f319bba15ab77f7b5a.reference = {
    __cReference: true,
    get value() { return BOSS3STAYPUT____header_global_81afa95bb91c7174; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:809
export const E32_TILE5736____header_global_92d146b37b8b1aff = ((((((5736) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2e89c318532288ee92c33891() {
  return __cxx_static_address_2e89c318532288ee92c33891.reference || (__cxx_static_address_2e89c318532288ee92c33891.reference = {
    __cReference: true,
    get value() { return E32_TILE5736____header_global_92d146b37b8b1aff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:810
export const E32_TILE5737____header_global_6e80277b6abb3255 = ((((((5737) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e2611e73310ea9e72ccb3ee2() {
  return __cxx_static_address_e2611e73310ea9e72ccb3ee2.reference || (__cxx_static_address_e2611e73310ea9e72ccb3ee2.reference = {
    __cReference: true,
    get value() { return E32_TILE5737____header_global_6e80277b6abb3255; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:811
export const E32_TILE5846____header_global_8ebf579ff242fde1 = ((((((5846) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cfe0e6e199b7c195b91453a2() {
  return __cxx_static_address_cfe0e6e199b7c195b91453a2.reference || (__cxx_static_address_cfe0e6e199b7c195b91453a2.reference = {
    __cReference: true,
    get value() { return E32_TILE5846____header_global_8ebf579ff242fde1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/network.h:180
export const cSnapshotMemUsage__header_global_9b9e9550655b5ee5 = u64((BigInt(u64(64)) * BigInt((BigInt((BigInt((BigInt(72) * BigInt(u64(16384)))) + BigInt((BigInt(96) * BigInt(u64(4096)))))) + BigInt((BigInt(296) * BigInt(u64(16384))))))));
function __cxx_static_address_8957673d84b6afc984f06a9a() {
  return __cxx_static_address_8957673d84b6afc984f06a9a.reference || (__cxx_static_address_8957673d84b6afc984f06a9a.reference = {
    __cReference: true,
    get value() { return cSnapshotMemUsage__header_global_9b9e9550655b5ee5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/clockticks.hpp:20
export function ClockTicks() {
  return ClockTicks.type || (ClockTicks.type = class ClockTicks__implementation {
  static VALUE_MASK = u64(18446744073709486080n);
  static WHOLE_MASK = u64(18446744069414584320n);
  static FRACTION_MASK = u64(4294901760n);
  static FRACTION_16_MASK = u64(65535n);
  constructor() { throw new TypeError("Clang-selected constructor factory required"); }
  __cxx_construct_3fdb0b4b21c3726c() {
    this.__cxx_construct_24afc02e52dafee1(0, u32(0));
    
  }
  static __cxx_construct_3fdb0b4b21c3726c() {
    const value=Object.create(ClockTicks__implementation.prototype);
    value.__cxx_construct_3fdb0b4b21c3726c();
    return value;
  }
  __cxx_construct_8716ed38f1dfa06d(ticks) {
    this.__cxx_construct_24afc02e52dafee1(ticks, u32(0));
    
  }
  static __cxx_construct_8716ed38f1dfa06d(ticks) {
    const value=Object.create(ClockTicks__implementation.prototype);
    value.__cxx_construct_8716ed38f1dfa06d(ticks);
    return value;
  }
  __cxx_construct_24afc02e52dafee1(ticks, fraction) {
        this.set(ticks, ((fraction) & 65535));
  }
  static __cxx_construct_24afc02e52dafee1(ticks, fraction) {
    const value=Object.create(ClockTicks__implementation.prototype);
    value.__cxx_construct_24afc02e52dafee1(ticks, fraction);
    return value;
  }
  getFraction() {
    return i64((BigInt((BigInt((BigInt(u64(this.ticksS32)) & BigInt(ClockTicks__implementation.FRACTION_MASK))) >> BigInt(16))) | BigInt(((this.ticksS32 < i64(0)) ? ClockTicks__implementation.VALUE_MASK : u64(0)))));
  }
  setFraction(fraction) {
    return i64((this.ticksS32 = i64((BigInt((BigInt(u64(this.ticksS32)) & BigInt(ClockTicks__implementation.WHOLE_MASK))) | BigInt((BigInt(((this.ticksS32 < i64(0)) ? (BigInt(u64((BigInt(i64(0)) - BigInt(i64(fraction))))) & BigInt(ClockTicks__implementation.FRACTION_16_MASK)) : u64(fraction))) << BigInt(16)))))));
  }
  set(ticks, fraction) {
    (this.ticksS32 = i64((BigInt((BigInt(u64(ticks)) << BigInt(32))) | BigInt((BigInt(((ticks < 0) ? (BigInt(u64((BigInt(i64(0)) - BigInt(i64(fraction))))) & BigInt(ClockTicks__implementation.FRACTION_16_MASK)) : u64(fraction))) << BigInt(16))))));
    this.update();
    return i64(this.ticksS32);
  }
  toScale16() {
    return i64((BigInt(this.ticksS32) >> BigInt(16)));
  }
  setFromScale16(ticksScale16) {
    (this.ticksS32 = i64((BigInt(ticksScale16) << BigInt(16))));
    this.update();
    return this;
  }
  static fromScale16(ticksScale16) {
    let ct = (ClockTicks()).__cxx_construct_3fdb0b4b21c3726c();
    ct.setFromScale16(ticksScale16);
    return cCopyTrivialClass(ct, ClockTicks(), ["wholeTicks", "ticksS32"]);
  }
  static compareHighPrecision(a, b) {
    let delta = cCopyTrivialClass(__cxx_operator_761c63d1e16e183f(cCopyTrivialClass(a, ClockTicks(), ["wholeTicks", "ticksS32"]), b), ClockTicks(), ["wholeTicks", "ticksS32"]);
    return i64(delta.toScale16());
  }
  __cxx_operator_d644da4c0f0f209b(rhs) {
    (this.ticksS32 = i64(rhs.ticksS32));
    this.update();
    return this;
  }
  __cxx_operator_c4f1fab776aa8f78(rhs) {
    ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = i64((BigInt(__cxx_lvalue_0.value) + BigInt(rhs.ticksS32)))))(cObjectFieldRef(this, "ticksS32"));
    this.update();
    return this;
  }
  __cxx_operator_86b05ee676890126(rhs) {
    ((__cxx_lvalue_1) => (__cxx_lvalue_1.value = i64((BigInt(__cxx_lvalue_1.value) - BigInt(rhs.ticksS32)))))(cObjectFieldRef(this, "ticksS32"));
    this.update();
    return this;
  }
  __cxx_operator_8bf84e02da7f2596(rhs) {
    (this.ticksS32 = i64((BigInt((BigInt((BigInt(this.ticksS32) >> BigInt(16))) * BigInt((BigInt(rhs.ticksS32) >> BigInt(16))))) >> BigInt(16))));
    this.update();
    return this;
  }
  __cxx_operator_8ed849f2ef870086(rhs) {
    (this.ticksS32 = i64((BigInt((BigInt(this.ticksS32) / BigInt(rhs.ticksS32))) << BigInt(32))));
    this.update();
    return this;
  }
  __cxx_operator_1260acd8fbd617cf(rhs) {
    ((__cxx_lvalue_2) => (__cxx_lvalue_2.value = i64((BigInt(__cxx_lvalue_2.value) % BigInt(rhs.ticksS32)))))(cObjectFieldRef(this, "ticksS32"));
    this.update();
    return this;
  }
  __cxx_operator_2418cc007f602d0f(rhs) {
    (this.ticksS32 = i64((BigInt(this.ticksS32) << BigInt(rhs))));
    this.update();
    return this;
  }
  __cxx_operator_000dfeca36713f18(rhs) {
    (this.ticksS32 = i64((BigInt(this.ticksS32) >> BigInt(rhs))));
    this.update();
    return this;
  }
  __cxx_conversion_e40fd0a4454cd7ec() {
    return u32(this.wholeTicks);
  }
  __cxx_conversion_d67101e1f7110e32() {
    return i32(this.wholeTicks);
  }
  update() {
    (this.wholeTicks = i32((BigInt(this.ticksS32) >> BigInt(32))));
    ((__cxx_lvalue_3) => (__cxx_lvalue_3.value = i64((BigInt(__cxx_lvalue_3.value) & BigInt(ClockTicks__implementation.VALUE_MASK)))))(cObjectFieldRef(this, "ticksS32"));
  }
});
}

// C/C++ source: source/duke3d/src/menus.h:528
export function MenuGameplayEntry() {
  return MenuGameplayEntry.type || (MenuGameplayEntry.type = class MenuGameplayEntry__implementation {
  constructor() {
    this.name = undefined;
    this.flags = undefined;
    this.subentries = undefined;
  }
  isValid() {
    return Boolean((i32((cDeref(cPointerOffset(this.name, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) != i32(0)));
  }
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

// C/C++ source: source/duke3d/src/savegame.h:41
export function _savehead() {
  return _savehead.type || (_savehead.type = class _savehead__implementation {
  constructor() {
    this.headerstr = undefined;
    this.majorver = undefined;
    this.minorver = undefined;
    this.ptrsize = undefined;
    this.bytever = undefined;
    this.userbytever = undefined;
    this.filler = undefined;
    this.health = undefined;
    this.comprthres = undefined;
    this.recdiffsp = undefined;
    this.diffcompress = undefined;
    this.synccompress = undefined;
    this.reccnt = undefined;
    this.snapsiz = undefined;
    this.savename = undefined;
    this.numplayers = undefined;
    this.volnum = undefined;
    this.levnum = undefined;
    this.skill = undefined;
    this.boardfn = undefined;
    this.scriptname = undefined;
  }
  getPtrSize() {
    return ((((u32((u32(this.ptrsize) & 127))) & 255)) & 255);
  }
  isAutoSave() {
    return Boolean((!(!Boolean(u32((u32(this.ptrsize) & u32((1 << 7))))))));
  }
});
}

// C/C++ source: source/duke3d/src/savegame.h:76
export function savebrief_t() {
  return savebrief_t.type || (savebrief_t.type = class savebrief_t__implementation {
  constructor() { throw new TypeError("Clang-selected constructor factory required"); }
  __cxx_construct_3fdb0b4b21c3726c() {
    this.name = cZeroAggregate({"array": "Uint8Array", "dims": [32]});
    this.path = cZeroAggregate({"array": "Uint8Array", "dims": [256]});
    this.isExt = ((0) & 255);
        this.reset();
  }
  static __cxx_construct_3fdb0b4b21c3726c() {
    const value=Object.create(savebrief_t__implementation.prototype);
    value.__cxx_construct_3fdb0b4b21c3726c();
    return value;
  }
  __cxx_construct_7ae821b1161120a7(n) {
    this.name = cZeroAggregate({"array": "Uint8Array", "dims": [32]});
    this.path = cZeroAggregate({"array": "Uint8Array", "dims": [256]});
    this.isExt = ((0) & 255);
        cByteMemory.strncpy(this.name, n, u64(i32((32 - 1))));
    ((cDeref(cPointerOffset(this.path, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = ((0) & 255));
  }
  static __cxx_construct_7ae821b1161120a7(n) {
    const value=Object.create(savebrief_t__implementation.prototype);
    value.__cxx_construct_7ae821b1161120a7(n);
    return value;
  }
  reset() {
    ((cDeref(cPointerOffset(this.name, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = ((0) & 255));
    ((cDeref(cPointerOffset(this.path, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = ((0) & 255));
    (this.isExt = ((((0) & 255)) & 255));
  }
  isValid() {
    return Boolean((i32((cDeref(cPointerOffset(this.path, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) != i32(0)));
  }
});
}

// C/C++ source: source/duke3d/src/menus.cpp:536
export class resolution_t {
  constructor() {
    this.xdim = undefined;
    this.ydim = undefined;
    this.flags = undefined;
    this.bppmax = undefined;
    this.name = undefined;
  }
}

// C/C++ source: source/duke3d/src/menus.cpp:42
export let droidinput = cZeroAggregate({"record": {"crouchToggleState": {"scalar": "int"}, "forward_sens": {"scalar": "float"}, "forwardmove": {"scalar": "float"}, "functionHeld": {"scalar": "unsigned long"}, "functionSticky": {"scalar": "unsigned long"}, "gameControlsAlpha": {"scalar": "float"}, "hideStick": {"scalar": "int"}, "invertLook": {"scalar": "int"}, "lastWeapon": {"scalar": "int"}, "left_double_action": {"scalar": "int"}, "pitch": {"scalar": "double"}, "pitch_joystick": {"scalar": "double"}, "pitch_sens": {"scalar": "float"}, "quickSelectWeapon": {"scalar": "int"}, "right_double_action": {"scalar": "int"}, "sidemove": {"scalar": "float"}, "strafe_sens": {"scalar": "float"}, "toggleCrouch": {"scalar": "int"}, "yaw": {"scalar": "double"}, "yaw_joystick": {"scalar": "double"}, "yaw_sens": {"scalar": "float"}}});
export function __cxx_global_cell_7615b8a03591f7c928e9c41c() {
  return __cxx_global_cell_7615b8a03591f7c928e9c41c.reference || (__cxx_global_cell_7615b8a03591f7c928e9c41c.reference = {
    __cReference: true,
    get value() { return droidinput; },
    set value(__cxx_lvalue_0) { throw new TypeError("record address cannot replace original object storage"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:66
export function Menu_StopTextInput() {

}

// C/C++ source: source/duke3d/src/menus.cpp:111
export let savehead = cMarkAggregate(Object.assign(Object.create(_savehead().prototype), ({"headerstr": cZeroAggregate({"array": "Uint8Array", "dims": [11]}), "majorver": cZeroAggregate({"scalar": "unsigned char"}), "minorver": cZeroAggregate({"scalar": "unsigned char"}), "ptrsize": cZeroAggregate({"scalar": "unsigned char"}), "bytever": cZeroAggregate({"scalar": "unsigned short"}), "userbytever": cZeroAggregate({"scalar": "unsigned int"}), "filler": cZeroAggregate({"array": "Uint8Array", "dims": [2]}), "health": cZeroAggregate({"scalar": "short"}), "comprthres": cZeroAggregate({"scalar": "unsigned char"}), "recdiffsp": cZeroAggregate({"scalar": "unsigned char"}), "diffcompress": cZeroAggregate({"scalar": "unsigned char"}), "synccompress": cZeroAggregate({"scalar": "unsigned char"}), "reccnt": cZeroAggregate({"scalar": "int"}), "snapsiz": cZeroAggregate({"scalar": "int"}), "savename": cZeroAggregate({"array": "Uint8Array", "dims": [32]}), "numplayers": cZeroAggregate({"scalar": "unsigned char"}), "volnum": cZeroAggregate({"scalar": "unsigned char"}), "levnum": cZeroAggregate({"scalar": "unsigned char"}), "skill": cZeroAggregate({"scalar": "unsigned char"}), "boardfn": cZeroAggregate({"array": "Uint8Array", "dims": [224]}), "scriptname": cZeroAggregate({"array": "Uint8Array", "dims": [32]})})));
function __cxx_static_address_2aa3d8653c9aee3535f67b37() {
  return __cxx_static_address_2aa3d8653c9aee3535f67b37.reference || (__cxx_static_address_2aa3d8653c9aee3535f67b37.reference = {
    __cReference: true,
    get value() { return savehead; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:119
export const TopBarY = i32((19 << 16));
function __cxx_static_address_39a6a0c8c8e2cacf519df7bb() {
  return __cxx_static_address_39a6a0c8c8e2cacf519df7bb.reference || (__cxx_static_address_39a6a0c8c8e2cacf519df7bb.reference = {
    __cReference: true,
    get value() { return TopBarY; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:193
export let g_oldSaveCnt = 0;
function __cxx_static_address_f965850dbb83132dedd5881b() {
  return __cxx_static_address_f965850dbb83132dedd5881b.reference || (__cxx_static_address_f965850dbb83132dedd5881b.reference = {
    __cReference: true,
    get value() { return g_oldSaveCnt; },
    set value(__cxx_lvalue_0) { g_oldSaveCnt = ((__cxx_lvalue_0) & 65535); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:211
export let g_MenuGameplayEntries = Array.from({length:7}, () => cMarkAggregate(Object.assign(Object.create(MenuGameplayEntry().prototype), ({"name": cZeroAggregate({"array": "Uint8Array", "dims": [64]}), "flags": cZeroAggregate({"scalar": "unsigned char"}), "subentries": cZeroAggregate({"pointer": true})}))));
function __cxx_static_address_a85658b3040c3e5870eff26e() {
  return __cxx_static_address_a85658b3040c3e5870eff26e.reference || (__cxx_static_address_a85658b3040c3e5870eff26e.reference = {
    __cReference: true,
    get value() { return g_MenuGameplayEntries; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:229
export let MMF_Top_Main = cMarkAggregate(({"pos": cMarkAggregate(({"x": i32((160 << 16)), "y": i32((55 << 16))})), "bottomcutoff": (-i32((170 << 16)))}));
function __cxx_static_address_4cc89417efb3d0267f6f680f() {
  return __cxx_static_address_4cc89417efb3d0267f6f680f.reference || (__cxx_static_address_4cc89417efb3d0267f6f680f.reference = {
    __cReference: true,
    get value() { return MMF_Top_Main; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:230
export let MMF_Top_Episode = cMarkAggregate(({"pos": cMarkAggregate(({"x": i32((160 << 16)), "y": i32((48 << 16))})), "bottomcutoff": (-i32((190 << 16)))}));
function __cxx_static_address_7dde0a120006e220b160b577() {
  return __cxx_static_address_7dde0a120006e220b160b577.reference || (__cxx_static_address_7dde0a120006e220b160b577.reference = {
    __cReference: true,
    get value() { return MMF_Top_Episode; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:231
export let MMF_Top_NewGameCustom = cMarkAggregate(({"pos": cMarkAggregate(({"x": i32((160 << 16)), "y": i32((48 << 16))})), "bottomcutoff": (-i32((190 << 16)))}));
function __cxx_static_address_347cc43ca1ae567d3f4e05de() {
  return __cxx_static_address_347cc43ca1ae567d3f4e05de.reference || (__cxx_static_address_347cc43ca1ae567d3f4e05de.reference = {
    __cReference: true,
    get value() { return MMF_Top_NewGameCustom; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:232
export let MMF_Top_NewGameCustomSub = cMarkAggregate(({"pos": cMarkAggregate(({"x": i32((160 << 16)), "y": i32((48 << 16))})), "bottomcutoff": (-i32((190 << 16)))}));
function __cxx_static_address_e43b75b05ecc3a4ef3449828() {
  return __cxx_static_address_e43b75b05ecc3a4ef3449828.reference || (__cxx_static_address_e43b75b05ecc3a4ef3449828.reference = {
    __cReference: true,
    get value() { return MMF_Top_NewGameCustomSub; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:233
export let MMF_Top_NewGameCustomL3 = cMarkAggregate(({"pos": cMarkAggregate(({"x": i32((160 << 16)), "y": i32((48 << 16))})), "bottomcutoff": (-i32((190 << 16)))}));
function __cxx_static_address_129274f1ccd1531dfd98e0f1() {
  return __cxx_static_address_129274f1ccd1531dfd98e0f1.reference || (__cxx_static_address_129274f1ccd1531dfd98e0f1.reference = {
    __cReference: true,
    get value() { return MMF_Top_NewGameCustomL3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:234
export let MMF_Top_Skill = cMarkAggregate(({"pos": cMarkAggregate(({"x": i32((160 << 16)), "y": i32((58 << 16))})), "bottomcutoff": (-i32((190 << 16)))}));
function __cxx_static_address_017e8f47ea0ef4dbc06999ff() {
  return __cxx_static_address_017e8f47ea0ef4dbc06999ff.reference || (__cxx_static_address_017e8f47ea0ef4dbc06999ff.reference = {
    __cReference: true,
    get value() { return MMF_Top_Skill; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:235
export let MMF_Top_Options = cMarkAggregate(({"pos": cMarkAggregate(({"x": i32((160 << 16)), "y": i32((38 << 16))})), "bottomcutoff": (-i32((190 << 16)))}));
function __cxx_static_address_c7a0391c626a87e506548210() {
  return __cxx_static_address_c7a0391c626a87e506548210.reference || (__cxx_static_address_c7a0391c626a87e506548210.reference = {
    __cReference: true,
    get value() { return MMF_Top_Options; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:236
export let MMF_Top_Joystick_Network = cMarkAggregate(({"pos": cMarkAggregate(({"x": i32((160 << 16)), "y": i32((70 << 16))})), "bottomcutoff": (-i32((190 << 16)))}));
function __cxx_static_address_88bd93c12006f83fcd91e4cf() {
  return __cxx_static_address_88bd93c12006f83fcd91e4cf.reference || (__cxx_static_address_88bd93c12006f83fcd91e4cf.reference = {
    __cReference: true,
    get value() { return MMF_Top_Joystick_Network; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_f0f721d14cb703e0 = i32(2147483647);
function __cxx_static_address_7420a6baa124e05efd5bd48a() {
  return __cxx_static_address_7420a6baa124e05efd5bd48a.reference || (__cxx_static_address_7420a6baa124e05efd5bd48a.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_f0f721d14cb703e0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_745bef4c752cb49c = i32(2147483648);
function __cxx_static_address_54193386ce95d9d93bb4aa4e() {
  return __cxx_static_address_54193386ce95d9d93bb4aa4e.reference || (__cxx_static_address_54193386ce95d9d93bb4aa4e.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_745bef4c752cb49c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_aa91dfc286038e9e = i32(2147483648);
function __cxx_static_address_7f1283fc316f85ecb772991d() {
  return __cxx_static_address_7f1283fc316f85ecb772991d.reference || (__cxx_static_address_7f1283fc316f85ecb772991d.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_aa91dfc286038e9e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_41abef7cf8cb6486 = i32(65536);
function __cxx_static_address_ad69473a198cb1128dbdd538() {
  return __cxx_static_address_ad69473a198cb1128dbdd538.reference || (__cxx_static_address_ad69473a198cb1128dbdd538.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_41abef7cf8cb6486; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_ec8f84104408e1f8 = i32(32768);
function __cxx_static_address_08ffb78c56ae77473acc86fb() {
  return __cxx_static_address_08ffb78c56ae77473acc86fb.reference || (__cxx_static_address_08ffb78c56ae77473acc86fb.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_ec8f84104408e1f8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_b15822a1a6c0b331 = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_8ae4bf85bba18b3083736bcc() {
  return __cxx_static_address_8ae4bf85bba18b3083736bcc.reference || (__cxx_static_address_8ae4bf85bba18b3083736bcc.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_b15822a1a6c0b331; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:237
export let MMF_BigOptions = cMarkAggregate(({"pos": cMarkAggregate(({"x": i32((32 << 16)), "y": i32((38 << 16))})), "bottomcutoff": (-i32((190 << 16)))}));
function __cxx_static_address_66691c696dc8f179b4704115() {
  return __cxx_static_address_66691c696dc8f179b4704115.reference || (__cxx_static_address_66691c696dc8f179b4704115.reference = {
    __cReference: true,
    get value() { return MMF_BigOptions; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:241
export let MMF_SmallOptions = cMarkAggregate(({"pos": cMarkAggregate(({"x": i32((32 << 16)), "y": i32((37 << 16))})), "bottomcutoff": i32((170 << 16))}));
function __cxx_static_address_7fded45cabff4be016261c91() {
  return __cxx_static_address_7fded45cabff4be016261c91.reference || (__cxx_static_address_7fded45cabff4be016261c91.reference = {
    __cReference: true,
    get value() { return MMF_SmallOptions; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:242
export let MMF_Macros = cMarkAggregate(({"pos": cMarkAggregate(({"x": i32((26 << 16)), "y": i32((40 << 16))})), "bottomcutoff": i32((160 << 16))}));
function __cxx_static_address_8dd20b9c842ebc6d8ee69f62() {
  return __cxx_static_address_8dd20b9c842ebc6d8ee69f62.reference || (__cxx_static_address_8dd20b9c842ebc6d8ee69f62.reference = {
    __cReference: true,
    get value() { return MMF_Macros; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:243
export let MMF_SmallOptionsNarrow = cMarkAggregate(({"pos": cMarkAggregate(({"x": i32((40 << 16)), "y": i32((38 << 16))})), "bottomcutoff": (-i32((190 << 16)))}));
function __cxx_static_address_a1cab4e3db3ff3f2309cd3ea() {
  return __cxx_static_address_a1cab4e3db3ff3f2309cd3ea.reference || (__cxx_static_address_a1cab4e3db3ff3f2309cd3ea.reference = {
    __cReference: true,
    get value() { return MMF_SmallOptionsNarrow; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:244
export let MMF_KeyboardSetupFuncs = cMarkAggregate(({"pos": cMarkAggregate(({"x": i32((50 << 16)), "y": i32((34 << 16))})), "bottomcutoff": i32((183 << 16))}));
function __cxx_static_address_3b901081a60f4291ad4eef1e() {
  return __cxx_static_address_3b901081a60f4291ad4eef1e.reference || (__cxx_static_address_3b901081a60f4291ad4eef1e.reference = {
    __cReference: true,
    get value() { return MMF_KeyboardSetupFuncs; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:245
export let MMF_MouseJoySetupBtns = cMarkAggregate(({"pos": cMarkAggregate(({"x": i32((76 << 16)), "y": i32((34 << 16))})), "bottomcutoff": i32((183 << 16))}));
function __cxx_static_address_4cbe13ea203ef5b2c276ab90() {
  return __cxx_static_address_4cbe13ea203ef5b2c276ab90.reference || (__cxx_static_address_4cbe13ea203ef5b2c276ab90.reference = {
    __cReference: true,
    get value() { return MMF_MouseJoySetupBtns; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:246
export let MMF_FuncList = cMarkAggregate(({"pos": cMarkAggregate(({"x": i32((100 << 16)), "y": i32((51 << 16))})), "bottomcutoff": i32((152 << 16))}));
function __cxx_static_address_8669d0a7f75a4a55ab692c5f() {
  return __cxx_static_address_8669d0a7f75a4a55ab692c5f.reference || (__cxx_static_address_8669d0a7f75a4a55ab692c5f.reference = {
    __cReference: true,
    get value() { return MMF_FuncList; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:247
export let MMF_ColorCorrect = cMarkAggregate(({"pos": cMarkAggregate(({"x": i32((32 << 16)), "y": i32((86 << 16))})), "bottomcutoff": i32((190 << 16))}));
function __cxx_static_address_576cbac6deb70e2764980742() {
  return __cxx_static_address_576cbac6deb70e2764980742.reference || (__cxx_static_address_576cbac6deb70e2764980742.reference = {
    __cReference: true,
    get value() { return MMF_ColorCorrect; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:248
export let MMF_BigSliders = cMarkAggregate(({"pos": cMarkAggregate(({"x": i32((32 << 16)), "y": i32((37 << 16))})), "bottomcutoff": i32((190 << 16))}));
function __cxx_static_address_ace043e84a9781ffb039949f() {
  return __cxx_static_address_ace043e84a9781ffb039949f.reference || (__cxx_static_address_ace043e84a9781ffb039949f.reference = {
    __cReference: true,
    get value() { return MMF_BigSliders; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:249
export let MMF_LoadSave = cMarkAggregate(({"pos": cMarkAggregate(({"x": i32((200 << 16)), "y": i32((49 << 16))})), "bottomcutoff": i32((180 << 16))}));
function __cxx_static_address_6c1d90c4adee6e57352563f6() {
  return __cxx_static_address_6c1d90c4adee6e57352563f6.reference || (__cxx_static_address_6c1d90c4adee6e57352563f6.reference = {
    __cReference: true,
    get value() { return MMF_LoadSave; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:250
export let MMF_NetSetup = cMarkAggregate(({"pos": cMarkAggregate(({"x": i32((36 << 16)), "y": i32((38 << 16))})), "bottomcutoff": i32((190 << 16))}));
function __cxx_static_address_739f81f2d0219d36f3f442fd() {
  return __cxx_static_address_739f81f2d0219d36f3f442fd.reference || (__cxx_static_address_739f81f2d0219d36f3f442fd.reference = {
    __cReference: true,
    get value() { return MMF_NetSetup; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:251
export let MMF_FileSelectLeft = cMarkAggregate(({"pos": cMarkAggregate(({"x": i32((40 << 16)), "y": i32((45 << 16))})), "bottomcutoff": i32((162 << 16))}));
function __cxx_static_address_9ca92bcbf229b963674e7210() {
  return __cxx_static_address_9ca92bcbf229b963674e7210.reference || (__cxx_static_address_9ca92bcbf229b963674e7210.reference = {
    __cReference: true,
    get value() { return MMF_FileSelectLeft; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:252
export let MMF_FileSelectRight = cMarkAggregate(({"pos": cMarkAggregate(({"x": i32((164 << 16)), "y": i32((45 << 16))})), "bottomcutoff": i32((162 << 16))}));
function __cxx_static_address_d227ce220053601a55d5e585() {
  return __cxx_static_address_d227ce220053601a55d5e585.reference || (__cxx_static_address_d227ce220053601a55d5e585.reference = {
    __cReference: true,
    get value() { return MMF_FileSelectRight; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:254
export let MEF_Null = cMarkAggregate(({"marginBottom": 0, "indent": 0, "width": 0}));
function __cxx_static_address_854d4068b143474b77cdd1e6() {
  return __cxx_static_address_854d4068b143474b77cdd1e6.reference || (__cxx_static_address_854d4068b143474b77cdd1e6.reference = {
    __cReference: true,
    get value() { return MEF_Null; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:255
export let MEF_MainMenu = cMarkAggregate(({"marginBottom": i32((4 << 16)), "indent": 0, "width": 0}));
function __cxx_static_address_a5286a1b9eba53c09920f6ec() {
  return __cxx_static_address_a5286a1b9eba53c09920f6ec.reference || (__cxx_static_address_a5286a1b9eba53c09920f6ec.reference = {
    __cReference: true,
    get value() { return MEF_MainMenu; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:256
export let MEF_OptionsMenu = cMarkAggregate(({"marginBottom": i32((7 << 16)), "indent": 0, "width": 0}));
function __cxx_static_address_318f351bf880431d39dfada0() {
  return __cxx_static_address_318f351bf880431d39dfada0.reference || (__cxx_static_address_318f351bf880431d39dfada0.reference = {
    __cReference: true,
    get value() { return MEF_OptionsMenu; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:257
export let MEF_LeftMenu = cMarkAggregate(({"marginBottom": i32((7 << 16)), "indent": 0, "width": i32((120 << 16))}));
function __cxx_static_address_6ed3b45a9e856952cd7f675c() {
  return __cxx_static_address_6ed3b45a9e856952cd7f675c.reference || (__cxx_static_address_6ed3b45a9e856952cd7f675c.reference = {
    __cReference: true,
    get value() { return MEF_LeftMenu; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:258
export let MEF_CenterMenu = cMarkAggregate(({"marginBottom": i32((7 << 16)), "indent": 0, "width": 0}));
function __cxx_static_address_7eaf21f547b44f5003fb517f() {
  return __cxx_static_address_7eaf21f547b44f5003fb517f.reference || (__cxx_static_address_7eaf21f547b44f5003fb517f.reference = {
    __cReference: true,
    get value() { return MEF_CenterMenu; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:259
export let MEF_BigOptions_Apply = cMarkAggregate(({"marginBottom": i32((4 << 16)), "indent": i32((16 << 16)), "width": (-i32((260 << 16)))}));
function __cxx_static_address_4067fd716defb5d65afc6c88() {
  return __cxx_static_address_4067fd716defb5d65afc6c88.reference || (__cxx_static_address_4067fd716defb5d65afc6c88.reference = {
    __cReference: true,
    get value() { return MEF_BigOptions_Apply; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:260
export let MEF_BigOptionsRt = cMarkAggregate(({"marginBottom": i32((4 << 16)), "indent": 0, "width": (-i32((260 << 16)))}));
function __cxx_static_address_7d138545321da0e5dde7bd56() {
  return __cxx_static_address_7d138545321da0e5dde7bd56.reference || (__cxx_static_address_7d138545321da0e5dde7bd56.reference = {
    __cReference: true,
    get value() { return MEF_BigOptionsRt; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:261
export let MEF_BigOptionsRtSections = cMarkAggregate(({"marginBottom": i32((3 << 16)), "indent": 0, "width": (-i32((260 << 16)))}));
function __cxx_static_address_8bcd262ccc0824686d737c9c() {
  return __cxx_static_address_8bcd262ccc0824686d737c9c.reference || (__cxx_static_address_8bcd262ccc0824686d737c9c.reference = {
    __cReference: true,
    get value() { return MEF_BigOptionsRtSections; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:263
export let MEF_SmallOptions = cMarkAggregate(({"marginBottom": i32((1 << 16)), "indent": 0, "width": (-i32((260 << 16)))}));
function __cxx_static_address_a3597c08b0156767eb7ce504() {
  return __cxx_static_address_a3597c08b0156767eb7ce504.reference || (__cxx_static_address_a3597c08b0156767eb7ce504.reference = {
    __cReference: true,
    get value() { return MEF_SmallOptions; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:265
export let MEF_BigCheats = cMarkAggregate(({"marginBottom": i32((3 << 16)), "indent": 0, "width": (-i32((260 << 16)))}));
function __cxx_static_address_ff295e1374fc3f0888c647da() {
  return __cxx_static_address_ff295e1374fc3f0888c647da.reference || (__cxx_static_address_ff295e1374fc3f0888c647da.reference = {
    __cReference: true,
    get value() { return MEF_BigCheats; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:266
export let MEF_Cheats = cMarkAggregate(({"marginBottom": i32((2 << 16)), "indent": 0, "width": (-i32((260 << 16)))}));
function __cxx_static_address_8a8cde3a1ebf0109bfa49334() {
  return __cxx_static_address_8a8cde3a1ebf0109bfa49334.reference || (__cxx_static_address_8a8cde3a1ebf0109bfa49334.reference = {
    __cReference: true,
    get value() { return MEF_Cheats; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:267
export let MEF_PlayerNarrow = cMarkAggregate(({"marginBottom": i32((1 << 16)), "indent": 0, "width": i32((90 << 16))}));
function __cxx_static_address_3f745560b41992b1cf471a57() {
  return __cxx_static_address_3f745560b41992b1cf471a57.reference || (__cxx_static_address_3f745560b41992b1cf471a57.reference = {
    __cReference: true,
    get value() { return MEF_PlayerNarrow; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:268
export let MEF_Macros = cMarkAggregate(({"marginBottom": i32((2 << 16)), "indent": (-1), "width": i32((268 << 16))}));
function __cxx_static_address_8008ff0c6e33cc8232054a52() {
  return __cxx_static_address_8008ff0c6e33cc8232054a52.reference || (__cxx_static_address_8008ff0c6e33cc8232054a52.reference = {
    __cReference: true,
    get value() { return MEF_Macros; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:269
export let MEF_VideoSetup = cMarkAggregate(({"marginBottom": i32((4 << 16)), "indent": 0, "width": i32((168 << 16))}));
function __cxx_static_address_50092a0620d512ff49ac392c() {
  return __cxx_static_address_50092a0620d512ff49ac392c.reference || (__cxx_static_address_50092a0620d512ff49ac392c.reference = {
    __cReference: true,
    get value() { return MEF_VideoSetup; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:270
export let MEF_VideoSetup_Apply = cMarkAggregate(({"marginBottom": i32((4 << 16)), "indent": i32((16 << 16)), "width": i32((168 << 16))}));
function __cxx_static_address_13b01bdb1e0422f3772cf39c() {
  return __cxx_static_address_13b01bdb1e0422f3772cf39c.reference || (__cxx_static_address_13b01bdb1e0422f3772cf39c.reference = {
    __cReference: true,
    get value() { return MEF_VideoSetup_Apply; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:271
export let MEF_KBFuncList = cMarkAggregate(({"marginBottom": i32((3 << 16)), "indent": 0, "width": (-i32((225 << 16)))}));
function __cxx_static_address_9c7e16f83b8686b9d1499420() {
  return __cxx_static_address_9c7e16f83b8686b9d1499420.reference || (__cxx_static_address_9c7e16f83b8686b9d1499420.reference = {
    __cReference: true,
    get value() { return MEF_KBFuncList; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:272
export let MEF_FuncList = cMarkAggregate(({"marginBottom": i32((3 << 16)), "indent": 0, "width": (-i32((170 << 16)))}));
function __cxx_static_address_c4cdf5c3b19d3dc638cb2cda() {
  return __cxx_static_address_c4cdf5c3b19d3dc638cb2cda.reference || (__cxx_static_address_c4cdf5c3b19d3dc638cb2cda.reference = {
    __cReference: true,
    get value() { return MEF_FuncList; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:273
export let MEF_BigSliders = cMarkAggregate(({"marginBottom": i32((2 << 16)), "indent": 0, "width": (-i32((260 << 16)))}));
function __cxx_static_address_9f3da69b7e390378a3cb1687() {
  return __cxx_static_address_9f3da69b7e390378a3cb1687.reference || (__cxx_static_address_9f3da69b7e390378a3cb1687.reference = {
    __cReference: true,
    get value() { return MEF_BigSliders; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:274
export let MEF_LoadSave = cMarkAggregate(({"marginBottom": i32((2 << 16)), "indent": (-1), "width": i32((78 << 16))}));
function __cxx_static_address_9c7e994a82929a52b2ef88de() {
  return __cxx_static_address_9c7e994a82929a52b2ef88de.reference || (__cxx_static_address_9c7e994a82929a52b2ef88de.reference = {
    __cReference: true,
    get value() { return MEF_LoadSave; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:275
export let MEF_NetSetup = cMarkAggregate(({"marginBottom": i32((4 << 16)), "indent": 0, "width": i32((112 << 16))}));
function __cxx_static_address_85773ada1c8af79b63ed0d87() {
  return __cxx_static_address_85773ada1c8af79b63ed0d87.reference || (__cxx_static_address_85773ada1c8af79b63ed0d87.reference = {
    __cReference: true,
    get value() { return MEF_NetSetup; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:276
export let MEF_NetSetup_Confirm = cMarkAggregate(({"marginBottom": i32((4 << 16)), "indent": i32((16 << 16)), "width": i32((112 << 16))}));
function __cxx_static_address_516ed252dbabdcc4781f4b68() {
  return __cxx_static_address_516ed252dbabdcc4781f4b68.reference || (__cxx_static_address_516ed252dbabdcc4781f4b68.reference = {
    __cReference: true,
    get value() { return MEF_NetSetup_Confirm; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:283
export const MEOSN_OffOn = cPointerArray(2, [Uint8Array.from([79, 102, 102, 0]), Uint8Array.from([79, 110, 0])]);
function __cxx_static_address_57d7949392452471077ee89a() {
  return __cxx_static_address_57d7949392452471077ee89a.reference || (__cxx_static_address_57d7949392452471077ee89a.reference = {
    __cReference: true,
    get value() { return MEOSN_OffOn; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:285
export const MEOSN_OnOff = cPointerArray(2, [Uint8Array.from([79, 110, 0]), Uint8Array.from([79, 102, 102, 0])]);
function __cxx_static_address_59aca69000d5c4861bd448fc() {
  return __cxx_static_address_59aca69000d5c4861bd448fc.reference || (__cxx_static_address_59aca69000d5c4861bd448fc.reference = {
    __cReference: true,
    get value() { return MEOSN_OnOff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:287
export const MEOSN_NoYes = cPointerArray(2, [Uint8Array.from([78, 111, 0]), Uint8Array.from([89, 101, 115, 0])]);
function __cxx_static_address_b29de651b493323056b6610f() {
  return __cxx_static_address_b29de651b493323056b6610f.reference || (__cxx_static_address_b29de651b493323056b6610f.reference = {
    __cReference: true,
    get value() { return MEOSN_NoYes; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:289
export const MEOSN_YesNo = cPointerArray(2, [Uint8Array.from([89, 101, 115, 0]), Uint8Array.from([78, 111, 0])]);
function __cxx_static_address_5b64e04e9ec9414d7e98f8aa() {
  return __cxx_static_address_5b64e04e9ec9414d7e98f8aa.reference || (__cxx_static_address_5b64e04e9ec9414d7e98f8aa.reference = {
    __cReference: true,
    get value() { return MEOSN_YesNo; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:292
export let MenuGameFuncs = Array.from({ length: 63 }, () => new Uint8Array(32));
function __cxx_static_address_f5fb867c7799307ec005a59f() {
  return __cxx_static_address_f5fb867c7799307ec005a59f.reference || (__cxx_static_address_f5fb867c7799307ec005a59f.reference = {
    __cReference: true,
    get value() { return MenuGameFuncs; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:293
export let MenuGameFuncNone = Uint8Array.from([32, 32, 45, 78, 111, 110, 101, 45, 0]);
function __cxx_static_address_88fb4bafeae53d4e94d30dcc() {
  return __cxx_static_address_88fb4bafeae53d4e94d30dcc.reference || (__cxx_static_address_88fb4bafeae53d4e94d30dcc.reference = {
    __cReference: true,
    get value() { return MenuGameFuncNone; },
    set value(__cxx_lvalue_0) { MenuGameFuncNone = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:294
export const MEOSN_Gamefuncs = cPointerArray(64);
function __cxx_static_address_d3702b62ad39e991ee21d1ce() {
  return __cxx_static_address_d3702b62ad39e991ee21d1ce.reference || (__cxx_static_address_d3702b62ad39e991ee21d1ce.reference = {
    __cReference: true,
    get value() { return MEOSN_Gamefuncs; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:295
export let MEOSV_Gamefuncs = new Int32Array(64);
function __cxx_static_address_7f36cb7370c18249d7cfe1ad() {
  return __cxx_static_address_7f36cb7370c18249d7cfe1ad.reference || (__cxx_static_address_7f36cb7370c18249d7cfe1ad.reference = {
    __cReference: true,
    get value() { return MEOSV_Gamefuncs; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:298
export let cvar_kbo_type = i32(1);
export function __cxx_global_cell_b27595a59e6a7536a39b705e() {
  return __cxx_global_cell_b27595a59e6a7536a39b705e.reference || (__cxx_global_cell_b27595a59e6a7536a39b705e.reference = {
    __cReference: true,
    get value() { return cvar_kbo_type; },
    set value(__cxx_lvalue_0) { cvar_kbo_type = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:299
export let cvar_kbconfirm = i32(1);
export function __cxx_global_cell_280dd8883faddb1e096385b6() {
  return __cxx_global_cell_280dd8883faddb1e096385b6.reference || (__cxx_global_cell_280dd8883faddb1e096385b6.reference = {
    __cReference: true,
    get value() { return cvar_kbconfirm; },
    set value(__cxx_lvalue_0) { cvar_kbconfirm = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:301
export let g_lookAxis = i32((-1));
function __cxx_static_address_a6c629ed2e49aaac4ab0a442() {
  return __cxx_static_address_a6c629ed2e49aaac4ab0a442.reference || (__cxx_static_address_a6c629ed2e49aaac4ab0a442.reference = {
    __cReference: true,
    get value() { return g_lookAxis; },
    set value(__cxx_lvalue_0) { g_lookAxis = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:302
export let g_turnAxis = i32((-1));
function __cxx_static_address_9318b12c2253cb6afc9d7e17() {
  return __cxx_static_address_9318b12c2253cb6afc9d7e17.reference || (__cxx_static_address_9318b12c2253cb6afc9d7e17.reference = {
    __cReference: true,
    get value() { return g_turnAxis; },
    set value(__cxx_lvalue_0) { g_turnAxis = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:312
export let MEO_NULL = cMarkAggregate(({"linkID": i32(-2147483648), "animation": 0}));
function __cxx_static_address_eab4a708267f3b0b46928948() {
  return __cxx_static_address_eab4a708267f3b0b46928948.reference || (__cxx_static_address_eab4a708267f3b0b46928948.reference = {
    __cReference: true,
    get value() { return MEO_NULL; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:313
export let MenuCustom = Uint8Array.from([67, 86, 65, 82, 0]);
function __cxx_static_address_9ca00026335670fe9ee708fc() {
  return __cxx_static_address_9ca00026335670fe9ee708fc.reference || (__cxx_static_address_9ca00026335670fe9ee708fc.reference = {
    __cReference: true,
    get value() { return MenuCustom; },
    set value(__cxx_lvalue_0) { MenuCustom = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:345
export const s_NewGame = (() => { const bytes = new Uint8Array(9); bytes.set([78, 101, 119, 32, 71, 97, 109, 101]); return bytes; })();
function __cxx_static_address_a1e8441747156a5aafe7890a() {
  return __cxx_static_address_a1e8441747156a5aafe7890a.reference || (__cxx_static_address_a1e8441747156a5aafe7890a.reference = {
    __cReference: true,
    get value() { return s_NewGame; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:346
export const s_SaveGame = (() => { const bytes = new Uint8Array(10); bytes.set([83, 97, 118, 101, 32, 71, 97, 109, 101]); return bytes; })();
function __cxx_static_address_f7ac2e894105fa82819a1874() {
  return __cxx_static_address_f7ac2e894105fa82819a1874.reference || (__cxx_static_address_f7ac2e894105fa82819a1874.reference = {
    __cReference: true,
    get value() { return s_SaveGame; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:347
export const s_LoadGame = (() => { const bytes = new Uint8Array(10); bytes.set([76, 111, 97, 100, 32, 71, 97, 109, 101]); return bytes; })();
function __cxx_static_address_06c47de4339708d2c7051f64() {
  return __cxx_static_address_06c47de4339708d2c7051f64.reference || (__cxx_static_address_06c47de4339708d2c7051f64.reference = {
    __cReference: true,
    get value() { return s_LoadGame; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:348
export const s_Continue = (() => { const bytes = new Uint8Array(9); bytes.set([67, 111, 110, 116, 105, 110, 117, 101]); return bytes; })();
function __cxx_static_address_659fa5fff313f8ee3fa6a4e6() {
  return __cxx_static_address_659fa5fff313f8ee3fa6a4e6.reference || (__cxx_static_address_659fa5fff313f8ee3fa6a4e6.reference = {
    __cReference: true,
    get value() { return s_Continue; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:349
export const s_Options = (() => { const bytes = new Uint8Array(8); bytes.set([79, 112, 116, 105, 111, 110, 115]); return bytes; })();
function __cxx_static_address_c6c26e8b86f863540c2ba983() {
  return __cxx_static_address_c6c26e8b86f863540c2ba983.reference || (__cxx_static_address_c6c26e8b86f863540c2ba983.reference = {
    __cReference: true,
    get value() { return s_Options; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:350
export const s_Credits = (() => { const bytes = new Uint8Array(8); bytes.set([67, 114, 101, 100, 105, 116, 115]); return bytes; })();
function __cxx_static_address_a0844f6e25ad1df206c07e87() {
  return __cxx_static_address_a0844f6e25ad1df206c07e87.reference || (__cxx_static_address_a0844f6e25ad1df206c07e87.reference = {
    __cReference: true,
    get value() { return s_Credits; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:357
export let MEO_MAIN_NEWGAME_NETWORK = cMarkAggregate(({"linkID": i32(20001), "animation": 2}));
function __cxx_static_address_fb1cc6ae49618690958f17b5() {
  return __cxx_static_address_fb1cc6ae49618690958f17b5.reference || (__cxx_static_address_fb1cc6ae49618690958f17b5.reference = {
    __cReference: true,
    get value() { return MEO_MAIN_NEWGAME_NETWORK; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:403
export let MEO_EPISODE = cMarkAggregate(({"linkID": i32(110), "animation": 2}));
function __cxx_static_address_1ba9502df829984fe3ae9d9a() {
  return __cxx_static_address_1ba9502df829984fe3ae9d9a.reference || (__cxx_static_address_1ba9502df829984fe3ae9d9a.reference = {
    __cReference: true,
    get value() { return MEO_EPISODE; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:404
export let MEO_EPISODE_SHAREWARE = cMarkAggregate(({"linkID": i32(20000), "animation": 2}));
function __cxx_static_address_36677590de30e52ceb8762fe() {
  return __cxx_static_address_36677590de30e52ceb8762fe.reference || (__cxx_static_address_36677590de30e52ceb8762fe.reference = {
    __cReference: true,
    get value() { return MEO_EPISODE_SHAREWARE; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:407
export let MEO_EPISODE_USERMAP = cMarkAggregate(({"linkID": i32(101), "animation": 2}));
function __cxx_static_address_7aefa2b91be22190cd34f052() {
  return __cxx_static_address_7aefa2b91be22190cd34f052.reference || (__cxx_static_address_7aefa2b91be22190cd34f052.reference = {
    __cReference: true,
    get value() { return MEO_EPISODE_USERMAP; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:409
export let MEL_EPISODE = cPointerArray(9);
function __cxx_static_address_c6ff59e4a25e00ead1552e29() {
  return __cxx_static_address_c6ff59e4a25e00ead1552e29.reference || (__cxx_static_address_c6ff59e4a25e00ead1552e29.reference = {
    __cReference: true,
    get value() { return MEL_EPISODE; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:411
export let MEO_NEWGAMECUSTOM_TEMPLATE = cMarkAggregate(({"linkID": i32(103), "animation": 2}));
function __cxx_static_address_634442ce425f8fc9021b1d67() {
  return __cxx_static_address_634442ce425f8fc9021b1d67.reference || (__cxx_static_address_634442ce425f8fc9021b1d67.reference = {
    __cReference: true,
    get value() { return MEO_NEWGAMECUSTOM_TEMPLATE; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:412
export let MEO_NEWGAMECUSTOM = Array.from({length:7}, () => cZeroAggregate({"record": {"animation": {"scalar": "enum"}, "linkID": {"scalar": "int"}}}));
function __cxx_static_address_62aedab95d38a3fc85448c44() {
  return __cxx_static_address_62aedab95d38a3fc85448c44.reference || (__cxx_static_address_62aedab95d38a3fc85448c44.reference = {
    __cReference: true,
    get value() { return MEO_NEWGAMECUSTOM; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:413
export let MEO_NEWGAMECUSTOMSUB_TEMPLATE = cMarkAggregate(({"linkID": i32(104), "animation": 2}));
function __cxx_static_address_7b49424bf294f61823f1607d() {
  return __cxx_static_address_7b49424bf294f61823f1607d.reference || (__cxx_static_address_7b49424bf294f61823f1607d.reference = {
    __cReference: true,
    get value() { return MEO_NEWGAMECUSTOMSUB_TEMPLATE; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:414
export let MEO_NEWGAMECUSTOMSUB = Array.from({length:7}, () => Array.from({length:7}, () => cZeroAggregate({"record": {"animation": {"scalar": "enum"}, "linkID": {"scalar": "int"}}})));
function __cxx_static_address_2c1daa5b289e1a8e8e536c97() {
  return __cxx_static_address_2c1daa5b289e1a8e8e536c97.reference || (__cxx_static_address_2c1daa5b289e1a8e8e536c97.reference = {
    __cReference: true,
    get value() { return MEO_NEWGAMECUSTOMSUB; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:417
export let MEL_NEWGAMECUSTOM = cPointerArray(7);
function __cxx_static_address_b09742f66c7f38f0e5e43324() {
  return __cxx_static_address_b09742f66c7f38f0e5e43324.reference || (__cxx_static_address_b09742f66c7f38f0e5e43324.reference = {
    __cReference: true,
    get value() { return MEL_NEWGAMECUSTOM; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:418
export let MEL_NEWGAMECUSTOMSUB = cPointerArray(7);
function __cxx_static_address_a68c75bfe1ccdbd6a9e21ba0() {
  return __cxx_static_address_a68c75bfe1ccdbd6a9e21ba0.reference || (__cxx_static_address_a68c75bfe1ccdbd6a9e21ba0.reference = {
    __cReference: true,
    get value() { return MEL_NEWGAMECUSTOMSUB; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:421
export let MEO_NEWGAMECUSTOML3_TEMPLATE = cMarkAggregate(({"linkID": i32(110), "animation": 2}));
function __cxx_static_address_7674598ab417f173b2fa97f3() {
  return __cxx_static_address_7674598ab417f173b2fa97f3.reference || (__cxx_static_address_7674598ab417f173b2fa97f3.reference = {
    __cReference: true,
    get value() { return MEO_NEWGAMECUSTOML3_TEMPLATE; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:422
export let MEO_NEWGAMECUSTOML3 = Array.from({length:7}, () => Array.from({length:7}, () => Array.from({length:7}, () => cZeroAggregate({"record": {"animation": {"scalar": "enum"}, "linkID": {"scalar": "int"}}}))));
function __cxx_static_address_c7af71e6c7ffb234cccf0e40() {
  return __cxx_static_address_c7af71e6c7ffb234cccf0e40.reference || (__cxx_static_address_c7af71e6c7ffb234cccf0e40.reference = {
    __cReference: true,
    get value() { return MEO_NEWGAMECUSTOML3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:424
export let MEL_NEWGAMECUSTOML3 = cPointerArray(7);
function __cxx_static_address_88973e2c8313dc897af19400() {
  return __cxx_static_address_88973e2c8313dc897af19400.reference || (__cxx_static_address_88973e2c8313dc897af19400.reference = {
    __cReference: true,
    get value() { return MEL_NEWGAMECUSTOML3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:426
export const s_Undefined = (() => { const bytes = new Uint8Array(10); bytes.set([85, 110, 100, 101, 102, 105, 110, 101, 100]); return bytes; })();
function __cxx_static_address_803509ef6d3a34219171bf96() {
  return __cxx_static_address_803509ef6d3a34219171bf96.reference || (__cxx_static_address_803509ef6d3a34219171bf96.reference = {
    __cReference: true,
    get value() { return s_Undefined; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:430
export let MEL_SKILL = cPointerArray(7);
function __cxx_static_address_130ba4ef0b6ff02ff8d3f139() {
  return __cxx_static_address_130ba4ef0b6ff02ff8d3f139.reference || (__cxx_static_address_130ba4ef0b6ff02ff8d3f139.reference = {
    __cReference: true,
    get value() { return MEL_SKILL; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:442
export const MEOSN_GAMESETUP_AIM_AUTO = cPointerArray(3, [Uint8Array.from([78, 101, 118, 101, 114, 0]), Uint8Array.from([65, 108, 119, 97, 121, 115, 0]), Uint8Array.from([72, 105, 116, 115, 99, 97, 110, 32, 111, 110, 108, 121, 0])]);
function __cxx_static_address_d44d3dc0f0d91b37defcf801() {
  return __cxx_static_address_d44d3dc0f0d91b37defcf801.reference || (__cxx_static_address_d44d3dc0f0d91b37defcf801.reference = {
    __cReference: true,
    get value() { return MEOSN_GAMESETUP_AIM_AUTO; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:447
export let MEOSV_GAMESETUP_AIM_AUTO = new Int32Array([0, 1, 2]);
function __cxx_static_address_e48a2531194992cf8c167bba() {
  return __cxx_static_address_e48a2531194992cf8c167bba.reference || (__cxx_static_address_e48a2531194992cf8c167bba.reference = {
    __cReference: true,
    get value() { return MEOSV_GAMESETUP_AIM_AUTO; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:460
export const MEOSN_GAMESETUP_WEAPSWITCH_PICKUP = cPointerArray(2, [Uint8Array.from([78, 101, 118, 101, 114, 0]), Uint8Array.from([73, 102, 32, 110, 101, 119, 0])]);
function __cxx_static_address_88235a40d95fc1f14e2dd1a4() {
  return __cxx_static_address_88235a40d95fc1f14e2dd1a4.reference || (__cxx_static_address_88235a40d95fc1f14e2dd1a4.reference = {
    __cReference: true,
    get value() { return MEOSN_GAMESETUP_WEAPSWITCH_PICKUP; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:465
export const MEOSN_DemoRec = cPointerArray(2, [Uint8Array.from([79, 102, 102, 0]), Uint8Array.from([82, 117, 110, 110, 105, 110, 103, 0])]);
function __cxx_static_address_a5f6802e2b7d4b69ae458136() {
  return __cxx_static_address_a5f6802e2b7d4b69ae458136.reference || (__cxx_static_address_a5f6802e2b7d4b69ae458136.reference = {
    __cReference: true,
    get value() { return MEOSN_DemoRec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:489
export let MEO_GAMESETUP_CHEATS = cMarkAggregate(({"linkID": i32(800), "animation": 2}));
function __cxx_static_address_9a30e2e37cb1ba97b1386499() {
  return __cxx_static_address_9a30e2e37cb1ba97b1386499.reference || (__cxx_static_address_9a30e2e37cb1ba97b1386499.reference = {
    __cReference: true,
    get value() { return MEO_GAMESETUP_CHEATS; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:527
export let newresolution = 0;
function __cxx_static_address_59d88f18f252e37492eaa17b() {
  return __cxx_static_address_59d88f18f252e37492eaa17b.reference || (__cxx_static_address_59d88f18f252e37492eaa17b.reference = {
    __cReference: true,
    get value() { return newresolution; },
    set value(__cxx_lvalue_0) { newresolution = i32(__cxx_lvalue_0); }
  });
}

export let newrendermode = 0;
function __cxx_static_address_085e5ed3b8477c6eb93c4c0d() {
  return __cxx_static_address_085e5ed3b8477c6eb93c4c0d.reference || (__cxx_static_address_085e5ed3b8477c6eb93c4c0d.reference = {
    __cReference: true,
    get value() { return newrendermode; },
    set value(__cxx_lvalue_0) { newrendermode = i32(__cxx_lvalue_0); }
  });
}

export let newfullscreen = 0;
function __cxx_static_address_8d7e9cafa5bca422373f4f04() {
  return __cxx_static_address_8d7e9cafa5bca422373f4f04.reference || (__cxx_static_address_8d7e9cafa5bca422373f4f04.reference = {
    __cReference: true,
    get value() { return newfullscreen; },
    set value(__cxx_lvalue_0) { newfullscreen = i32(__cxx_lvalue_0); }
  });
}

export let newvsync = 0;
function __cxx_static_address_862875e622009f9434755a4a() {
  return __cxx_static_address_862875e622009f9434755a4a.reference || (__cxx_static_address_862875e622009f9434755a4a.reference = {
    __cReference: true,
    get value() { return newvsync; },
    set value(__cxx_lvalue_0) { newvsync = i32(__cxx_lvalue_0); }
  });
}

export let newborderless = 0;
function __cxx_static_address_77228becfea7e195c27ed06d() {
  return __cxx_static_address_77228becfea7e195c27ed06d.reference || (__cxx_static_address_77228becfea7e195c27ed06d.reference = {
    __cReference: true,
    get value() { return newborderless; },
    set value(__cxx_lvalue_0) { newborderless = i32(__cxx_lvalue_0); }
  });
}

export let newmaxfps = 0;
function __cxx_static_address_a80c85a6c4360db6a0ced45d() {
  return __cxx_static_address_a80c85a6c4360db6a0ced45d.reference || (__cxx_static_address_a80c85a6c4360db6a0ced45d.reference = {
    __cReference: true,
    get value() { return newmaxfps; },
    set value(__cxx_lvalue_0) { newmaxfps = i32(__cxx_lvalue_0); }
  });
}

export let newdisplayindex = 0;
function __cxx_static_address_0c53a4f2e6541be3011b4898() {
  return __cxx_static_address_0c53a4f2e6541be3011b4898.reference || (__cxx_static_address_0c53a4f2e6541be3011b4898.reference = {
    __cReference: true,
    get value() { return newdisplayindex; },
    set value(__cxx_lvalue_0) { newdisplayindex = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:543
export let resolution = Array.from({length:256}, () => cZeroAggregate({"record": {"bppmax": {"scalar": "int"}, "flags": {"scalar": "int"}, "name": {"array": "Uint8Array", "dims": [19]}, "xdim": {"scalar": "int"}, "ydim": {"scalar": "int"}}}));
function __cxx_static_address_0506b50596b64a80900b01c8() {
  return __cxx_static_address_0506b50596b64a80900b01c8.reference || (__cxx_static_address_0506b50596b64a80900b01c8.reference = {
    __cReference: true,
    get value() { return resolution; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:545
export const MEOSN_VIDEOSETUP_RESOLUTION = cPointerArray(256);
function __cxx_static_address_b451a66bb94ef747910e9e3f() {
  return __cxx_static_address_b451a66bb94ef747910e9e3f.reference || (__cxx_static_address_b451a66bb94ef747910e9e3f.reference = {
    __cReference: true,
    get value() { return MEOSN_VIDEOSETUP_RESOLUTION; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:551
export const MEOSN_VIDEOSETUP_DISPLAY = cPointerArray(8);
function __cxx_static_address_908d5c24306994e96f744851() {
  return __cxx_static_address_908d5c24306994e96f744851.reference || (__cxx_static_address_908d5c24306994e96f744851.reference = {
    __cReference: true,
    get value() { return MEOSN_VIDEOSETUP_DISPLAY; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:589
export const MEOSN_VIDEOSETUP_BORDERLESS = cPointerArray(3, [Uint8Array.from([78, 111, 0]), Uint8Array.from([89, 101, 115, 0]), Uint8Array.from([65, 117, 116, 111, 0])]);
function __cxx_static_address_3cd994dc77eb5fd259fad10c() {
  return __cxx_static_address_3cd994dc77eb5fd259fad10c.reference || (__cxx_static_address_3cd994dc77eb5fd259fad10c.reference = {
    __cReference: true,
    get value() { return MEOSN_VIDEOSETUP_BORDERLESS; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:594
export const MEOSN_VIDEOSETUP_VSYNC = cPointerArray(3, [Uint8Array.from([65, 100, 97, 112, 116, 105, 118, 101, 0]), Uint8Array.from([79, 102, 102, 0]), Uint8Array.from([79, 110, 0])]);
function __cxx_static_address_19f2e7d54acdd6deb9b33adb() {
  return __cxx_static_address_19f2e7d54acdd6deb9b33adb.reference || (__cxx_static_address_19f2e7d54acdd6deb9b33adb.reference = {
    __cReference: true,
    get value() { return MEOSN_VIDEOSETUP_VSYNC; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:600
export let MEOSV_VIDEOSETUP_VSYNC = new Int32Array([(-1), 0, 1]);
function __cxx_static_address_de507563106cb0800ef7d762() {
  return __cxx_static_address_de507563106cb0800ef7d762.reference || (__cxx_static_address_de507563106cb0800ef7d762.reference = {
    __cReference: true,
    get value() { return MEOSV_VIDEOSETUP_VSYNC; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:613
export const MEOSN_VIDEOSETUP_FRAMELIMIT = cPointerArray(27, [Uint8Array.from([65, 117, 116, 111, 0]), Uint8Array.from([78, 111, 110, 101, 0]), Uint8Array.from([51, 48, 32, 102, 112, 115, 0]), Uint8Array.from([53, 56, 32, 102, 112, 115, 0]), Uint8Array.from([53, 57, 32, 102, 112, 115, 0]), Uint8Array.from([54, 48, 32, 102, 112, 115, 0]), Uint8Array.from([54, 49, 32, 102, 112, 115, 0]), Uint8Array.from([55, 50, 32, 102, 112, 115, 0]), Uint8Array.from([55, 51, 32, 102, 112, 115, 0]), Uint8Array.from([55, 52, 32, 102, 112, 115, 0]), Uint8Array.from([55, 53, 32, 102, 112, 115, 0]), Uint8Array.from([56, 51, 32, 102, 112, 115, 0]), Uint8Array.from([56, 52, 32, 102, 112, 115, 0]), Uint8Array.from([56, 53, 32, 102, 112, 115, 0]), Uint8Array.from([49, 48, 48, 32, 102, 112, 115, 0]), Uint8Array.from([49, 49, 56, 32, 102, 112, 115, 0]), Uint8Array.from([49, 49, 57, 32, 102, 112, 115, 0]), Uint8Array.from([49, 50, 48, 32, 102, 112, 115, 0]), Uint8Array.from([49, 52, 50, 32, 102, 112, 115, 0]), Uint8Array.from([49, 52, 51, 32, 102, 112, 115, 0]), Uint8Array.from([49, 52, 52, 32, 102, 112, 115, 0]), Uint8Array.from([49, 54, 51, 32, 102, 112, 115, 0]), Uint8Array.from([49, 54, 52, 32, 102, 112, 115, 0]), Uint8Array.from([49, 54, 53, 32, 102, 112, 115, 0]), Uint8Array.from([50, 51, 56, 32, 102, 112, 115, 0]), Uint8Array.from([50, 51, 57, 32, 102, 112, 115, 0]), Uint8Array.from([50, 52, 48, 32, 102, 112, 115, 0])]);
function __cxx_static_address_15ad558693d28abb3bb59b24() {
  return __cxx_static_address_15ad558693d28abb3bb59b24.reference || (__cxx_static_address_15ad558693d28abb3bb59b24.reference = {
    __cReference: true,
    get value() { return MEOSN_VIDEOSETUP_FRAMELIMIT; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:614
export let MEOSV_VIDEOSETUP_FRAMELIMIT = new Int32Array([(-1), 0, 30, 58, 59, 60, 61, 72, 73, 74, 75, 83, 84, 85, 100, 118, 119, 120, 142, 143, 144, 163, 164, 165, 238, 239, 240]);
function __cxx_static_address_65d0beb9b8f4c84f2c52d338() {
  return __cxx_static_address_65d0beb9b8f4c84f2c52d338.reference || (__cxx_static_address_65d0beb9b8f4c84f2c52d338.reference = {
    __cReference: true,
    get value() { return MEOSV_VIDEOSETUP_FRAMELIMIT; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:626
export let MEO_DISPLAYSETUP_COLORCORR = cMarkAggregate(({"linkID": i32(231), "animation": 2}));
function __cxx_static_address_e988a5318468dddddcef4c77() {
  return __cxx_static_address_e988a5318468dddddcef4c77.reference || (__cxx_static_address_e988a5318468dddddcef4c77.reference = {
    __cReference: true,
    get value() { return MEO_DISPLAYSETUP_COLORCORR; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:630
export const MEOSN_DISPLAYSETUP_UPSCALING = cPointerArray(2, [Uint8Array.from([78, 111, 110, 101, 0]), Uint8Array.from([50, 120, 0])]);
function __cxx_static_address_b12285bd81643ca746ab0b66() {
  return __cxx_static_address_b12285bd81643ca746ab0b66.reference || (__cxx_static_address_b12285bd81643ca746ab0b66.reference = {
    __cReference: true,
    get value() { return MEOSN_DISPLAYSETUP_UPSCALING; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:631
export let MEOSV_DISPLAYSETUP_UPSCALING = new Int32Array([1, 2]);
function __cxx_static_address_63ced9e8d8af0df01f7128dd() {
  return __cxx_static_address_63ced9e8d8af0df01f7128dd.reference || (__cxx_static_address_63ced9e8d8af0df01f7128dd.reference = {
    __cReference: true,
    get value() { return MEOSV_DISPLAYSETUP_UPSCALING; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:638
export const MEOSN_DISPLAYSETUP_ASPECTRATIO = cPointerArray(2, [Uint8Array.from([83, 116, 114, 101, 116, 99, 104, 101, 100, 0]), Uint8Array.from([65, 117, 116, 111, 0])]);
function __cxx_static_address_3d35515217eb18af78f82fba() {
  return __cxx_static_address_3d35515217eb18af78f82fba.reference || (__cxx_static_address_3d35515217eb18af78f82fba.reference = {
    __cReference: true,
    get value() { return MEOSN_DISPLAYSETUP_ASPECTRATIO; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:681
export const s_Scale = (() => { const bytes = new Uint8Array(7); bytes.set([83, 99, 97, 108, 101, 58]); return bytes; })();
function __cxx_static_address_444103d09bef23d94a1f3c18() {
  return __cxx_static_address_444103d09bef23d94a1f3c18.reference || (__cxx_static_address_444103d09bef23d94a1f3c18.reference = {
    __cReference: true,
    get value() { return s_Scale; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:688
export let vpsize = 0;
function __cxx_static_address_18e5d03e3158b58bdad92cec() {
  return __cxx_static_address_18e5d03e3158b58bdad92cec.reference || (__cxx_static_address_18e5d03e3158b58bdad92cec.reference = {
    __cReference: true,
    get value() { return vpsize; },
    set value(__cxx_lvalue_0) { vpsize = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:714
export let MEO_DISPLAYSETUP_SCREENSETUP = cMarkAggregate(({"linkID": i32(233), "animation": 2}));
function __cxx_static_address_d613ea60be187bbef39b3481() {
  return __cxx_static_address_d613ea60be187bbef39b3481.reference || (__cxx_static_address_d613ea60be187bbef39b3481.reference = {
    __cReference: true,
    get value() { return MEO_DISPLAYSETUP_SCREENSETUP; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:726
export let MEO_DISPLAYSETUP_VIDEOSETUP = cMarkAggregate(({"linkID": i32(203), "animation": 2}));
function __cxx_static_address_91040cc90b88d88b39c24af9() {
  return __cxx_static_address_91040cc90b88d88b39c24af9.reference || (__cxx_static_address_91040cc90b88d88b39c24af9.reference = {
    __cReference: true,
    get value() { return MEO_DISPLAYSETUP_VIDEOSETUP; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:731
export let newlanguage = i32((-1));
function __cxx_static_address_cc08dd6a9aaefd331285feab() {
  return __cxx_static_address_cc08dd6a9aaefd331285feab.reference || (__cxx_static_address_cc08dd6a9aaefd331285feab.reference = {
    __cReference: true,
    get value() { return newlanguage; },
    set value(__cxx_lvalue_0) { newlanguage = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:733
export const MEOSN_DISPLAYSETUP_LANGUAGE = cPointerArray(256);
function __cxx_static_address_9f8e2745f822270d993b4073() {
  return __cxx_static_address_9f8e2745f822270d993b4073.reference || (__cxx_static_address_9f8e2745f822270d993b4073.reference = {
    __cReference: true,
    get value() { return MEOSN_DISPLAYSETUP_LANGUAGE; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:738
export let MEO_ENTERCHEAT = cMarkAggregate(({"linkID": i32(801), "animation": 0}));
function __cxx_static_address_12ee6ca77bf6ef7441ffc484() {
  return __cxx_static_address_12ee6ca77bf6ef7441ffc484.reference || (__cxx_static_address_12ee6ca77bf6ef7441ffc484.reference = {
    __cReference: true,
    get value() { return MEO_ENTERCHEAT; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:741
export let MEO_CHEAT_WARP = cMarkAggregate(({"linkID": i32(802), "animation": 0}));
function __cxx_static_address_5a6e979c19117656524b758c() {
  return __cxx_static_address_5a6e979c19117656524b758c.reference || (__cxx_static_address_5a6e979c19117656524b758c.reference = {
    __cReference: true,
    get value() { return MEO_CHEAT_WARP; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:742
export let MEO_CHEAT_SKILL = cMarkAggregate(({"linkID": i32(803), "animation": 0}));
function __cxx_static_address_919f246016162f48425bc9af() {
  return __cxx_static_address_919f246016162f48425bc9af.reference || (__cxx_static_address_919f246016162f48425bc9af.reference = {
    __cReference: true,
    get value() { return MEO_CHEAT_SKILL; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:808
export let MEL_CHEATS = cPointerArray(22, [cRef(() => ME_ENTERCHEAT, __cxx_lvalue_0 => { ME_ENTERCHEAT = __cxx_lvalue_0; })]);
function __cxx_static_address_ecc54914d2bdfa580062e51c() {
  return __cxx_static_address_ecc54914d2bdfa580062e51c.reference || (__cxx_static_address_ecc54914d2bdfa580062e51c.reference = {
    __cReference: true,
    get value() { return MEL_CHEATS; },
    set value(__cxx_lvalue_1) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:849
export const MenuKeyNone = (() => { const bytes = new Uint8Array(5); bytes.set([32, 32, 45, 45]); return bytes; })();
function __cxx_static_address_1980f8fb234b6c14ae0fda93() {
  return __cxx_static_address_1980f8fb234b6c14ae0fda93.reference || (__cxx_static_address_1980f8fb234b6c14ae0fda93.reference = {
    __cReference: true,
    get value() { return MenuKeyNone; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:850
export const MEOSN_Keys = cPointerArray(256);
function __cxx_static_address_f9f4def4465e5598e9b18985() {
  return __cxx_static_address_f9f4def4465e5598e9b18985.reference || (__cxx_static_address_f9f4def4465e5598e9b18985.reference = {
    __cReference: true,
    get value() { return MEOSN_Keys; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:853
export let MEO_KEYBOARDSETUPFUNCS = Array.from({length:63}, () => cZeroAggregate({"record": {"column": {"pointerArray": 2, "stride": 8}, "columnWidth": {"scalar": "int"}, "font": {"pointer": true}, "key": {"pointer": true}, "linkIndex": {"scalar": "int"}, "numvalid": {"scalar": "unsigned long"}, "screenOpen": {"scalar": "signed char"}}}));
function __cxx_static_address_5c029b1171c0f7be7efd7bc6() {
  return __cxx_static_address_5c029b1171c0f7be7efd7bc6.reference || (__cxx_static_address_5c029b1171c0f7be7efd7bc6.reference = {
    __cReference: true,
    get value() { return MEO_KEYBOARDSETUPFUNCS; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:856
export let MEL_KEYBOARDSETUPFUNCS = cPointerArray(63);
function __cxx_static_address_1541be2159e359878cbe98b0() {
  return __cxx_static_address_1541be2159e359878cbe98b0.reference || (__cxx_static_address_1541be2159e359878cbe98b0.reference = {
    __cReference: true,
    get value() { return MEL_KEYBOARDSETUPFUNCS; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:858
export let MEO_KEYBOARDSETUP_KEYS = cMarkAggregate(({"linkID": i32(209), "animation": 2}));
function __cxx_static_address_ffb831d160df2bf4e642da3a() {
  return __cxx_static_address_ffb831d160df2bf4e642da3a.reference || (__cxx_static_address_ffb831d160df2bf4e642da3a.reference = {
    __cReference: true,
    get value() { return MEO_KEYBOARDSETUP_KEYS; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:860
export let MEO_KEYBOARDSETUP_RESET = cMarkAggregate(({"linkID": i32(2201), "animation": 0}));
function __cxx_static_address_758baa4f738fe81946980ae0() {
  return __cxx_static_address_758baa4f738fe81946980ae0.reference || (__cxx_static_address_758baa4f738fe81946980ae0.reference = {
    __cReference: true,
    get value() { return MEO_KEYBOARDSETUP_RESET; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:862
export let MEO_KEYBOARDSETUP_RESETCLASSIC = cMarkAggregate(({"linkID": i32(2202), "animation": 0}));
function __cxx_static_address_ebfee19e29f60f4cd027145a() {
  return __cxx_static_address_ebfee19e29f60f4cd027145a.reference || (__cxx_static_address_ebfee19e29f60f4cd027145a.reference = {
    __cReference: true,
    get value() { return MEO_KEYBOARDSETUP_RESETCLASSIC; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:878
export const MenuMouseData = [cMarkAggregate(({"name": Uint8Array.from([76, 101, 102, 116, 0]), "buttonIndex": 0, "doubleClick": 0})), cMarkAggregate(({"name": Uint8Array.from([82, 105, 103, 104, 116, 0]), "buttonIndex": 1, "doubleClick": 0})), cMarkAggregate(({"name": Uint8Array.from([77, 105, 100, 100, 108, 101, 0]), "buttonIndex": 2, "doubleClick": 0})), cMarkAggregate(({"name": Uint8Array.from([66, 117, 116, 116, 111, 110, 32, 52, 0]), "buttonIndex": 3, "doubleClick": 0})), cMarkAggregate(({"name": Uint8Array.from([66, 117, 116, 116, 111, 110, 32, 53, 0]), "buttonIndex": 6, "doubleClick": 0})), cMarkAggregate(({"name": Uint8Array.from([87, 104, 101, 101, 108, 32, 85, 112, 0]), "buttonIndex": 4, "doubleClick": 0})), cMarkAggregate(({"name": Uint8Array.from([87, 104, 101, 101, 108, 32, 68, 111, 119, 110, 0]), "buttonIndex": 5, "doubleClick": 0})), cMarkAggregate(({"name": Uint8Array.from([68, 111, 117, 98, 108, 101, 32, 67, 108, 105, 99, 107, 32, 76, 101, 102, 116, 0]), "buttonIndex": 0, "doubleClick": 1})), cMarkAggregate(({"name": Uint8Array.from([68, 111, 117, 98, 108, 101, 32, 67, 108, 105, 99, 107, 32, 82, 105, 103, 104, 116, 0]), "buttonIndex": 1, "doubleClick": 1})), cMarkAggregate(({"name": Uint8Array.from([68, 111, 117, 98, 108, 101, 32, 67, 108, 105, 99, 107, 32, 77, 105, 100, 100, 108, 101, 0]), "buttonIndex": 2, "doubleClick": 1})), cMarkAggregate(({"name": Uint8Array.from([68, 111, 117, 98, 108, 101, 32, 67, 108, 105, 99, 107, 32, 66, 117, 116, 116, 111, 110, 32, 52, 0]), "buttonIndex": 3, "doubleClick": 1})), cMarkAggregate(({"name": Uint8Array.from([68, 111, 117, 98, 108, 101, 32, 67, 108, 105, 99, 107, 32, 66, 117, 116, 116, 111, 110, 32, 53, 0]), "buttonIndex": 6, "doubleClick": 1}))];
function __cxx_static_address_90f81978c37a97f9c9cc3155() {
  return __cxx_static_address_90f81978c37a97f9c9cc3155.reference || (__cxx_static_address_90f81978c37a97f9c9cc3155.reference = {
    __cReference: true,
    get value() { return MenuMouseData; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:896
export let MEO_MOUSESETUPBTNS = Array.from({length:12}, () => cZeroAggregate({"record": {"currentOption": {"scalar": "int"}, "data": {"pointer": true}, "font": {"pointer": true}, "options": {"pointer": true}}}));
function __cxx_static_address_a340eb5a49073bc22b500f5f() {
  return __cxx_static_address_a340eb5a49073bc22b500f5f.reference || (__cxx_static_address_a340eb5a49073bc22b500f5f.reference = {
    __cReference: true,
    get value() { return MEO_MOUSESETUPBTNS; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:899
export let MEL_MOUSESETUPBTNS = cPointerArray(12);
function __cxx_static_address_07fbfb46008e235395288de5() {
  return __cxx_static_address_07fbfb46008e235395288de5.reference || (__cxx_static_address_07fbfb46008e235395288de5.reference = {
    __cReference: true,
    get value() { return MEL_MOUSESETUPBTNS; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:901
export let MEO_MOUSESETUP_BTNS = cMarkAggregate(({"linkID": i32(210), "animation": 2}));
function __cxx_static_address_e99832b47360acd52364e233() {
  return __cxx_static_address_e99832b47360acd52364e233.reference || (__cxx_static_address_e99832b47360acd52364e233.reference = {
    __cReference: true,
    get value() { return MEO_MOUSESETUP_BTNS; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:907
export const MEOSN_MOUSESETUP_AIM_TYPE = cPointerArray(2, [Uint8Array.from([84, 111, 103, 103, 108, 101, 0]), Uint8Array.from([72, 111, 108, 100, 0])]);
function __cxx_static_address_1f0053903d5cda462e4fd0f4() {
  return __cxx_static_address_1f0053903d5cda462e4fd0f4.reference || (__cxx_static_address_1f0053903d5cda462e4fd0f4.reference = {
    __cReference: true,
    get value() { return MEOSN_MOUSESETUP_AIM_TYPE; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:991
export let MEO_JOYSTICK_DEFAULTS = cMarkAggregate(({"linkID": i32(2203), "animation": 0}));
function __cxx_static_address_44833a85008c6091082cfb4b() {
  return __cxx_static_address_44833a85008c6091082cfb4b.reference || (__cxx_static_address_44833a85008c6091082cfb4b.reference = {
    __cReference: true,
    get value() { return MEO_JOYSTICK_DEFAULTS; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1028
export let MenuJoystickNames = Array.from({ length: 36 }, () => new Uint8Array(32));
function __cxx_static_address_609ea9e4c334370bb0cb0bbf() {
  return __cxx_static_address_609ea9e4c334370bb0cb0bbf.reference || (__cxx_static_address_609ea9e4c334370bb0cb0bbf.reference = {
    __cReference: true,
    get value() { return MenuJoystickNames; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1030
export let MEO_JOYSTICKBTNS = Array.from({length:36}, () => cZeroAggregate({"record": {"currentOption": {"scalar": "int"}, "data": {"pointer": true}, "font": {"pointer": true}, "options": {"pointer": true}}}));
function __cxx_static_address_b8e1cca0aef61ddb50dc7a6e() {
  return __cxx_static_address_b8e1cca0aef61ddb50dc7a6e.reference || (__cxx_static_address_b8e1cca0aef61ddb50dc7a6e.reference = {
    __cReference: true,
    get value() { return MEO_JOYSTICKBTNS; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1032
export let MEL_JOYSTICKBTNS = cPointerArray(36);
function __cxx_static_address_3a327deaa3a4467cf4192694() {
  return __cxx_static_address_3a327deaa3a4467cf4192694.reference || (__cxx_static_address_3a327deaa3a4467cf4192694.reference = {
    __cReference: true,
    get value() { return MEL_JOYSTICKBTNS; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1034
export let MEO_JOYSTICKAXES = cMarkAggregate(({"linkID": i32(213), "animation": 2}));
function __cxx_static_address_ecd82ce571dd32007a6cdcad() {
  return __cxx_static_address_ecd82ce571dd32007a6cdcad.reference || (__cxx_static_address_ecd82ce571dd32007a6cdcad.reference = {
    __cReference: true,
    get value() { return MEO_JOYSTICKAXES; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1037
export let MenuJoystickAxes = Array.from({ length: 9 }, () => new Uint8Array(32));
function __cxx_static_address_48e198576c692de1bf693d9a() {
  return __cxx_static_address_48e198576c692de1bf693d9a.reference || (__cxx_static_address_48e198576c692de1bf693d9a.reference = {
    __cReference: true,
    get value() { return MenuJoystickAxes; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1039
export let MEL_JOYSTICKAXES = cPointerArray(9);
function __cxx_static_address_a9da89d189e48275e671de45() {
  return __cxx_static_address_a9da89d189e48275e671de45.reference || (__cxx_static_address_a9da89d189e48275e671de45.reference = {
    __cReference: true,
    get value() { return MEL_JOYSTICKAXES; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1041
export const MenuJoystickHatDirections = cPointerArray(4, [Uint8Array.from([85, 112, 0]), Uint8Array.from([82, 105, 103, 104, 116, 0]), Uint8Array.from([68, 111, 119, 110, 0]), Uint8Array.from([76, 101, 102, 116, 0])]);
function __cxx_static_address_e24e234d757b8b534edae81c() {
  return __cxx_static_address_e24e234d757b8b534edae81c.reference || (__cxx_static_address_e24e234d757b8b534edae81c.reference = {
    __cReference: true,
    get value() { return MenuJoystickHatDirections; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1043
export const MEOSN_JOYSTICKAXIS_ANALOG = cPointerArray(5, [MenuGameFuncNone, Uint8Array.from([72, 111, 114, 105, 122, 111, 110, 116, 97, 108, 32, 97, 105, 109, 105, 110, 103, 0]), Uint8Array.from([77, 111, 118, 101, 32, 115, 105, 100, 101, 119, 97, 121, 115, 0]), Uint8Array.from([86, 101, 114, 116, 105, 99, 97, 108, 32, 97, 105, 109, 105, 110, 103, 0]), Uint8Array.from([77, 111, 118, 101, 32, 102, 111, 114, 119, 97, 114, 100, 47, 98, 97, 99, 107, 0])]);
function __cxx_static_address_6a74fa6a6ffbd8a94fc9d3b4() {
  return __cxx_static_address_6a74fa6a6ffbd8a94fc9d3b4.reference || (__cxx_static_address_6a74fa6a6ffbd8a94fc9d3b4.reference = {
    __cReference: true,
    get value() { return MEOSN_JOYSTICKAXIS_ANALOG; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1044
export let MEOSV_JOYSTICKAXIS_ANALOG = new Int32Array([(-1), i32(0), i32(1), i32(2), i32(5)]);
function __cxx_static_address_d05097ae63c6152a9e948ee0() {
  return __cxx_static_address_d05097ae63c6152a9e948ee0.reference || (__cxx_static_address_d05097ae63c6152a9e948ee0.reference = {
    __cReference: true,
    get value() { return MEOSV_JOYSTICKAXIS_ANALOG; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1182
export let MEO_COLCORR_RESET = cMarkAggregate(({"linkID": i32(2200), "animation": 0}));
function __cxx_static_address_ebe4f32a8365f9b9d6696c7f() {
  return __cxx_static_address_ebe4f32a8365f9b9d6696c7f.reference || (__cxx_static_address_ebe4f32a8365f9b9d6696c7f.reference = {
    __cReference: true,
    get value() { return MEO_COLCORR_RESET; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1224
export let MEO_LOAD = cMarkAggregate(({"linkID": i32(1000), "animation": 0}));
function __cxx_static_address_cbd6180ee3a4136df2fe69af() {
  return __cxx_static_address_cbd6180ee3a4136df2fe69af.reference || (__cxx_static_address_cbd6180ee3a4136df2fe69af.reference = {
    __cReference: true,
    get value() { return MEO_LOAD; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1227
export let ME_LOAD = null;
function __cxx_static_address_c42b0ece21979e90e6936208() {
  return __cxx_static_address_c42b0ece21979e90e6936208.reference || (__cxx_static_address_c42b0ece21979e90e6936208.reference = {
    __cReference: true,
    get value() { return ME_LOAD; },
    set value(__cxx_lvalue_0) { ME_LOAD = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1228
export let MEL_LOAD = null;
function __cxx_static_address_6a64deae9a3400feec5184c2() {
  return __cxx_static_address_6a64deae9a3400feec5184c2.reference || (__cxx_static_address_6a64deae9a3400feec5184c2.reference = {
    __cReference: true,
    get value() { return MEL_LOAD; },
    set value(__cxx_lvalue_0) { MEL_LOAD = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1230
export const s_NewSaveGame = (() => { const bytes = new Uint8Array(16); bytes.set([40, 78, 101, 119, 32, 83, 97, 118, 101, 32, 71, 97, 109, 101, 41]); return bytes; })();
function __cxx_static_address_c80f94d8cc72f0217b3b9bac() {
  return __cxx_static_address_c80f94d8cc72f0217b3b9bac.reference || (__cxx_static_address_c80f94d8cc72f0217b3b9bac.reference = {
    __cReference: true,
    get value() { return s_NewSaveGame; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1233
export let MEO_SAVE = null;
function __cxx_static_address_ff09af1dd4dabfa3918a9624() {
  return __cxx_static_address_ff09af1dd4dabfa3918a9624.reference || (__cxx_static_address_ff09af1dd4dabfa3918a9624.reference = {
    __cReference: true,
    get value() { return MEO_SAVE; },
    set value(__cxx_lvalue_0) { MEO_SAVE = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1236
export let ME_SAVE = null;
function __cxx_static_address_3cc0b9b7a825720af929278c() {
  return __cxx_static_address_3cc0b9b7a825720af929278c.reference || (__cxx_static_address_3cc0b9b7a825720af929278c.reference = {
    __cReference: true,
    get value() { return ME_SAVE; },
    set value(__cxx_lvalue_0) { ME_SAVE = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1237
export let MEL_SAVE = null;
function __cxx_static_address_3009a0f00822d761b102b2bc() {
  return __cxx_static_address_3009a0f00822d761b102b2bc.reference || (__cxx_static_address_3009a0f00822d761b102b2bc.reference = {
    __cReference: true,
    get value() { return MEL_SAVE; },
    set value(__cxx_lvalue_0) { MEL_SAVE = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1240
export let alsadevice = 0;
function __cxx_static_address_56a041b2d42900efc469df59() {
  return __cxx_static_address_56a041b2d42900efc469df59.reference || (__cxx_static_address_56a041b2d42900efc469df59.reference = {
    __cReference: true,
    get value() { return alsadevice; },
    set value(__cxx_lvalue_0) { alsadevice = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1244
export let soundrate = 0;
function __cxx_static_address_22b6ffff1b6ec77a8df0412b() {
  return __cxx_static_address_22b6ffff1b6ec77a8df0412b.reference || (__cxx_static_address_22b6ffff1b6ec77a8df0412b.reference = {
    __cReference: true,
    get value() { return soundrate; },
    set value(__cxx_lvalue_0) { soundrate = i32(__cxx_lvalue_0); }
  });
}

export let soundvoices = 0;
function __cxx_static_address_0319ef0799984ffbbf0494f8() {
  return __cxx_static_address_0319ef0799984ffbbf0494f8.reference || (__cxx_static_address_0319ef0799984ffbbf0494f8.reference = {
    __cReference: true,
    get value() { return soundvoices; },
    set value(__cxx_lvalue_0) { soundvoices = i32(__cxx_lvalue_0); }
  });
}

export let musicdevice = 0;
function __cxx_static_address_846e74d34b6f1200b65886aa() {
  return __cxx_static_address_846e74d34b6f1200b65886aa.reference || (__cxx_static_address_846e74d34b6f1200b65886aa.reference = {
    __cReference: true,
    get value() { return musicdevice; },
    set value(__cxx_lvalue_0) { musicdevice = i32(__cxx_lvalue_0); }
  });
}

export let opl3stereo = 0;
function __cxx_static_address_cb345e0d124d6eb2f95cac2b() {
  return __cxx_static_address_cb345e0d124d6eb2f95cac2b.reference || (__cxx_static_address_cb345e0d124d6eb2f95cac2b.reference = {
    __cReference: true,
    get value() { return opl3stereo; },
    set value(__cxx_lvalue_0) { opl3stereo = i32(__cxx_lvalue_0); }
  });
}

export let extmusic = 0;
function __cxx_static_address_bf2bbe9b91cda7bc58297838() {
  return __cxx_static_address_bf2bbe9b91cda7bc58297838.reference || (__cxx_static_address_bf2bbe9b91cda7bc58297838.reference = {
    __cReference: true,
    get value() { return extmusic; },
    set value(__cxx_lvalue_0) { extmusic = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1245
export let sf2bankfile = new Uint8Array(256);
function __cxx_static_address_761c1b024420cdc64666101d() {
  return __cxx_static_address_761c1b024420cdc64666101d.reference || (__cxx_static_address_761c1b024420cdc64666101d.reference = {
    __cReference: true,
    get value() { return sf2bankfile; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1252
export const s_Volume = (() => { const bytes = new Uint8Array(8); bytes.set([86, 111, 108, 117, 109, 101, 58]); return bytes; })();
function __cxx_static_address_44efa9220a43bb25147830ff() {
  return __cxx_static_address_44efa9220a43bb25147830ff.reference || (__cxx_static_address_44efa9220a43bb25147830ff.reference = {
    __cReference: true,
    get value() { return s_Volume; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1275
export const MEOSN_SOUND_SAMPLINGRATE = cPointerArray(3, [Uint8Array.from([50, 50, 48, 53, 48, 72, 122, 0]), Uint8Array.from([52, 52, 49, 48, 48, 72, 122, 0]), Uint8Array.from([52, 56, 48, 48, 48, 72, 122, 0])]);
function __cxx_static_address_66434555517586fac76ab9a7() {
  return __cxx_static_address_66434555517586fac76ab9a7.reference || (__cxx_static_address_66434555517586fac76ab9a7.reference = {
    __cReference: true,
    get value() { return MEOSN_SOUND_SAMPLINGRATE; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1276
export let MEOSV_SOUND_SAMPLINGRATE = new Int32Array([22050, 44100, 48000]);
function __cxx_static_address_217967c026a258052bf48e08() {
  return __cxx_static_address_217967c026a258052bf48e08.reference || (__cxx_static_address_217967c026a258052bf48e08.reference = {
    __cReference: true,
    get value() { return MEOSV_SOUND_SAMPLINGRATE; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1298
export const MEOSN_SOUND_ALSADEVICE = cPointerArray(256);
function __cxx_static_address_fda2d269a0f93e296f4e396c() {
  return __cxx_static_address_fda2d269a0f93e296f4e396c.reference || (__cxx_static_address_fda2d269a0f93e296f4e396c.reference = {
    __cReference: true,
    get value() { return MEOSN_SOUND_ALSADEVICE; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1304
export const MEOSN_SOUND_MIDIDRIVER = cPointerArray(3, [Uint8Array.from([79, 80, 76, 51, 32, 101, 109, 117, 46, 0]), Uint8Array.from([46, 115, 102, 50, 32, 115, 121, 110, 116, 104, 0]), Uint8Array.from([65, 76, 83, 65, 32, 77, 73, 68, 73, 0])]);
function __cxx_static_address_5fb3b751298051e8ff0a43a6() {
  return __cxx_static_address_5fb3b751298051e8ff0a43a6.reference || (__cxx_static_address_5fb3b751298051e8ff0a43a6.reference = {
    __cReference: true,
    get value() { return MEOSN_SOUND_MIDIDRIVER; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1314
export let MEOSV_SOUND_MIDIDRIVER = new Int32Array([i32(2), i32(4), i32(5)]);
function __cxx_static_address_4fe308222454a65c9ede8ed2() {
  return __cxx_static_address_4fe308222454a65c9ede8ed2.reference || (__cxx_static_address_4fe308222454a65c9ede8ed2.reference = {
    __cReference: true,
    get value() { return MEOSV_SOUND_MIDIDRIVER; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1329
export let MEO_SOUND_DEVSETUP = cMarkAggregate(({"linkID": i32(702), "animation": 2}));
function __cxx_static_address_86c1ef28f58746bfdd86a846() {
  return __cxx_static_address_86c1ef28f58746bfdd86a846.reference || (__cxx_static_address_86c1ef28f58746bfdd86a846.reference = {
    __cReference: true,
    get value() { return MEO_SOUND_DEVSETUP; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1332
export let MEO_SOUND_SF2 = cMarkAggregate(({"linkID": i32(703), "animation": 2}));
function __cxx_static_address_3fb9abf17675efa6713dcdef() {
  return __cxx_static_address_3fb9abf17675efa6713dcdef.reference || (__cxx_static_address_3fb9abf17675efa6713dcdef.reference = {
    __cReference: true,
    get value() { return MEO_SOUND_SF2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1408
export const MEOSN_PLAYER_COLOR = cPointerArray(11, [Uint8Array.from([65, 117, 116, 111, 0]), Uint8Array.from([66, 108, 117, 101, 0]), Uint8Array.from([82, 101, 100, 0]), Uint8Array.from([71, 114, 101, 101, 110, 0]), Uint8Array.from([71, 114, 97, 121, 0]), Uint8Array.from([68, 97, 114, 107, 32, 103, 114, 97, 121, 0]), Uint8Array.from([68, 97, 114, 107, 32, 103, 114, 101, 101, 110, 0]), Uint8Array.from([66, 114, 111, 119, 110, 0]), Uint8Array.from([68, 97, 114, 107, 32, 98, 108, 117, 101, 0]), Uint8Array.from([66, 114, 105, 103, 104, 116, 32, 114, 101, 100, 0]), Uint8Array.from([89, 101, 108, 108, 111, 119, 0])]);
function __cxx_static_address_7986ba7ede6917170db9feba() {
  return __cxx_static_address_7986ba7ede6917170db9feba.reference || (__cxx_static_address_7986ba7ede6917170db9feba.reference = {
    __cReference: true,
    get value() { return MEOSN_PLAYER_COLOR; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1409
export let MEOSV_PLAYER_COLOR = new Int32Array([0, 9, 10, 11, 12, 13, 14, 15, 16, 21, 23]);
function __cxx_static_address_de07731c31f7da196f37deda() {
  return __cxx_static_address_de07731c31f7da196f37deda.reference || (__cxx_static_address_de07731c31f7da196f37deda.reference = {
    __cReference: true,
    get value() { return MEOSV_PLAYER_COLOR; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1413
export const MEOSN_PLAYER_TEAM = cPointerArray(4, [Uint8Array.from([66, 108, 117, 101, 0]), Uint8Array.from([82, 101, 100, 0]), Uint8Array.from([71, 114, 101, 101, 110, 0]), Uint8Array.from([71, 114, 97, 121, 0])]);
function __cxx_static_address_9f51f0636e97a811db705ca0() {
  return __cxx_static_address_9f51f0636e97a811db705ca0.reference || (__cxx_static_address_9f51f0636e97a811db705ca0.reference = {
    __cReference: true,
    get value() { return MEOSN_PLAYER_TEAM; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1418
export let MEO_PLAYER_MACROS = cMarkAggregate(({"linkID": i32(20004), "animation": 2}));
function __cxx_static_address_e3203b4ab60f6a5498602823() {
  return __cxx_static_address_e3203b4ab60f6a5498602823.reference || (__cxx_static_address_e3203b4ab60f6a5498602823.reference = {
    __cReference: true,
    get value() { return MEO_PLAYER_MACROS; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1435
export let MEO_MACROS = Array.from({length:10}, () => cZeroAggregate({"record": {"bufsize": {"scalar": "int"}, "editfield": {"pointee": "byte", "pointer": true}, "flags": {"scalar": "int"}, "font": {"pointer": true}, "variable": {"pointee": "byte", "pointer": true}}}));
function __cxx_static_address_594d004bc153948666875f18() {
  return __cxx_static_address_594d004bc153948666875f18.reference || (__cxx_static_address_594d004bc153948666875f18.reference = {
    __cReference: true,
    get value() { return MEO_MACROS; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1438
export let MEL_MACROS = cPointerArray(10);
function __cxx_static_address_06fab5aa9f213a6e232b97a5() {
  return __cxx_static_address_06fab5aa9f213a6e232b97a5.reference || (__cxx_static_address_06fab5aa9f213a6e232b97a5.reference = {
    __cReference: true,
    get value() { return MEL_MACROS; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1440
export let MenuUserMap = Uint8Array.from([85, 115, 101, 114, 32, 77, 97, 112, 0]);
function __cxx_static_address_ae1701f5c9a5b98d80cafbbd() {
  return __cxx_static_address_ae1701f5c9a5b98d80cafbbd.reference || (__cxx_static_address_ae1701f5c9a5b98d80cafbbd.reference = {
    __cReference: true,
    get value() { return MenuUserMap; },
    set value(__cxx_lvalue_0) { MenuUserMap = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1441
export let MenuSkillNone = Uint8Array.from([78, 111, 110, 101, 0]);
function __cxx_static_address_3fdf26f8c3cf37eaa9e3e3d4() {
  return __cxx_static_address_3fdf26f8c3cf37eaa9e3e3d4.reference || (__cxx_static_address_3fdf26f8c3cf37eaa9e3e3d4.reference = {
    __cReference: true,
    get value() { return MenuSkillNone; },
    set value(__cxx_lvalue_0) { MenuSkillNone = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1443
export const MEOSN_NetGametypes = cPointerArray(16);
function __cxx_static_address_5be5efd202806f1182e8d2bd() {
  return __cxx_static_address_5be5efd202806f1182e8d2bd.reference || (__cxx_static_address_5be5efd202806f1182e8d2bd.reference = {
    __cReference: true,
    get value() { return MEOSN_NetGametypes; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1444
export const MEOSN_NetEpisodes = cPointerArray(8);
function __cxx_static_address_861b8242976480f29b3d4688() {
  return __cxx_static_address_861b8242976480f29b3d4688.reference || (__cxx_static_address_861b8242976480f29b3d4688.reference = {
    __cReference: true,
    get value() { return MEOSN_NetEpisodes; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1445
export let MEOSV_NetEpisodes = new Int32Array(8);
function __cxx_static_address_75d8427e27eed2418a8c577c() {
  return __cxx_static_address_75d8427e27eed2418a8c577c.reference || (__cxx_static_address_75d8427e27eed2418a8c577c.reference = {
    __cReference: true,
    get value() { return MEOSV_NetEpisodes; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1446
export const MEOSN_NetLevels = Array.from({ length: 7 }, () => Array(64).fill(null));
function __cxx_static_address_04f211cb3fa9715fb4e9d900() {
  return __cxx_static_address_04f211cb3fa9715fb4e9d900.reference || (__cxx_static_address_04f211cb3fa9715fb4e9d900.reference = {
    __cReference: true,
    get value() { return MEOSN_NetLevels; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1447
export const MEOSN_NetSkills = cPointerArray(8);
function __cxx_static_address_f54951d99508467e7404825c() {
  return __cxx_static_address_f54951d99508467e7404825c.reference || (__cxx_static_address_f54951d99508467e7404825c.reference = {
    __cReference: true,
    get value() { return MEOSN_NetSkills; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1449
export let MEO_NETHOST_OPTIONS = cMarkAggregate(({"linkID": i32(20011), "animation": 2}));
function __cxx_static_address_dea2dea37ea069264522a32c() {
  return __cxx_static_address_dea2dea37ea069264522a32c.reference || (__cxx_static_address_dea2dea37ea069264522a32c.reference = {
    __cReference: true,
    get value() { return MEO_NETHOST_OPTIONS; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1462
export let NetEpisode = 0;
function __cxx_static_address_0238dcdcc38fe3ebc57d0680() {
  return __cxx_static_address_0238dcdcc38fe3ebc57d0680.reference || (__cxx_static_address_0238dcdcc38fe3ebc57d0680.reference = {
    __cReference: true,
    get value() { return NetEpisode; },
    set value(__cxx_lvalue_0) { NetEpisode = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1469
export let MEO_NETOPTIONS_USERMAP = cMarkAggregate(({"linkID": i32(20012), "animation": 2}));
function __cxx_static_address_38b10d28282d15c7ce769ad4() {
  return __cxx_static_address_38b10d28282d15c7ce769ad4.reference || (__cxx_static_address_38b10d28282d15c7ce769ad4.reference = {
    __cReference: true,
    get value() { return MEO_NETOPTIONS_USERMAP; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1492
export let MenuServer = (() => { const bytes = new Uint8Array(256); bytes.set([108, 111, 99, 97, 108, 104, 111, 115, 116]); return bytes; })();
function __cxx_static_address_5097f4234bc0d9de138b47b6() {
  return __cxx_static_address_5097f4234bc0d9de138b47b6.reference || (__cxx_static_address_5097f4234bc0d9de138b47b6.reference = {
    __cReference: true,
    get value() { return MenuServer; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1496
export let MenuPort = (() => { const bytes = new Uint8Array(6); bytes.set([49, 57, 48, 49, 52]); return bytes; })();
function __cxx_static_address_b9d697c9107dcfd0a1ccc7b9() {
  return __cxx_static_address_b9d697c9107dcfd0a1ccc7b9.reference || (__cxx_static_address_b9d697c9107dcfd0a1ccc7b9.reference = {
    __cReference: true,
    get value() { return MenuPort; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1515
export let M_EPISODE = cMarkAggregate(({"title": Uint8Array.from([83, 101, 108, 101, 99, 116, 32, 65, 110, 32, 69, 112, 105, 115, 111, 100, 101, 0]), "format": __cxx_static_address_7dde0a120006e220b160b577(), "entrylist": cStaticPointer(() => MEL_EPISODE), "numEntries": i32(ARRAY_SIZE__header_36111f5b1b0b(MEL_EPISODE)), "currentEntry": 0, "currentColumn": 0, "scrollPos": 0}));
function __cxx_static_address_a4378976d2939e411204e5bf() {
  return __cxx_static_address_a4378976d2939e411204e5bf.reference || (__cxx_static_address_a4378976d2939e411204e5bf.reference = {
    __cReference: true,
    get value() { return M_EPISODE; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1516
export let M_SKILL = cMarkAggregate(({"title": Uint8Array.from([83, 101, 108, 101, 99, 116, 32, 83, 107, 105, 108, 108, 0]), "format": __cxx_static_address_017e8f47ea0ef4dbc06999ff(), "entrylist": cStaticPointer(() => MEL_SKILL), "numEntries": i32(ARRAY_SIZE__header_49327c0dc9b0(MEL_SKILL)), "currentEntry": 0, "currentColumn": 0, "scrollPos": 0}));
function __cxx_static_address_33a9b914cbbaf6fe07abb1fe() {
  return __cxx_static_address_33a9b914cbbaf6fe07abb1fe.reference || (__cxx_static_address_33a9b914cbbaf6fe07abb1fe.reference = {
    __cReference: true,
    get value() { return M_SKILL; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1517
export let M_NEWGAMECUSTOM = cMarkAggregate(({"title": cStaticPointer(() => s_NewGame), "format": __cxx_static_address_347cc43ca1ae567d3f4e05de(), "entrylist": cStaticPointer(() => MEL_NEWGAMECUSTOM), "numEntries": i32(ARRAY_SIZE__header_49327c0dc9b0(MEL_NEWGAMECUSTOM)), "currentEntry": 0, "currentColumn": 0, "scrollPos": 0}));
function __cxx_static_address_484f1e8932e8fc28c67b7779() {
  return __cxx_static_address_484f1e8932e8fc28c67b7779.reference || (__cxx_static_address_484f1e8932e8fc28c67b7779.reference = {
    __cReference: true,
    get value() { return M_NEWGAMECUSTOM; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1518
export let M_NEWGAMECUSTOMSUB = cMarkAggregate(({"title": cStaticPointer(() => s_NewGame), "format": __cxx_static_address_e43b75b05ecc3a4ef3449828(), "entrylist": cStaticPointer(() => MEL_NEWGAMECUSTOMSUB), "numEntries": i32(ARRAY_SIZE__header_49327c0dc9b0(MEL_NEWGAMECUSTOMSUB)), "currentEntry": 0, "currentColumn": 0, "scrollPos": 0}));
function __cxx_static_address_c66173c73bc11c02e22893a2() {
  return __cxx_static_address_c66173c73bc11c02e22893a2.reference || (__cxx_static_address_c66173c73bc11c02e22893a2.reference = {
    __cReference: true,
    get value() { return M_NEWGAMECUSTOMSUB; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1519
export let M_NEWGAMECUSTOML3 = cMarkAggregate(({"title": cStaticPointer(() => s_NewGame), "format": __cxx_static_address_129274f1ccd1531dfd98e0f1(), "entrylist": cStaticPointer(() => MEL_NEWGAMECUSTOML3), "numEntries": i32(ARRAY_SIZE__header_49327c0dc9b0(MEL_NEWGAMECUSTOML3)), "currentEntry": 0, "currentColumn": 0, "scrollPos": 0}));
function __cxx_static_address_e7aa29650be625cf107f6932() {
  return __cxx_static_address_e7aa29650be625cf107f6932.reference || (__cxx_static_address_e7aa29650be625cf107f6932.reference = {
    __cReference: true,
    get value() { return M_NEWGAMECUSTOML3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1527
export let M_CHEATS = cMarkAggregate(({"title": Uint8Array.from([67, 104, 101, 97, 116, 115, 0]), "format": __cxx_static_address_7fded45cabff4be016261c91(), "entrylist": cStaticPointer(() => MEL_CHEATS), "numEntries": i32(ARRAY_SIZE__header_b8bdaf1298a7(MEL_CHEATS)), "currentEntry": 0, "currentColumn": 0, "scrollPos": 0}));
function __cxx_static_address_478c741591563bc512d8389f() {
  return __cxx_static_address_478c741591563bc512d8389f.reference || (__cxx_static_address_478c741591563bc512d8389f.reference = {
    __cReference: true,
    get value() { return M_CHEATS; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1536
export let M_JOYSTICKBTNS = cMarkAggregate(({"title": Uint8Array.from([67, 111, 110, 116, 114, 111, 108, 108, 101, 114, 32, 66, 117, 116, 116, 111, 110, 115, 0]), "format": __cxx_static_address_4cbe13ea203ef5b2c276ab90(), "entrylist": cStaticPointer(() => MEL_JOYSTICKBTNS), "numEntries": i32(ARRAY_SIZE__header_87ba03cdfff0(MEL_JOYSTICKBTNS)), "currentEntry": 0, "currentColumn": 0, "scrollPos": 0}));
function __cxx_static_address_d8a6f502b74a4fb37dfcf9e9() {
  return __cxx_static_address_d8a6f502b74a4fb37dfcf9e9.reference || (__cxx_static_address_d8a6f502b74a4fb37dfcf9e9.reference = {
    __cReference: true,
    get value() { return M_JOYSTICKBTNS; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1537
export let M_JOYSTICKAXES = cMarkAggregate(({"title": Uint8Array.from([65, 110, 97, 108, 111, 103, 32, 73, 110, 112, 117, 116, 115, 0]), "format": __cxx_static_address_ace043e84a9781ffb039949f(), "entrylist": cStaticPointer(() => MEL_JOYSTICKAXES), "numEntries": i32(ARRAY_SIZE__header_36111f5b1b0b(MEL_JOYSTICKAXES)), "currentEntry": 0, "currentColumn": 0, "scrollPos": 0}));
function __cxx_static_address_738220fed8929bff64b11c2d() {
  return __cxx_static_address_738220fed8929bff64b11c2d.reference || (__cxx_static_address_738220fed8929bff64b11c2d.reference = {
    __cReference: true,
    get value() { return M_JOYSTICKAXES; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1538
export let M_KEYBOARDKEYS = cMarkAggregate(({"title": Uint8Array.from([75, 101, 121, 32, 67, 111, 110, 102, 105, 103, 117, 114, 97, 116, 105, 111, 110, 0]), "format": __cxx_static_address_3b901081a60f4291ad4eef1e(), "entrylist": cStaticPointer(() => MEL_KEYBOARDSETUPFUNCS), "numEntries": i32(ARRAY_SIZE__header_cd9c26ba8a7e(MEL_KEYBOARDSETUPFUNCS)), "currentEntry": 0, "currentColumn": 0, "scrollPos": 0}));
function __cxx_static_address_e67397892126825b8f06865f() {
  return __cxx_static_address_e67397892126825b8f06865f.reference || (__cxx_static_address_e67397892126825b8f06865f.reference = {
    __cReference: true,
    get value() { return M_KEYBOARDKEYS; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1539
export let M_MOUSEBTNS = cMarkAggregate(({"title": Uint8Array.from([77, 111, 117, 115, 101, 32, 66, 117, 116, 116, 111, 110, 115, 0]), "format": __cxx_static_address_4cbe13ea203ef5b2c276ab90(), "entrylist": cStaticPointer(() => MEL_MOUSESETUPBTNS), "numEntries": i32(ARRAY_SIZE__header_ec180b1162f0(MEL_MOUSESETUPBTNS)), "currentEntry": 0, "currentColumn": 0, "scrollPos": 0}));
function __cxx_static_address_1888c1d5474600a6ea203240() {
  return __cxx_static_address_1888c1d5474600a6ea203240.reference || (__cxx_static_address_1888c1d5474600a6ea203240.reference = {
    __cReference: true,
    get value() { return M_MOUSEBTNS; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1557
export let M_MACROS = cMarkAggregate(({"title": Uint8Array.from([77, 117, 108, 116, 105, 112, 108, 97, 121, 101, 114, 32, 77, 97, 99, 114, 111, 115, 0]), "format": __cxx_static_address_8dd20b9c842ebc6d8ee69f62(), "entrylist": cStaticPointer(() => MEL_MACROS), "numEntries": i32(ARRAY_SIZE__header_0eb6da4228de(MEL_MACROS)), "currentEntry": 0, "currentColumn": 0, "scrollPos": 0}));
function __cxx_static_address_e7eb3d4d85ace97c321dcbf9() {
  return __cxx_static_address_e7eb3d4d85ace97c321dcbf9.reference || (__cxx_static_address_e7eb3d4d85ace97c321dcbf9.reference = {
    __cReference: true,
    get value() { return M_MACROS; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1565
export let M_STORY = cMarkAggregate(({"title": null, "previousID": i32(401), "previousAnimation": 1, "nextID": i32(401), "nextAnimation": 2}));
function __cxx_static_address_e067da532beb8d8f4ab11692() {
  return __cxx_static_address_e067da532beb8d8f4ab11692.reference || (__cxx_static_address_e067da532beb8d8f4ab11692.reference = {
    __cReference: true,
    get value() { return M_STORY; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1568
export let M_F1HELP = cMarkAggregate(({"title": null, "previousID": i32(400), "previousAnimation": 1, "nextID": i32(400), "nextAnimation": 2}));
function __cxx_static_address_3e0e8fd87fc752b0f9517114() {
  return __cxx_static_address_3e0e8fd87fc752b0f9517114.reference || (__cxx_static_address_3e0e8fd87fc752b0f9517114.reference = {
    __cReference: true,
    get value() { return M_F1HELP; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1569
export let M_CREDITS = cMarkAggregate(({"title": null, "previousID": i32(994), "previousAnimation": 1, "nextID": i32(991), "nextAnimation": 2}));
function __cxx_static_address_b68d1b02085a4903db10c244() {
  return __cxx_static_address_b68d1b02085a4903db10c244.reference || (__cxx_static_address_b68d1b02085a4903db10c244.reference = {
    __cReference: true,
    get value() { return M_CREDITS; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1570
export let M_CREDITS2 = cMarkAggregate(({"title": null, "previousID": i32(990), "previousAnimation": 1, "nextID": i32(992), "nextAnimation": 2}));
function __cxx_static_address_6467e60460c97cfcd3b949a8() {
  return __cxx_static_address_6467e60460c97cfcd3b949a8.reference || (__cxx_static_address_6467e60460c97cfcd3b949a8.reference = {
    __cReference: true,
    get value() { return M_CREDITS2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1571
export let M_CREDITS3 = cMarkAggregate(({"title": null, "previousID": i32(991), "previousAnimation": 1, "nextID": i32(993), "nextAnimation": 2}));
function __cxx_static_address_996e1140e1d41d131b8fb423() {
  return __cxx_static_address_996e1140e1d41d131b8fb423.reference || (__cxx_static_address_996e1140e1d41d131b8fb423.reference = {
    __cReference: true,
    get value() { return M_CREDITS3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1572
export let M_CREDITS4 = cMarkAggregate(({"title": Uint8Array.from([65, 98, 111, 117, 116, 32, 69, 68, 117, 107, 101, 51, 50, 0]), "previousID": i32(992), "previousAnimation": 1, "nextID": i32(994), "nextAnimation": 2}));
function __cxx_static_address_41a68a018005bacd6d1ef72e() {
  return __cxx_static_address_41a68a018005bacd6d1ef72e.reference || (__cxx_static_address_41a68a018005bacd6d1ef72e.reference = {
    __cReference: true,
    get value() { return M_CREDITS4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1573
export let M_CREDITS5 = cMarkAggregate(({"title": Uint8Array.from([65, 98, 111, 117, 116, 32, 69, 68, 117, 107, 101, 51, 50, 0]), "previousID": i32(993), "previousAnimation": 1, "nextID": i32(990), "nextAnimation": 2}));
function __cxx_static_address_3f47954b7f3b778c45b697b6() {
  return __cxx_static_address_3f47954b7f3b778c45b697b6.reference || (__cxx_static_address_3f47954b7f3b778c45b697b6.reference = {
    __cReference: true,
    get value() { return M_CREDITS5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1579
export let M_SAVECLEANVERIFY = cMarkAggregate(({"cursorpos": cMarkAggregate(({"x": i32((160 << 16)), "y": i32((129 << 16))})), "linkID": i32(750), "animation": 0}));
function __cxx_static_address_21869d5a88a61f904773e481() {
  return __cxx_static_address_21869d5a88a61f904773e481.reference || (__cxx_static_address_21869d5a88a61f904773e481.reference = {
    __cReference: true,
    get value() { return M_SAVECLEANVERIFY; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1580
export let M_RESETSTATSVERIFY = cMarkAggregate(({"cursorpos": cMarkAggregate(({"x": i32((160 << 16)), "y": i32((129 << 16))})), "linkID": i32(750), "animation": 0}));
function __cxx_static_address_1ab1532aadee8fad0552bbcf() {
  return __cxx_static_address_1ab1532aadee8fad0552bbcf.reference || (__cxx_static_address_1ab1532aadee8fad0552bbcf.reference = {
    __cReference: true,
    get value() { return M_RESETSTATSVERIFY; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1581
export let M_QUIT = cMarkAggregate(({"cursorpos": cMarkAggregate(({"x": i32((160 << 16)), "y": i32((120 << 16))})), "linkID": i32(-2), "animation": 0}));
function __cxx_static_address_102bfe595ec3999b40cf1c8c() {
  return __cxx_static_address_102bfe595ec3999b40cf1c8c.reference || (__cxx_static_address_102bfe595ec3999b40cf1c8c.reference = {
    __cReference: true,
    get value() { return M_QUIT; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1582
export let M_QUITTOTITLE = cMarkAggregate(({"cursorpos": cMarkAggregate(({"x": i32((160 << 16)), "y": i32((120 << 16))})), "linkID": i32(-2), "animation": 0}));
function __cxx_static_address_2aee0775b4f74fba353b0d4e() {
  return __cxx_static_address_2aee0775b4f74fba353b0d4e.reference || (__cxx_static_address_2aee0775b4f74fba353b0d4e.reference = {
    __cReference: true,
    get value() { return M_QUITTOTITLE; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1583
export let M_LOADVERIFY = cMarkAggregate(({"cursorpos": cMarkAggregate(({"x": i32((160 << 16)), "y": i32((129 << 16))})), "linkID": i32(-2), "animation": 0}));
function __cxx_static_address_def270e635c246ee5bc8b338() {
  return __cxx_static_address_def270e635c246ee5bc8b338.reference || (__cxx_static_address_def270e635c246ee5bc8b338.reference = {
    __cReference: true,
    get value() { return M_LOADVERIFY; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1584
export let M_LOADDELVERIFY = cMarkAggregate(({"cursorpos": cMarkAggregate(({"x": i32((160 << 16)), "y": i32((129 << 16))})), "linkID": i32(300), "animation": 0}));
function __cxx_static_address_ddb00723b76e2fcbd619b0aa() {
  return __cxx_static_address_ddb00723b76e2fcbd619b0aa.reference || (__cxx_static_address_ddb00723b76e2fcbd619b0aa.reference = {
    __cReference: true,
    get value() { return M_LOADDELVERIFY; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1585
export let M_NEWVERIFY = cMarkAggregate(({"cursorpos": cMarkAggregate(({"x": i32((160 << 16)), "y": i32((120 << 16))})), "linkID": i32(100), "animation": 2}));
function __cxx_static_address_3cd5ce8cc3128eeb35e6ca22() {
  return __cxx_static_address_3cd5ce8cc3128eeb35e6ca22.reference || (__cxx_static_address_3cd5ce8cc3128eeb35e6ca22.reference = {
    __cReference: true,
    get value() { return M_NEWVERIFY; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1586
export let M_SAVEVERIFY = cMarkAggregate(({"cursorpos": cMarkAggregate(({"x": i32((160 << 16)), "y": i32((120 << 16))})), "linkID": i32(350), "animation": 0}));
function __cxx_static_address_bee8897874a2bf04e9b9450f() {
  return __cxx_static_address_bee8897874a2bf04e9b9450f.reference || (__cxx_static_address_bee8897874a2bf04e9b9450f.reference = {
    __cReference: true,
    get value() { return M_SAVEVERIFY; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1587
export let M_SAVEDELVERIFY = cMarkAggregate(({"cursorpos": cMarkAggregate(({"x": i32((160 << 16)), "y": i32((129 << 16))})), "linkID": i32(350), "animation": 0}));
function __cxx_static_address_d126fd9d2346390ca1344fda() {
  return __cxx_static_address_d126fd9d2346390ca1344fda.reference || (__cxx_static_address_d126fd9d2346390ca1344fda.reference = {
    __cReference: true,
    get value() { return M_SAVEDELVERIFY; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1588
export let M_RESETPLAYER = cMarkAggregate(({"cursorpos": cMarkAggregate(({"x": i32((160 << 16)), "y": i32((129 << 16))})), "linkID": i32(-2), "animation": 0}));
function __cxx_static_address_60dd8317e60fea43a8097235() {
  return __cxx_static_address_60dd8317e60fea43a8097235.reference || (__cxx_static_address_60dd8317e60fea43a8097235.reference = {
    __cReference: true,
    get value() { return M_RESETPLAYER; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1590
export let M_COLCORRRESETVERIFY = cMarkAggregate(({"cursorpos": cMarkAggregate(({"x": i32((160 << 16)), "y": i32((120 << 16))})), "linkID": i32(231), "animation": 0}));
function __cxx_static_address_a494e2a1e8207fed082be9a6() {
  return __cxx_static_address_a494e2a1e8207fed082be9a6.reference || (__cxx_static_address_a494e2a1e8207fed082be9a6.reference = {
    __cReference: true,
    get value() { return M_COLCORRRESETVERIFY; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1591
export let M_KEYSRESETVERIFY = cMarkAggregate(({"cursorpos": cMarkAggregate(({"x": i32((160 << 16)), "y": i32((120 << 16))})), "linkID": i32(204), "animation": 0}));
function __cxx_static_address_6458e76cde2d8be4c2664e06() {
  return __cxx_static_address_6458e76cde2d8be4c2664e06.reference || (__cxx_static_address_6458e76cde2d8be4c2664e06.reference = {
    __cReference: true,
    get value() { return M_KEYSRESETVERIFY; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1592
export let M_KEYSCLASSICVERIFY = cMarkAggregate(({"cursorpos": cMarkAggregate(({"x": i32((160 << 16)), "y": i32((120 << 16))})), "linkID": i32(204), "animation": 0}));
function __cxx_static_address_aadeaa18cbecb5f8fd95eb6d() {
  return __cxx_static_address_aadeaa18cbecb5f8fd95eb6d.reference || (__cxx_static_address_aadeaa18cbecb5f8fd95eb6d.reference = {
    __cReference: true,
    get value() { return M_KEYSCLASSICVERIFY; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1593
export let M_JOYSTANDARDVERIFY = cMarkAggregate(({"cursorpos": cMarkAggregate(({"x": i32((160 << 16)), "y": i32((120 << 16))})), "linkID": i32(206), "animation": 0}));
function __cxx_static_address_5255e03df498c92a896065d6() {
  return __cxx_static_address_5255e03df498c92a896065d6.reference || (__cxx_static_address_5255e03df498c92a896065d6.reference = {
    __cReference: true,
    get value() { return M_JOYSTANDARDVERIFY; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1594
export let M_KEYOVERRIDEVERIFY = cMarkAggregate(({"cursorpos": cMarkAggregate(({"x": i32((304 << 16)), "y": i32((186 << 16))})), "linkID": i32(209), "animation": 0}));
function __cxx_static_address_b54ae8389d81683cb2fd10d7() {
  return __cxx_static_address_b54ae8389d81683cb2fd10d7.reference || (__cxx_static_address_b54ae8389d81683cb2fd10d7.reference = {
    __cReference: true,
    get value() { return M_KEYOVERRIDEVERIFY; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1596
export let M_NETWAITMASTER = cMarkAggregate(({"cursorpos": cMarkAggregate(({"x": i32((304 << 16)), "y": i32((186 << 16))})), "linkID": i32(-2147483648), "animation": 0}));
function __cxx_static_address_fa3e38e2ecdbc20ee064beaa() {
  return __cxx_static_address_fa3e38e2ecdbc20ee064beaa.reference || (__cxx_static_address_fa3e38e2ecdbc20ee064beaa.reference = {
    __cReference: true,
    get value() { return M_NETWAITMASTER; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1597
export let M_NETWAITVOTES = cMarkAggregate(({"cursorpos": cMarkAggregate(({"x": i32((304 << 16)), "y": i32((186 << 16))})), "linkID": i32(-2147483648), "animation": 0}));
function __cxx_static_address_64546428d740e07fbfd060b5() {
  return __cxx_static_address_64546428d740e07fbfd060b5.reference || (__cxx_static_address_64546428d740e07fbfd060b5.reference = {
    __cReference: true,
    get value() { return M_NETWAITVOTES; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1598
export let M_BUYDUKE = cMarkAggregate(({"cursorpos": cMarkAggregate(({"x": i32((304 << 16)), "y": i32((186 << 16))})), "linkID": i32(100), "animation": 1}));
function __cxx_static_address_c8bbcdeccc1e001ba375e26f() {
  return __cxx_static_address_c8bbcdeccc1e001ba375e26f.reference || (__cxx_static_address_c8bbcdeccc1e001ba375e26f.reference = {
    __cReference: true,
    get value() { return M_BUYDUKE; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1600
export let M_ADULTPASSWORD = cMarkAggregate(({"input": null, "instructions": Uint8Array.from([69, 110, 116, 101, 114, 32, 80, 97, 115, 115, 119, 111, 114, 100, 58, 0]), "bufsize": 128, "flags": ((1) & 255)}));
function __cxx_static_address_df8bff8a6d2338df2f413a41() {
  return __cxx_static_address_df8bff8a6d2338df2f413a41.reference || (__cxx_static_address_df8bff8a6d2338df2f413a41.reference = {
    __cReference: true,
    get value() { return M_ADULTPASSWORD; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1601
export let M_CHEATENTRY = cMarkAggregate(({"input": null, "instructions": Uint8Array.from([69, 110, 116, 101, 114, 32, 67, 104, 101, 97, 116, 32, 67, 111, 100, 101, 58, 0]), "bufsize": 20, "flags": ((0) & 255)}));
function __cxx_static_address_74ac1502ef777b2cccb564e4() {
  return __cxx_static_address_74ac1502ef777b2cccb564e4.reference || (__cxx_static_address_74ac1502ef777b2cccb564e4.reference = {
    __cReference: true,
    get value() { return M_CHEATENTRY; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1602
export let M_CHEAT_WARP = cMarkAggregate(({"input": null, "instructions": Uint8Array.from([69, 110, 116, 101, 114, 32, 87, 97, 114, 112, 32, 35, 58, 0]), "bufsize": 4, "flags": ((0) & 255)}));
function __cxx_static_address_6f10c2a3a281d658ffd7cfc4() {
  return __cxx_static_address_6f10c2a3a281d658ffd7cfc4.reference || (__cxx_static_address_6f10c2a3a281d658ffd7cfc4.reference = {
    __cReference: true,
    get value() { return M_CHEAT_WARP; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1603
export let M_CHEAT_SKILL = cMarkAggregate(({"input": null, "instructions": Uint8Array.from([69, 110, 116, 101, 114, 32, 83, 107, 105, 108, 108, 32, 35, 58, 0]), "bufsize": 2, "flags": ((0) & 255)}));
function __cxx_static_address_e6ef9aad8aeaddd3d14b830d() {
  return __cxx_static_address_e6ef9aad8aeaddd3d14b830d.reference || (__cxx_static_address_e6ef9aad8aeaddd3d14b830d.reference = {
    __cReference: true,
    get value() { return M_CHEAT_SKILL; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1607
export let lastuserdir = new Uint8Array(256);
function __cxx_static_address_604a9778a600b52e499c8842() {
  return __cxx_static_address_604a9778a600b52e499c8842.reference || (__cxx_static_address_604a9778a600b52e499c8842.reference = {
    __cReference: true,
    get value() { return lastuserdir; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1611
export let lastsfdir = new Uint8Array(256);
function __cxx_static_address_a1b07bbce21bb1720763c8c0() {
  return __cxx_static_address_a1b07bbce21bb1720763c8c0.reference || (__cxx_static_address_a1b07bbce21bb1720763c8c0.reference = {
    __cReference: true,
    get value() { return lastsfdir; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1713
export let m_parentMenu = null;
function __cxx_static_address_9369affe588b9a67003a7ff4() {
  return __cxx_static_address_9369affe588b9a67003a7ff4.reference || (__cxx_static_address_9369affe588b9a67003a7ff4.reference = {
    __cReference: true,
    get value() { return m_parentMenu; },
    set value(__cxx_lvalue_0) { m_parentMenu = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1715
export let g_currentMenu = 0;
export function __cxx_global_cell_0253173354832cddecae7ca7() {
  return __cxx_global_cell_0253173354832cddecae7ca7.reference || (__cxx_global_cell_0253173354832cddecae7ca7.reference = {
    __cReference: true,
    get value() { return g_currentMenu; },
    set value(__cxx_lvalue_0) { g_currentMenu = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1716
export let g_previousMenu = 0;
function __cxx_static_address_c6493b077f65d086105a3233() {
  return __cxx_static_address_c6493b077f65d086105a3233.reference || (__cxx_static_address_c6493b077f65d086105a3233.reference = {
    __cReference: true,
    get value() { return g_previousMenu; },
    set value(__cxx_lvalue_0) { g_previousMenu = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1724
export function MenuEntry_DisableOnCondition(entry, condition) {
  if (Boolean(condition)) {
    ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = i32((__cxx_lvalue_0.value | i32(1)))))(cObjectFieldRef(cRecordObject(entry), "flags"));
  } else {
    ((__cxx_lvalue_1) => (__cxx_lvalue_1.value = i32((__cxx_lvalue_1.value & (~i32(1))))))(cObjectFieldRef(cRecordObject(entry), "flags"));
  }
}

// C/C++ source: source/duke3d/src/menus.cpp:1731
export function MenuEntry_LookDisabledOnCondition(entry, condition) {
  if (Boolean(condition)) {
    ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = i32((__cxx_lvalue_0.value | i32(2)))))(cObjectFieldRef(cRecordObject(entry), "flags"));
  } else {
    ((__cxx_lvalue_1) => (__cxx_lvalue_1.value = i32((__cxx_lvalue_1.value & (~i32(2))))))(cObjectFieldRef(cRecordObject(entry), "flags"));
  }
}

// C/C++ source: source/duke3d/src/menus.cpp:1738
export function MenuEntry_HideOnCondition(entry, condition) {
  if (Boolean(condition)) {
    ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = i32((__cxx_lvalue_0.value | i32(4)))))(cObjectFieldRef(cRecordObject(entry), "flags"));
  } else {
    ((__cxx_lvalue_1) => (__cxx_lvalue_1.value = i32((__cxx_lvalue_1.value & (~i32(4))))))(cObjectFieldRef(cRecordObject(entry), "flags"));
  }
}

// C/C++ source: source/duke3d/src/menus.cpp:1771
export let SELECTDIR_z = i32(65536);
function __cxx_static_address_6f12c196efdac9359e433600() {
  return __cxx_static_address_6f12c196efdac9359e433600.reference || (__cxx_static_address_6f12c196efdac9359e433600.reference = {
    __cReference: true,
    get value() { return SELECTDIR_z; },
    set value(__cxx_lvalue_0) { SELECTDIR_z = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1919
export const s_ellipsis = (() => { const bytes = new Uint8Array(4); bytes.set([46, 46, 46]); return bytes; })();
function __cxx_static_address_790622a05b0535bcb3cafbd9() {
  return __cxx_static_address_790622a05b0535bcb3cafbd9.reference || (__cxx_static_address_790622a05b0535bcb3cafbd9.reference = {
    __cReference: true,
    get value() { return s_ellipsis; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1925
export let s_savedKeyColumn = null;
function __cxx_static_address_0256bbfb5519d9defbd3265e() {
  return __cxx_static_address_0256bbfb5519d9defbd3265e.reference || (__cxx_static_address_0256bbfb5519d9defbd3265e.reference = {
    __cReference: true,
    get value() { return s_savedKeyColumn; },
    set value(__cxx_lvalue_0) { s_savedKeyColumn = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1926
export let s_savedScanCode = i32(255);
function __cxx_static_address_9acba4f390a8dc888d336bb5() {
  return __cxx_static_address_9acba4f390a8dc888d336bb5.reference || (__cxx_static_address_9acba4f390a8dc888d336bb5.reference = {
    __cReference: true,
    get value() { return s_savedScanCode; },
    set value(__cxx_lvalue_0) { s_savedScanCode = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1928
export let numConflictingGamefuncs = i32(0);
function __cxx_static_address_01001a68b6a66c8f2ded59c2() {
  return __cxx_static_address_01001a68b6a66c8f2ded59c2.reference || (__cxx_static_address_01001a68b6a66c8f2ded59c2.reference = {
    __cReference: true,
    get value() { return numConflictingGamefuncs; },
    set value(__cxx_lvalue_0) { numConflictingGamefuncs = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1929
export let s_overrideGamefuncMessage = new Uint8Array(268);
function __cxx_static_address_8b54d3db1f668863830dcc43() {
  return __cxx_static_address_8b54d3db1f668863830dcc43.reference || (__cxx_static_address_8b54d3db1f668863830dcc43.reference = {
    __cReference: true,
    get value() { return s_overrideGamefuncMessage; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:1930
const __cxx_literal_d097df1d387335457749 = Uint8Array.from([37, 115, 10, 0]);
export function Menu_RefreshBoundGamefuncNames(sc) {
  (numConflictingGamefuncs = i32(0));
  ((cDeref(cPointerOffset(s_overrideGamefuncMessage, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = ((0) & 255));
  let bytesWritten = u64(0);
  for (let i = i32(0); ((i < M_KEYBOARDKEYS.numEntries) && (numConflictingGamefuncs <= 8)); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return next; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
    if ((i == M_KEYBOARDKEYS.currentEntry)) {
      continue;
    }
    let entryPtr = (cPointerElementRef(M_KEYBOARDKEYS.entrylist, i).value);
    if (cPointerCompare(entryPtr, null, "==")) {
      continue;
    }
    let iterCol = cRecordObject(entryPtr).entry;
    if (Boolean(i32((i32((i32((cDeref((cPointerElementRef(cRecordObject(iterCol).column, 0).value), Uint8Array).value)) == sc)) | i32((i32((cDeref((cPointerElementRef(cRecordObject(iterCol).column, 1).value), Uint8Array).value)) == sc)))))) {
      let bytesRemaining = u64((BigInt((BigInt(u64(i32(Math.imul(8, i32((32 + 1)))))) + BigInt(ARRAY_SIZE__header_ca3fb010ee15(s_ellipsis)))) - BigInt(bytesWritten)));
      let name = ((numConflictingGamefuncs < 8) ? cRecordObject((cPointerElementRef(M_KEYBOARDKEYS.entrylist, i).value)).name : s_ellipsis);
      (bytesWritten = u64((BigInt(bytesWritten) + BigInt(u64(cByteMemory.snprintf(cPointerOffset(s_overrideGamefuncMessage, bytesWritten, Uint8Array.BYTES_PER_ELEMENT), bytesRemaining, __cxx_literal_d097df1d387335457749, name))))));
      ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return next; })(__cxx_static_address_01001a68b6a66c8f2ded59c2());
    }
  }
}

// C/C++ source: source/duke3d/src/menus.cpp:4400
export let save_xxh = u64(0);
function __cxx_static_address_8b7a1534a7601cecbde39a73() {
  return __cxx_static_address_8b7a1534a7601cecbde39a73.reference || (__cxx_static_address_8b7a1534a7601cecbde39a73.reference = {
    __cReference: true,
    get value() { return save_xxh; },
    set value(__cxx_lvalue_0) { save_xxh = u64(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:4790
export function klistbookends(start) {
  let end = start;
  if ((!start)) {
    return;
  }
  while (cRecordObject(start).prev) {
    (start = cRecordObject(start).prev);
  }
  while (cRecordObject(end).next) {
    (end = cRecordObject(end).next);
  }
  let i = i32(0);
  for (let n = start; n; (n = cRecordObject(n).next)) {
    (cRecordObject(n).type = i32(i));
    (cRecordObject(n).usera = start);
    (cRecordObject(n).userb = end);
    ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }));
  }
}

// C/C++ source: source/duke3d/src/menus.cpp:4937
export let m_animation = cZeroAggregate({"record": {"current": {"pointer": true}, "in": {"pointer": true}, "length": {"scalar": "int"}, "out": {"pointer": true}, "previous": {"pointer": true}, "start": {"scalar": "unsigned int"}}});
export function __cxx_global_cell_509e4643eaf38f759bb877e6() {
  return __cxx_global_cell_509e4643eaf38f759bb877e6.reference || (__cxx_global_cell_509e4643eaf38f759bb877e6.reference = {
    __cReference: true,
    get value() { return m_animation; },
    set value(__cxx_lvalue_0) { throw new TypeError("record address cannot replace original object storage"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:5081
export function Menu_IsEntryActive(pEntry) {
  return i32(((cPointerCompare(pEntry, null, "!=") && (!Boolean(i32((cRecordObject(pEntry).flags & i32(4)))))) && (i32(cRecordObject(pEntry).type) != i32(7))));
}

// C/C++ source: source/duke3d/src/menus.cpp:5407
export function Menu_DetermineSpecialState(entry) {
  if (cPointerCompare(entry, null, "==")) {
    return i32(0);
  }
  if ((i32(cRecordObject(entry).type) == i32(6))) {
    if (cRecordObject(cRecordObject(entry).entry).editfield) {
      return i32(1);
    }
  } else {
    if ((i32(cRecordObject(entry).type) == i32(2))) {
      if ((cRecordObject(cRecordObject(cRecordObject(entry).entry).options).currentEntry >= 0)) {
        return i32(2);
      }
    } else {
      if ((i32(cRecordObject(entry).type) == i32(3))) {
        if (Boolean(cRecordObject(cRecordObject(entry).entry).screenOpen)) {
          return i32(2);
        }
      }
    }
  }
  return i32(0);
}

// C/C++ source: source/duke3d/src/menus.cpp:5457
export function Menu_BlackTranslucentBackgroundOK(cm) {
  switch (cm) {
    case i32(231):
    case i32(232): {
      return i32(0);
    }
    break;
    default: {
      return i32(1);
    }
    break;
  }
  return i32(1);
}

// C/C++ source: source/duke3d/src/menus.cpp:5473
export function Menu_UpdateScreenOK(cm) {
  switch (cm) {
    case i32(300):
    case i32(350):
    case i32(1000):
    case i32(1100):
    case i32(2000):
    case i32(2100): {
      return i32(0);
    }
    break;
    default: {
      return i32(1);
    }
    break;
  }
  return i32(1);
}

// C/C++ source: source/duke3d/src/menus.cpp:5500
export let m_mouselastactivity = 0;
export function __cxx_global_cell_09f98d2a9a77d1d0ba356b5e() {
  return __cxx_global_cell_09f98d2a9a77d1d0ba356b5e.reference || (__cxx_global_cell_09f98d2a9a77d1d0ba356b5e.reference = {
    __cReference: true,
    get value() { return m_mouselastactivity; },
    set value(__cxx_lvalue_0) { m_mouselastactivity = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:5502
export let m_mousewake_watchpoint = 0;
export function __cxx_global_cell_f8cf9a80e61eccff7c1d84f9() {
  return __cxx_global_cell_f8cf9a80e61eccff7c1d84f9.reference || (__cxx_global_cell_f8cf9a80e61eccff7c1d84f9.reference = {
    __cReference: true,
    get value() { return m_mousewake_watchpoint; },
    set value(__cxx_lvalue_0) { m_mousewake_watchpoint = i32(__cxx_lvalue_0); }
  });
}

export let m_menuchange_watchpoint = 0;
export function __cxx_global_cell_fdb8af47893496b9790928b5() {
  return __cxx_global_cell_fdb8af47893496b9790928b5.reference || (__cxx_global_cell_fdb8af47893496b9790928b5.reference = {
    __cReference: true,
    get value() { return m_menuchange_watchpoint; },
    set value(__cxx_lvalue_0) { m_menuchange_watchpoint = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:5504
export let m_mousecaught = 0;
export function __cxx_global_cell_db576e27c32be8e817ebf01d() {
  return __cxx_global_cell_db576e27c32be8e817ebf01d.reference || (__cxx_global_cell_db576e27c32be8e817ebf01d.reference = {
    __cReference: true,
    get value() { return m_mousecaught; },
    set value(__cxx_lvalue_0) { m_mousecaught = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:5505
export let m_prevmousepos = cZeroAggregate({"record": {"x": {"scalar": "int"}, "y": {"scalar": "int"}}});
function __cxx_static_address_782c609241c6bfa7db0e6002() {
  return __cxx_static_address_782c609241c6bfa7db0e6002.reference || (__cxx_static_address_782c609241c6bfa7db0e6002.reference = {
    __cReference: true,
    get value() { return m_prevmousepos; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let m_mousepos = cZeroAggregate({"record": {"x": {"scalar": "int"}, "y": {"scalar": "int"}}});
function __cxx_static_address_3f538acdb97b6fa0e1e335ad() {
  return __cxx_static_address_3f538acdb97b6fa0e1e335ad.reference || (__cxx_static_address_3f538acdb97b6fa0e1e335ad.reference = {
    __cReference: true,
    get value() { return m_mousepos; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let m_mousedownpos = cZeroAggregate({"record": {"x": {"scalar": "int"}, "y": {"scalar": "int"}}});
function __cxx_static_address_56b5febef99e416abe40f3b4() {
  return __cxx_static_address_56b5febef99e416abe40f3b4.reference || (__cxx_static_address_56b5febef99e416abe40f3b4.reference = {
    __cReference: true,
    get value() { return m_mousedownpos; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:5648
export function Menu_FindOptionLinearSearch(object, query, searchstart, searchend) {
  for (let i = i32(searchstart); (i < i32(searchend)); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return next; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
    if (((cDeref(cPointerOffset(cRecordObject(cRecordObject(object).options).optionValues, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) == query)) {
      return i32(i);
    }
  }
  return i32((-1));
}

// C/C++ source: source/duke3d/src/menus.cpp:5657
export function Menu_FindOptionBinarySearch(object, query, searchstart, searchend) {
  let thissearch = ((((Math.trunc(i32((i32(searchstart) + i32(searchend))) / 2)) & 65535)) & 65535);
  let isIdentityMap = i32(cPointerCompare(cRecordObject(cRecordObject(object).options).optionValues, null, "=="));
  let destination = i32((Boolean(isIdentityMap) ? i32(thissearch) : (cDeref(cPointerOffset(cRecordObject(cRecordObject(object).options).optionValues, thissearch, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
  let difference = i32((query - destination));
  ((!Boolean(isIdentityMap)) || (query >= 0));
  if ((difference == 0)) {
    return i32(thissearch);
  } else {
    if ((i32(searchstart) == i32(searchend))) {
      return i32((-1));
    } else {
      if ((difference > 0)) {
        if ((i32(thissearch) == i32(searchend))) {
          return i32((-1));
        }
        (searchstart = ((((i32((i32(thissearch) + 1))) & 65535)) & 65535));
      } else {
        if ((difference < 0)) {
          if ((i32(thissearch) == i32(searchstart))) {
            return i32((-1));
          }
          (searchend = ((((i32((i32(thissearch) - 1))) & 65535)) & 65535));
        }
      }
    }
  }
  return i32(Menu_FindOptionBinarySearch(object, query, searchstart, searchend));
}

// C/C++ source: source/duke3d/src/menus.cpp:5686
export function Menu_MouseOutsideBounds(pos, x, y, width, height) {
  return i32(((((cRecordObject(pos).x < x) || (cRecordObject(pos).x >= i32((x + width)))) || (cRecordObject(pos).y < y)) || (cRecordObject(pos).y >= i32((y + height)))));
}

// C/C++ source: source/duke3d/src/menus.cpp:6577
export let Menu_RunInput_MouseReturn_status = 0;
function __cxx_static_address_2d3e353b71eee9cdd816ca14() {
  return __cxx_static_address_2d3e353b71eee9cdd816ca14.reference || (__cxx_static_address_2d3e353b71eee9cdd816ca14.reference = {
    __cReference: true,
    get value() { return Menu_RunInput_MouseReturn_status; },
    set value(__cxx_lvalue_0) { Menu_RunInput_MouseReturn_status = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/menus.cpp:7006
export function Menu_RunInput_EntryOptionList_MovementVerify(object) {
  let listytop = i32(cRecordObject(cRecordObject(cRecordObject(object).options).menuFormat).pos.y);
  let unitheight = i32(((cRecordObject(cRecordObject(object).options).getMarginBottom() < 0) ? Math.trunc(i32(((-cRecordObject(cRecordObject(object).options).getMarginBottom()) - cRecordObject(cRecordObject(cRecordObject(object).options).font).get_yline())) / cRecordObject(cRecordObject(object).options).numOptions) : i32((cRecordObject(cRecordObject(cRecordObject(object).options).font).get_yline() + cRecordObject(cRecordObject(object).options).getMarginBottom()))));
  let ytop = i32((listytop + i32(Math.imul(cRecordObject(cRecordObject(object).options).currentEntry, unitheight))));
  let ybottom = i32((ytop + cRecordObject(cRecordObject(cRecordObject(object).options).font).get_yline()));
  if ((i32((ybottom - cRecordObject(cRecordObject(object).options).scrollPos)) > cRecordObject(cRecordObject(cRecordObject(object).options).menuFormat).bottomcutoff)) {
    (cRecordObject(cRecordObject(object).options).scrollPos = i32((ybottom - cRecordObject(cRecordObject(cRecordObject(object).options).menuFormat).bottomcutoff)));
  } else {
    if ((i32((ytop - cRecordObject(cRecordObject(object).options).scrollPos)) < listytop)) {
      (cRecordObject(cRecordObject(object).options).scrollPos = i32((ytop - listytop)));
    }
  }
}

// C/C++ source: source/duke3d/src/menus.cpp:7020
export function Menu_RunInput_EntryOptionList_Movement(object, direction) {
  switch (i32(direction)) {
    case i32(1): {
      ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous - 1)); __cxx_lvalue_0.value = next; return next; })(cObjectFieldRef(cRecordObject(cRecordObject(object).options), "currentEntry"));
    }
    if ((cRecordObject(cRecordObject(object).options).currentEntry >= 0)) {
      break;
    }
    ;
    case i32(3): {
      (cRecordObject(cRecordObject(object).options).currentEntry = i32((cRecordObject(cRecordObject(object).options).numOptions - 1)));
    }
    break;
    case i32(4): {
      ((__cxx_lvalue_1) => { const previous = __cxx_lvalue_1.value; const next = i32((previous + 1)); __cxx_lvalue_1.value = next; return next; })(cObjectFieldRef(cRecordObject(cRecordObject(object).options), "currentEntry"));
    }
    if ((cRecordObject(cRecordObject(object).options).currentEntry < cRecordObject(cRecordObject(object).options).numOptions)) {
      break;
    }
    ;
    case i32(12): {
      (cRecordObject(cRecordObject(object).options).currentEntry = i32(0));
    }
    break;
    default: {
      break;
    }
  }
  Menu_RunInput_EntryOptionList_MovementVerify(object);
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_bdf485e707dc8696 = new Uint8Array([((1) & 255), ((2) & 255), ((4) & 255), ((8) & 255), ((16) & 255), ((32) & 255), ((64) & 255), ((128) & 255)]);
function __cxx_static_address_833387c87e4f96c06514cabd() {
  return __cxx_static_address_833387c87e4f96c06514cabd.reference || (__cxx_static_address_833387c87e4f96c06514cabd.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_bdf485e707dc8696; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:172
export const g_defaultVideoModes__header_global_c4cfbc6339e448f6 = [cMarkAggregate(({"x": 2560, "y": 1440})), cMarkAggregate(({"x": 2560, "y": 1200})), cMarkAggregate(({"x": 2560, "y": 1080})), cMarkAggregate(({"x": 1920, "y": 1440})), cMarkAggregate(({"x": 1920, "y": 1200})), cMarkAggregate(({"x": 1920, "y": 1080})), cMarkAggregate(({"x": 1680, "y": 1050})), cMarkAggregate(({"x": 1600, "y": 1200})), cMarkAggregate(({"x": 1600, "y": 900})), cMarkAggregate(({"x": 1366, "y": 768})), cMarkAggregate(({"x": 1280, "y": 1024})), cMarkAggregate(({"x": 1280, "y": 960})), cMarkAggregate(({"x": 1280, "y": 720})), cMarkAggregate(({"x": 1152, "y": 864})), cMarkAggregate(({"x": 1024, "y": 768})), cMarkAggregate(({"x": 1024, "y": 600})), cMarkAggregate(({"x": 800, "y": 600})), cMarkAggregate(({"x": 640, "y": 480})), cMarkAggregate(({"x": 640, "y": 400})), cMarkAggregate(({"x": 512, "y": 384})), cMarkAggregate(({"x": 480, "y": 360})), cMarkAggregate(({"x": 400, "y": 300})), cMarkAggregate(({"x": 320, "y": 240})), cMarkAggregate(({"x": 320, "y": 200})), cMarkAggregate(({"x": 0, "y": 0}))];
function __cxx_static_address_5c88915d7552fc0610fccf13() {
  return __cxx_static_address_5c88915d7552fc0610fccf13.reference || (__cxx_static_address_5c88915d7552fc0610fccf13.reference = {
    __cReference: true,
    get value() { return g_defaultVideoModes__header_global_c4cfbc6339e448f6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:188
export const g_keyAsciiTable__header_global_4f822cfa28c942be = new Uint8Array([((0) & 255), ((0) & 255), 49, 50, 51, 52, 53, 54, 55, 56, 57, 48, 45, 61, ((0) & 255), ((0) & 255), 113, 119, 101, 114, 116, 121, 117, 105, 111, 112, 91, 93, ((0) & 255), ((0) & 255), 97, 115, 100, 102, 103, 104, 106, 107, 108, 59, ((39) & 255), 96, ((0) & 255), ((92) & 255), 122, 120, 99, 118, 98, 110, 109, 44, 46, 47, ((0) & 255), 42, ((0) & 255), ((32) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255)]);
function __cxx_static_address_80675fecea54885056db65da() {
  return __cxx_static_address_80675fecea54885056db65da.reference || (__cxx_static_address_80675fecea54885056db65da.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTable__header_global_4f822cfa28c942be; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:196
export const g_keyAsciiTableShift__header_global_cb3c254da847b8a7 = new Uint8Array([((0) & 255), ((0) & 255), 33, 64, 35, 36, 37, 94, 38, 42, 40, 41, 95, 43, ((0) & 255), ((0) & 255), 81, 87, 69, 82, 84, 89, 85, 73, 79, 80, 123, 125, ((0) & 255), ((0) & 255), 65, 83, 68, 70, 71, 72, 74, 75, 76, 58, 34, 126, ((0) & 255), 124, 90, 88, 67, 86, 66, 78, 77, 60, 62, 63, ((0) & 255), 42, ((0) & 255), ((32) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255)]);
function __cxx_static_address_dfbe21c9361f810ad853dcb0() {
  return __cxx_static_address_dfbe21c9361f810ad853dcb0.reference || (__cxx_static_address_dfbe21c9361f810ad853dcb0.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTableShift__header_global_cb3c254da847b8a7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:895
export const pow2long__header_global_b9767339631c12fe = new Int32Array([1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576, 2097152, 4194304, 8388608, 16777216, 33554432, 67108864, 134217728, 268435456, 536870912, 1073741824, 2147483647]);
function __cxx_static_address_5351676f4eb97222a5200773() {
  return __cxx_static_address_5351676f4eb97222a5200773.reference || (__cxx_static_address_5351676f4eb97222a5200773.reference = {
    __cReference: true,
    get value() { return pow2long__header_global_b9767339631c12fe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:907
export const pow2ulong__header_global_65f5d38a50fe2bc8 = new Uint32Array([u32(1), u32(2), u32(4), u32(8), u32(16), u32(32), u32(64), u32(128), u32(256), u32(512), u32(1024), u32(2048), u32(4096), u32(8192), u32(16384), u32(32768), u32(65536), u32(131072), u32(262144), u32(524288), u32(1048576), u32(2097152), u32(4194304), u32(8388608), u32(16777216), u32(33554432), u32(67108864), u32(134217728), u32(268435456), u32(536870912), u32(1073741824), u32(2147483648n)]);
function __cxx_static_address_31cb041bb1d1737da26cb4fa() {
  return __cxx_static_address_31cb041bb1d1737da26cb4fa.reference || (__cxx_static_address_31cb041bb1d1737da26cb4fa.reference = {
    __cReference: true,
    get value() { return pow2ulong__header_global_65f5d38a50fe2bc8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:919
export const pow264__header_global_92c713dbf5892a52 = new BigInt64Array([BigInt(i64(1)), BigInt(i64(2)), BigInt(i64(4)), BigInt(i64(8)), BigInt(i64(16)), BigInt(i64(32)), BigInt(i64(64)), BigInt(i64(128)), BigInt(i64(256)), BigInt(i64(512)), BigInt(i64(1024)), BigInt(i64(2048)), BigInt(i64(4096)), BigInt(i64(8192)), BigInt(i64(16384)), BigInt(i64(32768)), BigInt(i64(65536)), BigInt(i64(131072)), BigInt(i64(262144)), BigInt(i64(524288)), BigInt(i64(1048576)), BigInt(i64(2097152)), BigInt(i64(4194304)), BigInt(i64(8388608)), BigInt(i64(16777216)), BigInt(i64(33554432)), BigInt(i64(67108864)), BigInt(i64(134217728)), BigInt(i64(268435456)), BigInt(i64(536870912)), BigInt(i64(1073741824)), BigInt(2147483648n), BigInt(4294967296n), BigInt(8589934592n), BigInt(17179869184n), BigInt(34359738368n), BigInt(68719476736n), BigInt(137438953472n), BigInt(274877906944n), BigInt(549755813888n), BigInt(1099511627776n), BigInt(2199023255552n), BigInt(4398046511104n), BigInt(8796093022208n), BigInt(17592186044416n), BigInt(35184372088832n), BigInt(70368744177664n), BigInt(140737488355328n), BigInt(281474976710656n), BigInt(562949953421312n), BigInt(1125899906842624n), BigInt(2251799813685248n), BigInt(4503599627370496n), BigInt(9007199254740992n), BigInt(18014398509481984n), BigInt(36028797018963968n), BigInt(72057594037927936n), BigInt(144115188075855872n), BigInt(288230376151711744n), BigInt(576460752303423488n), BigInt(1152921504606846976n), BigInt(2305843009213693952n), BigInt(4611686018427387904n), BigInt(9223372036854775807n)]);
function __cxx_static_address_3ce80b3a788a4dadfbdcf980() {
  return __cxx_static_address_3ce80b3a788a4dadfbdcf980.reference || (__cxx_static_address_3ce80b3a788a4dadfbdcf980.reference = {
    __cReference: true,
    get value() { return pow264__header_global_92c713dbf5892a52; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export function ARRAY_SIZE__header_509d6c17e985(arg0) {
  return u64(128n);
}

export function ARRAY_SIZE__header_140a0064b4b5(arg0) {
  return u64(2n);
}

export function ARRAY_SIZE__header_bc5c791601c0(arg0) {
  return u64(64n);
}

export function ARRAY_SIZE__header_391ffb47db70(arg0) {
  return u64(3n);
}

export function ARRAY_SIZE__header_eaaa42f4690d(arg0) {
  return u64(27n);
}

export function ARRAY_SIZE__header_76a0fdfcb9c8(arg0) {
  return u64(5n);
}

export function ARRAY_SIZE__header_e71203d76ea4(arg0) {
  return u64(11n);
}

export function ARRAY_SIZE__header_a5d80494f23d(arg0) {
  return u64(4n);
}

export function ARRAY_SIZE__header_f6ae2e506a28(arg0) {
  return u64(16n);
}

export function ARRAY_SIZE__header_1efc7fd664f2(arg0) {
  return u64(8n);
}

export function ARRAY_SIZE__header_242f5515aa59(arg0) {
  return u64(6n);
}

export function ARRAY_SIZE__header_49327c0dc9b0(arg0) {
  return u64(7n);
}

export function ARRAY_SIZE__header_36111f5b1b0b(arg0) {
  return u64(9n);
}

export function ARRAY_SIZE__header_383fe4e8923d(arg0) {
  return u64(3n);
}

export function ARRAY_SIZE__header_7e71342c3d92(arg0) {
  return u64(5n);
}

export function ARRAY_SIZE__header_168b4e18fdcc(arg0) {
  return u64(8n);
}

export function ARRAY_SIZE__header_b8bdaf1298a7(arg0) {
  return u64(22n);
}

export function ARRAY_SIZE__header_0eb6da4228de(arg0) {
  return u64(10n);
}

export function ARRAY_SIZE__header_7b0f4ceab8ed(arg0) {
  return u64(4n);
}

export function ARRAY_SIZE__header_87ba03cdfff0(arg0) {
  return u64(36n);
}

export function ARRAY_SIZE__header_cd9c26ba8a7e(arg0) {
  return u64(63n);
}

export function ARRAY_SIZE__header_ec180b1162f0(arg0) {
  return u64(12n);
}

export function ARRAY_SIZE__header_09bf14cca292(arg0) {
  return u64(2n);
}

export function ARRAY_SIZE__header_b15ad1c9f25a(arg0) {
  return u64(71n);
}

export function ARRAY_SIZE__header_ca3fb010ee15(arg0) {
  return u64(4n);
}

export function ARRAY_SIZE__header_f3bc039f6aee(arg0) {
  return u64(12n);
}

// C/C++ source: source/duke3d/src/menus.cpp:1079
export function videoGetRenderMode__header_857b30778337() {
  return i32(0);
}

// C/C++ source: source/duke3d/src/menus.cpp:431
let __static_G_GetTeamPalette__header_adff5a1912de_pal = new Int8Array([(((3) << 24) >> 24), (((10) << 24) >> 24), (((11) << 24) >> 24), (((12) << 24) >> 24)]);
export function G_GetTeamPalette__header_adff5a1912de(team) {

  if ((u64(u32(team)) >= ARRAY_SIZE__header_5ea1543e9f54(__static_G_GetTeamPalette__header_adff5a1912de_pal))) {
    return i32(0);
  }
  return i32((cDeref(cPointerOffset(__static_G_GetTeamPalette__header_adff5a1912de_pal, team, Int8Array.BYTES_PER_ELEMENT), Int8Array).value));
}

export function ARRAY_SIZE__header_c3fbd8951366(arg0) {
  return u64(8192n);
}

export function ARRAY_SIZE__header_7ad6c6b3ee6f(arg0) {
  return u64(36n);
}

export function ARRAY_SIZE__header_eee63e61fd24(arg0) {
  return u64(7n);
}

export function clamp__header_464875a28708(__cxx_in, min, max) {
  return i32(((__cxx_in <= i32(min)) ? i32(min) : ((__cxx_in >= i32(max)) ? i32(max) : __cxx_in)));
}

export function clamp__header_85f153c22221(__cxx_in, min, max) {
  return Math.fround(((__cxx_in <= Math.fround(min)) ? Math.fround(min) : ((__cxx_in >= Math.fround(max)) ? Math.fround(max) : __cxx_in)));
}

// C/C++ source: source/build/include/smmalloc.h:859
export function _sm_malloc(allocator, bytesCount, alignment) {
  return cRecordObject(allocator).Alloc(bytesCount, alignment);
}

// C/C++ source: source/build/include/smmalloc.h:864
export function _sm_free(allocator, p) {
  return cRecordObject(allocator).Free(p);
}

export function ARRAY_SIZE__header_5ea1543e9f54(arg0) {
  return u64(4n);
}

// C/C++ source: source/build/include/smmalloc.h:866
export function _sm_realloc(allocator, p, bytesCount, alignment) {
  return cRecordObject(allocator).Realloc(p, bytesCount, alignment);
}

export function __cxx_operator_761c63d1e16e183f(lhs, rhs) {
  return cCopyTrivialClass(lhs.__cxx_operator_86b05ee676890126(rhs), ClockTicks(), ["wholeTicks", "ticksS32"]);
}

export function __cxx_operator_35d41574d9c68141(lhs, rhs) {
  return Boolean((lhs.wholeTicks == rhs.wholeTicks));
}

export function __cxx_operator_11a696315e969ab4(lhs, rhs) {
  return Boolean((lhs.wholeTicks < rhs.wholeTicks));
}

export function __cxx_operator_9d5bfff63c86ec9c(lhs, rhs) {
  return Boolean(__cxx_operator_11a696315e969ab4(rhs, lhs));
}
