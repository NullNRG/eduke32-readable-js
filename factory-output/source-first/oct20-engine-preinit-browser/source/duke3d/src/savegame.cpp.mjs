// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/duke3d/src/savegame.cpp
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
export const fix16_rad_to_deg_mult__header_global_f856a4d6976bacd6 = i32(3754936);
function __cxx_static_address_b5e26d8dd0f13f703f678ce6() {
  return __cxx_static_address_b5e26d8dd0f13f703f678ce6.reference || (__cxx_static_address_b5e26d8dd0f13f703f678ce6.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_f856a4d6976bacd6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_f1299addb273dece = i32(1144);
function __cxx_static_address_edd6dbe83c1b6c2ff61e331f() {
  return __cxx_static_address_edd6dbe83c1b6c2ff61e331f.reference || (__cxx_static_address_edd6dbe83c1b6c2ff61e331f.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_f1299addb273dece; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:43
export const KICK_HIT____header_global_f8c611a51f041fed = ((((((0) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_23836ccbe8c66d4228f72f7a() {
  return __cxx_static_address_23836ccbe8c66d4228f72f7a.reference || (__cxx_static_address_23836ccbe8c66d4228f72f7a.reference = {
    __cReference: true,
    get value() { return KICK_HIT____header_global_f8c611a51f041fed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:44
export const PISTOL_RICOCHET____header_global_ee6bfadf3674290d = ((((((1) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1af1284c3a36c61aa4efd3da() {
  return __cxx_static_address_1af1284c3a36c61aa4efd3da.reference || (__cxx_static_address_1af1284c3a36c61aa4efd3da.reference = {
    __cReference: true,
    get value() { return PISTOL_RICOCHET____header_global_ee6bfadf3674290d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:45
export const PISTOL_BODYHIT____header_global_46dbea95ee0ac857 = ((((((2) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bd474f76c4d85f28fbb81cf2() {
  return __cxx_static_address_bd474f76c4d85f28fbb81cf2.reference || (__cxx_static_address_bd474f76c4d85f28fbb81cf2.reference = {
    __cReference: true,
    get value() { return PISTOL_BODYHIT____header_global_46dbea95ee0ac857; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:46
export const PISTOL_FIRE____header_global_4195f6eaa25ac8ee = ((((((3) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_11e19801fb4f03afe191b77b() {
  return __cxx_static_address_11e19801fb4f03afe191b77b.reference || (__cxx_static_address_11e19801fb4f03afe191b77b.reference = {
    __cReference: true,
    get value() { return PISTOL_FIRE____header_global_4195f6eaa25ac8ee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:47
export const EJECT_CLIP____header_global_288496db8ff1f84f = ((((((4) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_708d191e587cbbd9dd2ec0e4() {
  return __cxx_static_address_708d191e587cbbd9dd2ec0e4.reference || (__cxx_static_address_708d191e587cbbd9dd2ec0e4.reference = {
    __cReference: true,
    get value() { return EJECT_CLIP____header_global_288496db8ff1f84f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:48
export const INSERT_CLIP____header_global_3d551b7cb94161ba = ((((((5) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_004664e6ed074c35bbfc836c() {
  return __cxx_static_address_004664e6ed074c35bbfc836c.reference || (__cxx_static_address_004664e6ed074c35bbfc836c.reference = {
    __cReference: true,
    get value() { return INSERT_CLIP____header_global_3d551b7cb94161ba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:49
export const CHAINGUN_FIRE____header_global_56e6df11fdbde78c = ((((((6) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c462be5635f41dc583b52c04() {
  return __cxx_static_address_c462be5635f41dc583b52c04.reference || (__cxx_static_address_c462be5635f41dc583b52c04.reference = {
    __cReference: true,
    get value() { return CHAINGUN_FIRE____header_global_56e6df11fdbde78c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:50
export const RPG_SHOOT____header_global_cf550cc592c442c8 = ((((((7) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_38a1814eeb987402dd63c5fd() {
  return __cxx_static_address_38a1814eeb987402dd63c5fd.reference || (__cxx_static_address_38a1814eeb987402dd63c5fd.reference = {
    __cReference: true,
    get value() { return RPG_SHOOT____header_global_cf550cc592c442c8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:51
export const POOLBALLHIT____header_global_0f6f43aadc0082bd = ((((((8) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3dcaedf285542bfca4e054d6() {
  return __cxx_static_address_3dcaedf285542bfca4e054d6.reference || (__cxx_static_address_3dcaedf285542bfca4e054d6.reference = {
    __cReference: true,
    get value() { return POOLBALLHIT____header_global_0f6f43aadc0082bd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:52
export const RPG_EXPLODE____header_global_5385721b1ce929b5 = ((((((9) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_80daea72c651f596e65cc92e() {
  return __cxx_static_address_80daea72c651f596e65cc92e.reference || (__cxx_static_address_80daea72c651f596e65cc92e.reference = {
    __cReference: true,
    get value() { return RPG_EXPLODE____header_global_5385721b1ce929b5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:53
export const CAT_FIRE____header_global_bf922678f7f126ef = ((((((10) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_80a8a0756d9f439c01625658() {
  return __cxx_static_address_80a8a0756d9f439c01625658.reference || (__cxx_static_address_80a8a0756d9f439c01625658.reference = {
    __cReference: true,
    get value() { return CAT_FIRE____header_global_bf922678f7f126ef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:54
export const SHRINKER_FIRE____header_global_76d8e0262ba7ea33 = ((((((11) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_29ae456963236184a39e6581() {
  return __cxx_static_address_29ae456963236184a39e6581.reference || (__cxx_static_address_29ae456963236184a39e6581.reference = {
    __cReference: true,
    get value() { return SHRINKER_FIRE____header_global_76d8e0262ba7ea33; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:55
export const PIPEBOMB_BOUNCE____header_global_547cf1429aaee312 = ((((((13) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ec174cfda747795e2468760e() {
  return __cxx_static_address_ec174cfda747795e2468760e.reference || (__cxx_static_address_ec174cfda747795e2468760e.reference = {
    __cReference: true,
    get value() { return PIPEBOMB_BOUNCE____header_global_547cf1429aaee312; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:56
export const PIPEBOMB_EXPLODE____header_global_fa427d75faab1e3e = ((((((14) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9d2184b1ab4f9d8b31facda1() {
  return __cxx_static_address_9d2184b1ab4f9d8b31facda1.reference || (__cxx_static_address_9d2184b1ab4f9d8b31facda1.reference = {
    __cReference: true,
    get value() { return PIPEBOMB_EXPLODE____header_global_fa427d75faab1e3e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:57
export const LASERTRIP_ONWALL____header_global_d529ea0185d40ea9 = ((((((15) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_73a2df474690232e95e5523a() {
  return __cxx_static_address_73a2df474690232e95e5523a.reference || (__cxx_static_address_73a2df474690232e95e5523a.reference = {
    __cReference: true,
    get value() { return LASERTRIP_ONWALL____header_global_d529ea0185d40ea9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:58
export const LASERTRIP_ARMING____header_global_9e590dcb44a0ca65 = ((((((16) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b9490fe5dd6e741921ca255a() {
  return __cxx_static_address_b9490fe5dd6e741921ca255a.reference || (__cxx_static_address_b9490fe5dd6e741921ca255a.reference = {
    __cReference: true,
    get value() { return LASERTRIP_ARMING____header_global_9e590dcb44a0ca65; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:59
export const LASERTRIP_EXPLODE____header_global_6fd05ffd1c1d204e = ((((((17) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_abf768895013e5a74642fb83() {
  return __cxx_static_address_abf768895013e5a74642fb83.reference || (__cxx_static_address_abf768895013e5a74642fb83.reference = {
    __cReference: true,
    get value() { return LASERTRIP_EXPLODE____header_global_6fd05ffd1c1d204e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:60
export const VENT_BUST____header_global_f1fc670c91fcaabe = ((((((18) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_09efb6183382b3034e42b6b9() {
  return __cxx_static_address_09efb6183382b3034e42b6b9.reference || (__cxx_static_address_09efb6183382b3034e42b6b9.reference = {
    __cReference: true,
    get value() { return VENT_BUST____header_global_f1fc670c91fcaabe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:61
export const GLASS_BREAKING____header_global_f9547f70f0a3f248 = ((((((19) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9bedff66948c7bea636f0932() {
  return __cxx_static_address_9bedff66948c7bea636f0932.reference || (__cxx_static_address_9bedff66948c7bea636f0932.reference = {
    __cReference: true,
    get value() { return GLASS_BREAKING____header_global_f9547f70f0a3f248; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:62
export const GLASS_HEAVYBREAK____header_global_25a8cc6954d4c039 = ((((((20) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_51e9b92d6800d6550e42ec7f() {
  return __cxx_static_address_51e9b92d6800d6550e42ec7f.reference || (__cxx_static_address_51e9b92d6800d6550e42ec7f.reference = {
    __cReference: true,
    get value() { return GLASS_HEAVYBREAK____header_global_25a8cc6954d4c039; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:63
export const SHORT_CIRCUIT____header_global_880f1c62e41f5a21 = ((((((21) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9c8f020654418f1c00e79a4d() {
  return __cxx_static_address_9c8f020654418f1c00e79a4d.reference || (__cxx_static_address_9c8f020654418f1c00e79a4d.reference = {
    __cReference: true,
    get value() { return SHORT_CIRCUIT____header_global_880f1c62e41f5a21; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:64
export const ITEM_SPLASH____header_global_fa1adb770624042b = ((((((22) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c9d276aed0ca7728f3b975ee() {
  return __cxx_static_address_c9d276aed0ca7728f3b975ee.reference || (__cxx_static_address_c9d276aed0ca7728f3b975ee.reference = {
    __cReference: true,
    get value() { return ITEM_SPLASH____header_global_fa1adb770624042b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:65
export const DUKE_GASP____header_global_6cf6080414f7881c = ((((((25) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_961d9e70025424939a74202c() {
  return __cxx_static_address_961d9e70025424939a74202c.reference || (__cxx_static_address_961d9e70025424939a74202c.reference = {
    __cReference: true,
    get value() { return DUKE_GASP____header_global_6cf6080414f7881c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:66
export const SLIM_RECOG____header_global_52bc1ca9113fec81 = ((((((26) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5769a94bb4a476c6bfd5fa60() {
  return __cxx_static_address_5769a94bb4a476c6bfd5fa60.reference || (__cxx_static_address_5769a94bb4a476c6bfd5fa60.reference = {
    __cReference: true,
    get value() { return SLIM_RECOG____header_global_52bc1ca9113fec81; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:67
export const DUKE_URINATE____header_global_dc69e617e5b2c761 = ((((((28) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a3500897069dbffcba82dda3() {
  return __cxx_static_address_a3500897069dbffcba82dda3.reference || (__cxx_static_address_a3500897069dbffcba82dda3.reference = {
    __cReference: true,
    get value() { return DUKE_URINATE____header_global_dc69e617e5b2c761; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:68
export const ENDSEQVOL3SND2____header_global_fd4484208a41c66f = ((((((29) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_565e7238619a13af49f2c9b7() {
  return __cxx_static_address_565e7238619a13af49f2c9b7.reference || (__cxx_static_address_565e7238619a13af49f2c9b7.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND2____header_global_fd4484208a41c66f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:69
export const ENDSEQVOL3SND3____header_global_50fa2866f66d592e = ((((((30) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f3aa6b489b7e9331cb473a09() {
  return __cxx_static_address_f3aa6b489b7e9331cb473a09.reference || (__cxx_static_address_f3aa6b489b7e9331cb473a09.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND3____header_global_50fa2866f66d592e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:70
export const DUKE_CRACK____header_global_4b5422bae8c47055 = ((((((33) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e2a97358ca64c7d72be2945e() {
  return __cxx_static_address_e2a97358ca64c7d72be2945e.reference || (__cxx_static_address_e2a97358ca64c7d72be2945e.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK____header_global_4b5422bae8c47055; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:71
export const SLIM_ATTACK____header_global_7d0a9bf4cdaa96d0 = ((((((34) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2258599cc768e5eeb77c9539() {
  return __cxx_static_address_2258599cc768e5eeb77c9539.reference || (__cxx_static_address_2258599cc768e5eeb77c9539.reference = {
    __cReference: true,
    get value() { return SLIM_ATTACK____header_global_7d0a9bf4cdaa96d0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:72
export const SOMETHINGHITFORCE____header_global_a4164eaa3564fca1 = ((((((35) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e70320109a5e2ce7ebe86a19() {
  return __cxx_static_address_e70320109a5e2ce7ebe86a19.reference || (__cxx_static_address_e70320109a5e2ce7ebe86a19.reference = {
    __cReference: true,
    get value() { return SOMETHINGHITFORCE____header_global_a4164eaa3564fca1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:73
export const DUKE_DRINKING____header_global_b6986ceae8c2fd7a = ((((((36) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b402c31b8b0cf81232c29371() {
  return __cxx_static_address_b402c31b8b0cf81232c29371.reference || (__cxx_static_address_b402c31b8b0cf81232c29371.reference = {
    __cReference: true,
    get value() { return DUKE_DRINKING____header_global_b6986ceae8c2fd7a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:74
export const DUKE_GRUNT____header_global_5531327a9f6c1efe = ((((((38) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d7fda0907f1e6e43cc6a5d82() {
  return __cxx_static_address_d7fda0907f1e6e43cc6a5d82.reference || (__cxx_static_address_d7fda0907f1e6e43cc6a5d82.reference = {
    __cReference: true,
    get value() { return DUKE_GRUNT____header_global_5531327a9f6c1efe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:75
export const DUKE_HARTBEAT____header_global_e0299a3d3bb6dde1 = ((((((39) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c78811b4b992b7fef3cb151e() {
  return __cxx_static_address_c78811b4b992b7fef3cb151e.reference || (__cxx_static_address_c78811b4b992b7fef3cb151e.reference = {
    __cReference: true,
    get value() { return DUKE_HARTBEAT____header_global_e0299a3d3bb6dde1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:76
export const DUKE_ONWATER____header_global_a42f050ccd0fc17c = ((((((40) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_409666784a1fa103cb0fd53f() {
  return __cxx_static_address_409666784a1fa103cb0fd53f.reference || (__cxx_static_address_409666784a1fa103cb0fd53f.reference = {
    __cReference: true,
    get value() { return DUKE_ONWATER____header_global_a42f050ccd0fc17c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:77
export const DUKE_LAND____header_global_7fd583fcec55b085 = ((((((42) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aca5e9e0822f9e714ef71bcd() {
  return __cxx_static_address_aca5e9e0822f9e714ef71bcd.reference || (__cxx_static_address_aca5e9e0822f9e714ef71bcd.reference = {
    __cReference: true,
    get value() { return DUKE_LAND____header_global_7fd583fcec55b085; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:78
export const DUKE_WALKINDUCTS____header_global_5158be696ae30e97 = ((((((43) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e21f8c8502e567004bc2afbd() {
  return __cxx_static_address_e21f8c8502e567004bc2afbd.reference || (__cxx_static_address_e21f8c8502e567004bc2afbd.reference = {
    __cReference: true,
    get value() { return DUKE_WALKINDUCTS____header_global_5158be696ae30e97; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:79
export const DUKE_UNDERWATER____header_global_0e7b046fd357808b = ((((((48) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9b7b1f99cdfebc743f7cd9ad() {
  return __cxx_static_address_9b7b1f99cdfebc743f7cd9ad.reference || (__cxx_static_address_9b7b1f99cdfebc743f7cd9ad.reference = {
    __cReference: true,
    get value() { return DUKE_UNDERWATER____header_global_0e7b046fd357808b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:80
export const DUKE_JETPACK_ON____header_global_8713033832e606af = ((((((49) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_da75fb572f4ffe803e45a8f4() {
  return __cxx_static_address_da75fb572f4ffe803e45a8f4.reference || (__cxx_static_address_da75fb572f4ffe803e45a8f4.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_ON____header_global_8713033832e606af; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:81
export const DUKE_JETPACK_IDLE____header_global_9b56a5abd91d5cc8 = ((((((50) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b06d4603a7b583d864ab7542() {
  return __cxx_static_address_b06d4603a7b583d864ab7542.reference || (__cxx_static_address_b06d4603a7b583d864ab7542.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_IDLE____header_global_9b56a5abd91d5cc8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:82
export const DUKE_JETPACK_OFF____header_global_d5c930cdd3d0cada = ((((((51) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b2ed8b71619411e6fafa7dc4() {
  return __cxx_static_address_b2ed8b71619411e6fafa7dc4.reference || (__cxx_static_address_b2ed8b71619411e6fafa7dc4.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_OFF____header_global_d5c930cdd3d0cada; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:83
export const DUKETALKTOBOSS____header_global_2f758442bd980b05 = ((((((56) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_46b56de5cada5ed0e7311a5f() {
  return __cxx_static_address_46b56de5cada5ed0e7311a5f.reference || (__cxx_static_address_46b56de5cada5ed0e7311a5f.reference = {
    __cReference: true,
    get value() { return DUKETALKTOBOSS____header_global_2f758442bd980b05; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:84
export const SQUISHED____header_global_6e3f38fe23e929f9 = ((((((69) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0be3684db454d9d77f5ccbe6() {
  return __cxx_static_address_0be3684db454d9d77f5ccbe6.reference || (__cxx_static_address_0be3684db454d9d77f5ccbe6.reference = {
    __cReference: true,
    get value() { return SQUISHED____header_global_6e3f38fe23e929f9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:85
export const TELEPORTER____header_global_bb9987dc975a12ad = ((((((70) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d291dbc0679127e2d8504771() {
  return __cxx_static_address_d291dbc0679127e2d8504771.reference || (__cxx_static_address_d291dbc0679127e2d8504771.reference = {
    __cReference: true,
    get value() { return TELEPORTER____header_global_bb9987dc975a12ad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:86
export const ELEVATOR_ON____header_global_2210ac9697e0be71 = ((((((71) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f11c445dd53bea243f13458f() {
  return __cxx_static_address_f11c445dd53bea243f13458f.reference || (__cxx_static_address_f11c445dd53bea243f13458f.reference = {
    __cReference: true,
    get value() { return ELEVATOR_ON____header_global_2210ac9697e0be71; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:87
export const ELEVATOR_OFF____header_global_705f51f5bcc88a61 = ((((((73) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_947be6ed0528a2aa5805fdb0() {
  return __cxx_static_address_947be6ed0528a2aa5805fdb0.reference || (__cxx_static_address_947be6ed0528a2aa5805fdb0.reference = {
    __cReference: true,
    get value() { return ELEVATOR_OFF____header_global_705f51f5bcc88a61; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:88
export const SUBWAY____header_global_58f42d5fd6ac65ad = ((((((75) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_63ff6d09aa02d42395164aed() {
  return __cxx_static_address_63ff6d09aa02d42395164aed.reference || (__cxx_static_address_63ff6d09aa02d42395164aed.reference = {
    __cReference: true,
    get value() { return SUBWAY____header_global_58f42d5fd6ac65ad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:89
export const SWITCH_ON____header_global_f78b8932a40476de = ((((((76) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8eb1118ff76d9882546ca651() {
  return __cxx_static_address_8eb1118ff76d9882546ca651.reference || (__cxx_static_address_8eb1118ff76d9882546ca651.reference = {
    __cReference: true,
    get value() { return SWITCH_ON____header_global_f78b8932a40476de; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:90
export const FLUSH_TOILET____header_global_932c43f224bd066a = ((((((79) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f5ffc489701d74a8656a8d79() {
  return __cxx_static_address_f5ffc489701d74a8656a8d79.reference || (__cxx_static_address_f5ffc489701d74a8656a8d79.reference = {
    __cReference: true,
    get value() { return FLUSH_TOILET____header_global_932c43f224bd066a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:91
export const EARTHQUAKE____header_global_dac246df6568c27e = ((((((81) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_59ff859b2fa6587b404f0e69() {
  return __cxx_static_address_59ff859b2fa6587b404f0e69.reference || (__cxx_static_address_59ff859b2fa6587b404f0e69.reference = {
    __cReference: true,
    get value() { return EARTHQUAKE____header_global_dac246df6568c27e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:92
export const END_OF_LEVEL_WARN____header_global_0d6e2bc75db89e51 = ((((((83) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_47477fb874c2f2dd4103e7b5() {
  return __cxx_static_address_47477fb874c2f2dd4103e7b5.reference || (__cxx_static_address_47477fb874c2f2dd4103e7b5.reference = {
    __cReference: true,
    get value() { return END_OF_LEVEL_WARN____header_global_0d6e2bc75db89e51; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:93
export const WIND_AMBIENCE____header_global_b19ee1fd96bac933 = ((((((91) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9dd9bf1787403e408e3b3d9c() {
  return __cxx_static_address_9dd9bf1787403e408e3b3d9c.reference || (__cxx_static_address_9dd9bf1787403e408e3b3d9c.reference = {
    __cReference: true,
    get value() { return WIND_AMBIENCE____header_global_b19ee1fd96bac933; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:94
export const SOMETHING_DRIPPING____header_global_64761d44c5403294 = ((((((92) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a61c8954b1ae881aa1df6555() {
  return __cxx_static_address_a61c8954b1ae881aa1df6555.reference || (__cxx_static_address_a61c8954b1ae881aa1df6555.reference = {
    __cReference: true,
    get value() { return SOMETHING_DRIPPING____header_global_64761d44c5403294; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:95
export const BOS1_RECOG____header_global_da3570514b14b4d8 = ((((((97) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_63ebaa9fb54668826447def5() {
  return __cxx_static_address_63ebaa9fb54668826447def5.reference || (__cxx_static_address_63ebaa9fb54668826447def5.reference = {
    __cReference: true,
    get value() { return BOS1_RECOG____header_global_da3570514b14b4d8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:96
export const BOS2_RECOG____header_global_a572df04ee9b2439 = ((((((102) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a43db8a6f774538396e9c91a() {
  return __cxx_static_address_a43db8a6f774538396e9c91a.reference || (__cxx_static_address_a43db8a6f774538396e9c91a.reference = {
    __cReference: true,
    get value() { return BOS2_RECOG____header_global_a572df04ee9b2439; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:97
export const DUKE_GETWEAPON2____header_global_49bef173f60d3de0 = ((((((107) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b298809f000e6ad4a16d61ef() {
  return __cxx_static_address_b298809f000e6ad4a16d61ef.reference || (__cxx_static_address_b298809f000e6ad4a16d61ef.reference = {
    __cReference: true,
    get value() { return DUKE_GETWEAPON2____header_global_49bef173f60d3de0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:98
export const SHOTGUN_FIRE____header_global_3d258162e6fdc3f3 = ((((((109) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_99de2e74aed96e72e02eb844() {
  return __cxx_static_address_99de2e74aed96e72e02eb844.reference || (__cxx_static_address_99de2e74aed96e72e02eb844.reference = {
    __cReference: true,
    get value() { return SHOTGUN_FIRE____header_global_3d258162e6fdc3f3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:99
export const PRED_RECOG____header_global_c1cb573263cb3f85 = ((((((111) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_525393d13c7e398cc151bcf1() {
  return __cxx_static_address_525393d13c7e398cc151bcf1.reference || (__cxx_static_address_525393d13c7e398cc151bcf1.reference = {
    __cReference: true,
    get value() { return PRED_RECOG____header_global_c1cb573263cb3f85; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:100
export const CAPT_RECOG____header_global_31058328089375c7 = ((((((117) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_77b845f506cf572ce92fddb6() {
  return __cxx_static_address_77b845f506cf572ce92fddb6.reference || (__cxx_static_address_77b845f506cf572ce92fddb6.reference = {
    __cReference: true,
    get value() { return CAPT_RECOG____header_global_31058328089375c7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:101
export const PIG_RECOG____header_global_a534ce161b8f5d01 = ((((((121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3816acdb406ec5ceed1b1a12() {
  return __cxx_static_address_3816acdb406ec5ceed1b1a12.reference || (__cxx_static_address_3816acdb406ec5ceed1b1a12.reference = {
    __cReference: true,
    get value() { return PIG_RECOG____header_global_a534ce161b8f5d01; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:102
export const RECO_ROAM____header_global_bb2618bb2e1420aa = ((((((125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9c5dcda86016f29f59d21a31() {
  return __cxx_static_address_9c5dcda86016f29f59d21a31.reference || (__cxx_static_address_9c5dcda86016f29f59d21a31.reference = {
    __cReference: true,
    get value() { return RECO_ROAM____header_global_bb2618bb2e1420aa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:103
export const RECO_RECOG____header_global_e6d74ea9b2a66a1b = ((((((126) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_91485575c0eec75a3f3953b4() {
  return __cxx_static_address_91485575c0eec75a3f3953b4.reference || (__cxx_static_address_91485575c0eec75a3f3953b4.reference = {
    __cReference: true,
    get value() { return RECO_RECOG____header_global_e6d74ea9b2a66a1b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:104
export const RECO_ATTACK____header_global_5af5509baebca7c3 = ((((((127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_54b993c0ce6dfb87e7ff8d61() {
  return __cxx_static_address_54b993c0ce6dfb87e7ff8d61.reference || (__cxx_static_address_54b993c0ce6dfb87e7ff8d61.reference = {
    __cReference: true,
    get value() { return RECO_ATTACK____header_global_5af5509baebca7c3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:105
export const RECO_PAIN____header_global_62106a683c5c07c2 = ((((((128) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b26bb6591557a1af12dbcc30() {
  return __cxx_static_address_b26bb6591557a1af12dbcc30.reference || (__cxx_static_address_b26bb6591557a1af12dbcc30.reference = {
    __cReference: true,
    get value() { return RECO_PAIN____header_global_62106a683c5c07c2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:106
export const DRON_RECOG____header_global_fdc4f175bb276753 = ((((((131) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5c2b223d0d3370d6bae71af6() {
  return __cxx_static_address_5c2b223d0d3370d6bae71af6.reference || (__cxx_static_address_5c2b223d0d3370d6bae71af6.reference = {
    __cReference: true,
    get value() { return DRON_RECOG____header_global_fdc4f175bb276753; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:107
export const COMM_RECOG____header_global_4fb6e7ad5107b592 = ((((((136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_38d02af4a7eb8143e9729751() {
  return __cxx_static_address_38d02af4a7eb8143e9729751.reference || (__cxx_static_address_38d02af4a7eb8143e9729751.reference = {
    __cReference: true,
    get value() { return COMM_RECOG____header_global_4fb6e7ad5107b592; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:108
export const OCTA_RECOG____header_global_77cdc3af90c0dc81 = ((((((141) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c733df5b5f1e284fa80bbbd6() {
  return __cxx_static_address_c733df5b5f1e284fa80bbbd6.reference || (__cxx_static_address_c733df5b5f1e284fa80bbbd6.reference = {
    __cReference: true,
    get value() { return OCTA_RECOG____header_global_77cdc3af90c0dc81; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:109
export const TURR_RECOG____header_global_56bd2083fd68a75e = ((((((146) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0171517d31eafd371e9fbfec() {
  return __cxx_static_address_0171517d31eafd371e9fbfec.reference || (__cxx_static_address_0171517d31eafd371e9fbfec.reference = {
    __cReference: true,
    get value() { return TURR_RECOG____header_global_56bd2083fd68a75e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:110
export const SLIM_DYING____header_global_ab4bcef008940979 = ((((((149) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3fcb17294ce6094e8d4b347e() {
  return __cxx_static_address_3fcb17294ce6094e8d4b347e.reference || (__cxx_static_address_3fcb17294ce6094e8d4b347e.reference = {
    __cReference: true,
    get value() { return SLIM_DYING____header_global_ab4bcef008940979; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:111
export const BOS3_RECOG____header_global_5a308762b04927a7 = ((((((151) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4cf1e8551ef33488c0368f51() {
  return __cxx_static_address_4cf1e8551ef33488c0368f51.reference || (__cxx_static_address_4cf1e8551ef33488c0368f51.reference = {
    __cReference: true,
    get value() { return BOS3_RECOG____header_global_5a308762b04927a7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:112
export const BOS1_WALK____header_global_f44c6276f6750c3c = ((((((156) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_42f4eb18f2c7d1c7d2459e17() {
  return __cxx_static_address_42f4eb18f2c7d1c7d2459e17.reference || (__cxx_static_address_42f4eb18f2c7d1c7d2459e17.reference = {
    __cReference: true,
    get value() { return BOS1_WALK____header_global_f44c6276f6750c3c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:113
export const THUD____header_global_6bf885bdcb6f6ec9 = ((((((158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f73fedafde3cc064b2ba9a71() {
  return __cxx_static_address_f73fedafde3cc064b2ba9a71.reference || (__cxx_static_address_f73fedafde3cc064b2ba9a71.reference = {
    __cReference: true,
    get value() { return THUD____header_global_6bf885bdcb6f6ec9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:114
export const WIERDSHOT_FLY____header_global_37dca31ae2b5cefe = ((((((160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6fed3de038547a393b8be5bd() {
  return __cxx_static_address_6fed3de038547a393b8be5bd.reference || (__cxx_static_address_6fed3de038547a393b8be5bd.reference = {
    __cReference: true,
    get value() { return WIERDSHOT_FLY____header_global_37dca31ae2b5cefe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:115
export const SLIM_ROAM____header_global_98ee345f28e2fcb3 = ((((((163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e7c5c103e8e1f88b1ce8a700() {
  return __cxx_static_address_e7c5c103e8e1f88b1ce8a700.reference || (__cxx_static_address_e7c5c103e8e1f88b1ce8a700.reference = {
    __cReference: true,
    get value() { return SLIM_ROAM____header_global_98ee345f28e2fcb3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:116
export const SHOTGUN_COCK____header_global_4d792b2a6b6f433c = ((((((169) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_57dc99c4e789fdcffdff870a() {
  return __cxx_static_address_57dc99c4e789fdcffdff870a.reference || (__cxx_static_address_57dc99c4e789fdcffdff870a.reference = {
    __cReference: true,
    get value() { return SHOTGUN_COCK____header_global_4d792b2a6b6f433c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:117
export const GENERIC_AMBIENCE17____header_global_9dea34328773bcdf = ((((((177) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2c0d070ad55b2c8712285c92() {
  return __cxx_static_address_2c0d070ad55b2c8712285c92.reference || (__cxx_static_address_2c0d070ad55b2c8712285c92.reference = {
    __cReference: true,
    get value() { return GENERIC_AMBIENCE17____header_global_9dea34328773bcdf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:118
export const BONUS_SPEECH1____header_global_fd32d479451733ff = ((((((195) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3179bc0ef32147d5e7bc5085() {
  return __cxx_static_address_3179bc0ef32147d5e7bc5085.reference || (__cxx_static_address_3179bc0ef32147d5e7bc5085.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH1____header_global_fd32d479451733ff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:119
export const BONUS_SPEECH2____header_global_d98a36872a0b9b64 = ((((((196) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d41361fc7b564b0ed8a420eb() {
  return __cxx_static_address_d41361fc7b564b0ed8a420eb.reference || (__cxx_static_address_d41361fc7b564b0ed8a420eb.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH2____header_global_d98a36872a0b9b64; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:120
export const BONUS_SPEECH3____header_global_bcddbf3e6e54e33e = ((((((197) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fded0bb28a51eeca3e7c5d8a() {
  return __cxx_static_address_fded0bb28a51eeca3e7c5d8a.reference || (__cxx_static_address_fded0bb28a51eeca3e7c5d8a.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH3____header_global_bcddbf3e6e54e33e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:121
export const BONUS_SPEECH4____header_global_ac2fd8cd0b383f65 = ((((((199) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6d391b45457c81e8c433923e() {
  return __cxx_static_address_6d391b45457c81e8c433923e.reference || (__cxx_static_address_6d391b45457c81e8c433923e.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH4____header_global_ac2fd8cd0b383f65; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:122
export const DUKE_LAND_HURT____header_global_1846640a0b31b379 = ((((((200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b17de1886b01d9f2680624e3() {
  return __cxx_static_address_b17de1886b01d9f2680624e3.reference || (__cxx_static_address_b17de1886b01d9f2680624e3.reference = {
    __cReference: true,
    get value() { return DUKE_LAND_HURT____header_global_1846640a0b31b379; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:123
export const DUKE_SEARCH2____header_global_a188dc5b3c4f687a = ((((((207) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_74996fdc81e3bccbbd881462() {
  return __cxx_static_address_74996fdc81e3bccbbd881462.reference || (__cxx_static_address_74996fdc81e3bccbbd881462.reference = {
    __cReference: true,
    get value() { return DUKE_SEARCH2____header_global_a188dc5b3c4f687a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:124
export const DUKE_CRACK2____header_global_14366ea9c51ccda2 = ((((((208) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2121da2e8ea7936b5875f421() {
  return __cxx_static_address_2121da2e8ea7936b5875f421.reference || (__cxx_static_address_2121da2e8ea7936b5875f421.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK2____header_global_14366ea9c51ccda2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:125
export const DUKE_SEARCH____header_global_e6afcbf958762827 = ((((((209) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_40a918801e8e6c5495ca5fdd() {
  return __cxx_static_address_40a918801e8e6c5495ca5fdd.reference || (__cxx_static_address_40a918801e8e6c5495ca5fdd.reference = {
    __cReference: true,
    get value() { return DUKE_SEARCH____header_global_e6afcbf958762827; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:126
export const DUKE_GET____header_global_cc09328381f8a02e = ((((((210) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ccddc4e5b74324c87546f4a3() {
  return __cxx_static_address_ccddc4e5b74324c87546f4a3.reference || (__cxx_static_address_ccddc4e5b74324c87546f4a3.reference = {
    __cReference: true,
    get value() { return DUKE_GET____header_global_cc09328381f8a02e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:127
export const DUKE_LONGTERM_PAIN____header_global_454ab5d5558abdec = ((((((211) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d11d96f34091c3f98ee71d78() {
  return __cxx_static_address_d11d96f34091c3f98ee71d78.reference || (__cxx_static_address_d11d96f34091c3f98ee71d78.reference = {
    __cReference: true,
    get value() { return DUKE_LONGTERM_PAIN____header_global_454ab5d5558abdec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:128
export const MONITOR_ACTIVE____header_global_69448df3c9b11a7c = ((((((212) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_18a056b3717e5f3cbf8fdc1f() {
  return __cxx_static_address_18a056b3717e5f3cbf8fdc1f.reference || (__cxx_static_address_18a056b3717e5f3cbf8fdc1f.reference = {
    __cReference: true,
    get value() { return MONITOR_ACTIVE____header_global_69448df3c9b11a7c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:129
export const NITEVISION_ONOFF____header_global_f44dffe5d2b86bf6 = ((((((213) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6e65191066c11fcc2e8aae51() {
  return __cxx_static_address_6e65191066c11fcc2e8aae51.reference || (__cxx_static_address_6e65191066c11fcc2e8aae51.reference = {
    __cReference: true,
    get value() { return NITEVISION_ONOFF____header_global_f44dffe5d2b86bf6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:130
export const DUKE_CRACK_FIRST____header_global_224c1f0f36372550 = ((((((215) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_58f28642d776132c2e6879f0() {
  return __cxx_static_address_58f28642d776132c2e6879f0.reference || (__cxx_static_address_58f28642d776132c2e6879f0.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK_FIRST____header_global_224c1f0f36372550; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:131
export const DUKE_USEMEDKIT____header_global_66b7cb2bf0c5e68d = ((((((216) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d8a9f8fad44ad3e297e17a53() {
  return __cxx_static_address_d8a9f8fad44ad3e297e17a53.reference || (__cxx_static_address_d8a9f8fad44ad3e297e17a53.reference = {
    __cReference: true,
    get value() { return DUKE_USEMEDKIT____header_global_66b7cb2bf0c5e68d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:132
export const DUKE_TAKEPILLS____header_global_075bbac40a348b29 = ((((((217) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a1a881ff9008037b9a3252c1() {
  return __cxx_static_address_a1a881ff9008037b9a3252c1.reference || (__cxx_static_address_a1a881ff9008037b9a3252c1.reference = {
    __cReference: true,
    get value() { return DUKE_TAKEPILLS____header_global_075bbac40a348b29; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:133
export const DUKE_PISSRELIEF____header_global_a1a137b0bbfb3763 = ((((((218) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8db37753b993778eb7efbc5a() {
  return __cxx_static_address_8db37753b993778eb7efbc5a.reference || (__cxx_static_address_8db37753b993778eb7efbc5a.reference = {
    __cReference: true,
    get value() { return DUKE_PISSRELIEF____header_global_a1a137b0bbfb3763; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:134
export const SELECT_WEAPON____header_global_b87632d764048b5f = ((((((219) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3a908622175e0602e6511ee6() {
  return __cxx_static_address_3a908622175e0602e6511ee6.reference || (__cxx_static_address_3a908622175e0602e6511ee6.reference = {
    __cReference: true,
    get value() { return SELECT_WEAPON____header_global_b87632d764048b5f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:135
export const JIBBED_ACTOR5____header_global_2dbdaec7ffcbf130 = ((((((226) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_526e694de5de50ed337c705a() {
  return __cxx_static_address_526e694de5de50ed337c705a.reference || (__cxx_static_address_526e694de5de50ed337c705a.reference = {
    __cReference: true,
    get value() { return JIBBED_ACTOR5____header_global_2dbdaec7ffcbf130; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:136
export const JIBBED_ACTOR6____header_global_0ff3eee9c85322a7 = ((((((227) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1dff184094074ad6a67225da() {
  return __cxx_static_address_1dff184094074ad6a67225da.reference || (__cxx_static_address_1dff184094074ad6a67225da.reference = {
    __cReference: true,
    get value() { return JIBBED_ACTOR6____header_global_0ff3eee9c85322a7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:137
export const DUKE_GOTHEALTHATLOW____header_global_24f965c090584f63 = ((((((229) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5935b3ac57da2c2552a1d59b() {
  return __cxx_static_address_5935b3ac57da2c2552a1d59b.reference || (__cxx_static_address_5935b3ac57da2c2552a1d59b.reference = {
    __cReference: true,
    get value() { return DUKE_GOTHEALTHATLOW____header_global_24f965c090584f63; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:138
export const BOSSTALKTODUKE____header_global_158d689fff1729be = ((((((230) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_00e6868ec29ef84b97d4132b() {
  return __cxx_static_address_00e6868ec29ef84b97d4132b.reference || (__cxx_static_address_00e6868ec29ef84b97d4132b.reference = {
    __cReference: true,
    get value() { return BOSSTALKTODUKE____header_global_158d689fff1729be; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:139
export const WAR_AMBIENCE2____header_global_96366f25c1d9ff71 = ((((((232) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7940b5977c1dd27269083e52() {
  return __cxx_static_address_7940b5977c1dd27269083e52.reference || (__cxx_static_address_7940b5977c1dd27269083e52.reference = {
    __cReference: true,
    get value() { return WAR_AMBIENCE2____header_global_96366f25c1d9ff71; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:140
export const EXITMENUSOUND____header_global_29139b26c4961a41 = ((((((243) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8d24f6e53e4f532876438103() {
  return __cxx_static_address_8d24f6e53e4f532876438103.reference || (__cxx_static_address_8d24f6e53e4f532876438103.reference = {
    __cReference: true,
    get value() { return EXITMENUSOUND____header_global_29139b26c4961a41; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:141
export const FLY_BY____header_global_9845524af1d677eb = ((((((244) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_65604ae926f74a7534d3524a() {
  return __cxx_static_address_65604ae926f74a7534d3524a.reference || (__cxx_static_address_65604ae926f74a7534d3524a.reference = {
    __cReference: true,
    get value() { return FLY_BY____header_global_9845524af1d677eb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:142
export const DUKE_SCREAM____header_global_ae5d3de023338a38 = ((((((245) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6862fad8f387990bd7b49c99() {
  return __cxx_static_address_6862fad8f387990bd7b49c99.reference || (__cxx_static_address_6862fad8f387990bd7b49c99.reference = {
    __cReference: true,
    get value() { return DUKE_SCREAM____header_global_ae5d3de023338a38; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:143
export const SHRINKER_HIT____header_global_0ac81c08421b338c = ((((((246) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_925515bf47f532f7b43d6b75() {
  return __cxx_static_address_925515bf47f532f7b43d6b75.reference || (__cxx_static_address_925515bf47f532f7b43d6b75.reference = {
    __cReference: true,
    get value() { return SHRINKER_HIT____header_global_0ac81c08421b338c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:144
export const RATTY____header_global_560b92bb67a5f07c = ((((((247) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ec999516ec0bffac440a1e76() {
  return __cxx_static_address_ec999516ec0bffac440a1e76.reference || (__cxx_static_address_ec999516ec0bffac440a1e76.reference = {
    __cReference: true,
    get value() { return RATTY____header_global_560b92bb67a5f07c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:145
export const BONUSMUSIC____header_global_2c43f21f25ff2c29 = ((((((249) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b87bd908ce9596d8540995cc() {
  return __cxx_static_address_b87bd908ce9596d8540995cc.reference || (__cxx_static_address_b87bd908ce9596d8540995cc.reference = {
    __cReference: true,
    get value() { return BONUSMUSIC____header_global_2c43f21f25ff2c29; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:146
export const DUKE_GETWEAPON6____header_global_c15a49609dff939e = ((((((264) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_55cc221535458592f2835167() {
  return __cxx_static_address_55cc221535458592f2835167.reference || (__cxx_static_address_55cc221535458592f2835167.reference = {
    __cReference: true,
    get value() { return DUKE_GETWEAPON6____header_global_c15a49609dff939e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:147
export const ALIEN_SWITCH1____header_global_f0950f058591a61c = ((((((272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_444fbe17c0aa0d0b815a2f4a() {
  return __cxx_static_address_444fbe17c0aa0d0b815a2f4a.reference || (__cxx_static_address_444fbe17c0aa0d0b815a2f4a.reference = {
    __cReference: true,
    get value() { return ALIEN_SWITCH1____header_global_f0950f058591a61c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:148
export const RIPHEADNECK____header_global_3531b005840f1e42 = ((((((284) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9af10eb31a6a27a003c4e935() {
  return __cxx_static_address_9af10eb31a6a27a003c4e935.reference || (__cxx_static_address_9af10eb31a6a27a003c4e935.reference = {
    __cReference: true,
    get value() { return RIPHEADNECK____header_global_3531b005840f1e42; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:149
export const ENDSEQVOL3SND4____header_global_a19000adbf01846c = ((((((288) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5216f9678ea27c253935edb8() {
  return __cxx_static_address_5216f9678ea27c253935edb8.reference || (__cxx_static_address_5216f9678ea27c253935edb8.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND4____header_global_a19000adbf01846c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:150
export const ENDSEQVOL3SND5____header_global_3a24342a45b3ef3d = ((((((289) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8bc55aaae0fa2ac87b1f060a() {
  return __cxx_static_address_8bc55aaae0fa2ac87b1f060a.reference || (__cxx_static_address_8bc55aaae0fa2ac87b1f060a.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND5____header_global_3a24342a45b3ef3d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:151
export const ENDSEQVOL3SND6____header_global_da85a05785e5eeff = ((((((290) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_884802913436a89e1fc549a6() {
  return __cxx_static_address_884802913436a89e1fc549a6.reference || (__cxx_static_address_884802913436a89e1fc549a6.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND6____header_global_da85a05785e5eeff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:152
export const ENDSEQVOL3SND7____header_global_c5b93f60eb1c1b08 = ((((((291) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4e069b8bfd5f7655ebd22a98() {
  return __cxx_static_address_4e069b8bfd5f7655ebd22a98.reference || (__cxx_static_address_4e069b8bfd5f7655ebd22a98.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND7____header_global_c5b93f60eb1c1b08; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:153
export const ENDSEQVOL3SND8____header_global_494b7800dda45665 = ((((((292) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_837a274c24d9abddcde5b2f7() {
  return __cxx_static_address_837a274c24d9abddcde5b2f7.reference || (__cxx_static_address_837a274c24d9abddcde5b2f7.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND8____header_global_494b7800dda45665; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:154
export const ENDSEQVOL3SND9____header_global_45254572e578d74e = ((((((293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dd3dbfa225ca29609a88101b() {
  return __cxx_static_address_dd3dbfa225ca29609a88101b.reference || (__cxx_static_address_dd3dbfa225ca29609a88101b.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND9____header_global_45254572e578d74e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:155
export const WHIPYOURASS____header_global_7a54f431f333787c = ((((((294) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_797b42e6def885237772a219() {
  return __cxx_static_address_797b42e6def885237772a219.reference || (__cxx_static_address_797b42e6def885237772a219.reference = {
    __cReference: true,
    get value() { return WHIPYOURASS____header_global_7a54f431f333787c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:156
export const ENDSEQVOL2SND1____header_global_6cb65bb54c0bf8c9 = ((((((295) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_29f997dfb471edf4c99bd05e() {
  return __cxx_static_address_29f997dfb471edf4c99bd05e.reference || (__cxx_static_address_29f997dfb471edf4c99bd05e.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND1____header_global_6cb65bb54c0bf8c9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:157
export const ENDSEQVOL2SND2____header_global_ae3c2291554e2b71 = ((((((296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0a72ea2f48e7b22d7fe51337() {
  return __cxx_static_address_0a72ea2f48e7b22d7fe51337.reference || (__cxx_static_address_0a72ea2f48e7b22d7fe51337.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND2____header_global_ae3c2291554e2b71; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:158
export const ENDSEQVOL2SND3____header_global_fe57d366b7c49ebe = ((((((297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cd6922a3dc180de99db3da35() {
  return __cxx_static_address_cd6922a3dc180de99db3da35.reference || (__cxx_static_address_cd6922a3dc180de99db3da35.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND3____header_global_fe57d366b7c49ebe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:159
export const ENDSEQVOL2SND4____header_global_9b402289dc9580c8 = ((((((298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7d5697b6b3853c9bca83896b() {
  return __cxx_static_address_7d5697b6b3853c9bca83896b.reference || (__cxx_static_address_7d5697b6b3853c9bca83896b.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND4____header_global_9b402289dc9580c8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:160
export const ENDSEQVOL2SND5____header_global_4c976267aef44bce = ((((((299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aeb3b92e9abfd9a3480406fe() {
  return __cxx_static_address_aeb3b92e9abfd9a3480406fe.reference || (__cxx_static_address_aeb3b92e9abfd9a3480406fe.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND5____header_global_4c976267aef44bce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:161
export const ENDSEQVOL2SND6____header_global_673ecc870e6648fc = ((((((300) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a443b19535314c6ed7e843aa() {
  return __cxx_static_address_a443b19535314c6ed7e843aa.reference || (__cxx_static_address_a443b19535314c6ed7e843aa.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND6____header_global_673ecc870e6648fc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:162
export const ENDSEQVOL2SND7____header_global_ecf584882ce0a26c = ((((((301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4866cebb74dcf62e9273f429() {
  return __cxx_static_address_4866cebb74dcf62e9273f429.reference || (__cxx_static_address_4866cebb74dcf62e9273f429.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND7____header_global_ecf584882ce0a26c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:163
export const SOMETHINGFROZE____header_global_c5c6f27c987dd667 = ((((((303) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_619954ef354de65f394be45f() {
  return __cxx_static_address_619954ef354de65f394be45f.reference || (__cxx_static_address_619954ef354de65f394be45f.reference = {
    __cReference: true,
    get value() { return SOMETHINGFROZE____header_global_c5c6f27c987dd667; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:164
export const WIND_REPEAT____header_global_59f2142201ce4f4c = ((((((308) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7fd426d6f07f837ee4dd2dcf() {
  return __cxx_static_address_7fd426d6f07f837ee4dd2dcf.reference || (__cxx_static_address_7fd426d6f07f837ee4dd2dcf.reference = {
    __cReference: true,
    get value() { return WIND_REPEAT____header_global_59f2142201ce4f4c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:165
export const BOS4_RECOG____header_global_c82529425cf6257c = ((((((342) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_390c2196428eca8f2ab3ef36() {
  return __cxx_static_address_390c2196428eca8f2ab3ef36.reference || (__cxx_static_address_390c2196428eca8f2ab3ef36.reference = {
    __cReference: true,
    get value() { return BOS4_RECOG____header_global_c82529425cf6257c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:166
export const LIGHTNING_SLAP____header_global_de2b5b08a1affdd8 = ((((((351) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5726694d536b0285a2df3d56() {
  return __cxx_static_address_5726694d536b0285a2df3d56.reference || (__cxx_static_address_5726694d536b0285a2df3d56.reference = {
    __cReference: true,
    get value() { return LIGHTNING_SLAP____header_global_de2b5b08a1affdd8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:167
export const THUNDER____header_global_1c4ea264975e2d78 = ((((((352) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_39dd78aed5a42896986578fa() {
  return __cxx_static_address_39dd78aed5a42896986578fa.reference || (__cxx_static_address_39dd78aed5a42896986578fa.reference = {
    __cReference: true,
    get value() { return THUNDER____header_global_1c4ea264975e2d78; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:168
export const INTRO4_1____header_global_84a25163749cd92d = ((((((363) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_23d8bc0ddb53e9d5390b4f18() {
  return __cxx_static_address_23d8bc0ddb53e9d5390b4f18.reference || (__cxx_static_address_23d8bc0ddb53e9d5390b4f18.reference = {
    __cReference: true,
    get value() { return INTRO4_1____header_global_84a25163749cd92d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:169
export const INTRO4_2____header_global_1dd6b0b9d584e5e9 = ((((((364) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a51e1f0452cae08ab3bb38e9() {
  return __cxx_static_address_a51e1f0452cae08ab3bb38e9.reference || (__cxx_static_address_a51e1f0452cae08ab3bb38e9.reference = {
    __cReference: true,
    get value() { return INTRO4_2____header_global_1dd6b0b9d584e5e9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:170
export const INTRO4_3____header_global_8b3ef9b0b2ed0b1c = ((((((365) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dfd594554e230c751ce0de53() {
  return __cxx_static_address_dfd594554e230c751ce0de53.reference || (__cxx_static_address_dfd594554e230c751ce0de53.reference = {
    __cReference: true,
    get value() { return INTRO4_3____header_global_8b3ef9b0b2ed0b1c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:171
export const INTRO4_4____header_global_b1f2cfe532139885 = ((((((366) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8c4e9de7cfbfc25c56f6d255() {
  return __cxx_static_address_8c4e9de7cfbfc25c56f6d255.reference || (__cxx_static_address_8c4e9de7cfbfc25c56f6d255.reference = {
    __cReference: true,
    get value() { return INTRO4_4____header_global_b1f2cfe532139885; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:172
export const INTRO4_5____header_global_f30f06848767ce44 = ((((((367) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9407d121c9b66a1ee6f4bb60() {
  return __cxx_static_address_9407d121c9b66a1ee6f4bb60.reference || (__cxx_static_address_9407d121c9b66a1ee6f4bb60.reference = {
    __cReference: true,
    get value() { return INTRO4_5____header_global_f30f06848767ce44; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:173
export const INTRO4_6____header_global_e7090f0d21b1c5c0 = ((((((368) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e655f6e3729a9913675685bf() {
  return __cxx_static_address_e655f6e3729a9913675685bf.reference || (__cxx_static_address_e655f6e3729a9913675685bf.reference = {
    __cReference: true,
    get value() { return INTRO4_6____header_global_e7090f0d21b1c5c0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:174
export const BOSS4_DEADSPEECH____header_global_4cb7855b8e20c2fb = ((((((370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_31c7f291b8732c38b6f3dd35() {
  return __cxx_static_address_31c7f291b8732c38b6f3dd35.reference || (__cxx_static_address_31c7f291b8732c38b6f3dd35.reference = {
    __cReference: true,
    get value() { return BOSS4_DEADSPEECH____header_global_4cb7855b8e20c2fb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:175
export const BOSS4_FIRSTSEE____header_global_850c40be85a1e325 = ((((((371) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5fcdc0623e5b6d0fd132540a() {
  return __cxx_static_address_5fcdc0623e5b6d0fd132540a.reference || (__cxx_static_address_5fcdc0623e5b6d0fd132540a.reference = {
    __cReference: true,
    get value() { return BOSS4_FIRSTSEE____header_global_850c40be85a1e325; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:176
export const VOL4ENDSND1____header_global_cafbb7c9bef66137 = ((((((384) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_822f67959bb57083b6c21635() {
  return __cxx_static_address_822f67959bb57083b6c21635.reference || (__cxx_static_address_822f67959bb57083b6c21635.reference = {
    __cReference: true,
    get value() { return VOL4ENDSND1____header_global_cafbb7c9bef66137; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:177
export const VOL4ENDSND2____header_global_43073e915827f5f2 = ((((((385) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_db3c4419a91eaa17381a1fc4() {
  return __cxx_static_address_db3c4419a91eaa17381a1fc4.reference || (__cxx_static_address_db3c4419a91eaa17381a1fc4.reference = {
    __cReference: true,
    get value() { return VOL4ENDSND2____header_global_43073e915827f5f2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:178
export const EXPANDERSHOOT____header_global_da0bdf1517e01cc3 = ((((((388) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_19d4af394af4f37097ee6a86() {
  return __cxx_static_address_19d4af394af4f37097ee6a86.reference || (__cxx_static_address_19d4af394af4f37097ee6a86.reference = {
    __cReference: true,
    get value() { return EXPANDERSHOOT____header_global_da0bdf1517e01cc3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:179
export const INTRO4_B____header_global_29c24876e9d9194d = ((((((392) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8721c7050f5a14dab4a52cad() {
  return __cxx_static_address_8721c7050f5a14dab4a52cad.reference || (__cxx_static_address_8721c7050f5a14dab4a52cad.reference = {
    __cReference: true,
    get value() { return INTRO4_B____header_global_29c24876e9d9194d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:180
export const BIGBANG____header_global_f035e63bb2c47169 = ((((((393) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d31227d1414038ebcceb127c() {
  return __cxx_static_address_d31227d1414038ebcceb127c.reference || (__cxx_static_address_d31227d1414038ebcceb127c.reference = {
    __cReference: true,
    get value() { return BIGBANG____header_global_f035e63bb2c47169; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:181
export const FLAMETHROWER_INTRO____header_global_e27afd7316646a6d = ((((((398) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0ddbf3f054099ef70e3f3dbe() {
  return __cxx_static_address_0ddbf3f054099ef70e3f3dbe.reference || (__cxx_static_address_0ddbf3f054099ef70e3f3dbe.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_INTRO____header_global_e27afd7316646a6d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:182
export const FLAMETHROWER_LOOP____header_global_14bfcacd18fb4379 = ((((((399) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a9ca293b2c71859b53965ae6() {
  return __cxx_static_address_a9ca293b2c71859b53965ae6.reference || (__cxx_static_address_a9ca293b2c71859b53965ae6.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_LOOP____header_global_14bfcacd18fb4379; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:183
export const FLAMETHROWER_END____header_global_2ad56f84146dc10a = ((((((400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_04f1ddc0a78e2d7f603e6eb2() {
  return __cxx_static_address_04f1ddc0a78e2d7f603e6eb2.reference || (__cxx_static_address_04f1ddc0a78e2d7f603e6eb2.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_END____header_global_2ad56f84146dc10a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:184
export const E5L7_DUKE_QUIT_YOU____header_global_ef840db8cdfd3341 = ((((((401) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ff1fd652f12567133dca212d() {
  return __cxx_static_address_ff1fd652f12567133dca212d.reference || (__cxx_static_address_ff1fd652f12567133dca212d.reference = {
    __cReference: true,
    get value() { return E5L7_DUKE_QUIT_YOU____header_global_ef840db8cdfd3341; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:187
export const SECTOREFFECTOR____header_global_3e1ff86baf7cc333 = ((((((1) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f8f76222b10b07a775f7182c() {
  return __cxx_static_address_f8f76222b10b07a775f7182c.reference || (__cxx_static_address_f8f76222b10b07a775f7182c.reference = {
    __cReference: true,
    get value() { return SECTOREFFECTOR____header_global_3e1ff86baf7cc333; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:188
export const ACTIVATOR____header_global_71bf1de7c294660d = ((((((2) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c7df409a5e9ff28e69af4c64() {
  return __cxx_static_address_c7df409a5e9ff28e69af4c64.reference || (__cxx_static_address_c7df409a5e9ff28e69af4c64.reference = {
    __cReference: true,
    get value() { return ACTIVATOR____header_global_71bf1de7c294660d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:189
export const TOUCHPLATE____header_global_51eab0cdf8d2e1d9 = ((((((3) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_70891a42016517f5301585ce() {
  return __cxx_static_address_70891a42016517f5301585ce.reference || (__cxx_static_address_70891a42016517f5301585ce.reference = {
    __cReference: true,
    get value() { return TOUCHPLATE____header_global_51eab0cdf8d2e1d9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:190
export const ACTIVATORLOCKED____header_global_582ba95d9303ecf0 = ((((((4) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3d1540a371ba49a8ae08a971() {
  return __cxx_static_address_3d1540a371ba49a8ae08a971.reference || (__cxx_static_address_3d1540a371ba49a8ae08a971.reference = {
    __cReference: true,
    get value() { return ACTIVATORLOCKED____header_global_582ba95d9303ecf0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:191
export const MUSICANDSFX____header_global_5f8248654c1a3e36 = ((((((5) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e899a18092d9924655b54948() {
  return __cxx_static_address_e899a18092d9924655b54948.reference || (__cxx_static_address_e899a18092d9924655b54948.reference = {
    __cReference: true,
    get value() { return MUSICANDSFX____header_global_5f8248654c1a3e36; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:192
export const LOCATORS____header_global_721eac4ff3924deb = ((((((6) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7fc0b63d5932ef0c2d430c99() {
  return __cxx_static_address_7fc0b63d5932ef0c2d430c99.reference || (__cxx_static_address_7fc0b63d5932ef0c2d430c99.reference = {
    __cReference: true,
    get value() { return LOCATORS____header_global_721eac4ff3924deb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:193
export const CYCLER____header_global_f039349bb5df0b2b = ((((((7) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4148d08907530ce5ab09435c() {
  return __cxx_static_address_4148d08907530ce5ab09435c.reference || (__cxx_static_address_4148d08907530ce5ab09435c.reference = {
    __cReference: true,
    get value() { return CYCLER____header_global_f039349bb5df0b2b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:194
export const MASTERSWITCH____header_global_acd846f5a45f4380 = ((((((8) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4c077a8c61fcfa766340727d() {
  return __cxx_static_address_4c077a8c61fcfa766340727d.reference || (__cxx_static_address_4c077a8c61fcfa766340727d.reference = {
    __cReference: true,
    get value() { return MASTERSWITCH____header_global_acd846f5a45f4380; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:195
export const RESPAWN____header_global_84a8faae5a478995 = ((((((9) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bd0d4853c436875737f94651() {
  return __cxx_static_address_bd0d4853c436875737f94651.reference || (__cxx_static_address_bd0d4853c436875737f94651.reference = {
    __cReference: true,
    get value() { return RESPAWN____header_global_84a8faae5a478995; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:196
export const GPSPEED____header_global_9c084becd794401d = ((((((10) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_052964de74284dcb7c5eccd3() {
  return __cxx_static_address_052964de74284dcb7c5eccd3.reference || (__cxx_static_address_052964de74284dcb7c5eccd3.reference = {
    __cReference: true,
    get value() { return GPSPEED____header_global_9c084becd794401d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:197
export const FOF____header_global_8f9158afe4a40f23 = ((((((13) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fe700297d09c8eb76fe3753b() {
  return __cxx_static_address_fe700297d09c8eb76fe3753b.reference || (__cxx_static_address_fe700297d09c8eb76fe3753b.reference = {
    __cReference: true,
    get value() { return FOF____header_global_8f9158afe4a40f23; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:198
export const ARROW____header_global_e6bbade864de020b = ((((((20) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9da6d9496ab33e5aeb01c095() {
  return __cxx_static_address_9da6d9496ab33e5aeb01c095.reference || (__cxx_static_address_9da6d9496ab33e5aeb01c095.reference = {
    __cReference: true,
    get value() { return ARROW____header_global_e6bbade864de020b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:199
export const FIRSTGUNSPRITE____header_global_9afbe03c0a2423c0 = ((((((21) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dda0c15134f361153d0c4abe() {
  return __cxx_static_address_dda0c15134f361153d0c4abe.reference || (__cxx_static_address_dda0c15134f361153d0c4abe.reference = {
    __cReference: true,
    get value() { return FIRSTGUNSPRITE____header_global_9afbe03c0a2423c0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:200
export const CHAINGUNSPRITE____header_global_51afe4b55ff2367e = ((((((22) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_562ec3d1582770caea6f2ada() {
  return __cxx_static_address_562ec3d1582770caea6f2ada.reference || (__cxx_static_address_562ec3d1582770caea6f2ada.reference = {
    __cReference: true,
    get value() { return CHAINGUNSPRITE____header_global_51afe4b55ff2367e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:201
export const RPGSPRITE____header_global_f627c636552bef5f = ((((((23) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cd58f78d674f300436c741a5() {
  return __cxx_static_address_cd58f78d674f300436c741a5.reference || (__cxx_static_address_cd58f78d674f300436c741a5.reference = {
    __cReference: true,
    get value() { return RPGSPRITE____header_global_f627c636552bef5f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:202
export const FREEZESPRITE____header_global_30ef08fde2bf551e = ((((((24) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8c3b321395ba57393f56bcbd() {
  return __cxx_static_address_8c3b321395ba57393f56bcbd.reference || (__cxx_static_address_8c3b321395ba57393f56bcbd.reference = {
    __cReference: true,
    get value() { return FREEZESPRITE____header_global_30ef08fde2bf551e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:203
export const SHRINKERSPRITE____header_global_dd437c9d9d77974f = ((((((25) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_727c1e50cd02096c0e06d00e() {
  return __cxx_static_address_727c1e50cd02096c0e06d00e.reference || (__cxx_static_address_727c1e50cd02096c0e06d00e.reference = {
    __cReference: true,
    get value() { return SHRINKERSPRITE____header_global_dd437c9d9d77974f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:204
export const HEAVYHBOMB____header_global_9fe6d58d08f46090 = ((((((26) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_50e58452aff1068aa26e20b6() {
  return __cxx_static_address_50e58452aff1068aa26e20b6.reference || (__cxx_static_address_50e58452aff1068aa26e20b6.reference = {
    __cReference: true,
    get value() { return HEAVYHBOMB____header_global_9fe6d58d08f46090; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:205
export const TRIPBOMBSPRITE____header_global_3ea168e1b9a0f70c = ((((((27) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d0456add2573f4c61a6595e7() {
  return __cxx_static_address_d0456add2573f4c61a6595e7.reference || (__cxx_static_address_d0456add2573f4c61a6595e7.reference = {
    __cReference: true,
    get value() { return TRIPBOMBSPRITE____header_global_3ea168e1b9a0f70c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:206
export const SHOTGUNSPRITE____header_global_a92f64bfdd33f04c = ((((((28) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b45d01214adeceee192f7853() {
  return __cxx_static_address_b45d01214adeceee192f7853.reference || (__cxx_static_address_b45d01214adeceee192f7853.reference = {
    __cReference: true,
    get value() { return SHOTGUNSPRITE____header_global_a92f64bfdd33f04c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:207
export const DEVISTATORSPRITE____header_global_7f1ad4c6f905873b = ((((((29) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a77e33ba82b2749ac4625a4b() {
  return __cxx_static_address_a77e33ba82b2749ac4625a4b.reference || (__cxx_static_address_a77e33ba82b2749ac4625a4b.reference = {
    __cReference: true,
    get value() { return DEVISTATORSPRITE____header_global_7f1ad4c6f905873b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:208
export const HEALTHBOX____header_global_d7aa66459c7b59c3 = ((((((30) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7a3191e7f6e5ef68c8688da5() {
  return __cxx_static_address_7a3191e7f6e5ef68c8688da5.reference || (__cxx_static_address_7a3191e7f6e5ef68c8688da5.reference = {
    __cReference: true,
    get value() { return HEALTHBOX____header_global_d7aa66459c7b59c3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:209
export const AMMOBOX____header_global_340f2e500b0de4c1 = ((((((31) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fd5f09e83a19e5b82d12b679() {
  return __cxx_static_address_fd5f09e83a19e5b82d12b679.reference || (__cxx_static_address_fd5f09e83a19e5b82d12b679.reference = {
    __cReference: true,
    get value() { return AMMOBOX____header_global_340f2e500b0de4c1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:210
export const GROWSPRITEICON____header_global_9344128dbcd4a249 = ((((((32) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a3fe280852052f14441e39b8() {
  return __cxx_static_address_a3fe280852052f14441e39b8.reference || (__cxx_static_address_a3fe280852052f14441e39b8.reference = {
    __cReference: true,
    get value() { return GROWSPRITEICON____header_global_9344128dbcd4a249; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:211
export const INVENTORYBOX____header_global_4b5e70427d761522 = ((((((33) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fc4143e0dfab6e9fd24c70f1() {
  return __cxx_static_address_fc4143e0dfab6e9fd24c70f1.reference || (__cxx_static_address_fc4143e0dfab6e9fd24c70f1.reference = {
    __cReference: true,
    get value() { return INVENTORYBOX____header_global_4b5e70427d761522; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:212
export const FREEZEAMMO____header_global_d0f24607f8fc8ce3 = ((((((37) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c79ec1d7da12de34f55c8907() {
  return __cxx_static_address_c79ec1d7da12de34f55c8907.reference || (__cxx_static_address_c79ec1d7da12de34f55c8907.reference = {
    __cReference: true,
    get value() { return FREEZEAMMO____header_global_d0f24607f8fc8ce3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:213
export const AMMO____header_global_570358e43ba2174f = ((((((40) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8a8688ff0daea77962846dcb() {
  return __cxx_static_address_8a8688ff0daea77962846dcb.reference || (__cxx_static_address_8a8688ff0daea77962846dcb.reference = {
    __cReference: true,
    get value() { return AMMO____header_global_570358e43ba2174f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:214
export const BATTERYAMMO____header_global_d07ab79a37dd76bb = ((((((41) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_be61b6b62f861a157ca86cc9() {
  return __cxx_static_address_be61b6b62f861a157ca86cc9.reference || (__cxx_static_address_be61b6b62f861a157ca86cc9.reference = {
    __cReference: true,
    get value() { return BATTERYAMMO____header_global_d07ab79a37dd76bb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:215
export const DEVISTATORAMMO____header_global_2542bc4c1848d658 = ((((((42) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2fd1746cc77f195e8d81edf3() {
  return __cxx_static_address_2fd1746cc77f195e8d81edf3.reference || (__cxx_static_address_2fd1746cc77f195e8d81edf3.reference = {
    __cReference: true,
    get value() { return DEVISTATORAMMO____header_global_2542bc4c1848d658; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:216
export const RPGAMMO____header_global_aadc52109b6e3630 = ((((((44) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ba4ed4cc11929e1f6ee1a175() {
  return __cxx_static_address_ba4ed4cc11929e1f6ee1a175.reference || (__cxx_static_address_ba4ed4cc11929e1f6ee1a175.reference = {
    __cReference: true,
    get value() { return RPGAMMO____header_global_aadc52109b6e3630; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:217
export const GROWAMMO____header_global_1554a5c25cc4a0e8 = ((((((45) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_63dabac69c401f3b98fd34a0() {
  return __cxx_static_address_63dabac69c401f3b98fd34a0.reference || (__cxx_static_address_63dabac69c401f3b98fd34a0.reference = {
    __cReference: true,
    get value() { return GROWAMMO____header_global_1554a5c25cc4a0e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:218
export const CRYSTALAMMO____header_global_967ce4b5978fb034 = ((((((46) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f84e606dca05f9c58ca2dfa7() {
  return __cxx_static_address_f84e606dca05f9c58ca2dfa7.reference || (__cxx_static_address_f84e606dca05f9c58ca2dfa7.reference = {
    __cReference: true,
    get value() { return CRYSTALAMMO____header_global_967ce4b5978fb034; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:219
export const HBOMBAMMO____header_global_c902005de9115b43 = ((((((47) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d8d5ed065d53ad4fd95a02af() {
  return __cxx_static_address_d8d5ed065d53ad4fd95a02af.reference || (__cxx_static_address_d8d5ed065d53ad4fd95a02af.reference = {
    __cReference: true,
    get value() { return HBOMBAMMO____header_global_c902005de9115b43; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:220
export const AMMOLOTS____header_global_ac0f725fdafef20f = ((((((48) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_786633ea23456f6631ca9c35() {
  return __cxx_static_address_786633ea23456f6631ca9c35.reference || (__cxx_static_address_786633ea23456f6631ca9c35.reference = {
    __cReference: true,
    get value() { return AMMOLOTS____header_global_ac0f725fdafef20f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:221
export const SHOTGUNAMMO____header_global_c451366e7d71d740 = ((((((49) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bc4b5cc6bb749ec7bf67e827() {
  return __cxx_static_address_bc4b5cc6bb749ec7bf67e827.reference || (__cxx_static_address_bc4b5cc6bb749ec7bf67e827.reference = {
    __cReference: true,
    get value() { return SHOTGUNAMMO____header_global_c451366e7d71d740; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:222
export const COLA____header_global_33f99a9c3289c6e5 = ((((((51) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_73b45c479f3e7c04e6b18cca() {
  return __cxx_static_address_73b45c479f3e7c04e6b18cca.reference || (__cxx_static_address_73b45c479f3e7c04e6b18cca.reference = {
    __cReference: true,
    get value() { return COLA____header_global_33f99a9c3289c6e5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:223
export const SIXPAK____header_global_fa854234fc9a8e0f = ((((((52) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_46fdb0014ba8f27d435b3cb8() {
  return __cxx_static_address_46fdb0014ba8f27d435b3cb8.reference || (__cxx_static_address_46fdb0014ba8f27d435b3cb8.reference = {
    __cReference: true,
    get value() { return SIXPAK____header_global_fa854234fc9a8e0f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:224
export const FIRSTAID____header_global_e2724ab430c98998 = ((((((53) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c424fc730abb3b9b875ed954() {
  return __cxx_static_address_c424fc730abb3b9b875ed954.reference || (__cxx_static_address_c424fc730abb3b9b875ed954.reference = {
    __cReference: true,
    get value() { return FIRSTAID____header_global_e2724ab430c98998; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:225
export const SHIELD____header_global_9e29e57eb2c0404b = ((((((54) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_087f516bb74c729c6e82b3ec() {
  return __cxx_static_address_087f516bb74c729c6e82b3ec.reference || (__cxx_static_address_087f516bb74c729c6e82b3ec.reference = {
    __cReference: true,
    get value() { return SHIELD____header_global_9e29e57eb2c0404b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:226
export const STEROIDS____header_global_7fa64c8d34660493 = ((((((55) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8ebe5b4c9a08d833f600ad11() {
  return __cxx_static_address_8ebe5b4c9a08d833f600ad11.reference || (__cxx_static_address_8ebe5b4c9a08d833f600ad11.reference = {
    __cReference: true,
    get value() { return STEROIDS____header_global_7fa64c8d34660493; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:227
export const AIRTANK____header_global_8cc88a0e40949395 = ((((((56) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3dc6dc36e6725c7c1edeaae5() {
  return __cxx_static_address_3dc6dc36e6725c7c1edeaae5.reference || (__cxx_static_address_3dc6dc36e6725c7c1edeaae5.reference = {
    __cReference: true,
    get value() { return AIRTANK____header_global_8cc88a0e40949395; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:228
export const JETPACK____header_global_af7f6698965bc188 = ((((((57) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c18cb2e50f4fe9aff57ca1ac() {
  return __cxx_static_address_c18cb2e50f4fe9aff57ca1ac.reference || (__cxx_static_address_c18cb2e50f4fe9aff57ca1ac.reference = {
    __cReference: true,
    get value() { return JETPACK____header_global_af7f6698965bc188; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:229
export const HEATSENSOR____header_global_24d007ece4b8f7c2 = ((((((59) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e80fd8cb450e60edd9e520a6() {
  return __cxx_static_address_e80fd8cb450e60edd9e520a6.reference || (__cxx_static_address_e80fd8cb450e60edd9e520a6.reference = {
    __cReference: true,
    get value() { return HEATSENSOR____header_global_24d007ece4b8f7c2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:230
export const ACCESSCARD____header_global_33a2b4b673be40b7 = ((((((60) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_237f98c9e618d8bda96e49b3() {
  return __cxx_static_address_237f98c9e618d8bda96e49b3.reference || (__cxx_static_address_237f98c9e618d8bda96e49b3.reference = {
    __cReference: true,
    get value() { return ACCESSCARD____header_global_33a2b4b673be40b7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:231
export const BOOTS____header_global_a6e955dc411d0680 = ((((((61) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4aca23fceb0fab6afab31045() {
  return __cxx_static_address_4aca23fceb0fab6afab31045.reference || (__cxx_static_address_4aca23fceb0fab6afab31045.reference = {
    __cReference: true,
    get value() { return BOOTS____header_global_a6e955dc411d0680; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:232
export const MIRRORBROKE____header_global_78d4fe3cfd48b59e = ((((((70) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_57893ecde21ae958793be64a() {
  return __cxx_static_address_57893ecde21ae958793be64a.reference || (__cxx_static_address_57893ecde21ae958793be64a.reference = {
    __cReference: true,
    get value() { return MIRRORBROKE____header_global_78d4fe3cfd48b59e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:233
export const CLOUDYOCEAN____header_global_f5ee47c610d777f1 = ((((((78) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1c8badfb053ab55757094d47() {
  return __cxx_static_address_1c8badfb053ab55757094d47.reference || (__cxx_static_address_1c8badfb053ab55757094d47.reference = {
    __cReference: true,
    get value() { return CLOUDYOCEAN____header_global_f5ee47c610d777f1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:234
export const CLOUDYSKIES____header_global_4651393c80623245 = ((((((79) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8d0d984384ed06a02defe73c() {
  return __cxx_static_address_8d0d984384ed06a02defe73c.reference || (__cxx_static_address_8d0d984384ed06a02defe73c.reference = {
    __cReference: true,
    get value() { return CLOUDYSKIES____header_global_4651393c80623245; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:235
export const MOONSKY1____header_global_37adf0b12bb05a51 = ((((((80) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e1ad3aa2a615599ad04fb013() {
  return __cxx_static_address_e1ad3aa2a615599ad04fb013.reference || (__cxx_static_address_e1ad3aa2a615599ad04fb013.reference = {
    __cReference: true,
    get value() { return MOONSKY1____header_global_37adf0b12bb05a51; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:236
export const BIGORBIT1____header_global_bed96a159a5012c7 = ((((((84) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3662010f2d490a5068870863() {
  return __cxx_static_address_3662010f2d490a5068870863.reference || (__cxx_static_address_3662010f2d490a5068870863.reference = {
    __cReference: true,
    get value() { return BIGORBIT1____header_global_bed96a159a5012c7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:237
export const LA____header_global_09e83638f96e5552 = ((((((89) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ed6cacbd78bedfc5b8fb7ad3() {
  return __cxx_static_address_ed6cacbd78bedfc5b8fb7ad3.reference || (__cxx_static_address_ed6cacbd78bedfc5b8fb7ad3.reference = {
    __cReference: true,
    get value() { return LA____header_global_09e83638f96e5552; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:238
export const ATOMICHEALTH____header_global_ec57114c67e6ffa7 = ((((((100) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dbe143cea638622a0ae40611() {
  return __cxx_static_address_dbe143cea638622a0ae40611.reference || (__cxx_static_address_dbe143cea638622a0ae40611.reference = {
    __cReference: true,
    get value() { return ATOMICHEALTH____header_global_ec57114c67e6ffa7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:239
export const TECHLIGHT2____header_global_b60d1db8b4ff42b4 = ((((((120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_abe3c4cf8560b90b11adf151() {
  return __cxx_static_address_abe3c4cf8560b90b11adf151.reference || (__cxx_static_address_abe3c4cf8560b90b11adf151.reference = {
    __cReference: true,
    get value() { return TECHLIGHT2____header_global_b60d1db8b4ff42b4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:240
export const TECHLIGHTBUST2____header_global_c292fa891fe2d516 = ((((((121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1d0bd26000af551b63ccdf75() {
  return __cxx_static_address_1d0bd26000af551b63ccdf75.reference || (__cxx_static_address_1d0bd26000af551b63ccdf75.reference = {
    __cReference: true,
    get value() { return TECHLIGHTBUST2____header_global_c292fa891fe2d516; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:241
export const TECHLIGHT4____header_global_48e296cc94175144 = ((((((122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a636506b74b5d9808a3bd753() {
  return __cxx_static_address_a636506b74b5d9808a3bd753.reference || (__cxx_static_address_a636506b74b5d9808a3bd753.reference = {
    __cReference: true,
    get value() { return TECHLIGHT4____header_global_48e296cc94175144; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:242
export const TECHLIGHTBUST4____header_global_1a591c4c0f7d1a56 = ((((((123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8b507cf83208e1e9311f46d7() {
  return __cxx_static_address_8b507cf83208e1e9311f46d7.reference || (__cxx_static_address_8b507cf83208e1e9311f46d7.reference = {
    __cReference: true,
    get value() { return TECHLIGHTBUST4____header_global_1a591c4c0f7d1a56; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:243
export const WALLLIGHT4____header_global_26a76f1bdfa2f898 = ((((((124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7b0f956128f704e39e4a1702() {
  return __cxx_static_address_7b0f956128f704e39e4a1702.reference || (__cxx_static_address_7b0f956128f704e39e4a1702.reference = {
    __cReference: true,
    get value() { return WALLLIGHT4____header_global_26a76f1bdfa2f898; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:244
export const WALLLIGHTBUST4____header_global_46db904d608acc4c = ((((((125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a882a5234fac29d7dae7d977() {
  return __cxx_static_address_a882a5234fac29d7dae7d977.reference || (__cxx_static_address_a882a5234fac29d7dae7d977.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST4____header_global_46db904d608acc4c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:245
export const ACCESSSWITCH____header_global_7c1fc2d598c975ad = ((((((130) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fc6c1b15020fb695746f2738() {
  return __cxx_static_address_fc6c1b15020fb695746f2738.reference || (__cxx_static_address_fc6c1b15020fb695746f2738.reference = {
    __cReference: true,
    get value() { return ACCESSSWITCH____header_global_7c1fc2d598c975ad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:246
export const SLOTDOOR____header_global_8b9b0df33fd8daba = ((((((132) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5ee34f5545d5f0896c48160f() {
  return __cxx_static_address_5ee34f5545d5f0896c48160f.reference || (__cxx_static_address_5ee34f5545d5f0896c48160f.reference = {
    __cReference: true,
    get value() { return SLOTDOOR____header_global_8b9b0df33fd8daba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:247
export const LIGHTSWITCH____header_global_4cb7a3ca6935461d = ((((((134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6c27fe7768672370a93f190e() {
  return __cxx_static_address_6c27fe7768672370a93f190e.reference || (__cxx_static_address_6c27fe7768672370a93f190e.reference = {
    __cReference: true,
    get value() { return LIGHTSWITCH____header_global_4cb7a3ca6935461d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:248
export const SPACEDOORSWITCH____header_global_15cf7372fc3e4aa1 = ((((((136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4aae3fea4ea5b2ac408fa5dd() {
  return __cxx_static_address_4aae3fea4ea5b2ac408fa5dd.reference || (__cxx_static_address_4aae3fea4ea5b2ac408fa5dd.reference = {
    __cReference: true,
    get value() { return SPACEDOORSWITCH____header_global_15cf7372fc3e4aa1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:249
export const SPACELIGHTSWITCH____header_global_933e75dfa6d18632 = ((((((138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1d9ddfd326852f6bef40d029() {
  return __cxx_static_address_1d9ddfd326852f6bef40d029.reference || (__cxx_static_address_1d9ddfd326852f6bef40d029.reference = {
    __cReference: true,
    get value() { return SPACELIGHTSWITCH____header_global_933e75dfa6d18632; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:250
export const FRANKENSTINESWITCH____header_global_b9d67f6b0ea18065 = ((((((140) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_49760fe9bbfb0c8d86e87e96() {
  return __cxx_static_address_49760fe9bbfb0c8d86e87e96.reference || (__cxx_static_address_49760fe9bbfb0c8d86e87e96.reference = {
    __cReference: true,
    get value() { return FRANKENSTINESWITCH____header_global_b9d67f6b0ea18065; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:251
export const NUKEBUTTON____header_global_d8bdcd6b8060d4b3 = ((((((142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1ae51721dde346bb999c4d1b() {
  return __cxx_static_address_1ae51721dde346bb999c4d1b.reference || (__cxx_static_address_1ae51721dde346bb999c4d1b.reference = {
    __cReference: true,
    get value() { return NUKEBUTTON____header_global_d8bdcd6b8060d4b3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:252
export const MULTISWITCH____header_global_9e9622a04a4b7721 = ((((((146) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7f27f2b1f95ad94ff257cd4c() {
  return __cxx_static_address_7f27f2b1f95ad94ff257cd4c.reference || (__cxx_static_address_7f27f2b1f95ad94ff257cd4c.reference = {
    __cReference: true,
    get value() { return MULTISWITCH____header_global_9e9622a04a4b7721; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:253
export const DOORTILE5____header_global_2ba41c6d182e51b5 = ((((((150) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c4baab07e968f3df78372ed3() {
  return __cxx_static_address_c4baab07e968f3df78372ed3.reference || (__cxx_static_address_c4baab07e968f3df78372ed3.reference = {
    __cReference: true,
    get value() { return DOORTILE5____header_global_2ba41c6d182e51b5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:254
export const DOORTILE6____header_global_2dfe2f412ba1d954 = ((((((151) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e232cf19ce6cbc6d373209fa() {
  return __cxx_static_address_e232cf19ce6cbc6d373209fa.reference || (__cxx_static_address_e232cf19ce6cbc6d373209fa.reference = {
    __cReference: true,
    get value() { return DOORTILE6____header_global_2dfe2f412ba1d954; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:255
export const DOORTILE1____header_global_0340fe50d5a4d3f4 = ((((((152) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1bed51a5a52728686c802b3d() {
  return __cxx_static_address_1bed51a5a52728686c802b3d.reference || (__cxx_static_address_1bed51a5a52728686c802b3d.reference = {
    __cReference: true,
    get value() { return DOORTILE1____header_global_0340fe50d5a4d3f4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:256
export const DOORTILE2____header_global_268dd2e9f631d901 = ((((((153) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5e76d831fc280aae32123a0e() {
  return __cxx_static_address_5e76d831fc280aae32123a0e.reference || (__cxx_static_address_5e76d831fc280aae32123a0e.reference = {
    __cReference: true,
    get value() { return DOORTILE2____header_global_268dd2e9f631d901; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:257
export const DOORTILE3____header_global_526185066ee33f34 = ((((((154) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_29c78812051fed1a1dd5a333() {
  return __cxx_static_address_29c78812051fed1a1dd5a333.reference || (__cxx_static_address_29c78812051fed1a1dd5a333.reference = {
    __cReference: true,
    get value() { return DOORTILE3____header_global_526185066ee33f34; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:258
export const DOORTILE4____header_global_63629d407f7684a3 = ((((((155) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e12d2b5a0c9a32e34032ce09() {
  return __cxx_static_address_e12d2b5a0c9a32e34032ce09.reference || (__cxx_static_address_e12d2b5a0c9a32e34032ce09.reference = {
    __cReference: true,
    get value() { return DOORTILE4____header_global_63629d407f7684a3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:259
export const DOORTILE7____header_global_0769af089193609e = ((((((156) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7a9d769fdcc426ed3678eb37() {
  return __cxx_static_address_7a9d769fdcc426ed3678eb37.reference || (__cxx_static_address_7a9d769fdcc426ed3678eb37.reference = {
    __cReference: true,
    get value() { return DOORTILE7____header_global_0769af089193609e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:260
export const DOORTILE8____header_global_ba12f787f7a2c3aa = ((((((157) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ce684d445e8a83110ecdda8a() {
  return __cxx_static_address_ce684d445e8a83110ecdda8a.reference || (__cxx_static_address_ce684d445e8a83110ecdda8a.reference = {
    __cReference: true,
    get value() { return DOORTILE8____header_global_ba12f787f7a2c3aa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:261
export const DOORTILE9____header_global_493cdb9f5166def7 = ((((((158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_542ea170b7c438403d5db4ff() {
  return __cxx_static_address_542ea170b7c438403d5db4ff.reference || (__cxx_static_address_542ea170b7c438403d5db4ff.reference = {
    __cReference: true,
    get value() { return DOORTILE9____header_global_493cdb9f5166def7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:262
export const DOORTILE10____header_global_db51ee88c01c4434 = ((((((159) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4e8ffb596dfb3ca0beed526f() {
  return __cxx_static_address_4e8ffb596dfb3ca0beed526f.reference || (__cxx_static_address_4e8ffb596dfb3ca0beed526f.reference = {
    __cReference: true,
    get value() { return DOORTILE10____header_global_db51ee88c01c4434; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:263
export const DOORSHOCK____header_global_f7c35b77667ce8d2 = ((((((160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c50189853145ad108e9dc2f1() {
  return __cxx_static_address_c50189853145ad108e9dc2f1.reference || (__cxx_static_address_c50189853145ad108e9dc2f1.reference = {
    __cReference: true,
    get value() { return DOORSHOCK____header_global_f7c35b77667ce8d2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:264
export const DIPSWITCH____header_global_d513263a179dc3f5 = ((((((162) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f474e0bf39d0144be326e25f() {
  return __cxx_static_address_f474e0bf39d0144be326e25f.reference || (__cxx_static_address_f474e0bf39d0144be326e25f.reference = {
    __cReference: true,
    get value() { return DIPSWITCH____header_global_d513263a179dc3f5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:265
export const DIPSWITCH2____header_global_46be8f20077dc164 = ((((((164) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8fdbdeb0cf6b55c366013437() {
  return __cxx_static_address_8fdbdeb0cf6b55c366013437.reference || (__cxx_static_address_8fdbdeb0cf6b55c366013437.reference = {
    __cReference: true,
    get value() { return DIPSWITCH2____header_global_46be8f20077dc164; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:266
export const TECHSWITCH____header_global_9aa11e8a835322b5 = ((((((166) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_274487496c7099ab9e2ce796() {
  return __cxx_static_address_274487496c7099ab9e2ce796.reference || (__cxx_static_address_274487496c7099ab9e2ce796.reference = {
    __cReference: true,
    get value() { return TECHSWITCH____header_global_9aa11e8a835322b5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:267
export const DIPSWITCH3____header_global_e61800fcd3ccec5f = ((((((168) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_de5ae10c11070d87573038cb() {
  return __cxx_static_address_de5ae10c11070d87573038cb.reference || (__cxx_static_address_de5ae10c11070d87573038cb.reference = {
    __cReference: true,
    get value() { return DIPSWITCH3____header_global_e61800fcd3ccec5f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:268
export const ACCESSSWITCH2____header_global_cb22e5d17ab2c4c1 = ((((((170) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2a5bfb8ebac92f9f2e648cc5() {
  return __cxx_static_address_2a5bfb8ebac92f9f2e648cc5.reference || (__cxx_static_address_2a5bfb8ebac92f9f2e648cc5.reference = {
    __cReference: true,
    get value() { return ACCESSSWITCH2____header_global_cb22e5d17ab2c4c1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:269
export const FLOORSLIME____header_global_aca47e73be3692c8 = ((((((200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5ce0e394f7aee1dd2f117949() {
  return __cxx_static_address_5ce0e394f7aee1dd2f117949.reference || (__cxx_static_address_5ce0e394f7aee1dd2f117949.reference = {
    __cReference: true,
    get value() { return FLOORSLIME____header_global_aca47e73be3692c8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:270
export const BIGFORCE____header_global_37428412be4dd9be = ((((((230) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b7490bdb0e484512f8b721ea() {
  return __cxx_static_address_b7490bdb0e484512f8b721ea.reference || (__cxx_static_address_b7490bdb0e484512f8b721ea.reference = {
    __cReference: true,
    get value() { return BIGFORCE____header_global_37428412be4dd9be; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:271
export const MASKWALL9____header_global_3c1677e1cf9927d4 = ((((((255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a77de87350f4e42616f27dd1() {
  return __cxx_static_address_a77de87350f4e42616f27dd1.reference || (__cxx_static_address_a77de87350f4e42616f27dd1.reference = {
    __cReference: true,
    get value() { return MASKWALL9____header_global_3c1677e1cf9927d4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:272
export const SCREENBREAK1____header_global_491ef6d590bc52ec = ((((((263) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_722e799e90973065e6da03e5() {
  return __cxx_static_address_722e799e90973065e6da03e5.reference || (__cxx_static_address_722e799e90973065e6da03e5.reference = {
    __cReference: true,
    get value() { return SCREENBREAK1____header_global_491ef6d590bc52ec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:273
export const SCREENBREAK2____header_global_2d2988c3d67ee1b9 = ((((((264) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_23b723ebcf78c0143dfaca47() {
  return __cxx_static_address_23b723ebcf78c0143dfaca47.reference || (__cxx_static_address_23b723ebcf78c0143dfaca47.reference = {
    __cReference: true,
    get value() { return SCREENBREAK2____header_global_2d2988c3d67ee1b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:274
export const SCREENBREAK3____header_global_499313631b1da14b = ((((((265) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e51c66fb1474fd76206394b0() {
  return __cxx_static_address_e51c66fb1474fd76206394b0.reference || (__cxx_static_address_e51c66fb1474fd76206394b0.reference = {
    __cReference: true,
    get value() { return SCREENBREAK3____header_global_499313631b1da14b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:275
export const SCREENBREAK4____header_global_5cea882d2cb207e2 = ((((((266) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e773f33dd60068e6f93a2467() {
  return __cxx_static_address_e773f33dd60068e6f93a2467.reference || (__cxx_static_address_e773f33dd60068e6f93a2467.reference = {
    __cReference: true,
    get value() { return SCREENBREAK4____header_global_5cea882d2cb207e2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:276
export const SCREENBREAK5____header_global_812d4246101406ce = ((((((267) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b769957a98afb412b449c8f5() {
  return __cxx_static_address_b769957a98afb412b449c8f5.reference || (__cxx_static_address_b769957a98afb412b449c8f5.reference = {
    __cReference: true,
    get value() { return SCREENBREAK5____header_global_812d4246101406ce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:277
export const SCREENBREAK6____header_global_4f67e01915acd3be = ((((((268) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9af7b363d7240d606f2e48c5() {
  return __cxx_static_address_9af7b363d7240d606f2e48c5.reference || (__cxx_static_address_9af7b363d7240d606f2e48c5.reference = {
    __cReference: true,
    get value() { return SCREENBREAK6____header_global_4f67e01915acd3be; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:278
export const SCREENBREAK7____header_global_dc919dddf869e0e0 = ((((((269) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5a58f0d22b643bb912fa2913() {
  return __cxx_static_address_5a58f0d22b643bb912fa2913.reference || (__cxx_static_address_5a58f0d22b643bb912fa2913.reference = {
    __cReference: true,
    get value() { return SCREENBREAK7____header_global_dc919dddf869e0e0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:279
export const SCREENBREAK8____header_global_3bd43a7121bde661 = ((((((270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9ddc0580670b67c98291e8a8() {
  return __cxx_static_address_9ddc0580670b67c98291e8a8.reference || (__cxx_static_address_9ddc0580670b67c98291e8a8.reference = {
    __cReference: true,
    get value() { return SCREENBREAK8____header_global_3bd43a7121bde661; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:280
export const SCREENBREAK9____header_global_6494cab47dd44fed = ((((((271) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_251b70187a23f202581aa105() {
  return __cxx_static_address_251b70187a23f202581aa105.reference || (__cxx_static_address_251b70187a23f202581aa105.reference = {
    __cReference: true,
    get value() { return SCREENBREAK9____header_global_6494cab47dd44fed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:281
export const SCREENBREAK10____header_global_f23523f489b1f3ac = ((((((272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_db7f23a830843af4dcd8d258() {
  return __cxx_static_address_db7f23a830843af4dcd8d258.reference || (__cxx_static_address_db7f23a830843af4dcd8d258.reference = {
    __cReference: true,
    get value() { return SCREENBREAK10____header_global_f23523f489b1f3ac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:282
export const SCREENBREAK11____header_global_31449e6f518b947a = ((((((273) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3b0b58d4872a1be7648daf41() {
  return __cxx_static_address_3b0b58d4872a1be7648daf41.reference || (__cxx_static_address_3b0b58d4872a1be7648daf41.reference = {
    __cReference: true,
    get value() { return SCREENBREAK11____header_global_31449e6f518b947a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:283
export const SCREENBREAK12____header_global_041bcee9d45b22ac = ((((((274) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_450b6f6c286e63e466b561fe() {
  return __cxx_static_address_450b6f6c286e63e466b561fe.reference || (__cxx_static_address_450b6f6c286e63e466b561fe.reference = {
    __cReference: true,
    get value() { return SCREENBREAK12____header_global_041bcee9d45b22ac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:284
export const SCREENBREAK13____header_global_590bdb71ddb0793e = ((((((275) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_01a0a4e3cab85ef2b5913a84() {
  return __cxx_static_address_01a0a4e3cab85ef2b5913a84.reference || (__cxx_static_address_01a0a4e3cab85ef2b5913a84.reference = {
    __cReference: true,
    get value() { return SCREENBREAK13____header_global_590bdb71ddb0793e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:285
export const MASKWALL1____header_global_30e91058886de6d1 = ((((((285) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_61a052cde3eba2ef75d8284e() {
  return __cxx_static_address_61a052cde3eba2ef75d8284e.reference || (__cxx_static_address_61a052cde3eba2ef75d8284e.reference = {
    __cReference: true,
    get value() { return MASKWALL1____header_global_30e91058886de6d1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:286
export const W_TECHWALL1____header_global_f9e852ac34efc8f7 = ((((((293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_74bc7cdd375aac6087ef9dfa() {
  return __cxx_static_address_74bc7cdd375aac6087ef9dfa.reference || (__cxx_static_address_74bc7cdd375aac6087ef9dfa.reference = {
    __cReference: true,
    get value() { return W_TECHWALL1____header_global_f9e852ac34efc8f7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:287
export const W_TECHWALL2____header_global_ce691ddb62d0643b = ((((((297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7c1eb1bcfaa3315874fb542b() {
  return __cxx_static_address_7c1eb1bcfaa3315874fb542b.reference || (__cxx_static_address_7c1eb1bcfaa3315874fb542b.reference = {
    __cReference: true,
    get value() { return W_TECHWALL2____header_global_ce691ddb62d0643b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:288
export const W_TECHWALL15____header_global_cc65a72a9e5742fd = ((((((299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d196fa9b5a699fe4d987d4a8() {
  return __cxx_static_address_d196fa9b5a699fe4d987d4a8.reference || (__cxx_static_address_d196fa9b5a699fe4d987d4a8.reference = {
    __cReference: true,
    get value() { return W_TECHWALL15____header_global_cc65a72a9e5742fd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:289
export const W_TECHWALL3____header_global_7ce2a0aff4ec7c5d = ((((((301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0fb403fb4cc55fcc82b079d3() {
  return __cxx_static_address_0fb403fb4cc55fcc82b079d3.reference || (__cxx_static_address_0fb403fb4cc55fcc82b079d3.reference = {
    __cReference: true,
    get value() { return W_TECHWALL3____header_global_7ce2a0aff4ec7c5d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:290
export const W_TECHWALL4____header_global_e15f42e850284a10 = ((((((305) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8666492915386488f8812b16() {
  return __cxx_static_address_8666492915386488f8812b16.reference || (__cxx_static_address_8666492915386488f8812b16.reference = {
    __cReference: true,
    get value() { return W_TECHWALL4____header_global_e15f42e850284a10; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:291
export const W_TECHWALL10____header_global_1c1b956406a4332d = ((((((306) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0b43f40f7ec0bf97714b3ed9() {
  return __cxx_static_address_0b43f40f7ec0bf97714b3ed9.reference || (__cxx_static_address_0b43f40f7ec0bf97714b3ed9.reference = {
    __cReference: true,
    get value() { return W_TECHWALL10____header_global_1c1b956406a4332d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:292
export const W_TECHWALL16____header_global_7d6a1104623267fa = ((((((307) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7ba90e026688fa085ac78860() {
  return __cxx_static_address_7ba90e026688fa085ac78860.reference || (__cxx_static_address_7ba90e026688fa085ac78860.reference = {
    __cReference: true,
    get value() { return W_TECHWALL16____header_global_7d6a1104623267fa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:293
export const WATERTILE2____header_global_fc8b30bb14493a30 = ((((((336) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3a10e719ac4a911dc7b84ad9() {
  return __cxx_static_address_3a10e719ac4a911dc7b84ad9.reference || (__cxx_static_address_3a10e719ac4a911dc7b84ad9.reference = {
    __cReference: true,
    get value() { return WATERTILE2____header_global_fc8b30bb14493a30; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:294
export const BPANNEL1____header_global_c74108690cb78b0a = ((((((341) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4a5704127f47e987e8062617() {
  return __cxx_static_address_4a5704127f47e987e8062617.reference || (__cxx_static_address_4a5704127f47e987e8062617.reference = {
    __cReference: true,
    get value() { return BPANNEL1____header_global_c74108690cb78b0a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:295
export const PANNEL1____header_global_0faba0ef8e0631d2 = ((((((342) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_89686cf54d1464629e62e641() {
  return __cxx_static_address_89686cf54d1464629e62e641.reference || (__cxx_static_address_89686cf54d1464629e62e641.reference = {
    __cReference: true,
    get value() { return PANNEL1____header_global_0faba0ef8e0631d2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:296
export const PANNEL2____header_global_1cecc414ae89ba84 = ((((((343) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_101ed046bd036ffe9523a499() {
  return __cxx_static_address_101ed046bd036ffe9523a499.reference || (__cxx_static_address_101ed046bd036ffe9523a499.reference = {
    __cReference: true,
    get value() { return PANNEL2____header_global_1cecc414ae89ba84; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:297
export const STATIC____header_global_dcde76ad87664bdc = ((((((351) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d482c0f6f5a0f83253d1ab16() {
  return __cxx_static_address_d482c0f6f5a0f83253d1ab16.reference || (__cxx_static_address_d482c0f6f5a0f83253d1ab16.reference = {
    __cReference: true,
    get value() { return STATIC____header_global_dcde76ad87664bdc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:298
export const W_SCREENBREAK____header_global_c45127085e52caf7 = ((((((357) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ff45b2041e5a2a5fccd910cd() {
  return __cxx_static_address_ff45b2041e5a2a5fccd910cd.reference || (__cxx_static_address_ff45b2041e5a2a5fccd910cd.reference = {
    __cReference: true,
    get value() { return W_SCREENBREAK____header_global_c45127085e52caf7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:299
export const W_HITTECHWALL3____header_global_d7230a01ff9871aa = ((((((360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_81e4ff6dfb73f0a31078626d() {
  return __cxx_static_address_81e4ff6dfb73f0a31078626d.reference || (__cxx_static_address_81e4ff6dfb73f0a31078626d.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL3____header_global_d7230a01ff9871aa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:300
export const W_HITTECHWALL4____header_global_8b295eab908ff502 = ((((((361) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c29038a3f4d7dc26d43450b7() {
  return __cxx_static_address_c29038a3f4d7dc26d43450b7.reference || (__cxx_static_address_c29038a3f4d7dc26d43450b7.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL4____header_global_8b295eab908ff502; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:301
export const W_HITTECHWALL2____header_global_65ac4c77fdfe5522 = ((((((362) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b957d90c609a63740406f828() {
  return __cxx_static_address_b957d90c609a63740406f828.reference || (__cxx_static_address_b957d90c609a63740406f828.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL2____header_global_65ac4c77fdfe5522; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:302
export const W_HITTECHWALL1____header_global_5f171aa7aa24e955 = ((((((363) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6e0d3bc203aa74cf557d264a() {
  return __cxx_static_address_6e0d3bc203aa74cf557d264a.reference || (__cxx_static_address_6e0d3bc203aa74cf557d264a.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL1____header_global_5f171aa7aa24e955; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:303
export const MASKWALL10____header_global_3940a4f09c42a804 = ((((((387) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cd9276785a9bc2fbcdc586ae() {
  return __cxx_static_address_cd9276785a9bc2fbcdc586ae.reference || (__cxx_static_address_cd9276785a9bc2fbcdc586ae.reference = {
    __cReference: true,
    get value() { return MASKWALL10____header_global_3940a4f09c42a804; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:304
export const MASKWALL11____header_global_50f23785c464864f = ((((((391) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_be4ce07d6be7a47a62762606() {
  return __cxx_static_address_be4ce07d6be7a47a62762606.reference || (__cxx_static_address_be4ce07d6be7a47a62762606.reference = {
    __cReference: true,
    get value() { return MASKWALL11____header_global_50f23785c464864f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:305
export const DOORTILE22____header_global_dad165754ddf3568 = ((((((395) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dd309b8906086b76cb41196c() {
  return __cxx_static_address_dd309b8906086b76cb41196c.reference || (__cxx_static_address_dd309b8906086b76cb41196c.reference = {
    __cReference: true,
    get value() { return DOORTILE22____header_global_dad165754ddf3568; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:306
export const FANSPRITE____header_global_5d390f6190cb96bc = ((((((407) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e42ac98e414ac6056265301b() {
  return __cxx_static_address_e42ac98e414ac6056265301b.reference || (__cxx_static_address_e42ac98e414ac6056265301b.reference = {
    __cReference: true,
    get value() { return FANSPRITE____header_global_5d390f6190cb96bc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:307
export const FANSPRITEBROKE____header_global_88550e47a83091ad = ((((((411) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_becc0e5b2006a7406ed97b2b() {
  return __cxx_static_address_becc0e5b2006a7406ed97b2b.reference || (__cxx_static_address_becc0e5b2006a7406ed97b2b.reference = {
    __cReference: true,
    get value() { return FANSPRITEBROKE____header_global_88550e47a83091ad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:308
export const FANSHADOW____header_global_f0792de0e4039224 = ((((((412) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4ede9d4ed1a489b3f45a0e9f() {
  return __cxx_static_address_4ede9d4ed1a489b3f45a0e9f.reference || (__cxx_static_address_4ede9d4ed1a489b3f45a0e9f.reference = {
    __cReference: true,
    get value() { return FANSHADOW____header_global_f0792de0e4039224; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:309
export const FANSHADOWBROKE____header_global_da5f17ab6d536233 = ((((((416) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_414c0d2c99ec9024f6ff568d() {
  return __cxx_static_address_414c0d2c99ec9024f6ff568d.reference || (__cxx_static_address_414c0d2c99ec9024f6ff568d.reference = {
    __cReference: true,
    get value() { return FANSHADOWBROKE____header_global_da5f17ab6d536233; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:310
export const DOORTILE18____header_global_12c27bc1d91f121b = ((((((447) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9c5a6afa86eec251b1cb89ba() {
  return __cxx_static_address_9c5a6afa86eec251b1cb89ba.reference || (__cxx_static_address_9c5a6afa86eec251b1cb89ba.reference = {
    __cReference: true,
    get value() { return DOORTILE18____header_global_12c27bc1d91f121b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:311
export const DOORTILE19____header_global_72d7212d293bd450 = ((((((448) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7e0607fc1419d97a9523ce41() {
  return __cxx_static_address_7e0607fc1419d97a9523ce41.reference || (__cxx_static_address_7e0607fc1419d97a9523ce41.reference = {
    __cReference: true,
    get value() { return DOORTILE19____header_global_72d7212d293bd450; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:312
export const DOORTILE20____header_global_11511f3a5f1866f7 = ((((((449) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_032339f6872f9054978e1be1() {
  return __cxx_static_address_032339f6872f9054978e1be1.reference || (__cxx_static_address_032339f6872f9054978e1be1.reference = {
    __cReference: true,
    get value() { return DOORTILE20____header_global_11511f3a5f1866f7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:313
export const VIEWSCREEN2____header_global_78e0c3159d69b454 = ((((((499) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_47cdf1004b916977975589dd() {
  return __cxx_static_address_47cdf1004b916977975589dd.reference || (__cxx_static_address_47cdf1004b916977975589dd.reference = {
    __cReference: true,
    get value() { return VIEWSCREEN2____header_global_78e0c3159d69b454; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:314
export const VIEWSCREEN____header_global_2d4e8cb215069f72 = ((((((502) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_adbc316cabd200ad5614a94e() {
  return __cxx_static_address_adbc316cabd200ad5614a94e.reference || (__cxx_static_address_adbc316cabd200ad5614a94e.reference = {
    __cReference: true,
    get value() { return VIEWSCREEN____header_global_2d4e8cb215069f72; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:315
export const GLASS____header_global_bdb64d90c6ee3a39 = ((((((503) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1ad68a5e063bc1e48469967d() {
  return __cxx_static_address_1ad68a5e063bc1e48469967d.reference || (__cxx_static_address_1ad68a5e063bc1e48469967d.reference = {
    __cReference: true,
    get value() { return GLASS____header_global_bdb64d90c6ee3a39; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:316
export const GLASS2____header_global_29f70dbd18130e6e = ((((((504) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ac75659ebe67a0e4cf939d2a() {
  return __cxx_static_address_ac75659ebe67a0e4cf939d2a.reference || (__cxx_static_address_ac75659ebe67a0e4cf939d2a.reference = {
    __cReference: true,
    get value() { return GLASS2____header_global_29f70dbd18130e6e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:317
export const STAINGLASS1____header_global_d15c6298c9b6ab88 = ((((((510) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c932a3a37e903983c6dce8d1() {
  return __cxx_static_address_c932a3a37e903983c6dce8d1.reference || (__cxx_static_address_c932a3a37e903983c6dce8d1.reference = {
    __cReference: true,
    get value() { return STAINGLASS1____header_global_d15c6298c9b6ab88; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:318
export const MASKWALL5____header_global_570eb086303e5837 = ((((((514) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_403a942932e0cb217aa80f3a() {
  return __cxx_static_address_403a942932e0cb217aa80f3a.reference || (__cxx_static_address_403a942932e0cb217aa80f3a.reference = {
    __cReference: true,
    get value() { return MASKWALL5____header_global_570eb086303e5837; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:319
export const SATELITE____header_global_1a1171d0d6055ee4 = ((((((516) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_01fcea36cbc3a72e78af9685() {
  return __cxx_static_address_01fcea36cbc3a72e78af9685.reference || (__cxx_static_address_01fcea36cbc3a72e78af9685.reference = {
    __cReference: true,
    get value() { return SATELITE____header_global_1a1171d0d6055ee4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:320
export const FUELPOD____header_global_b761a4fb6c6987e4 = ((((((517) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cc7df57943338a92cbbd7e36() {
  return __cxx_static_address_cc7df57943338a92cbbd7e36.reference || (__cxx_static_address_cc7df57943338a92cbbd7e36.reference = {
    __cReference: true,
    get value() { return FUELPOD____header_global_b761a4fb6c6987e4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:321
export const CRACK1____header_global_0711d8c9fb685aac = ((((((546) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f5f3d7846aa7f3a07e7404c0() {
  return __cxx_static_address_f5f3d7846aa7f3a07e7404c0.reference || (__cxx_static_address_f5f3d7846aa7f3a07e7404c0.reference = {
    __cReference: true,
    get value() { return CRACK1____header_global_0711d8c9fb685aac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:322
export const CRACK2____header_global_9fe6e8f2d8252e0b = ((((((547) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f344ebcc87c5aaa85ad8d855() {
  return __cxx_static_address_f344ebcc87c5aaa85ad8d855.reference || (__cxx_static_address_f344ebcc87c5aaa85ad8d855.reference = {
    __cReference: true,
    get value() { return CRACK2____header_global_9fe6e8f2d8252e0b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:323
export const CRACK3____header_global_9d8a0ccf9695621e = ((((((548) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_28c30379f5b2e8594d39b107() {
  return __cxx_static_address_28c30379f5b2e8594d39b107.reference || (__cxx_static_address_28c30379f5b2e8594d39b107.reference = {
    __cReference: true,
    get value() { return CRACK3____header_global_9d8a0ccf9695621e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:324
export const CRACK4____header_global_cf9c219abe710003 = ((((((549) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4f51bf29d55650d318b03731() {
  return __cxx_static_address_4f51bf29d55650d318b03731.reference || (__cxx_static_address_4f51bf29d55650d318b03731.reference = {
    __cReference: true,
    get value() { return CRACK4____header_global_cf9c219abe710003; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:325
export const FOOTPRINTS____header_global_ab7ff11df0c14974 = ((((((550) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_21855dee97c9259b5564865d() {
  return __cxx_static_address_21855dee97c9259b5564865d.reference || (__cxx_static_address_21855dee97c9259b5564865d.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS____header_global_ab7ff11df0c14974; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:326
export const DOMELITE____header_global_a1136d3948b4d6ba = ((((((551) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b9c4d371f24d4a745a5b3424() {
  return __cxx_static_address_b9c4d371f24d4a745a5b3424.reference || (__cxx_static_address_b9c4d371f24d4a745a5b3424.reference = {
    __cReference: true,
    get value() { return DOMELITE____header_global_a1136d3948b4d6ba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:327
export const CAMERAPOLE____header_global_182d552660142906 = ((((((554) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_545eddd462ffb6489f519687() {
  return __cxx_static_address_545eddd462ffb6489f519687.reference || (__cxx_static_address_545eddd462ffb6489f519687.reference = {
    __cReference: true,
    get value() { return CAMERAPOLE____header_global_182d552660142906; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:328
export const CHAIR1____header_global_919e5cb1d498f0c0 = ((((((556) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_318aa8b76362e23601bb960e() {
  return __cxx_static_address_318aa8b76362e23601bb960e.reference || (__cxx_static_address_318aa8b76362e23601bb960e.reference = {
    __cReference: true,
    get value() { return CHAIR1____header_global_919e5cb1d498f0c0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:329
export const CHAIR2____header_global_27c6ed1453b8c6ad = ((((((557) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b5966447f120779760a7b759() {
  return __cxx_static_address_b5966447f120779760a7b759.reference || (__cxx_static_address_b5966447f120779760a7b759.reference = {
    __cReference: true,
    get value() { return CHAIR2____header_global_27c6ed1453b8c6ad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:330
export const BROKENCHAIR____header_global_74960afefb0e2df3 = ((((((559) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e2e71ecfb50aa5cf9bfbcac3() {
  return __cxx_static_address_e2e71ecfb50aa5cf9bfbcac3.reference || (__cxx_static_address_e2e71ecfb50aa5cf9bfbcac3.reference = {
    __cReference: true,
    get value() { return BROKENCHAIR____header_global_74960afefb0e2df3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:331
export const MIRROR____header_global_6e5a6f0dec8b2b4c = ((((((560) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_35a0a22ccd3813a2fb71c921() {
  return __cxx_static_address_35a0a22ccd3813a2fb71c921.reference || (__cxx_static_address_35a0a22ccd3813a2fb71c921.reference = {
    __cReference: true,
    get value() { return MIRROR____header_global_6e5a6f0dec8b2b4c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:332
export const WATERFOUNTAIN____header_global_41c5dacaf1d20237 = ((((((563) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_355027c3742e75e185e99f70() {
  return __cxx_static_address_355027c3742e75e185e99f70.reference || (__cxx_static_address_355027c3742e75e185e99f70.reference = {
    __cReference: true,
    get value() { return WATERFOUNTAIN____header_global_41c5dacaf1d20237; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:333
export const WATERFOUNTAINBROKE____header_global_903b48c1d3f71d4d = ((((((567) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dac21cf639b1a9d193017b16() {
  return __cxx_static_address_dac21cf639b1a9d193017b16.reference || (__cxx_static_address_dac21cf639b1a9d193017b16.reference = {
    __cReference: true,
    get value() { return WATERFOUNTAINBROKE____header_global_903b48c1d3f71d4d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:334
export const FEMMAG1____header_global_be99822a05f5f6f6 = ((((((568) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b922b4cf6dbab1883d81fcd7() {
  return __cxx_static_address_b922b4cf6dbab1883d81fcd7.reference || (__cxx_static_address_b922b4cf6dbab1883d81fcd7.reference = {
    __cReference: true,
    get value() { return FEMMAG1____header_global_be99822a05f5f6f6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:335
export const TOILET____header_global_9a8aac1977df594a = ((((((569) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f6699a57649eabcc7f697d8b() {
  return __cxx_static_address_f6699a57649eabcc7f697d8b.reference || (__cxx_static_address_f6699a57649eabcc7f697d8b.reference = {
    __cReference: true,
    get value() { return TOILET____header_global_9a8aac1977df594a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:336
export const STALL____header_global_4066f97b89a73179 = ((((((571) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_18a3e661cb7e0f63a6d1df26() {
  return __cxx_static_address_18a3e661cb7e0f63a6d1df26.reference || (__cxx_static_address_18a3e661cb7e0f63a6d1df26.reference = {
    __cReference: true,
    get value() { return STALL____header_global_4066f97b89a73179; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:337
export const STALLBROKE____header_global_b50c089e25d3b49b = ((((((573) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c27cbe8a18ac7fe719bdeeb1() {
  return __cxx_static_address_c27cbe8a18ac7fe719bdeeb1.reference || (__cxx_static_address_c27cbe8a18ac7fe719bdeeb1.reference = {
    __cReference: true,
    get value() { return STALLBROKE____header_global_b50c089e25d3b49b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:338
export const FEMMAG2____header_global_8544758070f43024 = ((((((577) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d787e7a3e762db98e92987e4() {
  return __cxx_static_address_d787e7a3e762db98e92987e4.reference || (__cxx_static_address_d787e7a3e762db98e92987e4.reference = {
    __cReference: true,
    get value() { return FEMMAG2____header_global_8544758070f43024; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:339
export const REACTOR2____header_global_35b6a7f19e520b49 = ((((((578) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7882e91b9ea568f635c04d7b() {
  return __cxx_static_address_7882e91b9ea568f635c04d7b.reference || (__cxx_static_address_7882e91b9ea568f635c04d7b.reference = {
    __cReference: true,
    get value() { return REACTOR2____header_global_35b6a7f19e520b49; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:340
export const REACTOR2BURNT____header_global_532e84ca419ab601 = ((((((579) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6e01eb29907f2dfef1ddb576() {
  return __cxx_static_address_6e01eb29907f2dfef1ddb576.reference || (__cxx_static_address_6e01eb29907f2dfef1ddb576.reference = {
    __cReference: true,
    get value() { return REACTOR2BURNT____header_global_532e84ca419ab601; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:341
export const REACTOR2SPARK____header_global_16966ce169e286f0 = ((((((580) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dff4fadb3e4771ad4774cb4f() {
  return __cxx_static_address_dff4fadb3e4771ad4774cb4f.reference || (__cxx_static_address_dff4fadb3e4771ad4774cb4f.reference = {
    __cReference: true,
    get value() { return REACTOR2SPARK____header_global_16966ce169e286f0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:342
export const GRATE1____header_global_0a1f94715ec0ff6f = ((((((595) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b5df235f9827b964596a1d03() {
  return __cxx_static_address_b5df235f9827b964596a1d03.reference || (__cxx_static_address_b5df235f9827b964596a1d03.reference = {
    __cReference: true,
    get value() { return GRATE1____header_global_0a1f94715ec0ff6f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:343
export const BGRATE1____header_global_ad182b43122ae523 = ((((((596) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bb75916969692326b8f39737() {
  return __cxx_static_address_bb75916969692326b8f39737.reference || (__cxx_static_address_bb75916969692326b8f39737.reference = {
    __cReference: true,
    get value() { return BGRATE1____header_global_ad182b43122ae523; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:344
export const SOLARPANNEL____header_global_84df9130b2072280 = ((((((602) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_592483cf50cfc6d58427c46d() {
  return __cxx_static_address_592483cf50cfc6d58427c46d.reference || (__cxx_static_address_592483cf50cfc6d58427c46d.reference = {
    __cReference: true,
    get value() { return SOLARPANNEL____header_global_84df9130b2072280; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:345
export const NAKED1____header_global_1e1cfc8e51715b40 = ((((((603) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_29db79de5268bc77de00fc44() {
  return __cxx_static_address_29db79de5268bc77de00fc44.reference || (__cxx_static_address_29db79de5268bc77de00fc44.reference = {
    __cReference: true,
    get value() { return NAKED1____header_global_1e1cfc8e51715b40; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:346
export const ANTENNA____header_global_d9bba84fc1cd6693 = ((((((607) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b20003bc381772b36ec9a350() {
  return __cxx_static_address_b20003bc381772b36ec9a350.reference || (__cxx_static_address_b20003bc381772b36ec9a350.reference = {
    __cReference: true,
    get value() { return ANTENNA____header_global_d9bba84fc1cd6693; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:347
export const MASKWALL12____header_global_2516956038720156 = ((((((609) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e77625d457f3e07efce4de8f() {
  return __cxx_static_address_e77625d457f3e07efce4de8f.reference || (__cxx_static_address_e77625d457f3e07efce4de8f.reference = {
    __cReference: true,
    get value() { return MASKWALL12____header_global_2516956038720156; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:348
export const TOILETBROKE____header_global_dec94064137d933d = ((((((615) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_14e1fd540cd98e0a56519ae4() {
  return __cxx_static_address_14e1fd540cd98e0a56519ae4.reference || (__cxx_static_address_14e1fd540cd98e0a56519ae4.reference = {
    __cReference: true,
    get value() { return TOILETBROKE____header_global_dec94064137d933d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:349
export const PIPE2____header_global_923bf5a8d99eebb8 = ((((((616) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9ca294f54386711c5a8225d1() {
  return __cxx_static_address_9ca294f54386711c5a8225d1.reference || (__cxx_static_address_9ca294f54386711c5a8225d1.reference = {
    __cReference: true,
    get value() { return PIPE2____header_global_923bf5a8d99eebb8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:350
export const PIPE1B____header_global_13d889837656b379 = ((((((617) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_114fdcf53ccdae7adfd66a50() {
  return __cxx_static_address_114fdcf53ccdae7adfd66a50.reference || (__cxx_static_address_114fdcf53ccdae7adfd66a50.reference = {
    __cReference: true,
    get value() { return PIPE1B____header_global_13d889837656b379; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:351
export const PIPE3____header_global_90c46e658ae2fffe = ((((((618) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_90a5e2c047c2c73fe4e5ba30() {
  return __cxx_static_address_90a5e2c047c2c73fe4e5ba30.reference || (__cxx_static_address_90a5e2c047c2c73fe4e5ba30.reference = {
    __cReference: true,
    get value() { return PIPE3____header_global_90c46e658ae2fffe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:352
export const PIPE1____header_global_8c8818fd3572187d = ((((((619) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ed2364ad0fb3ad26a66d8d24() {
  return __cxx_static_address_ed2364ad0fb3ad26a66d8d24.reference || (__cxx_static_address_ed2364ad0fb3ad26a66d8d24.reference = {
    __cReference: true,
    get value() { return PIPE1____header_global_8c8818fd3572187d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:353
export const CAMERA1____header_global_d1f8d09f7169de10 = ((((((621) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5f73e1a3bfa0be98bcd9a607() {
  return __cxx_static_address_5f73e1a3bfa0be98bcd9a607.reference || (__cxx_static_address_5f73e1a3bfa0be98bcd9a607.reference = {
    __cReference: true,
    get value() { return CAMERA1____header_global_d1f8d09f7169de10; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:354
export const PIPE2B____header_global_595a628bfa3f54d1 = ((((((633) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c02cad747af935f67d7f2b97() {
  return __cxx_static_address_c02cad747af935f67d7f2b97.reference || (__cxx_static_address_c02cad747af935f67d7f2b97.reference = {
    __cReference: true,
    get value() { return PIPE2B____header_global_595a628bfa3f54d1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:355
export const BOLT1____header_global_6326d8f449b9269e = ((((((634) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7afd1213f33d12730d36017b() {
  return __cxx_static_address_7afd1213f33d12730d36017b.reference || (__cxx_static_address_7afd1213f33d12730d36017b.reference = {
    __cReference: true,
    get value() { return BOLT1____header_global_6326d8f449b9269e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:356
export const W_NUMBERS____header_global_ab28219e64a760a0 = ((((((640) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_94082361c9e10dce72fe3bd6() {
  return __cxx_static_address_94082361c9e10dce72fe3bd6.reference || (__cxx_static_address_94082361c9e10dce72fe3bd6.reference = {
    __cReference: true,
    get value() { return W_NUMBERS____header_global_ab28219e64a760a0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:357
export const WATERDRIP____header_global_365172f1ba1485c4 = ((((((660) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b931ee70ae72caa7f4ede684() {
  return __cxx_static_address_b931ee70ae72caa7f4ede684.reference || (__cxx_static_address_b931ee70ae72caa7f4ede684.reference = {
    __cReference: true,
    get value() { return WATERDRIP____header_global_365172f1ba1485c4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:358
export const WATERBUBBLE____header_global_b187c51686207e02 = ((((((661) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_14f32249b32e187f335547ff() {
  return __cxx_static_address_14f32249b32e187f335547ff.reference || (__cxx_static_address_14f32249b32e187f335547ff.reference = {
    __cReference: true,
    get value() { return WATERBUBBLE____header_global_b187c51686207e02; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:359
export const WATERBUBBLEMAKER____header_global_45cb107dbeb0683a = ((((((662) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3ee207ff51e55a2c6a657bd0() {
  return __cxx_static_address_3ee207ff51e55a2c6a657bd0.reference || (__cxx_static_address_3ee207ff51e55a2c6a657bd0.reference = {
    __cReference: true,
    get value() { return WATERBUBBLEMAKER____header_global_45cb107dbeb0683a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:360
export const W_FORCEFIELD____header_global_81264e6325cffd1d = ((((((663) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c16de141915cc2ba95864c4f() {
  return __cxx_static_address_c16de141915cc2ba95864c4f.reference || (__cxx_static_address_c16de141915cc2ba95864c4f.reference = {
    __cReference: true,
    get value() { return W_FORCEFIELD____header_global_81264e6325cffd1d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:361
export const VACUUM____header_global_5be3cb4d4347e039 = ((((((669) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8521d9fbfab8916781aeeb48() {
  return __cxx_static_address_8521d9fbfab8916781aeeb48.reference || (__cxx_static_address_8521d9fbfab8916781aeeb48.reference = {
    __cReference: true,
    get value() { return VACUUM____header_global_5be3cb4d4347e039; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:362
export const FOOTPRINTS2____header_global_3849f76e08151c83 = ((((((672) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ed06c5b159b92b3992526fb1() {
  return __cxx_static_address_ed06c5b159b92b3992526fb1.reference || (__cxx_static_address_ed06c5b159b92b3992526fb1.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS2____header_global_3849f76e08151c83; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:363
export const FOOTPRINTS3____header_global_d77b78553cd87189 = ((((((673) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_66c221c28e396cbfd531b199() {
  return __cxx_static_address_66c221c28e396cbfd531b199.reference || (__cxx_static_address_66c221c28e396cbfd531b199.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS3____header_global_d77b78553cd87189; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:364
export const FOOTPRINTS4____header_global_24a4b41af2ac83c5 = ((((((674) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a8952e151b39e7c5a5b5819c() {
  return __cxx_static_address_a8952e151b39e7c5a5b5819c.reference || (__cxx_static_address_a8952e151b39e7c5a5b5819c.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS4____header_global_24a4b41af2ac83c5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:365
export const EGG____header_global_e130e388d476f1b9 = ((((((675) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_961492a229406a8164dd057a() {
  return __cxx_static_address_961492a229406a8164dd057a.reference || (__cxx_static_address_961492a229406a8164dd057a.reference = {
    __cReference: true,
    get value() { return EGG____header_global_e130e388d476f1b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:366
export const SCALE____header_global_28560de7a503a637 = ((((((678) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9b0f6ec84ca41cb89e0fd251() {
  return __cxx_static_address_9b0f6ec84ca41cb89e0fd251.reference || (__cxx_static_address_9b0f6ec84ca41cb89e0fd251.reference = {
    __cReference: true,
    get value() { return SCALE____header_global_28560de7a503a637; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:367
export const CHAIR3____header_global_5bffb909e2f95974 = ((((((680) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f22ccc0a9c03d37960d154cd() {
  return __cxx_static_address_f22ccc0a9c03d37960d154cd.reference || (__cxx_static_address_f22ccc0a9c03d37960d154cd.reference = {
    __cReference: true,
    get value() { return CHAIR3____header_global_5bffb909e2f95974; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:368
export const CAMERALIGHT____header_global_a6ee4276925b4d24 = ((((((685) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5215b26af21ade2e8970fcc7() {
  return __cxx_static_address_5215b26af21ade2e8970fcc7.reference || (__cxx_static_address_5215b26af21ade2e8970fcc7.reference = {
    __cReference: true,
    get value() { return CAMERALIGHT____header_global_a6ee4276925b4d24; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:369
export const MOVIECAMERA____header_global_c6d9442eb4e5b094 = ((((((686) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cc151cb87140ba67d31a98c7() {
  return __cxx_static_address_cc151cb87140ba67d31a98c7.reference || (__cxx_static_address_cc151cb87140ba67d31a98c7.reference = {
    __cReference: true,
    get value() { return MOVIECAMERA____header_global_c6d9442eb4e5b094; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:370
export const IVUNIT____header_global_4fbf767443abffac = ((((((689) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c164e43dbf46018e88833c8e() {
  return __cxx_static_address_c164e43dbf46018e88833c8e.reference || (__cxx_static_address_c164e43dbf46018e88833c8e.reference = {
    __cReference: true,
    get value() { return IVUNIT____header_global_4fbf767443abffac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:371
export const POT1____header_global_a9e003cb86232d1d = ((((((694) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ba0e1aa37cf82cb070cf2438() {
  return __cxx_static_address_ba0e1aa37cf82cb070cf2438.reference || (__cxx_static_address_ba0e1aa37cf82cb070cf2438.reference = {
    __cReference: true,
    get value() { return POT1____header_global_a9e003cb86232d1d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:372
export const POT2____header_global_4b731850acff0f09 = ((((((695) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a2f34e793da80911a3b24e15() {
  return __cxx_static_address_a2f34e793da80911a3b24e15.reference || (__cxx_static_address_a2f34e793da80911a3b24e15.reference = {
    __cReference: true,
    get value() { return POT2____header_global_4b731850acff0f09; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:373
export const POT3____header_global_19b141a11a7ca75a = ((((((697) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0ce1292ea4bb5768fba7dffa() {
  return __cxx_static_address_0ce1292ea4bb5768fba7dffa.reference || (__cxx_static_address_0ce1292ea4bb5768fba7dffa.reference = {
    __cReference: true,
    get value() { return POT3____header_global_19b141a11a7ca75a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:374
export const PIPE3B____header_global_0c880388f017cbab = ((((((700) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0755a302d66da91bea481cba() {
  return __cxx_static_address_0755a302d66da91bea481cba.reference || (__cxx_static_address_0755a302d66da91bea481cba.reference = {
    __cReference: true,
    get value() { return PIPE3B____header_global_0c880388f017cbab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:375
export const WALLLIGHT3____header_global_894c125a13447082 = ((((((701) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f70db7d600723e6e902e72bc() {
  return __cxx_static_address_f70db7d600723e6e902e72bc.reference || (__cxx_static_address_f70db7d600723e6e902e72bc.reference = {
    __cReference: true,
    get value() { return WALLLIGHT3____header_global_894c125a13447082; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:376
export const WALLLIGHTBUST3____header_global_6142c8cbd054139b = ((((((702) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3f648a96346f9c0edb1e9b4c() {
  return __cxx_static_address_3f648a96346f9c0edb1e9b4c.reference || (__cxx_static_address_3f648a96346f9c0edb1e9b4c.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST3____header_global_6142c8cbd054139b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:377
export const WALLLIGHT1____header_global_5ebedd2d7c7887c4 = ((((((703) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8ad929539873c669996ddf42() {
  return __cxx_static_address_8ad929539873c669996ddf42.reference || (__cxx_static_address_8ad929539873c669996ddf42.reference = {
    __cReference: true,
    get value() { return WALLLIGHT1____header_global_5ebedd2d7c7887c4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:378
export const WALLLIGHTBUST1____header_global_fe800694d6bba518 = ((((((704) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5b6be9ce94b391a919e223e0() {
  return __cxx_static_address_5b6be9ce94b391a919e223e0.reference || (__cxx_static_address_5b6be9ce94b391a919e223e0.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST1____header_global_fe800694d6bba518; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:379
export const WALLLIGHT2____header_global_a35c1c055abd63ef = ((((((705) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6da3656b896e786edc2b083c() {
  return __cxx_static_address_6da3656b896e786edc2b083c.reference || (__cxx_static_address_6da3656b896e786edc2b083c.reference = {
    __cReference: true,
    get value() { return WALLLIGHT2____header_global_a35c1c055abd63ef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:380
export const WALLLIGHTBUST2____header_global_cc6219ef32e99ec6 = ((((((706) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4977c14ade9977efe89d7f8a() {
  return __cxx_static_address_4977c14ade9977efe89d7f8a.reference || (__cxx_static_address_4977c14ade9977efe89d7f8a.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST2____header_global_cc6219ef32e99ec6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:381
export const LIGHTSWITCH2____header_global_0e104a9bdc71e0bf = ((((((712) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0c7e2930458c987ff3290bb7() {
  return __cxx_static_address_0c7e2930458c987ff3290bb7.reference || (__cxx_static_address_0c7e2930458c987ff3290bb7.reference = {
    __cReference: true,
    get value() { return LIGHTSWITCH2____header_global_0e104a9bdc71e0bf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:382
export const WAITTOBESEATED____header_global_2098d768b276fab4 = ((((((716) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9ca0325bb3e35f6d03e65635() {
  return __cxx_static_address_9ca0325bb3e35f6d03e65635.reference || (__cxx_static_address_9ca0325bb3e35f6d03e65635.reference = {
    __cReference: true,
    get value() { return WAITTOBESEATED____header_global_2098d768b276fab4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:383
export const DOORTILE14____header_global_345c5736ffe19a51 = ((((((717) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_874f05addf6e5cff2edce03a() {
  return __cxx_static_address_874f05addf6e5cff2edce03a.reference || (__cxx_static_address_874f05addf6e5cff2edce03a.reference = {
    __cReference: true,
    get value() { return DOORTILE14____header_global_345c5736ffe19a51; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:384
export const STATUE____header_global_39b926a3ce9fea95 = ((((((753) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ae88647e2e157a5d50172dd5() {
  return __cxx_static_address_ae88647e2e157a5d50172dd5.reference || (__cxx_static_address_ae88647e2e157a5d50172dd5.reference = {
    __cReference: true,
    get value() { return STATUE____header_global_39b926a3ce9fea95; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:385
export const MIKE____header_global_741da0ed55553904 = ((((((762) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e6c1d1d381d85a095dcbeba() {
  return __cxx_static_address_1e6c1d1d381d85a095dcbeba.reference || (__cxx_static_address_1e6c1d1d381d85a095dcbeba.reference = {
    __cReference: true,
    get value() { return MIKE____header_global_741da0ed55553904; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:386
export const VASE____header_global_f7ed856f4fa2d256 = ((((((765) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_19a79ed8b58f01780e697d89() {
  return __cxx_static_address_19a79ed8b58f01780e697d89.reference || (__cxx_static_address_19a79ed8b58f01780e697d89.reference = {
    __cReference: true,
    get value() { return VASE____header_global_f7ed856f4fa2d256; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:387
export const SUSHIPLATE1____header_global_20cd0cf06e9516a0 = ((((((768) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9da485eae38aab395da0094a() {
  return __cxx_static_address_9da485eae38aab395da0094a.reference || (__cxx_static_address_9da485eae38aab395da0094a.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE1____header_global_20cd0cf06e9516a0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:388
export const SUSHIPLATE2____header_global_ef63677c8c17c779 = ((((((769) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_30fbad619e7ce5c61a4558e1() {
  return __cxx_static_address_30fbad619e7ce5c61a4558e1.reference || (__cxx_static_address_30fbad619e7ce5c61a4558e1.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE2____header_global_ef63677c8c17c779; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:389
export const SUSHIPLATE3____header_global_37101d90f26baa09 = ((((((774) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_685b26e74cd15cf43cdff513() {
  return __cxx_static_address_685b26e74cd15cf43cdff513.reference || (__cxx_static_address_685b26e74cd15cf43cdff513.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE3____header_global_37101d90f26baa09; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:390
export const SUSHIPLATE4____header_global_10e555656297fbfe = ((((((779) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0815da6c7280bd154508e02a() {
  return __cxx_static_address_0815da6c7280bd154508e02a.reference || (__cxx_static_address_0815da6c7280bd154508e02a.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE4____header_global_10e555656297fbfe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:391
export const DOORTILE16____header_global_037cd23ff687325b = ((((((781) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ec0332e7c1bbc5fac3b203f1() {
  return __cxx_static_address_ec0332e7c1bbc5fac3b203f1.reference || (__cxx_static_address_ec0332e7c1bbc5fac3b203f1.reference = {
    __cReference: true,
    get value() { return DOORTILE16____header_global_037cd23ff687325b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:392
export const SUSHIPLATE5____header_global_daa6e4fdc6bcaf40 = ((((((792) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_55b040a67ee2ae0ef70feaed() {
  return __cxx_static_address_55b040a67ee2ae0ef70feaed.reference || (__cxx_static_address_55b040a67ee2ae0ef70feaed.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE5____header_global_daa6e4fdc6bcaf40; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:393
export const OJ____header_global_aec5e03eee03cb6b = ((((((806) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a60b3c270ec3156018b2f018() {
  return __cxx_static_address_a60b3c270ec3156018b2f018.reference || (__cxx_static_address_a60b3c270ec3156018b2f018.reference = {
    __cReference: true,
    get value() { return OJ____header_global_aec5e03eee03cb6b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:394
export const MASKWALL13____header_global_662d8d808579b803 = ((((((830) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_29f1b0e97796149d721375b7() {
  return __cxx_static_address_29f1b0e97796149d721375b7.reference || (__cxx_static_address_29f1b0e97796149d721375b7.reference = {
    __cReference: true,
    get value() { return MASKWALL13____header_global_662d8d808579b803; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:395
export const HURTRAIL____header_global_e6bcbea8fa8fa7ac = ((((((859) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6fba6ddcaaddf69c3e9c18db() {
  return __cxx_static_address_6fba6ddcaaddf69c3e9c18db.reference || (__cxx_static_address_6fba6ddcaaddf69c3e9c18db.reference = {
    __cReference: true,
    get value() { return HURTRAIL____header_global_e6bcbea8fa8fa7ac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:396
export const POWERSWITCH1____header_global_1d54cfbb36e89447 = ((((((860) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_71f675785222c6167e210bee() {
  return __cxx_static_address_71f675785222c6167e210bee.reference || (__cxx_static_address_71f675785222c6167e210bee.reference = {
    __cReference: true,
    get value() { return POWERSWITCH1____header_global_1d54cfbb36e89447; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:397
export const LOCKSWITCH1____header_global_186796174970cf42 = ((((((862) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6d32d502b4f34e9f636c1a4d() {
  return __cxx_static_address_6d32d502b4f34e9f636c1a4d.reference || (__cxx_static_address_6d32d502b4f34e9f636c1a4d.reference = {
    __cReference: true,
    get value() { return LOCKSWITCH1____header_global_186796174970cf42; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:398
export const POWERSWITCH2____header_global_8c7feea7fd20db2c = ((((((864) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b5632ebf5689091a92341c8e() {
  return __cxx_static_address_b5632ebf5689091a92341c8e.reference || (__cxx_static_address_b5632ebf5689091a92341c8e.reference = {
    __cReference: true,
    get value() { return POWERSWITCH2____header_global_8c7feea7fd20db2c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:399
export const ATM____header_global_eaa29f774d035569 = ((((((867) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_56aff3b58a9d2dcd9b9e443c() {
  return __cxx_static_address_56aff3b58a9d2dcd9b9e443c.reference || (__cxx_static_address_56aff3b58a9d2dcd9b9e443c.reference = {
    __cReference: true,
    get value() { return ATM____header_global_eaa29f774d035569; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:400
export const STATUEFLASH____header_global_3ab8f8ba12f0748d = ((((((869) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aada831825f3939e7691f7b9() {
  return __cxx_static_address_aada831825f3939e7691f7b9.reference || (__cxx_static_address_aada831825f3939e7691f7b9.reference = {
    __cReference: true,
    get value() { return STATUEFLASH____header_global_3ab8f8ba12f0748d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:401
export const ATMBROKE____header_global_ad89e76e0225796c = ((((((888) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_925c928800f97a2715b83ffd() {
  return __cxx_static_address_925c928800f97a2715b83ffd.reference || (__cxx_static_address_925c928800f97a2715b83ffd.reference = {
    __cReference: true,
    get value() { return ATMBROKE____header_global_ad89e76e0225796c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:402
export const STRIPEBALL____header_global_ed82cb0ca73b9675 = ((((((901) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_23e99d15457435636aa79c25() {
  return __cxx_static_address_23e99d15457435636aa79c25.reference || (__cxx_static_address_23e99d15457435636aa79c25.reference = {
    __cReference: true,
    get value() { return STRIPEBALL____header_global_ed82cb0ca73b9675; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:403
export const QUEBALL____header_global_cc2b41d43278c7ba = ((((((902) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_719fd4c448cd6bec440c85fc() {
  return __cxx_static_address_719fd4c448cd6bec440c85fc.reference || (__cxx_static_address_719fd4c448cd6bec440c85fc.reference = {
    __cReference: true,
    get value() { return QUEBALL____header_global_cc2b41d43278c7ba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:404
export const POCKET____header_global_e57bb5bd071ea705 = ((((((903) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_61898c892a2aad94539e56a6() {
  return __cxx_static_address_61898c892a2aad94539e56a6.reference || (__cxx_static_address_61898c892a2aad94539e56a6.reference = {
    __cReference: true,
    get value() { return POCKET____header_global_e57bb5bd071ea705; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:405
export const WOODENHORSE____header_global_385763d424835b92 = ((((((904) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_388be9bba39c89b4107ea046() {
  return __cxx_static_address_388be9bba39c89b4107ea046.reference || (__cxx_static_address_388be9bba39c89b4107ea046.reference = {
    __cReference: true,
    get value() { return WOODENHORSE____header_global_385763d424835b92; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:406
export const TREE1____header_global_984bae640c29fa4b = ((((((908) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aa8711969f1168a4dfd1e6b1() {
  return __cxx_static_address_aa8711969f1168a4dfd1e6b1.reference || (__cxx_static_address_aa8711969f1168a4dfd1e6b1.reference = {
    __cReference: true,
    get value() { return TREE1____header_global_984bae640c29fa4b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:407
export const TREE2____header_global_b2c8fbe9c349d7be = ((((((910) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6aa52f002d9ed53875c85589() {
  return __cxx_static_address_6aa52f002d9ed53875c85589.reference || (__cxx_static_address_6aa52f002d9ed53875c85589.reference = {
    __cReference: true,
    get value() { return TREE2____header_global_b2c8fbe9c349d7be; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:408
export const CACTUS____header_global_63673b4cefb0b750 = ((((((911) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6e720e935444f3b6f1d4de30() {
  return __cxx_static_address_6e720e935444f3b6f1d4de30.reference || (__cxx_static_address_6e720e935444f3b6f1d4de30.reference = {
    __cReference: true,
    get value() { return CACTUS____header_global_63673b4cefb0b750; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:409
export const MASKWALL2____header_global_abf28e066438a70b = ((((((913) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bf3b5d04b37a7d4dda0e9e24() {
  return __cxx_static_address_bf3b5d04b37a7d4dda0e9e24.reference || (__cxx_static_address_bf3b5d04b37a7d4dda0e9e24.reference = {
    __cReference: true,
    get value() { return MASKWALL2____header_global_abf28e066438a70b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:410
export const MASKWALL3____header_global_6206cc76cadd1623 = ((((((914) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3a01b96374a64a925c52a4dc() {
  return __cxx_static_address_3a01b96374a64a925c52a4dc.reference || (__cxx_static_address_3a01b96374a64a925c52a4dc.reference = {
    __cReference: true,
    get value() { return MASKWALL3____header_global_6206cc76cadd1623; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:411
export const MASKWALL4____header_global_c4e28f966016c7db = ((((((915) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_31baefd37c30a0a62cd0091a() {
  return __cxx_static_address_31baefd37c30a0a62cd0091a.reference || (__cxx_static_address_31baefd37c30a0a62cd0091a.reference = {
    __cReference: true,
    get value() { return MASKWALL4____header_global_c4e28f966016c7db; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:412
export const FIREEXT____header_global_7af6526d54441e73 = ((((((916) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c1ea5e06e9e3a46b0cd3c764() {
  return __cxx_static_address_c1ea5e06e9e3a46b0cd3c764.reference || (__cxx_static_address_c1ea5e06e9e3a46b0cd3c764.reference = {
    __cReference: true,
    get value() { return FIREEXT____header_global_7af6526d54441e73; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:413
export const TOILETWATER____header_global_28584f78704da6a0 = ((((((921) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c3b8294de3bf610361a260f6() {
  return __cxx_static_address_c3b8294de3bf610361a260f6.reference || (__cxx_static_address_c3b8294de3bf610361a260f6.reference = {
    __cReference: true,
    get value() { return TOILETWATER____header_global_28584f78704da6a0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:414
export const NEON1____header_global_df55d72dd9be47c5 = ((((((925) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_30f702e883fb9937d6c84815() {
  return __cxx_static_address_30f702e883fb9937d6c84815.reference || (__cxx_static_address_30f702e883fb9937d6c84815.reference = {
    __cReference: true,
    get value() { return NEON1____header_global_df55d72dd9be47c5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:415
export const NEON2____header_global_4db63b4f70c350b9 = ((((((926) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_837e191c96c6ea1b091de8f5() {
  return __cxx_static_address_837e191c96c6ea1b091de8f5.reference || (__cxx_static_address_837e191c96c6ea1b091de8f5.reference = {
    __cReference: true,
    get value() { return NEON2____header_global_4db63b4f70c350b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:416
export const CACTUSBROKE____header_global_10446af824f61ea8 = ((((((939) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6ec3a3535ac8d084824cac65() {
  return __cxx_static_address_6ec3a3535ac8d084824cac65.reference || (__cxx_static_address_6ec3a3535ac8d084824cac65.reference = {
    __cReference: true,
    get value() { return CACTUSBROKE____header_global_10446af824f61ea8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:417
export const BOUNCEMINE____header_global_6d87be10d67fac69 = ((((((940) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_050245802821d19fe19bb530() {
  return __cxx_static_address_050245802821d19fe19bb530.reference || (__cxx_static_address_050245802821d19fe19bb530.reference = {
    __cReference: true,
    get value() { return BOUNCEMINE____header_global_6d87be10d67fac69; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:418
export const BROKEFIREHYDRENT____header_global_d5290e2486504f17 = ((((((950) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8bb46b223f34c618cc1f2733() {
  return __cxx_static_address_8bb46b223f34c618cc1f2733.reference || (__cxx_static_address_8bb46b223f34c618cc1f2733.reference = {
    __cReference: true,
    get value() { return BROKEFIREHYDRENT____header_global_d5290e2486504f17; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:419
export const BOX____header_global_0faea5be4c1f6408 = ((((((951) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b31d7d4211754c743aed9ef6() {
  return __cxx_static_address_b31d7d4211754c743aed9ef6.reference || (__cxx_static_address_b31d7d4211754c743aed9ef6.reference = {
    __cReference: true,
    get value() { return BOX____header_global_0faea5be4c1f6408; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:420
export const BULLETHOLE____header_global_cfdbd3f125a63b15 = ((((((952) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b3dd2a2c4c93395a8d5dad35() {
  return __cxx_static_address_b3dd2a2c4c93395a8d5dad35.reference || (__cxx_static_address_b3dd2a2c4c93395a8d5dad35.reference = {
    __cReference: true,
    get value() { return BULLETHOLE____header_global_cfdbd3f125a63b15; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:421
export const BOTTLE1____header_global_4b0d4121fa8083b0 = ((((((954) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a3db2c077bf56a5c3c1eeb61() {
  return __cxx_static_address_a3db2c077bf56a5c3c1eeb61.reference || (__cxx_static_address_a3db2c077bf56a5c3c1eeb61.reference = {
    __cReference: true,
    get value() { return BOTTLE1____header_global_4b0d4121fa8083b0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:422
export const BOTTLE2____header_global_f7bfdd4b9d8deb5b = ((((((955) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_39b2473c6de3a642726d6416() {
  return __cxx_static_address_39b2473c6de3a642726d6416.reference || (__cxx_static_address_39b2473c6de3a642726d6416.reference = {
    __cReference: true,
    get value() { return BOTTLE2____header_global_f7bfdd4b9d8deb5b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:423
export const BOTTLE3____header_global_dd62db930ca22f13 = ((((((956) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_513a3aec6fc26eb869118856() {
  return __cxx_static_address_513a3aec6fc26eb869118856.reference || (__cxx_static_address_513a3aec6fc26eb869118856.reference = {
    __cReference: true,
    get value() { return BOTTLE3____header_global_dd62db930ca22f13; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:424
export const BOTTLE4____header_global_a4e326f4b50ab263 = ((((((957) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eb3e7fbdeb457cc827e58e3b() {
  return __cxx_static_address_eb3e7fbdeb457cc827e58e3b.reference || (__cxx_static_address_eb3e7fbdeb457cc827e58e3b.reference = {
    __cReference: true,
    get value() { return BOTTLE4____header_global_a4e326f4b50ab263; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:425
export const FEMPIC5____header_global_8f8dfe6eb13659e5 = ((((((963) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5ed5496cf5db94bf8273d148() {
  return __cxx_static_address_5ed5496cf5db94bf8273d148.reference || (__cxx_static_address_5ed5496cf5db94bf8273d148.reference = {
    __cReference: true,
    get value() { return FEMPIC5____header_global_8f8dfe6eb13659e5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:426
export const FEMPIC6____header_global_38372310e7508b6e = ((((((964) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cf24905fccb1fba86bd17fd0() {
  return __cxx_static_address_cf24905fccb1fba86bd17fd0.reference || (__cxx_static_address_cf24905fccb1fba86bd17fd0.reference = {
    __cReference: true,
    get value() { return FEMPIC6____header_global_38372310e7508b6e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:427
export const FEMPIC7____header_global_5284fc4706eec573 = ((((((965) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_97d657bbbb2f93fff88ada05() {
  return __cxx_static_address_97d657bbbb2f93fff88ada05.reference || (__cxx_static_address_97d657bbbb2f93fff88ada05.reference = {
    __cReference: true,
    get value() { return FEMPIC7____header_global_5284fc4706eec573; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:428
export const HYDROPLANT____header_global_196c290acdbb76ff = ((((((969) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_688e28c9a10fafd48e9e6635() {
  return __cxx_static_address_688e28c9a10fafd48e9e6635.reference || (__cxx_static_address_688e28c9a10fafd48e9e6635.reference = {
    __cReference: true,
    get value() { return HYDROPLANT____header_global_196c290acdbb76ff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:429
export const OCEANSPRITE1____header_global_41a6f994d6773463 = ((((((971) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_132349ec024df5bf71c5e67a() {
  return __cxx_static_address_132349ec024df5bf71c5e67a.reference || (__cxx_static_address_132349ec024df5bf71c5e67a.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE1____header_global_41a6f994d6773463; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:430
export const OCEANSPRITE2____header_global_f263e8602d8da3db = ((((((972) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_972a480fbc18ee07f5b438f4() {
  return __cxx_static_address_972a480fbc18ee07f5b438f4.reference || (__cxx_static_address_972a480fbc18ee07f5b438f4.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE2____header_global_f263e8602d8da3db; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:431
export const OCEANSPRITE3____header_global_e3f096ed5b05747c = ((((((973) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_967e9343bddcd1530e4ecb50() {
  return __cxx_static_address_967e9343bddcd1530e4ecb50.reference || (__cxx_static_address_967e9343bddcd1530e4ecb50.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE3____header_global_e3f096ed5b05747c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:432
export const OCEANSPRITE4____header_global_94437b889b919e4c = ((((((974) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_641b52ce37af0e44feebdedc() {
  return __cxx_static_address_641b52ce37af0e44feebdedc.reference || (__cxx_static_address_641b52ce37af0e44feebdedc.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE4____header_global_94437b889b919e4c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:433
export const OCEANSPRITE5____header_global_bb2a45b62a34c4c7 = ((((((975) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0e41bc79d153547857036800() {
  return __cxx_static_address_0e41bc79d153547857036800.reference || (__cxx_static_address_0e41bc79d153547857036800.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE5____header_global_bb2a45b62a34c4c7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:434
export const GENERICPOLE____header_global_616b807d1f92ebac = ((((((977) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_377cce68659e4720ae2cb892() {
  return __cxx_static_address_377cce68659e4720ae2cb892.reference || (__cxx_static_address_377cce68659e4720ae2cb892.reference = {
    __cReference: true,
    get value() { return GENERICPOLE____header_global_616b807d1f92ebac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:435
export const CONE____header_global_5390172d2d21481e = ((((((978) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_491741d89b3d768807ddbab8() {
  return __cxx_static_address_491741d89b3d768807ddbab8.reference || (__cxx_static_address_491741d89b3d768807ddbab8.reference = {
    __cReference: true,
    get value() { return CONE____header_global_5390172d2d21481e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:436
export const HANGLIGHT____header_global_9ba62c40dbff428b = ((((((979) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dad96fdbae766330ed810418() {
  return __cxx_static_address_dad96fdbae766330ed810418.reference || (__cxx_static_address_dad96fdbae766330ed810418.reference = {
    __cReference: true,
    get value() { return HANGLIGHT____header_global_9ba62c40dbff428b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:437
export const HYDRENT____header_global_a995cde007caca9c = ((((((981) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d8777395b4be2773b3c8d645() {
  return __cxx_static_address_d8777395b4be2773b3c8d645.reference || (__cxx_static_address_d8777395b4be2773b3c8d645.reference = {
    __cReference: true,
    get value() { return HYDRENT____header_global_a995cde007caca9c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:438
export const MASKWALL14____header_global_334b37ea9320ff40 = ((((((988) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cb3fb805d814994512221fc6() {
  return __cxx_static_address_cb3fb805d814994512221fc6.reference || (__cxx_static_address_cb3fb805d814994512221fc6.reference = {
    __cReference: true,
    get value() { return MASKWALL14____header_global_334b37ea9320ff40; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:439
export const TIRE____header_global_856a69cab072af0d = ((((((990) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f2a247b5a488cbc85db40e08() {
  return __cxx_static_address_f2a247b5a488cbc85db40e08.reference || (__cxx_static_address_f2a247b5a488cbc85db40e08.reference = {
    __cReference: true,
    get value() { return TIRE____header_global_856a69cab072af0d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:440
export const PIPE5____header_global_a3afd02c15853815 = ((((((994) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d7792d63cac1e83170882ebf() {
  return __cxx_static_address_d7792d63cac1e83170882ebf.reference || (__cxx_static_address_d7792d63cac1e83170882ebf.reference = {
    __cReference: true,
    get value() { return PIPE5____header_global_a3afd02c15853815; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:441
export const PIPE6____header_global_9608711c3471c3b1 = ((((((995) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_59cc7c714b860119b71bc2af() {
  return __cxx_static_address_59cc7c714b860119b71bc2af.reference || (__cxx_static_address_59cc7c714b860119b71bc2af.reference = {
    __cReference: true,
    get value() { return PIPE6____header_global_9608711c3471c3b1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:442
export const PIPE4____header_global_51263af174b1700b = ((((((996) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_052fa4d7a6d118b0490b7a8a() {
  return __cxx_static_address_052fa4d7a6d118b0490b7a8a.reference || (__cxx_static_address_052fa4d7a6d118b0490b7a8a.reference = {
    __cReference: true,
    get value() { return PIPE4____header_global_51263af174b1700b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:443
export const PIPE4B____header_global_c6f4ed4f6dae1c91 = ((((((997) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c9796d617270baf6518be655() {
  return __cxx_static_address_c9796d617270baf6518be655.reference || (__cxx_static_address_c9796d617270baf6518be655.reference = {
    __cReference: true,
    get value() { return PIPE4B____header_global_c6f4ed4f6dae1c91; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:444
export const BROKEHYDROPLANT____header_global_bed3de00b71a5544 = ((((((1003) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_619fe15285de90b9a57840b1() {
  return __cxx_static_address_619fe15285de90b9a57840b1.reference || (__cxx_static_address_619fe15285de90b9a57840b1.reference = {
    __cReference: true,
    get value() { return BROKEHYDROPLANT____header_global_bed3de00b71a5544; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:445
export const PIPE5B____header_global_e976a1ff5a2e1860 = ((((((1005) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_21c9ef8531634a85814f7450() {
  return __cxx_static_address_21c9ef8531634a85814f7450.reference || (__cxx_static_address_21c9ef8531634a85814f7450.reference = {
    __cReference: true,
    get value() { return PIPE5B____header_global_e976a1ff5a2e1860; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:446
export const NEON3____header_global_dfde40aab33efb63 = ((((((1007) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a948243f164fbbdee4891d2a() {
  return __cxx_static_address_a948243f164fbbdee4891d2a.reference || (__cxx_static_address_a948243f164fbbdee4891d2a.reference = {
    __cReference: true,
    get value() { return NEON3____header_global_dfde40aab33efb63; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:447
export const NEON4____header_global_edacfa2c06bb3c44 = ((((((1008) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bd997d094720ada650bbfdfc() {
  return __cxx_static_address_bd997d094720ada650bbfdfc.reference || (__cxx_static_address_bd997d094720ada650bbfdfc.reference = {
    __cReference: true,
    get value() { return NEON4____header_global_edacfa2c06bb3c44; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:448
export const NEON5____header_global_9a3e3dc1b5799d4b = ((((((1009) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5632c56c1ba90c6db38f5eea() {
  return __cxx_static_address_5632c56c1ba90c6db38f5eea.reference || (__cxx_static_address_5632c56c1ba90c6db38f5eea.reference = {
    __cReference: true,
    get value() { return NEON5____header_global_9a3e3dc1b5799d4b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:449
export const BOTTLE5____header_global_e710e24e505ad6fd = ((((((1012) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a8a07ac5b63b418007bc8da3() {
  return __cxx_static_address_a8a07ac5b63b418007bc8da3.reference || (__cxx_static_address_a8a07ac5b63b418007bc8da3.reference = {
    __cReference: true,
    get value() { return BOTTLE5____header_global_e710e24e505ad6fd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:450
export const BOTTLE6____header_global_97e61a029d2b7c5c = ((((((1013) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b28f4dafd022ce1795b16d44() {
  return __cxx_static_address_b28f4dafd022ce1795b16d44.reference || (__cxx_static_address_b28f4dafd022ce1795b16d44.reference = {
    __cReference: true,
    get value() { return BOTTLE6____header_global_97e61a029d2b7c5c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:451
export const BOTTLE8____header_global_2b5ad47dea110676 = ((((((1014) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1263e49025a0694b076bfcdc() {
  return __cxx_static_address_1263e49025a0694b076bfcdc.reference || (__cxx_static_address_1263e49025a0694b076bfcdc.reference = {
    __cReference: true,
    get value() { return BOTTLE8____header_global_2b5ad47dea110676; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:452
export const SPOTLITE____header_global_95612772f87926ec = ((((((1020) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_905f4a4af200bb322cf96325() {
  return __cxx_static_address_905f4a4af200bb322cf96325.reference || (__cxx_static_address_905f4a4af200bb322cf96325.reference = {
    __cReference: true,
    get value() { return SPOTLITE____header_global_95612772f87926ec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:453
export const MASKWALL15____header_global_34a7a9f6f16d4e65 = ((((((1024) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_628d98e843354ce20fdf8a2a() {
  return __cxx_static_address_628d98e843354ce20fdf8a2a.reference || (__cxx_static_address_628d98e843354ce20fdf8a2a.reference = {
    __cReference: true,
    get value() { return MASKWALL15____header_global_34a7a9f6f16d4e65; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:454
export const BOTTLE7____header_global_28eed68dc768b2fc = ((((((1025) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1c3280105f3577aad9bffec5() {
  return __cxx_static_address_1c3280105f3577aad9bffec5.reference || (__cxx_static_address_1c3280105f3577aad9bffec5.reference = {
    __cReference: true,
    get value() { return BOTTLE7____header_global_28eed68dc768b2fc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:455
export const HORSEONSIDE____header_global_7e415ef802a67072 = ((((((1026) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2da421e4e81fe0ba71f00061() {
  return __cxx_static_address_2da421e4e81fe0ba71f00061.reference || (__cxx_static_address_2da421e4e81fe0ba71f00061.reference = {
    __cReference: true,
    get value() { return HORSEONSIDE____header_global_7e415ef802a67072; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:456
export const GLASSPIECES____header_global_c2a1cbe7905da884 = ((((((1031) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_54ac92e5da37c685737168a5() {
  return __cxx_static_address_54ac92e5da37c685737168a5.reference || (__cxx_static_address_54ac92e5da37c685737168a5.reference = {
    __cReference: true,
    get value() { return GLASSPIECES____header_global_c2a1cbe7905da884; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:457
export const NEON6____header_global_ef98e32256a86704 = ((((((1046) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_beb8410cfeb783f7eaddc588() {
  return __cxx_static_address_beb8410cfeb783f7eaddc588.reference || (__cxx_static_address_beb8410cfeb783f7eaddc588.reference = {
    __cReference: true,
    get value() { return NEON6____header_global_ef98e32256a86704; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:458
export const MASKWALL6____header_global_961edb7bdac3f69e = ((((((1059) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5bd60516adaf56ad1470c1f5() {
  return __cxx_static_address_5bd60516adaf56ad1470c1f5.reference || (__cxx_static_address_5bd60516adaf56ad1470c1f5.reference = {
    __cReference: true,
    get value() { return MASKWALL6____header_global_961edb7bdac3f69e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:459
export const RUBBERCAN____header_global_9ec79d673d379c54 = ((((((1062) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2197c6d7b9e9d56af1a38c6d() {
  return __cxx_static_address_2197c6d7b9e9d56af1a38c6d.reference || (__cxx_static_address_2197c6d7b9e9d56af1a38c6d.reference = {
    __cReference: true,
    get value() { return RUBBERCAN____header_global_9ec79d673d379c54; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:460
export const PLUG____header_global_c52ce94a0740bfcb = ((((((1069) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fc3cf5e851a4587c2b72e0fc() {
  return __cxx_static_address_fc3cf5e851a4587c2b72e0fc.reference || (__cxx_static_address_fc3cf5e851a4587c2b72e0fc.reference = {
    __cReference: true,
    get value() { return PLUG____header_global_c52ce94a0740bfcb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:461
export const OOZFILTER____header_global_97af844dc6aada64 = ((((((1079) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ac318f0c5cb4a01237eccba9() {
  return __cxx_static_address_ac318f0c5cb4a01237eccba9.reference || (__cxx_static_address_ac318f0c5cb4a01237eccba9.reference = {
    __cReference: true,
    get value() { return OOZFILTER____header_global_97af844dc6aada64; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:462
export const FLOORPLASMA____header_global_66b2fc06d8f34a0f = ((((((1082) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a92a7d86f05f947d3216edf0() {
  return __cxx_static_address_a92a7d86f05f947d3216edf0.reference || (__cxx_static_address_a92a7d86f05f947d3216edf0.reference = {
    __cReference: true,
    get value() { return FLOORPLASMA____header_global_66b2fc06d8f34a0f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:463
export const REACTOR____header_global_67ca58b15c6883d5 = ((((((1088) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fe35355ae7ed7d27e3f51d91() {
  return __cxx_static_address_fe35355ae7ed7d27e3f51d91.reference || (__cxx_static_address_fe35355ae7ed7d27e3f51d91.reference = {
    __cReference: true,
    get value() { return REACTOR____header_global_67ca58b15c6883d5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:464
export const REACTORSPARK____header_global_326a97cba72b576a = ((((((1092) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eabaf96d20b84f3cbe6f2634() {
  return __cxx_static_address_eabaf96d20b84f3cbe6f2634.reference || (__cxx_static_address_eabaf96d20b84f3cbe6f2634.reference = {
    __cReference: true,
    get value() { return REACTORSPARK____header_global_326a97cba72b576a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:465
export const REACTORBURNT____header_global_6d9eb64c98e9b60d = ((((((1096) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_031517135cc44f218b562750() {
  return __cxx_static_address_031517135cc44f218b562750.reference || (__cxx_static_address_031517135cc44f218b562750.reference = {
    __cReference: true,
    get value() { return REACTORBURNT____header_global_6d9eb64c98e9b60d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:466
export const DOORTILE15____header_global_aaa511d2a3bfd204 = ((((((1102) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_153638f1a16e19f122e1d19d() {
  return __cxx_static_address_153638f1a16e19f122e1d19d.reference || (__cxx_static_address_153638f1a16e19f122e1d19d.reference = {
    __cReference: true,
    get value() { return DOORTILE15____header_global_aaa511d2a3bfd204; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:467
export const HANDSWITCH____header_global_fd8ed8773581f331 = ((((((1111) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c2f4819ee2c7c1950924966f() {
  return __cxx_static_address_c2f4819ee2c7c1950924966f.reference || (__cxx_static_address_c2f4819ee2c7c1950924966f.reference = {
    __cReference: true,
    get value() { return HANDSWITCH____header_global_fd8ed8773581f331; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:468
export const CIRCLEPANNEL____header_global_66a7dbebc29903d0 = ((((((1113) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e527d36e572e54e6659c767e() {
  return __cxx_static_address_e527d36e572e54e6659c767e.reference || (__cxx_static_address_e527d36e572e54e6659c767e.reference = {
    __cReference: true,
    get value() { return CIRCLEPANNEL____header_global_66a7dbebc29903d0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:469
export const CIRCLEPANNELBROKE____header_global_2f3ba7029d905800 = ((((((1114) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1706fb5235d6cf084b519537() {
  return __cxx_static_address_1706fb5235d6cf084b519537.reference || (__cxx_static_address_1706fb5235d6cf084b519537.reference = {
    __cReference: true,
    get value() { return CIRCLEPANNELBROKE____header_global_2f3ba7029d905800; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:470
export const PULLSWITCH____header_global_a80052e5c36d6ac5 = ((((((1122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a4e9a153b423322e39aea308() {
  return __cxx_static_address_a4e9a153b423322e39aea308.reference || (__cxx_static_address_a4e9a153b423322e39aea308.reference = {
    __cReference: true,
    get value() { return PULLSWITCH____header_global_a80052e5c36d6ac5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:471
export const MASKWALL8____header_global_e1c87ef23fa9716d = ((((((1124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_23641fd34cf0f440b6e3424f() {
  return __cxx_static_address_23641fd34cf0f440b6e3424f.reference || (__cxx_static_address_23641fd34cf0f440b6e3424f.reference = {
    __cReference: true,
    get value() { return MASKWALL8____header_global_e1c87ef23fa9716d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:472
export const BIGHOLE____header_global_ca7c133175c6d9bc = ((((((1141) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2704a53655a021edf35c776d() {
  return __cxx_static_address_2704a53655a021edf35c776d.reference || (__cxx_static_address_2704a53655a021edf35c776d.reference = {
    __cReference: true,
    get value() { return BIGHOLE____header_global_ca7c133175c6d9bc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:473
export const ALIENSWITCH____header_global_800709748bffd477 = ((((((1142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a8a471c43cd459889aa6457b() {
  return __cxx_static_address_a8a471c43cd459889aa6457b.reference || (__cxx_static_address_a8a471c43cd459889aa6457b.reference = {
    __cReference: true,
    get value() { return ALIENSWITCH____header_global_800709748bffd477; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:474
export const DOORTILE21____header_global_630e437812581c0a = ((((((1144) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ae08c594beb2021bcdec93ac() {
  return __cxx_static_address_ae08c594beb2021bcdec93ac.reference || (__cxx_static_address_ae08c594beb2021bcdec93ac.reference = {
    __cReference: true,
    get value() { return DOORTILE21____header_global_630e437812581c0a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:475
export const HANDPRINTSWITCH____header_global_1fa53fb5406b5781 = ((((((1155) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8a98ec711908d8c879d7adf7() {
  return __cxx_static_address_8a98ec711908d8c879d7adf7.reference || (__cxx_static_address_8a98ec711908d8c879d7adf7.reference = {
    __cReference: true,
    get value() { return HANDPRINTSWITCH____header_global_1fa53fb5406b5781; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:476
export const BOTTLE10____header_global_457ed642d8780e8f = ((((((1157) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_63dbf3c6eb9f2a967db55251() {
  return __cxx_static_address_63dbf3c6eb9f2a967db55251.reference || (__cxx_static_address_63dbf3c6eb9f2a967db55251.reference = {
    __cReference: true,
    get value() { return BOTTLE10____header_global_457ed642d8780e8f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:477
export const BOTTLE11____header_global_e40d1a4b6ab71c2f = ((((((1158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_00dfecbe2a710054e9d70ab1() {
  return __cxx_static_address_00dfecbe2a710054e9d70ab1.reference || (__cxx_static_address_00dfecbe2a710054e9d70ab1.reference = {
    __cReference: true,
    get value() { return BOTTLE11____header_global_e40d1a4b6ab71c2f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:478
export const BOTTLE12____header_global_783d2ec7e4c2b311 = ((((((1159) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1c90ebf9decba6dd50f82ca4() {
  return __cxx_static_address_1c90ebf9decba6dd50f82ca4.reference || (__cxx_static_address_1c90ebf9decba6dd50f82ca4.reference = {
    __cReference: true,
    get value() { return BOTTLE12____header_global_783d2ec7e4c2b311; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:479
export const BOTTLE13____header_global_272d9b5e94830b2c = ((((((1160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f0c7454899299d40dac96479() {
  return __cxx_static_address_f0c7454899299d40dac96479.reference || (__cxx_static_address_f0c7454899299d40dac96479.reference = {
    __cReference: true,
    get value() { return BOTTLE13____header_global_272d9b5e94830b2c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:480
export const BOTTLE14____header_global_b7bc8b57de01c4d6 = ((((((1161) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b7738fa03271b309dbf5e193() {
  return __cxx_static_address_b7738fa03271b309dbf5e193.reference || (__cxx_static_address_b7738fa03271b309dbf5e193.reference = {
    __cReference: true,
    get value() { return BOTTLE14____header_global_b7bc8b57de01c4d6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:481
export const BOTTLE15____header_global_c9c7c3b71f0be01b = ((((((1162) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_173b34db466fef39b92241f4() {
  return __cxx_static_address_173b34db466fef39b92241f4.reference || (__cxx_static_address_173b34db466fef39b92241f4.reference = {
    __cReference: true,
    get value() { return BOTTLE15____header_global_c9c7c3b71f0be01b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:482
export const BOTTLE16____header_global_4eab4ea9d978b758 = ((((((1163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0dba409dc4ea89e8f09f40b2() {
  return __cxx_static_address_0dba409dc4ea89e8f09f40b2.reference || (__cxx_static_address_0dba409dc4ea89e8f09f40b2.reference = {
    __cReference: true,
    get value() { return BOTTLE16____header_global_4eab4ea9d978b758; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:483
export const BOTTLE17____header_global_cc96e8278884a1f1 = ((((((1164) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2e77870997f0bcdb2b3331e4() {
  return __cxx_static_address_2e77870997f0bcdb2b3331e4.reference || (__cxx_static_address_2e77870997f0bcdb2b3331e4.reference = {
    __cReference: true,
    get value() { return BOTTLE17____header_global_cc96e8278884a1f1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:484
export const BOTTLE18____header_global_f29aba3ff19da2fd = ((((((1165) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9315dd0651d98247e5ebb57c() {
  return __cxx_static_address_9315dd0651d98247e5ebb57c.reference || (__cxx_static_address_9315dd0651d98247e5ebb57c.reference = {
    __cReference: true,
    get value() { return BOTTLE18____header_global_f29aba3ff19da2fd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:485
export const BOTTLE19____header_global_1465ed124d7ff885 = ((((((1166) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8e8eb945c25c5f9228ded24f() {
  return __cxx_static_address_8e8eb945c25c5f9228ded24f.reference || (__cxx_static_address_8e8eb945c25c5f9228ded24f.reference = {
    __cReference: true,
    get value() { return BOTTLE19____header_global_1465ed124d7ff885; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:486
export const DOORTILE17____header_global_701c1403ee0030f8 = ((((((1169) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f52f182a2c178f058ca148af() {
  return __cxx_static_address_f52f182a2c178f058ca148af.reference || (__cxx_static_address_f52f182a2c178f058ca148af.reference = {
    __cReference: true,
    get value() { return DOORTILE17____header_global_701c1403ee0030f8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:487
export const MASKWALL7____header_global_36a1e7cb5c94f5b9 = ((((((1174) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_befa55351331039afa0f10ce() {
  return __cxx_static_address_befa55351331039afa0f10ce.reference || (__cxx_static_address_befa55351331039afa0f10ce.reference = {
    __cReference: true,
    get value() { return MASKWALL7____header_global_36a1e7cb5c94f5b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:488
export const DOORTILE11____header_global_965cf728f9679ca8 = ((((((1178) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_032b92547af5ddaa8d2532ca() {
  return __cxx_static_address_032b92547af5ddaa8d2532ca.reference || (__cxx_static_address_032b92547af5ddaa8d2532ca.reference = {
    __cReference: true,
    get value() { return DOORTILE11____header_global_965cf728f9679ca8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:489
export const DOORTILE12____header_global_48059e7da798b765 = ((((((1179) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b5be051a4c0758bd28d84f49() {
  return __cxx_static_address_b5be051a4c0758bd28d84f49.reference || (__cxx_static_address_b5be051a4c0758bd28d84f49.reference = {
    __cReference: true,
    get value() { return DOORTILE12____header_global_48059e7da798b765; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:490
export const VENDMACHINE____header_global_52d0ec408abdb53a = ((((((1212) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_db9562fd99e38eb23f2a7f2f() {
  return __cxx_static_address_db9562fd99e38eb23f2a7f2f.reference || (__cxx_static_address_db9562fd99e38eb23f2a7f2f.reference = {
    __cReference: true,
    get value() { return VENDMACHINE____header_global_52d0ec408abdb53a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:491
export const COLAMACHINE____header_global_a749eb18238d8587 = ((((((1215) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0bff78d03f45220ecce4791e() {
  return __cxx_static_address_0bff78d03f45220ecce4791e.reference || (__cxx_static_address_0bff78d03f45220ecce4791e.reference = {
    __cReference: true,
    get value() { return COLAMACHINE____header_global_a749eb18238d8587; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:492
export const CRANEPOLE____header_global_c629962e8f7cc481 = ((((((1221) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ba07bcbe22d23de4b4a44bd6() {
  return __cxx_static_address_ba07bcbe22d23de4b4a44bd6.reference || (__cxx_static_address_ba07bcbe22d23de4b4a44bd6.reference = {
    __cReference: true,
    get value() { return CRANEPOLE____header_global_c629962e8f7cc481; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:493
export const CRANE____header_global_0c5f90686d527451 = ((((((1222) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_12d32ac8238df3c04615cd40() {
  return __cxx_static_address_12d32ac8238df3c04615cd40.reference || (__cxx_static_address_12d32ac8238df3c04615cd40.reference = {
    __cReference: true,
    get value() { return CRANE____header_global_0c5f90686d527451; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:494
export const BARBROKE____header_global_11c878c38f97cf5d = ((((((1225) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3019e367a906d9e0558d62ef() {
  return __cxx_static_address_3019e367a906d9e0558d62ef.reference || (__cxx_static_address_3019e367a906d9e0558d62ef.reference = {
    __cReference: true,
    get value() { return BARBROKE____header_global_11c878c38f97cf5d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:495
export const BLOODPOOL____header_global_1897355f231a433b = ((((((1226) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_53ab1e644614e4050661b175() {
  return __cxx_static_address_53ab1e644614e4050661b175.reference || (__cxx_static_address_53ab1e644614e4050661b175.reference = {
    __cReference: true,
    get value() { return BLOODPOOL____header_global_1897355f231a433b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:496
export const NUKEBARREL____header_global_d1338fff8a274980 = ((((((1227) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f7b60619c7ca5924bea71f50() {
  return __cxx_static_address_f7b60619c7ca5924bea71f50.reference || (__cxx_static_address_f7b60619c7ca5924bea71f50.reference = {
    __cReference: true,
    get value() { return NUKEBARREL____header_global_d1338fff8a274980; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:497
export const NUKEBARRELDENTED____header_global_5e9bd79d68bd5fb8 = ((((((1228) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a6f952526a3c73c25108ef99() {
  return __cxx_static_address_a6f952526a3c73c25108ef99.reference || (__cxx_static_address_a6f952526a3c73c25108ef99.reference = {
    __cReference: true,
    get value() { return NUKEBARRELDENTED____header_global_5e9bd79d68bd5fb8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:498
export const NUKEBARRELLEAKED____header_global_54cec1be70198cb3 = ((((((1229) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_974d5b3c07d4a32ba5cbeda1() {
  return __cxx_static_address_974d5b3c07d4a32ba5cbeda1.reference || (__cxx_static_address_974d5b3c07d4a32ba5cbeda1.reference = {
    __cReference: true,
    get value() { return NUKEBARRELLEAKED____header_global_54cec1be70198cb3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:499
export const CANWITHSOMETHING____header_global_6ce74642ab48b520 = ((((((1232) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f5403d7a856bedfddcedfd48() {
  return __cxx_static_address_f5403d7a856bedfddcedfd48.reference || (__cxx_static_address_f5403d7a856bedfddcedfd48.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING____header_global_6ce74642ab48b520; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:500
export const MONEY____header_global_711f3ece67a41045 = ((((((1233) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e8c97aa3ab733b89d0e82c0a() {
  return __cxx_static_address_e8c97aa3ab733b89d0e82c0a.reference || (__cxx_static_address_e8c97aa3ab733b89d0e82c0a.reference = {
    __cReference: true,
    get value() { return MONEY____header_global_711f3ece67a41045; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:501
export const BANNER____header_global_244d5e5091747148 = ((((((1236) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_391947b951f887de48f19e0d() {
  return __cxx_static_address_391947b951f887de48f19e0d.reference || (__cxx_static_address_391947b951f887de48f19e0d.reference = {
    __cReference: true,
    get value() { return BANNER____header_global_244d5e5091747148; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:502
export const EXPLODINGBARREL____header_global_4fc0be8e084695c8 = ((((((1238) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0c6a5b09cca782332bcee8ea() {
  return __cxx_static_address_0c6a5b09cca782332bcee8ea.reference || (__cxx_static_address_0c6a5b09cca782332bcee8ea.reference = {
    __cReference: true,
    get value() { return EXPLODINGBARREL____header_global_4fc0be8e084695c8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:503
export const EXPLODINGBARREL2____header_global_a5b999082ab42178 = ((((((1239) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cc1d16e63b370a2284acc20b() {
  return __cxx_static_address_cc1d16e63b370a2284acc20b.reference || (__cxx_static_address_cc1d16e63b370a2284acc20b.reference = {
    __cReference: true,
    get value() { return EXPLODINGBARREL2____header_global_a5b999082ab42178; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:504
export const FIREBARREL____header_global_521d2d176164a319 = ((((((1240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2409721cb31e0ce813ff636e() {
  return __cxx_static_address_2409721cb31e0ce813ff636e.reference || (__cxx_static_address_2409721cb31e0ce813ff636e.reference = {
    __cReference: true,
    get value() { return FIREBARREL____header_global_521d2d176164a319; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:505
export const SEENINE____header_global_4f5122fa935e9300 = ((((((1247) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2fe5a903a452015a2fb4e9dd() {
  return __cxx_static_address_2fe5a903a452015a2fb4e9dd.reference || (__cxx_static_address_2fe5a903a452015a2fb4e9dd.reference = {
    __cReference: true,
    get value() { return SEENINE____header_global_4f5122fa935e9300; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:506
export const SEENINEDEAD____header_global_031326f2a3a30f2e = ((((((1248) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_49280caa1431a8c023d87904() {
  return __cxx_static_address_49280caa1431a8c023d87904.reference || (__cxx_static_address_49280caa1431a8c023d87904.reference = {
    __cReference: true,
    get value() { return SEENINEDEAD____header_global_031326f2a3a30f2e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:507
export const STEAM____header_global_91d0359315350f5a = ((((((1250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_83372405bedce1e0966842d7() {
  return __cxx_static_address_83372405bedce1e0966842d7.reference || (__cxx_static_address_83372405bedce1e0966842d7.reference = {
    __cReference: true,
    get value() { return STEAM____header_global_91d0359315350f5a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:508
export const CEILINGSTEAM____header_global_aaa215ede4be3e2b = ((((((1255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_75480d725ca63653aced23ec() {
  return __cxx_static_address_75480d725ca63653aced23ec.reference || (__cxx_static_address_75480d725ca63653aced23ec.reference = {
    __cReference: true,
    get value() { return CEILINGSTEAM____header_global_aaa215ede4be3e2b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:509
export const PIPE6B____header_global_72af1317b447ab08 = ((((((1260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_35ab11eaae8e8806708609e7() {
  return __cxx_static_address_35ab11eaae8e8806708609e7.reference || (__cxx_static_address_35ab11eaae8e8806708609e7.reference = {
    __cReference: true,
    get value() { return PIPE6B____header_global_72af1317b447ab08; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:510
export const TRANSPORTERBEAM____header_global_0ecc46c06feeaf00 = ((((((1261) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e8b67c2fe828b51179231c02() {
  return __cxx_static_address_e8b67c2fe828b51179231c02.reference || (__cxx_static_address_e8b67c2fe828b51179231c02.reference = {
    __cReference: true,
    get value() { return TRANSPORTERBEAM____header_global_0ecc46c06feeaf00; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:511
export const RAT____header_global_1803cd338c13aa7e = ((((((1267) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_941898e5bb3d3101613937e4() {
  return __cxx_static_address_941898e5bb3d3101613937e4.reference || (__cxx_static_address_941898e5bb3d3101613937e4.reference = {
    __cReference: true,
    get value() { return RAT____header_global_1803cd338c13aa7e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:512
export const TRASH____header_global_6f525df951759b9a = ((((((1272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c58181bddd122e9302906e28() {
  return __cxx_static_address_c58181bddd122e9302906e28.reference || (__cxx_static_address_c58181bddd122e9302906e28.reference = {
    __cReference: true,
    get value() { return TRASH____header_global_6f525df951759b9a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:513
export const FEMPIC1____header_global_615b93b68e45cb2d = ((((((1280) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d33fac0606a6ab1c66f7f5f4() {
  return __cxx_static_address_d33fac0606a6ab1c66f7f5f4.reference || (__cxx_static_address_d33fac0606a6ab1c66f7f5f4.reference = {
    __cReference: true,
    get value() { return FEMPIC1____header_global_615b93b68e45cb2d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:514
export const FEMPIC2____header_global_337463beb38348f6 = ((((((1289) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_77824b5401a444386c3821ee() {
  return __cxx_static_address_77824b5401a444386c3821ee.reference || (__cxx_static_address_77824b5401a444386c3821ee.reference = {
    __cReference: true,
    get value() { return FEMPIC2____header_global_337463beb38348f6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:515
export const BLANKSCREEN____header_global_b508f3ad9a8b57dd = ((((((1293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b13441bda078389b07b3de1e() {
  return __cxx_static_address_b13441bda078389b07b3de1e.reference || (__cxx_static_address_b13441bda078389b07b3de1e.reference = {
    __cReference: true,
    get value() { return BLANKSCREEN____header_global_b508f3ad9a8b57dd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:516
export const PODFEM1____header_global_275199c8f0367597 = ((((((1294) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bbfef008a62c740f651d8a3b() {
  return __cxx_static_address_bbfef008a62c740f651d8a3b.reference || (__cxx_static_address_bbfef008a62c740f651d8a3b.reference = {
    __cReference: true,
    get value() { return PODFEM1____header_global_275199c8f0367597; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:517
export const FEMPIC3____header_global_43289d37e516b3c4 = ((((((1298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1a140fc3b2d44959a559da10() {
  return __cxx_static_address_1a140fc3b2d44959a559da10.reference || (__cxx_static_address_1a140fc3b2d44959a559da10.reference = {
    __cReference: true,
    get value() { return FEMPIC3____header_global_43289d37e516b3c4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:518
export const FEMPIC4____header_global_612f0dd01ba4e8e0 = ((((((1306) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b80ed11e35140322b2605f34() {
  return __cxx_static_address_b80ed11e35140322b2605f34.reference || (__cxx_static_address_b80ed11e35140322b2605f34.reference = {
    __cReference: true,
    get value() { return FEMPIC4____header_global_612f0dd01ba4e8e0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:519
export const FEM1____header_global_2ce92ae5045db6f8 = ((((((1312) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_40af4ca0bcebc4b5d9635cdd() {
  return __cxx_static_address_40af4ca0bcebc4b5d9635cdd.reference || (__cxx_static_address_40af4ca0bcebc4b5d9635cdd.reference = {
    __cReference: true,
    get value() { return FEM1____header_global_2ce92ae5045db6f8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:520
export const FEM2____header_global_0785e1449b2c8a9f = ((((((1317) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2070a6da7c1cdeeaf39d9c3a() {
  return __cxx_static_address_2070a6da7c1cdeeaf39d9c3a.reference || (__cxx_static_address_2070a6da7c1cdeeaf39d9c3a.reference = {
    __cReference: true,
    get value() { return FEM2____header_global_0785e1449b2c8a9f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:521
export const FEM3____header_global_194a10f063b39d49 = ((((((1321) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a1fbfa55cb52b718b2f73d4d() {
  return __cxx_static_address_a1fbfa55cb52b718b2f73d4d.reference || (__cxx_static_address_a1fbfa55cb52b718b2f73d4d.reference = {
    __cReference: true,
    get value() { return FEM3____header_global_194a10f063b39d49; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:522
export const FEM5____header_global_2a1b58475ef07034 = ((((((1323) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2c36055db187d04cb9766404() {
  return __cxx_static_address_2c36055db187d04cb9766404.reference || (__cxx_static_address_2c36055db187d04cb9766404.reference = {
    __cReference: true,
    get value() { return FEM5____header_global_2a1b58475ef07034; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:523
export const BLOODYPOLE____header_global_41f31466ca6dbd95 = ((((((1324) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c106d9d8fa40bd920a57957a() {
  return __cxx_static_address_c106d9d8fa40bd920a57957a.reference || (__cxx_static_address_c106d9d8fa40bd920a57957a.reference = {
    __cReference: true,
    get value() { return BLOODYPOLE____header_global_41f31466ca6dbd95; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:524
export const FEM4____header_global_095b284e5104abed = ((((((1325) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1bdc50c59849242e9dfe6f81() {
  return __cxx_static_address_1bdc50c59849242e9dfe6f81.reference || (__cxx_static_address_1bdc50c59849242e9dfe6f81.reference = {
    __cReference: true,
    get value() { return FEM4____header_global_095b284e5104abed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:525
export const FEM6____header_global_0763b42f8f3a46c3 = ((((((1334) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2d0a7e699dbc26c841197460() {
  return __cxx_static_address_2d0a7e699dbc26c841197460.reference || (__cxx_static_address_2d0a7e699dbc26c841197460.reference = {
    __cReference: true,
    get value() { return FEM6____header_global_0763b42f8f3a46c3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:526
export const FEM6PAD____header_global_fb661fe97e84c2b1 = ((((((1335) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6477adeaf6b9bb7e81342bc2() {
  return __cxx_static_address_6477adeaf6b9bb7e81342bc2.reference || (__cxx_static_address_6477adeaf6b9bb7e81342bc2.reference = {
    __cReference: true,
    get value() { return FEM6PAD____header_global_fb661fe97e84c2b1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:527
export const FEM8____header_global_9f6e2a62525ab23f = ((((((1336) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_81ec95a37a60b720bc561ff8() {
  return __cxx_static_address_81ec95a37a60b720bc561ff8.reference || (__cxx_static_address_81ec95a37a60b720bc561ff8.reference = {
    __cReference: true,
    get value() { return FEM8____header_global_9f6e2a62525ab23f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:528
export const HELECOPT____header_global_b1d8d7933f72b260 = ((((((1346) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dcf0b242212d5477095c56f3() {
  return __cxx_static_address_dcf0b242212d5477095c56f3.reference || (__cxx_static_address_dcf0b242212d5477095c56f3.reference = {
    __cReference: true,
    get value() { return HELECOPT____header_global_b1d8d7933f72b260; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:529
export const FETUSJIB____header_global_5254cd9a12760500 = ((((((1347) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_925c0585d599910d1ee1a11d() {
  return __cxx_static_address_925c0585d599910d1ee1a11d.reference || (__cxx_static_address_925c0585d599910d1ee1a11d.reference = {
    __cReference: true,
    get value() { return FETUSJIB____header_global_5254cd9a12760500; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:530
export const HOLODUKE____header_global_76ec0e8abc461937 = ((((((1348) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c9824378b38a4d90966630b2() {
  return __cxx_static_address_c9824378b38a4d90966630b2.reference || (__cxx_static_address_c9824378b38a4d90966630b2.reference = {
    __cReference: true,
    get value() { return HOLODUKE____header_global_76ec0e8abc461937; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:531
export const SPACEMARINE____header_global_b2ebd4bbe5f0815b = ((((((1353) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0805b1554ca12191aa75dfa2() {
  return __cxx_static_address_0805b1554ca12191aa75dfa2.reference || (__cxx_static_address_0805b1554ca12191aa75dfa2.reference = {
    __cReference: true,
    get value() { return SPACEMARINE____header_global_b2ebd4bbe5f0815b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:532
export const INDY____header_global_18ca2919fedbaca0 = ((((((1355) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_30b6f9ae031447314bd6e441() {
  return __cxx_static_address_30b6f9ae031447314bd6e441.reference || (__cxx_static_address_30b6f9ae031447314bd6e441.reference = {
    __cReference: true,
    get value() { return INDY____header_global_18ca2919fedbaca0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:533
export const FETUS____header_global_f714a0dab78bcbcc = ((((((1358) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9c696139bf600bdeb44cea26() {
  return __cxx_static_address_9c696139bf600bdeb44cea26.reference || (__cxx_static_address_9c696139bf600bdeb44cea26.reference = {
    __cReference: true,
    get value() { return FETUS____header_global_f714a0dab78bcbcc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:534
export const FETUSBROKE____header_global_4a1ce68fe4ae30a3 = ((((((1359) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7d5b98f0f8bc25f9bba0376b() {
  return __cxx_static_address_7d5b98f0f8bc25f9bba0376b.reference || (__cxx_static_address_7d5b98f0f8bc25f9bba0376b.reference = {
    __cReference: true,
    get value() { return FETUSBROKE____header_global_4a1ce68fe4ae30a3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:535
export const MONK____header_global_34b9b3e634350b13 = ((((((1352) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bbfdf2d31043e4533aae3230() {
  return __cxx_static_address_bbfdf2d31043e4533aae3230.reference || (__cxx_static_address_bbfdf2d31043e4533aae3230.reference = {
    __cReference: true,
    get value() { return MONK____header_global_34b9b3e634350b13; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:536
export const LUKE____header_global_3700962d31dcbb82 = ((((((1354) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0d6412bf55cacbad78456fe2() {
  return __cxx_static_address_0d6412bf55cacbad78456fe2.reference || (__cxx_static_address_0d6412bf55cacbad78456fe2.reference = {
    __cReference: true,
    get value() { return LUKE____header_global_3700962d31dcbb82; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:537
export const COOLEXPLOSION1____header_global_e5289c1fe6d5b072 = ((((((1360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_04343d126fadafe586352858() {
  return __cxx_static_address_04343d126fadafe586352858.reference || (__cxx_static_address_04343d126fadafe586352858.reference = {
    __cReference: true,
    get value() { return COOLEXPLOSION1____header_global_e5289c1fe6d5b072; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:538
export const WATERSPLASH2____header_global_d6c45dea2a930767 = ((((((1380) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_82c74effa62d714642a8227b() {
  return __cxx_static_address_82c74effa62d714642a8227b.reference || (__cxx_static_address_82c74effa62d714642a8227b.reference = {
    __cReference: true,
    get value() { return WATERSPLASH2____header_global_d6c45dea2a930767; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:539
export const FIREVASE____header_global_599ad6a6c9417bb1 = ((((((1390) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7e90c3b6c4f2e12436bf2dd8() {
  return __cxx_static_address_7e90c3b6c4f2e12436bf2dd8.reference || (__cxx_static_address_7e90c3b6c4f2e12436bf2dd8.reference = {
    __cReference: true,
    get value() { return FIREVASE____header_global_599ad6a6c9417bb1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:540
export const FEM7____header_global_f5c4ccb20bd9a5f8 = ((((((1395) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5fdb974657cffe35f5c308d2() {
  return __cxx_static_address_5fdb974657cffe35f5c308d2.reference || (__cxx_static_address_5fdb974657cffe35f5c308d2.reference = {
    __cReference: true,
    get value() { return FEM7____header_global_f5c4ccb20bd9a5f8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:541
export const APLAYERTOP____header_global_b099ba83164c8658 = ((((((1400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c8eba7439460cf8b4b13fa07() {
  return __cxx_static_address_c8eba7439460cf8b4b13fa07.reference || (__cxx_static_address_c8eba7439460cf8b4b13fa07.reference = {
    __cReference: true,
    get value() { return APLAYERTOP____header_global_b099ba83164c8658; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:542
export const APLAYER____header_global_af8380f35b7f28c9 = ((((((1405) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8c43980f9438ed29fc177c62() {
  return __cxx_static_address_8c43980f9438ed29fc177c62.reference || (__cxx_static_address_8c43980f9438ed29fc177c62.reference = {
    __cReference: true,
    get value() { return APLAYER____header_global_af8380f35b7f28c9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:543
export const PLAYERONWATER____header_global_cb9d4ecf338c3b2e = ((((((1420) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6fb4c92562f860091d83d880() {
  return __cxx_static_address_6fb4c92562f860091d83d880.reference || (__cxx_static_address_6fb4c92562f860091d83d880.reference = {
    __cReference: true,
    get value() { return PLAYERONWATER____header_global_cb9d4ecf338c3b2e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:544
export const DUKELYINGDEAD____header_global_8fc0a1c25f213f8a = ((((((1518) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ddc6f868d52095ad24c38ec5() {
  return __cxx_static_address_ddc6f868d52095ad24c38ec5.reference || (__cxx_static_address_ddc6f868d52095ad24c38ec5.reference = {
    __cReference: true,
    get value() { return DUKELYINGDEAD____header_global_8fc0a1c25f213f8a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:545
export const DUKETORSO____header_global_00e7e4b4b9427c43 = ((((((1520) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9b800121ce36a8f41f15187a() {
  return __cxx_static_address_9b800121ce36a8f41f15187a.reference || (__cxx_static_address_9b800121ce36a8f41f15187a.reference = {
    __cReference: true,
    get value() { return DUKETORSO____header_global_00e7e4b4b9427c43; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:546
export const DUKEGUN____header_global_2babc11be7455ccf = ((((((1528) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a94013735c36a8040dfada1a() {
  return __cxx_static_address_a94013735c36a8040dfada1a.reference || (__cxx_static_address_a94013735c36a8040dfada1a.reference = {
    __cReference: true,
    get value() { return DUKEGUN____header_global_2babc11be7455ccf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:547
export const DUKELEG____header_global_e65a56b803542147 = ((((((1536) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e40490b41b7a6c943da43681() {
  return __cxx_static_address_e40490b41b7a6c943da43681.reference || (__cxx_static_address_e40490b41b7a6c943da43681.reference = {
    __cReference: true,
    get value() { return DUKELEG____header_global_e65a56b803542147; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:548
export const SHARK____header_global_131c136b97029aa9 = ((((((1550) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a9acea214182c1dd52e56e6f() {
  return __cxx_static_address_a9acea214182c1dd52e56e6f.reference || (__cxx_static_address_a9acea214182c1dd52e56e6f.reference = {
    __cReference: true,
    get value() { return SHARK____header_global_131c136b97029aa9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:549
export const BLOOD____header_global_fee4f1f9de7f31f9 = ((((((1620) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0772f846a6587598624803d7() {
  return __cxx_static_address_0772f846a6587598624803d7.reference || (__cxx_static_address_0772f846a6587598624803d7.reference = {
    __cReference: true,
    get value() { return BLOOD____header_global_fee4f1f9de7f31f9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:550
export const FIRELASER____header_global_e56c1eacb54a36af = ((((((1625) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_65ea6e33f4603ea813912aec() {
  return __cxx_static_address_65ea6e33f4603ea813912aec.reference || (__cxx_static_address_65ea6e33f4603ea813912aec.reference = {
    __cReference: true,
    get value() { return FIRELASER____header_global_e56c1eacb54a36af; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:551
export const TRANSPORTERSTAR____header_global_264fe2667fee81bb = ((((((1630) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fe5718ed49ac68cde732dd72() {
  return __cxx_static_address_fe5718ed49ac68cde732dd72.reference || (__cxx_static_address_fe5718ed49ac68cde732dd72.reference = {
    __cReference: true,
    get value() { return TRANSPORTERSTAR____header_global_264fe2667fee81bb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:552
export const SPIT____header_global_77ce79cf1b46c71b = ((((((1636) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d33ff8d0a94b9764652c1fa7() {
  return __cxx_static_address_d33ff8d0a94b9764652c1fa7.reference || (__cxx_static_address_d33ff8d0a94b9764652c1fa7.reference = {
    __cReference: true,
    get value() { return SPIT____header_global_77ce79cf1b46c71b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:553
export const LOOGIE____header_global_1c2002d9722057d8 = ((((((1637) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a25bd47398e59becf519f90f() {
  return __cxx_static_address_a25bd47398e59becf519f90f.reference || (__cxx_static_address_a25bd47398e59becf519f90f.reference = {
    __cReference: true,
    get value() { return LOOGIE____header_global_1c2002d9722057d8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:554
export const FIST____header_global_0b04f1ec2f00ee08 = ((((((1640) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6ff8e20b6e33dcc5e2d1d67f() {
  return __cxx_static_address_6ff8e20b6e33dcc5e2d1d67f.reference || (__cxx_static_address_6ff8e20b6e33dcc5e2d1d67f.reference = {
    __cReference: true,
    get value() { return FIST____header_global_0b04f1ec2f00ee08; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:555
export const FREEZEBLAST____header_global_b4d752f13fd3db51 = ((((((1641) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5c75534da4bdca7214955890() {
  return __cxx_static_address_5c75534da4bdca7214955890.reference || (__cxx_static_address_5c75534da4bdca7214955890.reference = {
    __cReference: true,
    get value() { return FREEZEBLAST____header_global_b4d752f13fd3db51; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:556
export const SHRINKSPARK____header_global_f39a2b2300416351 = ((((((1646) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8214683749535bdb6622cc48() {
  return __cxx_static_address_8214683749535bdb6622cc48.reference || (__cxx_static_address_8214683749535bdb6622cc48.reference = {
    __cReference: true,
    get value() { return SHRINKSPARK____header_global_f39a2b2300416351; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:557
export const TONGUE____header_global_46df7610d0f3d50c = ((((((1647) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_30a5ba20b6c9905a73de42e1() {
  return __cxx_static_address_30a5ba20b6c9905a73de42e1.reference || (__cxx_static_address_30a5ba20b6c9905a73de42e1.reference = {
    __cReference: true,
    get value() { return TONGUE____header_global_46df7610d0f3d50c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:558
export const MORTER____header_global_cd3549f2268ad0e9 = ((((((1650) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7d91cf4f505313970426ddf4() {
  return __cxx_static_address_7d91cf4f505313970426ddf4.reference || (__cxx_static_address_7d91cf4f505313970426ddf4.reference = {
    __cReference: true,
    get value() { return MORTER____header_global_cd3549f2268ad0e9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:559
export const SHRINKEREXPLOSION____header_global_4ab4df82deee296c = ((((((1656) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4b71a3638a49712885a996a3() {
  return __cxx_static_address_4b71a3638a49712885a996a3.reference || (__cxx_static_address_4b71a3638a49712885a996a3.reference = {
    __cReference: true,
    get value() { return SHRINKEREXPLOSION____header_global_4ab4df82deee296c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:560
export const RADIUSEXPLOSION____header_global_57c30dd674186c8f = ((((((1670) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_74d451d632ff12c829183714() {
  return __cxx_static_address_74d451d632ff12c829183714.reference || (__cxx_static_address_74d451d632ff12c829183714.reference = {
    __cReference: true,
    get value() { return RADIUSEXPLOSION____header_global_57c30dd674186c8f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:561
export const FORCERIPPLE____header_global_8a14801cb2164e15 = ((((((1671) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_60e4fc071e537559ec99b8e8() {
  return __cxx_static_address_60e4fc071e537559ec99b8e8.reference || (__cxx_static_address_60e4fc071e537559ec99b8e8.reference = {
    __cReference: true,
    get value() { return FORCERIPPLE____header_global_8a14801cb2164e15; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:562
export const LIZTROOP____header_global_6f6581e12ff427d2 = ((((((1680) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_16473593f8647c3268cf0b6e() {
  return __cxx_static_address_16473593f8647c3268cf0b6e.reference || (__cxx_static_address_16473593f8647c3268cf0b6e.reference = {
    __cReference: true,
    get value() { return LIZTROOP____header_global_6f6581e12ff427d2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:563
export const LIZTROOPRUNNING____header_global_858bc52d29c9c88b = ((((((1681) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c153f159aad6c034cadf46be() {
  return __cxx_static_address_c153f159aad6c034cadf46be.reference || (__cxx_static_address_c153f159aad6c034cadf46be.reference = {
    __cReference: true,
    get value() { return LIZTROOPRUNNING____header_global_858bc52d29c9c88b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:564
export const LIZTROOPSTAYPUT____header_global_36cc5c1e012c0daa = ((((((1682) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1df204cb5a492141f1b2b97a() {
  return __cxx_static_address_1df204cb5a492141f1b2b97a.reference || (__cxx_static_address_1df204cb5a492141f1b2b97a.reference = {
    __cReference: true,
    get value() { return LIZTROOPSTAYPUT____header_global_36cc5c1e012c0daa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:565
export const LIZTROOPSHOOT____header_global_b180b2da898eb013 = ((((((1715) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fcde2b56e9e468e27143b284() {
  return __cxx_static_address_fcde2b56e9e468e27143b284.reference || (__cxx_static_address_fcde2b56e9e468e27143b284.reference = {
    __cReference: true,
    get value() { return LIZTROOPSHOOT____header_global_b180b2da898eb013; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:566
export const LIZTROOPJETPACK____header_global_8b3d945a55302bac = ((((((1725) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2be528f05b4187a55fce7c4c() {
  return __cxx_static_address_2be528f05b4187a55fce7c4c.reference || (__cxx_static_address_2be528f05b4187a55fce7c4c.reference = {
    __cReference: true,
    get value() { return LIZTROOPJETPACK____header_global_8b3d945a55302bac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:567
export const LIZTROOPONTOILET____header_global_34762c6f849acefd = ((((((1741) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_85e60c1852e1668b5f85703d() {
  return __cxx_static_address_85e60c1852e1668b5f85703d.reference || (__cxx_static_address_85e60c1852e1668b5f85703d.reference = {
    __cReference: true,
    get value() { return LIZTROOPONTOILET____header_global_34762c6f849acefd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:568
export const LIZTROOPJUSTSIT____header_global_3169e44355b1e7c6 = ((((((1742) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_840fd1fa44bac31f5eba70c9() {
  return __cxx_static_address_840fd1fa44bac31f5eba70c9.reference || (__cxx_static_address_840fd1fa44bac31f5eba70c9.reference = {
    __cReference: true,
    get value() { return LIZTROOPJUSTSIT____header_global_3169e44355b1e7c6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:569
export const LIZTROOPDUCKING____header_global_50da0e703d0f0840 = ((((((1744) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_84ebfcd74f733fb06be3aff1() {
  return __cxx_static_address_84ebfcd74f733fb06be3aff1.reference || (__cxx_static_address_84ebfcd74f733fb06be3aff1.reference = {
    __cReference: true,
    get value() { return LIZTROOPDUCKING____header_global_50da0e703d0f0840; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:570
export const HEADJIB1____header_global_40bd20dce92c1478 = ((((((1768) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9c1b5c53d0147656ac3063de() {
  return __cxx_static_address_9c1b5c53d0147656ac3063de.reference || (__cxx_static_address_9c1b5c53d0147656ac3063de.reference = {
    __cReference: true,
    get value() { return HEADJIB1____header_global_40bd20dce92c1478; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:571
export const ARMJIB1____header_global_22daf8941f5611d9 = ((((((1772) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fcce570997ae03ad78981f68() {
  return __cxx_static_address_fcce570997ae03ad78981f68.reference || (__cxx_static_address_fcce570997ae03ad78981f68.reference = {
    __cReference: true,
    get value() { return ARMJIB1____header_global_22daf8941f5611d9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:572
export const LEGJIB1____header_global_5781c7f5039c8827 = ((((((1776) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d167750739c481396543e8f8() {
  return __cxx_static_address_d167750739c481396543e8f8.reference || (__cxx_static_address_d167750739c481396543e8f8.reference = {
    __cReference: true,
    get value() { return LEGJIB1____header_global_5781c7f5039c8827; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:573
export const OCTABRAIN____header_global_113e72f464a2f72c = ((((((1820) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_401999381d6c648e47d0d873() {
  return __cxx_static_address_401999381d6c648e47d0d873.reference || (__cxx_static_address_401999381d6c648e47d0d873.reference = {
    __cReference: true,
    get value() { return OCTABRAIN____header_global_113e72f464a2f72c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:574
export const OCTABRAINSTAYPUT____header_global_b842021aacc39664 = ((((((1821) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ab9032239bc774a291a2764a() {
  return __cxx_static_address_ab9032239bc774a291a2764a.reference || (__cxx_static_address_ab9032239bc774a291a2764a.reference = {
    __cReference: true,
    get value() { return OCTABRAINSTAYPUT____header_global_b842021aacc39664; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:575
export const INNERJAW____header_global_f97d75111f24e424 = ((((((1860) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_638db843bd5fbf883a5febd2() {
  return __cxx_static_address_638db843bd5fbf883a5febd2.reference || (__cxx_static_address_638db843bd5fbf883a5febd2.reference = {
    __cReference: true,
    get value() { return INNERJAW____header_global_f97d75111f24e424; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:576
export const DRONE____header_global_9e74a2e9cc099d5c = ((((((1880) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_57f584a17b582be13677abad() {
  return __cxx_static_address_57f584a17b582be13677abad.reference || (__cxx_static_address_57f584a17b582be13677abad.reference = {
    __cReference: true,
    get value() { return DRONE____header_global_9e74a2e9cc099d5c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:577
export const EXPLOSION2____header_global_00ad30ea7eecc375 = ((((((1890) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d8f8339b38f49e84144b6282() {
  return __cxx_static_address_d8f8339b38f49e84144b6282.reference || (__cxx_static_address_d8f8339b38f49e84144b6282.reference = {
    __cReference: true,
    get value() { return EXPLOSION2____header_global_00ad30ea7eecc375; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:578
export const COMMANDER____header_global_79c1b57e70d03a0c = ((((((1920) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d7f24dfcd22d76de1b56793a() {
  return __cxx_static_address_d7f24dfcd22d76de1b56793a.reference || (__cxx_static_address_d7f24dfcd22d76de1b56793a.reference = {
    __cReference: true,
    get value() { return COMMANDER____header_global_79c1b57e70d03a0c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:579
export const COMMANDERSTAYPUT____header_global_e4a0cb71e33a3c09 = ((((((1921) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d736c205fb9ccff232837699() {
  return __cxx_static_address_d736c205fb9ccff232837699.reference || (__cxx_static_address_d736c205fb9ccff232837699.reference = {
    __cReference: true,
    get value() { return COMMANDERSTAYPUT____header_global_e4a0cb71e33a3c09; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:580
export const RECON____header_global_f506259a03e4b4d4 = ((((((1960) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8451e63b667dc84134ae2946() {
  return __cxx_static_address_8451e63b667dc84134ae2946.reference || (__cxx_static_address_8451e63b667dc84134ae2946.reference = {
    __cReference: true,
    get value() { return RECON____header_global_f506259a03e4b4d4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:581
export const TANK____header_global_fb5d657f0daf4919 = ((((((1975) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ea38aa00d60969a7bd462fed() {
  return __cxx_static_address_ea38aa00d60969a7bd462fed.reference || (__cxx_static_address_ea38aa00d60969a7bd462fed.reference = {
    __cReference: true,
    get value() { return TANK____header_global_fb5d657f0daf4919; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:582
export const PIGCOP____header_global_21d9fb2c79fb353c = ((((((2000) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d42d8ddb7c1aab03bebb52f9() {
  return __cxx_static_address_d42d8ddb7c1aab03bebb52f9.reference || (__cxx_static_address_d42d8ddb7c1aab03bebb52f9.reference = {
    __cReference: true,
    get value() { return PIGCOP____header_global_21d9fb2c79fb353c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:583
export const PIGCOPSTAYPUT____header_global_c76b2bdd327fa890 = ((((((2001) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eaaf9dbcc7b8669f06c62bdc() {
  return __cxx_static_address_eaaf9dbcc7b8669f06c62bdc.reference || (__cxx_static_address_eaaf9dbcc7b8669f06c62bdc.reference = {
    __cReference: true,
    get value() { return PIGCOPSTAYPUT____header_global_c76b2bdd327fa890; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:584
export const PIGCOPDIVE____header_global_cbe76b5a7137bfc8 = ((((((2045) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9ca4407ae778f42317b38200() {
  return __cxx_static_address_9ca4407ae778f42317b38200.reference || (__cxx_static_address_9ca4407ae778f42317b38200.reference = {
    __cReference: true,
    get value() { return PIGCOPDIVE____header_global_cbe76b5a7137bfc8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:585
export const LIZMAN____header_global_7f7276aa96dbd214 = ((((((2120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_200ac6f33fa03b3b57a4811c() {
  return __cxx_static_address_200ac6f33fa03b3b57a4811c.reference || (__cxx_static_address_200ac6f33fa03b3b57a4811c.reference = {
    __cReference: true,
    get value() { return LIZMAN____header_global_7f7276aa96dbd214; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:586
export const LIZMANSTAYPUT____header_global_4945a854963e4b29 = ((((((2121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_859100b41e7ba3291617ccd6() {
  return __cxx_static_address_859100b41e7ba3291617ccd6.reference || (__cxx_static_address_859100b41e7ba3291617ccd6.reference = {
    __cReference: true,
    get value() { return LIZMANSTAYPUT____header_global_4945a854963e4b29; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:587
export const LIZMANSPITTING____header_global_f3a8fcc73b92bf98 = ((((((2150) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e59b5c314d5a784d159e6948() {
  return __cxx_static_address_e59b5c314d5a784d159e6948.reference || (__cxx_static_address_e59b5c314d5a784d159e6948.reference = {
    __cReference: true,
    get value() { return LIZMANSPITTING____header_global_f3a8fcc73b92bf98; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:588
export const LIZMANFEEDING____header_global_523510a6b485a7ee = ((((((2160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1a8957c69a179d4f8d41638a() {
  return __cxx_static_address_1a8957c69a179d4f8d41638a.reference || (__cxx_static_address_1a8957c69a179d4f8d41638a.reference = {
    __cReference: true,
    get value() { return LIZMANFEEDING____header_global_523510a6b485a7ee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:589
export const LIZMANJUMP____header_global_b6202606a25db799 = ((((((2165) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_553725ac078e7969e2daa59d() {
  return __cxx_static_address_553725ac078e7969e2daa59d.reference || (__cxx_static_address_553725ac078e7969e2daa59d.reference = {
    __cReference: true,
    get value() { return LIZMANJUMP____header_global_b6202606a25db799; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:590
export const FECES____header_global_edb5ad91eb0ef427 = ((((((2200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_09ca8f90e2203924c3ced725() {
  return __cxx_static_address_09ca8f90e2203924c3ced725.reference || (__cxx_static_address_09ca8f90e2203924c3ced725.reference = {
    __cReference: true,
    get value() { return FECES____header_global_edb5ad91eb0ef427; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:591
export const LIZMANHEAD1____header_global_93ac9f94240fb16a = ((((((2201) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_08a89ac94bdd1061dc76324b() {
  return __cxx_static_address_08a89ac94bdd1061dc76324b.reference || (__cxx_static_address_08a89ac94bdd1061dc76324b.reference = {
    __cReference: true,
    get value() { return LIZMANHEAD1____header_global_93ac9f94240fb16a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:592
export const LIZMANARM1____header_global_dc379a9a3d23ee52 = ((((((2205) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f9453ef6ed91006b77ad48b4() {
  return __cxx_static_address_f9453ef6ed91006b77ad48b4.reference || (__cxx_static_address_f9453ef6ed91006b77ad48b4.reference = {
    __cReference: true,
    get value() { return LIZMANARM1____header_global_dc379a9a3d23ee52; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:593
export const LIZMANLEG1____header_global_ca2f75e69044bcf0 = ((((((2209) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dd6bdc7ef5984b71bd1a1cde() {
  return __cxx_static_address_dd6bdc7ef5984b71bd1a1cde.reference || (__cxx_static_address_dd6bdc7ef5984b71bd1a1cde.reference = {
    __cReference: true,
    get value() { return LIZMANLEG1____header_global_ca2f75e69044bcf0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:594
export const EXPLOSION2BOT____header_global_d858e981c6724722 = ((((((2219) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f57bb7d2b20ce034b4743d6b() {
  return __cxx_static_address_f57bb7d2b20ce034b4743d6b.reference || (__cxx_static_address_f57bb7d2b20ce034b4743d6b.reference = {
    __cReference: true,
    get value() { return EXPLOSION2BOT____header_global_d858e981c6724722; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:595
export const JIBS1____header_global_d9fe243ccf3d21a1 = ((((((2245) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_236cd70333af388e84e4727e() {
  return __cxx_static_address_236cd70333af388e84e4727e.reference || (__cxx_static_address_236cd70333af388e84e4727e.reference = {
    __cReference: true,
    get value() { return JIBS1____header_global_d9fe243ccf3d21a1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:596
export const JIBS2____header_global_8dc7a2ea7388f75d = ((((((2250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e36dfbcdadf901e4bb3e138() {
  return __cxx_static_address_1e36dfbcdadf901e4bb3e138.reference || (__cxx_static_address_1e36dfbcdadf901e4bb3e138.reference = {
    __cReference: true,
    get value() { return JIBS2____header_global_8dc7a2ea7388f75d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:597
export const JIBS3____header_global_a5cc32ccbca39a26 = ((((((2255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a7f2d6cd41c269644ea9aec2() {
  return __cxx_static_address_a7f2d6cd41c269644ea9aec2.reference || (__cxx_static_address_a7f2d6cd41c269644ea9aec2.reference = {
    __cReference: true,
    get value() { return JIBS3____header_global_a5cc32ccbca39a26; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:598
export const JIBS4____header_global_e7d7b12f73b038f9 = ((((((2260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d27122981a1ba7b124e52965() {
  return __cxx_static_address_d27122981a1ba7b124e52965.reference || (__cxx_static_address_d27122981a1ba7b124e52965.reference = {
    __cReference: true,
    get value() { return JIBS4____header_global_e7d7b12f73b038f9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:599
export const JIBS5____header_global_eee029bb4ad69ea0 = ((((((2265) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_72bba94a5f265f6b95181eee() {
  return __cxx_static_address_72bba94a5f265f6b95181eee.reference || (__cxx_static_address_72bba94a5f265f6b95181eee.reference = {
    __cReference: true,
    get value() { return JIBS5____header_global_eee029bb4ad69ea0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:600
export const BURNING____header_global_acf304e38502df5e = ((((((2270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_726affc4059d8dd8b5e422c4() {
  return __cxx_static_address_726affc4059d8dd8b5e422c4.reference || (__cxx_static_address_726affc4059d8dd8b5e422c4.reference = {
    __cReference: true,
    get value() { return BURNING____header_global_acf304e38502df5e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:601
export const FIRE____header_global_e6538e83e135db18 = ((((((2271) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_488a2db78f2cdf450447f4a9() {
  return __cxx_static_address_488a2db78f2cdf450447f4a9.reference || (__cxx_static_address_488a2db78f2cdf450447f4a9.reference = {
    __cReference: true,
    get value() { return FIRE____header_global_e6538e83e135db18; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:602
export const JIBS6____header_global_b02ceeab146f385d = ((((((2286) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_738bcb9cf4b7ff4455aedd9f() {
  return __cxx_static_address_738bcb9cf4b7ff4455aedd9f.reference || (__cxx_static_address_738bcb9cf4b7ff4455aedd9f.reference = {
    __cReference: true,
    get value() { return JIBS6____header_global_b02ceeab146f385d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:603
export const BLOODSPLAT1____header_global_26299e0f14505171 = ((((((2296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5dcf71cb9c04c8f1bd3576e6() {
  return __cxx_static_address_5dcf71cb9c04c8f1bd3576e6.reference || (__cxx_static_address_5dcf71cb9c04c8f1bd3576e6.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT1____header_global_26299e0f14505171; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:604
export const BLOODSPLAT3____header_global_885fb10c958774f1 = ((((((2297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bdfb3eb07011f8f5269471e7() {
  return __cxx_static_address_bdfb3eb07011f8f5269471e7.reference || (__cxx_static_address_bdfb3eb07011f8f5269471e7.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT3____header_global_885fb10c958774f1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:605
export const BLOODSPLAT2____header_global_d56a71a7417efbce = ((((((2298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_560422b0dc87962c631da132() {
  return __cxx_static_address_560422b0dc87962c631da132.reference || (__cxx_static_address_560422b0dc87962c631da132.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT2____header_global_d56a71a7417efbce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:606
export const BLOODSPLAT4____header_global_99c420efe78d80ed = ((((((2299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2dea9e9d56d865aa4d288c24() {
  return __cxx_static_address_2dea9e9d56d865aa4d288c24.reference || (__cxx_static_address_2dea9e9d56d865aa4d288c24.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT4____header_global_99c420efe78d80ed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:607
export const OOZ____header_global_d96bff8a2529aa39 = ((((((2300) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_405cd5e59faf146a2c14d96b() {
  return __cxx_static_address_405cd5e59faf146a2c14d96b.reference || (__cxx_static_address_405cd5e59faf146a2c14d96b.reference = {
    __cReference: true,
    get value() { return OOZ____header_global_d96bff8a2529aa39; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:608
export const OOZ2____header_global_d85bad78db1e636b = ((((((2309) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_13858f4b83156c699f7d2f68() {
  return __cxx_static_address_13858f4b83156c699f7d2f68.reference || (__cxx_static_address_13858f4b83156c699f7d2f68.reference = {
    __cReference: true,
    get value() { return OOZ2____header_global_d85bad78db1e636b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:609
export const WALLBLOOD1____header_global_a05695378024fac5 = ((((((2301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f1db8a33228a9516c7000854() {
  return __cxx_static_address_f1db8a33228a9516c7000854.reference || (__cxx_static_address_f1db8a33228a9516c7000854.reference = {
    __cReference: true,
    get value() { return WALLBLOOD1____header_global_a05695378024fac5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:610
export const WALLBLOOD2____header_global_0341776705bb488c = ((((((2302) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7295d6b2a7b30d4621acd1bc() {
  return __cxx_static_address_7295d6b2a7b30d4621acd1bc.reference || (__cxx_static_address_7295d6b2a7b30d4621acd1bc.reference = {
    __cReference: true,
    get value() { return WALLBLOOD2____header_global_0341776705bb488c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:611
export const WALLBLOOD3____header_global_ad544289fbf01e38 = ((((((2303) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_304e3f47adca7c6aa97f4615() {
  return __cxx_static_address_304e3f47adca7c6aa97f4615.reference || (__cxx_static_address_304e3f47adca7c6aa97f4615.reference = {
    __cReference: true,
    get value() { return WALLBLOOD3____header_global_ad544289fbf01e38; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:612
export const WALLBLOOD4____header_global_9f63d6a40234f712 = ((((((2304) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4561edd89c0d9f1d883434d7() {
  return __cxx_static_address_4561edd89c0d9f1d883434d7.reference || (__cxx_static_address_4561edd89c0d9f1d883434d7.reference = {
    __cReference: true,
    get value() { return WALLBLOOD4____header_global_9f63d6a40234f712; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:613
export const WALLBLOOD5____header_global_4e92506da13f7662 = ((((((2305) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f53426510a549ce78fb67ca4() {
  return __cxx_static_address_f53426510a549ce78fb67ca4.reference || (__cxx_static_address_f53426510a549ce78fb67ca4.reference = {
    __cReference: true,
    get value() { return WALLBLOOD5____header_global_4e92506da13f7662; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:614
export const WALLBLOOD7____header_global_6071ea35586c85b7 = ((((((2307) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_74e85cd3140d4ef3368367f2() {
  return __cxx_static_address_74e85cd3140d4ef3368367f2.reference || (__cxx_static_address_74e85cd3140d4ef3368367f2.reference = {
    __cReference: true,
    get value() { return WALLBLOOD7____header_global_6071ea35586c85b7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:615
export const WALLBLOOD8____header_global_3b2900929aa1b2ff = ((((((2308) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_81359ee2821c535f81447f02() {
  return __cxx_static_address_81359ee2821c535f81447f02.reference || (__cxx_static_address_81359ee2821c535f81447f02.reference = {
    __cReference: true,
    get value() { return WALLBLOOD8____header_global_3b2900929aa1b2ff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:616
export const BURNING2____header_global_bc1078976732cc8f = ((((((2310) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9100de49f6274d979a48166c() {
  return __cxx_static_address_9100de49f6274d979a48166c.reference || (__cxx_static_address_9100de49f6274d979a48166c.reference = {
    __cReference: true,
    get value() { return BURNING2____header_global_bc1078976732cc8f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:617
export const FIRE2____header_global_14f12ca9cabf9731 = ((((((2311) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_00a9f377ec13d1c1b5ea86bb() {
  return __cxx_static_address_00a9f377ec13d1c1b5ea86bb.reference || (__cxx_static_address_00a9f377ec13d1c1b5ea86bb.reference = {
    __cReference: true,
    get value() { return FIRE2____header_global_14f12ca9cabf9731; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:618
export const CRACKKNUCKLES____header_global_dcd4417e41d24499 = ((((((2324) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cdf0c9501bc9b1ba73cfbf33() {
  return __cxx_static_address_cdf0c9501bc9b1ba73cfbf33.reference || (__cxx_static_address_cdf0c9501bc9b1ba73cfbf33.reference = {
    __cReference: true,
    get value() { return CRACKKNUCKLES____header_global_dcd4417e41d24499; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:619
export const SMALLSMOKE____header_global_28278a7c9c4b7e14 = ((((((2329) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9ad58d1e93dfb4988d3f0f9b() {
  return __cxx_static_address_9ad58d1e93dfb4988d3f0f9b.reference || (__cxx_static_address_9ad58d1e93dfb4988d3f0f9b.reference = {
    __cReference: true,
    get value() { return SMALLSMOKE____header_global_28278a7c9c4b7e14; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:620
export const FLOORFLAME____header_global_415ea442b00f8af2 = ((((((2333) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_88a1c361a97cbda7cf3727bb() {
  return __cxx_static_address_88a1c361a97cbda7cf3727bb.reference || (__cxx_static_address_88a1c361a97cbda7cf3727bb.reference = {
    __cReference: true,
    get value() { return FLOORFLAME____header_global_415ea442b00f8af2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:621
export const ROTATEGUN____header_global_f76880349c4b0bd9 = ((((((2360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8f1e1c5555b751aab8b25529() {
  return __cxx_static_address_8f1e1c5555b751aab8b25529.reference || (__cxx_static_address_8f1e1c5555b751aab8b25529.reference = {
    __cReference: true,
    get value() { return ROTATEGUN____header_global_f76880349c4b0bd9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:622
export const GREENSLIME____header_global_337602771f7272fb = ((((((2370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d80c3269d9a5c837790013cc() {
  return __cxx_static_address_d80c3269d9a5c837790013cc.reference || (__cxx_static_address_d80c3269d9a5c837790013cc.reference = {
    __cReference: true,
    get value() { return GREENSLIME____header_global_337602771f7272fb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:623
export const WATERDRIPSPLASH____header_global_5c5e28c874f13337 = ((((((2380) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1dc974c950065a728eafe5c7() {
  return __cxx_static_address_1dc974c950065a728eafe5c7.reference || (__cxx_static_address_1dc974c950065a728eafe5c7.reference = {
    __cReference: true,
    get value() { return WATERDRIPSPLASH____header_global_5c5e28c874f13337; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:624
export const SCRAP6____header_global_2b08fefc7f6ec85d = ((((((2390) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9e6c4bee0cbe4a33a490b01f() {
  return __cxx_static_address_9e6c4bee0cbe4a33a490b01f.reference || (__cxx_static_address_9e6c4bee0cbe4a33a490b01f.reference = {
    __cReference: true,
    get value() { return SCRAP6____header_global_2b08fefc7f6ec85d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:625
export const SCRAP1____header_global_32ca95109042ea15 = ((((((2400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2c28b5893589da32c74c5e86() {
  return __cxx_static_address_2c28b5893589da32c74c5e86.reference || (__cxx_static_address_2c28b5893589da32c74c5e86.reference = {
    __cReference: true,
    get value() { return SCRAP1____header_global_32ca95109042ea15; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:626
export const SCRAP2____header_global_199fc606ed146ad9 = ((((((2404) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6d0419b59e8482c3b311864c() {
  return __cxx_static_address_6d0419b59e8482c3b311864c.reference || (__cxx_static_address_6d0419b59e8482c3b311864c.reference = {
    __cReference: true,
    get value() { return SCRAP2____header_global_199fc606ed146ad9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:627
export const SCRAP3____header_global_0d3a450ee91f1c60 = ((((((2408) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0d2c83c6ca7539355885817a() {
  return __cxx_static_address_0d2c83c6ca7539355885817a.reference || (__cxx_static_address_0d2c83c6ca7539355885817a.reference = {
    __cReference: true,
    get value() { return SCRAP3____header_global_0d3a450ee91f1c60; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:628
export const SCRAP4____header_global_9a3b84750c79722d = ((((((2412) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0198722f3f59104462384732() {
  return __cxx_static_address_0198722f3f59104462384732.reference || (__cxx_static_address_0198722f3f59104462384732.reference = {
    __cReference: true,
    get value() { return SCRAP4____header_global_9a3b84750c79722d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:629
export const SCRAP5____header_global_709ea911a71d956e = ((((((2416) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cc969dd30c4adaa20062b64e() {
  return __cxx_static_address_cc969dd30c4adaa20062b64e.reference || (__cxx_static_address_cc969dd30c4adaa20062b64e.reference = {
    __cReference: true,
    get value() { return SCRAP5____header_global_709ea911a71d956e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:630
export const ORGANTIC____header_global_3c1fcb14d6ee2f68 = ((((((2420) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_374114eaea101f2d081492b2() {
  return __cxx_static_address_374114eaea101f2d081492b2.reference || (__cxx_static_address_374114eaea101f2d081492b2.reference = {
    __cReference: true,
    get value() { return ORGANTIC____header_global_3c1fcb14d6ee2f68; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:631
export const BETAVERSION____header_global_0bcb32403abdc4da = ((((((2440) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b373560d627c4f250ed98e3d() {
  return __cxx_static_address_b373560d627c4f250ed98e3d.reference || (__cxx_static_address_b373560d627c4f250ed98e3d.reference = {
    __cReference: true,
    get value() { return BETAVERSION____header_global_0bcb32403abdc4da; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:632
export const SELECTDIR____header_global_5f1d82e6f80c26e6 = ((((((2444) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_37c70495a0c4bdaa3ecb7323() {
  return __cxx_static_address_37c70495a0c4bdaa3ecb7323.reference || (__cxx_static_address_37c70495a0c4bdaa3ecb7323.reference = {
    __cReference: true,
    get value() { return SELECTDIR____header_global_5f1d82e6f80c26e6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:633
export const F1HELP____header_global_2bf7474034f671db = ((((((2445) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_29657c0ecccc42eb86846dfb() {
  return __cxx_static_address_29657c0ecccc42eb86846dfb.reference || (__cxx_static_address_29657c0ecccc42eb86846dfb.reference = {
    __cReference: true,
    get value() { return F1HELP____header_global_2bf7474034f671db; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:634
export const GROWSPARK____header_global_53eca5ea49df21ce = ((((((2448) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_938eeb99d3a31c594519032d() {
  return __cxx_static_address_938eeb99d3a31c594519032d.reference || (__cxx_static_address_938eeb99d3a31c594519032d.reference = {
    __cReference: true,
    get value() { return GROWSPARK____header_global_53eca5ea49df21ce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:635
export const MENUSCREEN____header_global_d89f4b42c72f8919 = ((((((2456) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_478f465a3e57d42be3d2ceae() {
  return __cxx_static_address_478f465a3e57d42be3d2ceae.reference || (__cxx_static_address_478f465a3e57d42be3d2ceae.reference = {
    __cReference: true,
    get value() { return MENUSCREEN____header_global_d89f4b42c72f8919; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:636
export const MENUBAR____header_global_3bd3738404c343fb = ((((((2457) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_69cf4f105273f9c80b03b749() {
  return __cxx_static_address_69cf4f105273f9c80b03b749.reference || (__cxx_static_address_69cf4f105273f9c80b03b749.reference = {
    __cReference: true,
    get value() { return MENUBAR____header_global_3bd3738404c343fb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:637
export const KILLSICON____header_global_7540cc0579e07407 = ((((((2458) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8b056747dadf91075267dbda() {
  return __cxx_static_address_8b056747dadf91075267dbda.reference || (__cxx_static_address_8b056747dadf91075267dbda.reference = {
    __cReference: true,
    get value() { return KILLSICON____header_global_7540cc0579e07407; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:638
export const FIRSTAID_ICON____header_global_391216f1fdf36b05 = ((((((2460) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cad67a2a036487315555160a() {
  return __cxx_static_address_cad67a2a036487315555160a.reference || (__cxx_static_address_cad67a2a036487315555160a.reference = {
    __cReference: true,
    get value() { return FIRSTAID_ICON____header_global_391216f1fdf36b05; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:639
export const HEAT_ICON____header_global_9fb9b6197e09387a = ((((((2461) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_50e8301a8f7a908950a3810b() {
  return __cxx_static_address_50e8301a8f7a908950a3810b.reference || (__cxx_static_address_50e8301a8f7a908950a3810b.reference = {
    __cReference: true,
    get value() { return HEAT_ICON____header_global_9fb9b6197e09387a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:640
export const BOTTOMSTATUSBAR____header_global_20099d87749a61a6 = ((((((2462) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4564ad83d361bbbe931fca0d() {
  return __cxx_static_address_4564ad83d361bbbe931fca0d.reference || (__cxx_static_address_4564ad83d361bbbe931fca0d.reference = {
    __cReference: true,
    get value() { return BOTTOMSTATUSBAR____header_global_20099d87749a61a6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:641
export const BOOT_ICON____header_global_f8f58c1d915786e7 = ((((((2463) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6828212b86580f7ed0cf993e() {
  return __cxx_static_address_6828212b86580f7ed0cf993e.reference || (__cxx_static_address_6828212b86580f7ed0cf993e.reference = {
    __cReference: true,
    get value() { return BOOT_ICON____header_global_f8f58c1d915786e7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:642
export const FRAGBAR____header_global_2f01e1298d5ab011 = ((((((2465) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ac273ef1c5a42746ba7d375a() {
  return __cxx_static_address_ac273ef1c5a42746ba7d375a.reference || (__cxx_static_address_ac273ef1c5a42746ba7d375a.reference = {
    __cReference: true,
    get value() { return FRAGBAR____header_global_2f01e1298d5ab011; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:643
export const JETPACK_ICON____header_global_b0f39f1afe0942fc = ((((((2467) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_292f25ac72e48275fadc1e99() {
  return __cxx_static_address_292f25ac72e48275fadc1e99.reference || (__cxx_static_address_292f25ac72e48275fadc1e99.reference = {
    __cReference: true,
    get value() { return JETPACK_ICON____header_global_b0f39f1afe0942fc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:644
export const AIRTANK_ICON____header_global_95e7800be2932d30 = ((((((2468) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9abec18c11b449f9abc84122() {
  return __cxx_static_address_9abec18c11b449f9abc84122.reference || (__cxx_static_address_9abec18c11b449f9abc84122.reference = {
    __cReference: true,
    get value() { return AIRTANK_ICON____header_global_95e7800be2932d30; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:645
export const STEROIDS_ICON____header_global_1c1f7b144b90d119 = ((((((2469) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_313e1e9a2508a4e70c7e76ee() {
  return __cxx_static_address_313e1e9a2508a4e70c7e76ee.reference || (__cxx_static_address_313e1e9a2508a4e70c7e76ee.reference = {
    __cReference: true,
    get value() { return STEROIDS_ICON____header_global_1c1f7b144b90d119; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:646
export const HOLODUKE_ICON____header_global_4e18f7dfdc4d195b = ((((((2470) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3c7431eea51c78399d55bb82() {
  return __cxx_static_address_3c7431eea51c78399d55bb82.reference || (__cxx_static_address_3c7431eea51c78399d55bb82.reference = {
    __cReference: true,
    get value() { return HOLODUKE_ICON____header_global_4e18f7dfdc4d195b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:647
export const ACCESS_ICON____header_global_b1ed1e0467f23243 = ((((((2471) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_24b9ee1b5d2cd5ff781f1498() {
  return __cxx_static_address_24b9ee1b5d2cd5ff781f1498.reference || (__cxx_static_address_24b9ee1b5d2cd5ff781f1498.reference = {
    __cReference: true,
    get value() { return ACCESS_ICON____header_global_b1ed1e0467f23243; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:648
export const DIGITALNUM____header_global_6151d89aa55b6b85 = ((((((2472) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c81019df147728f597841fd4() {
  return __cxx_static_address_c81019df147728f597841fd4.reference || (__cxx_static_address_c81019df147728f597841fd4.reference = {
    __cReference: true,
    get value() { return DIGITALNUM____header_global_6151d89aa55b6b85; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:649
export const DUKECAR____header_global_d3c40cf51e818dd4 = ((((((2491) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_47dc7b066d29eecf061fe362() {
  return __cxx_static_address_47dc7b066d29eecf061fe362.reference || (__cxx_static_address_47dc7b066d29eecf061fe362.reference = {
    __cReference: true,
    get value() { return DUKECAR____header_global_d3c40cf51e818dd4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:650
export const CAMCORNER____header_global_9891e60ec329686f = ((((((2482) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7bc0a098ada0020da9342a7a() {
  return __cxx_static_address_7bc0a098ada0020da9342a7a.reference || (__cxx_static_address_7bc0a098ada0020da9342a7a.reference = {
    __cReference: true,
    get value() { return CAMCORNER____header_global_9891e60ec329686f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:651
export const CAMLIGHT____header_global_37aa4dc389839028 = ((((((2484) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_02d79ab8e6cb72e6e57ab235() {
  return __cxx_static_address_02d79ab8e6cb72e6e57ab235.reference || (__cxx_static_address_02d79ab8e6cb72e6e57ab235.reference = {
    __cReference: true,
    get value() { return CAMLIGHT____header_global_37aa4dc389839028; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:652
export const SLIDEBAR____header_global_b0313975887a8f7c = ((((((2489) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9b45cdaef22afcd786d3c2fc() {
  return __cxx_static_address_9b45cdaef22afcd786d3c2fc.reference || (__cxx_static_address_9b45cdaef22afcd786d3c2fc.reference = {
    __cReference: true,
    get value() { return SLIDEBAR____header_global_b0313975887a8f7c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:653
export const DREALMS____header_global_134fa8591884465e = ((((((2492) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0ecbc016bd00f7a8d13d7953() {
  return __cxx_static_address_0ecbc016bd00f7a8d13d7953.reference || (__cxx_static_address_0ecbc016bd00f7a8d13d7953.reference = {
    __cReference: true,
    get value() { return DREALMS____header_global_134fa8591884465e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:654
export const BETASCREEN____header_global_d6fe171c217825dd = ((((((2493) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3bcefe2a9ae777a8716e652b() {
  return __cxx_static_address_3bcefe2a9ae777a8716e652b.reference || (__cxx_static_address_3bcefe2a9ae777a8716e652b.reference = {
    __cReference: true,
    get value() { return BETASCREEN____header_global_d6fe171c217825dd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:655
export const WINDOWBORDER1____header_global_93d480f7167e5eae = ((((((2494) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_23d79f94bdec443b5978c165() {
  return __cxx_static_address_23d79f94bdec443b5978c165.reference || (__cxx_static_address_23d79f94bdec443b5978c165.reference = {
    __cReference: true,
    get value() { return WINDOWBORDER1____header_global_93d480f7167e5eae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:656
export const TEXTBOX____header_global_eb9547216504f751 = ((((((2495) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_07031ffca557bb1ab7239428() {
  return __cxx_static_address_07031ffca557bb1ab7239428.reference || (__cxx_static_address_07031ffca557bb1ab7239428.reference = {
    __cReference: true,
    get value() { return TEXTBOX____header_global_eb9547216504f751; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:657
export const WINDOWBORDER2____header_global_335cad220f86e052 = ((((((2496) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_edb0a066082e219b9d29e112() {
  return __cxx_static_address_edb0a066082e219b9d29e112.reference || (__cxx_static_address_edb0a066082e219b9d29e112.reference = {
    __cReference: true,
    get value() { return WINDOWBORDER2____header_global_335cad220f86e052; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:658
export const DUKENUKEM____header_global_0e89998369cb36cd = ((((((2497) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3a891d0ba8621af0ee6baa49() {
  return __cxx_static_address_3a891d0ba8621af0ee6baa49.reference || (__cxx_static_address_3a891d0ba8621af0ee6baa49.reference = {
    __cReference: true,
    get value() { return DUKENUKEM____header_global_0e89998369cb36cd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:659
export const THREEDEE____header_global_72f2e27716ae5aa6 = ((((((2498) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ef82a503c512a07c3785fac0() {
  return __cxx_static_address_ef82a503c512a07c3785fac0.reference || (__cxx_static_address_ef82a503c512a07c3785fac0.reference = {
    __cReference: true,
    get value() { return THREEDEE____header_global_72f2e27716ae5aa6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:660
export const INGAMEDUKETHREEDEE____header_global_dac8012d2bfbdf95 = ((((((2499) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4a7fd849633afab8ff6dc72f() {
  return __cxx_static_address_4a7fd849633afab8ff6dc72f.reference || (__cxx_static_address_4a7fd849633afab8ff6dc72f.reference = {
    __cReference: true,
    get value() { return INGAMEDUKETHREEDEE____header_global_dac8012d2bfbdf95; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:661
export const TENSCREEN____header_global_6084895e517086bf = ((((((2500) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b51fe2153f99b2dad6994e28() {
  return __cxx_static_address_b51fe2153f99b2dad6994e28.reference || (__cxx_static_address_b51fe2153f99b2dad6994e28.reference = {
    __cReference: true,
    get value() { return TENSCREEN____header_global_6084895e517086bf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:662
export const PLUTOPAKSPRITE____header_global_dcd7ab7948277f68 = ((((((2501) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_184c6533e6ac4e8264243756() {
  return __cxx_static_address_184c6533e6ac4e8264243756.reference || (__cxx_static_address_184c6533e6ac4e8264243756.reference = {
    __cReference: true,
    get value() { return PLUTOPAKSPRITE____header_global_dcd7ab7948277f68; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:663
export const DEVISTATOR____header_global_01f903b7b8df8f64 = ((((((2510) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8cd5aba49d05ac160c5d5380() {
  return __cxx_static_address_8cd5aba49d05ac160c5d5380.reference || (__cxx_static_address_8cd5aba49d05ac160c5d5380.reference = {
    __cReference: true,
    get value() { return DEVISTATOR____header_global_01f903b7b8df8f64; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:664
export const KNEE____header_global_3065bc40f54a3967 = ((((((2521) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_07a7cadaaecceba4221e9aad() {
  return __cxx_static_address_07a7cadaaecceba4221e9aad.reference || (__cxx_static_address_07a7cadaaecceba4221e9aad.reference = {
    __cReference: true,
    get value() { return KNEE____header_global_3065bc40f54a3967; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:665
export const CROSSHAIR____header_global_03eb39560ad9c67c = ((((((2523) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_becd7eddf83f65ecf81045a4() {
  return __cxx_static_address_becd7eddf83f65ecf81045a4.reference || (__cxx_static_address_becd7eddf83f65ecf81045a4.reference = {
    __cReference: true,
    get value() { return CROSSHAIR____header_global_03eb39560ad9c67c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:666
export const FIRSTGUN____header_global_a30405c3c13627d0 = ((((((2524) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_97d6d3766754641ef6dfb4b8() {
  return __cxx_static_address_97d6d3766754641ef6dfb4b8.reference || (__cxx_static_address_97d6d3766754641ef6dfb4b8.reference = {
    __cReference: true,
    get value() { return FIRSTGUN____header_global_a30405c3c13627d0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:667
export const FIRSTGUNRELOAD____header_global_d5f5c12507c03d18 = ((((((2528) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c0e9b5886d06eed515a9760a() {
  return __cxx_static_address_c0e9b5886d06eed515a9760a.reference || (__cxx_static_address_c0e9b5886d06eed515a9760a.reference = {
    __cReference: true,
    get value() { return FIRSTGUNRELOAD____header_global_d5f5c12507c03d18; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:668
export const SHELL____header_global_37719d175ca6baa6 = ((((((2533) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7d7cd814ada0c5b8f2bc708a() {
  return __cxx_static_address_7d7cd814ada0c5b8f2bc708a.reference || (__cxx_static_address_7d7cd814ada0c5b8f2bc708a.reference = {
    __cReference: true,
    get value() { return SHELL____header_global_37719d175ca6baa6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:669
export const SHOTGUNSHELL____header_global_09c0bcd42be26da6 = ((((((2535) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6a5f30062a8a1486a2ca50a8() {
  return __cxx_static_address_6a5f30062a8a1486a2ca50a8.reference || (__cxx_static_address_6a5f30062a8a1486a2ca50a8.reference = {
    __cReference: true,
    get value() { return SHOTGUNSHELL____header_global_09c0bcd42be26da6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:670
export const CHAINGUN____header_global_7f26c95267b7a14a = ((((((2536) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5d2a492d5e7b313af6d03689() {
  return __cxx_static_address_5d2a492d5e7b313af6d03689.reference || (__cxx_static_address_5d2a492d5e7b313af6d03689.reference = {
    __cReference: true,
    get value() { return CHAINGUN____header_global_7f26c95267b7a14a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:671
export const RPGGUN____header_global_f778a40e0f407b7c = ((((((2544) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5e5113be62a77355fecd4298() {
  return __cxx_static_address_5e5113be62a77355fecd4298.reference || (__cxx_static_address_5e5113be62a77355fecd4298.reference = {
    __cReference: true,
    get value() { return RPGGUN____header_global_f778a40e0f407b7c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:672
export const FREEZE____header_global_99af2eb5c96ec883 = ((((((2548) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7b96dd951bf8802c0ca57a89() {
  return __cxx_static_address_7b96dd951bf8802c0ca57a89.reference || (__cxx_static_address_7b96dd951bf8802c0ca57a89.reference = {
    __cReference: true,
    get value() { return FREEZE____header_global_99af2eb5c96ec883; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:673
export const SHRINKER____header_global_b1f401c24887417b = ((((((2556) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3ad086bc071f9cf16b3b7076() {
  return __cxx_static_address_3ad086bc071f9cf16b3b7076.reference || (__cxx_static_address_3ad086bc071f9cf16b3b7076.reference = {
    __cReference: true,
    get value() { return SHRINKER____header_global_b1f401c24887417b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:674
export const HANDHOLDINGLASER____header_global_0516456dd1dc9a56 = ((((((2563) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1b0b0285678411267b7af727() {
  return __cxx_static_address_1b0b0285678411267b7af727.reference || (__cxx_static_address_1b0b0285678411267b7af727.reference = {
    __cReference: true,
    get value() { return HANDHOLDINGLASER____header_global_0516456dd1dc9a56; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:675
export const TRIPBOMB____header_global_7febbd553b4c9d2e = ((((((2566) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cf1b8388cdc174129771a9c7() {
  return __cxx_static_address_cf1b8388cdc174129771a9c7.reference || (__cxx_static_address_cf1b8388cdc174129771a9c7.reference = {
    __cReference: true,
    get value() { return TRIPBOMB____header_global_7febbd553b4c9d2e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:676
export const LASERLINE____header_global_d7345ecd28bcca3f = ((((((2567) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f780defcd5b696225532cc53() {
  return __cxx_static_address_f780defcd5b696225532cc53.reference || (__cxx_static_address_f780defcd5b696225532cc53.reference = {
    __cReference: true,
    get value() { return LASERLINE____header_global_d7345ecd28bcca3f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:677
export const HANDHOLDINGACCESS____header_global_974b2793853c51bf = ((((((2568) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_50a1e604258130928ba85d80() {
  return __cxx_static_address_50a1e604258130928ba85d80.reference || (__cxx_static_address_50a1e604258130928ba85d80.reference = {
    __cReference: true,
    get value() { return HANDHOLDINGACCESS____header_global_974b2793853c51bf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:678
export const HANDREMOTE____header_global_332b41f7d5962a31 = ((((((2570) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b5945fc72944d4a2fe69e0cc() {
  return __cxx_static_address_b5945fc72944d4a2fe69e0cc.reference || (__cxx_static_address_b5945fc72944d4a2fe69e0cc.reference = {
    __cReference: true,
    get value() { return HANDREMOTE____header_global_332b41f7d5962a31; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:679
export const HANDTHROW____header_global_bed0979c5824608c = ((((((2573) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_75d886c4c0643a93dfd20db0() {
  return __cxx_static_address_75d886c4c0643a93dfd20db0.reference || (__cxx_static_address_75d886c4c0643a93dfd20db0.reference = {
    __cReference: true,
    get value() { return HANDTHROW____header_global_bed0979c5824608c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:680
export const TIP____header_global_8c8a12989bc9ffb5 = ((((((2576) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bd96291a01897a9cf320ca65() {
  return __cxx_static_address_bd96291a01897a9cf320ca65.reference || (__cxx_static_address_bd96291a01897a9cf320ca65.reference = {
    __cReference: true,
    get value() { return TIP____header_global_8c8a12989bc9ffb5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:681
export const SCUBAMASK____header_global_bd4c52ce7072e01c = ((((((2581) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_19dc383e79c522123196c570() {
  return __cxx_static_address_19dc383e79c522123196c570.reference || (__cxx_static_address_19dc383e79c522123196c570.reference = {
    __cReference: true,
    get value() { return SCUBAMASK____header_global_bd4c52ce7072e01c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:682
export const FORCESPHERE____header_global_514cb8dd8e055132 = ((((((2590) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_94ac5196b9ee4936b94e3c78() {
  return __cxx_static_address_94ac5196b9ee4936b94e3c78.reference || (__cxx_static_address_94ac5196b9ee4936b94e3c78.reference = {
    __cReference: true,
    get value() { return FORCESPHERE____header_global_514cb8dd8e055132; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:683
export const SHOTSPARK1____header_global_f90d052d555654df = ((((((2595) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d0fc9868dcba8252590ccbc9() {
  return __cxx_static_address_d0fc9868dcba8252590ccbc9.reference || (__cxx_static_address_d0fc9868dcba8252590ccbc9.reference = {
    __cReference: true,
    get value() { return SHOTSPARK1____header_global_f90d052d555654df; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:684
export const RPG____header_global_b4042fe7efbc8f0d = ((((((2605) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a55435d9ed1de4adf8f5d1a3() {
  return __cxx_static_address_a55435d9ed1de4adf8f5d1a3.reference || (__cxx_static_address_a55435d9ed1de4adf8f5d1a3.reference = {
    __cReference: true,
    get value() { return RPG____header_global_b4042fe7efbc8f0d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:685
export const LASERSITE____header_global_6970a03d6b25f3fc = ((((((2612) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c923e9c73deece807a03f204() {
  return __cxx_static_address_c923e9c73deece807a03f204.reference || (__cxx_static_address_c923e9c73deece807a03f204.reference = {
    __cReference: true,
    get value() { return LASERSITE____header_global_6970a03d6b25f3fc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:686
export const SHOTGUN____header_global_a07717cdb5c22cdd = ((((((2613) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1028595c593cb42d4a86b11e() {
  return __cxx_static_address_1028595c593cb42d4a86b11e.reference || (__cxx_static_address_1028595c593cb42d4a86b11e.reference = {
    __cReference: true,
    get value() { return SHOTGUN____header_global_a07717cdb5c22cdd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:687
export const BOSS1____header_global_6d3b17977727672e = ((((((2630) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b8f6080e429a451b932086f5() {
  return __cxx_static_address_b8f6080e429a451b932086f5.reference || (__cxx_static_address_b8f6080e429a451b932086f5.reference = {
    __cReference: true,
    get value() { return BOSS1____header_global_6d3b17977727672e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:688
export const BOSS1STAYPUT____header_global_52735d1c0a739cb5 = ((((((2631) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d98e41c3e32fa3e791fe2cbe() {
  return __cxx_static_address_d98e41c3e32fa3e791fe2cbe.reference || (__cxx_static_address_d98e41c3e32fa3e791fe2cbe.reference = {
    __cReference: true,
    get value() { return BOSS1STAYPUT____header_global_52735d1c0a739cb5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:689
export const BOSS1SHOOT____header_global_39fb27d6443dda0a = ((((((2660) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5e529ffd9c23ad9703475fc6() {
  return __cxx_static_address_5e529ffd9c23ad9703475fc6.reference || (__cxx_static_address_5e529ffd9c23ad9703475fc6.reference = {
    __cReference: true,
    get value() { return BOSS1SHOOT____header_global_39fb27d6443dda0a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:690
export const BOSS1LOB____header_global_dacc1d6144a26a37 = ((((((2670) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fd8e8bbc5ff57d40f56bb6a8() {
  return __cxx_static_address_fd8e8bbc5ff57d40f56bb6a8.reference || (__cxx_static_address_fd8e8bbc5ff57d40f56bb6a8.reference = {
    __cReference: true,
    get value() { return BOSS1LOB____header_global_dacc1d6144a26a37; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:691
export const BOSSTOP____header_global_f6e854bcbc111443 = ((((((2696) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_416e6d7cd3696e5ea7b67031() {
  return __cxx_static_address_416e6d7cd3696e5ea7b67031.reference || (__cxx_static_address_416e6d7cd3696e5ea7b67031.reference = {
    __cReference: true,
    get value() { return BOSSTOP____header_global_f6e854bcbc111443; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:692
export const BOSS2____header_global_2803dedf805068b6 = ((((((2710) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_27bdf1c05bc6b4fa8103365e() {
  return __cxx_static_address_27bdf1c05bc6b4fa8103365e.reference || (__cxx_static_address_27bdf1c05bc6b4fa8103365e.reference = {
    __cReference: true,
    get value() { return BOSS2____header_global_2803dedf805068b6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:693
export const BOSS3____header_global_7cd2c084ddc27a38 = ((((((2760) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ccfb70e704d53980532b42af() {
  return __cxx_static_address_ccfb70e704d53980532b42af.reference || (__cxx_static_address_ccfb70e704d53980532b42af.reference = {
    __cReference: true,
    get value() { return BOSS3____header_global_7cd2c084ddc27a38; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:694
export const SPINNINGNUKEICON____header_global_b13d11a9533d3703 = ((((((2813) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2630a0b80e647414bbf43009() {
  return __cxx_static_address_2630a0b80e647414bbf43009.reference || (__cxx_static_address_2630a0b80e647414bbf43009.reference = {
    __cReference: true,
    get value() { return SPINNINGNUKEICON____header_global_b13d11a9533d3703; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:695
export const SMALLFNTCURSOR____header_global_b67a94266b9a071f = ((((((2821) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_95654cfb9695d10aec5bf71a() {
  return __cxx_static_address_95654cfb9695d10aec5bf71a.reference || (__cxx_static_address_95654cfb9695d10aec5bf71a.reference = {
    __cReference: true,
    get value() { return SMALLFNTCURSOR____header_global_b67a94266b9a071f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:696
export const STARTALPHANUM____header_global_fab97ad9a723c7b7 = ((((((2822) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3991ead5f8faeddae042af42() {
  return __cxx_static_address_3991ead5f8faeddae042af42.reference || (__cxx_static_address_3991ead5f8faeddae042af42.reference = {
    __cReference: true,
    get value() { return STARTALPHANUM____header_global_fab97ad9a723c7b7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:697
export const ENDALPHANUM____header_global_d610fd6d7b30da7f = ((((((2915) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fade9e05e44c5446f19b8b72() {
  return __cxx_static_address_fade9e05e44c5446f19b8b72.reference || (__cxx_static_address_fade9e05e44c5446f19b8b72.reference = {
    __cReference: true,
    get value() { return ENDALPHANUM____header_global_d610fd6d7b30da7f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:698
export const BIGALPHANUM____header_global_82bf104d1f36f19c = ((((((2940) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_edf2c561d1b9b2aba6d11015() {
  return __cxx_static_address_edf2c561d1b9b2aba6d11015.reference || (__cxx_static_address_edf2c561d1b9b2aba6d11015.reference = {
    __cReference: true,
    get value() { return BIGALPHANUM____header_global_82bf104d1f36f19c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:699
export const BIGPERIOD____header_global_145aa3efbe5cd848 = ((((((3002) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a042036056a2458cbe695777() {
  return __cxx_static_address_a042036056a2458cbe695777.reference || (__cxx_static_address_a042036056a2458cbe695777.reference = {
    __cReference: true,
    get value() { return BIGPERIOD____header_global_145aa3efbe5cd848; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:700
export const BIGCOMMA____header_global_3e31a45feea63634 = ((((((3003) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_69705445ea6ebc13d1e672c4() {
  return __cxx_static_address_69705445ea6ebc13d1e672c4.reference || (__cxx_static_address_69705445ea6ebc13d1e672c4.reference = {
    __cReference: true,
    get value() { return BIGCOMMA____header_global_3e31a45feea63634; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:701
export const BIGX____header_global_bd317c7aad0aad15 = ((((((3004) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_22cf12675e18d11eabafd6a7() {
  return __cxx_static_address_22cf12675e18d11eabafd6a7.reference || (__cxx_static_address_22cf12675e18d11eabafd6a7.reference = {
    __cReference: true,
    get value() { return BIGX____header_global_bd317c7aad0aad15; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:702
export const BIGQ____header_global_7bbd58d5f7c0242e = ((((((3005) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_92ace260f28e491d565db086() {
  return __cxx_static_address_92ace260f28e491d565db086.reference || (__cxx_static_address_92ace260f28e491d565db086.reference = {
    __cReference: true,
    get value() { return BIGQ____header_global_7bbd58d5f7c0242e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:703
export const BIGSEMI____header_global_057b914d5ef09604 = ((((((3006) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c8d60b5997663bf08caf9a5e() {
  return __cxx_static_address_c8d60b5997663bf08caf9a5e.reference || (__cxx_static_address_c8d60b5997663bf08caf9a5e.reference = {
    __cReference: true,
    get value() { return BIGSEMI____header_global_057b914d5ef09604; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:704
export const BIGCOLIN____header_global_a1f9493372cbaaf4 = ((((((3007) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a29eb6cedbfe4e542b8dbcb8() {
  return __cxx_static_address_a29eb6cedbfe4e542b8dbcb8.reference || (__cxx_static_address_a29eb6cedbfe4e542b8dbcb8.reference = {
    __cReference: true,
    get value() { return BIGCOLIN____header_global_a1f9493372cbaaf4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:705
export const THREEBYFIVE____header_global_a2c9a6ff7f113260 = ((((((3010) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ab65812effb8fced80c42906() {
  return __cxx_static_address_ab65812effb8fced80c42906.reference || (__cxx_static_address_ab65812effb8fced80c42906.reference = {
    __cReference: true,
    get value() { return THREEBYFIVE____header_global_a2c9a6ff7f113260; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:706
export const BIGAPPOS____header_global_96fafddafa294f42 = ((((((3022) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_129e7a891ac7360ce19b8217() {
  return __cxx_static_address_129e7a891ac7360ce19b8217.reference || (__cxx_static_address_129e7a891ac7360ce19b8217.reference = {
    __cReference: true,
    get value() { return BIGAPPOS____header_global_96fafddafa294f42; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:707
export const MINIFONT____header_global_af16904e3d5b03e6 = ((((((3072) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6bdbc8b9253d922715fda0dd() {
  return __cxx_static_address_6bdbc8b9253d922715fda0dd.reference || (__cxx_static_address_6bdbc8b9253d922715fda0dd.reference = {
    __cReference: true,
    get value() { return MINIFONT____header_global_af16904e3d5b03e6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:708
export const RESPAWNMARKERRED____header_global_12ebccb6daa73032 = ((((((3190) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cc0aa10950ef4bf98c81696d() {
  return __cxx_static_address_cc0aa10950ef4bf98c81696d.reference || (__cxx_static_address_cc0aa10950ef4bf98c81696d.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERRED____header_global_12ebccb6daa73032; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:709
export const RESPAWNMARKERYELLOW____header_global_720fe4c0a450142f = ((((((3200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_26ae3b3befec287af4771a2b() {
  return __cxx_static_address_26ae3b3befec287af4771a2b.reference || (__cxx_static_address_26ae3b3befec287af4771a2b.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERYELLOW____header_global_720fe4c0a450142f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:710
export const RESPAWNMARKERGREEN____header_global_b1c52a97ef4591a7 = ((((((3210) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cee62279b621a19132c94c94() {
  return __cxx_static_address_cee62279b621a19132c94c94.reference || (__cxx_static_address_cee62279b621a19132c94c94.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERGREEN____header_global_b1c52a97ef4591a7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:711
export const BONUSSCREEN____header_global_482b4d120801c1cd = ((((((3240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d89265b1d8320958f04fb3f7() {
  return __cxx_static_address_d89265b1d8320958f04fb3f7.reference || (__cxx_static_address_d89265b1d8320958f04fb3f7.reference = {
    __cReference: true,
    get value() { return BONUSSCREEN____header_global_482b4d120801c1cd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:712
export const VIEWBORDER____header_global_a753e0ca4b23120e = ((((((3250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_20381b6502b4905d4bf8a9c6() {
  return __cxx_static_address_20381b6502b4905d4bf8a9c6.reference || (__cxx_static_address_20381b6502b4905d4bf8a9c6.reference = {
    __cReference: true,
    get value() { return VIEWBORDER____header_global_a753e0ca4b23120e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:713
export const VICTORY1____header_global_9f9802ce7c1205c8 = ((((((3260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e9ceca5b0fb81775042a4a25() {
  return __cxx_static_address_e9ceca5b0fb81775042a4a25.reference || (__cxx_static_address_e9ceca5b0fb81775042a4a25.reference = {
    __cReference: true,
    get value() { return VICTORY1____header_global_9f9802ce7c1205c8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:714
export const ORDERING____header_global_511510a64ea72bd7 = ((((((3270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e6ed59859fcbaf02ee22d364() {
  return __cxx_static_address_e6ed59859fcbaf02ee22d364.reference || (__cxx_static_address_e6ed59859fcbaf02ee22d364.reference = {
    __cReference: true,
    get value() { return ORDERING____header_global_511510a64ea72bd7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:715
export const TEXTSTORY____header_global_a67fd075e18bbe56 = ((((((3280) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b1356283cbb42bc2e0481ff9() {
  return __cxx_static_address_b1356283cbb42bc2e0481ff9.reference || (__cxx_static_address_b1356283cbb42bc2e0481ff9.reference = {
    __cReference: true,
    get value() { return TEXTSTORY____header_global_a67fd075e18bbe56; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:716
export const LOADSCREEN____header_global_2bd00674da5a99fc = ((((((3281) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0ece22c3d55524b05440bf64() {
  return __cxx_static_address_0ece22c3d55524b05440bf64.reference || (__cxx_static_address_0ece22c3d55524b05440bf64.reference = {
    __cReference: true,
    get value() { return LOADSCREEN____header_global_2bd00674da5a99fc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:717
export const BORNTOBEWILDSCREEN____header_global_884883058a2e6c44 = ((((((3370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0f21a5105ebb86adc0deaa8b() {
  return __cxx_static_address_0f21a5105ebb86adc0deaa8b.reference || (__cxx_static_address_0f21a5105ebb86adc0deaa8b.reference = {
    __cReference: true,
    get value() { return BORNTOBEWILDSCREEN____header_global_884883058a2e6c44; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:718
export const BLIMP____header_global_abd9443618a550c9 = ((((((3400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f44945d3b3f46c85c5a03a2d() {
  return __cxx_static_address_f44945d3b3f46c85c5a03a2d.reference || (__cxx_static_address_f44945d3b3f46c85c5a03a2d.reference = {
    __cReference: true,
    get value() { return BLIMP____header_global_abd9443618a550c9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:719
export const FEM9____header_global_ef63ad0032c83d02 = ((((((3450) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c29e24ad8e93240f67a6d290() {
  return __cxx_static_address_c29e24ad8e93240f67a6d290.reference || (__cxx_static_address_c29e24ad8e93240f67a6d290.reference = {
    __cReference: true,
    get value() { return FEM9____header_global_ef63ad0032c83d02; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:720
export const FRAMEEFFECT1_13____header_global_0d021aea9f0d3643 = ((((((3999) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_44c88ceb19a1ef7f71b93aa6() {
  return __cxx_static_address_44c88ceb19a1ef7f71b93aa6.reference || (__cxx_static_address_44c88ceb19a1ef7f71b93aa6.reference = {
    __cReference: true,
    get value() { return FRAMEEFFECT1_13____header_global_0d021aea9f0d3643; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:721
export const FRAMEEFFECT1____header_global_3a631ea77fb66af0 = ((((((4095) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2c8d4506da1e157f3d633ad4() {
  return __cxx_static_address_2c8d4506da1e157f3d633ad4.reference || (__cxx_static_address_2c8d4506da1e157f3d633ad4.reference = {
    __cReference: true,
    get value() { return FRAMEEFFECT1____header_global_3a631ea77fb66af0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:722
export const PANNEL3____header_global_6264826dd842a25f = ((((((4099) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c7167c9e1286c831d4b56f94() {
  return __cxx_static_address_c7167c9e1286c831d4b56f94.reference || (__cxx_static_address_c7167c9e1286c831d4b56f94.reference = {
    __cReference: true,
    get value() { return PANNEL3____header_global_6264826dd842a25f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:723
export const SCREENBREAK14____header_global_e920657f345ef374 = ((((((4120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_05e9779c0f8fe56dfe13d800() {
  return __cxx_static_address_05e9779c0f8fe56dfe13d800.reference || (__cxx_static_address_05e9779c0f8fe56dfe13d800.reference = {
    __cReference: true,
    get value() { return SCREENBREAK14____header_global_e920657f345ef374; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:724
export const SCREENBREAK15____header_global_12669307b5176a3c = ((((((4123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3fd2f12f5aa28d6bf3c2e025() {
  return __cxx_static_address_3fd2f12f5aa28d6bf3c2e025.reference || (__cxx_static_address_3fd2f12f5aa28d6bf3c2e025.reference = {
    __cReference: true,
    get value() { return SCREENBREAK15____header_global_12669307b5176a3c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:725
export const SCREENBREAK19____header_global_90bf984657e0be9e = ((((((4125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a812483c28857b3a79ec801b() {
  return __cxx_static_address_a812483c28857b3a79ec801b.reference || (__cxx_static_address_a812483c28857b3a79ec801b.reference = {
    __cReference: true,
    get value() { return SCREENBREAK19____header_global_90bf984657e0be9e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:726
export const SCREENBREAK16____header_global_b807401a531859d1 = ((((((4127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9363b948b56817a3e02b752e() {
  return __cxx_static_address_9363b948b56817a3e02b752e.reference || (__cxx_static_address_9363b948b56817a3e02b752e.reference = {
    __cReference: true,
    get value() { return SCREENBREAK16____header_global_b807401a531859d1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:727
export const SCREENBREAK17____header_global_ed7d31b3c133a760 = ((((((4128) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eb70d5caffe960c133f17ab3() {
  return __cxx_static_address_eb70d5caffe960c133f17ab3.reference || (__cxx_static_address_eb70d5caffe960c133f17ab3.reference = {
    __cReference: true,
    get value() { return SCREENBREAK17____header_global_ed7d31b3c133a760; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:728
export const SCREENBREAK18____header_global_82869b59493ba27b = ((((((4129) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e8c3108f4e5975c622b4a17c() {
  return __cxx_static_address_e8c3108f4e5975c622b4a17c.reference || (__cxx_static_address_e8c3108f4e5975c622b4a17c.reference = {
    __cReference: true,
    get value() { return SCREENBREAK18____header_global_82869b59493ba27b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:729
export const W_TECHWALL11____header_global_baaa45717a1cbafc = ((((((4130) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1eb890b11eaacd7939242901() {
  return __cxx_static_address_1eb890b11eaacd7939242901.reference || (__cxx_static_address_1eb890b11eaacd7939242901.reference = {
    __cReference: true,
    get value() { return W_TECHWALL11____header_global_baaa45717a1cbafc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:730
export const W_TECHWALL12____header_global_f431bb75a4728f2f = ((((((4131) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2b134bf307ac013b0235b233() {
  return __cxx_static_address_2b134bf307ac013b0235b233.reference || (__cxx_static_address_2b134bf307ac013b0235b233.reference = {
    __cReference: true,
    get value() { return W_TECHWALL12____header_global_f431bb75a4728f2f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:731
export const W_TECHWALL13____header_global_080b01d38d877b4b = ((((((4132) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2b42daa3a9431012f1700604() {
  return __cxx_static_address_2b42daa3a9431012f1700604.reference || (__cxx_static_address_2b42daa3a9431012f1700604.reference = {
    __cReference: true,
    get value() { return W_TECHWALL13____header_global_080b01d38d877b4b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:732
export const W_TECHWALL14____header_global_cbd79724cf8aca33 = ((((((4133) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d8d51958aa087729974229c3() {
  return __cxx_static_address_d8d51958aa087729974229c3.reference || (__cxx_static_address_d8d51958aa087729974229c3.reference = {
    __cReference: true,
    get value() { return W_TECHWALL14____header_global_cbd79724cf8aca33; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:733
export const W_TECHWALL5____header_global_149219e9a1c764c8 = ((((((4134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2ddd813f20273f31cebb3281() {
  return __cxx_static_address_2ddd813f20273f31cebb3281.reference || (__cxx_static_address_2ddd813f20273f31cebb3281.reference = {
    __cReference: true,
    get value() { return W_TECHWALL5____header_global_149219e9a1c764c8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:734
export const W_TECHWALL6____header_global_984e5dc98d10c099 = ((((((4136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_69c9027a545a1964e0e6fb09() {
  return __cxx_static_address_69c9027a545a1964e0e6fb09.reference || (__cxx_static_address_69c9027a545a1964e0e6fb09.reference = {
    __cReference: true,
    get value() { return W_TECHWALL6____header_global_984e5dc98d10c099; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:735
export const W_TECHWALL7____header_global_5e0a0a529aebf6e2 = ((((((4138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_20244145bf2b06ffe2d99b45() {
  return __cxx_static_address_20244145bf2b06ffe2d99b45.reference || (__cxx_static_address_20244145bf2b06ffe2d99b45.reference = {
    __cReference: true,
    get value() { return W_TECHWALL7____header_global_5e0a0a529aebf6e2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:736
export const W_TECHWALL8____header_global_60dbbb0aec2f2012 = ((((((4140) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7802ef564f830987f5382889() {
  return __cxx_static_address_7802ef564f830987f5382889.reference || (__cxx_static_address_7802ef564f830987f5382889.reference = {
    __cReference: true,
    get value() { return W_TECHWALL8____header_global_60dbbb0aec2f2012; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:737
export const W_TECHWALL9____header_global_96726db94508dfc3 = ((((((4142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b87bfa7ae3e155656b976452() {
  return __cxx_static_address_b87bfa7ae3e155656b976452.reference || (__cxx_static_address_b87bfa7ae3e155656b976452.reference = {
    __cReference: true,
    get value() { return W_TECHWALL9____header_global_96726db94508dfc3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:738
export const BPANNEL3____header_global_0c29cd3a1934abc6 = ((((((4100) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b38298dde90245b01335ccd2() {
  return __cxx_static_address_b38298dde90245b01335ccd2.reference || (__cxx_static_address_b38298dde90245b01335ccd2.reference = {
    __cReference: true,
    get value() { return BPANNEL3____header_global_0c29cd3a1934abc6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:739
export const W_HITTECHWALL16____header_global_776e453ba445f6e4 = ((((((4144) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8b2f9271c0b6018ea3957179() {
  return __cxx_static_address_8b2f9271c0b6018ea3957179.reference || (__cxx_static_address_8b2f9271c0b6018ea3957179.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL16____header_global_776e453ba445f6e4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:740
export const W_HITTECHWALL10____header_global_577797d0806c065c = ((((((4145) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f80f657d5333ef017b9fdb5b() {
  return __cxx_static_address_f80f657d5333ef017b9fdb5b.reference || (__cxx_static_address_f80f657d5333ef017b9fdb5b.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL10____header_global_577797d0806c065c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:741
export const W_HITTECHWALL15____header_global_e70044117b904c03 = ((((((4147) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a83eb9db3bfaafcaa9ae6fe3() {
  return __cxx_static_address_a83eb9db3bfaafcaa9ae6fe3.reference || (__cxx_static_address_a83eb9db3bfaafcaa9ae6fe3.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL15____header_global_e70044117b904c03; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:742
export const W_MILKSHELF____header_global_422ef869c20bed8d = ((((((4181) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b8bb155c4687ce51c82e6cdf() {
  return __cxx_static_address_b8bb155c4687ce51c82e6cdf.reference || (__cxx_static_address_b8bb155c4687ce51c82e6cdf.reference = {
    __cReference: true,
    get value() { return W_MILKSHELF____header_global_422ef869c20bed8d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:743
export const W_MILKSHELFBROKE____header_global_94e43d47b5a3f6d1 = ((((((4203) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_23add141a748e7d23e0fed5c() {
  return __cxx_static_address_23add141a748e7d23e0fed5c.reference || (__cxx_static_address_23add141a748e7d23e0fed5c.reference = {
    __cReference: true,
    get value() { return W_MILKSHELFBROKE____header_global_94e43d47b5a3f6d1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:744
export const PURPLELAVA____header_global_c6a364813e5f9172 = ((((((4240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f4576bcb8141832198e93aeb() {
  return __cxx_static_address_f4576bcb8141832198e93aeb.reference || (__cxx_static_address_f4576bcb8141832198e93aeb.reference = {
    __cReference: true,
    get value() { return PURPLELAVA____header_global_c6a364813e5f9172; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:745
export const TARGET____header_global_33b639f2e69d518b = ((((((4359) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a57e1212ff9b150ed01da637() {
  return __cxx_static_address_a57e1212ff9b150ed01da637.reference || (__cxx_static_address_a57e1212ff9b150ed01da637.reference = {
    __cReference: true,
    get value() { return TARGET____header_global_33b639f2e69d518b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:746
export const DUCK____header_global_2789a50bce8c100f = ((((((4361) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_128e2f25778374752d77ec8e() {
  return __cxx_static_address_128e2f25778374752d77ec8e.reference || (__cxx_static_address_128e2f25778374752d77ec8e.reference = {
    __cReference: true,
    get value() { return DUCK____header_global_2789a50bce8c100f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:747
export const PUKE____header_global_4a3dfbfd91becea0 = ((((((4389) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_07804d205d74c724957ce836() {
  return __cxx_static_address_07804d205d74c724957ce836.reference || (__cxx_static_address_07804d205d74c724957ce836.reference = {
    __cReference: true,
    get value() { return PUKE____header_global_4a3dfbfd91becea0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:748
export const DOORTILE23____header_global_0d6e3f77387ad363 = ((((((4391) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3668c3b38ed2fb9bc8d612bd() {
  return __cxx_static_address_3668c3b38ed2fb9bc8d612bd.reference || (__cxx_static_address_3668c3b38ed2fb9bc8d612bd.reference = {
    __cReference: true,
    get value() { return DOORTILE23____header_global_0d6e3f77387ad363; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:749
export const SPEAKER____header_global_cc46a5602bc905db = ((((((4397) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3dacdb6dcacf550202697b41() {
  return __cxx_static_address_3dacdb6dcacf550202697b41.reference || (__cxx_static_address_3dacdb6dcacf550202697b41.reference = {
    __cReference: true,
    get value() { return SPEAKER____header_global_cc46a5602bc905db; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:750
export const MAIL____header_global_16ea5b3177fda8dd = ((((((4410) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a38ca25577f7615d74694b1d() {
  return __cxx_static_address_a38ca25577f7615d74694b1d.reference || (__cxx_static_address_a38ca25577f7615d74694b1d.reference = {
    __cReference: true,
    get value() { return MAIL____header_global_16ea5b3177fda8dd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:751
export const HOTMEAT____header_global_6df864a7a18dac30 = ((((((4427) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d39442579e09774ca4e92cdb() {
  return __cxx_static_address_d39442579e09774ca4e92cdb.reference || (__cxx_static_address_d39442579e09774ca4e92cdb.reference = {
    __cReference: true,
    get value() { return HOTMEAT____header_global_6df864a7a18dac30; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:752
export const TRIPODCAMERA____header_global_77dc74ce20a597b7 = ((((((4444) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7fac73c97ac38ef54861f2fd() {
  return __cxx_static_address_7fac73c97ac38ef54861f2fd.reference || (__cxx_static_address_7fac73c97ac38ef54861f2fd.reference = {
    __cReference: true,
    get value() { return TRIPODCAMERA____header_global_77dc74ce20a597b7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:753
export const PAPER____header_global_bcc0ebf882d414b8 = ((((((4460) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0e2952d37114ef8915517da7() {
  return __cxx_static_address_0e2952d37114ef8915517da7.reference || (__cxx_static_address_0e2952d37114ef8915517da7.reference = {
    __cReference: true,
    get value() { return PAPER____header_global_bcc0ebf882d414b8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:754
export const GENERICPOLE2____header_global_e4ab450b7e60d024 = ((((((4465) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2ff0c9146c82748052a00060() {
  return __cxx_static_address_2ff0c9146c82748052a00060.reference || (__cxx_static_address_2ff0c9146c82748052a00060.reference = {
    __cReference: true,
    get value() { return GENERICPOLE2____header_global_e4ab450b7e60d024; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:755
export const XXXSTACY____header_global_759f26445bd48d3a = ((((((4470) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_956e3dbae83385e5fe8c4d17() {
  return __cxx_static_address_956e3dbae83385e5fe8c4d17.reference || (__cxx_static_address_956e3dbae83385e5fe8c4d17.reference = {
    __cReference: true,
    get value() { return XXXSTACY____header_global_759f26445bd48d3a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:756
export const LETTER____header_global_764d69b3952c9f1e = ((((((4502) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2a1168af795ea1666cc94eb2() {
  return __cxx_static_address_2a1168af795ea1666cc94eb2.reference || (__cxx_static_address_2a1168af795ea1666cc94eb2.reference = {
    __cReference: true,
    get value() { return LETTER____header_global_764d69b3952c9f1e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:757
export const SIDEBOLT1____header_global_5454bd4625298110 = ((((((4525) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ac9cd2646b8941246fe73012() {
  return __cxx_static_address_ac9cd2646b8941246fe73012.reference || (__cxx_static_address_ac9cd2646b8941246fe73012.reference = {
    __cReference: true,
    get value() { return SIDEBOLT1____header_global_5454bd4625298110; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:758
export const FOODOBJECT16____header_global_05f491402a110962 = ((((((4545) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_23c52db9daaabe06c9ade738() {
  return __cxx_static_address_23c52db9daaabe06c9ade738.reference || (__cxx_static_address_23c52db9daaabe06c9ade738.reference = {
    __cReference: true,
    get value() { return FOODOBJECT16____header_global_05f491402a110962; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:759
export const TAMPON____header_global_80ac4c7bd128da66 = ((((((4557) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3f951051f39616b101485631() {
  return __cxx_static_address_3f951051f39616b101485631.reference || (__cxx_static_address_3f951051f39616b101485631.reference = {
    __cReference: true,
    get value() { return TAMPON____header_global_80ac4c7bd128da66; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:760
export const CANWITHSOMETHING2____header_global_2fed3bfec3d81a0e = ((((((4580) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e23dc3e72f0a3369d2e3c8ad() {
  return __cxx_static_address_e23dc3e72f0a3369d2e3c8ad.reference || (__cxx_static_address_e23dc3e72f0a3369d2e3c8ad.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING2____header_global_2fed3bfec3d81a0e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:761
export const CANWITHSOMETHING3____header_global_8c76c2f9fcba4a69 = ((((((4581) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a96848680e6f0438aed40e72() {
  return __cxx_static_address_a96848680e6f0438aed40e72.reference || (__cxx_static_address_a96848680e6f0438aed40e72.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING3____header_global_8c76c2f9fcba4a69; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:762
export const CANWITHSOMETHING4____header_global_9de87050f6bbcf1c = ((((((4582) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_46586605068f451c5289d0dd() {
  return __cxx_static_address_46586605068f451c5289d0dd.reference || (__cxx_static_address_46586605068f451c5289d0dd.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING4____header_global_9de87050f6bbcf1c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:763
export const DOLPHIN1____header_global_0ac8aa8d34e40bf0 = ((((((4591) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a33fec028ff5fb344a891325() {
  return __cxx_static_address_a33fec028ff5fb344a891325.reference || (__cxx_static_address_a33fec028ff5fb344a891325.reference = {
    __cReference: true,
    get value() { return DOLPHIN1____header_global_0ac8aa8d34e40bf0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:764
export const DOLPHIN2____header_global_bf8f7e269094bada = ((((((4592) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5ae84ce17696d21a693a5132() {
  return __cxx_static_address_5ae84ce17696d21a693a5132.reference || (__cxx_static_address_5ae84ce17696d21a693a5132.reference = {
    __cReference: true,
    get value() { return DOLPHIN2____header_global_bf8f7e269094bada; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:765
export const NEWBEAST____header_global_0d13e1b1dfeabae9 = ((((((4610) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9abccd813643d75c41f67355() {
  return __cxx_static_address_9abccd813643d75c41f67355.reference || (__cxx_static_address_9abccd813643d75c41f67355.reference = {
    __cReference: true,
    get value() { return NEWBEAST____header_global_0d13e1b1dfeabae9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:766
export const NEWBEASTSTAYPUT____header_global_6f8d240d0ae281d1 = ((((((4611) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e539122cda74842d80ada2c() {
  return __cxx_static_address_1e539122cda74842d80ada2c.reference || (__cxx_static_address_1e539122cda74842d80ada2c.reference = {
    __cReference: true,
    get value() { return NEWBEASTSTAYPUT____header_global_6f8d240d0ae281d1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:767
export const BOSS4____header_global_978faad14138d70f = ((((((4740) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ee87f61de29d9d2283320a51() {
  return __cxx_static_address_ee87f61de29d9d2283320a51.reference || (__cxx_static_address_ee87f61de29d9d2283320a51.reference = {
    __cReference: true,
    get value() { return BOSS4____header_global_978faad14138d70f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:768
export const BOSS4STAYPUT____header_global_f20196cd4843d55a = ((((((4741) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_642606684c570aa60fa2b838() {
  return __cxx_static_address_642606684c570aa60fa2b838.reference || (__cxx_static_address_642606684c570aa60fa2b838.reference = {
    __cReference: true,
    get value() { return BOSS4STAYPUT____header_global_f20196cd4843d55a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:769
export const FEM10____header_global_5fb0a2a3ad83d497 = ((((((4864) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_db57c6bcfc88db881669de88() {
  return __cxx_static_address_db57c6bcfc88db881669de88.reference || (__cxx_static_address_db57c6bcfc88db881669de88.reference = {
    __cReference: true,
    get value() { return FEM10____header_global_5fb0a2a3ad83d497; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:770
export const TOUGHGAL____header_global_ebf2c0f3398fdacc = ((((((4866) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_db0e21ab4408f72297f8bdd4() {
  return __cxx_static_address_db0e21ab4408f72297f8bdd4.reference || (__cxx_static_address_db0e21ab4408f72297f8bdd4.reference = {
    __cReference: true,
    get value() { return TOUGHGAL____header_global_ebf2c0f3398fdacc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:771
export const MAN____header_global_0923190c91ae10db = ((((((4871) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2503f9d13e903616586e6b94() {
  return __cxx_static_address_2503f9d13e903616586e6b94.reference || (__cxx_static_address_2503f9d13e903616586e6b94.reference = {
    __cReference: true,
    get value() { return MAN____header_global_0923190c91ae10db; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:772
export const MAN2____header_global_2a287c148de5ae17 = ((((((4872) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_33503a22ef6e37fe25390539() {
  return __cxx_static_address_33503a22ef6e37fe25390539.reference || (__cxx_static_address_33503a22ef6e37fe25390539.reference = {
    __cReference: true,
    get value() { return MAN2____header_global_2a287c148de5ae17; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:773
export const WOMAN____header_global_4fc0d9dc2266346e = ((((((4874) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4a6cc7a964869baab884d249() {
  return __cxx_static_address_4a6cc7a964869baab884d249.reference || (__cxx_static_address_4a6cc7a964869baab884d249.reference = {
    __cReference: true,
    get value() { return WOMAN____header_global_4fc0d9dc2266346e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:774
export const NATURALLIGHTNING____header_global_47307fc55149ea4a = ((((((4890) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6363bbd356893dc908584024() {
  return __cxx_static_address_6363bbd356893dc908584024.reference || (__cxx_static_address_6363bbd356893dc908584024.reference = {
    __cReference: true,
    get value() { return NATURALLIGHTNING____header_global_47307fc55149ea4a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:775
export const WEATHERWARN____header_global_04d5dc9b36b1d80f = ((((((4893) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ba1fb9fe4d5302659fb8afd3() {
  return __cxx_static_address_ba1fb9fe4d5302659fb8afd3.reference || (__cxx_static_address_ba1fb9fe4d5302659fb8afd3.reference = {
    __cReference: true,
    get value() { return WEATHERWARN____header_global_04d5dc9b36b1d80f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:776
export const DUKETAG____header_global_f15a72a079f326ff = ((((((4900) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7c3d153433b06981da544e0b() {
  return __cxx_static_address_7c3d153433b06981da544e0b.reference || (__cxx_static_address_7c3d153433b06981da544e0b.reference = {
    __cReference: true,
    get value() { return DUKETAG____header_global_f15a72a079f326ff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:777
export const SIGN1____header_global_b98c0cf16d2f26ed = ((((((4909) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c5bef8877352fe1699a7963a() {
  return __cxx_static_address_c5bef8877352fe1699a7963a.reference || (__cxx_static_address_c5bef8877352fe1699a7963a.reference = {
    __cReference: true,
    get value() { return SIGN1____header_global_b98c0cf16d2f26ed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:778
export const SIGN2____header_global_0c4ffebb48120c25 = ((((((4912) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eb58085e766065ebfc773c85() {
  return __cxx_static_address_eb58085e766065ebfc773c85.reference || (__cxx_static_address_eb58085e766065ebfc773c85.reference = {
    __cReference: true,
    get value() { return SIGN2____header_global_0c4ffebb48120c25; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:779
export const JURYGUY____header_global_5d1ce39cf681324c = ((((((4943) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1f0f40f976e13fd1a73305be() {
  return __cxx_static_address_1f0f40f976e13fd1a73305be.reference || (__cxx_static_address_1f0f40f976e13fd1a73305be.reference = {
    __cReference: true,
    get value() { return JURYGUY____header_global_5d1ce39cf681324c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:780
export const WIDESCREENSTATUSBAR____header_global_306ad6c92664a759 = ((((((5120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0f2adcfacfd491ba5c2be1a0() {
  return __cxx_static_address_0f2adcfacfd491ba5c2be1a0.reference || (__cxx_static_address_0f2adcfacfd491ba5c2be1a0.reference = {
    __cReference: true,
    get value() { return WIDESCREENSTATUSBAR____header_global_306ad6c92664a759; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:781
export const RPGGUNWIDE____header_global_359a058b2ff98fb8 = ((((((5121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d50d8af3f4715b7293eb6c49() {
  return __cxx_static_address_d50d8af3f4715b7293eb6c49.reference || (__cxx_static_address_d50d8af3f4715b7293eb6c49.reference = {
    __cReference: true,
    get value() { return RPGGUNWIDE____header_global_359a058b2ff98fb8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:782
export const FIRSTGUNRELOADWIDE____header_global_5034ed80b71d7638 = ((((((5122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f5b44a772f36514e21b277a2() {
  return __cxx_static_address_f5b44a772f36514e21b277a2.reference || (__cxx_static_address_f5b44a772f36514e21b277a2.reference = {
    __cReference: true,
    get value() { return FIRSTGUNRELOADWIDE____header_global_5034ed80b71d7638; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:783
export const FREEZEWIDE____header_global_86e92833f251c9aa = ((((((5123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2eefb2dd46d8fdfed7260a4a() {
  return __cxx_static_address_2eefb2dd46d8fdfed7260a4a.reference || (__cxx_static_address_2eefb2dd46d8fdfed7260a4a.reference = {
    __cReference: true,
    get value() { return FREEZEWIDE____header_global_86e92833f251c9aa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:784
export const FREEZEFIREWIDE____header_global_7b92c62fce67c614 = ((((((5124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6b6aac159b11abf1b020c043() {
  return __cxx_static_address_6b6aac159b11abf1b020c043.reference || (__cxx_static_address_6b6aac159b11abf1b020c043.reference = {
    __cReference: true,
    get value() { return FREEZEFIREWIDE____header_global_7b92c62fce67c614; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:785
export const SHRINKERWIDE____header_global_4019b02abe1f7ed8 = ((((((5127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_60d6c8c322c3aae7d3507b5c() {
  return __cxx_static_address_60d6c8c322c3aae7d3507b5c.reference || (__cxx_static_address_60d6c8c322c3aae7d3507b5c.reference = {
    __cReference: true,
    get value() { return SHRINKERWIDE____header_global_4019b02abe1f7ed8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:786
export const CRACKKNUCKLESWIDE____header_global_6937ccd3697076af = ((((((5129) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cb75d0a2554c527a6728edf0() {
  return __cxx_static_address_cb75d0a2554c527a6728edf0.reference || (__cxx_static_address_cb75d0a2554c527a6728edf0.reference = {
    __cReference: true,
    get value() { return CRACKKNUCKLESWIDE____header_global_6937ccd3697076af; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:787
export const FLAMETHROWERSPRITE____header_global_a68f0c238e352fda = ((((((5134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9d3719e08574a03987f24919() {
  return __cxx_static_address_9d3719e08574a03987f24919.reference || (__cxx_static_address_9d3719e08574a03987f24919.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERSPRITE____header_global_a68f0c238e352fda; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:788
export const FLAMETHROWERAMMO____header_global_1d11622d408bdbce = ((((((5135) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f0c8a27ee8942734ee980507() {
  return __cxx_static_address_f0c8a27ee8942734ee980507.reference || (__cxx_static_address_f0c8a27ee8942734ee980507.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERAMMO____header_global_1d11622d408bdbce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:789
export const FLAMETHROWER____header_global_d13eb073a8811a46 = ((((((5138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e08c5b5c279a3af54465f7df() {
  return __cxx_static_address_e08c5b5c279a3af54465f7df.reference || (__cxx_static_address_e08c5b5c279a3af54465f7df.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER____header_global_d13eb073a8811a46; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:790
export const FLAMETHROWERFIRE____header_global_829d94a298ed439c = ((((((5139) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cbf60e705a3958d9649e2263() {
  return __cxx_static_address_cbf60e705a3958d9649e2263.reference || (__cxx_static_address_cbf60e705a3958d9649e2263.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERFIRE____header_global_829d94a298ed439c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:791
export const FLAMETHROWERFLAME____header_global_d6f3fe6eee5a55c8 = ((((((1891) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c0dc217145481dba1fc8e43e() {
  return __cxx_static_address_c0dc217145481dba1fc8e43e.reference || (__cxx_static_address_c0dc217145481dba1fc8e43e.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERFLAME____header_global_d6f3fe6eee5a55c8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:792
export const FLAMETHROWERPILOT____header_global_2f54a82f9c06f78f = ((((((5174) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_421e623b6e10896f020d9846() {
  return __cxx_static_address_421e623b6e10896f020d9846.reference || (__cxx_static_address_421e623b6e10896f020d9846.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERPILOT____header_global_2f54a82f9c06f78f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:793
export const FIREBALL____header_global_703a374d69b45d7c = ((((((5163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4e0a0f494a491c4a3aed879c() {
  return __cxx_static_address_4e0a0f494a491c4a3aed879c.reference || (__cxx_static_address_4e0a0f494a491c4a3aed879c.reference = {
    __cReference: true,
    get value() { return FIREBALL____header_global_703a374d69b45d7c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:794
export const ONFIRE____header_global_7c0857b12716e773 = ((((((5152) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4fa3c82e22316ba2e3613fc8() {
  return __cxx_static_address_4fa3c82e22316ba2e3613fc8.reference || (__cxx_static_address_4fa3c82e22316ba2e3613fc8.reference = {
    __cReference: true,
    get value() { return ONFIRE____header_global_7c0857b12716e773; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:795
export const ONFIRESMOKE____header_global_f0a1cce0668c493a = ((((((5143) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f2ce16802320f98bd1b801f8() {
  return __cxx_static_address_f2ce16802320f98bd1b801f8.reference || (__cxx_static_address_f2ce16802320f98bd1b801f8.reference = {
    __cReference: true,
    get value() { return ONFIRESMOKE____header_global_f0a1cce0668c493a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:796
export const BURNEDCORPSE____header_global_6d919dbb1603b54a = ((((((5173) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0130e23dfb7cf90e61dc702c() {
  return __cxx_static_address_0130e23dfb7cf90e61dc702c.reference || (__cxx_static_address_0130e23dfb7cf90e61dc702c.reference = {
    __cReference: true,
    get value() { return BURNEDCORPSE____header_global_6d919dbb1603b54a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:797
export const WHISPYSMOKE____header_global_265d5bd47a345078 = ((((((5268) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d4c5a8e7b90a7ae03aaed777() {
  return __cxx_static_address_d4c5a8e7b90a7ae03aaed777.reference || (__cxx_static_address_d4c5a8e7b90a7ae03aaed777.reference = {
    __cReference: true,
    get value() { return WHISPYSMOKE____header_global_265d5bd47a345078; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:798
export const FIREFLY____header_global_2407dd5d15cc21e4 = ((((((5180) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ab87daebfdf813161d9ec49c() {
  return __cxx_static_address_ab87daebfdf813161d9ec49c.reference || (__cxx_static_address_ab87daebfdf813161d9ec49c.reference = {
    __cReference: true,
    get value() { return FIREFLY____header_global_2407dd5d15cc21e4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:799
export const FIREFLYSHRINKEFFECT____header_global_a213f816d57b5592 = ((((((5360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d008167ce91427b21982c132() {
  return __cxx_static_address_d008167ce91427b21982c132.reference || (__cxx_static_address_d008167ce91427b21982c132.reference = {
    __cReference: true,
    get value() { return FIREFLYSHRINKEFFECT____header_global_a213f816d57b5592; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:800
export const FIREFLYGROWEFFECT____header_global_c1e73922497bd5f3 = ((((((5367) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f7c793f0b876ab5458c2c842() {
  return __cxx_static_address_f7c793f0b876ab5458c2c842.reference || (__cxx_static_address_f7c793f0b876ab5458c2c842.reference = {
    __cReference: true,
    get value() { return FIREFLYGROWEFFECT____header_global_c1e73922497bd5f3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:801
export const FIREFLYFLYINGEFFECT____header_global_2f18977faf7a8600 = ((((((5296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3bc08560ec43891c0f1ad19a() {
  return __cxx_static_address_3bc08560ec43891c0f1ad19a.reference || (__cxx_static_address_3bc08560ec43891c0f1ad19a.reference = {
    __cReference: true,
    get value() { return FIREFLYFLYINGEFFECT____header_global_2f18977faf7a8600; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:802
export const BOSS5____header_global_7fbe8fbd73894b3d = ((((((5310) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fa037e779e0724fb2944157f() {
  return __cxx_static_address_fa037e779e0724fb2944157f.reference || (__cxx_static_address_fa037e779e0724fb2944157f.reference = {
    __cReference: true,
    get value() { return BOSS5____header_global_7fbe8fbd73894b3d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:803
export const BOSS5STAYPUT____header_global_111bb8b99775bb27 = ((((((5311) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_342cd753a8fd87a56990bca4() {
  return __cxx_static_address_342cd753a8fd87a56990bca4.reference || (__cxx_static_address_342cd753a8fd87a56990bca4.reference = {
    __cReference: true,
    get value() { return BOSS5STAYPUT____header_global_111bb8b99775bb27; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:804
export const LAVAPOOL____header_global_7692f45b437641dc = ((((((5304) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1b5de6abb425547015a61504() {
  return __cxx_static_address_1b5de6abb425547015a61504.reference || (__cxx_static_address_1b5de6abb425547015a61504.reference = {
    __cReference: true,
    get value() { return LAVAPOOL____header_global_7692f45b437641dc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:805
export const LAVASPLASH____header_global_c4d0e39dc9e22663 = ((((((5371) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e0ba6e63300ce9d86095966d() {
  return __cxx_static_address_e0ba6e63300ce9d86095966d.reference || (__cxx_static_address_e0ba6e63300ce9d86095966d.reference = {
    __cReference: true,
    get value() { return LAVASPLASH____header_global_c4d0e39dc9e22663; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:806
export const LAVAPOOLBUBBLE____header_global_7ed8814ce5a67c96 = ((((((5207) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ccf7cbbf052caf8d48a5ad59() {
  return __cxx_static_address_ccf7cbbf052caf8d48a5ad59.reference || (__cxx_static_address_ccf7cbbf052caf8d48a5ad59.reference = {
    __cReference: true,
    get value() { return LAVAPOOLBUBBLE____header_global_7ed8814ce5a67c96; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:807
export const BOSS2STAYPUT____header_global_5509fe55f8b8a46a = ((((((2711) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6b153d801057f6e12a2cada0() {
  return __cxx_static_address_6b153d801057f6e12a2cada0.reference || (__cxx_static_address_6b153d801057f6e12a2cada0.reference = {
    __cReference: true,
    get value() { return BOSS2STAYPUT____header_global_5509fe55f8b8a46a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:808
export const BOSS3STAYPUT____header_global_69f77ee31d946066 = ((((((2761) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d933a617bc542751503cf424() {
  return __cxx_static_address_d933a617bc542751503cf424.reference || (__cxx_static_address_d933a617bc542751503cf424.reference = {
    __cReference: true,
    get value() { return BOSS3STAYPUT____header_global_69f77ee31d946066; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:809
export const E32_TILE5736____header_global_848b8781427c81b4 = ((((((5736) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f8e365be99fcc9829e955b86() {
  return __cxx_static_address_f8e365be99fcc9829e955b86.reference || (__cxx_static_address_f8e365be99fcc9829e955b86.reference = {
    __cReference: true,
    get value() { return E32_TILE5736____header_global_848b8781427c81b4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:810
export const E32_TILE5737____header_global_57638bdcedea6e1b = ((((((5737) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_06bde19cdf41de287037a2d0() {
  return __cxx_static_address_06bde19cdf41de287037a2d0.reference || (__cxx_static_address_06bde19cdf41de287037a2d0.reference = {
    __cReference: true,
    get value() { return E32_TILE5737____header_global_57638bdcedea6e1b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:811
export const E32_TILE5846____header_global_1d04bb11ee3ccf4d = ((((((5846) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d0bad451bbc58e4381b6be65() {
  return __cxx_static_address_d0bad451bbc58e4381b6be65.reference || (__cxx_static_address_d0bad451bbc58e4381b6be65.reference = {
    __cReference: true,
    get value() { return E32_TILE5846____header_global_1d04bb11ee3ccf4d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/network.h:180
export const cSnapshotMemUsage__header_global_ad3037098e54fe36 = u64((BigInt(u64(64)) * BigInt((BigInt((BigInt((BigInt(72) * BigInt(u64(16384)))) + BigInt((BigInt(96) * BigInt(u64(4096)))))) + BigInt((BigInt(296) * BigInt(u64(16384))))))));
function __cxx_static_address_d2e77b2c7a9bff1e576fee82() {
  return __cxx_static_address_d2e77b2c7a9bff1e576fee82.reference || (__cxx_static_address_d2e77b2c7a9bff1e576fee82.reference = {
    __cReference: true,
    get value() { return cSnapshotMemUsage__header_global_ad3037098e54fe36; },
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

// C/C++ source: source/build/include/build.h:1510
export function OutputFileCounter() {
  return OutputFileCounter.type || (OutputFileCounter.type = class OutputFileCounter__implementation {
  constructor() {
    this.count = ((((0) & 65535)) & 65535);
  }
});
}

// C/C++ source: source/duke3d/src/savegame.h:41
export function _savehead() {
  return _savehead.type || (_savehead.type = class _savehead__implementation {
  constructor() {
    return Object.setPrototypeOf(cZeroAggregate({"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"boardfn": {"length": 224, "native": "Uint8Array", "offset": 72, "size": 224}, "bytever": {"native": "Uint16Array", "offset": 14, "size": 2}, "comprthres": {"native": "Uint8Array", "offset": 24, "size": 1}, "diffcompress": {"native": "Uint8Array", "offset": 26, "size": 1}, "filler": {"length": 2, "native": "Uint8Array", "offset": 20, "size": 2}, "headerstr": {"length": 11, "native": "Uint8Array", "offset": 0, "size": 11}, "health": {"native": "Int16Array", "offset": 22, "size": 2}, "levnum": {"native": "Uint8Array", "offset": 70, "size": 1}, "majorver": {"native": "Uint8Array", "offset": 11, "size": 1}, "minorver": {"native": "Uint8Array", "offset": 12, "size": 1}, "numplayers": {"native": "Uint8Array", "offset": 68, "size": 1}, "ptrsize": {"native": "Uint8Array", "offset": 13, "size": 1}, "reccnt": {"native": "Int32Array", "offset": 28, "size": 4}, "recdiffsp": {"native": "Uint8Array", "offset": 25, "size": 1}, "savename": {"length": 32, "native": "Uint8Array", "offset": 36, "size": 32}, "scriptname": {"length": 32, "native": "Uint8Array", "offset": 296, "size": 32}, "skill": {"native": "Uint8Array", "offset": 71, "size": 1}, "snapsiz": {"native": "Int32Array", "offset": 32, "size": 4}, "synccompress": {"native": "Uint8Array", "offset": 27, "size": 1}, "userbytever": {"native": "Uint32Array", "offset": 16, "size": 4}, "volnum": {"native": "Uint8Array", "offset": 69, "size": 1}}, "overlaps": false, "prototype": "_savehead", "size": 328, "union": false}}, {"_savehead": () => _savehead().prototype}), new.target.prototype);
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

// C/C++ source: source/duke3d/src/savegame.cpp:31
export let savecounter = new (OutputFileCounter())();
function __cxx_static_address_57294586477bc0a41cb77113() {
  return __cxx_static_address_57294586477bc0a41cb77113.reference || (__cxx_static_address_57294586477bc0a41cb77113.reference = {
    __cReference: true,
    get value() { return savecounter; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/savegame.cpp:38
export function G_Util_PtrToIdx(ptr, count, base, mode) {
  let iptr = cTypedPointer(ptr, BigInt64Array);
  let ibase = i64(base);
  let onlynon0_p = i32((mode & i32(2)));
  if ((i32((mode & i32(1))) == 0)) {
    for (let i = i64(0); (i < i64(count)); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i64((previous + 1n)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
      if (((!Boolean(onlynon0_p)) || Boolean((cDeref(cPointerOffset(iptr, i, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value)))) {
        ((__cxx_lvalue_2) => (__cxx_lvalue_2.value = i64((BigInt(__cxx_lvalue_2.value) - BigInt(ibase)))))(cDeref(cPointerOffset(iptr, i, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array));
      }
    }
  } else {
    for (let i = i64(0); (i < i64(count)); ((__cxx_lvalue_3) => { const previous = __cxx_lvalue_3.value; const next = i64((previous + 1n)); __cxx_lvalue_3.value = next; return previous; })(cRef(() => i, __cxx_lvalue_4 => { i = __cxx_lvalue_4; }))) {
      if (((!Boolean(onlynon0_p)) || Boolean((cDeref(cPointerOffset(iptr, i, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value)))) {
        ((__cxx_lvalue_5) => (__cxx_lvalue_5.value = i64((BigInt(__cxx_lvalue_5.value) + BigInt(ibase)))))(cDeref(cPointerOffset(iptr, i, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array));
      }
    }
  }
}

// C/C++ source: source/duke3d/src/savegame.cpp:63
export function G_Util_PtrToIdx2(ptr, count, stride, base, mode) {
  let iptr = cTypedPointer(ptr, Uint8Array);
  let ibase = i64(base);
  let onlynon0_p = i32((mode & i32(2)));
  if ((i32((mode & i32(1))) == 0)) {
    for (let i = i64(0); (i < i64(count)); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i64((previous + 1n)); __cxx_lvalue_0.value = next; return next; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
      if (((!Boolean(onlynon0_p)) || Boolean((cDeref(cTypedPointer(iptr, BigInt64Array), BigInt64Array).value)))) {
        ((__cxx_lvalue_2) => (__cxx_lvalue_2.value = i64((BigInt(__cxx_lvalue_2.value) - BigInt(ibase)))))(cDeref(cTypedPointer(iptr, BigInt64Array), BigInt64Array));
      }
      (iptr = cPointerOffset(iptr, stride, Uint8Array.BYTES_PER_ELEMENT));
    }
  } else {
    for (let i = i64(0); (i < i64(count)); ((__cxx_lvalue_3) => { const previous = __cxx_lvalue_3.value; const next = i64((previous + 1n)); __cxx_lvalue_3.value = next; return next; })(cRef(() => i, __cxx_lvalue_4 => { i = __cxx_lvalue_4; }))) {
      if (((!Boolean(onlynon0_p)) || Boolean((cDeref(cTypedPointer(iptr, BigInt64Array), BigInt64Array).value)))) {
        ((__cxx_lvalue_5) => (__cxx_lvalue_5.value = i64((BigInt(__cxx_lvalue_5.value) + BigInt(ibase)))))(cDeref(cTypedPointer(iptr, BigInt64Array), BigInt64Array));
      }
      (iptr = cPointerOffset(iptr, stride, Uint8Array.BYTES_PER_ELEMENT));
    }
  }
}

// C/C++ source: source/duke3d/src/savegame.cpp:135
export let g_lastautosave = (savebrief_t()).__cxx_construct_3fdb0b4b21c3726c();
export function __cxx_global_cell_a5b5c60dec475a58d3e27aa8() {
  return __cxx_global_cell_a5b5c60dec475a58d3e27aa8.reference || (__cxx_global_cell_a5b5c60dec475a58d3e27aa8.reference = {
    __cReference: true,
    get value() { return g_lastautosave; },
    set value(__cxx_lvalue_0) { throw new TypeError("record address cannot replace original object storage"); }
  });
}

export let g_lastusersave = (savebrief_t()).__cxx_construct_3fdb0b4b21c3726c();
export function __cxx_global_cell_27522a14f573e1171c46244d() {
  return __cxx_global_cell_27522a14f573e1171c46244d.reference || (__cxx_global_cell_27522a14f573e1171c46244d.reference = {
    __cReference: true,
    get value() { return g_lastusersave; },
    set value(__cxx_lvalue_0) { throw new TypeError("record address cannot replace original object storage"); }
  });
}

export let g_freshload = (savebrief_t()).__cxx_construct_3fdb0b4b21c3726c();
export function __cxx_global_cell_973fdc3381daf6500c5059b3() {
  return __cxx_global_cell_973fdc3381daf6500c5059b3.reference || (__cxx_global_cell_973fdc3381daf6500c5059b3.reference = {
    __cReference: true,
    get value() { return g_freshload; },
    set value(__cxx_lvalue_0) { throw new TypeError("record address cannot replace original object storage"); }
  });
}

// C/C++ source: source/duke3d/src/savegame.cpp:136
export let g_lastAutoSaveArbitraryID = i32((-1));
export function __cxx_global_cell_465a0b3c161b50504ffed39e() {
  return __cxx_global_cell_465a0b3c161b50504ffed39e.reference || (__cxx_global_cell_465a0b3c161b50504ffed39e.reference = {
    __cReference: true,
    get value() { return g_lastAutoSaveArbitraryID; },
    set value(__cxx_lvalue_0) { g_lastAutoSaveArbitraryID = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/savegame.cpp:137
export let g_saveRequested = false;
export function __cxx_global_cell_848569e4aea955ff44f064f2() {
  return __cxx_global_cell_848569e4aea955ff44f064f2.reference || (__cxx_global_cell_848569e4aea955ff44f064f2.reference = {
    __cReference: true,
    get value() { return g_saveRequested; },
    set value(__cxx_lvalue_0) { g_saveRequested = Boolean(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/savegame.cpp:138
export let g_skipReturnToCenter = false;
export function __cxx_global_cell_3292abc071ebe2da750ebdd9() {
  return __cxx_global_cell_3292abc071ebe2da750ebdd9.reference || (__cxx_global_cell_3292abc071ebe2da750ebdd9.reference = {
    __cReference: true,
    get value() { return g_skipReturnToCenter; },
    set value(__cxx_lvalue_0) { g_skipReturnToCenter = Boolean(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/savegame.cpp:139
export let g_quickload = null;
export function __cxx_global_cell_65eab36b353741f0a36f4092() {
  return __cxx_global_cell_65eab36b353741f0a36f4092.reference || (__cxx_global_cell_65eab36b353741f0a36f4092.reference = {
    __cReference: true,
    get value() { return g_quickload; },
    set value(__cxx_lvalue_0) { g_quickload = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/duke3d/src/savegame.cpp:141
export let g_menusaves = null;
export function __cxx_global_cell_8faa307367d11fa78d31d8b7() {
  return __cxx_global_cell_8faa307367d11fa78d31d8b7.reference || (__cxx_global_cell_8faa307367d11fa78d31d8b7.reference = {
    __cReference: true,
    get value() { return g_menusaves; },
    set value(__cxx_lvalue_0) { g_menusaves = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_ca0c7d3b7e3a018d = i32(2147483647);
function __cxx_static_address_a3df4fe1e564bda7474dbce1() {
  return __cxx_static_address_a3df4fe1e564bda7474dbce1.reference || (__cxx_static_address_a3df4fe1e564bda7474dbce1.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_ca0c7d3b7e3a018d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_4126dda506264fa4 = i32(2147483648);
function __cxx_static_address_63738827a51b13abcdd00f18() {
  return __cxx_static_address_63738827a51b13abcdd00f18.reference || (__cxx_static_address_63738827a51b13abcdd00f18.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_4126dda506264fa4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_d01fd9f046f1c901 = i32(2147483648);
function __cxx_static_address_bd126ef73b7cb4a9750083ee() {
  return __cxx_static_address_bd126ef73b7cb4a9750083ee.reference || (__cxx_static_address_bd126ef73b7cb4a9750083ee.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_d01fd9f046f1c901; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_75b7daca0daef435 = i32(65536);
function __cxx_static_address_866ea17362fe5d686aa4733b() {
  return __cxx_static_address_866ea17362fe5d686aa4733b.reference || (__cxx_static_address_866ea17362fe5d686aa4733b.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_75b7daca0daef435; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_31d113daa25d8de2 = i32(32768);
function __cxx_static_address_0685f856f0e5c6e8f1338891() {
  return __cxx_static_address_0685f856f0e5c6e8f1338891.reference || (__cxx_static_address_0685f856f0e5c6e8f1338891.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_31d113daa25d8de2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_ce223e1b143d6065 = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_0b638522309a48c1299c60a1() {
  return __cxx_static_address_0b638522309a48c1299c60a1.reference || (__cxx_static_address_0b638522309a48c1299c60a1.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_ce223e1b143d6065; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/savegame.cpp:142
export let g_nummenusaves = 0;
export function __cxx_global_cell_27f31bbd646fabd66f6b0776() {
  return __cxx_global_cell_27f31bbd646fabd66f6b0776.reference || (__cxx_global_cell_27f31bbd646fabd66f6b0776.reference = {
    __cReference: true,
    get value() { return g_nummenusaves; },
    set value(__cxx_lvalue_0) { g_nummenusaves = ((__cxx_lvalue_0) & 65535); }
  });
}

// C/C++ source: source/duke3d/src/savegame.cpp:144
export let g_internalsaves = null;
function __cxx_static_address_b20e5b99610e7ef476c21cc4() {
  return __cxx_static_address_b20e5b99610e7ef476c21cc4.reference || (__cxx_static_address_b20e5b99610e7ef476c21cc4.reference = {
    __cReference: true,
    get value() { return g_internalsaves; },
    set value(__cxx_lvalue_0) { g_internalsaves = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/duke3d/src/savegame.cpp:145
export let g_numinternalsaves = 0;
function __cxx_static_address_bb5606b431dc605ae3bb0767() {
  return __cxx_static_address_bb5606b431dc605ae3bb0767.reference || (__cxx_static_address_bb5606b431dc605ae3bb0767.reference = {
    __cReference: true,
    get value() { return g_numinternalsaves; },
    set value(__cxx_lvalue_0) { g_numinternalsaves = ((__cxx_lvalue_0) & 65535); }
  });
}

// C/C++ source: source/duke3d/src/savegame.cpp:203
export function countcache1dfind(f) {
  let x = i32(0);
  for (; cPointerCompare(f, null, "!="); (f = cRecordObject(f).next)) {
    ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return next; })(cRef(() => x, __cxx_lvalue_1 => { x = __cxx_lvalue_1; }));
  }
  return i32(x);
}

// C/C++ source: source/duke3d/src/savegame.cpp:404
export let different_user_map = 0;
function __cxx_static_address_fd86ff58ab0b8a4b65b2cc7b() {
  return __cxx_static_address_fd86ff58ab0b8a4b65b2cc7b.reference || (__cxx_static_address_fd86ff58ab0b8a4b65b2cc7b.reference = {
    __cReference: true,
    get value() { return different_user_map; },
    set value(__cxx_lvalue_0) { different_user_map = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/savegame.cpp:989
export let savegame_diffcompress = 0;
function __cxx_static_address_d6dd5844c53298fa0339f986() {
  return __cxx_static_address_d6dd5844c53298fa0339f986.reference || (__cxx_static_address_d6dd5844c53298fa0339f986.reference = {
    __cReference: true,
    get value() { return savegame_diffcompress; },
    set value(__cxx_lvalue_0) { savegame_diffcompress = ((__cxx_lvalue_0) & 255); }
  });
}

// C/C++ source: source/duke3d/src/savegame.cpp:990
export let savegame_comprthres = 0;
function __cxx_static_address_9e8baa093bd20c63a471289e() {
  return __cxx_static_address_9e8baa093bd20c63a471289e.reference || (__cxx_static_address_9e8baa093bd20c63a471289e.reference = {
    __cReference: true,
    get value() { return savegame_comprthres; },
    set value(__cxx_lvalue_0) { savegame_comprthres = ((__cxx_lvalue_0) & 255); }
  });
}

// C/C++ source: source/duke3d/src/savegame.cpp:1008
export function ds_getcnt(spec) {
  let cnt = i32((-1));
  switch (u32((cRecordObject(spec).flags & u32(i32((i32((i32((8 | 16)) | 32)) | 64)))))) {
    case u32(0): {
      (cnt = i32(cRecordObject(spec).cnt));
    }
    break;
    case u32(16): {
      (cnt = i32((cDeref(cTypedPointer(cRecordObject(spec).cnt, Int16Array), Int16Array).value)));
    }
    break;
    case u32(32): {
      (cnt = i32((cDeref(cTypedPointer(cRecordObject(spec).cnt, Int32Array), Int32Array).value)));
    }
    break;
  }
  return i32(cnt);
}

// C/C++ source: source/duke3d/src/savegame.cpp:1022
export function ds_get(spec, ptr, cnt) {
  ((cDeref(cnt, Int32Array).value) = i32(ds_getcnt(spec)));
  ((cPointerElementRef(ptr, 0).value) = (Boolean(u32((cRecordObject(spec).flags & u32(1)))) ? (cPointerElementRef(cRecordObject(spec).ptr, 0).value) : cRecordObject(spec).ptr));
}

// C/C++ source: source/duke3d/src/savegame.cpp:1244
export function getnumvar(spec) {
  let n = i32(0);
  for (; (cRecordObject(spec).flags != u32(1879048192)); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, 32); __cxx_lvalue_0.value = next; return previous; })(cRef(() => spec, __cxx_lvalue_1 => { spec = __cxx_lvalue_1; }))) {
    if ((!Boolean(u32((cRecordObject(spec).flags & u32(i32((i32((i32((i32((2 | 4)) | 1024)) | 256)) | 128)))))))) {
      ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return next; })(cRef(() => n, __cxx_lvalue_3 => { n = __cxx_lvalue_3; }));
    }
  }
  return i32(n);
}

// C/C++ source: source/duke3d/src/savegame.cpp:1409
export function calcsz(spec) {
  let dasiz = u32(0);
  for (; (cRecordObject(spec).flags != u32(1879048192)); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, 32); __cxx_lvalue_0.value = next; return previous; })(cRef(() => spec, __cxx_lvalue_1 => { spec = __cxx_lvalue_1; }))) {
    if (Boolean(u32((cRecordObject(spec).flags & u32(i32((i32((i32((i32((4 | 1024)) | 256)) | 128)) | 2))))))) {
      continue;
    }
    let cnt = i32(ds_getcnt(spec));
    if ((cnt <= 0)) {
      continue;
    }
    (dasiz = u32((Number(dasiz) + Number(u32(Math.imul(u32(cnt), cRecordObject(spec).size))))));
  }
  return u32(dasiz);
}

// C/C++ source: source/duke3d/src/savegame.cpp:1447
export let savegame_projectiledata = null;
function __cxx_static_address_057f898fbcef4767693c7d48() {
  return __cxx_static_address_057f898fbcef4767693c7d48.reference || (__cxx_static_address_057f898fbcef4767693c7d48.reference = {
    __cReference: true,
    get value() { return savegame_projectiledata; },
    set value(__cxx_lvalue_0) { savegame_projectiledata = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/duke3d/src/savegame.cpp:1448
export let savegame_projectiles = new Uint8Array(3840);
function __cxx_static_address_1509853a98f121d5d3bb8173() {
  return __cxx_static_address_1509853a98f121d5d3bb8173.reference || (__cxx_static_address_1509853a98f121d5d3bb8173.reference = {
    __cReference: true,
    get value() { return savegame_projectiles; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/savegame.cpp:1449
export let savegame_projectilecnt = i32(0);
function __cxx_static_address_0d82e9e4f6c1d2cef6d0dde4() {
  return __cxx_static_address_0d82e9e4f6c1d2cef6d0dde4.reference || (__cxx_static_address_0d82e9e4f6c1d2cef6d0dde4.reference = {
    __cReference: true,
    get value() { return savegame_projectilecnt; },
    set value(__cxx_lvalue_0) { savegame_projectilecnt = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/savegame.cpp:1451
export let savegame_labelcnt = 0;
function __cxx_static_address_a387a80d7bd26c0cbf88d5e0() {
  return __cxx_static_address_a387a80d7bd26c0cbf88d5e0.reference || (__cxx_static_address_a387a80d7bd26c0cbf88d5e0.reference = {
    __cReference: true,
    get value() { return savegame_labelcnt; },
    set value(__cxx_lvalue_0) { savegame_labelcnt = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/savegame.cpp:1452
export let savegame_labels = null;
function __cxx_static_address_24e4a5d20dfb9f4399176bb8() {
  return __cxx_static_address_24e4a5d20dfb9f4399176bb8.reference || (__cxx_static_address_24e4a5d20dfb9f4399176bb8.reference = {
    __cReference: true,
    get value() { return savegame_labels; },
    set value(__cxx_lvalue_0) { savegame_labels = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/duke3d/src/savegame.cpp:1458
export let savegame_restdata = new Uint8Array(11136);
function __cxx_static_address_8eb653b12d164d0dced119aa() {
  return __cxx_static_address_8eb653b12d164d0dced119aa.reference || (__cxx_static_address_8eb653b12d164d0dced119aa.reference = {
    __cReference: true,
    get value() { return savegame_restdata; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/savegame.cpp:1460
export let svgm_udnetw_string = (() => { const bytes = new Uint8Array(9); bytes.set([98, 108, 75, 58, 117, 100, 110, 116]); return bytes; })();
function __cxx_static_address_73d7540b04bcc2cd3e2292a0() {
  return __cxx_static_address_73d7540b04bcc2cd3e2292a0.reference || (__cxx_static_address_73d7540b04bcc2cd3e2292a0.reference = {
    __cReference: true,
    get value() { return svgm_udnetw_string; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/savegame.cpp:1507
export let svgm_secwsp_string = (() => { const bytes = new Uint8Array(9); bytes.set([98, 108, 75, 58, 115, 119, 115, 112]); return bytes; })();
function __cxx_static_address_1a4032a317f854afabb69ff7() {
  return __cxx_static_address_1a4032a317f854afabb69ff7.reference || (__cxx_static_address_1a4032a317f854afabb69ff7.reference = {
    __cReference: true,
    get value() { return svgm_secwsp_string; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/savegame.cpp:1555
export let svgm_script_string = (() => { const bytes = new Uint8Array(9); bytes.set([98, 108, 75, 58, 115, 99, 114, 105]); return bytes; })();
function __cxx_static_address_d06dbeb81f0248063333ee61() {
  return __cxx_static_address_d06dbeb81f0248063333ee61.reference || (__cxx_static_address_d06dbeb81f0248063333ee61.reference = {
    __cReference: true,
    get value() { return svgm_script_string; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/savegame.cpp:1575
export let svgm_anmisc_string = (() => { const bytes = new Uint8Array(9); bytes.set([98, 108, 75, 58, 97, 110, 109, 115]); return bytes; })();
function __cxx_static_address_8156dcc2bb785d0b99fe6266() {
  return __cxx_static_address_8156dcc2bb785d0b99fe6266.reference || (__cxx_static_address_8156dcc2bb785d0b99fe6266.reference = {
    __cReference: true,
    get value() { return svgm_anmisc_string; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/savegame.cpp:1607
export let svgm_vars = null;
function __cxx_static_address_2aa3ff1012bc3be08aa9206e() {
  return __cxx_static_address_2aa3ff1012bc3be08aa9206e.reference || (__cxx_static_address_2aa3ff1012bc3be08aa9206e.reference = {
    __cReference: true,
    get value() { return svgm_vars; },
    set value(__cxx_lvalue_0) { svgm_vars = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/duke3d/src/savegame.cpp:1613
export let svsnapsiz = 0;
function __cxx_static_address_f67c6b23ed625bdd2cfa3004() {
  return __cxx_static_address_f67c6b23ed625bdd2cfa3004.reference || (__cxx_static_address_f67c6b23ed625bdd2cfa3004.reference = {
    __cReference: true,
    get value() { return svsnapsiz; },
    set value(__cxx_lvalue_0) { svsnapsiz = u32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/savegame.cpp:1614
export let svsnapshot = null;
function __cxx_static_address_b517ecb1a49198a95b2e00ca() {
  return __cxx_static_address_b517ecb1a49198a95b2e00ca.reference || (__cxx_static_address_b517ecb1a49198a95b2e00ca.reference = {
    __cReference: true,
    get value() { return svsnapshot; },
    set value(__cxx_lvalue_0) { svsnapshot = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/duke3d/src/savegame.cpp:1615
export let svinitsnap = null;
function __cxx_static_address_56262cf880abeeefa6105b3d() {
  return __cxx_static_address_56262cf880abeeefa6105b3d.reference || (__cxx_static_address_56262cf880abeeefa6105b3d.reference = {
    __cReference: true,
    get value() { return svinitsnap; },
    set value(__cxx_lvalue_0) { svinitsnap = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/duke3d/src/savegame.cpp:1616
export let svdiffsiz = 0;
function __cxx_static_address_3f287110df62f556c808f481() {
  return __cxx_static_address_3f287110df62f556c808f481.reference || (__cxx_static_address_3f287110df62f556c808f481.reference = {
    __cReference: true,
    get value() { return svdiffsiz; },
    set value(__cxx_lvalue_0) { svdiffsiz = u32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/savegame.cpp:1617
export let svdiff = null;
function __cxx_static_address_98827c246a681c56c7e222e3() {
  return __cxx_static_address_98827c246a681c56c7e222e3.reference || (__cxx_static_address_98827c246a681c56c7e222e3.reference = {
    __cReference: true,
    get value() { return svdiff; },
    set value(__cxx_lvalue_0) { svdiff = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/duke3d/src/savegame.cpp:1623
export let svgm_vars_string = (() => { const bytes = new Uint8Array(9); bytes.set([98, 108, 75, 58, 118, 97, 114, 115]); return bytes; })();
function __cxx_static_address_bdc7fcb99e795273c638451e() {
  return __cxx_static_address_bdc7fcb99e795273c638451e.reference || (__cxx_static_address_bdc7fcb99e795273c638451e.reference = {
    __cReference: true,
    get value() { return svgm_vars_string; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_5ee7d96e69ece4cf = new Uint8Array([((1) & 255), ((2) & 255), ((4) & 255), ((8) & 255), ((16) & 255), ((32) & 255), ((64) & 255), ((128) & 255)]);
function __cxx_static_address_1f8968c56c4405a5a7a3ab5f() {
  return __cxx_static_address_1f8968c56c4405a5a7a3ab5f.reference || (__cxx_static_address_1f8968c56c4405a5a7a3ab5f.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_5ee7d96e69ece4cf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:172
export const g_defaultVideoModes__header_global_4b6f988111697d1c = cByteRecordNDArray({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, [25], {}, [cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 2560, "y": 1440}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 2560, "y": 1200}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 2560, "y": 1080}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1920, "y": 1440}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1920, "y": 1200}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1920, "y": 1080}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1680, "y": 1050}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1600, "y": 1200}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1600, "y": 900}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1366, "y": 768}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1280, "y": 1024}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1280, "y": 960}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1280, "y": 720}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1152, "y": 864}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1024, "y": 768}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1024, "y": 600}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 800, "y": 600}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 640, "y": 480}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 640, "y": 400}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 512, "y": 384}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 480, "y": 360}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 400, "y": 300}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 320, "y": 240}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 320, "y": 200}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 0, "y": 0}, null, {})]);
function __cxx_static_address_24a13c384e6fcc2bb7abf3b4() {
  return __cxx_static_address_24a13c384e6fcc2bb7abf3b4.reference || (__cxx_static_address_24a13c384e6fcc2bb7abf3b4.reference = {
    __cReference: true,
    get value() { return g_defaultVideoModes__header_global_4b6f988111697d1c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:188
export const g_keyAsciiTable__header_global_9250ce279eef7db5 = new Uint8Array([((0) & 255), ((0) & 255), 49, 50, 51, 52, 53, 54, 55, 56, 57, 48, 45, 61, ((0) & 255), ((0) & 255), 113, 119, 101, 114, 116, 121, 117, 105, 111, 112, 91, 93, ((0) & 255), ((0) & 255), 97, 115, 100, 102, 103, 104, 106, 107, 108, 59, ((39) & 255), 96, ((0) & 255), ((92) & 255), 122, 120, 99, 118, 98, 110, 109, 44, 46, 47, ((0) & 255), 42, ((0) & 255), ((32) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255)]);
function __cxx_static_address_301518fc550e7ebfa56b4952() {
  return __cxx_static_address_301518fc550e7ebfa56b4952.reference || (__cxx_static_address_301518fc550e7ebfa56b4952.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTable__header_global_9250ce279eef7db5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:196
export const g_keyAsciiTableShift__header_global_2cca0d4eeb3d67af = new Uint8Array([((0) & 255), ((0) & 255), 33, 64, 35, 36, 37, 94, 38, 42, 40, 41, 95, 43, ((0) & 255), ((0) & 255), 81, 87, 69, 82, 84, 89, 85, 73, 79, 80, 123, 125, ((0) & 255), ((0) & 255), 65, 83, 68, 70, 71, 72, 74, 75, 76, 58, 34, 126, ((0) & 255), 124, 90, 88, 67, 86, 66, 78, 77, 60, 62, 63, ((0) & 255), 42, ((0) & 255), ((32) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255)]);
function __cxx_static_address_b08920f6d5d823c1ca3f1854() {
  return __cxx_static_address_b08920f6d5d823c1ca3f1854.reference || (__cxx_static_address_b08920f6d5d823c1ca3f1854.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTableShift__header_global_2cca0d4eeb3d67af; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:895
export const pow2long__header_global_a7626817f59da003 = new Int32Array([1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576, 2097152, 4194304, 8388608, 16777216, 33554432, 67108864, 134217728, 268435456, 536870912, 1073741824, 2147483647]);
function __cxx_static_address_201c8f840659aab3cfbb22e7() {
  return __cxx_static_address_201c8f840659aab3cfbb22e7.reference || (__cxx_static_address_201c8f840659aab3cfbb22e7.reference = {
    __cReference: true,
    get value() { return pow2long__header_global_a7626817f59da003; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:907
export const pow2ulong__header_global_a74d88430d25c962 = new Uint32Array([u32(1), u32(2), u32(4), u32(8), u32(16), u32(32), u32(64), u32(128), u32(256), u32(512), u32(1024), u32(2048), u32(4096), u32(8192), u32(16384), u32(32768), u32(65536), u32(131072), u32(262144), u32(524288), u32(1048576), u32(2097152), u32(4194304), u32(8388608), u32(16777216), u32(33554432), u32(67108864), u32(134217728), u32(268435456), u32(536870912), u32(1073741824), u32(2147483648n)]);
function __cxx_static_address_53b18130ece629a333ff07b4() {
  return __cxx_static_address_53b18130ece629a333ff07b4.reference || (__cxx_static_address_53b18130ece629a333ff07b4.reference = {
    __cReference: true,
    get value() { return pow2ulong__header_global_a74d88430d25c962; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:919
export const pow264__header_global_326dcd8c3f4627de = new BigInt64Array([BigInt(i64(1)), BigInt(i64(2)), BigInt(i64(4)), BigInt(i64(8)), BigInt(i64(16)), BigInt(i64(32)), BigInt(i64(64)), BigInt(i64(128)), BigInt(i64(256)), BigInt(i64(512)), BigInt(i64(1024)), BigInt(i64(2048)), BigInt(i64(4096)), BigInt(i64(8192)), BigInt(i64(16384)), BigInt(i64(32768)), BigInt(i64(65536)), BigInt(i64(131072)), BigInt(i64(262144)), BigInt(i64(524288)), BigInt(i64(1048576)), BigInt(i64(2097152)), BigInt(i64(4194304)), BigInt(i64(8388608)), BigInt(i64(16777216)), BigInt(i64(33554432)), BigInt(i64(67108864)), BigInt(i64(134217728)), BigInt(i64(268435456)), BigInt(i64(536870912)), BigInt(i64(1073741824)), BigInt(2147483648n), BigInt(4294967296n), BigInt(8589934592n), BigInt(17179869184n), BigInt(34359738368n), BigInt(68719476736n), BigInt(137438953472n), BigInt(274877906944n), BigInt(549755813888n), BigInt(1099511627776n), BigInt(2199023255552n), BigInt(4398046511104n), BigInt(8796093022208n), BigInt(17592186044416n), BigInt(35184372088832n), BigInt(70368744177664n), BigInt(140737488355328n), BigInt(281474976710656n), BigInt(562949953421312n), BigInt(1125899906842624n), BigInt(2251799813685248n), BigInt(4503599627370496n), BigInt(9007199254740992n), BigInt(18014398509481984n), BigInt(36028797018963968n), BigInt(72057594037927936n), BigInt(144115188075855872n), BigInt(288230376151711744n), BigInt(576460752303423488n), BigInt(1152921504606846976n), BigInt(2305843009213693952n), BigInt(4611686018427387904n), BigInt(9223372036854775807n)]);
function __cxx_static_address_2faed0eca330e3e183c7e103() {
  return __cxx_static_address_2faed0eca330e3e183c7e103.reference || (__cxx_static_address_2faed0eca330e3e183c7e103.reference = {
    __cReference: true,
    get value() { return pow264__header_global_326dcd8c3f4627de; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/mact/include/keyboard.h:47
export const sctokeylut__header_global_b83e4528bf90134e = cByteRecordNDArray({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, [102], {}, [cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([69, 115, 99, 97, 112, 101, 0]), "sc": ((1) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([49, 0]), "sc": ((2) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([50, 0]), "sc": ((3) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([51, 0]), "sc": ((4) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([52, 0]), "sc": ((5) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([53, 0]), "sc": ((6) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([54, 0]), "sc": ((7) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([55, 0]), "sc": ((8) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([56, 0]), "sc": ((9) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([57, 0]), "sc": ((10) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([48, 0]), "sc": ((11) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([45, 0]), "sc": ((12) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([61, 0]), "sc": ((13) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([66, 97, 107, 83, 112, 99, 0]), "sc": ((14) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([84, 97, 98, 0]), "sc": ((15) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([81, 0]), "sc": ((16) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([87, 0]), "sc": ((17) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([69, 0]), "sc": ((18) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([82, 0]), "sc": ((19) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([84, 0]), "sc": ((20) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([89, 0]), "sc": ((21) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([85, 0]), "sc": ((22) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([73, 0]), "sc": ((23) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([79, 0]), "sc": ((24) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([80, 0]), "sc": ((25) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([91, 0]), "sc": ((26) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([93, 0]), "sc": ((27) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([69, 110, 116, 101, 114, 0]), "sc": ((28) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([76, 67, 116, 114, 108, 0]), "sc": ((29) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([65, 0]), "sc": ((30) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([83, 0]), "sc": ((31) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([68, 0]), "sc": ((32) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 0]), "sc": ((33) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([71, 0]), "sc": ((34) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([72, 0]), "sc": ((35) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([74, 0]), "sc": ((36) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 0]), "sc": ((37) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([76, 0]), "sc": ((38) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([59, 0]), "sc": ((39) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([39, 0]), "sc": ((40) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([96, 0]), "sc": ((41) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([76, 83, 104, 105, 102, 116, 0]), "sc": ((42) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([66, 97, 99, 107, 115, 108, 97, 115, 104, 0]), "sc": ((43) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([90, 0]), "sc": ((44) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([88, 0]), "sc": ((45) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([67, 0]), "sc": ((46) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([86, 0]), "sc": ((47) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([66, 0]), "sc": ((48) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([78, 0]), "sc": ((49) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([77, 0]), "sc": ((50) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([44, 0]), "sc": ((51) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([46, 0]), "sc": ((52) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([47, 0]), "sc": ((53) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([82, 83, 104, 105, 102, 116, 0]), "sc": ((54) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 42, 0]), "sc": ((55) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([76, 65, 108, 116, 0]), "sc": ((56) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([83, 112, 97, 99, 101, 0]), "sc": ((57) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([67, 97, 112, 76, 99, 107, 0]), "sc": ((58) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 49, 0]), "sc": ((59) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 50, 0]), "sc": ((60) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 51, 0]), "sc": ((61) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 52, 0]), "sc": ((62) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 53, 0]), "sc": ((63) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 54, 0]), "sc": ((64) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 55, 0]), "sc": ((65) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 56, 0]), "sc": ((66) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 57, 0]), "sc": ((67) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 49, 48, 0]), "sc": ((68) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([78, 117, 109, 76, 99, 107, 0]), "sc": ((69) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([83, 99, 114, 76, 99, 107, 0]), "sc": ((70) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 55, 0]), "sc": ((71) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 56, 0]), "sc": ((72) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 57, 0]), "sc": ((73) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 45, 0]), "sc": ((74) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 52, 0]), "sc": ((75) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 53, 0]), "sc": ((76) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 54, 0]), "sc": ((77) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 43, 0]), "sc": ((78) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 49, 0]), "sc": ((79) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 50, 0]), "sc": ((80) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 51, 0]), "sc": ((81) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 48, 0]), "sc": ((82) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 46, 0]), "sc": ((83) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([76, 101, 115, 115, 84, 104, 97, 110, 0]), "sc": ((86) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 49, 49, 0]), "sc": ((87) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 49, 50, 0]), "sc": ((88) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 100, 69, 110, 116, 0]), "sc": ((156) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([82, 67, 116, 114, 108, 0]), "sc": ((157) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 47, 0]), "sc": ((181) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([82, 65, 108, 116, 0]), "sc": ((184) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([80, 114, 116, 83, 99, 110, 0]), "sc": ((183) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([80, 97, 117, 115, 101, 0]), "sc": ((197) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([72, 111, 109, 101, 0]), "sc": ((199) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([85, 112, 0]), "sc": ((200) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([80, 103, 85, 112, 0]), "sc": ((201) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([76, 101, 102, 116, 0]), "sc": ((203) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([82, 105, 103, 104, 116, 0]), "sc": ((205) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([69, 110, 100, 0]), "sc": ((207) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([68, 111, 119, 110, 0]), "sc": ((208) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([80, 103, 68, 110, 0]), "sc": ((209) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([73, 110, 115, 101, 114, 116, 0]), "sc": ((210) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([68, 101, 108, 101, 116, 101, 0]), "sc": ((211) & 255)}, null, {})]);
function __cxx_static_address_e536aef5774c073b79ae3493() {
  return __cxx_static_address_e536aef5774c073b79ae3493.reference || (__cxx_static_address_e536aef5774c073b79ae3493.reference = {
    __cReference: true,
    get value() { return sctokeylut__header_global_b83e4528bf90134e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export function ARRAY_SIZE__header_2a5ca5489aab(arg0) {
  return u64(256n);
}

export function ARRAY_SIZE__header_31f2b76acec3(arg0) {
  return u64(32n);
}

export function SILENCE_UNUSED__header_08b2487aa027(arg0, arg1) {

}

export function ARRAY_SIZE__header_4848f7126b48(arg0) {
  return u64(13n);
}

export function bitmap_test__header_9bd82fad21c8(ptr, n) {

  return Boolean((i32((i32((cDeref(cPointerOffset(ptr, i32((n >> 3)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & i32((cDeref(cPointerOffset(pow2char__header_global_5ee7d96e69ece4cf, i32((n & 7)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))) == i32((cDeref(cPointerOffset(pow2char__header_global_5ee7d96e69ece4cf, i32((n & 7)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))));
}

export function ARRAY_SIZE__header_4cc993c9769e(arg0) {
  return u64(64n);
}

export function ARRAY_SIZE__header_0e1d3f51f54b(arg0) {
  return u64(2048n);
}

export function SILENCE_UNUSED__header_e162dd8bb0b1(arg0, arg1) {

}

// C/C++ source: source/build/include/smmalloc.h:866
export function _sm_realloc(allocator, p, bytesCount, alignment) {
  return cRecordObject(allocator).Realloc(p, bytesCount, alignment);
}

// C/C++ source: source/build/include/smmalloc.h:859
export function _sm_malloc(allocator, bytesCount, alignment) {
  return cRecordObject(allocator).Alloc(bytesCount, alignment);
}

// C/C++ source: source/build/include/smmalloc.h:864
export function _sm_free(allocator, p) {
  return cRecordObject(allocator).Free(p);
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
