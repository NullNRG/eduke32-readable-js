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
// Original translation unit: source/duke3d/src/demo.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.

function cCopyTrivialClass(value, C, fields) {
  if (!(value instanceof C)) throw new TypeError('C++ trivial class copy type mismatch');
  const copy=Object.create(C.prototype);
  for (const field of fields) copy[field]=value[field];
  return copy;
}

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
export const fix16_rad_to_deg_mult__header_global_a4f73ecb5c58f551 = i32(3754936);
function __cxx_static_address_2ce28ee9304c3b3fdf42cb40() {
  return __cxx_static_address_2ce28ee9304c3b3fdf42cb40.reference || (__cxx_static_address_2ce28ee9304c3b3fdf42cb40.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_a4f73ecb5c58f551; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_4da949362b669e76 = i32(1144);
function __cxx_static_address_4384b5b1394ad210df9ca9b9() {
  return __cxx_static_address_4384b5b1394ad210df9ca9b9.reference || (__cxx_static_address_4384b5b1394ad210df9ca9b9.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_4da949362b669e76; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:43
export const KICK_HIT____header_global_f90a61a19997a77a = ((((((0) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_085dfb71cc9212d904e47d3a() {
  return __cxx_static_address_085dfb71cc9212d904e47d3a.reference || (__cxx_static_address_085dfb71cc9212d904e47d3a.reference = {
    __cReference: true,
    get value() { return KICK_HIT____header_global_f90a61a19997a77a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:44
export const PISTOL_RICOCHET____header_global_27e6adccc951d3ae = ((((((1) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ee61d2ef0c12524ecb10a208() {
  return __cxx_static_address_ee61d2ef0c12524ecb10a208.reference || (__cxx_static_address_ee61d2ef0c12524ecb10a208.reference = {
    __cReference: true,
    get value() { return PISTOL_RICOCHET____header_global_27e6adccc951d3ae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:45
export const PISTOL_BODYHIT____header_global_aa42bc5337088f10 = ((((((2) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4fa768a2e62c1a1d244d592d() {
  return __cxx_static_address_4fa768a2e62c1a1d244d592d.reference || (__cxx_static_address_4fa768a2e62c1a1d244d592d.reference = {
    __cReference: true,
    get value() { return PISTOL_BODYHIT____header_global_aa42bc5337088f10; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:46
export const PISTOL_FIRE____header_global_fcc0b221675a9bf7 = ((((((3) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a4a7aeef6e8e981d5730a8b0() {
  return __cxx_static_address_a4a7aeef6e8e981d5730a8b0.reference || (__cxx_static_address_a4a7aeef6e8e981d5730a8b0.reference = {
    __cReference: true,
    get value() { return PISTOL_FIRE____header_global_fcc0b221675a9bf7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:47
export const EJECT_CLIP____header_global_7b4d979ab9b71c29 = ((((((4) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_22e4c8f2dbbdfca1e72dfa87() {
  return __cxx_static_address_22e4c8f2dbbdfca1e72dfa87.reference || (__cxx_static_address_22e4c8f2dbbdfca1e72dfa87.reference = {
    __cReference: true,
    get value() { return EJECT_CLIP____header_global_7b4d979ab9b71c29; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:48
export const INSERT_CLIP____header_global_ceed46c01685ebb9 = ((((((5) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a80905d151d0c7df2cd6145a() {
  return __cxx_static_address_a80905d151d0c7df2cd6145a.reference || (__cxx_static_address_a80905d151d0c7df2cd6145a.reference = {
    __cReference: true,
    get value() { return INSERT_CLIP____header_global_ceed46c01685ebb9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:49
export const CHAINGUN_FIRE____header_global_35b05e14525d11a2 = ((((((6) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_83984f718e5aef7ed1036730() {
  return __cxx_static_address_83984f718e5aef7ed1036730.reference || (__cxx_static_address_83984f718e5aef7ed1036730.reference = {
    __cReference: true,
    get value() { return CHAINGUN_FIRE____header_global_35b05e14525d11a2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:50
export const RPG_SHOOT____header_global_46837be23ce640c2 = ((((((7) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1a612e9b4a19efbac9b942ed() {
  return __cxx_static_address_1a612e9b4a19efbac9b942ed.reference || (__cxx_static_address_1a612e9b4a19efbac9b942ed.reference = {
    __cReference: true,
    get value() { return RPG_SHOOT____header_global_46837be23ce640c2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:51
export const POOLBALLHIT____header_global_61e3a310dc330f13 = ((((((8) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eac49dcc4e46e11c31769a30() {
  return __cxx_static_address_eac49dcc4e46e11c31769a30.reference || (__cxx_static_address_eac49dcc4e46e11c31769a30.reference = {
    __cReference: true,
    get value() { return POOLBALLHIT____header_global_61e3a310dc330f13; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:52
export const RPG_EXPLODE____header_global_95fe9ed726678def = ((((((9) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d7e7abc6807b743a3b579d91() {
  return __cxx_static_address_d7e7abc6807b743a3b579d91.reference || (__cxx_static_address_d7e7abc6807b743a3b579d91.reference = {
    __cReference: true,
    get value() { return RPG_EXPLODE____header_global_95fe9ed726678def; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:53
export const CAT_FIRE____header_global_b5adbb5c518f9977 = ((((((10) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_850653a940eb3acd27bd1cde() {
  return __cxx_static_address_850653a940eb3acd27bd1cde.reference || (__cxx_static_address_850653a940eb3acd27bd1cde.reference = {
    __cReference: true,
    get value() { return CAT_FIRE____header_global_b5adbb5c518f9977; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:54
export const SHRINKER_FIRE____header_global_31e0ae584cb563f0 = ((((((11) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0f064cd692b12336f8ce482f() {
  return __cxx_static_address_0f064cd692b12336f8ce482f.reference || (__cxx_static_address_0f064cd692b12336f8ce482f.reference = {
    __cReference: true,
    get value() { return SHRINKER_FIRE____header_global_31e0ae584cb563f0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:55
export const PIPEBOMB_BOUNCE____header_global_4909696a53880c95 = ((((((13) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_72ccf31dd98cb1aea65475d3() {
  return __cxx_static_address_72ccf31dd98cb1aea65475d3.reference || (__cxx_static_address_72ccf31dd98cb1aea65475d3.reference = {
    __cReference: true,
    get value() { return PIPEBOMB_BOUNCE____header_global_4909696a53880c95; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:56
export const PIPEBOMB_EXPLODE____header_global_a6974c5169cd921b = ((((((14) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_69cd67190b8f6f26a63f4acd() {
  return __cxx_static_address_69cd67190b8f6f26a63f4acd.reference || (__cxx_static_address_69cd67190b8f6f26a63f4acd.reference = {
    __cReference: true,
    get value() { return PIPEBOMB_EXPLODE____header_global_a6974c5169cd921b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:57
export const LASERTRIP_ONWALL____header_global_5e4a9c4e6a592e71 = ((((((15) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_de29d737832c60040273c721() {
  return __cxx_static_address_de29d737832c60040273c721.reference || (__cxx_static_address_de29d737832c60040273c721.reference = {
    __cReference: true,
    get value() { return LASERTRIP_ONWALL____header_global_5e4a9c4e6a592e71; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:58
export const LASERTRIP_ARMING____header_global_f6a5dba9bfd00212 = ((((((16) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cf04c77077970c9af409d166() {
  return __cxx_static_address_cf04c77077970c9af409d166.reference || (__cxx_static_address_cf04c77077970c9af409d166.reference = {
    __cReference: true,
    get value() { return LASERTRIP_ARMING____header_global_f6a5dba9bfd00212; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:59
export const LASERTRIP_EXPLODE____header_global_648a783e5a8a778c = ((((((17) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_263cd706e10d61bfb0b8e93e() {
  return __cxx_static_address_263cd706e10d61bfb0b8e93e.reference || (__cxx_static_address_263cd706e10d61bfb0b8e93e.reference = {
    __cReference: true,
    get value() { return LASERTRIP_EXPLODE____header_global_648a783e5a8a778c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:60
export const VENT_BUST____header_global_8154a6ab31a6aae5 = ((((((18) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d5c2f855b783f1e1ce6ee8b7() {
  return __cxx_static_address_d5c2f855b783f1e1ce6ee8b7.reference || (__cxx_static_address_d5c2f855b783f1e1ce6ee8b7.reference = {
    __cReference: true,
    get value() { return VENT_BUST____header_global_8154a6ab31a6aae5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:61
export const GLASS_BREAKING____header_global_f3894ba2a13e1d6c = ((((((19) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1f968d0254f2c6ef32cd40e1() {
  return __cxx_static_address_1f968d0254f2c6ef32cd40e1.reference || (__cxx_static_address_1f968d0254f2c6ef32cd40e1.reference = {
    __cReference: true,
    get value() { return GLASS_BREAKING____header_global_f3894ba2a13e1d6c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:62
export const GLASS_HEAVYBREAK____header_global_6026f5070936855a = ((((((20) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1676c0c750c1ac94f41b563c() {
  return __cxx_static_address_1676c0c750c1ac94f41b563c.reference || (__cxx_static_address_1676c0c750c1ac94f41b563c.reference = {
    __cReference: true,
    get value() { return GLASS_HEAVYBREAK____header_global_6026f5070936855a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:63
export const SHORT_CIRCUIT____header_global_afc6595cb2c0df6b = ((((((21) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8e66df2d2765bb3f1b396e34() {
  return __cxx_static_address_8e66df2d2765bb3f1b396e34.reference || (__cxx_static_address_8e66df2d2765bb3f1b396e34.reference = {
    __cReference: true,
    get value() { return SHORT_CIRCUIT____header_global_afc6595cb2c0df6b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:64
export const ITEM_SPLASH____header_global_7bb49dfa8664caf2 = ((((((22) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0860ba99fc274a0286a46073() {
  return __cxx_static_address_0860ba99fc274a0286a46073.reference || (__cxx_static_address_0860ba99fc274a0286a46073.reference = {
    __cReference: true,
    get value() { return ITEM_SPLASH____header_global_7bb49dfa8664caf2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:65
export const DUKE_GASP____header_global_dda0aa511e9658c4 = ((((((25) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3a41836972a28bb4cfe74f5d() {
  return __cxx_static_address_3a41836972a28bb4cfe74f5d.reference || (__cxx_static_address_3a41836972a28bb4cfe74f5d.reference = {
    __cReference: true,
    get value() { return DUKE_GASP____header_global_dda0aa511e9658c4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:66
export const SLIM_RECOG____header_global_3789e9b2e39ae4ad = ((((((26) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b682b089e6c9b085d779d749() {
  return __cxx_static_address_b682b089e6c9b085d779d749.reference || (__cxx_static_address_b682b089e6c9b085d779d749.reference = {
    __cReference: true,
    get value() { return SLIM_RECOG____header_global_3789e9b2e39ae4ad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:67
export const DUKE_URINATE____header_global_542c91fe9a89714b = ((((((28) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ca6735bb9afebde140b9b75a() {
  return __cxx_static_address_ca6735bb9afebde140b9b75a.reference || (__cxx_static_address_ca6735bb9afebde140b9b75a.reference = {
    __cReference: true,
    get value() { return DUKE_URINATE____header_global_542c91fe9a89714b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:68
export const ENDSEQVOL3SND2____header_global_9823eda616fbd91c = ((((((29) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2cdf9f372cf93444e87bce9b() {
  return __cxx_static_address_2cdf9f372cf93444e87bce9b.reference || (__cxx_static_address_2cdf9f372cf93444e87bce9b.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND2____header_global_9823eda616fbd91c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:69
export const ENDSEQVOL3SND3____header_global_479356daa028cb28 = ((((((30) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0d18bf5c8e9c89dedcbc91da() {
  return __cxx_static_address_0d18bf5c8e9c89dedcbc91da.reference || (__cxx_static_address_0d18bf5c8e9c89dedcbc91da.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND3____header_global_479356daa028cb28; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:70
export const DUKE_CRACK____header_global_5c8eab05cfe69fdc = ((((((33) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d271e03a15575b909881bda1() {
  return __cxx_static_address_d271e03a15575b909881bda1.reference || (__cxx_static_address_d271e03a15575b909881bda1.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK____header_global_5c8eab05cfe69fdc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:71
export const SLIM_ATTACK____header_global_69976a7bb997856a = ((((((34) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4524d86b825c501f4665fefd() {
  return __cxx_static_address_4524d86b825c501f4665fefd.reference || (__cxx_static_address_4524d86b825c501f4665fefd.reference = {
    __cReference: true,
    get value() { return SLIM_ATTACK____header_global_69976a7bb997856a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:72
export const SOMETHINGHITFORCE____header_global_8d19dc0cedc77f98 = ((((((35) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c0286179b359fde97d674639() {
  return __cxx_static_address_c0286179b359fde97d674639.reference || (__cxx_static_address_c0286179b359fde97d674639.reference = {
    __cReference: true,
    get value() { return SOMETHINGHITFORCE____header_global_8d19dc0cedc77f98; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:73
export const DUKE_DRINKING____header_global_0e77e63b8579c243 = ((((((36) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e39cdf9718915f18e46325af() {
  return __cxx_static_address_e39cdf9718915f18e46325af.reference || (__cxx_static_address_e39cdf9718915f18e46325af.reference = {
    __cReference: true,
    get value() { return DUKE_DRINKING____header_global_0e77e63b8579c243; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:74
export const DUKE_GRUNT____header_global_f0ded0162255ed72 = ((((((38) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_afb0b0ab00c83d84f9eba4b2() {
  return __cxx_static_address_afb0b0ab00c83d84f9eba4b2.reference || (__cxx_static_address_afb0b0ab00c83d84f9eba4b2.reference = {
    __cReference: true,
    get value() { return DUKE_GRUNT____header_global_f0ded0162255ed72; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:75
export const DUKE_HARTBEAT____header_global_f50a7851ccc01a63 = ((((((39) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f6adf611dba4f95356cad6e5() {
  return __cxx_static_address_f6adf611dba4f95356cad6e5.reference || (__cxx_static_address_f6adf611dba4f95356cad6e5.reference = {
    __cReference: true,
    get value() { return DUKE_HARTBEAT____header_global_f50a7851ccc01a63; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:76
export const DUKE_ONWATER____header_global_d70b7c1062649a23 = ((((((40) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_03aca517de3224d2c555303d() {
  return __cxx_static_address_03aca517de3224d2c555303d.reference || (__cxx_static_address_03aca517de3224d2c555303d.reference = {
    __cReference: true,
    get value() { return DUKE_ONWATER____header_global_d70b7c1062649a23; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:77
export const DUKE_LAND____header_global_574565b4fe065c1c = ((((((42) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bc116f4cdd79e84d32d84582() {
  return __cxx_static_address_bc116f4cdd79e84d32d84582.reference || (__cxx_static_address_bc116f4cdd79e84d32d84582.reference = {
    __cReference: true,
    get value() { return DUKE_LAND____header_global_574565b4fe065c1c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:78
export const DUKE_WALKINDUCTS____header_global_15f5b9850799b9bb = ((((((43) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b11024aae98ca2c40c8f2fdd() {
  return __cxx_static_address_b11024aae98ca2c40c8f2fdd.reference || (__cxx_static_address_b11024aae98ca2c40c8f2fdd.reference = {
    __cReference: true,
    get value() { return DUKE_WALKINDUCTS____header_global_15f5b9850799b9bb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:79
export const DUKE_UNDERWATER____header_global_bfc1ba087a7e7d6c = ((((((48) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_080efee246348fd7a56863d8() {
  return __cxx_static_address_080efee246348fd7a56863d8.reference || (__cxx_static_address_080efee246348fd7a56863d8.reference = {
    __cReference: true,
    get value() { return DUKE_UNDERWATER____header_global_bfc1ba087a7e7d6c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:80
export const DUKE_JETPACK_ON____header_global_73da6b9c6ec492ea = ((((((49) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_212a6b934f3d009f0642a0f7() {
  return __cxx_static_address_212a6b934f3d009f0642a0f7.reference || (__cxx_static_address_212a6b934f3d009f0642a0f7.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_ON____header_global_73da6b9c6ec492ea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:81
export const DUKE_JETPACK_IDLE____header_global_319fea730e40f3b4 = ((((((50) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_16b3492cf9bdb8f52e2d39fd() {
  return __cxx_static_address_16b3492cf9bdb8f52e2d39fd.reference || (__cxx_static_address_16b3492cf9bdb8f52e2d39fd.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_IDLE____header_global_319fea730e40f3b4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:82
export const DUKE_JETPACK_OFF____header_global_6db581a7374f827e = ((((((51) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8c8423b0c1f260e10175b70e() {
  return __cxx_static_address_8c8423b0c1f260e10175b70e.reference || (__cxx_static_address_8c8423b0c1f260e10175b70e.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_OFF____header_global_6db581a7374f827e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:83
export const DUKETALKTOBOSS____header_global_9cd83eb2df8c3a53 = ((((((56) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_653b239e5e6747c9c5712b63() {
  return __cxx_static_address_653b239e5e6747c9c5712b63.reference || (__cxx_static_address_653b239e5e6747c9c5712b63.reference = {
    __cReference: true,
    get value() { return DUKETALKTOBOSS____header_global_9cd83eb2df8c3a53; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:84
export const SQUISHED____header_global_82fc72d7fd99e800 = ((((((69) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2ea73343fc23b97a247c770c() {
  return __cxx_static_address_2ea73343fc23b97a247c770c.reference || (__cxx_static_address_2ea73343fc23b97a247c770c.reference = {
    __cReference: true,
    get value() { return SQUISHED____header_global_82fc72d7fd99e800; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:85
export const TELEPORTER____header_global_6f73703b8bf5f6d3 = ((((((70) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ad6511b447f6613ae2d1aeeb() {
  return __cxx_static_address_ad6511b447f6613ae2d1aeeb.reference || (__cxx_static_address_ad6511b447f6613ae2d1aeeb.reference = {
    __cReference: true,
    get value() { return TELEPORTER____header_global_6f73703b8bf5f6d3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:86
export const ELEVATOR_ON____header_global_dbce6df080c6aa77 = ((((((71) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4a0fb6b6b32c62ab7f10d114() {
  return __cxx_static_address_4a0fb6b6b32c62ab7f10d114.reference || (__cxx_static_address_4a0fb6b6b32c62ab7f10d114.reference = {
    __cReference: true,
    get value() { return ELEVATOR_ON____header_global_dbce6df080c6aa77; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:87
export const ELEVATOR_OFF____header_global_bfd05f8c7251099c = ((((((73) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3a31345ec431f467ca2e5142() {
  return __cxx_static_address_3a31345ec431f467ca2e5142.reference || (__cxx_static_address_3a31345ec431f467ca2e5142.reference = {
    __cReference: true,
    get value() { return ELEVATOR_OFF____header_global_bfd05f8c7251099c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:88
export const SUBWAY____header_global_075727d7567632c6 = ((((((75) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_34b79b6eb90176cc916581c6() {
  return __cxx_static_address_34b79b6eb90176cc916581c6.reference || (__cxx_static_address_34b79b6eb90176cc916581c6.reference = {
    __cReference: true,
    get value() { return SUBWAY____header_global_075727d7567632c6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:89
export const SWITCH_ON____header_global_6e4989da3865473f = ((((((76) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0fcf5ed09317827f0785294b() {
  return __cxx_static_address_0fcf5ed09317827f0785294b.reference || (__cxx_static_address_0fcf5ed09317827f0785294b.reference = {
    __cReference: true,
    get value() { return SWITCH_ON____header_global_6e4989da3865473f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:90
export const FLUSH_TOILET____header_global_bbac99ecf8d5aef5 = ((((((79) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a52ca07a5f7a36ee5de5f189() {
  return __cxx_static_address_a52ca07a5f7a36ee5de5f189.reference || (__cxx_static_address_a52ca07a5f7a36ee5de5f189.reference = {
    __cReference: true,
    get value() { return FLUSH_TOILET____header_global_bbac99ecf8d5aef5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:91
export const EARTHQUAKE____header_global_060bfb9043bd26c6 = ((((((81) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_126466d4671ec994846ae7ac() {
  return __cxx_static_address_126466d4671ec994846ae7ac.reference || (__cxx_static_address_126466d4671ec994846ae7ac.reference = {
    __cReference: true,
    get value() { return EARTHQUAKE____header_global_060bfb9043bd26c6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:92
export const END_OF_LEVEL_WARN____header_global_d9b62b577396aa52 = ((((((83) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f71bbe00dc6ae6ab80e6d451() {
  return __cxx_static_address_f71bbe00dc6ae6ab80e6d451.reference || (__cxx_static_address_f71bbe00dc6ae6ab80e6d451.reference = {
    __cReference: true,
    get value() { return END_OF_LEVEL_WARN____header_global_d9b62b577396aa52; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:93
export const WIND_AMBIENCE____header_global_b31f8ed84e93fbb6 = ((((((91) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a286eb1e90ab26e317fb72b1() {
  return __cxx_static_address_a286eb1e90ab26e317fb72b1.reference || (__cxx_static_address_a286eb1e90ab26e317fb72b1.reference = {
    __cReference: true,
    get value() { return WIND_AMBIENCE____header_global_b31f8ed84e93fbb6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:94
export const SOMETHING_DRIPPING____header_global_935ba4b902328f61 = ((((((92) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1bea033dc2fd59fbe8ce1488() {
  return __cxx_static_address_1bea033dc2fd59fbe8ce1488.reference || (__cxx_static_address_1bea033dc2fd59fbe8ce1488.reference = {
    __cReference: true,
    get value() { return SOMETHING_DRIPPING____header_global_935ba4b902328f61; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:95
export const BOS1_RECOG____header_global_ccc07f43047c71cf = ((((((97) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4262523cac5a65ab38e6a2e8() {
  return __cxx_static_address_4262523cac5a65ab38e6a2e8.reference || (__cxx_static_address_4262523cac5a65ab38e6a2e8.reference = {
    __cReference: true,
    get value() { return BOS1_RECOG____header_global_ccc07f43047c71cf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:96
export const BOS2_RECOG____header_global_aedd077b325baea5 = ((((((102) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c2419eac3d25e2693cc378af() {
  return __cxx_static_address_c2419eac3d25e2693cc378af.reference || (__cxx_static_address_c2419eac3d25e2693cc378af.reference = {
    __cReference: true,
    get value() { return BOS2_RECOG____header_global_aedd077b325baea5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:97
export const DUKE_GETWEAPON2____header_global_26bc579575af7bb1 = ((((((107) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_191448c11387dc3d696ec034() {
  return __cxx_static_address_191448c11387dc3d696ec034.reference || (__cxx_static_address_191448c11387dc3d696ec034.reference = {
    __cReference: true,
    get value() { return DUKE_GETWEAPON2____header_global_26bc579575af7bb1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:98
export const SHOTGUN_FIRE____header_global_50630178a054fe97 = ((((((109) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e18aed24823dfb9ba33a0a2f() {
  return __cxx_static_address_e18aed24823dfb9ba33a0a2f.reference || (__cxx_static_address_e18aed24823dfb9ba33a0a2f.reference = {
    __cReference: true,
    get value() { return SHOTGUN_FIRE____header_global_50630178a054fe97; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:99
export const PRED_RECOG____header_global_1378d9a1e04593b5 = ((((((111) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e3808a572f188f632a6ea38f() {
  return __cxx_static_address_e3808a572f188f632a6ea38f.reference || (__cxx_static_address_e3808a572f188f632a6ea38f.reference = {
    __cReference: true,
    get value() { return PRED_RECOG____header_global_1378d9a1e04593b5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:100
export const CAPT_RECOG____header_global_d1b05c653e4d221e = ((((((117) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_32db8089868d48cdef119d85() {
  return __cxx_static_address_32db8089868d48cdef119d85.reference || (__cxx_static_address_32db8089868d48cdef119d85.reference = {
    __cReference: true,
    get value() { return CAPT_RECOG____header_global_d1b05c653e4d221e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:101
export const PIG_RECOG____header_global_c74cc3f9f3a0d39b = ((((((121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7c0c4eae420cd5789ffe009a() {
  return __cxx_static_address_7c0c4eae420cd5789ffe009a.reference || (__cxx_static_address_7c0c4eae420cd5789ffe009a.reference = {
    __cReference: true,
    get value() { return PIG_RECOG____header_global_c74cc3f9f3a0d39b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:102
export const RECO_ROAM____header_global_162c8a594af38fab = ((((((125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2a5ec23b2e694dd6b78572a8() {
  return __cxx_static_address_2a5ec23b2e694dd6b78572a8.reference || (__cxx_static_address_2a5ec23b2e694dd6b78572a8.reference = {
    __cReference: true,
    get value() { return RECO_ROAM____header_global_162c8a594af38fab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:103
export const RECO_RECOG____header_global_18de9a77b51b654f = ((((((126) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9365fe43987ca80c151a2026() {
  return __cxx_static_address_9365fe43987ca80c151a2026.reference || (__cxx_static_address_9365fe43987ca80c151a2026.reference = {
    __cReference: true,
    get value() { return RECO_RECOG____header_global_18de9a77b51b654f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:104
export const RECO_ATTACK____header_global_5a2d5c1743a5f161 = ((((((127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_95e274b4ed4277832583ff13() {
  return __cxx_static_address_95e274b4ed4277832583ff13.reference || (__cxx_static_address_95e274b4ed4277832583ff13.reference = {
    __cReference: true,
    get value() { return RECO_ATTACK____header_global_5a2d5c1743a5f161; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:105
export const RECO_PAIN____header_global_8b926276239d374e = ((((((128) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ecff4685965b61ca348b9b54() {
  return __cxx_static_address_ecff4685965b61ca348b9b54.reference || (__cxx_static_address_ecff4685965b61ca348b9b54.reference = {
    __cReference: true,
    get value() { return RECO_PAIN____header_global_8b926276239d374e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:106
export const DRON_RECOG____header_global_c6b13920bc110bb4 = ((((((131) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_daa49fbab800b6728c4a9794() {
  return __cxx_static_address_daa49fbab800b6728c4a9794.reference || (__cxx_static_address_daa49fbab800b6728c4a9794.reference = {
    __cReference: true,
    get value() { return DRON_RECOG____header_global_c6b13920bc110bb4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:107
export const COMM_RECOG____header_global_65b89b75e9a9d224 = ((((((136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_972dd84f1e6d0c1e2c01f051() {
  return __cxx_static_address_972dd84f1e6d0c1e2c01f051.reference || (__cxx_static_address_972dd84f1e6d0c1e2c01f051.reference = {
    __cReference: true,
    get value() { return COMM_RECOG____header_global_65b89b75e9a9d224; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:108
export const OCTA_RECOG____header_global_b1919856318265e2 = ((((((141) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a1dfc1d4dd832374a92a3c9d() {
  return __cxx_static_address_a1dfc1d4dd832374a92a3c9d.reference || (__cxx_static_address_a1dfc1d4dd832374a92a3c9d.reference = {
    __cReference: true,
    get value() { return OCTA_RECOG____header_global_b1919856318265e2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:109
export const TURR_RECOG____header_global_8d3fe7f90734562f = ((((((146) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b842317866cb2df0bacb6454() {
  return __cxx_static_address_b842317866cb2df0bacb6454.reference || (__cxx_static_address_b842317866cb2df0bacb6454.reference = {
    __cReference: true,
    get value() { return TURR_RECOG____header_global_8d3fe7f90734562f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:110
export const SLIM_DYING____header_global_822d7a36601be4d3 = ((((((149) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a61c53d0e64336bd3b11c15f() {
  return __cxx_static_address_a61c53d0e64336bd3b11c15f.reference || (__cxx_static_address_a61c53d0e64336bd3b11c15f.reference = {
    __cReference: true,
    get value() { return SLIM_DYING____header_global_822d7a36601be4d3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:111
export const BOS3_RECOG____header_global_ae1f77f9d75240be = ((((((151) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8f02f36595debc207d7fa6e6() {
  return __cxx_static_address_8f02f36595debc207d7fa6e6.reference || (__cxx_static_address_8f02f36595debc207d7fa6e6.reference = {
    __cReference: true,
    get value() { return BOS3_RECOG____header_global_ae1f77f9d75240be; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:112
export const BOS1_WALK____header_global_675c35ef48276615 = ((((((156) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a642656cbe565de3bcf550bf() {
  return __cxx_static_address_a642656cbe565de3bcf550bf.reference || (__cxx_static_address_a642656cbe565de3bcf550bf.reference = {
    __cReference: true,
    get value() { return BOS1_WALK____header_global_675c35ef48276615; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:113
export const THUD____header_global_9ddb6782f2d6cf76 = ((((((158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5727ab1014eadb40f0d20b8a() {
  return __cxx_static_address_5727ab1014eadb40f0d20b8a.reference || (__cxx_static_address_5727ab1014eadb40f0d20b8a.reference = {
    __cReference: true,
    get value() { return THUD____header_global_9ddb6782f2d6cf76; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:114
export const WIERDSHOT_FLY____header_global_ccaab5387a78a88d = ((((((160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a7582ab471c3f7a2b112078b() {
  return __cxx_static_address_a7582ab471c3f7a2b112078b.reference || (__cxx_static_address_a7582ab471c3f7a2b112078b.reference = {
    __cReference: true,
    get value() { return WIERDSHOT_FLY____header_global_ccaab5387a78a88d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:115
export const SLIM_ROAM____header_global_247cea3212fc204f = ((((((163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fd347eb940e63d2d5242b1e8() {
  return __cxx_static_address_fd347eb940e63d2d5242b1e8.reference || (__cxx_static_address_fd347eb940e63d2d5242b1e8.reference = {
    __cReference: true,
    get value() { return SLIM_ROAM____header_global_247cea3212fc204f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:116
export const SHOTGUN_COCK____header_global_6682b9e8b07a2981 = ((((((169) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f09edc0bc8d2daf78531efa6() {
  return __cxx_static_address_f09edc0bc8d2daf78531efa6.reference || (__cxx_static_address_f09edc0bc8d2daf78531efa6.reference = {
    __cReference: true,
    get value() { return SHOTGUN_COCK____header_global_6682b9e8b07a2981; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:117
export const GENERIC_AMBIENCE17____header_global_b26f6196486d67a7 = ((((((177) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_056815bbd1f28c8cd75f4dcf() {
  return __cxx_static_address_056815bbd1f28c8cd75f4dcf.reference || (__cxx_static_address_056815bbd1f28c8cd75f4dcf.reference = {
    __cReference: true,
    get value() { return GENERIC_AMBIENCE17____header_global_b26f6196486d67a7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:118
export const BONUS_SPEECH1____header_global_2c3b71ba520479e2 = ((((((195) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_616f64c81453184d11d7974d() {
  return __cxx_static_address_616f64c81453184d11d7974d.reference || (__cxx_static_address_616f64c81453184d11d7974d.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH1____header_global_2c3b71ba520479e2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:119
export const BONUS_SPEECH2____header_global_8a5bb4e18b385367 = ((((((196) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_00b0d0ee087a383f8f2c4aa3() {
  return __cxx_static_address_00b0d0ee087a383f8f2c4aa3.reference || (__cxx_static_address_00b0d0ee087a383f8f2c4aa3.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH2____header_global_8a5bb4e18b385367; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:120
export const BONUS_SPEECH3____header_global_2746d4db1242955e = ((((((197) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_76e14858b769b52dc7b17c57() {
  return __cxx_static_address_76e14858b769b52dc7b17c57.reference || (__cxx_static_address_76e14858b769b52dc7b17c57.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH3____header_global_2746d4db1242955e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:121
export const BONUS_SPEECH4____header_global_e69368eabf327f2d = ((((((199) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dfaba140f9025f888f9c32ce() {
  return __cxx_static_address_dfaba140f9025f888f9c32ce.reference || (__cxx_static_address_dfaba140f9025f888f9c32ce.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH4____header_global_e69368eabf327f2d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:122
export const DUKE_LAND_HURT____header_global_1bad2ecbed251aaa = ((((((200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d67e06c3cf7c118555858397() {
  return __cxx_static_address_d67e06c3cf7c118555858397.reference || (__cxx_static_address_d67e06c3cf7c118555858397.reference = {
    __cReference: true,
    get value() { return DUKE_LAND_HURT____header_global_1bad2ecbed251aaa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:123
export const DUKE_SEARCH2____header_global_2a0fc9d67dab39b2 = ((((((207) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_da08bdb725720c1581d7b72d() {
  return __cxx_static_address_da08bdb725720c1581d7b72d.reference || (__cxx_static_address_da08bdb725720c1581d7b72d.reference = {
    __cReference: true,
    get value() { return DUKE_SEARCH2____header_global_2a0fc9d67dab39b2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:124
export const DUKE_CRACK2____header_global_6a33e5f8e3080053 = ((((((208) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d9db59444939e4f3603f19e9() {
  return __cxx_static_address_d9db59444939e4f3603f19e9.reference || (__cxx_static_address_d9db59444939e4f3603f19e9.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK2____header_global_6a33e5f8e3080053; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:125
export const DUKE_SEARCH____header_global_0307b40bafe5ee90 = ((((((209) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4511ac026f7fefa1ebf9eca0() {
  return __cxx_static_address_4511ac026f7fefa1ebf9eca0.reference || (__cxx_static_address_4511ac026f7fefa1ebf9eca0.reference = {
    __cReference: true,
    get value() { return DUKE_SEARCH____header_global_0307b40bafe5ee90; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:126
export const DUKE_GET____header_global_6a0d98e1955b3604 = ((((((210) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8d400fa06da0f522a63a152d() {
  return __cxx_static_address_8d400fa06da0f522a63a152d.reference || (__cxx_static_address_8d400fa06da0f522a63a152d.reference = {
    __cReference: true,
    get value() { return DUKE_GET____header_global_6a0d98e1955b3604; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:127
export const DUKE_LONGTERM_PAIN____header_global_96217941733ab01c = ((((((211) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e680bd6edb53f5eddab2799d() {
  return __cxx_static_address_e680bd6edb53f5eddab2799d.reference || (__cxx_static_address_e680bd6edb53f5eddab2799d.reference = {
    __cReference: true,
    get value() { return DUKE_LONGTERM_PAIN____header_global_96217941733ab01c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:128
export const MONITOR_ACTIVE____header_global_9c9e7234288fbb6a = ((((((212) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3cd3e42a37fc156c5073daea() {
  return __cxx_static_address_3cd3e42a37fc156c5073daea.reference || (__cxx_static_address_3cd3e42a37fc156c5073daea.reference = {
    __cReference: true,
    get value() { return MONITOR_ACTIVE____header_global_9c9e7234288fbb6a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:129
export const NITEVISION_ONOFF____header_global_f923d296bb9600fe = ((((((213) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5972e55372e332fffbaee497() {
  return __cxx_static_address_5972e55372e332fffbaee497.reference || (__cxx_static_address_5972e55372e332fffbaee497.reference = {
    __cReference: true,
    get value() { return NITEVISION_ONOFF____header_global_f923d296bb9600fe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:130
export const DUKE_CRACK_FIRST____header_global_1534f71ce1744f1c = ((((((215) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_11f2d624674af7d4eebb9db2() {
  return __cxx_static_address_11f2d624674af7d4eebb9db2.reference || (__cxx_static_address_11f2d624674af7d4eebb9db2.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK_FIRST____header_global_1534f71ce1744f1c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:131
export const DUKE_USEMEDKIT____header_global_cd268bcaf6948619 = ((((((216) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_17b406766bc0e55e6ef53596() {
  return __cxx_static_address_17b406766bc0e55e6ef53596.reference || (__cxx_static_address_17b406766bc0e55e6ef53596.reference = {
    __cReference: true,
    get value() { return DUKE_USEMEDKIT____header_global_cd268bcaf6948619; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:132
export const DUKE_TAKEPILLS____header_global_2fcc08e90600a77e = ((((((217) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_465b0c253058d47dc2c82c05() {
  return __cxx_static_address_465b0c253058d47dc2c82c05.reference || (__cxx_static_address_465b0c253058d47dc2c82c05.reference = {
    __cReference: true,
    get value() { return DUKE_TAKEPILLS____header_global_2fcc08e90600a77e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:133
export const DUKE_PISSRELIEF____header_global_6a9cab482dd5159c = ((((((218) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8d0236d9c01eee528b1452dc() {
  return __cxx_static_address_8d0236d9c01eee528b1452dc.reference || (__cxx_static_address_8d0236d9c01eee528b1452dc.reference = {
    __cReference: true,
    get value() { return DUKE_PISSRELIEF____header_global_6a9cab482dd5159c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:134
export const SELECT_WEAPON____header_global_edb2ab5030ac6ddf = ((((((219) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_345260304493d3dace567157() {
  return __cxx_static_address_345260304493d3dace567157.reference || (__cxx_static_address_345260304493d3dace567157.reference = {
    __cReference: true,
    get value() { return SELECT_WEAPON____header_global_edb2ab5030ac6ddf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:135
export const JIBBED_ACTOR5____header_global_f8cde5049dd37181 = ((((((226) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b4a9fbbec7ecd5096c88cfff() {
  return __cxx_static_address_b4a9fbbec7ecd5096c88cfff.reference || (__cxx_static_address_b4a9fbbec7ecd5096c88cfff.reference = {
    __cReference: true,
    get value() { return JIBBED_ACTOR5____header_global_f8cde5049dd37181; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:136
export const JIBBED_ACTOR6____header_global_23c8d707876eb242 = ((((((227) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_60470670005cf07d207c1989() {
  return __cxx_static_address_60470670005cf07d207c1989.reference || (__cxx_static_address_60470670005cf07d207c1989.reference = {
    __cReference: true,
    get value() { return JIBBED_ACTOR6____header_global_23c8d707876eb242; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:137
export const DUKE_GOTHEALTHATLOW____header_global_4605bf17b15c97b7 = ((((((229) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_743a4cfdabc518f19cf15346() {
  return __cxx_static_address_743a4cfdabc518f19cf15346.reference || (__cxx_static_address_743a4cfdabc518f19cf15346.reference = {
    __cReference: true,
    get value() { return DUKE_GOTHEALTHATLOW____header_global_4605bf17b15c97b7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:138
export const BOSSTALKTODUKE____header_global_c6cd8fbab0ee2d2e = ((((((230) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_10810a3d5fc91772d9f42c58() {
  return __cxx_static_address_10810a3d5fc91772d9f42c58.reference || (__cxx_static_address_10810a3d5fc91772d9f42c58.reference = {
    __cReference: true,
    get value() { return BOSSTALKTODUKE____header_global_c6cd8fbab0ee2d2e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:139
export const WAR_AMBIENCE2____header_global_a25574e3a0322c95 = ((((((232) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_88fe758a9bd92782a5932243() {
  return __cxx_static_address_88fe758a9bd92782a5932243.reference || (__cxx_static_address_88fe758a9bd92782a5932243.reference = {
    __cReference: true,
    get value() { return WAR_AMBIENCE2____header_global_a25574e3a0322c95; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:140
export const EXITMENUSOUND____header_global_05b2a464cc6bb977 = ((((((243) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e93871bbfae480003a113d48() {
  return __cxx_static_address_e93871bbfae480003a113d48.reference || (__cxx_static_address_e93871bbfae480003a113d48.reference = {
    __cReference: true,
    get value() { return EXITMENUSOUND____header_global_05b2a464cc6bb977; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:141
export const FLY_BY____header_global_02087013fcd9d797 = ((((((244) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_33127164f6599fc56b5ec1ac() {
  return __cxx_static_address_33127164f6599fc56b5ec1ac.reference || (__cxx_static_address_33127164f6599fc56b5ec1ac.reference = {
    __cReference: true,
    get value() { return FLY_BY____header_global_02087013fcd9d797; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:142
export const DUKE_SCREAM____header_global_c808c10e5c746d42 = ((((((245) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9c520640d956418410dde93b() {
  return __cxx_static_address_9c520640d956418410dde93b.reference || (__cxx_static_address_9c520640d956418410dde93b.reference = {
    __cReference: true,
    get value() { return DUKE_SCREAM____header_global_c808c10e5c746d42; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:143
export const SHRINKER_HIT____header_global_dc5b3225002eeb13 = ((((((246) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6975c8d01c4943f028ce5041() {
  return __cxx_static_address_6975c8d01c4943f028ce5041.reference || (__cxx_static_address_6975c8d01c4943f028ce5041.reference = {
    __cReference: true,
    get value() { return SHRINKER_HIT____header_global_dc5b3225002eeb13; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:144
export const RATTY____header_global_02fce17c0cb7ec22 = ((((((247) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f06767b306fcfbb7c9997cef() {
  return __cxx_static_address_f06767b306fcfbb7c9997cef.reference || (__cxx_static_address_f06767b306fcfbb7c9997cef.reference = {
    __cReference: true,
    get value() { return RATTY____header_global_02fce17c0cb7ec22; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:145
export const BONUSMUSIC____header_global_2dfd6f148fe018b5 = ((((((249) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_72fb8842add47ca90a7bcb5b() {
  return __cxx_static_address_72fb8842add47ca90a7bcb5b.reference || (__cxx_static_address_72fb8842add47ca90a7bcb5b.reference = {
    __cReference: true,
    get value() { return BONUSMUSIC____header_global_2dfd6f148fe018b5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:146
export const DUKE_GETWEAPON6____header_global_621defea7939bb68 = ((((((264) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_22683dad0a9028f2d88d6635() {
  return __cxx_static_address_22683dad0a9028f2d88d6635.reference || (__cxx_static_address_22683dad0a9028f2d88d6635.reference = {
    __cReference: true,
    get value() { return DUKE_GETWEAPON6____header_global_621defea7939bb68; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:147
export const ALIEN_SWITCH1____header_global_c4e2dda2891a61ae = ((((((272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_008af886010b427429992408() {
  return __cxx_static_address_008af886010b427429992408.reference || (__cxx_static_address_008af886010b427429992408.reference = {
    __cReference: true,
    get value() { return ALIEN_SWITCH1____header_global_c4e2dda2891a61ae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:148
export const RIPHEADNECK____header_global_f47d1fcb50c370d5 = ((((((284) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_97ae88e6a75ec9d3bb2e1d99() {
  return __cxx_static_address_97ae88e6a75ec9d3bb2e1d99.reference || (__cxx_static_address_97ae88e6a75ec9d3bb2e1d99.reference = {
    __cReference: true,
    get value() { return RIPHEADNECK____header_global_f47d1fcb50c370d5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:149
export const ENDSEQVOL3SND4____header_global_371aba5bac23b62a = ((((((288) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_69cc0c0b2c9730bf0609be92() {
  return __cxx_static_address_69cc0c0b2c9730bf0609be92.reference || (__cxx_static_address_69cc0c0b2c9730bf0609be92.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND4____header_global_371aba5bac23b62a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:150
export const ENDSEQVOL3SND5____header_global_bd09663e19bce120 = ((((((289) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d27778fe8317815cc0a6ef84() {
  return __cxx_static_address_d27778fe8317815cc0a6ef84.reference || (__cxx_static_address_d27778fe8317815cc0a6ef84.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND5____header_global_bd09663e19bce120; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:151
export const ENDSEQVOL3SND6____header_global_fb1a76f2a348b8f3 = ((((((290) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6ffbaf0bbba732c6ea43fe83() {
  return __cxx_static_address_6ffbaf0bbba732c6ea43fe83.reference || (__cxx_static_address_6ffbaf0bbba732c6ea43fe83.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND6____header_global_fb1a76f2a348b8f3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:152
export const ENDSEQVOL3SND7____header_global_3b8d57c6b44223e8 = ((((((291) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cff70a5b9e9abbf62637ee65() {
  return __cxx_static_address_cff70a5b9e9abbf62637ee65.reference || (__cxx_static_address_cff70a5b9e9abbf62637ee65.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND7____header_global_3b8d57c6b44223e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:153
export const ENDSEQVOL3SND8____header_global_c088af833aa79835 = ((((((292) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e3b665c09b5a3c67dbe25a13() {
  return __cxx_static_address_e3b665c09b5a3c67dbe25a13.reference || (__cxx_static_address_e3b665c09b5a3c67dbe25a13.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND8____header_global_c088af833aa79835; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:154
export const ENDSEQVOL3SND9____header_global_38482c11cd123cc3 = ((((((293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2e3628fba80cd914d476e69f() {
  return __cxx_static_address_2e3628fba80cd914d476e69f.reference || (__cxx_static_address_2e3628fba80cd914d476e69f.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND9____header_global_38482c11cd123cc3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:155
export const WHIPYOURASS____header_global_091b89dc7b368b4b = ((((((294) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9f80ea6abff7bbf7b7bc0ba2() {
  return __cxx_static_address_9f80ea6abff7bbf7b7bc0ba2.reference || (__cxx_static_address_9f80ea6abff7bbf7b7bc0ba2.reference = {
    __cReference: true,
    get value() { return WHIPYOURASS____header_global_091b89dc7b368b4b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:156
export const ENDSEQVOL2SND1____header_global_32b80125ac477aca = ((((((295) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7e4b913d6f03434789ebbe51() {
  return __cxx_static_address_7e4b913d6f03434789ebbe51.reference || (__cxx_static_address_7e4b913d6f03434789ebbe51.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND1____header_global_32b80125ac477aca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:157
export const ENDSEQVOL2SND2____header_global_f524d8a1d180ca20 = ((((((296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c99683d748f5ff8505dd871c() {
  return __cxx_static_address_c99683d748f5ff8505dd871c.reference || (__cxx_static_address_c99683d748f5ff8505dd871c.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND2____header_global_f524d8a1d180ca20; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:158
export const ENDSEQVOL2SND3____header_global_e172c3322a523a53 = ((((((297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5f69d8474415c18c95a1af37() {
  return __cxx_static_address_5f69d8474415c18c95a1af37.reference || (__cxx_static_address_5f69d8474415c18c95a1af37.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND3____header_global_e172c3322a523a53; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:159
export const ENDSEQVOL2SND4____header_global_418aca843f3801a2 = ((((((298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9f6a9c0ef19b2597954af938() {
  return __cxx_static_address_9f6a9c0ef19b2597954af938.reference || (__cxx_static_address_9f6a9c0ef19b2597954af938.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND4____header_global_418aca843f3801a2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:160
export const ENDSEQVOL2SND5____header_global_2906d5d9d78c37af = ((((((299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9d968c4a1733ab2d96e7b806() {
  return __cxx_static_address_9d968c4a1733ab2d96e7b806.reference || (__cxx_static_address_9d968c4a1733ab2d96e7b806.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND5____header_global_2906d5d9d78c37af; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:161
export const ENDSEQVOL2SND6____header_global_6b00a64069063e35 = ((((((300) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e370042159f86719900018b5() {
  return __cxx_static_address_e370042159f86719900018b5.reference || (__cxx_static_address_e370042159f86719900018b5.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND6____header_global_6b00a64069063e35; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:162
export const ENDSEQVOL2SND7____header_global_9d04ec66c5b44c4f = ((((((301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_213f5f5f5f4e222a2767fead() {
  return __cxx_static_address_213f5f5f5f4e222a2767fead.reference || (__cxx_static_address_213f5f5f5f4e222a2767fead.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND7____header_global_9d04ec66c5b44c4f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:163
export const SOMETHINGFROZE____header_global_5eafec038e1d8b8e = ((((((303) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_be692fc895e6f8dd6667a27f() {
  return __cxx_static_address_be692fc895e6f8dd6667a27f.reference || (__cxx_static_address_be692fc895e6f8dd6667a27f.reference = {
    __cReference: true,
    get value() { return SOMETHINGFROZE____header_global_5eafec038e1d8b8e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:164
export const WIND_REPEAT____header_global_8101d25b1c48b7ea = ((((((308) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_15787397d7546f4acd5ebe59() {
  return __cxx_static_address_15787397d7546f4acd5ebe59.reference || (__cxx_static_address_15787397d7546f4acd5ebe59.reference = {
    __cReference: true,
    get value() { return WIND_REPEAT____header_global_8101d25b1c48b7ea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:165
export const BOS4_RECOG____header_global_25700bc6dca2bb7d = ((((((342) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2c3e62ed6bc7abb6e9ad1048() {
  return __cxx_static_address_2c3e62ed6bc7abb6e9ad1048.reference || (__cxx_static_address_2c3e62ed6bc7abb6e9ad1048.reference = {
    __cReference: true,
    get value() { return BOS4_RECOG____header_global_25700bc6dca2bb7d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:166
export const LIGHTNING_SLAP____header_global_3e7f55c4e4212107 = ((((((351) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_35b3d00f0a69531e321addd0() {
  return __cxx_static_address_35b3d00f0a69531e321addd0.reference || (__cxx_static_address_35b3d00f0a69531e321addd0.reference = {
    __cReference: true,
    get value() { return LIGHTNING_SLAP____header_global_3e7f55c4e4212107; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:167
export const THUNDER____header_global_27b1ac4ac115f0ff = ((((((352) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7b6f4e9ca158b9cded179bf9() {
  return __cxx_static_address_7b6f4e9ca158b9cded179bf9.reference || (__cxx_static_address_7b6f4e9ca158b9cded179bf9.reference = {
    __cReference: true,
    get value() { return THUNDER____header_global_27b1ac4ac115f0ff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:168
export const INTRO4_1____header_global_cda0ca78e32bbc36 = ((((((363) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dc615d569577e762a3dcadce() {
  return __cxx_static_address_dc615d569577e762a3dcadce.reference || (__cxx_static_address_dc615d569577e762a3dcadce.reference = {
    __cReference: true,
    get value() { return INTRO4_1____header_global_cda0ca78e32bbc36; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:169
export const INTRO4_2____header_global_9f79fbbb84e28657 = ((((((364) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bb6cc4384908a09a13917bf8() {
  return __cxx_static_address_bb6cc4384908a09a13917bf8.reference || (__cxx_static_address_bb6cc4384908a09a13917bf8.reference = {
    __cReference: true,
    get value() { return INTRO4_2____header_global_9f79fbbb84e28657; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:170
export const INTRO4_3____header_global_8a87c9f8b84ad297 = ((((((365) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5cfedda14718d34510174876() {
  return __cxx_static_address_5cfedda14718d34510174876.reference || (__cxx_static_address_5cfedda14718d34510174876.reference = {
    __cReference: true,
    get value() { return INTRO4_3____header_global_8a87c9f8b84ad297; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:171
export const INTRO4_4____header_global_2e7893d0b17163e4 = ((((((366) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3dc1b94c68aad9c64f94ca38() {
  return __cxx_static_address_3dc1b94c68aad9c64f94ca38.reference || (__cxx_static_address_3dc1b94c68aad9c64f94ca38.reference = {
    __cReference: true,
    get value() { return INTRO4_4____header_global_2e7893d0b17163e4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:172
export const INTRO4_5____header_global_34227eba4b438613 = ((((((367) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b024ea99d1594a6852582def() {
  return __cxx_static_address_b024ea99d1594a6852582def.reference || (__cxx_static_address_b024ea99d1594a6852582def.reference = {
    __cReference: true,
    get value() { return INTRO4_5____header_global_34227eba4b438613; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:173
export const INTRO4_6____header_global_a03af78660384e50 = ((((((368) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f5ca8d4831091764caa9b264() {
  return __cxx_static_address_f5ca8d4831091764caa9b264.reference || (__cxx_static_address_f5ca8d4831091764caa9b264.reference = {
    __cReference: true,
    get value() { return INTRO4_6____header_global_a03af78660384e50; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:174
export const BOSS4_DEADSPEECH____header_global_f40848b20278e794 = ((((((370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7911bbccae9be2785730f0f9() {
  return __cxx_static_address_7911bbccae9be2785730f0f9.reference || (__cxx_static_address_7911bbccae9be2785730f0f9.reference = {
    __cReference: true,
    get value() { return BOSS4_DEADSPEECH____header_global_f40848b20278e794; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:175
export const BOSS4_FIRSTSEE____header_global_4722806198988f12 = ((((((371) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b5a1616845eb8b3ec7bfbe6e() {
  return __cxx_static_address_b5a1616845eb8b3ec7bfbe6e.reference || (__cxx_static_address_b5a1616845eb8b3ec7bfbe6e.reference = {
    __cReference: true,
    get value() { return BOSS4_FIRSTSEE____header_global_4722806198988f12; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:176
export const VOL4ENDSND1____header_global_f0aad282dea9e5db = ((((((384) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_61b24f1122a4b66b23b14d7a() {
  return __cxx_static_address_61b24f1122a4b66b23b14d7a.reference || (__cxx_static_address_61b24f1122a4b66b23b14d7a.reference = {
    __cReference: true,
    get value() { return VOL4ENDSND1____header_global_f0aad282dea9e5db; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:177
export const VOL4ENDSND2____header_global_097d0b1de29d0106 = ((((((385) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7312c60f49411df6174a5db3() {
  return __cxx_static_address_7312c60f49411df6174a5db3.reference || (__cxx_static_address_7312c60f49411df6174a5db3.reference = {
    __cReference: true,
    get value() { return VOL4ENDSND2____header_global_097d0b1de29d0106; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:178
export const EXPANDERSHOOT____header_global_6dae99b5319183f5 = ((((((388) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_55376c9708c969fc92ae6eeb() {
  return __cxx_static_address_55376c9708c969fc92ae6eeb.reference || (__cxx_static_address_55376c9708c969fc92ae6eeb.reference = {
    __cReference: true,
    get value() { return EXPANDERSHOOT____header_global_6dae99b5319183f5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:179
export const INTRO4_B____header_global_643b2717de920b89 = ((((((392) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_54aa449370db12c0c5032e00() {
  return __cxx_static_address_54aa449370db12c0c5032e00.reference || (__cxx_static_address_54aa449370db12c0c5032e00.reference = {
    __cReference: true,
    get value() { return INTRO4_B____header_global_643b2717de920b89; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:180
export const BIGBANG____header_global_564117224a68ffaa = ((((((393) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c74fb6cc30b094c65b056ba5() {
  return __cxx_static_address_c74fb6cc30b094c65b056ba5.reference || (__cxx_static_address_c74fb6cc30b094c65b056ba5.reference = {
    __cReference: true,
    get value() { return BIGBANG____header_global_564117224a68ffaa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:181
export const FLAMETHROWER_INTRO____header_global_548ffd7a9e20d182 = ((((((398) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7ab352b6381d398777c6f653() {
  return __cxx_static_address_7ab352b6381d398777c6f653.reference || (__cxx_static_address_7ab352b6381d398777c6f653.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_INTRO____header_global_548ffd7a9e20d182; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:182
export const FLAMETHROWER_LOOP____header_global_78753c716dea97b1 = ((((((399) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2717654010e2c2ca7c081d59() {
  return __cxx_static_address_2717654010e2c2ca7c081d59.reference || (__cxx_static_address_2717654010e2c2ca7c081d59.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_LOOP____header_global_78753c716dea97b1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:183
export const FLAMETHROWER_END____header_global_bcbd2c9dd5159eb1 = ((((((400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_49039722f7f09056dc9b673c() {
  return __cxx_static_address_49039722f7f09056dc9b673c.reference || (__cxx_static_address_49039722f7f09056dc9b673c.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_END____header_global_bcbd2c9dd5159eb1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:184
export const E5L7_DUKE_QUIT_YOU____header_global_ed40e5e60a1ecf8d = ((((((401) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c6e77916a7a2d11339ad742b() {
  return __cxx_static_address_c6e77916a7a2d11339ad742b.reference || (__cxx_static_address_c6e77916a7a2d11339ad742b.reference = {
    __cReference: true,
    get value() { return E5L7_DUKE_QUIT_YOU____header_global_ed40e5e60a1ecf8d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:187
export const SECTOREFFECTOR____header_global_6259090ff82f9f45 = ((((((1) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2a4f2506fa37c7e693cb19f9() {
  return __cxx_static_address_2a4f2506fa37c7e693cb19f9.reference || (__cxx_static_address_2a4f2506fa37c7e693cb19f9.reference = {
    __cReference: true,
    get value() { return SECTOREFFECTOR____header_global_6259090ff82f9f45; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:188
export const ACTIVATOR____header_global_3c296515ee144ab6 = ((((((2) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_567a4ebd08c826df3bb46e5a() {
  return __cxx_static_address_567a4ebd08c826df3bb46e5a.reference || (__cxx_static_address_567a4ebd08c826df3bb46e5a.reference = {
    __cReference: true,
    get value() { return ACTIVATOR____header_global_3c296515ee144ab6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:189
export const TOUCHPLATE____header_global_d09a534e9fbabed5 = ((((((3) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1a647bcc19440ee81df3d01a() {
  return __cxx_static_address_1a647bcc19440ee81df3d01a.reference || (__cxx_static_address_1a647bcc19440ee81df3d01a.reference = {
    __cReference: true,
    get value() { return TOUCHPLATE____header_global_d09a534e9fbabed5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:190
export const ACTIVATORLOCKED____header_global_31db0c65eadd5c43 = ((((((4) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_26d128277be8a9304d822bc1() {
  return __cxx_static_address_26d128277be8a9304d822bc1.reference || (__cxx_static_address_26d128277be8a9304d822bc1.reference = {
    __cReference: true,
    get value() { return ACTIVATORLOCKED____header_global_31db0c65eadd5c43; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:191
export const MUSICANDSFX____header_global_67f98b875b0f8d83 = ((((((5) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9f9184048c6ba81c7443be26() {
  return __cxx_static_address_9f9184048c6ba81c7443be26.reference || (__cxx_static_address_9f9184048c6ba81c7443be26.reference = {
    __cReference: true,
    get value() { return MUSICANDSFX____header_global_67f98b875b0f8d83; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:192
export const LOCATORS____header_global_2fee59f5b233157e = ((((((6) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b5f9d7c3bd8b644628e1715b() {
  return __cxx_static_address_b5f9d7c3bd8b644628e1715b.reference || (__cxx_static_address_b5f9d7c3bd8b644628e1715b.reference = {
    __cReference: true,
    get value() { return LOCATORS____header_global_2fee59f5b233157e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:193
export const CYCLER____header_global_dd6e13b68402963c = ((((((7) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_519c6e8cdf573a17b46c9a18() {
  return __cxx_static_address_519c6e8cdf573a17b46c9a18.reference || (__cxx_static_address_519c6e8cdf573a17b46c9a18.reference = {
    __cReference: true,
    get value() { return CYCLER____header_global_dd6e13b68402963c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:194
export const MASTERSWITCH____header_global_090509dd9fdc4b3f = ((((((8) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d8edcf4532ca2511c6d88635() {
  return __cxx_static_address_d8edcf4532ca2511c6d88635.reference || (__cxx_static_address_d8edcf4532ca2511c6d88635.reference = {
    __cReference: true,
    get value() { return MASTERSWITCH____header_global_090509dd9fdc4b3f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:195
export const RESPAWN____header_global_ca8f16a2065c03d8 = ((((((9) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9c8aa20f787cf4ee5f29014e() {
  return __cxx_static_address_9c8aa20f787cf4ee5f29014e.reference || (__cxx_static_address_9c8aa20f787cf4ee5f29014e.reference = {
    __cReference: true,
    get value() { return RESPAWN____header_global_ca8f16a2065c03d8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:196
export const GPSPEED____header_global_6008930aaf438ec2 = ((((((10) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_98d9671d174212537f74ae3c() {
  return __cxx_static_address_98d9671d174212537f74ae3c.reference || (__cxx_static_address_98d9671d174212537f74ae3c.reference = {
    __cReference: true,
    get value() { return GPSPEED____header_global_6008930aaf438ec2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:197
export const FOF____header_global_8d3f24fbffcb7eb6 = ((((((13) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0bb2eea1a8fb0f96fe61a7f5() {
  return __cxx_static_address_0bb2eea1a8fb0f96fe61a7f5.reference || (__cxx_static_address_0bb2eea1a8fb0f96fe61a7f5.reference = {
    __cReference: true,
    get value() { return FOF____header_global_8d3f24fbffcb7eb6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:198
export const ARROW____header_global_6e09cdd6e39fa370 = ((((((20) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9823d1625f532a2c46506918() {
  return __cxx_static_address_9823d1625f532a2c46506918.reference || (__cxx_static_address_9823d1625f532a2c46506918.reference = {
    __cReference: true,
    get value() { return ARROW____header_global_6e09cdd6e39fa370; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:199
export const FIRSTGUNSPRITE____header_global_46e86aec55fe436c = ((((((21) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c3553f224add585bc5a34031() {
  return __cxx_static_address_c3553f224add585bc5a34031.reference || (__cxx_static_address_c3553f224add585bc5a34031.reference = {
    __cReference: true,
    get value() { return FIRSTGUNSPRITE____header_global_46e86aec55fe436c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:200
export const CHAINGUNSPRITE____header_global_3853ae10296208d0 = ((((((22) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_716db1b021d7c0d7daf281b3() {
  return __cxx_static_address_716db1b021d7c0d7daf281b3.reference || (__cxx_static_address_716db1b021d7c0d7daf281b3.reference = {
    __cReference: true,
    get value() { return CHAINGUNSPRITE____header_global_3853ae10296208d0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:201
export const RPGSPRITE____header_global_52e1c7741cdaffe2 = ((((((23) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b647d0860b21358be101b766() {
  return __cxx_static_address_b647d0860b21358be101b766.reference || (__cxx_static_address_b647d0860b21358be101b766.reference = {
    __cReference: true,
    get value() { return RPGSPRITE____header_global_52e1c7741cdaffe2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:202
export const FREEZESPRITE____header_global_792bf55643277593 = ((((((24) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ab755fbc9a7451625ee361cf() {
  return __cxx_static_address_ab755fbc9a7451625ee361cf.reference || (__cxx_static_address_ab755fbc9a7451625ee361cf.reference = {
    __cReference: true,
    get value() { return FREEZESPRITE____header_global_792bf55643277593; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:203
export const SHRINKERSPRITE____header_global_4cbf0b16b973a6c7 = ((((((25) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4771d1551009297f91271dbc() {
  return __cxx_static_address_4771d1551009297f91271dbc.reference || (__cxx_static_address_4771d1551009297f91271dbc.reference = {
    __cReference: true,
    get value() { return SHRINKERSPRITE____header_global_4cbf0b16b973a6c7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:204
export const HEAVYHBOMB____header_global_f7584ab1a502ce56 = ((((((26) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d46704cc60365e17db1177e3() {
  return __cxx_static_address_d46704cc60365e17db1177e3.reference || (__cxx_static_address_d46704cc60365e17db1177e3.reference = {
    __cReference: true,
    get value() { return HEAVYHBOMB____header_global_f7584ab1a502ce56; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:205
export const TRIPBOMBSPRITE____header_global_2a7dae380481d713 = ((((((27) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_64b113afcb23588b3128d10e() {
  return __cxx_static_address_64b113afcb23588b3128d10e.reference || (__cxx_static_address_64b113afcb23588b3128d10e.reference = {
    __cReference: true,
    get value() { return TRIPBOMBSPRITE____header_global_2a7dae380481d713; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:206
export const SHOTGUNSPRITE____header_global_cd9fc59920dab864 = ((((((28) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_acf182332a65118583f6b60c() {
  return __cxx_static_address_acf182332a65118583f6b60c.reference || (__cxx_static_address_acf182332a65118583f6b60c.reference = {
    __cReference: true,
    get value() { return SHOTGUNSPRITE____header_global_cd9fc59920dab864; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:207
export const DEVISTATORSPRITE____header_global_697c9e66cb42e672 = ((((((29) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e335f4c588d6082d493898de() {
  return __cxx_static_address_e335f4c588d6082d493898de.reference || (__cxx_static_address_e335f4c588d6082d493898de.reference = {
    __cReference: true,
    get value() { return DEVISTATORSPRITE____header_global_697c9e66cb42e672; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:208
export const HEALTHBOX____header_global_f6532e41286d739c = ((((((30) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c85d1dd485129b582420fbaa() {
  return __cxx_static_address_c85d1dd485129b582420fbaa.reference || (__cxx_static_address_c85d1dd485129b582420fbaa.reference = {
    __cReference: true,
    get value() { return HEALTHBOX____header_global_f6532e41286d739c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:209
export const AMMOBOX____header_global_4c2171b00242f539 = ((((((31) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c0601798cc72f2b22d3a156f() {
  return __cxx_static_address_c0601798cc72f2b22d3a156f.reference || (__cxx_static_address_c0601798cc72f2b22d3a156f.reference = {
    __cReference: true,
    get value() { return AMMOBOX____header_global_4c2171b00242f539; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:210
export const GROWSPRITEICON____header_global_1720050a32b811fa = ((((((32) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fbec9b3bc03fd462b42f6c54() {
  return __cxx_static_address_fbec9b3bc03fd462b42f6c54.reference || (__cxx_static_address_fbec9b3bc03fd462b42f6c54.reference = {
    __cReference: true,
    get value() { return GROWSPRITEICON____header_global_1720050a32b811fa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:211
export const INVENTORYBOX____header_global_cccda5e716bdc86d = ((((((33) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0fecc58be43a8fbfe89b3f73() {
  return __cxx_static_address_0fecc58be43a8fbfe89b3f73.reference || (__cxx_static_address_0fecc58be43a8fbfe89b3f73.reference = {
    __cReference: true,
    get value() { return INVENTORYBOX____header_global_cccda5e716bdc86d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:212
export const FREEZEAMMO____header_global_7387acb8d0f05c51 = ((((((37) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5efa0b3bd4a359f8103c9a2c() {
  return __cxx_static_address_5efa0b3bd4a359f8103c9a2c.reference || (__cxx_static_address_5efa0b3bd4a359f8103c9a2c.reference = {
    __cReference: true,
    get value() { return FREEZEAMMO____header_global_7387acb8d0f05c51; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:213
export const AMMO____header_global_ae86873a13d3ac51 = ((((((40) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_14cd383e45deb2f64a990556() {
  return __cxx_static_address_14cd383e45deb2f64a990556.reference || (__cxx_static_address_14cd383e45deb2f64a990556.reference = {
    __cReference: true,
    get value() { return AMMO____header_global_ae86873a13d3ac51; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:214
export const BATTERYAMMO____header_global_d35f5c3cff9e25ed = ((((((41) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5ab8e652f489f27024ce6ccf() {
  return __cxx_static_address_5ab8e652f489f27024ce6ccf.reference || (__cxx_static_address_5ab8e652f489f27024ce6ccf.reference = {
    __cReference: true,
    get value() { return BATTERYAMMO____header_global_d35f5c3cff9e25ed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:215
export const DEVISTATORAMMO____header_global_adcfe12c386f4dd7 = ((((((42) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fffaa6f7fbffddf2eaacf461() {
  return __cxx_static_address_fffaa6f7fbffddf2eaacf461.reference || (__cxx_static_address_fffaa6f7fbffddf2eaacf461.reference = {
    __cReference: true,
    get value() { return DEVISTATORAMMO____header_global_adcfe12c386f4dd7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:216
export const RPGAMMO____header_global_7fc155a3c3a093a6 = ((((((44) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_de66592a1f6f6347e68c1d7a() {
  return __cxx_static_address_de66592a1f6f6347e68c1d7a.reference || (__cxx_static_address_de66592a1f6f6347e68c1d7a.reference = {
    __cReference: true,
    get value() { return RPGAMMO____header_global_7fc155a3c3a093a6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:217
export const GROWAMMO____header_global_1010b3b9687d5529 = ((((((45) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_79d57eb64bc1f2a19b5acf7f() {
  return __cxx_static_address_79d57eb64bc1f2a19b5acf7f.reference || (__cxx_static_address_79d57eb64bc1f2a19b5acf7f.reference = {
    __cReference: true,
    get value() { return GROWAMMO____header_global_1010b3b9687d5529; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:218
export const CRYSTALAMMO____header_global_e7af33fad9d62cd1 = ((((((46) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_efbda64554cae80e18b1d0a9() {
  return __cxx_static_address_efbda64554cae80e18b1d0a9.reference || (__cxx_static_address_efbda64554cae80e18b1d0a9.reference = {
    __cReference: true,
    get value() { return CRYSTALAMMO____header_global_e7af33fad9d62cd1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:219
export const HBOMBAMMO____header_global_27fd17ba74ae1025 = ((((((47) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1f6ea54a018ae74ff7d26f9e() {
  return __cxx_static_address_1f6ea54a018ae74ff7d26f9e.reference || (__cxx_static_address_1f6ea54a018ae74ff7d26f9e.reference = {
    __cReference: true,
    get value() { return HBOMBAMMO____header_global_27fd17ba74ae1025; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:220
export const AMMOLOTS____header_global_503f6c866e713b6e = ((((((48) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4beb3d6ef7f5aaa4bf34f601() {
  return __cxx_static_address_4beb3d6ef7f5aaa4bf34f601.reference || (__cxx_static_address_4beb3d6ef7f5aaa4bf34f601.reference = {
    __cReference: true,
    get value() { return AMMOLOTS____header_global_503f6c866e713b6e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:221
export const SHOTGUNAMMO____header_global_476df4b899cd9fe3 = ((((((49) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1934404bcfd4fafba1872346() {
  return __cxx_static_address_1934404bcfd4fafba1872346.reference || (__cxx_static_address_1934404bcfd4fafba1872346.reference = {
    __cReference: true,
    get value() { return SHOTGUNAMMO____header_global_476df4b899cd9fe3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:222
export const COLA____header_global_b21d11c31492d0fc = ((((((51) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_993b867ab342028456676e3b() {
  return __cxx_static_address_993b867ab342028456676e3b.reference || (__cxx_static_address_993b867ab342028456676e3b.reference = {
    __cReference: true,
    get value() { return COLA____header_global_b21d11c31492d0fc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:223
export const SIXPAK____header_global_108e97645afa8808 = ((((((52) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9ce2fa508d1589a1ff7e4847() {
  return __cxx_static_address_9ce2fa508d1589a1ff7e4847.reference || (__cxx_static_address_9ce2fa508d1589a1ff7e4847.reference = {
    __cReference: true,
    get value() { return SIXPAK____header_global_108e97645afa8808; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:224
export const FIRSTAID____header_global_7fdaf9df8df619bd = ((((((53) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3d7369d06fff840720fb4aec() {
  return __cxx_static_address_3d7369d06fff840720fb4aec.reference || (__cxx_static_address_3d7369d06fff840720fb4aec.reference = {
    __cReference: true,
    get value() { return FIRSTAID____header_global_7fdaf9df8df619bd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:225
export const SHIELD____header_global_5a8448912439220d = ((((((54) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6dd322c1ab7979725dcb992d() {
  return __cxx_static_address_6dd322c1ab7979725dcb992d.reference || (__cxx_static_address_6dd322c1ab7979725dcb992d.reference = {
    __cReference: true,
    get value() { return SHIELD____header_global_5a8448912439220d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:226
export const STEROIDS____header_global_97ff3c6686ef32c1 = ((((((55) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fa46d150f562239c7a1ebffb() {
  return __cxx_static_address_fa46d150f562239c7a1ebffb.reference || (__cxx_static_address_fa46d150f562239c7a1ebffb.reference = {
    __cReference: true,
    get value() { return STEROIDS____header_global_97ff3c6686ef32c1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:227
export const AIRTANK____header_global_b0b7a6c7e80b06d5 = ((((((56) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2afd54a62b2c508c03b7a427() {
  return __cxx_static_address_2afd54a62b2c508c03b7a427.reference || (__cxx_static_address_2afd54a62b2c508c03b7a427.reference = {
    __cReference: true,
    get value() { return AIRTANK____header_global_b0b7a6c7e80b06d5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:228
export const JETPACK____header_global_724ce679cd3d3a0c = ((((((57) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5390698318851519f7c94c88() {
  return __cxx_static_address_5390698318851519f7c94c88.reference || (__cxx_static_address_5390698318851519f7c94c88.reference = {
    __cReference: true,
    get value() { return JETPACK____header_global_724ce679cd3d3a0c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:229
export const HEATSENSOR____header_global_b2572f86b2acc2c7 = ((((((59) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c563776a26d73b29e1b4dfb3() {
  return __cxx_static_address_c563776a26d73b29e1b4dfb3.reference || (__cxx_static_address_c563776a26d73b29e1b4dfb3.reference = {
    __cReference: true,
    get value() { return HEATSENSOR____header_global_b2572f86b2acc2c7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:230
export const ACCESSCARD____header_global_0659fed003724311 = ((((((60) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_94c21facb5ffd94bade08a7d() {
  return __cxx_static_address_94c21facb5ffd94bade08a7d.reference || (__cxx_static_address_94c21facb5ffd94bade08a7d.reference = {
    __cReference: true,
    get value() { return ACCESSCARD____header_global_0659fed003724311; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:231
export const BOOTS____header_global_d8591dc1bef24156 = ((((((61) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0dd2ffbf29297a4a084c6988() {
  return __cxx_static_address_0dd2ffbf29297a4a084c6988.reference || (__cxx_static_address_0dd2ffbf29297a4a084c6988.reference = {
    __cReference: true,
    get value() { return BOOTS____header_global_d8591dc1bef24156; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:232
export const MIRRORBROKE____header_global_14ffa257e184c1dd = ((((((70) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c50a329cf4d250feab697099() {
  return __cxx_static_address_c50a329cf4d250feab697099.reference || (__cxx_static_address_c50a329cf4d250feab697099.reference = {
    __cReference: true,
    get value() { return MIRRORBROKE____header_global_14ffa257e184c1dd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:233
export const CLOUDYOCEAN____header_global_a67b3786d65ce99b = ((((((78) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a85d14759ab36526e8544c99() {
  return __cxx_static_address_a85d14759ab36526e8544c99.reference || (__cxx_static_address_a85d14759ab36526e8544c99.reference = {
    __cReference: true,
    get value() { return CLOUDYOCEAN____header_global_a67b3786d65ce99b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:234
export const CLOUDYSKIES____header_global_9c303afd929b2c8d = ((((((79) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b49f3c60dd2158866d952b06() {
  return __cxx_static_address_b49f3c60dd2158866d952b06.reference || (__cxx_static_address_b49f3c60dd2158866d952b06.reference = {
    __cReference: true,
    get value() { return CLOUDYSKIES____header_global_9c303afd929b2c8d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:235
export const MOONSKY1____header_global_f999de39da374667 = ((((((80) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_09fe1bec443faba759528831() {
  return __cxx_static_address_09fe1bec443faba759528831.reference || (__cxx_static_address_09fe1bec443faba759528831.reference = {
    __cReference: true,
    get value() { return MOONSKY1____header_global_f999de39da374667; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:236
export const BIGORBIT1____header_global_236778947aa8eb8b = ((((((84) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e49a536b516fd693ff420a59() {
  return __cxx_static_address_e49a536b516fd693ff420a59.reference || (__cxx_static_address_e49a536b516fd693ff420a59.reference = {
    __cReference: true,
    get value() { return BIGORBIT1____header_global_236778947aa8eb8b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:237
export const LA____header_global_03b92c70310e0e7d = ((((((89) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ac87e89748a084a122eae038() {
  return __cxx_static_address_ac87e89748a084a122eae038.reference || (__cxx_static_address_ac87e89748a084a122eae038.reference = {
    __cReference: true,
    get value() { return LA____header_global_03b92c70310e0e7d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:238
export const ATOMICHEALTH____header_global_f82551d9c1deb8cc = ((((((100) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8d6774364e22dbf92fe57a4e() {
  return __cxx_static_address_8d6774364e22dbf92fe57a4e.reference || (__cxx_static_address_8d6774364e22dbf92fe57a4e.reference = {
    __cReference: true,
    get value() { return ATOMICHEALTH____header_global_f82551d9c1deb8cc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:239
export const TECHLIGHT2____header_global_940105e69d4fce71 = ((((((120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f91144bed6e0ac8c5d02b005() {
  return __cxx_static_address_f91144bed6e0ac8c5d02b005.reference || (__cxx_static_address_f91144bed6e0ac8c5d02b005.reference = {
    __cReference: true,
    get value() { return TECHLIGHT2____header_global_940105e69d4fce71; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:240
export const TECHLIGHTBUST2____header_global_3612505a43f8e32f = ((((((121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cd1dff7dd8bf5926b10b88b2() {
  return __cxx_static_address_cd1dff7dd8bf5926b10b88b2.reference || (__cxx_static_address_cd1dff7dd8bf5926b10b88b2.reference = {
    __cReference: true,
    get value() { return TECHLIGHTBUST2____header_global_3612505a43f8e32f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:241
export const TECHLIGHT4____header_global_93e43b5a8189a920 = ((((((122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b1f001193437777c6a3964f1() {
  return __cxx_static_address_b1f001193437777c6a3964f1.reference || (__cxx_static_address_b1f001193437777c6a3964f1.reference = {
    __cReference: true,
    get value() { return TECHLIGHT4____header_global_93e43b5a8189a920; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:242
export const TECHLIGHTBUST4____header_global_b8dfcef7fb67eea2 = ((((((123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4a672d8875f976c82a1134a7() {
  return __cxx_static_address_4a672d8875f976c82a1134a7.reference || (__cxx_static_address_4a672d8875f976c82a1134a7.reference = {
    __cReference: true,
    get value() { return TECHLIGHTBUST4____header_global_b8dfcef7fb67eea2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:243
export const WALLLIGHT4____header_global_7cbe66ea372ebedd = ((((((124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_393628240aa09bf0127df1a0() {
  return __cxx_static_address_393628240aa09bf0127df1a0.reference || (__cxx_static_address_393628240aa09bf0127df1a0.reference = {
    __cReference: true,
    get value() { return WALLLIGHT4____header_global_7cbe66ea372ebedd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:244
export const WALLLIGHTBUST4____header_global_3f36d8b881b577f4 = ((((((125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fecd3a7629315e94b7156c52() {
  return __cxx_static_address_fecd3a7629315e94b7156c52.reference || (__cxx_static_address_fecd3a7629315e94b7156c52.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST4____header_global_3f36d8b881b577f4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:245
export const ACCESSSWITCH____header_global_082a3c46e97def21 = ((((((130) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7bfe7a0d3028fec013a9676f() {
  return __cxx_static_address_7bfe7a0d3028fec013a9676f.reference || (__cxx_static_address_7bfe7a0d3028fec013a9676f.reference = {
    __cReference: true,
    get value() { return ACCESSSWITCH____header_global_082a3c46e97def21; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:246
export const SLOTDOOR____header_global_6b4be878a4ad819b = ((((((132) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eb0cb5429f7a90a3f08c7e17() {
  return __cxx_static_address_eb0cb5429f7a90a3f08c7e17.reference || (__cxx_static_address_eb0cb5429f7a90a3f08c7e17.reference = {
    __cReference: true,
    get value() { return SLOTDOOR____header_global_6b4be878a4ad819b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:247
export const LIGHTSWITCH____header_global_fdc079f9c5300009 = ((((((134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4ffc4fa97f14da667382288e() {
  return __cxx_static_address_4ffc4fa97f14da667382288e.reference || (__cxx_static_address_4ffc4fa97f14da667382288e.reference = {
    __cReference: true,
    get value() { return LIGHTSWITCH____header_global_fdc079f9c5300009; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:248
export const SPACEDOORSWITCH____header_global_e84301773a0f970b = ((((((136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_533ea7d12f91872d3a9daa19() {
  return __cxx_static_address_533ea7d12f91872d3a9daa19.reference || (__cxx_static_address_533ea7d12f91872d3a9daa19.reference = {
    __cReference: true,
    get value() { return SPACEDOORSWITCH____header_global_e84301773a0f970b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:249
export const SPACELIGHTSWITCH____header_global_afaff76b2becefd2 = ((((((138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_69303d213b42e732b977d622() {
  return __cxx_static_address_69303d213b42e732b977d622.reference || (__cxx_static_address_69303d213b42e732b977d622.reference = {
    __cReference: true,
    get value() { return SPACELIGHTSWITCH____header_global_afaff76b2becefd2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:250
export const FRANKENSTINESWITCH____header_global_84836bc14b545bab = ((((((140) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e7a119304b619124f1c5a650() {
  return __cxx_static_address_e7a119304b619124f1c5a650.reference || (__cxx_static_address_e7a119304b619124f1c5a650.reference = {
    __cReference: true,
    get value() { return FRANKENSTINESWITCH____header_global_84836bc14b545bab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:251
export const NUKEBUTTON____header_global_c5b3127e1744dbce = ((((((142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3d5e66f4349ef4cabea80854() {
  return __cxx_static_address_3d5e66f4349ef4cabea80854.reference || (__cxx_static_address_3d5e66f4349ef4cabea80854.reference = {
    __cReference: true,
    get value() { return NUKEBUTTON____header_global_c5b3127e1744dbce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:252
export const MULTISWITCH____header_global_69f6d6cb6b70bb00 = ((((((146) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b43e11ad89d068dff981e986() {
  return __cxx_static_address_b43e11ad89d068dff981e986.reference || (__cxx_static_address_b43e11ad89d068dff981e986.reference = {
    __cReference: true,
    get value() { return MULTISWITCH____header_global_69f6d6cb6b70bb00; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:253
export const DOORTILE5____header_global_089466479661319e = ((((((150) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8797899115463a39901e6b0b() {
  return __cxx_static_address_8797899115463a39901e6b0b.reference || (__cxx_static_address_8797899115463a39901e6b0b.reference = {
    __cReference: true,
    get value() { return DOORTILE5____header_global_089466479661319e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:254
export const DOORTILE6____header_global_9c6ccd60ac4097c6 = ((((((151) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2730121dd4bd4db2a340d075() {
  return __cxx_static_address_2730121dd4bd4db2a340d075.reference || (__cxx_static_address_2730121dd4bd4db2a340d075.reference = {
    __cReference: true,
    get value() { return DOORTILE6____header_global_9c6ccd60ac4097c6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:255
export const DOORTILE1____header_global_db51b4becee50272 = ((((((152) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eba370c65a0212ed44aa222e() {
  return __cxx_static_address_eba370c65a0212ed44aa222e.reference || (__cxx_static_address_eba370c65a0212ed44aa222e.reference = {
    __cReference: true,
    get value() { return DOORTILE1____header_global_db51b4becee50272; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:256
export const DOORTILE2____header_global_1dc4c7c2cf62a8a4 = ((((((153) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fde592d4cc14c9a0f54f4978() {
  return __cxx_static_address_fde592d4cc14c9a0f54f4978.reference || (__cxx_static_address_fde592d4cc14c9a0f54f4978.reference = {
    __cReference: true,
    get value() { return DOORTILE2____header_global_1dc4c7c2cf62a8a4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:257
export const DOORTILE3____header_global_2f8fcd195c24c824 = ((((((154) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e540f9ef0c99215ece5870df() {
  return __cxx_static_address_e540f9ef0c99215ece5870df.reference || (__cxx_static_address_e540f9ef0c99215ece5870df.reference = {
    __cReference: true,
    get value() { return DOORTILE3____header_global_2f8fcd195c24c824; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:258
export const DOORTILE4____header_global_a846afce2fc98887 = ((((((155) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3e3e7cec3e1a91e6c7e55baa() {
  return __cxx_static_address_3e3e7cec3e1a91e6c7e55baa.reference || (__cxx_static_address_3e3e7cec3e1a91e6c7e55baa.reference = {
    __cReference: true,
    get value() { return DOORTILE4____header_global_a846afce2fc98887; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:259
export const DOORTILE7____header_global_1949523e8047e702 = ((((((156) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8d9639b6230bfd4bded7090e() {
  return __cxx_static_address_8d9639b6230bfd4bded7090e.reference || (__cxx_static_address_8d9639b6230bfd4bded7090e.reference = {
    __cReference: true,
    get value() { return DOORTILE7____header_global_1949523e8047e702; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:260
export const DOORTILE8____header_global_a49a60e1508f977a = ((((((157) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_39d671ab012ad619198dda3d() {
  return __cxx_static_address_39d671ab012ad619198dda3d.reference || (__cxx_static_address_39d671ab012ad619198dda3d.reference = {
    __cReference: true,
    get value() { return DOORTILE8____header_global_a49a60e1508f977a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:261
export const DOORTILE9____header_global_ef2399de016b8028 = ((((((158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b24fe88f4ae6036852ec4ee6() {
  return __cxx_static_address_b24fe88f4ae6036852ec4ee6.reference || (__cxx_static_address_b24fe88f4ae6036852ec4ee6.reference = {
    __cReference: true,
    get value() { return DOORTILE9____header_global_ef2399de016b8028; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:262
export const DOORTILE10____header_global_15b438c995c107ef = ((((((159) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_761189eef1279beb4958168b() {
  return __cxx_static_address_761189eef1279beb4958168b.reference || (__cxx_static_address_761189eef1279beb4958168b.reference = {
    __cReference: true,
    get value() { return DOORTILE10____header_global_15b438c995c107ef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:263
export const DOORSHOCK____header_global_7f41f9d80d742020 = ((((((160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_61eff7f161b7847ed8f92f70() {
  return __cxx_static_address_61eff7f161b7847ed8f92f70.reference || (__cxx_static_address_61eff7f161b7847ed8f92f70.reference = {
    __cReference: true,
    get value() { return DOORSHOCK____header_global_7f41f9d80d742020; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:264
export const DIPSWITCH____header_global_fca604eff04b0a3e = ((((((162) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3c57d1013ed395e261e8e0d0() {
  return __cxx_static_address_3c57d1013ed395e261e8e0d0.reference || (__cxx_static_address_3c57d1013ed395e261e8e0d0.reference = {
    __cReference: true,
    get value() { return DIPSWITCH____header_global_fca604eff04b0a3e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:265
export const DIPSWITCH2____header_global_53119da18780039e = ((((((164) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7405a2f04aa8d7094112a1ac() {
  return __cxx_static_address_7405a2f04aa8d7094112a1ac.reference || (__cxx_static_address_7405a2f04aa8d7094112a1ac.reference = {
    __cReference: true,
    get value() { return DIPSWITCH2____header_global_53119da18780039e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:266
export const TECHSWITCH____header_global_ec10ec0012f4434d = ((((((166) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ee3d1cede382a09b811a649d() {
  return __cxx_static_address_ee3d1cede382a09b811a649d.reference || (__cxx_static_address_ee3d1cede382a09b811a649d.reference = {
    __cReference: true,
    get value() { return TECHSWITCH____header_global_ec10ec0012f4434d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:267
export const DIPSWITCH3____header_global_d51c1103adf60ed5 = ((((((168) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_23001465248262ad7c693e40() {
  return __cxx_static_address_23001465248262ad7c693e40.reference || (__cxx_static_address_23001465248262ad7c693e40.reference = {
    __cReference: true,
    get value() { return DIPSWITCH3____header_global_d51c1103adf60ed5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:268
export const ACCESSSWITCH2____header_global_b9e47d3fa24a2e49 = ((((((170) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3a0c6b930265b47c6fa460be() {
  return __cxx_static_address_3a0c6b930265b47c6fa460be.reference || (__cxx_static_address_3a0c6b930265b47c6fa460be.reference = {
    __cReference: true,
    get value() { return ACCESSSWITCH2____header_global_b9e47d3fa24a2e49; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:269
export const FLOORSLIME____header_global_70480e133e4d863d = ((((((200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9f870784654db506680c1bc4() {
  return __cxx_static_address_9f870784654db506680c1bc4.reference || (__cxx_static_address_9f870784654db506680c1bc4.reference = {
    __cReference: true,
    get value() { return FLOORSLIME____header_global_70480e133e4d863d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:270
export const BIGFORCE____header_global_b849355de2eb5e0e = ((((((230) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c0a55bd1ebb3c23b6343e397() {
  return __cxx_static_address_c0a55bd1ebb3c23b6343e397.reference || (__cxx_static_address_c0a55bd1ebb3c23b6343e397.reference = {
    __cReference: true,
    get value() { return BIGFORCE____header_global_b849355de2eb5e0e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:271
export const MASKWALL9____header_global_016e0a346f80bcbd = ((((((255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bdecd4df8cdb99a3eee87a6b() {
  return __cxx_static_address_bdecd4df8cdb99a3eee87a6b.reference || (__cxx_static_address_bdecd4df8cdb99a3eee87a6b.reference = {
    __cReference: true,
    get value() { return MASKWALL9____header_global_016e0a346f80bcbd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:272
export const SCREENBREAK1____header_global_9e2a777cb730834a = ((((((263) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b108139b3d7696b75d98b390() {
  return __cxx_static_address_b108139b3d7696b75d98b390.reference || (__cxx_static_address_b108139b3d7696b75d98b390.reference = {
    __cReference: true,
    get value() { return SCREENBREAK1____header_global_9e2a777cb730834a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:273
export const SCREENBREAK2____header_global_48d8a0dd83354b03 = ((((((264) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f5ee3172528c35bde6b2d861() {
  return __cxx_static_address_f5ee3172528c35bde6b2d861.reference || (__cxx_static_address_f5ee3172528c35bde6b2d861.reference = {
    __cReference: true,
    get value() { return SCREENBREAK2____header_global_48d8a0dd83354b03; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:274
export const SCREENBREAK3____header_global_9fc2761d2ae69282 = ((((((265) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e9c1c876042b39514620e0c6() {
  return __cxx_static_address_e9c1c876042b39514620e0c6.reference || (__cxx_static_address_e9c1c876042b39514620e0c6.reference = {
    __cReference: true,
    get value() { return SCREENBREAK3____header_global_9fc2761d2ae69282; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:275
export const SCREENBREAK4____header_global_565e3affea58b355 = ((((((266) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d5693ea941c9b72e52ae68db() {
  return __cxx_static_address_d5693ea941c9b72e52ae68db.reference || (__cxx_static_address_d5693ea941c9b72e52ae68db.reference = {
    __cReference: true,
    get value() { return SCREENBREAK4____header_global_565e3affea58b355; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:276
export const SCREENBREAK5____header_global_1e1fba70147bd704 = ((((((267) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9f651faebc62eb524b3ea9d4() {
  return __cxx_static_address_9f651faebc62eb524b3ea9d4.reference || (__cxx_static_address_9f651faebc62eb524b3ea9d4.reference = {
    __cReference: true,
    get value() { return SCREENBREAK5____header_global_1e1fba70147bd704; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:277
export const SCREENBREAK6____header_global_21099916ad2346c2 = ((((((268) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4ac503d36c17681aaa1f6de8() {
  return __cxx_static_address_4ac503d36c17681aaa1f6de8.reference || (__cxx_static_address_4ac503d36c17681aaa1f6de8.reference = {
    __cReference: true,
    get value() { return SCREENBREAK6____header_global_21099916ad2346c2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:278
export const SCREENBREAK7____header_global_a2e201f82204d775 = ((((((269) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e1c312316b995fd78ba87a0a() {
  return __cxx_static_address_e1c312316b995fd78ba87a0a.reference || (__cxx_static_address_e1c312316b995fd78ba87a0a.reference = {
    __cReference: true,
    get value() { return SCREENBREAK7____header_global_a2e201f82204d775; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:279
export const SCREENBREAK8____header_global_25c8ca988fb3aa76 = ((((((270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eddfc32f6cdba4ccc7b67dd8() {
  return __cxx_static_address_eddfc32f6cdba4ccc7b67dd8.reference || (__cxx_static_address_eddfc32f6cdba4ccc7b67dd8.reference = {
    __cReference: true,
    get value() { return SCREENBREAK8____header_global_25c8ca988fb3aa76; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:280
export const SCREENBREAK9____header_global_cc493aaf4c0cd110 = ((((((271) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ddbb78ebc3d39d90eb72d78b() {
  return __cxx_static_address_ddbb78ebc3d39d90eb72d78b.reference || (__cxx_static_address_ddbb78ebc3d39d90eb72d78b.reference = {
    __cReference: true,
    get value() { return SCREENBREAK9____header_global_cc493aaf4c0cd110; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:281
export const SCREENBREAK10____header_global_00cbbd9e4657cd99 = ((((((272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_970703cb263f38720f1bb0d0() {
  return __cxx_static_address_970703cb263f38720f1bb0d0.reference || (__cxx_static_address_970703cb263f38720f1bb0d0.reference = {
    __cReference: true,
    get value() { return SCREENBREAK10____header_global_00cbbd9e4657cd99; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:282
export const SCREENBREAK11____header_global_d2b9a7067ebe19ca = ((((((273) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a91141b28edea4db79d74a82() {
  return __cxx_static_address_a91141b28edea4db79d74a82.reference || (__cxx_static_address_a91141b28edea4db79d74a82.reference = {
    __cReference: true,
    get value() { return SCREENBREAK11____header_global_d2b9a7067ebe19ca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:283
export const SCREENBREAK12____header_global_6f3c792772f3724d = ((((((274) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d01b62b7144312b2408bfb7b() {
  return __cxx_static_address_d01b62b7144312b2408bfb7b.reference || (__cxx_static_address_d01b62b7144312b2408bfb7b.reference = {
    __cReference: true,
    get value() { return SCREENBREAK12____header_global_6f3c792772f3724d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:284
export const SCREENBREAK13____header_global_5aee262a0f73264a = ((((((275) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_813433bbed47b4b1ebcaeea3() {
  return __cxx_static_address_813433bbed47b4b1ebcaeea3.reference || (__cxx_static_address_813433bbed47b4b1ebcaeea3.reference = {
    __cReference: true,
    get value() { return SCREENBREAK13____header_global_5aee262a0f73264a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:285
export const MASKWALL1____header_global_9e349c73bcef8507 = ((((((285) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4da851e5863b0407d5836b9a() {
  return __cxx_static_address_4da851e5863b0407d5836b9a.reference || (__cxx_static_address_4da851e5863b0407d5836b9a.reference = {
    __cReference: true,
    get value() { return MASKWALL1____header_global_9e349c73bcef8507; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:286
export const W_TECHWALL1____header_global_584eb01f12dfc8c3 = ((((((293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e36e51f6b433ec9d09357fae() {
  return __cxx_static_address_e36e51f6b433ec9d09357fae.reference || (__cxx_static_address_e36e51f6b433ec9d09357fae.reference = {
    __cReference: true,
    get value() { return W_TECHWALL1____header_global_584eb01f12dfc8c3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:287
export const W_TECHWALL2____header_global_7b6813e9a568c605 = ((((((297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9d21fe364c7ecefccf6b3d5f() {
  return __cxx_static_address_9d21fe364c7ecefccf6b3d5f.reference || (__cxx_static_address_9d21fe364c7ecefccf6b3d5f.reference = {
    __cReference: true,
    get value() { return W_TECHWALL2____header_global_7b6813e9a568c605; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:288
export const W_TECHWALL15____header_global_e25307a58b5a7fe6 = ((((((299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_431ded6ba8df44ff3a45b787() {
  return __cxx_static_address_431ded6ba8df44ff3a45b787.reference || (__cxx_static_address_431ded6ba8df44ff3a45b787.reference = {
    __cReference: true,
    get value() { return W_TECHWALL15____header_global_e25307a58b5a7fe6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:289
export const W_TECHWALL3____header_global_d6100dc9117c6d86 = ((((((301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6b37e0fafe52f201ea122b6b() {
  return __cxx_static_address_6b37e0fafe52f201ea122b6b.reference || (__cxx_static_address_6b37e0fafe52f201ea122b6b.reference = {
    __cReference: true,
    get value() { return W_TECHWALL3____header_global_d6100dc9117c6d86; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:290
export const W_TECHWALL4____header_global_a95e5a914821f78f = ((((((305) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a88557b243e6f15233dec152() {
  return __cxx_static_address_a88557b243e6f15233dec152.reference || (__cxx_static_address_a88557b243e6f15233dec152.reference = {
    __cReference: true,
    get value() { return W_TECHWALL4____header_global_a95e5a914821f78f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:291
export const W_TECHWALL10____header_global_118e2015fc6523a1 = ((((((306) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_735b255a2385f87d57352ea8() {
  return __cxx_static_address_735b255a2385f87d57352ea8.reference || (__cxx_static_address_735b255a2385f87d57352ea8.reference = {
    __cReference: true,
    get value() { return W_TECHWALL10____header_global_118e2015fc6523a1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:292
export const W_TECHWALL16____header_global_a7b4de6d738e9b23 = ((((((307) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f6e265851e8070c4406a082a() {
  return __cxx_static_address_f6e265851e8070c4406a082a.reference || (__cxx_static_address_f6e265851e8070c4406a082a.reference = {
    __cReference: true,
    get value() { return W_TECHWALL16____header_global_a7b4de6d738e9b23; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:293
export const WATERTILE2____header_global_42d5e972b48a6348 = ((((((336) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b362cfb0b91f1ee9366fb9a9() {
  return __cxx_static_address_b362cfb0b91f1ee9366fb9a9.reference || (__cxx_static_address_b362cfb0b91f1ee9366fb9a9.reference = {
    __cReference: true,
    get value() { return WATERTILE2____header_global_42d5e972b48a6348; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:294
export const BPANNEL1____header_global_697ee60a04cddc19 = ((((((341) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7658057ecb8cf57b4d256b37() {
  return __cxx_static_address_7658057ecb8cf57b4d256b37.reference || (__cxx_static_address_7658057ecb8cf57b4d256b37.reference = {
    __cReference: true,
    get value() { return BPANNEL1____header_global_697ee60a04cddc19; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:295
export const PANNEL1____header_global_0f2a7db8a68cb442 = ((((((342) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_783799edfd8f6ccfebc16a46() {
  return __cxx_static_address_783799edfd8f6ccfebc16a46.reference || (__cxx_static_address_783799edfd8f6ccfebc16a46.reference = {
    __cReference: true,
    get value() { return PANNEL1____header_global_0f2a7db8a68cb442; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:296
export const PANNEL2____header_global_452ad4198b984ef0 = ((((((343) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0e3e4503f00e2d58483ae54b() {
  return __cxx_static_address_0e3e4503f00e2d58483ae54b.reference || (__cxx_static_address_0e3e4503f00e2d58483ae54b.reference = {
    __cReference: true,
    get value() { return PANNEL2____header_global_452ad4198b984ef0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:297
export const STATIC____header_global_75daae6564aa0d65 = ((((((351) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1dafcfdb185fc64c87546a0d() {
  return __cxx_static_address_1dafcfdb185fc64c87546a0d.reference || (__cxx_static_address_1dafcfdb185fc64c87546a0d.reference = {
    __cReference: true,
    get value() { return STATIC____header_global_75daae6564aa0d65; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:298
export const W_SCREENBREAK____header_global_e76f8544a16fb869 = ((((((357) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dd4beb49041ad3b3414b40ef() {
  return __cxx_static_address_dd4beb49041ad3b3414b40ef.reference || (__cxx_static_address_dd4beb49041ad3b3414b40ef.reference = {
    __cReference: true,
    get value() { return W_SCREENBREAK____header_global_e76f8544a16fb869; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:299
export const W_HITTECHWALL3____header_global_d42775454c5ce78b = ((((((360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9cfd17f4355cefff7cac6601() {
  return __cxx_static_address_9cfd17f4355cefff7cac6601.reference || (__cxx_static_address_9cfd17f4355cefff7cac6601.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL3____header_global_d42775454c5ce78b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:300
export const W_HITTECHWALL4____header_global_92ff3bff681fc1b3 = ((((((361) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4fb912baa9e23cf65c738a63() {
  return __cxx_static_address_4fb912baa9e23cf65c738a63.reference || (__cxx_static_address_4fb912baa9e23cf65c738a63.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL4____header_global_92ff3bff681fc1b3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:301
export const W_HITTECHWALL2____header_global_54cec756c772961d = ((((((362) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_37638f3ab1e9dc3e0430aaf7() {
  return __cxx_static_address_37638f3ab1e9dc3e0430aaf7.reference || (__cxx_static_address_37638f3ab1e9dc3e0430aaf7.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL2____header_global_54cec756c772961d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:302
export const W_HITTECHWALL1____header_global_1524ff9a5178d4ab = ((((((363) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ec137e9e4697e0152b463d43() {
  return __cxx_static_address_ec137e9e4697e0152b463d43.reference || (__cxx_static_address_ec137e9e4697e0152b463d43.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL1____header_global_1524ff9a5178d4ab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:303
export const MASKWALL10____header_global_53a079a6f1385645 = ((((((387) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0b355988b7729e289924b3f0() {
  return __cxx_static_address_0b355988b7729e289924b3f0.reference || (__cxx_static_address_0b355988b7729e289924b3f0.reference = {
    __cReference: true,
    get value() { return MASKWALL10____header_global_53a079a6f1385645; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:304
export const MASKWALL11____header_global_be8fcb1b10fff2c8 = ((((((391) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_044bb0126cdb14fb5c8d85bc() {
  return __cxx_static_address_044bb0126cdb14fb5c8d85bc.reference || (__cxx_static_address_044bb0126cdb14fb5c8d85bc.reference = {
    __cReference: true,
    get value() { return MASKWALL11____header_global_be8fcb1b10fff2c8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:305
export const DOORTILE22____header_global_b96fd2237db0e225 = ((((((395) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5f63934b464df97890600038() {
  return __cxx_static_address_5f63934b464df97890600038.reference || (__cxx_static_address_5f63934b464df97890600038.reference = {
    __cReference: true,
    get value() { return DOORTILE22____header_global_b96fd2237db0e225; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:306
export const FANSPRITE____header_global_1d5b734bbfbc3c5e = ((((((407) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_03b59661716831e48a50f818() {
  return __cxx_static_address_03b59661716831e48a50f818.reference || (__cxx_static_address_03b59661716831e48a50f818.reference = {
    __cReference: true,
    get value() { return FANSPRITE____header_global_1d5b734bbfbc3c5e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:307
export const FANSPRITEBROKE____header_global_f11855fa4858d73f = ((((((411) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5da72388d7e593ddead3ff62() {
  return __cxx_static_address_5da72388d7e593ddead3ff62.reference || (__cxx_static_address_5da72388d7e593ddead3ff62.reference = {
    __cReference: true,
    get value() { return FANSPRITEBROKE____header_global_f11855fa4858d73f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:308
export const FANSHADOW____header_global_493fc028e5bb2023 = ((((((412) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6ac3db298f855a927b30ebde() {
  return __cxx_static_address_6ac3db298f855a927b30ebde.reference || (__cxx_static_address_6ac3db298f855a927b30ebde.reference = {
    __cReference: true,
    get value() { return FANSHADOW____header_global_493fc028e5bb2023; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:309
export const FANSHADOWBROKE____header_global_9f04db667085c381 = ((((((416) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b273cc38e51d06694f654c6e() {
  return __cxx_static_address_b273cc38e51d06694f654c6e.reference || (__cxx_static_address_b273cc38e51d06694f654c6e.reference = {
    __cReference: true,
    get value() { return FANSHADOWBROKE____header_global_9f04db667085c381; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:310
export const DOORTILE18____header_global_486274eb3f517d25 = ((((((447) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5d3699ebc07155237b4fc37f() {
  return __cxx_static_address_5d3699ebc07155237b4fc37f.reference || (__cxx_static_address_5d3699ebc07155237b4fc37f.reference = {
    __cReference: true,
    get value() { return DOORTILE18____header_global_486274eb3f517d25; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:311
export const DOORTILE19____header_global_13ff436da6ca93c1 = ((((((448) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8b5a9e389077dcb4a10c586b() {
  return __cxx_static_address_8b5a9e389077dcb4a10c586b.reference || (__cxx_static_address_8b5a9e389077dcb4a10c586b.reference = {
    __cReference: true,
    get value() { return DOORTILE19____header_global_13ff436da6ca93c1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:312
export const DOORTILE20____header_global_471b15421c630d99 = ((((((449) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dac1b3ba8523ee32604fcc49() {
  return __cxx_static_address_dac1b3ba8523ee32604fcc49.reference || (__cxx_static_address_dac1b3ba8523ee32604fcc49.reference = {
    __cReference: true,
    get value() { return DOORTILE20____header_global_471b15421c630d99; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:313
export const VIEWSCREEN2____header_global_7bba5f8574f3e896 = ((((((499) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bd0b1e93665508cc7533a6ad() {
  return __cxx_static_address_bd0b1e93665508cc7533a6ad.reference || (__cxx_static_address_bd0b1e93665508cc7533a6ad.reference = {
    __cReference: true,
    get value() { return VIEWSCREEN2____header_global_7bba5f8574f3e896; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:314
export const VIEWSCREEN____header_global_5f3aae97ec4414d0 = ((((((502) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_83ee960d18d0b6e804431dce() {
  return __cxx_static_address_83ee960d18d0b6e804431dce.reference || (__cxx_static_address_83ee960d18d0b6e804431dce.reference = {
    __cReference: true,
    get value() { return VIEWSCREEN____header_global_5f3aae97ec4414d0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:315
export const GLASS____header_global_8d2b06320259102d = ((((((503) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2060158e27eedda2d15d6ed0() {
  return __cxx_static_address_2060158e27eedda2d15d6ed0.reference || (__cxx_static_address_2060158e27eedda2d15d6ed0.reference = {
    __cReference: true,
    get value() { return GLASS____header_global_8d2b06320259102d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:316
export const GLASS2____header_global_dbc4e10d29a25a83 = ((((((504) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2611ba34977720b906ff18c1() {
  return __cxx_static_address_2611ba34977720b906ff18c1.reference || (__cxx_static_address_2611ba34977720b906ff18c1.reference = {
    __cReference: true,
    get value() { return GLASS2____header_global_dbc4e10d29a25a83; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:317
export const STAINGLASS1____header_global_fca6b42d3252803f = ((((((510) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cdc9919e0ae4eb166a29e5dc() {
  return __cxx_static_address_cdc9919e0ae4eb166a29e5dc.reference || (__cxx_static_address_cdc9919e0ae4eb166a29e5dc.reference = {
    __cReference: true,
    get value() { return STAINGLASS1____header_global_fca6b42d3252803f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:318
export const MASKWALL5____header_global_d72a5d6f782bf8f2 = ((((((514) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d7b715405368d319d800bdae() {
  return __cxx_static_address_d7b715405368d319d800bdae.reference || (__cxx_static_address_d7b715405368d319d800bdae.reference = {
    __cReference: true,
    get value() { return MASKWALL5____header_global_d72a5d6f782bf8f2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:319
export const SATELITE____header_global_cdc97e65de29ee46 = ((((((516) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9a0b57f3585ecf274bbb81e7() {
  return __cxx_static_address_9a0b57f3585ecf274bbb81e7.reference || (__cxx_static_address_9a0b57f3585ecf274bbb81e7.reference = {
    __cReference: true,
    get value() { return SATELITE____header_global_cdc97e65de29ee46; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:320
export const FUELPOD____header_global_a84fde004efe232f = ((((((517) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d8641e68ffe67f939535e91c() {
  return __cxx_static_address_d8641e68ffe67f939535e91c.reference || (__cxx_static_address_d8641e68ffe67f939535e91c.reference = {
    __cReference: true,
    get value() { return FUELPOD____header_global_a84fde004efe232f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:321
export const CRACK1____header_global_265e082a632c04fd = ((((((546) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_09219dd519b6c580e63d2fdf() {
  return __cxx_static_address_09219dd519b6c580e63d2fdf.reference || (__cxx_static_address_09219dd519b6c580e63d2fdf.reference = {
    __cReference: true,
    get value() { return CRACK1____header_global_265e082a632c04fd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:322
export const CRACK2____header_global_4096af07b8b6ba80 = ((((((547) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c636cfc2cc9401a4352252df() {
  return __cxx_static_address_c636cfc2cc9401a4352252df.reference || (__cxx_static_address_c636cfc2cc9401a4352252df.reference = {
    __cReference: true,
    get value() { return CRACK2____header_global_4096af07b8b6ba80; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:323
export const CRACK3____header_global_58ee35f6ad62a826 = ((((((548) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c6ad32c7edfe4324df80770f() {
  return __cxx_static_address_c6ad32c7edfe4324df80770f.reference || (__cxx_static_address_c6ad32c7edfe4324df80770f.reference = {
    __cReference: true,
    get value() { return CRACK3____header_global_58ee35f6ad62a826; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:324
export const CRACK4____header_global_2284fccb993e96e0 = ((((((549) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_441620d674f8a67a25925038() {
  return __cxx_static_address_441620d674f8a67a25925038.reference || (__cxx_static_address_441620d674f8a67a25925038.reference = {
    __cReference: true,
    get value() { return CRACK4____header_global_2284fccb993e96e0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:325
export const FOOTPRINTS____header_global_66d38b57fea06489 = ((((((550) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ef4755bbc9d35a3d2c1a9dd1() {
  return __cxx_static_address_ef4755bbc9d35a3d2c1a9dd1.reference || (__cxx_static_address_ef4755bbc9d35a3d2c1a9dd1.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS____header_global_66d38b57fea06489; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:326
export const DOMELITE____header_global_40ca5272bbe7ae52 = ((((((551) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_50886d2c964a048acd4ec126() {
  return __cxx_static_address_50886d2c964a048acd4ec126.reference || (__cxx_static_address_50886d2c964a048acd4ec126.reference = {
    __cReference: true,
    get value() { return DOMELITE____header_global_40ca5272bbe7ae52; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:327
export const CAMERAPOLE____header_global_91350e9769dc696e = ((((((554) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_25f1ada72e2e87dbfdc3549a() {
  return __cxx_static_address_25f1ada72e2e87dbfdc3549a.reference || (__cxx_static_address_25f1ada72e2e87dbfdc3549a.reference = {
    __cReference: true,
    get value() { return CAMERAPOLE____header_global_91350e9769dc696e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:328
export const CHAIR1____header_global_338016afc6018e83 = ((((((556) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e885152386b0020550d1790b() {
  return __cxx_static_address_e885152386b0020550d1790b.reference || (__cxx_static_address_e885152386b0020550d1790b.reference = {
    __cReference: true,
    get value() { return CHAIR1____header_global_338016afc6018e83; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:329
export const CHAIR2____header_global_93d68c6fdbec1fad = ((((((557) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0d5c59da1c165a357912aea2() {
  return __cxx_static_address_0d5c59da1c165a357912aea2.reference || (__cxx_static_address_0d5c59da1c165a357912aea2.reference = {
    __cReference: true,
    get value() { return CHAIR2____header_global_93d68c6fdbec1fad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:330
export const BROKENCHAIR____header_global_17fb72a269e495c9 = ((((((559) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e71bbe3ed753ddcdf7962d67() {
  return __cxx_static_address_e71bbe3ed753ddcdf7962d67.reference || (__cxx_static_address_e71bbe3ed753ddcdf7962d67.reference = {
    __cReference: true,
    get value() { return BROKENCHAIR____header_global_17fb72a269e495c9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:331
export const MIRROR____header_global_5c5a9a66ab8517df = ((((((560) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_96a42cf9276a356ff4da226c() {
  return __cxx_static_address_96a42cf9276a356ff4da226c.reference || (__cxx_static_address_96a42cf9276a356ff4da226c.reference = {
    __cReference: true,
    get value() { return MIRROR____header_global_5c5a9a66ab8517df; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:332
export const WATERFOUNTAIN____header_global_956b0a91631862b2 = ((((((563) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_94cb83ff9a765596aa348ea9() {
  return __cxx_static_address_94cb83ff9a765596aa348ea9.reference || (__cxx_static_address_94cb83ff9a765596aa348ea9.reference = {
    __cReference: true,
    get value() { return WATERFOUNTAIN____header_global_956b0a91631862b2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:333
export const WATERFOUNTAINBROKE____header_global_f78935b2698359a5 = ((((((567) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_60ae327733c92d9f379b6ad0() {
  return __cxx_static_address_60ae327733c92d9f379b6ad0.reference || (__cxx_static_address_60ae327733c92d9f379b6ad0.reference = {
    __cReference: true,
    get value() { return WATERFOUNTAINBROKE____header_global_f78935b2698359a5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:334
export const FEMMAG1____header_global_444d4f2cf0521f0f = ((((((568) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bfe5550ef2e62100fbeb3bbd() {
  return __cxx_static_address_bfe5550ef2e62100fbeb3bbd.reference || (__cxx_static_address_bfe5550ef2e62100fbeb3bbd.reference = {
    __cReference: true,
    get value() { return FEMMAG1____header_global_444d4f2cf0521f0f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:335
export const TOILET____header_global_eb8ad7d3fca21efe = ((((((569) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d3171c6dfd4e7b70ad5e9b07() {
  return __cxx_static_address_d3171c6dfd4e7b70ad5e9b07.reference || (__cxx_static_address_d3171c6dfd4e7b70ad5e9b07.reference = {
    __cReference: true,
    get value() { return TOILET____header_global_eb8ad7d3fca21efe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:336
export const STALL____header_global_cf8bd9518c62ab03 = ((((((571) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_64401af376d863601a43bc65() {
  return __cxx_static_address_64401af376d863601a43bc65.reference || (__cxx_static_address_64401af376d863601a43bc65.reference = {
    __cReference: true,
    get value() { return STALL____header_global_cf8bd9518c62ab03; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:337
export const STALLBROKE____header_global_ad4bd708eac1c5a5 = ((((((573) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8c4dc4f9afa78c6a9c14ef4a() {
  return __cxx_static_address_8c4dc4f9afa78c6a9c14ef4a.reference || (__cxx_static_address_8c4dc4f9afa78c6a9c14ef4a.reference = {
    __cReference: true,
    get value() { return STALLBROKE____header_global_ad4bd708eac1c5a5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:338
export const FEMMAG2____header_global_b1a9f30de71d1971 = ((((((577) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_02b520099a862584f72d71b9() {
  return __cxx_static_address_02b520099a862584f72d71b9.reference || (__cxx_static_address_02b520099a862584f72d71b9.reference = {
    __cReference: true,
    get value() { return FEMMAG2____header_global_b1a9f30de71d1971; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:339
export const REACTOR2____header_global_fdafa5b7e844ecb2 = ((((((578) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_66ccb9693cac5a3abd2d6a8e() {
  return __cxx_static_address_66ccb9693cac5a3abd2d6a8e.reference || (__cxx_static_address_66ccb9693cac5a3abd2d6a8e.reference = {
    __cReference: true,
    get value() { return REACTOR2____header_global_fdafa5b7e844ecb2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:340
export const REACTOR2BURNT____header_global_3a793b2922866819 = ((((((579) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0a047d9df02bc47baffc9232() {
  return __cxx_static_address_0a047d9df02bc47baffc9232.reference || (__cxx_static_address_0a047d9df02bc47baffc9232.reference = {
    __cReference: true,
    get value() { return REACTOR2BURNT____header_global_3a793b2922866819; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:341
export const REACTOR2SPARK____header_global_423f81d5c1056d7b = ((((((580) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_344d4cc10282c8cc30879efb() {
  return __cxx_static_address_344d4cc10282c8cc30879efb.reference || (__cxx_static_address_344d4cc10282c8cc30879efb.reference = {
    __cReference: true,
    get value() { return REACTOR2SPARK____header_global_423f81d5c1056d7b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:342
export const GRATE1____header_global_855d07ecf6117efe = ((((((595) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e8407de8b2c536b587fdbeec() {
  return __cxx_static_address_e8407de8b2c536b587fdbeec.reference || (__cxx_static_address_e8407de8b2c536b587fdbeec.reference = {
    __cReference: true,
    get value() { return GRATE1____header_global_855d07ecf6117efe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:343
export const BGRATE1____header_global_8549ea9ab0213f26 = ((((((596) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7a7de66bf352bad604d96756() {
  return __cxx_static_address_7a7de66bf352bad604d96756.reference || (__cxx_static_address_7a7de66bf352bad604d96756.reference = {
    __cReference: true,
    get value() { return BGRATE1____header_global_8549ea9ab0213f26; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:344
export const SOLARPANNEL____header_global_2c95d528ca714d27 = ((((((602) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3c87185988b37c946d6ba8ec() {
  return __cxx_static_address_3c87185988b37c946d6ba8ec.reference || (__cxx_static_address_3c87185988b37c946d6ba8ec.reference = {
    __cReference: true,
    get value() { return SOLARPANNEL____header_global_2c95d528ca714d27; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:345
export const NAKED1____header_global_51f1ef613e6dfd9d = ((((((603) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_566b2e1bdf204617110aff44() {
  return __cxx_static_address_566b2e1bdf204617110aff44.reference || (__cxx_static_address_566b2e1bdf204617110aff44.reference = {
    __cReference: true,
    get value() { return NAKED1____header_global_51f1ef613e6dfd9d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:346
export const ANTENNA____header_global_82ba6c145f4e12c3 = ((((((607) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fc3600d13eaa389f82a4bd53() {
  return __cxx_static_address_fc3600d13eaa389f82a4bd53.reference || (__cxx_static_address_fc3600d13eaa389f82a4bd53.reference = {
    __cReference: true,
    get value() { return ANTENNA____header_global_82ba6c145f4e12c3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:347
export const MASKWALL12____header_global_38e765ba328b93ce = ((((((609) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d3774a2c256e93185343a908() {
  return __cxx_static_address_d3774a2c256e93185343a908.reference || (__cxx_static_address_d3774a2c256e93185343a908.reference = {
    __cReference: true,
    get value() { return MASKWALL12____header_global_38e765ba328b93ce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:348
export const TOILETBROKE____header_global_e8c1fa2ebb853eed = ((((((615) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_190ba5408ac40a1445975b16() {
  return __cxx_static_address_190ba5408ac40a1445975b16.reference || (__cxx_static_address_190ba5408ac40a1445975b16.reference = {
    __cReference: true,
    get value() { return TOILETBROKE____header_global_e8c1fa2ebb853eed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:349
export const PIPE2____header_global_8991141e710943cb = ((((((616) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2acc94b79224ff18f57cba85() {
  return __cxx_static_address_2acc94b79224ff18f57cba85.reference || (__cxx_static_address_2acc94b79224ff18f57cba85.reference = {
    __cReference: true,
    get value() { return PIPE2____header_global_8991141e710943cb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:350
export const PIPE1B____header_global_9597449529d0fd37 = ((((((617) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eba49f8ad9bf7bff4210b284() {
  return __cxx_static_address_eba49f8ad9bf7bff4210b284.reference || (__cxx_static_address_eba49f8ad9bf7bff4210b284.reference = {
    __cReference: true,
    get value() { return PIPE1B____header_global_9597449529d0fd37; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:351
export const PIPE3____header_global_047ba39db10d525e = ((((((618) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a67ce93fdb8dca64661884da() {
  return __cxx_static_address_a67ce93fdb8dca64661884da.reference || (__cxx_static_address_a67ce93fdb8dca64661884da.reference = {
    __cReference: true,
    get value() { return PIPE3____header_global_047ba39db10d525e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:352
export const PIPE1____header_global_7e0d1273050f5c74 = ((((((619) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8e9f1bb3cfcc251fdc8668f1() {
  return __cxx_static_address_8e9f1bb3cfcc251fdc8668f1.reference || (__cxx_static_address_8e9f1bb3cfcc251fdc8668f1.reference = {
    __cReference: true,
    get value() { return PIPE1____header_global_7e0d1273050f5c74; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:353
export const CAMERA1____header_global_2aaa54d028ee33a5 = ((((((621) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_550e4fb4c1732a9edff8f28f() {
  return __cxx_static_address_550e4fb4c1732a9edff8f28f.reference || (__cxx_static_address_550e4fb4c1732a9edff8f28f.reference = {
    __cReference: true,
    get value() { return CAMERA1____header_global_2aaa54d028ee33a5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:354
export const PIPE2B____header_global_65158334b4593d44 = ((((((633) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4e31bb4eefabbd660d6d3062() {
  return __cxx_static_address_4e31bb4eefabbd660d6d3062.reference || (__cxx_static_address_4e31bb4eefabbd660d6d3062.reference = {
    __cReference: true,
    get value() { return PIPE2B____header_global_65158334b4593d44; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:355
export const BOLT1____header_global_d52940abbbd0ab66 = ((((((634) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5384700ab0d59ec2255e7dab() {
  return __cxx_static_address_5384700ab0d59ec2255e7dab.reference || (__cxx_static_address_5384700ab0d59ec2255e7dab.reference = {
    __cReference: true,
    get value() { return BOLT1____header_global_d52940abbbd0ab66; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:356
export const W_NUMBERS____header_global_ca628d0f1b7b8bf8 = ((((((640) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ecf605d74a276012559b9288() {
  return __cxx_static_address_ecf605d74a276012559b9288.reference || (__cxx_static_address_ecf605d74a276012559b9288.reference = {
    __cReference: true,
    get value() { return W_NUMBERS____header_global_ca628d0f1b7b8bf8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:357
export const WATERDRIP____header_global_cf840fc3a5deb9f4 = ((((((660) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_50c7fe99828a656ae066d0c4() {
  return __cxx_static_address_50c7fe99828a656ae066d0c4.reference || (__cxx_static_address_50c7fe99828a656ae066d0c4.reference = {
    __cReference: true,
    get value() { return WATERDRIP____header_global_cf840fc3a5deb9f4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:358
export const WATERBUBBLE____header_global_d3c53732410d581d = ((((((661) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d72f79ed2c52c45f0e3d6b57() {
  return __cxx_static_address_d72f79ed2c52c45f0e3d6b57.reference || (__cxx_static_address_d72f79ed2c52c45f0e3d6b57.reference = {
    __cReference: true,
    get value() { return WATERBUBBLE____header_global_d3c53732410d581d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:359
export const WATERBUBBLEMAKER____header_global_ffcd4b59cfdf4a16 = ((((((662) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_684c1e3d4988843a01e9eaa9() {
  return __cxx_static_address_684c1e3d4988843a01e9eaa9.reference || (__cxx_static_address_684c1e3d4988843a01e9eaa9.reference = {
    __cReference: true,
    get value() { return WATERBUBBLEMAKER____header_global_ffcd4b59cfdf4a16; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:360
export const W_FORCEFIELD____header_global_b74269554834610a = ((((((663) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_561af8b9c6fc55988e5146c1() {
  return __cxx_static_address_561af8b9c6fc55988e5146c1.reference || (__cxx_static_address_561af8b9c6fc55988e5146c1.reference = {
    __cReference: true,
    get value() { return W_FORCEFIELD____header_global_b74269554834610a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:361
export const VACUUM____header_global_c3150ab4b8ff68f8 = ((((((669) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ab3bde5bb646db1edbb0aa84() {
  return __cxx_static_address_ab3bde5bb646db1edbb0aa84.reference || (__cxx_static_address_ab3bde5bb646db1edbb0aa84.reference = {
    __cReference: true,
    get value() { return VACUUM____header_global_c3150ab4b8ff68f8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:362
export const FOOTPRINTS2____header_global_a613f9343998d7bc = ((((((672) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bc254182c705d71e4d91e18a() {
  return __cxx_static_address_bc254182c705d71e4d91e18a.reference || (__cxx_static_address_bc254182c705d71e4d91e18a.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS2____header_global_a613f9343998d7bc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:363
export const FOOTPRINTS3____header_global_79863e27abce93de = ((((((673) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_09c9399e99f544e7819a6323() {
  return __cxx_static_address_09c9399e99f544e7819a6323.reference || (__cxx_static_address_09c9399e99f544e7819a6323.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS3____header_global_79863e27abce93de; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:364
export const FOOTPRINTS4____header_global_3ab7d5a706621283 = ((((((674) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b3cc208a96374a4edffc25a7() {
  return __cxx_static_address_b3cc208a96374a4edffc25a7.reference || (__cxx_static_address_b3cc208a96374a4edffc25a7.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS4____header_global_3ab7d5a706621283; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:365
export const EGG____header_global_19d8b4302b298afa = ((((((675) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9450805a629073226c283500() {
  return __cxx_static_address_9450805a629073226c283500.reference || (__cxx_static_address_9450805a629073226c283500.reference = {
    __cReference: true,
    get value() { return EGG____header_global_19d8b4302b298afa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:366
export const SCALE____header_global_ee5b83b65e8cd1e2 = ((((((678) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_89f2648952cbe4c075bb2719() {
  return __cxx_static_address_89f2648952cbe4c075bb2719.reference || (__cxx_static_address_89f2648952cbe4c075bb2719.reference = {
    __cReference: true,
    get value() { return SCALE____header_global_ee5b83b65e8cd1e2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:367
export const CHAIR3____header_global_a4833a862140d408 = ((((((680) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7ef2659bb41257caa852a36d() {
  return __cxx_static_address_7ef2659bb41257caa852a36d.reference || (__cxx_static_address_7ef2659bb41257caa852a36d.reference = {
    __cReference: true,
    get value() { return CHAIR3____header_global_a4833a862140d408; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:368
export const CAMERALIGHT____header_global_41bfdf766b5474da = ((((((685) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1a44291a0b78dba9cc2365ec() {
  return __cxx_static_address_1a44291a0b78dba9cc2365ec.reference || (__cxx_static_address_1a44291a0b78dba9cc2365ec.reference = {
    __cReference: true,
    get value() { return CAMERALIGHT____header_global_41bfdf766b5474da; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:369
export const MOVIECAMERA____header_global_938f2a873a9e1a5b = ((((((686) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_35a453744e5824d6cb9d435c() {
  return __cxx_static_address_35a453744e5824d6cb9d435c.reference || (__cxx_static_address_35a453744e5824d6cb9d435c.reference = {
    __cReference: true,
    get value() { return MOVIECAMERA____header_global_938f2a873a9e1a5b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:370
export const IVUNIT____header_global_b08aa1e7e6508b6e = ((((((689) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9cda81ac02d7972462aefc4d() {
  return __cxx_static_address_9cda81ac02d7972462aefc4d.reference || (__cxx_static_address_9cda81ac02d7972462aefc4d.reference = {
    __cReference: true,
    get value() { return IVUNIT____header_global_b08aa1e7e6508b6e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:371
export const POT1____header_global_c0606ebdf09e3f2d = ((((((694) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eb6e3f4044ae5ce406e8426d() {
  return __cxx_static_address_eb6e3f4044ae5ce406e8426d.reference || (__cxx_static_address_eb6e3f4044ae5ce406e8426d.reference = {
    __cReference: true,
    get value() { return POT1____header_global_c0606ebdf09e3f2d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:372
export const POT2____header_global_c397d94ceff59818 = ((((((695) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f44c15ae65baa66fdcd377d0() {
  return __cxx_static_address_f44c15ae65baa66fdcd377d0.reference || (__cxx_static_address_f44c15ae65baa66fdcd377d0.reference = {
    __cReference: true,
    get value() { return POT2____header_global_c397d94ceff59818; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:373
export const POT3____header_global_defcd0a265ddc1ea = ((((((697) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cacfa6970ddbeca6dc1097f7() {
  return __cxx_static_address_cacfa6970ddbeca6dc1097f7.reference || (__cxx_static_address_cacfa6970ddbeca6dc1097f7.reference = {
    __cReference: true,
    get value() { return POT3____header_global_defcd0a265ddc1ea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:374
export const PIPE3B____header_global_1ee1e38db246a115 = ((((((700) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6cedd9eabcb4407c2faa26dc() {
  return __cxx_static_address_6cedd9eabcb4407c2faa26dc.reference || (__cxx_static_address_6cedd9eabcb4407c2faa26dc.reference = {
    __cReference: true,
    get value() { return PIPE3B____header_global_1ee1e38db246a115; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:375
export const WALLLIGHT3____header_global_653c3dd6d3c033e6 = ((((((701) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fe6e7ebaab18ac927c3843bb() {
  return __cxx_static_address_fe6e7ebaab18ac927c3843bb.reference || (__cxx_static_address_fe6e7ebaab18ac927c3843bb.reference = {
    __cReference: true,
    get value() { return WALLLIGHT3____header_global_653c3dd6d3c033e6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:376
export const WALLLIGHTBUST3____header_global_08666a08fd5081a6 = ((((((702) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d9f6e863b8d32d3de8834cd0() {
  return __cxx_static_address_d9f6e863b8d32d3de8834cd0.reference || (__cxx_static_address_d9f6e863b8d32d3de8834cd0.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST3____header_global_08666a08fd5081a6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:377
export const WALLLIGHT1____header_global_5ba011cc5f7fe594 = ((((((703) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_90e6f5ae486cd215cf544357() {
  return __cxx_static_address_90e6f5ae486cd215cf544357.reference || (__cxx_static_address_90e6f5ae486cd215cf544357.reference = {
    __cReference: true,
    get value() { return WALLLIGHT1____header_global_5ba011cc5f7fe594; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:378
export const WALLLIGHTBUST1____header_global_3adc29fa1980e074 = ((((((704) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5a005c575bf99372eda53277() {
  return __cxx_static_address_5a005c575bf99372eda53277.reference || (__cxx_static_address_5a005c575bf99372eda53277.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST1____header_global_3adc29fa1980e074; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:379
export const WALLLIGHT2____header_global_8bf725697d40d873 = ((((((705) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_efdca18e800cd3313aeaf8c4() {
  return __cxx_static_address_efdca18e800cd3313aeaf8c4.reference || (__cxx_static_address_efdca18e800cd3313aeaf8c4.reference = {
    __cReference: true,
    get value() { return WALLLIGHT2____header_global_8bf725697d40d873; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:380
export const WALLLIGHTBUST2____header_global_32d2b72eafb66f04 = ((((((706) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_11b50e66d5d820c98463c3f4() {
  return __cxx_static_address_11b50e66d5d820c98463c3f4.reference || (__cxx_static_address_11b50e66d5d820c98463c3f4.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST2____header_global_32d2b72eafb66f04; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:381
export const LIGHTSWITCH2____header_global_3c24407e584afb43 = ((((((712) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5709da4f3b6728ec986ea180() {
  return __cxx_static_address_5709da4f3b6728ec986ea180.reference || (__cxx_static_address_5709da4f3b6728ec986ea180.reference = {
    __cReference: true,
    get value() { return LIGHTSWITCH2____header_global_3c24407e584afb43; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:382
export const WAITTOBESEATED____header_global_2de6273ffe9eb318 = ((((((716) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_724e817301c24940943a3de2() {
  return __cxx_static_address_724e817301c24940943a3de2.reference || (__cxx_static_address_724e817301c24940943a3de2.reference = {
    __cReference: true,
    get value() { return WAITTOBESEATED____header_global_2de6273ffe9eb318; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:383
export const DOORTILE14____header_global_b53704eafc5812fa = ((((((717) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_00c4f8023ebce71ad506679c() {
  return __cxx_static_address_00c4f8023ebce71ad506679c.reference || (__cxx_static_address_00c4f8023ebce71ad506679c.reference = {
    __cReference: true,
    get value() { return DOORTILE14____header_global_b53704eafc5812fa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:384
export const STATUE____header_global_0f9f2fc0d837ec4e = ((((((753) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dcf581d1802b75de1b3018fb() {
  return __cxx_static_address_dcf581d1802b75de1b3018fb.reference || (__cxx_static_address_dcf581d1802b75de1b3018fb.reference = {
    __cReference: true,
    get value() { return STATUE____header_global_0f9f2fc0d837ec4e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:385
export const MIKE____header_global_49bd5148aab86a5a = ((((((762) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_218be4b9dc5e396ea650b2f2() {
  return __cxx_static_address_218be4b9dc5e396ea650b2f2.reference || (__cxx_static_address_218be4b9dc5e396ea650b2f2.reference = {
    __cReference: true,
    get value() { return MIKE____header_global_49bd5148aab86a5a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:386
export const VASE____header_global_ae1fe7bf4c6d0907 = ((((((765) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bee3676a805c98554d29feb3() {
  return __cxx_static_address_bee3676a805c98554d29feb3.reference || (__cxx_static_address_bee3676a805c98554d29feb3.reference = {
    __cReference: true,
    get value() { return VASE____header_global_ae1fe7bf4c6d0907; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:387
export const SUSHIPLATE1____header_global_931daf9ff4cf75b4 = ((((((768) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d3c0cc39ee5d7c4f095b7b4b() {
  return __cxx_static_address_d3c0cc39ee5d7c4f095b7b4b.reference || (__cxx_static_address_d3c0cc39ee5d7c4f095b7b4b.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE1____header_global_931daf9ff4cf75b4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:388
export const SUSHIPLATE2____header_global_f2adf6922ba6fd78 = ((((((769) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_43c074efa4274d7417466532() {
  return __cxx_static_address_43c074efa4274d7417466532.reference || (__cxx_static_address_43c074efa4274d7417466532.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE2____header_global_f2adf6922ba6fd78; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:389
export const SUSHIPLATE3____header_global_64609813efbf5a1f = ((((((774) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_46a13ebf13037ff9e19fa016() {
  return __cxx_static_address_46a13ebf13037ff9e19fa016.reference || (__cxx_static_address_46a13ebf13037ff9e19fa016.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE3____header_global_64609813efbf5a1f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:390
export const SUSHIPLATE4____header_global_a336ae3250c2fda0 = ((((((779) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8aeb77ece4a5d32fd79c1ff3() {
  return __cxx_static_address_8aeb77ece4a5d32fd79c1ff3.reference || (__cxx_static_address_8aeb77ece4a5d32fd79c1ff3.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE4____header_global_a336ae3250c2fda0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:391
export const DOORTILE16____header_global_f2376214a5d17639 = ((((((781) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d649bebf7f37f51d91a02dbf() {
  return __cxx_static_address_d649bebf7f37f51d91a02dbf.reference || (__cxx_static_address_d649bebf7f37f51d91a02dbf.reference = {
    __cReference: true,
    get value() { return DOORTILE16____header_global_f2376214a5d17639; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:392
export const SUSHIPLATE5____header_global_bf44bf892bb47c69 = ((((((792) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2339175eab99a85440f24310() {
  return __cxx_static_address_2339175eab99a85440f24310.reference || (__cxx_static_address_2339175eab99a85440f24310.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE5____header_global_bf44bf892bb47c69; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:393
export const OJ____header_global_f6301a65387c8422 = ((((((806) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_61024e6f7ac3ba96a89bcae0() {
  return __cxx_static_address_61024e6f7ac3ba96a89bcae0.reference || (__cxx_static_address_61024e6f7ac3ba96a89bcae0.reference = {
    __cReference: true,
    get value() { return OJ____header_global_f6301a65387c8422; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:394
export const MASKWALL13____header_global_c6040024e9a55a26 = ((((((830) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8463058164f1609dcd10f808() {
  return __cxx_static_address_8463058164f1609dcd10f808.reference || (__cxx_static_address_8463058164f1609dcd10f808.reference = {
    __cReference: true,
    get value() { return MASKWALL13____header_global_c6040024e9a55a26; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:395
export const HURTRAIL____header_global_bef456c30967812b = ((((((859) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dd369bcca7125dfd0dde30f9() {
  return __cxx_static_address_dd369bcca7125dfd0dde30f9.reference || (__cxx_static_address_dd369bcca7125dfd0dde30f9.reference = {
    __cReference: true,
    get value() { return HURTRAIL____header_global_bef456c30967812b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:396
export const POWERSWITCH1____header_global_b9376adcba3179fb = ((((((860) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0080b2fb3b7fa4713c1f0fa1() {
  return __cxx_static_address_0080b2fb3b7fa4713c1f0fa1.reference || (__cxx_static_address_0080b2fb3b7fa4713c1f0fa1.reference = {
    __cReference: true,
    get value() { return POWERSWITCH1____header_global_b9376adcba3179fb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:397
export const LOCKSWITCH1____header_global_ff7458f3e2616943 = ((((((862) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_407eeb8a6cae59b116995e95() {
  return __cxx_static_address_407eeb8a6cae59b116995e95.reference || (__cxx_static_address_407eeb8a6cae59b116995e95.reference = {
    __cReference: true,
    get value() { return LOCKSWITCH1____header_global_ff7458f3e2616943; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:398
export const POWERSWITCH2____header_global_c1d13907824f7260 = ((((((864) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a525acad63ebfc57bd86e257() {
  return __cxx_static_address_a525acad63ebfc57bd86e257.reference || (__cxx_static_address_a525acad63ebfc57bd86e257.reference = {
    __cReference: true,
    get value() { return POWERSWITCH2____header_global_c1d13907824f7260; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:399
export const ATM____header_global_13bd8850cf46fdff = ((((((867) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_abc5d6865a0401efe9435efb() {
  return __cxx_static_address_abc5d6865a0401efe9435efb.reference || (__cxx_static_address_abc5d6865a0401efe9435efb.reference = {
    __cReference: true,
    get value() { return ATM____header_global_13bd8850cf46fdff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:400
export const STATUEFLASH____header_global_a62a1afebbd131dc = ((((((869) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a031242157fe6654d3f288da() {
  return __cxx_static_address_a031242157fe6654d3f288da.reference || (__cxx_static_address_a031242157fe6654d3f288da.reference = {
    __cReference: true,
    get value() { return STATUEFLASH____header_global_a62a1afebbd131dc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:401
export const ATMBROKE____header_global_53fcdad41b647875 = ((((((888) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a355dd2dfd35b9916fe823b7() {
  return __cxx_static_address_a355dd2dfd35b9916fe823b7.reference || (__cxx_static_address_a355dd2dfd35b9916fe823b7.reference = {
    __cReference: true,
    get value() { return ATMBROKE____header_global_53fcdad41b647875; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:402
export const STRIPEBALL____header_global_6c981d78b3b146ed = ((((((901) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_54dc30f56f71503d61726c9a() {
  return __cxx_static_address_54dc30f56f71503d61726c9a.reference || (__cxx_static_address_54dc30f56f71503d61726c9a.reference = {
    __cReference: true,
    get value() { return STRIPEBALL____header_global_6c981d78b3b146ed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:403
export const QUEBALL____header_global_b2b88b0ab1b3bd3e = ((((((902) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ddbf84fb07edda443d84b5f9() {
  return __cxx_static_address_ddbf84fb07edda443d84b5f9.reference || (__cxx_static_address_ddbf84fb07edda443d84b5f9.reference = {
    __cReference: true,
    get value() { return QUEBALL____header_global_b2b88b0ab1b3bd3e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:404
export const POCKET____header_global_f01aae31439181e0 = ((((((903) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dc1dbbae731cf2b421eada62() {
  return __cxx_static_address_dc1dbbae731cf2b421eada62.reference || (__cxx_static_address_dc1dbbae731cf2b421eada62.reference = {
    __cReference: true,
    get value() { return POCKET____header_global_f01aae31439181e0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:405
export const WOODENHORSE____header_global_508c7cd27f8d320b = ((((((904) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_62c5a78c3a4e13dae8c10615() {
  return __cxx_static_address_62c5a78c3a4e13dae8c10615.reference || (__cxx_static_address_62c5a78c3a4e13dae8c10615.reference = {
    __cReference: true,
    get value() { return WOODENHORSE____header_global_508c7cd27f8d320b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:406
export const TREE1____header_global_d425de5ae6bb6526 = ((((((908) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5f7bba3aa6325a008f516fbc() {
  return __cxx_static_address_5f7bba3aa6325a008f516fbc.reference || (__cxx_static_address_5f7bba3aa6325a008f516fbc.reference = {
    __cReference: true,
    get value() { return TREE1____header_global_d425de5ae6bb6526; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:407
export const TREE2____header_global_db0ca01d62156929 = ((((((910) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_160055fb126250e9744c5968() {
  return __cxx_static_address_160055fb126250e9744c5968.reference || (__cxx_static_address_160055fb126250e9744c5968.reference = {
    __cReference: true,
    get value() { return TREE2____header_global_db0ca01d62156929; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:408
export const CACTUS____header_global_2d9108259264b9d4 = ((((((911) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_29fa1a1902ba705bfa18e9af() {
  return __cxx_static_address_29fa1a1902ba705bfa18e9af.reference || (__cxx_static_address_29fa1a1902ba705bfa18e9af.reference = {
    __cReference: true,
    get value() { return CACTUS____header_global_2d9108259264b9d4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:409
export const MASKWALL2____header_global_61d2f92b84b86da8 = ((((((913) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a94db5bdcdc6f0b158d5f906() {
  return __cxx_static_address_a94db5bdcdc6f0b158d5f906.reference || (__cxx_static_address_a94db5bdcdc6f0b158d5f906.reference = {
    __cReference: true,
    get value() { return MASKWALL2____header_global_61d2f92b84b86da8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:410
export const MASKWALL3____header_global_92fc94a6aeab4e7a = ((((((914) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d16ad1d58ee0be0add4f4b88() {
  return __cxx_static_address_d16ad1d58ee0be0add4f4b88.reference || (__cxx_static_address_d16ad1d58ee0be0add4f4b88.reference = {
    __cReference: true,
    get value() { return MASKWALL3____header_global_92fc94a6aeab4e7a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:411
export const MASKWALL4____header_global_ede5d04c29b0f52b = ((((((915) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2b4682f6578862d1218662ca() {
  return __cxx_static_address_2b4682f6578862d1218662ca.reference || (__cxx_static_address_2b4682f6578862d1218662ca.reference = {
    __cReference: true,
    get value() { return MASKWALL4____header_global_ede5d04c29b0f52b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:412
export const FIREEXT____header_global_6e21f8ccaad8bc2d = ((((((916) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1058a1e9366406ff8863d612() {
  return __cxx_static_address_1058a1e9366406ff8863d612.reference || (__cxx_static_address_1058a1e9366406ff8863d612.reference = {
    __cReference: true,
    get value() { return FIREEXT____header_global_6e21f8ccaad8bc2d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:413
export const TOILETWATER____header_global_595d3356ba004030 = ((((((921) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aa6a70059f905b613f91df6a() {
  return __cxx_static_address_aa6a70059f905b613f91df6a.reference || (__cxx_static_address_aa6a70059f905b613f91df6a.reference = {
    __cReference: true,
    get value() { return TOILETWATER____header_global_595d3356ba004030; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:414
export const NEON1____header_global_740d0d22b412549a = ((((((925) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b405f798a46f6a47fccca1fe() {
  return __cxx_static_address_b405f798a46f6a47fccca1fe.reference || (__cxx_static_address_b405f798a46f6a47fccca1fe.reference = {
    __cReference: true,
    get value() { return NEON1____header_global_740d0d22b412549a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:415
export const NEON2____header_global_926caa46bef51347 = ((((((926) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_81c224cec8fa4b95bc81b104() {
  return __cxx_static_address_81c224cec8fa4b95bc81b104.reference || (__cxx_static_address_81c224cec8fa4b95bc81b104.reference = {
    __cReference: true,
    get value() { return NEON2____header_global_926caa46bef51347; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:416
export const CACTUSBROKE____header_global_16371ab563127ae1 = ((((((939) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_162d525c2cfe96d73634cf3e() {
  return __cxx_static_address_162d525c2cfe96d73634cf3e.reference || (__cxx_static_address_162d525c2cfe96d73634cf3e.reference = {
    __cReference: true,
    get value() { return CACTUSBROKE____header_global_16371ab563127ae1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:417
export const BOUNCEMINE____header_global_20f885f63a5cf116 = ((((((940) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b6f8d16ec581e80bba972862() {
  return __cxx_static_address_b6f8d16ec581e80bba972862.reference || (__cxx_static_address_b6f8d16ec581e80bba972862.reference = {
    __cReference: true,
    get value() { return BOUNCEMINE____header_global_20f885f63a5cf116; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:418
export const BROKEFIREHYDRENT____header_global_5515e3513abf67e4 = ((((((950) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_173bb3b2b1130b57c21a655a() {
  return __cxx_static_address_173bb3b2b1130b57c21a655a.reference || (__cxx_static_address_173bb3b2b1130b57c21a655a.reference = {
    __cReference: true,
    get value() { return BROKEFIREHYDRENT____header_global_5515e3513abf67e4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:419
export const BOX____header_global_1db989da9f40e21d = ((((((951) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0023cf4c3bdb6c034251d807() {
  return __cxx_static_address_0023cf4c3bdb6c034251d807.reference || (__cxx_static_address_0023cf4c3bdb6c034251d807.reference = {
    __cReference: true,
    get value() { return BOX____header_global_1db989da9f40e21d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:420
export const BULLETHOLE____header_global_b0e4fd8085306ae8 = ((((((952) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b84c22b8bdf2f5fec3f5fe19() {
  return __cxx_static_address_b84c22b8bdf2f5fec3f5fe19.reference || (__cxx_static_address_b84c22b8bdf2f5fec3f5fe19.reference = {
    __cReference: true,
    get value() { return BULLETHOLE____header_global_b0e4fd8085306ae8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:421
export const BOTTLE1____header_global_23fec076432df153 = ((((((954) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0d5918b75e0aba25be2f92a7() {
  return __cxx_static_address_0d5918b75e0aba25be2f92a7.reference || (__cxx_static_address_0d5918b75e0aba25be2f92a7.reference = {
    __cReference: true,
    get value() { return BOTTLE1____header_global_23fec076432df153; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:422
export const BOTTLE2____header_global_f394ffa6d4678962 = ((((((955) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b14174fbbbfa420ab3229b5c() {
  return __cxx_static_address_b14174fbbbfa420ab3229b5c.reference || (__cxx_static_address_b14174fbbbfa420ab3229b5c.reference = {
    __cReference: true,
    get value() { return BOTTLE2____header_global_f394ffa6d4678962; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:423
export const BOTTLE3____header_global_456008489f145a49 = ((((((956) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b8cc09b5238ab7be683aa0d1() {
  return __cxx_static_address_b8cc09b5238ab7be683aa0d1.reference || (__cxx_static_address_b8cc09b5238ab7be683aa0d1.reference = {
    __cReference: true,
    get value() { return BOTTLE3____header_global_456008489f145a49; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:424
export const BOTTLE4____header_global_721cc330725fd410 = ((((((957) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e25ddd503f7e12a0ee78734c() {
  return __cxx_static_address_e25ddd503f7e12a0ee78734c.reference || (__cxx_static_address_e25ddd503f7e12a0ee78734c.reference = {
    __cReference: true,
    get value() { return BOTTLE4____header_global_721cc330725fd410; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:425
export const FEMPIC5____header_global_9ec89df667272663 = ((((((963) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_50de36f8a083e6cdbd641a5a() {
  return __cxx_static_address_50de36f8a083e6cdbd641a5a.reference || (__cxx_static_address_50de36f8a083e6cdbd641a5a.reference = {
    __cReference: true,
    get value() { return FEMPIC5____header_global_9ec89df667272663; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:426
export const FEMPIC6____header_global_cbdc38674d8070c4 = ((((((964) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d4e6a15026b42f1dabc54c87() {
  return __cxx_static_address_d4e6a15026b42f1dabc54c87.reference || (__cxx_static_address_d4e6a15026b42f1dabc54c87.reference = {
    __cReference: true,
    get value() { return FEMPIC6____header_global_cbdc38674d8070c4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:427
export const FEMPIC7____header_global_80b712d726ddf54c = ((((((965) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3247c2d61acefae6a71a75a8() {
  return __cxx_static_address_3247c2d61acefae6a71a75a8.reference || (__cxx_static_address_3247c2d61acefae6a71a75a8.reference = {
    __cReference: true,
    get value() { return FEMPIC7____header_global_80b712d726ddf54c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:428
export const HYDROPLANT____header_global_1b2c6f81f6c89d00 = ((((((969) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0f7069f57db68dfe569678b2() {
  return __cxx_static_address_0f7069f57db68dfe569678b2.reference || (__cxx_static_address_0f7069f57db68dfe569678b2.reference = {
    __cReference: true,
    get value() { return HYDROPLANT____header_global_1b2c6f81f6c89d00; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:429
export const OCEANSPRITE1____header_global_60e2d2727ef57266 = ((((((971) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7248a551a315ff68e2f38cb4() {
  return __cxx_static_address_7248a551a315ff68e2f38cb4.reference || (__cxx_static_address_7248a551a315ff68e2f38cb4.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE1____header_global_60e2d2727ef57266; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:430
export const OCEANSPRITE2____header_global_5aae0161cb2842e9 = ((((((972) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_284ad099e464e58a385d61f9() {
  return __cxx_static_address_284ad099e464e58a385d61f9.reference || (__cxx_static_address_284ad099e464e58a385d61f9.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE2____header_global_5aae0161cb2842e9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:431
export const OCEANSPRITE3____header_global_92cb125f391cbe06 = ((((((973) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c71e382cd47959b6fb97d947() {
  return __cxx_static_address_c71e382cd47959b6fb97d947.reference || (__cxx_static_address_c71e382cd47959b6fb97d947.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE3____header_global_92cb125f391cbe06; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:432
export const OCEANSPRITE4____header_global_930541196c0aa6a4 = ((((((974) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bfdf2638bf48fbfe21ea7807() {
  return __cxx_static_address_bfdf2638bf48fbfe21ea7807.reference || (__cxx_static_address_bfdf2638bf48fbfe21ea7807.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE4____header_global_930541196c0aa6a4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:433
export const OCEANSPRITE5____header_global_04900eba37eb12c0 = ((((((975) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_654dc42d821913b7e0adf2f7() {
  return __cxx_static_address_654dc42d821913b7e0adf2f7.reference || (__cxx_static_address_654dc42d821913b7e0adf2f7.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE5____header_global_04900eba37eb12c0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:434
export const GENERICPOLE____header_global_c2ced27596ef4cc6 = ((((((977) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dd4c8ce773651250bbcd78f5() {
  return __cxx_static_address_dd4c8ce773651250bbcd78f5.reference || (__cxx_static_address_dd4c8ce773651250bbcd78f5.reference = {
    __cReference: true,
    get value() { return GENERICPOLE____header_global_c2ced27596ef4cc6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:435
export const CONE____header_global_35078940acea2e6f = ((((((978) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_85fccf7959d37dbc3197c77e() {
  return __cxx_static_address_85fccf7959d37dbc3197c77e.reference || (__cxx_static_address_85fccf7959d37dbc3197c77e.reference = {
    __cReference: true,
    get value() { return CONE____header_global_35078940acea2e6f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:436
export const HANGLIGHT____header_global_541a045e1a3caec5 = ((((((979) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4cf2ec7a3ccc0188d4bd9b25() {
  return __cxx_static_address_4cf2ec7a3ccc0188d4bd9b25.reference || (__cxx_static_address_4cf2ec7a3ccc0188d4bd9b25.reference = {
    __cReference: true,
    get value() { return HANGLIGHT____header_global_541a045e1a3caec5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:437
export const HYDRENT____header_global_43537ff1b712d0cc = ((((((981) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e207a3c9ffd4f4f87ee6d456() {
  return __cxx_static_address_e207a3c9ffd4f4f87ee6d456.reference || (__cxx_static_address_e207a3c9ffd4f4f87ee6d456.reference = {
    __cReference: true,
    get value() { return HYDRENT____header_global_43537ff1b712d0cc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:438
export const MASKWALL14____header_global_8ecf3578720a303b = ((((((988) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9f6e3428defa4d39a320d81e() {
  return __cxx_static_address_9f6e3428defa4d39a320d81e.reference || (__cxx_static_address_9f6e3428defa4d39a320d81e.reference = {
    __cReference: true,
    get value() { return MASKWALL14____header_global_8ecf3578720a303b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:439
export const TIRE____header_global_b5e204952ab7fa09 = ((((((990) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a09a1f9d4275e97935706569() {
  return __cxx_static_address_a09a1f9d4275e97935706569.reference || (__cxx_static_address_a09a1f9d4275e97935706569.reference = {
    __cReference: true,
    get value() { return TIRE____header_global_b5e204952ab7fa09; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:440
export const PIPE5____header_global_ebf1f8382d9508fa = ((((((994) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fefbf2348411afb96c74c85d() {
  return __cxx_static_address_fefbf2348411afb96c74c85d.reference || (__cxx_static_address_fefbf2348411afb96c74c85d.reference = {
    __cReference: true,
    get value() { return PIPE5____header_global_ebf1f8382d9508fa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:441
export const PIPE6____header_global_c9cbfeb7f817581e = ((((((995) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_84f38b86e10ad2c24157a2f5() {
  return __cxx_static_address_84f38b86e10ad2c24157a2f5.reference || (__cxx_static_address_84f38b86e10ad2c24157a2f5.reference = {
    __cReference: true,
    get value() { return PIPE6____header_global_c9cbfeb7f817581e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:442
export const PIPE4____header_global_6e4fb20a726ea61a = ((((((996) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0a1c7cc8a1b268d8821d87fc() {
  return __cxx_static_address_0a1c7cc8a1b268d8821d87fc.reference || (__cxx_static_address_0a1c7cc8a1b268d8821d87fc.reference = {
    __cReference: true,
    get value() { return PIPE4____header_global_6e4fb20a726ea61a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:443
export const PIPE4B____header_global_77269021412745a1 = ((((((997) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_16dd26b0a0a8d3eeb854bc86() {
  return __cxx_static_address_16dd26b0a0a8d3eeb854bc86.reference || (__cxx_static_address_16dd26b0a0a8d3eeb854bc86.reference = {
    __cReference: true,
    get value() { return PIPE4B____header_global_77269021412745a1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:444
export const BROKEHYDROPLANT____header_global_1ea2873c8df3af5f = ((((((1003) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a5242045249c56523e326476() {
  return __cxx_static_address_a5242045249c56523e326476.reference || (__cxx_static_address_a5242045249c56523e326476.reference = {
    __cReference: true,
    get value() { return BROKEHYDROPLANT____header_global_1ea2873c8df3af5f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:445
export const PIPE5B____header_global_c6afc5db0a2d2709 = ((((((1005) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_51241fd1baef350fc770844b() {
  return __cxx_static_address_51241fd1baef350fc770844b.reference || (__cxx_static_address_51241fd1baef350fc770844b.reference = {
    __cReference: true,
    get value() { return PIPE5B____header_global_c6afc5db0a2d2709; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:446
export const NEON3____header_global_10fddec5fb65ba2f = ((((((1007) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8f7002bcce6302386ed01bd7() {
  return __cxx_static_address_8f7002bcce6302386ed01bd7.reference || (__cxx_static_address_8f7002bcce6302386ed01bd7.reference = {
    __cReference: true,
    get value() { return NEON3____header_global_10fddec5fb65ba2f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:447
export const NEON4____header_global_9259a5d935dc2faa = ((((((1008) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5387a2f3d2dcadaa538ece9c() {
  return __cxx_static_address_5387a2f3d2dcadaa538ece9c.reference || (__cxx_static_address_5387a2f3d2dcadaa538ece9c.reference = {
    __cReference: true,
    get value() { return NEON4____header_global_9259a5d935dc2faa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:448
export const NEON5____header_global_e795e112c5f84642 = ((((((1009) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_41149869b0f41abfa052e50f() {
  return __cxx_static_address_41149869b0f41abfa052e50f.reference || (__cxx_static_address_41149869b0f41abfa052e50f.reference = {
    __cReference: true,
    get value() { return NEON5____header_global_e795e112c5f84642; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:449
export const BOTTLE5____header_global_70d30bb587e2a374 = ((((((1012) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5461bad258963c4506a58a0e() {
  return __cxx_static_address_5461bad258963c4506a58a0e.reference || (__cxx_static_address_5461bad258963c4506a58a0e.reference = {
    __cReference: true,
    get value() { return BOTTLE5____header_global_70d30bb587e2a374; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:450
export const BOTTLE6____header_global_04e0bb06397278d2 = ((((((1013) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_145fcc97947b816a615f6bce() {
  return __cxx_static_address_145fcc97947b816a615f6bce.reference || (__cxx_static_address_145fcc97947b816a615f6bce.reference = {
    __cReference: true,
    get value() { return BOTTLE6____header_global_04e0bb06397278d2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:451
export const BOTTLE8____header_global_ebef7d0e13772295 = ((((((1014) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e4c257e12eaed45e1437bb30() {
  return __cxx_static_address_e4c257e12eaed45e1437bb30.reference || (__cxx_static_address_e4c257e12eaed45e1437bb30.reference = {
    __cReference: true,
    get value() { return BOTTLE8____header_global_ebef7d0e13772295; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:452
export const SPOTLITE____header_global_7d0eb7dbf29b3f17 = ((((((1020) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c72966d5b28d67a04905b33d() {
  return __cxx_static_address_c72966d5b28d67a04905b33d.reference || (__cxx_static_address_c72966d5b28d67a04905b33d.reference = {
    __cReference: true,
    get value() { return SPOTLITE____header_global_7d0eb7dbf29b3f17; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:453
export const MASKWALL15____header_global_6038886b9b304b54 = ((((((1024) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_96f84c46a8ef587dd0dd2543() {
  return __cxx_static_address_96f84c46a8ef587dd0dd2543.reference || (__cxx_static_address_96f84c46a8ef587dd0dd2543.reference = {
    __cReference: true,
    get value() { return MASKWALL15____header_global_6038886b9b304b54; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:454
export const BOTTLE7____header_global_59830972f4e3d9bf = ((((((1025) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_68d28df4382d7cfcf1c7a680() {
  return __cxx_static_address_68d28df4382d7cfcf1c7a680.reference || (__cxx_static_address_68d28df4382d7cfcf1c7a680.reference = {
    __cReference: true,
    get value() { return BOTTLE7____header_global_59830972f4e3d9bf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:455
export const HORSEONSIDE____header_global_e713beb2353123db = ((((((1026) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_41413fec675638e8e79ae3fe() {
  return __cxx_static_address_41413fec675638e8e79ae3fe.reference || (__cxx_static_address_41413fec675638e8e79ae3fe.reference = {
    __cReference: true,
    get value() { return HORSEONSIDE____header_global_e713beb2353123db; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:456
export const GLASSPIECES____header_global_c39a3e4350e31108 = ((((((1031) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5dffff253040d13ebda0a822() {
  return __cxx_static_address_5dffff253040d13ebda0a822.reference || (__cxx_static_address_5dffff253040d13ebda0a822.reference = {
    __cReference: true,
    get value() { return GLASSPIECES____header_global_c39a3e4350e31108; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:457
export const NEON6____header_global_c389456ffbed8d4b = ((((((1046) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c8128c00e83f42742e70d9da() {
  return __cxx_static_address_c8128c00e83f42742e70d9da.reference || (__cxx_static_address_c8128c00e83f42742e70d9da.reference = {
    __cReference: true,
    get value() { return NEON6____header_global_c389456ffbed8d4b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:458
export const MASKWALL6____header_global_2f3e8603ae184974 = ((((((1059) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ed53958092ba6f05874c66f5() {
  return __cxx_static_address_ed53958092ba6f05874c66f5.reference || (__cxx_static_address_ed53958092ba6f05874c66f5.reference = {
    __cReference: true,
    get value() { return MASKWALL6____header_global_2f3e8603ae184974; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:459
export const RUBBERCAN____header_global_19c8276732d68cd4 = ((((((1062) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_47f38440d145c0ffab3bfbf2() {
  return __cxx_static_address_47f38440d145c0ffab3bfbf2.reference || (__cxx_static_address_47f38440d145c0ffab3bfbf2.reference = {
    __cReference: true,
    get value() { return RUBBERCAN____header_global_19c8276732d68cd4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:460
export const PLUG____header_global_030504054ed4ba72 = ((((((1069) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f20ff5877c7456a81f27da25() {
  return __cxx_static_address_f20ff5877c7456a81f27da25.reference || (__cxx_static_address_f20ff5877c7456a81f27da25.reference = {
    __cReference: true,
    get value() { return PLUG____header_global_030504054ed4ba72; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:461
export const OOZFILTER____header_global_95a4efd565e2c0a1 = ((((((1079) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c1c36f0950ce33fff0b85fee() {
  return __cxx_static_address_c1c36f0950ce33fff0b85fee.reference || (__cxx_static_address_c1c36f0950ce33fff0b85fee.reference = {
    __cReference: true,
    get value() { return OOZFILTER____header_global_95a4efd565e2c0a1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:462
export const FLOORPLASMA____header_global_d860c13407620c58 = ((((((1082) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7dbaf9caa3618efcc1367909() {
  return __cxx_static_address_7dbaf9caa3618efcc1367909.reference || (__cxx_static_address_7dbaf9caa3618efcc1367909.reference = {
    __cReference: true,
    get value() { return FLOORPLASMA____header_global_d860c13407620c58; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:463
export const REACTOR____header_global_345ec2b0f8b0084a = ((((((1088) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6282bf63fe3647bc55bf0ec4() {
  return __cxx_static_address_6282bf63fe3647bc55bf0ec4.reference || (__cxx_static_address_6282bf63fe3647bc55bf0ec4.reference = {
    __cReference: true,
    get value() { return REACTOR____header_global_345ec2b0f8b0084a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:464
export const REACTORSPARK____header_global_dae80c8ae3c646d0 = ((((((1092) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6cfc730865a87657b8624bf6() {
  return __cxx_static_address_6cfc730865a87657b8624bf6.reference || (__cxx_static_address_6cfc730865a87657b8624bf6.reference = {
    __cReference: true,
    get value() { return REACTORSPARK____header_global_dae80c8ae3c646d0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:465
export const REACTORBURNT____header_global_b96222fad2e58883 = ((((((1096) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4ec24447f81234a3f371257f() {
  return __cxx_static_address_4ec24447f81234a3f371257f.reference || (__cxx_static_address_4ec24447f81234a3f371257f.reference = {
    __cReference: true,
    get value() { return REACTORBURNT____header_global_b96222fad2e58883; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:466
export const DOORTILE15____header_global_4ef343d298dfdc64 = ((((((1102) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_471ced7369b4218916c62eda() {
  return __cxx_static_address_471ced7369b4218916c62eda.reference || (__cxx_static_address_471ced7369b4218916c62eda.reference = {
    __cReference: true,
    get value() { return DOORTILE15____header_global_4ef343d298dfdc64; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:467
export const HANDSWITCH____header_global_dd65ded41f870af2 = ((((((1111) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1ae4832ac6e0967c3d86faae() {
  return __cxx_static_address_1ae4832ac6e0967c3d86faae.reference || (__cxx_static_address_1ae4832ac6e0967c3d86faae.reference = {
    __cReference: true,
    get value() { return HANDSWITCH____header_global_dd65ded41f870af2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:468
export const CIRCLEPANNEL____header_global_cd3d9d59fbb2be0f = ((((((1113) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_da3872fcfb1eb97923ca578f() {
  return __cxx_static_address_da3872fcfb1eb97923ca578f.reference || (__cxx_static_address_da3872fcfb1eb97923ca578f.reference = {
    __cReference: true,
    get value() { return CIRCLEPANNEL____header_global_cd3d9d59fbb2be0f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:469
export const CIRCLEPANNELBROKE____header_global_a031f37bcb427dca = ((((((1114) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3a1737483d269aaa8709de79() {
  return __cxx_static_address_3a1737483d269aaa8709de79.reference || (__cxx_static_address_3a1737483d269aaa8709de79.reference = {
    __cReference: true,
    get value() { return CIRCLEPANNELBROKE____header_global_a031f37bcb427dca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:470
export const PULLSWITCH____header_global_097effb107e4ebdd = ((((((1122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3a7e69dea7928478cbe1c8ea() {
  return __cxx_static_address_3a7e69dea7928478cbe1c8ea.reference || (__cxx_static_address_3a7e69dea7928478cbe1c8ea.reference = {
    __cReference: true,
    get value() { return PULLSWITCH____header_global_097effb107e4ebdd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:471
export const MASKWALL8____header_global_0c1841ba06e9388c = ((((((1124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5505ac61ca859cf7f913345d() {
  return __cxx_static_address_5505ac61ca859cf7f913345d.reference || (__cxx_static_address_5505ac61ca859cf7f913345d.reference = {
    __cReference: true,
    get value() { return MASKWALL8____header_global_0c1841ba06e9388c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:472
export const BIGHOLE____header_global_628c6edcf4d50c5f = ((((((1141) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_88acf94436697e838d59abee() {
  return __cxx_static_address_88acf94436697e838d59abee.reference || (__cxx_static_address_88acf94436697e838d59abee.reference = {
    __cReference: true,
    get value() { return BIGHOLE____header_global_628c6edcf4d50c5f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:473
export const ALIENSWITCH____header_global_e3df1f6c4db1788c = ((((((1142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f639b68e4967ca27517d0230() {
  return __cxx_static_address_f639b68e4967ca27517d0230.reference || (__cxx_static_address_f639b68e4967ca27517d0230.reference = {
    __cReference: true,
    get value() { return ALIENSWITCH____header_global_e3df1f6c4db1788c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:474
export const DOORTILE21____header_global_062aaddd0e1557b5 = ((((((1144) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ff75b86b545bd63fb6945fb0() {
  return __cxx_static_address_ff75b86b545bd63fb6945fb0.reference || (__cxx_static_address_ff75b86b545bd63fb6945fb0.reference = {
    __cReference: true,
    get value() { return DOORTILE21____header_global_062aaddd0e1557b5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:475
export const HANDPRINTSWITCH____header_global_0c85716e0780bfed = ((((((1155) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_164a1315894ce4ebd735d8fa() {
  return __cxx_static_address_164a1315894ce4ebd735d8fa.reference || (__cxx_static_address_164a1315894ce4ebd735d8fa.reference = {
    __cReference: true,
    get value() { return HANDPRINTSWITCH____header_global_0c85716e0780bfed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:476
export const BOTTLE10____header_global_5b1250306aa0a624 = ((((((1157) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c59adf5e0f2d3ca128031e5b() {
  return __cxx_static_address_c59adf5e0f2d3ca128031e5b.reference || (__cxx_static_address_c59adf5e0f2d3ca128031e5b.reference = {
    __cReference: true,
    get value() { return BOTTLE10____header_global_5b1250306aa0a624; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:477
export const BOTTLE11____header_global_e208975a72818263 = ((((((1158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_192130d79f2e89ff032ddd76() {
  return __cxx_static_address_192130d79f2e89ff032ddd76.reference || (__cxx_static_address_192130d79f2e89ff032ddd76.reference = {
    __cReference: true,
    get value() { return BOTTLE11____header_global_e208975a72818263; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:478
export const BOTTLE12____header_global_28b597a3123f7399 = ((((((1159) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c04de88ef242d0eaa1043900() {
  return __cxx_static_address_c04de88ef242d0eaa1043900.reference || (__cxx_static_address_c04de88ef242d0eaa1043900.reference = {
    __cReference: true,
    get value() { return BOTTLE12____header_global_28b597a3123f7399; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:479
export const BOTTLE13____header_global_dabc78de1d91180f = ((((((1160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a35763408d0476529964a228() {
  return __cxx_static_address_a35763408d0476529964a228.reference || (__cxx_static_address_a35763408d0476529964a228.reference = {
    __cReference: true,
    get value() { return BOTTLE13____header_global_dabc78de1d91180f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:480
export const BOTTLE14____header_global_37e266560fdb6378 = ((((((1161) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_501c25db6181f5c5e434003c() {
  return __cxx_static_address_501c25db6181f5c5e434003c.reference || (__cxx_static_address_501c25db6181f5c5e434003c.reference = {
    __cReference: true,
    get value() { return BOTTLE14____header_global_37e266560fdb6378; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:481
export const BOTTLE15____header_global_48b20b675afe1cec = ((((((1162) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d0ea8edb500ac68ccd8dfb5a() {
  return __cxx_static_address_d0ea8edb500ac68ccd8dfb5a.reference || (__cxx_static_address_d0ea8edb500ac68ccd8dfb5a.reference = {
    __cReference: true,
    get value() { return BOTTLE15____header_global_48b20b675afe1cec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:482
export const BOTTLE16____header_global_c4ea46dd25598127 = ((((((1163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f800465de6af484be71c42ba() {
  return __cxx_static_address_f800465de6af484be71c42ba.reference || (__cxx_static_address_f800465de6af484be71c42ba.reference = {
    __cReference: true,
    get value() { return BOTTLE16____header_global_c4ea46dd25598127; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:483
export const BOTTLE17____header_global_2280c99601b08014 = ((((((1164) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e0c8ec126a618a923c54a976() {
  return __cxx_static_address_e0c8ec126a618a923c54a976.reference || (__cxx_static_address_e0c8ec126a618a923c54a976.reference = {
    __cReference: true,
    get value() { return BOTTLE17____header_global_2280c99601b08014; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:484
export const BOTTLE18____header_global_7be2e895c1c75feb = ((((((1165) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2ad90502829725afcc612cfb() {
  return __cxx_static_address_2ad90502829725afcc612cfb.reference || (__cxx_static_address_2ad90502829725afcc612cfb.reference = {
    __cReference: true,
    get value() { return BOTTLE18____header_global_7be2e895c1c75feb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:485
export const BOTTLE19____header_global_8f15e7fd1b9f121e = ((((((1166) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7d0d65bf61d9f1e7bc861e65() {
  return __cxx_static_address_7d0d65bf61d9f1e7bc861e65.reference || (__cxx_static_address_7d0d65bf61d9f1e7bc861e65.reference = {
    __cReference: true,
    get value() { return BOTTLE19____header_global_8f15e7fd1b9f121e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:486
export const DOORTILE17____header_global_61342c73c0d32147 = ((((((1169) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5b445f2d066006c747ab92ac() {
  return __cxx_static_address_5b445f2d066006c747ab92ac.reference || (__cxx_static_address_5b445f2d066006c747ab92ac.reference = {
    __cReference: true,
    get value() { return DOORTILE17____header_global_61342c73c0d32147; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:487
export const MASKWALL7____header_global_2325f03e92566419 = ((((((1174) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_18c3a86c2796a5fe70b1d7a7() {
  return __cxx_static_address_18c3a86c2796a5fe70b1d7a7.reference || (__cxx_static_address_18c3a86c2796a5fe70b1d7a7.reference = {
    __cReference: true,
    get value() { return MASKWALL7____header_global_2325f03e92566419; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:488
export const DOORTILE11____header_global_0d17aa2fc597b75f = ((((((1178) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_95e1a9f628648b4876ec1e73() {
  return __cxx_static_address_95e1a9f628648b4876ec1e73.reference || (__cxx_static_address_95e1a9f628648b4876ec1e73.reference = {
    __cReference: true,
    get value() { return DOORTILE11____header_global_0d17aa2fc597b75f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:489
export const DOORTILE12____header_global_5a5e4a51181a31ea = ((((((1179) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_18ffdd387a3562270f228b0b() {
  return __cxx_static_address_18ffdd387a3562270f228b0b.reference || (__cxx_static_address_18ffdd387a3562270f228b0b.reference = {
    __cReference: true,
    get value() { return DOORTILE12____header_global_5a5e4a51181a31ea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:490
export const VENDMACHINE____header_global_ccc7174f529be1c6 = ((((((1212) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_58cbba95a79fc3adec941992() {
  return __cxx_static_address_58cbba95a79fc3adec941992.reference || (__cxx_static_address_58cbba95a79fc3adec941992.reference = {
    __cReference: true,
    get value() { return VENDMACHINE____header_global_ccc7174f529be1c6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:491
export const COLAMACHINE____header_global_38827cbf6e26b3dd = ((((((1215) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d630e4f56fb980a02baf9bd3() {
  return __cxx_static_address_d630e4f56fb980a02baf9bd3.reference || (__cxx_static_address_d630e4f56fb980a02baf9bd3.reference = {
    __cReference: true,
    get value() { return COLAMACHINE____header_global_38827cbf6e26b3dd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:492
export const CRANEPOLE____header_global_5312372de1e46566 = ((((((1221) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5f56ca60886c45a4eb9728fa() {
  return __cxx_static_address_5f56ca60886c45a4eb9728fa.reference || (__cxx_static_address_5f56ca60886c45a4eb9728fa.reference = {
    __cReference: true,
    get value() { return CRANEPOLE____header_global_5312372de1e46566; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:493
export const CRANE____header_global_3cafbefa4874996e = ((((((1222) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_25656cdde8219c0de6b61719() {
  return __cxx_static_address_25656cdde8219c0de6b61719.reference || (__cxx_static_address_25656cdde8219c0de6b61719.reference = {
    __cReference: true,
    get value() { return CRANE____header_global_3cafbefa4874996e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:494
export const BARBROKE____header_global_ec3507ba567765ce = ((((((1225) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dbbc62a015bdcd54b152e2db() {
  return __cxx_static_address_dbbc62a015bdcd54b152e2db.reference || (__cxx_static_address_dbbc62a015bdcd54b152e2db.reference = {
    __cReference: true,
    get value() { return BARBROKE____header_global_ec3507ba567765ce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:495
export const BLOODPOOL____header_global_8de0a7d255227d93 = ((((((1226) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d67859c3e43b45444e06a0b5() {
  return __cxx_static_address_d67859c3e43b45444e06a0b5.reference || (__cxx_static_address_d67859c3e43b45444e06a0b5.reference = {
    __cReference: true,
    get value() { return BLOODPOOL____header_global_8de0a7d255227d93; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:496
export const NUKEBARREL____header_global_43bc71f62097ca41 = ((((((1227) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d7b819112e363a3a08bfda57() {
  return __cxx_static_address_d7b819112e363a3a08bfda57.reference || (__cxx_static_address_d7b819112e363a3a08bfda57.reference = {
    __cReference: true,
    get value() { return NUKEBARREL____header_global_43bc71f62097ca41; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:497
export const NUKEBARRELDENTED____header_global_38f6776113e60129 = ((((((1228) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_35632dfc4bad072028a68bb5() {
  return __cxx_static_address_35632dfc4bad072028a68bb5.reference || (__cxx_static_address_35632dfc4bad072028a68bb5.reference = {
    __cReference: true,
    get value() { return NUKEBARRELDENTED____header_global_38f6776113e60129; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:498
export const NUKEBARRELLEAKED____header_global_2f9fda9f7a4ca17e = ((((((1229) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_835297ad3ff2e55ce2d10685() {
  return __cxx_static_address_835297ad3ff2e55ce2d10685.reference || (__cxx_static_address_835297ad3ff2e55ce2d10685.reference = {
    __cReference: true,
    get value() { return NUKEBARRELLEAKED____header_global_2f9fda9f7a4ca17e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:499
export const CANWITHSOMETHING____header_global_9be2dbb1af37c972 = ((((((1232) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5998bada57dd581ebf20822a() {
  return __cxx_static_address_5998bada57dd581ebf20822a.reference || (__cxx_static_address_5998bada57dd581ebf20822a.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING____header_global_9be2dbb1af37c972; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:500
export const MONEY____header_global_19b97007b3953c58 = ((((((1233) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1fadf78d60e29c56c692577b() {
  return __cxx_static_address_1fadf78d60e29c56c692577b.reference || (__cxx_static_address_1fadf78d60e29c56c692577b.reference = {
    __cReference: true,
    get value() { return MONEY____header_global_19b97007b3953c58; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:501
export const BANNER____header_global_aa797836db33f534 = ((((((1236) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_154b23bc24603d8c19d8fd09() {
  return __cxx_static_address_154b23bc24603d8c19d8fd09.reference || (__cxx_static_address_154b23bc24603d8c19d8fd09.reference = {
    __cReference: true,
    get value() { return BANNER____header_global_aa797836db33f534; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:502
export const EXPLODINGBARREL____header_global_fff44195c67b860d = ((((((1238) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2a241ebdf109b9de509b6a18() {
  return __cxx_static_address_2a241ebdf109b9de509b6a18.reference || (__cxx_static_address_2a241ebdf109b9de509b6a18.reference = {
    __cReference: true,
    get value() { return EXPLODINGBARREL____header_global_fff44195c67b860d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:503
export const EXPLODINGBARREL2____header_global_188421dd770bfbf2 = ((((((1239) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ca4fbaaee833a31c4eb957dd() {
  return __cxx_static_address_ca4fbaaee833a31c4eb957dd.reference || (__cxx_static_address_ca4fbaaee833a31c4eb957dd.reference = {
    __cReference: true,
    get value() { return EXPLODINGBARREL2____header_global_188421dd770bfbf2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:504
export const FIREBARREL____header_global_7b10ebdefe7db053 = ((((((1240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6f18e7df0764eeebbfb8653e() {
  return __cxx_static_address_6f18e7df0764eeebbfb8653e.reference || (__cxx_static_address_6f18e7df0764eeebbfb8653e.reference = {
    __cReference: true,
    get value() { return FIREBARREL____header_global_7b10ebdefe7db053; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:505
export const SEENINE____header_global_b722379afb0639f6 = ((((((1247) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1823a104b183dce3fd61aa48() {
  return __cxx_static_address_1823a104b183dce3fd61aa48.reference || (__cxx_static_address_1823a104b183dce3fd61aa48.reference = {
    __cReference: true,
    get value() { return SEENINE____header_global_b722379afb0639f6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:506
export const SEENINEDEAD____header_global_065e0d8497522de8 = ((((((1248) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_80346d9d368dd3aa22353de6() {
  return __cxx_static_address_80346d9d368dd3aa22353de6.reference || (__cxx_static_address_80346d9d368dd3aa22353de6.reference = {
    __cReference: true,
    get value() { return SEENINEDEAD____header_global_065e0d8497522de8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:507
export const STEAM____header_global_7d49e1a60b1d88e1 = ((((((1250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e229b11e590b3b71d5716289() {
  return __cxx_static_address_e229b11e590b3b71d5716289.reference || (__cxx_static_address_e229b11e590b3b71d5716289.reference = {
    __cReference: true,
    get value() { return STEAM____header_global_7d49e1a60b1d88e1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:508
export const CEILINGSTEAM____header_global_f834add297978e73 = ((((((1255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_be745c922c8d0ab0f5b7d7f8() {
  return __cxx_static_address_be745c922c8d0ab0f5b7d7f8.reference || (__cxx_static_address_be745c922c8d0ab0f5b7d7f8.reference = {
    __cReference: true,
    get value() { return CEILINGSTEAM____header_global_f834add297978e73; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:509
export const PIPE6B____header_global_5be879ca510f3714 = ((((((1260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_69ee0d5347d7c1d234e1a061() {
  return __cxx_static_address_69ee0d5347d7c1d234e1a061.reference || (__cxx_static_address_69ee0d5347d7c1d234e1a061.reference = {
    __cReference: true,
    get value() { return PIPE6B____header_global_5be879ca510f3714; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:510
export const TRANSPORTERBEAM____header_global_1c0242f6567eb6b1 = ((((((1261) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_450a5ed1dc81183477e6c635() {
  return __cxx_static_address_450a5ed1dc81183477e6c635.reference || (__cxx_static_address_450a5ed1dc81183477e6c635.reference = {
    __cReference: true,
    get value() { return TRANSPORTERBEAM____header_global_1c0242f6567eb6b1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:511
export const RAT____header_global_8fd4e747a8a7386a = ((((((1267) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_16cb7e2cbc23e6f1c12fb95c() {
  return __cxx_static_address_16cb7e2cbc23e6f1c12fb95c.reference || (__cxx_static_address_16cb7e2cbc23e6f1c12fb95c.reference = {
    __cReference: true,
    get value() { return RAT____header_global_8fd4e747a8a7386a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:512
export const TRASH____header_global_d5dfbfd4412e88ed = ((((((1272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9e026d00d0b4b1ecd68ef523() {
  return __cxx_static_address_9e026d00d0b4b1ecd68ef523.reference || (__cxx_static_address_9e026d00d0b4b1ecd68ef523.reference = {
    __cReference: true,
    get value() { return TRASH____header_global_d5dfbfd4412e88ed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:513
export const FEMPIC1____header_global_823548ace1153db6 = ((((((1280) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f61d94c7872f37fc934308f6() {
  return __cxx_static_address_f61d94c7872f37fc934308f6.reference || (__cxx_static_address_f61d94c7872f37fc934308f6.reference = {
    __cReference: true,
    get value() { return FEMPIC1____header_global_823548ace1153db6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:514
export const FEMPIC2____header_global_ba4ba77e88a5e08d = ((((((1289) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c50de6df1041bc99d5f8e6c8() {
  return __cxx_static_address_c50de6df1041bc99d5f8e6c8.reference || (__cxx_static_address_c50de6df1041bc99d5f8e6c8.reference = {
    __cReference: true,
    get value() { return FEMPIC2____header_global_ba4ba77e88a5e08d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:515
export const BLANKSCREEN____header_global_9b2c062b5cf161dc = ((((((1293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_401f4869812d4eefe5f53749() {
  return __cxx_static_address_401f4869812d4eefe5f53749.reference || (__cxx_static_address_401f4869812d4eefe5f53749.reference = {
    __cReference: true,
    get value() { return BLANKSCREEN____header_global_9b2c062b5cf161dc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:516
export const PODFEM1____header_global_51373fe4fa592056 = ((((((1294) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e2ff051e1d96e088147d6209() {
  return __cxx_static_address_e2ff051e1d96e088147d6209.reference || (__cxx_static_address_e2ff051e1d96e088147d6209.reference = {
    __cReference: true,
    get value() { return PODFEM1____header_global_51373fe4fa592056; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:517
export const FEMPIC3____header_global_f073135a04572efc = ((((((1298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d47ff57dba836ad8bd9eea03() {
  return __cxx_static_address_d47ff57dba836ad8bd9eea03.reference || (__cxx_static_address_d47ff57dba836ad8bd9eea03.reference = {
    __cReference: true,
    get value() { return FEMPIC3____header_global_f073135a04572efc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:518
export const FEMPIC4____header_global_6d10b4e4ee600c2f = ((((((1306) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8d14fba9499cfb093afa99b6() {
  return __cxx_static_address_8d14fba9499cfb093afa99b6.reference || (__cxx_static_address_8d14fba9499cfb093afa99b6.reference = {
    __cReference: true,
    get value() { return FEMPIC4____header_global_6d10b4e4ee600c2f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:519
export const FEM1____header_global_c2b4e4bde5aadd2c = ((((((1312) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0877719576419d4d61e50b4d() {
  return __cxx_static_address_0877719576419d4d61e50b4d.reference || (__cxx_static_address_0877719576419d4d61e50b4d.reference = {
    __cReference: true,
    get value() { return FEM1____header_global_c2b4e4bde5aadd2c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:520
export const FEM2____header_global_2f824e43e6273685 = ((((((1317) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7b80ea9f38d4b468791bd59f() {
  return __cxx_static_address_7b80ea9f38d4b468791bd59f.reference || (__cxx_static_address_7b80ea9f38d4b468791bd59f.reference = {
    __cReference: true,
    get value() { return FEM2____header_global_2f824e43e6273685; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:521
export const FEM3____header_global_cf1db3a08a371c5e = ((((((1321) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_abf14fd1ccfb27c2313ca0ea() {
  return __cxx_static_address_abf14fd1ccfb27c2313ca0ea.reference || (__cxx_static_address_abf14fd1ccfb27c2313ca0ea.reference = {
    __cReference: true,
    get value() { return FEM3____header_global_cf1db3a08a371c5e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:522
export const FEM5____header_global_59866aadb3a5dc4b = ((((((1323) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fa859d01fe3c5f91ee7fadf6() {
  return __cxx_static_address_fa859d01fe3c5f91ee7fadf6.reference || (__cxx_static_address_fa859d01fe3c5f91ee7fadf6.reference = {
    __cReference: true,
    get value() { return FEM5____header_global_59866aadb3a5dc4b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:523
export const BLOODYPOLE____header_global_74db5b6be73073c9 = ((((((1324) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7f77ec1cd2ee5418119f8761() {
  return __cxx_static_address_7f77ec1cd2ee5418119f8761.reference || (__cxx_static_address_7f77ec1cd2ee5418119f8761.reference = {
    __cReference: true,
    get value() { return BLOODYPOLE____header_global_74db5b6be73073c9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:524
export const FEM4____header_global_b25c48ebb9873eed = ((((((1325) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_16aa9b663d64395d6446d071() {
  return __cxx_static_address_16aa9b663d64395d6446d071.reference || (__cxx_static_address_16aa9b663d64395d6446d071.reference = {
    __cReference: true,
    get value() { return FEM4____header_global_b25c48ebb9873eed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:525
export const FEM6____header_global_d76d7bbf854408c3 = ((((((1334) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3026b66f6b43b6d61350dd3b() {
  return __cxx_static_address_3026b66f6b43b6d61350dd3b.reference || (__cxx_static_address_3026b66f6b43b6d61350dd3b.reference = {
    __cReference: true,
    get value() { return FEM6____header_global_d76d7bbf854408c3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:526
export const FEM6PAD____header_global_5bac01eb47ff5278 = ((((((1335) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a4452f8e7f7b1ade4b4a5973() {
  return __cxx_static_address_a4452f8e7f7b1ade4b4a5973.reference || (__cxx_static_address_a4452f8e7f7b1ade4b4a5973.reference = {
    __cReference: true,
    get value() { return FEM6PAD____header_global_5bac01eb47ff5278; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:527
export const FEM8____header_global_56c1d79fa83cd904 = ((((((1336) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a8c3b2284d9ee8b35601e0af() {
  return __cxx_static_address_a8c3b2284d9ee8b35601e0af.reference || (__cxx_static_address_a8c3b2284d9ee8b35601e0af.reference = {
    __cReference: true,
    get value() { return FEM8____header_global_56c1d79fa83cd904; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:528
export const HELECOPT____header_global_f202914696395f4e = ((((((1346) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2c5f89cd0bb221f5b6548ea6() {
  return __cxx_static_address_2c5f89cd0bb221f5b6548ea6.reference || (__cxx_static_address_2c5f89cd0bb221f5b6548ea6.reference = {
    __cReference: true,
    get value() { return HELECOPT____header_global_f202914696395f4e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:529
export const FETUSJIB____header_global_4ff78ca41360c2bc = ((((((1347) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1f45001a563390b494cb1688() {
  return __cxx_static_address_1f45001a563390b494cb1688.reference || (__cxx_static_address_1f45001a563390b494cb1688.reference = {
    __cReference: true,
    get value() { return FETUSJIB____header_global_4ff78ca41360c2bc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:530
export const HOLODUKE____header_global_5e590a2e61ecc43a = ((((((1348) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c1e4f51de0c1a3a545b84fe7() {
  return __cxx_static_address_c1e4f51de0c1a3a545b84fe7.reference || (__cxx_static_address_c1e4f51de0c1a3a545b84fe7.reference = {
    __cReference: true,
    get value() { return HOLODUKE____header_global_5e590a2e61ecc43a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:531
export const SPACEMARINE____header_global_0c9404892b6958d1 = ((((((1353) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_752547f530cd42a2438ada26() {
  return __cxx_static_address_752547f530cd42a2438ada26.reference || (__cxx_static_address_752547f530cd42a2438ada26.reference = {
    __cReference: true,
    get value() { return SPACEMARINE____header_global_0c9404892b6958d1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:532
export const INDY____header_global_e554aa8bc31bd360 = ((((((1355) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5d7ea818b651f16c874d6609() {
  return __cxx_static_address_5d7ea818b651f16c874d6609.reference || (__cxx_static_address_5d7ea818b651f16c874d6609.reference = {
    __cReference: true,
    get value() { return INDY____header_global_e554aa8bc31bd360; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:533
export const FETUS____header_global_a4cae88949b14908 = ((((((1358) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9dd352f70731340416043b18() {
  return __cxx_static_address_9dd352f70731340416043b18.reference || (__cxx_static_address_9dd352f70731340416043b18.reference = {
    __cReference: true,
    get value() { return FETUS____header_global_a4cae88949b14908; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:534
export const FETUSBROKE____header_global_49ecd03543931391 = ((((((1359) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_908523d651fc758bfdac9dbb() {
  return __cxx_static_address_908523d651fc758bfdac9dbb.reference || (__cxx_static_address_908523d651fc758bfdac9dbb.reference = {
    __cReference: true,
    get value() { return FETUSBROKE____header_global_49ecd03543931391; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:535
export const MONK____header_global_4eb4600d6ecab23d = ((((((1352) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_26c6f402e55ce3d44d9b4fac() {
  return __cxx_static_address_26c6f402e55ce3d44d9b4fac.reference || (__cxx_static_address_26c6f402e55ce3d44d9b4fac.reference = {
    __cReference: true,
    get value() { return MONK____header_global_4eb4600d6ecab23d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:536
export const LUKE____header_global_b341930fc1177c7d = ((((((1354) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_68435f939f43ccd3d5a9e770() {
  return __cxx_static_address_68435f939f43ccd3d5a9e770.reference || (__cxx_static_address_68435f939f43ccd3d5a9e770.reference = {
    __cReference: true,
    get value() { return LUKE____header_global_b341930fc1177c7d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:537
export const COOLEXPLOSION1____header_global_32f2c91b87480537 = ((((((1360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c9728fa0321bc18824ecd7e8() {
  return __cxx_static_address_c9728fa0321bc18824ecd7e8.reference || (__cxx_static_address_c9728fa0321bc18824ecd7e8.reference = {
    __cReference: true,
    get value() { return COOLEXPLOSION1____header_global_32f2c91b87480537; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:538
export const WATERSPLASH2____header_global_188e8ddb9df65ceb = ((((((1380) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_019b5a54e60f22ced3ead480() {
  return __cxx_static_address_019b5a54e60f22ced3ead480.reference || (__cxx_static_address_019b5a54e60f22ced3ead480.reference = {
    __cReference: true,
    get value() { return WATERSPLASH2____header_global_188e8ddb9df65ceb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:539
export const FIREVASE____header_global_2995c367d083e60d = ((((((1390) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_55237393a36018245cacc22c() {
  return __cxx_static_address_55237393a36018245cacc22c.reference || (__cxx_static_address_55237393a36018245cacc22c.reference = {
    __cReference: true,
    get value() { return FIREVASE____header_global_2995c367d083e60d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:540
export const FEM7____header_global_13854a5d41a0f9ed = ((((((1395) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5cd2760f3e1b090bac1a9b50() {
  return __cxx_static_address_5cd2760f3e1b090bac1a9b50.reference || (__cxx_static_address_5cd2760f3e1b090bac1a9b50.reference = {
    __cReference: true,
    get value() { return FEM7____header_global_13854a5d41a0f9ed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:541
export const APLAYERTOP____header_global_e4126517029c2131 = ((((((1400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bf507717eb08f825017f9e07() {
  return __cxx_static_address_bf507717eb08f825017f9e07.reference || (__cxx_static_address_bf507717eb08f825017f9e07.reference = {
    __cReference: true,
    get value() { return APLAYERTOP____header_global_e4126517029c2131; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:542
export const APLAYER____header_global_0f57f455f4e0853a = ((((((1405) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ad3dab126e7f76f2c7782d5b() {
  return __cxx_static_address_ad3dab126e7f76f2c7782d5b.reference || (__cxx_static_address_ad3dab126e7f76f2c7782d5b.reference = {
    __cReference: true,
    get value() { return APLAYER____header_global_0f57f455f4e0853a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:543
export const PLAYERONWATER____header_global_0ebc03f1f0bd92aa = ((((((1420) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b582dec45e4fdddbb87fd5c7() {
  return __cxx_static_address_b582dec45e4fdddbb87fd5c7.reference || (__cxx_static_address_b582dec45e4fdddbb87fd5c7.reference = {
    __cReference: true,
    get value() { return PLAYERONWATER____header_global_0ebc03f1f0bd92aa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:544
export const DUKELYINGDEAD____header_global_f2e23a961ef73aed = ((((((1518) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3e23a246002d579bbb23d44c() {
  return __cxx_static_address_3e23a246002d579bbb23d44c.reference || (__cxx_static_address_3e23a246002d579bbb23d44c.reference = {
    __cReference: true,
    get value() { return DUKELYINGDEAD____header_global_f2e23a961ef73aed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:545
export const DUKETORSO____header_global_eb8055036e5418c2 = ((((((1520) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1f86cc3e9160dcf444c92b86() {
  return __cxx_static_address_1f86cc3e9160dcf444c92b86.reference || (__cxx_static_address_1f86cc3e9160dcf444c92b86.reference = {
    __cReference: true,
    get value() { return DUKETORSO____header_global_eb8055036e5418c2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:546
export const DUKEGUN____header_global_a7ef6fc4b3b1a9eb = ((((((1528) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7ee782adf2b9c19f5a90cfdd() {
  return __cxx_static_address_7ee782adf2b9c19f5a90cfdd.reference || (__cxx_static_address_7ee782adf2b9c19f5a90cfdd.reference = {
    __cReference: true,
    get value() { return DUKEGUN____header_global_a7ef6fc4b3b1a9eb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:547
export const DUKELEG____header_global_a88f99376e02bb98 = ((((((1536) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e7af291dd842407d5f0693ec() {
  return __cxx_static_address_e7af291dd842407d5f0693ec.reference || (__cxx_static_address_e7af291dd842407d5f0693ec.reference = {
    __cReference: true,
    get value() { return DUKELEG____header_global_a88f99376e02bb98; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:548
export const SHARK____header_global_6e07560a9d7db1cb = ((((((1550) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_238126308d2096c04b4057a2() {
  return __cxx_static_address_238126308d2096c04b4057a2.reference || (__cxx_static_address_238126308d2096c04b4057a2.reference = {
    __cReference: true,
    get value() { return SHARK____header_global_6e07560a9d7db1cb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:549
export const BLOOD____header_global_93dcb3479334a3ea = ((((((1620) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2b27eac303ad461aa9490c55() {
  return __cxx_static_address_2b27eac303ad461aa9490c55.reference || (__cxx_static_address_2b27eac303ad461aa9490c55.reference = {
    __cReference: true,
    get value() { return BLOOD____header_global_93dcb3479334a3ea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:550
export const FIRELASER____header_global_aea20312b4e6cc34 = ((((((1625) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_08580b721ade218aa79478c3() {
  return __cxx_static_address_08580b721ade218aa79478c3.reference || (__cxx_static_address_08580b721ade218aa79478c3.reference = {
    __cReference: true,
    get value() { return FIRELASER____header_global_aea20312b4e6cc34; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:551
export const TRANSPORTERSTAR____header_global_6aba99c6c84a75b5 = ((((((1630) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4de54af0247ebd539ffa6816() {
  return __cxx_static_address_4de54af0247ebd539ffa6816.reference || (__cxx_static_address_4de54af0247ebd539ffa6816.reference = {
    __cReference: true,
    get value() { return TRANSPORTERSTAR____header_global_6aba99c6c84a75b5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:552
export const SPIT____header_global_91d203f1a48ff86f = ((((((1636) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bd63b8f59242a2e509b65db4() {
  return __cxx_static_address_bd63b8f59242a2e509b65db4.reference || (__cxx_static_address_bd63b8f59242a2e509b65db4.reference = {
    __cReference: true,
    get value() { return SPIT____header_global_91d203f1a48ff86f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:553
export const LOOGIE____header_global_a815326140b9cb1d = ((((((1637) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d7d8b71e1d3aa48864e52150() {
  return __cxx_static_address_d7d8b71e1d3aa48864e52150.reference || (__cxx_static_address_d7d8b71e1d3aa48864e52150.reference = {
    __cReference: true,
    get value() { return LOOGIE____header_global_a815326140b9cb1d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:554
export const FIST____header_global_3fb01a8321aed5fe = ((((((1640) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c0c35cfe2368a2b0be67d4df() {
  return __cxx_static_address_c0c35cfe2368a2b0be67d4df.reference || (__cxx_static_address_c0c35cfe2368a2b0be67d4df.reference = {
    __cReference: true,
    get value() { return FIST____header_global_3fb01a8321aed5fe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:555
export const FREEZEBLAST____header_global_a951aeb232265885 = ((((((1641) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5d5c3d021861c394dd73da0a() {
  return __cxx_static_address_5d5c3d021861c394dd73da0a.reference || (__cxx_static_address_5d5c3d021861c394dd73da0a.reference = {
    __cReference: true,
    get value() { return FREEZEBLAST____header_global_a951aeb232265885; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:556
export const SHRINKSPARK____header_global_183c3633443958fb = ((((((1646) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1eb1dd0b2b1a709bb149163a() {
  return __cxx_static_address_1eb1dd0b2b1a709bb149163a.reference || (__cxx_static_address_1eb1dd0b2b1a709bb149163a.reference = {
    __cReference: true,
    get value() { return SHRINKSPARK____header_global_183c3633443958fb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:557
export const TONGUE____header_global_0ead1ffaeb7c83e8 = ((((((1647) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d905c6675d3c7cd1b6beed03() {
  return __cxx_static_address_d905c6675d3c7cd1b6beed03.reference || (__cxx_static_address_d905c6675d3c7cd1b6beed03.reference = {
    __cReference: true,
    get value() { return TONGUE____header_global_0ead1ffaeb7c83e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:558
export const MORTER____header_global_764dfa0e28f2aad9 = ((((((1650) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4ba808ae2de14263f1f4e705() {
  return __cxx_static_address_4ba808ae2de14263f1f4e705.reference || (__cxx_static_address_4ba808ae2de14263f1f4e705.reference = {
    __cReference: true,
    get value() { return MORTER____header_global_764dfa0e28f2aad9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:559
export const SHRINKEREXPLOSION____header_global_f23a0916bfc3c9f6 = ((((((1656) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1d4366068b49a2903490eb33() {
  return __cxx_static_address_1d4366068b49a2903490eb33.reference || (__cxx_static_address_1d4366068b49a2903490eb33.reference = {
    __cReference: true,
    get value() { return SHRINKEREXPLOSION____header_global_f23a0916bfc3c9f6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:560
export const RADIUSEXPLOSION____header_global_793902ac1ec248b0 = ((((((1670) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_29840c77f10fb9237e28ef96() {
  return __cxx_static_address_29840c77f10fb9237e28ef96.reference || (__cxx_static_address_29840c77f10fb9237e28ef96.reference = {
    __cReference: true,
    get value() { return RADIUSEXPLOSION____header_global_793902ac1ec248b0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:561
export const FORCERIPPLE____header_global_5b89c17cc8728345 = ((((((1671) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b9011d97c1721c5634fe3aae() {
  return __cxx_static_address_b9011d97c1721c5634fe3aae.reference || (__cxx_static_address_b9011d97c1721c5634fe3aae.reference = {
    __cReference: true,
    get value() { return FORCERIPPLE____header_global_5b89c17cc8728345; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:562
export const LIZTROOP____header_global_feb42d53f92455fd = ((((((1680) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b3b950404590e7983bc420b1() {
  return __cxx_static_address_b3b950404590e7983bc420b1.reference || (__cxx_static_address_b3b950404590e7983bc420b1.reference = {
    __cReference: true,
    get value() { return LIZTROOP____header_global_feb42d53f92455fd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:563
export const LIZTROOPRUNNING____header_global_939e7abb9f3c1088 = ((((((1681) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0a73caca71c6ca27f3133b73() {
  return __cxx_static_address_0a73caca71c6ca27f3133b73.reference || (__cxx_static_address_0a73caca71c6ca27f3133b73.reference = {
    __cReference: true,
    get value() { return LIZTROOPRUNNING____header_global_939e7abb9f3c1088; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:564
export const LIZTROOPSTAYPUT____header_global_c70b69c0069c7404 = ((((((1682) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5591a19df21a2e6f99c5208f() {
  return __cxx_static_address_5591a19df21a2e6f99c5208f.reference || (__cxx_static_address_5591a19df21a2e6f99c5208f.reference = {
    __cReference: true,
    get value() { return LIZTROOPSTAYPUT____header_global_c70b69c0069c7404; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:565
export const LIZTROOPSHOOT____header_global_4ed2aa6a169c5b55 = ((((((1715) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1992efa02666d7c0b5bd7e1c() {
  return __cxx_static_address_1992efa02666d7c0b5bd7e1c.reference || (__cxx_static_address_1992efa02666d7c0b5bd7e1c.reference = {
    __cReference: true,
    get value() { return LIZTROOPSHOOT____header_global_4ed2aa6a169c5b55; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:566
export const LIZTROOPJETPACK____header_global_a530f5f232a8e7a3 = ((((((1725) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bbf8a771421ae7528550166e() {
  return __cxx_static_address_bbf8a771421ae7528550166e.reference || (__cxx_static_address_bbf8a771421ae7528550166e.reference = {
    __cReference: true,
    get value() { return LIZTROOPJETPACK____header_global_a530f5f232a8e7a3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:567
export const LIZTROOPONTOILET____header_global_3928a271de9e1ea0 = ((((((1741) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_afd3b225d1f2825c48fa128a() {
  return __cxx_static_address_afd3b225d1f2825c48fa128a.reference || (__cxx_static_address_afd3b225d1f2825c48fa128a.reference = {
    __cReference: true,
    get value() { return LIZTROOPONTOILET____header_global_3928a271de9e1ea0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:568
export const LIZTROOPJUSTSIT____header_global_c01e130ee565ad8b = ((((((1742) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_87fbcfc774dd3bbabacfb5fe() {
  return __cxx_static_address_87fbcfc774dd3bbabacfb5fe.reference || (__cxx_static_address_87fbcfc774dd3bbabacfb5fe.reference = {
    __cReference: true,
    get value() { return LIZTROOPJUSTSIT____header_global_c01e130ee565ad8b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:569
export const LIZTROOPDUCKING____header_global_2f63c0b51cb2dc9b = ((((((1744) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ebb5c2dba7e771969cf67ada() {
  return __cxx_static_address_ebb5c2dba7e771969cf67ada.reference || (__cxx_static_address_ebb5c2dba7e771969cf67ada.reference = {
    __cReference: true,
    get value() { return LIZTROOPDUCKING____header_global_2f63c0b51cb2dc9b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:570
export const HEADJIB1____header_global_4e1d13102ece0c34 = ((((((1768) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2c0062c6e87dafe4662f9c0e() {
  return __cxx_static_address_2c0062c6e87dafe4662f9c0e.reference || (__cxx_static_address_2c0062c6e87dafe4662f9c0e.reference = {
    __cReference: true,
    get value() { return HEADJIB1____header_global_4e1d13102ece0c34; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:571
export const ARMJIB1____header_global_83ea504a8fcebf4f = ((((((1772) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_858b34d6718c4ff59bb5786e() {
  return __cxx_static_address_858b34d6718c4ff59bb5786e.reference || (__cxx_static_address_858b34d6718c4ff59bb5786e.reference = {
    __cReference: true,
    get value() { return ARMJIB1____header_global_83ea504a8fcebf4f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:572
export const LEGJIB1____header_global_afdbc738b664b486 = ((((((1776) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_11db705b9a9d36623f17f7c9() {
  return __cxx_static_address_11db705b9a9d36623f17f7c9.reference || (__cxx_static_address_11db705b9a9d36623f17f7c9.reference = {
    __cReference: true,
    get value() { return LEGJIB1____header_global_afdbc738b664b486; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:573
export const OCTABRAIN____header_global_70e8cb9621de1e76 = ((((((1820) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b96264f76a56460705a5b6c7() {
  return __cxx_static_address_b96264f76a56460705a5b6c7.reference || (__cxx_static_address_b96264f76a56460705a5b6c7.reference = {
    __cReference: true,
    get value() { return OCTABRAIN____header_global_70e8cb9621de1e76; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:574
export const OCTABRAINSTAYPUT____header_global_cc9fda0a189b73f1 = ((((((1821) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2899217c10fc6b9d6292561e() {
  return __cxx_static_address_2899217c10fc6b9d6292561e.reference || (__cxx_static_address_2899217c10fc6b9d6292561e.reference = {
    __cReference: true,
    get value() { return OCTABRAINSTAYPUT____header_global_cc9fda0a189b73f1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:575
export const INNERJAW____header_global_7905671f3e5fa1d1 = ((((((1860) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_10ea55d347a66396b83b678d() {
  return __cxx_static_address_10ea55d347a66396b83b678d.reference || (__cxx_static_address_10ea55d347a66396b83b678d.reference = {
    __cReference: true,
    get value() { return INNERJAW____header_global_7905671f3e5fa1d1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:576
export const DRONE____header_global_09271f53297d7b58 = ((((((1880) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b554e8c5e9ba9152de105a2d() {
  return __cxx_static_address_b554e8c5e9ba9152de105a2d.reference || (__cxx_static_address_b554e8c5e9ba9152de105a2d.reference = {
    __cReference: true,
    get value() { return DRONE____header_global_09271f53297d7b58; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:577
export const EXPLOSION2____header_global_80c0b2bb79e326a8 = ((((((1890) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d61eb0c2d2ddca3a3a0b24c8() {
  return __cxx_static_address_d61eb0c2d2ddca3a3a0b24c8.reference || (__cxx_static_address_d61eb0c2d2ddca3a3a0b24c8.reference = {
    __cReference: true,
    get value() { return EXPLOSION2____header_global_80c0b2bb79e326a8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:578
export const COMMANDER____header_global_5b8568bc1ce56bc8 = ((((((1920) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ed61750339869e15e79061ff() {
  return __cxx_static_address_ed61750339869e15e79061ff.reference || (__cxx_static_address_ed61750339869e15e79061ff.reference = {
    __cReference: true,
    get value() { return COMMANDER____header_global_5b8568bc1ce56bc8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:579
export const COMMANDERSTAYPUT____header_global_2b0653f717224048 = ((((((1921) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_faf67c42e3aca0785565291f() {
  return __cxx_static_address_faf67c42e3aca0785565291f.reference || (__cxx_static_address_faf67c42e3aca0785565291f.reference = {
    __cReference: true,
    get value() { return COMMANDERSTAYPUT____header_global_2b0653f717224048; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:580
export const RECON____header_global_f83bf07fbd53cfad = ((((((1960) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_85f30ad0671ea0379f735124() {
  return __cxx_static_address_85f30ad0671ea0379f735124.reference || (__cxx_static_address_85f30ad0671ea0379f735124.reference = {
    __cReference: true,
    get value() { return RECON____header_global_f83bf07fbd53cfad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:581
export const TANK____header_global_ae2f31dcb4a12b13 = ((((((1975) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ef1186f667ef29a97be1fb78() {
  return __cxx_static_address_ef1186f667ef29a97be1fb78.reference || (__cxx_static_address_ef1186f667ef29a97be1fb78.reference = {
    __cReference: true,
    get value() { return TANK____header_global_ae2f31dcb4a12b13; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:582
export const PIGCOP____header_global_2d578b869868a189 = ((((((2000) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_60059faa98cfbf078c1f5233() {
  return __cxx_static_address_60059faa98cfbf078c1f5233.reference || (__cxx_static_address_60059faa98cfbf078c1f5233.reference = {
    __cReference: true,
    get value() { return PIGCOP____header_global_2d578b869868a189; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:583
export const PIGCOPSTAYPUT____header_global_df2607a304bef47e = ((((((2001) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5b42bc7c2ed0da5603ab43f6() {
  return __cxx_static_address_5b42bc7c2ed0da5603ab43f6.reference || (__cxx_static_address_5b42bc7c2ed0da5603ab43f6.reference = {
    __cReference: true,
    get value() { return PIGCOPSTAYPUT____header_global_df2607a304bef47e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:584
export const PIGCOPDIVE____header_global_2342eeb1fa1c0bcd = ((((((2045) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5abb12a59242ee826b01cb72() {
  return __cxx_static_address_5abb12a59242ee826b01cb72.reference || (__cxx_static_address_5abb12a59242ee826b01cb72.reference = {
    __cReference: true,
    get value() { return PIGCOPDIVE____header_global_2342eeb1fa1c0bcd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:585
export const LIZMAN____header_global_a841ac580feb5fc1 = ((((((2120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c1817894cc05e7ff0e962559() {
  return __cxx_static_address_c1817894cc05e7ff0e962559.reference || (__cxx_static_address_c1817894cc05e7ff0e962559.reference = {
    __cReference: true,
    get value() { return LIZMAN____header_global_a841ac580feb5fc1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:586
export const LIZMANSTAYPUT____header_global_ea2c1e1fe05b55d8 = ((((((2121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5e6a3638d7d55bbd590922c4() {
  return __cxx_static_address_5e6a3638d7d55bbd590922c4.reference || (__cxx_static_address_5e6a3638d7d55bbd590922c4.reference = {
    __cReference: true,
    get value() { return LIZMANSTAYPUT____header_global_ea2c1e1fe05b55d8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:587
export const LIZMANSPITTING____header_global_c4c4ceffb159b979 = ((((((2150) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1b59f3da1042e96013275250() {
  return __cxx_static_address_1b59f3da1042e96013275250.reference || (__cxx_static_address_1b59f3da1042e96013275250.reference = {
    __cReference: true,
    get value() { return LIZMANSPITTING____header_global_c4c4ceffb159b979; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:588
export const LIZMANFEEDING____header_global_5ec91011c534869d = ((((((2160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_05db9c66168d8dfa3158ea99() {
  return __cxx_static_address_05db9c66168d8dfa3158ea99.reference || (__cxx_static_address_05db9c66168d8dfa3158ea99.reference = {
    __cReference: true,
    get value() { return LIZMANFEEDING____header_global_5ec91011c534869d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:589
export const LIZMANJUMP____header_global_32cfd1ec7f2bdc8c = ((((((2165) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3865498a03baeb795b949c09() {
  return __cxx_static_address_3865498a03baeb795b949c09.reference || (__cxx_static_address_3865498a03baeb795b949c09.reference = {
    __cReference: true,
    get value() { return LIZMANJUMP____header_global_32cfd1ec7f2bdc8c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:590
export const FECES____header_global_aa1b976c3933770a = ((((((2200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d51c140f774ec7602ca36dd9() {
  return __cxx_static_address_d51c140f774ec7602ca36dd9.reference || (__cxx_static_address_d51c140f774ec7602ca36dd9.reference = {
    __cReference: true,
    get value() { return FECES____header_global_aa1b976c3933770a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:591
export const LIZMANHEAD1____header_global_6b181395ae92a91a = ((((((2201) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dcbddac9f8e8b41f0b73be99() {
  return __cxx_static_address_dcbddac9f8e8b41f0b73be99.reference || (__cxx_static_address_dcbddac9f8e8b41f0b73be99.reference = {
    __cReference: true,
    get value() { return LIZMANHEAD1____header_global_6b181395ae92a91a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:592
export const LIZMANARM1____header_global_cf3afd67e8a43e6c = ((((((2205) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_32518e2eb58907682baf91c1() {
  return __cxx_static_address_32518e2eb58907682baf91c1.reference || (__cxx_static_address_32518e2eb58907682baf91c1.reference = {
    __cReference: true,
    get value() { return LIZMANARM1____header_global_cf3afd67e8a43e6c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:593
export const LIZMANLEG1____header_global_1321a30459e7b5f5 = ((((((2209) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8b77baa6652f6133af01668c() {
  return __cxx_static_address_8b77baa6652f6133af01668c.reference || (__cxx_static_address_8b77baa6652f6133af01668c.reference = {
    __cReference: true,
    get value() { return LIZMANLEG1____header_global_1321a30459e7b5f5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:594
export const EXPLOSION2BOT____header_global_4b6a2302c2a84937 = ((((((2219) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_af84d4be8f8dc37a6c360d7a() {
  return __cxx_static_address_af84d4be8f8dc37a6c360d7a.reference || (__cxx_static_address_af84d4be8f8dc37a6c360d7a.reference = {
    __cReference: true,
    get value() { return EXPLOSION2BOT____header_global_4b6a2302c2a84937; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:595
export const JIBS1____header_global_0939220fef5f1a48 = ((((((2245) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8e7dc1ce820ca09734b4d14d() {
  return __cxx_static_address_8e7dc1ce820ca09734b4d14d.reference || (__cxx_static_address_8e7dc1ce820ca09734b4d14d.reference = {
    __cReference: true,
    get value() { return JIBS1____header_global_0939220fef5f1a48; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:596
export const JIBS2____header_global_8213eb4ca5bde520 = ((((((2250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7280a20033a8badeb84585e4() {
  return __cxx_static_address_7280a20033a8badeb84585e4.reference || (__cxx_static_address_7280a20033a8badeb84585e4.reference = {
    __cReference: true,
    get value() { return JIBS2____header_global_8213eb4ca5bde520; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:597
export const JIBS3____header_global_967be26912b3a3ff = ((((((2255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5163c9937ff5ded3083b6d71() {
  return __cxx_static_address_5163c9937ff5ded3083b6d71.reference || (__cxx_static_address_5163c9937ff5ded3083b6d71.reference = {
    __cReference: true,
    get value() { return JIBS3____header_global_967be26912b3a3ff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:598
export const JIBS4____header_global_71fd492f2f17c97f = ((((((2260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7ce329e29da92fca1b3a0d67() {
  return __cxx_static_address_7ce329e29da92fca1b3a0d67.reference || (__cxx_static_address_7ce329e29da92fca1b3a0d67.reference = {
    __cReference: true,
    get value() { return JIBS4____header_global_71fd492f2f17c97f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:599
export const JIBS5____header_global_86374c9d49544d92 = ((((((2265) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e43a658e929373c3ea10b5fa() {
  return __cxx_static_address_e43a658e929373c3ea10b5fa.reference || (__cxx_static_address_e43a658e929373c3ea10b5fa.reference = {
    __cReference: true,
    get value() { return JIBS5____header_global_86374c9d49544d92; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:600
export const BURNING____header_global_ad7a7050aaf800a1 = ((((((2270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_225d804013aa042c9fccdb62() {
  return __cxx_static_address_225d804013aa042c9fccdb62.reference || (__cxx_static_address_225d804013aa042c9fccdb62.reference = {
    __cReference: true,
    get value() { return BURNING____header_global_ad7a7050aaf800a1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:601
export const FIRE____header_global_77d1d85db065f215 = ((((((2271) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b60ff975ea930afab8b3b9ae() {
  return __cxx_static_address_b60ff975ea930afab8b3b9ae.reference || (__cxx_static_address_b60ff975ea930afab8b3b9ae.reference = {
    __cReference: true,
    get value() { return FIRE____header_global_77d1d85db065f215; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:602
export const JIBS6____header_global_d089db690003ad62 = ((((((2286) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fcfb617045fa3cd4eff21197() {
  return __cxx_static_address_fcfb617045fa3cd4eff21197.reference || (__cxx_static_address_fcfb617045fa3cd4eff21197.reference = {
    __cReference: true,
    get value() { return JIBS6____header_global_d089db690003ad62; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:603
export const BLOODSPLAT1____header_global_f86ff36b4d81edd4 = ((((((2296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_140904317e1508f3c7b3d2c1() {
  return __cxx_static_address_140904317e1508f3c7b3d2c1.reference || (__cxx_static_address_140904317e1508f3c7b3d2c1.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT1____header_global_f86ff36b4d81edd4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:604
export const BLOODSPLAT3____header_global_7528bcaaae5d1b8d = ((((((2297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_31e8a4ccd610d1381545dbf2() {
  return __cxx_static_address_31e8a4ccd610d1381545dbf2.reference || (__cxx_static_address_31e8a4ccd610d1381545dbf2.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT3____header_global_7528bcaaae5d1b8d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:605
export const BLOODSPLAT2____header_global_f56085525fdc9ab4 = ((((((2298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_66834f907f987ee6541e36bf() {
  return __cxx_static_address_66834f907f987ee6541e36bf.reference || (__cxx_static_address_66834f907f987ee6541e36bf.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT2____header_global_f56085525fdc9ab4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:606
export const BLOODSPLAT4____header_global_ab13c66ce8467b24 = ((((((2299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7e52abceee6c879d4de938b8() {
  return __cxx_static_address_7e52abceee6c879d4de938b8.reference || (__cxx_static_address_7e52abceee6c879d4de938b8.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT4____header_global_ab13c66ce8467b24; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:607
export const OOZ____header_global_102916cfd2ff244a = ((((((2300) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a79357c5088bdd7f0c0ad183() {
  return __cxx_static_address_a79357c5088bdd7f0c0ad183.reference || (__cxx_static_address_a79357c5088bdd7f0c0ad183.reference = {
    __cReference: true,
    get value() { return OOZ____header_global_102916cfd2ff244a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:608
export const OOZ2____header_global_5100ad59deec6b43 = ((((((2309) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b4e0d39bda3f0bd4baa1e3ba() {
  return __cxx_static_address_b4e0d39bda3f0bd4baa1e3ba.reference || (__cxx_static_address_b4e0d39bda3f0bd4baa1e3ba.reference = {
    __cReference: true,
    get value() { return OOZ2____header_global_5100ad59deec6b43; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:609
export const WALLBLOOD1____header_global_892d96508a191738 = ((((((2301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fb074a9a821ddc995cdfdc29() {
  return __cxx_static_address_fb074a9a821ddc995cdfdc29.reference || (__cxx_static_address_fb074a9a821ddc995cdfdc29.reference = {
    __cReference: true,
    get value() { return WALLBLOOD1____header_global_892d96508a191738; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:610
export const WALLBLOOD2____header_global_3594e69346fcb2cf = ((((((2302) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ce3b272adc97039a9e0b94dd() {
  return __cxx_static_address_ce3b272adc97039a9e0b94dd.reference || (__cxx_static_address_ce3b272adc97039a9e0b94dd.reference = {
    __cReference: true,
    get value() { return WALLBLOOD2____header_global_3594e69346fcb2cf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:611
export const WALLBLOOD3____header_global_384723bdf6ff0f7b = ((((((2303) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a6871d28b3440f42709faa12() {
  return __cxx_static_address_a6871d28b3440f42709faa12.reference || (__cxx_static_address_a6871d28b3440f42709faa12.reference = {
    __cReference: true,
    get value() { return WALLBLOOD3____header_global_384723bdf6ff0f7b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:612
export const WALLBLOOD4____header_global_e72b808b38378f59 = ((((((2304) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e1836d5fe87b711ebd011266() {
  return __cxx_static_address_e1836d5fe87b711ebd011266.reference || (__cxx_static_address_e1836d5fe87b711ebd011266.reference = {
    __cReference: true,
    get value() { return WALLBLOOD4____header_global_e72b808b38378f59; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:613
export const WALLBLOOD5____header_global_6ce1c96b1101277c = ((((((2305) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9802e504c785ccadd3f7e1ff() {
  return __cxx_static_address_9802e504c785ccadd3f7e1ff.reference || (__cxx_static_address_9802e504c785ccadd3f7e1ff.reference = {
    __cReference: true,
    get value() { return WALLBLOOD5____header_global_6ce1c96b1101277c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:614
export const WALLBLOOD7____header_global_0dcf8244d48df5d2 = ((((((2307) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8aade98ef0929d1867db2092() {
  return __cxx_static_address_8aade98ef0929d1867db2092.reference || (__cxx_static_address_8aade98ef0929d1867db2092.reference = {
    __cReference: true,
    get value() { return WALLBLOOD7____header_global_0dcf8244d48df5d2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:615
export const WALLBLOOD8____header_global_9b4c3ef850bbe55a = ((((((2308) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_44db0296dbd7a3ee9b8ccbb8() {
  return __cxx_static_address_44db0296dbd7a3ee9b8ccbb8.reference || (__cxx_static_address_44db0296dbd7a3ee9b8ccbb8.reference = {
    __cReference: true,
    get value() { return WALLBLOOD8____header_global_9b4c3ef850bbe55a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:616
export const BURNING2____header_global_589c7f88fe317af5 = ((((((2310) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bc39dfd077c91ef1a42332d1() {
  return __cxx_static_address_bc39dfd077c91ef1a42332d1.reference || (__cxx_static_address_bc39dfd077c91ef1a42332d1.reference = {
    __cReference: true,
    get value() { return BURNING2____header_global_589c7f88fe317af5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:617
export const FIRE2____header_global_4461e3442b8f0e8a = ((((((2311) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3dc7efe5340dad1ff6722e80() {
  return __cxx_static_address_3dc7efe5340dad1ff6722e80.reference || (__cxx_static_address_3dc7efe5340dad1ff6722e80.reference = {
    __cReference: true,
    get value() { return FIRE2____header_global_4461e3442b8f0e8a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:618
export const CRACKKNUCKLES____header_global_f8719b1d7cb08a8c = ((((((2324) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4250361e6c5383f1f5184c51() {
  return __cxx_static_address_4250361e6c5383f1f5184c51.reference || (__cxx_static_address_4250361e6c5383f1f5184c51.reference = {
    __cReference: true,
    get value() { return CRACKKNUCKLES____header_global_f8719b1d7cb08a8c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:619
export const SMALLSMOKE____header_global_71bc4641cd154f49 = ((((((2329) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_105bb3dc3c6dc7250e8f8ae0() {
  return __cxx_static_address_105bb3dc3c6dc7250e8f8ae0.reference || (__cxx_static_address_105bb3dc3c6dc7250e8f8ae0.reference = {
    __cReference: true,
    get value() { return SMALLSMOKE____header_global_71bc4641cd154f49; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:620
export const FLOORFLAME____header_global_ba01a299dd1e037b = ((((((2333) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2e25f880f5eaffc117632383() {
  return __cxx_static_address_2e25f880f5eaffc117632383.reference || (__cxx_static_address_2e25f880f5eaffc117632383.reference = {
    __cReference: true,
    get value() { return FLOORFLAME____header_global_ba01a299dd1e037b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:621
export const ROTATEGUN____header_global_0f319d6a26bee2cb = ((((((2360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aa50c77155f5e0d8635456b1() {
  return __cxx_static_address_aa50c77155f5e0d8635456b1.reference || (__cxx_static_address_aa50c77155f5e0d8635456b1.reference = {
    __cReference: true,
    get value() { return ROTATEGUN____header_global_0f319d6a26bee2cb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:622
export const GREENSLIME____header_global_7bf191aa3ad6ef05 = ((((((2370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_69c9cbfce67c536a5a514552() {
  return __cxx_static_address_69c9cbfce67c536a5a514552.reference || (__cxx_static_address_69c9cbfce67c536a5a514552.reference = {
    __cReference: true,
    get value() { return GREENSLIME____header_global_7bf191aa3ad6ef05; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:623
export const WATERDRIPSPLASH____header_global_2081d5056d96332d = ((((((2380) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_da73a36cd46ba35921b84bc7() {
  return __cxx_static_address_da73a36cd46ba35921b84bc7.reference || (__cxx_static_address_da73a36cd46ba35921b84bc7.reference = {
    __cReference: true,
    get value() { return WATERDRIPSPLASH____header_global_2081d5056d96332d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:624
export const SCRAP6____header_global_33ff438653242a9b = ((((((2390) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_854d1737ea735100d096ae10() {
  return __cxx_static_address_854d1737ea735100d096ae10.reference || (__cxx_static_address_854d1737ea735100d096ae10.reference = {
    __cReference: true,
    get value() { return SCRAP6____header_global_33ff438653242a9b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:625
export const SCRAP1____header_global_f51c8bc9195602af = ((((((2400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ac5991c3ca11acde07c673e8() {
  return __cxx_static_address_ac5991c3ca11acde07c673e8.reference || (__cxx_static_address_ac5991c3ca11acde07c673e8.reference = {
    __cReference: true,
    get value() { return SCRAP1____header_global_f51c8bc9195602af; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:626
export const SCRAP2____header_global_bda2a28f7a09b5ac = ((((((2404) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_50c7318d48fb5cab94129e4e() {
  return __cxx_static_address_50c7318d48fb5cab94129e4e.reference || (__cxx_static_address_50c7318d48fb5cab94129e4e.reference = {
    __cReference: true,
    get value() { return SCRAP2____header_global_bda2a28f7a09b5ac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:627
export const SCRAP3____header_global_0b072ee0126c0f56 = ((((((2408) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1420414e64017c2e7537239c() {
  return __cxx_static_address_1420414e64017c2e7537239c.reference || (__cxx_static_address_1420414e64017c2e7537239c.reference = {
    __cReference: true,
    get value() { return SCRAP3____header_global_0b072ee0126c0f56; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:628
export const SCRAP4____header_global_af28f424240c184c = ((((((2412) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f9fab7e0a76c4cfc392a2df3() {
  return __cxx_static_address_f9fab7e0a76c4cfc392a2df3.reference || (__cxx_static_address_f9fab7e0a76c4cfc392a2df3.reference = {
    __cReference: true,
    get value() { return SCRAP4____header_global_af28f424240c184c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:629
export const SCRAP5____header_global_72221c556b8f0ba8 = ((((((2416) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_72a40289364280e083c84070() {
  return __cxx_static_address_72a40289364280e083c84070.reference || (__cxx_static_address_72a40289364280e083c84070.reference = {
    __cReference: true,
    get value() { return SCRAP5____header_global_72221c556b8f0ba8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:630
export const ORGANTIC____header_global_4bfa1ba7ff1cc662 = ((((((2420) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_04cc63e274e367f79d6fd4cb() {
  return __cxx_static_address_04cc63e274e367f79d6fd4cb.reference || (__cxx_static_address_04cc63e274e367f79d6fd4cb.reference = {
    __cReference: true,
    get value() { return ORGANTIC____header_global_4bfa1ba7ff1cc662; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:631
export const BETAVERSION____header_global_3661278a223eb1ed = ((((((2440) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bc0e648aeaebda8d131851c4() {
  return __cxx_static_address_bc0e648aeaebda8d131851c4.reference || (__cxx_static_address_bc0e648aeaebda8d131851c4.reference = {
    __cReference: true,
    get value() { return BETAVERSION____header_global_3661278a223eb1ed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:632
export const SELECTDIR____header_global_5d37234c955004c9 = ((((((2444) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2db9095bcec9f830b52a70cd() {
  return __cxx_static_address_2db9095bcec9f830b52a70cd.reference || (__cxx_static_address_2db9095bcec9f830b52a70cd.reference = {
    __cReference: true,
    get value() { return SELECTDIR____header_global_5d37234c955004c9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:633
export const F1HELP____header_global_36fabf568a0622cd = ((((((2445) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b0e3dc7502801cad94c6dfc0() {
  return __cxx_static_address_b0e3dc7502801cad94c6dfc0.reference || (__cxx_static_address_b0e3dc7502801cad94c6dfc0.reference = {
    __cReference: true,
    get value() { return F1HELP____header_global_36fabf568a0622cd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:634
export const GROWSPARK____header_global_8d6cc5c7c18d6897 = ((((((2448) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_409ba3dc26549965c69ba847() {
  return __cxx_static_address_409ba3dc26549965c69ba847.reference || (__cxx_static_address_409ba3dc26549965c69ba847.reference = {
    __cReference: true,
    get value() { return GROWSPARK____header_global_8d6cc5c7c18d6897; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:635
export const MENUSCREEN____header_global_17d6d2f951e78f29 = ((((((2456) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3f4607b17c46026d9bfe86a0() {
  return __cxx_static_address_3f4607b17c46026d9bfe86a0.reference || (__cxx_static_address_3f4607b17c46026d9bfe86a0.reference = {
    __cReference: true,
    get value() { return MENUSCREEN____header_global_17d6d2f951e78f29; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:636
export const MENUBAR____header_global_06916a6ba2004cf2 = ((((((2457) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bb651d7bfc77b5b23513145c() {
  return __cxx_static_address_bb651d7bfc77b5b23513145c.reference || (__cxx_static_address_bb651d7bfc77b5b23513145c.reference = {
    __cReference: true,
    get value() { return MENUBAR____header_global_06916a6ba2004cf2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:637
export const KILLSICON____header_global_c8b4a1d846ccbd9b = ((((((2458) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_44683751a127fe5521410747() {
  return __cxx_static_address_44683751a127fe5521410747.reference || (__cxx_static_address_44683751a127fe5521410747.reference = {
    __cReference: true,
    get value() { return KILLSICON____header_global_c8b4a1d846ccbd9b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:638
export const FIRSTAID_ICON____header_global_c168866d2e168167 = ((((((2460) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bdb8018421073fb5a17e4ccd() {
  return __cxx_static_address_bdb8018421073fb5a17e4ccd.reference || (__cxx_static_address_bdb8018421073fb5a17e4ccd.reference = {
    __cReference: true,
    get value() { return FIRSTAID_ICON____header_global_c168866d2e168167; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:639
export const HEAT_ICON____header_global_8fc79134cad3eeb0 = ((((((2461) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0e77a1e25ea8aafa4a457ec8() {
  return __cxx_static_address_0e77a1e25ea8aafa4a457ec8.reference || (__cxx_static_address_0e77a1e25ea8aafa4a457ec8.reference = {
    __cReference: true,
    get value() { return HEAT_ICON____header_global_8fc79134cad3eeb0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:640
export const BOTTOMSTATUSBAR____header_global_d1f1579072c83bd9 = ((((((2462) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0adb4c9054256b0b6c8d46a9() {
  return __cxx_static_address_0adb4c9054256b0b6c8d46a9.reference || (__cxx_static_address_0adb4c9054256b0b6c8d46a9.reference = {
    __cReference: true,
    get value() { return BOTTOMSTATUSBAR____header_global_d1f1579072c83bd9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:641
export const BOOT_ICON____header_global_9c9cf1a85ab9efae = ((((((2463) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_46d57e89b9807fb1dd4d0873() {
  return __cxx_static_address_46d57e89b9807fb1dd4d0873.reference || (__cxx_static_address_46d57e89b9807fb1dd4d0873.reference = {
    __cReference: true,
    get value() { return BOOT_ICON____header_global_9c9cf1a85ab9efae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:642
export const FRAGBAR____header_global_8ea16a0bc909669c = ((((((2465) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a73d5ac19c82b5659825e3ee() {
  return __cxx_static_address_a73d5ac19c82b5659825e3ee.reference || (__cxx_static_address_a73d5ac19c82b5659825e3ee.reference = {
    __cReference: true,
    get value() { return FRAGBAR____header_global_8ea16a0bc909669c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:643
export const JETPACK_ICON____header_global_b78d3f396d2210e4 = ((((((2467) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a9c56856f60bae7e9f4ef207() {
  return __cxx_static_address_a9c56856f60bae7e9f4ef207.reference || (__cxx_static_address_a9c56856f60bae7e9f4ef207.reference = {
    __cReference: true,
    get value() { return JETPACK_ICON____header_global_b78d3f396d2210e4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:644
export const AIRTANK_ICON____header_global_1505d40c94c8b27b = ((((((2468) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7b39c503c78cafce36128e39() {
  return __cxx_static_address_7b39c503c78cafce36128e39.reference || (__cxx_static_address_7b39c503c78cafce36128e39.reference = {
    __cReference: true,
    get value() { return AIRTANK_ICON____header_global_1505d40c94c8b27b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:645
export const STEROIDS_ICON____header_global_53b6601aef043b89 = ((((((2469) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4d971e699ec4397bf2dae5d9() {
  return __cxx_static_address_4d971e699ec4397bf2dae5d9.reference || (__cxx_static_address_4d971e699ec4397bf2dae5d9.reference = {
    __cReference: true,
    get value() { return STEROIDS_ICON____header_global_53b6601aef043b89; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:646
export const HOLODUKE_ICON____header_global_813103df09845b36 = ((((((2470) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6297493a519012d675b08861() {
  return __cxx_static_address_6297493a519012d675b08861.reference || (__cxx_static_address_6297493a519012d675b08861.reference = {
    __cReference: true,
    get value() { return HOLODUKE_ICON____header_global_813103df09845b36; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:647
export const ACCESS_ICON____header_global_26c2409d1f807a17 = ((((((2471) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1bd76909aef30f40d67fea35() {
  return __cxx_static_address_1bd76909aef30f40d67fea35.reference || (__cxx_static_address_1bd76909aef30f40d67fea35.reference = {
    __cReference: true,
    get value() { return ACCESS_ICON____header_global_26c2409d1f807a17; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:648
export const DIGITALNUM____header_global_2c6ae4f7041f12f8 = ((((((2472) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c277156c681049bcb585d17f() {
  return __cxx_static_address_c277156c681049bcb585d17f.reference || (__cxx_static_address_c277156c681049bcb585d17f.reference = {
    __cReference: true,
    get value() { return DIGITALNUM____header_global_2c6ae4f7041f12f8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:649
export const DUKECAR____header_global_9c355e15055bdf81 = ((((((2491) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6665fa597014b91596234514() {
  return __cxx_static_address_6665fa597014b91596234514.reference || (__cxx_static_address_6665fa597014b91596234514.reference = {
    __cReference: true,
    get value() { return DUKECAR____header_global_9c355e15055bdf81; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:650
export const CAMCORNER____header_global_582c1ec43fd10a11 = ((((((2482) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3b060510875bfa079f0d4f57() {
  return __cxx_static_address_3b060510875bfa079f0d4f57.reference || (__cxx_static_address_3b060510875bfa079f0d4f57.reference = {
    __cReference: true,
    get value() { return CAMCORNER____header_global_582c1ec43fd10a11; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:651
export const CAMLIGHT____header_global_5b7ee5bc7044cf6a = ((((((2484) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9dfcad7f7b598554bfda114b() {
  return __cxx_static_address_9dfcad7f7b598554bfda114b.reference || (__cxx_static_address_9dfcad7f7b598554bfda114b.reference = {
    __cReference: true,
    get value() { return CAMLIGHT____header_global_5b7ee5bc7044cf6a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:652
export const SLIDEBAR____header_global_88f2343e5ca54475 = ((((((2489) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e7c5939d6d3eeaf70d0185df() {
  return __cxx_static_address_e7c5939d6d3eeaf70d0185df.reference || (__cxx_static_address_e7c5939d6d3eeaf70d0185df.reference = {
    __cReference: true,
    get value() { return SLIDEBAR____header_global_88f2343e5ca54475; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:653
export const DREALMS____header_global_03d648833872683b = ((((((2492) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5940adb48df1e38b221c5aab() {
  return __cxx_static_address_5940adb48df1e38b221c5aab.reference || (__cxx_static_address_5940adb48df1e38b221c5aab.reference = {
    __cReference: true,
    get value() { return DREALMS____header_global_03d648833872683b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:654
export const BETASCREEN____header_global_655db6f66e1cf1f1 = ((((((2493) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5f1063e8e46275ef2621ed5f() {
  return __cxx_static_address_5f1063e8e46275ef2621ed5f.reference || (__cxx_static_address_5f1063e8e46275ef2621ed5f.reference = {
    __cReference: true,
    get value() { return BETASCREEN____header_global_655db6f66e1cf1f1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:655
export const WINDOWBORDER1____header_global_19bcd81c80ccdbbb = ((((((2494) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0e60e881f69c94e910feeb03() {
  return __cxx_static_address_0e60e881f69c94e910feeb03.reference || (__cxx_static_address_0e60e881f69c94e910feeb03.reference = {
    __cReference: true,
    get value() { return WINDOWBORDER1____header_global_19bcd81c80ccdbbb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:656
export const TEXTBOX____header_global_b5f7c8dce2ddc45f = ((((((2495) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4224031f7e6043b30c6cbd98() {
  return __cxx_static_address_4224031f7e6043b30c6cbd98.reference || (__cxx_static_address_4224031f7e6043b30c6cbd98.reference = {
    __cReference: true,
    get value() { return TEXTBOX____header_global_b5f7c8dce2ddc45f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:657
export const WINDOWBORDER2____header_global_864321830b463717 = ((((((2496) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_30bf88abfd6c193edbd3e6c6() {
  return __cxx_static_address_30bf88abfd6c193edbd3e6c6.reference || (__cxx_static_address_30bf88abfd6c193edbd3e6c6.reference = {
    __cReference: true,
    get value() { return WINDOWBORDER2____header_global_864321830b463717; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:658
export const DUKENUKEM____header_global_9f6af07d543c572f = ((((((2497) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4e9b2f237d176bfb4ec04ff6() {
  return __cxx_static_address_4e9b2f237d176bfb4ec04ff6.reference || (__cxx_static_address_4e9b2f237d176bfb4ec04ff6.reference = {
    __cReference: true,
    get value() { return DUKENUKEM____header_global_9f6af07d543c572f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:659
export const THREEDEE____header_global_0c6f084d05057d96 = ((((((2498) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8ae723abb35c4007849e5694() {
  return __cxx_static_address_8ae723abb35c4007849e5694.reference || (__cxx_static_address_8ae723abb35c4007849e5694.reference = {
    __cReference: true,
    get value() { return THREEDEE____header_global_0c6f084d05057d96; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:660
export const INGAMEDUKETHREEDEE____header_global_94271c38a916d8bd = ((((((2499) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_44c973dfe3b3fb1cd8aca469() {
  return __cxx_static_address_44c973dfe3b3fb1cd8aca469.reference || (__cxx_static_address_44c973dfe3b3fb1cd8aca469.reference = {
    __cReference: true,
    get value() { return INGAMEDUKETHREEDEE____header_global_94271c38a916d8bd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:661
export const TENSCREEN____header_global_d0a6f55b697ee417 = ((((((2500) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9ba4f5ee730bc00efd535c18() {
  return __cxx_static_address_9ba4f5ee730bc00efd535c18.reference || (__cxx_static_address_9ba4f5ee730bc00efd535c18.reference = {
    __cReference: true,
    get value() { return TENSCREEN____header_global_d0a6f55b697ee417; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:662
export const PLUTOPAKSPRITE____header_global_d062f6a43ae02cee = ((((((2501) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_208db9c8703ec0a21543b28b() {
  return __cxx_static_address_208db9c8703ec0a21543b28b.reference || (__cxx_static_address_208db9c8703ec0a21543b28b.reference = {
    __cReference: true,
    get value() { return PLUTOPAKSPRITE____header_global_d062f6a43ae02cee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:663
export const DEVISTATOR____header_global_2a4c1b889795756a = ((((((2510) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0f1fc9940fa8ebdef6016b80() {
  return __cxx_static_address_0f1fc9940fa8ebdef6016b80.reference || (__cxx_static_address_0f1fc9940fa8ebdef6016b80.reference = {
    __cReference: true,
    get value() { return DEVISTATOR____header_global_2a4c1b889795756a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:664
export const KNEE____header_global_e1ab301f8e139608 = ((((((2521) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d46f8e5d69011565617b44e8() {
  return __cxx_static_address_d46f8e5d69011565617b44e8.reference || (__cxx_static_address_d46f8e5d69011565617b44e8.reference = {
    __cReference: true,
    get value() { return KNEE____header_global_e1ab301f8e139608; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:665
export const CROSSHAIR____header_global_881bdc473f78ef6d = ((((((2523) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9cd6e355628fa9422d435227() {
  return __cxx_static_address_9cd6e355628fa9422d435227.reference || (__cxx_static_address_9cd6e355628fa9422d435227.reference = {
    __cReference: true,
    get value() { return CROSSHAIR____header_global_881bdc473f78ef6d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:666
export const FIRSTGUN____header_global_4d763e74fbdb3452 = ((((((2524) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e3583c8af19eea75e4d7bb90() {
  return __cxx_static_address_e3583c8af19eea75e4d7bb90.reference || (__cxx_static_address_e3583c8af19eea75e4d7bb90.reference = {
    __cReference: true,
    get value() { return FIRSTGUN____header_global_4d763e74fbdb3452; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:667
export const FIRSTGUNRELOAD____header_global_430a44840a56d065 = ((((((2528) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f113d2256ae6f1339ac5e9db() {
  return __cxx_static_address_f113d2256ae6f1339ac5e9db.reference || (__cxx_static_address_f113d2256ae6f1339ac5e9db.reference = {
    __cReference: true,
    get value() { return FIRSTGUNRELOAD____header_global_430a44840a56d065; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:668
export const SHELL____header_global_15550076f3cd11a9 = ((((((2533) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_14dd6af48aa4bf88bb52d4ab() {
  return __cxx_static_address_14dd6af48aa4bf88bb52d4ab.reference || (__cxx_static_address_14dd6af48aa4bf88bb52d4ab.reference = {
    __cReference: true,
    get value() { return SHELL____header_global_15550076f3cd11a9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:669
export const SHOTGUNSHELL____header_global_7b57c9926b731e3a = ((((((2535) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d9dc74af5c214dab6ebf810f() {
  return __cxx_static_address_d9dc74af5c214dab6ebf810f.reference || (__cxx_static_address_d9dc74af5c214dab6ebf810f.reference = {
    __cReference: true,
    get value() { return SHOTGUNSHELL____header_global_7b57c9926b731e3a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:670
export const CHAINGUN____header_global_a44faa446288363f = ((((((2536) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d222af24d0e2c10a1efe083e() {
  return __cxx_static_address_d222af24d0e2c10a1efe083e.reference || (__cxx_static_address_d222af24d0e2c10a1efe083e.reference = {
    __cReference: true,
    get value() { return CHAINGUN____header_global_a44faa446288363f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:671
export const RPGGUN____header_global_d0e3bceb3e06609b = ((((((2544) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4a97ae9721aa889edace433f() {
  return __cxx_static_address_4a97ae9721aa889edace433f.reference || (__cxx_static_address_4a97ae9721aa889edace433f.reference = {
    __cReference: true,
    get value() { return RPGGUN____header_global_d0e3bceb3e06609b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:672
export const FREEZE____header_global_c06e4c6fee835697 = ((((((2548) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_829df62b0a9811411c9f9eed() {
  return __cxx_static_address_829df62b0a9811411c9f9eed.reference || (__cxx_static_address_829df62b0a9811411c9f9eed.reference = {
    __cReference: true,
    get value() { return FREEZE____header_global_c06e4c6fee835697; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:673
export const SHRINKER____header_global_bb572b9ae41cf559 = ((((((2556) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_58c57c70e3a653cdeef3e1ff() {
  return __cxx_static_address_58c57c70e3a653cdeef3e1ff.reference || (__cxx_static_address_58c57c70e3a653cdeef3e1ff.reference = {
    __cReference: true,
    get value() { return SHRINKER____header_global_bb572b9ae41cf559; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:674
export const HANDHOLDINGLASER____header_global_be069f9882c2f38a = ((((((2563) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_157d0bf66675efacb77092c9() {
  return __cxx_static_address_157d0bf66675efacb77092c9.reference || (__cxx_static_address_157d0bf66675efacb77092c9.reference = {
    __cReference: true,
    get value() { return HANDHOLDINGLASER____header_global_be069f9882c2f38a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:675
export const TRIPBOMB____header_global_10a62894b78adc14 = ((((((2566) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_deedd130277b1dc10d2ed580() {
  return __cxx_static_address_deedd130277b1dc10d2ed580.reference || (__cxx_static_address_deedd130277b1dc10d2ed580.reference = {
    __cReference: true,
    get value() { return TRIPBOMB____header_global_10a62894b78adc14; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:676
export const LASERLINE____header_global_b9fb614c31902ea7 = ((((((2567) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d576d7cc1e3dc7f9b95dd72c() {
  return __cxx_static_address_d576d7cc1e3dc7f9b95dd72c.reference || (__cxx_static_address_d576d7cc1e3dc7f9b95dd72c.reference = {
    __cReference: true,
    get value() { return LASERLINE____header_global_b9fb614c31902ea7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:677
export const HANDHOLDINGACCESS____header_global_40b9439b46ce8ec1 = ((((((2568) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f5c92013ebaecda9b5c665c6() {
  return __cxx_static_address_f5c92013ebaecda9b5c665c6.reference || (__cxx_static_address_f5c92013ebaecda9b5c665c6.reference = {
    __cReference: true,
    get value() { return HANDHOLDINGACCESS____header_global_40b9439b46ce8ec1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:678
export const HANDREMOTE____header_global_74181f052f53d8ad = ((((((2570) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_48228768bf03e9d4d9561e83() {
  return __cxx_static_address_48228768bf03e9d4d9561e83.reference || (__cxx_static_address_48228768bf03e9d4d9561e83.reference = {
    __cReference: true,
    get value() { return HANDREMOTE____header_global_74181f052f53d8ad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:679
export const HANDTHROW____header_global_6f3ade5a626ceb21 = ((((((2573) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_952e677e50f0ef08f3bf3ffd() {
  return __cxx_static_address_952e677e50f0ef08f3bf3ffd.reference || (__cxx_static_address_952e677e50f0ef08f3bf3ffd.reference = {
    __cReference: true,
    get value() { return HANDTHROW____header_global_6f3ade5a626ceb21; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:680
export const TIP____header_global_3185ce982b56c656 = ((((((2576) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1277c79031295ecc419ad7fc() {
  return __cxx_static_address_1277c79031295ecc419ad7fc.reference || (__cxx_static_address_1277c79031295ecc419ad7fc.reference = {
    __cReference: true,
    get value() { return TIP____header_global_3185ce982b56c656; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:681
export const SCUBAMASK____header_global_4be59b515b48d9e8 = ((((((2581) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9051140b0689f01fa796760e() {
  return __cxx_static_address_9051140b0689f01fa796760e.reference || (__cxx_static_address_9051140b0689f01fa796760e.reference = {
    __cReference: true,
    get value() { return SCUBAMASK____header_global_4be59b515b48d9e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:682
export const FORCESPHERE____header_global_74089eb73fc93c19 = ((((((2590) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c4ad825fc85628d2fc5f72ca() {
  return __cxx_static_address_c4ad825fc85628d2fc5f72ca.reference || (__cxx_static_address_c4ad825fc85628d2fc5f72ca.reference = {
    __cReference: true,
    get value() { return FORCESPHERE____header_global_74089eb73fc93c19; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:683
export const SHOTSPARK1____header_global_e5b753aa005a751f = ((((((2595) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_92f9e990638d74a20273e4ab() {
  return __cxx_static_address_92f9e990638d74a20273e4ab.reference || (__cxx_static_address_92f9e990638d74a20273e4ab.reference = {
    __cReference: true,
    get value() { return SHOTSPARK1____header_global_e5b753aa005a751f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:684
export const RPG____header_global_9b7e0c592d6fb56f = ((((((2605) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_98a93f1693f10c7cf0721d0a() {
  return __cxx_static_address_98a93f1693f10c7cf0721d0a.reference || (__cxx_static_address_98a93f1693f10c7cf0721d0a.reference = {
    __cReference: true,
    get value() { return RPG____header_global_9b7e0c592d6fb56f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:685
export const LASERSITE____header_global_15e00cf186a114eb = ((((((2612) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_27388c27d0fccfc717ec6e79() {
  return __cxx_static_address_27388c27d0fccfc717ec6e79.reference || (__cxx_static_address_27388c27d0fccfc717ec6e79.reference = {
    __cReference: true,
    get value() { return LASERSITE____header_global_15e00cf186a114eb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:686
export const SHOTGUN____header_global_792668c084e7afe0 = ((((((2613) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f7911a94d5b05d7dbfd5c454() {
  return __cxx_static_address_f7911a94d5b05d7dbfd5c454.reference || (__cxx_static_address_f7911a94d5b05d7dbfd5c454.reference = {
    __cReference: true,
    get value() { return SHOTGUN____header_global_792668c084e7afe0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:687
export const BOSS1____header_global_a7d61f97f2eb8bba = ((((((2630) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e1189fab7fcdba01ad99d1f() {
  return __cxx_static_address_1e1189fab7fcdba01ad99d1f.reference || (__cxx_static_address_1e1189fab7fcdba01ad99d1f.reference = {
    __cReference: true,
    get value() { return BOSS1____header_global_a7d61f97f2eb8bba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:688
export const BOSS1STAYPUT____header_global_d52bc4aa8c0194bf = ((((((2631) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5575148cf393994d5fbb3ddd() {
  return __cxx_static_address_5575148cf393994d5fbb3ddd.reference || (__cxx_static_address_5575148cf393994d5fbb3ddd.reference = {
    __cReference: true,
    get value() { return BOSS1STAYPUT____header_global_d52bc4aa8c0194bf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:689
export const BOSS1SHOOT____header_global_74e691d128daa528 = ((((((2660) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e28f77513999be2bfc39ba58() {
  return __cxx_static_address_e28f77513999be2bfc39ba58.reference || (__cxx_static_address_e28f77513999be2bfc39ba58.reference = {
    __cReference: true,
    get value() { return BOSS1SHOOT____header_global_74e691d128daa528; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:690
export const BOSS1LOB____header_global_570a9770d74460f4 = ((((((2670) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3053962dbab324dfd48b5f62() {
  return __cxx_static_address_3053962dbab324dfd48b5f62.reference || (__cxx_static_address_3053962dbab324dfd48b5f62.reference = {
    __cReference: true,
    get value() { return BOSS1LOB____header_global_570a9770d74460f4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:691
export const BOSSTOP____header_global_9705df7f20715000 = ((((((2696) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_93ddbeafee0d141c3859d40d() {
  return __cxx_static_address_93ddbeafee0d141c3859d40d.reference || (__cxx_static_address_93ddbeafee0d141c3859d40d.reference = {
    __cReference: true,
    get value() { return BOSSTOP____header_global_9705df7f20715000; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:692
export const BOSS2____header_global_219215aa610a8203 = ((((((2710) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5b95c863d75e4969917834d0() {
  return __cxx_static_address_5b95c863d75e4969917834d0.reference || (__cxx_static_address_5b95c863d75e4969917834d0.reference = {
    __cReference: true,
    get value() { return BOSS2____header_global_219215aa610a8203; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:693
export const BOSS3____header_global_473ac52c9aa6aedd = ((((((2760) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_92d5194e74652c5a0afedd21() {
  return __cxx_static_address_92d5194e74652c5a0afedd21.reference || (__cxx_static_address_92d5194e74652c5a0afedd21.reference = {
    __cReference: true,
    get value() { return BOSS3____header_global_473ac52c9aa6aedd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:694
export const SPINNINGNUKEICON____header_global_4e698bee3a135748 = ((((((2813) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ec6c9ff0aff45facf8cbbec9() {
  return __cxx_static_address_ec6c9ff0aff45facf8cbbec9.reference || (__cxx_static_address_ec6c9ff0aff45facf8cbbec9.reference = {
    __cReference: true,
    get value() { return SPINNINGNUKEICON____header_global_4e698bee3a135748; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:695
export const SMALLFNTCURSOR____header_global_c0b8e973dc0892fc = ((((((2821) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_29d90432f3265c1d8ca0a401() {
  return __cxx_static_address_29d90432f3265c1d8ca0a401.reference || (__cxx_static_address_29d90432f3265c1d8ca0a401.reference = {
    __cReference: true,
    get value() { return SMALLFNTCURSOR____header_global_c0b8e973dc0892fc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:696
export const STARTALPHANUM____header_global_708b2451707c2763 = ((((((2822) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d812d577832c7b71cfd26fc4() {
  return __cxx_static_address_d812d577832c7b71cfd26fc4.reference || (__cxx_static_address_d812d577832c7b71cfd26fc4.reference = {
    __cReference: true,
    get value() { return STARTALPHANUM____header_global_708b2451707c2763; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:697
export const ENDALPHANUM____header_global_e546ce7cde30da4d = ((((((2915) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2836bd73b472d30ca8983674() {
  return __cxx_static_address_2836bd73b472d30ca8983674.reference || (__cxx_static_address_2836bd73b472d30ca8983674.reference = {
    __cReference: true,
    get value() { return ENDALPHANUM____header_global_e546ce7cde30da4d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:698
export const BIGALPHANUM____header_global_0feccf93844462fa = ((((((2940) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ad15a81ba94ba38b0e8918c7() {
  return __cxx_static_address_ad15a81ba94ba38b0e8918c7.reference || (__cxx_static_address_ad15a81ba94ba38b0e8918c7.reference = {
    __cReference: true,
    get value() { return BIGALPHANUM____header_global_0feccf93844462fa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:699
export const BIGPERIOD____header_global_03524602b97dfff7 = ((((((3002) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a4bd55c22a6f2d69104b9f46() {
  return __cxx_static_address_a4bd55c22a6f2d69104b9f46.reference || (__cxx_static_address_a4bd55c22a6f2d69104b9f46.reference = {
    __cReference: true,
    get value() { return BIGPERIOD____header_global_03524602b97dfff7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:700
export const BIGCOMMA____header_global_1535add0b66021ba = ((((((3003) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e7425143d51182de460d21ca() {
  return __cxx_static_address_e7425143d51182de460d21ca.reference || (__cxx_static_address_e7425143d51182de460d21ca.reference = {
    __cReference: true,
    get value() { return BIGCOMMA____header_global_1535add0b66021ba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:701
export const BIGX____header_global_d6f649d2671f80d5 = ((((((3004) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_32da6a1e5d810603c2e77694() {
  return __cxx_static_address_32da6a1e5d810603c2e77694.reference || (__cxx_static_address_32da6a1e5d810603c2e77694.reference = {
    __cReference: true,
    get value() { return BIGX____header_global_d6f649d2671f80d5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:702
export const BIGQ____header_global_22a7d0304e917192 = ((((((3005) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_061867aa5a7aa3f4aa53f256() {
  return __cxx_static_address_061867aa5a7aa3f4aa53f256.reference || (__cxx_static_address_061867aa5a7aa3f4aa53f256.reference = {
    __cReference: true,
    get value() { return BIGQ____header_global_22a7d0304e917192; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:703
export const BIGSEMI____header_global_3c82a52fde523b8d = ((((((3006) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d56186e8c64897fd137837ab() {
  return __cxx_static_address_d56186e8c64897fd137837ab.reference || (__cxx_static_address_d56186e8c64897fd137837ab.reference = {
    __cReference: true,
    get value() { return BIGSEMI____header_global_3c82a52fde523b8d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:704
export const BIGCOLIN____header_global_a9e79b4a5dd90e90 = ((((((3007) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ec629ba04986ae92ff8c62be() {
  return __cxx_static_address_ec629ba04986ae92ff8c62be.reference || (__cxx_static_address_ec629ba04986ae92ff8c62be.reference = {
    __cReference: true,
    get value() { return BIGCOLIN____header_global_a9e79b4a5dd90e90; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:705
export const THREEBYFIVE____header_global_279e438946e763ab = ((((((3010) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_524bc1d48f9a659c56075f83() {
  return __cxx_static_address_524bc1d48f9a659c56075f83.reference || (__cxx_static_address_524bc1d48f9a659c56075f83.reference = {
    __cReference: true,
    get value() { return THREEBYFIVE____header_global_279e438946e763ab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:706
export const BIGAPPOS____header_global_2f10826f0cc718fe = ((((((3022) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_282161c70ad51e4412eaab46() {
  return __cxx_static_address_282161c70ad51e4412eaab46.reference || (__cxx_static_address_282161c70ad51e4412eaab46.reference = {
    __cReference: true,
    get value() { return BIGAPPOS____header_global_2f10826f0cc718fe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:707
export const MINIFONT____header_global_3dfafeacffa79f51 = ((((((3072) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cab670205a1d0cd768aff686() {
  return __cxx_static_address_cab670205a1d0cd768aff686.reference || (__cxx_static_address_cab670205a1d0cd768aff686.reference = {
    __cReference: true,
    get value() { return MINIFONT____header_global_3dfafeacffa79f51; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:708
export const RESPAWNMARKERRED____header_global_c6bbae74a7d94c12 = ((((((3190) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e071404cb31b8738e5a664cc() {
  return __cxx_static_address_e071404cb31b8738e5a664cc.reference || (__cxx_static_address_e071404cb31b8738e5a664cc.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERRED____header_global_c6bbae74a7d94c12; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:709
export const RESPAWNMARKERYELLOW____header_global_2471837b1f2ec4c0 = ((((((3200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4e704836b081002be6face3d() {
  return __cxx_static_address_4e704836b081002be6face3d.reference || (__cxx_static_address_4e704836b081002be6face3d.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERYELLOW____header_global_2471837b1f2ec4c0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:710
export const RESPAWNMARKERGREEN____header_global_8f17513095ec81f8 = ((((((3210) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0e11a601769e0581e0463c0f() {
  return __cxx_static_address_0e11a601769e0581e0463c0f.reference || (__cxx_static_address_0e11a601769e0581e0463c0f.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERGREEN____header_global_8f17513095ec81f8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:711
export const BONUSSCREEN____header_global_4f2047e42d06e8a3 = ((((((3240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b084b1a70c9aa2d97a15cb3c() {
  return __cxx_static_address_b084b1a70c9aa2d97a15cb3c.reference || (__cxx_static_address_b084b1a70c9aa2d97a15cb3c.reference = {
    __cReference: true,
    get value() { return BONUSSCREEN____header_global_4f2047e42d06e8a3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:712
export const VIEWBORDER____header_global_1eb00b504df7d875 = ((((((3250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_df120b11ac617418b1b42f66() {
  return __cxx_static_address_df120b11ac617418b1b42f66.reference || (__cxx_static_address_df120b11ac617418b1b42f66.reference = {
    __cReference: true,
    get value() { return VIEWBORDER____header_global_1eb00b504df7d875; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:713
export const VICTORY1____header_global_54c35bbb37049f01 = ((((((3260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eefb62eb8a63a61eaff7568d() {
  return __cxx_static_address_eefb62eb8a63a61eaff7568d.reference || (__cxx_static_address_eefb62eb8a63a61eaff7568d.reference = {
    __cReference: true,
    get value() { return VICTORY1____header_global_54c35bbb37049f01; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:714
export const ORDERING____header_global_05eb81c5dfbf2681 = ((((((3270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_48c4a57e6345374d361ebe6d() {
  return __cxx_static_address_48c4a57e6345374d361ebe6d.reference || (__cxx_static_address_48c4a57e6345374d361ebe6d.reference = {
    __cReference: true,
    get value() { return ORDERING____header_global_05eb81c5dfbf2681; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:715
export const TEXTSTORY____header_global_c58de9d295361d0f = ((((((3280) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7832dd392a5397b715101d36() {
  return __cxx_static_address_7832dd392a5397b715101d36.reference || (__cxx_static_address_7832dd392a5397b715101d36.reference = {
    __cReference: true,
    get value() { return TEXTSTORY____header_global_c58de9d295361d0f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:716
export const LOADSCREEN____header_global_dc735eb483c9f54d = ((((((3281) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_20b75872b2361293fffefe72() {
  return __cxx_static_address_20b75872b2361293fffefe72.reference || (__cxx_static_address_20b75872b2361293fffefe72.reference = {
    __cReference: true,
    get value() { return LOADSCREEN____header_global_dc735eb483c9f54d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:717
export const BORNTOBEWILDSCREEN____header_global_9ac9ede398c03b89 = ((((((3370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8cb9c03f203d3776bb56113a() {
  return __cxx_static_address_8cb9c03f203d3776bb56113a.reference || (__cxx_static_address_8cb9c03f203d3776bb56113a.reference = {
    __cReference: true,
    get value() { return BORNTOBEWILDSCREEN____header_global_9ac9ede398c03b89; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:718
export const BLIMP____header_global_5d3bf76b4e8a839e = ((((((3400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d650d839b1d7b980f6c625ce() {
  return __cxx_static_address_d650d839b1d7b980f6c625ce.reference || (__cxx_static_address_d650d839b1d7b980f6c625ce.reference = {
    __cReference: true,
    get value() { return BLIMP____header_global_5d3bf76b4e8a839e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:719
export const FEM9____header_global_a506b0f54f6ce74a = ((((((3450) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_13c86b468fc6d2bb1d5ba2d5() {
  return __cxx_static_address_13c86b468fc6d2bb1d5ba2d5.reference || (__cxx_static_address_13c86b468fc6d2bb1d5ba2d5.reference = {
    __cReference: true,
    get value() { return FEM9____header_global_a506b0f54f6ce74a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:720
export const FRAMEEFFECT1_13____header_global_afe1e4c92d3c346b = ((((((3999) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1dcf2c206820eabe3d504f69() {
  return __cxx_static_address_1dcf2c206820eabe3d504f69.reference || (__cxx_static_address_1dcf2c206820eabe3d504f69.reference = {
    __cReference: true,
    get value() { return FRAMEEFFECT1_13____header_global_afe1e4c92d3c346b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:721
export const FRAMEEFFECT1____header_global_352783b5c0a027ff = ((((((4095) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_85daade9f832d0d3ca89ce1b() {
  return __cxx_static_address_85daade9f832d0d3ca89ce1b.reference || (__cxx_static_address_85daade9f832d0d3ca89ce1b.reference = {
    __cReference: true,
    get value() { return FRAMEEFFECT1____header_global_352783b5c0a027ff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:722
export const PANNEL3____header_global_662d7582d5a52b6a = ((((((4099) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_48864fb2ad5d14cd2f9b8434() {
  return __cxx_static_address_48864fb2ad5d14cd2f9b8434.reference || (__cxx_static_address_48864fb2ad5d14cd2f9b8434.reference = {
    __cReference: true,
    get value() { return PANNEL3____header_global_662d7582d5a52b6a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:723
export const SCREENBREAK14____header_global_4dbfa2a74202ce0e = ((((((4120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4800950b149fcab56b5b3afa() {
  return __cxx_static_address_4800950b149fcab56b5b3afa.reference || (__cxx_static_address_4800950b149fcab56b5b3afa.reference = {
    __cReference: true,
    get value() { return SCREENBREAK14____header_global_4dbfa2a74202ce0e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:724
export const SCREENBREAK15____header_global_9a189ae0d5cb9753 = ((((((4123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ee7144f63d0fcec629ec4aca() {
  return __cxx_static_address_ee7144f63d0fcec629ec4aca.reference || (__cxx_static_address_ee7144f63d0fcec629ec4aca.reference = {
    __cReference: true,
    get value() { return SCREENBREAK15____header_global_9a189ae0d5cb9753; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:725
export const SCREENBREAK19____header_global_045e3863202ba247 = ((((((4125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5adc3c5c982eed5d465d7444() {
  return __cxx_static_address_5adc3c5c982eed5d465d7444.reference || (__cxx_static_address_5adc3c5c982eed5d465d7444.reference = {
    __cReference: true,
    get value() { return SCREENBREAK19____header_global_045e3863202ba247; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:726
export const SCREENBREAK16____header_global_0136141637afb1f9 = ((((((4127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dfbdb9a79345f18f266421f7() {
  return __cxx_static_address_dfbdb9a79345f18f266421f7.reference || (__cxx_static_address_dfbdb9a79345f18f266421f7.reference = {
    __cReference: true,
    get value() { return SCREENBREAK16____header_global_0136141637afb1f9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:727
export const SCREENBREAK17____header_global_6df51d43a9cacdb8 = ((((((4128) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f0e9dbb7cf62eac255a1b3c0() {
  return __cxx_static_address_f0e9dbb7cf62eac255a1b3c0.reference || (__cxx_static_address_f0e9dbb7cf62eac255a1b3c0.reference = {
    __cReference: true,
    get value() { return SCREENBREAK17____header_global_6df51d43a9cacdb8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:728
export const SCREENBREAK18____header_global_9ea0c068d6e9893a = ((((((4129) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_54e62b53442474553dd0b336() {
  return __cxx_static_address_54e62b53442474553dd0b336.reference || (__cxx_static_address_54e62b53442474553dd0b336.reference = {
    __cReference: true,
    get value() { return SCREENBREAK18____header_global_9ea0c068d6e9893a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:729
export const W_TECHWALL11____header_global_d75d37b5b7be09d1 = ((((((4130) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4bc299f04f7b1fba9b0ad83e() {
  return __cxx_static_address_4bc299f04f7b1fba9b0ad83e.reference || (__cxx_static_address_4bc299f04f7b1fba9b0ad83e.reference = {
    __cReference: true,
    get value() { return W_TECHWALL11____header_global_d75d37b5b7be09d1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:730
export const W_TECHWALL12____header_global_df389d9650588ff5 = ((((((4131) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e737c11a3f0b69c9b92cdfda() {
  return __cxx_static_address_e737c11a3f0b69c9b92cdfda.reference || (__cxx_static_address_e737c11a3f0b69c9b92cdfda.reference = {
    __cReference: true,
    get value() { return W_TECHWALL12____header_global_df389d9650588ff5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:731
export const W_TECHWALL13____header_global_a9fd455c3fe8ef29 = ((((((4132) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fe0eb1686edaa0950e03e3a1() {
  return __cxx_static_address_fe0eb1686edaa0950e03e3a1.reference || (__cxx_static_address_fe0eb1686edaa0950e03e3a1.reference = {
    __cReference: true,
    get value() { return W_TECHWALL13____header_global_a9fd455c3fe8ef29; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:732
export const W_TECHWALL14____header_global_10f618163a1bad65 = ((((((4133) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6b5aad64bad35bb40f951fc1() {
  return __cxx_static_address_6b5aad64bad35bb40f951fc1.reference || (__cxx_static_address_6b5aad64bad35bb40f951fc1.reference = {
    __cReference: true,
    get value() { return W_TECHWALL14____header_global_10f618163a1bad65; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:733
export const W_TECHWALL5____header_global_21dccdc568d585e4 = ((((((4134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_997d896e4970074affd463fa() {
  return __cxx_static_address_997d896e4970074affd463fa.reference || (__cxx_static_address_997d896e4970074affd463fa.reference = {
    __cReference: true,
    get value() { return W_TECHWALL5____header_global_21dccdc568d585e4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:734
export const W_TECHWALL6____header_global_759cc26c87bec9ed = ((((((4136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e966a44c26bdce833b905ec6() {
  return __cxx_static_address_e966a44c26bdce833b905ec6.reference || (__cxx_static_address_e966a44c26bdce833b905ec6.reference = {
    __cReference: true,
    get value() { return W_TECHWALL6____header_global_759cc26c87bec9ed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:735
export const W_TECHWALL7____header_global_fb07698723569f9b = ((((((4138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4d051a4cb7c2b7cd0dbe3bc7() {
  return __cxx_static_address_4d051a4cb7c2b7cd0dbe3bc7.reference || (__cxx_static_address_4d051a4cb7c2b7cd0dbe3bc7.reference = {
    __cReference: true,
    get value() { return W_TECHWALL7____header_global_fb07698723569f9b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:736
export const W_TECHWALL8____header_global_7e50c316c9406b5b = ((((((4140) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0462a3fda8151b9ffbcb97e9() {
  return __cxx_static_address_0462a3fda8151b9ffbcb97e9.reference || (__cxx_static_address_0462a3fda8151b9ffbcb97e9.reference = {
    __cReference: true,
    get value() { return W_TECHWALL8____header_global_7e50c316c9406b5b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:737
export const W_TECHWALL9____header_global_ab3db13b47dfa0ac = ((((((4142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a97e3a3f0603ead70f7b0f7a() {
  return __cxx_static_address_a97e3a3f0603ead70f7b0f7a.reference || (__cxx_static_address_a97e3a3f0603ead70f7b0f7a.reference = {
    __cReference: true,
    get value() { return W_TECHWALL9____header_global_ab3db13b47dfa0ac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:738
export const BPANNEL3____header_global_318cb21242143e5b = ((((((4100) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_299ec5fd57eca91ff914d8c1() {
  return __cxx_static_address_299ec5fd57eca91ff914d8c1.reference || (__cxx_static_address_299ec5fd57eca91ff914d8c1.reference = {
    __cReference: true,
    get value() { return BPANNEL3____header_global_318cb21242143e5b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:739
export const W_HITTECHWALL16____header_global_39a3d0a1252c3ccc = ((((((4144) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_498bb198b9ce056941c9ac30() {
  return __cxx_static_address_498bb198b9ce056941c9ac30.reference || (__cxx_static_address_498bb198b9ce056941c9ac30.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL16____header_global_39a3d0a1252c3ccc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:740
export const W_HITTECHWALL10____header_global_2747d58770034959 = ((((((4145) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7290f6be460a8939b50aa95b() {
  return __cxx_static_address_7290f6be460a8939b50aa95b.reference || (__cxx_static_address_7290f6be460a8939b50aa95b.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL10____header_global_2747d58770034959; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:741
export const W_HITTECHWALL15____header_global_2e977d98382e14d5 = ((((((4147) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1f0b0b25582b2ca1c0f31ebd() {
  return __cxx_static_address_1f0b0b25582b2ca1c0f31ebd.reference || (__cxx_static_address_1f0b0b25582b2ca1c0f31ebd.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL15____header_global_2e977d98382e14d5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:742
export const W_MILKSHELF____header_global_a1763d72a53b7625 = ((((((4181) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4d2e6e3a60e4ba990362858c() {
  return __cxx_static_address_4d2e6e3a60e4ba990362858c.reference || (__cxx_static_address_4d2e6e3a60e4ba990362858c.reference = {
    __cReference: true,
    get value() { return W_MILKSHELF____header_global_a1763d72a53b7625; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:743
export const W_MILKSHELFBROKE____header_global_6f24187f23297de4 = ((((((4203) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0f0fa213638393e4569614e0() {
  return __cxx_static_address_0f0fa213638393e4569614e0.reference || (__cxx_static_address_0f0fa213638393e4569614e0.reference = {
    __cReference: true,
    get value() { return W_MILKSHELFBROKE____header_global_6f24187f23297de4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:744
export const PURPLELAVA____header_global_b7050d65892c76dd = ((((((4240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d59e073385c513006e0ead9c() {
  return __cxx_static_address_d59e073385c513006e0ead9c.reference || (__cxx_static_address_d59e073385c513006e0ead9c.reference = {
    __cReference: true,
    get value() { return PURPLELAVA____header_global_b7050d65892c76dd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:745
export const TARGET____header_global_c99f62e99ac1f2f0 = ((((((4359) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_02bc919465ab914876a1b73d() {
  return __cxx_static_address_02bc919465ab914876a1b73d.reference || (__cxx_static_address_02bc919465ab914876a1b73d.reference = {
    __cReference: true,
    get value() { return TARGET____header_global_c99f62e99ac1f2f0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:746
export const DUCK____header_global_d28e835cd52010d5 = ((((((4361) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f26f557eb31ce7f56752073e() {
  return __cxx_static_address_f26f557eb31ce7f56752073e.reference || (__cxx_static_address_f26f557eb31ce7f56752073e.reference = {
    __cReference: true,
    get value() { return DUCK____header_global_d28e835cd52010d5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:747
export const PUKE____header_global_a8a694c70c39c711 = ((((((4389) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_05e1b6189f5bb96ea7835b63() {
  return __cxx_static_address_05e1b6189f5bb96ea7835b63.reference || (__cxx_static_address_05e1b6189f5bb96ea7835b63.reference = {
    __cReference: true,
    get value() { return PUKE____header_global_a8a694c70c39c711; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:748
export const DOORTILE23____header_global_9d8a687cc5fc5a74 = ((((((4391) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0dc138dec7dd5e8ffde9188a() {
  return __cxx_static_address_0dc138dec7dd5e8ffde9188a.reference || (__cxx_static_address_0dc138dec7dd5e8ffde9188a.reference = {
    __cReference: true,
    get value() { return DOORTILE23____header_global_9d8a687cc5fc5a74; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:749
export const SPEAKER____header_global_bbb28edebcd150bb = ((((((4397) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d2617615e00ad24d0390ca8d() {
  return __cxx_static_address_d2617615e00ad24d0390ca8d.reference || (__cxx_static_address_d2617615e00ad24d0390ca8d.reference = {
    __cReference: true,
    get value() { return SPEAKER____header_global_bbb28edebcd150bb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:750
export const MAIL____header_global_ece715de72654052 = ((((((4410) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eac1050eef7764882dded770() {
  return __cxx_static_address_eac1050eef7764882dded770.reference || (__cxx_static_address_eac1050eef7764882dded770.reference = {
    __cReference: true,
    get value() { return MAIL____header_global_ece715de72654052; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:751
export const HOTMEAT____header_global_aafe05557f3c28bd = ((((((4427) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9bbfc07580c63cc0f842b253() {
  return __cxx_static_address_9bbfc07580c63cc0f842b253.reference || (__cxx_static_address_9bbfc07580c63cc0f842b253.reference = {
    __cReference: true,
    get value() { return HOTMEAT____header_global_aafe05557f3c28bd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:752
export const TRIPODCAMERA____header_global_649e87c3e862b713 = ((((((4444) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_960d671c35d3692e417f72c6() {
  return __cxx_static_address_960d671c35d3692e417f72c6.reference || (__cxx_static_address_960d671c35d3692e417f72c6.reference = {
    __cReference: true,
    get value() { return TRIPODCAMERA____header_global_649e87c3e862b713; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:753
export const PAPER____header_global_7ab31d4c3ecbf5f7 = ((((((4460) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_76a3ccf6b012ba1fbe092701() {
  return __cxx_static_address_76a3ccf6b012ba1fbe092701.reference || (__cxx_static_address_76a3ccf6b012ba1fbe092701.reference = {
    __cReference: true,
    get value() { return PAPER____header_global_7ab31d4c3ecbf5f7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:754
export const GENERICPOLE2____header_global_138b47ebbb04277d = ((((((4465) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0b02de009a53f2be1ca6815b() {
  return __cxx_static_address_0b02de009a53f2be1ca6815b.reference || (__cxx_static_address_0b02de009a53f2be1ca6815b.reference = {
    __cReference: true,
    get value() { return GENERICPOLE2____header_global_138b47ebbb04277d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:755
export const XXXSTACY____header_global_2b93cc0c15e4eb14 = ((((((4470) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_597b368b5b44d82e49c133b0() {
  return __cxx_static_address_597b368b5b44d82e49c133b0.reference || (__cxx_static_address_597b368b5b44d82e49c133b0.reference = {
    __cReference: true,
    get value() { return XXXSTACY____header_global_2b93cc0c15e4eb14; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:756
export const LETTER____header_global_72866e063f08a4c9 = ((((((4502) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_df97473794be588dfe58ddf1() {
  return __cxx_static_address_df97473794be588dfe58ddf1.reference || (__cxx_static_address_df97473794be588dfe58ddf1.reference = {
    __cReference: true,
    get value() { return LETTER____header_global_72866e063f08a4c9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:757
export const SIDEBOLT1____header_global_d7eaeeeba0971aab = ((((((4525) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5567228f279b410812f864be() {
  return __cxx_static_address_5567228f279b410812f864be.reference || (__cxx_static_address_5567228f279b410812f864be.reference = {
    __cReference: true,
    get value() { return SIDEBOLT1____header_global_d7eaeeeba0971aab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:758
export const FOODOBJECT16____header_global_f7856ab6dd98afdd = ((((((4545) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0b550bcc5bcba5938a9cbe09() {
  return __cxx_static_address_0b550bcc5bcba5938a9cbe09.reference || (__cxx_static_address_0b550bcc5bcba5938a9cbe09.reference = {
    __cReference: true,
    get value() { return FOODOBJECT16____header_global_f7856ab6dd98afdd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:759
export const TAMPON____header_global_885d474e9082513c = ((((((4557) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_beb7bd5afb44cbd4cb3c1b7f() {
  return __cxx_static_address_beb7bd5afb44cbd4cb3c1b7f.reference || (__cxx_static_address_beb7bd5afb44cbd4cb3c1b7f.reference = {
    __cReference: true,
    get value() { return TAMPON____header_global_885d474e9082513c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:760
export const CANWITHSOMETHING2____header_global_3a59af421b230123 = ((((((4580) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_52da779d6eef52df1e99872f() {
  return __cxx_static_address_52da779d6eef52df1e99872f.reference || (__cxx_static_address_52da779d6eef52df1e99872f.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING2____header_global_3a59af421b230123; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:761
export const CANWITHSOMETHING3____header_global_f1e0df12c3c22964 = ((((((4581) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d132e7eb897ed20ab5b74cf9() {
  return __cxx_static_address_d132e7eb897ed20ab5b74cf9.reference || (__cxx_static_address_d132e7eb897ed20ab5b74cf9.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING3____header_global_f1e0df12c3c22964; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:762
export const CANWITHSOMETHING4____header_global_50c29f5148b807d2 = ((((((4582) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_45103d2db0266441c650523d() {
  return __cxx_static_address_45103d2db0266441c650523d.reference || (__cxx_static_address_45103d2db0266441c650523d.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING4____header_global_50c29f5148b807d2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:763
export const DOLPHIN1____header_global_1f1225ad43ab2cc5 = ((((((4591) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e4dd6048eaabad2af31af589() {
  return __cxx_static_address_e4dd6048eaabad2af31af589.reference || (__cxx_static_address_e4dd6048eaabad2af31af589.reference = {
    __cReference: true,
    get value() { return DOLPHIN1____header_global_1f1225ad43ab2cc5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:764
export const DOLPHIN2____header_global_aea918b1d8073527 = ((((((4592) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_af5649541e365dcbd662662e() {
  return __cxx_static_address_af5649541e365dcbd662662e.reference || (__cxx_static_address_af5649541e365dcbd662662e.reference = {
    __cReference: true,
    get value() { return DOLPHIN2____header_global_aea918b1d8073527; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:765
export const NEWBEAST____header_global_2839a86e50dd3a0d = ((((((4610) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_24fd2fde53974590256e25c7() {
  return __cxx_static_address_24fd2fde53974590256e25c7.reference || (__cxx_static_address_24fd2fde53974590256e25c7.reference = {
    __cReference: true,
    get value() { return NEWBEAST____header_global_2839a86e50dd3a0d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:766
export const NEWBEASTSTAYPUT____header_global_6f444f203a0651af = ((((((4611) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e1d82ab5c4b20c28c79129c4() {
  return __cxx_static_address_e1d82ab5c4b20c28c79129c4.reference || (__cxx_static_address_e1d82ab5c4b20c28c79129c4.reference = {
    __cReference: true,
    get value() { return NEWBEASTSTAYPUT____header_global_6f444f203a0651af; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:767
export const BOSS4____header_global_b7a0317261549793 = ((((((4740) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_23796dcbe44306b98619e027() {
  return __cxx_static_address_23796dcbe44306b98619e027.reference || (__cxx_static_address_23796dcbe44306b98619e027.reference = {
    __cReference: true,
    get value() { return BOSS4____header_global_b7a0317261549793; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:768
export const BOSS4STAYPUT____header_global_25315c6e8f601cf0 = ((((((4741) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b5f3a4b537de995de0c7079f() {
  return __cxx_static_address_b5f3a4b537de995de0c7079f.reference || (__cxx_static_address_b5f3a4b537de995de0c7079f.reference = {
    __cReference: true,
    get value() { return BOSS4STAYPUT____header_global_25315c6e8f601cf0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:769
export const FEM10____header_global_5503889b85fd6a3c = ((((((4864) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_56b31a36fc205891237cec58() {
  return __cxx_static_address_56b31a36fc205891237cec58.reference || (__cxx_static_address_56b31a36fc205891237cec58.reference = {
    __cReference: true,
    get value() { return FEM10____header_global_5503889b85fd6a3c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:770
export const TOUGHGAL____header_global_5b806b78a2cd9711 = ((((((4866) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dd7f70d25d3892a091698480() {
  return __cxx_static_address_dd7f70d25d3892a091698480.reference || (__cxx_static_address_dd7f70d25d3892a091698480.reference = {
    __cReference: true,
    get value() { return TOUGHGAL____header_global_5b806b78a2cd9711; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:771
export const MAN____header_global_2b165656ced80dbd = ((((((4871) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c552bb0b132466235c538fb0() {
  return __cxx_static_address_c552bb0b132466235c538fb0.reference || (__cxx_static_address_c552bb0b132466235c538fb0.reference = {
    __cReference: true,
    get value() { return MAN____header_global_2b165656ced80dbd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:772
export const MAN2____header_global_487fdf35f9006154 = ((((((4872) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5049b19aa8370676adf6d4c2() {
  return __cxx_static_address_5049b19aa8370676adf6d4c2.reference || (__cxx_static_address_5049b19aa8370676adf6d4c2.reference = {
    __cReference: true,
    get value() { return MAN2____header_global_487fdf35f9006154; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:773
export const WOMAN____header_global_f675758ff29e6411 = ((((((4874) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0d33ce0bd81d4b889f6a9eee() {
  return __cxx_static_address_0d33ce0bd81d4b889f6a9eee.reference || (__cxx_static_address_0d33ce0bd81d4b889f6a9eee.reference = {
    __cReference: true,
    get value() { return WOMAN____header_global_f675758ff29e6411; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:774
export const NATURALLIGHTNING____header_global_bf4a13fc18922e0a = ((((((4890) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6d29126fd6b43c05b54bde88() {
  return __cxx_static_address_6d29126fd6b43c05b54bde88.reference || (__cxx_static_address_6d29126fd6b43c05b54bde88.reference = {
    __cReference: true,
    get value() { return NATURALLIGHTNING____header_global_bf4a13fc18922e0a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:775
export const WEATHERWARN____header_global_9d7a05102bfe5789 = ((((((4893) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_699c50952b2cdb241de4b30f() {
  return __cxx_static_address_699c50952b2cdb241de4b30f.reference || (__cxx_static_address_699c50952b2cdb241de4b30f.reference = {
    __cReference: true,
    get value() { return WEATHERWARN____header_global_9d7a05102bfe5789; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:776
export const DUKETAG____header_global_b6c976fe048b335d = ((((((4900) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_15549feaaef6626a76977065() {
  return __cxx_static_address_15549feaaef6626a76977065.reference || (__cxx_static_address_15549feaaef6626a76977065.reference = {
    __cReference: true,
    get value() { return DUKETAG____header_global_b6c976fe048b335d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:777
export const SIGN1____header_global_bdb47d1ad526479f = ((((((4909) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aa59cd3deb9d798cb240f8e2() {
  return __cxx_static_address_aa59cd3deb9d798cb240f8e2.reference || (__cxx_static_address_aa59cd3deb9d798cb240f8e2.reference = {
    __cReference: true,
    get value() { return SIGN1____header_global_bdb47d1ad526479f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:778
export const SIGN2____header_global_5bb72e6e3c6d0ba8 = ((((((4912) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_99e5fc2aabace114610ecd48() {
  return __cxx_static_address_99e5fc2aabace114610ecd48.reference || (__cxx_static_address_99e5fc2aabace114610ecd48.reference = {
    __cReference: true,
    get value() { return SIGN2____header_global_5bb72e6e3c6d0ba8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:779
export const JURYGUY____header_global_c9a551cb5fbf0d17 = ((((((4943) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_858637fc1e8d43aa6682821c() {
  return __cxx_static_address_858637fc1e8d43aa6682821c.reference || (__cxx_static_address_858637fc1e8d43aa6682821c.reference = {
    __cReference: true,
    get value() { return JURYGUY____header_global_c9a551cb5fbf0d17; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:780
export const WIDESCREENSTATUSBAR____header_global_2c76204f0cab9171 = ((((((5120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_35efd5d48f5de7c20cc11fd4() {
  return __cxx_static_address_35efd5d48f5de7c20cc11fd4.reference || (__cxx_static_address_35efd5d48f5de7c20cc11fd4.reference = {
    __cReference: true,
    get value() { return WIDESCREENSTATUSBAR____header_global_2c76204f0cab9171; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:781
export const RPGGUNWIDE____header_global_f1abe38fbdca2b40 = ((((((5121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a8191faa0a916028ea92d6f0() {
  return __cxx_static_address_a8191faa0a916028ea92d6f0.reference || (__cxx_static_address_a8191faa0a916028ea92d6f0.reference = {
    __cReference: true,
    get value() { return RPGGUNWIDE____header_global_f1abe38fbdca2b40; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:782
export const FIRSTGUNRELOADWIDE____header_global_8d84ca9dcd162bec = ((((((5122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_435d87dfbff616c4919b99fd() {
  return __cxx_static_address_435d87dfbff616c4919b99fd.reference || (__cxx_static_address_435d87dfbff616c4919b99fd.reference = {
    __cReference: true,
    get value() { return FIRSTGUNRELOADWIDE____header_global_8d84ca9dcd162bec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:783
export const FREEZEWIDE____header_global_16965e7841710e1a = ((((((5123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c644f18f65b693f57cce31aa() {
  return __cxx_static_address_c644f18f65b693f57cce31aa.reference || (__cxx_static_address_c644f18f65b693f57cce31aa.reference = {
    __cReference: true,
    get value() { return FREEZEWIDE____header_global_16965e7841710e1a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:784
export const FREEZEFIREWIDE____header_global_29a84d413141b308 = ((((((5124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a551a3ebf52d30a966131b12() {
  return __cxx_static_address_a551a3ebf52d30a966131b12.reference || (__cxx_static_address_a551a3ebf52d30a966131b12.reference = {
    __cReference: true,
    get value() { return FREEZEFIREWIDE____header_global_29a84d413141b308; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:785
export const SHRINKERWIDE____header_global_33d1d67fd40d55a3 = ((((((5127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5d90be3c1e6e505d6b3b3121() {
  return __cxx_static_address_5d90be3c1e6e505d6b3b3121.reference || (__cxx_static_address_5d90be3c1e6e505d6b3b3121.reference = {
    __cReference: true,
    get value() { return SHRINKERWIDE____header_global_33d1d67fd40d55a3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:786
export const CRACKKNUCKLESWIDE____header_global_671b96e2da51171e = ((((((5129) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a58a43cca2d0071c53870ce6() {
  return __cxx_static_address_a58a43cca2d0071c53870ce6.reference || (__cxx_static_address_a58a43cca2d0071c53870ce6.reference = {
    __cReference: true,
    get value() { return CRACKKNUCKLESWIDE____header_global_671b96e2da51171e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:787
export const FLAMETHROWERSPRITE____header_global_44fab8809d9c0caf = ((((((5134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_708fb871b0ab75de9f080478() {
  return __cxx_static_address_708fb871b0ab75de9f080478.reference || (__cxx_static_address_708fb871b0ab75de9f080478.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERSPRITE____header_global_44fab8809d9c0caf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:788
export const FLAMETHROWERAMMO____header_global_207cf0fdf4070762 = ((((((5135) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e14f03e3c43fbebb26bb1848() {
  return __cxx_static_address_e14f03e3c43fbebb26bb1848.reference || (__cxx_static_address_e14f03e3c43fbebb26bb1848.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERAMMO____header_global_207cf0fdf4070762; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:789
export const FLAMETHROWER____header_global_2a72b2bf59382296 = ((((((5138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_60547ae738c1b15eb712e5f2() {
  return __cxx_static_address_60547ae738c1b15eb712e5f2.reference || (__cxx_static_address_60547ae738c1b15eb712e5f2.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER____header_global_2a72b2bf59382296; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:790
export const FLAMETHROWERFIRE____header_global_800878ab38e82fc2 = ((((((5139) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3f0540196151980b04f1201e() {
  return __cxx_static_address_3f0540196151980b04f1201e.reference || (__cxx_static_address_3f0540196151980b04f1201e.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERFIRE____header_global_800878ab38e82fc2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:791
export const FLAMETHROWERFLAME____header_global_b2b24cd10091ab41 = ((((((1891) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5e849aa4cf0e7d1b6cbd68ec() {
  return __cxx_static_address_5e849aa4cf0e7d1b6cbd68ec.reference || (__cxx_static_address_5e849aa4cf0e7d1b6cbd68ec.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERFLAME____header_global_b2b24cd10091ab41; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:792
export const FLAMETHROWERPILOT____header_global_52604c3943f64be2 = ((((((5174) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8e4b0500d27dd78b50646aee() {
  return __cxx_static_address_8e4b0500d27dd78b50646aee.reference || (__cxx_static_address_8e4b0500d27dd78b50646aee.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERPILOT____header_global_52604c3943f64be2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:793
export const FIREBALL____header_global_838d7bc76ca35389 = ((((((5163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cc1cec707387f53c15617a2a() {
  return __cxx_static_address_cc1cec707387f53c15617a2a.reference || (__cxx_static_address_cc1cec707387f53c15617a2a.reference = {
    __cReference: true,
    get value() { return FIREBALL____header_global_838d7bc76ca35389; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:794
export const ONFIRE____header_global_617a9438a039f1d4 = ((((((5152) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a72435e6ebae5db783bc673f() {
  return __cxx_static_address_a72435e6ebae5db783bc673f.reference || (__cxx_static_address_a72435e6ebae5db783bc673f.reference = {
    __cReference: true,
    get value() { return ONFIRE____header_global_617a9438a039f1d4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:795
export const ONFIRESMOKE____header_global_c6c42b1db0b9a1a0 = ((((((5143) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3a9384c849c333ea00be6304() {
  return __cxx_static_address_3a9384c849c333ea00be6304.reference || (__cxx_static_address_3a9384c849c333ea00be6304.reference = {
    __cReference: true,
    get value() { return ONFIRESMOKE____header_global_c6c42b1db0b9a1a0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:796
export const BURNEDCORPSE____header_global_7e64119d81c25430 = ((((((5173) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e4de32c92dc4221030bfaab6() {
  return __cxx_static_address_e4de32c92dc4221030bfaab6.reference || (__cxx_static_address_e4de32c92dc4221030bfaab6.reference = {
    __cReference: true,
    get value() { return BURNEDCORPSE____header_global_7e64119d81c25430; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:797
export const WHISPYSMOKE____header_global_7c0a81b70d730af6 = ((((((5268) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4c5d231e9ae11c8ad224a62a() {
  return __cxx_static_address_4c5d231e9ae11c8ad224a62a.reference || (__cxx_static_address_4c5d231e9ae11c8ad224a62a.reference = {
    __cReference: true,
    get value() { return WHISPYSMOKE____header_global_7c0a81b70d730af6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:798
export const FIREFLY____header_global_8fbd3b941d431244 = ((((((5180) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_13ef867f411e3c4b84c3439a() {
  return __cxx_static_address_13ef867f411e3c4b84c3439a.reference || (__cxx_static_address_13ef867f411e3c4b84c3439a.reference = {
    __cReference: true,
    get value() { return FIREFLY____header_global_8fbd3b941d431244; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:799
export const FIREFLYSHRINKEFFECT____header_global_fb0f6c8ddf93ae33 = ((((((5360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_021ceba535472c9767e5e920() {
  return __cxx_static_address_021ceba535472c9767e5e920.reference || (__cxx_static_address_021ceba535472c9767e5e920.reference = {
    __cReference: true,
    get value() { return FIREFLYSHRINKEFFECT____header_global_fb0f6c8ddf93ae33; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:800
export const FIREFLYGROWEFFECT____header_global_f0fb7f0024b8130a = ((((((5367) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5fc9dd1cbc52c5ba6ee6e466() {
  return __cxx_static_address_5fc9dd1cbc52c5ba6ee6e466.reference || (__cxx_static_address_5fc9dd1cbc52c5ba6ee6e466.reference = {
    __cReference: true,
    get value() { return FIREFLYGROWEFFECT____header_global_f0fb7f0024b8130a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:801
export const FIREFLYFLYINGEFFECT____header_global_9fb8f28cd9e5bd75 = ((((((5296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5a7d4a37b5391f2a7f969fbd() {
  return __cxx_static_address_5a7d4a37b5391f2a7f969fbd.reference || (__cxx_static_address_5a7d4a37b5391f2a7f969fbd.reference = {
    __cReference: true,
    get value() { return FIREFLYFLYINGEFFECT____header_global_9fb8f28cd9e5bd75; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:802
export const BOSS5____header_global_0c89bdbaa76d24b3 = ((((((5310) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8960d422c9866e41baa316ba() {
  return __cxx_static_address_8960d422c9866e41baa316ba.reference || (__cxx_static_address_8960d422c9866e41baa316ba.reference = {
    __cReference: true,
    get value() { return BOSS5____header_global_0c89bdbaa76d24b3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:803
export const BOSS5STAYPUT____header_global_2b937314f6405a78 = ((((((5311) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0102c7b5cc8fb4ba18415296() {
  return __cxx_static_address_0102c7b5cc8fb4ba18415296.reference || (__cxx_static_address_0102c7b5cc8fb4ba18415296.reference = {
    __cReference: true,
    get value() { return BOSS5STAYPUT____header_global_2b937314f6405a78; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:804
export const LAVAPOOL____header_global_5bc4ac81c5558a7a = ((((((5304) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0a91c0a7b23958a7f6cd6e89() {
  return __cxx_static_address_0a91c0a7b23958a7f6cd6e89.reference || (__cxx_static_address_0a91c0a7b23958a7f6cd6e89.reference = {
    __cReference: true,
    get value() { return LAVAPOOL____header_global_5bc4ac81c5558a7a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:805
export const LAVASPLASH____header_global_a37865fb29ccd013 = ((((((5371) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3721bcb668cdb38bcebb847b() {
  return __cxx_static_address_3721bcb668cdb38bcebb847b.reference || (__cxx_static_address_3721bcb668cdb38bcebb847b.reference = {
    __cReference: true,
    get value() { return LAVASPLASH____header_global_a37865fb29ccd013; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:806
export const LAVAPOOLBUBBLE____header_global_f71c377e5b95d83a = ((((((5207) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_873b497511b92abfbe301d0a() {
  return __cxx_static_address_873b497511b92abfbe301d0a.reference || (__cxx_static_address_873b497511b92abfbe301d0a.reference = {
    __cReference: true,
    get value() { return LAVAPOOLBUBBLE____header_global_f71c377e5b95d83a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:807
export const BOSS2STAYPUT____header_global_ecde93d7989a1470 = ((((((2711) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_06b0f4499153cd839cca38c3() {
  return __cxx_static_address_06b0f4499153cd839cca38c3.reference || (__cxx_static_address_06b0f4499153cd839cca38c3.reference = {
    __cReference: true,
    get value() { return BOSS2STAYPUT____header_global_ecde93d7989a1470; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:808
export const BOSS3STAYPUT____header_global_b3be147c3ec3ca02 = ((((((2761) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e68751722405ae42b5d113c3() {
  return __cxx_static_address_e68751722405ae42b5d113c3.reference || (__cxx_static_address_e68751722405ae42b5d113c3.reference = {
    __cReference: true,
    get value() { return BOSS3STAYPUT____header_global_b3be147c3ec3ca02; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:809
export const E32_TILE5736____header_global_e3b15b6e958e19bc = ((((((5736) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_582a38834a3d1140929911b6() {
  return __cxx_static_address_582a38834a3d1140929911b6.reference || (__cxx_static_address_582a38834a3d1140929911b6.reference = {
    __cReference: true,
    get value() { return E32_TILE5736____header_global_e3b15b6e958e19bc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:810
export const E32_TILE5737____header_global_27413369c7bf2fe5 = ((((((5737) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_24a6ecea3a5f17bf0b61b806() {
  return __cxx_static_address_24a6ecea3a5f17bf0b61b806.reference || (__cxx_static_address_24a6ecea3a5f17bf0b61b806.reference = {
    __cReference: true,
    get value() { return E32_TILE5737____header_global_27413369c7bf2fe5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:811
export const E32_TILE5846____header_global_a9f21f88034d08b1 = ((((((5846) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_30a09cadc20eb68d8f777604() {
  return __cxx_static_address_30a09cadc20eb68d8f777604.reference || (__cxx_static_address_30a09cadc20eb68d8f777604.reference = {
    __cReference: true,
    get value() { return E32_TILE5846____header_global_a9f21f88034d08b1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/network.h:180
export const cSnapshotMemUsage__header_global_4eeaff2f281b7537 = u64((BigInt(u64(64)) * BigInt((BigInt((BigInt((BigInt(72) * BigInt(u64(16384)))) + BigInt((BigInt(96) * BigInt(u64(4096)))))) + BigInt((BigInt(296) * BigInt(u64(16384))))))));
function __cxx_static_address_6d5ab7b518119726f814933b() {
  return __cxx_static_address_6d5ab7b518119726f814933b.reference || (__cxx_static_address_6d5ab7b518119726f814933b.reference = {
    __cReference: true,
    get value() { return cSnapshotMemUsage__header_global_4eeaff2f281b7537; },
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

// C/C++ source: source/duke3d/src/demo.cpp:32
export let g_firstDemoFile = new Uint8Array(256);
function __cxx_static_address_e1e2ae0b68cdf24dce090039() {
  return __cxx_static_address_e1e2ae0b68cdf24dce090039.reference || (__cxx_static_address_e1e2ae0b68cdf24dce090039.reference = {
    __cReference: true,
    get value() { return g_firstDemoFile; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/demo.cpp:34
export let g_demo_filePtr = null;
export function __cxx_global_cell_b8b854e6be4b2dfee7e6f10c() {
  return __cxx_global_cell_b8b854e6be4b2dfee7e6f10c.reference || (__cxx_global_cell_b8b854e6be4b2dfee7e6f10c.reference = {
    __cReference: true,
    get value() { return g_demo_filePtr; },
    set value(__cxx_lvalue_0) { g_demo_filePtr = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/duke3d/src/demo.cpp:35
export let g_demo_recFilePtr = i32((-1));
export function __cxx_global_cell_a4246fbb63a7ebf8507a32fa() {
  return __cxx_global_cell_a4246fbb63a7ebf8507a32fa.reference || (__cxx_global_cell_a4246fbb63a7ebf8507a32fa.reference = {
    __cReference: true,
    get value() { return g_demo_recFilePtr; },
    set value(__cxx_lvalue_0) { g_demo_recFilePtr = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/demo.cpp:37
export let g_demo_cnt = 0;
export function __cxx_global_cell_e17a5783e4d4a0690d42cb8d() {
  return __cxx_global_cell_e17a5783e4d4a0690d42cb8d.reference || (__cxx_global_cell_e17a5783e4d4a0690d42cb8d.reference = {
    __cReference: true,
    get value() { return g_demo_cnt; },
    set value(__cxx_lvalue_0) { g_demo_cnt = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/demo.cpp:38
export let g_demo_goalCnt = i32(0);
export function __cxx_global_cell_194a20c58cb0d264763d753a() {
  return __cxx_global_cell_194a20c58cb0d264763d753a.reference || (__cxx_global_cell_194a20c58cb0d264763d753a.reference = {
    __cReference: true,
    get value() { return g_demo_goalCnt; },
    set value(__cxx_lvalue_0) { g_demo_goalCnt = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/demo.cpp:39
export let g_demo_totalCnt = 0;
export function __cxx_global_cell_eea198be46bc9cb5e8151f37() {
  return __cxx_global_cell_eea198be46bc9cb5e8151f37.reference || (__cxx_global_cell_eea198be46bc9cb5e8151f37.reference = {
    __cReference: true,
    get value() { return g_demo_totalCnt; },
    set value(__cxx_lvalue_0) { g_demo_totalCnt = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/demo.cpp:40
export let g_demo_paused = i32(0);
export function __cxx_global_cell_1706d6be8764ff65e5d2b520() {
  return __cxx_global_cell_1706d6be8764ff65e5d2b520.reference || (__cxx_global_cell_1706d6be8764ff65e5d2b520.reference = {
    __cReference: true,
    get value() { return g_demo_paused; },
    set value(__cxx_lvalue_0) { g_demo_paused = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/demo.cpp:41
export let g_demo_rewind = i32(0);
export function __cxx_global_cell_7157dc4cde1be28b0bc353ed() {
  return __cxx_global_cell_7157dc4cde1be28b0bc353ed.reference || (__cxx_global_cell_7157dc4cde1be28b0bc353ed.reference = {
    __cReference: true,
    get value() { return g_demo_rewind; },
    set value(__cxx_lvalue_0) { g_demo_rewind = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/demo.cpp:42
export let g_demo_showStats = i32(1);
export function __cxx_global_cell_572a9517a61cbd2fcf5aabd2() {
  return __cxx_global_cell_572a9517a61cbd2fcf5aabd2.reference || (__cxx_global_cell_572a9517a61cbd2fcf5aabd2.reference = {
    __cReference: true,
    get value() { return g_demo_showStats; },
    set value(__cxx_lvalue_0) { g_demo_showStats = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/demo.cpp:43
export let g_demo_soundToggle = 0;
function __cxx_static_address_1c1fffd731c9c748ddfd41b7() {
  return __cxx_static_address_1c1fffd731c9c748ddfd41b7.reference || (__cxx_static_address_1c1fffd731c9c748ddfd41b7.reference = {
    __cReference: true,
    get value() { return g_demo_soundToggle; },
    set value(__cxx_lvalue_0) { g_demo_soundToggle = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/demo.cpp:45
export let demo_hasdiffs = 0;
function __cxx_static_address_d2c5fbea20b7291ab89bf916() {
  return __cxx_static_address_d2c5fbea20b7291ab89bf916.reference || (__cxx_static_address_d2c5fbea20b7291ab89bf916.reference = {
    __cReference: true,
    get value() { return demo_hasdiffs; },
    set value(__cxx_lvalue_0) { demo_hasdiffs = i32(__cxx_lvalue_0); }
  });
}

export let demorec_diffs = i32(1);
function __cxx_static_address_2c71ada6ebf0388217b09553() {
  return __cxx_static_address_2c71ada6ebf0388217b09553.reference || (__cxx_static_address_2c71ada6ebf0388217b09553.reference = {
    __cReference: true,
    get value() { return demorec_diffs; },
    set value(__cxx_lvalue_0) { demorec_diffs = i32(__cxx_lvalue_0); }
  });
}

export let demorec_difftics = i32(Math.imul(2, 30));
function __cxx_static_address_97e13823803c1a07011485cb() {
  return __cxx_static_address_97e13823803c1a07011485cb.reference || (__cxx_static_address_97e13823803c1a07011485cb.reference = {
    __cReference: true,
    get value() { return demorec_difftics; },
    set value(__cxx_lvalue_0) { demorec_difftics = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/demo.cpp:46
export let demoplay_diffs = i32(1);
export function __cxx_global_cell_43803137acd08e5114d80e1b() {
  return __cxx_global_cell_43803137acd08e5114d80e1b.reference || (__cxx_global_cell_43803137acd08e5114d80e1b.reference = {
    __cReference: true,
    get value() { return demoplay_diffs; },
    set value(__cxx_lvalue_0) { demoplay_diffs = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/demo.cpp:47
export let demorec_diffs_cvar = i32(1);
export function __cxx_global_cell_50eaf0218a1ce0c4b8a37808() {
  return __cxx_global_cell_50eaf0218a1ce0c4b8a37808.reference || (__cxx_global_cell_50eaf0218a1ce0c4b8a37808.reference = {
    __cReference: true,
    get value() { return demorec_diffs_cvar; },
    set value(__cxx_lvalue_0) { demorec_diffs_cvar = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/demo.cpp:48
export let demorec_force_cvar = i32(0);
export function __cxx_global_cell_df24cfa72a2ea1311d12400d() {
  return __cxx_global_cell_df24cfa72a2ea1311d12400d.reference || (__cxx_global_cell_df24cfa72a2ea1311d12400d.reference = {
    __cReference: true,
    get value() { return demorec_force_cvar; },
    set value(__cxx_lvalue_0) { demorec_force_cvar = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/demo.cpp:49
export let demorec_difftics_cvar = i32(Math.imul(2, 30));
export function __cxx_global_cell_7c040a74e1740a5d15b57ded() {
  return __cxx_global_cell_7c040a74e1740a5d15b57ded.reference || (__cxx_global_cell_7c040a74e1740a5d15b57ded.reference = {
    __cReference: true,
    get value() { return demorec_difftics_cvar; },
    set value(__cxx_lvalue_0) { demorec_difftics_cvar = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/demo.cpp:50
export let demorec_diffcompress_cvar = i32(1);
export function __cxx_global_cell_6541ffa3920cb7a0bd0f9874() {
  return __cxx_global_cell_6541ffa3920cb7a0bd0f9874.reference || (__cxx_global_cell_6541ffa3920cb7a0bd0f9874.reference = {
    __cReference: true,
    get value() { return demorec_diffcompress_cvar; },
    set value(__cxx_lvalue_0) { demorec_diffcompress_cvar = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/demo.cpp:51
export let demorec_synccompress_cvar = i32(1);
export function __cxx_global_cell_8db60f4bf0390fca0a5920d5() {
  return __cxx_global_cell_8db60f4bf0390fca0a5920d5.reference || (__cxx_global_cell_8db60f4bf0390fca0a5920d5.reference = {
    __cReference: true,
    get value() { return demorec_synccompress_cvar; },
    set value(__cxx_lvalue_0) { demorec_synccompress_cvar = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/demo.cpp:52
export let demorec_seeds_cvar = i32(1);
export function __cxx_global_cell_73803a726c6ce5f42c024a3b() {
  return __cxx_global_cell_73803a726c6ce5f42c024a3b.reference || (__cxx_global_cell_73803a726c6ce5f42c024a3b.reference = {
    __cReference: true,
    get value() { return demorec_seeds_cvar; },
    set value(__cxx_lvalue_0) { demorec_seeds_cvar = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/demo.cpp:53
export let demoplay_showsync = i32(1);
export function __cxx_global_cell_e34d9c47ac19ed2503d45a63() {
  return __cxx_global_cell_e34d9c47ac19ed2503d45a63.reference || (__cxx_global_cell_e34d9c47ac19ed2503d45a63.reference = {
    __cReference: true,
    get value() { return demoplay_showsync; },
    set value(__cxx_lvalue_0) { demoplay_showsync = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/demo.cpp:55
export let demo_synccompress = i32(1);
function __cxx_static_address_fc38bb6496c8a7b0b9bbe017() {
  return __cxx_static_address_fc38bb6496c8a7b0b9bbe017.reference || (__cxx_static_address_fc38bb6496c8a7b0b9bbe017.reference = {
    __cReference: true,
    get value() { return demo_synccompress; },
    set value(__cxx_lvalue_0) { demo_synccompress = i32(__cxx_lvalue_0); }
  });
}

export let demorec_seeds = i32(1);
function __cxx_static_address_eeeeee90004f361ef45e4b6c() {
  return __cxx_static_address_eeeeee90004f361ef45e4b6c.reference || (__cxx_static_address_eeeeee90004f361ef45e4b6c.reference = {
    __cReference: true,
    get value() { return demorec_seeds; },
    set value(__cxx_lvalue_0) { demorec_seeds = i32(__cxx_lvalue_0); }
  });
}

export let demo_hasseeds = 0;
function __cxx_static_address_f99f12c48d172f28deb53a54() {
  return __cxx_static_address_f99f12c48d172f28deb53a54.reference || (__cxx_static_address_f99f12c48d172f28deb53a54.reference = {
    __cReference: true,
    get value() { return demo_hasseeds; },
    set value(__cxx_lvalue_0) { demo_hasseeds = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_6efb2e3031671bdf = i32(2147483647);
function __cxx_static_address_4943c5a645fa1fefd414f39f() {
  return __cxx_static_address_4943c5a645fa1fefd414f39f.reference || (__cxx_static_address_4943c5a645fa1fefd414f39f.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_6efb2e3031671bdf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_eda4eaa8527ce872 = i32(2147483648);
function __cxx_static_address_3f6dc65c8196e9a742a2517f() {
  return __cxx_static_address_3f6dc65c8196e9a742a2517f.reference || (__cxx_static_address_3f6dc65c8196e9a742a2517f.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_eda4eaa8527ce872; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_33437ca0f64dd67d = i32(2147483648);
function __cxx_static_address_d6df2d2e1da073db3aa0c0b5() {
  return __cxx_static_address_d6df2d2e1da073db3aa0c0b5.reference || (__cxx_static_address_d6df2d2e1da073db3aa0c0b5.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_33437ca0f64dd67d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_414994489ef1aa73 = i32(65536);
function __cxx_static_address_59c803895b555ee4c10d9421() {
  return __cxx_static_address_59c803895b555ee4c10d9421.reference || (__cxx_static_address_59c803895b555ee4c10d9421.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_414994489ef1aa73; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_145ad5d475dfbbb4 = i32(32768);
function __cxx_static_address_ee09b9ce8223907e577ac718() {
  return __cxx_static_address_ee09b9ce8223907e577ac718.reference || (__cxx_static_address_ee09b9ce8223907e577ac718.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_145ad5d475dfbbb4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_e7a94f61221c4a1b = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_1e267cbf13ef1a085dacb817() {
  return __cxx_static_address_1e267cbf13ef1a085dacb817.reference || (__cxx_static_address_1e267cbf13ef1a085dacb817.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_e7a94f61221c4a1b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/demo.cpp:227
export let g_demo_playFirstFlag = 0;
function __cxx_static_address_011d86fa47307d3c9303af61() {
  return __cxx_static_address_011d86fa47307d3c9303af61.reference || (__cxx_static_address_011d86fa47307d3c9303af61.reference = {
    __cReference: true,
    get value() { return g_demo_playFirstFlag; },
    set value(__cxx_lvalue_0) { g_demo_playFirstFlag = i32(__cxx_lvalue_0); }
  });
}

export let g_demo_profile = 0;
function __cxx_static_address_79f6adc5fc1d12f365fba22e() {
  return __cxx_static_address_79f6adc5fc1d12f365fba22e.reference || (__cxx_static_address_79f6adc5fc1d12f365fba22e.reference = {
    __cReference: true,
    get value() { return g_demo_profile; },
    set value(__cxx_lvalue_0) { g_demo_profile = i32(__cxx_lvalue_0); }
  });
}

export let g_demo_stopProfile = 0;
function __cxx_static_address_456fb428622e93a857f2783e() {
  return __cxx_static_address_456fb428622e93a857f2783e.reference || (__cxx_static_address_456fb428622e93a857f2783e.reference = {
    __cReference: true,
    get value() { return g_demo_stopProfile; },
    set value(__cxx_lvalue_0) { g_demo_stopProfile = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/demo.cpp:228
export let g_demo_exitAfter = 0;
function __cxx_static_address_f32ba34a1fb723579e808905() {
  return __cxx_static_address_f32ba34a1fb723579e808905.reference || (__cxx_static_address_f32ba34a1fb723579e808905.reference = {
    __cReference: true,
    get value() { return g_demo_exitAfter; },
    set value(__cxx_lvalue_0) { g_demo_exitAfter = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/demo.cpp:229
export function Demo_PlayFirst(prof, exitafter) {
  (g_demo_playFirstFlag = i32(1));
  (g_demo_exitAfter = i32(exitafter));
  (prof >= 0);
  (g_demo_profile = i32((-prof)));
}

// C/C++ source: source/duke3d/src/demo.cpp:249
export let g_demo_seedbuf = new Uint8Array(2520);
function __cxx_static_address_1a1afaae10afa35b57057a03() {
  return __cxx_static_address_1a1afaae10afa35b57057a03.reference || (__cxx_static_address_1a1afaae10afa35b57057a03.reference = {
    __cReference: true,
    get value() { return g_demo_seedbuf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/demo.cpp:322
export let g_whichDemo = i32(1);
function __cxx_static_address_66ad2b12500007a9c9a94c69() {
  return __cxx_static_address_66ad2b12500007a9c9a94c69.reference || (__cxx_static_address_66ad2b12500007a9c9a94c69.reference = {
    __cReference: true,
    get value() { return g_whichDemo; },
    set value(__cxx_lvalue_0) { g_whichDemo = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/demo.cpp:378
export function Demo_IsProfiling() {
  return i32((g_demo_profile > 0));
}

// C/C++ source: source/duke3d/src/demo.cpp:383
export function Demo_StopProfiling() {
  (g_demo_stopProfile = i32(1));
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_709084bb2a919488 = new Uint8Array([((1) & 255), ((2) & 255), ((4) & 255), ((8) & 255), ((16) & 255), ((32) & 255), ((64) & 255), ((128) & 255)]);
function __cxx_static_address_f515cb9e0bc91c734a00e62e() {
  return __cxx_static_address_f515cb9e0bc91c734a00e62e.reference || (__cxx_static_address_f515cb9e0bc91c734a00e62e.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_709084bb2a919488; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:172
export const g_defaultVideoModes__header_global_030ba90488135946 = [cMarkAggregate(({"x": 2560, "y": 1440})), cMarkAggregate(({"x": 2560, "y": 1200})), cMarkAggregate(({"x": 2560, "y": 1080})), cMarkAggregate(({"x": 1920, "y": 1440})), cMarkAggregate(({"x": 1920, "y": 1200})), cMarkAggregate(({"x": 1920, "y": 1080})), cMarkAggregate(({"x": 1680, "y": 1050})), cMarkAggregate(({"x": 1600, "y": 1200})), cMarkAggregate(({"x": 1600, "y": 900})), cMarkAggregate(({"x": 1366, "y": 768})), cMarkAggregate(({"x": 1280, "y": 1024})), cMarkAggregate(({"x": 1280, "y": 960})), cMarkAggregate(({"x": 1280, "y": 720})), cMarkAggregate(({"x": 1152, "y": 864})), cMarkAggregate(({"x": 1024, "y": 768})), cMarkAggregate(({"x": 1024, "y": 600})), cMarkAggregate(({"x": 800, "y": 600})), cMarkAggregate(({"x": 640, "y": 480})), cMarkAggregate(({"x": 640, "y": 400})), cMarkAggregate(({"x": 512, "y": 384})), cMarkAggregate(({"x": 480, "y": 360})), cMarkAggregate(({"x": 400, "y": 300})), cMarkAggregate(({"x": 320, "y": 240})), cMarkAggregate(({"x": 320, "y": 200})), cMarkAggregate(({"x": 0, "y": 0}))];
function __cxx_static_address_87a6864a99c1c33c510e8d1e() {
  return __cxx_static_address_87a6864a99c1c33c510e8d1e.reference || (__cxx_static_address_87a6864a99c1c33c510e8d1e.reference = {
    __cReference: true,
    get value() { return g_defaultVideoModes__header_global_030ba90488135946; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:188
export const g_keyAsciiTable__header_global_e688f211dd367191 = new Uint8Array([((0) & 255), ((0) & 255), 49, 50, 51, 52, 53, 54, 55, 56, 57, 48, 45, 61, ((0) & 255), ((0) & 255), 113, 119, 101, 114, 116, 121, 117, 105, 111, 112, 91, 93, ((0) & 255), ((0) & 255), 97, 115, 100, 102, 103, 104, 106, 107, 108, 59, ((39) & 255), 96, ((0) & 255), ((92) & 255), 122, 120, 99, 118, 98, 110, 109, 44, 46, 47, ((0) & 255), 42, ((0) & 255), ((32) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255)]);
function __cxx_static_address_19dde211574d149adb82c1ee() {
  return __cxx_static_address_19dde211574d149adb82c1ee.reference || (__cxx_static_address_19dde211574d149adb82c1ee.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTable__header_global_e688f211dd367191; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:196
export const g_keyAsciiTableShift__header_global_a8bfb0b5c546b352 = new Uint8Array([((0) & 255), ((0) & 255), 33, 64, 35, 36, 37, 94, 38, 42, 40, 41, 95, 43, ((0) & 255), ((0) & 255), 81, 87, 69, 82, 84, 89, 85, 73, 79, 80, 123, 125, ((0) & 255), ((0) & 255), 65, 83, 68, 70, 71, 72, 74, 75, 76, 58, 34, 126, ((0) & 255), 124, 90, 88, 67, 86, 66, 78, 77, 60, 62, 63, ((0) & 255), 42, ((0) & 255), ((32) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255)]);
function __cxx_static_address_bd8c891845d149d5ba71899e() {
  return __cxx_static_address_bd8c891845d149d5ba71899e.reference || (__cxx_static_address_bd8c891845d149d5ba71899e.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTableShift__header_global_a8bfb0b5c546b352; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:895
export const pow2long__header_global_a0121316ee38e7b1 = new Int32Array([1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576, 2097152, 4194304, 8388608, 16777216, 33554432, 67108864, 134217728, 268435456, 536870912, 1073741824, 2147483647]);
function __cxx_static_address_fabd1999f435714d60074455() {
  return __cxx_static_address_fabd1999f435714d60074455.reference || (__cxx_static_address_fabd1999f435714d60074455.reference = {
    __cReference: true,
    get value() { return pow2long__header_global_a0121316ee38e7b1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:907
export const pow2ulong__header_global_504c8020fc3150ca = new Uint32Array([u32(1), u32(2), u32(4), u32(8), u32(16), u32(32), u32(64), u32(128), u32(256), u32(512), u32(1024), u32(2048), u32(4096), u32(8192), u32(16384), u32(32768), u32(65536), u32(131072), u32(262144), u32(524288), u32(1048576), u32(2097152), u32(4194304), u32(8388608), u32(16777216), u32(33554432), u32(67108864), u32(134217728), u32(268435456), u32(536870912), u32(1073741824), u32(2147483648n)]);
function __cxx_static_address_b090ba2858219a6bec1b4ccd() {
  return __cxx_static_address_b090ba2858219a6bec1b4ccd.reference || (__cxx_static_address_b090ba2858219a6bec1b4ccd.reference = {
    __cReference: true,
    get value() { return pow2ulong__header_global_504c8020fc3150ca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:919
export const pow264__header_global_453315ae820b7442 = new BigInt64Array([BigInt(i64(1)), BigInt(i64(2)), BigInt(i64(4)), BigInt(i64(8)), BigInt(i64(16)), BigInt(i64(32)), BigInt(i64(64)), BigInt(i64(128)), BigInt(i64(256)), BigInt(i64(512)), BigInt(i64(1024)), BigInt(i64(2048)), BigInt(i64(4096)), BigInt(i64(8192)), BigInt(i64(16384)), BigInt(i64(32768)), BigInt(i64(65536)), BigInt(i64(131072)), BigInt(i64(262144)), BigInt(i64(524288)), BigInt(i64(1048576)), BigInt(i64(2097152)), BigInt(i64(4194304)), BigInt(i64(8388608)), BigInt(i64(16777216)), BigInt(i64(33554432)), BigInt(i64(67108864)), BigInt(i64(134217728)), BigInt(i64(268435456)), BigInt(i64(536870912)), BigInt(i64(1073741824)), BigInt(2147483648n), BigInt(4294967296n), BigInt(8589934592n), BigInt(17179869184n), BigInt(34359738368n), BigInt(68719476736n), BigInt(137438953472n), BigInt(274877906944n), BigInt(549755813888n), BigInt(1099511627776n), BigInt(2199023255552n), BigInt(4398046511104n), BigInt(8796093022208n), BigInt(17592186044416n), BigInt(35184372088832n), BigInt(70368744177664n), BigInt(140737488355328n), BigInt(281474976710656n), BigInt(562949953421312n), BigInt(1125899906842624n), BigInt(2251799813685248n), BigInt(4503599627370496n), BigInt(9007199254740992n), BigInt(18014398509481984n), BigInt(36028797018963968n), BigInt(72057594037927936n), BigInt(144115188075855872n), BigInt(288230376151711744n), BigInt(576460752303423488n), BigInt(1152921504606846976n), BigInt(2305843009213693952n), BigInt(4611686018427387904n), BigInt(9223372036854775807n)]);
function __cxx_static_address_69b7789e5f3da9bf4c6cbb54() {
  return __cxx_static_address_69b7789e5f3da9bf4c6cbb54.reference || (__cxx_static_address_69b7789e5f3da9bf4c6cbb54.reference = {
    __cReference: true,
    get value() { return pow264__header_global_453315ae820b7442; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export function ARRAY_SIZE__header_ca0a16ad68c4(arg0) {
  return u64(512n);
}

export function SILENCE_UNUSED__header_83291bbed5a3(arg0, arg1) {

}

export function clamp__header_6a8ab3aa40d8(__cxx_in, min, max) {
  return i32(((__cxx_in <= i32(min)) ? i32(min) : ((__cxx_in >= i32(max)) ? i32(max) : __cxx_in)));
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

export function __cxx_operator_6d2a22ee5048dd1a(lhs, rhs) {
  return Boolean((!__cxx_operator_11a696315e969ab4(lhs, rhs)));
}
