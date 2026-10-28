// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/duke3d/src/sounds.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
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

// Implicit trivial C++ assignment changes destination storage in place. Existing
// references to its fields, arrays and overlapping union views retain identity.
// cCopyAggregate validates exact Clang storage schemas and snapshots the source
// before any mutation, including self-assignment or overlapping storage.
const cAssignAggregate = (destination, source, schema) => {
  const snapshot = cCopyAggregate(source, schema);
  cCopyAggregate(destination, schema);
  const commit = (target, value, shape) => {
    if (Object.hasOwn(shape, 'byteRecord')) {
      cByteRecordStorage.get(target).bytes.set(cByteRecordStorage.get(value).bytes);
    } else if (Object.hasOwn(shape,'pointerArray')) {
      target[Symbol.for('source-first.clang-byte-record-array/1')].set(value[Symbol.for('source-first.clang-byte-record-array/1')]);
    } else if (Object.hasOwn(shape, 'bytes') || Object.hasOwn(shape, 'array')) {
      target.set(value);
    } else if (Object.hasOwn(shape, 'record')) {
      for (const [name, field] of Object.entries(shape.record)) {
        if (Object.hasOwn(field, 'scalar') || Object.hasOwn(field, 'pointer')) target[name] = value[name];
        else commit(target[name], value[name], field);
      }
    } else throw new TypeError('C++ assignment requires original aggregate storage');
  };
  commit(destination, snapshot, schema);
  return destination;
};

const i32 = value => Number(value) | 0;
const u32 = value => Number(value) >>> 0;
const i64 = value => BigInt.asIntN(64, BigInt(value));
const u64 = value => BigInt.asUintN(64, BigInt(value));

// C/C++ source: source/build/include/fix16.h:111
export const fix16_rad_to_deg_mult__header_global_8a90be9c0d798c0d = i32(3754936);
function __cxx_static_address_1b7771a086cc37d0780df73e() {
  return __cxx_static_address_1b7771a086cc37d0780df73e.reference || (__cxx_static_address_1b7771a086cc37d0780df73e.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_8a90be9c0d798c0d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_268f7e59b91f83aa = i32(1144);
function __cxx_static_address_bb6c8ae4b3e60d67d1616072() {
  return __cxx_static_address_bb6c8ae4b3e60d67d1616072.reference || (__cxx_static_address_bb6c8ae4b3e60d67d1616072.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_268f7e59b91f83aa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:43
export const KICK_HIT____header_global_8093db5d58160a66 = ((((((0) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8b24a04b509c9789804dad62() {
  return __cxx_static_address_8b24a04b509c9789804dad62.reference || (__cxx_static_address_8b24a04b509c9789804dad62.reference = {
    __cReference: true,
    get value() { return KICK_HIT____header_global_8093db5d58160a66; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:44
export const PISTOL_RICOCHET____header_global_68e7743a70fb54ef = ((((((1) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a1c519cfa0bc31680553505d() {
  return __cxx_static_address_a1c519cfa0bc31680553505d.reference || (__cxx_static_address_a1c519cfa0bc31680553505d.reference = {
    __cReference: true,
    get value() { return PISTOL_RICOCHET____header_global_68e7743a70fb54ef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:45
export const PISTOL_BODYHIT____header_global_3c227c16938653c0 = ((((((2) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_288da62e5a18d9dcb588b138() {
  return __cxx_static_address_288da62e5a18d9dcb588b138.reference || (__cxx_static_address_288da62e5a18d9dcb588b138.reference = {
    __cReference: true,
    get value() { return PISTOL_BODYHIT____header_global_3c227c16938653c0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:46
export const PISTOL_FIRE____header_global_4402eadb8f24c1d7 = ((((((3) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6402683dbf9c2100c6dd45be() {
  return __cxx_static_address_6402683dbf9c2100c6dd45be.reference || (__cxx_static_address_6402683dbf9c2100c6dd45be.reference = {
    __cReference: true,
    get value() { return PISTOL_FIRE____header_global_4402eadb8f24c1d7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:47
export const EJECT_CLIP____header_global_2ac4498734977a0c = ((((((4) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2edbad10925736d43d8d4e04() {
  return __cxx_static_address_2edbad10925736d43d8d4e04.reference || (__cxx_static_address_2edbad10925736d43d8d4e04.reference = {
    __cReference: true,
    get value() { return EJECT_CLIP____header_global_2ac4498734977a0c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:48
export const INSERT_CLIP____header_global_2c05396ce8e3976d = ((((((5) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4a0a64e15bd0f3bd2153cdb0() {
  return __cxx_static_address_4a0a64e15bd0f3bd2153cdb0.reference || (__cxx_static_address_4a0a64e15bd0f3bd2153cdb0.reference = {
    __cReference: true,
    get value() { return INSERT_CLIP____header_global_2c05396ce8e3976d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:49
export const CHAINGUN_FIRE____header_global_0de349892ebc2b35 = ((((((6) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_26f488484fd6fdc198176757() {
  return __cxx_static_address_26f488484fd6fdc198176757.reference || (__cxx_static_address_26f488484fd6fdc198176757.reference = {
    __cReference: true,
    get value() { return CHAINGUN_FIRE____header_global_0de349892ebc2b35; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:50
export const RPG_SHOOT____header_global_c03ba070fa05c597 = ((((((7) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_46352e80251725fbc84edc39() {
  return __cxx_static_address_46352e80251725fbc84edc39.reference || (__cxx_static_address_46352e80251725fbc84edc39.reference = {
    __cReference: true,
    get value() { return RPG_SHOOT____header_global_c03ba070fa05c597; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:51
export const POOLBALLHIT____header_global_4c452c62a3add1b9 = ((((((8) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aa4895456cbebacce7e6e2f4() {
  return __cxx_static_address_aa4895456cbebacce7e6e2f4.reference || (__cxx_static_address_aa4895456cbebacce7e6e2f4.reference = {
    __cReference: true,
    get value() { return POOLBALLHIT____header_global_4c452c62a3add1b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:52
export const RPG_EXPLODE____header_global_512f0d76e4187452 = ((((((9) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a2f5b74111859d0bd97f75b2() {
  return __cxx_static_address_a2f5b74111859d0bd97f75b2.reference || (__cxx_static_address_a2f5b74111859d0bd97f75b2.reference = {
    __cReference: true,
    get value() { return RPG_EXPLODE____header_global_512f0d76e4187452; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:53
export const CAT_FIRE____header_global_d4b11ef182acfdb9 = ((((((10) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8a0e5551f588d198274c89e9() {
  return __cxx_static_address_8a0e5551f588d198274c89e9.reference || (__cxx_static_address_8a0e5551f588d198274c89e9.reference = {
    __cReference: true,
    get value() { return CAT_FIRE____header_global_d4b11ef182acfdb9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:54
export const SHRINKER_FIRE____header_global_65ce5b072b82f5cc = ((((((11) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_78c7b2245ae819858d21bed1() {
  return __cxx_static_address_78c7b2245ae819858d21bed1.reference || (__cxx_static_address_78c7b2245ae819858d21bed1.reference = {
    __cReference: true,
    get value() { return SHRINKER_FIRE____header_global_65ce5b072b82f5cc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:55
export const PIPEBOMB_BOUNCE____header_global_953e9f3ed8c6b7de = ((((((13) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_311e3d42c97ee33e22adeff1() {
  return __cxx_static_address_311e3d42c97ee33e22adeff1.reference || (__cxx_static_address_311e3d42c97ee33e22adeff1.reference = {
    __cReference: true,
    get value() { return PIPEBOMB_BOUNCE____header_global_953e9f3ed8c6b7de; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:56
export const PIPEBOMB_EXPLODE____header_global_188aa6ab9860c326 = ((((((14) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6aec6b3491f953750a031d41() {
  return __cxx_static_address_6aec6b3491f953750a031d41.reference || (__cxx_static_address_6aec6b3491f953750a031d41.reference = {
    __cReference: true,
    get value() { return PIPEBOMB_EXPLODE____header_global_188aa6ab9860c326; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:57
export const LASERTRIP_ONWALL____header_global_11833dbf249e6e85 = ((((((15) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_296246e67ee6f3fa3b979987() {
  return __cxx_static_address_296246e67ee6f3fa3b979987.reference || (__cxx_static_address_296246e67ee6f3fa3b979987.reference = {
    __cReference: true,
    get value() { return LASERTRIP_ONWALL____header_global_11833dbf249e6e85; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:58
export const LASERTRIP_ARMING____header_global_5fb8a4f38b4d0751 = ((((((16) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_00dd643acf773a576502c244() {
  return __cxx_static_address_00dd643acf773a576502c244.reference || (__cxx_static_address_00dd643acf773a576502c244.reference = {
    __cReference: true,
    get value() { return LASERTRIP_ARMING____header_global_5fb8a4f38b4d0751; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:59
export const LASERTRIP_EXPLODE____header_global_f7bdc7705d2ae4b1 = ((((((17) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cf53adb419c4a0f752083f68() {
  return __cxx_static_address_cf53adb419c4a0f752083f68.reference || (__cxx_static_address_cf53adb419c4a0f752083f68.reference = {
    __cReference: true,
    get value() { return LASERTRIP_EXPLODE____header_global_f7bdc7705d2ae4b1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:60
export const VENT_BUST____header_global_1c4780b10e2361aa = ((((((18) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_36df3597729965ebc4ae79cb() {
  return __cxx_static_address_36df3597729965ebc4ae79cb.reference || (__cxx_static_address_36df3597729965ebc4ae79cb.reference = {
    __cReference: true,
    get value() { return VENT_BUST____header_global_1c4780b10e2361aa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:61
export const GLASS_BREAKING____header_global_65e8b7e01748b1ec = ((((((19) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d96c59245c6520143af9110e() {
  return __cxx_static_address_d96c59245c6520143af9110e.reference || (__cxx_static_address_d96c59245c6520143af9110e.reference = {
    __cReference: true,
    get value() { return GLASS_BREAKING____header_global_65e8b7e01748b1ec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:62
export const GLASS_HEAVYBREAK____header_global_1f17966500cb6ac5 = ((((((20) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_355169e22ad934035fce7086() {
  return __cxx_static_address_355169e22ad934035fce7086.reference || (__cxx_static_address_355169e22ad934035fce7086.reference = {
    __cReference: true,
    get value() { return GLASS_HEAVYBREAK____header_global_1f17966500cb6ac5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:63
export const SHORT_CIRCUIT____header_global_e615fef76b1028d7 = ((((((21) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6ae0c0ce9b9bb0107ae4f3b7() {
  return __cxx_static_address_6ae0c0ce9b9bb0107ae4f3b7.reference || (__cxx_static_address_6ae0c0ce9b9bb0107ae4f3b7.reference = {
    __cReference: true,
    get value() { return SHORT_CIRCUIT____header_global_e615fef76b1028d7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:64
export const ITEM_SPLASH____header_global_20140d197360a067 = ((((((22) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_063ffa1bba4383295071c97a() {
  return __cxx_static_address_063ffa1bba4383295071c97a.reference || (__cxx_static_address_063ffa1bba4383295071c97a.reference = {
    __cReference: true,
    get value() { return ITEM_SPLASH____header_global_20140d197360a067; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:65
export const DUKE_GASP____header_global_20da350535216912 = ((((((25) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_df1fed2dfde97a82711211ff() {
  return __cxx_static_address_df1fed2dfde97a82711211ff.reference || (__cxx_static_address_df1fed2dfde97a82711211ff.reference = {
    __cReference: true,
    get value() { return DUKE_GASP____header_global_20da350535216912; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:66
export const SLIM_RECOG____header_global_1d42750550062c55 = ((((((26) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d51fd29b7c39a6d6f0bc3369() {
  return __cxx_static_address_d51fd29b7c39a6d6f0bc3369.reference || (__cxx_static_address_d51fd29b7c39a6d6f0bc3369.reference = {
    __cReference: true,
    get value() { return SLIM_RECOG____header_global_1d42750550062c55; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:67
export const DUKE_URINATE____header_global_f59ec68164d3629f = ((((((28) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bbe6272fa44a1a0c26179dfa() {
  return __cxx_static_address_bbe6272fa44a1a0c26179dfa.reference || (__cxx_static_address_bbe6272fa44a1a0c26179dfa.reference = {
    __cReference: true,
    get value() { return DUKE_URINATE____header_global_f59ec68164d3629f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:68
export const ENDSEQVOL3SND2____header_global_318d967270726a0a = ((((((29) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e3533b2f9e4f588be3ea23d() {
  return __cxx_static_address_1e3533b2f9e4f588be3ea23d.reference || (__cxx_static_address_1e3533b2f9e4f588be3ea23d.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND2____header_global_318d967270726a0a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:69
export const ENDSEQVOL3SND3____header_global_f45f41e2a8e9fe2a = ((((((30) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ea04a73a720eaabddbd53987() {
  return __cxx_static_address_ea04a73a720eaabddbd53987.reference || (__cxx_static_address_ea04a73a720eaabddbd53987.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND3____header_global_f45f41e2a8e9fe2a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:70
export const DUKE_CRACK____header_global_011bb71fe869e6d2 = ((((((33) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5f17149b4e324657aef4bd63() {
  return __cxx_static_address_5f17149b4e324657aef4bd63.reference || (__cxx_static_address_5f17149b4e324657aef4bd63.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK____header_global_011bb71fe869e6d2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:71
export const SLIM_ATTACK____header_global_dd038cacd8a6a818 = ((((((34) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_23355af1d818ab54d46d379f() {
  return __cxx_static_address_23355af1d818ab54d46d379f.reference || (__cxx_static_address_23355af1d818ab54d46d379f.reference = {
    __cReference: true,
    get value() { return SLIM_ATTACK____header_global_dd038cacd8a6a818; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:72
export const SOMETHINGHITFORCE____header_global_ce4efa9a26c0b559 = ((((((35) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e9991bf0f2de3428c0cb6af9() {
  return __cxx_static_address_e9991bf0f2de3428c0cb6af9.reference || (__cxx_static_address_e9991bf0f2de3428c0cb6af9.reference = {
    __cReference: true,
    get value() { return SOMETHINGHITFORCE____header_global_ce4efa9a26c0b559; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:73
export const DUKE_DRINKING____header_global_6df6556a5038b475 = ((((((36) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f8b2e4c12bc30baf6824ba8b() {
  return __cxx_static_address_f8b2e4c12bc30baf6824ba8b.reference || (__cxx_static_address_f8b2e4c12bc30baf6824ba8b.reference = {
    __cReference: true,
    get value() { return DUKE_DRINKING____header_global_6df6556a5038b475; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:74
export const DUKE_GRUNT____header_global_053af4f616fc3f5a = ((((((38) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5db9dc6e9f1ffb715bd124af() {
  return __cxx_static_address_5db9dc6e9f1ffb715bd124af.reference || (__cxx_static_address_5db9dc6e9f1ffb715bd124af.reference = {
    __cReference: true,
    get value() { return DUKE_GRUNT____header_global_053af4f616fc3f5a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:75
export const DUKE_HARTBEAT____header_global_8cfd98d1de93dcf6 = ((((((39) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_464bf7a454dc3a488cc8cc1f() {
  return __cxx_static_address_464bf7a454dc3a488cc8cc1f.reference || (__cxx_static_address_464bf7a454dc3a488cc8cc1f.reference = {
    __cReference: true,
    get value() { return DUKE_HARTBEAT____header_global_8cfd98d1de93dcf6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:76
export const DUKE_ONWATER____header_global_3cbffd92aa4066e7 = ((((((40) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cb0c68d181bb5c216de60e09() {
  return __cxx_static_address_cb0c68d181bb5c216de60e09.reference || (__cxx_static_address_cb0c68d181bb5c216de60e09.reference = {
    __cReference: true,
    get value() { return DUKE_ONWATER____header_global_3cbffd92aa4066e7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:77
export const DUKE_LAND____header_global_e5d57ca43ecd38ee = ((((((42) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_46fd1c9ef1518656c7e28069() {
  return __cxx_static_address_46fd1c9ef1518656c7e28069.reference || (__cxx_static_address_46fd1c9ef1518656c7e28069.reference = {
    __cReference: true,
    get value() { return DUKE_LAND____header_global_e5d57ca43ecd38ee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:78
export const DUKE_WALKINDUCTS____header_global_07d2c33eb7b088c8 = ((((((43) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_17960d4ee60f9941cd91352a() {
  return __cxx_static_address_17960d4ee60f9941cd91352a.reference || (__cxx_static_address_17960d4ee60f9941cd91352a.reference = {
    __cReference: true,
    get value() { return DUKE_WALKINDUCTS____header_global_07d2c33eb7b088c8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:79
export const DUKE_UNDERWATER____header_global_743ed1ccbd1450d2 = ((((((48) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_76b038c9346da1c1d56b6c5e() {
  return __cxx_static_address_76b038c9346da1c1d56b6c5e.reference || (__cxx_static_address_76b038c9346da1c1d56b6c5e.reference = {
    __cReference: true,
    get value() { return DUKE_UNDERWATER____header_global_743ed1ccbd1450d2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:80
export const DUKE_JETPACK_ON____header_global_1e5263ce0b97a5cf = ((((((49) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5d9e2da8473c2461a18e0407() {
  return __cxx_static_address_5d9e2da8473c2461a18e0407.reference || (__cxx_static_address_5d9e2da8473c2461a18e0407.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_ON____header_global_1e5263ce0b97a5cf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:81
export const DUKE_JETPACK_IDLE____header_global_c067df9fcfac4c98 = ((((((50) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_240815a455243bca8688610a() {
  return __cxx_static_address_240815a455243bca8688610a.reference || (__cxx_static_address_240815a455243bca8688610a.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_IDLE____header_global_c067df9fcfac4c98; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:82
export const DUKE_JETPACK_OFF____header_global_a6a90bc1b6a5350c = ((((((51) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bce3f3d30b42b769d93e9209() {
  return __cxx_static_address_bce3f3d30b42b769d93e9209.reference || (__cxx_static_address_bce3f3d30b42b769d93e9209.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_OFF____header_global_a6a90bc1b6a5350c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:83
export const DUKETALKTOBOSS____header_global_4f45e668f5d91067 = ((((((56) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1acc1d2d42dc397b2b93ed14() {
  return __cxx_static_address_1acc1d2d42dc397b2b93ed14.reference || (__cxx_static_address_1acc1d2d42dc397b2b93ed14.reference = {
    __cReference: true,
    get value() { return DUKETALKTOBOSS____header_global_4f45e668f5d91067; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:84
export const SQUISHED____header_global_5f2dcfea7cf6fcf4 = ((((((69) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_46f15c8b417a94f602a0f004() {
  return __cxx_static_address_46f15c8b417a94f602a0f004.reference || (__cxx_static_address_46f15c8b417a94f602a0f004.reference = {
    __cReference: true,
    get value() { return SQUISHED____header_global_5f2dcfea7cf6fcf4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:85
export const TELEPORTER____header_global_e0d0b22fef1720de = ((((((70) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cb262aff1b092aa142fe852a() {
  return __cxx_static_address_cb262aff1b092aa142fe852a.reference || (__cxx_static_address_cb262aff1b092aa142fe852a.reference = {
    __cReference: true,
    get value() { return TELEPORTER____header_global_e0d0b22fef1720de; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:86
export const ELEVATOR_ON____header_global_ddde1c5e1995078c = ((((((71) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_58321531049f1ff643b0fcd7() {
  return __cxx_static_address_58321531049f1ff643b0fcd7.reference || (__cxx_static_address_58321531049f1ff643b0fcd7.reference = {
    __cReference: true,
    get value() { return ELEVATOR_ON____header_global_ddde1c5e1995078c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:87
export const ELEVATOR_OFF____header_global_d77ef36dfaae45b4 = ((((((73) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3fba87d597cb0de4e5c4d8e8() {
  return __cxx_static_address_3fba87d597cb0de4e5c4d8e8.reference || (__cxx_static_address_3fba87d597cb0de4e5c4d8e8.reference = {
    __cReference: true,
    get value() { return ELEVATOR_OFF____header_global_d77ef36dfaae45b4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:88
export const SUBWAY____header_global_711bf10e62bfb56f = ((((((75) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d1695cf06816f3631e47734f() {
  return __cxx_static_address_d1695cf06816f3631e47734f.reference || (__cxx_static_address_d1695cf06816f3631e47734f.reference = {
    __cReference: true,
    get value() { return SUBWAY____header_global_711bf10e62bfb56f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:89
export const SWITCH_ON____header_global_dc7b3cb281a6de19 = ((((((76) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_70cddc57db8e103e92ba7832() {
  return __cxx_static_address_70cddc57db8e103e92ba7832.reference || (__cxx_static_address_70cddc57db8e103e92ba7832.reference = {
    __cReference: true,
    get value() { return SWITCH_ON____header_global_dc7b3cb281a6de19; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:90
export const FLUSH_TOILET____header_global_6a9911a94bb5c4a3 = ((((((79) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c6807868f2319248f636bf70() {
  return __cxx_static_address_c6807868f2319248f636bf70.reference || (__cxx_static_address_c6807868f2319248f636bf70.reference = {
    __cReference: true,
    get value() { return FLUSH_TOILET____header_global_6a9911a94bb5c4a3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:91
export const EARTHQUAKE____header_global_856f09ff0777fe51 = ((((((81) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_88382af62a06bb62e301e569() {
  return __cxx_static_address_88382af62a06bb62e301e569.reference || (__cxx_static_address_88382af62a06bb62e301e569.reference = {
    __cReference: true,
    get value() { return EARTHQUAKE____header_global_856f09ff0777fe51; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:92
export const END_OF_LEVEL_WARN____header_global_33ac588c7d78e982 = ((((((83) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aaae1ee42d4d4ebd0c980452() {
  return __cxx_static_address_aaae1ee42d4d4ebd0c980452.reference || (__cxx_static_address_aaae1ee42d4d4ebd0c980452.reference = {
    __cReference: true,
    get value() { return END_OF_LEVEL_WARN____header_global_33ac588c7d78e982; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:93
export const WIND_AMBIENCE____header_global_c57f813d4d3c863d = ((((((91) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e41c3676ec50c7621890ba2() {
  return __cxx_static_address_1e41c3676ec50c7621890ba2.reference || (__cxx_static_address_1e41c3676ec50c7621890ba2.reference = {
    __cReference: true,
    get value() { return WIND_AMBIENCE____header_global_c57f813d4d3c863d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:94
export const SOMETHING_DRIPPING____header_global_238eb5403acd766c = ((((((92) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cb90c03fa212dcd7633af9e9() {
  return __cxx_static_address_cb90c03fa212dcd7633af9e9.reference || (__cxx_static_address_cb90c03fa212dcd7633af9e9.reference = {
    __cReference: true,
    get value() { return SOMETHING_DRIPPING____header_global_238eb5403acd766c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:95
export const BOS1_RECOG____header_global_4a4853b71bd602b1 = ((((((97) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e3f6ed1b58ab2a8e86bc3e96() {
  return __cxx_static_address_e3f6ed1b58ab2a8e86bc3e96.reference || (__cxx_static_address_e3f6ed1b58ab2a8e86bc3e96.reference = {
    __cReference: true,
    get value() { return BOS1_RECOG____header_global_4a4853b71bd602b1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:96
export const BOS2_RECOG____header_global_d85e309a2bd6486d = ((((((102) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0dd8e9ddb6bf0bb8db860084() {
  return __cxx_static_address_0dd8e9ddb6bf0bb8db860084.reference || (__cxx_static_address_0dd8e9ddb6bf0bb8db860084.reference = {
    __cReference: true,
    get value() { return BOS2_RECOG____header_global_d85e309a2bd6486d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:97
export const DUKE_GETWEAPON2____header_global_719be7158ffc21d3 = ((((((107) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_36a9ffb0444c45fef7ab9c81() {
  return __cxx_static_address_36a9ffb0444c45fef7ab9c81.reference || (__cxx_static_address_36a9ffb0444c45fef7ab9c81.reference = {
    __cReference: true,
    get value() { return DUKE_GETWEAPON2____header_global_719be7158ffc21d3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:98
export const SHOTGUN_FIRE____header_global_66714b7ebc2c096b = ((((((109) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7a90b4ffb3c381dcd8d9558b() {
  return __cxx_static_address_7a90b4ffb3c381dcd8d9558b.reference || (__cxx_static_address_7a90b4ffb3c381dcd8d9558b.reference = {
    __cReference: true,
    get value() { return SHOTGUN_FIRE____header_global_66714b7ebc2c096b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:99
export const PRED_RECOG____header_global_113b2f82d3dcc5a4 = ((((((111) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_de7d732d9a35a1eeea064761() {
  return __cxx_static_address_de7d732d9a35a1eeea064761.reference || (__cxx_static_address_de7d732d9a35a1eeea064761.reference = {
    __cReference: true,
    get value() { return PRED_RECOG____header_global_113b2f82d3dcc5a4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:100
export const CAPT_RECOG____header_global_63cb3600b99ad677 = ((((((117) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1618d46a186bf7beb643cf5a() {
  return __cxx_static_address_1618d46a186bf7beb643cf5a.reference || (__cxx_static_address_1618d46a186bf7beb643cf5a.reference = {
    __cReference: true,
    get value() { return CAPT_RECOG____header_global_63cb3600b99ad677; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:101
export const PIG_RECOG____header_global_d7d4a6653d6e8a0b = ((((((121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6cbd5f25917c773f31591d5f() {
  return __cxx_static_address_6cbd5f25917c773f31591d5f.reference || (__cxx_static_address_6cbd5f25917c773f31591d5f.reference = {
    __cReference: true,
    get value() { return PIG_RECOG____header_global_d7d4a6653d6e8a0b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:102
export const RECO_ROAM____header_global_3b29993908833a01 = ((((((125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c03d29fb47764fa5adebd994() {
  return __cxx_static_address_c03d29fb47764fa5adebd994.reference || (__cxx_static_address_c03d29fb47764fa5adebd994.reference = {
    __cReference: true,
    get value() { return RECO_ROAM____header_global_3b29993908833a01; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:103
export const RECO_RECOG____header_global_42cd53fbe8a090ca = ((((((126) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6f720007f8958f28dee304f8() {
  return __cxx_static_address_6f720007f8958f28dee304f8.reference || (__cxx_static_address_6f720007f8958f28dee304f8.reference = {
    __cReference: true,
    get value() { return RECO_RECOG____header_global_42cd53fbe8a090ca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:104
export const RECO_ATTACK____header_global_95b87795587663a7 = ((((((127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2b967b3c2f36c5a32c9681a3() {
  return __cxx_static_address_2b967b3c2f36c5a32c9681a3.reference || (__cxx_static_address_2b967b3c2f36c5a32c9681a3.reference = {
    __cReference: true,
    get value() { return RECO_ATTACK____header_global_95b87795587663a7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:105
export const RECO_PAIN____header_global_e6eb8a09ce57adc0 = ((((((128) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0a16fdf189e47cadd500db2e() {
  return __cxx_static_address_0a16fdf189e47cadd500db2e.reference || (__cxx_static_address_0a16fdf189e47cadd500db2e.reference = {
    __cReference: true,
    get value() { return RECO_PAIN____header_global_e6eb8a09ce57adc0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:106
export const DRON_RECOG____header_global_88876608b23d3ae4 = ((((((131) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b57058aa8d8f3dec69f4a0cc() {
  return __cxx_static_address_b57058aa8d8f3dec69f4a0cc.reference || (__cxx_static_address_b57058aa8d8f3dec69f4a0cc.reference = {
    __cReference: true,
    get value() { return DRON_RECOG____header_global_88876608b23d3ae4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:107
export const COMM_RECOG____header_global_d8486891ff4e2210 = ((((((136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_24d233893543d273d5beac45() {
  return __cxx_static_address_24d233893543d273d5beac45.reference || (__cxx_static_address_24d233893543d273d5beac45.reference = {
    __cReference: true,
    get value() { return COMM_RECOG____header_global_d8486891ff4e2210; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:108
export const OCTA_RECOG____header_global_cf736239e48367e2 = ((((((141) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8246d0ae0b96cfe41ad9ea9c() {
  return __cxx_static_address_8246d0ae0b96cfe41ad9ea9c.reference || (__cxx_static_address_8246d0ae0b96cfe41ad9ea9c.reference = {
    __cReference: true,
    get value() { return OCTA_RECOG____header_global_cf736239e48367e2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:109
export const TURR_RECOG____header_global_600417e2f9b6709a = ((((((146) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_557c25a907a27f4690ef85ba() {
  return __cxx_static_address_557c25a907a27f4690ef85ba.reference || (__cxx_static_address_557c25a907a27f4690ef85ba.reference = {
    __cReference: true,
    get value() { return TURR_RECOG____header_global_600417e2f9b6709a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:110
export const SLIM_DYING____header_global_7ae52a70427a835b = ((((((149) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_033b68a85b5c9438f0f4b2c7() {
  return __cxx_static_address_033b68a85b5c9438f0f4b2c7.reference || (__cxx_static_address_033b68a85b5c9438f0f4b2c7.reference = {
    __cReference: true,
    get value() { return SLIM_DYING____header_global_7ae52a70427a835b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:111
export const BOS3_RECOG____header_global_44ab1dffe35adf70 = ((((((151) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_66b35fd70382a31d15e4551b() {
  return __cxx_static_address_66b35fd70382a31d15e4551b.reference || (__cxx_static_address_66b35fd70382a31d15e4551b.reference = {
    __cReference: true,
    get value() { return BOS3_RECOG____header_global_44ab1dffe35adf70; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:112
export const BOS1_WALK____header_global_68840519b1710f7a = ((((((156) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0e524427061a4730953d07c1() {
  return __cxx_static_address_0e524427061a4730953d07c1.reference || (__cxx_static_address_0e524427061a4730953d07c1.reference = {
    __cReference: true,
    get value() { return BOS1_WALK____header_global_68840519b1710f7a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:113
export const THUD____header_global_2a40777e6caf38e4 = ((((((158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d38298a1bea36cd7dd324f16() {
  return __cxx_static_address_d38298a1bea36cd7dd324f16.reference || (__cxx_static_address_d38298a1bea36cd7dd324f16.reference = {
    __cReference: true,
    get value() { return THUD____header_global_2a40777e6caf38e4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:114
export const WIERDSHOT_FLY____header_global_51eec96dbcd8076f = ((((((160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c7e32c16dba82e0d293e62e4() {
  return __cxx_static_address_c7e32c16dba82e0d293e62e4.reference || (__cxx_static_address_c7e32c16dba82e0d293e62e4.reference = {
    __cReference: true,
    get value() { return WIERDSHOT_FLY____header_global_51eec96dbcd8076f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:115
export const SLIM_ROAM____header_global_6c4ea33723868744 = ((((((163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9f01e2137ff0762a9052c95a() {
  return __cxx_static_address_9f01e2137ff0762a9052c95a.reference || (__cxx_static_address_9f01e2137ff0762a9052c95a.reference = {
    __cReference: true,
    get value() { return SLIM_ROAM____header_global_6c4ea33723868744; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:116
export const SHOTGUN_COCK____header_global_15c35edaf42ad5f4 = ((((((169) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4840c98f2dd421586cde060b() {
  return __cxx_static_address_4840c98f2dd421586cde060b.reference || (__cxx_static_address_4840c98f2dd421586cde060b.reference = {
    __cReference: true,
    get value() { return SHOTGUN_COCK____header_global_15c35edaf42ad5f4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:117
export const GENERIC_AMBIENCE17____header_global_b066e506735fe51b = ((((((177) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6c801dd4c544580501975b44() {
  return __cxx_static_address_6c801dd4c544580501975b44.reference || (__cxx_static_address_6c801dd4c544580501975b44.reference = {
    __cReference: true,
    get value() { return GENERIC_AMBIENCE17____header_global_b066e506735fe51b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:118
export const BONUS_SPEECH1____header_global_ab7118a89ff11535 = ((((((195) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5f0625978d0144ad93a2885b() {
  return __cxx_static_address_5f0625978d0144ad93a2885b.reference || (__cxx_static_address_5f0625978d0144ad93a2885b.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH1____header_global_ab7118a89ff11535; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:119
export const BONUS_SPEECH2____header_global_31d300ba4445b86b = ((((((196) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4d47ea5f4b7fac08615c123e() {
  return __cxx_static_address_4d47ea5f4b7fac08615c123e.reference || (__cxx_static_address_4d47ea5f4b7fac08615c123e.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH2____header_global_31d300ba4445b86b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:120
export const BONUS_SPEECH3____header_global_ee5335b46e4d4537 = ((((((197) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a08db2a070e9a1aa1e10c9a1() {
  return __cxx_static_address_a08db2a070e9a1aa1e10c9a1.reference || (__cxx_static_address_a08db2a070e9a1aa1e10c9a1.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH3____header_global_ee5335b46e4d4537; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:121
export const BONUS_SPEECH4____header_global_d2a134c7b247add0 = ((((((199) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7ed2d3e6f4187e9c1a1db805() {
  return __cxx_static_address_7ed2d3e6f4187e9c1a1db805.reference || (__cxx_static_address_7ed2d3e6f4187e9c1a1db805.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH4____header_global_d2a134c7b247add0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:122
export const DUKE_LAND_HURT____header_global_ea6c16ef121c5fc6 = ((((((200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_137e90dab4371b2b863454ab() {
  return __cxx_static_address_137e90dab4371b2b863454ab.reference || (__cxx_static_address_137e90dab4371b2b863454ab.reference = {
    __cReference: true,
    get value() { return DUKE_LAND_HURT____header_global_ea6c16ef121c5fc6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:123
export const DUKE_SEARCH2____header_global_8f452d52cd6423c7 = ((((((207) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b97c21d14693f3bfc19aea12() {
  return __cxx_static_address_b97c21d14693f3bfc19aea12.reference || (__cxx_static_address_b97c21d14693f3bfc19aea12.reference = {
    __cReference: true,
    get value() { return DUKE_SEARCH2____header_global_8f452d52cd6423c7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:124
export const DUKE_CRACK2____header_global_d55a5d6b55ba62a9 = ((((((208) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5c130155c43930ab2ef36d47() {
  return __cxx_static_address_5c130155c43930ab2ef36d47.reference || (__cxx_static_address_5c130155c43930ab2ef36d47.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK2____header_global_d55a5d6b55ba62a9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:125
export const DUKE_SEARCH____header_global_3c1bd66f7e1b62a7 = ((((((209) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c4ba6fb27c74d663132778eb() {
  return __cxx_static_address_c4ba6fb27c74d663132778eb.reference || (__cxx_static_address_c4ba6fb27c74d663132778eb.reference = {
    __cReference: true,
    get value() { return DUKE_SEARCH____header_global_3c1bd66f7e1b62a7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:126
export const DUKE_GET____header_global_2c850b574df5760b = ((((((210) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2cd4fd85b8c6f42a3d832885() {
  return __cxx_static_address_2cd4fd85b8c6f42a3d832885.reference || (__cxx_static_address_2cd4fd85b8c6f42a3d832885.reference = {
    __cReference: true,
    get value() { return DUKE_GET____header_global_2c850b574df5760b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:127
export const DUKE_LONGTERM_PAIN____header_global_3d81c8a3b7123ef7 = ((((((211) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1f0b0a93748e9cb9a5ecf7d1() {
  return __cxx_static_address_1f0b0a93748e9cb9a5ecf7d1.reference || (__cxx_static_address_1f0b0a93748e9cb9a5ecf7d1.reference = {
    __cReference: true,
    get value() { return DUKE_LONGTERM_PAIN____header_global_3d81c8a3b7123ef7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:128
export const MONITOR_ACTIVE____header_global_4e47e8910f5576f2 = ((((((212) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f6f2d69baf965203f7b2591e() {
  return __cxx_static_address_f6f2d69baf965203f7b2591e.reference || (__cxx_static_address_f6f2d69baf965203f7b2591e.reference = {
    __cReference: true,
    get value() { return MONITOR_ACTIVE____header_global_4e47e8910f5576f2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:129
export const NITEVISION_ONOFF____header_global_3fed260c0b8d09a4 = ((((((213) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fa0c9e218cff5b5cda56dadc() {
  return __cxx_static_address_fa0c9e218cff5b5cda56dadc.reference || (__cxx_static_address_fa0c9e218cff5b5cda56dadc.reference = {
    __cReference: true,
    get value() { return NITEVISION_ONOFF____header_global_3fed260c0b8d09a4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:130
export const DUKE_CRACK_FIRST____header_global_23ffdfbc6727894d = ((((((215) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_49dbbbc70556fedb6577acad() {
  return __cxx_static_address_49dbbbc70556fedb6577acad.reference || (__cxx_static_address_49dbbbc70556fedb6577acad.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK_FIRST____header_global_23ffdfbc6727894d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:131
export const DUKE_USEMEDKIT____header_global_c5d8214d681c82ec = ((((((216) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3613a66fdace86deba324203() {
  return __cxx_static_address_3613a66fdace86deba324203.reference || (__cxx_static_address_3613a66fdace86deba324203.reference = {
    __cReference: true,
    get value() { return DUKE_USEMEDKIT____header_global_c5d8214d681c82ec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:132
export const DUKE_TAKEPILLS____header_global_08f91c57229fcbf4 = ((((((217) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_42c87b9e4f9de2ca1a3ddc44() {
  return __cxx_static_address_42c87b9e4f9de2ca1a3ddc44.reference || (__cxx_static_address_42c87b9e4f9de2ca1a3ddc44.reference = {
    __cReference: true,
    get value() { return DUKE_TAKEPILLS____header_global_08f91c57229fcbf4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:133
export const DUKE_PISSRELIEF____header_global_ab3c7ccd8f159015 = ((((((218) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4af5a1b141cf3c5f9dd64826() {
  return __cxx_static_address_4af5a1b141cf3c5f9dd64826.reference || (__cxx_static_address_4af5a1b141cf3c5f9dd64826.reference = {
    __cReference: true,
    get value() { return DUKE_PISSRELIEF____header_global_ab3c7ccd8f159015; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:134
export const SELECT_WEAPON____header_global_9637d40e7f2b0a7e = ((((((219) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_afbe12fedd86300711f33cd1() {
  return __cxx_static_address_afbe12fedd86300711f33cd1.reference || (__cxx_static_address_afbe12fedd86300711f33cd1.reference = {
    __cReference: true,
    get value() { return SELECT_WEAPON____header_global_9637d40e7f2b0a7e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:135
export const JIBBED_ACTOR5____header_global_36d9bc651f25ca76 = ((((((226) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a79101c6fbafdf82f4e59a9a() {
  return __cxx_static_address_a79101c6fbafdf82f4e59a9a.reference || (__cxx_static_address_a79101c6fbafdf82f4e59a9a.reference = {
    __cReference: true,
    get value() { return JIBBED_ACTOR5____header_global_36d9bc651f25ca76; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:136
export const JIBBED_ACTOR6____header_global_1cef93167511a5d6 = ((((((227) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_73d651a0eecd407ed61c5d20() {
  return __cxx_static_address_73d651a0eecd407ed61c5d20.reference || (__cxx_static_address_73d651a0eecd407ed61c5d20.reference = {
    __cReference: true,
    get value() { return JIBBED_ACTOR6____header_global_1cef93167511a5d6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:137
export const DUKE_GOTHEALTHATLOW____header_global_ed519f409b85643d = ((((((229) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_46767c16689f0bdcfc50e5a9() {
  return __cxx_static_address_46767c16689f0bdcfc50e5a9.reference || (__cxx_static_address_46767c16689f0bdcfc50e5a9.reference = {
    __cReference: true,
    get value() { return DUKE_GOTHEALTHATLOW____header_global_ed519f409b85643d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:138
export const BOSSTALKTODUKE____header_global_26447bb358649dc3 = ((((((230) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6960f0d58cb1b0b4083af1e1() {
  return __cxx_static_address_6960f0d58cb1b0b4083af1e1.reference || (__cxx_static_address_6960f0d58cb1b0b4083af1e1.reference = {
    __cReference: true,
    get value() { return BOSSTALKTODUKE____header_global_26447bb358649dc3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:139
export const WAR_AMBIENCE2____header_global_f04babcdd6f952e7 = ((((((232) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_99ec29cab56bcbcf0352ed16() {
  return __cxx_static_address_99ec29cab56bcbcf0352ed16.reference || (__cxx_static_address_99ec29cab56bcbcf0352ed16.reference = {
    __cReference: true,
    get value() { return WAR_AMBIENCE2____header_global_f04babcdd6f952e7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:140
export const EXITMENUSOUND____header_global_8b5385ace937cabc = ((((((243) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_915633622e6c13903d1f8334() {
  return __cxx_static_address_915633622e6c13903d1f8334.reference || (__cxx_static_address_915633622e6c13903d1f8334.reference = {
    __cReference: true,
    get value() { return EXITMENUSOUND____header_global_8b5385ace937cabc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:141
export const FLY_BY____header_global_074736b765f49035 = ((((((244) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3e09f8f591fc10b898da4d5b() {
  return __cxx_static_address_3e09f8f591fc10b898da4d5b.reference || (__cxx_static_address_3e09f8f591fc10b898da4d5b.reference = {
    __cReference: true,
    get value() { return FLY_BY____header_global_074736b765f49035; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:142
export const DUKE_SCREAM____header_global_995d4d5b78c3bdcb = ((((((245) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fbe85afbc36f41ace4c1e38f() {
  return __cxx_static_address_fbe85afbc36f41ace4c1e38f.reference || (__cxx_static_address_fbe85afbc36f41ace4c1e38f.reference = {
    __cReference: true,
    get value() { return DUKE_SCREAM____header_global_995d4d5b78c3bdcb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:143
export const SHRINKER_HIT____header_global_9b4df4be99d20172 = ((((((246) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_557ab5c08fb6d2a91b7fd371() {
  return __cxx_static_address_557ab5c08fb6d2a91b7fd371.reference || (__cxx_static_address_557ab5c08fb6d2a91b7fd371.reference = {
    __cReference: true,
    get value() { return SHRINKER_HIT____header_global_9b4df4be99d20172; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:144
export const RATTY____header_global_a7e50e6a4a59242e = ((((((247) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_35791e365fed0a86e0e73f70() {
  return __cxx_static_address_35791e365fed0a86e0e73f70.reference || (__cxx_static_address_35791e365fed0a86e0e73f70.reference = {
    __cReference: true,
    get value() { return RATTY____header_global_a7e50e6a4a59242e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:145
export const BONUSMUSIC____header_global_42ca2caba643b900 = ((((((249) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d4e6bdb95c8e03c94d0957ca() {
  return __cxx_static_address_d4e6bdb95c8e03c94d0957ca.reference || (__cxx_static_address_d4e6bdb95c8e03c94d0957ca.reference = {
    __cReference: true,
    get value() { return BONUSMUSIC____header_global_42ca2caba643b900; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:146
export const DUKE_GETWEAPON6____header_global_0dc8902e65490df2 = ((((((264) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_168e64bf0e12f9c29fc3b4ea() {
  return __cxx_static_address_168e64bf0e12f9c29fc3b4ea.reference || (__cxx_static_address_168e64bf0e12f9c29fc3b4ea.reference = {
    __cReference: true,
    get value() { return DUKE_GETWEAPON6____header_global_0dc8902e65490df2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:147
export const ALIEN_SWITCH1____header_global_5a5a4c56f013edc6 = ((((((272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4e678d52e5f56fc0794193e4() {
  return __cxx_static_address_4e678d52e5f56fc0794193e4.reference || (__cxx_static_address_4e678d52e5f56fc0794193e4.reference = {
    __cReference: true,
    get value() { return ALIEN_SWITCH1____header_global_5a5a4c56f013edc6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:148
export const RIPHEADNECK____header_global_fdbe8d043da24457 = ((((((284) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3ba818deed993faba917fe19() {
  return __cxx_static_address_3ba818deed993faba917fe19.reference || (__cxx_static_address_3ba818deed993faba917fe19.reference = {
    __cReference: true,
    get value() { return RIPHEADNECK____header_global_fdbe8d043da24457; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:149
export const ENDSEQVOL3SND4____header_global_7cc7bc0bcdd2b6a9 = ((((((288) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4d040824ac40a36c4fd710a1() {
  return __cxx_static_address_4d040824ac40a36c4fd710a1.reference || (__cxx_static_address_4d040824ac40a36c4fd710a1.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND4____header_global_7cc7bc0bcdd2b6a9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:150
export const ENDSEQVOL3SND5____header_global_a96181597f428519 = ((((((289) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ac1e0e832a4e256a38dace0d() {
  return __cxx_static_address_ac1e0e832a4e256a38dace0d.reference || (__cxx_static_address_ac1e0e832a4e256a38dace0d.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND5____header_global_a96181597f428519; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:151
export const ENDSEQVOL3SND6____header_global_a729a6b870f95b49 = ((((((290) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_77846b326b3562040af0f388() {
  return __cxx_static_address_77846b326b3562040af0f388.reference || (__cxx_static_address_77846b326b3562040af0f388.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND6____header_global_a729a6b870f95b49; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:152
export const ENDSEQVOL3SND7____header_global_82fc1f3f1a9e9d39 = ((((((291) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_825064063beabf75c7027613() {
  return __cxx_static_address_825064063beabf75c7027613.reference || (__cxx_static_address_825064063beabf75c7027613.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND7____header_global_82fc1f3f1a9e9d39; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:153
export const ENDSEQVOL3SND8____header_global_b5e63b6baba68c96 = ((((((292) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ff401948b7d3854608f952f2() {
  return __cxx_static_address_ff401948b7d3854608f952f2.reference || (__cxx_static_address_ff401948b7d3854608f952f2.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND8____header_global_b5e63b6baba68c96; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:154
export const ENDSEQVOL3SND9____header_global_a8cc45de411f2d08 = ((((((293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_468079702e3266686d851b96() {
  return __cxx_static_address_468079702e3266686d851b96.reference || (__cxx_static_address_468079702e3266686d851b96.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND9____header_global_a8cc45de411f2d08; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:155
export const WHIPYOURASS____header_global_d69bbb840c9e1cee = ((((((294) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a236cff8663035612e8bef8e() {
  return __cxx_static_address_a236cff8663035612e8bef8e.reference || (__cxx_static_address_a236cff8663035612e8bef8e.reference = {
    __cReference: true,
    get value() { return WHIPYOURASS____header_global_d69bbb840c9e1cee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:156
export const ENDSEQVOL2SND1____header_global_7bef49c5aec0714c = ((((((295) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c44e75bfdbec669a94f06ddf() {
  return __cxx_static_address_c44e75bfdbec669a94f06ddf.reference || (__cxx_static_address_c44e75bfdbec669a94f06ddf.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND1____header_global_7bef49c5aec0714c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:157
export const ENDSEQVOL2SND2____header_global_f4dce9cc787d2b53 = ((((((296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bba71c09d967d3db5d4c9c98() {
  return __cxx_static_address_bba71c09d967d3db5d4c9c98.reference || (__cxx_static_address_bba71c09d967d3db5d4c9c98.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND2____header_global_f4dce9cc787d2b53; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:158
export const ENDSEQVOL2SND3____header_global_afbd2d035f2293e6 = ((((((297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_92007a3d544e663841d03df3() {
  return __cxx_static_address_92007a3d544e663841d03df3.reference || (__cxx_static_address_92007a3d544e663841d03df3.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND3____header_global_afbd2d035f2293e6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:159
export const ENDSEQVOL2SND4____header_global_9e36a7ac398dd992 = ((((((298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2ebe83c968ce8f9fa28f514a() {
  return __cxx_static_address_2ebe83c968ce8f9fa28f514a.reference || (__cxx_static_address_2ebe83c968ce8f9fa28f514a.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND4____header_global_9e36a7ac398dd992; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:160
export const ENDSEQVOL2SND5____header_global_6fb0a2ed88e18759 = ((((((299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1c13c950073be8ba1ae87da1() {
  return __cxx_static_address_1c13c950073be8ba1ae87da1.reference || (__cxx_static_address_1c13c950073be8ba1ae87da1.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND5____header_global_6fb0a2ed88e18759; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:161
export const ENDSEQVOL2SND6____header_global_6571347e62e16621 = ((((((300) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c836ccc9b1e2768f399e0eb3() {
  return __cxx_static_address_c836ccc9b1e2768f399e0eb3.reference || (__cxx_static_address_c836ccc9b1e2768f399e0eb3.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND6____header_global_6571347e62e16621; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:162
export const ENDSEQVOL2SND7____header_global_8a47184cdbd45538 = ((((((301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_de37d786faa2ea7b445090cc() {
  return __cxx_static_address_de37d786faa2ea7b445090cc.reference || (__cxx_static_address_de37d786faa2ea7b445090cc.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND7____header_global_8a47184cdbd45538; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:163
export const SOMETHINGFROZE____header_global_dd490f462e92a0be = ((((((303) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bfc806bddc3111d30e6e08f8() {
  return __cxx_static_address_bfc806bddc3111d30e6e08f8.reference || (__cxx_static_address_bfc806bddc3111d30e6e08f8.reference = {
    __cReference: true,
    get value() { return SOMETHINGFROZE____header_global_dd490f462e92a0be; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:164
export const WIND_REPEAT____header_global_54645fe5398a6145 = ((((((308) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_88593e454d2eae57b7baac64() {
  return __cxx_static_address_88593e454d2eae57b7baac64.reference || (__cxx_static_address_88593e454d2eae57b7baac64.reference = {
    __cReference: true,
    get value() { return WIND_REPEAT____header_global_54645fe5398a6145; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:165
export const BOS4_RECOG____header_global_a52d0f08fbcf44f6 = ((((((342) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_17bb4ca0accae6d015330ddc() {
  return __cxx_static_address_17bb4ca0accae6d015330ddc.reference || (__cxx_static_address_17bb4ca0accae6d015330ddc.reference = {
    __cReference: true,
    get value() { return BOS4_RECOG____header_global_a52d0f08fbcf44f6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:166
export const LIGHTNING_SLAP____header_global_302117e9314fdae5 = ((((((351) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5d1d7c4c3e4a144a2c2f0d3c() {
  return __cxx_static_address_5d1d7c4c3e4a144a2c2f0d3c.reference || (__cxx_static_address_5d1d7c4c3e4a144a2c2f0d3c.reference = {
    __cReference: true,
    get value() { return LIGHTNING_SLAP____header_global_302117e9314fdae5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:167
export const THUNDER____header_global_1d85b6d3a427a969 = ((((((352) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6a2e33917e5fcddab34d2446() {
  return __cxx_static_address_6a2e33917e5fcddab34d2446.reference || (__cxx_static_address_6a2e33917e5fcddab34d2446.reference = {
    __cReference: true,
    get value() { return THUNDER____header_global_1d85b6d3a427a969; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:168
export const INTRO4_1____header_global_7583ed6543183b94 = ((((((363) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_667086a7e23b8fb77c571f93() {
  return __cxx_static_address_667086a7e23b8fb77c571f93.reference || (__cxx_static_address_667086a7e23b8fb77c571f93.reference = {
    __cReference: true,
    get value() { return INTRO4_1____header_global_7583ed6543183b94; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:169
export const INTRO4_2____header_global_598b8250fd7bbe31 = ((((((364) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5df1db681a77c528be617282() {
  return __cxx_static_address_5df1db681a77c528be617282.reference || (__cxx_static_address_5df1db681a77c528be617282.reference = {
    __cReference: true,
    get value() { return INTRO4_2____header_global_598b8250fd7bbe31; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:170
export const INTRO4_3____header_global_8050dd13a92a257a = ((((((365) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8b5af995165e77d02f1eebf1() {
  return __cxx_static_address_8b5af995165e77d02f1eebf1.reference || (__cxx_static_address_8b5af995165e77d02f1eebf1.reference = {
    __cReference: true,
    get value() { return INTRO4_3____header_global_8050dd13a92a257a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:171
export const INTRO4_4____header_global_d5c1bddad691ac99 = ((((((366) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a479db394745380086233676() {
  return __cxx_static_address_a479db394745380086233676.reference || (__cxx_static_address_a479db394745380086233676.reference = {
    __cReference: true,
    get value() { return INTRO4_4____header_global_d5c1bddad691ac99; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:172
export const INTRO4_5____header_global_40b04cd42523e532 = ((((((367) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_090e443ca4c19610aefb9901() {
  return __cxx_static_address_090e443ca4c19610aefb9901.reference || (__cxx_static_address_090e443ca4c19610aefb9901.reference = {
    __cReference: true,
    get value() { return INTRO4_5____header_global_40b04cd42523e532; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:173
export const INTRO4_6____header_global_cab3c7a8d7458401 = ((((((368) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4f20910bbfa03459d30c8f53() {
  return __cxx_static_address_4f20910bbfa03459d30c8f53.reference || (__cxx_static_address_4f20910bbfa03459d30c8f53.reference = {
    __cReference: true,
    get value() { return INTRO4_6____header_global_cab3c7a8d7458401; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:174
export const BOSS4_DEADSPEECH____header_global_04e4fda923a1c98f = ((((((370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1d8f9c0690d0137ac11383d2() {
  return __cxx_static_address_1d8f9c0690d0137ac11383d2.reference || (__cxx_static_address_1d8f9c0690d0137ac11383d2.reference = {
    __cReference: true,
    get value() { return BOSS4_DEADSPEECH____header_global_04e4fda923a1c98f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:175
export const BOSS4_FIRSTSEE____header_global_2bf65ac0aeeaf99f = ((((((371) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b86564a547714ca01ae99ab2() {
  return __cxx_static_address_b86564a547714ca01ae99ab2.reference || (__cxx_static_address_b86564a547714ca01ae99ab2.reference = {
    __cReference: true,
    get value() { return BOSS4_FIRSTSEE____header_global_2bf65ac0aeeaf99f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:176
export const VOL4ENDSND1____header_global_6ed30374a8020704 = ((((((384) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6a46479e79d2c10a378513db() {
  return __cxx_static_address_6a46479e79d2c10a378513db.reference || (__cxx_static_address_6a46479e79d2c10a378513db.reference = {
    __cReference: true,
    get value() { return VOL4ENDSND1____header_global_6ed30374a8020704; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:177
export const VOL4ENDSND2____header_global_e1b98b31fdf30db1 = ((((((385) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_12011dd7a3b630e5e7a34570() {
  return __cxx_static_address_12011dd7a3b630e5e7a34570.reference || (__cxx_static_address_12011dd7a3b630e5e7a34570.reference = {
    __cReference: true,
    get value() { return VOL4ENDSND2____header_global_e1b98b31fdf30db1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:178
export const EXPANDERSHOOT____header_global_fd49fdf1559c7b51 = ((((((388) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a7ba0156f2d9845edd413a27() {
  return __cxx_static_address_a7ba0156f2d9845edd413a27.reference || (__cxx_static_address_a7ba0156f2d9845edd413a27.reference = {
    __cReference: true,
    get value() { return EXPANDERSHOOT____header_global_fd49fdf1559c7b51; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:179
export const INTRO4_B____header_global_2d133b0373eca985 = ((((((392) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_99da28ffab8822e0f445cc2f() {
  return __cxx_static_address_99da28ffab8822e0f445cc2f.reference || (__cxx_static_address_99da28ffab8822e0f445cc2f.reference = {
    __cReference: true,
    get value() { return INTRO4_B____header_global_2d133b0373eca985; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:180
export const BIGBANG____header_global_e07813cc69dad2d8 = ((((((393) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e84ce929e7a11309869024bf() {
  return __cxx_static_address_e84ce929e7a11309869024bf.reference || (__cxx_static_address_e84ce929e7a11309869024bf.reference = {
    __cReference: true,
    get value() { return BIGBANG____header_global_e07813cc69dad2d8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:181
export const FLAMETHROWER_INTRO____header_global_2e6b65a2bc2ca551 = ((((((398) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bf5c287564b7ae450faefe01() {
  return __cxx_static_address_bf5c287564b7ae450faefe01.reference || (__cxx_static_address_bf5c287564b7ae450faefe01.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_INTRO____header_global_2e6b65a2bc2ca551; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:182
export const FLAMETHROWER_LOOP____header_global_2a560f0ae6da589e = ((((((399) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4ef3a999c78523c027bcca49() {
  return __cxx_static_address_4ef3a999c78523c027bcca49.reference || (__cxx_static_address_4ef3a999c78523c027bcca49.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_LOOP____header_global_2a560f0ae6da589e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:183
export const FLAMETHROWER_END____header_global_f0d7198e75fe4b09 = ((((((400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f810346236834767ff2de05d() {
  return __cxx_static_address_f810346236834767ff2de05d.reference || (__cxx_static_address_f810346236834767ff2de05d.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_END____header_global_f0d7198e75fe4b09; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:184
export const E5L7_DUKE_QUIT_YOU____header_global_5d69d989e9f0d009 = ((((((401) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2ff479bf4b458168c7c8e561() {
  return __cxx_static_address_2ff479bf4b458168c7c8e561.reference || (__cxx_static_address_2ff479bf4b458168c7c8e561.reference = {
    __cReference: true,
    get value() { return E5L7_DUKE_QUIT_YOU____header_global_5d69d989e9f0d009; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:187
export const SECTOREFFECTOR____header_global_2f05141732a2c98e = ((((((1) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_15539f2995f162ef651d5756() {
  return __cxx_static_address_15539f2995f162ef651d5756.reference || (__cxx_static_address_15539f2995f162ef651d5756.reference = {
    __cReference: true,
    get value() { return SECTOREFFECTOR____header_global_2f05141732a2c98e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:188
export const ACTIVATOR____header_global_15c4288eb936149f = ((((((2) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_de5a4d588e899479cb62853f() {
  return __cxx_static_address_de5a4d588e899479cb62853f.reference || (__cxx_static_address_de5a4d588e899479cb62853f.reference = {
    __cReference: true,
    get value() { return ACTIVATOR____header_global_15c4288eb936149f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:189
export const TOUCHPLATE____header_global_5dd8a30913120983 = ((((((3) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3cbcbf97a9b0bc533b8c8466() {
  return __cxx_static_address_3cbcbf97a9b0bc533b8c8466.reference || (__cxx_static_address_3cbcbf97a9b0bc533b8c8466.reference = {
    __cReference: true,
    get value() { return TOUCHPLATE____header_global_5dd8a30913120983; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:190
export const ACTIVATORLOCKED____header_global_f44fe29330782365 = ((((((4) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c8e944b80aa82a886575fa0c() {
  return __cxx_static_address_c8e944b80aa82a886575fa0c.reference || (__cxx_static_address_c8e944b80aa82a886575fa0c.reference = {
    __cReference: true,
    get value() { return ACTIVATORLOCKED____header_global_f44fe29330782365; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:191
export const MUSICANDSFX____header_global_3cad503a2ff8f4b8 = ((((((5) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ac738a9c3f2970f05906751a() {
  return __cxx_static_address_ac738a9c3f2970f05906751a.reference || (__cxx_static_address_ac738a9c3f2970f05906751a.reference = {
    __cReference: true,
    get value() { return MUSICANDSFX____header_global_3cad503a2ff8f4b8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:192
export const LOCATORS____header_global_14b7209d1545d43c = ((((((6) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9aea6abc62dd523fd8e1699e() {
  return __cxx_static_address_9aea6abc62dd523fd8e1699e.reference || (__cxx_static_address_9aea6abc62dd523fd8e1699e.reference = {
    __cReference: true,
    get value() { return LOCATORS____header_global_14b7209d1545d43c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:193
export const CYCLER____header_global_d454d3f21c2d712a = ((((((7) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c1767322ddc931f02580cfe9() {
  return __cxx_static_address_c1767322ddc931f02580cfe9.reference || (__cxx_static_address_c1767322ddc931f02580cfe9.reference = {
    __cReference: true,
    get value() { return CYCLER____header_global_d454d3f21c2d712a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:194
export const MASTERSWITCH____header_global_b5783ecc1033d007 = ((((((8) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0d22d1400b1c9659bd46dec0() {
  return __cxx_static_address_0d22d1400b1c9659bd46dec0.reference || (__cxx_static_address_0d22d1400b1c9659bd46dec0.reference = {
    __cReference: true,
    get value() { return MASTERSWITCH____header_global_b5783ecc1033d007; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:195
export const RESPAWN____header_global_dfc13d18941a07f1 = ((((((9) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b068e96a6f399aa118dd3e01() {
  return __cxx_static_address_b068e96a6f399aa118dd3e01.reference || (__cxx_static_address_b068e96a6f399aa118dd3e01.reference = {
    __cReference: true,
    get value() { return RESPAWN____header_global_dfc13d18941a07f1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:196
export const GPSPEED____header_global_28d89762d6540e9e = ((((((10) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b4eef7288e0fea7f47ddfd35() {
  return __cxx_static_address_b4eef7288e0fea7f47ddfd35.reference || (__cxx_static_address_b4eef7288e0fea7f47ddfd35.reference = {
    __cReference: true,
    get value() { return GPSPEED____header_global_28d89762d6540e9e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:197
export const FOF____header_global_fb00ee498e4be9ef = ((((((13) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f0eb9ae360040af9257ce90c() {
  return __cxx_static_address_f0eb9ae360040af9257ce90c.reference || (__cxx_static_address_f0eb9ae360040af9257ce90c.reference = {
    __cReference: true,
    get value() { return FOF____header_global_fb00ee498e4be9ef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:198
export const ARROW____header_global_714084ec797aea9d = ((((((20) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_489a4385a351551b66a7b1c2() {
  return __cxx_static_address_489a4385a351551b66a7b1c2.reference || (__cxx_static_address_489a4385a351551b66a7b1c2.reference = {
    __cReference: true,
    get value() { return ARROW____header_global_714084ec797aea9d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:199
export const FIRSTGUNSPRITE____header_global_b4c50fa0a96f8ac3 = ((((((21) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_50910403b3c2030e18f4b474() {
  return __cxx_static_address_50910403b3c2030e18f4b474.reference || (__cxx_static_address_50910403b3c2030e18f4b474.reference = {
    __cReference: true,
    get value() { return FIRSTGUNSPRITE____header_global_b4c50fa0a96f8ac3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:200
export const CHAINGUNSPRITE____header_global_12c825977b4779c3 = ((((((22) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0ea5ef623fffe524a59d1fab() {
  return __cxx_static_address_0ea5ef623fffe524a59d1fab.reference || (__cxx_static_address_0ea5ef623fffe524a59d1fab.reference = {
    __cReference: true,
    get value() { return CHAINGUNSPRITE____header_global_12c825977b4779c3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:201
export const RPGSPRITE____header_global_32e215f728edcc3a = ((((((23) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_94f41245839ff22f2e6edd46() {
  return __cxx_static_address_94f41245839ff22f2e6edd46.reference || (__cxx_static_address_94f41245839ff22f2e6edd46.reference = {
    __cReference: true,
    get value() { return RPGSPRITE____header_global_32e215f728edcc3a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:202
export const FREEZESPRITE____header_global_def9259cd20b89df = ((((((24) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d9501afab76329994d856867() {
  return __cxx_static_address_d9501afab76329994d856867.reference || (__cxx_static_address_d9501afab76329994d856867.reference = {
    __cReference: true,
    get value() { return FREEZESPRITE____header_global_def9259cd20b89df; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:203
export const SHRINKERSPRITE____header_global_94319f8524b91c6f = ((((((25) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6a3665cbcd0aecce7200a4fd() {
  return __cxx_static_address_6a3665cbcd0aecce7200a4fd.reference || (__cxx_static_address_6a3665cbcd0aecce7200a4fd.reference = {
    __cReference: true,
    get value() { return SHRINKERSPRITE____header_global_94319f8524b91c6f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:204
export const HEAVYHBOMB____header_global_8e8cb837d6711b34 = ((((((26) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5ba7f86981b220086df6c800() {
  return __cxx_static_address_5ba7f86981b220086df6c800.reference || (__cxx_static_address_5ba7f86981b220086df6c800.reference = {
    __cReference: true,
    get value() { return HEAVYHBOMB____header_global_8e8cb837d6711b34; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:205
export const TRIPBOMBSPRITE____header_global_4d2780029fc81c5a = ((((((27) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6241fa0d3d40d191ca309961() {
  return __cxx_static_address_6241fa0d3d40d191ca309961.reference || (__cxx_static_address_6241fa0d3d40d191ca309961.reference = {
    __cReference: true,
    get value() { return TRIPBOMBSPRITE____header_global_4d2780029fc81c5a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:206
export const SHOTGUNSPRITE____header_global_bff8de3fa70861b5 = ((((((28) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7226b24ea97b334c6b5469ae() {
  return __cxx_static_address_7226b24ea97b334c6b5469ae.reference || (__cxx_static_address_7226b24ea97b334c6b5469ae.reference = {
    __cReference: true,
    get value() { return SHOTGUNSPRITE____header_global_bff8de3fa70861b5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:207
export const DEVISTATORSPRITE____header_global_42429aa46588bf98 = ((((((29) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e28584ba69498f270dcd99af() {
  return __cxx_static_address_e28584ba69498f270dcd99af.reference || (__cxx_static_address_e28584ba69498f270dcd99af.reference = {
    __cReference: true,
    get value() { return DEVISTATORSPRITE____header_global_42429aa46588bf98; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:208
export const HEALTHBOX____header_global_8c06e39dfed9b6b6 = ((((((30) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_43bd56806545834ec0b5ffd9() {
  return __cxx_static_address_43bd56806545834ec0b5ffd9.reference || (__cxx_static_address_43bd56806545834ec0b5ffd9.reference = {
    __cReference: true,
    get value() { return HEALTHBOX____header_global_8c06e39dfed9b6b6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:209
export const AMMOBOX____header_global_5acb95e59eb2952f = ((((((31) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0a439bc07d50f1bea14638ac() {
  return __cxx_static_address_0a439bc07d50f1bea14638ac.reference || (__cxx_static_address_0a439bc07d50f1bea14638ac.reference = {
    __cReference: true,
    get value() { return AMMOBOX____header_global_5acb95e59eb2952f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:210
export const GROWSPRITEICON____header_global_3fb9d0f2e28e1c5a = ((((((32) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d42365c4d7544137be48be88() {
  return __cxx_static_address_d42365c4d7544137be48be88.reference || (__cxx_static_address_d42365c4d7544137be48be88.reference = {
    __cReference: true,
    get value() { return GROWSPRITEICON____header_global_3fb9d0f2e28e1c5a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:211
export const INVENTORYBOX____header_global_8a89da84c957bf4a = ((((((33) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_175c9b1d2a1f1fb246ef25b2() {
  return __cxx_static_address_175c9b1d2a1f1fb246ef25b2.reference || (__cxx_static_address_175c9b1d2a1f1fb246ef25b2.reference = {
    __cReference: true,
    get value() { return INVENTORYBOX____header_global_8a89da84c957bf4a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:212
export const FREEZEAMMO____header_global_836d072040204772 = ((((((37) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_38cb41b3a26afa1a44e2b973() {
  return __cxx_static_address_38cb41b3a26afa1a44e2b973.reference || (__cxx_static_address_38cb41b3a26afa1a44e2b973.reference = {
    __cReference: true,
    get value() { return FREEZEAMMO____header_global_836d072040204772; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:213
export const AMMO____header_global_ce5c8c01e0f24927 = ((((((40) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f3df814a795f563e2097c23c() {
  return __cxx_static_address_f3df814a795f563e2097c23c.reference || (__cxx_static_address_f3df814a795f563e2097c23c.reference = {
    __cReference: true,
    get value() { return AMMO____header_global_ce5c8c01e0f24927; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:214
export const BATTERYAMMO____header_global_fdd295bb7b69c46d = ((((((41) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_06ba41a2e1eed3eeb22b8850() {
  return __cxx_static_address_06ba41a2e1eed3eeb22b8850.reference || (__cxx_static_address_06ba41a2e1eed3eeb22b8850.reference = {
    __cReference: true,
    get value() { return BATTERYAMMO____header_global_fdd295bb7b69c46d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:215
export const DEVISTATORAMMO____header_global_176afc8ee187c655 = ((((((42) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0f59109fbfca27c0292315d3() {
  return __cxx_static_address_0f59109fbfca27c0292315d3.reference || (__cxx_static_address_0f59109fbfca27c0292315d3.reference = {
    __cReference: true,
    get value() { return DEVISTATORAMMO____header_global_176afc8ee187c655; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:216
export const RPGAMMO____header_global_257a1ff6fbeee82b = ((((((44) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3d7871afcaf6153891fe5850() {
  return __cxx_static_address_3d7871afcaf6153891fe5850.reference || (__cxx_static_address_3d7871afcaf6153891fe5850.reference = {
    __cReference: true,
    get value() { return RPGAMMO____header_global_257a1ff6fbeee82b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:217
export const GROWAMMO____header_global_3a753555e41e27f3 = ((((((45) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_696dcaf67150578257949c3e() {
  return __cxx_static_address_696dcaf67150578257949c3e.reference || (__cxx_static_address_696dcaf67150578257949c3e.reference = {
    __cReference: true,
    get value() { return GROWAMMO____header_global_3a753555e41e27f3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:218
export const CRYSTALAMMO____header_global_e15997c18a74cadf = ((((((46) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_addb70da11e6c7927b944a2e() {
  return __cxx_static_address_addb70da11e6c7927b944a2e.reference || (__cxx_static_address_addb70da11e6c7927b944a2e.reference = {
    __cReference: true,
    get value() { return CRYSTALAMMO____header_global_e15997c18a74cadf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:219
export const HBOMBAMMO____header_global_5170a7d23d11ccff = ((((((47) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_95e7b48d4ce70e754a9a7901() {
  return __cxx_static_address_95e7b48d4ce70e754a9a7901.reference || (__cxx_static_address_95e7b48d4ce70e754a9a7901.reference = {
    __cReference: true,
    get value() { return HBOMBAMMO____header_global_5170a7d23d11ccff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:220
export const AMMOLOTS____header_global_0be433235cf82e88 = ((((((48) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_93dfa734aae4fcbe8b59d975() {
  return __cxx_static_address_93dfa734aae4fcbe8b59d975.reference || (__cxx_static_address_93dfa734aae4fcbe8b59d975.reference = {
    __cReference: true,
    get value() { return AMMOLOTS____header_global_0be433235cf82e88; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:221
export const SHOTGUNAMMO____header_global_1b73e08ebf17136c = ((((((49) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e6ced13d5d857c7ec05cbf2e() {
  return __cxx_static_address_e6ced13d5d857c7ec05cbf2e.reference || (__cxx_static_address_e6ced13d5d857c7ec05cbf2e.reference = {
    __cReference: true,
    get value() { return SHOTGUNAMMO____header_global_1b73e08ebf17136c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:222
export const COLA____header_global_892b8176b3304323 = ((((((51) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5481ec50850816ea40d975a2() {
  return __cxx_static_address_5481ec50850816ea40d975a2.reference || (__cxx_static_address_5481ec50850816ea40d975a2.reference = {
    __cReference: true,
    get value() { return COLA____header_global_892b8176b3304323; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:223
export const SIXPAK____header_global_9b80c304a0ce18bb = ((((((52) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_524b7278b53d412af250691e() {
  return __cxx_static_address_524b7278b53d412af250691e.reference || (__cxx_static_address_524b7278b53d412af250691e.reference = {
    __cReference: true,
    get value() { return SIXPAK____header_global_9b80c304a0ce18bb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:224
export const FIRSTAID____header_global_9d8ac175af8633e1 = ((((((53) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_78f47c81550c1d01b7055d61() {
  return __cxx_static_address_78f47c81550c1d01b7055d61.reference || (__cxx_static_address_78f47c81550c1d01b7055d61.reference = {
    __cReference: true,
    get value() { return FIRSTAID____header_global_9d8ac175af8633e1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:225
export const SHIELD____header_global_f9d9379177aefaa1 = ((((((54) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d02fbc0ff9fa0f47a85d675f() {
  return __cxx_static_address_d02fbc0ff9fa0f47a85d675f.reference || (__cxx_static_address_d02fbc0ff9fa0f47a85d675f.reference = {
    __cReference: true,
    get value() { return SHIELD____header_global_f9d9379177aefaa1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:226
export const STEROIDS____header_global_c1b211f23c7cb909 = ((((((55) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e77f112dd95789201afd28a6() {
  return __cxx_static_address_e77f112dd95789201afd28a6.reference || (__cxx_static_address_e77f112dd95789201afd28a6.reference = {
    __cReference: true,
    get value() { return STEROIDS____header_global_c1b211f23c7cb909; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:227
export const AIRTANK____header_global_42823d7ac2ca4524 = ((((((56) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_44006052d196cc539206532c() {
  return __cxx_static_address_44006052d196cc539206532c.reference || (__cxx_static_address_44006052d196cc539206532c.reference = {
    __cReference: true,
    get value() { return AIRTANK____header_global_42823d7ac2ca4524; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:228
export const JETPACK____header_global_84ad22f463a8f16d = ((((((57) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ce91bc9411ae2f99e18d5a98() {
  return __cxx_static_address_ce91bc9411ae2f99e18d5a98.reference || (__cxx_static_address_ce91bc9411ae2f99e18d5a98.reference = {
    __cReference: true,
    get value() { return JETPACK____header_global_84ad22f463a8f16d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:229
export const HEATSENSOR____header_global_f3c2ff5573301608 = ((((((59) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4f038352c83589144b4b7ae5() {
  return __cxx_static_address_4f038352c83589144b4b7ae5.reference || (__cxx_static_address_4f038352c83589144b4b7ae5.reference = {
    __cReference: true,
    get value() { return HEATSENSOR____header_global_f3c2ff5573301608; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:230
export const ACCESSCARD____header_global_3b8ec1594c196385 = ((((((60) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_537be085f9cb19c6dd7b4364() {
  return __cxx_static_address_537be085f9cb19c6dd7b4364.reference || (__cxx_static_address_537be085f9cb19c6dd7b4364.reference = {
    __cReference: true,
    get value() { return ACCESSCARD____header_global_3b8ec1594c196385; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:231
export const BOOTS____header_global_ff82a7e84ac86d29 = ((((((61) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_861a6979e693695deb3a9abb() {
  return __cxx_static_address_861a6979e693695deb3a9abb.reference || (__cxx_static_address_861a6979e693695deb3a9abb.reference = {
    __cReference: true,
    get value() { return BOOTS____header_global_ff82a7e84ac86d29; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:232
export const MIRRORBROKE____header_global_74586490feaf6a90 = ((((((70) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7de3412f036c354568264725() {
  return __cxx_static_address_7de3412f036c354568264725.reference || (__cxx_static_address_7de3412f036c354568264725.reference = {
    __cReference: true,
    get value() { return MIRRORBROKE____header_global_74586490feaf6a90; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:233
export const CLOUDYOCEAN____header_global_6021fd48c53e95e3 = ((((((78) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a073bcd5c0a841054c562ec1() {
  return __cxx_static_address_a073bcd5c0a841054c562ec1.reference || (__cxx_static_address_a073bcd5c0a841054c562ec1.reference = {
    __cReference: true,
    get value() { return CLOUDYOCEAN____header_global_6021fd48c53e95e3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:234
export const CLOUDYSKIES____header_global_3ceaf09084f8c107 = ((((((79) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7f7a64b7fd6956f9370b7d33() {
  return __cxx_static_address_7f7a64b7fd6956f9370b7d33.reference || (__cxx_static_address_7f7a64b7fd6956f9370b7d33.reference = {
    __cReference: true,
    get value() { return CLOUDYSKIES____header_global_3ceaf09084f8c107; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:235
export const MOONSKY1____header_global_90cb2ea00b8b8245 = ((((((80) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_25d05f7d7f4685693bf08e89() {
  return __cxx_static_address_25d05f7d7f4685693bf08e89.reference || (__cxx_static_address_25d05f7d7f4685693bf08e89.reference = {
    __cReference: true,
    get value() { return MOONSKY1____header_global_90cb2ea00b8b8245; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:236
export const BIGORBIT1____header_global_0d5621ad6852d6aa = ((((((84) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d37eb5235cb6f746f2a40d7e() {
  return __cxx_static_address_d37eb5235cb6f746f2a40d7e.reference || (__cxx_static_address_d37eb5235cb6f746f2a40d7e.reference = {
    __cReference: true,
    get value() { return BIGORBIT1____header_global_0d5621ad6852d6aa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:237
export const LA____header_global_2bab7a698fac3c3c = ((((((89) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7636235828f94a8741cb0839() {
  return __cxx_static_address_7636235828f94a8741cb0839.reference || (__cxx_static_address_7636235828f94a8741cb0839.reference = {
    __cReference: true,
    get value() { return LA____header_global_2bab7a698fac3c3c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:238
export const ATOMICHEALTH____header_global_5ad6fcf75e6fe1aa = ((((((100) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_01c3d7ca71c0c21037bc77f8() {
  return __cxx_static_address_01c3d7ca71c0c21037bc77f8.reference || (__cxx_static_address_01c3d7ca71c0c21037bc77f8.reference = {
    __cReference: true,
    get value() { return ATOMICHEALTH____header_global_5ad6fcf75e6fe1aa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:239
export const TECHLIGHT2____header_global_eb0543f27bd637cd = ((((((120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_21d292be3668d9327ffca95b() {
  return __cxx_static_address_21d292be3668d9327ffca95b.reference || (__cxx_static_address_21d292be3668d9327ffca95b.reference = {
    __cReference: true,
    get value() { return TECHLIGHT2____header_global_eb0543f27bd637cd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:240
export const TECHLIGHTBUST2____header_global_9ec1c56e37fea038 = ((((((121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6eb72a21ffeb787ed4474583() {
  return __cxx_static_address_6eb72a21ffeb787ed4474583.reference || (__cxx_static_address_6eb72a21ffeb787ed4474583.reference = {
    __cReference: true,
    get value() { return TECHLIGHTBUST2____header_global_9ec1c56e37fea038; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:241
export const TECHLIGHT4____header_global_ccd9ed8c39d51a1b = ((((((122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_389f1962a5cba87ef4a114bb() {
  return __cxx_static_address_389f1962a5cba87ef4a114bb.reference || (__cxx_static_address_389f1962a5cba87ef4a114bb.reference = {
    __cReference: true,
    get value() { return TECHLIGHT4____header_global_ccd9ed8c39d51a1b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:242
export const TECHLIGHTBUST4____header_global_3c939bcb1fc20cd3 = ((((((123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_16b91d0a2e8aa77c24db9aeb() {
  return __cxx_static_address_16b91d0a2e8aa77c24db9aeb.reference || (__cxx_static_address_16b91d0a2e8aa77c24db9aeb.reference = {
    __cReference: true,
    get value() { return TECHLIGHTBUST4____header_global_3c939bcb1fc20cd3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:243
export const WALLLIGHT4____header_global_93d75a13eb78fdae = ((((((124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_336c0ee46841aef61ea9faf2() {
  return __cxx_static_address_336c0ee46841aef61ea9faf2.reference || (__cxx_static_address_336c0ee46841aef61ea9faf2.reference = {
    __cReference: true,
    get value() { return WALLLIGHT4____header_global_93d75a13eb78fdae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:244
export const WALLLIGHTBUST4____header_global_b5361576d7c68bc1 = ((((((125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f8dc947e6ea84e9e830e1fc7() {
  return __cxx_static_address_f8dc947e6ea84e9e830e1fc7.reference || (__cxx_static_address_f8dc947e6ea84e9e830e1fc7.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST4____header_global_b5361576d7c68bc1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:245
export const ACCESSSWITCH____header_global_f460d7415b85c441 = ((((((130) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eda6aba354181af4ca2a7ac8() {
  return __cxx_static_address_eda6aba354181af4ca2a7ac8.reference || (__cxx_static_address_eda6aba354181af4ca2a7ac8.reference = {
    __cReference: true,
    get value() { return ACCESSSWITCH____header_global_f460d7415b85c441; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:246
export const SLOTDOOR____header_global_50d2827fefc4845f = ((((((132) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7faadd59dc211570428c6aae() {
  return __cxx_static_address_7faadd59dc211570428c6aae.reference || (__cxx_static_address_7faadd59dc211570428c6aae.reference = {
    __cReference: true,
    get value() { return SLOTDOOR____header_global_50d2827fefc4845f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:247
export const LIGHTSWITCH____header_global_c4dbb444c9861156 = ((((((134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_524bff826e1c0d21a2f7773e() {
  return __cxx_static_address_524bff826e1c0d21a2f7773e.reference || (__cxx_static_address_524bff826e1c0d21a2f7773e.reference = {
    __cReference: true,
    get value() { return LIGHTSWITCH____header_global_c4dbb444c9861156; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:248
export const SPACEDOORSWITCH____header_global_3e69781376ade886 = ((((((136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8d107dd136452c2cb972bfe4() {
  return __cxx_static_address_8d107dd136452c2cb972bfe4.reference || (__cxx_static_address_8d107dd136452c2cb972bfe4.reference = {
    __cReference: true,
    get value() { return SPACEDOORSWITCH____header_global_3e69781376ade886; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:249
export const SPACELIGHTSWITCH____header_global_9b2a40cbd86c5dfb = ((((((138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0610625ba1dc8a5a0650e10d() {
  return __cxx_static_address_0610625ba1dc8a5a0650e10d.reference || (__cxx_static_address_0610625ba1dc8a5a0650e10d.reference = {
    __cReference: true,
    get value() { return SPACELIGHTSWITCH____header_global_9b2a40cbd86c5dfb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:250
export const FRANKENSTINESWITCH____header_global_1ffde036168117ee = ((((((140) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_843f32d32fc5d301dd11253f() {
  return __cxx_static_address_843f32d32fc5d301dd11253f.reference || (__cxx_static_address_843f32d32fc5d301dd11253f.reference = {
    __cReference: true,
    get value() { return FRANKENSTINESWITCH____header_global_1ffde036168117ee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:251
export const NUKEBUTTON____header_global_cea3a7e39ccd72f9 = ((((((142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ae9274ed4f000b342f165c41() {
  return __cxx_static_address_ae9274ed4f000b342f165c41.reference || (__cxx_static_address_ae9274ed4f000b342f165c41.reference = {
    __cReference: true,
    get value() { return NUKEBUTTON____header_global_cea3a7e39ccd72f9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:252
export const MULTISWITCH____header_global_fa3742f5d3c4824c = ((((((146) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8578a5310108bd72120089ec() {
  return __cxx_static_address_8578a5310108bd72120089ec.reference || (__cxx_static_address_8578a5310108bd72120089ec.reference = {
    __cReference: true,
    get value() { return MULTISWITCH____header_global_fa3742f5d3c4824c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:253
export const DOORTILE5____header_global_43d283f54589be6e = ((((((150) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_36d71e2790cf2e387d4fa686() {
  return __cxx_static_address_36d71e2790cf2e387d4fa686.reference || (__cxx_static_address_36d71e2790cf2e387d4fa686.reference = {
    __cReference: true,
    get value() { return DOORTILE5____header_global_43d283f54589be6e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:254
export const DOORTILE6____header_global_e867531cf2c44518 = ((((((151) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c88ee612c7bc39166c9e3a34() {
  return __cxx_static_address_c88ee612c7bc39166c9e3a34.reference || (__cxx_static_address_c88ee612c7bc39166c9e3a34.reference = {
    __cReference: true,
    get value() { return DOORTILE6____header_global_e867531cf2c44518; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:255
export const DOORTILE1____header_global_4089b5eb6c1f6eea = ((((((152) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ba2e03f5d05bd1a923fea455() {
  return __cxx_static_address_ba2e03f5d05bd1a923fea455.reference || (__cxx_static_address_ba2e03f5d05bd1a923fea455.reference = {
    __cReference: true,
    get value() { return DOORTILE1____header_global_4089b5eb6c1f6eea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:256
export const DOORTILE2____header_global_cf95ccff7e3bf04c = ((((((153) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4fa4c37d62b8f35fd7ea8913() {
  return __cxx_static_address_4fa4c37d62b8f35fd7ea8913.reference || (__cxx_static_address_4fa4c37d62b8f35fd7ea8913.reference = {
    __cReference: true,
    get value() { return DOORTILE2____header_global_cf95ccff7e3bf04c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:257
export const DOORTILE3____header_global_06427787a4ee7508 = ((((((154) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_605e76ead33dead266444055() {
  return __cxx_static_address_605e76ead33dead266444055.reference || (__cxx_static_address_605e76ead33dead266444055.reference = {
    __cReference: true,
    get value() { return DOORTILE3____header_global_06427787a4ee7508; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:258
export const DOORTILE4____header_global_b74463364e494081 = ((((((155) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d47cff75afb2ae6fa11a51ea() {
  return __cxx_static_address_d47cff75afb2ae6fa11a51ea.reference || (__cxx_static_address_d47cff75afb2ae6fa11a51ea.reference = {
    __cReference: true,
    get value() { return DOORTILE4____header_global_b74463364e494081; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:259
export const DOORTILE7____header_global_dc165ca38b91cb4c = ((((((156) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8ef54108cc91df53a4ba6911() {
  return __cxx_static_address_8ef54108cc91df53a4ba6911.reference || (__cxx_static_address_8ef54108cc91df53a4ba6911.reference = {
    __cReference: true,
    get value() { return DOORTILE7____header_global_dc165ca38b91cb4c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:260
export const DOORTILE8____header_global_ff884bfc2e8422b8 = ((((((157) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_019c72b644f9ca7bf24a9bb9() {
  return __cxx_static_address_019c72b644f9ca7bf24a9bb9.reference || (__cxx_static_address_019c72b644f9ca7bf24a9bb9.reference = {
    __cReference: true,
    get value() { return DOORTILE8____header_global_ff884bfc2e8422b8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:261
export const DOORTILE9____header_global_d39cf7902bc56388 = ((((((158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e419fd079db7e9b88f469e77() {
  return __cxx_static_address_e419fd079db7e9b88f469e77.reference || (__cxx_static_address_e419fd079db7e9b88f469e77.reference = {
    __cReference: true,
    get value() { return DOORTILE9____header_global_d39cf7902bc56388; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:262
export const DOORTILE10____header_global_6d63ce8d650f77c3 = ((((((159) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8915a95a9623cb4d66762b74() {
  return __cxx_static_address_8915a95a9623cb4d66762b74.reference || (__cxx_static_address_8915a95a9623cb4d66762b74.reference = {
    __cReference: true,
    get value() { return DOORTILE10____header_global_6d63ce8d650f77c3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:263
export const DOORSHOCK____header_global_3b9e8c04160458be = ((((((160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f4694b78e521cf338e6e417d() {
  return __cxx_static_address_f4694b78e521cf338e6e417d.reference || (__cxx_static_address_f4694b78e521cf338e6e417d.reference = {
    __cReference: true,
    get value() { return DOORSHOCK____header_global_3b9e8c04160458be; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:264
export const DIPSWITCH____header_global_30cd3e7fb46906df = ((((((162) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_755e9eb52e610e9ec9ef21a0() {
  return __cxx_static_address_755e9eb52e610e9ec9ef21a0.reference || (__cxx_static_address_755e9eb52e610e9ec9ef21a0.reference = {
    __cReference: true,
    get value() { return DIPSWITCH____header_global_30cd3e7fb46906df; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:265
export const DIPSWITCH2____header_global_23ac2a35848f25df = ((((((164) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_530f1f013c663453efc69c01() {
  return __cxx_static_address_530f1f013c663453efc69c01.reference || (__cxx_static_address_530f1f013c663453efc69c01.reference = {
    __cReference: true,
    get value() { return DIPSWITCH2____header_global_23ac2a35848f25df; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:266
export const TECHSWITCH____header_global_afb113b2cba750c4 = ((((((166) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2ac7e057a8e2cd37ab983c3f() {
  return __cxx_static_address_2ac7e057a8e2cd37ab983c3f.reference || (__cxx_static_address_2ac7e057a8e2cd37ab983c3f.reference = {
    __cReference: true,
    get value() { return TECHSWITCH____header_global_afb113b2cba750c4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:267
export const DIPSWITCH3____header_global_10240e6ee9dc9d71 = ((((((168) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_56d9325bd03db8d6296ab11e() {
  return __cxx_static_address_56d9325bd03db8d6296ab11e.reference || (__cxx_static_address_56d9325bd03db8d6296ab11e.reference = {
    __cReference: true,
    get value() { return DIPSWITCH3____header_global_10240e6ee9dc9d71; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:268
export const ACCESSSWITCH2____header_global_9cd1a0180001ea69 = ((((((170) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9615a3cfc169c41f4c4b5e1a() {
  return __cxx_static_address_9615a3cfc169c41f4c4b5e1a.reference || (__cxx_static_address_9615a3cfc169c41f4c4b5e1a.reference = {
    __cReference: true,
    get value() { return ACCESSSWITCH2____header_global_9cd1a0180001ea69; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:269
export const FLOORSLIME____header_global_6fd5b15482940735 = ((((((200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d6342da5be098ecab8a6b727() {
  return __cxx_static_address_d6342da5be098ecab8a6b727.reference || (__cxx_static_address_d6342da5be098ecab8a6b727.reference = {
    __cReference: true,
    get value() { return FLOORSLIME____header_global_6fd5b15482940735; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:270
export const BIGFORCE____header_global_8c73d1d4ceed0131 = ((((((230) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2b050368d9baecf2e5078faf() {
  return __cxx_static_address_2b050368d9baecf2e5078faf.reference || (__cxx_static_address_2b050368d9baecf2e5078faf.reference = {
    __cReference: true,
    get value() { return BIGFORCE____header_global_8c73d1d4ceed0131; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:271
export const MASKWALL9____header_global_13845d667a1b2bd9 = ((((((255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7a1ffc1d640f45f0ba3f3c1d() {
  return __cxx_static_address_7a1ffc1d640f45f0ba3f3c1d.reference || (__cxx_static_address_7a1ffc1d640f45f0ba3f3c1d.reference = {
    __cReference: true,
    get value() { return MASKWALL9____header_global_13845d667a1b2bd9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:272
export const SCREENBREAK1____header_global_3fbfd0bacbdf6e9b = ((((((263) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_83b86ae62e2823d9e6b0dc50() {
  return __cxx_static_address_83b86ae62e2823d9e6b0dc50.reference || (__cxx_static_address_83b86ae62e2823d9e6b0dc50.reference = {
    __cReference: true,
    get value() { return SCREENBREAK1____header_global_3fbfd0bacbdf6e9b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:273
export const SCREENBREAK2____header_global_e35d345da196db5e = ((((((264) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3c24acaec0b8f02ab9aebaa1() {
  return __cxx_static_address_3c24acaec0b8f02ab9aebaa1.reference || (__cxx_static_address_3c24acaec0b8f02ab9aebaa1.reference = {
    __cReference: true,
    get value() { return SCREENBREAK2____header_global_e35d345da196db5e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:274
export const SCREENBREAK3____header_global_ad98e403895a86b1 = ((((((265) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3796b4798954c607fa2eb9ea() {
  return __cxx_static_address_3796b4798954c607fa2eb9ea.reference || (__cxx_static_address_3796b4798954c607fa2eb9ea.reference = {
    __cReference: true,
    get value() { return SCREENBREAK3____header_global_ad98e403895a86b1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:275
export const SCREENBREAK4____header_global_0257179fe031b371 = ((((((266) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c29df09206947f6cf830a558() {
  return __cxx_static_address_c29df09206947f6cf830a558.reference || (__cxx_static_address_c29df09206947f6cf830a558.reference = {
    __cReference: true,
    get value() { return SCREENBREAK4____header_global_0257179fe031b371; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:276
export const SCREENBREAK5____header_global_be76353bbdccca84 = ((((((267) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d35a57e21302cee3f1b5bd6f() {
  return __cxx_static_address_d35a57e21302cee3f1b5bd6f.reference || (__cxx_static_address_d35a57e21302cee3f1b5bd6f.reference = {
    __cReference: true,
    get value() { return SCREENBREAK5____header_global_be76353bbdccca84; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:277
export const SCREENBREAK6____header_global_63866c2dc55140ca = ((((((268) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_99fd5cc2959d8e9060ec44be() {
  return __cxx_static_address_99fd5cc2959d8e9060ec44be.reference || (__cxx_static_address_99fd5cc2959d8e9060ec44be.reference = {
    __cReference: true,
    get value() { return SCREENBREAK6____header_global_63866c2dc55140ca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:278
export const SCREENBREAK7____header_global_38ffe8aeed739779 = ((((((269) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f1f15cbfafb2e0f4f0576daf() {
  return __cxx_static_address_f1f15cbfafb2e0f4f0576daf.reference || (__cxx_static_address_f1f15cbfafb2e0f4f0576daf.reference = {
    __cReference: true,
    get value() { return SCREENBREAK7____header_global_38ffe8aeed739779; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:279
export const SCREENBREAK8____header_global_4e2b964742f8963c = ((((((270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4c61ed89e75ff43f228b2678() {
  return __cxx_static_address_4c61ed89e75ff43f228b2678.reference || (__cxx_static_address_4c61ed89e75ff43f228b2678.reference = {
    __cReference: true,
    get value() { return SCREENBREAK8____header_global_4e2b964742f8963c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:280
export const SCREENBREAK9____header_global_e14a1b7f3607cc0c = ((((((271) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6ca12da4b4e15158be164cf1() {
  return __cxx_static_address_6ca12da4b4e15158be164cf1.reference || (__cxx_static_address_6ca12da4b4e15158be164cf1.reference = {
    __cReference: true,
    get value() { return SCREENBREAK9____header_global_e14a1b7f3607cc0c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:281
export const SCREENBREAK10____header_global_f1998d6f4d824a9a = ((((((272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eb2556d0f01df5638347e83f() {
  return __cxx_static_address_eb2556d0f01df5638347e83f.reference || (__cxx_static_address_eb2556d0f01df5638347e83f.reference = {
    __cReference: true,
    get value() { return SCREENBREAK10____header_global_f1998d6f4d824a9a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:282
export const SCREENBREAK11____header_global_67018e19f95513f6 = ((((((273) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_86495d9a3fed557125785fb4() {
  return __cxx_static_address_86495d9a3fed557125785fb4.reference || (__cxx_static_address_86495d9a3fed557125785fb4.reference = {
    __cReference: true,
    get value() { return SCREENBREAK11____header_global_67018e19f95513f6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:283
export const SCREENBREAK12____header_global_f0dbebba2256874c = ((((((274) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c5e90f0aa249da13998ac36a() {
  return __cxx_static_address_c5e90f0aa249da13998ac36a.reference || (__cxx_static_address_c5e90f0aa249da13998ac36a.reference = {
    __cReference: true,
    get value() { return SCREENBREAK12____header_global_f0dbebba2256874c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:284
export const SCREENBREAK13____header_global_c03f826b58ee73c1 = ((((((275) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aa20b62a9a3baf75050f6320() {
  return __cxx_static_address_aa20b62a9a3baf75050f6320.reference || (__cxx_static_address_aa20b62a9a3baf75050f6320.reference = {
    __cReference: true,
    get value() { return SCREENBREAK13____header_global_c03f826b58ee73c1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:285
export const MASKWALL1____header_global_b15f5fc52d50e61f = ((((((285) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2fadc176acee880f7c5db50d() {
  return __cxx_static_address_2fadc176acee880f7c5db50d.reference || (__cxx_static_address_2fadc176acee880f7c5db50d.reference = {
    __cReference: true,
    get value() { return MASKWALL1____header_global_b15f5fc52d50e61f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:286
export const W_TECHWALL1____header_global_eebb80ee4a06047d = ((((((293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b9079be25964367572b8c880() {
  return __cxx_static_address_b9079be25964367572b8c880.reference || (__cxx_static_address_b9079be25964367572b8c880.reference = {
    __cReference: true,
    get value() { return W_TECHWALL1____header_global_eebb80ee4a06047d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:287
export const W_TECHWALL2____header_global_237634e2f618af1d = ((((((297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_29548a874e9a5aa13dfc87f8() {
  return __cxx_static_address_29548a874e9a5aa13dfc87f8.reference || (__cxx_static_address_29548a874e9a5aa13dfc87f8.reference = {
    __cReference: true,
    get value() { return W_TECHWALL2____header_global_237634e2f618af1d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:288
export const W_TECHWALL15____header_global_84da4a77362763ab = ((((((299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fc16f76b27f3ce1f3dba0d87() {
  return __cxx_static_address_fc16f76b27f3ce1f3dba0d87.reference || (__cxx_static_address_fc16f76b27f3ce1f3dba0d87.reference = {
    __cReference: true,
    get value() { return W_TECHWALL15____header_global_84da4a77362763ab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:289
export const W_TECHWALL3____header_global_453b31a9acc3355b = ((((((301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_69a61e6758c46d8e6972738d() {
  return __cxx_static_address_69a61e6758c46d8e6972738d.reference || (__cxx_static_address_69a61e6758c46d8e6972738d.reference = {
    __cReference: true,
    get value() { return W_TECHWALL3____header_global_453b31a9acc3355b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:290
export const W_TECHWALL4____header_global_3142ea1530f133fd = ((((((305) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4ced214524858a615505b35b() {
  return __cxx_static_address_4ced214524858a615505b35b.reference || (__cxx_static_address_4ced214524858a615505b35b.reference = {
    __cReference: true,
    get value() { return W_TECHWALL4____header_global_3142ea1530f133fd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:291
export const W_TECHWALL10____header_global_472ecad733c34fdc = ((((((306) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_da8bfd795e8caaec265b2d68() {
  return __cxx_static_address_da8bfd795e8caaec265b2d68.reference || (__cxx_static_address_da8bfd795e8caaec265b2d68.reference = {
    __cReference: true,
    get value() { return W_TECHWALL10____header_global_472ecad733c34fdc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:292
export const W_TECHWALL16____header_global_8b3f6f48a99cfa8b = ((((((307) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5b95ab71fcfa82c8eee7454a() {
  return __cxx_static_address_5b95ab71fcfa82c8eee7454a.reference || (__cxx_static_address_5b95ab71fcfa82c8eee7454a.reference = {
    __cReference: true,
    get value() { return W_TECHWALL16____header_global_8b3f6f48a99cfa8b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:293
export const WATERTILE2____header_global_5a79c9ad1dc17fe5 = ((((((336) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6aaaaa654a8fcdf3c232e72c() {
  return __cxx_static_address_6aaaaa654a8fcdf3c232e72c.reference || (__cxx_static_address_6aaaaa654a8fcdf3c232e72c.reference = {
    __cReference: true,
    get value() { return WATERTILE2____header_global_5a79c9ad1dc17fe5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:294
export const BPANNEL1____header_global_32e81fdd48ae127d = ((((((341) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_24e37c2f3d17de591ffba6dc() {
  return __cxx_static_address_24e37c2f3d17de591ffba6dc.reference || (__cxx_static_address_24e37c2f3d17de591ffba6dc.reference = {
    __cReference: true,
    get value() { return BPANNEL1____header_global_32e81fdd48ae127d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:295
export const PANNEL1____header_global_2ef98d97a791bbe1 = ((((((342) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6b1a1d247b5bc778637f2c56() {
  return __cxx_static_address_6b1a1d247b5bc778637f2c56.reference || (__cxx_static_address_6b1a1d247b5bc778637f2c56.reference = {
    __cReference: true,
    get value() { return PANNEL1____header_global_2ef98d97a791bbe1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:296
export const PANNEL2____header_global_1f2c91bd2c152ef9 = ((((((343) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e3380942136b8752f268d774() {
  return __cxx_static_address_e3380942136b8752f268d774.reference || (__cxx_static_address_e3380942136b8752f268d774.reference = {
    __cReference: true,
    get value() { return PANNEL2____header_global_1f2c91bd2c152ef9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:297
export const STATIC____header_global_ac4e4fd7645cf541 = ((((((351) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_65a5747e181753cfacec889b() {
  return __cxx_static_address_65a5747e181753cfacec889b.reference || (__cxx_static_address_65a5747e181753cfacec889b.reference = {
    __cReference: true,
    get value() { return STATIC____header_global_ac4e4fd7645cf541; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:298
export const W_SCREENBREAK____header_global_11ed350c1f530569 = ((((((357) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d9be5baf4e81e52c1955a8e7() {
  return __cxx_static_address_d9be5baf4e81e52c1955a8e7.reference || (__cxx_static_address_d9be5baf4e81e52c1955a8e7.reference = {
    __cReference: true,
    get value() { return W_SCREENBREAK____header_global_11ed350c1f530569; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:299
export const W_HITTECHWALL3____header_global_b467de5210c980b4 = ((((((360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1ac102499797504763a407ef() {
  return __cxx_static_address_1ac102499797504763a407ef.reference || (__cxx_static_address_1ac102499797504763a407ef.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL3____header_global_b467de5210c980b4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:300
export const W_HITTECHWALL4____header_global_61e09a3dc391b80f = ((((((361) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a4d4bdef2cd83a30cc2f7555() {
  return __cxx_static_address_a4d4bdef2cd83a30cc2f7555.reference || (__cxx_static_address_a4d4bdef2cd83a30cc2f7555.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL4____header_global_61e09a3dc391b80f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:301
export const W_HITTECHWALL2____header_global_b01de79c3cf90426 = ((((((362) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_67c7b486a500b508c2c79c0d() {
  return __cxx_static_address_67c7b486a500b508c2c79c0d.reference || (__cxx_static_address_67c7b486a500b508c2c79c0d.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL2____header_global_b01de79c3cf90426; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:302
export const W_HITTECHWALL1____header_global_e9927f8dbdd7c9e4 = ((((((363) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2e75e091d3ff5ef34f73d4b3() {
  return __cxx_static_address_2e75e091d3ff5ef34f73d4b3.reference || (__cxx_static_address_2e75e091d3ff5ef34f73d4b3.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL1____header_global_e9927f8dbdd7c9e4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:303
export const MASKWALL10____header_global_1552f14e0e1f6be9 = ((((((387) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1c14429440ccdc93f7fb6257() {
  return __cxx_static_address_1c14429440ccdc93f7fb6257.reference || (__cxx_static_address_1c14429440ccdc93f7fb6257.reference = {
    __cReference: true,
    get value() { return MASKWALL10____header_global_1552f14e0e1f6be9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:304
export const MASKWALL11____header_global_6abafa38922b9425 = ((((((391) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a36e0770416b32278feb0aa8() {
  return __cxx_static_address_a36e0770416b32278feb0aa8.reference || (__cxx_static_address_a36e0770416b32278feb0aa8.reference = {
    __cReference: true,
    get value() { return MASKWALL11____header_global_6abafa38922b9425; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:305
export const DOORTILE22____header_global_574b6e7e81f2fa32 = ((((((395) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d2af42f5ace140c18aa5984c() {
  return __cxx_static_address_d2af42f5ace140c18aa5984c.reference || (__cxx_static_address_d2af42f5ace140c18aa5984c.reference = {
    __cReference: true,
    get value() { return DOORTILE22____header_global_574b6e7e81f2fa32; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:306
export const FANSPRITE____header_global_3c3ab950e14fa357 = ((((((407) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_492d021a81f9cc456ae9fdc2() {
  return __cxx_static_address_492d021a81f9cc456ae9fdc2.reference || (__cxx_static_address_492d021a81f9cc456ae9fdc2.reference = {
    __cReference: true,
    get value() { return FANSPRITE____header_global_3c3ab950e14fa357; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:307
export const FANSPRITEBROKE____header_global_23cd51ff3d37e8ad = ((((((411) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_da1731c96945cfed8c5e35ec() {
  return __cxx_static_address_da1731c96945cfed8c5e35ec.reference || (__cxx_static_address_da1731c96945cfed8c5e35ec.reference = {
    __cReference: true,
    get value() { return FANSPRITEBROKE____header_global_23cd51ff3d37e8ad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:308
export const FANSHADOW____header_global_6fe2281d7de7232a = ((((((412) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_57de43897caa08d1f99ac8bc() {
  return __cxx_static_address_57de43897caa08d1f99ac8bc.reference || (__cxx_static_address_57de43897caa08d1f99ac8bc.reference = {
    __cReference: true,
    get value() { return FANSHADOW____header_global_6fe2281d7de7232a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:309
export const FANSHADOWBROKE____header_global_1a83b4ebc0041dab = ((((((416) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_86d1fdece9badeae64d8d763() {
  return __cxx_static_address_86d1fdece9badeae64d8d763.reference || (__cxx_static_address_86d1fdece9badeae64d8d763.reference = {
    __cReference: true,
    get value() { return FANSHADOWBROKE____header_global_1a83b4ebc0041dab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:310
export const DOORTILE18____header_global_6d1bf344aac65982 = ((((((447) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c34bae1bfb6afd5caac6ad0c() {
  return __cxx_static_address_c34bae1bfb6afd5caac6ad0c.reference || (__cxx_static_address_c34bae1bfb6afd5caac6ad0c.reference = {
    __cReference: true,
    get value() { return DOORTILE18____header_global_6d1bf344aac65982; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:311
export const DOORTILE19____header_global_d49c4991fb0100e6 = ((((((448) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_499772e824a124684dcd5b9d() {
  return __cxx_static_address_499772e824a124684dcd5b9d.reference || (__cxx_static_address_499772e824a124684dcd5b9d.reference = {
    __cReference: true,
    get value() { return DOORTILE19____header_global_d49c4991fb0100e6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:312
export const DOORTILE20____header_global_4563cc1afaa24d44 = ((((((449) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b9a812b2c28fd42e27627127() {
  return __cxx_static_address_b9a812b2c28fd42e27627127.reference || (__cxx_static_address_b9a812b2c28fd42e27627127.reference = {
    __cReference: true,
    get value() { return DOORTILE20____header_global_4563cc1afaa24d44; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:313
export const VIEWSCREEN2____header_global_3cd4ac266cf2ad5c = ((((((499) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a6b1a5f5c625879e075f76d2() {
  return __cxx_static_address_a6b1a5f5c625879e075f76d2.reference || (__cxx_static_address_a6b1a5f5c625879e075f76d2.reference = {
    __cReference: true,
    get value() { return VIEWSCREEN2____header_global_3cd4ac266cf2ad5c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:314
export const VIEWSCREEN____header_global_316ad25c514e7320 = ((((((502) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f3d356a1f5e8fc9757256806() {
  return __cxx_static_address_f3d356a1f5e8fc9757256806.reference || (__cxx_static_address_f3d356a1f5e8fc9757256806.reference = {
    __cReference: true,
    get value() { return VIEWSCREEN____header_global_316ad25c514e7320; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:315
export const GLASS____header_global_ac064c91b0fdabc2 = ((((((503) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_66ce42c50d1c19ede1c8d12f() {
  return __cxx_static_address_66ce42c50d1c19ede1c8d12f.reference || (__cxx_static_address_66ce42c50d1c19ede1c8d12f.reference = {
    __cReference: true,
    get value() { return GLASS____header_global_ac064c91b0fdabc2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:316
export const GLASS2____header_global_64d52a10b3e5feb2 = ((((((504) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_905d26a790340db3eaf7946d() {
  return __cxx_static_address_905d26a790340db3eaf7946d.reference || (__cxx_static_address_905d26a790340db3eaf7946d.reference = {
    __cReference: true,
    get value() { return GLASS2____header_global_64d52a10b3e5feb2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:317
export const STAINGLASS1____header_global_b54df7e442cff261 = ((((((510) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4effb738232e9ccc07dc7777() {
  return __cxx_static_address_4effb738232e9ccc07dc7777.reference || (__cxx_static_address_4effb738232e9ccc07dc7777.reference = {
    __cReference: true,
    get value() { return STAINGLASS1____header_global_b54df7e442cff261; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:318
export const MASKWALL5____header_global_5656f1226bf7ab73 = ((((((514) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aa715ae003ed024229254c4a() {
  return __cxx_static_address_aa715ae003ed024229254c4a.reference || (__cxx_static_address_aa715ae003ed024229254c4a.reference = {
    __cReference: true,
    get value() { return MASKWALL5____header_global_5656f1226bf7ab73; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:319
export const SATELITE____header_global_764b002f2c9df705 = ((((((516) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_522d41a7268abeb82d83809b() {
  return __cxx_static_address_522d41a7268abeb82d83809b.reference || (__cxx_static_address_522d41a7268abeb82d83809b.reference = {
    __cReference: true,
    get value() { return SATELITE____header_global_764b002f2c9df705; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:320
export const FUELPOD____header_global_a37a8278e730ec83 = ((((((517) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f98c3b064469fe073f7d3ec0() {
  return __cxx_static_address_f98c3b064469fe073f7d3ec0.reference || (__cxx_static_address_f98c3b064469fe073f7d3ec0.reference = {
    __cReference: true,
    get value() { return FUELPOD____header_global_a37a8278e730ec83; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:321
export const CRACK1____header_global_648d23953c35d717 = ((((((546) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_595e07f76e55e65059b47d3e() {
  return __cxx_static_address_595e07f76e55e65059b47d3e.reference || (__cxx_static_address_595e07f76e55e65059b47d3e.reference = {
    __cReference: true,
    get value() { return CRACK1____header_global_648d23953c35d717; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:322
export const CRACK2____header_global_6aaa8d3a3a3ff613 = ((((((547) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f76f50b1a35d8bcc5f3e9928() {
  return __cxx_static_address_f76f50b1a35d8bcc5f3e9928.reference || (__cxx_static_address_f76f50b1a35d8bcc5f3e9928.reference = {
    __cReference: true,
    get value() { return CRACK2____header_global_6aaa8d3a3a3ff613; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:323
export const CRACK3____header_global_0b894e35616bd6d0 = ((((((548) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_028c520113a1011d3b64e5be() {
  return __cxx_static_address_028c520113a1011d3b64e5be.reference || (__cxx_static_address_028c520113a1011d3b64e5be.reference = {
    __cReference: true,
    get value() { return CRACK3____header_global_0b894e35616bd6d0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:324
export const CRACK4____header_global_81c1e6f7679e773c = ((((((549) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_398b2edd780a342263a1062c() {
  return __cxx_static_address_398b2edd780a342263a1062c.reference || (__cxx_static_address_398b2edd780a342263a1062c.reference = {
    __cReference: true,
    get value() { return CRACK4____header_global_81c1e6f7679e773c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:325
export const FOOTPRINTS____header_global_78c305a0129c55b0 = ((((((550) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_94ff1656f9c3579c77b293ab() {
  return __cxx_static_address_94ff1656f9c3579c77b293ab.reference || (__cxx_static_address_94ff1656f9c3579c77b293ab.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS____header_global_78c305a0129c55b0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:326
export const DOMELITE____header_global_11b0433d7a8f68f1 = ((((((551) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9dcad367d8339ba80089d039() {
  return __cxx_static_address_9dcad367d8339ba80089d039.reference || (__cxx_static_address_9dcad367d8339ba80089d039.reference = {
    __cReference: true,
    get value() { return DOMELITE____header_global_11b0433d7a8f68f1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:327
export const CAMERAPOLE____header_global_c7deca83bdf7253f = ((((((554) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f7de5f9acce98a9b1a0155c2() {
  return __cxx_static_address_f7de5f9acce98a9b1a0155c2.reference || (__cxx_static_address_f7de5f9acce98a9b1a0155c2.reference = {
    __cReference: true,
    get value() { return CAMERAPOLE____header_global_c7deca83bdf7253f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:328
export const CHAIR1____header_global_7104f56b935a7169 = ((((((556) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9cdf95c036a671ac1dfe46d1() {
  return __cxx_static_address_9cdf95c036a671ac1dfe46d1.reference || (__cxx_static_address_9cdf95c036a671ac1dfe46d1.reference = {
    __cReference: true,
    get value() { return CHAIR1____header_global_7104f56b935a7169; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:329
export const CHAIR2____header_global_18fd1e2d69ce9b7f = ((((((557) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5d06d5ea5dc4634a5389fe6f() {
  return __cxx_static_address_5d06d5ea5dc4634a5389fe6f.reference || (__cxx_static_address_5d06d5ea5dc4634a5389fe6f.reference = {
    __cReference: true,
    get value() { return CHAIR2____header_global_18fd1e2d69ce9b7f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:330
export const BROKENCHAIR____header_global_d6b106464501512a = ((((((559) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c95665b1f792f5c64e64d36a() {
  return __cxx_static_address_c95665b1f792f5c64e64d36a.reference || (__cxx_static_address_c95665b1f792f5c64e64d36a.reference = {
    __cReference: true,
    get value() { return BROKENCHAIR____header_global_d6b106464501512a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:331
export const MIRROR____header_global_1e0beeeb2fa95537 = ((((((560) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_447275d522559a5e4e5a0bdc() {
  return __cxx_static_address_447275d522559a5e4e5a0bdc.reference || (__cxx_static_address_447275d522559a5e4e5a0bdc.reference = {
    __cReference: true,
    get value() { return MIRROR____header_global_1e0beeeb2fa95537; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:332
export const WATERFOUNTAIN____header_global_613b934f5a6bae43 = ((((((563) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_914943c7aebcee25c3bd664b() {
  return __cxx_static_address_914943c7aebcee25c3bd664b.reference || (__cxx_static_address_914943c7aebcee25c3bd664b.reference = {
    __cReference: true,
    get value() { return WATERFOUNTAIN____header_global_613b934f5a6bae43; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:333
export const WATERFOUNTAINBROKE____header_global_09383f95e330ea33 = ((((((567) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6d4aab42a96aec920256c1b7() {
  return __cxx_static_address_6d4aab42a96aec920256c1b7.reference || (__cxx_static_address_6d4aab42a96aec920256c1b7.reference = {
    __cReference: true,
    get value() { return WATERFOUNTAINBROKE____header_global_09383f95e330ea33; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:334
export const FEMMAG1____header_global_00448314c99a4ba8 = ((((((568) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_835f6a2b949befa5c7cf9e6b() {
  return __cxx_static_address_835f6a2b949befa5c7cf9e6b.reference || (__cxx_static_address_835f6a2b949befa5c7cf9e6b.reference = {
    __cReference: true,
    get value() { return FEMMAG1____header_global_00448314c99a4ba8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:335
export const TOILET____header_global_cf93770f7e3c3589 = ((((((569) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ec22062538b3f7e404100905() {
  return __cxx_static_address_ec22062538b3f7e404100905.reference || (__cxx_static_address_ec22062538b3f7e404100905.reference = {
    __cReference: true,
    get value() { return TOILET____header_global_cf93770f7e3c3589; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:336
export const STALL____header_global_b3ec11dac898686f = ((((((571) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5bdfdeedeb18eedc1121a1b9() {
  return __cxx_static_address_5bdfdeedeb18eedc1121a1b9.reference || (__cxx_static_address_5bdfdeedeb18eedc1121a1b9.reference = {
    __cReference: true,
    get value() { return STALL____header_global_b3ec11dac898686f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:337
export const STALLBROKE____header_global_8028027e81e51325 = ((((((573) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ef67e588556a6fbabf126151() {
  return __cxx_static_address_ef67e588556a6fbabf126151.reference || (__cxx_static_address_ef67e588556a6fbabf126151.reference = {
    __cReference: true,
    get value() { return STALLBROKE____header_global_8028027e81e51325; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:338
export const FEMMAG2____header_global_d074cbc119f3e698 = ((((((577) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_716d97d22b31ed37efde8890() {
  return __cxx_static_address_716d97d22b31ed37efde8890.reference || (__cxx_static_address_716d97d22b31ed37efde8890.reference = {
    __cReference: true,
    get value() { return FEMMAG2____header_global_d074cbc119f3e698; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:339
export const REACTOR2____header_global_c33c361c01977831 = ((((((578) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d164eec6b4e0ebb763870b09() {
  return __cxx_static_address_d164eec6b4e0ebb763870b09.reference || (__cxx_static_address_d164eec6b4e0ebb763870b09.reference = {
    __cReference: true,
    get value() { return REACTOR2____header_global_c33c361c01977831; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:340
export const REACTOR2BURNT____header_global_96b0126e6a2b86a1 = ((((((579) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_228f624768abebe969646ab3() {
  return __cxx_static_address_228f624768abebe969646ab3.reference || (__cxx_static_address_228f624768abebe969646ab3.reference = {
    __cReference: true,
    get value() { return REACTOR2BURNT____header_global_96b0126e6a2b86a1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:341
export const REACTOR2SPARK____header_global_fa2211b913232a2e = ((((((580) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_04336dd014b33a896dc3ae4b() {
  return __cxx_static_address_04336dd014b33a896dc3ae4b.reference || (__cxx_static_address_04336dd014b33a896dc3ae4b.reference = {
    __cReference: true,
    get value() { return REACTOR2SPARK____header_global_fa2211b913232a2e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:342
export const GRATE1____header_global_4f6dfb1af8e3e3e6 = ((((((595) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d980b2882eadf2b7c8193842() {
  return __cxx_static_address_d980b2882eadf2b7c8193842.reference || (__cxx_static_address_d980b2882eadf2b7c8193842.reference = {
    __cReference: true,
    get value() { return GRATE1____header_global_4f6dfb1af8e3e3e6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:343
export const BGRATE1____header_global_41356ed3a6b7eeec = ((((((596) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3c6f8e47c2b874ddd81b3bbf() {
  return __cxx_static_address_3c6f8e47c2b874ddd81b3bbf.reference || (__cxx_static_address_3c6f8e47c2b874ddd81b3bbf.reference = {
    __cReference: true,
    get value() { return BGRATE1____header_global_41356ed3a6b7eeec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:344
export const SOLARPANNEL____header_global_2e1b8ff18fd3f27b = ((((((602) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_136b9c32b83787f38f26dee9() {
  return __cxx_static_address_136b9c32b83787f38f26dee9.reference || (__cxx_static_address_136b9c32b83787f38f26dee9.reference = {
    __cReference: true,
    get value() { return SOLARPANNEL____header_global_2e1b8ff18fd3f27b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:345
export const NAKED1____header_global_6ab2a1c74fcf0e5d = ((((((603) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5bb7f060220230d60bcea40e() {
  return __cxx_static_address_5bb7f060220230d60bcea40e.reference || (__cxx_static_address_5bb7f060220230d60bcea40e.reference = {
    __cReference: true,
    get value() { return NAKED1____header_global_6ab2a1c74fcf0e5d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:346
export const ANTENNA____header_global_abbf52bd5168a643 = ((((((607) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9fcc49868b590b6d265614e6() {
  return __cxx_static_address_9fcc49868b590b6d265614e6.reference || (__cxx_static_address_9fcc49868b590b6d265614e6.reference = {
    __cReference: true,
    get value() { return ANTENNA____header_global_abbf52bd5168a643; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:347
export const MASKWALL12____header_global_5ff5b8df7357da53 = ((((((609) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5396a39eb5140ed010db5582() {
  return __cxx_static_address_5396a39eb5140ed010db5582.reference || (__cxx_static_address_5396a39eb5140ed010db5582.reference = {
    __cReference: true,
    get value() { return MASKWALL12____header_global_5ff5b8df7357da53; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:348
export const TOILETBROKE____header_global_141fb14f9cac5475 = ((((((615) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_402d33d8b3f8298cf981f7c7() {
  return __cxx_static_address_402d33d8b3f8298cf981f7c7.reference || (__cxx_static_address_402d33d8b3f8298cf981f7c7.reference = {
    __cReference: true,
    get value() { return TOILETBROKE____header_global_141fb14f9cac5475; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:349
export const PIPE2____header_global_1dcefcbbdc869f0e = ((((((616) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9ed2a3cec1cd5453adf14bda() {
  return __cxx_static_address_9ed2a3cec1cd5453adf14bda.reference || (__cxx_static_address_9ed2a3cec1cd5453adf14bda.reference = {
    __cReference: true,
    get value() { return PIPE2____header_global_1dcefcbbdc869f0e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:350
export const PIPE1B____header_global_5fb4dfc913a93fd1 = ((((((617) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5b4f2342c754f1fe97930e68() {
  return __cxx_static_address_5b4f2342c754f1fe97930e68.reference || (__cxx_static_address_5b4f2342c754f1fe97930e68.reference = {
    __cReference: true,
    get value() { return PIPE1B____header_global_5fb4dfc913a93fd1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:351
export const PIPE3____header_global_f52530ce8db6ddb4 = ((((((618) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f64ff337dce13c22e948902c() {
  return __cxx_static_address_f64ff337dce13c22e948902c.reference || (__cxx_static_address_f64ff337dce13c22e948902c.reference = {
    __cReference: true,
    get value() { return PIPE3____header_global_f52530ce8db6ddb4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:352
export const PIPE1____header_global_60472126858b7e9e = ((((((619) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ff0e7b4c6d884c30b08fd150() {
  return __cxx_static_address_ff0e7b4c6d884c30b08fd150.reference || (__cxx_static_address_ff0e7b4c6d884c30b08fd150.reference = {
    __cReference: true,
    get value() { return PIPE1____header_global_60472126858b7e9e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:353
export const CAMERA1____header_global_1ca0d42ec6d3fb43 = ((((((621) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2855dd42dbc4027167aef302() {
  return __cxx_static_address_2855dd42dbc4027167aef302.reference || (__cxx_static_address_2855dd42dbc4027167aef302.reference = {
    __cReference: true,
    get value() { return CAMERA1____header_global_1ca0d42ec6d3fb43; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:354
export const PIPE2B____header_global_4764f47ca537b9ff = ((((((633) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_498619ea30db7a1af8bb64c8() {
  return __cxx_static_address_498619ea30db7a1af8bb64c8.reference || (__cxx_static_address_498619ea30db7a1af8bb64c8.reference = {
    __cReference: true,
    get value() { return PIPE2B____header_global_4764f47ca537b9ff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:355
export const BOLT1____header_global_c14c7e6196e2e9cf = ((((((634) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_38aea284721cdf182ad44766() {
  return __cxx_static_address_38aea284721cdf182ad44766.reference || (__cxx_static_address_38aea284721cdf182ad44766.reference = {
    __cReference: true,
    get value() { return BOLT1____header_global_c14c7e6196e2e9cf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:356
export const W_NUMBERS____header_global_8b7f5b65b7cdc679 = ((((((640) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4b561e0264669afa69bef270() {
  return __cxx_static_address_4b561e0264669afa69bef270.reference || (__cxx_static_address_4b561e0264669afa69bef270.reference = {
    __cReference: true,
    get value() { return W_NUMBERS____header_global_8b7f5b65b7cdc679; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:357
export const WATERDRIP____header_global_9be55c3dadaf8d06 = ((((((660) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b7e225380c28bd958db80cd9() {
  return __cxx_static_address_b7e225380c28bd958db80cd9.reference || (__cxx_static_address_b7e225380c28bd958db80cd9.reference = {
    __cReference: true,
    get value() { return WATERDRIP____header_global_9be55c3dadaf8d06; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:358
export const WATERBUBBLE____header_global_ed557aebfce83ee9 = ((((((661) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5056811752ef771dc59ab106() {
  return __cxx_static_address_5056811752ef771dc59ab106.reference || (__cxx_static_address_5056811752ef771dc59ab106.reference = {
    __cReference: true,
    get value() { return WATERBUBBLE____header_global_ed557aebfce83ee9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:359
export const WATERBUBBLEMAKER____header_global_e96eba4e3746a096 = ((((((662) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e1a9b611d68b2466f6716915() {
  return __cxx_static_address_e1a9b611d68b2466f6716915.reference || (__cxx_static_address_e1a9b611d68b2466f6716915.reference = {
    __cReference: true,
    get value() { return WATERBUBBLEMAKER____header_global_e96eba4e3746a096; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:360
export const W_FORCEFIELD____header_global_678a75c3e51b4018 = ((((((663) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ce832426efbb05a9d0351d26() {
  return __cxx_static_address_ce832426efbb05a9d0351d26.reference || (__cxx_static_address_ce832426efbb05a9d0351d26.reference = {
    __cReference: true,
    get value() { return W_FORCEFIELD____header_global_678a75c3e51b4018; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:361
export const VACUUM____header_global_6514e1b3421afa8b = ((((((669) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e6f53f12a6881b0ed6c3e719() {
  return __cxx_static_address_e6f53f12a6881b0ed6c3e719.reference || (__cxx_static_address_e6f53f12a6881b0ed6c3e719.reference = {
    __cReference: true,
    get value() { return VACUUM____header_global_6514e1b3421afa8b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:362
export const FOOTPRINTS2____header_global_9ea346a7dddabc3d = ((((((672) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4092dfc95988b1546718cfe3() {
  return __cxx_static_address_4092dfc95988b1546718cfe3.reference || (__cxx_static_address_4092dfc95988b1546718cfe3.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS2____header_global_9ea346a7dddabc3d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:363
export const FOOTPRINTS3____header_global_0fd3a75c5d8042bb = ((((((673) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2064385ab6e2837017d75d73() {
  return __cxx_static_address_2064385ab6e2837017d75d73.reference || (__cxx_static_address_2064385ab6e2837017d75d73.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS3____header_global_0fd3a75c5d8042bb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:364
export const FOOTPRINTS4____header_global_e091989336bcda38 = ((((((674) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c31da1c0e82abeb5b338ac4f() {
  return __cxx_static_address_c31da1c0e82abeb5b338ac4f.reference || (__cxx_static_address_c31da1c0e82abeb5b338ac4f.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS4____header_global_e091989336bcda38; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:365
export const EGG____header_global_b1d7d6eef2e8de21 = ((((((675) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c0c12352ee979e4a9aa61a89() {
  return __cxx_static_address_c0c12352ee979e4a9aa61a89.reference || (__cxx_static_address_c0c12352ee979e4a9aa61a89.reference = {
    __cReference: true,
    get value() { return EGG____header_global_b1d7d6eef2e8de21; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:366
export const SCALE____header_global_5a197fb6bcf34004 = ((((((678) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_82035275bbf2fc1bf2f3c040() {
  return __cxx_static_address_82035275bbf2fc1bf2f3c040.reference || (__cxx_static_address_82035275bbf2fc1bf2f3c040.reference = {
    __cReference: true,
    get value() { return SCALE____header_global_5a197fb6bcf34004; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:367
export const CHAIR3____header_global_d97ca33682f6b30e = ((((((680) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_55acf14ab5aef1a74ac6dc03() {
  return __cxx_static_address_55acf14ab5aef1a74ac6dc03.reference || (__cxx_static_address_55acf14ab5aef1a74ac6dc03.reference = {
    __cReference: true,
    get value() { return CHAIR3____header_global_d97ca33682f6b30e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:368
export const CAMERALIGHT____header_global_b11722ff7df37ff2 = ((((((685) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a8256f4fd93fca649d170e11() {
  return __cxx_static_address_a8256f4fd93fca649d170e11.reference || (__cxx_static_address_a8256f4fd93fca649d170e11.reference = {
    __cReference: true,
    get value() { return CAMERALIGHT____header_global_b11722ff7df37ff2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:369
export const MOVIECAMERA____header_global_0a3e3cdbd099be46 = ((((((686) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_16e9859836201a1218169457() {
  return __cxx_static_address_16e9859836201a1218169457.reference || (__cxx_static_address_16e9859836201a1218169457.reference = {
    __cReference: true,
    get value() { return MOVIECAMERA____header_global_0a3e3cdbd099be46; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:370
export const IVUNIT____header_global_6bae10357569f84e = ((((((689) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3de04ce67207d767d9be3403() {
  return __cxx_static_address_3de04ce67207d767d9be3403.reference || (__cxx_static_address_3de04ce67207d767d9be3403.reference = {
    __cReference: true,
    get value() { return IVUNIT____header_global_6bae10357569f84e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:371
export const POT1____header_global_fa06e97c987f3fa9 = ((((((694) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3a1bfb35debf4f240318f5f8() {
  return __cxx_static_address_3a1bfb35debf4f240318f5f8.reference || (__cxx_static_address_3a1bfb35debf4f240318f5f8.reference = {
    __cReference: true,
    get value() { return POT1____header_global_fa06e97c987f3fa9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:372
export const POT2____header_global_437b07e4f19e223d = ((((((695) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8e76dd6b1bbb23ed77a1807e() {
  return __cxx_static_address_8e76dd6b1bbb23ed77a1807e.reference || (__cxx_static_address_8e76dd6b1bbb23ed77a1807e.reference = {
    __cReference: true,
    get value() { return POT2____header_global_437b07e4f19e223d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:373
export const POT3____header_global_2ddc9f88d003c2c9 = ((((((697) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a034c47d432e25d2fa623d15() {
  return __cxx_static_address_a034c47d432e25d2fa623d15.reference || (__cxx_static_address_a034c47d432e25d2fa623d15.reference = {
    __cReference: true,
    get value() { return POT3____header_global_2ddc9f88d003c2c9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:374
export const PIPE3B____header_global_8ef6abbf6edf42fa = ((((((700) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cba8130876016b53014ac655() {
  return __cxx_static_address_cba8130876016b53014ac655.reference || (__cxx_static_address_cba8130876016b53014ac655.reference = {
    __cReference: true,
    get value() { return PIPE3B____header_global_8ef6abbf6edf42fa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:375
export const WALLLIGHT3____header_global_8db561091749a034 = ((((((701) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_26e7a4851f49243d9f9abd14() {
  return __cxx_static_address_26e7a4851f49243d9f9abd14.reference || (__cxx_static_address_26e7a4851f49243d9f9abd14.reference = {
    __cReference: true,
    get value() { return WALLLIGHT3____header_global_8db561091749a034; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:376
export const WALLLIGHTBUST3____header_global_939f262c923fc78f = ((((((702) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_de55794a6a76fd6ee401c796() {
  return __cxx_static_address_de55794a6a76fd6ee401c796.reference || (__cxx_static_address_de55794a6a76fd6ee401c796.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST3____header_global_939f262c923fc78f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:377
export const WALLLIGHT1____header_global_bc58b7492e2aa940 = ((((((703) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6cc1e6337e5549c76c219199() {
  return __cxx_static_address_6cc1e6337e5549c76c219199.reference || (__cxx_static_address_6cc1e6337e5549c76c219199.reference = {
    __cReference: true,
    get value() { return WALLLIGHT1____header_global_bc58b7492e2aa940; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:378
export const WALLLIGHTBUST1____header_global_861db99d898795f5 = ((((((704) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ecc6272ceed7d1aaca97dfdf() {
  return __cxx_static_address_ecc6272ceed7d1aaca97dfdf.reference || (__cxx_static_address_ecc6272ceed7d1aaca97dfdf.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST1____header_global_861db99d898795f5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:379
export const WALLLIGHT2____header_global_69d66a2d4c6c6134 = ((((((705) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9dbb56384b38dc1517821822() {
  return __cxx_static_address_9dbb56384b38dc1517821822.reference || (__cxx_static_address_9dbb56384b38dc1517821822.reference = {
    __cReference: true,
    get value() { return WALLLIGHT2____header_global_69d66a2d4c6c6134; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:380
export const WALLLIGHTBUST2____header_global_95e1c4bc9b5dd18b = ((((((706) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c587255275cdd2c18a8cd2d3() {
  return __cxx_static_address_c587255275cdd2c18a8cd2d3.reference || (__cxx_static_address_c587255275cdd2c18a8cd2d3.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST2____header_global_95e1c4bc9b5dd18b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:381
export const LIGHTSWITCH2____header_global_4e2104d0a9d8e7b7 = ((((((712) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a5803e71c9aa93a66489999a() {
  return __cxx_static_address_a5803e71c9aa93a66489999a.reference || (__cxx_static_address_a5803e71c9aa93a66489999a.reference = {
    __cReference: true,
    get value() { return LIGHTSWITCH2____header_global_4e2104d0a9d8e7b7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:382
export const WAITTOBESEATED____header_global_46be7bfd1596b8be = ((((((716) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0571481aa37cd7cf2f47ab7f() {
  return __cxx_static_address_0571481aa37cd7cf2f47ab7f.reference || (__cxx_static_address_0571481aa37cd7cf2f47ab7f.reference = {
    __cReference: true,
    get value() { return WAITTOBESEATED____header_global_46be7bfd1596b8be; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:383
export const DOORTILE14____header_global_dc688fd92e75a9ce = ((((((717) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e9a1125bb3d87926e64a4dd9() {
  return __cxx_static_address_e9a1125bb3d87926e64a4dd9.reference || (__cxx_static_address_e9a1125bb3d87926e64a4dd9.reference = {
    __cReference: true,
    get value() { return DOORTILE14____header_global_dc688fd92e75a9ce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:384
export const STATUE____header_global_756d38beef9e9fce = ((((((753) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7a772d0a9c5938a7b30f0b2e() {
  return __cxx_static_address_7a772d0a9c5938a7b30f0b2e.reference || (__cxx_static_address_7a772d0a9c5938a7b30f0b2e.reference = {
    __cReference: true,
    get value() { return STATUE____header_global_756d38beef9e9fce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:385
export const MIKE____header_global_44690c687536f75b = ((((((762) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_725bad4eed56c380e190ec05() {
  return __cxx_static_address_725bad4eed56c380e190ec05.reference || (__cxx_static_address_725bad4eed56c380e190ec05.reference = {
    __cReference: true,
    get value() { return MIKE____header_global_44690c687536f75b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:386
export const VASE____header_global_0892106f69a55677 = ((((((765) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_339895ad9fe585a49746e71d() {
  return __cxx_static_address_339895ad9fe585a49746e71d.reference || (__cxx_static_address_339895ad9fe585a49746e71d.reference = {
    __cReference: true,
    get value() { return VASE____header_global_0892106f69a55677; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:387
export const SUSHIPLATE1____header_global_d6a9d6c4c522b1c9 = ((((((768) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1c7c7a79d15e45e61629f9d0() {
  return __cxx_static_address_1c7c7a79d15e45e61629f9d0.reference || (__cxx_static_address_1c7c7a79d15e45e61629f9d0.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE1____header_global_d6a9d6c4c522b1c9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:388
export const SUSHIPLATE2____header_global_39b1dfea197a0d4b = ((((((769) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_86147ee9c80f5fa7d0f66546() {
  return __cxx_static_address_86147ee9c80f5fa7d0f66546.reference || (__cxx_static_address_86147ee9c80f5fa7d0f66546.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE2____header_global_39b1dfea197a0d4b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:389
export const SUSHIPLATE3____header_global_ccfffa42c87b0d2e = ((((((774) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9ef4cfb94356367f6f14418e() {
  return __cxx_static_address_9ef4cfb94356367f6f14418e.reference || (__cxx_static_address_9ef4cfb94356367f6f14418e.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE3____header_global_ccfffa42c87b0d2e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:390
export const SUSHIPLATE4____header_global_3eb23e86fbc93428 = ((((((779) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2c8c1d3bcf14a0a34e4e0a50() {
  return __cxx_static_address_2c8c1d3bcf14a0a34e4e0a50.reference || (__cxx_static_address_2c8c1d3bcf14a0a34e4e0a50.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE4____header_global_3eb23e86fbc93428; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:391
export const DOORTILE16____header_global_00e39e7db3028db0 = ((((((781) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_940b8410f32ca8da73cf7500() {
  return __cxx_static_address_940b8410f32ca8da73cf7500.reference || (__cxx_static_address_940b8410f32ca8da73cf7500.reference = {
    __cReference: true,
    get value() { return DOORTILE16____header_global_00e39e7db3028db0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:392
export const SUSHIPLATE5____header_global_230de568d45283f0 = ((((((792) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_407a840a934b34f8fa30f551() {
  return __cxx_static_address_407a840a934b34f8fa30f551.reference || (__cxx_static_address_407a840a934b34f8fa30f551.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE5____header_global_230de568d45283f0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:393
export const OJ____header_global_4407ccf8a917edc7 = ((((((806) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0df18908779f3d3dbaf8941a() {
  return __cxx_static_address_0df18908779f3d3dbaf8941a.reference || (__cxx_static_address_0df18908779f3d3dbaf8941a.reference = {
    __cReference: true,
    get value() { return OJ____header_global_4407ccf8a917edc7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:394
export const MASKWALL13____header_global_cc8bb494c9cb55da = ((((((830) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6989f3a26bf752db328bed83() {
  return __cxx_static_address_6989f3a26bf752db328bed83.reference || (__cxx_static_address_6989f3a26bf752db328bed83.reference = {
    __cReference: true,
    get value() { return MASKWALL13____header_global_cc8bb494c9cb55da; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:395
export const HURTRAIL____header_global_176a63ceaab72809 = ((((((859) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_594eaa09d02e50ab8e834120() {
  return __cxx_static_address_594eaa09d02e50ab8e834120.reference || (__cxx_static_address_594eaa09d02e50ab8e834120.reference = {
    __cReference: true,
    get value() { return HURTRAIL____header_global_176a63ceaab72809; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:396
export const POWERSWITCH1____header_global_9f72754a44aa4cfd = ((((((860) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_29894d67b43abda92763d7f7() {
  return __cxx_static_address_29894d67b43abda92763d7f7.reference || (__cxx_static_address_29894d67b43abda92763d7f7.reference = {
    __cReference: true,
    get value() { return POWERSWITCH1____header_global_9f72754a44aa4cfd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:397
export const LOCKSWITCH1____header_global_9ea7b0ea15d0997a = ((((((862) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b83c34a22b394d1af6c8272f() {
  return __cxx_static_address_b83c34a22b394d1af6c8272f.reference || (__cxx_static_address_b83c34a22b394d1af6c8272f.reference = {
    __cReference: true,
    get value() { return LOCKSWITCH1____header_global_9ea7b0ea15d0997a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:398
export const POWERSWITCH2____header_global_f4acf9a5d3b272df = ((((((864) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7f23cf90a8457f32c8ed72b0() {
  return __cxx_static_address_7f23cf90a8457f32c8ed72b0.reference || (__cxx_static_address_7f23cf90a8457f32c8ed72b0.reference = {
    __cReference: true,
    get value() { return POWERSWITCH2____header_global_f4acf9a5d3b272df; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:399
export const ATM____header_global_b04ed26276205fc6 = ((((((867) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4f9640b0b7142e7d54950364() {
  return __cxx_static_address_4f9640b0b7142e7d54950364.reference || (__cxx_static_address_4f9640b0b7142e7d54950364.reference = {
    __cReference: true,
    get value() { return ATM____header_global_b04ed26276205fc6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:400
export const STATUEFLASH____header_global_e50718e031510fb9 = ((((((869) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c009b42d98054541589e9efe() {
  return __cxx_static_address_c009b42d98054541589e9efe.reference || (__cxx_static_address_c009b42d98054541589e9efe.reference = {
    __cReference: true,
    get value() { return STATUEFLASH____header_global_e50718e031510fb9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:401
export const ATMBROKE____header_global_c20d4aa3bd2667ac = ((((((888) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4be5ecb430e12f4da7ffc8a1() {
  return __cxx_static_address_4be5ecb430e12f4da7ffc8a1.reference || (__cxx_static_address_4be5ecb430e12f4da7ffc8a1.reference = {
    __cReference: true,
    get value() { return ATMBROKE____header_global_c20d4aa3bd2667ac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:402
export const STRIPEBALL____header_global_a6e92c4be2805457 = ((((((901) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c8e3c8ac219b7bb290bb16fd() {
  return __cxx_static_address_c8e3c8ac219b7bb290bb16fd.reference || (__cxx_static_address_c8e3c8ac219b7bb290bb16fd.reference = {
    __cReference: true,
    get value() { return STRIPEBALL____header_global_a6e92c4be2805457; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:403
export const QUEBALL____header_global_6dc832721b6214d8 = ((((((902) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_670979629356269723e96a38() {
  return __cxx_static_address_670979629356269723e96a38.reference || (__cxx_static_address_670979629356269723e96a38.reference = {
    __cReference: true,
    get value() { return QUEBALL____header_global_6dc832721b6214d8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:404
export const POCKET____header_global_44f11391188c28e2 = ((((((903) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c95002fd73982b3374f83c9a() {
  return __cxx_static_address_c95002fd73982b3374f83c9a.reference || (__cxx_static_address_c95002fd73982b3374f83c9a.reference = {
    __cReference: true,
    get value() { return POCKET____header_global_44f11391188c28e2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:405
export const WOODENHORSE____header_global_baf7993b95c468f1 = ((((((904) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c0638eb3595d53d2c8815679() {
  return __cxx_static_address_c0638eb3595d53d2c8815679.reference || (__cxx_static_address_c0638eb3595d53d2c8815679.reference = {
    __cReference: true,
    get value() { return WOODENHORSE____header_global_baf7993b95c468f1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:406
export const TREE1____header_global_48324854ff3acba0 = ((((((908) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e9864755b438bd08cc26c37a() {
  return __cxx_static_address_e9864755b438bd08cc26c37a.reference || (__cxx_static_address_e9864755b438bd08cc26c37a.reference = {
    __cReference: true,
    get value() { return TREE1____header_global_48324854ff3acba0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:407
export const TREE2____header_global_ff4e56e0e60f3350 = ((((((910) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8bee8ccd94302835770dfb1e() {
  return __cxx_static_address_8bee8ccd94302835770dfb1e.reference || (__cxx_static_address_8bee8ccd94302835770dfb1e.reference = {
    __cReference: true,
    get value() { return TREE2____header_global_ff4e56e0e60f3350; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:408
export const CACTUS____header_global_b7faa6ab8906cebf = ((((((911) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3bcbdafc1045c758dd93a042() {
  return __cxx_static_address_3bcbdafc1045c758dd93a042.reference || (__cxx_static_address_3bcbdafc1045c758dd93a042.reference = {
    __cReference: true,
    get value() { return CACTUS____header_global_b7faa6ab8906cebf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:409
export const MASKWALL2____header_global_12d56f3cdc99e427 = ((((((913) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1acef5efba4f5aec8e1b6066() {
  return __cxx_static_address_1acef5efba4f5aec8e1b6066.reference || (__cxx_static_address_1acef5efba4f5aec8e1b6066.reference = {
    __cReference: true,
    get value() { return MASKWALL2____header_global_12d56f3cdc99e427; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:410
export const MASKWALL3____header_global_874e6bc911750212 = ((((((914) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ab7ea91b3343c324030d0f48() {
  return __cxx_static_address_ab7ea91b3343c324030d0f48.reference || (__cxx_static_address_ab7ea91b3343c324030d0f48.reference = {
    __cReference: true,
    get value() { return MASKWALL3____header_global_874e6bc911750212; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:411
export const MASKWALL4____header_global_19b13a995b99248f = ((((((915) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f2eef85e20e976379185dab1() {
  return __cxx_static_address_f2eef85e20e976379185dab1.reference || (__cxx_static_address_f2eef85e20e976379185dab1.reference = {
    __cReference: true,
    get value() { return MASKWALL4____header_global_19b13a995b99248f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:412
export const FIREEXT____header_global_380617b7f47ea966 = ((((((916) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e7c8156e42371b80fa192eb1() {
  return __cxx_static_address_e7c8156e42371b80fa192eb1.reference || (__cxx_static_address_e7c8156e42371b80fa192eb1.reference = {
    __cReference: true,
    get value() { return FIREEXT____header_global_380617b7f47ea966; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:413
export const TOILETWATER____header_global_41bc0d3512d60bbf = ((((((921) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d133ce03c0548a39ce443322() {
  return __cxx_static_address_d133ce03c0548a39ce443322.reference || (__cxx_static_address_d133ce03c0548a39ce443322.reference = {
    __cReference: true,
    get value() { return TOILETWATER____header_global_41bc0d3512d60bbf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:414
export const NEON1____header_global_98adebe2cf8227c7 = ((((((925) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_080b9a4d00a269d44c98149b() {
  return __cxx_static_address_080b9a4d00a269d44c98149b.reference || (__cxx_static_address_080b9a4d00a269d44c98149b.reference = {
    __cReference: true,
    get value() { return NEON1____header_global_98adebe2cf8227c7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:415
export const NEON2____header_global_36fae1835f347663 = ((((((926) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_03bffc242b9f1051d96e86fc() {
  return __cxx_static_address_03bffc242b9f1051d96e86fc.reference || (__cxx_static_address_03bffc242b9f1051d96e86fc.reference = {
    __cReference: true,
    get value() { return NEON2____header_global_36fae1835f347663; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:416
export const CACTUSBROKE____header_global_0f04eaf1cb0fb3cc = ((((((939) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c6405a97adf328d1c4dc1c90() {
  return __cxx_static_address_c6405a97adf328d1c4dc1c90.reference || (__cxx_static_address_c6405a97adf328d1c4dc1c90.reference = {
    __cReference: true,
    get value() { return CACTUSBROKE____header_global_0f04eaf1cb0fb3cc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:417
export const BOUNCEMINE____header_global_5ea75eeb7c4ee86b = ((((((940) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fe741c2842635b5373e873b0() {
  return __cxx_static_address_fe741c2842635b5373e873b0.reference || (__cxx_static_address_fe741c2842635b5373e873b0.reference = {
    __cReference: true,
    get value() { return BOUNCEMINE____header_global_5ea75eeb7c4ee86b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:418
export const BROKEFIREHYDRENT____header_global_85878cba2e5feabb = ((((((950) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2d86b6b391247526abb84df8() {
  return __cxx_static_address_2d86b6b391247526abb84df8.reference || (__cxx_static_address_2d86b6b391247526abb84df8.reference = {
    __cReference: true,
    get value() { return BROKEFIREHYDRENT____header_global_85878cba2e5feabb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:419
export const BOX____header_global_d8b01d0b9d1e69d7 = ((((((951) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_99ea101cdefbe5791d6fc8fe() {
  return __cxx_static_address_99ea101cdefbe5791d6fc8fe.reference || (__cxx_static_address_99ea101cdefbe5791d6fc8fe.reference = {
    __cReference: true,
    get value() { return BOX____header_global_d8b01d0b9d1e69d7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:420
export const BULLETHOLE____header_global_855db5bb7af4a336 = ((((((952) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_32b3bcf0cb711a5ffe3e7442() {
  return __cxx_static_address_32b3bcf0cb711a5ffe3e7442.reference || (__cxx_static_address_32b3bcf0cb711a5ffe3e7442.reference = {
    __cReference: true,
    get value() { return BULLETHOLE____header_global_855db5bb7af4a336; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:421
export const BOTTLE1____header_global_889740d540b8aa30 = ((((((954) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b99fcc5c1f097ad1c784d459() {
  return __cxx_static_address_b99fcc5c1f097ad1c784d459.reference || (__cxx_static_address_b99fcc5c1f097ad1c784d459.reference = {
    __cReference: true,
    get value() { return BOTTLE1____header_global_889740d540b8aa30; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:422
export const BOTTLE2____header_global_9ee80ea01f13195f = ((((((955) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9cd1ae65416fd47a44f2b660() {
  return __cxx_static_address_9cd1ae65416fd47a44f2b660.reference || (__cxx_static_address_9cd1ae65416fd47a44f2b660.reference = {
    __cReference: true,
    get value() { return BOTTLE2____header_global_9ee80ea01f13195f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:423
export const BOTTLE3____header_global_520f94341ff08ef6 = ((((((956) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2e18709b146bae3f39d5869c() {
  return __cxx_static_address_2e18709b146bae3f39d5869c.reference || (__cxx_static_address_2e18709b146bae3f39d5869c.reference = {
    __cReference: true,
    get value() { return BOTTLE3____header_global_520f94341ff08ef6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:424
export const BOTTLE4____header_global_48d226fd3f70aec0 = ((((((957) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d2268bc2b972824b8e7094b1() {
  return __cxx_static_address_d2268bc2b972824b8e7094b1.reference || (__cxx_static_address_d2268bc2b972824b8e7094b1.reference = {
    __cReference: true,
    get value() { return BOTTLE4____header_global_48d226fd3f70aec0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:425
export const FEMPIC5____header_global_83a516c3d155005d = ((((((963) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bbd67d53b8930f19d6906ba8() {
  return __cxx_static_address_bbd67d53b8930f19d6906ba8.reference || (__cxx_static_address_bbd67d53b8930f19d6906ba8.reference = {
    __cReference: true,
    get value() { return FEMPIC5____header_global_83a516c3d155005d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:426
export const FEMPIC6____header_global_e56e9a18456d4d4c = ((((((964) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_96f188c7e2fd31f27fb0adf7() {
  return __cxx_static_address_96f188c7e2fd31f27fb0adf7.reference || (__cxx_static_address_96f188c7e2fd31f27fb0adf7.reference = {
    __cReference: true,
    get value() { return FEMPIC6____header_global_e56e9a18456d4d4c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:427
export const FEMPIC7____header_global_f9370bc82e6440ab = ((((((965) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ba715694f9e56917038e5667() {
  return __cxx_static_address_ba715694f9e56917038e5667.reference || (__cxx_static_address_ba715694f9e56917038e5667.reference = {
    __cReference: true,
    get value() { return FEMPIC7____header_global_f9370bc82e6440ab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:428
export const HYDROPLANT____header_global_30d713e1ead0c671 = ((((((969) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_495c757f57318e448057ffb1() {
  return __cxx_static_address_495c757f57318e448057ffb1.reference || (__cxx_static_address_495c757f57318e448057ffb1.reference = {
    __cReference: true,
    get value() { return HYDROPLANT____header_global_30d713e1ead0c671; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:429
export const OCEANSPRITE1____header_global_60dc57c992517890 = ((((((971) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a11fb6871a3364baab280854() {
  return __cxx_static_address_a11fb6871a3364baab280854.reference || (__cxx_static_address_a11fb6871a3364baab280854.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE1____header_global_60dc57c992517890; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:430
export const OCEANSPRITE2____header_global_4df41920322b63ce = ((((((972) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_55c1357894417f2833add1f9() {
  return __cxx_static_address_55c1357894417f2833add1f9.reference || (__cxx_static_address_55c1357894417f2833add1f9.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE2____header_global_4df41920322b63ce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:431
export const OCEANSPRITE3____header_global_4f082e90b5e3a04b = ((((((973) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f5b591045dceb73b486a1041() {
  return __cxx_static_address_f5b591045dceb73b486a1041.reference || (__cxx_static_address_f5b591045dceb73b486a1041.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE3____header_global_4f082e90b5e3a04b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:432
export const OCEANSPRITE4____header_global_7f4db092119a4884 = ((((((974) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b52fdcc570ebed9015665699() {
  return __cxx_static_address_b52fdcc570ebed9015665699.reference || (__cxx_static_address_b52fdcc570ebed9015665699.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE4____header_global_7f4db092119a4884; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:433
export const OCEANSPRITE5____header_global_bce7ddddca2d94be = ((((((975) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4db10bb5018d8fcdd0825c61() {
  return __cxx_static_address_4db10bb5018d8fcdd0825c61.reference || (__cxx_static_address_4db10bb5018d8fcdd0825c61.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE5____header_global_bce7ddddca2d94be; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:434
export const GENERICPOLE____header_global_adb0972c96ef8cd8 = ((((((977) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c95aa8c0fc4d61ad6b80f0e8() {
  return __cxx_static_address_c95aa8c0fc4d61ad6b80f0e8.reference || (__cxx_static_address_c95aa8c0fc4d61ad6b80f0e8.reference = {
    __cReference: true,
    get value() { return GENERICPOLE____header_global_adb0972c96ef8cd8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:435
export const CONE____header_global_937ba9623d427980 = ((((((978) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_efd8bb4a3b9f82e6b04973de() {
  return __cxx_static_address_efd8bb4a3b9f82e6b04973de.reference || (__cxx_static_address_efd8bb4a3b9f82e6b04973de.reference = {
    __cReference: true,
    get value() { return CONE____header_global_937ba9623d427980; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:436
export const HANGLIGHT____header_global_0a88aae394ea0d07 = ((((((979) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_749f0a7cba7805eef07e7db5() {
  return __cxx_static_address_749f0a7cba7805eef07e7db5.reference || (__cxx_static_address_749f0a7cba7805eef07e7db5.reference = {
    __cReference: true,
    get value() { return HANGLIGHT____header_global_0a88aae394ea0d07; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:437
export const HYDRENT____header_global_456a259693d7a7ce = ((((((981) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d72d1fd202e22ae355ca6c2b() {
  return __cxx_static_address_d72d1fd202e22ae355ca6c2b.reference || (__cxx_static_address_d72d1fd202e22ae355ca6c2b.reference = {
    __cReference: true,
    get value() { return HYDRENT____header_global_456a259693d7a7ce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:438
export const MASKWALL14____header_global_e1b216a87e001433 = ((((((988) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_55dd6183f379324dc7ed16f9() {
  return __cxx_static_address_55dd6183f379324dc7ed16f9.reference || (__cxx_static_address_55dd6183f379324dc7ed16f9.reference = {
    __cReference: true,
    get value() { return MASKWALL14____header_global_e1b216a87e001433; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:439
export const TIRE____header_global_adfa317e4d8f21b5 = ((((((990) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3e5ed877a1d9a36b1333a12c() {
  return __cxx_static_address_3e5ed877a1d9a36b1333a12c.reference || (__cxx_static_address_3e5ed877a1d9a36b1333a12c.reference = {
    __cReference: true,
    get value() { return TIRE____header_global_adfa317e4d8f21b5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:440
export const PIPE5____header_global_0c0ae376a3cc6b9a = ((((((994) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b58937471dc5fec502c5c209() {
  return __cxx_static_address_b58937471dc5fec502c5c209.reference || (__cxx_static_address_b58937471dc5fec502c5c209.reference = {
    __cReference: true,
    get value() { return PIPE5____header_global_0c0ae376a3cc6b9a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:441
export const PIPE6____header_global_ca4943ebee311771 = ((((((995) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0a6a023a4d252b30e903910e() {
  return __cxx_static_address_0a6a023a4d252b30e903910e.reference || (__cxx_static_address_0a6a023a4d252b30e903910e.reference = {
    __cReference: true,
    get value() { return PIPE6____header_global_ca4943ebee311771; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:442
export const PIPE4____header_global_51cf042422079829 = ((((((996) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f889793795e14b84eee31c33() {
  return __cxx_static_address_f889793795e14b84eee31c33.reference || (__cxx_static_address_f889793795e14b84eee31c33.reference = {
    __cReference: true,
    get value() { return PIPE4____header_global_51cf042422079829; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:443
export const PIPE4B____header_global_0a96b838558ca482 = ((((((997) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_721ff06b72c0fa1174fb18a8() {
  return __cxx_static_address_721ff06b72c0fa1174fb18a8.reference || (__cxx_static_address_721ff06b72c0fa1174fb18a8.reference = {
    __cReference: true,
    get value() { return PIPE4B____header_global_0a96b838558ca482; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:444
export const BROKEHYDROPLANT____header_global_1f36dfb4ff87058a = ((((((1003) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ab885b18ee71697012ff8e8f() {
  return __cxx_static_address_ab885b18ee71697012ff8e8f.reference || (__cxx_static_address_ab885b18ee71697012ff8e8f.reference = {
    __cReference: true,
    get value() { return BROKEHYDROPLANT____header_global_1f36dfb4ff87058a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:445
export const PIPE5B____header_global_77011f58c601170b = ((((((1005) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bc14c8c3a11da8f04f89238b() {
  return __cxx_static_address_bc14c8c3a11da8f04f89238b.reference || (__cxx_static_address_bc14c8c3a11da8f04f89238b.reference = {
    __cReference: true,
    get value() { return PIPE5B____header_global_77011f58c601170b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:446
export const NEON3____header_global_8f266ddf90fd8004 = ((((((1007) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8a3f767cba065d3a59d2256a() {
  return __cxx_static_address_8a3f767cba065d3a59d2256a.reference || (__cxx_static_address_8a3f767cba065d3a59d2256a.reference = {
    __cReference: true,
    get value() { return NEON3____header_global_8f266ddf90fd8004; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:447
export const NEON4____header_global_27a24911a91dc56e = ((((((1008) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f462796ba5e4031c633dd1f7() {
  return __cxx_static_address_f462796ba5e4031c633dd1f7.reference || (__cxx_static_address_f462796ba5e4031c633dd1f7.reference = {
    __cReference: true,
    get value() { return NEON4____header_global_27a24911a91dc56e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:448
export const NEON5____header_global_c0f84a0a791a3c0f = ((((((1009) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c83a31cc619a5727b99d35e3() {
  return __cxx_static_address_c83a31cc619a5727b99d35e3.reference || (__cxx_static_address_c83a31cc619a5727b99d35e3.reference = {
    __cReference: true,
    get value() { return NEON5____header_global_c0f84a0a791a3c0f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:449
export const BOTTLE5____header_global_f0439ea1cb90325a = ((((((1012) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3236415d653b1a13f140cb15() {
  return __cxx_static_address_3236415d653b1a13f140cb15.reference || (__cxx_static_address_3236415d653b1a13f140cb15.reference = {
    __cReference: true,
    get value() { return BOTTLE5____header_global_f0439ea1cb90325a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:450
export const BOTTLE6____header_global_3e6011c4cd5331eb = ((((((1013) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ffde9272147d74d824aa0d8b() {
  return __cxx_static_address_ffde9272147d74d824aa0d8b.reference || (__cxx_static_address_ffde9272147d74d824aa0d8b.reference = {
    __cReference: true,
    get value() { return BOTTLE6____header_global_3e6011c4cd5331eb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:451
export const BOTTLE8____header_global_8377be93eb37c989 = ((((((1014) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2f842f0911d99017e0801888() {
  return __cxx_static_address_2f842f0911d99017e0801888.reference || (__cxx_static_address_2f842f0911d99017e0801888.reference = {
    __cReference: true,
    get value() { return BOTTLE8____header_global_8377be93eb37c989; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:452
export const SPOTLITE____header_global_9997d3da0d386333 = ((((((1020) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_04eb68921011d7b68051f10b() {
  return __cxx_static_address_04eb68921011d7b68051f10b.reference || (__cxx_static_address_04eb68921011d7b68051f10b.reference = {
    __cReference: true,
    get value() { return SPOTLITE____header_global_9997d3da0d386333; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:453
export const MASKWALL15____header_global_dd8c891eb3ca2b05 = ((((((1024) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_74d1528a5fdfadc222ec6c58() {
  return __cxx_static_address_74d1528a5fdfadc222ec6c58.reference || (__cxx_static_address_74d1528a5fdfadc222ec6c58.reference = {
    __cReference: true,
    get value() { return MASKWALL15____header_global_dd8c891eb3ca2b05; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:454
export const BOTTLE7____header_global_fe600fbaaac015e9 = ((((((1025) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a3704213bda1674a204ee892() {
  return __cxx_static_address_a3704213bda1674a204ee892.reference || (__cxx_static_address_a3704213bda1674a204ee892.reference = {
    __cReference: true,
    get value() { return BOTTLE7____header_global_fe600fbaaac015e9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:455
export const HORSEONSIDE____header_global_33bc99fe89dc5ce0 = ((((((1026) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dd73918292bfa87a7aae4f20() {
  return __cxx_static_address_dd73918292bfa87a7aae4f20.reference || (__cxx_static_address_dd73918292bfa87a7aae4f20.reference = {
    __cReference: true,
    get value() { return HORSEONSIDE____header_global_33bc99fe89dc5ce0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:456
export const GLASSPIECES____header_global_0ee48521a28bf2c1 = ((((((1031) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ef62d38aa57bcd9fff9dd0e4() {
  return __cxx_static_address_ef62d38aa57bcd9fff9dd0e4.reference || (__cxx_static_address_ef62d38aa57bcd9fff9dd0e4.reference = {
    __cReference: true,
    get value() { return GLASSPIECES____header_global_0ee48521a28bf2c1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:457
export const NEON6____header_global_ddde1c498a62b99d = ((((((1046) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2cf8d596196fb7c34f213d70() {
  return __cxx_static_address_2cf8d596196fb7c34f213d70.reference || (__cxx_static_address_2cf8d596196fb7c34f213d70.reference = {
    __cReference: true,
    get value() { return NEON6____header_global_ddde1c498a62b99d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:458
export const MASKWALL6____header_global_cdda247ceddb94db = ((((((1059) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6a26848766b93fe91bc278f6() {
  return __cxx_static_address_6a26848766b93fe91bc278f6.reference || (__cxx_static_address_6a26848766b93fe91bc278f6.reference = {
    __cReference: true,
    get value() { return MASKWALL6____header_global_cdda247ceddb94db; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:459
export const RUBBERCAN____header_global_ff290e4719f80648 = ((((((1062) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eb937c1d3be2197070006d80() {
  return __cxx_static_address_eb937c1d3be2197070006d80.reference || (__cxx_static_address_eb937c1d3be2197070006d80.reference = {
    __cReference: true,
    get value() { return RUBBERCAN____header_global_ff290e4719f80648; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:460
export const PLUG____header_global_782f1413a69996f6 = ((((((1069) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_df021729ae7072389817b399() {
  return __cxx_static_address_df021729ae7072389817b399.reference || (__cxx_static_address_df021729ae7072389817b399.reference = {
    __cReference: true,
    get value() { return PLUG____header_global_782f1413a69996f6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:461
export const OOZFILTER____header_global_0d36749fe6de8c3f = ((((((1079) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c53d00f8cd711c95466f677d() {
  return __cxx_static_address_c53d00f8cd711c95466f677d.reference || (__cxx_static_address_c53d00f8cd711c95466f677d.reference = {
    __cReference: true,
    get value() { return OOZFILTER____header_global_0d36749fe6de8c3f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:462
export const FLOORPLASMA____header_global_ca371e27a074b128 = ((((((1082) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bae5b25fa655bd52e4af0073() {
  return __cxx_static_address_bae5b25fa655bd52e4af0073.reference || (__cxx_static_address_bae5b25fa655bd52e4af0073.reference = {
    __cReference: true,
    get value() { return FLOORPLASMA____header_global_ca371e27a074b128; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:463
export const REACTOR____header_global_c47af67738c515b1 = ((((((1088) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f967180b06a00185220794ea() {
  return __cxx_static_address_f967180b06a00185220794ea.reference || (__cxx_static_address_f967180b06a00185220794ea.reference = {
    __cReference: true,
    get value() { return REACTOR____header_global_c47af67738c515b1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:464
export const REACTORSPARK____header_global_d373955cee3aee10 = ((((((1092) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_351cab440ddd57139debddfc() {
  return __cxx_static_address_351cab440ddd57139debddfc.reference || (__cxx_static_address_351cab440ddd57139debddfc.reference = {
    __cReference: true,
    get value() { return REACTORSPARK____header_global_d373955cee3aee10; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:465
export const REACTORBURNT____header_global_9f9c6627894995c2 = ((((((1096) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f79f5cee7d2a2c61d54c94a6() {
  return __cxx_static_address_f79f5cee7d2a2c61d54c94a6.reference || (__cxx_static_address_f79f5cee7d2a2c61d54c94a6.reference = {
    __cReference: true,
    get value() { return REACTORBURNT____header_global_9f9c6627894995c2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:466
export const DOORTILE15____header_global_198892862e69023f = ((((((1102) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ac5daa17f55efbe01a216724() {
  return __cxx_static_address_ac5daa17f55efbe01a216724.reference || (__cxx_static_address_ac5daa17f55efbe01a216724.reference = {
    __cReference: true,
    get value() { return DOORTILE15____header_global_198892862e69023f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:467
export const HANDSWITCH____header_global_e3947627ede31827 = ((((((1111) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_faf3d32fcbc153bb8e4940d8() {
  return __cxx_static_address_faf3d32fcbc153bb8e4940d8.reference || (__cxx_static_address_faf3d32fcbc153bb8e4940d8.reference = {
    __cReference: true,
    get value() { return HANDSWITCH____header_global_e3947627ede31827; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:468
export const CIRCLEPANNEL____header_global_6902be4050f1fe49 = ((((((1113) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b95523b63ab5758b2a8c117f() {
  return __cxx_static_address_b95523b63ab5758b2a8c117f.reference || (__cxx_static_address_b95523b63ab5758b2a8c117f.reference = {
    __cReference: true,
    get value() { return CIRCLEPANNEL____header_global_6902be4050f1fe49; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:469
export const CIRCLEPANNELBROKE____header_global_bd907a8aa4b2804c = ((((((1114) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eab02803bc29952759dc5ff3() {
  return __cxx_static_address_eab02803bc29952759dc5ff3.reference || (__cxx_static_address_eab02803bc29952759dc5ff3.reference = {
    __cReference: true,
    get value() { return CIRCLEPANNELBROKE____header_global_bd907a8aa4b2804c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:470
export const PULLSWITCH____header_global_47dcd360bab04d03 = ((((((1122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b35d9cefcd20c48e406d4d38() {
  return __cxx_static_address_b35d9cefcd20c48e406d4d38.reference || (__cxx_static_address_b35d9cefcd20c48e406d4d38.reference = {
    __cReference: true,
    get value() { return PULLSWITCH____header_global_47dcd360bab04d03; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:471
export const MASKWALL8____header_global_5f5e91f122f343ad = ((((((1124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_db201de33372f0aa54a27623() {
  return __cxx_static_address_db201de33372f0aa54a27623.reference || (__cxx_static_address_db201de33372f0aa54a27623.reference = {
    __cReference: true,
    get value() { return MASKWALL8____header_global_5f5e91f122f343ad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:472
export const BIGHOLE____header_global_34d081aac8fa4f01 = ((((((1141) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_78136bed493a5ba815512c3d() {
  return __cxx_static_address_78136bed493a5ba815512c3d.reference || (__cxx_static_address_78136bed493a5ba815512c3d.reference = {
    __cReference: true,
    get value() { return BIGHOLE____header_global_34d081aac8fa4f01; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:473
export const ALIENSWITCH____header_global_1e8d7e8ce5d91d40 = ((((((1142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5f719b9437175ca92531364a() {
  return __cxx_static_address_5f719b9437175ca92531364a.reference || (__cxx_static_address_5f719b9437175ca92531364a.reference = {
    __cReference: true,
    get value() { return ALIENSWITCH____header_global_1e8d7e8ce5d91d40; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:474
export const DOORTILE21____header_global_97ed0d3799f8f4a9 = ((((((1144) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c4325cbc1ad9c7cac19f3d30() {
  return __cxx_static_address_c4325cbc1ad9c7cac19f3d30.reference || (__cxx_static_address_c4325cbc1ad9c7cac19f3d30.reference = {
    __cReference: true,
    get value() { return DOORTILE21____header_global_97ed0d3799f8f4a9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:475
export const HANDPRINTSWITCH____header_global_525f0ae1759a09ee = ((((((1155) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_379efd8116ca12a740201ad4() {
  return __cxx_static_address_379efd8116ca12a740201ad4.reference || (__cxx_static_address_379efd8116ca12a740201ad4.reference = {
    __cReference: true,
    get value() { return HANDPRINTSWITCH____header_global_525f0ae1759a09ee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:476
export const BOTTLE10____header_global_0bdf51ac3ab9e5a7 = ((((((1157) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b890e23906dc145b25dceea8() {
  return __cxx_static_address_b890e23906dc145b25dceea8.reference || (__cxx_static_address_b890e23906dc145b25dceea8.reference = {
    __cReference: true,
    get value() { return BOTTLE10____header_global_0bdf51ac3ab9e5a7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:477
export const BOTTLE11____header_global_e5be8e6ba3332f79 = ((((((1158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f4bd7a09f7b27a677862c175() {
  return __cxx_static_address_f4bd7a09f7b27a677862c175.reference || (__cxx_static_address_f4bd7a09f7b27a677862c175.reference = {
    __cReference: true,
    get value() { return BOTTLE11____header_global_e5be8e6ba3332f79; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:478
export const BOTTLE12____header_global_b639f93723412b56 = ((((((1159) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_69414ec17103796b4afbf81c() {
  return __cxx_static_address_69414ec17103796b4afbf81c.reference || (__cxx_static_address_69414ec17103796b4afbf81c.reference = {
    __cReference: true,
    get value() { return BOTTLE12____header_global_b639f93723412b56; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:479
export const BOTTLE13____header_global_416b3d86a37fcb4a = ((((((1160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5ca46250444eefb68cb6829e() {
  return __cxx_static_address_5ca46250444eefb68cb6829e.reference || (__cxx_static_address_5ca46250444eefb68cb6829e.reference = {
    __cReference: true,
    get value() { return BOTTLE13____header_global_416b3d86a37fcb4a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:480
export const BOTTLE14____header_global_2e23e5bec106a3e2 = ((((((1161) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_965f1f625745c000aa7e0b39() {
  return __cxx_static_address_965f1f625745c000aa7e0b39.reference || (__cxx_static_address_965f1f625745c000aa7e0b39.reference = {
    __cReference: true,
    get value() { return BOTTLE14____header_global_2e23e5bec106a3e2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:481
export const BOTTLE15____header_global_efa4198e20c1d8dc = ((((((1162) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_da5dce7382ec2fec0ecfed0f() {
  return __cxx_static_address_da5dce7382ec2fec0ecfed0f.reference || (__cxx_static_address_da5dce7382ec2fec0ecfed0f.reference = {
    __cReference: true,
    get value() { return BOTTLE15____header_global_efa4198e20c1d8dc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:482
export const BOTTLE16____header_global_1698cd05d09df5f4 = ((((((1163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2b2d835c18ead114185142e8() {
  return __cxx_static_address_2b2d835c18ead114185142e8.reference || (__cxx_static_address_2b2d835c18ead114185142e8.reference = {
    __cReference: true,
    get value() { return BOTTLE16____header_global_1698cd05d09df5f4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:483
export const BOTTLE17____header_global_1aa4fc1e66f60923 = ((((((1164) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d08494af68e5a9ad9f61149a() {
  return __cxx_static_address_d08494af68e5a9ad9f61149a.reference || (__cxx_static_address_d08494af68e5a9ad9f61149a.reference = {
    __cReference: true,
    get value() { return BOTTLE17____header_global_1aa4fc1e66f60923; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:484
export const BOTTLE18____header_global_b16dfb106d5828f7 = ((((((1165) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0ff7adf3df256d5b18e1ab78() {
  return __cxx_static_address_0ff7adf3df256d5b18e1ab78.reference || (__cxx_static_address_0ff7adf3df256d5b18e1ab78.reference = {
    __cReference: true,
    get value() { return BOTTLE18____header_global_b16dfb106d5828f7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:485
export const BOTTLE19____header_global_30abecd83a6166d5 = ((((((1166) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_19981143b5c686b3a6877946() {
  return __cxx_static_address_19981143b5c686b3a6877946.reference || (__cxx_static_address_19981143b5c686b3a6877946.reference = {
    __cReference: true,
    get value() { return BOTTLE19____header_global_30abecd83a6166d5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:486
export const DOORTILE17____header_global_4b9261d2db74f49a = ((((((1169) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_05544f3ab32a92f982d38e25() {
  return __cxx_static_address_05544f3ab32a92f982d38e25.reference || (__cxx_static_address_05544f3ab32a92f982d38e25.reference = {
    __cReference: true,
    get value() { return DOORTILE17____header_global_4b9261d2db74f49a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:487
export const MASKWALL7____header_global_779c9d33bb0c805a = ((((((1174) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_351410e135cd188924f4a912() {
  return __cxx_static_address_351410e135cd188924f4a912.reference || (__cxx_static_address_351410e135cd188924f4a912.reference = {
    __cReference: true,
    get value() { return MASKWALL7____header_global_779c9d33bb0c805a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:488
export const DOORTILE11____header_global_7aeb7ea513d7291d = ((((((1178) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_be397ad5e52a130a9699e743() {
  return __cxx_static_address_be397ad5e52a130a9699e743.reference || (__cxx_static_address_be397ad5e52a130a9699e743.reference = {
    __cReference: true,
    get value() { return DOORTILE11____header_global_7aeb7ea513d7291d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:489
export const DOORTILE12____header_global_e22d786eb9b419c6 = ((((((1179) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_88a586f07d2fe70991fec397() {
  return __cxx_static_address_88a586f07d2fe70991fec397.reference || (__cxx_static_address_88a586f07d2fe70991fec397.reference = {
    __cReference: true,
    get value() { return DOORTILE12____header_global_e22d786eb9b419c6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:490
export const VENDMACHINE____header_global_ae5c12d6db83c7cb = ((((((1212) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7c5510fee4ca02bcd39df119() {
  return __cxx_static_address_7c5510fee4ca02bcd39df119.reference || (__cxx_static_address_7c5510fee4ca02bcd39df119.reference = {
    __cReference: true,
    get value() { return VENDMACHINE____header_global_ae5c12d6db83c7cb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:491
export const COLAMACHINE____header_global_6d6f0f0850799d91 = ((((((1215) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_58aa17ad9ac9ec8f229d1cc4() {
  return __cxx_static_address_58aa17ad9ac9ec8f229d1cc4.reference || (__cxx_static_address_58aa17ad9ac9ec8f229d1cc4.reference = {
    __cReference: true,
    get value() { return COLAMACHINE____header_global_6d6f0f0850799d91; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:492
export const CRANEPOLE____header_global_7582c34007398f6c = ((((((1221) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8738137e0951274a0cc156d1() {
  return __cxx_static_address_8738137e0951274a0cc156d1.reference || (__cxx_static_address_8738137e0951274a0cc156d1.reference = {
    __cReference: true,
    get value() { return CRANEPOLE____header_global_7582c34007398f6c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:493
export const CRANE____header_global_2e7674df6439d9a2 = ((((((1222) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_22a9f2f8b280e344c4866422() {
  return __cxx_static_address_22a9f2f8b280e344c4866422.reference || (__cxx_static_address_22a9f2f8b280e344c4866422.reference = {
    __cReference: true,
    get value() { return CRANE____header_global_2e7674df6439d9a2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:494
export const BARBROKE____header_global_d1e53a5c438b901d = ((((((1225) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_018ca2f30d185969c836dc4e() {
  return __cxx_static_address_018ca2f30d185969c836dc4e.reference || (__cxx_static_address_018ca2f30d185969c836dc4e.reference = {
    __cReference: true,
    get value() { return BARBROKE____header_global_d1e53a5c438b901d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:495
export const BLOODPOOL____header_global_d7d961d8e22d9ae0 = ((((((1226) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a8f79fa7bfc0a87a16940183() {
  return __cxx_static_address_a8f79fa7bfc0a87a16940183.reference || (__cxx_static_address_a8f79fa7bfc0a87a16940183.reference = {
    __cReference: true,
    get value() { return BLOODPOOL____header_global_d7d961d8e22d9ae0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:496
export const NUKEBARREL____header_global_34ac558e1f6e1b5e = ((((((1227) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a9ff73f58c1520e257f0f20e() {
  return __cxx_static_address_a9ff73f58c1520e257f0f20e.reference || (__cxx_static_address_a9ff73f58c1520e257f0f20e.reference = {
    __cReference: true,
    get value() { return NUKEBARREL____header_global_34ac558e1f6e1b5e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:497
export const NUKEBARRELDENTED____header_global_c700171ddf6460d8 = ((((((1228) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5a9617d85d127816c4679e6b() {
  return __cxx_static_address_5a9617d85d127816c4679e6b.reference || (__cxx_static_address_5a9617d85d127816c4679e6b.reference = {
    __cReference: true,
    get value() { return NUKEBARRELDENTED____header_global_c700171ddf6460d8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:498
export const NUKEBARRELLEAKED____header_global_d7d8e3dd0ab51097 = ((((((1229) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d60f08133054e4615d0ac721() {
  return __cxx_static_address_d60f08133054e4615d0ac721.reference || (__cxx_static_address_d60f08133054e4615d0ac721.reference = {
    __cReference: true,
    get value() { return NUKEBARRELLEAKED____header_global_d7d8e3dd0ab51097; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:499
export const CANWITHSOMETHING____header_global_8d424a72c06b0611 = ((((((1232) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a8d35f8db1eb861f77c1302b() {
  return __cxx_static_address_a8d35f8db1eb861f77c1302b.reference || (__cxx_static_address_a8d35f8db1eb861f77c1302b.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING____header_global_8d424a72c06b0611; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:500
export const MONEY____header_global_dc6f65e1b29c9bda = ((((((1233) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_be10c9415db488bca0442597() {
  return __cxx_static_address_be10c9415db488bca0442597.reference || (__cxx_static_address_be10c9415db488bca0442597.reference = {
    __cReference: true,
    get value() { return MONEY____header_global_dc6f65e1b29c9bda; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:501
export const BANNER____header_global_9d79ae9ac86fbab8 = ((((((1236) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6241f2d87d0ce3cacc5d20b8() {
  return __cxx_static_address_6241f2d87d0ce3cacc5d20b8.reference || (__cxx_static_address_6241f2d87d0ce3cacc5d20b8.reference = {
    __cReference: true,
    get value() { return BANNER____header_global_9d79ae9ac86fbab8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:502
export const EXPLODINGBARREL____header_global_38ebcc2b5ea1422c = ((((((1238) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ee5fbf26cd50776fa9008463() {
  return __cxx_static_address_ee5fbf26cd50776fa9008463.reference || (__cxx_static_address_ee5fbf26cd50776fa9008463.reference = {
    __cReference: true,
    get value() { return EXPLODINGBARREL____header_global_38ebcc2b5ea1422c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:503
export const EXPLODINGBARREL2____header_global_f2913d9964d2e6a5 = ((((((1239) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5f90222fb9e7fa917f4f560f() {
  return __cxx_static_address_5f90222fb9e7fa917f4f560f.reference || (__cxx_static_address_5f90222fb9e7fa917f4f560f.reference = {
    __cReference: true,
    get value() { return EXPLODINGBARREL2____header_global_f2913d9964d2e6a5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:504
export const FIREBARREL____header_global_ff066ed0d6da0620 = ((((((1240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_99a87c3caf95f1ab648b3440() {
  return __cxx_static_address_99a87c3caf95f1ab648b3440.reference || (__cxx_static_address_99a87c3caf95f1ab648b3440.reference = {
    __cReference: true,
    get value() { return FIREBARREL____header_global_ff066ed0d6da0620; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:505
export const SEENINE____header_global_7666d5fb4097ed3e = ((((((1247) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2c2a1aec901ce8f5414ce140() {
  return __cxx_static_address_2c2a1aec901ce8f5414ce140.reference || (__cxx_static_address_2c2a1aec901ce8f5414ce140.reference = {
    __cReference: true,
    get value() { return SEENINE____header_global_7666d5fb4097ed3e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:506
export const SEENINEDEAD____header_global_33831cc0415336f2 = ((((((1248) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6ad8a973c5e6e3bece149e85() {
  return __cxx_static_address_6ad8a973c5e6e3bece149e85.reference || (__cxx_static_address_6ad8a973c5e6e3bece149e85.reference = {
    __cReference: true,
    get value() { return SEENINEDEAD____header_global_33831cc0415336f2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:507
export const STEAM____header_global_0aa7b0ad6541fbd6 = ((((((1250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cad60c1b1194fa11cfde4951() {
  return __cxx_static_address_cad60c1b1194fa11cfde4951.reference || (__cxx_static_address_cad60c1b1194fa11cfde4951.reference = {
    __cReference: true,
    get value() { return STEAM____header_global_0aa7b0ad6541fbd6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:508
export const CEILINGSTEAM____header_global_7156ae0e5b28b679 = ((((((1255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_757a013a30dff2217a28203d() {
  return __cxx_static_address_757a013a30dff2217a28203d.reference || (__cxx_static_address_757a013a30dff2217a28203d.reference = {
    __cReference: true,
    get value() { return CEILINGSTEAM____header_global_7156ae0e5b28b679; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:509
export const PIPE6B____header_global_b4ec618fd7fc454a = ((((((1260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e56ae0364d26ed8aeb37cc7d() {
  return __cxx_static_address_e56ae0364d26ed8aeb37cc7d.reference || (__cxx_static_address_e56ae0364d26ed8aeb37cc7d.reference = {
    __cReference: true,
    get value() { return PIPE6B____header_global_b4ec618fd7fc454a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:510
export const TRANSPORTERBEAM____header_global_639ad7dee75dcc38 = ((((((1261) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d4e7efd446939bf42031fc55() {
  return __cxx_static_address_d4e7efd446939bf42031fc55.reference || (__cxx_static_address_d4e7efd446939bf42031fc55.reference = {
    __cReference: true,
    get value() { return TRANSPORTERBEAM____header_global_639ad7dee75dcc38; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:511
export const RAT____header_global_c310a7308c41f8e8 = ((((((1267) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_61de4f0a6c6a391baf3cbc54() {
  return __cxx_static_address_61de4f0a6c6a391baf3cbc54.reference || (__cxx_static_address_61de4f0a6c6a391baf3cbc54.reference = {
    __cReference: true,
    get value() { return RAT____header_global_c310a7308c41f8e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:512
export const TRASH____header_global_e440a9e52ef5cc92 = ((((((1272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_738382cc6890bb751f6e6e3e() {
  return __cxx_static_address_738382cc6890bb751f6e6e3e.reference || (__cxx_static_address_738382cc6890bb751f6e6e3e.reference = {
    __cReference: true,
    get value() { return TRASH____header_global_e440a9e52ef5cc92; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:513
export const FEMPIC1____header_global_b2f8cecbb208ea2b = ((((((1280) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f4a211e5b81866a21f2ea7f3() {
  return __cxx_static_address_f4a211e5b81866a21f2ea7f3.reference || (__cxx_static_address_f4a211e5b81866a21f2ea7f3.reference = {
    __cReference: true,
    get value() { return FEMPIC1____header_global_b2f8cecbb208ea2b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:514
export const FEMPIC2____header_global_b4fbc3c7f01e3a7d = ((((((1289) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f402bba57eaa0b53b0781591() {
  return __cxx_static_address_f402bba57eaa0b53b0781591.reference || (__cxx_static_address_f402bba57eaa0b53b0781591.reference = {
    __cReference: true,
    get value() { return FEMPIC2____header_global_b4fbc3c7f01e3a7d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:515
export const BLANKSCREEN____header_global_c9f82fa6c943cd17 = ((((((1293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cbe8fc6bf612c3d9d8d3e32d() {
  return __cxx_static_address_cbe8fc6bf612c3d9d8d3e32d.reference || (__cxx_static_address_cbe8fc6bf612c3d9d8d3e32d.reference = {
    __cReference: true,
    get value() { return BLANKSCREEN____header_global_c9f82fa6c943cd17; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:516
export const PODFEM1____header_global_03f1c494a74507b3 = ((((((1294) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7a0dde0775c399317fc0bc50() {
  return __cxx_static_address_7a0dde0775c399317fc0bc50.reference || (__cxx_static_address_7a0dde0775c399317fc0bc50.reference = {
    __cReference: true,
    get value() { return PODFEM1____header_global_03f1c494a74507b3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:517
export const FEMPIC3____header_global_1df7dde0bc2b3a36 = ((((((1298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f03224325dc2f3bbf8580028() {
  return __cxx_static_address_f03224325dc2f3bbf8580028.reference || (__cxx_static_address_f03224325dc2f3bbf8580028.reference = {
    __cReference: true,
    get value() { return FEMPIC3____header_global_1df7dde0bc2b3a36; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:518
export const FEMPIC4____header_global_b90e2dc9c4be0cbe = ((((((1306) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c5fb43147cdeee60507f06d3() {
  return __cxx_static_address_c5fb43147cdeee60507f06d3.reference || (__cxx_static_address_c5fb43147cdeee60507f06d3.reference = {
    __cReference: true,
    get value() { return FEMPIC4____header_global_b90e2dc9c4be0cbe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:519
export const FEM1____header_global_dcd0221de6f856fd = ((((((1312) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_47127c0c403fe23cd825077c() {
  return __cxx_static_address_47127c0c403fe23cd825077c.reference || (__cxx_static_address_47127c0c403fe23cd825077c.reference = {
    __cReference: true,
    get value() { return FEM1____header_global_dcd0221de6f856fd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:520
export const FEM2____header_global_5ff7dc5776500e6d = ((((((1317) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8c2b0b0fcc06eb7ddabf98de() {
  return __cxx_static_address_8c2b0b0fcc06eb7ddabf98de.reference || (__cxx_static_address_8c2b0b0fcc06eb7ddabf98de.reference = {
    __cReference: true,
    get value() { return FEM2____header_global_5ff7dc5776500e6d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:521
export const FEM3____header_global_b716e9132812da81 = ((((((1321) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_68748bb4081b6f038e8ebc8d() {
  return __cxx_static_address_68748bb4081b6f038e8ebc8d.reference || (__cxx_static_address_68748bb4081b6f038e8ebc8d.reference = {
    __cReference: true,
    get value() { return FEM3____header_global_b716e9132812da81; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:522
export const FEM5____header_global_320526eeb0c97ddc = ((((((1323) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_488905210045eb4af22eec21() {
  return __cxx_static_address_488905210045eb4af22eec21.reference || (__cxx_static_address_488905210045eb4af22eec21.reference = {
    __cReference: true,
    get value() { return FEM5____header_global_320526eeb0c97ddc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:523
export const BLOODYPOLE____header_global_6bdaba9bcee32018 = ((((((1324) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_46454f280cf40a4ff68001bc() {
  return __cxx_static_address_46454f280cf40a4ff68001bc.reference || (__cxx_static_address_46454f280cf40a4ff68001bc.reference = {
    __cReference: true,
    get value() { return BLOODYPOLE____header_global_6bdaba9bcee32018; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:524
export const FEM4____header_global_b76da7b2d5529c15 = ((((((1325) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_02a195b71ef76041472366db() {
  return __cxx_static_address_02a195b71ef76041472366db.reference || (__cxx_static_address_02a195b71ef76041472366db.reference = {
    __cReference: true,
    get value() { return FEM4____header_global_b76da7b2d5529c15; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:525
export const FEM6____header_global_ac3e1902749ba017 = ((((((1334) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7bc64a7b82bd9710cd65cf32() {
  return __cxx_static_address_7bc64a7b82bd9710cd65cf32.reference || (__cxx_static_address_7bc64a7b82bd9710cd65cf32.reference = {
    __cReference: true,
    get value() { return FEM6____header_global_ac3e1902749ba017; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:526
export const FEM6PAD____header_global_4177b57022abcc07 = ((((((1335) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5744c829bd2de67c348c7dba() {
  return __cxx_static_address_5744c829bd2de67c348c7dba.reference || (__cxx_static_address_5744c829bd2de67c348c7dba.reference = {
    __cReference: true,
    get value() { return FEM6PAD____header_global_4177b57022abcc07; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:527
export const FEM8____header_global_f07e1a82bf4e66e6 = ((((((1336) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_49d235efa003fab39932947d() {
  return __cxx_static_address_49d235efa003fab39932947d.reference || (__cxx_static_address_49d235efa003fab39932947d.reference = {
    __cReference: true,
    get value() { return FEM8____header_global_f07e1a82bf4e66e6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:528
export const HELECOPT____header_global_82e82cf23ee8b639 = ((((((1346) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7394618e8a9f19005f85e6a2() {
  return __cxx_static_address_7394618e8a9f19005f85e6a2.reference || (__cxx_static_address_7394618e8a9f19005f85e6a2.reference = {
    __cReference: true,
    get value() { return HELECOPT____header_global_82e82cf23ee8b639; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:529
export const FETUSJIB____header_global_3931619449e3303d = ((((((1347) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e95d541d5325884644386379() {
  return __cxx_static_address_e95d541d5325884644386379.reference || (__cxx_static_address_e95d541d5325884644386379.reference = {
    __cReference: true,
    get value() { return FETUSJIB____header_global_3931619449e3303d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:530
export const HOLODUKE____header_global_c3100c5013172d0f = ((((((1348) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fa26ff71b3390b41143b75ce() {
  return __cxx_static_address_fa26ff71b3390b41143b75ce.reference || (__cxx_static_address_fa26ff71b3390b41143b75ce.reference = {
    __cReference: true,
    get value() { return HOLODUKE____header_global_c3100c5013172d0f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:531
export const SPACEMARINE____header_global_a393132b1edf41f9 = ((((((1353) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ef543e691fbad8bd800174aa() {
  return __cxx_static_address_ef543e691fbad8bd800174aa.reference || (__cxx_static_address_ef543e691fbad8bd800174aa.reference = {
    __cReference: true,
    get value() { return SPACEMARINE____header_global_a393132b1edf41f9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:532
export const INDY____header_global_1f3dcff4371fe6a8 = ((((((1355) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0777a7ed1461c2411b85990d() {
  return __cxx_static_address_0777a7ed1461c2411b85990d.reference || (__cxx_static_address_0777a7ed1461c2411b85990d.reference = {
    __cReference: true,
    get value() { return INDY____header_global_1f3dcff4371fe6a8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:533
export const FETUS____header_global_75e6e40ac0d131fc = ((((((1358) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_72c44c7aae171977d5a5282e() {
  return __cxx_static_address_72c44c7aae171977d5a5282e.reference || (__cxx_static_address_72c44c7aae171977d5a5282e.reference = {
    __cReference: true,
    get value() { return FETUS____header_global_75e6e40ac0d131fc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:534
export const FETUSBROKE____header_global_a24ddb025fd34bf5 = ((((((1359) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ef1d9b2c0fcf6f5d5d6b9f59() {
  return __cxx_static_address_ef1d9b2c0fcf6f5d5d6b9f59.reference || (__cxx_static_address_ef1d9b2c0fcf6f5d5d6b9f59.reference = {
    __cReference: true,
    get value() { return FETUSBROKE____header_global_a24ddb025fd34bf5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:535
export const MONK____header_global_ab8dae2715ccc9ce = ((((((1352) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_afff2fddcec10c9b7d6912b1() {
  return __cxx_static_address_afff2fddcec10c9b7d6912b1.reference || (__cxx_static_address_afff2fddcec10c9b7d6912b1.reference = {
    __cReference: true,
    get value() { return MONK____header_global_ab8dae2715ccc9ce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:536
export const LUKE____header_global_b166c9f7a8d30b39 = ((((((1354) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0d4cf54aba3716c82d1f6e98() {
  return __cxx_static_address_0d4cf54aba3716c82d1f6e98.reference || (__cxx_static_address_0d4cf54aba3716c82d1f6e98.reference = {
    __cReference: true,
    get value() { return LUKE____header_global_b166c9f7a8d30b39; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:537
export const COOLEXPLOSION1____header_global_21fc658d383a491f = ((((((1360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d836243cde40bd971836b4bf() {
  return __cxx_static_address_d836243cde40bd971836b4bf.reference || (__cxx_static_address_d836243cde40bd971836b4bf.reference = {
    __cReference: true,
    get value() { return COOLEXPLOSION1____header_global_21fc658d383a491f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:538
export const WATERSPLASH2____header_global_afe89a7bb766e984 = ((((((1380) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3bf9149aa0aec0e393011a42() {
  return __cxx_static_address_3bf9149aa0aec0e393011a42.reference || (__cxx_static_address_3bf9149aa0aec0e393011a42.reference = {
    __cReference: true,
    get value() { return WATERSPLASH2____header_global_afe89a7bb766e984; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:539
export const FIREVASE____header_global_e85c089d11191455 = ((((((1390) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dc3ba44b4c5a9188cdfb1c57() {
  return __cxx_static_address_dc3ba44b4c5a9188cdfb1c57.reference || (__cxx_static_address_dc3ba44b4c5a9188cdfb1c57.reference = {
    __cReference: true,
    get value() { return FIREVASE____header_global_e85c089d11191455; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:540
export const FEM7____header_global_d432637df8f52ceb = ((((((1395) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4f20733f19ec871f9ce4c8c3() {
  return __cxx_static_address_4f20733f19ec871f9ce4c8c3.reference || (__cxx_static_address_4f20733f19ec871f9ce4c8c3.reference = {
    __cReference: true,
    get value() { return FEM7____header_global_d432637df8f52ceb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:541
export const APLAYERTOP____header_global_a9a9de7a8f1ef954 = ((((((1400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b7feb2561d6a0ef0a1f52739() {
  return __cxx_static_address_b7feb2561d6a0ef0a1f52739.reference || (__cxx_static_address_b7feb2561d6a0ef0a1f52739.reference = {
    __cReference: true,
    get value() { return APLAYERTOP____header_global_a9a9de7a8f1ef954; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:542
export const APLAYER____header_global_b09627987e6afc10 = ((((((1405) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a7777c8291970d4ca8ca5b40() {
  return __cxx_static_address_a7777c8291970d4ca8ca5b40.reference || (__cxx_static_address_a7777c8291970d4ca8ca5b40.reference = {
    __cReference: true,
    get value() { return APLAYER____header_global_b09627987e6afc10; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:543
export const PLAYERONWATER____header_global_743283a6aa020960 = ((((((1420) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d8c1bd283daa60dfa392c6d1() {
  return __cxx_static_address_d8c1bd283daa60dfa392c6d1.reference || (__cxx_static_address_d8c1bd283daa60dfa392c6d1.reference = {
    __cReference: true,
    get value() { return PLAYERONWATER____header_global_743283a6aa020960; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:544
export const DUKELYINGDEAD____header_global_6cc4b8d2f74006de = ((((((1518) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_49511e8bd1f478c12650ef3f() {
  return __cxx_static_address_49511e8bd1f478c12650ef3f.reference || (__cxx_static_address_49511e8bd1f478c12650ef3f.reference = {
    __cReference: true,
    get value() { return DUKELYINGDEAD____header_global_6cc4b8d2f74006de; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:545
export const DUKETORSO____header_global_b2908203ade52b85 = ((((((1520) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2e7f3ae26095c4bbdd5651e4() {
  return __cxx_static_address_2e7f3ae26095c4bbdd5651e4.reference || (__cxx_static_address_2e7f3ae26095c4bbdd5651e4.reference = {
    __cReference: true,
    get value() { return DUKETORSO____header_global_b2908203ade52b85; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:546
export const DUKEGUN____header_global_92bb235a13e76c56 = ((((((1528) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4e79db0905a6bc0d593f2dc6() {
  return __cxx_static_address_4e79db0905a6bc0d593f2dc6.reference || (__cxx_static_address_4e79db0905a6bc0d593f2dc6.reference = {
    __cReference: true,
    get value() { return DUKEGUN____header_global_92bb235a13e76c56; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:547
export const DUKELEG____header_global_49a0406aa6f11172 = ((((((1536) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3d4a7a00d9cd11843da4432f() {
  return __cxx_static_address_3d4a7a00d9cd11843da4432f.reference || (__cxx_static_address_3d4a7a00d9cd11843da4432f.reference = {
    __cReference: true,
    get value() { return DUKELEG____header_global_49a0406aa6f11172; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:548
export const SHARK____header_global_b636ab0ca66dee50 = ((((((1550) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_98ae954aa1fcb2be6db250f2() {
  return __cxx_static_address_98ae954aa1fcb2be6db250f2.reference || (__cxx_static_address_98ae954aa1fcb2be6db250f2.reference = {
    __cReference: true,
    get value() { return SHARK____header_global_b636ab0ca66dee50; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:549
export const BLOOD____header_global_4bfb95300cbb23fc = ((((((1620) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9e22d59baa4b3f71e9b1f636() {
  return __cxx_static_address_9e22d59baa4b3f71e9b1f636.reference || (__cxx_static_address_9e22d59baa4b3f71e9b1f636.reference = {
    __cReference: true,
    get value() { return BLOOD____header_global_4bfb95300cbb23fc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:550
export const FIRELASER____header_global_f6b5cad80ed9655a = ((((((1625) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3153e1bd89c68f96926ad6a1() {
  return __cxx_static_address_3153e1bd89c68f96926ad6a1.reference || (__cxx_static_address_3153e1bd89c68f96926ad6a1.reference = {
    __cReference: true,
    get value() { return FIRELASER____header_global_f6b5cad80ed9655a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:551
export const TRANSPORTERSTAR____header_global_cae218c192f9ce9d = ((((((1630) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_12253e7e209055dae352c25a() {
  return __cxx_static_address_12253e7e209055dae352c25a.reference || (__cxx_static_address_12253e7e209055dae352c25a.reference = {
    __cReference: true,
    get value() { return TRANSPORTERSTAR____header_global_cae218c192f9ce9d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:552
export const SPIT____header_global_d21c87333ba7568c = ((((((1636) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8b7a0efdfc5305a004b18627() {
  return __cxx_static_address_8b7a0efdfc5305a004b18627.reference || (__cxx_static_address_8b7a0efdfc5305a004b18627.reference = {
    __cReference: true,
    get value() { return SPIT____header_global_d21c87333ba7568c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:553
export const LOOGIE____header_global_4d9f0696161c0959 = ((((((1637) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bbd34f141437d2a88dcc5313() {
  return __cxx_static_address_bbd34f141437d2a88dcc5313.reference || (__cxx_static_address_bbd34f141437d2a88dcc5313.reference = {
    __cReference: true,
    get value() { return LOOGIE____header_global_4d9f0696161c0959; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:554
export const FIST____header_global_d663d5f2699550a5 = ((((((1640) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_66090e61442fb12e4f4cc260() {
  return __cxx_static_address_66090e61442fb12e4f4cc260.reference || (__cxx_static_address_66090e61442fb12e4f4cc260.reference = {
    __cReference: true,
    get value() { return FIST____header_global_d663d5f2699550a5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:555
export const FREEZEBLAST____header_global_5ec4ebb358888180 = ((((((1641) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_552992335c62c02e09d8d837() {
  return __cxx_static_address_552992335c62c02e09d8d837.reference || (__cxx_static_address_552992335c62c02e09d8d837.reference = {
    __cReference: true,
    get value() { return FREEZEBLAST____header_global_5ec4ebb358888180; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:556
export const SHRINKSPARK____header_global_6dcc607e4a502f29 = ((((((1646) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0a3f01fc1400c2b255f2dc97() {
  return __cxx_static_address_0a3f01fc1400c2b255f2dc97.reference || (__cxx_static_address_0a3f01fc1400c2b255f2dc97.reference = {
    __cReference: true,
    get value() { return SHRINKSPARK____header_global_6dcc607e4a502f29; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:557
export const TONGUE____header_global_58ee78d502aa0427 = ((((((1647) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2137f34e89f5ce80ff6ba44f() {
  return __cxx_static_address_2137f34e89f5ce80ff6ba44f.reference || (__cxx_static_address_2137f34e89f5ce80ff6ba44f.reference = {
    __cReference: true,
    get value() { return TONGUE____header_global_58ee78d502aa0427; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:558
export const MORTER____header_global_59a897057bde450b = ((((((1650) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4f973f7d42393f3a208f2a96() {
  return __cxx_static_address_4f973f7d42393f3a208f2a96.reference || (__cxx_static_address_4f973f7d42393f3a208f2a96.reference = {
    __cReference: true,
    get value() { return MORTER____header_global_59a897057bde450b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:559
export const SHRINKEREXPLOSION____header_global_13d5968771aa88ff = ((((((1656) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b91df913b831227f38545945() {
  return __cxx_static_address_b91df913b831227f38545945.reference || (__cxx_static_address_b91df913b831227f38545945.reference = {
    __cReference: true,
    get value() { return SHRINKEREXPLOSION____header_global_13d5968771aa88ff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:560
export const RADIUSEXPLOSION____header_global_fd4245e7e6cabef0 = ((((((1670) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7e880d5cd63e6c4f3a3ed921() {
  return __cxx_static_address_7e880d5cd63e6c4f3a3ed921.reference || (__cxx_static_address_7e880d5cd63e6c4f3a3ed921.reference = {
    __cReference: true,
    get value() { return RADIUSEXPLOSION____header_global_fd4245e7e6cabef0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:561
export const FORCERIPPLE____header_global_c428024fcf37be39 = ((((((1671) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2f5d27cffb69776ef82b6bba() {
  return __cxx_static_address_2f5d27cffb69776ef82b6bba.reference || (__cxx_static_address_2f5d27cffb69776ef82b6bba.reference = {
    __cReference: true,
    get value() { return FORCERIPPLE____header_global_c428024fcf37be39; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:562
export const LIZTROOP____header_global_9ae59ea2811d6efa = ((((((1680) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_808b3e48365a4fbe364fce68() {
  return __cxx_static_address_808b3e48365a4fbe364fce68.reference || (__cxx_static_address_808b3e48365a4fbe364fce68.reference = {
    __cReference: true,
    get value() { return LIZTROOP____header_global_9ae59ea2811d6efa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:563
export const LIZTROOPRUNNING____header_global_128bc01194c8d01b = ((((((1681) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4466ef520636f8994de8858d() {
  return __cxx_static_address_4466ef520636f8994de8858d.reference || (__cxx_static_address_4466ef520636f8994de8858d.reference = {
    __cReference: true,
    get value() { return LIZTROOPRUNNING____header_global_128bc01194c8d01b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:564
export const LIZTROOPSTAYPUT____header_global_9427916f06c9f418 = ((((((1682) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_de58da673b0b786f144ab325() {
  return __cxx_static_address_de58da673b0b786f144ab325.reference || (__cxx_static_address_de58da673b0b786f144ab325.reference = {
    __cReference: true,
    get value() { return LIZTROOPSTAYPUT____header_global_9427916f06c9f418; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:565
export const LIZTROOPSHOOT____header_global_f3ac1dd68fd9d6d2 = ((((((1715) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e65c2f2cad2b821b24574d7e() {
  return __cxx_static_address_e65c2f2cad2b821b24574d7e.reference || (__cxx_static_address_e65c2f2cad2b821b24574d7e.reference = {
    __cReference: true,
    get value() { return LIZTROOPSHOOT____header_global_f3ac1dd68fd9d6d2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:566
export const LIZTROOPJETPACK____header_global_8f3001c5940576e2 = ((((((1725) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_653dcc6552518c29ef8c7067() {
  return __cxx_static_address_653dcc6552518c29ef8c7067.reference || (__cxx_static_address_653dcc6552518c29ef8c7067.reference = {
    __cReference: true,
    get value() { return LIZTROOPJETPACK____header_global_8f3001c5940576e2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:567
export const LIZTROOPONTOILET____header_global_96ca06917b6f5533 = ((((((1741) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cc9db3133faa30a2cf871e66() {
  return __cxx_static_address_cc9db3133faa30a2cf871e66.reference || (__cxx_static_address_cc9db3133faa30a2cf871e66.reference = {
    __cReference: true,
    get value() { return LIZTROOPONTOILET____header_global_96ca06917b6f5533; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:568
export const LIZTROOPJUSTSIT____header_global_fcb3cdc035556c13 = ((((((1742) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3fde8427da1a3025d8ac85b9() {
  return __cxx_static_address_3fde8427da1a3025d8ac85b9.reference || (__cxx_static_address_3fde8427da1a3025d8ac85b9.reference = {
    __cReference: true,
    get value() { return LIZTROOPJUSTSIT____header_global_fcb3cdc035556c13; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:569
export const LIZTROOPDUCKING____header_global_99e52dca3de1aee8 = ((((((1744) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_51360b72a74a3f39f743b69f() {
  return __cxx_static_address_51360b72a74a3f39f743b69f.reference || (__cxx_static_address_51360b72a74a3f39f743b69f.reference = {
    __cReference: true,
    get value() { return LIZTROOPDUCKING____header_global_99e52dca3de1aee8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:570
export const HEADJIB1____header_global_edd14132564938f1 = ((((((1768) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f868c2f41c0a2efaa4f374a9() {
  return __cxx_static_address_f868c2f41c0a2efaa4f374a9.reference || (__cxx_static_address_f868c2f41c0a2efaa4f374a9.reference = {
    __cReference: true,
    get value() { return HEADJIB1____header_global_edd14132564938f1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:571
export const ARMJIB1____header_global_9b80a08090f84386 = ((((((1772) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_24062b75a7afd001857d8019() {
  return __cxx_static_address_24062b75a7afd001857d8019.reference || (__cxx_static_address_24062b75a7afd001857d8019.reference = {
    __cReference: true,
    get value() { return ARMJIB1____header_global_9b80a08090f84386; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:572
export const LEGJIB1____header_global_458be7c03d701c50 = ((((((1776) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_80865772c048364336f03e25() {
  return __cxx_static_address_80865772c048364336f03e25.reference || (__cxx_static_address_80865772c048364336f03e25.reference = {
    __cReference: true,
    get value() { return LEGJIB1____header_global_458be7c03d701c50; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:573
export const OCTABRAIN____header_global_555615384f9b79dc = ((((((1820) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a6e24fd9c26316bf218cb33b() {
  return __cxx_static_address_a6e24fd9c26316bf218cb33b.reference || (__cxx_static_address_a6e24fd9c26316bf218cb33b.reference = {
    __cReference: true,
    get value() { return OCTABRAIN____header_global_555615384f9b79dc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:574
export const OCTABRAINSTAYPUT____header_global_f117ef70920fc540 = ((((((1821) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2be49429774fbf60f69030d6() {
  return __cxx_static_address_2be49429774fbf60f69030d6.reference || (__cxx_static_address_2be49429774fbf60f69030d6.reference = {
    __cReference: true,
    get value() { return OCTABRAINSTAYPUT____header_global_f117ef70920fc540; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:575
export const INNERJAW____header_global_5ffa87331fa82da2 = ((((((1860) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cdb25ae3d90adc5f0791afe5() {
  return __cxx_static_address_cdb25ae3d90adc5f0791afe5.reference || (__cxx_static_address_cdb25ae3d90adc5f0791afe5.reference = {
    __cReference: true,
    get value() { return INNERJAW____header_global_5ffa87331fa82da2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:576
export const DRONE____header_global_8d4f367f2cd4291c = ((((((1880) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_142615f69ab4e3d3db11d5fe() {
  return __cxx_static_address_142615f69ab4e3d3db11d5fe.reference || (__cxx_static_address_142615f69ab4e3d3db11d5fe.reference = {
    __cReference: true,
    get value() { return DRONE____header_global_8d4f367f2cd4291c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:577
export const EXPLOSION2____header_global_2ce74c4dbe5f2332 = ((((((1890) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e586e058f91282d65a375c86() {
  return __cxx_static_address_e586e058f91282d65a375c86.reference || (__cxx_static_address_e586e058f91282d65a375c86.reference = {
    __cReference: true,
    get value() { return EXPLOSION2____header_global_2ce74c4dbe5f2332; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:578
export const COMMANDER____header_global_10873f2370d8c44d = ((((((1920) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bd36f35d1046dfcbb19ee9e1() {
  return __cxx_static_address_bd36f35d1046dfcbb19ee9e1.reference || (__cxx_static_address_bd36f35d1046dfcbb19ee9e1.reference = {
    __cReference: true,
    get value() { return COMMANDER____header_global_10873f2370d8c44d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:579
export const COMMANDERSTAYPUT____header_global_0f76c1b9c9394a33 = ((((((1921) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1b615b92870e8385f6978c8a() {
  return __cxx_static_address_1b615b92870e8385f6978c8a.reference || (__cxx_static_address_1b615b92870e8385f6978c8a.reference = {
    __cReference: true,
    get value() { return COMMANDERSTAYPUT____header_global_0f76c1b9c9394a33; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:580
export const RECON____header_global_a9982b12caefa939 = ((((((1960) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0909f5e882a2f05d1f05b71c() {
  return __cxx_static_address_0909f5e882a2f05d1f05b71c.reference || (__cxx_static_address_0909f5e882a2f05d1f05b71c.reference = {
    __cReference: true,
    get value() { return RECON____header_global_a9982b12caefa939; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:581
export const TANK____header_global_d2a3e7cc8e843a45 = ((((((1975) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aaf0398452af8469e45009b3() {
  return __cxx_static_address_aaf0398452af8469e45009b3.reference || (__cxx_static_address_aaf0398452af8469e45009b3.reference = {
    __cReference: true,
    get value() { return TANK____header_global_d2a3e7cc8e843a45; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:582
export const PIGCOP____header_global_d551403d11e05408 = ((((((2000) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9b60bb8e86542dd582d6d2a1() {
  return __cxx_static_address_9b60bb8e86542dd582d6d2a1.reference || (__cxx_static_address_9b60bb8e86542dd582d6d2a1.reference = {
    __cReference: true,
    get value() { return PIGCOP____header_global_d551403d11e05408; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:583
export const PIGCOPSTAYPUT____header_global_965239f33318536a = ((((((2001) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_75f6643bc57da03ec7457c45() {
  return __cxx_static_address_75f6643bc57da03ec7457c45.reference || (__cxx_static_address_75f6643bc57da03ec7457c45.reference = {
    __cReference: true,
    get value() { return PIGCOPSTAYPUT____header_global_965239f33318536a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:584
export const PIGCOPDIVE____header_global_5a2520a51dd3f337 = ((((((2045) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f9a2ba82bcc46e4543467841() {
  return __cxx_static_address_f9a2ba82bcc46e4543467841.reference || (__cxx_static_address_f9a2ba82bcc46e4543467841.reference = {
    __cReference: true,
    get value() { return PIGCOPDIVE____header_global_5a2520a51dd3f337; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:585
export const LIZMAN____header_global_596ada606321e3fe = ((((((2120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6c4e0772ed48e632f561f049() {
  return __cxx_static_address_6c4e0772ed48e632f561f049.reference || (__cxx_static_address_6c4e0772ed48e632f561f049.reference = {
    __cReference: true,
    get value() { return LIZMAN____header_global_596ada606321e3fe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:586
export const LIZMANSTAYPUT____header_global_7609305e880ed885 = ((((((2121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3b235ea9620627136b38bfc2() {
  return __cxx_static_address_3b235ea9620627136b38bfc2.reference || (__cxx_static_address_3b235ea9620627136b38bfc2.reference = {
    __cReference: true,
    get value() { return LIZMANSTAYPUT____header_global_7609305e880ed885; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:587
export const LIZMANSPITTING____header_global_236ca04755d395a6 = ((((((2150) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ddc7014ef2e9eb54cce7f76c() {
  return __cxx_static_address_ddc7014ef2e9eb54cce7f76c.reference || (__cxx_static_address_ddc7014ef2e9eb54cce7f76c.reference = {
    __cReference: true,
    get value() { return LIZMANSPITTING____header_global_236ca04755d395a6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:588
export const LIZMANFEEDING____header_global_f7f8369c882a637f = ((((((2160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5a6c6002654cb7aec027d43e() {
  return __cxx_static_address_5a6c6002654cb7aec027d43e.reference || (__cxx_static_address_5a6c6002654cb7aec027d43e.reference = {
    __cReference: true,
    get value() { return LIZMANFEEDING____header_global_f7f8369c882a637f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:589
export const LIZMANJUMP____header_global_204f7b754d1432c4 = ((((((2165) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3ed2ef8a94f96be7e13de01b() {
  return __cxx_static_address_3ed2ef8a94f96be7e13de01b.reference || (__cxx_static_address_3ed2ef8a94f96be7e13de01b.reference = {
    __cReference: true,
    get value() { return LIZMANJUMP____header_global_204f7b754d1432c4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:590
export const FECES____header_global_6cb9fed84e0e496e = ((((((2200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4a6746469524f3eee905bd0c() {
  return __cxx_static_address_4a6746469524f3eee905bd0c.reference || (__cxx_static_address_4a6746469524f3eee905bd0c.reference = {
    __cReference: true,
    get value() { return FECES____header_global_6cb9fed84e0e496e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:591
export const LIZMANHEAD1____header_global_88d04b6214657447 = ((((((2201) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_97068c78e66d01d0b896926b() {
  return __cxx_static_address_97068c78e66d01d0b896926b.reference || (__cxx_static_address_97068c78e66d01d0b896926b.reference = {
    __cReference: true,
    get value() { return LIZMANHEAD1____header_global_88d04b6214657447; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:592
export const LIZMANARM1____header_global_ab3892cb482af132 = ((((((2205) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_564d6a98763dff63c640da77() {
  return __cxx_static_address_564d6a98763dff63c640da77.reference || (__cxx_static_address_564d6a98763dff63c640da77.reference = {
    __cReference: true,
    get value() { return LIZMANARM1____header_global_ab3892cb482af132; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:593
export const LIZMANLEG1____header_global_7f47f3851476b6fe = ((((((2209) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e4ab64266d8f117781f9450b() {
  return __cxx_static_address_e4ab64266d8f117781f9450b.reference || (__cxx_static_address_e4ab64266d8f117781f9450b.reference = {
    __cReference: true,
    get value() { return LIZMANLEG1____header_global_7f47f3851476b6fe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:594
export const EXPLOSION2BOT____header_global_228e92e2c4f38805 = ((((((2219) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_909e5f94d6ab73f146fdb224() {
  return __cxx_static_address_909e5f94d6ab73f146fdb224.reference || (__cxx_static_address_909e5f94d6ab73f146fdb224.reference = {
    __cReference: true,
    get value() { return EXPLOSION2BOT____header_global_228e92e2c4f38805; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:595
export const JIBS1____header_global_ec0b2314778434b9 = ((((((2245) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7a019a33cddde0bf64aa8109() {
  return __cxx_static_address_7a019a33cddde0bf64aa8109.reference || (__cxx_static_address_7a019a33cddde0bf64aa8109.reference = {
    __cReference: true,
    get value() { return JIBS1____header_global_ec0b2314778434b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:596
export const JIBS2____header_global_a755a17cd15f0023 = ((((((2250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_323741ab99ff6584c6ae39ae() {
  return __cxx_static_address_323741ab99ff6584c6ae39ae.reference || (__cxx_static_address_323741ab99ff6584c6ae39ae.reference = {
    __cReference: true,
    get value() { return JIBS2____header_global_a755a17cd15f0023; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:597
export const JIBS3____header_global_55f03bf4c2d30d1f = ((((((2255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cc3681415f67670b732cdaa9() {
  return __cxx_static_address_cc3681415f67670b732cdaa9.reference || (__cxx_static_address_cc3681415f67670b732cdaa9.reference = {
    __cReference: true,
    get value() { return JIBS3____header_global_55f03bf4c2d30d1f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:598
export const JIBS4____header_global_33c96a5b441355bf = ((((((2260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9ad24ff6430bed232914748d() {
  return __cxx_static_address_9ad24ff6430bed232914748d.reference || (__cxx_static_address_9ad24ff6430bed232914748d.reference = {
    __cReference: true,
    get value() { return JIBS4____header_global_33c96a5b441355bf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:599
export const JIBS5____header_global_1f4347af20454739 = ((((((2265) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5f0f6f87ba208aa71abcb38c() {
  return __cxx_static_address_5f0f6f87ba208aa71abcb38c.reference || (__cxx_static_address_5f0f6f87ba208aa71abcb38c.reference = {
    __cReference: true,
    get value() { return JIBS5____header_global_1f4347af20454739; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:600
export const BURNING____header_global_bc8a2937591c0eb0 = ((((((2270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_821954b7c3d89f0e01fb76a2() {
  return __cxx_static_address_821954b7c3d89f0e01fb76a2.reference || (__cxx_static_address_821954b7c3d89f0e01fb76a2.reference = {
    __cReference: true,
    get value() { return BURNING____header_global_bc8a2937591c0eb0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:601
export const FIRE____header_global_b08f1df9f811c316 = ((((((2271) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_630e066265da3142e26265b4() {
  return __cxx_static_address_630e066265da3142e26265b4.reference || (__cxx_static_address_630e066265da3142e26265b4.reference = {
    __cReference: true,
    get value() { return FIRE____header_global_b08f1df9f811c316; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:602
export const JIBS6____header_global_22d615adc8a0feb0 = ((((((2286) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2eb22c7db315d24d0f60dcbf() {
  return __cxx_static_address_2eb22c7db315d24d0f60dcbf.reference || (__cxx_static_address_2eb22c7db315d24d0f60dcbf.reference = {
    __cReference: true,
    get value() { return JIBS6____header_global_22d615adc8a0feb0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:603
export const BLOODSPLAT1____header_global_59d8b9dc756adaa5 = ((((((2296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6c77a58ce3ae4c9353269502() {
  return __cxx_static_address_6c77a58ce3ae4c9353269502.reference || (__cxx_static_address_6c77a58ce3ae4c9353269502.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT1____header_global_59d8b9dc756adaa5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:604
export const BLOODSPLAT3____header_global_ee44f00acd4f90f8 = ((((((2297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b558d13b9cd361ee80859e60() {
  return __cxx_static_address_b558d13b9cd361ee80859e60.reference || (__cxx_static_address_b558d13b9cd361ee80859e60.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT3____header_global_ee44f00acd4f90f8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:605
export const BLOODSPLAT2____header_global_790312d94be830f2 = ((((((2298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1ac99e8e6c859f80ba6f6203() {
  return __cxx_static_address_1ac99e8e6c859f80ba6f6203.reference || (__cxx_static_address_1ac99e8e6c859f80ba6f6203.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT2____header_global_790312d94be830f2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:606
export const BLOODSPLAT4____header_global_930678bbd41bab79 = ((((((2299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bfbdbf48ed7c9ab25a58392d() {
  return __cxx_static_address_bfbdbf48ed7c9ab25a58392d.reference || (__cxx_static_address_bfbdbf48ed7c9ab25a58392d.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT4____header_global_930678bbd41bab79; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:607
export const OOZ____header_global_8bef44e2d4ac17fd = ((((((2300) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_41cda2e69097be678afc59a3() {
  return __cxx_static_address_41cda2e69097be678afc59a3.reference || (__cxx_static_address_41cda2e69097be678afc59a3.reference = {
    __cReference: true,
    get value() { return OOZ____header_global_8bef44e2d4ac17fd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:608
export const OOZ2____header_global_79e09742c7c3b327 = ((((((2309) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5125b240a5e192ec8ef807e4() {
  return __cxx_static_address_5125b240a5e192ec8ef807e4.reference || (__cxx_static_address_5125b240a5e192ec8ef807e4.reference = {
    __cReference: true,
    get value() { return OOZ2____header_global_79e09742c7c3b327; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:609
export const WALLBLOOD1____header_global_258281b54d7cd1c1 = ((((((2301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a86789f30616999cb9d23412() {
  return __cxx_static_address_a86789f30616999cb9d23412.reference || (__cxx_static_address_a86789f30616999cb9d23412.reference = {
    __cReference: true,
    get value() { return WALLBLOOD1____header_global_258281b54d7cd1c1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:610
export const WALLBLOOD2____header_global_5838758cc26513c5 = ((((((2302) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f22b7ff94fe32c881fd59b15() {
  return __cxx_static_address_f22b7ff94fe32c881fd59b15.reference || (__cxx_static_address_f22b7ff94fe32c881fd59b15.reference = {
    __cReference: true,
    get value() { return WALLBLOOD2____header_global_5838758cc26513c5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:611
export const WALLBLOOD3____header_global_edb86310158c2eef = ((((((2303) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_03df9de86f51847dbea7120a() {
  return __cxx_static_address_03df9de86f51847dbea7120a.reference || (__cxx_static_address_03df9de86f51847dbea7120a.reference = {
    __cReference: true,
    get value() { return WALLBLOOD3____header_global_edb86310158c2eef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:612
export const WALLBLOOD4____header_global_3f4f4e5940d7e145 = ((((((2304) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4befb6e829a7fee92d480032() {
  return __cxx_static_address_4befb6e829a7fee92d480032.reference || (__cxx_static_address_4befb6e829a7fee92d480032.reference = {
    __cReference: true,
    get value() { return WALLBLOOD4____header_global_3f4f4e5940d7e145; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:613
export const WALLBLOOD5____header_global_ef1daccc009293d7 = ((((((2305) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_168441da602246a6e4c6fa98() {
  return __cxx_static_address_168441da602246a6e4c6fa98.reference || (__cxx_static_address_168441da602246a6e4c6fa98.reference = {
    __cReference: true,
    get value() { return WALLBLOOD5____header_global_ef1daccc009293d7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:614
export const WALLBLOOD7____header_global_1d1de3ed4caa93c9 = ((((((2307) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_13741e09de4460a28d6fc8fe() {
  return __cxx_static_address_13741e09de4460a28d6fc8fe.reference || (__cxx_static_address_13741e09de4460a28d6fc8fe.reference = {
    __cReference: true,
    get value() { return WALLBLOOD7____header_global_1d1de3ed4caa93c9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:615
export const WALLBLOOD8____header_global_bd7ae6022f228a28 = ((((((2308) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2e1e942788651b5d4819a08c() {
  return __cxx_static_address_2e1e942788651b5d4819a08c.reference || (__cxx_static_address_2e1e942788651b5d4819a08c.reference = {
    __cReference: true,
    get value() { return WALLBLOOD8____header_global_bd7ae6022f228a28; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:616
export const BURNING2____header_global_374e440729c48fd6 = ((((((2310) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cb75d1678706d1b17ddd9147() {
  return __cxx_static_address_cb75d1678706d1b17ddd9147.reference || (__cxx_static_address_cb75d1678706d1b17ddd9147.reference = {
    __cReference: true,
    get value() { return BURNING2____header_global_374e440729c48fd6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:617
export const FIRE2____header_global_ab34b7f79c848459 = ((((((2311) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_78132ce96c3bf09706f2c3cc() {
  return __cxx_static_address_78132ce96c3bf09706f2c3cc.reference || (__cxx_static_address_78132ce96c3bf09706f2c3cc.reference = {
    __cReference: true,
    get value() { return FIRE2____header_global_ab34b7f79c848459; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:618
export const CRACKKNUCKLES____header_global_bbcce11c594eec7e = ((((((2324) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5e5d9eabbe2a33538dbf7104() {
  return __cxx_static_address_5e5d9eabbe2a33538dbf7104.reference || (__cxx_static_address_5e5d9eabbe2a33538dbf7104.reference = {
    __cReference: true,
    get value() { return CRACKKNUCKLES____header_global_bbcce11c594eec7e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:619
export const SMALLSMOKE____header_global_867554ba99faad66 = ((((((2329) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_00d6569ff904f50d7c1aef0c() {
  return __cxx_static_address_00d6569ff904f50d7c1aef0c.reference || (__cxx_static_address_00d6569ff904f50d7c1aef0c.reference = {
    __cReference: true,
    get value() { return SMALLSMOKE____header_global_867554ba99faad66; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:620
export const FLOORFLAME____header_global_c2a6c31c662bea95 = ((((((2333) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_321baf8bc57c3d3ed6477c9b() {
  return __cxx_static_address_321baf8bc57c3d3ed6477c9b.reference || (__cxx_static_address_321baf8bc57c3d3ed6477c9b.reference = {
    __cReference: true,
    get value() { return FLOORFLAME____header_global_c2a6c31c662bea95; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:621
export const ROTATEGUN____header_global_811b6b652098c686 = ((((((2360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7d54ad798dee81e5db417880() {
  return __cxx_static_address_7d54ad798dee81e5db417880.reference || (__cxx_static_address_7d54ad798dee81e5db417880.reference = {
    __cReference: true,
    get value() { return ROTATEGUN____header_global_811b6b652098c686; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:622
export const GREENSLIME____header_global_4761fbc23d584de9 = ((((((2370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2935fcd52da41a42d91e3fc4() {
  return __cxx_static_address_2935fcd52da41a42d91e3fc4.reference || (__cxx_static_address_2935fcd52da41a42d91e3fc4.reference = {
    __cReference: true,
    get value() { return GREENSLIME____header_global_4761fbc23d584de9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:623
export const WATERDRIPSPLASH____header_global_1194f75dbf928c53 = ((((((2380) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_735e401ca87dae807ce715fb() {
  return __cxx_static_address_735e401ca87dae807ce715fb.reference || (__cxx_static_address_735e401ca87dae807ce715fb.reference = {
    __cReference: true,
    get value() { return WATERDRIPSPLASH____header_global_1194f75dbf928c53; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:624
export const SCRAP6____header_global_33e97c98c6659533 = ((((((2390) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a85cec0b0a3bf1359d24105c() {
  return __cxx_static_address_a85cec0b0a3bf1359d24105c.reference || (__cxx_static_address_a85cec0b0a3bf1359d24105c.reference = {
    __cReference: true,
    get value() { return SCRAP6____header_global_33e97c98c6659533; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:625
export const SCRAP1____header_global_fa01ab6b4e20c1ba = ((((((2400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dc5d83fc34cf7aede18ea697() {
  return __cxx_static_address_dc5d83fc34cf7aede18ea697.reference || (__cxx_static_address_dc5d83fc34cf7aede18ea697.reference = {
    __cReference: true,
    get value() { return SCRAP1____header_global_fa01ab6b4e20c1ba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:626
export const SCRAP2____header_global_530bae7a1f6824bb = ((((((2404) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_89f42ca921b54995ead84066() {
  return __cxx_static_address_89f42ca921b54995ead84066.reference || (__cxx_static_address_89f42ca921b54995ead84066.reference = {
    __cReference: true,
    get value() { return SCRAP2____header_global_530bae7a1f6824bb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:627
export const SCRAP3____header_global_29d83e6aedac0c83 = ((((((2408) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1c82182d98c535a3458abfbc() {
  return __cxx_static_address_1c82182d98c535a3458abfbc.reference || (__cxx_static_address_1c82182d98c535a3458abfbc.reference = {
    __cReference: true,
    get value() { return SCRAP3____header_global_29d83e6aedac0c83; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:628
export const SCRAP4____header_global_095be467be755307 = ((((((2412) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c0c81c94a8999afa926e0e82() {
  return __cxx_static_address_c0c81c94a8999afa926e0e82.reference || (__cxx_static_address_c0c81c94a8999afa926e0e82.reference = {
    __cReference: true,
    get value() { return SCRAP4____header_global_095be467be755307; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:629
export const SCRAP5____header_global_2655a3797f59b0d4 = ((((((2416) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_90e1ee56e66bb7a719217114() {
  return __cxx_static_address_90e1ee56e66bb7a719217114.reference || (__cxx_static_address_90e1ee56e66bb7a719217114.reference = {
    __cReference: true,
    get value() { return SCRAP5____header_global_2655a3797f59b0d4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:630
export const ORGANTIC____header_global_aacd2628e451e293 = ((((((2420) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8f16eb3b16a9f350d51b51bf() {
  return __cxx_static_address_8f16eb3b16a9f350d51b51bf.reference || (__cxx_static_address_8f16eb3b16a9f350d51b51bf.reference = {
    __cReference: true,
    get value() { return ORGANTIC____header_global_aacd2628e451e293; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:631
export const BETAVERSION____header_global_181a1ea8a3198c0e = ((((((2440) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b1f3c475a1fd54a5b4518bee() {
  return __cxx_static_address_b1f3c475a1fd54a5b4518bee.reference || (__cxx_static_address_b1f3c475a1fd54a5b4518bee.reference = {
    __cReference: true,
    get value() { return BETAVERSION____header_global_181a1ea8a3198c0e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:632
export const SELECTDIR____header_global_9b7f5fbefe46ee7e = ((((((2444) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e960f15ace352796c8693e20() {
  return __cxx_static_address_e960f15ace352796c8693e20.reference || (__cxx_static_address_e960f15ace352796c8693e20.reference = {
    __cReference: true,
    get value() { return SELECTDIR____header_global_9b7f5fbefe46ee7e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:633
export const F1HELP____header_global_3efb65c5fca60515 = ((((((2445) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_04cc3a20838098c6a9b585ce() {
  return __cxx_static_address_04cc3a20838098c6a9b585ce.reference || (__cxx_static_address_04cc3a20838098c6a9b585ce.reference = {
    __cReference: true,
    get value() { return F1HELP____header_global_3efb65c5fca60515; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:634
export const GROWSPARK____header_global_0011e54a73a514b6 = ((((((2448) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dea5d3ae3b166635b39c892c() {
  return __cxx_static_address_dea5d3ae3b166635b39c892c.reference || (__cxx_static_address_dea5d3ae3b166635b39c892c.reference = {
    __cReference: true,
    get value() { return GROWSPARK____header_global_0011e54a73a514b6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:635
export const MENUSCREEN____header_global_cf4db112dc22107a = ((((((2456) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ef66070dc573d18bd5563dc2() {
  return __cxx_static_address_ef66070dc573d18bd5563dc2.reference || (__cxx_static_address_ef66070dc573d18bd5563dc2.reference = {
    __cReference: true,
    get value() { return MENUSCREEN____header_global_cf4db112dc22107a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:636
export const MENUBAR____header_global_7350ac77470a1065 = ((((((2457) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_acfa07dad3ed16f487111ed6() {
  return __cxx_static_address_acfa07dad3ed16f487111ed6.reference || (__cxx_static_address_acfa07dad3ed16f487111ed6.reference = {
    __cReference: true,
    get value() { return MENUBAR____header_global_7350ac77470a1065; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:637
export const KILLSICON____header_global_6f58849150db3f57 = ((((((2458) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5443eaa165e5431dd5f7d51a() {
  return __cxx_static_address_5443eaa165e5431dd5f7d51a.reference || (__cxx_static_address_5443eaa165e5431dd5f7d51a.reference = {
    __cReference: true,
    get value() { return KILLSICON____header_global_6f58849150db3f57; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:638
export const FIRSTAID_ICON____header_global_bde4843e3a1b935e = ((((((2460) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9e75ed72db574b6bd5ec3051() {
  return __cxx_static_address_9e75ed72db574b6bd5ec3051.reference || (__cxx_static_address_9e75ed72db574b6bd5ec3051.reference = {
    __cReference: true,
    get value() { return FIRSTAID_ICON____header_global_bde4843e3a1b935e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:639
export const HEAT_ICON____header_global_fd03fe3efb94a5c5 = ((((((2461) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d96176501fffb48db05eaa63() {
  return __cxx_static_address_d96176501fffb48db05eaa63.reference || (__cxx_static_address_d96176501fffb48db05eaa63.reference = {
    __cReference: true,
    get value() { return HEAT_ICON____header_global_fd03fe3efb94a5c5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:640
export const BOTTOMSTATUSBAR____header_global_851449391f29826e = ((((((2462) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d7eeba71333d9414db9fbdce() {
  return __cxx_static_address_d7eeba71333d9414db9fbdce.reference || (__cxx_static_address_d7eeba71333d9414db9fbdce.reference = {
    __cReference: true,
    get value() { return BOTTOMSTATUSBAR____header_global_851449391f29826e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:641
export const BOOT_ICON____header_global_7bd5c7983e8b7533 = ((((((2463) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_efff0df2d1a31b835f7b67ce() {
  return __cxx_static_address_efff0df2d1a31b835f7b67ce.reference || (__cxx_static_address_efff0df2d1a31b835f7b67ce.reference = {
    __cReference: true,
    get value() { return BOOT_ICON____header_global_7bd5c7983e8b7533; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:642
export const FRAGBAR____header_global_57a9eec62ca54ee7 = ((((((2465) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9c134e52bbc19d0f52c7a2ab() {
  return __cxx_static_address_9c134e52bbc19d0f52c7a2ab.reference || (__cxx_static_address_9c134e52bbc19d0f52c7a2ab.reference = {
    __cReference: true,
    get value() { return FRAGBAR____header_global_57a9eec62ca54ee7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:643
export const JETPACK_ICON____header_global_c57e271100dfe4c9 = ((((((2467) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_272b2af37b1be053c3f6a08b() {
  return __cxx_static_address_272b2af37b1be053c3f6a08b.reference || (__cxx_static_address_272b2af37b1be053c3f6a08b.reference = {
    __cReference: true,
    get value() { return JETPACK_ICON____header_global_c57e271100dfe4c9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:644
export const AIRTANK_ICON____header_global_0a4075216192b3f8 = ((((((2468) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c3d5670fadcf194d36db6678() {
  return __cxx_static_address_c3d5670fadcf194d36db6678.reference || (__cxx_static_address_c3d5670fadcf194d36db6678.reference = {
    __cReference: true,
    get value() { return AIRTANK_ICON____header_global_0a4075216192b3f8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:645
export const STEROIDS_ICON____header_global_f9221017a890fff0 = ((((((2469) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_20b4c091e21dd4f5180f5a16() {
  return __cxx_static_address_20b4c091e21dd4f5180f5a16.reference || (__cxx_static_address_20b4c091e21dd4f5180f5a16.reference = {
    __cReference: true,
    get value() { return STEROIDS_ICON____header_global_f9221017a890fff0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:646
export const HOLODUKE_ICON____header_global_1f14c02a43913fa0 = ((((((2470) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5c87f351da0b835c4b2e43f9() {
  return __cxx_static_address_5c87f351da0b835c4b2e43f9.reference || (__cxx_static_address_5c87f351da0b835c4b2e43f9.reference = {
    __cReference: true,
    get value() { return HOLODUKE_ICON____header_global_1f14c02a43913fa0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:647
export const ACCESS_ICON____header_global_c66e7a34353b3962 = ((((((2471) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_19e3caa8c24d2232b04bd341() {
  return __cxx_static_address_19e3caa8c24d2232b04bd341.reference || (__cxx_static_address_19e3caa8c24d2232b04bd341.reference = {
    __cReference: true,
    get value() { return ACCESS_ICON____header_global_c66e7a34353b3962; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:648
export const DIGITALNUM____header_global_34802c4c6106c851 = ((((((2472) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2e21fb1881885727143a28c8() {
  return __cxx_static_address_2e21fb1881885727143a28c8.reference || (__cxx_static_address_2e21fb1881885727143a28c8.reference = {
    __cReference: true,
    get value() { return DIGITALNUM____header_global_34802c4c6106c851; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:649
export const DUKECAR____header_global_9e230575fb54f098 = ((((((2491) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f43b6090f6d8163caa2a8076() {
  return __cxx_static_address_f43b6090f6d8163caa2a8076.reference || (__cxx_static_address_f43b6090f6d8163caa2a8076.reference = {
    __cReference: true,
    get value() { return DUKECAR____header_global_9e230575fb54f098; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:650
export const CAMCORNER____header_global_d848d40c99ea2569 = ((((((2482) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9504200aa692b5915257b282() {
  return __cxx_static_address_9504200aa692b5915257b282.reference || (__cxx_static_address_9504200aa692b5915257b282.reference = {
    __cReference: true,
    get value() { return CAMCORNER____header_global_d848d40c99ea2569; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:651
export const CAMLIGHT____header_global_787997d9b727efb5 = ((((((2484) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_101e33a8cc8d30ea28650d47() {
  return __cxx_static_address_101e33a8cc8d30ea28650d47.reference || (__cxx_static_address_101e33a8cc8d30ea28650d47.reference = {
    __cReference: true,
    get value() { return CAMLIGHT____header_global_787997d9b727efb5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:652
export const SLIDEBAR____header_global_f380843ba16c6394 = ((((((2489) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_08b9098695b1bf7efae8f353() {
  return __cxx_static_address_08b9098695b1bf7efae8f353.reference || (__cxx_static_address_08b9098695b1bf7efae8f353.reference = {
    __cReference: true,
    get value() { return SLIDEBAR____header_global_f380843ba16c6394; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:653
export const DREALMS____header_global_733989f01cffd7ec = ((((((2492) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_008bc85e000769351ab7e4e7() {
  return __cxx_static_address_008bc85e000769351ab7e4e7.reference || (__cxx_static_address_008bc85e000769351ab7e4e7.reference = {
    __cReference: true,
    get value() { return DREALMS____header_global_733989f01cffd7ec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:654
export const BETASCREEN____header_global_4e77a5e8687602e1 = ((((((2493) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0b3bdfffed6e31d4efe9707c() {
  return __cxx_static_address_0b3bdfffed6e31d4efe9707c.reference || (__cxx_static_address_0b3bdfffed6e31d4efe9707c.reference = {
    __cReference: true,
    get value() { return BETASCREEN____header_global_4e77a5e8687602e1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:655
export const WINDOWBORDER1____header_global_dd0b2537a7ec6d3a = ((((((2494) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3c4f891a752319532a2c6c91() {
  return __cxx_static_address_3c4f891a752319532a2c6c91.reference || (__cxx_static_address_3c4f891a752319532a2c6c91.reference = {
    __cReference: true,
    get value() { return WINDOWBORDER1____header_global_dd0b2537a7ec6d3a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:656
export const TEXTBOX____header_global_9fa4aaf021b7a4fd = ((((((2495) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_11188d67c7561287fb3c3cfe() {
  return __cxx_static_address_11188d67c7561287fb3c3cfe.reference || (__cxx_static_address_11188d67c7561287fb3c3cfe.reference = {
    __cReference: true,
    get value() { return TEXTBOX____header_global_9fa4aaf021b7a4fd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:657
export const WINDOWBORDER2____header_global_f86a6e901d13ec64 = ((((((2496) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b4da050e01b10893b278b5b2() {
  return __cxx_static_address_b4da050e01b10893b278b5b2.reference || (__cxx_static_address_b4da050e01b10893b278b5b2.reference = {
    __cReference: true,
    get value() { return WINDOWBORDER2____header_global_f86a6e901d13ec64; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:658
export const DUKENUKEM____header_global_24498c5078b70898 = ((((((2497) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8916decb912b4d33bec8f5a3() {
  return __cxx_static_address_8916decb912b4d33bec8f5a3.reference || (__cxx_static_address_8916decb912b4d33bec8f5a3.reference = {
    __cReference: true,
    get value() { return DUKENUKEM____header_global_24498c5078b70898; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:659
export const THREEDEE____header_global_d1a5993a4713706e = ((((((2498) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_09ab8c0e097e7fd0dccc9716() {
  return __cxx_static_address_09ab8c0e097e7fd0dccc9716.reference || (__cxx_static_address_09ab8c0e097e7fd0dccc9716.reference = {
    __cReference: true,
    get value() { return THREEDEE____header_global_d1a5993a4713706e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:660
export const INGAMEDUKETHREEDEE____header_global_572b5ecf3e3bda3b = ((((((2499) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0490c584ec71cec9af805092() {
  return __cxx_static_address_0490c584ec71cec9af805092.reference || (__cxx_static_address_0490c584ec71cec9af805092.reference = {
    __cReference: true,
    get value() { return INGAMEDUKETHREEDEE____header_global_572b5ecf3e3bda3b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:661
export const TENSCREEN____header_global_25882bab6a1c1445 = ((((((2500) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5e68d34fda7ee81d1056c9e4() {
  return __cxx_static_address_5e68d34fda7ee81d1056c9e4.reference || (__cxx_static_address_5e68d34fda7ee81d1056c9e4.reference = {
    __cReference: true,
    get value() { return TENSCREEN____header_global_25882bab6a1c1445; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:662
export const PLUTOPAKSPRITE____header_global_30b0c08931897313 = ((((((2501) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_53e0a1e8e2827e0a57b75e9b() {
  return __cxx_static_address_53e0a1e8e2827e0a57b75e9b.reference || (__cxx_static_address_53e0a1e8e2827e0a57b75e9b.reference = {
    __cReference: true,
    get value() { return PLUTOPAKSPRITE____header_global_30b0c08931897313; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:663
export const DEVISTATOR____header_global_fa14bcbacef4c743 = ((((((2510) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5d0d4c9ee3935f73039fb975() {
  return __cxx_static_address_5d0d4c9ee3935f73039fb975.reference || (__cxx_static_address_5d0d4c9ee3935f73039fb975.reference = {
    __cReference: true,
    get value() { return DEVISTATOR____header_global_fa14bcbacef4c743; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:664
export const KNEE____header_global_266fcdeebeca6adb = ((((((2521) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5dd61f420510b4926cdd8a93() {
  return __cxx_static_address_5dd61f420510b4926cdd8a93.reference || (__cxx_static_address_5dd61f420510b4926cdd8a93.reference = {
    __cReference: true,
    get value() { return KNEE____header_global_266fcdeebeca6adb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:665
export const CROSSHAIR____header_global_9471fbda404059b4 = ((((((2523) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4b1d2e2430b9010b7abfd7c5() {
  return __cxx_static_address_4b1d2e2430b9010b7abfd7c5.reference || (__cxx_static_address_4b1d2e2430b9010b7abfd7c5.reference = {
    __cReference: true,
    get value() { return CROSSHAIR____header_global_9471fbda404059b4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:666
export const FIRSTGUN____header_global_81de973a5676c0f1 = ((((((2524) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d0f0e989bb38a1cab865a27d() {
  return __cxx_static_address_d0f0e989bb38a1cab865a27d.reference || (__cxx_static_address_d0f0e989bb38a1cab865a27d.reference = {
    __cReference: true,
    get value() { return FIRSTGUN____header_global_81de973a5676c0f1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:667
export const FIRSTGUNRELOAD____header_global_7d4e9cd40907f6cc = ((((((2528) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c5005fdaa26bfa4937e6cdfb() {
  return __cxx_static_address_c5005fdaa26bfa4937e6cdfb.reference || (__cxx_static_address_c5005fdaa26bfa4937e6cdfb.reference = {
    __cReference: true,
    get value() { return FIRSTGUNRELOAD____header_global_7d4e9cd40907f6cc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:668
export const SHELL____header_global_2d445de52bf03218 = ((((((2533) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ff461d40ca47ceeefaa8928d() {
  return __cxx_static_address_ff461d40ca47ceeefaa8928d.reference || (__cxx_static_address_ff461d40ca47ceeefaa8928d.reference = {
    __cReference: true,
    get value() { return SHELL____header_global_2d445de52bf03218; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:669
export const SHOTGUNSHELL____header_global_725a1dddbb88c1fe = ((((((2535) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4511a2d6a0f056755f33b838() {
  return __cxx_static_address_4511a2d6a0f056755f33b838.reference || (__cxx_static_address_4511a2d6a0f056755f33b838.reference = {
    __cReference: true,
    get value() { return SHOTGUNSHELL____header_global_725a1dddbb88c1fe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:670
export const CHAINGUN____header_global_eff8a29688511789 = ((((((2536) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c1357f56d992c3ff884f132f() {
  return __cxx_static_address_c1357f56d992c3ff884f132f.reference || (__cxx_static_address_c1357f56d992c3ff884f132f.reference = {
    __cReference: true,
    get value() { return CHAINGUN____header_global_eff8a29688511789; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:671
export const RPGGUN____header_global_fd1eca897761af93 = ((((((2544) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_069d12eaa6d7d2b35bacb424() {
  return __cxx_static_address_069d12eaa6d7d2b35bacb424.reference || (__cxx_static_address_069d12eaa6d7d2b35bacb424.reference = {
    __cReference: true,
    get value() { return RPGGUN____header_global_fd1eca897761af93; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:672
export const FREEZE____header_global_516ad8aadffa7164 = ((((((2548) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f27d80eba2aedef88705017e() {
  return __cxx_static_address_f27d80eba2aedef88705017e.reference || (__cxx_static_address_f27d80eba2aedef88705017e.reference = {
    __cReference: true,
    get value() { return FREEZE____header_global_516ad8aadffa7164; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:673
export const SHRINKER____header_global_1102ae3427f193b8 = ((((((2556) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d05dafc0cc4826c38260fd99() {
  return __cxx_static_address_d05dafc0cc4826c38260fd99.reference || (__cxx_static_address_d05dafc0cc4826c38260fd99.reference = {
    __cReference: true,
    get value() { return SHRINKER____header_global_1102ae3427f193b8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:674
export const HANDHOLDINGLASER____header_global_7a98ba926c40c8a0 = ((((((2563) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_589cf7f33b7e0b13515416aa() {
  return __cxx_static_address_589cf7f33b7e0b13515416aa.reference || (__cxx_static_address_589cf7f33b7e0b13515416aa.reference = {
    __cReference: true,
    get value() { return HANDHOLDINGLASER____header_global_7a98ba926c40c8a0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:675
export const TRIPBOMB____header_global_48ff60a5d25f3396 = ((((((2566) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_256e02ddd135d1c7a845b6a7() {
  return __cxx_static_address_256e02ddd135d1c7a845b6a7.reference || (__cxx_static_address_256e02ddd135d1c7a845b6a7.reference = {
    __cReference: true,
    get value() { return TRIPBOMB____header_global_48ff60a5d25f3396; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:676
export const LASERLINE____header_global_1fc976580225bf1f = ((((((2567) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_97b755c32ddab240ebaef504() {
  return __cxx_static_address_97b755c32ddab240ebaef504.reference || (__cxx_static_address_97b755c32ddab240ebaef504.reference = {
    __cReference: true,
    get value() { return LASERLINE____header_global_1fc976580225bf1f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:677
export const HANDHOLDINGACCESS____header_global_28740078d95a5ebb = ((((((2568) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ecb9b37eb0aa2d07df584a99() {
  return __cxx_static_address_ecb9b37eb0aa2d07df584a99.reference || (__cxx_static_address_ecb9b37eb0aa2d07df584a99.reference = {
    __cReference: true,
    get value() { return HANDHOLDINGACCESS____header_global_28740078d95a5ebb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:678
export const HANDREMOTE____header_global_e9272bf4b8872c53 = ((((((2570) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_88612bba2f53bfae872746c9() {
  return __cxx_static_address_88612bba2f53bfae872746c9.reference || (__cxx_static_address_88612bba2f53bfae872746c9.reference = {
    __cReference: true,
    get value() { return HANDREMOTE____header_global_e9272bf4b8872c53; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:679
export const HANDTHROW____header_global_478f24aadb99fb19 = ((((((2573) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_590411beaf1005d53a5fab4d() {
  return __cxx_static_address_590411beaf1005d53a5fab4d.reference || (__cxx_static_address_590411beaf1005d53a5fab4d.reference = {
    __cReference: true,
    get value() { return HANDTHROW____header_global_478f24aadb99fb19; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:680
export const TIP____header_global_e9df876b00487e1f = ((((((2576) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4ae10a435b80cd1f53dbbda9() {
  return __cxx_static_address_4ae10a435b80cd1f53dbbda9.reference || (__cxx_static_address_4ae10a435b80cd1f53dbbda9.reference = {
    __cReference: true,
    get value() { return TIP____header_global_e9df876b00487e1f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:681
export const SCUBAMASK____header_global_6545dad2dd3f14fe = ((((((2581) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9a172e44e01583fa3305d7c6() {
  return __cxx_static_address_9a172e44e01583fa3305d7c6.reference || (__cxx_static_address_9a172e44e01583fa3305d7c6.reference = {
    __cReference: true,
    get value() { return SCUBAMASK____header_global_6545dad2dd3f14fe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:682
export const FORCESPHERE____header_global_8d5b8f5475254e25 = ((((((2590) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bc1562f5c96b3701c130fabb() {
  return __cxx_static_address_bc1562f5c96b3701c130fabb.reference || (__cxx_static_address_bc1562f5c96b3701c130fabb.reference = {
    __cReference: true,
    get value() { return FORCESPHERE____header_global_8d5b8f5475254e25; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:683
export const SHOTSPARK1____header_global_252945aa0b661324 = ((((((2595) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9bd6847425699f130ba13ea9() {
  return __cxx_static_address_9bd6847425699f130ba13ea9.reference || (__cxx_static_address_9bd6847425699f130ba13ea9.reference = {
    __cReference: true,
    get value() { return SHOTSPARK1____header_global_252945aa0b661324; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:684
export const RPG____header_global_3494312b153e147a = ((((((2605) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_af52226b188ff8bf841edc2a() {
  return __cxx_static_address_af52226b188ff8bf841edc2a.reference || (__cxx_static_address_af52226b188ff8bf841edc2a.reference = {
    __cReference: true,
    get value() { return RPG____header_global_3494312b153e147a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:685
export const LASERSITE____header_global_c36ee17fb29ba04a = ((((((2612) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1df4065503075a6dd434f834() {
  return __cxx_static_address_1df4065503075a6dd434f834.reference || (__cxx_static_address_1df4065503075a6dd434f834.reference = {
    __cReference: true,
    get value() { return LASERSITE____header_global_c36ee17fb29ba04a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:686
export const SHOTGUN____header_global_933dbbabc87fc347 = ((((((2613) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3f6e804085fbf2d6db61d9e2() {
  return __cxx_static_address_3f6e804085fbf2d6db61d9e2.reference || (__cxx_static_address_3f6e804085fbf2d6db61d9e2.reference = {
    __cReference: true,
    get value() { return SHOTGUN____header_global_933dbbabc87fc347; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:687
export const BOSS1____header_global_0b261ed453d94255 = ((((((2630) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9926876df57d94e827147b1c() {
  return __cxx_static_address_9926876df57d94e827147b1c.reference || (__cxx_static_address_9926876df57d94e827147b1c.reference = {
    __cReference: true,
    get value() { return BOSS1____header_global_0b261ed453d94255; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:688
export const BOSS1STAYPUT____header_global_b42b04df6ec68b8e = ((((((2631) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d04c7086ef0ac7650a39ce33() {
  return __cxx_static_address_d04c7086ef0ac7650a39ce33.reference || (__cxx_static_address_d04c7086ef0ac7650a39ce33.reference = {
    __cReference: true,
    get value() { return BOSS1STAYPUT____header_global_b42b04df6ec68b8e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:689
export const BOSS1SHOOT____header_global_539fcb8fc63e43c6 = ((((((2660) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f01404372a38acbd96b74841() {
  return __cxx_static_address_f01404372a38acbd96b74841.reference || (__cxx_static_address_f01404372a38acbd96b74841.reference = {
    __cReference: true,
    get value() { return BOSS1SHOOT____header_global_539fcb8fc63e43c6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:690
export const BOSS1LOB____header_global_bc75e2608873aefa = ((((((2670) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_859f6ce46e1485ad4e7cb156() {
  return __cxx_static_address_859f6ce46e1485ad4e7cb156.reference || (__cxx_static_address_859f6ce46e1485ad4e7cb156.reference = {
    __cReference: true,
    get value() { return BOSS1LOB____header_global_bc75e2608873aefa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:691
export const BOSSTOP____header_global_d2fd2cbce517d886 = ((((((2696) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_da9c3305e2d2d8ca0f621bfc() {
  return __cxx_static_address_da9c3305e2d2d8ca0f621bfc.reference || (__cxx_static_address_da9c3305e2d2d8ca0f621bfc.reference = {
    __cReference: true,
    get value() { return BOSSTOP____header_global_d2fd2cbce517d886; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:692
export const BOSS2____header_global_b6d9b638b3655610 = ((((((2710) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ec49f8cada6210bf58abe373() {
  return __cxx_static_address_ec49f8cada6210bf58abe373.reference || (__cxx_static_address_ec49f8cada6210bf58abe373.reference = {
    __cReference: true,
    get value() { return BOSS2____header_global_b6d9b638b3655610; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:693
export const BOSS3____header_global_e23c5a1c3a57c8a4 = ((((((2760) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ee46f0585d05095889051eb5() {
  return __cxx_static_address_ee46f0585d05095889051eb5.reference || (__cxx_static_address_ee46f0585d05095889051eb5.reference = {
    __cReference: true,
    get value() { return BOSS3____header_global_e23c5a1c3a57c8a4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:694
export const SPINNINGNUKEICON____header_global_3d34efd48450471c = ((((((2813) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ef908cdf5a1f23e9fdd3aee3() {
  return __cxx_static_address_ef908cdf5a1f23e9fdd3aee3.reference || (__cxx_static_address_ef908cdf5a1f23e9fdd3aee3.reference = {
    __cReference: true,
    get value() { return SPINNINGNUKEICON____header_global_3d34efd48450471c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:695
export const SMALLFNTCURSOR____header_global_88d0a4909faa0010 = ((((((2821) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1981ed4a413a5176f14446e1() {
  return __cxx_static_address_1981ed4a413a5176f14446e1.reference || (__cxx_static_address_1981ed4a413a5176f14446e1.reference = {
    __cReference: true,
    get value() { return SMALLFNTCURSOR____header_global_88d0a4909faa0010; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:696
export const STARTALPHANUM____header_global_8445f26c5aac3ee0 = ((((((2822) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b0b0e77e9e43b44c0a5e0076() {
  return __cxx_static_address_b0b0e77e9e43b44c0a5e0076.reference || (__cxx_static_address_b0b0e77e9e43b44c0a5e0076.reference = {
    __cReference: true,
    get value() { return STARTALPHANUM____header_global_8445f26c5aac3ee0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:697
export const ENDALPHANUM____header_global_d9fc12b9d48f198e = ((((((2915) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a13400eae206c20a29ef85c6() {
  return __cxx_static_address_a13400eae206c20a29ef85c6.reference || (__cxx_static_address_a13400eae206c20a29ef85c6.reference = {
    __cReference: true,
    get value() { return ENDALPHANUM____header_global_d9fc12b9d48f198e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:698
export const BIGALPHANUM____header_global_04a61926ef0aa953 = ((((((2940) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d6e3a5491e55b9cbb4f5a95b() {
  return __cxx_static_address_d6e3a5491e55b9cbb4f5a95b.reference || (__cxx_static_address_d6e3a5491e55b9cbb4f5a95b.reference = {
    __cReference: true,
    get value() { return BIGALPHANUM____header_global_04a61926ef0aa953; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:699
export const BIGPERIOD____header_global_768cb0ef01d691a7 = ((((((3002) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0b3c53352f04562f8066f44d() {
  return __cxx_static_address_0b3c53352f04562f8066f44d.reference || (__cxx_static_address_0b3c53352f04562f8066f44d.reference = {
    __cReference: true,
    get value() { return BIGPERIOD____header_global_768cb0ef01d691a7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:700
export const BIGCOMMA____header_global_65356253b51e6a5a = ((((((3003) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3420fd9540e34f639867359e() {
  return __cxx_static_address_3420fd9540e34f639867359e.reference || (__cxx_static_address_3420fd9540e34f639867359e.reference = {
    __cReference: true,
    get value() { return BIGCOMMA____header_global_65356253b51e6a5a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:701
export const BIGX____header_global_a36398dd36d5e192 = ((((((3004) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ba2cfc47ec5b2d80c37903dd() {
  return __cxx_static_address_ba2cfc47ec5b2d80c37903dd.reference || (__cxx_static_address_ba2cfc47ec5b2d80c37903dd.reference = {
    __cReference: true,
    get value() { return BIGX____header_global_a36398dd36d5e192; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:702
export const BIGQ____header_global_bc8d0a8d4bfe2446 = ((((((3005) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_197f1b11f5a3d1444f305d2b() {
  return __cxx_static_address_197f1b11f5a3d1444f305d2b.reference || (__cxx_static_address_197f1b11f5a3d1444f305d2b.reference = {
    __cReference: true,
    get value() { return BIGQ____header_global_bc8d0a8d4bfe2446; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:703
export const BIGSEMI____header_global_cd8be169fda276cf = ((((((3006) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7efc5900a9f8164e43962fd5() {
  return __cxx_static_address_7efc5900a9f8164e43962fd5.reference || (__cxx_static_address_7efc5900a9f8164e43962fd5.reference = {
    __cReference: true,
    get value() { return BIGSEMI____header_global_cd8be169fda276cf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:704
export const BIGCOLIN____header_global_dbfd75bd3101b08b = ((((((3007) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_00fcfad01e4805c17608847b() {
  return __cxx_static_address_00fcfad01e4805c17608847b.reference || (__cxx_static_address_00fcfad01e4805c17608847b.reference = {
    __cReference: true,
    get value() { return BIGCOLIN____header_global_dbfd75bd3101b08b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:705
export const THREEBYFIVE____header_global_0a60b3756fb4968d = ((((((3010) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_02d6bea9cc2c9a299dff8ac7() {
  return __cxx_static_address_02d6bea9cc2c9a299dff8ac7.reference || (__cxx_static_address_02d6bea9cc2c9a299dff8ac7.reference = {
    __cReference: true,
    get value() { return THREEBYFIVE____header_global_0a60b3756fb4968d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:706
export const BIGAPPOS____header_global_f9e6eae78699107d = ((((((3022) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_145bcd60314ca795e65c8b9f() {
  return __cxx_static_address_145bcd60314ca795e65c8b9f.reference || (__cxx_static_address_145bcd60314ca795e65c8b9f.reference = {
    __cReference: true,
    get value() { return BIGAPPOS____header_global_f9e6eae78699107d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:707
export const MINIFONT____header_global_2e0fe42cba85acf1 = ((((((3072) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f0f9cf1a171a257c7315e8ae() {
  return __cxx_static_address_f0f9cf1a171a257c7315e8ae.reference || (__cxx_static_address_f0f9cf1a171a257c7315e8ae.reference = {
    __cReference: true,
    get value() { return MINIFONT____header_global_2e0fe42cba85acf1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:708
export const RESPAWNMARKERRED____header_global_b9ccc6cb4b81fc00 = ((((((3190) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7f42c4366b50292822dc787a() {
  return __cxx_static_address_7f42c4366b50292822dc787a.reference || (__cxx_static_address_7f42c4366b50292822dc787a.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERRED____header_global_b9ccc6cb4b81fc00; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:709
export const RESPAWNMARKERYELLOW____header_global_9ba98de7b90d4651 = ((((((3200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_073323f16c411f3512212841() {
  return __cxx_static_address_073323f16c411f3512212841.reference || (__cxx_static_address_073323f16c411f3512212841.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERYELLOW____header_global_9ba98de7b90d4651; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:710
export const RESPAWNMARKERGREEN____header_global_6e29763554553003 = ((((((3210) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7b7b2a0a8efed6b2415eb5ee() {
  return __cxx_static_address_7b7b2a0a8efed6b2415eb5ee.reference || (__cxx_static_address_7b7b2a0a8efed6b2415eb5ee.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERGREEN____header_global_6e29763554553003; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:711
export const BONUSSCREEN____header_global_65b63e14ef653986 = ((((((3240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d94a34215c4ba6a4eec05666() {
  return __cxx_static_address_d94a34215c4ba6a4eec05666.reference || (__cxx_static_address_d94a34215c4ba6a4eec05666.reference = {
    __cReference: true,
    get value() { return BONUSSCREEN____header_global_65b63e14ef653986; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:712
export const VIEWBORDER____header_global_d966907ba65df6f9 = ((((((3250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f7e0876c254f1172e11e93b6() {
  return __cxx_static_address_f7e0876c254f1172e11e93b6.reference || (__cxx_static_address_f7e0876c254f1172e11e93b6.reference = {
    __cReference: true,
    get value() { return VIEWBORDER____header_global_d966907ba65df6f9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:713
export const VICTORY1____header_global_98695386f5ccd635 = ((((((3260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ac30702a755f5ed5a584775b() {
  return __cxx_static_address_ac30702a755f5ed5a584775b.reference || (__cxx_static_address_ac30702a755f5ed5a584775b.reference = {
    __cReference: true,
    get value() { return VICTORY1____header_global_98695386f5ccd635; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:714
export const ORDERING____header_global_7b5f74c7b7147b3a = ((((((3270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f33d43acbe996334d9746fcf() {
  return __cxx_static_address_f33d43acbe996334d9746fcf.reference || (__cxx_static_address_f33d43acbe996334d9746fcf.reference = {
    __cReference: true,
    get value() { return ORDERING____header_global_7b5f74c7b7147b3a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:715
export const TEXTSTORY____header_global_810dc1b18d14cdac = ((((((3280) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_987ae2125694163fbfa984b9() {
  return __cxx_static_address_987ae2125694163fbfa984b9.reference || (__cxx_static_address_987ae2125694163fbfa984b9.reference = {
    __cReference: true,
    get value() { return TEXTSTORY____header_global_810dc1b18d14cdac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:716
export const LOADSCREEN____header_global_cd7e343fe12083e3 = ((((((3281) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b55f2cc6e0b77b6bad349246() {
  return __cxx_static_address_b55f2cc6e0b77b6bad349246.reference || (__cxx_static_address_b55f2cc6e0b77b6bad349246.reference = {
    __cReference: true,
    get value() { return LOADSCREEN____header_global_cd7e343fe12083e3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:717
export const BORNTOBEWILDSCREEN____header_global_7b54eb5ed4eae894 = ((((((3370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e0dc54eeaf0ea30cd13522ae() {
  return __cxx_static_address_e0dc54eeaf0ea30cd13522ae.reference || (__cxx_static_address_e0dc54eeaf0ea30cd13522ae.reference = {
    __cReference: true,
    get value() { return BORNTOBEWILDSCREEN____header_global_7b54eb5ed4eae894; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:718
export const BLIMP____header_global_2ab52492f47df08b = ((((((3400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_38a89ff12a46c7be67e23e69() {
  return __cxx_static_address_38a89ff12a46c7be67e23e69.reference || (__cxx_static_address_38a89ff12a46c7be67e23e69.reference = {
    __cReference: true,
    get value() { return BLIMP____header_global_2ab52492f47df08b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:719
export const FEM9____header_global_deb65c25a380ea43 = ((((((3450) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e01f02db670fa24400a284b6() {
  return __cxx_static_address_e01f02db670fa24400a284b6.reference || (__cxx_static_address_e01f02db670fa24400a284b6.reference = {
    __cReference: true,
    get value() { return FEM9____header_global_deb65c25a380ea43; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:720
export const FRAMEEFFECT1_13____header_global_2f648ad231008296 = ((((((3999) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_08f01204dd388983c2d5c8b0() {
  return __cxx_static_address_08f01204dd388983c2d5c8b0.reference || (__cxx_static_address_08f01204dd388983c2d5c8b0.reference = {
    __cReference: true,
    get value() { return FRAMEEFFECT1_13____header_global_2f648ad231008296; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:721
export const FRAMEEFFECT1____header_global_e68de5bf154d1fc6 = ((((((4095) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b27dc538c19a6ff487b819fc() {
  return __cxx_static_address_b27dc538c19a6ff487b819fc.reference || (__cxx_static_address_b27dc538c19a6ff487b819fc.reference = {
    __cReference: true,
    get value() { return FRAMEEFFECT1____header_global_e68de5bf154d1fc6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:722
export const PANNEL3____header_global_c9adf292afb810c1 = ((((((4099) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_24d7539195b530ab5f6ddfa8() {
  return __cxx_static_address_24d7539195b530ab5f6ddfa8.reference || (__cxx_static_address_24d7539195b530ab5f6ddfa8.reference = {
    __cReference: true,
    get value() { return PANNEL3____header_global_c9adf292afb810c1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:723
export const SCREENBREAK14____header_global_f61add4504368de2 = ((((((4120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fe178f094c159dfaf12536bb() {
  return __cxx_static_address_fe178f094c159dfaf12536bb.reference || (__cxx_static_address_fe178f094c159dfaf12536bb.reference = {
    __cReference: true,
    get value() { return SCREENBREAK14____header_global_f61add4504368de2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:724
export const SCREENBREAK15____header_global_789314ca2ca7861a = ((((((4123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6940f319c20c9a4d4b914e03() {
  return __cxx_static_address_6940f319c20c9a4d4b914e03.reference || (__cxx_static_address_6940f319c20c9a4d4b914e03.reference = {
    __cReference: true,
    get value() { return SCREENBREAK15____header_global_789314ca2ca7861a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:725
export const SCREENBREAK19____header_global_350ed5689003540b = ((((((4125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_576e56c8bb860e0070d6d62d() {
  return __cxx_static_address_576e56c8bb860e0070d6d62d.reference || (__cxx_static_address_576e56c8bb860e0070d6d62d.reference = {
    __cReference: true,
    get value() { return SCREENBREAK19____header_global_350ed5689003540b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:726
export const SCREENBREAK16____header_global_291832ad295cc9c5 = ((((((4127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a44c97642410dd91092bd132() {
  return __cxx_static_address_a44c97642410dd91092bd132.reference || (__cxx_static_address_a44c97642410dd91092bd132.reference = {
    __cReference: true,
    get value() { return SCREENBREAK16____header_global_291832ad295cc9c5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:727
export const SCREENBREAK17____header_global_e816aa2a6c2bf51d = ((((((4128) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ffc04ad9554dc5900b8c29c1() {
  return __cxx_static_address_ffc04ad9554dc5900b8c29c1.reference || (__cxx_static_address_ffc04ad9554dc5900b8c29c1.reference = {
    __cReference: true,
    get value() { return SCREENBREAK17____header_global_e816aa2a6c2bf51d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:728
export const SCREENBREAK18____header_global_abc45ae417d0568b = ((((((4129) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_28c2f6143462815704ce5cf3() {
  return __cxx_static_address_28c2f6143462815704ce5cf3.reference || (__cxx_static_address_28c2f6143462815704ce5cf3.reference = {
    __cReference: true,
    get value() { return SCREENBREAK18____header_global_abc45ae417d0568b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:729
export const W_TECHWALL11____header_global_7c3c9b2a4e194249 = ((((((4130) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5f061128de5a9b8be0a46d67() {
  return __cxx_static_address_5f061128de5a9b8be0a46d67.reference || (__cxx_static_address_5f061128de5a9b8be0a46d67.reference = {
    __cReference: true,
    get value() { return W_TECHWALL11____header_global_7c3c9b2a4e194249; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:730
export const W_TECHWALL12____header_global_6094f8a94523abb2 = ((((((4131) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_11a67fdfbe0eac67334fc5e5() {
  return __cxx_static_address_11a67fdfbe0eac67334fc5e5.reference || (__cxx_static_address_11a67fdfbe0eac67334fc5e5.reference = {
    __cReference: true,
    get value() { return W_TECHWALL12____header_global_6094f8a94523abb2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:731
export const W_TECHWALL13____header_global_50cf415782231b1a = ((((((4132) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dd70ea5e9f60e3ea2985f93b() {
  return __cxx_static_address_dd70ea5e9f60e3ea2985f93b.reference || (__cxx_static_address_dd70ea5e9f60e3ea2985f93b.reference = {
    __cReference: true,
    get value() { return W_TECHWALL13____header_global_50cf415782231b1a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:732
export const W_TECHWALL14____header_global_272bfa20817a707c = ((((((4133) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d42a386ab6be80986a694c8c() {
  return __cxx_static_address_d42a386ab6be80986a694c8c.reference || (__cxx_static_address_d42a386ab6be80986a694c8c.reference = {
    __cReference: true,
    get value() { return W_TECHWALL14____header_global_272bfa20817a707c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:733
export const W_TECHWALL5____header_global_7328cd61784332bf = ((((((4134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a426a63e63929e376045b5f5() {
  return __cxx_static_address_a426a63e63929e376045b5f5.reference || (__cxx_static_address_a426a63e63929e376045b5f5.reference = {
    __cReference: true,
    get value() { return W_TECHWALL5____header_global_7328cd61784332bf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:734
export const W_TECHWALL6____header_global_dd2dc51882c3be71 = ((((((4136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_24f1e11713796a7414ab8528() {
  return __cxx_static_address_24f1e11713796a7414ab8528.reference || (__cxx_static_address_24f1e11713796a7414ab8528.reference = {
    __cReference: true,
    get value() { return W_TECHWALL6____header_global_dd2dc51882c3be71; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:735
export const W_TECHWALL7____header_global_03154431352a5790 = ((((((4138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6b8ee7e6a6e7a986c834e585() {
  return __cxx_static_address_6b8ee7e6a6e7a986c834e585.reference || (__cxx_static_address_6b8ee7e6a6e7a986c834e585.reference = {
    __cReference: true,
    get value() { return W_TECHWALL7____header_global_03154431352a5790; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:736
export const W_TECHWALL8____header_global_66aaa88115540d4b = ((((((4140) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_279509c44850d2eb97f50cb7() {
  return __cxx_static_address_279509c44850d2eb97f50cb7.reference || (__cxx_static_address_279509c44850d2eb97f50cb7.reference = {
    __cReference: true,
    get value() { return W_TECHWALL8____header_global_66aaa88115540d4b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:737
export const W_TECHWALL9____header_global_7b84125ee5f14206 = ((((((4142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4302c46ba0e783d6e806ad41() {
  return __cxx_static_address_4302c46ba0e783d6e806ad41.reference || (__cxx_static_address_4302c46ba0e783d6e806ad41.reference = {
    __cReference: true,
    get value() { return W_TECHWALL9____header_global_7b84125ee5f14206; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:738
export const BPANNEL3____header_global_945d47cf976de094 = ((((((4100) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a8a79a7a90f70c8ec6f20c7a() {
  return __cxx_static_address_a8a79a7a90f70c8ec6f20c7a.reference || (__cxx_static_address_a8a79a7a90f70c8ec6f20c7a.reference = {
    __cReference: true,
    get value() { return BPANNEL3____header_global_945d47cf976de094; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:739
export const W_HITTECHWALL16____header_global_ddd39cda82dc1066 = ((((((4144) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d46b99bf6075584bd7ec0d2d() {
  return __cxx_static_address_d46b99bf6075584bd7ec0d2d.reference || (__cxx_static_address_d46b99bf6075584bd7ec0d2d.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL16____header_global_ddd39cda82dc1066; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:740
export const W_HITTECHWALL10____header_global_d15c71261adaf842 = ((((((4145) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a065fb25e161249982e4b292() {
  return __cxx_static_address_a065fb25e161249982e4b292.reference || (__cxx_static_address_a065fb25e161249982e4b292.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL10____header_global_d15c71261adaf842; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:741
export const W_HITTECHWALL15____header_global_605be6504b8bd3ba = ((((((4147) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_af9737f8db44756666fe0335() {
  return __cxx_static_address_af9737f8db44756666fe0335.reference || (__cxx_static_address_af9737f8db44756666fe0335.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL15____header_global_605be6504b8bd3ba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:742
export const W_MILKSHELF____header_global_2631d10e4e3a16cf = ((((((4181) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bb2b8174d63363794121b911() {
  return __cxx_static_address_bb2b8174d63363794121b911.reference || (__cxx_static_address_bb2b8174d63363794121b911.reference = {
    __cReference: true,
    get value() { return W_MILKSHELF____header_global_2631d10e4e3a16cf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:743
export const W_MILKSHELFBROKE____header_global_e6771613a1fa3f70 = ((((((4203) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7fa76ab4e8bc863273a4f0f1() {
  return __cxx_static_address_7fa76ab4e8bc863273a4f0f1.reference || (__cxx_static_address_7fa76ab4e8bc863273a4f0f1.reference = {
    __cReference: true,
    get value() { return W_MILKSHELFBROKE____header_global_e6771613a1fa3f70; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:744
export const PURPLELAVA____header_global_5ec35f63651ec2b0 = ((((((4240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_58432a8271b612bc4c61ec7b() {
  return __cxx_static_address_58432a8271b612bc4c61ec7b.reference || (__cxx_static_address_58432a8271b612bc4c61ec7b.reference = {
    __cReference: true,
    get value() { return PURPLELAVA____header_global_5ec35f63651ec2b0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:745
export const TARGET____header_global_9418173023404c58 = ((((((4359) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fe5eb398ca5eee2192078f20() {
  return __cxx_static_address_fe5eb398ca5eee2192078f20.reference || (__cxx_static_address_fe5eb398ca5eee2192078f20.reference = {
    __cReference: true,
    get value() { return TARGET____header_global_9418173023404c58; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:746
export const DUCK____header_global_77212d4a621e0a5c = ((((((4361) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ec2e277827fd8b27e962c576() {
  return __cxx_static_address_ec2e277827fd8b27e962c576.reference || (__cxx_static_address_ec2e277827fd8b27e962c576.reference = {
    __cReference: true,
    get value() { return DUCK____header_global_77212d4a621e0a5c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:747
export const PUKE____header_global_27315762c342f741 = ((((((4389) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2d853a5dfda51e1b84187d68() {
  return __cxx_static_address_2d853a5dfda51e1b84187d68.reference || (__cxx_static_address_2d853a5dfda51e1b84187d68.reference = {
    __cReference: true,
    get value() { return PUKE____header_global_27315762c342f741; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:748
export const DOORTILE23____header_global_cb8f011613b3d8c7 = ((((((4391) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_41ffef1741bad85c3ac6a693() {
  return __cxx_static_address_41ffef1741bad85c3ac6a693.reference || (__cxx_static_address_41ffef1741bad85c3ac6a693.reference = {
    __cReference: true,
    get value() { return DOORTILE23____header_global_cb8f011613b3d8c7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:749
export const SPEAKER____header_global_1b99c8459ca1e6fe = ((((((4397) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_49299126d0e9f27eda3deb47() {
  return __cxx_static_address_49299126d0e9f27eda3deb47.reference || (__cxx_static_address_49299126d0e9f27eda3deb47.reference = {
    __cReference: true,
    get value() { return SPEAKER____header_global_1b99c8459ca1e6fe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:750
export const MAIL____header_global_b7ab651e7c410180 = ((((((4410) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c829701db8987f19f2fded75() {
  return __cxx_static_address_c829701db8987f19f2fded75.reference || (__cxx_static_address_c829701db8987f19f2fded75.reference = {
    __cReference: true,
    get value() { return MAIL____header_global_b7ab651e7c410180; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:751
export const HOTMEAT____header_global_8b16dafaf1c5bdf7 = ((((((4427) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_930d7cf4ed418202fadbe9b8() {
  return __cxx_static_address_930d7cf4ed418202fadbe9b8.reference || (__cxx_static_address_930d7cf4ed418202fadbe9b8.reference = {
    __cReference: true,
    get value() { return HOTMEAT____header_global_8b16dafaf1c5bdf7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:752
export const TRIPODCAMERA____header_global_b09ad1f1b40dea0d = ((((((4444) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bbeee12ade8466b3583703c5() {
  return __cxx_static_address_bbeee12ade8466b3583703c5.reference || (__cxx_static_address_bbeee12ade8466b3583703c5.reference = {
    __cReference: true,
    get value() { return TRIPODCAMERA____header_global_b09ad1f1b40dea0d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:753
export const PAPER____header_global_24acee9f9245e8ec = ((((((4460) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2a76886d6f5011023df0d30c() {
  return __cxx_static_address_2a76886d6f5011023df0d30c.reference || (__cxx_static_address_2a76886d6f5011023df0d30c.reference = {
    __cReference: true,
    get value() { return PAPER____header_global_24acee9f9245e8ec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:754
export const GENERICPOLE2____header_global_e068387bf91fb553 = ((((((4465) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_194ba3d45a444974daf87aa1() {
  return __cxx_static_address_194ba3d45a444974daf87aa1.reference || (__cxx_static_address_194ba3d45a444974daf87aa1.reference = {
    __cReference: true,
    get value() { return GENERICPOLE2____header_global_e068387bf91fb553; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:755
export const XXXSTACY____header_global_d4fde602f4223f19 = ((((((4470) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_21d3d7641af4feaae237ccbc() {
  return __cxx_static_address_21d3d7641af4feaae237ccbc.reference || (__cxx_static_address_21d3d7641af4feaae237ccbc.reference = {
    __cReference: true,
    get value() { return XXXSTACY____header_global_d4fde602f4223f19; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:756
export const LETTER____header_global_59dc274af2ab2851 = ((((((4502) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0ab952dbfbf8e3f68a45ba7c() {
  return __cxx_static_address_0ab952dbfbf8e3f68a45ba7c.reference || (__cxx_static_address_0ab952dbfbf8e3f68a45ba7c.reference = {
    __cReference: true,
    get value() { return LETTER____header_global_59dc274af2ab2851; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:757
export const SIDEBOLT1____header_global_74005fef45c62beb = ((((((4525) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6c93c3b8ff2aea3390b43c83() {
  return __cxx_static_address_6c93c3b8ff2aea3390b43c83.reference || (__cxx_static_address_6c93c3b8ff2aea3390b43c83.reference = {
    __cReference: true,
    get value() { return SIDEBOLT1____header_global_74005fef45c62beb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:758
export const FOODOBJECT16____header_global_2927f78551a0192d = ((((((4545) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3352e6904eb763f61b821cea() {
  return __cxx_static_address_3352e6904eb763f61b821cea.reference || (__cxx_static_address_3352e6904eb763f61b821cea.reference = {
    __cReference: true,
    get value() { return FOODOBJECT16____header_global_2927f78551a0192d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:759
export const TAMPON____header_global_6eeb579e05ca751d = ((((((4557) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_29102bdd4c3858c2941688fa() {
  return __cxx_static_address_29102bdd4c3858c2941688fa.reference || (__cxx_static_address_29102bdd4c3858c2941688fa.reference = {
    __cReference: true,
    get value() { return TAMPON____header_global_6eeb579e05ca751d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:760
export const CANWITHSOMETHING2____header_global_5b36fad33bdb45e8 = ((((((4580) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_75e76b15efaaef18dc78c223() {
  return __cxx_static_address_75e76b15efaaef18dc78c223.reference || (__cxx_static_address_75e76b15efaaef18dc78c223.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING2____header_global_5b36fad33bdb45e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:761
export const CANWITHSOMETHING3____header_global_4db50baec0f3e306 = ((((((4581) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_30188b106c8de2120588fb9c() {
  return __cxx_static_address_30188b106c8de2120588fb9c.reference || (__cxx_static_address_30188b106c8de2120588fb9c.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING3____header_global_4db50baec0f3e306; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:762
export const CANWITHSOMETHING4____header_global_3ba2021468afe59f = ((((((4582) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bbc3870e17fb67388d660421() {
  return __cxx_static_address_bbc3870e17fb67388d660421.reference || (__cxx_static_address_bbc3870e17fb67388d660421.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING4____header_global_3ba2021468afe59f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:763
export const DOLPHIN1____header_global_dc8796385206f088 = ((((((4591) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_db27ab9130c3dd997800b691() {
  return __cxx_static_address_db27ab9130c3dd997800b691.reference || (__cxx_static_address_db27ab9130c3dd997800b691.reference = {
    __cReference: true,
    get value() { return DOLPHIN1____header_global_dc8796385206f088; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:764
export const DOLPHIN2____header_global_e7b0716ea5840e5a = ((((((4592) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_feea9558b0704dc6fc884a35() {
  return __cxx_static_address_feea9558b0704dc6fc884a35.reference || (__cxx_static_address_feea9558b0704dc6fc884a35.reference = {
    __cReference: true,
    get value() { return DOLPHIN2____header_global_e7b0716ea5840e5a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:765
export const NEWBEAST____header_global_2e2667092237d8f1 = ((((((4610) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9bbd314ea5c5c2da4dbcfd3f() {
  return __cxx_static_address_9bbd314ea5c5c2da4dbcfd3f.reference || (__cxx_static_address_9bbd314ea5c5c2da4dbcfd3f.reference = {
    __cReference: true,
    get value() { return NEWBEAST____header_global_2e2667092237d8f1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:766
export const NEWBEASTSTAYPUT____header_global_4297e8b92748ae0a = ((((((4611) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_48048953ea59a37a710f1cd7() {
  return __cxx_static_address_48048953ea59a37a710f1cd7.reference || (__cxx_static_address_48048953ea59a37a710f1cd7.reference = {
    __cReference: true,
    get value() { return NEWBEASTSTAYPUT____header_global_4297e8b92748ae0a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:767
export const BOSS4____header_global_af9535c7618f38db = ((((((4740) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ce6c60cebe0be4edadcf239a() {
  return __cxx_static_address_ce6c60cebe0be4edadcf239a.reference || (__cxx_static_address_ce6c60cebe0be4edadcf239a.reference = {
    __cReference: true,
    get value() { return BOSS4____header_global_af9535c7618f38db; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:768
export const BOSS4STAYPUT____header_global_68903b9f8472ebc5 = ((((((4741) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_749a290c86de06d2045b4936() {
  return __cxx_static_address_749a290c86de06d2045b4936.reference || (__cxx_static_address_749a290c86de06d2045b4936.reference = {
    __cReference: true,
    get value() { return BOSS4STAYPUT____header_global_68903b9f8472ebc5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:769
export const FEM10____header_global_5e47626a3d4b51c6 = ((((((4864) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_64cf61018b418bdafa056fe1() {
  return __cxx_static_address_64cf61018b418bdafa056fe1.reference || (__cxx_static_address_64cf61018b418bdafa056fe1.reference = {
    __cReference: true,
    get value() { return FEM10____header_global_5e47626a3d4b51c6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:770
export const TOUGHGAL____header_global_5a2607b08d7e87fa = ((((((4866) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_312a8ce63eb13a7970d6eda0() {
  return __cxx_static_address_312a8ce63eb13a7970d6eda0.reference || (__cxx_static_address_312a8ce63eb13a7970d6eda0.reference = {
    __cReference: true,
    get value() { return TOUGHGAL____header_global_5a2607b08d7e87fa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:771
export const MAN____header_global_e7da0d5fa3ddb636 = ((((((4871) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_843f34e8a137b7049a681f03() {
  return __cxx_static_address_843f34e8a137b7049a681f03.reference || (__cxx_static_address_843f34e8a137b7049a681f03.reference = {
    __cReference: true,
    get value() { return MAN____header_global_e7da0d5fa3ddb636; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:772
export const MAN2____header_global_c5cda5020569aa0e = ((((((4872) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e471f4a8e5e75e0c1d4a8ada() {
  return __cxx_static_address_e471f4a8e5e75e0c1d4a8ada.reference || (__cxx_static_address_e471f4a8e5e75e0c1d4a8ada.reference = {
    __cReference: true,
    get value() { return MAN2____header_global_c5cda5020569aa0e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:773
export const WOMAN____header_global_f8f0463023b4f843 = ((((((4874) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_22e5fb73e316a7fc1f74be36() {
  return __cxx_static_address_22e5fb73e316a7fc1f74be36.reference || (__cxx_static_address_22e5fb73e316a7fc1f74be36.reference = {
    __cReference: true,
    get value() { return WOMAN____header_global_f8f0463023b4f843; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:774
export const NATURALLIGHTNING____header_global_c7fe58098dc28980 = ((((((4890) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e5d6c666370af62da6bfc718() {
  return __cxx_static_address_e5d6c666370af62da6bfc718.reference || (__cxx_static_address_e5d6c666370af62da6bfc718.reference = {
    __cReference: true,
    get value() { return NATURALLIGHTNING____header_global_c7fe58098dc28980; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:775
export const WEATHERWARN____header_global_fd91e0964521a0d0 = ((((((4893) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_330c0956fd7cc8cad332a725() {
  return __cxx_static_address_330c0956fd7cc8cad332a725.reference || (__cxx_static_address_330c0956fd7cc8cad332a725.reference = {
    __cReference: true,
    get value() { return WEATHERWARN____header_global_fd91e0964521a0d0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:776
export const DUKETAG____header_global_033299630b180f30 = ((((((4900) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c4c577e6268ab055c85d1979() {
  return __cxx_static_address_c4c577e6268ab055c85d1979.reference || (__cxx_static_address_c4c577e6268ab055c85d1979.reference = {
    __cReference: true,
    get value() { return DUKETAG____header_global_033299630b180f30; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:777
export const SIGN1____header_global_5023fdc58c5691af = ((((((4909) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_be03a88c6ae633e4ab0ef82d() {
  return __cxx_static_address_be03a88c6ae633e4ab0ef82d.reference || (__cxx_static_address_be03a88c6ae633e4ab0ef82d.reference = {
    __cReference: true,
    get value() { return SIGN1____header_global_5023fdc58c5691af; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:778
export const SIGN2____header_global_29f66341660da0a9 = ((((((4912) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aa8aec46f5449898ae7b1dc6() {
  return __cxx_static_address_aa8aec46f5449898ae7b1dc6.reference || (__cxx_static_address_aa8aec46f5449898ae7b1dc6.reference = {
    __cReference: true,
    get value() { return SIGN2____header_global_29f66341660da0a9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:779
export const JURYGUY____header_global_6e37ff06a9b0a568 = ((((((4943) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fabe4e5080671d60e027c295() {
  return __cxx_static_address_fabe4e5080671d60e027c295.reference || (__cxx_static_address_fabe4e5080671d60e027c295.reference = {
    __cReference: true,
    get value() { return JURYGUY____header_global_6e37ff06a9b0a568; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:780
export const WIDESCREENSTATUSBAR____header_global_96fa430419c10c70 = ((((((5120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a3aa21b306b3b3df8650672d() {
  return __cxx_static_address_a3aa21b306b3b3df8650672d.reference || (__cxx_static_address_a3aa21b306b3b3df8650672d.reference = {
    __cReference: true,
    get value() { return WIDESCREENSTATUSBAR____header_global_96fa430419c10c70; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:781
export const RPGGUNWIDE____header_global_34c0c0da6d7a99d7 = ((((((5121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fe6e6f3f9c5212a63cce6ffa() {
  return __cxx_static_address_fe6e6f3f9c5212a63cce6ffa.reference || (__cxx_static_address_fe6e6f3f9c5212a63cce6ffa.reference = {
    __cReference: true,
    get value() { return RPGGUNWIDE____header_global_34c0c0da6d7a99d7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:782
export const FIRSTGUNRELOADWIDE____header_global_a0a8c879062602dc = ((((((5122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_af798b2ea043c32cf51eb4ac() {
  return __cxx_static_address_af798b2ea043c32cf51eb4ac.reference || (__cxx_static_address_af798b2ea043c32cf51eb4ac.reference = {
    __cReference: true,
    get value() { return FIRSTGUNRELOADWIDE____header_global_a0a8c879062602dc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:783
export const FREEZEWIDE____header_global_883d18ba944d289f = ((((((5123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_76c475041e1f7c9b72a4c201() {
  return __cxx_static_address_76c475041e1f7c9b72a4c201.reference || (__cxx_static_address_76c475041e1f7c9b72a4c201.reference = {
    __cReference: true,
    get value() { return FREEZEWIDE____header_global_883d18ba944d289f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:784
export const FREEZEFIREWIDE____header_global_4f47214b3788ef56 = ((((((5124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fe38ef1ae440e499b4cc0877() {
  return __cxx_static_address_fe38ef1ae440e499b4cc0877.reference || (__cxx_static_address_fe38ef1ae440e499b4cc0877.reference = {
    __cReference: true,
    get value() { return FREEZEFIREWIDE____header_global_4f47214b3788ef56; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:785
export const SHRINKERWIDE____header_global_1e7f6a687d8bcdcf = ((((((5127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4e6f7185ff6c76a9f9052b14() {
  return __cxx_static_address_4e6f7185ff6c76a9f9052b14.reference || (__cxx_static_address_4e6f7185ff6c76a9f9052b14.reference = {
    __cReference: true,
    get value() { return SHRINKERWIDE____header_global_1e7f6a687d8bcdcf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:786
export const CRACKKNUCKLESWIDE____header_global_885e3cb9f02e9c2c = ((((((5129) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_73a80f5115ea035edecdbc86() {
  return __cxx_static_address_73a80f5115ea035edecdbc86.reference || (__cxx_static_address_73a80f5115ea035edecdbc86.reference = {
    __cReference: true,
    get value() { return CRACKKNUCKLESWIDE____header_global_885e3cb9f02e9c2c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:787
export const FLAMETHROWERSPRITE____header_global_ed3187270e859610 = ((((((5134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8d6712bb0bf649bf0d20e3bc() {
  return __cxx_static_address_8d6712bb0bf649bf0d20e3bc.reference || (__cxx_static_address_8d6712bb0bf649bf0d20e3bc.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERSPRITE____header_global_ed3187270e859610; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:788
export const FLAMETHROWERAMMO____header_global_f71b92a36bb2bc24 = ((((((5135) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_74dc380d4177fd9acca91e0c() {
  return __cxx_static_address_74dc380d4177fd9acca91e0c.reference || (__cxx_static_address_74dc380d4177fd9acca91e0c.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERAMMO____header_global_f71b92a36bb2bc24; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:789
export const FLAMETHROWER____header_global_cf4209893ca5a739 = ((((((5138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dc789be15ce542d02778af34() {
  return __cxx_static_address_dc789be15ce542d02778af34.reference || (__cxx_static_address_dc789be15ce542d02778af34.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER____header_global_cf4209893ca5a739; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:790
export const FLAMETHROWERFIRE____header_global_019da4e34cb57447 = ((((((5139) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_94459f31d23d5838df9f2793() {
  return __cxx_static_address_94459f31d23d5838df9f2793.reference || (__cxx_static_address_94459f31d23d5838df9f2793.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERFIRE____header_global_019da4e34cb57447; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:791
export const FLAMETHROWERFLAME____header_global_b2768d8f2f96102b = ((((((1891) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_35fe2db4f4b37c573f650740() {
  return __cxx_static_address_35fe2db4f4b37c573f650740.reference || (__cxx_static_address_35fe2db4f4b37c573f650740.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERFLAME____header_global_b2768d8f2f96102b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:792
export const FLAMETHROWERPILOT____header_global_4f211676471c56a7 = ((((((5174) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_801ecbd6c68b0dff7976ba81() {
  return __cxx_static_address_801ecbd6c68b0dff7976ba81.reference || (__cxx_static_address_801ecbd6c68b0dff7976ba81.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERPILOT____header_global_4f211676471c56a7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:793
export const FIREBALL____header_global_5b6ee53401322113 = ((((((5163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_20915cc2d1bcd8bfd616cf56() {
  return __cxx_static_address_20915cc2d1bcd8bfd616cf56.reference || (__cxx_static_address_20915cc2d1bcd8bfd616cf56.reference = {
    __cReference: true,
    get value() { return FIREBALL____header_global_5b6ee53401322113; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:794
export const ONFIRE____header_global_91a2afd6582bcd38 = ((((((5152) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3aee6e68caf538133d5d1e2e() {
  return __cxx_static_address_3aee6e68caf538133d5d1e2e.reference || (__cxx_static_address_3aee6e68caf538133d5d1e2e.reference = {
    __cReference: true,
    get value() { return ONFIRE____header_global_91a2afd6582bcd38; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:795
export const ONFIRESMOKE____header_global_29767a72ff67fe46 = ((((((5143) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3b2a4f510ea42275abf7792a() {
  return __cxx_static_address_3b2a4f510ea42275abf7792a.reference || (__cxx_static_address_3b2a4f510ea42275abf7792a.reference = {
    __cReference: true,
    get value() { return ONFIRESMOKE____header_global_29767a72ff67fe46; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:796
export const BURNEDCORPSE____header_global_6a9acdefcf8d1675 = ((((((5173) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_68e9d5a4f845774f41b04864() {
  return __cxx_static_address_68e9d5a4f845774f41b04864.reference || (__cxx_static_address_68e9d5a4f845774f41b04864.reference = {
    __cReference: true,
    get value() { return BURNEDCORPSE____header_global_6a9acdefcf8d1675; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:797
export const WHISPYSMOKE____header_global_8ee4e3f40e61ca8f = ((((((5268) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b944b47cc881b47c4ff342f0() {
  return __cxx_static_address_b944b47cc881b47c4ff342f0.reference || (__cxx_static_address_b944b47cc881b47c4ff342f0.reference = {
    __cReference: true,
    get value() { return WHISPYSMOKE____header_global_8ee4e3f40e61ca8f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:798
export const FIREFLY____header_global_95453f8cf54315a5 = ((((((5180) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_293e59a1f1c8a6a0321453f8() {
  return __cxx_static_address_293e59a1f1c8a6a0321453f8.reference || (__cxx_static_address_293e59a1f1c8a6a0321453f8.reference = {
    __cReference: true,
    get value() { return FIREFLY____header_global_95453f8cf54315a5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:799
export const FIREFLYSHRINKEFFECT____header_global_2930eab19a975eb5 = ((((((5360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c56a447c86450a66df0d111d() {
  return __cxx_static_address_c56a447c86450a66df0d111d.reference || (__cxx_static_address_c56a447c86450a66df0d111d.reference = {
    __cReference: true,
    get value() { return FIREFLYSHRINKEFFECT____header_global_2930eab19a975eb5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:800
export const FIREFLYGROWEFFECT____header_global_60f3dd3e5ef47822 = ((((((5367) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6b12e12ffe3718b254c9b879() {
  return __cxx_static_address_6b12e12ffe3718b254c9b879.reference || (__cxx_static_address_6b12e12ffe3718b254c9b879.reference = {
    __cReference: true,
    get value() { return FIREFLYGROWEFFECT____header_global_60f3dd3e5ef47822; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:801
export const FIREFLYFLYINGEFFECT____header_global_306d914a7600af40 = ((((((5296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8f8f98dc8d50ea72119db4ac() {
  return __cxx_static_address_8f8f98dc8d50ea72119db4ac.reference || (__cxx_static_address_8f8f98dc8d50ea72119db4ac.reference = {
    __cReference: true,
    get value() { return FIREFLYFLYINGEFFECT____header_global_306d914a7600af40; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:802
export const BOSS5____header_global_28320b34fba6376a = ((((((5310) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_de04b16edfdf5a95013ba552() {
  return __cxx_static_address_de04b16edfdf5a95013ba552.reference || (__cxx_static_address_de04b16edfdf5a95013ba552.reference = {
    __cReference: true,
    get value() { return BOSS5____header_global_28320b34fba6376a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:803
export const BOSS5STAYPUT____header_global_118ca1f75570377b = ((((((5311) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_21f77f1bd90ae46edc468ba2() {
  return __cxx_static_address_21f77f1bd90ae46edc468ba2.reference || (__cxx_static_address_21f77f1bd90ae46edc468ba2.reference = {
    __cReference: true,
    get value() { return BOSS5STAYPUT____header_global_118ca1f75570377b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:804
export const LAVAPOOL____header_global_39cae5e0a913df8c = ((((((5304) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d97330a5886bc86b5b077429() {
  return __cxx_static_address_d97330a5886bc86b5b077429.reference || (__cxx_static_address_d97330a5886bc86b5b077429.reference = {
    __cReference: true,
    get value() { return LAVAPOOL____header_global_39cae5e0a913df8c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:805
export const LAVASPLASH____header_global_bd3f1ea70608be7e = ((((((5371) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4fe0e45f2905de9874c0ebbb() {
  return __cxx_static_address_4fe0e45f2905de9874c0ebbb.reference || (__cxx_static_address_4fe0e45f2905de9874c0ebbb.reference = {
    __cReference: true,
    get value() { return LAVASPLASH____header_global_bd3f1ea70608be7e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:806
export const LAVAPOOLBUBBLE____header_global_900aacf2f387c178 = ((((((5207) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8783e41473c0aa04f70c5824() {
  return __cxx_static_address_8783e41473c0aa04f70c5824.reference || (__cxx_static_address_8783e41473c0aa04f70c5824.reference = {
    __cReference: true,
    get value() { return LAVAPOOLBUBBLE____header_global_900aacf2f387c178; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:807
export const BOSS2STAYPUT____header_global_d4a87dd13f6606b1 = ((((((2711) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_463940f8a75bc74be8f6fda6() {
  return __cxx_static_address_463940f8a75bc74be8f6fda6.reference || (__cxx_static_address_463940f8a75bc74be8f6fda6.reference = {
    __cReference: true,
    get value() { return BOSS2STAYPUT____header_global_d4a87dd13f6606b1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:808
export const BOSS3STAYPUT____header_global_b706788fbc8b5e7f = ((((((2761) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1a035a37860196c829f959a3() {
  return __cxx_static_address_1a035a37860196c829f959a3.reference || (__cxx_static_address_1a035a37860196c829f959a3.reference = {
    __cReference: true,
    get value() { return BOSS3STAYPUT____header_global_b706788fbc8b5e7f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:809
export const E32_TILE5736____header_global_a8c765d7af4236fd = ((((((5736) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_62c3e88ac115b21a631b2d95() {
  return __cxx_static_address_62c3e88ac115b21a631b2d95.reference || (__cxx_static_address_62c3e88ac115b21a631b2d95.reference = {
    __cReference: true,
    get value() { return E32_TILE5736____header_global_a8c765d7af4236fd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:810
export const E32_TILE5737____header_global_47bc233dc6edbbef = ((((((5737) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_31974897796dc972c3322ed6() {
  return __cxx_static_address_31974897796dc972c3322ed6.reference || (__cxx_static_address_31974897796dc972c3322ed6.reference = {
    __cReference: true,
    get value() { return E32_TILE5737____header_global_47bc233dc6edbbef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:811
export const E32_TILE5846____header_global_980895b28cb789d1 = ((((((5846) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7ae2681b971443f6d0036119() {
  return __cxx_static_address_7ae2681b971443f6d0036119.reference || (__cxx_static_address_7ae2681b971443f6d0036119.reference = {
    __cReference: true,
    get value() { return E32_TILE5846____header_global_980895b28cb789d1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/network.h:180
export const cSnapshotMemUsage__header_global_145c454102c14132 = u64((BigInt(u64(64)) * BigInt((BigInt((BigInt((BigInt(72) * BigInt(u64(16384)))) + BigInt((BigInt(96) * BigInt(u64(4096)))))) + BigInt((BigInt(296) * BigInt(u64(16384))))))));
function __cxx_static_address_91d564abbe849b4a852ed73d() {
  return __cxx_static_address_91d564abbe849b4a852ed73d.reference || (__cxx_static_address_91d564abbe849b4a852ed73d.reference = {
    __cReference: true,
    get value() { return cSnapshotMemUsage__header_global_145c454102c14132; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/sounds.cpp:32
export let g_numEnvSoundsPlaying = 0;
export function __cxx_global_cell_a5668e8adb56e715b531de8f() {
  return __cxx_global_cell_a5668e8adb56e715b531de8f.reference || (__cxx_global_cell_a5668e8adb56e715b531de8f.reference = {
    __cReference: true,
    get value() { return g_numEnvSoundsPlaying; },
    set value(__cxx_lvalue_0) { g_numEnvSoundsPlaying = i32(__cxx_lvalue_0); }
  });
}

export let g_highestSoundIdx = 0;
export function __cxx_global_cell_ee31083067930f45ce0bf187() {
  return __cxx_global_cell_ee31083067930f45ce0bf187.reference || (__cxx_global_cell_ee31083067930f45ce0bf187.reference = {
    __cReference: true,
    get value() { return g_highestSoundIdx; },
    set value(__cxx_lvalue_0) { g_highestSoundIdx = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/sounds.cpp:33
export let g_dukeTalk = false;
function __cxx_static_address_882d2c4ab236fb5389d0a4a5() {
  return __cxx_static_address_882d2c4ab236fb5389d0a4a5.reference || (__cxx_static_address_882d2c4ab236fb5389d0a4a5.reference = {
    __cReference: true,
    get value() { return g_dukeTalk; },
    set value(__cxx_lvalue_0) { g_dukeTalk = Boolean(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/sounds.cpp:35
export let MusicPtr = null;
function __cxx_static_address_b1f69b702c50879b9c3af9df() {
  return __cxx_static_address_b1f69b702c50879b9c3af9df.reference || (__cxx_static_address_b1f69b702c50879b9c3af9df.reference = {
    __cReference: true,
    get value() { return MusicPtr; },
    set value(__cxx_lvalue_0) { MusicPtr = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/duke3d/src/sounds.cpp:37
export let MusicIsWaveform = 0;
export function __cxx_global_cell_44be064060a8a40e7259c19a() {
  return __cxx_global_cell_44be064060a8a40e7259c19a.reference || (__cxx_global_cell_44be064060a8a40e7259c19a.reference = {
    __cReference: true,
    get value() { return MusicIsWaveform; },
    set value(__cxx_lvalue_0) { MusicIsWaveform = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/sounds.cpp:38
export let MusicVoice = i32((-1));
export function __cxx_global_cell_da3698bd300144e1b4de781f() {
  return __cxx_global_cell_da3698bd300144e1b4de781f.reference || (__cxx_global_cell_da3698bd300144e1b4de781f.reference = {
    __cReference: true,
    get value() { return MusicVoice; },
    set value(__cxx_lvalue_0) { MusicVoice = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/sounds.cpp:40
export let MusicPaused = false;
function __cxx_static_address_f72e08e043134e44eb5aa0c7() {
  return __cxx_static_address_f72e08e043134e44eb5aa0c7.reference || (__cxx_static_address_f72e08e043134e44eb5aa0c7.reference = {
    __cReference: true,
    get value() { return MusicPaused; },
    set value(__cxx_lvalue_0) { MusicPaused = Boolean(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/sounds.cpp:41
export let SoundPaused = false;
function __cxx_static_address_64d9379db73c350f02b4f680() {
  return __cxx_static_address_64d9379db73c350f02b4f680.reference || (__cxx_static_address_64d9379db73c350f02b4f680.reference = {
    __cReference: true,
    get value() { return SoundPaused; },
    set value(__cxx_lvalue_0) { SoundPaused = Boolean(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_656867385a9bca07 = i32(2147483647);
function __cxx_static_address_32d27b9700cf76219a738564() {
  return __cxx_static_address_32d27b9700cf76219a738564.reference || (__cxx_static_address_32d27b9700cf76219a738564.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_656867385a9bca07; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_2ba8219b07deebb7 = i32(2147483648);
function __cxx_static_address_720460641a4b4a88c5f497e8() {
  return __cxx_static_address_720460641a4b4a88c5f497e8.reference || (__cxx_static_address_720460641a4b4a88c5f497e8.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_2ba8219b07deebb7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_e51067629d39f706 = i32(2147483648);
function __cxx_static_address_db0729f0049829434f6926ec() {
  return __cxx_static_address_db0729f0049829434f6926ec.reference || (__cxx_static_address_db0729f0049829434f6926ec.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_e51067629d39f706; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_72c0af76fbeb42a9 = i32(65536);
function __cxx_static_address_bcc86bc19f033e8645673d0b() {
  return __cxx_static_address_bcc86bc19f033e8645673d0b.reference || (__cxx_static_address_bcc86bc19f033e8645673d0b.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_72c0af76fbeb42a9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_a6743a8c57663f87 = i32(32768);
function __cxx_static_address_1d5404fd77eb8d7d4155e8b1() {
  return __cxx_static_address_1d5404fd77eb8d7d4155e8b1.reference || (__cxx_static_address_1d5404fd77eb8d7d4155e8b1.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_a6743a8c57663f87; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_8fe34ec50a118a36 = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_3221d0e92d15a9540f2ba7eb() {
  return __cxx_static_address_3221d0e92d15a9540f2ba7eb.reference || (__cxx_static_address_3221d0e92d15a9540f2ba7eb.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_8fe34ec50a118a36; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/sounds.cpp:43
export let localQueueIndex = 0;
function __cxx_static_address_fa690700816e83dd84b78dc6() {
  return __cxx_static_address_fa690700816e83dd84b78dc6.reference || (__cxx_static_address_fa690700816e83dd84b78dc6.reference = {
    __cReference: true,
    get value() { return localQueueIndex; },
    set value(__cxx_lvalue_0) { localQueueIndex = u32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/sounds.cpp:44
export let freeSlotQueue = new Uint32Array(128);
function __cxx_static_address_b444be3849d00ab4eeb864c2() {
  return __cxx_static_address_b444be3849d00ab4eeb864c2.reference || (__cxx_static_address_b444be3849d00ab4eeb864c2.reference = {
    __cReference: true,
    get value() { return freeSlotQueue; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/sounds.cpp:50
export let g_sounds = null;
export function __cxx_global_cell_967815c905458390bb332151() {
  return __cxx_global_cell_967815c905458390bb332151.reference || (__cxx_global_cell_967815c905458390bb332151.reference = {
    __cReference: true,
    get value() { return g_sounds; },
    set value(__cxx_lvalue_0) { g_sounds = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/duke3d/src/sounds.cpp:51
export let nullsound = cZeroAggregate({"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"distOffset": {"native": "Int16Array", "offset": 36, "size": 2}, "filename": {"offset": 16, "pointer": true, "size": 8}, "flags": {"native": "Uint8Array", "offset": 39, "size": 1}, "len": {"native": "Int32Array", "offset": 24, "size": 4}, "lock": {"native": "Uint8Array", "offset": 41, "size": 1}, "maxpitch": {"native": "Int16Array", "offset": 34, "size": 2}, "minpitch": {"native": "Int16Array", "offset": 32, "size": 2}, "playing": {"native": "Uint8Array", "offset": 38, "size": 1}, "priority": {"native": "Uint8Array", "offset": 40, "size": 1}, "ptr": {"offset": 8, "pointer": true, "size": 8}, "voices": {"offset": 0, "pointer": true, "size": 8}, "volume": {"native": "Int32Array", "offset": 28, "size": 4}}, "overlaps": false, "size": 48, "union": false}}, {});
export function __cxx_global_cell_f513886a13ac5b6ce90c04ec() {
  return __cxx_global_cell_f513886a13ac5b6ce90c04ec.reference || (__cxx_global_cell_f513886a13ac5b6ce90c04ec.reference = {
    __cReference: true,
    get value() { return nullsound; },
    set value(__cxx_lvalue_0) { throw new TypeError("record address cannot replace original object storage"); }
  });
}

// C/C++ source: source/duke3d/src/sounds.cpp:52
export let nullvoice = cInitByteRecord({"align": 2, "arrayAlign": 1, "fields": {"dist": {"native": "Uint16Array", "offset": 4, "size": 2}, "handle": {"native": "Int16Array", "offset": 2, "size": 2}, "owner": {"native": "Int16Array", "offset": 0, "size": 2}}, "overlaps": false, "size": 6, "union": false}, {"owner": ((((-1)) << 16) >> 16), "handle": (((0) << 16) >> 16), "dist": ((65535) & 65535)}, null, {});
export function __cxx_global_cell_f54c3830d6284aa0bf063bdd() {
  return __cxx_global_cell_f54c3830d6284aa0bf063bdd.reference || (__cxx_global_cell_f54c3830d6284aa0bf063bdd.reference = {
    __cReference: true,
    get value() { return nullvoice; },
    set value(__cxx_lvalue_0) { throw new TypeError("record address cannot replace original object storage"); }
  });
}

// C/C++ source: source/duke3d/src/sounds.cpp:73
export function S_FillVoiceInfo(snd, owner, voice, dist) {
  cAssignAggregate(cRecordObject(snd), cInitByteRecord({"align": 2, "arrayAlign": 1, "fields": {"dist": {"native": "Uint16Array", "offset": 4, "size": 2}, "handle": {"native": "Int16Array", "offset": 2, "size": 2}, "owner": {"native": "Int16Array", "offset": 0, "size": 2}}, "overlaps": false, "size": 6, "union": false}, {"owner": owner, "handle": voice, "dist": dist}, null, {}), {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"dist": {"native": "Uint16Array", "offset": 4, "size": 2}, "handle": {"native": "Int16Array", "offset": 2, "size": 2}, "owner": {"native": "Int16Array", "offset": 0, "size": 2}}, "overlaps": false, "size": 6, "union": false}});
}

// C/C++ source: source/duke3d/src/sounds.cpp:1209
export function A_CheckSoundPlaying(spriteNum, soundNum) {
  if ((u32(soundNum) > u32(g_highestSoundIdx))) {
    return i32(0);
  }
  const snd = cPointerElementRef(g_sounds, soundNum);
  if ((Boolean(cRecordObject(snd.value).playing) && (spriteNum >= 0))) {
    for (let j = i32(0); (j < 8); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return next; })(cRef(() => j, __cxx_lvalue_1 => { j = __cxx_lvalue_1; }))) {
      if ((bitmap_test__header_7e42bf2bb10a(cObjectFieldRef(cRecordObject(snd.value), "playing"), j) && (i32((cPointerElementRef(cRecordObject(snd.value).voices, j).value).owner) == spriteNum))) {
        return i32(1);
      }
    }
  }
  return i32(((spriteNum == (-1)) ? i32((i32(cRecordObject(snd.value).playing) != 0)) : 0));
}

// C/C++ source: source/duke3d/src/sounds.cpp:1226
export function A_CheckAnySoundPlaying(spriteNum) {
  let msp = i32(g_highestSoundIdx);
  for (let i = i32(0); (i <= msp); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return next; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
    const snd = cPointerElementRef(g_sounds, i);
    if (Boolean(i32((i32(cPointerCompare(snd.value, __cxx_global_cell_f513886a13ac5b6ce90c04ec(), "==")) | i32((i32(cRecordObject(snd.value).playing) == 0)))))) {
      continue;
    }
    for (let j = i32(0); (j < 8); ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return next; })(cRef(() => j, __cxx_lvalue_3 => { j = __cxx_lvalue_3; }))) {
      if ((bitmap_test__header_7e42bf2bb10a(cObjectFieldRef(cRecordObject(snd.value), "playing"), j) && (i32((cPointerElementRef(cRecordObject(snd.value).voices, j).value).owner) == spriteNum))) {
        return i32(1);
      }
    }
  }
  return i32(0);
}

// C/C++ source: source/duke3d/src/sounds.cpp:1245
export function S_CheckSoundPlaying(soundNum) {
  if ((u32(soundNum) > u32(g_highestSoundIdx))) {
    return i32(false);
  }
  return i32((i32(cRecordObject((cPointerElementRef(g_sounds, soundNum).value)).playing) != 0));
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_3413e2ea088e597f = new Uint8Array([((1) & 255), ((2) & 255), ((4) & 255), ((8) & 255), ((16) & 255), ((32) & 255), ((64) & 255), ((128) & 255)]);
function __cxx_static_address_fd8e939698c1a3dfa47b3ebc() {
  return __cxx_static_address_fd8e939698c1a3dfa47b3ebc.reference || (__cxx_static_address_fd8e939698c1a3dfa47b3ebc.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_3413e2ea088e597f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:172
export const g_defaultVideoModes__header_global_d22c8a60db510703 = cByteRecordNDArray({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, [25], {}, [cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 2560, "y": 1440}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 2560, "y": 1200}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 2560, "y": 1080}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1920, "y": 1440}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1920, "y": 1200}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1920, "y": 1080}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1680, "y": 1050}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1600, "y": 1200}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1600, "y": 900}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1366, "y": 768}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1280, "y": 1024}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1280, "y": 960}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1280, "y": 720}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1152, "y": 864}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1024, "y": 768}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1024, "y": 600}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 800, "y": 600}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 640, "y": 480}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 640, "y": 400}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 512, "y": 384}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 480, "y": 360}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 400, "y": 300}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 320, "y": 240}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 320, "y": 200}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 0, "y": 0}, null, {})]);
function __cxx_static_address_8d4c3a9056a0ef046e9ba42a() {
  return __cxx_static_address_8d4c3a9056a0ef046e9ba42a.reference || (__cxx_static_address_8d4c3a9056a0ef046e9ba42a.reference = {
    __cReference: true,
    get value() { return g_defaultVideoModes__header_global_d22c8a60db510703; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:188
export const g_keyAsciiTable__header_global_d0e6c243fdd365b0 = new Uint8Array([((0) & 255), ((0) & 255), 49, 50, 51, 52, 53, 54, 55, 56, 57, 48, 45, 61, ((0) & 255), ((0) & 255), 113, 119, 101, 114, 116, 121, 117, 105, 111, 112, 91, 93, ((0) & 255), ((0) & 255), 97, 115, 100, 102, 103, 104, 106, 107, 108, 59, ((39) & 255), 96, ((0) & 255), ((92) & 255), 122, 120, 99, 118, 98, 110, 109, 44, 46, 47, ((0) & 255), 42, ((0) & 255), ((32) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255)]);
function __cxx_static_address_6f4baffce191a3501647f96a() {
  return __cxx_static_address_6f4baffce191a3501647f96a.reference || (__cxx_static_address_6f4baffce191a3501647f96a.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTable__header_global_d0e6c243fdd365b0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:196
export const g_keyAsciiTableShift__header_global_50d917afb76a5101 = new Uint8Array([((0) & 255), ((0) & 255), 33, 64, 35, 36, 37, 94, 38, 42, 40, 41, 95, 43, ((0) & 255), ((0) & 255), 81, 87, 69, 82, 84, 89, 85, 73, 79, 80, 123, 125, ((0) & 255), ((0) & 255), 65, 83, 68, 70, 71, 72, 74, 75, 76, 58, 34, 126, ((0) & 255), 124, 90, 88, 67, 86, 66, 78, 77, 60, 62, 63, ((0) & 255), 42, ((0) & 255), ((32) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255)]);
function __cxx_static_address_cbc017b75320d98a71ab330e() {
  return __cxx_static_address_cbc017b75320d98a71ab330e.reference || (__cxx_static_address_cbc017b75320d98a71ab330e.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTableShift__header_global_50d917afb76a5101; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:895
export const pow2long__header_global_efc9f6ed93071b9d = new Int32Array([1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576, 2097152, 4194304, 8388608, 16777216, 33554432, 67108864, 134217728, 268435456, 536870912, 1073741824, 2147483647]);
function __cxx_static_address_0b135bbd35fbe826494265eb() {
  return __cxx_static_address_0b135bbd35fbe826494265eb.reference || (__cxx_static_address_0b135bbd35fbe826494265eb.reference = {
    __cReference: true,
    get value() { return pow2long__header_global_efc9f6ed93071b9d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:907
export const pow2ulong__header_global_92548c38a2bf9671 = new Uint32Array([u32(1), u32(2), u32(4), u32(8), u32(16), u32(32), u32(64), u32(128), u32(256), u32(512), u32(1024), u32(2048), u32(4096), u32(8192), u32(16384), u32(32768), u32(65536), u32(131072), u32(262144), u32(524288), u32(1048576), u32(2097152), u32(4194304), u32(8388608), u32(16777216), u32(33554432), u32(67108864), u32(134217728), u32(268435456), u32(536870912), u32(1073741824), u32(2147483648n)]);
function __cxx_static_address_75e41beda116e464c02deaae() {
  return __cxx_static_address_75e41beda116e464c02deaae.reference || (__cxx_static_address_75e41beda116e464c02deaae.reference = {
    __cReference: true,
    get value() { return pow2ulong__header_global_92548c38a2bf9671; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:919
export const pow264__header_global_3aaa8dcc8ff3b2e2 = new BigInt64Array([BigInt(i64(1)), BigInt(i64(2)), BigInt(i64(4)), BigInt(i64(8)), BigInt(i64(16)), BigInt(i64(32)), BigInt(i64(64)), BigInt(i64(128)), BigInt(i64(256)), BigInt(i64(512)), BigInt(i64(1024)), BigInt(i64(2048)), BigInt(i64(4096)), BigInt(i64(8192)), BigInt(i64(16384)), BigInt(i64(32768)), BigInt(i64(65536)), BigInt(i64(131072)), BigInt(i64(262144)), BigInt(i64(524288)), BigInt(i64(1048576)), BigInt(i64(2097152)), BigInt(i64(4194304)), BigInt(i64(8388608)), BigInt(i64(16777216)), BigInt(i64(33554432)), BigInt(i64(67108864)), BigInt(i64(134217728)), BigInt(i64(268435456)), BigInt(i64(536870912)), BigInt(i64(1073741824)), BigInt(2147483648n), BigInt(4294967296n), BigInt(8589934592n), BigInt(17179869184n), BigInt(34359738368n), BigInt(68719476736n), BigInt(137438953472n), BigInt(274877906944n), BigInt(549755813888n), BigInt(1099511627776n), BigInt(2199023255552n), BigInt(4398046511104n), BigInt(8796093022208n), BigInt(17592186044416n), BigInt(35184372088832n), BigInt(70368744177664n), BigInt(140737488355328n), BigInt(281474976710656n), BigInt(562949953421312n), BigInt(1125899906842624n), BigInt(2251799813685248n), BigInt(4503599627370496n), BigInt(9007199254740992n), BigInt(18014398509481984n), BigInt(36028797018963968n), BigInt(72057594037927936n), BigInt(144115188075855872n), BigInt(288230376151711744n), BigInt(576460752303423488n), BigInt(1152921504606846976n), BigInt(2305843009213693952n), BigInt(4611686018427387904n), BigInt(9223372036854775807n)]);
function __cxx_static_address_7b16cf956daec2a2faaa5e89() {
  return __cxx_static_address_7b16cf956daec2a2faaa5e89.reference || (__cxx_static_address_7b16cf956daec2a2faaa5e89.reference = {
    __cReference: true,
    get value() { return pow264__header_global_3aaa8dcc8ff3b2e2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/mact/include/keyboard.h:47
export const sctokeylut__header_global_8c3db5d3eaf5d322 = cByteRecordNDArray({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, [102], {}, [cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([69, 115, 99, 97, 112, 101, 0]), "sc": ((1) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([49, 0]), "sc": ((2) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([50, 0]), "sc": ((3) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([51, 0]), "sc": ((4) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([52, 0]), "sc": ((5) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([53, 0]), "sc": ((6) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([54, 0]), "sc": ((7) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([55, 0]), "sc": ((8) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([56, 0]), "sc": ((9) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([57, 0]), "sc": ((10) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([48, 0]), "sc": ((11) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([45, 0]), "sc": ((12) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([61, 0]), "sc": ((13) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([66, 97, 107, 83, 112, 99, 0]), "sc": ((14) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([84, 97, 98, 0]), "sc": ((15) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([81, 0]), "sc": ((16) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([87, 0]), "sc": ((17) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([69, 0]), "sc": ((18) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([82, 0]), "sc": ((19) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([84, 0]), "sc": ((20) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([89, 0]), "sc": ((21) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([85, 0]), "sc": ((22) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([73, 0]), "sc": ((23) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([79, 0]), "sc": ((24) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([80, 0]), "sc": ((25) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([91, 0]), "sc": ((26) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([93, 0]), "sc": ((27) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([69, 110, 116, 101, 114, 0]), "sc": ((28) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([76, 67, 116, 114, 108, 0]), "sc": ((29) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([65, 0]), "sc": ((30) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([83, 0]), "sc": ((31) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([68, 0]), "sc": ((32) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 0]), "sc": ((33) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([71, 0]), "sc": ((34) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([72, 0]), "sc": ((35) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([74, 0]), "sc": ((36) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 0]), "sc": ((37) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([76, 0]), "sc": ((38) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([59, 0]), "sc": ((39) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([39, 0]), "sc": ((40) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([96, 0]), "sc": ((41) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([76, 83, 104, 105, 102, 116, 0]), "sc": ((42) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([66, 97, 99, 107, 115, 108, 97, 115, 104, 0]), "sc": ((43) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([90, 0]), "sc": ((44) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([88, 0]), "sc": ((45) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([67, 0]), "sc": ((46) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([86, 0]), "sc": ((47) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([66, 0]), "sc": ((48) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([78, 0]), "sc": ((49) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([77, 0]), "sc": ((50) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([44, 0]), "sc": ((51) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([46, 0]), "sc": ((52) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([47, 0]), "sc": ((53) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([82, 83, 104, 105, 102, 116, 0]), "sc": ((54) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 42, 0]), "sc": ((55) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([76, 65, 108, 116, 0]), "sc": ((56) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([83, 112, 97, 99, 101, 0]), "sc": ((57) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([67, 97, 112, 76, 99, 107, 0]), "sc": ((58) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 49, 0]), "sc": ((59) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 50, 0]), "sc": ((60) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 51, 0]), "sc": ((61) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 52, 0]), "sc": ((62) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 53, 0]), "sc": ((63) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 54, 0]), "sc": ((64) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 55, 0]), "sc": ((65) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 56, 0]), "sc": ((66) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 57, 0]), "sc": ((67) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 49, 48, 0]), "sc": ((68) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([78, 117, 109, 76, 99, 107, 0]), "sc": ((69) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([83, 99, 114, 76, 99, 107, 0]), "sc": ((70) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 55, 0]), "sc": ((71) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 56, 0]), "sc": ((72) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 57, 0]), "sc": ((73) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 45, 0]), "sc": ((74) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 52, 0]), "sc": ((75) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 53, 0]), "sc": ((76) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 54, 0]), "sc": ((77) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 43, 0]), "sc": ((78) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 49, 0]), "sc": ((79) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 50, 0]), "sc": ((80) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 51, 0]), "sc": ((81) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 48, 0]), "sc": ((82) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 46, 0]), "sc": ((83) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([76, 101, 115, 115, 84, 104, 97, 110, 0]), "sc": ((86) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 49, 49, 0]), "sc": ((87) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 49, 50, 0]), "sc": ((88) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 100, 69, 110, 116, 0]), "sc": ((156) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([82, 67, 116, 114, 108, 0]), "sc": ((157) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 47, 0]), "sc": ((181) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([82, 65, 108, 116, 0]), "sc": ((184) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([80, 114, 116, 83, 99, 110, 0]), "sc": ((183) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([80, 97, 117, 115, 101, 0]), "sc": ((197) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([72, 111, 109, 101, 0]), "sc": ((199) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([85, 112, 0]), "sc": ((200) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([80, 103, 85, 112, 0]), "sc": ((201) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([76, 101, 102, 116, 0]), "sc": ((203) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([82, 105, 103, 104, 116, 0]), "sc": ((205) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([69, 110, 100, 0]), "sc": ((207) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([68, 111, 119, 110, 0]), "sc": ((208) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([80, 103, 68, 110, 0]), "sc": ((209) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([73, 110, 115, 101, 114, 116, 0]), "sc": ((210) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([68, 101, 108, 101, 116, 101, 0]), "sc": ((211) & 255)}, null, {})]);
function __cxx_static_address_a3c7d7cc8803dbc985766e74() {
  return __cxx_static_address_a3c7d7cc8803dbc985766e74.reference || (__cxx_static_address_a3c7d7cc8803dbc985766e74.reference = {
    __cReference: true,
    get value() { return sctokeylut__header_global_8c3db5d3eaf5d322; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export function bitmap_test__header_7e42bf2bb10a(ptr, n) {

  return Boolean((i32((i32((cDeref(cPointerOffset(ptr, i32((n >> 3)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & i32((cDeref(cPointerOffset(pow2char__header_global_3413e2ea088e597f, i32((n & 7)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))) == i32((cDeref(cPointerOffset(pow2char__header_global_3413e2ea088e597f, i32((n & 7)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))));
}

export function ARRAY_SIZE__header_6d70a95c20fe(arg0) {
  return u64(17n);
}

export function SILENCE_UNUSED__header_e02c84b14583(arg0, arg1, arg2) {

}

export function bitmap_clear__header_a663e7aa9621(ptr, n) {

  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = (((__cxx_lvalue_0.value & (~i32((cDeref(cPointerOffset(pow2char__header_global_3413e2ea088e597f, i32((n & 7)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))))) & 255)))(cDeref(cPointerOffset(ptr, i32((n >> 3)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array));
}

export function SILENCE_UNUSED__header_f214a9b03101(arg0, arg1, arg2) {

}

export function clamp__header_2228649a9db1(__cxx_in, min, max) {
  return i32(((__cxx_in <= i32(min)) ? i32(min) : ((__cxx_in >= i32(max)) ? i32(max) : __cxx_in)));
}

// C/C++ source: @sysroot/usr/include/c++/12/bits/stl_algobase.h:230
export function min__template_16d592da45d1e47f(__a, __b) {
  if ((i32(__b.value) < i32(__a.value))) {
    return __b;
  }
  return __a;
}

export function bitmap_set__header_245bec6381fc(ptr, n) {

  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = (((__cxx_lvalue_0.value | i32((cDeref(cPointerOffset(pow2char__header_global_3413e2ea088e597f, i32((n & 7)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))) & 255)))(cDeref(cPointerOffset(ptr, i32((n >> 3)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array));
}

// C/C++ source: source/duke3d/src/sounds.cpp:78
export function S_SoundIsValid__header_cc80c7597e53(soundNum) {
  return Boolean(((((u32(soundNum) <= u32(g_highestSoundIdx)) && (cPointerElementRef(g_sounds, soundNum).value)) && cPointerCompare((cPointerElementRef(g_sounds, soundNum).value), __cxx_global_cell_f513886a13ac5b6ce90c04ec(), "!=")) && cRecordObject((cPointerElementRef(g_sounds, soundNum).value)).ptr));
}

// C/C++ source: source/duke3d/src/sounds.cpp:42
export function fix16_to_int__header_119ad9719714(a) {
  return i32(Math.trunc(i32((a + ((a >= 0) ? fix16_half__header_global_a6743a8c57663f87 : (-fix16_half__header_global_a6743a8c57663f87)))) / fix16_one__header_global_72c0af76fbeb42a9));
}

// C/C++ source: source/duke3d/src/sounds.cpp:47
export function fix16_from_float__header_acb14b92366b(a) {
  return i32(Math.fround((Math.fround((a * Math.fround(fix16_one__header_global_72c0af76fbeb42a9))) + ((a >= Math.fround(0)) ? Math.fround(0.5) : (-Math.fround(0.5))))));
}

// C/C++ source: source/duke3d/src/sounds.cpp:43
export function fix16_to_float__header_ea886195bea5(a) {
  return Math.fround(Math.fround((Math.fround(Math.fround(a)) * flt_f161r__header_global_8fe34ec50a118a36)));
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

// C/C++ source: source/duke3d/src/sounds.cpp:422
export function P_GetP__header_3a51bd0442c3(pSprite) {
  let playerNum = i32(cRecordObject(cRecordPointer(pSprite, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {})).__cxx_anonymous_15.__cxx_anonymous_0.yvel);
  if ((u32(playerNum) >= u32(16))) {
    (playerNum = i32(0));
  }
  return i32(playerNum);
}
