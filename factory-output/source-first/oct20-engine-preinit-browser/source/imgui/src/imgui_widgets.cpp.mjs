// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/imgui/src/imgui_widgets.cpp
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
const powf = (a,b) => Math.fround(Math.pow(Math.fround(a), Math.fround(b)));
const fabsf = a => Math.fround(Math.abs(Math.fround(a)));

// C/C++ source: source/imgui/include/imgui_internal.h:935
export function ImGuiDataTypeStorage() {
  return ImGuiDataTypeStorage.type || (ImGuiDataTypeStorage.type = class ImGuiDataTypeStorage__implementation {
  constructor() {
    this.Data = undefined;
  }
});
}

// C/C++ source: source/imgui/include/imgui_internal.h:2789
export function ImGuiTabItem() {
  return ImGuiTabItem.type || (ImGuiTabItem.type = class ImGuiTabItem__implementation {
  constructor() {
    cByteMemory.memset(this, 0, 44);
    (this.LastFrameVisible = i32((this.LastFrameSelected = i32((-1)))));
    (this.RequestedWidth = Math.fround((-Math.fround(1))));
    (this.NameOffset = i32((-1)));
    (this.BeginOrder = ((((this.IndexDuringLayout = (((((((-1)) << 16) >> 16)) << 16) >> 16))) << 16) >> 16));
  }
});
}

// C/C++ source: source/imgui/include/imgui.h:295
export function ImVec2() {
  return ImVec2.type || (ImVec2.type = class ImVec2__implementation {
  constructor() { throw new TypeError("Clang-selected constructor factory required"); }
  __cxx_construct_3fdb0b4b21c3726c() {
    this.x = Math.fround(0);
    this.y = Math.fround(0);
    
  }
  static __cxx_construct_3fdb0b4b21c3726c() {
    const value=Object.create(ImVec2__implementation.prototype);
    value.__cxx_construct_3fdb0b4b21c3726c();
    return value;
  }
  __cxx_construct_edecdff36a89174e(_x, _y) {
    this.x = _x;
    this.y = _y;
    
  }
  static __cxx_construct_edecdff36a89174e(_x, _y) {
    const value=Object.create(ImVec2__implementation.prototype);
    value.__cxx_construct_edecdff36a89174e(_x, _y);
    return value;
  }
  __cxx_operator_6a20d07852a9c373(idx) {
    0;
    return (cDeref(cPointerOffset(cTypedPointer(cTypedPointer(this, Uint8Array), Float32Array), idx, Float32Array.BYTES_PER_ELEMENT), Float32Array).value);
  }
  __cxx_operator_4b2512a953823607(idx) {
    0;
    return Math.fround((cDeref(cPointerOffset(cTypedPointer(cTypedPointer(this, Uint8Array), Float32Array), idx, Float32Array.BYTES_PER_ELEMENT), Float32Array).value));
  }
});
}

// C/C++ source: source/imgui/include/imgui.h:308
export function ImVec4() {
  return ImVec4.type || (ImVec4.type = class ImVec4__implementation {
  constructor() { throw new TypeError("Clang-selected constructor factory required"); }
  __cxx_construct_3fdb0b4b21c3726c() {
    this.x = Math.fround(0);
    this.y = Math.fround(0);
    this.z = Math.fround(0);
    this.w = Math.fround(0);
    
  }
  static __cxx_construct_3fdb0b4b21c3726c() {
    const value=Object.create(ImVec4__implementation.prototype);
    value.__cxx_construct_3fdb0b4b21c3726c();
    return value;
  }
  __cxx_construct_33e919b602ff0017(_x, _y, _z, _w) {
    this.x = _x;
    this.y = _y;
    this.z = _z;
    this.w = _w;
    
  }
  static __cxx_construct_33e919b602ff0017(_x, _y, _z, _w) {
    const value=Object.create(ImVec4__implementation.prototype);
    value.__cxx_construct_33e919b602ff0017(_x, _y, _z, _w);
    return value;
  }
});
}

// C/C++ source: source/imgui/src/imgui_widgets.cpp:9544
export class ImGuiTabBarSection {
  constructor() {
    cByteMemory.memset(this, 0, 16);
  }
}

// C/C++ source: source/imgui/src/imgui_widgets.cpp:103
export const DRAGDROP_HOLD_TO_OPEN_TIMER = Math.fround(Math.fround(0.699999988));
function __cxx_static_address_16d89b8bafc8fc65085bcc67() {
  return __cxx_static_address_16d89b8bafc8fc65085bcc67.reference || (__cxx_static_address_16d89b8bafc8fc65085bcc67.reference = {
    __cReference: true,
    get value() { return DRAGDROP_HOLD_TO_OPEN_TIMER; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/imgui/src/imgui_widgets.cpp:104
export const DRAG_MOUSE_THRESHOLD_FACTOR = Math.fround(Math.fround(0.5));
function __cxx_static_address_11e77e7e1bfbef4c3b5be843() {
  return __cxx_static_address_11e77e7e1bfbef4c3b5be843.reference || (__cxx_static_address_11e77e7e1bfbef4c3b5be843.reference = {
    __cReference: true,
    get value() { return DRAG_MOUSE_THRESHOLD_FACTOR; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/imgui/src/imgui_widgets.cpp:107
export const IM_S8_MIN = (((((((-128)) << 24) >> 24)) << 24) >> 24);
function __cxx_static_address_2458b0dacaee482ac997fcd1() {
  return __cxx_static_address_2458b0dacaee482ac997fcd1.reference || (__cxx_static_address_2458b0dacaee482ac997fcd1.reference = {
    __cReference: true,
    get value() { return IM_S8_MIN; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/imgui/src/imgui_widgets.cpp:108
export const IM_S8_MAX = ((((((127) << 24) >> 24)) << 24) >> 24);
function __cxx_static_address_bb825b41feea0f288505c628() {
  return __cxx_static_address_bb825b41feea0f288505c628.reference || (__cxx_static_address_bb825b41feea0f288505c628.reference = {
    __cReference: true,
    get value() { return IM_S8_MAX; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/imgui/src/imgui_widgets.cpp:109
export const IM_U8_MIN = ((((0) & 255)) & 255);
function __cxx_static_address_25735876d9d9c8ff9b4374b3() {
  return __cxx_static_address_25735876d9d9c8ff9b4374b3.reference || (__cxx_static_address_25735876d9d9c8ff9b4374b3.reference = {
    __cReference: true,
    get value() { return IM_U8_MIN; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/imgui/src/imgui_widgets.cpp:110
export const IM_U8_MAX = ((((255) & 255)) & 255);
function __cxx_static_address_1474b49f36d33c4ecacfd274() {
  return __cxx_static_address_1474b49f36d33c4ecacfd274.reference || (__cxx_static_address_1474b49f36d33c4ecacfd274.reference = {
    __cReference: true,
    get value() { return IM_U8_MAX; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/imgui/src/imgui_widgets.cpp:111
export const IM_S16_MIN = (((((((-32768)) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d0038161ba990f8b96df4831() {
  return __cxx_static_address_d0038161ba990f8b96df4831.reference || (__cxx_static_address_d0038161ba990f8b96df4831.reference = {
    __cReference: true,
    get value() { return IM_S16_MIN; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/imgui/src/imgui_widgets.cpp:112
export const IM_S16_MAX = ((((((32767) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4a44b779f65ed18a3422c5e2() {
  return __cxx_static_address_4a44b779f65ed18a3422c5e2.reference || (__cxx_static_address_4a44b779f65ed18a3422c5e2.reference = {
    __cReference: true,
    get value() { return IM_S16_MAX; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/imgui/src/imgui_widgets.cpp:113
export const IM_U16_MIN = ((((0) & 65535)) & 65535);
function __cxx_static_address_38656e96a39bf9945960fb59() {
  return __cxx_static_address_38656e96a39bf9945960fb59.reference || (__cxx_static_address_38656e96a39bf9945960fb59.reference = {
    __cReference: true,
    get value() { return IM_U16_MIN; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/imgui/src/imgui_widgets.cpp:114
export const IM_U16_MAX = ((((65535) & 65535)) & 65535);
function __cxx_static_address_fbbbd5e56ef44cb99fc28a33() {
  return __cxx_static_address_fbbbd5e56ef44cb99fc28a33.reference || (__cxx_static_address_fbbbd5e56ef44cb99fc28a33.reference = {
    __cReference: true,
    get value() { return IM_U16_MAX; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/imgui/src/imgui_widgets.cpp:115
export const IM_S32_MIN = i32(((-2147483647) - 1));
function __cxx_static_address_5b63f55a4965d3c25ad11f17() {
  return __cxx_static_address_5b63f55a4965d3c25ad11f17.reference || (__cxx_static_address_5b63f55a4965d3c25ad11f17.reference = {
    __cReference: true,
    get value() { return IM_S32_MIN; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/imgui/src/imgui_widgets.cpp:116
export const IM_S32_MAX = i32(2147483647);
function __cxx_static_address_9891ee6f6789c14876fde1f4() {
  return __cxx_static_address_9891ee6f6789c14876fde1f4.reference || (__cxx_static_address_9891ee6f6789c14876fde1f4.reference = {
    __cReference: true,
    get value() { return IM_S32_MAX; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/imgui/src/imgui_widgets.cpp:117
export const IM_U32_MIN = u32(0);
function __cxx_static_address_e7335dae429ecd6df1e0d51c() {
  return __cxx_static_address_e7335dae429ecd6df1e0d51c.reference || (__cxx_static_address_e7335dae429ecd6df1e0d51c.reference = {
    __cReference: true,
    get value() { return IM_U32_MIN; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/imgui/src/imgui_widgets.cpp:118
export const IM_U32_MAX = u32((u32(Math.imul(u32(2147483647), 2)) + 1));
function __cxx_static_address_cfc8ee139db74725aa79d504() {
  return __cxx_static_address_cfc8ee139db74725aa79d504.reference || (__cxx_static_address_cfc8ee139db74725aa79d504.reference = {
    __cReference: true,
    get value() { return IM_U32_MAX; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/imgui/src/imgui_widgets.cpp:120
export const IM_S64_MIN = i64((BigInt((-9223372036854775807n)) - BigInt(1n)));
function __cxx_static_address_dd863e829d80944cf21c24d8() {
  return __cxx_static_address_dd863e829d80944cf21c24d8.reference || (__cxx_static_address_dd863e829d80944cf21c24d8.reference = {
    __cReference: true,
    get value() { return IM_S64_MIN; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/imgui/src/imgui_widgets.cpp:121
export const IM_S64_MAX = i64(9223372036854775807n);
function __cxx_static_address_ccc47db22af746477a54d256() {
  return __cxx_static_address_ccc47db22af746477a54d256.reference || (__cxx_static_address_ccc47db22af746477a54d256.reference = {
    __cReference: true,
    get value() { return IM_S64_MAX; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/imgui/src/imgui_widgets.cpp:126
export const IM_U64_MIN = u64(0);
function __cxx_static_address_b7ef48f9db5c81a535ac2c96() {
  return __cxx_static_address_b7ef48f9db5c81a535ac2c96.reference || (__cxx_static_address_b7ef48f9db5c81a535ac2c96.reference = {
    __cReference: true,
    get value() { return IM_U64_MIN; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/imgui/src/imgui_widgets.cpp:128
export const IM_U64_MAX = u64((BigInt((BigInt(u64(9223372036854775807n)) * BigInt(2n))) + BigInt(1n)));
function __cxx_static_address_224862670d9d33c9c2416a31() {
  return __cxx_static_address_224862670d9d33c9c2416a31.reference || (__cxx_static_address_224862670d9d33c9c2416a31.reference = {
    __cReference: true,
    get value() { return IM_U64_MAX; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/imgui/src/imgui_widgets.cpp:956
export function GetWindowScrollbarID(window, axis) {
  return cRecordObject(window).GetID(((i32(axis) == i32(0)) ? "#SCROLLX" : "#SCROLLY"), null);
}

// C/C++ source: source/imgui/src/imgui_widgets.cpp:2114
export function Items_ArrayGetter(data, idx) {
  let items = data;
  return (cPointerElementRef(items, idx).value);
}

// C/C++ source: source/imgui/src/imgui_widgets.cpp:2121
export function Items_SingleStringGetter(data, idx) {
  let items_separated_by_zeros = cTypedPointer(data, Uint8Array);
  let items_count = i32(0);
  let p = items_separated_by_zeros;
  while (Boolean((cDeref(p, Uint8Array).value))) {
    if ((idx == items_count)) {
      break;
    }
    (p = cPointerOffset(p, (BigInt(cByteMemory.strlen(p)) + BigInt(u64(1))), Uint8Array.BYTES_PER_ELEMENT));
    ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => items_count, __cxx_lvalue_1 => { items_count = __cxx_lvalue_1; }));
  }
  return (Boolean((cDeref(p, Uint8Array).value)) ? p : null);
}

// C/C++ source: source/imgui/src/imgui_widgets.cpp:2208
export function ImGuiGetNameFromIndexOldToNewCallback(user_data, idx) {
  let data = user_data;
  let s = null;
  cRecordObject(data).OldCallback(cRecordObject(data).UserData, idx, cRef(() => s, __cxx_lvalue_0 => { s = __cxx_lvalue_0; }));
  return s;
}

// C/C++ source: source/imgui/src/imgui_widgets.cpp:2242
export const GDefaultRgbaColorMarkers = new Uint32Array([u32((u32((u32((u32((u32(255) << 24)) | u32((u32(20) << 16)))) | u32((u32(20) << 8)))) | u32((u32(240) << 0)))), u32((u32((u32((u32((u32(255) << 24)) | u32((u32(20) << 16)))) | u32((u32(240) << 8)))) | u32((u32(20) << 0)))), u32((u32((u32((u32((u32(255) << 24)) | u32((u32(240) << 16)))) | u32((u32(20) << 8)))) | u32((u32(20) << 0)))), u32((u32((u32((u32((u32(255) << 24)) | u32((u32(140) << 16)))) | u32((u32(140) << 8)))) | u32((u32(140) << 0))))]);
function __cxx_static_address_dcf340f402abbe5233810157() {
  return __cxx_static_address_dcf340f402abbe5233810157.reference || (__cxx_static_address_dcf340f402abbe5233810157.reference = {
    __cReference: true,
    get value() { return GDefaultRgbaColorMarkers; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/imgui/src/imgui_widgets.cpp:2247
export const GDataTypeInfo = [cMarkAggregate(({"Size": 1, "Name": Uint8Array.from([83, 56, 0]), "PrintFmt": Uint8Array.from([37, 100, 0]), "ScanFmt": Uint8Array.from([37, 100, 0])})), cMarkAggregate(({"Size": 1, "Name": Uint8Array.from([85, 56, 0]), "PrintFmt": Uint8Array.from([37, 117, 0]), "ScanFmt": Uint8Array.from([37, 117, 0])})), cMarkAggregate(({"Size": 2, "Name": Uint8Array.from([83, 49, 54, 0]), "PrintFmt": Uint8Array.from([37, 100, 0]), "ScanFmt": Uint8Array.from([37, 100, 0])})), cMarkAggregate(({"Size": 2, "Name": Uint8Array.from([85, 49, 54, 0]), "PrintFmt": Uint8Array.from([37, 117, 0]), "ScanFmt": Uint8Array.from([37, 117, 0])})), cMarkAggregate(({"Size": 4, "Name": Uint8Array.from([83, 51, 50, 0]), "PrintFmt": Uint8Array.from([37, 100, 0]), "ScanFmt": Uint8Array.from([37, 100, 0])})), cMarkAggregate(({"Size": 4, "Name": Uint8Array.from([85, 51, 50, 0]), "PrintFmt": Uint8Array.from([37, 117, 0]), "ScanFmt": Uint8Array.from([37, 117, 0])})), cMarkAggregate(({"Size": 8, "Name": Uint8Array.from([83, 54, 52, 0]), "PrintFmt": Uint8Array.from([37, 108, 108, 100, 0]), "ScanFmt": Uint8Array.from([37, 108, 108, 100, 0])})), cMarkAggregate(({"Size": 8, "Name": Uint8Array.from([85, 54, 52, 0]), "PrintFmt": Uint8Array.from([37, 108, 108, 117, 0]), "ScanFmt": Uint8Array.from([37, 108, 108, 117, 0])})), cMarkAggregate(({"Size": 4, "Name": Uint8Array.from([102, 108, 111, 97, 116, 0]), "PrintFmt": Uint8Array.from([37, 46, 51, 102, 0]), "ScanFmt": Uint8Array.from([37, 102, 0])})), cMarkAggregate(({"Size": 8, "Name": Uint8Array.from([100, 111, 117, 98, 108, 101, 0]), "PrintFmt": Uint8Array.from([37, 102, 0]), "ScanFmt": Uint8Array.from([37, 108, 102, 0])})), cMarkAggregate(({"Size": 1, "Name": Uint8Array.from([98, 111, 111, 108, 0]), "PrintFmt": Uint8Array.from([37, 100, 0]), "ScanFmt": Uint8Array.from([37, 100, 0])})), cMarkAggregate(({"Size": u64(0), "Name": Uint8Array.from([99, 104, 97, 114, 42, 0]), "PrintFmt": Uint8Array.from([37, 115, 0]), "ScanFmt": Uint8Array.from([37, 115, 0])}))];
function __cxx_static_address_389f7883b10dbebc1909fef7() {
  return __cxx_static_address_389f7883b10dbebc1909fef7.reference || (__cxx_static_address_389f7883b10dbebc1909fef7.reference = {
    __cReference: true,
    get value() { return GDataTypeInfo; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/imgui/src/imgui_widgets.cpp:2269
export function DataTypeGetInfo(data_type) {
  0;
  return cPointerOffset(GDataTypeInfo, data_type, 32);
}

// C/C++ source: source/imgui/src/imgui_widgets.cpp:2462
let __static_GetMinimumStepAtDecimalPrecision_min_steps = new Float32Array([Math.fround(1), Math.fround(0.100000001), Math.fround(0.00999999977), Math.fround(0.00100000005), Math.fround(9.99999974E-5), Math.fround(9.99999974E-6), Math.fround(9.99999997E-7), Math.fround(1.00000001E-7), Math.fround(9.99999993E-9), Math.fround(9.99999971E-10)]);
export function GetMinimumStepAtDecimalPrecision(decimal_precision) {

  if ((decimal_precision < 0)) {
    return Math.fround(Math.fround(1.17549435E-38));
  }
  return Math.fround(((decimal_precision < i32((BigInt(40) / BigInt(4)))) ? (cDeref(cPointerOffset(__static_GetMinimumStepAtDecimalPrecision_min_steps, decimal_precision, Float32Array.BYTES_PER_ELEMENT), Float32Array).value) : ImPow(Math.fround(10), Math.fround(Math.fround((-decimal_precision))))));
}

// C/C++ source: source/imgui/src/imgui_widgets.cpp:3581
export function ImParseFormatFindEnd(fmt) {
  if ((i32((cDeref(cPointerOffset(fmt, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) != i32(37))) {
    return fmt;
  }
  let ignored_uppercase_mask = u32(i32((i32((1 << i32((i32(73) - i32(65))))) | i32((1 << i32((i32(76) - i32(65))))))));
  let ignored_lowercase_mask = u32(i32((i32((i32((i32((i32((i32((1 << i32((i32(104) - i32(97))))) | i32((1 << i32((i32(106) - i32(97))))))) | i32((1 << i32((i32(108) - i32(97))))))) | i32((1 << i32((i32(116) - i32(97))))))) | i32((1 << i32((i32(119) - i32(97))))))) | i32((1 << i32((i32(122) - i32(97))))))));
  for (let c; (i32((c = (((cDeref(fmt, Uint8Array).value)) & 255))) != 0); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return previous; })(cRef(() => fmt, __cxx_lvalue_1 => { fmt = __cxx_lvalue_1; }))) {
    if ((((i32(c) >= i32(65)) && (i32(c) <= i32(90))) && (u32((u32(i32((1 << i32((i32(c) - i32(65)))))) & ignored_uppercase_mask)) == u32(0)))) {
      return cPointerOffset(fmt, 1, Uint8Array.BYTES_PER_ELEMENT);
    }
    if ((((i32(c) >= i32(97)) && (i32(c) <= i32(122))) && (u32((u32(i32((1 << i32((i32(c) - i32(97)))))) & ignored_lowercase_mask)) == u32(0)))) {
      return cPointerOffset(fmt, 1, Uint8Array.BYTES_PER_ELEMENT);
    }
  }
  return fmt;
}

// C/C++ source: source/imgui/src/imgui_widgets.cpp:3618
export function ImParseFormatSanitizeForPrinting(fmt_in, fmt_out, fmt_out_size) {
  let fmt_end = ImParseFormatFindEnd(fmt_in);
  fmt_out_size;
  0;
  while (cPointerCompare(fmt_in, fmt_end, "<")) {
    let c = (((cDeref(((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return previous; })(cRef(() => fmt_in, __cxx_lvalue_1 => { fmt_in = __cxx_lvalue_1; })), Uint8Array).value)) & 255);
    if ((((i32(c) != i32(39)) && (i32(c) != i32(36))) && (i32(c) != i32(95)))) {
      ((cDeref(((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_2.value = next; return previous; })(cRef(() => fmt_out, __cxx_lvalue_3 => { fmt_out = __cxx_lvalue_3; })), Uint8Array).value) = ((c) & 255));
    }
  }
  ((cDeref(fmt_out, Uint8Array).value) = ((((0) & 255)) & 255));
}

// C/C++ source: source/imgui/src/imgui_widgets.cpp:3633
export function ImParseFormatSanitizeForScanning(fmt_in, fmt_out, fmt_out_size) {
  let fmt_end = ImParseFormatFindEnd(fmt_in);
  let fmt_out_begin = fmt_out;
  fmt_out_size;
  0;
  let has_type = Boolean(false);
  while (cPointerCompare(fmt_in, fmt_end, "<")) {
    let c = (((cDeref(((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return previous; })(cRef(() => fmt_in, __cxx_lvalue_1 => { fmt_in = __cxx_lvalue_1; })), Uint8Array).value)) & 255);
    if (((!has_type) && (((((i32(c) >= i32(48)) && (i32(c) <= i32(57))) || (i32(c) == i32(46))) || (i32(c) == i32(43))) || (i32(c) == i32(35))))) {
      continue;
    }
    (has_type = Boolean((has_type | i32((((i32(c) >= i32(97)) && (i32(c) <= i32(122))) || ((i32(c) >= i32(65)) && (i32(c) <= i32(90))))))));
    if ((((i32(c) != i32(39)) && (i32(c) != i32(36))) && (i32(c) != i32(95)))) {
      ((cDeref(((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_2.value = next; return previous; })(cRef(() => fmt_out, __cxx_lvalue_3 => { fmt_out = __cxx_lvalue_3; })), Uint8Array).value) = ((c) & 255));
    }
  }
  ((cDeref(fmt_out, Uint8Array).value) = ((((0) & 255)) & 255));
  return fmt_out_begin;
}

// C/C++ source: source/imgui/src/imgui_widgets.cpp:3984
export function STB_TEXTEDIT_STRINGLEN(obj) {
  return i32(cRecordObject(obj).TextLen);
}

// C/C++ source: source/imgui/src/imgui_widgets.cpp:3985
export function STB_TEXTEDIT_GETCHAR(obj, idx) {
  0;
  return (((cDeref(cPointerOffset(cRecordObject(obj).TextSrc, idx, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255);
}

// C/C++ source: source/imgui/src/imgui_widgets.cpp:3987
export let STB_TEXTEDIT_NEWLINE = ((10) & 255);
function __cxx_static_address_0adce95313f7128096c2bdf1() {
  return __cxx_static_address_0adce95313f7128096c2bdf1.reference || (__cxx_static_address_0adce95313f7128096c2bdf1.reference = {
    __cReference: true,
    get value() { return STB_TEXTEDIT_NEWLINE; },
    set value(__cxx_lvalue_0) { STB_TEXTEDIT_NEWLINE = ((__cxx_lvalue_0) & 255); }
  });
}

// C/C++ source: source/imgui/src/imgui_widgets.cpp:4163
export function STB_TEXTEDIT_DELETECHARS(obj, pos, n) {
  0;
  let dst = cPointerOffset(cRecordObject(obj).TextA.Data, pos, Uint8Array.BYTES_PER_ELEMENT);
  let src = cPointerOffset(cPointerOffset(cRecordObject(obj).TextA.Data, pos, Uint8Array.BYTES_PER_ELEMENT), n, Uint8Array.BYTES_PER_ELEMENT);
  cByteMemory.memmove(dst, src, u64(i32((i32((i32((cRecordObject(obj).TextLen - n)) - pos)) + 1))));
  (cRecordObject(obj).Edited = Boolean(true));
  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = i32((Number(__cxx_lvalue_0.value) - Number(n)))))(cObjectFieldRef(cRecordObject(obj), "TextLen"));
}

// C/C++ source: source/imgui/src/imgui_widgets.cpp:4560
export function ImLowerBound(in_begin, in_end, v) {
  let in_p = in_begin;
  for (let count = u64(cPointerDiff(in_end, in_p, Int32Array.BYTES_PER_ELEMENT)); (count > u64(0)); ) {
    let count2 = u64((BigInt(count) >> BigInt(1)));
    let mid = cPointerOffset(in_p, count2, Int32Array.BYTES_PER_ELEMENT);
    if (((cDeref(mid, Int32Array).value) < v)) {
      (in_p = ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, Int32Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return next; })(cRef(() => mid, __cxx_lvalue_1 => { mid = __cxx_lvalue_1; })));
      (count = u64((BigInt(count) - BigInt((BigInt(count2) + BigInt(u64(1)))))));
    } else {
      (count = u64(count2));
    }
  }
  return in_p;
}

// C/C++ source: source/imgui/src/imgui_widgets.cpp:7598
export function ImStrimatchlen(s1, s1_end, s2) {
  let match_len = i32(0);
  while ((cPointerCompare(s1, s1_end, "<") && (i32(ImToUpper((cDeref(((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return previous; })(cRef(() => s1, __cxx_lvalue_1 => { s1 = __cxx_lvalue_1; })), Uint8Array).value))) == i32(ImToUpper((cDeref(((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_2.value = next; return previous; })(cRef(() => s2, __cxx_lvalue_3 => { s2 = __cxx_lvalue_3; })), Uint8Array).value)))))) {
    ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = i32((previous + 1)); __cxx_lvalue_4.value = next; return previous; })(cRef(() => match_len, __cxx_lvalue_5 => { match_len = __cxx_lvalue_5; }));
  }
  return i32(match_len);
}

// C/C++ source: source/imgui/src/imgui_widgets.cpp:7627
export function TypingSelectFindNextSingleCharMatch(req, items_count, get_item_name_func, user_data, nav_item_idx) {
  let first_match_idx = i32((-1));
  let return_next_match = Boolean(false);
  for (let idx = i32(0); (idx < items_count); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => idx, __cxx_lvalue_1 => { idx = __cxx_lvalue_1; }))) {
    let item_name = get_item_name_func(user_data, idx);
    if ((ImStrimatchlen(cRecordObject(req).SearchBuffer, cPointerOffset(cRecordObject(req).SearchBuffer, i32(cRecordObject(req).SingleCharSize), Uint8Array.BYTES_PER_ELEMENT), item_name) < i32(cRecordObject(req).SingleCharSize))) {
      continue;
    }
    if (return_next_match) {
      return i32(idx);
    }
    if (((first_match_idx == (-1)) && (nav_item_idx == (-1)))) {
      return i32(idx);
    }
    if ((first_match_idx == (-1))) {
      (first_match_idx = i32(idx));
    }
    if ((nav_item_idx == idx)) {
      (return_next_match = Boolean(true));
    }
  }
  return i32(first_match_idx);
}

// C/C++ source: source/imgui/src/imgui_widgets.cpp:7652
export function TypingSelectFindBestLeadingMatch(req, items_count, get_item_name_func, user_data) {
  let longest_match_idx = i32((-1));
  let longest_match_len = i32(0);
  for (let idx = i32(0); (idx < items_count); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => idx, __cxx_lvalue_1 => { idx = __cxx_lvalue_1; }))) {
    let item_name = get_item_name_func(user_data, idx);
    let match_len = i32(ImStrimatchlen(cRecordObject(req).SearchBuffer, cPointerOffset(cRecordObject(req).SearchBuffer, cRecordObject(req).SearchBufferLen, Uint8Array.BYTES_PER_ELEMENT), item_name));
    if ((match_len <= longest_match_len)) {
      continue;
    }
    (longest_match_idx = i32(idx));
    (longest_match_len = i32(match_len));
    if ((match_len == cRecordObject(req).SearchBufferLen)) {
      break;
    }
  }
  return i32(longest_match_idx);
}

// C/C++ source: source/imgui/src/imgui_widgets.cpp:8381
export function MultiSelectAddSetAll(ms, selected) {
  let req = cMarkAggregate(({"Type": 1, "Selected": selected, "RangeDirection": (((0) << 24) >> 24), "RangeFirstItem": i64((-1)), "RangeLastItem": i64((-1))}));
  cRecordObject(ms).IO.Requests.resize(0);
  cRecordObject(ms).IO.Requests.push_back(req);
}

// C/C++ source: source/imgui/src/imgui_widgets.cpp:8388
export function MultiSelectAddSetRange(ms, selected, range_dir, first_item, last_item) {
  if ((((cRecordObject(ms).IO.Requests.Size > 0) && (first_item == last_item)) && (i32((cRecordObject(ms).Flags & i32(4))) == 0))) {
    let prev = cPointerOffset(cRecordObject(ms).IO.Requests.Data, i32((cRecordObject(ms).IO.Requests.Size - 1)), 24);
    if ((((i32(cRecordObject(prev).Type) == i32(2)) && (cRecordObject(prev).RangeLastItem == cRecordObject(ms).LastSubmittedItem)) && (i32(cRecordObject(prev).Selected) == i32(selected)))) {
      (cRecordObject(prev).RangeLastItem = i64(last_item));
      return;
    }
  }
  let req = cMarkAggregate(({"Type": 2, "Selected": selected, "RangeDirection": ((((((range_dir) << 24) >> 24)) << 24) >> 24), "RangeFirstItem": ((range_dir > 0) ? first_item : last_item), "RangeLastItem": ((range_dir > 0) ? last_item : first_item)}));
  cRecordObject(ms).IO.Requests.push_back(req);
}

// C/C++ source: source/imgui/src/imgui_widgets.cpp:8458
export function PairComparerByValueInt(lhs, rhs) {
  let lhs_v = i32(cRecordObject(lhs).__cxx_anonymous_1.val_i);
  let rhs_v = i32(cRecordObject(rhs).__cxx_anonymous_1.val_i);
  return i32(((lhs_v > rhs_v) ? (+1) : ((lhs_v < rhs_v) ? (-1) : 0)));
}

// C/C++ source: source/imgui/src/imgui_widgets.cpp:8509
export function ImGuiSelectionBasicStorage_BatchFinish(selection, selected, size_before_amends) {
  let storage = cObjectFieldRef(cRecordObject(selection), "_Storage");
  if ((selected && (cRecordObject(selection).Size != size_before_amends))) {
    cRecordObject(storage).BuildSortByKey();
  }
}

// C/C++ source: source/imgui/src/imgui_widgets.cpp:8870
export function Plot_ArrayGetter(data, idx) {
  let plot_data = data;
  let v = Math.fround((cDeref(cTypedPointer(cPointerOffset(cTypedPointer(cRecordObject(plot_data).Values, Uint8Array), (BigInt(u64(idx)) * BigInt(u64(cRecordObject(plot_data).Stride))), Uint8Array.BYTES_PER_ELEMENT), Float32Array), Float32Array).value));
  return Math.fround(v);
}

// C/C++ source: source/imgui/src/imgui_widgets.cpp:9572
export function TabItemGetSectionIdx(tab) {
  return i32((Boolean(i32((cRecordObject(tab).Flags & i32(64)))) ? 0 : (Boolean(i32((cRecordObject(tab).Flags & i32(128)))) ? 2 : 1)));
}

// C/C++ source: source/imgui/src/imgui_widgets.cpp:9577
export function TabItemComparerBySection(lhs, rhs) {
  let a = lhs;
  let b = rhs;
  let a_section = i32(TabItemGetSectionIdx(a));
  let b_section = i32(TabItemGetSectionIdx(b));
  if ((a_section != b_section)) {
    return i32((a_section - b_section));
  }
  return i32((i32(cRecordObject(a).IndexDuringLayout) - i32(cRecordObject(b).IndexDuringLayout)));
}

// C/C++ source: source/imgui/src/imgui_widgets.cpp:9588
export function TabItemComparerByBeginOrder(lhs, rhs) {
  let a = lhs;
  let b = rhs;
  return i32((i32(cRecordObject(a).BeginOrder) - i32(cRecordObject(b).BeginOrder)));
}

// C/C++ source: source/imgui/src/imgui_widgets.cpp:9738
export function TabBarCalcScrollableWidth(tab_bar, sections) {
  return Math.fround(Math.fround((Math.fround((Math.fround((cRecordObject(tab_bar).BarRect.GetWidth() - (cPointerElementRef(sections, 0).value).Width)) - (cPointerElementRef(sections, 2).value).Width)) - (cPointerElementRef(sections, 1).value).Spacing)));
}

// C/C++ source: source/imgui/src/imgui_widgets.cpp:10062
const __cxx_literal_3104489ff436ca4c1846 = Uint8Array.from([78, 47, 65, 0]);
export function TabBarGetTabName(tab_bar, tab) {
  if ((cRecordObject(tab).NameOffset == (-1))) {
    return __cxx_literal_3104489ff436ca4c1846;
  }
  0;
  return cPointerOffset(cRecordObject(tab_bar).TabsNames.Buf.Data, cRecordObject(tab).NameOffset, Uint8Array.BYTES_PER_ELEMENT);
}

// C/C++ source: source/imgui/src/imgui_widgets.cpp:10081
export function TabBarCloseTab(tab_bar, tab) {
  if (Boolean(i32((cRecordObject(tab).Flags & i32(2097152))))) {
    return;
  }
  if ((i32((cRecordObject(tab).Flags & i32((i32(1) | i32(256))))) == 0)) {
    (cRecordObject(tab).WantClose = Boolean(true));
    if ((cRecordObject(tab_bar).VisibleTabId == cRecordObject(tab).ID)) {
      (cRecordObject(tab).LastFrameVisible = i32((-1)));
      (cRecordObject(tab_bar).SelectedTabId = u32((cRecordObject(tab_bar).NextSelectedTabId = u32(0))));
    }
  } else {
    if ((cRecordObject(tab_bar).VisibleTabId != cRecordObject(tab).ID)) {
      TabBarQueueFocus__cxx_9e1d90d3fbc5(tab_bar, tab);
    }
  }
}

// C/C++ source: source/imgui/src/imgui_widgets.cpp:10105
export function TabBarScrollClamp(tab_bar, scrolling) {
  (scrolling = Math.fround(ImMin(scrolling, Math.fround((cRecordObject(tab_bar).WidthAllTabs - cRecordObject(tab_bar).BarRect.GetWidth())))));
  return Math.fround(ImMax(scrolling, Math.fround(0)));
}

// C/C++ source: source/imgui/src/imgui_widgets.cpp:10145
export function TabBarQueueFocus__cxx_9e1d90d3fbc5(tab_bar, tab) {
  (cRecordObject(tab_bar).NextSelectedTabId = u32(cRecordObject(tab).ID));
}

// C/C++ source: source/imgui/src/imgui_widgets.cpp:10157
export function TabBarQueueReorder(tab_bar, tab, offset) {
  0;
  0;
  (cRecordObject(tab_bar).ReorderRequestTabId = u32(cRecordObject(tab).ID));
  (cRecordObject(tab_bar).ReorderRequestOffset = (((((((((offset) << 16) >> 16)) << 16) >> 16)) << 16) >> 16));
}

// C/C++ source: source/imgui/src/imgui_widgets.cpp:10682
export function TabItemCalcSize__cxx_3871cb62030c(arg0) {
  0;
  return cCopyTrivialClass((ImVec2()).__cxx_construct_edecdff36a89174e(Math.fround(0), Math.fround(0)), ImVec2(), ["x", "y"]);
}

// C/C++ source: source/imgui/include/imgui.h:2899
export function __cxx_operator_e11e480209a9c93d(lhs, rhs) {
  return cCopyTrivialClass((ImVec2()).__cxx_construct_edecdff36a89174e(Math.fround((lhs.x + rhs.x)), Math.fround((lhs.y + rhs.y))), ImVec2(), ["x", "y"]);
}

// C/C++ source: source/imgui/include/imgui.h:2900
export function __cxx_operator_71e4282592b4c08b(lhs, rhs) {
  return cCopyTrivialClass((ImVec2()).__cxx_construct_edecdff36a89174e(Math.fround((lhs.x - rhs.x)), Math.fround((lhs.y - rhs.y))), ImVec2(), ["x", "y"]);
}

// C/C++ source: source/imgui/include/imgui_internal.h:524
export function ImTrunc__cxx_6fee328fee59(f) {
  return Math.fround(Math.fround(Math.fround(i32(f))));
}

// C/C++ source: source/imgui/include/imgui_internal.h:3282
export function ItemSize(bb, text_baseline_y) {
  ItemSize(bb.GetSize(), text_baseline_y);
}

// C/C++ source: source/imgui/include/imgui_internal.h:3386
export function MouseButtonToKey(button) {
  0;
  return i32((i32(656) + button));
}

// C/C++ source: source/imgui/include/imgui_internal.h:525
export function ImTrunc__cxx_60cf3ae97be4(v) {
  return cCopyTrivialClass((ImVec2()).__cxx_construct_edecdff36a89174e(Math.fround(Math.fround(i32(v.x))), Math.fround(Math.fround(i32(v.y)))), ImVec2(), ["x", "y"]);
}

// C/C++ source: source/imgui/include/imgui.h:2897
export function __cxx_operator_5cbbdd7bd8f48e39(lhs, rhs) {
  return cCopyTrivialClass((ImVec2()).__cxx_construct_edecdff36a89174e(Math.fround((lhs.x * rhs)), Math.fround((lhs.y * rhs))), ImVec2(), ["x", "y"]);
}

// C/C++ source: source/imgui/include/imgui_internal.h:520
export function ImSaturate(f) {
  return Math.fround(((f < Math.fround(0)) ? Math.fround(0) : ((f > Math.fround(1)) ? Math.fround(1) : f)));
}

// C/C++ source: source/imgui/include/imgui_internal.h:526
export function ImFloor(f) {
  return Math.fround(Math.fround(Math.fround((((f >= Math.fround(0)) || (Math.fround(Math.fround(i32(f))) == f)) ? i32(f) : i32((i32(f) - 1))))));
}

// C/C++ source: source/imgui/include/imgui_internal.h:515
export function ImMax(lhs, rhs) {
  return cCopyTrivialClass((ImVec2()).__cxx_construct_edecdff36a89174e(((lhs.x >= rhs.x) ? lhs.x : rhs.x), ((lhs.y >= rhs.y) ? lhs.y : rhs.y)), ImVec2(), ["x", "y"]);
}

// C/C++ source: source/imgui/include/imgui_internal.h:402
export function ImCharIsBlankA(c) {
  return Boolean(((i32(c) == i32(32)) || (i32(c) == i32(9))));
}

// C/C++ source: source/imgui/include/imgui_internal.h:488
export function ImPow(x, y) {
  return Math.fround(powf(x, y));
}

// C/C++ source: source/imgui/include/imgui_internal.h:403
export function ImCharIsBlankW(c) {
  return Boolean((((c == u32(32)) || (c == u32(9))) || (c == u32(12288))));
}

// C/C++ source: source/imgui/src/imgui_widgets.cpp:1437
export function stb_text_makeundo_replace__header_1f12b38c269f(str, state, where, old_length, new_length) {
  let i;
  let p = stb_text_createundo__header_7ca9c59d9c19(cObjectFieldRef((state).value, "undostate"), where, old_length, new_length);
  if (p) {
    for ((i = i32(0)); (i < old_length); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return next; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
      ((cDeref(cPointerOffset(p, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = ((STB_TEXTEDIT_GETCHAR(str, i32((where + i)))) & 255));
    }
  }
}

// C/C++ source: source/imgui/src/imgui_widgets.cpp:1283
export function stb_text_createundo__header_7ca9c59d9c19(state, pos, insert_len, delete_len) {
  let r = stb_text_create_undo_record__header_4b0084eed9a0(state, insert_len);
  if (cPointerCompare(r, null, "==")) {
    return null;
  }
  (cRecordObject(r).where = i32(pos));
  (cRecordObject(r).insert_length = i32(insert_len));
  (cRecordObject(r).delete_length = i32(delete_len));
  if ((insert_len == 0)) {
    (cRecordObject(r).char_storage = i32((-1)));
    return null;
  } else {
    (cRecordObject(r).char_storage = i32((state).value.undo_char_point));
    ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = i32((Number(__cxx_lvalue_0.value) + Number(insert_len)))))(cObjectFieldRef((state).value, "undo_char_point"));
    return cPointerOffset((state).value.undo_char, cRecordObject(r).char_storage, Uint8Array.BYTES_PER_ELEMENT);
  }
}

// C/C++ source: source/imgui/include/imgui.h:2906
export function __cxx_operator_a3e4877983633319(lhs, rhs) {
  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = Math.fround((__cxx_lvalue_0.value + rhs.x))))(cObjectFieldRef(lhs, "x"));
  ((__cxx_lvalue_1) => (__cxx_lvalue_1.value = Math.fround((__cxx_lvalue_1.value + rhs.y))))(cObjectFieldRef(lhs, "y"));
  return lhs;
}

// C/C++ source: source/imgui/src/imgui_widgets.cpp:1466
export function stb_textedit_initialize_state__header_f9250ff9e7d0(state, is_single_line) {
  stb_textedit_clear_state__header_a5e6ba45a090(state, is_single_line);
}

// C/C++ source: source/imgui/src/imgui_widgets.cpp:755
export function stb_textedit_prep_selection_at_cursor__header_464188028a7d(state) {
  if ((!((state).value.select_start != (state).value.select_end))) {
    ((state).value.select_start = i32(((state).value.select_end = i32((state).value.cursor))));
  } else {
    ((state).value.cursor = i32((state).value.select_end));
  }
}

// C/C++ source: source/imgui/src/imgui_widgets.cpp:616
export function stb_textedit_clamp__header_652fa04694a1(str, state) {
  let n = i32(STB_TEXTEDIT_STRINGLEN(str));
  if (((state).value.select_start != (state).value.select_end)) {
    if (((state).value.select_start > n)) {
      ((state).value.select_start = i32(n));
    }
    if (((state).value.select_end > n)) {
      ((state).value.select_end = i32(n));
    }
    if (((state).value.select_start == (state).value.select_end)) {
      ((state).value.cursor = i32((state).value.select_start));
    }
  }
  if (((state).value.cursor > n)) {
    ((state).value.cursor = i32(n));
  }
}

// C/C++ source: source/imgui/src/imgui_widgets.cpp:764
export function stb_textedit_cut__header_9bb5fa305504(str, state) {
  if (((state).value.select_start != (state).value.select_end)) {
    stb_textedit_delete_selection__header_53daa0b87548(str, state);
    ((state).value.has_preferred_x = ((((0) & 255)) & 255));
    return i32(1);
  }
  return i32(0);
}

// C/C++ source: source/imgui/include/imgui_internal.h:521
export function ImLengthSqr(lhs) {
  return Math.fround(Math.fround((Math.fround((lhs.x * lhs.x)) + Math.fround((lhs.y * lhs.y)))));
}

// C/C++ source: source/imgui/include/imgui_internal.h:532
export function ImRotate(v, cos_a, sin_a) {
  return cCopyTrivialClass((ImVec2()).__cxx_construct_edecdff36a89174e(Math.fround((Math.fround((v.x * cos_a)) - Math.fround((v.y * sin_a)))), Math.fround((Math.fround((v.x * sin_a)) + Math.fround((v.y * cos_a))))), ImVec2(), ["x", "y"]);
}

// C/C++ source: source/imgui/include/imgui_internal.h:517
export function ImLerp__cxx_f225b3a9e1f8(a, b, t) {
  return cCopyTrivialClass((ImVec2()).__cxx_construct_edecdff36a89174e(Math.fround((a.x + Math.fround((Math.fround((b.x - a.x)) * t)))), Math.fround((a.y + Math.fround((Math.fround((b.y - a.y)) * t))))), ImVec2(), ["x", "y"]);
}

// C/C++ source: source/imgui/include/imgui_internal.h:401
export function ImToUpper(c) {
  return (((((i32(c) >= i32(97)) && (i32(c) <= i32(122))) ? (c = (((c & (~32))) & 255)) : c)) & 255);
}

// C/C++ source: source/imgui/include/imgui_internal.h:3175
export function WindowPosAbsToRel(window, p) {
  let off = cCopyTrivialClass(cRecordObject(window).DC.CursorStartPos, ImVec2(), ["x", "y"]);
  return cCopyTrivialClass((ImVec2()).__cxx_construct_edecdff36a89174e(Math.fround((p.x - off.x)), Math.fround((p.y - off.y))), ImVec2(), ["x", "y"]);
}

// C/C++ source: source/imgui/include/imgui_internal.h:534
export function ImLinearRemapClamp(s0, s1, d0, d1, x) {
  return Math.fround(Math.fround((Math.fround((ImSaturate(Math.fround((Math.fround((x - s0)) / Math.fround((s1 - s0))))) * Math.fround((d1 - d0)))) + d0)));
}

// C/C++ source: source/imgui/include/imgui_internal.h:493
export function ImAbs(x) {
  return Math.fround(fabsf(x));
}

// C/C++ source: source/imgui/include/imgui_internal.h:495
export function ImSign(x) {
  return Math.fround(((x < Math.fround(0)) ? (-Math.fround(1)) : ((x > Math.fround(0)) ? Math.fround(1) : Math.fround(0))));
}

// C/C++ source: source/imgui/include/imgui_internal.h:3176
export function WindowPosRelToAbs(window, p) {
  let off = cCopyTrivialClass(cRecordObject(window).DC.CursorStartPos, ImVec2(), ["x", "y"]);
  return cCopyTrivialClass((ImVec2()).__cxx_construct_edecdff36a89174e(Math.fround((p.x + off.x)), Math.fround((p.y + off.y))), ImVec2(), ["x", "y"]);
}

// C/C++ source: source/imgui/include/imgui_internal.h:516
export function ImClamp(v, mn, mx) {
  return cCopyTrivialClass((ImVec2()).__cxx_construct_edecdff36a89174e(((v.x < mn.x) ? mn.x : ((v.x > mx.x) ? mx.x : v.x)), ((v.y < mn.y) ? mn.y : ((v.y > mx.y) ? mx.y : v.y))), ImVec2(), ["x", "y"]);
}

// C/C++ source: source/imgui/include/imgui_internal.h:514
export function ImMin(lhs, rhs) {
  return cCopyTrivialClass((ImVec2()).__cxx_construct_edecdff36a89174e(((lhs.x < rhs.x) ? lhs.x : rhs.x), ((lhs.y < rhs.y) ? lhs.y : rhs.y)), ImVec2(), ["x", "y"]);
}

// C/C++ source: source/imgui/include/imgui_internal.h:518
export function ImLerp__cxx_d40d5a63fc9a(a, b, t) {
  return cCopyTrivialClass((ImVec2()).__cxx_construct_edecdff36a89174e(Math.fround((a.x + Math.fround((Math.fround((b.x - a.x)) * t.x)))), Math.fround((a.y + Math.fround((Math.fround((b.y - a.y)) * t.y))))), ImVec2(), ["x", "y"]);
}

// C/C++ source: source/imgui/include/imgui_internal.h:533
export function ImLinearSweep(current, target, speed) {
  if ((current < target)) {
    return Math.fround(ImMin(Math.fround((current + speed)), target));
  }
  if ((current > target)) {
    return Math.fround(ImMax(Math.fround((current - speed)), target));
  }
  return Math.fround(current);
}

// C/C++ source: source/imgui/include/imgui_internal.h:3568
export function TabBarGetTabOrder(tab_bar, tab) {
  return i32(cRecordObject(tab_bar).Tabs.index_from_ptr(tab));
}

// C/C++ source: source/imgui/src/imgui_widgets.cpp:1259
export function stb_text_create_undo_record__header_4b0084eed9a0(state, numchars) {
  stb_textedit_flush_redo__header_81ca1185cd74(state);
  if ((i32((state).value.undo_point) == 99)) {
    stb_textedit_discard_undo__header_9304c4e94806(state);
  }
  if ((numchars > 999)) {
    ((state).value.undo_point = ((((((0) << 16) >> 16)) << 16) >> 16));
    ((state).value.undo_char_point = i32(0));
    return null;
  }
  while ((i32(((state).value.undo_char_point + numchars)) > 999)) {
    stb_textedit_discard_undo__header_9304c4e94806(state);
  }
  return cPointerOffset((state).value.undo_rec, ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = ((((previous + 1)) << 16) >> 16); __cxx_lvalue_0.value = next; return previous; })(cObjectFieldRef((state).value, "undo_point")), 16);
}

// C/C++ source: source/imgui/src/imgui_widgets.cpp:1448
export function stb_textedit_clear_state__header_a5e6ba45a090(state, is_single_line) {
  ((state).value.undostate.undo_point = ((((((0) << 16) >> 16)) << 16) >> 16));
  ((state).value.undostate.undo_char_point = i32(0));
  ((state).value.undostate.redo_point = ((((((99) << 16) >> 16)) << 16) >> 16));
  ((state).value.undostate.redo_char_point = i32(999));
  ((state).value.select_end = i32(((state).value.select_start = i32(0))));
  ((state).value.cursor = i32(0));
  ((state).value.has_preferred_x = ((((0) & 255)) & 255));
  ((state).value.preferred_x = Math.fround(Math.fround(0)));
  ((state).value.cursor_at_end_of_line = ((((0) & 255)) & 255));
  ((state).value.initialized = ((((1) & 255)) & 255));
  ((state).value.single_line = ((((((is_single_line) & 255)) & 255)) & 255));
  ((state).value.insert_mode = ((((0) & 255)) & 255));
  ((state).value.row_count_per_page = i32(0));
}

// C/C++ source: source/imgui/src/imgui_widgets.cpp:638
export function stb_textedit_delete_selection__header_53daa0b87548(str, state) {
  stb_textedit_clamp__header_652fa04694a1(str, state);
  if (((state).value.select_start != (state).value.select_end)) {
    if (((state).value.select_start < (state).value.select_end)) {
      stb_textedit_delete__header_43dec4568a34(str, state, (state).value.select_start, i32(((state).value.select_end - (state).value.select_start)));
      ((state).value.select_end = i32(((state).value.cursor = i32((state).value.select_start))));
    } else {
      stb_textedit_delete__header_43dec4568a34(str, state, (state).value.select_end, i32(((state).value.select_start - (state).value.select_end)));
      ((state).value.select_start = i32(((state).value.cursor = i32((state).value.select_end))));
    }
    ((state).value.has_preferred_x = ((((0) & 255)) & 255));
  }
}

// C/C++ source: source/imgui/src/imgui_widgets.cpp:1200
export function stb_textedit_flush_redo__header_81ca1185cd74(state) {
  ((state).value.redo_point = ((((((99) << 16) >> 16)) << 16) >> 16));
  ((state).value.redo_char_point = i32(999));
}

// C/C++ source: source/imgui/src/imgui_widgets.cpp:1207
export function stb_textedit_discard_undo__header_9304c4e94806(state) {
  if ((i32((state).value.undo_point) > 0)) {
    if (((cPointerElementRef((state).value.undo_rec, 0).value).char_storage >= 0)) {
      let n = i32((cPointerElementRef((state).value.undo_rec, 0).value).insert_length);
      let i;
      ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = i32((Number(__cxx_lvalue_0.value) - Number(n)))))(cObjectFieldRef((state).value, "undo_char_point"));
      cByteMemory.memmove((state).value.undo_char, cPointerOffset((state).value.undo_char, n, Uint8Array.BYTES_PER_ELEMENT), u64((BigInt(u64((state).value.undo_char_point)) * BigInt(1))));
      for ((i = i32(0)); (i < i32((state).value.undo_point)); ((__cxx_lvalue_1) => { const previous = __cxx_lvalue_1.value; const next = i32((previous + 1)); __cxx_lvalue_1.value = next; return next; })(cRef(() => i, __cxx_lvalue_2 => { i = __cxx_lvalue_2; }))) {
        if (((cPointerElementRef((state).value.undo_rec, i).value).char_storage >= 0)) {
          ((__cxx_lvalue_3) => (__cxx_lvalue_3.value = i32((Number(__cxx_lvalue_3.value) - Number(n)))))(cObjectFieldRef((cPointerElementRef((state).value.undo_rec, i).value), "char_storage"));
        }
      }
    }
    ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = ((((previous - 1)) << 16) >> 16); __cxx_lvalue_4.value = next; return next; })(cObjectFieldRef((state).value, "undo_point"));
    cByteMemory.memmove((state).value.undo_rec, cPointerOffset((state).value.undo_rec, 1, 16), u64((BigInt(u64((state).value.undo_point)) * BigInt(16))));
  }
}

// C/C++ source: source/imgui/src/imgui_widgets.cpp:630
export function stb_textedit_delete__header_43dec4568a34(str, state, where, len) {
  stb_text_makeundo_delete__header_6bcde27ca32d(str, state, where, len);
  STB_TEXTEDIT_DELETECHARS(str, where, len);
  ((state).value.has_preferred_x = ((((0) & 255)) & 255));
}

// C/C++ source: source/imgui/src/imgui_widgets.cpp:1422
export function stb_text_makeundo_insert__header_43fda5a305a2(state, where, length) {
  stb_text_createundo__header_7ca9c59d9c19(cObjectFieldRef((state).value, "undostate"), where, 0, length);
}

// C/C++ source: source/imgui/src/imgui_widgets.cpp:1427
export function stb_text_makeundo_delete__header_6bcde27ca32d(str, state, where, length) {
  let i;
  let p = stb_text_createundo__header_7ca9c59d9c19(cObjectFieldRef((state).value, "undostate"), where, length, 0);
  if (p) {
    for ((i = i32(0)); (i < length); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return next; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
      ((cDeref(cPointerOffset(p, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = ((STB_TEXTEDIT_GETCHAR(str, i32((where + i)))) & 255));
    }
  }
}
