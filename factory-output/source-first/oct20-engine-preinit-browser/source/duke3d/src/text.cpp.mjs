// Bounded source-language pointer aliases over native JS typed buffers/arrays.
// Embedded in generated ES modules; never a CPU, ISA or opcode interpreter.
const cPointer = source => {
  if (source?.__cDeferredPointer === true) return cPointer(source.resolve());
  if (source && source.__cPointer === true) return source;
  if(source?.__cReference===true&&source.value?.[Symbol.for('source-first.original-byte-record-storage/1')])
    return cPointer(source.value);
  const record=source?.[Symbol.for('source-first.original-byte-record-storage/1')];
  if(record)return cPointer(record.bytes);
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
    // An original field/element lvalue already implements its zero-offset
    // dereference, including packed pointer fields without a pointer-array
    // registration. Other indices still require actual bounded array storage.
    if (index===0) return source;
    if (source.__cPointer!==true) throw new RangeError('C single-object pointer escapes original storage');
  }
  const pointer=cPointer(source);
  if(pointer.__cRecordPointer===true){
    const api=globalThis[Symbol.for('source-first.record-pointer-views/1')];
    if(!api)throw new TypeError('Original record-pointer view provider missing');
    return api.element(pointer,index);
  }
  if (!pointer.array) {
    const allocation=globalThis[Symbol.for('source-first.pointer-array-allocations/1')]?.get(pointer.buffer);
    const offset=pointer.offset+index*8;
    if(!allocation)throw new TypeError('C aggregate/pointer slot requires a proven source array');
    if(!Number.isSafeInteger(offset)||offset%8||offset<pointer.lower||offset+8>pointer.upper||
        offset<allocation.lower||offset+8>allocation.upper)throw new RangeError('Pointer slot escapes original LP64 allocation');
    return {...pointer,__cReference:true,offset,get value(){return allocation.read(offset);},set value(value){allocation.write(offset,value);}};
  }
  const stride=pointer.stride || 1;
  const offset=pointer.offset+index*stride;
  if (!Number.isSafeInteger(offset) || offset<pointer.lower || offset>=pointer.upper || offset%stride)
    throw new RangeError('C aggregate/pointer array index escapes original bounds');
  const slot=offset/stride;
  return {...pointer,__cReference:true,offset,get value(){return pointer.buffer[slot];},set value(next){pointer.buffer[slot]=next;}};
};
const cTypedPointer = (source, Type) => {
  if (!Type || !Number.isSafeInteger(Type.BYTES_PER_ELEMENT)) throw new TypeError('Unsupported pointer element type');
  if (source===null) return null;
  const pointerBytes=source?.[Symbol.for('source-first.clang-byte-record-array/1')];
  if(pointerBytes)return cPointer(pointerBytes);
  if (Array.isArray(source)) return { ...cPointer(source), upper:source.length*Type.BYTES_PER_ELEMENT, stride:Type.BYTES_PER_ELEMENT };
  const pointer=cPointer(source);
  if(pointer.__cRecordPointer===true){
    const {__cRecordPointer,recordSchema,recordPrototypes,...raw}=pointer;
    return raw;
  }
  return pointer;
};
const cPointerOffset = (source, delta, stride=1) => {
  const initial=cPointer(source);
  const p=Array.isArray(source) ? {...initial, upper:source.length*stride, stride} : initial;
  if (p.array && p.stride!==stride) throw new TypeError('Cannot reinterpret JS numeric-array element widths');
  const change=Number(delta)*stride, next=p.offset+change;
  if (!Number.isSafeInteger(change) || !Number.isSafeInteger(next) || next<p.lower || next>p.upper)
    throw new RangeError('C pointer escapes original array bounds');
  if(p.__cPointer===true&&p.__cReference===true){
    if(next===p.offset)return p;
    return {__cPointer:true,buffer:p.buffer,array:p.array,lower:p.lower,upper:p.upper,offset:next,
      ...(p.array?{stride:p.stride}: {})};
  }
  const result={...p,offset:next};
  return result;
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
  if(left?.__cReference===true&&left.__cPointer!==true&&left.value?.[Symbol.for('source-first.original-byte-record-storage/1')])left=left.value;
  if(right?.__cReference===true&&right.__cPointer!==true&&right.value?.[Symbol.for('source-first.original-byte-record-storage/1')])right=right.value;
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
  if (left?.__cReference===true&&left.__cPointer!==true || right?.__cReference===true&&right.__cPointer!==true) {
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
  const address=value=>{
    const p=Array.isArray(value)?{...cPointer(value),upper:value.length*stride,stride}:cPointer(value);
    const bytes=p.array&&p.buffer[Symbol.for('source-first.clang-byte-record-array/1')];
    return bytes?{buffer:bytes.buffer,lower:bytes.byteOffset+p.lower,upper:bytes.byteOffset+p.upper,offset:bytes.byteOffset+p.offset}:p;
  };
  const a=address(left),b=address(right);
  if (a.buffer!==b.buffer || a.lower!==b.lower || a.upper!==b.upper)
    throw new TypeError('Cannot subtract pointers to different source arrays');
  const delta=(a.offset-b.offset)/stride;
  if (!Number.isSafeInteger(delta)) throw new RangeError('Misaligned C pointer difference');
  return delta;
};

// Original emitted module follows unchanged.
// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/duke3d/src/text.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
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
export const fix16_rad_to_deg_mult__header_global_57da2e6e10a562c7 = i32(3754936);
function __cxx_static_address_83d12a6d0d56213c4d19466c() {
  return __cxx_static_address_83d12a6d0d56213c4d19466c.reference || (__cxx_static_address_83d12a6d0d56213c4d19466c.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_57da2e6e10a562c7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_3ff09e32445b23cd = i32(1144);
function __cxx_static_address_fec59190f3629619107950c1() {
  return __cxx_static_address_fec59190f3629619107950c1.reference || (__cxx_static_address_fec59190f3629619107950c1.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_3ff09e32445b23cd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:43
export const KICK_HIT____header_global_dc6424d3e232a5c2 = ((((((0) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a532c68b25be74e12395c3aa() {
  return __cxx_static_address_a532c68b25be74e12395c3aa.reference || (__cxx_static_address_a532c68b25be74e12395c3aa.reference = {
    __cReference: true,
    get value() { return KICK_HIT____header_global_dc6424d3e232a5c2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:44
export const PISTOL_RICOCHET____header_global_16b15dfe015093db = ((((((1) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_406da670902f3c1483975e58() {
  return __cxx_static_address_406da670902f3c1483975e58.reference || (__cxx_static_address_406da670902f3c1483975e58.reference = {
    __cReference: true,
    get value() { return PISTOL_RICOCHET____header_global_16b15dfe015093db; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:45
export const PISTOL_BODYHIT____header_global_f5803074ab73131e = ((((((2) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0e0bdb5ce5d89aacbb8ba227() {
  return __cxx_static_address_0e0bdb5ce5d89aacbb8ba227.reference || (__cxx_static_address_0e0bdb5ce5d89aacbb8ba227.reference = {
    __cReference: true,
    get value() { return PISTOL_BODYHIT____header_global_f5803074ab73131e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:46
export const PISTOL_FIRE____header_global_61947ccc3045c34e = ((((((3) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3179058141a5158933947e2b() {
  return __cxx_static_address_3179058141a5158933947e2b.reference || (__cxx_static_address_3179058141a5158933947e2b.reference = {
    __cReference: true,
    get value() { return PISTOL_FIRE____header_global_61947ccc3045c34e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:47
export const EJECT_CLIP____header_global_6f917dce80eba497 = ((((((4) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a55612a694d4b7c6582c2a61() {
  return __cxx_static_address_a55612a694d4b7c6582c2a61.reference || (__cxx_static_address_a55612a694d4b7c6582c2a61.reference = {
    __cReference: true,
    get value() { return EJECT_CLIP____header_global_6f917dce80eba497; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:48
export const INSERT_CLIP____header_global_59592ce4bfc16a2a = ((((((5) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c8e57fb972266185af938240() {
  return __cxx_static_address_c8e57fb972266185af938240.reference || (__cxx_static_address_c8e57fb972266185af938240.reference = {
    __cReference: true,
    get value() { return INSERT_CLIP____header_global_59592ce4bfc16a2a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:49
export const CHAINGUN_FIRE____header_global_df150a5ecb2dc06f = ((((((6) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a8c89fafdefcd25eb6142477() {
  return __cxx_static_address_a8c89fafdefcd25eb6142477.reference || (__cxx_static_address_a8c89fafdefcd25eb6142477.reference = {
    __cReference: true,
    get value() { return CHAINGUN_FIRE____header_global_df150a5ecb2dc06f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:50
export const RPG_SHOOT____header_global_79a4c621f1e6f12a = ((((((7) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_66ae24d280c68e0ab47fd78e() {
  return __cxx_static_address_66ae24d280c68e0ab47fd78e.reference || (__cxx_static_address_66ae24d280c68e0ab47fd78e.reference = {
    __cReference: true,
    get value() { return RPG_SHOOT____header_global_79a4c621f1e6f12a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:51
export const POOLBALLHIT____header_global_f788e49a5fac6b01 = ((((((8) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b44d1b2a69fce6b46652aa61() {
  return __cxx_static_address_b44d1b2a69fce6b46652aa61.reference || (__cxx_static_address_b44d1b2a69fce6b46652aa61.reference = {
    __cReference: true,
    get value() { return POOLBALLHIT____header_global_f788e49a5fac6b01; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:52
export const RPG_EXPLODE____header_global_611b80b9d444d3c3 = ((((((9) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a06fa79b427dcd8152fd1891() {
  return __cxx_static_address_a06fa79b427dcd8152fd1891.reference || (__cxx_static_address_a06fa79b427dcd8152fd1891.reference = {
    __cReference: true,
    get value() { return RPG_EXPLODE____header_global_611b80b9d444d3c3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:53
export const CAT_FIRE____header_global_15d84d96ede7360c = ((((((10) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b901e2d2fa0993d022249429() {
  return __cxx_static_address_b901e2d2fa0993d022249429.reference || (__cxx_static_address_b901e2d2fa0993d022249429.reference = {
    __cReference: true,
    get value() { return CAT_FIRE____header_global_15d84d96ede7360c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:54
export const SHRINKER_FIRE____header_global_6bfa3ebf9c0244cb = ((((((11) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3427e79a63c04198e9c15f03() {
  return __cxx_static_address_3427e79a63c04198e9c15f03.reference || (__cxx_static_address_3427e79a63c04198e9c15f03.reference = {
    __cReference: true,
    get value() { return SHRINKER_FIRE____header_global_6bfa3ebf9c0244cb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:55
export const PIPEBOMB_BOUNCE____header_global_40cdc3a5002b5c04 = ((((((13) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_30a8574ae958ba418fbfebfe() {
  return __cxx_static_address_30a8574ae958ba418fbfebfe.reference || (__cxx_static_address_30a8574ae958ba418fbfebfe.reference = {
    __cReference: true,
    get value() { return PIPEBOMB_BOUNCE____header_global_40cdc3a5002b5c04; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:56
export const PIPEBOMB_EXPLODE____header_global_e55f4437d1de702b = ((((((14) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_38415bfe69b2f5edf8d03b3f() {
  return __cxx_static_address_38415bfe69b2f5edf8d03b3f.reference || (__cxx_static_address_38415bfe69b2f5edf8d03b3f.reference = {
    __cReference: true,
    get value() { return PIPEBOMB_EXPLODE____header_global_e55f4437d1de702b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:57
export const LASERTRIP_ONWALL____header_global_cec7fc8475892db1 = ((((((15) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f544eeee2105462dfd7bfec1() {
  return __cxx_static_address_f544eeee2105462dfd7bfec1.reference || (__cxx_static_address_f544eeee2105462dfd7bfec1.reference = {
    __cReference: true,
    get value() { return LASERTRIP_ONWALL____header_global_cec7fc8475892db1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:58
export const LASERTRIP_ARMING____header_global_f51848b747b0f8f9 = ((((((16) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_411c5077d8563b1c6b69446b() {
  return __cxx_static_address_411c5077d8563b1c6b69446b.reference || (__cxx_static_address_411c5077d8563b1c6b69446b.reference = {
    __cReference: true,
    get value() { return LASERTRIP_ARMING____header_global_f51848b747b0f8f9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:59
export const LASERTRIP_EXPLODE____header_global_679e5555d9becf69 = ((((((17) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0c117f31a10506882ca5deab() {
  return __cxx_static_address_0c117f31a10506882ca5deab.reference || (__cxx_static_address_0c117f31a10506882ca5deab.reference = {
    __cReference: true,
    get value() { return LASERTRIP_EXPLODE____header_global_679e5555d9becf69; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:60
export const VENT_BUST____header_global_e054f2467646bd1c = ((((((18) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_45989db13fb5042e7342f07d() {
  return __cxx_static_address_45989db13fb5042e7342f07d.reference || (__cxx_static_address_45989db13fb5042e7342f07d.reference = {
    __cReference: true,
    get value() { return VENT_BUST____header_global_e054f2467646bd1c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:61
export const GLASS_BREAKING____header_global_2dd474c1289ee7b8 = ((((((19) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_191752fa38efdbde94e65966() {
  return __cxx_static_address_191752fa38efdbde94e65966.reference || (__cxx_static_address_191752fa38efdbde94e65966.reference = {
    __cReference: true,
    get value() { return GLASS_BREAKING____header_global_2dd474c1289ee7b8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:62
export const GLASS_HEAVYBREAK____header_global_4ee6193d920ab554 = ((((((20) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3617a196317036a92ac80a25() {
  return __cxx_static_address_3617a196317036a92ac80a25.reference || (__cxx_static_address_3617a196317036a92ac80a25.reference = {
    __cReference: true,
    get value() { return GLASS_HEAVYBREAK____header_global_4ee6193d920ab554; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:63
export const SHORT_CIRCUIT____header_global_57ec1b2e8e69e282 = ((((((21) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_51c6ba6230fea3cc8e56687c() {
  return __cxx_static_address_51c6ba6230fea3cc8e56687c.reference || (__cxx_static_address_51c6ba6230fea3cc8e56687c.reference = {
    __cReference: true,
    get value() { return SHORT_CIRCUIT____header_global_57ec1b2e8e69e282; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:64
export const ITEM_SPLASH____header_global_b3008f01661f97d4 = ((((((22) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f12e4cc6a1d4d86a67503392() {
  return __cxx_static_address_f12e4cc6a1d4d86a67503392.reference || (__cxx_static_address_f12e4cc6a1d4d86a67503392.reference = {
    __cReference: true,
    get value() { return ITEM_SPLASH____header_global_b3008f01661f97d4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:65
export const DUKE_GASP____header_global_3acd723c74735ffc = ((((((25) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_04d3415c92a923056b0807cd() {
  return __cxx_static_address_04d3415c92a923056b0807cd.reference || (__cxx_static_address_04d3415c92a923056b0807cd.reference = {
    __cReference: true,
    get value() { return DUKE_GASP____header_global_3acd723c74735ffc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:66
export const SLIM_RECOG____header_global_e6b427885c0b8098 = ((((((26) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_790d586f8bce1b34ae5742a1() {
  return __cxx_static_address_790d586f8bce1b34ae5742a1.reference || (__cxx_static_address_790d586f8bce1b34ae5742a1.reference = {
    __cReference: true,
    get value() { return SLIM_RECOG____header_global_e6b427885c0b8098; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:67
export const DUKE_URINATE____header_global_50bc9ee7f5b153e1 = ((((((28) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_82095b5b659dac6056465882() {
  return __cxx_static_address_82095b5b659dac6056465882.reference || (__cxx_static_address_82095b5b659dac6056465882.reference = {
    __cReference: true,
    get value() { return DUKE_URINATE____header_global_50bc9ee7f5b153e1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:68
export const ENDSEQVOL3SND2____header_global_48fa91fbb3cab06c = ((((((29) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_486c62c76de70cf75c2c5780() {
  return __cxx_static_address_486c62c76de70cf75c2c5780.reference || (__cxx_static_address_486c62c76de70cf75c2c5780.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND2____header_global_48fa91fbb3cab06c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:69
export const ENDSEQVOL3SND3____header_global_9802b0d94d5a382e = ((((((30) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_844adaeeda1006d1d252b571() {
  return __cxx_static_address_844adaeeda1006d1d252b571.reference || (__cxx_static_address_844adaeeda1006d1d252b571.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND3____header_global_9802b0d94d5a382e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:70
export const DUKE_CRACK____header_global_7f55c56a6b634a3b = ((((((33) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_570a9d63d2d7857a433a75c6() {
  return __cxx_static_address_570a9d63d2d7857a433a75c6.reference || (__cxx_static_address_570a9d63d2d7857a433a75c6.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK____header_global_7f55c56a6b634a3b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:71
export const SLIM_ATTACK____header_global_6ef8b73d2f3ee9b2 = ((((((34) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1fa2fb80fc789cff65caee03() {
  return __cxx_static_address_1fa2fb80fc789cff65caee03.reference || (__cxx_static_address_1fa2fb80fc789cff65caee03.reference = {
    __cReference: true,
    get value() { return SLIM_ATTACK____header_global_6ef8b73d2f3ee9b2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:72
export const SOMETHINGHITFORCE____header_global_fc92e176c18b85ad = ((((((35) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4a1e3a41627f53fd93778f78() {
  return __cxx_static_address_4a1e3a41627f53fd93778f78.reference || (__cxx_static_address_4a1e3a41627f53fd93778f78.reference = {
    __cReference: true,
    get value() { return SOMETHINGHITFORCE____header_global_fc92e176c18b85ad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:73
export const DUKE_DRINKING____header_global_c10466d9f6e01200 = ((((((36) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e48d87fff6acaf93f4deb0ac() {
  return __cxx_static_address_e48d87fff6acaf93f4deb0ac.reference || (__cxx_static_address_e48d87fff6acaf93f4deb0ac.reference = {
    __cReference: true,
    get value() { return DUKE_DRINKING____header_global_c10466d9f6e01200; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:74
export const DUKE_GRUNT____header_global_825682158878f185 = ((((((38) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f55e50654f76e6df670e34b1() {
  return __cxx_static_address_f55e50654f76e6df670e34b1.reference || (__cxx_static_address_f55e50654f76e6df670e34b1.reference = {
    __cReference: true,
    get value() { return DUKE_GRUNT____header_global_825682158878f185; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:75
export const DUKE_HARTBEAT____header_global_ccaeb89b6e5e2518 = ((((((39) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_30983b801300ca8c95070ded() {
  return __cxx_static_address_30983b801300ca8c95070ded.reference || (__cxx_static_address_30983b801300ca8c95070ded.reference = {
    __cReference: true,
    get value() { return DUKE_HARTBEAT____header_global_ccaeb89b6e5e2518; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:76
export const DUKE_ONWATER____header_global_e9466037d6e0b2a5 = ((((((40) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fabe7df3d93990132762cef9() {
  return __cxx_static_address_fabe7df3d93990132762cef9.reference || (__cxx_static_address_fabe7df3d93990132762cef9.reference = {
    __cReference: true,
    get value() { return DUKE_ONWATER____header_global_e9466037d6e0b2a5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:77
export const DUKE_LAND____header_global_cb4b8cd41972e465 = ((((((42) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4e1e0277ea9b7aaf24432205() {
  return __cxx_static_address_4e1e0277ea9b7aaf24432205.reference || (__cxx_static_address_4e1e0277ea9b7aaf24432205.reference = {
    __cReference: true,
    get value() { return DUKE_LAND____header_global_cb4b8cd41972e465; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:78
export const DUKE_WALKINDUCTS____header_global_981f2990d64782a2 = ((((((43) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b3e75f8c0e48141cf5e114b2() {
  return __cxx_static_address_b3e75f8c0e48141cf5e114b2.reference || (__cxx_static_address_b3e75f8c0e48141cf5e114b2.reference = {
    __cReference: true,
    get value() { return DUKE_WALKINDUCTS____header_global_981f2990d64782a2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:79
export const DUKE_UNDERWATER____header_global_23c6ea7c476551df = ((((((48) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ecfeb22a2f0afd6678bc2b3e() {
  return __cxx_static_address_ecfeb22a2f0afd6678bc2b3e.reference || (__cxx_static_address_ecfeb22a2f0afd6678bc2b3e.reference = {
    __cReference: true,
    get value() { return DUKE_UNDERWATER____header_global_23c6ea7c476551df; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:80
export const DUKE_JETPACK_ON____header_global_8761620d8dc29c13 = ((((((49) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_76453162e0e25745955a9cd1() {
  return __cxx_static_address_76453162e0e25745955a9cd1.reference || (__cxx_static_address_76453162e0e25745955a9cd1.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_ON____header_global_8761620d8dc29c13; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:81
export const DUKE_JETPACK_IDLE____header_global_91da411de0405ffb = ((((((50) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_32c5fa0c35bffb78c0271ef0() {
  return __cxx_static_address_32c5fa0c35bffb78c0271ef0.reference || (__cxx_static_address_32c5fa0c35bffb78c0271ef0.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_IDLE____header_global_91da411de0405ffb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:82
export const DUKE_JETPACK_OFF____header_global_c5019c6f6b6681de = ((((((51) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fc9bfa76c0462eebf98ee00e() {
  return __cxx_static_address_fc9bfa76c0462eebf98ee00e.reference || (__cxx_static_address_fc9bfa76c0462eebf98ee00e.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_OFF____header_global_c5019c6f6b6681de; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:83
export const DUKETALKTOBOSS____header_global_68d27f2de9ebe082 = ((((((56) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_014e4ee9fd2a0c2368b31207() {
  return __cxx_static_address_014e4ee9fd2a0c2368b31207.reference || (__cxx_static_address_014e4ee9fd2a0c2368b31207.reference = {
    __cReference: true,
    get value() { return DUKETALKTOBOSS____header_global_68d27f2de9ebe082; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:84
export const SQUISHED____header_global_9f70ac8fb7bca9c7 = ((((((69) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4cba881a504f2a99c92e9395() {
  return __cxx_static_address_4cba881a504f2a99c92e9395.reference || (__cxx_static_address_4cba881a504f2a99c92e9395.reference = {
    __cReference: true,
    get value() { return SQUISHED____header_global_9f70ac8fb7bca9c7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:85
export const TELEPORTER____header_global_5616137ca9c6be3b = ((((((70) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1b6e4522cdc4c620421899e0() {
  return __cxx_static_address_1b6e4522cdc4c620421899e0.reference || (__cxx_static_address_1b6e4522cdc4c620421899e0.reference = {
    __cReference: true,
    get value() { return TELEPORTER____header_global_5616137ca9c6be3b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:86
export const ELEVATOR_ON____header_global_8f84d566ab81828e = ((((((71) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_33a7ea3ade4fcd1cc4db1bf2() {
  return __cxx_static_address_33a7ea3ade4fcd1cc4db1bf2.reference || (__cxx_static_address_33a7ea3ade4fcd1cc4db1bf2.reference = {
    __cReference: true,
    get value() { return ELEVATOR_ON____header_global_8f84d566ab81828e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:87
export const ELEVATOR_OFF____header_global_1710bb9ada96540e = ((((((73) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b35596c2cf3a4a1f46440433() {
  return __cxx_static_address_b35596c2cf3a4a1f46440433.reference || (__cxx_static_address_b35596c2cf3a4a1f46440433.reference = {
    __cReference: true,
    get value() { return ELEVATOR_OFF____header_global_1710bb9ada96540e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:88
export const SUBWAY____header_global_d6a81c2485079eb0 = ((((((75) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_77c38e16d1014073590e26b8() {
  return __cxx_static_address_77c38e16d1014073590e26b8.reference || (__cxx_static_address_77c38e16d1014073590e26b8.reference = {
    __cReference: true,
    get value() { return SUBWAY____header_global_d6a81c2485079eb0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:89
export const SWITCH_ON____header_global_7391fad79de3919d = ((((((76) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2fdcc4227bf2af45a68b343a() {
  return __cxx_static_address_2fdcc4227bf2af45a68b343a.reference || (__cxx_static_address_2fdcc4227bf2af45a68b343a.reference = {
    __cReference: true,
    get value() { return SWITCH_ON____header_global_7391fad79de3919d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:90
export const FLUSH_TOILET____header_global_35074229d54f69d1 = ((((((79) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_42ec1939af805fa04e676734() {
  return __cxx_static_address_42ec1939af805fa04e676734.reference || (__cxx_static_address_42ec1939af805fa04e676734.reference = {
    __cReference: true,
    get value() { return FLUSH_TOILET____header_global_35074229d54f69d1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:91
export const EARTHQUAKE____header_global_23278fcbcf38dc54 = ((((((81) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fb9bea14640bdebe73aea5f3() {
  return __cxx_static_address_fb9bea14640bdebe73aea5f3.reference || (__cxx_static_address_fb9bea14640bdebe73aea5f3.reference = {
    __cReference: true,
    get value() { return EARTHQUAKE____header_global_23278fcbcf38dc54; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:92
export const END_OF_LEVEL_WARN____header_global_075f6cc492659bcf = ((((((83) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bbde68ccaf94a8639042f1a8() {
  return __cxx_static_address_bbde68ccaf94a8639042f1a8.reference || (__cxx_static_address_bbde68ccaf94a8639042f1a8.reference = {
    __cReference: true,
    get value() { return END_OF_LEVEL_WARN____header_global_075f6cc492659bcf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:93
export const WIND_AMBIENCE____header_global_09134e27c129d9c3 = ((((((91) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e439245e37b58c4c37143fbc() {
  return __cxx_static_address_e439245e37b58c4c37143fbc.reference || (__cxx_static_address_e439245e37b58c4c37143fbc.reference = {
    __cReference: true,
    get value() { return WIND_AMBIENCE____header_global_09134e27c129d9c3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:94
export const SOMETHING_DRIPPING____header_global_3fab97f552fb39d8 = ((((((92) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6de79c6a77eb885b12c11c1e() {
  return __cxx_static_address_6de79c6a77eb885b12c11c1e.reference || (__cxx_static_address_6de79c6a77eb885b12c11c1e.reference = {
    __cReference: true,
    get value() { return SOMETHING_DRIPPING____header_global_3fab97f552fb39d8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:95
export const BOS1_RECOG____header_global_80aed5e7dfaf19e8 = ((((((97) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a89957862e91e0985862fa41() {
  return __cxx_static_address_a89957862e91e0985862fa41.reference || (__cxx_static_address_a89957862e91e0985862fa41.reference = {
    __cReference: true,
    get value() { return BOS1_RECOG____header_global_80aed5e7dfaf19e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:96
export const BOS2_RECOG____header_global_1f0200434a9bca7d = ((((((102) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9e82206984cc4160748389c3() {
  return __cxx_static_address_9e82206984cc4160748389c3.reference || (__cxx_static_address_9e82206984cc4160748389c3.reference = {
    __cReference: true,
    get value() { return BOS2_RECOG____header_global_1f0200434a9bca7d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:97
export const DUKE_GETWEAPON2____header_global_0a38af8a022a244b = ((((((107) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_71029bc400c0215ae985c4ed() {
  return __cxx_static_address_71029bc400c0215ae985c4ed.reference || (__cxx_static_address_71029bc400c0215ae985c4ed.reference = {
    __cReference: true,
    get value() { return DUKE_GETWEAPON2____header_global_0a38af8a022a244b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:98
export const SHOTGUN_FIRE____header_global_d8078e7686ca6f3c = ((((((109) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f337c41762b902bc341a1afd() {
  return __cxx_static_address_f337c41762b902bc341a1afd.reference || (__cxx_static_address_f337c41762b902bc341a1afd.reference = {
    __cReference: true,
    get value() { return SHOTGUN_FIRE____header_global_d8078e7686ca6f3c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:99
export const PRED_RECOG____header_global_c2e7c71931274511 = ((((((111) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7769f7bab60134eea00499ea() {
  return __cxx_static_address_7769f7bab60134eea00499ea.reference || (__cxx_static_address_7769f7bab60134eea00499ea.reference = {
    __cReference: true,
    get value() { return PRED_RECOG____header_global_c2e7c71931274511; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:100
export const CAPT_RECOG____header_global_1939d20fe09740c2 = ((((((117) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3baba2414284b6d0d20e49fd() {
  return __cxx_static_address_3baba2414284b6d0d20e49fd.reference || (__cxx_static_address_3baba2414284b6d0d20e49fd.reference = {
    __cReference: true,
    get value() { return CAPT_RECOG____header_global_1939d20fe09740c2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:101
export const PIG_RECOG____header_global_6d45232ba80900b2 = ((((((121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9fca867977e0abdac91a1c10() {
  return __cxx_static_address_9fca867977e0abdac91a1c10.reference || (__cxx_static_address_9fca867977e0abdac91a1c10.reference = {
    __cReference: true,
    get value() { return PIG_RECOG____header_global_6d45232ba80900b2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:102
export const RECO_ROAM____header_global_b7331429af576592 = ((((((125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2f38bace71c23dfad28f39a6() {
  return __cxx_static_address_2f38bace71c23dfad28f39a6.reference || (__cxx_static_address_2f38bace71c23dfad28f39a6.reference = {
    __cReference: true,
    get value() { return RECO_ROAM____header_global_b7331429af576592; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:103
export const RECO_RECOG____header_global_7c41d9ca867af122 = ((((((126) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d4af0c5633da4600b5c3dfc1() {
  return __cxx_static_address_d4af0c5633da4600b5c3dfc1.reference || (__cxx_static_address_d4af0c5633da4600b5c3dfc1.reference = {
    __cReference: true,
    get value() { return RECO_RECOG____header_global_7c41d9ca867af122; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:104
export const RECO_ATTACK____header_global_092d221ef505a963 = ((((((127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a35bed7d5291f19ab1992395() {
  return __cxx_static_address_a35bed7d5291f19ab1992395.reference || (__cxx_static_address_a35bed7d5291f19ab1992395.reference = {
    __cReference: true,
    get value() { return RECO_ATTACK____header_global_092d221ef505a963; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:105
export const RECO_PAIN____header_global_d1b7520e05068a05 = ((((((128) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6049328cc0f80dffa6256802() {
  return __cxx_static_address_6049328cc0f80dffa6256802.reference || (__cxx_static_address_6049328cc0f80dffa6256802.reference = {
    __cReference: true,
    get value() { return RECO_PAIN____header_global_d1b7520e05068a05; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:106
export const DRON_RECOG____header_global_e3027792ab604d80 = ((((((131) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_685c6117558230e444a3a64c() {
  return __cxx_static_address_685c6117558230e444a3a64c.reference || (__cxx_static_address_685c6117558230e444a3a64c.reference = {
    __cReference: true,
    get value() { return DRON_RECOG____header_global_e3027792ab604d80; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:107
export const COMM_RECOG____header_global_cdd9807b74082250 = ((((((136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c81acd5b06814f162d97d5b3() {
  return __cxx_static_address_c81acd5b06814f162d97d5b3.reference || (__cxx_static_address_c81acd5b06814f162d97d5b3.reference = {
    __cReference: true,
    get value() { return COMM_RECOG____header_global_cdd9807b74082250; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:108
export const OCTA_RECOG____header_global_2299b541df0e4ebb = ((((((141) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b979a014040e627883b65fe2() {
  return __cxx_static_address_b979a014040e627883b65fe2.reference || (__cxx_static_address_b979a014040e627883b65fe2.reference = {
    __cReference: true,
    get value() { return OCTA_RECOG____header_global_2299b541df0e4ebb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:109
export const TURR_RECOG____header_global_c6c37407f506600f = ((((((146) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_35aae64d81648d44ddf99626() {
  return __cxx_static_address_35aae64d81648d44ddf99626.reference || (__cxx_static_address_35aae64d81648d44ddf99626.reference = {
    __cReference: true,
    get value() { return TURR_RECOG____header_global_c6c37407f506600f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:110
export const SLIM_DYING____header_global_75967aa1abef2fdf = ((((((149) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_57a5925851e2b3d6957d1535() {
  return __cxx_static_address_57a5925851e2b3d6957d1535.reference || (__cxx_static_address_57a5925851e2b3d6957d1535.reference = {
    __cReference: true,
    get value() { return SLIM_DYING____header_global_75967aa1abef2fdf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:111
export const BOS3_RECOG____header_global_7a8768bb7200dc92 = ((((((151) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9444a0ac86d8429620b8b6a2() {
  return __cxx_static_address_9444a0ac86d8429620b8b6a2.reference || (__cxx_static_address_9444a0ac86d8429620b8b6a2.reference = {
    __cReference: true,
    get value() { return BOS3_RECOG____header_global_7a8768bb7200dc92; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:112
export const BOS1_WALK____header_global_6a30f2bd539236db = ((((((156) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6ad80b9edfc267c95e600609() {
  return __cxx_static_address_6ad80b9edfc267c95e600609.reference || (__cxx_static_address_6ad80b9edfc267c95e600609.reference = {
    __cReference: true,
    get value() { return BOS1_WALK____header_global_6a30f2bd539236db; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:113
export const THUD____header_global_401689b3d43b506e = ((((((158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d2fcbb2f4703c9531ddcd018() {
  return __cxx_static_address_d2fcbb2f4703c9531ddcd018.reference || (__cxx_static_address_d2fcbb2f4703c9531ddcd018.reference = {
    __cReference: true,
    get value() { return THUD____header_global_401689b3d43b506e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:114
export const WIERDSHOT_FLY____header_global_d0d5b1f084bbc131 = ((((((160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7756ad50fba7cef783596f4d() {
  return __cxx_static_address_7756ad50fba7cef783596f4d.reference || (__cxx_static_address_7756ad50fba7cef783596f4d.reference = {
    __cReference: true,
    get value() { return WIERDSHOT_FLY____header_global_d0d5b1f084bbc131; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:115
export const SLIM_ROAM____header_global_bf5803da99f4b631 = ((((((163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b98651e45ec007046c2231e2() {
  return __cxx_static_address_b98651e45ec007046c2231e2.reference || (__cxx_static_address_b98651e45ec007046c2231e2.reference = {
    __cReference: true,
    get value() { return SLIM_ROAM____header_global_bf5803da99f4b631; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:116
export const SHOTGUN_COCK____header_global_87938a761fa82c44 = ((((((169) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c6a24d688536db12de4994df() {
  return __cxx_static_address_c6a24d688536db12de4994df.reference || (__cxx_static_address_c6a24d688536db12de4994df.reference = {
    __cReference: true,
    get value() { return SHOTGUN_COCK____header_global_87938a761fa82c44; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:117
export const GENERIC_AMBIENCE17____header_global_02a9e060bcbeae13 = ((((((177) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1a9956fe740ffd473e72e87a() {
  return __cxx_static_address_1a9956fe740ffd473e72e87a.reference || (__cxx_static_address_1a9956fe740ffd473e72e87a.reference = {
    __cReference: true,
    get value() { return GENERIC_AMBIENCE17____header_global_02a9e060bcbeae13; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:118
export const BONUS_SPEECH1____header_global_b07185b5c83ea2dd = ((((((195) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b0dc60b5366ace2472ee3219() {
  return __cxx_static_address_b0dc60b5366ace2472ee3219.reference || (__cxx_static_address_b0dc60b5366ace2472ee3219.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH1____header_global_b07185b5c83ea2dd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:119
export const BONUS_SPEECH2____header_global_5726075e7dfe55bf = ((((((196) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f10bf4ebca489c200dc95ebc() {
  return __cxx_static_address_f10bf4ebca489c200dc95ebc.reference || (__cxx_static_address_f10bf4ebca489c200dc95ebc.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH2____header_global_5726075e7dfe55bf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:120
export const BONUS_SPEECH3____header_global_04224f3f9d9ecd3d = ((((((197) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_25a097efb5deaf0e44ac5751() {
  return __cxx_static_address_25a097efb5deaf0e44ac5751.reference || (__cxx_static_address_25a097efb5deaf0e44ac5751.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH3____header_global_04224f3f9d9ecd3d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:121
export const BONUS_SPEECH4____header_global_9f9de99d7c5ccace = ((((((199) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6e6b5ff3ccf6b415147ecf22() {
  return __cxx_static_address_6e6b5ff3ccf6b415147ecf22.reference || (__cxx_static_address_6e6b5ff3ccf6b415147ecf22.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH4____header_global_9f9de99d7c5ccace; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:122
export const DUKE_LAND_HURT____header_global_59eeb9672d20a43d = ((((((200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6be09cda3e8a5cfd889f85db() {
  return __cxx_static_address_6be09cda3e8a5cfd889f85db.reference || (__cxx_static_address_6be09cda3e8a5cfd889f85db.reference = {
    __cReference: true,
    get value() { return DUKE_LAND_HURT____header_global_59eeb9672d20a43d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:123
export const DUKE_SEARCH2____header_global_83435bb8fc8dc092 = ((((((207) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_01ff7583fc0645e0160555d9() {
  return __cxx_static_address_01ff7583fc0645e0160555d9.reference || (__cxx_static_address_01ff7583fc0645e0160555d9.reference = {
    __cReference: true,
    get value() { return DUKE_SEARCH2____header_global_83435bb8fc8dc092; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:124
export const DUKE_CRACK2____header_global_6b1ab92608a03af9 = ((((((208) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8a5255b8ee579c846ef66baf() {
  return __cxx_static_address_8a5255b8ee579c846ef66baf.reference || (__cxx_static_address_8a5255b8ee579c846ef66baf.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK2____header_global_6b1ab92608a03af9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:125
export const DUKE_SEARCH____header_global_9e9ce13d52191e9e = ((((((209) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e9a5cd6a30311021f70b9fd6() {
  return __cxx_static_address_e9a5cd6a30311021f70b9fd6.reference || (__cxx_static_address_e9a5cd6a30311021f70b9fd6.reference = {
    __cReference: true,
    get value() { return DUKE_SEARCH____header_global_9e9ce13d52191e9e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:126
export const DUKE_GET____header_global_1e0865b6f6406843 = ((((((210) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ab9ac46e2800ecd5fe378d4a() {
  return __cxx_static_address_ab9ac46e2800ecd5fe378d4a.reference || (__cxx_static_address_ab9ac46e2800ecd5fe378d4a.reference = {
    __cReference: true,
    get value() { return DUKE_GET____header_global_1e0865b6f6406843; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:127
export const DUKE_LONGTERM_PAIN____header_global_183cd278903e699b = ((((((211) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_18a3265d6168fd4659912e97() {
  return __cxx_static_address_18a3265d6168fd4659912e97.reference || (__cxx_static_address_18a3265d6168fd4659912e97.reference = {
    __cReference: true,
    get value() { return DUKE_LONGTERM_PAIN____header_global_183cd278903e699b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:128
export const MONITOR_ACTIVE____header_global_2868a0eb73b660ef = ((((((212) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b7d569167d0b56ec4b565c58() {
  return __cxx_static_address_b7d569167d0b56ec4b565c58.reference || (__cxx_static_address_b7d569167d0b56ec4b565c58.reference = {
    __cReference: true,
    get value() { return MONITOR_ACTIVE____header_global_2868a0eb73b660ef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:129
export const NITEVISION_ONOFF____header_global_ae1b263da5a0cb92 = ((((((213) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ec07060e55f45111099d95f5() {
  return __cxx_static_address_ec07060e55f45111099d95f5.reference || (__cxx_static_address_ec07060e55f45111099d95f5.reference = {
    __cReference: true,
    get value() { return NITEVISION_ONOFF____header_global_ae1b263da5a0cb92; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:130
export const DUKE_CRACK_FIRST____header_global_22fc48d925b54f84 = ((((((215) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e47cbbcee4ce80ac7c9b4916() {
  return __cxx_static_address_e47cbbcee4ce80ac7c9b4916.reference || (__cxx_static_address_e47cbbcee4ce80ac7c9b4916.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK_FIRST____header_global_22fc48d925b54f84; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:131
export const DUKE_USEMEDKIT____header_global_25f15c09c39c6123 = ((((((216) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5fd5893cf35acba829c7cd48() {
  return __cxx_static_address_5fd5893cf35acba829c7cd48.reference || (__cxx_static_address_5fd5893cf35acba829c7cd48.reference = {
    __cReference: true,
    get value() { return DUKE_USEMEDKIT____header_global_25f15c09c39c6123; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:132
export const DUKE_TAKEPILLS____header_global_56422c9976c2a2e4 = ((((((217) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_531d8958135c4b49e3a8ed72() {
  return __cxx_static_address_531d8958135c4b49e3a8ed72.reference || (__cxx_static_address_531d8958135c4b49e3a8ed72.reference = {
    __cReference: true,
    get value() { return DUKE_TAKEPILLS____header_global_56422c9976c2a2e4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:133
export const DUKE_PISSRELIEF____header_global_6ce7b9a034214a47 = ((((((218) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3d063f794b5aa61c15f8a2e6() {
  return __cxx_static_address_3d063f794b5aa61c15f8a2e6.reference || (__cxx_static_address_3d063f794b5aa61c15f8a2e6.reference = {
    __cReference: true,
    get value() { return DUKE_PISSRELIEF____header_global_6ce7b9a034214a47; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:134
export const SELECT_WEAPON____header_global_148b532d4df05b7b = ((((((219) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_04c6fa3b2d8c03a3ecc284c2() {
  return __cxx_static_address_04c6fa3b2d8c03a3ecc284c2.reference || (__cxx_static_address_04c6fa3b2d8c03a3ecc284c2.reference = {
    __cReference: true,
    get value() { return SELECT_WEAPON____header_global_148b532d4df05b7b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:135
export const JIBBED_ACTOR5____header_global_e331c24ac94fa1d4 = ((((((226) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dffd97dd3f2d7d293c097c89() {
  return __cxx_static_address_dffd97dd3f2d7d293c097c89.reference || (__cxx_static_address_dffd97dd3f2d7d293c097c89.reference = {
    __cReference: true,
    get value() { return JIBBED_ACTOR5____header_global_e331c24ac94fa1d4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:136
export const JIBBED_ACTOR6____header_global_303070ee6d52c092 = ((((((227) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_189a1a803c1b3bec6092c583() {
  return __cxx_static_address_189a1a803c1b3bec6092c583.reference || (__cxx_static_address_189a1a803c1b3bec6092c583.reference = {
    __cReference: true,
    get value() { return JIBBED_ACTOR6____header_global_303070ee6d52c092; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:137
export const DUKE_GOTHEALTHATLOW____header_global_2760a77e83e2a0fa = ((((((229) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_789baf3671c5be4b2e90c234() {
  return __cxx_static_address_789baf3671c5be4b2e90c234.reference || (__cxx_static_address_789baf3671c5be4b2e90c234.reference = {
    __cReference: true,
    get value() { return DUKE_GOTHEALTHATLOW____header_global_2760a77e83e2a0fa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:138
export const BOSSTALKTODUKE____header_global_8477842cf754f5ee = ((((((230) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_37ab7237e2f5eac581184abe() {
  return __cxx_static_address_37ab7237e2f5eac581184abe.reference || (__cxx_static_address_37ab7237e2f5eac581184abe.reference = {
    __cReference: true,
    get value() { return BOSSTALKTODUKE____header_global_8477842cf754f5ee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:139
export const WAR_AMBIENCE2____header_global_8be014a553e6d603 = ((((((232) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d4ca24c62515356039d58785() {
  return __cxx_static_address_d4ca24c62515356039d58785.reference || (__cxx_static_address_d4ca24c62515356039d58785.reference = {
    __cReference: true,
    get value() { return WAR_AMBIENCE2____header_global_8be014a553e6d603; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:140
export const EXITMENUSOUND____header_global_7e89d824c8db6a17 = ((((((243) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a1faccdeaa194240a9f928b0() {
  return __cxx_static_address_a1faccdeaa194240a9f928b0.reference || (__cxx_static_address_a1faccdeaa194240a9f928b0.reference = {
    __cReference: true,
    get value() { return EXITMENUSOUND____header_global_7e89d824c8db6a17; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:141
export const FLY_BY____header_global_f894c827ee943fe8 = ((((((244) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2c3f74c5b424aa578b1d6ad2() {
  return __cxx_static_address_2c3f74c5b424aa578b1d6ad2.reference || (__cxx_static_address_2c3f74c5b424aa578b1d6ad2.reference = {
    __cReference: true,
    get value() { return FLY_BY____header_global_f894c827ee943fe8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:142
export const DUKE_SCREAM____header_global_f08e761ee19d81d7 = ((((((245) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7f48ca8ed5f35c3fb8339701() {
  return __cxx_static_address_7f48ca8ed5f35c3fb8339701.reference || (__cxx_static_address_7f48ca8ed5f35c3fb8339701.reference = {
    __cReference: true,
    get value() { return DUKE_SCREAM____header_global_f08e761ee19d81d7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:143
export const SHRINKER_HIT____header_global_e255a131ed2ac790 = ((((((246) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_29ce51016da6336f53be0948() {
  return __cxx_static_address_29ce51016da6336f53be0948.reference || (__cxx_static_address_29ce51016da6336f53be0948.reference = {
    __cReference: true,
    get value() { return SHRINKER_HIT____header_global_e255a131ed2ac790; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:144
export const RATTY____header_global_a306d388b071f07a = ((((((247) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c335b532a6fcaa10a4064a2c() {
  return __cxx_static_address_c335b532a6fcaa10a4064a2c.reference || (__cxx_static_address_c335b532a6fcaa10a4064a2c.reference = {
    __cReference: true,
    get value() { return RATTY____header_global_a306d388b071f07a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:145
export const BONUSMUSIC____header_global_b2835e9b67d6a4fa = ((((((249) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bb3cde695189f000fa8ec8c3() {
  return __cxx_static_address_bb3cde695189f000fa8ec8c3.reference || (__cxx_static_address_bb3cde695189f000fa8ec8c3.reference = {
    __cReference: true,
    get value() { return BONUSMUSIC____header_global_b2835e9b67d6a4fa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:146
export const DUKE_GETWEAPON6____header_global_2291f4fd42785fc2 = ((((((264) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_01abaf8d982afee292e24a48() {
  return __cxx_static_address_01abaf8d982afee292e24a48.reference || (__cxx_static_address_01abaf8d982afee292e24a48.reference = {
    __cReference: true,
    get value() { return DUKE_GETWEAPON6____header_global_2291f4fd42785fc2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:147
export const ALIEN_SWITCH1____header_global_bd139381180614d8 = ((((((272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_58c03eabc40ff4df55d36cef() {
  return __cxx_static_address_58c03eabc40ff4df55d36cef.reference || (__cxx_static_address_58c03eabc40ff4df55d36cef.reference = {
    __cReference: true,
    get value() { return ALIEN_SWITCH1____header_global_bd139381180614d8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:148
export const RIPHEADNECK____header_global_c548b9def9d40970 = ((((((284) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_42342ae9c8efd5e805d7b0b2() {
  return __cxx_static_address_42342ae9c8efd5e805d7b0b2.reference || (__cxx_static_address_42342ae9c8efd5e805d7b0b2.reference = {
    __cReference: true,
    get value() { return RIPHEADNECK____header_global_c548b9def9d40970; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:149
export const ENDSEQVOL3SND4____header_global_a440cd215ddbd513 = ((((((288) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6c9d2fe0d1cdc2fb41eb16e4() {
  return __cxx_static_address_6c9d2fe0d1cdc2fb41eb16e4.reference || (__cxx_static_address_6c9d2fe0d1cdc2fb41eb16e4.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND4____header_global_a440cd215ddbd513; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:150
export const ENDSEQVOL3SND5____header_global_41c6ff164ffef987 = ((((((289) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c64c877fcb80eecf6cb9d9a2() {
  return __cxx_static_address_c64c877fcb80eecf6cb9d9a2.reference || (__cxx_static_address_c64c877fcb80eecf6cb9d9a2.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND5____header_global_41c6ff164ffef987; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:151
export const ENDSEQVOL3SND6____header_global_ea9e6ea0cebf7464 = ((((((290) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e9a115db44a6d0bcd87bfacf() {
  return __cxx_static_address_e9a115db44a6d0bcd87bfacf.reference || (__cxx_static_address_e9a115db44a6d0bcd87bfacf.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND6____header_global_ea9e6ea0cebf7464; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:152
export const ENDSEQVOL3SND7____header_global_565255c0d6054536 = ((((((291) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c81d94cc6e9283548480cd45() {
  return __cxx_static_address_c81d94cc6e9283548480cd45.reference || (__cxx_static_address_c81d94cc6e9283548480cd45.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND7____header_global_565255c0d6054536; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:153
export const ENDSEQVOL3SND8____header_global_ca67fe13f565257f = ((((((292) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_25d101d880191136987adf9d() {
  return __cxx_static_address_25d101d880191136987adf9d.reference || (__cxx_static_address_25d101d880191136987adf9d.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND8____header_global_ca67fe13f565257f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:154
export const ENDSEQVOL3SND9____header_global_36f903eb11d8a0e7 = ((((((293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9582b5a3a9a807d26f18c1bd() {
  return __cxx_static_address_9582b5a3a9a807d26f18c1bd.reference || (__cxx_static_address_9582b5a3a9a807d26f18c1bd.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND9____header_global_36f903eb11d8a0e7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:155
export const WHIPYOURASS____header_global_54ce24383915c4f7 = ((((((294) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e71e1acdbe73566d5767cd67() {
  return __cxx_static_address_e71e1acdbe73566d5767cd67.reference || (__cxx_static_address_e71e1acdbe73566d5767cd67.reference = {
    __cReference: true,
    get value() { return WHIPYOURASS____header_global_54ce24383915c4f7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:156
export const ENDSEQVOL2SND1____header_global_3bbbea7bec1e654e = ((((((295) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7d34539744bcdff00c0e71c1() {
  return __cxx_static_address_7d34539744bcdff00c0e71c1.reference || (__cxx_static_address_7d34539744bcdff00c0e71c1.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND1____header_global_3bbbea7bec1e654e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:157
export const ENDSEQVOL2SND2____header_global_0b4ed0f9495b846c = ((((((296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_46cea758bbfa4a8268841127() {
  return __cxx_static_address_46cea758bbfa4a8268841127.reference || (__cxx_static_address_46cea758bbfa4a8268841127.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND2____header_global_0b4ed0f9495b846c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:158
export const ENDSEQVOL2SND3____header_global_936225cbe1ebc280 = ((((((297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_46746cb9b726a6933aad6160() {
  return __cxx_static_address_46746cb9b726a6933aad6160.reference || (__cxx_static_address_46746cb9b726a6933aad6160.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND3____header_global_936225cbe1ebc280; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:159
export const ENDSEQVOL2SND4____header_global_15426f57c7081e41 = ((((((298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_286faa5b1dc254041c3b8f19() {
  return __cxx_static_address_286faa5b1dc254041c3b8f19.reference || (__cxx_static_address_286faa5b1dc254041c3b8f19.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND4____header_global_15426f57c7081e41; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:160
export const ENDSEQVOL2SND5____header_global_8cbf045704a85977 = ((((((299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f7a88eed63c22663f75226f0() {
  return __cxx_static_address_f7a88eed63c22663f75226f0.reference || (__cxx_static_address_f7a88eed63c22663f75226f0.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND5____header_global_8cbf045704a85977; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:161
export const ENDSEQVOL2SND6____header_global_ec7bc52a1450badf = ((((((300) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_58bd54b423fb19094cd17902() {
  return __cxx_static_address_58bd54b423fb19094cd17902.reference || (__cxx_static_address_58bd54b423fb19094cd17902.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND6____header_global_ec7bc52a1450badf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:162
export const ENDSEQVOL2SND7____header_global_0ba51491634d295e = ((((((301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e29778a1a4c3e329253c547d() {
  return __cxx_static_address_e29778a1a4c3e329253c547d.reference || (__cxx_static_address_e29778a1a4c3e329253c547d.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND7____header_global_0ba51491634d295e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:163
export const SOMETHINGFROZE____header_global_b824a333ae108f78 = ((((((303) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_efb7ecd79b66c4ca7e2ddaa4() {
  return __cxx_static_address_efb7ecd79b66c4ca7e2ddaa4.reference || (__cxx_static_address_efb7ecd79b66c4ca7e2ddaa4.reference = {
    __cReference: true,
    get value() { return SOMETHINGFROZE____header_global_b824a333ae108f78; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:164
export const WIND_REPEAT____header_global_5a863dd6fe78130a = ((((((308) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9f94bc527aba2e6badab4728() {
  return __cxx_static_address_9f94bc527aba2e6badab4728.reference || (__cxx_static_address_9f94bc527aba2e6badab4728.reference = {
    __cReference: true,
    get value() { return WIND_REPEAT____header_global_5a863dd6fe78130a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:165
export const BOS4_RECOG____header_global_a3d573d5482a3386 = ((((((342) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f38c3160e3b9fa0629883dcc() {
  return __cxx_static_address_f38c3160e3b9fa0629883dcc.reference || (__cxx_static_address_f38c3160e3b9fa0629883dcc.reference = {
    __cReference: true,
    get value() { return BOS4_RECOG____header_global_a3d573d5482a3386; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:166
export const LIGHTNING_SLAP____header_global_bfd7eef473a3c057 = ((((((351) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_343364d523590ba69dd4eb88() {
  return __cxx_static_address_343364d523590ba69dd4eb88.reference || (__cxx_static_address_343364d523590ba69dd4eb88.reference = {
    __cReference: true,
    get value() { return LIGHTNING_SLAP____header_global_bfd7eef473a3c057; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:167
export const THUNDER____header_global_22066c4309e84ada = ((((((352) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_34db095eee7385361923ac29() {
  return __cxx_static_address_34db095eee7385361923ac29.reference || (__cxx_static_address_34db095eee7385361923ac29.reference = {
    __cReference: true,
    get value() { return THUNDER____header_global_22066c4309e84ada; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:168
export const INTRO4_1____header_global_93572acc149bce0f = ((((((363) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f39cfeb32861bfdaeab98d30() {
  return __cxx_static_address_f39cfeb32861bfdaeab98d30.reference || (__cxx_static_address_f39cfeb32861bfdaeab98d30.reference = {
    __cReference: true,
    get value() { return INTRO4_1____header_global_93572acc149bce0f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:169
export const INTRO4_2____header_global_25dd61c02f5f8fa3 = ((((((364) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fcd76503513dac93432237d9() {
  return __cxx_static_address_fcd76503513dac93432237d9.reference || (__cxx_static_address_fcd76503513dac93432237d9.reference = {
    __cReference: true,
    get value() { return INTRO4_2____header_global_25dd61c02f5f8fa3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:170
export const INTRO4_3____header_global_232ccb36284bbbf0 = ((((((365) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4d2519302ca3b4a8e1657289() {
  return __cxx_static_address_4d2519302ca3b4a8e1657289.reference || (__cxx_static_address_4d2519302ca3b4a8e1657289.reference = {
    __cReference: true,
    get value() { return INTRO4_3____header_global_232ccb36284bbbf0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:171
export const INTRO4_4____header_global_527caad7420bf52c = ((((((366) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c01a9a68c0a9586c4bdefd26() {
  return __cxx_static_address_c01a9a68c0a9586c4bdefd26.reference || (__cxx_static_address_c01a9a68c0a9586c4bdefd26.reference = {
    __cReference: true,
    get value() { return INTRO4_4____header_global_527caad7420bf52c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:172
export const INTRO4_5____header_global_a6737246e37c4517 = ((((((367) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eb9a5b59680bcac0b0c4d70e() {
  return __cxx_static_address_eb9a5b59680bcac0b0c4d70e.reference || (__cxx_static_address_eb9a5b59680bcac0b0c4d70e.reference = {
    __cReference: true,
    get value() { return INTRO4_5____header_global_a6737246e37c4517; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:173
export const INTRO4_6____header_global_8759078bf2613fd3 = ((((((368) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7c0b85eca1e20622dcdbfaef() {
  return __cxx_static_address_7c0b85eca1e20622dcdbfaef.reference || (__cxx_static_address_7c0b85eca1e20622dcdbfaef.reference = {
    __cReference: true,
    get value() { return INTRO4_6____header_global_8759078bf2613fd3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:174
export const BOSS4_DEADSPEECH____header_global_5272e86a76ce1791 = ((((((370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_785a42e39d49d19b51466af2() {
  return __cxx_static_address_785a42e39d49d19b51466af2.reference || (__cxx_static_address_785a42e39d49d19b51466af2.reference = {
    __cReference: true,
    get value() { return BOSS4_DEADSPEECH____header_global_5272e86a76ce1791; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:175
export const BOSS4_FIRSTSEE____header_global_99c2fa47135227aa = ((((((371) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2d8e67a8e817a255bdfbfdae() {
  return __cxx_static_address_2d8e67a8e817a255bdfbfdae.reference || (__cxx_static_address_2d8e67a8e817a255bdfbfdae.reference = {
    __cReference: true,
    get value() { return BOSS4_FIRSTSEE____header_global_99c2fa47135227aa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:176
export const VOL4ENDSND1____header_global_bc663c421acf8879 = ((((((384) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_58b4294ed867b2e1492b49b8() {
  return __cxx_static_address_58b4294ed867b2e1492b49b8.reference || (__cxx_static_address_58b4294ed867b2e1492b49b8.reference = {
    __cReference: true,
    get value() { return VOL4ENDSND1____header_global_bc663c421acf8879; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:177
export const VOL4ENDSND2____header_global_7d17ee81a1243826 = ((((((385) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a1d66e7b4d0a7293de79761a() {
  return __cxx_static_address_a1d66e7b4d0a7293de79761a.reference || (__cxx_static_address_a1d66e7b4d0a7293de79761a.reference = {
    __cReference: true,
    get value() { return VOL4ENDSND2____header_global_7d17ee81a1243826; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:178
export const EXPANDERSHOOT____header_global_24c652c6d6fa1b84 = ((((((388) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a64466ee510d1256f1c942f2() {
  return __cxx_static_address_a64466ee510d1256f1c942f2.reference || (__cxx_static_address_a64466ee510d1256f1c942f2.reference = {
    __cReference: true,
    get value() { return EXPANDERSHOOT____header_global_24c652c6d6fa1b84; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:179
export const INTRO4_B____header_global_3a45c7b82b257104 = ((((((392) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b19a0ba99b5908a4333ae911() {
  return __cxx_static_address_b19a0ba99b5908a4333ae911.reference || (__cxx_static_address_b19a0ba99b5908a4333ae911.reference = {
    __cReference: true,
    get value() { return INTRO4_B____header_global_3a45c7b82b257104; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:180
export const BIGBANG____header_global_8275d179c5731a24 = ((((((393) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_774c5886ae72734d17674266() {
  return __cxx_static_address_774c5886ae72734d17674266.reference || (__cxx_static_address_774c5886ae72734d17674266.reference = {
    __cReference: true,
    get value() { return BIGBANG____header_global_8275d179c5731a24; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:181
export const FLAMETHROWER_INTRO____header_global_9ca4a6b81b6c6451 = ((((((398) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_44e6f3f4ccef707114fbbc0d() {
  return __cxx_static_address_44e6f3f4ccef707114fbbc0d.reference || (__cxx_static_address_44e6f3f4ccef707114fbbc0d.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_INTRO____header_global_9ca4a6b81b6c6451; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:182
export const FLAMETHROWER_LOOP____header_global_2d0d86d8b9db8ac2 = ((((((399) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4158eea0a259a67c4008fb32() {
  return __cxx_static_address_4158eea0a259a67c4008fb32.reference || (__cxx_static_address_4158eea0a259a67c4008fb32.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_LOOP____header_global_2d0d86d8b9db8ac2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:183
export const FLAMETHROWER_END____header_global_bc71eff4d452afd6 = ((((((400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_504b77ff04946d090e45587f() {
  return __cxx_static_address_504b77ff04946d090e45587f.reference || (__cxx_static_address_504b77ff04946d090e45587f.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_END____header_global_bc71eff4d452afd6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:184
export const E5L7_DUKE_QUIT_YOU____header_global_dba218b2f65332ea = ((((((401) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cb3119ca11fbce8da31e1937() {
  return __cxx_static_address_cb3119ca11fbce8da31e1937.reference || (__cxx_static_address_cb3119ca11fbce8da31e1937.reference = {
    __cReference: true,
    get value() { return E5L7_DUKE_QUIT_YOU____header_global_dba218b2f65332ea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:187
export const SECTOREFFECTOR____header_global_aef3cff71013fd11 = ((((((1) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cb41040a795978e24126c327() {
  return __cxx_static_address_cb41040a795978e24126c327.reference || (__cxx_static_address_cb41040a795978e24126c327.reference = {
    __cReference: true,
    get value() { return SECTOREFFECTOR____header_global_aef3cff71013fd11; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:188
export const ACTIVATOR____header_global_efca3ac9792576f8 = ((((((2) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f53f7e219ad0ef06020a9ce7() {
  return __cxx_static_address_f53f7e219ad0ef06020a9ce7.reference || (__cxx_static_address_f53f7e219ad0ef06020a9ce7.reference = {
    __cReference: true,
    get value() { return ACTIVATOR____header_global_efca3ac9792576f8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:189
export const TOUCHPLATE____header_global_6412f906635581db = ((((((3) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4be4a05de3093b9d06c6defa() {
  return __cxx_static_address_4be4a05de3093b9d06c6defa.reference || (__cxx_static_address_4be4a05de3093b9d06c6defa.reference = {
    __cReference: true,
    get value() { return TOUCHPLATE____header_global_6412f906635581db; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:190
export const ACTIVATORLOCKED____header_global_1ed561dc0af77f60 = ((((((4) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fb5a883d58455d25d9aa9e73() {
  return __cxx_static_address_fb5a883d58455d25d9aa9e73.reference || (__cxx_static_address_fb5a883d58455d25d9aa9e73.reference = {
    __cReference: true,
    get value() { return ACTIVATORLOCKED____header_global_1ed561dc0af77f60; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:191
export const MUSICANDSFX____header_global_f5aaf5801df9c96e = ((((((5) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7605dc6786ad4fb46dc903f6() {
  return __cxx_static_address_7605dc6786ad4fb46dc903f6.reference || (__cxx_static_address_7605dc6786ad4fb46dc903f6.reference = {
    __cReference: true,
    get value() { return MUSICANDSFX____header_global_f5aaf5801df9c96e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:192
export const LOCATORS____header_global_179b4679680bc1a3 = ((((((6) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2be50a9547c34bab08759f24() {
  return __cxx_static_address_2be50a9547c34bab08759f24.reference || (__cxx_static_address_2be50a9547c34bab08759f24.reference = {
    __cReference: true,
    get value() { return LOCATORS____header_global_179b4679680bc1a3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:193
export const CYCLER____header_global_05949676b89f9102 = ((((((7) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e8cf8111870912d86e901a27() {
  return __cxx_static_address_e8cf8111870912d86e901a27.reference || (__cxx_static_address_e8cf8111870912d86e901a27.reference = {
    __cReference: true,
    get value() { return CYCLER____header_global_05949676b89f9102; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:194
export const MASTERSWITCH____header_global_e7d026a1e060dcdf = ((((((8) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ddd00a238f69bde01eb5740e() {
  return __cxx_static_address_ddd00a238f69bde01eb5740e.reference || (__cxx_static_address_ddd00a238f69bde01eb5740e.reference = {
    __cReference: true,
    get value() { return MASTERSWITCH____header_global_e7d026a1e060dcdf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:195
export const RESPAWN____header_global_907d687cee40b183 = ((((((9) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4a13221d1cc6ef5ec4a5afb8() {
  return __cxx_static_address_4a13221d1cc6ef5ec4a5afb8.reference || (__cxx_static_address_4a13221d1cc6ef5ec4a5afb8.reference = {
    __cReference: true,
    get value() { return RESPAWN____header_global_907d687cee40b183; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:196
export const GPSPEED____header_global_50c3556b1a0a3067 = ((((((10) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c79225018b31ad623b5d8bb3() {
  return __cxx_static_address_c79225018b31ad623b5d8bb3.reference || (__cxx_static_address_c79225018b31ad623b5d8bb3.reference = {
    __cReference: true,
    get value() { return GPSPEED____header_global_50c3556b1a0a3067; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:197
export const FOF____header_global_e3eee8e19f45e198 = ((((((13) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f3f8e68f950ebc26768ca3a2() {
  return __cxx_static_address_f3f8e68f950ebc26768ca3a2.reference || (__cxx_static_address_f3f8e68f950ebc26768ca3a2.reference = {
    __cReference: true,
    get value() { return FOF____header_global_e3eee8e19f45e198; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:198
export const ARROW____header_global_5084b5fe30fbe08d = ((((((20) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d3299447cf9d8c1d791fac4d() {
  return __cxx_static_address_d3299447cf9d8c1d791fac4d.reference || (__cxx_static_address_d3299447cf9d8c1d791fac4d.reference = {
    __cReference: true,
    get value() { return ARROW____header_global_5084b5fe30fbe08d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:199
export const FIRSTGUNSPRITE____header_global_7a67acbd8f4a1964 = ((((((21) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ad870f45ab6863c2cc1a8a09() {
  return __cxx_static_address_ad870f45ab6863c2cc1a8a09.reference || (__cxx_static_address_ad870f45ab6863c2cc1a8a09.reference = {
    __cReference: true,
    get value() { return FIRSTGUNSPRITE____header_global_7a67acbd8f4a1964; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:200
export const CHAINGUNSPRITE____header_global_de0f88b18296aed7 = ((((((22) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_62c411ed064cde89d4a8a1b4() {
  return __cxx_static_address_62c411ed064cde89d4a8a1b4.reference || (__cxx_static_address_62c411ed064cde89d4a8a1b4.reference = {
    __cReference: true,
    get value() { return CHAINGUNSPRITE____header_global_de0f88b18296aed7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:201
export const RPGSPRITE____header_global_4f31670940f2b230 = ((((((23) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e58ede4321d1f88b940fe0ec() {
  return __cxx_static_address_e58ede4321d1f88b940fe0ec.reference || (__cxx_static_address_e58ede4321d1f88b940fe0ec.reference = {
    __cReference: true,
    get value() { return RPGSPRITE____header_global_4f31670940f2b230; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:202
export const FREEZESPRITE____header_global_ba773822601c6f83 = ((((((24) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_78d3d3ec2664e286e52a0471() {
  return __cxx_static_address_78d3d3ec2664e286e52a0471.reference || (__cxx_static_address_78d3d3ec2664e286e52a0471.reference = {
    __cReference: true,
    get value() { return FREEZESPRITE____header_global_ba773822601c6f83; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:203
export const SHRINKERSPRITE____header_global_2cac34eeba221706 = ((((((25) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bada9c63a7802f650d2dbc76() {
  return __cxx_static_address_bada9c63a7802f650d2dbc76.reference || (__cxx_static_address_bada9c63a7802f650d2dbc76.reference = {
    __cReference: true,
    get value() { return SHRINKERSPRITE____header_global_2cac34eeba221706; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:204
export const HEAVYHBOMB____header_global_d8cc1f14733469fc = ((((((26) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2146d5b44a0de318ab678ee9() {
  return __cxx_static_address_2146d5b44a0de318ab678ee9.reference || (__cxx_static_address_2146d5b44a0de318ab678ee9.reference = {
    __cReference: true,
    get value() { return HEAVYHBOMB____header_global_d8cc1f14733469fc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:205
export const TRIPBOMBSPRITE____header_global_aadeb458ca531623 = ((((((27) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7211770061137e31d1305019() {
  return __cxx_static_address_7211770061137e31d1305019.reference || (__cxx_static_address_7211770061137e31d1305019.reference = {
    __cReference: true,
    get value() { return TRIPBOMBSPRITE____header_global_aadeb458ca531623; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:206
export const SHOTGUNSPRITE____header_global_1d08661c61aad570 = ((((((28) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e5c4c204079b19b8608ca85b() {
  return __cxx_static_address_e5c4c204079b19b8608ca85b.reference || (__cxx_static_address_e5c4c204079b19b8608ca85b.reference = {
    __cReference: true,
    get value() { return SHOTGUNSPRITE____header_global_1d08661c61aad570; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:207
export const DEVISTATORSPRITE____header_global_3a11fed5beb9d2a4 = ((((((29) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4c306eed5dff27c3d97ec4c9() {
  return __cxx_static_address_4c306eed5dff27c3d97ec4c9.reference || (__cxx_static_address_4c306eed5dff27c3d97ec4c9.reference = {
    __cReference: true,
    get value() { return DEVISTATORSPRITE____header_global_3a11fed5beb9d2a4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:208
export const HEALTHBOX____header_global_e17f0ec0254a50b9 = ((((((30) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_79b487697fff3599e07ddef0() {
  return __cxx_static_address_79b487697fff3599e07ddef0.reference || (__cxx_static_address_79b487697fff3599e07ddef0.reference = {
    __cReference: true,
    get value() { return HEALTHBOX____header_global_e17f0ec0254a50b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:209
export const AMMOBOX____header_global_ed79c47a34e2968c = ((((((31) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_65e8d5cf26f1f74289159f25() {
  return __cxx_static_address_65e8d5cf26f1f74289159f25.reference || (__cxx_static_address_65e8d5cf26f1f74289159f25.reference = {
    __cReference: true,
    get value() { return AMMOBOX____header_global_ed79c47a34e2968c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:210
export const GROWSPRITEICON____header_global_c6987b6928a65020 = ((((((32) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_655ffccfa6da2651cfd21b11() {
  return __cxx_static_address_655ffccfa6da2651cfd21b11.reference || (__cxx_static_address_655ffccfa6da2651cfd21b11.reference = {
    __cReference: true,
    get value() { return GROWSPRITEICON____header_global_c6987b6928a65020; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:211
export const INVENTORYBOX____header_global_846ce8696b8f3615 = ((((((33) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e4a8777a6f3f32e288f8d9ff() {
  return __cxx_static_address_e4a8777a6f3f32e288f8d9ff.reference || (__cxx_static_address_e4a8777a6f3f32e288f8d9ff.reference = {
    __cReference: true,
    get value() { return INVENTORYBOX____header_global_846ce8696b8f3615; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:212
export const FREEZEAMMO____header_global_8fc40abe6469aff1 = ((((((37) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ac351ef06b7c96c283df114e() {
  return __cxx_static_address_ac351ef06b7c96c283df114e.reference || (__cxx_static_address_ac351ef06b7c96c283df114e.reference = {
    __cReference: true,
    get value() { return FREEZEAMMO____header_global_8fc40abe6469aff1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:213
export const AMMO____header_global_6e5b8f4fa61e80cf = ((((((40) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_980ff296383b596346e2f1e3() {
  return __cxx_static_address_980ff296383b596346e2f1e3.reference || (__cxx_static_address_980ff296383b596346e2f1e3.reference = {
    __cReference: true,
    get value() { return AMMO____header_global_6e5b8f4fa61e80cf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:214
export const BATTERYAMMO____header_global_7ae4a1a56b72478d = ((((((41) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_afe799d16ef3bf7d03538e25() {
  return __cxx_static_address_afe799d16ef3bf7d03538e25.reference || (__cxx_static_address_afe799d16ef3bf7d03538e25.reference = {
    __cReference: true,
    get value() { return BATTERYAMMO____header_global_7ae4a1a56b72478d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:215
export const DEVISTATORAMMO____header_global_b71977a2251639f2 = ((((((42) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d53ecfedbb72fe7106b287fb() {
  return __cxx_static_address_d53ecfedbb72fe7106b287fb.reference || (__cxx_static_address_d53ecfedbb72fe7106b287fb.reference = {
    __cReference: true,
    get value() { return DEVISTATORAMMO____header_global_b71977a2251639f2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:216
export const RPGAMMO____header_global_8115083cb2036462 = ((((((44) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bcd1b2521e7faccdacc364d4() {
  return __cxx_static_address_bcd1b2521e7faccdacc364d4.reference || (__cxx_static_address_bcd1b2521e7faccdacc364d4.reference = {
    __cReference: true,
    get value() { return RPGAMMO____header_global_8115083cb2036462; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:217
export const GROWAMMO____header_global_d7dfbb462f9a2a47 = ((((((45) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3a5f5ab8875c952b2357f258() {
  return __cxx_static_address_3a5f5ab8875c952b2357f258.reference || (__cxx_static_address_3a5f5ab8875c952b2357f258.reference = {
    __cReference: true,
    get value() { return GROWAMMO____header_global_d7dfbb462f9a2a47; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:218
export const CRYSTALAMMO____header_global_7a27c6b755ec4ea1 = ((((((46) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8556b8062279c7f8e6b55e2d() {
  return __cxx_static_address_8556b8062279c7f8e6b55e2d.reference || (__cxx_static_address_8556b8062279c7f8e6b55e2d.reference = {
    __cReference: true,
    get value() { return CRYSTALAMMO____header_global_7a27c6b755ec4ea1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:219
export const HBOMBAMMO____header_global_380e5ab916f43347 = ((((((47) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_922a52795bb38f074755dc46() {
  return __cxx_static_address_922a52795bb38f074755dc46.reference || (__cxx_static_address_922a52795bb38f074755dc46.reference = {
    __cReference: true,
    get value() { return HBOMBAMMO____header_global_380e5ab916f43347; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:220
export const AMMOLOTS____header_global_89d0cd143ae0625b = ((((((48) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2ce0de2e4c73403491ca9652() {
  return __cxx_static_address_2ce0de2e4c73403491ca9652.reference || (__cxx_static_address_2ce0de2e4c73403491ca9652.reference = {
    __cReference: true,
    get value() { return AMMOLOTS____header_global_89d0cd143ae0625b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:221
export const SHOTGUNAMMO____header_global_7301a9bfcfc4a238 = ((((((49) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2b8e469043f6344b9ba590ea() {
  return __cxx_static_address_2b8e469043f6344b9ba590ea.reference || (__cxx_static_address_2b8e469043f6344b9ba590ea.reference = {
    __cReference: true,
    get value() { return SHOTGUNAMMO____header_global_7301a9bfcfc4a238; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:222
export const COLA____header_global_cc8159b190908b17 = ((((((51) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2211b2965c8ee4d6f28078f8() {
  return __cxx_static_address_2211b2965c8ee4d6f28078f8.reference || (__cxx_static_address_2211b2965c8ee4d6f28078f8.reference = {
    __cReference: true,
    get value() { return COLA____header_global_cc8159b190908b17; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:223
export const SIXPAK____header_global_369fdff8c76fa9b1 = ((((((52) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_47149ee2da880e3b90774b62() {
  return __cxx_static_address_47149ee2da880e3b90774b62.reference || (__cxx_static_address_47149ee2da880e3b90774b62.reference = {
    __cReference: true,
    get value() { return SIXPAK____header_global_369fdff8c76fa9b1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:224
export const FIRSTAID____header_global_a74c5e2e3335d115 = ((((((53) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_607d45f278026e516e851b44() {
  return __cxx_static_address_607d45f278026e516e851b44.reference || (__cxx_static_address_607d45f278026e516e851b44.reference = {
    __cReference: true,
    get value() { return FIRSTAID____header_global_a74c5e2e3335d115; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:225
export const SHIELD____header_global_61878694c50096b8 = ((((((54) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c52d5066ada8ae380ce0af12() {
  return __cxx_static_address_c52d5066ada8ae380ce0af12.reference || (__cxx_static_address_c52d5066ada8ae380ce0af12.reference = {
    __cReference: true,
    get value() { return SHIELD____header_global_61878694c50096b8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:226
export const STEROIDS____header_global_1445fbd327e35510 = ((((((55) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_af5232cc393a5d74d846fa3f() {
  return __cxx_static_address_af5232cc393a5d74d846fa3f.reference || (__cxx_static_address_af5232cc393a5d74d846fa3f.reference = {
    __cReference: true,
    get value() { return STEROIDS____header_global_1445fbd327e35510; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:227
export const AIRTANK____header_global_2d66bb5daebc1150 = ((((((56) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7d86178d48f2fcbe73d2713c() {
  return __cxx_static_address_7d86178d48f2fcbe73d2713c.reference || (__cxx_static_address_7d86178d48f2fcbe73d2713c.reference = {
    __cReference: true,
    get value() { return AIRTANK____header_global_2d66bb5daebc1150; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:228
export const JETPACK____header_global_d3a2afd7ed924363 = ((((((57) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0148f9c508760d4423869eb0() {
  return __cxx_static_address_0148f9c508760d4423869eb0.reference || (__cxx_static_address_0148f9c508760d4423869eb0.reference = {
    __cReference: true,
    get value() { return JETPACK____header_global_d3a2afd7ed924363; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:229
export const HEATSENSOR____header_global_e66dafcd2f57be90 = ((((((59) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_71b775773ae316ab19997129() {
  return __cxx_static_address_71b775773ae316ab19997129.reference || (__cxx_static_address_71b775773ae316ab19997129.reference = {
    __cReference: true,
    get value() { return HEATSENSOR____header_global_e66dafcd2f57be90; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:230
export const ACCESSCARD____header_global_03b28e4c9bece03e = ((((((60) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2971bb77103a1f391b0e39c7() {
  return __cxx_static_address_2971bb77103a1f391b0e39c7.reference || (__cxx_static_address_2971bb77103a1f391b0e39c7.reference = {
    __cReference: true,
    get value() { return ACCESSCARD____header_global_03b28e4c9bece03e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:231
export const BOOTS____header_global_c2556cac5f3f1263 = ((((((61) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_38a074b0276477bfd8a7f197() {
  return __cxx_static_address_38a074b0276477bfd8a7f197.reference || (__cxx_static_address_38a074b0276477bfd8a7f197.reference = {
    __cReference: true,
    get value() { return BOOTS____header_global_c2556cac5f3f1263; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:232
export const MIRRORBROKE____header_global_26406223da34b04d = ((((((70) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5a21e61410f294042b95477d() {
  return __cxx_static_address_5a21e61410f294042b95477d.reference || (__cxx_static_address_5a21e61410f294042b95477d.reference = {
    __cReference: true,
    get value() { return MIRRORBROKE____header_global_26406223da34b04d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:233
export const CLOUDYOCEAN____header_global_d1c01b9da5752c48 = ((((((78) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f981d20c76561c1f9ad12f4a() {
  return __cxx_static_address_f981d20c76561c1f9ad12f4a.reference || (__cxx_static_address_f981d20c76561c1f9ad12f4a.reference = {
    __cReference: true,
    get value() { return CLOUDYOCEAN____header_global_d1c01b9da5752c48; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:234
export const CLOUDYSKIES____header_global_a5f0270c0f7b1a1a = ((((((79) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ff4aaf5415d353a366b72ebb() {
  return __cxx_static_address_ff4aaf5415d353a366b72ebb.reference || (__cxx_static_address_ff4aaf5415d353a366b72ebb.reference = {
    __cReference: true,
    get value() { return CLOUDYSKIES____header_global_a5f0270c0f7b1a1a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:235
export const MOONSKY1____header_global_b9d721ee2a491ed7 = ((((((80) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bfe3f981d7ba35f95ba113fb() {
  return __cxx_static_address_bfe3f981d7ba35f95ba113fb.reference || (__cxx_static_address_bfe3f981d7ba35f95ba113fb.reference = {
    __cReference: true,
    get value() { return MOONSKY1____header_global_b9d721ee2a491ed7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:236
export const BIGORBIT1____header_global_acbcca6ce810cf0f = ((((((84) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9984bd4120d4bb68095c3429() {
  return __cxx_static_address_9984bd4120d4bb68095c3429.reference || (__cxx_static_address_9984bd4120d4bb68095c3429.reference = {
    __cReference: true,
    get value() { return BIGORBIT1____header_global_acbcca6ce810cf0f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:237
export const LA____header_global_53ebfb3ad0de823a = ((((((89) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ea736745e0f8c50976a6903d() {
  return __cxx_static_address_ea736745e0f8c50976a6903d.reference || (__cxx_static_address_ea736745e0f8c50976a6903d.reference = {
    __cReference: true,
    get value() { return LA____header_global_53ebfb3ad0de823a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:238
export const ATOMICHEALTH____header_global_92a1096dc587d831 = ((((((100) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2583e6588a1ec280d9c50b33() {
  return __cxx_static_address_2583e6588a1ec280d9c50b33.reference || (__cxx_static_address_2583e6588a1ec280d9c50b33.reference = {
    __cReference: true,
    get value() { return ATOMICHEALTH____header_global_92a1096dc587d831; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:239
export const TECHLIGHT2____header_global_b2cb190008c93d63 = ((((((120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_42138fbbc7e219b427302717() {
  return __cxx_static_address_42138fbbc7e219b427302717.reference || (__cxx_static_address_42138fbbc7e219b427302717.reference = {
    __cReference: true,
    get value() { return TECHLIGHT2____header_global_b2cb190008c93d63; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:240
export const TECHLIGHTBUST2____header_global_fbd6958b9d344720 = ((((((121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_06606cfd8cdea6dd0ce0f6aa() {
  return __cxx_static_address_06606cfd8cdea6dd0ce0f6aa.reference || (__cxx_static_address_06606cfd8cdea6dd0ce0f6aa.reference = {
    __cReference: true,
    get value() { return TECHLIGHTBUST2____header_global_fbd6958b9d344720; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:241
export const TECHLIGHT4____header_global_5ef44ea4b278d713 = ((((((122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3fdc8ca36aee22f980b07593() {
  return __cxx_static_address_3fdc8ca36aee22f980b07593.reference || (__cxx_static_address_3fdc8ca36aee22f980b07593.reference = {
    __cReference: true,
    get value() { return TECHLIGHT4____header_global_5ef44ea4b278d713; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:242
export const TECHLIGHTBUST4____header_global_9f13756d19c9c1a7 = ((((((123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7a615a41f671e6e183385c0c() {
  return __cxx_static_address_7a615a41f671e6e183385c0c.reference || (__cxx_static_address_7a615a41f671e6e183385c0c.reference = {
    __cReference: true,
    get value() { return TECHLIGHTBUST4____header_global_9f13756d19c9c1a7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:243
export const WALLLIGHT4____header_global_9f351372b603def3 = ((((((124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_003407f680452e9cd4cd68e9() {
  return __cxx_static_address_003407f680452e9cd4cd68e9.reference || (__cxx_static_address_003407f680452e9cd4cd68e9.reference = {
    __cReference: true,
    get value() { return WALLLIGHT4____header_global_9f351372b603def3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:244
export const WALLLIGHTBUST4____header_global_16aac2139a4732b8 = ((((((125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_90b8fb2bb511facf2140bf11() {
  return __cxx_static_address_90b8fb2bb511facf2140bf11.reference || (__cxx_static_address_90b8fb2bb511facf2140bf11.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST4____header_global_16aac2139a4732b8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:245
export const ACCESSSWITCH____header_global_e31e89ec7728d70f = ((((((130) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_da207c8295d94053e720e62a() {
  return __cxx_static_address_da207c8295d94053e720e62a.reference || (__cxx_static_address_da207c8295d94053e720e62a.reference = {
    __cReference: true,
    get value() { return ACCESSSWITCH____header_global_e31e89ec7728d70f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:246
export const SLOTDOOR____header_global_955c59033a400060 = ((((((132) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0efe1617553d02fdbfad1b44() {
  return __cxx_static_address_0efe1617553d02fdbfad1b44.reference || (__cxx_static_address_0efe1617553d02fdbfad1b44.reference = {
    __cReference: true,
    get value() { return SLOTDOOR____header_global_955c59033a400060; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:247
export const LIGHTSWITCH____header_global_a9ec5313b20f540f = ((((((134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_902c1f523df0aa419db3067f() {
  return __cxx_static_address_902c1f523df0aa419db3067f.reference || (__cxx_static_address_902c1f523df0aa419db3067f.reference = {
    __cReference: true,
    get value() { return LIGHTSWITCH____header_global_a9ec5313b20f540f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:248
export const SPACEDOORSWITCH____header_global_2a2cd2e8249c7a5e = ((((((136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_86aa692e8d8911f89acde88d() {
  return __cxx_static_address_86aa692e8d8911f89acde88d.reference || (__cxx_static_address_86aa692e8d8911f89acde88d.reference = {
    __cReference: true,
    get value() { return SPACEDOORSWITCH____header_global_2a2cd2e8249c7a5e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:249
export const SPACELIGHTSWITCH____header_global_e6d21ea3ed8525c6 = ((((((138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d21afcf755062f6b32fa2487() {
  return __cxx_static_address_d21afcf755062f6b32fa2487.reference || (__cxx_static_address_d21afcf755062f6b32fa2487.reference = {
    __cReference: true,
    get value() { return SPACELIGHTSWITCH____header_global_e6d21ea3ed8525c6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:250
export const FRANKENSTINESWITCH____header_global_a157773bce7f5573 = ((((((140) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_023c45b7445694c580298c47() {
  return __cxx_static_address_023c45b7445694c580298c47.reference || (__cxx_static_address_023c45b7445694c580298c47.reference = {
    __cReference: true,
    get value() { return FRANKENSTINESWITCH____header_global_a157773bce7f5573; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:251
export const NUKEBUTTON____header_global_1dc980963c2aebe6 = ((((((142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_77e1a5be34bc0f1828fead42() {
  return __cxx_static_address_77e1a5be34bc0f1828fead42.reference || (__cxx_static_address_77e1a5be34bc0f1828fead42.reference = {
    __cReference: true,
    get value() { return NUKEBUTTON____header_global_1dc980963c2aebe6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:252
export const MULTISWITCH____header_global_86fa05cf6a6ce4f8 = ((((((146) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_81f949a097a1b04eb7ded246() {
  return __cxx_static_address_81f949a097a1b04eb7ded246.reference || (__cxx_static_address_81f949a097a1b04eb7ded246.reference = {
    __cReference: true,
    get value() { return MULTISWITCH____header_global_86fa05cf6a6ce4f8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:253
export const DOORTILE5____header_global_14d319a0ab20b7bc = ((((((150) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b28cb539cef8ff6b274acaf1() {
  return __cxx_static_address_b28cb539cef8ff6b274acaf1.reference || (__cxx_static_address_b28cb539cef8ff6b274acaf1.reference = {
    __cReference: true,
    get value() { return DOORTILE5____header_global_14d319a0ab20b7bc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:254
export const DOORTILE6____header_global_d78ecaacc17591f0 = ((((((151) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1c26576eef49e3bdb643b4fe() {
  return __cxx_static_address_1c26576eef49e3bdb643b4fe.reference || (__cxx_static_address_1c26576eef49e3bdb643b4fe.reference = {
    __cReference: true,
    get value() { return DOORTILE6____header_global_d78ecaacc17591f0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:255
export const DOORTILE1____header_global_d2b5e19b5ca1c125 = ((((((152) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b1c2717f6dbd4a09735384be() {
  return __cxx_static_address_b1c2717f6dbd4a09735384be.reference || (__cxx_static_address_b1c2717f6dbd4a09735384be.reference = {
    __cReference: true,
    get value() { return DOORTILE1____header_global_d2b5e19b5ca1c125; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:256
export const DOORTILE2____header_global_8cada491c2ff76b9 = ((((((153) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9eb01fb32ad8f6869fd09c00() {
  return __cxx_static_address_9eb01fb32ad8f6869fd09c00.reference || (__cxx_static_address_9eb01fb32ad8f6869fd09c00.reference = {
    __cReference: true,
    get value() { return DOORTILE2____header_global_8cada491c2ff76b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:257
export const DOORTILE3____header_global_150cb2b598fd9e93 = ((((((154) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ae9ba6db0343ff1ba5ea3a3e() {
  return __cxx_static_address_ae9ba6db0343ff1ba5ea3a3e.reference || (__cxx_static_address_ae9ba6db0343ff1ba5ea3a3e.reference = {
    __cReference: true,
    get value() { return DOORTILE3____header_global_150cb2b598fd9e93; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:258
export const DOORTILE4____header_global_010cdf778ea84ada = ((((((155) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c8e16cf3d56df97de2b88b69() {
  return __cxx_static_address_c8e16cf3d56df97de2b88b69.reference || (__cxx_static_address_c8e16cf3d56df97de2b88b69.reference = {
    __cReference: true,
    get value() { return DOORTILE4____header_global_010cdf778ea84ada; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:259
export const DOORTILE7____header_global_04925726b31adb73 = ((((((156) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5541c4d476cf1fc0acac31c9() {
  return __cxx_static_address_5541c4d476cf1fc0acac31c9.reference || (__cxx_static_address_5541c4d476cf1fc0acac31c9.reference = {
    __cReference: true,
    get value() { return DOORTILE7____header_global_04925726b31adb73; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:260
export const DOORTILE8____header_global_5953449670495ccc = ((((((157) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b527a023c51da0a8e1fbc026() {
  return __cxx_static_address_b527a023c51da0a8e1fbc026.reference || (__cxx_static_address_b527a023c51da0a8e1fbc026.reference = {
    __cReference: true,
    get value() { return DOORTILE8____header_global_5953449670495ccc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:261
export const DOORTILE9____header_global_fad95994b63c7229 = ((((((158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_396d7fad3dcf49f545075f49() {
  return __cxx_static_address_396d7fad3dcf49f545075f49.reference || (__cxx_static_address_396d7fad3dcf49f545075f49.reference = {
    __cReference: true,
    get value() { return DOORTILE9____header_global_fad95994b63c7229; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:262
export const DOORTILE10____header_global_a888cb62587b97f7 = ((((((159) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dc3c01d0fb617fb73470db14() {
  return __cxx_static_address_dc3c01d0fb617fb73470db14.reference || (__cxx_static_address_dc3c01d0fb617fb73470db14.reference = {
    __cReference: true,
    get value() { return DOORTILE10____header_global_a888cb62587b97f7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:263
export const DOORSHOCK____header_global_536930753858db19 = ((((((160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1ecb3bcc54aef4cf47ff68d7() {
  return __cxx_static_address_1ecb3bcc54aef4cf47ff68d7.reference || (__cxx_static_address_1ecb3bcc54aef4cf47ff68d7.reference = {
    __cReference: true,
    get value() { return DOORSHOCK____header_global_536930753858db19; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:264
export const DIPSWITCH____header_global_4265264c8d40ea14 = ((((((162) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_229249fbec3d0afffbf52836() {
  return __cxx_static_address_229249fbec3d0afffbf52836.reference || (__cxx_static_address_229249fbec3d0afffbf52836.reference = {
    __cReference: true,
    get value() { return DIPSWITCH____header_global_4265264c8d40ea14; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:265
export const DIPSWITCH2____header_global_c0822c3b001aec94 = ((((((164) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4a76327f02e8778895b7e6e7() {
  return __cxx_static_address_4a76327f02e8778895b7e6e7.reference || (__cxx_static_address_4a76327f02e8778895b7e6e7.reference = {
    __cReference: true,
    get value() { return DIPSWITCH2____header_global_c0822c3b001aec94; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:266
export const TECHSWITCH____header_global_08721ea0268af204 = ((((((166) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_36751e3d29c151d54f85a335() {
  return __cxx_static_address_36751e3d29c151d54f85a335.reference || (__cxx_static_address_36751e3d29c151d54f85a335.reference = {
    __cReference: true,
    get value() { return TECHSWITCH____header_global_08721ea0268af204; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:267
export const DIPSWITCH3____header_global_876b9a19ec0575f8 = ((((((168) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4bbfd56944ddc46981b55347() {
  return __cxx_static_address_4bbfd56944ddc46981b55347.reference || (__cxx_static_address_4bbfd56944ddc46981b55347.reference = {
    __cReference: true,
    get value() { return DIPSWITCH3____header_global_876b9a19ec0575f8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:268
export const ACCESSSWITCH2____header_global_947ba381b6e7dd4b = ((((((170) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_74ef802b6888714ecd579847() {
  return __cxx_static_address_74ef802b6888714ecd579847.reference || (__cxx_static_address_74ef802b6888714ecd579847.reference = {
    __cReference: true,
    get value() { return ACCESSSWITCH2____header_global_947ba381b6e7dd4b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:269
export const FLOORSLIME____header_global_efa031b80ada53be = ((((((200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4443bf25785451a740045e3f() {
  return __cxx_static_address_4443bf25785451a740045e3f.reference || (__cxx_static_address_4443bf25785451a740045e3f.reference = {
    __cReference: true,
    get value() { return FLOORSLIME____header_global_efa031b80ada53be; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:270
export const BIGFORCE____header_global_0431324baabb624b = ((((((230) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e23b9b958123b63c52321828() {
  return __cxx_static_address_e23b9b958123b63c52321828.reference || (__cxx_static_address_e23b9b958123b63c52321828.reference = {
    __cReference: true,
    get value() { return BIGFORCE____header_global_0431324baabb624b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:271
export const MASKWALL9____header_global_4dcae39bae582bf7 = ((((((255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a1db404d04130e02a48ac5e0() {
  return __cxx_static_address_a1db404d04130e02a48ac5e0.reference || (__cxx_static_address_a1db404d04130e02a48ac5e0.reference = {
    __cReference: true,
    get value() { return MASKWALL9____header_global_4dcae39bae582bf7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:272
export const SCREENBREAK1____header_global_1baa848dca4c2121 = ((((((263) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5387b9c9eb907a3088c4d0f5() {
  return __cxx_static_address_5387b9c9eb907a3088c4d0f5.reference || (__cxx_static_address_5387b9c9eb907a3088c4d0f5.reference = {
    __cReference: true,
    get value() { return SCREENBREAK1____header_global_1baa848dca4c2121; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:273
export const SCREENBREAK2____header_global_88162239e2c129c5 = ((((((264) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_49d05a519807a3bdfab75174() {
  return __cxx_static_address_49d05a519807a3bdfab75174.reference || (__cxx_static_address_49d05a519807a3bdfab75174.reference = {
    __cReference: true,
    get value() { return SCREENBREAK2____header_global_88162239e2c129c5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:274
export const SCREENBREAK3____header_global_3f4ef5fa572aebe0 = ((((((265) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8e21f93b06116d3112616aec() {
  return __cxx_static_address_8e21f93b06116d3112616aec.reference || (__cxx_static_address_8e21f93b06116d3112616aec.reference = {
    __cReference: true,
    get value() { return SCREENBREAK3____header_global_3f4ef5fa572aebe0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:275
export const SCREENBREAK4____header_global_727bfc2be69a1313 = ((((((266) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_50fedbca0eab5c28dda3f2f4() {
  return __cxx_static_address_50fedbca0eab5c28dda3f2f4.reference || (__cxx_static_address_50fedbca0eab5c28dda3f2f4.reference = {
    __cReference: true,
    get value() { return SCREENBREAK4____header_global_727bfc2be69a1313; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:276
export const SCREENBREAK5____header_global_261576077e29782e = ((((((267) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_90dbdb47ee31c29e3bef4ffd() {
  return __cxx_static_address_90dbdb47ee31c29e3bef4ffd.reference || (__cxx_static_address_90dbdb47ee31c29e3bef4ffd.reference = {
    __cReference: true,
    get value() { return SCREENBREAK5____header_global_261576077e29782e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:277
export const SCREENBREAK6____header_global_d2232a42ff3f868a = ((((((268) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3233ab3df919742efb9fbe21() {
  return __cxx_static_address_3233ab3df919742efb9fbe21.reference || (__cxx_static_address_3233ab3df919742efb9fbe21.reference = {
    __cReference: true,
    get value() { return SCREENBREAK6____header_global_d2232a42ff3f868a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:278
export const SCREENBREAK7____header_global_3f75aa290723941a = ((((((269) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_95c0f2f0f656b730dcee3afb() {
  return __cxx_static_address_95c0f2f0f656b730dcee3afb.reference || (__cxx_static_address_95c0f2f0f656b730dcee3afb.reference = {
    __cReference: true,
    get value() { return SCREENBREAK7____header_global_3f75aa290723941a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:279
export const SCREENBREAK8____header_global_326d4d2bcdc5ec8f = ((((((270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_56f13571428df575f1daf9c4() {
  return __cxx_static_address_56f13571428df575f1daf9c4.reference || (__cxx_static_address_56f13571428df575f1daf9c4.reference = {
    __cReference: true,
    get value() { return SCREENBREAK8____header_global_326d4d2bcdc5ec8f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:280
export const SCREENBREAK9____header_global_151165e8594f3600 = ((((((271) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0c00248d310005d245e05ae9() {
  return __cxx_static_address_0c00248d310005d245e05ae9.reference || (__cxx_static_address_0c00248d310005d245e05ae9.reference = {
    __cReference: true,
    get value() { return SCREENBREAK9____header_global_151165e8594f3600; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:281
export const SCREENBREAK10____header_global_0c819563ad3a29cf = ((((((272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3bbde48f8211f8ff869601a9() {
  return __cxx_static_address_3bbde48f8211f8ff869601a9.reference || (__cxx_static_address_3bbde48f8211f8ff869601a9.reference = {
    __cReference: true,
    get value() { return SCREENBREAK10____header_global_0c819563ad3a29cf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:282
export const SCREENBREAK11____header_global_02b204b8a40431a8 = ((((((273) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_577c73213eda4b0b41ec063b() {
  return __cxx_static_address_577c73213eda4b0b41ec063b.reference || (__cxx_static_address_577c73213eda4b0b41ec063b.reference = {
    __cReference: true,
    get value() { return SCREENBREAK11____header_global_02b204b8a40431a8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:283
export const SCREENBREAK12____header_global_0156f712d7560aff = ((((((274) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cb686b0a5935b6a8fdc1561b() {
  return __cxx_static_address_cb686b0a5935b6a8fdc1561b.reference || (__cxx_static_address_cb686b0a5935b6a8fdc1561b.reference = {
    __cReference: true,
    get value() { return SCREENBREAK12____header_global_0156f712d7560aff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:284
export const SCREENBREAK13____header_global_5e54c95b56b8f665 = ((((((275) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a89388a712e933564ccb6f72() {
  return __cxx_static_address_a89388a712e933564ccb6f72.reference || (__cxx_static_address_a89388a712e933564ccb6f72.reference = {
    __cReference: true,
    get value() { return SCREENBREAK13____header_global_5e54c95b56b8f665; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:285
export const MASKWALL1____header_global_7ae7f3944c99e118 = ((((((285) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7f7378cf3ca74effd7feb379() {
  return __cxx_static_address_7f7378cf3ca74effd7feb379.reference || (__cxx_static_address_7f7378cf3ca74effd7feb379.reference = {
    __cReference: true,
    get value() { return MASKWALL1____header_global_7ae7f3944c99e118; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:286
export const W_TECHWALL1____header_global_51c38d81bea96e3e = ((((((293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2730f789fb5fd76504d0a1b8() {
  return __cxx_static_address_2730f789fb5fd76504d0a1b8.reference || (__cxx_static_address_2730f789fb5fd76504d0a1b8.reference = {
    __cReference: true,
    get value() { return W_TECHWALL1____header_global_51c38d81bea96e3e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:287
export const W_TECHWALL2____header_global_d61edfd84e400966 = ((((((297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_34f958f686548596c4638a92() {
  return __cxx_static_address_34f958f686548596c4638a92.reference || (__cxx_static_address_34f958f686548596c4638a92.reference = {
    __cReference: true,
    get value() { return W_TECHWALL2____header_global_d61edfd84e400966; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:288
export const W_TECHWALL15____header_global_d216b1ba91bd7df2 = ((((((299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e87a0af0ee7dd8b8228caaa6() {
  return __cxx_static_address_e87a0af0ee7dd8b8228caaa6.reference || (__cxx_static_address_e87a0af0ee7dd8b8228caaa6.reference = {
    __cReference: true,
    get value() { return W_TECHWALL15____header_global_d216b1ba91bd7df2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:289
export const W_TECHWALL3____header_global_d86321c2096e3159 = ((((((301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9c8d6c6ea656ee5e35c47caa() {
  return __cxx_static_address_9c8d6c6ea656ee5e35c47caa.reference || (__cxx_static_address_9c8d6c6ea656ee5e35c47caa.reference = {
    __cReference: true,
    get value() { return W_TECHWALL3____header_global_d86321c2096e3159; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:290
export const W_TECHWALL4____header_global_090b3d5f4189a1c4 = ((((((305) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eaeb539df1c56d21afc2deda() {
  return __cxx_static_address_eaeb539df1c56d21afc2deda.reference || (__cxx_static_address_eaeb539df1c56d21afc2deda.reference = {
    __cReference: true,
    get value() { return W_TECHWALL4____header_global_090b3d5f4189a1c4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:291
export const W_TECHWALL10____header_global_6887993643ef8b26 = ((((((306) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5b6c565c821b466545ecbd0a() {
  return __cxx_static_address_5b6c565c821b466545ecbd0a.reference || (__cxx_static_address_5b6c565c821b466545ecbd0a.reference = {
    __cReference: true,
    get value() { return W_TECHWALL10____header_global_6887993643ef8b26; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:292
export const W_TECHWALL16____header_global_2d458323a199ea41 = ((((((307) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d99c193e68813c9dabdb92a9() {
  return __cxx_static_address_d99c193e68813c9dabdb92a9.reference || (__cxx_static_address_d99c193e68813c9dabdb92a9.reference = {
    __cReference: true,
    get value() { return W_TECHWALL16____header_global_2d458323a199ea41; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:293
export const WATERTILE2____header_global_30b454fc2d8a8cca = ((((((336) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_640ae5280dfdbe23e31afdad() {
  return __cxx_static_address_640ae5280dfdbe23e31afdad.reference || (__cxx_static_address_640ae5280dfdbe23e31afdad.reference = {
    __cReference: true,
    get value() { return WATERTILE2____header_global_30b454fc2d8a8cca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:294
export const BPANNEL1____header_global_b44fc7b88943e660 = ((((((341) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dcd58e78fa5f2065d3779ac6() {
  return __cxx_static_address_dcd58e78fa5f2065d3779ac6.reference || (__cxx_static_address_dcd58e78fa5f2065d3779ac6.reference = {
    __cReference: true,
    get value() { return BPANNEL1____header_global_b44fc7b88943e660; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:295
export const PANNEL1____header_global_9365c10b29d22a31 = ((((((342) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ef2e635f3ea61422f334408b() {
  return __cxx_static_address_ef2e635f3ea61422f334408b.reference || (__cxx_static_address_ef2e635f3ea61422f334408b.reference = {
    __cReference: true,
    get value() { return PANNEL1____header_global_9365c10b29d22a31; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:296
export const PANNEL2____header_global_349898661d988bbe = ((((((343) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8f2ff6f0de9431b3f96fde50() {
  return __cxx_static_address_8f2ff6f0de9431b3f96fde50.reference || (__cxx_static_address_8f2ff6f0de9431b3f96fde50.reference = {
    __cReference: true,
    get value() { return PANNEL2____header_global_349898661d988bbe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:297
export const STATIC____header_global_af3c384d954280fc = ((((((351) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f2ec0490032d4f494636359b() {
  return __cxx_static_address_f2ec0490032d4f494636359b.reference || (__cxx_static_address_f2ec0490032d4f494636359b.reference = {
    __cReference: true,
    get value() { return STATIC____header_global_af3c384d954280fc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:298
export const W_SCREENBREAK____header_global_3195c0bf4e0abaa5 = ((((((357) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_06df4f823da11770d19c8fd2() {
  return __cxx_static_address_06df4f823da11770d19c8fd2.reference || (__cxx_static_address_06df4f823da11770d19c8fd2.reference = {
    __cReference: true,
    get value() { return W_SCREENBREAK____header_global_3195c0bf4e0abaa5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:299
export const W_HITTECHWALL3____header_global_1d99b630427da001 = ((((((360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_700f095bc40c8b7a469d39b0() {
  return __cxx_static_address_700f095bc40c8b7a469d39b0.reference || (__cxx_static_address_700f095bc40c8b7a469d39b0.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL3____header_global_1d99b630427da001; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:300
export const W_HITTECHWALL4____header_global_a3598c2d1cb483b5 = ((((((361) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_74a0fd4c23d725221bfbcf64() {
  return __cxx_static_address_74a0fd4c23d725221bfbcf64.reference || (__cxx_static_address_74a0fd4c23d725221bfbcf64.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL4____header_global_a3598c2d1cb483b5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:301
export const W_HITTECHWALL2____header_global_615ce50ee2dd4034 = ((((((362) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d5bdf49dc6d2d163e8529008() {
  return __cxx_static_address_d5bdf49dc6d2d163e8529008.reference || (__cxx_static_address_d5bdf49dc6d2d163e8529008.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL2____header_global_615ce50ee2dd4034; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:302
export const W_HITTECHWALL1____header_global_47314041d1f717db = ((((((363) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a02aa6f4ef8f9fd8c555a8fe() {
  return __cxx_static_address_a02aa6f4ef8f9fd8c555a8fe.reference || (__cxx_static_address_a02aa6f4ef8f9fd8c555a8fe.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL1____header_global_47314041d1f717db; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:303
export const MASKWALL10____header_global_838304cf82b3e6cf = ((((((387) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1fcd4e516c871bace4792d8e() {
  return __cxx_static_address_1fcd4e516c871bace4792d8e.reference || (__cxx_static_address_1fcd4e516c871bace4792d8e.reference = {
    __cReference: true,
    get value() { return MASKWALL10____header_global_838304cf82b3e6cf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:304
export const MASKWALL11____header_global_6e8b1612486f462b = ((((((391) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8151b5dc6216675959322b45() {
  return __cxx_static_address_8151b5dc6216675959322b45.reference || (__cxx_static_address_8151b5dc6216675959322b45.reference = {
    __cReference: true,
    get value() { return MASKWALL11____header_global_6e8b1612486f462b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:305
export const DOORTILE22____header_global_1f96bd4f4e8668d4 = ((((((395) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8675f041673ac794401041f0() {
  return __cxx_static_address_8675f041673ac794401041f0.reference || (__cxx_static_address_8675f041673ac794401041f0.reference = {
    __cReference: true,
    get value() { return DOORTILE22____header_global_1f96bd4f4e8668d4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:306
export const FANSPRITE____header_global_d38c46c08a83a7b4 = ((((((407) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d603898cf5d936685d671edd() {
  return __cxx_static_address_d603898cf5d936685d671edd.reference || (__cxx_static_address_d603898cf5d936685d671edd.reference = {
    __cReference: true,
    get value() { return FANSPRITE____header_global_d38c46c08a83a7b4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:307
export const FANSPRITEBROKE____header_global_0c5fe713ddc5d43a = ((((((411) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fb78a30cc06f7a8c1714798d() {
  return __cxx_static_address_fb78a30cc06f7a8c1714798d.reference || (__cxx_static_address_fb78a30cc06f7a8c1714798d.reference = {
    __cReference: true,
    get value() { return FANSPRITEBROKE____header_global_0c5fe713ddc5d43a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:308
export const FANSHADOW____header_global_1c70dc353ef544bf = ((((((412) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e08725868dac33f637ba6278() {
  return __cxx_static_address_e08725868dac33f637ba6278.reference || (__cxx_static_address_e08725868dac33f637ba6278.reference = {
    __cReference: true,
    get value() { return FANSHADOW____header_global_1c70dc353ef544bf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:309
export const FANSHADOWBROKE____header_global_2fc932f2c55ce744 = ((((((416) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9aafa45b7f867ce5ca43f6a2() {
  return __cxx_static_address_9aafa45b7f867ce5ca43f6a2.reference || (__cxx_static_address_9aafa45b7f867ce5ca43f6a2.reference = {
    __cReference: true,
    get value() { return FANSHADOWBROKE____header_global_2fc932f2c55ce744; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:310
export const DOORTILE18____header_global_cb088545e7cdba65 = ((((((447) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2c90bff2471b52e5db642a89() {
  return __cxx_static_address_2c90bff2471b52e5db642a89.reference || (__cxx_static_address_2c90bff2471b52e5db642a89.reference = {
    __cReference: true,
    get value() { return DOORTILE18____header_global_cb088545e7cdba65; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:311
export const DOORTILE19____header_global_95accf2e882eb50e = ((((((448) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c0d81b49432eb8c056a9cee5() {
  return __cxx_static_address_c0d81b49432eb8c056a9cee5.reference || (__cxx_static_address_c0d81b49432eb8c056a9cee5.reference = {
    __cReference: true,
    get value() { return DOORTILE19____header_global_95accf2e882eb50e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:312
export const DOORTILE20____header_global_89e2db2a47f53791 = ((((((449) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6a3f897cc3ea797dff78f07c() {
  return __cxx_static_address_6a3f897cc3ea797dff78f07c.reference || (__cxx_static_address_6a3f897cc3ea797dff78f07c.reference = {
    __cReference: true,
    get value() { return DOORTILE20____header_global_89e2db2a47f53791; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:313
export const VIEWSCREEN2____header_global_ad0786f477e3256a = ((((((499) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b93feb54df32027e2b0e24d8() {
  return __cxx_static_address_b93feb54df32027e2b0e24d8.reference || (__cxx_static_address_b93feb54df32027e2b0e24d8.reference = {
    __cReference: true,
    get value() { return VIEWSCREEN2____header_global_ad0786f477e3256a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:314
export const VIEWSCREEN____header_global_93d6067fce7852f9 = ((((((502) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_79d5c37a54e67e0f146d3b85() {
  return __cxx_static_address_79d5c37a54e67e0f146d3b85.reference || (__cxx_static_address_79d5c37a54e67e0f146d3b85.reference = {
    __cReference: true,
    get value() { return VIEWSCREEN____header_global_93d6067fce7852f9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:315
export const GLASS____header_global_80129ba2dda05a4a = ((((((503) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_28b662153da9a0c71d03ecaf() {
  return __cxx_static_address_28b662153da9a0c71d03ecaf.reference || (__cxx_static_address_28b662153da9a0c71d03ecaf.reference = {
    __cReference: true,
    get value() { return GLASS____header_global_80129ba2dda05a4a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:316
export const GLASS2____header_global_a7322b9bbb7c24e2 = ((((((504) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_96261fb8a98b7db0c25f7fa8() {
  return __cxx_static_address_96261fb8a98b7db0c25f7fa8.reference || (__cxx_static_address_96261fb8a98b7db0c25f7fa8.reference = {
    __cReference: true,
    get value() { return GLASS2____header_global_a7322b9bbb7c24e2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:317
export const STAINGLASS1____header_global_d7eaf897a7fe83bd = ((((((510) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1759178c7e571c7f0a95d579() {
  return __cxx_static_address_1759178c7e571c7f0a95d579.reference || (__cxx_static_address_1759178c7e571c7f0a95d579.reference = {
    __cReference: true,
    get value() { return STAINGLASS1____header_global_d7eaf897a7fe83bd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:318
export const MASKWALL5____header_global_5706c2ac13f458c1 = ((((((514) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4be4348435a2e799626fb6b1() {
  return __cxx_static_address_4be4348435a2e799626fb6b1.reference || (__cxx_static_address_4be4348435a2e799626fb6b1.reference = {
    __cReference: true,
    get value() { return MASKWALL5____header_global_5706c2ac13f458c1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:319
export const SATELITE____header_global_267311ef8b8869ef = ((((((516) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eff22d0ef52613408afa0556() {
  return __cxx_static_address_eff22d0ef52613408afa0556.reference || (__cxx_static_address_eff22d0ef52613408afa0556.reference = {
    __cReference: true,
    get value() { return SATELITE____header_global_267311ef8b8869ef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:320
export const FUELPOD____header_global_98c1f0f4e4ed7561 = ((((((517) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_65b493ecfb0854e2381f2b0b() {
  return __cxx_static_address_65b493ecfb0854e2381f2b0b.reference || (__cxx_static_address_65b493ecfb0854e2381f2b0b.reference = {
    __cReference: true,
    get value() { return FUELPOD____header_global_98c1f0f4e4ed7561; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:321
export const CRACK1____header_global_1c9dfa50a6c3cd97 = ((((((546) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_43003f860e9653577999cbd8() {
  return __cxx_static_address_43003f860e9653577999cbd8.reference || (__cxx_static_address_43003f860e9653577999cbd8.reference = {
    __cReference: true,
    get value() { return CRACK1____header_global_1c9dfa50a6c3cd97; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:322
export const CRACK2____header_global_077c15da75150cd9 = ((((((547) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6ccbb8ecbc1abbd9c2858240() {
  return __cxx_static_address_6ccbb8ecbc1abbd9c2858240.reference || (__cxx_static_address_6ccbb8ecbc1abbd9c2858240.reference = {
    __cReference: true,
    get value() { return CRACK2____header_global_077c15da75150cd9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:323
export const CRACK3____header_global_18555727697c459d = ((((((548) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f9f0b8f371e29ed91efadb67() {
  return __cxx_static_address_f9f0b8f371e29ed91efadb67.reference || (__cxx_static_address_f9f0b8f371e29ed91efadb67.reference = {
    __cReference: true,
    get value() { return CRACK3____header_global_18555727697c459d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:324
export const CRACK4____header_global_d62540dbeadea85d = ((((((549) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_572fcae2f35c41871d9e2af0() {
  return __cxx_static_address_572fcae2f35c41871d9e2af0.reference || (__cxx_static_address_572fcae2f35c41871d9e2af0.reference = {
    __cReference: true,
    get value() { return CRACK4____header_global_d62540dbeadea85d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:325
export const FOOTPRINTS____header_global_3308b1234afbf47b = ((((((550) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bf48a637f78226564fe33eab() {
  return __cxx_static_address_bf48a637f78226564fe33eab.reference || (__cxx_static_address_bf48a637f78226564fe33eab.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS____header_global_3308b1234afbf47b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:326
export const DOMELITE____header_global_9b92b3ad6254183a = ((((((551) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_668fa1d25dd3be44f8d441d1() {
  return __cxx_static_address_668fa1d25dd3be44f8d441d1.reference || (__cxx_static_address_668fa1d25dd3be44f8d441d1.reference = {
    __cReference: true,
    get value() { return DOMELITE____header_global_9b92b3ad6254183a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:327
export const CAMERAPOLE____header_global_21792f05dd2bb386 = ((((((554) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_145b080819e645b390fbdfd1() {
  return __cxx_static_address_145b080819e645b390fbdfd1.reference || (__cxx_static_address_145b080819e645b390fbdfd1.reference = {
    __cReference: true,
    get value() { return CAMERAPOLE____header_global_21792f05dd2bb386; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:328
export const CHAIR1____header_global_1b48a79f28847c9b = ((((((556) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3880507365dd89a74001e6bd() {
  return __cxx_static_address_3880507365dd89a74001e6bd.reference || (__cxx_static_address_3880507365dd89a74001e6bd.reference = {
    __cReference: true,
    get value() { return CHAIR1____header_global_1b48a79f28847c9b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:329
export const CHAIR2____header_global_6e64859ff6a74528 = ((((((557) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f62a2b7b5451a61e8c677c5f() {
  return __cxx_static_address_f62a2b7b5451a61e8c677c5f.reference || (__cxx_static_address_f62a2b7b5451a61e8c677c5f.reference = {
    __cReference: true,
    get value() { return CHAIR2____header_global_6e64859ff6a74528; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:330
export const BROKENCHAIR____header_global_00d0c47023566bfc = ((((((559) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2fd3030704bdcb6cde15f2c8() {
  return __cxx_static_address_2fd3030704bdcb6cde15f2c8.reference || (__cxx_static_address_2fd3030704bdcb6cde15f2c8.reference = {
    __cReference: true,
    get value() { return BROKENCHAIR____header_global_00d0c47023566bfc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:331
export const MIRROR____header_global_60e2e69dc2a50160 = ((((((560) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_83069a1bfaedf6541b6bbe1a() {
  return __cxx_static_address_83069a1bfaedf6541b6bbe1a.reference || (__cxx_static_address_83069a1bfaedf6541b6bbe1a.reference = {
    __cReference: true,
    get value() { return MIRROR____header_global_60e2e69dc2a50160; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:332
export const WATERFOUNTAIN____header_global_7a669ded65a7cfcb = ((((((563) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_552d1d4de03df6ede94f5fc5() {
  return __cxx_static_address_552d1d4de03df6ede94f5fc5.reference || (__cxx_static_address_552d1d4de03df6ede94f5fc5.reference = {
    __cReference: true,
    get value() { return WATERFOUNTAIN____header_global_7a669ded65a7cfcb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:333
export const WATERFOUNTAINBROKE____header_global_5986db74c63c973d = ((((((567) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a39d11c72bce2a67818dd6ee() {
  return __cxx_static_address_a39d11c72bce2a67818dd6ee.reference || (__cxx_static_address_a39d11c72bce2a67818dd6ee.reference = {
    __cReference: true,
    get value() { return WATERFOUNTAINBROKE____header_global_5986db74c63c973d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:334
export const FEMMAG1____header_global_f8f84294b065b6ac = ((((((568) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_935893c757dae3858765890c() {
  return __cxx_static_address_935893c757dae3858765890c.reference || (__cxx_static_address_935893c757dae3858765890c.reference = {
    __cReference: true,
    get value() { return FEMMAG1____header_global_f8f84294b065b6ac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:335
export const TOILET____header_global_554b6c22c028f62f = ((((((569) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_96fe2a25633a6d0bb635ae8a() {
  return __cxx_static_address_96fe2a25633a6d0bb635ae8a.reference || (__cxx_static_address_96fe2a25633a6d0bb635ae8a.reference = {
    __cReference: true,
    get value() { return TOILET____header_global_554b6c22c028f62f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:336
export const STALL____header_global_a69c644ca790a74e = ((((((571) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_620f5f0d962b77a132c78f3b() {
  return __cxx_static_address_620f5f0d962b77a132c78f3b.reference || (__cxx_static_address_620f5f0d962b77a132c78f3b.reference = {
    __cReference: true,
    get value() { return STALL____header_global_a69c644ca790a74e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:337
export const STALLBROKE____header_global_3d09bd9d0da5bdcb = ((((((573) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b7f42793ce050f624492952e() {
  return __cxx_static_address_b7f42793ce050f624492952e.reference || (__cxx_static_address_b7f42793ce050f624492952e.reference = {
    __cReference: true,
    get value() { return STALLBROKE____header_global_3d09bd9d0da5bdcb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:338
export const FEMMAG2____header_global_b59a2952ebc83b29 = ((((((577) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b5752e1bd84c341714da55fa() {
  return __cxx_static_address_b5752e1bd84c341714da55fa.reference || (__cxx_static_address_b5752e1bd84c341714da55fa.reference = {
    __cReference: true,
    get value() { return FEMMAG2____header_global_b59a2952ebc83b29; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:339
export const REACTOR2____header_global_a45cf0d768c92324 = ((((((578) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e8320d7db388ecc5c18c3ee3() {
  return __cxx_static_address_e8320d7db388ecc5c18c3ee3.reference || (__cxx_static_address_e8320d7db388ecc5c18c3ee3.reference = {
    __cReference: true,
    get value() { return REACTOR2____header_global_a45cf0d768c92324; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:340
export const REACTOR2BURNT____header_global_f64e1e48c70019b8 = ((((((579) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_82b46221e1f83d22d31e22e6() {
  return __cxx_static_address_82b46221e1f83d22d31e22e6.reference || (__cxx_static_address_82b46221e1f83d22d31e22e6.reference = {
    __cReference: true,
    get value() { return REACTOR2BURNT____header_global_f64e1e48c70019b8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:341
export const REACTOR2SPARK____header_global_48734cf0fd14a301 = ((((((580) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_624e7ec5b456e431ba427de7() {
  return __cxx_static_address_624e7ec5b456e431ba427de7.reference || (__cxx_static_address_624e7ec5b456e431ba427de7.reference = {
    __cReference: true,
    get value() { return REACTOR2SPARK____header_global_48734cf0fd14a301; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:342
export const GRATE1____header_global_afa131cfdb7e43cc = ((((((595) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c7099d70f534b1ecc631fcfe() {
  return __cxx_static_address_c7099d70f534b1ecc631fcfe.reference || (__cxx_static_address_c7099d70f534b1ecc631fcfe.reference = {
    __cReference: true,
    get value() { return GRATE1____header_global_afa131cfdb7e43cc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:343
export const BGRATE1____header_global_53cc5fc14fa6f5a4 = ((((((596) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fea8eb56a55599bbf55be641() {
  return __cxx_static_address_fea8eb56a55599bbf55be641.reference || (__cxx_static_address_fea8eb56a55599bbf55be641.reference = {
    __cReference: true,
    get value() { return BGRATE1____header_global_53cc5fc14fa6f5a4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:344
export const SOLARPANNEL____header_global_52a0e6629799db8a = ((((((602) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_80c1bd0b05e0d970e7605516() {
  return __cxx_static_address_80c1bd0b05e0d970e7605516.reference || (__cxx_static_address_80c1bd0b05e0d970e7605516.reference = {
    __cReference: true,
    get value() { return SOLARPANNEL____header_global_52a0e6629799db8a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:345
export const NAKED1____header_global_054a8e3b98d81b25 = ((((((603) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_801d2aa0f2d235e71062d7ae() {
  return __cxx_static_address_801d2aa0f2d235e71062d7ae.reference || (__cxx_static_address_801d2aa0f2d235e71062d7ae.reference = {
    __cReference: true,
    get value() { return NAKED1____header_global_054a8e3b98d81b25; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:346
export const ANTENNA____header_global_a65c251291cd9802 = ((((((607) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f621e8cd545338cd15e55a29() {
  return __cxx_static_address_f621e8cd545338cd15e55a29.reference || (__cxx_static_address_f621e8cd545338cd15e55a29.reference = {
    __cReference: true,
    get value() { return ANTENNA____header_global_a65c251291cd9802; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:347
export const MASKWALL12____header_global_9ec241a3f3ab7b62 = ((((((609) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c3c292d25229f071e9ba03ae() {
  return __cxx_static_address_c3c292d25229f071e9ba03ae.reference || (__cxx_static_address_c3c292d25229f071e9ba03ae.reference = {
    __cReference: true,
    get value() { return MASKWALL12____header_global_9ec241a3f3ab7b62; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:348
export const TOILETBROKE____header_global_2ca0ae2b711daa57 = ((((((615) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fec07bdf17f1a0d9f8b25b57() {
  return __cxx_static_address_fec07bdf17f1a0d9f8b25b57.reference || (__cxx_static_address_fec07bdf17f1a0d9f8b25b57.reference = {
    __cReference: true,
    get value() { return TOILETBROKE____header_global_2ca0ae2b711daa57; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:349
export const PIPE2____header_global_989613a3868503aa = ((((((616) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_29f922da26c83e19b20b20ab() {
  return __cxx_static_address_29f922da26c83e19b20b20ab.reference || (__cxx_static_address_29f922da26c83e19b20b20ab.reference = {
    __cReference: true,
    get value() { return PIPE2____header_global_989613a3868503aa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:350
export const PIPE1B____header_global_24a4d9d79f9564fe = ((((((617) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a300683837c27e3792edf091() {
  return __cxx_static_address_a300683837c27e3792edf091.reference || (__cxx_static_address_a300683837c27e3792edf091.reference = {
    __cReference: true,
    get value() { return PIPE1B____header_global_24a4d9d79f9564fe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:351
export const PIPE3____header_global_8f6177aa9778a29a = ((((((618) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e700ef0d8f75018d05319808() {
  return __cxx_static_address_e700ef0d8f75018d05319808.reference || (__cxx_static_address_e700ef0d8f75018d05319808.reference = {
    __cReference: true,
    get value() { return PIPE3____header_global_8f6177aa9778a29a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:352
export const PIPE1____header_global_c3140c3804e38c71 = ((((((619) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eb802e0e44ec8460f359866d() {
  return __cxx_static_address_eb802e0e44ec8460f359866d.reference || (__cxx_static_address_eb802e0e44ec8460f359866d.reference = {
    __cReference: true,
    get value() { return PIPE1____header_global_c3140c3804e38c71; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:353
export const CAMERA1____header_global_249b1f67ad6b29e3 = ((((((621) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b6de23c9245f1a410b118182() {
  return __cxx_static_address_b6de23c9245f1a410b118182.reference || (__cxx_static_address_b6de23c9245f1a410b118182.reference = {
    __cReference: true,
    get value() { return CAMERA1____header_global_249b1f67ad6b29e3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:354
export const PIPE2B____header_global_5d3912df06f66dab = ((((((633) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1a914362c88f3eaca9f870c0() {
  return __cxx_static_address_1a914362c88f3eaca9f870c0.reference || (__cxx_static_address_1a914362c88f3eaca9f870c0.reference = {
    __cReference: true,
    get value() { return PIPE2B____header_global_5d3912df06f66dab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:355
export const BOLT1____header_global_26e1662427d15b76 = ((((((634) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2088ae45ec1de53952a01223() {
  return __cxx_static_address_2088ae45ec1de53952a01223.reference || (__cxx_static_address_2088ae45ec1de53952a01223.reference = {
    __cReference: true,
    get value() { return BOLT1____header_global_26e1662427d15b76; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:356
export const W_NUMBERS____header_global_bda7bdee94faa1f9 = ((((((640) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1ec464fdabd458de13560e36() {
  return __cxx_static_address_1ec464fdabd458de13560e36.reference || (__cxx_static_address_1ec464fdabd458de13560e36.reference = {
    __cReference: true,
    get value() { return W_NUMBERS____header_global_bda7bdee94faa1f9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:357
export const WATERDRIP____header_global_f56f1defd165f7ac = ((((((660) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_33dea2b9c0ae45947d95f37e() {
  return __cxx_static_address_33dea2b9c0ae45947d95f37e.reference || (__cxx_static_address_33dea2b9c0ae45947d95f37e.reference = {
    __cReference: true,
    get value() { return WATERDRIP____header_global_f56f1defd165f7ac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:358
export const WATERBUBBLE____header_global_1f583fe89716fb8f = ((((((661) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e22ee58124c1038117cd76b8() {
  return __cxx_static_address_e22ee58124c1038117cd76b8.reference || (__cxx_static_address_e22ee58124c1038117cd76b8.reference = {
    __cReference: true,
    get value() { return WATERBUBBLE____header_global_1f583fe89716fb8f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:359
export const WATERBUBBLEMAKER____header_global_98c3abce1ffb5075 = ((((((662) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5cda4818e6818a172b1b5b6e() {
  return __cxx_static_address_5cda4818e6818a172b1b5b6e.reference || (__cxx_static_address_5cda4818e6818a172b1b5b6e.reference = {
    __cReference: true,
    get value() { return WATERBUBBLEMAKER____header_global_98c3abce1ffb5075; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:360
export const W_FORCEFIELD____header_global_def8b202271e10e5 = ((((((663) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8acfb645d6459bd98dcdf0ed() {
  return __cxx_static_address_8acfb645d6459bd98dcdf0ed.reference || (__cxx_static_address_8acfb645d6459bd98dcdf0ed.reference = {
    __cReference: true,
    get value() { return W_FORCEFIELD____header_global_def8b202271e10e5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:361
export const VACUUM____header_global_a57ca7d72fc428dd = ((((((669) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d73aff4ba330c5c366318233() {
  return __cxx_static_address_d73aff4ba330c5c366318233.reference || (__cxx_static_address_d73aff4ba330c5c366318233.reference = {
    __cReference: true,
    get value() { return VACUUM____header_global_a57ca7d72fc428dd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:362
export const FOOTPRINTS2____header_global_fa220926d5960095 = ((((((672) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bcfcefb7d5a1af733800bc7f() {
  return __cxx_static_address_bcfcefb7d5a1af733800bc7f.reference || (__cxx_static_address_bcfcefb7d5a1af733800bc7f.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS2____header_global_fa220926d5960095; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:363
export const FOOTPRINTS3____header_global_5a7076ee23dbaca0 = ((((((673) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5a6f2da95bcdf8041bddec8e() {
  return __cxx_static_address_5a6f2da95bcdf8041bddec8e.reference || (__cxx_static_address_5a6f2da95bcdf8041bddec8e.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS3____header_global_5a7076ee23dbaca0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:364
export const FOOTPRINTS4____header_global_458bd8e34fb83346 = ((((((674) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2f3e196b623dbb222872f98e() {
  return __cxx_static_address_2f3e196b623dbb222872f98e.reference || (__cxx_static_address_2f3e196b623dbb222872f98e.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS4____header_global_458bd8e34fb83346; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:365
export const EGG____header_global_e447e4b8433a8f10 = ((((((675) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bc46d712e06ae5d6fe2277c9() {
  return __cxx_static_address_bc46d712e06ae5d6fe2277c9.reference || (__cxx_static_address_bc46d712e06ae5d6fe2277c9.reference = {
    __cReference: true,
    get value() { return EGG____header_global_e447e4b8433a8f10; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:366
export const SCALE____header_global_7e22639683e3c490 = ((((((678) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c0736d5c74aff46dc19272fb() {
  return __cxx_static_address_c0736d5c74aff46dc19272fb.reference || (__cxx_static_address_c0736d5c74aff46dc19272fb.reference = {
    __cReference: true,
    get value() { return SCALE____header_global_7e22639683e3c490; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:367
export const CHAIR3____header_global_b54feed1df57a572 = ((((((680) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ce169d4844aeaf078c003e41() {
  return __cxx_static_address_ce169d4844aeaf078c003e41.reference || (__cxx_static_address_ce169d4844aeaf078c003e41.reference = {
    __cReference: true,
    get value() { return CHAIR3____header_global_b54feed1df57a572; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:368
export const CAMERALIGHT____header_global_012f4f0824cb373c = ((((((685) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8f11f2a00874d0ebb5fee506() {
  return __cxx_static_address_8f11f2a00874d0ebb5fee506.reference || (__cxx_static_address_8f11f2a00874d0ebb5fee506.reference = {
    __cReference: true,
    get value() { return CAMERALIGHT____header_global_012f4f0824cb373c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:369
export const MOVIECAMERA____header_global_afbcf095e26c2e17 = ((((((686) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e4bd254cc424126190abc1b6() {
  return __cxx_static_address_e4bd254cc424126190abc1b6.reference || (__cxx_static_address_e4bd254cc424126190abc1b6.reference = {
    __cReference: true,
    get value() { return MOVIECAMERA____header_global_afbcf095e26c2e17; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:370
export const IVUNIT____header_global_b6c033c35bff0b80 = ((((((689) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_34289ab85c941b389c5634d7() {
  return __cxx_static_address_34289ab85c941b389c5634d7.reference || (__cxx_static_address_34289ab85c941b389c5634d7.reference = {
    __cReference: true,
    get value() { return IVUNIT____header_global_b6c033c35bff0b80; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:371
export const POT1____header_global_15bcd4114fb3bd19 = ((((((694) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ce871398c82630912e37f4dc() {
  return __cxx_static_address_ce871398c82630912e37f4dc.reference || (__cxx_static_address_ce871398c82630912e37f4dc.reference = {
    __cReference: true,
    get value() { return POT1____header_global_15bcd4114fb3bd19; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:372
export const POT2____header_global_4a070cddfc056b74 = ((((((695) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5844b5361794852ffdccace0() {
  return __cxx_static_address_5844b5361794852ffdccace0.reference || (__cxx_static_address_5844b5361794852ffdccace0.reference = {
    __cReference: true,
    get value() { return POT2____header_global_4a070cddfc056b74; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:373
export const POT3____header_global_bda1659856b8817e = ((((((697) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5e6d51323573358fd02d8df8() {
  return __cxx_static_address_5e6d51323573358fd02d8df8.reference || (__cxx_static_address_5e6d51323573358fd02d8df8.reference = {
    __cReference: true,
    get value() { return POT3____header_global_bda1659856b8817e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:374
export const PIPE3B____header_global_39d71c2ae32b518b = ((((((700) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6b8fd8d1b8555f0da714f12b() {
  return __cxx_static_address_6b8fd8d1b8555f0da714f12b.reference || (__cxx_static_address_6b8fd8d1b8555f0da714f12b.reference = {
    __cReference: true,
    get value() { return PIPE3B____header_global_39d71c2ae32b518b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:375
export const WALLLIGHT3____header_global_209304749616fd99 = ((((((701) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1095cf10757e6e4865a3240f() {
  return __cxx_static_address_1095cf10757e6e4865a3240f.reference || (__cxx_static_address_1095cf10757e6e4865a3240f.reference = {
    __cReference: true,
    get value() { return WALLLIGHT3____header_global_209304749616fd99; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:376
export const WALLLIGHTBUST3____header_global_9aa670081e895468 = ((((((702) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4b2fe73cab0cd6065855cbc3() {
  return __cxx_static_address_4b2fe73cab0cd6065855cbc3.reference || (__cxx_static_address_4b2fe73cab0cd6065855cbc3.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST3____header_global_9aa670081e895468; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:377
export const WALLLIGHT1____header_global_e2175236542eb2c8 = ((((((703) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5bdef83fb6fa03b4580298e9() {
  return __cxx_static_address_5bdef83fb6fa03b4580298e9.reference || (__cxx_static_address_5bdef83fb6fa03b4580298e9.reference = {
    __cReference: true,
    get value() { return WALLLIGHT1____header_global_e2175236542eb2c8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:378
export const WALLLIGHTBUST1____header_global_909a721505c0bb09 = ((((((704) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2ce73592eacfcb105a14420d() {
  return __cxx_static_address_2ce73592eacfcb105a14420d.reference || (__cxx_static_address_2ce73592eacfcb105a14420d.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST1____header_global_909a721505c0bb09; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:379
export const WALLLIGHT2____header_global_001504038024f737 = ((((((705) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8ca6e6922c0aaca42b495670() {
  return __cxx_static_address_8ca6e6922c0aaca42b495670.reference || (__cxx_static_address_8ca6e6922c0aaca42b495670.reference = {
    __cReference: true,
    get value() { return WALLLIGHT2____header_global_001504038024f737; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:380
export const WALLLIGHTBUST2____header_global_69e11ab57c6989bf = ((((((706) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dfc5ad2fe290e9e847915825() {
  return __cxx_static_address_dfc5ad2fe290e9e847915825.reference || (__cxx_static_address_dfc5ad2fe290e9e847915825.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST2____header_global_69e11ab57c6989bf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:381
export const LIGHTSWITCH2____header_global_1bac84b55c788d05 = ((((((712) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_748d482720297054b0933cb4() {
  return __cxx_static_address_748d482720297054b0933cb4.reference || (__cxx_static_address_748d482720297054b0933cb4.reference = {
    __cReference: true,
    get value() { return LIGHTSWITCH2____header_global_1bac84b55c788d05; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:382
export const WAITTOBESEATED____header_global_02d076df56af31bf = ((((((716) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e3ad27be184fdce5e849eb14() {
  return __cxx_static_address_e3ad27be184fdce5e849eb14.reference || (__cxx_static_address_e3ad27be184fdce5e849eb14.reference = {
    __cReference: true,
    get value() { return WAITTOBESEATED____header_global_02d076df56af31bf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:383
export const DOORTILE14____header_global_b5e01b8d81245747 = ((((((717) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5e110b0e726649903ae93173() {
  return __cxx_static_address_5e110b0e726649903ae93173.reference || (__cxx_static_address_5e110b0e726649903ae93173.reference = {
    __cReference: true,
    get value() { return DOORTILE14____header_global_b5e01b8d81245747; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:384
export const STATUE____header_global_312fce15d00167df = ((((((753) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_168a961a30209fde49968669() {
  return __cxx_static_address_168a961a30209fde49968669.reference || (__cxx_static_address_168a961a30209fde49968669.reference = {
    __cReference: true,
    get value() { return STATUE____header_global_312fce15d00167df; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:385
export const MIKE____header_global_67995fddcc4ef55d = ((((((762) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ab6ea10a81a4de79ac8bf41f() {
  return __cxx_static_address_ab6ea10a81a4de79ac8bf41f.reference || (__cxx_static_address_ab6ea10a81a4de79ac8bf41f.reference = {
    __cReference: true,
    get value() { return MIKE____header_global_67995fddcc4ef55d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:386
export const VASE____header_global_29e3541a0dba9c67 = ((((((765) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f45273d76f5eb7282a6d0347() {
  return __cxx_static_address_f45273d76f5eb7282a6d0347.reference || (__cxx_static_address_f45273d76f5eb7282a6d0347.reference = {
    __cReference: true,
    get value() { return VASE____header_global_29e3541a0dba9c67; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:387
export const SUSHIPLATE1____header_global_ecfc485fa278aa6b = ((((((768) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b9e66b83bfa658dcd25a3046() {
  return __cxx_static_address_b9e66b83bfa658dcd25a3046.reference || (__cxx_static_address_b9e66b83bfa658dcd25a3046.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE1____header_global_ecfc485fa278aa6b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:388
export const SUSHIPLATE2____header_global_f36b84291049ce8b = ((((((769) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6a9699cad03bfadc4cbfc7f9() {
  return __cxx_static_address_6a9699cad03bfadc4cbfc7f9.reference || (__cxx_static_address_6a9699cad03bfadc4cbfc7f9.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE2____header_global_f36b84291049ce8b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:389
export const SUSHIPLATE3____header_global_b7be4c585b82502f = ((((((774) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2e3ce8f9a13cb472514448bd() {
  return __cxx_static_address_2e3ce8f9a13cb472514448bd.reference || (__cxx_static_address_2e3ce8f9a13cb472514448bd.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE3____header_global_b7be4c585b82502f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:390
export const SUSHIPLATE4____header_global_96d4506968a487ef = ((((((779) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5bfc8222cdbf29ba8145a022() {
  return __cxx_static_address_5bfc8222cdbf29ba8145a022.reference || (__cxx_static_address_5bfc8222cdbf29ba8145a022.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE4____header_global_96d4506968a487ef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:391
export const DOORTILE16____header_global_541d9e57a39218c3 = ((((((781) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_860e63f0db6141c218e8d52d() {
  return __cxx_static_address_860e63f0db6141c218e8d52d.reference || (__cxx_static_address_860e63f0db6141c218e8d52d.reference = {
    __cReference: true,
    get value() { return DOORTILE16____header_global_541d9e57a39218c3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:392
export const SUSHIPLATE5____header_global_ac413ed25dc12004 = ((((((792) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_69b14056436ee9abeb10a33f() {
  return __cxx_static_address_69b14056436ee9abeb10a33f.reference || (__cxx_static_address_69b14056436ee9abeb10a33f.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE5____header_global_ac413ed25dc12004; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:393
export const OJ____header_global_60c104680f3b8b1c = ((((((806) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_422e28ac2db5e8d86290d3fc() {
  return __cxx_static_address_422e28ac2db5e8d86290d3fc.reference || (__cxx_static_address_422e28ac2db5e8d86290d3fc.reference = {
    __cReference: true,
    get value() { return OJ____header_global_60c104680f3b8b1c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:394
export const MASKWALL13____header_global_9640b97a51f7c9e1 = ((((((830) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9dfe92f26c4a201449dd5cae() {
  return __cxx_static_address_9dfe92f26c4a201449dd5cae.reference || (__cxx_static_address_9dfe92f26c4a201449dd5cae.reference = {
    __cReference: true,
    get value() { return MASKWALL13____header_global_9640b97a51f7c9e1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:395
export const HURTRAIL____header_global_96357d4db4108361 = ((((((859) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_25a8165064fbb75cb42cb468() {
  return __cxx_static_address_25a8165064fbb75cb42cb468.reference || (__cxx_static_address_25a8165064fbb75cb42cb468.reference = {
    __cReference: true,
    get value() { return HURTRAIL____header_global_96357d4db4108361; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:396
export const POWERSWITCH1____header_global_69959e6b03e6ce9c = ((((((860) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bc67ef695b391be6396a1b76() {
  return __cxx_static_address_bc67ef695b391be6396a1b76.reference || (__cxx_static_address_bc67ef695b391be6396a1b76.reference = {
    __cReference: true,
    get value() { return POWERSWITCH1____header_global_69959e6b03e6ce9c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:397
export const LOCKSWITCH1____header_global_199ba94b5ee4fd70 = ((((((862) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_796a1f5f4c95d83a9da6abf5() {
  return __cxx_static_address_796a1f5f4c95d83a9da6abf5.reference || (__cxx_static_address_796a1f5f4c95d83a9da6abf5.reference = {
    __cReference: true,
    get value() { return LOCKSWITCH1____header_global_199ba94b5ee4fd70; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:398
export const POWERSWITCH2____header_global_ac638be366adc811 = ((((((864) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dfb20aab2b7c1f8be372388a() {
  return __cxx_static_address_dfb20aab2b7c1f8be372388a.reference || (__cxx_static_address_dfb20aab2b7c1f8be372388a.reference = {
    __cReference: true,
    get value() { return POWERSWITCH2____header_global_ac638be366adc811; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:399
export const ATM____header_global_75c50da246985c15 = ((((((867) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_67d6083c2e4a5a1345fa2cf2() {
  return __cxx_static_address_67d6083c2e4a5a1345fa2cf2.reference || (__cxx_static_address_67d6083c2e4a5a1345fa2cf2.reference = {
    __cReference: true,
    get value() { return ATM____header_global_75c50da246985c15; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:400
export const STATUEFLASH____header_global_706156a4a630cc00 = ((((((869) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_505901cf7bf9e8fcae504e6a() {
  return __cxx_static_address_505901cf7bf9e8fcae504e6a.reference || (__cxx_static_address_505901cf7bf9e8fcae504e6a.reference = {
    __cReference: true,
    get value() { return STATUEFLASH____header_global_706156a4a630cc00; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:401
export const ATMBROKE____header_global_d66f830ada528884 = ((((((888) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4ba2a35a0cd6e842e736c396() {
  return __cxx_static_address_4ba2a35a0cd6e842e736c396.reference || (__cxx_static_address_4ba2a35a0cd6e842e736c396.reference = {
    __cReference: true,
    get value() { return ATMBROKE____header_global_d66f830ada528884; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:402
export const STRIPEBALL____header_global_907e465b2e31e32c = ((((((901) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0ef46640eaf7f9b7d2747cf3() {
  return __cxx_static_address_0ef46640eaf7f9b7d2747cf3.reference || (__cxx_static_address_0ef46640eaf7f9b7d2747cf3.reference = {
    __cReference: true,
    get value() { return STRIPEBALL____header_global_907e465b2e31e32c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:403
export const QUEBALL____header_global_068aa1d848dc7d14 = ((((((902) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b057d34d22013ededd1d5f13() {
  return __cxx_static_address_b057d34d22013ededd1d5f13.reference || (__cxx_static_address_b057d34d22013ededd1d5f13.reference = {
    __cReference: true,
    get value() { return QUEBALL____header_global_068aa1d848dc7d14; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:404
export const POCKET____header_global_b85070d519167887 = ((((((903) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7e475f759ac935e533fdda13() {
  return __cxx_static_address_7e475f759ac935e533fdda13.reference || (__cxx_static_address_7e475f759ac935e533fdda13.reference = {
    __cReference: true,
    get value() { return POCKET____header_global_b85070d519167887; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:405
export const WOODENHORSE____header_global_38f6d71be74d0a0f = ((((((904) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_70be6bc90223f0ff7dd8997e() {
  return __cxx_static_address_70be6bc90223f0ff7dd8997e.reference || (__cxx_static_address_70be6bc90223f0ff7dd8997e.reference = {
    __cReference: true,
    get value() { return WOODENHORSE____header_global_38f6d71be74d0a0f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:406
export const TREE1____header_global_05beab69721617d7 = ((((((908) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_030890a94cde4cca0cd56477() {
  return __cxx_static_address_030890a94cde4cca0cd56477.reference || (__cxx_static_address_030890a94cde4cca0cd56477.reference = {
    __cReference: true,
    get value() { return TREE1____header_global_05beab69721617d7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:407
export const TREE2____header_global_fd5bbc9bbb2f329b = ((((((910) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1d957555a9fe65cba658a557() {
  return __cxx_static_address_1d957555a9fe65cba658a557.reference || (__cxx_static_address_1d957555a9fe65cba658a557.reference = {
    __cReference: true,
    get value() { return TREE2____header_global_fd5bbc9bbb2f329b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:408
export const CACTUS____header_global_545490b60567ca8f = ((((((911) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a9f5fbbaa6548b5c2c884c0b() {
  return __cxx_static_address_a9f5fbbaa6548b5c2c884c0b.reference || (__cxx_static_address_a9f5fbbaa6548b5c2c884c0b.reference = {
    __cReference: true,
    get value() { return CACTUS____header_global_545490b60567ca8f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:409
export const MASKWALL2____header_global_a0df70bd54e2ac26 = ((((((913) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c00b40190886f5b14d131470() {
  return __cxx_static_address_c00b40190886f5b14d131470.reference || (__cxx_static_address_c00b40190886f5b14d131470.reference = {
    __cReference: true,
    get value() { return MASKWALL2____header_global_a0df70bd54e2ac26; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:410
export const MASKWALL3____header_global_98a606ecdc37d21d = ((((((914) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e7c3f6e6353cec894dd6e7bd() {
  return __cxx_static_address_e7c3f6e6353cec894dd6e7bd.reference || (__cxx_static_address_e7c3f6e6353cec894dd6e7bd.reference = {
    __cReference: true,
    get value() { return MASKWALL3____header_global_98a606ecdc37d21d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:411
export const MASKWALL4____header_global_372b0c0e07040609 = ((((((915) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a294d5387821439acd5cd42e() {
  return __cxx_static_address_a294d5387821439acd5cd42e.reference || (__cxx_static_address_a294d5387821439acd5cd42e.reference = {
    __cReference: true,
    get value() { return MASKWALL4____header_global_372b0c0e07040609; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:412
export const FIREEXT____header_global_7482c93fd75b854a = ((((((916) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_09b420b55a1a07d03a044f3a() {
  return __cxx_static_address_09b420b55a1a07d03a044f3a.reference || (__cxx_static_address_09b420b55a1a07d03a044f3a.reference = {
    __cReference: true,
    get value() { return FIREEXT____header_global_7482c93fd75b854a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:413
export const TOILETWATER____header_global_fb92591d13e41d95 = ((((((921) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d14d8befd174de44f7485ae6() {
  return __cxx_static_address_d14d8befd174de44f7485ae6.reference || (__cxx_static_address_d14d8befd174de44f7485ae6.reference = {
    __cReference: true,
    get value() { return TOILETWATER____header_global_fb92591d13e41d95; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:414
export const NEON1____header_global_d78dc806084aea0f = ((((((925) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ea6e92ddea058d9b735bb5e7() {
  return __cxx_static_address_ea6e92ddea058d9b735bb5e7.reference || (__cxx_static_address_ea6e92ddea058d9b735bb5e7.reference = {
    __cReference: true,
    get value() { return NEON1____header_global_d78dc806084aea0f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:415
export const NEON2____header_global_3933c032c40a35c1 = ((((((926) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aaa9f9e586a8a30d34dd5532() {
  return __cxx_static_address_aaa9f9e586a8a30d34dd5532.reference || (__cxx_static_address_aaa9f9e586a8a30d34dd5532.reference = {
    __cReference: true,
    get value() { return NEON2____header_global_3933c032c40a35c1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:416
export const CACTUSBROKE____header_global_26070e212c436754 = ((((((939) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8a8e6e3f997ab50e4d039057() {
  return __cxx_static_address_8a8e6e3f997ab50e4d039057.reference || (__cxx_static_address_8a8e6e3f997ab50e4d039057.reference = {
    __cReference: true,
    get value() { return CACTUSBROKE____header_global_26070e212c436754; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:417
export const BOUNCEMINE____header_global_167b1a0e6d1a1b03 = ((((((940) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7cd74d33b0f76d55b3947319() {
  return __cxx_static_address_7cd74d33b0f76d55b3947319.reference || (__cxx_static_address_7cd74d33b0f76d55b3947319.reference = {
    __cReference: true,
    get value() { return BOUNCEMINE____header_global_167b1a0e6d1a1b03; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:418
export const BROKEFIREHYDRENT____header_global_53962469e1addf18 = ((((((950) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_73565c242b0998ad2528c98b() {
  return __cxx_static_address_73565c242b0998ad2528c98b.reference || (__cxx_static_address_73565c242b0998ad2528c98b.reference = {
    __cReference: true,
    get value() { return BROKEFIREHYDRENT____header_global_53962469e1addf18; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:419
export const BOX____header_global_4b7e00cd2a4c4f94 = ((((((951) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ca7ab1b0a881815b1302c151() {
  return __cxx_static_address_ca7ab1b0a881815b1302c151.reference || (__cxx_static_address_ca7ab1b0a881815b1302c151.reference = {
    __cReference: true,
    get value() { return BOX____header_global_4b7e00cd2a4c4f94; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:420
export const BULLETHOLE____header_global_bba264bb19a60bd9 = ((((((952) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9e6202e7df9e7c971c004540() {
  return __cxx_static_address_9e6202e7df9e7c971c004540.reference || (__cxx_static_address_9e6202e7df9e7c971c004540.reference = {
    __cReference: true,
    get value() { return BULLETHOLE____header_global_bba264bb19a60bd9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:421
export const BOTTLE1____header_global_804e84aa0b087e29 = ((((((954) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8279ddebb25cabbbb1dd11ff() {
  return __cxx_static_address_8279ddebb25cabbbb1dd11ff.reference || (__cxx_static_address_8279ddebb25cabbbb1dd11ff.reference = {
    __cReference: true,
    get value() { return BOTTLE1____header_global_804e84aa0b087e29; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:422
export const BOTTLE2____header_global_d18fbc762c2572a4 = ((((((955) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_89d55254096402b89fb72558() {
  return __cxx_static_address_89d55254096402b89fb72558.reference || (__cxx_static_address_89d55254096402b89fb72558.reference = {
    __cReference: true,
    get value() { return BOTTLE2____header_global_d18fbc762c2572a4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:423
export const BOTTLE3____header_global_a4fa803525c5cc9d = ((((((956) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7fcbf891242be22e8e84d375() {
  return __cxx_static_address_7fcbf891242be22e8e84d375.reference || (__cxx_static_address_7fcbf891242be22e8e84d375.reference = {
    __cReference: true,
    get value() { return BOTTLE3____header_global_a4fa803525c5cc9d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:424
export const BOTTLE4____header_global_0b3c936d9cb494d8 = ((((((957) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a33e211881299d1b0aafc65c() {
  return __cxx_static_address_a33e211881299d1b0aafc65c.reference || (__cxx_static_address_a33e211881299d1b0aafc65c.reference = {
    __cReference: true,
    get value() { return BOTTLE4____header_global_0b3c936d9cb494d8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:425
export const FEMPIC5____header_global_5116b75f1788f6a2 = ((((((963) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_87ed209d7b0d72049894022a() {
  return __cxx_static_address_87ed209d7b0d72049894022a.reference || (__cxx_static_address_87ed209d7b0d72049894022a.reference = {
    __cReference: true,
    get value() { return FEMPIC5____header_global_5116b75f1788f6a2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:426
export const FEMPIC6____header_global_52d1b1a5bc54f3a6 = ((((((964) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4393cc7b822c9c4da555b623() {
  return __cxx_static_address_4393cc7b822c9c4da555b623.reference || (__cxx_static_address_4393cc7b822c9c4da555b623.reference = {
    __cReference: true,
    get value() { return FEMPIC6____header_global_52d1b1a5bc54f3a6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:427
export const FEMPIC7____header_global_4cf6e6f52fb1ec5d = ((((((965) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bd2ad2cadf069f4f1e361c06() {
  return __cxx_static_address_bd2ad2cadf069f4f1e361c06.reference || (__cxx_static_address_bd2ad2cadf069f4f1e361c06.reference = {
    __cReference: true,
    get value() { return FEMPIC7____header_global_4cf6e6f52fb1ec5d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:428
export const HYDROPLANT____header_global_566b80072264fd98 = ((((((969) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_16c844f3240294051498606e() {
  return __cxx_static_address_16c844f3240294051498606e.reference || (__cxx_static_address_16c844f3240294051498606e.reference = {
    __cReference: true,
    get value() { return HYDROPLANT____header_global_566b80072264fd98; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:429
export const OCEANSPRITE1____header_global_95074634b8a1032d = ((((((971) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ffe58a8425452def04cd212e() {
  return __cxx_static_address_ffe58a8425452def04cd212e.reference || (__cxx_static_address_ffe58a8425452def04cd212e.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE1____header_global_95074634b8a1032d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:430
export const OCEANSPRITE2____header_global_2c14de432ca07c95 = ((((((972) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7de31a7f43950ce4d996a9c5() {
  return __cxx_static_address_7de31a7f43950ce4d996a9c5.reference || (__cxx_static_address_7de31a7f43950ce4d996a9c5.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE2____header_global_2c14de432ca07c95; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:431
export const OCEANSPRITE3____header_global_702c2b85ccff2bb6 = ((((((973) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cbd74689480d7e6da854aa77() {
  return __cxx_static_address_cbd74689480d7e6da854aa77.reference || (__cxx_static_address_cbd74689480d7e6da854aa77.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE3____header_global_702c2b85ccff2bb6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:432
export const OCEANSPRITE4____header_global_983b91e9aa654d19 = ((((((974) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_192af78a6506b208506cb62a() {
  return __cxx_static_address_192af78a6506b208506cb62a.reference || (__cxx_static_address_192af78a6506b208506cb62a.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE4____header_global_983b91e9aa654d19; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:433
export const OCEANSPRITE5____header_global_7cac822f25321a98 = ((((((975) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8b4cb4b847d76643534b4e0f() {
  return __cxx_static_address_8b4cb4b847d76643534b4e0f.reference || (__cxx_static_address_8b4cb4b847d76643534b4e0f.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE5____header_global_7cac822f25321a98; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:434
export const GENERICPOLE____header_global_f4360c189bd1cece = ((((((977) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fde113c26362f69c40bf6e91() {
  return __cxx_static_address_fde113c26362f69c40bf6e91.reference || (__cxx_static_address_fde113c26362f69c40bf6e91.reference = {
    __cReference: true,
    get value() { return GENERICPOLE____header_global_f4360c189bd1cece; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:435
export const CONE____header_global_126a6f66846680c9 = ((((((978) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9416d5bcf6ac4f2b26bef93c() {
  return __cxx_static_address_9416d5bcf6ac4f2b26bef93c.reference || (__cxx_static_address_9416d5bcf6ac4f2b26bef93c.reference = {
    __cReference: true,
    get value() { return CONE____header_global_126a6f66846680c9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:436
export const HANGLIGHT____header_global_a95aad92c02f0135 = ((((((979) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_feb9a6777bc4bb82ccb02332() {
  return __cxx_static_address_feb9a6777bc4bb82ccb02332.reference || (__cxx_static_address_feb9a6777bc4bb82ccb02332.reference = {
    __cReference: true,
    get value() { return HANGLIGHT____header_global_a95aad92c02f0135; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:437
export const HYDRENT____header_global_6680d7d1c1629417 = ((((((981) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d50126a073eff1d67963b726() {
  return __cxx_static_address_d50126a073eff1d67963b726.reference || (__cxx_static_address_d50126a073eff1d67963b726.reference = {
    __cReference: true,
    get value() { return HYDRENT____header_global_6680d7d1c1629417; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:438
export const MASKWALL14____header_global_ad13c28493e88bf3 = ((((((988) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4aaf794a36b4b7bde6b3e254() {
  return __cxx_static_address_4aaf794a36b4b7bde6b3e254.reference || (__cxx_static_address_4aaf794a36b4b7bde6b3e254.reference = {
    __cReference: true,
    get value() { return MASKWALL14____header_global_ad13c28493e88bf3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:439
export const TIRE____header_global_88edd1bb33c9e24e = ((((((990) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_62e2fa8fd89dbf33b006cd17() {
  return __cxx_static_address_62e2fa8fd89dbf33b006cd17.reference || (__cxx_static_address_62e2fa8fd89dbf33b006cd17.reference = {
    __cReference: true,
    get value() { return TIRE____header_global_88edd1bb33c9e24e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:440
export const PIPE5____header_global_6fd0381c86879d18 = ((((((994) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7febaad8da60feda99011d76() {
  return __cxx_static_address_7febaad8da60feda99011d76.reference || (__cxx_static_address_7febaad8da60feda99011d76.reference = {
    __cReference: true,
    get value() { return PIPE5____header_global_6fd0381c86879d18; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:441
export const PIPE6____header_global_1f7970d206c274c0 = ((((((995) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8a4ff31036c8ba908f445f19() {
  return __cxx_static_address_8a4ff31036c8ba908f445f19.reference || (__cxx_static_address_8a4ff31036c8ba908f445f19.reference = {
    __cReference: true,
    get value() { return PIPE6____header_global_1f7970d206c274c0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:442
export const PIPE4____header_global_bb2d286c9966f672 = ((((((996) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_25bed295f6a06580baae5c44() {
  return __cxx_static_address_25bed295f6a06580baae5c44.reference || (__cxx_static_address_25bed295f6a06580baae5c44.reference = {
    __cReference: true,
    get value() { return PIPE4____header_global_bb2d286c9966f672; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:443
export const PIPE4B____header_global_50723f6e73089a21 = ((((((997) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_56ccb22ca68bf1add4f8d970() {
  return __cxx_static_address_56ccb22ca68bf1add4f8d970.reference || (__cxx_static_address_56ccb22ca68bf1add4f8d970.reference = {
    __cReference: true,
    get value() { return PIPE4B____header_global_50723f6e73089a21; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:444
export const BROKEHYDROPLANT____header_global_82181119a6b82200 = ((((((1003) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3322983fb196881c8b936dc6() {
  return __cxx_static_address_3322983fb196881c8b936dc6.reference || (__cxx_static_address_3322983fb196881c8b936dc6.reference = {
    __cReference: true,
    get value() { return BROKEHYDROPLANT____header_global_82181119a6b82200; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:445
export const PIPE5B____header_global_3d5a7e39c03dd7bb = ((((((1005) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1c43bc7317fc91185a1ffbd7() {
  return __cxx_static_address_1c43bc7317fc91185a1ffbd7.reference || (__cxx_static_address_1c43bc7317fc91185a1ffbd7.reference = {
    __cReference: true,
    get value() { return PIPE5B____header_global_3d5a7e39c03dd7bb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:446
export const NEON3____header_global_4d7e9ac1d7414252 = ((((((1007) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bf9eaa2901d9583e5a3f1c5f() {
  return __cxx_static_address_bf9eaa2901d9583e5a3f1c5f.reference || (__cxx_static_address_bf9eaa2901d9583e5a3f1c5f.reference = {
    __cReference: true,
    get value() { return NEON3____header_global_4d7e9ac1d7414252; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:447
export const NEON4____header_global_015c49d21e3d81d4 = ((((((1008) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fe59fc1c1cbac0bb1eb9bea4() {
  return __cxx_static_address_fe59fc1c1cbac0bb1eb9bea4.reference || (__cxx_static_address_fe59fc1c1cbac0bb1eb9bea4.reference = {
    __cReference: true,
    get value() { return NEON4____header_global_015c49d21e3d81d4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:448
export const NEON5____header_global_4d5fb416ad794d11 = ((((((1009) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_325ea4dbf9b478796db8d5d3() {
  return __cxx_static_address_325ea4dbf9b478796db8d5d3.reference || (__cxx_static_address_325ea4dbf9b478796db8d5d3.reference = {
    __cReference: true,
    get value() { return NEON5____header_global_4d5fb416ad794d11; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:449
export const BOTTLE5____header_global_98bb301ad27a4831 = ((((((1012) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8173709a62492f3f41b6269f() {
  return __cxx_static_address_8173709a62492f3f41b6269f.reference || (__cxx_static_address_8173709a62492f3f41b6269f.reference = {
    __cReference: true,
    get value() { return BOTTLE5____header_global_98bb301ad27a4831; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:450
export const BOTTLE6____header_global_25a725c62f07b050 = ((((((1013) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a0d989dd58a9e1d47dbaa19b() {
  return __cxx_static_address_a0d989dd58a9e1d47dbaa19b.reference || (__cxx_static_address_a0d989dd58a9e1d47dbaa19b.reference = {
    __cReference: true,
    get value() { return BOTTLE6____header_global_25a725c62f07b050; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:451
export const BOTTLE8____header_global_6a2e8a492813d985 = ((((((1014) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_009b3dffb42ac6e496ebc922() {
  return __cxx_static_address_009b3dffb42ac6e496ebc922.reference || (__cxx_static_address_009b3dffb42ac6e496ebc922.reference = {
    __cReference: true,
    get value() { return BOTTLE8____header_global_6a2e8a492813d985; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:452
export const SPOTLITE____header_global_e141f173a4fe6fe3 = ((((((1020) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0291f593eded17814c68706b() {
  return __cxx_static_address_0291f593eded17814c68706b.reference || (__cxx_static_address_0291f593eded17814c68706b.reference = {
    __cReference: true,
    get value() { return SPOTLITE____header_global_e141f173a4fe6fe3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:453
export const MASKWALL15____header_global_db05b2770469ad7b = ((((((1024) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2ffb931f4c69979bb7465a6e() {
  return __cxx_static_address_2ffb931f4c69979bb7465a6e.reference || (__cxx_static_address_2ffb931f4c69979bb7465a6e.reference = {
    __cReference: true,
    get value() { return MASKWALL15____header_global_db05b2770469ad7b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:454
export const BOTTLE7____header_global_ad67e762c74e4a3d = ((((((1025) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_554ebb78f737abe7c724f940() {
  return __cxx_static_address_554ebb78f737abe7c724f940.reference || (__cxx_static_address_554ebb78f737abe7c724f940.reference = {
    __cReference: true,
    get value() { return BOTTLE7____header_global_ad67e762c74e4a3d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:455
export const HORSEONSIDE____header_global_2cd003223a18004f = ((((((1026) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_87b46502bf2f7ba8489c8725() {
  return __cxx_static_address_87b46502bf2f7ba8489c8725.reference || (__cxx_static_address_87b46502bf2f7ba8489c8725.reference = {
    __cReference: true,
    get value() { return HORSEONSIDE____header_global_2cd003223a18004f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:456
export const GLASSPIECES____header_global_e869ca56b9b0cbb5 = ((((((1031) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1194de16a8ee2c46ab35c458() {
  return __cxx_static_address_1194de16a8ee2c46ab35c458.reference || (__cxx_static_address_1194de16a8ee2c46ab35c458.reference = {
    __cReference: true,
    get value() { return GLASSPIECES____header_global_e869ca56b9b0cbb5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:457
export const NEON6____header_global_88668c6f7509285e = ((((((1046) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e89867089ec7192fefd45f4d() {
  return __cxx_static_address_e89867089ec7192fefd45f4d.reference || (__cxx_static_address_e89867089ec7192fefd45f4d.reference = {
    __cReference: true,
    get value() { return NEON6____header_global_88668c6f7509285e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:458
export const MASKWALL6____header_global_fc8970d1fed2539e = ((((((1059) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2e1fb059643d9829b7eb7202() {
  return __cxx_static_address_2e1fb059643d9829b7eb7202.reference || (__cxx_static_address_2e1fb059643d9829b7eb7202.reference = {
    __cReference: true,
    get value() { return MASKWALL6____header_global_fc8970d1fed2539e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:459
export const RUBBERCAN____header_global_66e3d01bf0c2336e = ((((((1062) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3c7df19e6845071d924eaa27() {
  return __cxx_static_address_3c7df19e6845071d924eaa27.reference || (__cxx_static_address_3c7df19e6845071d924eaa27.reference = {
    __cReference: true,
    get value() { return RUBBERCAN____header_global_66e3d01bf0c2336e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:460
export const PLUG____header_global_596d61df079fbd43 = ((((((1069) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_79ad6ec9f939b55251a9c2f6() {
  return __cxx_static_address_79ad6ec9f939b55251a9c2f6.reference || (__cxx_static_address_79ad6ec9f939b55251a9c2f6.reference = {
    __cReference: true,
    get value() { return PLUG____header_global_596d61df079fbd43; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:461
export const OOZFILTER____header_global_761bc7bf44931eae = ((((((1079) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_255da0c9cce0b23ea94f92e9() {
  return __cxx_static_address_255da0c9cce0b23ea94f92e9.reference || (__cxx_static_address_255da0c9cce0b23ea94f92e9.reference = {
    __cReference: true,
    get value() { return OOZFILTER____header_global_761bc7bf44931eae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:462
export const FLOORPLASMA____header_global_9fc74c13997cc2d0 = ((((((1082) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_57d131d1086fa12f83b9611d() {
  return __cxx_static_address_57d131d1086fa12f83b9611d.reference || (__cxx_static_address_57d131d1086fa12f83b9611d.reference = {
    __cReference: true,
    get value() { return FLOORPLASMA____header_global_9fc74c13997cc2d0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:463
export const REACTOR____header_global_cc82b2f733c17808 = ((((((1088) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1977a2763db54f2df3cc03ae() {
  return __cxx_static_address_1977a2763db54f2df3cc03ae.reference || (__cxx_static_address_1977a2763db54f2df3cc03ae.reference = {
    __cReference: true,
    get value() { return REACTOR____header_global_cc82b2f733c17808; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:464
export const REACTORSPARK____header_global_121b64000b2882d3 = ((((((1092) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_655ad43f1153046daae0324f() {
  return __cxx_static_address_655ad43f1153046daae0324f.reference || (__cxx_static_address_655ad43f1153046daae0324f.reference = {
    __cReference: true,
    get value() { return REACTORSPARK____header_global_121b64000b2882d3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:465
export const REACTORBURNT____header_global_f28f366f8b88290e = ((((((1096) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d120d9610c02800170cb9ae7() {
  return __cxx_static_address_d120d9610c02800170cb9ae7.reference || (__cxx_static_address_d120d9610c02800170cb9ae7.reference = {
    __cReference: true,
    get value() { return REACTORBURNT____header_global_f28f366f8b88290e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:466
export const DOORTILE15____header_global_a2ffc44ce81ca76b = ((((((1102) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e6b5f111a203b8b31160187c() {
  return __cxx_static_address_e6b5f111a203b8b31160187c.reference || (__cxx_static_address_e6b5f111a203b8b31160187c.reference = {
    __cReference: true,
    get value() { return DOORTILE15____header_global_a2ffc44ce81ca76b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:467
export const HANDSWITCH____header_global_235c59049deb1989 = ((((((1111) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8345becc753a7a4837017da8() {
  return __cxx_static_address_8345becc753a7a4837017da8.reference || (__cxx_static_address_8345becc753a7a4837017da8.reference = {
    __cReference: true,
    get value() { return HANDSWITCH____header_global_235c59049deb1989; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:468
export const CIRCLEPANNEL____header_global_4b25df18e9b5f8f7 = ((((((1113) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3261b6a2a9e8ac63fa86e9d0() {
  return __cxx_static_address_3261b6a2a9e8ac63fa86e9d0.reference || (__cxx_static_address_3261b6a2a9e8ac63fa86e9d0.reference = {
    __cReference: true,
    get value() { return CIRCLEPANNEL____header_global_4b25df18e9b5f8f7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:469
export const CIRCLEPANNELBROKE____header_global_d4e66e5297bc163c = ((((((1114) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4311a341786c763b0dae7506() {
  return __cxx_static_address_4311a341786c763b0dae7506.reference || (__cxx_static_address_4311a341786c763b0dae7506.reference = {
    __cReference: true,
    get value() { return CIRCLEPANNELBROKE____header_global_d4e66e5297bc163c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:470
export const PULLSWITCH____header_global_6389dcc49270911a = ((((((1122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_af106bd39741f96c6f352499() {
  return __cxx_static_address_af106bd39741f96c6f352499.reference || (__cxx_static_address_af106bd39741f96c6f352499.reference = {
    __cReference: true,
    get value() { return PULLSWITCH____header_global_6389dcc49270911a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:471
export const MASKWALL8____header_global_a28230342cb41cda = ((((((1124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_00e7457e467b4d0e655ff34d() {
  return __cxx_static_address_00e7457e467b4d0e655ff34d.reference || (__cxx_static_address_00e7457e467b4d0e655ff34d.reference = {
    __cReference: true,
    get value() { return MASKWALL8____header_global_a28230342cb41cda; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:472
export const BIGHOLE____header_global_b7ee586d3b62f635 = ((((((1141) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9a691061a0e319b927a45cb9() {
  return __cxx_static_address_9a691061a0e319b927a45cb9.reference || (__cxx_static_address_9a691061a0e319b927a45cb9.reference = {
    __cReference: true,
    get value() { return BIGHOLE____header_global_b7ee586d3b62f635; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:473
export const ALIENSWITCH____header_global_21d3f68a92fe9c51 = ((((((1142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0faedf3fd0a0616923148030() {
  return __cxx_static_address_0faedf3fd0a0616923148030.reference || (__cxx_static_address_0faedf3fd0a0616923148030.reference = {
    __cReference: true,
    get value() { return ALIENSWITCH____header_global_21d3f68a92fe9c51; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:474
export const DOORTILE21____header_global_78c5ff05db8fa765 = ((((((1144) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f8299a064cb26a94bcffa8ff() {
  return __cxx_static_address_f8299a064cb26a94bcffa8ff.reference || (__cxx_static_address_f8299a064cb26a94bcffa8ff.reference = {
    __cReference: true,
    get value() { return DOORTILE21____header_global_78c5ff05db8fa765; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:475
export const HANDPRINTSWITCH____header_global_6fc11927d4c0d15f = ((((((1155) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2196656c952079ad50a4c691() {
  return __cxx_static_address_2196656c952079ad50a4c691.reference || (__cxx_static_address_2196656c952079ad50a4c691.reference = {
    __cReference: true,
    get value() { return HANDPRINTSWITCH____header_global_6fc11927d4c0d15f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:476
export const BOTTLE10____header_global_ae0d5be50ba92fb0 = ((((((1157) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4516ed490a53df72e0c045c3() {
  return __cxx_static_address_4516ed490a53df72e0c045c3.reference || (__cxx_static_address_4516ed490a53df72e0c045c3.reference = {
    __cReference: true,
    get value() { return BOTTLE10____header_global_ae0d5be50ba92fb0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:477
export const BOTTLE11____header_global_1d88095aba1914e9 = ((((((1158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dc16dd515e8dd7d54ef0f9c0() {
  return __cxx_static_address_dc16dd515e8dd7d54ef0f9c0.reference || (__cxx_static_address_dc16dd515e8dd7d54ef0f9c0.reference = {
    __cReference: true,
    get value() { return BOTTLE11____header_global_1d88095aba1914e9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:478
export const BOTTLE12____header_global_19d2ad219e90a63f = ((((((1159) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4d793284b007e2f08183dbb6() {
  return __cxx_static_address_4d793284b007e2f08183dbb6.reference || (__cxx_static_address_4d793284b007e2f08183dbb6.reference = {
    __cReference: true,
    get value() { return BOTTLE12____header_global_19d2ad219e90a63f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:479
export const BOTTLE13____header_global_fc8e942c76a373fa = ((((((1160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_26b1c4af10ba3266eb3165c8() {
  return __cxx_static_address_26b1c4af10ba3266eb3165c8.reference || (__cxx_static_address_26b1c4af10ba3266eb3165c8.reference = {
    __cReference: true,
    get value() { return BOTTLE13____header_global_fc8e942c76a373fa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:480
export const BOTTLE14____header_global_25678b74d12d5e12 = ((((((1161) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f319526654b106ee8f378118() {
  return __cxx_static_address_f319526654b106ee8f378118.reference || (__cxx_static_address_f319526654b106ee8f378118.reference = {
    __cReference: true,
    get value() { return BOTTLE14____header_global_25678b74d12d5e12; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:481
export const BOTTLE15____header_global_f3fb0c472fca7832 = ((((((1162) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_419215bc2beb8907c72e0740() {
  return __cxx_static_address_419215bc2beb8907c72e0740.reference || (__cxx_static_address_419215bc2beb8907c72e0740.reference = {
    __cReference: true,
    get value() { return BOTTLE15____header_global_f3fb0c472fca7832; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:482
export const BOTTLE16____header_global_538be21c3eda4154 = ((((((1163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cb88cc38454ff5aafec797a7() {
  return __cxx_static_address_cb88cc38454ff5aafec797a7.reference || (__cxx_static_address_cb88cc38454ff5aafec797a7.reference = {
    __cReference: true,
    get value() { return BOTTLE16____header_global_538be21c3eda4154; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:483
export const BOTTLE17____header_global_24f1f10655a2f555 = ((((((1164) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d5f8eb8bdd1fd75db48d1d78() {
  return __cxx_static_address_d5f8eb8bdd1fd75db48d1d78.reference || (__cxx_static_address_d5f8eb8bdd1fd75db48d1d78.reference = {
    __cReference: true,
    get value() { return BOTTLE17____header_global_24f1f10655a2f555; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:484
export const BOTTLE18____header_global_e0eb770452af19e6 = ((((((1165) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ce7b5a28d1b4424d390782f8() {
  return __cxx_static_address_ce7b5a28d1b4424d390782f8.reference || (__cxx_static_address_ce7b5a28d1b4424d390782f8.reference = {
    __cReference: true,
    get value() { return BOTTLE18____header_global_e0eb770452af19e6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:485
export const BOTTLE19____header_global_0e4668425d81ad76 = ((((((1166) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_280eaab7e929f16d8d0f881f() {
  return __cxx_static_address_280eaab7e929f16d8d0f881f.reference || (__cxx_static_address_280eaab7e929f16d8d0f881f.reference = {
    __cReference: true,
    get value() { return BOTTLE19____header_global_0e4668425d81ad76; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:486
export const DOORTILE17____header_global_03405dd569e7f165 = ((((((1169) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f65f502e95a6fb1b24e114b8() {
  return __cxx_static_address_f65f502e95a6fb1b24e114b8.reference || (__cxx_static_address_f65f502e95a6fb1b24e114b8.reference = {
    __cReference: true,
    get value() { return DOORTILE17____header_global_03405dd569e7f165; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:487
export const MASKWALL7____header_global_e4ea73ebc1879998 = ((((((1174) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b12d1cf01482c6401af17ad3() {
  return __cxx_static_address_b12d1cf01482c6401af17ad3.reference || (__cxx_static_address_b12d1cf01482c6401af17ad3.reference = {
    __cReference: true,
    get value() { return MASKWALL7____header_global_e4ea73ebc1879998; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:488
export const DOORTILE11____header_global_62dead94e5ff175c = ((((((1178) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_051be5c98d537a54565ceadd() {
  return __cxx_static_address_051be5c98d537a54565ceadd.reference || (__cxx_static_address_051be5c98d537a54565ceadd.reference = {
    __cReference: true,
    get value() { return DOORTILE11____header_global_62dead94e5ff175c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:489
export const DOORTILE12____header_global_18711afa40211b1f = ((((((1179) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9637350b56beda3e1b9cdcca() {
  return __cxx_static_address_9637350b56beda3e1b9cdcca.reference || (__cxx_static_address_9637350b56beda3e1b9cdcca.reference = {
    __cReference: true,
    get value() { return DOORTILE12____header_global_18711afa40211b1f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:490
export const VENDMACHINE____header_global_9e726ae5d7d81136 = ((((((1212) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ab6b238a67d351a0703cc819() {
  return __cxx_static_address_ab6b238a67d351a0703cc819.reference || (__cxx_static_address_ab6b238a67d351a0703cc819.reference = {
    __cReference: true,
    get value() { return VENDMACHINE____header_global_9e726ae5d7d81136; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:491
export const COLAMACHINE____header_global_98d008aad2dca0ae = ((((((1215) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f184eaf78788a9133de4a8a2() {
  return __cxx_static_address_f184eaf78788a9133de4a8a2.reference || (__cxx_static_address_f184eaf78788a9133de4a8a2.reference = {
    __cReference: true,
    get value() { return COLAMACHINE____header_global_98d008aad2dca0ae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:492
export const CRANEPOLE____header_global_171a4dc441edd1ad = ((((((1221) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0d382f6043363e68a752af9a() {
  return __cxx_static_address_0d382f6043363e68a752af9a.reference || (__cxx_static_address_0d382f6043363e68a752af9a.reference = {
    __cReference: true,
    get value() { return CRANEPOLE____header_global_171a4dc441edd1ad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:493
export const CRANE____header_global_bacf4883839fcca0 = ((((((1222) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0d45185774a961dc3a2ae7b4() {
  return __cxx_static_address_0d45185774a961dc3a2ae7b4.reference || (__cxx_static_address_0d45185774a961dc3a2ae7b4.reference = {
    __cReference: true,
    get value() { return CRANE____header_global_bacf4883839fcca0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:494
export const BARBROKE____header_global_7cb0f48e292c2e96 = ((((((1225) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_375fb37c05da973586269225() {
  return __cxx_static_address_375fb37c05da973586269225.reference || (__cxx_static_address_375fb37c05da973586269225.reference = {
    __cReference: true,
    get value() { return BARBROKE____header_global_7cb0f48e292c2e96; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:495
export const BLOODPOOL____header_global_7906989a3c275cfd = ((((((1226) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_36edb7585c01ddb57838831e() {
  return __cxx_static_address_36edb7585c01ddb57838831e.reference || (__cxx_static_address_36edb7585c01ddb57838831e.reference = {
    __cReference: true,
    get value() { return BLOODPOOL____header_global_7906989a3c275cfd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:496
export const NUKEBARREL____header_global_13c304bcbd601468 = ((((((1227) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5de3f160d91bd68f60f8d166() {
  return __cxx_static_address_5de3f160d91bd68f60f8d166.reference || (__cxx_static_address_5de3f160d91bd68f60f8d166.reference = {
    __cReference: true,
    get value() { return NUKEBARREL____header_global_13c304bcbd601468; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:497
export const NUKEBARRELDENTED____header_global_a843aa8899b98e26 = ((((((1228) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_05d5fcad178abc678608178a() {
  return __cxx_static_address_05d5fcad178abc678608178a.reference || (__cxx_static_address_05d5fcad178abc678608178a.reference = {
    __cReference: true,
    get value() { return NUKEBARRELDENTED____header_global_a843aa8899b98e26; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:498
export const NUKEBARRELLEAKED____header_global_64519aa60c67ec3f = ((((((1229) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3364cb5a91a2c3277efe6e74() {
  return __cxx_static_address_3364cb5a91a2c3277efe6e74.reference || (__cxx_static_address_3364cb5a91a2c3277efe6e74.reference = {
    __cReference: true,
    get value() { return NUKEBARRELLEAKED____header_global_64519aa60c67ec3f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:499
export const CANWITHSOMETHING____header_global_7c6998ea1387e28c = ((((((1232) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fceb736d57a94f69802245b1() {
  return __cxx_static_address_fceb736d57a94f69802245b1.reference || (__cxx_static_address_fceb736d57a94f69802245b1.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING____header_global_7c6998ea1387e28c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:500
export const MONEY____header_global_36f428ab2d3e3080 = ((((((1233) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_df151d3242b5b382efc4963a() {
  return __cxx_static_address_df151d3242b5b382efc4963a.reference || (__cxx_static_address_df151d3242b5b382efc4963a.reference = {
    __cReference: true,
    get value() { return MONEY____header_global_36f428ab2d3e3080; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:501
export const BANNER____header_global_c553572aef3bba6c = ((((((1236) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0952c6518fd322ea4cd7848a() {
  return __cxx_static_address_0952c6518fd322ea4cd7848a.reference || (__cxx_static_address_0952c6518fd322ea4cd7848a.reference = {
    __cReference: true,
    get value() { return BANNER____header_global_c553572aef3bba6c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:502
export const EXPLODINGBARREL____header_global_9da8398ff0335d0b = ((((((1238) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dd8dee9460fc7ba146445c4b() {
  return __cxx_static_address_dd8dee9460fc7ba146445c4b.reference || (__cxx_static_address_dd8dee9460fc7ba146445c4b.reference = {
    __cReference: true,
    get value() { return EXPLODINGBARREL____header_global_9da8398ff0335d0b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:503
export const EXPLODINGBARREL2____header_global_f9f9f3793ffd4e79 = ((((((1239) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fcefd37bee9142c341119e36() {
  return __cxx_static_address_fcefd37bee9142c341119e36.reference || (__cxx_static_address_fcefd37bee9142c341119e36.reference = {
    __cReference: true,
    get value() { return EXPLODINGBARREL2____header_global_f9f9f3793ffd4e79; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:504
export const FIREBARREL____header_global_2571006c15e4bda4 = ((((((1240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1212e3865b4ea2f65200c432() {
  return __cxx_static_address_1212e3865b4ea2f65200c432.reference || (__cxx_static_address_1212e3865b4ea2f65200c432.reference = {
    __cReference: true,
    get value() { return FIREBARREL____header_global_2571006c15e4bda4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:505
export const SEENINE____header_global_5e4e1fe18861f32e = ((((((1247) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6ccc5e48180f2e20987bce0d() {
  return __cxx_static_address_6ccc5e48180f2e20987bce0d.reference || (__cxx_static_address_6ccc5e48180f2e20987bce0d.reference = {
    __cReference: true,
    get value() { return SEENINE____header_global_5e4e1fe18861f32e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:506
export const SEENINEDEAD____header_global_3dceecef510ea640 = ((((((1248) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ddb868d4b4e637a4d22f371e() {
  return __cxx_static_address_ddb868d4b4e637a4d22f371e.reference || (__cxx_static_address_ddb868d4b4e637a4d22f371e.reference = {
    __cReference: true,
    get value() { return SEENINEDEAD____header_global_3dceecef510ea640; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:507
export const STEAM____header_global_e4301493bd20fa35 = ((((((1250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bdbe5929a7fbc3f205f98fce() {
  return __cxx_static_address_bdbe5929a7fbc3f205f98fce.reference || (__cxx_static_address_bdbe5929a7fbc3f205f98fce.reference = {
    __cReference: true,
    get value() { return STEAM____header_global_e4301493bd20fa35; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:508
export const CEILINGSTEAM____header_global_832a57fe78e51eea = ((((((1255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_06cfe77fa275f16a3d08cbe2() {
  return __cxx_static_address_06cfe77fa275f16a3d08cbe2.reference || (__cxx_static_address_06cfe77fa275f16a3d08cbe2.reference = {
    __cReference: true,
    get value() { return CEILINGSTEAM____header_global_832a57fe78e51eea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:509
export const PIPE6B____header_global_48eb7aed6b50ca7d = ((((((1260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_80d47163ac20e8bd27ec4e5e() {
  return __cxx_static_address_80d47163ac20e8bd27ec4e5e.reference || (__cxx_static_address_80d47163ac20e8bd27ec4e5e.reference = {
    __cReference: true,
    get value() { return PIPE6B____header_global_48eb7aed6b50ca7d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:510
export const TRANSPORTERBEAM____header_global_9108c7b9d2076486 = ((((((1261) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5d7fb2c4f18cef53845017c0() {
  return __cxx_static_address_5d7fb2c4f18cef53845017c0.reference || (__cxx_static_address_5d7fb2c4f18cef53845017c0.reference = {
    __cReference: true,
    get value() { return TRANSPORTERBEAM____header_global_9108c7b9d2076486; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:511
export const RAT____header_global_c9b50ef5af18b0a2 = ((((((1267) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7ae795607b5db8e3160088d4() {
  return __cxx_static_address_7ae795607b5db8e3160088d4.reference || (__cxx_static_address_7ae795607b5db8e3160088d4.reference = {
    __cReference: true,
    get value() { return RAT____header_global_c9b50ef5af18b0a2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:512
export const TRASH____header_global_d2c199c5f676f8cd = ((((((1272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6963e7268c3a85c00e9601ef() {
  return __cxx_static_address_6963e7268c3a85c00e9601ef.reference || (__cxx_static_address_6963e7268c3a85c00e9601ef.reference = {
    __cReference: true,
    get value() { return TRASH____header_global_d2c199c5f676f8cd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:513
export const FEMPIC1____header_global_0e4556d96bbecced = ((((((1280) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7e2ca1bb2ac2788649980121() {
  return __cxx_static_address_7e2ca1bb2ac2788649980121.reference || (__cxx_static_address_7e2ca1bb2ac2788649980121.reference = {
    __cReference: true,
    get value() { return FEMPIC1____header_global_0e4556d96bbecced; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:514
export const FEMPIC2____header_global_a3d9f23574e81bbd = ((((((1289) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_097f42dd0139df68e0af0af5() {
  return __cxx_static_address_097f42dd0139df68e0af0af5.reference || (__cxx_static_address_097f42dd0139df68e0af0af5.reference = {
    __cReference: true,
    get value() { return FEMPIC2____header_global_a3d9f23574e81bbd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:515
export const BLANKSCREEN____header_global_693277803d3275c4 = ((((((1293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0d2d7e68acdd6c24b4db9a0a() {
  return __cxx_static_address_0d2d7e68acdd6c24b4db9a0a.reference || (__cxx_static_address_0d2d7e68acdd6c24b4db9a0a.reference = {
    __cReference: true,
    get value() { return BLANKSCREEN____header_global_693277803d3275c4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:516
export const PODFEM1____header_global_932ec6f988f94c0f = ((((((1294) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0c617c1eab28c207b1ee49a0() {
  return __cxx_static_address_0c617c1eab28c207b1ee49a0.reference || (__cxx_static_address_0c617c1eab28c207b1ee49a0.reference = {
    __cReference: true,
    get value() { return PODFEM1____header_global_932ec6f988f94c0f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:517
export const FEMPIC3____header_global_e1f72387e8157193 = ((((((1298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e253cb119b21e59c66d10356() {
  return __cxx_static_address_e253cb119b21e59c66d10356.reference || (__cxx_static_address_e253cb119b21e59c66d10356.reference = {
    __cReference: true,
    get value() { return FEMPIC3____header_global_e1f72387e8157193; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:518
export const FEMPIC4____header_global_1a1d38afbd7c1984 = ((((((1306) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_72eb7131f9cdd5cc36a464d5() {
  return __cxx_static_address_72eb7131f9cdd5cc36a464d5.reference || (__cxx_static_address_72eb7131f9cdd5cc36a464d5.reference = {
    __cReference: true,
    get value() { return FEMPIC4____header_global_1a1d38afbd7c1984; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:519
export const FEM1____header_global_3758eae8b8529640 = ((((((1312) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c42b2abb157be5697b25e37a() {
  return __cxx_static_address_c42b2abb157be5697b25e37a.reference || (__cxx_static_address_c42b2abb157be5697b25e37a.reference = {
    __cReference: true,
    get value() { return FEM1____header_global_3758eae8b8529640; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:520
export const FEM2____header_global_0bf128e97b82e239 = ((((((1317) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_333724c285f43c6027f8dbf0() {
  return __cxx_static_address_333724c285f43c6027f8dbf0.reference || (__cxx_static_address_333724c285f43c6027f8dbf0.reference = {
    __cReference: true,
    get value() { return FEM2____header_global_0bf128e97b82e239; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:521
export const FEM3____header_global_33a843f120b3473f = ((((((1321) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2e60f223e8905a8dcf009938() {
  return __cxx_static_address_2e60f223e8905a8dcf009938.reference || (__cxx_static_address_2e60f223e8905a8dcf009938.reference = {
    __cReference: true,
    get value() { return FEM3____header_global_33a843f120b3473f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:522
export const FEM5____header_global_89b13977938d8438 = ((((((1323) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_49b94a6ad8cb6d49f48ddc78() {
  return __cxx_static_address_49b94a6ad8cb6d49f48ddc78.reference || (__cxx_static_address_49b94a6ad8cb6d49f48ddc78.reference = {
    __cReference: true,
    get value() { return FEM5____header_global_89b13977938d8438; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:523
export const BLOODYPOLE____header_global_0f54fe306463c518 = ((((((1324) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d7034da9187e2b83d5a50603() {
  return __cxx_static_address_d7034da9187e2b83d5a50603.reference || (__cxx_static_address_d7034da9187e2b83d5a50603.reference = {
    __cReference: true,
    get value() { return BLOODYPOLE____header_global_0f54fe306463c518; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:524
export const FEM4____header_global_3fe00bb6d461dcbb = ((((((1325) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_22e8f2f0fa4ca4fb59b1636a() {
  return __cxx_static_address_22e8f2f0fa4ca4fb59b1636a.reference || (__cxx_static_address_22e8f2f0fa4ca4fb59b1636a.reference = {
    __cReference: true,
    get value() { return FEM4____header_global_3fe00bb6d461dcbb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:525
export const FEM6____header_global_93387ae9297c083d = ((((((1334) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cdc5f389f92b634d7d975967() {
  return __cxx_static_address_cdc5f389f92b634d7d975967.reference || (__cxx_static_address_cdc5f389f92b634d7d975967.reference = {
    __cReference: true,
    get value() { return FEM6____header_global_93387ae9297c083d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:526
export const FEM6PAD____header_global_a1b74f49a9db300f = ((((((1335) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5225219b046a8e815b915dc5() {
  return __cxx_static_address_5225219b046a8e815b915dc5.reference || (__cxx_static_address_5225219b046a8e815b915dc5.reference = {
    __cReference: true,
    get value() { return FEM6PAD____header_global_a1b74f49a9db300f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:527
export const FEM8____header_global_813829d357a725af = ((((((1336) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b97877864f97345b995bae84() {
  return __cxx_static_address_b97877864f97345b995bae84.reference || (__cxx_static_address_b97877864f97345b995bae84.reference = {
    __cReference: true,
    get value() { return FEM8____header_global_813829d357a725af; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:528
export const HELECOPT____header_global_2cb7f6b4ed322cca = ((((((1346) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6647131f093534cf67a345a0() {
  return __cxx_static_address_6647131f093534cf67a345a0.reference || (__cxx_static_address_6647131f093534cf67a345a0.reference = {
    __cReference: true,
    get value() { return HELECOPT____header_global_2cb7f6b4ed322cca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:529
export const FETUSJIB____header_global_e1024e9377221f19 = ((((((1347) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0dbba674d495876b21e0feaf() {
  return __cxx_static_address_0dbba674d495876b21e0feaf.reference || (__cxx_static_address_0dbba674d495876b21e0feaf.reference = {
    __cReference: true,
    get value() { return FETUSJIB____header_global_e1024e9377221f19; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:530
export const HOLODUKE____header_global_a6cf5b8a2e83aa7d = ((((((1348) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bf0102d5bbc44c3db4cd1162() {
  return __cxx_static_address_bf0102d5bbc44c3db4cd1162.reference || (__cxx_static_address_bf0102d5bbc44c3db4cd1162.reference = {
    __cReference: true,
    get value() { return HOLODUKE____header_global_a6cf5b8a2e83aa7d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:531
export const SPACEMARINE____header_global_6d41251df54147f0 = ((((((1353) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a9268bc08887b8369fe7b28b() {
  return __cxx_static_address_a9268bc08887b8369fe7b28b.reference || (__cxx_static_address_a9268bc08887b8369fe7b28b.reference = {
    __cReference: true,
    get value() { return SPACEMARINE____header_global_6d41251df54147f0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:532
export const INDY____header_global_1b5b0738e16da8e2 = ((((((1355) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_307879c517041a393a94a240() {
  return __cxx_static_address_307879c517041a393a94a240.reference || (__cxx_static_address_307879c517041a393a94a240.reference = {
    __cReference: true,
    get value() { return INDY____header_global_1b5b0738e16da8e2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:533
export const FETUS____header_global_d67ca840ab2a6d03 = ((((((1358) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_226f22cd6613340306f17740() {
  return __cxx_static_address_226f22cd6613340306f17740.reference || (__cxx_static_address_226f22cd6613340306f17740.reference = {
    __cReference: true,
    get value() { return FETUS____header_global_d67ca840ab2a6d03; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:534
export const FETUSBROKE____header_global_9929daa3e4a280b9 = ((((((1359) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_735fbb084969938daa5dd5b0() {
  return __cxx_static_address_735fbb084969938daa5dd5b0.reference || (__cxx_static_address_735fbb084969938daa5dd5b0.reference = {
    __cReference: true,
    get value() { return FETUSBROKE____header_global_9929daa3e4a280b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:535
export const MONK____header_global_cfba4b8895231c0e = ((((((1352) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a2d34ab20cf46197078cac7e() {
  return __cxx_static_address_a2d34ab20cf46197078cac7e.reference || (__cxx_static_address_a2d34ab20cf46197078cac7e.reference = {
    __cReference: true,
    get value() { return MONK____header_global_cfba4b8895231c0e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:536
export const LUKE____header_global_6231efcfd868a77a = ((((((1354) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6610519fdf91dcaee9e93185() {
  return __cxx_static_address_6610519fdf91dcaee9e93185.reference || (__cxx_static_address_6610519fdf91dcaee9e93185.reference = {
    __cReference: true,
    get value() { return LUKE____header_global_6231efcfd868a77a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:537
export const COOLEXPLOSION1____header_global_584fe4973d6fdd88 = ((((((1360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_48f66f331ba89f59acee1e26() {
  return __cxx_static_address_48f66f331ba89f59acee1e26.reference || (__cxx_static_address_48f66f331ba89f59acee1e26.reference = {
    __cReference: true,
    get value() { return COOLEXPLOSION1____header_global_584fe4973d6fdd88; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:538
export const WATERSPLASH2____header_global_39ad8fb595476ed2 = ((((((1380) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_43e39eba3148834479e9ae85() {
  return __cxx_static_address_43e39eba3148834479e9ae85.reference || (__cxx_static_address_43e39eba3148834479e9ae85.reference = {
    __cReference: true,
    get value() { return WATERSPLASH2____header_global_39ad8fb595476ed2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:539
export const FIREVASE____header_global_97f48929f7b57034 = ((((((1390) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8b86a349d003151ec430f8e1() {
  return __cxx_static_address_8b86a349d003151ec430f8e1.reference || (__cxx_static_address_8b86a349d003151ec430f8e1.reference = {
    __cReference: true,
    get value() { return FIREVASE____header_global_97f48929f7b57034; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:540
export const FEM7____header_global_0770ac058e2e770d = ((((((1395) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a3b7edbdf83aafe2f3736520() {
  return __cxx_static_address_a3b7edbdf83aafe2f3736520.reference || (__cxx_static_address_a3b7edbdf83aafe2f3736520.reference = {
    __cReference: true,
    get value() { return FEM7____header_global_0770ac058e2e770d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:541
export const APLAYERTOP____header_global_398de3a5273b2b8f = ((((((1400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_47b0ae53dcd3466eb38821a1() {
  return __cxx_static_address_47b0ae53dcd3466eb38821a1.reference || (__cxx_static_address_47b0ae53dcd3466eb38821a1.reference = {
    __cReference: true,
    get value() { return APLAYERTOP____header_global_398de3a5273b2b8f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:542
export const APLAYER____header_global_c8de50b603cfd443 = ((((((1405) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_62b57b124814231bfc691fcd() {
  return __cxx_static_address_62b57b124814231bfc691fcd.reference || (__cxx_static_address_62b57b124814231bfc691fcd.reference = {
    __cReference: true,
    get value() { return APLAYER____header_global_c8de50b603cfd443; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:543
export const PLAYERONWATER____header_global_5f6a4f0ce3888354 = ((((((1420) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_19c69efb52212757f4b15809() {
  return __cxx_static_address_19c69efb52212757f4b15809.reference || (__cxx_static_address_19c69efb52212757f4b15809.reference = {
    __cReference: true,
    get value() { return PLAYERONWATER____header_global_5f6a4f0ce3888354; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:544
export const DUKELYINGDEAD____header_global_396920fe9151ad47 = ((((((1518) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6379ce4b10307fae4e2930f3() {
  return __cxx_static_address_6379ce4b10307fae4e2930f3.reference || (__cxx_static_address_6379ce4b10307fae4e2930f3.reference = {
    __cReference: true,
    get value() { return DUKELYINGDEAD____header_global_396920fe9151ad47; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:545
export const DUKETORSO____header_global_0797ca54feacaa9c = ((((((1520) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2d6bd87b6223b44301773381() {
  return __cxx_static_address_2d6bd87b6223b44301773381.reference || (__cxx_static_address_2d6bd87b6223b44301773381.reference = {
    __cReference: true,
    get value() { return DUKETORSO____header_global_0797ca54feacaa9c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:546
export const DUKEGUN____header_global_3bec36f21a3bc61e = ((((((1528) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c28d9972e04772fe7bab34e3() {
  return __cxx_static_address_c28d9972e04772fe7bab34e3.reference || (__cxx_static_address_c28d9972e04772fe7bab34e3.reference = {
    __cReference: true,
    get value() { return DUKEGUN____header_global_3bec36f21a3bc61e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:547
export const DUKELEG____header_global_a3ed04ae310b5ce8 = ((((((1536) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_741d0cf3541724a045ea0ef5() {
  return __cxx_static_address_741d0cf3541724a045ea0ef5.reference || (__cxx_static_address_741d0cf3541724a045ea0ef5.reference = {
    __cReference: true,
    get value() { return DUKELEG____header_global_a3ed04ae310b5ce8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:548
export const SHARK____header_global_17e872bbf288fb0f = ((((((1550) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8f33e77819561419093357da() {
  return __cxx_static_address_8f33e77819561419093357da.reference || (__cxx_static_address_8f33e77819561419093357da.reference = {
    __cReference: true,
    get value() { return SHARK____header_global_17e872bbf288fb0f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:549
export const BLOOD____header_global_5a0a7d2d938201c1 = ((((((1620) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_91021ee0e017597489b33693() {
  return __cxx_static_address_91021ee0e017597489b33693.reference || (__cxx_static_address_91021ee0e017597489b33693.reference = {
    __cReference: true,
    get value() { return BLOOD____header_global_5a0a7d2d938201c1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:550
export const FIRELASER____header_global_f9f193751870dcbf = ((((((1625) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_544274e1dc47a413a3fc3bd1() {
  return __cxx_static_address_544274e1dc47a413a3fc3bd1.reference || (__cxx_static_address_544274e1dc47a413a3fc3bd1.reference = {
    __cReference: true,
    get value() { return FIRELASER____header_global_f9f193751870dcbf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:551
export const TRANSPORTERSTAR____header_global_f3d9f96affb5a4ad = ((((((1630) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8696c55128e1d847102c4933() {
  return __cxx_static_address_8696c55128e1d847102c4933.reference || (__cxx_static_address_8696c55128e1d847102c4933.reference = {
    __cReference: true,
    get value() { return TRANSPORTERSTAR____header_global_f3d9f96affb5a4ad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:552
export const SPIT____header_global_4e4b03c0b99b2aee = ((((((1636) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f923c82adfb10d8da97232d6() {
  return __cxx_static_address_f923c82adfb10d8da97232d6.reference || (__cxx_static_address_f923c82adfb10d8da97232d6.reference = {
    __cReference: true,
    get value() { return SPIT____header_global_4e4b03c0b99b2aee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:553
export const LOOGIE____header_global_29fe97963bc4c64f = ((((((1637) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_edf3d5b1c9f55d2bd61bf53c() {
  return __cxx_static_address_edf3d5b1c9f55d2bd61bf53c.reference || (__cxx_static_address_edf3d5b1c9f55d2bd61bf53c.reference = {
    __cReference: true,
    get value() { return LOOGIE____header_global_29fe97963bc4c64f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:554
export const FIST____header_global_fb06894e89859312 = ((((((1640) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_17aca1c92263e0af1892bf5b() {
  return __cxx_static_address_17aca1c92263e0af1892bf5b.reference || (__cxx_static_address_17aca1c92263e0af1892bf5b.reference = {
    __cReference: true,
    get value() { return FIST____header_global_fb06894e89859312; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:555
export const FREEZEBLAST____header_global_ff45536c05842e3f = ((((((1641) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f8b256876400fd907d7b11f5() {
  return __cxx_static_address_f8b256876400fd907d7b11f5.reference || (__cxx_static_address_f8b256876400fd907d7b11f5.reference = {
    __cReference: true,
    get value() { return FREEZEBLAST____header_global_ff45536c05842e3f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:556
export const SHRINKSPARK____header_global_08750e233522ec7f = ((((((1646) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_81355a18823bd14bba6fbc83() {
  return __cxx_static_address_81355a18823bd14bba6fbc83.reference || (__cxx_static_address_81355a18823bd14bba6fbc83.reference = {
    __cReference: true,
    get value() { return SHRINKSPARK____header_global_08750e233522ec7f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:557
export const TONGUE____header_global_ef93ce7916e393fa = ((((((1647) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_17040f1382f82bff50afe0c8() {
  return __cxx_static_address_17040f1382f82bff50afe0c8.reference || (__cxx_static_address_17040f1382f82bff50afe0c8.reference = {
    __cReference: true,
    get value() { return TONGUE____header_global_ef93ce7916e393fa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:558
export const MORTER____header_global_40c476f550daada6 = ((((((1650) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_71d79a1308a06fd9dd144ccb() {
  return __cxx_static_address_71d79a1308a06fd9dd144ccb.reference || (__cxx_static_address_71d79a1308a06fd9dd144ccb.reference = {
    __cReference: true,
    get value() { return MORTER____header_global_40c476f550daada6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:559
export const SHRINKEREXPLOSION____header_global_94a41f4fb6b82e9c = ((((((1656) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9bf45ca41b88ffb034e4e74d() {
  return __cxx_static_address_9bf45ca41b88ffb034e4e74d.reference || (__cxx_static_address_9bf45ca41b88ffb034e4e74d.reference = {
    __cReference: true,
    get value() { return SHRINKEREXPLOSION____header_global_94a41f4fb6b82e9c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:560
export const RADIUSEXPLOSION____header_global_f9ea1d442e3a27e9 = ((((((1670) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bfafe77cf7bdca47cadd0a33() {
  return __cxx_static_address_bfafe77cf7bdca47cadd0a33.reference || (__cxx_static_address_bfafe77cf7bdca47cadd0a33.reference = {
    __cReference: true,
    get value() { return RADIUSEXPLOSION____header_global_f9ea1d442e3a27e9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:561
export const FORCERIPPLE____header_global_1f4d33d92d28d9b8 = ((((((1671) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_119a6d31e770a58d19398c32() {
  return __cxx_static_address_119a6d31e770a58d19398c32.reference || (__cxx_static_address_119a6d31e770a58d19398c32.reference = {
    __cReference: true,
    get value() { return FORCERIPPLE____header_global_1f4d33d92d28d9b8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:562
export const LIZTROOP____header_global_0f1dc7738df9da4c = ((((((1680) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6c926ef5cf0e0ce6760e1dce() {
  return __cxx_static_address_6c926ef5cf0e0ce6760e1dce.reference || (__cxx_static_address_6c926ef5cf0e0ce6760e1dce.reference = {
    __cReference: true,
    get value() { return LIZTROOP____header_global_0f1dc7738df9da4c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:563
export const LIZTROOPRUNNING____header_global_2e704bbf73897007 = ((((((1681) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2ac3857dc269593b61622a90() {
  return __cxx_static_address_2ac3857dc269593b61622a90.reference || (__cxx_static_address_2ac3857dc269593b61622a90.reference = {
    __cReference: true,
    get value() { return LIZTROOPRUNNING____header_global_2e704bbf73897007; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:564
export const LIZTROOPSTAYPUT____header_global_6502d525b3b7fa6f = ((((((1682) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1c674669008434c63f0b6ecd() {
  return __cxx_static_address_1c674669008434c63f0b6ecd.reference || (__cxx_static_address_1c674669008434c63f0b6ecd.reference = {
    __cReference: true,
    get value() { return LIZTROOPSTAYPUT____header_global_6502d525b3b7fa6f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:565
export const LIZTROOPSHOOT____header_global_0d2338d60241e9ef = ((((((1715) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cb803bd7f7a53934d68b33e2() {
  return __cxx_static_address_cb803bd7f7a53934d68b33e2.reference || (__cxx_static_address_cb803bd7f7a53934d68b33e2.reference = {
    __cReference: true,
    get value() { return LIZTROOPSHOOT____header_global_0d2338d60241e9ef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:566
export const LIZTROOPJETPACK____header_global_03d8f6165f8c0a61 = ((((((1725) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d7ddff8c620f3e759e175316() {
  return __cxx_static_address_d7ddff8c620f3e759e175316.reference || (__cxx_static_address_d7ddff8c620f3e759e175316.reference = {
    __cReference: true,
    get value() { return LIZTROOPJETPACK____header_global_03d8f6165f8c0a61; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:567
export const LIZTROOPONTOILET____header_global_781ab991129aee28 = ((((((1741) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1ec6033e51e7d7becb0e10dd() {
  return __cxx_static_address_1ec6033e51e7d7becb0e10dd.reference || (__cxx_static_address_1ec6033e51e7d7becb0e10dd.reference = {
    __cReference: true,
    get value() { return LIZTROOPONTOILET____header_global_781ab991129aee28; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:568
export const LIZTROOPJUSTSIT____header_global_1a6fbf5f66a353c7 = ((((((1742) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f0551b8d6a2bad2f6cc4f6e4() {
  return __cxx_static_address_f0551b8d6a2bad2f6cc4f6e4.reference || (__cxx_static_address_f0551b8d6a2bad2f6cc4f6e4.reference = {
    __cReference: true,
    get value() { return LIZTROOPJUSTSIT____header_global_1a6fbf5f66a353c7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:569
export const LIZTROOPDUCKING____header_global_a43d246a5534e0f7 = ((((((1744) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c2378bd4e44a8ec94cb91b9d() {
  return __cxx_static_address_c2378bd4e44a8ec94cb91b9d.reference || (__cxx_static_address_c2378bd4e44a8ec94cb91b9d.reference = {
    __cReference: true,
    get value() { return LIZTROOPDUCKING____header_global_a43d246a5534e0f7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:570
export const HEADJIB1____header_global_b616e9f19006bcf8 = ((((((1768) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bfae055ebe7aa52a24e238f3() {
  return __cxx_static_address_bfae055ebe7aa52a24e238f3.reference || (__cxx_static_address_bfae055ebe7aa52a24e238f3.reference = {
    __cReference: true,
    get value() { return HEADJIB1____header_global_b616e9f19006bcf8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:571
export const ARMJIB1____header_global_5dd5bc7933f615c8 = ((((((1772) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_801cf138aad16cf5b824b344() {
  return __cxx_static_address_801cf138aad16cf5b824b344.reference || (__cxx_static_address_801cf138aad16cf5b824b344.reference = {
    __cReference: true,
    get value() { return ARMJIB1____header_global_5dd5bc7933f615c8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:572
export const LEGJIB1____header_global_eb0a91c1513d1a73 = ((((((1776) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_62adc6b4b32261be524c3bc5() {
  return __cxx_static_address_62adc6b4b32261be524c3bc5.reference || (__cxx_static_address_62adc6b4b32261be524c3bc5.reference = {
    __cReference: true,
    get value() { return LEGJIB1____header_global_eb0a91c1513d1a73; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:573
export const OCTABRAIN____header_global_53f7803046f4c8be = ((((((1820) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_70375332d6cb4c103db8d4fb() {
  return __cxx_static_address_70375332d6cb4c103db8d4fb.reference || (__cxx_static_address_70375332d6cb4c103db8d4fb.reference = {
    __cReference: true,
    get value() { return OCTABRAIN____header_global_53f7803046f4c8be; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:574
export const OCTABRAINSTAYPUT____header_global_f83a7ea2dc729d68 = ((((((1821) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_045a4a84832dbff34b4a598a() {
  return __cxx_static_address_045a4a84832dbff34b4a598a.reference || (__cxx_static_address_045a4a84832dbff34b4a598a.reference = {
    __cReference: true,
    get value() { return OCTABRAINSTAYPUT____header_global_f83a7ea2dc729d68; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:575
export const INNERJAW____header_global_10bb578c7040b99a = ((((((1860) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cb822d31dc98cb5a17e12130() {
  return __cxx_static_address_cb822d31dc98cb5a17e12130.reference || (__cxx_static_address_cb822d31dc98cb5a17e12130.reference = {
    __cReference: true,
    get value() { return INNERJAW____header_global_10bb578c7040b99a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:576
export const DRONE____header_global_b18a436d2f3a2696 = ((((((1880) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2297c90c03cea6070f02ce82() {
  return __cxx_static_address_2297c90c03cea6070f02ce82.reference || (__cxx_static_address_2297c90c03cea6070f02ce82.reference = {
    __cReference: true,
    get value() { return DRONE____header_global_b18a436d2f3a2696; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:577
export const EXPLOSION2____header_global_1198c6cee88cb28f = ((((((1890) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fa8ccc663af72bdab2deda08() {
  return __cxx_static_address_fa8ccc663af72bdab2deda08.reference || (__cxx_static_address_fa8ccc663af72bdab2deda08.reference = {
    __cReference: true,
    get value() { return EXPLOSION2____header_global_1198c6cee88cb28f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:578
export const COMMANDER____header_global_f49f7cf95b0675a7 = ((((((1920) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bd802b246a71dd059952f7f0() {
  return __cxx_static_address_bd802b246a71dd059952f7f0.reference || (__cxx_static_address_bd802b246a71dd059952f7f0.reference = {
    __cReference: true,
    get value() { return COMMANDER____header_global_f49f7cf95b0675a7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:579
export const COMMANDERSTAYPUT____header_global_ffed4f7fcbe33053 = ((((((1921) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6487fa0002711e328983a4d1() {
  return __cxx_static_address_6487fa0002711e328983a4d1.reference || (__cxx_static_address_6487fa0002711e328983a4d1.reference = {
    __cReference: true,
    get value() { return COMMANDERSTAYPUT____header_global_ffed4f7fcbe33053; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:580
export const RECON____header_global_881d53c5ae4c6597 = ((((((1960) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1638e8ccce342e90cfbc6c6e() {
  return __cxx_static_address_1638e8ccce342e90cfbc6c6e.reference || (__cxx_static_address_1638e8ccce342e90cfbc6c6e.reference = {
    __cReference: true,
    get value() { return RECON____header_global_881d53c5ae4c6597; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:581
export const TANK____header_global_71adc74e590dbe21 = ((((((1975) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_19c5c449da9f459b2b5d349a() {
  return __cxx_static_address_19c5c449da9f459b2b5d349a.reference || (__cxx_static_address_19c5c449da9f459b2b5d349a.reference = {
    __cReference: true,
    get value() { return TANK____header_global_71adc74e590dbe21; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:582
export const PIGCOP____header_global_5193d70b6b890efa = ((((((2000) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6707f33bd6f11c81a7daa09b() {
  return __cxx_static_address_6707f33bd6f11c81a7daa09b.reference || (__cxx_static_address_6707f33bd6f11c81a7daa09b.reference = {
    __cReference: true,
    get value() { return PIGCOP____header_global_5193d70b6b890efa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:583
export const PIGCOPSTAYPUT____header_global_7c06289145df745d = ((((((2001) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_786473d9eba201e867dbb504() {
  return __cxx_static_address_786473d9eba201e867dbb504.reference || (__cxx_static_address_786473d9eba201e867dbb504.reference = {
    __cReference: true,
    get value() { return PIGCOPSTAYPUT____header_global_7c06289145df745d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:584
export const PIGCOPDIVE____header_global_438d4545814c3fb6 = ((((((2045) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e46431f71156e7e422f482c3() {
  return __cxx_static_address_e46431f71156e7e422f482c3.reference || (__cxx_static_address_e46431f71156e7e422f482c3.reference = {
    __cReference: true,
    get value() { return PIGCOPDIVE____header_global_438d4545814c3fb6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:585
export const LIZMAN____header_global_23d270db1073b6cb = ((((((2120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1d98051998c9fa6bb642e6a6() {
  return __cxx_static_address_1d98051998c9fa6bb642e6a6.reference || (__cxx_static_address_1d98051998c9fa6bb642e6a6.reference = {
    __cReference: true,
    get value() { return LIZMAN____header_global_23d270db1073b6cb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:586
export const LIZMANSTAYPUT____header_global_2266f3b12980e55d = ((((((2121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7f12c8d6ad397e36fb7c2aa1() {
  return __cxx_static_address_7f12c8d6ad397e36fb7c2aa1.reference || (__cxx_static_address_7f12c8d6ad397e36fb7c2aa1.reference = {
    __cReference: true,
    get value() { return LIZMANSTAYPUT____header_global_2266f3b12980e55d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:587
export const LIZMANSPITTING____header_global_89d1ecef37624b02 = ((((((2150) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8da6f514f8b68d59c358a3da() {
  return __cxx_static_address_8da6f514f8b68d59c358a3da.reference || (__cxx_static_address_8da6f514f8b68d59c358a3da.reference = {
    __cReference: true,
    get value() { return LIZMANSPITTING____header_global_89d1ecef37624b02; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:588
export const LIZMANFEEDING____header_global_78529819280e8dc9 = ((((((2160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7a07d937457e334a22ad8d7c() {
  return __cxx_static_address_7a07d937457e334a22ad8d7c.reference || (__cxx_static_address_7a07d937457e334a22ad8d7c.reference = {
    __cReference: true,
    get value() { return LIZMANFEEDING____header_global_78529819280e8dc9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:589
export const LIZMANJUMP____header_global_267b8ded545c1c2c = ((((((2165) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bc865e2df1ffdc5c3ec892d4() {
  return __cxx_static_address_bc865e2df1ffdc5c3ec892d4.reference || (__cxx_static_address_bc865e2df1ffdc5c3ec892d4.reference = {
    __cReference: true,
    get value() { return LIZMANJUMP____header_global_267b8ded545c1c2c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:590
export const FECES____header_global_99031cea8e15df3f = ((((((2200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_18ab79fec33b5e5bace8f9ca() {
  return __cxx_static_address_18ab79fec33b5e5bace8f9ca.reference || (__cxx_static_address_18ab79fec33b5e5bace8f9ca.reference = {
    __cReference: true,
    get value() { return FECES____header_global_99031cea8e15df3f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:591
export const LIZMANHEAD1____header_global_2f79cf3b4bfb376c = ((((((2201) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_465cc77463f8939a4c2e07e2() {
  return __cxx_static_address_465cc77463f8939a4c2e07e2.reference || (__cxx_static_address_465cc77463f8939a4c2e07e2.reference = {
    __cReference: true,
    get value() { return LIZMANHEAD1____header_global_2f79cf3b4bfb376c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:592
export const LIZMANARM1____header_global_f0b3603bff74d893 = ((((((2205) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b3835d6687c0aecfd60d9f80() {
  return __cxx_static_address_b3835d6687c0aecfd60d9f80.reference || (__cxx_static_address_b3835d6687c0aecfd60d9f80.reference = {
    __cReference: true,
    get value() { return LIZMANARM1____header_global_f0b3603bff74d893; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:593
export const LIZMANLEG1____header_global_ff7718e0daf41102 = ((((((2209) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_baaa8a2ed6b5058da708cade() {
  return __cxx_static_address_baaa8a2ed6b5058da708cade.reference || (__cxx_static_address_baaa8a2ed6b5058da708cade.reference = {
    __cReference: true,
    get value() { return LIZMANLEG1____header_global_ff7718e0daf41102; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:594
export const EXPLOSION2BOT____header_global_5fafc23077f19682 = ((((((2219) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_082f9c02854f667519d0a91a() {
  return __cxx_static_address_082f9c02854f667519d0a91a.reference || (__cxx_static_address_082f9c02854f667519d0a91a.reference = {
    __cReference: true,
    get value() { return EXPLOSION2BOT____header_global_5fafc23077f19682; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:595
export const JIBS1____header_global_712c070844a9f737 = ((((((2245) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9005c0c238522c79022fdfaf() {
  return __cxx_static_address_9005c0c238522c79022fdfaf.reference || (__cxx_static_address_9005c0c238522c79022fdfaf.reference = {
    __cReference: true,
    get value() { return JIBS1____header_global_712c070844a9f737; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:596
export const JIBS2____header_global_ed91f22d3562f302 = ((((((2250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_325ee99b5cdefe944fafcfe1() {
  return __cxx_static_address_325ee99b5cdefe944fafcfe1.reference || (__cxx_static_address_325ee99b5cdefe944fafcfe1.reference = {
    __cReference: true,
    get value() { return JIBS2____header_global_ed91f22d3562f302; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:597
export const JIBS3____header_global_f03cb048a46cbad4 = ((((((2255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e24c270f966b2b0a3287b9dc() {
  return __cxx_static_address_e24c270f966b2b0a3287b9dc.reference || (__cxx_static_address_e24c270f966b2b0a3287b9dc.reference = {
    __cReference: true,
    get value() { return JIBS3____header_global_f03cb048a46cbad4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:598
export const JIBS4____header_global_13c1c757a98e4f73 = ((((((2260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4f8da7d503b0c556fd6abda0() {
  return __cxx_static_address_4f8da7d503b0c556fd6abda0.reference || (__cxx_static_address_4f8da7d503b0c556fd6abda0.reference = {
    __cReference: true,
    get value() { return JIBS4____header_global_13c1c757a98e4f73; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:599
export const JIBS5____header_global_290e0ba615fa7908 = ((((((2265) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_17468f2abc8a6a10d2669e2b() {
  return __cxx_static_address_17468f2abc8a6a10d2669e2b.reference || (__cxx_static_address_17468f2abc8a6a10d2669e2b.reference = {
    __cReference: true,
    get value() { return JIBS5____header_global_290e0ba615fa7908; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:600
export const BURNING____header_global_642972432ff8da6b = ((((((2270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_25ad8350fc7f2e5cdcb1e0d6() {
  return __cxx_static_address_25ad8350fc7f2e5cdcb1e0d6.reference || (__cxx_static_address_25ad8350fc7f2e5cdcb1e0d6.reference = {
    __cReference: true,
    get value() { return BURNING____header_global_642972432ff8da6b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:601
export const FIRE____header_global_8ed98c16d0bcec05 = ((((((2271) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_80f8300ba0168925a081dfba() {
  return __cxx_static_address_80f8300ba0168925a081dfba.reference || (__cxx_static_address_80f8300ba0168925a081dfba.reference = {
    __cReference: true,
    get value() { return FIRE____header_global_8ed98c16d0bcec05; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:602
export const JIBS6____header_global_c7747c8b152e75e6 = ((((((2286) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2bfeef36822730d66365fffa() {
  return __cxx_static_address_2bfeef36822730d66365fffa.reference || (__cxx_static_address_2bfeef36822730d66365fffa.reference = {
    __cReference: true,
    get value() { return JIBS6____header_global_c7747c8b152e75e6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:603
export const BLOODSPLAT1____header_global_9fad3f3300651448 = ((((((2296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_287ee2e1442351448630612b() {
  return __cxx_static_address_287ee2e1442351448630612b.reference || (__cxx_static_address_287ee2e1442351448630612b.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT1____header_global_9fad3f3300651448; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:604
export const BLOODSPLAT3____header_global_f2bcc7795eb8a633 = ((((((2297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f579efe8f96c91a92fc908a0() {
  return __cxx_static_address_f579efe8f96c91a92fc908a0.reference || (__cxx_static_address_f579efe8f96c91a92fc908a0.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT3____header_global_f2bcc7795eb8a633; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:605
export const BLOODSPLAT2____header_global_a42631f130be65a6 = ((((((2298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_037d628ba9606ab4ebb238d8() {
  return __cxx_static_address_037d628ba9606ab4ebb238d8.reference || (__cxx_static_address_037d628ba9606ab4ebb238d8.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT2____header_global_a42631f130be65a6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:606
export const BLOODSPLAT4____header_global_bd371de8e705b5f6 = ((((((2299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6cdebf396b0c6d5db4c85054() {
  return __cxx_static_address_6cdebf396b0c6d5db4c85054.reference || (__cxx_static_address_6cdebf396b0c6d5db4c85054.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT4____header_global_bd371de8e705b5f6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:607
export const OOZ____header_global_66fe5ec189e6c6e2 = ((((((2300) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ef3016868e74bd62e52d8e91() {
  return __cxx_static_address_ef3016868e74bd62e52d8e91.reference || (__cxx_static_address_ef3016868e74bd62e52d8e91.reference = {
    __cReference: true,
    get value() { return OOZ____header_global_66fe5ec189e6c6e2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:608
export const OOZ2____header_global_5db9cb5cdf7b4c29 = ((((((2309) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6284e2839284d7bf24dd5990() {
  return __cxx_static_address_6284e2839284d7bf24dd5990.reference || (__cxx_static_address_6284e2839284d7bf24dd5990.reference = {
    __cReference: true,
    get value() { return OOZ2____header_global_5db9cb5cdf7b4c29; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:609
export const WALLBLOOD1____header_global_579b11670423985a = ((((((2301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d40f9d6d0fa9c5a8194e38ad() {
  return __cxx_static_address_d40f9d6d0fa9c5a8194e38ad.reference || (__cxx_static_address_d40f9d6d0fa9c5a8194e38ad.reference = {
    __cReference: true,
    get value() { return WALLBLOOD1____header_global_579b11670423985a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:610
export const WALLBLOOD2____header_global_12d6c58d48f962a3 = ((((((2302) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c3b3be1bc9c809f4c1f1b9e0() {
  return __cxx_static_address_c3b3be1bc9c809f4c1f1b9e0.reference || (__cxx_static_address_c3b3be1bc9c809f4c1f1b9e0.reference = {
    __cReference: true,
    get value() { return WALLBLOOD2____header_global_12d6c58d48f962a3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:611
export const WALLBLOOD3____header_global_fd5175606d508e79 = ((((((2303) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_da687a72cb1db83f720a5789() {
  return __cxx_static_address_da687a72cb1db83f720a5789.reference || (__cxx_static_address_da687a72cb1db83f720a5789.reference = {
    __cReference: true,
    get value() { return WALLBLOOD3____header_global_fd5175606d508e79; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:612
export const WALLBLOOD4____header_global_c557be4dd9f45705 = ((((((2304) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_35267743f8f1862bf949e8a1() {
  return __cxx_static_address_35267743f8f1862bf949e8a1.reference || (__cxx_static_address_35267743f8f1862bf949e8a1.reference = {
    __cReference: true,
    get value() { return WALLBLOOD4____header_global_c557be4dd9f45705; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:613
export const WALLBLOOD5____header_global_9afdf60581fb2036 = ((((((2305) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9f2ea2de1c9096da83302bb3() {
  return __cxx_static_address_9f2ea2de1c9096da83302bb3.reference || (__cxx_static_address_9f2ea2de1c9096da83302bb3.reference = {
    __cReference: true,
    get value() { return WALLBLOOD5____header_global_9afdf60581fb2036; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:614
export const WALLBLOOD7____header_global_4473dafd64800fbf = ((((((2307) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0e009423d7d60ad6bbcb13a5() {
  return __cxx_static_address_0e009423d7d60ad6bbcb13a5.reference || (__cxx_static_address_0e009423d7d60ad6bbcb13a5.reference = {
    __cReference: true,
    get value() { return WALLBLOOD7____header_global_4473dafd64800fbf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:615
export const WALLBLOOD8____header_global_59e71ebb8608728f = ((((((2308) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_86ff4dac2efb403c6e17adee() {
  return __cxx_static_address_86ff4dac2efb403c6e17adee.reference || (__cxx_static_address_86ff4dac2efb403c6e17adee.reference = {
    __cReference: true,
    get value() { return WALLBLOOD8____header_global_59e71ebb8608728f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:616
export const BURNING2____header_global_de407554533247ce = ((((((2310) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2fd8afffb4f95849a7bcc10c() {
  return __cxx_static_address_2fd8afffb4f95849a7bcc10c.reference || (__cxx_static_address_2fd8afffb4f95849a7bcc10c.reference = {
    __cReference: true,
    get value() { return BURNING2____header_global_de407554533247ce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:617
export const FIRE2____header_global_f1ee8f658b7a880c = ((((((2311) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d5828d7a268225ff1f806ddc() {
  return __cxx_static_address_d5828d7a268225ff1f806ddc.reference || (__cxx_static_address_d5828d7a268225ff1f806ddc.reference = {
    __cReference: true,
    get value() { return FIRE2____header_global_f1ee8f658b7a880c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:618
export const CRACKKNUCKLES____header_global_edad2f7ec1b8c3fa = ((((((2324) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8c47908233118b79003ddc76() {
  return __cxx_static_address_8c47908233118b79003ddc76.reference || (__cxx_static_address_8c47908233118b79003ddc76.reference = {
    __cReference: true,
    get value() { return CRACKKNUCKLES____header_global_edad2f7ec1b8c3fa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:619
export const SMALLSMOKE____header_global_e534d4a5e41b1080 = ((((((2329) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3038b385f2df925279994d27() {
  return __cxx_static_address_3038b385f2df925279994d27.reference || (__cxx_static_address_3038b385f2df925279994d27.reference = {
    __cReference: true,
    get value() { return SMALLSMOKE____header_global_e534d4a5e41b1080; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:620
export const FLOORFLAME____header_global_707e8be0cc3b92d4 = ((((((2333) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fb4f4421ceade4e4e7cb4337() {
  return __cxx_static_address_fb4f4421ceade4e4e7cb4337.reference || (__cxx_static_address_fb4f4421ceade4e4e7cb4337.reference = {
    __cReference: true,
    get value() { return FLOORFLAME____header_global_707e8be0cc3b92d4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:621
export const ROTATEGUN____header_global_dfe923b5e3168065 = ((((((2360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ec24262ef522de26c9211ef2() {
  return __cxx_static_address_ec24262ef522de26c9211ef2.reference || (__cxx_static_address_ec24262ef522de26c9211ef2.reference = {
    __cReference: true,
    get value() { return ROTATEGUN____header_global_dfe923b5e3168065; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:622
export const GREENSLIME____header_global_ab9c95c36c10470a = ((((((2370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_66a0126f4ef9651dc6c6d5ec() {
  return __cxx_static_address_66a0126f4ef9651dc6c6d5ec.reference || (__cxx_static_address_66a0126f4ef9651dc6c6d5ec.reference = {
    __cReference: true,
    get value() { return GREENSLIME____header_global_ab9c95c36c10470a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:623
export const WATERDRIPSPLASH____header_global_43bbd943ee379a62 = ((((((2380) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_edbf5829ebdae27375158cfd() {
  return __cxx_static_address_edbf5829ebdae27375158cfd.reference || (__cxx_static_address_edbf5829ebdae27375158cfd.reference = {
    __cReference: true,
    get value() { return WATERDRIPSPLASH____header_global_43bbd943ee379a62; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:624
export const SCRAP6____header_global_db0e3461740e698c = ((((((2390) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3b21bdfb0579bad5ead395d5() {
  return __cxx_static_address_3b21bdfb0579bad5ead395d5.reference || (__cxx_static_address_3b21bdfb0579bad5ead395d5.reference = {
    __cReference: true,
    get value() { return SCRAP6____header_global_db0e3461740e698c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:625
export const SCRAP1____header_global_216964a644067cf1 = ((((((2400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_45796397b3c3f0b8f5eb07a2() {
  return __cxx_static_address_45796397b3c3f0b8f5eb07a2.reference || (__cxx_static_address_45796397b3c3f0b8f5eb07a2.reference = {
    __cReference: true,
    get value() { return SCRAP1____header_global_216964a644067cf1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:626
export const SCRAP2____header_global_43830ba12bd5fe04 = ((((((2404) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5753104b9c5a2d0cea8c96bd() {
  return __cxx_static_address_5753104b9c5a2d0cea8c96bd.reference || (__cxx_static_address_5753104b9c5a2d0cea8c96bd.reference = {
    __cReference: true,
    get value() { return SCRAP2____header_global_43830ba12bd5fe04; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:627
export const SCRAP3____header_global_7ae1fd532a56a393 = ((((((2408) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5562424e766f5ed77fbce939() {
  return __cxx_static_address_5562424e766f5ed77fbce939.reference || (__cxx_static_address_5562424e766f5ed77fbce939.reference = {
    __cReference: true,
    get value() { return SCRAP3____header_global_7ae1fd532a56a393; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:628
export const SCRAP4____header_global_f0f91f22ffe3dbda = ((((((2412) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7790e0a80cc04b488410affd() {
  return __cxx_static_address_7790e0a80cc04b488410affd.reference || (__cxx_static_address_7790e0a80cc04b488410affd.reference = {
    __cReference: true,
    get value() { return SCRAP4____header_global_f0f91f22ffe3dbda; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:629
export const SCRAP5____header_global_b8627cc79832aecc = ((((((2416) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_37c4bee3d702788426796745() {
  return __cxx_static_address_37c4bee3d702788426796745.reference || (__cxx_static_address_37c4bee3d702788426796745.reference = {
    __cReference: true,
    get value() { return SCRAP5____header_global_b8627cc79832aecc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:630
export const ORGANTIC____header_global_d88cdcf675fec316 = ((((((2420) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2820c8acb5b861b2ab01691a() {
  return __cxx_static_address_2820c8acb5b861b2ab01691a.reference || (__cxx_static_address_2820c8acb5b861b2ab01691a.reference = {
    __cReference: true,
    get value() { return ORGANTIC____header_global_d88cdcf675fec316; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:631
export const BETAVERSION____header_global_32642e7bb675617e = ((((((2440) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_357df2df3c7d11db3aeeb8a1() {
  return __cxx_static_address_357df2df3c7d11db3aeeb8a1.reference || (__cxx_static_address_357df2df3c7d11db3aeeb8a1.reference = {
    __cReference: true,
    get value() { return BETAVERSION____header_global_32642e7bb675617e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:632
export const SELECTDIR____header_global_11b10ab2c487d160 = ((((((2444) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_185a52de04d97e6239cb9687() {
  return __cxx_static_address_185a52de04d97e6239cb9687.reference || (__cxx_static_address_185a52de04d97e6239cb9687.reference = {
    __cReference: true,
    get value() { return SELECTDIR____header_global_11b10ab2c487d160; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:633
export const F1HELP____header_global_5b523233b6f3679f = ((((((2445) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_98bbcad5588e7b6b49be6cb3() {
  return __cxx_static_address_98bbcad5588e7b6b49be6cb3.reference || (__cxx_static_address_98bbcad5588e7b6b49be6cb3.reference = {
    __cReference: true,
    get value() { return F1HELP____header_global_5b523233b6f3679f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:634
export const GROWSPARK____header_global_cb9d5638f5b0d8a0 = ((((((2448) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4fd43db0c21bb1e1cb6e0875() {
  return __cxx_static_address_4fd43db0c21bb1e1cb6e0875.reference || (__cxx_static_address_4fd43db0c21bb1e1cb6e0875.reference = {
    __cReference: true,
    get value() { return GROWSPARK____header_global_cb9d5638f5b0d8a0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:635
export const MENUSCREEN____header_global_eadb45e383842091 = ((((((2456) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3f365c730e16be19424aded6() {
  return __cxx_static_address_3f365c730e16be19424aded6.reference || (__cxx_static_address_3f365c730e16be19424aded6.reference = {
    __cReference: true,
    get value() { return MENUSCREEN____header_global_eadb45e383842091; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:636
export const MENUBAR____header_global_d169d7bc780830b0 = ((((((2457) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c77c7f8c9029df8b8b2a6c6a() {
  return __cxx_static_address_c77c7f8c9029df8b8b2a6c6a.reference || (__cxx_static_address_c77c7f8c9029df8b8b2a6c6a.reference = {
    __cReference: true,
    get value() { return MENUBAR____header_global_d169d7bc780830b0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:637
export const KILLSICON____header_global_8f2e5f6645b5797e = ((((((2458) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5c81d155f68631b2f659d4b6() {
  return __cxx_static_address_5c81d155f68631b2f659d4b6.reference || (__cxx_static_address_5c81d155f68631b2f659d4b6.reference = {
    __cReference: true,
    get value() { return KILLSICON____header_global_8f2e5f6645b5797e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:638
export const FIRSTAID_ICON____header_global_53a36651583f74e1 = ((((((2460) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_22c2589905c6e551694e8be2() {
  return __cxx_static_address_22c2589905c6e551694e8be2.reference || (__cxx_static_address_22c2589905c6e551694e8be2.reference = {
    __cReference: true,
    get value() { return FIRSTAID_ICON____header_global_53a36651583f74e1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:639
export const HEAT_ICON____header_global_ac506f4adbfbe8d4 = ((((((2461) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f634cc5b30d8b7244ac4cacb() {
  return __cxx_static_address_f634cc5b30d8b7244ac4cacb.reference || (__cxx_static_address_f634cc5b30d8b7244ac4cacb.reference = {
    __cReference: true,
    get value() { return HEAT_ICON____header_global_ac506f4adbfbe8d4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:640
export const BOTTOMSTATUSBAR____header_global_cd81c998ee7bb28d = ((((((2462) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fec3d1d12ee7f4d0d975b90f() {
  return __cxx_static_address_fec3d1d12ee7f4d0d975b90f.reference || (__cxx_static_address_fec3d1d12ee7f4d0d975b90f.reference = {
    __cReference: true,
    get value() { return BOTTOMSTATUSBAR____header_global_cd81c998ee7bb28d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:641
export const BOOT_ICON____header_global_da62244bf7d1d904 = ((((((2463) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7c0ec2d6dbe6c618345c3ada() {
  return __cxx_static_address_7c0ec2d6dbe6c618345c3ada.reference || (__cxx_static_address_7c0ec2d6dbe6c618345c3ada.reference = {
    __cReference: true,
    get value() { return BOOT_ICON____header_global_da62244bf7d1d904; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:642
export const FRAGBAR____header_global_3c6ca4776e4484da = ((((((2465) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dc1d863d3a0f3b41d82213fb() {
  return __cxx_static_address_dc1d863d3a0f3b41d82213fb.reference || (__cxx_static_address_dc1d863d3a0f3b41d82213fb.reference = {
    __cReference: true,
    get value() { return FRAGBAR____header_global_3c6ca4776e4484da; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:643
export const JETPACK_ICON____header_global_dfa1c5d19342192c = ((((((2467) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5997ce84d9d95934b3af8244() {
  return __cxx_static_address_5997ce84d9d95934b3af8244.reference || (__cxx_static_address_5997ce84d9d95934b3af8244.reference = {
    __cReference: true,
    get value() { return JETPACK_ICON____header_global_dfa1c5d19342192c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:644
export const AIRTANK_ICON____header_global_51e24179956e435c = ((((((2468) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8677e174ffc7bfc79c784e54() {
  return __cxx_static_address_8677e174ffc7bfc79c784e54.reference || (__cxx_static_address_8677e174ffc7bfc79c784e54.reference = {
    __cReference: true,
    get value() { return AIRTANK_ICON____header_global_51e24179956e435c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:645
export const STEROIDS_ICON____header_global_3be0a389aa72b8a8 = ((((((2469) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fc430759463e1bd9ff52dcbf() {
  return __cxx_static_address_fc430759463e1bd9ff52dcbf.reference || (__cxx_static_address_fc430759463e1bd9ff52dcbf.reference = {
    __cReference: true,
    get value() { return STEROIDS_ICON____header_global_3be0a389aa72b8a8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:646
export const HOLODUKE_ICON____header_global_d0196c8c1d440469 = ((((((2470) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_100dcafbced5d2020fba0d37() {
  return __cxx_static_address_100dcafbced5d2020fba0d37.reference || (__cxx_static_address_100dcafbced5d2020fba0d37.reference = {
    __cReference: true,
    get value() { return HOLODUKE_ICON____header_global_d0196c8c1d440469; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:647
export const ACCESS_ICON____header_global_f159d6c38d70e421 = ((((((2471) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5c4cd51e3255a2cc95904640() {
  return __cxx_static_address_5c4cd51e3255a2cc95904640.reference || (__cxx_static_address_5c4cd51e3255a2cc95904640.reference = {
    __cReference: true,
    get value() { return ACCESS_ICON____header_global_f159d6c38d70e421; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:648
export const DIGITALNUM____header_global_ecb48dcdb6f87093 = ((((((2472) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dfc243bcba51c67218d42bb0() {
  return __cxx_static_address_dfc243bcba51c67218d42bb0.reference || (__cxx_static_address_dfc243bcba51c67218d42bb0.reference = {
    __cReference: true,
    get value() { return DIGITALNUM____header_global_ecb48dcdb6f87093; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:649
export const DUKECAR____header_global_6d59a3d3969b9a05 = ((((((2491) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4106e66868862eaac23fc45e() {
  return __cxx_static_address_4106e66868862eaac23fc45e.reference || (__cxx_static_address_4106e66868862eaac23fc45e.reference = {
    __cReference: true,
    get value() { return DUKECAR____header_global_6d59a3d3969b9a05; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:650
export const CAMCORNER____header_global_292be2217c2f666c = ((((((2482) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6c15a56b00c97f3a9cb49264() {
  return __cxx_static_address_6c15a56b00c97f3a9cb49264.reference || (__cxx_static_address_6c15a56b00c97f3a9cb49264.reference = {
    __cReference: true,
    get value() { return CAMCORNER____header_global_292be2217c2f666c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:651
export const CAMLIGHT____header_global_70cfd60a06c7c18e = ((((((2484) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_04d9a17c8716ff449f924baf() {
  return __cxx_static_address_04d9a17c8716ff449f924baf.reference || (__cxx_static_address_04d9a17c8716ff449f924baf.reference = {
    __cReference: true,
    get value() { return CAMLIGHT____header_global_70cfd60a06c7c18e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:652
export const SLIDEBAR____header_global_993156b579a6f0a1 = ((((((2489) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_79c084f4c1551a9a6f4c16bd() {
  return __cxx_static_address_79c084f4c1551a9a6f4c16bd.reference || (__cxx_static_address_79c084f4c1551a9a6f4c16bd.reference = {
    __cReference: true,
    get value() { return SLIDEBAR____header_global_993156b579a6f0a1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:653
export const DREALMS____header_global_69ae7d31a920ff3d = ((((((2492) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cefe2ecfa7b3e9440100cbd1() {
  return __cxx_static_address_cefe2ecfa7b3e9440100cbd1.reference || (__cxx_static_address_cefe2ecfa7b3e9440100cbd1.reference = {
    __cReference: true,
    get value() { return DREALMS____header_global_69ae7d31a920ff3d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:654
export const BETASCREEN____header_global_4d1aac7741ddbbad = ((((((2493) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_90d8615f50471dc318cd8480() {
  return __cxx_static_address_90d8615f50471dc318cd8480.reference || (__cxx_static_address_90d8615f50471dc318cd8480.reference = {
    __cReference: true,
    get value() { return BETASCREEN____header_global_4d1aac7741ddbbad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:655
export const WINDOWBORDER1____header_global_8853423d1f0f7eef = ((((((2494) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6c4e470c2d3131351429cd34() {
  return __cxx_static_address_6c4e470c2d3131351429cd34.reference || (__cxx_static_address_6c4e470c2d3131351429cd34.reference = {
    __cReference: true,
    get value() { return WINDOWBORDER1____header_global_8853423d1f0f7eef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:656
export const TEXTBOX____header_global_dab372a3bdb323fe = ((((((2495) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_21b045f495bf328434ac0558() {
  return __cxx_static_address_21b045f495bf328434ac0558.reference || (__cxx_static_address_21b045f495bf328434ac0558.reference = {
    __cReference: true,
    get value() { return TEXTBOX____header_global_dab372a3bdb323fe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:657
export const WINDOWBORDER2____header_global_3f612e72dc539391 = ((((((2496) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_86201ec9a43800f5052d36c1() {
  return __cxx_static_address_86201ec9a43800f5052d36c1.reference || (__cxx_static_address_86201ec9a43800f5052d36c1.reference = {
    __cReference: true,
    get value() { return WINDOWBORDER2____header_global_3f612e72dc539391; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:658
export const DUKENUKEM____header_global_f49a2d9d2f5157aa = ((((((2497) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e306d9868c6275ece7127463() {
  return __cxx_static_address_e306d9868c6275ece7127463.reference || (__cxx_static_address_e306d9868c6275ece7127463.reference = {
    __cReference: true,
    get value() { return DUKENUKEM____header_global_f49a2d9d2f5157aa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:659
export const THREEDEE____header_global_9b4bc5ead2dc7dba = ((((((2498) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_82c2e412dd0afc07c16083c8() {
  return __cxx_static_address_82c2e412dd0afc07c16083c8.reference || (__cxx_static_address_82c2e412dd0afc07c16083c8.reference = {
    __cReference: true,
    get value() { return THREEDEE____header_global_9b4bc5ead2dc7dba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:660
export const INGAMEDUKETHREEDEE____header_global_980ea9f3e39eb2cf = ((((((2499) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e5529b28c80f544da4d6ab34() {
  return __cxx_static_address_e5529b28c80f544da4d6ab34.reference || (__cxx_static_address_e5529b28c80f544da4d6ab34.reference = {
    __cReference: true,
    get value() { return INGAMEDUKETHREEDEE____header_global_980ea9f3e39eb2cf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:661
export const TENSCREEN____header_global_ce3abeda25d08e53 = ((((((2500) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_652f120b40cf7527177ddf4c() {
  return __cxx_static_address_652f120b40cf7527177ddf4c.reference || (__cxx_static_address_652f120b40cf7527177ddf4c.reference = {
    __cReference: true,
    get value() { return TENSCREEN____header_global_ce3abeda25d08e53; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:662
export const PLUTOPAKSPRITE____header_global_7a3b9c6e310606bf = ((((((2501) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_93f1dcd3a4242e47e8cb6fb6() {
  return __cxx_static_address_93f1dcd3a4242e47e8cb6fb6.reference || (__cxx_static_address_93f1dcd3a4242e47e8cb6fb6.reference = {
    __cReference: true,
    get value() { return PLUTOPAKSPRITE____header_global_7a3b9c6e310606bf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:663
export const DEVISTATOR____header_global_c50010d99eabcf1c = ((((((2510) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6593ba81397424bfd9eb22d2() {
  return __cxx_static_address_6593ba81397424bfd9eb22d2.reference || (__cxx_static_address_6593ba81397424bfd9eb22d2.reference = {
    __cReference: true,
    get value() { return DEVISTATOR____header_global_c50010d99eabcf1c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:664
export const KNEE____header_global_bdce07929709db57 = ((((((2521) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fae5edba5af9930741a3638b() {
  return __cxx_static_address_fae5edba5af9930741a3638b.reference || (__cxx_static_address_fae5edba5af9930741a3638b.reference = {
    __cReference: true,
    get value() { return KNEE____header_global_bdce07929709db57; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:665
export const CROSSHAIR____header_global_7e456a51801141f0 = ((((((2523) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_704290a5677d51fd7024b513() {
  return __cxx_static_address_704290a5677d51fd7024b513.reference || (__cxx_static_address_704290a5677d51fd7024b513.reference = {
    __cReference: true,
    get value() { return CROSSHAIR____header_global_7e456a51801141f0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:666
export const FIRSTGUN____header_global_24d173689eb59fa4 = ((((((2524) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7cc10f205791173703f9ad59() {
  return __cxx_static_address_7cc10f205791173703f9ad59.reference || (__cxx_static_address_7cc10f205791173703f9ad59.reference = {
    __cReference: true,
    get value() { return FIRSTGUN____header_global_24d173689eb59fa4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:667
export const FIRSTGUNRELOAD____header_global_8cc98da2a763d8e6 = ((((((2528) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a6767123566dd8cf5866914d() {
  return __cxx_static_address_a6767123566dd8cf5866914d.reference || (__cxx_static_address_a6767123566dd8cf5866914d.reference = {
    __cReference: true,
    get value() { return FIRSTGUNRELOAD____header_global_8cc98da2a763d8e6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:668
export const SHELL____header_global_3a6e10a669fc57f8 = ((((((2533) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_78bee602bc38fafc954cdb48() {
  return __cxx_static_address_78bee602bc38fafc954cdb48.reference || (__cxx_static_address_78bee602bc38fafc954cdb48.reference = {
    __cReference: true,
    get value() { return SHELL____header_global_3a6e10a669fc57f8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:669
export const SHOTGUNSHELL____header_global_9964df3cff8ecc79 = ((((((2535) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4f32352db637000014ae6ded() {
  return __cxx_static_address_4f32352db637000014ae6ded.reference || (__cxx_static_address_4f32352db637000014ae6ded.reference = {
    __cReference: true,
    get value() { return SHOTGUNSHELL____header_global_9964df3cff8ecc79; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:670
export const CHAINGUN____header_global_fb0c9af2b4be2e02 = ((((((2536) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ff635596c54292046cb16441() {
  return __cxx_static_address_ff635596c54292046cb16441.reference || (__cxx_static_address_ff635596c54292046cb16441.reference = {
    __cReference: true,
    get value() { return CHAINGUN____header_global_fb0c9af2b4be2e02; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:671
export const RPGGUN____header_global_60bd4146efbe99c2 = ((((((2544) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5360822a4c8f49d3ea3734af() {
  return __cxx_static_address_5360822a4c8f49d3ea3734af.reference || (__cxx_static_address_5360822a4c8f49d3ea3734af.reference = {
    __cReference: true,
    get value() { return RPGGUN____header_global_60bd4146efbe99c2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:672
export const FREEZE____header_global_741f16269f786639 = ((((((2548) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_971cdbe384b1c401cc114b7b() {
  return __cxx_static_address_971cdbe384b1c401cc114b7b.reference || (__cxx_static_address_971cdbe384b1c401cc114b7b.reference = {
    __cReference: true,
    get value() { return FREEZE____header_global_741f16269f786639; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:673
export const SHRINKER____header_global_464dcd7586eb6856 = ((((((2556) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_09b5862c087a1c192bc704d6() {
  return __cxx_static_address_09b5862c087a1c192bc704d6.reference || (__cxx_static_address_09b5862c087a1c192bc704d6.reference = {
    __cReference: true,
    get value() { return SHRINKER____header_global_464dcd7586eb6856; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:674
export const HANDHOLDINGLASER____header_global_1aec050e0237e7a6 = ((((((2563) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d21509d30a332c015ad92271() {
  return __cxx_static_address_d21509d30a332c015ad92271.reference || (__cxx_static_address_d21509d30a332c015ad92271.reference = {
    __cReference: true,
    get value() { return HANDHOLDINGLASER____header_global_1aec050e0237e7a6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:675
export const TRIPBOMB____header_global_0e5946abb7ddbfaa = ((((((2566) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_525ed45bf384d1538af1bce7() {
  return __cxx_static_address_525ed45bf384d1538af1bce7.reference || (__cxx_static_address_525ed45bf384d1538af1bce7.reference = {
    __cReference: true,
    get value() { return TRIPBOMB____header_global_0e5946abb7ddbfaa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:676
export const LASERLINE____header_global_c5a488ddf7c3ca59 = ((((((2567) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b8d25b395ff5af8e8f90e13b() {
  return __cxx_static_address_b8d25b395ff5af8e8f90e13b.reference || (__cxx_static_address_b8d25b395ff5af8e8f90e13b.reference = {
    __cReference: true,
    get value() { return LASERLINE____header_global_c5a488ddf7c3ca59; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:677
export const HANDHOLDINGACCESS____header_global_b01dbacd512e327f = ((((((2568) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_39756254dc367f64076a4e68() {
  return __cxx_static_address_39756254dc367f64076a4e68.reference || (__cxx_static_address_39756254dc367f64076a4e68.reference = {
    __cReference: true,
    get value() { return HANDHOLDINGACCESS____header_global_b01dbacd512e327f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:678
export const HANDREMOTE____header_global_572823e030e5d5a6 = ((((((2570) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bc85c2258ac57254c0952d71() {
  return __cxx_static_address_bc85c2258ac57254c0952d71.reference || (__cxx_static_address_bc85c2258ac57254c0952d71.reference = {
    __cReference: true,
    get value() { return HANDREMOTE____header_global_572823e030e5d5a6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:679
export const HANDTHROW____header_global_b5b2c1fb64af42d3 = ((((((2573) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3b983b7358cc5c19e09c81bd() {
  return __cxx_static_address_3b983b7358cc5c19e09c81bd.reference || (__cxx_static_address_3b983b7358cc5c19e09c81bd.reference = {
    __cReference: true,
    get value() { return HANDTHROW____header_global_b5b2c1fb64af42d3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:680
export const TIP____header_global_e5c51f038f69dd6c = ((((((2576) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6b3de468670ef9c35f94f398() {
  return __cxx_static_address_6b3de468670ef9c35f94f398.reference || (__cxx_static_address_6b3de468670ef9c35f94f398.reference = {
    __cReference: true,
    get value() { return TIP____header_global_e5c51f038f69dd6c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:681
export const SCUBAMASK____header_global_d094e3b6dbef8e94 = ((((((2581) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6cbcf1c607f67325aacd209c() {
  return __cxx_static_address_6cbcf1c607f67325aacd209c.reference || (__cxx_static_address_6cbcf1c607f67325aacd209c.reference = {
    __cReference: true,
    get value() { return SCUBAMASK____header_global_d094e3b6dbef8e94; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:682
export const FORCESPHERE____header_global_aa129d8e6073706f = ((((((2590) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3d75efe00f73cf90ac28bf16() {
  return __cxx_static_address_3d75efe00f73cf90ac28bf16.reference || (__cxx_static_address_3d75efe00f73cf90ac28bf16.reference = {
    __cReference: true,
    get value() { return FORCESPHERE____header_global_aa129d8e6073706f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:683
export const SHOTSPARK1____header_global_9384b321aebd1b4f = ((((((2595) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ca203fd1744c2c7634dcfc93() {
  return __cxx_static_address_ca203fd1744c2c7634dcfc93.reference || (__cxx_static_address_ca203fd1744c2c7634dcfc93.reference = {
    __cReference: true,
    get value() { return SHOTSPARK1____header_global_9384b321aebd1b4f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:684
export const RPG____header_global_bcbeaa6f95c58868 = ((((((2605) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9b01a08183f831a30b6004ed() {
  return __cxx_static_address_9b01a08183f831a30b6004ed.reference || (__cxx_static_address_9b01a08183f831a30b6004ed.reference = {
    __cReference: true,
    get value() { return RPG____header_global_bcbeaa6f95c58868; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:685
export const LASERSITE____header_global_7c66742979c226cb = ((((((2612) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d493347f9bebee0acec3cd3c() {
  return __cxx_static_address_d493347f9bebee0acec3cd3c.reference || (__cxx_static_address_d493347f9bebee0acec3cd3c.reference = {
    __cReference: true,
    get value() { return LASERSITE____header_global_7c66742979c226cb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:686
export const SHOTGUN____header_global_328dd75a2457f7bd = ((((((2613) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_989754a86f571b0887060a9c() {
  return __cxx_static_address_989754a86f571b0887060a9c.reference || (__cxx_static_address_989754a86f571b0887060a9c.reference = {
    __cReference: true,
    get value() { return SHOTGUN____header_global_328dd75a2457f7bd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:687
export const BOSS1____header_global_582ad784d4b9d38f = ((((((2630) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_22a4416db063b29048d36562() {
  return __cxx_static_address_22a4416db063b29048d36562.reference || (__cxx_static_address_22a4416db063b29048d36562.reference = {
    __cReference: true,
    get value() { return BOSS1____header_global_582ad784d4b9d38f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:688
export const BOSS1STAYPUT____header_global_9d3686086b6043bf = ((((((2631) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d03a5b7681047f68f1fa69d6() {
  return __cxx_static_address_d03a5b7681047f68f1fa69d6.reference || (__cxx_static_address_d03a5b7681047f68f1fa69d6.reference = {
    __cReference: true,
    get value() { return BOSS1STAYPUT____header_global_9d3686086b6043bf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:689
export const BOSS1SHOOT____header_global_3e4242254ff760f7 = ((((((2660) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dfa98d143f3ddd54d017a802() {
  return __cxx_static_address_dfa98d143f3ddd54d017a802.reference || (__cxx_static_address_dfa98d143f3ddd54d017a802.reference = {
    __cReference: true,
    get value() { return BOSS1SHOOT____header_global_3e4242254ff760f7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:690
export const BOSS1LOB____header_global_409232cbb5dfa3a2 = ((((((2670) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f1d51695858722781765c421() {
  return __cxx_static_address_f1d51695858722781765c421.reference || (__cxx_static_address_f1d51695858722781765c421.reference = {
    __cReference: true,
    get value() { return BOSS1LOB____header_global_409232cbb5dfa3a2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:691
export const BOSSTOP____header_global_7bc44c315c5d7981 = ((((((2696) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0dafcd46d9ad4fab945421f2() {
  return __cxx_static_address_0dafcd46d9ad4fab945421f2.reference || (__cxx_static_address_0dafcd46d9ad4fab945421f2.reference = {
    __cReference: true,
    get value() { return BOSSTOP____header_global_7bc44c315c5d7981; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:692
export const BOSS2____header_global_fb0248b51c2a5af6 = ((((((2710) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_740b8a9e359518af419ec2f5() {
  return __cxx_static_address_740b8a9e359518af419ec2f5.reference || (__cxx_static_address_740b8a9e359518af419ec2f5.reference = {
    __cReference: true,
    get value() { return BOSS2____header_global_fb0248b51c2a5af6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:693
export const BOSS3____header_global_912b0918b4c46e4e = ((((((2760) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a5e64bea2c0f70df29e2dea1() {
  return __cxx_static_address_a5e64bea2c0f70df29e2dea1.reference || (__cxx_static_address_a5e64bea2c0f70df29e2dea1.reference = {
    __cReference: true,
    get value() { return BOSS3____header_global_912b0918b4c46e4e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:694
export const SPINNINGNUKEICON____header_global_f1df830731386b81 = ((((((2813) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b07b301a86ae5341810d1fec() {
  return __cxx_static_address_b07b301a86ae5341810d1fec.reference || (__cxx_static_address_b07b301a86ae5341810d1fec.reference = {
    __cReference: true,
    get value() { return SPINNINGNUKEICON____header_global_f1df830731386b81; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:695
export const SMALLFNTCURSOR____header_global_8dc10ae5ab541dd6 = ((((((2821) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e08bd6585e7084fbeb6e9644() {
  return __cxx_static_address_e08bd6585e7084fbeb6e9644.reference || (__cxx_static_address_e08bd6585e7084fbeb6e9644.reference = {
    __cReference: true,
    get value() { return SMALLFNTCURSOR____header_global_8dc10ae5ab541dd6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:696
export const STARTALPHANUM____header_global_e64abf0601b1f95e = ((((((2822) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_620e2927f3cfdf2c7a71a5fa() {
  return __cxx_static_address_620e2927f3cfdf2c7a71a5fa.reference || (__cxx_static_address_620e2927f3cfdf2c7a71a5fa.reference = {
    __cReference: true,
    get value() { return STARTALPHANUM____header_global_e64abf0601b1f95e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:697
export const ENDALPHANUM____header_global_999761948b4149b5 = ((((((2915) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2865ef8ad824445b2a81788e() {
  return __cxx_static_address_2865ef8ad824445b2a81788e.reference || (__cxx_static_address_2865ef8ad824445b2a81788e.reference = {
    __cReference: true,
    get value() { return ENDALPHANUM____header_global_999761948b4149b5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:698
export const BIGALPHANUM____header_global_ced86b837e0ceb15 = ((((((2940) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c7652202fc514988b2548eaa() {
  return __cxx_static_address_c7652202fc514988b2548eaa.reference || (__cxx_static_address_c7652202fc514988b2548eaa.reference = {
    __cReference: true,
    get value() { return BIGALPHANUM____header_global_ced86b837e0ceb15; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:699
export const BIGPERIOD____header_global_97681d9dae555631 = ((((((3002) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_074f40b54d8916f97f10c89c() {
  return __cxx_static_address_074f40b54d8916f97f10c89c.reference || (__cxx_static_address_074f40b54d8916f97f10c89c.reference = {
    __cReference: true,
    get value() { return BIGPERIOD____header_global_97681d9dae555631; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:700
export const BIGCOMMA____header_global_a636b83e518e2f3f = ((((((3003) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ca6ca5965d0d579f02122798() {
  return __cxx_static_address_ca6ca5965d0d579f02122798.reference || (__cxx_static_address_ca6ca5965d0d579f02122798.reference = {
    __cReference: true,
    get value() { return BIGCOMMA____header_global_a636b83e518e2f3f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:701
export const BIGX____header_global_9d0ac7f19b599a5e = ((((((3004) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_44e620bfb4f0eb243dd665b7() {
  return __cxx_static_address_44e620bfb4f0eb243dd665b7.reference || (__cxx_static_address_44e620bfb4f0eb243dd665b7.reference = {
    __cReference: true,
    get value() { return BIGX____header_global_9d0ac7f19b599a5e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:702
export const BIGQ____header_global_c306d5cfc8ef7113 = ((((((3005) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a07a69f812d8e445a1b11177() {
  return __cxx_static_address_a07a69f812d8e445a1b11177.reference || (__cxx_static_address_a07a69f812d8e445a1b11177.reference = {
    __cReference: true,
    get value() { return BIGQ____header_global_c306d5cfc8ef7113; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:703
export const BIGSEMI____header_global_2c5b0bf583aa31c3 = ((((((3006) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_95a6f000a223ecabacca2af7() {
  return __cxx_static_address_95a6f000a223ecabacca2af7.reference || (__cxx_static_address_95a6f000a223ecabacca2af7.reference = {
    __cReference: true,
    get value() { return BIGSEMI____header_global_2c5b0bf583aa31c3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:704
export const BIGCOLIN____header_global_4634aa562827caf2 = ((((((3007) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cffb82604c25410f690da2a4() {
  return __cxx_static_address_cffb82604c25410f690da2a4.reference || (__cxx_static_address_cffb82604c25410f690da2a4.reference = {
    __cReference: true,
    get value() { return BIGCOLIN____header_global_4634aa562827caf2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:705
export const THREEBYFIVE____header_global_f92c4ba75ad11991 = ((((((3010) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_67fab7e66c0505d008e04548() {
  return __cxx_static_address_67fab7e66c0505d008e04548.reference || (__cxx_static_address_67fab7e66c0505d008e04548.reference = {
    __cReference: true,
    get value() { return THREEBYFIVE____header_global_f92c4ba75ad11991; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:706
export const BIGAPPOS____header_global_37926f9789edc4d7 = ((((((3022) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1eb3dc6aef13108a092d80bc() {
  return __cxx_static_address_1eb3dc6aef13108a092d80bc.reference || (__cxx_static_address_1eb3dc6aef13108a092d80bc.reference = {
    __cReference: true,
    get value() { return BIGAPPOS____header_global_37926f9789edc4d7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:707
export const MINIFONT____header_global_751ac430c3924eaa = ((((((3072) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b2ec7da998ea976522300b8a() {
  return __cxx_static_address_b2ec7da998ea976522300b8a.reference || (__cxx_static_address_b2ec7da998ea976522300b8a.reference = {
    __cReference: true,
    get value() { return MINIFONT____header_global_751ac430c3924eaa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:708
export const RESPAWNMARKERRED____header_global_6f408bc5cebf95c7 = ((((((3190) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_78e0ef9d922fbfa5eadf2d18() {
  return __cxx_static_address_78e0ef9d922fbfa5eadf2d18.reference || (__cxx_static_address_78e0ef9d922fbfa5eadf2d18.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERRED____header_global_6f408bc5cebf95c7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:709
export const RESPAWNMARKERYELLOW____header_global_f795863f16a97254 = ((((((3200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9a196d040412679e8acec89c() {
  return __cxx_static_address_9a196d040412679e8acec89c.reference || (__cxx_static_address_9a196d040412679e8acec89c.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERYELLOW____header_global_f795863f16a97254; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:710
export const RESPAWNMARKERGREEN____header_global_8e997076635c8ebb = ((((((3210) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0e092d7b8b8217c7d7af4e0a() {
  return __cxx_static_address_0e092d7b8b8217c7d7af4e0a.reference || (__cxx_static_address_0e092d7b8b8217c7d7af4e0a.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERGREEN____header_global_8e997076635c8ebb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:711
export const BONUSSCREEN____header_global_f16c309b38c83a72 = ((((((3240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0ac34cd5b359e702e90f19eb() {
  return __cxx_static_address_0ac34cd5b359e702e90f19eb.reference || (__cxx_static_address_0ac34cd5b359e702e90f19eb.reference = {
    __cReference: true,
    get value() { return BONUSSCREEN____header_global_f16c309b38c83a72; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:712
export const VIEWBORDER____header_global_6e4aa8ccbe29962e = ((((((3250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_44b78cce4deadee922d5fc63() {
  return __cxx_static_address_44b78cce4deadee922d5fc63.reference || (__cxx_static_address_44b78cce4deadee922d5fc63.reference = {
    __cReference: true,
    get value() { return VIEWBORDER____header_global_6e4aa8ccbe29962e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:713
export const VICTORY1____header_global_eed3b526477fdd6e = ((((((3260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_33ef0705185e6498173e611c() {
  return __cxx_static_address_33ef0705185e6498173e611c.reference || (__cxx_static_address_33ef0705185e6498173e611c.reference = {
    __cReference: true,
    get value() { return VICTORY1____header_global_eed3b526477fdd6e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:714
export const ORDERING____header_global_126afd6ec22a394d = ((((((3270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3ac61158d67ca2e0eb3ec304() {
  return __cxx_static_address_3ac61158d67ca2e0eb3ec304.reference || (__cxx_static_address_3ac61158d67ca2e0eb3ec304.reference = {
    __cReference: true,
    get value() { return ORDERING____header_global_126afd6ec22a394d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:715
export const TEXTSTORY____header_global_a7a2e8805f13c20e = ((((((3280) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8fb95e670f2b507acc373a77() {
  return __cxx_static_address_8fb95e670f2b507acc373a77.reference || (__cxx_static_address_8fb95e670f2b507acc373a77.reference = {
    __cReference: true,
    get value() { return TEXTSTORY____header_global_a7a2e8805f13c20e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:716
export const LOADSCREEN____header_global_3dc877b956f6019b = ((((((3281) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6b9bedfc4d42df97c5083d72() {
  return __cxx_static_address_6b9bedfc4d42df97c5083d72.reference || (__cxx_static_address_6b9bedfc4d42df97c5083d72.reference = {
    __cReference: true,
    get value() { return LOADSCREEN____header_global_3dc877b956f6019b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:717
export const BORNTOBEWILDSCREEN____header_global_84d2de54fa496f22 = ((((((3370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_36330b82c8eb36de8a162451() {
  return __cxx_static_address_36330b82c8eb36de8a162451.reference || (__cxx_static_address_36330b82c8eb36de8a162451.reference = {
    __cReference: true,
    get value() { return BORNTOBEWILDSCREEN____header_global_84d2de54fa496f22; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:718
export const BLIMP____header_global_37141c41ee2affdd = ((((((3400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_139a9a2999b31cd79bd8e2ae() {
  return __cxx_static_address_139a9a2999b31cd79bd8e2ae.reference || (__cxx_static_address_139a9a2999b31cd79bd8e2ae.reference = {
    __cReference: true,
    get value() { return BLIMP____header_global_37141c41ee2affdd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:719
export const FEM9____header_global_dc8f20c414d7d75b = ((((((3450) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_903213983505d45cde9be218() {
  return __cxx_static_address_903213983505d45cde9be218.reference || (__cxx_static_address_903213983505d45cde9be218.reference = {
    __cReference: true,
    get value() { return FEM9____header_global_dc8f20c414d7d75b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:720
export const FRAMEEFFECT1_13____header_global_2caa4fdf693cd5aa = ((((((3999) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c9d244b46847f0e8bd292053() {
  return __cxx_static_address_c9d244b46847f0e8bd292053.reference || (__cxx_static_address_c9d244b46847f0e8bd292053.reference = {
    __cReference: true,
    get value() { return FRAMEEFFECT1_13____header_global_2caa4fdf693cd5aa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:721
export const FRAMEEFFECT1____header_global_df96325f46ab5025 = ((((((4095) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ea24662368386244d98e2df3() {
  return __cxx_static_address_ea24662368386244d98e2df3.reference || (__cxx_static_address_ea24662368386244d98e2df3.reference = {
    __cReference: true,
    get value() { return FRAMEEFFECT1____header_global_df96325f46ab5025; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:722
export const PANNEL3____header_global_4904a7c3bcc9d0ee = ((((((4099) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_336ed14ce671f2366e51d69e() {
  return __cxx_static_address_336ed14ce671f2366e51d69e.reference || (__cxx_static_address_336ed14ce671f2366e51d69e.reference = {
    __cReference: true,
    get value() { return PANNEL3____header_global_4904a7c3bcc9d0ee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:723
export const SCREENBREAK14____header_global_dbd2add5b938579f = ((((((4120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_29df80ea467a9b2be43f23da() {
  return __cxx_static_address_29df80ea467a9b2be43f23da.reference || (__cxx_static_address_29df80ea467a9b2be43f23da.reference = {
    __cReference: true,
    get value() { return SCREENBREAK14____header_global_dbd2add5b938579f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:724
export const SCREENBREAK15____header_global_eb4bae0678f7927d = ((((((4123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e9d43aeff344864f7b7ad50f() {
  return __cxx_static_address_e9d43aeff344864f7b7ad50f.reference || (__cxx_static_address_e9d43aeff344864f7b7ad50f.reference = {
    __cReference: true,
    get value() { return SCREENBREAK15____header_global_eb4bae0678f7927d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:725
export const SCREENBREAK19____header_global_b25165d874ce94f2 = ((((((4125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e12f8c0537df1aea0bdffbc3() {
  return __cxx_static_address_e12f8c0537df1aea0bdffbc3.reference || (__cxx_static_address_e12f8c0537df1aea0bdffbc3.reference = {
    __cReference: true,
    get value() { return SCREENBREAK19____header_global_b25165d874ce94f2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:726
export const SCREENBREAK16____header_global_d0a2ff7e8c061245 = ((((((4127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ab799e1fd14718ca6f3a962f() {
  return __cxx_static_address_ab799e1fd14718ca6f3a962f.reference || (__cxx_static_address_ab799e1fd14718ca6f3a962f.reference = {
    __cReference: true,
    get value() { return SCREENBREAK16____header_global_d0a2ff7e8c061245; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:727
export const SCREENBREAK17____header_global_ae5c79c3b18ef7d0 = ((((((4128) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a0853a673bb21597a0a847ea() {
  return __cxx_static_address_a0853a673bb21597a0a847ea.reference || (__cxx_static_address_a0853a673bb21597a0a847ea.reference = {
    __cReference: true,
    get value() { return SCREENBREAK17____header_global_ae5c79c3b18ef7d0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:728
export const SCREENBREAK18____header_global_d3867e11fc64fb5a = ((((((4129) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4d5047b02d798eca2b377b10() {
  return __cxx_static_address_4d5047b02d798eca2b377b10.reference || (__cxx_static_address_4d5047b02d798eca2b377b10.reference = {
    __cReference: true,
    get value() { return SCREENBREAK18____header_global_d3867e11fc64fb5a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:729
export const W_TECHWALL11____header_global_b84381ce79bbb0f3 = ((((((4130) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_56d5e92696bb6cee46ee77d6() {
  return __cxx_static_address_56d5e92696bb6cee46ee77d6.reference || (__cxx_static_address_56d5e92696bb6cee46ee77d6.reference = {
    __cReference: true,
    get value() { return W_TECHWALL11____header_global_b84381ce79bbb0f3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:730
export const W_TECHWALL12____header_global_e47073730526e451 = ((((((4131) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2c4b71a43435f74319a51a1c() {
  return __cxx_static_address_2c4b71a43435f74319a51a1c.reference || (__cxx_static_address_2c4b71a43435f74319a51a1c.reference = {
    __cReference: true,
    get value() { return W_TECHWALL12____header_global_e47073730526e451; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:731
export const W_TECHWALL13____header_global_b6b63f18db5ea539 = ((((((4132) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_791f6919b38fa18412eea660() {
  return __cxx_static_address_791f6919b38fa18412eea660.reference || (__cxx_static_address_791f6919b38fa18412eea660.reference = {
    __cReference: true,
    get value() { return W_TECHWALL13____header_global_b6b63f18db5ea539; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:732
export const W_TECHWALL14____header_global_be24e6bedafd03cb = ((((((4133) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f2ed160afbd181447b00eb42() {
  return __cxx_static_address_f2ed160afbd181447b00eb42.reference || (__cxx_static_address_f2ed160afbd181447b00eb42.reference = {
    __cReference: true,
    get value() { return W_TECHWALL14____header_global_be24e6bedafd03cb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:733
export const W_TECHWALL5____header_global_d3519d6da98cc228 = ((((((4134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f8e9ff0014629411b157ed8f() {
  return __cxx_static_address_f8e9ff0014629411b157ed8f.reference || (__cxx_static_address_f8e9ff0014629411b157ed8f.reference = {
    __cReference: true,
    get value() { return W_TECHWALL5____header_global_d3519d6da98cc228; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:734
export const W_TECHWALL6____header_global_a5e265d7747bd601 = ((((((4136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e4aefca339af77d7116959b3() {
  return __cxx_static_address_e4aefca339af77d7116959b3.reference || (__cxx_static_address_e4aefca339af77d7116959b3.reference = {
    __cReference: true,
    get value() { return W_TECHWALL6____header_global_a5e265d7747bd601; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:735
export const W_TECHWALL7____header_global_140ee9e27926730a = ((((((4138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8f37f091bb62039ff01b1744() {
  return __cxx_static_address_8f37f091bb62039ff01b1744.reference || (__cxx_static_address_8f37f091bb62039ff01b1744.reference = {
    __cReference: true,
    get value() { return W_TECHWALL7____header_global_140ee9e27926730a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:736
export const W_TECHWALL8____header_global_da078249ce0f047d = ((((((4140) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f9fb4f53f1bda467601fbf30() {
  return __cxx_static_address_f9fb4f53f1bda467601fbf30.reference || (__cxx_static_address_f9fb4f53f1bda467601fbf30.reference = {
    __cReference: true,
    get value() { return W_TECHWALL8____header_global_da078249ce0f047d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:737
export const W_TECHWALL9____header_global_e928a25c7668154a = ((((((4142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_064af1dd66da6dd58ea62ddc() {
  return __cxx_static_address_064af1dd66da6dd58ea62ddc.reference || (__cxx_static_address_064af1dd66da6dd58ea62ddc.reference = {
    __cReference: true,
    get value() { return W_TECHWALL9____header_global_e928a25c7668154a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:738
export const BPANNEL3____header_global_a283ef15e75e4ced = ((((((4100) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ab035dafc67fe051117226c0() {
  return __cxx_static_address_ab035dafc67fe051117226c0.reference || (__cxx_static_address_ab035dafc67fe051117226c0.reference = {
    __cReference: true,
    get value() { return BPANNEL3____header_global_a283ef15e75e4ced; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:739
export const W_HITTECHWALL16____header_global_87dfd4da53931106 = ((((((4144) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8db12555dc816eaf74a51b5d() {
  return __cxx_static_address_8db12555dc816eaf74a51b5d.reference || (__cxx_static_address_8db12555dc816eaf74a51b5d.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL16____header_global_87dfd4da53931106; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:740
export const W_HITTECHWALL10____header_global_5abbdfabd24083bb = ((((((4145) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9cb9a5a0024d415209c0a3ff() {
  return __cxx_static_address_9cb9a5a0024d415209c0a3ff.reference || (__cxx_static_address_9cb9a5a0024d415209c0a3ff.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL10____header_global_5abbdfabd24083bb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:741
export const W_HITTECHWALL15____header_global_e49391088e173487 = ((((((4147) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b762e6f9feba5e589b167d9d() {
  return __cxx_static_address_b762e6f9feba5e589b167d9d.reference || (__cxx_static_address_b762e6f9feba5e589b167d9d.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL15____header_global_e49391088e173487; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:742
export const W_MILKSHELF____header_global_5e0daaab0f20edf0 = ((((((4181) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_39b628028ec464f24a110cab() {
  return __cxx_static_address_39b628028ec464f24a110cab.reference || (__cxx_static_address_39b628028ec464f24a110cab.reference = {
    __cReference: true,
    get value() { return W_MILKSHELF____header_global_5e0daaab0f20edf0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:743
export const W_MILKSHELFBROKE____header_global_c56d060452ff3419 = ((((((4203) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fe387e59cbb398445d374b2d() {
  return __cxx_static_address_fe387e59cbb398445d374b2d.reference || (__cxx_static_address_fe387e59cbb398445d374b2d.reference = {
    __cReference: true,
    get value() { return W_MILKSHELFBROKE____header_global_c56d060452ff3419; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:744
export const PURPLELAVA____header_global_e7d6a015bfd9b958 = ((((((4240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7d7f9a87fb9c44d30c548014() {
  return __cxx_static_address_7d7f9a87fb9c44d30c548014.reference || (__cxx_static_address_7d7f9a87fb9c44d30c548014.reference = {
    __cReference: true,
    get value() { return PURPLELAVA____header_global_e7d6a015bfd9b958; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:745
export const TARGET____header_global_e5ee261251a38022 = ((((((4359) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_385f601f5f17bb48d18c6859() {
  return __cxx_static_address_385f601f5f17bb48d18c6859.reference || (__cxx_static_address_385f601f5f17bb48d18c6859.reference = {
    __cReference: true,
    get value() { return TARGET____header_global_e5ee261251a38022; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:746
export const DUCK____header_global_232cc568552b1ce1 = ((((((4361) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1b73462a7dad03bb0b3b3fca() {
  return __cxx_static_address_1b73462a7dad03bb0b3b3fca.reference || (__cxx_static_address_1b73462a7dad03bb0b3b3fca.reference = {
    __cReference: true,
    get value() { return DUCK____header_global_232cc568552b1ce1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:747
export const PUKE____header_global_62fd1bedf7839d00 = ((((((4389) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b8cd8ced9a7a25835ba8b7ce() {
  return __cxx_static_address_b8cd8ced9a7a25835ba8b7ce.reference || (__cxx_static_address_b8cd8ced9a7a25835ba8b7ce.reference = {
    __cReference: true,
    get value() { return PUKE____header_global_62fd1bedf7839d00; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:748
export const DOORTILE23____header_global_1033d8e4571ea295 = ((((((4391) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b3d321cf7c8dbefd191eb5ed() {
  return __cxx_static_address_b3d321cf7c8dbefd191eb5ed.reference || (__cxx_static_address_b3d321cf7c8dbefd191eb5ed.reference = {
    __cReference: true,
    get value() { return DOORTILE23____header_global_1033d8e4571ea295; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:749
export const SPEAKER____header_global_268a927426de879b = ((((((4397) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_45e2b225d25dc6507943fca0() {
  return __cxx_static_address_45e2b225d25dc6507943fca0.reference || (__cxx_static_address_45e2b225d25dc6507943fca0.reference = {
    __cReference: true,
    get value() { return SPEAKER____header_global_268a927426de879b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:750
export const MAIL____header_global_436ee91f421fade2 = ((((((4410) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8ec67672a9484a73e90b3509() {
  return __cxx_static_address_8ec67672a9484a73e90b3509.reference || (__cxx_static_address_8ec67672a9484a73e90b3509.reference = {
    __cReference: true,
    get value() { return MAIL____header_global_436ee91f421fade2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:751
export const HOTMEAT____header_global_620145cb5ce6b421 = ((((((4427) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a1759a72283a720b0db3b102() {
  return __cxx_static_address_a1759a72283a720b0db3b102.reference || (__cxx_static_address_a1759a72283a720b0db3b102.reference = {
    __cReference: true,
    get value() { return HOTMEAT____header_global_620145cb5ce6b421; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:752
export const TRIPODCAMERA____header_global_11b25780618d7677 = ((((((4444) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b6fdc6acd57d12d7e5adaa31() {
  return __cxx_static_address_b6fdc6acd57d12d7e5adaa31.reference || (__cxx_static_address_b6fdc6acd57d12d7e5adaa31.reference = {
    __cReference: true,
    get value() { return TRIPODCAMERA____header_global_11b25780618d7677; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:753
export const PAPER____header_global_6844130301342916 = ((((((4460) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d8353e4990d77fac174abf42() {
  return __cxx_static_address_d8353e4990d77fac174abf42.reference || (__cxx_static_address_d8353e4990d77fac174abf42.reference = {
    __cReference: true,
    get value() { return PAPER____header_global_6844130301342916; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:754
export const GENERICPOLE2____header_global_bae17128e2e35a2b = ((((((4465) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aa40a8fac60ebfd99dcd5140() {
  return __cxx_static_address_aa40a8fac60ebfd99dcd5140.reference || (__cxx_static_address_aa40a8fac60ebfd99dcd5140.reference = {
    __cReference: true,
    get value() { return GENERICPOLE2____header_global_bae17128e2e35a2b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:755
export const XXXSTACY____header_global_15cfaf7917955206 = ((((((4470) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8061e4fd9996560df2c61aff() {
  return __cxx_static_address_8061e4fd9996560df2c61aff.reference || (__cxx_static_address_8061e4fd9996560df2c61aff.reference = {
    __cReference: true,
    get value() { return XXXSTACY____header_global_15cfaf7917955206; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:756
export const LETTER____header_global_6f148cdb37317c7d = ((((((4502) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1f1c3d65c029fd855267a3b5() {
  return __cxx_static_address_1f1c3d65c029fd855267a3b5.reference || (__cxx_static_address_1f1c3d65c029fd855267a3b5.reference = {
    __cReference: true,
    get value() { return LETTER____header_global_6f148cdb37317c7d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:757
export const SIDEBOLT1____header_global_649291948d9b783d = ((((((4525) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8aae5363ffab74867b6dcf3a() {
  return __cxx_static_address_8aae5363ffab74867b6dcf3a.reference || (__cxx_static_address_8aae5363ffab74867b6dcf3a.reference = {
    __cReference: true,
    get value() { return SIDEBOLT1____header_global_649291948d9b783d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:758
export const FOODOBJECT16____header_global_5a17daaec14ccfbb = ((((((4545) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8b6dd084d1093e2dea7e9142() {
  return __cxx_static_address_8b6dd084d1093e2dea7e9142.reference || (__cxx_static_address_8b6dd084d1093e2dea7e9142.reference = {
    __cReference: true,
    get value() { return FOODOBJECT16____header_global_5a17daaec14ccfbb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:759
export const TAMPON____header_global_1198b85e8f29b2db = ((((((4557) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8abb13527631c2d03aa54538() {
  return __cxx_static_address_8abb13527631c2d03aa54538.reference || (__cxx_static_address_8abb13527631c2d03aa54538.reference = {
    __cReference: true,
    get value() { return TAMPON____header_global_1198b85e8f29b2db; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:760
export const CANWITHSOMETHING2____header_global_19dba6b7cfb190bf = ((((((4580) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0793051a5ccfae9d01299b02() {
  return __cxx_static_address_0793051a5ccfae9d01299b02.reference || (__cxx_static_address_0793051a5ccfae9d01299b02.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING2____header_global_19dba6b7cfb190bf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:761
export const CANWITHSOMETHING3____header_global_201c651300d3397e = ((((((4581) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_834f51812b5f715774f045b6() {
  return __cxx_static_address_834f51812b5f715774f045b6.reference || (__cxx_static_address_834f51812b5f715774f045b6.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING3____header_global_201c651300d3397e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:762
export const CANWITHSOMETHING4____header_global_6eb2f198cb09729b = ((((((4582) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_649b22540d633e936e839f3e() {
  return __cxx_static_address_649b22540d633e936e839f3e.reference || (__cxx_static_address_649b22540d633e936e839f3e.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING4____header_global_6eb2f198cb09729b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:763
export const DOLPHIN1____header_global_79ceb7ed8e2c336e = ((((((4591) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_36e256544e4f2c9301610923() {
  return __cxx_static_address_36e256544e4f2c9301610923.reference || (__cxx_static_address_36e256544e4f2c9301610923.reference = {
    __cReference: true,
    get value() { return DOLPHIN1____header_global_79ceb7ed8e2c336e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:764
export const DOLPHIN2____header_global_102d1bc2823607a2 = ((((((4592) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a5715c42ec4f64fae3c4481e() {
  return __cxx_static_address_a5715c42ec4f64fae3c4481e.reference || (__cxx_static_address_a5715c42ec4f64fae3c4481e.reference = {
    __cReference: true,
    get value() { return DOLPHIN2____header_global_102d1bc2823607a2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:765
export const NEWBEAST____header_global_c52ca91735afee56 = ((((((4610) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ce5e13fe8b195860b02aea9e() {
  return __cxx_static_address_ce5e13fe8b195860b02aea9e.reference || (__cxx_static_address_ce5e13fe8b195860b02aea9e.reference = {
    __cReference: true,
    get value() { return NEWBEAST____header_global_c52ca91735afee56; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:766
export const NEWBEASTSTAYPUT____header_global_f066224e075f83e5 = ((((((4611) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_345d4f981e816fa31a406ee5() {
  return __cxx_static_address_345d4f981e816fa31a406ee5.reference || (__cxx_static_address_345d4f981e816fa31a406ee5.reference = {
    __cReference: true,
    get value() { return NEWBEASTSTAYPUT____header_global_f066224e075f83e5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:767
export const BOSS4____header_global_adfd372e7d18e0e8 = ((((((4740) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1ef1b9d0eef35821332be2fa() {
  return __cxx_static_address_1ef1b9d0eef35821332be2fa.reference || (__cxx_static_address_1ef1b9d0eef35821332be2fa.reference = {
    __cReference: true,
    get value() { return BOSS4____header_global_adfd372e7d18e0e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:768
export const BOSS4STAYPUT____header_global_7a05df6ca13588da = ((((((4741) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c73ec52f3bd37d3cc4b18a58() {
  return __cxx_static_address_c73ec52f3bd37d3cc4b18a58.reference || (__cxx_static_address_c73ec52f3bd37d3cc4b18a58.reference = {
    __cReference: true,
    get value() { return BOSS4STAYPUT____header_global_7a05df6ca13588da; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:769
export const FEM10____header_global_6834c36832dbab28 = ((((((4864) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5bf05380e580bd1f35431940() {
  return __cxx_static_address_5bf05380e580bd1f35431940.reference || (__cxx_static_address_5bf05380e580bd1f35431940.reference = {
    __cReference: true,
    get value() { return FEM10____header_global_6834c36832dbab28; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:770
export const TOUGHGAL____header_global_a2ee6e349a017dcc = ((((((4866) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f2c567bfacf32225c2757ed0() {
  return __cxx_static_address_f2c567bfacf32225c2757ed0.reference || (__cxx_static_address_f2c567bfacf32225c2757ed0.reference = {
    __cReference: true,
    get value() { return TOUGHGAL____header_global_a2ee6e349a017dcc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:771
export const MAN____header_global_0f37e9159c12bed1 = ((((((4871) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8f180ea7b8d3995e3c7d9c75() {
  return __cxx_static_address_8f180ea7b8d3995e3c7d9c75.reference || (__cxx_static_address_8f180ea7b8d3995e3c7d9c75.reference = {
    __cReference: true,
    get value() { return MAN____header_global_0f37e9159c12bed1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:772
export const MAN2____header_global_3324ffd01d05a944 = ((((((4872) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6e351f4c4621b42467354d62() {
  return __cxx_static_address_6e351f4c4621b42467354d62.reference || (__cxx_static_address_6e351f4c4621b42467354d62.reference = {
    __cReference: true,
    get value() { return MAN2____header_global_3324ffd01d05a944; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:773
export const WOMAN____header_global_7fd5b9c22dfc77e7 = ((((((4874) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3d8d6224ebf49a25ec6d7d5c() {
  return __cxx_static_address_3d8d6224ebf49a25ec6d7d5c.reference || (__cxx_static_address_3d8d6224ebf49a25ec6d7d5c.reference = {
    __cReference: true,
    get value() { return WOMAN____header_global_7fd5b9c22dfc77e7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:774
export const NATURALLIGHTNING____header_global_0d6427c4fbf851df = ((((((4890) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_18123e6790202262e5916689() {
  return __cxx_static_address_18123e6790202262e5916689.reference || (__cxx_static_address_18123e6790202262e5916689.reference = {
    __cReference: true,
    get value() { return NATURALLIGHTNING____header_global_0d6427c4fbf851df; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:775
export const WEATHERWARN____header_global_2068cb2b911044ce = ((((((4893) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_29fac6f55809320fad69e12f() {
  return __cxx_static_address_29fac6f55809320fad69e12f.reference || (__cxx_static_address_29fac6f55809320fad69e12f.reference = {
    __cReference: true,
    get value() { return WEATHERWARN____header_global_2068cb2b911044ce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:776
export const DUKETAG____header_global_422fbb1cd768a94f = ((((((4900) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1f7b1cac48ffe45a956a9365() {
  return __cxx_static_address_1f7b1cac48ffe45a956a9365.reference || (__cxx_static_address_1f7b1cac48ffe45a956a9365.reference = {
    __cReference: true,
    get value() { return DUKETAG____header_global_422fbb1cd768a94f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:777
export const SIGN1____header_global_5e87db7de5358722 = ((((((4909) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e2f6386f4344e4fc0f17fcf4() {
  return __cxx_static_address_e2f6386f4344e4fc0f17fcf4.reference || (__cxx_static_address_e2f6386f4344e4fc0f17fcf4.reference = {
    __cReference: true,
    get value() { return SIGN1____header_global_5e87db7de5358722; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:778
export const SIGN2____header_global_b9f119964844fbc7 = ((((((4912) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1f5a6cee009a0fa6ed272ce4() {
  return __cxx_static_address_1f5a6cee009a0fa6ed272ce4.reference || (__cxx_static_address_1f5a6cee009a0fa6ed272ce4.reference = {
    __cReference: true,
    get value() { return SIGN2____header_global_b9f119964844fbc7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:779
export const JURYGUY____header_global_290bb5ecb2339ac4 = ((((((4943) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d5869fcb2c3672b3c2a70b09() {
  return __cxx_static_address_d5869fcb2c3672b3c2a70b09.reference || (__cxx_static_address_d5869fcb2c3672b3c2a70b09.reference = {
    __cReference: true,
    get value() { return JURYGUY____header_global_290bb5ecb2339ac4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:780
export const WIDESCREENSTATUSBAR____header_global_e34f949f95bbee35 = ((((((5120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7586896b42d23aa6a5c7e06b() {
  return __cxx_static_address_7586896b42d23aa6a5c7e06b.reference || (__cxx_static_address_7586896b42d23aa6a5c7e06b.reference = {
    __cReference: true,
    get value() { return WIDESCREENSTATUSBAR____header_global_e34f949f95bbee35; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:781
export const RPGGUNWIDE____header_global_dd6ece8f0bdaaf7b = ((((((5121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_42c4e8e6ce0ae022d16b1cbe() {
  return __cxx_static_address_42c4e8e6ce0ae022d16b1cbe.reference || (__cxx_static_address_42c4e8e6ce0ae022d16b1cbe.reference = {
    __cReference: true,
    get value() { return RPGGUNWIDE____header_global_dd6ece8f0bdaaf7b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:782
export const FIRSTGUNRELOADWIDE____header_global_ecf048e0da636e11 = ((((((5122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bf6007b0d6d2beeb714ca822() {
  return __cxx_static_address_bf6007b0d6d2beeb714ca822.reference || (__cxx_static_address_bf6007b0d6d2beeb714ca822.reference = {
    __cReference: true,
    get value() { return FIRSTGUNRELOADWIDE____header_global_ecf048e0da636e11; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:783
export const FREEZEWIDE____header_global_36ad303e06c3ffce = ((((((5123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e0e47e49265d040727a3d5a2() {
  return __cxx_static_address_e0e47e49265d040727a3d5a2.reference || (__cxx_static_address_e0e47e49265d040727a3d5a2.reference = {
    __cReference: true,
    get value() { return FREEZEWIDE____header_global_36ad303e06c3ffce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:784
export const FREEZEFIREWIDE____header_global_f89ed4b66427db5b = ((((((5124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c07355fdcbde322ec39a2adb() {
  return __cxx_static_address_c07355fdcbde322ec39a2adb.reference || (__cxx_static_address_c07355fdcbde322ec39a2adb.reference = {
    __cReference: true,
    get value() { return FREEZEFIREWIDE____header_global_f89ed4b66427db5b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:785
export const SHRINKERWIDE____header_global_e913cf6b86062644 = ((((((5127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_679583c2a8e9e232e3df01ec() {
  return __cxx_static_address_679583c2a8e9e232e3df01ec.reference || (__cxx_static_address_679583c2a8e9e232e3df01ec.reference = {
    __cReference: true,
    get value() { return SHRINKERWIDE____header_global_e913cf6b86062644; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:786
export const CRACKKNUCKLESWIDE____header_global_752f53aadc7bb52d = ((((((5129) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a1516a262e1d12ba1663b201() {
  return __cxx_static_address_a1516a262e1d12ba1663b201.reference || (__cxx_static_address_a1516a262e1d12ba1663b201.reference = {
    __cReference: true,
    get value() { return CRACKKNUCKLESWIDE____header_global_752f53aadc7bb52d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:787
export const FLAMETHROWERSPRITE____header_global_225dcf366e99adbb = ((((((5134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2366247ea8bfdc2a3beb2c41() {
  return __cxx_static_address_2366247ea8bfdc2a3beb2c41.reference || (__cxx_static_address_2366247ea8bfdc2a3beb2c41.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERSPRITE____header_global_225dcf366e99adbb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:788
export const FLAMETHROWERAMMO____header_global_4d0ad5b3ab992881 = ((((((5135) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dee6f5a5b53a944277824058() {
  return __cxx_static_address_dee6f5a5b53a944277824058.reference || (__cxx_static_address_dee6f5a5b53a944277824058.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERAMMO____header_global_4d0ad5b3ab992881; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:789
export const FLAMETHROWER____header_global_10ccf99055fc7f3d = ((((((5138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_50a7832b980d56ad10459ac0() {
  return __cxx_static_address_50a7832b980d56ad10459ac0.reference || (__cxx_static_address_50a7832b980d56ad10459ac0.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER____header_global_10ccf99055fc7f3d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:790
export const FLAMETHROWERFIRE____header_global_0ebbbbe482aa9203 = ((((((5139) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_35dd10ce8b1f18c5c2a7bd6f() {
  return __cxx_static_address_35dd10ce8b1f18c5c2a7bd6f.reference || (__cxx_static_address_35dd10ce8b1f18c5c2a7bd6f.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERFIRE____header_global_0ebbbbe482aa9203; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:791
export const FLAMETHROWERFLAME____header_global_c001a5dbe33c702b = ((((((1891) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_52fb2e74ae274629d5dc2c87() {
  return __cxx_static_address_52fb2e74ae274629d5dc2c87.reference || (__cxx_static_address_52fb2e74ae274629d5dc2c87.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERFLAME____header_global_c001a5dbe33c702b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:792
export const FLAMETHROWERPILOT____header_global_979bb65c65a52b8f = ((((((5174) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e4579fc9315da6b33fe01547() {
  return __cxx_static_address_e4579fc9315da6b33fe01547.reference || (__cxx_static_address_e4579fc9315da6b33fe01547.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERPILOT____header_global_979bb65c65a52b8f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:793
export const FIREBALL____header_global_993516a354eeeb53 = ((((((5163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_910afbd59e2fa65dac719bbb() {
  return __cxx_static_address_910afbd59e2fa65dac719bbb.reference || (__cxx_static_address_910afbd59e2fa65dac719bbb.reference = {
    __cReference: true,
    get value() { return FIREBALL____header_global_993516a354eeeb53; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:794
export const ONFIRE____header_global_3759da06c6cfd356 = ((((((5152) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fc8564d5abfc8cff1fd3ad33() {
  return __cxx_static_address_fc8564d5abfc8cff1fd3ad33.reference || (__cxx_static_address_fc8564d5abfc8cff1fd3ad33.reference = {
    __cReference: true,
    get value() { return ONFIRE____header_global_3759da06c6cfd356; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:795
export const ONFIRESMOKE____header_global_fd32d88d0b9f0708 = ((((((5143) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_91a47682bbd2f670961f0841() {
  return __cxx_static_address_91a47682bbd2f670961f0841.reference || (__cxx_static_address_91a47682bbd2f670961f0841.reference = {
    __cReference: true,
    get value() { return ONFIRESMOKE____header_global_fd32d88d0b9f0708; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:796
export const BURNEDCORPSE____header_global_7ad9d527ceabd4de = ((((((5173) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b2cd04ddb78994eb17d742e1() {
  return __cxx_static_address_b2cd04ddb78994eb17d742e1.reference || (__cxx_static_address_b2cd04ddb78994eb17d742e1.reference = {
    __cReference: true,
    get value() { return BURNEDCORPSE____header_global_7ad9d527ceabd4de; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:797
export const WHISPYSMOKE____header_global_9529f5df9a2bb571 = ((((((5268) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6686f63df0189ece8877f568() {
  return __cxx_static_address_6686f63df0189ece8877f568.reference || (__cxx_static_address_6686f63df0189ece8877f568.reference = {
    __cReference: true,
    get value() { return WHISPYSMOKE____header_global_9529f5df9a2bb571; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:798
export const FIREFLY____header_global_b9b78c9a304c1895 = ((((((5180) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a51d2b3851db1b8df6d6cd30() {
  return __cxx_static_address_a51d2b3851db1b8df6d6cd30.reference || (__cxx_static_address_a51d2b3851db1b8df6d6cd30.reference = {
    __cReference: true,
    get value() { return FIREFLY____header_global_b9b78c9a304c1895; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:799
export const FIREFLYSHRINKEFFECT____header_global_295a4f7dc351a8c8 = ((((((5360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c8cb1ace6096eea49db11c97() {
  return __cxx_static_address_c8cb1ace6096eea49db11c97.reference || (__cxx_static_address_c8cb1ace6096eea49db11c97.reference = {
    __cReference: true,
    get value() { return FIREFLYSHRINKEFFECT____header_global_295a4f7dc351a8c8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:800
export const FIREFLYGROWEFFECT____header_global_4ee4e6f4dd7253f4 = ((((((5367) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fb822b373d3ba4363d802790() {
  return __cxx_static_address_fb822b373d3ba4363d802790.reference || (__cxx_static_address_fb822b373d3ba4363d802790.reference = {
    __cReference: true,
    get value() { return FIREFLYGROWEFFECT____header_global_4ee4e6f4dd7253f4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:801
export const FIREFLYFLYINGEFFECT____header_global_d90b505f98304433 = ((((((5296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f5a9c615d767f61f5efc2c48() {
  return __cxx_static_address_f5a9c615d767f61f5efc2c48.reference || (__cxx_static_address_f5a9c615d767f61f5efc2c48.reference = {
    __cReference: true,
    get value() { return FIREFLYFLYINGEFFECT____header_global_d90b505f98304433; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:802
export const BOSS5____header_global_7ae78e7d0d3a867c = ((((((5310) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_644c28d668deda828d3258fa() {
  return __cxx_static_address_644c28d668deda828d3258fa.reference || (__cxx_static_address_644c28d668deda828d3258fa.reference = {
    __cReference: true,
    get value() { return BOSS5____header_global_7ae78e7d0d3a867c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:803
export const BOSS5STAYPUT____header_global_9e39833ec42d5f03 = ((((((5311) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5cdec92ddde69cf758292571() {
  return __cxx_static_address_5cdec92ddde69cf758292571.reference || (__cxx_static_address_5cdec92ddde69cf758292571.reference = {
    __cReference: true,
    get value() { return BOSS5STAYPUT____header_global_9e39833ec42d5f03; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:804
export const LAVAPOOL____header_global_78030dcc6d690fe9 = ((((((5304) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1f4933647e18f77b4bd67b6c() {
  return __cxx_static_address_1f4933647e18f77b4bd67b6c.reference || (__cxx_static_address_1f4933647e18f77b4bd67b6c.reference = {
    __cReference: true,
    get value() { return LAVAPOOL____header_global_78030dcc6d690fe9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:805
export const LAVASPLASH____header_global_d11521a1068de028 = ((((((5371) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2c49f88ebaa2ead75d1c2338() {
  return __cxx_static_address_2c49f88ebaa2ead75d1c2338.reference || (__cxx_static_address_2c49f88ebaa2ead75d1c2338.reference = {
    __cReference: true,
    get value() { return LAVASPLASH____header_global_d11521a1068de028; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:806
export const LAVAPOOLBUBBLE____header_global_ccb8a1ef753e72bb = ((((((5207) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_950be61290a148fbba9c0650() {
  return __cxx_static_address_950be61290a148fbba9c0650.reference || (__cxx_static_address_950be61290a148fbba9c0650.reference = {
    __cReference: true,
    get value() { return LAVAPOOLBUBBLE____header_global_ccb8a1ef753e72bb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:807
export const BOSS2STAYPUT____header_global_56697f0d478f1262 = ((((((2711) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1de1b579dd8c95152ebe5ca9() {
  return __cxx_static_address_1de1b579dd8c95152ebe5ca9.reference || (__cxx_static_address_1de1b579dd8c95152ebe5ca9.reference = {
    __cReference: true,
    get value() { return BOSS2STAYPUT____header_global_56697f0d478f1262; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:808
export const BOSS3STAYPUT____header_global_64c16019cb584aba = ((((((2761) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ac1e246ec375402b2fd7cc66() {
  return __cxx_static_address_ac1e246ec375402b2fd7cc66.reference || (__cxx_static_address_ac1e246ec375402b2fd7cc66.reference = {
    __cReference: true,
    get value() { return BOSS3STAYPUT____header_global_64c16019cb584aba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:809
export const E32_TILE5736____header_global_2639173c304f89c9 = ((((((5736) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4d65f9ba5f163516fa4c4aeb() {
  return __cxx_static_address_4d65f9ba5f163516fa4c4aeb.reference || (__cxx_static_address_4d65f9ba5f163516fa4c4aeb.reference = {
    __cReference: true,
    get value() { return E32_TILE5736____header_global_2639173c304f89c9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:810
export const E32_TILE5737____header_global_077ffe8a51039b5c = ((((((5737) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d3ce0d0983614580483aabcf() {
  return __cxx_static_address_d3ce0d0983614580483aabcf.reference || (__cxx_static_address_d3ce0d0983614580483aabcf.reference = {
    __cReference: true,
    get value() { return E32_TILE5737____header_global_077ffe8a51039b5c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:811
export const E32_TILE5846____header_global_71a6d7b0b4f5293f = ((((((5846) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fe1014e84cf49ea45e1cf420() {
  return __cxx_static_address_fe1014e84cf49ea45e1cf420.reference || (__cxx_static_address_fe1014e84cf49ea45e1cf420.reference = {
    __cReference: true,
    get value() { return E32_TILE5846____header_global_71a6d7b0b4f5293f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/network.h:180
export const cSnapshotMemUsage__header_global_6403a06faf8e2ae1 = u64((BigInt(u64(64)) * BigInt((BigInt((BigInt((BigInt(72) * BigInt(u64(16384)))) + BigInt((BigInt(96) * BigInt(u64(4096)))))) + BigInt((BigInt(296) * BigInt(u64(16384))))))));
function __cxx_static_address_f5f354248cb826c597576a85() {
  return __cxx_static_address_f5f354248cb826c597576a85.reference || (__cxx_static_address_f5f354248cb826c597576a85.reference = {
    __cReference: true,
    get value() { return cSnapshotMemUsage__header_global_6403a06faf8e2ae1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
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

// C/C++ source: source/duke3d/src/text.cpp:28
export let g_textstat = i32((i32((i32(2) | i32(8))) | i32(16)));
export function __cxx_global_cell_9eff0397bc2733329a03979e() {
  return __cxx_global_cell_9eff0397bc2733329a03979e.reference || (__cxx_global_cell_9eff0397bc2733329a03979e.reference = {
    __cReference: true,
    get value() { return g_textstat; },
    set value(__cxx_lvalue_0) { g_textstat = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/text.cpp:30
export let g_screentextbufcount = u64(256);
export function __cxx_global_cell_c38589ca7df93168d30113b9() {
  return __cxx_global_cell_c38589ca7df93168d30113b9.reference || (__cxx_global_cell_c38589ca7df93168d30113b9.reference = {
    __cReference: true,
    get value() { return g_screentextbufcount; },
    set value(__cxx_lvalue_0) { g_screentextbufcount = u64(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/text.cpp:31
export let g_screentextbuf = null;
export function __cxx_global_cell_350f0357d1f4508cfdc7336c() {
  return __cxx_global_cell_350f0357d1f4508cfdc7336c.reference || (__cxx_global_cell_350f0357d1f4508cfdc7336c.reference = {
    __cReference: true,
    get value() { return g_screentextbuf; },
    set value(__cxx_lvalue_0) { g_screentextbuf = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_663116f6eb43304d = i32(2147483647);
function __cxx_static_address_dad58c1eb6f6b7e3c5ec5bc5() {
  return __cxx_static_address_dad58c1eb6f6b7e3c5ec5bc5.reference || (__cxx_static_address_dad58c1eb6f6b7e3c5ec5bc5.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_663116f6eb43304d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_a0cff5319e4173d3 = i32(2147483648);
function __cxx_static_address_506706797ea8850cb6758a8f() {
  return __cxx_static_address_506706797ea8850cb6758a8f.reference || (__cxx_static_address_506706797ea8850cb6758a8f.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_a0cff5319e4173d3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_69e19ed7c7efee3f = i32(2147483648);
function __cxx_static_address_eddd8c81e3023b1aa1569039() {
  return __cxx_static_address_eddd8c81e3023b1aa1569039.reference || (__cxx_static_address_eddd8c81e3023b1aa1569039.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_69e19ed7c7efee3f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_3b57a2b25924dc78 = i32(65536);
function __cxx_static_address_c004d68c35951c06f79cbe0f() {
  return __cxx_static_address_c004d68c35951c06f79cbe0f.reference || (__cxx_static_address_c004d68c35951c06f79cbe0f.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_3b57a2b25924dc78; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_e68e914730cf5fe7 = i32(32768);
function __cxx_static_address_0161cf145b9985c98326e52b() {
  return __cxx_static_address_0161cf145b9985c98326e52b.reference || (__cxx_static_address_0161cf145b9985c98326e52b.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_e68e914730cf5fe7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_bce8af2be160e97c = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_f3ee474d1a6b9a5a0800dee2() {
  return __cxx_static_address_f3ee474d1a6b9a5a0800dee2.reference || (__cxx_static_address_f3ee474d1a6b9a5a0800dee2.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_bce8af2be160e97c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/text.cpp:335
export let minitext_yofs = i32(0);
export function __cxx_global_cell_2d9612c9e63049e37be073fa() {
  return __cxx_global_cell_2d9612c9e63049e37be073fa.reference || (__cxx_global_cell_2d9612c9e63049e37be073fa.reference = {
    __cReference: true,
    get value() { return minitext_yofs; },
    set value(__cxx_lvalue_0) { minitext_yofs = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/text.cpp:336
export let minitext_lowercase = i32(0);
export function __cxx_global_cell_33dc97ec2e0b5d96f72860da() {
  return __cxx_global_cell_33dc97ec2e0b5d96f72860da.reference || (__cxx_global_cell_33dc97ec2e0b5d96f72860da.reference = {
    __cReference: true,
    get value() { return minitext_lowercase; },
    set value(__cxx_lvalue_0) { minitext_lowercase = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/text.cpp:386
export let user_quote_time = new Int32Array(6);
function __cxx_static_address_5aa9ea07b5e8bf6190d6789d() {
  return __cxx_static_address_5aa9ea07b5e8bf6190d6789d.reference || (__cxx_static_address_5aa9ea07b5e8bf6190d6789d.reference = {
    __cReference: true,
    get value() { return user_quote_time; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/text.cpp:387
export let user_quote = Array.from({ length: 6 }, () => new Uint8Array(178));
function __cxx_static_address_26ae9c64544e4b8db288fe37() {
  return __cxx_static_address_26ae9c64544e4b8db288fe37.reference || (__cxx_static_address_26ae9c64544e4b8db288fe37.reference = {
    __cReference: true,
    get value() { return user_quote; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/text.cpp:410
export let hud_glowingquotes = i32(1);
export function __cxx_global_cell_1215105ec46bccf4d3e1e7f4() {
  return __cxx_global_cell_1215105ec46bccf4d3e1e7f4.reference || (__cxx_global_cell_1215105ec46bccf4d3e1e7f4.reference = {
    __cReference: true,
    get value() { return hud_glowingquotes; },
    set value(__cxx_lvalue_0) { hud_glowingquotes = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_d3755dab90afbf54 = new Uint8Array([((1) & 255), ((2) & 255), ((4) & 255), ((8) & 255), ((16) & 255), ((32) & 255), ((64) & 255), ((128) & 255)]);
function __cxx_static_address_659cb06417ae6ddbc18d539d() {
  return __cxx_static_address_659cb06417ae6ddbc18d539d.reference || (__cxx_static_address_659cb06417ae6ddbc18d539d.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_d3755dab90afbf54; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:172
export const g_defaultVideoModes__header_global_b71e9ea656f95210 = [cMarkAggregate(({"x": 2560, "y": 1440})), cMarkAggregate(({"x": 2560, "y": 1200})), cMarkAggregate(({"x": 2560, "y": 1080})), cMarkAggregate(({"x": 1920, "y": 1440})), cMarkAggregate(({"x": 1920, "y": 1200})), cMarkAggregate(({"x": 1920, "y": 1080})), cMarkAggregate(({"x": 1680, "y": 1050})), cMarkAggregate(({"x": 1600, "y": 1200})), cMarkAggregate(({"x": 1600, "y": 900})), cMarkAggregate(({"x": 1366, "y": 768})), cMarkAggregate(({"x": 1280, "y": 1024})), cMarkAggregate(({"x": 1280, "y": 960})), cMarkAggregate(({"x": 1280, "y": 720})), cMarkAggregate(({"x": 1152, "y": 864})), cMarkAggregate(({"x": 1024, "y": 768})), cMarkAggregate(({"x": 1024, "y": 600})), cMarkAggregate(({"x": 800, "y": 600})), cMarkAggregate(({"x": 640, "y": 480})), cMarkAggregate(({"x": 640, "y": 400})), cMarkAggregate(({"x": 512, "y": 384})), cMarkAggregate(({"x": 480, "y": 360})), cMarkAggregate(({"x": 400, "y": 300})), cMarkAggregate(({"x": 320, "y": 240})), cMarkAggregate(({"x": 320, "y": 200})), cMarkAggregate(({"x": 0, "y": 0}))];
function __cxx_static_address_337e3d9acd1d0d93f67cbc63() {
  return __cxx_static_address_337e3d9acd1d0d93f67cbc63.reference || (__cxx_static_address_337e3d9acd1d0d93f67cbc63.reference = {
    __cReference: true,
    get value() { return g_defaultVideoModes__header_global_b71e9ea656f95210; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:188
export const g_keyAsciiTable__header_global_eaa0e7ef4e79f73e = new Uint8Array([((0) & 255), ((0) & 255), 49, 50, 51, 52, 53, 54, 55, 56, 57, 48, 45, 61, ((0) & 255), ((0) & 255), 113, 119, 101, 114, 116, 121, 117, 105, 111, 112, 91, 93, ((0) & 255), ((0) & 255), 97, 115, 100, 102, 103, 104, 106, 107, 108, 59, ((39) & 255), 96, ((0) & 255), ((92) & 255), 122, 120, 99, 118, 98, 110, 109, 44, 46, 47, ((0) & 255), 42, ((0) & 255), ((32) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255)]);
function __cxx_static_address_5085a3f47a6c16ffaf20b7cc() {
  return __cxx_static_address_5085a3f47a6c16ffaf20b7cc.reference || (__cxx_static_address_5085a3f47a6c16ffaf20b7cc.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTable__header_global_eaa0e7ef4e79f73e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:196
export const g_keyAsciiTableShift__header_global_fd042548fa2c95f0 = new Uint8Array([((0) & 255), ((0) & 255), 33, 64, 35, 36, 37, 94, 38, 42, 40, 41, 95, 43, ((0) & 255), ((0) & 255), 81, 87, 69, 82, 84, 89, 85, 73, 79, 80, 123, 125, ((0) & 255), ((0) & 255), 65, 83, 68, 70, 71, 72, 74, 75, 76, 58, 34, 126, ((0) & 255), 124, 90, 88, 67, 86, 66, 78, 77, 60, 62, 63, ((0) & 255), 42, ((0) & 255), ((32) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255)]);
function __cxx_static_address_d72a3fb03216569f9f305b1c() {
  return __cxx_static_address_d72a3fb03216569f9f305b1c.reference || (__cxx_static_address_d72a3fb03216569f9f305b1c.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTableShift__header_global_fd042548fa2c95f0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:895
export const pow2long__header_global_6657ee18b870dd65 = new Int32Array([1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576, 2097152, 4194304, 8388608, 16777216, 33554432, 67108864, 134217728, 268435456, 536870912, 1073741824, 2147483647]);
function __cxx_static_address_ab30ca115440308baedfb527() {
  return __cxx_static_address_ab30ca115440308baedfb527.reference || (__cxx_static_address_ab30ca115440308baedfb527.reference = {
    __cReference: true,
    get value() { return pow2long__header_global_6657ee18b870dd65; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:907
export const pow2ulong__header_global_303d503f9a0447ca = new Uint32Array([u32(1), u32(2), u32(4), u32(8), u32(16), u32(32), u32(64), u32(128), u32(256), u32(512), u32(1024), u32(2048), u32(4096), u32(8192), u32(16384), u32(32768), u32(65536), u32(131072), u32(262144), u32(524288), u32(1048576), u32(2097152), u32(4194304), u32(8388608), u32(16777216), u32(33554432), u32(67108864), u32(134217728), u32(268435456), u32(536870912), u32(1073741824), u32(2147483648n)]);
function __cxx_static_address_78775349166ee74b61a8d2c4() {
  return __cxx_static_address_78775349166ee74b61a8d2c4.reference || (__cxx_static_address_78775349166ee74b61a8d2c4.reference = {
    __cReference: true,
    get value() { return pow2ulong__header_global_303d503f9a0447ca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:919
export const pow264__header_global_17f41eda6d5e0bcb = new BigInt64Array([BigInt(i64(1)), BigInt(i64(2)), BigInt(i64(4)), BigInt(i64(8)), BigInt(i64(16)), BigInt(i64(32)), BigInt(i64(64)), BigInt(i64(128)), BigInt(i64(256)), BigInt(i64(512)), BigInt(i64(1024)), BigInt(i64(2048)), BigInt(i64(4096)), BigInt(i64(8192)), BigInt(i64(16384)), BigInt(i64(32768)), BigInt(i64(65536)), BigInt(i64(131072)), BigInt(i64(262144)), BigInt(i64(524288)), BigInt(i64(1048576)), BigInt(i64(2097152)), BigInt(i64(4194304)), BigInt(i64(8388608)), BigInt(i64(16777216)), BigInt(i64(33554432)), BigInt(i64(67108864)), BigInt(i64(134217728)), BigInt(i64(268435456)), BigInt(i64(536870912)), BigInt(i64(1073741824)), BigInt(2147483648n), BigInt(4294967296n), BigInt(8589934592n), BigInt(17179869184n), BigInt(34359738368n), BigInt(68719476736n), BigInt(137438953472n), BigInt(274877906944n), BigInt(549755813888n), BigInt(1099511627776n), BigInt(2199023255552n), BigInt(4398046511104n), BigInt(8796093022208n), BigInt(17592186044416n), BigInt(35184372088832n), BigInt(70368744177664n), BigInt(140737488355328n), BigInt(281474976710656n), BigInt(562949953421312n), BigInt(1125899906842624n), BigInt(2251799813685248n), BigInt(4503599627370496n), BigInt(9007199254740992n), BigInt(18014398509481984n), BigInt(36028797018963968n), BigInt(72057594037927936n), BigInt(144115188075855872n), BigInt(288230376151711744n), BigInt(576460752303423488n), BigInt(1152921504606846976n), BigInt(2305843009213693952n), BigInt(4611686018427387904n), BigInt(9223372036854775807n)]);
function __cxx_static_address_6dc1c68aa12483059f68f5bd() {
  return __cxx_static_address_6dc1c68aa12483059f68f5bd.reference || (__cxx_static_address_6dc1c68aa12483059f68f5bd.reference = {
    __cReference: true,
    get value() { return pow264__header_global_17f41eda6d5e0bcb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/text.cpp:148
export function tilefontGetChr32FromASCII__header_ffa95a526f3a(c) {
  let chr32 = u32(0);
  cByteMemory.memcpy(cRef(() => chr32, __cxx_lvalue_0 => { chr32 = __cxx_lvalue_0; }), cRef(() => c, __cxx_lvalue_1 => { c = __cxx_lvalue_1; }), 1);
  return u32(chr32);
}

// C/C++ source: source/duke3d/src/text.cpp:29
export function utf8charbytes__header_c7007796beef(c) {
  if ((i32((i32(c) & 248)) == 240)) {
    return u64(4);
  } else {
    if ((i32((i32(c) & 240)) == 224)) {
      return u64(3);
    } else {
      if ((i32((i32(c) & 224)) == 192)) {
        return u64(2);
      }
    }
  }
  return u64(1);
}

// C/C++ source: source/duke3d/src/text.cpp:1079
export function videoGetRenderMode__header_5c5a03367604() {
  return i32(0);
}

export function clamp__header_226fd84f6b81(__cxx_in, min, max) {
  return i32(((__cxx_in <= i32(min)) ? i32(min) : ((__cxx_in >= i32(max)) ? i32(max) : __cxx_in)));
}

// C/C++ source: source/build/include/smmalloc.h:859
export function _sm_malloc(allocator, bytesCount, alignment) {
  return cRecordObject(allocator).Alloc(bytesCount, alignment);
}

// C/C++ source: source/build/include/smmalloc.h:864
export function _sm_free(allocator, p) {
  return cRecordObject(allocator).Free(p);
}
