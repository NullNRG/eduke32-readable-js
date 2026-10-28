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
// Original translation unit: source/duke3d/src/input.cpp
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
export const fix16_rad_to_deg_mult__header_global_742b71847767cafa = i32(3754936);
function __cxx_static_address_5459aeada55d6c2658b05303() {
  return __cxx_static_address_5459aeada55d6c2658b05303.reference || (__cxx_static_address_5459aeada55d6c2658b05303.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_742b71847767cafa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_05b4e22acc8d54f5 = i32(1144);
function __cxx_static_address_f685a94cd66ec8f27fa0fba9() {
  return __cxx_static_address_f685a94cd66ec8f27fa0fba9.reference || (__cxx_static_address_f685a94cd66ec8f27fa0fba9.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_05b4e22acc8d54f5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:43
export const KICK_HIT____header_global_538629fbe264a599 = ((((((0) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0fa27cf992412f41cd7a57e8() {
  return __cxx_static_address_0fa27cf992412f41cd7a57e8.reference || (__cxx_static_address_0fa27cf992412f41cd7a57e8.reference = {
    __cReference: true,
    get value() { return KICK_HIT____header_global_538629fbe264a599; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:44
export const PISTOL_RICOCHET____header_global_c3b98bbd791803e1 = ((((((1) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4fa35522705cd723335692f7() {
  return __cxx_static_address_4fa35522705cd723335692f7.reference || (__cxx_static_address_4fa35522705cd723335692f7.reference = {
    __cReference: true,
    get value() { return PISTOL_RICOCHET____header_global_c3b98bbd791803e1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:45
export const PISTOL_BODYHIT____header_global_833772140557f15d = ((((((2) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2ddde3aab741a3ec3290b74d() {
  return __cxx_static_address_2ddde3aab741a3ec3290b74d.reference || (__cxx_static_address_2ddde3aab741a3ec3290b74d.reference = {
    __cReference: true,
    get value() { return PISTOL_BODYHIT____header_global_833772140557f15d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:46
export const PISTOL_FIRE____header_global_658ae716abeaa708 = ((((((3) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_92b42fe19390271694bbf5e5() {
  return __cxx_static_address_92b42fe19390271694bbf5e5.reference || (__cxx_static_address_92b42fe19390271694bbf5e5.reference = {
    __cReference: true,
    get value() { return PISTOL_FIRE____header_global_658ae716abeaa708; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:47
export const EJECT_CLIP____header_global_abd5819092050c54 = ((((((4) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2e77121c7e483964f0349f2f() {
  return __cxx_static_address_2e77121c7e483964f0349f2f.reference || (__cxx_static_address_2e77121c7e483964f0349f2f.reference = {
    __cReference: true,
    get value() { return EJECT_CLIP____header_global_abd5819092050c54; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:48
export const INSERT_CLIP____header_global_17832258d5a647ed = ((((((5) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b3c79943c2a6dc5fd0709401() {
  return __cxx_static_address_b3c79943c2a6dc5fd0709401.reference || (__cxx_static_address_b3c79943c2a6dc5fd0709401.reference = {
    __cReference: true,
    get value() { return INSERT_CLIP____header_global_17832258d5a647ed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:49
export const CHAINGUN_FIRE____header_global_ed458689dadbcbde = ((((((6) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_027c79bef61cbfe8cb5e4fd4() {
  return __cxx_static_address_027c79bef61cbfe8cb5e4fd4.reference || (__cxx_static_address_027c79bef61cbfe8cb5e4fd4.reference = {
    __cReference: true,
    get value() { return CHAINGUN_FIRE____header_global_ed458689dadbcbde; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:50
export const RPG_SHOOT____header_global_89ce2256f6dedc6e = ((((((7) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_28d45fba6bac615d5b92396a() {
  return __cxx_static_address_28d45fba6bac615d5b92396a.reference || (__cxx_static_address_28d45fba6bac615d5b92396a.reference = {
    __cReference: true,
    get value() { return RPG_SHOOT____header_global_89ce2256f6dedc6e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:51
export const POOLBALLHIT____header_global_17ee5d2078134d6a = ((((((8) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_339cd872cc1da8597cbadaac() {
  return __cxx_static_address_339cd872cc1da8597cbadaac.reference || (__cxx_static_address_339cd872cc1da8597cbadaac.reference = {
    __cReference: true,
    get value() { return POOLBALLHIT____header_global_17ee5d2078134d6a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:52
export const RPG_EXPLODE____header_global_5d0148e24333b213 = ((((((9) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3fc7e7ab176df1ffbce91c0c() {
  return __cxx_static_address_3fc7e7ab176df1ffbce91c0c.reference || (__cxx_static_address_3fc7e7ab176df1ffbce91c0c.reference = {
    __cReference: true,
    get value() { return RPG_EXPLODE____header_global_5d0148e24333b213; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:53
export const CAT_FIRE____header_global_f8586b70861d0d0c = ((((((10) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dae54a4f97431d7bf6f445e9() {
  return __cxx_static_address_dae54a4f97431d7bf6f445e9.reference || (__cxx_static_address_dae54a4f97431d7bf6f445e9.reference = {
    __cReference: true,
    get value() { return CAT_FIRE____header_global_f8586b70861d0d0c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:54
export const SHRINKER_FIRE____header_global_565d475ac8b35f50 = ((((((11) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e91857bd2be0d1739b5cec78() {
  return __cxx_static_address_e91857bd2be0d1739b5cec78.reference || (__cxx_static_address_e91857bd2be0d1739b5cec78.reference = {
    __cReference: true,
    get value() { return SHRINKER_FIRE____header_global_565d475ac8b35f50; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:55
export const PIPEBOMB_BOUNCE____header_global_16ede71876fa0742 = ((((((13) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5ed1d78af20222903d352190() {
  return __cxx_static_address_5ed1d78af20222903d352190.reference || (__cxx_static_address_5ed1d78af20222903d352190.reference = {
    __cReference: true,
    get value() { return PIPEBOMB_BOUNCE____header_global_16ede71876fa0742; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:56
export const PIPEBOMB_EXPLODE____header_global_40d035bce3c7cffd = ((((((14) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5b468e85303e5a5022d22394() {
  return __cxx_static_address_5b468e85303e5a5022d22394.reference || (__cxx_static_address_5b468e85303e5a5022d22394.reference = {
    __cReference: true,
    get value() { return PIPEBOMB_EXPLODE____header_global_40d035bce3c7cffd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:57
export const LASERTRIP_ONWALL____header_global_64d06cdabc30bfe9 = ((((((15) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5ac212261b5785c79b45cd35() {
  return __cxx_static_address_5ac212261b5785c79b45cd35.reference || (__cxx_static_address_5ac212261b5785c79b45cd35.reference = {
    __cReference: true,
    get value() { return LASERTRIP_ONWALL____header_global_64d06cdabc30bfe9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:58
export const LASERTRIP_ARMING____header_global_711e0094e962a68a = ((((((16) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ac8c6d3e9eb0b5d37c75dd12() {
  return __cxx_static_address_ac8c6d3e9eb0b5d37c75dd12.reference || (__cxx_static_address_ac8c6d3e9eb0b5d37c75dd12.reference = {
    __cReference: true,
    get value() { return LASERTRIP_ARMING____header_global_711e0094e962a68a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:59
export const LASERTRIP_EXPLODE____header_global_28c8c714c6f4eb1c = ((((((17) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_336f21fd80085764330c4447() {
  return __cxx_static_address_336f21fd80085764330c4447.reference || (__cxx_static_address_336f21fd80085764330c4447.reference = {
    __cReference: true,
    get value() { return LASERTRIP_EXPLODE____header_global_28c8c714c6f4eb1c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:60
export const VENT_BUST____header_global_f50172b2e4f282e9 = ((((((18) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_18d740e7c0a582979c14b24a() {
  return __cxx_static_address_18d740e7c0a582979c14b24a.reference || (__cxx_static_address_18d740e7c0a582979c14b24a.reference = {
    __cReference: true,
    get value() { return VENT_BUST____header_global_f50172b2e4f282e9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:61
export const GLASS_BREAKING____header_global_327b751c933fb633 = ((((((19) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_df5b259440eb93b6b346793b() {
  return __cxx_static_address_df5b259440eb93b6b346793b.reference || (__cxx_static_address_df5b259440eb93b6b346793b.reference = {
    __cReference: true,
    get value() { return GLASS_BREAKING____header_global_327b751c933fb633; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:62
export const GLASS_HEAVYBREAK____header_global_5417abe39c5fb9ab = ((((((20) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2a0d1a7eac472a4affd474bc() {
  return __cxx_static_address_2a0d1a7eac472a4affd474bc.reference || (__cxx_static_address_2a0d1a7eac472a4affd474bc.reference = {
    __cReference: true,
    get value() { return GLASS_HEAVYBREAK____header_global_5417abe39c5fb9ab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:63
export const SHORT_CIRCUIT____header_global_74e120ca60c5e8c0 = ((((((21) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7d36a2b62796de6b8e37f190() {
  return __cxx_static_address_7d36a2b62796de6b8e37f190.reference || (__cxx_static_address_7d36a2b62796de6b8e37f190.reference = {
    __cReference: true,
    get value() { return SHORT_CIRCUIT____header_global_74e120ca60c5e8c0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:64
export const ITEM_SPLASH____header_global_8a499104b896e356 = ((((((22) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6266dae27d053b5a08da4c4f() {
  return __cxx_static_address_6266dae27d053b5a08da4c4f.reference || (__cxx_static_address_6266dae27d053b5a08da4c4f.reference = {
    __cReference: true,
    get value() { return ITEM_SPLASH____header_global_8a499104b896e356; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:65
export const DUKE_GASP____header_global_b388044e75e07215 = ((((((25) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c5fca4d79280654b6b601267() {
  return __cxx_static_address_c5fca4d79280654b6b601267.reference || (__cxx_static_address_c5fca4d79280654b6b601267.reference = {
    __cReference: true,
    get value() { return DUKE_GASP____header_global_b388044e75e07215; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:66
export const SLIM_RECOG____header_global_06ef26c73c8962bb = ((((((26) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4d7f9920a3a8b39386c6b67e() {
  return __cxx_static_address_4d7f9920a3a8b39386c6b67e.reference || (__cxx_static_address_4d7f9920a3a8b39386c6b67e.reference = {
    __cReference: true,
    get value() { return SLIM_RECOG____header_global_06ef26c73c8962bb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:67
export const DUKE_URINATE____header_global_760f4b559bd996bb = ((((((28) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_181e1b8942799c5ca8d6b047() {
  return __cxx_static_address_181e1b8942799c5ca8d6b047.reference || (__cxx_static_address_181e1b8942799c5ca8d6b047.reference = {
    __cReference: true,
    get value() { return DUKE_URINATE____header_global_760f4b559bd996bb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:68
export const ENDSEQVOL3SND2____header_global_55f7ed464775fdb3 = ((((((29) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_48523e97400fcba1b0658eac() {
  return __cxx_static_address_48523e97400fcba1b0658eac.reference || (__cxx_static_address_48523e97400fcba1b0658eac.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND2____header_global_55f7ed464775fdb3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:69
export const ENDSEQVOL3SND3____header_global_7837cbb92517b7a3 = ((((((30) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_259ac7b243f409f6cbcbfe96() {
  return __cxx_static_address_259ac7b243f409f6cbcbfe96.reference || (__cxx_static_address_259ac7b243f409f6cbcbfe96.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND3____header_global_7837cbb92517b7a3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:70
export const DUKE_CRACK____header_global_509d1ff2434b940b = ((((((33) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f438e72f27de10c531ceaaac() {
  return __cxx_static_address_f438e72f27de10c531ceaaac.reference || (__cxx_static_address_f438e72f27de10c531ceaaac.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK____header_global_509d1ff2434b940b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:71
export const SLIM_ATTACK____header_global_1729e0918cf021cc = ((((((34) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b090072158e18eb2db7e39de() {
  return __cxx_static_address_b090072158e18eb2db7e39de.reference || (__cxx_static_address_b090072158e18eb2db7e39de.reference = {
    __cReference: true,
    get value() { return SLIM_ATTACK____header_global_1729e0918cf021cc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:72
export const SOMETHINGHITFORCE____header_global_be8871209933ba82 = ((((((35) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a1354fe2d8373c2ec80cb29f() {
  return __cxx_static_address_a1354fe2d8373c2ec80cb29f.reference || (__cxx_static_address_a1354fe2d8373c2ec80cb29f.reference = {
    __cReference: true,
    get value() { return SOMETHINGHITFORCE____header_global_be8871209933ba82; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:73
export const DUKE_DRINKING____header_global_fb242dc0e4220cbc = ((((((36) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_003e4588412f4f2eb10f67ae() {
  return __cxx_static_address_003e4588412f4f2eb10f67ae.reference || (__cxx_static_address_003e4588412f4f2eb10f67ae.reference = {
    __cReference: true,
    get value() { return DUKE_DRINKING____header_global_fb242dc0e4220cbc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:74
export const DUKE_GRUNT____header_global_e00ad5dc5dd12a33 = ((((((38) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_36656bd239bfbe3976752450() {
  return __cxx_static_address_36656bd239bfbe3976752450.reference || (__cxx_static_address_36656bd239bfbe3976752450.reference = {
    __cReference: true,
    get value() { return DUKE_GRUNT____header_global_e00ad5dc5dd12a33; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:75
export const DUKE_HARTBEAT____header_global_86954d093aba2a8a = ((((((39) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_794dfc94cb4d7cd2424b6e52() {
  return __cxx_static_address_794dfc94cb4d7cd2424b6e52.reference || (__cxx_static_address_794dfc94cb4d7cd2424b6e52.reference = {
    __cReference: true,
    get value() { return DUKE_HARTBEAT____header_global_86954d093aba2a8a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:76
export const DUKE_ONWATER____header_global_b8fa44f2234f9d50 = ((((((40) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b3a2a55eb54e098ff33996d3() {
  return __cxx_static_address_b3a2a55eb54e098ff33996d3.reference || (__cxx_static_address_b3a2a55eb54e098ff33996d3.reference = {
    __cReference: true,
    get value() { return DUKE_ONWATER____header_global_b8fa44f2234f9d50; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:77
export const DUKE_LAND____header_global_7bcf624b786e4869 = ((((((42) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fda53e08975e4e33c7d96c08() {
  return __cxx_static_address_fda53e08975e4e33c7d96c08.reference || (__cxx_static_address_fda53e08975e4e33c7d96c08.reference = {
    __cReference: true,
    get value() { return DUKE_LAND____header_global_7bcf624b786e4869; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:78
export const DUKE_WALKINDUCTS____header_global_ee520833f3cb4c99 = ((((((43) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f5eb01e53ea0d41166b1fe8c() {
  return __cxx_static_address_f5eb01e53ea0d41166b1fe8c.reference || (__cxx_static_address_f5eb01e53ea0d41166b1fe8c.reference = {
    __cReference: true,
    get value() { return DUKE_WALKINDUCTS____header_global_ee520833f3cb4c99; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:79
export const DUKE_UNDERWATER____header_global_001ef2593eaf09fa = ((((((48) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4d26bbaa57583d9c554ebb12() {
  return __cxx_static_address_4d26bbaa57583d9c554ebb12.reference || (__cxx_static_address_4d26bbaa57583d9c554ebb12.reference = {
    __cReference: true,
    get value() { return DUKE_UNDERWATER____header_global_001ef2593eaf09fa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:80
export const DUKE_JETPACK_ON____header_global_0316a23b7a1d4e2d = ((((((49) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_31e2088cec0cd441bc9788fe() {
  return __cxx_static_address_31e2088cec0cd441bc9788fe.reference || (__cxx_static_address_31e2088cec0cd441bc9788fe.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_ON____header_global_0316a23b7a1d4e2d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:81
export const DUKE_JETPACK_IDLE____header_global_d40dbd9934d487c9 = ((((((50) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dce5f410701d82d88f53e265() {
  return __cxx_static_address_dce5f410701d82d88f53e265.reference || (__cxx_static_address_dce5f410701d82d88f53e265.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_IDLE____header_global_d40dbd9934d487c9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:82
export const DUKE_JETPACK_OFF____header_global_6a30a59f45db1aea = ((((((51) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2a4c0f997614378a736b9c6f() {
  return __cxx_static_address_2a4c0f997614378a736b9c6f.reference || (__cxx_static_address_2a4c0f997614378a736b9c6f.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_OFF____header_global_6a30a59f45db1aea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:83
export const DUKETALKTOBOSS____header_global_7a8a7a40fd1de8a4 = ((((((56) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_23c4fd49933997d554754f8c() {
  return __cxx_static_address_23c4fd49933997d554754f8c.reference || (__cxx_static_address_23c4fd49933997d554754f8c.reference = {
    __cReference: true,
    get value() { return DUKETALKTOBOSS____header_global_7a8a7a40fd1de8a4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:84
export const SQUISHED____header_global_457a3d5e7ef8f10f = ((((((69) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d8c548e94393f963c11451cc() {
  return __cxx_static_address_d8c548e94393f963c11451cc.reference || (__cxx_static_address_d8c548e94393f963c11451cc.reference = {
    __cReference: true,
    get value() { return SQUISHED____header_global_457a3d5e7ef8f10f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:85
export const TELEPORTER____header_global_75cff44230238c33 = ((((((70) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e74a5ed7c0c8bed14943ff99() {
  return __cxx_static_address_e74a5ed7c0c8bed14943ff99.reference || (__cxx_static_address_e74a5ed7c0c8bed14943ff99.reference = {
    __cReference: true,
    get value() { return TELEPORTER____header_global_75cff44230238c33; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:86
export const ELEVATOR_ON____header_global_0b3b89074b81191f = ((((((71) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8bdfb6ad82f75156e56977be() {
  return __cxx_static_address_8bdfb6ad82f75156e56977be.reference || (__cxx_static_address_8bdfb6ad82f75156e56977be.reference = {
    __cReference: true,
    get value() { return ELEVATOR_ON____header_global_0b3b89074b81191f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:87
export const ELEVATOR_OFF____header_global_f2908bc329e4b19d = ((((((73) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_21c358d69f339e95b9d24ccd() {
  return __cxx_static_address_21c358d69f339e95b9d24ccd.reference || (__cxx_static_address_21c358d69f339e95b9d24ccd.reference = {
    __cReference: true,
    get value() { return ELEVATOR_OFF____header_global_f2908bc329e4b19d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:88
export const SUBWAY____header_global_52838c77dc02eeef = ((((((75) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_56326fc132de21b212c3cd3a() {
  return __cxx_static_address_56326fc132de21b212c3cd3a.reference || (__cxx_static_address_56326fc132de21b212c3cd3a.reference = {
    __cReference: true,
    get value() { return SUBWAY____header_global_52838c77dc02eeef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:89
export const SWITCH_ON____header_global_e90c06cfd21d2915 = ((((((76) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c29bf444733ec858053b3ec7() {
  return __cxx_static_address_c29bf444733ec858053b3ec7.reference || (__cxx_static_address_c29bf444733ec858053b3ec7.reference = {
    __cReference: true,
    get value() { return SWITCH_ON____header_global_e90c06cfd21d2915; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:90
export const FLUSH_TOILET____header_global_35df08bee8abe9dc = ((((((79) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8c9331105ef2656c18564395() {
  return __cxx_static_address_8c9331105ef2656c18564395.reference || (__cxx_static_address_8c9331105ef2656c18564395.reference = {
    __cReference: true,
    get value() { return FLUSH_TOILET____header_global_35df08bee8abe9dc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:91
export const EARTHQUAKE____header_global_329644f7db234fb4 = ((((((81) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1c5cd6073ef645bc5cd7d6c4() {
  return __cxx_static_address_1c5cd6073ef645bc5cd7d6c4.reference || (__cxx_static_address_1c5cd6073ef645bc5cd7d6c4.reference = {
    __cReference: true,
    get value() { return EARTHQUAKE____header_global_329644f7db234fb4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:92
export const END_OF_LEVEL_WARN____header_global_3d1e4a910985182a = ((((((83) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2eeb67806e550791fc4f7617() {
  return __cxx_static_address_2eeb67806e550791fc4f7617.reference || (__cxx_static_address_2eeb67806e550791fc4f7617.reference = {
    __cReference: true,
    get value() { return END_OF_LEVEL_WARN____header_global_3d1e4a910985182a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:93
export const WIND_AMBIENCE____header_global_31aba41f760c112f = ((((((91) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6dc4ab6efc7d0d0ce5f14dd0() {
  return __cxx_static_address_6dc4ab6efc7d0d0ce5f14dd0.reference || (__cxx_static_address_6dc4ab6efc7d0d0ce5f14dd0.reference = {
    __cReference: true,
    get value() { return WIND_AMBIENCE____header_global_31aba41f760c112f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:94
export const SOMETHING_DRIPPING____header_global_a35f1700b07d36c2 = ((((((92) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2f63e1c2f23086986ad91f22() {
  return __cxx_static_address_2f63e1c2f23086986ad91f22.reference || (__cxx_static_address_2f63e1c2f23086986ad91f22.reference = {
    __cReference: true,
    get value() { return SOMETHING_DRIPPING____header_global_a35f1700b07d36c2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:95
export const BOS1_RECOG____header_global_c4360a3210d73133 = ((((((97) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d50d6f88061bc1c6e6c53ff5() {
  return __cxx_static_address_d50d6f88061bc1c6e6c53ff5.reference || (__cxx_static_address_d50d6f88061bc1c6e6c53ff5.reference = {
    __cReference: true,
    get value() { return BOS1_RECOG____header_global_c4360a3210d73133; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:96
export const BOS2_RECOG____header_global_425046da6ad0fa38 = ((((((102) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_193e325ccdae4b5399111334() {
  return __cxx_static_address_193e325ccdae4b5399111334.reference || (__cxx_static_address_193e325ccdae4b5399111334.reference = {
    __cReference: true,
    get value() { return BOS2_RECOG____header_global_425046da6ad0fa38; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:97
export const DUKE_GETWEAPON2____header_global_fed25d0d0161167e = ((((((107) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b7cbece341ccf04fb46b6da3() {
  return __cxx_static_address_b7cbece341ccf04fb46b6da3.reference || (__cxx_static_address_b7cbece341ccf04fb46b6da3.reference = {
    __cReference: true,
    get value() { return DUKE_GETWEAPON2____header_global_fed25d0d0161167e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:98
export const SHOTGUN_FIRE____header_global_7311568ea936aaf5 = ((((((109) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c801699bcf12f78065510a01() {
  return __cxx_static_address_c801699bcf12f78065510a01.reference || (__cxx_static_address_c801699bcf12f78065510a01.reference = {
    __cReference: true,
    get value() { return SHOTGUN_FIRE____header_global_7311568ea936aaf5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:99
export const PRED_RECOG____header_global_56eed35ff3eccb9a = ((((((111) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a2e62e599e11014de9b96f2a() {
  return __cxx_static_address_a2e62e599e11014de9b96f2a.reference || (__cxx_static_address_a2e62e599e11014de9b96f2a.reference = {
    __cReference: true,
    get value() { return PRED_RECOG____header_global_56eed35ff3eccb9a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:100
export const CAPT_RECOG____header_global_8ce24ba6cc95d842 = ((((((117) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d4577085d560c3e529529c23() {
  return __cxx_static_address_d4577085d560c3e529529c23.reference || (__cxx_static_address_d4577085d560c3e529529c23.reference = {
    __cReference: true,
    get value() { return CAPT_RECOG____header_global_8ce24ba6cc95d842; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:101
export const PIG_RECOG____header_global_f1f4eb45fa8fcea5 = ((((((121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_595ceb4c3f8be94de2dc3aa7() {
  return __cxx_static_address_595ceb4c3f8be94de2dc3aa7.reference || (__cxx_static_address_595ceb4c3f8be94de2dc3aa7.reference = {
    __cReference: true,
    get value() { return PIG_RECOG____header_global_f1f4eb45fa8fcea5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:102
export const RECO_ROAM____header_global_9cd08d2680fbb67d = ((((((125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_25254e37e6ce01b2e866a9dc() {
  return __cxx_static_address_25254e37e6ce01b2e866a9dc.reference || (__cxx_static_address_25254e37e6ce01b2e866a9dc.reference = {
    __cReference: true,
    get value() { return RECO_ROAM____header_global_9cd08d2680fbb67d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:103
export const RECO_RECOG____header_global_2b2afadd4763e11c = ((((((126) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e7cbdd31407378c31b71c7a8() {
  return __cxx_static_address_e7cbdd31407378c31b71c7a8.reference || (__cxx_static_address_e7cbdd31407378c31b71c7a8.reference = {
    __cReference: true,
    get value() { return RECO_RECOG____header_global_2b2afadd4763e11c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:104
export const RECO_ATTACK____header_global_42e2e92f7e73b2ea = ((((((127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_597fe19ee85354ecf9db34f6() {
  return __cxx_static_address_597fe19ee85354ecf9db34f6.reference || (__cxx_static_address_597fe19ee85354ecf9db34f6.reference = {
    __cReference: true,
    get value() { return RECO_ATTACK____header_global_42e2e92f7e73b2ea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:105
export const RECO_PAIN____header_global_cf971d591084a04b = ((((((128) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4349f74edb0fbd8afcdcae6f() {
  return __cxx_static_address_4349f74edb0fbd8afcdcae6f.reference || (__cxx_static_address_4349f74edb0fbd8afcdcae6f.reference = {
    __cReference: true,
    get value() { return RECO_PAIN____header_global_cf971d591084a04b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:106
export const DRON_RECOG____header_global_ef09ba5f4961369a = ((((((131) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_85aaea1c2fe28d53013e4bb9() {
  return __cxx_static_address_85aaea1c2fe28d53013e4bb9.reference || (__cxx_static_address_85aaea1c2fe28d53013e4bb9.reference = {
    __cReference: true,
    get value() { return DRON_RECOG____header_global_ef09ba5f4961369a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:107
export const COMM_RECOG____header_global_0f3d1267956dfa93 = ((((((136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0b0521d1c4e6ef27fd62f0c2() {
  return __cxx_static_address_0b0521d1c4e6ef27fd62f0c2.reference || (__cxx_static_address_0b0521d1c4e6ef27fd62f0c2.reference = {
    __cReference: true,
    get value() { return COMM_RECOG____header_global_0f3d1267956dfa93; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:108
export const OCTA_RECOG____header_global_044416eae4095492 = ((((((141) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_451cddda14c41157d4acb536() {
  return __cxx_static_address_451cddda14c41157d4acb536.reference || (__cxx_static_address_451cddda14c41157d4acb536.reference = {
    __cReference: true,
    get value() { return OCTA_RECOG____header_global_044416eae4095492; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:109
export const TURR_RECOG____header_global_5d92a8675414d509 = ((((((146) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cbe2ffd4fd1b402930b339ba() {
  return __cxx_static_address_cbe2ffd4fd1b402930b339ba.reference || (__cxx_static_address_cbe2ffd4fd1b402930b339ba.reference = {
    __cReference: true,
    get value() { return TURR_RECOG____header_global_5d92a8675414d509; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:110
export const SLIM_DYING____header_global_6b82bcb8bb9188e1 = ((((((149) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_baeb5d0a3ef6cd3a1566ce04() {
  return __cxx_static_address_baeb5d0a3ef6cd3a1566ce04.reference || (__cxx_static_address_baeb5d0a3ef6cd3a1566ce04.reference = {
    __cReference: true,
    get value() { return SLIM_DYING____header_global_6b82bcb8bb9188e1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:111
export const BOS3_RECOG____header_global_eae5c9adef0433d6 = ((((((151) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1c4f6c3db6e3d7b226026b25() {
  return __cxx_static_address_1c4f6c3db6e3d7b226026b25.reference || (__cxx_static_address_1c4f6c3db6e3d7b226026b25.reference = {
    __cReference: true,
    get value() { return BOS3_RECOG____header_global_eae5c9adef0433d6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:112
export const BOS1_WALK____header_global_8e503bc233079cac = ((((((156) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3a6394681670238689d885ca() {
  return __cxx_static_address_3a6394681670238689d885ca.reference || (__cxx_static_address_3a6394681670238689d885ca.reference = {
    __cReference: true,
    get value() { return BOS1_WALK____header_global_8e503bc233079cac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:113
export const THUD____header_global_bc5d7040b092bd6a = ((((((158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fd78958edfa1cc5cba537b6e() {
  return __cxx_static_address_fd78958edfa1cc5cba537b6e.reference || (__cxx_static_address_fd78958edfa1cc5cba537b6e.reference = {
    __cReference: true,
    get value() { return THUD____header_global_bc5d7040b092bd6a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:114
export const WIERDSHOT_FLY____header_global_01e016d3546bdac9 = ((((((160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fd444edb38f057fd4702c901() {
  return __cxx_static_address_fd444edb38f057fd4702c901.reference || (__cxx_static_address_fd444edb38f057fd4702c901.reference = {
    __cReference: true,
    get value() { return WIERDSHOT_FLY____header_global_01e016d3546bdac9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:115
export const SLIM_ROAM____header_global_95cfa908f6ea2847 = ((((((163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5a1f932cc464765c8859ef19() {
  return __cxx_static_address_5a1f932cc464765c8859ef19.reference || (__cxx_static_address_5a1f932cc464765c8859ef19.reference = {
    __cReference: true,
    get value() { return SLIM_ROAM____header_global_95cfa908f6ea2847; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:116
export const SHOTGUN_COCK____header_global_f03bb0786f3d46c7 = ((((((169) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1a38240b378cff7b77913f8b() {
  return __cxx_static_address_1a38240b378cff7b77913f8b.reference || (__cxx_static_address_1a38240b378cff7b77913f8b.reference = {
    __cReference: true,
    get value() { return SHOTGUN_COCK____header_global_f03bb0786f3d46c7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:117
export const GENERIC_AMBIENCE17____header_global_f40725dd344d317e = ((((((177) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0f875f6f08266f0a242f4810() {
  return __cxx_static_address_0f875f6f08266f0a242f4810.reference || (__cxx_static_address_0f875f6f08266f0a242f4810.reference = {
    __cReference: true,
    get value() { return GENERIC_AMBIENCE17____header_global_f40725dd344d317e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:118
export const BONUS_SPEECH1____header_global_42f448657dad5bb6 = ((((((195) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7522d87438204d7875b4a6e2() {
  return __cxx_static_address_7522d87438204d7875b4a6e2.reference || (__cxx_static_address_7522d87438204d7875b4a6e2.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH1____header_global_42f448657dad5bb6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:119
export const BONUS_SPEECH2____header_global_c398db050dd6a893 = ((((((196) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_83b500d154f46b5e19f2c462() {
  return __cxx_static_address_83b500d154f46b5e19f2c462.reference || (__cxx_static_address_83b500d154f46b5e19f2c462.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH2____header_global_c398db050dd6a893; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:120
export const BONUS_SPEECH3____header_global_c6c17ff293123951 = ((((((197) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9e80ec34fd7707e6947f6b2f() {
  return __cxx_static_address_9e80ec34fd7707e6947f6b2f.reference || (__cxx_static_address_9e80ec34fd7707e6947f6b2f.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH3____header_global_c6c17ff293123951; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:121
export const BONUS_SPEECH4____header_global_b7ca817ef0049023 = ((((((199) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c3775997d063e2d94d407f2d() {
  return __cxx_static_address_c3775997d063e2d94d407f2d.reference || (__cxx_static_address_c3775997d063e2d94d407f2d.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH4____header_global_b7ca817ef0049023; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:122
export const DUKE_LAND_HURT____header_global_5c03558f9a0d02ab = ((((((200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8ed9791164e45cdf67528091() {
  return __cxx_static_address_8ed9791164e45cdf67528091.reference || (__cxx_static_address_8ed9791164e45cdf67528091.reference = {
    __cReference: true,
    get value() { return DUKE_LAND_HURT____header_global_5c03558f9a0d02ab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:123
export const DUKE_SEARCH2____header_global_aa57094063c274d3 = ((((((207) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9438c2aaec976b9a549dd5ef() {
  return __cxx_static_address_9438c2aaec976b9a549dd5ef.reference || (__cxx_static_address_9438c2aaec976b9a549dd5ef.reference = {
    __cReference: true,
    get value() { return DUKE_SEARCH2____header_global_aa57094063c274d3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:124
export const DUKE_CRACK2____header_global_76294cc4ffbfc499 = ((((((208) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d6f75d977a5813c965f987a7() {
  return __cxx_static_address_d6f75d977a5813c965f987a7.reference || (__cxx_static_address_d6f75d977a5813c965f987a7.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK2____header_global_76294cc4ffbfc499; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:125
export const DUKE_SEARCH____header_global_c80b0d77cca7f5bc = ((((((209) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aef1eda49edbf645a517a24d() {
  return __cxx_static_address_aef1eda49edbf645a517a24d.reference || (__cxx_static_address_aef1eda49edbf645a517a24d.reference = {
    __cReference: true,
    get value() { return DUKE_SEARCH____header_global_c80b0d77cca7f5bc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:126
export const DUKE_GET____header_global_9543ce2df70e24b5 = ((((((210) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aca4499c6a49dd27077461a6() {
  return __cxx_static_address_aca4499c6a49dd27077461a6.reference || (__cxx_static_address_aca4499c6a49dd27077461a6.reference = {
    __cReference: true,
    get value() { return DUKE_GET____header_global_9543ce2df70e24b5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:127
export const DUKE_LONGTERM_PAIN____header_global_74eb507fb94d8dec = ((((((211) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9c17617abc2a578b519d41be() {
  return __cxx_static_address_9c17617abc2a578b519d41be.reference || (__cxx_static_address_9c17617abc2a578b519d41be.reference = {
    __cReference: true,
    get value() { return DUKE_LONGTERM_PAIN____header_global_74eb507fb94d8dec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:128
export const MONITOR_ACTIVE____header_global_5d614270a11d3c0e = ((((((212) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_df14d0bf6638d3f1ddb6932d() {
  return __cxx_static_address_df14d0bf6638d3f1ddb6932d.reference || (__cxx_static_address_df14d0bf6638d3f1ddb6932d.reference = {
    __cReference: true,
    get value() { return MONITOR_ACTIVE____header_global_5d614270a11d3c0e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:129
export const NITEVISION_ONOFF____header_global_28e6dcdb5047728f = ((((((213) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9c7605d2471e7b1418d62bee() {
  return __cxx_static_address_9c7605d2471e7b1418d62bee.reference || (__cxx_static_address_9c7605d2471e7b1418d62bee.reference = {
    __cReference: true,
    get value() { return NITEVISION_ONOFF____header_global_28e6dcdb5047728f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:130
export const DUKE_CRACK_FIRST____header_global_cb821c42b1e2c54d = ((((((215) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c972d64db447ae10bd34e403() {
  return __cxx_static_address_c972d64db447ae10bd34e403.reference || (__cxx_static_address_c972d64db447ae10bd34e403.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK_FIRST____header_global_cb821c42b1e2c54d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:131
export const DUKE_USEMEDKIT____header_global_f4ea42ef5fddc91d = ((((((216) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2ecca36d0b41b6b33a29cdac() {
  return __cxx_static_address_2ecca36d0b41b6b33a29cdac.reference || (__cxx_static_address_2ecca36d0b41b6b33a29cdac.reference = {
    __cReference: true,
    get value() { return DUKE_USEMEDKIT____header_global_f4ea42ef5fddc91d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:132
export const DUKE_TAKEPILLS____header_global_ea253fd28a6d41ef = ((((((217) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3cdb307d9dc35682d5d805c7() {
  return __cxx_static_address_3cdb307d9dc35682d5d805c7.reference || (__cxx_static_address_3cdb307d9dc35682d5d805c7.reference = {
    __cReference: true,
    get value() { return DUKE_TAKEPILLS____header_global_ea253fd28a6d41ef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:133
export const DUKE_PISSRELIEF____header_global_0165c49ba38a0c17 = ((((((218) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9a0a6c660c01d0f5baf55720() {
  return __cxx_static_address_9a0a6c660c01d0f5baf55720.reference || (__cxx_static_address_9a0a6c660c01d0f5baf55720.reference = {
    __cReference: true,
    get value() { return DUKE_PISSRELIEF____header_global_0165c49ba38a0c17; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:134
export const SELECT_WEAPON____header_global_4d57855c5c731d72 = ((((((219) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f4e683d5346746b4065e2add() {
  return __cxx_static_address_f4e683d5346746b4065e2add.reference || (__cxx_static_address_f4e683d5346746b4065e2add.reference = {
    __cReference: true,
    get value() { return SELECT_WEAPON____header_global_4d57855c5c731d72; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:135
export const JIBBED_ACTOR5____header_global_bd2a820805c21636 = ((((((226) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_979babc17c737f8f3795e007() {
  return __cxx_static_address_979babc17c737f8f3795e007.reference || (__cxx_static_address_979babc17c737f8f3795e007.reference = {
    __cReference: true,
    get value() { return JIBBED_ACTOR5____header_global_bd2a820805c21636; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:136
export const JIBBED_ACTOR6____header_global_53f2495321dfb6a8 = ((((((227) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ef56f52f5559462abd4f1911() {
  return __cxx_static_address_ef56f52f5559462abd4f1911.reference || (__cxx_static_address_ef56f52f5559462abd4f1911.reference = {
    __cReference: true,
    get value() { return JIBBED_ACTOR6____header_global_53f2495321dfb6a8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:137
export const DUKE_GOTHEALTHATLOW____header_global_a2cfab2d1dc218c4 = ((((((229) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f1d2a12aab832f2ad62073ec() {
  return __cxx_static_address_f1d2a12aab832f2ad62073ec.reference || (__cxx_static_address_f1d2a12aab832f2ad62073ec.reference = {
    __cReference: true,
    get value() { return DUKE_GOTHEALTHATLOW____header_global_a2cfab2d1dc218c4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:138
export const BOSSTALKTODUKE____header_global_8cb355389fdfa14f = ((((((230) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7c8a4958a2a5f620ea77012a() {
  return __cxx_static_address_7c8a4958a2a5f620ea77012a.reference || (__cxx_static_address_7c8a4958a2a5f620ea77012a.reference = {
    __cReference: true,
    get value() { return BOSSTALKTODUKE____header_global_8cb355389fdfa14f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:139
export const WAR_AMBIENCE2____header_global_f22a97ebc8d0b77b = ((((((232) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4bc3ed8d8eb4f712b9d363d5() {
  return __cxx_static_address_4bc3ed8d8eb4f712b9d363d5.reference || (__cxx_static_address_4bc3ed8d8eb4f712b9d363d5.reference = {
    __cReference: true,
    get value() { return WAR_AMBIENCE2____header_global_f22a97ebc8d0b77b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:140
export const EXITMENUSOUND____header_global_dcabd42e64efc6e4 = ((((((243) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_35d167a0b3c1c88c605cd02f() {
  return __cxx_static_address_35d167a0b3c1c88c605cd02f.reference || (__cxx_static_address_35d167a0b3c1c88c605cd02f.reference = {
    __cReference: true,
    get value() { return EXITMENUSOUND____header_global_dcabd42e64efc6e4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:141
export const FLY_BY____header_global_5dfa260df3d4f213 = ((((((244) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_505d5c54da9dd26af4554a30() {
  return __cxx_static_address_505d5c54da9dd26af4554a30.reference || (__cxx_static_address_505d5c54da9dd26af4554a30.reference = {
    __cReference: true,
    get value() { return FLY_BY____header_global_5dfa260df3d4f213; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:142
export const DUKE_SCREAM____header_global_41b39ed63d54115e = ((((((245) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1cc4ae7e999a395ed9afe4e5() {
  return __cxx_static_address_1cc4ae7e999a395ed9afe4e5.reference || (__cxx_static_address_1cc4ae7e999a395ed9afe4e5.reference = {
    __cReference: true,
    get value() { return DUKE_SCREAM____header_global_41b39ed63d54115e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:143
export const SHRINKER_HIT____header_global_a58e7c3782a03ded = ((((((246) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f7926456f87ce7c3eb6bd843() {
  return __cxx_static_address_f7926456f87ce7c3eb6bd843.reference || (__cxx_static_address_f7926456f87ce7c3eb6bd843.reference = {
    __cReference: true,
    get value() { return SHRINKER_HIT____header_global_a58e7c3782a03ded; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:144
export const RATTY____header_global_aa6f15a420b199a6 = ((((((247) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6c656e6b36e81cb7bba2c4c3() {
  return __cxx_static_address_6c656e6b36e81cb7bba2c4c3.reference || (__cxx_static_address_6c656e6b36e81cb7bba2c4c3.reference = {
    __cReference: true,
    get value() { return RATTY____header_global_aa6f15a420b199a6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:145
export const BONUSMUSIC____header_global_90fff1c44d29e50e = ((((((249) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_10c0310795158b0394bee10e() {
  return __cxx_static_address_10c0310795158b0394bee10e.reference || (__cxx_static_address_10c0310795158b0394bee10e.reference = {
    __cReference: true,
    get value() { return BONUSMUSIC____header_global_90fff1c44d29e50e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:146
export const DUKE_GETWEAPON6____header_global_e4867bc3eb083cc8 = ((((((264) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_025c5a12049231d8f401e92a() {
  return __cxx_static_address_025c5a12049231d8f401e92a.reference || (__cxx_static_address_025c5a12049231d8f401e92a.reference = {
    __cReference: true,
    get value() { return DUKE_GETWEAPON6____header_global_e4867bc3eb083cc8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:147
export const ALIEN_SWITCH1____header_global_4771403a23ce195c = ((((((272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b46045b36f5dc6f243f1c606() {
  return __cxx_static_address_b46045b36f5dc6f243f1c606.reference || (__cxx_static_address_b46045b36f5dc6f243f1c606.reference = {
    __cReference: true,
    get value() { return ALIEN_SWITCH1____header_global_4771403a23ce195c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:148
export const RIPHEADNECK____header_global_4ba99868106ca45d = ((((((284) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_488a96223c1904683164c43b() {
  return __cxx_static_address_488a96223c1904683164c43b.reference || (__cxx_static_address_488a96223c1904683164c43b.reference = {
    __cReference: true,
    get value() { return RIPHEADNECK____header_global_4ba99868106ca45d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:149
export const ENDSEQVOL3SND4____header_global_7d656dab41a1a7a9 = ((((((288) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_df5ceccc98ffdce7833ebb21() {
  return __cxx_static_address_df5ceccc98ffdce7833ebb21.reference || (__cxx_static_address_df5ceccc98ffdce7833ebb21.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND4____header_global_7d656dab41a1a7a9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:150
export const ENDSEQVOL3SND5____header_global_21207d84451dd71f = ((((((289) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_20cd5a6fbc7cf8f544390bab() {
  return __cxx_static_address_20cd5a6fbc7cf8f544390bab.reference || (__cxx_static_address_20cd5a6fbc7cf8f544390bab.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND5____header_global_21207d84451dd71f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:151
export const ENDSEQVOL3SND6____header_global_5fd8cf5adad111ba = ((((((290) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8ebd76f5dbc0838d452e65eb() {
  return __cxx_static_address_8ebd76f5dbc0838d452e65eb.reference || (__cxx_static_address_8ebd76f5dbc0838d452e65eb.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND6____header_global_5fd8cf5adad111ba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:152
export const ENDSEQVOL3SND7____header_global_5659d158c5f59026 = ((((((291) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d00d314dd89142aeb7cc21ea() {
  return __cxx_static_address_d00d314dd89142aeb7cc21ea.reference || (__cxx_static_address_d00d314dd89142aeb7cc21ea.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND7____header_global_5659d158c5f59026; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:153
export const ENDSEQVOL3SND8____header_global_eef85974517d4006 = ((((((292) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_206ac16036c8dc2b1657bedb() {
  return __cxx_static_address_206ac16036c8dc2b1657bedb.reference || (__cxx_static_address_206ac16036c8dc2b1657bedb.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND8____header_global_eef85974517d4006; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:154
export const ENDSEQVOL3SND9____header_global_63ba34d4dcdb9b83 = ((((((293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c07f9e92f6c04f427037fb09() {
  return __cxx_static_address_c07f9e92f6c04f427037fb09.reference || (__cxx_static_address_c07f9e92f6c04f427037fb09.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND9____header_global_63ba34d4dcdb9b83; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:155
export const WHIPYOURASS____header_global_8d7d37ad1c15d28f = ((((((294) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1ffa4d20f6e731a3b3fbb930() {
  return __cxx_static_address_1ffa4d20f6e731a3b3fbb930.reference || (__cxx_static_address_1ffa4d20f6e731a3b3fbb930.reference = {
    __cReference: true,
    get value() { return WHIPYOURASS____header_global_8d7d37ad1c15d28f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:156
export const ENDSEQVOL2SND1____header_global_4df7bfbc2f95978d = ((((((295) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_92314d0711aa5e4581e0cd91() {
  return __cxx_static_address_92314d0711aa5e4581e0cd91.reference || (__cxx_static_address_92314d0711aa5e4581e0cd91.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND1____header_global_4df7bfbc2f95978d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:157
export const ENDSEQVOL2SND2____header_global_9ca37314cd28e610 = ((((((296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_deaa667228d07a15a218a24f() {
  return __cxx_static_address_deaa667228d07a15a218a24f.reference || (__cxx_static_address_deaa667228d07a15a218a24f.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND2____header_global_9ca37314cd28e610; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:158
export const ENDSEQVOL2SND3____header_global_53ad3bf3999d682a = ((((((297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f3dd845b8b622ba52b80c0a2() {
  return __cxx_static_address_f3dd845b8b622ba52b80c0a2.reference || (__cxx_static_address_f3dd845b8b622ba52b80c0a2.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND3____header_global_53ad3bf3999d682a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:159
export const ENDSEQVOL2SND4____header_global_d494a69406d0beac = ((((((298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c925279f772a43cab4677c96() {
  return __cxx_static_address_c925279f772a43cab4677c96.reference || (__cxx_static_address_c925279f772a43cab4677c96.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND4____header_global_d494a69406d0beac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:160
export const ENDSEQVOL2SND5____header_global_890012462dd0d346 = ((((((299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6e836fbfe2a226ecbc443fbb() {
  return __cxx_static_address_6e836fbfe2a226ecbc443fbb.reference || (__cxx_static_address_6e836fbfe2a226ecbc443fbb.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND5____header_global_890012462dd0d346; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:161
export const ENDSEQVOL2SND6____header_global_b98fad4b5de8a1ed = ((((((300) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_92dd68ceea19285348b28780() {
  return __cxx_static_address_92dd68ceea19285348b28780.reference || (__cxx_static_address_92dd68ceea19285348b28780.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND6____header_global_b98fad4b5de8a1ed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:162
export const ENDSEQVOL2SND7____header_global_492f42f89ecc1a58 = ((((((301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_282056e3f2d28d5bdb0d61bf() {
  return __cxx_static_address_282056e3f2d28d5bdb0d61bf.reference || (__cxx_static_address_282056e3f2d28d5bdb0d61bf.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND7____header_global_492f42f89ecc1a58; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:163
export const SOMETHINGFROZE____header_global_5aab058be608b2f9 = ((((((303) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bff9dcac5d5bed5b8c9dcffe() {
  return __cxx_static_address_bff9dcac5d5bed5b8c9dcffe.reference || (__cxx_static_address_bff9dcac5d5bed5b8c9dcffe.reference = {
    __cReference: true,
    get value() { return SOMETHINGFROZE____header_global_5aab058be608b2f9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:164
export const WIND_REPEAT____header_global_f9a09d1aed67dc37 = ((((((308) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_70f11c14f1c5853c6f61e479() {
  return __cxx_static_address_70f11c14f1c5853c6f61e479.reference || (__cxx_static_address_70f11c14f1c5853c6f61e479.reference = {
    __cReference: true,
    get value() { return WIND_REPEAT____header_global_f9a09d1aed67dc37; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:165
export const BOS4_RECOG____header_global_36901bcaa89b0b9e = ((((((342) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_16e2d0b31e88b27599595a1b() {
  return __cxx_static_address_16e2d0b31e88b27599595a1b.reference || (__cxx_static_address_16e2d0b31e88b27599595a1b.reference = {
    __cReference: true,
    get value() { return BOS4_RECOG____header_global_36901bcaa89b0b9e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:166
export const LIGHTNING_SLAP____header_global_7ee8601e4b42f436 = ((((((351) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3de1ea722a428c518e430562() {
  return __cxx_static_address_3de1ea722a428c518e430562.reference || (__cxx_static_address_3de1ea722a428c518e430562.reference = {
    __cReference: true,
    get value() { return LIGHTNING_SLAP____header_global_7ee8601e4b42f436; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:167
export const THUNDER____header_global_912776f42392504d = ((((((352) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f0ee1cd9e221b2d518ce160e() {
  return __cxx_static_address_f0ee1cd9e221b2d518ce160e.reference || (__cxx_static_address_f0ee1cd9e221b2d518ce160e.reference = {
    __cReference: true,
    get value() { return THUNDER____header_global_912776f42392504d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:168
export const INTRO4_1____header_global_36fba8b85affdf8a = ((((((363) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5a57387bb1849b9ee01436e4() {
  return __cxx_static_address_5a57387bb1849b9ee01436e4.reference || (__cxx_static_address_5a57387bb1849b9ee01436e4.reference = {
    __cReference: true,
    get value() { return INTRO4_1____header_global_36fba8b85affdf8a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:169
export const INTRO4_2____header_global_c4f4cecb23246f36 = ((((((364) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a019681229c0d24e6c8db912() {
  return __cxx_static_address_a019681229c0d24e6c8db912.reference || (__cxx_static_address_a019681229c0d24e6c8db912.reference = {
    __cReference: true,
    get value() { return INTRO4_2____header_global_c4f4cecb23246f36; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:170
export const INTRO4_3____header_global_ac8578337a88b120 = ((((((365) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_149182e79b44a0893083c71a() {
  return __cxx_static_address_149182e79b44a0893083c71a.reference || (__cxx_static_address_149182e79b44a0893083c71a.reference = {
    __cReference: true,
    get value() { return INTRO4_3____header_global_ac8578337a88b120; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:171
export const INTRO4_4____header_global_2895205a8b37b48e = ((((((366) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_58277ed625f0e0613acbf20e() {
  return __cxx_static_address_58277ed625f0e0613acbf20e.reference || (__cxx_static_address_58277ed625f0e0613acbf20e.reference = {
    __cReference: true,
    get value() { return INTRO4_4____header_global_2895205a8b37b48e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:172
export const INTRO4_5____header_global_84907576e533d8ea = ((((((367) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_863d91a836ef2f2c72bd1ed0() {
  return __cxx_static_address_863d91a836ef2f2c72bd1ed0.reference || (__cxx_static_address_863d91a836ef2f2c72bd1ed0.reference = {
    __cReference: true,
    get value() { return INTRO4_5____header_global_84907576e533d8ea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:173
export const INTRO4_6____header_global_1d589777beaf4b98 = ((((((368) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b46bad1a0901dde453ebe0ec() {
  return __cxx_static_address_b46bad1a0901dde453ebe0ec.reference || (__cxx_static_address_b46bad1a0901dde453ebe0ec.reference = {
    __cReference: true,
    get value() { return INTRO4_6____header_global_1d589777beaf4b98; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:174
export const BOSS4_DEADSPEECH____header_global_79d1c223ec28e3b3 = ((((((370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0b3d71b00e8dd4da0d595afd() {
  return __cxx_static_address_0b3d71b00e8dd4da0d595afd.reference || (__cxx_static_address_0b3d71b00e8dd4da0d595afd.reference = {
    __cReference: true,
    get value() { return BOSS4_DEADSPEECH____header_global_79d1c223ec28e3b3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:175
export const BOSS4_FIRSTSEE____header_global_6a22ebf395a2b0a1 = ((((((371) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_237d054516df68174d1c8fd4() {
  return __cxx_static_address_237d054516df68174d1c8fd4.reference || (__cxx_static_address_237d054516df68174d1c8fd4.reference = {
    __cReference: true,
    get value() { return BOSS4_FIRSTSEE____header_global_6a22ebf395a2b0a1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:176
export const VOL4ENDSND1____header_global_e4e6d0a1ab15386a = ((((((384) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_afd55cb9e6b920b51c6cecfa() {
  return __cxx_static_address_afd55cb9e6b920b51c6cecfa.reference || (__cxx_static_address_afd55cb9e6b920b51c6cecfa.reference = {
    __cReference: true,
    get value() { return VOL4ENDSND1____header_global_e4e6d0a1ab15386a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:177
export const VOL4ENDSND2____header_global_b697f2ad7ac97b8b = ((((((385) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9c7642b47b281da922f864b1() {
  return __cxx_static_address_9c7642b47b281da922f864b1.reference || (__cxx_static_address_9c7642b47b281da922f864b1.reference = {
    __cReference: true,
    get value() { return VOL4ENDSND2____header_global_b697f2ad7ac97b8b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:178
export const EXPANDERSHOOT____header_global_788bb9855fef2c3b = ((((((388) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8d089a45ae52fd9adbcf0faf() {
  return __cxx_static_address_8d089a45ae52fd9adbcf0faf.reference || (__cxx_static_address_8d089a45ae52fd9adbcf0faf.reference = {
    __cReference: true,
    get value() { return EXPANDERSHOOT____header_global_788bb9855fef2c3b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:179
export const INTRO4_B____header_global_e98a55641cda9a1f = ((((((392) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c45523ca492b3ab3f39459d1() {
  return __cxx_static_address_c45523ca492b3ab3f39459d1.reference || (__cxx_static_address_c45523ca492b3ab3f39459d1.reference = {
    __cReference: true,
    get value() { return INTRO4_B____header_global_e98a55641cda9a1f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:180
export const BIGBANG____header_global_f10c30c12d566aa4 = ((((((393) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3a2a3b4d499aacdd9925698e() {
  return __cxx_static_address_3a2a3b4d499aacdd9925698e.reference || (__cxx_static_address_3a2a3b4d499aacdd9925698e.reference = {
    __cReference: true,
    get value() { return BIGBANG____header_global_f10c30c12d566aa4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:181
export const FLAMETHROWER_INTRO____header_global_a030efd712f65b58 = ((((((398) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f2d0d609a8c7b23a9fb64122() {
  return __cxx_static_address_f2d0d609a8c7b23a9fb64122.reference || (__cxx_static_address_f2d0d609a8c7b23a9fb64122.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_INTRO____header_global_a030efd712f65b58; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:182
export const FLAMETHROWER_LOOP____header_global_e409e19fddfe8469 = ((((((399) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cadcabe8fbb5bbf8f85947c7() {
  return __cxx_static_address_cadcabe8fbb5bbf8f85947c7.reference || (__cxx_static_address_cadcabe8fbb5bbf8f85947c7.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_LOOP____header_global_e409e19fddfe8469; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:183
export const FLAMETHROWER_END____header_global_8812f6db6f9dd6af = ((((((400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d1b434349192410d7ab2358a() {
  return __cxx_static_address_d1b434349192410d7ab2358a.reference || (__cxx_static_address_d1b434349192410d7ab2358a.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_END____header_global_8812f6db6f9dd6af; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:184
export const E5L7_DUKE_QUIT_YOU____header_global_325d4e2edca91ebe = ((((((401) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8df996a37bcc46b1d74cb569() {
  return __cxx_static_address_8df996a37bcc46b1d74cb569.reference || (__cxx_static_address_8df996a37bcc46b1d74cb569.reference = {
    __cReference: true,
    get value() { return E5L7_DUKE_QUIT_YOU____header_global_325d4e2edca91ebe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:187
export const SECTOREFFECTOR____header_global_af4554163425ebdc = ((((((1) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f65e02b452d78ce145221081() {
  return __cxx_static_address_f65e02b452d78ce145221081.reference || (__cxx_static_address_f65e02b452d78ce145221081.reference = {
    __cReference: true,
    get value() { return SECTOREFFECTOR____header_global_af4554163425ebdc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:188
export const ACTIVATOR____header_global_8a23c1b2adff2aff = ((((((2) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cae3295321ed6e2d67d6624c() {
  return __cxx_static_address_cae3295321ed6e2d67d6624c.reference || (__cxx_static_address_cae3295321ed6e2d67d6624c.reference = {
    __cReference: true,
    get value() { return ACTIVATOR____header_global_8a23c1b2adff2aff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:189
export const TOUCHPLATE____header_global_d00dd8d2ea23e821 = ((((((3) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6a01949c0ca2f254b3843b49() {
  return __cxx_static_address_6a01949c0ca2f254b3843b49.reference || (__cxx_static_address_6a01949c0ca2f254b3843b49.reference = {
    __cReference: true,
    get value() { return TOUCHPLATE____header_global_d00dd8d2ea23e821; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:190
export const ACTIVATORLOCKED____header_global_5b7fcaaed35ecaa9 = ((((((4) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7cdac32676f6b8512b6f74d0() {
  return __cxx_static_address_7cdac32676f6b8512b6f74d0.reference || (__cxx_static_address_7cdac32676f6b8512b6f74d0.reference = {
    __cReference: true,
    get value() { return ACTIVATORLOCKED____header_global_5b7fcaaed35ecaa9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:191
export const MUSICANDSFX____header_global_1d62e5f158a583f3 = ((((((5) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_25bc5b64b31018b0c64169ba() {
  return __cxx_static_address_25bc5b64b31018b0c64169ba.reference || (__cxx_static_address_25bc5b64b31018b0c64169ba.reference = {
    __cReference: true,
    get value() { return MUSICANDSFX____header_global_1d62e5f158a583f3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:192
export const LOCATORS____header_global_4f8b1c04714953e8 = ((((((6) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2f5b8e5202a0d5c70880ecbb() {
  return __cxx_static_address_2f5b8e5202a0d5c70880ecbb.reference || (__cxx_static_address_2f5b8e5202a0d5c70880ecbb.reference = {
    __cReference: true,
    get value() { return LOCATORS____header_global_4f8b1c04714953e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:193
export const CYCLER____header_global_d709cfea46367002 = ((((((7) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_84710fb46719877082d5cae7() {
  return __cxx_static_address_84710fb46719877082d5cae7.reference || (__cxx_static_address_84710fb46719877082d5cae7.reference = {
    __cReference: true,
    get value() { return CYCLER____header_global_d709cfea46367002; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:194
export const MASTERSWITCH____header_global_dafe39d5b66ecb85 = ((((((8) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_901210eb70bf186853594114() {
  return __cxx_static_address_901210eb70bf186853594114.reference || (__cxx_static_address_901210eb70bf186853594114.reference = {
    __cReference: true,
    get value() { return MASTERSWITCH____header_global_dafe39d5b66ecb85; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:195
export const RESPAWN____header_global_712ab9e1b6871457 = ((((((9) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a05dd10c8d983df01caadb24() {
  return __cxx_static_address_a05dd10c8d983df01caadb24.reference || (__cxx_static_address_a05dd10c8d983df01caadb24.reference = {
    __cReference: true,
    get value() { return RESPAWN____header_global_712ab9e1b6871457; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:196
export const GPSPEED____header_global_3598bb32b8154fdf = ((((((10) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8ca57b9d48f46385d0060f5c() {
  return __cxx_static_address_8ca57b9d48f46385d0060f5c.reference || (__cxx_static_address_8ca57b9d48f46385d0060f5c.reference = {
    __cReference: true,
    get value() { return GPSPEED____header_global_3598bb32b8154fdf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:197
export const FOF____header_global_f839b8bcc4f79b77 = ((((((13) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_abfc6586725579e2ca45c8b6() {
  return __cxx_static_address_abfc6586725579e2ca45c8b6.reference || (__cxx_static_address_abfc6586725579e2ca45c8b6.reference = {
    __cReference: true,
    get value() { return FOF____header_global_f839b8bcc4f79b77; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:198
export const ARROW____header_global_c07714fdaa7d0b86 = ((((((20) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a9f60a75e4f195a6e16a2d77() {
  return __cxx_static_address_a9f60a75e4f195a6e16a2d77.reference || (__cxx_static_address_a9f60a75e4f195a6e16a2d77.reference = {
    __cReference: true,
    get value() { return ARROW____header_global_c07714fdaa7d0b86; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:199
export const FIRSTGUNSPRITE____header_global_ae7eef42b10f74eb = ((((((21) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b7b53ffdf602246bef420630() {
  return __cxx_static_address_b7b53ffdf602246bef420630.reference || (__cxx_static_address_b7b53ffdf602246bef420630.reference = {
    __cReference: true,
    get value() { return FIRSTGUNSPRITE____header_global_ae7eef42b10f74eb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:200
export const CHAINGUNSPRITE____header_global_dcd93b260fc4fdc2 = ((((((22) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cec87e6d01efe0c0bb4b2e14() {
  return __cxx_static_address_cec87e6d01efe0c0bb4b2e14.reference || (__cxx_static_address_cec87e6d01efe0c0bb4b2e14.reference = {
    __cReference: true,
    get value() { return CHAINGUNSPRITE____header_global_dcd93b260fc4fdc2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:201
export const RPGSPRITE____header_global_bae240f3d87e048c = ((((((23) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f2d916d0451b3ee9545833fd() {
  return __cxx_static_address_f2d916d0451b3ee9545833fd.reference || (__cxx_static_address_f2d916d0451b3ee9545833fd.reference = {
    __cReference: true,
    get value() { return RPGSPRITE____header_global_bae240f3d87e048c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:202
export const FREEZESPRITE____header_global_21b25f8acb082f72 = ((((((24) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4d795ebc7d4ec689b4475934() {
  return __cxx_static_address_4d795ebc7d4ec689b4475934.reference || (__cxx_static_address_4d795ebc7d4ec689b4475934.reference = {
    __cReference: true,
    get value() { return FREEZESPRITE____header_global_21b25f8acb082f72; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:203
export const SHRINKERSPRITE____header_global_6c75e08e8529ff0f = ((((((25) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_186f2ebb0d3458c5f8183c03() {
  return __cxx_static_address_186f2ebb0d3458c5f8183c03.reference || (__cxx_static_address_186f2ebb0d3458c5f8183c03.reference = {
    __cReference: true,
    get value() { return SHRINKERSPRITE____header_global_6c75e08e8529ff0f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:204
export const HEAVYHBOMB____header_global_9dd4a80ebf52bb79 = ((((((26) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fc4682a950eec035eacddcc2() {
  return __cxx_static_address_fc4682a950eec035eacddcc2.reference || (__cxx_static_address_fc4682a950eec035eacddcc2.reference = {
    __cReference: true,
    get value() { return HEAVYHBOMB____header_global_9dd4a80ebf52bb79; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:205
export const TRIPBOMBSPRITE____header_global_cd2a787920cc3df0 = ((((((27) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ce26c93cc6cb7f187ac34b47() {
  return __cxx_static_address_ce26c93cc6cb7f187ac34b47.reference || (__cxx_static_address_ce26c93cc6cb7f187ac34b47.reference = {
    __cReference: true,
    get value() { return TRIPBOMBSPRITE____header_global_cd2a787920cc3df0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:206
export const SHOTGUNSPRITE____header_global_33b0b842bc451d7e = ((((((28) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1f5dcb6c61054fe18b808de0() {
  return __cxx_static_address_1f5dcb6c61054fe18b808de0.reference || (__cxx_static_address_1f5dcb6c61054fe18b808de0.reference = {
    __cReference: true,
    get value() { return SHOTGUNSPRITE____header_global_33b0b842bc451d7e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:207
export const DEVISTATORSPRITE____header_global_393ce891035fc4eb = ((((((29) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ce1438bdec0c6124e8dae761() {
  return __cxx_static_address_ce1438bdec0c6124e8dae761.reference || (__cxx_static_address_ce1438bdec0c6124e8dae761.reference = {
    __cReference: true,
    get value() { return DEVISTATORSPRITE____header_global_393ce891035fc4eb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:208
export const HEALTHBOX____header_global_a32e19d9211bab7d = ((((((30) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eee6a0857c88fdef9a23afe0() {
  return __cxx_static_address_eee6a0857c88fdef9a23afe0.reference || (__cxx_static_address_eee6a0857c88fdef9a23afe0.reference = {
    __cReference: true,
    get value() { return HEALTHBOX____header_global_a32e19d9211bab7d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:209
export const AMMOBOX____header_global_595f7c6fd838d437 = ((((((31) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f7bd3841165f4d674fe1025d() {
  return __cxx_static_address_f7bd3841165f4d674fe1025d.reference || (__cxx_static_address_f7bd3841165f4d674fe1025d.reference = {
    __cReference: true,
    get value() { return AMMOBOX____header_global_595f7c6fd838d437; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:210
export const GROWSPRITEICON____header_global_965a9269a2d263ff = ((((((32) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b7e36070388e577766f81d67() {
  return __cxx_static_address_b7e36070388e577766f81d67.reference || (__cxx_static_address_b7e36070388e577766f81d67.reference = {
    __cReference: true,
    get value() { return GROWSPRITEICON____header_global_965a9269a2d263ff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:211
export const INVENTORYBOX____header_global_cdeb2525cbd418fb = ((((((33) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ddfcb066c82536c945db0972() {
  return __cxx_static_address_ddfcb066c82536c945db0972.reference || (__cxx_static_address_ddfcb066c82536c945db0972.reference = {
    __cReference: true,
    get value() { return INVENTORYBOX____header_global_cdeb2525cbd418fb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:212
export const FREEZEAMMO____header_global_31fbbb2d220127dd = ((((((37) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e4c5cdab98b33f7ebdb9097b() {
  return __cxx_static_address_e4c5cdab98b33f7ebdb9097b.reference || (__cxx_static_address_e4c5cdab98b33f7ebdb9097b.reference = {
    __cReference: true,
    get value() { return FREEZEAMMO____header_global_31fbbb2d220127dd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:213
export const AMMO____header_global_3a4864bce261b9c9 = ((((((40) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9350fce3de93b4b97ba2fa9e() {
  return __cxx_static_address_9350fce3de93b4b97ba2fa9e.reference || (__cxx_static_address_9350fce3de93b4b97ba2fa9e.reference = {
    __cReference: true,
    get value() { return AMMO____header_global_3a4864bce261b9c9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:214
export const BATTERYAMMO____header_global_3c6c3288d341406c = ((((((41) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1062c9ef13a9ac6c3bcfbc50() {
  return __cxx_static_address_1062c9ef13a9ac6c3bcfbc50.reference || (__cxx_static_address_1062c9ef13a9ac6c3bcfbc50.reference = {
    __cReference: true,
    get value() { return BATTERYAMMO____header_global_3c6c3288d341406c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:215
export const DEVISTATORAMMO____header_global_4c26693e4c0a1d38 = ((((((42) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_925e0ebd6edf64cc05645929() {
  return __cxx_static_address_925e0ebd6edf64cc05645929.reference || (__cxx_static_address_925e0ebd6edf64cc05645929.reference = {
    __cReference: true,
    get value() { return DEVISTATORAMMO____header_global_4c26693e4c0a1d38; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:216
export const RPGAMMO____header_global_ad2b272b3bfade2f = ((((((44) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1cdd0d0a4a470da9fdb25d8a() {
  return __cxx_static_address_1cdd0d0a4a470da9fdb25d8a.reference || (__cxx_static_address_1cdd0d0a4a470da9fdb25d8a.reference = {
    __cReference: true,
    get value() { return RPGAMMO____header_global_ad2b272b3bfade2f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:217
export const GROWAMMO____header_global_6c9d8ce581adff0d = ((((((45) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2640cef1caea336f34b1c2c4() {
  return __cxx_static_address_2640cef1caea336f34b1c2c4.reference || (__cxx_static_address_2640cef1caea336f34b1c2c4.reference = {
    __cReference: true,
    get value() { return GROWAMMO____header_global_6c9d8ce581adff0d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:218
export const CRYSTALAMMO____header_global_9f244def84f48f36 = ((((((46) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_69e47d19f96a4d07966789d5() {
  return __cxx_static_address_69e47d19f96a4d07966789d5.reference || (__cxx_static_address_69e47d19f96a4d07966789d5.reference = {
    __cReference: true,
    get value() { return CRYSTALAMMO____header_global_9f244def84f48f36; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:219
export const HBOMBAMMO____header_global_b2711c7a72f13114 = ((((((47) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6900d81b454eb551c5859b51() {
  return __cxx_static_address_6900d81b454eb551c5859b51.reference || (__cxx_static_address_6900d81b454eb551c5859b51.reference = {
    __cReference: true,
    get value() { return HBOMBAMMO____header_global_b2711c7a72f13114; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:220
export const AMMOLOTS____header_global_6fdd9f9b88d9faa9 = ((((((48) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a26b616479738080687311cd() {
  return __cxx_static_address_a26b616479738080687311cd.reference || (__cxx_static_address_a26b616479738080687311cd.reference = {
    __cReference: true,
    get value() { return AMMOLOTS____header_global_6fdd9f9b88d9faa9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:221
export const SHOTGUNAMMO____header_global_d424b10f8a36ea4e = ((((((49) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8170b05146dcb4b106130506() {
  return __cxx_static_address_8170b05146dcb4b106130506.reference || (__cxx_static_address_8170b05146dcb4b106130506.reference = {
    __cReference: true,
    get value() { return SHOTGUNAMMO____header_global_d424b10f8a36ea4e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:222
export const COLA____header_global_7c7741ba517b6510 = ((((((51) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_79c4f7d928c76c588dec231c() {
  return __cxx_static_address_79c4f7d928c76c588dec231c.reference || (__cxx_static_address_79c4f7d928c76c588dec231c.reference = {
    __cReference: true,
    get value() { return COLA____header_global_7c7741ba517b6510; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:223
export const SIXPAK____header_global_bcd3dd5929a19fdc = ((((((52) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c35ce3423479c8c0b2c9be37() {
  return __cxx_static_address_c35ce3423479c8c0b2c9be37.reference || (__cxx_static_address_c35ce3423479c8c0b2c9be37.reference = {
    __cReference: true,
    get value() { return SIXPAK____header_global_bcd3dd5929a19fdc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:224
export const FIRSTAID____header_global_096c2e7f5ff47b37 = ((((((53) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9935e8cea3bd611bcdad8370() {
  return __cxx_static_address_9935e8cea3bd611bcdad8370.reference || (__cxx_static_address_9935e8cea3bd611bcdad8370.reference = {
    __cReference: true,
    get value() { return FIRSTAID____header_global_096c2e7f5ff47b37; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:225
export const SHIELD____header_global_88cd2f7f5e3c0122 = ((((((54) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c0437b5ddc042b657bdc5468() {
  return __cxx_static_address_c0437b5ddc042b657bdc5468.reference || (__cxx_static_address_c0437b5ddc042b657bdc5468.reference = {
    __cReference: true,
    get value() { return SHIELD____header_global_88cd2f7f5e3c0122; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:226
export const STEROIDS____header_global_36f23bea15cac61f = ((((((55) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2c71f7109df094366735fe66() {
  return __cxx_static_address_2c71f7109df094366735fe66.reference || (__cxx_static_address_2c71f7109df094366735fe66.reference = {
    __cReference: true,
    get value() { return STEROIDS____header_global_36f23bea15cac61f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:227
export const AIRTANK____header_global_68dfed3eebc2cca4 = ((((((56) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cb9524998a2e1f513e0f3d71() {
  return __cxx_static_address_cb9524998a2e1f513e0f3d71.reference || (__cxx_static_address_cb9524998a2e1f513e0f3d71.reference = {
    __cReference: true,
    get value() { return AIRTANK____header_global_68dfed3eebc2cca4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:228
export const JETPACK____header_global_0682ad264165214e = ((((((57) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f7532e387ffe36720f4e087f() {
  return __cxx_static_address_f7532e387ffe36720f4e087f.reference || (__cxx_static_address_f7532e387ffe36720f4e087f.reference = {
    __cReference: true,
    get value() { return JETPACK____header_global_0682ad264165214e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:229
export const HEATSENSOR____header_global_eaa669cf5d33659f = ((((((59) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_59e4b2f8ff82556b4f777bb3() {
  return __cxx_static_address_59e4b2f8ff82556b4f777bb3.reference || (__cxx_static_address_59e4b2f8ff82556b4f777bb3.reference = {
    __cReference: true,
    get value() { return HEATSENSOR____header_global_eaa669cf5d33659f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:230
export const ACCESSCARD____header_global_6755b599e8d59c7d = ((((((60) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ffd4a54baccbc024f893eddc() {
  return __cxx_static_address_ffd4a54baccbc024f893eddc.reference || (__cxx_static_address_ffd4a54baccbc024f893eddc.reference = {
    __cReference: true,
    get value() { return ACCESSCARD____header_global_6755b599e8d59c7d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:231
export const BOOTS____header_global_2bd1e6b803c379ad = ((((((61) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f907f557c96b00ebdd11a1c8() {
  return __cxx_static_address_f907f557c96b00ebdd11a1c8.reference || (__cxx_static_address_f907f557c96b00ebdd11a1c8.reference = {
    __cReference: true,
    get value() { return BOOTS____header_global_2bd1e6b803c379ad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:232
export const MIRRORBROKE____header_global_500813e0713a95fb = ((((((70) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a58ce91dbc0d76e6090c07f9() {
  return __cxx_static_address_a58ce91dbc0d76e6090c07f9.reference || (__cxx_static_address_a58ce91dbc0d76e6090c07f9.reference = {
    __cReference: true,
    get value() { return MIRRORBROKE____header_global_500813e0713a95fb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:233
export const CLOUDYOCEAN____header_global_a73d5c1760d42f95 = ((((((78) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4bc1bd9a86af5042e87a6c29() {
  return __cxx_static_address_4bc1bd9a86af5042e87a6c29.reference || (__cxx_static_address_4bc1bd9a86af5042e87a6c29.reference = {
    __cReference: true,
    get value() { return CLOUDYOCEAN____header_global_a73d5c1760d42f95; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:234
export const CLOUDYSKIES____header_global_0d4a9355db1c6dc2 = ((((((79) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_49ae3748d38e5dadbf04ee9d() {
  return __cxx_static_address_49ae3748d38e5dadbf04ee9d.reference || (__cxx_static_address_49ae3748d38e5dadbf04ee9d.reference = {
    __cReference: true,
    get value() { return CLOUDYSKIES____header_global_0d4a9355db1c6dc2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:235
export const MOONSKY1____header_global_79644d4e8c5d7db1 = ((((((80) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_baec82a36901150ff9f3ae66() {
  return __cxx_static_address_baec82a36901150ff9f3ae66.reference || (__cxx_static_address_baec82a36901150ff9f3ae66.reference = {
    __cReference: true,
    get value() { return MOONSKY1____header_global_79644d4e8c5d7db1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:236
export const BIGORBIT1____header_global_8c3b08dc27da10ad = ((((((84) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b74a93ce0aafdf46bffdc39e() {
  return __cxx_static_address_b74a93ce0aafdf46bffdc39e.reference || (__cxx_static_address_b74a93ce0aafdf46bffdc39e.reference = {
    __cReference: true,
    get value() { return BIGORBIT1____header_global_8c3b08dc27da10ad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:237
export const LA____header_global_8c236430341eea29 = ((((((89) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_899f6baa3c3b69fb0051bec2() {
  return __cxx_static_address_899f6baa3c3b69fb0051bec2.reference || (__cxx_static_address_899f6baa3c3b69fb0051bec2.reference = {
    __cReference: true,
    get value() { return LA____header_global_8c236430341eea29; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:238
export const ATOMICHEALTH____header_global_2dac5904c2273bde = ((((((100) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_da0a79259f63967cd04688eb() {
  return __cxx_static_address_da0a79259f63967cd04688eb.reference || (__cxx_static_address_da0a79259f63967cd04688eb.reference = {
    __cReference: true,
    get value() { return ATOMICHEALTH____header_global_2dac5904c2273bde; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:239
export const TECHLIGHT2____header_global_6740f3cf86be681c = ((((((120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8893cae90aa33ce795e706b1() {
  return __cxx_static_address_8893cae90aa33ce795e706b1.reference || (__cxx_static_address_8893cae90aa33ce795e706b1.reference = {
    __cReference: true,
    get value() { return TECHLIGHT2____header_global_6740f3cf86be681c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:240
export const TECHLIGHTBUST2____header_global_7ea75a8c75bc386a = ((((((121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_41be15e1833e17a80af5d191() {
  return __cxx_static_address_41be15e1833e17a80af5d191.reference || (__cxx_static_address_41be15e1833e17a80af5d191.reference = {
    __cReference: true,
    get value() { return TECHLIGHTBUST2____header_global_7ea75a8c75bc386a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:241
export const TECHLIGHT4____header_global_0e745253b5014636 = ((((((122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fefe9b46743a3bc9a7b1e0bb() {
  return __cxx_static_address_fefe9b46743a3bc9a7b1e0bb.reference || (__cxx_static_address_fefe9b46743a3bc9a7b1e0bb.reference = {
    __cReference: true,
    get value() { return TECHLIGHT4____header_global_0e745253b5014636; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:242
export const TECHLIGHTBUST4____header_global_b9d81e24449db299 = ((((((123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4393292c46f41d4a94716f9d() {
  return __cxx_static_address_4393292c46f41d4a94716f9d.reference || (__cxx_static_address_4393292c46f41d4a94716f9d.reference = {
    __cReference: true,
    get value() { return TECHLIGHTBUST4____header_global_b9d81e24449db299; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:243
export const WALLLIGHT4____header_global_5c4a9364fd207032 = ((((((124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a951695cfe91393ae5df9c07() {
  return __cxx_static_address_a951695cfe91393ae5df9c07.reference || (__cxx_static_address_a951695cfe91393ae5df9c07.reference = {
    __cReference: true,
    get value() { return WALLLIGHT4____header_global_5c4a9364fd207032; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:244
export const WALLLIGHTBUST4____header_global_20ba10b0f9158c91 = ((((((125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_777dd7cddb06a6fcaf397b27() {
  return __cxx_static_address_777dd7cddb06a6fcaf397b27.reference || (__cxx_static_address_777dd7cddb06a6fcaf397b27.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST4____header_global_20ba10b0f9158c91; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:245
export const ACCESSSWITCH____header_global_b392fc7cd3b2ada7 = ((((((130) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6326174b0b5f187dc397681c() {
  return __cxx_static_address_6326174b0b5f187dc397681c.reference || (__cxx_static_address_6326174b0b5f187dc397681c.reference = {
    __cReference: true,
    get value() { return ACCESSSWITCH____header_global_b392fc7cd3b2ada7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:246
export const SLOTDOOR____header_global_9cbc28069ba84609 = ((((((132) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_64f60c2e7d44b9d3a92178cc() {
  return __cxx_static_address_64f60c2e7d44b9d3a92178cc.reference || (__cxx_static_address_64f60c2e7d44b9d3a92178cc.reference = {
    __cReference: true,
    get value() { return SLOTDOOR____header_global_9cbc28069ba84609; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:247
export const LIGHTSWITCH____header_global_b1561233a8b7ccb5 = ((((((134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_001514953a8a9ed388237191() {
  return __cxx_static_address_001514953a8a9ed388237191.reference || (__cxx_static_address_001514953a8a9ed388237191.reference = {
    __cReference: true,
    get value() { return LIGHTSWITCH____header_global_b1561233a8b7ccb5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:248
export const SPACEDOORSWITCH____header_global_fb55d603b6ed4e69 = ((((((136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8e6ab67db6e528c99d830b74() {
  return __cxx_static_address_8e6ab67db6e528c99d830b74.reference || (__cxx_static_address_8e6ab67db6e528c99d830b74.reference = {
    __cReference: true,
    get value() { return SPACEDOORSWITCH____header_global_fb55d603b6ed4e69; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:249
export const SPACELIGHTSWITCH____header_global_60dd372220537ca4 = ((((((138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_05b2d52c5f861896948e1b5f() {
  return __cxx_static_address_05b2d52c5f861896948e1b5f.reference || (__cxx_static_address_05b2d52c5f861896948e1b5f.reference = {
    __cReference: true,
    get value() { return SPACELIGHTSWITCH____header_global_60dd372220537ca4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:250
export const FRANKENSTINESWITCH____header_global_f5a6c28d30ef9aa1 = ((((((140) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b5e34030fa07d1eadbd9c731() {
  return __cxx_static_address_b5e34030fa07d1eadbd9c731.reference || (__cxx_static_address_b5e34030fa07d1eadbd9c731.reference = {
    __cReference: true,
    get value() { return FRANKENSTINESWITCH____header_global_f5a6c28d30ef9aa1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:251
export const NUKEBUTTON____header_global_4aa355c4c095343d = ((((((142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e377caee474ed71fd590f7f3() {
  return __cxx_static_address_e377caee474ed71fd590f7f3.reference || (__cxx_static_address_e377caee474ed71fd590f7f3.reference = {
    __cReference: true,
    get value() { return NUKEBUTTON____header_global_4aa355c4c095343d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:252
export const MULTISWITCH____header_global_f490051daf59cd5a = ((((((146) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_23fc2a42d920517b73d56e8c() {
  return __cxx_static_address_23fc2a42d920517b73d56e8c.reference || (__cxx_static_address_23fc2a42d920517b73d56e8c.reference = {
    __cReference: true,
    get value() { return MULTISWITCH____header_global_f490051daf59cd5a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:253
export const DOORTILE5____header_global_77871f77317999c1 = ((((((150) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4d98a94246a90609ce6718bc() {
  return __cxx_static_address_4d98a94246a90609ce6718bc.reference || (__cxx_static_address_4d98a94246a90609ce6718bc.reference = {
    __cReference: true,
    get value() { return DOORTILE5____header_global_77871f77317999c1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:254
export const DOORTILE6____header_global_03df8c4e8c2da7c4 = ((((((151) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f02bdcb940f96de5c11963a4() {
  return __cxx_static_address_f02bdcb940f96de5c11963a4.reference || (__cxx_static_address_f02bdcb940f96de5c11963a4.reference = {
    __cReference: true,
    get value() { return DOORTILE6____header_global_03df8c4e8c2da7c4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:255
export const DOORTILE1____header_global_9b173f49e41a0761 = ((((((152) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1d567eca19ca30525d0caacc() {
  return __cxx_static_address_1d567eca19ca30525d0caacc.reference || (__cxx_static_address_1d567eca19ca30525d0caacc.reference = {
    __cReference: true,
    get value() { return DOORTILE1____header_global_9b173f49e41a0761; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:256
export const DOORTILE2____header_global_34b50c267e601b2a = ((((((153) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_28ace4fd69b8fd907dbc2176() {
  return __cxx_static_address_28ace4fd69b8fd907dbc2176.reference || (__cxx_static_address_28ace4fd69b8fd907dbc2176.reference = {
    __cReference: true,
    get value() { return DOORTILE2____header_global_34b50c267e601b2a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:257
export const DOORTILE3____header_global_224b36140b483449 = ((((((154) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_52f841836e96eb3e1a5e62be() {
  return __cxx_static_address_52f841836e96eb3e1a5e62be.reference || (__cxx_static_address_52f841836e96eb3e1a5e62be.reference = {
    __cReference: true,
    get value() { return DOORTILE3____header_global_224b36140b483449; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:258
export const DOORTILE4____header_global_6fa5d2304d87cedb = ((((((155) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_837d26cd534bbd82dd0752a2() {
  return __cxx_static_address_837d26cd534bbd82dd0752a2.reference || (__cxx_static_address_837d26cd534bbd82dd0752a2.reference = {
    __cReference: true,
    get value() { return DOORTILE4____header_global_6fa5d2304d87cedb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:259
export const DOORTILE7____header_global_9ccff3154ca3f37e = ((((((156) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_26a8ef91404e69ba1a604a6a() {
  return __cxx_static_address_26a8ef91404e69ba1a604a6a.reference || (__cxx_static_address_26a8ef91404e69ba1a604a6a.reference = {
    __cReference: true,
    get value() { return DOORTILE7____header_global_9ccff3154ca3f37e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:260
export const DOORTILE8____header_global_8750a3bd47a1686f = ((((((157) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_478dab020bd3b386350ebcd5() {
  return __cxx_static_address_478dab020bd3b386350ebcd5.reference || (__cxx_static_address_478dab020bd3b386350ebcd5.reference = {
    __cReference: true,
    get value() { return DOORTILE8____header_global_8750a3bd47a1686f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:261
export const DOORTILE9____header_global_d014a8cb6f54882b = ((((((158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7c5596eaeecc51364991e3f4() {
  return __cxx_static_address_7c5596eaeecc51364991e3f4.reference || (__cxx_static_address_7c5596eaeecc51364991e3f4.reference = {
    __cReference: true,
    get value() { return DOORTILE9____header_global_d014a8cb6f54882b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:262
export const DOORTILE10____header_global_96b6174720aa340f = ((((((159) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dfc213f0844ec070124adc18() {
  return __cxx_static_address_dfc213f0844ec070124adc18.reference || (__cxx_static_address_dfc213f0844ec070124adc18.reference = {
    __cReference: true,
    get value() { return DOORTILE10____header_global_96b6174720aa340f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:263
export const DOORSHOCK____header_global_12035e5a0c55fb66 = ((((((160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_18754225c026b7d1992c4423() {
  return __cxx_static_address_18754225c026b7d1992c4423.reference || (__cxx_static_address_18754225c026b7d1992c4423.reference = {
    __cReference: true,
    get value() { return DOORSHOCK____header_global_12035e5a0c55fb66; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:264
export const DIPSWITCH____header_global_c9266dc8f523c172 = ((((((162) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_69702019248ce4b602115b5e() {
  return __cxx_static_address_69702019248ce4b602115b5e.reference || (__cxx_static_address_69702019248ce4b602115b5e.reference = {
    __cReference: true,
    get value() { return DIPSWITCH____header_global_c9266dc8f523c172; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:265
export const DIPSWITCH2____header_global_8edc66671194385b = ((((((164) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d1cbb104b4c315fba1f40779() {
  return __cxx_static_address_d1cbb104b4c315fba1f40779.reference || (__cxx_static_address_d1cbb104b4c315fba1f40779.reference = {
    __cReference: true,
    get value() { return DIPSWITCH2____header_global_8edc66671194385b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:266
export const TECHSWITCH____header_global_8204af361cfa40af = ((((((166) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dd98b53deedb9723fa149858() {
  return __cxx_static_address_dd98b53deedb9723fa149858.reference || (__cxx_static_address_dd98b53deedb9723fa149858.reference = {
    __cReference: true,
    get value() { return TECHSWITCH____header_global_8204af361cfa40af; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:267
export const DIPSWITCH3____header_global_3c6c1d3534b40084 = ((((((168) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d788c012945f202792f4d207() {
  return __cxx_static_address_d788c012945f202792f4d207.reference || (__cxx_static_address_d788c012945f202792f4d207.reference = {
    __cReference: true,
    get value() { return DIPSWITCH3____header_global_3c6c1d3534b40084; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:268
export const ACCESSSWITCH2____header_global_02fe9e6783dc1e17 = ((((((170) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e7831422f5e27067c87e45eb() {
  return __cxx_static_address_e7831422f5e27067c87e45eb.reference || (__cxx_static_address_e7831422f5e27067c87e45eb.reference = {
    __cReference: true,
    get value() { return ACCESSSWITCH2____header_global_02fe9e6783dc1e17; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:269
export const FLOORSLIME____header_global_374808ccbef66e38 = ((((((200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5e57ae45e0750054de0e05a5() {
  return __cxx_static_address_5e57ae45e0750054de0e05a5.reference || (__cxx_static_address_5e57ae45e0750054de0e05a5.reference = {
    __cReference: true,
    get value() { return FLOORSLIME____header_global_374808ccbef66e38; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:270
export const BIGFORCE____header_global_4adb7cdf3a0e8bba = ((((((230) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_571c7409bbd6cb7bd8d219c4() {
  return __cxx_static_address_571c7409bbd6cb7bd8d219c4.reference || (__cxx_static_address_571c7409bbd6cb7bd8d219c4.reference = {
    __cReference: true,
    get value() { return BIGFORCE____header_global_4adb7cdf3a0e8bba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:271
export const MASKWALL9____header_global_ece675bc9372a026 = ((((((255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9b959740d22f3cc33eb795d2() {
  return __cxx_static_address_9b959740d22f3cc33eb795d2.reference || (__cxx_static_address_9b959740d22f3cc33eb795d2.reference = {
    __cReference: true,
    get value() { return MASKWALL9____header_global_ece675bc9372a026; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:272
export const SCREENBREAK1____header_global_adef4e833bc40807 = ((((((263) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3fa0ec0d70ea87b1624b4313() {
  return __cxx_static_address_3fa0ec0d70ea87b1624b4313.reference || (__cxx_static_address_3fa0ec0d70ea87b1624b4313.reference = {
    __cReference: true,
    get value() { return SCREENBREAK1____header_global_adef4e833bc40807; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:273
export const SCREENBREAK2____header_global_c4928593fc6d59fa = ((((((264) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ee8b32aeea1e263bc54ca5c5() {
  return __cxx_static_address_ee8b32aeea1e263bc54ca5c5.reference || (__cxx_static_address_ee8b32aeea1e263bc54ca5c5.reference = {
    __cReference: true,
    get value() { return SCREENBREAK2____header_global_c4928593fc6d59fa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:274
export const SCREENBREAK3____header_global_a9e6fd9851a8f049 = ((((((265) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0585a3d162ddf6f59caf976c() {
  return __cxx_static_address_0585a3d162ddf6f59caf976c.reference || (__cxx_static_address_0585a3d162ddf6f59caf976c.reference = {
    __cReference: true,
    get value() { return SCREENBREAK3____header_global_a9e6fd9851a8f049; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:275
export const SCREENBREAK4____header_global_5dde338783bee88a = ((((((266) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_50ad5ba4825e67d541aa8750() {
  return __cxx_static_address_50ad5ba4825e67d541aa8750.reference || (__cxx_static_address_50ad5ba4825e67d541aa8750.reference = {
    __cReference: true,
    get value() { return SCREENBREAK4____header_global_5dde338783bee88a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:276
export const SCREENBREAK5____header_global_cc063f5aae764eeb = ((((((267) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aad21db002caf488bf39794d() {
  return __cxx_static_address_aad21db002caf488bf39794d.reference || (__cxx_static_address_aad21db002caf488bf39794d.reference = {
    __cReference: true,
    get value() { return SCREENBREAK5____header_global_cc063f5aae764eeb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:277
export const SCREENBREAK6____header_global_4849b8dfdd543b02 = ((((((268) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4c4ac43bc2a6d010286980c0() {
  return __cxx_static_address_4c4ac43bc2a6d010286980c0.reference || (__cxx_static_address_4c4ac43bc2a6d010286980c0.reference = {
    __cReference: true,
    get value() { return SCREENBREAK6____header_global_4849b8dfdd543b02; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:278
export const SCREENBREAK7____header_global_26eae0af79717f88 = ((((((269) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b67b60d950ade9f3c30ebb30() {
  return __cxx_static_address_b67b60d950ade9f3c30ebb30.reference || (__cxx_static_address_b67b60d950ade9f3c30ebb30.reference = {
    __cReference: true,
    get value() { return SCREENBREAK7____header_global_26eae0af79717f88; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:279
export const SCREENBREAK8____header_global_0d4fa20726ce517e = ((((((270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0dc22037f96cab2b781f8230() {
  return __cxx_static_address_0dc22037f96cab2b781f8230.reference || (__cxx_static_address_0dc22037f96cab2b781f8230.reference = {
    __cReference: true,
    get value() { return SCREENBREAK8____header_global_0d4fa20726ce517e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:280
export const SCREENBREAK9____header_global_595e1de8a2fac2e5 = ((((((271) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9eec49650ef6cfb22393e2ea() {
  return __cxx_static_address_9eec49650ef6cfb22393e2ea.reference || (__cxx_static_address_9eec49650ef6cfb22393e2ea.reference = {
    __cReference: true,
    get value() { return SCREENBREAK9____header_global_595e1de8a2fac2e5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:281
export const SCREENBREAK10____header_global_9cbc3ce7f222ba51 = ((((((272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6a635e5d23ef8df73de71a39() {
  return __cxx_static_address_6a635e5d23ef8df73de71a39.reference || (__cxx_static_address_6a635e5d23ef8df73de71a39.reference = {
    __cReference: true,
    get value() { return SCREENBREAK10____header_global_9cbc3ce7f222ba51; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:282
export const SCREENBREAK11____header_global_78a1aaa987ec77ff = ((((((273) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e0c8f1bfa570d811ec599ea2() {
  return __cxx_static_address_e0c8f1bfa570d811ec599ea2.reference || (__cxx_static_address_e0c8f1bfa570d811ec599ea2.reference = {
    __cReference: true,
    get value() { return SCREENBREAK11____header_global_78a1aaa987ec77ff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:283
export const SCREENBREAK12____header_global_cc630eb10adeb8bf = ((((((274) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_187ce96f62ae01f96bc987cd() {
  return __cxx_static_address_187ce96f62ae01f96bc987cd.reference || (__cxx_static_address_187ce96f62ae01f96bc987cd.reference = {
    __cReference: true,
    get value() { return SCREENBREAK12____header_global_cc630eb10adeb8bf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:284
export const SCREENBREAK13____header_global_32a735bbd955e68d = ((((((275) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_24c8001b97ca9ec137bf4df8() {
  return __cxx_static_address_24c8001b97ca9ec137bf4df8.reference || (__cxx_static_address_24c8001b97ca9ec137bf4df8.reference = {
    __cReference: true,
    get value() { return SCREENBREAK13____header_global_32a735bbd955e68d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:285
export const MASKWALL1____header_global_7c8805b27c3011a2 = ((((((285) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cf2f73c77b6a658a3e91bdab() {
  return __cxx_static_address_cf2f73c77b6a658a3e91bdab.reference || (__cxx_static_address_cf2f73c77b6a658a3e91bdab.reference = {
    __cReference: true,
    get value() { return MASKWALL1____header_global_7c8805b27c3011a2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:286
export const W_TECHWALL1____header_global_331fd08d5f3ceeaa = ((((((293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2505d783bf6cccda4adc7b60() {
  return __cxx_static_address_2505d783bf6cccda4adc7b60.reference || (__cxx_static_address_2505d783bf6cccda4adc7b60.reference = {
    __cReference: true,
    get value() { return W_TECHWALL1____header_global_331fd08d5f3ceeaa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:287
export const W_TECHWALL2____header_global_aefc03fcc1485e82 = ((((((297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_63e0c70f26abf0f44e31ee2c() {
  return __cxx_static_address_63e0c70f26abf0f44e31ee2c.reference || (__cxx_static_address_63e0c70f26abf0f44e31ee2c.reference = {
    __cReference: true,
    get value() { return W_TECHWALL2____header_global_aefc03fcc1485e82; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:288
export const W_TECHWALL15____header_global_d485205cd2cee2e6 = ((((((299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a3343a33b505af187ebb6605() {
  return __cxx_static_address_a3343a33b505af187ebb6605.reference || (__cxx_static_address_a3343a33b505af187ebb6605.reference = {
    __cReference: true,
    get value() { return W_TECHWALL15____header_global_d485205cd2cee2e6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:289
export const W_TECHWALL3____header_global_903bca8847984685 = ((((((301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b64404b295efe4ff68c79176() {
  return __cxx_static_address_b64404b295efe4ff68c79176.reference || (__cxx_static_address_b64404b295efe4ff68c79176.reference = {
    __cReference: true,
    get value() { return W_TECHWALL3____header_global_903bca8847984685; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:290
export const W_TECHWALL4____header_global_7acaedb48c5e7bcb = ((((((305) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0bce5ff04ef9b6d309faa462() {
  return __cxx_static_address_0bce5ff04ef9b6d309faa462.reference || (__cxx_static_address_0bce5ff04ef9b6d309faa462.reference = {
    __cReference: true,
    get value() { return W_TECHWALL4____header_global_7acaedb48c5e7bcb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:291
export const W_TECHWALL10____header_global_ee60a0b0949d2ad0 = ((((((306) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_16043df3be3c8031664dd0ed() {
  return __cxx_static_address_16043df3be3c8031664dd0ed.reference || (__cxx_static_address_16043df3be3c8031664dd0ed.reference = {
    __cReference: true,
    get value() { return W_TECHWALL10____header_global_ee60a0b0949d2ad0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:292
export const W_TECHWALL16____header_global_41ec7351b6fb3ec7 = ((((((307) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8323c5ac3fa4e2f2441ee03c() {
  return __cxx_static_address_8323c5ac3fa4e2f2441ee03c.reference || (__cxx_static_address_8323c5ac3fa4e2f2441ee03c.reference = {
    __cReference: true,
    get value() { return W_TECHWALL16____header_global_41ec7351b6fb3ec7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:293
export const WATERTILE2____header_global_642d3f2e3dfc37ec = ((((((336) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_66c58aec8319cb3441649bb4() {
  return __cxx_static_address_66c58aec8319cb3441649bb4.reference || (__cxx_static_address_66c58aec8319cb3441649bb4.reference = {
    __cReference: true,
    get value() { return WATERTILE2____header_global_642d3f2e3dfc37ec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:294
export const BPANNEL1____header_global_6e61dd9ac0dd47b9 = ((((((341) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b4e131e96caa1e61a2bebe13() {
  return __cxx_static_address_b4e131e96caa1e61a2bebe13.reference || (__cxx_static_address_b4e131e96caa1e61a2bebe13.reference = {
    __cReference: true,
    get value() { return BPANNEL1____header_global_6e61dd9ac0dd47b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:295
export const PANNEL1____header_global_f8c3c7f5c0e2845e = ((((((342) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1f185840a14672c5783ce83d() {
  return __cxx_static_address_1f185840a14672c5783ce83d.reference || (__cxx_static_address_1f185840a14672c5783ce83d.reference = {
    __cReference: true,
    get value() { return PANNEL1____header_global_f8c3c7f5c0e2845e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:296
export const PANNEL2____header_global_72b065c3e12e5b53 = ((((((343) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3202f33e55734d519cac4918() {
  return __cxx_static_address_3202f33e55734d519cac4918.reference || (__cxx_static_address_3202f33e55734d519cac4918.reference = {
    __cReference: true,
    get value() { return PANNEL2____header_global_72b065c3e12e5b53; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:297
export const STATIC____header_global_d91374212507e4e4 = ((((((351) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0e6c9f8f3a0a82b32c3a80f1() {
  return __cxx_static_address_0e6c9f8f3a0a82b32c3a80f1.reference || (__cxx_static_address_0e6c9f8f3a0a82b32c3a80f1.reference = {
    __cReference: true,
    get value() { return STATIC____header_global_d91374212507e4e4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:298
export const W_SCREENBREAK____header_global_435cb90d311ab8f6 = ((((((357) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c498f043807acacc96f11ccf() {
  return __cxx_static_address_c498f043807acacc96f11ccf.reference || (__cxx_static_address_c498f043807acacc96f11ccf.reference = {
    __cReference: true,
    get value() { return W_SCREENBREAK____header_global_435cb90d311ab8f6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:299
export const W_HITTECHWALL3____header_global_cf6f28bc00b6a996 = ((((((360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_720ec7d463e643b826d76459() {
  return __cxx_static_address_720ec7d463e643b826d76459.reference || (__cxx_static_address_720ec7d463e643b826d76459.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL3____header_global_cf6f28bc00b6a996; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:300
export const W_HITTECHWALL4____header_global_1c08dbcbbe993a7d = ((((((361) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0f1deb698465a4a42d23c438() {
  return __cxx_static_address_0f1deb698465a4a42d23c438.reference || (__cxx_static_address_0f1deb698465a4a42d23c438.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL4____header_global_1c08dbcbbe993a7d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:301
export const W_HITTECHWALL2____header_global_89f5746a2ca82484 = ((((((362) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8de1603299a2aea1e4b21ee1() {
  return __cxx_static_address_8de1603299a2aea1e4b21ee1.reference || (__cxx_static_address_8de1603299a2aea1e4b21ee1.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL2____header_global_89f5746a2ca82484; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:302
export const W_HITTECHWALL1____header_global_8354676b97c8c90d = ((((((363) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b71daaaff66e871c5dff5a3d() {
  return __cxx_static_address_b71daaaff66e871c5dff5a3d.reference || (__cxx_static_address_b71daaaff66e871c5dff5a3d.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL1____header_global_8354676b97c8c90d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:303
export const MASKWALL10____header_global_543ae87867a3acad = ((((((387) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7891ae0390dd8a389af2e30c() {
  return __cxx_static_address_7891ae0390dd8a389af2e30c.reference || (__cxx_static_address_7891ae0390dd8a389af2e30c.reference = {
    __cReference: true,
    get value() { return MASKWALL10____header_global_543ae87867a3acad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:304
export const MASKWALL11____header_global_c907a5ded0b54996 = ((((((391) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a0da927c31f4bc416ad3ed4e() {
  return __cxx_static_address_a0da927c31f4bc416ad3ed4e.reference || (__cxx_static_address_a0da927c31f4bc416ad3ed4e.reference = {
    __cReference: true,
    get value() { return MASKWALL11____header_global_c907a5ded0b54996; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:305
export const DOORTILE22____header_global_28b1a2d10419bbaa = ((((((395) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_143ddb129cda3d06bfd6a109() {
  return __cxx_static_address_143ddb129cda3d06bfd6a109.reference || (__cxx_static_address_143ddb129cda3d06bfd6a109.reference = {
    __cReference: true,
    get value() { return DOORTILE22____header_global_28b1a2d10419bbaa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:306
export const FANSPRITE____header_global_c5aa319e0361c20d = ((((((407) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6b225126d7ff08a7e6fd8ac4() {
  return __cxx_static_address_6b225126d7ff08a7e6fd8ac4.reference || (__cxx_static_address_6b225126d7ff08a7e6fd8ac4.reference = {
    __cReference: true,
    get value() { return FANSPRITE____header_global_c5aa319e0361c20d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:307
export const FANSPRITEBROKE____header_global_d2655d7b530b7f44 = ((((((411) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_397b8d3a242c5fc3e1a7ab3a() {
  return __cxx_static_address_397b8d3a242c5fc3e1a7ab3a.reference || (__cxx_static_address_397b8d3a242c5fc3e1a7ab3a.reference = {
    __cReference: true,
    get value() { return FANSPRITEBROKE____header_global_d2655d7b530b7f44; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:308
export const FANSHADOW____header_global_292f25685185a5c6 = ((((((412) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f2e65c237c0a6e8bcc139893() {
  return __cxx_static_address_f2e65c237c0a6e8bcc139893.reference || (__cxx_static_address_f2e65c237c0a6e8bcc139893.reference = {
    __cReference: true,
    get value() { return FANSHADOW____header_global_292f25685185a5c6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:309
export const FANSHADOWBROKE____header_global_8c99528e1140d366 = ((((((416) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0cc509638bf3186bafffe00c() {
  return __cxx_static_address_0cc509638bf3186bafffe00c.reference || (__cxx_static_address_0cc509638bf3186bafffe00c.reference = {
    __cReference: true,
    get value() { return FANSHADOWBROKE____header_global_8c99528e1140d366; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:310
export const DOORTILE18____header_global_1bd4b57ef999e53a = ((((((447) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6a08bbf32ead8e2f03a989bc() {
  return __cxx_static_address_6a08bbf32ead8e2f03a989bc.reference || (__cxx_static_address_6a08bbf32ead8e2f03a989bc.reference = {
    __cReference: true,
    get value() { return DOORTILE18____header_global_1bd4b57ef999e53a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:311
export const DOORTILE19____header_global_d72cffd81371df91 = ((((((448) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4de0dab2e4f36b48a7e82f94() {
  return __cxx_static_address_4de0dab2e4f36b48a7e82f94.reference || (__cxx_static_address_4de0dab2e4f36b48a7e82f94.reference = {
    __cReference: true,
    get value() { return DOORTILE19____header_global_d72cffd81371df91; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:312
export const DOORTILE20____header_global_6471fe093df31a86 = ((((((449) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_04fb225e8eb5877be179f513() {
  return __cxx_static_address_04fb225e8eb5877be179f513.reference || (__cxx_static_address_04fb225e8eb5877be179f513.reference = {
    __cReference: true,
    get value() { return DOORTILE20____header_global_6471fe093df31a86; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:313
export const VIEWSCREEN2____header_global_3b93441978699ed5 = ((((((499) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_22b519f376870e76156ae957() {
  return __cxx_static_address_22b519f376870e76156ae957.reference || (__cxx_static_address_22b519f376870e76156ae957.reference = {
    __cReference: true,
    get value() { return VIEWSCREEN2____header_global_3b93441978699ed5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:314
export const VIEWSCREEN____header_global_b8156fa7aa0b1201 = ((((((502) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1820d3b8c24e1005bfbd46fe() {
  return __cxx_static_address_1820d3b8c24e1005bfbd46fe.reference || (__cxx_static_address_1820d3b8c24e1005bfbd46fe.reference = {
    __cReference: true,
    get value() { return VIEWSCREEN____header_global_b8156fa7aa0b1201; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:315
export const GLASS____header_global_3501ced86ef91cac = ((((((503) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6c8ee7043e198f3a4f3bec64() {
  return __cxx_static_address_6c8ee7043e198f3a4f3bec64.reference || (__cxx_static_address_6c8ee7043e198f3a4f3bec64.reference = {
    __cReference: true,
    get value() { return GLASS____header_global_3501ced86ef91cac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:316
export const GLASS2____header_global_37cf7bae623d225f = ((((((504) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b59ba6037f1271c7d799220c() {
  return __cxx_static_address_b59ba6037f1271c7d799220c.reference || (__cxx_static_address_b59ba6037f1271c7d799220c.reference = {
    __cReference: true,
    get value() { return GLASS2____header_global_37cf7bae623d225f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:317
export const STAINGLASS1____header_global_7204fd2145f4ff64 = ((((((510) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a95a076f48d76ae2e013cb4d() {
  return __cxx_static_address_a95a076f48d76ae2e013cb4d.reference || (__cxx_static_address_a95a076f48d76ae2e013cb4d.reference = {
    __cReference: true,
    get value() { return STAINGLASS1____header_global_7204fd2145f4ff64; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:318
export const MASKWALL5____header_global_79bffc071b25a0e1 = ((((((514) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1f1f6023dbe1e198653c8119() {
  return __cxx_static_address_1f1f6023dbe1e198653c8119.reference || (__cxx_static_address_1f1f6023dbe1e198653c8119.reference = {
    __cReference: true,
    get value() { return MASKWALL5____header_global_79bffc071b25a0e1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:319
export const SATELITE____header_global_63f152f1e532e997 = ((((((516) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8654e417931257df19919a6b() {
  return __cxx_static_address_8654e417931257df19919a6b.reference || (__cxx_static_address_8654e417931257df19919a6b.reference = {
    __cReference: true,
    get value() { return SATELITE____header_global_63f152f1e532e997; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:320
export const FUELPOD____header_global_35314b55ab7e5114 = ((((((517) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bc63b2c79a23652bdb391af0() {
  return __cxx_static_address_bc63b2c79a23652bdb391af0.reference || (__cxx_static_address_bc63b2c79a23652bdb391af0.reference = {
    __cReference: true,
    get value() { return FUELPOD____header_global_35314b55ab7e5114; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:321
export const CRACK1____header_global_582fc15988d45dd8 = ((((((546) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4f2e091379412edfd60e6b97() {
  return __cxx_static_address_4f2e091379412edfd60e6b97.reference || (__cxx_static_address_4f2e091379412edfd60e6b97.reference = {
    __cReference: true,
    get value() { return CRACK1____header_global_582fc15988d45dd8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:322
export const CRACK2____header_global_27589ade7778d3a4 = ((((((547) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_49f7eec11fb350d0d93ba46f() {
  return __cxx_static_address_49f7eec11fb350d0d93ba46f.reference || (__cxx_static_address_49f7eec11fb350d0d93ba46f.reference = {
    __cReference: true,
    get value() { return CRACK2____header_global_27589ade7778d3a4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:323
export const CRACK3____header_global_1ac7728c55259583 = ((((((548) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8130303b3650f49824215701() {
  return __cxx_static_address_8130303b3650f49824215701.reference || (__cxx_static_address_8130303b3650f49824215701.reference = {
    __cReference: true,
    get value() { return CRACK3____header_global_1ac7728c55259583; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:324
export const CRACK4____header_global_489b1599fccd4982 = ((((((549) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ad029fc6031735b96b397a9b() {
  return __cxx_static_address_ad029fc6031735b96b397a9b.reference || (__cxx_static_address_ad029fc6031735b96b397a9b.reference = {
    __cReference: true,
    get value() { return CRACK4____header_global_489b1599fccd4982; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:325
export const FOOTPRINTS____header_global_6719695f1e8cdc4c = ((((((550) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5bec7e808cd929b6e2eb4611() {
  return __cxx_static_address_5bec7e808cd929b6e2eb4611.reference || (__cxx_static_address_5bec7e808cd929b6e2eb4611.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS____header_global_6719695f1e8cdc4c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:326
export const DOMELITE____header_global_933a0fa87bb9ee7b = ((((((551) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_547f743adab2a2156dde1115() {
  return __cxx_static_address_547f743adab2a2156dde1115.reference || (__cxx_static_address_547f743adab2a2156dde1115.reference = {
    __cReference: true,
    get value() { return DOMELITE____header_global_933a0fa87bb9ee7b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:327
export const CAMERAPOLE____header_global_96aa34b9e8475185 = ((((((554) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_24cae302fa3c9330dcf24091() {
  return __cxx_static_address_24cae302fa3c9330dcf24091.reference || (__cxx_static_address_24cae302fa3c9330dcf24091.reference = {
    __cReference: true,
    get value() { return CAMERAPOLE____header_global_96aa34b9e8475185; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:328
export const CHAIR1____header_global_668518ba7206261d = ((((((556) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6784dc3cf70ef4056f8cf245() {
  return __cxx_static_address_6784dc3cf70ef4056f8cf245.reference || (__cxx_static_address_6784dc3cf70ef4056f8cf245.reference = {
    __cReference: true,
    get value() { return CHAIR1____header_global_668518ba7206261d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:329
export const CHAIR2____header_global_73e516841fda6796 = ((((((557) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a8f11bd60b2ebb0c6724d9f8() {
  return __cxx_static_address_a8f11bd60b2ebb0c6724d9f8.reference || (__cxx_static_address_a8f11bd60b2ebb0c6724d9f8.reference = {
    __cReference: true,
    get value() { return CHAIR2____header_global_73e516841fda6796; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:330
export const BROKENCHAIR____header_global_053686b7d0c0d381 = ((((((559) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_33c09494c7668b4f735e034a() {
  return __cxx_static_address_33c09494c7668b4f735e034a.reference || (__cxx_static_address_33c09494c7668b4f735e034a.reference = {
    __cReference: true,
    get value() { return BROKENCHAIR____header_global_053686b7d0c0d381; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:331
export const MIRROR____header_global_9105df72786e8fe2 = ((((((560) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2bb2a33ba224a7d91bf8c56b() {
  return __cxx_static_address_2bb2a33ba224a7d91bf8c56b.reference || (__cxx_static_address_2bb2a33ba224a7d91bf8c56b.reference = {
    __cReference: true,
    get value() { return MIRROR____header_global_9105df72786e8fe2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:332
export const WATERFOUNTAIN____header_global_e98207b45835a7fe = ((((((563) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3341d40658ad979b16476b41() {
  return __cxx_static_address_3341d40658ad979b16476b41.reference || (__cxx_static_address_3341d40658ad979b16476b41.reference = {
    __cReference: true,
    get value() { return WATERFOUNTAIN____header_global_e98207b45835a7fe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:333
export const WATERFOUNTAINBROKE____header_global_a929b787e1b70112 = ((((((567) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ae228c9b0bc74316b9db16e8() {
  return __cxx_static_address_ae228c9b0bc74316b9db16e8.reference || (__cxx_static_address_ae228c9b0bc74316b9db16e8.reference = {
    __cReference: true,
    get value() { return WATERFOUNTAINBROKE____header_global_a929b787e1b70112; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:334
export const FEMMAG1____header_global_f35f1b1aac0c4c37 = ((((((568) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_344b0863ef90f97ed1f75c6c() {
  return __cxx_static_address_344b0863ef90f97ed1f75c6c.reference || (__cxx_static_address_344b0863ef90f97ed1f75c6c.reference = {
    __cReference: true,
    get value() { return FEMMAG1____header_global_f35f1b1aac0c4c37; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:335
export const TOILET____header_global_ddf182686b26218d = ((((((569) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_854f2d50ab3525c6c0383add() {
  return __cxx_static_address_854f2d50ab3525c6c0383add.reference || (__cxx_static_address_854f2d50ab3525c6c0383add.reference = {
    __cReference: true,
    get value() { return TOILET____header_global_ddf182686b26218d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:336
export const STALL____header_global_1110d883433aabb3 = ((((((571) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5b528ff30f3fad79ddf35042() {
  return __cxx_static_address_5b528ff30f3fad79ddf35042.reference || (__cxx_static_address_5b528ff30f3fad79ddf35042.reference = {
    __cReference: true,
    get value() { return STALL____header_global_1110d883433aabb3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:337
export const STALLBROKE____header_global_36686405d96be775 = ((((((573) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b273233aa6f3654e7ff50736() {
  return __cxx_static_address_b273233aa6f3654e7ff50736.reference || (__cxx_static_address_b273233aa6f3654e7ff50736.reference = {
    __cReference: true,
    get value() { return STALLBROKE____header_global_36686405d96be775; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:338
export const FEMMAG2____header_global_01a5829d1a3448f6 = ((((((577) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9cdafa45ac2bdbcf6c43f6f5() {
  return __cxx_static_address_9cdafa45ac2bdbcf6c43f6f5.reference || (__cxx_static_address_9cdafa45ac2bdbcf6c43f6f5.reference = {
    __cReference: true,
    get value() { return FEMMAG2____header_global_01a5829d1a3448f6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:339
export const REACTOR2____header_global_557dd3926e97df54 = ((((((578) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b6be0ffdebc035874d67180b() {
  return __cxx_static_address_b6be0ffdebc035874d67180b.reference || (__cxx_static_address_b6be0ffdebc035874d67180b.reference = {
    __cReference: true,
    get value() { return REACTOR2____header_global_557dd3926e97df54; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:340
export const REACTOR2BURNT____header_global_3e84abde314f6817 = ((((((579) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e8f7ea759a87867198a0d163() {
  return __cxx_static_address_e8f7ea759a87867198a0d163.reference || (__cxx_static_address_e8f7ea759a87867198a0d163.reference = {
    __cReference: true,
    get value() { return REACTOR2BURNT____header_global_3e84abde314f6817; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:341
export const REACTOR2SPARK____header_global_06ce31ce9bdd2403 = ((((((580) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_27131df3cccca49659b91d60() {
  return __cxx_static_address_27131df3cccca49659b91d60.reference || (__cxx_static_address_27131df3cccca49659b91d60.reference = {
    __cReference: true,
    get value() { return REACTOR2SPARK____header_global_06ce31ce9bdd2403; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:342
export const GRATE1____header_global_2370451541e29362 = ((((((595) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c5006e62d7a66837edb53295() {
  return __cxx_static_address_c5006e62d7a66837edb53295.reference || (__cxx_static_address_c5006e62d7a66837edb53295.reference = {
    __cReference: true,
    get value() { return GRATE1____header_global_2370451541e29362; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:343
export const BGRATE1____header_global_89356b999931f13b = ((((((596) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_afae4cba5a16dbec9f8e6b58() {
  return __cxx_static_address_afae4cba5a16dbec9f8e6b58.reference || (__cxx_static_address_afae4cba5a16dbec9f8e6b58.reference = {
    __cReference: true,
    get value() { return BGRATE1____header_global_89356b999931f13b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:344
export const SOLARPANNEL____header_global_bccc54dd4126bdc0 = ((((((602) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_25f571a6cde46e372cc7e5f9() {
  return __cxx_static_address_25f571a6cde46e372cc7e5f9.reference || (__cxx_static_address_25f571a6cde46e372cc7e5f9.reference = {
    __cReference: true,
    get value() { return SOLARPANNEL____header_global_bccc54dd4126bdc0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:345
export const NAKED1____header_global_c4a1d270299cec9f = ((((((603) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_79ba7afe73d93cd2105731a1() {
  return __cxx_static_address_79ba7afe73d93cd2105731a1.reference || (__cxx_static_address_79ba7afe73d93cd2105731a1.reference = {
    __cReference: true,
    get value() { return NAKED1____header_global_c4a1d270299cec9f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:346
export const ANTENNA____header_global_2554141e9c6a9f06 = ((((((607) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_46f4cdb8a1f3563149a35593() {
  return __cxx_static_address_46f4cdb8a1f3563149a35593.reference || (__cxx_static_address_46f4cdb8a1f3563149a35593.reference = {
    __cReference: true,
    get value() { return ANTENNA____header_global_2554141e9c6a9f06; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:347
export const MASKWALL12____header_global_a3c2877a14ab0828 = ((((((609) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_835142865d7e82b2ae21750a() {
  return __cxx_static_address_835142865d7e82b2ae21750a.reference || (__cxx_static_address_835142865d7e82b2ae21750a.reference = {
    __cReference: true,
    get value() { return MASKWALL12____header_global_a3c2877a14ab0828; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:348
export const TOILETBROKE____header_global_fffe07815f6686e8 = ((((((615) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ca39c871b97247c50cae8fcb() {
  return __cxx_static_address_ca39c871b97247c50cae8fcb.reference || (__cxx_static_address_ca39c871b97247c50cae8fcb.reference = {
    __cReference: true,
    get value() { return TOILETBROKE____header_global_fffe07815f6686e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:349
export const PIPE2____header_global_4c80c380ea606344 = ((((((616) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_38b0703e4f9d4b2afef94f48() {
  return __cxx_static_address_38b0703e4f9d4b2afef94f48.reference || (__cxx_static_address_38b0703e4f9d4b2afef94f48.reference = {
    __cReference: true,
    get value() { return PIPE2____header_global_4c80c380ea606344; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:350
export const PIPE1B____header_global_aa060e9fa89070e7 = ((((((617) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4487e06d7fc3a63b146938a1() {
  return __cxx_static_address_4487e06d7fc3a63b146938a1.reference || (__cxx_static_address_4487e06d7fc3a63b146938a1.reference = {
    __cReference: true,
    get value() { return PIPE1B____header_global_aa060e9fa89070e7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:351
export const PIPE3____header_global_cf307956e6041ff9 = ((((((618) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d59fe50a24ac96cb9c5f7c81() {
  return __cxx_static_address_d59fe50a24ac96cb9c5f7c81.reference || (__cxx_static_address_d59fe50a24ac96cb9c5f7c81.reference = {
    __cReference: true,
    get value() { return PIPE3____header_global_cf307956e6041ff9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:352
export const PIPE1____header_global_d84a5046713428c9 = ((((((619) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_220a5983d8cd552cef86588c() {
  return __cxx_static_address_220a5983d8cd552cef86588c.reference || (__cxx_static_address_220a5983d8cd552cef86588c.reference = {
    __cReference: true,
    get value() { return PIPE1____header_global_d84a5046713428c9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:353
export const CAMERA1____header_global_0d32e42f0c2ce88e = ((((((621) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6bf038f7fabfe570bebec47b() {
  return __cxx_static_address_6bf038f7fabfe570bebec47b.reference || (__cxx_static_address_6bf038f7fabfe570bebec47b.reference = {
    __cReference: true,
    get value() { return CAMERA1____header_global_0d32e42f0c2ce88e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:354
export const PIPE2B____header_global_6b56f2a6f55f61a6 = ((((((633) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_24256c3c229f790b8d09e798() {
  return __cxx_static_address_24256c3c229f790b8d09e798.reference || (__cxx_static_address_24256c3c229f790b8d09e798.reference = {
    __cReference: true,
    get value() { return PIPE2B____header_global_6b56f2a6f55f61a6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:355
export const BOLT1____header_global_e5b95e671fdeaa00 = ((((((634) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_80070f96efa342a4c5784576() {
  return __cxx_static_address_80070f96efa342a4c5784576.reference || (__cxx_static_address_80070f96efa342a4c5784576.reference = {
    __cReference: true,
    get value() { return BOLT1____header_global_e5b95e671fdeaa00; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:356
export const W_NUMBERS____header_global_4fae8359e9f4166f = ((((((640) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f38a2a98ec9d5cf20e3de61b() {
  return __cxx_static_address_f38a2a98ec9d5cf20e3de61b.reference || (__cxx_static_address_f38a2a98ec9d5cf20e3de61b.reference = {
    __cReference: true,
    get value() { return W_NUMBERS____header_global_4fae8359e9f4166f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:357
export const WATERDRIP____header_global_e267fb5a1c7273e6 = ((((((660) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_deb65c8ccdc7eca3f36160f8() {
  return __cxx_static_address_deb65c8ccdc7eca3f36160f8.reference || (__cxx_static_address_deb65c8ccdc7eca3f36160f8.reference = {
    __cReference: true,
    get value() { return WATERDRIP____header_global_e267fb5a1c7273e6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:358
export const WATERBUBBLE____header_global_9b1bf3a4cbdd3d15 = ((((((661) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_366a1c6d41e9064d74c5ca23() {
  return __cxx_static_address_366a1c6d41e9064d74c5ca23.reference || (__cxx_static_address_366a1c6d41e9064d74c5ca23.reference = {
    __cReference: true,
    get value() { return WATERBUBBLE____header_global_9b1bf3a4cbdd3d15; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:359
export const WATERBUBBLEMAKER____header_global_7d227ae93c449ef5 = ((((((662) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6012a555d243e35d3f095193() {
  return __cxx_static_address_6012a555d243e35d3f095193.reference || (__cxx_static_address_6012a555d243e35d3f095193.reference = {
    __cReference: true,
    get value() { return WATERBUBBLEMAKER____header_global_7d227ae93c449ef5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:360
export const W_FORCEFIELD____header_global_00a5bd5babdb3a29 = ((((((663) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e29acc79c2fc66b2fab139ad() {
  return __cxx_static_address_e29acc79c2fc66b2fab139ad.reference || (__cxx_static_address_e29acc79c2fc66b2fab139ad.reference = {
    __cReference: true,
    get value() { return W_FORCEFIELD____header_global_00a5bd5babdb3a29; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:361
export const VACUUM____header_global_55e0447142ac8117 = ((((((669) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a141fc94530b64d0e9d4c205() {
  return __cxx_static_address_a141fc94530b64d0e9d4c205.reference || (__cxx_static_address_a141fc94530b64d0e9d4c205.reference = {
    __cReference: true,
    get value() { return VACUUM____header_global_55e0447142ac8117; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:362
export const FOOTPRINTS2____header_global_5e8ba4e749edff02 = ((((((672) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a899def88b3f03d40de57575() {
  return __cxx_static_address_a899def88b3f03d40de57575.reference || (__cxx_static_address_a899def88b3f03d40de57575.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS2____header_global_5e8ba4e749edff02; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:363
export const FOOTPRINTS3____header_global_8cea5b90d0f38595 = ((((((673) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dd9d17aa9e1952a58dc48345() {
  return __cxx_static_address_dd9d17aa9e1952a58dc48345.reference || (__cxx_static_address_dd9d17aa9e1952a58dc48345.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS3____header_global_8cea5b90d0f38595; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:364
export const FOOTPRINTS4____header_global_13d88909a847bf20 = ((((((674) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_82e8dc47c8375f4d317d0e4d() {
  return __cxx_static_address_82e8dc47c8375f4d317d0e4d.reference || (__cxx_static_address_82e8dc47c8375f4d317d0e4d.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS4____header_global_13d88909a847bf20; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:365
export const EGG____header_global_082637c97f64371a = ((((((675) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9b638816d31792167522c53d() {
  return __cxx_static_address_9b638816d31792167522c53d.reference || (__cxx_static_address_9b638816d31792167522c53d.reference = {
    __cReference: true,
    get value() { return EGG____header_global_082637c97f64371a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:366
export const SCALE____header_global_f5a1acd54c9ad138 = ((((((678) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e39208074882bdce90bf0254() {
  return __cxx_static_address_e39208074882bdce90bf0254.reference || (__cxx_static_address_e39208074882bdce90bf0254.reference = {
    __cReference: true,
    get value() { return SCALE____header_global_f5a1acd54c9ad138; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:367
export const CHAIR3____header_global_b45cd91c915c8ade = ((((((680) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c0249959e2b631c4f3818eb3() {
  return __cxx_static_address_c0249959e2b631c4f3818eb3.reference || (__cxx_static_address_c0249959e2b631c4f3818eb3.reference = {
    __cReference: true,
    get value() { return CHAIR3____header_global_b45cd91c915c8ade; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:368
export const CAMERALIGHT____header_global_a0cd18b4dcb6c9fb = ((((((685) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_985fcda97410c3803229ca3e() {
  return __cxx_static_address_985fcda97410c3803229ca3e.reference || (__cxx_static_address_985fcda97410c3803229ca3e.reference = {
    __cReference: true,
    get value() { return CAMERALIGHT____header_global_a0cd18b4dcb6c9fb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:369
export const MOVIECAMERA____header_global_f3f62c904ad51ea6 = ((((((686) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c81329c3b370550a2af9d645() {
  return __cxx_static_address_c81329c3b370550a2af9d645.reference || (__cxx_static_address_c81329c3b370550a2af9d645.reference = {
    __cReference: true,
    get value() { return MOVIECAMERA____header_global_f3f62c904ad51ea6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:370
export const IVUNIT____header_global_1e838cfe3dd56925 = ((((((689) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2c3ee5793ad10cd01fd3ed4a() {
  return __cxx_static_address_2c3ee5793ad10cd01fd3ed4a.reference || (__cxx_static_address_2c3ee5793ad10cd01fd3ed4a.reference = {
    __cReference: true,
    get value() { return IVUNIT____header_global_1e838cfe3dd56925; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:371
export const POT1____header_global_ff8f7ea533a4d63b = ((((((694) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_057c0640538e96d12c46e75b() {
  return __cxx_static_address_057c0640538e96d12c46e75b.reference || (__cxx_static_address_057c0640538e96d12c46e75b.reference = {
    __cReference: true,
    get value() { return POT1____header_global_ff8f7ea533a4d63b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:372
export const POT2____header_global_8e15b6ded69ace98 = ((((((695) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_48525a617d92795759aa26db() {
  return __cxx_static_address_48525a617d92795759aa26db.reference || (__cxx_static_address_48525a617d92795759aa26db.reference = {
    __cReference: true,
    get value() { return POT2____header_global_8e15b6ded69ace98; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:373
export const POT3____header_global_191d3e4f8255f610 = ((((((697) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_77fd9bdacbaae6be187e7f71() {
  return __cxx_static_address_77fd9bdacbaae6be187e7f71.reference || (__cxx_static_address_77fd9bdacbaae6be187e7f71.reference = {
    __cReference: true,
    get value() { return POT3____header_global_191d3e4f8255f610; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:374
export const PIPE3B____header_global_26bdc8b8264a7871 = ((((((700) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_45853ea726c94555fae3fbb4() {
  return __cxx_static_address_45853ea726c94555fae3fbb4.reference || (__cxx_static_address_45853ea726c94555fae3fbb4.reference = {
    __cReference: true,
    get value() { return PIPE3B____header_global_26bdc8b8264a7871; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:375
export const WALLLIGHT3____header_global_570bfa210ce45361 = ((((((701) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_22842c911a7ce7cd7e211ad5() {
  return __cxx_static_address_22842c911a7ce7cd7e211ad5.reference || (__cxx_static_address_22842c911a7ce7cd7e211ad5.reference = {
    __cReference: true,
    get value() { return WALLLIGHT3____header_global_570bfa210ce45361; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:376
export const WALLLIGHTBUST3____header_global_966b1d8dd3fc06d9 = ((((((702) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4b3ddca9a60efdb97a16a139() {
  return __cxx_static_address_4b3ddca9a60efdb97a16a139.reference || (__cxx_static_address_4b3ddca9a60efdb97a16a139.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST3____header_global_966b1d8dd3fc06d9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:377
export const WALLLIGHT1____header_global_77a7423f1b8fa8f0 = ((((((703) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_de8bcc19317a8d727e83aa4a() {
  return __cxx_static_address_de8bcc19317a8d727e83aa4a.reference || (__cxx_static_address_de8bcc19317a8d727e83aa4a.reference = {
    __cReference: true,
    get value() { return WALLLIGHT1____header_global_77a7423f1b8fa8f0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:378
export const WALLLIGHTBUST1____header_global_ee9ee00a9b1185b1 = ((((((704) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_28f7044009a562e3ae77502d() {
  return __cxx_static_address_28f7044009a562e3ae77502d.reference || (__cxx_static_address_28f7044009a562e3ae77502d.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST1____header_global_ee9ee00a9b1185b1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:379
export const WALLLIGHT2____header_global_eb0adf03591c25df = ((((((705) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_87fa4ff997afa8a3519b5dce() {
  return __cxx_static_address_87fa4ff997afa8a3519b5dce.reference || (__cxx_static_address_87fa4ff997afa8a3519b5dce.reference = {
    __cReference: true,
    get value() { return WALLLIGHT2____header_global_eb0adf03591c25df; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:380
export const WALLLIGHTBUST2____header_global_4af2074a279ed2af = ((((((706) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7f046bd2e5715f801dcfb27d() {
  return __cxx_static_address_7f046bd2e5715f801dcfb27d.reference || (__cxx_static_address_7f046bd2e5715f801dcfb27d.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST2____header_global_4af2074a279ed2af; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:381
export const LIGHTSWITCH2____header_global_048a9ae05bf63743 = ((((((712) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bd2255b8f073efb74eb6285c() {
  return __cxx_static_address_bd2255b8f073efb74eb6285c.reference || (__cxx_static_address_bd2255b8f073efb74eb6285c.reference = {
    __cReference: true,
    get value() { return LIGHTSWITCH2____header_global_048a9ae05bf63743; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:382
export const WAITTOBESEATED____header_global_68ef6810c76d9512 = ((((((716) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_62da5fbb7649b8f11feab45d() {
  return __cxx_static_address_62da5fbb7649b8f11feab45d.reference || (__cxx_static_address_62da5fbb7649b8f11feab45d.reference = {
    __cReference: true,
    get value() { return WAITTOBESEATED____header_global_68ef6810c76d9512; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:383
export const DOORTILE14____header_global_8f764eb245c46401 = ((((((717) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cd5c6882abf4e5322e4428ca() {
  return __cxx_static_address_cd5c6882abf4e5322e4428ca.reference || (__cxx_static_address_cd5c6882abf4e5322e4428ca.reference = {
    __cReference: true,
    get value() { return DOORTILE14____header_global_8f764eb245c46401; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:384
export const STATUE____header_global_2832cdf4650fe9bd = ((((((753) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ccaa31ca931dfc6d51ea9854() {
  return __cxx_static_address_ccaa31ca931dfc6d51ea9854.reference || (__cxx_static_address_ccaa31ca931dfc6d51ea9854.reference = {
    __cReference: true,
    get value() { return STATUE____header_global_2832cdf4650fe9bd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:385
export const MIKE____header_global_41e9474b2cfbca40 = ((((((762) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bed9b7fd0ec06f00cd17556c() {
  return __cxx_static_address_bed9b7fd0ec06f00cd17556c.reference || (__cxx_static_address_bed9b7fd0ec06f00cd17556c.reference = {
    __cReference: true,
    get value() { return MIKE____header_global_41e9474b2cfbca40; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:386
export const VASE____header_global_dbd97ee9dc0c6b96 = ((((((765) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_02360aa8ba47f7fe64f3370d() {
  return __cxx_static_address_02360aa8ba47f7fe64f3370d.reference || (__cxx_static_address_02360aa8ba47f7fe64f3370d.reference = {
    __cReference: true,
    get value() { return VASE____header_global_dbd97ee9dc0c6b96; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:387
export const SUSHIPLATE1____header_global_ab583d9e50f351c4 = ((((((768) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e1ba3d907a6d91c929db6030() {
  return __cxx_static_address_e1ba3d907a6d91c929db6030.reference || (__cxx_static_address_e1ba3d907a6d91c929db6030.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE1____header_global_ab583d9e50f351c4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:388
export const SUSHIPLATE2____header_global_8b89941377d0849b = ((((((769) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cedd72f2248f1d295a803970() {
  return __cxx_static_address_cedd72f2248f1d295a803970.reference || (__cxx_static_address_cedd72f2248f1d295a803970.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE2____header_global_8b89941377d0849b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:389
export const SUSHIPLATE3____header_global_4674ef54c776c01a = ((((((774) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cee64ea4fc9b014461e85888() {
  return __cxx_static_address_cee64ea4fc9b014461e85888.reference || (__cxx_static_address_cee64ea4fc9b014461e85888.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE3____header_global_4674ef54c776c01a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:390
export const SUSHIPLATE4____header_global_f1d7785d49f09282 = ((((((779) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b73766d32b1167db89afca65() {
  return __cxx_static_address_b73766d32b1167db89afca65.reference || (__cxx_static_address_b73766d32b1167db89afca65.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE4____header_global_f1d7785d49f09282; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:391
export const DOORTILE16____header_global_c3fd1767bc2f7424 = ((((((781) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_39ce8c80917a5ee394cdb5dd() {
  return __cxx_static_address_39ce8c80917a5ee394cdb5dd.reference || (__cxx_static_address_39ce8c80917a5ee394cdb5dd.reference = {
    __cReference: true,
    get value() { return DOORTILE16____header_global_c3fd1767bc2f7424; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:392
export const SUSHIPLATE5____header_global_352834619b98ee86 = ((((((792) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e3a6bcbf7815281fb7de3579() {
  return __cxx_static_address_e3a6bcbf7815281fb7de3579.reference || (__cxx_static_address_e3a6bcbf7815281fb7de3579.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE5____header_global_352834619b98ee86; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:393
export const OJ____header_global_44840b65f91cfe2d = ((((((806) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2c53ba0ac5b2ea0646b592a6() {
  return __cxx_static_address_2c53ba0ac5b2ea0646b592a6.reference || (__cxx_static_address_2c53ba0ac5b2ea0646b592a6.reference = {
    __cReference: true,
    get value() { return OJ____header_global_44840b65f91cfe2d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:394
export const MASKWALL13____header_global_20ebe7250bb87f3a = ((((((830) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c0fa144b86de72647345085f() {
  return __cxx_static_address_c0fa144b86de72647345085f.reference || (__cxx_static_address_c0fa144b86de72647345085f.reference = {
    __cReference: true,
    get value() { return MASKWALL13____header_global_20ebe7250bb87f3a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:395
export const HURTRAIL____header_global_f73f4e3fc4997d49 = ((((((859) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7f04707c39f4d7bd3c6a46de() {
  return __cxx_static_address_7f04707c39f4d7bd3c6a46de.reference || (__cxx_static_address_7f04707c39f4d7bd3c6a46de.reference = {
    __cReference: true,
    get value() { return HURTRAIL____header_global_f73f4e3fc4997d49; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:396
export const POWERSWITCH1____header_global_e984035bae5cee5a = ((((((860) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e0fb8a192c7be1dc48aa20cf() {
  return __cxx_static_address_e0fb8a192c7be1dc48aa20cf.reference || (__cxx_static_address_e0fb8a192c7be1dc48aa20cf.reference = {
    __cReference: true,
    get value() { return POWERSWITCH1____header_global_e984035bae5cee5a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:397
export const LOCKSWITCH1____header_global_a25d2a5ee5d7f4bd = ((((((862) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1760ca09be445c2076858839() {
  return __cxx_static_address_1760ca09be445c2076858839.reference || (__cxx_static_address_1760ca09be445c2076858839.reference = {
    __cReference: true,
    get value() { return LOCKSWITCH1____header_global_a25d2a5ee5d7f4bd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:398
export const POWERSWITCH2____header_global_350135484016ff9b = ((((((864) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2c20fb65a6cf1378bc1a4154() {
  return __cxx_static_address_2c20fb65a6cf1378bc1a4154.reference || (__cxx_static_address_2c20fb65a6cf1378bc1a4154.reference = {
    __cReference: true,
    get value() { return POWERSWITCH2____header_global_350135484016ff9b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:399
export const ATM____header_global_d172758649b7d37d = ((((((867) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_be61a430b40ff5f767d3240b() {
  return __cxx_static_address_be61a430b40ff5f767d3240b.reference || (__cxx_static_address_be61a430b40ff5f767d3240b.reference = {
    __cReference: true,
    get value() { return ATM____header_global_d172758649b7d37d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:400
export const STATUEFLASH____header_global_be2f2b9e3f2cb30c = ((((((869) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cc9e4f0c506a8ce8395499bb() {
  return __cxx_static_address_cc9e4f0c506a8ce8395499bb.reference || (__cxx_static_address_cc9e4f0c506a8ce8395499bb.reference = {
    __cReference: true,
    get value() { return STATUEFLASH____header_global_be2f2b9e3f2cb30c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:401
export const ATMBROKE____header_global_37a4ece8de3550d5 = ((((((888) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_682d4e23f04b77e4543fdbbb() {
  return __cxx_static_address_682d4e23f04b77e4543fdbbb.reference || (__cxx_static_address_682d4e23f04b77e4543fdbbb.reference = {
    __cReference: true,
    get value() { return ATMBROKE____header_global_37a4ece8de3550d5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:402
export const STRIPEBALL____header_global_3fe75a520d0864aa = ((((((901) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_704085ca41140af23d3c6c12() {
  return __cxx_static_address_704085ca41140af23d3c6c12.reference || (__cxx_static_address_704085ca41140af23d3c6c12.reference = {
    __cReference: true,
    get value() { return STRIPEBALL____header_global_3fe75a520d0864aa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:403
export const QUEBALL____header_global_3963e191aab8f8fe = ((((((902) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f7bc75f92f2dd65209082e9e() {
  return __cxx_static_address_f7bc75f92f2dd65209082e9e.reference || (__cxx_static_address_f7bc75f92f2dd65209082e9e.reference = {
    __cReference: true,
    get value() { return QUEBALL____header_global_3963e191aab8f8fe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:404
export const POCKET____header_global_57bfa7b2707baab4 = ((((((903) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1a6b37055f42821c42504149() {
  return __cxx_static_address_1a6b37055f42821c42504149.reference || (__cxx_static_address_1a6b37055f42821c42504149.reference = {
    __cReference: true,
    get value() { return POCKET____header_global_57bfa7b2707baab4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:405
export const WOODENHORSE____header_global_57874dabc987134d = ((((((904) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c4f4cd4c320e740201af0dc4() {
  return __cxx_static_address_c4f4cd4c320e740201af0dc4.reference || (__cxx_static_address_c4f4cd4c320e740201af0dc4.reference = {
    __cReference: true,
    get value() { return WOODENHORSE____header_global_57874dabc987134d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:406
export const TREE1____header_global_6f805610e0f5130a = ((((((908) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_77348d5a4b1ce222c11c12ff() {
  return __cxx_static_address_77348d5a4b1ce222c11c12ff.reference || (__cxx_static_address_77348d5a4b1ce222c11c12ff.reference = {
    __cReference: true,
    get value() { return TREE1____header_global_6f805610e0f5130a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:407
export const TREE2____header_global_c8842c94450510b7 = ((((((910) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_54dc3afb53156512f5532f99() {
  return __cxx_static_address_54dc3afb53156512f5532f99.reference || (__cxx_static_address_54dc3afb53156512f5532f99.reference = {
    __cReference: true,
    get value() { return TREE2____header_global_c8842c94450510b7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:408
export const CACTUS____header_global_ea4b16ee52b8c159 = ((((((911) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8e0e8ca1d3db3ed91b115cf2() {
  return __cxx_static_address_8e0e8ca1d3db3ed91b115cf2.reference || (__cxx_static_address_8e0e8ca1d3db3ed91b115cf2.reference = {
    __cReference: true,
    get value() { return CACTUS____header_global_ea4b16ee52b8c159; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:409
export const MASKWALL2____header_global_aa6e0280b72dc8c5 = ((((((913) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d67103f278fea6527b077fe0() {
  return __cxx_static_address_d67103f278fea6527b077fe0.reference || (__cxx_static_address_d67103f278fea6527b077fe0.reference = {
    __cReference: true,
    get value() { return MASKWALL2____header_global_aa6e0280b72dc8c5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:410
export const MASKWALL3____header_global_ea48f4e4d98a7189 = ((((((914) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cf2bb9cfc9a3cbfd20903673() {
  return __cxx_static_address_cf2bb9cfc9a3cbfd20903673.reference || (__cxx_static_address_cf2bb9cfc9a3cbfd20903673.reference = {
    __cReference: true,
    get value() { return MASKWALL3____header_global_ea48f4e4d98a7189; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:411
export const MASKWALL4____header_global_f7f84c562790bc99 = ((((((915) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_339698296352abaf47df156e() {
  return __cxx_static_address_339698296352abaf47df156e.reference || (__cxx_static_address_339698296352abaf47df156e.reference = {
    __cReference: true,
    get value() { return MASKWALL4____header_global_f7f84c562790bc99; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:412
export const FIREEXT____header_global_a0c98f0a054df819 = ((((((916) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0e7eb2b50adeec2c227181b4() {
  return __cxx_static_address_0e7eb2b50adeec2c227181b4.reference || (__cxx_static_address_0e7eb2b50adeec2c227181b4.reference = {
    __cReference: true,
    get value() { return FIREEXT____header_global_a0c98f0a054df819; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:413
export const TOILETWATER____header_global_b2755bfbe39e96d7 = ((((((921) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ec82874fdba128c8552f2f25() {
  return __cxx_static_address_ec82874fdba128c8552f2f25.reference || (__cxx_static_address_ec82874fdba128c8552f2f25.reference = {
    __cReference: true,
    get value() { return TOILETWATER____header_global_b2755bfbe39e96d7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:414
export const NEON1____header_global_4b76db864fb6b5ad = ((((((925) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c0b475c3e43714fb776c79ac() {
  return __cxx_static_address_c0b475c3e43714fb776c79ac.reference || (__cxx_static_address_c0b475c3e43714fb776c79ac.reference = {
    __cReference: true,
    get value() { return NEON1____header_global_4b76db864fb6b5ad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:415
export const NEON2____header_global_9b06e01322378b34 = ((((((926) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5e3e1ad04f9ad82856985874() {
  return __cxx_static_address_5e3e1ad04f9ad82856985874.reference || (__cxx_static_address_5e3e1ad04f9ad82856985874.reference = {
    __cReference: true,
    get value() { return NEON2____header_global_9b06e01322378b34; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:416
export const CACTUSBROKE____header_global_419ff62152103898 = ((((((939) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ae14fbe636663d3fe6bfefd8() {
  return __cxx_static_address_ae14fbe636663d3fe6bfefd8.reference || (__cxx_static_address_ae14fbe636663d3fe6bfefd8.reference = {
    __cReference: true,
    get value() { return CACTUSBROKE____header_global_419ff62152103898; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:417
export const BOUNCEMINE____header_global_32963bc6d0e6f011 = ((((((940) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_03838b96c6106883733fa698() {
  return __cxx_static_address_03838b96c6106883733fa698.reference || (__cxx_static_address_03838b96c6106883733fa698.reference = {
    __cReference: true,
    get value() { return BOUNCEMINE____header_global_32963bc6d0e6f011; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:418
export const BROKEFIREHYDRENT____header_global_1be217384d3be518 = ((((((950) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a7afef1891459267859d20d6() {
  return __cxx_static_address_a7afef1891459267859d20d6.reference || (__cxx_static_address_a7afef1891459267859d20d6.reference = {
    __cReference: true,
    get value() { return BROKEFIREHYDRENT____header_global_1be217384d3be518; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:419
export const BOX____header_global_313a65bc30b55625 = ((((((951) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fe31cca1c5d4cb7a91c45e84() {
  return __cxx_static_address_fe31cca1c5d4cb7a91c45e84.reference || (__cxx_static_address_fe31cca1c5d4cb7a91c45e84.reference = {
    __cReference: true,
    get value() { return BOX____header_global_313a65bc30b55625; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:420
export const BULLETHOLE____header_global_6dc2806bd6a27ed7 = ((((((952) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_278e3e98dac59d3b246bf150() {
  return __cxx_static_address_278e3e98dac59d3b246bf150.reference || (__cxx_static_address_278e3e98dac59d3b246bf150.reference = {
    __cReference: true,
    get value() { return BULLETHOLE____header_global_6dc2806bd6a27ed7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:421
export const BOTTLE1____header_global_87a2076fbe2a330e = ((((((954) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dfd6fb172bcd3af81d1381cb() {
  return __cxx_static_address_dfd6fb172bcd3af81d1381cb.reference || (__cxx_static_address_dfd6fb172bcd3af81d1381cb.reference = {
    __cReference: true,
    get value() { return BOTTLE1____header_global_87a2076fbe2a330e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:422
export const BOTTLE2____header_global_6050d34b30baf02f = ((((((955) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c188d289b9be359e64c43834() {
  return __cxx_static_address_c188d289b9be359e64c43834.reference || (__cxx_static_address_c188d289b9be359e64c43834.reference = {
    __cReference: true,
    get value() { return BOTTLE2____header_global_6050d34b30baf02f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:423
export const BOTTLE3____header_global_01e1a737cd867639 = ((((((956) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cc646a94cdac243f00d8b8d7() {
  return __cxx_static_address_cc646a94cdac243f00d8b8d7.reference || (__cxx_static_address_cc646a94cdac243f00d8b8d7.reference = {
    __cReference: true,
    get value() { return BOTTLE3____header_global_01e1a737cd867639; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:424
export const BOTTLE4____header_global_f8540537c480b71a = ((((((957) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d4cfc1b69d3feec728c22544() {
  return __cxx_static_address_d4cfc1b69d3feec728c22544.reference || (__cxx_static_address_d4cfc1b69d3feec728c22544.reference = {
    __cReference: true,
    get value() { return BOTTLE4____header_global_f8540537c480b71a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:425
export const FEMPIC5____header_global_f72d2c7bb1b22bb0 = ((((((963) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c282af3011d297b469cd763c() {
  return __cxx_static_address_c282af3011d297b469cd763c.reference || (__cxx_static_address_c282af3011d297b469cd763c.reference = {
    __cReference: true,
    get value() { return FEMPIC5____header_global_f72d2c7bb1b22bb0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:426
export const FEMPIC6____header_global_0ebdd7c891278a5e = ((((((964) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_57cad766035e2eedb61670de() {
  return __cxx_static_address_57cad766035e2eedb61670de.reference || (__cxx_static_address_57cad766035e2eedb61670de.reference = {
    __cReference: true,
    get value() { return FEMPIC6____header_global_0ebdd7c891278a5e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:427
export const FEMPIC7____header_global_47994a1d9c7dd9f8 = ((((((965) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_36ec64d88166090398126050() {
  return __cxx_static_address_36ec64d88166090398126050.reference || (__cxx_static_address_36ec64d88166090398126050.reference = {
    __cReference: true,
    get value() { return FEMPIC7____header_global_47994a1d9c7dd9f8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:428
export const HYDROPLANT____header_global_5a2b83859b46260a = ((((((969) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7143bd993a9d0e25a05ee0fd() {
  return __cxx_static_address_7143bd993a9d0e25a05ee0fd.reference || (__cxx_static_address_7143bd993a9d0e25a05ee0fd.reference = {
    __cReference: true,
    get value() { return HYDROPLANT____header_global_5a2b83859b46260a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:429
export const OCEANSPRITE1____header_global_9a2176acb3f64b8d = ((((((971) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_82b383583838ea94824b6bd2() {
  return __cxx_static_address_82b383583838ea94824b6bd2.reference || (__cxx_static_address_82b383583838ea94824b6bd2.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE1____header_global_9a2176acb3f64b8d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:430
export const OCEANSPRITE2____header_global_6de3653ee00f5c87 = ((((((972) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1810c4756226a03b47d6c78a() {
  return __cxx_static_address_1810c4756226a03b47d6c78a.reference || (__cxx_static_address_1810c4756226a03b47d6c78a.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE2____header_global_6de3653ee00f5c87; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:431
export const OCEANSPRITE3____header_global_337d395d6cbd8500 = ((((((973) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f7d53b2a476ceff7ba83c7c2() {
  return __cxx_static_address_f7d53b2a476ceff7ba83c7c2.reference || (__cxx_static_address_f7d53b2a476ceff7ba83c7c2.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE3____header_global_337d395d6cbd8500; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:432
export const OCEANSPRITE4____header_global_e0ce87fda08bc54e = ((((((974) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d7082b689f0a211513dc4914() {
  return __cxx_static_address_d7082b689f0a211513dc4914.reference || (__cxx_static_address_d7082b689f0a211513dc4914.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE4____header_global_e0ce87fda08bc54e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:433
export const OCEANSPRITE5____header_global_e529078a6e43bbe9 = ((((((975) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cce7fd63f5477c893de8ecaa() {
  return __cxx_static_address_cce7fd63f5477c893de8ecaa.reference || (__cxx_static_address_cce7fd63f5477c893de8ecaa.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE5____header_global_e529078a6e43bbe9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:434
export const GENERICPOLE____header_global_cbac30e7b1373eb1 = ((((((977) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6760df7b072707bd7cb8305f() {
  return __cxx_static_address_6760df7b072707bd7cb8305f.reference || (__cxx_static_address_6760df7b072707bd7cb8305f.reference = {
    __cReference: true,
    get value() { return GENERICPOLE____header_global_cbac30e7b1373eb1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:435
export const CONE____header_global_893c68b6e88b39d3 = ((((((978) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dfc35a9231dc9e9590fd74da() {
  return __cxx_static_address_dfc35a9231dc9e9590fd74da.reference || (__cxx_static_address_dfc35a9231dc9e9590fd74da.reference = {
    __cReference: true,
    get value() { return CONE____header_global_893c68b6e88b39d3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:436
export const HANGLIGHT____header_global_1d45b55f8e9be862 = ((((((979) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_70dcd2b9e2dfa5566ef11f2c() {
  return __cxx_static_address_70dcd2b9e2dfa5566ef11f2c.reference || (__cxx_static_address_70dcd2b9e2dfa5566ef11f2c.reference = {
    __cReference: true,
    get value() { return HANGLIGHT____header_global_1d45b55f8e9be862; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:437
export const HYDRENT____header_global_2d9b1c69445346f0 = ((((((981) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_258caa4df011f72375630e40() {
  return __cxx_static_address_258caa4df011f72375630e40.reference || (__cxx_static_address_258caa4df011f72375630e40.reference = {
    __cReference: true,
    get value() { return HYDRENT____header_global_2d9b1c69445346f0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:438
export const MASKWALL14____header_global_1aedad7f5d84307b = ((((((988) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_163839348ea0a08c163c9235() {
  return __cxx_static_address_163839348ea0a08c163c9235.reference || (__cxx_static_address_163839348ea0a08c163c9235.reference = {
    __cReference: true,
    get value() { return MASKWALL14____header_global_1aedad7f5d84307b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:439
export const TIRE____header_global_2f1b9c0e23c3650c = ((((((990) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c8f7365c84384e15433c2357() {
  return __cxx_static_address_c8f7365c84384e15433c2357.reference || (__cxx_static_address_c8f7365c84384e15433c2357.reference = {
    __cReference: true,
    get value() { return TIRE____header_global_2f1b9c0e23c3650c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:440
export const PIPE5____header_global_48ef1dc70d9d9997 = ((((((994) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e7f77c8bdcf6a407b161657d() {
  return __cxx_static_address_e7f77c8bdcf6a407b161657d.reference || (__cxx_static_address_e7f77c8bdcf6a407b161657d.reference = {
    __cReference: true,
    get value() { return PIPE5____header_global_48ef1dc70d9d9997; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:441
export const PIPE6____header_global_d66e23045a47eadd = ((((((995) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3752450becc8370d58f951be() {
  return __cxx_static_address_3752450becc8370d58f951be.reference || (__cxx_static_address_3752450becc8370d58f951be.reference = {
    __cReference: true,
    get value() { return PIPE6____header_global_d66e23045a47eadd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:442
export const PIPE4____header_global_dfa25e9ae98b837b = ((((((996) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_26fb02c15f79c21fde9de049() {
  return __cxx_static_address_26fb02c15f79c21fde9de049.reference || (__cxx_static_address_26fb02c15f79c21fde9de049.reference = {
    __cReference: true,
    get value() { return PIPE4____header_global_dfa25e9ae98b837b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:443
export const PIPE4B____header_global_b2a81bc57b08cbf0 = ((((((997) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f3e7dab1305134bcb878119a() {
  return __cxx_static_address_f3e7dab1305134bcb878119a.reference || (__cxx_static_address_f3e7dab1305134bcb878119a.reference = {
    __cReference: true,
    get value() { return PIPE4B____header_global_b2a81bc57b08cbf0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:444
export const BROKEHYDROPLANT____header_global_790110fedef38bd0 = ((((((1003) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b1591df8c2a027b0ecaaef89() {
  return __cxx_static_address_b1591df8c2a027b0ecaaef89.reference || (__cxx_static_address_b1591df8c2a027b0ecaaef89.reference = {
    __cReference: true,
    get value() { return BROKEHYDROPLANT____header_global_790110fedef38bd0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:445
export const PIPE5B____header_global_e39d1870a2e3e45d = ((((((1005) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1eeb40b797b5cd696d2df8a0() {
  return __cxx_static_address_1eeb40b797b5cd696d2df8a0.reference || (__cxx_static_address_1eeb40b797b5cd696d2df8a0.reference = {
    __cReference: true,
    get value() { return PIPE5B____header_global_e39d1870a2e3e45d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:446
export const NEON3____header_global_881ea0a3efdf42fe = ((((((1007) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aba59045ca3d7654336163b8() {
  return __cxx_static_address_aba59045ca3d7654336163b8.reference || (__cxx_static_address_aba59045ca3d7654336163b8.reference = {
    __cReference: true,
    get value() { return NEON3____header_global_881ea0a3efdf42fe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:447
export const NEON4____header_global_ac2ebec41de49466 = ((((((1008) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c2f3ff8220181a149184a5da() {
  return __cxx_static_address_c2f3ff8220181a149184a5da.reference || (__cxx_static_address_c2f3ff8220181a149184a5da.reference = {
    __cReference: true,
    get value() { return NEON4____header_global_ac2ebec41de49466; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:448
export const NEON5____header_global_59785f31c92b4379 = ((((((1009) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_467e5db230968f508c29c865() {
  return __cxx_static_address_467e5db230968f508c29c865.reference || (__cxx_static_address_467e5db230968f508c29c865.reference = {
    __cReference: true,
    get value() { return NEON5____header_global_59785f31c92b4379; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:449
export const BOTTLE5____header_global_3dfaaa224adb1ba9 = ((((((1012) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c0baa0f8d3b27d0ab289ed57() {
  return __cxx_static_address_c0baa0f8d3b27d0ab289ed57.reference || (__cxx_static_address_c0baa0f8d3b27d0ab289ed57.reference = {
    __cReference: true,
    get value() { return BOTTLE5____header_global_3dfaaa224adb1ba9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:450
export const BOTTLE6____header_global_3b320a6d9870e782 = ((((((1013) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_48ca745fedf51dc04a9cb36c() {
  return __cxx_static_address_48ca745fedf51dc04a9cb36c.reference || (__cxx_static_address_48ca745fedf51dc04a9cb36c.reference = {
    __cReference: true,
    get value() { return BOTTLE6____header_global_3b320a6d9870e782; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:451
export const BOTTLE8____header_global_57f29bbfc27a200b = ((((((1014) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a2c0a1d6f9f6421e443a0e74() {
  return __cxx_static_address_a2c0a1d6f9f6421e443a0e74.reference || (__cxx_static_address_a2c0a1d6f9f6421e443a0e74.reference = {
    __cReference: true,
    get value() { return BOTTLE8____header_global_57f29bbfc27a200b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:452
export const SPOTLITE____header_global_4e35016c8317938c = ((((((1020) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cd90c0566863c4f10b69ab34() {
  return __cxx_static_address_cd90c0566863c4f10b69ab34.reference || (__cxx_static_address_cd90c0566863c4f10b69ab34.reference = {
    __cReference: true,
    get value() { return SPOTLITE____header_global_4e35016c8317938c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:453
export const MASKWALL15____header_global_680cc71feb817948 = ((((((1024) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2dc568644baf3bfec18689ea() {
  return __cxx_static_address_2dc568644baf3bfec18689ea.reference || (__cxx_static_address_2dc568644baf3bfec18689ea.reference = {
    __cReference: true,
    get value() { return MASKWALL15____header_global_680cc71feb817948; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:454
export const BOTTLE7____header_global_ba0fa575b384d72c = ((((((1025) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8cca1f51359e1b2873e58079() {
  return __cxx_static_address_8cca1f51359e1b2873e58079.reference || (__cxx_static_address_8cca1f51359e1b2873e58079.reference = {
    __cReference: true,
    get value() { return BOTTLE7____header_global_ba0fa575b384d72c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:455
export const HORSEONSIDE____header_global_f4f6aae14acfcbc6 = ((((((1026) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_66dd32b1281123520d677d76() {
  return __cxx_static_address_66dd32b1281123520d677d76.reference || (__cxx_static_address_66dd32b1281123520d677d76.reference = {
    __cReference: true,
    get value() { return HORSEONSIDE____header_global_f4f6aae14acfcbc6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:456
export const GLASSPIECES____header_global_dc0742a04545c423 = ((((((1031) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9e08d70e2ac978b27c206919() {
  return __cxx_static_address_9e08d70e2ac978b27c206919.reference || (__cxx_static_address_9e08d70e2ac978b27c206919.reference = {
    __cReference: true,
    get value() { return GLASSPIECES____header_global_dc0742a04545c423; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:457
export const NEON6____header_global_e65cca4ba47ae53a = ((((((1046) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_209de58df4d22f823de66fb4() {
  return __cxx_static_address_209de58df4d22f823de66fb4.reference || (__cxx_static_address_209de58df4d22f823de66fb4.reference = {
    __cReference: true,
    get value() { return NEON6____header_global_e65cca4ba47ae53a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:458
export const MASKWALL6____header_global_02a06e4c21273c44 = ((((((1059) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_50e212476e83f0f492c32ece() {
  return __cxx_static_address_50e212476e83f0f492c32ece.reference || (__cxx_static_address_50e212476e83f0f492c32ece.reference = {
    __cReference: true,
    get value() { return MASKWALL6____header_global_02a06e4c21273c44; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:459
export const RUBBERCAN____header_global_f699175e0c79b2e7 = ((((((1062) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_33ed638061c7c902dc265818() {
  return __cxx_static_address_33ed638061c7c902dc265818.reference || (__cxx_static_address_33ed638061c7c902dc265818.reference = {
    __cReference: true,
    get value() { return RUBBERCAN____header_global_f699175e0c79b2e7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:460
export const PLUG____header_global_538d34e9c6845028 = ((((((1069) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f48f77ad9291a20c0498617b() {
  return __cxx_static_address_f48f77ad9291a20c0498617b.reference || (__cxx_static_address_f48f77ad9291a20c0498617b.reference = {
    __cReference: true,
    get value() { return PLUG____header_global_538d34e9c6845028; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:461
export const OOZFILTER____header_global_623cc0c7b074836f = ((((((1079) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_50163e7bcfd634df692d2593() {
  return __cxx_static_address_50163e7bcfd634df692d2593.reference || (__cxx_static_address_50163e7bcfd634df692d2593.reference = {
    __cReference: true,
    get value() { return OOZFILTER____header_global_623cc0c7b074836f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:462
export const FLOORPLASMA____header_global_8a302d489528acbd = ((((((1082) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f2dfa2f512859cc3909a287d() {
  return __cxx_static_address_f2dfa2f512859cc3909a287d.reference || (__cxx_static_address_f2dfa2f512859cc3909a287d.reference = {
    __cReference: true,
    get value() { return FLOORPLASMA____header_global_8a302d489528acbd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:463
export const REACTOR____header_global_b41752bad53e8aa4 = ((((((1088) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_32d4380b178c121e6258aa43() {
  return __cxx_static_address_32d4380b178c121e6258aa43.reference || (__cxx_static_address_32d4380b178c121e6258aa43.reference = {
    __cReference: true,
    get value() { return REACTOR____header_global_b41752bad53e8aa4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:464
export const REACTORSPARK____header_global_d87203ab774b6e5c = ((((((1092) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e4e054f1e8af1afd6a22db32() {
  return __cxx_static_address_e4e054f1e8af1afd6a22db32.reference || (__cxx_static_address_e4e054f1e8af1afd6a22db32.reference = {
    __cReference: true,
    get value() { return REACTORSPARK____header_global_d87203ab774b6e5c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:465
export const REACTORBURNT____header_global_8bd2902d1c75b54e = ((((((1096) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_79287647c9012f1023218e4a() {
  return __cxx_static_address_79287647c9012f1023218e4a.reference || (__cxx_static_address_79287647c9012f1023218e4a.reference = {
    __cReference: true,
    get value() { return REACTORBURNT____header_global_8bd2902d1c75b54e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:466
export const DOORTILE15____header_global_becec7b42256bdcf = ((((((1102) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f6d00cb3df68721873535373() {
  return __cxx_static_address_f6d00cb3df68721873535373.reference || (__cxx_static_address_f6d00cb3df68721873535373.reference = {
    __cReference: true,
    get value() { return DOORTILE15____header_global_becec7b42256bdcf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:467
export const HANDSWITCH____header_global_ba8807de43558910 = ((((((1111) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3058ce074f520762d4e908da() {
  return __cxx_static_address_3058ce074f520762d4e908da.reference || (__cxx_static_address_3058ce074f520762d4e908da.reference = {
    __cReference: true,
    get value() { return HANDSWITCH____header_global_ba8807de43558910; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:468
export const CIRCLEPANNEL____header_global_99804bd197acdd61 = ((((((1113) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0ad3939d13444694f79bc333() {
  return __cxx_static_address_0ad3939d13444694f79bc333.reference || (__cxx_static_address_0ad3939d13444694f79bc333.reference = {
    __cReference: true,
    get value() { return CIRCLEPANNEL____header_global_99804bd197acdd61; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:469
export const CIRCLEPANNELBROKE____header_global_1a015e12ba7d2e11 = ((((((1114) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_92e35414dfa0a6408c80c4d6() {
  return __cxx_static_address_92e35414dfa0a6408c80c4d6.reference || (__cxx_static_address_92e35414dfa0a6408c80c4d6.reference = {
    __cReference: true,
    get value() { return CIRCLEPANNELBROKE____header_global_1a015e12ba7d2e11; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:470
export const PULLSWITCH____header_global_e6321334a771d86d = ((((((1122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fb331a38ed9bb94024ba13a5() {
  return __cxx_static_address_fb331a38ed9bb94024ba13a5.reference || (__cxx_static_address_fb331a38ed9bb94024ba13a5.reference = {
    __cReference: true,
    get value() { return PULLSWITCH____header_global_e6321334a771d86d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:471
export const MASKWALL8____header_global_1424ae197653c4bb = ((((((1124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8d663b48dd6bf3a73f91c10e() {
  return __cxx_static_address_8d663b48dd6bf3a73f91c10e.reference || (__cxx_static_address_8d663b48dd6bf3a73f91c10e.reference = {
    __cReference: true,
    get value() { return MASKWALL8____header_global_1424ae197653c4bb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:472
export const BIGHOLE____header_global_376d9d6b320c53f8 = ((((((1141) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a12c4e90d644e87e4d2f03de() {
  return __cxx_static_address_a12c4e90d644e87e4d2f03de.reference || (__cxx_static_address_a12c4e90d644e87e4d2f03de.reference = {
    __cReference: true,
    get value() { return BIGHOLE____header_global_376d9d6b320c53f8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:473
export const ALIENSWITCH____header_global_ec22b55381ccfc8f = ((((((1142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a8faa67ea88866a01b490a0f() {
  return __cxx_static_address_a8faa67ea88866a01b490a0f.reference || (__cxx_static_address_a8faa67ea88866a01b490a0f.reference = {
    __cReference: true,
    get value() { return ALIENSWITCH____header_global_ec22b55381ccfc8f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:474
export const DOORTILE21____header_global_5d84c24d1f9cfe5b = ((((((1144) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_166f0c64ab2c6650a4ee79e2() {
  return __cxx_static_address_166f0c64ab2c6650a4ee79e2.reference || (__cxx_static_address_166f0c64ab2c6650a4ee79e2.reference = {
    __cReference: true,
    get value() { return DOORTILE21____header_global_5d84c24d1f9cfe5b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:475
export const HANDPRINTSWITCH____header_global_b8f4f489c3af46fc = ((((((1155) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ceaafc6be11b6047a6a18c6a() {
  return __cxx_static_address_ceaafc6be11b6047a6a18c6a.reference || (__cxx_static_address_ceaafc6be11b6047a6a18c6a.reference = {
    __cReference: true,
    get value() { return HANDPRINTSWITCH____header_global_b8f4f489c3af46fc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:476
export const BOTTLE10____header_global_c825640fb3a368b4 = ((((((1157) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4844111ef27cc95c62ec6960() {
  return __cxx_static_address_4844111ef27cc95c62ec6960.reference || (__cxx_static_address_4844111ef27cc95c62ec6960.reference = {
    __cReference: true,
    get value() { return BOTTLE10____header_global_c825640fb3a368b4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:477
export const BOTTLE11____header_global_bed8055bf4629d45 = ((((((1158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_80e5abbb40f32462cb48e04e() {
  return __cxx_static_address_80e5abbb40f32462cb48e04e.reference || (__cxx_static_address_80e5abbb40f32462cb48e04e.reference = {
    __cReference: true,
    get value() { return BOTTLE11____header_global_bed8055bf4629d45; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:478
export const BOTTLE12____header_global_f51a2150f1720f23 = ((((((1159) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3b6621ba727be0d50d93b984() {
  return __cxx_static_address_3b6621ba727be0d50d93b984.reference || (__cxx_static_address_3b6621ba727be0d50d93b984.reference = {
    __cReference: true,
    get value() { return BOTTLE12____header_global_f51a2150f1720f23; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:479
export const BOTTLE13____header_global_b33fd3fa633743e9 = ((((((1160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_32a41840232d8bfe80635fb4() {
  return __cxx_static_address_32a41840232d8bfe80635fb4.reference || (__cxx_static_address_32a41840232d8bfe80635fb4.reference = {
    __cReference: true,
    get value() { return BOTTLE13____header_global_b33fd3fa633743e9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:480
export const BOTTLE14____header_global_70bfcc2d5c5a79fa = ((((((1161) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_37d27d558a92718b44d29541() {
  return __cxx_static_address_37d27d558a92718b44d29541.reference || (__cxx_static_address_37d27d558a92718b44d29541.reference = {
    __cReference: true,
    get value() { return BOTTLE14____header_global_70bfcc2d5c5a79fa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:481
export const BOTTLE15____header_global_987dbf38b3393016 = ((((((1162) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_93c73a9accfcd005d097dba0() {
  return __cxx_static_address_93c73a9accfcd005d097dba0.reference || (__cxx_static_address_93c73a9accfcd005d097dba0.reference = {
    __cReference: true,
    get value() { return BOTTLE15____header_global_987dbf38b3393016; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:482
export const BOTTLE16____header_global_112b0ce8d86b769d = ((((((1163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_03169b7e0c5bf84e922429ec() {
  return __cxx_static_address_03169b7e0c5bf84e922429ec.reference || (__cxx_static_address_03169b7e0c5bf84e922429ec.reference = {
    __cReference: true,
    get value() { return BOTTLE16____header_global_112b0ce8d86b769d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:483
export const BOTTLE17____header_global_3cffb27dccb0fffa = ((((((1164) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2838bd1d646bd13b0ed558ce() {
  return __cxx_static_address_2838bd1d646bd13b0ed558ce.reference || (__cxx_static_address_2838bd1d646bd13b0ed558ce.reference = {
    __cReference: true,
    get value() { return BOTTLE17____header_global_3cffb27dccb0fffa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:484
export const BOTTLE18____header_global_39c7bb04a0cadde9 = ((((((1165) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_296730a3bd019aa6eb88c573() {
  return __cxx_static_address_296730a3bd019aa6eb88c573.reference || (__cxx_static_address_296730a3bd019aa6eb88c573.reference = {
    __cReference: true,
    get value() { return BOTTLE18____header_global_39c7bb04a0cadde9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:485
export const BOTTLE19____header_global_0831e2bea400947e = ((((((1166) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b0be35f54ff217b7216f81c3() {
  return __cxx_static_address_b0be35f54ff217b7216f81c3.reference || (__cxx_static_address_b0be35f54ff217b7216f81c3.reference = {
    __cReference: true,
    get value() { return BOTTLE19____header_global_0831e2bea400947e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:486
export const DOORTILE17____header_global_3515cb324eda0a5b = ((((((1169) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_de7035064efa9b0889db2861() {
  return __cxx_static_address_de7035064efa9b0889db2861.reference || (__cxx_static_address_de7035064efa9b0889db2861.reference = {
    __cReference: true,
    get value() { return DOORTILE17____header_global_3515cb324eda0a5b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:487
export const MASKWALL7____header_global_2dbbc9f29d1b097a = ((((((1174) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4164dd7df4df68d4faf2fb82() {
  return __cxx_static_address_4164dd7df4df68d4faf2fb82.reference || (__cxx_static_address_4164dd7df4df68d4faf2fb82.reference = {
    __cReference: true,
    get value() { return MASKWALL7____header_global_2dbbc9f29d1b097a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:488
export const DOORTILE11____header_global_ce49ea789212504c = ((((((1178) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4d891f5023693fa2920adbe5() {
  return __cxx_static_address_4d891f5023693fa2920adbe5.reference || (__cxx_static_address_4d891f5023693fa2920adbe5.reference = {
    __cReference: true,
    get value() { return DOORTILE11____header_global_ce49ea789212504c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:489
export const DOORTILE12____header_global_3010f6878fecf894 = ((((((1179) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_53454219b0ed4c4aaf45c402() {
  return __cxx_static_address_53454219b0ed4c4aaf45c402.reference || (__cxx_static_address_53454219b0ed4c4aaf45c402.reference = {
    __cReference: true,
    get value() { return DOORTILE12____header_global_3010f6878fecf894; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:490
export const VENDMACHINE____header_global_09edd4ee3b73d469 = ((((((1212) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9435e743a4835c766f1009ab() {
  return __cxx_static_address_9435e743a4835c766f1009ab.reference || (__cxx_static_address_9435e743a4835c766f1009ab.reference = {
    __cReference: true,
    get value() { return VENDMACHINE____header_global_09edd4ee3b73d469; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:491
export const COLAMACHINE____header_global_282da1b404b17b7a = ((((((1215) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_052960fd63eeeba0a3b1e1ac() {
  return __cxx_static_address_052960fd63eeeba0a3b1e1ac.reference || (__cxx_static_address_052960fd63eeeba0a3b1e1ac.reference = {
    __cReference: true,
    get value() { return COLAMACHINE____header_global_282da1b404b17b7a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:492
export const CRANEPOLE____header_global_45dd2b680abc0f57 = ((((((1221) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9973712553f83e627cfa4edb() {
  return __cxx_static_address_9973712553f83e627cfa4edb.reference || (__cxx_static_address_9973712553f83e627cfa4edb.reference = {
    __cReference: true,
    get value() { return CRANEPOLE____header_global_45dd2b680abc0f57; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:493
export const CRANE____header_global_1485e3157ae7ea45 = ((((((1222) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c455dc505b98318d716ac737() {
  return __cxx_static_address_c455dc505b98318d716ac737.reference || (__cxx_static_address_c455dc505b98318d716ac737.reference = {
    __cReference: true,
    get value() { return CRANE____header_global_1485e3157ae7ea45; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:494
export const BARBROKE____header_global_0bbe6774c7b22e82 = ((((((1225) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5a8d42984e0c0a234d507781() {
  return __cxx_static_address_5a8d42984e0c0a234d507781.reference || (__cxx_static_address_5a8d42984e0c0a234d507781.reference = {
    __cReference: true,
    get value() { return BARBROKE____header_global_0bbe6774c7b22e82; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:495
export const BLOODPOOL____header_global_e44a2c6a5b84a582 = ((((((1226) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5af712f846fa3ae46fe176ec() {
  return __cxx_static_address_5af712f846fa3ae46fe176ec.reference || (__cxx_static_address_5af712f846fa3ae46fe176ec.reference = {
    __cReference: true,
    get value() { return BLOODPOOL____header_global_e44a2c6a5b84a582; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:496
export const NUKEBARREL____header_global_673e3562ccaad831 = ((((((1227) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5a629bc8424b0151ec45235c() {
  return __cxx_static_address_5a629bc8424b0151ec45235c.reference || (__cxx_static_address_5a629bc8424b0151ec45235c.reference = {
    __cReference: true,
    get value() { return NUKEBARREL____header_global_673e3562ccaad831; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:497
export const NUKEBARRELDENTED____header_global_dc1dda0a36e96bc6 = ((((((1228) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8f02e22a2a7fa08253184583() {
  return __cxx_static_address_8f02e22a2a7fa08253184583.reference || (__cxx_static_address_8f02e22a2a7fa08253184583.reference = {
    __cReference: true,
    get value() { return NUKEBARRELDENTED____header_global_dc1dda0a36e96bc6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:498
export const NUKEBARRELLEAKED____header_global_31f4a779c18a24d0 = ((((((1229) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0008731be38d92a556c16430() {
  return __cxx_static_address_0008731be38d92a556c16430.reference || (__cxx_static_address_0008731be38d92a556c16430.reference = {
    __cReference: true,
    get value() { return NUKEBARRELLEAKED____header_global_31f4a779c18a24d0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:499
export const CANWITHSOMETHING____header_global_c4485b22de96e11b = ((((((1232) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8b9f717b20141909c5e7b9b2() {
  return __cxx_static_address_8b9f717b20141909c5e7b9b2.reference || (__cxx_static_address_8b9f717b20141909c5e7b9b2.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING____header_global_c4485b22de96e11b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:500
export const MONEY____header_global_c95b96263701685c = ((((((1233) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_06f9cf6f5d10d1cffde4c36d() {
  return __cxx_static_address_06f9cf6f5d10d1cffde4c36d.reference || (__cxx_static_address_06f9cf6f5d10d1cffde4c36d.reference = {
    __cReference: true,
    get value() { return MONEY____header_global_c95b96263701685c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:501
export const BANNER____header_global_20c3cbc0c5179775 = ((((((1236) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d27f7a194ddf0091201b1653() {
  return __cxx_static_address_d27f7a194ddf0091201b1653.reference || (__cxx_static_address_d27f7a194ddf0091201b1653.reference = {
    __cReference: true,
    get value() { return BANNER____header_global_20c3cbc0c5179775; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:502
export const EXPLODINGBARREL____header_global_3a53009e72ffaf34 = ((((((1238) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b6654ce16b04fdb9f287d904() {
  return __cxx_static_address_b6654ce16b04fdb9f287d904.reference || (__cxx_static_address_b6654ce16b04fdb9f287d904.reference = {
    __cReference: true,
    get value() { return EXPLODINGBARREL____header_global_3a53009e72ffaf34; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:503
export const EXPLODINGBARREL2____header_global_d8a70adb866f96dd = ((((((1239) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_57130c1d7e8b2fdaa4fa3b7d() {
  return __cxx_static_address_57130c1d7e8b2fdaa4fa3b7d.reference || (__cxx_static_address_57130c1d7e8b2fdaa4fa3b7d.reference = {
    __cReference: true,
    get value() { return EXPLODINGBARREL2____header_global_d8a70adb866f96dd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:504
export const FIREBARREL____header_global_df30ad2ef8ff5869 = ((((((1240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5f32504cbc369c41ffc4da11() {
  return __cxx_static_address_5f32504cbc369c41ffc4da11.reference || (__cxx_static_address_5f32504cbc369c41ffc4da11.reference = {
    __cReference: true,
    get value() { return FIREBARREL____header_global_df30ad2ef8ff5869; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:505
export const SEENINE____header_global_544ffde16d90e0e1 = ((((((1247) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_91fac442245238d935ce49a5() {
  return __cxx_static_address_91fac442245238d935ce49a5.reference || (__cxx_static_address_91fac442245238d935ce49a5.reference = {
    __cReference: true,
    get value() { return SEENINE____header_global_544ffde16d90e0e1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:506
export const SEENINEDEAD____header_global_cd5a1a5d66bd131b = ((((((1248) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_324accc4d65b367cbed415f3() {
  return __cxx_static_address_324accc4d65b367cbed415f3.reference || (__cxx_static_address_324accc4d65b367cbed415f3.reference = {
    __cReference: true,
    get value() { return SEENINEDEAD____header_global_cd5a1a5d66bd131b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:507
export const STEAM____header_global_ff963e2685f7a77d = ((((((1250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5cd6c889a14346db09a0775a() {
  return __cxx_static_address_5cd6c889a14346db09a0775a.reference || (__cxx_static_address_5cd6c889a14346db09a0775a.reference = {
    __cReference: true,
    get value() { return STEAM____header_global_ff963e2685f7a77d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:508
export const CEILINGSTEAM____header_global_c98028e7814d9243 = ((((((1255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e54553c4aedfdb5940344ea2() {
  return __cxx_static_address_e54553c4aedfdb5940344ea2.reference || (__cxx_static_address_e54553c4aedfdb5940344ea2.reference = {
    __cReference: true,
    get value() { return CEILINGSTEAM____header_global_c98028e7814d9243; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:509
export const PIPE6B____header_global_864a4cbf12799e66 = ((((((1260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8c178155387b0c5d01e67ff1() {
  return __cxx_static_address_8c178155387b0c5d01e67ff1.reference || (__cxx_static_address_8c178155387b0c5d01e67ff1.reference = {
    __cReference: true,
    get value() { return PIPE6B____header_global_864a4cbf12799e66; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:510
export const TRANSPORTERBEAM____header_global_977ce7f527abc399 = ((((((1261) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f416b837c4a374f9e7eaea31() {
  return __cxx_static_address_f416b837c4a374f9e7eaea31.reference || (__cxx_static_address_f416b837c4a374f9e7eaea31.reference = {
    __cReference: true,
    get value() { return TRANSPORTERBEAM____header_global_977ce7f527abc399; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:511
export const RAT____header_global_19be78cd1cb24335 = ((((((1267) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ce523ea01f72f26301a4c6ba() {
  return __cxx_static_address_ce523ea01f72f26301a4c6ba.reference || (__cxx_static_address_ce523ea01f72f26301a4c6ba.reference = {
    __cReference: true,
    get value() { return RAT____header_global_19be78cd1cb24335; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:512
export const TRASH____header_global_ddd885c0f2274a0e = ((((((1272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_29146fc59cfcb9ce7063eb04() {
  return __cxx_static_address_29146fc59cfcb9ce7063eb04.reference || (__cxx_static_address_29146fc59cfcb9ce7063eb04.reference = {
    __cReference: true,
    get value() { return TRASH____header_global_ddd885c0f2274a0e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:513
export const FEMPIC1____header_global_73a1b5424d9d3587 = ((((((1280) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_43200373ed195c82cfd9860b() {
  return __cxx_static_address_43200373ed195c82cfd9860b.reference || (__cxx_static_address_43200373ed195c82cfd9860b.reference = {
    __cReference: true,
    get value() { return FEMPIC1____header_global_73a1b5424d9d3587; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:514
export const FEMPIC2____header_global_cb61d9d1e6245ec8 = ((((((1289) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e0209e4724040526f24e617b() {
  return __cxx_static_address_e0209e4724040526f24e617b.reference || (__cxx_static_address_e0209e4724040526f24e617b.reference = {
    __cReference: true,
    get value() { return FEMPIC2____header_global_cb61d9d1e6245ec8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:515
export const BLANKSCREEN____header_global_0f88499c69dfc5dc = ((((((1293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e65ca2127f8a785311d3efa() {
  return __cxx_static_address_1e65ca2127f8a785311d3efa.reference || (__cxx_static_address_1e65ca2127f8a785311d3efa.reference = {
    __cReference: true,
    get value() { return BLANKSCREEN____header_global_0f88499c69dfc5dc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:516
export const PODFEM1____header_global_9df4acd62a957da1 = ((((((1294) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_20a9b931dce8bd21ec5526a3() {
  return __cxx_static_address_20a9b931dce8bd21ec5526a3.reference || (__cxx_static_address_20a9b931dce8bd21ec5526a3.reference = {
    __cReference: true,
    get value() { return PODFEM1____header_global_9df4acd62a957da1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:517
export const FEMPIC3____header_global_80ba00351a1dd198 = ((((((1298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_68160e493713d56d28045c7c() {
  return __cxx_static_address_68160e493713d56d28045c7c.reference || (__cxx_static_address_68160e493713d56d28045c7c.reference = {
    __cReference: true,
    get value() { return FEMPIC3____header_global_80ba00351a1dd198; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:518
export const FEMPIC4____header_global_5f0ad9371b7eaf67 = ((((((1306) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cf527a29700313d57f3b05f2() {
  return __cxx_static_address_cf527a29700313d57f3b05f2.reference || (__cxx_static_address_cf527a29700313d57f3b05f2.reference = {
    __cReference: true,
    get value() { return FEMPIC4____header_global_5f0ad9371b7eaf67; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:519
export const FEM1____header_global_d0037fe02261b999 = ((((((1312) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6752650bb033ea91018bc73e() {
  return __cxx_static_address_6752650bb033ea91018bc73e.reference || (__cxx_static_address_6752650bb033ea91018bc73e.reference = {
    __cReference: true,
    get value() { return FEM1____header_global_d0037fe02261b999; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:520
export const FEM2____header_global_2ce46c270e7692bd = ((((((1317) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_096d0647d03ddd11ec8ff595() {
  return __cxx_static_address_096d0647d03ddd11ec8ff595.reference || (__cxx_static_address_096d0647d03ddd11ec8ff595.reference = {
    __cReference: true,
    get value() { return FEM2____header_global_2ce46c270e7692bd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:521
export const FEM3____header_global_75058ae708f8cf6e = ((((((1321) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1a69209cdfe38966c54227b5() {
  return __cxx_static_address_1a69209cdfe38966c54227b5.reference || (__cxx_static_address_1a69209cdfe38966c54227b5.reference = {
    __cReference: true,
    get value() { return FEM3____header_global_75058ae708f8cf6e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:522
export const FEM5____header_global_1e43536fa53cfc56 = ((((((1323) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_124372ef8d21364d4fa51948() {
  return __cxx_static_address_124372ef8d21364d4fa51948.reference || (__cxx_static_address_124372ef8d21364d4fa51948.reference = {
    __cReference: true,
    get value() { return FEM5____header_global_1e43536fa53cfc56; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:523
export const BLOODYPOLE____header_global_a8a4dbfae545e66d = ((((((1324) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0b90fccdab936720a28ef2b0() {
  return __cxx_static_address_0b90fccdab936720a28ef2b0.reference || (__cxx_static_address_0b90fccdab936720a28ef2b0.reference = {
    __cReference: true,
    get value() { return BLOODYPOLE____header_global_a8a4dbfae545e66d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:524
export const FEM4____header_global_953d2611ed19e0e1 = ((((((1325) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d1ab2c126654b52f56e9550d() {
  return __cxx_static_address_d1ab2c126654b52f56e9550d.reference || (__cxx_static_address_d1ab2c126654b52f56e9550d.reference = {
    __cReference: true,
    get value() { return FEM4____header_global_953d2611ed19e0e1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:525
export const FEM6____header_global_f270b4090ee943a5 = ((((((1334) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5225545b88b5eca12c2f1413() {
  return __cxx_static_address_5225545b88b5eca12c2f1413.reference || (__cxx_static_address_5225545b88b5eca12c2f1413.reference = {
    __cReference: true,
    get value() { return FEM6____header_global_f270b4090ee943a5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:526
export const FEM6PAD____header_global_03b03f8836b6ba8b = ((((((1335) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1cb20a1553890db423de2a37() {
  return __cxx_static_address_1cb20a1553890db423de2a37.reference || (__cxx_static_address_1cb20a1553890db423de2a37.reference = {
    __cReference: true,
    get value() { return FEM6PAD____header_global_03b03f8836b6ba8b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:527
export const FEM8____header_global_b1488f1da561a2b3 = ((((((1336) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_63ec3debee49a951035abb4e() {
  return __cxx_static_address_63ec3debee49a951035abb4e.reference || (__cxx_static_address_63ec3debee49a951035abb4e.reference = {
    __cReference: true,
    get value() { return FEM8____header_global_b1488f1da561a2b3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:528
export const HELECOPT____header_global_a6ba7deee0214534 = ((((((1346) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d001ec4e30741c5983ea90bd() {
  return __cxx_static_address_d001ec4e30741c5983ea90bd.reference || (__cxx_static_address_d001ec4e30741c5983ea90bd.reference = {
    __cReference: true,
    get value() { return HELECOPT____header_global_a6ba7deee0214534; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:529
export const FETUSJIB____header_global_33c39f79c3b5f454 = ((((((1347) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_86b5b5f82a167b23a3e69e1d() {
  return __cxx_static_address_86b5b5f82a167b23a3e69e1d.reference || (__cxx_static_address_86b5b5f82a167b23a3e69e1d.reference = {
    __cReference: true,
    get value() { return FETUSJIB____header_global_33c39f79c3b5f454; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:530
export const HOLODUKE____header_global_897429d8dbfac6e6 = ((((((1348) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3c9d082b511387e344715607() {
  return __cxx_static_address_3c9d082b511387e344715607.reference || (__cxx_static_address_3c9d082b511387e344715607.reference = {
    __cReference: true,
    get value() { return HOLODUKE____header_global_897429d8dbfac6e6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:531
export const SPACEMARINE____header_global_fbc76be2c2278593 = ((((((1353) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cc9784ce37df4ffb547ab386() {
  return __cxx_static_address_cc9784ce37df4ffb547ab386.reference || (__cxx_static_address_cc9784ce37df4ffb547ab386.reference = {
    __cReference: true,
    get value() { return SPACEMARINE____header_global_fbc76be2c2278593; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:532
export const INDY____header_global_e93c3de2849008ec = ((((((1355) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d406c781236bb41375db9fc4() {
  return __cxx_static_address_d406c781236bb41375db9fc4.reference || (__cxx_static_address_d406c781236bb41375db9fc4.reference = {
    __cReference: true,
    get value() { return INDY____header_global_e93c3de2849008ec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:533
export const FETUS____header_global_34bfd45527c0ee25 = ((((((1358) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_57a8916eba73c600c955eae7() {
  return __cxx_static_address_57a8916eba73c600c955eae7.reference || (__cxx_static_address_57a8916eba73c600c955eae7.reference = {
    __cReference: true,
    get value() { return FETUS____header_global_34bfd45527c0ee25; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:534
export const FETUSBROKE____header_global_7ba2f043fe5326e5 = ((((((1359) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_67e24b32893abbabf281125e() {
  return __cxx_static_address_67e24b32893abbabf281125e.reference || (__cxx_static_address_67e24b32893abbabf281125e.reference = {
    __cReference: true,
    get value() { return FETUSBROKE____header_global_7ba2f043fe5326e5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:535
export const MONK____header_global_79be886b9188760c = ((((((1352) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5c7f5eb083632cf258fef639() {
  return __cxx_static_address_5c7f5eb083632cf258fef639.reference || (__cxx_static_address_5c7f5eb083632cf258fef639.reference = {
    __cReference: true,
    get value() { return MONK____header_global_79be886b9188760c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:536
export const LUKE____header_global_909edf15358f205b = ((((((1354) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_756308e4bf7ce3eed737123f() {
  return __cxx_static_address_756308e4bf7ce3eed737123f.reference || (__cxx_static_address_756308e4bf7ce3eed737123f.reference = {
    __cReference: true,
    get value() { return LUKE____header_global_909edf15358f205b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:537
export const COOLEXPLOSION1____header_global_664f8c220f197bed = ((((((1360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e76ce9215bcc6dbb2cf4e022() {
  return __cxx_static_address_e76ce9215bcc6dbb2cf4e022.reference || (__cxx_static_address_e76ce9215bcc6dbb2cf4e022.reference = {
    __cReference: true,
    get value() { return COOLEXPLOSION1____header_global_664f8c220f197bed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:538
export const WATERSPLASH2____header_global_e30db6ef889ade7f = ((((((1380) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_16f9329c8e14f492ede1ca41() {
  return __cxx_static_address_16f9329c8e14f492ede1ca41.reference || (__cxx_static_address_16f9329c8e14f492ede1ca41.reference = {
    __cReference: true,
    get value() { return WATERSPLASH2____header_global_e30db6ef889ade7f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:539
export const FIREVASE____header_global_8d1b3586be7c49eb = ((((((1390) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4f129f7c6663639b3fd16dd9() {
  return __cxx_static_address_4f129f7c6663639b3fd16dd9.reference || (__cxx_static_address_4f129f7c6663639b3fd16dd9.reference = {
    __cReference: true,
    get value() { return FIREVASE____header_global_8d1b3586be7c49eb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:540
export const FEM7____header_global_cba7cd6e583b65d1 = ((((((1395) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_991ac5dd650c83209b52b941() {
  return __cxx_static_address_991ac5dd650c83209b52b941.reference || (__cxx_static_address_991ac5dd650c83209b52b941.reference = {
    __cReference: true,
    get value() { return FEM7____header_global_cba7cd6e583b65d1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:541
export const APLAYERTOP____header_global_78a9b497fc1e4a93 = ((((((1400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_076c9085c13421f3e7c36e47() {
  return __cxx_static_address_076c9085c13421f3e7c36e47.reference || (__cxx_static_address_076c9085c13421f3e7c36e47.reference = {
    __cReference: true,
    get value() { return APLAYERTOP____header_global_78a9b497fc1e4a93; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:542
export const APLAYER____header_global_dcd884b34139756c = ((((((1405) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2e8cff01085eb34416f9b91a() {
  return __cxx_static_address_2e8cff01085eb34416f9b91a.reference || (__cxx_static_address_2e8cff01085eb34416f9b91a.reference = {
    __cReference: true,
    get value() { return APLAYER____header_global_dcd884b34139756c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:543
export const PLAYERONWATER____header_global_690fc3a20cf8d9a3 = ((((((1420) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fe467d009f2f8e22d103a4f2() {
  return __cxx_static_address_fe467d009f2f8e22d103a4f2.reference || (__cxx_static_address_fe467d009f2f8e22d103a4f2.reference = {
    __cReference: true,
    get value() { return PLAYERONWATER____header_global_690fc3a20cf8d9a3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:544
export const DUKELYINGDEAD____header_global_c3f52901bc60ab6e = ((((((1518) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f9e59fe9cd82f057232ed7e4() {
  return __cxx_static_address_f9e59fe9cd82f057232ed7e4.reference || (__cxx_static_address_f9e59fe9cd82f057232ed7e4.reference = {
    __cReference: true,
    get value() { return DUKELYINGDEAD____header_global_c3f52901bc60ab6e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:545
export const DUKETORSO____header_global_f5daee95dabb08dd = ((((((1520) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a299e55e8c7d4d54aaadad85() {
  return __cxx_static_address_a299e55e8c7d4d54aaadad85.reference || (__cxx_static_address_a299e55e8c7d4d54aaadad85.reference = {
    __cReference: true,
    get value() { return DUKETORSO____header_global_f5daee95dabb08dd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:546
export const DUKEGUN____header_global_0d5829e966647fcd = ((((((1528) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7ddb6879f5daceb8facce287() {
  return __cxx_static_address_7ddb6879f5daceb8facce287.reference || (__cxx_static_address_7ddb6879f5daceb8facce287.reference = {
    __cReference: true,
    get value() { return DUKEGUN____header_global_0d5829e966647fcd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:547
export const DUKELEG____header_global_69abaed541e63620 = ((((((1536) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cf1f17a7e6cfae2f5ab386a9() {
  return __cxx_static_address_cf1f17a7e6cfae2f5ab386a9.reference || (__cxx_static_address_cf1f17a7e6cfae2f5ab386a9.reference = {
    __cReference: true,
    get value() { return DUKELEG____header_global_69abaed541e63620; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:548
export const SHARK____header_global_0c47af195c6a4161 = ((((((1550) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2e185ff342e6a6d47dde50c4() {
  return __cxx_static_address_2e185ff342e6a6d47dde50c4.reference || (__cxx_static_address_2e185ff342e6a6d47dde50c4.reference = {
    __cReference: true,
    get value() { return SHARK____header_global_0c47af195c6a4161; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:549
export const BLOOD____header_global_8eecdfcb4a9792c1 = ((((((1620) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_623bdb8980717725aa758177() {
  return __cxx_static_address_623bdb8980717725aa758177.reference || (__cxx_static_address_623bdb8980717725aa758177.reference = {
    __cReference: true,
    get value() { return BLOOD____header_global_8eecdfcb4a9792c1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:550
export const FIRELASER____header_global_2c3e6a3c214fe830 = ((((((1625) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fc66386f7c1edfb41400469d() {
  return __cxx_static_address_fc66386f7c1edfb41400469d.reference || (__cxx_static_address_fc66386f7c1edfb41400469d.reference = {
    __cReference: true,
    get value() { return FIRELASER____header_global_2c3e6a3c214fe830; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:551
export const TRANSPORTERSTAR____header_global_20ed51ade5c104f2 = ((((((1630) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_92ab60433142393b36d6570c() {
  return __cxx_static_address_92ab60433142393b36d6570c.reference || (__cxx_static_address_92ab60433142393b36d6570c.reference = {
    __cReference: true,
    get value() { return TRANSPORTERSTAR____header_global_20ed51ade5c104f2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:552
export const SPIT____header_global_0dcbca6a35f5b978 = ((((((1636) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5092395a8e509072fc741762() {
  return __cxx_static_address_5092395a8e509072fc741762.reference || (__cxx_static_address_5092395a8e509072fc741762.reference = {
    __cReference: true,
    get value() { return SPIT____header_global_0dcbca6a35f5b978; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:553
export const LOOGIE____header_global_0baca628e77be67f = ((((((1637) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_07f484e4b592ae86a3611e35() {
  return __cxx_static_address_07f484e4b592ae86a3611e35.reference || (__cxx_static_address_07f484e4b592ae86a3611e35.reference = {
    __cReference: true,
    get value() { return LOOGIE____header_global_0baca628e77be67f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:554
export const FIST____header_global_39ec91ee7d39bbdc = ((((((1640) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7c3d419f3a6dfaba12478802() {
  return __cxx_static_address_7c3d419f3a6dfaba12478802.reference || (__cxx_static_address_7c3d419f3a6dfaba12478802.reference = {
    __cReference: true,
    get value() { return FIST____header_global_39ec91ee7d39bbdc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:555
export const FREEZEBLAST____header_global_1ab676fd07798bf0 = ((((((1641) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a93efed51bbb51094a773776() {
  return __cxx_static_address_a93efed51bbb51094a773776.reference || (__cxx_static_address_a93efed51bbb51094a773776.reference = {
    __cReference: true,
    get value() { return FREEZEBLAST____header_global_1ab676fd07798bf0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:556
export const SHRINKSPARK____header_global_38787d82871b1122 = ((((((1646) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_738cdd7d28ea955cac038269() {
  return __cxx_static_address_738cdd7d28ea955cac038269.reference || (__cxx_static_address_738cdd7d28ea955cac038269.reference = {
    __cReference: true,
    get value() { return SHRINKSPARK____header_global_38787d82871b1122; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:557
export const TONGUE____header_global_91aea1b1e9841a01 = ((((((1647) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_54e3823101f6a65985c378e7() {
  return __cxx_static_address_54e3823101f6a65985c378e7.reference || (__cxx_static_address_54e3823101f6a65985c378e7.reference = {
    __cReference: true,
    get value() { return TONGUE____header_global_91aea1b1e9841a01; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:558
export const MORTER____header_global_c56d9e26a438538d = ((((((1650) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e39ee37812d2f644ec9f97ef() {
  return __cxx_static_address_e39ee37812d2f644ec9f97ef.reference || (__cxx_static_address_e39ee37812d2f644ec9f97ef.reference = {
    __cReference: true,
    get value() { return MORTER____header_global_c56d9e26a438538d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:559
export const SHRINKEREXPLOSION____header_global_2f36fc21e20c8231 = ((((((1656) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c229d50f4ed189c1f6108f80() {
  return __cxx_static_address_c229d50f4ed189c1f6108f80.reference || (__cxx_static_address_c229d50f4ed189c1f6108f80.reference = {
    __cReference: true,
    get value() { return SHRINKEREXPLOSION____header_global_2f36fc21e20c8231; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:560
export const RADIUSEXPLOSION____header_global_ba432f02fce6c6a4 = ((((((1670) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f7440d8a300d6251cce92f26() {
  return __cxx_static_address_f7440d8a300d6251cce92f26.reference || (__cxx_static_address_f7440d8a300d6251cce92f26.reference = {
    __cReference: true,
    get value() { return RADIUSEXPLOSION____header_global_ba432f02fce6c6a4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:561
export const FORCERIPPLE____header_global_5c8117e289dd7a41 = ((((((1671) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_df14f0d13497ba04077485bd() {
  return __cxx_static_address_df14f0d13497ba04077485bd.reference || (__cxx_static_address_df14f0d13497ba04077485bd.reference = {
    __cReference: true,
    get value() { return FORCERIPPLE____header_global_5c8117e289dd7a41; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:562
export const LIZTROOP____header_global_c12011c9b0bbefb8 = ((((((1680) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e90c12e59334b5d27e59c1f1() {
  return __cxx_static_address_e90c12e59334b5d27e59c1f1.reference || (__cxx_static_address_e90c12e59334b5d27e59c1f1.reference = {
    __cReference: true,
    get value() { return LIZTROOP____header_global_c12011c9b0bbefb8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:563
export const LIZTROOPRUNNING____header_global_b47d350f6ee09eab = ((((((1681) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5ed1f9889e0b30ff0f38fb04() {
  return __cxx_static_address_5ed1f9889e0b30ff0f38fb04.reference || (__cxx_static_address_5ed1f9889e0b30ff0f38fb04.reference = {
    __cReference: true,
    get value() { return LIZTROOPRUNNING____header_global_b47d350f6ee09eab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:564
export const LIZTROOPSTAYPUT____header_global_6348425789915083 = ((((((1682) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dd4ddfab18517cbb16605c48() {
  return __cxx_static_address_dd4ddfab18517cbb16605c48.reference || (__cxx_static_address_dd4ddfab18517cbb16605c48.reference = {
    __cReference: true,
    get value() { return LIZTROOPSTAYPUT____header_global_6348425789915083; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:565
export const LIZTROOPSHOOT____header_global_0e8c5a42c6c4b626 = ((((((1715) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_83f1b08b3f953c7fbf9138dc() {
  return __cxx_static_address_83f1b08b3f953c7fbf9138dc.reference || (__cxx_static_address_83f1b08b3f953c7fbf9138dc.reference = {
    __cReference: true,
    get value() { return LIZTROOPSHOOT____header_global_0e8c5a42c6c4b626; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:566
export const LIZTROOPJETPACK____header_global_5815398bc0435acb = ((((((1725) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1620fed6fca6b9f7295e0a6b() {
  return __cxx_static_address_1620fed6fca6b9f7295e0a6b.reference || (__cxx_static_address_1620fed6fca6b9f7295e0a6b.reference = {
    __cReference: true,
    get value() { return LIZTROOPJETPACK____header_global_5815398bc0435acb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:567
export const LIZTROOPONTOILET____header_global_eabb0cdfa46d6b29 = ((((((1741) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c976eefca4da3173cc4bc027() {
  return __cxx_static_address_c976eefca4da3173cc4bc027.reference || (__cxx_static_address_c976eefca4da3173cc4bc027.reference = {
    __cReference: true,
    get value() { return LIZTROOPONTOILET____header_global_eabb0cdfa46d6b29; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:568
export const LIZTROOPJUSTSIT____header_global_2772c9f4daa7d5c9 = ((((((1742) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5f10343e6843084b9927055c() {
  return __cxx_static_address_5f10343e6843084b9927055c.reference || (__cxx_static_address_5f10343e6843084b9927055c.reference = {
    __cReference: true,
    get value() { return LIZTROOPJUSTSIT____header_global_2772c9f4daa7d5c9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:569
export const LIZTROOPDUCKING____header_global_81b10d01b0262674 = ((((((1744) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7eadbac0728e60a3dad5b93f() {
  return __cxx_static_address_7eadbac0728e60a3dad5b93f.reference || (__cxx_static_address_7eadbac0728e60a3dad5b93f.reference = {
    __cReference: true,
    get value() { return LIZTROOPDUCKING____header_global_81b10d01b0262674; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:570
export const HEADJIB1____header_global_7f998407f8a38dbf = ((((((1768) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3757745f603e97bde88f7083() {
  return __cxx_static_address_3757745f603e97bde88f7083.reference || (__cxx_static_address_3757745f603e97bde88f7083.reference = {
    __cReference: true,
    get value() { return HEADJIB1____header_global_7f998407f8a38dbf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:571
export const ARMJIB1____header_global_e8d39824f6289cf3 = ((((((1772) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e5caf0e2b9a0e7c16682381a() {
  return __cxx_static_address_e5caf0e2b9a0e7c16682381a.reference || (__cxx_static_address_e5caf0e2b9a0e7c16682381a.reference = {
    __cReference: true,
    get value() { return ARMJIB1____header_global_e8d39824f6289cf3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:572
export const LEGJIB1____header_global_0c50ad012bd9118b = ((((((1776) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_74ceb35ae2d19405cfbc1c76() {
  return __cxx_static_address_74ceb35ae2d19405cfbc1c76.reference || (__cxx_static_address_74ceb35ae2d19405cfbc1c76.reference = {
    __cReference: true,
    get value() { return LEGJIB1____header_global_0c50ad012bd9118b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:573
export const OCTABRAIN____header_global_c84d3df74eac9854 = ((((((1820) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_637a5a91afcdf7cf865c424d() {
  return __cxx_static_address_637a5a91afcdf7cf865c424d.reference || (__cxx_static_address_637a5a91afcdf7cf865c424d.reference = {
    __cReference: true,
    get value() { return OCTABRAIN____header_global_c84d3df74eac9854; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:574
export const OCTABRAINSTAYPUT____header_global_18a9439c95c48502 = ((((((1821) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ea1e4b8e0d646d5c908cbb81() {
  return __cxx_static_address_ea1e4b8e0d646d5c908cbb81.reference || (__cxx_static_address_ea1e4b8e0d646d5c908cbb81.reference = {
    __cReference: true,
    get value() { return OCTABRAINSTAYPUT____header_global_18a9439c95c48502; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:575
export const INNERJAW____header_global_193036ebfd3066df = ((((((1860) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0fa954d39e6ae57e299071ae() {
  return __cxx_static_address_0fa954d39e6ae57e299071ae.reference || (__cxx_static_address_0fa954d39e6ae57e299071ae.reference = {
    __cReference: true,
    get value() { return INNERJAW____header_global_193036ebfd3066df; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:576
export const DRONE____header_global_96ebeda85afa1268 = ((((((1880) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_da61c4e186d7e8f7367e4ce4() {
  return __cxx_static_address_da61c4e186d7e8f7367e4ce4.reference || (__cxx_static_address_da61c4e186d7e8f7367e4ce4.reference = {
    __cReference: true,
    get value() { return DRONE____header_global_96ebeda85afa1268; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:577
export const EXPLOSION2____header_global_6ef49883dbb7220b = ((((((1890) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8846a5859db6e47da8f4a1da() {
  return __cxx_static_address_8846a5859db6e47da8f4a1da.reference || (__cxx_static_address_8846a5859db6e47da8f4a1da.reference = {
    __cReference: true,
    get value() { return EXPLOSION2____header_global_6ef49883dbb7220b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:578
export const COMMANDER____header_global_c0a7e86b4da05e83 = ((((((1920) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8e37d50fa03c66fc61c540e0() {
  return __cxx_static_address_8e37d50fa03c66fc61c540e0.reference || (__cxx_static_address_8e37d50fa03c66fc61c540e0.reference = {
    __cReference: true,
    get value() { return COMMANDER____header_global_c0a7e86b4da05e83; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:579
export const COMMANDERSTAYPUT____header_global_06a07d0c36d18e68 = ((((((1921) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cab1131858cb8625f8741b68() {
  return __cxx_static_address_cab1131858cb8625f8741b68.reference || (__cxx_static_address_cab1131858cb8625f8741b68.reference = {
    __cReference: true,
    get value() { return COMMANDERSTAYPUT____header_global_06a07d0c36d18e68; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:580
export const RECON____header_global_6b7466a2ccacd4be = ((((((1960) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_40ea2028ac16a844e0182618() {
  return __cxx_static_address_40ea2028ac16a844e0182618.reference || (__cxx_static_address_40ea2028ac16a844e0182618.reference = {
    __cReference: true,
    get value() { return RECON____header_global_6b7466a2ccacd4be; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:581
export const TANK____header_global_a1465375ac7968f0 = ((((((1975) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_af764a1712f5d01dd8b8d1ba() {
  return __cxx_static_address_af764a1712f5d01dd8b8d1ba.reference || (__cxx_static_address_af764a1712f5d01dd8b8d1ba.reference = {
    __cReference: true,
    get value() { return TANK____header_global_a1465375ac7968f0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:582
export const PIGCOP____header_global_075a36c5941f57a9 = ((((((2000) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7e50b3c4917ef90cf0e88524() {
  return __cxx_static_address_7e50b3c4917ef90cf0e88524.reference || (__cxx_static_address_7e50b3c4917ef90cf0e88524.reference = {
    __cReference: true,
    get value() { return PIGCOP____header_global_075a36c5941f57a9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:583
export const PIGCOPSTAYPUT____header_global_27e7a4795c457106 = ((((((2001) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9e56acc792acf6310b36fce7() {
  return __cxx_static_address_9e56acc792acf6310b36fce7.reference || (__cxx_static_address_9e56acc792acf6310b36fce7.reference = {
    __cReference: true,
    get value() { return PIGCOPSTAYPUT____header_global_27e7a4795c457106; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:584
export const PIGCOPDIVE____header_global_a9b3c7af85afd80e = ((((((2045) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_afd62af45a3c3933550b92da() {
  return __cxx_static_address_afd62af45a3c3933550b92da.reference || (__cxx_static_address_afd62af45a3c3933550b92da.reference = {
    __cReference: true,
    get value() { return PIGCOPDIVE____header_global_a9b3c7af85afd80e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:585
export const LIZMAN____header_global_3fd8d9b877e899c5 = ((((((2120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_82291f4dbd27593c70bacecb() {
  return __cxx_static_address_82291f4dbd27593c70bacecb.reference || (__cxx_static_address_82291f4dbd27593c70bacecb.reference = {
    __cReference: true,
    get value() { return LIZMAN____header_global_3fd8d9b877e899c5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:586
export const LIZMANSTAYPUT____header_global_ece6c5aadd55d599 = ((((((2121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b62c8fed0455d2cceb7f93d4() {
  return __cxx_static_address_b62c8fed0455d2cceb7f93d4.reference || (__cxx_static_address_b62c8fed0455d2cceb7f93d4.reference = {
    __cReference: true,
    get value() { return LIZMANSTAYPUT____header_global_ece6c5aadd55d599; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:587
export const LIZMANSPITTING____header_global_61cc32e7e003f084 = ((((((2150) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d5fe6ba16c9cbc833179c257() {
  return __cxx_static_address_d5fe6ba16c9cbc833179c257.reference || (__cxx_static_address_d5fe6ba16c9cbc833179c257.reference = {
    __cReference: true,
    get value() { return LIZMANSPITTING____header_global_61cc32e7e003f084; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:588
export const LIZMANFEEDING____header_global_4654fc3f428890d3 = ((((((2160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_818ff5f63878aea9fcec97d4() {
  return __cxx_static_address_818ff5f63878aea9fcec97d4.reference || (__cxx_static_address_818ff5f63878aea9fcec97d4.reference = {
    __cReference: true,
    get value() { return LIZMANFEEDING____header_global_4654fc3f428890d3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:589
export const LIZMANJUMP____header_global_443c8781eb69e724 = ((((((2165) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dbe936c0c466f3799b47f28c() {
  return __cxx_static_address_dbe936c0c466f3799b47f28c.reference || (__cxx_static_address_dbe936c0c466f3799b47f28c.reference = {
    __cReference: true,
    get value() { return LIZMANJUMP____header_global_443c8781eb69e724; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:590
export const FECES____header_global_03c28c3187be4bc8 = ((((((2200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_97e791225aa87804347e3be5() {
  return __cxx_static_address_97e791225aa87804347e3be5.reference || (__cxx_static_address_97e791225aa87804347e3be5.reference = {
    __cReference: true,
    get value() { return FECES____header_global_03c28c3187be4bc8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:591
export const LIZMANHEAD1____header_global_c3f162871eed7694 = ((((((2201) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a49f6943fe24ba21664f9ffc() {
  return __cxx_static_address_a49f6943fe24ba21664f9ffc.reference || (__cxx_static_address_a49f6943fe24ba21664f9ffc.reference = {
    __cReference: true,
    get value() { return LIZMANHEAD1____header_global_c3f162871eed7694; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:592
export const LIZMANARM1____header_global_94ae63b4d5ff1c46 = ((((((2205) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2a80e5dcf7d640f5609990a9() {
  return __cxx_static_address_2a80e5dcf7d640f5609990a9.reference || (__cxx_static_address_2a80e5dcf7d640f5609990a9.reference = {
    __cReference: true,
    get value() { return LIZMANARM1____header_global_94ae63b4d5ff1c46; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:593
export const LIZMANLEG1____header_global_e40e7dc607007486 = ((((((2209) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fa8e7ebfb016d56c4271008a() {
  return __cxx_static_address_fa8e7ebfb016d56c4271008a.reference || (__cxx_static_address_fa8e7ebfb016d56c4271008a.reference = {
    __cReference: true,
    get value() { return LIZMANLEG1____header_global_e40e7dc607007486; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:594
export const EXPLOSION2BOT____header_global_2261a04150bd3b3d = ((((((2219) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ef5f6d2dad60189754212be0() {
  return __cxx_static_address_ef5f6d2dad60189754212be0.reference || (__cxx_static_address_ef5f6d2dad60189754212be0.reference = {
    __cReference: true,
    get value() { return EXPLOSION2BOT____header_global_2261a04150bd3b3d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:595
export const JIBS1____header_global_a9f99fd18dbb65d0 = ((((((2245) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_695dd228e4ebc2602ec42a4b() {
  return __cxx_static_address_695dd228e4ebc2602ec42a4b.reference || (__cxx_static_address_695dd228e4ebc2602ec42a4b.reference = {
    __cReference: true,
    get value() { return JIBS1____header_global_a9f99fd18dbb65d0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:596
export const JIBS2____header_global_532f5ede9c91577b = ((((((2250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a67694f7d33adf105f1a9fd3() {
  return __cxx_static_address_a67694f7d33adf105f1a9fd3.reference || (__cxx_static_address_a67694f7d33adf105f1a9fd3.reference = {
    __cReference: true,
    get value() { return JIBS2____header_global_532f5ede9c91577b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:597
export const JIBS3____header_global_b3a95f3a4a0c8bf9 = ((((((2255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8740094c669d70bba36ef7f7() {
  return __cxx_static_address_8740094c669d70bba36ef7f7.reference || (__cxx_static_address_8740094c669d70bba36ef7f7.reference = {
    __cReference: true,
    get value() { return JIBS3____header_global_b3a95f3a4a0c8bf9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:598
export const JIBS4____header_global_8fa7f17c365611e7 = ((((((2260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_60024c08017b192e32402501() {
  return __cxx_static_address_60024c08017b192e32402501.reference || (__cxx_static_address_60024c08017b192e32402501.reference = {
    __cReference: true,
    get value() { return JIBS4____header_global_8fa7f17c365611e7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:599
export const JIBS5____header_global_7bb9398e73015a50 = ((((((2265) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_12d7d47a4a73a1cf6dd964cf() {
  return __cxx_static_address_12d7d47a4a73a1cf6dd964cf.reference || (__cxx_static_address_12d7d47a4a73a1cf6dd964cf.reference = {
    __cReference: true,
    get value() { return JIBS5____header_global_7bb9398e73015a50; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:600
export const BURNING____header_global_692cb264219a0d71 = ((((((2270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4dbf38d27ed43ba10aae67f0() {
  return __cxx_static_address_4dbf38d27ed43ba10aae67f0.reference || (__cxx_static_address_4dbf38d27ed43ba10aae67f0.reference = {
    __cReference: true,
    get value() { return BURNING____header_global_692cb264219a0d71; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:601
export const FIRE____header_global_54d18c0cc8c72a61 = ((((((2271) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a800d746b93c06607b3a8023() {
  return __cxx_static_address_a800d746b93c06607b3a8023.reference || (__cxx_static_address_a800d746b93c06607b3a8023.reference = {
    __cReference: true,
    get value() { return FIRE____header_global_54d18c0cc8c72a61; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:602
export const JIBS6____header_global_a0f51d10e7ddc847 = ((((((2286) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aa27df179c7e6c6f0adfb100() {
  return __cxx_static_address_aa27df179c7e6c6f0adfb100.reference || (__cxx_static_address_aa27df179c7e6c6f0adfb100.reference = {
    __cReference: true,
    get value() { return JIBS6____header_global_a0f51d10e7ddc847; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:603
export const BLOODSPLAT1____header_global_d7371c7c962dbe42 = ((((((2296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6e0ecff458ee45201f1957dc() {
  return __cxx_static_address_6e0ecff458ee45201f1957dc.reference || (__cxx_static_address_6e0ecff458ee45201f1957dc.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT1____header_global_d7371c7c962dbe42; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:604
export const BLOODSPLAT3____header_global_e87711d9885444c5 = ((((((2297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_44e0e3f7e57b0572011e9cd6() {
  return __cxx_static_address_44e0e3f7e57b0572011e9cd6.reference || (__cxx_static_address_44e0e3f7e57b0572011e9cd6.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT3____header_global_e87711d9885444c5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:605
export const BLOODSPLAT2____header_global_083a4f0447b7ec61 = ((((((2298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3719ecefdf8bf02e749aaed0() {
  return __cxx_static_address_3719ecefdf8bf02e749aaed0.reference || (__cxx_static_address_3719ecefdf8bf02e749aaed0.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT2____header_global_083a4f0447b7ec61; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:606
export const BLOODSPLAT4____header_global_cd4c5222fec4a4c8 = ((((((2299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b82cc45ca0d82095c1a50d47() {
  return __cxx_static_address_b82cc45ca0d82095c1a50d47.reference || (__cxx_static_address_b82cc45ca0d82095c1a50d47.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT4____header_global_cd4c5222fec4a4c8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:607
export const OOZ____header_global_35711cf350509def = ((((((2300) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8149975b93192e6fb2323245() {
  return __cxx_static_address_8149975b93192e6fb2323245.reference || (__cxx_static_address_8149975b93192e6fb2323245.reference = {
    __cReference: true,
    get value() { return OOZ____header_global_35711cf350509def; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:608
export const OOZ2____header_global_a6df5c3c55923dca = ((((((2309) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_03960cb7075f42f0729edaa8() {
  return __cxx_static_address_03960cb7075f42f0729edaa8.reference || (__cxx_static_address_03960cb7075f42f0729edaa8.reference = {
    __cReference: true,
    get value() { return OOZ2____header_global_a6df5c3c55923dca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:609
export const WALLBLOOD1____header_global_a2b90519b60d027c = ((((((2301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0e4ec748235caf54b3dea416() {
  return __cxx_static_address_0e4ec748235caf54b3dea416.reference || (__cxx_static_address_0e4ec748235caf54b3dea416.reference = {
    __cReference: true,
    get value() { return WALLBLOOD1____header_global_a2b90519b60d027c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:610
export const WALLBLOOD2____header_global_05019ac334f38506 = ((((((2302) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3f337a4ad7b0379ccdbafc96() {
  return __cxx_static_address_3f337a4ad7b0379ccdbafc96.reference || (__cxx_static_address_3f337a4ad7b0379ccdbafc96.reference = {
    __cReference: true,
    get value() { return WALLBLOOD2____header_global_05019ac334f38506; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:611
export const WALLBLOOD3____header_global_a7bc76b56c7ab8d5 = ((((((2303) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a003c2d7a8413f33476a45af() {
  return __cxx_static_address_a003c2d7a8413f33476a45af.reference || (__cxx_static_address_a003c2d7a8413f33476a45af.reference = {
    __cReference: true,
    get value() { return WALLBLOOD3____header_global_a7bc76b56c7ab8d5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:612
export const WALLBLOOD4____header_global_55678347770e357f = ((((((2304) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d0e0fd409df2273aab52edc0() {
  return __cxx_static_address_d0e0fd409df2273aab52edc0.reference || (__cxx_static_address_d0e0fd409df2273aab52edc0.reference = {
    __cReference: true,
    get value() { return WALLBLOOD4____header_global_55678347770e357f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:613
export const WALLBLOOD5____header_global_481ae45454d46959 = ((((((2305) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aefbe683ebdbb0a32b5028b3() {
  return __cxx_static_address_aefbe683ebdbb0a32b5028b3.reference || (__cxx_static_address_aefbe683ebdbb0a32b5028b3.reference = {
    __cReference: true,
    get value() { return WALLBLOOD5____header_global_481ae45454d46959; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:614
export const WALLBLOOD7____header_global_3d34c531adb59f46 = ((((((2307) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5af86697c9fbcd4fd3a84102() {
  return __cxx_static_address_5af86697c9fbcd4fd3a84102.reference || (__cxx_static_address_5af86697c9fbcd4fd3a84102.reference = {
    __cReference: true,
    get value() { return WALLBLOOD7____header_global_3d34c531adb59f46; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:615
export const WALLBLOOD8____header_global_6d6f000560ad2db6 = ((((((2308) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e344e5dcc2a3e91b8388af77() {
  return __cxx_static_address_e344e5dcc2a3e91b8388af77.reference || (__cxx_static_address_e344e5dcc2a3e91b8388af77.reference = {
    __cReference: true,
    get value() { return WALLBLOOD8____header_global_6d6f000560ad2db6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:616
export const BURNING2____header_global_2b4433d6798c37c8 = ((((((2310) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_542de68ac470b56a9a524715() {
  return __cxx_static_address_542de68ac470b56a9a524715.reference || (__cxx_static_address_542de68ac470b56a9a524715.reference = {
    __cReference: true,
    get value() { return BURNING2____header_global_2b4433d6798c37c8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:617
export const FIRE2____header_global_9ee239f6e5b70fc6 = ((((((2311) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9f405e4be0568f095a065399() {
  return __cxx_static_address_9f405e4be0568f095a065399.reference || (__cxx_static_address_9f405e4be0568f095a065399.reference = {
    __cReference: true,
    get value() { return FIRE2____header_global_9ee239f6e5b70fc6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:618
export const CRACKKNUCKLES____header_global_cc33d98f0c715a78 = ((((((2324) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8519bebd65d995df472385cd() {
  return __cxx_static_address_8519bebd65d995df472385cd.reference || (__cxx_static_address_8519bebd65d995df472385cd.reference = {
    __cReference: true,
    get value() { return CRACKKNUCKLES____header_global_cc33d98f0c715a78; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:619
export const SMALLSMOKE____header_global_c37c142ed8f964e9 = ((((((2329) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f274e61e88ac6bf31493c937() {
  return __cxx_static_address_f274e61e88ac6bf31493c937.reference || (__cxx_static_address_f274e61e88ac6bf31493c937.reference = {
    __cReference: true,
    get value() { return SMALLSMOKE____header_global_c37c142ed8f964e9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:620
export const FLOORFLAME____header_global_6449be964bedf98a = ((((((2333) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_009712c3968dd9ad5e05c4b0() {
  return __cxx_static_address_009712c3968dd9ad5e05c4b0.reference || (__cxx_static_address_009712c3968dd9ad5e05c4b0.reference = {
    __cReference: true,
    get value() { return FLOORFLAME____header_global_6449be964bedf98a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:621
export const ROTATEGUN____header_global_b06070d192c6fa86 = ((((((2360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_357fa3bce96b3c4dc8fc2cad() {
  return __cxx_static_address_357fa3bce96b3c4dc8fc2cad.reference || (__cxx_static_address_357fa3bce96b3c4dc8fc2cad.reference = {
    __cReference: true,
    get value() { return ROTATEGUN____header_global_b06070d192c6fa86; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:622
export const GREENSLIME____header_global_68c29270b95d560b = ((((((2370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7167f7ced9710a0729257f81() {
  return __cxx_static_address_7167f7ced9710a0729257f81.reference || (__cxx_static_address_7167f7ced9710a0729257f81.reference = {
    __cReference: true,
    get value() { return GREENSLIME____header_global_68c29270b95d560b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:623
export const WATERDRIPSPLASH____header_global_bb943f0c28f0d94f = ((((((2380) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1cf8d16fa122e59a22b06b4d() {
  return __cxx_static_address_1cf8d16fa122e59a22b06b4d.reference || (__cxx_static_address_1cf8d16fa122e59a22b06b4d.reference = {
    __cReference: true,
    get value() { return WATERDRIPSPLASH____header_global_bb943f0c28f0d94f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:624
export const SCRAP6____header_global_a6725f9684b22d0c = ((((((2390) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b6d9f5112071207f2f6c70a5() {
  return __cxx_static_address_b6d9f5112071207f2f6c70a5.reference || (__cxx_static_address_b6d9f5112071207f2f6c70a5.reference = {
    __cReference: true,
    get value() { return SCRAP6____header_global_a6725f9684b22d0c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:625
export const SCRAP1____header_global_02b8c3241f227850 = ((((((2400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f9690512825be78a3dcd74df() {
  return __cxx_static_address_f9690512825be78a3dcd74df.reference || (__cxx_static_address_f9690512825be78a3dcd74df.reference = {
    __cReference: true,
    get value() { return SCRAP1____header_global_02b8c3241f227850; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:626
export const SCRAP2____header_global_5917bda71f2c569b = ((((((2404) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f1a4e7e854407696be041197() {
  return __cxx_static_address_f1a4e7e854407696be041197.reference || (__cxx_static_address_f1a4e7e854407696be041197.reference = {
    __cReference: true,
    get value() { return SCRAP2____header_global_5917bda71f2c569b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:627
export const SCRAP3____header_global_29bd63de9d40ce2b = ((((((2408) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_54eec1deb6b9a17087ee95c3() {
  return __cxx_static_address_54eec1deb6b9a17087ee95c3.reference || (__cxx_static_address_54eec1deb6b9a17087ee95c3.reference = {
    __cReference: true,
    get value() { return SCRAP3____header_global_29bd63de9d40ce2b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:628
export const SCRAP4____header_global_7edd17181691926d = ((((((2412) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0538cc647e062e14ec03ac16() {
  return __cxx_static_address_0538cc647e062e14ec03ac16.reference || (__cxx_static_address_0538cc647e062e14ec03ac16.reference = {
    __cReference: true,
    get value() { return SCRAP4____header_global_7edd17181691926d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:629
export const SCRAP5____header_global_a07f8e277a5b4618 = ((((((2416) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4cd9b57a0f5019d07a80985d() {
  return __cxx_static_address_4cd9b57a0f5019d07a80985d.reference || (__cxx_static_address_4cd9b57a0f5019d07a80985d.reference = {
    __cReference: true,
    get value() { return SCRAP5____header_global_a07f8e277a5b4618; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:630
export const ORGANTIC____header_global_19fe7ef6836d0573 = ((((((2420) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0e411af521c1c3a15d7ff7fc() {
  return __cxx_static_address_0e411af521c1c3a15d7ff7fc.reference || (__cxx_static_address_0e411af521c1c3a15d7ff7fc.reference = {
    __cReference: true,
    get value() { return ORGANTIC____header_global_19fe7ef6836d0573; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:631
export const BETAVERSION____header_global_3adae45edc4f7396 = ((((((2440) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_99a15bafd691c5e375cdfd69() {
  return __cxx_static_address_99a15bafd691c5e375cdfd69.reference || (__cxx_static_address_99a15bafd691c5e375cdfd69.reference = {
    __cReference: true,
    get value() { return BETAVERSION____header_global_3adae45edc4f7396; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:632
export const SELECTDIR____header_global_908339422c55a362 = ((((((2444) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c9c0d2adf868f5a888893aff() {
  return __cxx_static_address_c9c0d2adf868f5a888893aff.reference || (__cxx_static_address_c9c0d2adf868f5a888893aff.reference = {
    __cReference: true,
    get value() { return SELECTDIR____header_global_908339422c55a362; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:633
export const F1HELP____header_global_43ef78ba9d23220c = ((((((2445) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1c0c77b53a4061bc1da8753c() {
  return __cxx_static_address_1c0c77b53a4061bc1da8753c.reference || (__cxx_static_address_1c0c77b53a4061bc1da8753c.reference = {
    __cReference: true,
    get value() { return F1HELP____header_global_43ef78ba9d23220c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:634
export const GROWSPARK____header_global_acf83e9605f6ba31 = ((((((2448) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_74d03ed457958728569a6cce() {
  return __cxx_static_address_74d03ed457958728569a6cce.reference || (__cxx_static_address_74d03ed457958728569a6cce.reference = {
    __cReference: true,
    get value() { return GROWSPARK____header_global_acf83e9605f6ba31; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:635
export const MENUSCREEN____header_global_dc45298dac6e2ddc = ((((((2456) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e06a840e986d3575d2a33115() {
  return __cxx_static_address_e06a840e986d3575d2a33115.reference || (__cxx_static_address_e06a840e986d3575d2a33115.reference = {
    __cReference: true,
    get value() { return MENUSCREEN____header_global_dc45298dac6e2ddc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:636
export const MENUBAR____header_global_7f40f1da9f1aaaa3 = ((((((2457) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_42d190d861978b1270f8c804() {
  return __cxx_static_address_42d190d861978b1270f8c804.reference || (__cxx_static_address_42d190d861978b1270f8c804.reference = {
    __cReference: true,
    get value() { return MENUBAR____header_global_7f40f1da9f1aaaa3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:637
export const KILLSICON____header_global_a0c14965c0a52d97 = ((((((2458) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_70bde9c54e89220b042956ff() {
  return __cxx_static_address_70bde9c54e89220b042956ff.reference || (__cxx_static_address_70bde9c54e89220b042956ff.reference = {
    __cReference: true,
    get value() { return KILLSICON____header_global_a0c14965c0a52d97; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:638
export const FIRSTAID_ICON____header_global_7e1cf7939c961115 = ((((((2460) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dc85b77cf119afd9af6d32d6() {
  return __cxx_static_address_dc85b77cf119afd9af6d32d6.reference || (__cxx_static_address_dc85b77cf119afd9af6d32d6.reference = {
    __cReference: true,
    get value() { return FIRSTAID_ICON____header_global_7e1cf7939c961115; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:639
export const HEAT_ICON____header_global_17ccee50ab7a777e = ((((((2461) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_48c7c035e9e106177c0e8738() {
  return __cxx_static_address_48c7c035e9e106177c0e8738.reference || (__cxx_static_address_48c7c035e9e106177c0e8738.reference = {
    __cReference: true,
    get value() { return HEAT_ICON____header_global_17ccee50ab7a777e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:640
export const BOTTOMSTATUSBAR____header_global_50ae58c7d572f0d8 = ((((((2462) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_882ebad297f7e4c3021e5599() {
  return __cxx_static_address_882ebad297f7e4c3021e5599.reference || (__cxx_static_address_882ebad297f7e4c3021e5599.reference = {
    __cReference: true,
    get value() { return BOTTOMSTATUSBAR____header_global_50ae58c7d572f0d8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:641
export const BOOT_ICON____header_global_39694714bbd16ef9 = ((((((2463) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_41a6d4786318eda358295701() {
  return __cxx_static_address_41a6d4786318eda358295701.reference || (__cxx_static_address_41a6d4786318eda358295701.reference = {
    __cReference: true,
    get value() { return BOOT_ICON____header_global_39694714bbd16ef9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:642
export const FRAGBAR____header_global_7c98b9aa6a4545a0 = ((((((2465) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8828fe3ff4d53cf5360301e9() {
  return __cxx_static_address_8828fe3ff4d53cf5360301e9.reference || (__cxx_static_address_8828fe3ff4d53cf5360301e9.reference = {
    __cReference: true,
    get value() { return FRAGBAR____header_global_7c98b9aa6a4545a0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:643
export const JETPACK_ICON____header_global_4767f2e25cc614f1 = ((((((2467) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bef67364a3e7f35926a0fdb5() {
  return __cxx_static_address_bef67364a3e7f35926a0fdb5.reference || (__cxx_static_address_bef67364a3e7f35926a0fdb5.reference = {
    __cReference: true,
    get value() { return JETPACK_ICON____header_global_4767f2e25cc614f1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:644
export const AIRTANK_ICON____header_global_4139a4182f7e3fa0 = ((((((2468) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b01b4d69b8f1485a2f484447() {
  return __cxx_static_address_b01b4d69b8f1485a2f484447.reference || (__cxx_static_address_b01b4d69b8f1485a2f484447.reference = {
    __cReference: true,
    get value() { return AIRTANK_ICON____header_global_4139a4182f7e3fa0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:645
export const STEROIDS_ICON____header_global_03dba2942d152a5c = ((((((2469) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f601cdee839abfa207904c59() {
  return __cxx_static_address_f601cdee839abfa207904c59.reference || (__cxx_static_address_f601cdee839abfa207904c59.reference = {
    __cReference: true,
    get value() { return STEROIDS_ICON____header_global_03dba2942d152a5c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:646
export const HOLODUKE_ICON____header_global_264bd70821ccd553 = ((((((2470) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e35f9da6e0c25caa06e4e0d3() {
  return __cxx_static_address_e35f9da6e0c25caa06e4e0d3.reference || (__cxx_static_address_e35f9da6e0c25caa06e4e0d3.reference = {
    __cReference: true,
    get value() { return HOLODUKE_ICON____header_global_264bd70821ccd553; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:647
export const ACCESS_ICON____header_global_6d9481f684a304fd = ((((((2471) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_86089e174d4b65561931ae64() {
  return __cxx_static_address_86089e174d4b65561931ae64.reference || (__cxx_static_address_86089e174d4b65561931ae64.reference = {
    __cReference: true,
    get value() { return ACCESS_ICON____header_global_6d9481f684a304fd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:648
export const DIGITALNUM____header_global_7f6398fd66b9aee3 = ((((((2472) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_081ca95c989794374cfb880f() {
  return __cxx_static_address_081ca95c989794374cfb880f.reference || (__cxx_static_address_081ca95c989794374cfb880f.reference = {
    __cReference: true,
    get value() { return DIGITALNUM____header_global_7f6398fd66b9aee3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:649
export const DUKECAR____header_global_25e53048addf1b65 = ((((((2491) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3b8a1a9c2b2a908301f87a24() {
  return __cxx_static_address_3b8a1a9c2b2a908301f87a24.reference || (__cxx_static_address_3b8a1a9c2b2a908301f87a24.reference = {
    __cReference: true,
    get value() { return DUKECAR____header_global_25e53048addf1b65; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:650
export const CAMCORNER____header_global_bcc9c3f06ff7a779 = ((((((2482) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f3d24bcf0e6b9a657ff6b8aa() {
  return __cxx_static_address_f3d24bcf0e6b9a657ff6b8aa.reference || (__cxx_static_address_f3d24bcf0e6b9a657ff6b8aa.reference = {
    __cReference: true,
    get value() { return CAMCORNER____header_global_bcc9c3f06ff7a779; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:651
export const CAMLIGHT____header_global_64d88a72b0754c7d = ((((((2484) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a2d7b0aa3d29692abaed9559() {
  return __cxx_static_address_a2d7b0aa3d29692abaed9559.reference || (__cxx_static_address_a2d7b0aa3d29692abaed9559.reference = {
    __cReference: true,
    get value() { return CAMLIGHT____header_global_64d88a72b0754c7d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:652
export const SLIDEBAR____header_global_65bf1a3d317013b2 = ((((((2489) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6201387e05157157820c09da() {
  return __cxx_static_address_6201387e05157157820c09da.reference || (__cxx_static_address_6201387e05157157820c09da.reference = {
    __cReference: true,
    get value() { return SLIDEBAR____header_global_65bf1a3d317013b2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:653
export const DREALMS____header_global_28885a2ce9d4a932 = ((((((2492) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4387bacbd6b94d3990199092() {
  return __cxx_static_address_4387bacbd6b94d3990199092.reference || (__cxx_static_address_4387bacbd6b94d3990199092.reference = {
    __cReference: true,
    get value() { return DREALMS____header_global_28885a2ce9d4a932; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:654
export const BETASCREEN____header_global_c31f70402816b3e0 = ((((((2493) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_50de9955881056f3bec44095() {
  return __cxx_static_address_50de9955881056f3bec44095.reference || (__cxx_static_address_50de9955881056f3bec44095.reference = {
    __cReference: true,
    get value() { return BETASCREEN____header_global_c31f70402816b3e0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:655
export const WINDOWBORDER1____header_global_a7da203bc26c6b39 = ((((((2494) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4ae38c7fb334bcaac3cae253() {
  return __cxx_static_address_4ae38c7fb334bcaac3cae253.reference || (__cxx_static_address_4ae38c7fb334bcaac3cae253.reference = {
    __cReference: true,
    get value() { return WINDOWBORDER1____header_global_a7da203bc26c6b39; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:656
export const TEXTBOX____header_global_3ffd4fd62f799d57 = ((((((2495) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_722624176426d77b457e1c5f() {
  return __cxx_static_address_722624176426d77b457e1c5f.reference || (__cxx_static_address_722624176426d77b457e1c5f.reference = {
    __cReference: true,
    get value() { return TEXTBOX____header_global_3ffd4fd62f799d57; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:657
export const WINDOWBORDER2____header_global_d24dc5b176a84359 = ((((((2496) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_25729dd302ca4c38409c0a7f() {
  return __cxx_static_address_25729dd302ca4c38409c0a7f.reference || (__cxx_static_address_25729dd302ca4c38409c0a7f.reference = {
    __cReference: true,
    get value() { return WINDOWBORDER2____header_global_d24dc5b176a84359; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:658
export const DUKENUKEM____header_global_3ecc8f82a0574af4 = ((((((2497) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f0ccd92aa9f730dd5a0c87ca() {
  return __cxx_static_address_f0ccd92aa9f730dd5a0c87ca.reference || (__cxx_static_address_f0ccd92aa9f730dd5a0c87ca.reference = {
    __cReference: true,
    get value() { return DUKENUKEM____header_global_3ecc8f82a0574af4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:659
export const THREEDEE____header_global_453830d89b3254e9 = ((((((2498) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_783e31d47819e502c1b1116a() {
  return __cxx_static_address_783e31d47819e502c1b1116a.reference || (__cxx_static_address_783e31d47819e502c1b1116a.reference = {
    __cReference: true,
    get value() { return THREEDEE____header_global_453830d89b3254e9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:660
export const INGAMEDUKETHREEDEE____header_global_411068e192b6d783 = ((((((2499) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3bc7bd5ad737b0682e78bfda() {
  return __cxx_static_address_3bc7bd5ad737b0682e78bfda.reference || (__cxx_static_address_3bc7bd5ad737b0682e78bfda.reference = {
    __cReference: true,
    get value() { return INGAMEDUKETHREEDEE____header_global_411068e192b6d783; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:661
export const TENSCREEN____header_global_b4702a10257ae6ee = ((((((2500) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a39b7a2462ed91f295aa1cc2() {
  return __cxx_static_address_a39b7a2462ed91f295aa1cc2.reference || (__cxx_static_address_a39b7a2462ed91f295aa1cc2.reference = {
    __cReference: true,
    get value() { return TENSCREEN____header_global_b4702a10257ae6ee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:662
export const PLUTOPAKSPRITE____header_global_efca43839da9ddc0 = ((((((2501) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ed9ecf2c3153271e551c2d99() {
  return __cxx_static_address_ed9ecf2c3153271e551c2d99.reference || (__cxx_static_address_ed9ecf2c3153271e551c2d99.reference = {
    __cReference: true,
    get value() { return PLUTOPAKSPRITE____header_global_efca43839da9ddc0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:663
export const DEVISTATOR____header_global_4f74c6ca46c0ba2e = ((((((2510) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a963e71798acfff753db2d4e() {
  return __cxx_static_address_a963e71798acfff753db2d4e.reference || (__cxx_static_address_a963e71798acfff753db2d4e.reference = {
    __cReference: true,
    get value() { return DEVISTATOR____header_global_4f74c6ca46c0ba2e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:664
export const KNEE____header_global_47745ed02713ddca = ((((((2521) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fd3c43b4a30278d8aab11082() {
  return __cxx_static_address_fd3c43b4a30278d8aab11082.reference || (__cxx_static_address_fd3c43b4a30278d8aab11082.reference = {
    __cReference: true,
    get value() { return KNEE____header_global_47745ed02713ddca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:665
export const CROSSHAIR____header_global_a31ace95331191d9 = ((((((2523) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3ff65990a839d05ac68b1a7e() {
  return __cxx_static_address_3ff65990a839d05ac68b1a7e.reference || (__cxx_static_address_3ff65990a839d05ac68b1a7e.reference = {
    __cReference: true,
    get value() { return CROSSHAIR____header_global_a31ace95331191d9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:666
export const FIRSTGUN____header_global_d5c48e58434039cb = ((((((2524) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_12760b714e12f3c274c4bc53() {
  return __cxx_static_address_12760b714e12f3c274c4bc53.reference || (__cxx_static_address_12760b714e12f3c274c4bc53.reference = {
    __cReference: true,
    get value() { return FIRSTGUN____header_global_d5c48e58434039cb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:667
export const FIRSTGUNRELOAD____header_global_b53fa7a582101a06 = ((((((2528) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_15c0984bf3ca74769d0e57e8() {
  return __cxx_static_address_15c0984bf3ca74769d0e57e8.reference || (__cxx_static_address_15c0984bf3ca74769d0e57e8.reference = {
    __cReference: true,
    get value() { return FIRSTGUNRELOAD____header_global_b53fa7a582101a06; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:668
export const SHELL____header_global_e87bfb2549083d7b = ((((((2533) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8dd3eda6316014f125f35c47() {
  return __cxx_static_address_8dd3eda6316014f125f35c47.reference || (__cxx_static_address_8dd3eda6316014f125f35c47.reference = {
    __cReference: true,
    get value() { return SHELL____header_global_e87bfb2549083d7b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:669
export const SHOTGUNSHELL____header_global_b1309fdf6c0fa183 = ((((((2535) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2419afbfc58a6f6dd3e19b39() {
  return __cxx_static_address_2419afbfc58a6f6dd3e19b39.reference || (__cxx_static_address_2419afbfc58a6f6dd3e19b39.reference = {
    __cReference: true,
    get value() { return SHOTGUNSHELL____header_global_b1309fdf6c0fa183; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:670
export const CHAINGUN____header_global_4fd10c96b249abd8 = ((((((2536) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5257a8bd68f6ff6cad2c6b6e() {
  return __cxx_static_address_5257a8bd68f6ff6cad2c6b6e.reference || (__cxx_static_address_5257a8bd68f6ff6cad2c6b6e.reference = {
    __cReference: true,
    get value() { return CHAINGUN____header_global_4fd10c96b249abd8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:671
export const RPGGUN____header_global_ebe13088442001fa = ((((((2544) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_08fe4e863748a3d395b5a3f9() {
  return __cxx_static_address_08fe4e863748a3d395b5a3f9.reference || (__cxx_static_address_08fe4e863748a3d395b5a3f9.reference = {
    __cReference: true,
    get value() { return RPGGUN____header_global_ebe13088442001fa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:672
export const FREEZE____header_global_2dd61ee873a2a5de = ((((((2548) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_27710bb271c1fa096e098bb0() {
  return __cxx_static_address_27710bb271c1fa096e098bb0.reference || (__cxx_static_address_27710bb271c1fa096e098bb0.reference = {
    __cReference: true,
    get value() { return FREEZE____header_global_2dd61ee873a2a5de; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:673
export const SHRINKER____header_global_8b5ec86b73dbe9a7 = ((((((2556) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ed1509ae04b90243e79a6fcf() {
  return __cxx_static_address_ed1509ae04b90243e79a6fcf.reference || (__cxx_static_address_ed1509ae04b90243e79a6fcf.reference = {
    __cReference: true,
    get value() { return SHRINKER____header_global_8b5ec86b73dbe9a7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:674
export const HANDHOLDINGLASER____header_global_934287a0c2773e12 = ((((((2563) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0ec546654bcca26274532aeb() {
  return __cxx_static_address_0ec546654bcca26274532aeb.reference || (__cxx_static_address_0ec546654bcca26274532aeb.reference = {
    __cReference: true,
    get value() { return HANDHOLDINGLASER____header_global_934287a0c2773e12; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:675
export const TRIPBOMB____header_global_08ee4ab4f6885cf9 = ((((((2566) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1d6b0ab5457b2cd03149d967() {
  return __cxx_static_address_1d6b0ab5457b2cd03149d967.reference || (__cxx_static_address_1d6b0ab5457b2cd03149d967.reference = {
    __cReference: true,
    get value() { return TRIPBOMB____header_global_08ee4ab4f6885cf9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:676
export const LASERLINE____header_global_b457b205a761aba8 = ((((((2567) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2c465bc436f912bfb846e937() {
  return __cxx_static_address_2c465bc436f912bfb846e937.reference || (__cxx_static_address_2c465bc436f912bfb846e937.reference = {
    __cReference: true,
    get value() { return LASERLINE____header_global_b457b205a761aba8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:677
export const HANDHOLDINGACCESS____header_global_4897545691cf30c3 = ((((((2568) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f791869a8d36422ae1246c9d() {
  return __cxx_static_address_f791869a8d36422ae1246c9d.reference || (__cxx_static_address_f791869a8d36422ae1246c9d.reference = {
    __cReference: true,
    get value() { return HANDHOLDINGACCESS____header_global_4897545691cf30c3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:678
export const HANDREMOTE____header_global_3350298d1a60359b = ((((((2570) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f0801610d709d6a7f7a243cd() {
  return __cxx_static_address_f0801610d709d6a7f7a243cd.reference || (__cxx_static_address_f0801610d709d6a7f7a243cd.reference = {
    __cReference: true,
    get value() { return HANDREMOTE____header_global_3350298d1a60359b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:679
export const HANDTHROW____header_global_2c64e69c419010e2 = ((((((2573) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_31bc22b7a906c219d2f44c6a() {
  return __cxx_static_address_31bc22b7a906c219d2f44c6a.reference || (__cxx_static_address_31bc22b7a906c219d2f44c6a.reference = {
    __cReference: true,
    get value() { return HANDTHROW____header_global_2c64e69c419010e2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:680
export const TIP____header_global_1d2c7deb0ae5cbd4 = ((((((2576) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_33b4d6ac4fdd408a8dde158c() {
  return __cxx_static_address_33b4d6ac4fdd408a8dde158c.reference || (__cxx_static_address_33b4d6ac4fdd408a8dde158c.reference = {
    __cReference: true,
    get value() { return TIP____header_global_1d2c7deb0ae5cbd4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:681
export const SCUBAMASK____header_global_86a64957f041771d = ((((((2581) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3ae3c40a6952d02d8d9c5ae3() {
  return __cxx_static_address_3ae3c40a6952d02d8d9c5ae3.reference || (__cxx_static_address_3ae3c40a6952d02d8d9c5ae3.reference = {
    __cReference: true,
    get value() { return SCUBAMASK____header_global_86a64957f041771d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:682
export const FORCESPHERE____header_global_60cce92dbbcbe927 = ((((((2590) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6a1d95a49813eb856b7373ff() {
  return __cxx_static_address_6a1d95a49813eb856b7373ff.reference || (__cxx_static_address_6a1d95a49813eb856b7373ff.reference = {
    __cReference: true,
    get value() { return FORCESPHERE____header_global_60cce92dbbcbe927; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:683
export const SHOTSPARK1____header_global_d415d933382baaed = ((((((2595) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cd094f596ad23560b155a179() {
  return __cxx_static_address_cd094f596ad23560b155a179.reference || (__cxx_static_address_cd094f596ad23560b155a179.reference = {
    __cReference: true,
    get value() { return SHOTSPARK1____header_global_d415d933382baaed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:684
export const RPG____header_global_ead717eaa1dbceac = ((((((2605) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f4c0a4657a72d58c926aba0e() {
  return __cxx_static_address_f4c0a4657a72d58c926aba0e.reference || (__cxx_static_address_f4c0a4657a72d58c926aba0e.reference = {
    __cReference: true,
    get value() { return RPG____header_global_ead717eaa1dbceac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:685
export const LASERSITE____header_global_be09b833503653d0 = ((((((2612) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d2e89b02afcecc110f20e7da() {
  return __cxx_static_address_d2e89b02afcecc110f20e7da.reference || (__cxx_static_address_d2e89b02afcecc110f20e7da.reference = {
    __cReference: true,
    get value() { return LASERSITE____header_global_be09b833503653d0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:686
export const SHOTGUN____header_global_dea3d769289f418b = ((((((2613) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_da0c53ba0498ee284a0dd937() {
  return __cxx_static_address_da0c53ba0498ee284a0dd937.reference || (__cxx_static_address_da0c53ba0498ee284a0dd937.reference = {
    __cReference: true,
    get value() { return SHOTGUN____header_global_dea3d769289f418b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:687
export const BOSS1____header_global_5c9f966ac8f869e5 = ((((((2630) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0084a5d3884580f28fe8727a() {
  return __cxx_static_address_0084a5d3884580f28fe8727a.reference || (__cxx_static_address_0084a5d3884580f28fe8727a.reference = {
    __cReference: true,
    get value() { return BOSS1____header_global_5c9f966ac8f869e5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:688
export const BOSS1STAYPUT____header_global_50bc54ace3e2d989 = ((((((2631) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4f245067a80825559e81be26() {
  return __cxx_static_address_4f245067a80825559e81be26.reference || (__cxx_static_address_4f245067a80825559e81be26.reference = {
    __cReference: true,
    get value() { return BOSS1STAYPUT____header_global_50bc54ace3e2d989; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:689
export const BOSS1SHOOT____header_global_50d51e62928ea9bc = ((((((2660) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d17d811f1664448dc263b6e3() {
  return __cxx_static_address_d17d811f1664448dc263b6e3.reference || (__cxx_static_address_d17d811f1664448dc263b6e3.reference = {
    __cReference: true,
    get value() { return BOSS1SHOOT____header_global_50d51e62928ea9bc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:690
export const BOSS1LOB____header_global_026bc3333d745248 = ((((((2670) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6bf509ed517ed3f83e5acfd3() {
  return __cxx_static_address_6bf509ed517ed3f83e5acfd3.reference || (__cxx_static_address_6bf509ed517ed3f83e5acfd3.reference = {
    __cReference: true,
    get value() { return BOSS1LOB____header_global_026bc3333d745248; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:691
export const BOSSTOP____header_global_f335aa4e0c949341 = ((((((2696) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b3d3a791152cb7db54a5203d() {
  return __cxx_static_address_b3d3a791152cb7db54a5203d.reference || (__cxx_static_address_b3d3a791152cb7db54a5203d.reference = {
    __cReference: true,
    get value() { return BOSSTOP____header_global_f335aa4e0c949341; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:692
export const BOSS2____header_global_cb59a852cdd05dd7 = ((((((2710) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e5f9096b1f89dada740c1bcc() {
  return __cxx_static_address_e5f9096b1f89dada740c1bcc.reference || (__cxx_static_address_e5f9096b1f89dada740c1bcc.reference = {
    __cReference: true,
    get value() { return BOSS2____header_global_cb59a852cdd05dd7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:693
export const BOSS3____header_global_f335a0da2bca2390 = ((((((2760) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_30a5fbf88fa99d373cebc9cb() {
  return __cxx_static_address_30a5fbf88fa99d373cebc9cb.reference || (__cxx_static_address_30a5fbf88fa99d373cebc9cb.reference = {
    __cReference: true,
    get value() { return BOSS3____header_global_f335a0da2bca2390; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:694
export const SPINNINGNUKEICON____header_global_040fc8f598bd21ae = ((((((2813) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_449759e315295148a574de07() {
  return __cxx_static_address_449759e315295148a574de07.reference || (__cxx_static_address_449759e315295148a574de07.reference = {
    __cReference: true,
    get value() { return SPINNINGNUKEICON____header_global_040fc8f598bd21ae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:695
export const SMALLFNTCURSOR____header_global_3cd6239af8b3e25d = ((((((2821) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_02b781b7065de4dda305abee() {
  return __cxx_static_address_02b781b7065de4dda305abee.reference || (__cxx_static_address_02b781b7065de4dda305abee.reference = {
    __cReference: true,
    get value() { return SMALLFNTCURSOR____header_global_3cd6239af8b3e25d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:696
export const STARTALPHANUM____header_global_4a6b8dcae50597e2 = ((((((2822) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a0e70f895842c8ebef13edad() {
  return __cxx_static_address_a0e70f895842c8ebef13edad.reference || (__cxx_static_address_a0e70f895842c8ebef13edad.reference = {
    __cReference: true,
    get value() { return STARTALPHANUM____header_global_4a6b8dcae50597e2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:697
export const ENDALPHANUM____header_global_e0e919436d9d68a6 = ((((((2915) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c842834b6a2f00eb140c2074() {
  return __cxx_static_address_c842834b6a2f00eb140c2074.reference || (__cxx_static_address_c842834b6a2f00eb140c2074.reference = {
    __cReference: true,
    get value() { return ENDALPHANUM____header_global_e0e919436d9d68a6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:698
export const BIGALPHANUM____header_global_117dd89c93363b4c = ((((((2940) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_97f1d87faae50b92ea2c701f() {
  return __cxx_static_address_97f1d87faae50b92ea2c701f.reference || (__cxx_static_address_97f1d87faae50b92ea2c701f.reference = {
    __cReference: true,
    get value() { return BIGALPHANUM____header_global_117dd89c93363b4c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:699
export const BIGPERIOD____header_global_94321162a303c655 = ((((((3002) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a3aa3688575408dafb3c6caa() {
  return __cxx_static_address_a3aa3688575408dafb3c6caa.reference || (__cxx_static_address_a3aa3688575408dafb3c6caa.reference = {
    __cReference: true,
    get value() { return BIGPERIOD____header_global_94321162a303c655; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:700
export const BIGCOMMA____header_global_6f5201873c161336 = ((((((3003) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c2d8b05a761282c6aa0e7c65() {
  return __cxx_static_address_c2d8b05a761282c6aa0e7c65.reference || (__cxx_static_address_c2d8b05a761282c6aa0e7c65.reference = {
    __cReference: true,
    get value() { return BIGCOMMA____header_global_6f5201873c161336; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:701
export const BIGX____header_global_c9adcce775887b19 = ((((((3004) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5762a21dcdec35ee2f2f7d25() {
  return __cxx_static_address_5762a21dcdec35ee2f2f7d25.reference || (__cxx_static_address_5762a21dcdec35ee2f2f7d25.reference = {
    __cReference: true,
    get value() { return BIGX____header_global_c9adcce775887b19; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:702
export const BIGQ____header_global_b037003bb6a206c6 = ((((((3005) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d3cc57e95563ac6d15354006() {
  return __cxx_static_address_d3cc57e95563ac6d15354006.reference || (__cxx_static_address_d3cc57e95563ac6d15354006.reference = {
    __cReference: true,
    get value() { return BIGQ____header_global_b037003bb6a206c6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:703
export const BIGSEMI____header_global_9933a52561aac661 = ((((((3006) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7df6590c4aa97431d968048d() {
  return __cxx_static_address_7df6590c4aa97431d968048d.reference || (__cxx_static_address_7df6590c4aa97431d968048d.reference = {
    __cReference: true,
    get value() { return BIGSEMI____header_global_9933a52561aac661; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:704
export const BIGCOLIN____header_global_8ea80d5ddbf2a221 = ((((((3007) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_af60f75c2c4a08cee1a2f19a() {
  return __cxx_static_address_af60f75c2c4a08cee1a2f19a.reference || (__cxx_static_address_af60f75c2c4a08cee1a2f19a.reference = {
    __cReference: true,
    get value() { return BIGCOLIN____header_global_8ea80d5ddbf2a221; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:705
export const THREEBYFIVE____header_global_b21734a37f5c9090 = ((((((3010) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_755b4cc3da3686529630745d() {
  return __cxx_static_address_755b4cc3da3686529630745d.reference || (__cxx_static_address_755b4cc3da3686529630745d.reference = {
    __cReference: true,
    get value() { return THREEBYFIVE____header_global_b21734a37f5c9090; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:706
export const BIGAPPOS____header_global_61d5e87613d373df = ((((((3022) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c9ccf9218c84853599d899d9() {
  return __cxx_static_address_c9ccf9218c84853599d899d9.reference || (__cxx_static_address_c9ccf9218c84853599d899d9.reference = {
    __cReference: true,
    get value() { return BIGAPPOS____header_global_61d5e87613d373df; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:707
export const MINIFONT____header_global_2ed909035e7d125f = ((((((3072) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_744a237437245f0f48a8bce5() {
  return __cxx_static_address_744a237437245f0f48a8bce5.reference || (__cxx_static_address_744a237437245f0f48a8bce5.reference = {
    __cReference: true,
    get value() { return MINIFONT____header_global_2ed909035e7d125f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:708
export const RESPAWNMARKERRED____header_global_4b6d53a179a07bd7 = ((((((3190) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fed12cd1e3486e3f32d0605d() {
  return __cxx_static_address_fed12cd1e3486e3f32d0605d.reference || (__cxx_static_address_fed12cd1e3486e3f32d0605d.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERRED____header_global_4b6d53a179a07bd7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:709
export const RESPAWNMARKERYELLOW____header_global_e5f0bd7a7c603520 = ((((((3200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_193b0f2a154b330cd54a7135() {
  return __cxx_static_address_193b0f2a154b330cd54a7135.reference || (__cxx_static_address_193b0f2a154b330cd54a7135.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERYELLOW____header_global_e5f0bd7a7c603520; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:710
export const RESPAWNMARKERGREEN____header_global_69154d122a5cbd03 = ((((((3210) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3220f1b6065bb009ce1e8037() {
  return __cxx_static_address_3220f1b6065bb009ce1e8037.reference || (__cxx_static_address_3220f1b6065bb009ce1e8037.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERGREEN____header_global_69154d122a5cbd03; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:711
export const BONUSSCREEN____header_global_246c1dea426c9afc = ((((((3240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8d7456e06735c39659e849d4() {
  return __cxx_static_address_8d7456e06735c39659e849d4.reference || (__cxx_static_address_8d7456e06735c39659e849d4.reference = {
    __cReference: true,
    get value() { return BONUSSCREEN____header_global_246c1dea426c9afc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:712
export const VIEWBORDER____header_global_d5753eb351653412 = ((((((3250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eb062465ef905c56964d7c54() {
  return __cxx_static_address_eb062465ef905c56964d7c54.reference || (__cxx_static_address_eb062465ef905c56964d7c54.reference = {
    __cReference: true,
    get value() { return VIEWBORDER____header_global_d5753eb351653412; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:713
export const VICTORY1____header_global_3decd8ed8ea2373f = ((((((3260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_97bd1224e9ab6450c3c74613() {
  return __cxx_static_address_97bd1224e9ab6450c3c74613.reference || (__cxx_static_address_97bd1224e9ab6450c3c74613.reference = {
    __cReference: true,
    get value() { return VICTORY1____header_global_3decd8ed8ea2373f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:714
export const ORDERING____header_global_107f2e3dc765925e = ((((((3270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c92a579dbbaf88b35e94329f() {
  return __cxx_static_address_c92a579dbbaf88b35e94329f.reference || (__cxx_static_address_c92a579dbbaf88b35e94329f.reference = {
    __cReference: true,
    get value() { return ORDERING____header_global_107f2e3dc765925e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:715
export const TEXTSTORY____header_global_f54bb73f0b429b87 = ((((((3280) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d1feb5f5c5fd34d06df92220() {
  return __cxx_static_address_d1feb5f5c5fd34d06df92220.reference || (__cxx_static_address_d1feb5f5c5fd34d06df92220.reference = {
    __cReference: true,
    get value() { return TEXTSTORY____header_global_f54bb73f0b429b87; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:716
export const LOADSCREEN____header_global_3fbb67fa4da78eac = ((((((3281) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_51682d929070667adb7c639c() {
  return __cxx_static_address_51682d929070667adb7c639c.reference || (__cxx_static_address_51682d929070667adb7c639c.reference = {
    __cReference: true,
    get value() { return LOADSCREEN____header_global_3fbb67fa4da78eac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:717
export const BORNTOBEWILDSCREEN____header_global_43432400fb0d3d34 = ((((((3370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_73b577d9c730ee5488c2304a() {
  return __cxx_static_address_73b577d9c730ee5488c2304a.reference || (__cxx_static_address_73b577d9c730ee5488c2304a.reference = {
    __cReference: true,
    get value() { return BORNTOBEWILDSCREEN____header_global_43432400fb0d3d34; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:718
export const BLIMP____header_global_824fa559ca5eaec6 = ((((((3400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_268bbd9390d6999175bbadec() {
  return __cxx_static_address_268bbd9390d6999175bbadec.reference || (__cxx_static_address_268bbd9390d6999175bbadec.reference = {
    __cReference: true,
    get value() { return BLIMP____header_global_824fa559ca5eaec6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:719
export const FEM9____header_global_03b05bc5ec53a0b9 = ((((((3450) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_39ee6ca1844d09f9bd10a5db() {
  return __cxx_static_address_39ee6ca1844d09f9bd10a5db.reference || (__cxx_static_address_39ee6ca1844d09f9bd10a5db.reference = {
    __cReference: true,
    get value() { return FEM9____header_global_03b05bc5ec53a0b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:720
export const FRAMEEFFECT1_13____header_global_ab438bf582a07ab8 = ((((((3999) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2f8a3b82adaa0e5e012a568e() {
  return __cxx_static_address_2f8a3b82adaa0e5e012a568e.reference || (__cxx_static_address_2f8a3b82adaa0e5e012a568e.reference = {
    __cReference: true,
    get value() { return FRAMEEFFECT1_13____header_global_ab438bf582a07ab8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:721
export const FRAMEEFFECT1____header_global_7f5ae65a12fca126 = ((((((4095) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d78c4fcbd619a176bd5e867d() {
  return __cxx_static_address_d78c4fcbd619a176bd5e867d.reference || (__cxx_static_address_d78c4fcbd619a176bd5e867d.reference = {
    __cReference: true,
    get value() { return FRAMEEFFECT1____header_global_7f5ae65a12fca126; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:722
export const PANNEL3____header_global_c6e7efd1be3f045d = ((((((4099) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f4a323ed5e79ff6a30ebe653() {
  return __cxx_static_address_f4a323ed5e79ff6a30ebe653.reference || (__cxx_static_address_f4a323ed5e79ff6a30ebe653.reference = {
    __cReference: true,
    get value() { return PANNEL3____header_global_c6e7efd1be3f045d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:723
export const SCREENBREAK14____header_global_9b32780b7d640a96 = ((((((4120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8245dbc4914fb95e4c33d6e9() {
  return __cxx_static_address_8245dbc4914fb95e4c33d6e9.reference || (__cxx_static_address_8245dbc4914fb95e4c33d6e9.reference = {
    __cReference: true,
    get value() { return SCREENBREAK14____header_global_9b32780b7d640a96; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:724
export const SCREENBREAK15____header_global_56302b5438522e78 = ((((((4123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f7528be4c78b1725479ad48e() {
  return __cxx_static_address_f7528be4c78b1725479ad48e.reference || (__cxx_static_address_f7528be4c78b1725479ad48e.reference = {
    __cReference: true,
    get value() { return SCREENBREAK15____header_global_56302b5438522e78; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:725
export const SCREENBREAK19____header_global_dc4445435ea776f8 = ((((((4125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e7b960d7c58e43d47adbab09() {
  return __cxx_static_address_e7b960d7c58e43d47adbab09.reference || (__cxx_static_address_e7b960d7c58e43d47adbab09.reference = {
    __cReference: true,
    get value() { return SCREENBREAK19____header_global_dc4445435ea776f8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:726
export const SCREENBREAK16____header_global_673a0220d8896a2c = ((((((4127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_da39eddcbd67210ceb5f0b96() {
  return __cxx_static_address_da39eddcbd67210ceb5f0b96.reference || (__cxx_static_address_da39eddcbd67210ceb5f0b96.reference = {
    __cReference: true,
    get value() { return SCREENBREAK16____header_global_673a0220d8896a2c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:727
export const SCREENBREAK17____header_global_b2196ee62d9f609f = ((((((4128) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_701064e997253d7c8c98aa43() {
  return __cxx_static_address_701064e997253d7c8c98aa43.reference || (__cxx_static_address_701064e997253d7c8c98aa43.reference = {
    __cReference: true,
    get value() { return SCREENBREAK17____header_global_b2196ee62d9f609f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:728
export const SCREENBREAK18____header_global_1e2f5038a743193b = ((((((4129) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1d8a940846a4d05c7559d5cf() {
  return __cxx_static_address_1d8a940846a4d05c7559d5cf.reference || (__cxx_static_address_1d8a940846a4d05c7559d5cf.reference = {
    __cReference: true,
    get value() { return SCREENBREAK18____header_global_1e2f5038a743193b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:729
export const W_TECHWALL11____header_global_1493c922641eeb45 = ((((((4130) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7061e678985364ac638dffe9() {
  return __cxx_static_address_7061e678985364ac638dffe9.reference || (__cxx_static_address_7061e678985364ac638dffe9.reference = {
    __cReference: true,
    get value() { return W_TECHWALL11____header_global_1493c922641eeb45; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:730
export const W_TECHWALL12____header_global_7a9edac65a1eaefd = ((((((4131) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_39a1d5200accaa2d5ef09fa3() {
  return __cxx_static_address_39a1d5200accaa2d5ef09fa3.reference || (__cxx_static_address_39a1d5200accaa2d5ef09fa3.reference = {
    __cReference: true,
    get value() { return W_TECHWALL12____header_global_7a9edac65a1eaefd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:731
export const W_TECHWALL13____header_global_61f02c6d88ce023e = ((((((4132) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5eb560fb8a2f3652c9b08d1b() {
  return __cxx_static_address_5eb560fb8a2f3652c9b08d1b.reference || (__cxx_static_address_5eb560fb8a2f3652c9b08d1b.reference = {
    __cReference: true,
    get value() { return W_TECHWALL13____header_global_61f02c6d88ce023e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:732
export const W_TECHWALL14____header_global_12b35e876182f7e2 = ((((((4133) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9d9800878aea0324ee668fa8() {
  return __cxx_static_address_9d9800878aea0324ee668fa8.reference || (__cxx_static_address_9d9800878aea0324ee668fa8.reference = {
    __cReference: true,
    get value() { return W_TECHWALL14____header_global_12b35e876182f7e2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:733
export const W_TECHWALL5____header_global_89e014079e340779 = ((((((4134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_827894230b4631eb11de686c() {
  return __cxx_static_address_827894230b4631eb11de686c.reference || (__cxx_static_address_827894230b4631eb11de686c.reference = {
    __cReference: true,
    get value() { return W_TECHWALL5____header_global_89e014079e340779; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:734
export const W_TECHWALL6____header_global_954e801c1ba1b36b = ((((((4136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7b2e6248f27c16fd7ea70814() {
  return __cxx_static_address_7b2e6248f27c16fd7ea70814.reference || (__cxx_static_address_7b2e6248f27c16fd7ea70814.reference = {
    __cReference: true,
    get value() { return W_TECHWALL6____header_global_954e801c1ba1b36b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:735
export const W_TECHWALL7____header_global_8b6ab410ce42b1cf = ((((((4138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d273aee81d9386c4d0160785() {
  return __cxx_static_address_d273aee81d9386c4d0160785.reference || (__cxx_static_address_d273aee81d9386c4d0160785.reference = {
    __cReference: true,
    get value() { return W_TECHWALL7____header_global_8b6ab410ce42b1cf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:736
export const W_TECHWALL8____header_global_63c18e354139f04a = ((((((4140) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1f83682e0840178bb75148c6() {
  return __cxx_static_address_1f83682e0840178bb75148c6.reference || (__cxx_static_address_1f83682e0840178bb75148c6.reference = {
    __cReference: true,
    get value() { return W_TECHWALL8____header_global_63c18e354139f04a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:737
export const W_TECHWALL9____header_global_d7485128ddadea21 = ((((((4142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bac499253dbadd64f0951386() {
  return __cxx_static_address_bac499253dbadd64f0951386.reference || (__cxx_static_address_bac499253dbadd64f0951386.reference = {
    __cReference: true,
    get value() { return W_TECHWALL9____header_global_d7485128ddadea21; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:738
export const BPANNEL3____header_global_f76a18466e2caf9c = ((((((4100) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_10a8c18ecc09807120d2219b() {
  return __cxx_static_address_10a8c18ecc09807120d2219b.reference || (__cxx_static_address_10a8c18ecc09807120d2219b.reference = {
    __cReference: true,
    get value() { return BPANNEL3____header_global_f76a18466e2caf9c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:739
export const W_HITTECHWALL16____header_global_43925ecc071f8588 = ((((((4144) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a2d6b81726b1ad3ded09fb14() {
  return __cxx_static_address_a2d6b81726b1ad3ded09fb14.reference || (__cxx_static_address_a2d6b81726b1ad3ded09fb14.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL16____header_global_43925ecc071f8588; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:740
export const W_HITTECHWALL10____header_global_7e991832bcf4680a = ((((((4145) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_66f6940d9fa557c4015942ff() {
  return __cxx_static_address_66f6940d9fa557c4015942ff.reference || (__cxx_static_address_66f6940d9fa557c4015942ff.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL10____header_global_7e991832bcf4680a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:741
export const W_HITTECHWALL15____header_global_e2fee70bfe2d9fc7 = ((((((4147) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_71481cdab6ae06d911109445() {
  return __cxx_static_address_71481cdab6ae06d911109445.reference || (__cxx_static_address_71481cdab6ae06d911109445.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL15____header_global_e2fee70bfe2d9fc7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:742
export const W_MILKSHELF____header_global_d8106de561ddd4f7 = ((((((4181) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d7643221980e806979dae0a3() {
  return __cxx_static_address_d7643221980e806979dae0a3.reference || (__cxx_static_address_d7643221980e806979dae0a3.reference = {
    __cReference: true,
    get value() { return W_MILKSHELF____header_global_d8106de561ddd4f7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:743
export const W_MILKSHELFBROKE____header_global_3d55435d28761ced = ((((((4203) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5b31a1b776aae35775f9e754() {
  return __cxx_static_address_5b31a1b776aae35775f9e754.reference || (__cxx_static_address_5b31a1b776aae35775f9e754.reference = {
    __cReference: true,
    get value() { return W_MILKSHELFBROKE____header_global_3d55435d28761ced; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:744
export const PURPLELAVA____header_global_3b976d2bd9e06d5c = ((((((4240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_50b8a6d07c7388de3d39f9f7() {
  return __cxx_static_address_50b8a6d07c7388de3d39f9f7.reference || (__cxx_static_address_50b8a6d07c7388de3d39f9f7.reference = {
    __cReference: true,
    get value() { return PURPLELAVA____header_global_3b976d2bd9e06d5c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:745
export const TARGET____header_global_dc810fef7d9bba28 = ((((((4359) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7e5971b378a824708c5cecb0() {
  return __cxx_static_address_7e5971b378a824708c5cecb0.reference || (__cxx_static_address_7e5971b378a824708c5cecb0.reference = {
    __cReference: true,
    get value() { return TARGET____header_global_dc810fef7d9bba28; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:746
export const DUCK____header_global_a60412b965f319b3 = ((((((4361) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4ae3dc2019b5b069fd23d14d() {
  return __cxx_static_address_4ae3dc2019b5b069fd23d14d.reference || (__cxx_static_address_4ae3dc2019b5b069fd23d14d.reference = {
    __cReference: true,
    get value() { return DUCK____header_global_a60412b965f319b3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:747
export const PUKE____header_global_25d1f2d855e5d327 = ((((((4389) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1b86aa510e078f2c3a41f3ec() {
  return __cxx_static_address_1b86aa510e078f2c3a41f3ec.reference || (__cxx_static_address_1b86aa510e078f2c3a41f3ec.reference = {
    __cReference: true,
    get value() { return PUKE____header_global_25d1f2d855e5d327; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:748
export const DOORTILE23____header_global_316b61c4a1220b90 = ((((((4391) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_06b1b0242041e9918fc2e0de() {
  return __cxx_static_address_06b1b0242041e9918fc2e0de.reference || (__cxx_static_address_06b1b0242041e9918fc2e0de.reference = {
    __cReference: true,
    get value() { return DOORTILE23____header_global_316b61c4a1220b90; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:749
export const SPEAKER____header_global_482395b5a9161a6e = ((((((4397) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f578cc6af183e07e411f360b() {
  return __cxx_static_address_f578cc6af183e07e411f360b.reference || (__cxx_static_address_f578cc6af183e07e411f360b.reference = {
    __cReference: true,
    get value() { return SPEAKER____header_global_482395b5a9161a6e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:750
export const MAIL____header_global_1c47e6af302419ee = ((((((4410) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_13921d6b5e46467122d8539b() {
  return __cxx_static_address_13921d6b5e46467122d8539b.reference || (__cxx_static_address_13921d6b5e46467122d8539b.reference = {
    __cReference: true,
    get value() { return MAIL____header_global_1c47e6af302419ee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:751
export const HOTMEAT____header_global_07407ecb128a0a99 = ((((((4427) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_def9a5337635c45386258406() {
  return __cxx_static_address_def9a5337635c45386258406.reference || (__cxx_static_address_def9a5337635c45386258406.reference = {
    __cReference: true,
    get value() { return HOTMEAT____header_global_07407ecb128a0a99; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:752
export const TRIPODCAMERA____header_global_47ebe24c0f23d321 = ((((((4444) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_54afcc67942e9105a145aceb() {
  return __cxx_static_address_54afcc67942e9105a145aceb.reference || (__cxx_static_address_54afcc67942e9105a145aceb.reference = {
    __cReference: true,
    get value() { return TRIPODCAMERA____header_global_47ebe24c0f23d321; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:753
export const PAPER____header_global_1e8868c944faa46a = ((((((4460) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cb00fd002893c8f8c0e9d1f4() {
  return __cxx_static_address_cb00fd002893c8f8c0e9d1f4.reference || (__cxx_static_address_cb00fd002893c8f8c0e9d1f4.reference = {
    __cReference: true,
    get value() { return PAPER____header_global_1e8868c944faa46a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:754
export const GENERICPOLE2____header_global_2a0509eb039bfaa0 = ((((((4465) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2f47bd285654fb1b8483f9fa() {
  return __cxx_static_address_2f47bd285654fb1b8483f9fa.reference || (__cxx_static_address_2f47bd285654fb1b8483f9fa.reference = {
    __cReference: true,
    get value() { return GENERICPOLE2____header_global_2a0509eb039bfaa0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:755
export const XXXSTACY____header_global_2031c98c458db21e = ((((((4470) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0f9b91e9bd4e891586dfd24d() {
  return __cxx_static_address_0f9b91e9bd4e891586dfd24d.reference || (__cxx_static_address_0f9b91e9bd4e891586dfd24d.reference = {
    __cReference: true,
    get value() { return XXXSTACY____header_global_2031c98c458db21e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:756
export const LETTER____header_global_162438d27554a450 = ((((((4502) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_22289beeab2ca0d107906c36() {
  return __cxx_static_address_22289beeab2ca0d107906c36.reference || (__cxx_static_address_22289beeab2ca0d107906c36.reference = {
    __cReference: true,
    get value() { return LETTER____header_global_162438d27554a450; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:757
export const SIDEBOLT1____header_global_c0e914dc0707cf5b = ((((((4525) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_99700a2d58f50d610e453ebb() {
  return __cxx_static_address_99700a2d58f50d610e453ebb.reference || (__cxx_static_address_99700a2d58f50d610e453ebb.reference = {
    __cReference: true,
    get value() { return SIDEBOLT1____header_global_c0e914dc0707cf5b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:758
export const FOODOBJECT16____header_global_a84248a5df0fa252 = ((((((4545) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_13c4b5b1ca2b5f8a295c372d() {
  return __cxx_static_address_13c4b5b1ca2b5f8a295c372d.reference || (__cxx_static_address_13c4b5b1ca2b5f8a295c372d.reference = {
    __cReference: true,
    get value() { return FOODOBJECT16____header_global_a84248a5df0fa252; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:759
export const TAMPON____header_global_dd504deb3bd4950b = ((((((4557) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d4fea1f7b5f3812c4125e3d0() {
  return __cxx_static_address_d4fea1f7b5f3812c4125e3d0.reference || (__cxx_static_address_d4fea1f7b5f3812c4125e3d0.reference = {
    __cReference: true,
    get value() { return TAMPON____header_global_dd504deb3bd4950b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:760
export const CANWITHSOMETHING2____header_global_8cf0cc660c41d0ba = ((((((4580) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2863cb5c0c3b0b746fe7df1e() {
  return __cxx_static_address_2863cb5c0c3b0b746fe7df1e.reference || (__cxx_static_address_2863cb5c0c3b0b746fe7df1e.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING2____header_global_8cf0cc660c41d0ba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:761
export const CANWITHSOMETHING3____header_global_582563fc307a9ed0 = ((((((4581) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a8b874407284fcc1706c05e2() {
  return __cxx_static_address_a8b874407284fcc1706c05e2.reference || (__cxx_static_address_a8b874407284fcc1706c05e2.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING3____header_global_582563fc307a9ed0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:762
export const CANWITHSOMETHING4____header_global_f3cb0886c0bb0aa6 = ((((((4582) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c2a186a99912fd04c0218cd8() {
  return __cxx_static_address_c2a186a99912fd04c0218cd8.reference || (__cxx_static_address_c2a186a99912fd04c0218cd8.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING4____header_global_f3cb0886c0bb0aa6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:763
export const DOLPHIN1____header_global_a637dd8d695a4015 = ((((((4591) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e9ca4bd59717f68a38b7a911() {
  return __cxx_static_address_e9ca4bd59717f68a38b7a911.reference || (__cxx_static_address_e9ca4bd59717f68a38b7a911.reference = {
    __cReference: true,
    get value() { return DOLPHIN1____header_global_a637dd8d695a4015; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:764
export const DOLPHIN2____header_global_5b1a828876ed7f9e = ((((((4592) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5e518eddb4133001f36d71c8() {
  return __cxx_static_address_5e518eddb4133001f36d71c8.reference || (__cxx_static_address_5e518eddb4133001f36d71c8.reference = {
    __cReference: true,
    get value() { return DOLPHIN2____header_global_5b1a828876ed7f9e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:765
export const NEWBEAST____header_global_95ff6c570fea74a0 = ((((((4610) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bf59fe96ea3268193743b0a9() {
  return __cxx_static_address_bf59fe96ea3268193743b0a9.reference || (__cxx_static_address_bf59fe96ea3268193743b0a9.reference = {
    __cReference: true,
    get value() { return NEWBEAST____header_global_95ff6c570fea74a0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:766
export const NEWBEASTSTAYPUT____header_global_62bb208bfa526a5c = ((((((4611) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2c2c841fa88b848cac977c8b() {
  return __cxx_static_address_2c2c841fa88b848cac977c8b.reference || (__cxx_static_address_2c2c841fa88b848cac977c8b.reference = {
    __cReference: true,
    get value() { return NEWBEASTSTAYPUT____header_global_62bb208bfa526a5c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:767
export const BOSS4____header_global_bc0cb7b49131158a = ((((((4740) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_423fc5187599966033e6eaf3() {
  return __cxx_static_address_423fc5187599966033e6eaf3.reference || (__cxx_static_address_423fc5187599966033e6eaf3.reference = {
    __cReference: true,
    get value() { return BOSS4____header_global_bc0cb7b49131158a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:768
export const BOSS4STAYPUT____header_global_dae0613a137696bf = ((((((4741) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3dd73521c442d96bd552ae13() {
  return __cxx_static_address_3dd73521c442d96bd552ae13.reference || (__cxx_static_address_3dd73521c442d96bd552ae13.reference = {
    __cReference: true,
    get value() { return BOSS4STAYPUT____header_global_dae0613a137696bf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:769
export const FEM10____header_global_9b7bf3164293f7bf = ((((((4864) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d3728d9d11b77f8a9cb3b83a() {
  return __cxx_static_address_d3728d9d11b77f8a9cb3b83a.reference || (__cxx_static_address_d3728d9d11b77f8a9cb3b83a.reference = {
    __cReference: true,
    get value() { return FEM10____header_global_9b7bf3164293f7bf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:770
export const TOUGHGAL____header_global_85194f942cd6ded0 = ((((((4866) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_81441b516c496f2ae9424277() {
  return __cxx_static_address_81441b516c496f2ae9424277.reference || (__cxx_static_address_81441b516c496f2ae9424277.reference = {
    __cReference: true,
    get value() { return TOUGHGAL____header_global_85194f942cd6ded0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:771
export const MAN____header_global_bf3af2a4eae13396 = ((((((4871) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_06b93b33f980a61a957f708c() {
  return __cxx_static_address_06b93b33f980a61a957f708c.reference || (__cxx_static_address_06b93b33f980a61a957f708c.reference = {
    __cReference: true,
    get value() { return MAN____header_global_bf3af2a4eae13396; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:772
export const MAN2____header_global_6f8f6e0e03c5ef6e = ((((((4872) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dda0a1855f7aa9fda73432bb() {
  return __cxx_static_address_dda0a1855f7aa9fda73432bb.reference || (__cxx_static_address_dda0a1855f7aa9fda73432bb.reference = {
    __cReference: true,
    get value() { return MAN2____header_global_6f8f6e0e03c5ef6e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:773
export const WOMAN____header_global_06edae995bd57e48 = ((((((4874) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f0b7b9363b20b7733266ddcf() {
  return __cxx_static_address_f0b7b9363b20b7733266ddcf.reference || (__cxx_static_address_f0b7b9363b20b7733266ddcf.reference = {
    __cReference: true,
    get value() { return WOMAN____header_global_06edae995bd57e48; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:774
export const NATURALLIGHTNING____header_global_25d013d87f9494d6 = ((((((4890) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b01b791f25bfd6a2aba3af91() {
  return __cxx_static_address_b01b791f25bfd6a2aba3af91.reference || (__cxx_static_address_b01b791f25bfd6a2aba3af91.reference = {
    __cReference: true,
    get value() { return NATURALLIGHTNING____header_global_25d013d87f9494d6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:775
export const WEATHERWARN____header_global_d50615ff774ad1f1 = ((((((4893) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0147f94f839e0894c36f6bd2() {
  return __cxx_static_address_0147f94f839e0894c36f6bd2.reference || (__cxx_static_address_0147f94f839e0894c36f6bd2.reference = {
    __cReference: true,
    get value() { return WEATHERWARN____header_global_d50615ff774ad1f1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:776
export const DUKETAG____header_global_4ae591e770246d4e = ((((((4900) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f346078507ab15972aff9ce6() {
  return __cxx_static_address_f346078507ab15972aff9ce6.reference || (__cxx_static_address_f346078507ab15972aff9ce6.reference = {
    __cReference: true,
    get value() { return DUKETAG____header_global_4ae591e770246d4e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:777
export const SIGN1____header_global_a5ce8da2988ff290 = ((((((4909) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8d2925209ffdc6efc94ae703() {
  return __cxx_static_address_8d2925209ffdc6efc94ae703.reference || (__cxx_static_address_8d2925209ffdc6efc94ae703.reference = {
    __cReference: true,
    get value() { return SIGN1____header_global_a5ce8da2988ff290; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:778
export const SIGN2____header_global_71a37add6ce9327d = ((((((4912) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_558333e8abff5079d8032d96() {
  return __cxx_static_address_558333e8abff5079d8032d96.reference || (__cxx_static_address_558333e8abff5079d8032d96.reference = {
    __cReference: true,
    get value() { return SIGN2____header_global_71a37add6ce9327d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:779
export const JURYGUY____header_global_b719505524544cd8 = ((((((4943) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_da78bf74656eb54b3a23d980() {
  return __cxx_static_address_da78bf74656eb54b3a23d980.reference || (__cxx_static_address_da78bf74656eb54b3a23d980.reference = {
    __cReference: true,
    get value() { return JURYGUY____header_global_b719505524544cd8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:780
export const WIDESCREENSTATUSBAR____header_global_607495a267796445 = ((((((5120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_91793d126d8f1f86b298cc2d() {
  return __cxx_static_address_91793d126d8f1f86b298cc2d.reference || (__cxx_static_address_91793d126d8f1f86b298cc2d.reference = {
    __cReference: true,
    get value() { return WIDESCREENSTATUSBAR____header_global_607495a267796445; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:781
export const RPGGUNWIDE____header_global_5968bbb968b4524c = ((((((5121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a7097c6c40b39ac235582acd() {
  return __cxx_static_address_a7097c6c40b39ac235582acd.reference || (__cxx_static_address_a7097c6c40b39ac235582acd.reference = {
    __cReference: true,
    get value() { return RPGGUNWIDE____header_global_5968bbb968b4524c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:782
export const FIRSTGUNRELOADWIDE____header_global_a2a89b1fd8a917b9 = ((((((5122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a7f40c82e8c1a38e244b7701() {
  return __cxx_static_address_a7f40c82e8c1a38e244b7701.reference || (__cxx_static_address_a7f40c82e8c1a38e244b7701.reference = {
    __cReference: true,
    get value() { return FIRSTGUNRELOADWIDE____header_global_a2a89b1fd8a917b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:783
export const FREEZEWIDE____header_global_94e98f5b10576732 = ((((((5123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a797d919862b57a376496f2d() {
  return __cxx_static_address_a797d919862b57a376496f2d.reference || (__cxx_static_address_a797d919862b57a376496f2d.reference = {
    __cReference: true,
    get value() { return FREEZEWIDE____header_global_94e98f5b10576732; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:784
export const FREEZEFIREWIDE____header_global_09257276920a54eb = ((((((5124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4d6cbd7c4f5b94429c05eb5c() {
  return __cxx_static_address_4d6cbd7c4f5b94429c05eb5c.reference || (__cxx_static_address_4d6cbd7c4f5b94429c05eb5c.reference = {
    __cReference: true,
    get value() { return FREEZEFIREWIDE____header_global_09257276920a54eb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:785
export const SHRINKERWIDE____header_global_f64924476643084e = ((((((5127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0a68521d8a7c0e51ebe18845() {
  return __cxx_static_address_0a68521d8a7c0e51ebe18845.reference || (__cxx_static_address_0a68521d8a7c0e51ebe18845.reference = {
    __cReference: true,
    get value() { return SHRINKERWIDE____header_global_f64924476643084e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:786
export const CRACKKNUCKLESWIDE____header_global_bb4f9bf503ecfa55 = ((((((5129) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b57dcc5f194fe86b74bff0e0() {
  return __cxx_static_address_b57dcc5f194fe86b74bff0e0.reference || (__cxx_static_address_b57dcc5f194fe86b74bff0e0.reference = {
    __cReference: true,
    get value() { return CRACKKNUCKLESWIDE____header_global_bb4f9bf503ecfa55; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:787
export const FLAMETHROWERSPRITE____header_global_371f8e514a64153d = ((((((5134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f96f4eca3a62fe02aae6efc1() {
  return __cxx_static_address_f96f4eca3a62fe02aae6efc1.reference || (__cxx_static_address_f96f4eca3a62fe02aae6efc1.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERSPRITE____header_global_371f8e514a64153d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:788
export const FLAMETHROWERAMMO____header_global_c55e77e70aec1f9a = ((((((5135) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8a66fa1a251934022c9481aa() {
  return __cxx_static_address_8a66fa1a251934022c9481aa.reference || (__cxx_static_address_8a66fa1a251934022c9481aa.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERAMMO____header_global_c55e77e70aec1f9a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:789
export const FLAMETHROWER____header_global_02caf3e5548b7a2d = ((((((5138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_09d2209fdb331c74c2de0e1c() {
  return __cxx_static_address_09d2209fdb331c74c2de0e1c.reference || (__cxx_static_address_09d2209fdb331c74c2de0e1c.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER____header_global_02caf3e5548b7a2d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:790
export const FLAMETHROWERFIRE____header_global_dd190894587f6d5c = ((((((5139) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f2b1925f95f39f1c754e4b34() {
  return __cxx_static_address_f2b1925f95f39f1c754e4b34.reference || (__cxx_static_address_f2b1925f95f39f1c754e4b34.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERFIRE____header_global_dd190894587f6d5c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:791
export const FLAMETHROWERFLAME____header_global_ab70afe864b2b35f = ((((((1891) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d7df6741d845687da9853c08() {
  return __cxx_static_address_d7df6741d845687da9853c08.reference || (__cxx_static_address_d7df6741d845687da9853c08.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERFLAME____header_global_ab70afe864b2b35f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:792
export const FLAMETHROWERPILOT____header_global_99a0968a2337d075 = ((((((5174) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5ec288d9e3899f4adb0cdbd6() {
  return __cxx_static_address_5ec288d9e3899f4adb0cdbd6.reference || (__cxx_static_address_5ec288d9e3899f4adb0cdbd6.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERPILOT____header_global_99a0968a2337d075; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:793
export const FIREBALL____header_global_fc11258c18df0e5d = ((((((5163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_39fe75ab607447f67ac7d022() {
  return __cxx_static_address_39fe75ab607447f67ac7d022.reference || (__cxx_static_address_39fe75ab607447f67ac7d022.reference = {
    __cReference: true,
    get value() { return FIREBALL____header_global_fc11258c18df0e5d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:794
export const ONFIRE____header_global_b11d701136aa5cea = ((((((5152) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3d2d3ec5c07709a7b56dde55() {
  return __cxx_static_address_3d2d3ec5c07709a7b56dde55.reference || (__cxx_static_address_3d2d3ec5c07709a7b56dde55.reference = {
    __cReference: true,
    get value() { return ONFIRE____header_global_b11d701136aa5cea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:795
export const ONFIRESMOKE____header_global_a904ebade50b8020 = ((((((5143) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a8d4acfb4b76be7d03ddf2be() {
  return __cxx_static_address_a8d4acfb4b76be7d03ddf2be.reference || (__cxx_static_address_a8d4acfb4b76be7d03ddf2be.reference = {
    __cReference: true,
    get value() { return ONFIRESMOKE____header_global_a904ebade50b8020; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:796
export const BURNEDCORPSE____header_global_d764989038228596 = ((((((5173) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3499a5a8c8dc240f80fb85aa() {
  return __cxx_static_address_3499a5a8c8dc240f80fb85aa.reference || (__cxx_static_address_3499a5a8c8dc240f80fb85aa.reference = {
    __cReference: true,
    get value() { return BURNEDCORPSE____header_global_d764989038228596; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:797
export const WHISPYSMOKE____header_global_a86e794ce97e6684 = ((((((5268) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6a6cd0ac2528f8f405b75e4d() {
  return __cxx_static_address_6a6cd0ac2528f8f405b75e4d.reference || (__cxx_static_address_6a6cd0ac2528f8f405b75e4d.reference = {
    __cReference: true,
    get value() { return WHISPYSMOKE____header_global_a86e794ce97e6684; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:798
export const FIREFLY____header_global_459d033741ec42f5 = ((((((5180) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2aad4ffe9b25e40e80f5b38e() {
  return __cxx_static_address_2aad4ffe9b25e40e80f5b38e.reference || (__cxx_static_address_2aad4ffe9b25e40e80f5b38e.reference = {
    __cReference: true,
    get value() { return FIREFLY____header_global_459d033741ec42f5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:799
export const FIREFLYSHRINKEFFECT____header_global_f68f49251a797657 = ((((((5360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7581dda5aa03004b56756d75() {
  return __cxx_static_address_7581dda5aa03004b56756d75.reference || (__cxx_static_address_7581dda5aa03004b56756d75.reference = {
    __cReference: true,
    get value() { return FIREFLYSHRINKEFFECT____header_global_f68f49251a797657; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:800
export const FIREFLYGROWEFFECT____header_global_74615d08ae14f02e = ((((((5367) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0a6615e0c0eca589cfc80d1e() {
  return __cxx_static_address_0a6615e0c0eca589cfc80d1e.reference || (__cxx_static_address_0a6615e0c0eca589cfc80d1e.reference = {
    __cReference: true,
    get value() { return FIREFLYGROWEFFECT____header_global_74615d08ae14f02e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:801
export const FIREFLYFLYINGEFFECT____header_global_df6efc9afa6085fd = ((((((5296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7c33b5f506a8438d61fa8c24() {
  return __cxx_static_address_7c33b5f506a8438d61fa8c24.reference || (__cxx_static_address_7c33b5f506a8438d61fa8c24.reference = {
    __cReference: true,
    get value() { return FIREFLYFLYINGEFFECT____header_global_df6efc9afa6085fd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:802
export const BOSS5____header_global_827181004a948746 = ((((((5310) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_96f8a45a12465d86329f591b() {
  return __cxx_static_address_96f8a45a12465d86329f591b.reference || (__cxx_static_address_96f8a45a12465d86329f591b.reference = {
    __cReference: true,
    get value() { return BOSS5____header_global_827181004a948746; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:803
export const BOSS5STAYPUT____header_global_9ab32db2f2bfa53b = ((((((5311) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1381394125def1e1a807b93f() {
  return __cxx_static_address_1381394125def1e1a807b93f.reference || (__cxx_static_address_1381394125def1e1a807b93f.reference = {
    __cReference: true,
    get value() { return BOSS5STAYPUT____header_global_9ab32db2f2bfa53b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:804
export const LAVAPOOL____header_global_74bb0bbc2424baa5 = ((((((5304) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a2e8bf078e272aabfc309842() {
  return __cxx_static_address_a2e8bf078e272aabfc309842.reference || (__cxx_static_address_a2e8bf078e272aabfc309842.reference = {
    __cReference: true,
    get value() { return LAVAPOOL____header_global_74bb0bbc2424baa5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:805
export const LAVASPLASH____header_global_f6f5480e3ed04896 = ((((((5371) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eb7e881afedc1696a1a79a08() {
  return __cxx_static_address_eb7e881afedc1696a1a79a08.reference || (__cxx_static_address_eb7e881afedc1696a1a79a08.reference = {
    __cReference: true,
    get value() { return LAVASPLASH____header_global_f6f5480e3ed04896; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:806
export const LAVAPOOLBUBBLE____header_global_c660ec4a30730205 = ((((((5207) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_efb71718b1f17cd25096b762() {
  return __cxx_static_address_efb71718b1f17cd25096b762.reference || (__cxx_static_address_efb71718b1f17cd25096b762.reference = {
    __cReference: true,
    get value() { return LAVAPOOLBUBBLE____header_global_c660ec4a30730205; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:807
export const BOSS2STAYPUT____header_global_8709520a156d683f = ((((((2711) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ab4f908df5dc55712f3edad5() {
  return __cxx_static_address_ab4f908df5dc55712f3edad5.reference || (__cxx_static_address_ab4f908df5dc55712f3edad5.reference = {
    __cReference: true,
    get value() { return BOSS2STAYPUT____header_global_8709520a156d683f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:808
export const BOSS3STAYPUT____header_global_7a517307766b17c1 = ((((((2761) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_81bdd81926663f777a3ca0c1() {
  return __cxx_static_address_81bdd81926663f777a3ca0c1.reference || (__cxx_static_address_81bdd81926663f777a3ca0c1.reference = {
    __cReference: true,
    get value() { return BOSS3STAYPUT____header_global_7a517307766b17c1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:809
export const E32_TILE5736____header_global_281209c86e67cc4c = ((((((5736) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d3676a155a16e4464802da20() {
  return __cxx_static_address_d3676a155a16e4464802da20.reference || (__cxx_static_address_d3676a155a16e4464802da20.reference = {
    __cReference: true,
    get value() { return E32_TILE5736____header_global_281209c86e67cc4c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:810
export const E32_TILE5737____header_global_86929276446070e4 = ((((((5737) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2b5dbfbc792c9bfe8d585771() {
  return __cxx_static_address_2b5dbfbc792c9bfe8d585771.reference || (__cxx_static_address_2b5dbfbc792c9bfe8d585771.reference = {
    __cReference: true,
    get value() { return E32_TILE5737____header_global_86929276446070e4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:811
export const E32_TILE5846____header_global_bb74ec32e1f93ff6 = ((((((5846) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a670c3bda6a949b8cbed5a9f() {
  return __cxx_static_address_a670c3bda6a949b8cbed5a9f.reference || (__cxx_static_address_a670c3bda6a949b8cbed5a9f.reference = {
    __cReference: true,
    get value() { return E32_TILE5846____header_global_bb74ec32e1f93ff6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/network.h:180
export const cSnapshotMemUsage__header_global_0034930d663a3261 = u64((BigInt(u64(64)) * BigInt((BigInt((BigInt((BigInt(72) * BigInt(u64(16384)))) + BigInt((BigInt(96) * BigInt(u64(4096)))))) + BigInt((BigInt(296) * BigInt(u64(16384))))))));
function __cxx_static_address_1661d974d7f2968cd1f4d873() {
  return __cxx_static_address_1661d974d7f2968cd1f4d873.reference || (__cxx_static_address_1661d974d7f2968cd1f4d873.reference = {
    __cReference: true,
    get value() { return cSnapshotMemUsage__header_global_0034930d663a3261; },
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

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_a66bbf7098414750 = i32(2147483647);
function __cxx_static_address_8f4493e5ad154d3151f3f72f() {
  return __cxx_static_address_8f4493e5ad154d3151f3f72f.reference || (__cxx_static_address_8f4493e5ad154d3151f3f72f.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_a66bbf7098414750; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_fbc47bc8d2494441 = i32(2147483648);
function __cxx_static_address_6765844fadda978b7ee64c62() {
  return __cxx_static_address_6765844fadda978b7ee64c62.reference || (__cxx_static_address_6765844fadda978b7ee64c62.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_fbc47bc8d2494441; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_b8331aa299ddcf38 = i32(2147483648);
function __cxx_static_address_b1007ccbd9849e8c0926d6f3() {
  return __cxx_static_address_b1007ccbd9849e8c0926d6f3.reference || (__cxx_static_address_b1007ccbd9849e8c0926d6f3.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_b8331aa299ddcf38; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_ae0161d8e1662fca = i32(65536);
function __cxx_static_address_eefe536fecda23d0765385d4() {
  return __cxx_static_address_eefe536fecda23d0765385d4.reference || (__cxx_static_address_eefe536fecda23d0765385d4.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_ae0161d8e1662fca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_6975e62ae2910142 = i32(32768);
function __cxx_static_address_66d48817c8cc03f0ef265901() {
  return __cxx_static_address_66d48817c8cc03f0ef265901.reference || (__cxx_static_address_66d48817c8cc03f0ef265901.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_6975e62ae2910142; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_ad7f96bf2d969d49 = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_1a0ee45dd7fab6d175f4b7b7() {
  return __cxx_static_address_1a0ee45dd7fab6d175f4b7b7.reference || (__cxx_static_address_1a0ee45dd7fab6d175f4b7b7.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_ad7f96bf2d969d49; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_705844f01e6772c0 = new Uint8Array([((1) & 255), ((2) & 255), ((4) & 255), ((8) & 255), ((16) & 255), ((32) & 255), ((64) & 255), ((128) & 255)]);
function __cxx_static_address_eba20a360842faa8ae3172cd() {
  return __cxx_static_address_eba20a360842faa8ae3172cd.reference || (__cxx_static_address_eba20a360842faa8ae3172cd.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_705844f01e6772c0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:172
export const g_defaultVideoModes__header_global_629d0460ef377b2e = [cMarkAggregate(({"x": 2560, "y": 1440})), cMarkAggregate(({"x": 2560, "y": 1200})), cMarkAggregate(({"x": 2560, "y": 1080})), cMarkAggregate(({"x": 1920, "y": 1440})), cMarkAggregate(({"x": 1920, "y": 1200})), cMarkAggregate(({"x": 1920, "y": 1080})), cMarkAggregate(({"x": 1680, "y": 1050})), cMarkAggregate(({"x": 1600, "y": 1200})), cMarkAggregate(({"x": 1600, "y": 900})), cMarkAggregate(({"x": 1366, "y": 768})), cMarkAggregate(({"x": 1280, "y": 1024})), cMarkAggregate(({"x": 1280, "y": 960})), cMarkAggregate(({"x": 1280, "y": 720})), cMarkAggregate(({"x": 1152, "y": 864})), cMarkAggregate(({"x": 1024, "y": 768})), cMarkAggregate(({"x": 1024, "y": 600})), cMarkAggregate(({"x": 800, "y": 600})), cMarkAggregate(({"x": 640, "y": 480})), cMarkAggregate(({"x": 640, "y": 400})), cMarkAggregate(({"x": 512, "y": 384})), cMarkAggregate(({"x": 480, "y": 360})), cMarkAggregate(({"x": 400, "y": 300})), cMarkAggregate(({"x": 320, "y": 240})), cMarkAggregate(({"x": 320, "y": 200})), cMarkAggregate(({"x": 0, "y": 0}))];
function __cxx_static_address_d8b4221570ac71390fdbed00() {
  return __cxx_static_address_d8b4221570ac71390fdbed00.reference || (__cxx_static_address_d8b4221570ac71390fdbed00.reference = {
    __cReference: true,
    get value() { return g_defaultVideoModes__header_global_629d0460ef377b2e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:188
export const g_keyAsciiTable__header_global_7e65736deb8ca342 = new Uint8Array([((0) & 255), ((0) & 255), 49, 50, 51, 52, 53, 54, 55, 56, 57, 48, 45, 61, ((0) & 255), ((0) & 255), 113, 119, 101, 114, 116, 121, 117, 105, 111, 112, 91, 93, ((0) & 255), ((0) & 255), 97, 115, 100, 102, 103, 104, 106, 107, 108, 59, ((39) & 255), 96, ((0) & 255), ((92) & 255), 122, 120, 99, 118, 98, 110, 109, 44, 46, 47, ((0) & 255), 42, ((0) & 255), ((32) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255)]);
function __cxx_static_address_41e6301ddf602ea94f10baa9() {
  return __cxx_static_address_41e6301ddf602ea94f10baa9.reference || (__cxx_static_address_41e6301ddf602ea94f10baa9.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTable__header_global_7e65736deb8ca342; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:196
export const g_keyAsciiTableShift__header_global_77f5d994052025fc = new Uint8Array([((0) & 255), ((0) & 255), 33, 64, 35, 36, 37, 94, 38, 42, 40, 41, 95, 43, ((0) & 255), ((0) & 255), 81, 87, 69, 82, 84, 89, 85, 73, 79, 80, 123, 125, ((0) & 255), ((0) & 255), 65, 83, 68, 70, 71, 72, 74, 75, 76, 58, 34, 126, ((0) & 255), 124, 90, 88, 67, 86, 66, 78, 77, 60, 62, 63, ((0) & 255), 42, ((0) & 255), ((32) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255)]);
function __cxx_static_address_f61742dbc8b3b9560482ff4b() {
  return __cxx_static_address_f61742dbc8b3b9560482ff4b.reference || (__cxx_static_address_f61742dbc8b3b9560482ff4b.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTableShift__header_global_77f5d994052025fc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:895
export const pow2long__header_global_56035d4519c9bcb2 = new Int32Array([1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576, 2097152, 4194304, 8388608, 16777216, 33554432, 67108864, 134217728, 268435456, 536870912, 1073741824, 2147483647]);
function __cxx_static_address_30819a08fcd4aaeb47cfc2b5() {
  return __cxx_static_address_30819a08fcd4aaeb47cfc2b5.reference || (__cxx_static_address_30819a08fcd4aaeb47cfc2b5.reference = {
    __cReference: true,
    get value() { return pow2long__header_global_56035d4519c9bcb2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:907
export const pow2ulong__header_global_81fecdaf7ec2794f = new Uint32Array([u32(1), u32(2), u32(4), u32(8), u32(16), u32(32), u32(64), u32(128), u32(256), u32(512), u32(1024), u32(2048), u32(4096), u32(8192), u32(16384), u32(32768), u32(65536), u32(131072), u32(262144), u32(524288), u32(1048576), u32(2097152), u32(4194304), u32(8388608), u32(16777216), u32(33554432), u32(67108864), u32(134217728), u32(268435456), u32(536870912), u32(1073741824), u32(2147483648n)]);
function __cxx_static_address_d0c0ed4388b8e68119fef304() {
  return __cxx_static_address_d0c0ed4388b8e68119fef304.reference || (__cxx_static_address_d0c0ed4388b8e68119fef304.reference = {
    __cReference: true,
    get value() { return pow2ulong__header_global_81fecdaf7ec2794f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:919
export const pow264__header_global_f2a1ba9b798fc26c = new BigInt64Array([BigInt(i64(1)), BigInt(i64(2)), BigInt(i64(4)), BigInt(i64(8)), BigInt(i64(16)), BigInt(i64(32)), BigInt(i64(64)), BigInt(i64(128)), BigInt(i64(256)), BigInt(i64(512)), BigInt(i64(1024)), BigInt(i64(2048)), BigInt(i64(4096)), BigInt(i64(8192)), BigInt(i64(16384)), BigInt(i64(32768)), BigInt(i64(65536)), BigInt(i64(131072)), BigInt(i64(262144)), BigInt(i64(524288)), BigInt(i64(1048576)), BigInt(i64(2097152)), BigInt(i64(4194304)), BigInt(i64(8388608)), BigInt(i64(16777216)), BigInt(i64(33554432)), BigInt(i64(67108864)), BigInt(i64(134217728)), BigInt(i64(268435456)), BigInt(i64(536870912)), BigInt(i64(1073741824)), BigInt(2147483648n), BigInt(4294967296n), BigInt(8589934592n), BigInt(17179869184n), BigInt(34359738368n), BigInt(68719476736n), BigInt(137438953472n), BigInt(274877906944n), BigInt(549755813888n), BigInt(1099511627776n), BigInt(2199023255552n), BigInt(4398046511104n), BigInt(8796093022208n), BigInt(17592186044416n), BigInt(35184372088832n), BigInt(70368744177664n), BigInt(140737488355328n), BigInt(281474976710656n), BigInt(562949953421312n), BigInt(1125899906842624n), BigInt(2251799813685248n), BigInt(4503599627370496n), BigInt(9007199254740992n), BigInt(18014398509481984n), BigInt(36028797018963968n), BigInt(72057594037927936n), BigInt(144115188075855872n), BigInt(288230376151711744n), BigInt(576460752303423488n), BigInt(1152921504606846976n), BigInt(2305843009213693952n), BigInt(4611686018427387904n), BigInt(9223372036854775807n)]);
function __cxx_static_address_2927e06585ca8f8ebea8d83e() {
  return __cxx_static_address_2927e06585ca8f8ebea8d83e.reference || (__cxx_static_address_2927e06585ca8f8ebea8d83e.reference = {
    __cReference: true,
    get value() { return pow264__header_global_f2a1ba9b798fc26c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
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
