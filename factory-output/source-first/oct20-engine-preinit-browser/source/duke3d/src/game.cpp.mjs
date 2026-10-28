// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/duke3d/src/game.cpp
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
    if (source?.__cReference===true&&source.__cPointer!==true) return extent(source.value,amount);
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
export const fix16_rad_to_deg_mult__header_global_7fa6356a87cc8aef = i32(3754936);
function __cxx_static_address_a9f38bbf0074c6c973146a3a() {
  return __cxx_static_address_a9f38bbf0074c6c973146a3a.reference || (__cxx_static_address_a9f38bbf0074c6c973146a3a.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_7fa6356a87cc8aef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_4b4aada34deeedde = i32(1144);
function __cxx_static_address_8191d66380fbbcd21d1539e9() {
  return __cxx_static_address_8191d66380fbbcd21d1539e9.reference || (__cxx_static_address_8191d66380fbbcd21d1539e9.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_4b4aada34deeedde; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:43
export const KICK_HIT____header_global_1dbaab7d44971d5d = ((((((0) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7de77b6bf840bc0634544719() {
  return __cxx_static_address_7de77b6bf840bc0634544719.reference || (__cxx_static_address_7de77b6bf840bc0634544719.reference = {
    __cReference: true,
    get value() { return KICK_HIT____header_global_1dbaab7d44971d5d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:44
export const PISTOL_RICOCHET____header_global_7ae4961a4c4482b9 = ((((((1) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_12db878a10e661f1ed091414() {
  return __cxx_static_address_12db878a10e661f1ed091414.reference || (__cxx_static_address_12db878a10e661f1ed091414.reference = {
    __cReference: true,
    get value() { return PISTOL_RICOCHET____header_global_7ae4961a4c4482b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:45
export const PISTOL_BODYHIT____header_global_7a519b7cd2952d6f = ((((((2) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8531fadd0401f7d675a98253() {
  return __cxx_static_address_8531fadd0401f7d675a98253.reference || (__cxx_static_address_8531fadd0401f7d675a98253.reference = {
    __cReference: true,
    get value() { return PISTOL_BODYHIT____header_global_7a519b7cd2952d6f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:46
export const PISTOL_FIRE____header_global_90245cf79d237ffc = ((((((3) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3d096168d72b44395f910cfc() {
  return __cxx_static_address_3d096168d72b44395f910cfc.reference || (__cxx_static_address_3d096168d72b44395f910cfc.reference = {
    __cReference: true,
    get value() { return PISTOL_FIRE____header_global_90245cf79d237ffc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:47
export const EJECT_CLIP____header_global_a0e246f49b4f202f = ((((((4) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_70a98ecca0f38ed2745aaf16() {
  return __cxx_static_address_70a98ecca0f38ed2745aaf16.reference || (__cxx_static_address_70a98ecca0f38ed2745aaf16.reference = {
    __cReference: true,
    get value() { return EJECT_CLIP____header_global_a0e246f49b4f202f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:48
export const INSERT_CLIP____header_global_ecc47cea36d11f43 = ((((((5) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_29749290872d4ccf9f489971() {
  return __cxx_static_address_29749290872d4ccf9f489971.reference || (__cxx_static_address_29749290872d4ccf9f489971.reference = {
    __cReference: true,
    get value() { return INSERT_CLIP____header_global_ecc47cea36d11f43; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:49
export const CHAINGUN_FIRE____header_global_7b4f3a9ca43c63c9 = ((((((6) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2e02eff092711e3984623770() {
  return __cxx_static_address_2e02eff092711e3984623770.reference || (__cxx_static_address_2e02eff092711e3984623770.reference = {
    __cReference: true,
    get value() { return CHAINGUN_FIRE____header_global_7b4f3a9ca43c63c9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:50
export const RPG_SHOOT____header_global_3f6db7d8bd0669b3 = ((((((7) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_86c0641d2531a4263afaab3f() {
  return __cxx_static_address_86c0641d2531a4263afaab3f.reference || (__cxx_static_address_86c0641d2531a4263afaab3f.reference = {
    __cReference: true,
    get value() { return RPG_SHOOT____header_global_3f6db7d8bd0669b3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:51
export const POOLBALLHIT____header_global_59957f2d68c15db5 = ((((((8) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2aed3d2e97e3f76345076584() {
  return __cxx_static_address_2aed3d2e97e3f76345076584.reference || (__cxx_static_address_2aed3d2e97e3f76345076584.reference = {
    __cReference: true,
    get value() { return POOLBALLHIT____header_global_59957f2d68c15db5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:52
export const RPG_EXPLODE____header_global_cda3cf4b894985f0 = ((((((9) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7d2df0866d255645b0d5c638() {
  return __cxx_static_address_7d2df0866d255645b0d5c638.reference || (__cxx_static_address_7d2df0866d255645b0d5c638.reference = {
    __cReference: true,
    get value() { return RPG_EXPLODE____header_global_cda3cf4b894985f0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:53
export const CAT_FIRE____header_global_dca7667ca8004062 = ((((((10) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7bfece4f48a5a3cd41adc1fd() {
  return __cxx_static_address_7bfece4f48a5a3cd41adc1fd.reference || (__cxx_static_address_7bfece4f48a5a3cd41adc1fd.reference = {
    __cReference: true,
    get value() { return CAT_FIRE____header_global_dca7667ca8004062; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:54
export const SHRINKER_FIRE____header_global_51383ef1d5b7af11 = ((((((11) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d1c4be8c52c0ca2addd939c2() {
  return __cxx_static_address_d1c4be8c52c0ca2addd939c2.reference || (__cxx_static_address_d1c4be8c52c0ca2addd939c2.reference = {
    __cReference: true,
    get value() { return SHRINKER_FIRE____header_global_51383ef1d5b7af11; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:55
export const PIPEBOMB_BOUNCE____header_global_00a8543f2ed1be30 = ((((((13) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0c11f9268b48887beb3add4c() {
  return __cxx_static_address_0c11f9268b48887beb3add4c.reference || (__cxx_static_address_0c11f9268b48887beb3add4c.reference = {
    __cReference: true,
    get value() { return PIPEBOMB_BOUNCE____header_global_00a8543f2ed1be30; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:56
export const PIPEBOMB_EXPLODE____header_global_4c55390131ab5fd8 = ((((((14) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b60af0ad4d1d96d7d78b707a() {
  return __cxx_static_address_b60af0ad4d1d96d7d78b707a.reference || (__cxx_static_address_b60af0ad4d1d96d7d78b707a.reference = {
    __cReference: true,
    get value() { return PIPEBOMB_EXPLODE____header_global_4c55390131ab5fd8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:57
export const LASERTRIP_ONWALL____header_global_6225b76fd3851ec8 = ((((((15) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_34a80b7e001c244d81e631dd() {
  return __cxx_static_address_34a80b7e001c244d81e631dd.reference || (__cxx_static_address_34a80b7e001c244d81e631dd.reference = {
    __cReference: true,
    get value() { return LASERTRIP_ONWALL____header_global_6225b76fd3851ec8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:58
export const LASERTRIP_ARMING____header_global_618eedcfda66a154 = ((((((16) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ba5dfc664c709c0475d48576() {
  return __cxx_static_address_ba5dfc664c709c0475d48576.reference || (__cxx_static_address_ba5dfc664c709c0475d48576.reference = {
    __cReference: true,
    get value() { return LASERTRIP_ARMING____header_global_618eedcfda66a154; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:59
export const LASERTRIP_EXPLODE____header_global_4df09d9bfc9b0898 = ((((((17) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7ab7de95cd7804807b9040b6() {
  return __cxx_static_address_7ab7de95cd7804807b9040b6.reference || (__cxx_static_address_7ab7de95cd7804807b9040b6.reference = {
    __cReference: true,
    get value() { return LASERTRIP_EXPLODE____header_global_4df09d9bfc9b0898; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:60
export const VENT_BUST____header_global_7049fd73a5218558 = ((((((18) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6157895b4e9b1fb925068ec0() {
  return __cxx_static_address_6157895b4e9b1fb925068ec0.reference || (__cxx_static_address_6157895b4e9b1fb925068ec0.reference = {
    __cReference: true,
    get value() { return VENT_BUST____header_global_7049fd73a5218558; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:61
export const GLASS_BREAKING____header_global_b059a101aa2102cb = ((((((19) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d7991b5f4b1ee52f57a13cd7() {
  return __cxx_static_address_d7991b5f4b1ee52f57a13cd7.reference || (__cxx_static_address_d7991b5f4b1ee52f57a13cd7.reference = {
    __cReference: true,
    get value() { return GLASS_BREAKING____header_global_b059a101aa2102cb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:62
export const GLASS_HEAVYBREAK____header_global_29c1e662e9cec851 = ((((((20) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_92a8ebfc506c9baf2ca166e7() {
  return __cxx_static_address_92a8ebfc506c9baf2ca166e7.reference || (__cxx_static_address_92a8ebfc506c9baf2ca166e7.reference = {
    __cReference: true,
    get value() { return GLASS_HEAVYBREAK____header_global_29c1e662e9cec851; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:63
export const SHORT_CIRCUIT____header_global_8ce4e565f969855d = ((((((21) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_68d79ebe8b52ce9c93c44f18() {
  return __cxx_static_address_68d79ebe8b52ce9c93c44f18.reference || (__cxx_static_address_68d79ebe8b52ce9c93c44f18.reference = {
    __cReference: true,
    get value() { return SHORT_CIRCUIT____header_global_8ce4e565f969855d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:64
export const ITEM_SPLASH____header_global_aa5e3a01f40ab03b = ((((((22) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3f762ee833b1038f7f0bd716() {
  return __cxx_static_address_3f762ee833b1038f7f0bd716.reference || (__cxx_static_address_3f762ee833b1038f7f0bd716.reference = {
    __cReference: true,
    get value() { return ITEM_SPLASH____header_global_aa5e3a01f40ab03b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:65
export const DUKE_GASP____header_global_b1c6415aba0cadc6 = ((((((25) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_104ea5c7861a7b0ab4272dcb() {
  return __cxx_static_address_104ea5c7861a7b0ab4272dcb.reference || (__cxx_static_address_104ea5c7861a7b0ab4272dcb.reference = {
    __cReference: true,
    get value() { return DUKE_GASP____header_global_b1c6415aba0cadc6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:66
export const SLIM_RECOG____header_global_40cb0541b1d6302d = ((((((26) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a5471b6634113426583b3351() {
  return __cxx_static_address_a5471b6634113426583b3351.reference || (__cxx_static_address_a5471b6634113426583b3351.reference = {
    __cReference: true,
    get value() { return SLIM_RECOG____header_global_40cb0541b1d6302d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:67
export const DUKE_URINATE____header_global_94ed7d0e83acaae5 = ((((((28) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e8c80cc6a317ea21ebce1b54() {
  return __cxx_static_address_e8c80cc6a317ea21ebce1b54.reference || (__cxx_static_address_e8c80cc6a317ea21ebce1b54.reference = {
    __cReference: true,
    get value() { return DUKE_URINATE____header_global_94ed7d0e83acaae5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:68
export const ENDSEQVOL3SND2____header_global_1f9fe74fb9757f0b = ((((((29) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e010c91d254a4ef77f64a5b() {
  return __cxx_static_address_1e010c91d254a4ef77f64a5b.reference || (__cxx_static_address_1e010c91d254a4ef77f64a5b.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND2____header_global_1f9fe74fb9757f0b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:69
export const ENDSEQVOL3SND3____header_global_7e87ce7be49ddb1c = ((((((30) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b209a8c89b7e8dcc426e94f9() {
  return __cxx_static_address_b209a8c89b7e8dcc426e94f9.reference || (__cxx_static_address_b209a8c89b7e8dcc426e94f9.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND3____header_global_7e87ce7be49ddb1c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:70
export const DUKE_CRACK____header_global_6706d20ab9bdba63 = ((((((33) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f40d3c185a3edff31d78ffc8() {
  return __cxx_static_address_f40d3c185a3edff31d78ffc8.reference || (__cxx_static_address_f40d3c185a3edff31d78ffc8.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK____header_global_6706d20ab9bdba63; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:71
export const SLIM_ATTACK____header_global_435a02dca7bde90b = ((((((34) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a22ced96674116f672081ba1() {
  return __cxx_static_address_a22ced96674116f672081ba1.reference || (__cxx_static_address_a22ced96674116f672081ba1.reference = {
    __cReference: true,
    get value() { return SLIM_ATTACK____header_global_435a02dca7bde90b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:72
export const SOMETHINGHITFORCE____header_global_18c0885b705bf626 = ((((((35) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8dff09e765b11e3812b9059d() {
  return __cxx_static_address_8dff09e765b11e3812b9059d.reference || (__cxx_static_address_8dff09e765b11e3812b9059d.reference = {
    __cReference: true,
    get value() { return SOMETHINGHITFORCE____header_global_18c0885b705bf626; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:73
export const DUKE_DRINKING____header_global_0c4b8fa43fdf211a = ((((((36) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a17ee61d6bfcd6870208d958() {
  return __cxx_static_address_a17ee61d6bfcd6870208d958.reference || (__cxx_static_address_a17ee61d6bfcd6870208d958.reference = {
    __cReference: true,
    get value() { return DUKE_DRINKING____header_global_0c4b8fa43fdf211a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:74
export const DUKE_GRUNT____header_global_ff1acf89bf99460d = ((((((38) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fd9ff80e5ad7a275a7442952() {
  return __cxx_static_address_fd9ff80e5ad7a275a7442952.reference || (__cxx_static_address_fd9ff80e5ad7a275a7442952.reference = {
    __cReference: true,
    get value() { return DUKE_GRUNT____header_global_ff1acf89bf99460d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:75
export const DUKE_HARTBEAT____header_global_e08d18439a9d4fa2 = ((((((39) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_81e6ba9c4da9759500010e93() {
  return __cxx_static_address_81e6ba9c4da9759500010e93.reference || (__cxx_static_address_81e6ba9c4da9759500010e93.reference = {
    __cReference: true,
    get value() { return DUKE_HARTBEAT____header_global_e08d18439a9d4fa2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:76
export const DUKE_ONWATER____header_global_87b0cce999336535 = ((((((40) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_af2af0c09c598d301312bf4d() {
  return __cxx_static_address_af2af0c09c598d301312bf4d.reference || (__cxx_static_address_af2af0c09c598d301312bf4d.reference = {
    __cReference: true,
    get value() { return DUKE_ONWATER____header_global_87b0cce999336535; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:77
export const DUKE_LAND____header_global_02561ddbdae2c6e9 = ((((((42) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_77d9549143b88dd8c24a7fed() {
  return __cxx_static_address_77d9549143b88dd8c24a7fed.reference || (__cxx_static_address_77d9549143b88dd8c24a7fed.reference = {
    __cReference: true,
    get value() { return DUKE_LAND____header_global_02561ddbdae2c6e9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:78
export const DUKE_WALKINDUCTS____header_global_79b805613e264a9b = ((((((43) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bb24731d16e7d83799aab681() {
  return __cxx_static_address_bb24731d16e7d83799aab681.reference || (__cxx_static_address_bb24731d16e7d83799aab681.reference = {
    __cReference: true,
    get value() { return DUKE_WALKINDUCTS____header_global_79b805613e264a9b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:79
export const DUKE_UNDERWATER____header_global_51a64ed740dda300 = ((((((48) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9c25ef7528d757a5fcea0596() {
  return __cxx_static_address_9c25ef7528d757a5fcea0596.reference || (__cxx_static_address_9c25ef7528d757a5fcea0596.reference = {
    __cReference: true,
    get value() { return DUKE_UNDERWATER____header_global_51a64ed740dda300; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:80
export const DUKE_JETPACK_ON____header_global_46d4e4e6ad6a69c4 = ((((((49) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a1e57dbafcf1ddec5d80eb12() {
  return __cxx_static_address_a1e57dbafcf1ddec5d80eb12.reference || (__cxx_static_address_a1e57dbafcf1ddec5d80eb12.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_ON____header_global_46d4e4e6ad6a69c4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:81
export const DUKE_JETPACK_IDLE____header_global_d4046063288bc341 = ((((((50) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3569aad162eb511e2c5937d6() {
  return __cxx_static_address_3569aad162eb511e2c5937d6.reference || (__cxx_static_address_3569aad162eb511e2c5937d6.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_IDLE____header_global_d4046063288bc341; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:82
export const DUKE_JETPACK_OFF____header_global_2e4ea7af4c219524 = ((((((51) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e96a039882ab35fb4a5639bc() {
  return __cxx_static_address_e96a039882ab35fb4a5639bc.reference || (__cxx_static_address_e96a039882ab35fb4a5639bc.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_OFF____header_global_2e4ea7af4c219524; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:83
export const DUKETALKTOBOSS____header_global_8a2df836370eb6b4 = ((((((56) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1cf127222fbc8868f6d5c2c4() {
  return __cxx_static_address_1cf127222fbc8868f6d5c2c4.reference || (__cxx_static_address_1cf127222fbc8868f6d5c2c4.reference = {
    __cReference: true,
    get value() { return DUKETALKTOBOSS____header_global_8a2df836370eb6b4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:84
export const SQUISHED____header_global_75896886bae1642e = ((((((69) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4345b2c60130c84e642ac9f0() {
  return __cxx_static_address_4345b2c60130c84e642ac9f0.reference || (__cxx_static_address_4345b2c60130c84e642ac9f0.reference = {
    __cReference: true,
    get value() { return SQUISHED____header_global_75896886bae1642e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:85
export const TELEPORTER____header_global_d2383ce16837dd7a = ((((((70) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f4bd8a5702bf8765027e072c() {
  return __cxx_static_address_f4bd8a5702bf8765027e072c.reference || (__cxx_static_address_f4bd8a5702bf8765027e072c.reference = {
    __cReference: true,
    get value() { return TELEPORTER____header_global_d2383ce16837dd7a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:86
export const ELEVATOR_ON____header_global_a24bfa38fbc31216 = ((((((71) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bb3e3a2c93389aba346c1274() {
  return __cxx_static_address_bb3e3a2c93389aba346c1274.reference || (__cxx_static_address_bb3e3a2c93389aba346c1274.reference = {
    __cReference: true,
    get value() { return ELEVATOR_ON____header_global_a24bfa38fbc31216; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:87
export const ELEVATOR_OFF____header_global_4b7b188ef8e161bd = ((((((73) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a9b33401a30ee8250cf78a7b() {
  return __cxx_static_address_a9b33401a30ee8250cf78a7b.reference || (__cxx_static_address_a9b33401a30ee8250cf78a7b.reference = {
    __cReference: true,
    get value() { return ELEVATOR_OFF____header_global_4b7b188ef8e161bd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:88
export const SUBWAY____header_global_dca5095b3cac5ee7 = ((((((75) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a1413b1d3e2feef431e1fcdb() {
  return __cxx_static_address_a1413b1d3e2feef431e1fcdb.reference || (__cxx_static_address_a1413b1d3e2feef431e1fcdb.reference = {
    __cReference: true,
    get value() { return SUBWAY____header_global_dca5095b3cac5ee7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:89
export const SWITCH_ON____header_global_e7f1556fae12f3ac = ((((((76) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_640188645b256b77380d2bad() {
  return __cxx_static_address_640188645b256b77380d2bad.reference || (__cxx_static_address_640188645b256b77380d2bad.reference = {
    __cReference: true,
    get value() { return SWITCH_ON____header_global_e7f1556fae12f3ac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:90
export const FLUSH_TOILET____header_global_61f8f080f9989fa7 = ((((((79) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2a7b376a1516c2b62768bede() {
  return __cxx_static_address_2a7b376a1516c2b62768bede.reference || (__cxx_static_address_2a7b376a1516c2b62768bede.reference = {
    __cReference: true,
    get value() { return FLUSH_TOILET____header_global_61f8f080f9989fa7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:91
export const EARTHQUAKE____header_global_c9815362f1e2c103 = ((((((81) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_502e08753961607cba831a1f() {
  return __cxx_static_address_502e08753961607cba831a1f.reference || (__cxx_static_address_502e08753961607cba831a1f.reference = {
    __cReference: true,
    get value() { return EARTHQUAKE____header_global_c9815362f1e2c103; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:92
export const END_OF_LEVEL_WARN____header_global_2e77b6644a5e186a = ((((((83) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_97a531ec83bcb93db7dd3315() {
  return __cxx_static_address_97a531ec83bcb93db7dd3315.reference || (__cxx_static_address_97a531ec83bcb93db7dd3315.reference = {
    __cReference: true,
    get value() { return END_OF_LEVEL_WARN____header_global_2e77b6644a5e186a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:93
export const WIND_AMBIENCE____header_global_6ad0fb60a92af14a = ((((((91) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_713076c8f6032fd405f04da3() {
  return __cxx_static_address_713076c8f6032fd405f04da3.reference || (__cxx_static_address_713076c8f6032fd405f04da3.reference = {
    __cReference: true,
    get value() { return WIND_AMBIENCE____header_global_6ad0fb60a92af14a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:94
export const SOMETHING_DRIPPING____header_global_e87670c14fd140e6 = ((((((92) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f902d3be7e49ab75d5a16622() {
  return __cxx_static_address_f902d3be7e49ab75d5a16622.reference || (__cxx_static_address_f902d3be7e49ab75d5a16622.reference = {
    __cReference: true,
    get value() { return SOMETHING_DRIPPING____header_global_e87670c14fd140e6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:95
export const BOS1_RECOG____header_global_bb008b2b8f5eaf21 = ((((((97) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fa0dbf6b0b6699de967c9ff5() {
  return __cxx_static_address_fa0dbf6b0b6699de967c9ff5.reference || (__cxx_static_address_fa0dbf6b0b6699de967c9ff5.reference = {
    __cReference: true,
    get value() { return BOS1_RECOG____header_global_bb008b2b8f5eaf21; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:96
export const BOS2_RECOG____header_global_604dd9635d9c56d6 = ((((((102) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b5537ead57fa8e9103d6c546() {
  return __cxx_static_address_b5537ead57fa8e9103d6c546.reference || (__cxx_static_address_b5537ead57fa8e9103d6c546.reference = {
    __cReference: true,
    get value() { return BOS2_RECOG____header_global_604dd9635d9c56d6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:97
export const DUKE_GETWEAPON2____header_global_aac5815c1edaf884 = ((((((107) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d670041e422ff9befd4bf9b2() {
  return __cxx_static_address_d670041e422ff9befd4bf9b2.reference || (__cxx_static_address_d670041e422ff9befd4bf9b2.reference = {
    __cReference: true,
    get value() { return DUKE_GETWEAPON2____header_global_aac5815c1edaf884; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:98
export const SHOTGUN_FIRE____header_global_2ab4d6d7beb64ddc = ((((((109) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_16d90bb29df28ddc13126a61() {
  return __cxx_static_address_16d90bb29df28ddc13126a61.reference || (__cxx_static_address_16d90bb29df28ddc13126a61.reference = {
    __cReference: true,
    get value() { return SHOTGUN_FIRE____header_global_2ab4d6d7beb64ddc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:99
export const PRED_RECOG____header_global_74ccb8f5c393159f = ((((((111) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_260be26681f33c53627cdca5() {
  return __cxx_static_address_260be26681f33c53627cdca5.reference || (__cxx_static_address_260be26681f33c53627cdca5.reference = {
    __cReference: true,
    get value() { return PRED_RECOG____header_global_74ccb8f5c393159f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:100
export const CAPT_RECOG____header_global_9ff19b347e19de35 = ((((((117) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c76ea4da6f8353aeee96dbc1() {
  return __cxx_static_address_c76ea4da6f8353aeee96dbc1.reference || (__cxx_static_address_c76ea4da6f8353aeee96dbc1.reference = {
    __cReference: true,
    get value() { return CAPT_RECOG____header_global_9ff19b347e19de35; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:101
export const PIG_RECOG____header_global_4a8c6a9d9a1bc599 = ((((((121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a6a14186d893cdd589542dae() {
  return __cxx_static_address_a6a14186d893cdd589542dae.reference || (__cxx_static_address_a6a14186d893cdd589542dae.reference = {
    __cReference: true,
    get value() { return PIG_RECOG____header_global_4a8c6a9d9a1bc599; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:102
export const RECO_ROAM____header_global_9445c4c061959d82 = ((((((125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4ff9b110caa7c0faa86e0816() {
  return __cxx_static_address_4ff9b110caa7c0faa86e0816.reference || (__cxx_static_address_4ff9b110caa7c0faa86e0816.reference = {
    __cReference: true,
    get value() { return RECO_ROAM____header_global_9445c4c061959d82; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:103
export const RECO_RECOG____header_global_01e9bb9ac23d17c8 = ((((((126) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_04f0c11fef355def67cdf2dc() {
  return __cxx_static_address_04f0c11fef355def67cdf2dc.reference || (__cxx_static_address_04f0c11fef355def67cdf2dc.reference = {
    __cReference: true,
    get value() { return RECO_RECOG____header_global_01e9bb9ac23d17c8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:104
export const RECO_ATTACK____header_global_2b53d7ae94283a60 = ((((((127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bddf744e9df11eeff6711a07() {
  return __cxx_static_address_bddf744e9df11eeff6711a07.reference || (__cxx_static_address_bddf744e9df11eeff6711a07.reference = {
    __cReference: true,
    get value() { return RECO_ATTACK____header_global_2b53d7ae94283a60; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:105
export const RECO_PAIN____header_global_aa63f96db87bd1fc = ((((((128) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c0a81129de5f9456bad2f946() {
  return __cxx_static_address_c0a81129de5f9456bad2f946.reference || (__cxx_static_address_c0a81129de5f9456bad2f946.reference = {
    __cReference: true,
    get value() { return RECO_PAIN____header_global_aa63f96db87bd1fc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:106
export const DRON_RECOG____header_global_71370e5992dcf13a = ((((((131) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_669cf6e20b5bb938b1ce9f57() {
  return __cxx_static_address_669cf6e20b5bb938b1ce9f57.reference || (__cxx_static_address_669cf6e20b5bb938b1ce9f57.reference = {
    __cReference: true,
    get value() { return DRON_RECOG____header_global_71370e5992dcf13a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:107
export const COMM_RECOG____header_global_c638fb1ab25c7604 = ((((((136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_09497de47dd5165da30fd6bf() {
  return __cxx_static_address_09497de47dd5165da30fd6bf.reference || (__cxx_static_address_09497de47dd5165da30fd6bf.reference = {
    __cReference: true,
    get value() { return COMM_RECOG____header_global_c638fb1ab25c7604; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:108
export const OCTA_RECOG____header_global_2ea47588f3196082 = ((((((141) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c7fbd8fe633305f2069bfced() {
  return __cxx_static_address_c7fbd8fe633305f2069bfced.reference || (__cxx_static_address_c7fbd8fe633305f2069bfced.reference = {
    __cReference: true,
    get value() { return OCTA_RECOG____header_global_2ea47588f3196082; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:109
export const TURR_RECOG____header_global_2e29f71d090029eb = ((((((146) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aca67f253cb81abc1c8d13c3() {
  return __cxx_static_address_aca67f253cb81abc1c8d13c3.reference || (__cxx_static_address_aca67f253cb81abc1c8d13c3.reference = {
    __cReference: true,
    get value() { return TURR_RECOG____header_global_2e29f71d090029eb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:110
export const SLIM_DYING____header_global_ea9e47bfdaca99ba = ((((((149) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c01223e8573fca31949ddce4() {
  return __cxx_static_address_c01223e8573fca31949ddce4.reference || (__cxx_static_address_c01223e8573fca31949ddce4.reference = {
    __cReference: true,
    get value() { return SLIM_DYING____header_global_ea9e47bfdaca99ba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:111
export const BOS3_RECOG____header_global_3d04550b7f255b3c = ((((((151) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e285450d42e63002e62abef3() {
  return __cxx_static_address_e285450d42e63002e62abef3.reference || (__cxx_static_address_e285450d42e63002e62abef3.reference = {
    __cReference: true,
    get value() { return BOS3_RECOG____header_global_3d04550b7f255b3c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:112
export const BOS1_WALK____header_global_a04978c77dc80b1d = ((((((156) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3bb27925fc6d6574440a783d() {
  return __cxx_static_address_3bb27925fc6d6574440a783d.reference || (__cxx_static_address_3bb27925fc6d6574440a783d.reference = {
    __cReference: true,
    get value() { return BOS1_WALK____header_global_a04978c77dc80b1d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:113
export const THUD____header_global_2baa175992216702 = ((((((158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f0eefe6c09975186887cfe2e() {
  return __cxx_static_address_f0eefe6c09975186887cfe2e.reference || (__cxx_static_address_f0eefe6c09975186887cfe2e.reference = {
    __cReference: true,
    get value() { return THUD____header_global_2baa175992216702; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:114
export const WIERDSHOT_FLY____header_global_284b01e73ed06467 = ((((((160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_33193d53c8c4a5b8f63e0c8d() {
  return __cxx_static_address_33193d53c8c4a5b8f63e0c8d.reference || (__cxx_static_address_33193d53c8c4a5b8f63e0c8d.reference = {
    __cReference: true,
    get value() { return WIERDSHOT_FLY____header_global_284b01e73ed06467; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:115
export const SLIM_ROAM____header_global_af1e468759caada0 = ((((((163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_790b740f018665134c9a5a70() {
  return __cxx_static_address_790b740f018665134c9a5a70.reference || (__cxx_static_address_790b740f018665134c9a5a70.reference = {
    __cReference: true,
    get value() { return SLIM_ROAM____header_global_af1e468759caada0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:116
export const SHOTGUN_COCK____header_global_af8dbc34bd11bcd7 = ((((((169) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e9936fcb0d8887f0c4c93ebf() {
  return __cxx_static_address_e9936fcb0d8887f0c4c93ebf.reference || (__cxx_static_address_e9936fcb0d8887f0c4c93ebf.reference = {
    __cReference: true,
    get value() { return SHOTGUN_COCK____header_global_af8dbc34bd11bcd7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:117
export const GENERIC_AMBIENCE17____header_global_e4dd240bdd0d6c18 = ((((((177) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fa83f59ac544699d45f2c5cc() {
  return __cxx_static_address_fa83f59ac544699d45f2c5cc.reference || (__cxx_static_address_fa83f59ac544699d45f2c5cc.reference = {
    __cReference: true,
    get value() { return GENERIC_AMBIENCE17____header_global_e4dd240bdd0d6c18; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:118
export const BONUS_SPEECH1____header_global_97bdcde3fd1bcd73 = ((((((195) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_77e757fda6f9a52835397ccb() {
  return __cxx_static_address_77e757fda6f9a52835397ccb.reference || (__cxx_static_address_77e757fda6f9a52835397ccb.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH1____header_global_97bdcde3fd1bcd73; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:119
export const BONUS_SPEECH2____header_global_405476a8af0a3d72 = ((((((196) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_df05a24a7d14eda25700d0c6() {
  return __cxx_static_address_df05a24a7d14eda25700d0c6.reference || (__cxx_static_address_df05a24a7d14eda25700d0c6.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH2____header_global_405476a8af0a3d72; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:120
export const BONUS_SPEECH3____header_global_2a722b1d5c4db4e3 = ((((((197) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_116c5e6e6b092795286170d5() {
  return __cxx_static_address_116c5e6e6b092795286170d5.reference || (__cxx_static_address_116c5e6e6b092795286170d5.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH3____header_global_2a722b1d5c4db4e3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:121
export const BONUS_SPEECH4____header_global_4b07387cd9a704a6 = ((((((199) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9a3a87d4e53fce8f56ff6d2d() {
  return __cxx_static_address_9a3a87d4e53fce8f56ff6d2d.reference || (__cxx_static_address_9a3a87d4e53fce8f56ff6d2d.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH4____header_global_4b07387cd9a704a6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:122
export const DUKE_LAND_HURT____header_global_67fb7bf8a9011789 = ((((((200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4354ea1391fc5f6b926b9ca7() {
  return __cxx_static_address_4354ea1391fc5f6b926b9ca7.reference || (__cxx_static_address_4354ea1391fc5f6b926b9ca7.reference = {
    __cReference: true,
    get value() { return DUKE_LAND_HURT____header_global_67fb7bf8a9011789; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:123
export const DUKE_SEARCH2____header_global_7328966bf6dea2c7 = ((((((207) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_84575f363c6ac5166f3ab70d() {
  return __cxx_static_address_84575f363c6ac5166f3ab70d.reference || (__cxx_static_address_84575f363c6ac5166f3ab70d.reference = {
    __cReference: true,
    get value() { return DUKE_SEARCH2____header_global_7328966bf6dea2c7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:124
export const DUKE_CRACK2____header_global_5f5a7781a21ea6bc = ((((((208) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_40ceff3a4d5e156331a9c35e() {
  return __cxx_static_address_40ceff3a4d5e156331a9c35e.reference || (__cxx_static_address_40ceff3a4d5e156331a9c35e.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK2____header_global_5f5a7781a21ea6bc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:125
export const DUKE_SEARCH____header_global_240c4d9a1334ed52 = ((((((209) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eaa3bc39506d22e8f50603b5() {
  return __cxx_static_address_eaa3bc39506d22e8f50603b5.reference || (__cxx_static_address_eaa3bc39506d22e8f50603b5.reference = {
    __cReference: true,
    get value() { return DUKE_SEARCH____header_global_240c4d9a1334ed52; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:126
export const DUKE_GET____header_global_6c8930b92b563dee = ((((((210) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_38d4b4e89252346e0989e852() {
  return __cxx_static_address_38d4b4e89252346e0989e852.reference || (__cxx_static_address_38d4b4e89252346e0989e852.reference = {
    __cReference: true,
    get value() { return DUKE_GET____header_global_6c8930b92b563dee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:127
export const DUKE_LONGTERM_PAIN____header_global_2c02d73ca1052a23 = ((((((211) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e122541f91e8d1027beffb13() {
  return __cxx_static_address_e122541f91e8d1027beffb13.reference || (__cxx_static_address_e122541f91e8d1027beffb13.reference = {
    __cReference: true,
    get value() { return DUKE_LONGTERM_PAIN____header_global_2c02d73ca1052a23; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:128
export const MONITOR_ACTIVE____header_global_49a02c97091c0933 = ((((((212) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1464d932d52b1fdab7a52482() {
  return __cxx_static_address_1464d932d52b1fdab7a52482.reference || (__cxx_static_address_1464d932d52b1fdab7a52482.reference = {
    __cReference: true,
    get value() { return MONITOR_ACTIVE____header_global_49a02c97091c0933; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:129
export const NITEVISION_ONOFF____header_global_415d10a0a68f1b37 = ((((((213) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d49d7b277ff42ca7f0c59444() {
  return __cxx_static_address_d49d7b277ff42ca7f0c59444.reference || (__cxx_static_address_d49d7b277ff42ca7f0c59444.reference = {
    __cReference: true,
    get value() { return NITEVISION_ONOFF____header_global_415d10a0a68f1b37; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:130
export const DUKE_CRACK_FIRST____header_global_3fe964fb371a7e6f = ((((((215) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_38c5a6c76d8ee45353c9732e() {
  return __cxx_static_address_38c5a6c76d8ee45353c9732e.reference || (__cxx_static_address_38c5a6c76d8ee45353c9732e.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK_FIRST____header_global_3fe964fb371a7e6f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:131
export const DUKE_USEMEDKIT____header_global_e2be2c1be5673902 = ((((((216) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c18cf463a280f4e374a8ff68() {
  return __cxx_static_address_c18cf463a280f4e374a8ff68.reference || (__cxx_static_address_c18cf463a280f4e374a8ff68.reference = {
    __cReference: true,
    get value() { return DUKE_USEMEDKIT____header_global_e2be2c1be5673902; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:132
export const DUKE_TAKEPILLS____header_global_7d19003ad5150291 = ((((((217) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e54825e8d79bab227ea205a() {
  return __cxx_static_address_1e54825e8d79bab227ea205a.reference || (__cxx_static_address_1e54825e8d79bab227ea205a.reference = {
    __cReference: true,
    get value() { return DUKE_TAKEPILLS____header_global_7d19003ad5150291; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:133
export const DUKE_PISSRELIEF____header_global_7959b7eef902e852 = ((((((218) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c223d63ee80c6c273496a155() {
  return __cxx_static_address_c223d63ee80c6c273496a155.reference || (__cxx_static_address_c223d63ee80c6c273496a155.reference = {
    __cReference: true,
    get value() { return DUKE_PISSRELIEF____header_global_7959b7eef902e852; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:134
export const SELECT_WEAPON____header_global_8ab8e46cae4731a8 = ((((((219) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_06848af82234360bdc97780a() {
  return __cxx_static_address_06848af82234360bdc97780a.reference || (__cxx_static_address_06848af82234360bdc97780a.reference = {
    __cReference: true,
    get value() { return SELECT_WEAPON____header_global_8ab8e46cae4731a8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:135
export const JIBBED_ACTOR5____header_global_fa3b7ef1d59ab069 = ((((((226) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6cc1fe7a878bffa328d76321() {
  return __cxx_static_address_6cc1fe7a878bffa328d76321.reference || (__cxx_static_address_6cc1fe7a878bffa328d76321.reference = {
    __cReference: true,
    get value() { return JIBBED_ACTOR5____header_global_fa3b7ef1d59ab069; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:136
export const JIBBED_ACTOR6____header_global_0ef8af71dbc81baa = ((((((227) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_91019f765e989dd585e48b02() {
  return __cxx_static_address_91019f765e989dd585e48b02.reference || (__cxx_static_address_91019f765e989dd585e48b02.reference = {
    __cReference: true,
    get value() { return JIBBED_ACTOR6____header_global_0ef8af71dbc81baa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:137
export const DUKE_GOTHEALTHATLOW____header_global_f23952252b8f87bd = ((((((229) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7bb900eb15bf96d6b4dfec02() {
  return __cxx_static_address_7bb900eb15bf96d6b4dfec02.reference || (__cxx_static_address_7bb900eb15bf96d6b4dfec02.reference = {
    __cReference: true,
    get value() { return DUKE_GOTHEALTHATLOW____header_global_f23952252b8f87bd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:138
export const BOSSTALKTODUKE____header_global_1fe95171ac67ff35 = ((((((230) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_25f47859e907d5f137b9ead4() {
  return __cxx_static_address_25f47859e907d5f137b9ead4.reference || (__cxx_static_address_25f47859e907d5f137b9ead4.reference = {
    __cReference: true,
    get value() { return BOSSTALKTODUKE____header_global_1fe95171ac67ff35; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:139
export const WAR_AMBIENCE2____header_global_1fbf1ab0988e184c = ((((((232) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7280ae128e27348d07ccb825() {
  return __cxx_static_address_7280ae128e27348d07ccb825.reference || (__cxx_static_address_7280ae128e27348d07ccb825.reference = {
    __cReference: true,
    get value() { return WAR_AMBIENCE2____header_global_1fbf1ab0988e184c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:140
export const EXITMENUSOUND____header_global_4e9ab1d1751a895d = ((((((243) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f077897b5434fbe1c1e9166c() {
  return __cxx_static_address_f077897b5434fbe1c1e9166c.reference || (__cxx_static_address_f077897b5434fbe1c1e9166c.reference = {
    __cReference: true,
    get value() { return EXITMENUSOUND____header_global_4e9ab1d1751a895d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:141
export const FLY_BY____header_global_3435b7101c43e680 = ((((((244) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c578dcbf5bd8bc2bbc9e9cde() {
  return __cxx_static_address_c578dcbf5bd8bc2bbc9e9cde.reference || (__cxx_static_address_c578dcbf5bd8bc2bbc9e9cde.reference = {
    __cReference: true,
    get value() { return FLY_BY____header_global_3435b7101c43e680; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:142
export const DUKE_SCREAM____header_global_0f54bbf31d255162 = ((((((245) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ba993fb4e68bac08cf36a351() {
  return __cxx_static_address_ba993fb4e68bac08cf36a351.reference || (__cxx_static_address_ba993fb4e68bac08cf36a351.reference = {
    __cReference: true,
    get value() { return DUKE_SCREAM____header_global_0f54bbf31d255162; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:143
export const SHRINKER_HIT____header_global_b30b4fbd67772d65 = ((((((246) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_313fe9018b6686d5855aa499() {
  return __cxx_static_address_313fe9018b6686d5855aa499.reference || (__cxx_static_address_313fe9018b6686d5855aa499.reference = {
    __cReference: true,
    get value() { return SHRINKER_HIT____header_global_b30b4fbd67772d65; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:144
export const RATTY____header_global_8c77a7dd49d84755 = ((((((247) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b01753d0b025d1e795e8eacf() {
  return __cxx_static_address_b01753d0b025d1e795e8eacf.reference || (__cxx_static_address_b01753d0b025d1e795e8eacf.reference = {
    __cReference: true,
    get value() { return RATTY____header_global_8c77a7dd49d84755; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:145
export const BONUSMUSIC____header_global_ba22c4b772b98d17 = ((((((249) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1bbe72559f6d094c81310e7e() {
  return __cxx_static_address_1bbe72559f6d094c81310e7e.reference || (__cxx_static_address_1bbe72559f6d094c81310e7e.reference = {
    __cReference: true,
    get value() { return BONUSMUSIC____header_global_ba22c4b772b98d17; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:146
export const DUKE_GETWEAPON6____header_global_94adc9b7c1e50e80 = ((((((264) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b38dbcf0addb8994cd4557e4() {
  return __cxx_static_address_b38dbcf0addb8994cd4557e4.reference || (__cxx_static_address_b38dbcf0addb8994cd4557e4.reference = {
    __cReference: true,
    get value() { return DUKE_GETWEAPON6____header_global_94adc9b7c1e50e80; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:147
export const ALIEN_SWITCH1____header_global_5c36e5e8670d0740 = ((((((272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a13725764e02459d59b99208() {
  return __cxx_static_address_a13725764e02459d59b99208.reference || (__cxx_static_address_a13725764e02459d59b99208.reference = {
    __cReference: true,
    get value() { return ALIEN_SWITCH1____header_global_5c36e5e8670d0740; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:148
export const RIPHEADNECK____header_global_254fd6e1a5d996ce = ((((((284) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dc1b4d8d3edb20e26162c261() {
  return __cxx_static_address_dc1b4d8d3edb20e26162c261.reference || (__cxx_static_address_dc1b4d8d3edb20e26162c261.reference = {
    __cReference: true,
    get value() { return RIPHEADNECK____header_global_254fd6e1a5d996ce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:149
export const ENDSEQVOL3SND4____header_global_1976627155e8c6c7 = ((((((288) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_19441ad18ebbfb5bb1b07c28() {
  return __cxx_static_address_19441ad18ebbfb5bb1b07c28.reference || (__cxx_static_address_19441ad18ebbfb5bb1b07c28.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND4____header_global_1976627155e8c6c7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:150
export const ENDSEQVOL3SND5____header_global_45f5f4be1823c33e = ((((((289) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0ab37ed8b95bf2273de2feaa() {
  return __cxx_static_address_0ab37ed8b95bf2273de2feaa.reference || (__cxx_static_address_0ab37ed8b95bf2273de2feaa.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND5____header_global_45f5f4be1823c33e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:151
export const ENDSEQVOL3SND6____header_global_5afdcc646c93d612 = ((((((290) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9eaf13acda064f07d416e4a0() {
  return __cxx_static_address_9eaf13acda064f07d416e4a0.reference || (__cxx_static_address_9eaf13acda064f07d416e4a0.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND6____header_global_5afdcc646c93d612; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:152
export const ENDSEQVOL3SND7____header_global_f20cfc485a0ec5a4 = ((((((291) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9b4930882cae44f1a1087999() {
  return __cxx_static_address_9b4930882cae44f1a1087999.reference || (__cxx_static_address_9b4930882cae44f1a1087999.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND7____header_global_f20cfc485a0ec5a4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:153
export const ENDSEQVOL3SND8____header_global_91282edafde5da7d = ((((((292) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f2760bfe4514de045b04df65() {
  return __cxx_static_address_f2760bfe4514de045b04df65.reference || (__cxx_static_address_f2760bfe4514de045b04df65.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND8____header_global_91282edafde5da7d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:154
export const ENDSEQVOL3SND9____header_global_21737cff777f33a2 = ((((((293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e167311c79f31b09bd182d9d() {
  return __cxx_static_address_e167311c79f31b09bd182d9d.reference || (__cxx_static_address_e167311c79f31b09bd182d9d.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND9____header_global_21737cff777f33a2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:155
export const WHIPYOURASS____header_global_4d88c33568f44ea7 = ((((((294) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e33e454e27de661072052054() {
  return __cxx_static_address_e33e454e27de661072052054.reference || (__cxx_static_address_e33e454e27de661072052054.reference = {
    __cReference: true,
    get value() { return WHIPYOURASS____header_global_4d88c33568f44ea7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:156
export const ENDSEQVOL2SND1____header_global_db772d4ca987f1a0 = ((((((295) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_28dcb06fe328108fad17b4e3() {
  return __cxx_static_address_28dcb06fe328108fad17b4e3.reference || (__cxx_static_address_28dcb06fe328108fad17b4e3.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND1____header_global_db772d4ca987f1a0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:157
export const ENDSEQVOL2SND2____header_global_512c5f78ad3cb794 = ((((((296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a5b6dac31bd5e419727c018a() {
  return __cxx_static_address_a5b6dac31bd5e419727c018a.reference || (__cxx_static_address_a5b6dac31bd5e419727c018a.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND2____header_global_512c5f78ad3cb794; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:158
export const ENDSEQVOL2SND3____header_global_5a26c35e5d01f9a9 = ((((((297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_49af7bfc585f526f23393301() {
  return __cxx_static_address_49af7bfc585f526f23393301.reference || (__cxx_static_address_49af7bfc585f526f23393301.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND3____header_global_5a26c35e5d01f9a9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:159
export const ENDSEQVOL2SND4____header_global_802bf6e278921d24 = ((((((298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_54f62f9542d3a25ec19c8d28() {
  return __cxx_static_address_54f62f9542d3a25ec19c8d28.reference || (__cxx_static_address_54f62f9542d3a25ec19c8d28.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND4____header_global_802bf6e278921d24; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:160
export const ENDSEQVOL2SND5____header_global_06f785fc5b2b719c = ((((((299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_20142fe7b38ae42e8d22d5d9() {
  return __cxx_static_address_20142fe7b38ae42e8d22d5d9.reference || (__cxx_static_address_20142fe7b38ae42e8d22d5d9.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND5____header_global_06f785fc5b2b719c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:161
export const ENDSEQVOL2SND6____header_global_c2377dafe5963810 = ((((((300) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c10a042354ada575e50b8c97() {
  return __cxx_static_address_c10a042354ada575e50b8c97.reference || (__cxx_static_address_c10a042354ada575e50b8c97.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND6____header_global_c2377dafe5963810; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:162
export const ENDSEQVOL2SND7____header_global_18f41555e9630b75 = ((((((301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fb796b583f09dd70d6527c81() {
  return __cxx_static_address_fb796b583f09dd70d6527c81.reference || (__cxx_static_address_fb796b583f09dd70d6527c81.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND7____header_global_18f41555e9630b75; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:163
export const SOMETHINGFROZE____header_global_3d36b4123332880b = ((((((303) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_57e1519435bfaa9bce1184e6() {
  return __cxx_static_address_57e1519435bfaa9bce1184e6.reference || (__cxx_static_address_57e1519435bfaa9bce1184e6.reference = {
    __cReference: true,
    get value() { return SOMETHINGFROZE____header_global_3d36b4123332880b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:164
export const WIND_REPEAT____header_global_00c048190d5377e1 = ((((((308) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_32b1dc6415bc631cb2343338() {
  return __cxx_static_address_32b1dc6415bc631cb2343338.reference || (__cxx_static_address_32b1dc6415bc631cb2343338.reference = {
    __cReference: true,
    get value() { return WIND_REPEAT____header_global_00c048190d5377e1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:165
export const BOS4_RECOG____header_global_4a57acb35d5637bd = ((((((342) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bfda214cc4320975582fd391() {
  return __cxx_static_address_bfda214cc4320975582fd391.reference || (__cxx_static_address_bfda214cc4320975582fd391.reference = {
    __cReference: true,
    get value() { return BOS4_RECOG____header_global_4a57acb35d5637bd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:166
export const LIGHTNING_SLAP____header_global_e53bb458c2b692c6 = ((((((351) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f469a64597827eb2cac2ed51() {
  return __cxx_static_address_f469a64597827eb2cac2ed51.reference || (__cxx_static_address_f469a64597827eb2cac2ed51.reference = {
    __cReference: true,
    get value() { return LIGHTNING_SLAP____header_global_e53bb458c2b692c6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:167
export const THUNDER____header_global_07a5194ee4388ec2 = ((((((352) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f79a74c1eea745d19ba8ca5c() {
  return __cxx_static_address_f79a74c1eea745d19ba8ca5c.reference || (__cxx_static_address_f79a74c1eea745d19ba8ca5c.reference = {
    __cReference: true,
    get value() { return THUNDER____header_global_07a5194ee4388ec2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:168
export const INTRO4_1____header_global_ee27b7de78df47e9 = ((((((363) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d386c5f38de88906cc6318ec() {
  return __cxx_static_address_d386c5f38de88906cc6318ec.reference || (__cxx_static_address_d386c5f38de88906cc6318ec.reference = {
    __cReference: true,
    get value() { return INTRO4_1____header_global_ee27b7de78df47e9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:169
export const INTRO4_2____header_global_a66e5b13c573d107 = ((((((364) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_14d50fe3d25b518aafa6c9ca() {
  return __cxx_static_address_14d50fe3d25b518aafa6c9ca.reference || (__cxx_static_address_14d50fe3d25b518aafa6c9ca.reference = {
    __cReference: true,
    get value() { return INTRO4_2____header_global_a66e5b13c573d107; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:170
export const INTRO4_3____header_global_94800c9f0a082755 = ((((((365) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5094651da15723a2a515005c() {
  return __cxx_static_address_5094651da15723a2a515005c.reference || (__cxx_static_address_5094651da15723a2a515005c.reference = {
    __cReference: true,
    get value() { return INTRO4_3____header_global_94800c9f0a082755; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:171
export const INTRO4_4____header_global_740c0fb18a145ebc = ((((((366) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2ef4bd27cdd8066abb8da2e7() {
  return __cxx_static_address_2ef4bd27cdd8066abb8da2e7.reference || (__cxx_static_address_2ef4bd27cdd8066abb8da2e7.reference = {
    __cReference: true,
    get value() { return INTRO4_4____header_global_740c0fb18a145ebc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:172
export const INTRO4_5____header_global_50666e388dda7846 = ((((((367) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3f7aed4be87e9aaa3160a78b() {
  return __cxx_static_address_3f7aed4be87e9aaa3160a78b.reference || (__cxx_static_address_3f7aed4be87e9aaa3160a78b.reference = {
    __cReference: true,
    get value() { return INTRO4_5____header_global_50666e388dda7846; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:173
export const INTRO4_6____header_global_ed49778db1ac6c9d = ((((((368) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_47dc9e43ce03767b3f95ed9a() {
  return __cxx_static_address_47dc9e43ce03767b3f95ed9a.reference || (__cxx_static_address_47dc9e43ce03767b3f95ed9a.reference = {
    __cReference: true,
    get value() { return INTRO4_6____header_global_ed49778db1ac6c9d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:174
export const BOSS4_DEADSPEECH____header_global_eef0b2c562c47dad = ((((((370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_580e1b4e83d112bcc79405f6() {
  return __cxx_static_address_580e1b4e83d112bcc79405f6.reference || (__cxx_static_address_580e1b4e83d112bcc79405f6.reference = {
    __cReference: true,
    get value() { return BOSS4_DEADSPEECH____header_global_eef0b2c562c47dad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:175
export const BOSS4_FIRSTSEE____header_global_c6886cec998c1947 = ((((((371) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a4e942aac66dce16c82d386f() {
  return __cxx_static_address_a4e942aac66dce16c82d386f.reference || (__cxx_static_address_a4e942aac66dce16c82d386f.reference = {
    __cReference: true,
    get value() { return BOSS4_FIRSTSEE____header_global_c6886cec998c1947; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:176
export const VOL4ENDSND1____header_global_30a4e041123f1dc0 = ((((((384) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5b3786518be9b9323b647155() {
  return __cxx_static_address_5b3786518be9b9323b647155.reference || (__cxx_static_address_5b3786518be9b9323b647155.reference = {
    __cReference: true,
    get value() { return VOL4ENDSND1____header_global_30a4e041123f1dc0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:177
export const VOL4ENDSND2____header_global_e64ef7ac411678d0 = ((((((385) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eecd687b7a17be521f27900e() {
  return __cxx_static_address_eecd687b7a17be521f27900e.reference || (__cxx_static_address_eecd687b7a17be521f27900e.reference = {
    __cReference: true,
    get value() { return VOL4ENDSND2____header_global_e64ef7ac411678d0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:178
export const EXPANDERSHOOT____header_global_2f813a900cae92ef = ((((((388) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_499f643e6c3348de0f664afc() {
  return __cxx_static_address_499f643e6c3348de0f664afc.reference || (__cxx_static_address_499f643e6c3348de0f664afc.reference = {
    __cReference: true,
    get value() { return EXPANDERSHOOT____header_global_2f813a900cae92ef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:179
export const INTRO4_B____header_global_28176cc8eef97e2e = ((((((392) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a0503edc4daaecd7d0969bd5() {
  return __cxx_static_address_a0503edc4daaecd7d0969bd5.reference || (__cxx_static_address_a0503edc4daaecd7d0969bd5.reference = {
    __cReference: true,
    get value() { return INTRO4_B____header_global_28176cc8eef97e2e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:180
export const BIGBANG____header_global_bc1c9335def9f13b = ((((((393) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_771a1d5206fdf0537a1febed() {
  return __cxx_static_address_771a1d5206fdf0537a1febed.reference || (__cxx_static_address_771a1d5206fdf0537a1febed.reference = {
    __cReference: true,
    get value() { return BIGBANG____header_global_bc1c9335def9f13b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:181
export const FLAMETHROWER_INTRO____header_global_801de439e3611465 = ((((((398) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b66e4c41ad24a2e7e504b548() {
  return __cxx_static_address_b66e4c41ad24a2e7e504b548.reference || (__cxx_static_address_b66e4c41ad24a2e7e504b548.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_INTRO____header_global_801de439e3611465; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:182
export const FLAMETHROWER_LOOP____header_global_a27a6a3d68a9a1d6 = ((((((399) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_72a809475134665338d6e2b9() {
  return __cxx_static_address_72a809475134665338d6e2b9.reference || (__cxx_static_address_72a809475134665338d6e2b9.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_LOOP____header_global_a27a6a3d68a9a1d6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:183
export const FLAMETHROWER_END____header_global_afc10509e13e528c = ((((((400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3941cb54f9b97de74a7d6403() {
  return __cxx_static_address_3941cb54f9b97de74a7d6403.reference || (__cxx_static_address_3941cb54f9b97de74a7d6403.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_END____header_global_afc10509e13e528c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:184
export const E5L7_DUKE_QUIT_YOU____header_global_f1531c35c09b5db3 = ((((((401) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a6e442a9bccdea30d32f5593() {
  return __cxx_static_address_a6e442a9bccdea30d32f5593.reference || (__cxx_static_address_a6e442a9bccdea30d32f5593.reference = {
    __cReference: true,
    get value() { return E5L7_DUKE_QUIT_YOU____header_global_f1531c35c09b5db3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:187
export const SECTOREFFECTOR____header_global_0c85da597d3bd0fa = ((((((1) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9a8d8ad9d451b17a56335bf2() {
  return __cxx_static_address_9a8d8ad9d451b17a56335bf2.reference || (__cxx_static_address_9a8d8ad9d451b17a56335bf2.reference = {
    __cReference: true,
    get value() { return SECTOREFFECTOR____header_global_0c85da597d3bd0fa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:188
export const ACTIVATOR____header_global_1cfa5ef6d9b59a19 = ((((((2) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1313095d55c09d9b7a085b63() {
  return __cxx_static_address_1313095d55c09d9b7a085b63.reference || (__cxx_static_address_1313095d55c09d9b7a085b63.reference = {
    __cReference: true,
    get value() { return ACTIVATOR____header_global_1cfa5ef6d9b59a19; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:189
export const TOUCHPLATE____header_global_a09ad3f12b1307cf = ((((((3) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5de4043137ffc8dc9f95b88b() {
  return __cxx_static_address_5de4043137ffc8dc9f95b88b.reference || (__cxx_static_address_5de4043137ffc8dc9f95b88b.reference = {
    __cReference: true,
    get value() { return TOUCHPLATE____header_global_a09ad3f12b1307cf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:190
export const ACTIVATORLOCKED____header_global_52e53163afa4d76d = ((((((4) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_29d7fea5998ddc7860dd271f() {
  return __cxx_static_address_29d7fea5998ddc7860dd271f.reference || (__cxx_static_address_29d7fea5998ddc7860dd271f.reference = {
    __cReference: true,
    get value() { return ACTIVATORLOCKED____header_global_52e53163afa4d76d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:191
export const MUSICANDSFX____header_global_d94d416d87ac6edc = ((((((5) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eee26eb6c4f4f608ca3eaf16() {
  return __cxx_static_address_eee26eb6c4f4f608ca3eaf16.reference || (__cxx_static_address_eee26eb6c4f4f608ca3eaf16.reference = {
    __cReference: true,
    get value() { return MUSICANDSFX____header_global_d94d416d87ac6edc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:192
export const LOCATORS____header_global_423a9ceb0959d5fc = ((((((6) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_659d86108579d2e9f4cb2631() {
  return __cxx_static_address_659d86108579d2e9f4cb2631.reference || (__cxx_static_address_659d86108579d2e9f4cb2631.reference = {
    __cReference: true,
    get value() { return LOCATORS____header_global_423a9ceb0959d5fc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:193
export const CYCLER____header_global_7cdf3210258ab77b = ((((((7) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0375f8aa053e761c2a417509() {
  return __cxx_static_address_0375f8aa053e761c2a417509.reference || (__cxx_static_address_0375f8aa053e761c2a417509.reference = {
    __cReference: true,
    get value() { return CYCLER____header_global_7cdf3210258ab77b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:194
export const MASTERSWITCH____header_global_f761901f786382e7 = ((((((8) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ab21c4597bc66e9334a8a7ee() {
  return __cxx_static_address_ab21c4597bc66e9334a8a7ee.reference || (__cxx_static_address_ab21c4597bc66e9334a8a7ee.reference = {
    __cReference: true,
    get value() { return MASTERSWITCH____header_global_f761901f786382e7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:195
export const RESPAWN____header_global_e9e8f235b4da513b = ((((((9) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d741acb19c39ff3004b6e327() {
  return __cxx_static_address_d741acb19c39ff3004b6e327.reference || (__cxx_static_address_d741acb19c39ff3004b6e327.reference = {
    __cReference: true,
    get value() { return RESPAWN____header_global_e9e8f235b4da513b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:196
export const GPSPEED____header_global_da008286a1e0d6ec = ((((((10) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bfa42e0614c1e382aa688f6f() {
  return __cxx_static_address_bfa42e0614c1e382aa688f6f.reference || (__cxx_static_address_bfa42e0614c1e382aa688f6f.reference = {
    __cReference: true,
    get value() { return GPSPEED____header_global_da008286a1e0d6ec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:197
export const FOF____header_global_b17e067a9c98e7b9 = ((((((13) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_61504f65a4b02d5b4790e048() {
  return __cxx_static_address_61504f65a4b02d5b4790e048.reference || (__cxx_static_address_61504f65a4b02d5b4790e048.reference = {
    __cReference: true,
    get value() { return FOF____header_global_b17e067a9c98e7b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:198
export const ARROW____header_global_4d8bba364a854204 = ((((((20) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3149f0ae6d3c23c27f357c5a() {
  return __cxx_static_address_3149f0ae6d3c23c27f357c5a.reference || (__cxx_static_address_3149f0ae6d3c23c27f357c5a.reference = {
    __cReference: true,
    get value() { return ARROW____header_global_4d8bba364a854204; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:199
export const FIRSTGUNSPRITE____header_global_08fb3d7c56c3273c = ((((((21) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_01a018508403341d7caeefbd() {
  return __cxx_static_address_01a018508403341d7caeefbd.reference || (__cxx_static_address_01a018508403341d7caeefbd.reference = {
    __cReference: true,
    get value() { return FIRSTGUNSPRITE____header_global_08fb3d7c56c3273c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:200
export const CHAINGUNSPRITE____header_global_230d25d36a97e952 = ((((((22) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_36969a3f63377d9032c3c74a() {
  return __cxx_static_address_36969a3f63377d9032c3c74a.reference || (__cxx_static_address_36969a3f63377d9032c3c74a.reference = {
    __cReference: true,
    get value() { return CHAINGUNSPRITE____header_global_230d25d36a97e952; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:201
export const RPGSPRITE____header_global_25ebe54a2ad9566b = ((((((23) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bd1cd026fec69a8ff2f2ecdd() {
  return __cxx_static_address_bd1cd026fec69a8ff2f2ecdd.reference || (__cxx_static_address_bd1cd026fec69a8ff2f2ecdd.reference = {
    __cReference: true,
    get value() { return RPGSPRITE____header_global_25ebe54a2ad9566b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:202
export const FREEZESPRITE____header_global_6f19a4ec549f5c7b = ((((((24) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c93ac722b9588b5f9ae325fd() {
  return __cxx_static_address_c93ac722b9588b5f9ae325fd.reference || (__cxx_static_address_c93ac722b9588b5f9ae325fd.reference = {
    __cReference: true,
    get value() { return FREEZESPRITE____header_global_6f19a4ec549f5c7b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:203
export const SHRINKERSPRITE____header_global_92157020cc849ac1 = ((((((25) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_925829f11318a4acae400b7c() {
  return __cxx_static_address_925829f11318a4acae400b7c.reference || (__cxx_static_address_925829f11318a4acae400b7c.reference = {
    __cReference: true,
    get value() { return SHRINKERSPRITE____header_global_92157020cc849ac1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:204
export const HEAVYHBOMB____header_global_2ea7bc1ef953de2b = ((((((26) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9eda1afaaef8411fe46ce7a2() {
  return __cxx_static_address_9eda1afaaef8411fe46ce7a2.reference || (__cxx_static_address_9eda1afaaef8411fe46ce7a2.reference = {
    __cReference: true,
    get value() { return HEAVYHBOMB____header_global_2ea7bc1ef953de2b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:205
export const TRIPBOMBSPRITE____header_global_f51a4efe636eb046 = ((((((27) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2410b3a5bbc38dfd41b9b9f0() {
  return __cxx_static_address_2410b3a5bbc38dfd41b9b9f0.reference || (__cxx_static_address_2410b3a5bbc38dfd41b9b9f0.reference = {
    __cReference: true,
    get value() { return TRIPBOMBSPRITE____header_global_f51a4efe636eb046; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:206
export const SHOTGUNSPRITE____header_global_c403a2281a5a6c54 = ((((((28) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9caaa1d515f22bdc14558543() {
  return __cxx_static_address_9caaa1d515f22bdc14558543.reference || (__cxx_static_address_9caaa1d515f22bdc14558543.reference = {
    __cReference: true,
    get value() { return SHOTGUNSPRITE____header_global_c403a2281a5a6c54; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:207
export const DEVISTATORSPRITE____header_global_7af9efd0d814477b = ((((((29) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7f798546e897cc1f3a6aea37() {
  return __cxx_static_address_7f798546e897cc1f3a6aea37.reference || (__cxx_static_address_7f798546e897cc1f3a6aea37.reference = {
    __cReference: true,
    get value() { return DEVISTATORSPRITE____header_global_7af9efd0d814477b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:208
export const HEALTHBOX____header_global_ded0d6551472a532 = ((((((30) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e11a842859af1b22b687db9a() {
  return __cxx_static_address_e11a842859af1b22b687db9a.reference || (__cxx_static_address_e11a842859af1b22b687db9a.reference = {
    __cReference: true,
    get value() { return HEALTHBOX____header_global_ded0d6551472a532; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:209
export const AMMOBOX____header_global_d325ecef76010d9e = ((((((31) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_72a0d7afa13126202d933c17() {
  return __cxx_static_address_72a0d7afa13126202d933c17.reference || (__cxx_static_address_72a0d7afa13126202d933c17.reference = {
    __cReference: true,
    get value() { return AMMOBOX____header_global_d325ecef76010d9e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:210
export const GROWSPRITEICON____header_global_565b9958fc5f54f6 = ((((((32) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a12b996288735eccb020e0a0() {
  return __cxx_static_address_a12b996288735eccb020e0a0.reference || (__cxx_static_address_a12b996288735eccb020e0a0.reference = {
    __cReference: true,
    get value() { return GROWSPRITEICON____header_global_565b9958fc5f54f6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:211
export const INVENTORYBOX____header_global_cd4eb7e06a244686 = ((((((33) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b059ca86071d63723a4ad030() {
  return __cxx_static_address_b059ca86071d63723a4ad030.reference || (__cxx_static_address_b059ca86071d63723a4ad030.reference = {
    __cReference: true,
    get value() { return INVENTORYBOX____header_global_cd4eb7e06a244686; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:212
export const FREEZEAMMO____header_global_adc63c69e788bc89 = ((((((37) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1afc30f8a029ff08ee824b00() {
  return __cxx_static_address_1afc30f8a029ff08ee824b00.reference || (__cxx_static_address_1afc30f8a029ff08ee824b00.reference = {
    __cReference: true,
    get value() { return FREEZEAMMO____header_global_adc63c69e788bc89; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:213
export const AMMO____header_global_0ee821c76ad32d41 = ((((((40) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4cdc13bc42482e3f682ad119() {
  return __cxx_static_address_4cdc13bc42482e3f682ad119.reference || (__cxx_static_address_4cdc13bc42482e3f682ad119.reference = {
    __cReference: true,
    get value() { return AMMO____header_global_0ee821c76ad32d41; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:214
export const BATTERYAMMO____header_global_f1f8909058d1a27b = ((((((41) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_042ee10dca962ffb84d04a64() {
  return __cxx_static_address_042ee10dca962ffb84d04a64.reference || (__cxx_static_address_042ee10dca962ffb84d04a64.reference = {
    __cReference: true,
    get value() { return BATTERYAMMO____header_global_f1f8909058d1a27b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:215
export const DEVISTATORAMMO____header_global_ca46378d934f7517 = ((((((42) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d9c28ef4ee25ddaa9dab1cc6() {
  return __cxx_static_address_d9c28ef4ee25ddaa9dab1cc6.reference || (__cxx_static_address_d9c28ef4ee25ddaa9dab1cc6.reference = {
    __cReference: true,
    get value() { return DEVISTATORAMMO____header_global_ca46378d934f7517; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:216
export const RPGAMMO____header_global_d765cd1dae93a81d = ((((((44) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1ee7bb892c170966c8514dd0() {
  return __cxx_static_address_1ee7bb892c170966c8514dd0.reference || (__cxx_static_address_1ee7bb892c170966c8514dd0.reference = {
    __cReference: true,
    get value() { return RPGAMMO____header_global_d765cd1dae93a81d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:217
export const GROWAMMO____header_global_6512ce23dd9e402f = ((((((45) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a22a9ed908eb112252220d5d() {
  return __cxx_static_address_a22a9ed908eb112252220d5d.reference || (__cxx_static_address_a22a9ed908eb112252220d5d.reference = {
    __cReference: true,
    get value() { return GROWAMMO____header_global_6512ce23dd9e402f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:218
export const CRYSTALAMMO____header_global_95d8cbfc7980390e = ((((((46) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7e935ddb321bba816b9a4792() {
  return __cxx_static_address_7e935ddb321bba816b9a4792.reference || (__cxx_static_address_7e935ddb321bba816b9a4792.reference = {
    __cReference: true,
    get value() { return CRYSTALAMMO____header_global_95d8cbfc7980390e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:219
export const HBOMBAMMO____header_global_c411723c11da12d2 = ((((((47) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6ba45fa1dcf3565d27c6b885() {
  return __cxx_static_address_6ba45fa1dcf3565d27c6b885.reference || (__cxx_static_address_6ba45fa1dcf3565d27c6b885.reference = {
    __cReference: true,
    get value() { return HBOMBAMMO____header_global_c411723c11da12d2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:220
export const AMMOLOTS____header_global_65da3a5d461a1e7a = ((((((48) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_19cce1134f1beae59eddf824() {
  return __cxx_static_address_19cce1134f1beae59eddf824.reference || (__cxx_static_address_19cce1134f1beae59eddf824.reference = {
    __cReference: true,
    get value() { return AMMOLOTS____header_global_65da3a5d461a1e7a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:221
export const SHOTGUNAMMO____header_global_091d8d0304e7e300 = ((((((49) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_836572e3ac975a260817a061() {
  return __cxx_static_address_836572e3ac975a260817a061.reference || (__cxx_static_address_836572e3ac975a260817a061.reference = {
    __cReference: true,
    get value() { return SHOTGUNAMMO____header_global_091d8d0304e7e300; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:222
export const COLA____header_global_6d33f9537becdc6d = ((((((51) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e879da7cbf4b42b639becc01() {
  return __cxx_static_address_e879da7cbf4b42b639becc01.reference || (__cxx_static_address_e879da7cbf4b42b639becc01.reference = {
    __cReference: true,
    get value() { return COLA____header_global_6d33f9537becdc6d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:223
export const SIXPAK____header_global_5626cb5d6b073479 = ((((((52) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bc03a9933fdb615d2abdd75f() {
  return __cxx_static_address_bc03a9933fdb615d2abdd75f.reference || (__cxx_static_address_bc03a9933fdb615d2abdd75f.reference = {
    __cReference: true,
    get value() { return SIXPAK____header_global_5626cb5d6b073479; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:224
export const FIRSTAID____header_global_7b550f4f62c0fd0b = ((((((53) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1588766ec80298a2bd352067() {
  return __cxx_static_address_1588766ec80298a2bd352067.reference || (__cxx_static_address_1588766ec80298a2bd352067.reference = {
    __cReference: true,
    get value() { return FIRSTAID____header_global_7b550f4f62c0fd0b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:225
export const SHIELD____header_global_78fe52597376084a = ((((((54) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9b64ac23c781e9a8f55c0806() {
  return __cxx_static_address_9b64ac23c781e9a8f55c0806.reference || (__cxx_static_address_9b64ac23c781e9a8f55c0806.reference = {
    __cReference: true,
    get value() { return SHIELD____header_global_78fe52597376084a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:226
export const STEROIDS____header_global_2c13bab4f30e16e2 = ((((((55) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c81bd67e20b3303a405a2b13() {
  return __cxx_static_address_c81bd67e20b3303a405a2b13.reference || (__cxx_static_address_c81bd67e20b3303a405a2b13.reference = {
    __cReference: true,
    get value() { return STEROIDS____header_global_2c13bab4f30e16e2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:227
export const AIRTANK____header_global_8fa425591c7d35c0 = ((((((56) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0c1d9d889b3517364515a9af() {
  return __cxx_static_address_0c1d9d889b3517364515a9af.reference || (__cxx_static_address_0c1d9d889b3517364515a9af.reference = {
    __cReference: true,
    get value() { return AIRTANK____header_global_8fa425591c7d35c0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:228
export const JETPACK____header_global_0d509ca021ba315c = ((((((57) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a342e0238abfb066817991be() {
  return __cxx_static_address_a342e0238abfb066817991be.reference || (__cxx_static_address_a342e0238abfb066817991be.reference = {
    __cReference: true,
    get value() { return JETPACK____header_global_0d509ca021ba315c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:229
export const HEATSENSOR____header_global_cbb520c931ec10d8 = ((((((59) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ef57ee9ff1effaf683c1e79a() {
  return __cxx_static_address_ef57ee9ff1effaf683c1e79a.reference || (__cxx_static_address_ef57ee9ff1effaf683c1e79a.reference = {
    __cReference: true,
    get value() { return HEATSENSOR____header_global_cbb520c931ec10d8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:230
export const ACCESSCARD____header_global_f035a3080269f739 = ((((((60) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a548a7c0c4d55bdfc24ef2ea() {
  return __cxx_static_address_a548a7c0c4d55bdfc24ef2ea.reference || (__cxx_static_address_a548a7c0c4d55bdfc24ef2ea.reference = {
    __cReference: true,
    get value() { return ACCESSCARD____header_global_f035a3080269f739; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:231
export const BOOTS____header_global_a198e6a8f128975b = ((((((61) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9135645b1bcebbf23650097e() {
  return __cxx_static_address_9135645b1bcebbf23650097e.reference || (__cxx_static_address_9135645b1bcebbf23650097e.reference = {
    __cReference: true,
    get value() { return BOOTS____header_global_a198e6a8f128975b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:232
export const MIRRORBROKE____header_global_d485dbc7fe2bf4bd = ((((((70) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_77faeafcd37c1142feb16fac() {
  return __cxx_static_address_77faeafcd37c1142feb16fac.reference || (__cxx_static_address_77faeafcd37c1142feb16fac.reference = {
    __cReference: true,
    get value() { return MIRRORBROKE____header_global_d485dbc7fe2bf4bd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:233
export const CLOUDYOCEAN____header_global_5f0d43e0ab8816e1 = ((((((78) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2782cdcc2609a30974e77c46() {
  return __cxx_static_address_2782cdcc2609a30974e77c46.reference || (__cxx_static_address_2782cdcc2609a30974e77c46.reference = {
    __cReference: true,
    get value() { return CLOUDYOCEAN____header_global_5f0d43e0ab8816e1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:234
export const CLOUDYSKIES____header_global_2c387feb6521150f = ((((((79) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2ea0353264e795b2d4300b55() {
  return __cxx_static_address_2ea0353264e795b2d4300b55.reference || (__cxx_static_address_2ea0353264e795b2d4300b55.reference = {
    __cReference: true,
    get value() { return CLOUDYSKIES____header_global_2c387feb6521150f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:235
export const MOONSKY1____header_global_bccd5c23599c1f6f = ((((((80) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c6bf492fc88ba6a7dfa2d494() {
  return __cxx_static_address_c6bf492fc88ba6a7dfa2d494.reference || (__cxx_static_address_c6bf492fc88ba6a7dfa2d494.reference = {
    __cReference: true,
    get value() { return MOONSKY1____header_global_bccd5c23599c1f6f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:236
export const BIGORBIT1____header_global_88462eb1d8e98572 = ((((((84) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eda7ae33c2aca677bde4160c() {
  return __cxx_static_address_eda7ae33c2aca677bde4160c.reference || (__cxx_static_address_eda7ae33c2aca677bde4160c.reference = {
    __cReference: true,
    get value() { return BIGORBIT1____header_global_88462eb1d8e98572; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:237
export const LA____header_global_bc25cd4541ec6838 = ((((((89) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ad93394fb010f5438c5e97a0() {
  return __cxx_static_address_ad93394fb010f5438c5e97a0.reference || (__cxx_static_address_ad93394fb010f5438c5e97a0.reference = {
    __cReference: true,
    get value() { return LA____header_global_bc25cd4541ec6838; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:238
export const ATOMICHEALTH____header_global_2d46e0334e9c626b = ((((((100) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_482e1471feb946dc974fee32() {
  return __cxx_static_address_482e1471feb946dc974fee32.reference || (__cxx_static_address_482e1471feb946dc974fee32.reference = {
    __cReference: true,
    get value() { return ATOMICHEALTH____header_global_2d46e0334e9c626b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:239
export const TECHLIGHT2____header_global_e38c31b3e7cf5c25 = ((((((120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eb40b5f03dc07c5d78c18378() {
  return __cxx_static_address_eb40b5f03dc07c5d78c18378.reference || (__cxx_static_address_eb40b5f03dc07c5d78c18378.reference = {
    __cReference: true,
    get value() { return TECHLIGHT2____header_global_e38c31b3e7cf5c25; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:240
export const TECHLIGHTBUST2____header_global_22b464f3f4ec8c9a = ((((((121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cbad4f693cf48087d045590f() {
  return __cxx_static_address_cbad4f693cf48087d045590f.reference || (__cxx_static_address_cbad4f693cf48087d045590f.reference = {
    __cReference: true,
    get value() { return TECHLIGHTBUST2____header_global_22b464f3f4ec8c9a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:241
export const TECHLIGHT4____header_global_726734087ad31bde = ((((((122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f01020dc28b7a60e854b18d1() {
  return __cxx_static_address_f01020dc28b7a60e854b18d1.reference || (__cxx_static_address_f01020dc28b7a60e854b18d1.reference = {
    __cReference: true,
    get value() { return TECHLIGHT4____header_global_726734087ad31bde; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:242
export const TECHLIGHTBUST4____header_global_292f2a8519ff9f20 = ((((((123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_792a1eeb3355d2a0e5b92a2a() {
  return __cxx_static_address_792a1eeb3355d2a0e5b92a2a.reference || (__cxx_static_address_792a1eeb3355d2a0e5b92a2a.reference = {
    __cReference: true,
    get value() { return TECHLIGHTBUST4____header_global_292f2a8519ff9f20; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:243
export const WALLLIGHT4____header_global_1f58649aff26ca26 = ((((((124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_de860ff2f5a0897be1e61b93() {
  return __cxx_static_address_de860ff2f5a0897be1e61b93.reference || (__cxx_static_address_de860ff2f5a0897be1e61b93.reference = {
    __cReference: true,
    get value() { return WALLLIGHT4____header_global_1f58649aff26ca26; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:244
export const WALLLIGHTBUST4____header_global_54e3fe9b1d5ea455 = ((((((125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2adebf931286185681e65f70() {
  return __cxx_static_address_2adebf931286185681e65f70.reference || (__cxx_static_address_2adebf931286185681e65f70.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST4____header_global_54e3fe9b1d5ea455; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:245
export const ACCESSSWITCH____header_global_022b14c9ee5e0775 = ((((((130) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_33a1ebf0defe69cf30f89f49() {
  return __cxx_static_address_33a1ebf0defe69cf30f89f49.reference || (__cxx_static_address_33a1ebf0defe69cf30f89f49.reference = {
    __cReference: true,
    get value() { return ACCESSSWITCH____header_global_022b14c9ee5e0775; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:246
export const SLOTDOOR____header_global_cd574e50d7c2ad3a = ((((((132) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_db7e2c1a9a49c7fbd9c2bfb3() {
  return __cxx_static_address_db7e2c1a9a49c7fbd9c2bfb3.reference || (__cxx_static_address_db7e2c1a9a49c7fbd9c2bfb3.reference = {
    __cReference: true,
    get value() { return SLOTDOOR____header_global_cd574e50d7c2ad3a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:247
export const LIGHTSWITCH____header_global_ecbe2ba0f4248992 = ((((((134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4f36b5ab9ae2205376da25ad() {
  return __cxx_static_address_4f36b5ab9ae2205376da25ad.reference || (__cxx_static_address_4f36b5ab9ae2205376da25ad.reference = {
    __cReference: true,
    get value() { return LIGHTSWITCH____header_global_ecbe2ba0f4248992; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:248
export const SPACEDOORSWITCH____header_global_3b410d37c4572198 = ((((((136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9d0c6c84dfd36de6034da956() {
  return __cxx_static_address_9d0c6c84dfd36de6034da956.reference || (__cxx_static_address_9d0c6c84dfd36de6034da956.reference = {
    __cReference: true,
    get value() { return SPACEDOORSWITCH____header_global_3b410d37c4572198; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:249
export const SPACELIGHTSWITCH____header_global_17e0be51c9ac0625 = ((((((138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_59c0206e491b82856e5b16b8() {
  return __cxx_static_address_59c0206e491b82856e5b16b8.reference || (__cxx_static_address_59c0206e491b82856e5b16b8.reference = {
    __cReference: true,
    get value() { return SPACELIGHTSWITCH____header_global_17e0be51c9ac0625; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:250
export const FRANKENSTINESWITCH____header_global_a4b33f21193d3295 = ((((((140) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8240db10820fdceb58f2eac0() {
  return __cxx_static_address_8240db10820fdceb58f2eac0.reference || (__cxx_static_address_8240db10820fdceb58f2eac0.reference = {
    __cReference: true,
    get value() { return FRANKENSTINESWITCH____header_global_a4b33f21193d3295; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:251
export const NUKEBUTTON____header_global_efd9bd282be9aff8 = ((((((142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_46acc503a0e331e2b1e83093() {
  return __cxx_static_address_46acc503a0e331e2b1e83093.reference || (__cxx_static_address_46acc503a0e331e2b1e83093.reference = {
    __cReference: true,
    get value() { return NUKEBUTTON____header_global_efd9bd282be9aff8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:252
export const MULTISWITCH____header_global_405b3cc4bc598fdd = ((((((146) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0c3beef25eedfb4f22dfbac5() {
  return __cxx_static_address_0c3beef25eedfb4f22dfbac5.reference || (__cxx_static_address_0c3beef25eedfb4f22dfbac5.reference = {
    __cReference: true,
    get value() { return MULTISWITCH____header_global_405b3cc4bc598fdd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:253
export const DOORTILE5____header_global_6b03a30130892d65 = ((((((150) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_65c924214503f0ac3f12ff1c() {
  return __cxx_static_address_65c924214503f0ac3f12ff1c.reference || (__cxx_static_address_65c924214503f0ac3f12ff1c.reference = {
    __cReference: true,
    get value() { return DOORTILE5____header_global_6b03a30130892d65; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:254
export const DOORTILE6____header_global_1ff816991facfd19 = ((((((151) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a49e8b32c8f9ba5537778be8() {
  return __cxx_static_address_a49e8b32c8f9ba5537778be8.reference || (__cxx_static_address_a49e8b32c8f9ba5537778be8.reference = {
    __cReference: true,
    get value() { return DOORTILE6____header_global_1ff816991facfd19; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:255
export const DOORTILE1____header_global_3d65c362ac8a1ff4 = ((((((152) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6431c6cabc4fc734ae3d409d() {
  return __cxx_static_address_6431c6cabc4fc734ae3d409d.reference || (__cxx_static_address_6431c6cabc4fc734ae3d409d.reference = {
    __cReference: true,
    get value() { return DOORTILE1____header_global_3d65c362ac8a1ff4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:256
export const DOORTILE2____header_global_e04bf8c3c8e5b7c4 = ((((((153) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eea9aa652b97ae33148dc38f() {
  return __cxx_static_address_eea9aa652b97ae33148dc38f.reference || (__cxx_static_address_eea9aa652b97ae33148dc38f.reference = {
    __cReference: true,
    get value() { return DOORTILE2____header_global_e04bf8c3c8e5b7c4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:257
export const DOORTILE3____header_global_9ee8c49ced930dc7 = ((((((154) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_00056282a7ac493b099ce451() {
  return __cxx_static_address_00056282a7ac493b099ce451.reference || (__cxx_static_address_00056282a7ac493b099ce451.reference = {
    __cReference: true,
    get value() { return DOORTILE3____header_global_9ee8c49ced930dc7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:258
export const DOORTILE4____header_global_363046a71488427f = ((((((155) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f17a27edffdef220fbb837ea() {
  return __cxx_static_address_f17a27edffdef220fbb837ea.reference || (__cxx_static_address_f17a27edffdef220fbb837ea.reference = {
    __cReference: true,
    get value() { return DOORTILE4____header_global_363046a71488427f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:259
export const DOORTILE7____header_global_ca149b6c1a33c80b = ((((((156) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ff7e197ff4919d7f5a5c8b0d() {
  return __cxx_static_address_ff7e197ff4919d7f5a5c8b0d.reference || (__cxx_static_address_ff7e197ff4919d7f5a5c8b0d.reference = {
    __cReference: true,
    get value() { return DOORTILE7____header_global_ca149b6c1a33c80b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:260
export const DOORTILE8____header_global_45d4e749328dcbfd = ((((((157) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dc816fbbcb5eab14433e0dec() {
  return __cxx_static_address_dc816fbbcb5eab14433e0dec.reference || (__cxx_static_address_dc816fbbcb5eab14433e0dec.reference = {
    __cReference: true,
    get value() { return DOORTILE8____header_global_45d4e749328dcbfd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:261
export const DOORTILE9____header_global_f44f946d837cb648 = ((((((158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a7316a3351e74a4b0cdcf42b() {
  return __cxx_static_address_a7316a3351e74a4b0cdcf42b.reference || (__cxx_static_address_a7316a3351e74a4b0cdcf42b.reference = {
    __cReference: true,
    get value() { return DOORTILE9____header_global_f44f946d837cb648; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:262
export const DOORTILE10____header_global_bd8cb4eb846bec72 = ((((((159) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_289332e5e50f5162e0eff06f() {
  return __cxx_static_address_289332e5e50f5162e0eff06f.reference || (__cxx_static_address_289332e5e50f5162e0eff06f.reference = {
    __cReference: true,
    get value() { return DOORTILE10____header_global_bd8cb4eb846bec72; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:263
export const DOORSHOCK____header_global_7044fea55acf6707 = ((((((160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_74fe08ef36d60d3520e31251() {
  return __cxx_static_address_74fe08ef36d60d3520e31251.reference || (__cxx_static_address_74fe08ef36d60d3520e31251.reference = {
    __cReference: true,
    get value() { return DOORSHOCK____header_global_7044fea55acf6707; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:264
export const DIPSWITCH____header_global_58b0eef124d7e106 = ((((((162) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9bf4284ba8ef71a932d8d70a() {
  return __cxx_static_address_9bf4284ba8ef71a932d8d70a.reference || (__cxx_static_address_9bf4284ba8ef71a932d8d70a.reference = {
    __cReference: true,
    get value() { return DIPSWITCH____header_global_58b0eef124d7e106; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:265
export const DIPSWITCH2____header_global_1f0bbe3335cc20fd = ((((((164) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eb6bdbd9260a4df8bf32cf3c() {
  return __cxx_static_address_eb6bdbd9260a4df8bf32cf3c.reference || (__cxx_static_address_eb6bdbd9260a4df8bf32cf3c.reference = {
    __cReference: true,
    get value() { return DIPSWITCH2____header_global_1f0bbe3335cc20fd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:266
export const TECHSWITCH____header_global_c6e2e2390f1818d1 = ((((((166) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_155cdbd9cf14dd16ec69729c() {
  return __cxx_static_address_155cdbd9cf14dd16ec69729c.reference || (__cxx_static_address_155cdbd9cf14dd16ec69729c.reference = {
    __cReference: true,
    get value() { return TECHSWITCH____header_global_c6e2e2390f1818d1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:267
export const DIPSWITCH3____header_global_664a6cdc672356ff = ((((((168) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ecaeb644be122133833abd77() {
  return __cxx_static_address_ecaeb644be122133833abd77.reference || (__cxx_static_address_ecaeb644be122133833abd77.reference = {
    __cReference: true,
    get value() { return DIPSWITCH3____header_global_664a6cdc672356ff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:268
export const ACCESSSWITCH2____header_global_00587625c1ee4b07 = ((((((170) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fd1049690ad4e39b3701b319() {
  return __cxx_static_address_fd1049690ad4e39b3701b319.reference || (__cxx_static_address_fd1049690ad4e39b3701b319.reference = {
    __cReference: true,
    get value() { return ACCESSSWITCH2____header_global_00587625c1ee4b07; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:269
export const FLOORSLIME____header_global_8c143871874e3dd9 = ((((((200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3ecf0ae4779d1fba2093eb12() {
  return __cxx_static_address_3ecf0ae4779d1fba2093eb12.reference || (__cxx_static_address_3ecf0ae4779d1fba2093eb12.reference = {
    __cReference: true,
    get value() { return FLOORSLIME____header_global_8c143871874e3dd9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:270
export const BIGFORCE____header_global_d9001451b55de3a4 = ((((((230) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7351d2403de01efb64d1150d() {
  return __cxx_static_address_7351d2403de01efb64d1150d.reference || (__cxx_static_address_7351d2403de01efb64d1150d.reference = {
    __cReference: true,
    get value() { return BIGFORCE____header_global_d9001451b55de3a4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:271
export const MASKWALL9____header_global_b4914d362fed9cfa = ((((((255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_95b29e936d4818753b666066() {
  return __cxx_static_address_95b29e936d4818753b666066.reference || (__cxx_static_address_95b29e936d4818753b666066.reference = {
    __cReference: true,
    get value() { return MASKWALL9____header_global_b4914d362fed9cfa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:272
export const SCREENBREAK1____header_global_133a5c1790402597 = ((((((263) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d94a09e29b17974eba0cf6af() {
  return __cxx_static_address_d94a09e29b17974eba0cf6af.reference || (__cxx_static_address_d94a09e29b17974eba0cf6af.reference = {
    __cReference: true,
    get value() { return SCREENBREAK1____header_global_133a5c1790402597; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:273
export const SCREENBREAK2____header_global_5933d426cd4b090c = ((((((264) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_512f51f9c1696bb03648bebc() {
  return __cxx_static_address_512f51f9c1696bb03648bebc.reference || (__cxx_static_address_512f51f9c1696bb03648bebc.reference = {
    __cReference: true,
    get value() { return SCREENBREAK2____header_global_5933d426cd4b090c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:274
export const SCREENBREAK3____header_global_820cd13feb66cb11 = ((((((265) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0d38a3e816c3d9c234c55442() {
  return __cxx_static_address_0d38a3e816c3d9c234c55442.reference || (__cxx_static_address_0d38a3e816c3d9c234c55442.reference = {
    __cReference: true,
    get value() { return SCREENBREAK3____header_global_820cd13feb66cb11; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:275
export const SCREENBREAK4____header_global_0fdc0fd1f87e318e = ((((((266) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cbc6653144c7d9bbed43e1cd() {
  return __cxx_static_address_cbc6653144c7d9bbed43e1cd.reference || (__cxx_static_address_cbc6653144c7d9bbed43e1cd.reference = {
    __cReference: true,
    get value() { return SCREENBREAK4____header_global_0fdc0fd1f87e318e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:276
export const SCREENBREAK5____header_global_e2ba31960890800d = ((((((267) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c8e636cbb85fa5e843a35534() {
  return __cxx_static_address_c8e636cbb85fa5e843a35534.reference || (__cxx_static_address_c8e636cbb85fa5e843a35534.reference = {
    __cReference: true,
    get value() { return SCREENBREAK5____header_global_e2ba31960890800d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:277
export const SCREENBREAK6____header_global_18859719d0368d65 = ((((((268) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cb23ef192ec73937062e7a09() {
  return __cxx_static_address_cb23ef192ec73937062e7a09.reference || (__cxx_static_address_cb23ef192ec73937062e7a09.reference = {
    __cReference: true,
    get value() { return SCREENBREAK6____header_global_18859719d0368d65; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:278
export const SCREENBREAK7____header_global_752062a7fc2b62c4 = ((((((269) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0605135b7ce93833cf6d5211() {
  return __cxx_static_address_0605135b7ce93833cf6d5211.reference || (__cxx_static_address_0605135b7ce93833cf6d5211.reference = {
    __cReference: true,
    get value() { return SCREENBREAK7____header_global_752062a7fc2b62c4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:279
export const SCREENBREAK8____header_global_77826a5577ca79e6 = ((((((270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b945cfede6903497aa13dcc3() {
  return __cxx_static_address_b945cfede6903497aa13dcc3.reference || (__cxx_static_address_b945cfede6903497aa13dcc3.reference = {
    __cReference: true,
    get value() { return SCREENBREAK8____header_global_77826a5577ca79e6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:280
export const SCREENBREAK9____header_global_49e0b03324f66b9e = ((((((271) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4a09f356414ead421cd0ad52() {
  return __cxx_static_address_4a09f356414ead421cd0ad52.reference || (__cxx_static_address_4a09f356414ead421cd0ad52.reference = {
    __cReference: true,
    get value() { return SCREENBREAK9____header_global_49e0b03324f66b9e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:281
export const SCREENBREAK10____header_global_28874717c4bd93c1 = ((((((272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_86001fb84f86eb41e6ee11cd() {
  return __cxx_static_address_86001fb84f86eb41e6ee11cd.reference || (__cxx_static_address_86001fb84f86eb41e6ee11cd.reference = {
    __cReference: true,
    get value() { return SCREENBREAK10____header_global_28874717c4bd93c1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:282
export const SCREENBREAK11____header_global_93ea33b6b93e2c82 = ((((((273) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_98a0fb89bce894ffbf36c3cf() {
  return __cxx_static_address_98a0fb89bce894ffbf36c3cf.reference || (__cxx_static_address_98a0fb89bce894ffbf36c3cf.reference = {
    __cReference: true,
    get value() { return SCREENBREAK11____header_global_93ea33b6b93e2c82; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:283
export const SCREENBREAK12____header_global_fb24a81e3affc509 = ((((((274) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d9d0f521ad8301451f3447dc() {
  return __cxx_static_address_d9d0f521ad8301451f3447dc.reference || (__cxx_static_address_d9d0f521ad8301451f3447dc.reference = {
    __cReference: true,
    get value() { return SCREENBREAK12____header_global_fb24a81e3affc509; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:284
export const SCREENBREAK13____header_global_6fba591c8ade88d2 = ((((((275) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ac124358d4e07c1db1622208() {
  return __cxx_static_address_ac124358d4e07c1db1622208.reference || (__cxx_static_address_ac124358d4e07c1db1622208.reference = {
    __cReference: true,
    get value() { return SCREENBREAK13____header_global_6fba591c8ade88d2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:285
export const MASKWALL1____header_global_98cfb8b24427eb09 = ((((((285) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7bcbc86db8ef7e6ae5e0dc66() {
  return __cxx_static_address_7bcbc86db8ef7e6ae5e0dc66.reference || (__cxx_static_address_7bcbc86db8ef7e6ae5e0dc66.reference = {
    __cReference: true,
    get value() { return MASKWALL1____header_global_98cfb8b24427eb09; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:286
export const W_TECHWALL1____header_global_7cba171f5df3d5f6 = ((((((293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4c94ac11f609a142386ce7a5() {
  return __cxx_static_address_4c94ac11f609a142386ce7a5.reference || (__cxx_static_address_4c94ac11f609a142386ce7a5.reference = {
    __cReference: true,
    get value() { return W_TECHWALL1____header_global_7cba171f5df3d5f6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:287
export const W_TECHWALL2____header_global_3b9db476bd4106f6 = ((((((297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f8120f6a8af84fc5885a618f() {
  return __cxx_static_address_f8120f6a8af84fc5885a618f.reference || (__cxx_static_address_f8120f6a8af84fc5885a618f.reference = {
    __cReference: true,
    get value() { return W_TECHWALL2____header_global_3b9db476bd4106f6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:288
export const W_TECHWALL15____header_global_1d5e239ef427290a = ((((((299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bd6a9ed428ddf3186e64ed19() {
  return __cxx_static_address_bd6a9ed428ddf3186e64ed19.reference || (__cxx_static_address_bd6a9ed428ddf3186e64ed19.reference = {
    __cReference: true,
    get value() { return W_TECHWALL15____header_global_1d5e239ef427290a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:289
export const W_TECHWALL3____header_global_3ac0e8d1f4cf5de5 = ((((((301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ecfc8cf56e5705ba60958b95() {
  return __cxx_static_address_ecfc8cf56e5705ba60958b95.reference || (__cxx_static_address_ecfc8cf56e5705ba60958b95.reference = {
    __cReference: true,
    get value() { return W_TECHWALL3____header_global_3ac0e8d1f4cf5de5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:290
export const W_TECHWALL4____header_global_f8fb6bfe716e2518 = ((((((305) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2e6d96ccb98b53286e737acf() {
  return __cxx_static_address_2e6d96ccb98b53286e737acf.reference || (__cxx_static_address_2e6d96ccb98b53286e737acf.reference = {
    __cReference: true,
    get value() { return W_TECHWALL4____header_global_f8fb6bfe716e2518; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:291
export const W_TECHWALL10____header_global_29bb6755458998f1 = ((((((306) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f0562d535957b0850e451580() {
  return __cxx_static_address_f0562d535957b0850e451580.reference || (__cxx_static_address_f0562d535957b0850e451580.reference = {
    __cReference: true,
    get value() { return W_TECHWALL10____header_global_29bb6755458998f1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:292
export const W_TECHWALL16____header_global_fa5622fba3b50913 = ((((((307) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0ce6effd20f19e417eeb2154() {
  return __cxx_static_address_0ce6effd20f19e417eeb2154.reference || (__cxx_static_address_0ce6effd20f19e417eeb2154.reference = {
    __cReference: true,
    get value() { return W_TECHWALL16____header_global_fa5622fba3b50913; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:293
export const WATERTILE2____header_global_cb48b318ee8a7d54 = ((((((336) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_43c4d40acef7c7cef67a0663() {
  return __cxx_static_address_43c4d40acef7c7cef67a0663.reference || (__cxx_static_address_43c4d40acef7c7cef67a0663.reference = {
    __cReference: true,
    get value() { return WATERTILE2____header_global_cb48b318ee8a7d54; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:294
export const BPANNEL1____header_global_dc7204e5427f3629 = ((((((341) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ceb9039de5bd9c84e82c2fe3() {
  return __cxx_static_address_ceb9039de5bd9c84e82c2fe3.reference || (__cxx_static_address_ceb9039de5bd9c84e82c2fe3.reference = {
    __cReference: true,
    get value() { return BPANNEL1____header_global_dc7204e5427f3629; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:295
export const PANNEL1____header_global_f5336d967ed4bfaa = ((((((342) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4d16dc64dd9dac624001998c() {
  return __cxx_static_address_4d16dc64dd9dac624001998c.reference || (__cxx_static_address_4d16dc64dd9dac624001998c.reference = {
    __cReference: true,
    get value() { return PANNEL1____header_global_f5336d967ed4bfaa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:296
export const PANNEL2____header_global_b27b6fe4e40357da = ((((((343) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_31fbeeb7aed99e444c111e80() {
  return __cxx_static_address_31fbeeb7aed99e444c111e80.reference || (__cxx_static_address_31fbeeb7aed99e444c111e80.reference = {
    __cReference: true,
    get value() { return PANNEL2____header_global_b27b6fe4e40357da; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:297
export const STATIC____header_global_78f390b0725bbb00 = ((((((351) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bb765f31dd2d3f25163371ec() {
  return __cxx_static_address_bb765f31dd2d3f25163371ec.reference || (__cxx_static_address_bb765f31dd2d3f25163371ec.reference = {
    __cReference: true,
    get value() { return STATIC____header_global_78f390b0725bbb00; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:298
export const W_SCREENBREAK____header_global_bfcbb03067ed4cbb = ((((((357) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9c0095913b40e664f8579a25() {
  return __cxx_static_address_9c0095913b40e664f8579a25.reference || (__cxx_static_address_9c0095913b40e664f8579a25.reference = {
    __cReference: true,
    get value() { return W_SCREENBREAK____header_global_bfcbb03067ed4cbb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:299
export const W_HITTECHWALL3____header_global_d842edf47a533a30 = ((((((360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_acb69ead8e3e32475f4addd4() {
  return __cxx_static_address_acb69ead8e3e32475f4addd4.reference || (__cxx_static_address_acb69ead8e3e32475f4addd4.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL3____header_global_d842edf47a533a30; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:300
export const W_HITTECHWALL4____header_global_7b98f3d916770c7a = ((((((361) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_90e4b6541d3cfcdf929284c2() {
  return __cxx_static_address_90e4b6541d3cfcdf929284c2.reference || (__cxx_static_address_90e4b6541d3cfcdf929284c2.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL4____header_global_7b98f3d916770c7a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:301
export const W_HITTECHWALL2____header_global_94dc25f869d2cfe3 = ((((((362) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0ab3b68ed359ac65e943e04a() {
  return __cxx_static_address_0ab3b68ed359ac65e943e04a.reference || (__cxx_static_address_0ab3b68ed359ac65e943e04a.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL2____header_global_94dc25f869d2cfe3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:302
export const W_HITTECHWALL1____header_global_3c905423f45530d6 = ((((((363) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_09a88f991d77c8fbaa1a46a2() {
  return __cxx_static_address_09a88f991d77c8fbaa1a46a2.reference || (__cxx_static_address_09a88f991d77c8fbaa1a46a2.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL1____header_global_3c905423f45530d6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:303
export const MASKWALL10____header_global_a6a602c5e88afb70 = ((((((387) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2b626d2fa93a15dda0167500() {
  return __cxx_static_address_2b626d2fa93a15dda0167500.reference || (__cxx_static_address_2b626d2fa93a15dda0167500.reference = {
    __cReference: true,
    get value() { return MASKWALL10____header_global_a6a602c5e88afb70; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:304
export const MASKWALL11____header_global_d21c5e346c5aa84d = ((((((391) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eef0debb395d5a11d4db6bf1() {
  return __cxx_static_address_eef0debb395d5a11d4db6bf1.reference || (__cxx_static_address_eef0debb395d5a11d4db6bf1.reference = {
    __cReference: true,
    get value() { return MASKWALL11____header_global_d21c5e346c5aa84d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:305
export const DOORTILE22____header_global_613f69b6d1e2a419 = ((((((395) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_54c8f9dbed4847a243d021a4() {
  return __cxx_static_address_54c8f9dbed4847a243d021a4.reference || (__cxx_static_address_54c8f9dbed4847a243d021a4.reference = {
    __cReference: true,
    get value() { return DOORTILE22____header_global_613f69b6d1e2a419; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:306
export const FANSPRITE____header_global_681b0b93ea238c03 = ((((((407) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9a73594c762c40029c59e9e6() {
  return __cxx_static_address_9a73594c762c40029c59e9e6.reference || (__cxx_static_address_9a73594c762c40029c59e9e6.reference = {
    __cReference: true,
    get value() { return FANSPRITE____header_global_681b0b93ea238c03; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:307
export const FANSPRITEBROKE____header_global_910d9b5f91f628d5 = ((((((411) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e3327a0b1035e4cbdaeeefb8() {
  return __cxx_static_address_e3327a0b1035e4cbdaeeefb8.reference || (__cxx_static_address_e3327a0b1035e4cbdaeeefb8.reference = {
    __cReference: true,
    get value() { return FANSPRITEBROKE____header_global_910d9b5f91f628d5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:308
export const FANSHADOW____header_global_3bf1e9faa3c14f3d = ((((((412) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6c297217f2104ebab19ca3ff() {
  return __cxx_static_address_6c297217f2104ebab19ca3ff.reference || (__cxx_static_address_6c297217f2104ebab19ca3ff.reference = {
    __cReference: true,
    get value() { return FANSHADOW____header_global_3bf1e9faa3c14f3d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:309
export const FANSHADOWBROKE____header_global_a6b2d2fe68c06445 = ((((((416) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_140f6684b08d7247e4956136() {
  return __cxx_static_address_140f6684b08d7247e4956136.reference || (__cxx_static_address_140f6684b08d7247e4956136.reference = {
    __cReference: true,
    get value() { return FANSHADOWBROKE____header_global_a6b2d2fe68c06445; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:310
export const DOORTILE18____header_global_1cd3fd586c9fb732 = ((((((447) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e9ef1561e755a9e7798319d() {
  return __cxx_static_address_1e9ef1561e755a9e7798319d.reference || (__cxx_static_address_1e9ef1561e755a9e7798319d.reference = {
    __cReference: true,
    get value() { return DOORTILE18____header_global_1cd3fd586c9fb732; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:311
export const DOORTILE19____header_global_a374f21f16e7f727 = ((((((448) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fd466985bf70e2988c95ff85() {
  return __cxx_static_address_fd466985bf70e2988c95ff85.reference || (__cxx_static_address_fd466985bf70e2988c95ff85.reference = {
    __cReference: true,
    get value() { return DOORTILE19____header_global_a374f21f16e7f727; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:312
export const DOORTILE20____header_global_e9562bc3aa2a6fb3 = ((((((449) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a2039d3192ac77f31e6b3aab() {
  return __cxx_static_address_a2039d3192ac77f31e6b3aab.reference || (__cxx_static_address_a2039d3192ac77f31e6b3aab.reference = {
    __cReference: true,
    get value() { return DOORTILE20____header_global_e9562bc3aa2a6fb3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:313
export const VIEWSCREEN2____header_global_b1a6cefd3c09eac9 = ((((((499) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c90f8b1511313702f2a00c07() {
  return __cxx_static_address_c90f8b1511313702f2a00c07.reference || (__cxx_static_address_c90f8b1511313702f2a00c07.reference = {
    __cReference: true,
    get value() { return VIEWSCREEN2____header_global_b1a6cefd3c09eac9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:314
export const VIEWSCREEN____header_global_e6df8cddeb7b65ee = ((((((502) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_93938916cf6770c545d06f27() {
  return __cxx_static_address_93938916cf6770c545d06f27.reference || (__cxx_static_address_93938916cf6770c545d06f27.reference = {
    __cReference: true,
    get value() { return VIEWSCREEN____header_global_e6df8cddeb7b65ee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:315
export const GLASS____header_global_45d06c8a2f751453 = ((((((503) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6b79fb6965b573e930aefb86() {
  return __cxx_static_address_6b79fb6965b573e930aefb86.reference || (__cxx_static_address_6b79fb6965b573e930aefb86.reference = {
    __cReference: true,
    get value() { return GLASS____header_global_45d06c8a2f751453; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:316
export const GLASS2____header_global_e415037bf08c4751 = ((((((504) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c744373bfa09af92cb18ef42() {
  return __cxx_static_address_c744373bfa09af92cb18ef42.reference || (__cxx_static_address_c744373bfa09af92cb18ef42.reference = {
    __cReference: true,
    get value() { return GLASS2____header_global_e415037bf08c4751; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:317
export const STAINGLASS1____header_global_8a4f14ca35eb7a33 = ((((((510) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a8b67328e7d62b2114f62389() {
  return __cxx_static_address_a8b67328e7d62b2114f62389.reference || (__cxx_static_address_a8b67328e7d62b2114f62389.reference = {
    __cReference: true,
    get value() { return STAINGLASS1____header_global_8a4f14ca35eb7a33; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:318
export const MASKWALL5____header_global_c215eaa15ce8f1d1 = ((((((514) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3d9371bbdee51ff9d74ef19d() {
  return __cxx_static_address_3d9371bbdee51ff9d74ef19d.reference || (__cxx_static_address_3d9371bbdee51ff9d74ef19d.reference = {
    __cReference: true,
    get value() { return MASKWALL5____header_global_c215eaa15ce8f1d1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:319
export const SATELITE____header_global_4c2ed0605d5f60d6 = ((((((516) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b06020dca86ea0f26ab0d485() {
  return __cxx_static_address_b06020dca86ea0f26ab0d485.reference || (__cxx_static_address_b06020dca86ea0f26ab0d485.reference = {
    __cReference: true,
    get value() { return SATELITE____header_global_4c2ed0605d5f60d6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:320
export const FUELPOD____header_global_33805c2581f0f708 = ((((((517) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4f690f9a4511246a31f3e6b9() {
  return __cxx_static_address_4f690f9a4511246a31f3e6b9.reference || (__cxx_static_address_4f690f9a4511246a31f3e6b9.reference = {
    __cReference: true,
    get value() { return FUELPOD____header_global_33805c2581f0f708; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:321
export const CRACK1____header_global_038c2f85669bd08c = ((((((546) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5a0ba977b6ca51841a2115e8() {
  return __cxx_static_address_5a0ba977b6ca51841a2115e8.reference || (__cxx_static_address_5a0ba977b6ca51841a2115e8.reference = {
    __cReference: true,
    get value() { return CRACK1____header_global_038c2f85669bd08c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:322
export const CRACK2____header_global_6e964f72586e312c = ((((((547) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_430aec2b7b8532d959d78b89() {
  return __cxx_static_address_430aec2b7b8532d959d78b89.reference || (__cxx_static_address_430aec2b7b8532d959d78b89.reference = {
    __cReference: true,
    get value() { return CRACK2____header_global_6e964f72586e312c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:323
export const CRACK3____header_global_c313537f1c0dd443 = ((((((548) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_134e24be44835c7e72bac104() {
  return __cxx_static_address_134e24be44835c7e72bac104.reference || (__cxx_static_address_134e24be44835c7e72bac104.reference = {
    __cReference: true,
    get value() { return CRACK3____header_global_c313537f1c0dd443; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:324
export const CRACK4____header_global_291c729f58d97894 = ((((((549) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_848bc6130c5e2f4029ccd1d4() {
  return __cxx_static_address_848bc6130c5e2f4029ccd1d4.reference || (__cxx_static_address_848bc6130c5e2f4029ccd1d4.reference = {
    __cReference: true,
    get value() { return CRACK4____header_global_291c729f58d97894; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:325
export const FOOTPRINTS____header_global_3a3df8f5908d45a4 = ((((((550) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8a107441c5340ee3783402b7() {
  return __cxx_static_address_8a107441c5340ee3783402b7.reference || (__cxx_static_address_8a107441c5340ee3783402b7.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS____header_global_3a3df8f5908d45a4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:326
export const DOMELITE____header_global_0083b507bc648935 = ((((((551) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4f0efcf48e5ba5b428905fc3() {
  return __cxx_static_address_4f0efcf48e5ba5b428905fc3.reference || (__cxx_static_address_4f0efcf48e5ba5b428905fc3.reference = {
    __cReference: true,
    get value() { return DOMELITE____header_global_0083b507bc648935; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:327
export const CAMERAPOLE____header_global_79d77073b50a14ec = ((((((554) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_77285730be6198e7ea1ce0f6() {
  return __cxx_static_address_77285730be6198e7ea1ce0f6.reference || (__cxx_static_address_77285730be6198e7ea1ce0f6.reference = {
    __cReference: true,
    get value() { return CAMERAPOLE____header_global_79d77073b50a14ec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:328
export const CHAIR1____header_global_651515a7f8c19b31 = ((((((556) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ddba006653710b5e4f5bfe25() {
  return __cxx_static_address_ddba006653710b5e4f5bfe25.reference || (__cxx_static_address_ddba006653710b5e4f5bfe25.reference = {
    __cReference: true,
    get value() { return CHAIR1____header_global_651515a7f8c19b31; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:329
export const CHAIR2____header_global_31073934ead127a5 = ((((((557) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5cc95510aadabed1fe9a2ef7() {
  return __cxx_static_address_5cc95510aadabed1fe9a2ef7.reference || (__cxx_static_address_5cc95510aadabed1fe9a2ef7.reference = {
    __cReference: true,
    get value() { return CHAIR2____header_global_31073934ead127a5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:330
export const BROKENCHAIR____header_global_6d8fc5f4a7d95139 = ((((((559) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_675576dc38591c9b4d1346b5() {
  return __cxx_static_address_675576dc38591c9b4d1346b5.reference || (__cxx_static_address_675576dc38591c9b4d1346b5.reference = {
    __cReference: true,
    get value() { return BROKENCHAIR____header_global_6d8fc5f4a7d95139; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:331
export const MIRROR____header_global_43a78267aacafbe4 = ((((((560) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4266feb573a072f8410ced97() {
  return __cxx_static_address_4266feb573a072f8410ced97.reference || (__cxx_static_address_4266feb573a072f8410ced97.reference = {
    __cReference: true,
    get value() { return MIRROR____header_global_43a78267aacafbe4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:332
export const WATERFOUNTAIN____header_global_82f97bd9cddf82ea = ((((((563) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_032936bf46af9e51b057a090() {
  return __cxx_static_address_032936bf46af9e51b057a090.reference || (__cxx_static_address_032936bf46af9e51b057a090.reference = {
    __cReference: true,
    get value() { return WATERFOUNTAIN____header_global_82f97bd9cddf82ea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:333
export const WATERFOUNTAINBROKE____header_global_1fae1d41ff74ebf4 = ((((((567) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9aad339cacff4809f18c6ae3() {
  return __cxx_static_address_9aad339cacff4809f18c6ae3.reference || (__cxx_static_address_9aad339cacff4809f18c6ae3.reference = {
    __cReference: true,
    get value() { return WATERFOUNTAINBROKE____header_global_1fae1d41ff74ebf4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:334
export const FEMMAG1____header_global_75336c4c3f0706c3 = ((((((568) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_444ff0e66bce37b1978493d9() {
  return __cxx_static_address_444ff0e66bce37b1978493d9.reference || (__cxx_static_address_444ff0e66bce37b1978493d9.reference = {
    __cReference: true,
    get value() { return FEMMAG1____header_global_75336c4c3f0706c3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:335
export const TOILET____header_global_f24a4e527dccb16c = ((((((569) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3ddcddb56b446141bfd4a647() {
  return __cxx_static_address_3ddcddb56b446141bfd4a647.reference || (__cxx_static_address_3ddcddb56b446141bfd4a647.reference = {
    __cReference: true,
    get value() { return TOILET____header_global_f24a4e527dccb16c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:336
export const STALL____header_global_ee2e325d065fa1f4 = ((((((571) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b256704fe29b163a7a569d32() {
  return __cxx_static_address_b256704fe29b163a7a569d32.reference || (__cxx_static_address_b256704fe29b163a7a569d32.reference = {
    __cReference: true,
    get value() { return STALL____header_global_ee2e325d065fa1f4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:337
export const STALLBROKE____header_global_0758ece2c90744ec = ((((((573) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0d566fe395366157b3b3ac0b() {
  return __cxx_static_address_0d566fe395366157b3b3ac0b.reference || (__cxx_static_address_0d566fe395366157b3b3ac0b.reference = {
    __cReference: true,
    get value() { return STALLBROKE____header_global_0758ece2c90744ec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:338
export const FEMMAG2____header_global_e3f4bc57305c96ad = ((((((577) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d8a8c53226a5dd49f3b1b8fa() {
  return __cxx_static_address_d8a8c53226a5dd49f3b1b8fa.reference || (__cxx_static_address_d8a8c53226a5dd49f3b1b8fa.reference = {
    __cReference: true,
    get value() { return FEMMAG2____header_global_e3f4bc57305c96ad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:339
export const REACTOR2____header_global_7c0f2a8b3489ebca = ((((((578) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4ccbe275e23dbd6d4a728a27() {
  return __cxx_static_address_4ccbe275e23dbd6d4a728a27.reference || (__cxx_static_address_4ccbe275e23dbd6d4a728a27.reference = {
    __cReference: true,
    get value() { return REACTOR2____header_global_7c0f2a8b3489ebca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:340
export const REACTOR2BURNT____header_global_56c902de9684c5a7 = ((((((579) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dc9d1cdc295a7455848734c8() {
  return __cxx_static_address_dc9d1cdc295a7455848734c8.reference || (__cxx_static_address_dc9d1cdc295a7455848734c8.reference = {
    __cReference: true,
    get value() { return REACTOR2BURNT____header_global_56c902de9684c5a7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:341
export const REACTOR2SPARK____header_global_fab869202e22c868 = ((((((580) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c2645b33c2dcab480b9cd405() {
  return __cxx_static_address_c2645b33c2dcab480b9cd405.reference || (__cxx_static_address_c2645b33c2dcab480b9cd405.reference = {
    __cReference: true,
    get value() { return REACTOR2SPARK____header_global_fab869202e22c868; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:342
export const GRATE1____header_global_c1b9180626c77227 = ((((((595) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f3afd57291a558d106bb50a2() {
  return __cxx_static_address_f3afd57291a558d106bb50a2.reference || (__cxx_static_address_f3afd57291a558d106bb50a2.reference = {
    __cReference: true,
    get value() { return GRATE1____header_global_c1b9180626c77227; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:343
export const BGRATE1____header_global_19113273e5fff4e7 = ((((((596) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3ea2340863c48be94c084fbe() {
  return __cxx_static_address_3ea2340863c48be94c084fbe.reference || (__cxx_static_address_3ea2340863c48be94c084fbe.reference = {
    __cReference: true,
    get value() { return BGRATE1____header_global_19113273e5fff4e7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:344
export const SOLARPANNEL____header_global_cbb25bda8ef49168 = ((((((602) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a554c5d7988c0074314d6535() {
  return __cxx_static_address_a554c5d7988c0074314d6535.reference || (__cxx_static_address_a554c5d7988c0074314d6535.reference = {
    __cReference: true,
    get value() { return SOLARPANNEL____header_global_cbb25bda8ef49168; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:345
export const NAKED1____header_global_3661ff61ff0ae6d7 = ((((((603) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5ef1cac52497121f486ed154() {
  return __cxx_static_address_5ef1cac52497121f486ed154.reference || (__cxx_static_address_5ef1cac52497121f486ed154.reference = {
    __cReference: true,
    get value() { return NAKED1____header_global_3661ff61ff0ae6d7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:346
export const ANTENNA____header_global_1e9d5fd7c732f77b = ((((((607) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_db9cb2852e5c8940a4f41e66() {
  return __cxx_static_address_db9cb2852e5c8940a4f41e66.reference || (__cxx_static_address_db9cb2852e5c8940a4f41e66.reference = {
    __cReference: true,
    get value() { return ANTENNA____header_global_1e9d5fd7c732f77b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:347
export const MASKWALL12____header_global_29be14e1d50962dc = ((((((609) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d0bcbaeb34c45b3eb3d9ef53() {
  return __cxx_static_address_d0bcbaeb34c45b3eb3d9ef53.reference || (__cxx_static_address_d0bcbaeb34c45b3eb3d9ef53.reference = {
    __cReference: true,
    get value() { return MASKWALL12____header_global_29be14e1d50962dc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:348
export const TOILETBROKE____header_global_1ae4fc546a5f3c5c = ((((((615) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ab03b5c3aec78948370c767c() {
  return __cxx_static_address_ab03b5c3aec78948370c767c.reference || (__cxx_static_address_ab03b5c3aec78948370c767c.reference = {
    __cReference: true,
    get value() { return TOILETBROKE____header_global_1ae4fc546a5f3c5c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:349
export const PIPE2____header_global_e5d10e1642f4254f = ((((((616) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5832e4832241faa8ca33e594() {
  return __cxx_static_address_5832e4832241faa8ca33e594.reference || (__cxx_static_address_5832e4832241faa8ca33e594.reference = {
    __cReference: true,
    get value() { return PIPE2____header_global_e5d10e1642f4254f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:350
export const PIPE1B____header_global_16708957addfa42c = ((((((617) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_260f44a9bf0b1e60c502a315() {
  return __cxx_static_address_260f44a9bf0b1e60c502a315.reference || (__cxx_static_address_260f44a9bf0b1e60c502a315.reference = {
    __cReference: true,
    get value() { return PIPE1B____header_global_16708957addfa42c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:351
export const PIPE3____header_global_34ffab19e4f0e17d = ((((((618) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2d856c87dd7c5d067799e165() {
  return __cxx_static_address_2d856c87dd7c5d067799e165.reference || (__cxx_static_address_2d856c87dd7c5d067799e165.reference = {
    __cReference: true,
    get value() { return PIPE3____header_global_34ffab19e4f0e17d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:352
export const PIPE1____header_global_8e0a7b48aef5305a = ((((((619) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_47435e325d56d136d9350641() {
  return __cxx_static_address_47435e325d56d136d9350641.reference || (__cxx_static_address_47435e325d56d136d9350641.reference = {
    __cReference: true,
    get value() { return PIPE1____header_global_8e0a7b48aef5305a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:353
export const CAMERA1____header_global_fa4c61d0c746ad97 = ((((((621) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_90b156ea8760f7316a082289() {
  return __cxx_static_address_90b156ea8760f7316a082289.reference || (__cxx_static_address_90b156ea8760f7316a082289.reference = {
    __cReference: true,
    get value() { return CAMERA1____header_global_fa4c61d0c746ad97; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:354
export const PIPE2B____header_global_ca15172b670f3703 = ((((((633) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6cde2382ef843517a3377579() {
  return __cxx_static_address_6cde2382ef843517a3377579.reference || (__cxx_static_address_6cde2382ef843517a3377579.reference = {
    __cReference: true,
    get value() { return PIPE2B____header_global_ca15172b670f3703; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:355
export const BOLT1____header_global_c4a4f38cf60e87b7 = ((((((634) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f79dad00c99143d0b7e4e145() {
  return __cxx_static_address_f79dad00c99143d0b7e4e145.reference || (__cxx_static_address_f79dad00c99143d0b7e4e145.reference = {
    __cReference: true,
    get value() { return BOLT1____header_global_c4a4f38cf60e87b7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:356
export const W_NUMBERS____header_global_69129663f0d2ebe6 = ((((((640) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_319ad0fc5d40d89569a63e3d() {
  return __cxx_static_address_319ad0fc5d40d89569a63e3d.reference || (__cxx_static_address_319ad0fc5d40d89569a63e3d.reference = {
    __cReference: true,
    get value() { return W_NUMBERS____header_global_69129663f0d2ebe6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:357
export const WATERDRIP____header_global_70126a3583d47bbd = ((((((660) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_45a0ab5bb8af418e51c986b3() {
  return __cxx_static_address_45a0ab5bb8af418e51c986b3.reference || (__cxx_static_address_45a0ab5bb8af418e51c986b3.reference = {
    __cReference: true,
    get value() { return WATERDRIP____header_global_70126a3583d47bbd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:358
export const WATERBUBBLE____header_global_8517bb3b35a95d7d = ((((((661) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9dbe4e37fcf23d9ba8ba27d0() {
  return __cxx_static_address_9dbe4e37fcf23d9ba8ba27d0.reference || (__cxx_static_address_9dbe4e37fcf23d9ba8ba27d0.reference = {
    __cReference: true,
    get value() { return WATERBUBBLE____header_global_8517bb3b35a95d7d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:359
export const WATERBUBBLEMAKER____header_global_294963b997775d4d = ((((((662) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a3ec051c3754a386219d37af() {
  return __cxx_static_address_a3ec051c3754a386219d37af.reference || (__cxx_static_address_a3ec051c3754a386219d37af.reference = {
    __cReference: true,
    get value() { return WATERBUBBLEMAKER____header_global_294963b997775d4d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:360
export const W_FORCEFIELD____header_global_ce84f9b6b111897e = ((((((663) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0b50fde6ca176ad4e3a61891() {
  return __cxx_static_address_0b50fde6ca176ad4e3a61891.reference || (__cxx_static_address_0b50fde6ca176ad4e3a61891.reference = {
    __cReference: true,
    get value() { return W_FORCEFIELD____header_global_ce84f9b6b111897e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:361
export const VACUUM____header_global_86b7b56b87b4f086 = ((((((669) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_84bb4eae452fbf273e12f2e7() {
  return __cxx_static_address_84bb4eae452fbf273e12f2e7.reference || (__cxx_static_address_84bb4eae452fbf273e12f2e7.reference = {
    __cReference: true,
    get value() { return VACUUM____header_global_86b7b56b87b4f086; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:362
export const FOOTPRINTS2____header_global_32f9ab10629910ad = ((((((672) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a5160911396f726a0948065d() {
  return __cxx_static_address_a5160911396f726a0948065d.reference || (__cxx_static_address_a5160911396f726a0948065d.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS2____header_global_32f9ab10629910ad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:363
export const FOOTPRINTS3____header_global_2a34707ec66ac5a8 = ((((((673) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5c3a90db817e496947e145ca() {
  return __cxx_static_address_5c3a90db817e496947e145ca.reference || (__cxx_static_address_5c3a90db817e496947e145ca.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS3____header_global_2a34707ec66ac5a8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:364
export const FOOTPRINTS4____header_global_8ee264b22e59a2c5 = ((((((674) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c2af46dd124eb9870ace4de0() {
  return __cxx_static_address_c2af46dd124eb9870ace4de0.reference || (__cxx_static_address_c2af46dd124eb9870ace4de0.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS4____header_global_8ee264b22e59a2c5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:365
export const EGG____header_global_684a1472fdb2e2cc = ((((((675) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ebe38e5a229144fa3e303060() {
  return __cxx_static_address_ebe38e5a229144fa3e303060.reference || (__cxx_static_address_ebe38e5a229144fa3e303060.reference = {
    __cReference: true,
    get value() { return EGG____header_global_684a1472fdb2e2cc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:366
export const SCALE____header_global_457468210ece55b4 = ((((((678) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cccaf2320258a7776910b808() {
  return __cxx_static_address_cccaf2320258a7776910b808.reference || (__cxx_static_address_cccaf2320258a7776910b808.reference = {
    __cReference: true,
    get value() { return SCALE____header_global_457468210ece55b4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:367
export const CHAIR3____header_global_741ae03e5b5efa62 = ((((((680) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6182eaa48d1de5680fcd97be() {
  return __cxx_static_address_6182eaa48d1de5680fcd97be.reference || (__cxx_static_address_6182eaa48d1de5680fcd97be.reference = {
    __cReference: true,
    get value() { return CHAIR3____header_global_741ae03e5b5efa62; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:368
export const CAMERALIGHT____header_global_430c8641d2f60d19 = ((((((685) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bb855a590e774d0b6c33303e() {
  return __cxx_static_address_bb855a590e774d0b6c33303e.reference || (__cxx_static_address_bb855a590e774d0b6c33303e.reference = {
    __cReference: true,
    get value() { return CAMERALIGHT____header_global_430c8641d2f60d19; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:369
export const MOVIECAMERA____header_global_397d9fd54cd96fca = ((((((686) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_00278febc47269b554284bfd() {
  return __cxx_static_address_00278febc47269b554284bfd.reference || (__cxx_static_address_00278febc47269b554284bfd.reference = {
    __cReference: true,
    get value() { return MOVIECAMERA____header_global_397d9fd54cd96fca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:370
export const IVUNIT____header_global_4911369f45ca95ea = ((((((689) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0be3ea4269c6bb81a1d5545d() {
  return __cxx_static_address_0be3ea4269c6bb81a1d5545d.reference || (__cxx_static_address_0be3ea4269c6bb81a1d5545d.reference = {
    __cReference: true,
    get value() { return IVUNIT____header_global_4911369f45ca95ea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:371
export const POT1____header_global_ca450aef047d81d1 = ((((((694) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a5eebcc92ab8d9f5a5b23557() {
  return __cxx_static_address_a5eebcc92ab8d9f5a5b23557.reference || (__cxx_static_address_a5eebcc92ab8d9f5a5b23557.reference = {
    __cReference: true,
    get value() { return POT1____header_global_ca450aef047d81d1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:372
export const POT2____header_global_2312e3b32ea20207 = ((((((695) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5e4f50f1b364afe28f7b3b29() {
  return __cxx_static_address_5e4f50f1b364afe28f7b3b29.reference || (__cxx_static_address_5e4f50f1b364afe28f7b3b29.reference = {
    __cReference: true,
    get value() { return POT2____header_global_2312e3b32ea20207; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:373
export const POT3____header_global_d2e455b7ba92ac12 = ((((((697) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_724e307b6a1c99fbecd91400() {
  return __cxx_static_address_724e307b6a1c99fbecd91400.reference || (__cxx_static_address_724e307b6a1c99fbecd91400.reference = {
    __cReference: true,
    get value() { return POT3____header_global_d2e455b7ba92ac12; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:374
export const PIPE3B____header_global_53e952b3e6ae5c74 = ((((((700) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0d0d10e407224cbf63515bf9() {
  return __cxx_static_address_0d0d10e407224cbf63515bf9.reference || (__cxx_static_address_0d0d10e407224cbf63515bf9.reference = {
    __cReference: true,
    get value() { return PIPE3B____header_global_53e952b3e6ae5c74; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:375
export const WALLLIGHT3____header_global_a9ef043a6bb681f4 = ((((((701) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3298116e8a96342e6e4c8446() {
  return __cxx_static_address_3298116e8a96342e6e4c8446.reference || (__cxx_static_address_3298116e8a96342e6e4c8446.reference = {
    __cReference: true,
    get value() { return WALLLIGHT3____header_global_a9ef043a6bb681f4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:376
export const WALLLIGHTBUST3____header_global_8457a45bbbc82489 = ((((((702) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_04889b037223d704db270bfe() {
  return __cxx_static_address_04889b037223d704db270bfe.reference || (__cxx_static_address_04889b037223d704db270bfe.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST3____header_global_8457a45bbbc82489; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:377
export const WALLLIGHT1____header_global_c331fcf8be2e2011 = ((((((703) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5d6ec800151744ec30cdaa3e() {
  return __cxx_static_address_5d6ec800151744ec30cdaa3e.reference || (__cxx_static_address_5d6ec800151744ec30cdaa3e.reference = {
    __cReference: true,
    get value() { return WALLLIGHT1____header_global_c331fcf8be2e2011; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:378
export const WALLLIGHTBUST1____header_global_211a49c0ecc23ab9 = ((((((704) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_600e7924cad201c4a779b4c5() {
  return __cxx_static_address_600e7924cad201c4a779b4c5.reference || (__cxx_static_address_600e7924cad201c4a779b4c5.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST1____header_global_211a49c0ecc23ab9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:379
export const WALLLIGHT2____header_global_be08777d247f2f19 = ((((((705) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ad416f1647e4992bb9bd603d() {
  return __cxx_static_address_ad416f1647e4992bb9bd603d.reference || (__cxx_static_address_ad416f1647e4992bb9bd603d.reference = {
    __cReference: true,
    get value() { return WALLLIGHT2____header_global_be08777d247f2f19; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:380
export const WALLLIGHTBUST2____header_global_bb072870ee1a31cf = ((((((706) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_867a69ca7df219faca82cd4a() {
  return __cxx_static_address_867a69ca7df219faca82cd4a.reference || (__cxx_static_address_867a69ca7df219faca82cd4a.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST2____header_global_bb072870ee1a31cf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:381
export const LIGHTSWITCH2____header_global_75fb316466acd2b8 = ((((((712) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2153e89f369e87b23d9d592b() {
  return __cxx_static_address_2153e89f369e87b23d9d592b.reference || (__cxx_static_address_2153e89f369e87b23d9d592b.reference = {
    __cReference: true,
    get value() { return LIGHTSWITCH2____header_global_75fb316466acd2b8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:382
export const WAITTOBESEATED____header_global_91456181c06e9ed9 = ((((((716) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7f4e7edb1ac6f3b65325549f() {
  return __cxx_static_address_7f4e7edb1ac6f3b65325549f.reference || (__cxx_static_address_7f4e7edb1ac6f3b65325549f.reference = {
    __cReference: true,
    get value() { return WAITTOBESEATED____header_global_91456181c06e9ed9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:383
export const DOORTILE14____header_global_86818512e2de2105 = ((((((717) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_06190dba51b9d27a090bdc06() {
  return __cxx_static_address_06190dba51b9d27a090bdc06.reference || (__cxx_static_address_06190dba51b9d27a090bdc06.reference = {
    __cReference: true,
    get value() { return DOORTILE14____header_global_86818512e2de2105; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:384
export const STATUE____header_global_921a665274513c3b = ((((((753) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a1989c1cab24e2427cce5b30() {
  return __cxx_static_address_a1989c1cab24e2427cce5b30.reference || (__cxx_static_address_a1989c1cab24e2427cce5b30.reference = {
    __cReference: true,
    get value() { return STATUE____header_global_921a665274513c3b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:385
export const MIKE____header_global_6787baa0f098270b = ((((((762) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_68508bc1463f5d8c38bd5128() {
  return __cxx_static_address_68508bc1463f5d8c38bd5128.reference || (__cxx_static_address_68508bc1463f5d8c38bd5128.reference = {
    __cReference: true,
    get value() { return MIKE____header_global_6787baa0f098270b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:386
export const VASE____header_global_b9cf1af24dbaf399 = ((((((765) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b9bc4c2cfa664ce1b459a10f() {
  return __cxx_static_address_b9bc4c2cfa664ce1b459a10f.reference || (__cxx_static_address_b9bc4c2cfa664ce1b459a10f.reference = {
    __cReference: true,
    get value() { return VASE____header_global_b9cf1af24dbaf399; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:387
export const SUSHIPLATE1____header_global_5989a406925be94d = ((((((768) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_75afb4a290e116ec5340f766() {
  return __cxx_static_address_75afb4a290e116ec5340f766.reference || (__cxx_static_address_75afb4a290e116ec5340f766.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE1____header_global_5989a406925be94d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:388
export const SUSHIPLATE2____header_global_55fa13e8f4537e24 = ((((((769) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b66a37db337357ecbb96992f() {
  return __cxx_static_address_b66a37db337357ecbb96992f.reference || (__cxx_static_address_b66a37db337357ecbb96992f.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE2____header_global_55fa13e8f4537e24; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:389
export const SUSHIPLATE3____header_global_8ed387bd6d5117ca = ((((((774) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b19419786d581b2c4a2b45ae() {
  return __cxx_static_address_b19419786d581b2c4a2b45ae.reference || (__cxx_static_address_b19419786d581b2c4a2b45ae.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE3____header_global_8ed387bd6d5117ca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:390
export const SUSHIPLATE4____header_global_3287006f85034463 = ((((((779) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2f24e6c281356a58c7deedba() {
  return __cxx_static_address_2f24e6c281356a58c7deedba.reference || (__cxx_static_address_2f24e6c281356a58c7deedba.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE4____header_global_3287006f85034463; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:391
export const DOORTILE16____header_global_5a241b01e3fb37a1 = ((((((781) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8575aea9d5d758a7490d8714() {
  return __cxx_static_address_8575aea9d5d758a7490d8714.reference || (__cxx_static_address_8575aea9d5d758a7490d8714.reference = {
    __cReference: true,
    get value() { return DOORTILE16____header_global_5a241b01e3fb37a1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:392
export const SUSHIPLATE5____header_global_b0f8f7818968b739 = ((((((792) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7e99d39678ba31d161061e26() {
  return __cxx_static_address_7e99d39678ba31d161061e26.reference || (__cxx_static_address_7e99d39678ba31d161061e26.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE5____header_global_b0f8f7818968b739; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:393
export const OJ____header_global_b20213eca66dcff5 = ((((((806) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_992434cb639c775e14b19194() {
  return __cxx_static_address_992434cb639c775e14b19194.reference || (__cxx_static_address_992434cb639c775e14b19194.reference = {
    __cReference: true,
    get value() { return OJ____header_global_b20213eca66dcff5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:394
export const MASKWALL13____header_global_f40415df9803524c = ((((((830) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bde4c466aef718888806a87c() {
  return __cxx_static_address_bde4c466aef718888806a87c.reference || (__cxx_static_address_bde4c466aef718888806a87c.reference = {
    __cReference: true,
    get value() { return MASKWALL13____header_global_f40415df9803524c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:395
export const HURTRAIL____header_global_74e7a51d38aca8b2 = ((((((859) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d6a2b682004a32a04c3bea48() {
  return __cxx_static_address_d6a2b682004a32a04c3bea48.reference || (__cxx_static_address_d6a2b682004a32a04c3bea48.reference = {
    __cReference: true,
    get value() { return HURTRAIL____header_global_74e7a51d38aca8b2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:396
export const POWERSWITCH1____header_global_7f3470fc8ac8fd45 = ((((((860) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_17e8b8af24b4f66875d84b19() {
  return __cxx_static_address_17e8b8af24b4f66875d84b19.reference || (__cxx_static_address_17e8b8af24b4f66875d84b19.reference = {
    __cReference: true,
    get value() { return POWERSWITCH1____header_global_7f3470fc8ac8fd45; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:397
export const LOCKSWITCH1____header_global_ddbe8f08004dd3ea = ((((((862) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0344c628098b9c2e55aa1f97() {
  return __cxx_static_address_0344c628098b9c2e55aa1f97.reference || (__cxx_static_address_0344c628098b9c2e55aa1f97.reference = {
    __cReference: true,
    get value() { return LOCKSWITCH1____header_global_ddbe8f08004dd3ea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:398
export const POWERSWITCH2____header_global_99f51847e93badf3 = ((((((864) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_74f6df5b442265a9139dd52c() {
  return __cxx_static_address_74f6df5b442265a9139dd52c.reference || (__cxx_static_address_74f6df5b442265a9139dd52c.reference = {
    __cReference: true,
    get value() { return POWERSWITCH2____header_global_99f51847e93badf3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:399
export const ATM____header_global_dc8e1fe7903b8572 = ((((((867) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b3efd609e1a5de3c2cf19067() {
  return __cxx_static_address_b3efd609e1a5de3c2cf19067.reference || (__cxx_static_address_b3efd609e1a5de3c2cf19067.reference = {
    __cReference: true,
    get value() { return ATM____header_global_dc8e1fe7903b8572; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:400
export const STATUEFLASH____header_global_50aadf0d7bdf4b1c = ((((((869) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1fc831abc3b75fe6eb466ff1() {
  return __cxx_static_address_1fc831abc3b75fe6eb466ff1.reference || (__cxx_static_address_1fc831abc3b75fe6eb466ff1.reference = {
    __cReference: true,
    get value() { return STATUEFLASH____header_global_50aadf0d7bdf4b1c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:401
export const ATMBROKE____header_global_60088b860b91f8ba = ((((((888) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cf6a5056f04bc7b951d1ce99() {
  return __cxx_static_address_cf6a5056f04bc7b951d1ce99.reference || (__cxx_static_address_cf6a5056f04bc7b951d1ce99.reference = {
    __cReference: true,
    get value() { return ATMBROKE____header_global_60088b860b91f8ba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:402
export const STRIPEBALL____header_global_d9e0326604155b18 = ((((((901) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8a30b360073a97dd4ed32f74() {
  return __cxx_static_address_8a30b360073a97dd4ed32f74.reference || (__cxx_static_address_8a30b360073a97dd4ed32f74.reference = {
    __cReference: true,
    get value() { return STRIPEBALL____header_global_d9e0326604155b18; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:403
export const QUEBALL____header_global_50726802c702fa5f = ((((((902) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_deaa0b03a383f6272290ffac() {
  return __cxx_static_address_deaa0b03a383f6272290ffac.reference || (__cxx_static_address_deaa0b03a383f6272290ffac.reference = {
    __cReference: true,
    get value() { return QUEBALL____header_global_50726802c702fa5f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:404
export const POCKET____header_global_70445bee74f19ae5 = ((((((903) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e5ba5dee2702c0f501cd17a3() {
  return __cxx_static_address_e5ba5dee2702c0f501cd17a3.reference || (__cxx_static_address_e5ba5dee2702c0f501cd17a3.reference = {
    __cReference: true,
    get value() { return POCKET____header_global_70445bee74f19ae5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:405
export const WOODENHORSE____header_global_5c4730c3b57f1958 = ((((((904) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c5da78cb07a781c4e0b3cac7() {
  return __cxx_static_address_c5da78cb07a781c4e0b3cac7.reference || (__cxx_static_address_c5da78cb07a781c4e0b3cac7.reference = {
    __cReference: true,
    get value() { return WOODENHORSE____header_global_5c4730c3b57f1958; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:406
export const TREE1____header_global_a5d7643ae8f7d514 = ((((((908) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3a6ca80999001895244562a1() {
  return __cxx_static_address_3a6ca80999001895244562a1.reference || (__cxx_static_address_3a6ca80999001895244562a1.reference = {
    __cReference: true,
    get value() { return TREE1____header_global_a5d7643ae8f7d514; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:407
export const TREE2____header_global_3c89a23d1d99aaf9 = ((((((910) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7536308c531c29712c3929ff() {
  return __cxx_static_address_7536308c531c29712c3929ff.reference || (__cxx_static_address_7536308c531c29712c3929ff.reference = {
    __cReference: true,
    get value() { return TREE2____header_global_3c89a23d1d99aaf9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:408
export const CACTUS____header_global_b6092f3ab91709df = ((((((911) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_33c895768922bcdcee692759() {
  return __cxx_static_address_33c895768922bcdcee692759.reference || (__cxx_static_address_33c895768922bcdcee692759.reference = {
    __cReference: true,
    get value() { return CACTUS____header_global_b6092f3ab91709df; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:409
export const MASKWALL2____header_global_96c8268cff3c1acd = ((((((913) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_00c0e2837e4f502c8af0ce51() {
  return __cxx_static_address_00c0e2837e4f502c8af0ce51.reference || (__cxx_static_address_00c0e2837e4f502c8af0ce51.reference = {
    __cReference: true,
    get value() { return MASKWALL2____header_global_96c8268cff3c1acd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:410
export const MASKWALL3____header_global_df4b0271811e95c4 = ((((((914) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9d0b61b114cc99de4df5f9bd() {
  return __cxx_static_address_9d0b61b114cc99de4df5f9bd.reference || (__cxx_static_address_9d0b61b114cc99de4df5f9bd.reference = {
    __cReference: true,
    get value() { return MASKWALL3____header_global_df4b0271811e95c4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:411
export const MASKWALL4____header_global_f3996e86596eef7d = ((((((915) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b87b7bc112965d84f4d47a1a() {
  return __cxx_static_address_b87b7bc112965d84f4d47a1a.reference || (__cxx_static_address_b87b7bc112965d84f4d47a1a.reference = {
    __cReference: true,
    get value() { return MASKWALL4____header_global_f3996e86596eef7d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:412
export const FIREEXT____header_global_82b27d67ffc3dfd6 = ((((((916) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_46819b999fc14b9745692f56() {
  return __cxx_static_address_46819b999fc14b9745692f56.reference || (__cxx_static_address_46819b999fc14b9745692f56.reference = {
    __cReference: true,
    get value() { return FIREEXT____header_global_82b27d67ffc3dfd6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:413
export const TOILETWATER____header_global_497f9a3bde837d5f = ((((((921) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dc669157d16334d15de635ac() {
  return __cxx_static_address_dc669157d16334d15de635ac.reference || (__cxx_static_address_dc669157d16334d15de635ac.reference = {
    __cReference: true,
    get value() { return TOILETWATER____header_global_497f9a3bde837d5f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:414
export const NEON1____header_global_97e870e44ce156c5 = ((((((925) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ee15ba7a2c7baf0b1812d406() {
  return __cxx_static_address_ee15ba7a2c7baf0b1812d406.reference || (__cxx_static_address_ee15ba7a2c7baf0b1812d406.reference = {
    __cReference: true,
    get value() { return NEON1____header_global_97e870e44ce156c5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:415
export const NEON2____header_global_43d83506f655e417 = ((((((926) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_120ee8b4dd71f86af4cd51fd() {
  return __cxx_static_address_120ee8b4dd71f86af4cd51fd.reference || (__cxx_static_address_120ee8b4dd71f86af4cd51fd.reference = {
    __cReference: true,
    get value() { return NEON2____header_global_43d83506f655e417; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:416
export const CACTUSBROKE____header_global_bafb2aeef013b6be = ((((((939) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9cceaf6fcb54a6eb5584a8cc() {
  return __cxx_static_address_9cceaf6fcb54a6eb5584a8cc.reference || (__cxx_static_address_9cceaf6fcb54a6eb5584a8cc.reference = {
    __cReference: true,
    get value() { return CACTUSBROKE____header_global_bafb2aeef013b6be; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:417
export const BOUNCEMINE____header_global_194fcc028ca81bc9 = ((((((940) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e2e3884c070cd77d1f36cd52() {
  return __cxx_static_address_e2e3884c070cd77d1f36cd52.reference || (__cxx_static_address_e2e3884c070cd77d1f36cd52.reference = {
    __cReference: true,
    get value() { return BOUNCEMINE____header_global_194fcc028ca81bc9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:418
export const BROKEFIREHYDRENT____header_global_5c55e699acb06b0f = ((((((950) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4f53caa27c6d07f24d691d06() {
  return __cxx_static_address_4f53caa27c6d07f24d691d06.reference || (__cxx_static_address_4f53caa27c6d07f24d691d06.reference = {
    __cReference: true,
    get value() { return BROKEFIREHYDRENT____header_global_5c55e699acb06b0f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:419
export const BOX____header_global_e648c3c035f632de = ((((((951) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_79f82d65fbfd8ca419c19ad3() {
  return __cxx_static_address_79f82d65fbfd8ca419c19ad3.reference || (__cxx_static_address_79f82d65fbfd8ca419c19ad3.reference = {
    __cReference: true,
    get value() { return BOX____header_global_e648c3c035f632de; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:420
export const BULLETHOLE____header_global_eb98ec4981f8f310 = ((((((952) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_782ed6167ab93ac3d47aff05() {
  return __cxx_static_address_782ed6167ab93ac3d47aff05.reference || (__cxx_static_address_782ed6167ab93ac3d47aff05.reference = {
    __cReference: true,
    get value() { return BULLETHOLE____header_global_eb98ec4981f8f310; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:421
export const BOTTLE1____header_global_708e8321803d2b81 = ((((((954) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9b986f058dc84646cd863c41() {
  return __cxx_static_address_9b986f058dc84646cd863c41.reference || (__cxx_static_address_9b986f058dc84646cd863c41.reference = {
    __cReference: true,
    get value() { return BOTTLE1____header_global_708e8321803d2b81; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:422
export const BOTTLE2____header_global_8deaca8ecc596379 = ((((((955) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ff5b300da4d1d94bd8eca33f() {
  return __cxx_static_address_ff5b300da4d1d94bd8eca33f.reference || (__cxx_static_address_ff5b300da4d1d94bd8eca33f.reference = {
    __cReference: true,
    get value() { return BOTTLE2____header_global_8deaca8ecc596379; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:423
export const BOTTLE3____header_global_52c576d086a4778e = ((((((956) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_64a5f1c21b758e6bdc7f19b4() {
  return __cxx_static_address_64a5f1c21b758e6bdc7f19b4.reference || (__cxx_static_address_64a5f1c21b758e6bdc7f19b4.reference = {
    __cReference: true,
    get value() { return BOTTLE3____header_global_52c576d086a4778e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:424
export const BOTTLE4____header_global_7d5c442a54ce4e8e = ((((((957) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e038f4c267b4c1156ff43967() {
  return __cxx_static_address_e038f4c267b4c1156ff43967.reference || (__cxx_static_address_e038f4c267b4c1156ff43967.reference = {
    __cReference: true,
    get value() { return BOTTLE4____header_global_7d5c442a54ce4e8e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:425
export const FEMPIC5____header_global_4b9b81180494dc18 = ((((((963) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_427953c606c69cb957688792() {
  return __cxx_static_address_427953c606c69cb957688792.reference || (__cxx_static_address_427953c606c69cb957688792.reference = {
    __cReference: true,
    get value() { return FEMPIC5____header_global_4b9b81180494dc18; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:426
export const FEMPIC6____header_global_56bbc29002714e92 = ((((((964) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f1d23470e15b71f4240f067a() {
  return __cxx_static_address_f1d23470e15b71f4240f067a.reference || (__cxx_static_address_f1d23470e15b71f4240f067a.reference = {
    __cReference: true,
    get value() { return FEMPIC6____header_global_56bbc29002714e92; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:427
export const FEMPIC7____header_global_703b730890361b83 = ((((((965) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9793fb1ae8654d35d16c5e1d() {
  return __cxx_static_address_9793fb1ae8654d35d16c5e1d.reference || (__cxx_static_address_9793fb1ae8654d35d16c5e1d.reference = {
    __cReference: true,
    get value() { return FEMPIC7____header_global_703b730890361b83; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:428
export const HYDROPLANT____header_global_cc103357888bee5e = ((((((969) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d4c640ed959185a9d0ef9e65() {
  return __cxx_static_address_d4c640ed959185a9d0ef9e65.reference || (__cxx_static_address_d4c640ed959185a9d0ef9e65.reference = {
    __cReference: true,
    get value() { return HYDROPLANT____header_global_cc103357888bee5e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:429
export const OCEANSPRITE1____header_global_dc7dd41cb7672d3c = ((((((971) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_92cab6998e245157ca1edd86() {
  return __cxx_static_address_92cab6998e245157ca1edd86.reference || (__cxx_static_address_92cab6998e245157ca1edd86.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE1____header_global_dc7dd41cb7672d3c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:430
export const OCEANSPRITE2____header_global_e181fde5dc9fd4aa = ((((((972) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7786ab1894980c70abac6d97() {
  return __cxx_static_address_7786ab1894980c70abac6d97.reference || (__cxx_static_address_7786ab1894980c70abac6d97.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE2____header_global_e181fde5dc9fd4aa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:431
export const OCEANSPRITE3____header_global_49b9ed3f9b95ef4e = ((((((973) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5fd7fc2485bb9c3362bce1bd() {
  return __cxx_static_address_5fd7fc2485bb9c3362bce1bd.reference || (__cxx_static_address_5fd7fc2485bb9c3362bce1bd.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE3____header_global_49b9ed3f9b95ef4e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:432
export const OCEANSPRITE4____header_global_22b6b75e62bbb893 = ((((((974) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a5163146d2119410f5ad3422() {
  return __cxx_static_address_a5163146d2119410f5ad3422.reference || (__cxx_static_address_a5163146d2119410f5ad3422.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE4____header_global_22b6b75e62bbb893; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:433
export const OCEANSPRITE5____header_global_0e5bf4322de8bfcd = ((((((975) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d4603c485b953ce4ec78a76e() {
  return __cxx_static_address_d4603c485b953ce4ec78a76e.reference || (__cxx_static_address_d4603c485b953ce4ec78a76e.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE5____header_global_0e5bf4322de8bfcd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:434
export const GENERICPOLE____header_global_f93654b5ea7cdaae = ((((((977) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_00c29a5c3ce50ba403078fdc() {
  return __cxx_static_address_00c29a5c3ce50ba403078fdc.reference || (__cxx_static_address_00c29a5c3ce50ba403078fdc.reference = {
    __cReference: true,
    get value() { return GENERICPOLE____header_global_f93654b5ea7cdaae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:435
export const CONE____header_global_4ee472a87631ff8f = ((((((978) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_94281ba85dc482fe5b1868a3() {
  return __cxx_static_address_94281ba85dc482fe5b1868a3.reference || (__cxx_static_address_94281ba85dc482fe5b1868a3.reference = {
    __cReference: true,
    get value() { return CONE____header_global_4ee472a87631ff8f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:436
export const HANGLIGHT____header_global_4597cce6f51670f1 = ((((((979) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0cd23ef7ad062b7855a04f5f() {
  return __cxx_static_address_0cd23ef7ad062b7855a04f5f.reference || (__cxx_static_address_0cd23ef7ad062b7855a04f5f.reference = {
    __cReference: true,
    get value() { return HANGLIGHT____header_global_4597cce6f51670f1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:437
export const HYDRENT____header_global_4567f8f767fe6247 = ((((((981) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4c9c14d386c03c556068a47f() {
  return __cxx_static_address_4c9c14d386c03c556068a47f.reference || (__cxx_static_address_4c9c14d386c03c556068a47f.reference = {
    __cReference: true,
    get value() { return HYDRENT____header_global_4567f8f767fe6247; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:438
export const MASKWALL14____header_global_613194661e3b40c4 = ((((((988) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_07eea8e9c2ad7661f2812634() {
  return __cxx_static_address_07eea8e9c2ad7661f2812634.reference || (__cxx_static_address_07eea8e9c2ad7661f2812634.reference = {
    __cReference: true,
    get value() { return MASKWALL14____header_global_613194661e3b40c4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:439
export const TIRE____header_global_00c5c8ccc1f9fd3a = ((((((990) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_37ee5385f4d0c93301b48885() {
  return __cxx_static_address_37ee5385f4d0c93301b48885.reference || (__cxx_static_address_37ee5385f4d0c93301b48885.reference = {
    __cReference: true,
    get value() { return TIRE____header_global_00c5c8ccc1f9fd3a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:440
export const PIPE5____header_global_8f7f53cbbfc4c8e3 = ((((((994) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_13ba0fd8fd960549f6df2a6d() {
  return __cxx_static_address_13ba0fd8fd960549f6df2a6d.reference || (__cxx_static_address_13ba0fd8fd960549f6df2a6d.reference = {
    __cReference: true,
    get value() { return PIPE5____header_global_8f7f53cbbfc4c8e3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:441
export const PIPE6____header_global_ae9b15c751c631c9 = ((((((995) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c52d0b8e0c0e3ddf51746286() {
  return __cxx_static_address_c52d0b8e0c0e3ddf51746286.reference || (__cxx_static_address_c52d0b8e0c0e3ddf51746286.reference = {
    __cReference: true,
    get value() { return PIPE6____header_global_ae9b15c751c631c9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:442
export const PIPE4____header_global_adec71d564473ffe = ((((((996) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eb9f52dcf5770fa697bede0d() {
  return __cxx_static_address_eb9f52dcf5770fa697bede0d.reference || (__cxx_static_address_eb9f52dcf5770fa697bede0d.reference = {
    __cReference: true,
    get value() { return PIPE4____header_global_adec71d564473ffe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:443
export const PIPE4B____header_global_5e097d7fe200871d = ((((((997) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f212bada0fc55d6854742103() {
  return __cxx_static_address_f212bada0fc55d6854742103.reference || (__cxx_static_address_f212bada0fc55d6854742103.reference = {
    __cReference: true,
    get value() { return PIPE4B____header_global_5e097d7fe200871d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:444
export const BROKEHYDROPLANT____header_global_e2d042996a9eece4 = ((((((1003) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_db788a8c14d60b0ddcc9859b() {
  return __cxx_static_address_db788a8c14d60b0ddcc9859b.reference || (__cxx_static_address_db788a8c14d60b0ddcc9859b.reference = {
    __cReference: true,
    get value() { return BROKEHYDROPLANT____header_global_e2d042996a9eece4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:445
export const PIPE5B____header_global_0abb74677ae338a4 = ((((((1005) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6e2ce8695d30d4007f5fb758() {
  return __cxx_static_address_6e2ce8695d30d4007f5fb758.reference || (__cxx_static_address_6e2ce8695d30d4007f5fb758.reference = {
    __cReference: true,
    get value() { return PIPE5B____header_global_0abb74677ae338a4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:446
export const NEON3____header_global_ed7d3a8c32c1c348 = ((((((1007) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ffd47e08f60202ef899c9094() {
  return __cxx_static_address_ffd47e08f60202ef899c9094.reference || (__cxx_static_address_ffd47e08f60202ef899c9094.reference = {
    __cReference: true,
    get value() { return NEON3____header_global_ed7d3a8c32c1c348; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:447
export const NEON4____header_global_b24b0f4383e38e19 = ((((((1008) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cd5b5ffecf5f3870b919fc43() {
  return __cxx_static_address_cd5b5ffecf5f3870b919fc43.reference || (__cxx_static_address_cd5b5ffecf5f3870b919fc43.reference = {
    __cReference: true,
    get value() { return NEON4____header_global_b24b0f4383e38e19; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:448
export const NEON5____header_global_3c7716b4efa25634 = ((((((1009) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_54e3e6f610d240d48213040e() {
  return __cxx_static_address_54e3e6f610d240d48213040e.reference || (__cxx_static_address_54e3e6f610d240d48213040e.reference = {
    __cReference: true,
    get value() { return NEON5____header_global_3c7716b4efa25634; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:449
export const BOTTLE5____header_global_1dd254d705c9b25e = ((((((1012) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_28410dc7d6a29a56c5f6fb5d() {
  return __cxx_static_address_28410dc7d6a29a56c5f6fb5d.reference || (__cxx_static_address_28410dc7d6a29a56c5f6fb5d.reference = {
    __cReference: true,
    get value() { return BOTTLE5____header_global_1dd254d705c9b25e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:450
export const BOTTLE6____header_global_b70b71f87376d357 = ((((((1013) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b1f0076fd8b12c44c450c842() {
  return __cxx_static_address_b1f0076fd8b12c44c450c842.reference || (__cxx_static_address_b1f0076fd8b12c44c450c842.reference = {
    __cReference: true,
    get value() { return BOTTLE6____header_global_b70b71f87376d357; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:451
export const BOTTLE8____header_global_32cfffab6f8709ad = ((((((1014) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_42cb96719b2893da84dd752f() {
  return __cxx_static_address_42cb96719b2893da84dd752f.reference || (__cxx_static_address_42cb96719b2893da84dd752f.reference = {
    __cReference: true,
    get value() { return BOTTLE8____header_global_32cfffab6f8709ad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:452
export const SPOTLITE____header_global_a159c154b2de07bd = ((((((1020) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c0422ddacb62b4b3f9cfc929() {
  return __cxx_static_address_c0422ddacb62b4b3f9cfc929.reference || (__cxx_static_address_c0422ddacb62b4b3f9cfc929.reference = {
    __cReference: true,
    get value() { return SPOTLITE____header_global_a159c154b2de07bd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:453
export const MASKWALL15____header_global_8b87f7afe7e2e54e = ((((((1024) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2cbed07fdc208740802d9649() {
  return __cxx_static_address_2cbed07fdc208740802d9649.reference || (__cxx_static_address_2cbed07fdc208740802d9649.reference = {
    __cReference: true,
    get value() { return MASKWALL15____header_global_8b87f7afe7e2e54e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:454
export const BOTTLE7____header_global_e55c0f772137dee8 = ((((((1025) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_45c6061d313550f3cd6579cc() {
  return __cxx_static_address_45c6061d313550f3cd6579cc.reference || (__cxx_static_address_45c6061d313550f3cd6579cc.reference = {
    __cReference: true,
    get value() { return BOTTLE7____header_global_e55c0f772137dee8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:455
export const HORSEONSIDE____header_global_f5640156846cebf8 = ((((((1026) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_96f97b8be957acd478fb0b88() {
  return __cxx_static_address_96f97b8be957acd478fb0b88.reference || (__cxx_static_address_96f97b8be957acd478fb0b88.reference = {
    __cReference: true,
    get value() { return HORSEONSIDE____header_global_f5640156846cebf8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:456
export const GLASSPIECES____header_global_22efe2b8d817fee5 = ((((((1031) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5332c78e3746f525c7e04aa6() {
  return __cxx_static_address_5332c78e3746f525c7e04aa6.reference || (__cxx_static_address_5332c78e3746f525c7e04aa6.reference = {
    __cReference: true,
    get value() { return GLASSPIECES____header_global_22efe2b8d817fee5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:457
export const NEON6____header_global_ddddc973bac44d1b = ((((((1046) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_af8d76d91736860810807cd0() {
  return __cxx_static_address_af8d76d91736860810807cd0.reference || (__cxx_static_address_af8d76d91736860810807cd0.reference = {
    __cReference: true,
    get value() { return NEON6____header_global_ddddc973bac44d1b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:458
export const MASKWALL6____header_global_d064af92fbea9f39 = ((((((1059) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_72da34c3c4cc39221aa4e59f() {
  return __cxx_static_address_72da34c3c4cc39221aa4e59f.reference || (__cxx_static_address_72da34c3c4cc39221aa4e59f.reference = {
    __cReference: true,
    get value() { return MASKWALL6____header_global_d064af92fbea9f39; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:459
export const RUBBERCAN____header_global_271628b7b2ea1da1 = ((((((1062) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eb4d64eae5d8a2d852797bd3() {
  return __cxx_static_address_eb4d64eae5d8a2d852797bd3.reference || (__cxx_static_address_eb4d64eae5d8a2d852797bd3.reference = {
    __cReference: true,
    get value() { return RUBBERCAN____header_global_271628b7b2ea1da1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:460
export const PLUG____header_global_c78e57cffead7529 = ((((((1069) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c6d8751d2722716dcf35e8be() {
  return __cxx_static_address_c6d8751d2722716dcf35e8be.reference || (__cxx_static_address_c6d8751d2722716dcf35e8be.reference = {
    __cReference: true,
    get value() { return PLUG____header_global_c78e57cffead7529; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:461
export const OOZFILTER____header_global_3eb1d1730f40c76d = ((((((1079) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_279184f0a5afa2b061b50efb() {
  return __cxx_static_address_279184f0a5afa2b061b50efb.reference || (__cxx_static_address_279184f0a5afa2b061b50efb.reference = {
    __cReference: true,
    get value() { return OOZFILTER____header_global_3eb1d1730f40c76d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:462
export const FLOORPLASMA____header_global_1a47b87d8d755504 = ((((((1082) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cb9b8363fe82b7599596be9c() {
  return __cxx_static_address_cb9b8363fe82b7599596be9c.reference || (__cxx_static_address_cb9b8363fe82b7599596be9c.reference = {
    __cReference: true,
    get value() { return FLOORPLASMA____header_global_1a47b87d8d755504; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:463
export const REACTOR____header_global_acb026429a921947 = ((((((1088) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bad32d2678a32def2425b2de() {
  return __cxx_static_address_bad32d2678a32def2425b2de.reference || (__cxx_static_address_bad32d2678a32def2425b2de.reference = {
    __cReference: true,
    get value() { return REACTOR____header_global_acb026429a921947; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:464
export const REACTORSPARK____header_global_800f382b9d58aeed = ((((((1092) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0d9b0ec81fdf8b0146642ba3() {
  return __cxx_static_address_0d9b0ec81fdf8b0146642ba3.reference || (__cxx_static_address_0d9b0ec81fdf8b0146642ba3.reference = {
    __cReference: true,
    get value() { return REACTORSPARK____header_global_800f382b9d58aeed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:465
export const REACTORBURNT____header_global_2ac73c71bbd7ac12 = ((((((1096) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_672d6b8b24f31cb2c27e3895() {
  return __cxx_static_address_672d6b8b24f31cb2c27e3895.reference || (__cxx_static_address_672d6b8b24f31cb2c27e3895.reference = {
    __cReference: true,
    get value() { return REACTORBURNT____header_global_2ac73c71bbd7ac12; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:466
export const DOORTILE15____header_global_8315bb8999003e6d = ((((((1102) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d7916d91e793d7a3a7dd5f6d() {
  return __cxx_static_address_d7916d91e793d7a3a7dd5f6d.reference || (__cxx_static_address_d7916d91e793d7a3a7dd5f6d.reference = {
    __cReference: true,
    get value() { return DOORTILE15____header_global_8315bb8999003e6d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:467
export const HANDSWITCH____header_global_6c75b1a5ce4ccfa5 = ((((((1111) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5e1636721d8454abca351443() {
  return __cxx_static_address_5e1636721d8454abca351443.reference || (__cxx_static_address_5e1636721d8454abca351443.reference = {
    __cReference: true,
    get value() { return HANDSWITCH____header_global_6c75b1a5ce4ccfa5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:468
export const CIRCLEPANNEL____header_global_3f3250882895a89e = ((((((1113) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cff870a3e8aa895d1258a4e0() {
  return __cxx_static_address_cff870a3e8aa895d1258a4e0.reference || (__cxx_static_address_cff870a3e8aa895d1258a4e0.reference = {
    __cReference: true,
    get value() { return CIRCLEPANNEL____header_global_3f3250882895a89e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:469
export const CIRCLEPANNELBROKE____header_global_4da04eca3174c6f4 = ((((((1114) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0590b15b98c669a8fe394783() {
  return __cxx_static_address_0590b15b98c669a8fe394783.reference || (__cxx_static_address_0590b15b98c669a8fe394783.reference = {
    __cReference: true,
    get value() { return CIRCLEPANNELBROKE____header_global_4da04eca3174c6f4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:470
export const PULLSWITCH____header_global_bbfb5fffb3ea6843 = ((((((1122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_374f5550793ca079fb4c759a() {
  return __cxx_static_address_374f5550793ca079fb4c759a.reference || (__cxx_static_address_374f5550793ca079fb4c759a.reference = {
    __cReference: true,
    get value() { return PULLSWITCH____header_global_bbfb5fffb3ea6843; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:471
export const MASKWALL8____header_global_106048b20d5490ea = ((((((1124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_da9cccd378ddb367f8fbaa69() {
  return __cxx_static_address_da9cccd378ddb367f8fbaa69.reference || (__cxx_static_address_da9cccd378ddb367f8fbaa69.reference = {
    __cReference: true,
    get value() { return MASKWALL8____header_global_106048b20d5490ea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:472
export const BIGHOLE____header_global_870625783f35c108 = ((((((1141) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e1a1ba6c0b494222fdc6c6ba() {
  return __cxx_static_address_e1a1ba6c0b494222fdc6c6ba.reference || (__cxx_static_address_e1a1ba6c0b494222fdc6c6ba.reference = {
    __cReference: true,
    get value() { return BIGHOLE____header_global_870625783f35c108; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:473
export const ALIENSWITCH____header_global_3d23f236581e256f = ((((((1142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9797e03dd9bc68e38c76bec7() {
  return __cxx_static_address_9797e03dd9bc68e38c76bec7.reference || (__cxx_static_address_9797e03dd9bc68e38c76bec7.reference = {
    __cReference: true,
    get value() { return ALIENSWITCH____header_global_3d23f236581e256f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:474
export const DOORTILE21____header_global_25e3e6b7379d0749 = ((((((1144) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e988711058b2e759928c80a() {
  return __cxx_static_address_1e988711058b2e759928c80a.reference || (__cxx_static_address_1e988711058b2e759928c80a.reference = {
    __cReference: true,
    get value() { return DOORTILE21____header_global_25e3e6b7379d0749; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:475
export const HANDPRINTSWITCH____header_global_bba2e8732e439587 = ((((((1155) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_280a7f17b2acc68292a04fc1() {
  return __cxx_static_address_280a7f17b2acc68292a04fc1.reference || (__cxx_static_address_280a7f17b2acc68292a04fc1.reference = {
    __cReference: true,
    get value() { return HANDPRINTSWITCH____header_global_bba2e8732e439587; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:476
export const BOTTLE10____header_global_a1be8c779e70e32f = ((((((1157) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3aaf8f2a4ab6814f848dad2a() {
  return __cxx_static_address_3aaf8f2a4ab6814f848dad2a.reference || (__cxx_static_address_3aaf8f2a4ab6814f848dad2a.reference = {
    __cReference: true,
    get value() { return BOTTLE10____header_global_a1be8c779e70e32f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:477
export const BOTTLE11____header_global_a1646e8ace32f00c = ((((((1158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bf6397d43792e1d39b11f14b() {
  return __cxx_static_address_bf6397d43792e1d39b11f14b.reference || (__cxx_static_address_bf6397d43792e1d39b11f14b.reference = {
    __cReference: true,
    get value() { return BOTTLE11____header_global_a1646e8ace32f00c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:478
export const BOTTLE12____header_global_b7a1b42f08203679 = ((((((1159) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7ad3ad176c16f4494070bb54() {
  return __cxx_static_address_7ad3ad176c16f4494070bb54.reference || (__cxx_static_address_7ad3ad176c16f4494070bb54.reference = {
    __cReference: true,
    get value() { return BOTTLE12____header_global_b7a1b42f08203679; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:479
export const BOTTLE13____header_global_f82a6ac7d629f6a4 = ((((((1160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_01e52e505a1b462ac24efb0f() {
  return __cxx_static_address_01e52e505a1b462ac24efb0f.reference || (__cxx_static_address_01e52e505a1b462ac24efb0f.reference = {
    __cReference: true,
    get value() { return BOTTLE13____header_global_f82a6ac7d629f6a4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:480
export const BOTTLE14____header_global_46628d95f8a68e32 = ((((((1161) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4084a4c725eea13412114301() {
  return __cxx_static_address_4084a4c725eea13412114301.reference || (__cxx_static_address_4084a4c725eea13412114301.reference = {
    __cReference: true,
    get value() { return BOTTLE14____header_global_46628d95f8a68e32; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:481
export const BOTTLE15____header_global_8afef42d142717dd = ((((((1162) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_40ab12c79a8b2611322178bc() {
  return __cxx_static_address_40ab12c79a8b2611322178bc.reference || (__cxx_static_address_40ab12c79a8b2611322178bc.reference = {
    __cReference: true,
    get value() { return BOTTLE15____header_global_8afef42d142717dd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:482
export const BOTTLE16____header_global_81a546baafad5833 = ((((((1163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_27f01d25eed9e6f53e3d4fca() {
  return __cxx_static_address_27f01d25eed9e6f53e3d4fca.reference || (__cxx_static_address_27f01d25eed9e6f53e3d4fca.reference = {
    __cReference: true,
    get value() { return BOTTLE16____header_global_81a546baafad5833; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:483
export const BOTTLE17____header_global_2bab138453e1418e = ((((((1164) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_14019c718d0c316fec5618b4() {
  return __cxx_static_address_14019c718d0c316fec5618b4.reference || (__cxx_static_address_14019c718d0c316fec5618b4.reference = {
    __cReference: true,
    get value() { return BOTTLE17____header_global_2bab138453e1418e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:484
export const BOTTLE18____header_global_6964de26f8a27f9b = ((((((1165) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9a14033dad03650e1de0c814() {
  return __cxx_static_address_9a14033dad03650e1de0c814.reference || (__cxx_static_address_9a14033dad03650e1de0c814.reference = {
    __cReference: true,
    get value() { return BOTTLE18____header_global_6964de26f8a27f9b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:485
export const BOTTLE19____header_global_19a824bdac23a4d9 = ((((((1166) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e75aafd4e8c35914791d1989() {
  return __cxx_static_address_e75aafd4e8c35914791d1989.reference || (__cxx_static_address_e75aafd4e8c35914791d1989.reference = {
    __cReference: true,
    get value() { return BOTTLE19____header_global_19a824bdac23a4d9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:486
export const DOORTILE17____header_global_11ea9bc162405e36 = ((((((1169) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3ad89350632e17db9769bb6a() {
  return __cxx_static_address_3ad89350632e17db9769bb6a.reference || (__cxx_static_address_3ad89350632e17db9769bb6a.reference = {
    __cReference: true,
    get value() { return DOORTILE17____header_global_11ea9bc162405e36; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:487
export const MASKWALL7____header_global_d4b698e04210b69f = ((((((1174) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_31cbeb506a990e19f7cb3a1d() {
  return __cxx_static_address_31cbeb506a990e19f7cb3a1d.reference || (__cxx_static_address_31cbeb506a990e19f7cb3a1d.reference = {
    __cReference: true,
    get value() { return MASKWALL7____header_global_d4b698e04210b69f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:488
export const DOORTILE11____header_global_0ea834ca1f790d29 = ((((((1178) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c8c59286593419eae3615a73() {
  return __cxx_static_address_c8c59286593419eae3615a73.reference || (__cxx_static_address_c8c59286593419eae3615a73.reference = {
    __cReference: true,
    get value() { return DOORTILE11____header_global_0ea834ca1f790d29; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:489
export const DOORTILE12____header_global_4cfbf524af8eabbb = ((((((1179) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a0af3f9f28b04d8229681ee8() {
  return __cxx_static_address_a0af3f9f28b04d8229681ee8.reference || (__cxx_static_address_a0af3f9f28b04d8229681ee8.reference = {
    __cReference: true,
    get value() { return DOORTILE12____header_global_4cfbf524af8eabbb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:490
export const VENDMACHINE____header_global_c3fdc3846e55ff56 = ((((((1212) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_93465e041c7ab9d3a471d271() {
  return __cxx_static_address_93465e041c7ab9d3a471d271.reference || (__cxx_static_address_93465e041c7ab9d3a471d271.reference = {
    __cReference: true,
    get value() { return VENDMACHINE____header_global_c3fdc3846e55ff56; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:491
export const COLAMACHINE____header_global_b2b92d35b8e3878d = ((((((1215) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_41dbfc2b2da9cda85d927afb() {
  return __cxx_static_address_41dbfc2b2da9cda85d927afb.reference || (__cxx_static_address_41dbfc2b2da9cda85d927afb.reference = {
    __cReference: true,
    get value() { return COLAMACHINE____header_global_b2b92d35b8e3878d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:492
export const CRANEPOLE____header_global_b36c0bae918fb1a7 = ((((((1221) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0b16fd7ea4d2a512a4480da0() {
  return __cxx_static_address_0b16fd7ea4d2a512a4480da0.reference || (__cxx_static_address_0b16fd7ea4d2a512a4480da0.reference = {
    __cReference: true,
    get value() { return CRANEPOLE____header_global_b36c0bae918fb1a7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:493
export const CRANE____header_global_5bc730bd8ffa7518 = ((((((1222) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_98cf7f4d84001de1cee2fe6d() {
  return __cxx_static_address_98cf7f4d84001de1cee2fe6d.reference || (__cxx_static_address_98cf7f4d84001de1cee2fe6d.reference = {
    __cReference: true,
    get value() { return CRANE____header_global_5bc730bd8ffa7518; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:494
export const BARBROKE____header_global_759db87c2a82b8c6 = ((((((1225) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b19ddf44c28465280d8c9fd1() {
  return __cxx_static_address_b19ddf44c28465280d8c9fd1.reference || (__cxx_static_address_b19ddf44c28465280d8c9fd1.reference = {
    __cReference: true,
    get value() { return BARBROKE____header_global_759db87c2a82b8c6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:495
export const BLOODPOOL____header_global_df7e497207a1289b = ((((((1226) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_097321216113fd98cacfbd46() {
  return __cxx_static_address_097321216113fd98cacfbd46.reference || (__cxx_static_address_097321216113fd98cacfbd46.reference = {
    __cReference: true,
    get value() { return BLOODPOOL____header_global_df7e497207a1289b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:496
export const NUKEBARREL____header_global_bdbdc598aff7b562 = ((((((1227) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_750e40b8a075a0a0d8bc6deb() {
  return __cxx_static_address_750e40b8a075a0a0d8bc6deb.reference || (__cxx_static_address_750e40b8a075a0a0d8bc6deb.reference = {
    __cReference: true,
    get value() { return NUKEBARREL____header_global_bdbdc598aff7b562; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:497
export const NUKEBARRELDENTED____header_global_4095fdffb503ef72 = ((((((1228) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a17b4925e1971861c69668a2() {
  return __cxx_static_address_a17b4925e1971861c69668a2.reference || (__cxx_static_address_a17b4925e1971861c69668a2.reference = {
    __cReference: true,
    get value() { return NUKEBARRELDENTED____header_global_4095fdffb503ef72; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:498
export const NUKEBARRELLEAKED____header_global_f4d80fad0a99ed8c = ((((((1229) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_50f19c0b81afbeb19faad68c() {
  return __cxx_static_address_50f19c0b81afbeb19faad68c.reference || (__cxx_static_address_50f19c0b81afbeb19faad68c.reference = {
    __cReference: true,
    get value() { return NUKEBARRELLEAKED____header_global_f4d80fad0a99ed8c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:499
export const CANWITHSOMETHING____header_global_ea46e2a6721c142d = ((((((1232) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_01030b32da9ebbee2ca39a9f() {
  return __cxx_static_address_01030b32da9ebbee2ca39a9f.reference || (__cxx_static_address_01030b32da9ebbee2ca39a9f.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING____header_global_ea46e2a6721c142d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:500
export const MONEY____header_global_69ff0bf9face252d = ((((((1233) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0c590b007ac285dd7af17bf8() {
  return __cxx_static_address_0c590b007ac285dd7af17bf8.reference || (__cxx_static_address_0c590b007ac285dd7af17bf8.reference = {
    __cReference: true,
    get value() { return MONEY____header_global_69ff0bf9face252d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:501
export const BANNER____header_global_9e5cef8e1a3a7b50 = ((((((1236) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_58d5f2c9c8ce783e1da8851d() {
  return __cxx_static_address_58d5f2c9c8ce783e1da8851d.reference || (__cxx_static_address_58d5f2c9c8ce783e1da8851d.reference = {
    __cReference: true,
    get value() { return BANNER____header_global_9e5cef8e1a3a7b50; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:502
export const EXPLODINGBARREL____header_global_82dfdfee2b928b1d = ((((((1238) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4a054080aaf88fd88b941fa7() {
  return __cxx_static_address_4a054080aaf88fd88b941fa7.reference || (__cxx_static_address_4a054080aaf88fd88b941fa7.reference = {
    __cReference: true,
    get value() { return EXPLODINGBARREL____header_global_82dfdfee2b928b1d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:503
export const EXPLODINGBARREL2____header_global_4b2e675f69acd33f = ((((((1239) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6de225b4c8664ee6fd70c62e() {
  return __cxx_static_address_6de225b4c8664ee6fd70c62e.reference || (__cxx_static_address_6de225b4c8664ee6fd70c62e.reference = {
    __cReference: true,
    get value() { return EXPLODINGBARREL2____header_global_4b2e675f69acd33f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:504
export const FIREBARREL____header_global_c658e35f87eccaa9 = ((((((1240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_74bf2c73272d5c758b48c0b9() {
  return __cxx_static_address_74bf2c73272d5c758b48c0b9.reference || (__cxx_static_address_74bf2c73272d5c758b48c0b9.reference = {
    __cReference: true,
    get value() { return FIREBARREL____header_global_c658e35f87eccaa9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:505
export const SEENINE____header_global_28163f02a14be9e5 = ((((((1247) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_010f62902587280b5862f8b0() {
  return __cxx_static_address_010f62902587280b5862f8b0.reference || (__cxx_static_address_010f62902587280b5862f8b0.reference = {
    __cReference: true,
    get value() { return SEENINE____header_global_28163f02a14be9e5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:506
export const SEENINEDEAD____header_global_47dd06cd0b3f5237 = ((((((1248) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1410368fe83649f9bb8aa46e() {
  return __cxx_static_address_1410368fe83649f9bb8aa46e.reference || (__cxx_static_address_1410368fe83649f9bb8aa46e.reference = {
    __cReference: true,
    get value() { return SEENINEDEAD____header_global_47dd06cd0b3f5237; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:507
export const STEAM____header_global_42dc728828809ad1 = ((((((1250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5cee78255383e96a48c07557() {
  return __cxx_static_address_5cee78255383e96a48c07557.reference || (__cxx_static_address_5cee78255383e96a48c07557.reference = {
    __cReference: true,
    get value() { return STEAM____header_global_42dc728828809ad1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:508
export const CEILINGSTEAM____header_global_def72cf3b4f72afa = ((((((1255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f9da2e1c04c2afc22d8a804b() {
  return __cxx_static_address_f9da2e1c04c2afc22d8a804b.reference || (__cxx_static_address_f9da2e1c04c2afc22d8a804b.reference = {
    __cReference: true,
    get value() { return CEILINGSTEAM____header_global_def72cf3b4f72afa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:509
export const PIPE6B____header_global_483550d6bcfca330 = ((((((1260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c88827fe3f6ea64a58bb6d9d() {
  return __cxx_static_address_c88827fe3f6ea64a58bb6d9d.reference || (__cxx_static_address_c88827fe3f6ea64a58bb6d9d.reference = {
    __cReference: true,
    get value() { return PIPE6B____header_global_483550d6bcfca330; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:510
export const TRANSPORTERBEAM____header_global_e23e7ee27675baef = ((((((1261) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d5296a2ae07a789619a673a4() {
  return __cxx_static_address_d5296a2ae07a789619a673a4.reference || (__cxx_static_address_d5296a2ae07a789619a673a4.reference = {
    __cReference: true,
    get value() { return TRANSPORTERBEAM____header_global_e23e7ee27675baef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:511
export const RAT____header_global_8fe072f4fae143cc = ((((((1267) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d2cdc1f5d039c7ac92a06b9d() {
  return __cxx_static_address_d2cdc1f5d039c7ac92a06b9d.reference || (__cxx_static_address_d2cdc1f5d039c7ac92a06b9d.reference = {
    __cReference: true,
    get value() { return RAT____header_global_8fe072f4fae143cc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:512
export const TRASH____header_global_6abade18d5bf0f17 = ((((((1272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_64ded4266ce4e350a8bbf034() {
  return __cxx_static_address_64ded4266ce4e350a8bbf034.reference || (__cxx_static_address_64ded4266ce4e350a8bbf034.reference = {
    __cReference: true,
    get value() { return TRASH____header_global_6abade18d5bf0f17; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:513
export const FEMPIC1____header_global_a4533ec869e1a3ef = ((((((1280) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2c3be0d2d3be7dec3af1716c() {
  return __cxx_static_address_2c3be0d2d3be7dec3af1716c.reference || (__cxx_static_address_2c3be0d2d3be7dec3af1716c.reference = {
    __cReference: true,
    get value() { return FEMPIC1____header_global_a4533ec869e1a3ef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:514
export const FEMPIC2____header_global_c2d8f42bec6a5474 = ((((((1289) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ea06ee92df125a060946c093() {
  return __cxx_static_address_ea06ee92df125a060946c093.reference || (__cxx_static_address_ea06ee92df125a060946c093.reference = {
    __cReference: true,
    get value() { return FEMPIC2____header_global_c2d8f42bec6a5474; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:515
export const BLANKSCREEN____header_global_373ff2ecf5f1dc64 = ((((((1293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5e2d24f92e8341d0d628147a() {
  return __cxx_static_address_5e2d24f92e8341d0d628147a.reference || (__cxx_static_address_5e2d24f92e8341d0d628147a.reference = {
    __cReference: true,
    get value() { return BLANKSCREEN____header_global_373ff2ecf5f1dc64; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:516
export const PODFEM1____header_global_b80f05ac6849519f = ((((((1294) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_201ab8a96497263987e5b66a() {
  return __cxx_static_address_201ab8a96497263987e5b66a.reference || (__cxx_static_address_201ab8a96497263987e5b66a.reference = {
    __cReference: true,
    get value() { return PODFEM1____header_global_b80f05ac6849519f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:517
export const FEMPIC3____header_global_dc9da92f4881cddb = ((((((1298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b1cf5bdd5bcad61ba029cc95() {
  return __cxx_static_address_b1cf5bdd5bcad61ba029cc95.reference || (__cxx_static_address_b1cf5bdd5bcad61ba029cc95.reference = {
    __cReference: true,
    get value() { return FEMPIC3____header_global_dc9da92f4881cddb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:518
export const FEMPIC4____header_global_a2e22e1e820d41ca = ((((((1306) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c1d30f7604554fbb35f92049() {
  return __cxx_static_address_c1d30f7604554fbb35f92049.reference || (__cxx_static_address_c1d30f7604554fbb35f92049.reference = {
    __cReference: true,
    get value() { return FEMPIC4____header_global_a2e22e1e820d41ca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:519
export const FEM1____header_global_6c3bc763a4679cf7 = ((((((1312) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c8ed78d6873d424a850fd267() {
  return __cxx_static_address_c8ed78d6873d424a850fd267.reference || (__cxx_static_address_c8ed78d6873d424a850fd267.reference = {
    __cReference: true,
    get value() { return FEM1____header_global_6c3bc763a4679cf7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:520
export const FEM2____header_global_ae5b44893de611e7 = ((((((1317) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_32cc6058a6ec3abc2e92b88a() {
  return __cxx_static_address_32cc6058a6ec3abc2e92b88a.reference || (__cxx_static_address_32cc6058a6ec3abc2e92b88a.reference = {
    __cReference: true,
    get value() { return FEM2____header_global_ae5b44893de611e7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:521
export const FEM3____header_global_7e6d9b03142394e3 = ((((((1321) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d06a690d717a5b5d206d02d6() {
  return __cxx_static_address_d06a690d717a5b5d206d02d6.reference || (__cxx_static_address_d06a690d717a5b5d206d02d6.reference = {
    __cReference: true,
    get value() { return FEM3____header_global_7e6d9b03142394e3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:522
export const FEM5____header_global_e32b47543e14be44 = ((((((1323) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aefacd98ff4e01fe5d760da1() {
  return __cxx_static_address_aefacd98ff4e01fe5d760da1.reference || (__cxx_static_address_aefacd98ff4e01fe5d760da1.reference = {
    __cReference: true,
    get value() { return FEM5____header_global_e32b47543e14be44; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:523
export const BLOODYPOLE____header_global_b964b8f9100b455f = ((((((1324) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c7e20671ad933cb0eb7fa891() {
  return __cxx_static_address_c7e20671ad933cb0eb7fa891.reference || (__cxx_static_address_c7e20671ad933cb0eb7fa891.reference = {
    __cReference: true,
    get value() { return BLOODYPOLE____header_global_b964b8f9100b455f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:524
export const FEM4____header_global_eaf38733028fc1a5 = ((((((1325) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c73e81f9a217ded801afc230() {
  return __cxx_static_address_c73e81f9a217ded801afc230.reference || (__cxx_static_address_c73e81f9a217ded801afc230.reference = {
    __cReference: true,
    get value() { return FEM4____header_global_eaf38733028fc1a5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:525
export const FEM6____header_global_9281c402db288bc3 = ((((((1334) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e18f4f23baaf907664f21dc1() {
  return __cxx_static_address_e18f4f23baaf907664f21dc1.reference || (__cxx_static_address_e18f4f23baaf907664f21dc1.reference = {
    __cReference: true,
    get value() { return FEM6____header_global_9281c402db288bc3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:526
export const FEM6PAD____header_global_dc109a1f8ffa544e = ((((((1335) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8b9399bb6a073da25a821d95() {
  return __cxx_static_address_8b9399bb6a073da25a821d95.reference || (__cxx_static_address_8b9399bb6a073da25a821d95.reference = {
    __cReference: true,
    get value() { return FEM6PAD____header_global_dc109a1f8ffa544e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:527
export const FEM8____header_global_825a520321d1db82 = ((((((1336) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fd25f2166a2c108a5f182c24() {
  return __cxx_static_address_fd25f2166a2c108a5f182c24.reference || (__cxx_static_address_fd25f2166a2c108a5f182c24.reference = {
    __cReference: true,
    get value() { return FEM8____header_global_825a520321d1db82; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:528
export const HELECOPT____header_global_dfeb0818dea87141 = ((((((1346) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8a77223d905c3e7624f6bc1c() {
  return __cxx_static_address_8a77223d905c3e7624f6bc1c.reference || (__cxx_static_address_8a77223d905c3e7624f6bc1c.reference = {
    __cReference: true,
    get value() { return HELECOPT____header_global_dfeb0818dea87141; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:529
export const FETUSJIB____header_global_7259937db3ed30e2 = ((((((1347) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8a6c954168c213921ac946ba() {
  return __cxx_static_address_8a6c954168c213921ac946ba.reference || (__cxx_static_address_8a6c954168c213921ac946ba.reference = {
    __cReference: true,
    get value() { return FETUSJIB____header_global_7259937db3ed30e2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:530
export const HOLODUKE____header_global_13b886505f87b279 = ((((((1348) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_feebc35b4a8bd6b2cfd38714() {
  return __cxx_static_address_feebc35b4a8bd6b2cfd38714.reference || (__cxx_static_address_feebc35b4a8bd6b2cfd38714.reference = {
    __cReference: true,
    get value() { return HOLODUKE____header_global_13b886505f87b279; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:531
export const SPACEMARINE____header_global_0a597080febb9a98 = ((((((1353) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_24c2f1ed31a648915d9a7a03() {
  return __cxx_static_address_24c2f1ed31a648915d9a7a03.reference || (__cxx_static_address_24c2f1ed31a648915d9a7a03.reference = {
    __cReference: true,
    get value() { return SPACEMARINE____header_global_0a597080febb9a98; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:532
export const INDY____header_global_d9dd7f479db3a2fc = ((((((1355) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c7a35234d322f5c45f91eaaf() {
  return __cxx_static_address_c7a35234d322f5c45f91eaaf.reference || (__cxx_static_address_c7a35234d322f5c45f91eaaf.reference = {
    __cReference: true,
    get value() { return INDY____header_global_d9dd7f479db3a2fc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:533
export const FETUS____header_global_9e8d6d6ae00e3abf = ((((((1358) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_93fa649e7ddaa72b4082f525() {
  return __cxx_static_address_93fa649e7ddaa72b4082f525.reference || (__cxx_static_address_93fa649e7ddaa72b4082f525.reference = {
    __cReference: true,
    get value() { return FETUS____header_global_9e8d6d6ae00e3abf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:534
export const FETUSBROKE____header_global_ee76e864e3ff4f53 = ((((((1359) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6c23fc767947052933740f5b() {
  return __cxx_static_address_6c23fc767947052933740f5b.reference || (__cxx_static_address_6c23fc767947052933740f5b.reference = {
    __cReference: true,
    get value() { return FETUSBROKE____header_global_ee76e864e3ff4f53; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:535
export const MONK____header_global_f1e36dda4b0b3b24 = ((((((1352) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cbee23ec3a27044743528cf2() {
  return __cxx_static_address_cbee23ec3a27044743528cf2.reference || (__cxx_static_address_cbee23ec3a27044743528cf2.reference = {
    __cReference: true,
    get value() { return MONK____header_global_f1e36dda4b0b3b24; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:536
export const LUKE____header_global_283b878592aa5905 = ((((((1354) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_28a4d20ac087ff213ddd34d9() {
  return __cxx_static_address_28a4d20ac087ff213ddd34d9.reference || (__cxx_static_address_28a4d20ac087ff213ddd34d9.reference = {
    __cReference: true,
    get value() { return LUKE____header_global_283b878592aa5905; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:537
export const COOLEXPLOSION1____header_global_b3db2038f7796530 = ((((((1360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0f782fa72575d97d6a98d5ac() {
  return __cxx_static_address_0f782fa72575d97d6a98d5ac.reference || (__cxx_static_address_0f782fa72575d97d6a98d5ac.reference = {
    __cReference: true,
    get value() { return COOLEXPLOSION1____header_global_b3db2038f7796530; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:538
export const WATERSPLASH2____header_global_5858c320dd2ceacb = ((((((1380) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a98c669647a5e60447c41db3() {
  return __cxx_static_address_a98c669647a5e60447c41db3.reference || (__cxx_static_address_a98c669647a5e60447c41db3.reference = {
    __cReference: true,
    get value() { return WATERSPLASH2____header_global_5858c320dd2ceacb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:539
export const FIREVASE____header_global_452656818c5efe49 = ((((((1390) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_858c29040352d749610a05fc() {
  return __cxx_static_address_858c29040352d749610a05fc.reference || (__cxx_static_address_858c29040352d749610a05fc.reference = {
    __cReference: true,
    get value() { return FIREVASE____header_global_452656818c5efe49; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:540
export const FEM7____header_global_4a24bed2a474cbd9 = ((((((1395) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c9d268a0ff035f20dd7bfb34() {
  return __cxx_static_address_c9d268a0ff035f20dd7bfb34.reference || (__cxx_static_address_c9d268a0ff035f20dd7bfb34.reference = {
    __cReference: true,
    get value() { return FEM7____header_global_4a24bed2a474cbd9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:541
export const APLAYERTOP____header_global_2551368a86d2786a = ((((((1400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3efb57b56e455ed13001ef37() {
  return __cxx_static_address_3efb57b56e455ed13001ef37.reference || (__cxx_static_address_3efb57b56e455ed13001ef37.reference = {
    __cReference: true,
    get value() { return APLAYERTOP____header_global_2551368a86d2786a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:542
export const APLAYER____header_global_3748b247b5ac338b = ((((((1405) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_960f606861d9805820c26f3a() {
  return __cxx_static_address_960f606861d9805820c26f3a.reference || (__cxx_static_address_960f606861d9805820c26f3a.reference = {
    __cReference: true,
    get value() { return APLAYER____header_global_3748b247b5ac338b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:543
export const PLAYERONWATER____header_global_5cb14ef739e0cc76 = ((((((1420) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_755daa45c292496f1f5b272a() {
  return __cxx_static_address_755daa45c292496f1f5b272a.reference || (__cxx_static_address_755daa45c292496f1f5b272a.reference = {
    __cReference: true,
    get value() { return PLAYERONWATER____header_global_5cb14ef739e0cc76; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:544
export const DUKELYINGDEAD____header_global_8e3b8899a7b2d4d9 = ((((((1518) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6d3db0cd0ceb3d74fc868386() {
  return __cxx_static_address_6d3db0cd0ceb3d74fc868386.reference || (__cxx_static_address_6d3db0cd0ceb3d74fc868386.reference = {
    __cReference: true,
    get value() { return DUKELYINGDEAD____header_global_8e3b8899a7b2d4d9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:545
export const DUKETORSO____header_global_182134f187daf3e6 = ((((((1520) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_59bc31232a7a68d55e9b08fd() {
  return __cxx_static_address_59bc31232a7a68d55e9b08fd.reference || (__cxx_static_address_59bc31232a7a68d55e9b08fd.reference = {
    __cReference: true,
    get value() { return DUKETORSO____header_global_182134f187daf3e6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:546
export const DUKEGUN____header_global_ad2a5359a401cfb1 = ((((((1528) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_971d5275e7ce80877d39940b() {
  return __cxx_static_address_971d5275e7ce80877d39940b.reference || (__cxx_static_address_971d5275e7ce80877d39940b.reference = {
    __cReference: true,
    get value() { return DUKEGUN____header_global_ad2a5359a401cfb1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:547
export const DUKELEG____header_global_05b7b45f2964af66 = ((((((1536) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4e57da084ee9c13eae8293c0() {
  return __cxx_static_address_4e57da084ee9c13eae8293c0.reference || (__cxx_static_address_4e57da084ee9c13eae8293c0.reference = {
    __cReference: true,
    get value() { return DUKELEG____header_global_05b7b45f2964af66; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:548
export const SHARK____header_global_73f480b3e454e6e7 = ((((((1550) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2a3b599bdb99e7adde981b40() {
  return __cxx_static_address_2a3b599bdb99e7adde981b40.reference || (__cxx_static_address_2a3b599bdb99e7adde981b40.reference = {
    __cReference: true,
    get value() { return SHARK____header_global_73f480b3e454e6e7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:549
export const BLOOD____header_global_18d9130e9ad7a076 = ((((((1620) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4c43d7e234c5d887e2c776ba() {
  return __cxx_static_address_4c43d7e234c5d887e2c776ba.reference || (__cxx_static_address_4c43d7e234c5d887e2c776ba.reference = {
    __cReference: true,
    get value() { return BLOOD____header_global_18d9130e9ad7a076; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:550
export const FIRELASER____header_global_69c51a34100e8e47 = ((((((1625) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c02148eb7b7f55872e2e8e02() {
  return __cxx_static_address_c02148eb7b7f55872e2e8e02.reference || (__cxx_static_address_c02148eb7b7f55872e2e8e02.reference = {
    __cReference: true,
    get value() { return FIRELASER____header_global_69c51a34100e8e47; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:551
export const TRANSPORTERSTAR____header_global_ba6472ec63c38517 = ((((((1630) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_893afb777d672540eb60d0f7() {
  return __cxx_static_address_893afb777d672540eb60d0f7.reference || (__cxx_static_address_893afb777d672540eb60d0f7.reference = {
    __cReference: true,
    get value() { return TRANSPORTERSTAR____header_global_ba6472ec63c38517; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:552
export const SPIT____header_global_752b8aed352778f2 = ((((((1636) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_916a4747d331ffaaa9107a30() {
  return __cxx_static_address_916a4747d331ffaaa9107a30.reference || (__cxx_static_address_916a4747d331ffaaa9107a30.reference = {
    __cReference: true,
    get value() { return SPIT____header_global_752b8aed352778f2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:553
export const LOOGIE____header_global_608c0adf524f2c36 = ((((((1637) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fa6f174435963babd3edda90() {
  return __cxx_static_address_fa6f174435963babd3edda90.reference || (__cxx_static_address_fa6f174435963babd3edda90.reference = {
    __cReference: true,
    get value() { return LOOGIE____header_global_608c0adf524f2c36; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:554
export const FIST____header_global_c5df36679a529e8a = ((((((1640) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_08a7c29125d8930d2f42522f() {
  return __cxx_static_address_08a7c29125d8930d2f42522f.reference || (__cxx_static_address_08a7c29125d8930d2f42522f.reference = {
    __cReference: true,
    get value() { return FIST____header_global_c5df36679a529e8a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:555
export const FREEZEBLAST____header_global_ebcd8418336ca537 = ((((((1641) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9138807215e24c1f6161f582() {
  return __cxx_static_address_9138807215e24c1f6161f582.reference || (__cxx_static_address_9138807215e24c1f6161f582.reference = {
    __cReference: true,
    get value() { return FREEZEBLAST____header_global_ebcd8418336ca537; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:556
export const SHRINKSPARK____header_global_d054f810659c8dd9 = ((((((1646) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0fca7f69409dc20093c25d98() {
  return __cxx_static_address_0fca7f69409dc20093c25d98.reference || (__cxx_static_address_0fca7f69409dc20093c25d98.reference = {
    __cReference: true,
    get value() { return SHRINKSPARK____header_global_d054f810659c8dd9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:557
export const TONGUE____header_global_2813061ed8bb30a9 = ((((((1647) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f173f35a86bdeef01a89a176() {
  return __cxx_static_address_f173f35a86bdeef01a89a176.reference || (__cxx_static_address_f173f35a86bdeef01a89a176.reference = {
    __cReference: true,
    get value() { return TONGUE____header_global_2813061ed8bb30a9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:558
export const MORTER____header_global_d3cdcdfc33bbf404 = ((((((1650) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8c2abe3cc4e0309122b5bd7b() {
  return __cxx_static_address_8c2abe3cc4e0309122b5bd7b.reference || (__cxx_static_address_8c2abe3cc4e0309122b5bd7b.reference = {
    __cReference: true,
    get value() { return MORTER____header_global_d3cdcdfc33bbf404; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:559
export const SHRINKEREXPLOSION____header_global_3aa4e8422bb7981e = ((((((1656) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1ed1e19625f5473ef641106b() {
  return __cxx_static_address_1ed1e19625f5473ef641106b.reference || (__cxx_static_address_1ed1e19625f5473ef641106b.reference = {
    __cReference: true,
    get value() { return SHRINKEREXPLOSION____header_global_3aa4e8422bb7981e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:560
export const RADIUSEXPLOSION____header_global_65798f932aefd9e0 = ((((((1670) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b5ac5319279c40b9d96d07a8() {
  return __cxx_static_address_b5ac5319279c40b9d96d07a8.reference || (__cxx_static_address_b5ac5319279c40b9d96d07a8.reference = {
    __cReference: true,
    get value() { return RADIUSEXPLOSION____header_global_65798f932aefd9e0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:561
export const FORCERIPPLE____header_global_02c55da439ecb983 = ((((((1671) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_506100652cb5035f20cd64dd() {
  return __cxx_static_address_506100652cb5035f20cd64dd.reference || (__cxx_static_address_506100652cb5035f20cd64dd.reference = {
    __cReference: true,
    get value() { return FORCERIPPLE____header_global_02c55da439ecb983; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:562
export const LIZTROOP____header_global_1fafce70706357cf = ((((((1680) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c095a03d081e261384c64b33() {
  return __cxx_static_address_c095a03d081e261384c64b33.reference || (__cxx_static_address_c095a03d081e261384c64b33.reference = {
    __cReference: true,
    get value() { return LIZTROOP____header_global_1fafce70706357cf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:563
export const LIZTROOPRUNNING____header_global_e1e0030e7ea58665 = ((((((1681) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_175e1ab7df28a028fb704535() {
  return __cxx_static_address_175e1ab7df28a028fb704535.reference || (__cxx_static_address_175e1ab7df28a028fb704535.reference = {
    __cReference: true,
    get value() { return LIZTROOPRUNNING____header_global_e1e0030e7ea58665; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:564
export const LIZTROOPSTAYPUT____header_global_65d7b72a23dd53e8 = ((((((1682) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5cc340fa307e1afac1ca5e03() {
  return __cxx_static_address_5cc340fa307e1afac1ca5e03.reference || (__cxx_static_address_5cc340fa307e1afac1ca5e03.reference = {
    __cReference: true,
    get value() { return LIZTROOPSTAYPUT____header_global_65d7b72a23dd53e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:565
export const LIZTROOPSHOOT____header_global_0f545ddcac3efc7c = ((((((1715) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fad100563f1e00e4344f6d0e() {
  return __cxx_static_address_fad100563f1e00e4344f6d0e.reference || (__cxx_static_address_fad100563f1e00e4344f6d0e.reference = {
    __cReference: true,
    get value() { return LIZTROOPSHOOT____header_global_0f545ddcac3efc7c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:566
export const LIZTROOPJETPACK____header_global_fbd4d5c8a7fd214c = ((((((1725) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bc7cb6e1e4f18a2ad55167fa() {
  return __cxx_static_address_bc7cb6e1e4f18a2ad55167fa.reference || (__cxx_static_address_bc7cb6e1e4f18a2ad55167fa.reference = {
    __cReference: true,
    get value() { return LIZTROOPJETPACK____header_global_fbd4d5c8a7fd214c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:567
export const LIZTROOPONTOILET____header_global_8573c91071a95f3e = ((((((1741) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_71cf056bff878c5a5d9e01a4() {
  return __cxx_static_address_71cf056bff878c5a5d9e01a4.reference || (__cxx_static_address_71cf056bff878c5a5d9e01a4.reference = {
    __cReference: true,
    get value() { return LIZTROOPONTOILET____header_global_8573c91071a95f3e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:568
export const LIZTROOPJUSTSIT____header_global_37f68a3363147394 = ((((((1742) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d5e13723df3a6488f7735838() {
  return __cxx_static_address_d5e13723df3a6488f7735838.reference || (__cxx_static_address_d5e13723df3a6488f7735838.reference = {
    __cReference: true,
    get value() { return LIZTROOPJUSTSIT____header_global_37f68a3363147394; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:569
export const LIZTROOPDUCKING____header_global_626235fe91540519 = ((((((1744) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9342986f531af67e4715c06e() {
  return __cxx_static_address_9342986f531af67e4715c06e.reference || (__cxx_static_address_9342986f531af67e4715c06e.reference = {
    __cReference: true,
    get value() { return LIZTROOPDUCKING____header_global_626235fe91540519; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:570
export const HEADJIB1____header_global_347b50f9a9bb85f7 = ((((((1768) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a83ba72a77d37fac12f919c5() {
  return __cxx_static_address_a83ba72a77d37fac12f919c5.reference || (__cxx_static_address_a83ba72a77d37fac12f919c5.reference = {
    __cReference: true,
    get value() { return HEADJIB1____header_global_347b50f9a9bb85f7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:571
export const ARMJIB1____header_global_04afd1ca057f07dc = ((((((1772) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6110225b2f4030d97736d5ea() {
  return __cxx_static_address_6110225b2f4030d97736d5ea.reference || (__cxx_static_address_6110225b2f4030d97736d5ea.reference = {
    __cReference: true,
    get value() { return ARMJIB1____header_global_04afd1ca057f07dc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:572
export const LEGJIB1____header_global_44cc96015a6a9128 = ((((((1776) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c267a0832f75d2d0d8c60f6b() {
  return __cxx_static_address_c267a0832f75d2d0d8c60f6b.reference || (__cxx_static_address_c267a0832f75d2d0d8c60f6b.reference = {
    __cReference: true,
    get value() { return LEGJIB1____header_global_44cc96015a6a9128; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:573
export const OCTABRAIN____header_global_a1c6719436a1b6ff = ((((((1820) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_92b4788f95e00ea40747c2d3() {
  return __cxx_static_address_92b4788f95e00ea40747c2d3.reference || (__cxx_static_address_92b4788f95e00ea40747c2d3.reference = {
    __cReference: true,
    get value() { return OCTABRAIN____header_global_a1c6719436a1b6ff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:574
export const OCTABRAINSTAYPUT____header_global_fa777866935c70f1 = ((((((1821) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_698e58abad06ec8e9b4c0b77() {
  return __cxx_static_address_698e58abad06ec8e9b4c0b77.reference || (__cxx_static_address_698e58abad06ec8e9b4c0b77.reference = {
    __cReference: true,
    get value() { return OCTABRAINSTAYPUT____header_global_fa777866935c70f1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:575
export const INNERJAW____header_global_784091222ced53ee = ((((((1860) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c3d4ce78ba4f44b714106018() {
  return __cxx_static_address_c3d4ce78ba4f44b714106018.reference || (__cxx_static_address_c3d4ce78ba4f44b714106018.reference = {
    __cReference: true,
    get value() { return INNERJAW____header_global_784091222ced53ee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:576
export const DRONE____header_global_0b0dcd2adca8e08f = ((((((1880) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dcfacb5ea59a4a96f151ecce() {
  return __cxx_static_address_dcfacb5ea59a4a96f151ecce.reference || (__cxx_static_address_dcfacb5ea59a4a96f151ecce.reference = {
    __cReference: true,
    get value() { return DRONE____header_global_0b0dcd2adca8e08f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:577
export const EXPLOSION2____header_global_d4b55b09a6f7e9a2 = ((((((1890) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_68a86d088ffb406d0b2e8ae7() {
  return __cxx_static_address_68a86d088ffb406d0b2e8ae7.reference || (__cxx_static_address_68a86d088ffb406d0b2e8ae7.reference = {
    __cReference: true,
    get value() { return EXPLOSION2____header_global_d4b55b09a6f7e9a2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:578
export const COMMANDER____header_global_604efb11ecc59b7b = ((((((1920) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2e7b8a1daef57379b229aa77() {
  return __cxx_static_address_2e7b8a1daef57379b229aa77.reference || (__cxx_static_address_2e7b8a1daef57379b229aa77.reference = {
    __cReference: true,
    get value() { return COMMANDER____header_global_604efb11ecc59b7b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:579
export const COMMANDERSTAYPUT____header_global_3a3dd0b7d842eb75 = ((((((1921) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f479b032572a59b1d87d26d1() {
  return __cxx_static_address_f479b032572a59b1d87d26d1.reference || (__cxx_static_address_f479b032572a59b1d87d26d1.reference = {
    __cReference: true,
    get value() { return COMMANDERSTAYPUT____header_global_3a3dd0b7d842eb75; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:580
export const RECON____header_global_d67dab6247ad4479 = ((((((1960) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a52e8a4561fb7f1ae3a74a3a() {
  return __cxx_static_address_a52e8a4561fb7f1ae3a74a3a.reference || (__cxx_static_address_a52e8a4561fb7f1ae3a74a3a.reference = {
    __cReference: true,
    get value() { return RECON____header_global_d67dab6247ad4479; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:581
export const TANK____header_global_1fa87a4affd2fc62 = ((((((1975) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3c9e1ba51a6fec4e14f0d95a() {
  return __cxx_static_address_3c9e1ba51a6fec4e14f0d95a.reference || (__cxx_static_address_3c9e1ba51a6fec4e14f0d95a.reference = {
    __cReference: true,
    get value() { return TANK____header_global_1fa87a4affd2fc62; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:582
export const PIGCOP____header_global_c6cf06ec9360de25 = ((((((2000) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a5fc59cc74648f58b6b32ef4() {
  return __cxx_static_address_a5fc59cc74648f58b6b32ef4.reference || (__cxx_static_address_a5fc59cc74648f58b6b32ef4.reference = {
    __cReference: true,
    get value() { return PIGCOP____header_global_c6cf06ec9360de25; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:583
export const PIGCOPSTAYPUT____header_global_8ee529e71c4bf1d9 = ((((((2001) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ce979a75c0db681bc4bd11f8() {
  return __cxx_static_address_ce979a75c0db681bc4bd11f8.reference || (__cxx_static_address_ce979a75c0db681bc4bd11f8.reference = {
    __cReference: true,
    get value() { return PIGCOPSTAYPUT____header_global_8ee529e71c4bf1d9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:584
export const PIGCOPDIVE____header_global_a5e66679e074ef41 = ((((((2045) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d4a1eee31f6d283c95428e91() {
  return __cxx_static_address_d4a1eee31f6d283c95428e91.reference || (__cxx_static_address_d4a1eee31f6d283c95428e91.reference = {
    __cReference: true,
    get value() { return PIGCOPDIVE____header_global_a5e66679e074ef41; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:585
export const LIZMAN____header_global_85f5098aaf02409a = ((((((2120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c04222ffc2503cbba5d20820() {
  return __cxx_static_address_c04222ffc2503cbba5d20820.reference || (__cxx_static_address_c04222ffc2503cbba5d20820.reference = {
    __cReference: true,
    get value() { return LIZMAN____header_global_85f5098aaf02409a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:586
export const LIZMANSTAYPUT____header_global_56e5a528f853cb31 = ((((((2121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_07b368897cbcb15e0bb2c49f() {
  return __cxx_static_address_07b368897cbcb15e0bb2c49f.reference || (__cxx_static_address_07b368897cbcb15e0bb2c49f.reference = {
    __cReference: true,
    get value() { return LIZMANSTAYPUT____header_global_56e5a528f853cb31; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:587
export const LIZMANSPITTING____header_global_7626352a77a49973 = ((((((2150) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_caf946a5c21eaf31d319935b() {
  return __cxx_static_address_caf946a5c21eaf31d319935b.reference || (__cxx_static_address_caf946a5c21eaf31d319935b.reference = {
    __cReference: true,
    get value() { return LIZMANSPITTING____header_global_7626352a77a49973; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:588
export const LIZMANFEEDING____header_global_edafed67e43561ab = ((((((2160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2a9dbeeae1b2b1f9d1d1570b() {
  return __cxx_static_address_2a9dbeeae1b2b1f9d1d1570b.reference || (__cxx_static_address_2a9dbeeae1b2b1f9d1d1570b.reference = {
    __cReference: true,
    get value() { return LIZMANFEEDING____header_global_edafed67e43561ab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:589
export const LIZMANJUMP____header_global_1068973854461995 = ((((((2165) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_21731fc6699059a5f6a42919() {
  return __cxx_static_address_21731fc6699059a5f6a42919.reference || (__cxx_static_address_21731fc6699059a5f6a42919.reference = {
    __cReference: true,
    get value() { return LIZMANJUMP____header_global_1068973854461995; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:590
export const FECES____header_global_57148f164a0ed622 = ((((((2200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_860826ea9923d60ccfb42314() {
  return __cxx_static_address_860826ea9923d60ccfb42314.reference || (__cxx_static_address_860826ea9923d60ccfb42314.reference = {
    __cReference: true,
    get value() { return FECES____header_global_57148f164a0ed622; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:591
export const LIZMANHEAD1____header_global_618cd08269e6adbe = ((((((2201) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3543eb77b58bb8a616869cbb() {
  return __cxx_static_address_3543eb77b58bb8a616869cbb.reference || (__cxx_static_address_3543eb77b58bb8a616869cbb.reference = {
    __cReference: true,
    get value() { return LIZMANHEAD1____header_global_618cd08269e6adbe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:592
export const LIZMANARM1____header_global_fcd348bef9135a9d = ((((((2205) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_13d394c82e78a3bb0beb0344() {
  return __cxx_static_address_13d394c82e78a3bb0beb0344.reference || (__cxx_static_address_13d394c82e78a3bb0beb0344.reference = {
    __cReference: true,
    get value() { return LIZMANARM1____header_global_fcd348bef9135a9d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:593
export const LIZMANLEG1____header_global_085fa088a4d32860 = ((((((2209) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_76848c68b5b92ebc0252b6e0() {
  return __cxx_static_address_76848c68b5b92ebc0252b6e0.reference || (__cxx_static_address_76848c68b5b92ebc0252b6e0.reference = {
    __cReference: true,
    get value() { return LIZMANLEG1____header_global_085fa088a4d32860; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:594
export const EXPLOSION2BOT____header_global_41a51142b2b35bb9 = ((((((2219) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2255e42b0a53d9fda3ac9a28() {
  return __cxx_static_address_2255e42b0a53d9fda3ac9a28.reference || (__cxx_static_address_2255e42b0a53d9fda3ac9a28.reference = {
    __cReference: true,
    get value() { return EXPLOSION2BOT____header_global_41a51142b2b35bb9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:595
export const JIBS1____header_global_767259025415f397 = ((((((2245) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e02f2984c18f2b6d12f5f500() {
  return __cxx_static_address_e02f2984c18f2b6d12f5f500.reference || (__cxx_static_address_e02f2984c18f2b6d12f5f500.reference = {
    __cReference: true,
    get value() { return JIBS1____header_global_767259025415f397; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:596
export const JIBS2____header_global_8fee01309ff3e481 = ((((((2250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7f775542f0d44a92659ef63c() {
  return __cxx_static_address_7f775542f0d44a92659ef63c.reference || (__cxx_static_address_7f775542f0d44a92659ef63c.reference = {
    __cReference: true,
    get value() { return JIBS2____header_global_8fee01309ff3e481; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:597
export const JIBS3____header_global_8d231c633513bcbc = ((((((2255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f6092d02fbdba60c2652e267() {
  return __cxx_static_address_f6092d02fbdba60c2652e267.reference || (__cxx_static_address_f6092d02fbdba60c2652e267.reference = {
    __cReference: true,
    get value() { return JIBS3____header_global_8d231c633513bcbc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:598
export const JIBS4____header_global_a50795f073941beb = ((((((2260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a4177b91174305a7ed975231() {
  return __cxx_static_address_a4177b91174305a7ed975231.reference || (__cxx_static_address_a4177b91174305a7ed975231.reference = {
    __cReference: true,
    get value() { return JIBS4____header_global_a50795f073941beb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:599
export const JIBS5____header_global_c7eda1090a13ce88 = ((((((2265) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bf58d973b9b0d41411cec8bb() {
  return __cxx_static_address_bf58d973b9b0d41411cec8bb.reference || (__cxx_static_address_bf58d973b9b0d41411cec8bb.reference = {
    __cReference: true,
    get value() { return JIBS5____header_global_c7eda1090a13ce88; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:600
export const BURNING____header_global_a2e957227fb915b7 = ((((((2270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a2b0691c4e888d9aa0bb6373() {
  return __cxx_static_address_a2b0691c4e888d9aa0bb6373.reference || (__cxx_static_address_a2b0691c4e888d9aa0bb6373.reference = {
    __cReference: true,
    get value() { return BURNING____header_global_a2e957227fb915b7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:601
export const FIRE____header_global_cd342a3e11f926d9 = ((((((2271) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_73fcc8b780bf15985df46e68() {
  return __cxx_static_address_73fcc8b780bf15985df46e68.reference || (__cxx_static_address_73fcc8b780bf15985df46e68.reference = {
    __cReference: true,
    get value() { return FIRE____header_global_cd342a3e11f926d9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:602
export const JIBS6____header_global_12aa88e2ca65f14b = ((((((2286) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_66329a4d1caf3b2ef310f251() {
  return __cxx_static_address_66329a4d1caf3b2ef310f251.reference || (__cxx_static_address_66329a4d1caf3b2ef310f251.reference = {
    __cReference: true,
    get value() { return JIBS6____header_global_12aa88e2ca65f14b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:603
export const BLOODSPLAT1____header_global_11ba5276306c38df = ((((((2296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ad116195d204f675ef5e76c7() {
  return __cxx_static_address_ad116195d204f675ef5e76c7.reference || (__cxx_static_address_ad116195d204f675ef5e76c7.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT1____header_global_11ba5276306c38df; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:604
export const BLOODSPLAT3____header_global_96f920d40bc378f8 = ((((((2297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d1e711b1fcd6e8c46674ec23() {
  return __cxx_static_address_d1e711b1fcd6e8c46674ec23.reference || (__cxx_static_address_d1e711b1fcd6e8c46674ec23.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT3____header_global_96f920d40bc378f8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:605
export const BLOODSPLAT2____header_global_5753e691050e33a2 = ((((((2298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_524dc2f99a892fd85d6e1200() {
  return __cxx_static_address_524dc2f99a892fd85d6e1200.reference || (__cxx_static_address_524dc2f99a892fd85d6e1200.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT2____header_global_5753e691050e33a2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:606
export const BLOODSPLAT4____header_global_60cf6e2dbdd2b84a = ((((((2299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_59ffa1f5dad4b1cf54f9d4ee() {
  return __cxx_static_address_59ffa1f5dad4b1cf54f9d4ee.reference || (__cxx_static_address_59ffa1f5dad4b1cf54f9d4ee.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT4____header_global_60cf6e2dbdd2b84a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:607
export const OOZ____header_global_07ccc0068f41803e = ((((((2300) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_198640140a413a18b2cb6d76() {
  return __cxx_static_address_198640140a413a18b2cb6d76.reference || (__cxx_static_address_198640140a413a18b2cb6d76.reference = {
    __cReference: true,
    get value() { return OOZ____header_global_07ccc0068f41803e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:608
export const OOZ2____header_global_6a1003811cb69a4f = ((((((2309) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9363464ffcc1929a8cd8071c() {
  return __cxx_static_address_9363464ffcc1929a8cd8071c.reference || (__cxx_static_address_9363464ffcc1929a8cd8071c.reference = {
    __cReference: true,
    get value() { return OOZ2____header_global_6a1003811cb69a4f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:609
export const WALLBLOOD1____header_global_e12889d8610a7a73 = ((((((2301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d8e285ee1a50e22f60154ee5() {
  return __cxx_static_address_d8e285ee1a50e22f60154ee5.reference || (__cxx_static_address_d8e285ee1a50e22f60154ee5.reference = {
    __cReference: true,
    get value() { return WALLBLOOD1____header_global_e12889d8610a7a73; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:610
export const WALLBLOOD2____header_global_42db76d941f51ccf = ((((((2302) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_41bf09332529fa12fb8fef59() {
  return __cxx_static_address_41bf09332529fa12fb8fef59.reference || (__cxx_static_address_41bf09332529fa12fb8fef59.reference = {
    __cReference: true,
    get value() { return WALLBLOOD2____header_global_42db76d941f51ccf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:611
export const WALLBLOOD3____header_global_b4be9593b5905ec3 = ((((((2303) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b54c3e04b1b9f09aad086d67() {
  return __cxx_static_address_b54c3e04b1b9f09aad086d67.reference || (__cxx_static_address_b54c3e04b1b9f09aad086d67.reference = {
    __cReference: true,
    get value() { return WALLBLOOD3____header_global_b4be9593b5905ec3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:612
export const WALLBLOOD4____header_global_e0eb30f21fc1ecd2 = ((((((2304) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7812524e41663b3154859d24() {
  return __cxx_static_address_7812524e41663b3154859d24.reference || (__cxx_static_address_7812524e41663b3154859d24.reference = {
    __cReference: true,
    get value() { return WALLBLOOD4____header_global_e0eb30f21fc1ecd2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:613
export const WALLBLOOD5____header_global_2414a64c798e669a = ((((((2305) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fc947a59afed52f2e7b284d0() {
  return __cxx_static_address_fc947a59afed52f2e7b284d0.reference || (__cxx_static_address_fc947a59afed52f2e7b284d0.reference = {
    __cReference: true,
    get value() { return WALLBLOOD5____header_global_2414a64c798e669a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:614
export const WALLBLOOD7____header_global_9a5d28e2fb5698b6 = ((((((2307) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c0c9467e5eff30e3835af10a() {
  return __cxx_static_address_c0c9467e5eff30e3835af10a.reference || (__cxx_static_address_c0c9467e5eff30e3835af10a.reference = {
    __cReference: true,
    get value() { return WALLBLOOD7____header_global_9a5d28e2fb5698b6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:615
export const WALLBLOOD8____header_global_c3690a3d7d568656 = ((((((2308) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1aba495a4235f846ed34f0a4() {
  return __cxx_static_address_1aba495a4235f846ed34f0a4.reference || (__cxx_static_address_1aba495a4235f846ed34f0a4.reference = {
    __cReference: true,
    get value() { return WALLBLOOD8____header_global_c3690a3d7d568656; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:616
export const BURNING2____header_global_9fde62481968f048 = ((((((2310) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a4b232f9993f56f4b4803f64() {
  return __cxx_static_address_a4b232f9993f56f4b4803f64.reference || (__cxx_static_address_a4b232f9993f56f4b4803f64.reference = {
    __cReference: true,
    get value() { return BURNING2____header_global_9fde62481968f048; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:617
export const FIRE2____header_global_2d81afecfe645845 = ((((((2311) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3c0541374ad458d314221775() {
  return __cxx_static_address_3c0541374ad458d314221775.reference || (__cxx_static_address_3c0541374ad458d314221775.reference = {
    __cReference: true,
    get value() { return FIRE2____header_global_2d81afecfe645845; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:618
export const CRACKKNUCKLES____header_global_aa4245f589143169 = ((((((2324) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e60f429b06fe2f785b88ddb() {
  return __cxx_static_address_1e60f429b06fe2f785b88ddb.reference || (__cxx_static_address_1e60f429b06fe2f785b88ddb.reference = {
    __cReference: true,
    get value() { return CRACKKNUCKLES____header_global_aa4245f589143169; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:619
export const SMALLSMOKE____header_global_b5af41ceab5cda32 = ((((((2329) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2b41fcafaaa32f6555fb51a0() {
  return __cxx_static_address_2b41fcafaaa32f6555fb51a0.reference || (__cxx_static_address_2b41fcafaaa32f6555fb51a0.reference = {
    __cReference: true,
    get value() { return SMALLSMOKE____header_global_b5af41ceab5cda32; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:620
export const FLOORFLAME____header_global_1ca273751508aaf0 = ((((((2333) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dd75fdb17ca4f7960f6915d5() {
  return __cxx_static_address_dd75fdb17ca4f7960f6915d5.reference || (__cxx_static_address_dd75fdb17ca4f7960f6915d5.reference = {
    __cReference: true,
    get value() { return FLOORFLAME____header_global_1ca273751508aaf0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:621
export const ROTATEGUN____header_global_499f96c6f6aec73b = ((((((2360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_867bf99ea0a5ba760c6e4d76() {
  return __cxx_static_address_867bf99ea0a5ba760c6e4d76.reference || (__cxx_static_address_867bf99ea0a5ba760c6e4d76.reference = {
    __cReference: true,
    get value() { return ROTATEGUN____header_global_499f96c6f6aec73b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:622
export const GREENSLIME____header_global_e863f69a82d3df57 = ((((((2370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_265101e8e2882209829cd8e6() {
  return __cxx_static_address_265101e8e2882209829cd8e6.reference || (__cxx_static_address_265101e8e2882209829cd8e6.reference = {
    __cReference: true,
    get value() { return GREENSLIME____header_global_e863f69a82d3df57; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:623
export const WATERDRIPSPLASH____header_global_286aba7eda91c566 = ((((((2380) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_406f874c17e97b065b2e7ca6() {
  return __cxx_static_address_406f874c17e97b065b2e7ca6.reference || (__cxx_static_address_406f874c17e97b065b2e7ca6.reference = {
    __cReference: true,
    get value() { return WATERDRIPSPLASH____header_global_286aba7eda91c566; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:624
export const SCRAP6____header_global_ffc40c733c472885 = ((((((2390) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d009ecbfcdc437804014f3db() {
  return __cxx_static_address_d009ecbfcdc437804014f3db.reference || (__cxx_static_address_d009ecbfcdc437804014f3db.reference = {
    __cReference: true,
    get value() { return SCRAP6____header_global_ffc40c733c472885; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:625
export const SCRAP1____header_global_e796ffbeed7430a3 = ((((((2400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e47879de9fec9a2c72baa840() {
  return __cxx_static_address_e47879de9fec9a2c72baa840.reference || (__cxx_static_address_e47879de9fec9a2c72baa840.reference = {
    __cReference: true,
    get value() { return SCRAP1____header_global_e796ffbeed7430a3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:626
export const SCRAP2____header_global_3d510cf89dfb751c = ((((((2404) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8fcddddff8178db6fa39212b() {
  return __cxx_static_address_8fcddddff8178db6fa39212b.reference || (__cxx_static_address_8fcddddff8178db6fa39212b.reference = {
    __cReference: true,
    get value() { return SCRAP2____header_global_3d510cf89dfb751c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:627
export const SCRAP3____header_global_e7996df56b41d897 = ((((((2408) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e7e27264de611cc192179807() {
  return __cxx_static_address_e7e27264de611cc192179807.reference || (__cxx_static_address_e7e27264de611cc192179807.reference = {
    __cReference: true,
    get value() { return SCRAP3____header_global_e7996df56b41d897; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:628
export const SCRAP4____header_global_4859950052210cce = ((((((2412) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e354667d67ba529ba82e937e() {
  return __cxx_static_address_e354667d67ba529ba82e937e.reference || (__cxx_static_address_e354667d67ba529ba82e937e.reference = {
    __cReference: true,
    get value() { return SCRAP4____header_global_4859950052210cce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:629
export const SCRAP5____header_global_943ea1fd3df5ad0b = ((((((2416) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d2d2765de8c4fe62d8b0f116() {
  return __cxx_static_address_d2d2765de8c4fe62d8b0f116.reference || (__cxx_static_address_d2d2765de8c4fe62d8b0f116.reference = {
    __cReference: true,
    get value() { return SCRAP5____header_global_943ea1fd3df5ad0b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:630
export const ORGANTIC____header_global_4d2f1a591b76ba7a = ((((((2420) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_43a2e99c4504d414bd9e11cb() {
  return __cxx_static_address_43a2e99c4504d414bd9e11cb.reference || (__cxx_static_address_43a2e99c4504d414bd9e11cb.reference = {
    __cReference: true,
    get value() { return ORGANTIC____header_global_4d2f1a591b76ba7a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:631
export const BETAVERSION____header_global_6124aa4a63a82e16 = ((((((2440) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a1c5ca2b96df3242dcb65f3e() {
  return __cxx_static_address_a1c5ca2b96df3242dcb65f3e.reference || (__cxx_static_address_a1c5ca2b96df3242dcb65f3e.reference = {
    __cReference: true,
    get value() { return BETAVERSION____header_global_6124aa4a63a82e16; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:632
export const SELECTDIR____header_global_14ea72417a05b61d = ((((((2444) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1b6d59072afa2c52b7cbaffc() {
  return __cxx_static_address_1b6d59072afa2c52b7cbaffc.reference || (__cxx_static_address_1b6d59072afa2c52b7cbaffc.reference = {
    __cReference: true,
    get value() { return SELECTDIR____header_global_14ea72417a05b61d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:633
export const F1HELP____header_global_7c8314acbc014baf = ((((((2445) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f1cad62bf48c3af17b09389c() {
  return __cxx_static_address_f1cad62bf48c3af17b09389c.reference || (__cxx_static_address_f1cad62bf48c3af17b09389c.reference = {
    __cReference: true,
    get value() { return F1HELP____header_global_7c8314acbc014baf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:634
export const GROWSPARK____header_global_38cc686efe99f70c = ((((((2448) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_01e2ebb78ca8a089890bfa40() {
  return __cxx_static_address_01e2ebb78ca8a089890bfa40.reference || (__cxx_static_address_01e2ebb78ca8a089890bfa40.reference = {
    __cReference: true,
    get value() { return GROWSPARK____header_global_38cc686efe99f70c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:635
export const MENUSCREEN____header_global_7db127c2936f9fca = ((((((2456) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6a76a93425b530580ce8defe() {
  return __cxx_static_address_6a76a93425b530580ce8defe.reference || (__cxx_static_address_6a76a93425b530580ce8defe.reference = {
    __cReference: true,
    get value() { return MENUSCREEN____header_global_7db127c2936f9fca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:636
export const MENUBAR____header_global_4c00095f714adbaa = ((((((2457) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_db0e898e8c029e1c99845a37() {
  return __cxx_static_address_db0e898e8c029e1c99845a37.reference || (__cxx_static_address_db0e898e8c029e1c99845a37.reference = {
    __cReference: true,
    get value() { return MENUBAR____header_global_4c00095f714adbaa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:637
export const KILLSICON____header_global_8e9f1029cacfd7a1 = ((((((2458) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b76869cb7ba27069ff2ec51a() {
  return __cxx_static_address_b76869cb7ba27069ff2ec51a.reference || (__cxx_static_address_b76869cb7ba27069ff2ec51a.reference = {
    __cReference: true,
    get value() { return KILLSICON____header_global_8e9f1029cacfd7a1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:638
export const FIRSTAID_ICON____header_global_6727536bfcb6da9d = ((((((2460) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0ea69073779f122f0480b3a1() {
  return __cxx_static_address_0ea69073779f122f0480b3a1.reference || (__cxx_static_address_0ea69073779f122f0480b3a1.reference = {
    __cReference: true,
    get value() { return FIRSTAID_ICON____header_global_6727536bfcb6da9d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:639
export const HEAT_ICON____header_global_20e9a25a366c3c39 = ((((((2461) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f73f86994b017284a83d6b72() {
  return __cxx_static_address_f73f86994b017284a83d6b72.reference || (__cxx_static_address_f73f86994b017284a83d6b72.reference = {
    __cReference: true,
    get value() { return HEAT_ICON____header_global_20e9a25a366c3c39; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:640
export const BOTTOMSTATUSBAR____header_global_be255fe87a3c9343 = ((((((2462) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e162029ea853748e99eda369() {
  return __cxx_static_address_e162029ea853748e99eda369.reference || (__cxx_static_address_e162029ea853748e99eda369.reference = {
    __cReference: true,
    get value() { return BOTTOMSTATUSBAR____header_global_be255fe87a3c9343; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:641
export const BOOT_ICON____header_global_a989e37f9dd19629 = ((((((2463) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_022d288a3cd65c928d01059b() {
  return __cxx_static_address_022d288a3cd65c928d01059b.reference || (__cxx_static_address_022d288a3cd65c928d01059b.reference = {
    __cReference: true,
    get value() { return BOOT_ICON____header_global_a989e37f9dd19629; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:642
export const FRAGBAR____header_global_163c18fd5f26ff00 = ((((((2465) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_855f9b0e4e885a2e3a282ca0() {
  return __cxx_static_address_855f9b0e4e885a2e3a282ca0.reference || (__cxx_static_address_855f9b0e4e885a2e3a282ca0.reference = {
    __cReference: true,
    get value() { return FRAGBAR____header_global_163c18fd5f26ff00; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:643
export const JETPACK_ICON____header_global_ff75931bb4a01a1a = ((((((2467) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4e7c96d96644c422793c4bf4() {
  return __cxx_static_address_4e7c96d96644c422793c4bf4.reference || (__cxx_static_address_4e7c96d96644c422793c4bf4.reference = {
    __cReference: true,
    get value() { return JETPACK_ICON____header_global_ff75931bb4a01a1a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:644
export const AIRTANK_ICON____header_global_4af300434d42f05a = ((((((2468) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8771ff70c407fdd5fab489a2() {
  return __cxx_static_address_8771ff70c407fdd5fab489a2.reference || (__cxx_static_address_8771ff70c407fdd5fab489a2.reference = {
    __cReference: true,
    get value() { return AIRTANK_ICON____header_global_4af300434d42f05a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:645
export const STEROIDS_ICON____header_global_afa1ae07c585856a = ((((((2469) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fec699afe768f07028ecc551() {
  return __cxx_static_address_fec699afe768f07028ecc551.reference || (__cxx_static_address_fec699afe768f07028ecc551.reference = {
    __cReference: true,
    get value() { return STEROIDS_ICON____header_global_afa1ae07c585856a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:646
export const HOLODUKE_ICON____header_global_0aac4f0121328e4f = ((((((2470) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f25f499987949dda58131cb6() {
  return __cxx_static_address_f25f499987949dda58131cb6.reference || (__cxx_static_address_f25f499987949dda58131cb6.reference = {
    __cReference: true,
    get value() { return HOLODUKE_ICON____header_global_0aac4f0121328e4f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:647
export const ACCESS_ICON____header_global_ac6714586dde5396 = ((((((2471) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_464541cf1efb90453d81ad0b() {
  return __cxx_static_address_464541cf1efb90453d81ad0b.reference || (__cxx_static_address_464541cf1efb90453d81ad0b.reference = {
    __cReference: true,
    get value() { return ACCESS_ICON____header_global_ac6714586dde5396; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:648
export const DIGITALNUM____header_global_17e257d1e2bf8f14 = ((((((2472) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_124d79499a60f89c45b88d85() {
  return __cxx_static_address_124d79499a60f89c45b88d85.reference || (__cxx_static_address_124d79499a60f89c45b88d85.reference = {
    __cReference: true,
    get value() { return DIGITALNUM____header_global_17e257d1e2bf8f14; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:649
export const DUKECAR____header_global_7cb3eeaa49914b82 = ((((((2491) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3a18dc62b29c69ec21ef31db() {
  return __cxx_static_address_3a18dc62b29c69ec21ef31db.reference || (__cxx_static_address_3a18dc62b29c69ec21ef31db.reference = {
    __cReference: true,
    get value() { return DUKECAR____header_global_7cb3eeaa49914b82; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:650
export const CAMCORNER____header_global_66b2801c376f2952 = ((((((2482) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9dcc563478b5e31bfb3e55a3() {
  return __cxx_static_address_9dcc563478b5e31bfb3e55a3.reference || (__cxx_static_address_9dcc563478b5e31bfb3e55a3.reference = {
    __cReference: true,
    get value() { return CAMCORNER____header_global_66b2801c376f2952; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:651
export const CAMLIGHT____header_global_765df622d33c9a94 = ((((((2484) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bb8d928685c1b86581c0a3d7() {
  return __cxx_static_address_bb8d928685c1b86581c0a3d7.reference || (__cxx_static_address_bb8d928685c1b86581c0a3d7.reference = {
    __cReference: true,
    get value() { return CAMLIGHT____header_global_765df622d33c9a94; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:652
export const SLIDEBAR____header_global_4bface8a296d99cd = ((((((2489) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_395ad1955063211fe3180452() {
  return __cxx_static_address_395ad1955063211fe3180452.reference || (__cxx_static_address_395ad1955063211fe3180452.reference = {
    __cReference: true,
    get value() { return SLIDEBAR____header_global_4bface8a296d99cd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:653
export const DREALMS____header_global_7e60f9e4fbb6fbed = ((((((2492) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_89795c1439a0cd5672c194c4() {
  return __cxx_static_address_89795c1439a0cd5672c194c4.reference || (__cxx_static_address_89795c1439a0cd5672c194c4.reference = {
    __cReference: true,
    get value() { return DREALMS____header_global_7e60f9e4fbb6fbed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:654
export const BETASCREEN____header_global_3ad8ec890df56619 = ((((((2493) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_010fbd6ea616e1f8697e6f72() {
  return __cxx_static_address_010fbd6ea616e1f8697e6f72.reference || (__cxx_static_address_010fbd6ea616e1f8697e6f72.reference = {
    __cReference: true,
    get value() { return BETASCREEN____header_global_3ad8ec890df56619; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:655
export const WINDOWBORDER1____header_global_ace9631144b6819a = ((((((2494) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5bc97f2fdb4035684ed5b2f6() {
  return __cxx_static_address_5bc97f2fdb4035684ed5b2f6.reference || (__cxx_static_address_5bc97f2fdb4035684ed5b2f6.reference = {
    __cReference: true,
    get value() { return WINDOWBORDER1____header_global_ace9631144b6819a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:656
export const TEXTBOX____header_global_177ba94f33bb74ee = ((((((2495) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ce14c7733e8bbd338beb662c() {
  return __cxx_static_address_ce14c7733e8bbd338beb662c.reference || (__cxx_static_address_ce14c7733e8bbd338beb662c.reference = {
    __cReference: true,
    get value() { return TEXTBOX____header_global_177ba94f33bb74ee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:657
export const WINDOWBORDER2____header_global_20752b85bb457439 = ((((((2496) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3c9935efa4376616c3c51e2d() {
  return __cxx_static_address_3c9935efa4376616c3c51e2d.reference || (__cxx_static_address_3c9935efa4376616c3c51e2d.reference = {
    __cReference: true,
    get value() { return WINDOWBORDER2____header_global_20752b85bb457439; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:658
export const DUKENUKEM____header_global_41b920842be6a394 = ((((((2497) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_27da7e32274be2fcbd892c2a() {
  return __cxx_static_address_27da7e32274be2fcbd892c2a.reference || (__cxx_static_address_27da7e32274be2fcbd892c2a.reference = {
    __cReference: true,
    get value() { return DUKENUKEM____header_global_41b920842be6a394; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:659
export const THREEDEE____header_global_5e4d9b2406c9f809 = ((((((2498) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e1718ea061fe43c1d4c7715a() {
  return __cxx_static_address_e1718ea061fe43c1d4c7715a.reference || (__cxx_static_address_e1718ea061fe43c1d4c7715a.reference = {
    __cReference: true,
    get value() { return THREEDEE____header_global_5e4d9b2406c9f809; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:660
export const INGAMEDUKETHREEDEE____header_global_c742df94bacb83a4 = ((((((2499) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b958eff160e9336183cffbce() {
  return __cxx_static_address_b958eff160e9336183cffbce.reference || (__cxx_static_address_b958eff160e9336183cffbce.reference = {
    __cReference: true,
    get value() { return INGAMEDUKETHREEDEE____header_global_c742df94bacb83a4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:661
export const TENSCREEN____header_global_8adb837d59e11d1e = ((((((2500) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_354eb5eeaf4916ac99870419() {
  return __cxx_static_address_354eb5eeaf4916ac99870419.reference || (__cxx_static_address_354eb5eeaf4916ac99870419.reference = {
    __cReference: true,
    get value() { return TENSCREEN____header_global_8adb837d59e11d1e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:662
export const PLUTOPAKSPRITE____header_global_3f0d7a6b7bdb98cd = ((((((2501) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cb4a3759e8c5378ead25f97d() {
  return __cxx_static_address_cb4a3759e8c5378ead25f97d.reference || (__cxx_static_address_cb4a3759e8c5378ead25f97d.reference = {
    __cReference: true,
    get value() { return PLUTOPAKSPRITE____header_global_3f0d7a6b7bdb98cd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:663
export const DEVISTATOR____header_global_b15786fce4c0bd3f = ((((((2510) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3e04ddcb2f4bd85d927eb9f2() {
  return __cxx_static_address_3e04ddcb2f4bd85d927eb9f2.reference || (__cxx_static_address_3e04ddcb2f4bd85d927eb9f2.reference = {
    __cReference: true,
    get value() { return DEVISTATOR____header_global_b15786fce4c0bd3f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:664
export const KNEE____header_global_9d629596ceed5559 = ((((((2521) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6e194e7178a5debf091cd28d() {
  return __cxx_static_address_6e194e7178a5debf091cd28d.reference || (__cxx_static_address_6e194e7178a5debf091cd28d.reference = {
    __cReference: true,
    get value() { return KNEE____header_global_9d629596ceed5559; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:665
export const CROSSHAIR____header_global_563d3b2b83e7f0e5 = ((((((2523) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8f367db05117fbb713aff620() {
  return __cxx_static_address_8f367db05117fbb713aff620.reference || (__cxx_static_address_8f367db05117fbb713aff620.reference = {
    __cReference: true,
    get value() { return CROSSHAIR____header_global_563d3b2b83e7f0e5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:666
export const FIRSTGUN____header_global_0987e6e803c2b10b = ((((((2524) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d77b8c05481ed082bcec66ba() {
  return __cxx_static_address_d77b8c05481ed082bcec66ba.reference || (__cxx_static_address_d77b8c05481ed082bcec66ba.reference = {
    __cReference: true,
    get value() { return FIRSTGUN____header_global_0987e6e803c2b10b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:667
export const FIRSTGUNRELOAD____header_global_2280b391a83c4c32 = ((((((2528) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7093ca210153a48e80d805f6() {
  return __cxx_static_address_7093ca210153a48e80d805f6.reference || (__cxx_static_address_7093ca210153a48e80d805f6.reference = {
    __cReference: true,
    get value() { return FIRSTGUNRELOAD____header_global_2280b391a83c4c32; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:668
export const SHELL____header_global_2a6cd972197b3243 = ((((((2533) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_da469efff0b97c9ca0a13770() {
  return __cxx_static_address_da469efff0b97c9ca0a13770.reference || (__cxx_static_address_da469efff0b97c9ca0a13770.reference = {
    __cReference: true,
    get value() { return SHELL____header_global_2a6cd972197b3243; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:669
export const SHOTGUNSHELL____header_global_a2f5d6a4cf85e52d = ((((((2535) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7e286a72641e86fc9b78ba22() {
  return __cxx_static_address_7e286a72641e86fc9b78ba22.reference || (__cxx_static_address_7e286a72641e86fc9b78ba22.reference = {
    __cReference: true,
    get value() { return SHOTGUNSHELL____header_global_a2f5d6a4cf85e52d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:670
export const CHAINGUN____header_global_9fa91598761cb757 = ((((((2536) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f16c18174976274a56435f9f() {
  return __cxx_static_address_f16c18174976274a56435f9f.reference || (__cxx_static_address_f16c18174976274a56435f9f.reference = {
    __cReference: true,
    get value() { return CHAINGUN____header_global_9fa91598761cb757; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:671
export const RPGGUN____header_global_97cd0adee44d84b6 = ((((((2544) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6d1b8b3564bc5a4fb620d2d6() {
  return __cxx_static_address_6d1b8b3564bc5a4fb620d2d6.reference || (__cxx_static_address_6d1b8b3564bc5a4fb620d2d6.reference = {
    __cReference: true,
    get value() { return RPGGUN____header_global_97cd0adee44d84b6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:672
export const FREEZE____header_global_c499d99d7de1f0dd = ((((((2548) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_49762acd52da3192a915ec05() {
  return __cxx_static_address_49762acd52da3192a915ec05.reference || (__cxx_static_address_49762acd52da3192a915ec05.reference = {
    __cReference: true,
    get value() { return FREEZE____header_global_c499d99d7de1f0dd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:673
export const SHRINKER____header_global_c3e3564a402ed2b4 = ((((((2556) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9e1a958034808f3d56f87d78() {
  return __cxx_static_address_9e1a958034808f3d56f87d78.reference || (__cxx_static_address_9e1a958034808f3d56f87d78.reference = {
    __cReference: true,
    get value() { return SHRINKER____header_global_c3e3564a402ed2b4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:674
export const HANDHOLDINGLASER____header_global_4d8e366c4b389cd7 = ((((((2563) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_78e55404a82f71ec438b3963() {
  return __cxx_static_address_78e55404a82f71ec438b3963.reference || (__cxx_static_address_78e55404a82f71ec438b3963.reference = {
    __cReference: true,
    get value() { return HANDHOLDINGLASER____header_global_4d8e366c4b389cd7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:675
export const TRIPBOMB____header_global_336fbd019c37b6dc = ((((((2566) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5010f6e52a96c0dc55712980() {
  return __cxx_static_address_5010f6e52a96c0dc55712980.reference || (__cxx_static_address_5010f6e52a96c0dc55712980.reference = {
    __cReference: true,
    get value() { return TRIPBOMB____header_global_336fbd019c37b6dc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:676
export const LASERLINE____header_global_e88c1b6726fe41b2 = ((((((2567) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_419f4f111aeec5f3e5b7aafe() {
  return __cxx_static_address_419f4f111aeec5f3e5b7aafe.reference || (__cxx_static_address_419f4f111aeec5f3e5b7aafe.reference = {
    __cReference: true,
    get value() { return LASERLINE____header_global_e88c1b6726fe41b2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:677
export const HANDHOLDINGACCESS____header_global_22d4ee0ca974f47c = ((((((2568) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_87f8fd650c81f522bab14cce() {
  return __cxx_static_address_87f8fd650c81f522bab14cce.reference || (__cxx_static_address_87f8fd650c81f522bab14cce.reference = {
    __cReference: true,
    get value() { return HANDHOLDINGACCESS____header_global_22d4ee0ca974f47c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:678
export const HANDREMOTE____header_global_89d3d71b614e4737 = ((((((2570) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_627aeb802df6a4d37bb2ecfb() {
  return __cxx_static_address_627aeb802df6a4d37bb2ecfb.reference || (__cxx_static_address_627aeb802df6a4d37bb2ecfb.reference = {
    __cReference: true,
    get value() { return HANDREMOTE____header_global_89d3d71b614e4737; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:679
export const HANDTHROW____header_global_4114b856838236f5 = ((((((2573) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6a8a368ba59b98dba124fe15() {
  return __cxx_static_address_6a8a368ba59b98dba124fe15.reference || (__cxx_static_address_6a8a368ba59b98dba124fe15.reference = {
    __cReference: true,
    get value() { return HANDTHROW____header_global_4114b856838236f5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:680
export const TIP____header_global_3f46558901ed257a = ((((((2576) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8521b7e4c019c82e5b95deea() {
  return __cxx_static_address_8521b7e4c019c82e5b95deea.reference || (__cxx_static_address_8521b7e4c019c82e5b95deea.reference = {
    __cReference: true,
    get value() { return TIP____header_global_3f46558901ed257a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:681
export const SCUBAMASK____header_global_57c142d59d1321bf = ((((((2581) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f64e072e98788caa61dbdb50() {
  return __cxx_static_address_f64e072e98788caa61dbdb50.reference || (__cxx_static_address_f64e072e98788caa61dbdb50.reference = {
    __cReference: true,
    get value() { return SCUBAMASK____header_global_57c142d59d1321bf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:682
export const FORCESPHERE____header_global_47ffbbe80ecb4851 = ((((((2590) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e9114cbb3c8a5ade0f006aa1() {
  return __cxx_static_address_e9114cbb3c8a5ade0f006aa1.reference || (__cxx_static_address_e9114cbb3c8a5ade0f006aa1.reference = {
    __cReference: true,
    get value() { return FORCESPHERE____header_global_47ffbbe80ecb4851; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:683
export const SHOTSPARK1____header_global_dedc995ecf0d289f = ((((((2595) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d8ed2da08477db551a74499f() {
  return __cxx_static_address_d8ed2da08477db551a74499f.reference || (__cxx_static_address_d8ed2da08477db551a74499f.reference = {
    __cReference: true,
    get value() { return SHOTSPARK1____header_global_dedc995ecf0d289f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:684
export const RPG____header_global_97bd35ece47076dd = ((((((2605) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_94163378ab3f49126addd1ba() {
  return __cxx_static_address_94163378ab3f49126addd1ba.reference || (__cxx_static_address_94163378ab3f49126addd1ba.reference = {
    __cReference: true,
    get value() { return RPG____header_global_97bd35ece47076dd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:685
export const LASERSITE____header_global_5270a9d72e1e5fac = ((((((2612) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ebb28238dbe923ab4f88c822() {
  return __cxx_static_address_ebb28238dbe923ab4f88c822.reference || (__cxx_static_address_ebb28238dbe923ab4f88c822.reference = {
    __cReference: true,
    get value() { return LASERSITE____header_global_5270a9d72e1e5fac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:686
export const SHOTGUN____header_global_e6b2acead1aec60a = ((((((2613) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a864a6a6f6b8d7ce4e9f8cba() {
  return __cxx_static_address_a864a6a6f6b8d7ce4e9f8cba.reference || (__cxx_static_address_a864a6a6f6b8d7ce4e9f8cba.reference = {
    __cReference: true,
    get value() { return SHOTGUN____header_global_e6b2acead1aec60a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:687
export const BOSS1____header_global_f9a01ced695a6232 = ((((((2630) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9ac528ba576df22526459780() {
  return __cxx_static_address_9ac528ba576df22526459780.reference || (__cxx_static_address_9ac528ba576df22526459780.reference = {
    __cReference: true,
    get value() { return BOSS1____header_global_f9a01ced695a6232; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:688
export const BOSS1STAYPUT____header_global_28eadfdcd2d43115 = ((((((2631) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9ab0815a3521d2ec52300e3b() {
  return __cxx_static_address_9ab0815a3521d2ec52300e3b.reference || (__cxx_static_address_9ab0815a3521d2ec52300e3b.reference = {
    __cReference: true,
    get value() { return BOSS1STAYPUT____header_global_28eadfdcd2d43115; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:689
export const BOSS1SHOOT____header_global_338d6a06de6743f2 = ((((((2660) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fdfeaa8a954fba772af79e55() {
  return __cxx_static_address_fdfeaa8a954fba772af79e55.reference || (__cxx_static_address_fdfeaa8a954fba772af79e55.reference = {
    __cReference: true,
    get value() { return BOSS1SHOOT____header_global_338d6a06de6743f2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:690
export const BOSS1LOB____header_global_8729d23102b1edd7 = ((((((2670) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0df5751f5719bcb4826341c6() {
  return __cxx_static_address_0df5751f5719bcb4826341c6.reference || (__cxx_static_address_0df5751f5719bcb4826341c6.reference = {
    __cReference: true,
    get value() { return BOSS1LOB____header_global_8729d23102b1edd7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:691
export const BOSSTOP____header_global_88d7221f71cb11a9 = ((((((2696) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5cfde495d6f83016b4bb4f92() {
  return __cxx_static_address_5cfde495d6f83016b4bb4f92.reference || (__cxx_static_address_5cfde495d6f83016b4bb4f92.reference = {
    __cReference: true,
    get value() { return BOSSTOP____header_global_88d7221f71cb11a9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:692
export const BOSS2____header_global_49d0f6f221186e31 = ((((((2710) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9141503846c169b49f193f8d() {
  return __cxx_static_address_9141503846c169b49f193f8d.reference || (__cxx_static_address_9141503846c169b49f193f8d.reference = {
    __cReference: true,
    get value() { return BOSS2____header_global_49d0f6f221186e31; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:693
export const BOSS3____header_global_f7f3df83b58abf98 = ((((((2760) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_558e0779abdfa435183079a6() {
  return __cxx_static_address_558e0779abdfa435183079a6.reference || (__cxx_static_address_558e0779abdfa435183079a6.reference = {
    __cReference: true,
    get value() { return BOSS3____header_global_f7f3df83b58abf98; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:694
export const SPINNINGNUKEICON____header_global_2ad19879ee739b54 = ((((((2813) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c6186b068f3fa424954e48b0() {
  return __cxx_static_address_c6186b068f3fa424954e48b0.reference || (__cxx_static_address_c6186b068f3fa424954e48b0.reference = {
    __cReference: true,
    get value() { return SPINNINGNUKEICON____header_global_2ad19879ee739b54; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:695
export const SMALLFNTCURSOR____header_global_b08fcc05559402c5 = ((((((2821) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_056f8325a6c90803f7f441d4() {
  return __cxx_static_address_056f8325a6c90803f7f441d4.reference || (__cxx_static_address_056f8325a6c90803f7f441d4.reference = {
    __cReference: true,
    get value() { return SMALLFNTCURSOR____header_global_b08fcc05559402c5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:696
export const STARTALPHANUM____header_global_24a82f8e771742e6 = ((((((2822) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_028506febc089d86168b420a() {
  return __cxx_static_address_028506febc089d86168b420a.reference || (__cxx_static_address_028506febc089d86168b420a.reference = {
    __cReference: true,
    get value() { return STARTALPHANUM____header_global_24a82f8e771742e6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:697
export const ENDALPHANUM____header_global_69eb4c406caa0ff7 = ((((((2915) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6709e9dd01f84804b96930cc() {
  return __cxx_static_address_6709e9dd01f84804b96930cc.reference || (__cxx_static_address_6709e9dd01f84804b96930cc.reference = {
    __cReference: true,
    get value() { return ENDALPHANUM____header_global_69eb4c406caa0ff7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:698
export const BIGALPHANUM____header_global_f8acc2a7f6a96ad6 = ((((((2940) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1c3eb5b3263afc953d5c3e5c() {
  return __cxx_static_address_1c3eb5b3263afc953d5c3e5c.reference || (__cxx_static_address_1c3eb5b3263afc953d5c3e5c.reference = {
    __cReference: true,
    get value() { return BIGALPHANUM____header_global_f8acc2a7f6a96ad6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:699
export const BIGPERIOD____header_global_0ff4fa9aa20ab58d = ((((((3002) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_70f0ff50d4f6894005d01ded() {
  return __cxx_static_address_70f0ff50d4f6894005d01ded.reference || (__cxx_static_address_70f0ff50d4f6894005d01ded.reference = {
    __cReference: true,
    get value() { return BIGPERIOD____header_global_0ff4fa9aa20ab58d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:700
export const BIGCOMMA____header_global_be32715f66181747 = ((((((3003) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_73058a8fa0d033a1446800c8() {
  return __cxx_static_address_73058a8fa0d033a1446800c8.reference || (__cxx_static_address_73058a8fa0d033a1446800c8.reference = {
    __cReference: true,
    get value() { return BIGCOMMA____header_global_be32715f66181747; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:701
export const BIGX____header_global_269df37931f3a9ae = ((((((3004) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_47247e7d0c4c38e84540e324() {
  return __cxx_static_address_47247e7d0c4c38e84540e324.reference || (__cxx_static_address_47247e7d0c4c38e84540e324.reference = {
    __cReference: true,
    get value() { return BIGX____header_global_269df37931f3a9ae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:702
export const BIGQ____header_global_99efd1a17ce1ff2c = ((((((3005) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5bf34bfda208b06bbe813666() {
  return __cxx_static_address_5bf34bfda208b06bbe813666.reference || (__cxx_static_address_5bf34bfda208b06bbe813666.reference = {
    __cReference: true,
    get value() { return BIGQ____header_global_99efd1a17ce1ff2c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:703
export const BIGSEMI____header_global_df3b448601fa64f8 = ((((((3006) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a20350d773c3cc83f03df152() {
  return __cxx_static_address_a20350d773c3cc83f03df152.reference || (__cxx_static_address_a20350d773c3cc83f03df152.reference = {
    __cReference: true,
    get value() { return BIGSEMI____header_global_df3b448601fa64f8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:704
export const BIGCOLIN____header_global_6cd47a0ae94c1495 = ((((((3007) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c45cbcab1b28b7f63e87fd83() {
  return __cxx_static_address_c45cbcab1b28b7f63e87fd83.reference || (__cxx_static_address_c45cbcab1b28b7f63e87fd83.reference = {
    __cReference: true,
    get value() { return BIGCOLIN____header_global_6cd47a0ae94c1495; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:705
export const THREEBYFIVE____header_global_bcf2240e08b34890 = ((((((3010) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_58d38c354d57c5aaa94dc256() {
  return __cxx_static_address_58d38c354d57c5aaa94dc256.reference || (__cxx_static_address_58d38c354d57c5aaa94dc256.reference = {
    __cReference: true,
    get value() { return THREEBYFIVE____header_global_bcf2240e08b34890; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:706
export const BIGAPPOS____header_global_4cd891f3e36b779d = ((((((3022) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b3191b6a85adda6a22c011af() {
  return __cxx_static_address_b3191b6a85adda6a22c011af.reference || (__cxx_static_address_b3191b6a85adda6a22c011af.reference = {
    __cReference: true,
    get value() { return BIGAPPOS____header_global_4cd891f3e36b779d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:707
export const MINIFONT____header_global_9f2b0de758221d55 = ((((((3072) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_891aa92df46b51ebb7acc9c7() {
  return __cxx_static_address_891aa92df46b51ebb7acc9c7.reference || (__cxx_static_address_891aa92df46b51ebb7acc9c7.reference = {
    __cReference: true,
    get value() { return MINIFONT____header_global_9f2b0de758221d55; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:708
export const RESPAWNMARKERRED____header_global_72f7f260513d61db = ((((((3190) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eb9170dd0f8ee4f6a353f802() {
  return __cxx_static_address_eb9170dd0f8ee4f6a353f802.reference || (__cxx_static_address_eb9170dd0f8ee4f6a353f802.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERRED____header_global_72f7f260513d61db; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:709
export const RESPAWNMARKERYELLOW____header_global_720d7250a8e99593 = ((((((3200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_15bd406f4935e2c6e02854bd() {
  return __cxx_static_address_15bd406f4935e2c6e02854bd.reference || (__cxx_static_address_15bd406f4935e2c6e02854bd.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERYELLOW____header_global_720d7250a8e99593; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:710
export const RESPAWNMARKERGREEN____header_global_0bb6a597fc029d28 = ((((((3210) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_60f3e6de5a34868903e7283e() {
  return __cxx_static_address_60f3e6de5a34868903e7283e.reference || (__cxx_static_address_60f3e6de5a34868903e7283e.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERGREEN____header_global_0bb6a597fc029d28; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:711
export const BONUSSCREEN____header_global_d8397756d52ec79c = ((((((3240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_85ccf27b4a4e3b4a4aa9f743() {
  return __cxx_static_address_85ccf27b4a4e3b4a4aa9f743.reference || (__cxx_static_address_85ccf27b4a4e3b4a4aa9f743.reference = {
    __cReference: true,
    get value() { return BONUSSCREEN____header_global_d8397756d52ec79c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:712
export const VIEWBORDER____header_global_9decf9e2a7b24fcb = ((((((3250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_93c235d6d52ff4017381b913() {
  return __cxx_static_address_93c235d6d52ff4017381b913.reference || (__cxx_static_address_93c235d6d52ff4017381b913.reference = {
    __cReference: true,
    get value() { return VIEWBORDER____header_global_9decf9e2a7b24fcb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:713
export const VICTORY1____header_global_ffec02d344185fba = ((((((3260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e7453c8587c9860a2310a7a6() {
  return __cxx_static_address_e7453c8587c9860a2310a7a6.reference || (__cxx_static_address_e7453c8587c9860a2310a7a6.reference = {
    __cReference: true,
    get value() { return VICTORY1____header_global_ffec02d344185fba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:714
export const ORDERING____header_global_d0dc0be47a7b0441 = ((((((3270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ccd93ff91826ce7e21cae433() {
  return __cxx_static_address_ccd93ff91826ce7e21cae433.reference || (__cxx_static_address_ccd93ff91826ce7e21cae433.reference = {
    __cReference: true,
    get value() { return ORDERING____header_global_d0dc0be47a7b0441; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:715
export const TEXTSTORY____header_global_649ed148b1c3545d = ((((((3280) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5642f6490c76990bbd2ba509() {
  return __cxx_static_address_5642f6490c76990bbd2ba509.reference || (__cxx_static_address_5642f6490c76990bbd2ba509.reference = {
    __cReference: true,
    get value() { return TEXTSTORY____header_global_649ed148b1c3545d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:716
export const LOADSCREEN____header_global_688f98af17605ef4 = ((((((3281) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e4000b1ebe8c5240b5e72139() {
  return __cxx_static_address_e4000b1ebe8c5240b5e72139.reference || (__cxx_static_address_e4000b1ebe8c5240b5e72139.reference = {
    __cReference: true,
    get value() { return LOADSCREEN____header_global_688f98af17605ef4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:717
export const BORNTOBEWILDSCREEN____header_global_4bbfd6c9db01ef37 = ((((((3370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0f0dbf308ef0d13a021fe80d() {
  return __cxx_static_address_0f0dbf308ef0d13a021fe80d.reference || (__cxx_static_address_0f0dbf308ef0d13a021fe80d.reference = {
    __cReference: true,
    get value() { return BORNTOBEWILDSCREEN____header_global_4bbfd6c9db01ef37; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:718
export const BLIMP____header_global_c89f7671ff8ae206 = ((((((3400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1f71c4637ce53e0ef211b3e6() {
  return __cxx_static_address_1f71c4637ce53e0ef211b3e6.reference || (__cxx_static_address_1f71c4637ce53e0ef211b3e6.reference = {
    __cReference: true,
    get value() { return BLIMP____header_global_c89f7671ff8ae206; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:719
export const FEM9____header_global_7f5bf24344a06d81 = ((((((3450) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d6640703b7131bea8af6fc4c() {
  return __cxx_static_address_d6640703b7131bea8af6fc4c.reference || (__cxx_static_address_d6640703b7131bea8af6fc4c.reference = {
    __cReference: true,
    get value() { return FEM9____header_global_7f5bf24344a06d81; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:720
export const FRAMEEFFECT1_13____header_global_6d4c08eb99ccb845 = ((((((3999) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_53a64512fd1512d9dc88821f() {
  return __cxx_static_address_53a64512fd1512d9dc88821f.reference || (__cxx_static_address_53a64512fd1512d9dc88821f.reference = {
    __cReference: true,
    get value() { return FRAMEEFFECT1_13____header_global_6d4c08eb99ccb845; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:721
export const FRAMEEFFECT1____header_global_18c264e1499aca98 = ((((((4095) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_05dfd6b6e79847c83dfe67fc() {
  return __cxx_static_address_05dfd6b6e79847c83dfe67fc.reference || (__cxx_static_address_05dfd6b6e79847c83dfe67fc.reference = {
    __cReference: true,
    get value() { return FRAMEEFFECT1____header_global_18c264e1499aca98; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:722
export const PANNEL3____header_global_cb8054fb83526295 = ((((((4099) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_658ce5d3b040cbde02042bec() {
  return __cxx_static_address_658ce5d3b040cbde02042bec.reference || (__cxx_static_address_658ce5d3b040cbde02042bec.reference = {
    __cReference: true,
    get value() { return PANNEL3____header_global_cb8054fb83526295; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:723
export const SCREENBREAK14____header_global_562bfce5533d0aaf = ((((((4120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b40fd5648e27afaedb609562() {
  return __cxx_static_address_b40fd5648e27afaedb609562.reference || (__cxx_static_address_b40fd5648e27afaedb609562.reference = {
    __cReference: true,
    get value() { return SCREENBREAK14____header_global_562bfce5533d0aaf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:724
export const SCREENBREAK15____header_global_36e1f0de9d141a56 = ((((((4123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_610cccb258a06c7034639b8f() {
  return __cxx_static_address_610cccb258a06c7034639b8f.reference || (__cxx_static_address_610cccb258a06c7034639b8f.reference = {
    __cReference: true,
    get value() { return SCREENBREAK15____header_global_36e1f0de9d141a56; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:725
export const SCREENBREAK19____header_global_db04924aabf5d27c = ((((((4125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_26630a366d03774cf07eca9f() {
  return __cxx_static_address_26630a366d03774cf07eca9f.reference || (__cxx_static_address_26630a366d03774cf07eca9f.reference = {
    __cReference: true,
    get value() { return SCREENBREAK19____header_global_db04924aabf5d27c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:726
export const SCREENBREAK16____header_global_76cab3ea0086f520 = ((((((4127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_681bd2f03fe329b392b0ad77() {
  return __cxx_static_address_681bd2f03fe329b392b0ad77.reference || (__cxx_static_address_681bd2f03fe329b392b0ad77.reference = {
    __cReference: true,
    get value() { return SCREENBREAK16____header_global_76cab3ea0086f520; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:727
export const SCREENBREAK17____header_global_eb79025281f04605 = ((((((4128) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0e03b4fdf7b2480ecfbb6b50() {
  return __cxx_static_address_0e03b4fdf7b2480ecfbb6b50.reference || (__cxx_static_address_0e03b4fdf7b2480ecfbb6b50.reference = {
    __cReference: true,
    get value() { return SCREENBREAK17____header_global_eb79025281f04605; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:728
export const SCREENBREAK18____header_global_32bf93182da69f77 = ((((((4129) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3266c4b821cc2d487635d46c() {
  return __cxx_static_address_3266c4b821cc2d487635d46c.reference || (__cxx_static_address_3266c4b821cc2d487635d46c.reference = {
    __cReference: true,
    get value() { return SCREENBREAK18____header_global_32bf93182da69f77; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:729
export const W_TECHWALL11____header_global_9d26302e6d53d2ab = ((((((4130) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7d09630e2a87f4c711f76bf0() {
  return __cxx_static_address_7d09630e2a87f4c711f76bf0.reference || (__cxx_static_address_7d09630e2a87f4c711f76bf0.reference = {
    __cReference: true,
    get value() { return W_TECHWALL11____header_global_9d26302e6d53d2ab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:730
export const W_TECHWALL12____header_global_6b58dceffc6687af = ((((((4131) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4c3a3e14aff639bd67066aab() {
  return __cxx_static_address_4c3a3e14aff639bd67066aab.reference || (__cxx_static_address_4c3a3e14aff639bd67066aab.reference = {
    __cReference: true,
    get value() { return W_TECHWALL12____header_global_6b58dceffc6687af; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:731
export const W_TECHWALL13____header_global_703e7d8ae8a4414f = ((((((4132) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dcf2c51a68f8edfc73329453() {
  return __cxx_static_address_dcf2c51a68f8edfc73329453.reference || (__cxx_static_address_dcf2c51a68f8edfc73329453.reference = {
    __cReference: true,
    get value() { return W_TECHWALL13____header_global_703e7d8ae8a4414f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:732
export const W_TECHWALL14____header_global_d1d81b53a16fc34a = ((((((4133) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a1cb683f38c4467feeaa5a4b() {
  return __cxx_static_address_a1cb683f38c4467feeaa5a4b.reference || (__cxx_static_address_a1cb683f38c4467feeaa5a4b.reference = {
    __cReference: true,
    get value() { return W_TECHWALL14____header_global_d1d81b53a16fc34a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:733
export const W_TECHWALL5____header_global_85b565bef508cef9 = ((((((4134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_23df42195867a238c7bc294c() {
  return __cxx_static_address_23df42195867a238c7bc294c.reference || (__cxx_static_address_23df42195867a238c7bc294c.reference = {
    __cReference: true,
    get value() { return W_TECHWALL5____header_global_85b565bef508cef9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:734
export const W_TECHWALL6____header_global_924230b4dfb01d31 = ((((((4136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_48f6a6a828658092e7a55fb7() {
  return __cxx_static_address_48f6a6a828658092e7a55fb7.reference || (__cxx_static_address_48f6a6a828658092e7a55fb7.reference = {
    __cReference: true,
    get value() { return W_TECHWALL6____header_global_924230b4dfb01d31; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:735
export const W_TECHWALL7____header_global_a4fc73d1abcbf30d = ((((((4138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_02a8b25ab2cfdd65bb6196c9() {
  return __cxx_static_address_02a8b25ab2cfdd65bb6196c9.reference || (__cxx_static_address_02a8b25ab2cfdd65bb6196c9.reference = {
    __cReference: true,
    get value() { return W_TECHWALL7____header_global_a4fc73d1abcbf30d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:736
export const W_TECHWALL8____header_global_679427361c22dd57 = ((((((4140) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3f9fbfe666b06a6a0a7c598b() {
  return __cxx_static_address_3f9fbfe666b06a6a0a7c598b.reference || (__cxx_static_address_3f9fbfe666b06a6a0a7c598b.reference = {
    __cReference: true,
    get value() { return W_TECHWALL8____header_global_679427361c22dd57; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:737
export const W_TECHWALL9____header_global_c33eb4f3e1a10dea = ((((((4142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ea9f94200389ecc8440adeeb() {
  return __cxx_static_address_ea9f94200389ecc8440adeeb.reference || (__cxx_static_address_ea9f94200389ecc8440adeeb.reference = {
    __cReference: true,
    get value() { return W_TECHWALL9____header_global_c33eb4f3e1a10dea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:738
export const BPANNEL3____header_global_cfd35b27348330e3 = ((((((4100) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f7f30f5c4d019e87c9067649() {
  return __cxx_static_address_f7f30f5c4d019e87c9067649.reference || (__cxx_static_address_f7f30f5c4d019e87c9067649.reference = {
    __cReference: true,
    get value() { return BPANNEL3____header_global_cfd35b27348330e3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:739
export const W_HITTECHWALL16____header_global_bb28823fc6093ab2 = ((((((4144) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e3b545374cad28d696cc247a() {
  return __cxx_static_address_e3b545374cad28d696cc247a.reference || (__cxx_static_address_e3b545374cad28d696cc247a.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL16____header_global_bb28823fc6093ab2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:740
export const W_HITTECHWALL10____header_global_9ac8c05c4e0df046 = ((((((4145) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_27c1bebf2a9d9dc2aa35e1d7() {
  return __cxx_static_address_27c1bebf2a9d9dc2aa35e1d7.reference || (__cxx_static_address_27c1bebf2a9d9dc2aa35e1d7.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL10____header_global_9ac8c05c4e0df046; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:741
export const W_HITTECHWALL15____header_global_69aba5703ba0cbfb = ((((((4147) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_258fdda93f29279c7792c0fc() {
  return __cxx_static_address_258fdda93f29279c7792c0fc.reference || (__cxx_static_address_258fdda93f29279c7792c0fc.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL15____header_global_69aba5703ba0cbfb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:742
export const W_MILKSHELF____header_global_2153ca7757bf8ff9 = ((((((4181) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c7604db5377ba5f6e9f67669() {
  return __cxx_static_address_c7604db5377ba5f6e9f67669.reference || (__cxx_static_address_c7604db5377ba5f6e9f67669.reference = {
    __cReference: true,
    get value() { return W_MILKSHELF____header_global_2153ca7757bf8ff9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:743
export const W_MILKSHELFBROKE____header_global_6ed21e1376acb3e6 = ((((((4203) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7ef7be2b043295d45a389ea4() {
  return __cxx_static_address_7ef7be2b043295d45a389ea4.reference || (__cxx_static_address_7ef7be2b043295d45a389ea4.reference = {
    __cReference: true,
    get value() { return W_MILKSHELFBROKE____header_global_6ed21e1376acb3e6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:744
export const PURPLELAVA____header_global_863586957ef6c9f8 = ((((((4240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_933c282edf78c8a153c8dcce() {
  return __cxx_static_address_933c282edf78c8a153c8dcce.reference || (__cxx_static_address_933c282edf78c8a153c8dcce.reference = {
    __cReference: true,
    get value() { return PURPLELAVA____header_global_863586957ef6c9f8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:745
export const TARGET____header_global_bd85c0e0fd621a38 = ((((((4359) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4af21beb4f2b2a41b0e6b08f() {
  return __cxx_static_address_4af21beb4f2b2a41b0e6b08f.reference || (__cxx_static_address_4af21beb4f2b2a41b0e6b08f.reference = {
    __cReference: true,
    get value() { return TARGET____header_global_bd85c0e0fd621a38; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:746
export const DUCK____header_global_52c27978d6f0d258 = ((((((4361) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dbcc9a2d735db20edf83b6a1() {
  return __cxx_static_address_dbcc9a2d735db20edf83b6a1.reference || (__cxx_static_address_dbcc9a2d735db20edf83b6a1.reference = {
    __cReference: true,
    get value() { return DUCK____header_global_52c27978d6f0d258; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:747
export const PUKE____header_global_c139e41ae5a2f60d = ((((((4389) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3ed162ed8c5dd719049f5c3a() {
  return __cxx_static_address_3ed162ed8c5dd719049f5c3a.reference || (__cxx_static_address_3ed162ed8c5dd719049f5c3a.reference = {
    __cReference: true,
    get value() { return PUKE____header_global_c139e41ae5a2f60d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:748
export const DOORTILE23____header_global_7ed40c82db1fb82d = ((((((4391) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e9a89f5aa47fe65723e79e5b() {
  return __cxx_static_address_e9a89f5aa47fe65723e79e5b.reference || (__cxx_static_address_e9a89f5aa47fe65723e79e5b.reference = {
    __cReference: true,
    get value() { return DOORTILE23____header_global_7ed40c82db1fb82d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:749
export const SPEAKER____header_global_5a261074dde48119 = ((((((4397) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9e5318883afe7183e868e6f1() {
  return __cxx_static_address_9e5318883afe7183e868e6f1.reference || (__cxx_static_address_9e5318883afe7183e868e6f1.reference = {
    __cReference: true,
    get value() { return SPEAKER____header_global_5a261074dde48119; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:750
export const MAIL____header_global_8979be5fd3b1a7e5 = ((((((4410) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a3f91d9d98d113a8d30ea1e8() {
  return __cxx_static_address_a3f91d9d98d113a8d30ea1e8.reference || (__cxx_static_address_a3f91d9d98d113a8d30ea1e8.reference = {
    __cReference: true,
    get value() { return MAIL____header_global_8979be5fd3b1a7e5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:751
export const HOTMEAT____header_global_ce822bbd1a72c1cc = ((((((4427) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7b2ae6022a4e8dd92c923eb6() {
  return __cxx_static_address_7b2ae6022a4e8dd92c923eb6.reference || (__cxx_static_address_7b2ae6022a4e8dd92c923eb6.reference = {
    __cReference: true,
    get value() { return HOTMEAT____header_global_ce822bbd1a72c1cc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:752
export const TRIPODCAMERA____header_global_11ecd29a501212bb = ((((((4444) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_32763da88766c16f9ccc7894() {
  return __cxx_static_address_32763da88766c16f9ccc7894.reference || (__cxx_static_address_32763da88766c16f9ccc7894.reference = {
    __cReference: true,
    get value() { return TRIPODCAMERA____header_global_11ecd29a501212bb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:753
export const PAPER____header_global_c99ca4de2651a5a0 = ((((((4460) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1a6c432c235d8956ecba5e21() {
  return __cxx_static_address_1a6c432c235d8956ecba5e21.reference || (__cxx_static_address_1a6c432c235d8956ecba5e21.reference = {
    __cReference: true,
    get value() { return PAPER____header_global_c99ca4de2651a5a0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:754
export const GENERICPOLE2____header_global_2b1c4f42c462b8ce = ((((((4465) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bad875716a1918aec31037ff() {
  return __cxx_static_address_bad875716a1918aec31037ff.reference || (__cxx_static_address_bad875716a1918aec31037ff.reference = {
    __cReference: true,
    get value() { return GENERICPOLE2____header_global_2b1c4f42c462b8ce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:755
export const XXXSTACY____header_global_280527d95dc742b7 = ((((((4470) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cacb17614bd8bb7143b8206b() {
  return __cxx_static_address_cacb17614bd8bb7143b8206b.reference || (__cxx_static_address_cacb17614bd8bb7143b8206b.reference = {
    __cReference: true,
    get value() { return XXXSTACY____header_global_280527d95dc742b7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:756
export const LETTER____header_global_2dec70866bee1989 = ((((((4502) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0d9917b690fc9bd45224d471() {
  return __cxx_static_address_0d9917b690fc9bd45224d471.reference || (__cxx_static_address_0d9917b690fc9bd45224d471.reference = {
    __cReference: true,
    get value() { return LETTER____header_global_2dec70866bee1989; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:757
export const SIDEBOLT1____header_global_2f4f75eb7835a973 = ((((((4525) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5f26a1a7b6351ebb94ff68fe() {
  return __cxx_static_address_5f26a1a7b6351ebb94ff68fe.reference || (__cxx_static_address_5f26a1a7b6351ebb94ff68fe.reference = {
    __cReference: true,
    get value() { return SIDEBOLT1____header_global_2f4f75eb7835a973; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:758
export const FOODOBJECT16____header_global_15fdc1142339fb3d = ((((((4545) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_286173b7bbe48e5d9255b6e1() {
  return __cxx_static_address_286173b7bbe48e5d9255b6e1.reference || (__cxx_static_address_286173b7bbe48e5d9255b6e1.reference = {
    __cReference: true,
    get value() { return FOODOBJECT16____header_global_15fdc1142339fb3d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:759
export const TAMPON____header_global_a7ea7f038f56b8f6 = ((((((4557) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dffc8c90c276e625df02aa4c() {
  return __cxx_static_address_dffc8c90c276e625df02aa4c.reference || (__cxx_static_address_dffc8c90c276e625df02aa4c.reference = {
    __cReference: true,
    get value() { return TAMPON____header_global_a7ea7f038f56b8f6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:760
export const CANWITHSOMETHING2____header_global_34b390d6e67ee584 = ((((((4580) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_15358e129c697efa7e5fd9ec() {
  return __cxx_static_address_15358e129c697efa7e5fd9ec.reference || (__cxx_static_address_15358e129c697efa7e5fd9ec.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING2____header_global_34b390d6e67ee584; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:761
export const CANWITHSOMETHING3____header_global_3a9f43ad3be61a38 = ((((((4581) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e8490a6caf5b24007ad96827() {
  return __cxx_static_address_e8490a6caf5b24007ad96827.reference || (__cxx_static_address_e8490a6caf5b24007ad96827.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING3____header_global_3a9f43ad3be61a38; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:762
export const CANWITHSOMETHING4____header_global_a2acd19400330127 = ((((((4582) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4293eb244a7fa7977b2feab2() {
  return __cxx_static_address_4293eb244a7fa7977b2feab2.reference || (__cxx_static_address_4293eb244a7fa7977b2feab2.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING4____header_global_a2acd19400330127; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:763
export const DOLPHIN1____header_global_7ad32523df8df580 = ((((((4591) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_37d9fe069a8b55febb605140() {
  return __cxx_static_address_37d9fe069a8b55febb605140.reference || (__cxx_static_address_37d9fe069a8b55febb605140.reference = {
    __cReference: true,
    get value() { return DOLPHIN1____header_global_7ad32523df8df580; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:764
export const DOLPHIN2____header_global_2bb93381647a9fa3 = ((((((4592) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_917a6acad6425c2e5e4dca9c() {
  return __cxx_static_address_917a6acad6425c2e5e4dca9c.reference || (__cxx_static_address_917a6acad6425c2e5e4dca9c.reference = {
    __cReference: true,
    get value() { return DOLPHIN2____header_global_2bb93381647a9fa3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:765
export const NEWBEAST____header_global_e367561f47c17cf0 = ((((((4610) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e80e70a00d45c19c78a9fd53() {
  return __cxx_static_address_e80e70a00d45c19c78a9fd53.reference || (__cxx_static_address_e80e70a00d45c19c78a9fd53.reference = {
    __cReference: true,
    get value() { return NEWBEAST____header_global_e367561f47c17cf0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:766
export const NEWBEASTSTAYPUT____header_global_5244bc0e994db253 = ((((((4611) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_79b6ae060e9bbd5b2543d2e6() {
  return __cxx_static_address_79b6ae060e9bbd5b2543d2e6.reference || (__cxx_static_address_79b6ae060e9bbd5b2543d2e6.reference = {
    __cReference: true,
    get value() { return NEWBEASTSTAYPUT____header_global_5244bc0e994db253; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:767
export const BOSS4____header_global_eb35045c86566e39 = ((((((4740) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c8ff3537caadbdbb4da7ab6e() {
  return __cxx_static_address_c8ff3537caadbdbb4da7ab6e.reference || (__cxx_static_address_c8ff3537caadbdbb4da7ab6e.reference = {
    __cReference: true,
    get value() { return BOSS4____header_global_eb35045c86566e39; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:768
export const BOSS4STAYPUT____header_global_a39ebc938955245e = ((((((4741) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_05e6b2bfe76cf035daf61389() {
  return __cxx_static_address_05e6b2bfe76cf035daf61389.reference || (__cxx_static_address_05e6b2bfe76cf035daf61389.reference = {
    __cReference: true,
    get value() { return BOSS4STAYPUT____header_global_a39ebc938955245e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:769
export const FEM10____header_global_e92de30930810443 = ((((((4864) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e001c5bc61df827867f6685b() {
  return __cxx_static_address_e001c5bc61df827867f6685b.reference || (__cxx_static_address_e001c5bc61df827867f6685b.reference = {
    __cReference: true,
    get value() { return FEM10____header_global_e92de30930810443; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:770
export const TOUGHGAL____header_global_fa61e1b00903e5df = ((((((4866) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_914dede16af8b321b6efbd8c() {
  return __cxx_static_address_914dede16af8b321b6efbd8c.reference || (__cxx_static_address_914dede16af8b321b6efbd8c.reference = {
    __cReference: true,
    get value() { return TOUGHGAL____header_global_fa61e1b00903e5df; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:771
export const MAN____header_global_da1bf674cdcd85bc = ((((((4871) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_df296527d3adf39a153c953c() {
  return __cxx_static_address_df296527d3adf39a153c953c.reference || (__cxx_static_address_df296527d3adf39a153c953c.reference = {
    __cReference: true,
    get value() { return MAN____header_global_da1bf674cdcd85bc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:772
export const MAN2____header_global_23cf71ab2b089498 = ((((((4872) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_35b8e446991222370e704a56() {
  return __cxx_static_address_35b8e446991222370e704a56.reference || (__cxx_static_address_35b8e446991222370e704a56.reference = {
    __cReference: true,
    get value() { return MAN2____header_global_23cf71ab2b089498; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:773
export const WOMAN____header_global_f6e40f9dc2a9b217 = ((((((4874) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_458493a01bf605ebafff8158() {
  return __cxx_static_address_458493a01bf605ebafff8158.reference || (__cxx_static_address_458493a01bf605ebafff8158.reference = {
    __cReference: true,
    get value() { return WOMAN____header_global_f6e40f9dc2a9b217; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:774
export const NATURALLIGHTNING____header_global_597ff5cf69109d14 = ((((((4890) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eb477afc6176771b64dc65e0() {
  return __cxx_static_address_eb477afc6176771b64dc65e0.reference || (__cxx_static_address_eb477afc6176771b64dc65e0.reference = {
    __cReference: true,
    get value() { return NATURALLIGHTNING____header_global_597ff5cf69109d14; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:775
export const WEATHERWARN____header_global_7cb776dd75e02596 = ((((((4893) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_429481b3ddb6382a122dca76() {
  return __cxx_static_address_429481b3ddb6382a122dca76.reference || (__cxx_static_address_429481b3ddb6382a122dca76.reference = {
    __cReference: true,
    get value() { return WEATHERWARN____header_global_7cb776dd75e02596; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:776
export const DUKETAG____header_global_c37f3e2a51ac18e0 = ((((((4900) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_321723a1843dc1b14c328858() {
  return __cxx_static_address_321723a1843dc1b14c328858.reference || (__cxx_static_address_321723a1843dc1b14c328858.reference = {
    __cReference: true,
    get value() { return DUKETAG____header_global_c37f3e2a51ac18e0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:777
export const SIGN1____header_global_25caf825da999b57 = ((((((4909) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_755bfcca3dcbc6f1fe1985b1() {
  return __cxx_static_address_755bfcca3dcbc6f1fe1985b1.reference || (__cxx_static_address_755bfcca3dcbc6f1fe1985b1.reference = {
    __cReference: true,
    get value() { return SIGN1____header_global_25caf825da999b57; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:778
export const SIGN2____header_global_6d8eff1134f4ccf3 = ((((((4912) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d3395d9e36f02c47f3305791() {
  return __cxx_static_address_d3395d9e36f02c47f3305791.reference || (__cxx_static_address_d3395d9e36f02c47f3305791.reference = {
    __cReference: true,
    get value() { return SIGN2____header_global_6d8eff1134f4ccf3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:779
export const JURYGUY____header_global_a73b24f20d05a47c = ((((((4943) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_019704da89bb794a74361e81() {
  return __cxx_static_address_019704da89bb794a74361e81.reference || (__cxx_static_address_019704da89bb794a74361e81.reference = {
    __cReference: true,
    get value() { return JURYGUY____header_global_a73b24f20d05a47c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:780
export const WIDESCREENSTATUSBAR____header_global_ad2548e73b14abbc = ((((((5120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c7972e875bc55e155815d641() {
  return __cxx_static_address_c7972e875bc55e155815d641.reference || (__cxx_static_address_c7972e875bc55e155815d641.reference = {
    __cReference: true,
    get value() { return WIDESCREENSTATUSBAR____header_global_ad2548e73b14abbc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:781
export const RPGGUNWIDE____header_global_d9334602a7a28c2d = ((((((5121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ef719a20d2f9bcf4a0b2e18a() {
  return __cxx_static_address_ef719a20d2f9bcf4a0b2e18a.reference || (__cxx_static_address_ef719a20d2f9bcf4a0b2e18a.reference = {
    __cReference: true,
    get value() { return RPGGUNWIDE____header_global_d9334602a7a28c2d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:782
export const FIRSTGUNRELOADWIDE____header_global_e8556437ed2d194e = ((((((5122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7c1b450f5affd8f9d595e44b() {
  return __cxx_static_address_7c1b450f5affd8f9d595e44b.reference || (__cxx_static_address_7c1b450f5affd8f9d595e44b.reference = {
    __cReference: true,
    get value() { return FIRSTGUNRELOADWIDE____header_global_e8556437ed2d194e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:783
export const FREEZEWIDE____header_global_60192622d47f8dfa = ((((((5123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c511505d31272ee225f3160f() {
  return __cxx_static_address_c511505d31272ee225f3160f.reference || (__cxx_static_address_c511505d31272ee225f3160f.reference = {
    __cReference: true,
    get value() { return FREEZEWIDE____header_global_60192622d47f8dfa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:784
export const FREEZEFIREWIDE____header_global_45df68f99ac99690 = ((((((5124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_951671eea7f6a25ac2c63ea9() {
  return __cxx_static_address_951671eea7f6a25ac2c63ea9.reference || (__cxx_static_address_951671eea7f6a25ac2c63ea9.reference = {
    __cReference: true,
    get value() { return FREEZEFIREWIDE____header_global_45df68f99ac99690; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:785
export const SHRINKERWIDE____header_global_428f4a525e852c9f = ((((((5127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e96dcf80c603f45b6b9faa52() {
  return __cxx_static_address_e96dcf80c603f45b6b9faa52.reference || (__cxx_static_address_e96dcf80c603f45b6b9faa52.reference = {
    __cReference: true,
    get value() { return SHRINKERWIDE____header_global_428f4a525e852c9f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:786
export const CRACKKNUCKLESWIDE____header_global_fecccdf07d56cfa6 = ((((((5129) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5265e152cdc2ee731cc05982() {
  return __cxx_static_address_5265e152cdc2ee731cc05982.reference || (__cxx_static_address_5265e152cdc2ee731cc05982.reference = {
    __cReference: true,
    get value() { return CRACKKNUCKLESWIDE____header_global_fecccdf07d56cfa6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:787
export const FLAMETHROWERSPRITE____header_global_60da80d0c9eb9cc4 = ((((((5134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_491b932d973c563aa9f97149() {
  return __cxx_static_address_491b932d973c563aa9f97149.reference || (__cxx_static_address_491b932d973c563aa9f97149.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERSPRITE____header_global_60da80d0c9eb9cc4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:788
export const FLAMETHROWERAMMO____header_global_28d0019f16bbd43d = ((((((5135) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b44679c375621d8d3fd235ad() {
  return __cxx_static_address_b44679c375621d8d3fd235ad.reference || (__cxx_static_address_b44679c375621d8d3fd235ad.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERAMMO____header_global_28d0019f16bbd43d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:789
export const FLAMETHROWER____header_global_9e29cfb836198536 = ((((((5138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9b6e61217e39cd04588e57f5() {
  return __cxx_static_address_9b6e61217e39cd04588e57f5.reference || (__cxx_static_address_9b6e61217e39cd04588e57f5.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER____header_global_9e29cfb836198536; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:790
export const FLAMETHROWERFIRE____header_global_593785b881081ef6 = ((((((5139) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cbd7322a47d63d74c304ba8f() {
  return __cxx_static_address_cbd7322a47d63d74c304ba8f.reference || (__cxx_static_address_cbd7322a47d63d74c304ba8f.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERFIRE____header_global_593785b881081ef6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:791
export const FLAMETHROWERFLAME____header_global_1acffe4a2add9b5e = ((((((1891) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5a0a03eacb91119be1e450d7() {
  return __cxx_static_address_5a0a03eacb91119be1e450d7.reference || (__cxx_static_address_5a0a03eacb91119be1e450d7.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERFLAME____header_global_1acffe4a2add9b5e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:792
export const FLAMETHROWERPILOT____header_global_19e83feb8d281ae2 = ((((((5174) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6b31e8eb4205b51923c7897d() {
  return __cxx_static_address_6b31e8eb4205b51923c7897d.reference || (__cxx_static_address_6b31e8eb4205b51923c7897d.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERPILOT____header_global_19e83feb8d281ae2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:793
export const FIREBALL____header_global_94e1d0844b00c15d = ((((((5163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fe75bba07212de0bc041c22b() {
  return __cxx_static_address_fe75bba07212de0bc041c22b.reference || (__cxx_static_address_fe75bba07212de0bc041c22b.reference = {
    __cReference: true,
    get value() { return FIREBALL____header_global_94e1d0844b00c15d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:794
export const ONFIRE____header_global_2aa2abcb369164f6 = ((((((5152) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_28bbf1f7b76108d465241a13() {
  return __cxx_static_address_28bbf1f7b76108d465241a13.reference || (__cxx_static_address_28bbf1f7b76108d465241a13.reference = {
    __cReference: true,
    get value() { return ONFIRE____header_global_2aa2abcb369164f6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:795
export const ONFIRESMOKE____header_global_22e7b5ee722cf135 = ((((((5143) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d657c5d4cc8eec9ddd43e219() {
  return __cxx_static_address_d657c5d4cc8eec9ddd43e219.reference || (__cxx_static_address_d657c5d4cc8eec9ddd43e219.reference = {
    __cReference: true,
    get value() { return ONFIRESMOKE____header_global_22e7b5ee722cf135; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:796
export const BURNEDCORPSE____header_global_c5529a5c27d1f01b = ((((((5173) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6c7820822131dc4ea8d0f2b3() {
  return __cxx_static_address_6c7820822131dc4ea8d0f2b3.reference || (__cxx_static_address_6c7820822131dc4ea8d0f2b3.reference = {
    __cReference: true,
    get value() { return BURNEDCORPSE____header_global_c5529a5c27d1f01b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:797
export const WHISPYSMOKE____header_global_7eb34ab4384990aa = ((((((5268) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_36d462342698b9a9ff8bb529() {
  return __cxx_static_address_36d462342698b9a9ff8bb529.reference || (__cxx_static_address_36d462342698b9a9ff8bb529.reference = {
    __cReference: true,
    get value() { return WHISPYSMOKE____header_global_7eb34ab4384990aa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:798
export const FIREFLY____header_global_7a8186b966903e66 = ((((((5180) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d4f5e91b5205d32ed13cb521() {
  return __cxx_static_address_d4f5e91b5205d32ed13cb521.reference || (__cxx_static_address_d4f5e91b5205d32ed13cb521.reference = {
    __cReference: true,
    get value() { return FIREFLY____header_global_7a8186b966903e66; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:799
export const FIREFLYSHRINKEFFECT____header_global_115661aabbb1ff79 = ((((((5360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ac79e1b2590233747139822b() {
  return __cxx_static_address_ac79e1b2590233747139822b.reference || (__cxx_static_address_ac79e1b2590233747139822b.reference = {
    __cReference: true,
    get value() { return FIREFLYSHRINKEFFECT____header_global_115661aabbb1ff79; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:800
export const FIREFLYGROWEFFECT____header_global_a27182c5d437fa6f = ((((((5367) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fac054b580c75630d559c844() {
  return __cxx_static_address_fac054b580c75630d559c844.reference || (__cxx_static_address_fac054b580c75630d559c844.reference = {
    __cReference: true,
    get value() { return FIREFLYGROWEFFECT____header_global_a27182c5d437fa6f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:801
export const FIREFLYFLYINGEFFECT____header_global_e9998f1286a15907 = ((((((5296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_638917de8289f59a2c1bceaf() {
  return __cxx_static_address_638917de8289f59a2c1bceaf.reference || (__cxx_static_address_638917de8289f59a2c1bceaf.reference = {
    __cReference: true,
    get value() { return FIREFLYFLYINGEFFECT____header_global_e9998f1286a15907; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:802
export const BOSS5____header_global_aafaff96bde4d1fa = ((((((5310) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1053312e19a6f4ea584473c8() {
  return __cxx_static_address_1053312e19a6f4ea584473c8.reference || (__cxx_static_address_1053312e19a6f4ea584473c8.reference = {
    __cReference: true,
    get value() { return BOSS5____header_global_aafaff96bde4d1fa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:803
export const BOSS5STAYPUT____header_global_50827d1fd67a4b22 = ((((((5311) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2e7478127323044e03b76852() {
  return __cxx_static_address_2e7478127323044e03b76852.reference || (__cxx_static_address_2e7478127323044e03b76852.reference = {
    __cReference: true,
    get value() { return BOSS5STAYPUT____header_global_50827d1fd67a4b22; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:804
export const LAVAPOOL____header_global_c82b2bb48450ce0a = ((((((5304) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_14a627a2795262b6a510947d() {
  return __cxx_static_address_14a627a2795262b6a510947d.reference || (__cxx_static_address_14a627a2795262b6a510947d.reference = {
    __cReference: true,
    get value() { return LAVAPOOL____header_global_c82b2bb48450ce0a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:805
export const LAVASPLASH____header_global_17797fcea500bb3c = ((((((5371) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fc5a559f9b911ce6cb1606b4() {
  return __cxx_static_address_fc5a559f9b911ce6cb1606b4.reference || (__cxx_static_address_fc5a559f9b911ce6cb1606b4.reference = {
    __cReference: true,
    get value() { return LAVASPLASH____header_global_17797fcea500bb3c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:806
export const LAVAPOOLBUBBLE____header_global_0a1786b1bef4661a = ((((((5207) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b08fd9518003be7a4851c609() {
  return __cxx_static_address_b08fd9518003be7a4851c609.reference || (__cxx_static_address_b08fd9518003be7a4851c609.reference = {
    __cReference: true,
    get value() { return LAVAPOOLBUBBLE____header_global_0a1786b1bef4661a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:807
export const BOSS2STAYPUT____header_global_28f907f86bc95671 = ((((((2711) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e7d9d9a345ed85999584dd84() {
  return __cxx_static_address_e7d9d9a345ed85999584dd84.reference || (__cxx_static_address_e7d9d9a345ed85999584dd84.reference = {
    __cReference: true,
    get value() { return BOSS2STAYPUT____header_global_28f907f86bc95671; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:808
export const BOSS3STAYPUT____header_global_b4d91eb27bb0e1e6 = ((((((2761) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ea910b8d32bfd3795c6c5d6f() {
  return __cxx_static_address_ea910b8d32bfd3795c6c5d6f.reference || (__cxx_static_address_ea910b8d32bfd3795c6c5d6f.reference = {
    __cReference: true,
    get value() { return BOSS3STAYPUT____header_global_b4d91eb27bb0e1e6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:809
export const E32_TILE5736____header_global_9a2434b1d6b13e22 = ((((((5736) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f6c03a14b518332ff0255d6e() {
  return __cxx_static_address_f6c03a14b518332ff0255d6e.reference || (__cxx_static_address_f6c03a14b518332ff0255d6e.reference = {
    __cReference: true,
    get value() { return E32_TILE5736____header_global_9a2434b1d6b13e22; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:810
export const E32_TILE5737____header_global_c875704b72420d86 = ((((((5737) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c49a029b253eece76422b5e2() {
  return __cxx_static_address_c49a029b253eece76422b5e2.reference || (__cxx_static_address_c49a029b253eece76422b5e2.reference = {
    __cReference: true,
    get value() { return E32_TILE5737____header_global_c875704b72420d86; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:811
export const E32_TILE5846____header_global_d6b80eb4b6f03ecf = ((((((5846) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ca58f4b9329559485611726b() {
  return __cxx_static_address_ca58f4b9329559485611726b.reference || (__cxx_static_address_ca58f4b9329559485611726b.reference = {
    __cReference: true,
    get value() { return E32_TILE5846____header_global_d6b80eb4b6f03ecf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/network.h:180
export const cSnapshotMemUsage__header_global_5012fb2675c1b296 = u64((BigInt(u64(64)) * BigInt((BigInt((BigInt((BigInt(72) * BigInt(u64(16384)))) + BigInt((BigInt(96) * BigInt(u64(4096)))))) + BigInt((BigInt(296) * BigInt(u64(16384))))))));
function __cxx_static_address_971ef5f1aca2676522157dd2() {
  return __cxx_static_address_971ef5f1aca2676522157dd2.reference || (__cxx_static_address_971ef5f1aca2676522157dd2.reference = {
    __cReference: true,
    get value() { return cSnapshotMemUsage__header_global_5012fb2675c1b296; },
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
    return Object.setPrototypeOf(cZeroAggregate({"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"flags": {"native": "Uint8Array", "offset": 64, "size": 1}, "name": {"length": 64, "native": "Uint8Array", "offset": 0, "size": 64}, "subentries": {"offset": 72, "pointer": true, "size": 8}}, "overlaps": false, "prototype": "MenuGameplayEntry", "size": 80, "union": false}}, {"MenuGameplayEntry": () => MenuGameplayEntry().prototype}), new.target.prototype);
  }
  isValid() {
    return Boolean((i32((cDeref(cPointerOffset(this.name, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) != i32(0)));
  }
});
}

// C/C++ source: source/duke3d/src/game.cpp:75
export let AppProperName = Uint8Array.from([69, 68, 117, 107, 101, 51, 50, 0]);
export function __cxx_global_cell_7ad9490ab779b926bf483166() {
  return __cxx_global_cell_7ad9490ab779b926bf483166.reference || (__cxx_global_cell_7ad9490ab779b926bf483166.reference = {
    __cReference: true,
    get value() { return AppProperName; },
    set value(__cxx_lvalue_0) { AppProperName = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/duke3d/src/game.cpp:76
export let AppTechnicalName = Uint8Array.from([101, 100, 117, 107, 101, 51, 50, 0]);
export function __cxx_global_cell_d3ca539b706f6435a7034970() {
  return __cxx_global_cell_d3ca539b706f6435a7034970.reference || (__cxx_global_cell_d3ca539b706f6435a7034970.reference = {
    __cReference: true,
    get value() { return AppTechnicalName; },
    set value(__cxx_lvalue_0) { AppTechnicalName = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/duke3d/src/game.cpp:78
export let g_quitDeadline = i32(0);
export function __cxx_global_cell_0d2ab16bdddf6615d258fa6a() {
  return __cxx_global_cell_0d2ab16bdddf6615d258fa6a.reference || (__cxx_global_cell_0d2ab16bdddf6615d258fa6a.reference = {
    __cReference: true,
    get value() { return g_quitDeadline; },
    set value(__cxx_lvalue_0) { g_quitDeadline = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/game.cpp:80
export let g_cameraDistance = i32(0);
export function __cxx_global_cell_9cef20cb19b42f4cfa85797b() {
  return __cxx_global_cell_9cef20cb19b42f4cfa85797b.reference || (__cxx_global_cell_9cef20cb19b42f4cfa85797b.reference = {
    __cReference: true,
    get value() { return g_cameraDistance; },
    set value(__cxx_lvalue_0) { g_cameraDistance = i32(__cxx_lvalue_0); }
  });
}

export let g_cameraClock = i32(0);
export function __cxx_global_cell_915885e2bacffc3a024f309d() {
  return __cxx_global_cell_915885e2bacffc3a024f309d.reference || (__cxx_global_cell_915885e2bacffc3a024f309d.reference = {
    __cReference: true,
    get value() { return g_cameraClock; },
    set value(__cxx_lvalue_0) { g_cameraClock = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/game.cpp:81
export let g_quickExit = 0;
function __cxx_static_address_d69443e7516412890fb447d5() {
  return __cxx_static_address_d69443e7516412890fb447d5.reference || (__cxx_static_address_d69443e7516412890fb447d5.reference = {
    __cReference: true,
    get value() { return g_quickExit; },
    set value(__cxx_lvalue_0) { g_quickExit = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/game.cpp:83
export let boardfilename = (() => { const items = new Uint8Array(256); items.set([((0) & 255)]); return items; })();
function __cxx_static_address_7b94b27010261458b86134f0() {
  return __cxx_static_address_7b94b27010261458b86134f0.reference || (__cxx_static_address_7b94b27010261458b86134f0.reference = {
    __cReference: true,
    get value() { return boardfilename; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/game.cpp:84
export let currentboardfilename = (() => { const items = new Uint8Array(256); items.set([((0) & 255)]); return items; })();
function __cxx_static_address_e1a6765e4c3781e6b7f95161() {
  return __cxx_static_address_e1a6765e4c3781e6b7f95161.reference || (__cxx_static_address_e1a6765e4c3781e6b7f95161.reference = {
    __cReference: true,
    get value() { return currentboardfilename; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/game.cpp:86
export let voting = i32((-1));
export function __cxx_global_cell_82e31d5020a88903aa9c5a6b() {
  return __cxx_global_cell_82e31d5020a88903aa9c5a6b.reference || (__cxx_global_cell_82e31d5020a88903aa9c5a6b.reference = {
    __cReference: true,
    get value() { return voting; },
    set value(__cxx_lvalue_0) { voting = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/game.cpp:87
export let vote_map = i32((-1));
export function __cxx_global_cell_cdf6a0fd4954c44448f8ee26() {
  return __cxx_global_cell_cdf6a0fd4954c44448f8ee26.reference || (__cxx_global_cell_cdf6a0fd4954c44448f8ee26.reference = {
    __cReference: true,
    get value() { return vote_map; },
    set value(__cxx_lvalue_0) { vote_map = i32(__cxx_lvalue_0); }
  });
}

export let vote_episode = i32((-1));
export function __cxx_global_cell_c98af2840c6c4037f82f6134() {
  return __cxx_global_cell_c98af2840c6c4037f82f6134.reference || (__cxx_global_cell_c98af2840c6c4037f82f6134.reference = {
    __cReference: true,
    get value() { return vote_episode; },
    set value(__cxx_lvalue_0) { vote_episode = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/game.cpp:89
export let g_BenchmarkMode = i32(0);
export function __cxx_global_cell_fd061a74a82145843a9c000f() {
  return __cxx_global_cell_fd061a74a82145843a9c000f.reference || (__cxx_global_cell_fd061a74a82145843a9c000f.reference = {
    __cReference: true,
    get value() { return g_BenchmarkMode; },
    set value(__cxx_lvalue_0) { g_BenchmarkMode = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/game.cpp:91
export let g_Debug = i32(0);
export function __cxx_global_cell_9a77723c4fa5ca1e9ee15261() {
  return __cxx_global_cell_9a77723c4fa5ca1e9ee15261.reference || (__cxx_global_cell_9a77723c4fa5ca1e9ee15261.reference = {
    __cReference: true,
    get value() { return g_Debug; },
    set value(__cxx_lvalue_0) { g_Debug = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/game.cpp:93
export let g_vm_preempt = i32(1);
export function __cxx_global_cell_45a45bd09cd0eab4ebcb00cf() {
  return __cxx_global_cell_45a45bd09cd0eab4ebcb00cf.reference || (__cxx_global_cell_45a45bd09cd0eab4ebcb00cf.reference = {
    __cReference: true,
    get value() { return g_vm_preempt; },
    set value(__cxx_lvalue_0) { g_vm_preempt = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/game.cpp:96
export const defaultrtsfilename = cPointerArray(4, [Uint8Array.from([68, 85, 75, 69, 46, 82, 84, 83, 0]), Uint8Array.from([78, 65, 77, 46, 82, 84, 83, 0]), Uint8Array.from([78, 65, 80, 65, 76, 77, 46, 82, 84, 83, 0]), Uint8Array.from([87, 87, 50, 71, 73, 46, 82, 84, 83, 0])]);
function __cxx_static_address_a9b647721b865af9e3d46107() {
  return __cxx_static_address_a9b647721b865af9e3d46107.reference || (__cxx_static_address_a9b647721b865af9e3d46107.reference = {
    __cReference: true,
    get value() { return defaultrtsfilename; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/game.cpp:99
export let g_Shareware = i32(0);
export function __cxx_global_cell_e1d25c484f6e2a51686cce4a() {
  return __cxx_global_cell_e1d25c484f6e2a51686cce4a.reference || (__cxx_global_cell_e1d25c484f6e2a51686cce4a.reference = {
    __cReference: true,
    get value() { return g_Shareware; },
    set value(__cxx_lvalue_0) { g_Shareware = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/game.cpp:105
export let MAXCACHE1DSIZE = i32(Math.imul(i32(Math.imul(96, 1024)), 1024));
export function __cxx_global_cell_8405b1e60e6765b2469532f3() {
  return __cxx_global_cell_8405b1e60e6765b2469532f3.reference || (__cxx_global_cell_8405b1e60e6765b2469532f3.reference = {
    __cReference: true,
    get value() { return MAXCACHE1DSIZE; },
    set value(__cxx_lvalue_0) { MAXCACHE1DSIZE = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/game.cpp:110
export let tempwallptr = 0;
export function __cxx_global_cell_810b06e2a17ec770a557ed86() {
  return __cxx_global_cell_810b06e2a17ec770a557ed86.reference || (__cxx_global_cell_810b06e2a17ec770a557ed86.reference = {
    __cReference: true,
    get value() { return tempwallptr; },
    set value(__cxx_lvalue_0) { tempwallptr = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/game.cpp:112
export let nonsharedtimer = 0;
function __cxx_static_address_97c3a5d674a06dd7a28c8761() {
  return __cxx_static_address_97c3a5d674a06dd7a28c8761.reference || (__cxx_static_address_97c3a5d674a06dd7a28c8761.reference = {
    __cReference: true,
    get value() { return nonsharedtimer; },
    set value(__cxx_lvalue_0) { nonsharedtimer = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/game.cpp:114
export let ticrandomseed = 0;
export function __cxx_global_cell_68b6d54980cdb16254a25314() {
  return __cxx_global_cell_68b6d54980cdb16254a25314.reference || (__cxx_global_cell_68b6d54980cdb16254a25314.reference = {
    __cReference: true,
    get value() { return ticrandomseed; },
    set value(__cxx_lvalue_0) { ticrandomseed = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_75c3bdc9033d5b07 = i32(2147483647);
function __cxx_static_address_74e11ab7f00bdfffeff4b98f() {
  return __cxx_static_address_74e11ab7f00bdfffeff4b98f.reference || (__cxx_static_address_74e11ab7f00bdfffeff4b98f.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_75c3bdc9033d5b07; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_c7e72fb990aef0d1 = i32(2147483648);
function __cxx_static_address_2276ba28ac946ef35dd185f6() {
  return __cxx_static_address_2276ba28ac946ef35dd185f6.reference || (__cxx_static_address_2276ba28ac946ef35dd185f6.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_c7e72fb990aef0d1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_475e994a16e7f05a = i32(2147483648);
function __cxx_static_address_d6f522543aa491f74c0abc8f() {
  return __cxx_static_address_d6f522543aa491f74c0abc8f.reference || (__cxx_static_address_d6f522543aa491f74c0abc8f.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_475e994a16e7f05a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_49e594ecaa72fc74 = i32(65536);
function __cxx_static_address_d30d8b9d8e537e24e8d3ebdb() {
  return __cxx_static_address_d30d8b9d8e537e24e8d3ebdb.reference || (__cxx_static_address_d30d8b9d8e537e24e8d3ebdb.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_49e594ecaa72fc74; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_02a9a2d25f5c82a5 = i32(32768);
function __cxx_static_address_8682ab9cbd0ba90039f6a031() {
  return __cxx_static_address_8682ab9cbd0ba90039f6a031.reference || (__cxx_static_address_8682ab9cbd0ba90039f6a031.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_02a9a2d25f5c82a5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_88e7d7147a46ba0e = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_b744fb77cad9677e39b8e33f() {
  return __cxx_static_address_b744fb77cad9677e39b8e33f.reference || (__cxx_static_address_b744fb77cad9677e39b8e33f.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_88e7d7147a46ba0e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/game.cpp:116
export let hud_showmapname = i32(1);
export function __cxx_global_cell_2ee6a4c1e2e244c04f3df21d() {
  return __cxx_global_cell_2ee6a4c1e2e244c04f3df21d.reference || (__cxx_global_cell_2ee6a4c1e2e244c04f3df21d.reference = {
    __cReference: true,
    get value() { return hud_showmapname; },
    set value(__cxx_lvalue_0) { hud_showmapname = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/game.cpp:118
export let g_levelTextTime = i32(0);
export function __cxx_global_cell_34a7b68257676ec1276613a0() {
  return __cxx_global_cell_34a7b68257676ec1276613a0.reference || (__cxx_global_cell_34a7b68257676ec1276613a0.reference = {
    __cReference: true,
    get value() { return g_levelTextTime; },
    set value(__cxx_lvalue_0) { g_levelTextTime = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/game.cpp:124
export function M32RunScript(s) {
  (s = s);
}

// C/C++ source: source/duke3d/src/game.cpp:455
export let ror_protectedsectors = new Uint8Array(512);
function __cxx_static_address_ece5c8005d023643c26b6693() {
  return __cxx_static_address_ece5c8005d023643c26b6693.reference || (__cxx_static_address_ece5c8005d023643c26b6693.reference = {
    __cReference: true,
    get value() { return ror_protectedsectors; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/game.cpp:456
export let drawing_ror = i32(0);
function __cxx_static_address_59bee722c3ce76b8747bf728() {
  return __cxx_static_address_59bee722c3ce76b8747bf728.reference || (__cxx_static_address_59bee722c3ce76b8747bf728.reference = {
    __cReference: true,
    get value() { return drawing_ror; },
    set value(__cxx_lvalue_0) { drawing_ror = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/game.cpp:457
export let ror_sprite = i32((-1));
function __cxx_static_address_c951871e8e014b0c51d61aa6() {
  return __cxx_static_address_c951871e8e014b0c51d61aa6.reference || (__cxx_static_address_c951871e8e014b0c51d61aa6.reference = {
    __cReference: true,
    get value() { return ror_sprite; },
    set value(__cxx_lvalue_0) { ror_sprite = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/game.cpp:487
export let SE40backupStat = new Int16Array(4096);
function __cxx_static_address_95c970b1f4df65aeafd4e06f() {
  return __cxx_static_address_95c970b1f4df65aeafd4e06f.reference || (__cxx_static_address_95c970b1f4df65aeafd4e06f.reference = {
    __cReference: true,
    get value() { return SE40backupStat; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/game.cpp:488
export let SE40backupZ = new Int32Array(4096);
function __cxx_static_address_e7451d4a9e35969cde9c6e1a() {
  return __cxx_static_address_e7451d4a9e35969cde9c6e1a.reference || (__cxx_static_address_e7451d4a9e35969cde9c6e1a.reference = {
    __cReference: true,
    get value() { return SE40backupZ; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/game.cpp:4611
export let g_RTSPlaying = 0;
function __cxx_static_address_68d89cd14f95d780b77b0761() {
  return __cxx_static_address_68d89cd14f95d780b77b0761.reference || (__cxx_static_address_68d89cd14f95d780b77b0761.reference = {
    __cReference: true,
    get value() { return g_RTSPlaying; },
    set value(__cxx_lvalue_0) { g_RTSPlaying = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/game.cpp:5310
export const newGameTokens = cByteRecordNDArray({"align": 8, "arrayAlign": 1, "fields": {"text": {"offset": 0, "pointer": true, "size": 8}, "tokenid": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, [1], {}, [cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"text": {"offset": 0, "pointer": true, "size": 8}, "tokenid": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"text": Uint8Array.from([99, 104, 111, 105, 99, 101, 0]), "tokenid": i32(26)}, null, {})]);
function __cxx_static_address_4e75b2eacf7869195cc4dd22() {
  return __cxx_static_address_4e75b2eacf7869195cc4dd22.reference || (__cxx_static_address_4e75b2eacf7869195cc4dd22.reference = {
    __cReference: true,
    get value() { return newGameTokens; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/game.cpp:5314
export const newGameChoiceTokens = cByteRecordNDArray({"align": 8, "arrayAlign": 1, "fields": {"text": {"offset": 0, "pointer": true, "size": 8}, "tokenid": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, [5], {}, [cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"text": {"offset": 0, "pointer": true, "size": 8}, "tokenid": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"text": Uint8Array.from([110, 97, 109, 101, 0]), "tokenid": i32(27)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"text": {"offset": 0, "pointer": true, "size": 8}, "tokenid": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"text": Uint8Array.from([108, 111, 99, 107, 101, 100, 0]), "tokenid": i32(28)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"text": {"offset": 0, "pointer": true, "size": 8}, "tokenid": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"text": Uint8Array.from([104, 105, 100, 100, 101, 110, 0]), "tokenid": i32(29)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"text": {"offset": 0, "pointer": true, "size": 8}, "tokenid": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"text": Uint8Array.from([99, 104, 111, 105, 99, 101, 0]), "tokenid": i32(26)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"text": {"offset": 0, "pointer": true, "size": 8}, "tokenid": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"text": Uint8Array.from([117, 115, 101, 114, 99, 111, 110, 116, 101, 110, 116, 0]), "tokenid": i32(30)}, null, {})]);
function __cxx_static_address_c469a12350430ef4ea817193() {
  return __cxx_static_address_c469a12350430ef4ea817193.reference || (__cxx_static_address_c469a12350430ef4ea817193.reference = {
    __cReference: true,
    get value() { return newGameChoiceTokens; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/game.cpp:6570
const __cxx_literal_013b3c8230afe07b9a22 = Uint8Array.from([86, 77, 0]);
const __cxx_literal_d1b1c698958d2ec0de9e = Uint8Array.from([67, 79, 78, 0]);
export function dukeVerbosityCallback(verbosity) {
  switch (verbosity) {
    default: {
      return null;
    }
    case i32(9): {
      return __cxx_literal_013b3c8230afe07b9a22;
    }
    case i32(10): {
      return __cxx_literal_d1b1c698958d2ec0de9e;
    }
  }
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_ba4e5a8bedb79825 = new Uint8Array([((1) & 255), ((2) & 255), ((4) & 255), ((8) & 255), ((16) & 255), ((32) & 255), ((64) & 255), ((128) & 255)]);
function __cxx_static_address_cbe6556703d9bc46f2656bb8() {
  return __cxx_static_address_cbe6556703d9bc46f2656bb8.reference || (__cxx_static_address_cbe6556703d9bc46f2656bb8.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_ba4e5a8bedb79825; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:172
export const g_defaultVideoModes__header_global_cb710d580b9a9525 = cByteRecordNDArray({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, [25], {}, [cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 2560, "y": 1440}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 2560, "y": 1200}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 2560, "y": 1080}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1920, "y": 1440}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1920, "y": 1200}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1920, "y": 1080}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1680, "y": 1050}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1600, "y": 1200}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1600, "y": 900}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1366, "y": 768}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1280, "y": 1024}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1280, "y": 960}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1280, "y": 720}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1152, "y": 864}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1024, "y": 768}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1024, "y": 600}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 800, "y": 600}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 640, "y": 480}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 640, "y": 400}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 512, "y": 384}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 480, "y": 360}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 400, "y": 300}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 320, "y": 240}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 320, "y": 200}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 0, "y": 0}, null, {})]);
function __cxx_static_address_1973e917add904285b294912() {
  return __cxx_static_address_1973e917add904285b294912.reference || (__cxx_static_address_1973e917add904285b294912.reference = {
    __cReference: true,
    get value() { return g_defaultVideoModes__header_global_cb710d580b9a9525; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:188
export const g_keyAsciiTable__header_global_3f8fcdb3c8550dee = new Uint8Array([((0) & 255), ((0) & 255), 49, 50, 51, 52, 53, 54, 55, 56, 57, 48, 45, 61, ((0) & 255), ((0) & 255), 113, 119, 101, 114, 116, 121, 117, 105, 111, 112, 91, 93, ((0) & 255), ((0) & 255), 97, 115, 100, 102, 103, 104, 106, 107, 108, 59, ((39) & 255), 96, ((0) & 255), ((92) & 255), 122, 120, 99, 118, 98, 110, 109, 44, 46, 47, ((0) & 255), 42, ((0) & 255), ((32) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255)]);
function __cxx_static_address_266fdb1de99493e32c6a9b8a() {
  return __cxx_static_address_266fdb1de99493e32c6a9b8a.reference || (__cxx_static_address_266fdb1de99493e32c6a9b8a.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTable__header_global_3f8fcdb3c8550dee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:196
export const g_keyAsciiTableShift__header_global_3ea219c88f22903b = new Uint8Array([((0) & 255), ((0) & 255), 33, 64, 35, 36, 37, 94, 38, 42, 40, 41, 95, 43, ((0) & 255), ((0) & 255), 81, 87, 69, 82, 84, 89, 85, 73, 79, 80, 123, 125, ((0) & 255), ((0) & 255), 65, 83, 68, 70, 71, 72, 74, 75, 76, 58, 34, 126, ((0) & 255), 124, 90, 88, 67, 86, 66, 78, 77, 60, 62, 63, ((0) & 255), 42, ((0) & 255), ((32) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255)]);
function __cxx_static_address_5b3dbf744bbb9524a5ed0c02() {
  return __cxx_static_address_5b3dbf744bbb9524a5ed0c02.reference || (__cxx_static_address_5b3dbf744bbb9524a5ed0c02.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTableShift__header_global_3ea219c88f22903b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:895
export const pow2long__header_global_d7c11c7ee68d3df0 = new Int32Array([1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576, 2097152, 4194304, 8388608, 16777216, 33554432, 67108864, 134217728, 268435456, 536870912, 1073741824, 2147483647]);
function __cxx_static_address_b21c40ff54b8ebb1f1858f9e() {
  return __cxx_static_address_b21c40ff54b8ebb1f1858f9e.reference || (__cxx_static_address_b21c40ff54b8ebb1f1858f9e.reference = {
    __cReference: true,
    get value() { return pow2long__header_global_d7c11c7ee68d3df0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:907
export const pow2ulong__header_global_1beb70803868ef5c = new Uint32Array([u32(1), u32(2), u32(4), u32(8), u32(16), u32(32), u32(64), u32(128), u32(256), u32(512), u32(1024), u32(2048), u32(4096), u32(8192), u32(16384), u32(32768), u32(65536), u32(131072), u32(262144), u32(524288), u32(1048576), u32(2097152), u32(4194304), u32(8388608), u32(16777216), u32(33554432), u32(67108864), u32(134217728), u32(268435456), u32(536870912), u32(1073741824), u32(2147483648n)]);
function __cxx_static_address_268865744154838b0d2cf8c3() {
  return __cxx_static_address_268865744154838b0d2cf8c3.reference || (__cxx_static_address_268865744154838b0d2cf8c3.reference = {
    __cReference: true,
    get value() { return pow2ulong__header_global_1beb70803868ef5c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:919
export const pow264__header_global_1f36195f2c17ca0f = new BigInt64Array([BigInt(i64(1)), BigInt(i64(2)), BigInt(i64(4)), BigInt(i64(8)), BigInt(i64(16)), BigInt(i64(32)), BigInt(i64(64)), BigInt(i64(128)), BigInt(i64(256)), BigInt(i64(512)), BigInt(i64(1024)), BigInt(i64(2048)), BigInt(i64(4096)), BigInt(i64(8192)), BigInt(i64(16384)), BigInt(i64(32768)), BigInt(i64(65536)), BigInt(i64(131072)), BigInt(i64(262144)), BigInt(i64(524288)), BigInt(i64(1048576)), BigInt(i64(2097152)), BigInt(i64(4194304)), BigInt(i64(8388608)), BigInt(i64(16777216)), BigInt(i64(33554432)), BigInt(i64(67108864)), BigInt(i64(134217728)), BigInt(i64(268435456)), BigInt(i64(536870912)), BigInt(i64(1073741824)), BigInt(2147483648n), BigInt(4294967296n), BigInt(8589934592n), BigInt(17179869184n), BigInt(34359738368n), BigInt(68719476736n), BigInt(137438953472n), BigInt(274877906944n), BigInt(549755813888n), BigInt(1099511627776n), BigInt(2199023255552n), BigInt(4398046511104n), BigInt(8796093022208n), BigInt(17592186044416n), BigInt(35184372088832n), BigInt(70368744177664n), BigInt(140737488355328n), BigInt(281474976710656n), BigInt(562949953421312n), BigInt(1125899906842624n), BigInt(2251799813685248n), BigInt(4503599627370496n), BigInt(9007199254740992n), BigInt(18014398509481984n), BigInt(36028797018963968n), BigInt(72057594037927936n), BigInt(144115188075855872n), BigInt(288230376151711744n), BigInt(576460752303423488n), BigInt(1152921504606846976n), BigInt(2305843009213693952n), BigInt(4611686018427387904n), BigInt(9223372036854775807n)]);
function __cxx_static_address_f1fd465bc4486382d4db784d() {
  return __cxx_static_address_f1fd465bc4486382d4db784d.reference || (__cxx_static_address_f1fd465bc4486382d4db784d.reference = {
    __cReference: true,
    get value() { return pow264__header_global_1f36195f2c17ca0f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/mact/include/keyboard.h:47
export const sctokeylut__header_global_d8327b8451131bda = cByteRecordNDArray({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, [102], {}, [cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([69, 115, 99, 97, 112, 101, 0]), "sc": ((1) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([49, 0]), "sc": ((2) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([50, 0]), "sc": ((3) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([51, 0]), "sc": ((4) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([52, 0]), "sc": ((5) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([53, 0]), "sc": ((6) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([54, 0]), "sc": ((7) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([55, 0]), "sc": ((8) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([56, 0]), "sc": ((9) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([57, 0]), "sc": ((10) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([48, 0]), "sc": ((11) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([45, 0]), "sc": ((12) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([61, 0]), "sc": ((13) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([66, 97, 107, 83, 112, 99, 0]), "sc": ((14) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([84, 97, 98, 0]), "sc": ((15) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([81, 0]), "sc": ((16) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([87, 0]), "sc": ((17) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([69, 0]), "sc": ((18) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([82, 0]), "sc": ((19) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([84, 0]), "sc": ((20) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([89, 0]), "sc": ((21) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([85, 0]), "sc": ((22) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([73, 0]), "sc": ((23) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([79, 0]), "sc": ((24) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([80, 0]), "sc": ((25) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([91, 0]), "sc": ((26) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([93, 0]), "sc": ((27) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([69, 110, 116, 101, 114, 0]), "sc": ((28) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([76, 67, 116, 114, 108, 0]), "sc": ((29) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([65, 0]), "sc": ((30) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([83, 0]), "sc": ((31) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([68, 0]), "sc": ((32) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 0]), "sc": ((33) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([71, 0]), "sc": ((34) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([72, 0]), "sc": ((35) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([74, 0]), "sc": ((36) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 0]), "sc": ((37) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([76, 0]), "sc": ((38) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([59, 0]), "sc": ((39) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([39, 0]), "sc": ((40) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([96, 0]), "sc": ((41) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([76, 83, 104, 105, 102, 116, 0]), "sc": ((42) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([66, 97, 99, 107, 115, 108, 97, 115, 104, 0]), "sc": ((43) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([90, 0]), "sc": ((44) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([88, 0]), "sc": ((45) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([67, 0]), "sc": ((46) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([86, 0]), "sc": ((47) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([66, 0]), "sc": ((48) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([78, 0]), "sc": ((49) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([77, 0]), "sc": ((50) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([44, 0]), "sc": ((51) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([46, 0]), "sc": ((52) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([47, 0]), "sc": ((53) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([82, 83, 104, 105, 102, 116, 0]), "sc": ((54) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 42, 0]), "sc": ((55) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([76, 65, 108, 116, 0]), "sc": ((56) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([83, 112, 97, 99, 101, 0]), "sc": ((57) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([67, 97, 112, 76, 99, 107, 0]), "sc": ((58) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 49, 0]), "sc": ((59) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 50, 0]), "sc": ((60) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 51, 0]), "sc": ((61) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 52, 0]), "sc": ((62) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 53, 0]), "sc": ((63) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 54, 0]), "sc": ((64) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 55, 0]), "sc": ((65) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 56, 0]), "sc": ((66) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 57, 0]), "sc": ((67) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 49, 48, 0]), "sc": ((68) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([78, 117, 109, 76, 99, 107, 0]), "sc": ((69) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([83, 99, 114, 76, 99, 107, 0]), "sc": ((70) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 55, 0]), "sc": ((71) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 56, 0]), "sc": ((72) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 57, 0]), "sc": ((73) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 45, 0]), "sc": ((74) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 52, 0]), "sc": ((75) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 53, 0]), "sc": ((76) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 54, 0]), "sc": ((77) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 43, 0]), "sc": ((78) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 49, 0]), "sc": ((79) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 50, 0]), "sc": ((80) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 51, 0]), "sc": ((81) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 48, 0]), "sc": ((82) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 46, 0]), "sc": ((83) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([76, 101, 115, 115, 84, 104, 97, 110, 0]), "sc": ((86) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 49, 49, 0]), "sc": ((87) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 49, 50, 0]), "sc": ((88) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 100, 69, 110, 116, 0]), "sc": ((156) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([82, 67, 116, 114, 108, 0]), "sc": ((157) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 47, 0]), "sc": ((181) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([82, 65, 108, 116, 0]), "sc": ((184) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([80, 114, 116, 83, 99, 110, 0]), "sc": ((183) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([80, 97, 117, 115, 101, 0]), "sc": ((197) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([72, 111, 109, 101, 0]), "sc": ((199) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([85, 112, 0]), "sc": ((200) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([80, 103, 85, 112, 0]), "sc": ((201) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([76, 101, 102, 116, 0]), "sc": ((203) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([82, 105, 103, 104, 116, 0]), "sc": ((205) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([69, 110, 100, 0]), "sc": ((207) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([68, 111, 119, 110, 0]), "sc": ((208) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([80, 103, 68, 110, 0]), "sc": ((209) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([73, 110, 115, 101, 114, 116, 0]), "sc": ((210) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([68, 101, 108, 101, 116, 101, 0]), "sc": ((211) & 255)}, null, {})]);
function __cxx_static_address_592a85812ab0ec80dd31a164() {
  return __cxx_static_address_592a85812ab0ec80dd31a164.reference || (__cxx_static_address_592a85812ab0ec80dd31a164.reference = {
    __cReference: true,
    get value() { return sctokeylut__header_global_d8327b8451131bda; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export function mulscale28__header_720cded9c90d(eax, edx) {
  return i32((BigInt((BigInt(i64(eax)) * BigInt(i64(edx)))) >> BigInt(i32(((((28) & 255)) & 255)))));
}

export function mulscale16__header_f97b38ea5f11(eax, edx) {
  return i32((BigInt((BigInt(i64(eax)) * BigInt(i64(edx)))) >> BigInt(i32(((((16) & 255)) & 255)))));
}

// C/C++ source: @sysroot/usr/include/c++/12/bits/stl_algobase.h:230
export function min__template_774131ccff66371d(__a, __b) {
  if ((__b.value < __a.value)) {
    return __b;
  }
  return __a;
}

// C/C++ source: source/duke3d/src/game.cpp:157
export function Duke_ApplySpritePropertiesToTSprite__header_f55df38813a8(tspr, spr) {



  let cstat = ((cRecordObject(spr).cstat) & 65535);
  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = (((__cxx_lvalue_0.value | i32((i32((i32((i32(cstat) & i32(1024))) >> 9)) | i32((i32((i32(cstat) & i32((i32(8192) | i32(16384))))) >> 11)))))) & 255)))(cObjectFieldRef(cRecordObject(tspr), "clipdist"));
}

export function bitmap_test__header_9187d8b27cd5(ptr, n) {

  return Boolean((i32((i32((cDeref(cPointerOffset(ptr, i32((n >> 3)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & i32((cDeref(cPointerOffset(pow2char__header_global_ba4e5a8bedb79825, i32((n & 7)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))) == i32((cDeref(cPointerOffset(pow2char__header_global_ba4e5a8bedb79825, i32((n & 7)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))));
}

// C/C++ source: source/duke3d/src/game.cpp:42
export function fix16_to_int__header_e5543c7659b8(a) {
  return i32(Math.trunc(i32((a + ((a >= 0) ? fix16_half__header_global_02a9a2d25f5c82a5 : (-fix16_half__header_global_02a9a2d25f5c82a5)))) / fix16_one__header_global_49e594ecaa72fc74));
}

export function bitmap_clear__header_03f32c4c9b40(ptr, n) {

  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = (((__cxx_lvalue_0.value & (~i32((cDeref(cPointerOffset(pow2char__header_global_ba4e5a8bedb79825, i32((n & 7)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))))) & 255)))(cDeref(cPointerOffset(ptr, i32((n >> 3)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array));
}

// C/C++ source: source/duke3d/src/game.cpp:1079
export function videoGetRenderMode__header_0ef762c67d49() {
  return i32(0);
}

export function clamp__header_0915f0c9d86f(__cxx_in, min, max) {
  return (((((i32(__cxx_in) <= i32(((((((min) << 16) >> 16)) << 16) >> 16))) ? ((((((min) << 16) >> 16)) << 16) >> 16) : ((i32(__cxx_in) >= i32(((((((max) << 16) >> 16)) << 16) >> 16))) ? ((((((max) << 16) >> 16)) << 16) >> 16) : __cxx_in))) << 16) >> 16);
}

// C/C++ source: source/duke3d/src/game.cpp:46
export function fix16_from_int__header_a4fc00426563(a) {
  return i32(Math.imul(a, fix16_one__header_global_49e594ecaa72fc74));
}

// C/C++ source: source/duke3d/src/game.cpp:66
export function fix16_clamp__header_15c51fe79beb(x, lo, hi) {
  return i32(clamp__header_7e65ff40578f(x, lo, hi));
}

// C/C++ source: source/duke3d/src/game.cpp:380
export function swapbufreverse__header_4269a1f15261(s, d, c) {
  let src = cTypedPointer(s, Uint8Array);
  let dst = cTypedPointer(d, Uint8Array);
  (c >= 4);
  do {
    swap__header_fa4b97c5d52d(dst, src);
    swap__header_fa4b97c5d52d(cPointerOffset(dst, 1, Uint8Array.BYTES_PER_ELEMENT), cPointerOffset(src, -(1), Uint8Array.BYTES_PER_ELEMENT));
    swap__header_fa4b97c5d52d(cPointerOffset(dst, 2, Uint8Array.BYTES_PER_ELEMENT), cPointerOffset(src, -(2), Uint8Array.BYTES_PER_ELEMENT));
    swap__header_fa4b97c5d52d(cPointerOffset(dst, 3, Uint8Array.BYTES_PER_ELEMENT), cPointerOffset(src, -(3), Uint8Array.BYTES_PER_ELEMENT));
    ((dst = cPointerOffset(dst, 4, Uint8Array.BYTES_PER_ELEMENT)), (src = cPointerOffset(src, -(4), Uint8Array.BYTES_PER_ELEMENT)));
  } while (((c = i32((Number(c) - Number(4)))) > 4));
  while (Boolean(((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous - 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => c, __cxx_lvalue_1 => { c = __cxx_lvalue_1; })))) {
    swap__header_fa4b97c5d52d(((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_2.value = next; return previous; })(cRef(() => dst, __cxx_lvalue_3 => { dst = __cxx_lvalue_3; })), ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = cPointerOffset(previous, -1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_4.value = next; return previous; })(cRef(() => src, __cxx_lvalue_5 => { src = __cxx_lvalue_5; })));
  }
}

export function swap__header_fa4b97c5d52d(a, b) {
  let t = (((cDeref(a, Uint8Array).value)) & 255);
  ((cDeref(a, Uint8Array).value) = (((cDeref(b, Uint8Array).value)) & 255));
  ((cDeref(b, Uint8Array).value) = ((t) & 255));
}

export function bitmap_set__header_c55045fa1bbe(ptr, n) {

  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = (((__cxx_lvalue_0.value | i32((cDeref(cPointerOffset(pow2char__header_global_ba4e5a8bedb79825, i32((n & 7)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))) & 255)))(cDeref(cPointerOffset(ptr, i32((n >> 3)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array));
}

// C/C++ source: source/duke3d/src/game.cpp:422
export function P_GetP__header_5ca4a2fe56be(pSprite) {
  let playerNum = i32(cRecordObject(cRecordPointer(pSprite, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {})).__cxx_anonymous_15.__cxx_anonymous_0.yvel);
  if ((u32(playerNum) >= u32(16))) {
    (playerNum = i32(0));
  }
  return i32(playerNum);
}

// C/C++ source: source/duke3d/src/game.cpp:611
let __static_G_GetViewscreenSizeShift__header_72c9a4444924_mask = i32((i32((1 << 2)) - 1));
export function G_GetViewscreenSizeShift__header_72c9a4444924(spr) {

  let rem = i32((i32((i32(cRecordObject(spr).xrepeat) & __static_G_GetViewscreenSizeShift__header_72c9a4444924_mask)) | i32((i32(cRecordObject(spr).yrepeat) & __static_G_GetViewscreenSizeShift__header_72c9a4444924_mask))));
  for (let i = i32(0); (i < 2); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
    if (Boolean(i32((rem & i32((1 << i)))))) {
      return i32(i);
    }
  }
  return i32(2);
}

export function clamp__header_7e65ff40578f(__cxx_in, min, max) {
  return i32(((__cxx_in <= i32(min)) ? i32(min) : ((__cxx_in >= i32(max)) ? i32(max) : __cxx_in)));
}

export function mulscale6__header_d5ca2e363966(eax, edx) {
  return i32((BigInt((BigInt(i64(eax)) * BigInt(i64(edx)))) >> BigInt(i32(((((6) & 255)) & 255)))));
}

// C/C++ source: @sysroot/usr/include/c++/12/bits/stl_algobase.h:254
export function max__template_b1cfaf2244c73238(__a, __b) {
  if ((__a.value < __b.value)) {
    return __b;
  }
  return __a;
}

export function clamp__header_fb9a8a4e1ef1(__cxx_in, min, max) {
  return ((((i32(__cxx_in) <= i32(((((min) & 65535)) & 65535))) ? ((((min) & 65535)) & 65535) : ((i32(__cxx_in) >= i32(((((max) & 65535)) & 65535))) ? ((((max) & 65535)) & 65535) : __cxx_in))) & 65535);
}

export function ARRAY_SIZE__header_629f6c994b6a(arg0) {
  return u64(5n);
}

export function ARRAY_SIZE__header_45c5cc752339(arg0) {
  return u64(64n);
}

export function ARRAY_SIZE__header_f8557a61fa7e(arg0) {
  return u64(17n);
}

export function ARRAY_SIZE__header_251e3654dd1b(arg0) {
  return u64(8n);
}

export function ARRAY_SIZE__header_30888aa7cde6(arg0) {
  return u64(6n);
}

export function ARRAY_SIZE__header_8e1e61e90c11(arg0) {
  return u64(1n);
}

// C/C++ source: source/duke3d/src/game.cpp:1235
export function Bstrncpyz__header_1b07c15e1e64(dst, src, n) {
  if ((n > u64(0))) {
    cByteMemory.memcpy(dst, src, (min__template_c237f4424e2bda8a(((__cxx_lvalue_0) => cRef(() => __cxx_lvalue_0, () => { throw new TypeError("const C++ reference write"); }))((BigInt(cByteMemory.strlen(src)) + BigInt(u64(1)))), ((__cxx_lvalue_1) => cRef(() => __cxx_lvalue_1, () => { throw new TypeError("const C++ reference write"); }))((BigInt(n) - BigInt(u64(1)))))).value);
    ((cDeref(cPointerOffset(dst, (BigInt(n) - BigInt(u64(1))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = ((0) & 255));
  }
  return dst;
}

export function ARRAY_SIZE__header_c646a883023a(arg0) {
  return u64(29n);
}

export function ARRAY_SIZE__header_a4bf8e69dabb(arg0) {
  return u64(7n);
}

export function ARRAY_SIZE__header_248a2b6a206c(arg0) {
  return u64(3n);
}

export function ARRAY_SIZE__header_40c5d203784c(arg0) {
  return u64(4n);
}

export function mulscale9__header_892ae3e42452(eax, edx) {
  return i32((BigInt((BigInt(i64(eax)) * BigInt(i64(edx)))) >> BigInt(i32(((((9) & 255)) & 255)))));
}

// C/C++ source: source/duke3d/src/game.cpp:431
let __static_G_GetTeamPalette__header_a2181cbc67c1_pal = new Int8Array([(((3) << 24) >> 24), (((10) << 24) >> 24), (((11) << 24) >> 24), (((12) << 24) >> 24)]);
export function G_GetTeamPalette__header_a2181cbc67c1(team) {

  if ((u64(u32(team)) >= ARRAY_SIZE__header_bfe944817cc0(__static_G_GetTeamPalette__header_a2181cbc67c1_pal))) {
    return i32(0);
  }
  return i32((cDeref(cPointerOffset(__static_G_GetTeamPalette__header_a2181cbc67c1_pal, team, Int8Array.BYTES_PER_ELEMENT), Int8Array).value));
}

// C/C++ source: source/duke3d/src/game.cpp:328
export function ksgn__header_b773516e10d7(a) {
  return i32((i32((a > 0)) - i32((a < 0))));
}

// C/C++ source: source/build/include/smmalloc.h:849
export function _sm_allocator_thread_cache_destroy(allocator) {
  if (cPointerCompare(allocator, null, "==")) {
    return;
  }
  cRecordObject(allocator).DestroyThreadCache();
}

// C/C++ source: source/build/include/smmalloc.h:864
export function _sm_free(allocator, p) {
  return cRecordObject(allocator).Free(p);
}

// C/C++ source: source/build/include/smmalloc.h:859
export function _sm_malloc(allocator, bytesCount, alignment) {
  return cRecordObject(allocator).Alloc(bytesCount, alignment);
}

// C/C++ source: source/build/include/smmalloc.h:866
export function _sm_realloc(allocator, p, bytesCount, alignment) {
  return cRecordObject(allocator).Realloc(p, bytesCount, alignment);
}

// C/C++ source: @sysroot/usr/include/c++/12/bits/stl_algobase.h:230
export function min__template_c237f4424e2bda8a(__a, __b) {
  if ((__b.value < __a.value)) {
    return __b;
  }
  return __a;
}

export function ARRAY_SIZE__header_bfe944817cc0(arg0) {
  return u64(4n);
}

export function SILENCE_UNUSED__header_2c60b085d029(arg0, arg1) {

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
