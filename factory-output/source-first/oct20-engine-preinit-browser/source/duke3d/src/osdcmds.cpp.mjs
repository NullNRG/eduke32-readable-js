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
// Original translation unit: source/duke3d/src/osdcmds.cpp
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

const i32 = value => Number(value) | 0;
const u32 = value => Number(value) >>> 0;
const i64 = value => BigInt.asIntN(64, BigInt(value));
const u64 = value => BigInt.asUintN(64, BigInt(value));

// C/C++ source: source/build/include/fix16.h:111
export const fix16_rad_to_deg_mult__header_global_545e711df2e7a393 = i32(3754936);
function __cxx_static_address_d3ce31e77f21d74c2e74c36d() {
  return __cxx_static_address_d3ce31e77f21d74c2e74c36d.reference || (__cxx_static_address_d3ce31e77f21d74c2e74c36d.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_545e711df2e7a393; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_2a185249337ab0a7 = i32(1144);
function __cxx_static_address_603ba671526615eb657319a6() {
  return __cxx_static_address_603ba671526615eb657319a6.reference || (__cxx_static_address_603ba671526615eb657319a6.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_2a185249337ab0a7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:43
export const KICK_HIT____header_global_71b4957bae89135e = ((((((0) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b172a42e29725ca1304d9ce0() {
  return __cxx_static_address_b172a42e29725ca1304d9ce0.reference || (__cxx_static_address_b172a42e29725ca1304d9ce0.reference = {
    __cReference: true,
    get value() { return KICK_HIT____header_global_71b4957bae89135e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:44
export const PISTOL_RICOCHET____header_global_a19408ae0515135d = ((((((1) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2124eff7cc4164388496d563() {
  return __cxx_static_address_2124eff7cc4164388496d563.reference || (__cxx_static_address_2124eff7cc4164388496d563.reference = {
    __cReference: true,
    get value() { return PISTOL_RICOCHET____header_global_a19408ae0515135d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:45
export const PISTOL_BODYHIT____header_global_8a481137bcec10ae = ((((((2) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3c37efd533086231f1fb444e() {
  return __cxx_static_address_3c37efd533086231f1fb444e.reference || (__cxx_static_address_3c37efd533086231f1fb444e.reference = {
    __cReference: true,
    get value() { return PISTOL_BODYHIT____header_global_8a481137bcec10ae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:46
export const PISTOL_FIRE____header_global_b2cb0da42a0d6fea = ((((((3) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ddf29618bb2acbb70d350d2f() {
  return __cxx_static_address_ddf29618bb2acbb70d350d2f.reference || (__cxx_static_address_ddf29618bb2acbb70d350d2f.reference = {
    __cReference: true,
    get value() { return PISTOL_FIRE____header_global_b2cb0da42a0d6fea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:47
export const EJECT_CLIP____header_global_3273f327d3944b98 = ((((((4) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_177373137693712875895573() {
  return __cxx_static_address_177373137693712875895573.reference || (__cxx_static_address_177373137693712875895573.reference = {
    __cReference: true,
    get value() { return EJECT_CLIP____header_global_3273f327d3944b98; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:48
export const INSERT_CLIP____header_global_d8e9a7cd4caa85d3 = ((((((5) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f7bc86160be406641e87bf3b() {
  return __cxx_static_address_f7bc86160be406641e87bf3b.reference || (__cxx_static_address_f7bc86160be406641e87bf3b.reference = {
    __cReference: true,
    get value() { return INSERT_CLIP____header_global_d8e9a7cd4caa85d3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:49
export const CHAINGUN_FIRE____header_global_53773f1bd4303b20 = ((((((6) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_69c2f48c77e464f040351359() {
  return __cxx_static_address_69c2f48c77e464f040351359.reference || (__cxx_static_address_69c2f48c77e464f040351359.reference = {
    __cReference: true,
    get value() { return CHAINGUN_FIRE____header_global_53773f1bd4303b20; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:50
export const RPG_SHOOT____header_global_99f38cd19cce5b8f = ((((((7) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_73bd80d61c4120d7c4316197() {
  return __cxx_static_address_73bd80d61c4120d7c4316197.reference || (__cxx_static_address_73bd80d61c4120d7c4316197.reference = {
    __cReference: true,
    get value() { return RPG_SHOOT____header_global_99f38cd19cce5b8f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:51
export const POOLBALLHIT____header_global_dfaae52ff192b9fc = ((((((8) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0b6e5147b7602fa6823481fe() {
  return __cxx_static_address_0b6e5147b7602fa6823481fe.reference || (__cxx_static_address_0b6e5147b7602fa6823481fe.reference = {
    __cReference: true,
    get value() { return POOLBALLHIT____header_global_dfaae52ff192b9fc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:52
export const RPG_EXPLODE____header_global_5a8088a669861517 = ((((((9) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f460cb02c12cfac2e4d0cff0() {
  return __cxx_static_address_f460cb02c12cfac2e4d0cff0.reference || (__cxx_static_address_f460cb02c12cfac2e4d0cff0.reference = {
    __cReference: true,
    get value() { return RPG_EXPLODE____header_global_5a8088a669861517; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:53
export const CAT_FIRE____header_global_e02dbfb34e22982a = ((((((10) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8a0e59db8cbca6c280fa9c58() {
  return __cxx_static_address_8a0e59db8cbca6c280fa9c58.reference || (__cxx_static_address_8a0e59db8cbca6c280fa9c58.reference = {
    __cReference: true,
    get value() { return CAT_FIRE____header_global_e02dbfb34e22982a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:54
export const SHRINKER_FIRE____header_global_4136e491e502d3e1 = ((((((11) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_25a08b80bfd90e1d55fc561d() {
  return __cxx_static_address_25a08b80bfd90e1d55fc561d.reference || (__cxx_static_address_25a08b80bfd90e1d55fc561d.reference = {
    __cReference: true,
    get value() { return SHRINKER_FIRE____header_global_4136e491e502d3e1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:55
export const PIPEBOMB_BOUNCE____header_global_eb9be4e5fb7cc2e1 = ((((((13) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8fdde9d84715cdfeee4bd076() {
  return __cxx_static_address_8fdde9d84715cdfeee4bd076.reference || (__cxx_static_address_8fdde9d84715cdfeee4bd076.reference = {
    __cReference: true,
    get value() { return PIPEBOMB_BOUNCE____header_global_eb9be4e5fb7cc2e1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:56
export const PIPEBOMB_EXPLODE____header_global_c72ff4205c337037 = ((((((14) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_25d30daaca86b99c1d21fab7() {
  return __cxx_static_address_25d30daaca86b99c1d21fab7.reference || (__cxx_static_address_25d30daaca86b99c1d21fab7.reference = {
    __cReference: true,
    get value() { return PIPEBOMB_EXPLODE____header_global_c72ff4205c337037; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:57
export const LASERTRIP_ONWALL____header_global_b84340e25f882f3b = ((((((15) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_be81a3824314312fe5ecd514() {
  return __cxx_static_address_be81a3824314312fe5ecd514.reference || (__cxx_static_address_be81a3824314312fe5ecd514.reference = {
    __cReference: true,
    get value() { return LASERTRIP_ONWALL____header_global_b84340e25f882f3b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:58
export const LASERTRIP_ARMING____header_global_256e994c0a7e89db = ((((((16) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_08bb6e0fce86c5aeb186675f() {
  return __cxx_static_address_08bb6e0fce86c5aeb186675f.reference || (__cxx_static_address_08bb6e0fce86c5aeb186675f.reference = {
    __cReference: true,
    get value() { return LASERTRIP_ARMING____header_global_256e994c0a7e89db; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:59
export const LASERTRIP_EXPLODE____header_global_fbfb0cd71a49c099 = ((((((17) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cc950b27d00ec3ddc80ac175() {
  return __cxx_static_address_cc950b27d00ec3ddc80ac175.reference || (__cxx_static_address_cc950b27d00ec3ddc80ac175.reference = {
    __cReference: true,
    get value() { return LASERTRIP_EXPLODE____header_global_fbfb0cd71a49c099; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:60
export const VENT_BUST____header_global_826f8ec1c1ee5ae6 = ((((((18) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_61d8a197fe77a39c1257be7c() {
  return __cxx_static_address_61d8a197fe77a39c1257be7c.reference || (__cxx_static_address_61d8a197fe77a39c1257be7c.reference = {
    __cReference: true,
    get value() { return VENT_BUST____header_global_826f8ec1c1ee5ae6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:61
export const GLASS_BREAKING____header_global_c3c74a40a80d528d = ((((((19) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7786f1d99c7196071f70942a() {
  return __cxx_static_address_7786f1d99c7196071f70942a.reference || (__cxx_static_address_7786f1d99c7196071f70942a.reference = {
    __cReference: true,
    get value() { return GLASS_BREAKING____header_global_c3c74a40a80d528d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:62
export const GLASS_HEAVYBREAK____header_global_647272762a66fccc = ((((((20) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_66e749223cf5d0088cccbcfd() {
  return __cxx_static_address_66e749223cf5d0088cccbcfd.reference || (__cxx_static_address_66e749223cf5d0088cccbcfd.reference = {
    __cReference: true,
    get value() { return GLASS_HEAVYBREAK____header_global_647272762a66fccc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:63
export const SHORT_CIRCUIT____header_global_634110018bde8a35 = ((((((21) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6fbefe40457386fde86c92df() {
  return __cxx_static_address_6fbefe40457386fde86c92df.reference || (__cxx_static_address_6fbefe40457386fde86c92df.reference = {
    __cReference: true,
    get value() { return SHORT_CIRCUIT____header_global_634110018bde8a35; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:64
export const ITEM_SPLASH____header_global_3db496b3de1e9896 = ((((((22) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ca97958a270e479fb7feee1c() {
  return __cxx_static_address_ca97958a270e479fb7feee1c.reference || (__cxx_static_address_ca97958a270e479fb7feee1c.reference = {
    __cReference: true,
    get value() { return ITEM_SPLASH____header_global_3db496b3de1e9896; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:65
export const DUKE_GASP____header_global_9c552f97418d121d = ((((((25) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_91b52d4d3583ebe335db9830() {
  return __cxx_static_address_91b52d4d3583ebe335db9830.reference || (__cxx_static_address_91b52d4d3583ebe335db9830.reference = {
    __cReference: true,
    get value() { return DUKE_GASP____header_global_9c552f97418d121d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:66
export const SLIM_RECOG____header_global_65217607cffa9208 = ((((((26) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_990dc7a2f3b5fe1374b18e14() {
  return __cxx_static_address_990dc7a2f3b5fe1374b18e14.reference || (__cxx_static_address_990dc7a2f3b5fe1374b18e14.reference = {
    __cReference: true,
    get value() { return SLIM_RECOG____header_global_65217607cffa9208; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:67
export const DUKE_URINATE____header_global_1a007309d240a2d8 = ((((((28) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_419bc02beb7ccc8d5ba879c2() {
  return __cxx_static_address_419bc02beb7ccc8d5ba879c2.reference || (__cxx_static_address_419bc02beb7ccc8d5ba879c2.reference = {
    __cReference: true,
    get value() { return DUKE_URINATE____header_global_1a007309d240a2d8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:68
export const ENDSEQVOL3SND2____header_global_c53cea8f6c42cb78 = ((((((29) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_701ebb8cf0a3c26515558656() {
  return __cxx_static_address_701ebb8cf0a3c26515558656.reference || (__cxx_static_address_701ebb8cf0a3c26515558656.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND2____header_global_c53cea8f6c42cb78; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:69
export const ENDSEQVOL3SND3____header_global_0e4eaa367021fb6d = ((((((30) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ca32396bda6078d77371f21a() {
  return __cxx_static_address_ca32396bda6078d77371f21a.reference || (__cxx_static_address_ca32396bda6078d77371f21a.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND3____header_global_0e4eaa367021fb6d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:70
export const DUKE_CRACK____header_global_d688ebcc51ee9b7d = ((((((33) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_16f23e5adcd44ea8b2c463b1() {
  return __cxx_static_address_16f23e5adcd44ea8b2c463b1.reference || (__cxx_static_address_16f23e5adcd44ea8b2c463b1.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK____header_global_d688ebcc51ee9b7d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:71
export const SLIM_ATTACK____header_global_4be76eb68ecb997f = ((((((34) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_47b9f81ff896ab0aa170c278() {
  return __cxx_static_address_47b9f81ff896ab0aa170c278.reference || (__cxx_static_address_47b9f81ff896ab0aa170c278.reference = {
    __cReference: true,
    get value() { return SLIM_ATTACK____header_global_4be76eb68ecb997f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:72
export const SOMETHINGHITFORCE____header_global_0ef2b921ff61a184 = ((((((35) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d642d3597251db9febfa915f() {
  return __cxx_static_address_d642d3597251db9febfa915f.reference || (__cxx_static_address_d642d3597251db9febfa915f.reference = {
    __cReference: true,
    get value() { return SOMETHINGHITFORCE____header_global_0ef2b921ff61a184; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:73
export const DUKE_DRINKING____header_global_5b13eb2a36633626 = ((((((36) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d2df5028dd13ce1221640b60() {
  return __cxx_static_address_d2df5028dd13ce1221640b60.reference || (__cxx_static_address_d2df5028dd13ce1221640b60.reference = {
    __cReference: true,
    get value() { return DUKE_DRINKING____header_global_5b13eb2a36633626; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:74
export const DUKE_GRUNT____header_global_4e385778d04d8e52 = ((((((38) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8c42c9c58d113e95d294111e() {
  return __cxx_static_address_8c42c9c58d113e95d294111e.reference || (__cxx_static_address_8c42c9c58d113e95d294111e.reference = {
    __cReference: true,
    get value() { return DUKE_GRUNT____header_global_4e385778d04d8e52; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:75
export const DUKE_HARTBEAT____header_global_864297627666d0fd = ((((((39) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fcdaec940955818f2552808e() {
  return __cxx_static_address_fcdaec940955818f2552808e.reference || (__cxx_static_address_fcdaec940955818f2552808e.reference = {
    __cReference: true,
    get value() { return DUKE_HARTBEAT____header_global_864297627666d0fd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:76
export const DUKE_ONWATER____header_global_3b2fe4bda90d7258 = ((((((40) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7d2a866e251309ad3ed8c63b() {
  return __cxx_static_address_7d2a866e251309ad3ed8c63b.reference || (__cxx_static_address_7d2a866e251309ad3ed8c63b.reference = {
    __cReference: true,
    get value() { return DUKE_ONWATER____header_global_3b2fe4bda90d7258; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:77
export const DUKE_LAND____header_global_b0b6caaba5090cb0 = ((((((42) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e42ea450d9c2268054fe66af() {
  return __cxx_static_address_e42ea450d9c2268054fe66af.reference || (__cxx_static_address_e42ea450d9c2268054fe66af.reference = {
    __cReference: true,
    get value() { return DUKE_LAND____header_global_b0b6caaba5090cb0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:78
export const DUKE_WALKINDUCTS____header_global_f472f92bc81ab100 = ((((((43) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a07ecbcc711797d08973407a() {
  return __cxx_static_address_a07ecbcc711797d08973407a.reference || (__cxx_static_address_a07ecbcc711797d08973407a.reference = {
    __cReference: true,
    get value() { return DUKE_WALKINDUCTS____header_global_f472f92bc81ab100; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:79
export const DUKE_UNDERWATER____header_global_f3f185c684c47972 = ((((((48) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3356d247f872b2a928143093() {
  return __cxx_static_address_3356d247f872b2a928143093.reference || (__cxx_static_address_3356d247f872b2a928143093.reference = {
    __cReference: true,
    get value() { return DUKE_UNDERWATER____header_global_f3f185c684c47972; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:80
export const DUKE_JETPACK_ON____header_global_534ad937357cbed4 = ((((((49) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b56c22b5cfc38305b08e107a() {
  return __cxx_static_address_b56c22b5cfc38305b08e107a.reference || (__cxx_static_address_b56c22b5cfc38305b08e107a.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_ON____header_global_534ad937357cbed4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:81
export const DUKE_JETPACK_IDLE____header_global_b2ef0c280905d915 = ((((((50) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_29a4a17e57272e6a1f78b64a() {
  return __cxx_static_address_29a4a17e57272e6a1f78b64a.reference || (__cxx_static_address_29a4a17e57272e6a1f78b64a.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_IDLE____header_global_b2ef0c280905d915; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:82
export const DUKE_JETPACK_OFF____header_global_2bd41d23f2eed523 = ((((((51) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_159784e07bfc00d5cc6a3304() {
  return __cxx_static_address_159784e07bfc00d5cc6a3304.reference || (__cxx_static_address_159784e07bfc00d5cc6a3304.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_OFF____header_global_2bd41d23f2eed523; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:83
export const DUKETALKTOBOSS____header_global_01877425f71ef4c5 = ((((((56) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5c55ab544532a0a1bc2cdee4() {
  return __cxx_static_address_5c55ab544532a0a1bc2cdee4.reference || (__cxx_static_address_5c55ab544532a0a1bc2cdee4.reference = {
    __cReference: true,
    get value() { return DUKETALKTOBOSS____header_global_01877425f71ef4c5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:84
export const SQUISHED____header_global_44d05a07af86e382 = ((((((69) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e6450aac5b2e8e47261280e9() {
  return __cxx_static_address_e6450aac5b2e8e47261280e9.reference || (__cxx_static_address_e6450aac5b2e8e47261280e9.reference = {
    __cReference: true,
    get value() { return SQUISHED____header_global_44d05a07af86e382; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:85
export const TELEPORTER____header_global_d6df4e107605a4af = ((((((70) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_63cb6fc474fe36dca0ac2fa8() {
  return __cxx_static_address_63cb6fc474fe36dca0ac2fa8.reference || (__cxx_static_address_63cb6fc474fe36dca0ac2fa8.reference = {
    __cReference: true,
    get value() { return TELEPORTER____header_global_d6df4e107605a4af; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:86
export const ELEVATOR_ON____header_global_f933ad01786c9e10 = ((((((71) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cbddf578ccd3097e242bc8ce() {
  return __cxx_static_address_cbddf578ccd3097e242bc8ce.reference || (__cxx_static_address_cbddf578ccd3097e242bc8ce.reference = {
    __cReference: true,
    get value() { return ELEVATOR_ON____header_global_f933ad01786c9e10; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:87
export const ELEVATOR_OFF____header_global_69dbd4c6bff9f3a2 = ((((((73) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2275594762e7098a8cf73d70() {
  return __cxx_static_address_2275594762e7098a8cf73d70.reference || (__cxx_static_address_2275594762e7098a8cf73d70.reference = {
    __cReference: true,
    get value() { return ELEVATOR_OFF____header_global_69dbd4c6bff9f3a2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:88
export const SUBWAY____header_global_5f575cc29b698098 = ((((((75) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ac4129f06d5f5d6cd8cf1326() {
  return __cxx_static_address_ac4129f06d5f5d6cd8cf1326.reference || (__cxx_static_address_ac4129f06d5f5d6cd8cf1326.reference = {
    __cReference: true,
    get value() { return SUBWAY____header_global_5f575cc29b698098; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:89
export const SWITCH_ON____header_global_e8bac3aa1affd217 = ((((((76) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_291f2344585b0d8dd2c6143e() {
  return __cxx_static_address_291f2344585b0d8dd2c6143e.reference || (__cxx_static_address_291f2344585b0d8dd2c6143e.reference = {
    __cReference: true,
    get value() { return SWITCH_ON____header_global_e8bac3aa1affd217; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:90
export const FLUSH_TOILET____header_global_91787be65dd30a76 = ((((((79) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_014537edd6a89d706b42cc60() {
  return __cxx_static_address_014537edd6a89d706b42cc60.reference || (__cxx_static_address_014537edd6a89d706b42cc60.reference = {
    __cReference: true,
    get value() { return FLUSH_TOILET____header_global_91787be65dd30a76; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:91
export const EARTHQUAKE____header_global_32e9afee2038dbb3 = ((((((81) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b3c23310486a1abe12e6fd7a() {
  return __cxx_static_address_b3c23310486a1abe12e6fd7a.reference || (__cxx_static_address_b3c23310486a1abe12e6fd7a.reference = {
    __cReference: true,
    get value() { return EARTHQUAKE____header_global_32e9afee2038dbb3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:92
export const END_OF_LEVEL_WARN____header_global_5a317f3877384d2a = ((((((83) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6a9d885c36ee999c22cee793() {
  return __cxx_static_address_6a9d885c36ee999c22cee793.reference || (__cxx_static_address_6a9d885c36ee999c22cee793.reference = {
    __cReference: true,
    get value() { return END_OF_LEVEL_WARN____header_global_5a317f3877384d2a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:93
export const WIND_AMBIENCE____header_global_cc1be4d3542d91c6 = ((((((91) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d2d16eb18653eb5de93512d3() {
  return __cxx_static_address_d2d16eb18653eb5de93512d3.reference || (__cxx_static_address_d2d16eb18653eb5de93512d3.reference = {
    __cReference: true,
    get value() { return WIND_AMBIENCE____header_global_cc1be4d3542d91c6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:94
export const SOMETHING_DRIPPING____header_global_77df84fb4316d147 = ((((((92) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_db9068d2099f6489068cd53f() {
  return __cxx_static_address_db9068d2099f6489068cd53f.reference || (__cxx_static_address_db9068d2099f6489068cd53f.reference = {
    __cReference: true,
    get value() { return SOMETHING_DRIPPING____header_global_77df84fb4316d147; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:95
export const BOS1_RECOG____header_global_101513dfae1c31de = ((((((97) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b3d4b364945ec7c6e787a393() {
  return __cxx_static_address_b3d4b364945ec7c6e787a393.reference || (__cxx_static_address_b3d4b364945ec7c6e787a393.reference = {
    __cReference: true,
    get value() { return BOS1_RECOG____header_global_101513dfae1c31de; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:96
export const BOS2_RECOG____header_global_f55a28c94bfef117 = ((((((102) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f3a1a3ec0d71b350e65dac59() {
  return __cxx_static_address_f3a1a3ec0d71b350e65dac59.reference || (__cxx_static_address_f3a1a3ec0d71b350e65dac59.reference = {
    __cReference: true,
    get value() { return BOS2_RECOG____header_global_f55a28c94bfef117; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:97
export const DUKE_GETWEAPON2____header_global_fa84956c70c7b943 = ((((((107) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0b80bb667fe305754e029298() {
  return __cxx_static_address_0b80bb667fe305754e029298.reference || (__cxx_static_address_0b80bb667fe305754e029298.reference = {
    __cReference: true,
    get value() { return DUKE_GETWEAPON2____header_global_fa84956c70c7b943; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:98
export const SHOTGUN_FIRE____header_global_925fa930cb225da4 = ((((((109) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d0abc2fb9451369989a3e959() {
  return __cxx_static_address_d0abc2fb9451369989a3e959.reference || (__cxx_static_address_d0abc2fb9451369989a3e959.reference = {
    __cReference: true,
    get value() { return SHOTGUN_FIRE____header_global_925fa930cb225da4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:99
export const PRED_RECOG____header_global_c1dc28f787567b75 = ((((((111) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_437a9585564efc7c4bbb7904() {
  return __cxx_static_address_437a9585564efc7c4bbb7904.reference || (__cxx_static_address_437a9585564efc7c4bbb7904.reference = {
    __cReference: true,
    get value() { return PRED_RECOG____header_global_c1dc28f787567b75; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:100
export const CAPT_RECOG____header_global_09680bd33baa0ecc = ((((((117) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_00b9d4dce0b081d06c3ba699() {
  return __cxx_static_address_00b9d4dce0b081d06c3ba699.reference || (__cxx_static_address_00b9d4dce0b081d06c3ba699.reference = {
    __cReference: true,
    get value() { return CAPT_RECOG____header_global_09680bd33baa0ecc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:101
export const PIG_RECOG____header_global_32d6cad8e9cedf8d = ((((((121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2102154e0c87d70dd6dc7fb9() {
  return __cxx_static_address_2102154e0c87d70dd6dc7fb9.reference || (__cxx_static_address_2102154e0c87d70dd6dc7fb9.reference = {
    __cReference: true,
    get value() { return PIG_RECOG____header_global_32d6cad8e9cedf8d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:102
export const RECO_ROAM____header_global_6511ba53a64b7d3f = ((((((125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3d9afd71b36bf24a44b07751() {
  return __cxx_static_address_3d9afd71b36bf24a44b07751.reference || (__cxx_static_address_3d9afd71b36bf24a44b07751.reference = {
    __cReference: true,
    get value() { return RECO_ROAM____header_global_6511ba53a64b7d3f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:103
export const RECO_RECOG____header_global_9f502190fe206d13 = ((((((126) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a069595f89781a5834dbce0e() {
  return __cxx_static_address_a069595f89781a5834dbce0e.reference || (__cxx_static_address_a069595f89781a5834dbce0e.reference = {
    __cReference: true,
    get value() { return RECO_RECOG____header_global_9f502190fe206d13; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:104
export const RECO_ATTACK____header_global_2ff6352a5d99c3a9 = ((((((127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d581cbe939d1ed4cb52d415d() {
  return __cxx_static_address_d581cbe939d1ed4cb52d415d.reference || (__cxx_static_address_d581cbe939d1ed4cb52d415d.reference = {
    __cReference: true,
    get value() { return RECO_ATTACK____header_global_2ff6352a5d99c3a9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:105
export const RECO_PAIN____header_global_259925cd9947bc65 = ((((((128) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_735cce4d74a3f0189ab4d8b4() {
  return __cxx_static_address_735cce4d74a3f0189ab4d8b4.reference || (__cxx_static_address_735cce4d74a3f0189ab4d8b4.reference = {
    __cReference: true,
    get value() { return RECO_PAIN____header_global_259925cd9947bc65; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:106
export const DRON_RECOG____header_global_7c16f6cac47ce8e8 = ((((((131) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_70a9a538f114041f30ee67a7() {
  return __cxx_static_address_70a9a538f114041f30ee67a7.reference || (__cxx_static_address_70a9a538f114041f30ee67a7.reference = {
    __cReference: true,
    get value() { return DRON_RECOG____header_global_7c16f6cac47ce8e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:107
export const COMM_RECOG____header_global_cb7045b0e55b9e89 = ((((((136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cb7caab6b30ed54f93cfa3c8() {
  return __cxx_static_address_cb7caab6b30ed54f93cfa3c8.reference || (__cxx_static_address_cb7caab6b30ed54f93cfa3c8.reference = {
    __cReference: true,
    get value() { return COMM_RECOG____header_global_cb7045b0e55b9e89; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:108
export const OCTA_RECOG____header_global_b3770630463c724f = ((((((141) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a4fffb68de7d136724576b12() {
  return __cxx_static_address_a4fffb68de7d136724576b12.reference || (__cxx_static_address_a4fffb68de7d136724576b12.reference = {
    __cReference: true,
    get value() { return OCTA_RECOG____header_global_b3770630463c724f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:109
export const TURR_RECOG____header_global_3e37feea1dc8450b = ((((((146) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2abee7d57458c1f38fc2d6c0() {
  return __cxx_static_address_2abee7d57458c1f38fc2d6c0.reference || (__cxx_static_address_2abee7d57458c1f38fc2d6c0.reference = {
    __cReference: true,
    get value() { return TURR_RECOG____header_global_3e37feea1dc8450b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:110
export const SLIM_DYING____header_global_6cfc64a2f0abb419 = ((((((149) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dd12c0368d22de32082403a9() {
  return __cxx_static_address_dd12c0368d22de32082403a9.reference || (__cxx_static_address_dd12c0368d22de32082403a9.reference = {
    __cReference: true,
    get value() { return SLIM_DYING____header_global_6cfc64a2f0abb419; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:111
export const BOS3_RECOG____header_global_726ebedb5735177b = ((((((151) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9c6de6b5c7e551df7ad6467f() {
  return __cxx_static_address_9c6de6b5c7e551df7ad6467f.reference || (__cxx_static_address_9c6de6b5c7e551df7ad6467f.reference = {
    __cReference: true,
    get value() { return BOS3_RECOG____header_global_726ebedb5735177b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:112
export const BOS1_WALK____header_global_7785c54907382827 = ((((((156) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1509c64291b88bfbc4b03d2c() {
  return __cxx_static_address_1509c64291b88bfbc4b03d2c.reference || (__cxx_static_address_1509c64291b88bfbc4b03d2c.reference = {
    __cReference: true,
    get value() { return BOS1_WALK____header_global_7785c54907382827; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:113
export const THUD____header_global_abdb23c0c6ee45ca = ((((((158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2a951d46015d262f225e67ab() {
  return __cxx_static_address_2a951d46015d262f225e67ab.reference || (__cxx_static_address_2a951d46015d262f225e67ab.reference = {
    __cReference: true,
    get value() { return THUD____header_global_abdb23c0c6ee45ca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:114
export const WIERDSHOT_FLY____header_global_9b6686c82943a1fb = ((((((160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9e91412d4a29f136c819480d() {
  return __cxx_static_address_9e91412d4a29f136c819480d.reference || (__cxx_static_address_9e91412d4a29f136c819480d.reference = {
    __cReference: true,
    get value() { return WIERDSHOT_FLY____header_global_9b6686c82943a1fb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:115
export const SLIM_ROAM____header_global_2216197a55931628 = ((((((163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b7806fcc1153f0253024f1a4() {
  return __cxx_static_address_b7806fcc1153f0253024f1a4.reference || (__cxx_static_address_b7806fcc1153f0253024f1a4.reference = {
    __cReference: true,
    get value() { return SLIM_ROAM____header_global_2216197a55931628; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:116
export const SHOTGUN_COCK____header_global_fdd4bdc7806ea938 = ((((((169) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_234227b1f689bd480cf2bf61() {
  return __cxx_static_address_234227b1f689bd480cf2bf61.reference || (__cxx_static_address_234227b1f689bd480cf2bf61.reference = {
    __cReference: true,
    get value() { return SHOTGUN_COCK____header_global_fdd4bdc7806ea938; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:117
export const GENERIC_AMBIENCE17____header_global_1744877c1f6a676c = ((((((177) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bebd1bed980ee309ce7b25be() {
  return __cxx_static_address_bebd1bed980ee309ce7b25be.reference || (__cxx_static_address_bebd1bed980ee309ce7b25be.reference = {
    __cReference: true,
    get value() { return GENERIC_AMBIENCE17____header_global_1744877c1f6a676c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:118
export const BONUS_SPEECH1____header_global_8eb57ac5b79922c3 = ((((((195) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ff31891744ace854be2a6d8a() {
  return __cxx_static_address_ff31891744ace854be2a6d8a.reference || (__cxx_static_address_ff31891744ace854be2a6d8a.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH1____header_global_8eb57ac5b79922c3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:119
export const BONUS_SPEECH2____header_global_56520b5f2194959e = ((((((196) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_89c4bcc08dbcd6225385bf3f() {
  return __cxx_static_address_89c4bcc08dbcd6225385bf3f.reference || (__cxx_static_address_89c4bcc08dbcd6225385bf3f.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH2____header_global_56520b5f2194959e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:120
export const BONUS_SPEECH3____header_global_4e9b755c4810a7a0 = ((((((197) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d150ea68dddf276b0d806571() {
  return __cxx_static_address_d150ea68dddf276b0d806571.reference || (__cxx_static_address_d150ea68dddf276b0d806571.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH3____header_global_4e9b755c4810a7a0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:121
export const BONUS_SPEECH4____header_global_efe5e70758f34c24 = ((((((199) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7b5366c67afa3fb02cd96c90() {
  return __cxx_static_address_7b5366c67afa3fb02cd96c90.reference || (__cxx_static_address_7b5366c67afa3fb02cd96c90.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH4____header_global_efe5e70758f34c24; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:122
export const DUKE_LAND_HURT____header_global_29e6f64f97077e7b = ((((((200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_26eceb6f67c746d39cb34e6a() {
  return __cxx_static_address_26eceb6f67c746d39cb34e6a.reference || (__cxx_static_address_26eceb6f67c746d39cb34e6a.reference = {
    __cReference: true,
    get value() { return DUKE_LAND_HURT____header_global_29e6f64f97077e7b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:123
export const DUKE_SEARCH2____header_global_ae40639ee910d556 = ((((((207) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ba162d5f0ce992b8433a8ab9() {
  return __cxx_static_address_ba162d5f0ce992b8433a8ab9.reference || (__cxx_static_address_ba162d5f0ce992b8433a8ab9.reference = {
    __cReference: true,
    get value() { return DUKE_SEARCH2____header_global_ae40639ee910d556; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:124
export const DUKE_CRACK2____header_global_1d153de4864ca3ae = ((((((208) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7628e83a1febe4bdfdf1ca9f() {
  return __cxx_static_address_7628e83a1febe4bdfdf1ca9f.reference || (__cxx_static_address_7628e83a1febe4bdfdf1ca9f.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK2____header_global_1d153de4864ca3ae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:125
export const DUKE_SEARCH____header_global_f0bff2e74a954038 = ((((((209) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c454933c6a5bfeab52712254() {
  return __cxx_static_address_c454933c6a5bfeab52712254.reference || (__cxx_static_address_c454933c6a5bfeab52712254.reference = {
    __cReference: true,
    get value() { return DUKE_SEARCH____header_global_f0bff2e74a954038; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:126
export const DUKE_GET____header_global_1316e36797d11fb8 = ((((((210) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0186f93bb8a2d15903dcde8c() {
  return __cxx_static_address_0186f93bb8a2d15903dcde8c.reference || (__cxx_static_address_0186f93bb8a2d15903dcde8c.reference = {
    __cReference: true,
    get value() { return DUKE_GET____header_global_1316e36797d11fb8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:127
export const DUKE_LONGTERM_PAIN____header_global_acb4592aa8be659c = ((((((211) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_572a0f272091c4aac3fa7ebd() {
  return __cxx_static_address_572a0f272091c4aac3fa7ebd.reference || (__cxx_static_address_572a0f272091c4aac3fa7ebd.reference = {
    __cReference: true,
    get value() { return DUKE_LONGTERM_PAIN____header_global_acb4592aa8be659c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:128
export const MONITOR_ACTIVE____header_global_73f9d6e8bf685437 = ((((((212) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0f80c713f2d3210f0bfd25ca() {
  return __cxx_static_address_0f80c713f2d3210f0bfd25ca.reference || (__cxx_static_address_0f80c713f2d3210f0bfd25ca.reference = {
    __cReference: true,
    get value() { return MONITOR_ACTIVE____header_global_73f9d6e8bf685437; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:129
export const NITEVISION_ONOFF____header_global_810a8d4cfe9e08a0 = ((((((213) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_de1a23880256703aa16cfce7() {
  return __cxx_static_address_de1a23880256703aa16cfce7.reference || (__cxx_static_address_de1a23880256703aa16cfce7.reference = {
    __cReference: true,
    get value() { return NITEVISION_ONOFF____header_global_810a8d4cfe9e08a0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:130
export const DUKE_CRACK_FIRST____header_global_4a9d39347ed3aecb = ((((((215) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1207783fbf6037af58223221() {
  return __cxx_static_address_1207783fbf6037af58223221.reference || (__cxx_static_address_1207783fbf6037af58223221.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK_FIRST____header_global_4a9d39347ed3aecb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:131
export const DUKE_USEMEDKIT____header_global_9c91a9cea8a5249b = ((((((216) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b11637327c81c53b128ef8b8() {
  return __cxx_static_address_b11637327c81c53b128ef8b8.reference || (__cxx_static_address_b11637327c81c53b128ef8b8.reference = {
    __cReference: true,
    get value() { return DUKE_USEMEDKIT____header_global_9c91a9cea8a5249b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:132
export const DUKE_TAKEPILLS____header_global_5cefb1cadafb3908 = ((((((217) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a03280d39f638938af7e55f6() {
  return __cxx_static_address_a03280d39f638938af7e55f6.reference || (__cxx_static_address_a03280d39f638938af7e55f6.reference = {
    __cReference: true,
    get value() { return DUKE_TAKEPILLS____header_global_5cefb1cadafb3908; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:133
export const DUKE_PISSRELIEF____header_global_4a0912062066d0ce = ((((((218) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f205519080210fcc713e4912() {
  return __cxx_static_address_f205519080210fcc713e4912.reference || (__cxx_static_address_f205519080210fcc713e4912.reference = {
    __cReference: true,
    get value() { return DUKE_PISSRELIEF____header_global_4a0912062066d0ce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:134
export const SELECT_WEAPON____header_global_708478e48613605c = ((((((219) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7f7293aff80d3f827cad48d1() {
  return __cxx_static_address_7f7293aff80d3f827cad48d1.reference || (__cxx_static_address_7f7293aff80d3f827cad48d1.reference = {
    __cReference: true,
    get value() { return SELECT_WEAPON____header_global_708478e48613605c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:135
export const JIBBED_ACTOR5____header_global_8693ee4c40ce6e7b = ((((((226) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3a88688c1cb67e1b5c0b379f() {
  return __cxx_static_address_3a88688c1cb67e1b5c0b379f.reference || (__cxx_static_address_3a88688c1cb67e1b5c0b379f.reference = {
    __cReference: true,
    get value() { return JIBBED_ACTOR5____header_global_8693ee4c40ce6e7b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:136
export const JIBBED_ACTOR6____header_global_c72d1c724c1232e8 = ((((((227) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3c69ed141fd663d34a816f87() {
  return __cxx_static_address_3c69ed141fd663d34a816f87.reference || (__cxx_static_address_3c69ed141fd663d34a816f87.reference = {
    __cReference: true,
    get value() { return JIBBED_ACTOR6____header_global_c72d1c724c1232e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:137
export const DUKE_GOTHEALTHATLOW____header_global_80928bf2070725ba = ((((((229) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5737c6fbdc2e29933c6f00e8() {
  return __cxx_static_address_5737c6fbdc2e29933c6f00e8.reference || (__cxx_static_address_5737c6fbdc2e29933c6f00e8.reference = {
    __cReference: true,
    get value() { return DUKE_GOTHEALTHATLOW____header_global_80928bf2070725ba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:138
export const BOSSTALKTODUKE____header_global_14292e7063322058 = ((((((230) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_360db17ea9009d4ea1cbac2f() {
  return __cxx_static_address_360db17ea9009d4ea1cbac2f.reference || (__cxx_static_address_360db17ea9009d4ea1cbac2f.reference = {
    __cReference: true,
    get value() { return BOSSTALKTODUKE____header_global_14292e7063322058; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:139
export const WAR_AMBIENCE2____header_global_4b609ac644a8e9f1 = ((((((232) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_07085781e2d04b6562dafc58() {
  return __cxx_static_address_07085781e2d04b6562dafc58.reference || (__cxx_static_address_07085781e2d04b6562dafc58.reference = {
    __cReference: true,
    get value() { return WAR_AMBIENCE2____header_global_4b609ac644a8e9f1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:140
export const EXITMENUSOUND____header_global_73bde16add67850f = ((((((243) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b5bb4c4f7c11f2dbe83f7990() {
  return __cxx_static_address_b5bb4c4f7c11f2dbe83f7990.reference || (__cxx_static_address_b5bb4c4f7c11f2dbe83f7990.reference = {
    __cReference: true,
    get value() { return EXITMENUSOUND____header_global_73bde16add67850f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:141
export const FLY_BY____header_global_9e1a9ab27f77f82d = ((((((244) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_44ce9e700128e06425d17811() {
  return __cxx_static_address_44ce9e700128e06425d17811.reference || (__cxx_static_address_44ce9e700128e06425d17811.reference = {
    __cReference: true,
    get value() { return FLY_BY____header_global_9e1a9ab27f77f82d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:142
export const DUKE_SCREAM____header_global_3d2d0e5b7e011c85 = ((((((245) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1302b42eb74bd27559b61f69() {
  return __cxx_static_address_1302b42eb74bd27559b61f69.reference || (__cxx_static_address_1302b42eb74bd27559b61f69.reference = {
    __cReference: true,
    get value() { return DUKE_SCREAM____header_global_3d2d0e5b7e011c85; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:143
export const SHRINKER_HIT____header_global_8f416ee497376c78 = ((((((246) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a2054086bfec62e27c707b03() {
  return __cxx_static_address_a2054086bfec62e27c707b03.reference || (__cxx_static_address_a2054086bfec62e27c707b03.reference = {
    __cReference: true,
    get value() { return SHRINKER_HIT____header_global_8f416ee497376c78; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:144
export const RATTY____header_global_6477aa8f933c1e64 = ((((((247) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5f683b1326e9fcf5cdf676f0() {
  return __cxx_static_address_5f683b1326e9fcf5cdf676f0.reference || (__cxx_static_address_5f683b1326e9fcf5cdf676f0.reference = {
    __cReference: true,
    get value() { return RATTY____header_global_6477aa8f933c1e64; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:145
export const BONUSMUSIC____header_global_e6c85d762f370a81 = ((((((249) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0fc4bd7ea746b51fd8e1b782() {
  return __cxx_static_address_0fc4bd7ea746b51fd8e1b782.reference || (__cxx_static_address_0fc4bd7ea746b51fd8e1b782.reference = {
    __cReference: true,
    get value() { return BONUSMUSIC____header_global_e6c85d762f370a81; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:146
export const DUKE_GETWEAPON6____header_global_09d708e66accfc99 = ((((((264) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_134e2e30131c79b4ca60d36b() {
  return __cxx_static_address_134e2e30131c79b4ca60d36b.reference || (__cxx_static_address_134e2e30131c79b4ca60d36b.reference = {
    __cReference: true,
    get value() { return DUKE_GETWEAPON6____header_global_09d708e66accfc99; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:147
export const ALIEN_SWITCH1____header_global_4a3ba2bcdce63222 = ((((((272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9685283db3c4f4c35e02709e() {
  return __cxx_static_address_9685283db3c4f4c35e02709e.reference || (__cxx_static_address_9685283db3c4f4c35e02709e.reference = {
    __cReference: true,
    get value() { return ALIEN_SWITCH1____header_global_4a3ba2bcdce63222; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:148
export const RIPHEADNECK____header_global_b5f1375c85a173b3 = ((((((284) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_10f6f5f4561ad3cded88c6e9() {
  return __cxx_static_address_10f6f5f4561ad3cded88c6e9.reference || (__cxx_static_address_10f6f5f4561ad3cded88c6e9.reference = {
    __cReference: true,
    get value() { return RIPHEADNECK____header_global_b5f1375c85a173b3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:149
export const ENDSEQVOL3SND4____header_global_f80193b458f8918d = ((((((288) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_23581feb697b4b0fb1115a12() {
  return __cxx_static_address_23581feb697b4b0fb1115a12.reference || (__cxx_static_address_23581feb697b4b0fb1115a12.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND4____header_global_f80193b458f8918d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:150
export const ENDSEQVOL3SND5____header_global_db8f0a336f821739 = ((((((289) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_978efc29a1ab8c8bedc182b8() {
  return __cxx_static_address_978efc29a1ab8c8bedc182b8.reference || (__cxx_static_address_978efc29a1ab8c8bedc182b8.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND5____header_global_db8f0a336f821739; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:151
export const ENDSEQVOL3SND6____header_global_5e81c7795b0daaaa = ((((((290) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b04f7115cf915dd87aee8bbe() {
  return __cxx_static_address_b04f7115cf915dd87aee8bbe.reference || (__cxx_static_address_b04f7115cf915dd87aee8bbe.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND6____header_global_5e81c7795b0daaaa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:152
export const ENDSEQVOL3SND7____header_global_79f8dd0540869025 = ((((((291) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_058c0602865c60b64a5ec9cc() {
  return __cxx_static_address_058c0602865c60b64a5ec9cc.reference || (__cxx_static_address_058c0602865c60b64a5ec9cc.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND7____header_global_79f8dd0540869025; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:153
export const ENDSEQVOL3SND8____header_global_482290b1032cf870 = ((((((292) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c072eab355849d04b8bf58af() {
  return __cxx_static_address_c072eab355849d04b8bf58af.reference || (__cxx_static_address_c072eab355849d04b8bf58af.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND8____header_global_482290b1032cf870; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:154
export const ENDSEQVOL3SND9____header_global_8f1fd80b23144e09 = ((((((293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fbc8a00d4521d595f0878c76() {
  return __cxx_static_address_fbc8a00d4521d595f0878c76.reference || (__cxx_static_address_fbc8a00d4521d595f0878c76.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND9____header_global_8f1fd80b23144e09; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:155
export const WHIPYOURASS____header_global_9e687922c8bcdef0 = ((((((294) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_36c32da15f75bbed191dde71() {
  return __cxx_static_address_36c32da15f75bbed191dde71.reference || (__cxx_static_address_36c32da15f75bbed191dde71.reference = {
    __cReference: true,
    get value() { return WHIPYOURASS____header_global_9e687922c8bcdef0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:156
export const ENDSEQVOL2SND1____header_global_135f46eabd080a0f = ((((((295) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c61dcf77be231c4063690b28() {
  return __cxx_static_address_c61dcf77be231c4063690b28.reference || (__cxx_static_address_c61dcf77be231c4063690b28.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND1____header_global_135f46eabd080a0f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:157
export const ENDSEQVOL2SND2____header_global_73f0991d94f39e6e = ((((((296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_185766b5f92b91036e6544d8() {
  return __cxx_static_address_185766b5f92b91036e6544d8.reference || (__cxx_static_address_185766b5f92b91036e6544d8.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND2____header_global_73f0991d94f39e6e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:158
export const ENDSEQVOL2SND3____header_global_8cc527ff2b76128b = ((((((297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3edefeb5b5f3e3cbe25deb73() {
  return __cxx_static_address_3edefeb5b5f3e3cbe25deb73.reference || (__cxx_static_address_3edefeb5b5f3e3cbe25deb73.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND3____header_global_8cc527ff2b76128b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:159
export const ENDSEQVOL2SND4____header_global_af22d525a5f2a137 = ((((((298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e00d2962fd1b5748708e5d5b() {
  return __cxx_static_address_e00d2962fd1b5748708e5d5b.reference || (__cxx_static_address_e00d2962fd1b5748708e5d5b.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND4____header_global_af22d525a5f2a137; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:160
export const ENDSEQVOL2SND5____header_global_7d502bcc21aaefd1 = ((((((299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1af17bb4ea76381ece1a5bad() {
  return __cxx_static_address_1af17bb4ea76381ece1a5bad.reference || (__cxx_static_address_1af17bb4ea76381ece1a5bad.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND5____header_global_7d502bcc21aaefd1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:161
export const ENDSEQVOL2SND6____header_global_70147479c35b21de = ((((((300) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5b5aeb4eeedd8d22d5f789b5() {
  return __cxx_static_address_5b5aeb4eeedd8d22d5f789b5.reference || (__cxx_static_address_5b5aeb4eeedd8d22d5f789b5.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND6____header_global_70147479c35b21de; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:162
export const ENDSEQVOL2SND7____header_global_812468e429de01cc = ((((((301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7185cdb59979ba47d67e66a5() {
  return __cxx_static_address_7185cdb59979ba47d67e66a5.reference || (__cxx_static_address_7185cdb59979ba47d67e66a5.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND7____header_global_812468e429de01cc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:163
export const SOMETHINGFROZE____header_global_9b62688e3b299baf = ((((((303) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a86070f5a505c5d5168d0faa() {
  return __cxx_static_address_a86070f5a505c5d5168d0faa.reference || (__cxx_static_address_a86070f5a505c5d5168d0faa.reference = {
    __cReference: true,
    get value() { return SOMETHINGFROZE____header_global_9b62688e3b299baf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:164
export const WIND_REPEAT____header_global_1d6ea9fa039a37d0 = ((((((308) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_27f0334de1e19c8baa1311d1() {
  return __cxx_static_address_27f0334de1e19c8baa1311d1.reference || (__cxx_static_address_27f0334de1e19c8baa1311d1.reference = {
    __cReference: true,
    get value() { return WIND_REPEAT____header_global_1d6ea9fa039a37d0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:165
export const BOS4_RECOG____header_global_70665894af7e9e60 = ((((((342) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8e15784dffdea7da05db95bf() {
  return __cxx_static_address_8e15784dffdea7da05db95bf.reference || (__cxx_static_address_8e15784dffdea7da05db95bf.reference = {
    __cReference: true,
    get value() { return BOS4_RECOG____header_global_70665894af7e9e60; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:166
export const LIGHTNING_SLAP____header_global_399c58e69ebf1f4f = ((((((351) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_706f5a103b8e65957caa5f6f() {
  return __cxx_static_address_706f5a103b8e65957caa5f6f.reference || (__cxx_static_address_706f5a103b8e65957caa5f6f.reference = {
    __cReference: true,
    get value() { return LIGHTNING_SLAP____header_global_399c58e69ebf1f4f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:167
export const THUNDER____header_global_030a0545e8242752 = ((((((352) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3fb221479b75d19db275fd29() {
  return __cxx_static_address_3fb221479b75d19db275fd29.reference || (__cxx_static_address_3fb221479b75d19db275fd29.reference = {
    __cReference: true,
    get value() { return THUNDER____header_global_030a0545e8242752; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:168
export const INTRO4_1____header_global_3295d1391b15cbc3 = ((((((363) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_910a48b7e55f98e387acc642() {
  return __cxx_static_address_910a48b7e55f98e387acc642.reference || (__cxx_static_address_910a48b7e55f98e387acc642.reference = {
    __cReference: true,
    get value() { return INTRO4_1____header_global_3295d1391b15cbc3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:169
export const INTRO4_2____header_global_f623620f2f0d94c5 = ((((((364) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1b9424c1f78266fa1a2c066e() {
  return __cxx_static_address_1b9424c1f78266fa1a2c066e.reference || (__cxx_static_address_1b9424c1f78266fa1a2c066e.reference = {
    __cReference: true,
    get value() { return INTRO4_2____header_global_f623620f2f0d94c5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:170
export const INTRO4_3____header_global_ce2efdb1825ddc1c = ((((((365) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b965e0bee8d7fb5b994949e3() {
  return __cxx_static_address_b965e0bee8d7fb5b994949e3.reference || (__cxx_static_address_b965e0bee8d7fb5b994949e3.reference = {
    __cReference: true,
    get value() { return INTRO4_3____header_global_ce2efdb1825ddc1c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:171
export const INTRO4_4____header_global_2d1ca35ec9172c61 = ((((((366) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0482659114cd4b55ec27e9d5() {
  return __cxx_static_address_0482659114cd4b55ec27e9d5.reference || (__cxx_static_address_0482659114cd4b55ec27e9d5.reference = {
    __cReference: true,
    get value() { return INTRO4_4____header_global_2d1ca35ec9172c61; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:172
export const INTRO4_5____header_global_fc9c5847204290d3 = ((((((367) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ad13af167be1f091efd177d5() {
  return __cxx_static_address_ad13af167be1f091efd177d5.reference || (__cxx_static_address_ad13af167be1f091efd177d5.reference = {
    __cReference: true,
    get value() { return INTRO4_5____header_global_fc9c5847204290d3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:173
export const INTRO4_6____header_global_c92622b585f12acb = ((((((368) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_65383b467958ab49efccce4d() {
  return __cxx_static_address_65383b467958ab49efccce4d.reference || (__cxx_static_address_65383b467958ab49efccce4d.reference = {
    __cReference: true,
    get value() { return INTRO4_6____header_global_c92622b585f12acb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:174
export const BOSS4_DEADSPEECH____header_global_490302bbffcb2d6b = ((((((370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_566f0a9097a791dc6a84e37d() {
  return __cxx_static_address_566f0a9097a791dc6a84e37d.reference || (__cxx_static_address_566f0a9097a791dc6a84e37d.reference = {
    __cReference: true,
    get value() { return BOSS4_DEADSPEECH____header_global_490302bbffcb2d6b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:175
export const BOSS4_FIRSTSEE____header_global_e2738c076cb17625 = ((((((371) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_814a0cc79816a8c2a36f7f89() {
  return __cxx_static_address_814a0cc79816a8c2a36f7f89.reference || (__cxx_static_address_814a0cc79816a8c2a36f7f89.reference = {
    __cReference: true,
    get value() { return BOSS4_FIRSTSEE____header_global_e2738c076cb17625; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:176
export const VOL4ENDSND1____header_global_28999fe2ed100622 = ((((((384) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a5e612900ee57cb17813adfc() {
  return __cxx_static_address_a5e612900ee57cb17813adfc.reference || (__cxx_static_address_a5e612900ee57cb17813adfc.reference = {
    __cReference: true,
    get value() { return VOL4ENDSND1____header_global_28999fe2ed100622; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:177
export const VOL4ENDSND2____header_global_715eacaafb63b396 = ((((((385) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0e759e33087cf2ef57705f72() {
  return __cxx_static_address_0e759e33087cf2ef57705f72.reference || (__cxx_static_address_0e759e33087cf2ef57705f72.reference = {
    __cReference: true,
    get value() { return VOL4ENDSND2____header_global_715eacaafb63b396; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:178
export const EXPANDERSHOOT____header_global_4d4dbc765857dd79 = ((((((388) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b27ef8b98c4de4f76d062c44() {
  return __cxx_static_address_b27ef8b98c4de4f76d062c44.reference || (__cxx_static_address_b27ef8b98c4de4f76d062c44.reference = {
    __cReference: true,
    get value() { return EXPANDERSHOOT____header_global_4d4dbc765857dd79; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:179
export const INTRO4_B____header_global_d0970e7a9233888f = ((((((392) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c5b7e81ad8cfa06cc5b816f6() {
  return __cxx_static_address_c5b7e81ad8cfa06cc5b816f6.reference || (__cxx_static_address_c5b7e81ad8cfa06cc5b816f6.reference = {
    __cReference: true,
    get value() { return INTRO4_B____header_global_d0970e7a9233888f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:180
export const BIGBANG____header_global_4fa2a9fb882e0427 = ((((((393) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2b6fd53705ad0013bef40812() {
  return __cxx_static_address_2b6fd53705ad0013bef40812.reference || (__cxx_static_address_2b6fd53705ad0013bef40812.reference = {
    __cReference: true,
    get value() { return BIGBANG____header_global_4fa2a9fb882e0427; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:181
export const FLAMETHROWER_INTRO____header_global_03564ac609350849 = ((((((398) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eef65074cf46f78c4922ccc1() {
  return __cxx_static_address_eef65074cf46f78c4922ccc1.reference || (__cxx_static_address_eef65074cf46f78c4922ccc1.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_INTRO____header_global_03564ac609350849; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:182
export const FLAMETHROWER_LOOP____header_global_547d04e8d183f484 = ((((((399) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_921016bc2a7f6ad1434ffd15() {
  return __cxx_static_address_921016bc2a7f6ad1434ffd15.reference || (__cxx_static_address_921016bc2a7f6ad1434ffd15.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_LOOP____header_global_547d04e8d183f484; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:183
export const FLAMETHROWER_END____header_global_687d7b22aa3d2cbd = ((((((400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_644d20615c65a96c4de03d3b() {
  return __cxx_static_address_644d20615c65a96c4de03d3b.reference || (__cxx_static_address_644d20615c65a96c4de03d3b.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_END____header_global_687d7b22aa3d2cbd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:184
export const E5L7_DUKE_QUIT_YOU____header_global_abf8af5b8f8c7b83 = ((((((401) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5bcd2d19f187a0675663c7ac() {
  return __cxx_static_address_5bcd2d19f187a0675663c7ac.reference || (__cxx_static_address_5bcd2d19f187a0675663c7ac.reference = {
    __cReference: true,
    get value() { return E5L7_DUKE_QUIT_YOU____header_global_abf8af5b8f8c7b83; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:187
export const SECTOREFFECTOR____header_global_fb9686519d4d1996 = ((((((1) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6973328239b2da31fbc22e6c() {
  return __cxx_static_address_6973328239b2da31fbc22e6c.reference || (__cxx_static_address_6973328239b2da31fbc22e6c.reference = {
    __cReference: true,
    get value() { return SECTOREFFECTOR____header_global_fb9686519d4d1996; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:188
export const ACTIVATOR____header_global_edf30afff8d1c930 = ((((((2) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8ec820d0b54af56bda96d324() {
  return __cxx_static_address_8ec820d0b54af56bda96d324.reference || (__cxx_static_address_8ec820d0b54af56bda96d324.reference = {
    __cReference: true,
    get value() { return ACTIVATOR____header_global_edf30afff8d1c930; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:189
export const TOUCHPLATE____header_global_69739c6c07f303bb = ((((((3) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8fafc228a09c3b58f295c669() {
  return __cxx_static_address_8fafc228a09c3b58f295c669.reference || (__cxx_static_address_8fafc228a09c3b58f295c669.reference = {
    __cReference: true,
    get value() { return TOUCHPLATE____header_global_69739c6c07f303bb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:190
export const ACTIVATORLOCKED____header_global_94fe5c274a1a0cee = ((((((4) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_543ee81d66633f9cde81da65() {
  return __cxx_static_address_543ee81d66633f9cde81da65.reference || (__cxx_static_address_543ee81d66633f9cde81da65.reference = {
    __cReference: true,
    get value() { return ACTIVATORLOCKED____header_global_94fe5c274a1a0cee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:191
export const MUSICANDSFX____header_global_f50666df40f4d2b8 = ((((((5) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cfe9b0aaa5ac5644f00dcf70() {
  return __cxx_static_address_cfe9b0aaa5ac5644f00dcf70.reference || (__cxx_static_address_cfe9b0aaa5ac5644f00dcf70.reference = {
    __cReference: true,
    get value() { return MUSICANDSFX____header_global_f50666df40f4d2b8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:192
export const LOCATORS____header_global_a760b36a044f9d68 = ((((((6) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3bd66944bfc1d04bdae5a9f7() {
  return __cxx_static_address_3bd66944bfc1d04bdae5a9f7.reference || (__cxx_static_address_3bd66944bfc1d04bdae5a9f7.reference = {
    __cReference: true,
    get value() { return LOCATORS____header_global_a760b36a044f9d68; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:193
export const CYCLER____header_global_b4761bff8eee64ea = ((((((7) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_699cb5a8224cd46c75152bce() {
  return __cxx_static_address_699cb5a8224cd46c75152bce.reference || (__cxx_static_address_699cb5a8224cd46c75152bce.reference = {
    __cReference: true,
    get value() { return CYCLER____header_global_b4761bff8eee64ea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:194
export const MASTERSWITCH____header_global_e5f0ea7a3bfb707a = ((((((8) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_23c7792792e8a15ee86e49b4() {
  return __cxx_static_address_23c7792792e8a15ee86e49b4.reference || (__cxx_static_address_23c7792792e8a15ee86e49b4.reference = {
    __cReference: true,
    get value() { return MASTERSWITCH____header_global_e5f0ea7a3bfb707a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:195
export const RESPAWN____header_global_96609ab8a2c45912 = ((((((9) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f7ffbbd07414c590b1645de7() {
  return __cxx_static_address_f7ffbbd07414c590b1645de7.reference || (__cxx_static_address_f7ffbbd07414c590b1645de7.reference = {
    __cReference: true,
    get value() { return RESPAWN____header_global_96609ab8a2c45912; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:196
export const GPSPEED____header_global_b90c8c6a34bd86f5 = ((((((10) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7bf565164f72d34b02f7b5fd() {
  return __cxx_static_address_7bf565164f72d34b02f7b5fd.reference || (__cxx_static_address_7bf565164f72d34b02f7b5fd.reference = {
    __cReference: true,
    get value() { return GPSPEED____header_global_b90c8c6a34bd86f5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:197
export const FOF____header_global_832f3d6d7eaae48e = ((((((13) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9829d0725c539e94ce062ed1() {
  return __cxx_static_address_9829d0725c539e94ce062ed1.reference || (__cxx_static_address_9829d0725c539e94ce062ed1.reference = {
    __cReference: true,
    get value() { return FOF____header_global_832f3d6d7eaae48e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:198
export const ARROW____header_global_8d8cd53c668e07fb = ((((((20) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e7346e97ab41ff4fd884a2d8() {
  return __cxx_static_address_e7346e97ab41ff4fd884a2d8.reference || (__cxx_static_address_e7346e97ab41ff4fd884a2d8.reference = {
    __cReference: true,
    get value() { return ARROW____header_global_8d8cd53c668e07fb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:199
export const FIRSTGUNSPRITE____header_global_8ef986cf9f1cb31d = ((((((21) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ecb6b5215dd13877d2b2cadb() {
  return __cxx_static_address_ecb6b5215dd13877d2b2cadb.reference || (__cxx_static_address_ecb6b5215dd13877d2b2cadb.reference = {
    __cReference: true,
    get value() { return FIRSTGUNSPRITE____header_global_8ef986cf9f1cb31d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:200
export const CHAINGUNSPRITE____header_global_c8ff518cf91547ef = ((((((22) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_34cc732bdf4b39e0c49210af() {
  return __cxx_static_address_34cc732bdf4b39e0c49210af.reference || (__cxx_static_address_34cc732bdf4b39e0c49210af.reference = {
    __cReference: true,
    get value() { return CHAINGUNSPRITE____header_global_c8ff518cf91547ef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:201
export const RPGSPRITE____header_global_1d5ab44381582d8a = ((((((23) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_44a3617b7722f733d75d8c15() {
  return __cxx_static_address_44a3617b7722f733d75d8c15.reference || (__cxx_static_address_44a3617b7722f733d75d8c15.reference = {
    __cReference: true,
    get value() { return RPGSPRITE____header_global_1d5ab44381582d8a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:202
export const FREEZESPRITE____header_global_b10b50a9f84afb78 = ((((((24) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_503181cc8a05af22a12d62cc() {
  return __cxx_static_address_503181cc8a05af22a12d62cc.reference || (__cxx_static_address_503181cc8a05af22a12d62cc.reference = {
    __cReference: true,
    get value() { return FREEZESPRITE____header_global_b10b50a9f84afb78; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:203
export const SHRINKERSPRITE____header_global_a5ed94604bb648f5 = ((((((25) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c428d9f63af713351ed6cb84() {
  return __cxx_static_address_c428d9f63af713351ed6cb84.reference || (__cxx_static_address_c428d9f63af713351ed6cb84.reference = {
    __cReference: true,
    get value() { return SHRINKERSPRITE____header_global_a5ed94604bb648f5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:204
export const HEAVYHBOMB____header_global_9c99da0a4d20e88b = ((((((26) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7cafc8b1be746b9a80fe42ac() {
  return __cxx_static_address_7cafc8b1be746b9a80fe42ac.reference || (__cxx_static_address_7cafc8b1be746b9a80fe42ac.reference = {
    __cReference: true,
    get value() { return HEAVYHBOMB____header_global_9c99da0a4d20e88b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:205
export const TRIPBOMBSPRITE____header_global_03be51b3ce0dd0ae = ((((((27) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_df35d57685ce3803674701e2() {
  return __cxx_static_address_df35d57685ce3803674701e2.reference || (__cxx_static_address_df35d57685ce3803674701e2.reference = {
    __cReference: true,
    get value() { return TRIPBOMBSPRITE____header_global_03be51b3ce0dd0ae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:206
export const SHOTGUNSPRITE____header_global_aedebd6536ea32d9 = ((((((28) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1db2bf4a1f09f9fff84080a5() {
  return __cxx_static_address_1db2bf4a1f09f9fff84080a5.reference || (__cxx_static_address_1db2bf4a1f09f9fff84080a5.reference = {
    __cReference: true,
    get value() { return SHOTGUNSPRITE____header_global_aedebd6536ea32d9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:207
export const DEVISTATORSPRITE____header_global_7dc6b60dfd73ddde = ((((((29) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0e508d430e2c1df5974e4bac() {
  return __cxx_static_address_0e508d430e2c1df5974e4bac.reference || (__cxx_static_address_0e508d430e2c1df5974e4bac.reference = {
    __cReference: true,
    get value() { return DEVISTATORSPRITE____header_global_7dc6b60dfd73ddde; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:208
export const HEALTHBOX____header_global_57e96c6c24bc1645 = ((((((30) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f651fef03f009c48010072c7() {
  return __cxx_static_address_f651fef03f009c48010072c7.reference || (__cxx_static_address_f651fef03f009c48010072c7.reference = {
    __cReference: true,
    get value() { return HEALTHBOX____header_global_57e96c6c24bc1645; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:209
export const AMMOBOX____header_global_51cd65a851862bee = ((((((31) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dd7cd22795abfe42ae4e3a04() {
  return __cxx_static_address_dd7cd22795abfe42ae4e3a04.reference || (__cxx_static_address_dd7cd22795abfe42ae4e3a04.reference = {
    __cReference: true,
    get value() { return AMMOBOX____header_global_51cd65a851862bee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:210
export const GROWSPRITEICON____header_global_011e75df0a80d644 = ((((((32) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_073cd853be4e6ee4fc0e3cb1() {
  return __cxx_static_address_073cd853be4e6ee4fc0e3cb1.reference || (__cxx_static_address_073cd853be4e6ee4fc0e3cb1.reference = {
    __cReference: true,
    get value() { return GROWSPRITEICON____header_global_011e75df0a80d644; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:211
export const INVENTORYBOX____header_global_50d245a8021571fd = ((((((33) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_20f8f3bab74fca8200f1b5b1() {
  return __cxx_static_address_20f8f3bab74fca8200f1b5b1.reference || (__cxx_static_address_20f8f3bab74fca8200f1b5b1.reference = {
    __cReference: true,
    get value() { return INVENTORYBOX____header_global_50d245a8021571fd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:212
export const FREEZEAMMO____header_global_9c956265cabfb859 = ((((((37) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_565b0f19e24d8b9a4b3e92a5() {
  return __cxx_static_address_565b0f19e24d8b9a4b3e92a5.reference || (__cxx_static_address_565b0f19e24d8b9a4b3e92a5.reference = {
    __cReference: true,
    get value() { return FREEZEAMMO____header_global_9c956265cabfb859; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:213
export const AMMO____header_global_3ba41447d5bcfee1 = ((((((40) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4edc4e71243fe92973ef10d9() {
  return __cxx_static_address_4edc4e71243fe92973ef10d9.reference || (__cxx_static_address_4edc4e71243fe92973ef10d9.reference = {
    __cReference: true,
    get value() { return AMMO____header_global_3ba41447d5bcfee1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:214
export const BATTERYAMMO____header_global_bb66599a048c4d87 = ((((((41) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e4fa7ad6780a969f0b4afe48() {
  return __cxx_static_address_e4fa7ad6780a969f0b4afe48.reference || (__cxx_static_address_e4fa7ad6780a969f0b4afe48.reference = {
    __cReference: true,
    get value() { return BATTERYAMMO____header_global_bb66599a048c4d87; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:215
export const DEVISTATORAMMO____header_global_c7e8212c1b6005ac = ((((((42) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e714c2c2eb8481a60fa33da5() {
  return __cxx_static_address_e714c2c2eb8481a60fa33da5.reference || (__cxx_static_address_e714c2c2eb8481a60fa33da5.reference = {
    __cReference: true,
    get value() { return DEVISTATORAMMO____header_global_c7e8212c1b6005ac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:216
export const RPGAMMO____header_global_0f5eb4de4889d81d = ((((((44) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_54a8e8df614a27f1ed3de6da() {
  return __cxx_static_address_54a8e8df614a27f1ed3de6da.reference || (__cxx_static_address_54a8e8df614a27f1ed3de6da.reference = {
    __cReference: true,
    get value() { return RPGAMMO____header_global_0f5eb4de4889d81d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:217
export const GROWAMMO____header_global_b270d1985b309aaa = ((((((45) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d90fe06acee3b89aab2914d8() {
  return __cxx_static_address_d90fe06acee3b89aab2914d8.reference || (__cxx_static_address_d90fe06acee3b89aab2914d8.reference = {
    __cReference: true,
    get value() { return GROWAMMO____header_global_b270d1985b309aaa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:218
export const CRYSTALAMMO____header_global_6cd8dfbccf2640ba = ((((((46) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b82b972188a1bccf3a01530e() {
  return __cxx_static_address_b82b972188a1bccf3a01530e.reference || (__cxx_static_address_b82b972188a1bccf3a01530e.reference = {
    __cReference: true,
    get value() { return CRYSTALAMMO____header_global_6cd8dfbccf2640ba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:219
export const HBOMBAMMO____header_global_258aa8afd0a090e8 = ((((((47) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_48360a851a204a017295f3c2() {
  return __cxx_static_address_48360a851a204a017295f3c2.reference || (__cxx_static_address_48360a851a204a017295f3c2.reference = {
    __cReference: true,
    get value() { return HBOMBAMMO____header_global_258aa8afd0a090e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:220
export const AMMOLOTS____header_global_aaecfa1f139d69ed = ((((((48) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_362129bceb277fd7e60d1b75() {
  return __cxx_static_address_362129bceb277fd7e60d1b75.reference || (__cxx_static_address_362129bceb277fd7e60d1b75.reference = {
    __cReference: true,
    get value() { return AMMOLOTS____header_global_aaecfa1f139d69ed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:221
export const SHOTGUNAMMO____header_global_c2117ce0974f5389 = ((((((49) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3caa0b2cedd4775aa9418e1e() {
  return __cxx_static_address_3caa0b2cedd4775aa9418e1e.reference || (__cxx_static_address_3caa0b2cedd4775aa9418e1e.reference = {
    __cReference: true,
    get value() { return SHOTGUNAMMO____header_global_c2117ce0974f5389; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:222
export const COLA____header_global_c2e63096d1ee80bb = ((((((51) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_98dc1f0a03b69ea25459798b() {
  return __cxx_static_address_98dc1f0a03b69ea25459798b.reference || (__cxx_static_address_98dc1f0a03b69ea25459798b.reference = {
    __cReference: true,
    get value() { return COLA____header_global_c2e63096d1ee80bb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:223
export const SIXPAK____header_global_209df0286e29f95a = ((((((52) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2d21dcf161cf2a6ea530b371() {
  return __cxx_static_address_2d21dcf161cf2a6ea530b371.reference || (__cxx_static_address_2d21dcf161cf2a6ea530b371.reference = {
    __cReference: true,
    get value() { return SIXPAK____header_global_209df0286e29f95a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:224
export const FIRSTAID____header_global_b4711cc259c38998 = ((((((53) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5382624aaee7f670cacae9aa() {
  return __cxx_static_address_5382624aaee7f670cacae9aa.reference || (__cxx_static_address_5382624aaee7f670cacae9aa.reference = {
    __cReference: true,
    get value() { return FIRSTAID____header_global_b4711cc259c38998; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:225
export const SHIELD____header_global_2ff105282284a285 = ((((((54) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ed6c438261b05681a31c5683() {
  return __cxx_static_address_ed6c438261b05681a31c5683.reference || (__cxx_static_address_ed6c438261b05681a31c5683.reference = {
    __cReference: true,
    get value() { return SHIELD____header_global_2ff105282284a285; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:226
export const STEROIDS____header_global_685cd1fb73c5e611 = ((((((55) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5b8c47b54a31d9add0302f24() {
  return __cxx_static_address_5b8c47b54a31d9add0302f24.reference || (__cxx_static_address_5b8c47b54a31d9add0302f24.reference = {
    __cReference: true,
    get value() { return STEROIDS____header_global_685cd1fb73c5e611; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:227
export const AIRTANK____header_global_4998a413a316f2d3 = ((((((56) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ce9d4049475c5d3c136baeb2() {
  return __cxx_static_address_ce9d4049475c5d3c136baeb2.reference || (__cxx_static_address_ce9d4049475c5d3c136baeb2.reference = {
    __cReference: true,
    get value() { return AIRTANK____header_global_4998a413a316f2d3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:228
export const JETPACK____header_global_cb639f92e2d51edf = ((((((57) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_84898769db3204fd285892a1() {
  return __cxx_static_address_84898769db3204fd285892a1.reference || (__cxx_static_address_84898769db3204fd285892a1.reference = {
    __cReference: true,
    get value() { return JETPACK____header_global_cb639f92e2d51edf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:229
export const HEATSENSOR____header_global_018a2ae896d1251a = ((((((59) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c20063cf30a6a46826481ef6() {
  return __cxx_static_address_c20063cf30a6a46826481ef6.reference || (__cxx_static_address_c20063cf30a6a46826481ef6.reference = {
    __cReference: true,
    get value() { return HEATSENSOR____header_global_018a2ae896d1251a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:230
export const ACCESSCARD____header_global_3917e8f7d7e5fc4d = ((((((60) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0d5d53166d2435618db0c84d() {
  return __cxx_static_address_0d5d53166d2435618db0c84d.reference || (__cxx_static_address_0d5d53166d2435618db0c84d.reference = {
    __cReference: true,
    get value() { return ACCESSCARD____header_global_3917e8f7d7e5fc4d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:231
export const BOOTS____header_global_422af00c6dc5c94a = ((((((61) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_06c075647474c7d3e6736b05() {
  return __cxx_static_address_06c075647474c7d3e6736b05.reference || (__cxx_static_address_06c075647474c7d3e6736b05.reference = {
    __cReference: true,
    get value() { return BOOTS____header_global_422af00c6dc5c94a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:232
export const MIRRORBROKE____header_global_2284071d59be14b6 = ((((((70) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7819a5756c6b6d854adeb6eb() {
  return __cxx_static_address_7819a5756c6b6d854adeb6eb.reference || (__cxx_static_address_7819a5756c6b6d854adeb6eb.reference = {
    __cReference: true,
    get value() { return MIRRORBROKE____header_global_2284071d59be14b6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:233
export const CLOUDYOCEAN____header_global_37ebc5c3b9d63c57 = ((((((78) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9c02675882d494b2f86d2b95() {
  return __cxx_static_address_9c02675882d494b2f86d2b95.reference || (__cxx_static_address_9c02675882d494b2f86d2b95.reference = {
    __cReference: true,
    get value() { return CLOUDYOCEAN____header_global_37ebc5c3b9d63c57; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:234
export const CLOUDYSKIES____header_global_c8b599fa1472491d = ((((((79) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ad35ce1c0ecdeeaabb1723c5() {
  return __cxx_static_address_ad35ce1c0ecdeeaabb1723c5.reference || (__cxx_static_address_ad35ce1c0ecdeeaabb1723c5.reference = {
    __cReference: true,
    get value() { return CLOUDYSKIES____header_global_c8b599fa1472491d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:235
export const MOONSKY1____header_global_e22a3628edeffffc = ((((((80) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9491f75b97fb87133f902d16() {
  return __cxx_static_address_9491f75b97fb87133f902d16.reference || (__cxx_static_address_9491f75b97fb87133f902d16.reference = {
    __cReference: true,
    get value() { return MOONSKY1____header_global_e22a3628edeffffc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:236
export const BIGORBIT1____header_global_b1397c363966fdcf = ((((((84) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d1fe18ce33749cda9f01ed64() {
  return __cxx_static_address_d1fe18ce33749cda9f01ed64.reference || (__cxx_static_address_d1fe18ce33749cda9f01ed64.reference = {
    __cReference: true,
    get value() { return BIGORBIT1____header_global_b1397c363966fdcf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:237
export const LA____header_global_bbd187fbe975f03f = ((((((89) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4369da21fbb8b38d5b925343() {
  return __cxx_static_address_4369da21fbb8b38d5b925343.reference || (__cxx_static_address_4369da21fbb8b38d5b925343.reference = {
    __cReference: true,
    get value() { return LA____header_global_bbd187fbe975f03f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:238
export const ATOMICHEALTH____header_global_f557203d5eb93396 = ((((((100) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cdae0ae88615222733c33cb5() {
  return __cxx_static_address_cdae0ae88615222733c33cb5.reference || (__cxx_static_address_cdae0ae88615222733c33cb5.reference = {
    __cReference: true,
    get value() { return ATOMICHEALTH____header_global_f557203d5eb93396; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:239
export const TECHLIGHT2____header_global_7c9df694083080e8 = ((((((120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9cf23c33dfd1b3ff9fa49764() {
  return __cxx_static_address_9cf23c33dfd1b3ff9fa49764.reference || (__cxx_static_address_9cf23c33dfd1b3ff9fa49764.reference = {
    __cReference: true,
    get value() { return TECHLIGHT2____header_global_7c9df694083080e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:240
export const TECHLIGHTBUST2____header_global_c9836d787ce05118 = ((((((121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d03a44d5943a05e8ec1837c7() {
  return __cxx_static_address_d03a44d5943a05e8ec1837c7.reference || (__cxx_static_address_d03a44d5943a05e8ec1837c7.reference = {
    __cReference: true,
    get value() { return TECHLIGHTBUST2____header_global_c9836d787ce05118; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:241
export const TECHLIGHT4____header_global_18186d4515e8e794 = ((((((122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5d332799d8823261b6b769ae() {
  return __cxx_static_address_5d332799d8823261b6b769ae.reference || (__cxx_static_address_5d332799d8823261b6b769ae.reference = {
    __cReference: true,
    get value() { return TECHLIGHT4____header_global_18186d4515e8e794; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:242
export const TECHLIGHTBUST4____header_global_ec9243b31beac3d1 = ((((((123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_29a0457fde84eae8e0cf1b59() {
  return __cxx_static_address_29a0457fde84eae8e0cf1b59.reference || (__cxx_static_address_29a0457fde84eae8e0cf1b59.reference = {
    __cReference: true,
    get value() { return TECHLIGHTBUST4____header_global_ec9243b31beac3d1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:243
export const WALLLIGHT4____header_global_6d122f778e1fd219 = ((((((124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f3e403b9bea27e0baebbc183() {
  return __cxx_static_address_f3e403b9bea27e0baebbc183.reference || (__cxx_static_address_f3e403b9bea27e0baebbc183.reference = {
    __cReference: true,
    get value() { return WALLLIGHT4____header_global_6d122f778e1fd219; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:244
export const WALLLIGHTBUST4____header_global_a016be1b3b3a4216 = ((((((125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3ac91809c6ec17f7c5225d2a() {
  return __cxx_static_address_3ac91809c6ec17f7c5225d2a.reference || (__cxx_static_address_3ac91809c6ec17f7c5225d2a.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST4____header_global_a016be1b3b3a4216; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:245
export const ACCESSSWITCH____header_global_aea86cd71e961c80 = ((((((130) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_27b0d0f9100b8104eb422ee9() {
  return __cxx_static_address_27b0d0f9100b8104eb422ee9.reference || (__cxx_static_address_27b0d0f9100b8104eb422ee9.reference = {
    __cReference: true,
    get value() { return ACCESSSWITCH____header_global_aea86cd71e961c80; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:246
export const SLOTDOOR____header_global_f995442c58bdfa2f = ((((((132) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0f82f2e3b8441e7dd26a6359() {
  return __cxx_static_address_0f82f2e3b8441e7dd26a6359.reference || (__cxx_static_address_0f82f2e3b8441e7dd26a6359.reference = {
    __cReference: true,
    get value() { return SLOTDOOR____header_global_f995442c58bdfa2f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:247
export const LIGHTSWITCH____header_global_3214ae5c5ed24c3b = ((((((134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_16c58aa0ecfa66ef76ca98df() {
  return __cxx_static_address_16c58aa0ecfa66ef76ca98df.reference || (__cxx_static_address_16c58aa0ecfa66ef76ca98df.reference = {
    __cReference: true,
    get value() { return LIGHTSWITCH____header_global_3214ae5c5ed24c3b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:248
export const SPACEDOORSWITCH____header_global_660963f395a5cde4 = ((((((136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ffc73b9bcbbd4e79fc4c2efe() {
  return __cxx_static_address_ffc73b9bcbbd4e79fc4c2efe.reference || (__cxx_static_address_ffc73b9bcbbd4e79fc4c2efe.reference = {
    __cReference: true,
    get value() { return SPACEDOORSWITCH____header_global_660963f395a5cde4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:249
export const SPACELIGHTSWITCH____header_global_70d5ba7c8e67dba8 = ((((((138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ce56cd4737dff568d0b69da0() {
  return __cxx_static_address_ce56cd4737dff568d0b69da0.reference || (__cxx_static_address_ce56cd4737dff568d0b69da0.reference = {
    __cReference: true,
    get value() { return SPACELIGHTSWITCH____header_global_70d5ba7c8e67dba8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:250
export const FRANKENSTINESWITCH____header_global_cedd982922934e4a = ((((((140) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6930652faec0f99b8e7e7fbc() {
  return __cxx_static_address_6930652faec0f99b8e7e7fbc.reference || (__cxx_static_address_6930652faec0f99b8e7e7fbc.reference = {
    __cReference: true,
    get value() { return FRANKENSTINESWITCH____header_global_cedd982922934e4a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:251
export const NUKEBUTTON____header_global_9cdb9b35175278e0 = ((((((142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bf474e9f0af41302ac9f1a5d() {
  return __cxx_static_address_bf474e9f0af41302ac9f1a5d.reference || (__cxx_static_address_bf474e9f0af41302ac9f1a5d.reference = {
    __cReference: true,
    get value() { return NUKEBUTTON____header_global_9cdb9b35175278e0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:252
export const MULTISWITCH____header_global_e2ced4e3f9a0337e = ((((((146) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5c67c1ebfc2e865650e162bf() {
  return __cxx_static_address_5c67c1ebfc2e865650e162bf.reference || (__cxx_static_address_5c67c1ebfc2e865650e162bf.reference = {
    __cReference: true,
    get value() { return MULTISWITCH____header_global_e2ced4e3f9a0337e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:253
export const DOORTILE5____header_global_432057e5c072d846 = ((((((150) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3012f838ab73558e734ba675() {
  return __cxx_static_address_3012f838ab73558e734ba675.reference || (__cxx_static_address_3012f838ab73558e734ba675.reference = {
    __cReference: true,
    get value() { return DOORTILE5____header_global_432057e5c072d846; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:254
export const DOORTILE6____header_global_fb6b756bc42823ce = ((((((151) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_20158e4b8f241f40624bc5c2() {
  return __cxx_static_address_20158e4b8f241f40624bc5c2.reference || (__cxx_static_address_20158e4b8f241f40624bc5c2.reference = {
    __cReference: true,
    get value() { return DOORTILE6____header_global_fb6b756bc42823ce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:255
export const DOORTILE1____header_global_dd866d496d3b5610 = ((((((152) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0a59b37bdd3b8035ba8cb06f() {
  return __cxx_static_address_0a59b37bdd3b8035ba8cb06f.reference || (__cxx_static_address_0a59b37bdd3b8035ba8cb06f.reference = {
    __cReference: true,
    get value() { return DOORTILE1____header_global_dd866d496d3b5610; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:256
export const DOORTILE2____header_global_5666154eb99c2e07 = ((((((153) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_53cbdead6e2b9fb1f26e301d() {
  return __cxx_static_address_53cbdead6e2b9fb1f26e301d.reference || (__cxx_static_address_53cbdead6e2b9fb1f26e301d.reference = {
    __cReference: true,
    get value() { return DOORTILE2____header_global_5666154eb99c2e07; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:257
export const DOORTILE3____header_global_61ba5752e5aa93a3 = ((((((154) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c41d6fc92207262a7975a16d() {
  return __cxx_static_address_c41d6fc92207262a7975a16d.reference || (__cxx_static_address_c41d6fc92207262a7975a16d.reference = {
    __cReference: true,
    get value() { return DOORTILE3____header_global_61ba5752e5aa93a3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:258
export const DOORTILE4____header_global_9aa62895657f35ac = ((((((155) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c4e7cc8fbd99c93370eedcb0() {
  return __cxx_static_address_c4e7cc8fbd99c93370eedcb0.reference || (__cxx_static_address_c4e7cc8fbd99c93370eedcb0.reference = {
    __cReference: true,
    get value() { return DOORTILE4____header_global_9aa62895657f35ac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:259
export const DOORTILE7____header_global_9b254dab4dff422d = ((((((156) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_479cb3eaf1ca58e1a29d81b4() {
  return __cxx_static_address_479cb3eaf1ca58e1a29d81b4.reference || (__cxx_static_address_479cb3eaf1ca58e1a29d81b4.reference = {
    __cReference: true,
    get value() { return DOORTILE7____header_global_9b254dab4dff422d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:260
export const DOORTILE8____header_global_fe18ba35fd45bebf = ((((((157) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5b930e1a556cdfb686909b99() {
  return __cxx_static_address_5b930e1a556cdfb686909b99.reference || (__cxx_static_address_5b930e1a556cdfb686909b99.reference = {
    __cReference: true,
    get value() { return DOORTILE8____header_global_fe18ba35fd45bebf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:261
export const DOORTILE9____header_global_63eecf3e8884908b = ((((((158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d31ff1ad653fbd82ca5ec42d() {
  return __cxx_static_address_d31ff1ad653fbd82ca5ec42d.reference || (__cxx_static_address_d31ff1ad653fbd82ca5ec42d.reference = {
    __cReference: true,
    get value() { return DOORTILE9____header_global_63eecf3e8884908b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:262
export const DOORTILE10____header_global_7b077a2670e97ff2 = ((((((159) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a4d3ba0c8f5e70c813114bd5() {
  return __cxx_static_address_a4d3ba0c8f5e70c813114bd5.reference || (__cxx_static_address_a4d3ba0c8f5e70c813114bd5.reference = {
    __cReference: true,
    get value() { return DOORTILE10____header_global_7b077a2670e97ff2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:263
export const DOORSHOCK____header_global_c375bdb2ba570768 = ((((((160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ca33507214c3eb0b603e616a() {
  return __cxx_static_address_ca33507214c3eb0b603e616a.reference || (__cxx_static_address_ca33507214c3eb0b603e616a.reference = {
    __cReference: true,
    get value() { return DOORSHOCK____header_global_c375bdb2ba570768; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:264
export const DIPSWITCH____header_global_3c482b8c01b9f067 = ((((((162) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_729215c8f6313bc5378224ea() {
  return __cxx_static_address_729215c8f6313bc5378224ea.reference || (__cxx_static_address_729215c8f6313bc5378224ea.reference = {
    __cReference: true,
    get value() { return DIPSWITCH____header_global_3c482b8c01b9f067; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:265
export const DIPSWITCH2____header_global_7afdc162027bd859 = ((((((164) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2dbca129b9b24447aaeeff80() {
  return __cxx_static_address_2dbca129b9b24447aaeeff80.reference || (__cxx_static_address_2dbca129b9b24447aaeeff80.reference = {
    __cReference: true,
    get value() { return DIPSWITCH2____header_global_7afdc162027bd859; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:266
export const TECHSWITCH____header_global_21dcd3b4fe43ea42 = ((((((166) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1632dd3095ccc139bd193eab() {
  return __cxx_static_address_1632dd3095ccc139bd193eab.reference || (__cxx_static_address_1632dd3095ccc139bd193eab.reference = {
    __cReference: true,
    get value() { return TECHSWITCH____header_global_21dcd3b4fe43ea42; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:267
export const DIPSWITCH3____header_global_af4e67c5a4f25e70 = ((((((168) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a3de31d41ac518329ec48418() {
  return __cxx_static_address_a3de31d41ac518329ec48418.reference || (__cxx_static_address_a3de31d41ac518329ec48418.reference = {
    __cReference: true,
    get value() { return DIPSWITCH3____header_global_af4e67c5a4f25e70; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:268
export const ACCESSSWITCH2____header_global_6ec29e56da304cda = ((((((170) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5815532e7615c7c02c007d71() {
  return __cxx_static_address_5815532e7615c7c02c007d71.reference || (__cxx_static_address_5815532e7615c7c02c007d71.reference = {
    __cReference: true,
    get value() { return ACCESSSWITCH2____header_global_6ec29e56da304cda; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:269
export const FLOORSLIME____header_global_36fe4c6a20510d36 = ((((((200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_71e50203f1a10a4df3219d33() {
  return __cxx_static_address_71e50203f1a10a4df3219d33.reference || (__cxx_static_address_71e50203f1a10a4df3219d33.reference = {
    __cReference: true,
    get value() { return FLOORSLIME____header_global_36fe4c6a20510d36; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:270
export const BIGFORCE____header_global_4c244254590db4f0 = ((((((230) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0c3f88d37931dd56a9491a38() {
  return __cxx_static_address_0c3f88d37931dd56a9491a38.reference || (__cxx_static_address_0c3f88d37931dd56a9491a38.reference = {
    __cReference: true,
    get value() { return BIGFORCE____header_global_4c244254590db4f0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:271
export const MASKWALL9____header_global_70a8bc8a0c19f97b = ((((((255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b5b8c0494067816eb66bd907() {
  return __cxx_static_address_b5b8c0494067816eb66bd907.reference || (__cxx_static_address_b5b8c0494067816eb66bd907.reference = {
    __cReference: true,
    get value() { return MASKWALL9____header_global_70a8bc8a0c19f97b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:272
export const SCREENBREAK1____header_global_03901f1072fdda22 = ((((((263) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_82127529f1519c7d607f1b96() {
  return __cxx_static_address_82127529f1519c7d607f1b96.reference || (__cxx_static_address_82127529f1519c7d607f1b96.reference = {
    __cReference: true,
    get value() { return SCREENBREAK1____header_global_03901f1072fdda22; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:273
export const SCREENBREAK2____header_global_766c872cb8fe0520 = ((((((264) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_372e6f445d169c25f941e6d2() {
  return __cxx_static_address_372e6f445d169c25f941e6d2.reference || (__cxx_static_address_372e6f445d169c25f941e6d2.reference = {
    __cReference: true,
    get value() { return SCREENBREAK2____header_global_766c872cb8fe0520; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:274
export const SCREENBREAK3____header_global_edcd630520407143 = ((((((265) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5bbe1ff323185a88f5cbd374() {
  return __cxx_static_address_5bbe1ff323185a88f5cbd374.reference || (__cxx_static_address_5bbe1ff323185a88f5cbd374.reference = {
    __cReference: true,
    get value() { return SCREENBREAK3____header_global_edcd630520407143; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:275
export const SCREENBREAK4____header_global_826a09f3432e1b25 = ((((((266) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9a51351458dd56ff707da80b() {
  return __cxx_static_address_9a51351458dd56ff707da80b.reference || (__cxx_static_address_9a51351458dd56ff707da80b.reference = {
    __cReference: true,
    get value() { return SCREENBREAK4____header_global_826a09f3432e1b25; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:276
export const SCREENBREAK5____header_global_1e6a378d89626c52 = ((((((267) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4c4e79cd93d1c713c247d63a() {
  return __cxx_static_address_4c4e79cd93d1c713c247d63a.reference || (__cxx_static_address_4c4e79cd93d1c713c247d63a.reference = {
    __cReference: true,
    get value() { return SCREENBREAK5____header_global_1e6a378d89626c52; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:277
export const SCREENBREAK6____header_global_b94afbe2ef6910c7 = ((((((268) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aede7f07de9d838e0a232ca6() {
  return __cxx_static_address_aede7f07de9d838e0a232ca6.reference || (__cxx_static_address_aede7f07de9d838e0a232ca6.reference = {
    __cReference: true,
    get value() { return SCREENBREAK6____header_global_b94afbe2ef6910c7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:278
export const SCREENBREAK7____header_global_f44b9c80ac05d455 = ((((((269) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bcdf889f60aa51326bc94e4a() {
  return __cxx_static_address_bcdf889f60aa51326bc94e4a.reference || (__cxx_static_address_bcdf889f60aa51326bc94e4a.reference = {
    __cReference: true,
    get value() { return SCREENBREAK7____header_global_f44b9c80ac05d455; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:279
export const SCREENBREAK8____header_global_ce28ed78447e774e = ((((((270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_014799575aca99e43f12a266() {
  return __cxx_static_address_014799575aca99e43f12a266.reference || (__cxx_static_address_014799575aca99e43f12a266.reference = {
    __cReference: true,
    get value() { return SCREENBREAK8____header_global_ce28ed78447e774e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:280
export const SCREENBREAK9____header_global_85ca65f85b10ce6f = ((((((271) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_38dd31f3c8c4b38eccb00d1a() {
  return __cxx_static_address_38dd31f3c8c4b38eccb00d1a.reference || (__cxx_static_address_38dd31f3c8c4b38eccb00d1a.reference = {
    __cReference: true,
    get value() { return SCREENBREAK9____header_global_85ca65f85b10ce6f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:281
export const SCREENBREAK10____header_global_fff828cc195344b1 = ((((((272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bd76393faba24df279968841() {
  return __cxx_static_address_bd76393faba24df279968841.reference || (__cxx_static_address_bd76393faba24df279968841.reference = {
    __cReference: true,
    get value() { return SCREENBREAK10____header_global_fff828cc195344b1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:282
export const SCREENBREAK11____header_global_6ed88d3cb5b11769 = ((((((273) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_68d2e3d43f7d4c157b15d30b() {
  return __cxx_static_address_68d2e3d43f7d4c157b15d30b.reference || (__cxx_static_address_68d2e3d43f7d4c157b15d30b.reference = {
    __cReference: true,
    get value() { return SCREENBREAK11____header_global_6ed88d3cb5b11769; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:283
export const SCREENBREAK12____header_global_ad4f8249acab535a = ((((((274) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f220ba7e13d3fc30deff354a() {
  return __cxx_static_address_f220ba7e13d3fc30deff354a.reference || (__cxx_static_address_f220ba7e13d3fc30deff354a.reference = {
    __cReference: true,
    get value() { return SCREENBREAK12____header_global_ad4f8249acab535a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:284
export const SCREENBREAK13____header_global_6e66bc20987debd6 = ((((((275) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_775169502656e2d4dc4edf9c() {
  return __cxx_static_address_775169502656e2d4dc4edf9c.reference || (__cxx_static_address_775169502656e2d4dc4edf9c.reference = {
    __cReference: true,
    get value() { return SCREENBREAK13____header_global_6e66bc20987debd6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:285
export const MASKWALL1____header_global_dad60d8bcd5b06d9 = ((((((285) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b03e7c5e7bc05fc228cf426a() {
  return __cxx_static_address_b03e7c5e7bc05fc228cf426a.reference || (__cxx_static_address_b03e7c5e7bc05fc228cf426a.reference = {
    __cReference: true,
    get value() { return MASKWALL1____header_global_dad60d8bcd5b06d9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:286
export const W_TECHWALL1____header_global_b67762a8fc652ffc = ((((((293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0743b7dd33199f4282495d72() {
  return __cxx_static_address_0743b7dd33199f4282495d72.reference || (__cxx_static_address_0743b7dd33199f4282495d72.reference = {
    __cReference: true,
    get value() { return W_TECHWALL1____header_global_b67762a8fc652ffc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:287
export const W_TECHWALL2____header_global_c02b39dafb412df6 = ((((((297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6ca803339a1da9646c3d386a() {
  return __cxx_static_address_6ca803339a1da9646c3d386a.reference || (__cxx_static_address_6ca803339a1da9646c3d386a.reference = {
    __cReference: true,
    get value() { return W_TECHWALL2____header_global_c02b39dafb412df6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:288
export const W_TECHWALL15____header_global_3fbbde413f1a5a64 = ((((((299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0db609181e921b0a8ea26b30() {
  return __cxx_static_address_0db609181e921b0a8ea26b30.reference || (__cxx_static_address_0db609181e921b0a8ea26b30.reference = {
    __cReference: true,
    get value() { return W_TECHWALL15____header_global_3fbbde413f1a5a64; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:289
export const W_TECHWALL3____header_global_67987957eda5ea34 = ((((((301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d18938869601ccd405cb273e() {
  return __cxx_static_address_d18938869601ccd405cb273e.reference || (__cxx_static_address_d18938869601ccd405cb273e.reference = {
    __cReference: true,
    get value() { return W_TECHWALL3____header_global_67987957eda5ea34; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:290
export const W_TECHWALL4____header_global_0eb040415bcc2876 = ((((((305) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_23e1c3b566ee77706a1eaf96() {
  return __cxx_static_address_23e1c3b566ee77706a1eaf96.reference || (__cxx_static_address_23e1c3b566ee77706a1eaf96.reference = {
    __cReference: true,
    get value() { return W_TECHWALL4____header_global_0eb040415bcc2876; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:291
export const W_TECHWALL10____header_global_1b38199fe1a8c73f = ((((((306) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eda3b6ad6519266ab0be2f1c() {
  return __cxx_static_address_eda3b6ad6519266ab0be2f1c.reference || (__cxx_static_address_eda3b6ad6519266ab0be2f1c.reference = {
    __cReference: true,
    get value() { return W_TECHWALL10____header_global_1b38199fe1a8c73f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:292
export const W_TECHWALL16____header_global_eb934ad6adb9bd0a = ((((((307) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a3d228e8e47539f9182e8b1b() {
  return __cxx_static_address_a3d228e8e47539f9182e8b1b.reference || (__cxx_static_address_a3d228e8e47539f9182e8b1b.reference = {
    __cReference: true,
    get value() { return W_TECHWALL16____header_global_eb934ad6adb9bd0a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:293
export const WATERTILE2____header_global_083fd218bae9ed4e = ((((((336) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_52fd44325d1124d74c5cc6ca() {
  return __cxx_static_address_52fd44325d1124d74c5cc6ca.reference || (__cxx_static_address_52fd44325d1124d74c5cc6ca.reference = {
    __cReference: true,
    get value() { return WATERTILE2____header_global_083fd218bae9ed4e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:294
export const BPANNEL1____header_global_666ebed9a2b828e9 = ((((((341) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_900befcaf02b52e471ca443b() {
  return __cxx_static_address_900befcaf02b52e471ca443b.reference || (__cxx_static_address_900befcaf02b52e471ca443b.reference = {
    __cReference: true,
    get value() { return BPANNEL1____header_global_666ebed9a2b828e9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:295
export const PANNEL1____header_global_6c134132c86d7490 = ((((((342) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6511da983f366eb489870f5a() {
  return __cxx_static_address_6511da983f366eb489870f5a.reference || (__cxx_static_address_6511da983f366eb489870f5a.reference = {
    __cReference: true,
    get value() { return PANNEL1____header_global_6c134132c86d7490; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:296
export const PANNEL2____header_global_77207fdb6f83ee6a = ((((((343) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0a219f003b5aa5dee29b7059() {
  return __cxx_static_address_0a219f003b5aa5dee29b7059.reference || (__cxx_static_address_0a219f003b5aa5dee29b7059.reference = {
    __cReference: true,
    get value() { return PANNEL2____header_global_77207fdb6f83ee6a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:297
export const STATIC____header_global_0bd1e7b603b54521 = ((((((351) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a69e754974bf65fde4536c3a() {
  return __cxx_static_address_a69e754974bf65fde4536c3a.reference || (__cxx_static_address_a69e754974bf65fde4536c3a.reference = {
    __cReference: true,
    get value() { return STATIC____header_global_0bd1e7b603b54521; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:298
export const W_SCREENBREAK____header_global_b60f63c54da35c4c = ((((((357) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_622e70c5428789c3f8bfb3ae() {
  return __cxx_static_address_622e70c5428789c3f8bfb3ae.reference || (__cxx_static_address_622e70c5428789c3f8bfb3ae.reference = {
    __cReference: true,
    get value() { return W_SCREENBREAK____header_global_b60f63c54da35c4c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:299
export const W_HITTECHWALL3____header_global_1f67b8f6147abb46 = ((((((360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_268e0a4796adad8697418fcd() {
  return __cxx_static_address_268e0a4796adad8697418fcd.reference || (__cxx_static_address_268e0a4796adad8697418fcd.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL3____header_global_1f67b8f6147abb46; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:300
export const W_HITTECHWALL4____header_global_c2ee2bcddc1ab031 = ((((((361) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2ab24ef45af1b416b128c1c9() {
  return __cxx_static_address_2ab24ef45af1b416b128c1c9.reference || (__cxx_static_address_2ab24ef45af1b416b128c1c9.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL4____header_global_c2ee2bcddc1ab031; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:301
export const W_HITTECHWALL2____header_global_57fea5bcb342da67 = ((((((362) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8df7bd31df25d4ee6da69855() {
  return __cxx_static_address_8df7bd31df25d4ee6da69855.reference || (__cxx_static_address_8df7bd31df25d4ee6da69855.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL2____header_global_57fea5bcb342da67; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:302
export const W_HITTECHWALL1____header_global_c59a0f6728ba4cdd = ((((((363) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3cb68e436e43e1df361458fb() {
  return __cxx_static_address_3cb68e436e43e1df361458fb.reference || (__cxx_static_address_3cb68e436e43e1df361458fb.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL1____header_global_c59a0f6728ba4cdd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:303
export const MASKWALL10____header_global_81935676f64cb4d0 = ((((((387) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3a3dcab430682fde072b625b() {
  return __cxx_static_address_3a3dcab430682fde072b625b.reference || (__cxx_static_address_3a3dcab430682fde072b625b.reference = {
    __cReference: true,
    get value() { return MASKWALL10____header_global_81935676f64cb4d0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:304
export const MASKWALL11____header_global_88659db9ff65a2aa = ((((((391) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_62df3179fd7887251b26bc82() {
  return __cxx_static_address_62df3179fd7887251b26bc82.reference || (__cxx_static_address_62df3179fd7887251b26bc82.reference = {
    __cReference: true,
    get value() { return MASKWALL11____header_global_88659db9ff65a2aa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:305
export const DOORTILE22____header_global_e03525af7b96f4cb = ((((((395) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2cdb57d1774e6256e06e7a88() {
  return __cxx_static_address_2cdb57d1774e6256e06e7a88.reference || (__cxx_static_address_2cdb57d1774e6256e06e7a88.reference = {
    __cReference: true,
    get value() { return DOORTILE22____header_global_e03525af7b96f4cb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:306
export const FANSPRITE____header_global_bc78c9fcd5dbd24a = ((((((407) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a60656ae2a14c1a7f863df12() {
  return __cxx_static_address_a60656ae2a14c1a7f863df12.reference || (__cxx_static_address_a60656ae2a14c1a7f863df12.reference = {
    __cReference: true,
    get value() { return FANSPRITE____header_global_bc78c9fcd5dbd24a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:307
export const FANSPRITEBROKE____header_global_fd37a1718ce8a9ce = ((((((411) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_baf94b27d604340569811944() {
  return __cxx_static_address_baf94b27d604340569811944.reference || (__cxx_static_address_baf94b27d604340569811944.reference = {
    __cReference: true,
    get value() { return FANSPRITEBROKE____header_global_fd37a1718ce8a9ce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:308
export const FANSHADOW____header_global_02a65b6936e23956 = ((((((412) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_abd85c7b45e7858aacf5ab22() {
  return __cxx_static_address_abd85c7b45e7858aacf5ab22.reference || (__cxx_static_address_abd85c7b45e7858aacf5ab22.reference = {
    __cReference: true,
    get value() { return FANSHADOW____header_global_02a65b6936e23956; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:309
export const FANSHADOWBROKE____header_global_58fb4a0c4d968e73 = ((((((416) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_20894cba1382e01d3f063778() {
  return __cxx_static_address_20894cba1382e01d3f063778.reference || (__cxx_static_address_20894cba1382e01d3f063778.reference = {
    __cReference: true,
    get value() { return FANSHADOWBROKE____header_global_58fb4a0c4d968e73; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:310
export const DOORTILE18____header_global_fb9ae802b1dec291 = ((((((447) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_13f9fb90915f1ac01c437b8c() {
  return __cxx_static_address_13f9fb90915f1ac01c437b8c.reference || (__cxx_static_address_13f9fb90915f1ac01c437b8c.reference = {
    __cReference: true,
    get value() { return DOORTILE18____header_global_fb9ae802b1dec291; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:311
export const DOORTILE19____header_global_8ec4d8d9b1c9c1f9 = ((((((448) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2d12078f83688238cacd881c() {
  return __cxx_static_address_2d12078f83688238cacd881c.reference || (__cxx_static_address_2d12078f83688238cacd881c.reference = {
    __cReference: true,
    get value() { return DOORTILE19____header_global_8ec4d8d9b1c9c1f9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:312
export const DOORTILE20____header_global_63c668f5132a51d7 = ((((((449) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3c8756f40332008dedee0f01() {
  return __cxx_static_address_3c8756f40332008dedee0f01.reference || (__cxx_static_address_3c8756f40332008dedee0f01.reference = {
    __cReference: true,
    get value() { return DOORTILE20____header_global_63c668f5132a51d7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:313
export const VIEWSCREEN2____header_global_7acedc74764519ae = ((((((499) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9b8e9fcf6d1dbb03f241516d() {
  return __cxx_static_address_9b8e9fcf6d1dbb03f241516d.reference || (__cxx_static_address_9b8e9fcf6d1dbb03f241516d.reference = {
    __cReference: true,
    get value() { return VIEWSCREEN2____header_global_7acedc74764519ae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:314
export const VIEWSCREEN____header_global_066f58e32ea5ed97 = ((((((502) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_de898dfae4f78d6a3b3e44cb() {
  return __cxx_static_address_de898dfae4f78d6a3b3e44cb.reference || (__cxx_static_address_de898dfae4f78d6a3b3e44cb.reference = {
    __cReference: true,
    get value() { return VIEWSCREEN____header_global_066f58e32ea5ed97; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:315
export const GLASS____header_global_5727d8b12f712dc4 = ((((((503) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4dfc030b2714a724b2a7b732() {
  return __cxx_static_address_4dfc030b2714a724b2a7b732.reference || (__cxx_static_address_4dfc030b2714a724b2a7b732.reference = {
    __cReference: true,
    get value() { return GLASS____header_global_5727d8b12f712dc4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:316
export const GLASS2____header_global_69d83b4972007f8c = ((((((504) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_33cf49da9398b64159fb741d() {
  return __cxx_static_address_33cf49da9398b64159fb741d.reference || (__cxx_static_address_33cf49da9398b64159fb741d.reference = {
    __cReference: true,
    get value() { return GLASS2____header_global_69d83b4972007f8c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:317
export const STAINGLASS1____header_global_4382f5151b5807b9 = ((((((510) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3e9b9272733a04f435c35d98() {
  return __cxx_static_address_3e9b9272733a04f435c35d98.reference || (__cxx_static_address_3e9b9272733a04f435c35d98.reference = {
    __cReference: true,
    get value() { return STAINGLASS1____header_global_4382f5151b5807b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:318
export const MASKWALL5____header_global_806c13bff34d6a8d = ((((((514) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5913f4607f78ffb44f491be6() {
  return __cxx_static_address_5913f4607f78ffb44f491be6.reference || (__cxx_static_address_5913f4607f78ffb44f491be6.reference = {
    __cReference: true,
    get value() { return MASKWALL5____header_global_806c13bff34d6a8d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:319
export const SATELITE____header_global_88d8573d097a10a7 = ((((((516) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3f93ff0e93d1c077ddc2e797() {
  return __cxx_static_address_3f93ff0e93d1c077ddc2e797.reference || (__cxx_static_address_3f93ff0e93d1c077ddc2e797.reference = {
    __cReference: true,
    get value() { return SATELITE____header_global_88d8573d097a10a7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:320
export const FUELPOD____header_global_edbef6ff87e99ff8 = ((((((517) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e26d459d098f29acf0503d58() {
  return __cxx_static_address_e26d459d098f29acf0503d58.reference || (__cxx_static_address_e26d459d098f29acf0503d58.reference = {
    __cReference: true,
    get value() { return FUELPOD____header_global_edbef6ff87e99ff8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:321
export const CRACK1____header_global_42f9d21563177018 = ((((((546) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8971669febed67d7d751f271() {
  return __cxx_static_address_8971669febed67d7d751f271.reference || (__cxx_static_address_8971669febed67d7d751f271.reference = {
    __cReference: true,
    get value() { return CRACK1____header_global_42f9d21563177018; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:322
export const CRACK2____header_global_2d674cbdfb26eb66 = ((((((547) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_013e6d124ac5435c075385db() {
  return __cxx_static_address_013e6d124ac5435c075385db.reference || (__cxx_static_address_013e6d124ac5435c075385db.reference = {
    __cReference: true,
    get value() { return CRACK2____header_global_2d674cbdfb26eb66; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:323
export const CRACK3____header_global_1317fc4b72ef3e3c = ((((((548) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ec9e6ffbc46eb9cffd4f8f18() {
  return __cxx_static_address_ec9e6ffbc46eb9cffd4f8f18.reference || (__cxx_static_address_ec9e6ffbc46eb9cffd4f8f18.reference = {
    __cReference: true,
    get value() { return CRACK3____header_global_1317fc4b72ef3e3c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:324
export const CRACK4____header_global_113754e40312765b = ((((((549) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3d8f3f3d89883d2410413cae() {
  return __cxx_static_address_3d8f3f3d89883d2410413cae.reference || (__cxx_static_address_3d8f3f3d89883d2410413cae.reference = {
    __cReference: true,
    get value() { return CRACK4____header_global_113754e40312765b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:325
export const FOOTPRINTS____header_global_6b2d0ca8ca4d1b9f = ((((((550) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_362ec047f8e0df99e7425b88() {
  return __cxx_static_address_362ec047f8e0df99e7425b88.reference || (__cxx_static_address_362ec047f8e0df99e7425b88.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS____header_global_6b2d0ca8ca4d1b9f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:326
export const DOMELITE____header_global_4523246e94c3417d = ((((((551) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_71ae1c9106361cba7d1455a0() {
  return __cxx_static_address_71ae1c9106361cba7d1455a0.reference || (__cxx_static_address_71ae1c9106361cba7d1455a0.reference = {
    __cReference: true,
    get value() { return DOMELITE____header_global_4523246e94c3417d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:327
export const CAMERAPOLE____header_global_edb73f6aab35e884 = ((((((554) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_09faa006281a97a81d6b7f3a() {
  return __cxx_static_address_09faa006281a97a81d6b7f3a.reference || (__cxx_static_address_09faa006281a97a81d6b7f3a.reference = {
    __cReference: true,
    get value() { return CAMERAPOLE____header_global_edb73f6aab35e884; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:328
export const CHAIR1____header_global_d4de507c35534955 = ((((((556) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_df6652c67171561bfb324514() {
  return __cxx_static_address_df6652c67171561bfb324514.reference || (__cxx_static_address_df6652c67171561bfb324514.reference = {
    __cReference: true,
    get value() { return CHAIR1____header_global_d4de507c35534955; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:329
export const CHAIR2____header_global_35c12f2195d3585a = ((((((557) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8a29f6c1600000d90ffdd9fb() {
  return __cxx_static_address_8a29f6c1600000d90ffdd9fb.reference || (__cxx_static_address_8a29f6c1600000d90ffdd9fb.reference = {
    __cReference: true,
    get value() { return CHAIR2____header_global_35c12f2195d3585a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:330
export const BROKENCHAIR____header_global_812703c3cb42792d = ((((((559) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_600fd5ef6099c97893609247() {
  return __cxx_static_address_600fd5ef6099c97893609247.reference || (__cxx_static_address_600fd5ef6099c97893609247.reference = {
    __cReference: true,
    get value() { return BROKENCHAIR____header_global_812703c3cb42792d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:331
export const MIRROR____header_global_2f5b7bf557b66ab8 = ((((((560) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_61550b950a8e4a89eca57dcc() {
  return __cxx_static_address_61550b950a8e4a89eca57dcc.reference || (__cxx_static_address_61550b950a8e4a89eca57dcc.reference = {
    __cReference: true,
    get value() { return MIRROR____header_global_2f5b7bf557b66ab8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:332
export const WATERFOUNTAIN____header_global_41ce5fab6968cf8e = ((((((563) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_390a549b27fa9354fa209090() {
  return __cxx_static_address_390a549b27fa9354fa209090.reference || (__cxx_static_address_390a549b27fa9354fa209090.reference = {
    __cReference: true,
    get value() { return WATERFOUNTAIN____header_global_41ce5fab6968cf8e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:333
export const WATERFOUNTAINBROKE____header_global_5bffc4af7ad41eab = ((((((567) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bbc035904ae69528ed2676fa() {
  return __cxx_static_address_bbc035904ae69528ed2676fa.reference || (__cxx_static_address_bbc035904ae69528ed2676fa.reference = {
    __cReference: true,
    get value() { return WATERFOUNTAINBROKE____header_global_5bffc4af7ad41eab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:334
export const FEMMAG1____header_global_1cc53f4ca1cc4730 = ((((((568) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_df5ccc59b4017846fd4428f4() {
  return __cxx_static_address_df5ccc59b4017846fd4428f4.reference || (__cxx_static_address_df5ccc59b4017846fd4428f4.reference = {
    __cReference: true,
    get value() { return FEMMAG1____header_global_1cc53f4ca1cc4730; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:335
export const TOILET____header_global_fed514c57d7e031b = ((((((569) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_da0256b940757ebb7c96c1ac() {
  return __cxx_static_address_da0256b940757ebb7c96c1ac.reference || (__cxx_static_address_da0256b940757ebb7c96c1ac.reference = {
    __cReference: true,
    get value() { return TOILET____header_global_fed514c57d7e031b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:336
export const STALL____header_global_4c33cb3071223b0e = ((((((571) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3c9aacd76c8c53c19aed40f6() {
  return __cxx_static_address_3c9aacd76c8c53c19aed40f6.reference || (__cxx_static_address_3c9aacd76c8c53c19aed40f6.reference = {
    __cReference: true,
    get value() { return STALL____header_global_4c33cb3071223b0e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:337
export const STALLBROKE____header_global_7b338b3d68f5624f = ((((((573) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2168daec43ecde1e76c96644() {
  return __cxx_static_address_2168daec43ecde1e76c96644.reference || (__cxx_static_address_2168daec43ecde1e76c96644.reference = {
    __cReference: true,
    get value() { return STALLBROKE____header_global_7b338b3d68f5624f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:338
export const FEMMAG2____header_global_a60df8d9d308f915 = ((((((577) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2533f1a7ae42b7996786eab1() {
  return __cxx_static_address_2533f1a7ae42b7996786eab1.reference || (__cxx_static_address_2533f1a7ae42b7996786eab1.reference = {
    __cReference: true,
    get value() { return FEMMAG2____header_global_a60df8d9d308f915; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:339
export const REACTOR2____header_global_5e7bdbb2fa28386e = ((((((578) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8214207d9cdd1e9730ebae74() {
  return __cxx_static_address_8214207d9cdd1e9730ebae74.reference || (__cxx_static_address_8214207d9cdd1e9730ebae74.reference = {
    __cReference: true,
    get value() { return REACTOR2____header_global_5e7bdbb2fa28386e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:340
export const REACTOR2BURNT____header_global_8515e1e6c30fdd1f = ((((((579) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_48eefdbf8b90c501fbeee4c1() {
  return __cxx_static_address_48eefdbf8b90c501fbeee4c1.reference || (__cxx_static_address_48eefdbf8b90c501fbeee4c1.reference = {
    __cReference: true,
    get value() { return REACTOR2BURNT____header_global_8515e1e6c30fdd1f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:341
export const REACTOR2SPARK____header_global_9d067613268b9658 = ((((((580) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ca246bfd7e27982ba1d648de() {
  return __cxx_static_address_ca246bfd7e27982ba1d648de.reference || (__cxx_static_address_ca246bfd7e27982ba1d648de.reference = {
    __cReference: true,
    get value() { return REACTOR2SPARK____header_global_9d067613268b9658; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:342
export const GRATE1____header_global_9d3b56711cc1d666 = ((((((595) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_53ff8a9a062c78334dc06a9c() {
  return __cxx_static_address_53ff8a9a062c78334dc06a9c.reference || (__cxx_static_address_53ff8a9a062c78334dc06a9c.reference = {
    __cReference: true,
    get value() { return GRATE1____header_global_9d3b56711cc1d666; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:343
export const BGRATE1____header_global_68644c7f7f09267b = ((((((596) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_88c00ccf586050c23d76b1a2() {
  return __cxx_static_address_88c00ccf586050c23d76b1a2.reference || (__cxx_static_address_88c00ccf586050c23d76b1a2.reference = {
    __cReference: true,
    get value() { return BGRATE1____header_global_68644c7f7f09267b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:344
export const SOLARPANNEL____header_global_f01d433086e54195 = ((((((602) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_93b75e38b8a137500722690b() {
  return __cxx_static_address_93b75e38b8a137500722690b.reference || (__cxx_static_address_93b75e38b8a137500722690b.reference = {
    __cReference: true,
    get value() { return SOLARPANNEL____header_global_f01d433086e54195; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:345
export const NAKED1____header_global_9e5eefb86f8c8181 = ((((((603) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7de3e490ec7ba40e643c346a() {
  return __cxx_static_address_7de3e490ec7ba40e643c346a.reference || (__cxx_static_address_7de3e490ec7ba40e643c346a.reference = {
    __cReference: true,
    get value() { return NAKED1____header_global_9e5eefb86f8c8181; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:346
export const ANTENNA____header_global_070e508160add585 = ((((((607) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7628a3ff763a01b343d4c8c5() {
  return __cxx_static_address_7628a3ff763a01b343d4c8c5.reference || (__cxx_static_address_7628a3ff763a01b343d4c8c5.reference = {
    __cReference: true,
    get value() { return ANTENNA____header_global_070e508160add585; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:347
export const MASKWALL12____header_global_f4fd3dbacf5a9713 = ((((((609) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9cb4898cc9cfb9c76f71698f() {
  return __cxx_static_address_9cb4898cc9cfb9c76f71698f.reference || (__cxx_static_address_9cb4898cc9cfb9c76f71698f.reference = {
    __cReference: true,
    get value() { return MASKWALL12____header_global_f4fd3dbacf5a9713; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:348
export const TOILETBROKE____header_global_6eb20e6f65e0c9b5 = ((((((615) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_abce8b8a2a104b594f32fecf() {
  return __cxx_static_address_abce8b8a2a104b594f32fecf.reference || (__cxx_static_address_abce8b8a2a104b594f32fecf.reference = {
    __cReference: true,
    get value() { return TOILETBROKE____header_global_6eb20e6f65e0c9b5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:349
export const PIPE2____header_global_1671b2c608014128 = ((((((616) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_de582e12efc56dd4d209c146() {
  return __cxx_static_address_de582e12efc56dd4d209c146.reference || (__cxx_static_address_de582e12efc56dd4d209c146.reference = {
    __cReference: true,
    get value() { return PIPE2____header_global_1671b2c608014128; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:350
export const PIPE1B____header_global_3d57b60f17b4f096 = ((((((617) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_632b833e832b5b34a580308c() {
  return __cxx_static_address_632b833e832b5b34a580308c.reference || (__cxx_static_address_632b833e832b5b34a580308c.reference = {
    __cReference: true,
    get value() { return PIPE1B____header_global_3d57b60f17b4f096; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:351
export const PIPE3____header_global_7bc8acec5adeec60 = ((((((618) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_953651031fd6d44ae0dc0405() {
  return __cxx_static_address_953651031fd6d44ae0dc0405.reference || (__cxx_static_address_953651031fd6d44ae0dc0405.reference = {
    __cReference: true,
    get value() { return PIPE3____header_global_7bc8acec5adeec60; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:352
export const PIPE1____header_global_b43f1fc18e423c94 = ((((((619) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2ba7d5260107cf6d5b1651f0() {
  return __cxx_static_address_2ba7d5260107cf6d5b1651f0.reference || (__cxx_static_address_2ba7d5260107cf6d5b1651f0.reference = {
    __cReference: true,
    get value() { return PIPE1____header_global_b43f1fc18e423c94; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:353
export const CAMERA1____header_global_108917aa0d0d8edc = ((((((621) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1ba3bf369e7b858cdb44c7e1() {
  return __cxx_static_address_1ba3bf369e7b858cdb44c7e1.reference || (__cxx_static_address_1ba3bf369e7b858cdb44c7e1.reference = {
    __cReference: true,
    get value() { return CAMERA1____header_global_108917aa0d0d8edc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:354
export const PIPE2B____header_global_c2564982fa4e2b66 = ((((((633) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c6de81fbbeeb3465d9b71984() {
  return __cxx_static_address_c6de81fbbeeb3465d9b71984.reference || (__cxx_static_address_c6de81fbbeeb3465d9b71984.reference = {
    __cReference: true,
    get value() { return PIPE2B____header_global_c2564982fa4e2b66; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:355
export const BOLT1____header_global_96b21ec4cf7b06db = ((((((634) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a22c7169f4d88dd6ef04fa08() {
  return __cxx_static_address_a22c7169f4d88dd6ef04fa08.reference || (__cxx_static_address_a22c7169f4d88dd6ef04fa08.reference = {
    __cReference: true,
    get value() { return BOLT1____header_global_96b21ec4cf7b06db; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:356
export const W_NUMBERS____header_global_82d06e7827f21ccb = ((((((640) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bfdb79ab5e7189ba5d9684be() {
  return __cxx_static_address_bfdb79ab5e7189ba5d9684be.reference || (__cxx_static_address_bfdb79ab5e7189ba5d9684be.reference = {
    __cReference: true,
    get value() { return W_NUMBERS____header_global_82d06e7827f21ccb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:357
export const WATERDRIP____header_global_d81975ecead60381 = ((((((660) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bd794d88f13914ee99b3e923() {
  return __cxx_static_address_bd794d88f13914ee99b3e923.reference || (__cxx_static_address_bd794d88f13914ee99b3e923.reference = {
    __cReference: true,
    get value() { return WATERDRIP____header_global_d81975ecead60381; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:358
export const WATERBUBBLE____header_global_c71564815067c61d = ((((((661) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a140b57ba97a145613e2646b() {
  return __cxx_static_address_a140b57ba97a145613e2646b.reference || (__cxx_static_address_a140b57ba97a145613e2646b.reference = {
    __cReference: true,
    get value() { return WATERBUBBLE____header_global_c71564815067c61d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:359
export const WATERBUBBLEMAKER____header_global_ab475b5506200140 = ((((((662) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_35b29d33bf25600b6d0c838b() {
  return __cxx_static_address_35b29d33bf25600b6d0c838b.reference || (__cxx_static_address_35b29d33bf25600b6d0c838b.reference = {
    __cReference: true,
    get value() { return WATERBUBBLEMAKER____header_global_ab475b5506200140; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:360
export const W_FORCEFIELD____header_global_07852b0b4e78237e = ((((((663) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c5a1e4a3d10142f5dc387b20() {
  return __cxx_static_address_c5a1e4a3d10142f5dc387b20.reference || (__cxx_static_address_c5a1e4a3d10142f5dc387b20.reference = {
    __cReference: true,
    get value() { return W_FORCEFIELD____header_global_07852b0b4e78237e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:361
export const VACUUM____header_global_721198f41b77eafc = ((((((669) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1a9d9ca208e0977bcaca3645() {
  return __cxx_static_address_1a9d9ca208e0977bcaca3645.reference || (__cxx_static_address_1a9d9ca208e0977bcaca3645.reference = {
    __cReference: true,
    get value() { return VACUUM____header_global_721198f41b77eafc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:362
export const FOOTPRINTS2____header_global_75e4249d12af63c0 = ((((((672) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3a6246619f3c01b3a9f6a79b() {
  return __cxx_static_address_3a6246619f3c01b3a9f6a79b.reference || (__cxx_static_address_3a6246619f3c01b3a9f6a79b.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS2____header_global_75e4249d12af63c0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:363
export const FOOTPRINTS3____header_global_8732f1a76bcb9aab = ((((((673) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cf7808df4fef4b9f96408fe4() {
  return __cxx_static_address_cf7808df4fef4b9f96408fe4.reference || (__cxx_static_address_cf7808df4fef4b9f96408fe4.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS3____header_global_8732f1a76bcb9aab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:364
export const FOOTPRINTS4____header_global_85190e2d2a00d1ec = ((((((674) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b7f2861dca5afed77128a571() {
  return __cxx_static_address_b7f2861dca5afed77128a571.reference || (__cxx_static_address_b7f2861dca5afed77128a571.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS4____header_global_85190e2d2a00d1ec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:365
export const EGG____header_global_5090ccc652780fe7 = ((((((675) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b9252e62908ec3f1a13d6c87() {
  return __cxx_static_address_b9252e62908ec3f1a13d6c87.reference || (__cxx_static_address_b9252e62908ec3f1a13d6c87.reference = {
    __cReference: true,
    get value() { return EGG____header_global_5090ccc652780fe7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:366
export const SCALE____header_global_b54e7f20d7bf9a1b = ((((((678) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1ba90f0e15b87c206596297c() {
  return __cxx_static_address_1ba90f0e15b87c206596297c.reference || (__cxx_static_address_1ba90f0e15b87c206596297c.reference = {
    __cReference: true,
    get value() { return SCALE____header_global_b54e7f20d7bf9a1b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:367
export const CHAIR3____header_global_9e4a7877a983bf37 = ((((((680) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b72fa29a47a70f213562aa72() {
  return __cxx_static_address_b72fa29a47a70f213562aa72.reference || (__cxx_static_address_b72fa29a47a70f213562aa72.reference = {
    __cReference: true,
    get value() { return CHAIR3____header_global_9e4a7877a983bf37; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:368
export const CAMERALIGHT____header_global_f531449ee22fdf2f = ((((((685) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_32bff2267949d59d233433b7() {
  return __cxx_static_address_32bff2267949d59d233433b7.reference || (__cxx_static_address_32bff2267949d59d233433b7.reference = {
    __cReference: true,
    get value() { return CAMERALIGHT____header_global_f531449ee22fdf2f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:369
export const MOVIECAMERA____header_global_aca827835a7f3f81 = ((((((686) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9c9988844c01c5bcb01a4a8b() {
  return __cxx_static_address_9c9988844c01c5bcb01a4a8b.reference || (__cxx_static_address_9c9988844c01c5bcb01a4a8b.reference = {
    __cReference: true,
    get value() { return MOVIECAMERA____header_global_aca827835a7f3f81; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:370
export const IVUNIT____header_global_5b87f7de88fccff9 = ((((((689) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_73877cae74806b071798d937() {
  return __cxx_static_address_73877cae74806b071798d937.reference || (__cxx_static_address_73877cae74806b071798d937.reference = {
    __cReference: true,
    get value() { return IVUNIT____header_global_5b87f7de88fccff9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:371
export const POT1____header_global_7613e068fe470e7e = ((((((694) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1902841d4def4b2bbc102299() {
  return __cxx_static_address_1902841d4def4b2bbc102299.reference || (__cxx_static_address_1902841d4def4b2bbc102299.reference = {
    __cReference: true,
    get value() { return POT1____header_global_7613e068fe470e7e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:372
export const POT2____header_global_141e5ffbfcbe138b = ((((((695) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6713fe15e3f76374f3502e88() {
  return __cxx_static_address_6713fe15e3f76374f3502e88.reference || (__cxx_static_address_6713fe15e3f76374f3502e88.reference = {
    __cReference: true,
    get value() { return POT2____header_global_141e5ffbfcbe138b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:373
export const POT3____header_global_96296d735a29891e = ((((((697) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ab1300e804a5c322dfcdc422() {
  return __cxx_static_address_ab1300e804a5c322dfcdc422.reference || (__cxx_static_address_ab1300e804a5c322dfcdc422.reference = {
    __cReference: true,
    get value() { return POT3____header_global_96296d735a29891e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:374
export const PIPE3B____header_global_4f765f1f56415a3a = ((((((700) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_64adb7b050ba6938a3ac54a1() {
  return __cxx_static_address_64adb7b050ba6938a3ac54a1.reference || (__cxx_static_address_64adb7b050ba6938a3ac54a1.reference = {
    __cReference: true,
    get value() { return PIPE3B____header_global_4f765f1f56415a3a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:375
export const WALLLIGHT3____header_global_538ccace8c3e21ce = ((((((701) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_55bd64aa1bc4edccca9fc1e3() {
  return __cxx_static_address_55bd64aa1bc4edccca9fc1e3.reference || (__cxx_static_address_55bd64aa1bc4edccca9fc1e3.reference = {
    __cReference: true,
    get value() { return WALLLIGHT3____header_global_538ccace8c3e21ce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:376
export const WALLLIGHTBUST3____header_global_11a0a7375b3427a4 = ((((((702) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5db019971b903d0afc0535a4() {
  return __cxx_static_address_5db019971b903d0afc0535a4.reference || (__cxx_static_address_5db019971b903d0afc0535a4.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST3____header_global_11a0a7375b3427a4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:377
export const WALLLIGHT1____header_global_2ad0026a245305f0 = ((((((703) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d7e20998bc4195cf78b8e06c() {
  return __cxx_static_address_d7e20998bc4195cf78b8e06c.reference || (__cxx_static_address_d7e20998bc4195cf78b8e06c.reference = {
    __cReference: true,
    get value() { return WALLLIGHT1____header_global_2ad0026a245305f0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:378
export const WALLLIGHTBUST1____header_global_f51b7b662fbda26b = ((((((704) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_caa5476bb5276f5dd4069e6d() {
  return __cxx_static_address_caa5476bb5276f5dd4069e6d.reference || (__cxx_static_address_caa5476bb5276f5dd4069e6d.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST1____header_global_f51b7b662fbda26b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:379
export const WALLLIGHT2____header_global_cacf0705ee618032 = ((((((705) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_147d5ec33cc29fcfc1d4c9d3() {
  return __cxx_static_address_147d5ec33cc29fcfc1d4c9d3.reference || (__cxx_static_address_147d5ec33cc29fcfc1d4c9d3.reference = {
    __cReference: true,
    get value() { return WALLLIGHT2____header_global_cacf0705ee618032; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:380
export const WALLLIGHTBUST2____header_global_a33d8b9686504d31 = ((((((706) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2ce3304bb6a381fd1f177a8b() {
  return __cxx_static_address_2ce3304bb6a381fd1f177a8b.reference || (__cxx_static_address_2ce3304bb6a381fd1f177a8b.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST2____header_global_a33d8b9686504d31; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:381
export const LIGHTSWITCH2____header_global_62c4d0670791a707 = ((((((712) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c92ebac29bc7c517119919c0() {
  return __cxx_static_address_c92ebac29bc7c517119919c0.reference || (__cxx_static_address_c92ebac29bc7c517119919c0.reference = {
    __cReference: true,
    get value() { return LIGHTSWITCH2____header_global_62c4d0670791a707; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:382
export const WAITTOBESEATED____header_global_04a594896487c6fd = ((((((716) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_706742faf070d400ab61feaf() {
  return __cxx_static_address_706742faf070d400ab61feaf.reference || (__cxx_static_address_706742faf070d400ab61feaf.reference = {
    __cReference: true,
    get value() { return WAITTOBESEATED____header_global_04a594896487c6fd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:383
export const DOORTILE14____header_global_2dfb32c05784e071 = ((((((717) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a57de52729843f78ab9264fc() {
  return __cxx_static_address_a57de52729843f78ab9264fc.reference || (__cxx_static_address_a57de52729843f78ab9264fc.reference = {
    __cReference: true,
    get value() { return DOORTILE14____header_global_2dfb32c05784e071; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:384
export const STATUE____header_global_a3086da483be2616 = ((((((753) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e4bd4060ef0dbff0cb6cb772() {
  return __cxx_static_address_e4bd4060ef0dbff0cb6cb772.reference || (__cxx_static_address_e4bd4060ef0dbff0cb6cb772.reference = {
    __cReference: true,
    get value() { return STATUE____header_global_a3086da483be2616; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:385
export const MIKE____header_global_7968fd2a74105187 = ((((((762) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4e13b4fd3d08af280ebe72c5() {
  return __cxx_static_address_4e13b4fd3d08af280ebe72c5.reference || (__cxx_static_address_4e13b4fd3d08af280ebe72c5.reference = {
    __cReference: true,
    get value() { return MIKE____header_global_7968fd2a74105187; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:386
export const VASE____header_global_f6ae4686f3730f66 = ((((((765) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cf598ba950a447e48bfdb08e() {
  return __cxx_static_address_cf598ba950a447e48bfdb08e.reference || (__cxx_static_address_cf598ba950a447e48bfdb08e.reference = {
    __cReference: true,
    get value() { return VASE____header_global_f6ae4686f3730f66; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:387
export const SUSHIPLATE1____header_global_de328013cbb09a23 = ((((((768) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_10d7a8179dd3264e73d1856e() {
  return __cxx_static_address_10d7a8179dd3264e73d1856e.reference || (__cxx_static_address_10d7a8179dd3264e73d1856e.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE1____header_global_de328013cbb09a23; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:388
export const SUSHIPLATE2____header_global_b59b8e1254f8df7b = ((((((769) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_db92b531ad5a2f50398f9336() {
  return __cxx_static_address_db92b531ad5a2f50398f9336.reference || (__cxx_static_address_db92b531ad5a2f50398f9336.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE2____header_global_b59b8e1254f8df7b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:389
export const SUSHIPLATE3____header_global_e9791d290fe94176 = ((((((774) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_163d85485be662623207b6c9() {
  return __cxx_static_address_163d85485be662623207b6c9.reference || (__cxx_static_address_163d85485be662623207b6c9.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE3____header_global_e9791d290fe94176; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:390
export const SUSHIPLATE4____header_global_4831a02ce742fc41 = ((((((779) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f6d8ee13b606186ba0a43060() {
  return __cxx_static_address_f6d8ee13b606186ba0a43060.reference || (__cxx_static_address_f6d8ee13b606186ba0a43060.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE4____header_global_4831a02ce742fc41; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:391
export const DOORTILE16____header_global_fae1fbb242860ccc = ((((((781) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_53c838a68734746fd08275a0() {
  return __cxx_static_address_53c838a68734746fd08275a0.reference || (__cxx_static_address_53c838a68734746fd08275a0.reference = {
    __cReference: true,
    get value() { return DOORTILE16____header_global_fae1fbb242860ccc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:392
export const SUSHIPLATE5____header_global_1c03f13f84e18d9f = ((((((792) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bc54f6ff3e076e6e3d2437ff() {
  return __cxx_static_address_bc54f6ff3e076e6e3d2437ff.reference || (__cxx_static_address_bc54f6ff3e076e6e3d2437ff.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE5____header_global_1c03f13f84e18d9f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:393
export const OJ____header_global_82aa52a0037124fa = ((((((806) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ba6621c5dcdfac507ea81727() {
  return __cxx_static_address_ba6621c5dcdfac507ea81727.reference || (__cxx_static_address_ba6621c5dcdfac507ea81727.reference = {
    __cReference: true,
    get value() { return OJ____header_global_82aa52a0037124fa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:394
export const MASKWALL13____header_global_40bb8cb351e62e62 = ((((((830) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_99dda15dedd53547d48a7757() {
  return __cxx_static_address_99dda15dedd53547d48a7757.reference || (__cxx_static_address_99dda15dedd53547d48a7757.reference = {
    __cReference: true,
    get value() { return MASKWALL13____header_global_40bb8cb351e62e62; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:395
export const HURTRAIL____header_global_eed22f8aebb01656 = ((((((859) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fe054cc0ac7941b7000694b9() {
  return __cxx_static_address_fe054cc0ac7941b7000694b9.reference || (__cxx_static_address_fe054cc0ac7941b7000694b9.reference = {
    __cReference: true,
    get value() { return HURTRAIL____header_global_eed22f8aebb01656; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:396
export const POWERSWITCH1____header_global_ebddbec26c8cfb2e = ((((((860) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f2637c39bfbda12ca0f02281() {
  return __cxx_static_address_f2637c39bfbda12ca0f02281.reference || (__cxx_static_address_f2637c39bfbda12ca0f02281.reference = {
    __cReference: true,
    get value() { return POWERSWITCH1____header_global_ebddbec26c8cfb2e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:397
export const LOCKSWITCH1____header_global_e4886ab008ebad7b = ((((((862) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_40a8c75d00242d50c4816bae() {
  return __cxx_static_address_40a8c75d00242d50c4816bae.reference || (__cxx_static_address_40a8c75d00242d50c4816bae.reference = {
    __cReference: true,
    get value() { return LOCKSWITCH1____header_global_e4886ab008ebad7b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:398
export const POWERSWITCH2____header_global_7dc4197387cb4453 = ((((((864) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0976d4ae6f742e972619d05e() {
  return __cxx_static_address_0976d4ae6f742e972619d05e.reference || (__cxx_static_address_0976d4ae6f742e972619d05e.reference = {
    __cReference: true,
    get value() { return POWERSWITCH2____header_global_7dc4197387cb4453; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:399
export const ATM____header_global_660315e31cac6e83 = ((((((867) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ada6d809ec182b85f47bc06a() {
  return __cxx_static_address_ada6d809ec182b85f47bc06a.reference || (__cxx_static_address_ada6d809ec182b85f47bc06a.reference = {
    __cReference: true,
    get value() { return ATM____header_global_660315e31cac6e83; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:400
export const STATUEFLASH____header_global_f1af5976dee4f9f9 = ((((((869) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a1ac900cc0b45f643bfbe9d6() {
  return __cxx_static_address_a1ac900cc0b45f643bfbe9d6.reference || (__cxx_static_address_a1ac900cc0b45f643bfbe9d6.reference = {
    __cReference: true,
    get value() { return STATUEFLASH____header_global_f1af5976dee4f9f9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:401
export const ATMBROKE____header_global_761ed99b499a6e4a = ((((((888) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e750d60ab8e2d947b2572e49() {
  return __cxx_static_address_e750d60ab8e2d947b2572e49.reference || (__cxx_static_address_e750d60ab8e2d947b2572e49.reference = {
    __cReference: true,
    get value() { return ATMBROKE____header_global_761ed99b499a6e4a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:402
export const STRIPEBALL____header_global_47f613a8f7fca1a3 = ((((((901) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d56190bb3920ad36e7bb3cfd() {
  return __cxx_static_address_d56190bb3920ad36e7bb3cfd.reference || (__cxx_static_address_d56190bb3920ad36e7bb3cfd.reference = {
    __cReference: true,
    get value() { return STRIPEBALL____header_global_47f613a8f7fca1a3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:403
export const QUEBALL____header_global_1a2630682581ec6f = ((((((902) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_441e886c637bbbf0b45478dc() {
  return __cxx_static_address_441e886c637bbbf0b45478dc.reference || (__cxx_static_address_441e886c637bbbf0b45478dc.reference = {
    __cReference: true,
    get value() { return QUEBALL____header_global_1a2630682581ec6f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:404
export const POCKET____header_global_a1dbd8657094d878 = ((((((903) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c1b98c970dc8227425ff5ffd() {
  return __cxx_static_address_c1b98c970dc8227425ff5ffd.reference || (__cxx_static_address_c1b98c970dc8227425ff5ffd.reference = {
    __cReference: true,
    get value() { return POCKET____header_global_a1dbd8657094d878; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:405
export const WOODENHORSE____header_global_d71ea515da1c240e = ((((((904) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_09e68712d84aefbd59710318() {
  return __cxx_static_address_09e68712d84aefbd59710318.reference || (__cxx_static_address_09e68712d84aefbd59710318.reference = {
    __cReference: true,
    get value() { return WOODENHORSE____header_global_d71ea515da1c240e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:406
export const TREE1____header_global_6ce76d131cf02bb2 = ((((((908) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_efb58b258e1b7fc46f00387f() {
  return __cxx_static_address_efb58b258e1b7fc46f00387f.reference || (__cxx_static_address_efb58b258e1b7fc46f00387f.reference = {
    __cReference: true,
    get value() { return TREE1____header_global_6ce76d131cf02bb2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:407
export const TREE2____header_global_f42a7cf38360c4da = ((((((910) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b74cbbd8bb212d6d54923e77() {
  return __cxx_static_address_b74cbbd8bb212d6d54923e77.reference || (__cxx_static_address_b74cbbd8bb212d6d54923e77.reference = {
    __cReference: true,
    get value() { return TREE2____header_global_f42a7cf38360c4da; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:408
export const CACTUS____header_global_560234325156ea23 = ((((((911) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6094cd62b042dba4c19cc341() {
  return __cxx_static_address_6094cd62b042dba4c19cc341.reference || (__cxx_static_address_6094cd62b042dba4c19cc341.reference = {
    __cReference: true,
    get value() { return CACTUS____header_global_560234325156ea23; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:409
export const MASKWALL2____header_global_07c37390707eea13 = ((((((913) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d55df2fcd661350a615ff6c5() {
  return __cxx_static_address_d55df2fcd661350a615ff6c5.reference || (__cxx_static_address_d55df2fcd661350a615ff6c5.reference = {
    __cReference: true,
    get value() { return MASKWALL2____header_global_07c37390707eea13; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:410
export const MASKWALL3____header_global_42b28fbdc640211c = ((((((914) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b8b03dff93d7d8f98559a60e() {
  return __cxx_static_address_b8b03dff93d7d8f98559a60e.reference || (__cxx_static_address_b8b03dff93d7d8f98559a60e.reference = {
    __cReference: true,
    get value() { return MASKWALL3____header_global_42b28fbdc640211c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:411
export const MASKWALL4____header_global_f2288b479cf39c88 = ((((((915) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_25c0994647f882f39ee48689() {
  return __cxx_static_address_25c0994647f882f39ee48689.reference || (__cxx_static_address_25c0994647f882f39ee48689.reference = {
    __cReference: true,
    get value() { return MASKWALL4____header_global_f2288b479cf39c88; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:412
export const FIREEXT____header_global_c0de46334ab823d8 = ((((((916) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_48f4d014a7c9571501c81b73() {
  return __cxx_static_address_48f4d014a7c9571501c81b73.reference || (__cxx_static_address_48f4d014a7c9571501c81b73.reference = {
    __cReference: true,
    get value() { return FIREEXT____header_global_c0de46334ab823d8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:413
export const TOILETWATER____header_global_f9445b4870b011ed = ((((((921) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d0dfb42ff1196c0fcdff1286() {
  return __cxx_static_address_d0dfb42ff1196c0fcdff1286.reference || (__cxx_static_address_d0dfb42ff1196c0fcdff1286.reference = {
    __cReference: true,
    get value() { return TOILETWATER____header_global_f9445b4870b011ed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:414
export const NEON1____header_global_a3fbcc5b4caaa9ad = ((((((925) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_54b97b2714ba7de054eb9475() {
  return __cxx_static_address_54b97b2714ba7de054eb9475.reference || (__cxx_static_address_54b97b2714ba7de054eb9475.reference = {
    __cReference: true,
    get value() { return NEON1____header_global_a3fbcc5b4caaa9ad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:415
export const NEON2____header_global_a2e551e82db421e8 = ((((((926) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_78df32f56f110371d4cf9788() {
  return __cxx_static_address_78df32f56f110371d4cf9788.reference || (__cxx_static_address_78df32f56f110371d4cf9788.reference = {
    __cReference: true,
    get value() { return NEON2____header_global_a2e551e82db421e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:416
export const CACTUSBROKE____header_global_99eb3251d9ffc4c9 = ((((((939) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2a96c0be23c3fd86a9e51e13() {
  return __cxx_static_address_2a96c0be23c3fd86a9e51e13.reference || (__cxx_static_address_2a96c0be23c3fd86a9e51e13.reference = {
    __cReference: true,
    get value() { return CACTUSBROKE____header_global_99eb3251d9ffc4c9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:417
export const BOUNCEMINE____header_global_6a4701422fcee242 = ((((((940) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3978d0c1125722669e98485d() {
  return __cxx_static_address_3978d0c1125722669e98485d.reference || (__cxx_static_address_3978d0c1125722669e98485d.reference = {
    __cReference: true,
    get value() { return BOUNCEMINE____header_global_6a4701422fcee242; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:418
export const BROKEFIREHYDRENT____header_global_121cd87c4fc56a85 = ((((((950) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_048e662df2094d9f393c81ad() {
  return __cxx_static_address_048e662df2094d9f393c81ad.reference || (__cxx_static_address_048e662df2094d9f393c81ad.reference = {
    __cReference: true,
    get value() { return BROKEFIREHYDRENT____header_global_121cd87c4fc56a85; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:419
export const BOX____header_global_7579350829f3fee7 = ((((((951) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3a4607cea56afc569b3acd2c() {
  return __cxx_static_address_3a4607cea56afc569b3acd2c.reference || (__cxx_static_address_3a4607cea56afc569b3acd2c.reference = {
    __cReference: true,
    get value() { return BOX____header_global_7579350829f3fee7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:420
export const BULLETHOLE____header_global_ee1a79fefa4698fb = ((((((952) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aec87e78ffb6e05fdb33b198() {
  return __cxx_static_address_aec87e78ffb6e05fdb33b198.reference || (__cxx_static_address_aec87e78ffb6e05fdb33b198.reference = {
    __cReference: true,
    get value() { return BULLETHOLE____header_global_ee1a79fefa4698fb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:421
export const BOTTLE1____header_global_ea1a7373fca7cbc0 = ((((((954) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_347f2567f3f0696fd85501a6() {
  return __cxx_static_address_347f2567f3f0696fd85501a6.reference || (__cxx_static_address_347f2567f3f0696fd85501a6.reference = {
    __cReference: true,
    get value() { return BOTTLE1____header_global_ea1a7373fca7cbc0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:422
export const BOTTLE2____header_global_dd12a442e744e66f = ((((((955) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cd338d5576ff45427af7fdd2() {
  return __cxx_static_address_cd338d5576ff45427af7fdd2.reference || (__cxx_static_address_cd338d5576ff45427af7fdd2.reference = {
    __cReference: true,
    get value() { return BOTTLE2____header_global_dd12a442e744e66f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:423
export const BOTTLE3____header_global_bc0ba918b83eec54 = ((((((956) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4b0693a521757636a84f5bcf() {
  return __cxx_static_address_4b0693a521757636a84f5bcf.reference || (__cxx_static_address_4b0693a521757636a84f5bcf.reference = {
    __cReference: true,
    get value() { return BOTTLE3____header_global_bc0ba918b83eec54; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:424
export const BOTTLE4____header_global_8a3daf064d361f02 = ((((((957) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_495683e87af03bed484418ee() {
  return __cxx_static_address_495683e87af03bed484418ee.reference || (__cxx_static_address_495683e87af03bed484418ee.reference = {
    __cReference: true,
    get value() { return BOTTLE4____header_global_8a3daf064d361f02; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:425
export const FEMPIC5____header_global_7d2db160667b2c94 = ((((((963) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d49feadc2a63237c7252e5fa() {
  return __cxx_static_address_d49feadc2a63237c7252e5fa.reference || (__cxx_static_address_d49feadc2a63237c7252e5fa.reference = {
    __cReference: true,
    get value() { return FEMPIC5____header_global_7d2db160667b2c94; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:426
export const FEMPIC6____header_global_02493e7915d1ac7f = ((((((964) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e7a0c0369da4b7c0ef733653() {
  return __cxx_static_address_e7a0c0369da4b7c0ef733653.reference || (__cxx_static_address_e7a0c0369da4b7c0ef733653.reference = {
    __cReference: true,
    get value() { return FEMPIC6____header_global_02493e7915d1ac7f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:427
export const FEMPIC7____header_global_4fcb85b12228156a = ((((((965) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eb01935d76279a49f1a3a263() {
  return __cxx_static_address_eb01935d76279a49f1a3a263.reference || (__cxx_static_address_eb01935d76279a49f1a3a263.reference = {
    __cReference: true,
    get value() { return FEMPIC7____header_global_4fcb85b12228156a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:428
export const HYDROPLANT____header_global_9d81f471b50fa6e5 = ((((((969) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_643cdfde8366ff21d922f3b0() {
  return __cxx_static_address_643cdfde8366ff21d922f3b0.reference || (__cxx_static_address_643cdfde8366ff21d922f3b0.reference = {
    __cReference: true,
    get value() { return HYDROPLANT____header_global_9d81f471b50fa6e5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:429
export const OCEANSPRITE1____header_global_8a56d707a7ddad5a = ((((((971) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_312b387cd945fcc2ceb79592() {
  return __cxx_static_address_312b387cd945fcc2ceb79592.reference || (__cxx_static_address_312b387cd945fcc2ceb79592.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE1____header_global_8a56d707a7ddad5a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:430
export const OCEANSPRITE2____header_global_8853a4b82ad73421 = ((((((972) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9a8cb316ed0b9300cae87f50() {
  return __cxx_static_address_9a8cb316ed0b9300cae87f50.reference || (__cxx_static_address_9a8cb316ed0b9300cae87f50.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE2____header_global_8853a4b82ad73421; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:431
export const OCEANSPRITE3____header_global_2e601abe5d0cf62e = ((((((973) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_569d6f2c24c5c9e6fae59a43() {
  return __cxx_static_address_569d6f2c24c5c9e6fae59a43.reference || (__cxx_static_address_569d6f2c24c5c9e6fae59a43.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE3____header_global_2e601abe5d0cf62e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:432
export const OCEANSPRITE4____header_global_819a0c97a190730d = ((((((974) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aecfd78e8606196e84e62279() {
  return __cxx_static_address_aecfd78e8606196e84e62279.reference || (__cxx_static_address_aecfd78e8606196e84e62279.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE4____header_global_819a0c97a190730d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:433
export const OCEANSPRITE5____header_global_894d301d61fc6b16 = ((((((975) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_346130f33a245682dc2a682d() {
  return __cxx_static_address_346130f33a245682dc2a682d.reference || (__cxx_static_address_346130f33a245682dc2a682d.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE5____header_global_894d301d61fc6b16; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:434
export const GENERICPOLE____header_global_c7d141ba377b76e4 = ((((((977) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6651524709bd3d0e622e8d61() {
  return __cxx_static_address_6651524709bd3d0e622e8d61.reference || (__cxx_static_address_6651524709bd3d0e622e8d61.reference = {
    __cReference: true,
    get value() { return GENERICPOLE____header_global_c7d141ba377b76e4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:435
export const CONE____header_global_8f348563ebff7e3d = ((((((978) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a1ab8ef82d5dfa30112e96ef() {
  return __cxx_static_address_a1ab8ef82d5dfa30112e96ef.reference || (__cxx_static_address_a1ab8ef82d5dfa30112e96ef.reference = {
    __cReference: true,
    get value() { return CONE____header_global_8f348563ebff7e3d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:436
export const HANGLIGHT____header_global_6752d9324401e806 = ((((((979) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_92516bf08a2de752777eea21() {
  return __cxx_static_address_92516bf08a2de752777eea21.reference || (__cxx_static_address_92516bf08a2de752777eea21.reference = {
    __cReference: true,
    get value() { return HANGLIGHT____header_global_6752d9324401e806; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:437
export const HYDRENT____header_global_0f30e5c22d3e5514 = ((((((981) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bb3e1d7c1583d0bb007d78c5() {
  return __cxx_static_address_bb3e1d7c1583d0bb007d78c5.reference || (__cxx_static_address_bb3e1d7c1583d0bb007d78c5.reference = {
    __cReference: true,
    get value() { return HYDRENT____header_global_0f30e5c22d3e5514; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:438
export const MASKWALL14____header_global_61c398fa952ddb80 = ((((((988) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_074210d685cfa60c4f700abf() {
  return __cxx_static_address_074210d685cfa60c4f700abf.reference || (__cxx_static_address_074210d685cfa60c4f700abf.reference = {
    __cReference: true,
    get value() { return MASKWALL14____header_global_61c398fa952ddb80; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:439
export const TIRE____header_global_efe8915a081abae2 = ((((((990) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1c14f61817aad8b21e748510() {
  return __cxx_static_address_1c14f61817aad8b21e748510.reference || (__cxx_static_address_1c14f61817aad8b21e748510.reference = {
    __cReference: true,
    get value() { return TIRE____header_global_efe8915a081abae2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:440
export const PIPE5____header_global_c9a97e2734783212 = ((((((994) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d3380beb08dbb8c87c754f7b() {
  return __cxx_static_address_d3380beb08dbb8c87c754f7b.reference || (__cxx_static_address_d3380beb08dbb8c87c754f7b.reference = {
    __cReference: true,
    get value() { return PIPE5____header_global_c9a97e2734783212; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:441
export const PIPE6____header_global_0ba95a76c455c5bf = ((((((995) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_71bf89ef0eab86948b848b46() {
  return __cxx_static_address_71bf89ef0eab86948b848b46.reference || (__cxx_static_address_71bf89ef0eab86948b848b46.reference = {
    __cReference: true,
    get value() { return PIPE6____header_global_0ba95a76c455c5bf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:442
export const PIPE4____header_global_7f1109bef6e310d6 = ((((((996) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_890e4c2c991492e2d9513990() {
  return __cxx_static_address_890e4c2c991492e2d9513990.reference || (__cxx_static_address_890e4c2c991492e2d9513990.reference = {
    __cReference: true,
    get value() { return PIPE4____header_global_7f1109bef6e310d6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:443
export const PIPE4B____header_global_f247386436e7984d = ((((((997) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e262e12aee2c681ee811a3f0() {
  return __cxx_static_address_e262e12aee2c681ee811a3f0.reference || (__cxx_static_address_e262e12aee2c681ee811a3f0.reference = {
    __cReference: true,
    get value() { return PIPE4B____header_global_f247386436e7984d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:444
export const BROKEHYDROPLANT____header_global_00fae0017ab8949a = ((((((1003) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f32b93fb73440b8d7c27d29a() {
  return __cxx_static_address_f32b93fb73440b8d7c27d29a.reference || (__cxx_static_address_f32b93fb73440b8d7c27d29a.reference = {
    __cReference: true,
    get value() { return BROKEHYDROPLANT____header_global_00fae0017ab8949a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:445
export const PIPE5B____header_global_c1c392392403c801 = ((((((1005) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cf6608425a95124af33a25ab() {
  return __cxx_static_address_cf6608425a95124af33a25ab.reference || (__cxx_static_address_cf6608425a95124af33a25ab.reference = {
    __cReference: true,
    get value() { return PIPE5B____header_global_c1c392392403c801; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:446
export const NEON3____header_global_71b20d7a5cfa5dc6 = ((((((1007) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2f8a417454b4e8e49e3e9420() {
  return __cxx_static_address_2f8a417454b4e8e49e3e9420.reference || (__cxx_static_address_2f8a417454b4e8e49e3e9420.reference = {
    __cReference: true,
    get value() { return NEON3____header_global_71b20d7a5cfa5dc6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:447
export const NEON4____header_global_310ac52a45106037 = ((((((1008) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ec1e1d4b909d2c331e4ef55f() {
  return __cxx_static_address_ec1e1d4b909d2c331e4ef55f.reference || (__cxx_static_address_ec1e1d4b909d2c331e4ef55f.reference = {
    __cReference: true,
    get value() { return NEON4____header_global_310ac52a45106037; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:448
export const NEON5____header_global_0a5f5d8767f005e7 = ((((((1009) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6ac9a51edcda3739efc7d95b() {
  return __cxx_static_address_6ac9a51edcda3739efc7d95b.reference || (__cxx_static_address_6ac9a51edcda3739efc7d95b.reference = {
    __cReference: true,
    get value() { return NEON5____header_global_0a5f5d8767f005e7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:449
export const BOTTLE5____header_global_5bcb607e62bdf990 = ((((((1012) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1b2768d05f578ed5cb7c50f6() {
  return __cxx_static_address_1b2768d05f578ed5cb7c50f6.reference || (__cxx_static_address_1b2768d05f578ed5cb7c50f6.reference = {
    __cReference: true,
    get value() { return BOTTLE5____header_global_5bcb607e62bdf990; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:450
export const BOTTLE6____header_global_8824d20d7c9571aa = ((((((1013) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aecebbb863868c5981589bff() {
  return __cxx_static_address_aecebbb863868c5981589bff.reference || (__cxx_static_address_aecebbb863868c5981589bff.reference = {
    __cReference: true,
    get value() { return BOTTLE6____header_global_8824d20d7c9571aa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:451
export const BOTTLE8____header_global_114358c9f76d8239 = ((((((1014) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4759c7f299e1c34924efc004() {
  return __cxx_static_address_4759c7f299e1c34924efc004.reference || (__cxx_static_address_4759c7f299e1c34924efc004.reference = {
    __cReference: true,
    get value() { return BOTTLE8____header_global_114358c9f76d8239; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:452
export const SPOTLITE____header_global_1a9b9aedf70128f0 = ((((((1020) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_481e46f6b5c6f1e2776929e5() {
  return __cxx_static_address_481e46f6b5c6f1e2776929e5.reference || (__cxx_static_address_481e46f6b5c6f1e2776929e5.reference = {
    __cReference: true,
    get value() { return SPOTLITE____header_global_1a9b9aedf70128f0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:453
export const MASKWALL15____header_global_f3be8f33181a3463 = ((((((1024) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2a4a9352f5e852444a6c1801() {
  return __cxx_static_address_2a4a9352f5e852444a6c1801.reference || (__cxx_static_address_2a4a9352f5e852444a6c1801.reference = {
    __cReference: true,
    get value() { return MASKWALL15____header_global_f3be8f33181a3463; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:454
export const BOTTLE7____header_global_cdb452a98519ea89 = ((((((1025) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_80e546cc74ee19bab144f015() {
  return __cxx_static_address_80e546cc74ee19bab144f015.reference || (__cxx_static_address_80e546cc74ee19bab144f015.reference = {
    __cReference: true,
    get value() { return BOTTLE7____header_global_cdb452a98519ea89; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:455
export const HORSEONSIDE____header_global_a7772c9a960b5e69 = ((((((1026) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9a0c8129c1c1d3aab321373a() {
  return __cxx_static_address_9a0c8129c1c1d3aab321373a.reference || (__cxx_static_address_9a0c8129c1c1d3aab321373a.reference = {
    __cReference: true,
    get value() { return HORSEONSIDE____header_global_a7772c9a960b5e69; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:456
export const GLASSPIECES____header_global_19960910427bdd46 = ((((((1031) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2dc5254ac90a818602a5c697() {
  return __cxx_static_address_2dc5254ac90a818602a5c697.reference || (__cxx_static_address_2dc5254ac90a818602a5c697.reference = {
    __cReference: true,
    get value() { return GLASSPIECES____header_global_19960910427bdd46; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:457
export const NEON6____header_global_9770377dc3d516a0 = ((((((1046) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3aa1816a478270759fd5a16e() {
  return __cxx_static_address_3aa1816a478270759fd5a16e.reference || (__cxx_static_address_3aa1816a478270759fd5a16e.reference = {
    __cReference: true,
    get value() { return NEON6____header_global_9770377dc3d516a0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:458
export const MASKWALL6____header_global_a9ef15b8c003a1fa = ((((((1059) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_35911f630c1cc537bf5d5652() {
  return __cxx_static_address_35911f630c1cc537bf5d5652.reference || (__cxx_static_address_35911f630c1cc537bf5d5652.reference = {
    __cReference: true,
    get value() { return MASKWALL6____header_global_a9ef15b8c003a1fa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:459
export const RUBBERCAN____header_global_12d5ad89ad0c1b60 = ((((((1062) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3d5f21b52c4ec3dde8362474() {
  return __cxx_static_address_3d5f21b52c4ec3dde8362474.reference || (__cxx_static_address_3d5f21b52c4ec3dde8362474.reference = {
    __cReference: true,
    get value() { return RUBBERCAN____header_global_12d5ad89ad0c1b60; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:460
export const PLUG____header_global_5863bab00882169e = ((((((1069) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_290d90cf9e786c3bca97e907() {
  return __cxx_static_address_290d90cf9e786c3bca97e907.reference || (__cxx_static_address_290d90cf9e786c3bca97e907.reference = {
    __cReference: true,
    get value() { return PLUG____header_global_5863bab00882169e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:461
export const OOZFILTER____header_global_70d95582a7e123fd = ((((((1079) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2bc806a8754df0fbcbc06e6b() {
  return __cxx_static_address_2bc806a8754df0fbcbc06e6b.reference || (__cxx_static_address_2bc806a8754df0fbcbc06e6b.reference = {
    __cReference: true,
    get value() { return OOZFILTER____header_global_70d95582a7e123fd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:462
export const FLOORPLASMA____header_global_695d1a09579ccc7e = ((((((1082) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_abc6147cb7dd58c6342487df() {
  return __cxx_static_address_abc6147cb7dd58c6342487df.reference || (__cxx_static_address_abc6147cb7dd58c6342487df.reference = {
    __cReference: true,
    get value() { return FLOORPLASMA____header_global_695d1a09579ccc7e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:463
export const REACTOR____header_global_c7e1d5587f0946e5 = ((((((1088) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_71a66292b3a683a4377d22ea() {
  return __cxx_static_address_71a66292b3a683a4377d22ea.reference || (__cxx_static_address_71a66292b3a683a4377d22ea.reference = {
    __cReference: true,
    get value() { return REACTOR____header_global_c7e1d5587f0946e5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:464
export const REACTORSPARK____header_global_9cd349e7af8086b2 = ((((((1092) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_17124f60f9ceea8ee433c55c() {
  return __cxx_static_address_17124f60f9ceea8ee433c55c.reference || (__cxx_static_address_17124f60f9ceea8ee433c55c.reference = {
    __cReference: true,
    get value() { return REACTORSPARK____header_global_9cd349e7af8086b2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:465
export const REACTORBURNT____header_global_17ad340f576f9897 = ((((((1096) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f2665679c659ea7d181b1b25() {
  return __cxx_static_address_f2665679c659ea7d181b1b25.reference || (__cxx_static_address_f2665679c659ea7d181b1b25.reference = {
    __cReference: true,
    get value() { return REACTORBURNT____header_global_17ad340f576f9897; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:466
export const DOORTILE15____header_global_480c049fe3d59d13 = ((((((1102) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f58c0f837af3bfa563bb649f() {
  return __cxx_static_address_f58c0f837af3bfa563bb649f.reference || (__cxx_static_address_f58c0f837af3bfa563bb649f.reference = {
    __cReference: true,
    get value() { return DOORTILE15____header_global_480c049fe3d59d13; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:467
export const HANDSWITCH____header_global_a470b1cd921c793e = ((((((1111) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_72f415f79cdacba13cf9bcf1() {
  return __cxx_static_address_72f415f79cdacba13cf9bcf1.reference || (__cxx_static_address_72f415f79cdacba13cf9bcf1.reference = {
    __cReference: true,
    get value() { return HANDSWITCH____header_global_a470b1cd921c793e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:468
export const CIRCLEPANNEL____header_global_8e9487a7a8fcea49 = ((((((1113) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8055221b426536a8d08a97c2() {
  return __cxx_static_address_8055221b426536a8d08a97c2.reference || (__cxx_static_address_8055221b426536a8d08a97c2.reference = {
    __cReference: true,
    get value() { return CIRCLEPANNEL____header_global_8e9487a7a8fcea49; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:469
export const CIRCLEPANNELBROKE____header_global_0e45df62cc6a817d = ((((((1114) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e483153065afb26bcfd85174() {
  return __cxx_static_address_e483153065afb26bcfd85174.reference || (__cxx_static_address_e483153065afb26bcfd85174.reference = {
    __cReference: true,
    get value() { return CIRCLEPANNELBROKE____header_global_0e45df62cc6a817d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:470
export const PULLSWITCH____header_global_05fc1e8f440d451a = ((((((1122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ed730b1c4bd74364ddc1c3b3() {
  return __cxx_static_address_ed730b1c4bd74364ddc1c3b3.reference || (__cxx_static_address_ed730b1c4bd74364ddc1c3b3.reference = {
    __cReference: true,
    get value() { return PULLSWITCH____header_global_05fc1e8f440d451a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:471
export const MASKWALL8____header_global_bd9ff069752fb6e3 = ((((((1124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7b7f625f1b4c800433a4b218() {
  return __cxx_static_address_7b7f625f1b4c800433a4b218.reference || (__cxx_static_address_7b7f625f1b4c800433a4b218.reference = {
    __cReference: true,
    get value() { return MASKWALL8____header_global_bd9ff069752fb6e3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:472
export const BIGHOLE____header_global_8c0b05417bab606a = ((((((1141) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_554aef333b99733031ead981() {
  return __cxx_static_address_554aef333b99733031ead981.reference || (__cxx_static_address_554aef333b99733031ead981.reference = {
    __cReference: true,
    get value() { return BIGHOLE____header_global_8c0b05417bab606a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:473
export const ALIENSWITCH____header_global_f788816ee87ae4c3 = ((((((1142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c863e3de24a05a6dbb278ee2() {
  return __cxx_static_address_c863e3de24a05a6dbb278ee2.reference || (__cxx_static_address_c863e3de24a05a6dbb278ee2.reference = {
    __cReference: true,
    get value() { return ALIENSWITCH____header_global_f788816ee87ae4c3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:474
export const DOORTILE21____header_global_cdcab3496d69092b = ((((((1144) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e45b41a126cc4df2727ddb2a() {
  return __cxx_static_address_e45b41a126cc4df2727ddb2a.reference || (__cxx_static_address_e45b41a126cc4df2727ddb2a.reference = {
    __cReference: true,
    get value() { return DOORTILE21____header_global_cdcab3496d69092b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:475
export const HANDPRINTSWITCH____header_global_b0b96c4123050076 = ((((((1155) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dd9bd12bf197b67d564c2bce() {
  return __cxx_static_address_dd9bd12bf197b67d564c2bce.reference || (__cxx_static_address_dd9bd12bf197b67d564c2bce.reference = {
    __cReference: true,
    get value() { return HANDPRINTSWITCH____header_global_b0b96c4123050076; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:476
export const BOTTLE10____header_global_4382aa4fedba8258 = ((((((1157) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_493f740baf5ddee35c1bf3e0() {
  return __cxx_static_address_493f740baf5ddee35c1bf3e0.reference || (__cxx_static_address_493f740baf5ddee35c1bf3e0.reference = {
    __cReference: true,
    get value() { return BOTTLE10____header_global_4382aa4fedba8258; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:477
export const BOTTLE11____header_global_10c039deff98734d = ((((((1158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_08173d1adbb42eeecc0ecf29() {
  return __cxx_static_address_08173d1adbb42eeecc0ecf29.reference || (__cxx_static_address_08173d1adbb42eeecc0ecf29.reference = {
    __cReference: true,
    get value() { return BOTTLE11____header_global_10c039deff98734d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:478
export const BOTTLE12____header_global_7b422555701ec1cd = ((((((1159) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_caea81e3bdbba281f644f730() {
  return __cxx_static_address_caea81e3bdbba281f644f730.reference || (__cxx_static_address_caea81e3bdbba281f644f730.reference = {
    __cReference: true,
    get value() { return BOTTLE12____header_global_7b422555701ec1cd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:479
export const BOTTLE13____header_global_4f5e7d806f4f1a9f = ((((((1160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e7c1c502f2d38f3868a495bc() {
  return __cxx_static_address_e7c1c502f2d38f3868a495bc.reference || (__cxx_static_address_e7c1c502f2d38f3868a495bc.reference = {
    __cReference: true,
    get value() { return BOTTLE13____header_global_4f5e7d806f4f1a9f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:480
export const BOTTLE14____header_global_cdfe40a6486d542e = ((((((1161) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_134414ebad245f7d5cb4ef89() {
  return __cxx_static_address_134414ebad245f7d5cb4ef89.reference || (__cxx_static_address_134414ebad245f7d5cb4ef89.reference = {
    __cReference: true,
    get value() { return BOTTLE14____header_global_cdfe40a6486d542e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:481
export const BOTTLE15____header_global_99727d6ae0d55c28 = ((((((1162) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_083a9aee65c9f63fdba272a4() {
  return __cxx_static_address_083a9aee65c9f63fdba272a4.reference || (__cxx_static_address_083a9aee65c9f63fdba272a4.reference = {
    __cReference: true,
    get value() { return BOTTLE15____header_global_99727d6ae0d55c28; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:482
export const BOTTLE16____header_global_8e71cba99a808cfe = ((((((1163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_879fbd17b145017cad8b76e1() {
  return __cxx_static_address_879fbd17b145017cad8b76e1.reference || (__cxx_static_address_879fbd17b145017cad8b76e1.reference = {
    __cReference: true,
    get value() { return BOTTLE16____header_global_8e71cba99a808cfe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:483
export const BOTTLE17____header_global_150aae4edafae145 = ((((((1164) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8558d8e946697b02af060bc7() {
  return __cxx_static_address_8558d8e946697b02af060bc7.reference || (__cxx_static_address_8558d8e946697b02af060bc7.reference = {
    __cReference: true,
    get value() { return BOTTLE17____header_global_150aae4edafae145; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:484
export const BOTTLE18____header_global_e4703328bb4f5671 = ((((((1165) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cbc21440181af91389e684c4() {
  return __cxx_static_address_cbc21440181af91389e684c4.reference || (__cxx_static_address_cbc21440181af91389e684c4.reference = {
    __cReference: true,
    get value() { return BOTTLE18____header_global_e4703328bb4f5671; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:485
export const BOTTLE19____header_global_b3457531d82b7bab = ((((((1166) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_90550b104cfa35cc8957289f() {
  return __cxx_static_address_90550b104cfa35cc8957289f.reference || (__cxx_static_address_90550b104cfa35cc8957289f.reference = {
    __cReference: true,
    get value() { return BOTTLE19____header_global_b3457531d82b7bab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:486
export const DOORTILE17____header_global_b7caae730630a103 = ((((((1169) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cad810b34b150d3ffd874b8a() {
  return __cxx_static_address_cad810b34b150d3ffd874b8a.reference || (__cxx_static_address_cad810b34b150d3ffd874b8a.reference = {
    __cReference: true,
    get value() { return DOORTILE17____header_global_b7caae730630a103; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:487
export const MASKWALL7____header_global_12f66fc5fba5befc = ((((((1174) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_99e236f51148d766abd60336() {
  return __cxx_static_address_99e236f51148d766abd60336.reference || (__cxx_static_address_99e236f51148d766abd60336.reference = {
    __cReference: true,
    get value() { return MASKWALL7____header_global_12f66fc5fba5befc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:488
export const DOORTILE11____header_global_876d89e219ec5161 = ((((((1178) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fd51c235f8f65ecdb61b43f4() {
  return __cxx_static_address_fd51c235f8f65ecdb61b43f4.reference || (__cxx_static_address_fd51c235f8f65ecdb61b43f4.reference = {
    __cReference: true,
    get value() { return DOORTILE11____header_global_876d89e219ec5161; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:489
export const DOORTILE12____header_global_860a711b3e32db80 = ((((((1179) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7d99216878aa56960ee28a5b() {
  return __cxx_static_address_7d99216878aa56960ee28a5b.reference || (__cxx_static_address_7d99216878aa56960ee28a5b.reference = {
    __cReference: true,
    get value() { return DOORTILE12____header_global_860a711b3e32db80; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:490
export const VENDMACHINE____header_global_a12deec03afb88bb = ((((((1212) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2679881da24829881e9727aa() {
  return __cxx_static_address_2679881da24829881e9727aa.reference || (__cxx_static_address_2679881da24829881e9727aa.reference = {
    __cReference: true,
    get value() { return VENDMACHINE____header_global_a12deec03afb88bb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:491
export const COLAMACHINE____header_global_715e1766e618c0a6 = ((((((1215) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d10e0d1d403d56fcc0bcc2e0() {
  return __cxx_static_address_d10e0d1d403d56fcc0bcc2e0.reference || (__cxx_static_address_d10e0d1d403d56fcc0bcc2e0.reference = {
    __cReference: true,
    get value() { return COLAMACHINE____header_global_715e1766e618c0a6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:492
export const CRANEPOLE____header_global_220e20a98fbf86a6 = ((((((1221) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8745ccbb6fe92f19f6810259() {
  return __cxx_static_address_8745ccbb6fe92f19f6810259.reference || (__cxx_static_address_8745ccbb6fe92f19f6810259.reference = {
    __cReference: true,
    get value() { return CRANEPOLE____header_global_220e20a98fbf86a6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:493
export const CRANE____header_global_2caf80196a275e47 = ((((((1222) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cbc02056e3b6ab9531ccf192() {
  return __cxx_static_address_cbc02056e3b6ab9531ccf192.reference || (__cxx_static_address_cbc02056e3b6ab9531ccf192.reference = {
    __cReference: true,
    get value() { return CRANE____header_global_2caf80196a275e47; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:494
export const BARBROKE____header_global_700ac1b7aa01e4f1 = ((((((1225) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ba67796f251898e9b7af84f7() {
  return __cxx_static_address_ba67796f251898e9b7af84f7.reference || (__cxx_static_address_ba67796f251898e9b7af84f7.reference = {
    __cReference: true,
    get value() { return BARBROKE____header_global_700ac1b7aa01e4f1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:495
export const BLOODPOOL____header_global_7a0a57ad62c1ad39 = ((((((1226) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aa19e8aa856a1767895ce3e6() {
  return __cxx_static_address_aa19e8aa856a1767895ce3e6.reference || (__cxx_static_address_aa19e8aa856a1767895ce3e6.reference = {
    __cReference: true,
    get value() { return BLOODPOOL____header_global_7a0a57ad62c1ad39; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:496
export const NUKEBARREL____header_global_9111932429c89b04 = ((((((1227) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6958c6880e0a526390fd49bb() {
  return __cxx_static_address_6958c6880e0a526390fd49bb.reference || (__cxx_static_address_6958c6880e0a526390fd49bb.reference = {
    __cReference: true,
    get value() { return NUKEBARREL____header_global_9111932429c89b04; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:497
export const NUKEBARRELDENTED____header_global_0bc77ede0d083324 = ((((((1228) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8b6849bad6e54120f6df9468() {
  return __cxx_static_address_8b6849bad6e54120f6df9468.reference || (__cxx_static_address_8b6849bad6e54120f6df9468.reference = {
    __cReference: true,
    get value() { return NUKEBARRELDENTED____header_global_0bc77ede0d083324; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:498
export const NUKEBARRELLEAKED____header_global_b6658e5ff72cea86 = ((((((1229) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_769784769a61a923fe3f8693() {
  return __cxx_static_address_769784769a61a923fe3f8693.reference || (__cxx_static_address_769784769a61a923fe3f8693.reference = {
    __cReference: true,
    get value() { return NUKEBARRELLEAKED____header_global_b6658e5ff72cea86; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:499
export const CANWITHSOMETHING____header_global_d2f80de7ddc312bf = ((((((1232) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dfad591fe57b644b35d3681f() {
  return __cxx_static_address_dfad591fe57b644b35d3681f.reference || (__cxx_static_address_dfad591fe57b644b35d3681f.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING____header_global_d2f80de7ddc312bf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:500
export const MONEY____header_global_ad29972757b667ca = ((((((1233) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a2a02491867063a098baa4d8() {
  return __cxx_static_address_a2a02491867063a098baa4d8.reference || (__cxx_static_address_a2a02491867063a098baa4d8.reference = {
    __cReference: true,
    get value() { return MONEY____header_global_ad29972757b667ca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:501
export const BANNER____header_global_94bba662d1671ab2 = ((((((1236) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8b6f32738167667df1f5c013() {
  return __cxx_static_address_8b6f32738167667df1f5c013.reference || (__cxx_static_address_8b6f32738167667df1f5c013.reference = {
    __cReference: true,
    get value() { return BANNER____header_global_94bba662d1671ab2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:502
export const EXPLODINGBARREL____header_global_63a67d8551ca8d2a = ((((((1238) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f61b7869f48b497609e49c6e() {
  return __cxx_static_address_f61b7869f48b497609e49c6e.reference || (__cxx_static_address_f61b7869f48b497609e49c6e.reference = {
    __cReference: true,
    get value() { return EXPLODINGBARREL____header_global_63a67d8551ca8d2a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:503
export const EXPLODINGBARREL2____header_global_0aad0ef0666aa158 = ((((((1239) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_73f48054f202cb49bb05c6bb() {
  return __cxx_static_address_73f48054f202cb49bb05c6bb.reference || (__cxx_static_address_73f48054f202cb49bb05c6bb.reference = {
    __cReference: true,
    get value() { return EXPLODINGBARREL2____header_global_0aad0ef0666aa158; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:504
export const FIREBARREL____header_global_82f86feb345996e4 = ((((((1240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e452d69b06f17df2326b6cac() {
  return __cxx_static_address_e452d69b06f17df2326b6cac.reference || (__cxx_static_address_e452d69b06f17df2326b6cac.reference = {
    __cReference: true,
    get value() { return FIREBARREL____header_global_82f86feb345996e4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:505
export const SEENINE____header_global_42a556b2c663ce50 = ((((((1247) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2a3b826b171c5d0440973394() {
  return __cxx_static_address_2a3b826b171c5d0440973394.reference || (__cxx_static_address_2a3b826b171c5d0440973394.reference = {
    __cReference: true,
    get value() { return SEENINE____header_global_42a556b2c663ce50; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:506
export const SEENINEDEAD____header_global_61143056e582c45a = ((((((1248) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_af40de96850b4df3e39d2e06() {
  return __cxx_static_address_af40de96850b4df3e39d2e06.reference || (__cxx_static_address_af40de96850b4df3e39d2e06.reference = {
    __cReference: true,
    get value() { return SEENINEDEAD____header_global_61143056e582c45a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:507
export const STEAM____header_global_30c5b968ecfbcffc = ((((((1250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ea6daeda02e36be60d287603() {
  return __cxx_static_address_ea6daeda02e36be60d287603.reference || (__cxx_static_address_ea6daeda02e36be60d287603.reference = {
    __cReference: true,
    get value() { return STEAM____header_global_30c5b968ecfbcffc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:508
export const CEILINGSTEAM____header_global_58b53e9e71516bdb = ((((((1255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_040c348214b98b5565febf61() {
  return __cxx_static_address_040c348214b98b5565febf61.reference || (__cxx_static_address_040c348214b98b5565febf61.reference = {
    __cReference: true,
    get value() { return CEILINGSTEAM____header_global_58b53e9e71516bdb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:509
export const PIPE6B____header_global_56771770d32c5a35 = ((((((1260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dabf376137819d4a4bf1c9d8() {
  return __cxx_static_address_dabf376137819d4a4bf1c9d8.reference || (__cxx_static_address_dabf376137819d4a4bf1c9d8.reference = {
    __cReference: true,
    get value() { return PIPE6B____header_global_56771770d32c5a35; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:510
export const TRANSPORTERBEAM____header_global_31cd6fdbe125f1dc = ((((((1261) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6d081dbdbdc70b2365afa2c1() {
  return __cxx_static_address_6d081dbdbdc70b2365afa2c1.reference || (__cxx_static_address_6d081dbdbdc70b2365afa2c1.reference = {
    __cReference: true,
    get value() { return TRANSPORTERBEAM____header_global_31cd6fdbe125f1dc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:511
export const RAT____header_global_4a69ea528669bbff = ((((((1267) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_88f37e1397cc10f8ea30b4a1() {
  return __cxx_static_address_88f37e1397cc10f8ea30b4a1.reference || (__cxx_static_address_88f37e1397cc10f8ea30b4a1.reference = {
    __cReference: true,
    get value() { return RAT____header_global_4a69ea528669bbff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:512
export const TRASH____header_global_1780bad9e58a742c = ((((((1272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_19b4eee7cbffd956eff5da6a() {
  return __cxx_static_address_19b4eee7cbffd956eff5da6a.reference || (__cxx_static_address_19b4eee7cbffd956eff5da6a.reference = {
    __cReference: true,
    get value() { return TRASH____header_global_1780bad9e58a742c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:513
export const FEMPIC1____header_global_5a46033ae960bbd8 = ((((((1280) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e594ffbf9786cf65f80d1574() {
  return __cxx_static_address_e594ffbf9786cf65f80d1574.reference || (__cxx_static_address_e594ffbf9786cf65f80d1574.reference = {
    __cReference: true,
    get value() { return FEMPIC1____header_global_5a46033ae960bbd8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:514
export const FEMPIC2____header_global_0a2c75df54224149 = ((((((1289) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_82334e903dba0428edc0482a() {
  return __cxx_static_address_82334e903dba0428edc0482a.reference || (__cxx_static_address_82334e903dba0428edc0482a.reference = {
    __cReference: true,
    get value() { return FEMPIC2____header_global_0a2c75df54224149; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:515
export const BLANKSCREEN____header_global_caa06f77de815f6d = ((((((1293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a99e10233f60b7793c75319e() {
  return __cxx_static_address_a99e10233f60b7793c75319e.reference || (__cxx_static_address_a99e10233f60b7793c75319e.reference = {
    __cReference: true,
    get value() { return BLANKSCREEN____header_global_caa06f77de815f6d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:516
export const PODFEM1____header_global_a3aaa471f22ab7f7 = ((((((1294) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c18cd66b66cb0da4eed6099d() {
  return __cxx_static_address_c18cd66b66cb0da4eed6099d.reference || (__cxx_static_address_c18cd66b66cb0da4eed6099d.reference = {
    __cReference: true,
    get value() { return PODFEM1____header_global_a3aaa471f22ab7f7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:517
export const FEMPIC3____header_global_c731a40ded7a6ff7 = ((((((1298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_28e3364441e66b88564189d6() {
  return __cxx_static_address_28e3364441e66b88564189d6.reference || (__cxx_static_address_28e3364441e66b88564189d6.reference = {
    __cReference: true,
    get value() { return FEMPIC3____header_global_c731a40ded7a6ff7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:518
export const FEMPIC4____header_global_05bbeff6ac787d76 = ((((((1306) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a1e1d295573adaa0b41940f8() {
  return __cxx_static_address_a1e1d295573adaa0b41940f8.reference || (__cxx_static_address_a1e1d295573adaa0b41940f8.reference = {
    __cReference: true,
    get value() { return FEMPIC4____header_global_05bbeff6ac787d76; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:519
export const FEM1____header_global_7e28a076984a7e53 = ((((((1312) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6962681ce4aa40c86ec82f08() {
  return __cxx_static_address_6962681ce4aa40c86ec82f08.reference || (__cxx_static_address_6962681ce4aa40c86ec82f08.reference = {
    __cReference: true,
    get value() { return FEM1____header_global_7e28a076984a7e53; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:520
export const FEM2____header_global_a564f3176077a5db = ((((((1317) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8696e6cc3e7be077ed7477cf() {
  return __cxx_static_address_8696e6cc3e7be077ed7477cf.reference || (__cxx_static_address_8696e6cc3e7be077ed7477cf.reference = {
    __cReference: true,
    get value() { return FEM2____header_global_a564f3176077a5db; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:521
export const FEM3____header_global_e0c79b04becc03b6 = ((((((1321) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a3149bdab222e7ac52a9e2cb() {
  return __cxx_static_address_a3149bdab222e7ac52a9e2cb.reference || (__cxx_static_address_a3149bdab222e7ac52a9e2cb.reference = {
    __cReference: true,
    get value() { return FEM3____header_global_e0c79b04becc03b6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:522
export const FEM5____header_global_8358c81b731105e6 = ((((((1323) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_20ef8bba4285a3b9b9b56da2() {
  return __cxx_static_address_20ef8bba4285a3b9b9b56da2.reference || (__cxx_static_address_20ef8bba4285a3b9b9b56da2.reference = {
    __cReference: true,
    get value() { return FEM5____header_global_8358c81b731105e6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:523
export const BLOODYPOLE____header_global_9d5052d2223059ba = ((((((1324) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_92525d2aeadc6bf7bf1c8ba0() {
  return __cxx_static_address_92525d2aeadc6bf7bf1c8ba0.reference || (__cxx_static_address_92525d2aeadc6bf7bf1c8ba0.reference = {
    __cReference: true,
    get value() { return BLOODYPOLE____header_global_9d5052d2223059ba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:524
export const FEM4____header_global_eb7da788bc341965 = ((((((1325) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_61d7c9ac5097e41beb35b4c5() {
  return __cxx_static_address_61d7c9ac5097e41beb35b4c5.reference || (__cxx_static_address_61d7c9ac5097e41beb35b4c5.reference = {
    __cReference: true,
    get value() { return FEM4____header_global_eb7da788bc341965; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:525
export const FEM6____header_global_c1b83f5d16361e58 = ((((((1334) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cacfb167b12b545d0acd06ec() {
  return __cxx_static_address_cacfb167b12b545d0acd06ec.reference || (__cxx_static_address_cacfb167b12b545d0acd06ec.reference = {
    __cReference: true,
    get value() { return FEM6____header_global_c1b83f5d16361e58; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:526
export const FEM6PAD____header_global_a9db1a3dc0a26e0b = ((((((1335) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ae3fe23beacc8e494ecb1469() {
  return __cxx_static_address_ae3fe23beacc8e494ecb1469.reference || (__cxx_static_address_ae3fe23beacc8e494ecb1469.reference = {
    __cReference: true,
    get value() { return FEM6PAD____header_global_a9db1a3dc0a26e0b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:527
export const FEM8____header_global_d88b815adbde4b0a = ((((((1336) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_554b4bc0c6e89dc97b1d4bf3() {
  return __cxx_static_address_554b4bc0c6e89dc97b1d4bf3.reference || (__cxx_static_address_554b4bc0c6e89dc97b1d4bf3.reference = {
    __cReference: true,
    get value() { return FEM8____header_global_d88b815adbde4b0a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:528
export const HELECOPT____header_global_0bcdf251af41b770 = ((((((1346) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4efaabe3769aa9ae1652deb6() {
  return __cxx_static_address_4efaabe3769aa9ae1652deb6.reference || (__cxx_static_address_4efaabe3769aa9ae1652deb6.reference = {
    __cReference: true,
    get value() { return HELECOPT____header_global_0bcdf251af41b770; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:529
export const FETUSJIB____header_global_4b7b07291ced214a = ((((((1347) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d6f4c95a4a2ddd16279e9c54() {
  return __cxx_static_address_d6f4c95a4a2ddd16279e9c54.reference || (__cxx_static_address_d6f4c95a4a2ddd16279e9c54.reference = {
    __cReference: true,
    get value() { return FETUSJIB____header_global_4b7b07291ced214a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:530
export const HOLODUKE____header_global_b7cea81a846afcaf = ((((((1348) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4bb4c5cd235d7187253a8000() {
  return __cxx_static_address_4bb4c5cd235d7187253a8000.reference || (__cxx_static_address_4bb4c5cd235d7187253a8000.reference = {
    __cReference: true,
    get value() { return HOLODUKE____header_global_b7cea81a846afcaf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:531
export const SPACEMARINE____header_global_983a448d2e922bb9 = ((((((1353) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e4a0192b57499cad9f533eaa() {
  return __cxx_static_address_e4a0192b57499cad9f533eaa.reference || (__cxx_static_address_e4a0192b57499cad9f533eaa.reference = {
    __cReference: true,
    get value() { return SPACEMARINE____header_global_983a448d2e922bb9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:532
export const INDY____header_global_4792f5385ecbb130 = ((((((1355) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f89b058661609eef4d9fe19c() {
  return __cxx_static_address_f89b058661609eef4d9fe19c.reference || (__cxx_static_address_f89b058661609eef4d9fe19c.reference = {
    __cReference: true,
    get value() { return INDY____header_global_4792f5385ecbb130; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:533
export const FETUS____header_global_8c53697faeee1757 = ((((((1358) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cfa4829e64d6c8a2f025e76c() {
  return __cxx_static_address_cfa4829e64d6c8a2f025e76c.reference || (__cxx_static_address_cfa4829e64d6c8a2f025e76c.reference = {
    __cReference: true,
    get value() { return FETUS____header_global_8c53697faeee1757; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:534
export const FETUSBROKE____header_global_b0e1d231a81501d9 = ((((((1359) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0cccd8a641afa58dfb98d683() {
  return __cxx_static_address_0cccd8a641afa58dfb98d683.reference || (__cxx_static_address_0cccd8a641afa58dfb98d683.reference = {
    __cReference: true,
    get value() { return FETUSBROKE____header_global_b0e1d231a81501d9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:535
export const MONK____header_global_6b0ed77eb351ed38 = ((((((1352) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_385e62fe4b12ea8ebd7dacec() {
  return __cxx_static_address_385e62fe4b12ea8ebd7dacec.reference || (__cxx_static_address_385e62fe4b12ea8ebd7dacec.reference = {
    __cReference: true,
    get value() { return MONK____header_global_6b0ed77eb351ed38; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:536
export const LUKE____header_global_f5230738525cc24d = ((((((1354) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4213481e9e4ec82f5a3cf3ec() {
  return __cxx_static_address_4213481e9e4ec82f5a3cf3ec.reference || (__cxx_static_address_4213481e9e4ec82f5a3cf3ec.reference = {
    __cReference: true,
    get value() { return LUKE____header_global_f5230738525cc24d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:537
export const COOLEXPLOSION1____header_global_6eb3b1b91c34b00c = ((((((1360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_af809ba5df5e827237679fcd() {
  return __cxx_static_address_af809ba5df5e827237679fcd.reference || (__cxx_static_address_af809ba5df5e827237679fcd.reference = {
    __cReference: true,
    get value() { return COOLEXPLOSION1____header_global_6eb3b1b91c34b00c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:538
export const WATERSPLASH2____header_global_664ee7f0565593be = ((((((1380) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a070ef94a72d66f6a649304d() {
  return __cxx_static_address_a070ef94a72d66f6a649304d.reference || (__cxx_static_address_a070ef94a72d66f6a649304d.reference = {
    __cReference: true,
    get value() { return WATERSPLASH2____header_global_664ee7f0565593be; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:539
export const FIREVASE____header_global_9c79733133b947b5 = ((((((1390) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_634ef0cd028b4769d3047270() {
  return __cxx_static_address_634ef0cd028b4769d3047270.reference || (__cxx_static_address_634ef0cd028b4769d3047270.reference = {
    __cReference: true,
    get value() { return FIREVASE____header_global_9c79733133b947b5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:540
export const FEM7____header_global_7af1439fb39c21b3 = ((((((1395) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_35b227140ce341665366983c() {
  return __cxx_static_address_35b227140ce341665366983c.reference || (__cxx_static_address_35b227140ce341665366983c.reference = {
    __cReference: true,
    get value() { return FEM7____header_global_7af1439fb39c21b3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:541
export const APLAYERTOP____header_global_2fd412673a65616b = ((((((1400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b659df406b8422f9c1e086ef() {
  return __cxx_static_address_b659df406b8422f9c1e086ef.reference || (__cxx_static_address_b659df406b8422f9c1e086ef.reference = {
    __cReference: true,
    get value() { return APLAYERTOP____header_global_2fd412673a65616b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:542
export const APLAYER____header_global_caee83a1e6471597 = ((((((1405) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a69e5d1cdb2d25b640c17b32() {
  return __cxx_static_address_a69e5d1cdb2d25b640c17b32.reference || (__cxx_static_address_a69e5d1cdb2d25b640c17b32.reference = {
    __cReference: true,
    get value() { return APLAYER____header_global_caee83a1e6471597; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:543
export const PLAYERONWATER____header_global_68dbbdb2563f9930 = ((((((1420) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4a3044d3e8bdf3332f446978() {
  return __cxx_static_address_4a3044d3e8bdf3332f446978.reference || (__cxx_static_address_4a3044d3e8bdf3332f446978.reference = {
    __cReference: true,
    get value() { return PLAYERONWATER____header_global_68dbbdb2563f9930; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:544
export const DUKELYINGDEAD____header_global_d0c47dc9177eaa35 = ((((((1518) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b07b00061111ead74d5d6ee8() {
  return __cxx_static_address_b07b00061111ead74d5d6ee8.reference || (__cxx_static_address_b07b00061111ead74d5d6ee8.reference = {
    __cReference: true,
    get value() { return DUKELYINGDEAD____header_global_d0c47dc9177eaa35; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:545
export const DUKETORSO____header_global_e2523d9fd5687fa5 = ((((((1520) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_176cfcd6291fdbd33afb39a8() {
  return __cxx_static_address_176cfcd6291fdbd33afb39a8.reference || (__cxx_static_address_176cfcd6291fdbd33afb39a8.reference = {
    __cReference: true,
    get value() { return DUKETORSO____header_global_e2523d9fd5687fa5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:546
export const DUKEGUN____header_global_0a3ea3a2a403c748 = ((((((1528) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2ec6845f40935b7875fb0ff9() {
  return __cxx_static_address_2ec6845f40935b7875fb0ff9.reference || (__cxx_static_address_2ec6845f40935b7875fb0ff9.reference = {
    __cReference: true,
    get value() { return DUKEGUN____header_global_0a3ea3a2a403c748; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:547
export const DUKELEG____header_global_6c4a6d9517d32fe3 = ((((((1536) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_216257aeb5bcf607a2071b27() {
  return __cxx_static_address_216257aeb5bcf607a2071b27.reference || (__cxx_static_address_216257aeb5bcf607a2071b27.reference = {
    __cReference: true,
    get value() { return DUKELEG____header_global_6c4a6d9517d32fe3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:548
export const SHARK____header_global_0126b62f9151d37c = ((((((1550) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_441b8b0c1e7fe0ad30a51012() {
  return __cxx_static_address_441b8b0c1e7fe0ad30a51012.reference || (__cxx_static_address_441b8b0c1e7fe0ad30a51012.reference = {
    __cReference: true,
    get value() { return SHARK____header_global_0126b62f9151d37c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:549
export const BLOOD____header_global_a7eab8a9c05cd6c5 = ((((((1620) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_abe201c891a316c4e0da1691() {
  return __cxx_static_address_abe201c891a316c4e0da1691.reference || (__cxx_static_address_abe201c891a316c4e0da1691.reference = {
    __cReference: true,
    get value() { return BLOOD____header_global_a7eab8a9c05cd6c5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:550
export const FIRELASER____header_global_5e665072d8d09e21 = ((((((1625) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8fbdd94aee39fc9eb44d748a() {
  return __cxx_static_address_8fbdd94aee39fc9eb44d748a.reference || (__cxx_static_address_8fbdd94aee39fc9eb44d748a.reference = {
    __cReference: true,
    get value() { return FIRELASER____header_global_5e665072d8d09e21; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:551
export const TRANSPORTERSTAR____header_global_869c8b22f39ad58a = ((((((1630) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7eeea99dae8d2d842a1d9d13() {
  return __cxx_static_address_7eeea99dae8d2d842a1d9d13.reference || (__cxx_static_address_7eeea99dae8d2d842a1d9d13.reference = {
    __cReference: true,
    get value() { return TRANSPORTERSTAR____header_global_869c8b22f39ad58a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:552
export const SPIT____header_global_d675be3812045ad5 = ((((((1636) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_02b134446fea2c66b1292165() {
  return __cxx_static_address_02b134446fea2c66b1292165.reference || (__cxx_static_address_02b134446fea2c66b1292165.reference = {
    __cReference: true,
    get value() { return SPIT____header_global_d675be3812045ad5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:553
export const LOOGIE____header_global_171e974d43528d35 = ((((((1637) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e611bfce63cffb98f94f92a5() {
  return __cxx_static_address_e611bfce63cffb98f94f92a5.reference || (__cxx_static_address_e611bfce63cffb98f94f92a5.reference = {
    __cReference: true,
    get value() { return LOOGIE____header_global_171e974d43528d35; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:554
export const FIST____header_global_adde05a21a216162 = ((((((1640) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_617dc21b7b9c8b4a3e5bcb2a() {
  return __cxx_static_address_617dc21b7b9c8b4a3e5bcb2a.reference || (__cxx_static_address_617dc21b7b9c8b4a3e5bcb2a.reference = {
    __cReference: true,
    get value() { return FIST____header_global_adde05a21a216162; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:555
export const FREEZEBLAST____header_global_2b5a2357a1203c8e = ((((((1641) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bd29d36e9ff337d96cc2704b() {
  return __cxx_static_address_bd29d36e9ff337d96cc2704b.reference || (__cxx_static_address_bd29d36e9ff337d96cc2704b.reference = {
    __cReference: true,
    get value() { return FREEZEBLAST____header_global_2b5a2357a1203c8e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:556
export const SHRINKSPARK____header_global_d9f469a1f6cb5bbe = ((((((1646) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b18e9da1833170ba34261700() {
  return __cxx_static_address_b18e9da1833170ba34261700.reference || (__cxx_static_address_b18e9da1833170ba34261700.reference = {
    __cReference: true,
    get value() { return SHRINKSPARK____header_global_d9f469a1f6cb5bbe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:557
export const TONGUE____header_global_612f6b7051972391 = ((((((1647) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a1be33f06af6265dfc67264d() {
  return __cxx_static_address_a1be33f06af6265dfc67264d.reference || (__cxx_static_address_a1be33f06af6265dfc67264d.reference = {
    __cReference: true,
    get value() { return TONGUE____header_global_612f6b7051972391; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:558
export const MORTER____header_global_2b82aed6d8705e8b = ((((((1650) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0285a0cc87e11eed9f46427c() {
  return __cxx_static_address_0285a0cc87e11eed9f46427c.reference || (__cxx_static_address_0285a0cc87e11eed9f46427c.reference = {
    __cReference: true,
    get value() { return MORTER____header_global_2b82aed6d8705e8b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:559
export const SHRINKEREXPLOSION____header_global_6d1286366368e136 = ((((((1656) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e33361acc7980d999ad87660() {
  return __cxx_static_address_e33361acc7980d999ad87660.reference || (__cxx_static_address_e33361acc7980d999ad87660.reference = {
    __cReference: true,
    get value() { return SHRINKEREXPLOSION____header_global_6d1286366368e136; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:560
export const RADIUSEXPLOSION____header_global_aff02348c1f7cf1d = ((((((1670) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_895efd9273d74417d1c3631e() {
  return __cxx_static_address_895efd9273d74417d1c3631e.reference || (__cxx_static_address_895efd9273d74417d1c3631e.reference = {
    __cReference: true,
    get value() { return RADIUSEXPLOSION____header_global_aff02348c1f7cf1d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:561
export const FORCERIPPLE____header_global_fa39a3bb7d6bf985 = ((((((1671) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_52b523e93dd8be37ce4bcc95() {
  return __cxx_static_address_52b523e93dd8be37ce4bcc95.reference || (__cxx_static_address_52b523e93dd8be37ce4bcc95.reference = {
    __cReference: true,
    get value() { return FORCERIPPLE____header_global_fa39a3bb7d6bf985; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:562
export const LIZTROOP____header_global_588578f308c46cc6 = ((((((1680) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_07f32370f5e3ebbfaffb20e6() {
  return __cxx_static_address_07f32370f5e3ebbfaffb20e6.reference || (__cxx_static_address_07f32370f5e3ebbfaffb20e6.reference = {
    __cReference: true,
    get value() { return LIZTROOP____header_global_588578f308c46cc6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:563
export const LIZTROOPRUNNING____header_global_261326f025f8dfcb = ((((((1681) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_05dccf77658b46c1cfe78543() {
  return __cxx_static_address_05dccf77658b46c1cfe78543.reference || (__cxx_static_address_05dccf77658b46c1cfe78543.reference = {
    __cReference: true,
    get value() { return LIZTROOPRUNNING____header_global_261326f025f8dfcb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:564
export const LIZTROOPSTAYPUT____header_global_48f877a04fd52834 = ((((((1682) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ef120c048fdab3ae3f970f6c() {
  return __cxx_static_address_ef120c048fdab3ae3f970f6c.reference || (__cxx_static_address_ef120c048fdab3ae3f970f6c.reference = {
    __cReference: true,
    get value() { return LIZTROOPSTAYPUT____header_global_48f877a04fd52834; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:565
export const LIZTROOPSHOOT____header_global_61f25f63dd1974d7 = ((((((1715) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c1255d321ed4c198c0500df4() {
  return __cxx_static_address_c1255d321ed4c198c0500df4.reference || (__cxx_static_address_c1255d321ed4c198c0500df4.reference = {
    __cReference: true,
    get value() { return LIZTROOPSHOOT____header_global_61f25f63dd1974d7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:566
export const LIZTROOPJETPACK____header_global_acee153fe37d29f3 = ((((((1725) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2b9751576cb95b1319af3d3a() {
  return __cxx_static_address_2b9751576cb95b1319af3d3a.reference || (__cxx_static_address_2b9751576cb95b1319af3d3a.reference = {
    __cReference: true,
    get value() { return LIZTROOPJETPACK____header_global_acee153fe37d29f3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:567
export const LIZTROOPONTOILET____header_global_261e6d2806c6bbd0 = ((((((1741) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fbfeb78116697d07268c8a9f() {
  return __cxx_static_address_fbfeb78116697d07268c8a9f.reference || (__cxx_static_address_fbfeb78116697d07268c8a9f.reference = {
    __cReference: true,
    get value() { return LIZTROOPONTOILET____header_global_261e6d2806c6bbd0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:568
export const LIZTROOPJUSTSIT____header_global_92724e23922975fc = ((((((1742) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_26e04f55beb1498ae0cc5d93() {
  return __cxx_static_address_26e04f55beb1498ae0cc5d93.reference || (__cxx_static_address_26e04f55beb1498ae0cc5d93.reference = {
    __cReference: true,
    get value() { return LIZTROOPJUSTSIT____header_global_92724e23922975fc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:569
export const LIZTROOPDUCKING____header_global_d160f124b2a0cd21 = ((((((1744) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_17cbdab41db7050cd66d2f90() {
  return __cxx_static_address_17cbdab41db7050cd66d2f90.reference || (__cxx_static_address_17cbdab41db7050cd66d2f90.reference = {
    __cReference: true,
    get value() { return LIZTROOPDUCKING____header_global_d160f124b2a0cd21; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:570
export const HEADJIB1____header_global_861536e4af547b98 = ((((((1768) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ab765e73c1f5fac572e8f05a() {
  return __cxx_static_address_ab765e73c1f5fac572e8f05a.reference || (__cxx_static_address_ab765e73c1f5fac572e8f05a.reference = {
    __cReference: true,
    get value() { return HEADJIB1____header_global_861536e4af547b98; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:571
export const ARMJIB1____header_global_e62fb0cbbd34dcab = ((((((1772) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2b65c41515947a3160272bbb() {
  return __cxx_static_address_2b65c41515947a3160272bbb.reference || (__cxx_static_address_2b65c41515947a3160272bbb.reference = {
    __cReference: true,
    get value() { return ARMJIB1____header_global_e62fb0cbbd34dcab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:572
export const LEGJIB1____header_global_0596693692fe5162 = ((((((1776) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8326a89975740cec8dcfdfeb() {
  return __cxx_static_address_8326a89975740cec8dcfdfeb.reference || (__cxx_static_address_8326a89975740cec8dcfdfeb.reference = {
    __cReference: true,
    get value() { return LEGJIB1____header_global_0596693692fe5162; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:573
export const OCTABRAIN____header_global_9218e0f2cce0ec32 = ((((((1820) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4c3d670c71c45c742a75399b() {
  return __cxx_static_address_4c3d670c71c45c742a75399b.reference || (__cxx_static_address_4c3d670c71c45c742a75399b.reference = {
    __cReference: true,
    get value() { return OCTABRAIN____header_global_9218e0f2cce0ec32; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:574
export const OCTABRAINSTAYPUT____header_global_71c99e8af4c7ff47 = ((((((1821) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a237395a147c18d8aeb71d03() {
  return __cxx_static_address_a237395a147c18d8aeb71d03.reference || (__cxx_static_address_a237395a147c18d8aeb71d03.reference = {
    __cReference: true,
    get value() { return OCTABRAINSTAYPUT____header_global_71c99e8af4c7ff47; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:575
export const INNERJAW____header_global_7801c9e6de3887bc = ((((((1860) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2c68d9f63f7fdf4ccdaba22b() {
  return __cxx_static_address_2c68d9f63f7fdf4ccdaba22b.reference || (__cxx_static_address_2c68d9f63f7fdf4ccdaba22b.reference = {
    __cReference: true,
    get value() { return INNERJAW____header_global_7801c9e6de3887bc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:576
export const DRONE____header_global_f43d128c5eff0843 = ((((((1880) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_81fede54e5c1fd335f13e448() {
  return __cxx_static_address_81fede54e5c1fd335f13e448.reference || (__cxx_static_address_81fede54e5c1fd335f13e448.reference = {
    __cReference: true,
    get value() { return DRONE____header_global_f43d128c5eff0843; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:577
export const EXPLOSION2____header_global_8f21745ce58540bf = ((((((1890) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e3f0cfdead3b10ec385eddc0() {
  return __cxx_static_address_e3f0cfdead3b10ec385eddc0.reference || (__cxx_static_address_e3f0cfdead3b10ec385eddc0.reference = {
    __cReference: true,
    get value() { return EXPLOSION2____header_global_8f21745ce58540bf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:578
export const COMMANDER____header_global_ef0b3cd690542857 = ((((((1920) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d254b64d1ec3d30359755455() {
  return __cxx_static_address_d254b64d1ec3d30359755455.reference || (__cxx_static_address_d254b64d1ec3d30359755455.reference = {
    __cReference: true,
    get value() { return COMMANDER____header_global_ef0b3cd690542857; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:579
export const COMMANDERSTAYPUT____header_global_e14c08843c73b480 = ((((((1921) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_08f388a158c93a3866ea7430() {
  return __cxx_static_address_08f388a158c93a3866ea7430.reference || (__cxx_static_address_08f388a158c93a3866ea7430.reference = {
    __cReference: true,
    get value() { return COMMANDERSTAYPUT____header_global_e14c08843c73b480; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:580
export const RECON____header_global_611fa81fd6621d0f = ((((((1960) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_34f2e12fa5aea76134637727() {
  return __cxx_static_address_34f2e12fa5aea76134637727.reference || (__cxx_static_address_34f2e12fa5aea76134637727.reference = {
    __cReference: true,
    get value() { return RECON____header_global_611fa81fd6621d0f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:581
export const TANK____header_global_675dba9f892fc153 = ((((((1975) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_235d6190a8346e1043e10a55() {
  return __cxx_static_address_235d6190a8346e1043e10a55.reference || (__cxx_static_address_235d6190a8346e1043e10a55.reference = {
    __cReference: true,
    get value() { return TANK____header_global_675dba9f892fc153; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:582
export const PIGCOP____header_global_9c66aa5ab48dfb9b = ((((((2000) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4ba96e6b87bf6ea74ce2ed76() {
  return __cxx_static_address_4ba96e6b87bf6ea74ce2ed76.reference || (__cxx_static_address_4ba96e6b87bf6ea74ce2ed76.reference = {
    __cReference: true,
    get value() { return PIGCOP____header_global_9c66aa5ab48dfb9b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:583
export const PIGCOPSTAYPUT____header_global_afabaf0b5f62650b = ((((((2001) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_27d9464348a8678337e8a83a() {
  return __cxx_static_address_27d9464348a8678337e8a83a.reference || (__cxx_static_address_27d9464348a8678337e8a83a.reference = {
    __cReference: true,
    get value() { return PIGCOPSTAYPUT____header_global_afabaf0b5f62650b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:584
export const PIGCOPDIVE____header_global_f37968c6f20d328a = ((((((2045) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_faf253e8d3abccdb768b70dd() {
  return __cxx_static_address_faf253e8d3abccdb768b70dd.reference || (__cxx_static_address_faf253e8d3abccdb768b70dd.reference = {
    __cReference: true,
    get value() { return PIGCOPDIVE____header_global_f37968c6f20d328a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:585
export const LIZMAN____header_global_2f58280d22f3cb7e = ((((((2120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_19df0d2db1a6dacdbc99132f() {
  return __cxx_static_address_19df0d2db1a6dacdbc99132f.reference || (__cxx_static_address_19df0d2db1a6dacdbc99132f.reference = {
    __cReference: true,
    get value() { return LIZMAN____header_global_2f58280d22f3cb7e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:586
export const LIZMANSTAYPUT____header_global_78452fa929f1b4b1 = ((((((2121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a7bac7e8699778b65c686955() {
  return __cxx_static_address_a7bac7e8699778b65c686955.reference || (__cxx_static_address_a7bac7e8699778b65c686955.reference = {
    __cReference: true,
    get value() { return LIZMANSTAYPUT____header_global_78452fa929f1b4b1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:587
export const LIZMANSPITTING____header_global_53d3c6ecba932f9c = ((((((2150) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_66795c4dc9945cf3be68de33() {
  return __cxx_static_address_66795c4dc9945cf3be68de33.reference || (__cxx_static_address_66795c4dc9945cf3be68de33.reference = {
    __cReference: true,
    get value() { return LIZMANSPITTING____header_global_53d3c6ecba932f9c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:588
export const LIZMANFEEDING____header_global_67dab11847784c18 = ((((((2160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_43d30518fd4c440e0548fc71() {
  return __cxx_static_address_43d30518fd4c440e0548fc71.reference || (__cxx_static_address_43d30518fd4c440e0548fc71.reference = {
    __cReference: true,
    get value() { return LIZMANFEEDING____header_global_67dab11847784c18; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:589
export const LIZMANJUMP____header_global_51b9778c742e8861 = ((((((2165) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_28954e45542c7e85c52ef7b8() {
  return __cxx_static_address_28954e45542c7e85c52ef7b8.reference || (__cxx_static_address_28954e45542c7e85c52ef7b8.reference = {
    __cReference: true,
    get value() { return LIZMANJUMP____header_global_51b9778c742e8861; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:590
export const FECES____header_global_d6d71cb90d94198f = ((((((2200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5f5c6eaf4916b68e1bb16d24() {
  return __cxx_static_address_5f5c6eaf4916b68e1bb16d24.reference || (__cxx_static_address_5f5c6eaf4916b68e1bb16d24.reference = {
    __cReference: true,
    get value() { return FECES____header_global_d6d71cb90d94198f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:591
export const LIZMANHEAD1____header_global_b066c3c64fe20da4 = ((((((2201) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_542bf967841f943c6600047d() {
  return __cxx_static_address_542bf967841f943c6600047d.reference || (__cxx_static_address_542bf967841f943c6600047d.reference = {
    __cReference: true,
    get value() { return LIZMANHEAD1____header_global_b066c3c64fe20da4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:592
export const LIZMANARM1____header_global_c34d983a8d57b455 = ((((((2205) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d0dad14fc909d03689a0bb6b() {
  return __cxx_static_address_d0dad14fc909d03689a0bb6b.reference || (__cxx_static_address_d0dad14fc909d03689a0bb6b.reference = {
    __cReference: true,
    get value() { return LIZMANARM1____header_global_c34d983a8d57b455; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:593
export const LIZMANLEG1____header_global_7f30f2b14cce8628 = ((((((2209) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8362a47abdbc2e88ad200fc5() {
  return __cxx_static_address_8362a47abdbc2e88ad200fc5.reference || (__cxx_static_address_8362a47abdbc2e88ad200fc5.reference = {
    __cReference: true,
    get value() { return LIZMANLEG1____header_global_7f30f2b14cce8628; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:594
export const EXPLOSION2BOT____header_global_1a94e30f1628590a = ((((((2219) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_63a2ccc73fd48d2cccd3f98d() {
  return __cxx_static_address_63a2ccc73fd48d2cccd3f98d.reference || (__cxx_static_address_63a2ccc73fd48d2cccd3f98d.reference = {
    __cReference: true,
    get value() { return EXPLOSION2BOT____header_global_1a94e30f1628590a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:595
export const JIBS1____header_global_0a42c09cbd60694b = ((((((2245) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4ec34b1bf0c29fa25af2c119() {
  return __cxx_static_address_4ec34b1bf0c29fa25af2c119.reference || (__cxx_static_address_4ec34b1bf0c29fa25af2c119.reference = {
    __cReference: true,
    get value() { return JIBS1____header_global_0a42c09cbd60694b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:596
export const JIBS2____header_global_713ae499c165e7c8 = ((((((2250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_106cd6d2ff017f284508c2c5() {
  return __cxx_static_address_106cd6d2ff017f284508c2c5.reference || (__cxx_static_address_106cd6d2ff017f284508c2c5.reference = {
    __cReference: true,
    get value() { return JIBS2____header_global_713ae499c165e7c8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:597
export const JIBS3____header_global_62bf5e8286ddd8c7 = ((((((2255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dfd59caeab099235d794995f() {
  return __cxx_static_address_dfd59caeab099235d794995f.reference || (__cxx_static_address_dfd59caeab099235d794995f.reference = {
    __cReference: true,
    get value() { return JIBS3____header_global_62bf5e8286ddd8c7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:598
export const JIBS4____header_global_deeebcd69343e987 = ((((((2260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_96c30309cfd264ac8ba83af0() {
  return __cxx_static_address_96c30309cfd264ac8ba83af0.reference || (__cxx_static_address_96c30309cfd264ac8ba83af0.reference = {
    __cReference: true,
    get value() { return JIBS4____header_global_deeebcd69343e987; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:599
export const JIBS5____header_global_65c15cd57cd9b86e = ((((((2265) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c7d8e0f1c2beebff06c268f8() {
  return __cxx_static_address_c7d8e0f1c2beebff06c268f8.reference || (__cxx_static_address_c7d8e0f1c2beebff06c268f8.reference = {
    __cReference: true,
    get value() { return JIBS5____header_global_65c15cd57cd9b86e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:600
export const BURNING____header_global_4a11f54b24c5a484 = ((((((2270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7a7a36f07b267b09e73d8093() {
  return __cxx_static_address_7a7a36f07b267b09e73d8093.reference || (__cxx_static_address_7a7a36f07b267b09e73d8093.reference = {
    __cReference: true,
    get value() { return BURNING____header_global_4a11f54b24c5a484; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:601
export const FIRE____header_global_f4f7f2582fe39306 = ((((((2271) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8842c6b581847441cb8584cf() {
  return __cxx_static_address_8842c6b581847441cb8584cf.reference || (__cxx_static_address_8842c6b581847441cb8584cf.reference = {
    __cReference: true,
    get value() { return FIRE____header_global_f4f7f2582fe39306; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:602
export const JIBS6____header_global_c0ff872b84e0b552 = ((((((2286) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b00f761f471b9aa31e01e18d() {
  return __cxx_static_address_b00f761f471b9aa31e01e18d.reference || (__cxx_static_address_b00f761f471b9aa31e01e18d.reference = {
    __cReference: true,
    get value() { return JIBS6____header_global_c0ff872b84e0b552; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:603
export const BLOODSPLAT1____header_global_2766806bc4e7d624 = ((((((2296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bccaa34b3fd96555b08dc7ff() {
  return __cxx_static_address_bccaa34b3fd96555b08dc7ff.reference || (__cxx_static_address_bccaa34b3fd96555b08dc7ff.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT1____header_global_2766806bc4e7d624; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:604
export const BLOODSPLAT3____header_global_a9c1d384c286fd23 = ((((((2297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ee5a4c1ff961b111a4d7fab3() {
  return __cxx_static_address_ee5a4c1ff961b111a4d7fab3.reference || (__cxx_static_address_ee5a4c1ff961b111a4d7fab3.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT3____header_global_a9c1d384c286fd23; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:605
export const BLOODSPLAT2____header_global_357316912a945d7e = ((((((2298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2c33b8100347718ce44286c5() {
  return __cxx_static_address_2c33b8100347718ce44286c5.reference || (__cxx_static_address_2c33b8100347718ce44286c5.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT2____header_global_357316912a945d7e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:606
export const BLOODSPLAT4____header_global_7ef53e228df0932b = ((((((2299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4cf6609611da9aa26af6d399() {
  return __cxx_static_address_4cf6609611da9aa26af6d399.reference || (__cxx_static_address_4cf6609611da9aa26af6d399.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT4____header_global_7ef53e228df0932b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:607
export const OOZ____header_global_9ff32df9b6d35cb7 = ((((((2300) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2b07bf11c31c943d57ba3ffe() {
  return __cxx_static_address_2b07bf11c31c943d57ba3ffe.reference || (__cxx_static_address_2b07bf11c31c943d57ba3ffe.reference = {
    __cReference: true,
    get value() { return OOZ____header_global_9ff32df9b6d35cb7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:608
export const OOZ2____header_global_7308291a9d964902 = ((((((2309) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8653d680fe327148e06f6908() {
  return __cxx_static_address_8653d680fe327148e06f6908.reference || (__cxx_static_address_8653d680fe327148e06f6908.reference = {
    __cReference: true,
    get value() { return OOZ2____header_global_7308291a9d964902; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:609
export const WALLBLOOD1____header_global_d125808d72ab3104 = ((((((2301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7a55456ce5e8c0ca2201ab2c() {
  return __cxx_static_address_7a55456ce5e8c0ca2201ab2c.reference || (__cxx_static_address_7a55456ce5e8c0ca2201ab2c.reference = {
    __cReference: true,
    get value() { return WALLBLOOD1____header_global_d125808d72ab3104; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:610
export const WALLBLOOD2____header_global_743606210b1f2958 = ((((((2302) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0433864c23455dab1bacfff1() {
  return __cxx_static_address_0433864c23455dab1bacfff1.reference || (__cxx_static_address_0433864c23455dab1bacfff1.reference = {
    __cReference: true,
    get value() { return WALLBLOOD2____header_global_743606210b1f2958; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:611
export const WALLBLOOD3____header_global_ad87503cc915405f = ((((((2303) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dfdfdb270a482ff2eb6ab73d() {
  return __cxx_static_address_dfdfdb270a482ff2eb6ab73d.reference || (__cxx_static_address_dfdfdb270a482ff2eb6ab73d.reference = {
    __cReference: true,
    get value() { return WALLBLOOD3____header_global_ad87503cc915405f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:612
export const WALLBLOOD4____header_global_aff2d60fc821d9de = ((((((2304) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_599bc12010f4863ebc2d2199() {
  return __cxx_static_address_599bc12010f4863ebc2d2199.reference || (__cxx_static_address_599bc12010f4863ebc2d2199.reference = {
    __cReference: true,
    get value() { return WALLBLOOD4____header_global_aff2d60fc821d9de; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:613
export const WALLBLOOD5____header_global_2c148ba57e805a0b = ((((((2305) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b8076d86687743ac608957a8() {
  return __cxx_static_address_b8076d86687743ac608957a8.reference || (__cxx_static_address_b8076d86687743ac608957a8.reference = {
    __cReference: true,
    get value() { return WALLBLOOD5____header_global_2c148ba57e805a0b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:614
export const WALLBLOOD7____header_global_2a0ffef726f1137b = ((((((2307) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_70496653d4ef82ba0857b1a4() {
  return __cxx_static_address_70496653d4ef82ba0857b1a4.reference || (__cxx_static_address_70496653d4ef82ba0857b1a4.reference = {
    __cReference: true,
    get value() { return WALLBLOOD7____header_global_2a0ffef726f1137b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:615
export const WALLBLOOD8____header_global_6767fb39dad0df9f = ((((((2308) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c81379e65ef893e9b202809f() {
  return __cxx_static_address_c81379e65ef893e9b202809f.reference || (__cxx_static_address_c81379e65ef893e9b202809f.reference = {
    __cReference: true,
    get value() { return WALLBLOOD8____header_global_6767fb39dad0df9f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:616
export const BURNING2____header_global_b1f41974cddfef20 = ((((((2310) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_78d92f3789c9bbf77e9a0bd7() {
  return __cxx_static_address_78d92f3789c9bbf77e9a0bd7.reference || (__cxx_static_address_78d92f3789c9bbf77e9a0bd7.reference = {
    __cReference: true,
    get value() { return BURNING2____header_global_b1f41974cddfef20; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:617
export const FIRE2____header_global_c90f7209e6157513 = ((((((2311) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fc170f8c9f66bf02ee4f046e() {
  return __cxx_static_address_fc170f8c9f66bf02ee4f046e.reference || (__cxx_static_address_fc170f8c9f66bf02ee4f046e.reference = {
    __cReference: true,
    get value() { return FIRE2____header_global_c90f7209e6157513; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:618
export const CRACKKNUCKLES____header_global_4a99d641f22c215d = ((((((2324) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_76fccdc6b6e5a9bf95b9d92a() {
  return __cxx_static_address_76fccdc6b6e5a9bf95b9d92a.reference || (__cxx_static_address_76fccdc6b6e5a9bf95b9d92a.reference = {
    __cReference: true,
    get value() { return CRACKKNUCKLES____header_global_4a99d641f22c215d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:619
export const SMALLSMOKE____header_global_819abf4e70bfaa0d = ((((((2329) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0a2d65693047fa78c0f7be03() {
  return __cxx_static_address_0a2d65693047fa78c0f7be03.reference || (__cxx_static_address_0a2d65693047fa78c0f7be03.reference = {
    __cReference: true,
    get value() { return SMALLSMOKE____header_global_819abf4e70bfaa0d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:620
export const FLOORFLAME____header_global_1236c52fe0005bfd = ((((((2333) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3c4f0e3b21cd902428c01fbe() {
  return __cxx_static_address_3c4f0e3b21cd902428c01fbe.reference || (__cxx_static_address_3c4f0e3b21cd902428c01fbe.reference = {
    __cReference: true,
    get value() { return FLOORFLAME____header_global_1236c52fe0005bfd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:621
export const ROTATEGUN____header_global_fa07226b62c776d1 = ((((((2360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cb6b60f30b81d69888013349() {
  return __cxx_static_address_cb6b60f30b81d69888013349.reference || (__cxx_static_address_cb6b60f30b81d69888013349.reference = {
    __cReference: true,
    get value() { return ROTATEGUN____header_global_fa07226b62c776d1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:622
export const GREENSLIME____header_global_f38968789c012aab = ((((((2370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bdf52e6ee353c2752b4f62be() {
  return __cxx_static_address_bdf52e6ee353c2752b4f62be.reference || (__cxx_static_address_bdf52e6ee353c2752b4f62be.reference = {
    __cReference: true,
    get value() { return GREENSLIME____header_global_f38968789c012aab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:623
export const WATERDRIPSPLASH____header_global_83d7f8cac3ee1a18 = ((((((2380) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5186d24a1d218dd634c954fd() {
  return __cxx_static_address_5186d24a1d218dd634c954fd.reference || (__cxx_static_address_5186d24a1d218dd634c954fd.reference = {
    __cReference: true,
    get value() { return WATERDRIPSPLASH____header_global_83d7f8cac3ee1a18; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:624
export const SCRAP6____header_global_8f1792d8343d4e78 = ((((((2390) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_48964a85a9fae686715680b7() {
  return __cxx_static_address_48964a85a9fae686715680b7.reference || (__cxx_static_address_48964a85a9fae686715680b7.reference = {
    __cReference: true,
    get value() { return SCRAP6____header_global_8f1792d8343d4e78; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:625
export const SCRAP1____header_global_f1807ed62ef712e1 = ((((((2400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_424fe03c071d9397f8577e5c() {
  return __cxx_static_address_424fe03c071d9397f8577e5c.reference || (__cxx_static_address_424fe03c071d9397f8577e5c.reference = {
    __cReference: true,
    get value() { return SCRAP1____header_global_f1807ed62ef712e1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:626
export const SCRAP2____header_global_e61817c6a48b9d7d = ((((((2404) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b86c82019e77fbe8be871c60() {
  return __cxx_static_address_b86c82019e77fbe8be871c60.reference || (__cxx_static_address_b86c82019e77fbe8be871c60.reference = {
    __cReference: true,
    get value() { return SCRAP2____header_global_e61817c6a48b9d7d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:627
export const SCRAP3____header_global_befc9d5a6f873e8e = ((((((2408) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_446f0c189e95102de55ab5da() {
  return __cxx_static_address_446f0c189e95102de55ab5da.reference || (__cxx_static_address_446f0c189e95102de55ab5da.reference = {
    __cReference: true,
    get value() { return SCRAP3____header_global_befc9d5a6f873e8e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:628
export const SCRAP4____header_global_9ac37c4e889848fa = ((((((2412) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1033e5752f807e0e320a64f7() {
  return __cxx_static_address_1033e5752f807e0e320a64f7.reference || (__cxx_static_address_1033e5752f807e0e320a64f7.reference = {
    __cReference: true,
    get value() { return SCRAP4____header_global_9ac37c4e889848fa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:629
export const SCRAP5____header_global_f1aa13ad0d8e68ac = ((((((2416) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4a535d3e8b33a2c714356158() {
  return __cxx_static_address_4a535d3e8b33a2c714356158.reference || (__cxx_static_address_4a535d3e8b33a2c714356158.reference = {
    __cReference: true,
    get value() { return SCRAP5____header_global_f1aa13ad0d8e68ac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:630
export const ORGANTIC____header_global_cd3121f0151cca5d = ((((((2420) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e831a2688e92fd105a68464() {
  return __cxx_static_address_1e831a2688e92fd105a68464.reference || (__cxx_static_address_1e831a2688e92fd105a68464.reference = {
    __cReference: true,
    get value() { return ORGANTIC____header_global_cd3121f0151cca5d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:631
export const BETAVERSION____header_global_8b5b344977518cf5 = ((((((2440) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4e60a3d0e7340648b82246a1() {
  return __cxx_static_address_4e60a3d0e7340648b82246a1.reference || (__cxx_static_address_4e60a3d0e7340648b82246a1.reference = {
    __cReference: true,
    get value() { return BETAVERSION____header_global_8b5b344977518cf5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:632
export const SELECTDIR____header_global_47ec707b5b7d9773 = ((((((2444) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_54cbe9832d97c83a86aa1888() {
  return __cxx_static_address_54cbe9832d97c83a86aa1888.reference || (__cxx_static_address_54cbe9832d97c83a86aa1888.reference = {
    __cReference: true,
    get value() { return SELECTDIR____header_global_47ec707b5b7d9773; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:633
export const F1HELP____header_global_0a7453fed4559a8a = ((((((2445) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e20a5ed0a05bc5f7935d4f55() {
  return __cxx_static_address_e20a5ed0a05bc5f7935d4f55.reference || (__cxx_static_address_e20a5ed0a05bc5f7935d4f55.reference = {
    __cReference: true,
    get value() { return F1HELP____header_global_0a7453fed4559a8a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:634
export const GROWSPARK____header_global_afaa395e72833e40 = ((((((2448) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a877ef2d865ae036d14299dc() {
  return __cxx_static_address_a877ef2d865ae036d14299dc.reference || (__cxx_static_address_a877ef2d865ae036d14299dc.reference = {
    __cReference: true,
    get value() { return GROWSPARK____header_global_afaa395e72833e40; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:635
export const MENUSCREEN____header_global_6ad7bc7098d6af9e = ((((((2456) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4dffc9f70815ec42cac30748() {
  return __cxx_static_address_4dffc9f70815ec42cac30748.reference || (__cxx_static_address_4dffc9f70815ec42cac30748.reference = {
    __cReference: true,
    get value() { return MENUSCREEN____header_global_6ad7bc7098d6af9e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:636
export const MENUBAR____header_global_f8cd2a0ca04c1ad8 = ((((((2457) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1750c8667b698b9206504d3d() {
  return __cxx_static_address_1750c8667b698b9206504d3d.reference || (__cxx_static_address_1750c8667b698b9206504d3d.reference = {
    __cReference: true,
    get value() { return MENUBAR____header_global_f8cd2a0ca04c1ad8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:637
export const KILLSICON____header_global_cb0572e1ffb7cfc7 = ((((((2458) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_157876889ed63db5a9a8b164() {
  return __cxx_static_address_157876889ed63db5a9a8b164.reference || (__cxx_static_address_157876889ed63db5a9a8b164.reference = {
    __cReference: true,
    get value() { return KILLSICON____header_global_cb0572e1ffb7cfc7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:638
export const FIRSTAID_ICON____header_global_7ad95d3a07c2bf9f = ((((((2460) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9f3aae8f8715e151a1a905c0() {
  return __cxx_static_address_9f3aae8f8715e151a1a905c0.reference || (__cxx_static_address_9f3aae8f8715e151a1a905c0.reference = {
    __cReference: true,
    get value() { return FIRSTAID_ICON____header_global_7ad95d3a07c2bf9f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:639
export const HEAT_ICON____header_global_9dca91938303a85f = ((((((2461) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6c8c134d623f3c09db34b4b3() {
  return __cxx_static_address_6c8c134d623f3c09db34b4b3.reference || (__cxx_static_address_6c8c134d623f3c09db34b4b3.reference = {
    __cReference: true,
    get value() { return HEAT_ICON____header_global_9dca91938303a85f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:640
export const BOTTOMSTATUSBAR____header_global_de0d1ceb6948c229 = ((((((2462) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cfbb5ea2fe6a18ca06ab5f87() {
  return __cxx_static_address_cfbb5ea2fe6a18ca06ab5f87.reference || (__cxx_static_address_cfbb5ea2fe6a18ca06ab5f87.reference = {
    __cReference: true,
    get value() { return BOTTOMSTATUSBAR____header_global_de0d1ceb6948c229; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:641
export const BOOT_ICON____header_global_8d9a60d9beac0646 = ((((((2463) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_83e920d387a3111cf4f3136b() {
  return __cxx_static_address_83e920d387a3111cf4f3136b.reference || (__cxx_static_address_83e920d387a3111cf4f3136b.reference = {
    __cReference: true,
    get value() { return BOOT_ICON____header_global_8d9a60d9beac0646; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:642
export const FRAGBAR____header_global_59b91bac14e915b7 = ((((((2465) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_600017d73f6164ae870438f0() {
  return __cxx_static_address_600017d73f6164ae870438f0.reference || (__cxx_static_address_600017d73f6164ae870438f0.reference = {
    __cReference: true,
    get value() { return FRAGBAR____header_global_59b91bac14e915b7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:643
export const JETPACK_ICON____header_global_d70a1705c32ecc0a = ((((((2467) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_815333ab924ecf98ecfbfaa7() {
  return __cxx_static_address_815333ab924ecf98ecfbfaa7.reference || (__cxx_static_address_815333ab924ecf98ecfbfaa7.reference = {
    __cReference: true,
    get value() { return JETPACK_ICON____header_global_d70a1705c32ecc0a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:644
export const AIRTANK_ICON____header_global_5660e584ac892ea0 = ((((((2468) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1f5a8531a67f91798b2abe40() {
  return __cxx_static_address_1f5a8531a67f91798b2abe40.reference || (__cxx_static_address_1f5a8531a67f91798b2abe40.reference = {
    __cReference: true,
    get value() { return AIRTANK_ICON____header_global_5660e584ac892ea0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:645
export const STEROIDS_ICON____header_global_222649a93a8b6e1f = ((((((2469) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6d049ee21445f326af6ae463() {
  return __cxx_static_address_6d049ee21445f326af6ae463.reference || (__cxx_static_address_6d049ee21445f326af6ae463.reference = {
    __cReference: true,
    get value() { return STEROIDS_ICON____header_global_222649a93a8b6e1f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:646
export const HOLODUKE_ICON____header_global_e6d5c2cd9f5b6798 = ((((((2470) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0ebea964278ee6936cf3f478() {
  return __cxx_static_address_0ebea964278ee6936cf3f478.reference || (__cxx_static_address_0ebea964278ee6936cf3f478.reference = {
    __cReference: true,
    get value() { return HOLODUKE_ICON____header_global_e6d5c2cd9f5b6798; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:647
export const ACCESS_ICON____header_global_36dcd8499d5f871e = ((((((2471) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d58be8182ad817e2a5b6baf9() {
  return __cxx_static_address_d58be8182ad817e2a5b6baf9.reference || (__cxx_static_address_d58be8182ad817e2a5b6baf9.reference = {
    __cReference: true,
    get value() { return ACCESS_ICON____header_global_36dcd8499d5f871e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:648
export const DIGITALNUM____header_global_c8f7a8222d175a37 = ((((((2472) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_21c31331aa1736b404b5d504() {
  return __cxx_static_address_21c31331aa1736b404b5d504.reference || (__cxx_static_address_21c31331aa1736b404b5d504.reference = {
    __cReference: true,
    get value() { return DIGITALNUM____header_global_c8f7a8222d175a37; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:649
export const DUKECAR____header_global_a2713ad55556b156 = ((((((2491) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_94f343c9d46022ec6b3c3be9() {
  return __cxx_static_address_94f343c9d46022ec6b3c3be9.reference || (__cxx_static_address_94f343c9d46022ec6b3c3be9.reference = {
    __cReference: true,
    get value() { return DUKECAR____header_global_a2713ad55556b156; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:650
export const CAMCORNER____header_global_ed173d8453650c40 = ((((((2482) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_034a001e4030ae1bb5c8b75f() {
  return __cxx_static_address_034a001e4030ae1bb5c8b75f.reference || (__cxx_static_address_034a001e4030ae1bb5c8b75f.reference = {
    __cReference: true,
    get value() { return CAMCORNER____header_global_ed173d8453650c40; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:651
export const CAMLIGHT____header_global_dc06c6c2cb43e3a7 = ((((((2484) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8484e8986fc182e8d04a8742() {
  return __cxx_static_address_8484e8986fc182e8d04a8742.reference || (__cxx_static_address_8484e8986fc182e8d04a8742.reference = {
    __cReference: true,
    get value() { return CAMLIGHT____header_global_dc06c6c2cb43e3a7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:652
export const SLIDEBAR____header_global_416674626302da6c = ((((((2489) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dd96cadbf90de424bb42ae21() {
  return __cxx_static_address_dd96cadbf90de424bb42ae21.reference || (__cxx_static_address_dd96cadbf90de424bb42ae21.reference = {
    __cReference: true,
    get value() { return SLIDEBAR____header_global_416674626302da6c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:653
export const DREALMS____header_global_e3a96fa3d68138f9 = ((((((2492) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c4219e9f87c99bbb62866d6e() {
  return __cxx_static_address_c4219e9f87c99bbb62866d6e.reference || (__cxx_static_address_c4219e9f87c99bbb62866d6e.reference = {
    __cReference: true,
    get value() { return DREALMS____header_global_e3a96fa3d68138f9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:654
export const BETASCREEN____header_global_209ec1b012c19197 = ((((((2493) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0ab13313c5aa73c9b162318b() {
  return __cxx_static_address_0ab13313c5aa73c9b162318b.reference || (__cxx_static_address_0ab13313c5aa73c9b162318b.reference = {
    __cReference: true,
    get value() { return BETASCREEN____header_global_209ec1b012c19197; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:655
export const WINDOWBORDER1____header_global_c1841c8c4eac221f = ((((((2494) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a46b5683cb0d8196c86b9776() {
  return __cxx_static_address_a46b5683cb0d8196c86b9776.reference || (__cxx_static_address_a46b5683cb0d8196c86b9776.reference = {
    __cReference: true,
    get value() { return WINDOWBORDER1____header_global_c1841c8c4eac221f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:656
export const TEXTBOX____header_global_f03e0d7cb1fa2652 = ((((((2495) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ed38aeacb92e6c87f6569d4c() {
  return __cxx_static_address_ed38aeacb92e6c87f6569d4c.reference || (__cxx_static_address_ed38aeacb92e6c87f6569d4c.reference = {
    __cReference: true,
    get value() { return TEXTBOX____header_global_f03e0d7cb1fa2652; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:657
export const WINDOWBORDER2____header_global_2e99699f9487ce1f = ((((((2496) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_761bc01da04a17835407a282() {
  return __cxx_static_address_761bc01da04a17835407a282.reference || (__cxx_static_address_761bc01da04a17835407a282.reference = {
    __cReference: true,
    get value() { return WINDOWBORDER2____header_global_2e99699f9487ce1f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:658
export const DUKENUKEM____header_global_82e609aaf3a84b16 = ((((((2497) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_63d04233ebc73205df83c409() {
  return __cxx_static_address_63d04233ebc73205df83c409.reference || (__cxx_static_address_63d04233ebc73205df83c409.reference = {
    __cReference: true,
    get value() { return DUKENUKEM____header_global_82e609aaf3a84b16; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:659
export const THREEDEE____header_global_8d2188fd5a8fd09a = ((((((2498) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f47f0c76aca6869108c1893e() {
  return __cxx_static_address_f47f0c76aca6869108c1893e.reference || (__cxx_static_address_f47f0c76aca6869108c1893e.reference = {
    __cReference: true,
    get value() { return THREEDEE____header_global_8d2188fd5a8fd09a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:660
export const INGAMEDUKETHREEDEE____header_global_b77f002d2a0a9db8 = ((((((2499) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5a78585a440833c7a258dd85() {
  return __cxx_static_address_5a78585a440833c7a258dd85.reference || (__cxx_static_address_5a78585a440833c7a258dd85.reference = {
    __cReference: true,
    get value() { return INGAMEDUKETHREEDEE____header_global_b77f002d2a0a9db8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:661
export const TENSCREEN____header_global_0041cb33fc1c0945 = ((((((2500) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2f40495663f1d128f23b0fd8() {
  return __cxx_static_address_2f40495663f1d128f23b0fd8.reference || (__cxx_static_address_2f40495663f1d128f23b0fd8.reference = {
    __cReference: true,
    get value() { return TENSCREEN____header_global_0041cb33fc1c0945; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:662
export const PLUTOPAKSPRITE____header_global_58215c887fab8c88 = ((((((2501) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_29a144df03b471cf47ee7b38() {
  return __cxx_static_address_29a144df03b471cf47ee7b38.reference || (__cxx_static_address_29a144df03b471cf47ee7b38.reference = {
    __cReference: true,
    get value() { return PLUTOPAKSPRITE____header_global_58215c887fab8c88; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:663
export const DEVISTATOR____header_global_d7f81a37fe072133 = ((((((2510) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_153ff0747a3bfd2960369c28() {
  return __cxx_static_address_153ff0747a3bfd2960369c28.reference || (__cxx_static_address_153ff0747a3bfd2960369c28.reference = {
    __cReference: true,
    get value() { return DEVISTATOR____header_global_d7f81a37fe072133; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:664
export const KNEE____header_global_0f532371741b63b0 = ((((((2521) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0cba5a60fb195805ac6d1ce5() {
  return __cxx_static_address_0cba5a60fb195805ac6d1ce5.reference || (__cxx_static_address_0cba5a60fb195805ac6d1ce5.reference = {
    __cReference: true,
    get value() { return KNEE____header_global_0f532371741b63b0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:665
export const CROSSHAIR____header_global_e52af7fc7eea43a2 = ((((((2523) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ef7c3028d27b2df91662ae91() {
  return __cxx_static_address_ef7c3028d27b2df91662ae91.reference || (__cxx_static_address_ef7c3028d27b2df91662ae91.reference = {
    __cReference: true,
    get value() { return CROSSHAIR____header_global_e52af7fc7eea43a2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:666
export const FIRSTGUN____header_global_ed56723a653a40dc = ((((((2524) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a6cf61f9e3ba765d8984a361() {
  return __cxx_static_address_a6cf61f9e3ba765d8984a361.reference || (__cxx_static_address_a6cf61f9e3ba765d8984a361.reference = {
    __cReference: true,
    get value() { return FIRSTGUN____header_global_ed56723a653a40dc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:667
export const FIRSTGUNRELOAD____header_global_5c42bf949675ed5e = ((((((2528) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_668060831ed1169b5cf4ec37() {
  return __cxx_static_address_668060831ed1169b5cf4ec37.reference || (__cxx_static_address_668060831ed1169b5cf4ec37.reference = {
    __cReference: true,
    get value() { return FIRSTGUNRELOAD____header_global_5c42bf949675ed5e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:668
export const SHELL____header_global_45b870849cdf16c3 = ((((((2533) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a841d21128115d525ce17ac0() {
  return __cxx_static_address_a841d21128115d525ce17ac0.reference || (__cxx_static_address_a841d21128115d525ce17ac0.reference = {
    __cReference: true,
    get value() { return SHELL____header_global_45b870849cdf16c3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:669
export const SHOTGUNSHELL____header_global_30ae93ccb51f209d = ((((((2535) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_48073b7127fa8b7960cd225f() {
  return __cxx_static_address_48073b7127fa8b7960cd225f.reference || (__cxx_static_address_48073b7127fa8b7960cd225f.reference = {
    __cReference: true,
    get value() { return SHOTGUNSHELL____header_global_30ae93ccb51f209d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:670
export const CHAINGUN____header_global_3cd13d0c1f4cbc23 = ((((((2536) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5d5f4dbcf44ca55fa5e0d1ed() {
  return __cxx_static_address_5d5f4dbcf44ca55fa5e0d1ed.reference || (__cxx_static_address_5d5f4dbcf44ca55fa5e0d1ed.reference = {
    __cReference: true,
    get value() { return CHAINGUN____header_global_3cd13d0c1f4cbc23; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:671
export const RPGGUN____header_global_6ce476757d86d3cb = ((((((2544) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2a78184f7c429cb0055d9d51() {
  return __cxx_static_address_2a78184f7c429cb0055d9d51.reference || (__cxx_static_address_2a78184f7c429cb0055d9d51.reference = {
    __cReference: true,
    get value() { return RPGGUN____header_global_6ce476757d86d3cb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:672
export const FREEZE____header_global_ffd524aaeb893e09 = ((((((2548) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7596403e27332aec570c0aa2() {
  return __cxx_static_address_7596403e27332aec570c0aa2.reference || (__cxx_static_address_7596403e27332aec570c0aa2.reference = {
    __cReference: true,
    get value() { return FREEZE____header_global_ffd524aaeb893e09; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:673
export const SHRINKER____header_global_aaff637311d68273 = ((((((2556) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_53e985996f163569d290a53f() {
  return __cxx_static_address_53e985996f163569d290a53f.reference || (__cxx_static_address_53e985996f163569d290a53f.reference = {
    __cReference: true,
    get value() { return SHRINKER____header_global_aaff637311d68273; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:674
export const HANDHOLDINGLASER____header_global_d6155af43d56d32a = ((((((2563) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a840e5f71dea7ccf16cf902d() {
  return __cxx_static_address_a840e5f71dea7ccf16cf902d.reference || (__cxx_static_address_a840e5f71dea7ccf16cf902d.reference = {
    __cReference: true,
    get value() { return HANDHOLDINGLASER____header_global_d6155af43d56d32a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:675
export const TRIPBOMB____header_global_1c4b818e9fd3dcb5 = ((((((2566) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_70e34dc848982b6ab8bb3148() {
  return __cxx_static_address_70e34dc848982b6ab8bb3148.reference || (__cxx_static_address_70e34dc848982b6ab8bb3148.reference = {
    __cReference: true,
    get value() { return TRIPBOMB____header_global_1c4b818e9fd3dcb5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:676
export const LASERLINE____header_global_b0f5768071d52e86 = ((((((2567) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9205217b087694a4b3ed6182() {
  return __cxx_static_address_9205217b087694a4b3ed6182.reference || (__cxx_static_address_9205217b087694a4b3ed6182.reference = {
    __cReference: true,
    get value() { return LASERLINE____header_global_b0f5768071d52e86; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:677
export const HANDHOLDINGACCESS____header_global_bbe2dc618b29de57 = ((((((2568) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b07ab9613013882965d2ba06() {
  return __cxx_static_address_b07ab9613013882965d2ba06.reference || (__cxx_static_address_b07ab9613013882965d2ba06.reference = {
    __cReference: true,
    get value() { return HANDHOLDINGACCESS____header_global_bbe2dc618b29de57; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:678
export const HANDREMOTE____header_global_695e9ace788c0f50 = ((((((2570) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_134fd395d5364816730c344b() {
  return __cxx_static_address_134fd395d5364816730c344b.reference || (__cxx_static_address_134fd395d5364816730c344b.reference = {
    __cReference: true,
    get value() { return HANDREMOTE____header_global_695e9ace788c0f50; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:679
export const HANDTHROW____header_global_d181c4793240f60a = ((((((2573) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ca2359d44630af6e75f43d35() {
  return __cxx_static_address_ca2359d44630af6e75f43d35.reference || (__cxx_static_address_ca2359d44630af6e75f43d35.reference = {
    __cReference: true,
    get value() { return HANDTHROW____header_global_d181c4793240f60a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:680
export const TIP____header_global_32d04c0b4619cbc9 = ((((((2576) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c8fbd4dea6b79bdc6c11ddd8() {
  return __cxx_static_address_c8fbd4dea6b79bdc6c11ddd8.reference || (__cxx_static_address_c8fbd4dea6b79bdc6c11ddd8.reference = {
    __cReference: true,
    get value() { return TIP____header_global_32d04c0b4619cbc9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:681
export const SCUBAMASK____header_global_0b194340df0fce93 = ((((((2581) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ff379df08c65c7571268caf4() {
  return __cxx_static_address_ff379df08c65c7571268caf4.reference || (__cxx_static_address_ff379df08c65c7571268caf4.reference = {
    __cReference: true,
    get value() { return SCUBAMASK____header_global_0b194340df0fce93; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:682
export const FORCESPHERE____header_global_85c8e6bcc67e2b37 = ((((((2590) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9be07366e9fa3be0c4901281() {
  return __cxx_static_address_9be07366e9fa3be0c4901281.reference || (__cxx_static_address_9be07366e9fa3be0c4901281.reference = {
    __cReference: true,
    get value() { return FORCESPHERE____header_global_85c8e6bcc67e2b37; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:683
export const SHOTSPARK1____header_global_5bb9217b7dbeda75 = ((((((2595) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_303fc49f2d69153f9e15364e() {
  return __cxx_static_address_303fc49f2d69153f9e15364e.reference || (__cxx_static_address_303fc49f2d69153f9e15364e.reference = {
    __cReference: true,
    get value() { return SHOTSPARK1____header_global_5bb9217b7dbeda75; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:684
export const RPG____header_global_0c07b407ffd56d18 = ((((((2605) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f8f1ff59716b7b891e8c190d() {
  return __cxx_static_address_f8f1ff59716b7b891e8c190d.reference || (__cxx_static_address_f8f1ff59716b7b891e8c190d.reference = {
    __cReference: true,
    get value() { return RPG____header_global_0c07b407ffd56d18; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:685
export const LASERSITE____header_global_e5292d406513676b = ((((((2612) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3a37e9583b3afae3a161dbf1() {
  return __cxx_static_address_3a37e9583b3afae3a161dbf1.reference || (__cxx_static_address_3a37e9583b3afae3a161dbf1.reference = {
    __cReference: true,
    get value() { return LASERSITE____header_global_e5292d406513676b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:686
export const SHOTGUN____header_global_36856aa8b5688b2f = ((((((2613) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2af7ef3353385a640cf13b5d() {
  return __cxx_static_address_2af7ef3353385a640cf13b5d.reference || (__cxx_static_address_2af7ef3353385a640cf13b5d.reference = {
    __cReference: true,
    get value() { return SHOTGUN____header_global_36856aa8b5688b2f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:687
export const BOSS1____header_global_dc5cf2a20aaa1fd2 = ((((((2630) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e6005105333cb10de90489e9() {
  return __cxx_static_address_e6005105333cb10de90489e9.reference || (__cxx_static_address_e6005105333cb10de90489e9.reference = {
    __cReference: true,
    get value() { return BOSS1____header_global_dc5cf2a20aaa1fd2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:688
export const BOSS1STAYPUT____header_global_292c7b26f4257d7d = ((((((2631) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5663eee969f78c2ab3a817fc() {
  return __cxx_static_address_5663eee969f78c2ab3a817fc.reference || (__cxx_static_address_5663eee969f78c2ab3a817fc.reference = {
    __cReference: true,
    get value() { return BOSS1STAYPUT____header_global_292c7b26f4257d7d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:689
export const BOSS1SHOOT____header_global_7eabb258dca93499 = ((((((2660) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ee5af1702200b519f5b525eb() {
  return __cxx_static_address_ee5af1702200b519f5b525eb.reference || (__cxx_static_address_ee5af1702200b519f5b525eb.reference = {
    __cReference: true,
    get value() { return BOSS1SHOOT____header_global_7eabb258dca93499; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:690
export const BOSS1LOB____header_global_8fcab91c544a734b = ((((((2670) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e0a85a5b954d78a3aae89570() {
  return __cxx_static_address_e0a85a5b954d78a3aae89570.reference || (__cxx_static_address_e0a85a5b954d78a3aae89570.reference = {
    __cReference: true,
    get value() { return BOSS1LOB____header_global_8fcab91c544a734b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:691
export const BOSSTOP____header_global_9589509c3dbd4b1a = ((((((2696) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3164c7e8333bc13fb698821b() {
  return __cxx_static_address_3164c7e8333bc13fb698821b.reference || (__cxx_static_address_3164c7e8333bc13fb698821b.reference = {
    __cReference: true,
    get value() { return BOSSTOP____header_global_9589509c3dbd4b1a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:692
export const BOSS2____header_global_9aa19d2826b89634 = ((((((2710) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8172221fb9fad3e1b3ec968e() {
  return __cxx_static_address_8172221fb9fad3e1b3ec968e.reference || (__cxx_static_address_8172221fb9fad3e1b3ec968e.reference = {
    __cReference: true,
    get value() { return BOSS2____header_global_9aa19d2826b89634; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:693
export const BOSS3____header_global_9b91db5722d341e4 = ((((((2760) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9b87819425353e443f46850c() {
  return __cxx_static_address_9b87819425353e443f46850c.reference || (__cxx_static_address_9b87819425353e443f46850c.reference = {
    __cReference: true,
    get value() { return BOSS3____header_global_9b91db5722d341e4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:694
export const SPINNINGNUKEICON____header_global_f2d859a0273f9957 = ((((((2813) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9f58c0eb8df263fe2d9d86d0() {
  return __cxx_static_address_9f58c0eb8df263fe2d9d86d0.reference || (__cxx_static_address_9f58c0eb8df263fe2d9d86d0.reference = {
    __cReference: true,
    get value() { return SPINNINGNUKEICON____header_global_f2d859a0273f9957; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:695
export const SMALLFNTCURSOR____header_global_e5607eb95215bb19 = ((((((2821) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7875ae9086040649abef3974() {
  return __cxx_static_address_7875ae9086040649abef3974.reference || (__cxx_static_address_7875ae9086040649abef3974.reference = {
    __cReference: true,
    get value() { return SMALLFNTCURSOR____header_global_e5607eb95215bb19; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:696
export const STARTALPHANUM____header_global_40413617b96c3b60 = ((((((2822) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a0e937ed54906dd324110446() {
  return __cxx_static_address_a0e937ed54906dd324110446.reference || (__cxx_static_address_a0e937ed54906dd324110446.reference = {
    __cReference: true,
    get value() { return STARTALPHANUM____header_global_40413617b96c3b60; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:697
export const ENDALPHANUM____header_global_4491598e6cc7b95b = ((((((2915) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f86d626e7ad432ab7d5d3e9b() {
  return __cxx_static_address_f86d626e7ad432ab7d5d3e9b.reference || (__cxx_static_address_f86d626e7ad432ab7d5d3e9b.reference = {
    __cReference: true,
    get value() { return ENDALPHANUM____header_global_4491598e6cc7b95b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:698
export const BIGALPHANUM____header_global_27c80be5fc4b37cc = ((((((2940) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_58ecb2438c7af9947546e8db() {
  return __cxx_static_address_58ecb2438c7af9947546e8db.reference || (__cxx_static_address_58ecb2438c7af9947546e8db.reference = {
    __cReference: true,
    get value() { return BIGALPHANUM____header_global_27c80be5fc4b37cc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:699
export const BIGPERIOD____header_global_8ebfc0e02f7c0313 = ((((((3002) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_66a585908a5501ec98b4d604() {
  return __cxx_static_address_66a585908a5501ec98b4d604.reference || (__cxx_static_address_66a585908a5501ec98b4d604.reference = {
    __cReference: true,
    get value() { return BIGPERIOD____header_global_8ebfc0e02f7c0313; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:700
export const BIGCOMMA____header_global_fb6dd18e9f93db0c = ((((((3003) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ccb6e03c6520c72ce306f372() {
  return __cxx_static_address_ccb6e03c6520c72ce306f372.reference || (__cxx_static_address_ccb6e03c6520c72ce306f372.reference = {
    __cReference: true,
    get value() { return BIGCOMMA____header_global_fb6dd18e9f93db0c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:701
export const BIGX____header_global_313fdff2274526a2 = ((((((3004) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3cbc74a94d45e75e767306b1() {
  return __cxx_static_address_3cbc74a94d45e75e767306b1.reference || (__cxx_static_address_3cbc74a94d45e75e767306b1.reference = {
    __cReference: true,
    get value() { return BIGX____header_global_313fdff2274526a2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:702
export const BIGQ____header_global_142020f1f543e825 = ((((((3005) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7fd47d20cfdd96837e1e2bc7() {
  return __cxx_static_address_7fd47d20cfdd96837e1e2bc7.reference || (__cxx_static_address_7fd47d20cfdd96837e1e2bc7.reference = {
    __cReference: true,
    get value() { return BIGQ____header_global_142020f1f543e825; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:703
export const BIGSEMI____header_global_600ffb2932f4aff9 = ((((((3006) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0a406f032da64b4f80dca7e0() {
  return __cxx_static_address_0a406f032da64b4f80dca7e0.reference || (__cxx_static_address_0a406f032da64b4f80dca7e0.reference = {
    __cReference: true,
    get value() { return BIGSEMI____header_global_600ffb2932f4aff9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:704
export const BIGCOLIN____header_global_95f3751567039205 = ((((((3007) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_214ecf59df85c1f59c056eb2() {
  return __cxx_static_address_214ecf59df85c1f59c056eb2.reference || (__cxx_static_address_214ecf59df85c1f59c056eb2.reference = {
    __cReference: true,
    get value() { return BIGCOLIN____header_global_95f3751567039205; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:705
export const THREEBYFIVE____header_global_014e3411b1dd669a = ((((((3010) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f8206f621becb756f060f1f4() {
  return __cxx_static_address_f8206f621becb756f060f1f4.reference || (__cxx_static_address_f8206f621becb756f060f1f4.reference = {
    __cReference: true,
    get value() { return THREEBYFIVE____header_global_014e3411b1dd669a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:706
export const BIGAPPOS____header_global_39b44b1b9d32ebbe = ((((((3022) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2d004bbbbbab851aec62e41e() {
  return __cxx_static_address_2d004bbbbbab851aec62e41e.reference || (__cxx_static_address_2d004bbbbbab851aec62e41e.reference = {
    __cReference: true,
    get value() { return BIGAPPOS____header_global_39b44b1b9d32ebbe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:707
export const MINIFONT____header_global_dbd7674fed2b1855 = ((((((3072) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4a53eafce8a6c147410f1216() {
  return __cxx_static_address_4a53eafce8a6c147410f1216.reference || (__cxx_static_address_4a53eafce8a6c147410f1216.reference = {
    __cReference: true,
    get value() { return MINIFONT____header_global_dbd7674fed2b1855; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:708
export const RESPAWNMARKERRED____header_global_d4daf827c6cc7e42 = ((((((3190) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4bcec5afd723736057508bc1() {
  return __cxx_static_address_4bcec5afd723736057508bc1.reference || (__cxx_static_address_4bcec5afd723736057508bc1.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERRED____header_global_d4daf827c6cc7e42; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:709
export const RESPAWNMARKERYELLOW____header_global_bde504bdaf267b38 = ((((((3200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c9c64c1cfc1f1dcc387474e0() {
  return __cxx_static_address_c9c64c1cfc1f1dcc387474e0.reference || (__cxx_static_address_c9c64c1cfc1f1dcc387474e0.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERYELLOW____header_global_bde504bdaf267b38; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:710
export const RESPAWNMARKERGREEN____header_global_84c6c5e914a71952 = ((((((3210) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f5ae68708a44ff777bdbc21e() {
  return __cxx_static_address_f5ae68708a44ff777bdbc21e.reference || (__cxx_static_address_f5ae68708a44ff777bdbc21e.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERGREEN____header_global_84c6c5e914a71952; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:711
export const BONUSSCREEN____header_global_05585a1fd114ed4c = ((((((3240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4cc8acc083b124ce2fc65f67() {
  return __cxx_static_address_4cc8acc083b124ce2fc65f67.reference || (__cxx_static_address_4cc8acc083b124ce2fc65f67.reference = {
    __cReference: true,
    get value() { return BONUSSCREEN____header_global_05585a1fd114ed4c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:712
export const VIEWBORDER____header_global_0eae98d5b679eec4 = ((((((3250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_995c91cb0703fde0ff4fcb80() {
  return __cxx_static_address_995c91cb0703fde0ff4fcb80.reference || (__cxx_static_address_995c91cb0703fde0ff4fcb80.reference = {
    __cReference: true,
    get value() { return VIEWBORDER____header_global_0eae98d5b679eec4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:713
export const VICTORY1____header_global_4f14522cba41bd33 = ((((((3260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_860cd4bd70ba91fdebde46f0() {
  return __cxx_static_address_860cd4bd70ba91fdebde46f0.reference || (__cxx_static_address_860cd4bd70ba91fdebde46f0.reference = {
    __cReference: true,
    get value() { return VICTORY1____header_global_4f14522cba41bd33; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:714
export const ORDERING____header_global_d87fb248540da6a3 = ((((((3270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0992e0b2711c7f4e560bb40b() {
  return __cxx_static_address_0992e0b2711c7f4e560bb40b.reference || (__cxx_static_address_0992e0b2711c7f4e560bb40b.reference = {
    __cReference: true,
    get value() { return ORDERING____header_global_d87fb248540da6a3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:715
export const TEXTSTORY____header_global_a16a8e5249c18da6 = ((((((3280) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a0fdb6992828bc7d4d3d7358() {
  return __cxx_static_address_a0fdb6992828bc7d4d3d7358.reference || (__cxx_static_address_a0fdb6992828bc7d4d3d7358.reference = {
    __cReference: true,
    get value() { return TEXTSTORY____header_global_a16a8e5249c18da6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:716
export const LOADSCREEN____header_global_4a5d288e5793b2d8 = ((((((3281) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_45cc9af49995f73cd6870d3f() {
  return __cxx_static_address_45cc9af49995f73cd6870d3f.reference || (__cxx_static_address_45cc9af49995f73cd6870d3f.reference = {
    __cReference: true,
    get value() { return LOADSCREEN____header_global_4a5d288e5793b2d8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:717
export const BORNTOBEWILDSCREEN____header_global_005e6c451c74c586 = ((((((3370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1451b65fb274dd4703c07e10() {
  return __cxx_static_address_1451b65fb274dd4703c07e10.reference || (__cxx_static_address_1451b65fb274dd4703c07e10.reference = {
    __cReference: true,
    get value() { return BORNTOBEWILDSCREEN____header_global_005e6c451c74c586; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:718
export const BLIMP____header_global_e65a99ec2450b76f = ((((((3400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_65113552543c9e5f62b36fe9() {
  return __cxx_static_address_65113552543c9e5f62b36fe9.reference || (__cxx_static_address_65113552543c9e5f62b36fe9.reference = {
    __cReference: true,
    get value() { return BLIMP____header_global_e65a99ec2450b76f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:719
export const FEM9____header_global_cfaed702f695d00c = ((((((3450) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9868b8638999ab3e74f787d4() {
  return __cxx_static_address_9868b8638999ab3e74f787d4.reference || (__cxx_static_address_9868b8638999ab3e74f787d4.reference = {
    __cReference: true,
    get value() { return FEM9____header_global_cfaed702f695d00c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:720
export const FRAMEEFFECT1_13____header_global_62fcfa334bffdbf6 = ((((((3999) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_23afd00d738f69f0bdf7b1f6() {
  return __cxx_static_address_23afd00d738f69f0bdf7b1f6.reference || (__cxx_static_address_23afd00d738f69f0bdf7b1f6.reference = {
    __cReference: true,
    get value() { return FRAMEEFFECT1_13____header_global_62fcfa334bffdbf6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:721
export const FRAMEEFFECT1____header_global_1c09688e1f2c402d = ((((((4095) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_220b1d2ac2c82f475db2c714() {
  return __cxx_static_address_220b1d2ac2c82f475db2c714.reference || (__cxx_static_address_220b1d2ac2c82f475db2c714.reference = {
    __cReference: true,
    get value() { return FRAMEEFFECT1____header_global_1c09688e1f2c402d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:722
export const PANNEL3____header_global_a16eab3ccb31e848 = ((((((4099) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8e61f52b54a9d672396bfc63() {
  return __cxx_static_address_8e61f52b54a9d672396bfc63.reference || (__cxx_static_address_8e61f52b54a9d672396bfc63.reference = {
    __cReference: true,
    get value() { return PANNEL3____header_global_a16eab3ccb31e848; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:723
export const SCREENBREAK14____header_global_d954efccc8938e55 = ((((((4120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a2ef256a31924ffffda88493() {
  return __cxx_static_address_a2ef256a31924ffffda88493.reference || (__cxx_static_address_a2ef256a31924ffffda88493.reference = {
    __cReference: true,
    get value() { return SCREENBREAK14____header_global_d954efccc8938e55; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:724
export const SCREENBREAK15____header_global_b1b7020637f62399 = ((((((4123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_75c409d68f6c847216dffcce() {
  return __cxx_static_address_75c409d68f6c847216dffcce.reference || (__cxx_static_address_75c409d68f6c847216dffcce.reference = {
    __cReference: true,
    get value() { return SCREENBREAK15____header_global_b1b7020637f62399; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:725
export const SCREENBREAK19____header_global_f2ddc981c0fdfa20 = ((((((4125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7d94cc8a66ddc3e2521e61f9() {
  return __cxx_static_address_7d94cc8a66ddc3e2521e61f9.reference || (__cxx_static_address_7d94cc8a66ddc3e2521e61f9.reference = {
    __cReference: true,
    get value() { return SCREENBREAK19____header_global_f2ddc981c0fdfa20; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:726
export const SCREENBREAK16____header_global_a42b96b0ab1a4a94 = ((((((4127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_63589eb8311162ffc3f7cdb7() {
  return __cxx_static_address_63589eb8311162ffc3f7cdb7.reference || (__cxx_static_address_63589eb8311162ffc3f7cdb7.reference = {
    __cReference: true,
    get value() { return SCREENBREAK16____header_global_a42b96b0ab1a4a94; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:727
export const SCREENBREAK17____header_global_c9e7e70342e1e160 = ((((((4128) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f7bdc11562cc06d44eee887a() {
  return __cxx_static_address_f7bdc11562cc06d44eee887a.reference || (__cxx_static_address_f7bdc11562cc06d44eee887a.reference = {
    __cReference: true,
    get value() { return SCREENBREAK17____header_global_c9e7e70342e1e160; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:728
export const SCREENBREAK18____header_global_2fae58a9b58e9998 = ((((((4129) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c9c8c04291c4170e00d4df78() {
  return __cxx_static_address_c9c8c04291c4170e00d4df78.reference || (__cxx_static_address_c9c8c04291c4170e00d4df78.reference = {
    __cReference: true,
    get value() { return SCREENBREAK18____header_global_2fae58a9b58e9998; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:729
export const W_TECHWALL11____header_global_ff6d484a2693d77a = ((((((4130) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_252191a1f8f24793ec17c824() {
  return __cxx_static_address_252191a1f8f24793ec17c824.reference || (__cxx_static_address_252191a1f8f24793ec17c824.reference = {
    __cReference: true,
    get value() { return W_TECHWALL11____header_global_ff6d484a2693d77a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:730
export const W_TECHWALL12____header_global_e67c63bf109ab763 = ((((((4131) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_13edd9783c0fd19b8c7cc8ba() {
  return __cxx_static_address_13edd9783c0fd19b8c7cc8ba.reference || (__cxx_static_address_13edd9783c0fd19b8c7cc8ba.reference = {
    __cReference: true,
    get value() { return W_TECHWALL12____header_global_e67c63bf109ab763; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:731
export const W_TECHWALL13____header_global_4234b4f3039585e7 = ((((((4132) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e95ecf78f4746fe434e87c01() {
  return __cxx_static_address_e95ecf78f4746fe434e87c01.reference || (__cxx_static_address_e95ecf78f4746fe434e87c01.reference = {
    __cReference: true,
    get value() { return W_TECHWALL13____header_global_4234b4f3039585e7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:732
export const W_TECHWALL14____header_global_9a314e6d8379e017 = ((((((4133) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_13767c9e5bd292f2754bf780() {
  return __cxx_static_address_13767c9e5bd292f2754bf780.reference || (__cxx_static_address_13767c9e5bd292f2754bf780.reference = {
    __cReference: true,
    get value() { return W_TECHWALL14____header_global_9a314e6d8379e017; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:733
export const W_TECHWALL5____header_global_3b93655f97f65640 = ((((((4134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2c931423159c5ad654f7012d() {
  return __cxx_static_address_2c931423159c5ad654f7012d.reference || (__cxx_static_address_2c931423159c5ad654f7012d.reference = {
    __cReference: true,
    get value() { return W_TECHWALL5____header_global_3b93655f97f65640; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:734
export const W_TECHWALL6____header_global_45efd44790d637cb = ((((((4136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f6acd8f74c5358de0810d21d() {
  return __cxx_static_address_f6acd8f74c5358de0810d21d.reference || (__cxx_static_address_f6acd8f74c5358de0810d21d.reference = {
    __cReference: true,
    get value() { return W_TECHWALL6____header_global_45efd44790d637cb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:735
export const W_TECHWALL7____header_global_96615dbc75201cf7 = ((((((4138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_652b22fe1d52dc75b67992ed() {
  return __cxx_static_address_652b22fe1d52dc75b67992ed.reference || (__cxx_static_address_652b22fe1d52dc75b67992ed.reference = {
    __cReference: true,
    get value() { return W_TECHWALL7____header_global_96615dbc75201cf7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:736
export const W_TECHWALL8____header_global_fec948869a280cfb = ((((((4140) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d1a48b74fc5f025097bb08d3() {
  return __cxx_static_address_d1a48b74fc5f025097bb08d3.reference || (__cxx_static_address_d1a48b74fc5f025097bb08d3.reference = {
    __cReference: true,
    get value() { return W_TECHWALL8____header_global_fec948869a280cfb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:737
export const W_TECHWALL9____header_global_abc7dfc06ad79eb4 = ((((((4142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dfcbb602d6a2fce7d7b5ce69() {
  return __cxx_static_address_dfcbb602d6a2fce7d7b5ce69.reference || (__cxx_static_address_dfcbb602d6a2fce7d7b5ce69.reference = {
    __cReference: true,
    get value() { return W_TECHWALL9____header_global_abc7dfc06ad79eb4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:738
export const BPANNEL3____header_global_85c5dacc6bba5cd8 = ((((((4100) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dc6c5f6a4b6563fb7c954a9f() {
  return __cxx_static_address_dc6c5f6a4b6563fb7c954a9f.reference || (__cxx_static_address_dc6c5f6a4b6563fb7c954a9f.reference = {
    __cReference: true,
    get value() { return BPANNEL3____header_global_85c5dacc6bba5cd8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:739
export const W_HITTECHWALL16____header_global_994574478759d9f1 = ((((((4144) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bfc3c4345c9217188588a40c() {
  return __cxx_static_address_bfc3c4345c9217188588a40c.reference || (__cxx_static_address_bfc3c4345c9217188588a40c.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL16____header_global_994574478759d9f1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:740
export const W_HITTECHWALL10____header_global_0b21577732f77eed = ((((((4145) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d65c6d8613521a6330449e06() {
  return __cxx_static_address_d65c6d8613521a6330449e06.reference || (__cxx_static_address_d65c6d8613521a6330449e06.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL10____header_global_0b21577732f77eed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:741
export const W_HITTECHWALL15____header_global_e659d3ea2b2453e0 = ((((((4147) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e162ac88f982a7f5a79035e4() {
  return __cxx_static_address_e162ac88f982a7f5a79035e4.reference || (__cxx_static_address_e162ac88f982a7f5a79035e4.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL15____header_global_e659d3ea2b2453e0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:742
export const W_MILKSHELF____header_global_183746b7c073ae32 = ((((((4181) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_75933376a05c26e11e5542c9() {
  return __cxx_static_address_75933376a05c26e11e5542c9.reference || (__cxx_static_address_75933376a05c26e11e5542c9.reference = {
    __cReference: true,
    get value() { return W_MILKSHELF____header_global_183746b7c073ae32; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:743
export const W_MILKSHELFBROKE____header_global_e7dff82bf5a48bbe = ((((((4203) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_213bd2a64b01cb9f0cee69c6() {
  return __cxx_static_address_213bd2a64b01cb9f0cee69c6.reference || (__cxx_static_address_213bd2a64b01cb9f0cee69c6.reference = {
    __cReference: true,
    get value() { return W_MILKSHELFBROKE____header_global_e7dff82bf5a48bbe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:744
export const PURPLELAVA____header_global_3f76bdea515ed225 = ((((((4240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dab92a3a2cdb078051fa8450() {
  return __cxx_static_address_dab92a3a2cdb078051fa8450.reference || (__cxx_static_address_dab92a3a2cdb078051fa8450.reference = {
    __cReference: true,
    get value() { return PURPLELAVA____header_global_3f76bdea515ed225; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:745
export const TARGET____header_global_d6c057d610ebd352 = ((((((4359) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_09e599083232a6b647394284() {
  return __cxx_static_address_09e599083232a6b647394284.reference || (__cxx_static_address_09e599083232a6b647394284.reference = {
    __cReference: true,
    get value() { return TARGET____header_global_d6c057d610ebd352; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:746
export const DUCK____header_global_e5c405d60df8dab6 = ((((((4361) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9a93f5c99b43b39a093cb142() {
  return __cxx_static_address_9a93f5c99b43b39a093cb142.reference || (__cxx_static_address_9a93f5c99b43b39a093cb142.reference = {
    __cReference: true,
    get value() { return DUCK____header_global_e5c405d60df8dab6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:747
export const PUKE____header_global_74c1ca098f40138f = ((((((4389) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_33b9b693139bc251b7088b20() {
  return __cxx_static_address_33b9b693139bc251b7088b20.reference || (__cxx_static_address_33b9b693139bc251b7088b20.reference = {
    __cReference: true,
    get value() { return PUKE____header_global_74c1ca098f40138f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:748
export const DOORTILE23____header_global_955d388beaa6c0c6 = ((((((4391) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ac0c1d44eaceb40d7637db7f() {
  return __cxx_static_address_ac0c1d44eaceb40d7637db7f.reference || (__cxx_static_address_ac0c1d44eaceb40d7637db7f.reference = {
    __cReference: true,
    get value() { return DOORTILE23____header_global_955d388beaa6c0c6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:749
export const SPEAKER____header_global_0e24082fcea279fb = ((((((4397) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1010d1b54ee9be53f22a678c() {
  return __cxx_static_address_1010d1b54ee9be53f22a678c.reference || (__cxx_static_address_1010d1b54ee9be53f22a678c.reference = {
    __cReference: true,
    get value() { return SPEAKER____header_global_0e24082fcea279fb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:750
export const MAIL____header_global_8290fa7901c5a7d7 = ((((((4410) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eda8bd4acd4728bea06068fc() {
  return __cxx_static_address_eda8bd4acd4728bea06068fc.reference || (__cxx_static_address_eda8bd4acd4728bea06068fc.reference = {
    __cReference: true,
    get value() { return MAIL____header_global_8290fa7901c5a7d7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:751
export const HOTMEAT____header_global_30d0933793ec5d73 = ((((((4427) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_faf9b165403819f726ceac00() {
  return __cxx_static_address_faf9b165403819f726ceac00.reference || (__cxx_static_address_faf9b165403819f726ceac00.reference = {
    __cReference: true,
    get value() { return HOTMEAT____header_global_30d0933793ec5d73; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:752
export const TRIPODCAMERA____header_global_9e235da5f5256747 = ((((((4444) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f8be6fab1dc26714ce77c193() {
  return __cxx_static_address_f8be6fab1dc26714ce77c193.reference || (__cxx_static_address_f8be6fab1dc26714ce77c193.reference = {
    __cReference: true,
    get value() { return TRIPODCAMERA____header_global_9e235da5f5256747; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:753
export const PAPER____header_global_ba9f21d66cf0e079 = ((((((4460) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e96db55b97fb30225e82e832() {
  return __cxx_static_address_e96db55b97fb30225e82e832.reference || (__cxx_static_address_e96db55b97fb30225e82e832.reference = {
    __cReference: true,
    get value() { return PAPER____header_global_ba9f21d66cf0e079; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:754
export const GENERICPOLE2____header_global_5a7e91859e303a94 = ((((((4465) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b340f06557d86c0fb1c013a9() {
  return __cxx_static_address_b340f06557d86c0fb1c013a9.reference || (__cxx_static_address_b340f06557d86c0fb1c013a9.reference = {
    __cReference: true,
    get value() { return GENERICPOLE2____header_global_5a7e91859e303a94; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:755
export const XXXSTACY____header_global_b497cac1d8bb7803 = ((((((4470) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_49693391dd1d7a5a142d490e() {
  return __cxx_static_address_49693391dd1d7a5a142d490e.reference || (__cxx_static_address_49693391dd1d7a5a142d490e.reference = {
    __cReference: true,
    get value() { return XXXSTACY____header_global_b497cac1d8bb7803; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:756
export const LETTER____header_global_2e4462ec399b0185 = ((((((4502) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bdae44207c4282e0a402d211() {
  return __cxx_static_address_bdae44207c4282e0a402d211.reference || (__cxx_static_address_bdae44207c4282e0a402d211.reference = {
    __cReference: true,
    get value() { return LETTER____header_global_2e4462ec399b0185; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:757
export const SIDEBOLT1____header_global_b2e0c16d72d4e6b5 = ((((((4525) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_078566a554462ee18dea672c() {
  return __cxx_static_address_078566a554462ee18dea672c.reference || (__cxx_static_address_078566a554462ee18dea672c.reference = {
    __cReference: true,
    get value() { return SIDEBOLT1____header_global_b2e0c16d72d4e6b5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:758
export const FOODOBJECT16____header_global_2733d9da8000e9b0 = ((((((4545) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f54b52d6d80acddfb66cf2ac() {
  return __cxx_static_address_f54b52d6d80acddfb66cf2ac.reference || (__cxx_static_address_f54b52d6d80acddfb66cf2ac.reference = {
    __cReference: true,
    get value() { return FOODOBJECT16____header_global_2733d9da8000e9b0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:759
export const TAMPON____header_global_2b28f1cd85583711 = ((((((4557) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1d2fcb039cd374e218d4b218() {
  return __cxx_static_address_1d2fcb039cd374e218d4b218.reference || (__cxx_static_address_1d2fcb039cd374e218d4b218.reference = {
    __cReference: true,
    get value() { return TAMPON____header_global_2b28f1cd85583711; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:760
export const CANWITHSOMETHING2____header_global_8d2ed28fc54fae8d = ((((((4580) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4131b06bf0e21b711c5a9c46() {
  return __cxx_static_address_4131b06bf0e21b711c5a9c46.reference || (__cxx_static_address_4131b06bf0e21b711c5a9c46.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING2____header_global_8d2ed28fc54fae8d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:761
export const CANWITHSOMETHING3____header_global_08101769a234ff9d = ((((((4581) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_600e5aeaa42a49cc82dd7ea8() {
  return __cxx_static_address_600e5aeaa42a49cc82dd7ea8.reference || (__cxx_static_address_600e5aeaa42a49cc82dd7ea8.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING3____header_global_08101769a234ff9d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:762
export const CANWITHSOMETHING4____header_global_dda27adcf9f8695d = ((((((4582) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6e34b64cedfa5a4ef9325625() {
  return __cxx_static_address_6e34b64cedfa5a4ef9325625.reference || (__cxx_static_address_6e34b64cedfa5a4ef9325625.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING4____header_global_dda27adcf9f8695d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:763
export const DOLPHIN1____header_global_56fb8efeed5816b9 = ((((((4591) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_315acaaaee6b4c4da379bf52() {
  return __cxx_static_address_315acaaaee6b4c4da379bf52.reference || (__cxx_static_address_315acaaaee6b4c4da379bf52.reference = {
    __cReference: true,
    get value() { return DOLPHIN1____header_global_56fb8efeed5816b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:764
export const DOLPHIN2____header_global_87b688e2c4cccb01 = ((((((4592) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_76fecb864e92bb060faa9220() {
  return __cxx_static_address_76fecb864e92bb060faa9220.reference || (__cxx_static_address_76fecb864e92bb060faa9220.reference = {
    __cReference: true,
    get value() { return DOLPHIN2____header_global_87b688e2c4cccb01; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:765
export const NEWBEAST____header_global_bb0a65ad8e8d4889 = ((((((4610) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_831e8beef322eb342f7d3f34() {
  return __cxx_static_address_831e8beef322eb342f7d3f34.reference || (__cxx_static_address_831e8beef322eb342f7d3f34.reference = {
    __cReference: true,
    get value() { return NEWBEAST____header_global_bb0a65ad8e8d4889; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:766
export const NEWBEASTSTAYPUT____header_global_0176d511de333196 = ((((((4611) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6f7eeb283d4b9cd703e797dc() {
  return __cxx_static_address_6f7eeb283d4b9cd703e797dc.reference || (__cxx_static_address_6f7eeb283d4b9cd703e797dc.reference = {
    __cReference: true,
    get value() { return NEWBEASTSTAYPUT____header_global_0176d511de333196; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:767
export const BOSS4____header_global_6fab5f9aa3c15b69 = ((((((4740) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fe0b5e45c0ede82eefd9f564() {
  return __cxx_static_address_fe0b5e45c0ede82eefd9f564.reference || (__cxx_static_address_fe0b5e45c0ede82eefd9f564.reference = {
    __cReference: true,
    get value() { return BOSS4____header_global_6fab5f9aa3c15b69; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:768
export const BOSS4STAYPUT____header_global_7d8acd3815af3a4d = ((((((4741) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1c29ce7a251531ea9cb34ff2() {
  return __cxx_static_address_1c29ce7a251531ea9cb34ff2.reference || (__cxx_static_address_1c29ce7a251531ea9cb34ff2.reference = {
    __cReference: true,
    get value() { return BOSS4STAYPUT____header_global_7d8acd3815af3a4d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:769
export const FEM10____header_global_96e0ff19cf841ca4 = ((((((4864) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a349d969194c35697ccacd4d() {
  return __cxx_static_address_a349d969194c35697ccacd4d.reference || (__cxx_static_address_a349d969194c35697ccacd4d.reference = {
    __cReference: true,
    get value() { return FEM10____header_global_96e0ff19cf841ca4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:770
export const TOUGHGAL____header_global_eefb227d6f79d696 = ((((((4866) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_72420cfad1d72a053cec9d64() {
  return __cxx_static_address_72420cfad1d72a053cec9d64.reference || (__cxx_static_address_72420cfad1d72a053cec9d64.reference = {
    __cReference: true,
    get value() { return TOUGHGAL____header_global_eefb227d6f79d696; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:771
export const MAN____header_global_f41a7755b83bac34 = ((((((4871) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_91648a377c9bd30f563f61f7() {
  return __cxx_static_address_91648a377c9bd30f563f61f7.reference || (__cxx_static_address_91648a377c9bd30f563f61f7.reference = {
    __cReference: true,
    get value() { return MAN____header_global_f41a7755b83bac34; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:772
export const MAN2____header_global_c7ffc1a9ae379bed = ((((((4872) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b50332ed2d3a79b0e4db7f21() {
  return __cxx_static_address_b50332ed2d3a79b0e4db7f21.reference || (__cxx_static_address_b50332ed2d3a79b0e4db7f21.reference = {
    __cReference: true,
    get value() { return MAN2____header_global_c7ffc1a9ae379bed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:773
export const WOMAN____header_global_7b1269b4e54fb968 = ((((((4874) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9049f3a2f3a4e797d1e36ff8() {
  return __cxx_static_address_9049f3a2f3a4e797d1e36ff8.reference || (__cxx_static_address_9049f3a2f3a4e797d1e36ff8.reference = {
    __cReference: true,
    get value() { return WOMAN____header_global_7b1269b4e54fb968; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:774
export const NATURALLIGHTNING____header_global_f978e305203b3259 = ((((((4890) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c3da030a1f7d285284069ad4() {
  return __cxx_static_address_c3da030a1f7d285284069ad4.reference || (__cxx_static_address_c3da030a1f7d285284069ad4.reference = {
    __cReference: true,
    get value() { return NATURALLIGHTNING____header_global_f978e305203b3259; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:775
export const WEATHERWARN____header_global_f8936a66c621c360 = ((((((4893) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4d236e0559e0640936c7b255() {
  return __cxx_static_address_4d236e0559e0640936c7b255.reference || (__cxx_static_address_4d236e0559e0640936c7b255.reference = {
    __cReference: true,
    get value() { return WEATHERWARN____header_global_f8936a66c621c360; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:776
export const DUKETAG____header_global_5281f85f8fb59a98 = ((((((4900) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_36c5a0bda30814d17e76971d() {
  return __cxx_static_address_36c5a0bda30814d17e76971d.reference || (__cxx_static_address_36c5a0bda30814d17e76971d.reference = {
    __cReference: true,
    get value() { return DUKETAG____header_global_5281f85f8fb59a98; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:777
export const SIGN1____header_global_c0e5417c4cfa9cb5 = ((((((4909) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_accd5091a1d659bee6a42b60() {
  return __cxx_static_address_accd5091a1d659bee6a42b60.reference || (__cxx_static_address_accd5091a1d659bee6a42b60.reference = {
    __cReference: true,
    get value() { return SIGN1____header_global_c0e5417c4cfa9cb5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:778
export const SIGN2____header_global_a886e0ae8a83a7d1 = ((((((4912) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c368b130f3b298d0facaea95() {
  return __cxx_static_address_c368b130f3b298d0facaea95.reference || (__cxx_static_address_c368b130f3b298d0facaea95.reference = {
    __cReference: true,
    get value() { return SIGN2____header_global_a886e0ae8a83a7d1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:779
export const JURYGUY____header_global_2b31f7e759057bd0 = ((((((4943) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2b494f23fb150c1b520222c0() {
  return __cxx_static_address_2b494f23fb150c1b520222c0.reference || (__cxx_static_address_2b494f23fb150c1b520222c0.reference = {
    __cReference: true,
    get value() { return JURYGUY____header_global_2b31f7e759057bd0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:780
export const WIDESCREENSTATUSBAR____header_global_6b3fa65e8e076651 = ((((((5120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6a1a2a810c8515289b6b70c9() {
  return __cxx_static_address_6a1a2a810c8515289b6b70c9.reference || (__cxx_static_address_6a1a2a810c8515289b6b70c9.reference = {
    __cReference: true,
    get value() { return WIDESCREENSTATUSBAR____header_global_6b3fa65e8e076651; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:781
export const RPGGUNWIDE____header_global_07ae06be44f71e8c = ((((((5121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_676cf071919e9657e89513d8() {
  return __cxx_static_address_676cf071919e9657e89513d8.reference || (__cxx_static_address_676cf071919e9657e89513d8.reference = {
    __cReference: true,
    get value() { return RPGGUNWIDE____header_global_07ae06be44f71e8c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:782
export const FIRSTGUNRELOADWIDE____header_global_9ca2d533d2eddecb = ((((((5122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6f4a5607dd494678af302460() {
  return __cxx_static_address_6f4a5607dd494678af302460.reference || (__cxx_static_address_6f4a5607dd494678af302460.reference = {
    __cReference: true,
    get value() { return FIRSTGUNRELOADWIDE____header_global_9ca2d533d2eddecb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:783
export const FREEZEWIDE____header_global_3a7733221fcf516e = ((((((5123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4fd5ecd3c52f7d245f4e4129() {
  return __cxx_static_address_4fd5ecd3c52f7d245f4e4129.reference || (__cxx_static_address_4fd5ecd3c52f7d245f4e4129.reference = {
    __cReference: true,
    get value() { return FREEZEWIDE____header_global_3a7733221fcf516e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:784
export const FREEZEFIREWIDE____header_global_8b52156b511a19b2 = ((((((5124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ea04b9ad80b191db055d7077() {
  return __cxx_static_address_ea04b9ad80b191db055d7077.reference || (__cxx_static_address_ea04b9ad80b191db055d7077.reference = {
    __cReference: true,
    get value() { return FREEZEFIREWIDE____header_global_8b52156b511a19b2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:785
export const SHRINKERWIDE____header_global_927bfb2aba9f4947 = ((((((5127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dc2ed135eb2a05d469587afc() {
  return __cxx_static_address_dc2ed135eb2a05d469587afc.reference || (__cxx_static_address_dc2ed135eb2a05d469587afc.reference = {
    __cReference: true,
    get value() { return SHRINKERWIDE____header_global_927bfb2aba9f4947; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:786
export const CRACKKNUCKLESWIDE____header_global_d3a2314700e00fa1 = ((((((5129) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_47987ac75a33eda177a250f7() {
  return __cxx_static_address_47987ac75a33eda177a250f7.reference || (__cxx_static_address_47987ac75a33eda177a250f7.reference = {
    __cReference: true,
    get value() { return CRACKKNUCKLESWIDE____header_global_d3a2314700e00fa1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:787
export const FLAMETHROWERSPRITE____header_global_03a9e5f2c48b9316 = ((((((5134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_da7c4808d247e59741dc57d2() {
  return __cxx_static_address_da7c4808d247e59741dc57d2.reference || (__cxx_static_address_da7c4808d247e59741dc57d2.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERSPRITE____header_global_03a9e5f2c48b9316; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:788
export const FLAMETHROWERAMMO____header_global_d48ebe7af1719279 = ((((((5135) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1817eee61ecb84def3cdd69e() {
  return __cxx_static_address_1817eee61ecb84def3cdd69e.reference || (__cxx_static_address_1817eee61ecb84def3cdd69e.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERAMMO____header_global_d48ebe7af1719279; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:789
export const FLAMETHROWER____header_global_0a3803a1d9bf704a = ((((((5138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e91302c3c42801abef9d4bf1() {
  return __cxx_static_address_e91302c3c42801abef9d4bf1.reference || (__cxx_static_address_e91302c3c42801abef9d4bf1.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER____header_global_0a3803a1d9bf704a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:790
export const FLAMETHROWERFIRE____header_global_c59ff92b76498170 = ((((((5139) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ffa5256d510d68e2a91af1e1() {
  return __cxx_static_address_ffa5256d510d68e2a91af1e1.reference || (__cxx_static_address_ffa5256d510d68e2a91af1e1.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERFIRE____header_global_c59ff92b76498170; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:791
export const FLAMETHROWERFLAME____header_global_e51fe512716cc8c4 = ((((((1891) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e6f1a37a3789e5ef1243531b() {
  return __cxx_static_address_e6f1a37a3789e5ef1243531b.reference || (__cxx_static_address_e6f1a37a3789e5ef1243531b.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERFLAME____header_global_e51fe512716cc8c4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:792
export const FLAMETHROWERPILOT____header_global_4e8ff4afad15dfc8 = ((((((5174) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c792fd96023baa488c7b0053() {
  return __cxx_static_address_c792fd96023baa488c7b0053.reference || (__cxx_static_address_c792fd96023baa488c7b0053.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERPILOT____header_global_4e8ff4afad15dfc8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:793
export const FIREBALL____header_global_a9c2d312f6031285 = ((((((5163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bc1883fcfa86e3e6d35c5c7e() {
  return __cxx_static_address_bc1883fcfa86e3e6d35c5c7e.reference || (__cxx_static_address_bc1883fcfa86e3e6d35c5c7e.reference = {
    __cReference: true,
    get value() { return FIREBALL____header_global_a9c2d312f6031285; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:794
export const ONFIRE____header_global_364b27f48d776158 = ((((((5152) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8aef030fb07e5edf70d25999() {
  return __cxx_static_address_8aef030fb07e5edf70d25999.reference || (__cxx_static_address_8aef030fb07e5edf70d25999.reference = {
    __cReference: true,
    get value() { return ONFIRE____header_global_364b27f48d776158; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:795
export const ONFIRESMOKE____header_global_a3f53aa001b03400 = ((((((5143) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b8a068be3d53924ad4b11eb8() {
  return __cxx_static_address_b8a068be3d53924ad4b11eb8.reference || (__cxx_static_address_b8a068be3d53924ad4b11eb8.reference = {
    __cReference: true,
    get value() { return ONFIRESMOKE____header_global_a3f53aa001b03400; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:796
export const BURNEDCORPSE____header_global_72696a8e7a2d4a50 = ((((((5173) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9ecde625ec0eca8286a47a70() {
  return __cxx_static_address_9ecde625ec0eca8286a47a70.reference || (__cxx_static_address_9ecde625ec0eca8286a47a70.reference = {
    __cReference: true,
    get value() { return BURNEDCORPSE____header_global_72696a8e7a2d4a50; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:797
export const WHISPYSMOKE____header_global_9f0ef530b0577958 = ((((((5268) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b66759c70c4da0162c39ac72() {
  return __cxx_static_address_b66759c70c4da0162c39ac72.reference || (__cxx_static_address_b66759c70c4da0162c39ac72.reference = {
    __cReference: true,
    get value() { return WHISPYSMOKE____header_global_9f0ef530b0577958; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:798
export const FIREFLY____header_global_7c706e6ff05c3b41 = ((((((5180) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4f194105cb1c0c71e2cb194e() {
  return __cxx_static_address_4f194105cb1c0c71e2cb194e.reference || (__cxx_static_address_4f194105cb1c0c71e2cb194e.reference = {
    __cReference: true,
    get value() { return FIREFLY____header_global_7c706e6ff05c3b41; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:799
export const FIREFLYSHRINKEFFECT____header_global_3956f44297cbe4a9 = ((((((5360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d279bb223e81b1cc58347bce() {
  return __cxx_static_address_d279bb223e81b1cc58347bce.reference || (__cxx_static_address_d279bb223e81b1cc58347bce.reference = {
    __cReference: true,
    get value() { return FIREFLYSHRINKEFFECT____header_global_3956f44297cbe4a9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:800
export const FIREFLYGROWEFFECT____header_global_a0e486b4d016e96d = ((((((5367) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_123be5c9fe54df2ae03fefc3() {
  return __cxx_static_address_123be5c9fe54df2ae03fefc3.reference || (__cxx_static_address_123be5c9fe54df2ae03fefc3.reference = {
    __cReference: true,
    get value() { return FIREFLYGROWEFFECT____header_global_a0e486b4d016e96d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:801
export const FIREFLYFLYINGEFFECT____header_global_4d1542f269f2bf70 = ((((((5296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fcc8c1c44ae2ee35872cb00b() {
  return __cxx_static_address_fcc8c1c44ae2ee35872cb00b.reference || (__cxx_static_address_fcc8c1c44ae2ee35872cb00b.reference = {
    __cReference: true,
    get value() { return FIREFLYFLYINGEFFECT____header_global_4d1542f269f2bf70; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:802
export const BOSS5____header_global_9bba1ca395da013b = ((((((5310) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ebce55338939f6607d049246() {
  return __cxx_static_address_ebce55338939f6607d049246.reference || (__cxx_static_address_ebce55338939f6607d049246.reference = {
    __cReference: true,
    get value() { return BOSS5____header_global_9bba1ca395da013b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:803
export const BOSS5STAYPUT____header_global_cb7834630a235ed5 = ((((((5311) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_736c70b463706265cc0c3a17() {
  return __cxx_static_address_736c70b463706265cc0c3a17.reference || (__cxx_static_address_736c70b463706265cc0c3a17.reference = {
    __cReference: true,
    get value() { return BOSS5STAYPUT____header_global_cb7834630a235ed5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:804
export const LAVAPOOL____header_global_47db38f0d5192b4a = ((((((5304) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3974e92a9ca88dc85b9b8604() {
  return __cxx_static_address_3974e92a9ca88dc85b9b8604.reference || (__cxx_static_address_3974e92a9ca88dc85b9b8604.reference = {
    __cReference: true,
    get value() { return LAVAPOOL____header_global_47db38f0d5192b4a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:805
export const LAVASPLASH____header_global_03261aa621c088e8 = ((((((5371) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e4379f0357e90078a4017b62() {
  return __cxx_static_address_e4379f0357e90078a4017b62.reference || (__cxx_static_address_e4379f0357e90078a4017b62.reference = {
    __cReference: true,
    get value() { return LAVASPLASH____header_global_03261aa621c088e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:806
export const LAVAPOOLBUBBLE____header_global_79db5aa70a4abb81 = ((((((5207) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_499c99a90bd9c8fe10fbfecc() {
  return __cxx_static_address_499c99a90bd9c8fe10fbfecc.reference || (__cxx_static_address_499c99a90bd9c8fe10fbfecc.reference = {
    __cReference: true,
    get value() { return LAVAPOOLBUBBLE____header_global_79db5aa70a4abb81; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:807
export const BOSS2STAYPUT____header_global_65de3dafb1fc283d = ((((((2711) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_06bd8c9e31422e2ae821bc3d() {
  return __cxx_static_address_06bd8c9e31422e2ae821bc3d.reference || (__cxx_static_address_06bd8c9e31422e2ae821bc3d.reference = {
    __cReference: true,
    get value() { return BOSS2STAYPUT____header_global_65de3dafb1fc283d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:808
export const BOSS3STAYPUT____header_global_1911bf8e58f264d6 = ((((((2761) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3c37fccac159ab27b24d4ad2() {
  return __cxx_static_address_3c37fccac159ab27b24d4ad2.reference || (__cxx_static_address_3c37fccac159ab27b24d4ad2.reference = {
    __cReference: true,
    get value() { return BOSS3STAYPUT____header_global_1911bf8e58f264d6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:809
export const E32_TILE5736____header_global_81c17f9458610f8a = ((((((5736) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_768e342196c38e27a0b0b311() {
  return __cxx_static_address_768e342196c38e27a0b0b311.reference || (__cxx_static_address_768e342196c38e27a0b0b311.reference = {
    __cReference: true,
    get value() { return E32_TILE5736____header_global_81c17f9458610f8a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:810
export const E32_TILE5737____header_global_2d31c777e6834520 = ((((((5737) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d05130b4d4eeb9824a2e036c() {
  return __cxx_static_address_d05130b4d4eeb9824a2e036c.reference || (__cxx_static_address_d05130b4d4eeb9824a2e036c.reference = {
    __cReference: true,
    get value() { return E32_TILE5737____header_global_2d31c777e6834520; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:811
export const E32_TILE5846____header_global_7a9d31060b243942 = ((((((5846) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b41c71ef3bdcaf672f40c1d0() {
  return __cxx_static_address_b41c71ef3bdcaf672f40c1d0.reference || (__cxx_static_address_b41c71ef3bdcaf672f40c1d0.reference = {
    __cReference: true,
    get value() { return E32_TILE5846____header_global_7a9d31060b243942; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/network.h:180
export const cSnapshotMemUsage__header_global_d5c6c828d5580cd1 = u64((BigInt(u64(64)) * BigInt((BigInt((BigInt((BigInt(72) * BigInt(u64(16384)))) + BigInt((BigInt(96) * BigInt(u64(4096)))))) + BigInt((BigInt(296) * BigInt(u64(16384))))))));
function __cxx_static_address_e0e69739126e5bc4c1e87146() {
  return __cxx_static_address_e0e69739126e5bc4c1e87146.reference || (__cxx_static_address_e0e69739126e5bc4c1e87146.reference = {
    __cReference: true,
    get value() { return cSnapshotMemUsage__header_global_d5c6c828d5580cd1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/osdcmds.cpp:41
export let osdcmd_cheatsinfo_stat = cZeroAggregate({"record": {"cheatnum": {"scalar": "int"}, "level": {"scalar": "int"}, "volume": {"scalar": "int"}}});
export function __cxx_global_cell_ca447e07092a4569caf9d5f0() {
  return __cxx_global_cell_ca447e07092a4569caf9d5f0.reference || (__cxx_global_cell_ca447e07092a4569caf9d5f0.reference = {
    __cReference: true,
    get value() { return osdcmd_cheatsinfo_stat; },
    set value(__cxx_lvalue_0) { throw new TypeError("record address cannot replace original object storage"); }
  });
}

// C/C++ source: source/duke3d/src/osdcmds.cpp:42
export let r_ambientlight = Math.fround(1);
export function __cxx_global_cell_fbe41650bda2e40cd3a62772() {
  return __cxx_global_cell_fbe41650bda2e40cd3a62772.reference || (__cxx_global_cell_fbe41650bda2e40cd3a62772.reference = {
    __cReference: true,
    get value() { return r_ambientlight; },
    set value(__cxx_lvalue_0) { r_ambientlight = Math.fround(__cxx_lvalue_0); }
  });
}

export let r_ambientlightrecip = Math.fround(1);
export function __cxx_global_cell_79bc27df6e5bf08d7a819379() {
  return __cxx_global_cell_79bc27df6e5bf08d7a819379.reference || (__cxx_global_cell_79bc27df6e5bf08d7a819379.reference = {
    __cReference: true,
    get value() { return r_ambientlightrecip; },
    set value(__cxx_lvalue_0) { r_ambientlightrecip = Math.fround(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/osdcmds.cpp:43
export let r_pr_defaultlights = i32(1);
export function __cxx_global_cell_111cada9155bff62e1b2fca4() {
  return __cxx_global_cell_111cada9155bff62e1b2fca4.reference || (__cxx_global_cell_111cada9155bff62e1b2fca4.reference = {
    __cReference: true,
    get value() { return r_pr_defaultlights; },
    set value(__cxx_lvalue_0) { r_pr_defaultlights = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_c36e4597369a094e = i32(2147483647);
function __cxx_static_address_a5f934e9bc2973ba10b57e57() {
  return __cxx_static_address_a5f934e9bc2973ba10b57e57.reference || (__cxx_static_address_a5f934e9bc2973ba10b57e57.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_c36e4597369a094e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_dedb3b5ecd32af26 = i32(2147483648);
function __cxx_static_address_263fed0c00491f09fb1780c7() {
  return __cxx_static_address_263fed0c00491f09fb1780c7.reference || (__cxx_static_address_263fed0c00491f09fb1780c7.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_dedb3b5ecd32af26; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_6f6d590d4c055bd1 = i32(2147483648);
function __cxx_static_address_d499f74f8c2e9b0745790879() {
  return __cxx_static_address_d499f74f8c2e9b0745790879.reference || (__cxx_static_address_d499f74f8c2e9b0745790879.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_6f6d590d4c055bd1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_e5a22cea9021e1b1 = i32(65536);
function __cxx_static_address_418c37f720771f2f22c26b35() {
  return __cxx_static_address_418c37f720771f2f22c26b35.reference || (__cxx_static_address_418c37f720771f2f22c26b35.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_e5a22cea9021e1b1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_412635c0f73676f9 = i32(32768);
function __cxx_static_address_47e075afda2f6e95f2214abd() {
  return __cxx_static_address_47e075afda2f6e95f2214abd.reference || (__cxx_static_address_47e075afda2f6e95f2214abd.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_412635c0f73676f9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_0b22eb8f9fee6272 = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_fac70f6b48cd5ce7fcfe60ea() {
  return __cxx_static_address_fac70f6b48cd5ce7fcfe60ea.reference || (__cxx_static_address_fac70f6b48cd5ce7fcfe60ea.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_0b22eb8f9fee6272; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/osdcmds.cpp:45
export let cl_cheatmask = 0;
export function __cxx_global_cell_7c98f59f6d537405fb3f374a() {
  return __cxx_global_cell_7c98f59f6d537405fb3f374a.reference || (__cxx_global_cell_7c98f59f6d537405fb3f374a.reference = {
    __cReference: true,
    get value() { return cl_cheatmask; },
    set value(__cxx_lvalue_0) { cl_cheatmask = u32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/osdcmds.cpp:867
export const ConsoleButtons = cPointerArray(10, [Uint8Array.from([109, 111, 117, 115, 101, 49, 0]), Uint8Array.from([109, 111, 117, 115, 101, 50, 0]), Uint8Array.from([109, 111, 117, 115, 101, 51, 0]), Uint8Array.from([109, 111, 117, 115, 101, 52, 0]), Uint8Array.from([109, 119, 104, 101, 101, 108, 117, 112, 0]), Uint8Array.from([109, 119, 104, 101, 101, 108, 100, 110, 0]), Uint8Array.from([109, 111, 117, 115, 101, 53, 0]), Uint8Array.from([109, 111, 117, 115, 101, 54, 0]), Uint8Array.from([109, 111, 117, 115, 101, 55, 0]), Uint8Array.from([109, 111, 117, 115, 101, 56, 0])]);
function __cxx_static_address_3594aad00eb0369bf7825370() {
  return __cxx_static_address_3594aad00eb0369bf7825370.reference || (__cxx_static_address_3594aad00eb0369bf7825370.reference = {
    __cReference: true,
    get value() { return ConsoleButtons; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_dcd24aac924bebdd = new Uint8Array([((1) & 255), ((2) & 255), ((4) & 255), ((8) & 255), ((16) & 255), ((32) & 255), ((64) & 255), ((128) & 255)]);
function __cxx_static_address_14f7a1898d6384a520f020d5() {
  return __cxx_static_address_14f7a1898d6384a520f020d5.reference || (__cxx_static_address_14f7a1898d6384a520f020d5.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_dcd24aac924bebdd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:172
export const g_defaultVideoModes__header_global_97a48ed1762da8a8 = [cMarkAggregate(({"x": 2560, "y": 1440})), cMarkAggregate(({"x": 2560, "y": 1200})), cMarkAggregate(({"x": 2560, "y": 1080})), cMarkAggregate(({"x": 1920, "y": 1440})), cMarkAggregate(({"x": 1920, "y": 1200})), cMarkAggregate(({"x": 1920, "y": 1080})), cMarkAggregate(({"x": 1680, "y": 1050})), cMarkAggregate(({"x": 1600, "y": 1200})), cMarkAggregate(({"x": 1600, "y": 900})), cMarkAggregate(({"x": 1366, "y": 768})), cMarkAggregate(({"x": 1280, "y": 1024})), cMarkAggregate(({"x": 1280, "y": 960})), cMarkAggregate(({"x": 1280, "y": 720})), cMarkAggregate(({"x": 1152, "y": 864})), cMarkAggregate(({"x": 1024, "y": 768})), cMarkAggregate(({"x": 1024, "y": 600})), cMarkAggregate(({"x": 800, "y": 600})), cMarkAggregate(({"x": 640, "y": 480})), cMarkAggregate(({"x": 640, "y": 400})), cMarkAggregate(({"x": 512, "y": 384})), cMarkAggregate(({"x": 480, "y": 360})), cMarkAggregate(({"x": 400, "y": 300})), cMarkAggregate(({"x": 320, "y": 240})), cMarkAggregate(({"x": 320, "y": 200})), cMarkAggregate(({"x": 0, "y": 0}))];
function __cxx_static_address_1f2717afa37a2a1e05397166() {
  return __cxx_static_address_1f2717afa37a2a1e05397166.reference || (__cxx_static_address_1f2717afa37a2a1e05397166.reference = {
    __cReference: true,
    get value() { return g_defaultVideoModes__header_global_97a48ed1762da8a8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:188
export const g_keyAsciiTable__header_global_01639c5b4e7daa50 = new Uint8Array([((0) & 255), ((0) & 255), 49, 50, 51, 52, 53, 54, 55, 56, 57, 48, 45, 61, ((0) & 255), ((0) & 255), 113, 119, 101, 114, 116, 121, 117, 105, 111, 112, 91, 93, ((0) & 255), ((0) & 255), 97, 115, 100, 102, 103, 104, 106, 107, 108, 59, ((39) & 255), 96, ((0) & 255), ((92) & 255), 122, 120, 99, 118, 98, 110, 109, 44, 46, 47, ((0) & 255), 42, ((0) & 255), ((32) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255)]);
function __cxx_static_address_9832e61be2cfe7bd0c44facc() {
  return __cxx_static_address_9832e61be2cfe7bd0c44facc.reference || (__cxx_static_address_9832e61be2cfe7bd0c44facc.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTable__header_global_01639c5b4e7daa50; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:196
export const g_keyAsciiTableShift__header_global_1b80e2852408d4a8 = new Uint8Array([((0) & 255), ((0) & 255), 33, 64, 35, 36, 37, 94, 38, 42, 40, 41, 95, 43, ((0) & 255), ((0) & 255), 81, 87, 69, 82, 84, 89, 85, 73, 79, 80, 123, 125, ((0) & 255), ((0) & 255), 65, 83, 68, 70, 71, 72, 74, 75, 76, 58, 34, 126, ((0) & 255), 124, 90, 88, 67, 86, 66, 78, 77, 60, 62, 63, ((0) & 255), 42, ((0) & 255), ((32) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255)]);
function __cxx_static_address_e78b1b369d34a917b921bcf9() {
  return __cxx_static_address_e78b1b369d34a917b921bcf9.reference || (__cxx_static_address_e78b1b369d34a917b921bcf9.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTableShift__header_global_1b80e2852408d4a8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:895
export const pow2long__header_global_8e094c7f9cf85d89 = new Int32Array([1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576, 2097152, 4194304, 8388608, 16777216, 33554432, 67108864, 134217728, 268435456, 536870912, 1073741824, 2147483647]);
function __cxx_static_address_134d9795a2c08dc7864fda91() {
  return __cxx_static_address_134d9795a2c08dc7864fda91.reference || (__cxx_static_address_134d9795a2c08dc7864fda91.reference = {
    __cReference: true,
    get value() { return pow2long__header_global_8e094c7f9cf85d89; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:907
export const pow2ulong__header_global_e9685ab81a157448 = new Uint32Array([u32(1), u32(2), u32(4), u32(8), u32(16), u32(32), u32(64), u32(128), u32(256), u32(512), u32(1024), u32(2048), u32(4096), u32(8192), u32(16384), u32(32768), u32(65536), u32(131072), u32(262144), u32(524288), u32(1048576), u32(2097152), u32(4194304), u32(8388608), u32(16777216), u32(33554432), u32(67108864), u32(134217728), u32(268435456), u32(536870912), u32(1073741824), u32(2147483648n)]);
function __cxx_static_address_e63cf347f62b8960f6c3faab() {
  return __cxx_static_address_e63cf347f62b8960f6c3faab.reference || (__cxx_static_address_e63cf347f62b8960f6c3faab.reference = {
    __cReference: true,
    get value() { return pow2ulong__header_global_e9685ab81a157448; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:919
export const pow264__header_global_42d1da4019a19afc = new BigInt64Array([BigInt(i64(1)), BigInt(i64(2)), BigInt(i64(4)), BigInt(i64(8)), BigInt(i64(16)), BigInt(i64(32)), BigInt(i64(64)), BigInt(i64(128)), BigInt(i64(256)), BigInt(i64(512)), BigInt(i64(1024)), BigInt(i64(2048)), BigInt(i64(4096)), BigInt(i64(8192)), BigInt(i64(16384)), BigInt(i64(32768)), BigInt(i64(65536)), BigInt(i64(131072)), BigInt(i64(262144)), BigInt(i64(524288)), BigInt(i64(1048576)), BigInt(i64(2097152)), BigInt(i64(4194304)), BigInt(i64(8388608)), BigInt(i64(16777216)), BigInt(i64(33554432)), BigInt(i64(67108864)), BigInt(i64(134217728)), BigInt(i64(268435456)), BigInt(i64(536870912)), BigInt(i64(1073741824)), BigInt(2147483648n), BigInt(4294967296n), BigInt(8589934592n), BigInt(17179869184n), BigInt(34359738368n), BigInt(68719476736n), BigInt(137438953472n), BigInt(274877906944n), BigInt(549755813888n), BigInt(1099511627776n), BigInt(2199023255552n), BigInt(4398046511104n), BigInt(8796093022208n), BigInt(17592186044416n), BigInt(35184372088832n), BigInt(70368744177664n), BigInt(140737488355328n), BigInt(281474976710656n), BigInt(562949953421312n), BigInt(1125899906842624n), BigInt(2251799813685248n), BigInt(4503599627370496n), BigInt(9007199254740992n), BigInt(18014398509481984n), BigInt(36028797018963968n), BigInt(72057594037927936n), BigInt(144115188075855872n), BigInt(288230376151711744n), BigInt(576460752303423488n), BigInt(1152921504606846976n), BigInt(2305843009213693952n), BigInt(4611686018427387904n), BigInt(9223372036854775807n)]);
function __cxx_static_address_c977b8d5b89bb7d9379c245d() {
  return __cxx_static_address_c977b8d5b89bb7d9379c245d.reference || (__cxx_static_address_c977b8d5b89bb7d9379c245d.reference = {
    __cReference: true,
    get value() { return pow264__header_global_42d1da4019a19afc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export function clamp__header_e7babf989a8b(__cxx_in, min, max) {
  return i32(((__cxx_in <= i32(min)) ? i32(min) : ((__cxx_in >= i32(max)) ? i32(max) : __cxx_in)));
}

export function ARRAY_SIZE__header_c2aff58eb967(arg0) {
  return u64(10n);
}

export function ARRAY_SIZE__header_7675bb03d161(arg0) {
  return u64(102n);
}

export function ARRAY_SIZE__header_49035a79a7c2(arg0) {
  return u64(5n);
}

// C/C++ source: source/build/include/smmalloc.h:859
export function _sm_malloc(allocator, bytesCount, alignment) {
  return cRecordObject(allocator).Alloc(bytesCount, alignment);
}
