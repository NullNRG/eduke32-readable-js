// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/duke3d/src/gameexec.cpp
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

const i32 = value => Number(value) | 0;
const u32 = value => Number(value) >>> 0;
const i64 = value => BigInt.asIntN(64, BigInt(value));
const u64 = value => BigInt.asUintN(64, BigInt(value));


const clz64 = value => {let v=BigInt.asUintN(64,BigInt(value));if(v===0n)return 64;let n=0;while((v&(1n<<63n))===0n){v<<=1n;n++;}return n;};
const ctz64 = (value,width) => {let v=BigInt.asUintN(width,BigInt(value));if(v===0n)return width;let n=0;while((v&1n)===0n){v>>=1n;n++;}return n;};
const popcnt = value => {let v=value,n=0;while(v){v&=v-1n;n++;}return n;};

const __builtin_unreachable = () => { throw new Error("C++ undefined behavior: reached __builtin_unreachable"); };
// C/C++ source: source/build/include/fix16.h:111
export const fix16_rad_to_deg_mult__header_global_6124cea01312b120 = i32(3754936);
function __cxx_static_address_812eea56975209a9fc77f8a4() {
  return __cxx_static_address_812eea56975209a9fc77f8a4.reference || (__cxx_static_address_812eea56975209a9fc77f8a4.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_6124cea01312b120; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_895bf42e7af34d4b = i32(1144);
function __cxx_static_address_8e9a43d191a6817b1bf4097b() {
  return __cxx_static_address_8e9a43d191a6817b1bf4097b.reference || (__cxx_static_address_8e9a43d191a6817b1bf4097b.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_895bf42e7af34d4b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:43
export const KICK_HIT____header_global_0d60149312684040 = ((((((0) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e617be7f2d703aee2aabfe64() {
  return __cxx_static_address_e617be7f2d703aee2aabfe64.reference || (__cxx_static_address_e617be7f2d703aee2aabfe64.reference = {
    __cReference: true,
    get value() { return KICK_HIT____header_global_0d60149312684040; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:44
export const PISTOL_RICOCHET____header_global_682a62990e83cd44 = ((((((1) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a4daaa87218c464b475f7377() {
  return __cxx_static_address_a4daaa87218c464b475f7377.reference || (__cxx_static_address_a4daaa87218c464b475f7377.reference = {
    __cReference: true,
    get value() { return PISTOL_RICOCHET____header_global_682a62990e83cd44; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:45
export const PISTOL_BODYHIT____header_global_1484e5b8ac0c858f = ((((((2) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6a5de84d98ce6a59c25e07c6() {
  return __cxx_static_address_6a5de84d98ce6a59c25e07c6.reference || (__cxx_static_address_6a5de84d98ce6a59c25e07c6.reference = {
    __cReference: true,
    get value() { return PISTOL_BODYHIT____header_global_1484e5b8ac0c858f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:46
export const PISTOL_FIRE____header_global_6e305041b2458b50 = ((((((3) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ef17b2d87afa75e24949195c() {
  return __cxx_static_address_ef17b2d87afa75e24949195c.reference || (__cxx_static_address_ef17b2d87afa75e24949195c.reference = {
    __cReference: true,
    get value() { return PISTOL_FIRE____header_global_6e305041b2458b50; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:47
export const EJECT_CLIP____header_global_1f20053b14e4826c = ((((((4) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4dc32413c380e1f88682e092() {
  return __cxx_static_address_4dc32413c380e1f88682e092.reference || (__cxx_static_address_4dc32413c380e1f88682e092.reference = {
    __cReference: true,
    get value() { return EJECT_CLIP____header_global_1f20053b14e4826c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:48
export const INSERT_CLIP____header_global_2ea6cc0533850775 = ((((((5) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8bc8ae792da485833df2cfb9() {
  return __cxx_static_address_8bc8ae792da485833df2cfb9.reference || (__cxx_static_address_8bc8ae792da485833df2cfb9.reference = {
    __cReference: true,
    get value() { return INSERT_CLIP____header_global_2ea6cc0533850775; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:49
export const CHAINGUN_FIRE____header_global_b02c5d10d3eebeaa = ((((((6) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6f059d536ac15705a833de8a() {
  return __cxx_static_address_6f059d536ac15705a833de8a.reference || (__cxx_static_address_6f059d536ac15705a833de8a.reference = {
    __cReference: true,
    get value() { return CHAINGUN_FIRE____header_global_b02c5d10d3eebeaa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:50
export const RPG_SHOOT____header_global_b953a0d9ae949109 = ((((((7) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6d16b4944071f116a2d9e797() {
  return __cxx_static_address_6d16b4944071f116a2d9e797.reference || (__cxx_static_address_6d16b4944071f116a2d9e797.reference = {
    __cReference: true,
    get value() { return RPG_SHOOT____header_global_b953a0d9ae949109; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:51
export const POOLBALLHIT____header_global_8d69aca4869de2f0 = ((((((8) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_68f64374d647c8bff1937477() {
  return __cxx_static_address_68f64374d647c8bff1937477.reference || (__cxx_static_address_68f64374d647c8bff1937477.reference = {
    __cReference: true,
    get value() { return POOLBALLHIT____header_global_8d69aca4869de2f0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:52
export const RPG_EXPLODE____header_global_24e26bac2ba787c9 = ((((((9) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8dfbf9f21a036eaf000490f0() {
  return __cxx_static_address_8dfbf9f21a036eaf000490f0.reference || (__cxx_static_address_8dfbf9f21a036eaf000490f0.reference = {
    __cReference: true,
    get value() { return RPG_EXPLODE____header_global_24e26bac2ba787c9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:53
export const CAT_FIRE____header_global_9b591a6c5540d89c = ((((((10) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d909138a2b2a1b50295d628b() {
  return __cxx_static_address_d909138a2b2a1b50295d628b.reference || (__cxx_static_address_d909138a2b2a1b50295d628b.reference = {
    __cReference: true,
    get value() { return CAT_FIRE____header_global_9b591a6c5540d89c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:54
export const SHRINKER_FIRE____header_global_41d4929109665dbc = ((((((11) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9141a9743e6ac4e1fbf65d41() {
  return __cxx_static_address_9141a9743e6ac4e1fbf65d41.reference || (__cxx_static_address_9141a9743e6ac4e1fbf65d41.reference = {
    __cReference: true,
    get value() { return SHRINKER_FIRE____header_global_41d4929109665dbc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:55
export const PIPEBOMB_BOUNCE____header_global_225d6833c3adabe2 = ((((((13) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_884bfe40f64f1c92a46e2d05() {
  return __cxx_static_address_884bfe40f64f1c92a46e2d05.reference || (__cxx_static_address_884bfe40f64f1c92a46e2d05.reference = {
    __cReference: true,
    get value() { return PIPEBOMB_BOUNCE____header_global_225d6833c3adabe2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:56
export const PIPEBOMB_EXPLODE____header_global_856aaa8597f8af8f = ((((((14) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_df6ec705e23431dc50b47853() {
  return __cxx_static_address_df6ec705e23431dc50b47853.reference || (__cxx_static_address_df6ec705e23431dc50b47853.reference = {
    __cReference: true,
    get value() { return PIPEBOMB_EXPLODE____header_global_856aaa8597f8af8f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:57
export const LASERTRIP_ONWALL____header_global_15295c7395fdea15 = ((((((15) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_95e8aff10c6b7f4b3561252b() {
  return __cxx_static_address_95e8aff10c6b7f4b3561252b.reference || (__cxx_static_address_95e8aff10c6b7f4b3561252b.reference = {
    __cReference: true,
    get value() { return LASERTRIP_ONWALL____header_global_15295c7395fdea15; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:58
export const LASERTRIP_ARMING____header_global_0eff944e43b00af8 = ((((((16) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7902102a84d79ac2328872ce() {
  return __cxx_static_address_7902102a84d79ac2328872ce.reference || (__cxx_static_address_7902102a84d79ac2328872ce.reference = {
    __cReference: true,
    get value() { return LASERTRIP_ARMING____header_global_0eff944e43b00af8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:59
export const LASERTRIP_EXPLODE____header_global_97b9f516dfef545e = ((((((17) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6cab337e65f31c7d30e95e9b() {
  return __cxx_static_address_6cab337e65f31c7d30e95e9b.reference || (__cxx_static_address_6cab337e65f31c7d30e95e9b.reference = {
    __cReference: true,
    get value() { return LASERTRIP_EXPLODE____header_global_97b9f516dfef545e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:60
export const VENT_BUST____header_global_22a48f892ef84e90 = ((((((18) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_786887ce391efbdae2e0d2b5() {
  return __cxx_static_address_786887ce391efbdae2e0d2b5.reference || (__cxx_static_address_786887ce391efbdae2e0d2b5.reference = {
    __cReference: true,
    get value() { return VENT_BUST____header_global_22a48f892ef84e90; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:61
export const GLASS_BREAKING____header_global_bc33aecb9811b4fd = ((((((19) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8579d57fb53dc030762482db() {
  return __cxx_static_address_8579d57fb53dc030762482db.reference || (__cxx_static_address_8579d57fb53dc030762482db.reference = {
    __cReference: true,
    get value() { return GLASS_BREAKING____header_global_bc33aecb9811b4fd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:62
export const GLASS_HEAVYBREAK____header_global_e96f2f1d9fa2a540 = ((((((20) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_90ba001fdfda8e8f9e4c95d2() {
  return __cxx_static_address_90ba001fdfda8e8f9e4c95d2.reference || (__cxx_static_address_90ba001fdfda8e8f9e4c95d2.reference = {
    __cReference: true,
    get value() { return GLASS_HEAVYBREAK____header_global_e96f2f1d9fa2a540; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:63
export const SHORT_CIRCUIT____header_global_b0d45ac3c46a65cb = ((((((21) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_21dc68eb68bd2482377c0c8a() {
  return __cxx_static_address_21dc68eb68bd2482377c0c8a.reference || (__cxx_static_address_21dc68eb68bd2482377c0c8a.reference = {
    __cReference: true,
    get value() { return SHORT_CIRCUIT____header_global_b0d45ac3c46a65cb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:64
export const ITEM_SPLASH____header_global_a9c85bfdf5476134 = ((((((22) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_71f8360f924f81ea0875b3e2() {
  return __cxx_static_address_71f8360f924f81ea0875b3e2.reference || (__cxx_static_address_71f8360f924f81ea0875b3e2.reference = {
    __cReference: true,
    get value() { return ITEM_SPLASH____header_global_a9c85bfdf5476134; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:65
export const DUKE_GASP____header_global_6fa4d365f5d80087 = ((((((25) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6d33d581db1bbda57b1d8268() {
  return __cxx_static_address_6d33d581db1bbda57b1d8268.reference || (__cxx_static_address_6d33d581db1bbda57b1d8268.reference = {
    __cReference: true,
    get value() { return DUKE_GASP____header_global_6fa4d365f5d80087; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:66
export const SLIM_RECOG____header_global_855a59208d947551 = ((((((26) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_865114a1ef7c3c23611f4ffd() {
  return __cxx_static_address_865114a1ef7c3c23611f4ffd.reference || (__cxx_static_address_865114a1ef7c3c23611f4ffd.reference = {
    __cReference: true,
    get value() { return SLIM_RECOG____header_global_855a59208d947551; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:67
export const DUKE_URINATE____header_global_c8d9e946f1b2694a = ((((((28) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b9cedba06889c75962539775() {
  return __cxx_static_address_b9cedba06889c75962539775.reference || (__cxx_static_address_b9cedba06889c75962539775.reference = {
    __cReference: true,
    get value() { return DUKE_URINATE____header_global_c8d9e946f1b2694a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:68
export const ENDSEQVOL3SND2____header_global_72c8903a169736b3 = ((((((29) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3dd7269cbd78c12a46350b08() {
  return __cxx_static_address_3dd7269cbd78c12a46350b08.reference || (__cxx_static_address_3dd7269cbd78c12a46350b08.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND2____header_global_72c8903a169736b3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:69
export const ENDSEQVOL3SND3____header_global_b5544d87ba700662 = ((((((30) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6edb2d1d59e57b80f04d58ac() {
  return __cxx_static_address_6edb2d1d59e57b80f04d58ac.reference || (__cxx_static_address_6edb2d1d59e57b80f04d58ac.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND3____header_global_b5544d87ba700662; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:70
export const DUKE_CRACK____header_global_d7b359b867a447ef = ((((((33) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_56f75617d262c11dcbe88ddc() {
  return __cxx_static_address_56f75617d262c11dcbe88ddc.reference || (__cxx_static_address_56f75617d262c11dcbe88ddc.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK____header_global_d7b359b867a447ef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:71
export const SLIM_ATTACK____header_global_cb4d3060c74487ff = ((((((34) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_84509c57b7c9fdbba3a9f1a3() {
  return __cxx_static_address_84509c57b7c9fdbba3a9f1a3.reference || (__cxx_static_address_84509c57b7c9fdbba3a9f1a3.reference = {
    __cReference: true,
    get value() { return SLIM_ATTACK____header_global_cb4d3060c74487ff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:72
export const SOMETHINGHITFORCE____header_global_469f94529e854a08 = ((((((35) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_70abad70d6e2a88946723233() {
  return __cxx_static_address_70abad70d6e2a88946723233.reference || (__cxx_static_address_70abad70d6e2a88946723233.reference = {
    __cReference: true,
    get value() { return SOMETHINGHITFORCE____header_global_469f94529e854a08; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:73
export const DUKE_DRINKING____header_global_013be2d79ca2cd5d = ((((((36) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f55e993612f69d1fc6f03e09() {
  return __cxx_static_address_f55e993612f69d1fc6f03e09.reference || (__cxx_static_address_f55e993612f69d1fc6f03e09.reference = {
    __cReference: true,
    get value() { return DUKE_DRINKING____header_global_013be2d79ca2cd5d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:74
export const DUKE_GRUNT____header_global_d5af5734b06c3e15 = ((((((38) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dc1741acdf1101409f18282d() {
  return __cxx_static_address_dc1741acdf1101409f18282d.reference || (__cxx_static_address_dc1741acdf1101409f18282d.reference = {
    __cReference: true,
    get value() { return DUKE_GRUNT____header_global_d5af5734b06c3e15; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:75
export const DUKE_HARTBEAT____header_global_42ba4e4a16b9d46e = ((((((39) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e64af112ed05efce57426546() {
  return __cxx_static_address_e64af112ed05efce57426546.reference || (__cxx_static_address_e64af112ed05efce57426546.reference = {
    __cReference: true,
    get value() { return DUKE_HARTBEAT____header_global_42ba4e4a16b9d46e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:76
export const DUKE_ONWATER____header_global_089b0ad0881349f9 = ((((((40) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ae9ae39cb2e9ad573b9daa31() {
  return __cxx_static_address_ae9ae39cb2e9ad573b9daa31.reference || (__cxx_static_address_ae9ae39cb2e9ad573b9daa31.reference = {
    __cReference: true,
    get value() { return DUKE_ONWATER____header_global_089b0ad0881349f9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:77
export const DUKE_LAND____header_global_423143d4a310594d = ((((((42) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_78895efab716d04ce563957c() {
  return __cxx_static_address_78895efab716d04ce563957c.reference || (__cxx_static_address_78895efab716d04ce563957c.reference = {
    __cReference: true,
    get value() { return DUKE_LAND____header_global_423143d4a310594d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:78
export const DUKE_WALKINDUCTS____header_global_c966bf08af37fe61 = ((((((43) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4b4ee005a9addf94021c0373() {
  return __cxx_static_address_4b4ee005a9addf94021c0373.reference || (__cxx_static_address_4b4ee005a9addf94021c0373.reference = {
    __cReference: true,
    get value() { return DUKE_WALKINDUCTS____header_global_c966bf08af37fe61; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:79
export const DUKE_UNDERWATER____header_global_a7f87e81c7750c5b = ((((((48) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_96b76421b3e85b1a5f7e2b29() {
  return __cxx_static_address_96b76421b3e85b1a5f7e2b29.reference || (__cxx_static_address_96b76421b3e85b1a5f7e2b29.reference = {
    __cReference: true,
    get value() { return DUKE_UNDERWATER____header_global_a7f87e81c7750c5b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:80
export const DUKE_JETPACK_ON____header_global_2da62c98c262780c = ((((((49) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_82a88a5ddc372cbec68e814c() {
  return __cxx_static_address_82a88a5ddc372cbec68e814c.reference || (__cxx_static_address_82a88a5ddc372cbec68e814c.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_ON____header_global_2da62c98c262780c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:81
export const DUKE_JETPACK_IDLE____header_global_883c5b251dcb3adc = ((((((50) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_622dd97f1ee148283dc2e3a5() {
  return __cxx_static_address_622dd97f1ee148283dc2e3a5.reference || (__cxx_static_address_622dd97f1ee148283dc2e3a5.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_IDLE____header_global_883c5b251dcb3adc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:82
export const DUKE_JETPACK_OFF____header_global_77cc9226d3f06eb2 = ((((((51) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ab091cc40ade1a80ca6317ef() {
  return __cxx_static_address_ab091cc40ade1a80ca6317ef.reference || (__cxx_static_address_ab091cc40ade1a80ca6317ef.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_OFF____header_global_77cc9226d3f06eb2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:83
export const DUKETALKTOBOSS____header_global_93252fa012eb481a = ((((((56) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_205c0381ae579a3049332b72() {
  return __cxx_static_address_205c0381ae579a3049332b72.reference || (__cxx_static_address_205c0381ae579a3049332b72.reference = {
    __cReference: true,
    get value() { return DUKETALKTOBOSS____header_global_93252fa012eb481a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:84
export const SQUISHED____header_global_65da54447094ee15 = ((((((69) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0301ab6bda84b8b06b75a2da() {
  return __cxx_static_address_0301ab6bda84b8b06b75a2da.reference || (__cxx_static_address_0301ab6bda84b8b06b75a2da.reference = {
    __cReference: true,
    get value() { return SQUISHED____header_global_65da54447094ee15; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:85
export const TELEPORTER____header_global_9ecc463068d765b8 = ((((((70) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5d1672500794b796acb45b78() {
  return __cxx_static_address_5d1672500794b796acb45b78.reference || (__cxx_static_address_5d1672500794b796acb45b78.reference = {
    __cReference: true,
    get value() { return TELEPORTER____header_global_9ecc463068d765b8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:86
export const ELEVATOR_ON____header_global_3a3608af8f406211 = ((((((71) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fe8d349c62bfc2f6cdd5463d() {
  return __cxx_static_address_fe8d349c62bfc2f6cdd5463d.reference || (__cxx_static_address_fe8d349c62bfc2f6cdd5463d.reference = {
    __cReference: true,
    get value() { return ELEVATOR_ON____header_global_3a3608af8f406211; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:87
export const ELEVATOR_OFF____header_global_6159359890863c04 = ((((((73) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ba97c1040986e3e3dc0a1c24() {
  return __cxx_static_address_ba97c1040986e3e3dc0a1c24.reference || (__cxx_static_address_ba97c1040986e3e3dc0a1c24.reference = {
    __cReference: true,
    get value() { return ELEVATOR_OFF____header_global_6159359890863c04; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:88
export const SUBWAY____header_global_0351b9f92e230580 = ((((((75) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_11368ce8350016863b7c4e92() {
  return __cxx_static_address_11368ce8350016863b7c4e92.reference || (__cxx_static_address_11368ce8350016863b7c4e92.reference = {
    __cReference: true,
    get value() { return SUBWAY____header_global_0351b9f92e230580; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:89
export const SWITCH_ON____header_global_684a96e4d261df6d = ((((((76) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0ae83959dbb641d90f03831e() {
  return __cxx_static_address_0ae83959dbb641d90f03831e.reference || (__cxx_static_address_0ae83959dbb641d90f03831e.reference = {
    __cReference: true,
    get value() { return SWITCH_ON____header_global_684a96e4d261df6d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:90
export const FLUSH_TOILET____header_global_69537aa540ab3c17 = ((((((79) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f70de3febc4b5b3f543ca15b() {
  return __cxx_static_address_f70de3febc4b5b3f543ca15b.reference || (__cxx_static_address_f70de3febc4b5b3f543ca15b.reference = {
    __cReference: true,
    get value() { return FLUSH_TOILET____header_global_69537aa540ab3c17; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:91
export const EARTHQUAKE____header_global_2e5e7c54fbb53f3c = ((((((81) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d2670d1238376d29a7af205e() {
  return __cxx_static_address_d2670d1238376d29a7af205e.reference || (__cxx_static_address_d2670d1238376d29a7af205e.reference = {
    __cReference: true,
    get value() { return EARTHQUAKE____header_global_2e5e7c54fbb53f3c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:92
export const END_OF_LEVEL_WARN____header_global_2660306e7e887712 = ((((((83) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_575a4ea4c14960870ca38fde() {
  return __cxx_static_address_575a4ea4c14960870ca38fde.reference || (__cxx_static_address_575a4ea4c14960870ca38fde.reference = {
    __cReference: true,
    get value() { return END_OF_LEVEL_WARN____header_global_2660306e7e887712; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:93
export const WIND_AMBIENCE____header_global_62c23ec90b2426d2 = ((((((91) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bdec39799be7487071467711() {
  return __cxx_static_address_bdec39799be7487071467711.reference || (__cxx_static_address_bdec39799be7487071467711.reference = {
    __cReference: true,
    get value() { return WIND_AMBIENCE____header_global_62c23ec90b2426d2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:94
export const SOMETHING_DRIPPING____header_global_9ce32c8bf07d1def = ((((((92) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e310450837c78f1290e68bbb() {
  return __cxx_static_address_e310450837c78f1290e68bbb.reference || (__cxx_static_address_e310450837c78f1290e68bbb.reference = {
    __cReference: true,
    get value() { return SOMETHING_DRIPPING____header_global_9ce32c8bf07d1def; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:95
export const BOS1_RECOG____header_global_32038c06008d4079 = ((((((97) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cb9f135c361c4f572ac9ad1b() {
  return __cxx_static_address_cb9f135c361c4f572ac9ad1b.reference || (__cxx_static_address_cb9f135c361c4f572ac9ad1b.reference = {
    __cReference: true,
    get value() { return BOS1_RECOG____header_global_32038c06008d4079; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:96
export const BOS2_RECOG____header_global_fa4ab2aa06117837 = ((((((102) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_54e043d0a95c5915aa462797() {
  return __cxx_static_address_54e043d0a95c5915aa462797.reference || (__cxx_static_address_54e043d0a95c5915aa462797.reference = {
    __cReference: true,
    get value() { return BOS2_RECOG____header_global_fa4ab2aa06117837; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:97
export const DUKE_GETWEAPON2____header_global_a360a37e5c67aee5 = ((((((107) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b389b27c89f1540e02044391() {
  return __cxx_static_address_b389b27c89f1540e02044391.reference || (__cxx_static_address_b389b27c89f1540e02044391.reference = {
    __cReference: true,
    get value() { return DUKE_GETWEAPON2____header_global_a360a37e5c67aee5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:98
export const SHOTGUN_FIRE____header_global_48dc7f2b00f7286d = ((((((109) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ac3507c070764c5765d72f01() {
  return __cxx_static_address_ac3507c070764c5765d72f01.reference || (__cxx_static_address_ac3507c070764c5765d72f01.reference = {
    __cReference: true,
    get value() { return SHOTGUN_FIRE____header_global_48dc7f2b00f7286d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:99
export const PRED_RECOG____header_global_adc4ee323cda4880 = ((((((111) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_98a770d3356e09a56b7ce8b3() {
  return __cxx_static_address_98a770d3356e09a56b7ce8b3.reference || (__cxx_static_address_98a770d3356e09a56b7ce8b3.reference = {
    __cReference: true,
    get value() { return PRED_RECOG____header_global_adc4ee323cda4880; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:100
export const CAPT_RECOG____header_global_600aba0f1200907f = ((((((117) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_008f1eb0b6e6de3503348d59() {
  return __cxx_static_address_008f1eb0b6e6de3503348d59.reference || (__cxx_static_address_008f1eb0b6e6de3503348d59.reference = {
    __cReference: true,
    get value() { return CAPT_RECOG____header_global_600aba0f1200907f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:101
export const PIG_RECOG____header_global_268fd466b182669d = ((((((121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2c4accb27267988d387972c4() {
  return __cxx_static_address_2c4accb27267988d387972c4.reference || (__cxx_static_address_2c4accb27267988d387972c4.reference = {
    __cReference: true,
    get value() { return PIG_RECOG____header_global_268fd466b182669d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:102
export const RECO_ROAM____header_global_ef4a2477a76fbae7 = ((((((125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3c477978be3aeb51df832c50() {
  return __cxx_static_address_3c477978be3aeb51df832c50.reference || (__cxx_static_address_3c477978be3aeb51df832c50.reference = {
    __cReference: true,
    get value() { return RECO_ROAM____header_global_ef4a2477a76fbae7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:103
export const RECO_RECOG____header_global_263e5f0bf76d9829 = ((((((126) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2b5f2ccfe2b3bb4e2e86e434() {
  return __cxx_static_address_2b5f2ccfe2b3bb4e2e86e434.reference || (__cxx_static_address_2b5f2ccfe2b3bb4e2e86e434.reference = {
    __cReference: true,
    get value() { return RECO_RECOG____header_global_263e5f0bf76d9829; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:104
export const RECO_ATTACK____header_global_de879b5b10dbfb06 = ((((((127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3c599b7c3472d8b97c1be299() {
  return __cxx_static_address_3c599b7c3472d8b97c1be299.reference || (__cxx_static_address_3c599b7c3472d8b97c1be299.reference = {
    __cReference: true,
    get value() { return RECO_ATTACK____header_global_de879b5b10dbfb06; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:105
export const RECO_PAIN____header_global_1c098160c2d1fff5 = ((((((128) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f1bb8ee1e519a5e8208412f5() {
  return __cxx_static_address_f1bb8ee1e519a5e8208412f5.reference || (__cxx_static_address_f1bb8ee1e519a5e8208412f5.reference = {
    __cReference: true,
    get value() { return RECO_PAIN____header_global_1c098160c2d1fff5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:106
export const DRON_RECOG____header_global_e7c98fe9f2333f0b = ((((((131) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_77b64ea455f1d4e2e42115f2() {
  return __cxx_static_address_77b64ea455f1d4e2e42115f2.reference || (__cxx_static_address_77b64ea455f1d4e2e42115f2.reference = {
    __cReference: true,
    get value() { return DRON_RECOG____header_global_e7c98fe9f2333f0b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:107
export const COMM_RECOG____header_global_a309d933c7efc65e = ((((((136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aa98e69a62992c2d6bd92d88() {
  return __cxx_static_address_aa98e69a62992c2d6bd92d88.reference || (__cxx_static_address_aa98e69a62992c2d6bd92d88.reference = {
    __cReference: true,
    get value() { return COMM_RECOG____header_global_a309d933c7efc65e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:108
export const OCTA_RECOG____header_global_3cbbb9137e957c41 = ((((((141) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4d1d6af88f7a24c7734e0317() {
  return __cxx_static_address_4d1d6af88f7a24c7734e0317.reference || (__cxx_static_address_4d1d6af88f7a24c7734e0317.reference = {
    __cReference: true,
    get value() { return OCTA_RECOG____header_global_3cbbb9137e957c41; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:109
export const TURR_RECOG____header_global_c88ec3a9bacf4c21 = ((((((146) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_92a02b7f36d43b39a1777fe2() {
  return __cxx_static_address_92a02b7f36d43b39a1777fe2.reference || (__cxx_static_address_92a02b7f36d43b39a1777fe2.reference = {
    __cReference: true,
    get value() { return TURR_RECOG____header_global_c88ec3a9bacf4c21; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:110
export const SLIM_DYING____header_global_cbba1a082a9551f0 = ((((((149) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4078ce5bf1824ae7eb4b2915() {
  return __cxx_static_address_4078ce5bf1824ae7eb4b2915.reference || (__cxx_static_address_4078ce5bf1824ae7eb4b2915.reference = {
    __cReference: true,
    get value() { return SLIM_DYING____header_global_cbba1a082a9551f0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:111
export const BOS3_RECOG____header_global_1cb53f289369fbbd = ((((((151) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0c3c8661f6daf9b54264ec07() {
  return __cxx_static_address_0c3c8661f6daf9b54264ec07.reference || (__cxx_static_address_0c3c8661f6daf9b54264ec07.reference = {
    __cReference: true,
    get value() { return BOS3_RECOG____header_global_1cb53f289369fbbd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:112
export const BOS1_WALK____header_global_7693321e76e803b5 = ((((((156) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_641c42d59c24ef09ab8b9c9d() {
  return __cxx_static_address_641c42d59c24ef09ab8b9c9d.reference || (__cxx_static_address_641c42d59c24ef09ab8b9c9d.reference = {
    __cReference: true,
    get value() { return BOS1_WALK____header_global_7693321e76e803b5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:113
export const THUD____header_global_282c537916c58107 = ((((((158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b28565dc05b3b673222c1612() {
  return __cxx_static_address_b28565dc05b3b673222c1612.reference || (__cxx_static_address_b28565dc05b3b673222c1612.reference = {
    __cReference: true,
    get value() { return THUD____header_global_282c537916c58107; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:114
export const WIERDSHOT_FLY____header_global_23dfe3373eb57bc3 = ((((((160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d3a656e9169e4e4b0ef80fbd() {
  return __cxx_static_address_d3a656e9169e4e4b0ef80fbd.reference || (__cxx_static_address_d3a656e9169e4e4b0ef80fbd.reference = {
    __cReference: true,
    get value() { return WIERDSHOT_FLY____header_global_23dfe3373eb57bc3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:115
export const SLIM_ROAM____header_global_b1a7350212c6fe4c = ((((((163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5f1ec9162d3c7fa769361a75() {
  return __cxx_static_address_5f1ec9162d3c7fa769361a75.reference || (__cxx_static_address_5f1ec9162d3c7fa769361a75.reference = {
    __cReference: true,
    get value() { return SLIM_ROAM____header_global_b1a7350212c6fe4c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:116
export const SHOTGUN_COCK____header_global_8a8d872ca4a8ca3a = ((((((169) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a2ad008283816128f3fde461() {
  return __cxx_static_address_a2ad008283816128f3fde461.reference || (__cxx_static_address_a2ad008283816128f3fde461.reference = {
    __cReference: true,
    get value() { return SHOTGUN_COCK____header_global_8a8d872ca4a8ca3a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:117
export const GENERIC_AMBIENCE17____header_global_8f880ae16943cbea = ((((((177) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f683ee375f330147cb8a2140() {
  return __cxx_static_address_f683ee375f330147cb8a2140.reference || (__cxx_static_address_f683ee375f330147cb8a2140.reference = {
    __cReference: true,
    get value() { return GENERIC_AMBIENCE17____header_global_8f880ae16943cbea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:118
export const BONUS_SPEECH1____header_global_4ca7328bdc6440b6 = ((((((195) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_153d2210b3f00650b22400b5() {
  return __cxx_static_address_153d2210b3f00650b22400b5.reference || (__cxx_static_address_153d2210b3f00650b22400b5.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH1____header_global_4ca7328bdc6440b6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:119
export const BONUS_SPEECH2____header_global_f9b91b9b89198c84 = ((((((196) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fe57f5c88abaaa2ae3fc894b() {
  return __cxx_static_address_fe57f5c88abaaa2ae3fc894b.reference || (__cxx_static_address_fe57f5c88abaaa2ae3fc894b.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH2____header_global_f9b91b9b89198c84; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:120
export const BONUS_SPEECH3____header_global_a45bfcdc537cd209 = ((((((197) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_557fecf26d0475d5ff99a6e6() {
  return __cxx_static_address_557fecf26d0475d5ff99a6e6.reference || (__cxx_static_address_557fecf26d0475d5ff99a6e6.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH3____header_global_a45bfcdc537cd209; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:121
export const BONUS_SPEECH4____header_global_3aeb63f7f3590215 = ((((((199) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_73d72fad5fc212b4be9c89dd() {
  return __cxx_static_address_73d72fad5fc212b4be9c89dd.reference || (__cxx_static_address_73d72fad5fc212b4be9c89dd.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH4____header_global_3aeb63f7f3590215; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:122
export const DUKE_LAND_HURT____header_global_6104c42712d32ccf = ((((((200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5a1aa43d24c3ae9c4472ebb0() {
  return __cxx_static_address_5a1aa43d24c3ae9c4472ebb0.reference || (__cxx_static_address_5a1aa43d24c3ae9c4472ebb0.reference = {
    __cReference: true,
    get value() { return DUKE_LAND_HURT____header_global_6104c42712d32ccf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:123
export const DUKE_SEARCH2____header_global_31f2597b6e86918e = ((((((207) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8d338902f12fd42115b54edc() {
  return __cxx_static_address_8d338902f12fd42115b54edc.reference || (__cxx_static_address_8d338902f12fd42115b54edc.reference = {
    __cReference: true,
    get value() { return DUKE_SEARCH2____header_global_31f2597b6e86918e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:124
export const DUKE_CRACK2____header_global_1a9c8aa7481b67cf = ((((((208) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9433a00162047be957cf38c1() {
  return __cxx_static_address_9433a00162047be957cf38c1.reference || (__cxx_static_address_9433a00162047be957cf38c1.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK2____header_global_1a9c8aa7481b67cf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:125
export const DUKE_SEARCH____header_global_aaddd3e583eea66d = ((((((209) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_846a9cdec4bcfe0ec9d5d61b() {
  return __cxx_static_address_846a9cdec4bcfe0ec9d5d61b.reference || (__cxx_static_address_846a9cdec4bcfe0ec9d5d61b.reference = {
    __cReference: true,
    get value() { return DUKE_SEARCH____header_global_aaddd3e583eea66d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:126
export const DUKE_GET____header_global_20890d70a1a41c31 = ((((((210) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d14729fe7942c256c4e96cd1() {
  return __cxx_static_address_d14729fe7942c256c4e96cd1.reference || (__cxx_static_address_d14729fe7942c256c4e96cd1.reference = {
    __cReference: true,
    get value() { return DUKE_GET____header_global_20890d70a1a41c31; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:127
export const DUKE_LONGTERM_PAIN____header_global_642909eb817a068d = ((((((211) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2bd7a2bd2d45e2918a27de21() {
  return __cxx_static_address_2bd7a2bd2d45e2918a27de21.reference || (__cxx_static_address_2bd7a2bd2d45e2918a27de21.reference = {
    __cReference: true,
    get value() { return DUKE_LONGTERM_PAIN____header_global_642909eb817a068d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:128
export const MONITOR_ACTIVE____header_global_dace61d93485cc00 = ((((((212) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a4efb3b9ebc24f7c11c75fb4() {
  return __cxx_static_address_a4efb3b9ebc24f7c11c75fb4.reference || (__cxx_static_address_a4efb3b9ebc24f7c11c75fb4.reference = {
    __cReference: true,
    get value() { return MONITOR_ACTIVE____header_global_dace61d93485cc00; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:129
export const NITEVISION_ONOFF____header_global_11cdc2938e58ca2a = ((((((213) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_54a7e274be1b2e7486faf397() {
  return __cxx_static_address_54a7e274be1b2e7486faf397.reference || (__cxx_static_address_54a7e274be1b2e7486faf397.reference = {
    __cReference: true,
    get value() { return NITEVISION_ONOFF____header_global_11cdc2938e58ca2a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:130
export const DUKE_CRACK_FIRST____header_global_7c380e78e51ba1a0 = ((((((215) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5bfdc3ec745c611187517caa() {
  return __cxx_static_address_5bfdc3ec745c611187517caa.reference || (__cxx_static_address_5bfdc3ec745c611187517caa.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK_FIRST____header_global_7c380e78e51ba1a0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:131
export const DUKE_USEMEDKIT____header_global_a30b9072a05c5c6a = ((((((216) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b35b8a551a6a7e211c246adf() {
  return __cxx_static_address_b35b8a551a6a7e211c246adf.reference || (__cxx_static_address_b35b8a551a6a7e211c246adf.reference = {
    __cReference: true,
    get value() { return DUKE_USEMEDKIT____header_global_a30b9072a05c5c6a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:132
export const DUKE_TAKEPILLS____header_global_96fea0a31a588b3e = ((((((217) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_84e4cdc0339927affad3cf3e() {
  return __cxx_static_address_84e4cdc0339927affad3cf3e.reference || (__cxx_static_address_84e4cdc0339927affad3cf3e.reference = {
    __cReference: true,
    get value() { return DUKE_TAKEPILLS____header_global_96fea0a31a588b3e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:133
export const DUKE_PISSRELIEF____header_global_cd71d6ecc1d52fd6 = ((((((218) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_02861d4dca1869c76cad02a5() {
  return __cxx_static_address_02861d4dca1869c76cad02a5.reference || (__cxx_static_address_02861d4dca1869c76cad02a5.reference = {
    __cReference: true,
    get value() { return DUKE_PISSRELIEF____header_global_cd71d6ecc1d52fd6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:134
export const SELECT_WEAPON____header_global_cf5a1c44b8ebbc48 = ((((((219) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0f58bd5baff0996af77e005e() {
  return __cxx_static_address_0f58bd5baff0996af77e005e.reference || (__cxx_static_address_0f58bd5baff0996af77e005e.reference = {
    __cReference: true,
    get value() { return SELECT_WEAPON____header_global_cf5a1c44b8ebbc48; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:135
export const JIBBED_ACTOR5____header_global_efda08e46171b630 = ((((((226) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6215dad8d85f3d1e6845d646() {
  return __cxx_static_address_6215dad8d85f3d1e6845d646.reference || (__cxx_static_address_6215dad8d85f3d1e6845d646.reference = {
    __cReference: true,
    get value() { return JIBBED_ACTOR5____header_global_efda08e46171b630; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:136
export const JIBBED_ACTOR6____header_global_ccf9f8673684a46e = ((((((227) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e782676a5f369f85ad8bfd07() {
  return __cxx_static_address_e782676a5f369f85ad8bfd07.reference || (__cxx_static_address_e782676a5f369f85ad8bfd07.reference = {
    __cReference: true,
    get value() { return JIBBED_ACTOR6____header_global_ccf9f8673684a46e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:137
export const DUKE_GOTHEALTHATLOW____header_global_cf68de71db755f2a = ((((((229) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c202f654c728d319e0663b52() {
  return __cxx_static_address_c202f654c728d319e0663b52.reference || (__cxx_static_address_c202f654c728d319e0663b52.reference = {
    __cReference: true,
    get value() { return DUKE_GOTHEALTHATLOW____header_global_cf68de71db755f2a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:138
export const BOSSTALKTODUKE____header_global_114926ab486c6e91 = ((((((230) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3c5599ffeb1121ec10081013() {
  return __cxx_static_address_3c5599ffeb1121ec10081013.reference || (__cxx_static_address_3c5599ffeb1121ec10081013.reference = {
    __cReference: true,
    get value() { return BOSSTALKTODUKE____header_global_114926ab486c6e91; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:139
export const WAR_AMBIENCE2____header_global_23d633fbbe5f41c9 = ((((((232) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e36ec648f5f7d96dc257d61d() {
  return __cxx_static_address_e36ec648f5f7d96dc257d61d.reference || (__cxx_static_address_e36ec648f5f7d96dc257d61d.reference = {
    __cReference: true,
    get value() { return WAR_AMBIENCE2____header_global_23d633fbbe5f41c9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:140
export const EXITMENUSOUND____header_global_a3375f18416c26b9 = ((((((243) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b6d51078af17a2e36048baac() {
  return __cxx_static_address_b6d51078af17a2e36048baac.reference || (__cxx_static_address_b6d51078af17a2e36048baac.reference = {
    __cReference: true,
    get value() { return EXITMENUSOUND____header_global_a3375f18416c26b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:141
export const FLY_BY____header_global_7e73b50ab22c7e94 = ((((((244) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c0cdbbd9f4504def92d2c5e9() {
  return __cxx_static_address_c0cdbbd9f4504def92d2c5e9.reference || (__cxx_static_address_c0cdbbd9f4504def92d2c5e9.reference = {
    __cReference: true,
    get value() { return FLY_BY____header_global_7e73b50ab22c7e94; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:142
export const DUKE_SCREAM____header_global_1b582e24ea4633de = ((((((245) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6c841c94edbb9b24d06589fc() {
  return __cxx_static_address_6c841c94edbb9b24d06589fc.reference || (__cxx_static_address_6c841c94edbb9b24d06589fc.reference = {
    __cReference: true,
    get value() { return DUKE_SCREAM____header_global_1b582e24ea4633de; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:143
export const SHRINKER_HIT____header_global_42b53f7a2323c86a = ((((((246) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d83697da4b7274df3ca28104() {
  return __cxx_static_address_d83697da4b7274df3ca28104.reference || (__cxx_static_address_d83697da4b7274df3ca28104.reference = {
    __cReference: true,
    get value() { return SHRINKER_HIT____header_global_42b53f7a2323c86a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:144
export const RATTY____header_global_717be9c0a83122e4 = ((((((247) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7a377c3bc06402f371c1fe5b() {
  return __cxx_static_address_7a377c3bc06402f371c1fe5b.reference || (__cxx_static_address_7a377c3bc06402f371c1fe5b.reference = {
    __cReference: true,
    get value() { return RATTY____header_global_717be9c0a83122e4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:145
export const BONUSMUSIC____header_global_3fda3c011c5c6afc = ((((((249) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c186e7c59ad685de1087b0c9() {
  return __cxx_static_address_c186e7c59ad685de1087b0c9.reference || (__cxx_static_address_c186e7c59ad685de1087b0c9.reference = {
    __cReference: true,
    get value() { return BONUSMUSIC____header_global_3fda3c011c5c6afc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:146
export const DUKE_GETWEAPON6____header_global_97144fa2f3a01838 = ((((((264) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_498c3db422060cacbc508511() {
  return __cxx_static_address_498c3db422060cacbc508511.reference || (__cxx_static_address_498c3db422060cacbc508511.reference = {
    __cReference: true,
    get value() { return DUKE_GETWEAPON6____header_global_97144fa2f3a01838; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:147
export const ALIEN_SWITCH1____header_global_ade236a06f308ed6 = ((((((272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f8ee4e0a7f4f84368c65fe94() {
  return __cxx_static_address_f8ee4e0a7f4f84368c65fe94.reference || (__cxx_static_address_f8ee4e0a7f4f84368c65fe94.reference = {
    __cReference: true,
    get value() { return ALIEN_SWITCH1____header_global_ade236a06f308ed6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:148
export const RIPHEADNECK____header_global_1200ac95070f4fc5 = ((((((284) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f5f53824bff01b9030d46a6f() {
  return __cxx_static_address_f5f53824bff01b9030d46a6f.reference || (__cxx_static_address_f5f53824bff01b9030d46a6f.reference = {
    __cReference: true,
    get value() { return RIPHEADNECK____header_global_1200ac95070f4fc5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:149
export const ENDSEQVOL3SND4____header_global_e6f9b0f3058c1e62 = ((((((288) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8da029e46c87d579a95d1784() {
  return __cxx_static_address_8da029e46c87d579a95d1784.reference || (__cxx_static_address_8da029e46c87d579a95d1784.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND4____header_global_e6f9b0f3058c1e62; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:150
export const ENDSEQVOL3SND5____header_global_14686a0c324a25c0 = ((((((289) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b24391d0c21c972de009cac9() {
  return __cxx_static_address_b24391d0c21c972de009cac9.reference || (__cxx_static_address_b24391d0c21c972de009cac9.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND5____header_global_14686a0c324a25c0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:151
export const ENDSEQVOL3SND6____header_global_b1841e665bb427b6 = ((((((290) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cb20a2f7ad7fd8b5e38c0781() {
  return __cxx_static_address_cb20a2f7ad7fd8b5e38c0781.reference || (__cxx_static_address_cb20a2f7ad7fd8b5e38c0781.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND6____header_global_b1841e665bb427b6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:152
export const ENDSEQVOL3SND7____header_global_2b7d3f59e91061f0 = ((((((291) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6df9fb60beaba181fa9e40a0() {
  return __cxx_static_address_6df9fb60beaba181fa9e40a0.reference || (__cxx_static_address_6df9fb60beaba181fa9e40a0.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND7____header_global_2b7d3f59e91061f0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:153
export const ENDSEQVOL3SND8____header_global_e90afd9910bd2e53 = ((((((292) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eac4010a08bb1a9de6d9e766() {
  return __cxx_static_address_eac4010a08bb1a9de6d9e766.reference || (__cxx_static_address_eac4010a08bb1a9de6d9e766.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND8____header_global_e90afd9910bd2e53; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:154
export const ENDSEQVOL3SND9____header_global_28eefcde0780caee = ((((((293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_db0ad73b20f650e439c28e7e() {
  return __cxx_static_address_db0ad73b20f650e439c28e7e.reference || (__cxx_static_address_db0ad73b20f650e439c28e7e.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND9____header_global_28eefcde0780caee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:155
export const WHIPYOURASS____header_global_1694cfbbfac43397 = ((((((294) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4679098ab7871a56b11c433a() {
  return __cxx_static_address_4679098ab7871a56b11c433a.reference || (__cxx_static_address_4679098ab7871a56b11c433a.reference = {
    __cReference: true,
    get value() { return WHIPYOURASS____header_global_1694cfbbfac43397; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:156
export const ENDSEQVOL2SND1____header_global_7fb7dd8590a3d9cf = ((((((295) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bef781720b418d64e9ef9ba6() {
  return __cxx_static_address_bef781720b418d64e9ef9ba6.reference || (__cxx_static_address_bef781720b418d64e9ef9ba6.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND1____header_global_7fb7dd8590a3d9cf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:157
export const ENDSEQVOL2SND2____header_global_1ae6131a5f838289 = ((((((296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d3c4f1133f2da64361ffc3d4() {
  return __cxx_static_address_d3c4f1133f2da64361ffc3d4.reference || (__cxx_static_address_d3c4f1133f2da64361ffc3d4.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND2____header_global_1ae6131a5f838289; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:158
export const ENDSEQVOL2SND3____header_global_d84a9b0571e6a20e = ((((((297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_222b20ff9ab6d7f27f875b08() {
  return __cxx_static_address_222b20ff9ab6d7f27f875b08.reference || (__cxx_static_address_222b20ff9ab6d7f27f875b08.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND3____header_global_d84a9b0571e6a20e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:159
export const ENDSEQVOL2SND4____header_global_636168d75c9163a1 = ((((((298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_160661e6e879d9522a50ed58() {
  return __cxx_static_address_160661e6e879d9522a50ed58.reference || (__cxx_static_address_160661e6e879d9522a50ed58.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND4____header_global_636168d75c9163a1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:160
export const ENDSEQVOL2SND5____header_global_400c7c2074ca89f8 = ((((((299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_016758eb37ce0b619d681dff() {
  return __cxx_static_address_016758eb37ce0b619d681dff.reference || (__cxx_static_address_016758eb37ce0b619d681dff.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND5____header_global_400c7c2074ca89f8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:161
export const ENDSEQVOL2SND6____header_global_d7a52582b5822982 = ((((((300) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0e3a39268c7816c2dadb0fcc() {
  return __cxx_static_address_0e3a39268c7816c2dadb0fcc.reference || (__cxx_static_address_0e3a39268c7816c2dadb0fcc.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND6____header_global_d7a52582b5822982; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:162
export const ENDSEQVOL2SND7____header_global_782ffa48ab56182c = ((((((301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a4e429f4de2add2227c315a3() {
  return __cxx_static_address_a4e429f4de2add2227c315a3.reference || (__cxx_static_address_a4e429f4de2add2227c315a3.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND7____header_global_782ffa48ab56182c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:163
export const SOMETHINGFROZE____header_global_fd6126d62ac6331d = ((((((303) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b2a9b8809c698fa9cca99dd9() {
  return __cxx_static_address_b2a9b8809c698fa9cca99dd9.reference || (__cxx_static_address_b2a9b8809c698fa9cca99dd9.reference = {
    __cReference: true,
    get value() { return SOMETHINGFROZE____header_global_fd6126d62ac6331d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:164
export const WIND_REPEAT____header_global_bceca0077433a665 = ((((((308) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7761ebb3929862458f108c5c() {
  return __cxx_static_address_7761ebb3929862458f108c5c.reference || (__cxx_static_address_7761ebb3929862458f108c5c.reference = {
    __cReference: true,
    get value() { return WIND_REPEAT____header_global_bceca0077433a665; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:165
export const BOS4_RECOG____header_global_8b327b891e0aa8ad = ((((((342) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_301b594ecbf3b72096ee1c67() {
  return __cxx_static_address_301b594ecbf3b72096ee1c67.reference || (__cxx_static_address_301b594ecbf3b72096ee1c67.reference = {
    __cReference: true,
    get value() { return BOS4_RECOG____header_global_8b327b891e0aa8ad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:166
export const LIGHTNING_SLAP____header_global_0ecd0d962fd570ba = ((((((351) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a014742d847603cb1db61f18() {
  return __cxx_static_address_a014742d847603cb1db61f18.reference || (__cxx_static_address_a014742d847603cb1db61f18.reference = {
    __cReference: true,
    get value() { return LIGHTNING_SLAP____header_global_0ecd0d962fd570ba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:167
export const THUNDER____header_global_6db2bb0ace56c4d7 = ((((((352) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fc60c6044ba30ddbd5c35d5b() {
  return __cxx_static_address_fc60c6044ba30ddbd5c35d5b.reference || (__cxx_static_address_fc60c6044ba30ddbd5c35d5b.reference = {
    __cReference: true,
    get value() { return THUNDER____header_global_6db2bb0ace56c4d7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:168
export const INTRO4_1____header_global_2d5c071a523fbb9c = ((((((363) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e9b9e263e268b76c756fd672() {
  return __cxx_static_address_e9b9e263e268b76c756fd672.reference || (__cxx_static_address_e9b9e263e268b76c756fd672.reference = {
    __cReference: true,
    get value() { return INTRO4_1____header_global_2d5c071a523fbb9c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:169
export const INTRO4_2____header_global_b6d85668886c2a0b = ((((((364) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d1d25ec9d9f0f4472b8f9d20() {
  return __cxx_static_address_d1d25ec9d9f0f4472b8f9d20.reference || (__cxx_static_address_d1d25ec9d9f0f4472b8f9d20.reference = {
    __cReference: true,
    get value() { return INTRO4_2____header_global_b6d85668886c2a0b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:170
export const INTRO4_3____header_global_51de70ad30ffdbfc = ((((((365) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_502d2220eb4b83c9fe63fa11() {
  return __cxx_static_address_502d2220eb4b83c9fe63fa11.reference || (__cxx_static_address_502d2220eb4b83c9fe63fa11.reference = {
    __cReference: true,
    get value() { return INTRO4_3____header_global_51de70ad30ffdbfc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:171
export const INTRO4_4____header_global_5b4bbd3f35023b1c = ((((((366) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1f2de6cda96b30f6ae553047() {
  return __cxx_static_address_1f2de6cda96b30f6ae553047.reference || (__cxx_static_address_1f2de6cda96b30f6ae553047.reference = {
    __cReference: true,
    get value() { return INTRO4_4____header_global_5b4bbd3f35023b1c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:172
export const INTRO4_5____header_global_cfc126e6e74f1e54 = ((((((367) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_70984dc7f6bc7c1709eb1289() {
  return __cxx_static_address_70984dc7f6bc7c1709eb1289.reference || (__cxx_static_address_70984dc7f6bc7c1709eb1289.reference = {
    __cReference: true,
    get value() { return INTRO4_5____header_global_cfc126e6e74f1e54; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:173
export const INTRO4_6____header_global_ee21bdd1ece83622 = ((((((368) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e51e207329fa71eb479c6f93() {
  return __cxx_static_address_e51e207329fa71eb479c6f93.reference || (__cxx_static_address_e51e207329fa71eb479c6f93.reference = {
    __cReference: true,
    get value() { return INTRO4_6____header_global_ee21bdd1ece83622; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:174
export const BOSS4_DEADSPEECH____header_global_dc9ef02929668b4d = ((((((370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_36f3f0ea5247eb820c624640() {
  return __cxx_static_address_36f3f0ea5247eb820c624640.reference || (__cxx_static_address_36f3f0ea5247eb820c624640.reference = {
    __cReference: true,
    get value() { return BOSS4_DEADSPEECH____header_global_dc9ef02929668b4d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:175
export const BOSS4_FIRSTSEE____header_global_fdd9f122e9e6c42b = ((((((371) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c38067c026444663a6e296d8() {
  return __cxx_static_address_c38067c026444663a6e296d8.reference || (__cxx_static_address_c38067c026444663a6e296d8.reference = {
    __cReference: true,
    get value() { return BOSS4_FIRSTSEE____header_global_fdd9f122e9e6c42b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:176
export const VOL4ENDSND1____header_global_e37949cdce49e370 = ((((((384) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6c7a9e0960b5606e07752d2e() {
  return __cxx_static_address_6c7a9e0960b5606e07752d2e.reference || (__cxx_static_address_6c7a9e0960b5606e07752d2e.reference = {
    __cReference: true,
    get value() { return VOL4ENDSND1____header_global_e37949cdce49e370; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:177
export const VOL4ENDSND2____header_global_41096982364cbd51 = ((((((385) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8dc70876889c7b8dc3582bb6() {
  return __cxx_static_address_8dc70876889c7b8dc3582bb6.reference || (__cxx_static_address_8dc70876889c7b8dc3582bb6.reference = {
    __cReference: true,
    get value() { return VOL4ENDSND2____header_global_41096982364cbd51; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:178
export const EXPANDERSHOOT____header_global_98f50bb777113835 = ((((((388) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_13a7f64a3d2add077cf0312e() {
  return __cxx_static_address_13a7f64a3d2add077cf0312e.reference || (__cxx_static_address_13a7f64a3d2add077cf0312e.reference = {
    __cReference: true,
    get value() { return EXPANDERSHOOT____header_global_98f50bb777113835; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:179
export const INTRO4_B____header_global_5f62f3f798931061 = ((((((392) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9e684a855fb4ef21dd174866() {
  return __cxx_static_address_9e684a855fb4ef21dd174866.reference || (__cxx_static_address_9e684a855fb4ef21dd174866.reference = {
    __cReference: true,
    get value() { return INTRO4_B____header_global_5f62f3f798931061; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:180
export const BIGBANG____header_global_56a2c288a0f8ae9e = ((((((393) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a78f7ed1022fd04fcd953ce3() {
  return __cxx_static_address_a78f7ed1022fd04fcd953ce3.reference || (__cxx_static_address_a78f7ed1022fd04fcd953ce3.reference = {
    __cReference: true,
    get value() { return BIGBANG____header_global_56a2c288a0f8ae9e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:181
export const FLAMETHROWER_INTRO____header_global_44e7a4a923852662 = ((((((398) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_075ab80dc2b6b7eba2906e13() {
  return __cxx_static_address_075ab80dc2b6b7eba2906e13.reference || (__cxx_static_address_075ab80dc2b6b7eba2906e13.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_INTRO____header_global_44e7a4a923852662; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:182
export const FLAMETHROWER_LOOP____header_global_06534d4bdfa82661 = ((((((399) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3379d0acdededeb64a6e2822() {
  return __cxx_static_address_3379d0acdededeb64a6e2822.reference || (__cxx_static_address_3379d0acdededeb64a6e2822.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_LOOP____header_global_06534d4bdfa82661; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:183
export const FLAMETHROWER_END____header_global_a2916b63fac8ca4b = ((((((400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d0dbf5c59fd76a8228c6fb9f() {
  return __cxx_static_address_d0dbf5c59fd76a8228c6fb9f.reference || (__cxx_static_address_d0dbf5c59fd76a8228c6fb9f.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_END____header_global_a2916b63fac8ca4b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:184
export const E5L7_DUKE_QUIT_YOU____header_global_f33b2b3f0e8b731c = ((((((401) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4d50ee9ce91ea3c95266a20c() {
  return __cxx_static_address_4d50ee9ce91ea3c95266a20c.reference || (__cxx_static_address_4d50ee9ce91ea3c95266a20c.reference = {
    __cReference: true,
    get value() { return E5L7_DUKE_QUIT_YOU____header_global_f33b2b3f0e8b731c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:187
export const SECTOREFFECTOR____header_global_51b0f4caa88f9813 = ((((((1) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aba58b8a4d9c017471748979() {
  return __cxx_static_address_aba58b8a4d9c017471748979.reference || (__cxx_static_address_aba58b8a4d9c017471748979.reference = {
    __cReference: true,
    get value() { return SECTOREFFECTOR____header_global_51b0f4caa88f9813; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:188
export const ACTIVATOR____header_global_3ad1fa425fb64921 = ((((((2) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_28df8b5d4c1811807a9a3f10() {
  return __cxx_static_address_28df8b5d4c1811807a9a3f10.reference || (__cxx_static_address_28df8b5d4c1811807a9a3f10.reference = {
    __cReference: true,
    get value() { return ACTIVATOR____header_global_3ad1fa425fb64921; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:189
export const TOUCHPLATE____header_global_9d3f1c104492f7e4 = ((((((3) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a2295fd7d3a5edad8641c3a4() {
  return __cxx_static_address_a2295fd7d3a5edad8641c3a4.reference || (__cxx_static_address_a2295fd7d3a5edad8641c3a4.reference = {
    __cReference: true,
    get value() { return TOUCHPLATE____header_global_9d3f1c104492f7e4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:190
export const ACTIVATORLOCKED____header_global_2fd75e5d4196301d = ((((((4) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_289e5b3139d31ebb6a22e248() {
  return __cxx_static_address_289e5b3139d31ebb6a22e248.reference || (__cxx_static_address_289e5b3139d31ebb6a22e248.reference = {
    __cReference: true,
    get value() { return ACTIVATORLOCKED____header_global_2fd75e5d4196301d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:191
export const MUSICANDSFX____header_global_1f07317205653a15 = ((((((5) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_146ed9b538af2d512036e88f() {
  return __cxx_static_address_146ed9b538af2d512036e88f.reference || (__cxx_static_address_146ed9b538af2d512036e88f.reference = {
    __cReference: true,
    get value() { return MUSICANDSFX____header_global_1f07317205653a15; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:192
export const LOCATORS____header_global_761775a60155ce08 = ((((((6) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7e73c07fdc190b217212b004() {
  return __cxx_static_address_7e73c07fdc190b217212b004.reference || (__cxx_static_address_7e73c07fdc190b217212b004.reference = {
    __cReference: true,
    get value() { return LOCATORS____header_global_761775a60155ce08; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:193
export const CYCLER____header_global_6bc5c3da669610c8 = ((((((7) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_de52f4f980208686a7ace321() {
  return __cxx_static_address_de52f4f980208686a7ace321.reference || (__cxx_static_address_de52f4f980208686a7ace321.reference = {
    __cReference: true,
    get value() { return CYCLER____header_global_6bc5c3da669610c8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:194
export const MASTERSWITCH____header_global_33aa61d26fa8b192 = ((((((8) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c9a41749c47cda54e6d02cc0() {
  return __cxx_static_address_c9a41749c47cda54e6d02cc0.reference || (__cxx_static_address_c9a41749c47cda54e6d02cc0.reference = {
    __cReference: true,
    get value() { return MASTERSWITCH____header_global_33aa61d26fa8b192; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:195
export const RESPAWN____header_global_0fc54f0bc077eb8d = ((((((9) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_190e836497f4553ac07c1cf5() {
  return __cxx_static_address_190e836497f4553ac07c1cf5.reference || (__cxx_static_address_190e836497f4553ac07c1cf5.reference = {
    __cReference: true,
    get value() { return RESPAWN____header_global_0fc54f0bc077eb8d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:196
export const GPSPEED____header_global_82d9ab8354453294 = ((((((10) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4e40e90e875b00b223a469d1() {
  return __cxx_static_address_4e40e90e875b00b223a469d1.reference || (__cxx_static_address_4e40e90e875b00b223a469d1.reference = {
    __cReference: true,
    get value() { return GPSPEED____header_global_82d9ab8354453294; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:197
export const FOF____header_global_f96d862958bf5f6b = ((((((13) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_794825b1dcbeeb9f4f169851() {
  return __cxx_static_address_794825b1dcbeeb9f4f169851.reference || (__cxx_static_address_794825b1dcbeeb9f4f169851.reference = {
    __cReference: true,
    get value() { return FOF____header_global_f96d862958bf5f6b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:198
export const ARROW____header_global_b2489e07e33d974c = ((((((20) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5bef95fe265a992cdaa8ef5f() {
  return __cxx_static_address_5bef95fe265a992cdaa8ef5f.reference || (__cxx_static_address_5bef95fe265a992cdaa8ef5f.reference = {
    __cReference: true,
    get value() { return ARROW____header_global_b2489e07e33d974c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:199
export const FIRSTGUNSPRITE____header_global_46bdb1d615123d58 = ((((((21) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_96b55a2b8d663e17d199006a() {
  return __cxx_static_address_96b55a2b8d663e17d199006a.reference || (__cxx_static_address_96b55a2b8d663e17d199006a.reference = {
    __cReference: true,
    get value() { return FIRSTGUNSPRITE____header_global_46bdb1d615123d58; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:200
export const CHAINGUNSPRITE____header_global_9ce2ed33f0764a53 = ((((((22) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9e718dc2d2a877617a6934b9() {
  return __cxx_static_address_9e718dc2d2a877617a6934b9.reference || (__cxx_static_address_9e718dc2d2a877617a6934b9.reference = {
    __cReference: true,
    get value() { return CHAINGUNSPRITE____header_global_9ce2ed33f0764a53; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:201
export const RPGSPRITE____header_global_755020455013b7ff = ((((((23) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_95ea6299c0a11d7fe28599eb() {
  return __cxx_static_address_95ea6299c0a11d7fe28599eb.reference || (__cxx_static_address_95ea6299c0a11d7fe28599eb.reference = {
    __cReference: true,
    get value() { return RPGSPRITE____header_global_755020455013b7ff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:202
export const FREEZESPRITE____header_global_2b361bb0f55473a1 = ((((((24) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_055f067d41d539c2c2b5910e() {
  return __cxx_static_address_055f067d41d539c2c2b5910e.reference || (__cxx_static_address_055f067d41d539c2c2b5910e.reference = {
    __cReference: true,
    get value() { return FREEZESPRITE____header_global_2b361bb0f55473a1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:203
export const SHRINKERSPRITE____header_global_ebe33c6a0741f8e4 = ((((((25) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c618fc53540f6fa263e6ed08() {
  return __cxx_static_address_c618fc53540f6fa263e6ed08.reference || (__cxx_static_address_c618fc53540f6fa263e6ed08.reference = {
    __cReference: true,
    get value() { return SHRINKERSPRITE____header_global_ebe33c6a0741f8e4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:204
export const HEAVYHBOMB____header_global_b56e57f26c975afc = ((((((26) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e45254db2130364adb8f10d5() {
  return __cxx_static_address_e45254db2130364adb8f10d5.reference || (__cxx_static_address_e45254db2130364adb8f10d5.reference = {
    __cReference: true,
    get value() { return HEAVYHBOMB____header_global_b56e57f26c975afc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:205
export const TRIPBOMBSPRITE____header_global_79e3854b249419ec = ((((((27) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b5e6176197d770d1e6d63387() {
  return __cxx_static_address_b5e6176197d770d1e6d63387.reference || (__cxx_static_address_b5e6176197d770d1e6d63387.reference = {
    __cReference: true,
    get value() { return TRIPBOMBSPRITE____header_global_79e3854b249419ec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:206
export const SHOTGUNSPRITE____header_global_d55492027a8420e4 = ((((((28) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_842e305df1292162b727f925() {
  return __cxx_static_address_842e305df1292162b727f925.reference || (__cxx_static_address_842e305df1292162b727f925.reference = {
    __cReference: true,
    get value() { return SHOTGUNSPRITE____header_global_d55492027a8420e4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:207
export const DEVISTATORSPRITE____header_global_4bd8e79bc49ec81d = ((((((29) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_02e4e652722465c505f61fee() {
  return __cxx_static_address_02e4e652722465c505f61fee.reference || (__cxx_static_address_02e4e652722465c505f61fee.reference = {
    __cReference: true,
    get value() { return DEVISTATORSPRITE____header_global_4bd8e79bc49ec81d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:208
export const HEALTHBOX____header_global_1c4b7fe616e98a49 = ((((((30) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a9ba5518e7e5f1d2436c3166() {
  return __cxx_static_address_a9ba5518e7e5f1d2436c3166.reference || (__cxx_static_address_a9ba5518e7e5f1d2436c3166.reference = {
    __cReference: true,
    get value() { return HEALTHBOX____header_global_1c4b7fe616e98a49; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:209
export const AMMOBOX____header_global_2c5935c42cfdbc0b = ((((((31) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_62fc9d0622f92d7aa315e45f() {
  return __cxx_static_address_62fc9d0622f92d7aa315e45f.reference || (__cxx_static_address_62fc9d0622f92d7aa315e45f.reference = {
    __cReference: true,
    get value() { return AMMOBOX____header_global_2c5935c42cfdbc0b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:210
export const GROWSPRITEICON____header_global_6fdf0f07fd7016c9 = ((((((32) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d6b2618fa17e15e641cf2f45() {
  return __cxx_static_address_d6b2618fa17e15e641cf2f45.reference || (__cxx_static_address_d6b2618fa17e15e641cf2f45.reference = {
    __cReference: true,
    get value() { return GROWSPRITEICON____header_global_6fdf0f07fd7016c9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:211
export const INVENTORYBOX____header_global_608e95876567960a = ((((((33) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_674858f5096f1f8e1c2eef78() {
  return __cxx_static_address_674858f5096f1f8e1c2eef78.reference || (__cxx_static_address_674858f5096f1f8e1c2eef78.reference = {
    __cReference: true,
    get value() { return INVENTORYBOX____header_global_608e95876567960a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:212
export const FREEZEAMMO____header_global_09fa2153f0a1abbd = ((((((37) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c9df929aff22f176d74ccd6d() {
  return __cxx_static_address_c9df929aff22f176d74ccd6d.reference || (__cxx_static_address_c9df929aff22f176d74ccd6d.reference = {
    __cReference: true,
    get value() { return FREEZEAMMO____header_global_09fa2153f0a1abbd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:213
export const AMMO____header_global_7516d55ef20fe74f = ((((((40) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_500045b10f306bd37379ace6() {
  return __cxx_static_address_500045b10f306bd37379ace6.reference || (__cxx_static_address_500045b10f306bd37379ace6.reference = {
    __cReference: true,
    get value() { return AMMO____header_global_7516d55ef20fe74f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:214
export const BATTERYAMMO____header_global_84063dc10038dba4 = ((((((41) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8db2d17c1657199901b04c2e() {
  return __cxx_static_address_8db2d17c1657199901b04c2e.reference || (__cxx_static_address_8db2d17c1657199901b04c2e.reference = {
    __cReference: true,
    get value() { return BATTERYAMMO____header_global_84063dc10038dba4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:215
export const DEVISTATORAMMO____header_global_3ffc9d16e189dd40 = ((((((42) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_29322bb221848211198ba14f() {
  return __cxx_static_address_29322bb221848211198ba14f.reference || (__cxx_static_address_29322bb221848211198ba14f.reference = {
    __cReference: true,
    get value() { return DEVISTATORAMMO____header_global_3ffc9d16e189dd40; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:216
export const RPGAMMO____header_global_2fb7b8d6882f1edb = ((((((44) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_80a4242b9116f43c261ccd0a() {
  return __cxx_static_address_80a4242b9116f43c261ccd0a.reference || (__cxx_static_address_80a4242b9116f43c261ccd0a.reference = {
    __cReference: true,
    get value() { return RPGAMMO____header_global_2fb7b8d6882f1edb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:217
export const GROWAMMO____header_global_ca0c180fb8dcec70 = ((((((45) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8137cb5e7cdbca7dd268510e() {
  return __cxx_static_address_8137cb5e7cdbca7dd268510e.reference || (__cxx_static_address_8137cb5e7cdbca7dd268510e.reference = {
    __cReference: true,
    get value() { return GROWAMMO____header_global_ca0c180fb8dcec70; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:218
export const CRYSTALAMMO____header_global_74b6e1210c49d02a = ((((((46) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ce11f4b12941487f4052f7c9() {
  return __cxx_static_address_ce11f4b12941487f4052f7c9.reference || (__cxx_static_address_ce11f4b12941487f4052f7c9.reference = {
    __cReference: true,
    get value() { return CRYSTALAMMO____header_global_74b6e1210c49d02a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:219
export const HBOMBAMMO____header_global_b979e8f2b09221de = ((((((47) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_233ad010f5acd6a14ad32ff5() {
  return __cxx_static_address_233ad010f5acd6a14ad32ff5.reference || (__cxx_static_address_233ad010f5acd6a14ad32ff5.reference = {
    __cReference: true,
    get value() { return HBOMBAMMO____header_global_b979e8f2b09221de; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:220
export const AMMOLOTS____header_global_3b2925333718f893 = ((((((48) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_07df5a8f5b110751f0f1a4f0() {
  return __cxx_static_address_07df5a8f5b110751f0f1a4f0.reference || (__cxx_static_address_07df5a8f5b110751f0f1a4f0.reference = {
    __cReference: true,
    get value() { return AMMOLOTS____header_global_3b2925333718f893; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:221
export const SHOTGUNAMMO____header_global_1be80833176462f2 = ((((((49) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c0447686e8d1a06f5cbb0708() {
  return __cxx_static_address_c0447686e8d1a06f5cbb0708.reference || (__cxx_static_address_c0447686e8d1a06f5cbb0708.reference = {
    __cReference: true,
    get value() { return SHOTGUNAMMO____header_global_1be80833176462f2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:222
export const COLA____header_global_8ff46acc01e43f95 = ((((((51) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4c05072fb046b085e8db7159() {
  return __cxx_static_address_4c05072fb046b085e8db7159.reference || (__cxx_static_address_4c05072fb046b085e8db7159.reference = {
    __cReference: true,
    get value() { return COLA____header_global_8ff46acc01e43f95; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:223
export const SIXPAK____header_global_eb907e3ea271b15e = ((((((52) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e6803ddc99f3271f219dde48() {
  return __cxx_static_address_e6803ddc99f3271f219dde48.reference || (__cxx_static_address_e6803ddc99f3271f219dde48.reference = {
    __cReference: true,
    get value() { return SIXPAK____header_global_eb907e3ea271b15e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:224
export const FIRSTAID____header_global_ec6907ac8955d3dc = ((((((53) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_29b69fd10d4f62cdc03b2222() {
  return __cxx_static_address_29b69fd10d4f62cdc03b2222.reference || (__cxx_static_address_29b69fd10d4f62cdc03b2222.reference = {
    __cReference: true,
    get value() { return FIRSTAID____header_global_ec6907ac8955d3dc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:225
export const SHIELD____header_global_ec6a14b4f8da3bd6 = ((((((54) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3ec20bfd320300c12bd50ab4() {
  return __cxx_static_address_3ec20bfd320300c12bd50ab4.reference || (__cxx_static_address_3ec20bfd320300c12bd50ab4.reference = {
    __cReference: true,
    get value() { return SHIELD____header_global_ec6a14b4f8da3bd6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:226
export const STEROIDS____header_global_804394e8d13a15ea = ((((((55) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dcb5d5df4c93dc91ec374b01() {
  return __cxx_static_address_dcb5d5df4c93dc91ec374b01.reference || (__cxx_static_address_dcb5d5df4c93dc91ec374b01.reference = {
    __cReference: true,
    get value() { return STEROIDS____header_global_804394e8d13a15ea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:227
export const AIRTANK____header_global_90be583bba8e32a9 = ((((((56) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_24c789f217c506c5aa5b92f8() {
  return __cxx_static_address_24c789f217c506c5aa5b92f8.reference || (__cxx_static_address_24c789f217c506c5aa5b92f8.reference = {
    __cReference: true,
    get value() { return AIRTANK____header_global_90be583bba8e32a9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:228
export const JETPACK____header_global_90147b3319aaf91d = ((((((57) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_da2247bf157fb3f7bb97d64f() {
  return __cxx_static_address_da2247bf157fb3f7bb97d64f.reference || (__cxx_static_address_da2247bf157fb3f7bb97d64f.reference = {
    __cReference: true,
    get value() { return JETPACK____header_global_90147b3319aaf91d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:229
export const HEATSENSOR____header_global_a27bdb3842a3d635 = ((((((59) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_68e200830b08d1306b12b6f8() {
  return __cxx_static_address_68e200830b08d1306b12b6f8.reference || (__cxx_static_address_68e200830b08d1306b12b6f8.reference = {
    __cReference: true,
    get value() { return HEATSENSOR____header_global_a27bdb3842a3d635; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:230
export const ACCESSCARD____header_global_2344d7e6ea9e3c2b = ((((((60) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6cf3a97036c689fc7ccb2518() {
  return __cxx_static_address_6cf3a97036c689fc7ccb2518.reference || (__cxx_static_address_6cf3a97036c689fc7ccb2518.reference = {
    __cReference: true,
    get value() { return ACCESSCARD____header_global_2344d7e6ea9e3c2b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:231
export const BOOTS____header_global_5e5d194bc2602fd8 = ((((((61) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a4b21e783949df83b99a1aec() {
  return __cxx_static_address_a4b21e783949df83b99a1aec.reference || (__cxx_static_address_a4b21e783949df83b99a1aec.reference = {
    __cReference: true,
    get value() { return BOOTS____header_global_5e5d194bc2602fd8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:232
export const MIRRORBROKE____header_global_255d5e18d3266216 = ((((((70) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f094a6db44a2169230a7fca6() {
  return __cxx_static_address_f094a6db44a2169230a7fca6.reference || (__cxx_static_address_f094a6db44a2169230a7fca6.reference = {
    __cReference: true,
    get value() { return MIRRORBROKE____header_global_255d5e18d3266216; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:233
export const CLOUDYOCEAN____header_global_514af0d034d21393 = ((((((78) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_01dbe4771420f6bf0727dd72() {
  return __cxx_static_address_01dbe4771420f6bf0727dd72.reference || (__cxx_static_address_01dbe4771420f6bf0727dd72.reference = {
    __cReference: true,
    get value() { return CLOUDYOCEAN____header_global_514af0d034d21393; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:234
export const CLOUDYSKIES____header_global_962ed0bb5d2cbb48 = ((((((79) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f6a65b273b2996399046b3a2() {
  return __cxx_static_address_f6a65b273b2996399046b3a2.reference || (__cxx_static_address_f6a65b273b2996399046b3a2.reference = {
    __cReference: true,
    get value() { return CLOUDYSKIES____header_global_962ed0bb5d2cbb48; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:235
export const MOONSKY1____header_global_020eb05a704abe26 = ((((((80) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ec67879d18079e46467ca75b() {
  return __cxx_static_address_ec67879d18079e46467ca75b.reference || (__cxx_static_address_ec67879d18079e46467ca75b.reference = {
    __cReference: true,
    get value() { return MOONSKY1____header_global_020eb05a704abe26; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:236
export const BIGORBIT1____header_global_1a721ae541c31e94 = ((((((84) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_15410ae283171bb2ff99263d() {
  return __cxx_static_address_15410ae283171bb2ff99263d.reference || (__cxx_static_address_15410ae283171bb2ff99263d.reference = {
    __cReference: true,
    get value() { return BIGORBIT1____header_global_1a721ae541c31e94; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:237
export const LA____header_global_182f8a467dca203b = ((((((89) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8abdad49f4003aeb763edf5b() {
  return __cxx_static_address_8abdad49f4003aeb763edf5b.reference || (__cxx_static_address_8abdad49f4003aeb763edf5b.reference = {
    __cReference: true,
    get value() { return LA____header_global_182f8a467dca203b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:238
export const ATOMICHEALTH____header_global_1fbc9c3478c43cea = ((((((100) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c664cacd10e93f23d3bb8201() {
  return __cxx_static_address_c664cacd10e93f23d3bb8201.reference || (__cxx_static_address_c664cacd10e93f23d3bb8201.reference = {
    __cReference: true,
    get value() { return ATOMICHEALTH____header_global_1fbc9c3478c43cea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:239
export const TECHLIGHT2____header_global_e725ded44280bf9b = ((((((120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aa0d5ce1abaed0d907fbdcfa() {
  return __cxx_static_address_aa0d5ce1abaed0d907fbdcfa.reference || (__cxx_static_address_aa0d5ce1abaed0d907fbdcfa.reference = {
    __cReference: true,
    get value() { return TECHLIGHT2____header_global_e725ded44280bf9b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:240
export const TECHLIGHTBUST2____header_global_687593af8e45f162 = ((((((121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fd5d9939deb59b64bf17f40a() {
  return __cxx_static_address_fd5d9939deb59b64bf17f40a.reference || (__cxx_static_address_fd5d9939deb59b64bf17f40a.reference = {
    __cReference: true,
    get value() { return TECHLIGHTBUST2____header_global_687593af8e45f162; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:241
export const TECHLIGHT4____header_global_31f5cbf9843ad759 = ((((((122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6aa6ddec78a2ff1e2bd1cb37() {
  return __cxx_static_address_6aa6ddec78a2ff1e2bd1cb37.reference || (__cxx_static_address_6aa6ddec78a2ff1e2bd1cb37.reference = {
    __cReference: true,
    get value() { return TECHLIGHT4____header_global_31f5cbf9843ad759; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:242
export const TECHLIGHTBUST4____header_global_bf88224ccd412be3 = ((((((123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a24bff1c046cb7a5ac5fbfec() {
  return __cxx_static_address_a24bff1c046cb7a5ac5fbfec.reference || (__cxx_static_address_a24bff1c046cb7a5ac5fbfec.reference = {
    __cReference: true,
    get value() { return TECHLIGHTBUST4____header_global_bf88224ccd412be3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:243
export const WALLLIGHT4____header_global_ec69d5ddced2c32a = ((((((124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9f19fe8805e73298b833349d() {
  return __cxx_static_address_9f19fe8805e73298b833349d.reference || (__cxx_static_address_9f19fe8805e73298b833349d.reference = {
    __cReference: true,
    get value() { return WALLLIGHT4____header_global_ec69d5ddced2c32a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:244
export const WALLLIGHTBUST4____header_global_76f9dcd0d07a7dd0 = ((((((125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_50a0adf9cd9b8f0e68c791b7() {
  return __cxx_static_address_50a0adf9cd9b8f0e68c791b7.reference || (__cxx_static_address_50a0adf9cd9b8f0e68c791b7.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST4____header_global_76f9dcd0d07a7dd0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:245
export const ACCESSSWITCH____header_global_3980219f318c5146 = ((((((130) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eba1e71f0e63c268cc1a2605() {
  return __cxx_static_address_eba1e71f0e63c268cc1a2605.reference || (__cxx_static_address_eba1e71f0e63c268cc1a2605.reference = {
    __cReference: true,
    get value() { return ACCESSSWITCH____header_global_3980219f318c5146; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:246
export const SLOTDOOR____header_global_04be7b4d5284a87e = ((((((132) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a8fa2015368e5a9e8e60c7d6() {
  return __cxx_static_address_a8fa2015368e5a9e8e60c7d6.reference || (__cxx_static_address_a8fa2015368e5a9e8e60c7d6.reference = {
    __cReference: true,
    get value() { return SLOTDOOR____header_global_04be7b4d5284a87e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:247
export const LIGHTSWITCH____header_global_7b348344589435cd = ((((((134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8a86102a241330ebcc9d0186() {
  return __cxx_static_address_8a86102a241330ebcc9d0186.reference || (__cxx_static_address_8a86102a241330ebcc9d0186.reference = {
    __cReference: true,
    get value() { return LIGHTSWITCH____header_global_7b348344589435cd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:248
export const SPACEDOORSWITCH____header_global_36eacf5587da9669 = ((((((136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6c7cd93f53f0c34d4fbe2291() {
  return __cxx_static_address_6c7cd93f53f0c34d4fbe2291.reference || (__cxx_static_address_6c7cd93f53f0c34d4fbe2291.reference = {
    __cReference: true,
    get value() { return SPACEDOORSWITCH____header_global_36eacf5587da9669; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:249
export const SPACELIGHTSWITCH____header_global_cb399f732db3f861 = ((((((138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d0ebeee31adeb73968a353b0() {
  return __cxx_static_address_d0ebeee31adeb73968a353b0.reference || (__cxx_static_address_d0ebeee31adeb73968a353b0.reference = {
    __cReference: true,
    get value() { return SPACELIGHTSWITCH____header_global_cb399f732db3f861; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:250
export const FRANKENSTINESWITCH____header_global_b5fd8c84e74974e0 = ((((((140) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_26f52a6e94e3e8be0fe3637a() {
  return __cxx_static_address_26f52a6e94e3e8be0fe3637a.reference || (__cxx_static_address_26f52a6e94e3e8be0fe3637a.reference = {
    __cReference: true,
    get value() { return FRANKENSTINESWITCH____header_global_b5fd8c84e74974e0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:251
export const NUKEBUTTON____header_global_b27ab368e783b5f3 = ((((((142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_109e1b03ff72fd57d420f8b5() {
  return __cxx_static_address_109e1b03ff72fd57d420f8b5.reference || (__cxx_static_address_109e1b03ff72fd57d420f8b5.reference = {
    __cReference: true,
    get value() { return NUKEBUTTON____header_global_b27ab368e783b5f3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:252
export const MULTISWITCH____header_global_03a0d448d98a65e2 = ((((((146) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_60474de984ec580070e6b241() {
  return __cxx_static_address_60474de984ec580070e6b241.reference || (__cxx_static_address_60474de984ec580070e6b241.reference = {
    __cReference: true,
    get value() { return MULTISWITCH____header_global_03a0d448d98a65e2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:253
export const DOORTILE5____header_global_17f7967bbafcea72 = ((((((150) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f57dbe52a01ae3764b83f19d() {
  return __cxx_static_address_f57dbe52a01ae3764b83f19d.reference || (__cxx_static_address_f57dbe52a01ae3764b83f19d.reference = {
    __cReference: true,
    get value() { return DOORTILE5____header_global_17f7967bbafcea72; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:254
export const DOORTILE6____header_global_1ba1c92a596777ab = ((((((151) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2e8048705cb28f5d67c8226f() {
  return __cxx_static_address_2e8048705cb28f5d67c8226f.reference || (__cxx_static_address_2e8048705cb28f5d67c8226f.reference = {
    __cReference: true,
    get value() { return DOORTILE6____header_global_1ba1c92a596777ab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:255
export const DOORTILE1____header_global_a3fcec7d06874369 = ((((((152) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e824686c37f39a5cbbd9c8ec() {
  return __cxx_static_address_e824686c37f39a5cbbd9c8ec.reference || (__cxx_static_address_e824686c37f39a5cbbd9c8ec.reference = {
    __cReference: true,
    get value() { return DOORTILE1____header_global_a3fcec7d06874369; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:256
export const DOORTILE2____header_global_2bc903784957d6d1 = ((((((153) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d79fcbbe56799529ec90c884() {
  return __cxx_static_address_d79fcbbe56799529ec90c884.reference || (__cxx_static_address_d79fcbbe56799529ec90c884.reference = {
    __cReference: true,
    get value() { return DOORTILE2____header_global_2bc903784957d6d1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:257
export const DOORTILE3____header_global_b2658ba84724f15f = ((((((154) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6d7ec2ab14680ebcc58edf08() {
  return __cxx_static_address_6d7ec2ab14680ebcc58edf08.reference || (__cxx_static_address_6d7ec2ab14680ebcc58edf08.reference = {
    __cReference: true,
    get value() { return DOORTILE3____header_global_b2658ba84724f15f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:258
export const DOORTILE4____header_global_0d9ee49bca92ff2e = ((((((155) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e39ba414d94d69104f619525() {
  return __cxx_static_address_e39ba414d94d69104f619525.reference || (__cxx_static_address_e39ba414d94d69104f619525.reference = {
    __cReference: true,
    get value() { return DOORTILE4____header_global_0d9ee49bca92ff2e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:259
export const DOORTILE7____header_global_6834794b33763db2 = ((((((156) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b3aa152e1ab43ca6e7e5c00a() {
  return __cxx_static_address_b3aa152e1ab43ca6e7e5c00a.reference || (__cxx_static_address_b3aa152e1ab43ca6e7e5c00a.reference = {
    __cReference: true,
    get value() { return DOORTILE7____header_global_6834794b33763db2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:260
export const DOORTILE8____header_global_13926262839f9566 = ((((((157) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6df28919d1c63034e219b41e() {
  return __cxx_static_address_6df28919d1c63034e219b41e.reference || (__cxx_static_address_6df28919d1c63034e219b41e.reference = {
    __cReference: true,
    get value() { return DOORTILE8____header_global_13926262839f9566; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:261
export const DOORTILE9____header_global_b06016f60385d3f0 = ((((((158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bd772b8f3323bc04667d7eb9() {
  return __cxx_static_address_bd772b8f3323bc04667d7eb9.reference || (__cxx_static_address_bd772b8f3323bc04667d7eb9.reference = {
    __cReference: true,
    get value() { return DOORTILE9____header_global_b06016f60385d3f0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:262
export const DOORTILE10____header_global_c882de914046b91c = ((((((159) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ba97e8297a74a07878b5d5b0() {
  return __cxx_static_address_ba97e8297a74a07878b5d5b0.reference || (__cxx_static_address_ba97e8297a74a07878b5d5b0.reference = {
    __cReference: true,
    get value() { return DOORTILE10____header_global_c882de914046b91c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:263
export const DOORSHOCK____header_global_1ec35c70d6bfec14 = ((((((160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b5c8af47a0940a2c143f7f4e() {
  return __cxx_static_address_b5c8af47a0940a2c143f7f4e.reference || (__cxx_static_address_b5c8af47a0940a2c143f7f4e.reference = {
    __cReference: true,
    get value() { return DOORSHOCK____header_global_1ec35c70d6bfec14; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:264
export const DIPSWITCH____header_global_ab92e2cb153607b9 = ((((((162) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_32fffe6df4aff73495eaccdf() {
  return __cxx_static_address_32fffe6df4aff73495eaccdf.reference || (__cxx_static_address_32fffe6df4aff73495eaccdf.reference = {
    __cReference: true,
    get value() { return DIPSWITCH____header_global_ab92e2cb153607b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:265
export const DIPSWITCH2____header_global_06c2568c33e10b05 = ((((((164) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_59b6f210dd26d2b9bf080330() {
  return __cxx_static_address_59b6f210dd26d2b9bf080330.reference || (__cxx_static_address_59b6f210dd26d2b9bf080330.reference = {
    __cReference: true,
    get value() { return DIPSWITCH2____header_global_06c2568c33e10b05; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:266
export const TECHSWITCH____header_global_fca0ed80d63d19dd = ((((((166) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f8ea908487f0b41dc625b5fb() {
  return __cxx_static_address_f8ea908487f0b41dc625b5fb.reference || (__cxx_static_address_f8ea908487f0b41dc625b5fb.reference = {
    __cReference: true,
    get value() { return TECHSWITCH____header_global_fca0ed80d63d19dd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:267
export const DIPSWITCH3____header_global_03b34fc35bad4e78 = ((((((168) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f22e50af2d16715559d57b32() {
  return __cxx_static_address_f22e50af2d16715559d57b32.reference || (__cxx_static_address_f22e50af2d16715559d57b32.reference = {
    __cReference: true,
    get value() { return DIPSWITCH3____header_global_03b34fc35bad4e78; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:268
export const ACCESSSWITCH2____header_global_0cdc29f44143a6d1 = ((((((170) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_24ca844a635d7d6f8c7b3120() {
  return __cxx_static_address_24ca844a635d7d6f8c7b3120.reference || (__cxx_static_address_24ca844a635d7d6f8c7b3120.reference = {
    __cReference: true,
    get value() { return ACCESSSWITCH2____header_global_0cdc29f44143a6d1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:269
export const FLOORSLIME____header_global_035840c32ee0a5e6 = ((((((200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b010de5518042ae7ac79f6be() {
  return __cxx_static_address_b010de5518042ae7ac79f6be.reference || (__cxx_static_address_b010de5518042ae7ac79f6be.reference = {
    __cReference: true,
    get value() { return FLOORSLIME____header_global_035840c32ee0a5e6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:270
export const BIGFORCE____header_global_0bc129993c8e622b = ((((((230) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d8aa1648e331fbf6cfaafb33() {
  return __cxx_static_address_d8aa1648e331fbf6cfaafb33.reference || (__cxx_static_address_d8aa1648e331fbf6cfaafb33.reference = {
    __cReference: true,
    get value() { return BIGFORCE____header_global_0bc129993c8e622b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:271
export const MASKWALL9____header_global_1433d1eab82178f1 = ((((((255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2cb76c8b116af4a3391a3d44() {
  return __cxx_static_address_2cb76c8b116af4a3391a3d44.reference || (__cxx_static_address_2cb76c8b116af4a3391a3d44.reference = {
    __cReference: true,
    get value() { return MASKWALL9____header_global_1433d1eab82178f1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:272
export const SCREENBREAK1____header_global_a746ebc7a58b2864 = ((((((263) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0d12ee6a246bb9b9156c0660() {
  return __cxx_static_address_0d12ee6a246bb9b9156c0660.reference || (__cxx_static_address_0d12ee6a246bb9b9156c0660.reference = {
    __cReference: true,
    get value() { return SCREENBREAK1____header_global_a746ebc7a58b2864; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:273
export const SCREENBREAK2____header_global_c6deb67a10b918be = ((((((264) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_750d5c3a11a192c6383bbfd9() {
  return __cxx_static_address_750d5c3a11a192c6383bbfd9.reference || (__cxx_static_address_750d5c3a11a192c6383bbfd9.reference = {
    __cReference: true,
    get value() { return SCREENBREAK2____header_global_c6deb67a10b918be; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:274
export const SCREENBREAK3____header_global_a55dd3295b5082aa = ((((((265) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a481999820d5d27ccce0208e() {
  return __cxx_static_address_a481999820d5d27ccce0208e.reference || (__cxx_static_address_a481999820d5d27ccce0208e.reference = {
    __cReference: true,
    get value() { return SCREENBREAK3____header_global_a55dd3295b5082aa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:275
export const SCREENBREAK4____header_global_940134dfd805fdf1 = ((((((266) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bdc88c274f48bb1205cc532c() {
  return __cxx_static_address_bdc88c274f48bb1205cc532c.reference || (__cxx_static_address_bdc88c274f48bb1205cc532c.reference = {
    __cReference: true,
    get value() { return SCREENBREAK4____header_global_940134dfd805fdf1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:276
export const SCREENBREAK5____header_global_1afa27dfcdd85c88 = ((((((267) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_35ebfe5ce62fc8da3aed2a6d() {
  return __cxx_static_address_35ebfe5ce62fc8da3aed2a6d.reference || (__cxx_static_address_35ebfe5ce62fc8da3aed2a6d.reference = {
    __cReference: true,
    get value() { return SCREENBREAK5____header_global_1afa27dfcdd85c88; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:277
export const SCREENBREAK6____header_global_6985cf39262914be = ((((((268) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_007dd1cb3fc7ba8c74ccc9e3() {
  return __cxx_static_address_007dd1cb3fc7ba8c74ccc9e3.reference || (__cxx_static_address_007dd1cb3fc7ba8c74ccc9e3.reference = {
    __cReference: true,
    get value() { return SCREENBREAK6____header_global_6985cf39262914be; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:278
export const SCREENBREAK7____header_global_8342443f4dff5ae0 = ((((((269) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d77d3eca9134a3a50bcc74d8() {
  return __cxx_static_address_d77d3eca9134a3a50bcc74d8.reference || (__cxx_static_address_d77d3eca9134a3a50bcc74d8.reference = {
    __cReference: true,
    get value() { return SCREENBREAK7____header_global_8342443f4dff5ae0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:279
export const SCREENBREAK8____header_global_00b8ade33b1f0947 = ((((((270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_11e8d4ae05657bde143788cf() {
  return __cxx_static_address_11e8d4ae05657bde143788cf.reference || (__cxx_static_address_11e8d4ae05657bde143788cf.reference = {
    __cReference: true,
    get value() { return SCREENBREAK8____header_global_00b8ade33b1f0947; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:280
export const SCREENBREAK9____header_global_a6ac4b3c77971a41 = ((((((271) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5d58872c7f0f37e518971a2f() {
  return __cxx_static_address_5d58872c7f0f37e518971a2f.reference || (__cxx_static_address_5d58872c7f0f37e518971a2f.reference = {
    __cReference: true,
    get value() { return SCREENBREAK9____header_global_a6ac4b3c77971a41; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:281
export const SCREENBREAK10____header_global_3990a71a9a6af3fd = ((((((272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_05ca7dc17a500b6a8f1cc99b() {
  return __cxx_static_address_05ca7dc17a500b6a8f1cc99b.reference || (__cxx_static_address_05ca7dc17a500b6a8f1cc99b.reference = {
    __cReference: true,
    get value() { return SCREENBREAK10____header_global_3990a71a9a6af3fd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:282
export const SCREENBREAK11____header_global_69e59f95af4e4908 = ((((((273) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_12c2fe7902a864fe4352602b() {
  return __cxx_static_address_12c2fe7902a864fe4352602b.reference || (__cxx_static_address_12c2fe7902a864fe4352602b.reference = {
    __cReference: true,
    get value() { return SCREENBREAK11____header_global_69e59f95af4e4908; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:283
export const SCREENBREAK12____header_global_66efaec87adb4c70 = ((((((274) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_51d89f7cd3ad33b6143ba3ef() {
  return __cxx_static_address_51d89f7cd3ad33b6143ba3ef.reference || (__cxx_static_address_51d89f7cd3ad33b6143ba3ef.reference = {
    __cReference: true,
    get value() { return SCREENBREAK12____header_global_66efaec87adb4c70; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:284
export const SCREENBREAK13____header_global_d511063e882e1b95 = ((((((275) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_783b274778e81e501d08fabd() {
  return __cxx_static_address_783b274778e81e501d08fabd.reference || (__cxx_static_address_783b274778e81e501d08fabd.reference = {
    __cReference: true,
    get value() { return SCREENBREAK13____header_global_d511063e882e1b95; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:285
export const MASKWALL1____header_global_d8b5057c4b37de67 = ((((((285) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_13ac30669f69d88210985ef9() {
  return __cxx_static_address_13ac30669f69d88210985ef9.reference || (__cxx_static_address_13ac30669f69d88210985ef9.reference = {
    __cReference: true,
    get value() { return MASKWALL1____header_global_d8b5057c4b37de67; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:286
export const W_TECHWALL1____header_global_95bacdb4ecaeb8af = ((((((293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4e59566e05dda5002a3376f6() {
  return __cxx_static_address_4e59566e05dda5002a3376f6.reference || (__cxx_static_address_4e59566e05dda5002a3376f6.reference = {
    __cReference: true,
    get value() { return W_TECHWALL1____header_global_95bacdb4ecaeb8af; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:287
export const W_TECHWALL2____header_global_5bbad8eaa7d671b5 = ((((((297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7bb2e8667bc18950034e9695() {
  return __cxx_static_address_7bb2e8667bc18950034e9695.reference || (__cxx_static_address_7bb2e8667bc18950034e9695.reference = {
    __cReference: true,
    get value() { return W_TECHWALL2____header_global_5bbad8eaa7d671b5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:288
export const W_TECHWALL15____header_global_48dd00e9751e5aa7 = ((((((299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_16962b1eb5925cebc0eb7fd9() {
  return __cxx_static_address_16962b1eb5925cebc0eb7fd9.reference || (__cxx_static_address_16962b1eb5925cebc0eb7fd9.reference = {
    __cReference: true,
    get value() { return W_TECHWALL15____header_global_48dd00e9751e5aa7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:289
export const W_TECHWALL3____header_global_c39a285592f14ba2 = ((((((301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_66dfa8fd3c0b48a79b2f3bf7() {
  return __cxx_static_address_66dfa8fd3c0b48a79b2f3bf7.reference || (__cxx_static_address_66dfa8fd3c0b48a79b2f3bf7.reference = {
    __cReference: true,
    get value() { return W_TECHWALL3____header_global_c39a285592f14ba2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:290
export const W_TECHWALL4____header_global_e1845a0c6437aa7d = ((((((305) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5620528a5f14475d1d7033ad() {
  return __cxx_static_address_5620528a5f14475d1d7033ad.reference || (__cxx_static_address_5620528a5f14475d1d7033ad.reference = {
    __cReference: true,
    get value() { return W_TECHWALL4____header_global_e1845a0c6437aa7d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:291
export const W_TECHWALL10____header_global_3e2735eedf8d1fa1 = ((((((306) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dc482ff3c07de0b2cff5f2c4() {
  return __cxx_static_address_dc482ff3c07de0b2cff5f2c4.reference || (__cxx_static_address_dc482ff3c07de0b2cff5f2c4.reference = {
    __cReference: true,
    get value() { return W_TECHWALL10____header_global_3e2735eedf8d1fa1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:292
export const W_TECHWALL16____header_global_2573f2ff5c8ba3a8 = ((((((307) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9b71700a1019e87d61d83ba5() {
  return __cxx_static_address_9b71700a1019e87d61d83ba5.reference || (__cxx_static_address_9b71700a1019e87d61d83ba5.reference = {
    __cReference: true,
    get value() { return W_TECHWALL16____header_global_2573f2ff5c8ba3a8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:293
export const WATERTILE2____header_global_5b0d094bfe31abc5 = ((((((336) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6cf0a73f912c668a578dcb7d() {
  return __cxx_static_address_6cf0a73f912c668a578dcb7d.reference || (__cxx_static_address_6cf0a73f912c668a578dcb7d.reference = {
    __cReference: true,
    get value() { return WATERTILE2____header_global_5b0d094bfe31abc5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:294
export const BPANNEL1____header_global_ebddef9bbb995ece = ((((((341) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d2d2e6c534258c2613455e32() {
  return __cxx_static_address_d2d2e6c534258c2613455e32.reference || (__cxx_static_address_d2d2e6c534258c2613455e32.reference = {
    __cReference: true,
    get value() { return BPANNEL1____header_global_ebddef9bbb995ece; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:295
export const PANNEL1____header_global_f6b0f1797abd7655 = ((((((342) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7e0aa460be262e44578aea97() {
  return __cxx_static_address_7e0aa460be262e44578aea97.reference || (__cxx_static_address_7e0aa460be262e44578aea97.reference = {
    __cReference: true,
    get value() { return PANNEL1____header_global_f6b0f1797abd7655; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:296
export const PANNEL2____header_global_f6987970b3bb1164 = ((((((343) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ee79d2714ad761e75bcf08a5() {
  return __cxx_static_address_ee79d2714ad761e75bcf08a5.reference || (__cxx_static_address_ee79d2714ad761e75bcf08a5.reference = {
    __cReference: true,
    get value() { return PANNEL2____header_global_f6987970b3bb1164; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:297
export const STATIC____header_global_60c6046d6fe32065 = ((((((351) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c66e53e76c18962da5c2612c() {
  return __cxx_static_address_c66e53e76c18962da5c2612c.reference || (__cxx_static_address_c66e53e76c18962da5c2612c.reference = {
    __cReference: true,
    get value() { return STATIC____header_global_60c6046d6fe32065; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:298
export const W_SCREENBREAK____header_global_7281cd528ee4a658 = ((((((357) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7e0e6a5f03c2a08a76813fe1() {
  return __cxx_static_address_7e0e6a5f03c2a08a76813fe1.reference || (__cxx_static_address_7e0e6a5f03c2a08a76813fe1.reference = {
    __cReference: true,
    get value() { return W_SCREENBREAK____header_global_7281cd528ee4a658; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:299
export const W_HITTECHWALL3____header_global_34563b216d9023a9 = ((((((360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_184cef69d2b1391053890596() {
  return __cxx_static_address_184cef69d2b1391053890596.reference || (__cxx_static_address_184cef69d2b1391053890596.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL3____header_global_34563b216d9023a9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:300
export const W_HITTECHWALL4____header_global_061c630567ba6d77 = ((((((361) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2a4459d43b91af90d7f7e64c() {
  return __cxx_static_address_2a4459d43b91af90d7f7e64c.reference || (__cxx_static_address_2a4459d43b91af90d7f7e64c.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL4____header_global_061c630567ba6d77; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:301
export const W_HITTECHWALL2____header_global_e09f10907051e8de = ((((((362) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_00ea734fd533505f502578e1() {
  return __cxx_static_address_00ea734fd533505f502578e1.reference || (__cxx_static_address_00ea734fd533505f502578e1.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL2____header_global_e09f10907051e8de; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:302
export const W_HITTECHWALL1____header_global_60d83f67d36f3d76 = ((((((363) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8c6cc87e86cac9632f40ccf4() {
  return __cxx_static_address_8c6cc87e86cac9632f40ccf4.reference || (__cxx_static_address_8c6cc87e86cac9632f40ccf4.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL1____header_global_60d83f67d36f3d76; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:303
export const MASKWALL10____header_global_d05b40c005106a8a = ((((((387) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aab9409a29995155b59533d1() {
  return __cxx_static_address_aab9409a29995155b59533d1.reference || (__cxx_static_address_aab9409a29995155b59533d1.reference = {
    __cReference: true,
    get value() { return MASKWALL10____header_global_d05b40c005106a8a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:304
export const MASKWALL11____header_global_1491dccc049a5e13 = ((((((391) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_765f11b3cc1f77e7d2bfe8aa() {
  return __cxx_static_address_765f11b3cc1f77e7d2bfe8aa.reference || (__cxx_static_address_765f11b3cc1f77e7d2bfe8aa.reference = {
    __cReference: true,
    get value() { return MASKWALL11____header_global_1491dccc049a5e13; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:305
export const DOORTILE22____header_global_e35552a1cec9de26 = ((((((395) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0eb9f69f0ccdcbf0598ab6f4() {
  return __cxx_static_address_0eb9f69f0ccdcbf0598ab6f4.reference || (__cxx_static_address_0eb9f69f0ccdcbf0598ab6f4.reference = {
    __cReference: true,
    get value() { return DOORTILE22____header_global_e35552a1cec9de26; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:306
export const FANSPRITE____header_global_e079d6e509222fe0 = ((((((407) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_86614ff2594f0a2ec822ab68() {
  return __cxx_static_address_86614ff2594f0a2ec822ab68.reference || (__cxx_static_address_86614ff2594f0a2ec822ab68.reference = {
    __cReference: true,
    get value() { return FANSPRITE____header_global_e079d6e509222fe0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:307
export const FANSPRITEBROKE____header_global_9e2dfadaf2b3f02e = ((((((411) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_30f543784d55ad407c0e768e() {
  return __cxx_static_address_30f543784d55ad407c0e768e.reference || (__cxx_static_address_30f543784d55ad407c0e768e.reference = {
    __cReference: true,
    get value() { return FANSPRITEBROKE____header_global_9e2dfadaf2b3f02e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:308
export const FANSHADOW____header_global_80138aa14c2b8165 = ((((((412) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2f9c795b39c67b4f53b1dc91() {
  return __cxx_static_address_2f9c795b39c67b4f53b1dc91.reference || (__cxx_static_address_2f9c795b39c67b4f53b1dc91.reference = {
    __cReference: true,
    get value() { return FANSHADOW____header_global_80138aa14c2b8165; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:309
export const FANSHADOWBROKE____header_global_78bd56ddc6c7855c = ((((((416) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f1ea3167bd15f44831124a8e() {
  return __cxx_static_address_f1ea3167bd15f44831124a8e.reference || (__cxx_static_address_f1ea3167bd15f44831124a8e.reference = {
    __cReference: true,
    get value() { return FANSHADOWBROKE____header_global_78bd56ddc6c7855c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:310
export const DOORTILE18____header_global_58aaac9dc3ffa0e0 = ((((((447) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_50bb1353028c2c9976148563() {
  return __cxx_static_address_50bb1353028c2c9976148563.reference || (__cxx_static_address_50bb1353028c2c9976148563.reference = {
    __cReference: true,
    get value() { return DOORTILE18____header_global_58aaac9dc3ffa0e0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:311
export const DOORTILE19____header_global_9e5e06d5757cde80 = ((((((448) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4273168c2246b31048ffca98() {
  return __cxx_static_address_4273168c2246b31048ffca98.reference || (__cxx_static_address_4273168c2246b31048ffca98.reference = {
    __cReference: true,
    get value() { return DOORTILE19____header_global_9e5e06d5757cde80; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:312
export const DOORTILE20____header_global_bddd9c52b4de7251 = ((((((449) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4b58d6689e537f79ad47f19e() {
  return __cxx_static_address_4b58d6689e537f79ad47f19e.reference || (__cxx_static_address_4b58d6689e537f79ad47f19e.reference = {
    __cReference: true,
    get value() { return DOORTILE20____header_global_bddd9c52b4de7251; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:313
export const VIEWSCREEN2____header_global_22a37fd4486bab59 = ((((((499) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e69d57f9b6fc01f82da2d034() {
  return __cxx_static_address_e69d57f9b6fc01f82da2d034.reference || (__cxx_static_address_e69d57f9b6fc01f82da2d034.reference = {
    __cReference: true,
    get value() { return VIEWSCREEN2____header_global_22a37fd4486bab59; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:314
export const VIEWSCREEN____header_global_10e687dd3affdee4 = ((((((502) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0ad27444002c1dc4ac811baa() {
  return __cxx_static_address_0ad27444002c1dc4ac811baa.reference || (__cxx_static_address_0ad27444002c1dc4ac811baa.reference = {
    __cReference: true,
    get value() { return VIEWSCREEN____header_global_10e687dd3affdee4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:315
export const GLASS____header_global_deb0c1fb3d3d8293 = ((((((503) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f5e681ba382c9ec4ffb44014() {
  return __cxx_static_address_f5e681ba382c9ec4ffb44014.reference || (__cxx_static_address_f5e681ba382c9ec4ffb44014.reference = {
    __cReference: true,
    get value() { return GLASS____header_global_deb0c1fb3d3d8293; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:316
export const GLASS2____header_global_7d048e32770f5d0d = ((((((504) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d737002557c902e661244cd1() {
  return __cxx_static_address_d737002557c902e661244cd1.reference || (__cxx_static_address_d737002557c902e661244cd1.reference = {
    __cReference: true,
    get value() { return GLASS2____header_global_7d048e32770f5d0d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:317
export const STAINGLASS1____header_global_cba06394615606ef = ((((((510) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6b85bfe969eda56202cbc2ca() {
  return __cxx_static_address_6b85bfe969eda56202cbc2ca.reference || (__cxx_static_address_6b85bfe969eda56202cbc2ca.reference = {
    __cReference: true,
    get value() { return STAINGLASS1____header_global_cba06394615606ef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:318
export const MASKWALL5____header_global_57438d2fb4f8edf1 = ((((((514) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0c95de1627d42ae36c26aa0b() {
  return __cxx_static_address_0c95de1627d42ae36c26aa0b.reference || (__cxx_static_address_0c95de1627d42ae36c26aa0b.reference = {
    __cReference: true,
    get value() { return MASKWALL5____header_global_57438d2fb4f8edf1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:319
export const SATELITE____header_global_bbbcea2dceaf7b1a = ((((((516) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_169bd19b03e1d83866e5ad73() {
  return __cxx_static_address_169bd19b03e1d83866e5ad73.reference || (__cxx_static_address_169bd19b03e1d83866e5ad73.reference = {
    __cReference: true,
    get value() { return SATELITE____header_global_bbbcea2dceaf7b1a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:320
export const FUELPOD____header_global_1b6ef0ca08defd8c = ((((((517) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5b88d6e1d5e062e1751423ee() {
  return __cxx_static_address_5b88d6e1d5e062e1751423ee.reference || (__cxx_static_address_5b88d6e1d5e062e1751423ee.reference = {
    __cReference: true,
    get value() { return FUELPOD____header_global_1b6ef0ca08defd8c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:321
export const CRACK1____header_global_fd9c827c8d6d6941 = ((((((546) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1de4e91ba12711b5115b5783() {
  return __cxx_static_address_1de4e91ba12711b5115b5783.reference || (__cxx_static_address_1de4e91ba12711b5115b5783.reference = {
    __cReference: true,
    get value() { return CRACK1____header_global_fd9c827c8d6d6941; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:322
export const CRACK2____header_global_76bdf7f7950d83e4 = ((((((547) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7c8549b126127d9e564f547a() {
  return __cxx_static_address_7c8549b126127d9e564f547a.reference || (__cxx_static_address_7c8549b126127d9e564f547a.reference = {
    __cReference: true,
    get value() { return CRACK2____header_global_76bdf7f7950d83e4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:323
export const CRACK3____header_global_ce3191b40d010c38 = ((((((548) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eaf35704a21262b35e0cbc81() {
  return __cxx_static_address_eaf35704a21262b35e0cbc81.reference || (__cxx_static_address_eaf35704a21262b35e0cbc81.reference = {
    __cReference: true,
    get value() { return CRACK3____header_global_ce3191b40d010c38; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:324
export const CRACK4____header_global_a08e7a53c3ec86e7 = ((((((549) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ef32844d9513c53f243892ab() {
  return __cxx_static_address_ef32844d9513c53f243892ab.reference || (__cxx_static_address_ef32844d9513c53f243892ab.reference = {
    __cReference: true,
    get value() { return CRACK4____header_global_a08e7a53c3ec86e7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:325
export const FOOTPRINTS____header_global_6158f817d8cdfdeb = ((((((550) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_395835fe1bbdcdd8efd9b489() {
  return __cxx_static_address_395835fe1bbdcdd8efd9b489.reference || (__cxx_static_address_395835fe1bbdcdd8efd9b489.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS____header_global_6158f817d8cdfdeb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:326
export const DOMELITE____header_global_11a711fe4016263f = ((((((551) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4bf1d5135f8b9b0c1e1e8dbe() {
  return __cxx_static_address_4bf1d5135f8b9b0c1e1e8dbe.reference || (__cxx_static_address_4bf1d5135f8b9b0c1e1e8dbe.reference = {
    __cReference: true,
    get value() { return DOMELITE____header_global_11a711fe4016263f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:327
export const CAMERAPOLE____header_global_554c71e7fc04f742 = ((((((554) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c8d55c7c83ac525b30b33440() {
  return __cxx_static_address_c8d55c7c83ac525b30b33440.reference || (__cxx_static_address_c8d55c7c83ac525b30b33440.reference = {
    __cReference: true,
    get value() { return CAMERAPOLE____header_global_554c71e7fc04f742; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:328
export const CHAIR1____header_global_ae69d4bf638fcec3 = ((((((556) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6caa25732259db03ca8185be() {
  return __cxx_static_address_6caa25732259db03ca8185be.reference || (__cxx_static_address_6caa25732259db03ca8185be.reference = {
    __cReference: true,
    get value() { return CHAIR1____header_global_ae69d4bf638fcec3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:329
export const CHAIR2____header_global_af21d9f9731e00e3 = ((((((557) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a1e90f60beea8808d4001054() {
  return __cxx_static_address_a1e90f60beea8808d4001054.reference || (__cxx_static_address_a1e90f60beea8808d4001054.reference = {
    __cReference: true,
    get value() { return CHAIR2____header_global_af21d9f9731e00e3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:330
export const BROKENCHAIR____header_global_0a87939fb765a1b3 = ((((((559) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d7aea7b5e11754445934f876() {
  return __cxx_static_address_d7aea7b5e11754445934f876.reference || (__cxx_static_address_d7aea7b5e11754445934f876.reference = {
    __cReference: true,
    get value() { return BROKENCHAIR____header_global_0a87939fb765a1b3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:331
export const MIRROR____header_global_1a7ea4e6614af221 = ((((((560) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bf985d50cd7669ad0079efbf() {
  return __cxx_static_address_bf985d50cd7669ad0079efbf.reference || (__cxx_static_address_bf985d50cd7669ad0079efbf.reference = {
    __cReference: true,
    get value() { return MIRROR____header_global_1a7ea4e6614af221; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:332
export const WATERFOUNTAIN____header_global_d72dee66b9e3c341 = ((((((563) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8b126ffa5700365e27188793() {
  return __cxx_static_address_8b126ffa5700365e27188793.reference || (__cxx_static_address_8b126ffa5700365e27188793.reference = {
    __cReference: true,
    get value() { return WATERFOUNTAIN____header_global_d72dee66b9e3c341; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:333
export const WATERFOUNTAINBROKE____header_global_10322650aa051ba4 = ((((((567) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_99b6f65407a9f98628d62347() {
  return __cxx_static_address_99b6f65407a9f98628d62347.reference || (__cxx_static_address_99b6f65407a9f98628d62347.reference = {
    __cReference: true,
    get value() { return WATERFOUNTAINBROKE____header_global_10322650aa051ba4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:334
export const FEMMAG1____header_global_72eb91ee0cbf5c94 = ((((((568) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_13c4eef383a89475e5625a75() {
  return __cxx_static_address_13c4eef383a89475e5625a75.reference || (__cxx_static_address_13c4eef383a89475e5625a75.reference = {
    __cReference: true,
    get value() { return FEMMAG1____header_global_72eb91ee0cbf5c94; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:335
export const TOILET____header_global_2c91a28b55896ec9 = ((((((569) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_12d54239f29362396cd7bf98() {
  return __cxx_static_address_12d54239f29362396cd7bf98.reference || (__cxx_static_address_12d54239f29362396cd7bf98.reference = {
    __cReference: true,
    get value() { return TOILET____header_global_2c91a28b55896ec9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:336
export const STALL____header_global_53d4d17b7bfba871 = ((((((571) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3ff0ca71cf8c52a2fbb13817() {
  return __cxx_static_address_3ff0ca71cf8c52a2fbb13817.reference || (__cxx_static_address_3ff0ca71cf8c52a2fbb13817.reference = {
    __cReference: true,
    get value() { return STALL____header_global_53d4d17b7bfba871; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:337
export const STALLBROKE____header_global_54fa8d3ec9973dcd = ((((((573) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c2d364d54b4a203af1bf3285() {
  return __cxx_static_address_c2d364d54b4a203af1bf3285.reference || (__cxx_static_address_c2d364d54b4a203af1bf3285.reference = {
    __cReference: true,
    get value() { return STALLBROKE____header_global_54fa8d3ec9973dcd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:338
export const FEMMAG2____header_global_8e45da487f38476a = ((((((577) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_80ade8f509750a1b294944b8() {
  return __cxx_static_address_80ade8f509750a1b294944b8.reference || (__cxx_static_address_80ade8f509750a1b294944b8.reference = {
    __cReference: true,
    get value() { return FEMMAG2____header_global_8e45da487f38476a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:339
export const REACTOR2____header_global_790be4d4dd47aadb = ((((((578) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cb475d9da7b4830864e09aee() {
  return __cxx_static_address_cb475d9da7b4830864e09aee.reference || (__cxx_static_address_cb475d9da7b4830864e09aee.reference = {
    __cReference: true,
    get value() { return REACTOR2____header_global_790be4d4dd47aadb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:340
export const REACTOR2BURNT____header_global_72066d338edad10b = ((((((579) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bb81d9fb43d7fdd2b050d285() {
  return __cxx_static_address_bb81d9fb43d7fdd2b050d285.reference || (__cxx_static_address_bb81d9fb43d7fdd2b050d285.reference = {
    __cReference: true,
    get value() { return REACTOR2BURNT____header_global_72066d338edad10b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:341
export const REACTOR2SPARK____header_global_e1f51912eebe9340 = ((((((580) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a838bd414f90fe3961bf3413() {
  return __cxx_static_address_a838bd414f90fe3961bf3413.reference || (__cxx_static_address_a838bd414f90fe3961bf3413.reference = {
    __cReference: true,
    get value() { return REACTOR2SPARK____header_global_e1f51912eebe9340; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:342
export const GRATE1____header_global_be4ce4c70dc3a22f = ((((((595) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8b82db3a74c0dacba3210366() {
  return __cxx_static_address_8b82db3a74c0dacba3210366.reference || (__cxx_static_address_8b82db3a74c0dacba3210366.reference = {
    __cReference: true,
    get value() { return GRATE1____header_global_be4ce4c70dc3a22f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:343
export const BGRATE1____header_global_dc90c9f61257d60a = ((((((596) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cb1e872797ebadd430b8b8c9() {
  return __cxx_static_address_cb1e872797ebadd430b8b8c9.reference || (__cxx_static_address_cb1e872797ebadd430b8b8c9.reference = {
    __cReference: true,
    get value() { return BGRATE1____header_global_dc90c9f61257d60a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:344
export const SOLARPANNEL____header_global_95c76216de70b467 = ((((((602) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7dfa13c9301f22401df624ee() {
  return __cxx_static_address_7dfa13c9301f22401df624ee.reference || (__cxx_static_address_7dfa13c9301f22401df624ee.reference = {
    __cReference: true,
    get value() { return SOLARPANNEL____header_global_95c76216de70b467; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:345
export const NAKED1____header_global_88e23fc4c5c91ded = ((((((603) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8b80bbd80b2842395fa10dcc() {
  return __cxx_static_address_8b80bbd80b2842395fa10dcc.reference || (__cxx_static_address_8b80bbd80b2842395fa10dcc.reference = {
    __cReference: true,
    get value() { return NAKED1____header_global_88e23fc4c5c91ded; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:346
export const ANTENNA____header_global_123c5c2d230652f7 = ((((((607) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_98e7c207882415a6c50f58e5() {
  return __cxx_static_address_98e7c207882415a6c50f58e5.reference || (__cxx_static_address_98e7c207882415a6c50f58e5.reference = {
    __cReference: true,
    get value() { return ANTENNA____header_global_123c5c2d230652f7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:347
export const MASKWALL12____header_global_b2bc833b0b557b38 = ((((((609) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_651a1a9d3b939560a81acc9a() {
  return __cxx_static_address_651a1a9d3b939560a81acc9a.reference || (__cxx_static_address_651a1a9d3b939560a81acc9a.reference = {
    __cReference: true,
    get value() { return MASKWALL12____header_global_b2bc833b0b557b38; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:348
export const TOILETBROKE____header_global_beb8912dcf79432d = ((((((615) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c9fd1bb30798c0b4f68ead96() {
  return __cxx_static_address_c9fd1bb30798c0b4f68ead96.reference || (__cxx_static_address_c9fd1bb30798c0b4f68ead96.reference = {
    __cReference: true,
    get value() { return TOILETBROKE____header_global_beb8912dcf79432d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:349
export const PIPE2____header_global_a500bbc1035208de = ((((((616) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7dfe06d0c90063e0acadb209() {
  return __cxx_static_address_7dfe06d0c90063e0acadb209.reference || (__cxx_static_address_7dfe06d0c90063e0acadb209.reference = {
    __cReference: true,
    get value() { return PIPE2____header_global_a500bbc1035208de; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:350
export const PIPE1B____header_global_988397ba50e7ebab = ((((((617) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_758a26492139250fd18b59f4() {
  return __cxx_static_address_758a26492139250fd18b59f4.reference || (__cxx_static_address_758a26492139250fd18b59f4.reference = {
    __cReference: true,
    get value() { return PIPE1B____header_global_988397ba50e7ebab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:351
export const PIPE3____header_global_7b16d62aca970eb0 = ((((((618) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_04424df316459e2d08353d36() {
  return __cxx_static_address_04424df316459e2d08353d36.reference || (__cxx_static_address_04424df316459e2d08353d36.reference = {
    __cReference: true,
    get value() { return PIPE3____header_global_7b16d62aca970eb0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:352
export const PIPE1____header_global_c8eca818683bf491 = ((((((619) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8738200fde44aeed620d65d0() {
  return __cxx_static_address_8738200fde44aeed620d65d0.reference || (__cxx_static_address_8738200fde44aeed620d65d0.reference = {
    __cReference: true,
    get value() { return PIPE1____header_global_c8eca818683bf491; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:353
export const CAMERA1____header_global_38a70c83f8f6e962 = ((((((621) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6365c10a9cd70679f8fb6efc() {
  return __cxx_static_address_6365c10a9cd70679f8fb6efc.reference || (__cxx_static_address_6365c10a9cd70679f8fb6efc.reference = {
    __cReference: true,
    get value() { return CAMERA1____header_global_38a70c83f8f6e962; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:354
export const PIPE2B____header_global_da776151fd01f883 = ((((((633) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dcb533b647de5723be55fdbe() {
  return __cxx_static_address_dcb533b647de5723be55fdbe.reference || (__cxx_static_address_dcb533b647de5723be55fdbe.reference = {
    __cReference: true,
    get value() { return PIPE2B____header_global_da776151fd01f883; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:355
export const BOLT1____header_global_f9e84f1029aa7b4a = ((((((634) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eeb348e70b4e9f1154b3f1ae() {
  return __cxx_static_address_eeb348e70b4e9f1154b3f1ae.reference || (__cxx_static_address_eeb348e70b4e9f1154b3f1ae.reference = {
    __cReference: true,
    get value() { return BOLT1____header_global_f9e84f1029aa7b4a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:356
export const W_NUMBERS____header_global_b194f3d06d8b10ae = ((((((640) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7f67b492b08741096865aec5() {
  return __cxx_static_address_7f67b492b08741096865aec5.reference || (__cxx_static_address_7f67b492b08741096865aec5.reference = {
    __cReference: true,
    get value() { return W_NUMBERS____header_global_b194f3d06d8b10ae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:357
export const WATERDRIP____header_global_78e9ce36815eec21 = ((((((660) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aa86c5bc15ad65ea56bdaab1() {
  return __cxx_static_address_aa86c5bc15ad65ea56bdaab1.reference || (__cxx_static_address_aa86c5bc15ad65ea56bdaab1.reference = {
    __cReference: true,
    get value() { return WATERDRIP____header_global_78e9ce36815eec21; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:358
export const WATERBUBBLE____header_global_abb185861eb782fe = ((((((661) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bcbe0a98d6a3abcf602b5dbf() {
  return __cxx_static_address_bcbe0a98d6a3abcf602b5dbf.reference || (__cxx_static_address_bcbe0a98d6a3abcf602b5dbf.reference = {
    __cReference: true,
    get value() { return WATERBUBBLE____header_global_abb185861eb782fe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:359
export const WATERBUBBLEMAKER____header_global_bcc077cabd022dfd = ((((((662) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e143470d90e9192540f0c17e() {
  return __cxx_static_address_e143470d90e9192540f0c17e.reference || (__cxx_static_address_e143470d90e9192540f0c17e.reference = {
    __cReference: true,
    get value() { return WATERBUBBLEMAKER____header_global_bcc077cabd022dfd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:360
export const W_FORCEFIELD____header_global_f1025e5170859876 = ((((((663) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3140263044ac6d4147a773a2() {
  return __cxx_static_address_3140263044ac6d4147a773a2.reference || (__cxx_static_address_3140263044ac6d4147a773a2.reference = {
    __cReference: true,
    get value() { return W_FORCEFIELD____header_global_f1025e5170859876; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:361
export const VACUUM____header_global_403bafaa200bed0b = ((((((669) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_11542a4dc6a3735b1850bce4() {
  return __cxx_static_address_11542a4dc6a3735b1850bce4.reference || (__cxx_static_address_11542a4dc6a3735b1850bce4.reference = {
    __cReference: true,
    get value() { return VACUUM____header_global_403bafaa200bed0b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:362
export const FOOTPRINTS2____header_global_bf58cdeba0ac0bc4 = ((((((672) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fee1b7a4a851a859248f7edf() {
  return __cxx_static_address_fee1b7a4a851a859248f7edf.reference || (__cxx_static_address_fee1b7a4a851a859248f7edf.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS2____header_global_bf58cdeba0ac0bc4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:363
export const FOOTPRINTS3____header_global_3100655feb20878f = ((((((673) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_49858b1c52ac0f8b9a8615c6() {
  return __cxx_static_address_49858b1c52ac0f8b9a8615c6.reference || (__cxx_static_address_49858b1c52ac0f8b9a8615c6.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS3____header_global_3100655feb20878f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:364
export const FOOTPRINTS4____header_global_3a3ab0f37d53164d = ((((((674) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_194de46ca39e45e0ec1987c2() {
  return __cxx_static_address_194de46ca39e45e0ec1987c2.reference || (__cxx_static_address_194de46ca39e45e0ec1987c2.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS4____header_global_3a3ab0f37d53164d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:365
export const EGG____header_global_ce47cd19cd73fbbf = ((((((675) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f9d6a347e3c630bd78ecd078() {
  return __cxx_static_address_f9d6a347e3c630bd78ecd078.reference || (__cxx_static_address_f9d6a347e3c630bd78ecd078.reference = {
    __cReference: true,
    get value() { return EGG____header_global_ce47cd19cd73fbbf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:366
export const SCALE____header_global_cacd50f4c9cad1b5 = ((((((678) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3ea09667fc586543d2c71099() {
  return __cxx_static_address_3ea09667fc586543d2c71099.reference || (__cxx_static_address_3ea09667fc586543d2c71099.reference = {
    __cReference: true,
    get value() { return SCALE____header_global_cacd50f4c9cad1b5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:367
export const CHAIR3____header_global_6152b64edde87fef = ((((((680) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_75ccecdb2d01aea46a454a49() {
  return __cxx_static_address_75ccecdb2d01aea46a454a49.reference || (__cxx_static_address_75ccecdb2d01aea46a454a49.reference = {
    __cReference: true,
    get value() { return CHAIR3____header_global_6152b64edde87fef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:368
export const CAMERALIGHT____header_global_168e17ac0ac6571b = ((((((685) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3d44101f486f46e82088daa2() {
  return __cxx_static_address_3d44101f486f46e82088daa2.reference || (__cxx_static_address_3d44101f486f46e82088daa2.reference = {
    __cReference: true,
    get value() { return CAMERALIGHT____header_global_168e17ac0ac6571b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:369
export const MOVIECAMERA____header_global_1c10b8abad379e1d = ((((((686) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_517da72a1649845992da43e2() {
  return __cxx_static_address_517da72a1649845992da43e2.reference || (__cxx_static_address_517da72a1649845992da43e2.reference = {
    __cReference: true,
    get value() { return MOVIECAMERA____header_global_1c10b8abad379e1d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:370
export const IVUNIT____header_global_a744d5150300cc62 = ((((((689) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1ef012b460f91da2d9830903() {
  return __cxx_static_address_1ef012b460f91da2d9830903.reference || (__cxx_static_address_1ef012b460f91da2d9830903.reference = {
    __cReference: true,
    get value() { return IVUNIT____header_global_a744d5150300cc62; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:371
export const POT1____header_global_8099e746600e4e5e = ((((((694) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_caa4a5423b15e821c75ceb23() {
  return __cxx_static_address_caa4a5423b15e821c75ceb23.reference || (__cxx_static_address_caa4a5423b15e821c75ceb23.reference = {
    __cReference: true,
    get value() { return POT1____header_global_8099e746600e4e5e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:372
export const POT2____header_global_7628c19a78799c03 = ((((((695) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_55761e48f6e99fa909957538() {
  return __cxx_static_address_55761e48f6e99fa909957538.reference || (__cxx_static_address_55761e48f6e99fa909957538.reference = {
    __cReference: true,
    get value() { return POT2____header_global_7628c19a78799c03; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:373
export const POT3____header_global_61a8894defa6260f = ((((((697) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7cc533fe4ace7a9b155a02ec() {
  return __cxx_static_address_7cc533fe4ace7a9b155a02ec.reference || (__cxx_static_address_7cc533fe4ace7a9b155a02ec.reference = {
    __cReference: true,
    get value() { return POT3____header_global_61a8894defa6260f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:374
export const PIPE3B____header_global_e55ea95a70b1c972 = ((((((700) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c789bd2a4e39dd8cf1104867() {
  return __cxx_static_address_c789bd2a4e39dd8cf1104867.reference || (__cxx_static_address_c789bd2a4e39dd8cf1104867.reference = {
    __cReference: true,
    get value() { return PIPE3B____header_global_e55ea95a70b1c972; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:375
export const WALLLIGHT3____header_global_dd2418e206ec27dc = ((((((701) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dc6804581b8b6f891749a430() {
  return __cxx_static_address_dc6804581b8b6f891749a430.reference || (__cxx_static_address_dc6804581b8b6f891749a430.reference = {
    __cReference: true,
    get value() { return WALLLIGHT3____header_global_dd2418e206ec27dc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:376
export const WALLLIGHTBUST3____header_global_dd1fbc6954890895 = ((((((702) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_55db53e1daa4f1dc3c5b4345() {
  return __cxx_static_address_55db53e1daa4f1dc3c5b4345.reference || (__cxx_static_address_55db53e1daa4f1dc3c5b4345.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST3____header_global_dd1fbc6954890895; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:377
export const WALLLIGHT1____header_global_2aaf9ed6197ed1bb = ((((((703) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_173510c9e012df0a5a6d8f72() {
  return __cxx_static_address_173510c9e012df0a5a6d8f72.reference || (__cxx_static_address_173510c9e012df0a5a6d8f72.reference = {
    __cReference: true,
    get value() { return WALLLIGHT1____header_global_2aaf9ed6197ed1bb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:378
export const WALLLIGHTBUST1____header_global_7241f40833e30f5a = ((((((704) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f94d2bdcfe5f88abe7bb91f3() {
  return __cxx_static_address_f94d2bdcfe5f88abe7bb91f3.reference || (__cxx_static_address_f94d2bdcfe5f88abe7bb91f3.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST1____header_global_7241f40833e30f5a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:379
export const WALLLIGHT2____header_global_a7df74e30e3317e6 = ((((((705) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_458e66ec09d15bd35da6ff87() {
  return __cxx_static_address_458e66ec09d15bd35da6ff87.reference || (__cxx_static_address_458e66ec09d15bd35da6ff87.reference = {
    __cReference: true,
    get value() { return WALLLIGHT2____header_global_a7df74e30e3317e6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:380
export const WALLLIGHTBUST2____header_global_adc723dfdec73a53 = ((((((706) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c4c3823c2eccbba74d95a50b() {
  return __cxx_static_address_c4c3823c2eccbba74d95a50b.reference || (__cxx_static_address_c4c3823c2eccbba74d95a50b.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST2____header_global_adc723dfdec73a53; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:381
export const LIGHTSWITCH2____header_global_9fa5a6192f997560 = ((((((712) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e14d2d0b656d57ee868e86ab() {
  return __cxx_static_address_e14d2d0b656d57ee868e86ab.reference || (__cxx_static_address_e14d2d0b656d57ee868e86ab.reference = {
    __cReference: true,
    get value() { return LIGHTSWITCH2____header_global_9fa5a6192f997560; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:382
export const WAITTOBESEATED____header_global_8c472f62dd598233 = ((((((716) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e000c4d96aa7743810fef7dc() {
  return __cxx_static_address_e000c4d96aa7743810fef7dc.reference || (__cxx_static_address_e000c4d96aa7743810fef7dc.reference = {
    __cReference: true,
    get value() { return WAITTOBESEATED____header_global_8c472f62dd598233; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:383
export const DOORTILE14____header_global_e9f09678699cf711 = ((((((717) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f942e72700b33d2ba0eab274() {
  return __cxx_static_address_f942e72700b33d2ba0eab274.reference || (__cxx_static_address_f942e72700b33d2ba0eab274.reference = {
    __cReference: true,
    get value() { return DOORTILE14____header_global_e9f09678699cf711; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:384
export const STATUE____header_global_19e5f17ba8d51b86 = ((((((753) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3457a42136d7f66a61f941e2() {
  return __cxx_static_address_3457a42136d7f66a61f941e2.reference || (__cxx_static_address_3457a42136d7f66a61f941e2.reference = {
    __cReference: true,
    get value() { return STATUE____header_global_19e5f17ba8d51b86; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:385
export const MIKE____header_global_bf273754b1947ebe = ((((((762) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_018cf28befa1ba3dbb075a6e() {
  return __cxx_static_address_018cf28befa1ba3dbb075a6e.reference || (__cxx_static_address_018cf28befa1ba3dbb075a6e.reference = {
    __cReference: true,
    get value() { return MIKE____header_global_bf273754b1947ebe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:386
export const VASE____header_global_f418a28d304eb918 = ((((((765) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c2cfaff769c3bf119447dd79() {
  return __cxx_static_address_c2cfaff769c3bf119447dd79.reference || (__cxx_static_address_c2cfaff769c3bf119447dd79.reference = {
    __cReference: true,
    get value() { return VASE____header_global_f418a28d304eb918; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:387
export const SUSHIPLATE1____header_global_93990f3e17add75a = ((((((768) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d9b50d9562cbfd45de04958b() {
  return __cxx_static_address_d9b50d9562cbfd45de04958b.reference || (__cxx_static_address_d9b50d9562cbfd45de04958b.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE1____header_global_93990f3e17add75a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:388
export const SUSHIPLATE2____header_global_907d715547288bf9 = ((((((769) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_17c63488fe0a5ccd64adb336() {
  return __cxx_static_address_17c63488fe0a5ccd64adb336.reference || (__cxx_static_address_17c63488fe0a5ccd64adb336.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE2____header_global_907d715547288bf9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:389
export const SUSHIPLATE3____header_global_0d5cadafe5810c76 = ((((((774) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_70cd82c41be45f78d610f64d() {
  return __cxx_static_address_70cd82c41be45f78d610f64d.reference || (__cxx_static_address_70cd82c41be45f78d610f64d.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE3____header_global_0d5cadafe5810c76; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:390
export const SUSHIPLATE4____header_global_b5ce64194e807b8c = ((((((779) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d97d1625e97aa4dd6cff6edf() {
  return __cxx_static_address_d97d1625e97aa4dd6cff6edf.reference || (__cxx_static_address_d97d1625e97aa4dd6cff6edf.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE4____header_global_b5ce64194e807b8c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:391
export const DOORTILE16____header_global_d9c5d8e7952a1d42 = ((((((781) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_604c817b57b7bd021358aa6e() {
  return __cxx_static_address_604c817b57b7bd021358aa6e.reference || (__cxx_static_address_604c817b57b7bd021358aa6e.reference = {
    __cReference: true,
    get value() { return DOORTILE16____header_global_d9c5d8e7952a1d42; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:392
export const SUSHIPLATE5____header_global_5dcf300664acecd7 = ((((((792) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_88483a000a5452dd1d6c882c() {
  return __cxx_static_address_88483a000a5452dd1d6c882c.reference || (__cxx_static_address_88483a000a5452dd1d6c882c.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE5____header_global_5dcf300664acecd7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:393
export const OJ____header_global_5f36888af7611cce = ((((((806) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cdd7bdf5c655ee7d0e065e3d() {
  return __cxx_static_address_cdd7bdf5c655ee7d0e065e3d.reference || (__cxx_static_address_cdd7bdf5c655ee7d0e065e3d.reference = {
    __cReference: true,
    get value() { return OJ____header_global_5f36888af7611cce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:394
export const MASKWALL13____header_global_a527ca77a3d446b5 = ((((((830) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_346ff8191aa3473a5a167865() {
  return __cxx_static_address_346ff8191aa3473a5a167865.reference || (__cxx_static_address_346ff8191aa3473a5a167865.reference = {
    __cReference: true,
    get value() { return MASKWALL13____header_global_a527ca77a3d446b5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:395
export const HURTRAIL____header_global_7489d6bb33ec2243 = ((((((859) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_62db4f45dcb11784f6b99ce1() {
  return __cxx_static_address_62db4f45dcb11784f6b99ce1.reference || (__cxx_static_address_62db4f45dcb11784f6b99ce1.reference = {
    __cReference: true,
    get value() { return HURTRAIL____header_global_7489d6bb33ec2243; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:396
export const POWERSWITCH1____header_global_6e29b994a5da4818 = ((((((860) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e23462d4edc46089d750001f() {
  return __cxx_static_address_e23462d4edc46089d750001f.reference || (__cxx_static_address_e23462d4edc46089d750001f.reference = {
    __cReference: true,
    get value() { return POWERSWITCH1____header_global_6e29b994a5da4818; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:397
export const LOCKSWITCH1____header_global_f28e100f1175eb0f = ((((((862) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e1c0775a4556ecf5cc9d1254() {
  return __cxx_static_address_e1c0775a4556ecf5cc9d1254.reference || (__cxx_static_address_e1c0775a4556ecf5cc9d1254.reference = {
    __cReference: true,
    get value() { return LOCKSWITCH1____header_global_f28e100f1175eb0f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:398
export const POWERSWITCH2____header_global_14e985dc8d0b9e21 = ((((((864) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_91803d8c45be522988c32139() {
  return __cxx_static_address_91803d8c45be522988c32139.reference || (__cxx_static_address_91803d8c45be522988c32139.reference = {
    __cReference: true,
    get value() { return POWERSWITCH2____header_global_14e985dc8d0b9e21; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:399
export const ATM____header_global_b1fd07aea4200160 = ((((((867) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b7e90eeb63454150ce142210() {
  return __cxx_static_address_b7e90eeb63454150ce142210.reference || (__cxx_static_address_b7e90eeb63454150ce142210.reference = {
    __cReference: true,
    get value() { return ATM____header_global_b1fd07aea4200160; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:400
export const STATUEFLASH____header_global_a78e5754558a1df9 = ((((((869) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_57243987f6d7340254dd6182() {
  return __cxx_static_address_57243987f6d7340254dd6182.reference || (__cxx_static_address_57243987f6d7340254dd6182.reference = {
    __cReference: true,
    get value() { return STATUEFLASH____header_global_a78e5754558a1df9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:401
export const ATMBROKE____header_global_3a1d580a55de2f78 = ((((((888) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_12604f3895edd46b91fa7da0() {
  return __cxx_static_address_12604f3895edd46b91fa7da0.reference || (__cxx_static_address_12604f3895edd46b91fa7da0.reference = {
    __cReference: true,
    get value() { return ATMBROKE____header_global_3a1d580a55de2f78; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:402
export const STRIPEBALL____header_global_7a88a7f1653756c8 = ((((((901) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7b7c713d0e21644d285997bf() {
  return __cxx_static_address_7b7c713d0e21644d285997bf.reference || (__cxx_static_address_7b7c713d0e21644d285997bf.reference = {
    __cReference: true,
    get value() { return STRIPEBALL____header_global_7a88a7f1653756c8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:403
export const QUEBALL____header_global_82f3cabe81020c5a = ((((((902) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_704d108e76370196cd942c0d() {
  return __cxx_static_address_704d108e76370196cd942c0d.reference || (__cxx_static_address_704d108e76370196cd942c0d.reference = {
    __cReference: true,
    get value() { return QUEBALL____header_global_82f3cabe81020c5a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:404
export const POCKET____header_global_8e3eb9987204f67d = ((((((903) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4078ef374ec724eb702e8e9a() {
  return __cxx_static_address_4078ef374ec724eb702e8e9a.reference || (__cxx_static_address_4078ef374ec724eb702e8e9a.reference = {
    __cReference: true,
    get value() { return POCKET____header_global_8e3eb9987204f67d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:405
export const WOODENHORSE____header_global_9ff571b5a31ccaca = ((((((904) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_64b749386c463e37defee724() {
  return __cxx_static_address_64b749386c463e37defee724.reference || (__cxx_static_address_64b749386c463e37defee724.reference = {
    __cReference: true,
    get value() { return WOODENHORSE____header_global_9ff571b5a31ccaca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:406
export const TREE1____header_global_95cc06f0dd526466 = ((((((908) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1feeeb196014ba732b974322() {
  return __cxx_static_address_1feeeb196014ba732b974322.reference || (__cxx_static_address_1feeeb196014ba732b974322.reference = {
    __cReference: true,
    get value() { return TREE1____header_global_95cc06f0dd526466; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:407
export const TREE2____header_global_8b5cbb73b01cec04 = ((((((910) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f941274d3088b24f3e474245() {
  return __cxx_static_address_f941274d3088b24f3e474245.reference || (__cxx_static_address_f941274d3088b24f3e474245.reference = {
    __cReference: true,
    get value() { return TREE2____header_global_8b5cbb73b01cec04; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:408
export const CACTUS____header_global_f8c0179469a11d83 = ((((((911) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8b157cd11a79034dab4c3012() {
  return __cxx_static_address_8b157cd11a79034dab4c3012.reference || (__cxx_static_address_8b157cd11a79034dab4c3012.reference = {
    __cReference: true,
    get value() { return CACTUS____header_global_f8c0179469a11d83; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:409
export const MASKWALL2____header_global_5d56b01ee120fb4e = ((((((913) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_65052e8d4e650c4217725c7d() {
  return __cxx_static_address_65052e8d4e650c4217725c7d.reference || (__cxx_static_address_65052e8d4e650c4217725c7d.reference = {
    __cReference: true,
    get value() { return MASKWALL2____header_global_5d56b01ee120fb4e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:410
export const MASKWALL3____header_global_ee432ea6d63f6780 = ((((((914) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b6593e1fc096865cbac94f46() {
  return __cxx_static_address_b6593e1fc096865cbac94f46.reference || (__cxx_static_address_b6593e1fc096865cbac94f46.reference = {
    __cReference: true,
    get value() { return MASKWALL3____header_global_ee432ea6d63f6780; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:411
export const MASKWALL4____header_global_e480b447909b09f3 = ((((((915) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d00a280b5f25a463cced387c() {
  return __cxx_static_address_d00a280b5f25a463cced387c.reference || (__cxx_static_address_d00a280b5f25a463cced387c.reference = {
    __cReference: true,
    get value() { return MASKWALL4____header_global_e480b447909b09f3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:412
export const FIREEXT____header_global_95a0ff73e48c22ed = ((((((916) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d225745fd99e0edb78bbf376() {
  return __cxx_static_address_d225745fd99e0edb78bbf376.reference || (__cxx_static_address_d225745fd99e0edb78bbf376.reference = {
    __cReference: true,
    get value() { return FIREEXT____header_global_95a0ff73e48c22ed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:413
export const TOILETWATER____header_global_91109160f17a9aa5 = ((((((921) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_39ef4c7a1a44021a4200c0f2() {
  return __cxx_static_address_39ef4c7a1a44021a4200c0f2.reference || (__cxx_static_address_39ef4c7a1a44021a4200c0f2.reference = {
    __cReference: true,
    get value() { return TOILETWATER____header_global_91109160f17a9aa5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:414
export const NEON1____header_global_7877bb0637672135 = ((((((925) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cbdbe64b24a8486cffd483f1() {
  return __cxx_static_address_cbdbe64b24a8486cffd483f1.reference || (__cxx_static_address_cbdbe64b24a8486cffd483f1.reference = {
    __cReference: true,
    get value() { return NEON1____header_global_7877bb0637672135; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:415
export const NEON2____header_global_d1a0182403e76ecb = ((((((926) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cd3f6fc1c7c7236e2468bee6() {
  return __cxx_static_address_cd3f6fc1c7c7236e2468bee6.reference || (__cxx_static_address_cd3f6fc1c7c7236e2468bee6.reference = {
    __cReference: true,
    get value() { return NEON2____header_global_d1a0182403e76ecb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:416
export const CACTUSBROKE____header_global_1e1d5aedeae62409 = ((((((939) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0c3115ac0884521364a79712() {
  return __cxx_static_address_0c3115ac0884521364a79712.reference || (__cxx_static_address_0c3115ac0884521364a79712.reference = {
    __cReference: true,
    get value() { return CACTUSBROKE____header_global_1e1d5aedeae62409; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:417
export const BOUNCEMINE____header_global_0c2e99f1a52f89c4 = ((((((940) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2960436a966c7e8b302dd1d7() {
  return __cxx_static_address_2960436a966c7e8b302dd1d7.reference || (__cxx_static_address_2960436a966c7e8b302dd1d7.reference = {
    __cReference: true,
    get value() { return BOUNCEMINE____header_global_0c2e99f1a52f89c4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:418
export const BROKEFIREHYDRENT____header_global_8ab83f14b460d149 = ((((((950) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_74472c4fadb48acde96f4037() {
  return __cxx_static_address_74472c4fadb48acde96f4037.reference || (__cxx_static_address_74472c4fadb48acde96f4037.reference = {
    __cReference: true,
    get value() { return BROKEFIREHYDRENT____header_global_8ab83f14b460d149; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:419
export const BOX____header_global_7bf4a4433be0d4cd = ((((((951) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6dd6ee3f2f2240ac5e654b0a() {
  return __cxx_static_address_6dd6ee3f2f2240ac5e654b0a.reference || (__cxx_static_address_6dd6ee3f2f2240ac5e654b0a.reference = {
    __cReference: true,
    get value() { return BOX____header_global_7bf4a4433be0d4cd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:420
export const BULLETHOLE____header_global_f68dd2efac845478 = ((((((952) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5c7e4f1707abf29667e0b4f6() {
  return __cxx_static_address_5c7e4f1707abf29667e0b4f6.reference || (__cxx_static_address_5c7e4f1707abf29667e0b4f6.reference = {
    __cReference: true,
    get value() { return BULLETHOLE____header_global_f68dd2efac845478; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:421
export const BOTTLE1____header_global_8c3a79675c1316bf = ((((((954) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2a3a1257adace80a56749bd7() {
  return __cxx_static_address_2a3a1257adace80a56749bd7.reference || (__cxx_static_address_2a3a1257adace80a56749bd7.reference = {
    __cReference: true,
    get value() { return BOTTLE1____header_global_8c3a79675c1316bf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:422
export const BOTTLE2____header_global_320b86e581d721e7 = ((((((955) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c3da570ef3893c23b7c3ce7b() {
  return __cxx_static_address_c3da570ef3893c23b7c3ce7b.reference || (__cxx_static_address_c3da570ef3893c23b7c3ce7b.reference = {
    __cReference: true,
    get value() { return BOTTLE2____header_global_320b86e581d721e7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:423
export const BOTTLE3____header_global_ccd0a8f72e68460f = ((((((956) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a0eb3cfca9f9d483aa1e07f4() {
  return __cxx_static_address_a0eb3cfca9f9d483aa1e07f4.reference || (__cxx_static_address_a0eb3cfca9f9d483aa1e07f4.reference = {
    __cReference: true,
    get value() { return BOTTLE3____header_global_ccd0a8f72e68460f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:424
export const BOTTLE4____header_global_f9f14b008ca195e4 = ((((((957) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4baf94924f2c0046796d112d() {
  return __cxx_static_address_4baf94924f2c0046796d112d.reference || (__cxx_static_address_4baf94924f2c0046796d112d.reference = {
    __cReference: true,
    get value() { return BOTTLE4____header_global_f9f14b008ca195e4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:425
export const FEMPIC5____header_global_d9edcf36bd5fdb3b = ((((((963) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cfd602f4e156a7738c4f6f92() {
  return __cxx_static_address_cfd602f4e156a7738c4f6f92.reference || (__cxx_static_address_cfd602f4e156a7738c4f6f92.reference = {
    __cReference: true,
    get value() { return FEMPIC5____header_global_d9edcf36bd5fdb3b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:426
export const FEMPIC6____header_global_a0a2f7c6439073b8 = ((((((964) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aec343cdd3469658810cb743() {
  return __cxx_static_address_aec343cdd3469658810cb743.reference || (__cxx_static_address_aec343cdd3469658810cb743.reference = {
    __cReference: true,
    get value() { return FEMPIC6____header_global_a0a2f7c6439073b8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:427
export const FEMPIC7____header_global_7dda5cfd4ee33345 = ((((((965) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_11cd02526945ba50bc3e3815() {
  return __cxx_static_address_11cd02526945ba50bc3e3815.reference || (__cxx_static_address_11cd02526945ba50bc3e3815.reference = {
    __cReference: true,
    get value() { return FEMPIC7____header_global_7dda5cfd4ee33345; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:428
export const HYDROPLANT____header_global_ad9349ea15f43fed = ((((((969) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bf9e884d035c3ed6fe91553d() {
  return __cxx_static_address_bf9e884d035c3ed6fe91553d.reference || (__cxx_static_address_bf9e884d035c3ed6fe91553d.reference = {
    __cReference: true,
    get value() { return HYDROPLANT____header_global_ad9349ea15f43fed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:429
export const OCEANSPRITE1____header_global_5df83352069362c6 = ((((((971) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a15043371b79c4f90a2fefc1() {
  return __cxx_static_address_a15043371b79c4f90a2fefc1.reference || (__cxx_static_address_a15043371b79c4f90a2fefc1.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE1____header_global_5df83352069362c6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:430
export const OCEANSPRITE2____header_global_ef2fc02fc2851a64 = ((((((972) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_874848a9f2409c32e1204104() {
  return __cxx_static_address_874848a9f2409c32e1204104.reference || (__cxx_static_address_874848a9f2409c32e1204104.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE2____header_global_ef2fc02fc2851a64; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:431
export const OCEANSPRITE3____header_global_0ed36ddd96758d76 = ((((((973) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e4170b5ccf77408debd9d06c() {
  return __cxx_static_address_e4170b5ccf77408debd9d06c.reference || (__cxx_static_address_e4170b5ccf77408debd9d06c.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE3____header_global_0ed36ddd96758d76; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:432
export const OCEANSPRITE4____header_global_7c6517b56b5d8edc = ((((((974) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ea3a26799afd086279e50104() {
  return __cxx_static_address_ea3a26799afd086279e50104.reference || (__cxx_static_address_ea3a26799afd086279e50104.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE4____header_global_7c6517b56b5d8edc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:433
export const OCEANSPRITE5____header_global_4ce45b55c9a54690 = ((((((975) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0adaeafffe96e5e744f811b3() {
  return __cxx_static_address_0adaeafffe96e5e744f811b3.reference || (__cxx_static_address_0adaeafffe96e5e744f811b3.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE5____header_global_4ce45b55c9a54690; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:434
export const GENERICPOLE____header_global_43dc2fa2045fdd5a = ((((((977) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f2b0e99a6c436f300aefd6f9() {
  return __cxx_static_address_f2b0e99a6c436f300aefd6f9.reference || (__cxx_static_address_f2b0e99a6c436f300aefd6f9.reference = {
    __cReference: true,
    get value() { return GENERICPOLE____header_global_43dc2fa2045fdd5a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:435
export const CONE____header_global_c4ef5780b871e849 = ((((((978) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eaab2c3f85fdee4654227976() {
  return __cxx_static_address_eaab2c3f85fdee4654227976.reference || (__cxx_static_address_eaab2c3f85fdee4654227976.reference = {
    __cReference: true,
    get value() { return CONE____header_global_c4ef5780b871e849; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:436
export const HANGLIGHT____header_global_8f30786e7b970091 = ((((((979) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_021cde058f856512f428587e() {
  return __cxx_static_address_021cde058f856512f428587e.reference || (__cxx_static_address_021cde058f856512f428587e.reference = {
    __cReference: true,
    get value() { return HANGLIGHT____header_global_8f30786e7b970091; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:437
export const HYDRENT____header_global_412e28e3479899d4 = ((((((981) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_850fead38f7998caf407ceb7() {
  return __cxx_static_address_850fead38f7998caf407ceb7.reference || (__cxx_static_address_850fead38f7998caf407ceb7.reference = {
    __cReference: true,
    get value() { return HYDRENT____header_global_412e28e3479899d4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:438
export const MASKWALL14____header_global_943b2c11fdd0c389 = ((((((988) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bc93223bff7a4c8c6881aafb() {
  return __cxx_static_address_bc93223bff7a4c8c6881aafb.reference || (__cxx_static_address_bc93223bff7a4c8c6881aafb.reference = {
    __cReference: true,
    get value() { return MASKWALL14____header_global_943b2c11fdd0c389; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:439
export const TIRE____header_global_f7a62e5f7c804582 = ((((((990) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6751e5422e598b0b0e955b9e() {
  return __cxx_static_address_6751e5422e598b0b0e955b9e.reference || (__cxx_static_address_6751e5422e598b0b0e955b9e.reference = {
    __cReference: true,
    get value() { return TIRE____header_global_f7a62e5f7c804582; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:440
export const PIPE5____header_global_8047a5e74c2630f2 = ((((((994) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c891395d2fe964a1372c9613() {
  return __cxx_static_address_c891395d2fe964a1372c9613.reference || (__cxx_static_address_c891395d2fe964a1372c9613.reference = {
    __cReference: true,
    get value() { return PIPE5____header_global_8047a5e74c2630f2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:441
export const PIPE6____header_global_603381637b0e17ae = ((((((995) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_13349db896d5f6745756afbe() {
  return __cxx_static_address_13349db896d5f6745756afbe.reference || (__cxx_static_address_13349db896d5f6745756afbe.reference = {
    __cReference: true,
    get value() { return PIPE6____header_global_603381637b0e17ae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:442
export const PIPE4____header_global_431b0e6f5aa2b70c = ((((((996) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5d06aa3a6735a10d8f86d127() {
  return __cxx_static_address_5d06aa3a6735a10d8f86d127.reference || (__cxx_static_address_5d06aa3a6735a10d8f86d127.reference = {
    __cReference: true,
    get value() { return PIPE4____header_global_431b0e6f5aa2b70c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:443
export const PIPE4B____header_global_293a34a7d73b5fa0 = ((((((997) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_06c3de6e68e6760cc51b5f91() {
  return __cxx_static_address_06c3de6e68e6760cc51b5f91.reference || (__cxx_static_address_06c3de6e68e6760cc51b5f91.reference = {
    __cReference: true,
    get value() { return PIPE4B____header_global_293a34a7d73b5fa0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:444
export const BROKEHYDROPLANT____header_global_49d1df4600b48859 = ((((((1003) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2e9cc61d51dc3c89c5074a77() {
  return __cxx_static_address_2e9cc61d51dc3c89c5074a77.reference || (__cxx_static_address_2e9cc61d51dc3c89c5074a77.reference = {
    __cReference: true,
    get value() { return BROKEHYDROPLANT____header_global_49d1df4600b48859; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:445
export const PIPE5B____header_global_b795575bd10bcd3c = ((((((1005) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_126304497f2a77024c0fe8bb() {
  return __cxx_static_address_126304497f2a77024c0fe8bb.reference || (__cxx_static_address_126304497f2a77024c0fe8bb.reference = {
    __cReference: true,
    get value() { return PIPE5B____header_global_b795575bd10bcd3c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:446
export const NEON3____header_global_9866c2aec24a4193 = ((((((1007) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a2b5129c9c5f55e6020ddc05() {
  return __cxx_static_address_a2b5129c9c5f55e6020ddc05.reference || (__cxx_static_address_a2b5129c9c5f55e6020ddc05.reference = {
    __cReference: true,
    get value() { return NEON3____header_global_9866c2aec24a4193; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:447
export const NEON4____header_global_0b1afec0d0d243f2 = ((((((1008) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e3d664fd9fe498f15bac15eb() {
  return __cxx_static_address_e3d664fd9fe498f15bac15eb.reference || (__cxx_static_address_e3d664fd9fe498f15bac15eb.reference = {
    __cReference: true,
    get value() { return NEON4____header_global_0b1afec0d0d243f2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:448
export const NEON5____header_global_b6235b5fddb18c00 = ((((((1009) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f0503c72b1622b514c31b70d() {
  return __cxx_static_address_f0503c72b1622b514c31b70d.reference || (__cxx_static_address_f0503c72b1622b514c31b70d.reference = {
    __cReference: true,
    get value() { return NEON5____header_global_b6235b5fddb18c00; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:449
export const BOTTLE5____header_global_22e310b984dc3c54 = ((((((1012) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bd3b40d556c70b829ceb13d9() {
  return __cxx_static_address_bd3b40d556c70b829ceb13d9.reference || (__cxx_static_address_bd3b40d556c70b829ceb13d9.reference = {
    __cReference: true,
    get value() { return BOTTLE5____header_global_22e310b984dc3c54; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:450
export const BOTTLE6____header_global_0a4e23bdfa91d19c = ((((((1013) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_480fafbe69133f90c91fc275() {
  return __cxx_static_address_480fafbe69133f90c91fc275.reference || (__cxx_static_address_480fafbe69133f90c91fc275.reference = {
    __cReference: true,
    get value() { return BOTTLE6____header_global_0a4e23bdfa91d19c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:451
export const BOTTLE8____header_global_2d42818c969249d0 = ((((((1014) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0acf507473873189bb2f7115() {
  return __cxx_static_address_0acf507473873189bb2f7115.reference || (__cxx_static_address_0acf507473873189bb2f7115.reference = {
    __cReference: true,
    get value() { return BOTTLE8____header_global_2d42818c969249d0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:452
export const SPOTLITE____header_global_4783ab604895c83b = ((((((1020) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_947802bc13321d1c60b26b12() {
  return __cxx_static_address_947802bc13321d1c60b26b12.reference || (__cxx_static_address_947802bc13321d1c60b26b12.reference = {
    __cReference: true,
    get value() { return SPOTLITE____header_global_4783ab604895c83b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:453
export const MASKWALL15____header_global_a8e63e6c3e3cd40d = ((((((1024) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9bab78001b74454cde777636() {
  return __cxx_static_address_9bab78001b74454cde777636.reference || (__cxx_static_address_9bab78001b74454cde777636.reference = {
    __cReference: true,
    get value() { return MASKWALL15____header_global_a8e63e6c3e3cd40d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:454
export const BOTTLE7____header_global_7444cca32bdc17ed = ((((((1025) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9bae2747dd240e39330fe304() {
  return __cxx_static_address_9bae2747dd240e39330fe304.reference || (__cxx_static_address_9bae2747dd240e39330fe304.reference = {
    __cReference: true,
    get value() { return BOTTLE7____header_global_7444cca32bdc17ed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:455
export const HORSEONSIDE____header_global_0656f671e2ce3355 = ((((((1026) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_328ebf3f11bbace0c5cf1728() {
  return __cxx_static_address_328ebf3f11bbace0c5cf1728.reference || (__cxx_static_address_328ebf3f11bbace0c5cf1728.reference = {
    __cReference: true,
    get value() { return HORSEONSIDE____header_global_0656f671e2ce3355; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:456
export const GLASSPIECES____header_global_9fc5ad178622ec66 = ((((((1031) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9adb524af57238d266c884c7() {
  return __cxx_static_address_9adb524af57238d266c884c7.reference || (__cxx_static_address_9adb524af57238d266c884c7.reference = {
    __cReference: true,
    get value() { return GLASSPIECES____header_global_9fc5ad178622ec66; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:457
export const NEON6____header_global_787a3a4c4351720c = ((((((1046) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2662d270df9b4000a34c32dd() {
  return __cxx_static_address_2662d270df9b4000a34c32dd.reference || (__cxx_static_address_2662d270df9b4000a34c32dd.reference = {
    __cReference: true,
    get value() { return NEON6____header_global_787a3a4c4351720c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:458
export const MASKWALL6____header_global_31358d9b464099c0 = ((((((1059) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a0b6a118e44a63bf7af0a04d() {
  return __cxx_static_address_a0b6a118e44a63bf7af0a04d.reference || (__cxx_static_address_a0b6a118e44a63bf7af0a04d.reference = {
    __cReference: true,
    get value() { return MASKWALL6____header_global_31358d9b464099c0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:459
export const RUBBERCAN____header_global_aee85f200ebb0f78 = ((((((1062) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3d2b935dd14a9fd3d276cf80() {
  return __cxx_static_address_3d2b935dd14a9fd3d276cf80.reference || (__cxx_static_address_3d2b935dd14a9fd3d276cf80.reference = {
    __cReference: true,
    get value() { return RUBBERCAN____header_global_aee85f200ebb0f78; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:460
export const PLUG____header_global_d1d9a57c7cef3db1 = ((((((1069) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5b8f26dc21a1de5bca5e6d2c() {
  return __cxx_static_address_5b8f26dc21a1de5bca5e6d2c.reference || (__cxx_static_address_5b8f26dc21a1de5bca5e6d2c.reference = {
    __cReference: true,
    get value() { return PLUG____header_global_d1d9a57c7cef3db1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:461
export const OOZFILTER____header_global_08450e16b687b04a = ((((((1079) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9c27ec639a7ddb9cce1e6f04() {
  return __cxx_static_address_9c27ec639a7ddb9cce1e6f04.reference || (__cxx_static_address_9c27ec639a7ddb9cce1e6f04.reference = {
    __cReference: true,
    get value() { return OOZFILTER____header_global_08450e16b687b04a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:462
export const FLOORPLASMA____header_global_1c03b888baa98098 = ((((((1082) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_df8bbc86f553c52b15c8a4d7() {
  return __cxx_static_address_df8bbc86f553c52b15c8a4d7.reference || (__cxx_static_address_df8bbc86f553c52b15c8a4d7.reference = {
    __cReference: true,
    get value() { return FLOORPLASMA____header_global_1c03b888baa98098; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:463
export const REACTOR____header_global_eef0fb44adc7bee5 = ((((((1088) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2a9668f1bd9cee4f1b618ffd() {
  return __cxx_static_address_2a9668f1bd9cee4f1b618ffd.reference || (__cxx_static_address_2a9668f1bd9cee4f1b618ffd.reference = {
    __cReference: true,
    get value() { return REACTOR____header_global_eef0fb44adc7bee5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:464
export const REACTORSPARK____header_global_9a5e213635e728c4 = ((((((1092) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2879d5d5d74a3d01f1db1910() {
  return __cxx_static_address_2879d5d5d74a3d01f1db1910.reference || (__cxx_static_address_2879d5d5d74a3d01f1db1910.reference = {
    __cReference: true,
    get value() { return REACTORSPARK____header_global_9a5e213635e728c4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:465
export const REACTORBURNT____header_global_492a7b4aacf92303 = ((((((1096) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aefb83906a96044a495136f1() {
  return __cxx_static_address_aefb83906a96044a495136f1.reference || (__cxx_static_address_aefb83906a96044a495136f1.reference = {
    __cReference: true,
    get value() { return REACTORBURNT____header_global_492a7b4aacf92303; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:466
export const DOORTILE15____header_global_594d4a3e324c4497 = ((((((1102) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8b35d4230ddf8d0bef7459bd() {
  return __cxx_static_address_8b35d4230ddf8d0bef7459bd.reference || (__cxx_static_address_8b35d4230ddf8d0bef7459bd.reference = {
    __cReference: true,
    get value() { return DOORTILE15____header_global_594d4a3e324c4497; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:467
export const HANDSWITCH____header_global_2b4994aad4fada81 = ((((((1111) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_03a449b92966ed9e9a00e334() {
  return __cxx_static_address_03a449b92966ed9e9a00e334.reference || (__cxx_static_address_03a449b92966ed9e9a00e334.reference = {
    __cReference: true,
    get value() { return HANDSWITCH____header_global_2b4994aad4fada81; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:468
export const CIRCLEPANNEL____header_global_6261cc823cbed070 = ((((((1113) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5de7aab783626a354f8dbf76() {
  return __cxx_static_address_5de7aab783626a354f8dbf76.reference || (__cxx_static_address_5de7aab783626a354f8dbf76.reference = {
    __cReference: true,
    get value() { return CIRCLEPANNEL____header_global_6261cc823cbed070; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:469
export const CIRCLEPANNELBROKE____header_global_53260298ad47bf6a = ((((((1114) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6e5e28bcd6bb7c55e865dc64() {
  return __cxx_static_address_6e5e28bcd6bb7c55e865dc64.reference || (__cxx_static_address_6e5e28bcd6bb7c55e865dc64.reference = {
    __cReference: true,
    get value() { return CIRCLEPANNELBROKE____header_global_53260298ad47bf6a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:470
export const PULLSWITCH____header_global_9f8cf22f52c10518 = ((((((1122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_676949afabe326f6f5306a25() {
  return __cxx_static_address_676949afabe326f6f5306a25.reference || (__cxx_static_address_676949afabe326f6f5306a25.reference = {
    __cReference: true,
    get value() { return PULLSWITCH____header_global_9f8cf22f52c10518; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:471
export const MASKWALL8____header_global_15a27180d4e30def = ((((((1124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cd8f0b30f7e57bb50fd1c0bc() {
  return __cxx_static_address_cd8f0b30f7e57bb50fd1c0bc.reference || (__cxx_static_address_cd8f0b30f7e57bb50fd1c0bc.reference = {
    __cReference: true,
    get value() { return MASKWALL8____header_global_15a27180d4e30def; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:472
export const BIGHOLE____header_global_716ef1049a5a75db = ((((((1141) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_863b474b4ec9834a95028fdd() {
  return __cxx_static_address_863b474b4ec9834a95028fdd.reference || (__cxx_static_address_863b474b4ec9834a95028fdd.reference = {
    __cReference: true,
    get value() { return BIGHOLE____header_global_716ef1049a5a75db; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:473
export const ALIENSWITCH____header_global_5410e708f93d7b44 = ((((((1142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a7e1045b05aa4d3de3f7ab29() {
  return __cxx_static_address_a7e1045b05aa4d3de3f7ab29.reference || (__cxx_static_address_a7e1045b05aa4d3de3f7ab29.reference = {
    __cReference: true,
    get value() { return ALIENSWITCH____header_global_5410e708f93d7b44; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:474
export const DOORTILE21____header_global_649dd0d6f7d1c326 = ((((((1144) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4188a8a11d24187b04fcfb92() {
  return __cxx_static_address_4188a8a11d24187b04fcfb92.reference || (__cxx_static_address_4188a8a11d24187b04fcfb92.reference = {
    __cReference: true,
    get value() { return DOORTILE21____header_global_649dd0d6f7d1c326; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:475
export const HANDPRINTSWITCH____header_global_ff652dd88a009622 = ((((((1155) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_42336bd57a5324e9f6fee52b() {
  return __cxx_static_address_42336bd57a5324e9f6fee52b.reference || (__cxx_static_address_42336bd57a5324e9f6fee52b.reference = {
    __cReference: true,
    get value() { return HANDPRINTSWITCH____header_global_ff652dd88a009622; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:476
export const BOTTLE10____header_global_a5d9449600a50d68 = ((((((1157) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_90fa044bfcf83df1dab06c11() {
  return __cxx_static_address_90fa044bfcf83df1dab06c11.reference || (__cxx_static_address_90fa044bfcf83df1dab06c11.reference = {
    __cReference: true,
    get value() { return BOTTLE10____header_global_a5d9449600a50d68; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:477
export const BOTTLE11____header_global_b9e9d7c3bac82441 = ((((((1158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_26c3ef0b8afacecdb104735d() {
  return __cxx_static_address_26c3ef0b8afacecdb104735d.reference || (__cxx_static_address_26c3ef0b8afacecdb104735d.reference = {
    __cReference: true,
    get value() { return BOTTLE11____header_global_b9e9d7c3bac82441; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:478
export const BOTTLE12____header_global_0653f56c561c0d3d = ((((((1159) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9aa8005042d85795ea2b5ebf() {
  return __cxx_static_address_9aa8005042d85795ea2b5ebf.reference || (__cxx_static_address_9aa8005042d85795ea2b5ebf.reference = {
    __cReference: true,
    get value() { return BOTTLE12____header_global_0653f56c561c0d3d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:479
export const BOTTLE13____header_global_bccdf4aa508e7c82 = ((((((1160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bdd032eff7133f88d96790a6() {
  return __cxx_static_address_bdd032eff7133f88d96790a6.reference || (__cxx_static_address_bdd032eff7133f88d96790a6.reference = {
    __cReference: true,
    get value() { return BOTTLE13____header_global_bccdf4aa508e7c82; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:480
export const BOTTLE14____header_global_2a4a8ced7fc8d074 = ((((((1161) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0eb3c4d2cd6a0a7db10365a9() {
  return __cxx_static_address_0eb3c4d2cd6a0a7db10365a9.reference || (__cxx_static_address_0eb3c4d2cd6a0a7db10365a9.reference = {
    __cReference: true,
    get value() { return BOTTLE14____header_global_2a4a8ced7fc8d074; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:481
export const BOTTLE15____header_global_bf1ac94d3b3d7047 = ((((((1162) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bfab3231a7de4f9aa7b2e7cb() {
  return __cxx_static_address_bfab3231a7de4f9aa7b2e7cb.reference || (__cxx_static_address_bfab3231a7de4f9aa7b2e7cb.reference = {
    __cReference: true,
    get value() { return BOTTLE15____header_global_bf1ac94d3b3d7047; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:482
export const BOTTLE16____header_global_a5068fd53180f2c2 = ((((((1163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_225ae88fb9cf7e291573c944() {
  return __cxx_static_address_225ae88fb9cf7e291573c944.reference || (__cxx_static_address_225ae88fb9cf7e291573c944.reference = {
    __cReference: true,
    get value() { return BOTTLE16____header_global_a5068fd53180f2c2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:483
export const BOTTLE17____header_global_de0fa7c9675f84d8 = ((((((1164) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c474ec0593fbb43963edbb26() {
  return __cxx_static_address_c474ec0593fbb43963edbb26.reference || (__cxx_static_address_c474ec0593fbb43963edbb26.reference = {
    __cReference: true,
    get value() { return BOTTLE17____header_global_de0fa7c9675f84d8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:484
export const BOTTLE18____header_global_357416a3989e97af = ((((((1165) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2023c96618ccb29bd1fa6195() {
  return __cxx_static_address_2023c96618ccb29bd1fa6195.reference || (__cxx_static_address_2023c96618ccb29bd1fa6195.reference = {
    __cReference: true,
    get value() { return BOTTLE18____header_global_357416a3989e97af; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:485
export const BOTTLE19____header_global_b56638a035a261fd = ((((((1166) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f839631e0b9a512d54a32d6b() {
  return __cxx_static_address_f839631e0b9a512d54a32d6b.reference || (__cxx_static_address_f839631e0b9a512d54a32d6b.reference = {
    __cReference: true,
    get value() { return BOTTLE19____header_global_b56638a035a261fd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:486
export const DOORTILE17____header_global_49d359b584a795ec = ((((((1169) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bc7e1d06574febc8846798c3() {
  return __cxx_static_address_bc7e1d06574febc8846798c3.reference || (__cxx_static_address_bc7e1d06574febc8846798c3.reference = {
    __cReference: true,
    get value() { return DOORTILE17____header_global_49d359b584a795ec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:487
export const MASKWALL7____header_global_88f056de1eca0950 = ((((((1174) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0d6adb48aad90b305d6b953f() {
  return __cxx_static_address_0d6adb48aad90b305d6b953f.reference || (__cxx_static_address_0d6adb48aad90b305d6b953f.reference = {
    __cReference: true,
    get value() { return MASKWALL7____header_global_88f056de1eca0950; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:488
export const DOORTILE11____header_global_18908ce1f593e127 = ((((((1178) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_faa7f6460222472c727b181a() {
  return __cxx_static_address_faa7f6460222472c727b181a.reference || (__cxx_static_address_faa7f6460222472c727b181a.reference = {
    __cReference: true,
    get value() { return DOORTILE11____header_global_18908ce1f593e127; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:489
export const DOORTILE12____header_global_093dc07791c7da54 = ((((((1179) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_12b1307f595d2e0902d9be1b() {
  return __cxx_static_address_12b1307f595d2e0902d9be1b.reference || (__cxx_static_address_12b1307f595d2e0902d9be1b.reference = {
    __cReference: true,
    get value() { return DOORTILE12____header_global_093dc07791c7da54; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:490
export const VENDMACHINE____header_global_8d2557ad70650a4d = ((((((1212) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c4b01d61e0bb44f7e283ab86() {
  return __cxx_static_address_c4b01d61e0bb44f7e283ab86.reference || (__cxx_static_address_c4b01d61e0bb44f7e283ab86.reference = {
    __cReference: true,
    get value() { return VENDMACHINE____header_global_8d2557ad70650a4d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:491
export const COLAMACHINE____header_global_67f81ae7966275db = ((((((1215) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ed50e28c8202715c017ddc86() {
  return __cxx_static_address_ed50e28c8202715c017ddc86.reference || (__cxx_static_address_ed50e28c8202715c017ddc86.reference = {
    __cReference: true,
    get value() { return COLAMACHINE____header_global_67f81ae7966275db; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:492
export const CRANEPOLE____header_global_d0d05399dff5e2f9 = ((((((1221) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bf00aa15cecf5d5feb21b78b() {
  return __cxx_static_address_bf00aa15cecf5d5feb21b78b.reference || (__cxx_static_address_bf00aa15cecf5d5feb21b78b.reference = {
    __cReference: true,
    get value() { return CRANEPOLE____header_global_d0d05399dff5e2f9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:493
export const CRANE____header_global_b0ac8f1785b8b0dd = ((((((1222) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5759083debe3001de276dfa6() {
  return __cxx_static_address_5759083debe3001de276dfa6.reference || (__cxx_static_address_5759083debe3001de276dfa6.reference = {
    __cReference: true,
    get value() { return CRANE____header_global_b0ac8f1785b8b0dd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:494
export const BARBROKE____header_global_3337f1876d2432ee = ((((((1225) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4974ab71d636065eab62ceee() {
  return __cxx_static_address_4974ab71d636065eab62ceee.reference || (__cxx_static_address_4974ab71d636065eab62ceee.reference = {
    __cReference: true,
    get value() { return BARBROKE____header_global_3337f1876d2432ee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:495
export const BLOODPOOL____header_global_a8e1ed1e0ea05258 = ((((((1226) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fc6daf8aedcd25a3b5be5b4b() {
  return __cxx_static_address_fc6daf8aedcd25a3b5be5b4b.reference || (__cxx_static_address_fc6daf8aedcd25a3b5be5b4b.reference = {
    __cReference: true,
    get value() { return BLOODPOOL____header_global_a8e1ed1e0ea05258; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:496
export const NUKEBARREL____header_global_cc310d95be6e9c2e = ((((((1227) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5761b48edcb3810bb84beeb1() {
  return __cxx_static_address_5761b48edcb3810bb84beeb1.reference || (__cxx_static_address_5761b48edcb3810bb84beeb1.reference = {
    __cReference: true,
    get value() { return NUKEBARREL____header_global_cc310d95be6e9c2e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:497
export const NUKEBARRELDENTED____header_global_916ed522bd3afb03 = ((((((1228) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5bccd9fbe8f84df6c0335048() {
  return __cxx_static_address_5bccd9fbe8f84df6c0335048.reference || (__cxx_static_address_5bccd9fbe8f84df6c0335048.reference = {
    __cReference: true,
    get value() { return NUKEBARRELDENTED____header_global_916ed522bd3afb03; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:498
export const NUKEBARRELLEAKED____header_global_0da884c44802cfbb = ((((((1229) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fba498077ad0bf105adb1440() {
  return __cxx_static_address_fba498077ad0bf105adb1440.reference || (__cxx_static_address_fba498077ad0bf105adb1440.reference = {
    __cReference: true,
    get value() { return NUKEBARRELLEAKED____header_global_0da884c44802cfbb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:499
export const CANWITHSOMETHING____header_global_61795318edc14d1c = ((((((1232) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_704ecd78bee7b994fa50f8e8() {
  return __cxx_static_address_704ecd78bee7b994fa50f8e8.reference || (__cxx_static_address_704ecd78bee7b994fa50f8e8.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING____header_global_61795318edc14d1c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:500
export const MONEY____header_global_c3d6aade532ac939 = ((((((1233) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_82b7257460468a173f80e903() {
  return __cxx_static_address_82b7257460468a173f80e903.reference || (__cxx_static_address_82b7257460468a173f80e903.reference = {
    __cReference: true,
    get value() { return MONEY____header_global_c3d6aade532ac939; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:501
export const BANNER____header_global_78b70024182f6848 = ((((((1236) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_af90c5f564c24087bf2f1e2b() {
  return __cxx_static_address_af90c5f564c24087bf2f1e2b.reference || (__cxx_static_address_af90c5f564c24087bf2f1e2b.reference = {
    __cReference: true,
    get value() { return BANNER____header_global_78b70024182f6848; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:502
export const EXPLODINGBARREL____header_global_5b4171e5cc7503bc = ((((((1238) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fac9d3c674f36575b2553679() {
  return __cxx_static_address_fac9d3c674f36575b2553679.reference || (__cxx_static_address_fac9d3c674f36575b2553679.reference = {
    __cReference: true,
    get value() { return EXPLODINGBARREL____header_global_5b4171e5cc7503bc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:503
export const EXPLODINGBARREL2____header_global_d6fe11589efe145b = ((((((1239) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3c4e6d0074b7a7b692937e51() {
  return __cxx_static_address_3c4e6d0074b7a7b692937e51.reference || (__cxx_static_address_3c4e6d0074b7a7b692937e51.reference = {
    __cReference: true,
    get value() { return EXPLODINGBARREL2____header_global_d6fe11589efe145b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:504
export const FIREBARREL____header_global_37918756c4d3cd8c = ((((((1240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_947f307f6f39ed29c319bbda() {
  return __cxx_static_address_947f307f6f39ed29c319bbda.reference || (__cxx_static_address_947f307f6f39ed29c319bbda.reference = {
    __cReference: true,
    get value() { return FIREBARREL____header_global_37918756c4d3cd8c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:505
export const SEENINE____header_global_47f60927e124843f = ((((((1247) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d8f3a855bdeb69cac8eb521e() {
  return __cxx_static_address_d8f3a855bdeb69cac8eb521e.reference || (__cxx_static_address_d8f3a855bdeb69cac8eb521e.reference = {
    __cReference: true,
    get value() { return SEENINE____header_global_47f60927e124843f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:506
export const SEENINEDEAD____header_global_c0684996a3889437 = ((((((1248) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5a83123ddba40fb8b4253148() {
  return __cxx_static_address_5a83123ddba40fb8b4253148.reference || (__cxx_static_address_5a83123ddba40fb8b4253148.reference = {
    __cReference: true,
    get value() { return SEENINEDEAD____header_global_c0684996a3889437; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:507
export const STEAM____header_global_05c048346d1fb201 = ((((((1250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_05751cca906cd117bb41cdde() {
  return __cxx_static_address_05751cca906cd117bb41cdde.reference || (__cxx_static_address_05751cca906cd117bb41cdde.reference = {
    __cReference: true,
    get value() { return STEAM____header_global_05c048346d1fb201; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:508
export const CEILINGSTEAM____header_global_209b134ae403452c = ((((((1255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4341e665f0a182172bc9c949() {
  return __cxx_static_address_4341e665f0a182172bc9c949.reference || (__cxx_static_address_4341e665f0a182172bc9c949.reference = {
    __cReference: true,
    get value() { return CEILINGSTEAM____header_global_209b134ae403452c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:509
export const PIPE6B____header_global_57b93e1e2e338184 = ((((((1260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4c2a01dc7bdc035bb1b16619() {
  return __cxx_static_address_4c2a01dc7bdc035bb1b16619.reference || (__cxx_static_address_4c2a01dc7bdc035bb1b16619.reference = {
    __cReference: true,
    get value() { return PIPE6B____header_global_57b93e1e2e338184; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:510
export const TRANSPORTERBEAM____header_global_0d3623ae1d373e3a = ((((((1261) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2c79e563d5c476e6233d7aa2() {
  return __cxx_static_address_2c79e563d5c476e6233d7aa2.reference || (__cxx_static_address_2c79e563d5c476e6233d7aa2.reference = {
    __cReference: true,
    get value() { return TRANSPORTERBEAM____header_global_0d3623ae1d373e3a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:511
export const RAT____header_global_188d76d05000fce9 = ((((((1267) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1bc242b3e7a8807507ee1f76() {
  return __cxx_static_address_1bc242b3e7a8807507ee1f76.reference || (__cxx_static_address_1bc242b3e7a8807507ee1f76.reference = {
    __cReference: true,
    get value() { return RAT____header_global_188d76d05000fce9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:512
export const TRASH____header_global_cb5c1e6aed30e21b = ((((((1272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f7096ef4de1fb249f785552f() {
  return __cxx_static_address_f7096ef4de1fb249f785552f.reference || (__cxx_static_address_f7096ef4de1fb249f785552f.reference = {
    __cReference: true,
    get value() { return TRASH____header_global_cb5c1e6aed30e21b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:513
export const FEMPIC1____header_global_cfb1cdd12b858b30 = ((((((1280) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f3471ad542ee27e0d926629c() {
  return __cxx_static_address_f3471ad542ee27e0d926629c.reference || (__cxx_static_address_f3471ad542ee27e0d926629c.reference = {
    __cReference: true,
    get value() { return FEMPIC1____header_global_cfb1cdd12b858b30; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:514
export const FEMPIC2____header_global_641e383f1be30fdb = ((((((1289) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8847b01ebc4614d4a62812c5() {
  return __cxx_static_address_8847b01ebc4614d4a62812c5.reference || (__cxx_static_address_8847b01ebc4614d4a62812c5.reference = {
    __cReference: true,
    get value() { return FEMPIC2____header_global_641e383f1be30fdb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:515
export const BLANKSCREEN____header_global_822822a3cbe5b031 = ((((((1293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9de8b8e5054c46db476b2119() {
  return __cxx_static_address_9de8b8e5054c46db476b2119.reference || (__cxx_static_address_9de8b8e5054c46db476b2119.reference = {
    __cReference: true,
    get value() { return BLANKSCREEN____header_global_822822a3cbe5b031; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:516
export const PODFEM1____header_global_8386796196dbac32 = ((((((1294) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fb3656cad38d71a474e0e6b6() {
  return __cxx_static_address_fb3656cad38d71a474e0e6b6.reference || (__cxx_static_address_fb3656cad38d71a474e0e6b6.reference = {
    __cReference: true,
    get value() { return PODFEM1____header_global_8386796196dbac32; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:517
export const FEMPIC3____header_global_ad9da5b8e266e866 = ((((((1298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_925f13d73bae2d9d202dc9ec() {
  return __cxx_static_address_925f13d73bae2d9d202dc9ec.reference || (__cxx_static_address_925f13d73bae2d9d202dc9ec.reference = {
    __cReference: true,
    get value() { return FEMPIC3____header_global_ad9da5b8e266e866; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:518
export const FEMPIC4____header_global_278986ee82f88f74 = ((((((1306) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7eb5467d1e601a7a1d01bee5() {
  return __cxx_static_address_7eb5467d1e601a7a1d01bee5.reference || (__cxx_static_address_7eb5467d1e601a7a1d01bee5.reference = {
    __cReference: true,
    get value() { return FEMPIC4____header_global_278986ee82f88f74; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:519
export const FEM1____header_global_297037199b00c474 = ((((((1312) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d84abecb775c88184d097cc6() {
  return __cxx_static_address_d84abecb775c88184d097cc6.reference || (__cxx_static_address_d84abecb775c88184d097cc6.reference = {
    __cReference: true,
    get value() { return FEM1____header_global_297037199b00c474; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:520
export const FEM2____header_global_58353aa7e06bbff4 = ((((((1317) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1f47fa9599b1c9d451a3e5a1() {
  return __cxx_static_address_1f47fa9599b1c9d451a3e5a1.reference || (__cxx_static_address_1f47fa9599b1c9d451a3e5a1.reference = {
    __cReference: true,
    get value() { return FEM2____header_global_58353aa7e06bbff4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:521
export const FEM3____header_global_676a8af9cc30a2a9 = ((((((1321) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fe19a93005a432cd21718782() {
  return __cxx_static_address_fe19a93005a432cd21718782.reference || (__cxx_static_address_fe19a93005a432cd21718782.reference = {
    __cReference: true,
    get value() { return FEM3____header_global_676a8af9cc30a2a9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:522
export const FEM5____header_global_a2a420a3b30176d2 = ((((((1323) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_965fdb9a38cb4d17b3be863a() {
  return __cxx_static_address_965fdb9a38cb4d17b3be863a.reference || (__cxx_static_address_965fdb9a38cb4d17b3be863a.reference = {
    __cReference: true,
    get value() { return FEM5____header_global_a2a420a3b30176d2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:523
export const BLOODYPOLE____header_global_c5d1cfa7fc64a94e = ((((((1324) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c41874dd61731d0d400cdd99() {
  return __cxx_static_address_c41874dd61731d0d400cdd99.reference || (__cxx_static_address_c41874dd61731d0d400cdd99.reference = {
    __cReference: true,
    get value() { return BLOODYPOLE____header_global_c5d1cfa7fc64a94e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:524
export const FEM4____header_global_b41449071b9701bc = ((((((1325) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_01560fee0390291c7ebf20b7() {
  return __cxx_static_address_01560fee0390291c7ebf20b7.reference || (__cxx_static_address_01560fee0390291c7ebf20b7.reference = {
    __cReference: true,
    get value() { return FEM4____header_global_b41449071b9701bc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:525
export const FEM6____header_global_a680fc71537ed382 = ((((((1334) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_77c2400e065022dcc7b817aa() {
  return __cxx_static_address_77c2400e065022dcc7b817aa.reference || (__cxx_static_address_77c2400e065022dcc7b817aa.reference = {
    __cReference: true,
    get value() { return FEM6____header_global_a680fc71537ed382; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:526
export const FEM6PAD____header_global_400afd729c91e3ac = ((((((1335) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_85cc42d89495966b5a9a4b7a() {
  return __cxx_static_address_85cc42d89495966b5a9a4b7a.reference || (__cxx_static_address_85cc42d89495966b5a9a4b7a.reference = {
    __cReference: true,
    get value() { return FEM6PAD____header_global_400afd729c91e3ac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:527
export const FEM8____header_global_3671cf701ca9adc2 = ((((((1336) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_82048f54c98e11c61cded054() {
  return __cxx_static_address_82048f54c98e11c61cded054.reference || (__cxx_static_address_82048f54c98e11c61cded054.reference = {
    __cReference: true,
    get value() { return FEM8____header_global_3671cf701ca9adc2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:528
export const HELECOPT____header_global_8b1d01568a445a05 = ((((((1346) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6cea415db49d4685190101b4() {
  return __cxx_static_address_6cea415db49d4685190101b4.reference || (__cxx_static_address_6cea415db49d4685190101b4.reference = {
    __cReference: true,
    get value() { return HELECOPT____header_global_8b1d01568a445a05; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:529
export const FETUSJIB____header_global_056fbfb646964522 = ((((((1347) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c7f2184f52c7857591029e41() {
  return __cxx_static_address_c7f2184f52c7857591029e41.reference || (__cxx_static_address_c7f2184f52c7857591029e41.reference = {
    __cReference: true,
    get value() { return FETUSJIB____header_global_056fbfb646964522; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:530
export const HOLODUKE____header_global_6c7e825a1e54555e = ((((((1348) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_10513d7869c2e9e360b83926() {
  return __cxx_static_address_10513d7869c2e9e360b83926.reference || (__cxx_static_address_10513d7869c2e9e360b83926.reference = {
    __cReference: true,
    get value() { return HOLODUKE____header_global_6c7e825a1e54555e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:531
export const SPACEMARINE____header_global_deff864c8bda127b = ((((((1353) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0d1b3f157aaeb43890739dfa() {
  return __cxx_static_address_0d1b3f157aaeb43890739dfa.reference || (__cxx_static_address_0d1b3f157aaeb43890739dfa.reference = {
    __cReference: true,
    get value() { return SPACEMARINE____header_global_deff864c8bda127b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:532
export const INDY____header_global_279cf0a11f9c12d8 = ((((((1355) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7df9135331ad483a9759ce49() {
  return __cxx_static_address_7df9135331ad483a9759ce49.reference || (__cxx_static_address_7df9135331ad483a9759ce49.reference = {
    __cReference: true,
    get value() { return INDY____header_global_279cf0a11f9c12d8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:533
export const FETUS____header_global_ec493d48a789b1ae = ((((((1358) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_12ac2174c67b9c909b580e65() {
  return __cxx_static_address_12ac2174c67b9c909b580e65.reference || (__cxx_static_address_12ac2174c67b9c909b580e65.reference = {
    __cReference: true,
    get value() { return FETUS____header_global_ec493d48a789b1ae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:534
export const FETUSBROKE____header_global_bc49e73ad7ab79ce = ((((((1359) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a6fc1f075335b1e5929f5e97() {
  return __cxx_static_address_a6fc1f075335b1e5929f5e97.reference || (__cxx_static_address_a6fc1f075335b1e5929f5e97.reference = {
    __cReference: true,
    get value() { return FETUSBROKE____header_global_bc49e73ad7ab79ce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:535
export const MONK____header_global_cea95e787c278034 = ((((((1352) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5d779baed8cbf39fbfcee168() {
  return __cxx_static_address_5d779baed8cbf39fbfcee168.reference || (__cxx_static_address_5d779baed8cbf39fbfcee168.reference = {
    __cReference: true,
    get value() { return MONK____header_global_cea95e787c278034; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:536
export const LUKE____header_global_ceb9c378f041d79d = ((((((1354) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0386ec33f8d3968de0f7db7c() {
  return __cxx_static_address_0386ec33f8d3968de0f7db7c.reference || (__cxx_static_address_0386ec33f8d3968de0f7db7c.reference = {
    __cReference: true,
    get value() { return LUKE____header_global_ceb9c378f041d79d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:537
export const COOLEXPLOSION1____header_global_5c20c220588443a9 = ((((((1360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1a87b77207f00c18e59172ba() {
  return __cxx_static_address_1a87b77207f00c18e59172ba.reference || (__cxx_static_address_1a87b77207f00c18e59172ba.reference = {
    __cReference: true,
    get value() { return COOLEXPLOSION1____header_global_5c20c220588443a9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:538
export const WATERSPLASH2____header_global_6c5de07f6aec7ce9 = ((((((1380) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b8a56ae2f1987ec57faf1783() {
  return __cxx_static_address_b8a56ae2f1987ec57faf1783.reference || (__cxx_static_address_b8a56ae2f1987ec57faf1783.reference = {
    __cReference: true,
    get value() { return WATERSPLASH2____header_global_6c5de07f6aec7ce9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:539
export const FIREVASE____header_global_a0a171a406cab8cb = ((((((1390) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0b51c9e3d28ff02c930e87e0() {
  return __cxx_static_address_0b51c9e3d28ff02c930e87e0.reference || (__cxx_static_address_0b51c9e3d28ff02c930e87e0.reference = {
    __cReference: true,
    get value() { return FIREVASE____header_global_a0a171a406cab8cb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:540
export const FEM7____header_global_23be0f3fe16f6559 = ((((((1395) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_81d8917d2aae872c4adebb07() {
  return __cxx_static_address_81d8917d2aae872c4adebb07.reference || (__cxx_static_address_81d8917d2aae872c4adebb07.reference = {
    __cReference: true,
    get value() { return FEM7____header_global_23be0f3fe16f6559; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:541
export const APLAYERTOP____header_global_4c5bbf75eccc8b1c = ((((((1400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1b2fdc712f5991e4fb4d831c() {
  return __cxx_static_address_1b2fdc712f5991e4fb4d831c.reference || (__cxx_static_address_1b2fdc712f5991e4fb4d831c.reference = {
    __cReference: true,
    get value() { return APLAYERTOP____header_global_4c5bbf75eccc8b1c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:542
export const APLAYER____header_global_836dbaf432ada8aa = ((((((1405) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3be1d4cd8f1f088858a1d14f() {
  return __cxx_static_address_3be1d4cd8f1f088858a1d14f.reference || (__cxx_static_address_3be1d4cd8f1f088858a1d14f.reference = {
    __cReference: true,
    get value() { return APLAYER____header_global_836dbaf432ada8aa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:543
export const PLAYERONWATER____header_global_7c3629b81d1c6979 = ((((((1420) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_982c2a1b725a76315ea01cc6() {
  return __cxx_static_address_982c2a1b725a76315ea01cc6.reference || (__cxx_static_address_982c2a1b725a76315ea01cc6.reference = {
    __cReference: true,
    get value() { return PLAYERONWATER____header_global_7c3629b81d1c6979; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:544
export const DUKELYINGDEAD____header_global_ffada9b12c17da1c = ((((((1518) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d7c0551f1fad41bc76d164a7() {
  return __cxx_static_address_d7c0551f1fad41bc76d164a7.reference || (__cxx_static_address_d7c0551f1fad41bc76d164a7.reference = {
    __cReference: true,
    get value() { return DUKELYINGDEAD____header_global_ffada9b12c17da1c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:545
export const DUKETORSO____header_global_95d5183182686916 = ((((((1520) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_471935ef933bf2115bb9febf() {
  return __cxx_static_address_471935ef933bf2115bb9febf.reference || (__cxx_static_address_471935ef933bf2115bb9febf.reference = {
    __cReference: true,
    get value() { return DUKETORSO____header_global_95d5183182686916; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:546
export const DUKEGUN____header_global_46dc10008c2be834 = ((((((1528) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4e80d506a9e7b5c9761083dc() {
  return __cxx_static_address_4e80d506a9e7b5c9761083dc.reference || (__cxx_static_address_4e80d506a9e7b5c9761083dc.reference = {
    __cReference: true,
    get value() { return DUKEGUN____header_global_46dc10008c2be834; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:547
export const DUKELEG____header_global_e9ec230f16312e9b = ((((((1536) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e0e6b830861d5f99fcb601f3() {
  return __cxx_static_address_e0e6b830861d5f99fcb601f3.reference || (__cxx_static_address_e0e6b830861d5f99fcb601f3.reference = {
    __cReference: true,
    get value() { return DUKELEG____header_global_e9ec230f16312e9b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:548
export const SHARK____header_global_3991b012f13ec376 = ((((((1550) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_05e10b4d9e7e3706e3d9bc22() {
  return __cxx_static_address_05e10b4d9e7e3706e3d9bc22.reference || (__cxx_static_address_05e10b4d9e7e3706e3d9bc22.reference = {
    __cReference: true,
    get value() { return SHARK____header_global_3991b012f13ec376; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:549
export const BLOOD____header_global_e78c07bbe7416d9a = ((((((1620) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_909774eb2c5da2978494342a() {
  return __cxx_static_address_909774eb2c5da2978494342a.reference || (__cxx_static_address_909774eb2c5da2978494342a.reference = {
    __cReference: true,
    get value() { return BLOOD____header_global_e78c07bbe7416d9a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:550
export const FIRELASER____header_global_c4c6e38ae4c0d2ff = ((((((1625) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_03c4e365998266addade215c() {
  return __cxx_static_address_03c4e365998266addade215c.reference || (__cxx_static_address_03c4e365998266addade215c.reference = {
    __cReference: true,
    get value() { return FIRELASER____header_global_c4c6e38ae4c0d2ff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:551
export const TRANSPORTERSTAR____header_global_0efe2c5fc010e503 = ((((((1630) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7a0a4f1b3fe292e5ded1ceec() {
  return __cxx_static_address_7a0a4f1b3fe292e5ded1ceec.reference || (__cxx_static_address_7a0a4f1b3fe292e5ded1ceec.reference = {
    __cReference: true,
    get value() { return TRANSPORTERSTAR____header_global_0efe2c5fc010e503; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:552
export const SPIT____header_global_63809f330aad6aae = ((((((1636) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3cc3b4b917180a2507d7f2f2() {
  return __cxx_static_address_3cc3b4b917180a2507d7f2f2.reference || (__cxx_static_address_3cc3b4b917180a2507d7f2f2.reference = {
    __cReference: true,
    get value() { return SPIT____header_global_63809f330aad6aae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:553
export const LOOGIE____header_global_405ccb41dcef0ac9 = ((((((1637) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6b53da63e3982e3889ba46d8() {
  return __cxx_static_address_6b53da63e3982e3889ba46d8.reference || (__cxx_static_address_6b53da63e3982e3889ba46d8.reference = {
    __cReference: true,
    get value() { return LOOGIE____header_global_405ccb41dcef0ac9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:554
export const FIST____header_global_cacb264fb9406a31 = ((((((1640) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_288e1e541258edf9a6a0d691() {
  return __cxx_static_address_288e1e541258edf9a6a0d691.reference || (__cxx_static_address_288e1e541258edf9a6a0d691.reference = {
    __cReference: true,
    get value() { return FIST____header_global_cacb264fb9406a31; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:555
export const FREEZEBLAST____header_global_dccafbaaff1f9a46 = ((((((1641) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_87a801ce428616c246385216() {
  return __cxx_static_address_87a801ce428616c246385216.reference || (__cxx_static_address_87a801ce428616c246385216.reference = {
    __cReference: true,
    get value() { return FREEZEBLAST____header_global_dccafbaaff1f9a46; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:556
export const SHRINKSPARK____header_global_16e2fe8a37bdd9a7 = ((((((1646) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_46392c6006933e38e3dd9854() {
  return __cxx_static_address_46392c6006933e38e3dd9854.reference || (__cxx_static_address_46392c6006933e38e3dd9854.reference = {
    __cReference: true,
    get value() { return SHRINKSPARK____header_global_16e2fe8a37bdd9a7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:557
export const TONGUE____header_global_bb9efebb93565cb3 = ((((((1647) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7b79b62a8e604259e181af7d() {
  return __cxx_static_address_7b79b62a8e604259e181af7d.reference || (__cxx_static_address_7b79b62a8e604259e181af7d.reference = {
    __cReference: true,
    get value() { return TONGUE____header_global_bb9efebb93565cb3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:558
export const MORTER____header_global_dc54fde4f57f6072 = ((((((1650) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b3b4fc80b2b10d23e28672f5() {
  return __cxx_static_address_b3b4fc80b2b10d23e28672f5.reference || (__cxx_static_address_b3b4fc80b2b10d23e28672f5.reference = {
    __cReference: true,
    get value() { return MORTER____header_global_dc54fde4f57f6072; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:559
export const SHRINKEREXPLOSION____header_global_e8ecd7ba711323f4 = ((((((1656) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_03da9f642b2a17f5d26604d6() {
  return __cxx_static_address_03da9f642b2a17f5d26604d6.reference || (__cxx_static_address_03da9f642b2a17f5d26604d6.reference = {
    __cReference: true,
    get value() { return SHRINKEREXPLOSION____header_global_e8ecd7ba711323f4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:560
export const RADIUSEXPLOSION____header_global_97dc0abfb4d715d7 = ((((((1670) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_434aa49b1cb3f40df0399285() {
  return __cxx_static_address_434aa49b1cb3f40df0399285.reference || (__cxx_static_address_434aa49b1cb3f40df0399285.reference = {
    __cReference: true,
    get value() { return RADIUSEXPLOSION____header_global_97dc0abfb4d715d7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:561
export const FORCERIPPLE____header_global_0e8ddf1823e06773 = ((((((1671) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c2edfa9616a118771a12cc33() {
  return __cxx_static_address_c2edfa9616a118771a12cc33.reference || (__cxx_static_address_c2edfa9616a118771a12cc33.reference = {
    __cReference: true,
    get value() { return FORCERIPPLE____header_global_0e8ddf1823e06773; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:562
export const LIZTROOP____header_global_a4601a923c17d669 = ((((((1680) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f9fdfb755f96d559f81d386b() {
  return __cxx_static_address_f9fdfb755f96d559f81d386b.reference || (__cxx_static_address_f9fdfb755f96d559f81d386b.reference = {
    __cReference: true,
    get value() { return LIZTROOP____header_global_a4601a923c17d669; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:563
export const LIZTROOPRUNNING____header_global_02d50dc878bd63f9 = ((((((1681) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b8d75c65b5ae3f849438497a() {
  return __cxx_static_address_b8d75c65b5ae3f849438497a.reference || (__cxx_static_address_b8d75c65b5ae3f849438497a.reference = {
    __cReference: true,
    get value() { return LIZTROOPRUNNING____header_global_02d50dc878bd63f9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:564
export const LIZTROOPSTAYPUT____header_global_364dbe8e1c3447ef = ((((((1682) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_312bf1446a235f0d553b2129() {
  return __cxx_static_address_312bf1446a235f0d553b2129.reference || (__cxx_static_address_312bf1446a235f0d553b2129.reference = {
    __cReference: true,
    get value() { return LIZTROOPSTAYPUT____header_global_364dbe8e1c3447ef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:565
export const LIZTROOPSHOOT____header_global_b08fda55fb3ba8be = ((((((1715) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7eaac020525ebba076a1627d() {
  return __cxx_static_address_7eaac020525ebba076a1627d.reference || (__cxx_static_address_7eaac020525ebba076a1627d.reference = {
    __cReference: true,
    get value() { return LIZTROOPSHOOT____header_global_b08fda55fb3ba8be; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:566
export const LIZTROOPJETPACK____header_global_4c48b046138aa56a = ((((((1725) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bf6bafce2f24c34e0930be38() {
  return __cxx_static_address_bf6bafce2f24c34e0930be38.reference || (__cxx_static_address_bf6bafce2f24c34e0930be38.reference = {
    __cReference: true,
    get value() { return LIZTROOPJETPACK____header_global_4c48b046138aa56a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:567
export const LIZTROOPONTOILET____header_global_b9acb1dffd5ee60a = ((((((1741) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_48b78244682095a7140c006e() {
  return __cxx_static_address_48b78244682095a7140c006e.reference || (__cxx_static_address_48b78244682095a7140c006e.reference = {
    __cReference: true,
    get value() { return LIZTROOPONTOILET____header_global_b9acb1dffd5ee60a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:568
export const LIZTROOPJUSTSIT____header_global_1c38c7cae1f4817f = ((((((1742) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d82333e7d9b5b097cd17afe2() {
  return __cxx_static_address_d82333e7d9b5b097cd17afe2.reference || (__cxx_static_address_d82333e7d9b5b097cd17afe2.reference = {
    __cReference: true,
    get value() { return LIZTROOPJUSTSIT____header_global_1c38c7cae1f4817f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:569
export const LIZTROOPDUCKING____header_global_50c06759811d9b74 = ((((((1744) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2d2071f2cd139295ad090700() {
  return __cxx_static_address_2d2071f2cd139295ad090700.reference || (__cxx_static_address_2d2071f2cd139295ad090700.reference = {
    __cReference: true,
    get value() { return LIZTROOPDUCKING____header_global_50c06759811d9b74; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:570
export const HEADJIB1____header_global_7702872379fe7d65 = ((((((1768) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_283da0ae35771f9e260202cd() {
  return __cxx_static_address_283da0ae35771f9e260202cd.reference || (__cxx_static_address_283da0ae35771f9e260202cd.reference = {
    __cReference: true,
    get value() { return HEADJIB1____header_global_7702872379fe7d65; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:571
export const ARMJIB1____header_global_0d194bdb79f784c2 = ((((((1772) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_26e09f64f634cd9dd57a84c7() {
  return __cxx_static_address_26e09f64f634cd9dd57a84c7.reference || (__cxx_static_address_26e09f64f634cd9dd57a84c7.reference = {
    __cReference: true,
    get value() { return ARMJIB1____header_global_0d194bdb79f784c2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:572
export const LEGJIB1____header_global_4c185a10631333a3 = ((((((1776) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f0ddcabb63a07d91528f06be() {
  return __cxx_static_address_f0ddcabb63a07d91528f06be.reference || (__cxx_static_address_f0ddcabb63a07d91528f06be.reference = {
    __cReference: true,
    get value() { return LEGJIB1____header_global_4c185a10631333a3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:573
export const OCTABRAIN____header_global_a80a0e081bfdbd3a = ((((((1820) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7c643886deeb22103060e49d() {
  return __cxx_static_address_7c643886deeb22103060e49d.reference || (__cxx_static_address_7c643886deeb22103060e49d.reference = {
    __cReference: true,
    get value() { return OCTABRAIN____header_global_a80a0e081bfdbd3a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:574
export const OCTABRAINSTAYPUT____header_global_8cb8dc880a6c9ec0 = ((((((1821) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_959eb71afef2125d3d517dda() {
  return __cxx_static_address_959eb71afef2125d3d517dda.reference || (__cxx_static_address_959eb71afef2125d3d517dda.reference = {
    __cReference: true,
    get value() { return OCTABRAINSTAYPUT____header_global_8cb8dc880a6c9ec0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:575
export const INNERJAW____header_global_c386daa186f54772 = ((((((1860) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_93d552bab600102df066b2e6() {
  return __cxx_static_address_93d552bab600102df066b2e6.reference || (__cxx_static_address_93d552bab600102df066b2e6.reference = {
    __cReference: true,
    get value() { return INNERJAW____header_global_c386daa186f54772; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:576
export const DRONE____header_global_1c773289ef04fda6 = ((((((1880) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eef4a7e9150e098f15319e88() {
  return __cxx_static_address_eef4a7e9150e098f15319e88.reference || (__cxx_static_address_eef4a7e9150e098f15319e88.reference = {
    __cReference: true,
    get value() { return DRONE____header_global_1c773289ef04fda6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:577
export const EXPLOSION2____header_global_56d51f9d2d6a9a72 = ((((((1890) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8ccf0d5c852a06ad8c6b3443() {
  return __cxx_static_address_8ccf0d5c852a06ad8c6b3443.reference || (__cxx_static_address_8ccf0d5c852a06ad8c6b3443.reference = {
    __cReference: true,
    get value() { return EXPLOSION2____header_global_56d51f9d2d6a9a72; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:578
export const COMMANDER____header_global_af33a8b3b92d134c = ((((((1920) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c4f01a887875767aa23485f6() {
  return __cxx_static_address_c4f01a887875767aa23485f6.reference || (__cxx_static_address_c4f01a887875767aa23485f6.reference = {
    __cReference: true,
    get value() { return COMMANDER____header_global_af33a8b3b92d134c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:579
export const COMMANDERSTAYPUT____header_global_86396b75839cdb1b = ((((((1921) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c6194f780b93e2f7b2dc18dd() {
  return __cxx_static_address_c6194f780b93e2f7b2dc18dd.reference || (__cxx_static_address_c6194f780b93e2f7b2dc18dd.reference = {
    __cReference: true,
    get value() { return COMMANDERSTAYPUT____header_global_86396b75839cdb1b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:580
export const RECON____header_global_9e97588e226b8302 = ((((((1960) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c48ca6c572ae37c4af62bce1() {
  return __cxx_static_address_c48ca6c572ae37c4af62bce1.reference || (__cxx_static_address_c48ca6c572ae37c4af62bce1.reference = {
    __cReference: true,
    get value() { return RECON____header_global_9e97588e226b8302; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:581
export const TANK____header_global_cbc075b6a6fc7088 = ((((((1975) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f1fafcd4d9d90c7c06690e8a() {
  return __cxx_static_address_f1fafcd4d9d90c7c06690e8a.reference || (__cxx_static_address_f1fafcd4d9d90c7c06690e8a.reference = {
    __cReference: true,
    get value() { return TANK____header_global_cbc075b6a6fc7088; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:582
export const PIGCOP____header_global_ec343d03ba995f9b = ((((((2000) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_baa9bf6f4ca091484e8f40e4() {
  return __cxx_static_address_baa9bf6f4ca091484e8f40e4.reference || (__cxx_static_address_baa9bf6f4ca091484e8f40e4.reference = {
    __cReference: true,
    get value() { return PIGCOP____header_global_ec343d03ba995f9b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:583
export const PIGCOPSTAYPUT____header_global_89da1503bae55744 = ((((((2001) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4d0de22809628f473ea399d4() {
  return __cxx_static_address_4d0de22809628f473ea399d4.reference || (__cxx_static_address_4d0de22809628f473ea399d4.reference = {
    __cReference: true,
    get value() { return PIGCOPSTAYPUT____header_global_89da1503bae55744; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:584
export const PIGCOPDIVE____header_global_f01cae7b951959d0 = ((((((2045) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_67853dd3eabd7503eec1629f() {
  return __cxx_static_address_67853dd3eabd7503eec1629f.reference || (__cxx_static_address_67853dd3eabd7503eec1629f.reference = {
    __cReference: true,
    get value() { return PIGCOPDIVE____header_global_f01cae7b951959d0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:585
export const LIZMAN____header_global_d9a47c6bebb2e5aa = ((((((2120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6b55cb576587c57d98b14034() {
  return __cxx_static_address_6b55cb576587c57d98b14034.reference || (__cxx_static_address_6b55cb576587c57d98b14034.reference = {
    __cReference: true,
    get value() { return LIZMAN____header_global_d9a47c6bebb2e5aa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:586
export const LIZMANSTAYPUT____header_global_89adfdad1db2e3f6 = ((((((2121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_427214066762959df0bccc52() {
  return __cxx_static_address_427214066762959df0bccc52.reference || (__cxx_static_address_427214066762959df0bccc52.reference = {
    __cReference: true,
    get value() { return LIZMANSTAYPUT____header_global_89adfdad1db2e3f6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:587
export const LIZMANSPITTING____header_global_69b7a5dcf7da5832 = ((((((2150) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_59948e454170f6eb8247c233() {
  return __cxx_static_address_59948e454170f6eb8247c233.reference || (__cxx_static_address_59948e454170f6eb8247c233.reference = {
    __cReference: true,
    get value() { return LIZMANSPITTING____header_global_69b7a5dcf7da5832; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:588
export const LIZMANFEEDING____header_global_4968d04ae98edfa6 = ((((((2160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8be7b2bada8bc1350b86c999() {
  return __cxx_static_address_8be7b2bada8bc1350b86c999.reference || (__cxx_static_address_8be7b2bada8bc1350b86c999.reference = {
    __cReference: true,
    get value() { return LIZMANFEEDING____header_global_4968d04ae98edfa6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:589
export const LIZMANJUMP____header_global_73214acd3b6d9e95 = ((((((2165) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aff49d9a4eb31ecc4bbd9ce7() {
  return __cxx_static_address_aff49d9a4eb31ecc4bbd9ce7.reference || (__cxx_static_address_aff49d9a4eb31ecc4bbd9ce7.reference = {
    __cReference: true,
    get value() { return LIZMANJUMP____header_global_73214acd3b6d9e95; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:590
export const FECES____header_global_01275cabd19250a7 = ((((((2200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_57936014d8243a14d5abe5ff() {
  return __cxx_static_address_57936014d8243a14d5abe5ff.reference || (__cxx_static_address_57936014d8243a14d5abe5ff.reference = {
    __cReference: true,
    get value() { return FECES____header_global_01275cabd19250a7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:591
export const LIZMANHEAD1____header_global_3023184d9a00b0fb = ((((((2201) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_77a59718030c634b35a0fdcf() {
  return __cxx_static_address_77a59718030c634b35a0fdcf.reference || (__cxx_static_address_77a59718030c634b35a0fdcf.reference = {
    __cReference: true,
    get value() { return LIZMANHEAD1____header_global_3023184d9a00b0fb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:592
export const LIZMANARM1____header_global_87c2f8eca07f7e12 = ((((((2205) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e1f6111499da62b00b5118d() {
  return __cxx_static_address_1e1f6111499da62b00b5118d.reference || (__cxx_static_address_1e1f6111499da62b00b5118d.reference = {
    __cReference: true,
    get value() { return LIZMANARM1____header_global_87c2f8eca07f7e12; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:593
export const LIZMANLEG1____header_global_db9be4443165c159 = ((((((2209) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6c964d747962e7f89b6832d2() {
  return __cxx_static_address_6c964d747962e7f89b6832d2.reference || (__cxx_static_address_6c964d747962e7f89b6832d2.reference = {
    __cReference: true,
    get value() { return LIZMANLEG1____header_global_db9be4443165c159; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:594
export const EXPLOSION2BOT____header_global_42de8171cfbc3c2b = ((((((2219) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_927c82774b7abcdcd8cd982c() {
  return __cxx_static_address_927c82774b7abcdcd8cd982c.reference || (__cxx_static_address_927c82774b7abcdcd8cd982c.reference = {
    __cReference: true,
    get value() { return EXPLOSION2BOT____header_global_42de8171cfbc3c2b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:595
export const JIBS1____header_global_90aba6ad5a37a504 = ((((((2245) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6940592e021989a415d7ab99() {
  return __cxx_static_address_6940592e021989a415d7ab99.reference || (__cxx_static_address_6940592e021989a415d7ab99.reference = {
    __cReference: true,
    get value() { return JIBS1____header_global_90aba6ad5a37a504; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:596
export const JIBS2____header_global_3ea1241c0491479c = ((((((2250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7a8829ec420f2a3a2e66bc85() {
  return __cxx_static_address_7a8829ec420f2a3a2e66bc85.reference || (__cxx_static_address_7a8829ec420f2a3a2e66bc85.reference = {
    __cReference: true,
    get value() { return JIBS2____header_global_3ea1241c0491479c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:597
export const JIBS3____header_global_1efdf8e6f6d98bfa = ((((((2255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fdeb3695ef9da49879b74704() {
  return __cxx_static_address_fdeb3695ef9da49879b74704.reference || (__cxx_static_address_fdeb3695ef9da49879b74704.reference = {
    __cReference: true,
    get value() { return JIBS3____header_global_1efdf8e6f6d98bfa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:598
export const JIBS4____header_global_345c90db507a3a99 = ((((((2260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1221912ae6b1a717d143277b() {
  return __cxx_static_address_1221912ae6b1a717d143277b.reference || (__cxx_static_address_1221912ae6b1a717d143277b.reference = {
    __cReference: true,
    get value() { return JIBS4____header_global_345c90db507a3a99; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:599
export const JIBS5____header_global_3dd501774501205e = ((((((2265) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1f854594cc7c304192d16f85() {
  return __cxx_static_address_1f854594cc7c304192d16f85.reference || (__cxx_static_address_1f854594cc7c304192d16f85.reference = {
    __cReference: true,
    get value() { return JIBS5____header_global_3dd501774501205e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:600
export const BURNING____header_global_7cadfaf6b15c8099 = ((((((2270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_59436e8b6465602324a041d4() {
  return __cxx_static_address_59436e8b6465602324a041d4.reference || (__cxx_static_address_59436e8b6465602324a041d4.reference = {
    __cReference: true,
    get value() { return BURNING____header_global_7cadfaf6b15c8099; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:601
export const FIRE____header_global_a16a8d6b5d80d97b = ((((((2271) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c861309bb852b655d60559cf() {
  return __cxx_static_address_c861309bb852b655d60559cf.reference || (__cxx_static_address_c861309bb852b655d60559cf.reference = {
    __cReference: true,
    get value() { return FIRE____header_global_a16a8d6b5d80d97b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:602
export const JIBS6____header_global_1c0baf4446c7f411 = ((((((2286) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_95a5743f8b5f5b341a373f92() {
  return __cxx_static_address_95a5743f8b5f5b341a373f92.reference || (__cxx_static_address_95a5743f8b5f5b341a373f92.reference = {
    __cReference: true,
    get value() { return JIBS6____header_global_1c0baf4446c7f411; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:603
export const BLOODSPLAT1____header_global_b4be522d153577c9 = ((((((2296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_872bf89e0bf79271daffa6d0() {
  return __cxx_static_address_872bf89e0bf79271daffa6d0.reference || (__cxx_static_address_872bf89e0bf79271daffa6d0.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT1____header_global_b4be522d153577c9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:604
export const BLOODSPLAT3____header_global_717ecbf3fe0f6ab9 = ((((((2297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_395de1a2668e06e796418c04() {
  return __cxx_static_address_395de1a2668e06e796418c04.reference || (__cxx_static_address_395de1a2668e06e796418c04.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT3____header_global_717ecbf3fe0f6ab9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:605
export const BLOODSPLAT2____header_global_f24d11fb1c4d1c37 = ((((((2298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c5e90d559895bd0e04395d58() {
  return __cxx_static_address_c5e90d559895bd0e04395d58.reference || (__cxx_static_address_c5e90d559895bd0e04395d58.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT2____header_global_f24d11fb1c4d1c37; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:606
export const BLOODSPLAT4____header_global_5476317bc20b7ea3 = ((((((2299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5e74f8de3c52a2912f8b4df1() {
  return __cxx_static_address_5e74f8de3c52a2912f8b4df1.reference || (__cxx_static_address_5e74f8de3c52a2912f8b4df1.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT4____header_global_5476317bc20b7ea3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:607
export const OOZ____header_global_423b417d67c8441d = ((((((2300) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_34c678740e40b90ccf6558c4() {
  return __cxx_static_address_34c678740e40b90ccf6558c4.reference || (__cxx_static_address_34c678740e40b90ccf6558c4.reference = {
    __cReference: true,
    get value() { return OOZ____header_global_423b417d67c8441d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:608
export const OOZ2____header_global_2feb089a55c03394 = ((((((2309) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e6389508f29e5e4e137b7df2() {
  return __cxx_static_address_e6389508f29e5e4e137b7df2.reference || (__cxx_static_address_e6389508f29e5e4e137b7df2.reference = {
    __cReference: true,
    get value() { return OOZ2____header_global_2feb089a55c03394; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:609
export const WALLBLOOD1____header_global_75fdee62ffcf9781 = ((((((2301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2c2b1274edc352d8da8dff11() {
  return __cxx_static_address_2c2b1274edc352d8da8dff11.reference || (__cxx_static_address_2c2b1274edc352d8da8dff11.reference = {
    __cReference: true,
    get value() { return WALLBLOOD1____header_global_75fdee62ffcf9781; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:610
export const WALLBLOOD2____header_global_6adf188bba2a1f68 = ((((((2302) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_819dfaa15f2fb405bac3b6a7() {
  return __cxx_static_address_819dfaa15f2fb405bac3b6a7.reference || (__cxx_static_address_819dfaa15f2fb405bac3b6a7.reference = {
    __cReference: true,
    get value() { return WALLBLOOD2____header_global_6adf188bba2a1f68; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:611
export const WALLBLOOD3____header_global_18039a143bf8c4fa = ((((((2303) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6939ad070b887d1bd17ca5ad() {
  return __cxx_static_address_6939ad070b887d1bd17ca5ad.reference || (__cxx_static_address_6939ad070b887d1bd17ca5ad.reference = {
    __cReference: true,
    get value() { return WALLBLOOD3____header_global_18039a143bf8c4fa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:612
export const WALLBLOOD4____header_global_c7fe1684a4ccfa59 = ((((((2304) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_60eb7dc96a27b0e4f8076041() {
  return __cxx_static_address_60eb7dc96a27b0e4f8076041.reference || (__cxx_static_address_60eb7dc96a27b0e4f8076041.reference = {
    __cReference: true,
    get value() { return WALLBLOOD4____header_global_c7fe1684a4ccfa59; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:613
export const WALLBLOOD5____header_global_1557b8e316ee6804 = ((((((2305) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_91cdd9892f9592e944b30865() {
  return __cxx_static_address_91cdd9892f9592e944b30865.reference || (__cxx_static_address_91cdd9892f9592e944b30865.reference = {
    __cReference: true,
    get value() { return WALLBLOOD5____header_global_1557b8e316ee6804; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:614
export const WALLBLOOD7____header_global_48607dd10a0c01db = ((((((2307) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a05396934356744d51740b25() {
  return __cxx_static_address_a05396934356744d51740b25.reference || (__cxx_static_address_a05396934356744d51740b25.reference = {
    __cReference: true,
    get value() { return WALLBLOOD7____header_global_48607dd10a0c01db; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:615
export const WALLBLOOD8____header_global_4de864715e88e736 = ((((((2308) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_70d1414c001326c4a6d8bd25() {
  return __cxx_static_address_70d1414c001326c4a6d8bd25.reference || (__cxx_static_address_70d1414c001326c4a6d8bd25.reference = {
    __cReference: true,
    get value() { return WALLBLOOD8____header_global_4de864715e88e736; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:616
export const BURNING2____header_global_f9f89b0cc89f844d = ((((((2310) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_15a7f559edd891259b3d8797() {
  return __cxx_static_address_15a7f559edd891259b3d8797.reference || (__cxx_static_address_15a7f559edd891259b3d8797.reference = {
    __cReference: true,
    get value() { return BURNING2____header_global_f9f89b0cc89f844d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:617
export const FIRE2____header_global_8b70fbfa93f1109f = ((((((2311) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3e64bec06cf9ec379c079e1d() {
  return __cxx_static_address_3e64bec06cf9ec379c079e1d.reference || (__cxx_static_address_3e64bec06cf9ec379c079e1d.reference = {
    __cReference: true,
    get value() { return FIRE2____header_global_8b70fbfa93f1109f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:618
export const CRACKKNUCKLES____header_global_524f89fe017b8d68 = ((((((2324) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a71550c81561159c2a50fd27() {
  return __cxx_static_address_a71550c81561159c2a50fd27.reference || (__cxx_static_address_a71550c81561159c2a50fd27.reference = {
    __cReference: true,
    get value() { return CRACKKNUCKLES____header_global_524f89fe017b8d68; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:619
export const SMALLSMOKE____header_global_52708bae366b557e = ((((((2329) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b17b425131f83714e646b136() {
  return __cxx_static_address_b17b425131f83714e646b136.reference || (__cxx_static_address_b17b425131f83714e646b136.reference = {
    __cReference: true,
    get value() { return SMALLSMOKE____header_global_52708bae366b557e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:620
export const FLOORFLAME____header_global_719a98b6efeb3385 = ((((((2333) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9fc992dc73cb6e7152ca6c06() {
  return __cxx_static_address_9fc992dc73cb6e7152ca6c06.reference || (__cxx_static_address_9fc992dc73cb6e7152ca6c06.reference = {
    __cReference: true,
    get value() { return FLOORFLAME____header_global_719a98b6efeb3385; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:621
export const ROTATEGUN____header_global_040f12b321cf9b67 = ((((((2360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_538a2179762698996d3a599e() {
  return __cxx_static_address_538a2179762698996d3a599e.reference || (__cxx_static_address_538a2179762698996d3a599e.reference = {
    __cReference: true,
    get value() { return ROTATEGUN____header_global_040f12b321cf9b67; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:622
export const GREENSLIME____header_global_553b00c01ab8fecb = ((((((2370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_34a45b6303aee92b93e4bb72() {
  return __cxx_static_address_34a45b6303aee92b93e4bb72.reference || (__cxx_static_address_34a45b6303aee92b93e4bb72.reference = {
    __cReference: true,
    get value() { return GREENSLIME____header_global_553b00c01ab8fecb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:623
export const WATERDRIPSPLASH____header_global_0b773d90ff310859 = ((((((2380) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6f5eed4a58e2e87441a64f41() {
  return __cxx_static_address_6f5eed4a58e2e87441a64f41.reference || (__cxx_static_address_6f5eed4a58e2e87441a64f41.reference = {
    __cReference: true,
    get value() { return WATERDRIPSPLASH____header_global_0b773d90ff310859; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:624
export const SCRAP6____header_global_2bc2d5210f965ec9 = ((((((2390) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d11a724bcb1331c353f7ee3e() {
  return __cxx_static_address_d11a724bcb1331c353f7ee3e.reference || (__cxx_static_address_d11a724bcb1331c353f7ee3e.reference = {
    __cReference: true,
    get value() { return SCRAP6____header_global_2bc2d5210f965ec9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:625
export const SCRAP1____header_global_43c13fc1b89f0f5f = ((((((2400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7d6d378d22e01c38d337587e() {
  return __cxx_static_address_7d6d378d22e01c38d337587e.reference || (__cxx_static_address_7d6d378d22e01c38d337587e.reference = {
    __cReference: true,
    get value() { return SCRAP1____header_global_43c13fc1b89f0f5f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:626
export const SCRAP2____header_global_4e0abcc3f0836f30 = ((((((2404) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7c72d8b45a6b0869baba67bc() {
  return __cxx_static_address_7c72d8b45a6b0869baba67bc.reference || (__cxx_static_address_7c72d8b45a6b0869baba67bc.reference = {
    __cReference: true,
    get value() { return SCRAP2____header_global_4e0abcc3f0836f30; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:627
export const SCRAP3____header_global_a7ceda3233631285 = ((((((2408) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f9b1ab492495e8087459b642() {
  return __cxx_static_address_f9b1ab492495e8087459b642.reference || (__cxx_static_address_f9b1ab492495e8087459b642.reference = {
    __cReference: true,
    get value() { return SCRAP3____header_global_a7ceda3233631285; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:628
export const SCRAP4____header_global_6f87d1595b443e7d = ((((((2412) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_389432703f092643ab860067() {
  return __cxx_static_address_389432703f092643ab860067.reference || (__cxx_static_address_389432703f092643ab860067.reference = {
    __cReference: true,
    get value() { return SCRAP4____header_global_6f87d1595b443e7d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:629
export const SCRAP5____header_global_d52e90255a7203a6 = ((((((2416) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2dc0efc6b88162f852a7e426() {
  return __cxx_static_address_2dc0efc6b88162f852a7e426.reference || (__cxx_static_address_2dc0efc6b88162f852a7e426.reference = {
    __cReference: true,
    get value() { return SCRAP5____header_global_d52e90255a7203a6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:630
export const ORGANTIC____header_global_088378b2c5849fcf = ((((((2420) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1d9967a3c776b8124450f186() {
  return __cxx_static_address_1d9967a3c776b8124450f186.reference || (__cxx_static_address_1d9967a3c776b8124450f186.reference = {
    __cReference: true,
    get value() { return ORGANTIC____header_global_088378b2c5849fcf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:631
export const BETAVERSION____header_global_372bfd7c0ebc8f2e = ((((((2440) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a8a651d0e36cd76bacdaaf28() {
  return __cxx_static_address_a8a651d0e36cd76bacdaaf28.reference || (__cxx_static_address_a8a651d0e36cd76bacdaaf28.reference = {
    __cReference: true,
    get value() { return BETAVERSION____header_global_372bfd7c0ebc8f2e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:632
export const SELECTDIR____header_global_96378792f4edd682 = ((((((2444) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fdaff4d8105e4422c08aa9a0() {
  return __cxx_static_address_fdaff4d8105e4422c08aa9a0.reference || (__cxx_static_address_fdaff4d8105e4422c08aa9a0.reference = {
    __cReference: true,
    get value() { return SELECTDIR____header_global_96378792f4edd682; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:633
export const F1HELP____header_global_d07ef8eca8c0c62a = ((((((2445) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e789396d51caf83548e0dd96() {
  return __cxx_static_address_e789396d51caf83548e0dd96.reference || (__cxx_static_address_e789396d51caf83548e0dd96.reference = {
    __cReference: true,
    get value() { return F1HELP____header_global_d07ef8eca8c0c62a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:634
export const GROWSPARK____header_global_ba629c9e7ed03490 = ((((((2448) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7d8e2dae07dbdeb3e13d6f57() {
  return __cxx_static_address_7d8e2dae07dbdeb3e13d6f57.reference || (__cxx_static_address_7d8e2dae07dbdeb3e13d6f57.reference = {
    __cReference: true,
    get value() { return GROWSPARK____header_global_ba629c9e7ed03490; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:635
export const MENUSCREEN____header_global_38dcd644fed365c3 = ((((((2456) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_99322ef0a84a69d49816fd9c() {
  return __cxx_static_address_99322ef0a84a69d49816fd9c.reference || (__cxx_static_address_99322ef0a84a69d49816fd9c.reference = {
    __cReference: true,
    get value() { return MENUSCREEN____header_global_38dcd644fed365c3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:636
export const MENUBAR____header_global_683adf148ede732e = ((((((2457) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8e766ca67dfbed41440bdbee() {
  return __cxx_static_address_8e766ca67dfbed41440bdbee.reference || (__cxx_static_address_8e766ca67dfbed41440bdbee.reference = {
    __cReference: true,
    get value() { return MENUBAR____header_global_683adf148ede732e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:637
export const KILLSICON____header_global_61f5b6afcb4a7558 = ((((((2458) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8442596a3417204cc695c68d() {
  return __cxx_static_address_8442596a3417204cc695c68d.reference || (__cxx_static_address_8442596a3417204cc695c68d.reference = {
    __cReference: true,
    get value() { return KILLSICON____header_global_61f5b6afcb4a7558; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:638
export const FIRSTAID_ICON____header_global_9b1092b927b61738 = ((((((2460) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8615d09b4fa1a05d8b49faa4() {
  return __cxx_static_address_8615d09b4fa1a05d8b49faa4.reference || (__cxx_static_address_8615d09b4fa1a05d8b49faa4.reference = {
    __cReference: true,
    get value() { return FIRSTAID_ICON____header_global_9b1092b927b61738; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:639
export const HEAT_ICON____header_global_2ad9909fb9c53be8 = ((((((2461) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9c9b74787542444f7550a5b2() {
  return __cxx_static_address_9c9b74787542444f7550a5b2.reference || (__cxx_static_address_9c9b74787542444f7550a5b2.reference = {
    __cReference: true,
    get value() { return HEAT_ICON____header_global_2ad9909fb9c53be8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:640
export const BOTTOMSTATUSBAR____header_global_c9f4c0d27230a2cf = ((((((2462) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0d78835adba1a14eca9d8683() {
  return __cxx_static_address_0d78835adba1a14eca9d8683.reference || (__cxx_static_address_0d78835adba1a14eca9d8683.reference = {
    __cReference: true,
    get value() { return BOTTOMSTATUSBAR____header_global_c9f4c0d27230a2cf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:641
export const BOOT_ICON____header_global_d8f3c41d87df6333 = ((((((2463) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c8021a6bbc426b135f982f63() {
  return __cxx_static_address_c8021a6bbc426b135f982f63.reference || (__cxx_static_address_c8021a6bbc426b135f982f63.reference = {
    __cReference: true,
    get value() { return BOOT_ICON____header_global_d8f3c41d87df6333; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:642
export const FRAGBAR____header_global_967d8e5c621ca050 = ((((((2465) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cb663847fae083ed8fe3abd0() {
  return __cxx_static_address_cb663847fae083ed8fe3abd0.reference || (__cxx_static_address_cb663847fae083ed8fe3abd0.reference = {
    __cReference: true,
    get value() { return FRAGBAR____header_global_967d8e5c621ca050; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:643
export const JETPACK_ICON____header_global_bc7a1890b97d036c = ((((((2467) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ad01eb130bc4b63575a089fb() {
  return __cxx_static_address_ad01eb130bc4b63575a089fb.reference || (__cxx_static_address_ad01eb130bc4b63575a089fb.reference = {
    __cReference: true,
    get value() { return JETPACK_ICON____header_global_bc7a1890b97d036c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:644
export const AIRTANK_ICON____header_global_86d02a18914590e7 = ((((((2468) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dbdb956e3dd2d7915bcfeb50() {
  return __cxx_static_address_dbdb956e3dd2d7915bcfeb50.reference || (__cxx_static_address_dbdb956e3dd2d7915bcfeb50.reference = {
    __cReference: true,
    get value() { return AIRTANK_ICON____header_global_86d02a18914590e7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:645
export const STEROIDS_ICON____header_global_00f26f70a3e2848b = ((((((2469) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_34e56bb506aeeb36daa8f694() {
  return __cxx_static_address_34e56bb506aeeb36daa8f694.reference || (__cxx_static_address_34e56bb506aeeb36daa8f694.reference = {
    __cReference: true,
    get value() { return STEROIDS_ICON____header_global_00f26f70a3e2848b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:646
export const HOLODUKE_ICON____header_global_13ad414eb2eddb99 = ((((((2470) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3910a6b63a826eaacc783822() {
  return __cxx_static_address_3910a6b63a826eaacc783822.reference || (__cxx_static_address_3910a6b63a826eaacc783822.reference = {
    __cReference: true,
    get value() { return HOLODUKE_ICON____header_global_13ad414eb2eddb99; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:647
export const ACCESS_ICON____header_global_99d0e1b4a441f9ec = ((((((2471) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a1552883a9c331a7bb6db644() {
  return __cxx_static_address_a1552883a9c331a7bb6db644.reference || (__cxx_static_address_a1552883a9c331a7bb6db644.reference = {
    __cReference: true,
    get value() { return ACCESS_ICON____header_global_99d0e1b4a441f9ec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:648
export const DIGITALNUM____header_global_fed7e26610c3d1f6 = ((((((2472) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3eade6a6f82ff1a6d8f977e3() {
  return __cxx_static_address_3eade6a6f82ff1a6d8f977e3.reference || (__cxx_static_address_3eade6a6f82ff1a6d8f977e3.reference = {
    __cReference: true,
    get value() { return DIGITALNUM____header_global_fed7e26610c3d1f6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:649
export const DUKECAR____header_global_381c50683d309d73 = ((((((2491) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a521b9a90fcaa1691e53b276() {
  return __cxx_static_address_a521b9a90fcaa1691e53b276.reference || (__cxx_static_address_a521b9a90fcaa1691e53b276.reference = {
    __cReference: true,
    get value() { return DUKECAR____header_global_381c50683d309d73; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:650
export const CAMCORNER____header_global_9168e56c77e6ba35 = ((((((2482) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5c12a2e7db35e85a2a7bba3e() {
  return __cxx_static_address_5c12a2e7db35e85a2a7bba3e.reference || (__cxx_static_address_5c12a2e7db35e85a2a7bba3e.reference = {
    __cReference: true,
    get value() { return CAMCORNER____header_global_9168e56c77e6ba35; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:651
export const CAMLIGHT____header_global_40701fed5e6768f0 = ((((((2484) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4f0a3af492149195e6d5ba9c() {
  return __cxx_static_address_4f0a3af492149195e6d5ba9c.reference || (__cxx_static_address_4f0a3af492149195e6d5ba9c.reference = {
    __cReference: true,
    get value() { return CAMLIGHT____header_global_40701fed5e6768f0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:652
export const SLIDEBAR____header_global_32560b0040fdaa3c = ((((((2489) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_95c612c66d6b8db6733e0273() {
  return __cxx_static_address_95c612c66d6b8db6733e0273.reference || (__cxx_static_address_95c612c66d6b8db6733e0273.reference = {
    __cReference: true,
    get value() { return SLIDEBAR____header_global_32560b0040fdaa3c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:653
export const DREALMS____header_global_fdf65679c3ba8e1c = ((((((2492) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6995cb50c88f202cd4e86c2a() {
  return __cxx_static_address_6995cb50c88f202cd4e86c2a.reference || (__cxx_static_address_6995cb50c88f202cd4e86c2a.reference = {
    __cReference: true,
    get value() { return DREALMS____header_global_fdf65679c3ba8e1c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:654
export const BETASCREEN____header_global_a46ef8c8c3c137aa = ((((((2493) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5cde55f2de02c24eacc9b87c() {
  return __cxx_static_address_5cde55f2de02c24eacc9b87c.reference || (__cxx_static_address_5cde55f2de02c24eacc9b87c.reference = {
    __cReference: true,
    get value() { return BETASCREEN____header_global_a46ef8c8c3c137aa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:655
export const WINDOWBORDER1____header_global_43e9f490d8e950a9 = ((((((2494) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_74d44de4fe8518ff3ff051b9() {
  return __cxx_static_address_74d44de4fe8518ff3ff051b9.reference || (__cxx_static_address_74d44de4fe8518ff3ff051b9.reference = {
    __cReference: true,
    get value() { return WINDOWBORDER1____header_global_43e9f490d8e950a9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:656
export const TEXTBOX____header_global_718c0dde5d8106f4 = ((((((2495) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1a7f2db70d9774c0ab0f1526() {
  return __cxx_static_address_1a7f2db70d9774c0ab0f1526.reference || (__cxx_static_address_1a7f2db70d9774c0ab0f1526.reference = {
    __cReference: true,
    get value() { return TEXTBOX____header_global_718c0dde5d8106f4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:657
export const WINDOWBORDER2____header_global_e424c48728a986d4 = ((((((2496) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5ca28c0117024acd8960f842() {
  return __cxx_static_address_5ca28c0117024acd8960f842.reference || (__cxx_static_address_5ca28c0117024acd8960f842.reference = {
    __cReference: true,
    get value() { return WINDOWBORDER2____header_global_e424c48728a986d4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:658
export const DUKENUKEM____header_global_12cb63eaed737bdd = ((((((2497) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_576f763d152c528c2f0bb80d() {
  return __cxx_static_address_576f763d152c528c2f0bb80d.reference || (__cxx_static_address_576f763d152c528c2f0bb80d.reference = {
    __cReference: true,
    get value() { return DUKENUKEM____header_global_12cb63eaed737bdd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:659
export const THREEDEE____header_global_0fe338d6fc8d5acb = ((((((2498) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e7416ed68b34d04037797c45() {
  return __cxx_static_address_e7416ed68b34d04037797c45.reference || (__cxx_static_address_e7416ed68b34d04037797c45.reference = {
    __cReference: true,
    get value() { return THREEDEE____header_global_0fe338d6fc8d5acb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:660
export const INGAMEDUKETHREEDEE____header_global_072996cb2dbcbdc4 = ((((((2499) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1dce7e23ad33225de4c5a7cc() {
  return __cxx_static_address_1dce7e23ad33225de4c5a7cc.reference || (__cxx_static_address_1dce7e23ad33225de4c5a7cc.reference = {
    __cReference: true,
    get value() { return INGAMEDUKETHREEDEE____header_global_072996cb2dbcbdc4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:661
export const TENSCREEN____header_global_a5fef1a316b684a9 = ((((((2500) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3cdb59088bc0a4f15f9d7743() {
  return __cxx_static_address_3cdb59088bc0a4f15f9d7743.reference || (__cxx_static_address_3cdb59088bc0a4f15f9d7743.reference = {
    __cReference: true,
    get value() { return TENSCREEN____header_global_a5fef1a316b684a9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:662
export const PLUTOPAKSPRITE____header_global_1254232bbb6159ef = ((((((2501) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b159a78a61d45e13b895ceef() {
  return __cxx_static_address_b159a78a61d45e13b895ceef.reference || (__cxx_static_address_b159a78a61d45e13b895ceef.reference = {
    __cReference: true,
    get value() { return PLUTOPAKSPRITE____header_global_1254232bbb6159ef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:663
export const DEVISTATOR____header_global_aa3b9bee6c9c00f8 = ((((((2510) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_05056a29fd677b6e8d7a41c4() {
  return __cxx_static_address_05056a29fd677b6e8d7a41c4.reference || (__cxx_static_address_05056a29fd677b6e8d7a41c4.reference = {
    __cReference: true,
    get value() { return DEVISTATOR____header_global_aa3b9bee6c9c00f8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:664
export const KNEE____header_global_8aec3bf5b36b8182 = ((((((2521) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7a9263f3a0762a43205b4674() {
  return __cxx_static_address_7a9263f3a0762a43205b4674.reference || (__cxx_static_address_7a9263f3a0762a43205b4674.reference = {
    __cReference: true,
    get value() { return KNEE____header_global_8aec3bf5b36b8182; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:665
export const CROSSHAIR____header_global_1639a0a4c66e85ab = ((((((2523) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4d3847d50200ec187bb9db8b() {
  return __cxx_static_address_4d3847d50200ec187bb9db8b.reference || (__cxx_static_address_4d3847d50200ec187bb9db8b.reference = {
    __cReference: true,
    get value() { return CROSSHAIR____header_global_1639a0a4c66e85ab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:666
export const FIRSTGUN____header_global_3631aa087f6dfdcf = ((((((2524) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5834a39f20d99b678bdb8e79() {
  return __cxx_static_address_5834a39f20d99b678bdb8e79.reference || (__cxx_static_address_5834a39f20d99b678bdb8e79.reference = {
    __cReference: true,
    get value() { return FIRSTGUN____header_global_3631aa087f6dfdcf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:667
export const FIRSTGUNRELOAD____header_global_13e7d285053b6c23 = ((((((2528) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8a148b5d3fd596e9a0be759a() {
  return __cxx_static_address_8a148b5d3fd596e9a0be759a.reference || (__cxx_static_address_8a148b5d3fd596e9a0be759a.reference = {
    __cReference: true,
    get value() { return FIRSTGUNRELOAD____header_global_13e7d285053b6c23; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:668
export const SHELL____header_global_70c94ba374fcb706 = ((((((2533) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_faf853c6c052b06c5928e2da() {
  return __cxx_static_address_faf853c6c052b06c5928e2da.reference || (__cxx_static_address_faf853c6c052b06c5928e2da.reference = {
    __cReference: true,
    get value() { return SHELL____header_global_70c94ba374fcb706; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:669
export const SHOTGUNSHELL____header_global_75972cb82156e279 = ((((((2535) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f5661e3bcdc9470d9572d77a() {
  return __cxx_static_address_f5661e3bcdc9470d9572d77a.reference || (__cxx_static_address_f5661e3bcdc9470d9572d77a.reference = {
    __cReference: true,
    get value() { return SHOTGUNSHELL____header_global_75972cb82156e279; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:670
export const CHAINGUN____header_global_9af58c06bbca91ad = ((((((2536) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_555d3be732d9bd64e196695e() {
  return __cxx_static_address_555d3be732d9bd64e196695e.reference || (__cxx_static_address_555d3be732d9bd64e196695e.reference = {
    __cReference: true,
    get value() { return CHAINGUN____header_global_9af58c06bbca91ad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:671
export const RPGGUN____header_global_c1704c78507b02cf = ((((((2544) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c7bcd0d6e0786d7dce39cc9c() {
  return __cxx_static_address_c7bcd0d6e0786d7dce39cc9c.reference || (__cxx_static_address_c7bcd0d6e0786d7dce39cc9c.reference = {
    __cReference: true,
    get value() { return RPGGUN____header_global_c1704c78507b02cf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:672
export const FREEZE____header_global_dd11c5b2b2378a94 = ((((((2548) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ee90c8e0188435fb8a8d6afa() {
  return __cxx_static_address_ee90c8e0188435fb8a8d6afa.reference || (__cxx_static_address_ee90c8e0188435fb8a8d6afa.reference = {
    __cReference: true,
    get value() { return FREEZE____header_global_dd11c5b2b2378a94; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:673
export const SHRINKER____header_global_b9511d7d41cf387e = ((((((2556) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_77f0db1320466e1571a259a5() {
  return __cxx_static_address_77f0db1320466e1571a259a5.reference || (__cxx_static_address_77f0db1320466e1571a259a5.reference = {
    __cReference: true,
    get value() { return SHRINKER____header_global_b9511d7d41cf387e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:674
export const HANDHOLDINGLASER____header_global_a14eb4f671d9e0b8 = ((((((2563) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f6ec7443cd86311adc2def17() {
  return __cxx_static_address_f6ec7443cd86311adc2def17.reference || (__cxx_static_address_f6ec7443cd86311adc2def17.reference = {
    __cReference: true,
    get value() { return HANDHOLDINGLASER____header_global_a14eb4f671d9e0b8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:675
export const TRIPBOMB____header_global_dcc3dc47d9dd7160 = ((((((2566) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e9113a8fa53e3162b9623921() {
  return __cxx_static_address_e9113a8fa53e3162b9623921.reference || (__cxx_static_address_e9113a8fa53e3162b9623921.reference = {
    __cReference: true,
    get value() { return TRIPBOMB____header_global_dcc3dc47d9dd7160; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:676
export const LASERLINE____header_global_9cbf1c06f05456e5 = ((((((2567) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_83e7e821fa1bd1f5ca1cb52e() {
  return __cxx_static_address_83e7e821fa1bd1f5ca1cb52e.reference || (__cxx_static_address_83e7e821fa1bd1f5ca1cb52e.reference = {
    __cReference: true,
    get value() { return LASERLINE____header_global_9cbf1c06f05456e5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:677
export const HANDHOLDINGACCESS____header_global_68a2c219259d3857 = ((((((2568) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_63a2dee6e2e55d3080ce3d21() {
  return __cxx_static_address_63a2dee6e2e55d3080ce3d21.reference || (__cxx_static_address_63a2dee6e2e55d3080ce3d21.reference = {
    __cReference: true,
    get value() { return HANDHOLDINGACCESS____header_global_68a2c219259d3857; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:678
export const HANDREMOTE____header_global_d1a41fa835b8d27e = ((((((2570) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_295c40f4588ec7a8e91b9d81() {
  return __cxx_static_address_295c40f4588ec7a8e91b9d81.reference || (__cxx_static_address_295c40f4588ec7a8e91b9d81.reference = {
    __cReference: true,
    get value() { return HANDREMOTE____header_global_d1a41fa835b8d27e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:679
export const HANDTHROW____header_global_4e5a3eab23b96cec = ((((((2573) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b9ccd1e1ca0ce7fdbbebed5d() {
  return __cxx_static_address_b9ccd1e1ca0ce7fdbbebed5d.reference || (__cxx_static_address_b9ccd1e1ca0ce7fdbbebed5d.reference = {
    __cReference: true,
    get value() { return HANDTHROW____header_global_4e5a3eab23b96cec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:680
export const TIP____header_global_44062701c5eee35c = ((((((2576) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d554fb1dbdcdb0becf816928() {
  return __cxx_static_address_d554fb1dbdcdb0becf816928.reference || (__cxx_static_address_d554fb1dbdcdb0becf816928.reference = {
    __cReference: true,
    get value() { return TIP____header_global_44062701c5eee35c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:681
export const SCUBAMASK____header_global_6b6a0c023c94bd76 = ((((((2581) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f79b225102e4a7259ad4ff73() {
  return __cxx_static_address_f79b225102e4a7259ad4ff73.reference || (__cxx_static_address_f79b225102e4a7259ad4ff73.reference = {
    __cReference: true,
    get value() { return SCUBAMASK____header_global_6b6a0c023c94bd76; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:682
export const FORCESPHERE____header_global_0eba67aed4234140 = ((((((2590) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d5409a941afa06e554ea2400() {
  return __cxx_static_address_d5409a941afa06e554ea2400.reference || (__cxx_static_address_d5409a941afa06e554ea2400.reference = {
    __cReference: true,
    get value() { return FORCESPHERE____header_global_0eba67aed4234140; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:683
export const SHOTSPARK1____header_global_3cabbc0c810489cc = ((((((2595) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_266af7441cdb68b2729444e8() {
  return __cxx_static_address_266af7441cdb68b2729444e8.reference || (__cxx_static_address_266af7441cdb68b2729444e8.reference = {
    __cReference: true,
    get value() { return SHOTSPARK1____header_global_3cabbc0c810489cc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:684
export const RPG____header_global_9ae2c1b18ac6ad95 = ((((((2605) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_06ca296fc5b950783ac2a6ee() {
  return __cxx_static_address_06ca296fc5b950783ac2a6ee.reference || (__cxx_static_address_06ca296fc5b950783ac2a6ee.reference = {
    __cReference: true,
    get value() { return RPG____header_global_9ae2c1b18ac6ad95; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:685
export const LASERSITE____header_global_a2d17a76cc4918e3 = ((((((2612) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bef7d400f8c8b89609347845() {
  return __cxx_static_address_bef7d400f8c8b89609347845.reference || (__cxx_static_address_bef7d400f8c8b89609347845.reference = {
    __cReference: true,
    get value() { return LASERSITE____header_global_a2d17a76cc4918e3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:686
export const SHOTGUN____header_global_eb44a3f4c7e47516 = ((((((2613) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e26f78eab2a3c963ec9d5b8f() {
  return __cxx_static_address_e26f78eab2a3c963ec9d5b8f.reference || (__cxx_static_address_e26f78eab2a3c963ec9d5b8f.reference = {
    __cReference: true,
    get value() { return SHOTGUN____header_global_eb44a3f4c7e47516; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:687
export const BOSS1____header_global_c6a599efc97dce5b = ((((((2630) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_08b52b32639439aea1406c3f() {
  return __cxx_static_address_08b52b32639439aea1406c3f.reference || (__cxx_static_address_08b52b32639439aea1406c3f.reference = {
    __cReference: true,
    get value() { return BOSS1____header_global_c6a599efc97dce5b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:688
export const BOSS1STAYPUT____header_global_1aea1d85cbc2ea35 = ((((((2631) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_edefbc89550c2fdfc9ec19c8() {
  return __cxx_static_address_edefbc89550c2fdfc9ec19c8.reference || (__cxx_static_address_edefbc89550c2fdfc9ec19c8.reference = {
    __cReference: true,
    get value() { return BOSS1STAYPUT____header_global_1aea1d85cbc2ea35; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:689
export const BOSS1SHOOT____header_global_bc87166d71caf8a5 = ((((((2660) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bc5ecd1b80c5df360bbf7985() {
  return __cxx_static_address_bc5ecd1b80c5df360bbf7985.reference || (__cxx_static_address_bc5ecd1b80c5df360bbf7985.reference = {
    __cReference: true,
    get value() { return BOSS1SHOOT____header_global_bc87166d71caf8a5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:690
export const BOSS1LOB____header_global_4b192d4efd2f1c5d = ((((((2670) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cfc153bd37632d128fbd44cd() {
  return __cxx_static_address_cfc153bd37632d128fbd44cd.reference || (__cxx_static_address_cfc153bd37632d128fbd44cd.reference = {
    __cReference: true,
    get value() { return BOSS1LOB____header_global_4b192d4efd2f1c5d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:691
export const BOSSTOP____header_global_a2c3248ceb168e04 = ((((((2696) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e46295a4489ddd0542e48933() {
  return __cxx_static_address_e46295a4489ddd0542e48933.reference || (__cxx_static_address_e46295a4489ddd0542e48933.reference = {
    __cReference: true,
    get value() { return BOSSTOP____header_global_a2c3248ceb168e04; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:692
export const BOSS2____header_global_b170e9e91cbdb1ff = ((((((2710) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0eacf81c40ff85ed1011f825() {
  return __cxx_static_address_0eacf81c40ff85ed1011f825.reference || (__cxx_static_address_0eacf81c40ff85ed1011f825.reference = {
    __cReference: true,
    get value() { return BOSS2____header_global_b170e9e91cbdb1ff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:693
export const BOSS3____header_global_579e7601169a4a24 = ((((((2760) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7f4de6f7a4b9a2253ca7cdf5() {
  return __cxx_static_address_7f4de6f7a4b9a2253ca7cdf5.reference || (__cxx_static_address_7f4de6f7a4b9a2253ca7cdf5.reference = {
    __cReference: true,
    get value() { return BOSS3____header_global_579e7601169a4a24; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:694
export const SPINNINGNUKEICON____header_global_b6d9f7d133bdd486 = ((((((2813) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2c268695b416808d7f432c00() {
  return __cxx_static_address_2c268695b416808d7f432c00.reference || (__cxx_static_address_2c268695b416808d7f432c00.reference = {
    __cReference: true,
    get value() { return SPINNINGNUKEICON____header_global_b6d9f7d133bdd486; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:695
export const SMALLFNTCURSOR____header_global_390aa0924c271df8 = ((((((2821) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_798478869b7cec3c0dc2185f() {
  return __cxx_static_address_798478869b7cec3c0dc2185f.reference || (__cxx_static_address_798478869b7cec3c0dc2185f.reference = {
    __cReference: true,
    get value() { return SMALLFNTCURSOR____header_global_390aa0924c271df8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:696
export const STARTALPHANUM____header_global_693005987eb63af0 = ((((((2822) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9d3bf83c3379bc512391458f() {
  return __cxx_static_address_9d3bf83c3379bc512391458f.reference || (__cxx_static_address_9d3bf83c3379bc512391458f.reference = {
    __cReference: true,
    get value() { return STARTALPHANUM____header_global_693005987eb63af0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:697
export const ENDALPHANUM____header_global_b08f053ed2e40b31 = ((((((2915) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_280ba199308f52f1e6498af6() {
  return __cxx_static_address_280ba199308f52f1e6498af6.reference || (__cxx_static_address_280ba199308f52f1e6498af6.reference = {
    __cReference: true,
    get value() { return ENDALPHANUM____header_global_b08f053ed2e40b31; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:698
export const BIGALPHANUM____header_global_cfd9c3f2c31c9ab6 = ((((((2940) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_adcd22a696b1bdb8dd123d78() {
  return __cxx_static_address_adcd22a696b1bdb8dd123d78.reference || (__cxx_static_address_adcd22a696b1bdb8dd123d78.reference = {
    __cReference: true,
    get value() { return BIGALPHANUM____header_global_cfd9c3f2c31c9ab6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:699
export const BIGPERIOD____header_global_bd4c3f7a49bd9d20 = ((((((3002) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e7d432539c04a8fb98486058() {
  return __cxx_static_address_e7d432539c04a8fb98486058.reference || (__cxx_static_address_e7d432539c04a8fb98486058.reference = {
    __cReference: true,
    get value() { return BIGPERIOD____header_global_bd4c3f7a49bd9d20; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:700
export const BIGCOMMA____header_global_be518f1a4182a909 = ((((((3003) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d394cbc38ce159a2184f155d() {
  return __cxx_static_address_d394cbc38ce159a2184f155d.reference || (__cxx_static_address_d394cbc38ce159a2184f155d.reference = {
    __cReference: true,
    get value() { return BIGCOMMA____header_global_be518f1a4182a909; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:701
export const BIGX____header_global_f96bdca1d48c1806 = ((((((3004) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8560093725e563e43627f593() {
  return __cxx_static_address_8560093725e563e43627f593.reference || (__cxx_static_address_8560093725e563e43627f593.reference = {
    __cReference: true,
    get value() { return BIGX____header_global_f96bdca1d48c1806; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:702
export const BIGQ____header_global_41a0c96cfce33aeb = ((((((3005) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_402759d9e6e956be2db8af78() {
  return __cxx_static_address_402759d9e6e956be2db8af78.reference || (__cxx_static_address_402759d9e6e956be2db8af78.reference = {
    __cReference: true,
    get value() { return BIGQ____header_global_41a0c96cfce33aeb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:703
export const BIGSEMI____header_global_9ac648c65d80e474 = ((((((3006) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2fae5eee7fa3f0b00d67abde() {
  return __cxx_static_address_2fae5eee7fa3f0b00d67abde.reference || (__cxx_static_address_2fae5eee7fa3f0b00d67abde.reference = {
    __cReference: true,
    get value() { return BIGSEMI____header_global_9ac648c65d80e474; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:704
export const BIGCOLIN____header_global_76d75dd84482e891 = ((((((3007) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b413091888be0e68f5345551() {
  return __cxx_static_address_b413091888be0e68f5345551.reference || (__cxx_static_address_b413091888be0e68f5345551.reference = {
    __cReference: true,
    get value() { return BIGCOLIN____header_global_76d75dd84482e891; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:705
export const THREEBYFIVE____header_global_7d0fdebd16a41fd3 = ((((((3010) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f54d89799224e946a7df3558() {
  return __cxx_static_address_f54d89799224e946a7df3558.reference || (__cxx_static_address_f54d89799224e946a7df3558.reference = {
    __cReference: true,
    get value() { return THREEBYFIVE____header_global_7d0fdebd16a41fd3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:706
export const BIGAPPOS____header_global_e5500a65d371c82b = ((((((3022) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_12c5c09e47308fc82e6ad7fd() {
  return __cxx_static_address_12c5c09e47308fc82e6ad7fd.reference || (__cxx_static_address_12c5c09e47308fc82e6ad7fd.reference = {
    __cReference: true,
    get value() { return BIGAPPOS____header_global_e5500a65d371c82b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:707
export const MINIFONT____header_global_87e5cd2edaf36683 = ((((((3072) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5a8754ff0819edcfbb31caf3() {
  return __cxx_static_address_5a8754ff0819edcfbb31caf3.reference || (__cxx_static_address_5a8754ff0819edcfbb31caf3.reference = {
    __cReference: true,
    get value() { return MINIFONT____header_global_87e5cd2edaf36683; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:708
export const RESPAWNMARKERRED____header_global_47ad496349341e70 = ((((((3190) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4634c719aac1adbc0db6bcbc() {
  return __cxx_static_address_4634c719aac1adbc0db6bcbc.reference || (__cxx_static_address_4634c719aac1adbc0db6bcbc.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERRED____header_global_47ad496349341e70; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:709
export const RESPAWNMARKERYELLOW____header_global_79f776c9b3a1e3c6 = ((((((3200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c44b35a3022547640ecdaeaf() {
  return __cxx_static_address_c44b35a3022547640ecdaeaf.reference || (__cxx_static_address_c44b35a3022547640ecdaeaf.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERYELLOW____header_global_79f776c9b3a1e3c6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:710
export const RESPAWNMARKERGREEN____header_global_3e7a5b6418541440 = ((((((3210) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1fce2f0d66c7dfa338ce74be() {
  return __cxx_static_address_1fce2f0d66c7dfa338ce74be.reference || (__cxx_static_address_1fce2f0d66c7dfa338ce74be.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERGREEN____header_global_3e7a5b6418541440; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:711
export const BONUSSCREEN____header_global_85226c43fe51c9c0 = ((((((3240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8971c4f18fefdf8af811a38c() {
  return __cxx_static_address_8971c4f18fefdf8af811a38c.reference || (__cxx_static_address_8971c4f18fefdf8af811a38c.reference = {
    __cReference: true,
    get value() { return BONUSSCREEN____header_global_85226c43fe51c9c0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:712
export const VIEWBORDER____header_global_8795120aa80cd458 = ((((((3250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e032903115779cd220e044e2() {
  return __cxx_static_address_e032903115779cd220e044e2.reference || (__cxx_static_address_e032903115779cd220e044e2.reference = {
    __cReference: true,
    get value() { return VIEWBORDER____header_global_8795120aa80cd458; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:713
export const VICTORY1____header_global_a208ec8db270a199 = ((((((3260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e64d1ae39bfed411e232979c() {
  return __cxx_static_address_e64d1ae39bfed411e232979c.reference || (__cxx_static_address_e64d1ae39bfed411e232979c.reference = {
    __cReference: true,
    get value() { return VICTORY1____header_global_a208ec8db270a199; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:714
export const ORDERING____header_global_ff57acda45d6af39 = ((((((3270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_421c7321c01dafdae4026ffa() {
  return __cxx_static_address_421c7321c01dafdae4026ffa.reference || (__cxx_static_address_421c7321c01dafdae4026ffa.reference = {
    __cReference: true,
    get value() { return ORDERING____header_global_ff57acda45d6af39; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:715
export const TEXTSTORY____header_global_bbfee9d1cd39b2c4 = ((((((3280) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c7bf4ead820f070b5e62a962() {
  return __cxx_static_address_c7bf4ead820f070b5e62a962.reference || (__cxx_static_address_c7bf4ead820f070b5e62a962.reference = {
    __cReference: true,
    get value() { return TEXTSTORY____header_global_bbfee9d1cd39b2c4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:716
export const LOADSCREEN____header_global_bbb9fe3255b38d97 = ((((((3281) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7788d89ff432eaddbaad0118() {
  return __cxx_static_address_7788d89ff432eaddbaad0118.reference || (__cxx_static_address_7788d89ff432eaddbaad0118.reference = {
    __cReference: true,
    get value() { return LOADSCREEN____header_global_bbb9fe3255b38d97; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:717
export const BORNTOBEWILDSCREEN____header_global_2d1fdf61fbb8000d = ((((((3370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_56360289c8e8b1ab28dc415e() {
  return __cxx_static_address_56360289c8e8b1ab28dc415e.reference || (__cxx_static_address_56360289c8e8b1ab28dc415e.reference = {
    __cReference: true,
    get value() { return BORNTOBEWILDSCREEN____header_global_2d1fdf61fbb8000d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:718
export const BLIMP____header_global_0b058ab72bde0c48 = ((((((3400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ce0ad6e3772ca4df13c26b14() {
  return __cxx_static_address_ce0ad6e3772ca4df13c26b14.reference || (__cxx_static_address_ce0ad6e3772ca4df13c26b14.reference = {
    __cReference: true,
    get value() { return BLIMP____header_global_0b058ab72bde0c48; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:719
export const FEM9____header_global_3609e22a07c2e3c1 = ((((((3450) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3fcb3581057ee18a09b724d3() {
  return __cxx_static_address_3fcb3581057ee18a09b724d3.reference || (__cxx_static_address_3fcb3581057ee18a09b724d3.reference = {
    __cReference: true,
    get value() { return FEM9____header_global_3609e22a07c2e3c1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:720
export const FRAMEEFFECT1_13____header_global_23b2076742becacc = ((((((3999) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5cbcd9bc736d765b80acf787() {
  return __cxx_static_address_5cbcd9bc736d765b80acf787.reference || (__cxx_static_address_5cbcd9bc736d765b80acf787.reference = {
    __cReference: true,
    get value() { return FRAMEEFFECT1_13____header_global_23b2076742becacc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:721
export const FRAMEEFFECT1____header_global_8b9b76248175a130 = ((((((4095) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d3c3ec3fe9fb18d2c0e9a712() {
  return __cxx_static_address_d3c3ec3fe9fb18d2c0e9a712.reference || (__cxx_static_address_d3c3ec3fe9fb18d2c0e9a712.reference = {
    __cReference: true,
    get value() { return FRAMEEFFECT1____header_global_8b9b76248175a130; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:722
export const PANNEL3____header_global_8133887f0ee7952e = ((((((4099) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aeff3dd6a66ae694d4ea79c9() {
  return __cxx_static_address_aeff3dd6a66ae694d4ea79c9.reference || (__cxx_static_address_aeff3dd6a66ae694d4ea79c9.reference = {
    __cReference: true,
    get value() { return PANNEL3____header_global_8133887f0ee7952e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:723
export const SCREENBREAK14____header_global_f0cffd439f0196a4 = ((((((4120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e5aa12ff04dca7a7f52cd650() {
  return __cxx_static_address_e5aa12ff04dca7a7f52cd650.reference || (__cxx_static_address_e5aa12ff04dca7a7f52cd650.reference = {
    __cReference: true,
    get value() { return SCREENBREAK14____header_global_f0cffd439f0196a4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:724
export const SCREENBREAK15____header_global_6643d17a04664da5 = ((((((4123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_056c36b1a26e2716a6527f94() {
  return __cxx_static_address_056c36b1a26e2716a6527f94.reference || (__cxx_static_address_056c36b1a26e2716a6527f94.reference = {
    __cReference: true,
    get value() { return SCREENBREAK15____header_global_6643d17a04664da5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:725
export const SCREENBREAK19____header_global_50bee460dca778a5 = ((((((4125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_904c441a2326a4b8df898d97() {
  return __cxx_static_address_904c441a2326a4b8df898d97.reference || (__cxx_static_address_904c441a2326a4b8df898d97.reference = {
    __cReference: true,
    get value() { return SCREENBREAK19____header_global_50bee460dca778a5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:726
export const SCREENBREAK16____header_global_ddc1dc99581eef3a = ((((((4127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8e2ebc3ca14fec814007c35d() {
  return __cxx_static_address_8e2ebc3ca14fec814007c35d.reference || (__cxx_static_address_8e2ebc3ca14fec814007c35d.reference = {
    __cReference: true,
    get value() { return SCREENBREAK16____header_global_ddc1dc99581eef3a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:727
export const SCREENBREAK17____header_global_de6f9218f8640a75 = ((((((4128) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a4ece222c32dd9d30bd1155a() {
  return __cxx_static_address_a4ece222c32dd9d30bd1155a.reference || (__cxx_static_address_a4ece222c32dd9d30bd1155a.reference = {
    __cReference: true,
    get value() { return SCREENBREAK17____header_global_de6f9218f8640a75; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:728
export const SCREENBREAK18____header_global_abe10e33196a41db = ((((((4129) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_45dd78bd0aa048c2818273e8() {
  return __cxx_static_address_45dd78bd0aa048c2818273e8.reference || (__cxx_static_address_45dd78bd0aa048c2818273e8.reference = {
    __cReference: true,
    get value() { return SCREENBREAK18____header_global_abe10e33196a41db; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:729
export const W_TECHWALL11____header_global_a16394292fb3d2c6 = ((((((4130) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1b912adfb7344452e88563df() {
  return __cxx_static_address_1b912adfb7344452e88563df.reference || (__cxx_static_address_1b912adfb7344452e88563df.reference = {
    __cReference: true,
    get value() { return W_TECHWALL11____header_global_a16394292fb3d2c6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:730
export const W_TECHWALL12____header_global_177d3a153f09a57d = ((((((4131) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d78b5718da43a36cd328f06a() {
  return __cxx_static_address_d78b5718da43a36cd328f06a.reference || (__cxx_static_address_d78b5718da43a36cd328f06a.reference = {
    __cReference: true,
    get value() { return W_TECHWALL12____header_global_177d3a153f09a57d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:731
export const W_TECHWALL13____header_global_d6dd8befc04a601a = ((((((4132) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b2fabca9b65196882cc20e69() {
  return __cxx_static_address_b2fabca9b65196882cc20e69.reference || (__cxx_static_address_b2fabca9b65196882cc20e69.reference = {
    __cReference: true,
    get value() { return W_TECHWALL13____header_global_d6dd8befc04a601a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:732
export const W_TECHWALL14____header_global_ab090b4dcfed5a5c = ((((((4133) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dec757e3b95427c990f767eb() {
  return __cxx_static_address_dec757e3b95427c990f767eb.reference || (__cxx_static_address_dec757e3b95427c990f767eb.reference = {
    __cReference: true,
    get value() { return W_TECHWALL14____header_global_ab090b4dcfed5a5c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:733
export const W_TECHWALL5____header_global_69eae90a9d92eff5 = ((((((4134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9d455ea61e2bbf21195bcd4a() {
  return __cxx_static_address_9d455ea61e2bbf21195bcd4a.reference || (__cxx_static_address_9d455ea61e2bbf21195bcd4a.reference = {
    __cReference: true,
    get value() { return W_TECHWALL5____header_global_69eae90a9d92eff5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:734
export const W_TECHWALL6____header_global_5551587e0f68f9e2 = ((((((4136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_381d79629fdfbc1956039ec2() {
  return __cxx_static_address_381d79629fdfbc1956039ec2.reference || (__cxx_static_address_381d79629fdfbc1956039ec2.reference = {
    __cReference: true,
    get value() { return W_TECHWALL6____header_global_5551587e0f68f9e2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:735
export const W_TECHWALL7____header_global_44ce9d8554f3539b = ((((((4138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_83cd93ce0258de37e38c9ea7() {
  return __cxx_static_address_83cd93ce0258de37e38c9ea7.reference || (__cxx_static_address_83cd93ce0258de37e38c9ea7.reference = {
    __cReference: true,
    get value() { return W_TECHWALL7____header_global_44ce9d8554f3539b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:736
export const W_TECHWALL8____header_global_ac667c0a12c1037e = ((((((4140) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c87107f93cab06d2c871f278() {
  return __cxx_static_address_c87107f93cab06d2c871f278.reference || (__cxx_static_address_c87107f93cab06d2c871f278.reference = {
    __cReference: true,
    get value() { return W_TECHWALL8____header_global_ac667c0a12c1037e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:737
export const W_TECHWALL9____header_global_5cfe3e7252028906 = ((((((4142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ce9906ac04a51553ee08e9cf() {
  return __cxx_static_address_ce9906ac04a51553ee08e9cf.reference || (__cxx_static_address_ce9906ac04a51553ee08e9cf.reference = {
    __cReference: true,
    get value() { return W_TECHWALL9____header_global_5cfe3e7252028906; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:738
export const BPANNEL3____header_global_d9dc7c1a7c8de185 = ((((((4100) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2c1b4ff2c1917eb15e9d5d84() {
  return __cxx_static_address_2c1b4ff2c1917eb15e9d5d84.reference || (__cxx_static_address_2c1b4ff2c1917eb15e9d5d84.reference = {
    __cReference: true,
    get value() { return BPANNEL3____header_global_d9dc7c1a7c8de185; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:739
export const W_HITTECHWALL16____header_global_29efc2b44736f9a2 = ((((((4144) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4b6bc56ca3c7faf661d08e33() {
  return __cxx_static_address_4b6bc56ca3c7faf661d08e33.reference || (__cxx_static_address_4b6bc56ca3c7faf661d08e33.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL16____header_global_29efc2b44736f9a2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:740
export const W_HITTECHWALL10____header_global_2af7eef1b67add07 = ((((((4145) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_afa9748d86630249123c6fdb() {
  return __cxx_static_address_afa9748d86630249123c6fdb.reference || (__cxx_static_address_afa9748d86630249123c6fdb.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL10____header_global_2af7eef1b67add07; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:741
export const W_HITTECHWALL15____header_global_84c47e56303eda59 = ((((((4147) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fdb7b9a1f4f88cef3b141e90() {
  return __cxx_static_address_fdb7b9a1f4f88cef3b141e90.reference || (__cxx_static_address_fdb7b9a1f4f88cef3b141e90.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL15____header_global_84c47e56303eda59; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:742
export const W_MILKSHELF____header_global_4292555dd5c10942 = ((((((4181) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eee9ad22393e61783e5fe334() {
  return __cxx_static_address_eee9ad22393e61783e5fe334.reference || (__cxx_static_address_eee9ad22393e61783e5fe334.reference = {
    __cReference: true,
    get value() { return W_MILKSHELF____header_global_4292555dd5c10942; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:743
export const W_MILKSHELFBROKE____header_global_f3790aac28a6cd0a = ((((((4203) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c828ce69fc9fca758dabdb71() {
  return __cxx_static_address_c828ce69fc9fca758dabdb71.reference || (__cxx_static_address_c828ce69fc9fca758dabdb71.reference = {
    __cReference: true,
    get value() { return W_MILKSHELFBROKE____header_global_f3790aac28a6cd0a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:744
export const PURPLELAVA____header_global_fcee3e508dadbe13 = ((((((4240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_89f779014babe3a7c92e9061() {
  return __cxx_static_address_89f779014babe3a7c92e9061.reference || (__cxx_static_address_89f779014babe3a7c92e9061.reference = {
    __cReference: true,
    get value() { return PURPLELAVA____header_global_fcee3e508dadbe13; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:745
export const TARGET____header_global_7c790380d9826d12 = ((((((4359) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b120e685bab302f2f3508262() {
  return __cxx_static_address_b120e685bab302f2f3508262.reference || (__cxx_static_address_b120e685bab302f2f3508262.reference = {
    __cReference: true,
    get value() { return TARGET____header_global_7c790380d9826d12; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:746
export const DUCK____header_global_8d13c9b99568502e = ((((((4361) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f0a530cfaac6ccd4d49af848() {
  return __cxx_static_address_f0a530cfaac6ccd4d49af848.reference || (__cxx_static_address_f0a530cfaac6ccd4d49af848.reference = {
    __cReference: true,
    get value() { return DUCK____header_global_8d13c9b99568502e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:747
export const PUKE____header_global_314f8e12d8a90ecb = ((((((4389) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0c86f3069994c3943c11e5b5() {
  return __cxx_static_address_0c86f3069994c3943c11e5b5.reference || (__cxx_static_address_0c86f3069994c3943c11e5b5.reference = {
    __cReference: true,
    get value() { return PUKE____header_global_314f8e12d8a90ecb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:748
export const DOORTILE23____header_global_2ddcd0f6b7c66bd6 = ((((((4391) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_656204f858eba95fc8f24f05() {
  return __cxx_static_address_656204f858eba95fc8f24f05.reference || (__cxx_static_address_656204f858eba95fc8f24f05.reference = {
    __cReference: true,
    get value() { return DOORTILE23____header_global_2ddcd0f6b7c66bd6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:749
export const SPEAKER____header_global_7bef5544b42de030 = ((((((4397) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4028574e2594b56c38561c69() {
  return __cxx_static_address_4028574e2594b56c38561c69.reference || (__cxx_static_address_4028574e2594b56c38561c69.reference = {
    __cReference: true,
    get value() { return SPEAKER____header_global_7bef5544b42de030; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:750
export const MAIL____header_global_29b415b2b0d7f1b3 = ((((((4410) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_24f35dcfda53f629b0613ce0() {
  return __cxx_static_address_24f35dcfda53f629b0613ce0.reference || (__cxx_static_address_24f35dcfda53f629b0613ce0.reference = {
    __cReference: true,
    get value() { return MAIL____header_global_29b415b2b0d7f1b3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:751
export const HOTMEAT____header_global_af26dab60df1d843 = ((((((4427) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dacb83f6a36d5fb031a646a8() {
  return __cxx_static_address_dacb83f6a36d5fb031a646a8.reference || (__cxx_static_address_dacb83f6a36d5fb031a646a8.reference = {
    __cReference: true,
    get value() { return HOTMEAT____header_global_af26dab60df1d843; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:752
export const TRIPODCAMERA____header_global_4e8ef5932f51d490 = ((((((4444) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e1c7c38ab7ac149a62b4dc6f() {
  return __cxx_static_address_e1c7c38ab7ac149a62b4dc6f.reference || (__cxx_static_address_e1c7c38ab7ac149a62b4dc6f.reference = {
    __cReference: true,
    get value() { return TRIPODCAMERA____header_global_4e8ef5932f51d490; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:753
export const PAPER____header_global_dc677757340654c9 = ((((((4460) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5e44794b3d2ee3e9239298ac() {
  return __cxx_static_address_5e44794b3d2ee3e9239298ac.reference || (__cxx_static_address_5e44794b3d2ee3e9239298ac.reference = {
    __cReference: true,
    get value() { return PAPER____header_global_dc677757340654c9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:754
export const GENERICPOLE2____header_global_3061219239991b4d = ((((((4465) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_760b897de256d49a356cff6e() {
  return __cxx_static_address_760b897de256d49a356cff6e.reference || (__cxx_static_address_760b897de256d49a356cff6e.reference = {
    __cReference: true,
    get value() { return GENERICPOLE2____header_global_3061219239991b4d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:755
export const XXXSTACY____header_global_d5bc510aaf277b44 = ((((((4470) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9934c299a55b97767201a028() {
  return __cxx_static_address_9934c299a55b97767201a028.reference || (__cxx_static_address_9934c299a55b97767201a028.reference = {
    __cReference: true,
    get value() { return XXXSTACY____header_global_d5bc510aaf277b44; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:756
export const LETTER____header_global_558fb51b144fe7fd = ((((((4502) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9a471d347d3ab0c59e41a305() {
  return __cxx_static_address_9a471d347d3ab0c59e41a305.reference || (__cxx_static_address_9a471d347d3ab0c59e41a305.reference = {
    __cReference: true,
    get value() { return LETTER____header_global_558fb51b144fe7fd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:757
export const SIDEBOLT1____header_global_8b1ba2319e6ee6b1 = ((((((4525) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e988850d7bbc6843a99ed33a() {
  return __cxx_static_address_e988850d7bbc6843a99ed33a.reference || (__cxx_static_address_e988850d7bbc6843a99ed33a.reference = {
    __cReference: true,
    get value() { return SIDEBOLT1____header_global_8b1ba2319e6ee6b1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:758
export const FOODOBJECT16____header_global_b37e43faae4f500a = ((((((4545) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_32ab15ab7a9d32d75b91c12b() {
  return __cxx_static_address_32ab15ab7a9d32d75b91c12b.reference || (__cxx_static_address_32ab15ab7a9d32d75b91c12b.reference = {
    __cReference: true,
    get value() { return FOODOBJECT16____header_global_b37e43faae4f500a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:759
export const TAMPON____header_global_4879352efee6ac8f = ((((((4557) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c75581af7376e90ae5423017() {
  return __cxx_static_address_c75581af7376e90ae5423017.reference || (__cxx_static_address_c75581af7376e90ae5423017.reference = {
    __cReference: true,
    get value() { return TAMPON____header_global_4879352efee6ac8f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:760
export const CANWITHSOMETHING2____header_global_34542aeacd41ba9c = ((((((4580) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1791ca51eedc5ce912743b0a() {
  return __cxx_static_address_1791ca51eedc5ce912743b0a.reference || (__cxx_static_address_1791ca51eedc5ce912743b0a.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING2____header_global_34542aeacd41ba9c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:761
export const CANWITHSOMETHING3____header_global_f33fb55c9208ef24 = ((((((4581) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4f47dab3a1e24e30e40e9186() {
  return __cxx_static_address_4f47dab3a1e24e30e40e9186.reference || (__cxx_static_address_4f47dab3a1e24e30e40e9186.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING3____header_global_f33fb55c9208ef24; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:762
export const CANWITHSOMETHING4____header_global_1313a646d5579f82 = ((((((4582) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_125dc82eb9a327af07f68e85() {
  return __cxx_static_address_125dc82eb9a327af07f68e85.reference || (__cxx_static_address_125dc82eb9a327af07f68e85.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING4____header_global_1313a646d5579f82; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:763
export const DOLPHIN1____header_global_9127e2e040eb093d = ((((((4591) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c6aa35e0e82b2c94d91dd4ce() {
  return __cxx_static_address_c6aa35e0e82b2c94d91dd4ce.reference || (__cxx_static_address_c6aa35e0e82b2c94d91dd4ce.reference = {
    __cReference: true,
    get value() { return DOLPHIN1____header_global_9127e2e040eb093d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:764
export const DOLPHIN2____header_global_f54b7e4d6244a809 = ((((((4592) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f2cce5c607bae57d67468d60() {
  return __cxx_static_address_f2cce5c607bae57d67468d60.reference || (__cxx_static_address_f2cce5c607bae57d67468d60.reference = {
    __cReference: true,
    get value() { return DOLPHIN2____header_global_f54b7e4d6244a809; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:765
export const NEWBEAST____header_global_ffb4eb4c36d9ab02 = ((((((4610) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c70ac8eeeda7d5b583fc62ed() {
  return __cxx_static_address_c70ac8eeeda7d5b583fc62ed.reference || (__cxx_static_address_c70ac8eeeda7d5b583fc62ed.reference = {
    __cReference: true,
    get value() { return NEWBEAST____header_global_ffb4eb4c36d9ab02; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:766
export const NEWBEASTSTAYPUT____header_global_cf46f70db45a2adf = ((((((4611) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9ba068fc80629e44163a5661() {
  return __cxx_static_address_9ba068fc80629e44163a5661.reference || (__cxx_static_address_9ba068fc80629e44163a5661.reference = {
    __cReference: true,
    get value() { return NEWBEASTSTAYPUT____header_global_cf46f70db45a2adf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:767
export const BOSS4____header_global_95c9ff4af689c217 = ((((((4740) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e6446a17a29a08953cff7dd3() {
  return __cxx_static_address_e6446a17a29a08953cff7dd3.reference || (__cxx_static_address_e6446a17a29a08953cff7dd3.reference = {
    __cReference: true,
    get value() { return BOSS4____header_global_95c9ff4af689c217; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:768
export const BOSS4STAYPUT____header_global_5d7fa3782d35c150 = ((((((4741) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f04d56ff915c7b0f0de25d4d() {
  return __cxx_static_address_f04d56ff915c7b0f0de25d4d.reference || (__cxx_static_address_f04d56ff915c7b0f0de25d4d.reference = {
    __cReference: true,
    get value() { return BOSS4STAYPUT____header_global_5d7fa3782d35c150; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:769
export const FEM10____header_global_5770d41290f2d54d = ((((((4864) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c1b3f1d0e85176374679b575() {
  return __cxx_static_address_c1b3f1d0e85176374679b575.reference || (__cxx_static_address_c1b3f1d0e85176374679b575.reference = {
    __cReference: true,
    get value() { return FEM10____header_global_5770d41290f2d54d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:770
export const TOUGHGAL____header_global_5a5ccc87986f820e = ((((((4866) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a47a806cc121192527018237() {
  return __cxx_static_address_a47a806cc121192527018237.reference || (__cxx_static_address_a47a806cc121192527018237.reference = {
    __cReference: true,
    get value() { return TOUGHGAL____header_global_5a5ccc87986f820e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:771
export const MAN____header_global_70d7c319e3c64a7a = ((((((4871) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_05ae08e1fff08193cf745ff9() {
  return __cxx_static_address_05ae08e1fff08193cf745ff9.reference || (__cxx_static_address_05ae08e1fff08193cf745ff9.reference = {
    __cReference: true,
    get value() { return MAN____header_global_70d7c319e3c64a7a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:772
export const MAN2____header_global_e38c3059e1672c48 = ((((((4872) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0ea6513df1790da728438b8c() {
  return __cxx_static_address_0ea6513df1790da728438b8c.reference || (__cxx_static_address_0ea6513df1790da728438b8c.reference = {
    __cReference: true,
    get value() { return MAN2____header_global_e38c3059e1672c48; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:773
export const WOMAN____header_global_8c42c88af7fe741b = ((((((4874) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_77f016c4bca813a96975f5fc() {
  return __cxx_static_address_77f016c4bca813a96975f5fc.reference || (__cxx_static_address_77f016c4bca813a96975f5fc.reference = {
    __cReference: true,
    get value() { return WOMAN____header_global_8c42c88af7fe741b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:774
export const NATURALLIGHTNING____header_global_e0f5f2c9e4450b08 = ((((((4890) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bb8605257ef6f1a9bb500dbb() {
  return __cxx_static_address_bb8605257ef6f1a9bb500dbb.reference || (__cxx_static_address_bb8605257ef6f1a9bb500dbb.reference = {
    __cReference: true,
    get value() { return NATURALLIGHTNING____header_global_e0f5f2c9e4450b08; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:775
export const WEATHERWARN____header_global_99a3c00bd57e1918 = ((((((4893) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_17d0fd2b96bf45315bb0e8ef() {
  return __cxx_static_address_17d0fd2b96bf45315bb0e8ef.reference || (__cxx_static_address_17d0fd2b96bf45315bb0e8ef.reference = {
    __cReference: true,
    get value() { return WEATHERWARN____header_global_99a3c00bd57e1918; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:776
export const DUKETAG____header_global_35b2b0fe2c66d630 = ((((((4900) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_27c6a5bbb56b2a41829f9b5c() {
  return __cxx_static_address_27c6a5bbb56b2a41829f9b5c.reference || (__cxx_static_address_27c6a5bbb56b2a41829f9b5c.reference = {
    __cReference: true,
    get value() { return DUKETAG____header_global_35b2b0fe2c66d630; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:777
export const SIGN1____header_global_6a3c61c65804b559 = ((((((4909) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d33f147404fb7c3b4ec38f76() {
  return __cxx_static_address_d33f147404fb7c3b4ec38f76.reference || (__cxx_static_address_d33f147404fb7c3b4ec38f76.reference = {
    __cReference: true,
    get value() { return SIGN1____header_global_6a3c61c65804b559; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:778
export const SIGN2____header_global_7697dff95c25f8c0 = ((((((4912) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8b48da6905ce165f4d1b9f2d() {
  return __cxx_static_address_8b48da6905ce165f4d1b9f2d.reference || (__cxx_static_address_8b48da6905ce165f4d1b9f2d.reference = {
    __cReference: true,
    get value() { return SIGN2____header_global_7697dff95c25f8c0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:779
export const JURYGUY____header_global_1bb78f3b813d9962 = ((((((4943) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eff00a43e091662a6cf64c00() {
  return __cxx_static_address_eff00a43e091662a6cf64c00.reference || (__cxx_static_address_eff00a43e091662a6cf64c00.reference = {
    __cReference: true,
    get value() { return JURYGUY____header_global_1bb78f3b813d9962; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:780
export const WIDESCREENSTATUSBAR____header_global_e87de431912db78a = ((((((5120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_36b1a3a81ab3e983f563dd57() {
  return __cxx_static_address_36b1a3a81ab3e983f563dd57.reference || (__cxx_static_address_36b1a3a81ab3e983f563dd57.reference = {
    __cReference: true,
    get value() { return WIDESCREENSTATUSBAR____header_global_e87de431912db78a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:781
export const RPGGUNWIDE____header_global_156f4fbd408f72cc = ((((((5121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_655fbf7d70d4c029979bf989() {
  return __cxx_static_address_655fbf7d70d4c029979bf989.reference || (__cxx_static_address_655fbf7d70d4c029979bf989.reference = {
    __cReference: true,
    get value() { return RPGGUNWIDE____header_global_156f4fbd408f72cc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:782
export const FIRSTGUNRELOADWIDE____header_global_302f2f9cca2ef485 = ((((((5122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_194673003676f844f1cff23d() {
  return __cxx_static_address_194673003676f844f1cff23d.reference || (__cxx_static_address_194673003676f844f1cff23d.reference = {
    __cReference: true,
    get value() { return FIRSTGUNRELOADWIDE____header_global_302f2f9cca2ef485; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:783
export const FREEZEWIDE____header_global_790c3625e1c362d6 = ((((((5123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_751746d9eba20a2af19764e6() {
  return __cxx_static_address_751746d9eba20a2af19764e6.reference || (__cxx_static_address_751746d9eba20a2af19764e6.reference = {
    __cReference: true,
    get value() { return FREEZEWIDE____header_global_790c3625e1c362d6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:784
export const FREEZEFIREWIDE____header_global_cd4a6b21331047ea = ((((((5124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_51cc8792f24336ccc5652c88() {
  return __cxx_static_address_51cc8792f24336ccc5652c88.reference || (__cxx_static_address_51cc8792f24336ccc5652c88.reference = {
    __cReference: true,
    get value() { return FREEZEFIREWIDE____header_global_cd4a6b21331047ea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:785
export const SHRINKERWIDE____header_global_571597f2cf27f621 = ((((((5127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_08ca66c213eb457450ff39f3() {
  return __cxx_static_address_08ca66c213eb457450ff39f3.reference || (__cxx_static_address_08ca66c213eb457450ff39f3.reference = {
    __cReference: true,
    get value() { return SHRINKERWIDE____header_global_571597f2cf27f621; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:786
export const CRACKKNUCKLESWIDE____header_global_8dc11371058c80c1 = ((((((5129) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2e9a4ba5c794f726a9e6c058() {
  return __cxx_static_address_2e9a4ba5c794f726a9e6c058.reference || (__cxx_static_address_2e9a4ba5c794f726a9e6c058.reference = {
    __cReference: true,
    get value() { return CRACKKNUCKLESWIDE____header_global_8dc11371058c80c1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:787
export const FLAMETHROWERSPRITE____header_global_3fb7c4a055682d1a = ((((((5134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_579261669fba5f471f315342() {
  return __cxx_static_address_579261669fba5f471f315342.reference || (__cxx_static_address_579261669fba5f471f315342.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERSPRITE____header_global_3fb7c4a055682d1a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:788
export const FLAMETHROWERAMMO____header_global_b9f7139bb847628d = ((((((5135) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1ac42bd2134d63f879b77a47() {
  return __cxx_static_address_1ac42bd2134d63f879b77a47.reference || (__cxx_static_address_1ac42bd2134d63f879b77a47.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERAMMO____header_global_b9f7139bb847628d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:789
export const FLAMETHROWER____header_global_73bc7c2f8a0d992e = ((((((5138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8dc54eb81c9e116d1a982d08() {
  return __cxx_static_address_8dc54eb81c9e116d1a982d08.reference || (__cxx_static_address_8dc54eb81c9e116d1a982d08.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER____header_global_73bc7c2f8a0d992e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:790
export const FLAMETHROWERFIRE____header_global_40b0ad851f96b34d = ((((((5139) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4c7835650895b9098390decb() {
  return __cxx_static_address_4c7835650895b9098390decb.reference || (__cxx_static_address_4c7835650895b9098390decb.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERFIRE____header_global_40b0ad851f96b34d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:791
export const FLAMETHROWERFLAME____header_global_a74e82640e1fd741 = ((((((1891) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_92439902a38cb537bf0f7ff8() {
  return __cxx_static_address_92439902a38cb537bf0f7ff8.reference || (__cxx_static_address_92439902a38cb537bf0f7ff8.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERFLAME____header_global_a74e82640e1fd741; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:792
export const FLAMETHROWERPILOT____header_global_52672e2ec0afca5c = ((((((5174) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ddfe3b1e404e1056b966a850() {
  return __cxx_static_address_ddfe3b1e404e1056b966a850.reference || (__cxx_static_address_ddfe3b1e404e1056b966a850.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERPILOT____header_global_52672e2ec0afca5c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:793
export const FIREBALL____header_global_35a0d7f752c4b20e = ((((((5163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_879a9f760be4030935b31386() {
  return __cxx_static_address_879a9f760be4030935b31386.reference || (__cxx_static_address_879a9f760be4030935b31386.reference = {
    __cReference: true,
    get value() { return FIREBALL____header_global_35a0d7f752c4b20e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:794
export const ONFIRE____header_global_d795ef25021621c8 = ((((((5152) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0724a0517e242e4ef2c191cc() {
  return __cxx_static_address_0724a0517e242e4ef2c191cc.reference || (__cxx_static_address_0724a0517e242e4ef2c191cc.reference = {
    __cReference: true,
    get value() { return ONFIRE____header_global_d795ef25021621c8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:795
export const ONFIRESMOKE____header_global_e390fc0892283e4d = ((((((5143) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_592173a12bffc5a298432a4c() {
  return __cxx_static_address_592173a12bffc5a298432a4c.reference || (__cxx_static_address_592173a12bffc5a298432a4c.reference = {
    __cReference: true,
    get value() { return ONFIRESMOKE____header_global_e390fc0892283e4d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:796
export const BURNEDCORPSE____header_global_9220ea5895318a53 = ((((((5173) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ae4d38121a2ed97eac2d1e50() {
  return __cxx_static_address_ae4d38121a2ed97eac2d1e50.reference || (__cxx_static_address_ae4d38121a2ed97eac2d1e50.reference = {
    __cReference: true,
    get value() { return BURNEDCORPSE____header_global_9220ea5895318a53; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:797
export const WHISPYSMOKE____header_global_9d18b0b76e9b7ae2 = ((((((5268) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_40a9349ff5c690810a5c0d0c() {
  return __cxx_static_address_40a9349ff5c690810a5c0d0c.reference || (__cxx_static_address_40a9349ff5c690810a5c0d0c.reference = {
    __cReference: true,
    get value() { return WHISPYSMOKE____header_global_9d18b0b76e9b7ae2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:798
export const FIREFLY____header_global_73dead87cfd31d1f = ((((((5180) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c33cec6cc64ecf2d933cefe4() {
  return __cxx_static_address_c33cec6cc64ecf2d933cefe4.reference || (__cxx_static_address_c33cec6cc64ecf2d933cefe4.reference = {
    __cReference: true,
    get value() { return FIREFLY____header_global_73dead87cfd31d1f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:799
export const FIREFLYSHRINKEFFECT____header_global_f758063aa7b03a3c = ((((((5360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5f8e9ecfbc5ae365f51b23bc() {
  return __cxx_static_address_5f8e9ecfbc5ae365f51b23bc.reference || (__cxx_static_address_5f8e9ecfbc5ae365f51b23bc.reference = {
    __cReference: true,
    get value() { return FIREFLYSHRINKEFFECT____header_global_f758063aa7b03a3c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:800
export const FIREFLYGROWEFFECT____header_global_aeab9ae2029ea88f = ((((((5367) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9b04d034c06185416e63fa1b() {
  return __cxx_static_address_9b04d034c06185416e63fa1b.reference || (__cxx_static_address_9b04d034c06185416e63fa1b.reference = {
    __cReference: true,
    get value() { return FIREFLYGROWEFFECT____header_global_aeab9ae2029ea88f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:801
export const FIREFLYFLYINGEFFECT____header_global_47ab68317e547e94 = ((((((5296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9601302199f5a11cb8674ab7() {
  return __cxx_static_address_9601302199f5a11cb8674ab7.reference || (__cxx_static_address_9601302199f5a11cb8674ab7.reference = {
    __cReference: true,
    get value() { return FIREFLYFLYINGEFFECT____header_global_47ab68317e547e94; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:802
export const BOSS5____header_global_511e9fbafd1c8e9e = ((((((5310) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b1b0f0d2d12875c01e9c0d8d() {
  return __cxx_static_address_b1b0f0d2d12875c01e9c0d8d.reference || (__cxx_static_address_b1b0f0d2d12875c01e9c0d8d.reference = {
    __cReference: true,
    get value() { return BOSS5____header_global_511e9fbafd1c8e9e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:803
export const BOSS5STAYPUT____header_global_fee0755591ff285b = ((((((5311) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a26419456d72296ed9c7e039() {
  return __cxx_static_address_a26419456d72296ed9c7e039.reference || (__cxx_static_address_a26419456d72296ed9c7e039.reference = {
    __cReference: true,
    get value() { return BOSS5STAYPUT____header_global_fee0755591ff285b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:804
export const LAVAPOOL____header_global_4dd37fa657836e52 = ((((((5304) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0738fbfbfd3e549ef427f2aa() {
  return __cxx_static_address_0738fbfbfd3e549ef427f2aa.reference || (__cxx_static_address_0738fbfbfd3e549ef427f2aa.reference = {
    __cReference: true,
    get value() { return LAVAPOOL____header_global_4dd37fa657836e52; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:805
export const LAVASPLASH____header_global_33eeacb62781bd57 = ((((((5371) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4576dd9e855bb4caeb952334() {
  return __cxx_static_address_4576dd9e855bb4caeb952334.reference || (__cxx_static_address_4576dd9e855bb4caeb952334.reference = {
    __cReference: true,
    get value() { return LAVASPLASH____header_global_33eeacb62781bd57; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:806
export const LAVAPOOLBUBBLE____header_global_5544ae874fe2c618 = ((((((5207) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c2e4307291c56dac584db624() {
  return __cxx_static_address_c2e4307291c56dac584db624.reference || (__cxx_static_address_c2e4307291c56dac584db624.reference = {
    __cReference: true,
    get value() { return LAVAPOOLBUBBLE____header_global_5544ae874fe2c618; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:807
export const BOSS2STAYPUT____header_global_7e56d6d14d0a2032 = ((((((2711) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_35a8475fe33e8f3e2b22d77e() {
  return __cxx_static_address_35a8475fe33e8f3e2b22d77e.reference || (__cxx_static_address_35a8475fe33e8f3e2b22d77e.reference = {
    __cReference: true,
    get value() { return BOSS2STAYPUT____header_global_7e56d6d14d0a2032; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:808
export const BOSS3STAYPUT____header_global_a14cd5c3364e0e8d = ((((((2761) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b537a5644c3b86f8b0e34d58() {
  return __cxx_static_address_b537a5644c3b86f8b0e34d58.reference || (__cxx_static_address_b537a5644c3b86f8b0e34d58.reference = {
    __cReference: true,
    get value() { return BOSS3STAYPUT____header_global_a14cd5c3364e0e8d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:809
export const E32_TILE5736____header_global_0a944deb85c750ae = ((((((5736) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f86366f00fa3b44034e11e66() {
  return __cxx_static_address_f86366f00fa3b44034e11e66.reference || (__cxx_static_address_f86366f00fa3b44034e11e66.reference = {
    __cReference: true,
    get value() { return E32_TILE5736____header_global_0a944deb85c750ae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:810
export const E32_TILE5737____header_global_972eaadf9a514f6b = ((((((5737) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7e4804a040e287d29b207757() {
  return __cxx_static_address_7e4804a040e287d29b207757.reference || (__cxx_static_address_7e4804a040e287d29b207757.reference = {
    __cReference: true,
    get value() { return E32_TILE5737____header_global_972eaadf9a514f6b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:811
export const E32_TILE5846____header_global_9362fa2b225ce31c = ((((((5846) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dc73f1465c7fd06f86ddfc02() {
  return __cxx_static_address_dc73f1465c7fd06f86ddfc02.reference || (__cxx_static_address_dc73f1465c7fd06f86ddfc02.reference = {
    __cReference: true,
    get value() { return E32_TILE5846____header_global_9362fa2b225ce31c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/network.h:180
export const cSnapshotMemUsage__header_global_c301eb968ddeab10 = u64((BigInt(u64(64)) * BigInt((BigInt((BigInt((BigInt(72) * BigInt(u64(16384)))) + BigInt((BigInt(96) * BigInt(u64(4096)))))) + BigInt((BigInt(296) * BigInt(u64(16384))))))));
function __cxx_static_address_0d2c4a46944085f863a5dd5a() {
  return __cxx_static_address_0d2c4a46944085f863a5dd5a.reference || (__cxx_static_address_0d2c4a46944085f863a5dd5a.reference = {
    __cReference: true,
    get value() { return cSnapshotMemUsage__header_global_c301eb968ddeab10; },
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

// C/C++ source: source/build/include/vec.h:9
export function __cxx_record_vec2_2150e186aab2ebda() {
  return __cxx_record_vec2_2150e186aab2ebda.type || (__cxx_record_vec2_2150e186aab2ebda.type = class __cxx_record_vec2_2150e186aab2ebda__implementation {
  constructor() {
    this.x = undefined;
    this.y = undefined;
  }
  __cxx_operator_66576fdc1cbe3c95(c) {
    return Boolean(Boolean(i32((i32((this.x != c.x)) | i32((this.y != c.y))))));
  }
});
}

// C/C++ source: source/duke3d/src/gameexec.cpp:56
export let vm = cZeroAggregate({"pointerAliases": [["pSprite", "pUSprite"]], "record": {"flags": {"scalar": "int"}, "pActor": {"pointer": true}, "pData": {"pointer": true}, "pPlayer": {"pointer": true}, "pSprite": {"pointer": true}, "pUSprite": {"pointer": true}, "playerDist": {"scalar": "int"}, "playerNum": {"scalar": "int"}, "spriteNum": {"scalar": "int"}}});
export function __cxx_global_cell_5bce98f73f3ed0c837f2729e() {
  return __cxx_global_cell_5bce98f73f3ed0c837f2729e.reference || (__cxx_global_cell_5bce98f73f3ed0c837f2729e.reference = {
    __cReference: true,
    get value() { return vm; },
    set value(__cxx_lvalue_0) { throw new TypeError("record address cannot replace original object storage"); }
  });
}

// C/C++ source: source/duke3d/src/gameexec.cpp:58
export let g_tw = 0;
export function __cxx_global_cell_34a2426c22a51b0e2d5bc428() {
  return __cxx_global_cell_34a2426c22a51b0e2d5bc428.reference || (__cxx_global_cell_34a2426c22a51b0e2d5bc428.reference = {
    __cReference: true,
    get value() { return g_tw; },
    set value(__cxx_lvalue_0) { g_tw = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/gameexec.cpp:59
export let g_currentEvent = i32((-1));
export function __cxx_global_cell_21076f22805c1a4afdf49a3b() {
  return __cxx_global_cell_21076f22805c1a4afdf49a3b.reference || (__cxx_global_cell_21076f22805c1a4afdf49a3b.reference = {
    __cReference: true,
    get value() { return g_currentEvent; },
    set value(__cxx_lvalue_0) { g_currentEvent = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/gameexec.cpp:61
export let insptr = null;
export function __cxx_global_cell_f5596e70af51a8f811191c88() {
  return __cxx_global_cell_f5596e70af51a8f811191c88.reference || (__cxx_global_cell_f5596e70af51a8f811191c88.reference = {
    __cReference: true,
    get value() { return insptr; },
    set value(__cxx_lvalue_0) { insptr = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/duke3d/src/gameexec.cpp:63
export let g_returnVarID = i32((-1));
export function __cxx_global_cell_c678e52b13334e9e7bc849c7() {
  return __cxx_global_cell_c678e52b13334e9e7bc849c7.reference || (__cxx_global_cell_c678e52b13334e9e7bc849c7.reference = {
    __cReference: true,
    get value() { return g_returnVarID; },
    set value(__cxx_lvalue_0) { g_returnVarID = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/gameexec.cpp:64
export let g_weaponVarID = i32((-1));
export function __cxx_global_cell_45ddacb09c392d11509ee34d() {
  return __cxx_global_cell_45ddacb09c392d11509ee34d.reference || (__cxx_global_cell_45ddacb09c392d11509ee34d.reference = {
    __cReference: true,
    get value() { return g_weaponVarID; },
    set value(__cxx_lvalue_0) { g_weaponVarID = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/gameexec.cpp:65
export let g_worksLikeVarID = i32((-1));
export function __cxx_global_cell_1df1f46e4b2568a8a654e9c0() {
  return __cxx_global_cell_1df1f46e4b2568a8a654e9c0.reference || (__cxx_global_cell_1df1f46e4b2568a8a654e9c0.reference = {
    __cReference: true,
    get value() { return g_worksLikeVarID; },
    set value(__cxx_lvalue_0) { g_worksLikeVarID = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/gameexec.cpp:66
export let g_zRangeVarID = i32((-1));
export function __cxx_global_cell_e7fcc5c72e2d2e84961a365b() {
  return __cxx_global_cell_e7fcc5c72e2d2e84961a365b.reference || (__cxx_global_cell_e7fcc5c72e2d2e84961a365b.reference = {
    __cReference: true,
    get value() { return g_zRangeVarID; },
    set value(__cxx_lvalue_0) { g_zRangeVarID = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/gameexec.cpp:67
export let g_angRangeVarID = i32((-1));
export function __cxx_global_cell_ce6bb4f887d04c88630810d5() {
  return __cxx_global_cell_ce6bb4f887d04c88630810d5.reference || (__cxx_global_cell_ce6bb4f887d04c88630810d5.reference = {
    __cReference: true,
    get value() { return g_angRangeVarID; },
    set value(__cxx_lvalue_0) { g_angRangeVarID = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/gameexec.cpp:68
export let g_aimAngleVarID = i32((-1));
export function __cxx_global_cell_6c5be91f7378fd386b06661c() {
  return __cxx_global_cell_6c5be91f7378fd386b06661c.reference || (__cxx_global_cell_6c5be91f7378fd386b06661c.reference = {
    __cReference: true,
    get value() { return g_aimAngleVarID; },
    set value(__cxx_lvalue_0) { g_aimAngleVarID = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/gameexec.cpp:69
export let g_lotagVarID = i32((-1));
export function __cxx_global_cell_0f90457476f96a3df84f4b22() {
  return __cxx_global_cell_0f90457476f96a3df84f4b22.reference || (__cxx_global_cell_0f90457476f96a3df84f4b22.reference = {
    __cReference: true,
    get value() { return g_lotagVarID; },
    set value(__cxx_lvalue_0) { g_lotagVarID = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/gameexec.cpp:70
export let g_hitagVarID = i32((-1));
export function __cxx_global_cell_3563768f205740dd55d336af() {
  return __cxx_global_cell_3563768f205740dd55d336af.reference || (__cxx_global_cell_3563768f205740dd55d336af.reference = {
    __cReference: true,
    get value() { return g_hitagVarID; },
    set value(__cxx_lvalue_0) { g_hitagVarID = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/gameexec.cpp:71
export let g_textureVarID = i32((-1));
export function __cxx_global_cell_f8e20a9f1720b173041f8f59() {
  return __cxx_global_cell_f8e20a9f1720b173041f8f59.reference || (__cxx_global_cell_f8e20a9f1720b173041f8f59.reference = {
    __cReference: true,
    get value() { return g_textureVarID; },
    set value(__cxx_lvalue_0) { g_textureVarID = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_27c945505c3c6796 = i32(2147483647);
function __cxx_static_address_a1b60bd5d301e5dc380bdfe8() {
  return __cxx_static_address_a1b60bd5d301e5dc380bdfe8.reference || (__cxx_static_address_a1b60bd5d301e5dc380bdfe8.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_27c945505c3c6796; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_31ec00966df25c47 = i32(2147483648);
function __cxx_static_address_4e9ae11f87083057e303dfaa() {
  return __cxx_static_address_4e9ae11f87083057e303dfaa.reference || (__cxx_static_address_4e9ae11f87083057e303dfaa.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_31ec00966df25c47; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_4b8184204da45060 = i32(2147483648);
function __cxx_static_address_7e0a60231c14297bc74f1833() {
  return __cxx_static_address_7e0a60231c14297bc74f1833.reference || (__cxx_static_address_7e0a60231c14297bc74f1833.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_4b8184204da45060; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_88a3243967179765 = i32(65536);
function __cxx_static_address_28215ce0711b726a69defd7b() {
  return __cxx_static_address_28215ce0711b726a69defd7b.reference || (__cxx_static_address_28215ce0711b726a69defd7b.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_88a3243967179765; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_f281d93f5a8852a5 = i32(32768);
function __cxx_static_address_567acc23c56078605012a06b() {
  return __cxx_static_address_567acc23c56078605012a06b.reference || (__cxx_static_address_567acc23c56078605012a06b.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_f281d93f5a8852a5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_a7515bffe74c11f8 = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_107f80f6c1cfe21a1c3d199b() {
  return __cxx_static_address_107f80f6c1cfe21a1c3d199b.reference || (__cxx_static_address_107f80f6c1cfe21a1c3d199b.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_a7515bffe74c11f8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/vec.h:25
export function __cxx_record_vec3_82cfac1168cb3a1b() {
  return __cxx_record_vec3_82cfac1168cb3a1b.type || (__cxx_record_vec3_82cfac1168cb3a1b.type = class __cxx_record_vec3_82cfac1168cb3a1b__implementation {
  constructor() {
    return Object.setPrototypeOf(cZeroAggregate({"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "prototype": "__cxx_record_vec3_82cfac1168cb3a1b", "size": 12, "union": false}}, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype, "__cxx_record_vec3_82cfac1168cb3a1b": () => __cxx_record_vec3_82cfac1168cb3a1b().prototype}), new.target.prototype);
  }
  __cxx_operator_7522eb631b3dbf1c(c) {
    return Boolean(Boolean(i32((i32((i32((this.__cxx_anonymous_0.__cxx_anonymous_0.x != c.__cxx_anonymous_0.__cxx_anonymous_0.x)) | i32((this.__cxx_anonymous_0.__cxx_anonymous_0.y != c.__cxx_anonymous_0.__cxx_anonymous_0.y)))) | i32((this.__cxx_anonymous_0.__cxx_anonymous_0.z != c.__cxx_anonymous_0.__cxx_anonymous_0.z))))));
  }
});
}

// C/C++ source: source/duke3d/src/gameexec.cpp:72
export let g_thisActorVarID = i32((-1));
export function __cxx_global_cell_d034c01693142b00a1d9d58d() {
  return __cxx_global_cell_d034c01693142b00a1d9d58d.reference || (__cxx_global_cell_d034c01693142b00a1d9d58d.reference = {
    __cReference: true,
    get value() { return g_thisActorVarID; },
    set value(__cxx_lvalue_0) { g_thisActorVarID = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/gameexec.cpp:73
export let g_structVarIDs = i32((-1));
export function __cxx_global_cell_17d0aa5e9c4fd0d0dc19533e() {
  return __cxx_global_cell_17d0aa5e9c4fd0d0dc19533e.reference || (__cxx_global_cell_17d0aa5e9c4fd0d0dc19533e.reference = {
    __cReference: true,
    get value() { return g_structVarIDs; },
    set value(__cxx_lvalue_0) { g_structVarIDs = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/gameexec.cpp:142
export let apScriptEvents = new BigInt64Array(164);
function __cxx_static_address_3503e715f3a18f8448b8e65b() {
  return __cxx_static_address_3503e715f3a18f8448b8e65b.reference || (__cxx_static_address_3503e715f3a18f8448b8e65b.reference = {
    __cReference: true,
    get value() { return apScriptEvents; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/gameexec.cpp:144
export let dummy_sprite = cZeroAggregate({"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "prototype": "__cxx_record_vec3_82cfac1168cb3a1b", "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}}, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype, "__cxx_record_vec3_82cfac1168cb3a1b": () => __cxx_record_vec3_82cfac1168cb3a1b().prototype});
function __cxx_static_address_879d6d6a5bc25dd24dd22c4c() {
  return __cxx_static_address_879d6d6a5bc25dd24dd22c4c.reference || (__cxx_static_address_879d6d6a5bc25dd24dd22c4c.reference = {
    __cReference: true,
    get value() { return dummy_sprite; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/gameexec.cpp:145
export let dummy_actor = cZeroAggregate({"byteRecord": {"align": 1, "arrayAlign": 4, "fields": {"bpos": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "prototype": "__cxx_record_vec3_82cfac1168cb3a1b", "size": 12, "union": false}, "offset": 44}, "ceilingz": {"native": "Int32Array", "offset": 60, "size": 4}, "cgg": {"native": "Uint8Array", "offset": 94, "size": 1}, "dispicnum": {"native": "Int16Array", "offset": 92, "size": 2}, "filler": {"length": 2, "native": "Uint8Array", "offset": 90, "size": 2}, "flags": {"native": "Uint32Array", "offset": 40, "size": 4}, "floorz": {"native": "Int32Array", "offset": 56, "size": 4}, "floorzoffset": {"native": "Int8Array", "offset": 88, "size": 1}, "htang": {"native": "Int16Array", "offset": 74, "size": 2}, "htextra": {"native": "Int16Array", "offset": 76, "size": 2}, "htowner": {"native": "Int16Array", "offset": 78, "size": 2}, "htpicnum": {"native": "Int16Array", "offset": 72, "size": 2}, "lasttransport": {"native": "Uint8Array", "offset": 95, "size": 1}, "lastv": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 64}, "movflag": {"native": "Int16Array", "offset": 80, "size": 2}, "stayput": {"native": "Int16Array", "offset": 86, "size": 2}, "t_data": {"length": 10, "native": "Int32Array", "offset": 0, "size": 40}, "tempang": {"native": "Int16Array", "offset": 82, "size": 2}, "timetosleep": {"native": "Int16Array", "offset": 84, "size": 2}, "waterzoffset": {"native": "Int8Array", "offset": 89, "size": 1}}, "overlaps": true, "size": 96, "union": false}}, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype, "__cxx_record_vec3_82cfac1168cb3a1b": () => __cxx_record_vec3_82cfac1168cb3a1b().prototype});
function __cxx_static_address_51de62bb55f10c6c298dc2da() {
  return __cxx_static_address_51de62bb55f10c6c298dc2da.reference || (__cxx_static_address_51de62bb55f10c6c298dc2da.reference = {
    __cReference: true,
    get value() { return dummy_actor; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/gameexec.cpp:147
export function VM_DummySprite() {
  (vm.pUSprite = __cxx_static_address_879d6d6a5bc25dd24dd22c4c());
  (vm.pActor = __cxx_static_address_51de62bb55f10c6c298dc2da());
  (vm.pData = cPointerOffset(dummy_actor.t_data, 0, Int32Array.BYTES_PER_ELEMENT));
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_efb91e61725352fe = new Uint8Array([((1) & 255), ((2) & 255), ((4) & 255), ((8) & 255), ((16) & 255), ((32) & 255), ((64) & 255), ((128) & 255)]);
function __cxx_static_address_316b20c9c60014c09a9ed567() {
  return __cxx_static_address_316b20c9c60014c09a9ed567.reference || (__cxx_static_address_316b20c9c60014c09a9ed567.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_efb91e61725352fe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:172
export const g_defaultVideoModes__header_global_088106fac5d34331 = [cMarkAggregate(Object.assign(Object.create(__cxx_record_vec2_2150e186aab2ebda().prototype), cMarkAggregate(({"x": 2560, "y": 1440})))), cMarkAggregate(Object.assign(Object.create(__cxx_record_vec2_2150e186aab2ebda().prototype), cMarkAggregate(({"x": 2560, "y": 1200})))), cMarkAggregate(Object.assign(Object.create(__cxx_record_vec2_2150e186aab2ebda().prototype), cMarkAggregate(({"x": 2560, "y": 1080})))), cMarkAggregate(Object.assign(Object.create(__cxx_record_vec2_2150e186aab2ebda().prototype), cMarkAggregate(({"x": 1920, "y": 1440})))), cMarkAggregate(Object.assign(Object.create(__cxx_record_vec2_2150e186aab2ebda().prototype), cMarkAggregate(({"x": 1920, "y": 1200})))), cMarkAggregate(Object.assign(Object.create(__cxx_record_vec2_2150e186aab2ebda().prototype), cMarkAggregate(({"x": 1920, "y": 1080})))), cMarkAggregate(Object.assign(Object.create(__cxx_record_vec2_2150e186aab2ebda().prototype), cMarkAggregate(({"x": 1680, "y": 1050})))), cMarkAggregate(Object.assign(Object.create(__cxx_record_vec2_2150e186aab2ebda().prototype), cMarkAggregate(({"x": 1600, "y": 1200})))), cMarkAggregate(Object.assign(Object.create(__cxx_record_vec2_2150e186aab2ebda().prototype), cMarkAggregate(({"x": 1600, "y": 900})))), cMarkAggregate(Object.assign(Object.create(__cxx_record_vec2_2150e186aab2ebda().prototype), cMarkAggregate(({"x": 1366, "y": 768})))), cMarkAggregate(Object.assign(Object.create(__cxx_record_vec2_2150e186aab2ebda().prototype), cMarkAggregate(({"x": 1280, "y": 1024})))), cMarkAggregate(Object.assign(Object.create(__cxx_record_vec2_2150e186aab2ebda().prototype), cMarkAggregate(({"x": 1280, "y": 960})))), cMarkAggregate(Object.assign(Object.create(__cxx_record_vec2_2150e186aab2ebda().prototype), cMarkAggregate(({"x": 1280, "y": 720})))), cMarkAggregate(Object.assign(Object.create(__cxx_record_vec2_2150e186aab2ebda().prototype), cMarkAggregate(({"x": 1152, "y": 864})))), cMarkAggregate(Object.assign(Object.create(__cxx_record_vec2_2150e186aab2ebda().prototype), cMarkAggregate(({"x": 1024, "y": 768})))), cMarkAggregate(Object.assign(Object.create(__cxx_record_vec2_2150e186aab2ebda().prototype), cMarkAggregate(({"x": 1024, "y": 600})))), cMarkAggregate(Object.assign(Object.create(__cxx_record_vec2_2150e186aab2ebda().prototype), cMarkAggregate(({"x": 800, "y": 600})))), cMarkAggregate(Object.assign(Object.create(__cxx_record_vec2_2150e186aab2ebda().prototype), cMarkAggregate(({"x": 640, "y": 480})))), cMarkAggregate(Object.assign(Object.create(__cxx_record_vec2_2150e186aab2ebda().prototype), cMarkAggregate(({"x": 640, "y": 400})))), cMarkAggregate(Object.assign(Object.create(__cxx_record_vec2_2150e186aab2ebda().prototype), cMarkAggregate(({"x": 512, "y": 384})))), cMarkAggregate(Object.assign(Object.create(__cxx_record_vec2_2150e186aab2ebda().prototype), cMarkAggregate(({"x": 480, "y": 360})))), cMarkAggregate(Object.assign(Object.create(__cxx_record_vec2_2150e186aab2ebda().prototype), cMarkAggregate(({"x": 400, "y": 300})))), cMarkAggregate(Object.assign(Object.create(__cxx_record_vec2_2150e186aab2ebda().prototype), cMarkAggregate(({"x": 320, "y": 240})))), cMarkAggregate(Object.assign(Object.create(__cxx_record_vec2_2150e186aab2ebda().prototype), cMarkAggregate(({"x": 320, "y": 200})))), cMarkAggregate(Object.assign(Object.create(__cxx_record_vec2_2150e186aab2ebda().prototype), cMarkAggregate(({"x": 0, "y": 0}))))];
function __cxx_static_address_25920c3371152d875e46b893() {
  return __cxx_static_address_25920c3371152d875e46b893.reference || (__cxx_static_address_25920c3371152d875e46b893.reference = {
    __cReference: true,
    get value() { return g_defaultVideoModes__header_global_088106fac5d34331; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:188
export const g_keyAsciiTable__header_global_f1fe886e9f176d27 = new Uint8Array([((0) & 255), ((0) & 255), 49, 50, 51, 52, 53, 54, 55, 56, 57, 48, 45, 61, ((0) & 255), ((0) & 255), 113, 119, 101, 114, 116, 121, 117, 105, 111, 112, 91, 93, ((0) & 255), ((0) & 255), 97, 115, 100, 102, 103, 104, 106, 107, 108, 59, ((39) & 255), 96, ((0) & 255), ((92) & 255), 122, 120, 99, 118, 98, 110, 109, 44, 46, 47, ((0) & 255), 42, ((0) & 255), ((32) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255)]);
function __cxx_static_address_a838b07689287dcc48c6814c() {
  return __cxx_static_address_a838b07689287dcc48c6814c.reference || (__cxx_static_address_a838b07689287dcc48c6814c.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTable__header_global_f1fe886e9f176d27; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:196
export const g_keyAsciiTableShift__header_global_92a497ea0f133f0f = new Uint8Array([((0) & 255), ((0) & 255), 33, 64, 35, 36, 37, 94, 38, 42, 40, 41, 95, 43, ((0) & 255), ((0) & 255), 81, 87, 69, 82, 84, 89, 85, 73, 79, 80, 123, 125, ((0) & 255), ((0) & 255), 65, 83, 68, 70, 71, 72, 74, 75, 76, 58, 34, 126, ((0) & 255), 124, 90, 88, 67, 86, 66, 78, 77, 60, 62, 63, ((0) & 255), 42, ((0) & 255), ((32) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255)]);
function __cxx_static_address_3b626e0d300f26e30def730f() {
  return __cxx_static_address_3b626e0d300f26e30def730f.reference || (__cxx_static_address_3b626e0d300f26e30def730f.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTableShift__header_global_92a497ea0f133f0f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:895
export const pow2long__header_global_8e98c6ae8f558572 = new Int32Array([1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576, 2097152, 4194304, 8388608, 16777216, 33554432, 67108864, 134217728, 268435456, 536870912, 1073741824, 2147483647]);
function __cxx_static_address_c4b948716fb8c7ce05cb84a4() {
  return __cxx_static_address_c4b948716fb8c7ce05cb84a4.reference || (__cxx_static_address_c4b948716fb8c7ce05cb84a4.reference = {
    __cReference: true,
    get value() { return pow2long__header_global_8e98c6ae8f558572; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:907
export const pow2ulong__header_global_8a67f5bac83a54f4 = new Uint32Array([u32(1), u32(2), u32(4), u32(8), u32(16), u32(32), u32(64), u32(128), u32(256), u32(512), u32(1024), u32(2048), u32(4096), u32(8192), u32(16384), u32(32768), u32(65536), u32(131072), u32(262144), u32(524288), u32(1048576), u32(2097152), u32(4194304), u32(8388608), u32(16777216), u32(33554432), u32(67108864), u32(134217728), u32(268435456), u32(536870912), u32(1073741824), u32(2147483648n)]);
function __cxx_static_address_5075eb4a7cc0f4709f93b4a6() {
  return __cxx_static_address_5075eb4a7cc0f4709f93b4a6.reference || (__cxx_static_address_5075eb4a7cc0f4709f93b4a6.reference = {
    __cReference: true,
    get value() { return pow2ulong__header_global_8a67f5bac83a54f4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:919
export const pow264__header_global_67de5abc34fd8537 = new BigInt64Array([BigInt(i64(1)), BigInt(i64(2)), BigInt(i64(4)), BigInt(i64(8)), BigInt(i64(16)), BigInt(i64(32)), BigInt(i64(64)), BigInt(i64(128)), BigInt(i64(256)), BigInt(i64(512)), BigInt(i64(1024)), BigInt(i64(2048)), BigInt(i64(4096)), BigInt(i64(8192)), BigInt(i64(16384)), BigInt(i64(32768)), BigInt(i64(65536)), BigInt(i64(131072)), BigInt(i64(262144)), BigInt(i64(524288)), BigInt(i64(1048576)), BigInt(i64(2097152)), BigInt(i64(4194304)), BigInt(i64(8388608)), BigInt(i64(16777216)), BigInt(i64(33554432)), BigInt(i64(67108864)), BigInt(i64(134217728)), BigInt(i64(268435456)), BigInt(i64(536870912)), BigInt(i64(1073741824)), BigInt(2147483648n), BigInt(4294967296n), BigInt(8589934592n), BigInt(17179869184n), BigInt(34359738368n), BigInt(68719476736n), BigInt(137438953472n), BigInt(274877906944n), BigInt(549755813888n), BigInt(1099511627776n), BigInt(2199023255552n), BigInt(4398046511104n), BigInt(8796093022208n), BigInt(17592186044416n), BigInt(35184372088832n), BigInt(70368744177664n), BigInt(140737488355328n), BigInt(281474976710656n), BigInt(562949953421312n), BigInt(1125899906842624n), BigInt(2251799813685248n), BigInt(4503599627370496n), BigInt(9007199254740992n), BigInt(18014398509481984n), BigInt(36028797018963968n), BigInt(72057594037927936n), BigInt(144115188075855872n), BigInt(288230376151711744n), BigInt(576460752303423488n), BigInt(1152921504606846976n), BigInt(2305843009213693952n), BigInt(4611686018427387904n), BigInt(9223372036854775807n)]);
function __cxx_static_address_7655a72f25fb553b8d714361() {
  return __cxx_static_address_7655a72f25fb553b8d714361.reference || (__cxx_static_address_7655a72f25fb553b8d714361.reference = {
    __cReference: true,
    get value() { return pow264__header_global_67de5abc34fd8537; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export function bitmap_test__header_8c45ac8b8cb5(ptr, n) {

  return Boolean((i32((i32((cDeref(cPointerOffset(ptr, i32((n >> 3)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & i32((cDeref(cPointerOffset(pow2char__header_global_efb91e61725352fe, i32((n & 7)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))) == i32((cDeref(cPointerOffset(pow2char__header_global_efb91e61725352fe, i32((n & 7)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))));
}

// C/C++ source: source/duke3d/src/gameexec.cpp:66
export function fix16_clamp__header_a9aea512bdbf(x, lo, hi) {
  return i32(clamp__header_d551c0bf0bf2(x, lo, hi));
}

// C/C++ source: source/duke3d/src/gameexec.cpp:42
export function fix16_to_int__header_826ef69a44f3(a) {
  return i32(Math.trunc(i32((a + ((a >= 0) ? fix16_half__header_global_f281d93f5a8852a5 : (-fix16_half__header_global_f281d93f5a8852a5)))) / fix16_one__header_global_88a3243967179765));
}

// C/C++ source: source/duke3d/src/gameexec.cpp:199
export function VM_SetStruct__header_a7b3cbac0ae9(flags, addr, newValue) {
  switch ((BigInt(u64(flags)) & BigInt((BigInt((BigInt((BigInt(1) | BigInt(2))) | BigInt(4))) | BigInt(u64(8)))))) {
    case 1: {
      ((cDeref(cTypedPointer(addr, Int8Array), Int8Array).value) = ((((((newValue) << 24) >> 24)) << 24) >> 24));
    }
    break;
    case (BigInt(1) | BigInt(u64(8))): {
      ((cDeref(cTypedPointer(addr, Uint8Array), Uint8Array).value) = ((((newValue) & 255)) & 255));
    }
    break;
    case 2: {
      ((cDeref(cTypedPointer(addr, Int16Array), Int16Array).value) = ((((((newValue) << 16) >> 16)) << 16) >> 16));
    }
    break;
    case (BigInt(2) | BigInt(u64(8))): {
      ((cDeref(cTypedPointer(addr, Uint16Array), Uint16Array).value) = ((((newValue) & 65535)) & 65535));
    }
    break;
    case 4: {
      ((cDeref(cTypedPointer(addr, Int32Array), Int32Array).value) = i32(newValue));
    }
    break;
    case (BigInt(4) | BigInt(u64(8))): {
      ((cDeref(cTypedPointer(addr, Uint32Array), Uint32Array).value) = u32(newValue));
    }
    break;
    default: {
      __builtin_unreachable();
    }
  }
}

// C/C++ source: source/duke3d/src/gameexec.cpp:185
export function VM_GetStruct__header_9c317cb592ea(flags, addr) {
  switch ((BigInt(u64(flags)) & BigInt((BigInt((BigInt((BigInt(1) | BigInt(2))) | BigInt(4))) | BigInt(u64(8)))))) {
    case 1: {
      return i32((cDeref(cTypedPointer(addr, Int8Array), Int8Array).value));
    }
    case (BigInt(1) | BigInt(u64(8))): {
      return i32((cDeref(cTypedPointer(addr, Uint8Array), Uint8Array).value));
    }
    case 2: {
      return i32((cDeref(cTypedPointer(addr, Int16Array), Int16Array).value));
    }
    case (BigInt(2) | BigInt(u64(8))): {
      return i32((cDeref(cTypedPointer(addr, Uint16Array), Uint16Array).value));
    }
    case 4: {
      return i32((cDeref(cTypedPointer(addr, Int32Array), Int32Array).value));
    }
    case (BigInt(4) | BigInt(u64(8))): {
      return i32((cDeref(cTypedPointer(addr, Uint32Array), Uint32Array).value));
    }
    default: {
      __builtin_unreachable();
    }
  }
}

// C/C++ source: source/duke3d/src/gameexec.cpp:422
export function P_GetP__header_c551bbb94c7f(pSprite) {
  let playerNum = i32(cRecordObject(pSprite).__cxx_anonymous_15.__cxx_anonymous_0.yvel);
  if ((u32(playerNum) >= u32(16))) {
    (playerNum = i32(0));
  }
  return i32(playerNum);
}

// C/C++ source: source/duke3d/src/gameexec.cpp:328
export function ksgn__header_e91fca1f930d(a) {
  return i32((i32((a > 0)) - i32((a < 0))));
}

export function ARRAY_SIZE__header_a1de5dfa51e6(arg0) {
  return u64(512n);
}

// C/C++ source: source/duke3d/src/gameexec.cpp:332
export function mulscale__header_de7735d10bfd(eax, edx, ecx) {
  return i32((BigInt((BigInt(i64(eax)) * BigInt(i64(edx)))) >> BigInt(i32(((((ecx) & 255)) & 255)))));
}

// C/C++ source: source/duke3d/src/gameexec.cpp:382
export function P_PalFrom__header_9cad9671ab5e(pPlayer, f, r, g, b) {
  ((pPlayer).value.pals.f = ((((f) & 255)) & 255));
  ((pPlayer).value.pals.r = ((((r) & 255)) & 255));
  ((pPlayer).value.pals.g = ((((g) & 255)) & 255));
  ((pPlayer).value.pals.b = ((((b) & 255)) & 255));
}

// C/C++ source: source/duke3d/src/gameexec.cpp:46
export function fix16_from_int__header_6768ed80e668(a) {
  return i32(Math.imul(a, fix16_one__header_global_88a3243967179765));
}

export function swap__header_0b14202ce217(a, b) {
  let t = i64((cDeref(a, BigInt64Array).value));
  ((cDeref(a, BigInt64Array).value) = i64((cDeref(b, BigInt64Array).value)));
  ((cDeref(b, BigInt64Array).value) = i64(t));
}

export function swap__header_ee3764741019(a, b) {
  let t = (a).value;
  ((a).value = (b).value);
  ((b).value = t);
}

export function clamp2__header_b66b1e0f9a5b(__cxx_in, min, max) {
  return i32(((__cxx_in >= i32(max)) ? i32(max) : ((__cxx_in <= i32(min)) ? i32(min) : __cxx_in)));
}

export function clamp__header_d551c0bf0bf2(__cxx_in, min, max) {
  return i32(((__cxx_in <= i32(min)) ? i32(min) : ((__cxx_in >= i32(max)) ? i32(max) : __cxx_in)));
}

// C/C++ source: source/duke3d/src/gameexec.cpp:44
export function VM_HaveEvent__header_6fe854a5818e(nEventID) {
  return i32((!(!Boolean((cDeref(cPointerOffset(apScriptEvents, nEventID, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value)))));
}

// C/C++ source: source/build/include/smmalloc.h:864
export function _sm_free(allocator, p) {
  return cRecordObject(allocator).Free(p);
}

// C/C++ source: source/build/include/smmalloc.h:859
export function _sm_malloc(allocator, bytesCount, alignment) {
  return cRecordObject(allocator).Alloc(bytesCount, alignment);
}

export function SILENCE_UNUSED__header_d68ac234019f(arg0, arg1) {

}

export function __cxx_operator_e3598b0077b4da36(lhs, rhs) {
  return cCopyTrivialClass(lhs.__cxx_operator_c4f1fab776aa8f78(rhs), ClockTicks(), ["wholeTicks", "ticksS32"]);
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
