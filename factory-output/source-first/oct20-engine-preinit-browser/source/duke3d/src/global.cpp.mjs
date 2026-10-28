// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/duke3d/src/global.cpp
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

const cRecordObject = source => {
  if (source?.__cDeferredPointer === true || source?.__cDeferredReference === true) return cRecordObject(source.resolve());
  if (source?.__cReference === true) return source.value;
  if (Array.isArray(source)) { if (!source.length) throw new RangeError("C record pointer dereferences empty array"); return source[0]; }
  if (source?.__cRecordPointer === true) return globalThis[Symbol.for("source-first.record-pointer-views/1")].deref(source);
  if (source?.__cPointer === true) {
    if (!source.array) throw new TypeError("C record pointer requires source-backed object slots");
    return cPointerElementRef(source,0).value;
  }
  return source;
};
const cStaticReference = resolve => ({ __cReference:true, __cDeferredReference:true, resolve, get value() { return resolve().value; }, set value(value) { resolve().value=value; } });
const cObjectFieldRef = (owner, field) => { const storage=owner?.[Symbol.for("source-first.original-byte-record-storage/1")]; if(storage)return globalThis[Symbol.for("source-first.record-pointer-views/1")].fieldReference(owner,field); const key=Symbol.for("source-object-field-references/1"); if (!Object.hasOwn(owner,key)) Object.defineProperty(owner,key,{value:new Map()}); const refs=owner[key]; if (!refs.has(field)) refs.set(field,{__cReference:true,get value(){return owner[field];},set value(value){owner[field]=value;}}); return refs.get(field); };
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
    if (value?.__cReference===true&&value.__cPointer!==true) {
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
const cPointerArray = (count, values=[], storage=null) => {
  if(!Number.isSafeInteger(count)||count<0||count>1000000||!Array.isArray(values)||values.length>count)
    throw new RangeError('Invalid original pointer-array extent');
  const bytes=storage||new Uint8Array(count*8);
  if(!(bytes instanceof Uint8Array)||bytes.length!==count*8||bytes.byteOffset%8)
    throw new TypeError('Pointer array backing store differs from original LP64 extent');
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.length),slots=new Array(count).fill(null);
  const allocationView=new DataView(bytes.buffer);
  const allocationKey=Symbol.for('source-first.pointer-array-allocations/1');
  const allocations=globalThis[allocationKey]||(globalThis[allocationKey]=new WeakMap());
  allocations.set(bytes.buffer,{lower:0,upper:bytes.buffer.byteLength,
    read:offset=>cByteRecordPointers.decode(allocationView.getBigUint64(offset,true)),
    write:(offset,value)=>allocationView.setBigUint64(offset,cByteRecordPointers.encode(value),true)});
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
// Array subobjects are views over their enclosing original allocation.
const cByteArrayMember = (field,bytes,prototypes,values=[]) => {
  const dims=field.dims;
  if(!Array.isArray(dims)||!dims.length||dims.length>8||dims.some(d=>!Number.isSafeInteger(d)||d<1)||
      !Array.isArray(values)||values.length>dims[0])throw new TypeError('Invalid Clang member-array dimensions');
  const count=dims.reduce((a,b)=>a*b,1);
  if(field.recordArray){
    if(field.recordArray.size*count!==bytes.length)throw new TypeError('Record member-array extent mismatch');
    return cByteRecordNDArray(field.recordArray,dims,prototypes,values,bytes);
  }
  const C=field.nativeArray&&cByteRecordNative[field.nativeArray]?.[0],width=field.pointerArray?8:C?.BYTES_PER_ELEMENT;
  if(!width||width*count!==bytes.length)throw new TypeError('Member-array extent mismatch');
  if(dims.length===1){
    if(field.pointerArray)return cPointerArray(dims[0],values,bytes);
    const array=new C(bytes.buffer,bytes.byteOffset,dims[0]);array.set(values);return array;
  }
  const stride=bytes.length/dims[0];
  const rows=Array.from({length:dims[0]},(_,i)=>cByteArrayMember({...field,dims:dims.slice(1)},
    bytes.subarray(i*stride,(i+1)*stride),prototypes,values[i]||[]));
  Object.defineProperty(rows,Symbol.for('source-first.clang-byte-record-array/1'),{value:bytes});
  return rows;
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
    if(field.bitfield){
      const bits=field.bitfield;
      if(!Number.isSafeInteger(bits.start)||bits.start<0||bits.start>7||
          !Number.isSafeInteger(bits.width)||bits.width<1||bits.width>64||
          field.size!==Math.ceil((bits.start+bits.width)/8)||field.offset+field.size>bytes.length)
        throw new TypeError('Invalid target-Clang bitfield range');
      const read=()=>{let raw=0n;for(let i=0;i<field.size;i++)raw|=BigInt(bytes[field.offset+i])<<BigInt(i*8);return raw;};
      const mask=((1n<<BigInt(bits.width))-1n)<<BigInt(bits.start);
      Object.defineProperty(result,name,{enumerable:true,get:()=>{
        let value=BigInt.asUintN(bits.width,read()>>BigInt(bits.start));
        if(bits.signed)value=BigInt.asIntN(bits.width,value);
        return bits.boolean?value!==0n:bits.wide?value:Number(value);
      },set:value=>{
        const next=(read()&~mask)|(BigInt.asUintN(bits.width,BigInt(value))<<BigInt(bits.start));
        for(let i=0;i<field.size;i++)bytes[field.offset+i]=Number((next>>BigInt(i*8))&255n);
      }});
    } else if (field.pointer) {
      if (field.pointer!==true || field.size!==8 || field.offset+8>bytes.length)
        throw new TypeError('Pointer field differs from verified LP64 ABI');
      Object.defineProperty(result,name,{enumerable:true,
        get:()=>cByteRecordPointers.decode(view.getBigUint64(field.offset,true)),
        set:value=>view.setBigUint64(field.offset,cByteRecordPointers.encode(value),true)});
    } else if (field.recordArray||field.pointerArray||field.nativeArray) {
      if(!Number.isSafeInteger(field.size)||field.offset+field.size>bytes.length)
        throw new TypeError('Member array exceeds original record');
      const array=cByteArrayMember(field,bytes.subarray(field.offset,field.offset+field.size),prototypes);
      Object.defineProperty(result,name,{value:array,enumerable:true});
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
    if(field.recordArray||field.pointerArray||field.nativeArray){
      const dest=result[name][Symbol.for('source-first.clang-byte-record-array/1')];
      if(field.recordArray){
        const source=value?.[Symbol.for('source-first.clang-byte-record-array/1')];
        if(!source||source.length!==field.size||value[Symbol.for('source-first.byte-record-array-layout/1')]!==
            JSON.stringify({schema:field.recordArray,dims:field.dims}))throw new TypeError('Member record-array initializer differs from Clang schema');
        dest.set(source);
      }else cByteArrayMember(field,bytes.subarray(field.offset,field.offset+field.size),prototypes,value);
    } else if (field.byteRecord) {
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
const cByteRecordArray = (schema, count, prototypes={}, initializers=[], storage=null) => {
  if (!Number.isSafeInteger(count) || count < 1 || count > 1000000 ||
      !Number.isSafeInteger(schema?.size) || schema.size < 1 ||
      schema.size > 1048576 || count * schema.size > 268435456)
    throw new RangeError('C record array exceeds proven bounded storage');
  if(!Array.isArray(initializers)||initializers.length>count)throw new RangeError('C record initializer exceeds array extent');
  const bytes = storage || new Uint8Array(count * schema.size);
  if(!(bytes instanceof Uint8Array)||bytes.length!==count*schema.size)
    throw new TypeError('C record array backing store differs from Clang extent');
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
  Object.defineProperty(records,Symbol.for('source-first.byte-record-array-layout/1'),
    {value:JSON.stringify({schema,dims:[count]})});
  Object.defineProperty(records,Symbol.for('source-first.byte-record-array-prototypes/1'),{value:prototypes});
  const result=new Proxy(records, {
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
  for(let i=0;i<initializers.length;i++)result[i]=initializers[i];
  return result;
};

// Every row and element in a multidimensional C array shares one allocation.
const cByteRecordNDArray = (schema,dims,prototypes={},initializers=[],storage=null) => {
  if(!Array.isArray(dims)||dims.length<1||dims.length>8||
      dims.some(n=>!Number.isSafeInteger(n)||n<1||n>1000000)||
      !Number.isSafeInteger(schema?.size)||schema.size<1||
      dims.reduce((a,b)=>a*b,1)*schema.size>268435456)
    throw new RangeError('Invalid Clang record array dimensions');
  if(dims.length===1)return cByteRecordArray(schema,dims[0],prototypes,initializers,storage);
  if(!Array.isArray(initializers)||initializers.length>dims[0])throw new RangeError('C record row initializer exceeds extent');
  const stride=dims.slice(1).reduce((a,b)=>a*b,1)*schema.size;
  const bytes=storage||new Uint8Array(dims[0]*stride);
  if(!(bytes instanceof Uint8Array)||bytes.length!==dims[0]*stride)throw new TypeError('Invalid record row storage');
  const rows=Array.from({length:dims[0]},(_,i)=>cByteRecordNDArray(schema,dims.slice(1),prototypes,
    initializers[i]||[],bytes.subarray(i*stride,(i+1)*stride)));
  Object.defineProperty(rows,cByteRecordArrayStorage,{value:bytes});
  Object.defineProperty(rows,Symbol.for('source-first.byte-record-array-layout/1'),{value:JSON.stringify({schema,dims})});
  Object.defineProperty(rows,Symbol.for('source-first.byte-record-array-prototypes/1'),{value:prototypes});
  return rows;
};

// Typed casts create views over original bytes, never detached struct copies.
const cRecordPointerViews = (()=>{
  const key=Symbol.for('source-first.record-pointer-views/1');
  if(globalThis[key])return globalThis[key];
  const buffers=new WeakMap(),fieldReferences=new WeakMap();
  const api={
    fieldReference(owner,name){
      const storage=cByteRecordStorage.get(owner),field=storage&&JSON.parse(storage.schema).fields[name];
      if(!field)throw new TypeError('Field address requires original Clang storage');
      let fields=fieldReferences.get(owner);if(!fields){fields=new Map();fieldReferences.set(owner,fields);}
      if(!fields.has(name)){
        const reference={__cReference:true,get value(){return owner[name];},set value(next){owner[name]=next;}};
        Object.defineProperty(reference,Symbol.for('source-first.record-field-owner/1'),{value:owner});
        if(!field.byteRecord&&!field.recordArray&&!field.pointerArray&&!field.nativeArray&&!field.bitfield&&!Object.hasOwn(field,'length'))Object.assign(reference,{
          __cPointer:true,buffer:storage.bytes.buffer,array:false,
          lower:storage.bytes.byteOffset+field.offset,offset:storage.bytes.byteOffset+field.offset,
          upper:storage.bytes.byteOffset+field.offset+field.size});
        fields.set(name,reference);
      }
      return fields.get(name);
    },
    deref(pointer){
      const p=pointer,schema=p.recordSchema;
      if(p.__cPointer!==true||p.__cRecordPointer!==true||p.array||!schema||p.offset<p.lower||p.offset+schema.size>p.upper)
        throw new RangeError('C record dereference escapes original byte allocation');
      const identity=p.offset+':'+JSON.stringify(schema);
      let views=buffers.get(p.buffer);if(!views){views=new Map();buffers.set(p.buffer,views);}
      if(!views.has(identity))views.set(identity,cInitByteRecord(schema,{},new Uint8Array(p.buffer,p.offset,schema.size),p.recordPrototypes));
      return views.get(identity);
    },
    element(pointer,index){
      const offset=pointer.offset+Number(index)*pointer.recordSchema.size;
      if(!Number.isSafeInteger(offset))throw new RangeError('Record-pointer index is not exactly representable');
      const item={...pointer,offset},record=api.deref(item);
      return {get value(){return record;},set value(next){
        const source=cByteRecordStorage.get(next),destination=cByteRecordStorage.get(record);
        if(!source||source.schema!==destination.schema)throw new TypeError('Record-pointer assignment requires identical Clang layout');
        destination.bytes.set(source.bytes);
      }};
    }
  };
  Object.defineProperty(globalThis,key,{value:api});return api;
})();
const cRecordPointer = (source,schema,prototypes={}) => {
  if(source===null)return null;
  if(source?.__cDeferredPointer||source?.__cDeferredReference)return cRecordPointer(source.resolve(),schema,prototypes);
  if(source?.__cReference&&source.__cPointer!==true)return cRecordPointer(source.value,schema,prototypes);
  const owner=source?.[Symbol.for('source-first.record-field-owner/1')],owned=owner&&cByteRecordStorage.get(owner);
  if(owned&&source.offset===owned.bytes.byteOffset&&JSON.stringify(schema)===owned.schema)
    return cRecordPointer(owner,schema,prototypes);
  const bytes=cByteRecordStorage.get(source)?.bytes||source?.[cByteRecordArrayStorage];
  const pointer=cPointer(bytes||source);
  if(pointer.array||!Number.isSafeInteger(schema?.size)||schema.size<1||
      !Number.isSafeInteger(schema.align)||schema.align<1||pointer.offset%schema.align)
    throw new TypeError('Record pointer requires aligned Clang-proven original bytes');
  return {...pointer,__cRecordPointer:true,recordSchema:schema,recordPrototypes:prototypes};
};

// Readable JS representation of Clang-proven pointer-free C/C++ POD copies.
// Fail closed if external storage has not been materialized in the agreed type.
const cCopyAggregate = (value, schema) => {
  if(schema.recordArray){
    const bytes=value?.[cByteRecordArrayStorage];
    if(!bytes||value[Symbol.for('source-first.byte-record-array-layout/1')]!==JSON.stringify({schema:schema.recordArray,dims:schema.dims}))
      throw new TypeError('C record-array copy requires identical Clang storage');
    return cByteRecordNDArray(schema.recordArray,schema.dims,value[Symbol.for('source-first.byte-record-array-prototypes/1')]||{},[],bytes.slice());
  }
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
  if(schema.recordArray)return cByteRecordNDArray(schema.recordArray,schema.dims,prototypes);
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
export const fix16_rad_to_deg_mult__header_global_cad47d444a93091f = i32(3754936);
function __cxx_static_address_0b23174a25a9d88a494e7ad4() {
  return __cxx_static_address_0b23174a25a9d88a494e7ad4.reference || (__cxx_static_address_0b23174a25a9d88a494e7ad4.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_cad47d444a93091f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_3ea979f1c38ad60c = i32(1144);
function __cxx_static_address_b21e850eb04126e14b486db7() {
  return __cxx_static_address_b21e850eb04126e14b486db7.reference || (__cxx_static_address_b21e850eb04126e14b486db7.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_3ea979f1c38ad60c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:43
export const KICK_HIT____header_global_346f39066bb77faf = ((((((0) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ddee6239bf3bd716ae9850f5() {
  return __cxx_static_address_ddee6239bf3bd716ae9850f5.reference || (__cxx_static_address_ddee6239bf3bd716ae9850f5.reference = {
    __cReference: true,
    get value() { return KICK_HIT____header_global_346f39066bb77faf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:44
export const PISTOL_RICOCHET____header_global_a8b20d2639102e6a = ((((((1) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8e31292cb501375b69008611() {
  return __cxx_static_address_8e31292cb501375b69008611.reference || (__cxx_static_address_8e31292cb501375b69008611.reference = {
    __cReference: true,
    get value() { return PISTOL_RICOCHET____header_global_a8b20d2639102e6a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:45
export const PISTOL_BODYHIT____header_global_46177d116f4a0348 = ((((((2) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1bfec4b860781f10b94e02f4() {
  return __cxx_static_address_1bfec4b860781f10b94e02f4.reference || (__cxx_static_address_1bfec4b860781f10b94e02f4.reference = {
    __cReference: true,
    get value() { return PISTOL_BODYHIT____header_global_46177d116f4a0348; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:46
export const PISTOL_FIRE____header_global_8745d8f28aa0a346 = ((((((3) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f22931b738eb6b425bfd73eb() {
  return __cxx_static_address_f22931b738eb6b425bfd73eb.reference || (__cxx_static_address_f22931b738eb6b425bfd73eb.reference = {
    __cReference: true,
    get value() { return PISTOL_FIRE____header_global_8745d8f28aa0a346; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:47
export const EJECT_CLIP____header_global_c95df23e3b5cd4fb = ((((((4) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1815da175d92a004f239cb0d() {
  return __cxx_static_address_1815da175d92a004f239cb0d.reference || (__cxx_static_address_1815da175d92a004f239cb0d.reference = {
    __cReference: true,
    get value() { return EJECT_CLIP____header_global_c95df23e3b5cd4fb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:48
export const INSERT_CLIP____header_global_9cd9c41f05dc5292 = ((((((5) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_77aa10dc34bc42852657ef5c() {
  return __cxx_static_address_77aa10dc34bc42852657ef5c.reference || (__cxx_static_address_77aa10dc34bc42852657ef5c.reference = {
    __cReference: true,
    get value() { return INSERT_CLIP____header_global_9cd9c41f05dc5292; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:49
export const CHAINGUN_FIRE____header_global_bd3037803c503335 = ((((((6) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_28500bca59b14cf2aa70c229() {
  return __cxx_static_address_28500bca59b14cf2aa70c229.reference || (__cxx_static_address_28500bca59b14cf2aa70c229.reference = {
    __cReference: true,
    get value() { return CHAINGUN_FIRE____header_global_bd3037803c503335; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:50
export const RPG_SHOOT____header_global_580fbaf30c9c300d = ((((((7) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_33e2e484ab0a58abafc13fbf() {
  return __cxx_static_address_33e2e484ab0a58abafc13fbf.reference || (__cxx_static_address_33e2e484ab0a58abafc13fbf.reference = {
    __cReference: true,
    get value() { return RPG_SHOOT____header_global_580fbaf30c9c300d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:51
export const POOLBALLHIT____header_global_2df9dc57deff11bd = ((((((8) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3f5e349f215f444740b6f202() {
  return __cxx_static_address_3f5e349f215f444740b6f202.reference || (__cxx_static_address_3f5e349f215f444740b6f202.reference = {
    __cReference: true,
    get value() { return POOLBALLHIT____header_global_2df9dc57deff11bd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:52
export const RPG_EXPLODE____header_global_be60c324c6ec2a30 = ((((((9) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_709163aea7deb56678a1ffff() {
  return __cxx_static_address_709163aea7deb56678a1ffff.reference || (__cxx_static_address_709163aea7deb56678a1ffff.reference = {
    __cReference: true,
    get value() { return RPG_EXPLODE____header_global_be60c324c6ec2a30; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:53
export const CAT_FIRE____header_global_6a2990cdf6adae1e = ((((((10) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7da2e1eba3799f3b717dd6ae() {
  return __cxx_static_address_7da2e1eba3799f3b717dd6ae.reference || (__cxx_static_address_7da2e1eba3799f3b717dd6ae.reference = {
    __cReference: true,
    get value() { return CAT_FIRE____header_global_6a2990cdf6adae1e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:54
export const SHRINKER_FIRE____header_global_cd9036454b010208 = ((((((11) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_973e105d9b64443fd5c32221() {
  return __cxx_static_address_973e105d9b64443fd5c32221.reference || (__cxx_static_address_973e105d9b64443fd5c32221.reference = {
    __cReference: true,
    get value() { return SHRINKER_FIRE____header_global_cd9036454b010208; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:55
export const PIPEBOMB_BOUNCE____header_global_dccf90785f184614 = ((((((13) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_996b4ed5a2d4acf3435f8533() {
  return __cxx_static_address_996b4ed5a2d4acf3435f8533.reference || (__cxx_static_address_996b4ed5a2d4acf3435f8533.reference = {
    __cReference: true,
    get value() { return PIPEBOMB_BOUNCE____header_global_dccf90785f184614; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:56
export const PIPEBOMB_EXPLODE____header_global_24e553dc0e25ca9a = ((((((14) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e270bbdf477a8c6440e544c() {
  return __cxx_static_address_1e270bbdf477a8c6440e544c.reference || (__cxx_static_address_1e270bbdf477a8c6440e544c.reference = {
    __cReference: true,
    get value() { return PIPEBOMB_EXPLODE____header_global_24e553dc0e25ca9a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:57
export const LASERTRIP_ONWALL____header_global_63f36f4efa7851f9 = ((((((15) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4b0a8cfe5771a54a386073c2() {
  return __cxx_static_address_4b0a8cfe5771a54a386073c2.reference || (__cxx_static_address_4b0a8cfe5771a54a386073c2.reference = {
    __cReference: true,
    get value() { return LASERTRIP_ONWALL____header_global_63f36f4efa7851f9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:58
export const LASERTRIP_ARMING____header_global_b2fab63d9ae764bc = ((((((16) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ab9f54d14c3106a95c68ef2d() {
  return __cxx_static_address_ab9f54d14c3106a95c68ef2d.reference || (__cxx_static_address_ab9f54d14c3106a95c68ef2d.reference = {
    __cReference: true,
    get value() { return LASERTRIP_ARMING____header_global_b2fab63d9ae764bc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:59
export const LASERTRIP_EXPLODE____header_global_d6a90087e9909dc3 = ((((((17) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4fd073bde084c5304d990b74() {
  return __cxx_static_address_4fd073bde084c5304d990b74.reference || (__cxx_static_address_4fd073bde084c5304d990b74.reference = {
    __cReference: true,
    get value() { return LASERTRIP_EXPLODE____header_global_d6a90087e9909dc3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:60
export const VENT_BUST____header_global_8f3e202aadf62cea = ((((((18) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_39e67d3b9419fe0423225e77() {
  return __cxx_static_address_39e67d3b9419fe0423225e77.reference || (__cxx_static_address_39e67d3b9419fe0423225e77.reference = {
    __cReference: true,
    get value() { return VENT_BUST____header_global_8f3e202aadf62cea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:61
export const GLASS_BREAKING____header_global_eded6c10bb0b98d8 = ((((((19) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0384182ba7f6fc9e966e891b() {
  return __cxx_static_address_0384182ba7f6fc9e966e891b.reference || (__cxx_static_address_0384182ba7f6fc9e966e891b.reference = {
    __cReference: true,
    get value() { return GLASS_BREAKING____header_global_eded6c10bb0b98d8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:62
export const GLASS_HEAVYBREAK____header_global_3eeee64d463d1def = ((((((20) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9fc024b29cf0b4e2192f2e59() {
  return __cxx_static_address_9fc024b29cf0b4e2192f2e59.reference || (__cxx_static_address_9fc024b29cf0b4e2192f2e59.reference = {
    __cReference: true,
    get value() { return GLASS_HEAVYBREAK____header_global_3eeee64d463d1def; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:63
export const SHORT_CIRCUIT____header_global_f76893711d4977f0 = ((((((21) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c9236d035fe07aaabe3cf8bf() {
  return __cxx_static_address_c9236d035fe07aaabe3cf8bf.reference || (__cxx_static_address_c9236d035fe07aaabe3cf8bf.reference = {
    __cReference: true,
    get value() { return SHORT_CIRCUIT____header_global_f76893711d4977f0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:64
export const ITEM_SPLASH____header_global_7f46e5d4ff6d162e = ((((((22) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a63ac59a5a966a298d442246() {
  return __cxx_static_address_a63ac59a5a966a298d442246.reference || (__cxx_static_address_a63ac59a5a966a298d442246.reference = {
    __cReference: true,
    get value() { return ITEM_SPLASH____header_global_7f46e5d4ff6d162e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:65
export const DUKE_GASP____header_global_354c73be92bb1376 = ((((((25) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3e07aa86bc32546a58e1a26f() {
  return __cxx_static_address_3e07aa86bc32546a58e1a26f.reference || (__cxx_static_address_3e07aa86bc32546a58e1a26f.reference = {
    __cReference: true,
    get value() { return DUKE_GASP____header_global_354c73be92bb1376; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:66
export const SLIM_RECOG____header_global_c22df4be8c0088cf = ((((((26) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ea21068b1df7695eb5d32e70() {
  return __cxx_static_address_ea21068b1df7695eb5d32e70.reference || (__cxx_static_address_ea21068b1df7695eb5d32e70.reference = {
    __cReference: true,
    get value() { return SLIM_RECOG____header_global_c22df4be8c0088cf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:67
export const DUKE_URINATE____header_global_0fa4aad9a1473756 = ((((((28) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7947cbbf25aea49f52923fa3() {
  return __cxx_static_address_7947cbbf25aea49f52923fa3.reference || (__cxx_static_address_7947cbbf25aea49f52923fa3.reference = {
    __cReference: true,
    get value() { return DUKE_URINATE____header_global_0fa4aad9a1473756; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:68
export const ENDSEQVOL3SND2____header_global_64425ceb9e2b139f = ((((((29) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_790fc270cf2b369d7c70fc89() {
  return __cxx_static_address_790fc270cf2b369d7c70fc89.reference || (__cxx_static_address_790fc270cf2b369d7c70fc89.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND2____header_global_64425ceb9e2b139f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:69
export const ENDSEQVOL3SND3____header_global_c861713e489f68f8 = ((((((30) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_77ca99f004b837559b2e829f() {
  return __cxx_static_address_77ca99f004b837559b2e829f.reference || (__cxx_static_address_77ca99f004b837559b2e829f.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND3____header_global_c861713e489f68f8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:70
export const DUKE_CRACK____header_global_5fe3fec9993e7fa6 = ((((((33) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_04cefa6b78ef12246f6e970d() {
  return __cxx_static_address_04cefa6b78ef12246f6e970d.reference || (__cxx_static_address_04cefa6b78ef12246f6e970d.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK____header_global_5fe3fec9993e7fa6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:71
export const SLIM_ATTACK____header_global_4f05100b8e3e1ca1 = ((((((34) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_26c83fbe2376166688355025() {
  return __cxx_static_address_26c83fbe2376166688355025.reference || (__cxx_static_address_26c83fbe2376166688355025.reference = {
    __cReference: true,
    get value() { return SLIM_ATTACK____header_global_4f05100b8e3e1ca1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:72
export const SOMETHINGHITFORCE____header_global_6f45a0eeeed1fad4 = ((((((35) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2234c6707c8d8fdea2a4bba5() {
  return __cxx_static_address_2234c6707c8d8fdea2a4bba5.reference || (__cxx_static_address_2234c6707c8d8fdea2a4bba5.reference = {
    __cReference: true,
    get value() { return SOMETHINGHITFORCE____header_global_6f45a0eeeed1fad4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:73
export const DUKE_DRINKING____header_global_0ee1cbb31cf44728 = ((((((36) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ac26ff3f9ee7d3e3ac5865f8() {
  return __cxx_static_address_ac26ff3f9ee7d3e3ac5865f8.reference || (__cxx_static_address_ac26ff3f9ee7d3e3ac5865f8.reference = {
    __cReference: true,
    get value() { return DUKE_DRINKING____header_global_0ee1cbb31cf44728; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:74
export const DUKE_GRUNT____header_global_e283783df43647e2 = ((((((38) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d3bce860767417792cc9a3d4() {
  return __cxx_static_address_d3bce860767417792cc9a3d4.reference || (__cxx_static_address_d3bce860767417792cc9a3d4.reference = {
    __cReference: true,
    get value() { return DUKE_GRUNT____header_global_e283783df43647e2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:75
export const DUKE_HARTBEAT____header_global_107e61ea9e6f1388 = ((((((39) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e55cd31f78673228a85724fc() {
  return __cxx_static_address_e55cd31f78673228a85724fc.reference || (__cxx_static_address_e55cd31f78673228a85724fc.reference = {
    __cReference: true,
    get value() { return DUKE_HARTBEAT____header_global_107e61ea9e6f1388; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:76
export const DUKE_ONWATER____header_global_e9d259cfb57c0e8f = ((((((40) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ff67e39bbf091e0ef6a7d8f2() {
  return __cxx_static_address_ff67e39bbf091e0ef6a7d8f2.reference || (__cxx_static_address_ff67e39bbf091e0ef6a7d8f2.reference = {
    __cReference: true,
    get value() { return DUKE_ONWATER____header_global_e9d259cfb57c0e8f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:77
export const DUKE_LAND____header_global_a6649076db13c297 = ((((((42) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ae406e4dafb553f799d47732() {
  return __cxx_static_address_ae406e4dafb553f799d47732.reference || (__cxx_static_address_ae406e4dafb553f799d47732.reference = {
    __cReference: true,
    get value() { return DUKE_LAND____header_global_a6649076db13c297; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:78
export const DUKE_WALKINDUCTS____header_global_d2f14dc0209b4e5b = ((((((43) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_608056a9139dbeac7eb9ecd7() {
  return __cxx_static_address_608056a9139dbeac7eb9ecd7.reference || (__cxx_static_address_608056a9139dbeac7eb9ecd7.reference = {
    __cReference: true,
    get value() { return DUKE_WALKINDUCTS____header_global_d2f14dc0209b4e5b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:79
export const DUKE_UNDERWATER____header_global_001452b80d76feb9 = ((((((48) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ecede71854f15878e210be92() {
  return __cxx_static_address_ecede71854f15878e210be92.reference || (__cxx_static_address_ecede71854f15878e210be92.reference = {
    __cReference: true,
    get value() { return DUKE_UNDERWATER____header_global_001452b80d76feb9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:80
export const DUKE_JETPACK_ON____header_global_0e7aeb1220f9d598 = ((((((49) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1f38c9e28d64909c714fe8f8() {
  return __cxx_static_address_1f38c9e28d64909c714fe8f8.reference || (__cxx_static_address_1f38c9e28d64909c714fe8f8.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_ON____header_global_0e7aeb1220f9d598; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:81
export const DUKE_JETPACK_IDLE____header_global_59479a2c0bcb425c = ((((((50) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_616bf1e14c7f752170df5b9b() {
  return __cxx_static_address_616bf1e14c7f752170df5b9b.reference || (__cxx_static_address_616bf1e14c7f752170df5b9b.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_IDLE____header_global_59479a2c0bcb425c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:82
export const DUKE_JETPACK_OFF____header_global_cf6d3b82c78932ee = ((((((51) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4b37ea7eae7409af36aa07d3() {
  return __cxx_static_address_4b37ea7eae7409af36aa07d3.reference || (__cxx_static_address_4b37ea7eae7409af36aa07d3.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_OFF____header_global_cf6d3b82c78932ee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:83
export const DUKETALKTOBOSS____header_global_3224ab02c732e9c8 = ((((((56) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a0e96a8d6fe09af950f8c5ca() {
  return __cxx_static_address_a0e96a8d6fe09af950f8c5ca.reference || (__cxx_static_address_a0e96a8d6fe09af950f8c5ca.reference = {
    __cReference: true,
    get value() { return DUKETALKTOBOSS____header_global_3224ab02c732e9c8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:84
export const SQUISHED____header_global_c1aa256c5a66328b = ((((((69) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_03e54005c2d3475be7e5189f() {
  return __cxx_static_address_03e54005c2d3475be7e5189f.reference || (__cxx_static_address_03e54005c2d3475be7e5189f.reference = {
    __cReference: true,
    get value() { return SQUISHED____header_global_c1aa256c5a66328b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:85
export const TELEPORTER____header_global_b8edcd03b8346266 = ((((((70) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2b263bc686c34a8fe737116a() {
  return __cxx_static_address_2b263bc686c34a8fe737116a.reference || (__cxx_static_address_2b263bc686c34a8fe737116a.reference = {
    __cReference: true,
    get value() { return TELEPORTER____header_global_b8edcd03b8346266; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:86
export const ELEVATOR_ON____header_global_01942011d61bbc58 = ((((((71) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d4b9475a8904e6898363276f() {
  return __cxx_static_address_d4b9475a8904e6898363276f.reference || (__cxx_static_address_d4b9475a8904e6898363276f.reference = {
    __cReference: true,
    get value() { return ELEVATOR_ON____header_global_01942011d61bbc58; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:87
export const ELEVATOR_OFF____header_global_7178dec29fd5f363 = ((((((73) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d37cca9ff52ffbff141d4022() {
  return __cxx_static_address_d37cca9ff52ffbff141d4022.reference || (__cxx_static_address_d37cca9ff52ffbff141d4022.reference = {
    __cReference: true,
    get value() { return ELEVATOR_OFF____header_global_7178dec29fd5f363; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:88
export const SUBWAY____header_global_a77836c22f44ea83 = ((((((75) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6a700a4103f0e61bc8838e92() {
  return __cxx_static_address_6a700a4103f0e61bc8838e92.reference || (__cxx_static_address_6a700a4103f0e61bc8838e92.reference = {
    __cReference: true,
    get value() { return SUBWAY____header_global_a77836c22f44ea83; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:89
export const SWITCH_ON____header_global_c4f3401a04d282ad = ((((((76) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c79a1ab49952201e536c1466() {
  return __cxx_static_address_c79a1ab49952201e536c1466.reference || (__cxx_static_address_c79a1ab49952201e536c1466.reference = {
    __cReference: true,
    get value() { return SWITCH_ON____header_global_c4f3401a04d282ad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:90
export const FLUSH_TOILET____header_global_b00e36beeffa4721 = ((((((79) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b4a8024ade34580fb9c4035c() {
  return __cxx_static_address_b4a8024ade34580fb9c4035c.reference || (__cxx_static_address_b4a8024ade34580fb9c4035c.reference = {
    __cReference: true,
    get value() { return FLUSH_TOILET____header_global_b00e36beeffa4721; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:91
export const EARTHQUAKE____header_global_38463dd61301e7e5 = ((((((81) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d1c341e685fcbdcad1f261bb() {
  return __cxx_static_address_d1c341e685fcbdcad1f261bb.reference || (__cxx_static_address_d1c341e685fcbdcad1f261bb.reference = {
    __cReference: true,
    get value() { return EARTHQUAKE____header_global_38463dd61301e7e5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:92
export const END_OF_LEVEL_WARN____header_global_ffe0c74d6a3c4fab = ((((((83) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c276a5d196a8821db65580b8() {
  return __cxx_static_address_c276a5d196a8821db65580b8.reference || (__cxx_static_address_c276a5d196a8821db65580b8.reference = {
    __cReference: true,
    get value() { return END_OF_LEVEL_WARN____header_global_ffe0c74d6a3c4fab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:93
export const WIND_AMBIENCE____header_global_3274cdd371018ff8 = ((((((91) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1763694ff5f653eb34b88ca5() {
  return __cxx_static_address_1763694ff5f653eb34b88ca5.reference || (__cxx_static_address_1763694ff5f653eb34b88ca5.reference = {
    __cReference: true,
    get value() { return WIND_AMBIENCE____header_global_3274cdd371018ff8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:94
export const SOMETHING_DRIPPING____header_global_65a91e806ffeb45d = ((((((92) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1a727848ea7e7bbe9cfd5f3a() {
  return __cxx_static_address_1a727848ea7e7bbe9cfd5f3a.reference || (__cxx_static_address_1a727848ea7e7bbe9cfd5f3a.reference = {
    __cReference: true,
    get value() { return SOMETHING_DRIPPING____header_global_65a91e806ffeb45d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:95
export const BOS1_RECOG____header_global_b1cb02f8acb38aa0 = ((((((97) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aaa536481bcc42291b82a7c7() {
  return __cxx_static_address_aaa536481bcc42291b82a7c7.reference || (__cxx_static_address_aaa536481bcc42291b82a7c7.reference = {
    __cReference: true,
    get value() { return BOS1_RECOG____header_global_b1cb02f8acb38aa0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:96
export const BOS2_RECOG____header_global_159c49e87a42119e = ((((((102) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_51f1b727151651b63c59207f() {
  return __cxx_static_address_51f1b727151651b63c59207f.reference || (__cxx_static_address_51f1b727151651b63c59207f.reference = {
    __cReference: true,
    get value() { return BOS2_RECOG____header_global_159c49e87a42119e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:97
export const DUKE_GETWEAPON2____header_global_ea0aca2c4d8b3d15 = ((((((107) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d7fd7dd3f6365ad8eaba8647() {
  return __cxx_static_address_d7fd7dd3f6365ad8eaba8647.reference || (__cxx_static_address_d7fd7dd3f6365ad8eaba8647.reference = {
    __cReference: true,
    get value() { return DUKE_GETWEAPON2____header_global_ea0aca2c4d8b3d15; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:98
export const SHOTGUN_FIRE____header_global_59b167e595161eee = ((((((109) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ac360b89a92e6280ca32789f() {
  return __cxx_static_address_ac360b89a92e6280ca32789f.reference || (__cxx_static_address_ac360b89a92e6280ca32789f.reference = {
    __cReference: true,
    get value() { return SHOTGUN_FIRE____header_global_59b167e595161eee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:99
export const PRED_RECOG____header_global_e20d238c69c2f633 = ((((((111) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_13aaafd6847e53ceb91e82c1() {
  return __cxx_static_address_13aaafd6847e53ceb91e82c1.reference || (__cxx_static_address_13aaafd6847e53ceb91e82c1.reference = {
    __cReference: true,
    get value() { return PRED_RECOG____header_global_e20d238c69c2f633; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:100
export const CAPT_RECOG____header_global_395eb6941ae06401 = ((((((117) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ff7d25923a1f40ab54499c1a() {
  return __cxx_static_address_ff7d25923a1f40ab54499c1a.reference || (__cxx_static_address_ff7d25923a1f40ab54499c1a.reference = {
    __cReference: true,
    get value() { return CAPT_RECOG____header_global_395eb6941ae06401; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:101
export const PIG_RECOG____header_global_37fe2f9345a70d8f = ((((((121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ee1e8dc49368fd76e323c818() {
  return __cxx_static_address_ee1e8dc49368fd76e323c818.reference || (__cxx_static_address_ee1e8dc49368fd76e323c818.reference = {
    __cReference: true,
    get value() { return PIG_RECOG____header_global_37fe2f9345a70d8f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:102
export const RECO_ROAM____header_global_4f6c46b1ca1caa58 = ((((((125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f3c12620c8054b7d55bc0c75() {
  return __cxx_static_address_f3c12620c8054b7d55bc0c75.reference || (__cxx_static_address_f3c12620c8054b7d55bc0c75.reference = {
    __cReference: true,
    get value() { return RECO_ROAM____header_global_4f6c46b1ca1caa58; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:103
export const RECO_RECOG____header_global_eb0d681d2e1a8e61 = ((((((126) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_35ba1683978a5be96f586bce() {
  return __cxx_static_address_35ba1683978a5be96f586bce.reference || (__cxx_static_address_35ba1683978a5be96f586bce.reference = {
    __cReference: true,
    get value() { return RECO_RECOG____header_global_eb0d681d2e1a8e61; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:104
export const RECO_ATTACK____header_global_e9c8aa4514b2d1ee = ((((((127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6f05142b852fe5994f412277() {
  return __cxx_static_address_6f05142b852fe5994f412277.reference || (__cxx_static_address_6f05142b852fe5994f412277.reference = {
    __cReference: true,
    get value() { return RECO_ATTACK____header_global_e9c8aa4514b2d1ee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:105
export const RECO_PAIN____header_global_f0f9cbba6e6b71e7 = ((((((128) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_52adc08ab1109cf57a60dc1b() {
  return __cxx_static_address_52adc08ab1109cf57a60dc1b.reference || (__cxx_static_address_52adc08ab1109cf57a60dc1b.reference = {
    __cReference: true,
    get value() { return RECO_PAIN____header_global_f0f9cbba6e6b71e7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:106
export const DRON_RECOG____header_global_25015895dc2b171f = ((((((131) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b4048c186d5b16f0d0636ffe() {
  return __cxx_static_address_b4048c186d5b16f0d0636ffe.reference || (__cxx_static_address_b4048c186d5b16f0d0636ffe.reference = {
    __cReference: true,
    get value() { return DRON_RECOG____header_global_25015895dc2b171f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:107
export const COMM_RECOG____header_global_5e24dcc0607b16a5 = ((((((136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3f7122d21abe1e913c638b64() {
  return __cxx_static_address_3f7122d21abe1e913c638b64.reference || (__cxx_static_address_3f7122d21abe1e913c638b64.reference = {
    __cReference: true,
    get value() { return COMM_RECOG____header_global_5e24dcc0607b16a5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:108
export const OCTA_RECOG____header_global_82fe697760bf7725 = ((((((141) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0929879ba0d9886fc094213f() {
  return __cxx_static_address_0929879ba0d9886fc094213f.reference || (__cxx_static_address_0929879ba0d9886fc094213f.reference = {
    __cReference: true,
    get value() { return OCTA_RECOG____header_global_82fe697760bf7725; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:109
export const TURR_RECOG____header_global_e0884a018481b6cd = ((((((146) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cc07582d5883b86d4e6c95e5() {
  return __cxx_static_address_cc07582d5883b86d4e6c95e5.reference || (__cxx_static_address_cc07582d5883b86d4e6c95e5.reference = {
    __cReference: true,
    get value() { return TURR_RECOG____header_global_e0884a018481b6cd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:110
export const SLIM_DYING____header_global_a5dc593708c4d948 = ((((((149) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_51408be9d7065633d687a2f7() {
  return __cxx_static_address_51408be9d7065633d687a2f7.reference || (__cxx_static_address_51408be9d7065633d687a2f7.reference = {
    __cReference: true,
    get value() { return SLIM_DYING____header_global_a5dc593708c4d948; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:111
export const BOS3_RECOG____header_global_ec4b36d317bf344e = ((((((151) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c5ccf048b549b587f8f4f526() {
  return __cxx_static_address_c5ccf048b549b587f8f4f526.reference || (__cxx_static_address_c5ccf048b549b587f8f4f526.reference = {
    __cReference: true,
    get value() { return BOS3_RECOG____header_global_ec4b36d317bf344e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:112
export const BOS1_WALK____header_global_f7793a0210fe8a22 = ((((((156) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_81acb34413b58bcc4a5d5515() {
  return __cxx_static_address_81acb34413b58bcc4a5d5515.reference || (__cxx_static_address_81acb34413b58bcc4a5d5515.reference = {
    __cReference: true,
    get value() { return BOS1_WALK____header_global_f7793a0210fe8a22; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:113
export const THUD____header_global_587d66e7a5ec0e70 = ((((((158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e26b05dbf540030253387590() {
  return __cxx_static_address_e26b05dbf540030253387590.reference || (__cxx_static_address_e26b05dbf540030253387590.reference = {
    __cReference: true,
    get value() { return THUD____header_global_587d66e7a5ec0e70; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:114
export const WIERDSHOT_FLY____header_global_f8dae0e3ff31a5cc = ((((((160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_decbd814c3dd357d4a53a880() {
  return __cxx_static_address_decbd814c3dd357d4a53a880.reference || (__cxx_static_address_decbd814c3dd357d4a53a880.reference = {
    __cReference: true,
    get value() { return WIERDSHOT_FLY____header_global_f8dae0e3ff31a5cc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:115
export const SLIM_ROAM____header_global_9de11945270eaf5e = ((((((163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_727d58ab94057bf3effc9b3c() {
  return __cxx_static_address_727d58ab94057bf3effc9b3c.reference || (__cxx_static_address_727d58ab94057bf3effc9b3c.reference = {
    __cReference: true,
    get value() { return SLIM_ROAM____header_global_9de11945270eaf5e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:116
export const SHOTGUN_COCK____header_global_69e958dc5288aeed = ((((((169) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ebef3151d57f6a73aeb5a361() {
  return __cxx_static_address_ebef3151d57f6a73aeb5a361.reference || (__cxx_static_address_ebef3151d57f6a73aeb5a361.reference = {
    __cReference: true,
    get value() { return SHOTGUN_COCK____header_global_69e958dc5288aeed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:117
export const GENERIC_AMBIENCE17____header_global_af592007be786e93 = ((((((177) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3f9e26eb349d59e50bacb49e() {
  return __cxx_static_address_3f9e26eb349d59e50bacb49e.reference || (__cxx_static_address_3f9e26eb349d59e50bacb49e.reference = {
    __cReference: true,
    get value() { return GENERIC_AMBIENCE17____header_global_af592007be786e93; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:118
export const BONUS_SPEECH1____header_global_5ea6774c597953cf = ((((((195) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_081b8d218cc4abc5c074c642() {
  return __cxx_static_address_081b8d218cc4abc5c074c642.reference || (__cxx_static_address_081b8d218cc4abc5c074c642.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH1____header_global_5ea6774c597953cf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:119
export const BONUS_SPEECH2____header_global_c3c96c1872761591 = ((((((196) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ba650cd8f9cb36ea9a440171() {
  return __cxx_static_address_ba650cd8f9cb36ea9a440171.reference || (__cxx_static_address_ba650cd8f9cb36ea9a440171.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH2____header_global_c3c96c1872761591; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:120
export const BONUS_SPEECH3____header_global_7a19cf167076c8e8 = ((((((197) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_324eb3ca89fff701610c6df4() {
  return __cxx_static_address_324eb3ca89fff701610c6df4.reference || (__cxx_static_address_324eb3ca89fff701610c6df4.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH3____header_global_7a19cf167076c8e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:121
export const BONUS_SPEECH4____header_global_c4579f2c13200382 = ((((((199) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f74254c9aef3bec29c18f7cf() {
  return __cxx_static_address_f74254c9aef3bec29c18f7cf.reference || (__cxx_static_address_f74254c9aef3bec29c18f7cf.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH4____header_global_c4579f2c13200382; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:122
export const DUKE_LAND_HURT____header_global_ef5c822b60ba69d8 = ((((((200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b6e3f834d5e23d0540485c7d() {
  return __cxx_static_address_b6e3f834d5e23d0540485c7d.reference || (__cxx_static_address_b6e3f834d5e23d0540485c7d.reference = {
    __cReference: true,
    get value() { return DUKE_LAND_HURT____header_global_ef5c822b60ba69d8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:123
export const DUKE_SEARCH2____header_global_111b474243ad3966 = ((((((207) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3f7f76aee1cccefa6e6010ba() {
  return __cxx_static_address_3f7f76aee1cccefa6e6010ba.reference || (__cxx_static_address_3f7f76aee1cccefa6e6010ba.reference = {
    __cReference: true,
    get value() { return DUKE_SEARCH2____header_global_111b474243ad3966; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:124
export const DUKE_CRACK2____header_global_6bc58d362e3c6ae4 = ((((((208) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8fb6e2279f621185f59c4936() {
  return __cxx_static_address_8fb6e2279f621185f59c4936.reference || (__cxx_static_address_8fb6e2279f621185f59c4936.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK2____header_global_6bc58d362e3c6ae4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:125
export const DUKE_SEARCH____header_global_40852af749451159 = ((((((209) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_14c6ee5a3723d574671f4377() {
  return __cxx_static_address_14c6ee5a3723d574671f4377.reference || (__cxx_static_address_14c6ee5a3723d574671f4377.reference = {
    __cReference: true,
    get value() { return DUKE_SEARCH____header_global_40852af749451159; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:126
export const DUKE_GET____header_global_ebca89d4b0c73227 = ((((((210) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e46cdb872eab81da9913bff0() {
  return __cxx_static_address_e46cdb872eab81da9913bff0.reference || (__cxx_static_address_e46cdb872eab81da9913bff0.reference = {
    __cReference: true,
    get value() { return DUKE_GET____header_global_ebca89d4b0c73227; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:127
export const DUKE_LONGTERM_PAIN____header_global_d9f09a9be3d95723 = ((((((211) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c90128f53995142bef230e13() {
  return __cxx_static_address_c90128f53995142bef230e13.reference || (__cxx_static_address_c90128f53995142bef230e13.reference = {
    __cReference: true,
    get value() { return DUKE_LONGTERM_PAIN____header_global_d9f09a9be3d95723; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:128
export const MONITOR_ACTIVE____header_global_9ad04cf91d02b59d = ((((((212) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ee2e70b69205e79a0c5f349f() {
  return __cxx_static_address_ee2e70b69205e79a0c5f349f.reference || (__cxx_static_address_ee2e70b69205e79a0c5f349f.reference = {
    __cReference: true,
    get value() { return MONITOR_ACTIVE____header_global_9ad04cf91d02b59d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:129
export const NITEVISION_ONOFF____header_global_e7295de1304514c5 = ((((((213) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6a65005656d297fa5831d055() {
  return __cxx_static_address_6a65005656d297fa5831d055.reference || (__cxx_static_address_6a65005656d297fa5831d055.reference = {
    __cReference: true,
    get value() { return NITEVISION_ONOFF____header_global_e7295de1304514c5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:130
export const DUKE_CRACK_FIRST____header_global_d467c09255bb0339 = ((((((215) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6aa295f0cada877a97fdbc16() {
  return __cxx_static_address_6aa295f0cada877a97fdbc16.reference || (__cxx_static_address_6aa295f0cada877a97fdbc16.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK_FIRST____header_global_d467c09255bb0339; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:131
export const DUKE_USEMEDKIT____header_global_4dc78099ca0b56e3 = ((((((216) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_46e6dfce09463cf7e23e169e() {
  return __cxx_static_address_46e6dfce09463cf7e23e169e.reference || (__cxx_static_address_46e6dfce09463cf7e23e169e.reference = {
    __cReference: true,
    get value() { return DUKE_USEMEDKIT____header_global_4dc78099ca0b56e3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:132
export const DUKE_TAKEPILLS____header_global_a33358674e6e1965 = ((((((217) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3691b0a0b3ee22b40555701f() {
  return __cxx_static_address_3691b0a0b3ee22b40555701f.reference || (__cxx_static_address_3691b0a0b3ee22b40555701f.reference = {
    __cReference: true,
    get value() { return DUKE_TAKEPILLS____header_global_a33358674e6e1965; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:133
export const DUKE_PISSRELIEF____header_global_4e30b1650ed9901f = ((((((218) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_be63f5727c310dc252ff2da0() {
  return __cxx_static_address_be63f5727c310dc252ff2da0.reference || (__cxx_static_address_be63f5727c310dc252ff2da0.reference = {
    __cReference: true,
    get value() { return DUKE_PISSRELIEF____header_global_4e30b1650ed9901f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:134
export const SELECT_WEAPON____header_global_41de5209634bbc4a = ((((((219) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1eea01e377db901bae09d289() {
  return __cxx_static_address_1eea01e377db901bae09d289.reference || (__cxx_static_address_1eea01e377db901bae09d289.reference = {
    __cReference: true,
    get value() { return SELECT_WEAPON____header_global_41de5209634bbc4a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:135
export const JIBBED_ACTOR5____header_global_e48c1fab24293c02 = ((((((226) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_96d984394340986a74d81769() {
  return __cxx_static_address_96d984394340986a74d81769.reference || (__cxx_static_address_96d984394340986a74d81769.reference = {
    __cReference: true,
    get value() { return JIBBED_ACTOR5____header_global_e48c1fab24293c02; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:136
export const JIBBED_ACTOR6____header_global_b836a4b5bf551bbe = ((((((227) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5529ecbe717a99266af99cf1() {
  return __cxx_static_address_5529ecbe717a99266af99cf1.reference || (__cxx_static_address_5529ecbe717a99266af99cf1.reference = {
    __cReference: true,
    get value() { return JIBBED_ACTOR6____header_global_b836a4b5bf551bbe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:137
export const DUKE_GOTHEALTHATLOW____header_global_b000498b4708d168 = ((((((229) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e6830981d206e91b146a6c63() {
  return __cxx_static_address_e6830981d206e91b146a6c63.reference || (__cxx_static_address_e6830981d206e91b146a6c63.reference = {
    __cReference: true,
    get value() { return DUKE_GOTHEALTHATLOW____header_global_b000498b4708d168; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:138
export const BOSSTALKTODUKE____header_global_a5512cd632799bf7 = ((((((230) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_43ab7e1e88e622b9994e777a() {
  return __cxx_static_address_43ab7e1e88e622b9994e777a.reference || (__cxx_static_address_43ab7e1e88e622b9994e777a.reference = {
    __cReference: true,
    get value() { return BOSSTALKTODUKE____header_global_a5512cd632799bf7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:139
export const WAR_AMBIENCE2____header_global_13de98c5507f533d = ((((((232) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_15b34a38d7c0172bb44eacb2() {
  return __cxx_static_address_15b34a38d7c0172bb44eacb2.reference || (__cxx_static_address_15b34a38d7c0172bb44eacb2.reference = {
    __cReference: true,
    get value() { return WAR_AMBIENCE2____header_global_13de98c5507f533d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:140
export const EXITMENUSOUND____header_global_a92bf040911689f9 = ((((((243) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_379572534d2e22c786289a26() {
  return __cxx_static_address_379572534d2e22c786289a26.reference || (__cxx_static_address_379572534d2e22c786289a26.reference = {
    __cReference: true,
    get value() { return EXITMENUSOUND____header_global_a92bf040911689f9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:141
export const FLY_BY____header_global_852de64496c817ce = ((((((244) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_29b4aadde5296d0159856a51() {
  return __cxx_static_address_29b4aadde5296d0159856a51.reference || (__cxx_static_address_29b4aadde5296d0159856a51.reference = {
    __cReference: true,
    get value() { return FLY_BY____header_global_852de64496c817ce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:142
export const DUKE_SCREAM____header_global_0a4d30fa413e41e6 = ((((((245) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_96bd7b1c05dd20fe2b270036() {
  return __cxx_static_address_96bd7b1c05dd20fe2b270036.reference || (__cxx_static_address_96bd7b1c05dd20fe2b270036.reference = {
    __cReference: true,
    get value() { return DUKE_SCREAM____header_global_0a4d30fa413e41e6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:143
export const SHRINKER_HIT____header_global_1cebef6dc8ae95e8 = ((((((246) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_48fe8ef544426e39c6be55d8() {
  return __cxx_static_address_48fe8ef544426e39c6be55d8.reference || (__cxx_static_address_48fe8ef544426e39c6be55d8.reference = {
    __cReference: true,
    get value() { return SHRINKER_HIT____header_global_1cebef6dc8ae95e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:144
export const RATTY____header_global_aee6a3dc20dfc8c4 = ((((((247) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_88e73d1b81383d14ffef4a72() {
  return __cxx_static_address_88e73d1b81383d14ffef4a72.reference || (__cxx_static_address_88e73d1b81383d14ffef4a72.reference = {
    __cReference: true,
    get value() { return RATTY____header_global_aee6a3dc20dfc8c4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:145
export const BONUSMUSIC____header_global_3a494b48f78b31fc = ((((((249) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_905ee7f53077eaf87ca6216e() {
  return __cxx_static_address_905ee7f53077eaf87ca6216e.reference || (__cxx_static_address_905ee7f53077eaf87ca6216e.reference = {
    __cReference: true,
    get value() { return BONUSMUSIC____header_global_3a494b48f78b31fc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:146
export const DUKE_GETWEAPON6____header_global_4015a660aa78b24b = ((((((264) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2edb485bac4ba06324230e1b() {
  return __cxx_static_address_2edb485bac4ba06324230e1b.reference || (__cxx_static_address_2edb485bac4ba06324230e1b.reference = {
    __cReference: true,
    get value() { return DUKE_GETWEAPON6____header_global_4015a660aa78b24b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:147
export const ALIEN_SWITCH1____header_global_5845fce2b406df1a = ((((((272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9bc7e53662b0d8dbaaf47725() {
  return __cxx_static_address_9bc7e53662b0d8dbaaf47725.reference || (__cxx_static_address_9bc7e53662b0d8dbaaf47725.reference = {
    __cReference: true,
    get value() { return ALIEN_SWITCH1____header_global_5845fce2b406df1a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:148
export const RIPHEADNECK____header_global_3423f75cd628f475 = ((((((284) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fc82d4ae7481d38b0dc033aa() {
  return __cxx_static_address_fc82d4ae7481d38b0dc033aa.reference || (__cxx_static_address_fc82d4ae7481d38b0dc033aa.reference = {
    __cReference: true,
    get value() { return RIPHEADNECK____header_global_3423f75cd628f475; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:149
export const ENDSEQVOL3SND4____header_global_0fee35be1606a463 = ((((((288) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fa9ad2bf7da608aaa23c3d20() {
  return __cxx_static_address_fa9ad2bf7da608aaa23c3d20.reference || (__cxx_static_address_fa9ad2bf7da608aaa23c3d20.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND4____header_global_0fee35be1606a463; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:150
export const ENDSEQVOL3SND5____header_global_e8e58f0a28d43571 = ((((((289) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1f9893260bbf37c73caae67a() {
  return __cxx_static_address_1f9893260bbf37c73caae67a.reference || (__cxx_static_address_1f9893260bbf37c73caae67a.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND5____header_global_e8e58f0a28d43571; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:151
export const ENDSEQVOL3SND6____header_global_c3e513307b4d432b = ((((((290) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bd540a41c1560994f92e6020() {
  return __cxx_static_address_bd540a41c1560994f92e6020.reference || (__cxx_static_address_bd540a41c1560994f92e6020.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND6____header_global_c3e513307b4d432b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:152
export const ENDSEQVOL3SND7____header_global_ebbeb0d87c5532e8 = ((((((291) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dea5dbd8b89c55be341dffef() {
  return __cxx_static_address_dea5dbd8b89c55be341dffef.reference || (__cxx_static_address_dea5dbd8b89c55be341dffef.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND7____header_global_ebbeb0d87c5532e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:153
export const ENDSEQVOL3SND8____header_global_1b3ac130e1889265 = ((((((292) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a44382dd615b4da5803c06e6() {
  return __cxx_static_address_a44382dd615b4da5803c06e6.reference || (__cxx_static_address_a44382dd615b4da5803c06e6.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND8____header_global_1b3ac130e1889265; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:154
export const ENDSEQVOL3SND9____header_global_a164119679400190 = ((((((293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_27e4edb392616ff1733b95b8() {
  return __cxx_static_address_27e4edb392616ff1733b95b8.reference || (__cxx_static_address_27e4edb392616ff1733b95b8.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND9____header_global_a164119679400190; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:155
export const WHIPYOURASS____header_global_2987fcbb7c0885b2 = ((((((294) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2e47629f7a031039cdc1f764() {
  return __cxx_static_address_2e47629f7a031039cdc1f764.reference || (__cxx_static_address_2e47629f7a031039cdc1f764.reference = {
    __cReference: true,
    get value() { return WHIPYOURASS____header_global_2987fcbb7c0885b2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:156
export const ENDSEQVOL2SND1____header_global_b2655a5b53e134ed = ((((((295) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_af9e8a400156561735e65491() {
  return __cxx_static_address_af9e8a400156561735e65491.reference || (__cxx_static_address_af9e8a400156561735e65491.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND1____header_global_b2655a5b53e134ed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:157
export const ENDSEQVOL2SND2____header_global_09d6a00d1439a4de = ((((((296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_08faa71491ce1f548c373098() {
  return __cxx_static_address_08faa71491ce1f548c373098.reference || (__cxx_static_address_08faa71491ce1f548c373098.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND2____header_global_09d6a00d1439a4de; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:158
export const ENDSEQVOL2SND3____header_global_fe3f5ea23434c9d1 = ((((((297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e94e8a26ec94348b0713490d() {
  return __cxx_static_address_e94e8a26ec94348b0713490d.reference || (__cxx_static_address_e94e8a26ec94348b0713490d.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND3____header_global_fe3f5ea23434c9d1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:159
export const ENDSEQVOL2SND4____header_global_c09e281045842eca = ((((((298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_40da151f3efa255a751e1045() {
  return __cxx_static_address_40da151f3efa255a751e1045.reference || (__cxx_static_address_40da151f3efa255a751e1045.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND4____header_global_c09e281045842eca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:160
export const ENDSEQVOL2SND5____header_global_29eaee52502deccb = ((((((299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f69d0d4ad7f6ba719e3bd5f1() {
  return __cxx_static_address_f69d0d4ad7f6ba719e3bd5f1.reference || (__cxx_static_address_f69d0d4ad7f6ba719e3bd5f1.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND5____header_global_29eaee52502deccb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:161
export const ENDSEQVOL2SND6____header_global_9dafd8ce5128d3f9 = ((((((300) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ede2582f4bdf57198f4e6fc0() {
  return __cxx_static_address_ede2582f4bdf57198f4e6fc0.reference || (__cxx_static_address_ede2582f4bdf57198f4e6fc0.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND6____header_global_9dafd8ce5128d3f9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:162
export const ENDSEQVOL2SND7____header_global_3dff41ff79b59ecd = ((((((301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_942f4328dfdd488bd804f6b0() {
  return __cxx_static_address_942f4328dfdd488bd804f6b0.reference || (__cxx_static_address_942f4328dfdd488bd804f6b0.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND7____header_global_3dff41ff79b59ecd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:163
export const SOMETHINGFROZE____header_global_26116f377b56b43b = ((((((303) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5c61878ef50749db7841adbe() {
  return __cxx_static_address_5c61878ef50749db7841adbe.reference || (__cxx_static_address_5c61878ef50749db7841adbe.reference = {
    __cReference: true,
    get value() { return SOMETHINGFROZE____header_global_26116f377b56b43b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:164
export const WIND_REPEAT____header_global_cc73a814ebfe2344 = ((((((308) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4aa784ef1099fca1e655c3f2() {
  return __cxx_static_address_4aa784ef1099fca1e655c3f2.reference || (__cxx_static_address_4aa784ef1099fca1e655c3f2.reference = {
    __cReference: true,
    get value() { return WIND_REPEAT____header_global_cc73a814ebfe2344; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:165
export const BOS4_RECOG____header_global_27c236c26639d10f = ((((((342) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3accc2e566864dc3436987ed() {
  return __cxx_static_address_3accc2e566864dc3436987ed.reference || (__cxx_static_address_3accc2e566864dc3436987ed.reference = {
    __cReference: true,
    get value() { return BOS4_RECOG____header_global_27c236c26639d10f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:166
export const LIGHTNING_SLAP____header_global_00cd52100f6d38cb = ((((((351) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_18deef5c21adf6f61904c5a3() {
  return __cxx_static_address_18deef5c21adf6f61904c5a3.reference || (__cxx_static_address_18deef5c21adf6f61904c5a3.reference = {
    __cReference: true,
    get value() { return LIGHTNING_SLAP____header_global_00cd52100f6d38cb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:167
export const THUNDER____header_global_254ee0c1e60369f0 = ((((((352) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7689c9d386318faa5f57df41() {
  return __cxx_static_address_7689c9d386318faa5f57df41.reference || (__cxx_static_address_7689c9d386318faa5f57df41.reference = {
    __cReference: true,
    get value() { return THUNDER____header_global_254ee0c1e60369f0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:168
export const INTRO4_1____header_global_3ff89b004d143bd4 = ((((((363) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_36c9f1184570b7d53bb23da5() {
  return __cxx_static_address_36c9f1184570b7d53bb23da5.reference || (__cxx_static_address_36c9f1184570b7d53bb23da5.reference = {
    __cReference: true,
    get value() { return INTRO4_1____header_global_3ff89b004d143bd4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:169
export const INTRO4_2____header_global_9cdda7e93f804948 = ((((((364) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_34ab6f1a2105f5aa1d64aeca() {
  return __cxx_static_address_34ab6f1a2105f5aa1d64aeca.reference || (__cxx_static_address_34ab6f1a2105f5aa1d64aeca.reference = {
    __cReference: true,
    get value() { return INTRO4_2____header_global_9cdda7e93f804948; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:170
export const INTRO4_3____header_global_4cf4a5540b3d9300 = ((((((365) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_59fed1ece6c17b4092ae9187() {
  return __cxx_static_address_59fed1ece6c17b4092ae9187.reference || (__cxx_static_address_59fed1ece6c17b4092ae9187.reference = {
    __cReference: true,
    get value() { return INTRO4_3____header_global_4cf4a5540b3d9300; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:171
export const INTRO4_4____header_global_e346d15b3ac4a120 = ((((((366) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_52f5273b73058fc06f53ab55() {
  return __cxx_static_address_52f5273b73058fc06f53ab55.reference || (__cxx_static_address_52f5273b73058fc06f53ab55.reference = {
    __cReference: true,
    get value() { return INTRO4_4____header_global_e346d15b3ac4a120; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:172
export const INTRO4_5____header_global_712c2e1f371218a6 = ((((((367) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0ac2888b3ac8fc3a70ad938c() {
  return __cxx_static_address_0ac2888b3ac8fc3a70ad938c.reference || (__cxx_static_address_0ac2888b3ac8fc3a70ad938c.reference = {
    __cReference: true,
    get value() { return INTRO4_5____header_global_712c2e1f371218a6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:173
export const INTRO4_6____header_global_fb56192e2dc48b8e = ((((((368) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1d32d11c1c24a544592a51e4() {
  return __cxx_static_address_1d32d11c1c24a544592a51e4.reference || (__cxx_static_address_1d32d11c1c24a544592a51e4.reference = {
    __cReference: true,
    get value() { return INTRO4_6____header_global_fb56192e2dc48b8e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:174
export const BOSS4_DEADSPEECH____header_global_9760c3b96df0a8f7 = ((((((370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_801e282c2c6cf04af4cd03c4() {
  return __cxx_static_address_801e282c2c6cf04af4cd03c4.reference || (__cxx_static_address_801e282c2c6cf04af4cd03c4.reference = {
    __cReference: true,
    get value() { return BOSS4_DEADSPEECH____header_global_9760c3b96df0a8f7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:175
export const BOSS4_FIRSTSEE____header_global_9b2dc35b28646071 = ((((((371) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_64ea1bbbc53b35838d413534() {
  return __cxx_static_address_64ea1bbbc53b35838d413534.reference || (__cxx_static_address_64ea1bbbc53b35838d413534.reference = {
    __cReference: true,
    get value() { return BOSS4_FIRSTSEE____header_global_9b2dc35b28646071; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:176
export const VOL4ENDSND1____header_global_9145ab32d8fd106b = ((((((384) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d432b2d00f4604ee49498f47() {
  return __cxx_static_address_d432b2d00f4604ee49498f47.reference || (__cxx_static_address_d432b2d00f4604ee49498f47.reference = {
    __cReference: true,
    get value() { return VOL4ENDSND1____header_global_9145ab32d8fd106b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:177
export const VOL4ENDSND2____header_global_ebe2997a8d990eca = ((((((385) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_49b1bb814ee906451f0d22fd() {
  return __cxx_static_address_49b1bb814ee906451f0d22fd.reference || (__cxx_static_address_49b1bb814ee906451f0d22fd.reference = {
    __cReference: true,
    get value() { return VOL4ENDSND2____header_global_ebe2997a8d990eca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:178
export const EXPANDERSHOOT____header_global_2229308f9a84c0f1 = ((((((388) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c249c961677465080a4fe16d() {
  return __cxx_static_address_c249c961677465080a4fe16d.reference || (__cxx_static_address_c249c961677465080a4fe16d.reference = {
    __cReference: true,
    get value() { return EXPANDERSHOOT____header_global_2229308f9a84c0f1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:179
export const INTRO4_B____header_global_904b90197c260c4f = ((((((392) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_96385af9af1cd1a4b16797d5() {
  return __cxx_static_address_96385af9af1cd1a4b16797d5.reference || (__cxx_static_address_96385af9af1cd1a4b16797d5.reference = {
    __cReference: true,
    get value() { return INTRO4_B____header_global_904b90197c260c4f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:180
export const BIGBANG____header_global_79b9e8cba7f301a7 = ((((((393) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_381ee364e156ad86c510b5b8() {
  return __cxx_static_address_381ee364e156ad86c510b5b8.reference || (__cxx_static_address_381ee364e156ad86c510b5b8.reference = {
    __cReference: true,
    get value() { return BIGBANG____header_global_79b9e8cba7f301a7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:181
export const FLAMETHROWER_INTRO____header_global_eaacd0744348649e = ((((((398) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d8f63ce92a1befb07e4edb24() {
  return __cxx_static_address_d8f63ce92a1befb07e4edb24.reference || (__cxx_static_address_d8f63ce92a1befb07e4edb24.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_INTRO____header_global_eaacd0744348649e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:182
export const FLAMETHROWER_LOOP____header_global_160b752c7946c46c = ((((((399) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ea8fb9cf038ce37e95444acc() {
  return __cxx_static_address_ea8fb9cf038ce37e95444acc.reference || (__cxx_static_address_ea8fb9cf038ce37e95444acc.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_LOOP____header_global_160b752c7946c46c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:183
export const FLAMETHROWER_END____header_global_9a0ed83d57a4eda1 = ((((((400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1f5b9f1c38b572d477eaaec7() {
  return __cxx_static_address_1f5b9f1c38b572d477eaaec7.reference || (__cxx_static_address_1f5b9f1c38b572d477eaaec7.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_END____header_global_9a0ed83d57a4eda1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:184
export const E5L7_DUKE_QUIT_YOU____header_global_426ca0fdbfaf35a9 = ((((((401) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ed7e4f244e103048f046e095() {
  return __cxx_static_address_ed7e4f244e103048f046e095.reference || (__cxx_static_address_ed7e4f244e103048f046e095.reference = {
    __cReference: true,
    get value() { return E5L7_DUKE_QUIT_YOU____header_global_426ca0fdbfaf35a9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:187
export const SECTOREFFECTOR____header_global_30a8e054d1536786 = ((((((1) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3f82fa500829c1e01e5c9e1a() {
  return __cxx_static_address_3f82fa500829c1e01e5c9e1a.reference || (__cxx_static_address_3f82fa500829c1e01e5c9e1a.reference = {
    __cReference: true,
    get value() { return SECTOREFFECTOR____header_global_30a8e054d1536786; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:188
export const ACTIVATOR____header_global_94d82cfdece79b35 = ((((((2) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_53f205548f1b04e48dca2a44() {
  return __cxx_static_address_53f205548f1b04e48dca2a44.reference || (__cxx_static_address_53f205548f1b04e48dca2a44.reference = {
    __cReference: true,
    get value() { return ACTIVATOR____header_global_94d82cfdece79b35; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:189
export const TOUCHPLATE____header_global_1aba9333dbd9ff69 = ((((((3) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7f2ac341c3430724863e08c4() {
  return __cxx_static_address_7f2ac341c3430724863e08c4.reference || (__cxx_static_address_7f2ac341c3430724863e08c4.reference = {
    __cReference: true,
    get value() { return TOUCHPLATE____header_global_1aba9333dbd9ff69; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:190
export const ACTIVATORLOCKED____header_global_b035d50127870e10 = ((((((4) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1834420d661ae9b79e8e68df() {
  return __cxx_static_address_1834420d661ae9b79e8e68df.reference || (__cxx_static_address_1834420d661ae9b79e8e68df.reference = {
    __cReference: true,
    get value() { return ACTIVATORLOCKED____header_global_b035d50127870e10; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:191
export const MUSICANDSFX____header_global_8ac64937a5bea8be = ((((((5) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8e93c76c70745ea8a0dc11bd() {
  return __cxx_static_address_8e93c76c70745ea8a0dc11bd.reference || (__cxx_static_address_8e93c76c70745ea8a0dc11bd.reference = {
    __cReference: true,
    get value() { return MUSICANDSFX____header_global_8ac64937a5bea8be; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:192
export const LOCATORS____header_global_383bb542fa1320cc = ((((((6) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_00a4447604532112b2d37703() {
  return __cxx_static_address_00a4447604532112b2d37703.reference || (__cxx_static_address_00a4447604532112b2d37703.reference = {
    __cReference: true,
    get value() { return LOCATORS____header_global_383bb542fa1320cc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:193
export const CYCLER____header_global_1a40ca6785674117 = ((((((7) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6ee345e45214cfac9960486c() {
  return __cxx_static_address_6ee345e45214cfac9960486c.reference || (__cxx_static_address_6ee345e45214cfac9960486c.reference = {
    __cReference: true,
    get value() { return CYCLER____header_global_1a40ca6785674117; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:194
export const MASTERSWITCH____header_global_f2a2cca9efa57051 = ((((((8) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_49d91c31bfb0aaf2d2709f30() {
  return __cxx_static_address_49d91c31bfb0aaf2d2709f30.reference || (__cxx_static_address_49d91c31bfb0aaf2d2709f30.reference = {
    __cReference: true,
    get value() { return MASTERSWITCH____header_global_f2a2cca9efa57051; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:195
export const RESPAWN____header_global_91b52496e55e34c5 = ((((((9) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bdebee223ed05c72d400151c() {
  return __cxx_static_address_bdebee223ed05c72d400151c.reference || (__cxx_static_address_bdebee223ed05c72d400151c.reference = {
    __cReference: true,
    get value() { return RESPAWN____header_global_91b52496e55e34c5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:196
export const GPSPEED____header_global_90b6469e01114da8 = ((((((10) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_53abd708924d60ca4e09f7fd() {
  return __cxx_static_address_53abd708924d60ca4e09f7fd.reference || (__cxx_static_address_53abd708924d60ca4e09f7fd.reference = {
    __cReference: true,
    get value() { return GPSPEED____header_global_90b6469e01114da8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:197
export const FOF____header_global_601d2824d12b7bf5 = ((((((13) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e75ad5a8d2d44754c9798d21() {
  return __cxx_static_address_e75ad5a8d2d44754c9798d21.reference || (__cxx_static_address_e75ad5a8d2d44754c9798d21.reference = {
    __cReference: true,
    get value() { return FOF____header_global_601d2824d12b7bf5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:198
export const ARROW____header_global_3cbaa333c9dc7c41 = ((((((20) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_252146a4153f64b950951467() {
  return __cxx_static_address_252146a4153f64b950951467.reference || (__cxx_static_address_252146a4153f64b950951467.reference = {
    __cReference: true,
    get value() { return ARROW____header_global_3cbaa333c9dc7c41; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:199
export const FIRSTGUNSPRITE____header_global_f73fa0de06b65a6c = ((((((21) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5f9e2463f8d19dbd49c569ef() {
  return __cxx_static_address_5f9e2463f8d19dbd49c569ef.reference || (__cxx_static_address_5f9e2463f8d19dbd49c569ef.reference = {
    __cReference: true,
    get value() { return FIRSTGUNSPRITE____header_global_f73fa0de06b65a6c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:200
export const CHAINGUNSPRITE____header_global_9c12cca6f038562f = ((((((22) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_66f884dd4c1cdb1318e085f1() {
  return __cxx_static_address_66f884dd4c1cdb1318e085f1.reference || (__cxx_static_address_66f884dd4c1cdb1318e085f1.reference = {
    __cReference: true,
    get value() { return CHAINGUNSPRITE____header_global_9c12cca6f038562f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:201
export const RPGSPRITE____header_global_03e7ca5ce3453d3c = ((((((23) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_848263e777bb99901a7ef0e7() {
  return __cxx_static_address_848263e777bb99901a7ef0e7.reference || (__cxx_static_address_848263e777bb99901a7ef0e7.reference = {
    __cReference: true,
    get value() { return RPGSPRITE____header_global_03e7ca5ce3453d3c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:202
export const FREEZESPRITE____header_global_b492258a356edfb5 = ((((((24) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fc9c3db0b246e39d64b099d4() {
  return __cxx_static_address_fc9c3db0b246e39d64b099d4.reference || (__cxx_static_address_fc9c3db0b246e39d64b099d4.reference = {
    __cReference: true,
    get value() { return FREEZESPRITE____header_global_b492258a356edfb5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:203
export const SHRINKERSPRITE____header_global_5993035546350f40 = ((((((25) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8aa7a108038c22292e04ccce() {
  return __cxx_static_address_8aa7a108038c22292e04ccce.reference || (__cxx_static_address_8aa7a108038c22292e04ccce.reference = {
    __cReference: true,
    get value() { return SHRINKERSPRITE____header_global_5993035546350f40; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:204
export const HEAVYHBOMB____header_global_13cfacb0a6130f08 = ((((((26) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b580aab16052601e80eb29c4() {
  return __cxx_static_address_b580aab16052601e80eb29c4.reference || (__cxx_static_address_b580aab16052601e80eb29c4.reference = {
    __cReference: true,
    get value() { return HEAVYHBOMB____header_global_13cfacb0a6130f08; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:205
export const TRIPBOMBSPRITE____header_global_720dde9f973cb18c = ((((((27) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5cf316334ffadd7fe5eb203d() {
  return __cxx_static_address_5cf316334ffadd7fe5eb203d.reference || (__cxx_static_address_5cf316334ffadd7fe5eb203d.reference = {
    __cReference: true,
    get value() { return TRIPBOMBSPRITE____header_global_720dde9f973cb18c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:206
export const SHOTGUNSPRITE____header_global_e2574678b382672e = ((((((28) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9016658712f90f51d915fb42() {
  return __cxx_static_address_9016658712f90f51d915fb42.reference || (__cxx_static_address_9016658712f90f51d915fb42.reference = {
    __cReference: true,
    get value() { return SHOTGUNSPRITE____header_global_e2574678b382672e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:207
export const DEVISTATORSPRITE____header_global_19d65295efa4a8e3 = ((((((29) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_625ed89c25525711c26b97ad() {
  return __cxx_static_address_625ed89c25525711c26b97ad.reference || (__cxx_static_address_625ed89c25525711c26b97ad.reference = {
    __cReference: true,
    get value() { return DEVISTATORSPRITE____header_global_19d65295efa4a8e3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:208
export const HEALTHBOX____header_global_e77ce81064ed96af = ((((((30) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b1fa262ef32881e4e7d25d8f() {
  return __cxx_static_address_b1fa262ef32881e4e7d25d8f.reference || (__cxx_static_address_b1fa262ef32881e4e7d25d8f.reference = {
    __cReference: true,
    get value() { return HEALTHBOX____header_global_e77ce81064ed96af; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:209
export const AMMOBOX____header_global_ae3e21befaa9700a = ((((((31) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_903dcbd0b64ad58dc8b48fad() {
  return __cxx_static_address_903dcbd0b64ad58dc8b48fad.reference || (__cxx_static_address_903dcbd0b64ad58dc8b48fad.reference = {
    __cReference: true,
    get value() { return AMMOBOX____header_global_ae3e21befaa9700a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:210
export const GROWSPRITEICON____header_global_4c21c62485320736 = ((((((32) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8a092689da59a46fed95f1c7() {
  return __cxx_static_address_8a092689da59a46fed95f1c7.reference || (__cxx_static_address_8a092689da59a46fed95f1c7.reference = {
    __cReference: true,
    get value() { return GROWSPRITEICON____header_global_4c21c62485320736; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:211
export const INVENTORYBOX____header_global_9e4451666b256f4a = ((((((33) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_075c8abe6329ea7665c1578d() {
  return __cxx_static_address_075c8abe6329ea7665c1578d.reference || (__cxx_static_address_075c8abe6329ea7665c1578d.reference = {
    __cReference: true,
    get value() { return INVENTORYBOX____header_global_9e4451666b256f4a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:212
export const FREEZEAMMO____header_global_a6ddc6bafaefda66 = ((((((37) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_962725f18e18e39fcd152700() {
  return __cxx_static_address_962725f18e18e39fcd152700.reference || (__cxx_static_address_962725f18e18e39fcd152700.reference = {
    __cReference: true,
    get value() { return FREEZEAMMO____header_global_a6ddc6bafaefda66; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:213
export const AMMO____header_global_39f397da850bca4b = ((((((40) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5312c0bdf19586fc9fbb0165() {
  return __cxx_static_address_5312c0bdf19586fc9fbb0165.reference || (__cxx_static_address_5312c0bdf19586fc9fbb0165.reference = {
    __cReference: true,
    get value() { return AMMO____header_global_39f397da850bca4b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:214
export const BATTERYAMMO____header_global_efc67ab2b5c0b04c = ((((((41) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_67d7337ad155be0f919a4ca2() {
  return __cxx_static_address_67d7337ad155be0f919a4ca2.reference || (__cxx_static_address_67d7337ad155be0f919a4ca2.reference = {
    __cReference: true,
    get value() { return BATTERYAMMO____header_global_efc67ab2b5c0b04c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:215
export const DEVISTATORAMMO____header_global_a1a5e5a30dc7c727 = ((((((42) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_63cec82d1f7b53cd8bd65833() {
  return __cxx_static_address_63cec82d1f7b53cd8bd65833.reference || (__cxx_static_address_63cec82d1f7b53cd8bd65833.reference = {
    __cReference: true,
    get value() { return DEVISTATORAMMO____header_global_a1a5e5a30dc7c727; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:216
export const RPGAMMO____header_global_f24104a903b8deba = ((((((44) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6d796954f58eb0bd627b360b() {
  return __cxx_static_address_6d796954f58eb0bd627b360b.reference || (__cxx_static_address_6d796954f58eb0bd627b360b.reference = {
    __cReference: true,
    get value() { return RPGAMMO____header_global_f24104a903b8deba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:217
export const GROWAMMO____header_global_05fd26cca714c84b = ((((((45) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_985204edd71f77d82b905ef9() {
  return __cxx_static_address_985204edd71f77d82b905ef9.reference || (__cxx_static_address_985204edd71f77d82b905ef9.reference = {
    __cReference: true,
    get value() { return GROWAMMO____header_global_05fd26cca714c84b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:218
export const CRYSTALAMMO____header_global_adf3f2e1f916dfa5 = ((((((46) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8558af392d86aeaac918cbea() {
  return __cxx_static_address_8558af392d86aeaac918cbea.reference || (__cxx_static_address_8558af392d86aeaac918cbea.reference = {
    __cReference: true,
    get value() { return CRYSTALAMMO____header_global_adf3f2e1f916dfa5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:219
export const HBOMBAMMO____header_global_a4ab4a0b7c540084 = ((((((47) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eb32fe06ceeb861c138bffee() {
  return __cxx_static_address_eb32fe06ceeb861c138bffee.reference || (__cxx_static_address_eb32fe06ceeb861c138bffee.reference = {
    __cReference: true,
    get value() { return HBOMBAMMO____header_global_a4ab4a0b7c540084; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:220
export const AMMOLOTS____header_global_1827bc0abb026353 = ((((((48) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_76ed147beff17d92ac87e31f() {
  return __cxx_static_address_76ed147beff17d92ac87e31f.reference || (__cxx_static_address_76ed147beff17d92ac87e31f.reference = {
    __cReference: true,
    get value() { return AMMOLOTS____header_global_1827bc0abb026353; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:221
export const SHOTGUNAMMO____header_global_268afb0047902724 = ((((((49) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fda87d8a49e451b52909636e() {
  return __cxx_static_address_fda87d8a49e451b52909636e.reference || (__cxx_static_address_fda87d8a49e451b52909636e.reference = {
    __cReference: true,
    get value() { return SHOTGUNAMMO____header_global_268afb0047902724; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:222
export const COLA____header_global_2d2786d2704dec1e = ((((((51) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ce6cf3017de9714527db00e5() {
  return __cxx_static_address_ce6cf3017de9714527db00e5.reference || (__cxx_static_address_ce6cf3017de9714527db00e5.reference = {
    __cReference: true,
    get value() { return COLA____header_global_2d2786d2704dec1e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:223
export const SIXPAK____header_global_b90018d034d18983 = ((((((52) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_48c42f1b2205ca0a03df2d3e() {
  return __cxx_static_address_48c42f1b2205ca0a03df2d3e.reference || (__cxx_static_address_48c42f1b2205ca0a03df2d3e.reference = {
    __cReference: true,
    get value() { return SIXPAK____header_global_b90018d034d18983; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:224
export const FIRSTAID____header_global_00486630ed81ef54 = ((((((53) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_80378e0e40c627e5e2deb90f() {
  return __cxx_static_address_80378e0e40c627e5e2deb90f.reference || (__cxx_static_address_80378e0e40c627e5e2deb90f.reference = {
    __cReference: true,
    get value() { return FIRSTAID____header_global_00486630ed81ef54; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:225
export const SHIELD____header_global_d9c938b9e43ea3ad = ((((((54) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_540b0a1b32fda2550f5757a4() {
  return __cxx_static_address_540b0a1b32fda2550f5757a4.reference || (__cxx_static_address_540b0a1b32fda2550f5757a4.reference = {
    __cReference: true,
    get value() { return SHIELD____header_global_d9c938b9e43ea3ad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:226
export const STEROIDS____header_global_f4d11f31dd5cb7fd = ((((((55) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_936c4f2e7aeb9f57baf9bc4f() {
  return __cxx_static_address_936c4f2e7aeb9f57baf9bc4f.reference || (__cxx_static_address_936c4f2e7aeb9f57baf9bc4f.reference = {
    __cReference: true,
    get value() { return STEROIDS____header_global_f4d11f31dd5cb7fd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:227
export const AIRTANK____header_global_d3a985c3eaaefd3c = ((((((56) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_76e9305ac6d150e5fcc3c353() {
  return __cxx_static_address_76e9305ac6d150e5fcc3c353.reference || (__cxx_static_address_76e9305ac6d150e5fcc3c353.reference = {
    __cReference: true,
    get value() { return AIRTANK____header_global_d3a985c3eaaefd3c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:228
export const JETPACK____header_global_1fa75b398760317c = ((((((57) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8b99314b83c357b75b79a88f() {
  return __cxx_static_address_8b99314b83c357b75b79a88f.reference || (__cxx_static_address_8b99314b83c357b75b79a88f.reference = {
    __cReference: true,
    get value() { return JETPACK____header_global_1fa75b398760317c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:229
export const HEATSENSOR____header_global_e62ac2f7caec8570 = ((((((59) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7399b90f77c9e702a0b443e5() {
  return __cxx_static_address_7399b90f77c9e702a0b443e5.reference || (__cxx_static_address_7399b90f77c9e702a0b443e5.reference = {
    __cReference: true,
    get value() { return HEATSENSOR____header_global_e62ac2f7caec8570; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:230
export const ACCESSCARD____header_global_c8d165ea6ca47cae = ((((((60) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0ae9766a27347d7a6549fee3() {
  return __cxx_static_address_0ae9766a27347d7a6549fee3.reference || (__cxx_static_address_0ae9766a27347d7a6549fee3.reference = {
    __cReference: true,
    get value() { return ACCESSCARD____header_global_c8d165ea6ca47cae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:231
export const BOOTS____header_global_8b836fef67294455 = ((((((61) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_33b32464388f3d86e10b5126() {
  return __cxx_static_address_33b32464388f3d86e10b5126.reference || (__cxx_static_address_33b32464388f3d86e10b5126.reference = {
    __cReference: true,
    get value() { return BOOTS____header_global_8b836fef67294455; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:232
export const MIRRORBROKE____header_global_88913b8843d68868 = ((((((70) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7907ee536f94609aed57c94f() {
  return __cxx_static_address_7907ee536f94609aed57c94f.reference || (__cxx_static_address_7907ee536f94609aed57c94f.reference = {
    __cReference: true,
    get value() { return MIRRORBROKE____header_global_88913b8843d68868; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:233
export const CLOUDYOCEAN____header_global_8a56302370967d66 = ((((((78) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ddca9dc41a056be1634958f4() {
  return __cxx_static_address_ddca9dc41a056be1634958f4.reference || (__cxx_static_address_ddca9dc41a056be1634958f4.reference = {
    __cReference: true,
    get value() { return CLOUDYOCEAN____header_global_8a56302370967d66; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:234
export const CLOUDYSKIES____header_global_cb1878162e672d11 = ((((((79) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e029cea0197e541774bf020() {
  return __cxx_static_address_1e029cea0197e541774bf020.reference || (__cxx_static_address_1e029cea0197e541774bf020.reference = {
    __cReference: true,
    get value() { return CLOUDYSKIES____header_global_cb1878162e672d11; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:235
export const MOONSKY1____header_global_da110be8e0d93ba9 = ((((((80) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_074379e63279eb4f9800f541() {
  return __cxx_static_address_074379e63279eb4f9800f541.reference || (__cxx_static_address_074379e63279eb4f9800f541.reference = {
    __cReference: true,
    get value() { return MOONSKY1____header_global_da110be8e0d93ba9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:236
export const BIGORBIT1____header_global_74878b90f0be5a16 = ((((((84) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_09769c17ddd43e291a000cfa() {
  return __cxx_static_address_09769c17ddd43e291a000cfa.reference || (__cxx_static_address_09769c17ddd43e291a000cfa.reference = {
    __cReference: true,
    get value() { return BIGORBIT1____header_global_74878b90f0be5a16; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:237
export const LA____header_global_198dde2ed6c704ab = ((((((89) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e9355abdd68b3c5aab82ba27() {
  return __cxx_static_address_e9355abdd68b3c5aab82ba27.reference || (__cxx_static_address_e9355abdd68b3c5aab82ba27.reference = {
    __cReference: true,
    get value() { return LA____header_global_198dde2ed6c704ab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:238
export const ATOMICHEALTH____header_global_00ffcc99063d4550 = ((((((100) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3abf522a98b03b3870c7761f() {
  return __cxx_static_address_3abf522a98b03b3870c7761f.reference || (__cxx_static_address_3abf522a98b03b3870c7761f.reference = {
    __cReference: true,
    get value() { return ATOMICHEALTH____header_global_00ffcc99063d4550; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:239
export const TECHLIGHT2____header_global_a7ae731f1df32822 = ((((((120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_605944edf5c45c288439bf6c() {
  return __cxx_static_address_605944edf5c45c288439bf6c.reference || (__cxx_static_address_605944edf5c45c288439bf6c.reference = {
    __cReference: true,
    get value() { return TECHLIGHT2____header_global_a7ae731f1df32822; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:240
export const TECHLIGHTBUST2____header_global_166a0f035a0e9f3d = ((((((121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b6788b6fa8aff471b898b7a3() {
  return __cxx_static_address_b6788b6fa8aff471b898b7a3.reference || (__cxx_static_address_b6788b6fa8aff471b898b7a3.reference = {
    __cReference: true,
    get value() { return TECHLIGHTBUST2____header_global_166a0f035a0e9f3d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:241
export const TECHLIGHT4____header_global_8018ac14b1d8c4ef = ((((((122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6e4ded8898a732701b0cc32b() {
  return __cxx_static_address_6e4ded8898a732701b0cc32b.reference || (__cxx_static_address_6e4ded8898a732701b0cc32b.reference = {
    __cReference: true,
    get value() { return TECHLIGHT4____header_global_8018ac14b1d8c4ef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:242
export const TECHLIGHTBUST4____header_global_32c1d154e465c706 = ((((((123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ea3827b00f3225b027970f64() {
  return __cxx_static_address_ea3827b00f3225b027970f64.reference || (__cxx_static_address_ea3827b00f3225b027970f64.reference = {
    __cReference: true,
    get value() { return TECHLIGHTBUST4____header_global_32c1d154e465c706; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:243
export const WALLLIGHT4____header_global_0946f988e1c1680c = ((((((124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c271673a0185c3d276d83ac5() {
  return __cxx_static_address_c271673a0185c3d276d83ac5.reference || (__cxx_static_address_c271673a0185c3d276d83ac5.reference = {
    __cReference: true,
    get value() { return WALLLIGHT4____header_global_0946f988e1c1680c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:244
export const WALLLIGHTBUST4____header_global_8a368316706ee8fe = ((((((125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_182cdb434f423cb535912198() {
  return __cxx_static_address_182cdb434f423cb535912198.reference || (__cxx_static_address_182cdb434f423cb535912198.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST4____header_global_8a368316706ee8fe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:245
export const ACCESSSWITCH____header_global_a1b8cc5e171f0fa1 = ((((((130) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_96c1f549fc30778e9084eec9() {
  return __cxx_static_address_96c1f549fc30778e9084eec9.reference || (__cxx_static_address_96c1f549fc30778e9084eec9.reference = {
    __cReference: true,
    get value() { return ACCESSSWITCH____header_global_a1b8cc5e171f0fa1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:246
export const SLOTDOOR____header_global_d2ece6b22db21146 = ((((((132) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4ae528c1f3650384db70851d() {
  return __cxx_static_address_4ae528c1f3650384db70851d.reference || (__cxx_static_address_4ae528c1f3650384db70851d.reference = {
    __cReference: true,
    get value() { return SLOTDOOR____header_global_d2ece6b22db21146; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:247
export const LIGHTSWITCH____header_global_edcd7f9c30bbb02d = ((((((134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e9a123128d0dc496a19f4f7b() {
  return __cxx_static_address_e9a123128d0dc496a19f4f7b.reference || (__cxx_static_address_e9a123128d0dc496a19f4f7b.reference = {
    __cReference: true,
    get value() { return LIGHTSWITCH____header_global_edcd7f9c30bbb02d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:248
export const SPACEDOORSWITCH____header_global_49437b8c1b889190 = ((((((136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e42600e3312536f4044f7509() {
  return __cxx_static_address_e42600e3312536f4044f7509.reference || (__cxx_static_address_e42600e3312536f4044f7509.reference = {
    __cReference: true,
    get value() { return SPACEDOORSWITCH____header_global_49437b8c1b889190; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:249
export const SPACELIGHTSWITCH____header_global_69ce5867fd966424 = ((((((138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c62c20419c3cbf22cf5a92d4() {
  return __cxx_static_address_c62c20419c3cbf22cf5a92d4.reference || (__cxx_static_address_c62c20419c3cbf22cf5a92d4.reference = {
    __cReference: true,
    get value() { return SPACELIGHTSWITCH____header_global_69ce5867fd966424; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:250
export const FRANKENSTINESWITCH____header_global_f892b8c7d8fc6894 = ((((((140) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a9af0fb5516139051885a3c8() {
  return __cxx_static_address_a9af0fb5516139051885a3c8.reference || (__cxx_static_address_a9af0fb5516139051885a3c8.reference = {
    __cReference: true,
    get value() { return FRANKENSTINESWITCH____header_global_f892b8c7d8fc6894; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:251
export const NUKEBUTTON____header_global_4113a67e5f90fdac = ((((((142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e21b26751ac1c0bcbb3abdff() {
  return __cxx_static_address_e21b26751ac1c0bcbb3abdff.reference || (__cxx_static_address_e21b26751ac1c0bcbb3abdff.reference = {
    __cReference: true,
    get value() { return NUKEBUTTON____header_global_4113a67e5f90fdac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:252
export const MULTISWITCH____header_global_e51a7d15849043c4 = ((((((146) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_31720b3ef9283af69788477e() {
  return __cxx_static_address_31720b3ef9283af69788477e.reference || (__cxx_static_address_31720b3ef9283af69788477e.reference = {
    __cReference: true,
    get value() { return MULTISWITCH____header_global_e51a7d15849043c4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:253
export const DOORTILE5____header_global_bcdf897807e3ac4c = ((((((150) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_57f02f2b317295c6acfeb88b() {
  return __cxx_static_address_57f02f2b317295c6acfeb88b.reference || (__cxx_static_address_57f02f2b317295c6acfeb88b.reference = {
    __cReference: true,
    get value() { return DOORTILE5____header_global_bcdf897807e3ac4c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:254
export const DOORTILE6____header_global_99ac61df113924ae = ((((((151) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f33c52dd6da54db5146e87cd() {
  return __cxx_static_address_f33c52dd6da54db5146e87cd.reference || (__cxx_static_address_f33c52dd6da54db5146e87cd.reference = {
    __cReference: true,
    get value() { return DOORTILE6____header_global_99ac61df113924ae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:255
export const DOORTILE1____header_global_8bffb6651f0702d9 = ((((((152) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e231c14d873b8c2d1a15b0a1() {
  return __cxx_static_address_e231c14d873b8c2d1a15b0a1.reference || (__cxx_static_address_e231c14d873b8c2d1a15b0a1.reference = {
    __cReference: true,
    get value() { return DOORTILE1____header_global_8bffb6651f0702d9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:256
export const DOORTILE2____header_global_1b34a206ba725d8a = ((((((153) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1273468e510789e990701aa5() {
  return __cxx_static_address_1273468e510789e990701aa5.reference || (__cxx_static_address_1273468e510789e990701aa5.reference = {
    __cReference: true,
    get value() { return DOORTILE2____header_global_1b34a206ba725d8a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:257
export const DOORTILE3____header_global_244fd04defd327a2 = ((((((154) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f80c3593e935242108605915() {
  return __cxx_static_address_f80c3593e935242108605915.reference || (__cxx_static_address_f80c3593e935242108605915.reference = {
    __cReference: true,
    get value() { return DOORTILE3____header_global_244fd04defd327a2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:258
export const DOORTILE4____header_global_c3267f8e7bae5cd4 = ((((((155) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fc04eed31a3ba5c858cb27f7() {
  return __cxx_static_address_fc04eed31a3ba5c858cb27f7.reference || (__cxx_static_address_fc04eed31a3ba5c858cb27f7.reference = {
    __cReference: true,
    get value() { return DOORTILE4____header_global_c3267f8e7bae5cd4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:259
export const DOORTILE7____header_global_43cd5927ff3fb8b3 = ((((((156) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d441c26e75c5c0497bc0b7b8() {
  return __cxx_static_address_d441c26e75c5c0497bc0b7b8.reference || (__cxx_static_address_d441c26e75c5c0497bc0b7b8.reference = {
    __cReference: true,
    get value() { return DOORTILE7____header_global_43cd5927ff3fb8b3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:260
export const DOORTILE8____header_global_59905abca0aed30a = ((((((157) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2cf799a6cab99e8d8a25d6d7() {
  return __cxx_static_address_2cf799a6cab99e8d8a25d6d7.reference || (__cxx_static_address_2cf799a6cab99e8d8a25d6d7.reference = {
    __cReference: true,
    get value() { return DOORTILE8____header_global_59905abca0aed30a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:261
export const DOORTILE9____header_global_0071b7c94f1fea6b = ((((((158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0710472a91bbaeb6ab535dd2() {
  return __cxx_static_address_0710472a91bbaeb6ab535dd2.reference || (__cxx_static_address_0710472a91bbaeb6ab535dd2.reference = {
    __cReference: true,
    get value() { return DOORTILE9____header_global_0071b7c94f1fea6b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:262
export const DOORTILE10____header_global_ce92fda4ba7c2f85 = ((((((159) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c66c85cfedbc4343488dee55() {
  return __cxx_static_address_c66c85cfedbc4343488dee55.reference || (__cxx_static_address_c66c85cfedbc4343488dee55.reference = {
    __cReference: true,
    get value() { return DOORTILE10____header_global_ce92fda4ba7c2f85; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:263
export const DOORSHOCK____header_global_ec5d26880a35a23c = ((((((160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2629851c593d8fd5d20e512c() {
  return __cxx_static_address_2629851c593d8fd5d20e512c.reference || (__cxx_static_address_2629851c593d8fd5d20e512c.reference = {
    __cReference: true,
    get value() { return DOORSHOCK____header_global_ec5d26880a35a23c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:264
export const DIPSWITCH____header_global_b00a876ffbeec6c3 = ((((((162) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0bbdc9af9f82397f632d2f78() {
  return __cxx_static_address_0bbdc9af9f82397f632d2f78.reference || (__cxx_static_address_0bbdc9af9f82397f632d2f78.reference = {
    __cReference: true,
    get value() { return DIPSWITCH____header_global_b00a876ffbeec6c3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:265
export const DIPSWITCH2____header_global_2f00ff6774da8aef = ((((((164) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6febc60da8cfd10e2fbf5f80() {
  return __cxx_static_address_6febc60da8cfd10e2fbf5f80.reference || (__cxx_static_address_6febc60da8cfd10e2fbf5f80.reference = {
    __cReference: true,
    get value() { return DIPSWITCH2____header_global_2f00ff6774da8aef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:266
export const TECHSWITCH____header_global_8910f72f8ba14860 = ((((((166) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8d969af4a22de6a7eaa03c22() {
  return __cxx_static_address_8d969af4a22de6a7eaa03c22.reference || (__cxx_static_address_8d969af4a22de6a7eaa03c22.reference = {
    __cReference: true,
    get value() { return TECHSWITCH____header_global_8910f72f8ba14860; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:267
export const DIPSWITCH3____header_global_2a1f9eda3015cbdf = ((((((168) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d79edd39b457ef3e030a32a0() {
  return __cxx_static_address_d79edd39b457ef3e030a32a0.reference || (__cxx_static_address_d79edd39b457ef3e030a32a0.reference = {
    __cReference: true,
    get value() { return DIPSWITCH3____header_global_2a1f9eda3015cbdf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:268
export const ACCESSSWITCH2____header_global_20066eb18de5d6f1 = ((((((170) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c8fbef5fb2a54b5337742755() {
  return __cxx_static_address_c8fbef5fb2a54b5337742755.reference || (__cxx_static_address_c8fbef5fb2a54b5337742755.reference = {
    __cReference: true,
    get value() { return ACCESSSWITCH2____header_global_20066eb18de5d6f1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:269
export const FLOORSLIME____header_global_9693d24b827cd427 = ((((((200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e63fd0baa79a58818c2546f2() {
  return __cxx_static_address_e63fd0baa79a58818c2546f2.reference || (__cxx_static_address_e63fd0baa79a58818c2546f2.reference = {
    __cReference: true,
    get value() { return FLOORSLIME____header_global_9693d24b827cd427; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:270
export const BIGFORCE____header_global_5b010ee4486bede1 = ((((((230) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_45cb5762fce92073f51a6fe3() {
  return __cxx_static_address_45cb5762fce92073f51a6fe3.reference || (__cxx_static_address_45cb5762fce92073f51a6fe3.reference = {
    __cReference: true,
    get value() { return BIGFORCE____header_global_5b010ee4486bede1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:271
export const MASKWALL9____header_global_c6bbca9626b8cfbc = ((((((255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fec4556d1363505a61f9a63a() {
  return __cxx_static_address_fec4556d1363505a61f9a63a.reference || (__cxx_static_address_fec4556d1363505a61f9a63a.reference = {
    __cReference: true,
    get value() { return MASKWALL9____header_global_c6bbca9626b8cfbc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:272
export const SCREENBREAK1____header_global_1635871734a77811 = ((((((263) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cdf05c53aa7de845854e7ca7() {
  return __cxx_static_address_cdf05c53aa7de845854e7ca7.reference || (__cxx_static_address_cdf05c53aa7de845854e7ca7.reference = {
    __cReference: true,
    get value() { return SCREENBREAK1____header_global_1635871734a77811; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:273
export const SCREENBREAK2____header_global_4eee7109f84362cd = ((((((264) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_894a6c64d469888af74ad49b() {
  return __cxx_static_address_894a6c64d469888af74ad49b.reference || (__cxx_static_address_894a6c64d469888af74ad49b.reference = {
    __cReference: true,
    get value() { return SCREENBREAK2____header_global_4eee7109f84362cd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:274
export const SCREENBREAK3____header_global_74907eb4642fac11 = ((((((265) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_880affd4dce395535818b297() {
  return __cxx_static_address_880affd4dce395535818b297.reference || (__cxx_static_address_880affd4dce395535818b297.reference = {
    __cReference: true,
    get value() { return SCREENBREAK3____header_global_74907eb4642fac11; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:275
export const SCREENBREAK4____header_global_34128860c6b108ea = ((((((266) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e042be47c73d828021783677() {
  return __cxx_static_address_e042be47c73d828021783677.reference || (__cxx_static_address_e042be47c73d828021783677.reference = {
    __cReference: true,
    get value() { return SCREENBREAK4____header_global_34128860c6b108ea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:276
export const SCREENBREAK5____header_global_b4bfcf76b6560933 = ((((((267) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_993fc30a5f1d9403dae67f0e() {
  return __cxx_static_address_993fc30a5f1d9403dae67f0e.reference || (__cxx_static_address_993fc30a5f1d9403dae67f0e.reference = {
    __cReference: true,
    get value() { return SCREENBREAK5____header_global_b4bfcf76b6560933; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:277
export const SCREENBREAK6____header_global_8cae46b652d91b01 = ((((((268) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ada22f6772ab30e631019d3e() {
  return __cxx_static_address_ada22f6772ab30e631019d3e.reference || (__cxx_static_address_ada22f6772ab30e631019d3e.reference = {
    __cReference: true,
    get value() { return SCREENBREAK6____header_global_8cae46b652d91b01; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:278
export const SCREENBREAK7____header_global_29b37be517ded523 = ((((((269) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_21f522289cbc8ad6ca097344() {
  return __cxx_static_address_21f522289cbc8ad6ca097344.reference || (__cxx_static_address_21f522289cbc8ad6ca097344.reference = {
    __cReference: true,
    get value() { return SCREENBREAK7____header_global_29b37be517ded523; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:279
export const SCREENBREAK8____header_global_8e76804c982c0093 = ((((((270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a9855d6a84ba02aff84662e4() {
  return __cxx_static_address_a9855d6a84ba02aff84662e4.reference || (__cxx_static_address_a9855d6a84ba02aff84662e4.reference = {
    __cReference: true,
    get value() { return SCREENBREAK8____header_global_8e76804c982c0093; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:280
export const SCREENBREAK9____header_global_82f4b5e2bf71fc66 = ((((((271) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_950a2a7a8c0489850a09a05c() {
  return __cxx_static_address_950a2a7a8c0489850a09a05c.reference || (__cxx_static_address_950a2a7a8c0489850a09a05c.reference = {
    __cReference: true,
    get value() { return SCREENBREAK9____header_global_82f4b5e2bf71fc66; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:281
export const SCREENBREAK10____header_global_0eb30ddabe8bcc29 = ((((((272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_014c4d26d75f391910770b62() {
  return __cxx_static_address_014c4d26d75f391910770b62.reference || (__cxx_static_address_014c4d26d75f391910770b62.reference = {
    __cReference: true,
    get value() { return SCREENBREAK10____header_global_0eb30ddabe8bcc29; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:282
export const SCREENBREAK11____header_global_72578ca567c04a5d = ((((((273) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_98a7edea06118d76a48817e9() {
  return __cxx_static_address_98a7edea06118d76a48817e9.reference || (__cxx_static_address_98a7edea06118d76a48817e9.reference = {
    __cReference: true,
    get value() { return SCREENBREAK11____header_global_72578ca567c04a5d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:283
export const SCREENBREAK12____header_global_58d3f65951315dc9 = ((((((274) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_257ef4f6b76d24adb8323505() {
  return __cxx_static_address_257ef4f6b76d24adb8323505.reference || (__cxx_static_address_257ef4f6b76d24adb8323505.reference = {
    __cReference: true,
    get value() { return SCREENBREAK12____header_global_58d3f65951315dc9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:284
export const SCREENBREAK13____header_global_d10eae10929bfb2a = ((((((275) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a5d97bed562904bbe9070e18() {
  return __cxx_static_address_a5d97bed562904bbe9070e18.reference || (__cxx_static_address_a5d97bed562904bbe9070e18.reference = {
    __cReference: true,
    get value() { return SCREENBREAK13____header_global_d10eae10929bfb2a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:285
export const MASKWALL1____header_global_d90b701be30aac06 = ((((((285) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6be432c59efdb6f951deb1c5() {
  return __cxx_static_address_6be432c59efdb6f951deb1c5.reference || (__cxx_static_address_6be432c59efdb6f951deb1c5.reference = {
    __cReference: true,
    get value() { return MASKWALL1____header_global_d90b701be30aac06; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:286
export const W_TECHWALL1____header_global_20aa2abab9b5da4a = ((((((293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_14046fc9d804e70de562c77e() {
  return __cxx_static_address_14046fc9d804e70de562c77e.reference || (__cxx_static_address_14046fc9d804e70de562c77e.reference = {
    __cReference: true,
    get value() { return W_TECHWALL1____header_global_20aa2abab9b5da4a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:287
export const W_TECHWALL2____header_global_bd255c613ad99475 = ((((((297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1edfd8ac65d350b8fd419f49() {
  return __cxx_static_address_1edfd8ac65d350b8fd419f49.reference || (__cxx_static_address_1edfd8ac65d350b8fd419f49.reference = {
    __cReference: true,
    get value() { return W_TECHWALL2____header_global_bd255c613ad99475; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:288
export const W_TECHWALL15____header_global_dc66caaaf0598a09 = ((((((299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bb0cd614483b9dd96dcae82d() {
  return __cxx_static_address_bb0cd614483b9dd96dcae82d.reference || (__cxx_static_address_bb0cd614483b9dd96dcae82d.reference = {
    __cReference: true,
    get value() { return W_TECHWALL15____header_global_dc66caaaf0598a09; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:289
export const W_TECHWALL3____header_global_ce947323c074e433 = ((((((301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_da4690f1bc63eac4666bbaf8() {
  return __cxx_static_address_da4690f1bc63eac4666bbaf8.reference || (__cxx_static_address_da4690f1bc63eac4666bbaf8.reference = {
    __cReference: true,
    get value() { return W_TECHWALL3____header_global_ce947323c074e433; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:290
export const W_TECHWALL4____header_global_774e70e94f535cb6 = ((((((305) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c08944c001a146a05aa274d1() {
  return __cxx_static_address_c08944c001a146a05aa274d1.reference || (__cxx_static_address_c08944c001a146a05aa274d1.reference = {
    __cReference: true,
    get value() { return W_TECHWALL4____header_global_774e70e94f535cb6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:291
export const W_TECHWALL10____header_global_6c121cf51b83e543 = ((((((306) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ec473759c8e3aff2f967d6b3() {
  return __cxx_static_address_ec473759c8e3aff2f967d6b3.reference || (__cxx_static_address_ec473759c8e3aff2f967d6b3.reference = {
    __cReference: true,
    get value() { return W_TECHWALL10____header_global_6c121cf51b83e543; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:292
export const W_TECHWALL16____header_global_0fbeda77beff5ef1 = ((((((307) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_29bdcb17d0a6e206b42ef3ad() {
  return __cxx_static_address_29bdcb17d0a6e206b42ef3ad.reference || (__cxx_static_address_29bdcb17d0a6e206b42ef3ad.reference = {
    __cReference: true,
    get value() { return W_TECHWALL16____header_global_0fbeda77beff5ef1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:293
export const WATERTILE2____header_global_f8282236db91947a = ((((((336) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f6661100edd0d29b57ca16fb() {
  return __cxx_static_address_f6661100edd0d29b57ca16fb.reference || (__cxx_static_address_f6661100edd0d29b57ca16fb.reference = {
    __cReference: true,
    get value() { return WATERTILE2____header_global_f8282236db91947a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:294
export const BPANNEL1____header_global_7cf0b0d76c2a7d0f = ((((((341) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_172abda24c5ef80c8d8c3146() {
  return __cxx_static_address_172abda24c5ef80c8d8c3146.reference || (__cxx_static_address_172abda24c5ef80c8d8c3146.reference = {
    __cReference: true,
    get value() { return BPANNEL1____header_global_7cf0b0d76c2a7d0f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:295
export const PANNEL1____header_global_fe46ee80ea012028 = ((((((342) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bcef71efe3399c1c6226dd4b() {
  return __cxx_static_address_bcef71efe3399c1c6226dd4b.reference || (__cxx_static_address_bcef71efe3399c1c6226dd4b.reference = {
    __cReference: true,
    get value() { return PANNEL1____header_global_fe46ee80ea012028; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:296
export const PANNEL2____header_global_7893fa5d2331d6b8 = ((((((343) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3967a0cd374b8609b44b0e4b() {
  return __cxx_static_address_3967a0cd374b8609b44b0e4b.reference || (__cxx_static_address_3967a0cd374b8609b44b0e4b.reference = {
    __cReference: true,
    get value() { return PANNEL2____header_global_7893fa5d2331d6b8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:297
export const STATIC____header_global_ad1ba8cc33ac46a3 = ((((((351) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e566f0425fcac52e381c5f49() {
  return __cxx_static_address_e566f0425fcac52e381c5f49.reference || (__cxx_static_address_e566f0425fcac52e381c5f49.reference = {
    __cReference: true,
    get value() { return STATIC____header_global_ad1ba8cc33ac46a3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:298
export const W_SCREENBREAK____header_global_45f30a521d47d0c8 = ((((((357) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7db2de31949ca1505f52e3c3() {
  return __cxx_static_address_7db2de31949ca1505f52e3c3.reference || (__cxx_static_address_7db2de31949ca1505f52e3c3.reference = {
    __cReference: true,
    get value() { return W_SCREENBREAK____header_global_45f30a521d47d0c8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:299
export const W_HITTECHWALL3____header_global_97a00ca679a01a6e = ((((((360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6ec00e017fe7aac327e31cc2() {
  return __cxx_static_address_6ec00e017fe7aac327e31cc2.reference || (__cxx_static_address_6ec00e017fe7aac327e31cc2.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL3____header_global_97a00ca679a01a6e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:300
export const W_HITTECHWALL4____header_global_8baabeb21fd00133 = ((((((361) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_08f6d30b4729f34f6a154f81() {
  return __cxx_static_address_08f6d30b4729f34f6a154f81.reference || (__cxx_static_address_08f6d30b4729f34f6a154f81.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL4____header_global_8baabeb21fd00133; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:301
export const W_HITTECHWALL2____header_global_4f8b4f33c7c7b359 = ((((((362) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_58cc42cce2167afa6229a0dd() {
  return __cxx_static_address_58cc42cce2167afa6229a0dd.reference || (__cxx_static_address_58cc42cce2167afa6229a0dd.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL2____header_global_4f8b4f33c7c7b359; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:302
export const W_HITTECHWALL1____header_global_f04ff9ce0606cf71 = ((((((363) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_20426f1fc4a4a40ad5667a1c() {
  return __cxx_static_address_20426f1fc4a4a40ad5667a1c.reference || (__cxx_static_address_20426f1fc4a4a40ad5667a1c.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL1____header_global_f04ff9ce0606cf71; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:303
export const MASKWALL10____header_global_0af3a83f053b72c9 = ((((((387) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bf8d04deda545eb17129737e() {
  return __cxx_static_address_bf8d04deda545eb17129737e.reference || (__cxx_static_address_bf8d04deda545eb17129737e.reference = {
    __cReference: true,
    get value() { return MASKWALL10____header_global_0af3a83f053b72c9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:304
export const MASKWALL11____header_global_13cadd8d29bc5661 = ((((((391) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4cfd9775069971a4244b65f3() {
  return __cxx_static_address_4cfd9775069971a4244b65f3.reference || (__cxx_static_address_4cfd9775069971a4244b65f3.reference = {
    __cReference: true,
    get value() { return MASKWALL11____header_global_13cadd8d29bc5661; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:305
export const DOORTILE22____header_global_448fb97e6ae18d11 = ((((((395) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c57574de2c31221c79759278() {
  return __cxx_static_address_c57574de2c31221c79759278.reference || (__cxx_static_address_c57574de2c31221c79759278.reference = {
    __cReference: true,
    get value() { return DOORTILE22____header_global_448fb97e6ae18d11; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:306
export const FANSPRITE____header_global_f8f5886eb72ee799 = ((((((407) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5e848d6bbdf4fcee7817dba9() {
  return __cxx_static_address_5e848d6bbdf4fcee7817dba9.reference || (__cxx_static_address_5e848d6bbdf4fcee7817dba9.reference = {
    __cReference: true,
    get value() { return FANSPRITE____header_global_f8f5886eb72ee799; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:307
export const FANSPRITEBROKE____header_global_87a73afb5cea0946 = ((((((411) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a9ba8569590b7b3006d6d645() {
  return __cxx_static_address_a9ba8569590b7b3006d6d645.reference || (__cxx_static_address_a9ba8569590b7b3006d6d645.reference = {
    __cReference: true,
    get value() { return FANSPRITEBROKE____header_global_87a73afb5cea0946; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:308
export const FANSHADOW____header_global_89bf1f14e2718893 = ((((((412) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fb64331f6cfc95d9ea7ab26f() {
  return __cxx_static_address_fb64331f6cfc95d9ea7ab26f.reference || (__cxx_static_address_fb64331f6cfc95d9ea7ab26f.reference = {
    __cReference: true,
    get value() { return FANSHADOW____header_global_89bf1f14e2718893; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:309
export const FANSHADOWBROKE____header_global_065d5461e113c10f = ((((((416) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0d9095c261289a899ec0095a() {
  return __cxx_static_address_0d9095c261289a899ec0095a.reference || (__cxx_static_address_0d9095c261289a899ec0095a.reference = {
    __cReference: true,
    get value() { return FANSHADOWBROKE____header_global_065d5461e113c10f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:310
export const DOORTILE18____header_global_18fcad88be0d9d65 = ((((((447) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e87722eebf064b83b5e90f80() {
  return __cxx_static_address_e87722eebf064b83b5e90f80.reference || (__cxx_static_address_e87722eebf064b83b5e90f80.reference = {
    __cReference: true,
    get value() { return DOORTILE18____header_global_18fcad88be0d9d65; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:311
export const DOORTILE19____header_global_65c738abd9f56bf8 = ((((((448) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_69e7488cf5e8c7c891642e6a() {
  return __cxx_static_address_69e7488cf5e8c7c891642e6a.reference || (__cxx_static_address_69e7488cf5e8c7c891642e6a.reference = {
    __cReference: true,
    get value() { return DOORTILE19____header_global_65c738abd9f56bf8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:312
export const DOORTILE20____header_global_7502441fa3480838 = ((((((449) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f21fb8975eb9f00586ae93cd() {
  return __cxx_static_address_f21fb8975eb9f00586ae93cd.reference || (__cxx_static_address_f21fb8975eb9f00586ae93cd.reference = {
    __cReference: true,
    get value() { return DOORTILE20____header_global_7502441fa3480838; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:313
export const VIEWSCREEN2____header_global_ae26f68064da25fd = ((((((499) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a5225e165826a9981be0e886() {
  return __cxx_static_address_a5225e165826a9981be0e886.reference || (__cxx_static_address_a5225e165826a9981be0e886.reference = {
    __cReference: true,
    get value() { return VIEWSCREEN2____header_global_ae26f68064da25fd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:314
export const VIEWSCREEN____header_global_f2f6147b6dc2030d = ((((((502) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d5de046e95c6b05ab286c374() {
  return __cxx_static_address_d5de046e95c6b05ab286c374.reference || (__cxx_static_address_d5de046e95c6b05ab286c374.reference = {
    __cReference: true,
    get value() { return VIEWSCREEN____header_global_f2f6147b6dc2030d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:315
export const GLASS____header_global_7bc5fffa04606e2c = ((((((503) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1750df00d05117f94250d35e() {
  return __cxx_static_address_1750df00d05117f94250d35e.reference || (__cxx_static_address_1750df00d05117f94250d35e.reference = {
    __cReference: true,
    get value() { return GLASS____header_global_7bc5fffa04606e2c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:316
export const GLASS2____header_global_2de4e86262063a1a = ((((((504) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a824b5614f83f040a0c56e3f() {
  return __cxx_static_address_a824b5614f83f040a0c56e3f.reference || (__cxx_static_address_a824b5614f83f040a0c56e3f.reference = {
    __cReference: true,
    get value() { return GLASS2____header_global_2de4e86262063a1a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:317
export const STAINGLASS1____header_global_3fae97974d0aa043 = ((((((510) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5180307ed75f5f9e4e78a652() {
  return __cxx_static_address_5180307ed75f5f9e4e78a652.reference || (__cxx_static_address_5180307ed75f5f9e4e78a652.reference = {
    __cReference: true,
    get value() { return STAINGLASS1____header_global_3fae97974d0aa043; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:318
export const MASKWALL5____header_global_6197e4f62de034ef = ((((((514) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8e8f4e2730e05538ca2150d8() {
  return __cxx_static_address_8e8f4e2730e05538ca2150d8.reference || (__cxx_static_address_8e8f4e2730e05538ca2150d8.reference = {
    __cReference: true,
    get value() { return MASKWALL5____header_global_6197e4f62de034ef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:319
export const SATELITE____header_global_20502f4d33773f9d = ((((((516) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0fb025a696e13f8f46faf8ed() {
  return __cxx_static_address_0fb025a696e13f8f46faf8ed.reference || (__cxx_static_address_0fb025a696e13f8f46faf8ed.reference = {
    __cReference: true,
    get value() { return SATELITE____header_global_20502f4d33773f9d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:320
export const FUELPOD____header_global_98a0411cda887c63 = ((((((517) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_943a0728c7557b3a7db2f528() {
  return __cxx_static_address_943a0728c7557b3a7db2f528.reference || (__cxx_static_address_943a0728c7557b3a7db2f528.reference = {
    __cReference: true,
    get value() { return FUELPOD____header_global_98a0411cda887c63; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:321
export const CRACK1____header_global_c5c016f465f6e7fe = ((((((546) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0673b24b47084fb880041348() {
  return __cxx_static_address_0673b24b47084fb880041348.reference || (__cxx_static_address_0673b24b47084fb880041348.reference = {
    __cReference: true,
    get value() { return CRACK1____header_global_c5c016f465f6e7fe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:322
export const CRACK2____header_global_e2a0c7362e838868 = ((((((547) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3ab7d1ffcb2032b4a3a31069() {
  return __cxx_static_address_3ab7d1ffcb2032b4a3a31069.reference || (__cxx_static_address_3ab7d1ffcb2032b4a3a31069.reference = {
    __cReference: true,
    get value() { return CRACK2____header_global_e2a0c7362e838868; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:323
export const CRACK3____header_global_22591677f81348e3 = ((((((548) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6c8b10e8aad12950d072001f() {
  return __cxx_static_address_6c8b10e8aad12950d072001f.reference || (__cxx_static_address_6c8b10e8aad12950d072001f.reference = {
    __cReference: true,
    get value() { return CRACK3____header_global_22591677f81348e3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:324
export const CRACK4____header_global_b5fa6efcf23a66d3 = ((((((549) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6a0b8d8b591f4f0bb6ed5701() {
  return __cxx_static_address_6a0b8d8b591f4f0bb6ed5701.reference || (__cxx_static_address_6a0b8d8b591f4f0bb6ed5701.reference = {
    __cReference: true,
    get value() { return CRACK4____header_global_b5fa6efcf23a66d3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:325
export const FOOTPRINTS____header_global_2117c339d33ff511 = ((((((550) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9a710678a14c63d1c3d03bfd() {
  return __cxx_static_address_9a710678a14c63d1c3d03bfd.reference || (__cxx_static_address_9a710678a14c63d1c3d03bfd.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS____header_global_2117c339d33ff511; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:326
export const DOMELITE____header_global_e0faf8375c266052 = ((((((551) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_270f095ae3e73d1197c157a0() {
  return __cxx_static_address_270f095ae3e73d1197c157a0.reference || (__cxx_static_address_270f095ae3e73d1197c157a0.reference = {
    __cReference: true,
    get value() { return DOMELITE____header_global_e0faf8375c266052; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:327
export const CAMERAPOLE____header_global_885bde77f39f7d86 = ((((((554) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_425ac3637839509e3fbbbd35() {
  return __cxx_static_address_425ac3637839509e3fbbbd35.reference || (__cxx_static_address_425ac3637839509e3fbbbd35.reference = {
    __cReference: true,
    get value() { return CAMERAPOLE____header_global_885bde77f39f7d86; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:328
export const CHAIR1____header_global_c60ae85e9a15a32a = ((((((556) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0fd2bffff256c6a2cb256706() {
  return __cxx_static_address_0fd2bffff256c6a2cb256706.reference || (__cxx_static_address_0fd2bffff256c6a2cb256706.reference = {
    __cReference: true,
    get value() { return CHAIR1____header_global_c60ae85e9a15a32a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:329
export const CHAIR2____header_global_eb1f15f01a9390c7 = ((((((557) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5ff8934f3c5bd63a2c5d3be6() {
  return __cxx_static_address_5ff8934f3c5bd63a2c5d3be6.reference || (__cxx_static_address_5ff8934f3c5bd63a2c5d3be6.reference = {
    __cReference: true,
    get value() { return CHAIR2____header_global_eb1f15f01a9390c7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:330
export const BROKENCHAIR____header_global_9bfb0b517ee23be4 = ((((((559) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ecea3c8e950987dd95835680() {
  return __cxx_static_address_ecea3c8e950987dd95835680.reference || (__cxx_static_address_ecea3c8e950987dd95835680.reference = {
    __cReference: true,
    get value() { return BROKENCHAIR____header_global_9bfb0b517ee23be4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:331
export const MIRROR____header_global_dc257f35f79cfd7a = ((((((560) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a4af6e1cfcafec01c8cd2578() {
  return __cxx_static_address_a4af6e1cfcafec01c8cd2578.reference || (__cxx_static_address_a4af6e1cfcafec01c8cd2578.reference = {
    __cReference: true,
    get value() { return MIRROR____header_global_dc257f35f79cfd7a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:332
export const WATERFOUNTAIN____header_global_f6c0749795167124 = ((((((563) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_67f15a47541263c7fea25ec4() {
  return __cxx_static_address_67f15a47541263c7fea25ec4.reference || (__cxx_static_address_67f15a47541263c7fea25ec4.reference = {
    __cReference: true,
    get value() { return WATERFOUNTAIN____header_global_f6c0749795167124; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:333
export const WATERFOUNTAINBROKE____header_global_9749417c4ae7da6a = ((((((567) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0c2bd8f47db709c431957516() {
  return __cxx_static_address_0c2bd8f47db709c431957516.reference || (__cxx_static_address_0c2bd8f47db709c431957516.reference = {
    __cReference: true,
    get value() { return WATERFOUNTAINBROKE____header_global_9749417c4ae7da6a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:334
export const FEMMAG1____header_global_c96a0949194eb06b = ((((((568) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_19edb87f2bf2e4e5eb749fa8() {
  return __cxx_static_address_19edb87f2bf2e4e5eb749fa8.reference || (__cxx_static_address_19edb87f2bf2e4e5eb749fa8.reference = {
    __cReference: true,
    get value() { return FEMMAG1____header_global_c96a0949194eb06b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:335
export const TOILET____header_global_93732a2429d002f6 = ((((((569) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3f936e2cabc2c72326d20ef8() {
  return __cxx_static_address_3f936e2cabc2c72326d20ef8.reference || (__cxx_static_address_3f936e2cabc2c72326d20ef8.reference = {
    __cReference: true,
    get value() { return TOILET____header_global_93732a2429d002f6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:336
export const STALL____header_global_72deb32c293d6d85 = ((((((571) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5b5282ad744521f09a9e581a() {
  return __cxx_static_address_5b5282ad744521f09a9e581a.reference || (__cxx_static_address_5b5282ad744521f09a9e581a.reference = {
    __cReference: true,
    get value() { return STALL____header_global_72deb32c293d6d85; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:337
export const STALLBROKE____header_global_aa2603395a7a7de4 = ((((((573) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_30c0c9ff98093197de02a07c() {
  return __cxx_static_address_30c0c9ff98093197de02a07c.reference || (__cxx_static_address_30c0c9ff98093197de02a07c.reference = {
    __cReference: true,
    get value() { return STALLBROKE____header_global_aa2603395a7a7de4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:338
export const FEMMAG2____header_global_55281b896e3a060f = ((((((577) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_984671d00ffb634559b14198() {
  return __cxx_static_address_984671d00ffb634559b14198.reference || (__cxx_static_address_984671d00ffb634559b14198.reference = {
    __cReference: true,
    get value() { return FEMMAG2____header_global_55281b896e3a060f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:339
export const REACTOR2____header_global_f1cdff7931341b65 = ((((((578) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7caf4d1bdeae08ae0e573b02() {
  return __cxx_static_address_7caf4d1bdeae08ae0e573b02.reference || (__cxx_static_address_7caf4d1bdeae08ae0e573b02.reference = {
    __cReference: true,
    get value() { return REACTOR2____header_global_f1cdff7931341b65; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:340
export const REACTOR2BURNT____header_global_5e4ad97702c30aa9 = ((((((579) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fbe4a16fbce3de51667aace2() {
  return __cxx_static_address_fbe4a16fbce3de51667aace2.reference || (__cxx_static_address_fbe4a16fbce3de51667aace2.reference = {
    __cReference: true,
    get value() { return REACTOR2BURNT____header_global_5e4ad97702c30aa9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:341
export const REACTOR2SPARK____header_global_610db4eddcef9c89 = ((((((580) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5887ab3f60124684f7a2b060() {
  return __cxx_static_address_5887ab3f60124684f7a2b060.reference || (__cxx_static_address_5887ab3f60124684f7a2b060.reference = {
    __cReference: true,
    get value() { return REACTOR2SPARK____header_global_610db4eddcef9c89; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:342
export const GRATE1____header_global_2b1543a5800c38db = ((((((595) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fe12fe6b8f9cfa1c435a1d63() {
  return __cxx_static_address_fe12fe6b8f9cfa1c435a1d63.reference || (__cxx_static_address_fe12fe6b8f9cfa1c435a1d63.reference = {
    __cReference: true,
    get value() { return GRATE1____header_global_2b1543a5800c38db; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:343
export const BGRATE1____header_global_8045b5f534c4b5cd = ((((((596) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ac768b63b0fb8e28c6c61787() {
  return __cxx_static_address_ac768b63b0fb8e28c6c61787.reference || (__cxx_static_address_ac768b63b0fb8e28c6c61787.reference = {
    __cReference: true,
    get value() { return BGRATE1____header_global_8045b5f534c4b5cd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:344
export const SOLARPANNEL____header_global_0c28dbd6d1ce96d9 = ((((((602) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c4572e0c8a8c66d43aab588d() {
  return __cxx_static_address_c4572e0c8a8c66d43aab588d.reference || (__cxx_static_address_c4572e0c8a8c66d43aab588d.reference = {
    __cReference: true,
    get value() { return SOLARPANNEL____header_global_0c28dbd6d1ce96d9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:345
export const NAKED1____header_global_d16110ea57b71b74 = ((((((603) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a2314c558080cc0dca833e66() {
  return __cxx_static_address_a2314c558080cc0dca833e66.reference || (__cxx_static_address_a2314c558080cc0dca833e66.reference = {
    __cReference: true,
    get value() { return NAKED1____header_global_d16110ea57b71b74; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:346
export const ANTENNA____header_global_3d54a6db1ec1ede6 = ((((((607) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_31db586ccee3e3826ccbdfd4() {
  return __cxx_static_address_31db586ccee3e3826ccbdfd4.reference || (__cxx_static_address_31db586ccee3e3826ccbdfd4.reference = {
    __cReference: true,
    get value() { return ANTENNA____header_global_3d54a6db1ec1ede6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:347
export const MASKWALL12____header_global_ab383f6b6699b2eb = ((((((609) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_73e30c3770f3606b44c22c1a() {
  return __cxx_static_address_73e30c3770f3606b44c22c1a.reference || (__cxx_static_address_73e30c3770f3606b44c22c1a.reference = {
    __cReference: true,
    get value() { return MASKWALL12____header_global_ab383f6b6699b2eb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:348
export const TOILETBROKE____header_global_538edd809220f725 = ((((((615) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_50955b371cadce7928ddff39() {
  return __cxx_static_address_50955b371cadce7928ddff39.reference || (__cxx_static_address_50955b371cadce7928ddff39.reference = {
    __cReference: true,
    get value() { return TOILETBROKE____header_global_538edd809220f725; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:349
export const PIPE2____header_global_d9c31be6b5f600cc = ((((((616) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_63482268aab45cafb4a22f38() {
  return __cxx_static_address_63482268aab45cafb4a22f38.reference || (__cxx_static_address_63482268aab45cafb4a22f38.reference = {
    __cReference: true,
    get value() { return PIPE2____header_global_d9c31be6b5f600cc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:350
export const PIPE1B____header_global_6ea50e8b01387525 = ((((((617) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ed452ab298973a58e4d3e9c2() {
  return __cxx_static_address_ed452ab298973a58e4d3e9c2.reference || (__cxx_static_address_ed452ab298973a58e4d3e9c2.reference = {
    __cReference: true,
    get value() { return PIPE1B____header_global_6ea50e8b01387525; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:351
export const PIPE3____header_global_32cb534a585d918a = ((((((618) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_59a230ad8d343aaff4aa0511() {
  return __cxx_static_address_59a230ad8d343aaff4aa0511.reference || (__cxx_static_address_59a230ad8d343aaff4aa0511.reference = {
    __cReference: true,
    get value() { return PIPE3____header_global_32cb534a585d918a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:352
export const PIPE1____header_global_29ee91e0a173ccb6 = ((((((619) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_369e39851a89adc2a0a012c6() {
  return __cxx_static_address_369e39851a89adc2a0a012c6.reference || (__cxx_static_address_369e39851a89adc2a0a012c6.reference = {
    __cReference: true,
    get value() { return PIPE1____header_global_29ee91e0a173ccb6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:353
export const CAMERA1____header_global_44c36dd39f480210 = ((((((621) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_af330cabbc63f179f55c8e63() {
  return __cxx_static_address_af330cabbc63f179f55c8e63.reference || (__cxx_static_address_af330cabbc63f179f55c8e63.reference = {
    __cReference: true,
    get value() { return CAMERA1____header_global_44c36dd39f480210; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:354
export const PIPE2B____header_global_0da66d5fb840b16e = ((((((633) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cdd66459b5ff4e0b3c945cb9() {
  return __cxx_static_address_cdd66459b5ff4e0b3c945cb9.reference || (__cxx_static_address_cdd66459b5ff4e0b3c945cb9.reference = {
    __cReference: true,
    get value() { return PIPE2B____header_global_0da66d5fb840b16e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:355
export const BOLT1____header_global_01cd40b47acafa91 = ((((((634) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5e840a1c87889106c6d81642() {
  return __cxx_static_address_5e840a1c87889106c6d81642.reference || (__cxx_static_address_5e840a1c87889106c6d81642.reference = {
    __cReference: true,
    get value() { return BOLT1____header_global_01cd40b47acafa91; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:356
export const W_NUMBERS____header_global_1433925104a59f57 = ((((((640) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2676e241509e04625bfe7d2c() {
  return __cxx_static_address_2676e241509e04625bfe7d2c.reference || (__cxx_static_address_2676e241509e04625bfe7d2c.reference = {
    __cReference: true,
    get value() { return W_NUMBERS____header_global_1433925104a59f57; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:357
export const WATERDRIP____header_global_c71fc70fbe2613fb = ((((((660) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bcd1c80da1d1f1c28c2b623d() {
  return __cxx_static_address_bcd1c80da1d1f1c28c2b623d.reference || (__cxx_static_address_bcd1c80da1d1f1c28c2b623d.reference = {
    __cReference: true,
    get value() { return WATERDRIP____header_global_c71fc70fbe2613fb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:358
export const WATERBUBBLE____header_global_651579de3914603b = ((((((661) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cb88da778c41f9032767972d() {
  return __cxx_static_address_cb88da778c41f9032767972d.reference || (__cxx_static_address_cb88da778c41f9032767972d.reference = {
    __cReference: true,
    get value() { return WATERBUBBLE____header_global_651579de3914603b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:359
export const WATERBUBBLEMAKER____header_global_9cc8b2a0a514261e = ((((((662) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3addc1955d2c082df50a5f57() {
  return __cxx_static_address_3addc1955d2c082df50a5f57.reference || (__cxx_static_address_3addc1955d2c082df50a5f57.reference = {
    __cReference: true,
    get value() { return WATERBUBBLEMAKER____header_global_9cc8b2a0a514261e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:360
export const W_FORCEFIELD____header_global_c5ccdbbf96fd8bb8 = ((((((663) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bc0b77251ea93f50f255e4b5() {
  return __cxx_static_address_bc0b77251ea93f50f255e4b5.reference || (__cxx_static_address_bc0b77251ea93f50f255e4b5.reference = {
    __cReference: true,
    get value() { return W_FORCEFIELD____header_global_c5ccdbbf96fd8bb8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:361
export const VACUUM____header_global_b054eac12142ae66 = ((((((669) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5cc6d71712a7f798974ad7fb() {
  return __cxx_static_address_5cc6d71712a7f798974ad7fb.reference || (__cxx_static_address_5cc6d71712a7f798974ad7fb.reference = {
    __cReference: true,
    get value() { return VACUUM____header_global_b054eac12142ae66; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:362
export const FOOTPRINTS2____header_global_6bb9d3a749d72fcf = ((((((672) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7ec628ce8e4ab303a356a8d4() {
  return __cxx_static_address_7ec628ce8e4ab303a356a8d4.reference || (__cxx_static_address_7ec628ce8e4ab303a356a8d4.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS2____header_global_6bb9d3a749d72fcf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:363
export const FOOTPRINTS3____header_global_92a45eb38fa595f7 = ((((((673) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e418ae154c5cd4c02a04862c() {
  return __cxx_static_address_e418ae154c5cd4c02a04862c.reference || (__cxx_static_address_e418ae154c5cd4c02a04862c.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS3____header_global_92a45eb38fa595f7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:364
export const FOOTPRINTS4____header_global_0078d9736b90ae37 = ((((((674) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7bf420f557333cde8fd98847() {
  return __cxx_static_address_7bf420f557333cde8fd98847.reference || (__cxx_static_address_7bf420f557333cde8fd98847.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS4____header_global_0078d9736b90ae37; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:365
export const EGG____header_global_42de06e70740eda5 = ((((((675) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ede8536fc3282e6836a6df14() {
  return __cxx_static_address_ede8536fc3282e6836a6df14.reference || (__cxx_static_address_ede8536fc3282e6836a6df14.reference = {
    __cReference: true,
    get value() { return EGG____header_global_42de06e70740eda5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:366
export const SCALE____header_global_05546d44af10bee2 = ((((((678) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_76667d0d364febab6d0f530a() {
  return __cxx_static_address_76667d0d364febab6d0f530a.reference || (__cxx_static_address_76667d0d364febab6d0f530a.reference = {
    __cReference: true,
    get value() { return SCALE____header_global_05546d44af10bee2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:367
export const CHAIR3____header_global_66f82751c5be2a05 = ((((((680) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_21b64b6ddcd4555435624c83() {
  return __cxx_static_address_21b64b6ddcd4555435624c83.reference || (__cxx_static_address_21b64b6ddcd4555435624c83.reference = {
    __cReference: true,
    get value() { return CHAIR3____header_global_66f82751c5be2a05; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:368
export const CAMERALIGHT____header_global_9fdd9473dea66f0a = ((((((685) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_38be2c0ea5e2e75f16aa72c5() {
  return __cxx_static_address_38be2c0ea5e2e75f16aa72c5.reference || (__cxx_static_address_38be2c0ea5e2e75f16aa72c5.reference = {
    __cReference: true,
    get value() { return CAMERALIGHT____header_global_9fdd9473dea66f0a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:369
export const MOVIECAMERA____header_global_129f6c1e0d6b01ad = ((((((686) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e8f17cc18c7e1b6c4239ace5() {
  return __cxx_static_address_e8f17cc18c7e1b6c4239ace5.reference || (__cxx_static_address_e8f17cc18c7e1b6c4239ace5.reference = {
    __cReference: true,
    get value() { return MOVIECAMERA____header_global_129f6c1e0d6b01ad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:370
export const IVUNIT____header_global_7e87a6449e06a907 = ((((((689) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a973ad2a20992f643d6c5a34() {
  return __cxx_static_address_a973ad2a20992f643d6c5a34.reference || (__cxx_static_address_a973ad2a20992f643d6c5a34.reference = {
    __cReference: true,
    get value() { return IVUNIT____header_global_7e87a6449e06a907; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:371
export const POT1____header_global_cb20c4e3393efb11 = ((((((694) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f765422ce29f238a7fcf6d4f() {
  return __cxx_static_address_f765422ce29f238a7fcf6d4f.reference || (__cxx_static_address_f765422ce29f238a7fcf6d4f.reference = {
    __cReference: true,
    get value() { return POT1____header_global_cb20c4e3393efb11; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:372
export const POT2____header_global_2f3b511a38fb4d92 = ((((((695) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_97883a74f19080ddeecdfe65() {
  return __cxx_static_address_97883a74f19080ddeecdfe65.reference || (__cxx_static_address_97883a74f19080ddeecdfe65.reference = {
    __cReference: true,
    get value() { return POT2____header_global_2f3b511a38fb4d92; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:373
export const POT3____header_global_29d8dde286f71402 = ((((((697) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_155397ab1b2913dfd7d15a99() {
  return __cxx_static_address_155397ab1b2913dfd7d15a99.reference || (__cxx_static_address_155397ab1b2913dfd7d15a99.reference = {
    __cReference: true,
    get value() { return POT3____header_global_29d8dde286f71402; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:374
export const PIPE3B____header_global_4e226ac185b6b52d = ((((((700) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5d80628b3edd12ff2a6e5aca() {
  return __cxx_static_address_5d80628b3edd12ff2a6e5aca.reference || (__cxx_static_address_5d80628b3edd12ff2a6e5aca.reference = {
    __cReference: true,
    get value() { return PIPE3B____header_global_4e226ac185b6b52d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:375
export const WALLLIGHT3____header_global_f86de87efbd3f365 = ((((((701) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c04184e7f487355dfed36d11() {
  return __cxx_static_address_c04184e7f487355dfed36d11.reference || (__cxx_static_address_c04184e7f487355dfed36d11.reference = {
    __cReference: true,
    get value() { return WALLLIGHT3____header_global_f86de87efbd3f365; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:376
export const WALLLIGHTBUST3____header_global_982db66359f0e1e3 = ((((((702) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c9a3cfb822825a87b1110673() {
  return __cxx_static_address_c9a3cfb822825a87b1110673.reference || (__cxx_static_address_c9a3cfb822825a87b1110673.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST3____header_global_982db66359f0e1e3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:377
export const WALLLIGHT1____header_global_8040ccf205de375c = ((((((703) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c01b1921e87778e43aadda75() {
  return __cxx_static_address_c01b1921e87778e43aadda75.reference || (__cxx_static_address_c01b1921e87778e43aadda75.reference = {
    __cReference: true,
    get value() { return WALLLIGHT1____header_global_8040ccf205de375c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:378
export const WALLLIGHTBUST1____header_global_7bef44117d8145df = ((((((704) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c4a3636c132b6fe404d36a9b() {
  return __cxx_static_address_c4a3636c132b6fe404d36a9b.reference || (__cxx_static_address_c4a3636c132b6fe404d36a9b.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST1____header_global_7bef44117d8145df; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:379
export const WALLLIGHT2____header_global_d9f8f7ecb61bb9e2 = ((((((705) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7fd626ece62fb4ad4d20cd66() {
  return __cxx_static_address_7fd626ece62fb4ad4d20cd66.reference || (__cxx_static_address_7fd626ece62fb4ad4d20cd66.reference = {
    __cReference: true,
    get value() { return WALLLIGHT2____header_global_d9f8f7ecb61bb9e2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:380
export const WALLLIGHTBUST2____header_global_e87d895e68eaf204 = ((((((706) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1477693682499bdc962545bc() {
  return __cxx_static_address_1477693682499bdc962545bc.reference || (__cxx_static_address_1477693682499bdc962545bc.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST2____header_global_e87d895e68eaf204; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:381
export const LIGHTSWITCH2____header_global_61d7662199932920 = ((((((712) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_01126e00a67bcf98b3e9da88() {
  return __cxx_static_address_01126e00a67bcf98b3e9da88.reference || (__cxx_static_address_01126e00a67bcf98b3e9da88.reference = {
    __cReference: true,
    get value() { return LIGHTSWITCH2____header_global_61d7662199932920; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:382
export const WAITTOBESEATED____header_global_0ee37a95c295d67d = ((((((716) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3cd684b5582a2c4116b32312() {
  return __cxx_static_address_3cd684b5582a2c4116b32312.reference || (__cxx_static_address_3cd684b5582a2c4116b32312.reference = {
    __cReference: true,
    get value() { return WAITTOBESEATED____header_global_0ee37a95c295d67d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:383
export const DOORTILE14____header_global_a3f5bec7c3f49b0b = ((((((717) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_26e90e4c6a6e5be2c9bd8120() {
  return __cxx_static_address_26e90e4c6a6e5be2c9bd8120.reference || (__cxx_static_address_26e90e4c6a6e5be2c9bd8120.reference = {
    __cReference: true,
    get value() { return DOORTILE14____header_global_a3f5bec7c3f49b0b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:384
export const STATUE____header_global_023473baa8f2ac8f = ((((((753) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_326e779b8a34a8e10b887681() {
  return __cxx_static_address_326e779b8a34a8e10b887681.reference || (__cxx_static_address_326e779b8a34a8e10b887681.reference = {
    __cReference: true,
    get value() { return STATUE____header_global_023473baa8f2ac8f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:385
export const MIKE____header_global_7eb423bb077fb61b = ((((((762) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e95c8c6f10f658614b3b4acb() {
  return __cxx_static_address_e95c8c6f10f658614b3b4acb.reference || (__cxx_static_address_e95c8c6f10f658614b3b4acb.reference = {
    __cReference: true,
    get value() { return MIKE____header_global_7eb423bb077fb61b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:386
export const VASE____header_global_85b97b9b007ac6ba = ((((((765) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5a33d2f96003373268e092cd() {
  return __cxx_static_address_5a33d2f96003373268e092cd.reference || (__cxx_static_address_5a33d2f96003373268e092cd.reference = {
    __cReference: true,
    get value() { return VASE____header_global_85b97b9b007ac6ba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:387
export const SUSHIPLATE1____header_global_7e1a4e832051f62b = ((((((768) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4f28461afc1e128140a3f6a9() {
  return __cxx_static_address_4f28461afc1e128140a3f6a9.reference || (__cxx_static_address_4f28461afc1e128140a3f6a9.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE1____header_global_7e1a4e832051f62b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:388
export const SUSHIPLATE2____header_global_91aa0854ed58b46a = ((((((769) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_67d24e3ad05fcff699b81253() {
  return __cxx_static_address_67d24e3ad05fcff699b81253.reference || (__cxx_static_address_67d24e3ad05fcff699b81253.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE2____header_global_91aa0854ed58b46a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:389
export const SUSHIPLATE3____header_global_a93916175cdbf7b2 = ((((((774) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f5d0a230e81ab9beb83a4ded() {
  return __cxx_static_address_f5d0a230e81ab9beb83a4ded.reference || (__cxx_static_address_f5d0a230e81ab9beb83a4ded.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE3____header_global_a93916175cdbf7b2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:390
export const SUSHIPLATE4____header_global_a5ed550681c0d83f = ((((((779) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f36fc400d237f93c4745898c() {
  return __cxx_static_address_f36fc400d237f93c4745898c.reference || (__cxx_static_address_f36fc400d237f93c4745898c.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE4____header_global_a5ed550681c0d83f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:391
export const DOORTILE16____header_global_ba7a6f18eb6bde8e = ((((((781) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c613061580a58e95d3134c3d() {
  return __cxx_static_address_c613061580a58e95d3134c3d.reference || (__cxx_static_address_c613061580a58e95d3134c3d.reference = {
    __cReference: true,
    get value() { return DOORTILE16____header_global_ba7a6f18eb6bde8e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:392
export const SUSHIPLATE5____header_global_003b23f9ef1f2e71 = ((((((792) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7050c9be2f0758d3fd2e0afa() {
  return __cxx_static_address_7050c9be2f0758d3fd2e0afa.reference || (__cxx_static_address_7050c9be2f0758d3fd2e0afa.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE5____header_global_003b23f9ef1f2e71; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:393
export const OJ____header_global_73beb0aa2f95f993 = ((((((806) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d42c9d885c24165838897f33() {
  return __cxx_static_address_d42c9d885c24165838897f33.reference || (__cxx_static_address_d42c9d885c24165838897f33.reference = {
    __cReference: true,
    get value() { return OJ____header_global_73beb0aa2f95f993; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:394
export const MASKWALL13____header_global_7e6035e94a2fc48e = ((((((830) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_464f17d9a28350749562c2fb() {
  return __cxx_static_address_464f17d9a28350749562c2fb.reference || (__cxx_static_address_464f17d9a28350749562c2fb.reference = {
    __cReference: true,
    get value() { return MASKWALL13____header_global_7e6035e94a2fc48e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:395
export const HURTRAIL____header_global_2af95cb6e37251f6 = ((((((859) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9178c071303cb36aee640e8c() {
  return __cxx_static_address_9178c071303cb36aee640e8c.reference || (__cxx_static_address_9178c071303cb36aee640e8c.reference = {
    __cReference: true,
    get value() { return HURTRAIL____header_global_2af95cb6e37251f6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:396
export const POWERSWITCH1____header_global_c1f649f01a81c777 = ((((((860) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_add981ac0e6c0ae9dd9bc9f6() {
  return __cxx_static_address_add981ac0e6c0ae9dd9bc9f6.reference || (__cxx_static_address_add981ac0e6c0ae9dd9bc9f6.reference = {
    __cReference: true,
    get value() { return POWERSWITCH1____header_global_c1f649f01a81c777; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:397
export const LOCKSWITCH1____header_global_f325cb4dbe8ef721 = ((((((862) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_78a6c2c831fb500043dc7036() {
  return __cxx_static_address_78a6c2c831fb500043dc7036.reference || (__cxx_static_address_78a6c2c831fb500043dc7036.reference = {
    __cReference: true,
    get value() { return LOCKSWITCH1____header_global_f325cb4dbe8ef721; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:398
export const POWERSWITCH2____header_global_4da7a999e059e3aa = ((((((864) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fc4553ce766806a7889c0cb2() {
  return __cxx_static_address_fc4553ce766806a7889c0cb2.reference || (__cxx_static_address_fc4553ce766806a7889c0cb2.reference = {
    __cReference: true,
    get value() { return POWERSWITCH2____header_global_4da7a999e059e3aa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:399
export const ATM____header_global_72b247a4fae72917 = ((((((867) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7faadd96838598c08235a99d() {
  return __cxx_static_address_7faadd96838598c08235a99d.reference || (__cxx_static_address_7faadd96838598c08235a99d.reference = {
    __cReference: true,
    get value() { return ATM____header_global_72b247a4fae72917; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:400
export const STATUEFLASH____header_global_0b4e51961b1ecbb6 = ((((((869) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4c1cc921676c1200e9b94100() {
  return __cxx_static_address_4c1cc921676c1200e9b94100.reference || (__cxx_static_address_4c1cc921676c1200e9b94100.reference = {
    __cReference: true,
    get value() { return STATUEFLASH____header_global_0b4e51961b1ecbb6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:401
export const ATMBROKE____header_global_8ab882983e65d0f4 = ((((((888) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5d0c96bbf79429b54dc987b6() {
  return __cxx_static_address_5d0c96bbf79429b54dc987b6.reference || (__cxx_static_address_5d0c96bbf79429b54dc987b6.reference = {
    __cReference: true,
    get value() { return ATMBROKE____header_global_8ab882983e65d0f4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:402
export const STRIPEBALL____header_global_b5b28b82782d4c81 = ((((((901) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fbcfebffe6052a5e4ec31d56() {
  return __cxx_static_address_fbcfebffe6052a5e4ec31d56.reference || (__cxx_static_address_fbcfebffe6052a5e4ec31d56.reference = {
    __cReference: true,
    get value() { return STRIPEBALL____header_global_b5b28b82782d4c81; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:403
export const QUEBALL____header_global_5446f961886ceab7 = ((((((902) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3a00ae27e22fa628112d79ff() {
  return __cxx_static_address_3a00ae27e22fa628112d79ff.reference || (__cxx_static_address_3a00ae27e22fa628112d79ff.reference = {
    __cReference: true,
    get value() { return QUEBALL____header_global_5446f961886ceab7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:404
export const POCKET____header_global_1b9ef54c96d7d6cc = ((((((903) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1647797ea98570b773166a61() {
  return __cxx_static_address_1647797ea98570b773166a61.reference || (__cxx_static_address_1647797ea98570b773166a61.reference = {
    __cReference: true,
    get value() { return POCKET____header_global_1b9ef54c96d7d6cc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:405
export const WOODENHORSE____header_global_a2f1bff9327b5513 = ((((((904) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0f5a17d49e67fcc8022f8d95() {
  return __cxx_static_address_0f5a17d49e67fcc8022f8d95.reference || (__cxx_static_address_0f5a17d49e67fcc8022f8d95.reference = {
    __cReference: true,
    get value() { return WOODENHORSE____header_global_a2f1bff9327b5513; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:406
export const TREE1____header_global_8131b9c30ad10b10 = ((((((908) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_817260b78ea9f15f01d78c87() {
  return __cxx_static_address_817260b78ea9f15f01d78c87.reference || (__cxx_static_address_817260b78ea9f15f01d78c87.reference = {
    __cReference: true,
    get value() { return TREE1____header_global_8131b9c30ad10b10; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:407
export const TREE2____header_global_dbc1324a69fa2f67 = ((((((910) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ba7a5fa6beba715c4f574865() {
  return __cxx_static_address_ba7a5fa6beba715c4f574865.reference || (__cxx_static_address_ba7a5fa6beba715c4f574865.reference = {
    __cReference: true,
    get value() { return TREE2____header_global_dbc1324a69fa2f67; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:408
export const CACTUS____header_global_7c1b5c3d39abffd6 = ((((((911) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2ee3aabdc84dea73ea19aeb2() {
  return __cxx_static_address_2ee3aabdc84dea73ea19aeb2.reference || (__cxx_static_address_2ee3aabdc84dea73ea19aeb2.reference = {
    __cReference: true,
    get value() { return CACTUS____header_global_7c1b5c3d39abffd6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:409
export const MASKWALL2____header_global_fafb052093773c41 = ((((((913) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dca1f85d401595a00c00926b() {
  return __cxx_static_address_dca1f85d401595a00c00926b.reference || (__cxx_static_address_dca1f85d401595a00c00926b.reference = {
    __cReference: true,
    get value() { return MASKWALL2____header_global_fafb052093773c41; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:410
export const MASKWALL3____header_global_f023bdf3679359fe = ((((((914) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f6634572a173a1de461b6beb() {
  return __cxx_static_address_f6634572a173a1de461b6beb.reference || (__cxx_static_address_f6634572a173a1de461b6beb.reference = {
    __cReference: true,
    get value() { return MASKWALL3____header_global_f023bdf3679359fe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:411
export const MASKWALL4____header_global_c87c87490cfe8f58 = ((((((915) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f93d74d91d48acccfe94fb31() {
  return __cxx_static_address_f93d74d91d48acccfe94fb31.reference || (__cxx_static_address_f93d74d91d48acccfe94fb31.reference = {
    __cReference: true,
    get value() { return MASKWALL4____header_global_c87c87490cfe8f58; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:412
export const FIREEXT____header_global_281b86f8a3ce1846 = ((((((916) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_acc70bca647298efc0ea6407() {
  return __cxx_static_address_acc70bca647298efc0ea6407.reference || (__cxx_static_address_acc70bca647298efc0ea6407.reference = {
    __cReference: true,
    get value() { return FIREEXT____header_global_281b86f8a3ce1846; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:413
export const TOILETWATER____header_global_0ce11287bf8a4a82 = ((((((921) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5a373463082a9ec2ebd7cd14() {
  return __cxx_static_address_5a373463082a9ec2ebd7cd14.reference || (__cxx_static_address_5a373463082a9ec2ebd7cd14.reference = {
    __cReference: true,
    get value() { return TOILETWATER____header_global_0ce11287bf8a4a82; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:414
export const NEON1____header_global_61de97f3a3f4c86f = ((((((925) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fac849972664014edb80a974() {
  return __cxx_static_address_fac849972664014edb80a974.reference || (__cxx_static_address_fac849972664014edb80a974.reference = {
    __cReference: true,
    get value() { return NEON1____header_global_61de97f3a3f4c86f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:415
export const NEON2____header_global_9e8169821ecc66c4 = ((((((926) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1ef306714574588ff8caf04b() {
  return __cxx_static_address_1ef306714574588ff8caf04b.reference || (__cxx_static_address_1ef306714574588ff8caf04b.reference = {
    __cReference: true,
    get value() { return NEON2____header_global_9e8169821ecc66c4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:416
export const CACTUSBROKE____header_global_b34c6a1d53d0dd70 = ((((((939) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_047ee74a15b85112a26e4b22() {
  return __cxx_static_address_047ee74a15b85112a26e4b22.reference || (__cxx_static_address_047ee74a15b85112a26e4b22.reference = {
    __cReference: true,
    get value() { return CACTUSBROKE____header_global_b34c6a1d53d0dd70; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:417
export const BOUNCEMINE____header_global_4159fcf275d12650 = ((((((940) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f1ed1232c8353bde8a8e80cb() {
  return __cxx_static_address_f1ed1232c8353bde8a8e80cb.reference || (__cxx_static_address_f1ed1232c8353bde8a8e80cb.reference = {
    __cReference: true,
    get value() { return BOUNCEMINE____header_global_4159fcf275d12650; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:418
export const BROKEFIREHYDRENT____header_global_dfcaa02e8147ec5a = ((((((950) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5504c06cb5e834c6a31742a4() {
  return __cxx_static_address_5504c06cb5e834c6a31742a4.reference || (__cxx_static_address_5504c06cb5e834c6a31742a4.reference = {
    __cReference: true,
    get value() { return BROKEFIREHYDRENT____header_global_dfcaa02e8147ec5a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:419
export const BOX____header_global_0dc885aa90d2b1fe = ((((((951) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_880756915eb51b0a1292a8be() {
  return __cxx_static_address_880756915eb51b0a1292a8be.reference || (__cxx_static_address_880756915eb51b0a1292a8be.reference = {
    __cReference: true,
    get value() { return BOX____header_global_0dc885aa90d2b1fe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:420
export const BULLETHOLE____header_global_835cb944c0e10f1c = ((((((952) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_27421fc14c9e520317dc7a63() {
  return __cxx_static_address_27421fc14c9e520317dc7a63.reference || (__cxx_static_address_27421fc14c9e520317dc7a63.reference = {
    __cReference: true,
    get value() { return BULLETHOLE____header_global_835cb944c0e10f1c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:421
export const BOTTLE1____header_global_8831ee04b7eb59f1 = ((((((954) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6e363d1bb0fe18c248f9ccfa() {
  return __cxx_static_address_6e363d1bb0fe18c248f9ccfa.reference || (__cxx_static_address_6e363d1bb0fe18c248f9ccfa.reference = {
    __cReference: true,
    get value() { return BOTTLE1____header_global_8831ee04b7eb59f1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:422
export const BOTTLE2____header_global_1d873f94263c8a23 = ((((((955) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d21d164ebc416b9b4b6a6e96() {
  return __cxx_static_address_d21d164ebc416b9b4b6a6e96.reference || (__cxx_static_address_d21d164ebc416b9b4b6a6e96.reference = {
    __cReference: true,
    get value() { return BOTTLE2____header_global_1d873f94263c8a23; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:423
export const BOTTLE3____header_global_f0ffa139c6b47180 = ((((((956) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_baa7de40a76d8f0efc3c8102() {
  return __cxx_static_address_baa7de40a76d8f0efc3c8102.reference || (__cxx_static_address_baa7de40a76d8f0efc3c8102.reference = {
    __cReference: true,
    get value() { return BOTTLE3____header_global_f0ffa139c6b47180; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:424
export const BOTTLE4____header_global_f6b6dcc5f0113149 = ((((((957) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6b926234b2430a42010a86ce() {
  return __cxx_static_address_6b926234b2430a42010a86ce.reference || (__cxx_static_address_6b926234b2430a42010a86ce.reference = {
    __cReference: true,
    get value() { return BOTTLE4____header_global_f6b6dcc5f0113149; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:425
export const FEMPIC5____header_global_9d1683280a4763b3 = ((((((963) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_caaa66156f2e4d16ac5c2b52() {
  return __cxx_static_address_caaa66156f2e4d16ac5c2b52.reference || (__cxx_static_address_caaa66156f2e4d16ac5c2b52.reference = {
    __cReference: true,
    get value() { return FEMPIC5____header_global_9d1683280a4763b3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:426
export const FEMPIC6____header_global_e72e4e4b1acb7527 = ((((((964) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_01967d05079e6ebcbf2fabed() {
  return __cxx_static_address_01967d05079e6ebcbf2fabed.reference || (__cxx_static_address_01967d05079e6ebcbf2fabed.reference = {
    __cReference: true,
    get value() { return FEMPIC6____header_global_e72e4e4b1acb7527; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:427
export const FEMPIC7____header_global_e2fd1877a8c50f09 = ((((((965) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_254dc8de2d8cf02dbdd8802e() {
  return __cxx_static_address_254dc8de2d8cf02dbdd8802e.reference || (__cxx_static_address_254dc8de2d8cf02dbdd8802e.reference = {
    __cReference: true,
    get value() { return FEMPIC7____header_global_e2fd1877a8c50f09; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:428
export const HYDROPLANT____header_global_d17b61b7c0eb12de = ((((((969) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d06f4b7160de2e530a2eefeb() {
  return __cxx_static_address_d06f4b7160de2e530a2eefeb.reference || (__cxx_static_address_d06f4b7160de2e530a2eefeb.reference = {
    __cReference: true,
    get value() { return HYDROPLANT____header_global_d17b61b7c0eb12de; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:429
export const OCEANSPRITE1____header_global_03c2dbed4b2cefdb = ((((((971) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d5aa77c986ef7bc608e67404() {
  return __cxx_static_address_d5aa77c986ef7bc608e67404.reference || (__cxx_static_address_d5aa77c986ef7bc608e67404.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE1____header_global_03c2dbed4b2cefdb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:430
export const OCEANSPRITE2____header_global_ad5ab55ed895e35d = ((((((972) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3a0d13c50ae48b395fa744e8() {
  return __cxx_static_address_3a0d13c50ae48b395fa744e8.reference || (__cxx_static_address_3a0d13c50ae48b395fa744e8.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE2____header_global_ad5ab55ed895e35d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:431
export const OCEANSPRITE3____header_global_feb09b17b52e175a = ((((((973) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f9c4f7e0c65aba2dc3d25444() {
  return __cxx_static_address_f9c4f7e0c65aba2dc3d25444.reference || (__cxx_static_address_f9c4f7e0c65aba2dc3d25444.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE3____header_global_feb09b17b52e175a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:432
export const OCEANSPRITE4____header_global_fc1b54703d26517f = ((((((974) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c0f027738e8c44dadf1b5381() {
  return __cxx_static_address_c0f027738e8c44dadf1b5381.reference || (__cxx_static_address_c0f027738e8c44dadf1b5381.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE4____header_global_fc1b54703d26517f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:433
export const OCEANSPRITE5____header_global_2c48ab623bc251a8 = ((((((975) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4be23d68228338d6240df34a() {
  return __cxx_static_address_4be23d68228338d6240df34a.reference || (__cxx_static_address_4be23d68228338d6240df34a.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE5____header_global_2c48ab623bc251a8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:434
export const GENERICPOLE____header_global_531f644ff587dc53 = ((((((977) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4c75a3b72a5b798a1feea7d9() {
  return __cxx_static_address_4c75a3b72a5b798a1feea7d9.reference || (__cxx_static_address_4c75a3b72a5b798a1feea7d9.reference = {
    __cReference: true,
    get value() { return GENERICPOLE____header_global_531f644ff587dc53; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:435
export const CONE____header_global_9661bab837076fba = ((((((978) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8b39f2ee3f037ce2494003cf() {
  return __cxx_static_address_8b39f2ee3f037ce2494003cf.reference || (__cxx_static_address_8b39f2ee3f037ce2494003cf.reference = {
    __cReference: true,
    get value() { return CONE____header_global_9661bab837076fba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:436
export const HANGLIGHT____header_global_127172032e2fa488 = ((((((979) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aa02a4cbe44f90c8b93ed7e7() {
  return __cxx_static_address_aa02a4cbe44f90c8b93ed7e7.reference || (__cxx_static_address_aa02a4cbe44f90c8b93ed7e7.reference = {
    __cReference: true,
    get value() { return HANGLIGHT____header_global_127172032e2fa488; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:437
export const HYDRENT____header_global_bfdb3b27f22e23b3 = ((((((981) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_712864b7fa2dbafa8a7de20a() {
  return __cxx_static_address_712864b7fa2dbafa8a7de20a.reference || (__cxx_static_address_712864b7fa2dbafa8a7de20a.reference = {
    __cReference: true,
    get value() { return HYDRENT____header_global_bfdb3b27f22e23b3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:438
export const MASKWALL14____header_global_66268a338372ee8a = ((((((988) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_edf384e1bd8c9357d8bc63d8() {
  return __cxx_static_address_edf384e1bd8c9357d8bc63d8.reference || (__cxx_static_address_edf384e1bd8c9357d8bc63d8.reference = {
    __cReference: true,
    get value() { return MASKWALL14____header_global_66268a338372ee8a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:439
export const TIRE____header_global_b66cce76370bb4d9 = ((((((990) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d4d23d377214cb8109a8a221() {
  return __cxx_static_address_d4d23d377214cb8109a8a221.reference || (__cxx_static_address_d4d23d377214cb8109a8a221.reference = {
    __cReference: true,
    get value() { return TIRE____header_global_b66cce76370bb4d9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:440
export const PIPE5____header_global_3dcf2aa2ae8d2aa6 = ((((((994) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e355d4274aa115a58d8d6b42() {
  return __cxx_static_address_e355d4274aa115a58d8d6b42.reference || (__cxx_static_address_e355d4274aa115a58d8d6b42.reference = {
    __cReference: true,
    get value() { return PIPE5____header_global_3dcf2aa2ae8d2aa6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:441
export const PIPE6____header_global_b0a3616b2145459a = ((((((995) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_46d8450dc43021e319735e08() {
  return __cxx_static_address_46d8450dc43021e319735e08.reference || (__cxx_static_address_46d8450dc43021e319735e08.reference = {
    __cReference: true,
    get value() { return PIPE6____header_global_b0a3616b2145459a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:442
export const PIPE4____header_global_317fa932b2283faa = ((((((996) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8c5469ba281935651e5306b1() {
  return __cxx_static_address_8c5469ba281935651e5306b1.reference || (__cxx_static_address_8c5469ba281935651e5306b1.reference = {
    __cReference: true,
    get value() { return PIPE4____header_global_317fa932b2283faa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:443
export const PIPE4B____header_global_1be85892af8e0897 = ((((((997) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_30962b5cb0d4d9d8fe0bf4e8() {
  return __cxx_static_address_30962b5cb0d4d9d8fe0bf4e8.reference || (__cxx_static_address_30962b5cb0d4d9d8fe0bf4e8.reference = {
    __cReference: true,
    get value() { return PIPE4B____header_global_1be85892af8e0897; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:444
export const BROKEHYDROPLANT____header_global_0a2552014a357308 = ((((((1003) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5a57146bfa9891c32d2936d8() {
  return __cxx_static_address_5a57146bfa9891c32d2936d8.reference || (__cxx_static_address_5a57146bfa9891c32d2936d8.reference = {
    __cReference: true,
    get value() { return BROKEHYDROPLANT____header_global_0a2552014a357308; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:445
export const PIPE5B____header_global_29503bbd4145449e = ((((((1005) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_452d0710f671ec17045f708f() {
  return __cxx_static_address_452d0710f671ec17045f708f.reference || (__cxx_static_address_452d0710f671ec17045f708f.reference = {
    __cReference: true,
    get value() { return PIPE5B____header_global_29503bbd4145449e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:446
export const NEON3____header_global_17ec5c82b0b78eae = ((((((1007) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c1433a5de16284892ee9de1a() {
  return __cxx_static_address_c1433a5de16284892ee9de1a.reference || (__cxx_static_address_c1433a5de16284892ee9de1a.reference = {
    __cReference: true,
    get value() { return NEON3____header_global_17ec5c82b0b78eae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:447
export const NEON4____header_global_425fcdd6ea1ca72c = ((((((1008) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a786a912f36a8fa1291ab876() {
  return __cxx_static_address_a786a912f36a8fa1291ab876.reference || (__cxx_static_address_a786a912f36a8fa1291ab876.reference = {
    __cReference: true,
    get value() { return NEON4____header_global_425fcdd6ea1ca72c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:448
export const NEON5____header_global_4a32a06674aef405 = ((((((1009) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e31237327f3dc92c25041c31() {
  return __cxx_static_address_e31237327f3dc92c25041c31.reference || (__cxx_static_address_e31237327f3dc92c25041c31.reference = {
    __cReference: true,
    get value() { return NEON5____header_global_4a32a06674aef405; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:449
export const BOTTLE5____header_global_8789fe990a27f40c = ((((((1012) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fb4136b913bf71171f2af8c9() {
  return __cxx_static_address_fb4136b913bf71171f2af8c9.reference || (__cxx_static_address_fb4136b913bf71171f2af8c9.reference = {
    __cReference: true,
    get value() { return BOTTLE5____header_global_8789fe990a27f40c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:450
export const BOTTLE6____header_global_e97076f0943af8bf = ((((((1013) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6a20b44fe41cc816b73fc59c() {
  return __cxx_static_address_6a20b44fe41cc816b73fc59c.reference || (__cxx_static_address_6a20b44fe41cc816b73fc59c.reference = {
    __cReference: true,
    get value() { return BOTTLE6____header_global_e97076f0943af8bf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:451
export const BOTTLE8____header_global_16570b348ab8e59a = ((((((1014) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f3061ecbd94dad6f097e035a() {
  return __cxx_static_address_f3061ecbd94dad6f097e035a.reference || (__cxx_static_address_f3061ecbd94dad6f097e035a.reference = {
    __cReference: true,
    get value() { return BOTTLE8____header_global_16570b348ab8e59a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:452
export const SPOTLITE____header_global_cfd31b652198fa26 = ((((((1020) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_24f51593823e21a8f9da3402() {
  return __cxx_static_address_24f51593823e21a8f9da3402.reference || (__cxx_static_address_24f51593823e21a8f9da3402.reference = {
    __cReference: true,
    get value() { return SPOTLITE____header_global_cfd31b652198fa26; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:453
export const MASKWALL15____header_global_47c92f51c84e79b0 = ((((((1024) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d771b8c11f936f47a2827755() {
  return __cxx_static_address_d771b8c11f936f47a2827755.reference || (__cxx_static_address_d771b8c11f936f47a2827755.reference = {
    __cReference: true,
    get value() { return MASKWALL15____header_global_47c92f51c84e79b0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:454
export const BOTTLE7____header_global_ca45739b380b7fa1 = ((((((1025) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_93924060aeca82d8d31a183a() {
  return __cxx_static_address_93924060aeca82d8d31a183a.reference || (__cxx_static_address_93924060aeca82d8d31a183a.reference = {
    __cReference: true,
    get value() { return BOTTLE7____header_global_ca45739b380b7fa1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:455
export const HORSEONSIDE____header_global_0a73638a4286b09e = ((((((1026) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0157d9fdd60ab2b0737c1da6() {
  return __cxx_static_address_0157d9fdd60ab2b0737c1da6.reference || (__cxx_static_address_0157d9fdd60ab2b0737c1da6.reference = {
    __cReference: true,
    get value() { return HORSEONSIDE____header_global_0a73638a4286b09e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:456
export const GLASSPIECES____header_global_37bc9419d16d9aec = ((((((1031) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e7cc8b87b39cc3becedbb79b() {
  return __cxx_static_address_e7cc8b87b39cc3becedbb79b.reference || (__cxx_static_address_e7cc8b87b39cc3becedbb79b.reference = {
    __cReference: true,
    get value() { return GLASSPIECES____header_global_37bc9419d16d9aec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:457
export const NEON6____header_global_201be3de152e8719 = ((((((1046) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d4bfa4e1afc6a9931323ca8e() {
  return __cxx_static_address_d4bfa4e1afc6a9931323ca8e.reference || (__cxx_static_address_d4bfa4e1afc6a9931323ca8e.reference = {
    __cReference: true,
    get value() { return NEON6____header_global_201be3de152e8719; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:458
export const MASKWALL6____header_global_9f775dc8e59d2b77 = ((((((1059) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_299eff8250035c1c7e83f1f6() {
  return __cxx_static_address_299eff8250035c1c7e83f1f6.reference || (__cxx_static_address_299eff8250035c1c7e83f1f6.reference = {
    __cReference: true,
    get value() { return MASKWALL6____header_global_9f775dc8e59d2b77; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:459
export const RUBBERCAN____header_global_635610f7b2e7849b = ((((((1062) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3722270429fd15bcbf6ca8bf() {
  return __cxx_static_address_3722270429fd15bcbf6ca8bf.reference || (__cxx_static_address_3722270429fd15bcbf6ca8bf.reference = {
    __cReference: true,
    get value() { return RUBBERCAN____header_global_635610f7b2e7849b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:460
export const PLUG____header_global_dfa95388af6f5e2f = ((((((1069) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6b32957bff223b82065607cd() {
  return __cxx_static_address_6b32957bff223b82065607cd.reference || (__cxx_static_address_6b32957bff223b82065607cd.reference = {
    __cReference: true,
    get value() { return PLUG____header_global_dfa95388af6f5e2f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:461
export const OOZFILTER____header_global_341f11bb384136fc = ((((((1079) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e69805cf9c3d9be9adda998f() {
  return __cxx_static_address_e69805cf9c3d9be9adda998f.reference || (__cxx_static_address_e69805cf9c3d9be9adda998f.reference = {
    __cReference: true,
    get value() { return OOZFILTER____header_global_341f11bb384136fc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:462
export const FLOORPLASMA____header_global_6818d5eb6fe82c1f = ((((((1082) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b1de2a30e666c534b5618de6() {
  return __cxx_static_address_b1de2a30e666c534b5618de6.reference || (__cxx_static_address_b1de2a30e666c534b5618de6.reference = {
    __cReference: true,
    get value() { return FLOORPLASMA____header_global_6818d5eb6fe82c1f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:463
export const REACTOR____header_global_a1387b474be29c25 = ((((((1088) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a2e50e3568f2108923a664ea() {
  return __cxx_static_address_a2e50e3568f2108923a664ea.reference || (__cxx_static_address_a2e50e3568f2108923a664ea.reference = {
    __cReference: true,
    get value() { return REACTOR____header_global_a1387b474be29c25; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:464
export const REACTORSPARK____header_global_9532165cb73a07ba = ((((((1092) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c42be870ddbadfb1237b183b() {
  return __cxx_static_address_c42be870ddbadfb1237b183b.reference || (__cxx_static_address_c42be870ddbadfb1237b183b.reference = {
    __cReference: true,
    get value() { return REACTORSPARK____header_global_9532165cb73a07ba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:465
export const REACTORBURNT____header_global_6d66da8ede69c593 = ((((((1096) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f9fd7af3f2ea07b62007c695() {
  return __cxx_static_address_f9fd7af3f2ea07b62007c695.reference || (__cxx_static_address_f9fd7af3f2ea07b62007c695.reference = {
    __cReference: true,
    get value() { return REACTORBURNT____header_global_6d66da8ede69c593; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:466
export const DOORTILE15____header_global_ef61dc376b43aec8 = ((((((1102) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9ce12218a31160bf3d2090be() {
  return __cxx_static_address_9ce12218a31160bf3d2090be.reference || (__cxx_static_address_9ce12218a31160bf3d2090be.reference = {
    __cReference: true,
    get value() { return DOORTILE15____header_global_ef61dc376b43aec8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:467
export const HANDSWITCH____header_global_461c4a2452eb04ec = ((((((1111) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_73d20793c06beca32c8e08b4() {
  return __cxx_static_address_73d20793c06beca32c8e08b4.reference || (__cxx_static_address_73d20793c06beca32c8e08b4.reference = {
    __cReference: true,
    get value() { return HANDSWITCH____header_global_461c4a2452eb04ec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:468
export const CIRCLEPANNEL____header_global_9bac993fef213d06 = ((((((1113) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2d30c32660c3b56d61eee37b() {
  return __cxx_static_address_2d30c32660c3b56d61eee37b.reference || (__cxx_static_address_2d30c32660c3b56d61eee37b.reference = {
    __cReference: true,
    get value() { return CIRCLEPANNEL____header_global_9bac993fef213d06; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:469
export const CIRCLEPANNELBROKE____header_global_429fe61e2cbe3e72 = ((((((1114) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f701803247092a82762e702c() {
  return __cxx_static_address_f701803247092a82762e702c.reference || (__cxx_static_address_f701803247092a82762e702c.reference = {
    __cReference: true,
    get value() { return CIRCLEPANNELBROKE____header_global_429fe61e2cbe3e72; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:470
export const PULLSWITCH____header_global_ba23f009ea52317a = ((((((1122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_00d76c170e60e8afa04f5974() {
  return __cxx_static_address_00d76c170e60e8afa04f5974.reference || (__cxx_static_address_00d76c170e60e8afa04f5974.reference = {
    __cReference: true,
    get value() { return PULLSWITCH____header_global_ba23f009ea52317a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:471
export const MASKWALL8____header_global_e95c9a21d16b4c23 = ((((((1124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b5c6773c7a2fcdb7852f71f6() {
  return __cxx_static_address_b5c6773c7a2fcdb7852f71f6.reference || (__cxx_static_address_b5c6773c7a2fcdb7852f71f6.reference = {
    __cReference: true,
    get value() { return MASKWALL8____header_global_e95c9a21d16b4c23; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:472
export const BIGHOLE____header_global_3ca3332425f2e76f = ((((((1141) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c279868bbb5d3b3b603520b0() {
  return __cxx_static_address_c279868bbb5d3b3b603520b0.reference || (__cxx_static_address_c279868bbb5d3b3b603520b0.reference = {
    __cReference: true,
    get value() { return BIGHOLE____header_global_3ca3332425f2e76f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:473
export const ALIENSWITCH____header_global_99c3c659ef0fd3a8 = ((((((1142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e69f518b100fccf30f8c1e1a() {
  return __cxx_static_address_e69f518b100fccf30f8c1e1a.reference || (__cxx_static_address_e69f518b100fccf30f8c1e1a.reference = {
    __cReference: true,
    get value() { return ALIENSWITCH____header_global_99c3c659ef0fd3a8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:474
export const DOORTILE21____header_global_8f0615678c71c40e = ((((((1144) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8c5f06be35383fc47c4c8657() {
  return __cxx_static_address_8c5f06be35383fc47c4c8657.reference || (__cxx_static_address_8c5f06be35383fc47c4c8657.reference = {
    __cReference: true,
    get value() { return DOORTILE21____header_global_8f0615678c71c40e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:475
export const HANDPRINTSWITCH____header_global_97070d4491f6d83d = ((((((1155) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_de60e7dccc82509b83c8d89e() {
  return __cxx_static_address_de60e7dccc82509b83c8d89e.reference || (__cxx_static_address_de60e7dccc82509b83c8d89e.reference = {
    __cReference: true,
    get value() { return HANDPRINTSWITCH____header_global_97070d4491f6d83d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:476
export const BOTTLE10____header_global_f5d6b56bdcd11680 = ((((((1157) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_253669f5e5841e3aaddb4855() {
  return __cxx_static_address_253669f5e5841e3aaddb4855.reference || (__cxx_static_address_253669f5e5841e3aaddb4855.reference = {
    __cReference: true,
    get value() { return BOTTLE10____header_global_f5d6b56bdcd11680; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:477
export const BOTTLE11____header_global_de842cdac35d8562 = ((((((1158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_470848dffb9b46572e7557fa() {
  return __cxx_static_address_470848dffb9b46572e7557fa.reference || (__cxx_static_address_470848dffb9b46572e7557fa.reference = {
    __cReference: true,
    get value() { return BOTTLE11____header_global_de842cdac35d8562; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:478
export const BOTTLE12____header_global_f92f42ffdd108a35 = ((((((1159) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_34374c0041241ae90e23d26d() {
  return __cxx_static_address_34374c0041241ae90e23d26d.reference || (__cxx_static_address_34374c0041241ae90e23d26d.reference = {
    __cReference: true,
    get value() { return BOTTLE12____header_global_f92f42ffdd108a35; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:479
export const BOTTLE13____header_global_df77001231917a8e = ((((((1160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_34115db8910a0453227ea494() {
  return __cxx_static_address_34115db8910a0453227ea494.reference || (__cxx_static_address_34115db8910a0453227ea494.reference = {
    __cReference: true,
    get value() { return BOTTLE13____header_global_df77001231917a8e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:480
export const BOTTLE14____header_global_58b38d70c3252afa = ((((((1161) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a9eb8d0c57a34feec2196f70() {
  return __cxx_static_address_a9eb8d0c57a34feec2196f70.reference || (__cxx_static_address_a9eb8d0c57a34feec2196f70.reference = {
    __cReference: true,
    get value() { return BOTTLE14____header_global_58b38d70c3252afa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:481
export const BOTTLE15____header_global_d66c0aa918266d2a = ((((((1162) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ef5002673495c4eb386ed04f() {
  return __cxx_static_address_ef5002673495c4eb386ed04f.reference || (__cxx_static_address_ef5002673495c4eb386ed04f.reference = {
    __cReference: true,
    get value() { return BOTTLE15____header_global_d66c0aa918266d2a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:482
export const BOTTLE16____header_global_29ea64b3571d1f6e = ((((((1163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_68140f929c559a321c5729be() {
  return __cxx_static_address_68140f929c559a321c5729be.reference || (__cxx_static_address_68140f929c559a321c5729be.reference = {
    __cReference: true,
    get value() { return BOTTLE16____header_global_29ea64b3571d1f6e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:483
export const BOTTLE17____header_global_c141c9b1f76ef353 = ((((((1164) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_522d66e826ee05874cd35b0f() {
  return __cxx_static_address_522d66e826ee05874cd35b0f.reference || (__cxx_static_address_522d66e826ee05874cd35b0f.reference = {
    __cReference: true,
    get value() { return BOTTLE17____header_global_c141c9b1f76ef353; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:484
export const BOTTLE18____header_global_5c2ad9e7b6cda4ef = ((((((1165) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_121ddfd0a4064af837f64a25() {
  return __cxx_static_address_121ddfd0a4064af837f64a25.reference || (__cxx_static_address_121ddfd0a4064af837f64a25.reference = {
    __cReference: true,
    get value() { return BOTTLE18____header_global_5c2ad9e7b6cda4ef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:485
export const BOTTLE19____header_global_3ef6a418c6c5f8ac = ((((((1166) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d1785c0bf6eb85218a17148e() {
  return __cxx_static_address_d1785c0bf6eb85218a17148e.reference || (__cxx_static_address_d1785c0bf6eb85218a17148e.reference = {
    __cReference: true,
    get value() { return BOTTLE19____header_global_3ef6a418c6c5f8ac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:486
export const DOORTILE17____header_global_5c58e09fb09f4d28 = ((((((1169) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_95d8033a168bc05cb484d4b7() {
  return __cxx_static_address_95d8033a168bc05cb484d4b7.reference || (__cxx_static_address_95d8033a168bc05cb484d4b7.reference = {
    __cReference: true,
    get value() { return DOORTILE17____header_global_5c58e09fb09f4d28; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:487
export const MASKWALL7____header_global_e55f07b413958598 = ((((((1174) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1f751e523dc5988dc0511ae7() {
  return __cxx_static_address_1f751e523dc5988dc0511ae7.reference || (__cxx_static_address_1f751e523dc5988dc0511ae7.reference = {
    __cReference: true,
    get value() { return MASKWALL7____header_global_e55f07b413958598; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:488
export const DOORTILE11____header_global_ee7ba4b8b2d585bb = ((((((1178) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5c969e53901c58f363557d4f() {
  return __cxx_static_address_5c969e53901c58f363557d4f.reference || (__cxx_static_address_5c969e53901c58f363557d4f.reference = {
    __cReference: true,
    get value() { return DOORTILE11____header_global_ee7ba4b8b2d585bb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:489
export const DOORTILE12____header_global_51372811e8e5a9b9 = ((((((1179) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f0a2d97bc2adf46bc3c7f14a() {
  return __cxx_static_address_f0a2d97bc2adf46bc3c7f14a.reference || (__cxx_static_address_f0a2d97bc2adf46bc3c7f14a.reference = {
    __cReference: true,
    get value() { return DOORTILE12____header_global_51372811e8e5a9b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:490
export const VENDMACHINE____header_global_010b0dee659bb301 = ((((((1212) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b9dc2f83e672359154fdb794() {
  return __cxx_static_address_b9dc2f83e672359154fdb794.reference || (__cxx_static_address_b9dc2f83e672359154fdb794.reference = {
    __cReference: true,
    get value() { return VENDMACHINE____header_global_010b0dee659bb301; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:491
export const COLAMACHINE____header_global_6241438520d54c4f = ((((((1215) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_96ff2affcdbeabb8e83db801() {
  return __cxx_static_address_96ff2affcdbeabb8e83db801.reference || (__cxx_static_address_96ff2affcdbeabb8e83db801.reference = {
    __cReference: true,
    get value() { return COLAMACHINE____header_global_6241438520d54c4f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:492
export const CRANEPOLE____header_global_85fa7a90e94a4632 = ((((((1221) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ec8218426fb31c0526274d6a() {
  return __cxx_static_address_ec8218426fb31c0526274d6a.reference || (__cxx_static_address_ec8218426fb31c0526274d6a.reference = {
    __cReference: true,
    get value() { return CRANEPOLE____header_global_85fa7a90e94a4632; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:493
export const CRANE____header_global_972ee36deee86057 = ((((((1222) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7454647847aa0c3d15108c5b() {
  return __cxx_static_address_7454647847aa0c3d15108c5b.reference || (__cxx_static_address_7454647847aa0c3d15108c5b.reference = {
    __cReference: true,
    get value() { return CRANE____header_global_972ee36deee86057; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:494
export const BARBROKE____header_global_e985ed6ff120c22e = ((((((1225) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_13219a3545d88840bd14e969() {
  return __cxx_static_address_13219a3545d88840bd14e969.reference || (__cxx_static_address_13219a3545d88840bd14e969.reference = {
    __cReference: true,
    get value() { return BARBROKE____header_global_e985ed6ff120c22e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:495
export const BLOODPOOL____header_global_0f31d26eb6360a9d = ((((((1226) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f2af7c5ac80192b131f143c5() {
  return __cxx_static_address_f2af7c5ac80192b131f143c5.reference || (__cxx_static_address_f2af7c5ac80192b131f143c5.reference = {
    __cReference: true,
    get value() { return BLOODPOOL____header_global_0f31d26eb6360a9d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:496
export const NUKEBARREL____header_global_e585c239fa3fb7fa = ((((((1227) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9678768c0fd0c5ca04f77ea2() {
  return __cxx_static_address_9678768c0fd0c5ca04f77ea2.reference || (__cxx_static_address_9678768c0fd0c5ca04f77ea2.reference = {
    __cReference: true,
    get value() { return NUKEBARREL____header_global_e585c239fa3fb7fa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:497
export const NUKEBARRELDENTED____header_global_2195721206dd9786 = ((((((1228) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5b111d344ba3da7c915d9698() {
  return __cxx_static_address_5b111d344ba3da7c915d9698.reference || (__cxx_static_address_5b111d344ba3da7c915d9698.reference = {
    __cReference: true,
    get value() { return NUKEBARRELDENTED____header_global_2195721206dd9786; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:498
export const NUKEBARRELLEAKED____header_global_99614b5117120a04 = ((((((1229) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_05d87af4bf1ee81f1a24c522() {
  return __cxx_static_address_05d87af4bf1ee81f1a24c522.reference || (__cxx_static_address_05d87af4bf1ee81f1a24c522.reference = {
    __cReference: true,
    get value() { return NUKEBARRELLEAKED____header_global_99614b5117120a04; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:499
export const CANWITHSOMETHING____header_global_ecc1b09b63727094 = ((((((1232) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d882f2795b843add808b9940() {
  return __cxx_static_address_d882f2795b843add808b9940.reference || (__cxx_static_address_d882f2795b843add808b9940.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING____header_global_ecc1b09b63727094; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:500
export const MONEY____header_global_7d6cd5182ce4585c = ((((((1233) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_504e7db1beb591bfca98b1d7() {
  return __cxx_static_address_504e7db1beb591bfca98b1d7.reference || (__cxx_static_address_504e7db1beb591bfca98b1d7.reference = {
    __cReference: true,
    get value() { return MONEY____header_global_7d6cd5182ce4585c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:501
export const BANNER____header_global_0283eb1ab2934c95 = ((((((1236) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8339e29a16698197c83c082b() {
  return __cxx_static_address_8339e29a16698197c83c082b.reference || (__cxx_static_address_8339e29a16698197c83c082b.reference = {
    __cReference: true,
    get value() { return BANNER____header_global_0283eb1ab2934c95; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:502
export const EXPLODINGBARREL____header_global_8f2a38f5e7bb0907 = ((((((1238) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_38b33570b723c34b4c384ce6() {
  return __cxx_static_address_38b33570b723c34b4c384ce6.reference || (__cxx_static_address_38b33570b723c34b4c384ce6.reference = {
    __cReference: true,
    get value() { return EXPLODINGBARREL____header_global_8f2a38f5e7bb0907; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:503
export const EXPLODINGBARREL2____header_global_5d7c0214e69a701c = ((((((1239) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8681677aaeddbd49173a4059() {
  return __cxx_static_address_8681677aaeddbd49173a4059.reference || (__cxx_static_address_8681677aaeddbd49173a4059.reference = {
    __cReference: true,
    get value() { return EXPLODINGBARREL2____header_global_5d7c0214e69a701c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:504
export const FIREBARREL____header_global_b21d39d452c40c96 = ((((((1240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d0f40aabac2ab7212338c4b8() {
  return __cxx_static_address_d0f40aabac2ab7212338c4b8.reference || (__cxx_static_address_d0f40aabac2ab7212338c4b8.reference = {
    __cReference: true,
    get value() { return FIREBARREL____header_global_b21d39d452c40c96; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:505
export const SEENINE____header_global_d2f6479f31e971aa = ((((((1247) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bf905cd3ac4278ee910e1f1b() {
  return __cxx_static_address_bf905cd3ac4278ee910e1f1b.reference || (__cxx_static_address_bf905cd3ac4278ee910e1f1b.reference = {
    __cReference: true,
    get value() { return SEENINE____header_global_d2f6479f31e971aa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:506
export const SEENINEDEAD____header_global_380d350e9c87965e = ((((((1248) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a6fd49f7728301b344d1bcee() {
  return __cxx_static_address_a6fd49f7728301b344d1bcee.reference || (__cxx_static_address_a6fd49f7728301b344d1bcee.reference = {
    __cReference: true,
    get value() { return SEENINEDEAD____header_global_380d350e9c87965e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:507
export const STEAM____header_global_077237510f7c93a4 = ((((((1250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_77a97c43a97cbc532d29de56() {
  return __cxx_static_address_77a97c43a97cbc532d29de56.reference || (__cxx_static_address_77a97c43a97cbc532d29de56.reference = {
    __cReference: true,
    get value() { return STEAM____header_global_077237510f7c93a4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:508
export const CEILINGSTEAM____header_global_17a51dd970443bf6 = ((((((1255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ccc561c1c9789107650f76ee() {
  return __cxx_static_address_ccc561c1c9789107650f76ee.reference || (__cxx_static_address_ccc561c1c9789107650f76ee.reference = {
    __cReference: true,
    get value() { return CEILINGSTEAM____header_global_17a51dd970443bf6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:509
export const PIPE6B____header_global_0b37c5ebc3d2bf74 = ((((((1260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_45b879c5b1bcd15071014ad0() {
  return __cxx_static_address_45b879c5b1bcd15071014ad0.reference || (__cxx_static_address_45b879c5b1bcd15071014ad0.reference = {
    __cReference: true,
    get value() { return PIPE6B____header_global_0b37c5ebc3d2bf74; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:510
export const TRANSPORTERBEAM____header_global_91f7a04c07296dff = ((((((1261) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_893f840516c5a3b3a1fb351b() {
  return __cxx_static_address_893f840516c5a3b3a1fb351b.reference || (__cxx_static_address_893f840516c5a3b3a1fb351b.reference = {
    __cReference: true,
    get value() { return TRANSPORTERBEAM____header_global_91f7a04c07296dff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:511
export const RAT____header_global_e41c06751aaace9b = ((((((1267) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_04554c58d051988331c772a7() {
  return __cxx_static_address_04554c58d051988331c772a7.reference || (__cxx_static_address_04554c58d051988331c772a7.reference = {
    __cReference: true,
    get value() { return RAT____header_global_e41c06751aaace9b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:512
export const TRASH____header_global_efda6bbe1eb7a26c = ((((((1272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_804c4032f4b46a972ac9c94d() {
  return __cxx_static_address_804c4032f4b46a972ac9c94d.reference || (__cxx_static_address_804c4032f4b46a972ac9c94d.reference = {
    __cReference: true,
    get value() { return TRASH____header_global_efda6bbe1eb7a26c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:513
export const FEMPIC1____header_global_a37afa20511f6e47 = ((((((1280) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_682917bee6a3722e2031f822() {
  return __cxx_static_address_682917bee6a3722e2031f822.reference || (__cxx_static_address_682917bee6a3722e2031f822.reference = {
    __cReference: true,
    get value() { return FEMPIC1____header_global_a37afa20511f6e47; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:514
export const FEMPIC2____header_global_c67c089180d7e30a = ((((((1289) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_de7bd902529ba03ae98f9aec() {
  return __cxx_static_address_de7bd902529ba03ae98f9aec.reference || (__cxx_static_address_de7bd902529ba03ae98f9aec.reference = {
    __cReference: true,
    get value() { return FEMPIC2____header_global_c67c089180d7e30a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:515
export const BLANKSCREEN____header_global_889f9dff2d75f67f = ((((((1293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_78b9020ec423d19639509d1a() {
  return __cxx_static_address_78b9020ec423d19639509d1a.reference || (__cxx_static_address_78b9020ec423d19639509d1a.reference = {
    __cReference: true,
    get value() { return BLANKSCREEN____header_global_889f9dff2d75f67f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:516
export const PODFEM1____header_global_8e751f6f300db36b = ((((((1294) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3475e61dd47d71273b4bdb04() {
  return __cxx_static_address_3475e61dd47d71273b4bdb04.reference || (__cxx_static_address_3475e61dd47d71273b4bdb04.reference = {
    __cReference: true,
    get value() { return PODFEM1____header_global_8e751f6f300db36b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:517
export const FEMPIC3____header_global_a55e744e3a449f5b = ((((((1298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_690494ee3013b3efe8c4474e() {
  return __cxx_static_address_690494ee3013b3efe8c4474e.reference || (__cxx_static_address_690494ee3013b3efe8c4474e.reference = {
    __cReference: true,
    get value() { return FEMPIC3____header_global_a55e744e3a449f5b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:518
export const FEMPIC4____header_global_783a02488d987598 = ((((((1306) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_89d952fd74262cbbb651dd5a() {
  return __cxx_static_address_89d952fd74262cbbb651dd5a.reference || (__cxx_static_address_89d952fd74262cbbb651dd5a.reference = {
    __cReference: true,
    get value() { return FEMPIC4____header_global_783a02488d987598; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:519
export const FEM1____header_global_5a528765ac409a90 = ((((((1312) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b505c5249179e5c9fe5e953a() {
  return __cxx_static_address_b505c5249179e5c9fe5e953a.reference || (__cxx_static_address_b505c5249179e5c9fe5e953a.reference = {
    __cReference: true,
    get value() { return FEM1____header_global_5a528765ac409a90; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:520
export const FEM2____header_global_eb4d39761280ecca = ((((((1317) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2f4c58ed3252697849c67ff0() {
  return __cxx_static_address_2f4c58ed3252697849c67ff0.reference || (__cxx_static_address_2f4c58ed3252697849c67ff0.reference = {
    __cReference: true,
    get value() { return FEM2____header_global_eb4d39761280ecca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:521
export const FEM3____header_global_f18ae9529cb19c95 = ((((((1321) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0f49bad4699f452fd767ec7c() {
  return __cxx_static_address_0f49bad4699f452fd767ec7c.reference || (__cxx_static_address_0f49bad4699f452fd767ec7c.reference = {
    __cReference: true,
    get value() { return FEM3____header_global_f18ae9529cb19c95; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:522
export const FEM5____header_global_dc439257e6690f8d = ((((((1323) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0ce83e85cbea78fd89089b5a() {
  return __cxx_static_address_0ce83e85cbea78fd89089b5a.reference || (__cxx_static_address_0ce83e85cbea78fd89089b5a.reference = {
    __cReference: true,
    get value() { return FEM5____header_global_dc439257e6690f8d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:523
export const BLOODYPOLE____header_global_84908843e60e8513 = ((((((1324) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_29be949dce678342f1dcfe9a() {
  return __cxx_static_address_29be949dce678342f1dcfe9a.reference || (__cxx_static_address_29be949dce678342f1dcfe9a.reference = {
    __cReference: true,
    get value() { return BLOODYPOLE____header_global_84908843e60e8513; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:524
export const FEM4____header_global_d58594d97c8af130 = ((((((1325) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_48bcde1a3d9fdc05426c6713() {
  return __cxx_static_address_48bcde1a3d9fdc05426c6713.reference || (__cxx_static_address_48bcde1a3d9fdc05426c6713.reference = {
    __cReference: true,
    get value() { return FEM4____header_global_d58594d97c8af130; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:525
export const FEM6____header_global_466ad0354972c67e = ((((((1334) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b5a3934d40aa78597218dfb7() {
  return __cxx_static_address_b5a3934d40aa78597218dfb7.reference || (__cxx_static_address_b5a3934d40aa78597218dfb7.reference = {
    __cReference: true,
    get value() { return FEM6____header_global_466ad0354972c67e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:526
export const FEM6PAD____header_global_81651559eef22b81 = ((((((1335) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bfabd4fd81b4ce2c5b8f157d() {
  return __cxx_static_address_bfabd4fd81b4ce2c5b8f157d.reference || (__cxx_static_address_bfabd4fd81b4ce2c5b8f157d.reference = {
    __cReference: true,
    get value() { return FEM6PAD____header_global_81651559eef22b81; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:527
export const FEM8____header_global_d9c25d19025f3e0e = ((((((1336) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7004919295253a903a1e082a() {
  return __cxx_static_address_7004919295253a903a1e082a.reference || (__cxx_static_address_7004919295253a903a1e082a.reference = {
    __cReference: true,
    get value() { return FEM8____header_global_d9c25d19025f3e0e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:528
export const HELECOPT____header_global_c910a40b173f5de8 = ((((((1346) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ba8387930abc46728a6542bd() {
  return __cxx_static_address_ba8387930abc46728a6542bd.reference || (__cxx_static_address_ba8387930abc46728a6542bd.reference = {
    __cReference: true,
    get value() { return HELECOPT____header_global_c910a40b173f5de8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:529
export const FETUSJIB____header_global_3b6c8f8c6814f919 = ((((((1347) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7d2dde1296f25a3d8a91c1e5() {
  return __cxx_static_address_7d2dde1296f25a3d8a91c1e5.reference || (__cxx_static_address_7d2dde1296f25a3d8a91c1e5.reference = {
    __cReference: true,
    get value() { return FETUSJIB____header_global_3b6c8f8c6814f919; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:530
export const HOLODUKE____header_global_ec1ec42a01a11b9f = ((((((1348) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f165250bbc0ca78d8285d126() {
  return __cxx_static_address_f165250bbc0ca78d8285d126.reference || (__cxx_static_address_f165250bbc0ca78d8285d126.reference = {
    __cReference: true,
    get value() { return HOLODUKE____header_global_ec1ec42a01a11b9f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:531
export const SPACEMARINE____header_global_24922c42b0ebd936 = ((((((1353) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4ff2e63c5738e8e5dee8dd21() {
  return __cxx_static_address_4ff2e63c5738e8e5dee8dd21.reference || (__cxx_static_address_4ff2e63c5738e8e5dee8dd21.reference = {
    __cReference: true,
    get value() { return SPACEMARINE____header_global_24922c42b0ebd936; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:532
export const INDY____header_global_b07a905554d6c7d3 = ((((((1355) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b4e0ae0dc31ef39a42f4ab0c() {
  return __cxx_static_address_b4e0ae0dc31ef39a42f4ab0c.reference || (__cxx_static_address_b4e0ae0dc31ef39a42f4ab0c.reference = {
    __cReference: true,
    get value() { return INDY____header_global_b07a905554d6c7d3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:533
export const FETUS____header_global_2fcfc4b649abc300 = ((((((1358) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_de4acc4d6fec547eb7189bcb() {
  return __cxx_static_address_de4acc4d6fec547eb7189bcb.reference || (__cxx_static_address_de4acc4d6fec547eb7189bcb.reference = {
    __cReference: true,
    get value() { return FETUS____header_global_2fcfc4b649abc300; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:534
export const FETUSBROKE____header_global_9ceb5f46c3acd230 = ((((((1359) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_996126b161c9347599a82622() {
  return __cxx_static_address_996126b161c9347599a82622.reference || (__cxx_static_address_996126b161c9347599a82622.reference = {
    __cReference: true,
    get value() { return FETUSBROKE____header_global_9ceb5f46c3acd230; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:535
export const MONK____header_global_1f50001a1c89b837 = ((((((1352) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f93b47a8e2f569739229e174() {
  return __cxx_static_address_f93b47a8e2f569739229e174.reference || (__cxx_static_address_f93b47a8e2f569739229e174.reference = {
    __cReference: true,
    get value() { return MONK____header_global_1f50001a1c89b837; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:536
export const LUKE____header_global_4fa1e40fc4ca3c71 = ((((((1354) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c39af0aa04b3c8c64b99455c() {
  return __cxx_static_address_c39af0aa04b3c8c64b99455c.reference || (__cxx_static_address_c39af0aa04b3c8c64b99455c.reference = {
    __cReference: true,
    get value() { return LUKE____header_global_4fa1e40fc4ca3c71; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:537
export const COOLEXPLOSION1____header_global_80c27ccc7dca7a76 = ((((((1360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_047c5df8a9e4af89cf0f2507() {
  return __cxx_static_address_047c5df8a9e4af89cf0f2507.reference || (__cxx_static_address_047c5df8a9e4af89cf0f2507.reference = {
    __cReference: true,
    get value() { return COOLEXPLOSION1____header_global_80c27ccc7dca7a76; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:538
export const WATERSPLASH2____header_global_aeb6af5725c8dc88 = ((((((1380) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_785a80b950c6232b91de5147() {
  return __cxx_static_address_785a80b950c6232b91de5147.reference || (__cxx_static_address_785a80b950c6232b91de5147.reference = {
    __cReference: true,
    get value() { return WATERSPLASH2____header_global_aeb6af5725c8dc88; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:539
export const FIREVASE____header_global_75c88bae69c26e21 = ((((((1390) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_245a4c50adbd3c41624cf952() {
  return __cxx_static_address_245a4c50adbd3c41624cf952.reference || (__cxx_static_address_245a4c50adbd3c41624cf952.reference = {
    __cReference: true,
    get value() { return FIREVASE____header_global_75c88bae69c26e21; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:540
export const FEM7____header_global_09fd548ec4fa7d72 = ((((((1395) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_63b370e2ed4195bc3d0836e7() {
  return __cxx_static_address_63b370e2ed4195bc3d0836e7.reference || (__cxx_static_address_63b370e2ed4195bc3d0836e7.reference = {
    __cReference: true,
    get value() { return FEM7____header_global_09fd548ec4fa7d72; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:541
export const APLAYERTOP____header_global_95cf3a2e7c173739 = ((((((1400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7b3648501ed45287d69ecbcb() {
  return __cxx_static_address_7b3648501ed45287d69ecbcb.reference || (__cxx_static_address_7b3648501ed45287d69ecbcb.reference = {
    __cReference: true,
    get value() { return APLAYERTOP____header_global_95cf3a2e7c173739; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:542
export const APLAYER____header_global_2e20c558d79641e2 = ((((((1405) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5d97b409b5dab3b6f1c1a476() {
  return __cxx_static_address_5d97b409b5dab3b6f1c1a476.reference || (__cxx_static_address_5d97b409b5dab3b6f1c1a476.reference = {
    __cReference: true,
    get value() { return APLAYER____header_global_2e20c558d79641e2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:543
export const PLAYERONWATER____header_global_665f0a63152f82be = ((((((1420) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2bd450ae62dab4faccb2fc31() {
  return __cxx_static_address_2bd450ae62dab4faccb2fc31.reference || (__cxx_static_address_2bd450ae62dab4faccb2fc31.reference = {
    __cReference: true,
    get value() { return PLAYERONWATER____header_global_665f0a63152f82be; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:544
export const DUKELYINGDEAD____header_global_683f07c0974857db = ((((((1518) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_02f650b2740cf2c740ec52fc() {
  return __cxx_static_address_02f650b2740cf2c740ec52fc.reference || (__cxx_static_address_02f650b2740cf2c740ec52fc.reference = {
    __cReference: true,
    get value() { return DUKELYINGDEAD____header_global_683f07c0974857db; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:545
export const DUKETORSO____header_global_189a2925a86e51b4 = ((((((1520) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b869d462732a2e59a8e38eca() {
  return __cxx_static_address_b869d462732a2e59a8e38eca.reference || (__cxx_static_address_b869d462732a2e59a8e38eca.reference = {
    __cReference: true,
    get value() { return DUKETORSO____header_global_189a2925a86e51b4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:546
export const DUKEGUN____header_global_19ef8db8d5b2055c = ((((((1528) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_30350a2c1d1e8c75d16a125b() {
  return __cxx_static_address_30350a2c1d1e8c75d16a125b.reference || (__cxx_static_address_30350a2c1d1e8c75d16a125b.reference = {
    __cReference: true,
    get value() { return DUKEGUN____header_global_19ef8db8d5b2055c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:547
export const DUKELEG____header_global_fcbc73488cfbefa7 = ((((((1536) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_90efe66567342514269ca50a() {
  return __cxx_static_address_90efe66567342514269ca50a.reference || (__cxx_static_address_90efe66567342514269ca50a.reference = {
    __cReference: true,
    get value() { return DUKELEG____header_global_fcbc73488cfbefa7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:548
export const SHARK____header_global_cd5243ea3b4f5004 = ((((((1550) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_67502154c27be646f1d3444b() {
  return __cxx_static_address_67502154c27be646f1d3444b.reference || (__cxx_static_address_67502154c27be646f1d3444b.reference = {
    __cReference: true,
    get value() { return SHARK____header_global_cd5243ea3b4f5004; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:549
export const BLOOD____header_global_bd680cc7be38fcb9 = ((((((1620) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2a0ebd03ac63b65f2d81bb73() {
  return __cxx_static_address_2a0ebd03ac63b65f2d81bb73.reference || (__cxx_static_address_2a0ebd03ac63b65f2d81bb73.reference = {
    __cReference: true,
    get value() { return BLOOD____header_global_bd680cc7be38fcb9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:550
export const FIRELASER____header_global_ad4b9bfaf4226aaa = ((((((1625) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1637e7509f2fa49e8073aeda() {
  return __cxx_static_address_1637e7509f2fa49e8073aeda.reference || (__cxx_static_address_1637e7509f2fa49e8073aeda.reference = {
    __cReference: true,
    get value() { return FIRELASER____header_global_ad4b9bfaf4226aaa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:551
export const TRANSPORTERSTAR____header_global_2fb1243873f6fcc8 = ((((((1630) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_70010b80349ad239a259fbef() {
  return __cxx_static_address_70010b80349ad239a259fbef.reference || (__cxx_static_address_70010b80349ad239a259fbef.reference = {
    __cReference: true,
    get value() { return TRANSPORTERSTAR____header_global_2fb1243873f6fcc8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:552
export const SPIT____header_global_b8568f88f609c278 = ((((((1636) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d342b470af8902809cc67256() {
  return __cxx_static_address_d342b470af8902809cc67256.reference || (__cxx_static_address_d342b470af8902809cc67256.reference = {
    __cReference: true,
    get value() { return SPIT____header_global_b8568f88f609c278; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:553
export const LOOGIE____header_global_57b44e24d3c63546 = ((((((1637) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_28cd4a140222a7638700cf52() {
  return __cxx_static_address_28cd4a140222a7638700cf52.reference || (__cxx_static_address_28cd4a140222a7638700cf52.reference = {
    __cReference: true,
    get value() { return LOOGIE____header_global_57b44e24d3c63546; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:554
export const FIST____header_global_b819847280827bd4 = ((((((1640) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3062cec56a4d765f81d9545f() {
  return __cxx_static_address_3062cec56a4d765f81d9545f.reference || (__cxx_static_address_3062cec56a4d765f81d9545f.reference = {
    __cReference: true,
    get value() { return FIST____header_global_b819847280827bd4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:555
export const FREEZEBLAST____header_global_fb45d803614568ff = ((((((1641) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5aaf955c237eacd2e4ded2d6() {
  return __cxx_static_address_5aaf955c237eacd2e4ded2d6.reference || (__cxx_static_address_5aaf955c237eacd2e4ded2d6.reference = {
    __cReference: true,
    get value() { return FREEZEBLAST____header_global_fb45d803614568ff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:556
export const SHRINKSPARK____header_global_418de0907fbb5829 = ((((((1646) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ef65c33c4802a79d4e8d99ca() {
  return __cxx_static_address_ef65c33c4802a79d4e8d99ca.reference || (__cxx_static_address_ef65c33c4802a79d4e8d99ca.reference = {
    __cReference: true,
    get value() { return SHRINKSPARK____header_global_418de0907fbb5829; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:557
export const TONGUE____header_global_a3ff8c1900ae74e5 = ((((((1647) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b2cf9fdb935a67f57c5e82ed() {
  return __cxx_static_address_b2cf9fdb935a67f57c5e82ed.reference || (__cxx_static_address_b2cf9fdb935a67f57c5e82ed.reference = {
    __cReference: true,
    get value() { return TONGUE____header_global_a3ff8c1900ae74e5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:558
export const MORTER____header_global_9a9b252a4ebb88a1 = ((((((1650) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b641474207f1041ab11552a8() {
  return __cxx_static_address_b641474207f1041ab11552a8.reference || (__cxx_static_address_b641474207f1041ab11552a8.reference = {
    __cReference: true,
    get value() { return MORTER____header_global_9a9b252a4ebb88a1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:559
export const SHRINKEREXPLOSION____header_global_09e8e520b957673b = ((((((1656) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b17cb0afd63630a6f02ba763() {
  return __cxx_static_address_b17cb0afd63630a6f02ba763.reference || (__cxx_static_address_b17cb0afd63630a6f02ba763.reference = {
    __cReference: true,
    get value() { return SHRINKEREXPLOSION____header_global_09e8e520b957673b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:560
export const RADIUSEXPLOSION____header_global_9f34b50c5ba012cb = ((((((1670) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_febd58aa461642c6dd1f2f4a() {
  return __cxx_static_address_febd58aa461642c6dd1f2f4a.reference || (__cxx_static_address_febd58aa461642c6dd1f2f4a.reference = {
    __cReference: true,
    get value() { return RADIUSEXPLOSION____header_global_9f34b50c5ba012cb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:561
export const FORCERIPPLE____header_global_c8ab4820050397e2 = ((((((1671) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ef3b13452b034badff9714ce() {
  return __cxx_static_address_ef3b13452b034badff9714ce.reference || (__cxx_static_address_ef3b13452b034badff9714ce.reference = {
    __cReference: true,
    get value() { return FORCERIPPLE____header_global_c8ab4820050397e2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:562
export const LIZTROOP____header_global_10800a012846b757 = ((((((1680) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ad0078c519c85573ab52350b() {
  return __cxx_static_address_ad0078c519c85573ab52350b.reference || (__cxx_static_address_ad0078c519c85573ab52350b.reference = {
    __cReference: true,
    get value() { return LIZTROOP____header_global_10800a012846b757; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:563
export const LIZTROOPRUNNING____header_global_587e0cc7f55f5f2c = ((((((1681) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8a1f293d107b03196319bd3d() {
  return __cxx_static_address_8a1f293d107b03196319bd3d.reference || (__cxx_static_address_8a1f293d107b03196319bd3d.reference = {
    __cReference: true,
    get value() { return LIZTROOPRUNNING____header_global_587e0cc7f55f5f2c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:564
export const LIZTROOPSTAYPUT____header_global_0c523a2e64a610b3 = ((((((1682) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fbc80d2ca7b30b5ca2e78bad() {
  return __cxx_static_address_fbc80d2ca7b30b5ca2e78bad.reference || (__cxx_static_address_fbc80d2ca7b30b5ca2e78bad.reference = {
    __cReference: true,
    get value() { return LIZTROOPSTAYPUT____header_global_0c523a2e64a610b3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:565
export const LIZTROOPSHOOT____header_global_001482f7cf865690 = ((((((1715) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dc336581578dae6369c38d61() {
  return __cxx_static_address_dc336581578dae6369c38d61.reference || (__cxx_static_address_dc336581578dae6369c38d61.reference = {
    __cReference: true,
    get value() { return LIZTROOPSHOOT____header_global_001482f7cf865690; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:566
export const LIZTROOPJETPACK____header_global_30d023bdd79adc55 = ((((((1725) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_37b49adb2521c38d6dfc37e4() {
  return __cxx_static_address_37b49adb2521c38d6dfc37e4.reference || (__cxx_static_address_37b49adb2521c38d6dfc37e4.reference = {
    __cReference: true,
    get value() { return LIZTROOPJETPACK____header_global_30d023bdd79adc55; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:567
export const LIZTROOPONTOILET____header_global_cd2c02164163dcef = ((((((1741) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5861a770736bfe23c09dd8c2() {
  return __cxx_static_address_5861a770736bfe23c09dd8c2.reference || (__cxx_static_address_5861a770736bfe23c09dd8c2.reference = {
    __cReference: true,
    get value() { return LIZTROOPONTOILET____header_global_cd2c02164163dcef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:568
export const LIZTROOPJUSTSIT____header_global_fac8e4f792178946 = ((((((1742) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8aff31fce8c66a04e77f26fd() {
  return __cxx_static_address_8aff31fce8c66a04e77f26fd.reference || (__cxx_static_address_8aff31fce8c66a04e77f26fd.reference = {
    __cReference: true,
    get value() { return LIZTROOPJUSTSIT____header_global_fac8e4f792178946; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:569
export const LIZTROOPDUCKING____header_global_fcfe68c2fad7f9cc = ((((((1744) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_86d5a3779ba0082456f49ba4() {
  return __cxx_static_address_86d5a3779ba0082456f49ba4.reference || (__cxx_static_address_86d5a3779ba0082456f49ba4.reference = {
    __cReference: true,
    get value() { return LIZTROOPDUCKING____header_global_fcfe68c2fad7f9cc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:570
export const HEADJIB1____header_global_20562db72b5eada4 = ((((((1768) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_942e3efa1d3020e12e892e3b() {
  return __cxx_static_address_942e3efa1d3020e12e892e3b.reference || (__cxx_static_address_942e3efa1d3020e12e892e3b.reference = {
    __cReference: true,
    get value() { return HEADJIB1____header_global_20562db72b5eada4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:571
export const ARMJIB1____header_global_4ef99ec1573c085a = ((((((1772) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7b565f68332ee88266849e8a() {
  return __cxx_static_address_7b565f68332ee88266849e8a.reference || (__cxx_static_address_7b565f68332ee88266849e8a.reference = {
    __cReference: true,
    get value() { return ARMJIB1____header_global_4ef99ec1573c085a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:572
export const LEGJIB1____header_global_d966bc6d8e9b6f28 = ((((((1776) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ae16135a2a0dc52d430a74c9() {
  return __cxx_static_address_ae16135a2a0dc52d430a74c9.reference || (__cxx_static_address_ae16135a2a0dc52d430a74c9.reference = {
    __cReference: true,
    get value() { return LEGJIB1____header_global_d966bc6d8e9b6f28; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:573
export const OCTABRAIN____header_global_659d37dacf8e21d0 = ((((((1820) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cd97632213dadce7910a0485() {
  return __cxx_static_address_cd97632213dadce7910a0485.reference || (__cxx_static_address_cd97632213dadce7910a0485.reference = {
    __cReference: true,
    get value() { return OCTABRAIN____header_global_659d37dacf8e21d0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:574
export const OCTABRAINSTAYPUT____header_global_1614bf8aaff7aef8 = ((((((1821) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_536306d261b168eae433ffcc() {
  return __cxx_static_address_536306d261b168eae433ffcc.reference || (__cxx_static_address_536306d261b168eae433ffcc.reference = {
    __cReference: true,
    get value() { return OCTABRAINSTAYPUT____header_global_1614bf8aaff7aef8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:575
export const INNERJAW____header_global_246ff77fa190148d = ((((((1860) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fcace70f959c1643d777dd45() {
  return __cxx_static_address_fcace70f959c1643d777dd45.reference || (__cxx_static_address_fcace70f959c1643d777dd45.reference = {
    __cReference: true,
    get value() { return INNERJAW____header_global_246ff77fa190148d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:576
export const DRONE____header_global_76d3b28834811e4a = ((((((1880) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4358581a4a53f2e511c64f15() {
  return __cxx_static_address_4358581a4a53f2e511c64f15.reference || (__cxx_static_address_4358581a4a53f2e511c64f15.reference = {
    __cReference: true,
    get value() { return DRONE____header_global_76d3b28834811e4a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:577
export const EXPLOSION2____header_global_7116edfb0ec315b3 = ((((((1890) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2c6ce02689a4807367e8b7a2() {
  return __cxx_static_address_2c6ce02689a4807367e8b7a2.reference || (__cxx_static_address_2c6ce02689a4807367e8b7a2.reference = {
    __cReference: true,
    get value() { return EXPLOSION2____header_global_7116edfb0ec315b3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:578
export const COMMANDER____header_global_1b9a1a85cd5d3b67 = ((((((1920) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9f29fd4c627753870889c6be() {
  return __cxx_static_address_9f29fd4c627753870889c6be.reference || (__cxx_static_address_9f29fd4c627753870889c6be.reference = {
    __cReference: true,
    get value() { return COMMANDER____header_global_1b9a1a85cd5d3b67; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:579
export const COMMANDERSTAYPUT____header_global_0c27b94cb667dab1 = ((((((1921) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8002f33414baeace2886d437() {
  return __cxx_static_address_8002f33414baeace2886d437.reference || (__cxx_static_address_8002f33414baeace2886d437.reference = {
    __cReference: true,
    get value() { return COMMANDERSTAYPUT____header_global_0c27b94cb667dab1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:580
export const RECON____header_global_c495953042ed3ded = ((((((1960) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bd13da318e12988b8bd92fd7() {
  return __cxx_static_address_bd13da318e12988b8bd92fd7.reference || (__cxx_static_address_bd13da318e12988b8bd92fd7.reference = {
    __cReference: true,
    get value() { return RECON____header_global_c495953042ed3ded; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:581
export const TANK____header_global_63863678e1a05f87 = ((((((1975) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5528d62c01dfaf9082463b6b() {
  return __cxx_static_address_5528d62c01dfaf9082463b6b.reference || (__cxx_static_address_5528d62c01dfaf9082463b6b.reference = {
    __cReference: true,
    get value() { return TANK____header_global_63863678e1a05f87; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:582
export const PIGCOP____header_global_3f3c15a6fa270245 = ((((((2000) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_47fe27bceac7c8992c791496() {
  return __cxx_static_address_47fe27bceac7c8992c791496.reference || (__cxx_static_address_47fe27bceac7c8992c791496.reference = {
    __cReference: true,
    get value() { return PIGCOP____header_global_3f3c15a6fa270245; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:583
export const PIGCOPSTAYPUT____header_global_c4a58f3a2fba642a = ((((((2001) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_648e3a8c108731190890856e() {
  return __cxx_static_address_648e3a8c108731190890856e.reference || (__cxx_static_address_648e3a8c108731190890856e.reference = {
    __cReference: true,
    get value() { return PIGCOPSTAYPUT____header_global_c4a58f3a2fba642a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:584
export const PIGCOPDIVE____header_global_caa08bcbbdf69e29 = ((((((2045) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6942b08bf127ffe58f7b46de() {
  return __cxx_static_address_6942b08bf127ffe58f7b46de.reference || (__cxx_static_address_6942b08bf127ffe58f7b46de.reference = {
    __cReference: true,
    get value() { return PIGCOPDIVE____header_global_caa08bcbbdf69e29; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:585
export const LIZMAN____header_global_690d095172c5a022 = ((((((2120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a0b3441596d214f163d011bb() {
  return __cxx_static_address_a0b3441596d214f163d011bb.reference || (__cxx_static_address_a0b3441596d214f163d011bb.reference = {
    __cReference: true,
    get value() { return LIZMAN____header_global_690d095172c5a022; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:586
export const LIZMANSTAYPUT____header_global_d2557628c3c9d8cc = ((((((2121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_401e4eea12e88f47811cca6e() {
  return __cxx_static_address_401e4eea12e88f47811cca6e.reference || (__cxx_static_address_401e4eea12e88f47811cca6e.reference = {
    __cReference: true,
    get value() { return LIZMANSTAYPUT____header_global_d2557628c3c9d8cc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:587
export const LIZMANSPITTING____header_global_2ce2720aae137708 = ((((((2150) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9607498fe2c0e97107b69c6d() {
  return __cxx_static_address_9607498fe2c0e97107b69c6d.reference || (__cxx_static_address_9607498fe2c0e97107b69c6d.reference = {
    __cReference: true,
    get value() { return LIZMANSPITTING____header_global_2ce2720aae137708; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:588
export const LIZMANFEEDING____header_global_43df20e4776b9a7c = ((((((2160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_249d4fd4fac810daafa5ae50() {
  return __cxx_static_address_249d4fd4fac810daafa5ae50.reference || (__cxx_static_address_249d4fd4fac810daafa5ae50.reference = {
    __cReference: true,
    get value() { return LIZMANFEEDING____header_global_43df20e4776b9a7c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:589
export const LIZMANJUMP____header_global_da857bc9f0373691 = ((((((2165) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_46f982a03925d66699b8fce2() {
  return __cxx_static_address_46f982a03925d66699b8fce2.reference || (__cxx_static_address_46f982a03925d66699b8fce2.reference = {
    __cReference: true,
    get value() { return LIZMANJUMP____header_global_da857bc9f0373691; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:590
export const FECES____header_global_60e2d98a1cf7c3bf = ((((((2200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cfd5e377a67018539ae58e94() {
  return __cxx_static_address_cfd5e377a67018539ae58e94.reference || (__cxx_static_address_cfd5e377a67018539ae58e94.reference = {
    __cReference: true,
    get value() { return FECES____header_global_60e2d98a1cf7c3bf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:591
export const LIZMANHEAD1____header_global_ef6e14a1c9757b53 = ((((((2201) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fc6ee7936490268e4b7c6d2c() {
  return __cxx_static_address_fc6ee7936490268e4b7c6d2c.reference || (__cxx_static_address_fc6ee7936490268e4b7c6d2c.reference = {
    __cReference: true,
    get value() { return LIZMANHEAD1____header_global_ef6e14a1c9757b53; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:592
export const LIZMANARM1____header_global_5b5133662759dc3a = ((((((2205) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_63803b3fc6559dff84a5e2b6() {
  return __cxx_static_address_63803b3fc6559dff84a5e2b6.reference || (__cxx_static_address_63803b3fc6559dff84a5e2b6.reference = {
    __cReference: true,
    get value() { return LIZMANARM1____header_global_5b5133662759dc3a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:593
export const LIZMANLEG1____header_global_98176b714bdf6ecc = ((((((2209) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4ec795a1415396195e9c9768() {
  return __cxx_static_address_4ec795a1415396195e9c9768.reference || (__cxx_static_address_4ec795a1415396195e9c9768.reference = {
    __cReference: true,
    get value() { return LIZMANLEG1____header_global_98176b714bdf6ecc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:594
export const EXPLOSION2BOT____header_global_ed0b69ed70cbbbc8 = ((((((2219) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c7ed5f13b63577daa625afb8() {
  return __cxx_static_address_c7ed5f13b63577daa625afb8.reference || (__cxx_static_address_c7ed5f13b63577daa625afb8.reference = {
    __cReference: true,
    get value() { return EXPLOSION2BOT____header_global_ed0b69ed70cbbbc8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:595
export const JIBS1____header_global_1134d9aea45bdef0 = ((((((2245) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_579d725d08723809b8d060be() {
  return __cxx_static_address_579d725d08723809b8d060be.reference || (__cxx_static_address_579d725d08723809b8d060be.reference = {
    __cReference: true,
    get value() { return JIBS1____header_global_1134d9aea45bdef0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:596
export const JIBS2____header_global_bb9ee47e1ddaaa8e = ((((((2250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_22dbe8f4f5a1bbcf5f8416fe() {
  return __cxx_static_address_22dbe8f4f5a1bbcf5f8416fe.reference || (__cxx_static_address_22dbe8f4f5a1bbcf5f8416fe.reference = {
    __cReference: true,
    get value() { return JIBS2____header_global_bb9ee47e1ddaaa8e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:597
export const JIBS3____header_global_6b936e62f22b3399 = ((((((2255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_504d49029abb2cc0f0d0051e() {
  return __cxx_static_address_504d49029abb2cc0f0d0051e.reference || (__cxx_static_address_504d49029abb2cc0f0d0051e.reference = {
    __cReference: true,
    get value() { return JIBS3____header_global_6b936e62f22b3399; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:598
export const JIBS4____header_global_b23a888508303e8a = ((((((2260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_23845ac819083610a8e2c2fd() {
  return __cxx_static_address_23845ac819083610a8e2c2fd.reference || (__cxx_static_address_23845ac819083610a8e2c2fd.reference = {
    __cReference: true,
    get value() { return JIBS4____header_global_b23a888508303e8a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:599
export const JIBS5____header_global_c58997da2d66498b = ((((((2265) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_509c49b1b60862b6e52d3ac2() {
  return __cxx_static_address_509c49b1b60862b6e52d3ac2.reference || (__cxx_static_address_509c49b1b60862b6e52d3ac2.reference = {
    __cReference: true,
    get value() { return JIBS5____header_global_c58997da2d66498b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:600
export const BURNING____header_global_0125e2d1edb7595c = ((((((2270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d4fa44bab1697f9b1875ce55() {
  return __cxx_static_address_d4fa44bab1697f9b1875ce55.reference || (__cxx_static_address_d4fa44bab1697f9b1875ce55.reference = {
    __cReference: true,
    get value() { return BURNING____header_global_0125e2d1edb7595c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:601
export const FIRE____header_global_c6e2072421be0b04 = ((((((2271) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_61c403fcb7a27b9eb8dad413() {
  return __cxx_static_address_61c403fcb7a27b9eb8dad413.reference || (__cxx_static_address_61c403fcb7a27b9eb8dad413.reference = {
    __cReference: true,
    get value() { return FIRE____header_global_c6e2072421be0b04; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:602
export const JIBS6____header_global_436d76f996fc5d15 = ((((((2286) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_465df4076d23f82d328e30ee() {
  return __cxx_static_address_465df4076d23f82d328e30ee.reference || (__cxx_static_address_465df4076d23f82d328e30ee.reference = {
    __cReference: true,
    get value() { return JIBS6____header_global_436d76f996fc5d15; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:603
export const BLOODSPLAT1____header_global_7cb6bb50674b37d0 = ((((((2296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_53d86ec7500d805db4a1380d() {
  return __cxx_static_address_53d86ec7500d805db4a1380d.reference || (__cxx_static_address_53d86ec7500d805db4a1380d.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT1____header_global_7cb6bb50674b37d0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:604
export const BLOODSPLAT3____header_global_a95412f26d866080 = ((((((2297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c7daa34c5e14cd703f6a910e() {
  return __cxx_static_address_c7daa34c5e14cd703f6a910e.reference || (__cxx_static_address_c7daa34c5e14cd703f6a910e.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT3____header_global_a95412f26d866080; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:605
export const BLOODSPLAT2____header_global_904b1a4ffaf3d17e = ((((((2298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e04f135b88c3ceac47703276() {
  return __cxx_static_address_e04f135b88c3ceac47703276.reference || (__cxx_static_address_e04f135b88c3ceac47703276.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT2____header_global_904b1a4ffaf3d17e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:606
export const BLOODSPLAT4____header_global_bacdc1f9f9bd48ab = ((((((2299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fc7d8c4ef9c7ceaec553e8cf() {
  return __cxx_static_address_fc7d8c4ef9c7ceaec553e8cf.reference || (__cxx_static_address_fc7d8c4ef9c7ceaec553e8cf.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT4____header_global_bacdc1f9f9bd48ab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:607
export const OOZ____header_global_d2155cea8248418b = ((((((2300) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6faa7b67e4c8856b79775d98() {
  return __cxx_static_address_6faa7b67e4c8856b79775d98.reference || (__cxx_static_address_6faa7b67e4c8856b79775d98.reference = {
    __cReference: true,
    get value() { return OOZ____header_global_d2155cea8248418b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:608
export const OOZ2____header_global_e7b7e926c2783c83 = ((((((2309) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eee2b14df5a6c113ba938397() {
  return __cxx_static_address_eee2b14df5a6c113ba938397.reference || (__cxx_static_address_eee2b14df5a6c113ba938397.reference = {
    __cReference: true,
    get value() { return OOZ2____header_global_e7b7e926c2783c83; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:609
export const WALLBLOOD1____header_global_50f3caf35554cc81 = ((((((2301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2983f88cf0d2e4284bd13b8e() {
  return __cxx_static_address_2983f88cf0d2e4284bd13b8e.reference || (__cxx_static_address_2983f88cf0d2e4284bd13b8e.reference = {
    __cReference: true,
    get value() { return WALLBLOOD1____header_global_50f3caf35554cc81; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:610
export const WALLBLOOD2____header_global_e8165c3e5ff1a48b = ((((((2302) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c14a9a9920c69b7968211299() {
  return __cxx_static_address_c14a9a9920c69b7968211299.reference || (__cxx_static_address_c14a9a9920c69b7968211299.reference = {
    __cReference: true,
    get value() { return WALLBLOOD2____header_global_e8165c3e5ff1a48b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:611
export const WALLBLOOD3____header_global_53e9fd2e0edced45 = ((((((2303) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9bd0c6c81b8253ca6c00011f() {
  return __cxx_static_address_9bd0c6c81b8253ca6c00011f.reference || (__cxx_static_address_9bd0c6c81b8253ca6c00011f.reference = {
    __cReference: true,
    get value() { return WALLBLOOD3____header_global_53e9fd2e0edced45; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:612
export const WALLBLOOD4____header_global_a9fff475f53264ab = ((((((2304) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7d53730054cdd16a9cfba9d3() {
  return __cxx_static_address_7d53730054cdd16a9cfba9d3.reference || (__cxx_static_address_7d53730054cdd16a9cfba9d3.reference = {
    __cReference: true,
    get value() { return WALLBLOOD4____header_global_a9fff475f53264ab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:613
export const WALLBLOOD5____header_global_1b7508ab9806400b = ((((((2305) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7a9728c26e721d884762c308() {
  return __cxx_static_address_7a9728c26e721d884762c308.reference || (__cxx_static_address_7a9728c26e721d884762c308.reference = {
    __cReference: true,
    get value() { return WALLBLOOD5____header_global_1b7508ab9806400b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:614
export const WALLBLOOD7____header_global_000c55f87119cbc7 = ((((((2307) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_51f6d9d6a3911efca2db3c60() {
  return __cxx_static_address_51f6d9d6a3911efca2db3c60.reference || (__cxx_static_address_51f6d9d6a3911efca2db3c60.reference = {
    __cReference: true,
    get value() { return WALLBLOOD7____header_global_000c55f87119cbc7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:615
export const WALLBLOOD8____header_global_988f0b83fa7e6876 = ((((((2308) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2b22b6e17b4e2cd08eea0dfa() {
  return __cxx_static_address_2b22b6e17b4e2cd08eea0dfa.reference || (__cxx_static_address_2b22b6e17b4e2cd08eea0dfa.reference = {
    __cReference: true,
    get value() { return WALLBLOOD8____header_global_988f0b83fa7e6876; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:616
export const BURNING2____header_global_742436beef0728a1 = ((((((2310) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_88e90747e92b0fd9a5b132fd() {
  return __cxx_static_address_88e90747e92b0fd9a5b132fd.reference || (__cxx_static_address_88e90747e92b0fd9a5b132fd.reference = {
    __cReference: true,
    get value() { return BURNING2____header_global_742436beef0728a1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:617
export const FIRE2____header_global_cab8ad51f0ece0f5 = ((((((2311) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aadcba2e03e76603f88f239b() {
  return __cxx_static_address_aadcba2e03e76603f88f239b.reference || (__cxx_static_address_aadcba2e03e76603f88f239b.reference = {
    __cReference: true,
    get value() { return FIRE2____header_global_cab8ad51f0ece0f5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:618
export const CRACKKNUCKLES____header_global_a253d5276238b4bd = ((((((2324) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8f5228c8b34ec06108a85d57() {
  return __cxx_static_address_8f5228c8b34ec06108a85d57.reference || (__cxx_static_address_8f5228c8b34ec06108a85d57.reference = {
    __cReference: true,
    get value() { return CRACKKNUCKLES____header_global_a253d5276238b4bd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:619
export const SMALLSMOKE____header_global_f0b94ff12f3d5af0 = ((((((2329) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_74ce244d7981a5e8e18a256e() {
  return __cxx_static_address_74ce244d7981a5e8e18a256e.reference || (__cxx_static_address_74ce244d7981a5e8e18a256e.reference = {
    __cReference: true,
    get value() { return SMALLSMOKE____header_global_f0b94ff12f3d5af0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:620
export const FLOORFLAME____header_global_8a43125b250e615f = ((((((2333) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fffc1d5ba13c69715f51e221() {
  return __cxx_static_address_fffc1d5ba13c69715f51e221.reference || (__cxx_static_address_fffc1d5ba13c69715f51e221.reference = {
    __cReference: true,
    get value() { return FLOORFLAME____header_global_8a43125b250e615f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:621
export const ROTATEGUN____header_global_103e35300019ea6e = ((((((2360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ba949b3c8a11152e72b3b295() {
  return __cxx_static_address_ba949b3c8a11152e72b3b295.reference || (__cxx_static_address_ba949b3c8a11152e72b3b295.reference = {
    __cReference: true,
    get value() { return ROTATEGUN____header_global_103e35300019ea6e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:622
export const GREENSLIME____header_global_9f7d7bc4822d874b = ((((((2370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_47dce0d75c07691a84ceb358() {
  return __cxx_static_address_47dce0d75c07691a84ceb358.reference || (__cxx_static_address_47dce0d75c07691a84ceb358.reference = {
    __cReference: true,
    get value() { return GREENSLIME____header_global_9f7d7bc4822d874b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:623
export const WATERDRIPSPLASH____header_global_ad15b2acc8e1b53b = ((((((2380) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a49a7500f296028216616c50() {
  return __cxx_static_address_a49a7500f296028216616c50.reference || (__cxx_static_address_a49a7500f296028216616c50.reference = {
    __cReference: true,
    get value() { return WATERDRIPSPLASH____header_global_ad15b2acc8e1b53b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:624
export const SCRAP6____header_global_a7ac3f65ded278aa = ((((((2390) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_264480a59e925c78dece06c3() {
  return __cxx_static_address_264480a59e925c78dece06c3.reference || (__cxx_static_address_264480a59e925c78dece06c3.reference = {
    __cReference: true,
    get value() { return SCRAP6____header_global_a7ac3f65ded278aa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:625
export const SCRAP1____header_global_814f0ec4a453a481 = ((((((2400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5e24533dd7e2317a740617a7() {
  return __cxx_static_address_5e24533dd7e2317a740617a7.reference || (__cxx_static_address_5e24533dd7e2317a740617a7.reference = {
    __cReference: true,
    get value() { return SCRAP1____header_global_814f0ec4a453a481; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:626
export const SCRAP2____header_global_d24c046dae36b15d = ((((((2404) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_866d0ed5947c98a14763d4b4() {
  return __cxx_static_address_866d0ed5947c98a14763d4b4.reference || (__cxx_static_address_866d0ed5947c98a14763d4b4.reference = {
    __cReference: true,
    get value() { return SCRAP2____header_global_d24c046dae36b15d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:627
export const SCRAP3____header_global_b99cfc0b500b944d = ((((((2408) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9282ee4b478083c8de4b21fb() {
  return __cxx_static_address_9282ee4b478083c8de4b21fb.reference || (__cxx_static_address_9282ee4b478083c8de4b21fb.reference = {
    __cReference: true,
    get value() { return SCRAP3____header_global_b99cfc0b500b944d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:628
export const SCRAP4____header_global_eb036b71033f8bca = ((((((2412) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8d8cb4b8e7fdcb7cc21f77b8() {
  return __cxx_static_address_8d8cb4b8e7fdcb7cc21f77b8.reference || (__cxx_static_address_8d8cb4b8e7fdcb7cc21f77b8.reference = {
    __cReference: true,
    get value() { return SCRAP4____header_global_eb036b71033f8bca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:629
export const SCRAP5____header_global_ece7b519a15ee0a6 = ((((((2416) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c3232043f951e4e732235469() {
  return __cxx_static_address_c3232043f951e4e732235469.reference || (__cxx_static_address_c3232043f951e4e732235469.reference = {
    __cReference: true,
    get value() { return SCRAP5____header_global_ece7b519a15ee0a6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:630
export const ORGANTIC____header_global_f4a9bc40a5df8932 = ((((((2420) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_50e2a9803c18b3856ac46113() {
  return __cxx_static_address_50e2a9803c18b3856ac46113.reference || (__cxx_static_address_50e2a9803c18b3856ac46113.reference = {
    __cReference: true,
    get value() { return ORGANTIC____header_global_f4a9bc40a5df8932; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:631
export const BETAVERSION____header_global_45de5c1ceab6ee98 = ((((((2440) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_35e1f89950d5658f5b199c1b() {
  return __cxx_static_address_35e1f89950d5658f5b199c1b.reference || (__cxx_static_address_35e1f89950d5658f5b199c1b.reference = {
    __cReference: true,
    get value() { return BETAVERSION____header_global_45de5c1ceab6ee98; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:632
export const SELECTDIR____header_global_e112c044b0480afd = ((((((2444) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3d480bb4fe9b933522f6174b() {
  return __cxx_static_address_3d480bb4fe9b933522f6174b.reference || (__cxx_static_address_3d480bb4fe9b933522f6174b.reference = {
    __cReference: true,
    get value() { return SELECTDIR____header_global_e112c044b0480afd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:633
export const F1HELP____header_global_9db9a2475aafe9c4 = ((((((2445) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4363476dab8b9fea6e4c4cdb() {
  return __cxx_static_address_4363476dab8b9fea6e4c4cdb.reference || (__cxx_static_address_4363476dab8b9fea6e4c4cdb.reference = {
    __cReference: true,
    get value() { return F1HELP____header_global_9db9a2475aafe9c4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:634
export const GROWSPARK____header_global_aad48fb8668eafb2 = ((((((2448) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7955dcd54880aa13c1d06e08() {
  return __cxx_static_address_7955dcd54880aa13c1d06e08.reference || (__cxx_static_address_7955dcd54880aa13c1d06e08.reference = {
    __cReference: true,
    get value() { return GROWSPARK____header_global_aad48fb8668eafb2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:635
export const MENUSCREEN____header_global_0ca4412d07beab76 = ((((((2456) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_06b232eaa6ab9df1113966ca() {
  return __cxx_static_address_06b232eaa6ab9df1113966ca.reference || (__cxx_static_address_06b232eaa6ab9df1113966ca.reference = {
    __cReference: true,
    get value() { return MENUSCREEN____header_global_0ca4412d07beab76; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:636
export const MENUBAR____header_global_fea32e48ba2094e8 = ((((((2457) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e2e925807df620ac56bba125() {
  return __cxx_static_address_e2e925807df620ac56bba125.reference || (__cxx_static_address_e2e925807df620ac56bba125.reference = {
    __cReference: true,
    get value() { return MENUBAR____header_global_fea32e48ba2094e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:637
export const KILLSICON____header_global_5c6203f6497dbb92 = ((((((2458) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ba2e9d8f0c862cfd0eea1277() {
  return __cxx_static_address_ba2e9d8f0c862cfd0eea1277.reference || (__cxx_static_address_ba2e9d8f0c862cfd0eea1277.reference = {
    __cReference: true,
    get value() { return KILLSICON____header_global_5c6203f6497dbb92; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:638
export const FIRSTAID_ICON____header_global_a164a2e8e2c529b9 = ((((((2460) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_958dbb72cf287e456380d501() {
  return __cxx_static_address_958dbb72cf287e456380d501.reference || (__cxx_static_address_958dbb72cf287e456380d501.reference = {
    __cReference: true,
    get value() { return FIRSTAID_ICON____header_global_a164a2e8e2c529b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:639
export const HEAT_ICON____header_global_12fb085102f9b4c2 = ((((((2461) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d25776b335e1d82f316b8dbc() {
  return __cxx_static_address_d25776b335e1d82f316b8dbc.reference || (__cxx_static_address_d25776b335e1d82f316b8dbc.reference = {
    __cReference: true,
    get value() { return HEAT_ICON____header_global_12fb085102f9b4c2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:640
export const BOTTOMSTATUSBAR____header_global_776fe3a43eb6ed51 = ((((((2462) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0b39497f77dd894aaf8cc0ac() {
  return __cxx_static_address_0b39497f77dd894aaf8cc0ac.reference || (__cxx_static_address_0b39497f77dd894aaf8cc0ac.reference = {
    __cReference: true,
    get value() { return BOTTOMSTATUSBAR____header_global_776fe3a43eb6ed51; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:641
export const BOOT_ICON____header_global_da2ec88c05a88bcd = ((((((2463) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_80d4117034500b886cd1fc79() {
  return __cxx_static_address_80d4117034500b886cd1fc79.reference || (__cxx_static_address_80d4117034500b886cd1fc79.reference = {
    __cReference: true,
    get value() { return BOOT_ICON____header_global_da2ec88c05a88bcd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:642
export const FRAGBAR____header_global_b5837fc61fcd2f0e = ((((((2465) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bab42365c10c9b18b98af1b8() {
  return __cxx_static_address_bab42365c10c9b18b98af1b8.reference || (__cxx_static_address_bab42365c10c9b18b98af1b8.reference = {
    __cReference: true,
    get value() { return FRAGBAR____header_global_b5837fc61fcd2f0e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:643
export const JETPACK_ICON____header_global_5f4500c7a229d139 = ((((((2467) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_35ef6b4bb8f3ffc3b8cf59cb() {
  return __cxx_static_address_35ef6b4bb8f3ffc3b8cf59cb.reference || (__cxx_static_address_35ef6b4bb8f3ffc3b8cf59cb.reference = {
    __cReference: true,
    get value() { return JETPACK_ICON____header_global_5f4500c7a229d139; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:644
export const AIRTANK_ICON____header_global_5e8a8a93161bba34 = ((((((2468) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_48fdf4ea12d36dcf86dfc8da() {
  return __cxx_static_address_48fdf4ea12d36dcf86dfc8da.reference || (__cxx_static_address_48fdf4ea12d36dcf86dfc8da.reference = {
    __cReference: true,
    get value() { return AIRTANK_ICON____header_global_5e8a8a93161bba34; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:645
export const STEROIDS_ICON____header_global_86d4e650f5d80d56 = ((((((2469) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e0eda01ff8bc73c6214c527a() {
  return __cxx_static_address_e0eda01ff8bc73c6214c527a.reference || (__cxx_static_address_e0eda01ff8bc73c6214c527a.reference = {
    __cReference: true,
    get value() { return STEROIDS_ICON____header_global_86d4e650f5d80d56; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:646
export const HOLODUKE_ICON____header_global_7bb96cc92102d75d = ((((((2470) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a4df0f8bac1ec42372c92d3e() {
  return __cxx_static_address_a4df0f8bac1ec42372c92d3e.reference || (__cxx_static_address_a4df0f8bac1ec42372c92d3e.reference = {
    __cReference: true,
    get value() { return HOLODUKE_ICON____header_global_7bb96cc92102d75d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:647
export const ACCESS_ICON____header_global_1b962fc05a2b42e8 = ((((((2471) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2b87f5041116a3e821b02c5e() {
  return __cxx_static_address_2b87f5041116a3e821b02c5e.reference || (__cxx_static_address_2b87f5041116a3e821b02c5e.reference = {
    __cReference: true,
    get value() { return ACCESS_ICON____header_global_1b962fc05a2b42e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:648
export const DIGITALNUM____header_global_1ea8e07be03b07e9 = ((((((2472) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b1d0d28151f6de89e2ae85f6() {
  return __cxx_static_address_b1d0d28151f6de89e2ae85f6.reference || (__cxx_static_address_b1d0d28151f6de89e2ae85f6.reference = {
    __cReference: true,
    get value() { return DIGITALNUM____header_global_1ea8e07be03b07e9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:649
export const DUKECAR____header_global_961ecc825a541e92 = ((((((2491) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ec720e4a56ab42458792e634() {
  return __cxx_static_address_ec720e4a56ab42458792e634.reference || (__cxx_static_address_ec720e4a56ab42458792e634.reference = {
    __cReference: true,
    get value() { return DUKECAR____header_global_961ecc825a541e92; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:650
export const CAMCORNER____header_global_cc8ce85028ea04da = ((((((2482) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_be85fb966e1b638aa41ae87d() {
  return __cxx_static_address_be85fb966e1b638aa41ae87d.reference || (__cxx_static_address_be85fb966e1b638aa41ae87d.reference = {
    __cReference: true,
    get value() { return CAMCORNER____header_global_cc8ce85028ea04da; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:651
export const CAMLIGHT____header_global_d3035ee8bac3986d = ((((((2484) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c56573fb02263b821267525b() {
  return __cxx_static_address_c56573fb02263b821267525b.reference || (__cxx_static_address_c56573fb02263b821267525b.reference = {
    __cReference: true,
    get value() { return CAMLIGHT____header_global_d3035ee8bac3986d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:652
export const SLIDEBAR____header_global_c98eb8f9961935bd = ((((((2489) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d12e308ac6aecb9985e7a41a() {
  return __cxx_static_address_d12e308ac6aecb9985e7a41a.reference || (__cxx_static_address_d12e308ac6aecb9985e7a41a.reference = {
    __cReference: true,
    get value() { return SLIDEBAR____header_global_c98eb8f9961935bd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:653
export const DREALMS____header_global_13825f4f065e987d = ((((((2492) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1a264e28aa8e1204bcf64257() {
  return __cxx_static_address_1a264e28aa8e1204bcf64257.reference || (__cxx_static_address_1a264e28aa8e1204bcf64257.reference = {
    __cReference: true,
    get value() { return DREALMS____header_global_13825f4f065e987d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:654
export const BETASCREEN____header_global_9111947b483dda20 = ((((((2493) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c4730271a520ec4fcb17d5db() {
  return __cxx_static_address_c4730271a520ec4fcb17d5db.reference || (__cxx_static_address_c4730271a520ec4fcb17d5db.reference = {
    __cReference: true,
    get value() { return BETASCREEN____header_global_9111947b483dda20; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:655
export const WINDOWBORDER1____header_global_1a01032620365d5f = ((((((2494) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_23077babaacdc0628f355ce5() {
  return __cxx_static_address_23077babaacdc0628f355ce5.reference || (__cxx_static_address_23077babaacdc0628f355ce5.reference = {
    __cReference: true,
    get value() { return WINDOWBORDER1____header_global_1a01032620365d5f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:656
export const TEXTBOX____header_global_c130f4b2f7e4cec2 = ((((((2495) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_67ea95f0d478728519682fe8() {
  return __cxx_static_address_67ea95f0d478728519682fe8.reference || (__cxx_static_address_67ea95f0d478728519682fe8.reference = {
    __cReference: true,
    get value() { return TEXTBOX____header_global_c130f4b2f7e4cec2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:657
export const WINDOWBORDER2____header_global_89b5b334be0ecbd4 = ((((((2496) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c114464289adf2f14549e3b6() {
  return __cxx_static_address_c114464289adf2f14549e3b6.reference || (__cxx_static_address_c114464289adf2f14549e3b6.reference = {
    __cReference: true,
    get value() { return WINDOWBORDER2____header_global_89b5b334be0ecbd4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:658
export const DUKENUKEM____header_global_ca9efe2f36e0c4ee = ((((((2497) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_52b600c541ef65509ad2a262() {
  return __cxx_static_address_52b600c541ef65509ad2a262.reference || (__cxx_static_address_52b600c541ef65509ad2a262.reference = {
    __cReference: true,
    get value() { return DUKENUKEM____header_global_ca9efe2f36e0c4ee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:659
export const THREEDEE____header_global_12a20665447be3ca = ((((((2498) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dcf370fd9c903b5d4244c7a2() {
  return __cxx_static_address_dcf370fd9c903b5d4244c7a2.reference || (__cxx_static_address_dcf370fd9c903b5d4244c7a2.reference = {
    __cReference: true,
    get value() { return THREEDEE____header_global_12a20665447be3ca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:660
export const INGAMEDUKETHREEDEE____header_global_c2fe60591c514fee = ((((((2499) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fc413bad4de56b5ed0f397ad() {
  return __cxx_static_address_fc413bad4de56b5ed0f397ad.reference || (__cxx_static_address_fc413bad4de56b5ed0f397ad.reference = {
    __cReference: true,
    get value() { return INGAMEDUKETHREEDEE____header_global_c2fe60591c514fee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:661
export const TENSCREEN____header_global_f08a0d9925586bdd = ((((((2500) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_091de43ea82add3df39d0add() {
  return __cxx_static_address_091de43ea82add3df39d0add.reference || (__cxx_static_address_091de43ea82add3df39d0add.reference = {
    __cReference: true,
    get value() { return TENSCREEN____header_global_f08a0d9925586bdd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:662
export const PLUTOPAKSPRITE____header_global_347cc3f052f3307a = ((((((2501) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_39c65d671f9a62506d3b9d07() {
  return __cxx_static_address_39c65d671f9a62506d3b9d07.reference || (__cxx_static_address_39c65d671f9a62506d3b9d07.reference = {
    __cReference: true,
    get value() { return PLUTOPAKSPRITE____header_global_347cc3f052f3307a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:663
export const DEVISTATOR____header_global_69dfe280b69edeed = ((((((2510) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eef87964daa68230f5fe1c66() {
  return __cxx_static_address_eef87964daa68230f5fe1c66.reference || (__cxx_static_address_eef87964daa68230f5fe1c66.reference = {
    __cReference: true,
    get value() { return DEVISTATOR____header_global_69dfe280b69edeed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:664
export const KNEE____header_global_9b3fffd2628601cc = ((((((2521) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e1ceb43783f122073c957328() {
  return __cxx_static_address_e1ceb43783f122073c957328.reference || (__cxx_static_address_e1ceb43783f122073c957328.reference = {
    __cReference: true,
    get value() { return KNEE____header_global_9b3fffd2628601cc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:665
export const CROSSHAIR____header_global_f715e558efa240b5 = ((((((2523) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_449cfdf5047b26bfa556b9db() {
  return __cxx_static_address_449cfdf5047b26bfa556b9db.reference || (__cxx_static_address_449cfdf5047b26bfa556b9db.reference = {
    __cReference: true,
    get value() { return CROSSHAIR____header_global_f715e558efa240b5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:666
export const FIRSTGUN____header_global_39093cfaf59d6d2d = ((((((2524) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b07d211d5094375f22d4ac5c() {
  return __cxx_static_address_b07d211d5094375f22d4ac5c.reference || (__cxx_static_address_b07d211d5094375f22d4ac5c.reference = {
    __cReference: true,
    get value() { return FIRSTGUN____header_global_39093cfaf59d6d2d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:667
export const FIRSTGUNRELOAD____header_global_87a3df5e68cc6f91 = ((((((2528) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ec049704adcd760b778ab927() {
  return __cxx_static_address_ec049704adcd760b778ab927.reference || (__cxx_static_address_ec049704adcd760b778ab927.reference = {
    __cReference: true,
    get value() { return FIRSTGUNRELOAD____header_global_87a3df5e68cc6f91; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:668
export const SHELL____header_global_8511fb6f6868a0a8 = ((((((2533) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_52926cbdbed6f25c707ff31b() {
  return __cxx_static_address_52926cbdbed6f25c707ff31b.reference || (__cxx_static_address_52926cbdbed6f25c707ff31b.reference = {
    __cReference: true,
    get value() { return SHELL____header_global_8511fb6f6868a0a8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:669
export const SHOTGUNSHELL____header_global_f7dc32a4ff2f3148 = ((((((2535) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c4849ccaba634d09ac13c4a1() {
  return __cxx_static_address_c4849ccaba634d09ac13c4a1.reference || (__cxx_static_address_c4849ccaba634d09ac13c4a1.reference = {
    __cReference: true,
    get value() { return SHOTGUNSHELL____header_global_f7dc32a4ff2f3148; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:670
export const CHAINGUN____header_global_cbc149751719fd4e = ((((((2536) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_946401f14332bbc49bd08e71() {
  return __cxx_static_address_946401f14332bbc49bd08e71.reference || (__cxx_static_address_946401f14332bbc49bd08e71.reference = {
    __cReference: true,
    get value() { return CHAINGUN____header_global_cbc149751719fd4e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:671
export const RPGGUN____header_global_0c87596a3d7e9081 = ((((((2544) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a5675ce4f2481072c14a1ec0() {
  return __cxx_static_address_a5675ce4f2481072c14a1ec0.reference || (__cxx_static_address_a5675ce4f2481072c14a1ec0.reference = {
    __cReference: true,
    get value() { return RPGGUN____header_global_0c87596a3d7e9081; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:672
export const FREEZE____header_global_5bb7e11acd718947 = ((((((2548) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b0a4cedc35311074b6f99f5d() {
  return __cxx_static_address_b0a4cedc35311074b6f99f5d.reference || (__cxx_static_address_b0a4cedc35311074b6f99f5d.reference = {
    __cReference: true,
    get value() { return FREEZE____header_global_5bb7e11acd718947; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:673
export const SHRINKER____header_global_1df741dbdbfd09da = ((((((2556) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e4fad0e2ac2c386c59414420() {
  return __cxx_static_address_e4fad0e2ac2c386c59414420.reference || (__cxx_static_address_e4fad0e2ac2c386c59414420.reference = {
    __cReference: true,
    get value() { return SHRINKER____header_global_1df741dbdbfd09da; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:674
export const HANDHOLDINGLASER____header_global_3dbfadd626441267 = ((((((2563) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1f2450c7098d8f5d948aa563() {
  return __cxx_static_address_1f2450c7098d8f5d948aa563.reference || (__cxx_static_address_1f2450c7098d8f5d948aa563.reference = {
    __cReference: true,
    get value() { return HANDHOLDINGLASER____header_global_3dbfadd626441267; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:675
export const TRIPBOMB____header_global_27794085d9df66ca = ((((((2566) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9b793b5a47207b4be12eca68() {
  return __cxx_static_address_9b793b5a47207b4be12eca68.reference || (__cxx_static_address_9b793b5a47207b4be12eca68.reference = {
    __cReference: true,
    get value() { return TRIPBOMB____header_global_27794085d9df66ca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:676
export const LASERLINE____header_global_09fcbc639c113401 = ((((((2567) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2add438563572bee04b77955() {
  return __cxx_static_address_2add438563572bee04b77955.reference || (__cxx_static_address_2add438563572bee04b77955.reference = {
    __cReference: true,
    get value() { return LASERLINE____header_global_09fcbc639c113401; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:677
export const HANDHOLDINGACCESS____header_global_000f65f10e41645b = ((((((2568) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_60bb28164824572fb73e862c() {
  return __cxx_static_address_60bb28164824572fb73e862c.reference || (__cxx_static_address_60bb28164824572fb73e862c.reference = {
    __cReference: true,
    get value() { return HANDHOLDINGACCESS____header_global_000f65f10e41645b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:678
export const HANDREMOTE____header_global_c89032e4aba9a9e5 = ((((((2570) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5f88eea5bb62d742c6925fd8() {
  return __cxx_static_address_5f88eea5bb62d742c6925fd8.reference || (__cxx_static_address_5f88eea5bb62d742c6925fd8.reference = {
    __cReference: true,
    get value() { return HANDREMOTE____header_global_c89032e4aba9a9e5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:679
export const HANDTHROW____header_global_51bf847d5673f876 = ((((((2573) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_41da1b7caa5cb7c73e81bf17() {
  return __cxx_static_address_41da1b7caa5cb7c73e81bf17.reference || (__cxx_static_address_41da1b7caa5cb7c73e81bf17.reference = {
    __cReference: true,
    get value() { return HANDTHROW____header_global_51bf847d5673f876; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:680
export const TIP____header_global_00e014ee5817d8c4 = ((((((2576) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8ecd1e0ef3c39299efa936d3() {
  return __cxx_static_address_8ecd1e0ef3c39299efa936d3.reference || (__cxx_static_address_8ecd1e0ef3c39299efa936d3.reference = {
    __cReference: true,
    get value() { return TIP____header_global_00e014ee5817d8c4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:681
export const SCUBAMASK____header_global_218dd9c6465ff61a = ((((((2581) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_caed7568bbf75037b4cc5131() {
  return __cxx_static_address_caed7568bbf75037b4cc5131.reference || (__cxx_static_address_caed7568bbf75037b4cc5131.reference = {
    __cReference: true,
    get value() { return SCUBAMASK____header_global_218dd9c6465ff61a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:682
export const FORCESPHERE____header_global_fd90b31308aea057 = ((((((2590) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fe527076e53528e973b3fba8() {
  return __cxx_static_address_fe527076e53528e973b3fba8.reference || (__cxx_static_address_fe527076e53528e973b3fba8.reference = {
    __cReference: true,
    get value() { return FORCESPHERE____header_global_fd90b31308aea057; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:683
export const SHOTSPARK1____header_global_442d81031e1715ae = ((((((2595) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9f9301e5939150c4560aac2c() {
  return __cxx_static_address_9f9301e5939150c4560aac2c.reference || (__cxx_static_address_9f9301e5939150c4560aac2c.reference = {
    __cReference: true,
    get value() { return SHOTSPARK1____header_global_442d81031e1715ae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:684
export const RPG____header_global_913ef88cdb1fac19 = ((((((2605) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5f5541ea9be35c63d1acee63() {
  return __cxx_static_address_5f5541ea9be35c63d1acee63.reference || (__cxx_static_address_5f5541ea9be35c63d1acee63.reference = {
    __cReference: true,
    get value() { return RPG____header_global_913ef88cdb1fac19; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:685
export const LASERSITE____header_global_ebd61c5b3d0a32f4 = ((((((2612) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3ebae4ed39f207cf64787ff4() {
  return __cxx_static_address_3ebae4ed39f207cf64787ff4.reference || (__cxx_static_address_3ebae4ed39f207cf64787ff4.reference = {
    __cReference: true,
    get value() { return LASERSITE____header_global_ebd61c5b3d0a32f4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:686
export const SHOTGUN____header_global_a50ddffd156f6342 = ((((((2613) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_773d49d7be8f0cae857776d5() {
  return __cxx_static_address_773d49d7be8f0cae857776d5.reference || (__cxx_static_address_773d49d7be8f0cae857776d5.reference = {
    __cReference: true,
    get value() { return SHOTGUN____header_global_a50ddffd156f6342; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:687
export const BOSS1____header_global_ab39a4032f54c3c1 = ((((((2630) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9c99e0aff64831ccbd7e5925() {
  return __cxx_static_address_9c99e0aff64831ccbd7e5925.reference || (__cxx_static_address_9c99e0aff64831ccbd7e5925.reference = {
    __cReference: true,
    get value() { return BOSS1____header_global_ab39a4032f54c3c1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:688
export const BOSS1STAYPUT____header_global_9491899026ba822c = ((((((2631) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9d9de495e3d534db5ed9fea4() {
  return __cxx_static_address_9d9de495e3d534db5ed9fea4.reference || (__cxx_static_address_9d9de495e3d534db5ed9fea4.reference = {
    __cReference: true,
    get value() { return BOSS1STAYPUT____header_global_9491899026ba822c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:689
export const BOSS1SHOOT____header_global_dc78f60a20dd91c6 = ((((((2660) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9215d3c5a63dc1aa37fd4573() {
  return __cxx_static_address_9215d3c5a63dc1aa37fd4573.reference || (__cxx_static_address_9215d3c5a63dc1aa37fd4573.reference = {
    __cReference: true,
    get value() { return BOSS1SHOOT____header_global_dc78f60a20dd91c6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:690
export const BOSS1LOB____header_global_a9919ea99ced4749 = ((((((2670) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b6e1d2e8b099bd7aa58ca0e5() {
  return __cxx_static_address_b6e1d2e8b099bd7aa58ca0e5.reference || (__cxx_static_address_b6e1d2e8b099bd7aa58ca0e5.reference = {
    __cReference: true,
    get value() { return BOSS1LOB____header_global_a9919ea99ced4749; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:691
export const BOSSTOP____header_global_ce37c9e3ec3f1d55 = ((((((2696) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e324a447018178be5317ce07() {
  return __cxx_static_address_e324a447018178be5317ce07.reference || (__cxx_static_address_e324a447018178be5317ce07.reference = {
    __cReference: true,
    get value() { return BOSSTOP____header_global_ce37c9e3ec3f1d55; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:692
export const BOSS2____header_global_7d10a34adb7782c3 = ((((((2710) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1b991181f22486463651cdd2() {
  return __cxx_static_address_1b991181f22486463651cdd2.reference || (__cxx_static_address_1b991181f22486463651cdd2.reference = {
    __cReference: true,
    get value() { return BOSS2____header_global_7d10a34adb7782c3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:693
export const BOSS3____header_global_820dc0f4e78e5974 = ((((((2760) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_45f36865aeef2a2a50a552f0() {
  return __cxx_static_address_45f36865aeef2a2a50a552f0.reference || (__cxx_static_address_45f36865aeef2a2a50a552f0.reference = {
    __cReference: true,
    get value() { return BOSS3____header_global_820dc0f4e78e5974; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:694
export const SPINNINGNUKEICON____header_global_15b4cd499d8f3eac = ((((((2813) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5fef0161b7ef158a096beee0() {
  return __cxx_static_address_5fef0161b7ef158a096beee0.reference || (__cxx_static_address_5fef0161b7ef158a096beee0.reference = {
    __cReference: true,
    get value() { return SPINNINGNUKEICON____header_global_15b4cd499d8f3eac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:695
export const SMALLFNTCURSOR____header_global_b18f49692f66d796 = ((((((2821) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d12902ba0e7b9835156ed3ce() {
  return __cxx_static_address_d12902ba0e7b9835156ed3ce.reference || (__cxx_static_address_d12902ba0e7b9835156ed3ce.reference = {
    __cReference: true,
    get value() { return SMALLFNTCURSOR____header_global_b18f49692f66d796; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:696
export const STARTALPHANUM____header_global_f45faae95c4ca130 = ((((((2822) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_694936a8d6dd78458978bdec() {
  return __cxx_static_address_694936a8d6dd78458978bdec.reference || (__cxx_static_address_694936a8d6dd78458978bdec.reference = {
    __cReference: true,
    get value() { return STARTALPHANUM____header_global_f45faae95c4ca130; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:697
export const ENDALPHANUM____header_global_3a71a45229e1869c = ((((((2915) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_091e0134262e480e0211209e() {
  return __cxx_static_address_091e0134262e480e0211209e.reference || (__cxx_static_address_091e0134262e480e0211209e.reference = {
    __cReference: true,
    get value() { return ENDALPHANUM____header_global_3a71a45229e1869c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:698
export const BIGALPHANUM____header_global_c9366cb01aed70c7 = ((((((2940) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_651c96f2f2bff2d4b108a7ec() {
  return __cxx_static_address_651c96f2f2bff2d4b108a7ec.reference || (__cxx_static_address_651c96f2f2bff2d4b108a7ec.reference = {
    __cReference: true,
    get value() { return BIGALPHANUM____header_global_c9366cb01aed70c7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:699
export const BIGPERIOD____header_global_fb12024ab9c4f1bb = ((((((3002) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_765cbd03325baa12318b78c3() {
  return __cxx_static_address_765cbd03325baa12318b78c3.reference || (__cxx_static_address_765cbd03325baa12318b78c3.reference = {
    __cReference: true,
    get value() { return BIGPERIOD____header_global_fb12024ab9c4f1bb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:700
export const BIGCOMMA____header_global_39802e3cc4672b37 = ((((((3003) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c9f1bbfae729e557b345712d() {
  return __cxx_static_address_c9f1bbfae729e557b345712d.reference || (__cxx_static_address_c9f1bbfae729e557b345712d.reference = {
    __cReference: true,
    get value() { return BIGCOMMA____header_global_39802e3cc4672b37; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:701
export const BIGX____header_global_2377c9e6c518570c = ((((((3004) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e0b10c7e580cee73b3d653b5() {
  return __cxx_static_address_e0b10c7e580cee73b3d653b5.reference || (__cxx_static_address_e0b10c7e580cee73b3d653b5.reference = {
    __cReference: true,
    get value() { return BIGX____header_global_2377c9e6c518570c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:702
export const BIGQ____header_global_2efa5eacee63191b = ((((((3005) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_66ee76cd42581d7d800bc9b3() {
  return __cxx_static_address_66ee76cd42581d7d800bc9b3.reference || (__cxx_static_address_66ee76cd42581d7d800bc9b3.reference = {
    __cReference: true,
    get value() { return BIGQ____header_global_2efa5eacee63191b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:703
export const BIGSEMI____header_global_577a212ad6f05950 = ((((((3006) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_387147ea3c8cde710986a91b() {
  return __cxx_static_address_387147ea3c8cde710986a91b.reference || (__cxx_static_address_387147ea3c8cde710986a91b.reference = {
    __cReference: true,
    get value() { return BIGSEMI____header_global_577a212ad6f05950; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:704
export const BIGCOLIN____header_global_97a34ee869de24e7 = ((((((3007) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9cceea310d765401cbfeb02c() {
  return __cxx_static_address_9cceea310d765401cbfeb02c.reference || (__cxx_static_address_9cceea310d765401cbfeb02c.reference = {
    __cReference: true,
    get value() { return BIGCOLIN____header_global_97a34ee869de24e7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:705
export const THREEBYFIVE____header_global_cbda34d1a537116b = ((((((3010) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6eee7c227ee4880e601788fd() {
  return __cxx_static_address_6eee7c227ee4880e601788fd.reference || (__cxx_static_address_6eee7c227ee4880e601788fd.reference = {
    __cReference: true,
    get value() { return THREEBYFIVE____header_global_cbda34d1a537116b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:706
export const BIGAPPOS____header_global_4ff53215f821f315 = ((((((3022) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1a1fe24af38cad09bf9f8a3b() {
  return __cxx_static_address_1a1fe24af38cad09bf9f8a3b.reference || (__cxx_static_address_1a1fe24af38cad09bf9f8a3b.reference = {
    __cReference: true,
    get value() { return BIGAPPOS____header_global_4ff53215f821f315; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:707
export const MINIFONT____header_global_36a6cd74b2aa88c7 = ((((((3072) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2dac837bb9cffac86a502b20() {
  return __cxx_static_address_2dac837bb9cffac86a502b20.reference || (__cxx_static_address_2dac837bb9cffac86a502b20.reference = {
    __cReference: true,
    get value() { return MINIFONT____header_global_36a6cd74b2aa88c7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:708
export const RESPAWNMARKERRED____header_global_c62760938ac614d1 = ((((((3190) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_363d6e404845c7c6c4ed1681() {
  return __cxx_static_address_363d6e404845c7c6c4ed1681.reference || (__cxx_static_address_363d6e404845c7c6c4ed1681.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERRED____header_global_c62760938ac614d1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:709
export const RESPAWNMARKERYELLOW____header_global_f81a18b1ee2c3be6 = ((((((3200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4633e96bd6b9b22b01db5986() {
  return __cxx_static_address_4633e96bd6b9b22b01db5986.reference || (__cxx_static_address_4633e96bd6b9b22b01db5986.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERYELLOW____header_global_f81a18b1ee2c3be6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:710
export const RESPAWNMARKERGREEN____header_global_8eaaba8c6b10feb4 = ((((((3210) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d4d8f4011cb93034518bd860() {
  return __cxx_static_address_d4d8f4011cb93034518bd860.reference || (__cxx_static_address_d4d8f4011cb93034518bd860.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERGREEN____header_global_8eaaba8c6b10feb4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:711
export const BONUSSCREEN____header_global_58fa2d6478469e99 = ((((((3240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6f3ad19cccad0c4cd56e6cda() {
  return __cxx_static_address_6f3ad19cccad0c4cd56e6cda.reference || (__cxx_static_address_6f3ad19cccad0c4cd56e6cda.reference = {
    __cReference: true,
    get value() { return BONUSSCREEN____header_global_58fa2d6478469e99; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:712
export const VIEWBORDER____header_global_40bee9f053964f2a = ((((((3250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ad05ac67429aaaaeeaa5138a() {
  return __cxx_static_address_ad05ac67429aaaaeeaa5138a.reference || (__cxx_static_address_ad05ac67429aaaaeeaa5138a.reference = {
    __cReference: true,
    get value() { return VIEWBORDER____header_global_40bee9f053964f2a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:713
export const VICTORY1____header_global_4cad1ca630933b8c = ((((((3260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_16ebb620f533c4783c4d6d44() {
  return __cxx_static_address_16ebb620f533c4783c4d6d44.reference || (__cxx_static_address_16ebb620f533c4783c4d6d44.reference = {
    __cReference: true,
    get value() { return VICTORY1____header_global_4cad1ca630933b8c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:714
export const ORDERING____header_global_8774b48c7259f4c9 = ((((((3270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ac74ef170c8b0518b0284fd7() {
  return __cxx_static_address_ac74ef170c8b0518b0284fd7.reference || (__cxx_static_address_ac74ef170c8b0518b0284fd7.reference = {
    __cReference: true,
    get value() { return ORDERING____header_global_8774b48c7259f4c9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:715
export const TEXTSTORY____header_global_b41c2c68b4c6a167 = ((((((3280) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_118e76b91d303578887e7b5c() {
  return __cxx_static_address_118e76b91d303578887e7b5c.reference || (__cxx_static_address_118e76b91d303578887e7b5c.reference = {
    __cReference: true,
    get value() { return TEXTSTORY____header_global_b41c2c68b4c6a167; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:716
export const LOADSCREEN____header_global_dbf0fb93068f6b54 = ((((((3281) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1dfba5aa8e30e490d70b7e69() {
  return __cxx_static_address_1dfba5aa8e30e490d70b7e69.reference || (__cxx_static_address_1dfba5aa8e30e490d70b7e69.reference = {
    __cReference: true,
    get value() { return LOADSCREEN____header_global_dbf0fb93068f6b54; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:717
export const BORNTOBEWILDSCREEN____header_global_98f34d8835b86780 = ((((((3370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_03b49ff58e2d072e99dd1e22() {
  return __cxx_static_address_03b49ff58e2d072e99dd1e22.reference || (__cxx_static_address_03b49ff58e2d072e99dd1e22.reference = {
    __cReference: true,
    get value() { return BORNTOBEWILDSCREEN____header_global_98f34d8835b86780; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:718
export const BLIMP____header_global_cfe4d55c8a9cef4c = ((((((3400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_388a17d4602b368d8446cfe0() {
  return __cxx_static_address_388a17d4602b368d8446cfe0.reference || (__cxx_static_address_388a17d4602b368d8446cfe0.reference = {
    __cReference: true,
    get value() { return BLIMP____header_global_cfe4d55c8a9cef4c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:719
export const FEM9____header_global_0e97c52736126ddd = ((((((3450) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_beef1347f29851e5679674ca() {
  return __cxx_static_address_beef1347f29851e5679674ca.reference || (__cxx_static_address_beef1347f29851e5679674ca.reference = {
    __cReference: true,
    get value() { return FEM9____header_global_0e97c52736126ddd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:720
export const FRAMEEFFECT1_13____header_global_5c28b99b40563192 = ((((((3999) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3507a12edea23ec1937c3541() {
  return __cxx_static_address_3507a12edea23ec1937c3541.reference || (__cxx_static_address_3507a12edea23ec1937c3541.reference = {
    __cReference: true,
    get value() { return FRAMEEFFECT1_13____header_global_5c28b99b40563192; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:721
export const FRAMEEFFECT1____header_global_a0cac564365961fb = ((((((4095) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_13394e2fe5ec52eb0ffb2b3f() {
  return __cxx_static_address_13394e2fe5ec52eb0ffb2b3f.reference || (__cxx_static_address_13394e2fe5ec52eb0ffb2b3f.reference = {
    __cReference: true,
    get value() { return FRAMEEFFECT1____header_global_a0cac564365961fb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:722
export const PANNEL3____header_global_eff93c90e55db491 = ((((((4099) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_30fcb3c1c8b168203c73254c() {
  return __cxx_static_address_30fcb3c1c8b168203c73254c.reference || (__cxx_static_address_30fcb3c1c8b168203c73254c.reference = {
    __cReference: true,
    get value() { return PANNEL3____header_global_eff93c90e55db491; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:723
export const SCREENBREAK14____header_global_450deaa9c59d18f6 = ((((((4120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b824b3f3cc92446db741a0d7() {
  return __cxx_static_address_b824b3f3cc92446db741a0d7.reference || (__cxx_static_address_b824b3f3cc92446db741a0d7.reference = {
    __cReference: true,
    get value() { return SCREENBREAK14____header_global_450deaa9c59d18f6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:724
export const SCREENBREAK15____header_global_84ad3889d2b29f53 = ((((((4123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9de8ea33d362e909468b078d() {
  return __cxx_static_address_9de8ea33d362e909468b078d.reference || (__cxx_static_address_9de8ea33d362e909468b078d.reference = {
    __cReference: true,
    get value() { return SCREENBREAK15____header_global_84ad3889d2b29f53; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:725
export const SCREENBREAK19____header_global_b3f47cf04ccbf50e = ((((((4125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3c076383867199871ca3de3f() {
  return __cxx_static_address_3c076383867199871ca3de3f.reference || (__cxx_static_address_3c076383867199871ca3de3f.reference = {
    __cReference: true,
    get value() { return SCREENBREAK19____header_global_b3f47cf04ccbf50e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:726
export const SCREENBREAK16____header_global_5bf1ed1360e77ed9 = ((((((4127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c4d8e62c7e2297913d9f3523() {
  return __cxx_static_address_c4d8e62c7e2297913d9f3523.reference || (__cxx_static_address_c4d8e62c7e2297913d9f3523.reference = {
    __cReference: true,
    get value() { return SCREENBREAK16____header_global_5bf1ed1360e77ed9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:727
export const SCREENBREAK17____header_global_aaec7e9ad74975e8 = ((((((4128) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_afb675cec676bf72a15b32fe() {
  return __cxx_static_address_afb675cec676bf72a15b32fe.reference || (__cxx_static_address_afb675cec676bf72a15b32fe.reference = {
    __cReference: true,
    get value() { return SCREENBREAK17____header_global_aaec7e9ad74975e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:728
export const SCREENBREAK18____header_global_887e463e57a3052b = ((((((4129) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e1b7b03fa74e1738aeaa50a7() {
  return __cxx_static_address_e1b7b03fa74e1738aeaa50a7.reference || (__cxx_static_address_e1b7b03fa74e1738aeaa50a7.reference = {
    __cReference: true,
    get value() { return SCREENBREAK18____header_global_887e463e57a3052b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:729
export const W_TECHWALL11____header_global_9c46439bf4db72dc = ((((((4130) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2875f0a3ce552880e267cf08() {
  return __cxx_static_address_2875f0a3ce552880e267cf08.reference || (__cxx_static_address_2875f0a3ce552880e267cf08.reference = {
    __cReference: true,
    get value() { return W_TECHWALL11____header_global_9c46439bf4db72dc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:730
export const W_TECHWALL12____header_global_b6b30766144d6a50 = ((((((4131) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6f93de06e4f6cc8f2729219b() {
  return __cxx_static_address_6f93de06e4f6cc8f2729219b.reference || (__cxx_static_address_6f93de06e4f6cc8f2729219b.reference = {
    __cReference: true,
    get value() { return W_TECHWALL12____header_global_b6b30766144d6a50; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:731
export const W_TECHWALL13____header_global_b53bdfa64106ed97 = ((((((4132) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_61bf86ffe21a85d769e7cf69() {
  return __cxx_static_address_61bf86ffe21a85d769e7cf69.reference || (__cxx_static_address_61bf86ffe21a85d769e7cf69.reference = {
    __cReference: true,
    get value() { return W_TECHWALL13____header_global_b53bdfa64106ed97; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:732
export const W_TECHWALL14____header_global_a28c921ae62514ea = ((((((4133) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_abfc355fef7afe2ab9f34a7a() {
  return __cxx_static_address_abfc355fef7afe2ab9f34a7a.reference || (__cxx_static_address_abfc355fef7afe2ab9f34a7a.reference = {
    __cReference: true,
    get value() { return W_TECHWALL14____header_global_a28c921ae62514ea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:733
export const W_TECHWALL5____header_global_af1c2bb702122eff = ((((((4134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_14f25fd3740f26ed987f9acc() {
  return __cxx_static_address_14f25fd3740f26ed987f9acc.reference || (__cxx_static_address_14f25fd3740f26ed987f9acc.reference = {
    __cReference: true,
    get value() { return W_TECHWALL5____header_global_af1c2bb702122eff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:734
export const W_TECHWALL6____header_global_2f700385ee89ebf1 = ((((((4136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6fd5bb0075e393ffc95e5545() {
  return __cxx_static_address_6fd5bb0075e393ffc95e5545.reference || (__cxx_static_address_6fd5bb0075e393ffc95e5545.reference = {
    __cReference: true,
    get value() { return W_TECHWALL6____header_global_2f700385ee89ebf1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:735
export const W_TECHWALL7____header_global_0ea605735f63b4b0 = ((((((4138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_08fb22d653abb142cc2a80ad() {
  return __cxx_static_address_08fb22d653abb142cc2a80ad.reference || (__cxx_static_address_08fb22d653abb142cc2a80ad.reference = {
    __cReference: true,
    get value() { return W_TECHWALL7____header_global_0ea605735f63b4b0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:736
export const W_TECHWALL8____header_global_b18f6b58951f67ef = ((((((4140) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e1d098cc458e8e26e9178c95() {
  return __cxx_static_address_e1d098cc458e8e26e9178c95.reference || (__cxx_static_address_e1d098cc458e8e26e9178c95.reference = {
    __cReference: true,
    get value() { return W_TECHWALL8____header_global_b18f6b58951f67ef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:737
export const W_TECHWALL9____header_global_f6d9bd67f436ebdf = ((((((4142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_207fa8c1909e9a5c0678e70e() {
  return __cxx_static_address_207fa8c1909e9a5c0678e70e.reference || (__cxx_static_address_207fa8c1909e9a5c0678e70e.reference = {
    __cReference: true,
    get value() { return W_TECHWALL9____header_global_f6d9bd67f436ebdf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:738
export const BPANNEL3____header_global_4a21f096c7314983 = ((((((4100) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_87d5bceb124fbc4eb0458fb7() {
  return __cxx_static_address_87d5bceb124fbc4eb0458fb7.reference || (__cxx_static_address_87d5bceb124fbc4eb0458fb7.reference = {
    __cReference: true,
    get value() { return BPANNEL3____header_global_4a21f096c7314983; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:739
export const W_HITTECHWALL16____header_global_d4abb623b7f62d27 = ((((((4144) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b22ad7f65959f19bf972f4b3() {
  return __cxx_static_address_b22ad7f65959f19bf972f4b3.reference || (__cxx_static_address_b22ad7f65959f19bf972f4b3.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL16____header_global_d4abb623b7f62d27; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:740
export const W_HITTECHWALL10____header_global_d0e6d51ee8ee3edf = ((((((4145) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5dbab4243a547db4c862f911() {
  return __cxx_static_address_5dbab4243a547db4c862f911.reference || (__cxx_static_address_5dbab4243a547db4c862f911.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL10____header_global_d0e6d51ee8ee3edf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:741
export const W_HITTECHWALL15____header_global_c989db5556a336c6 = ((((((4147) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b80f6a61941e78c14b21071d() {
  return __cxx_static_address_b80f6a61941e78c14b21071d.reference || (__cxx_static_address_b80f6a61941e78c14b21071d.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL15____header_global_c989db5556a336c6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:742
export const W_MILKSHELF____header_global_7b932b38f7f56fd4 = ((((((4181) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ac863deb1c484bd7ef512077() {
  return __cxx_static_address_ac863deb1c484bd7ef512077.reference || (__cxx_static_address_ac863deb1c484bd7ef512077.reference = {
    __cReference: true,
    get value() { return W_MILKSHELF____header_global_7b932b38f7f56fd4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:743
export const W_MILKSHELFBROKE____header_global_7aec75c8e2e8be3c = ((((((4203) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b104df82f742bb1b6ae424ad() {
  return __cxx_static_address_b104df82f742bb1b6ae424ad.reference || (__cxx_static_address_b104df82f742bb1b6ae424ad.reference = {
    __cReference: true,
    get value() { return W_MILKSHELFBROKE____header_global_7aec75c8e2e8be3c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:744
export const PURPLELAVA____header_global_4cfa255deb1f9d97 = ((((((4240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_76730b226064d8c956ac1047() {
  return __cxx_static_address_76730b226064d8c956ac1047.reference || (__cxx_static_address_76730b226064d8c956ac1047.reference = {
    __cReference: true,
    get value() { return PURPLELAVA____header_global_4cfa255deb1f9d97; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:745
export const TARGET____header_global_04d8c817593fc944 = ((((((4359) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7aadd987520fb4b6c4b95c86() {
  return __cxx_static_address_7aadd987520fb4b6c4b95c86.reference || (__cxx_static_address_7aadd987520fb4b6c4b95c86.reference = {
    __cReference: true,
    get value() { return TARGET____header_global_04d8c817593fc944; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:746
export const DUCK____header_global_e0231e45e5cad463 = ((((((4361) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_de6eb96ada1655c38b716c41() {
  return __cxx_static_address_de6eb96ada1655c38b716c41.reference || (__cxx_static_address_de6eb96ada1655c38b716c41.reference = {
    __cReference: true,
    get value() { return DUCK____header_global_e0231e45e5cad463; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:747
export const PUKE____header_global_0049eb14b455c117 = ((((((4389) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5f1f20cc7317733b27e35b96() {
  return __cxx_static_address_5f1f20cc7317733b27e35b96.reference || (__cxx_static_address_5f1f20cc7317733b27e35b96.reference = {
    __cReference: true,
    get value() { return PUKE____header_global_0049eb14b455c117; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:748
export const DOORTILE23____header_global_0058c5e142b52159 = ((((((4391) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e300671f87ebd0a373e2c1f1() {
  return __cxx_static_address_e300671f87ebd0a373e2c1f1.reference || (__cxx_static_address_e300671f87ebd0a373e2c1f1.reference = {
    __cReference: true,
    get value() { return DOORTILE23____header_global_0058c5e142b52159; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:749
export const SPEAKER____header_global_7dcd058d99c10fd0 = ((((((4397) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f088898352c6bb93919b2e6e() {
  return __cxx_static_address_f088898352c6bb93919b2e6e.reference || (__cxx_static_address_f088898352c6bb93919b2e6e.reference = {
    __cReference: true,
    get value() { return SPEAKER____header_global_7dcd058d99c10fd0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:750
export const MAIL____header_global_0d96cc87631819b0 = ((((((4410) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6fd1c172cd908c73f560d801() {
  return __cxx_static_address_6fd1c172cd908c73f560d801.reference || (__cxx_static_address_6fd1c172cd908c73f560d801.reference = {
    __cReference: true,
    get value() { return MAIL____header_global_0d96cc87631819b0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:751
export const HOTMEAT____header_global_336c7e5aab504919 = ((((((4427) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8fe5c414591ca8e6bdc428c1() {
  return __cxx_static_address_8fe5c414591ca8e6bdc428c1.reference || (__cxx_static_address_8fe5c414591ca8e6bdc428c1.reference = {
    __cReference: true,
    get value() { return HOTMEAT____header_global_336c7e5aab504919; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:752
export const TRIPODCAMERA____header_global_841bf22467c81811 = ((((((4444) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2911d22e3e9e07e72ca3c53a() {
  return __cxx_static_address_2911d22e3e9e07e72ca3c53a.reference || (__cxx_static_address_2911d22e3e9e07e72ca3c53a.reference = {
    __cReference: true,
    get value() { return TRIPODCAMERA____header_global_841bf22467c81811; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:753
export const PAPER____header_global_d5c80a2a827e5b3f = ((((((4460) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2dd32f3290cea2df79fae692() {
  return __cxx_static_address_2dd32f3290cea2df79fae692.reference || (__cxx_static_address_2dd32f3290cea2df79fae692.reference = {
    __cReference: true,
    get value() { return PAPER____header_global_d5c80a2a827e5b3f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:754
export const GENERICPOLE2____header_global_b0362628ff8925bd = ((((((4465) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c22d55ae4e5ae6923585b35c() {
  return __cxx_static_address_c22d55ae4e5ae6923585b35c.reference || (__cxx_static_address_c22d55ae4e5ae6923585b35c.reference = {
    __cReference: true,
    get value() { return GENERICPOLE2____header_global_b0362628ff8925bd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:755
export const XXXSTACY____header_global_3112bf1707621875 = ((((((4470) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_966961f60c4cbd6eedb99ea9() {
  return __cxx_static_address_966961f60c4cbd6eedb99ea9.reference || (__cxx_static_address_966961f60c4cbd6eedb99ea9.reference = {
    __cReference: true,
    get value() { return XXXSTACY____header_global_3112bf1707621875; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:756
export const LETTER____header_global_1958cc6d9cd1cbb5 = ((((((4502) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8400aeab66db4df54bba8385() {
  return __cxx_static_address_8400aeab66db4df54bba8385.reference || (__cxx_static_address_8400aeab66db4df54bba8385.reference = {
    __cReference: true,
    get value() { return LETTER____header_global_1958cc6d9cd1cbb5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:757
export const SIDEBOLT1____header_global_5d281031467bb773 = ((((((4525) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6bfa07673f0d3d3bb79da6e5() {
  return __cxx_static_address_6bfa07673f0d3d3bb79da6e5.reference || (__cxx_static_address_6bfa07673f0d3d3bb79da6e5.reference = {
    __cReference: true,
    get value() { return SIDEBOLT1____header_global_5d281031467bb773; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:758
export const FOODOBJECT16____header_global_bd9385297bc2e4c5 = ((((((4545) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_42acd1da42ce2840c4e48c8e() {
  return __cxx_static_address_42acd1da42ce2840c4e48c8e.reference || (__cxx_static_address_42acd1da42ce2840c4e48c8e.reference = {
    __cReference: true,
    get value() { return FOODOBJECT16____header_global_bd9385297bc2e4c5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:759
export const TAMPON____header_global_1fc3729a7edfe03a = ((((((4557) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f738af62c31e332980317cfa() {
  return __cxx_static_address_f738af62c31e332980317cfa.reference || (__cxx_static_address_f738af62c31e332980317cfa.reference = {
    __cReference: true,
    get value() { return TAMPON____header_global_1fc3729a7edfe03a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:760
export const CANWITHSOMETHING2____header_global_c83b2944368d9cc9 = ((((((4580) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_af37b88cd7b7f40c28282d92() {
  return __cxx_static_address_af37b88cd7b7f40c28282d92.reference || (__cxx_static_address_af37b88cd7b7f40c28282d92.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING2____header_global_c83b2944368d9cc9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:761
export const CANWITHSOMETHING3____header_global_2b0ee19845cc7b25 = ((((((4581) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e3d957dcfb007fcbcb87ed36() {
  return __cxx_static_address_e3d957dcfb007fcbcb87ed36.reference || (__cxx_static_address_e3d957dcfb007fcbcb87ed36.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING3____header_global_2b0ee19845cc7b25; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:762
export const CANWITHSOMETHING4____header_global_583632128687ed03 = ((((((4582) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_472caf23dd75ffe83849aa90() {
  return __cxx_static_address_472caf23dd75ffe83849aa90.reference || (__cxx_static_address_472caf23dd75ffe83849aa90.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING4____header_global_583632128687ed03; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:763
export const DOLPHIN1____header_global_411f7d70f5c31c15 = ((((((4591) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_994050c9d5a772d8a788dc50() {
  return __cxx_static_address_994050c9d5a772d8a788dc50.reference || (__cxx_static_address_994050c9d5a772d8a788dc50.reference = {
    __cReference: true,
    get value() { return DOLPHIN1____header_global_411f7d70f5c31c15; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:764
export const DOLPHIN2____header_global_603b34cb7408faa9 = ((((((4592) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b7a6c2475d9d86d9934c3e5c() {
  return __cxx_static_address_b7a6c2475d9d86d9934c3e5c.reference || (__cxx_static_address_b7a6c2475d9d86d9934c3e5c.reference = {
    __cReference: true,
    get value() { return DOLPHIN2____header_global_603b34cb7408faa9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:765
export const NEWBEAST____header_global_9aafc208697a0b13 = ((((((4610) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2b18ad12d1babedb85183650() {
  return __cxx_static_address_2b18ad12d1babedb85183650.reference || (__cxx_static_address_2b18ad12d1babedb85183650.reference = {
    __cReference: true,
    get value() { return NEWBEAST____header_global_9aafc208697a0b13; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:766
export const NEWBEASTSTAYPUT____header_global_3944005094d7223b = ((((((4611) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3ba830d8e67c1760361f1f49() {
  return __cxx_static_address_3ba830d8e67c1760361f1f49.reference || (__cxx_static_address_3ba830d8e67c1760361f1f49.reference = {
    __cReference: true,
    get value() { return NEWBEASTSTAYPUT____header_global_3944005094d7223b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:767
export const BOSS4____header_global_01057ec653561ea0 = ((((((4740) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7f3cbee88b925f1c741a9974() {
  return __cxx_static_address_7f3cbee88b925f1c741a9974.reference || (__cxx_static_address_7f3cbee88b925f1c741a9974.reference = {
    __cReference: true,
    get value() { return BOSS4____header_global_01057ec653561ea0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:768
export const BOSS4STAYPUT____header_global_b313490fc25150d6 = ((((((4741) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1ad6dd48d940d1aa273dce32() {
  return __cxx_static_address_1ad6dd48d940d1aa273dce32.reference || (__cxx_static_address_1ad6dd48d940d1aa273dce32.reference = {
    __cReference: true,
    get value() { return BOSS4STAYPUT____header_global_b313490fc25150d6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:769
export const FEM10____header_global_8b9ec11e5ea12649 = ((((((4864) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3214e0ec02e1afcc98fb9b00() {
  return __cxx_static_address_3214e0ec02e1afcc98fb9b00.reference || (__cxx_static_address_3214e0ec02e1afcc98fb9b00.reference = {
    __cReference: true,
    get value() { return FEM10____header_global_8b9ec11e5ea12649; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:770
export const TOUGHGAL____header_global_f60a055cb78b7d10 = ((((((4866) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_31386a78d9c6855a72ff8f8e() {
  return __cxx_static_address_31386a78d9c6855a72ff8f8e.reference || (__cxx_static_address_31386a78d9c6855a72ff8f8e.reference = {
    __cReference: true,
    get value() { return TOUGHGAL____header_global_f60a055cb78b7d10; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:771
export const MAN____header_global_badefae254639d1b = ((((((4871) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c0e56870d7aeda9dacd93384() {
  return __cxx_static_address_c0e56870d7aeda9dacd93384.reference || (__cxx_static_address_c0e56870d7aeda9dacd93384.reference = {
    __cReference: true,
    get value() { return MAN____header_global_badefae254639d1b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:772
export const MAN2____header_global_b26fb46e6eb8d203 = ((((((4872) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4fa7dd8207b9d65db2d3a5c0() {
  return __cxx_static_address_4fa7dd8207b9d65db2d3a5c0.reference || (__cxx_static_address_4fa7dd8207b9d65db2d3a5c0.reference = {
    __cReference: true,
    get value() { return MAN2____header_global_b26fb46e6eb8d203; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:773
export const WOMAN____header_global_3a13e7ef0b509446 = ((((((4874) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7283e3e840a66654f88370e8() {
  return __cxx_static_address_7283e3e840a66654f88370e8.reference || (__cxx_static_address_7283e3e840a66654f88370e8.reference = {
    __cReference: true,
    get value() { return WOMAN____header_global_3a13e7ef0b509446; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:774
export const NATURALLIGHTNING____header_global_3cdfa72bbbd4df3d = ((((((4890) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e0ab3bdfbeec38fa8c8b832a() {
  return __cxx_static_address_e0ab3bdfbeec38fa8c8b832a.reference || (__cxx_static_address_e0ab3bdfbeec38fa8c8b832a.reference = {
    __cReference: true,
    get value() { return NATURALLIGHTNING____header_global_3cdfa72bbbd4df3d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:775
export const WEATHERWARN____header_global_c18518f966d38b08 = ((((((4893) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c9d37644c121a7077d98ba2b() {
  return __cxx_static_address_c9d37644c121a7077d98ba2b.reference || (__cxx_static_address_c9d37644c121a7077d98ba2b.reference = {
    __cReference: true,
    get value() { return WEATHERWARN____header_global_c18518f966d38b08; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:776
export const DUKETAG____header_global_f64c68dcdf234e2d = ((((((4900) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_065bac504b84347bd171b083() {
  return __cxx_static_address_065bac504b84347bd171b083.reference || (__cxx_static_address_065bac504b84347bd171b083.reference = {
    __cReference: true,
    get value() { return DUKETAG____header_global_f64c68dcdf234e2d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:777
export const SIGN1____header_global_78a5a8f98000e5bb = ((((((4909) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c733de563ccb1ba0f28a9dc5() {
  return __cxx_static_address_c733de563ccb1ba0f28a9dc5.reference || (__cxx_static_address_c733de563ccb1ba0f28a9dc5.reference = {
    __cReference: true,
    get value() { return SIGN1____header_global_78a5a8f98000e5bb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:778
export const SIGN2____header_global_4bd681b79d8aae27 = ((((((4912) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2970fe857b9d8f2e1b4373ca() {
  return __cxx_static_address_2970fe857b9d8f2e1b4373ca.reference || (__cxx_static_address_2970fe857b9d8f2e1b4373ca.reference = {
    __cReference: true,
    get value() { return SIGN2____header_global_4bd681b79d8aae27; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:779
export const JURYGUY____header_global_9ff425de552d4457 = ((((((4943) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a56325b17ee076171c83fc9c() {
  return __cxx_static_address_a56325b17ee076171c83fc9c.reference || (__cxx_static_address_a56325b17ee076171c83fc9c.reference = {
    __cReference: true,
    get value() { return JURYGUY____header_global_9ff425de552d4457; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:780
export const WIDESCREENSTATUSBAR____header_global_fc9c06e76d67af8c = ((((((5120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8fee684ab3d88540de052a34() {
  return __cxx_static_address_8fee684ab3d88540de052a34.reference || (__cxx_static_address_8fee684ab3d88540de052a34.reference = {
    __cReference: true,
    get value() { return WIDESCREENSTATUSBAR____header_global_fc9c06e76d67af8c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:781
export const RPGGUNWIDE____header_global_6b672db6bcf06dd3 = ((((((5121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_39845934193cef59035d9648() {
  return __cxx_static_address_39845934193cef59035d9648.reference || (__cxx_static_address_39845934193cef59035d9648.reference = {
    __cReference: true,
    get value() { return RPGGUNWIDE____header_global_6b672db6bcf06dd3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:782
export const FIRSTGUNRELOADWIDE____header_global_4462308ab393fa19 = ((((((5122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_88f36c30e8fa6a3dc6b48053() {
  return __cxx_static_address_88f36c30e8fa6a3dc6b48053.reference || (__cxx_static_address_88f36c30e8fa6a3dc6b48053.reference = {
    __cReference: true,
    get value() { return FIRSTGUNRELOADWIDE____header_global_4462308ab393fa19; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:783
export const FREEZEWIDE____header_global_8b9ab28f157d44df = ((((((5123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ef00656c4fd4697ca785cabd() {
  return __cxx_static_address_ef00656c4fd4697ca785cabd.reference || (__cxx_static_address_ef00656c4fd4697ca785cabd.reference = {
    __cReference: true,
    get value() { return FREEZEWIDE____header_global_8b9ab28f157d44df; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:784
export const FREEZEFIREWIDE____header_global_1b5b1847535e0818 = ((((((5124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_68ac02e3b1cceb0b38a97577() {
  return __cxx_static_address_68ac02e3b1cceb0b38a97577.reference || (__cxx_static_address_68ac02e3b1cceb0b38a97577.reference = {
    __cReference: true,
    get value() { return FREEZEFIREWIDE____header_global_1b5b1847535e0818; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:785
export const SHRINKERWIDE____header_global_318d1ca7154c68ca = ((((((5127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_19c5c87ed31bb14db2ea5f3f() {
  return __cxx_static_address_19c5c87ed31bb14db2ea5f3f.reference || (__cxx_static_address_19c5c87ed31bb14db2ea5f3f.reference = {
    __cReference: true,
    get value() { return SHRINKERWIDE____header_global_318d1ca7154c68ca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:786
export const CRACKKNUCKLESWIDE____header_global_3b82800af6d7a694 = ((((((5129) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_abb1743b7db817ba71632ef2() {
  return __cxx_static_address_abb1743b7db817ba71632ef2.reference || (__cxx_static_address_abb1743b7db817ba71632ef2.reference = {
    __cReference: true,
    get value() { return CRACKKNUCKLESWIDE____header_global_3b82800af6d7a694; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:787
export const FLAMETHROWERSPRITE____header_global_435316fc2e163cc2 = ((((((5134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_242a7f1c5a8bcaa9aedb4915() {
  return __cxx_static_address_242a7f1c5a8bcaa9aedb4915.reference || (__cxx_static_address_242a7f1c5a8bcaa9aedb4915.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERSPRITE____header_global_435316fc2e163cc2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:788
export const FLAMETHROWERAMMO____header_global_87779593ab929f8c = ((((((5135) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a54148064e45833ba991c13f() {
  return __cxx_static_address_a54148064e45833ba991c13f.reference || (__cxx_static_address_a54148064e45833ba991c13f.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERAMMO____header_global_87779593ab929f8c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:789
export const FLAMETHROWER____header_global_013b5b10194d965c = ((((((5138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_930897da4dd76b547038a4ad() {
  return __cxx_static_address_930897da4dd76b547038a4ad.reference || (__cxx_static_address_930897da4dd76b547038a4ad.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER____header_global_013b5b10194d965c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:790
export const FLAMETHROWERFIRE____header_global_874b4f0213ae3ad5 = ((((((5139) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b59bcf760d53b74db7d8cbcf() {
  return __cxx_static_address_b59bcf760d53b74db7d8cbcf.reference || (__cxx_static_address_b59bcf760d53b74db7d8cbcf.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERFIRE____header_global_874b4f0213ae3ad5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:791
export const FLAMETHROWERFLAME____header_global_0682eadf2125c073 = ((((((1891) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_10ede475681211de071c5d25() {
  return __cxx_static_address_10ede475681211de071c5d25.reference || (__cxx_static_address_10ede475681211de071c5d25.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERFLAME____header_global_0682eadf2125c073; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:792
export const FLAMETHROWERPILOT____header_global_aee323e361cd6e51 = ((((((5174) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d72cc8d3383750374b0060b9() {
  return __cxx_static_address_d72cc8d3383750374b0060b9.reference || (__cxx_static_address_d72cc8d3383750374b0060b9.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERPILOT____header_global_aee323e361cd6e51; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:793
export const FIREBALL____header_global_f06158d46e7278e9 = ((((((5163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c6e23dadd4d8e1279ff771b7() {
  return __cxx_static_address_c6e23dadd4d8e1279ff771b7.reference || (__cxx_static_address_c6e23dadd4d8e1279ff771b7.reference = {
    __cReference: true,
    get value() { return FIREBALL____header_global_f06158d46e7278e9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:794
export const ONFIRE____header_global_0a5c159ad79e86a9 = ((((((5152) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8b2d93c1372836db05d776a8() {
  return __cxx_static_address_8b2d93c1372836db05d776a8.reference || (__cxx_static_address_8b2d93c1372836db05d776a8.reference = {
    __cReference: true,
    get value() { return ONFIRE____header_global_0a5c159ad79e86a9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:795
export const ONFIRESMOKE____header_global_2d6891c62359e205 = ((((((5143) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_252a49b4a792ab9087e9d5d2() {
  return __cxx_static_address_252a49b4a792ab9087e9d5d2.reference || (__cxx_static_address_252a49b4a792ab9087e9d5d2.reference = {
    __cReference: true,
    get value() { return ONFIRESMOKE____header_global_2d6891c62359e205; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:796
export const BURNEDCORPSE____header_global_c2ceda8bec249e9b = ((((((5173) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_097bdaae850bb6a81a94edc9() {
  return __cxx_static_address_097bdaae850bb6a81a94edc9.reference || (__cxx_static_address_097bdaae850bb6a81a94edc9.reference = {
    __cReference: true,
    get value() { return BURNEDCORPSE____header_global_c2ceda8bec249e9b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:797
export const WHISPYSMOKE____header_global_b084648be5def47f = ((((((5268) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a35f2aca9059b55931fa71b9() {
  return __cxx_static_address_a35f2aca9059b55931fa71b9.reference || (__cxx_static_address_a35f2aca9059b55931fa71b9.reference = {
    __cReference: true,
    get value() { return WHISPYSMOKE____header_global_b084648be5def47f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:798
export const FIREFLY____header_global_79f7be637b7aea3a = ((((((5180) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e9fe55f7e856369760b6c339() {
  return __cxx_static_address_e9fe55f7e856369760b6c339.reference || (__cxx_static_address_e9fe55f7e856369760b6c339.reference = {
    __cReference: true,
    get value() { return FIREFLY____header_global_79f7be637b7aea3a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:799
export const FIREFLYSHRINKEFFECT____header_global_244c920aa0289cf5 = ((((((5360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d49faca1bb62e4e42b91a2cf() {
  return __cxx_static_address_d49faca1bb62e4e42b91a2cf.reference || (__cxx_static_address_d49faca1bb62e4e42b91a2cf.reference = {
    __cReference: true,
    get value() { return FIREFLYSHRINKEFFECT____header_global_244c920aa0289cf5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:800
export const FIREFLYGROWEFFECT____header_global_c9643ebf12afca8e = ((((((5367) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7dab7d5abd1168c764070cc1() {
  return __cxx_static_address_7dab7d5abd1168c764070cc1.reference || (__cxx_static_address_7dab7d5abd1168c764070cc1.reference = {
    __cReference: true,
    get value() { return FIREFLYGROWEFFECT____header_global_c9643ebf12afca8e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:801
export const FIREFLYFLYINGEFFECT____header_global_055da42f47239fe4 = ((((((5296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dbeb7a42284cbf881a9fc36c() {
  return __cxx_static_address_dbeb7a42284cbf881a9fc36c.reference || (__cxx_static_address_dbeb7a42284cbf881a9fc36c.reference = {
    __cReference: true,
    get value() { return FIREFLYFLYINGEFFECT____header_global_055da42f47239fe4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:802
export const BOSS5____header_global_b9a72a8c6f630de3 = ((((((5310) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fe1f06d69c56deef828c8e2f() {
  return __cxx_static_address_fe1f06d69c56deef828c8e2f.reference || (__cxx_static_address_fe1f06d69c56deef828c8e2f.reference = {
    __cReference: true,
    get value() { return BOSS5____header_global_b9a72a8c6f630de3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:803
export const BOSS5STAYPUT____header_global_11f47d32ec5e267c = ((((((5311) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a4bec5fe415fe9dcfeffcd10() {
  return __cxx_static_address_a4bec5fe415fe9dcfeffcd10.reference || (__cxx_static_address_a4bec5fe415fe9dcfeffcd10.reference = {
    __cReference: true,
    get value() { return BOSS5STAYPUT____header_global_11f47d32ec5e267c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:804
export const LAVAPOOL____header_global_5ae010697240e6ae = ((((((5304) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_295e0ea4eddd3287dbee13ef() {
  return __cxx_static_address_295e0ea4eddd3287dbee13ef.reference || (__cxx_static_address_295e0ea4eddd3287dbee13ef.reference = {
    __cReference: true,
    get value() { return LAVAPOOL____header_global_5ae010697240e6ae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:805
export const LAVASPLASH____header_global_0a264a113af1b290 = ((((((5371) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5f1d131fc2b7a3165aadcba7() {
  return __cxx_static_address_5f1d131fc2b7a3165aadcba7.reference || (__cxx_static_address_5f1d131fc2b7a3165aadcba7.reference = {
    __cReference: true,
    get value() { return LAVASPLASH____header_global_0a264a113af1b290; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:806
export const LAVAPOOLBUBBLE____header_global_8634042ae3a2bc46 = ((((((5207) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_71fcc296d29a97264eb182ef() {
  return __cxx_static_address_71fcc296d29a97264eb182ef.reference || (__cxx_static_address_71fcc296d29a97264eb182ef.reference = {
    __cReference: true,
    get value() { return LAVAPOOLBUBBLE____header_global_8634042ae3a2bc46; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:807
export const BOSS2STAYPUT____header_global_500dd9844a877ae5 = ((((((2711) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8e371b90df20bd0f2479ea00() {
  return __cxx_static_address_8e371b90df20bd0f2479ea00.reference || (__cxx_static_address_8e371b90df20bd0f2479ea00.reference = {
    __cReference: true,
    get value() { return BOSS2STAYPUT____header_global_500dd9844a877ae5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:808
export const BOSS3STAYPUT____header_global_964734f08ad4ba9d = ((((((2761) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f1df920e71c3fcadf8b8fb56() {
  return __cxx_static_address_f1df920e71c3fcadf8b8fb56.reference || (__cxx_static_address_f1df920e71c3fcadf8b8fb56.reference = {
    __cReference: true,
    get value() { return BOSS3STAYPUT____header_global_964734f08ad4ba9d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:809
export const E32_TILE5736____header_global_4a7bb08e091929a6 = ((((((5736) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b0bd6ba8b8e8bfe85eb0e376() {
  return __cxx_static_address_b0bd6ba8b8e8bfe85eb0e376.reference || (__cxx_static_address_b0bd6ba8b8e8bfe85eb0e376.reference = {
    __cReference: true,
    get value() { return E32_TILE5736____header_global_4a7bb08e091929a6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:810
export const E32_TILE5737____header_global_ef0998002bb653d0 = ((((((5737) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2eb70ebc034a13a8918f22ec() {
  return __cxx_static_address_2eb70ebc034a13a8918f22ec.reference || (__cxx_static_address_2eb70ebc034a13a8918f22ec.reference = {
    __cReference: true,
    get value() { return E32_TILE5737____header_global_ef0998002bb653d0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:811
export const E32_TILE5846____header_global_006dd0bdca5e4ef2 = ((((((5846) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d1a21ca6406bad199cbd889d() {
  return __cxx_static_address_d1a21ca6406bad199cbd889d.reference || (__cxx_static_address_d1a21ca6406bad199cbd889d.reference = {
    __cReference: true,
    get value() { return E32_TILE5846____header_global_006dd0bdca5e4ef2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/network.h:180
export const cSnapshotMemUsage__header_global_e5edb98c9f80dc8d = u64((BigInt(u64(64)) * BigInt((BigInt((BigInt((BigInt(72) * BigInt(u64(16384)))) + BigInt((BigInt(96) * BigInt(u64(4096)))))) + BigInt((BigInt(296) * BigInt(u64(16384))))))));
function __cxx_static_address_f3b09f82fcbc817ff1396618() {
  return __cxx_static_address_f3b09f82fcbc817ff1396618.reference || (__cxx_static_address_f3b09f82fcbc817ff1396618.reference = {
    __cReference: true,
    get value() { return cSnapshotMemUsage__header_global_e5edb98c9f80dc8d; },
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

// C/C++ source: source/duke3d/src/global.cpp:27
export let ud = cZeroAggregate({"byteRecord": {"align": 4, "arrayAlign": 4, "fields": {"althud": {"native": "Int32Array", "offset": 128, "size": 4}, "auto_run": {"native": "Int32Array", "offset": 204, "size": 4}, "automsg": {"native": "Int32Array", "offset": 108, "size": 4}, "autosave": {"native": "Int32Array", "offset": 392, "size": 4}, "autosavedeletion": {"native": "Int32Array", "offset": 396, "size": 4}, "autovote": {"native": "Int32Array", "offset": 104, "size": 4}, "bgstretch": {"native": "Int32Array", "offset": 376, "size": 4}, "brightness": {"native": "Int32Array", "offset": 268, "size": 4}, "camera_time": {"native": "Int32Array", "offset": 20, "size": 4}, "camerapos": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}, "cameraq16ang": {"native": "Int32Array", "offset": 432, "size": 4}, "cameraq16horiz": {"native": "Int32Array", "offset": 436, "size": 4}, "camerasect": {"native": "Int16Array", "offset": 440, "size": 2}, "camerasprite": {"native": "Int16Array", "offset": 446, "size": 2}, "cashman": {"native": "Uint8Array", "offset": 1353, "size": 1}, "color": {"native": "Int32Array", "offset": 84, "size": 4}, "config": {"byteRecord": {"align": 4, "arrayAlign": 4, "fields": {"AmbienceToggle": {"native": "Int32Array", "offset": 808, "size": 4}, "AutoAim": {"native": "Int32Array", "offset": 0, "size": 4}, "CheckForUpdates": {"native": "Int32Array", "offset": 836, "size": 4}, "FXVolume": {"native": "Int32Array", "offset": 780, "size": 4}, "JoystickAimAssist": {"native": "Int32Array", "offset": 20, "size": 4}, "JoystickAimWeight": {"native": "Int32Array", "offset": 12, "size": 4}, "JoystickAnalogueAxes": {"length": 9, "native": "Int32Array", "offset": 468, "size": 36}, "JoystickAnalogueDead": {"length": 9, "native": "Int32Array", "offset": 576, "size": 36}, "JoystickAnalogueInvert": {"length": 9, "native": "Int32Array", "offset": 540, "size": 36}, "JoystickAnalogueSaturate": {"length": 9, "native": "Int32Array", "offset": 612, "size": 36}, "JoystickAnalogueSensitivity": {"length": 9, "native": "Float32Array", "offset": 504, "size": 36}, "JoystickDigitalFunctions": {"dims": [9, 2], "native": "Int32Array", "nativeArray": "Int32Array", "offset": 396, "size": 72}, "JoystickFunctions": {"dims": [36, 2], "native": "Int32Array", "nativeArray": "Int32Array", "offset": 108, "size": 288}, "JoystickViewCentering": {"native": "Int32Array", "offset": 16, "size": 4}, "KeyboardKeys": {"dims": [63, 2], "native": "Uint8Array", "nativeArray": "Uint8Array", "offset": 648, "size": 126}, "LastUpdateCheck": {"native": "Int32Array", "offset": 840, "size": 4}, "MasterVolume": {"native": "Int32Array", "offset": 776, "size": 4}, "MixRate": {"native": "Int32Array", "offset": 824, "size": 4}, "MouseBias": {"native": "Int32Array", "offset": 8, "size": 4}, "MouseFunctions": {"dims": [10, 2], "native": "Int32Array", "nativeArray": "Int32Array", "offset": 28, "size": 80}, "MusicDevice": {"native": "Int32Array", "offset": 788, "size": 4}, "MusicToggle": {"native": "Int32Array", "offset": 800, "size": 4}, "MusicVolume": {"native": "Int32Array", "offset": 792, "size": 4}, "NumBits": {"native": "Int32Array", "offset": 820, "size": 4}, "NumChannels": {"native": "Int32Array", "offset": 816, "size": 4}, "NumVoices": {"native": "Int32Array", "offset": 812, "size": 4}, "ShowWeapons": {"native": "Int32Array", "offset": 4, "size": 4}, "SoundToggle": {"native": "Int32Array", "offset": 796, "size": 4}, "VoiceToggle": {"native": "Int32Array", "offset": 804, "size": 4}, "VoiceVolume": {"native": "Int32Array", "offset": 784, "size": 4}, "controllerRumble": {"native": "Int32Array", "offset": 24, "size": 4}, "scripthandle": {"native": "Int32Array", "offset": 828, "size": 4}, "setupread": {"native": "Int32Array", "offset": 832, "size": 4}, "useprecache": {"native": "Int32Array", "offset": 844, "size": 4}}, "overlaps": false, "size": 848, "union": false}, "offset": 468}, "configversion": {"native": "Int32Array", "offset": 372, "size": 4}, "const_visibility": {"native": "Int32Array", "offset": 12, "size": 4}, "coop": {"native": "Int32Array", "offset": 224, "size": 4}, "coords": {"native": "Int32Array", "offset": 208, "size": 4}, "crosshair": {"native": "Int32Array", "offset": 236, "size": 4}, "crosshairscale": {"native": "Int32Array", "offset": 52, "size": 4}, "default_skill": {"native": "Int32Array", "offset": 388, "size": 4}, "default_volume": {"native": "Int32Array", "offset": 384, "size": 4}, "democams": {"native": "Int32Array", "offset": 80, "size": 4}, "detail": {"native": "Int32Array", "offset": 292, "size": 4}, "display_bonus_screen": {"native": "Uint8Array", "offset": 2015, "size": 1}, "drawweapon": {"native": "Int32Array", "offset": 76, "size": 4}, "entered_name": {"native": "Int32Array", "offset": 184, "size": 4}, "eog": {"native": "Uint8Array", "offset": 1354, "size": 1}, "executions": {"native": "Int32Array", "offset": 200, "size": 4}, "ffire": {"native": "Int32Array", "offset": 300, "size": 4}, "fola": {"native": "Int32Array", "offset": 44, "size": 4}, "folavel": {"native": "Int32Array", "offset": 32, "size": 4}, "folfvel": {"native": "Int32Array", "offset": 24, "size": 4}, "folsvel": {"native": "Int32Array", "offset": 28, "size": 4}, "folx": {"native": "Int32Array", "offset": 36, "size": 4}, "foly": {"native": "Int32Array", "offset": 40, "size": 4}, "fov": {"native": "Int32Array", "offset": 428, "size": 4}, "frameperiod": {"native": "Int32Array", "offset": 380, "size": 4}, "from_bonus": {"native": "Int16Array", "offset": 444, "size": 2}, "fta_on": {"native": "Int32Array", "offset": 196, "size": 4}, "god": {"native": "Uint8Array", "offset": 1351, "size": 1}, "hudontop": {"native": "Int32Array", "offset": 152, "size": 4}, "idplayers": {"native": "Int32Array", "offset": 112, "size": 4}, "kick_mode": {"native": "Int32Array", "offset": 60, "size": 4}, "last_camsprite": {"native": "Int16Array", "offset": 448, "size": 2}, "last_level": {"native": "Int16Array", "offset": 450, "size": 2}, "last_overhead": {"native": "Uint8Array", "offset": 1349, "size": 1}, "last_stateless_level": {"native": "Int32Array", "offset": 460, "size": 4}, "last_stateless_volume": {"native": "Int32Array", "offset": 464, "size": 4}, "level_number": {"native": "Int32Array", "offset": 324, "size": 4}, "levelstats": {"native": "Int32Array", "offset": 216, "size": 4}, "lockout": {"native": "Int32Array", "offset": 232, "size": 4}, "m_coop": {"native": "Int32Array", "offset": 220, "size": 4}, "m_ffire": {"native": "Int32Array", "offset": 296, "size": 4}, "m_level_number": {"native": "Int32Array", "offset": 308, "size": 4}, "m_marker": {"native": "Int32Array", "offset": 332, "size": 4}, "m_monsters_off": {"native": "Int32Array", "offset": 288, "size": 4}, "m_newgamecustom": {"native": "Int32Array", "offset": 356, "size": 4}, "m_newgamecustoml3": {"native": "Int32Array", "offset": 364, "size": 4}, "m_newgamecustomsub": {"native": "Int32Array", "offset": 360, "size": 4}, "m_noexits": {"native": "Int32Array", "offset": 96, "size": 4}, "m_player_skill": {"native": "Int32Array", "offset": 304, "size": 4}, "m_recstat": {"native": "Int32Array", "offset": 284, "size": 4}, "m_respawn_inventory": {"native": "Int32Array", "offset": 280, "size": 4}, "m_respawn_items": {"native": "Int32Array", "offset": 272, "size": 4}, "m_respawn_monsters": {"native": "Int32Array", "offset": 276, "size": 4}, "m_volume_number": {"native": "Int32Array", "offset": 312, "size": 4}, "marker": {"native": "Int32Array", "offset": 336, "size": 4}, "maxautosaves": {"native": "Int32Array", "offset": 400, "size": 4}, "menu_scrollbartilenum": {"native": "Int32Array", "offset": 168, "size": 4}, "menu_scrollbarz": {"native": "Int32Array", "offset": 172, "size": 4}, "menu_scrollcursorz": {"native": "Int32Array", "offset": 176, "size": 4}, "menu_slidebarmargin": {"native": "Int32Array", "offset": 160, "size": 4}, "menu_slidebarz": {"native": "Int32Array", "offset": 156, "size": 4}, "menu_slidecursorz": {"native": "Int32Array", "offset": 164, "size": 4}, "menubackground": {"native": "Uint8Array", "offset": 2032, "size": 1}, "menutitle_pal": {"native": "Int8Array", "offset": 454, "size": 1}, "monsters_off": {"native": "Int32Array", "offset": 264, "size": 4}, "mouseaiming": {"native": "Int32Array", "offset": 68, "size": 4}, "mouseflip": {"native": "Int32Array", "offset": 340, "size": 4}, "msgdisptime": {"native": "Int32Array", "offset": 88, "size": 4}, "multimode": {"native": "Int32Array", "offset": 316, "size": 4}, "music_episode": {"native": "Int32Array", "offset": 344, "size": 4}, "music_level": {"native": "Int32Array", "offset": 348, "size": 4}, "noclip": {"native": "Uint8Array", "offset": 1358, "size": 1}, "noexits": {"native": "Int32Array", "offset": 100, "size": 4}, "obituaries": {"native": "Int32Array", "offset": 244, "size": 4}, "overhead_on": {"native": "Uint8Array", "offset": 1348, "size": 1}, "pause_on": {"native": "Int16Array", "offset": 442, "size": 2}, "player_skill": {"native": "Int32Array", "offset": 320, "size": 4}, "playerai": {"native": "Int32Array", "offset": 240, "size": 4}, "playerbest": {"native": "Int32Array", "offset": 368, "size": 4}, "pwlockout": {"length": 128, "native": "Uint8Array", "offset": 1759, "size": 128}, "quote_yoffset": {"native": "Int32Array", "offset": 180, "size": 4}, "reccnt": {"native": "Int32Array", "offset": 48, "size": 4}, "recstat": {"native": "Int32Array", "offset": 260, "size": 4}, "respawn_inventory": {"native": "Int32Array", "offset": 256, "size": 4}, "respawn_items": {"native": "Int32Array", "offset": 252, "size": 4}, "respawn_monsters": {"native": "Int32Array", "offset": 248, "size": 4}, "returnvar": {"length": 5, "native": "Int32Array", "offset": 404, "size": 20}, "ridecule": {"dims": [10, 40], "native": "Uint8Array", "nativeArray": "Uint8Array", "offset": 1359, "size": 400}, "rtsname": {"length": 128, "native": "Uint8Array", "offset": 1887, "size": 128}, "runkey_mode": {"native": "Int32Array", "offset": 56, "size": 4}, "screen_size": {"native": "Int32Array", "offset": 228, "size": 4}, "screen_tilting": {"native": "Int32Array", "offset": 188, "size": 4}, "screenfade": {"native": "Uint8Array", "offset": 2031, "size": 1}, "scrollmode": {"native": "Uint8Array", "offset": 1357, "size": 1}, "secretlevel": {"native": "Int16Array", "offset": 452, "size": 2}, "setup": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"bpp": {"native": "Int32Array", "offset": 20, "size": 4}, "forcesetup": {"native": "Int32Array", "offset": 24, "size": 4}, "fullscreen": {"native": "Int32Array", "offset": 8, "size": 4}, "noautoload": {"native": "Int32Array", "offset": 28, "size": 4}, "usejoystick": {"native": "Int32Array", "offset": 0, "size": 4}, "usemouse": {"native": "Int32Array", "offset": 4, "size": 4}, "xdim": {"native": "Int32Array", "offset": 12, "size": 4}, "ydim": {"native": "Int32Array", "offset": 16, "size": 4}}, "overlaps": false, "size": 32, "union": false}, "offset": 1316}, "shadow_pal": {"native": "Uint8Array", "offset": 2033, "size": 1}, "shadows": {"native": "Int32Array", "offset": 192, "size": 4}, "show_help": {"native": "Uint8Array", "offset": 1356, "size": 1}, "show_level_text": {"native": "Uint8Array", "offset": 2016, "size": 1}, "showallmap": {"native": "Uint8Array", "offset": 1355, "size": 1}, "showfps": {"native": "Int32Array", "offset": 212, "size": 4}, "showweapons": {"native": "Uint8Array", "offset": 1350, "size": 1}, "skill_voice": {"native": "Int32Array", "offset": 352, "size": 4}, "slidebar_paldisabled": {"native": "Int8Array", "offset": 456, "size": 1}, "slidebar_palselected": {"native": "Int8Array", "offset": 455, "size": 1}, "statusbarcustom": {"native": "Int32Array", "offset": 148, "size": 4}, "statusbarflags": {"native": "Int32Array", "offset": 140, "size": 4}, "statusbarmode": {"native": "Int32Array", "offset": 92, "size": 4}, "statusbarrange": {"native": "Int32Array", "offset": 144, "size": 4}, "statusbarscale": {"native": "Int32Array", "offset": 64, "size": 4}, "team": {"native": "Int32Array", "offset": 116, "size": 4}, "textscale": {"native": "Int32Array", "offset": 136, "size": 4}, "user_map": {"native": "Uint8Array", "offset": 2030, "size": 1}, "userbytever": {"native": "Uint32Array", "offset": 424, "size": 4}, "uw_framerate": {"native": "Int32Array", "offset": 16, "size": 4}, "viewbob": {"native": "Int32Array", "offset": 120, "size": 4}, "volume_number": {"native": "Int32Array", "offset": 328, "size": 4}, "warp_on": {"native": "Uint8Array", "offset": 1352, "size": 1}, "wchoice": {"length": 13, "native": "Uint8Array", "offset": 2017, "size": 13}, "weaponscale": {"native": "Int32Array", "offset": 132, "size": 4}, "weaponsway": {"native": "Int32Array", "offset": 124, "size": 4}, "weaponswitch": {"native": "Int32Array", "offset": 72, "size": 4}}, "overlaps": true, "size": 2036, "union": false}}, {});
export function __cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba() {
  return __cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba.reference || (__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba.reference = {
    __cReference: true,
    get value() { return ud; },
    set value(__cxx_lvalue_0) { throw new TypeError("record address cannot replace original object storage"); }
  });
}

// C/C++ source: source/duke3d/src/global.cpp:29
export let s_buildDate = Uint8Array.from([50, 48, 49, 50, 48, 53, 50, 50, 0]);
export function __cxx_global_cell_ea1e6827d1df744b092b60e4() {
  return __cxx_global_cell_ea1e6827d1df744b092b60e4.reference || (__cxx_global_cell_ea1e6827d1df744b092b60e4.reference = {
    __cReference: true,
    get value() { return s_buildDate; },
    set value(__cxx_lvalue_0) { s_buildDate = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/duke3d/src/global.cpp:36
export let g_volumeNames = [(() => { const row = new Uint8Array(33); row.set([76, 46, 65, 46, 32, 77, 101, 108, 116, 100, 111, 119, 110]); return row; })(), (() => { const row = new Uint8Array(33); row.set([76, 117, 110, 97, 114, 32, 65, 112, 111, 99, 97, 108, 121, 112, 115, 101]); return row; })(), (() => { const row = new Uint8Array(33); row.set([83, 104, 114, 97, 112, 110, 101, 108, 32, 67, 105, 116, 121]); return row; })(), new Uint8Array(33), new Uint8Array(33), new Uint8Array(33), new Uint8Array(33)];
function __cxx_static_address_1d8bc86f2e21bd63119da6fb() {
  return __cxx_static_address_1d8bc86f2e21bd63119da6fb.reference || (__cxx_static_address_1d8bc86f2e21bd63119da6fb.reference = {
    __cReference: true,
    get value() { return g_volumeNames; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/global.cpp:37
export let g_skillNames = [(() => { const row = new Uint8Array(33); row.set([80, 105, 101, 99, 101, 32, 79, 102, 32, 67, 97, 107, 101]); return row; })(), (() => { const row = new Uint8Array(33); row.set([76, 101, 116, 39, 115, 32, 82, 111, 99, 107]); return row; })(), (() => { const row = new Uint8Array(33); row.set([67, 111, 109, 101, 32, 71, 101, 116, 32, 83, 111, 109, 101]); return row; })(), (() => { const row = new Uint8Array(33); row.set([68, 97, 109, 110, 32, 73, 39, 109, 32, 71, 111, 111, 100]); return row; })(), new Uint8Array(33), new Uint8Array(33), new Uint8Array(33)];
function __cxx_static_address_3ff59257d3b2acbd29d270f7() {
  return __cxx_static_address_3ff59257d3b2acbd29d270f7.reference || (__cxx_static_address_3ff59257d3b2acbd29d270f7.reference = {
    __cReference: true,
    get value() { return g_skillNames; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/global.cpp:38
export let g_gametypeNames = [(() => { const row = new Uint8Array(33); row.set([68, 117, 107, 101, 77, 97, 116, 99, 104, 32, 40, 83, 112, 97, 119, 110, 41]); return row; })(), (() => { const row = new Uint8Array(33); row.set([67, 111, 111, 112, 101, 114, 97, 116, 105, 118, 101, 32, 80, 108, 97, 121]); return row; })(), (() => { const row = new Uint8Array(33); row.set([68, 117, 107, 101, 77, 97, 116, 99, 104, 32, 40, 78, 111, 32, 83, 112, 97, 119, 110, 41]); return row; })(), (() => { const row = new Uint8Array(33); row.set([84, 101, 97, 109, 32, 68, 77, 32, 40, 83, 112, 97, 119, 110, 41]); return row; })(), (() => { const row = new Uint8Array(33); row.set([84, 101, 97, 109, 32, 68, 77, 32, 40, 78, 111, 32, 83, 112, 97, 119, 110, 41]); return row; })(), new Uint8Array(33), new Uint8Array(33), new Uint8Array(33), new Uint8Array(33), new Uint8Array(33), new Uint8Array(33), new Uint8Array(33), new Uint8Array(33), new Uint8Array(33), new Uint8Array(33), new Uint8Array(33)];
function __cxx_static_address_117785f0b9dc8522e0425449() {
  return __cxx_static_address_117785f0b9dc8522e0425449.reference || (__cxx_static_address_117785f0b9dc8522e0425449.reference = {
    __cReference: true,
    get value() { return g_gametypeNames; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/global.cpp:47
export let g_volumeFlags = new Int32Array(7);
function __cxx_static_address_c7ee9e90e4b15a18ebc20dc0() {
  return __cxx_static_address_c7ee9e90e4b15a18ebc20dc0.reference || (__cxx_static_address_c7ee9e90e4b15a18ebc20dc0.reference = {
    __cReference: true,
    get value() { return g_volumeFlags; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/global.cpp:49
export let g_gametypeFlags = (() => { const items = new Int32Array(16); items.set([i32((i32((i32((i32((i32((i32(4) | i32(8))) | i32(16))) | i32(1024))) | i32(2048))) | i32(16384))), i32((i32((i32((i32((i32((i32((i32((i32((i32((i32(1) | i32(2))) | i32(32))) | i32(64))) | i32(128))) | i32(256))) | i32(512))) | i32(4096))) | i32(8192))) | i32(32768))), i32((i32((i32((i32((i32(2) | i32(4))) | i32(8))) | i32(16))) | i32(16384))), i32((i32((i32((i32((i32((i32((i32((i32(4) | i32(8))) | i32(16))) | i32(1024))) | i32(2048))) | i32(16384))) | i32(65536))) | i32(131072))), i32((i32((i32((i32((i32((i32((i32(2) | i32(4))) | i32(8))) | i32(16))) | i32(16384))) | i32(65536))) | i32(131072)))]); return items; })();
function __cxx_static_address_b1eac4f18cf99731a8269cd6() {
  return __cxx_static_address_b1eac4f18cf99731a8269cd6.reference || (__cxx_static_address_b1eac4f18cf99731a8269cd6.reference = {
    __cReference: true,
    get value() { return g_gametypeFlags; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/global.cpp:93
export let g_frameStackSize = i32(Math.imul(704, 1024));
export function __cxx_global_cell_a0b473bf061647c0f262ff82() {
  return __cxx_global_cell_a0b473bf061647c0f262ff82.reference || (__cxx_global_cell_a0b473bf061647c0f262ff82.reference = {
    __cReference: true,
    get value() { return g_frameStackSize; },
    set value(__cxx_lvalue_0) { g_frameStackSize = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/global.cpp:95
export let g_actorRespawnTime = i32(768);
export function __cxx_global_cell_9cec72372660080d153969ed() {
  return __cxx_global_cell_9cec72372660080d153969ed.reference || (__cxx_global_cell_9cec72372660080d153969ed.reference = {
    __cReference: true,
    get value() { return g_actorRespawnTime; },
    set value(__cxx_lvalue_0) { g_actorRespawnTime = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/global.cpp:96
export let g_bouncemineRadius = i32(2500);
export function __cxx_global_cell_fa1a761ad63424391ef2eb7e() {
  return __cxx_global_cell_fa1a761ad63424391ef2eb7e.reference || (__cxx_global_cell_fa1a761ad63424391ef2eb7e.reference = {
    __cReference: true,
    get value() { return g_bouncemineRadius; },
    set value(__cxx_lvalue_0) { g_bouncemineRadius = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/global.cpp:97
export let g_deleteQueueSize = i32(64);
export function __cxx_global_cell_c7396d09498f79f4675d125b() {
  return __cxx_global_cell_c7396d09498f79f4675d125b.reference || (__cxx_global_cell_c7396d09498f79f4675d125b.reference = {
    __cReference: true,
    get value() { return g_deleteQueueSize; },
    set value(__cxx_lvalue_0) { g_deleteQueueSize = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/global.cpp:98
export let g_itemRespawnTime = i32(768);
export function __cxx_global_cell_98f0b1f570a2f6307c66c6f0() {
  return __cxx_global_cell_98f0b1f570a2f6307c66c6f0.reference || (__cxx_global_cell_98f0b1f570a2f6307c66c6f0.reference = {
    __cReference: true,
    get value() { return g_itemRespawnTime; },
    set value(__cxx_lvalue_0) { g_itemRespawnTime = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/global.cpp:100
export let g_morterRadius = i32(2500);
export function __cxx_global_cell_55c709d3278bbdef67186917() {
  return __cxx_global_cell_55c709d3278bbdef67186917.reference || (__cxx_global_cell_55c709d3278bbdef67186917.reference = {
    __cReference: true,
    get value() { return g_morterRadius; },
    set value(__cxx_lvalue_0) { g_morterRadius = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/global.cpp:101
export let g_numFreezeBounces = i32(3);
export function __cxx_global_cell_3b9a6643b5a8adfdd16c2c0e() {
  return __cxx_global_cell_3b9a6643b5a8adfdd16c2c0e.reference || (__cxx_global_cell_3b9a6643b5a8adfdd16c2c0e.reference = {
    __cReference: true,
    get value() { return g_numFreezeBounces; },
    set value(__cxx_lvalue_0) { g_numFreezeBounces = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/global.cpp:102
export let g_gametypeCnt = i32(5);
export function __cxx_global_cell_b0597697bdbf1bdf4de5ac94() {
  return __cxx_global_cell_b0597697bdbf1bdf4de5ac94.reference || (__cxx_global_cell_b0597697bdbf1bdf4de5ac94.reference = {
    __cReference: true,
    get value() { return g_gametypeCnt; },
    set value(__cxx_lvalue_0) { g_gametypeCnt = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/global.cpp:103
export let g_volumeCnt = i32(3);
export function __cxx_global_cell_00e4d69d02c23b6c86678573() {
  return __cxx_global_cell_00e4d69d02c23b6c86678573.reference || (__cxx_global_cell_00e4d69d02c23b6c86678573.reference = {
    __cReference: true,
    get value() { return g_volumeCnt; },
    set value(__cxx_lvalue_0) { g_volumeCnt = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/global.cpp:104
export let g_pipebombRadius = i32(2500);
export function __cxx_global_cell_164a2be3133df4f0c234cae8() {
  return __cxx_global_cell_164a2be3133df4f0c234cae8.reference || (__cxx_global_cell_164a2be3133df4f0c234cae8.reference = {
    __cReference: true,
    get value() { return g_pipebombRadius; },
    set value(__cxx_lvalue_0) { g_pipebombRadius = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/global.cpp:105
export let g_playerFriction = i32(53200);
export function __cxx_global_cell_bc77ba2124d9f9bdbae1a2b2() {
  return __cxx_global_cell_bc77ba2124d9f9bdbae1a2b2.reference || (__cxx_global_cell_bc77ba2124d9f9bdbae1a2b2.reference = {
    __cReference: true,
    get value() { return g_playerFriction; },
    set value(__cxx_lvalue_0) { g_playerFriction = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_e0cbb53e729ecc73 = i32(2147483647);
function __cxx_static_address_697f7aa1620370764c4e6f4d() {
  return __cxx_static_address_697f7aa1620370764c4e6f4d.reference || (__cxx_static_address_697f7aa1620370764c4e6f4d.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_e0cbb53e729ecc73; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_e8dbd713182163c6 = i32(2147483648);
function __cxx_static_address_1caeda540aba3770d079b83f() {
  return __cxx_static_address_1caeda540aba3770d079b83f.reference || (__cxx_static_address_1caeda540aba3770d079b83f.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_e8dbd713182163c6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_abf9d101b396620b = i32(2147483648);
function __cxx_static_address_de37d1f48f74832742e5c549() {
  return __cxx_static_address_de37d1f48f74832742e5c549.reference || (__cxx_static_address_de37d1f48f74832742e5c549.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_abf9d101b396620b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_66e9b0f54204b070 = i32(65536);
function __cxx_static_address_2eca15411cf2e8176444e6c5() {
  return __cxx_static_address_2eca15411cf2e8176444e6c5.reference || (__cxx_static_address_2eca15411cf2e8176444e6c5.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_66e9b0f54204b070; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_d27d2c088a21b126 = i32(32768);
function __cxx_static_address_7a56bff69be8bb4c5c0655b4() {
  return __cxx_static_address_7a56bff69be8bb4c5c0655b4.reference || (__cxx_static_address_7a56bff69be8bb4c5c0655b4.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_d27d2c088a21b126; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_2dad2158b24bb8ca = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_61b6466e101e577bc424c9f9() {
  return __cxx_static_address_61b6466e101e577bc424c9f9.reference || (__cxx_static_address_61b6466e101e577bc424c9f9.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_2dad2158b24bb8ca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/global.h:46
export let g_interpolationCnt = 0;
export function __cxx_global_cell_f51bebc92810fbbcedc191bf() {
  return __cxx_global_cell_f51bebc92810fbbcedc191bf.reference || (__cxx_global_cell_f51bebc92810fbbcedc191bf.reference = {
    __cReference: true,
    get value() { return g_interpolationCnt; },
    set value(__cxx_lvalue_0) { g_interpolationCnt = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/global.h:47
export let g_interpolationLock = 0;
export function __cxx_global_cell_4c2e99926c93297eef1857b2() {
  return __cxx_global_cell_4c2e99926c93297eef1857b2.reference || (__cxx_global_cell_4c2e99926c93297eef1857b2.reference = {
    __cReference: true,
    get value() { return g_interpolationLock; },
    set value(__cxx_lvalue_0) { g_interpolationLock = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/global.h:56
export let duke3d_globalflags = 0;
export function __cxx_global_cell_286850f0b72c66d5aae173a9() {
  return __cxx_global_cell_286850f0b72c66d5aae173a9.reference || (__cxx_global_cell_286850f0b72c66d5aae173a9.reference = {
    __cReference: true,
    get value() { return duke3d_globalflags; },
    set value(__cxx_lvalue_0) { duke3d_globalflags = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/global.h:77
export let g_musicIndex = 0;
export function __cxx_global_cell_621f7119e880a71b275a5bee() {
  return __cxx_global_cell_621f7119e880a71b275a5bee.reference || (__cxx_global_cell_621f7119e880a71b275a5bee.reference = {
    __cReference: true,
    get value() { return g_musicIndex; },
    set value(__cxx_lvalue_0) { g_musicIndex = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/global.h:78
export let g_loadFromGroupOnly = 0;
export function __cxx_global_cell_603507b56f38a5986b111afe() {
  return __cxx_global_cell_603507b56f38a5986b111afe.reference || (__cxx_global_cell_603507b56f38a5986b111afe.reference = {
    __cReference: true,
    get value() { return g_loadFromGroupOnly; },
    set value(__cxx_lvalue_0) { g_loadFromGroupOnly = ((__cxx_lvalue_0) & 255); }
  });
}

// C/C++ source: source/duke3d/src/global.h:79
export let g_maxDefinedSkill = 0;
export function __cxx_global_cell_e9576a5286a0997ea679c8d5() {
  return __cxx_global_cell_e9576a5286a0997ea679c8d5.reference || (__cxx_global_cell_e9576a5286a0997ea679c8d5.reference = {
    __cReference: true,
    get value() { return g_maxDefinedSkill; },
    set value(__cxx_lvalue_0) { g_maxDefinedSkill = (((__cxx_lvalue_0) << 24) >> 24); }
  });
}

// C/C++ source: source/duke3d/src/global.h:80
export let pus = 0;
export function __cxx_global_cell_8d39f72b071341a9545e4b0e() {
  return __cxx_global_cell_8d39f72b071341a9545e4b0e.reference || (__cxx_global_cell_8d39f72b071341a9545e4b0e.reference = {
    __cReference: true,
    get value() { return pus; },
    set value(__cxx_lvalue_0) { pus = ((__cxx_lvalue_0) & 255); }
  });
}

export let pub = 0;
export function __cxx_global_cell_0017dea7770f7ecff7ab3c20() {
  return __cxx_global_cell_0017dea7770f7ecff7ab3c20.reference || (__cxx_global_cell_0017dea7770f7ecff7ab3c20.reference = {
    __cReference: true,
    get value() { return pub; },
    set value(__cxx_lvalue_0) { pub = ((__cxx_lvalue_0) & 255); }
  });
}

// C/C++ source: source/duke3d/src/global.h:81
export let ready2send = 0;
export function __cxx_global_cell_fcb79810a6ad9af2e41fcedd() {
  return __cxx_global_cell_fcb79810a6ad9af2e41fcedd.reference || (__cxx_global_cell_fcb79810a6ad9af2e41fcedd.reference = {
    __cReference: true,
    get value() { return ready2send; },
    set value(__cxx_lvalue_0) { ready2send = ((__cxx_lvalue_0) & 255); }
  });
}

// C/C++ source: source/duke3d/src/global.h:94
export let g_animWallCnt = 0;
export function __cxx_global_cell_b1cbeb17d4d0dcf0e2c1e4ff() {
  return __cxx_global_cell_b1cbeb17d4d0dcf0e2c1e4ff.reference || (__cxx_global_cell_b1cbeb17d4d0dcf0e2c1e4ff.reference = {
    __cReference: true,
    get value() { return g_animWallCnt; },
    set value(__cxx_lvalue_0) { g_animWallCnt = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/global.h:95
export let g_animateCnt = 0;
export function __cxx_global_cell_a2f1fe9eaedb9f9cfd27b0e2() {
  return __cxx_global_cell_a2f1fe9eaedb9f9cfd27b0e2.reference || (__cxx_global_cell_a2f1fe9eaedb9f9cfd27b0e2.reference = {
    __cReference: true,
    get value() { return g_animateCnt; },
    set value(__cxx_lvalue_0) { g_animateCnt = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/global.h:96
export let g_cloudCnt = 0;
export function __cxx_global_cell_a822d0436b33da814b8410a2() {
  return __cxx_global_cell_a822d0436b33da814b8410a2.reference || (__cxx_global_cell_a822d0436b33da814b8410a2.reference = {
    __cReference: true,
    get value() { return g_cloudCnt; },
    set value(__cxx_lvalue_0) { g_cloudCnt = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/global.h:97
export let g_curViewscreen = 0;
export function __cxx_global_cell_abf365253e4fe443b4315faf() {
  return __cxx_global_cell_abf365253e4fe443b4315faf.reference || (__cxx_global_cell_abf365253e4fe443b4315faf.reference = {
    __cReference: true,
    get value() { return g_curViewscreen; },
    set value(__cxx_lvalue_0) { g_curViewscreen = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/global.h:98
export let g_frameRate = 0;
export function __cxx_global_cell_af7005133235fcf35d534b57() {
  return __cxx_global_cell_af7005133235fcf35d534b57.reference || (__cxx_global_cell_af7005133235fcf35d534b57.reference = {
    __cReference: true,
    get value() { return g_frameRate; },
    set value(__cxx_lvalue_0) { g_frameRate = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/global.h:99
export let g_cyclerCnt = 0;
export function __cxx_global_cell_9d4c552790d42137522a354f() {
  return __cxx_global_cell_9d4c552790d42137522a354f.reference || (__cxx_global_cell_9d4c552790d42137522a354f.reference = {
    __cReference: true,
    get value() { return g_cyclerCnt; },
    set value(__cxx_lvalue_0) { g_cyclerCnt = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/global.h:100
export let g_damageCameras = 0;
export function __cxx_global_cell_f0488c3aa4d43399b04094cf() {
  return __cxx_global_cell_f0488c3aa4d43399b04094cf.reference || (__cxx_global_cell_f0488c3aa4d43399b04094cf.reference = {
    __cReference: true,
    get value() { return g_damageCameras; },
    set value(__cxx_lvalue_0) { g_damageCameras = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/global.h:101
export let g_doQuickSave = 0;
export function __cxx_global_cell_409c4df5b79d5f8578029b13() {
  return __cxx_global_cell_409c4df5b79d5f8578029b13.reference || (__cxx_global_cell_409c4df5b79d5f8578029b13.reference = {
    __cReference: true,
    get value() { return g_doQuickSave; },
    set value(__cxx_lvalue_0) { g_doQuickSave = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/global.h:102
export let g_earthquakeTime = 0;
export function __cxx_global_cell_2d8f6b5f2b460ae822f48a39() {
  return __cxx_global_cell_2d8f6b5f2b460ae822f48a39.reference || (__cxx_global_cell_2d8f6b5f2b460ae822f48a39.reference = {
    __cReference: true,
    get value() { return g_earthquakeTime; },
    set value(__cxx_lvalue_0) { g_earthquakeTime = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/global.h:103
export let g_freezerSelfDamage = 0;
export function __cxx_global_cell_65816fd170522259e73c192a() {
  return __cxx_global_cell_65816fd170522259e73c192a.reference || (__cxx_global_cell_65816fd170522259e73c192a.reference = {
    __cReference: true,
    get value() { return g_freezerSelfDamage; },
    set value(__cxx_lvalue_0) { g_freezerSelfDamage = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/global.h:104
export let g_gameQuit = 0;
export function __cxx_global_cell_95fa142e229b514815549935() {
  return __cxx_global_cell_95fa142e229b514815549935.reference || (__cxx_global_cell_95fa142e229b514815549935.reference = {
    __cReference: true,
    get value() { return g_gameQuit; },
    set value(__cxx_lvalue_0) { g_gameQuit = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/global.h:105
export let g_globalRandom = 0;
export function __cxx_global_cell_9d6515c82c71e88f9c98473e() {
  return __cxx_global_cell_9d6515c82c71e88f9c98473e.reference || (__cxx_global_cell_9d6515c82c71e88f9c98473e.reference = {
    __cReference: true,
    get value() { return g_globalRandom; },
    set value(__cxx_lvalue_0) { g_globalRandom = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/global.h:106
export let g_impactDamage = 0;
export function __cxx_global_cell_35041d56fffbae8d2a330213() {
  return __cxx_global_cell_35041d56fffbae8d2a330213.reference || (__cxx_global_cell_35041d56fffbae8d2a330213.reference = {
    __cReference: true,
    get value() { return g_impactDamage; },
    set value(__cxx_lvalue_0) { g_impactDamage = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/global.h:107
export let g_labelCnt = 0;
export function __cxx_global_cell_6742302ef915e025d82bcd36() {
  return __cxx_global_cell_6742302ef915e025d82bcd36.reference || (__cxx_global_cell_6742302ef915e025d82bcd36.reference = {
    __cReference: true,
    get value() { return g_labelCnt; },
    set value(__cxx_lvalue_0) { g_labelCnt = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/global.h:108
export let g_maxPlayerHealth = 0;
export function __cxx_global_cell_e75226e761a45fe1770321b0() {
  return __cxx_global_cell_e75226e761a45fe1770321b0.reference || (__cxx_global_cell_e75226e761a45fe1770321b0.reference = {
    __cReference: true,
    get value() { return g_maxPlayerHealth; },
    set value(__cxx_lvalue_0) { g_maxPlayerHealth = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/global.h:109
export let g_mirrorCount = 0;
export function __cxx_global_cell_de120b7cdf1fa8f4e75f3b12() {
  return __cxx_global_cell_de120b7cdf1fa8f4e75f3b12.reference || (__cxx_global_cell_de120b7cdf1fa8f4e75f3b12.reference = {
    __cReference: true,
    get value() { return g_mirrorCount; },
    set value(__cxx_lvalue_0) { g_mirrorCount = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/global.h:110
export let g_mostConcurrentPlayers = 0;
export function __cxx_global_cell_462926f90efdfe463807ff55() {
  return __cxx_global_cell_462926f90efdfe463807ff55.reference || (__cxx_global_cell_462926f90efdfe463807ff55.reference = {
    __cReference: true,
    get value() { return g_mostConcurrentPlayers; },
    set value(__cxx_lvalue_0) { g_mostConcurrentPlayers = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/global.h:111
export let g_musicSize = 0;
export function __cxx_global_cell_62371091f3ee3ea2b22026d7() {
  return __cxx_global_cell_62371091f3ee3ea2b22026d7.reference || (__cxx_global_cell_62371091f3ee3ea2b22026d7.reference = {
    __cReference: true,
    get value() { return g_musicSize; },
    set value(__cxx_lvalue_0) { g_musicSize = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/global.h:112
export let g_playerSpawnCnt = 0;
export function __cxx_global_cell_723c54e02b4279ab2035081e() {
  return __cxx_global_cell_723c54e02b4279ab2035081e.reference || (__cxx_global_cell_723c54e02b4279ab2035081e.reference = {
    __cReference: true,
    get value() { return g_playerSpawnCnt; },
    set value(__cxx_lvalue_0) { g_playerSpawnCnt = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/global.h:113
export let g_scriptDebug = 0;
export function __cxx_global_cell_428952e2c5a589c67db10fcc() {
  return __cxx_global_cell_428952e2c5a589c67db10fcc.reference || (__cxx_global_cell_428952e2c5a589c67db10fcc.reference = {
    __cReference: true,
    get value() { return g_scriptDebug; },
    set value(__cxx_lvalue_0) { g_scriptDebug = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/global.h:114
export let g_showShareware = 0;
export function __cxx_global_cell_640dd220b3f0967469c40b50() {
  return __cxx_global_cell_640dd220b3f0967469c40b50.reference || (__cxx_global_cell_640dd220b3f0967469c40b50.reference = {
    __cReference: true,
    get value() { return g_showShareware; },
    set value(__cxx_lvalue_0) { g_showShareware = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/global.h:115
export let g_spriteDeleteQueuePos = 0;
export function __cxx_global_cell_b83ef053117d51017ee6c222() {
  return __cxx_global_cell_b83ef053117d51017ee6c222.reference || (__cxx_global_cell_b83ef053117d51017ee6c222.reference = {
    __cReference: true,
    get value() { return g_spriteDeleteQueuePos; },
    set value(__cxx_lvalue_0) { g_spriteDeleteQueuePos = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/global.h:116
export let g_startArmorAmount = 0;
export function __cxx_global_cell_2bd4d302631cb2e7f9cab27e() {
  return __cxx_global_cell_2bd4d302631cb2e7f9cab27e.reference || (__cxx_global_cell_2bd4d302631cb2e7f9cab27e.reference = {
    __cReference: true,
    get value() { return g_startArmorAmount; },
    set value(__cxx_lvalue_0) { g_startArmorAmount = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/global.h:117
export let g_tripbombLaserMode = 0;
export function __cxx_global_cell_bb57c023dc177e6059e96f1a() {
  return __cxx_global_cell_bb57c023dc177e6059e96f1a.reference || (__cxx_global_cell_bb57c023dc177e6059e96f1a.reference = {
    __cReference: true,
    get value() { return g_tripbombLaserMode; },
    set value(__cxx_lvalue_0) { g_tripbombLaserMode = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/global.h:118
export let screenpeek = 0;
export function __cxx_global_cell_458f422a7bebe88265e9f694() {
  return __cxx_global_cell_458f422a7bebe88265e9f694.reference || (__cxx_global_cell_458f422a7bebe88265e9f694.reference = {
    __cReference: true,
    get value() { return screenpeek; },
    set value(__cxx_lvalue_0) { screenpeek = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/global.h:126
export let g_cloudX = 0;
export function __cxx_global_cell_13be58e164425bc1433880b5() {
  return __cxx_global_cell_13be58e164425bc1433880b5.reference || (__cxx_global_cell_13be58e164425bc1433880b5.reference = {
    __cReference: true,
    get value() { return g_cloudX; },
    set value(__cxx_lvalue_0) { g_cloudX = (((__cxx_lvalue_0) << 16) >> 16); }
  });
}

// C/C++ source: source/duke3d/src/global.h:127
export let g_cloudY = 0;
export function __cxx_global_cell_cd9e3fd19bbbc2e1259f56a8() {
  return __cxx_global_cell_cd9e3fd19bbbc2e1259f56a8.reference || (__cxx_global_cell_cd9e3fd19bbbc2e1259f56a8.reference = {
    __cReference: true,
    get value() { return g_cloudY; },
    set value(__cxx_lvalue_0) { g_cloudY = (((__cxx_lvalue_0) << 16) >> 16); }
  });
}

// C/C++ source: source/duke3d/src/global.h:160
export let g_noEnemies = 0;
export function __cxx_global_cell_1a2868735eb0bc70fe0a0140() {
  return __cxx_global_cell_1a2868735eb0bc70fe0a0140.reference || (__cxx_global_cell_1a2868735eb0bc70fe0a0140.reference = {
    __cReference: true,
    get value() { return g_noEnemies; },
    set value(__cxx_lvalue_0) { g_noEnemies = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/global.h:161
export let g_restorePalette = 0;
export function __cxx_global_cell_305f0ee39b11eeb0d4e07876() {
  return __cxx_global_cell_305f0ee39b11eeb0d4e07876.reference || (__cxx_global_cell_305f0ee39b11eeb0d4e07876.reference = {
    __cReference: true,
    get value() { return g_restorePalette; },
    set value(__cxx_lvalue_0) { g_restorePalette = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/global.h:162
export let g_screenCapture = 0;
export function __cxx_global_cell_2b417489d42f8eed53787b0e() {
  return __cxx_global_cell_2b417489d42f8eed53787b0e.reference || (__cxx_global_cell_2b417489d42f8eed53787b0e.reference = {
    __cReference: true,
    get value() { return g_screenCapture; },
    set value(__cxx_lvalue_0) { g_screenCapture = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/global.h:164
export let everyothertime = 0;
export function __cxx_global_cell_aa5b630a7a35e6b022a5f20e() {
  return __cxx_global_cell_aa5b630a7a35e6b022a5f20e.reference || (__cxx_global_cell_aa5b630a7a35e6b022a5f20e.reference = {
    __cReference: true,
    get value() { return everyothertime; },
    set value(__cxx_lvalue_0) { everyothertime = u32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/global.h:165
export let g_moveThingsCount = 0;
export function __cxx_global_cell_8c6782a4c9205a0e62d08d6b() {
  return __cxx_global_cell_8c6782a4c9205a0e62d08d6b.reference || (__cxx_global_cell_8c6782a4c9205a0e62d08d6b.reference = {
    __cReference: true,
    get value() { return g_moveThingsCount; },
    set value(__cxx_lvalue_0) { g_moveThingsCount = u32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/global.h:166
export let g_gameUpdateTime = 0;
export function __cxx_global_cell_16c27b81c3ce38223cbeb0b0() {
  return __cxx_global_cell_16c27b81c3ce38223cbeb0b0.reference || (__cxx_global_cell_16c27b81c3ce38223cbeb0b0.reference = {
    __cReference: true,
    get value() { return g_gameUpdateTime; },
    set value(__cxx_lvalue_0) { g_gameUpdateTime = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/duke3d/src/global.h:167
export let g_gameUpdateAndDrawTime = 0;
export function __cxx_global_cell_cb235a69fcd6fb51243af95d() {
  return __cxx_global_cell_cb235a69fcd6fb51243af95d.reference || (__cxx_global_cell_cb235a69fcd6fb51243af95d.reference = {
    __cReference: true,
    get value() { return g_gameUpdateAndDrawTime; },
    set value(__cxx_lvalue_0) { g_gameUpdateAndDrawTime = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/duke3d/src/global.h:169
export let g_gameUpdateAvgTime = 0;
export function __cxx_global_cell_ed045c198d4ea4d9c696a493() {
  return __cxx_global_cell_ed045c198d4ea4d9c696a493.reference || (__cxx_global_cell_ed045c198d4ea4d9c696a493.reference = {
    __cReference: true,
    get value() { return g_gameUpdateAvgTime; },
    set value(__cxx_lvalue_0) { g_gameUpdateAvgTime = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/duke3d/src/global.h:171
export let g_frameJustDrawn = false;
export function __cxx_global_cell_5130ffed09d9430dd5f32ab6() {
  return __cxx_global_cell_5130ffed09d9430dd5f32ab6.reference || (__cxx_global_cell_5130ffed09d9430dd5f32ab6.reference = {
    __cReference: true,
    get value() { return g_frameJustDrawn; },
    set value(__cxx_lvalue_0) { g_frameJustDrawn = Boolean(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/global.h:172
export let g_lastFrameStartTime = 0n;
export function __cxx_global_cell_b299e7de5ba2bf52c127cd92() {
  return __cxx_global_cell_b299e7de5ba2bf52c127cd92.reference || (__cxx_global_cell_b299e7de5ba2bf52c127cd92.reference = {
    __cReference: true,
    get value() { return g_lastFrameStartTime; },
    set value(__cxx_lvalue_0) { g_lastFrameStartTime = u64(__cxx_lvalue_0); }
  });
}

export let g_lastFrameEndTime = 0n;
export function __cxx_global_cell_982d03e32c69f27b39463a83() {
  return __cxx_global_cell_982d03e32c69f27b39463a83.reference || (__cxx_global_cell_982d03e32c69f27b39463a83.reference = {
    __cReference: true,
    get value() { return g_lastFrameEndTime; },
    set value(__cxx_lvalue_0) { g_lastFrameEndTime = u64(__cxx_lvalue_0); }
  });
}

export let g_lastFrameDuration = 0n;
export function __cxx_global_cell_c10bd100c9555dc18d0d8d99() {
  return __cxx_global_cell_c10bd100c9555dc18d0d8d99.reference || (__cxx_global_cell_c10bd100c9555dc18d0d8d99.reference = {
    __cReference: true,
    get value() { return g_lastFrameDuration; },
    set value(__cxx_lvalue_0) { g_lastFrameDuration = u64(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/global.h:173
export let g_lastFrameEndTime2 = 0n;
export function __cxx_global_cell_76e4c4038ad7940389bef366() {
  return __cxx_global_cell_76e4c4038ad7940389bef366.reference || (__cxx_global_cell_76e4c4038ad7940389bef366.reference = {
    __cReference: true,
    get value() { return g_lastFrameEndTime2; },
    set value(__cxx_lvalue_0) { g_lastFrameEndTime2 = u64(__cxx_lvalue_0); }
  });
}

export let g_lastFrameDuration2 = 0n;
export function __cxx_global_cell_d0b686eb0915681046d8c846() {
  return __cxx_global_cell_d0b686eb0915681046d8c846.reference || (__cxx_global_cell_d0b686eb0915681046d8c846.reference = {
    __cReference: true,
    get value() { return g_lastFrameDuration2; },
    set value(__cxx_lvalue_0) { g_lastFrameDuration2 = u64(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/global.h:174
export let g_frameCounter = 0;
export function __cxx_global_cell_006d2f42978c12e7d8b6a15f() {
  return __cxx_global_cell_006d2f42978c12e7d8b6a15f.reference || (__cxx_global_cell_006d2f42978c12e7d8b6a15f.reference = {
    __cReference: true,
    get value() { return g_frameCounter; },
    set value(__cxx_lvalue_0) { g_frameCounter = u32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/global.h:175
export let g_restartFrameRoutine = 0;
export function __cxx_global_cell_3e65d7d761ef7b69960481e2() {
  return __cxx_global_cell_3e65d7d761ef7b69960481e2.reference || (__cxx_global_cell_3e65d7d761ef7b69960481e2.reference = {
    __cReference: true,
    get value() { return g_restartFrameRoutine; },
    set value(__cxx_lvalue_0) { g_restartFrameRoutine = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/global.cpp:106
export let g_rpgRadius = i32(1780);
export function __cxx_global_cell_c725c74fe2c9d83b97894533() {
  return __cxx_global_cell_c725c74fe2c9d83b97894533.reference || (__cxx_global_cell_c725c74fe2c9d83b97894533.reference = {
    __cReference: true,
    get value() { return g_rpgRadius; },
    set value(__cxx_lvalue_0) { g_rpgRadius = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/global.cpp:107
export let g_scriptSize = i32(1048576);
export function __cxx_global_cell_3a4a097e79a13fa668e3fd57() {
  return __cxx_global_cell_3a4a097e79a13fa668e3fd57.reference || (__cxx_global_cell_3a4a097e79a13fa668e3fd57.reference = {
    __cReference: true,
    get value() { return g_scriptSize; },
    set value(__cxx_lvalue_0) { g_scriptSize = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/global.cpp:108
export let g_seenineRadius = i32(2048);
export function __cxx_global_cell_af78946ba4f03068d5c18b7b() {
  return __cxx_global_cell_af78946ba4f03068d5c18b7b.reference || (__cxx_global_cell_af78946ba4f03068d5c18b7b.reference = {
    __cReference: true,
    get value() { return g_seenineRadius; },
    set value(__cxx_lvalue_0) { g_seenineRadius = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/global.cpp:109
export let g_shrinkerRadius = i32(650);
export function __cxx_global_cell_2519a794ef91626313d8500b() {
  return __cxx_global_cell_2519a794ef91626313d8500b.reference || (__cxx_global_cell_2519a794ef91626313d8500b.reference = {
    __cReference: true,
    get value() { return g_shrinkerRadius; },
    set value(__cxx_lvalue_0) { g_shrinkerRadius = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/global.cpp:110
export let g_spriteGravity = i32(176);
export function __cxx_global_cell_b1c97a6bfe6b79b1e897a68a() {
  return __cxx_global_cell_b1c97a6bfe6b79b1e897a68a.reference || (__cxx_global_cell_b1c97a6bfe6b79b1e897a68a.reference = {
    __cReference: true,
    get value() { return g_spriteGravity; },
    set value(__cxx_lvalue_0) { g_spriteGravity = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/global.cpp:111
export let g_timerTicsPerSecond = i32(120);
export function __cxx_global_cell_6cd091f46d4420dd6ef3142e() {
  return __cxx_global_cell_6cd091f46d4420dd6ef3142e.reference || (__cxx_global_cell_6cd091f46d4420dd6ef3142e.reference = {
    __cReference: true,
    get value() { return g_timerTicsPerSecond; },
    set value(__cxx_lvalue_0) { g_timerTicsPerSecond = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/global.cpp:112
export let g_tripbombRadius = i32(3880);
export function __cxx_global_cell_f06cc89b42ea26c6f8c956f2() {
  return __cxx_global_cell_f06cc89b42ea26c6f8c956f2.reference || (__cxx_global_cell_f06cc89b42ea26c6f8c956f2.reference = {
    __cReference: true,
    get value() { return g_tripbombRadius; },
    set value(__cxx_lvalue_0) { g_tripbombRadius = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/global.cpp:114
export let g_blimpSpawnItems = new Int16Array([RPGSPRITE____header_global_03e7ca5ce3453d3c, CHAINGUNSPRITE____header_global_9c12cca6f038562f, DEVISTATORAMMO____header_global_a1a5e5a30dc7c727, RPGAMMO____header_global_f24104a903b8deba, RPGAMMO____header_global_f24104a903b8deba, JETPACK____header_global_1fa75b398760317c, SHIELD____header_global_d9c938b9e43ea3ad, FIRSTAID____header_global_00486630ed81ef54, STEROIDS____header_global_f4d11f31dd5cb7fd, RPGAMMO____header_global_f24104a903b8deba, RPGAMMO____header_global_f24104a903b8deba, RPGSPRITE____header_global_03e7ca5ce3453d3c, RPGAMMO____header_global_f24104a903b8deba, FREEZESPRITE____header_global_b492258a356edfb5, FREEZEAMMO____header_global_a6ddc6bafaefda66]);
function __cxx_static_address_28a53dbf80810aea9a9906ee() {
  return __cxx_static_address_28a53dbf80810aea9a9906ee.reference || (__cxx_static_address_28a53dbf80810aea9a9906ee.reference = {
    __cReference: true,
    get value() { return g_blimpSpawnItems; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/global.cpp:133
export let CheatKeys = new Uint8Array([((32) & 255), ((49) & 255)]);
function __cxx_static_address_af1e7d4a7eb0c1ad880dc189() {
  return __cxx_static_address_af1e7d4a7eb0c1ad880dc189.reference || (__cxx_static_address_af1e7d4a7eb0c1ad880dc189.reference = {
    __cReference: true,
    get value() { return CheatKeys; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/global.cpp:135
export let g_setupFileName = (() => { const bytes = new Uint8Array(256); bytes.set([101, 100, 117, 107, 101, 51, 50, 46, 99, 102, 103]); return bytes; })();
function __cxx_static_address_17b7a8850094fc803b7a7d25() {
  return __cxx_static_address_17b7a8850094fc803b7a7d25.reference || (__cxx_static_address_17b7a8850094fc803b7a7d25.reference = {
    __cReference: true,
    get value() { return g_setupFileName; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_d87ccb635969905f = new Uint8Array([((1) & 255), ((2) & 255), ((4) & 255), ((8) & 255), ((16) & 255), ((32) & 255), ((64) & 255), ((128) & 255)]);
function __cxx_static_address_dd11ebbd163256f5ccd307f6() {
  return __cxx_static_address_dd11ebbd163256f5ccd307f6.reference || (__cxx_static_address_dd11ebbd163256f5ccd307f6.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_d87ccb635969905f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:172
export const g_defaultVideoModes__header_global_00a685b6003e8958 = cByteRecordNDArray({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, [25], {}, [cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 2560, "y": 1440}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 2560, "y": 1200}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 2560, "y": 1080}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1920, "y": 1440}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1920, "y": 1200}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1920, "y": 1080}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1680, "y": 1050}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1600, "y": 1200}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1600, "y": 900}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1366, "y": 768}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1280, "y": 1024}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1280, "y": 960}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1280, "y": 720}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1152, "y": 864}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1024, "y": 768}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1024, "y": 600}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 800, "y": 600}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 640, "y": 480}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 640, "y": 400}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 512, "y": 384}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 480, "y": 360}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 400, "y": 300}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 320, "y": 240}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 320, "y": 200}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 0, "y": 0}, null, {})]);
function __cxx_static_address_61309406f1904f9e4521cd2a() {
  return __cxx_static_address_61309406f1904f9e4521cd2a.reference || (__cxx_static_address_61309406f1904f9e4521cd2a.reference = {
    __cReference: true,
    get value() { return g_defaultVideoModes__header_global_00a685b6003e8958; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:188
export const g_keyAsciiTable__header_global_daa0adad8a147185 = new Uint8Array([((0) & 255), ((0) & 255), 49, 50, 51, 52, 53, 54, 55, 56, 57, 48, 45, 61, ((0) & 255), ((0) & 255), 113, 119, 101, 114, 116, 121, 117, 105, 111, 112, 91, 93, ((0) & 255), ((0) & 255), 97, 115, 100, 102, 103, 104, 106, 107, 108, 59, ((39) & 255), 96, ((0) & 255), ((92) & 255), 122, 120, 99, 118, 98, 110, 109, 44, 46, 47, ((0) & 255), 42, ((0) & 255), ((32) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255)]);
function __cxx_static_address_bbf3e7eeeb0dc24800ab3809() {
  return __cxx_static_address_bbf3e7eeeb0dc24800ab3809.reference || (__cxx_static_address_bbf3e7eeeb0dc24800ab3809.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTable__header_global_daa0adad8a147185; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:196
export const g_keyAsciiTableShift__header_global_5e440bd907d401f1 = new Uint8Array([((0) & 255), ((0) & 255), 33, 64, 35, 36, 37, 94, 38, 42, 40, 41, 95, 43, ((0) & 255), ((0) & 255), 81, 87, 69, 82, 84, 89, 85, 73, 79, 80, 123, 125, ((0) & 255), ((0) & 255), 65, 83, 68, 70, 71, 72, 74, 75, 76, 58, 34, 126, ((0) & 255), 124, 90, 88, 67, 86, 66, 78, 77, 60, 62, 63, ((0) & 255), 42, ((0) & 255), ((32) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255)]);
function __cxx_static_address_b69db263dbcac94861e0e664() {
  return __cxx_static_address_b69db263dbcac94861e0e664.reference || (__cxx_static_address_b69db263dbcac94861e0e664.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTableShift__header_global_5e440bd907d401f1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:895
export const pow2long__header_global_ffb0b37ea121c1d0 = new Int32Array([1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576, 2097152, 4194304, 8388608, 16777216, 33554432, 67108864, 134217728, 268435456, 536870912, 1073741824, 2147483647]);
function __cxx_static_address_4fc073490d86f49f710c97e6() {
  return __cxx_static_address_4fc073490d86f49f710c97e6.reference || (__cxx_static_address_4fc073490d86f49f710c97e6.reference = {
    __cReference: true,
    get value() { return pow2long__header_global_ffb0b37ea121c1d0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:907
export const pow2ulong__header_global_7dfdb64c42c21635 = new Uint32Array([u32(1), u32(2), u32(4), u32(8), u32(16), u32(32), u32(64), u32(128), u32(256), u32(512), u32(1024), u32(2048), u32(4096), u32(8192), u32(16384), u32(32768), u32(65536), u32(131072), u32(262144), u32(524288), u32(1048576), u32(2097152), u32(4194304), u32(8388608), u32(16777216), u32(33554432), u32(67108864), u32(134217728), u32(268435456), u32(536870912), u32(1073741824), u32(2147483648n)]);
function __cxx_static_address_beaaed0681083bdccd19781e() {
  return __cxx_static_address_beaaed0681083bdccd19781e.reference || (__cxx_static_address_beaaed0681083bdccd19781e.reference = {
    __cReference: true,
    get value() { return pow2ulong__header_global_7dfdb64c42c21635; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:919
export const pow264__header_global_b4c1254bc89929e9 = new BigInt64Array([BigInt(i64(1)), BigInt(i64(2)), BigInt(i64(4)), BigInt(i64(8)), BigInt(i64(16)), BigInt(i64(32)), BigInt(i64(64)), BigInt(i64(128)), BigInt(i64(256)), BigInt(i64(512)), BigInt(i64(1024)), BigInt(i64(2048)), BigInt(i64(4096)), BigInt(i64(8192)), BigInt(i64(16384)), BigInt(i64(32768)), BigInt(i64(65536)), BigInt(i64(131072)), BigInt(i64(262144)), BigInt(i64(524288)), BigInt(i64(1048576)), BigInt(i64(2097152)), BigInt(i64(4194304)), BigInt(i64(8388608)), BigInt(i64(16777216)), BigInt(i64(33554432)), BigInt(i64(67108864)), BigInt(i64(134217728)), BigInt(i64(268435456)), BigInt(i64(536870912)), BigInt(i64(1073741824)), BigInt(2147483648n), BigInt(4294967296n), BigInt(8589934592n), BigInt(17179869184n), BigInt(34359738368n), BigInt(68719476736n), BigInt(137438953472n), BigInt(274877906944n), BigInt(549755813888n), BigInt(1099511627776n), BigInt(2199023255552n), BigInt(4398046511104n), BigInt(8796093022208n), BigInt(17592186044416n), BigInt(35184372088832n), BigInt(70368744177664n), BigInt(140737488355328n), BigInt(281474976710656n), BigInt(562949953421312n), BigInt(1125899906842624n), BigInt(2251799813685248n), BigInt(4503599627370496n), BigInt(9007199254740992n), BigInt(18014398509481984n), BigInt(36028797018963968n), BigInt(72057594037927936n), BigInt(144115188075855872n), BigInt(288230376151711744n), BigInt(576460752303423488n), BigInt(1152921504606846976n), BigInt(2305843009213693952n), BigInt(4611686018427387904n), BigInt(9223372036854775807n)]);
function __cxx_static_address_f726f99a84b901c7f92a2286() {
  return __cxx_static_address_f726f99a84b901c7f92a2286.reference || (__cxx_static_address_f726f99a84b901c7f92a2286.reference = {
    __cReference: true,
    get value() { return pow264__header_global_b4c1254bc89929e9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/mact/include/keyboard.h:47
export const sctokeylut__header_global_e39c2f7f087b2393 = cByteRecordNDArray({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, [102], {}, [cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([69, 115, 99, 97, 112, 101, 0]), "sc": ((1) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([49, 0]), "sc": ((2) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([50, 0]), "sc": ((3) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([51, 0]), "sc": ((4) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([52, 0]), "sc": ((5) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([53, 0]), "sc": ((6) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([54, 0]), "sc": ((7) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([55, 0]), "sc": ((8) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([56, 0]), "sc": ((9) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([57, 0]), "sc": ((10) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([48, 0]), "sc": ((11) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([45, 0]), "sc": ((12) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([61, 0]), "sc": ((13) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([66, 97, 107, 83, 112, 99, 0]), "sc": ((14) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([84, 97, 98, 0]), "sc": ((15) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([81, 0]), "sc": ((16) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([87, 0]), "sc": ((17) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([69, 0]), "sc": ((18) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([82, 0]), "sc": ((19) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([84, 0]), "sc": ((20) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([89, 0]), "sc": ((21) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([85, 0]), "sc": ((22) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([73, 0]), "sc": ((23) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([79, 0]), "sc": ((24) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([80, 0]), "sc": ((25) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([91, 0]), "sc": ((26) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([93, 0]), "sc": ((27) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([69, 110, 116, 101, 114, 0]), "sc": ((28) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([76, 67, 116, 114, 108, 0]), "sc": ((29) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([65, 0]), "sc": ((30) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([83, 0]), "sc": ((31) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([68, 0]), "sc": ((32) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 0]), "sc": ((33) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([71, 0]), "sc": ((34) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([72, 0]), "sc": ((35) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([74, 0]), "sc": ((36) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 0]), "sc": ((37) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([76, 0]), "sc": ((38) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([59, 0]), "sc": ((39) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([39, 0]), "sc": ((40) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([96, 0]), "sc": ((41) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([76, 83, 104, 105, 102, 116, 0]), "sc": ((42) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([66, 97, 99, 107, 115, 108, 97, 115, 104, 0]), "sc": ((43) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([90, 0]), "sc": ((44) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([88, 0]), "sc": ((45) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([67, 0]), "sc": ((46) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([86, 0]), "sc": ((47) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([66, 0]), "sc": ((48) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([78, 0]), "sc": ((49) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([77, 0]), "sc": ((50) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([44, 0]), "sc": ((51) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([46, 0]), "sc": ((52) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([47, 0]), "sc": ((53) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([82, 83, 104, 105, 102, 116, 0]), "sc": ((54) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 42, 0]), "sc": ((55) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([76, 65, 108, 116, 0]), "sc": ((56) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([83, 112, 97, 99, 101, 0]), "sc": ((57) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([67, 97, 112, 76, 99, 107, 0]), "sc": ((58) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 49, 0]), "sc": ((59) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 50, 0]), "sc": ((60) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 51, 0]), "sc": ((61) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 52, 0]), "sc": ((62) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 53, 0]), "sc": ((63) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 54, 0]), "sc": ((64) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 55, 0]), "sc": ((65) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 56, 0]), "sc": ((66) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 57, 0]), "sc": ((67) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 49, 48, 0]), "sc": ((68) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([78, 117, 109, 76, 99, 107, 0]), "sc": ((69) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([83, 99, 114, 76, 99, 107, 0]), "sc": ((70) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 55, 0]), "sc": ((71) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 56, 0]), "sc": ((72) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 57, 0]), "sc": ((73) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 45, 0]), "sc": ((74) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 52, 0]), "sc": ((75) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 53, 0]), "sc": ((76) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 54, 0]), "sc": ((77) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 43, 0]), "sc": ((78) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 49, 0]), "sc": ((79) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 50, 0]), "sc": ((80) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 51, 0]), "sc": ((81) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 48, 0]), "sc": ((82) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 46, 0]), "sc": ((83) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([76, 101, 115, 115, 84, 104, 97, 110, 0]), "sc": ((86) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 49, 49, 0]), "sc": ((87) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 49, 50, 0]), "sc": ((88) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 100, 69, 110, 116, 0]), "sc": ((156) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([82, 67, 116, 114, 108, 0]), "sc": ((157) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 47, 0]), "sc": ((181) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([82, 65, 108, 116, 0]), "sc": ((184) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([80, 114, 116, 83, 99, 110, 0]), "sc": ((183) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([80, 97, 117, 115, 101, 0]), "sc": ((197) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([72, 111, 109, 101, 0]), "sc": ((199) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([85, 112, 0]), "sc": ((200) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([80, 103, 85, 112, 0]), "sc": ((201) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([76, 101, 102, 116, 0]), "sc": ((203) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([82, 105, 103, 104, 116, 0]), "sc": ((205) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([69, 110, 100, 0]), "sc": ((207) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([68, 111, 119, 110, 0]), "sc": ((208) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([80, 103, 68, 110, 0]), "sc": ((209) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([73, 110, 115, 101, 114, 116, 0]), "sc": ((210) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([68, 101, 108, 101, 116, 101, 0]), "sc": ((211) & 255)}, null, {})]);
function __cxx_static_address_319b206778f5eb352da64d95() {
  return __cxx_static_address_319b206778f5eb352da64d95.reference || (__cxx_static_address_319b206778f5eb352da64d95.reference = {
    __cReference: true,
    get value() { return sctokeylut__header_global_e39c2f7f087b2393; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/global.h:48
export let oldipos = new Int32Array(16384);
function __cxx_static_address_b6aee733ce4e14234025e77b() {
  return __cxx_static_address_b6aee733ce4e14234025e77b.reference || (__cxx_static_address_b6aee733ce4e14234025e77b.reference = {
    __cReference: true,
    get value() { return oldipos; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/global.h:49
export let curipos = cPointerArray(16384);
function __cxx_static_address_ca0300f6cf9f53de7956fe30() {
  return __cxx_static_address_ca0300f6cf9f53de7956fe30.reference || (__cxx_static_address_ca0300f6cf9f53de7956fe30.reference = {
    __cReference: true,
    get value() { return curipos; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/global.h:50
export let bakipos = new Int32Array(16384);
function __cxx_static_address_799d95ce84fa694a6698674e() {
  return __cxx_static_address_799d95ce84fa694a6698674e.reference || (__cxx_static_address_799d95ce84fa694a6698674e.reference = {
    __cReference: true,
    get value() { return bakipos; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/global.h:66
export let sbar = cZeroAggregate({"byteRecord": {"align": 2, "arrayAlign": 2, "fields": {"ammo_amount": {"length": 13, "native": "Int16Array", "offset": 36, "size": 26}, "curr_weapon": {"native": "Int16Array", "offset": 26, "size": 2}, "frag": {"length": 16, "native": "Uint16Array", "offset": 62, "size": 32}, "got_access": {"native": "Int16Array", "offset": 0, "size": 2}, "gotweapon": {"native": "Uint16Array", "offset": 94, "size": 2}, "heat_on": {"native": "Uint8Array", "offset": 98, "size": 1}, "holoduke_on": {"native": "Int16Array", "offset": 28, "size": 2}, "inv_amount": {"length": 11, "native": "Int16Array", "offset": 4, "size": 22}, "inven_icon": {"native": "Uint8Array", "offset": 96, "size": 1}, "jetpack_on": {"native": "Uint8Array", "offset": 97, "size": 1}, "kickback_pic": {"native": "Int16Array", "offset": 34, "size": 2}, "last_extra": {"native": "Int16Array", "offset": 2, "size": 2}, "last_weapon": {"native": "Int16Array", "offset": 30, "size": 2}, "weapon_pos": {"native": "Int16Array", "offset": 32, "size": 2}}, "overlaps": false, "size": 100, "union": false}}, {});
export function __cxx_global_cell_9e3f856e68998313827ff18d() {
  return __cxx_global_cell_9e3f856e68998313827ff18d.reference || (__cxx_global_cell_9e3f856e68998313827ff18d.reference = {
    __cReference: true,
    get value() { return sbar; },
    set value(__cxx_lvalue_0) { throw new TypeError("record address cannot replace original object storage"); }
  });
}

// C/C++ source: source/duke3d/src/global.h:67
export let actor = cByteRecordNDArray({"align": 1, "arrayAlign": 4, "fields": {"bpos": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 44}, "ceilingz": {"native": "Int32Array", "offset": 60, "size": 4}, "cgg": {"native": "Uint8Array", "offset": 94, "size": 1}, "dispicnum": {"native": "Int16Array", "offset": 92, "size": 2}, "filler": {"length": 2, "native": "Uint8Array", "offset": 90, "size": 2}, "flags": {"native": "Uint32Array", "offset": 40, "size": 4}, "floorz": {"native": "Int32Array", "offset": 56, "size": 4}, "floorzoffset": {"native": "Int8Array", "offset": 88, "size": 1}, "htang": {"native": "Int16Array", "offset": 74, "size": 2}, "htextra": {"native": "Int16Array", "offset": 76, "size": 2}, "htowner": {"native": "Int16Array", "offset": 78, "size": 2}, "htpicnum": {"native": "Int16Array", "offset": 72, "size": 2}, "lasttransport": {"native": "Uint8Array", "offset": 95, "size": 1}, "lastv": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 64}, "movflag": {"native": "Int16Array", "offset": 80, "size": 2}, "stayput": {"native": "Int16Array", "offset": 86, "size": 2}, "t_data": {"length": 10, "native": "Int32Array", "offset": 0, "size": 40}, "tempang": {"native": "Int16Array", "offset": 82, "size": 2}, "timetosleep": {"native": "Int16Array", "offset": 84, "size": 2}, "waterzoffset": {"native": "Int8Array", "offset": 89, "size": 1}}, "overlaps": true, "size": 96, "union": false}, [16384], {}, []);
function __cxx_static_address_f51014be3afafefe094df684() {
  return __cxx_static_address_f51014be3afafefe094df684.reference || (__cxx_static_address_f51014be3afafefe094df684.reference = {
    __cReference: true,
    get value() { return actor; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/global.h:72
export let g_tileLabels = cPointerArray(30720);
function __cxx_static_address_ed30ec72cfaaabc3aac7d37e() {
  return __cxx_static_address_ed30ec72cfaaabc3aac7d37e.reference || (__cxx_static_address_ed30ec72cfaaabc3aac7d37e.reference = {
    __cReference: true,
    get value() { return g_tileLabels; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/global.h:73
export let g_tile = cByteRecordNDArray({"align": 8, "arrayAlign": 1, "fields": {"cacherange": {"native": "Int32Array", "offset": 36, "size": 4}, "defproj": {"offset": 24, "pointer": true, "size": 8}, "execPtr": {"offset": 0, "pointer": true, "size": 8}, "flags": {"native": "Uint32Array", "offset": 32, "size": 4}, "loadPtr": {"offset": 8, "pointer": true, "size": 8}, "proj": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, [30720], {}, []);
function __cxx_static_address_98245b7e6f2a72ea499c7224() {
  return __cxx_static_address_98245b7e6f2a72ea499c7224.reference || (__cxx_static_address_98245b7e6f2a72ea499c7224.reference = {
    __cReference: true,
    get value() { return g_tile; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/global.h:74
export let animwall = cByteRecordNDArray({"align": 2, "arrayAlign": 1, "fields": {"tag": {"native": "Int16Array", "offset": 2, "size": 2}, "wallnum": {"native": "Int16Array", "offset": 0, "size": 2}}, "overlaps": false, "size": 4, "union": false}, [512], {}, []);
function __cxx_static_address_cd678ddd64425df43deaa271() {
  return __cxx_static_address_cd678ddd64425df43deaa271.reference || (__cxx_static_address_cd678ddd64425df43deaa271.reference = {
    __cReference: true,
    get value() { return animwall; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/global.h:75
export let apStrings = cPointerArray(16384);
function __cxx_static_address_45309fda2c8e85c44ce71452() {
  return __cxx_static_address_45309fda2c8e85c44ce71452.reference || (__cxx_static_address_45309fda2c8e85c44ce71452.reference = {
    __cReference: true,
    get value() { return apStrings; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let apXStrings = cPointerArray(16384);
function __cxx_static_address_defeefba7d11cd8bf8b9a61d() {
  return __cxx_static_address_defeefba7d11cd8bf8b9a61d.reference || (__cxx_static_address_defeefba7d11cd8bf8b9a61d.reference = {
    __cReference: true,
    get value() { return apXStrings; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/global.h:76
export let label = null;
export function __cxx_global_cell_1aca80e8b55c802f7b43740d() {
  return __cxx_global_cell_1aca80e8b55c802f7b43740d.reference || (__cxx_global_cell_1aca80e8b55c802f7b43740d.reference = {
    __cReference: true,
    get value() { return label; },
    set value(__cxx_lvalue_0) { label = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/duke3d/src/global.h:83
export let szPlayerName = new Uint8Array(32);
function __cxx_static_address_4bfa7a96ad1345a5fd116c9a() {
  return __cxx_static_address_4bfa7a96ad1345a5fd116c9a.reference || (__cxx_static_address_4bfa7a96ad1345a5fd116c9a.reference = {
    __cReference: true,
    get value() { return szPlayerName; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/global.h:84
export let tempbuf = new Uint8Array(8192);
function __cxx_static_address_abaa5eb829a75094e9fc5b2c() {
  return __cxx_static_address_abaa5eb829a75094e9fc5b2c.reference || (__cxx_static_address_abaa5eb829a75094e9fc5b2c.reference = {
    __cReference: true,
    get value() { return tempbuf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let packbuf = new Uint8Array(32768);
function __cxx_static_address_231e9dbdb949271be12f9fa3() {
  return __cxx_static_address_231e9dbdb949271be12f9fa3.reference || (__cxx_static_address_231e9dbdb949271be12f9fa3.reference = {
    __cReference: true,
    get value() { return packbuf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let buf = new Uint8Array(1024);
function __cxx_static_address_ff9e8c22088ff3599c2a3af6() {
  return __cxx_static_address_ff9e8c22088ff3599c2a3af6.reference || (__cxx_static_address_ff9e8c22088ff3599c2a3af6.reference = {
    __cReference: true,
    get value() { return buf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/global.h:86
export let typebuf = new Uint8Array(141);
function __cxx_static_address_d2d330d7042f1646709b57a4() {
  return __cxx_static_address_d2d330d7042f1646709b57a4.reference || (__cxx_static_address_d2d330d7042f1646709b57a4.reference = {
    __cReference: true,
    get value() { return typebuf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/global.h:89
export let localInput = cZeroAggregate({"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"bits": {"native": "Uint32Array", "offset": 0, "size": 4}, "extbits": {"native": "Uint32Array", "offset": 16, "size": 4}, "fvel": {"native": "Int16Array", "offset": 4, "size": 2}, "q16avel": {"native": "Int32Array", "offset": 8, "size": 4}, "q16horz": {"native": "Int32Array", "offset": 12, "size": 4}, "svel": {"native": "Int16Array", "offset": 6, "size": 2}}, "overlaps": false, "size": 20, "union": false}}, {});
export function __cxx_global_cell_0faac5865f4b6f1cc5649ea7() {
  return __cxx_global_cell_0faac5865f4b6f1cc5649ea7.reference || (__cxx_global_cell_0faac5865f4b6f1cc5649ea7.reference = {
    __cReference: true,
    get value() { return localInput; },
    set value(__cxx_lvalue_0) { throw new TypeError("record address cannot replace original object storage"); }
  });
}

// C/C++ source: source/duke3d/src/global.h:90
export let recsync = cByteRecordNDArray({"align": 1, "arrayAlign": 1, "fields": {"bits": {"native": "Uint32Array", "offset": 0, "size": 4}, "extbits": {"native": "Uint32Array", "offset": 16, "size": 4}, "fvel": {"native": "Int16Array", "offset": 4, "size": 2}, "q16avel": {"native": "Int32Array", "offset": 8, "size": 4}, "q16horz": {"native": "Int32Array", "offset": 12, "size": 4}, "svel": {"native": "Int16Array", "offset": 6, "size": 2}}, "overlaps": false, "size": 20, "union": false}, [2520], {}, []);
function __cxx_static_address_c612a38cad84e23227435949() {
  return __cxx_static_address_c612a38cad84e23227435949.reference || (__cxx_static_address_c612a38cad84e23227435949.reference = {
    __cReference: true,
    get value() { return recsync; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/global.h:92
export let g_activeVscrSprite = new Int32Array(64);
function __cxx_static_address_5d704c0cfa97b3e6fa7121c3() {
  return __cxx_static_address_5d704c0cfa97b3e6fa7121c3.reference || (__cxx_static_address_5d704c0cfa97b3e6fa7121c3.reference = {
    __cReference: true,
    get value() { return g_activeVscrSprite; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/global.h:93
export let g_activeVscrTile = new Int32Array(64);
function __cxx_static_address_a025bbec189357ba93ff0c09() {
  return __cxx_static_address_a025bbec189357ba93ff0c09.reference || (__cxx_static_address_a025bbec189357ba93ff0c09.reference = {
    __cReference: true,
    get value() { return g_activeVscrTile; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/global.h:120
export let g_animateSect = new Int16Array(1024);
function __cxx_static_address_24a6907bbd507b6e5ff6c344() {
  return __cxx_static_address_24a6907bbd507b6e5ff6c344.reference || (__cxx_static_address_24a6907bbd507b6e5ff6c344.reference = {
    __cReference: true,
    get value() { return g_animateSect; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/global.h:121
export let g_animatePtr = cPointerArray(1024);
function __cxx_static_address_21e719306fe1b8e1078c7666() {
  return __cxx_static_address_21e719306fe1b8e1078c7666.reference || (__cxx_static_address_21e719306fe1b8e1078c7666.reference = {
    __cReference: true,
    get value() { return g_animatePtr; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/global.h:122
export let g_animateGoal = new Int32Array(1024);
function __cxx_static_address_2e438465e9b51aeb31ce7144() {
  return __cxx_static_address_2e438465e9b51aeb31ce7144.reference || (__cxx_static_address_2e438465e9b51aeb31ce7144.reference = {
    __cReference: true,
    get value() { return g_animateGoal; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/global.h:123
export let g_animateVel = new Int32Array(1024);
function __cxx_static_address_86f3c4355f1fbb085b2bfe24() {
  return __cxx_static_address_86f3c4355f1fbb085b2bfe24.reference || (__cxx_static_address_86f3c4355f1fbb085b2bfe24.reference = {
    __cReference: true,
    get value() { return g_animateVel; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/global.h:125
export let g_cloudSect = new Int16Array(256);
function __cxx_static_address_1121c10da5791162a1b9f19c() {
  return __cxx_static_address_1121c10da5791162a1b9f19c.reference || (__cxx_static_address_1121c10da5791162a1b9f19c.reference = {
    __cReference: true,
    get value() { return g_cloudSect; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/global.h:128
export let g_cloudClock = (ClockTicks()).__cxx_construct_3fdb0b4b21c3726c();
export function __cxx_global_cell_134f8f7a37f9a3d5a15b9519() {
  return __cxx_global_cell_134f8f7a37f9a3d5a15b9519.reference || (__cxx_global_cell_134f8f7a37f9a3d5a15b9519.reference = {
    __cReference: true,
    get value() { return g_cloudClock; },
    set value(__cxx_lvalue_0) { throw new TypeError("record address cannot replace original object storage"); }
  });
}

// C/C++ source: source/duke3d/src/global.h:130
export let SpriteDeletionQueue = new Int16Array(1024);
function __cxx_static_address_1bee43db24b0f29ff7698cd2() {
  return __cxx_static_address_1bee43db24b0f29ff7698cd2.reference || (__cxx_static_address_1bee43db24b0f29ff7698cd2.reference = {
    __cReference: true,
    get value() { return SpriteDeletionQueue; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/global.h:131
export let g_cyclers = Array.from({ length: 1024 }, () => new Int16Array(6));
function __cxx_static_address_8f81813ccac516c12a40682c() {
  return __cxx_static_address_8f81813ccac516c12a40682c.reference || (__cxx_static_address_8f81813ccac516c12a40682c.reference = {
    __cReference: true,
    get value() { return g_cyclers; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/global.h:132
export let g_mirrorSector = new Int16Array(64);
function __cxx_static_address_5063a0897ecb768b6d554706() {
  return __cxx_static_address_5063a0897ecb768b6d554706.reference || (__cxx_static_address_5063a0897ecb768b6d554706.reference = {
    __cReference: true,
    get value() { return g_mirrorSector; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/global.h:133
export let g_mirrorWall = new Int16Array(64);
function __cxx_static_address_7d6e2c920fd1a16081b3e07f() {
  return __cxx_static_address_7d6e2c920fd1a16081b3e07f.reference || (__cxx_static_address_7d6e2c920fd1a16081b3e07f.reference = {
    __cReference: true,
    get value() { return g_mirrorWall; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/global.h:134
export let labelcode = null;
export function __cxx_global_cell_bb1aad227706ae6ec200fcf0() {
  return __cxx_global_cell_bb1aad227706ae6ec200fcf0.reference || (__cxx_global_cell_bb1aad227706ae6ec200fcf0.reference = {
    __cReference: true,
    get value() { return labelcode; },
    set value(__cxx_lvalue_0) { labelcode = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/duke3d/src/global.h:135
export let labeltype = null;
export function __cxx_global_cell_ca786e7ce472b03dc90a2ec6() {
  return __cxx_global_cell_ca786e7ce472b03dc90a2ec6.reference || (__cxx_global_cell_ca786e7ce472b03dc90a2ec6.reference = {
    __cReference: true,
    get value() { return labeltype; },
    set value(__cxx_lvalue_0) { labeltype = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/duke3d/src/global.h:136
export let lockclock = (ClockTicks()).__cxx_construct_3fdb0b4b21c3726c();
export function __cxx_global_cell_0f5d76246695f95afb26af0f() {
  return __cxx_global_cell_0f5d76246695f95afb26af0f.reference || (__cxx_global_cell_0f5d76246695f95afb26af0f.reference = {
    __cReference: true,
    get value() { return lockclock; },
    set value(__cxx_lvalue_0) { throw new TypeError("record address cannot replace original object storage"); }
  });
}

// C/C++ source: source/duke3d/src/global.h:137
export let ototalclock = (ClockTicks()).__cxx_construct_3fdb0b4b21c3726c();
export function __cxx_global_cell_25ebc483826d436da41b0007() {
  return __cxx_global_cell_25ebc483826d436da41b0007.reference || (__cxx_global_cell_25ebc483826d436da41b0007.reference = {
    __cReference: true,
    get value() { return ototalclock; },
    set value(__cxx_lvalue_0) { throw new TypeError("record address cannot replace original object storage"); }
  });
}

// C/C++ source: source/duke3d/src/global.h:139
export let apScript = null;
export function __cxx_global_cell_38abf48ab8ba3db5fce877d9() {
  return __cxx_global_cell_38abf48ab8ba3db5fce877d9.reference || (__cxx_global_cell_38abf48ab8ba3db5fce877d9.reference = {
    __cReference: true,
    get value() { return apScript; },
    set value(__cxx_lvalue_0) { apScript = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/duke3d/src/global.h:140
export let g_scriptPtr = null;
export function __cxx_global_cell_7c95f40343184c865284ca02() {
  return __cxx_global_cell_7c95f40343184c865284ca02.reference || (__cxx_global_cell_7c95f40343184c865284ca02.reference = {
    __cReference: true,
    get value() { return g_scriptPtr; },
    set value(__cxx_lvalue_0) { g_scriptPtr = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/duke3d/src/global.h:142
export let g_mapInfo = cByteRecordNDArray({"align": 8, "arrayAlign": 1, "fields": {"designertime": {"native": "Int32Array", "offset": 4, "size": 4}, "filename": {"offset": 16, "pointer": true, "size": 8}, "musicfn": {"offset": 24, "pointer": true, "size": 8}, "name": {"offset": 8, "pointer": true, "size": 8}, "partime": {"native": "Int32Array", "offset": 0, "size": 4}, "savedstate": {"offset": 32, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, [512], {}, []);
function __cxx_static_address_fb50df425f69c06a8fa18910() {
  return __cxx_static_address_fb50df425f69c06a8fa18910.reference || (__cxx_static_address_fb50df425f69c06a8fa18910.reference = {
    __cReference: true,
    get value() { return g_mapInfo; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/global.h:143
export let g_origins = cByteRecordNDArray({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, [2048], {}, []);
function __cxx_static_address_ac30040fab68b9d384351905() {
  return __cxx_static_address_ac30040fab68b9d384351905.reference || (__cxx_static_address_ac30040fab68b9d384351905.reference = {
    __cReference: true,
    get value() { return g_origins; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/global.h:151
export let g_player_s__header_global_b7197fa1f55d8b6b = cByteRecordNDArray({"align": 1, "arrayAlign": 1, "fields": {"frags": {"length": 16, "native": "Uint8Array", "offset": 62, "size": 16}, "gotvote": {"native": "Uint8Array", "offset": 93, "size": 1}, "horizAngleAdjust": {"native": "Int32Array", "offset": 32, "size": 4}, "horizRecenter": {"native": "Int32Array", "offset": 28, "size": 4}, "horizSkew": {"native": "Int32Array", "offset": 36, "size": 4}, "input": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"bits": {"native": "Uint32Array", "offset": 0, "size": 4}, "extbits": {"native": "Uint32Array", "offset": 16, "size": 4}, "fvel": {"native": "Int16Array", "offset": 4, "size": 2}, "q16avel": {"native": "Int32Array", "offset": 8, "size": 4}, "q16horz": {"native": "Int32Array", "offset": 12, "size": 4}, "svel": {"native": "Int16Array", "offset": 6, "size": 2}}, "overlaps": false, "size": 20, "union": false}, "offset": 8}, "lastViewUpdate": {"native": "BigUint64Array", "offset": 40, "size": 8}, "netsynctime": {"native": "Int32Array", "offset": 48, "size": 4}, "pcolor": {"native": "Int32Array", "offset": 52, "size": 4}, "ping": {"native": "Int16Array", "offset": 60, "size": 2}, "pingcnt": {"native": "Uint8Array", "offset": 94, "size": 1}, "playerquitflag": {"native": "Uint8Array", "offset": 95, "size": 1}, "ps": {"offset": 0, "pointer": true, "size": 8}, "pteam": {"native": "Int32Array", "offset": 56, "size": 4}, "ready": {"native": "Uint8Array", "offset": 96, "size": 1}, "revision": {"native": "Uint32Array", "offset": 129, "size": 4}, "smoothcamera": {"native": "Uint8Array", "offset": 91, "size": 1}, "user_name": {"length": 32, "native": "Uint8Array", "offset": 97, "size": 32}, "vote": {"native": "Uint8Array", "offset": 92, "size": 1}, "wchoice": {"length": 13, "native": "Uint8Array", "offset": 78, "size": 13}}, "overlaps": false, "size": 133, "union": false}, [17], {}, []);
function __cxx_static_address_1318ec5f38e34aff6baf84d8() {
  return __cxx_static_address_1318ec5f38e34aff6baf84d8.reference || (__cxx_static_address_1318ec5f38e34aff6baf84d8.reference = {
    __cReference: true,
    get value() { return g_player_s__header_global_b7197fa1f55d8b6b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/global.h:152
export const g_player = cPointerOffset(g_player_s__header_global_b7197fa1f55d8b6b, 1, 133);
function __cxx_static_address_06ab9f6d80182a7c144cbd29() {
  return __cxx_static_address_06ab9f6d80182a7c144cbd29.reference || (__cxx_static_address_06ab9f6d80182a7c144cbd29.reference = {
    __cReference: true,
    get value() { return g_player; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/global.h:156
export let g_playerSpawnPoints = cByteRecordNDArray({"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "ang": {"native": "Int16Array", "offset": 12, "size": 2}, "sect": {"native": "Int16Array", "offset": 14, "size": 2}}, "overlaps": true, "size": 16, "union": false}, [16], {}, []);
function __cxx_static_address_de2ddd6a9039ed3dab6e2204() {
  return __cxx_static_address_de2ddd6a9039ed3dab6e2204.reference || (__cxx_static_address_de2ddd6a9039ed3dab6e2204.reference = {
    __cReference: true,
    get value() { return g_playerSpawnPoints; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/global.h:157
export let inputfifo = cByteRecordNDArray({"align": 1, "arrayAlign": 1, "fields": {"bits": {"native": "Uint32Array", "offset": 0, "size": 4}, "extbits": {"native": "Uint32Array", "offset": 16, "size": 4}, "fvel": {"native": "Int16Array", "offset": 4, "size": 2}, "q16avel": {"native": "Int32Array", "offset": 8, "size": 4}, "q16horz": {"native": "Int32Array", "offset": 12, "size": 4}, "svel": {"native": "Int16Array", "offset": 6, "size": 2}}, "overlaps": false, "size": 20, "union": false}, [2, 16], {}, []);
function __cxx_static_address_03d8997bd08da2b5054870fc() {
  return __cxx_static_address_03d8997bd08da2b5054870fc.reference || (__cxx_static_address_03d8997bd08da2b5054870fc.reference = {
    __cReference: true,
    get value() { return inputfifo; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/global.h:163
export let SpriteProjectile = cByteRecordNDArray({"align": 4, "arrayAlign": 1, "fields": {"bounces": {"native": "Int16Array", "offset": 38, "size": 2}, "bsound": {"native": "Int16Array", "offset": 40, "size": 2}, "clipdist": {"native": "Uint8Array", "offset": 57, "size": 1}, "cstat": {"native": "Int32Array", "offset": 4, "size": 4}, "decal": {"native": "Int16Array", "offset": 28, "size": 2}, "drop": {"native": "Int16Array", "offset": 34, "size": 2}, "extra": {"native": "Int16Array", "offset": 44, "size": 2}, "extra_rand": {"native": "Int16Array", "offset": 46, "size": 2}, "filler": {"length": 2, "native": "Int8Array", "offset": 58, "size": 2}, "flashcolor": {"native": "Int32Array", "offset": 16, "size": 4}, "hitradius": {"native": "Int32Array", "offset": 8, "size": 4}, "isound": {"native": "Int16Array", "offset": 24, "size": 2}, "movecnt": {"native": "Int8Array", "offset": 56, "size": 1}, "offset": {"native": "Int16Array", "offset": 36, "size": 2}, "pal": {"native": "Int8Array", "offset": 55, "size": 1}, "range": {"native": "Int32Array", "offset": 12, "size": 4}, "shade": {"native": "Int8Array", "offset": 52, "size": 1}, "sound": {"native": "Int16Array", "offset": 22, "size": 2}, "spawns": {"native": "Int16Array", "offset": 20, "size": 2}, "sxrepeat": {"native": "Int8Array", "offset": 48, "size": 1}, "syrepeat": {"native": "Int8Array", "offset": 49, "size": 1}, "tnum": {"native": "Int16Array", "offset": 32, "size": 2}, "toffset": {"native": "Int16Array", "offset": 42, "size": 2}, "trail": {"native": "Int16Array", "offset": 30, "size": 2}, "txrepeat": {"native": "Int8Array", "offset": 50, "size": 1}, "tyrepeat": {"native": "Int8Array", "offset": 51, "size": 1}, "userdata": {"native": "Int32Array", "offset": 60, "size": 4}, "vel": {"native": "Int16Array", "offset": 26, "size": 2}, "workslike": {"native": "Int32Array", "offset": 0, "size": 4}, "xrepeat": {"native": "Int8Array", "offset": 53, "size": 1}, "yrepeat": {"native": "Int8Array", "offset": 54, "size": 1}}, "overlaps": false, "size": 64, "union": false}, [16384], {}, []);
function __cxx_static_address_11c6421ef19c1e1146b4f29b() {
  return __cxx_static_address_11c6421ef19c1e1146b4f29b.reference || (__cxx_static_address_11c6421ef19c1e1146b4f29b.reference = {
    __cReference: true,
    get value() { return SpriteProjectile; },
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
