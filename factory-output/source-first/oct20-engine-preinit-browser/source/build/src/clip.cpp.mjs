// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/build/src/clip.cpp
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

// C/C++ source: source/build/include/fix16.h:111
export const fix16_rad_to_deg_mult__header_global_77e98e7a4096a2b9 = i32(3754936);
function __cxx_static_address_f78b64f09ffd1c184469add3() {
  return __cxx_static_address_f78b64f09ffd1c184469add3.reference || (__cxx_static_address_f78b64f09ffd1c184469add3.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_77e98e7a4096a2b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_c1ba0c353aef7fcf = i32(1144);
function __cxx_static_address_e1134601e715baaf95330a42() {
  return __cxx_static_address_e1134601e715baaf95330a42.reference || (__cxx_static_address_e1134601e715baaf95330a42.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_c1ba0c353aef7fcf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/vec.h:9
export function __cxx_record_vec2_2150e186aab2ebda() {
  return __cxx_record_vec2_2150e186aab2ebda.type || (__cxx_record_vec2_2150e186aab2ebda.type = class __cxx_record_vec2_2150e186aab2ebda__implementation {
  constructor() {
    return Object.setPrototypeOf(cZeroAggregate({"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}}, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), new.target.prototype);
  }
  __cxx_operator_cc94421f07fd7ecc(rhs) {
    return cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": i32((this.x + rhs.x)), "y": i32((this.y + rhs.y))}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype});
  }
  __cxx_operator_1dacbd87a6392785(rhs) {
    return cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": i32((this.x - rhs.x)), "y": i32((this.y - rhs.y))}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype});
  }
  __cxx_operator_729d876abe4b118e(rhs) {
    return cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": i32(Math.imul(this.x, rhs.x)), "y": i32(Math.imul(this.y, rhs.y))}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype});
  }
});
}

// C/C++ source: source/build/src/clip.cpp:16
export let clipnum = 0;
function __cxx_static_address_5ac8b36cb40aaa3820451a88() {
  return __cxx_static_address_5ac8b36cb40aaa3820451a88.reference || (__cxx_static_address_5ac8b36cb40aaa3820451a88.reference = {
    __cReference: true,
    get value() { return clipnum; },
    set value(__cxx_lvalue_0) { clipnum = (((__cxx_lvalue_0) << 16) >> 16); }
  });
}

// C/C++ source: source/build/src/clip.cpp:17
export let clipit = cByteRecordNDArray({"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x1": {"native": "Int32Array", "offset": 0, "size": 4}, "y1": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "p1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 8, "union": true}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x2": {"native": "Int32Array", "offset": 0, "size": 4}, "y2": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "p2": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 8, "union": true}, "offset": 8}}, "overlaps": true, "size": 16, "union": false}, [4096], {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}, []);
function __cxx_static_address_9a3cc489ea9c13d351152e91() {
  return __cxx_static_address_9a3cc489ea9c13d351152e91.reference || (__cxx_static_address_9a3cc489ea9c13d351152e91.reference = {
    __cReference: true,
    get value() { return clipit; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/clip.cpp:18
export let clipsectnum = 0;
function __cxx_static_address_070854373a51454e4ac71f00() {
  return __cxx_static_address_070854373a51454e4ac71f00.reference || (__cxx_static_address_070854373a51454e4ac71f00.reference = {
    __cReference: true,
    get value() { return clipsectnum; },
    set value(__cxx_lvalue_0) { clipsectnum = i32(__cxx_lvalue_0); }
  });
}

export let origclipsectnum = 0;
function __cxx_static_address_cd365bf3076c50b2dd55defa() {
  return __cxx_static_address_cd365bf3076c50b2dd55defa.reference || (__cxx_static_address_cd365bf3076c50b2dd55defa.reference = {
    __cReference: true,
    get value() { return origclipsectnum; },
    set value(__cxx_lvalue_0) { origclipsectnum = i32(__cxx_lvalue_0); }
  });
}

export let clipspritenum = 0;
function __cxx_static_address_c43df6288201f0d067b33140() {
  return __cxx_static_address_c43df6288201f0d067b33140.reference || (__cxx_static_address_c43df6288201f0d067b33140.reference = {
    __cReference: true,
    get value() { return clipspritenum; },
    set value(__cxx_lvalue_0) { clipspritenum = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/clip.cpp:19
export let clipsectorlist = new Int16Array(512);
function __cxx_static_address_f4e0d3552e3c3cbd53395b7f() {
  return __cxx_static_address_f4e0d3552e3c3cbd53395b7f.reference || (__cxx_static_address_f4e0d3552e3c3cbd53395b7f.reference = {
    __cReference: true,
    get value() { return clipsectorlist; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/clip.cpp:20
export let origclipsectorlist = new Int16Array(512);
function __cxx_static_address_4a00f157aaab67c7ba8fe749() {
  return __cxx_static_address_4a00f157aaab67c7ba8fe749.reference || (__cxx_static_address_4a00f157aaab67c7ba8fe749.reference = {
    __cReference: true,
    get value() { return origclipsectorlist; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/clip.cpp:21
export let clipsectormap = new Uint8Array(512);
function __cxx_static_address_2c9426a0427de6b3caa36f85() {
  return __cxx_static_address_2c9426a0427de6b3caa36f85.reference || (__cxx_static_address_2c9426a0427de6b3caa36f85.reference = {
    __cReference: true,
    get value() { return clipsectormap; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/clip.cpp:22
export let origclipsectormap = new Uint8Array(512);
function __cxx_static_address_e089728a0429bcf8e5c3f133() {
  return __cxx_static_address_e089728a0429bcf8e5c3f133.reference || (__cxx_static_address_e089728a0429bcf8e5c3f133.reference = {
    __cReference: true,
    get value() { return origclipsectormap; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/clip.cpp:24
export let clipspritelist = new Int16Array(4096);
function __cxx_static_address_c1773ebd177a57ebb686b44f() {
  return __cxx_static_address_c1773ebd177a57ebb686b44f.reference || (__cxx_static_address_c1773ebd177a57ebb686b44f.reference = {
    __cReference: true,
    get value() { return clipspritelist; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_962902e13a59f0c8 = i32(2147483647);
function __cxx_static_address_c7afca2fd45b6695f3aa6972() {
  return __cxx_static_address_c7afca2fd45b6695f3aa6972.reference || (__cxx_static_address_c7afca2fd45b6695f3aa6972.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_962902e13a59f0c8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_e0343cd429f39200 = i32(2147483648);
function __cxx_static_address_f334af25b55bf1ac360d5d6e() {
  return __cxx_static_address_f334af25b55bf1ac360d5d6e.reference || (__cxx_static_address_f334af25b55bf1ac360d5d6e.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_e0343cd429f39200; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_bc69d83f3292f287 = i32(2147483648);
function __cxx_static_address_fed2af7885bd94e1d137d941() {
  return __cxx_static_address_fed2af7885bd94e1d137d941.reference || (__cxx_static_address_fed2af7885bd94e1d137d941.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_bc69d83f3292f287; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_c9653b260e31cc9c = i32(65536);
function __cxx_static_address_b0a43ec7ed342f0926a7ff3c() {
  return __cxx_static_address_b0a43ec7ed342f0926a7ff3c.reference || (__cxx_static_address_b0a43ec7ed342f0926a7ff3c.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_c9653b260e31cc9c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_28c78f4db0593f0d = i32(32768);
function __cxx_static_address_e4a076334a6a3d62597ad191() {
  return __cxx_static_address_e4a076334a6a3d62597ad191.reference || (__cxx_static_address_e4a076334a6a3d62597ad191.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_28c78f4db0593f0d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_bc9ec00325c6706b = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_be12ddf9f9785e535ca2c36b() {
  return __cxx_static_address_be12ddf9f9785e535ca2c36b.reference || (__cxx_static_address_be12ddf9f9785e535ca2c36b.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_bc9ec00325c6706b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/clip.cpp:26
export let clipobjectval = new Int16Array(4096);
function __cxx_static_address_d3586723850cad10c3c0b94b() {
  return __cxx_static_address_d3586723850cad10c3c0b94b.reference || (__cxx_static_address_d3586723850cad10c3c0b94b.reference = {
    __cReference: true,
    get value() { return clipobjectval; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/clip.cpp:27
export let clipignore = new Uint8Array(512);
function __cxx_static_address_92bb0cc1507c256f491dc10f() {
  return __cxx_static_address_92bb0cc1507c256f491dc10f.reference || (__cxx_static_address_92bb0cc1507c256f491dc10f.reference = {
    __cReference: true,
    get value() { return clipignore; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/clip.cpp:30
export let layerclipsectorlist = new Int16Array(512);
function __cxx_static_address_a4b798065fa207f4fd7ea161() {
  return __cxx_static_address_a4b798065fa207f4fd7ea161.reference || (__cxx_static_address_a4b798065fa207f4fd7ea161.reference = {
    __cReference: true,
    get value() { return layerclipsectorlist; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/clip.cpp:31
export let layerclipsectnum = 0;
function __cxx_static_address_57b8301480c3facd9b48e0c4() {
  return __cxx_static_address_57b8301480c3facd9b48e0c4.reference || (__cxx_static_address_57b8301480c3facd9b48e0c4.reference = {
    __cReference: true,
    get value() { return layerclipsectnum; },
    set value(__cxx_lvalue_0) { layerclipsectnum = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/clip.cpp:41
export let yax_clipsectmap = new Uint8Array(512);
function __cxx_static_address_db8da7db9224110bccf06145() {
  return __cxx_static_address_db8da7db9224110bccf06145.reference || (__cxx_static_address_db8da7db9224110bccf06145.reference = {
    __cReference: true,
    get value() { return yax_clipsectmap; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/clip.cpp:44
export let yax_hitscan_ceilmap = new Uint8Array(512);
function __cxx_static_address_c88b867cb2a5c75fc93d6f85() {
  return __cxx_static_address_c88b867cb2a5c75fc93d6f85.reference || (__cxx_static_address_c88b867cb2a5c75fc93d6f85.reference = {
    __cReference: true,
    get value() { return yax_hitscan_ceilmap; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/clip.cpp:45
export let yax_hitscan_floormap = new Uint8Array(512);
function __cxx_static_address_7bacd8dbb44ab15da825597c() {
  return __cxx_static_address_7bacd8dbb44ab15da825597c.reference || (__cxx_static_address_7bacd8dbb44ab15da825597c.reference = {
    __cReference: true,
    get value() { return yax_hitscan_floormap; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/clip.cpp:69
export let origmapinfo = cZeroAggregate({"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"numsectors": {"native": "Int16Array", "offset": 0, "size": 2}, "numwalls": {"native": "Int16Array", "offset": 2, "size": 2}, "sector": {"offset": 8, "pointer": true, "size": 8}, "wall": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": false, "size": 24, "union": false}}, {});
function __cxx_static_address_c851ebf0e52903ba1f615c62() {
  return __cxx_static_address_c851ebf0e52903ba1f615c62.reference || (__cxx_static_address_c851ebf0e52903ba1f615c62.reference = {
    __cReference: true,
    get value() { return origmapinfo; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let clipmapinfo = cZeroAggregate({"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"numsectors": {"native": "Int16Array", "offset": 0, "size": 2}, "numwalls": {"native": "Int16Array", "offset": 2, "size": 2}, "sector": {"offset": 8, "pointer": true, "size": 8}, "wall": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": false, "size": 24, "union": false}}, {});
function __cxx_static_address_f4829d62b637a7e07f0c4164() {
  return __cxx_static_address_f4829d62b637a7e07f0c4164.reference || (__cxx_static_address_f4829d62b637a7e07f0c4164.reference = {
    __cReference: true,
    get value() { return clipmapinfo; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/clip.cpp:70
export let quickloadboard = i32(0);
export function __cxx_global_cell_135b27d87941a5cb2fdb33a1() {
  return __cxx_global_cell_135b27d87941a5cb2fdb33a1.reference || (__cxx_global_cell_135b27d87941a5cb2fdb33a1.reference = {
    __cReference: true,
    get value() { return quickloadboard; },
    set value(__cxx_lvalue_0) { quickloadboard = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/clip.cpp:72
export let clipinfo = cByteRecordNDArray({"align": 4, "arrayAlign": 1, "fields": {"maxdist": {"native": "Int32Array", "offset": 8, "size": 4}, "next": {"native": "Int16Array", "offset": 6, "size": 2}, "picnum": {"native": "Int16Array", "offset": 4, "size": 2}, "qbeg": {"native": "Int16Array", "offset": 0, "size": 2}, "qend": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 12, "union": false}, [256], {}, []);
function __cxx_static_address_b27e6cd8f099c12e56270bca() {
  return __cxx_static_address_b27e6cd8f099c12e56270bca.reference || (__cxx_static_address_b27e6cd8f099c12e56270bca.reference = {
    __cReference: true,
    get value() { return clipinfo; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/clip.cpp:73
export let numclipmaps = 0;
function __cxx_static_address_6de88d0220636c0d278cf585() {
  return __cxx_static_address_6de88d0220636c0d278cf585.reference || (__cxx_static_address_6de88d0220636c0d278cf585.reference = {
    __cReference: true,
    get value() { return numclipmaps; },
    set value(__cxx_lvalue_0) { numclipmaps = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/clip.cpp:75
export let numclipsects = 0;
function __cxx_static_address_1962575eca7da77b7889e5f2() {
  return __cxx_static_address_1962575eca7da77b7889e5f2.reference || (__cxx_static_address_1962575eca7da77b7889e5f2.reference = {
    __cReference: true,
    get value() { return numclipsects; },
    set value(__cxx_lvalue_0) { numclipsects = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/clip.cpp:76
export let sectoidx = null;
function __cxx_static_address_766fd1e403d55ca6e080b2a8() {
  return __cxx_static_address_766fd1e403d55ca6e080b2a8.reference || (__cxx_static_address_766fd1e403d55ca6e080b2a8.reference = {
    __cReference: true,
    get value() { return sectoidx; },
    set value(__cxx_lvalue_0) { sectoidx = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/src/clip.cpp:77
export let sectq = null;
function __cxx_static_address_0ff100be733c4310d0190bb7() {
  return __cxx_static_address_0ff100be733c4310d0190bb7.reference || (__cxx_static_address_0ff100be733c4310d0190bb7.reference = {
    __cReference: true,
    get value() { return sectq; },
    set value(__cxx_lvalue_0) { sectq = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/src/clip.cpp:78
export let pictoidx = new Int16Array(30720);
function __cxx_static_address_0b512b0edb21b3d1c60abb62() {
  return __cxx_static_address_0b512b0edb21b3d1c60abb62.reference || (__cxx_static_address_0b512b0edb21b3d1c60abb62.reference = {
    __cReference: true,
    get value() { return pictoidx; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/clip.cpp:79
export let tempictoidx = null;
function __cxx_static_address_37a3831bb27146574bdca01b() {
  return __cxx_static_address_37a3831bb27146574bdca01b.reference || (__cxx_static_address_37a3831bb27146574bdca01b.reference = {
    __cReference: true,
    get value() { return tempictoidx; },
    set value(__cxx_lvalue_0) { tempictoidx = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/src/clip.cpp:81
export let loadsector = null;
function __cxx_static_address_e294f0cffcd2011dd0c1f90e() {
  return __cxx_static_address_e294f0cffcd2011dd0c1f90e.reference || (__cxx_static_address_e294f0cffcd2011dd0c1f90e.reference = {
    __cReference: true,
    get value() { return loadsector; },
    set value(__cxx_lvalue_0) { loadsector = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/src/clip.cpp:82
export let loadwall = null;
function __cxx_static_address_e674a507ed0dfb7131f5a12a() {
  return __cxx_static_address_e674a507ed0dfb7131f5a12a.reference || (__cxx_static_address_e674a507ed0dfb7131f5a12a.reference = {
    __cReference: true,
    get value() { return loadwall; },
    set value(__cxx_lvalue_0) { loadwall = __cxx_lvalue_0; }
  });
}

export let loadwallinv = null;
function __cxx_static_address_82ff90ff2035d3a5d25a58f8() {
  return __cxx_static_address_82ff90ff2035d3a5d25a58f8.reference || (__cxx_static_address_82ff90ff2035d3a5d25a58f8.reference = {
    __cReference: true,
    get value() { return loadwallinv; },
    set value(__cxx_lvalue_0) { loadwallinv = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/src/clip.cpp:83
export let loadsprite = null;
function __cxx_static_address_41e4fa070a0f95f448e441a0() {
  return __cxx_static_address_41e4fa070a0f95f448e441a0.reference || (__cxx_static_address_41e4fa070a0f95f448e441a0.reference = {
    __cReference: true,
    get value() { return loadsprite; },
    set value(__cxx_lvalue_0) { loadsprite = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/src/clip.cpp:85
export let hitscangoal = cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": i32((i32((1 << 29)) - 1)), "y": i32((i32((1 << 29)) - 1))}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype});
export function __cxx_global_cell_9a605780775aad847bf4390e() {
  return __cxx_global_cell_9a605780775aad847bf4390e.reference || (__cxx_global_cell_9a605780775aad847bf4390e.reference = {
    __cReference: true,
    get value() { return hitscangoal; },
    set value(__cxx_lvalue_0) { throw new TypeError("record address cannot replace original object storage"); }
  });
}

// C/C++ source: source/build/src/clip.cpp:569
export let clipmoveboxtracenum = i32(3);
export function __cxx_global_cell_9a3ceb4139db1621bfebb38f() {
  return __cxx_global_cell_9a3ceb4139db1621bfebb38f.reference || (__cxx_global_cell_9a3ceb4139db1621bfebb38f.reference = {
    __cReference: true,
    get value() { return clipmoveboxtracenum; },
    set value(__cxx_lvalue_0) { clipmoveboxtracenum = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/clip.cpp:575
export function clipinsideboxline(x, y, x1, y1, x2, y2, walldist) {
  let r = i32((walldist << 1));
  (x1 = i32((Number(x1) + Number(i32((walldist - x))))));
  (x2 = i32((Number(x2) + Number(i32((walldist - x))))));
  if ((((x1 < 0) && (x2 < 0)) || ((x1 >= r) && (x2 >= r)))) {
    return i32(0);
  }
  (y1 = i32((Number(y1) + Number(i32((walldist - y))))));
  (y2 = i32((Number(y2) + Number(i32((walldist - y))))));
  if ((((y1 < 0) && (y2 < 0)) || ((y1 >= r) && (y2 >= r)))) {
    return i32(0);
  }
  (x2 = i32((Number(x2) - Number(x1))));
  (y2 = i32((Number(y2) - Number(y1))));
  if ((i32(Math.imul(x2, i32((walldist - y1)))) >= i32(Math.imul(y2, i32((walldist - x1)))))) {
    (x2 = i32(Math.imul(x2, ((x2 > 0) ? i32((0 - y1)) : i32((r - y1))))));
    (y2 = i32(Math.imul(y2, ((y2 > 0) ? i32((r - x1)) : i32((0 - x1))))));
    return i32((x2 < y2));
  }
  (x2 = i32(Math.imul(x2, ((x2 > 0) ? i32((r - y1)) : i32((0 - y1))))));
  (y2 = i32(Math.imul(y2, ((y2 > 0) ? i32((0 - x1)) : i32((r - x1))))));
  return i32((i32((x2 >= y2)) << 1));
}

// C/C++ source: source/build/src/clip.cpp:618
export let clipmove_warned = 0;
function __cxx_static_address_ae6aaa52186f4be836c44bff() {
  return __cxx_static_address_ae6aaa52186f4be836c44bff.reference || (__cxx_static_address_ae6aaa52186f4be836c44bff.reference = {
    __cReference: true,
    get value() { return clipmove_warned; },
    set value(__cxx_lvalue_0) { clipmove_warned = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/clip.cpp:620
export function addclipsect(sectnum) {
  if ((clipsectnum < 512)) {
    bitmap_set__header_47c0671af6f8(clipsectormap, sectnum);
    ((cDeref(cPointerOffset(clipsectorlist, ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(__cxx_static_address_070854373a51454e4ac71f00()), Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = ((((((sectnum) << 16) >> 16)) << 16) >> 16));
  } else {
    (clipmove_warned = i32((clipmove_warned | 1)));
  }
}

// C/C++ source: source/build/src/clip.cpp:758
export function addclipline(dax1, day1, dax2, day2, daoval, nofix) {
  if ((i32(clipnum) >= 4096)) {
    (clipmove_warned = i32((clipmove_warned | 2)));
    return;
  }
  cAssignAggregate((cPointerElementRef(clipit, clipnum).value), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x1": {"native": "Int32Array", "offset": 0, "size": 4}, "y1": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "p1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 8, "union": true}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x2": {"native": "Int32Array", "offset": 0, "size": 4}, "y2": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "p2": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 8, "union": true}, "offset": 8}}, "overlaps": true, "size": 16, "union": false}, {"__cxx_anonymous_0": cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x1": {"native": "Int32Array", "offset": 0, "size": 4}, "y1": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "p1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 8, "union": true}, {"__cxx_anonymous_0": cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x1": {"native": "Int32Array", "offset": 0, "size": 4}, "y1": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x1": dax1, "y1": day1}, null, {})}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), "__cxx_anonymous_1": cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x2": {"native": "Int32Array", "offset": 0, "size": 4}, "y2": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "p2": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 8, "union": true}, {"__cxx_anonymous_0": cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x2": {"native": "Int32Array", "offset": 0, "size": 4}, "y2": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x2": dax2, "y2": day2}, null, {})}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype})}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x1": {"native": "Int32Array", "offset": 0, "size": 4}, "y1": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "p1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 8, "union": true}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x2": {"native": "Int32Array", "offset": 0, "size": 4}, "y2": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "p2": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 8, "union": true}, "offset": 8}}, "overlaps": true, "size": 16, "union": false}});
  ((cDeref(cPointerOffset(clipobjectval, clipnum, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = (((daoval) << 16) >> 16));
  let mask = u32((cDeref(cPointerOffset(pow2char__header_global_ac5ee5e23ad54d87, i32((i32(clipnum) & 7)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value));
  const value = cDeref(cPointerOffset(clipignore, i32((i32(clipnum) >> 3)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array);
  (value.value = ((((u32((u32((u32(value.value) & (~mask))) | u32((u32((-nofix)) & mask))))) & 255)) & 255));
  ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = ((((previous + 1)) << 16) >> 16); __cxx_lvalue_0.value = next; return previous; })(__cxx_static_address_5ac8b36cb40aaa3820451a88());
}

// C/C++ source: source/build/src/clip.cpp:987
export function get_floorspr_clipyou(v1, v2, v3, v4) {
  let clipyou = i32(0);
  if ((i32((v1.y ^ v2.y)) < 0)) {
    if ((i32((v1.x ^ v2.x)) < 0)) {
      (clipyou = i32((clipyou ^ i32((i32((i32(Math.imul(v1.x, v2.y)) < i32(Math.imul(v2.x, v1.y)))) ^ i32((v1.y < v2.y)))))));
    } else {
      if ((v1.x >= 0)) {
        (clipyou = i32((clipyou ^ 1)));
      }
    }
  }
  if ((i32((v2.y ^ v3.y)) < 0)) {
    if ((i32((v2.x ^ v3.x)) < 0)) {
      (clipyou = i32((clipyou ^ i32((i32((i32(Math.imul(v2.x, v3.y)) < i32(Math.imul(v3.x, v2.y)))) ^ i32((v2.y < v3.y)))))));
    } else {
      if ((v2.x >= 0)) {
        (clipyou = i32((clipyou ^ 1)));
      }
    }
  }
  if ((i32((v3.y ^ v4.y)) < 0)) {
    if ((i32((v3.x ^ v4.x)) < 0)) {
      (clipyou = i32((clipyou ^ i32((i32((i32(Math.imul(v3.x, v4.y)) < i32(Math.imul(v4.x, v3.y)))) ^ i32((v3.y < v4.y)))))));
    } else {
      if ((v3.x >= 0)) {
        (clipyou = i32((clipyou ^ 1)));
      }
    }
  }
  if ((i32((v4.y ^ v1.y)) < 0)) {
    if ((i32((v4.x ^ v1.x)) < 0)) {
      (clipyou = i32((clipyou ^ i32((i32((i32(Math.imul(v4.x, v1.y)) < i32(Math.imul(v1.x, v4.y)))) ^ i32((v4.y < v1.y)))))));
    } else {
      if ((v4.x >= 0)) {
        (clipyou = i32((clipyou ^ 1)));
      }
    }
  }
  return i32(clipyou);
}

// C/C++ source: source/build/src/clip.cpp:2551
export function hit_set(hit, sectnum, wallnum, spritenum, x, y, z) {
  (cRecordObject(hit).sect = ((((((sectnum) << 16) >> 16)) << 16) >> 16));
  (cRecordObject(hit).wall = ((((((wallnum) << 16) >> 16)) << 16) >> 16));
  (cRecordObject(hit).sprite = ((((((spritenum) << 16) >> 16)) << 16) >> 16));
  (cRecordObject(hit).__cxx_anonymous_0.__cxx_anonymous_0.x = i32(x));
  (cRecordObject(hit).__cxx_anonymous_0.__cxx_anonymous_0.y = i32(y));
  (cRecordObject(hit).__cxx_anonymous_0.__cxx_anonymous_0.z = i32(z));
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_ac5ee5e23ad54d87 = new Uint8Array([((1) & 255), ((2) & 255), ((4) & 255), ((8) & 255), ((16) & 255), ((32) & 255), ((64) & 255), ((128) & 255)]);
function __cxx_static_address_106ffe9e4ded90ce0138a3b3() {
  return __cxx_static_address_106ffe9e4ded90ce0138a3b3.reference || (__cxx_static_address_106ffe9e4ded90ce0138a3b3.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_ac5ee5e23ad54d87; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:172
export const g_defaultVideoModes__header_global_9c6e073a199d460b = cByteRecordNDArray({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, [25], {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}, [cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 2560, "y": 1440}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 2560, "y": 1200}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 2560, "y": 1080}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 1920, "y": 1440}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 1920, "y": 1200}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 1920, "y": 1080}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 1680, "y": 1050}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 1600, "y": 1200}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 1600, "y": 900}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 1366, "y": 768}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 1280, "y": 1024}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 1280, "y": 960}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 1280, "y": 720}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 1152, "y": 864}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 1024, "y": 768}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 1024, "y": 600}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 800, "y": 600}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 640, "y": 480}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 640, "y": 400}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 512, "y": 384}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 480, "y": 360}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 400, "y": 300}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 320, "y": 240}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 320, "y": 200}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 0, "y": 0}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype})]);
function __cxx_static_address_0a180a7f06a051855704a3b9() {
  return __cxx_static_address_0a180a7f06a051855704a3b9.reference || (__cxx_static_address_0a180a7f06a051855704a3b9.reference = {
    __cReference: true,
    get value() { return g_defaultVideoModes__header_global_9c6e073a199d460b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:188
export const g_keyAsciiTable__header_global_5eeecd42e2de0556 = new Uint8Array([((0) & 255), ((0) & 255), 49, 50, 51, 52, 53, 54, 55, 56, 57, 48, 45, 61, ((0) & 255), ((0) & 255), 113, 119, 101, 114, 116, 121, 117, 105, 111, 112, 91, 93, ((0) & 255), ((0) & 255), 97, 115, 100, 102, 103, 104, 106, 107, 108, 59, ((39) & 255), 96, ((0) & 255), ((92) & 255), 122, 120, 99, 118, 98, 110, 109, 44, 46, 47, ((0) & 255), 42, ((0) & 255), ((32) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255)]);
function __cxx_static_address_88c6fef7f2e77053d62ba1f2() {
  return __cxx_static_address_88c6fef7f2e77053d62ba1f2.reference || (__cxx_static_address_88c6fef7f2e77053d62ba1f2.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTable__header_global_5eeecd42e2de0556; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:196
export const g_keyAsciiTableShift__header_global_b04942c28bf1e194 = new Uint8Array([((0) & 255), ((0) & 255), 33, 64, 35, 36, 37, 94, 38, 42, 40, 41, 95, 43, ((0) & 255), ((0) & 255), 81, 87, 69, 82, 84, 89, 85, 73, 79, 80, 123, 125, ((0) & 255), ((0) & 255), 65, 83, 68, 70, 71, 72, 74, 75, 76, 58, 34, 126, ((0) & 255), 124, 90, 88, 67, 86, 66, 78, 77, 60, 62, 63, ((0) & 255), 42, ((0) & 255), ((32) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255)]);
function __cxx_static_address_8a4c606cfd7837a65166f4e0() {
  return __cxx_static_address_8a4c606cfd7837a65166f4e0.reference || (__cxx_static_address_8a4c606cfd7837a65166f4e0.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTableShift__header_global_b04942c28bf1e194; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:895
export const pow2long__header_global_56f356a0a7bab309 = new Int32Array([1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576, 2097152, 4194304, 8388608, 16777216, 33554432, 67108864, 134217728, 268435456, 536870912, 1073741824, 2147483647]);
function __cxx_static_address_c75cbc88c85a92a479b93e71() {
  return __cxx_static_address_c75cbc88c85a92a479b93e71.reference || (__cxx_static_address_c75cbc88c85a92a479b93e71.reference = {
    __cReference: true,
    get value() { return pow2long__header_global_56f356a0a7bab309; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:907
export const pow2ulong__header_global_cc4383bbbdd53a02 = new Uint32Array([u32(1), u32(2), u32(4), u32(8), u32(16), u32(32), u32(64), u32(128), u32(256), u32(512), u32(1024), u32(2048), u32(4096), u32(8192), u32(16384), u32(32768), u32(65536), u32(131072), u32(262144), u32(524288), u32(1048576), u32(2097152), u32(4194304), u32(8388608), u32(16777216), u32(33554432), u32(67108864), u32(134217728), u32(268435456), u32(536870912), u32(1073741824), u32(2147483648n)]);
function __cxx_static_address_c4389b114fd6be1dd86fde56() {
  return __cxx_static_address_c4389b114fd6be1dd86fde56.reference || (__cxx_static_address_c4389b114fd6be1dd86fde56.reference = {
    __cReference: true,
    get value() { return pow2ulong__header_global_cc4383bbbdd53a02; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:919
export const pow264__header_global_34ce0a0a2f776ce9 = new BigInt64Array([BigInt(i64(1)), BigInt(i64(2)), BigInt(i64(4)), BigInt(i64(8)), BigInt(i64(16)), BigInt(i64(32)), BigInt(i64(64)), BigInt(i64(128)), BigInt(i64(256)), BigInt(i64(512)), BigInt(i64(1024)), BigInt(i64(2048)), BigInt(i64(4096)), BigInt(i64(8192)), BigInt(i64(16384)), BigInt(i64(32768)), BigInt(i64(65536)), BigInt(i64(131072)), BigInt(i64(262144)), BigInt(i64(524288)), BigInt(i64(1048576)), BigInt(i64(2097152)), BigInt(i64(4194304)), BigInt(i64(8388608)), BigInt(i64(16777216)), BigInt(i64(33554432)), BigInt(i64(67108864)), BigInt(i64(134217728)), BigInt(i64(268435456)), BigInt(i64(536870912)), BigInt(i64(1073741824)), BigInt(2147483648n), BigInt(4294967296n), BigInt(8589934592n), BigInt(17179869184n), BigInt(34359738368n), BigInt(68719476736n), BigInt(137438953472n), BigInt(274877906944n), BigInt(549755813888n), BigInt(1099511627776n), BigInt(2199023255552n), BigInt(4398046511104n), BigInt(8796093022208n), BigInt(17592186044416n), BigInt(35184372088832n), BigInt(70368744177664n), BigInt(140737488355328n), BigInt(281474976710656n), BigInt(562949953421312n), BigInt(1125899906842624n), BigInt(2251799813685248n), BigInt(4503599627370496n), BigInt(9007199254740992n), BigInt(18014398509481984n), BigInt(36028797018963968n), BigInt(72057594037927936n), BigInt(144115188075855872n), BigInt(288230376151711744n), BigInt(576460752303423488n), BigInt(1152921504606846976n), BigInt(2305843009213693952n), BigInt(4611686018427387904n), BigInt(9223372036854775807n)]);
function __cxx_static_address_38e83abc62a186a7a496e0d9() {
  return __cxx_static_address_38e83abc62a186a7a496e0d9.reference || (__cxx_static_address_38e83abc62a186a7a496e0d9.reference = {
    __cReference: true,
    get value() { return pow264__header_global_34ce0a0a2f776ce9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/clip.cpp:1391
export function uhypsq__header_dd9509de8c52(dx, dy) {
  return u32((u32(Math.imul(u32(dx), u32(dx))) + u32(Math.imul(u32(dy), u32(dy)))));
}

export function swap__header_e171cdb406a7(a, b) {
  let t = ((((cDeref(a, Int16Array).value)) << 16) >> 16);
  ((cDeref(a, Int16Array).value) = ((((cDeref(b, Int16Array).value)) << 16) >> 16));
  ((cDeref(b, Int16Array).value) = (((t) << 16) >> 16));
}

export function bitmap_set__header_47c0671af6f8(ptr, n) {

  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = (((__cxx_lvalue_0.value | i32((cDeref(cPointerOffset(pow2char__header_global_ac5ee5e23ad54d87, i32((n & 7)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))) & 255)))(cDeref(cPointerOffset(ptr, i32((n >> 3)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array));
}

// C/C++ source: @sysroot/usr/include/c++/12/bits/stl_algobase.h:254
export function max__template_24e14afbde2a1bb9(__a, __b) {
  if ((__a.value < __b.value)) {
    return __b;
  }
  return __a;
}

export function mulscale22__header_944a09914313(eax, edx) {
  return i32((BigInt((BigInt(i64(eax)) * BigInt(i64(edx)))) >> BigInt(i32(((((22) & 255)) & 255)))));
}

export function dmulscale23__header_d71d61775739(eax, edx, esi, edi) {
  return i32((BigInt((BigInt((BigInt(i64(eax)) * BigInt(i64(edx)))) + BigInt((BigInt(i64(esi)) * BigInt(i64(edi)))))) >> BigInt(i32(((((23) & 255)) & 255)))));
}

// C/C++ source: source/build/src/clip.cpp:328
export function ksgn__header_eea109fd79d0(a) {
  return i32((i32((a > 0)) - i32((a < 0))));
}

// C/C++ source: @sysroot/usr/include/c++/12/bits/stl_algobase.h:230
export function min__template_16d592da45d1e47f(__a, __b) {
  if ((i32(__b.value) < i32(__a.value))) {
    return __b;
  }
  return __a;
}

export function SILENCE_UNUSED__header_dfe46629c793(arg0, arg1, arg2, arg3, arg4) {

}

export function bitmap_test__header_8c83e0ebeb4f(ptr, n) {

  return Boolean((i32((i32((cDeref(cPointerOffset(ptr, i32((n >> 3)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & i32((cDeref(cPointerOffset(pow2char__header_global_ac5ee5e23ad54d87, i32((n & 7)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))) == i32((cDeref(cPointerOffset(pow2char__header_global_ac5ee5e23ad54d87, i32((n & 7)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))));
}

export function mulscale14__header_ee2f0426cb99(eax, edx) {
  return i32((BigInt((BigInt(i64(eax)) * BigInt(i64(edx)))) >> BigInt(i32(((((14) & 255)) & 255)))));
}

export function SILENCE_UNUSED__header_7c1283cbe042(arg0, arg1, arg2) {

}

export function mulscale12__header_b41d91d6d7a7(eax, edx) {
  return i32((BigInt((BigInt(i64(eax)) * BigInt(i64(edx)))) >> BigInt(i32(((((12) & 255)) & 255)))));
}

export function mulscale16__header_d2936089847a(eax, edx) {
  return i32((BigInt((BigInt(i64(eax)) * BigInt(i64(edx)))) >> BigInt(i32(((((16) & 255)) & 255)))));
}

export function mulscale24__header_ed7350a81419(eax, edx) {
  return i32((BigInt((BigInt(i64(eax)) * BigInt(i64(edx)))) >> BigInt(i32(((((24) & 255)) & 255)))));
}

// C/C++ source: source/build/src/clip.cpp:207
export function yax_waltosecmask__header_2cb53f81dc3f(walclipmask) {
  return i32((i32((i32((walclipmask & 1)) << 9)) | i32((i32((walclipmask & 64)) << 5))));
}

export function clamp__header_557ea87ebe2e(__cxx_in, min, max) {
  return i64(((__cxx_in <= i64(min)) ? i64(min) : ((__cxx_in >= i64(max)) ? i64(max) : __cxx_in)));
}

export function mulscale20__header_61a32aaf406e(eax, edx) {
  return i32((BigInt((BigInt(i64(eax)) * BigInt(i64(edx)))) >> BigInt(i32(((((20) & 255)) & 255)))));
}

export function dmulscale6__header_2176f1b425b4(eax, edx, esi, edi) {
  return i32((BigInt((BigInt((BigInt(i64(eax)) * BigInt(i64(edx)))) + BigInt((BigInt(i64(esi)) * BigInt(i64(edi)))))) >> BigInt(i32(((((6) & 255)) & 255)))));
}

export function mulscale30__header_0eda95dae850(eax, edx) {
  return i32((BigInt((BigInt(i64(eax)) * BigInt(i64(edx)))) >> BigInt(i32(((((30) & 255)) & 255)))));
}

export function clamp__header_a00d37dc5f9b(__cxx_in, min, max) {
  return i32(((__cxx_in <= i32(min)) ? i32(min) : ((__cxx_in >= i32(max)) ? i32(max) : __cxx_in)));
}

export function mulscale7__header_98716e5e1a11(eax, edx) {
  return i32((BigInt((BigInt(i64(eax)) * BigInt(i64(edx)))) >> BigInt(i32(((((7) & 255)) & 255)))));
}

export function dmulscale15__header_f6bf5a775e53(eax, edx, esi, edi) {
  return i32((BigInt((BigInt((BigInt(i64(eax)) * BigInt(i64(edx)))) + BigInt((BigInt(i64(esi)) * BigInt(i64(edi)))))) >> BigInt(i32(((((15) & 255)) & 255)))));
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

export function dmulscale14__header_d87d7a34eec9(eax, edx, esi, edi) {
  return i32((BigInt((BigInt((BigInt(i64(eax)) * BigInt(i64(edx)))) + BigInt((BigInt(i64(esi)) * BigInt(i64(edi)))))) >> BigInt(i32(((((14) & 255)) & 255)))));
}

export function dmulscale4__header_3a8c44bc8f75(eax, edx, esi, edi) {
  return i32((BigInt((BigInt((BigInt(i64(eax)) * BigInt(i64(edx)))) + BigInt((BigInt(i64(esi)) * BigInt(i64(edi)))))) >> BigInt(i32(((((4) & 255)) & 255)))));
}

export function mulscale18__header_b63d47220b08(eax, edx) {
  return i32((BigInt((BigInt(i64(eax)) * BigInt(i64(edx)))) >> BigInt(i32(((((18) & 255)) & 255)))));
}

export function dmulscale16__header_166878ba518e(eax, edx, esi, edi) {
  return i32((BigInt((BigInt((BigInt(i64(eax)) * BigInt(i64(edx)))) + BigInt((BigInt(i64(esi)) * BigInt(i64(edi)))))) >> BigInt(i32(((((16) & 255)) & 255)))));
}

// Verified same-original-unit fragment storage exports.
export function __cxx_private_cell_6de88d0220636c0d278cf585() { return __cxx_static_address_6de88d0220636c0d278cf585(); }
export function __cxx_private_cell_1962575eca7da77b7889e5f2() { return __cxx_static_address_1962575eca7da77b7889e5f2(); }
export function __cxx_private_cell_766fd1e403d55ca6e080b2a8() { return __cxx_static_address_766fd1e403d55ca6e080b2a8(); }
export function __cxx_private_cell_0ff100be733c4310d0190bb7() { return __cxx_static_address_0ff100be733c4310d0190bb7(); }
export function __cxx_private_cell_0b512b0edb21b3d1c60abb62() { return __cxx_static_address_0b512b0edb21b3d1c60abb62(); }
export function __cxx_private_cell_37a3831bb27146574bdca01b() { return __cxx_static_address_37a3831bb27146574bdca01b(); }
export function __cxx_private_cell_e294f0cffcd2011dd0c1f90e() { return __cxx_static_address_e294f0cffcd2011dd0c1f90e(); }
export function __cxx_private_cell_e674a507ed0dfb7131f5a12a() { return __cxx_static_address_e674a507ed0dfb7131f5a12a(); }
export function __cxx_private_cell_82ff90ff2035d3a5d25a58f8() { return __cxx_static_address_82ff90ff2035d3a5d25a58f8(); }
export function __cxx_private_cell_41e4fa070a0f95f448e441a0() { return __cxx_static_address_41e4fa070a0f95f448e441a0(); }

// Verified same-original-unit fragment storage exports.
export function __cxx_private_cell_f4829d62b637a7e07f0c4164() { return __cxx_static_address_f4829d62b637a7e07f0c4164(); }

// Original Clang-generated fragment; imports existing owner storage.
export { engineInitClipMaps } from "./_source_legacy_clip_cpp_a854ca89231c.mjs";
