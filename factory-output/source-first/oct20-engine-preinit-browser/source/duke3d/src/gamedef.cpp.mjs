// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/duke3d/src/gamedef.cpp
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
export const fix16_rad_to_deg_mult__header_global_1f40bcc2bbf75e25 = i32(3754936);
function __cxx_static_address_a6383883187bf9e8bcc2793e() {
  return __cxx_static_address_a6383883187bf9e8bcc2793e.reference || (__cxx_static_address_a6383883187bf9e8bcc2793e.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_1f40bcc2bbf75e25; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_f5431bc88dc7154f = i32(1144);
function __cxx_static_address_01b90c3a4ab1198d7f8ad16b() {
  return __cxx_static_address_01b90c3a4ab1198d7f8ad16b.reference || (__cxx_static_address_01b90c3a4ab1198d7f8ad16b.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_f5431bc88dc7154f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:43
export const KICK_HIT____header_global_0016dbaca264621c = ((((((0) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_30ca5b60063ce21e3d336727() {
  return __cxx_static_address_30ca5b60063ce21e3d336727.reference || (__cxx_static_address_30ca5b60063ce21e3d336727.reference = {
    __cReference: true,
    get value() { return KICK_HIT____header_global_0016dbaca264621c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:44
export const PISTOL_RICOCHET____header_global_04c3955dac755586 = ((((((1) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8252731d28b0c8e84c804395() {
  return __cxx_static_address_8252731d28b0c8e84c804395.reference || (__cxx_static_address_8252731d28b0c8e84c804395.reference = {
    __cReference: true,
    get value() { return PISTOL_RICOCHET____header_global_04c3955dac755586; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:45
export const PISTOL_BODYHIT____header_global_3844584d645e075c = ((((((2) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ddea8d552e4ecbc66982f915() {
  return __cxx_static_address_ddea8d552e4ecbc66982f915.reference || (__cxx_static_address_ddea8d552e4ecbc66982f915.reference = {
    __cReference: true,
    get value() { return PISTOL_BODYHIT____header_global_3844584d645e075c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:46
export const PISTOL_FIRE____header_global_026ea5e0c5eb920e = ((((((3) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d02527dc2a11ca4bb1559b7b() {
  return __cxx_static_address_d02527dc2a11ca4bb1559b7b.reference || (__cxx_static_address_d02527dc2a11ca4bb1559b7b.reference = {
    __cReference: true,
    get value() { return PISTOL_FIRE____header_global_026ea5e0c5eb920e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:47
export const EJECT_CLIP____header_global_61466b4a2a6699bb = ((((((4) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1bc8e95969454829775fb82e() {
  return __cxx_static_address_1bc8e95969454829775fb82e.reference || (__cxx_static_address_1bc8e95969454829775fb82e.reference = {
    __cReference: true,
    get value() { return EJECT_CLIP____header_global_61466b4a2a6699bb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:48
export const INSERT_CLIP____header_global_cc7e60267e011f73 = ((((((5) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8ce7cf1fa90b8d50a92ced81() {
  return __cxx_static_address_8ce7cf1fa90b8d50a92ced81.reference || (__cxx_static_address_8ce7cf1fa90b8d50a92ced81.reference = {
    __cReference: true,
    get value() { return INSERT_CLIP____header_global_cc7e60267e011f73; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:49
export const CHAINGUN_FIRE____header_global_6bdc7ff8d75618de = ((((((6) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f52e9626a79df95752700566() {
  return __cxx_static_address_f52e9626a79df95752700566.reference || (__cxx_static_address_f52e9626a79df95752700566.reference = {
    __cReference: true,
    get value() { return CHAINGUN_FIRE____header_global_6bdc7ff8d75618de; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:50
export const RPG_SHOOT____header_global_0f967737638099fc = ((((((7) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dc7223bf6ef9a5dd1fb9935b() {
  return __cxx_static_address_dc7223bf6ef9a5dd1fb9935b.reference || (__cxx_static_address_dc7223bf6ef9a5dd1fb9935b.reference = {
    __cReference: true,
    get value() { return RPG_SHOOT____header_global_0f967737638099fc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:51
export const POOLBALLHIT____header_global_77ef96b7889bcee7 = ((((((8) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2729e302f2c71f35fd07f653() {
  return __cxx_static_address_2729e302f2c71f35fd07f653.reference || (__cxx_static_address_2729e302f2c71f35fd07f653.reference = {
    __cReference: true,
    get value() { return POOLBALLHIT____header_global_77ef96b7889bcee7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:52
export const RPG_EXPLODE____header_global_2f7b5632c567167d = ((((((9) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9d8f128d298d7e76af5eb4f9() {
  return __cxx_static_address_9d8f128d298d7e76af5eb4f9.reference || (__cxx_static_address_9d8f128d298d7e76af5eb4f9.reference = {
    __cReference: true,
    get value() { return RPG_EXPLODE____header_global_2f7b5632c567167d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:53
export const CAT_FIRE____header_global_1c85cdc512291253 = ((((((10) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_88bf5b6a678a8d5348f87e35() {
  return __cxx_static_address_88bf5b6a678a8d5348f87e35.reference || (__cxx_static_address_88bf5b6a678a8d5348f87e35.reference = {
    __cReference: true,
    get value() { return CAT_FIRE____header_global_1c85cdc512291253; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:54
export const SHRINKER_FIRE____header_global_6e567e30ebfbd692 = ((((((11) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_205db0819820c0a940b3f548() {
  return __cxx_static_address_205db0819820c0a940b3f548.reference || (__cxx_static_address_205db0819820c0a940b3f548.reference = {
    __cReference: true,
    get value() { return SHRINKER_FIRE____header_global_6e567e30ebfbd692; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:55
export const PIPEBOMB_BOUNCE____header_global_09dd157fbcb3e11a = ((((((13) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d424d929c5646160f092404a() {
  return __cxx_static_address_d424d929c5646160f092404a.reference || (__cxx_static_address_d424d929c5646160f092404a.reference = {
    __cReference: true,
    get value() { return PIPEBOMB_BOUNCE____header_global_09dd157fbcb3e11a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:56
export const PIPEBOMB_EXPLODE____header_global_4d1121bdf2000579 = ((((((14) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_73d7b07fdf5836088d669fc0() {
  return __cxx_static_address_73d7b07fdf5836088d669fc0.reference || (__cxx_static_address_73d7b07fdf5836088d669fc0.reference = {
    __cReference: true,
    get value() { return PIPEBOMB_EXPLODE____header_global_4d1121bdf2000579; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:57
export const LASERTRIP_ONWALL____header_global_7e23353a3f847760 = ((((((15) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8aad54c15016d949448ba227() {
  return __cxx_static_address_8aad54c15016d949448ba227.reference || (__cxx_static_address_8aad54c15016d949448ba227.reference = {
    __cReference: true,
    get value() { return LASERTRIP_ONWALL____header_global_7e23353a3f847760; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:58
export const LASERTRIP_ARMING____header_global_e0db99c733186b28 = ((((((16) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_234e7e587ed711b61593fba3() {
  return __cxx_static_address_234e7e587ed711b61593fba3.reference || (__cxx_static_address_234e7e587ed711b61593fba3.reference = {
    __cReference: true,
    get value() { return LASERTRIP_ARMING____header_global_e0db99c733186b28; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:59
export const LASERTRIP_EXPLODE____header_global_a57c2884324a5893 = ((((((17) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_056203fe831c6423e31c319f() {
  return __cxx_static_address_056203fe831c6423e31c319f.reference || (__cxx_static_address_056203fe831c6423e31c319f.reference = {
    __cReference: true,
    get value() { return LASERTRIP_EXPLODE____header_global_a57c2884324a5893; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:60
export const VENT_BUST____header_global_0ad0d198fa3ded39 = ((((((18) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b2c2df18cfc241f3e212a341() {
  return __cxx_static_address_b2c2df18cfc241f3e212a341.reference || (__cxx_static_address_b2c2df18cfc241f3e212a341.reference = {
    __cReference: true,
    get value() { return VENT_BUST____header_global_0ad0d198fa3ded39; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:61
export const GLASS_BREAKING____header_global_f8fce8872cd66dbd = ((((((19) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b40866dff18c2f4f17130956() {
  return __cxx_static_address_b40866dff18c2f4f17130956.reference || (__cxx_static_address_b40866dff18c2f4f17130956.reference = {
    __cReference: true,
    get value() { return GLASS_BREAKING____header_global_f8fce8872cd66dbd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:62
export const GLASS_HEAVYBREAK____header_global_ec05f79f4564b839 = ((((((20) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_06c9f643aa5042907086c41f() {
  return __cxx_static_address_06c9f643aa5042907086c41f.reference || (__cxx_static_address_06c9f643aa5042907086c41f.reference = {
    __cReference: true,
    get value() { return GLASS_HEAVYBREAK____header_global_ec05f79f4564b839; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:63
export const SHORT_CIRCUIT____header_global_3513e1590fd98052 = ((((((21) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5857031578510845397194dd() {
  return __cxx_static_address_5857031578510845397194dd.reference || (__cxx_static_address_5857031578510845397194dd.reference = {
    __cReference: true,
    get value() { return SHORT_CIRCUIT____header_global_3513e1590fd98052; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:64
export const ITEM_SPLASH____header_global_98d9fb8497359988 = ((((((22) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0747e85b36fd5a916033a953() {
  return __cxx_static_address_0747e85b36fd5a916033a953.reference || (__cxx_static_address_0747e85b36fd5a916033a953.reference = {
    __cReference: true,
    get value() { return ITEM_SPLASH____header_global_98d9fb8497359988; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:65
export const DUKE_GASP____header_global_1592e2906ebb2854 = ((((((25) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_75deff6d4f2104ce07712a33() {
  return __cxx_static_address_75deff6d4f2104ce07712a33.reference || (__cxx_static_address_75deff6d4f2104ce07712a33.reference = {
    __cReference: true,
    get value() { return DUKE_GASP____header_global_1592e2906ebb2854; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:66
export const SLIM_RECOG____header_global_aeb074625d2a61fa = ((((((26) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_392357078db340db34d22d82() {
  return __cxx_static_address_392357078db340db34d22d82.reference || (__cxx_static_address_392357078db340db34d22d82.reference = {
    __cReference: true,
    get value() { return SLIM_RECOG____header_global_aeb074625d2a61fa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:67
export const DUKE_URINATE____header_global_9c911f315f85348e = ((((((28) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6b844f82cb13c518f67d988c() {
  return __cxx_static_address_6b844f82cb13c518f67d988c.reference || (__cxx_static_address_6b844f82cb13c518f67d988c.reference = {
    __cReference: true,
    get value() { return DUKE_URINATE____header_global_9c911f315f85348e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:68
export const ENDSEQVOL3SND2____header_global_3cf44741b9103db5 = ((((((29) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e88c216d0049eaac952f7ed5() {
  return __cxx_static_address_e88c216d0049eaac952f7ed5.reference || (__cxx_static_address_e88c216d0049eaac952f7ed5.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND2____header_global_3cf44741b9103db5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:69
export const ENDSEQVOL3SND3____header_global_a32464c41f6a03a9 = ((((((30) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_260918cf365b1c63be7ac7af() {
  return __cxx_static_address_260918cf365b1c63be7ac7af.reference || (__cxx_static_address_260918cf365b1c63be7ac7af.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND3____header_global_a32464c41f6a03a9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:70
export const DUKE_CRACK____header_global_2944c4eea96adf60 = ((((((33) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b7909f3d41a9f92c49dfa060() {
  return __cxx_static_address_b7909f3d41a9f92c49dfa060.reference || (__cxx_static_address_b7909f3d41a9f92c49dfa060.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK____header_global_2944c4eea96adf60; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:71
export const SLIM_ATTACK____header_global_1bfdc71036191cc9 = ((((((34) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_37a428d1b8eb18d7b94590a7() {
  return __cxx_static_address_37a428d1b8eb18d7b94590a7.reference || (__cxx_static_address_37a428d1b8eb18d7b94590a7.reference = {
    __cReference: true,
    get value() { return SLIM_ATTACK____header_global_1bfdc71036191cc9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:72
export const SOMETHINGHITFORCE____header_global_26fe5c50427a3e5b = ((((((35) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f6dfc8fd934efd01f3613e9f() {
  return __cxx_static_address_f6dfc8fd934efd01f3613e9f.reference || (__cxx_static_address_f6dfc8fd934efd01f3613e9f.reference = {
    __cReference: true,
    get value() { return SOMETHINGHITFORCE____header_global_26fe5c50427a3e5b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:73
export const DUKE_DRINKING____header_global_f00cca731073118f = ((((((36) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0483e44bd339643d8ad97efb() {
  return __cxx_static_address_0483e44bd339643d8ad97efb.reference || (__cxx_static_address_0483e44bd339643d8ad97efb.reference = {
    __cReference: true,
    get value() { return DUKE_DRINKING____header_global_f00cca731073118f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:74
export const DUKE_GRUNT____header_global_e18e923e2419f3ef = ((((((38) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0d6ced61cd558f9ebaf4f8ed() {
  return __cxx_static_address_0d6ced61cd558f9ebaf4f8ed.reference || (__cxx_static_address_0d6ced61cd558f9ebaf4f8ed.reference = {
    __cReference: true,
    get value() { return DUKE_GRUNT____header_global_e18e923e2419f3ef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:75
export const DUKE_HARTBEAT____header_global_f123f467d599ea8a = ((((((39) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_421eecce8acb5af11c8328e0() {
  return __cxx_static_address_421eecce8acb5af11c8328e0.reference || (__cxx_static_address_421eecce8acb5af11c8328e0.reference = {
    __cReference: true,
    get value() { return DUKE_HARTBEAT____header_global_f123f467d599ea8a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:76
export const DUKE_ONWATER____header_global_e28358601642d17a = ((((((40) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5d5993f71c11dbf5494dd7da() {
  return __cxx_static_address_5d5993f71c11dbf5494dd7da.reference || (__cxx_static_address_5d5993f71c11dbf5494dd7da.reference = {
    __cReference: true,
    get value() { return DUKE_ONWATER____header_global_e28358601642d17a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:77
export const DUKE_LAND____header_global_3741ce8759a0041c = ((((((42) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e9e4cd6a6fbc2a8c89a23115() {
  return __cxx_static_address_e9e4cd6a6fbc2a8c89a23115.reference || (__cxx_static_address_e9e4cd6a6fbc2a8c89a23115.reference = {
    __cReference: true,
    get value() { return DUKE_LAND____header_global_3741ce8759a0041c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:78
export const DUKE_WALKINDUCTS____header_global_a04abdae907c565d = ((((((43) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e240728866430e9ba57e91c6() {
  return __cxx_static_address_e240728866430e9ba57e91c6.reference || (__cxx_static_address_e240728866430e9ba57e91c6.reference = {
    __cReference: true,
    get value() { return DUKE_WALKINDUCTS____header_global_a04abdae907c565d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:79
export const DUKE_UNDERWATER____header_global_dc4521a2cc203ba1 = ((((((48) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_42feab70b0549ffdbe5fd2d5() {
  return __cxx_static_address_42feab70b0549ffdbe5fd2d5.reference || (__cxx_static_address_42feab70b0549ffdbe5fd2d5.reference = {
    __cReference: true,
    get value() { return DUKE_UNDERWATER____header_global_dc4521a2cc203ba1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:80
export const DUKE_JETPACK_ON____header_global_d78ba5e972ccd50b = ((((((49) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bc7e01cfbcc00a2cba0d5f0b() {
  return __cxx_static_address_bc7e01cfbcc00a2cba0d5f0b.reference || (__cxx_static_address_bc7e01cfbcc00a2cba0d5f0b.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_ON____header_global_d78ba5e972ccd50b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:81
export const DUKE_JETPACK_IDLE____header_global_06e8e94f17ae0374 = ((((((50) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_20a3e74ca4a4bd873c55ecf1() {
  return __cxx_static_address_20a3e74ca4a4bd873c55ecf1.reference || (__cxx_static_address_20a3e74ca4a4bd873c55ecf1.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_IDLE____header_global_06e8e94f17ae0374; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:82
export const DUKE_JETPACK_OFF____header_global_8af28cd9eeead6c1 = ((((((51) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_92d3c605dc88b5e28ecf96f9() {
  return __cxx_static_address_92d3c605dc88b5e28ecf96f9.reference || (__cxx_static_address_92d3c605dc88b5e28ecf96f9.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_OFF____header_global_8af28cd9eeead6c1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:83
export const DUKETALKTOBOSS____header_global_cb923352bae650b1 = ((((((56) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a3a5a10a656a72944f90d021() {
  return __cxx_static_address_a3a5a10a656a72944f90d021.reference || (__cxx_static_address_a3a5a10a656a72944f90d021.reference = {
    __cReference: true,
    get value() { return DUKETALKTOBOSS____header_global_cb923352bae650b1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:84
export const SQUISHED____header_global_d3b42ce288af522c = ((((((69) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d043ec47e0167f3d980e4ce3() {
  return __cxx_static_address_d043ec47e0167f3d980e4ce3.reference || (__cxx_static_address_d043ec47e0167f3d980e4ce3.reference = {
    __cReference: true,
    get value() { return SQUISHED____header_global_d3b42ce288af522c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:85
export const TELEPORTER____header_global_9a1d04feccfeaccf = ((((((70) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bcbaf788bb1cee5f3c6c43f7() {
  return __cxx_static_address_bcbaf788bb1cee5f3c6c43f7.reference || (__cxx_static_address_bcbaf788bb1cee5f3c6c43f7.reference = {
    __cReference: true,
    get value() { return TELEPORTER____header_global_9a1d04feccfeaccf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:86
export const ELEVATOR_ON____header_global_5f2532c895e7c812 = ((((((71) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f1cf27d13713427b61fdc402() {
  return __cxx_static_address_f1cf27d13713427b61fdc402.reference || (__cxx_static_address_f1cf27d13713427b61fdc402.reference = {
    __cReference: true,
    get value() { return ELEVATOR_ON____header_global_5f2532c895e7c812; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:87
export const ELEVATOR_OFF____header_global_6e18d0d536551567 = ((((((73) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f69690d9cbf4c4222287febb() {
  return __cxx_static_address_f69690d9cbf4c4222287febb.reference || (__cxx_static_address_f69690d9cbf4c4222287febb.reference = {
    __cReference: true,
    get value() { return ELEVATOR_OFF____header_global_6e18d0d536551567; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:88
export const SUBWAY____header_global_517a9926d0e56285 = ((((((75) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_173b4897f926f1a017d0bd8e() {
  return __cxx_static_address_173b4897f926f1a017d0bd8e.reference || (__cxx_static_address_173b4897f926f1a017d0bd8e.reference = {
    __cReference: true,
    get value() { return SUBWAY____header_global_517a9926d0e56285; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:89
export const SWITCH_ON____header_global_af204766e531e7b2 = ((((((76) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9e1043cf24ac8e5a495327f3() {
  return __cxx_static_address_9e1043cf24ac8e5a495327f3.reference || (__cxx_static_address_9e1043cf24ac8e5a495327f3.reference = {
    __cReference: true,
    get value() { return SWITCH_ON____header_global_af204766e531e7b2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:90
export const FLUSH_TOILET____header_global_8af63e7b9f095ae3 = ((((((79) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4ec2f33ccb020d9dd2f16e54() {
  return __cxx_static_address_4ec2f33ccb020d9dd2f16e54.reference || (__cxx_static_address_4ec2f33ccb020d9dd2f16e54.reference = {
    __cReference: true,
    get value() { return FLUSH_TOILET____header_global_8af63e7b9f095ae3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:91
export const EARTHQUAKE____header_global_b66d68234463a8f8 = ((((((81) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8e9044aec49bd5974efb9d29() {
  return __cxx_static_address_8e9044aec49bd5974efb9d29.reference || (__cxx_static_address_8e9044aec49bd5974efb9d29.reference = {
    __cReference: true,
    get value() { return EARTHQUAKE____header_global_b66d68234463a8f8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:92
export const END_OF_LEVEL_WARN____header_global_0f85bc6831d55475 = ((((((83) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_04b38cf1e3718fcf50175d84() {
  return __cxx_static_address_04b38cf1e3718fcf50175d84.reference || (__cxx_static_address_04b38cf1e3718fcf50175d84.reference = {
    __cReference: true,
    get value() { return END_OF_LEVEL_WARN____header_global_0f85bc6831d55475; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:93
export const WIND_AMBIENCE____header_global_17036b4af868258e = ((((((91) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_23be8ebb764d1b451a9e1e7c() {
  return __cxx_static_address_23be8ebb764d1b451a9e1e7c.reference || (__cxx_static_address_23be8ebb764d1b451a9e1e7c.reference = {
    __cReference: true,
    get value() { return WIND_AMBIENCE____header_global_17036b4af868258e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:94
export const SOMETHING_DRIPPING____header_global_2b1607deb0a4def2 = ((((((92) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e769095a2b68df5599c68a6c() {
  return __cxx_static_address_e769095a2b68df5599c68a6c.reference || (__cxx_static_address_e769095a2b68df5599c68a6c.reference = {
    __cReference: true,
    get value() { return SOMETHING_DRIPPING____header_global_2b1607deb0a4def2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:95
export const BOS1_RECOG____header_global_598350712a04031e = ((((((97) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_67385954a8146f32cc34fc47() {
  return __cxx_static_address_67385954a8146f32cc34fc47.reference || (__cxx_static_address_67385954a8146f32cc34fc47.reference = {
    __cReference: true,
    get value() { return BOS1_RECOG____header_global_598350712a04031e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:96
export const BOS2_RECOG____header_global_7c9df54b6fce249f = ((((((102) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d0b40bc77afd5ccfaddf2088() {
  return __cxx_static_address_d0b40bc77afd5ccfaddf2088.reference || (__cxx_static_address_d0b40bc77afd5ccfaddf2088.reference = {
    __cReference: true,
    get value() { return BOS2_RECOG____header_global_7c9df54b6fce249f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:97
export const DUKE_GETWEAPON2____header_global_fd1fbd8a6e621ff2 = ((((((107) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_563a7102f1e942c38fcfeabc() {
  return __cxx_static_address_563a7102f1e942c38fcfeabc.reference || (__cxx_static_address_563a7102f1e942c38fcfeabc.reference = {
    __cReference: true,
    get value() { return DUKE_GETWEAPON2____header_global_fd1fbd8a6e621ff2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:98
export const SHOTGUN_FIRE____header_global_d4524e917fd717c7 = ((((((109) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e45c21534329f792a40fed09() {
  return __cxx_static_address_e45c21534329f792a40fed09.reference || (__cxx_static_address_e45c21534329f792a40fed09.reference = {
    __cReference: true,
    get value() { return SHOTGUN_FIRE____header_global_d4524e917fd717c7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:99
export const PRED_RECOG____header_global_8a9d3887651a0d2b = ((((((111) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_209e9f7fdab29f36734752d6() {
  return __cxx_static_address_209e9f7fdab29f36734752d6.reference || (__cxx_static_address_209e9f7fdab29f36734752d6.reference = {
    __cReference: true,
    get value() { return PRED_RECOG____header_global_8a9d3887651a0d2b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:100
export const CAPT_RECOG____header_global_f6d86a630ca3f325 = ((((((117) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cb672131009630475e0bc86a() {
  return __cxx_static_address_cb672131009630475e0bc86a.reference || (__cxx_static_address_cb672131009630475e0bc86a.reference = {
    __cReference: true,
    get value() { return CAPT_RECOG____header_global_f6d86a630ca3f325; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:101
export const PIG_RECOG____header_global_7a198d544dd63c93 = ((((((121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1ab1d0040bb142456605b337() {
  return __cxx_static_address_1ab1d0040bb142456605b337.reference || (__cxx_static_address_1ab1d0040bb142456605b337.reference = {
    __cReference: true,
    get value() { return PIG_RECOG____header_global_7a198d544dd63c93; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:102
export const RECO_ROAM____header_global_d7ecf08773c39174 = ((((((125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_491853cf78a4473396b07fc8() {
  return __cxx_static_address_491853cf78a4473396b07fc8.reference || (__cxx_static_address_491853cf78a4473396b07fc8.reference = {
    __cReference: true,
    get value() { return RECO_ROAM____header_global_d7ecf08773c39174; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:103
export const RECO_RECOG____header_global_8a3573d35cff2b65 = ((((((126) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2aaff247ecb522ca5ce6b0cd() {
  return __cxx_static_address_2aaff247ecb522ca5ce6b0cd.reference || (__cxx_static_address_2aaff247ecb522ca5ce6b0cd.reference = {
    __cReference: true,
    get value() { return RECO_RECOG____header_global_8a3573d35cff2b65; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:104
export const RECO_ATTACK____header_global_47673113fe019231 = ((((((127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3e67089de2680326a6f8b439() {
  return __cxx_static_address_3e67089de2680326a6f8b439.reference || (__cxx_static_address_3e67089de2680326a6f8b439.reference = {
    __cReference: true,
    get value() { return RECO_ATTACK____header_global_47673113fe019231; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:105
export const RECO_PAIN____header_global_1496c5755b0d1a14 = ((((((128) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_25a4c7b8801082022415b1dd() {
  return __cxx_static_address_25a4c7b8801082022415b1dd.reference || (__cxx_static_address_25a4c7b8801082022415b1dd.reference = {
    __cReference: true,
    get value() { return RECO_PAIN____header_global_1496c5755b0d1a14; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:106
export const DRON_RECOG____header_global_01533dace58daf36 = ((((((131) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_762b25d78cb889843b84951e() {
  return __cxx_static_address_762b25d78cb889843b84951e.reference || (__cxx_static_address_762b25d78cb889843b84951e.reference = {
    __cReference: true,
    get value() { return DRON_RECOG____header_global_01533dace58daf36; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:107
export const COMM_RECOG____header_global_75e91e20953bd030 = ((((((136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1f390e5692b3e165f888b8bb() {
  return __cxx_static_address_1f390e5692b3e165f888b8bb.reference || (__cxx_static_address_1f390e5692b3e165f888b8bb.reference = {
    __cReference: true,
    get value() { return COMM_RECOG____header_global_75e91e20953bd030; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:108
export const OCTA_RECOG____header_global_e269e08a551a679f = ((((((141) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b24058bd44a7cc108e16344c() {
  return __cxx_static_address_b24058bd44a7cc108e16344c.reference || (__cxx_static_address_b24058bd44a7cc108e16344c.reference = {
    __cReference: true,
    get value() { return OCTA_RECOG____header_global_e269e08a551a679f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:109
export const TURR_RECOG____header_global_d896697ea8df314b = ((((((146) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c40082975210c1613183dce3() {
  return __cxx_static_address_c40082975210c1613183dce3.reference || (__cxx_static_address_c40082975210c1613183dce3.reference = {
    __cReference: true,
    get value() { return TURR_RECOG____header_global_d896697ea8df314b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:110
export const SLIM_DYING____header_global_7c1006ce8e21cfa9 = ((((((149) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d178f5893ef1b41c9f80e9be() {
  return __cxx_static_address_d178f5893ef1b41c9f80e9be.reference || (__cxx_static_address_d178f5893ef1b41c9f80e9be.reference = {
    __cReference: true,
    get value() { return SLIM_DYING____header_global_7c1006ce8e21cfa9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:111
export const BOS3_RECOG____header_global_a968c9282f6f9b61 = ((((((151) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cfd53ee9c99c63da48f0850e() {
  return __cxx_static_address_cfd53ee9c99c63da48f0850e.reference || (__cxx_static_address_cfd53ee9c99c63da48f0850e.reference = {
    __cReference: true,
    get value() { return BOS3_RECOG____header_global_a968c9282f6f9b61; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:112
export const BOS1_WALK____header_global_aff478552c951cbf = ((((((156) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a61a60c3fe9295a2f06cb385() {
  return __cxx_static_address_a61a60c3fe9295a2f06cb385.reference || (__cxx_static_address_a61a60c3fe9295a2f06cb385.reference = {
    __cReference: true,
    get value() { return BOS1_WALK____header_global_aff478552c951cbf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:113
export const THUD____header_global_aca1edebc3133bb4 = ((((((158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_96c403537fe0f4a22c26a029() {
  return __cxx_static_address_96c403537fe0f4a22c26a029.reference || (__cxx_static_address_96c403537fe0f4a22c26a029.reference = {
    __cReference: true,
    get value() { return THUD____header_global_aca1edebc3133bb4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:114
export const WIERDSHOT_FLY____header_global_e3f882257dce396c = ((((((160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_640f19aa1c2001ae98b7f133() {
  return __cxx_static_address_640f19aa1c2001ae98b7f133.reference || (__cxx_static_address_640f19aa1c2001ae98b7f133.reference = {
    __cReference: true,
    get value() { return WIERDSHOT_FLY____header_global_e3f882257dce396c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:115
export const SLIM_ROAM____header_global_2103c6a50c773074 = ((((((163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f67fc32d6d3c744df1dd8bfd() {
  return __cxx_static_address_f67fc32d6d3c744df1dd8bfd.reference || (__cxx_static_address_f67fc32d6d3c744df1dd8bfd.reference = {
    __cReference: true,
    get value() { return SLIM_ROAM____header_global_2103c6a50c773074; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:116
export const SHOTGUN_COCK____header_global_62e2e129d3451135 = ((((((169) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_34888f10790d3171dc809f5d() {
  return __cxx_static_address_34888f10790d3171dc809f5d.reference || (__cxx_static_address_34888f10790d3171dc809f5d.reference = {
    __cReference: true,
    get value() { return SHOTGUN_COCK____header_global_62e2e129d3451135; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:117
export const GENERIC_AMBIENCE17____header_global_d010c6e621f8ee80 = ((((((177) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8ea53b8094925bd7f9acde28() {
  return __cxx_static_address_8ea53b8094925bd7f9acde28.reference || (__cxx_static_address_8ea53b8094925bd7f9acde28.reference = {
    __cReference: true,
    get value() { return GENERIC_AMBIENCE17____header_global_d010c6e621f8ee80; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:118
export const BONUS_SPEECH1____header_global_d355c398f7a67422 = ((((((195) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_faf8ff2941f1037c6e624427() {
  return __cxx_static_address_faf8ff2941f1037c6e624427.reference || (__cxx_static_address_faf8ff2941f1037c6e624427.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH1____header_global_d355c398f7a67422; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:119
export const BONUS_SPEECH2____header_global_f7f7a24c749cca52 = ((((((196) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9e200a5ec2c775c435d0c799() {
  return __cxx_static_address_9e200a5ec2c775c435d0c799.reference || (__cxx_static_address_9e200a5ec2c775c435d0c799.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH2____header_global_f7f7a24c749cca52; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:120
export const BONUS_SPEECH3____header_global_5f2dd3ae0b0b7d1e = ((((((197) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3f2fd2764b8f747d95b1f1ee() {
  return __cxx_static_address_3f2fd2764b8f747d95b1f1ee.reference || (__cxx_static_address_3f2fd2764b8f747d95b1f1ee.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH3____header_global_5f2dd3ae0b0b7d1e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:121
export const BONUS_SPEECH4____header_global_832599a0089113d2 = ((((((199) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6275f931c2883494082fb707() {
  return __cxx_static_address_6275f931c2883494082fb707.reference || (__cxx_static_address_6275f931c2883494082fb707.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH4____header_global_832599a0089113d2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:122
export const DUKE_LAND_HURT____header_global_16d3a8e66db83175 = ((((((200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_68ffb79b4d032947a11848f4() {
  return __cxx_static_address_68ffb79b4d032947a11848f4.reference || (__cxx_static_address_68ffb79b4d032947a11848f4.reference = {
    __cReference: true,
    get value() { return DUKE_LAND_HURT____header_global_16d3a8e66db83175; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:123
export const DUKE_SEARCH2____header_global_0117086788095e4b = ((((((207) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3726b35934f0d712b9f7467c() {
  return __cxx_static_address_3726b35934f0d712b9f7467c.reference || (__cxx_static_address_3726b35934f0d712b9f7467c.reference = {
    __cReference: true,
    get value() { return DUKE_SEARCH2____header_global_0117086788095e4b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:124
export const DUKE_CRACK2____header_global_9e2b2c98832e63f0 = ((((((208) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f6a3b36f55fa3549ceb80101() {
  return __cxx_static_address_f6a3b36f55fa3549ceb80101.reference || (__cxx_static_address_f6a3b36f55fa3549ceb80101.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK2____header_global_9e2b2c98832e63f0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:125
export const DUKE_SEARCH____header_global_1cb9122b91bafa77 = ((((((209) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_141f9f87e066c443f7967a35() {
  return __cxx_static_address_141f9f87e066c443f7967a35.reference || (__cxx_static_address_141f9f87e066c443f7967a35.reference = {
    __cReference: true,
    get value() { return DUKE_SEARCH____header_global_1cb9122b91bafa77; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:126
export const DUKE_GET____header_global_00e5ba56658e4c66 = ((((((210) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ba0f0a6a67951fb21053a766() {
  return __cxx_static_address_ba0f0a6a67951fb21053a766.reference || (__cxx_static_address_ba0f0a6a67951fb21053a766.reference = {
    __cReference: true,
    get value() { return DUKE_GET____header_global_00e5ba56658e4c66; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:127
export const DUKE_LONGTERM_PAIN____header_global_1a4040f337f39932 = ((((((211) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_94d098f12acb6bdf9d6d8020() {
  return __cxx_static_address_94d098f12acb6bdf9d6d8020.reference || (__cxx_static_address_94d098f12acb6bdf9d6d8020.reference = {
    __cReference: true,
    get value() { return DUKE_LONGTERM_PAIN____header_global_1a4040f337f39932; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:128
export const MONITOR_ACTIVE____header_global_63e6855d752a20fc = ((((((212) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c8a5c2221b0eb869fa150170() {
  return __cxx_static_address_c8a5c2221b0eb869fa150170.reference || (__cxx_static_address_c8a5c2221b0eb869fa150170.reference = {
    __cReference: true,
    get value() { return MONITOR_ACTIVE____header_global_63e6855d752a20fc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:129
export const NITEVISION_ONOFF____header_global_d7446f369170d3fc = ((((((213) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_60e9d9c9b3d8f3fe87b8be45() {
  return __cxx_static_address_60e9d9c9b3d8f3fe87b8be45.reference || (__cxx_static_address_60e9d9c9b3d8f3fe87b8be45.reference = {
    __cReference: true,
    get value() { return NITEVISION_ONOFF____header_global_d7446f369170d3fc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:130
export const DUKE_CRACK_FIRST____header_global_bb8d8a7ffbfa7f6b = ((((((215) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_60a81d9965cc3a5595667c6a() {
  return __cxx_static_address_60a81d9965cc3a5595667c6a.reference || (__cxx_static_address_60a81d9965cc3a5595667c6a.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK_FIRST____header_global_bb8d8a7ffbfa7f6b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:131
export const DUKE_USEMEDKIT____header_global_9af865e30b5c4bd5 = ((((((216) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c51b81aab5f39dd515009e6e() {
  return __cxx_static_address_c51b81aab5f39dd515009e6e.reference || (__cxx_static_address_c51b81aab5f39dd515009e6e.reference = {
    __cReference: true,
    get value() { return DUKE_USEMEDKIT____header_global_9af865e30b5c4bd5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:132
export const DUKE_TAKEPILLS____header_global_3e2cb617f888e930 = ((((((217) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1ba90bb1c82cb1181b0c39dd() {
  return __cxx_static_address_1ba90bb1c82cb1181b0c39dd.reference || (__cxx_static_address_1ba90bb1c82cb1181b0c39dd.reference = {
    __cReference: true,
    get value() { return DUKE_TAKEPILLS____header_global_3e2cb617f888e930; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:133
export const DUKE_PISSRELIEF____header_global_44a2cfc097173786 = ((((((218) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f37e3e661cca5e6ce4cd0fc1() {
  return __cxx_static_address_f37e3e661cca5e6ce4cd0fc1.reference || (__cxx_static_address_f37e3e661cca5e6ce4cd0fc1.reference = {
    __cReference: true,
    get value() { return DUKE_PISSRELIEF____header_global_44a2cfc097173786; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:134
export const SELECT_WEAPON____header_global_f6541281a98027e4 = ((((((219) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8b3def071972a580edbe910d() {
  return __cxx_static_address_8b3def071972a580edbe910d.reference || (__cxx_static_address_8b3def071972a580edbe910d.reference = {
    __cReference: true,
    get value() { return SELECT_WEAPON____header_global_f6541281a98027e4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:135
export const JIBBED_ACTOR5____header_global_24b9e5b3db862969 = ((((((226) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_daf509167e9eab2e94aecb12() {
  return __cxx_static_address_daf509167e9eab2e94aecb12.reference || (__cxx_static_address_daf509167e9eab2e94aecb12.reference = {
    __cReference: true,
    get value() { return JIBBED_ACTOR5____header_global_24b9e5b3db862969; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:136
export const JIBBED_ACTOR6____header_global_0371223a6d0d5720 = ((((((227) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cd04f6deb8196c5b27e8900f() {
  return __cxx_static_address_cd04f6deb8196c5b27e8900f.reference || (__cxx_static_address_cd04f6deb8196c5b27e8900f.reference = {
    __cReference: true,
    get value() { return JIBBED_ACTOR6____header_global_0371223a6d0d5720; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:137
export const DUKE_GOTHEALTHATLOW____header_global_9e545b898f382aee = ((((((229) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c0feca59ae147b2d62d9dc78() {
  return __cxx_static_address_c0feca59ae147b2d62d9dc78.reference || (__cxx_static_address_c0feca59ae147b2d62d9dc78.reference = {
    __cReference: true,
    get value() { return DUKE_GOTHEALTHATLOW____header_global_9e545b898f382aee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:138
export const BOSSTALKTODUKE____header_global_589123453fa56581 = ((((((230) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ce459c2532a1e5855899be90() {
  return __cxx_static_address_ce459c2532a1e5855899be90.reference || (__cxx_static_address_ce459c2532a1e5855899be90.reference = {
    __cReference: true,
    get value() { return BOSSTALKTODUKE____header_global_589123453fa56581; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:139
export const WAR_AMBIENCE2____header_global_d29f407b145dccf0 = ((((((232) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dbdc151d47259fb5d7f42000() {
  return __cxx_static_address_dbdc151d47259fb5d7f42000.reference || (__cxx_static_address_dbdc151d47259fb5d7f42000.reference = {
    __cReference: true,
    get value() { return WAR_AMBIENCE2____header_global_d29f407b145dccf0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:140
export const EXITMENUSOUND____header_global_5bd907b66401e3d0 = ((((((243) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_91d2d5262b38943863a40f21() {
  return __cxx_static_address_91d2d5262b38943863a40f21.reference || (__cxx_static_address_91d2d5262b38943863a40f21.reference = {
    __cReference: true,
    get value() { return EXITMENUSOUND____header_global_5bd907b66401e3d0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:141
export const FLY_BY____header_global_bd72b1b095e364e3 = ((((((244) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f7315dc8ad3a5700929f75a1() {
  return __cxx_static_address_f7315dc8ad3a5700929f75a1.reference || (__cxx_static_address_f7315dc8ad3a5700929f75a1.reference = {
    __cReference: true,
    get value() { return FLY_BY____header_global_bd72b1b095e364e3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:142
export const DUKE_SCREAM____header_global_d71667185e29cfcc = ((((((245) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b08cda8186c4c3c1e88435b5() {
  return __cxx_static_address_b08cda8186c4c3c1e88435b5.reference || (__cxx_static_address_b08cda8186c4c3c1e88435b5.reference = {
    __cReference: true,
    get value() { return DUKE_SCREAM____header_global_d71667185e29cfcc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:143
export const SHRINKER_HIT____header_global_93654aaed39f219e = ((((((246) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fa62c73a67be6aacd7e83d07() {
  return __cxx_static_address_fa62c73a67be6aacd7e83d07.reference || (__cxx_static_address_fa62c73a67be6aacd7e83d07.reference = {
    __cReference: true,
    get value() { return SHRINKER_HIT____header_global_93654aaed39f219e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:144
export const RATTY____header_global_347eca202efc41fe = ((((((247) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_63010b35772e5ebd8d7b5dd6() {
  return __cxx_static_address_63010b35772e5ebd8d7b5dd6.reference || (__cxx_static_address_63010b35772e5ebd8d7b5dd6.reference = {
    __cReference: true,
    get value() { return RATTY____header_global_347eca202efc41fe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:145
export const BONUSMUSIC____header_global_fe925347e22bb1f9 = ((((((249) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f6af7d5ce3da570e408a2004() {
  return __cxx_static_address_f6af7d5ce3da570e408a2004.reference || (__cxx_static_address_f6af7d5ce3da570e408a2004.reference = {
    __cReference: true,
    get value() { return BONUSMUSIC____header_global_fe925347e22bb1f9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:146
export const DUKE_GETWEAPON6____header_global_6d6ea885337a29ab = ((((((264) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_00e22e78a80c1f6882062bdd() {
  return __cxx_static_address_00e22e78a80c1f6882062bdd.reference || (__cxx_static_address_00e22e78a80c1f6882062bdd.reference = {
    __cReference: true,
    get value() { return DUKE_GETWEAPON6____header_global_6d6ea885337a29ab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:147
export const ALIEN_SWITCH1____header_global_ea8dbf8142911bf0 = ((((((272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_02cfa4f25a47f6a0bc2e983c() {
  return __cxx_static_address_02cfa4f25a47f6a0bc2e983c.reference || (__cxx_static_address_02cfa4f25a47f6a0bc2e983c.reference = {
    __cReference: true,
    get value() { return ALIEN_SWITCH1____header_global_ea8dbf8142911bf0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:148
export const RIPHEADNECK____header_global_88bf5f522c83bb75 = ((((((284) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_569681d373484d9f42f7e3d9() {
  return __cxx_static_address_569681d373484d9f42f7e3d9.reference || (__cxx_static_address_569681d373484d9f42f7e3d9.reference = {
    __cReference: true,
    get value() { return RIPHEADNECK____header_global_88bf5f522c83bb75; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:149
export const ENDSEQVOL3SND4____header_global_9149f539a3a93dfa = ((((((288) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a7f51562480036a68e5f4775() {
  return __cxx_static_address_a7f51562480036a68e5f4775.reference || (__cxx_static_address_a7f51562480036a68e5f4775.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND4____header_global_9149f539a3a93dfa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:150
export const ENDSEQVOL3SND5____header_global_ec369bec63112a85 = ((((((289) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0c99d1429102a5713cc11824() {
  return __cxx_static_address_0c99d1429102a5713cc11824.reference || (__cxx_static_address_0c99d1429102a5713cc11824.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND5____header_global_ec369bec63112a85; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:151
export const ENDSEQVOL3SND6____header_global_d5118d5ba4aa7e0e = ((((((290) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1801e6443b8c4a9030725c18() {
  return __cxx_static_address_1801e6443b8c4a9030725c18.reference || (__cxx_static_address_1801e6443b8c4a9030725c18.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND6____header_global_d5118d5ba4aa7e0e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:152
export const ENDSEQVOL3SND7____header_global_1fab9a66cc339b9c = ((((((291) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_da986214503bfbee7649a8b2() {
  return __cxx_static_address_da986214503bfbee7649a8b2.reference || (__cxx_static_address_da986214503bfbee7649a8b2.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND7____header_global_1fab9a66cc339b9c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:153
export const ENDSEQVOL3SND8____header_global_2bec4da9f9cf718d = ((((((292) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4c9e335ceb66aa9b5ec6f313() {
  return __cxx_static_address_4c9e335ceb66aa9b5ec6f313.reference || (__cxx_static_address_4c9e335ceb66aa9b5ec6f313.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND8____header_global_2bec4da9f9cf718d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:154
export const ENDSEQVOL3SND9____header_global_14c140719b714346 = ((((((293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_482ef61a7bf9d605dac65745() {
  return __cxx_static_address_482ef61a7bf9d605dac65745.reference || (__cxx_static_address_482ef61a7bf9d605dac65745.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND9____header_global_14c140719b714346; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:155
export const WHIPYOURASS____header_global_9b815af3df9df9bf = ((((((294) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_449b8ae3856a6748d825ea85() {
  return __cxx_static_address_449b8ae3856a6748d825ea85.reference || (__cxx_static_address_449b8ae3856a6748d825ea85.reference = {
    __cReference: true,
    get value() { return WHIPYOURASS____header_global_9b815af3df9df9bf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:156
export const ENDSEQVOL2SND1____header_global_10b91ff3dc8fe279 = ((((((295) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f7e1eebc8e9d0c94532eb5a8() {
  return __cxx_static_address_f7e1eebc8e9d0c94532eb5a8.reference || (__cxx_static_address_f7e1eebc8e9d0c94532eb5a8.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND1____header_global_10b91ff3dc8fe279; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:157
export const ENDSEQVOL2SND2____header_global_1b10db9af6d19822 = ((((((296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_581f4916a96dbf902120a5fb() {
  return __cxx_static_address_581f4916a96dbf902120a5fb.reference || (__cxx_static_address_581f4916a96dbf902120a5fb.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND2____header_global_1b10db9af6d19822; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:158
export const ENDSEQVOL2SND3____header_global_62f4c9d4b88712d0 = ((((((297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7db75eb57404f0a44bb9aca6() {
  return __cxx_static_address_7db75eb57404f0a44bb9aca6.reference || (__cxx_static_address_7db75eb57404f0a44bb9aca6.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND3____header_global_62f4c9d4b88712d0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:159
export const ENDSEQVOL2SND4____header_global_7f75980a25edc049 = ((((((298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ac988a35860ee297daa3267a() {
  return __cxx_static_address_ac988a35860ee297daa3267a.reference || (__cxx_static_address_ac988a35860ee297daa3267a.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND4____header_global_7f75980a25edc049; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:160
export const ENDSEQVOL2SND5____header_global_ab4afa8e87d2d4a6 = ((((((299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fe7f6885018e7a78d34564d4() {
  return __cxx_static_address_fe7f6885018e7a78d34564d4.reference || (__cxx_static_address_fe7f6885018e7a78d34564d4.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND5____header_global_ab4afa8e87d2d4a6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:161
export const ENDSEQVOL2SND6____header_global_90ea231e2a0e8e92 = ((((((300) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_42b65fc3d2b38e0fc09f1df1() {
  return __cxx_static_address_42b65fc3d2b38e0fc09f1df1.reference || (__cxx_static_address_42b65fc3d2b38e0fc09f1df1.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND6____header_global_90ea231e2a0e8e92; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:162
export const ENDSEQVOL2SND7____header_global_410d7739fb0e9de5 = ((((((301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_174383d8807c99785c44bf4c() {
  return __cxx_static_address_174383d8807c99785c44bf4c.reference || (__cxx_static_address_174383d8807c99785c44bf4c.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND7____header_global_410d7739fb0e9de5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:163
export const SOMETHINGFROZE____header_global_342fbfea551361ba = ((((((303) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_821fc493f6f7e76e397ec6d1() {
  return __cxx_static_address_821fc493f6f7e76e397ec6d1.reference || (__cxx_static_address_821fc493f6f7e76e397ec6d1.reference = {
    __cReference: true,
    get value() { return SOMETHINGFROZE____header_global_342fbfea551361ba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:164
export const WIND_REPEAT____header_global_d7ee1d80b5b2908a = ((((((308) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fa6c62f6206d279ea036ce49() {
  return __cxx_static_address_fa6c62f6206d279ea036ce49.reference || (__cxx_static_address_fa6c62f6206d279ea036ce49.reference = {
    __cReference: true,
    get value() { return WIND_REPEAT____header_global_d7ee1d80b5b2908a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:165
export const BOS4_RECOG____header_global_94c5fee286f3f179 = ((((((342) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a137844e67a65ccaf3b87661() {
  return __cxx_static_address_a137844e67a65ccaf3b87661.reference || (__cxx_static_address_a137844e67a65ccaf3b87661.reference = {
    __cReference: true,
    get value() { return BOS4_RECOG____header_global_94c5fee286f3f179; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:166
export const LIGHTNING_SLAP____header_global_b97c38dbe64b53b3 = ((((((351) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_db8c184268ba45519301393b() {
  return __cxx_static_address_db8c184268ba45519301393b.reference || (__cxx_static_address_db8c184268ba45519301393b.reference = {
    __cReference: true,
    get value() { return LIGHTNING_SLAP____header_global_b97c38dbe64b53b3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:167
export const THUNDER____header_global_ed069fed197afc59 = ((((((352) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_717850f2432c77fda144fd21() {
  return __cxx_static_address_717850f2432c77fda144fd21.reference || (__cxx_static_address_717850f2432c77fda144fd21.reference = {
    __cReference: true,
    get value() { return THUNDER____header_global_ed069fed197afc59; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:168
export const INTRO4_1____header_global_c702e4afe995abcc = ((((((363) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d43ace02a68354d08284b00e() {
  return __cxx_static_address_d43ace02a68354d08284b00e.reference || (__cxx_static_address_d43ace02a68354d08284b00e.reference = {
    __cReference: true,
    get value() { return INTRO4_1____header_global_c702e4afe995abcc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:169
export const INTRO4_2____header_global_191fc2094cecc9af = ((((((364) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8931894abce0eee90e0c1efe() {
  return __cxx_static_address_8931894abce0eee90e0c1efe.reference || (__cxx_static_address_8931894abce0eee90e0c1efe.reference = {
    __cReference: true,
    get value() { return INTRO4_2____header_global_191fc2094cecc9af; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:170
export const INTRO4_3____header_global_fd0bf391130440af = ((((((365) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e9c60e3f8fbb974cc8eb5fef() {
  return __cxx_static_address_e9c60e3f8fbb974cc8eb5fef.reference || (__cxx_static_address_e9c60e3f8fbb974cc8eb5fef.reference = {
    __cReference: true,
    get value() { return INTRO4_3____header_global_fd0bf391130440af; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:171
export const INTRO4_4____header_global_363858fe01b4e102 = ((((((366) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fd788a43bac1f09aa4775e92() {
  return __cxx_static_address_fd788a43bac1f09aa4775e92.reference || (__cxx_static_address_fd788a43bac1f09aa4775e92.reference = {
    __cReference: true,
    get value() { return INTRO4_4____header_global_363858fe01b4e102; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:172
export const INTRO4_5____header_global_1cf406e61ce59210 = ((((((367) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_26091007598a138c5f452a4a() {
  return __cxx_static_address_26091007598a138c5f452a4a.reference || (__cxx_static_address_26091007598a138c5f452a4a.reference = {
    __cReference: true,
    get value() { return INTRO4_5____header_global_1cf406e61ce59210; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:173
export const INTRO4_6____header_global_7da452688ad7b699 = ((((((368) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4088cb999c6b999170992ebb() {
  return __cxx_static_address_4088cb999c6b999170992ebb.reference || (__cxx_static_address_4088cb999c6b999170992ebb.reference = {
    __cReference: true,
    get value() { return INTRO4_6____header_global_7da452688ad7b699; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:174
export const BOSS4_DEADSPEECH____header_global_617fa39e762e1cc8 = ((((((370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_464de55538be5534ceba69c9() {
  return __cxx_static_address_464de55538be5534ceba69c9.reference || (__cxx_static_address_464de55538be5534ceba69c9.reference = {
    __cReference: true,
    get value() { return BOSS4_DEADSPEECH____header_global_617fa39e762e1cc8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:175
export const BOSS4_FIRSTSEE____header_global_57ed54481950bab8 = ((((((371) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e54b9fdae3384a8563b82da() {
  return __cxx_static_address_1e54b9fdae3384a8563b82da.reference || (__cxx_static_address_1e54b9fdae3384a8563b82da.reference = {
    __cReference: true,
    get value() { return BOSS4_FIRSTSEE____header_global_57ed54481950bab8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:176
export const VOL4ENDSND1____header_global_25ade9d56e6332d9 = ((((((384) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8dd8176a9d6072d2c79a7fc9() {
  return __cxx_static_address_8dd8176a9d6072d2c79a7fc9.reference || (__cxx_static_address_8dd8176a9d6072d2c79a7fc9.reference = {
    __cReference: true,
    get value() { return VOL4ENDSND1____header_global_25ade9d56e6332d9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:177
export const VOL4ENDSND2____header_global_053d90ed49236775 = ((((((385) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_149863ada318c60a9351a3fe() {
  return __cxx_static_address_149863ada318c60a9351a3fe.reference || (__cxx_static_address_149863ada318c60a9351a3fe.reference = {
    __cReference: true,
    get value() { return VOL4ENDSND2____header_global_053d90ed49236775; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:178
export const EXPANDERSHOOT____header_global_66d83c110775f9cd = ((((((388) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_494190f69c29c1b52cd9325d() {
  return __cxx_static_address_494190f69c29c1b52cd9325d.reference || (__cxx_static_address_494190f69c29c1b52cd9325d.reference = {
    __cReference: true,
    get value() { return EXPANDERSHOOT____header_global_66d83c110775f9cd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:179
export const INTRO4_B____header_global_5c9b1099c85d72bb = ((((((392) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_26a820ebbf9b7e2e0c535a59() {
  return __cxx_static_address_26a820ebbf9b7e2e0c535a59.reference || (__cxx_static_address_26a820ebbf9b7e2e0c535a59.reference = {
    __cReference: true,
    get value() { return INTRO4_B____header_global_5c9b1099c85d72bb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:180
export const BIGBANG____header_global_cb0ef5801776fcf7 = ((((((393) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f753d72921d1fb7725645655() {
  return __cxx_static_address_f753d72921d1fb7725645655.reference || (__cxx_static_address_f753d72921d1fb7725645655.reference = {
    __cReference: true,
    get value() { return BIGBANG____header_global_cb0ef5801776fcf7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:181
export const FLAMETHROWER_INTRO____header_global_9ba7d440e925f155 = ((((((398) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6456f0ce53a2dfe47f137659() {
  return __cxx_static_address_6456f0ce53a2dfe47f137659.reference || (__cxx_static_address_6456f0ce53a2dfe47f137659.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_INTRO____header_global_9ba7d440e925f155; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:182
export const FLAMETHROWER_LOOP____header_global_0264682f517080ae = ((((((399) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dcc497e9acc35b97dc9b1118() {
  return __cxx_static_address_dcc497e9acc35b97dc9b1118.reference || (__cxx_static_address_dcc497e9acc35b97dc9b1118.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_LOOP____header_global_0264682f517080ae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:183
export const FLAMETHROWER_END____header_global_bb6a942d6705ef33 = ((((((400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_568f6a6caf0ec8c541c72b3b() {
  return __cxx_static_address_568f6a6caf0ec8c541c72b3b.reference || (__cxx_static_address_568f6a6caf0ec8c541c72b3b.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_END____header_global_bb6a942d6705ef33; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:184
export const E5L7_DUKE_QUIT_YOU____header_global_29ada9baf41db050 = ((((((401) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_82f978cda80bb52db485da01() {
  return __cxx_static_address_82f978cda80bb52db485da01.reference || (__cxx_static_address_82f978cda80bb52db485da01.reference = {
    __cReference: true,
    get value() { return E5L7_DUKE_QUIT_YOU____header_global_29ada9baf41db050; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:187
export const SECTOREFFECTOR____header_global_1bd2221b3eb9cfcd = ((((((1) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e386f1b37cfbbcf62d5c7171() {
  return __cxx_static_address_e386f1b37cfbbcf62d5c7171.reference || (__cxx_static_address_e386f1b37cfbbcf62d5c7171.reference = {
    __cReference: true,
    get value() { return SECTOREFFECTOR____header_global_1bd2221b3eb9cfcd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:188
export const ACTIVATOR____header_global_c39991d823e8ff95 = ((((((2) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a4c6449d23911a50b42083fd() {
  return __cxx_static_address_a4c6449d23911a50b42083fd.reference || (__cxx_static_address_a4c6449d23911a50b42083fd.reference = {
    __cReference: true,
    get value() { return ACTIVATOR____header_global_c39991d823e8ff95; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:189
export const TOUCHPLATE____header_global_dd5d576c5819b563 = ((((((3) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_74402c01e309b5e5d8903c46() {
  return __cxx_static_address_74402c01e309b5e5d8903c46.reference || (__cxx_static_address_74402c01e309b5e5d8903c46.reference = {
    __cReference: true,
    get value() { return TOUCHPLATE____header_global_dd5d576c5819b563; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:190
export const ACTIVATORLOCKED____header_global_b3a2219c4e9674e5 = ((((((4) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8ce9cddc944249f0a9dd62f4() {
  return __cxx_static_address_8ce9cddc944249f0a9dd62f4.reference || (__cxx_static_address_8ce9cddc944249f0a9dd62f4.reference = {
    __cReference: true,
    get value() { return ACTIVATORLOCKED____header_global_b3a2219c4e9674e5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:191
export const MUSICANDSFX____header_global_a0cdb8e955657214 = ((((((5) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_23f59f4a1809bd170012f7a3() {
  return __cxx_static_address_23f59f4a1809bd170012f7a3.reference || (__cxx_static_address_23f59f4a1809bd170012f7a3.reference = {
    __cReference: true,
    get value() { return MUSICANDSFX____header_global_a0cdb8e955657214; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:192
export const LOCATORS____header_global_ff46b5a4ed515cf6 = ((((((6) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_afd8825b312db1b87c6eab5f() {
  return __cxx_static_address_afd8825b312db1b87c6eab5f.reference || (__cxx_static_address_afd8825b312db1b87c6eab5f.reference = {
    __cReference: true,
    get value() { return LOCATORS____header_global_ff46b5a4ed515cf6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:193
export const CYCLER____header_global_09feca04958e820c = ((((((7) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b047e95ed4990458ebb582b0() {
  return __cxx_static_address_b047e95ed4990458ebb582b0.reference || (__cxx_static_address_b047e95ed4990458ebb582b0.reference = {
    __cReference: true,
    get value() { return CYCLER____header_global_09feca04958e820c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:194
export const MASTERSWITCH____header_global_181714852c105b92 = ((((((8) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_baf8aae3560101768399324c() {
  return __cxx_static_address_baf8aae3560101768399324c.reference || (__cxx_static_address_baf8aae3560101768399324c.reference = {
    __cReference: true,
    get value() { return MASTERSWITCH____header_global_181714852c105b92; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:195
export const RESPAWN____header_global_c8c2c48f8c66db13 = ((((((9) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1ebfbb88ad83b914de03d309() {
  return __cxx_static_address_1ebfbb88ad83b914de03d309.reference || (__cxx_static_address_1ebfbb88ad83b914de03d309.reference = {
    __cReference: true,
    get value() { return RESPAWN____header_global_c8c2c48f8c66db13; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:196
export const GPSPEED____header_global_c0c527f9c3234e2e = ((((((10) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_65279f4ebc56992b42164776() {
  return __cxx_static_address_65279f4ebc56992b42164776.reference || (__cxx_static_address_65279f4ebc56992b42164776.reference = {
    __cReference: true,
    get value() { return GPSPEED____header_global_c0c527f9c3234e2e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:197
export const FOF____header_global_90f4fa4ac8e8b68a = ((((((13) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a809130d19b6475367598a87() {
  return __cxx_static_address_a809130d19b6475367598a87.reference || (__cxx_static_address_a809130d19b6475367598a87.reference = {
    __cReference: true,
    get value() { return FOF____header_global_90f4fa4ac8e8b68a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:198
export const ARROW____header_global_44a9dceffce61248 = ((((((20) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0675b3404eeb9e2d9e0a28cd() {
  return __cxx_static_address_0675b3404eeb9e2d9e0a28cd.reference || (__cxx_static_address_0675b3404eeb9e2d9e0a28cd.reference = {
    __cReference: true,
    get value() { return ARROW____header_global_44a9dceffce61248; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:199
export const FIRSTGUNSPRITE____header_global_f399efa96058f30f = ((((((21) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_093e8729a0ee9de73fe2b98c() {
  return __cxx_static_address_093e8729a0ee9de73fe2b98c.reference || (__cxx_static_address_093e8729a0ee9de73fe2b98c.reference = {
    __cReference: true,
    get value() { return FIRSTGUNSPRITE____header_global_f399efa96058f30f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:200
export const CHAINGUNSPRITE____header_global_15fd3793fd618230 = ((((((22) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f313de0f7cef16b4b020a444() {
  return __cxx_static_address_f313de0f7cef16b4b020a444.reference || (__cxx_static_address_f313de0f7cef16b4b020a444.reference = {
    __cReference: true,
    get value() { return CHAINGUNSPRITE____header_global_15fd3793fd618230; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:201
export const RPGSPRITE____header_global_15a857b384075f2e = ((((((23) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2c13293293ab7fdaf3f6492e() {
  return __cxx_static_address_2c13293293ab7fdaf3f6492e.reference || (__cxx_static_address_2c13293293ab7fdaf3f6492e.reference = {
    __cReference: true,
    get value() { return RPGSPRITE____header_global_15a857b384075f2e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:202
export const FREEZESPRITE____header_global_6e4cb690977d27ae = ((((((24) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ad0d840dcefa2f5a332297e8() {
  return __cxx_static_address_ad0d840dcefa2f5a332297e8.reference || (__cxx_static_address_ad0d840dcefa2f5a332297e8.reference = {
    __cReference: true,
    get value() { return FREEZESPRITE____header_global_6e4cb690977d27ae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:203
export const SHRINKERSPRITE____header_global_c988da696a48ea22 = ((((((25) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4f8cfbb4fc447b774d91fdeb() {
  return __cxx_static_address_4f8cfbb4fc447b774d91fdeb.reference || (__cxx_static_address_4f8cfbb4fc447b774d91fdeb.reference = {
    __cReference: true,
    get value() { return SHRINKERSPRITE____header_global_c988da696a48ea22; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:204
export const HEAVYHBOMB____header_global_1088de0215fdcf3e = ((((((26) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1568262723e3df148302cd70() {
  return __cxx_static_address_1568262723e3df148302cd70.reference || (__cxx_static_address_1568262723e3df148302cd70.reference = {
    __cReference: true,
    get value() { return HEAVYHBOMB____header_global_1088de0215fdcf3e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:205
export const TRIPBOMBSPRITE____header_global_f4f8ff9379f2aac4 = ((((((27) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5daca9e2a55d282b8461bc5f() {
  return __cxx_static_address_5daca9e2a55d282b8461bc5f.reference || (__cxx_static_address_5daca9e2a55d282b8461bc5f.reference = {
    __cReference: true,
    get value() { return TRIPBOMBSPRITE____header_global_f4f8ff9379f2aac4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:206
export const SHOTGUNSPRITE____header_global_1b741818859ec2c9 = ((((((28) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e4f5ad18637d7de50b803469() {
  return __cxx_static_address_e4f5ad18637d7de50b803469.reference || (__cxx_static_address_e4f5ad18637d7de50b803469.reference = {
    __cReference: true,
    get value() { return SHOTGUNSPRITE____header_global_1b741818859ec2c9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:207
export const DEVISTATORSPRITE____header_global_c0f3959ad092e6ec = ((((((29) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f6272bbedf5cf3c488483ad8() {
  return __cxx_static_address_f6272bbedf5cf3c488483ad8.reference || (__cxx_static_address_f6272bbedf5cf3c488483ad8.reference = {
    __cReference: true,
    get value() { return DEVISTATORSPRITE____header_global_c0f3959ad092e6ec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:208
export const HEALTHBOX____header_global_38b9b6e295b8b88d = ((((((30) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_51e5ca2c598131285b65a5e2() {
  return __cxx_static_address_51e5ca2c598131285b65a5e2.reference || (__cxx_static_address_51e5ca2c598131285b65a5e2.reference = {
    __cReference: true,
    get value() { return HEALTHBOX____header_global_38b9b6e295b8b88d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:209
export const AMMOBOX____header_global_1be15036ef904a19 = ((((((31) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_846afdc847c46171ed0505c7() {
  return __cxx_static_address_846afdc847c46171ed0505c7.reference || (__cxx_static_address_846afdc847c46171ed0505c7.reference = {
    __cReference: true,
    get value() { return AMMOBOX____header_global_1be15036ef904a19; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:210
export const GROWSPRITEICON____header_global_9f5cfae5cea66e80 = ((((((32) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_370c8e554596d56ee4bacc1f() {
  return __cxx_static_address_370c8e554596d56ee4bacc1f.reference || (__cxx_static_address_370c8e554596d56ee4bacc1f.reference = {
    __cReference: true,
    get value() { return GROWSPRITEICON____header_global_9f5cfae5cea66e80; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:211
export const INVENTORYBOX____header_global_76b3a92696cc7034 = ((((((33) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0a1f1fc48ce18289995b73a1() {
  return __cxx_static_address_0a1f1fc48ce18289995b73a1.reference || (__cxx_static_address_0a1f1fc48ce18289995b73a1.reference = {
    __cReference: true,
    get value() { return INVENTORYBOX____header_global_76b3a92696cc7034; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:212
export const FREEZEAMMO____header_global_e9154679846da6e7 = ((((((37) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_80feaa38569a70c3bca2aafe() {
  return __cxx_static_address_80feaa38569a70c3bca2aafe.reference || (__cxx_static_address_80feaa38569a70c3bca2aafe.reference = {
    __cReference: true,
    get value() { return FREEZEAMMO____header_global_e9154679846da6e7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:213
export const AMMO____header_global_728af4bc618edb76 = ((((((40) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9a39bd2a0b6f4b65500fa79b() {
  return __cxx_static_address_9a39bd2a0b6f4b65500fa79b.reference || (__cxx_static_address_9a39bd2a0b6f4b65500fa79b.reference = {
    __cReference: true,
    get value() { return AMMO____header_global_728af4bc618edb76; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:214
export const BATTERYAMMO____header_global_c4051a66c4f50247 = ((((((41) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4893aaf8338acaf3c2b242a2() {
  return __cxx_static_address_4893aaf8338acaf3c2b242a2.reference || (__cxx_static_address_4893aaf8338acaf3c2b242a2.reference = {
    __cReference: true,
    get value() { return BATTERYAMMO____header_global_c4051a66c4f50247; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:215
export const DEVISTATORAMMO____header_global_b18d025c6b9bf05a = ((((((42) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1b7e5778a734f66050e8afb1() {
  return __cxx_static_address_1b7e5778a734f66050e8afb1.reference || (__cxx_static_address_1b7e5778a734f66050e8afb1.reference = {
    __cReference: true,
    get value() { return DEVISTATORAMMO____header_global_b18d025c6b9bf05a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:216
export const RPGAMMO____header_global_fd3c2731795e0aa8 = ((((((44) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9a195ea7363cbb6770493ef8() {
  return __cxx_static_address_9a195ea7363cbb6770493ef8.reference || (__cxx_static_address_9a195ea7363cbb6770493ef8.reference = {
    __cReference: true,
    get value() { return RPGAMMO____header_global_fd3c2731795e0aa8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:217
export const GROWAMMO____header_global_e9a932f6ba09e61a = ((((((45) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d51dc429bb9226f990c146d7() {
  return __cxx_static_address_d51dc429bb9226f990c146d7.reference || (__cxx_static_address_d51dc429bb9226f990c146d7.reference = {
    __cReference: true,
    get value() { return GROWAMMO____header_global_e9a932f6ba09e61a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:218
export const CRYSTALAMMO____header_global_75f20f0d3ea897d7 = ((((((46) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fcf24aea142835e85e014988() {
  return __cxx_static_address_fcf24aea142835e85e014988.reference || (__cxx_static_address_fcf24aea142835e85e014988.reference = {
    __cReference: true,
    get value() { return CRYSTALAMMO____header_global_75f20f0d3ea897d7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:219
export const HBOMBAMMO____header_global_852c1ec80707e92f = ((((((47) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_01c7886c5f1235cffcdd5901() {
  return __cxx_static_address_01c7886c5f1235cffcdd5901.reference || (__cxx_static_address_01c7886c5f1235cffcdd5901.reference = {
    __cReference: true,
    get value() { return HBOMBAMMO____header_global_852c1ec80707e92f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:220
export const AMMOLOTS____header_global_a269e4b50d3e6228 = ((((((48) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e60115d603a4a075d4350972() {
  return __cxx_static_address_e60115d603a4a075d4350972.reference || (__cxx_static_address_e60115d603a4a075d4350972.reference = {
    __cReference: true,
    get value() { return AMMOLOTS____header_global_a269e4b50d3e6228; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:221
export const SHOTGUNAMMO____header_global_e1b4903a8a998829 = ((((((49) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aa070f1c59029ecf0054c890() {
  return __cxx_static_address_aa070f1c59029ecf0054c890.reference || (__cxx_static_address_aa070f1c59029ecf0054c890.reference = {
    __cReference: true,
    get value() { return SHOTGUNAMMO____header_global_e1b4903a8a998829; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:222
export const COLA____header_global_4c488c61852b653b = ((((((51) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_83c86e46679f3249862455cb() {
  return __cxx_static_address_83c86e46679f3249862455cb.reference || (__cxx_static_address_83c86e46679f3249862455cb.reference = {
    __cReference: true,
    get value() { return COLA____header_global_4c488c61852b653b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:223
export const SIXPAK____header_global_c3f40fc803a870f3 = ((((((52) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_86a380ed3b30a3668909a38e() {
  return __cxx_static_address_86a380ed3b30a3668909a38e.reference || (__cxx_static_address_86a380ed3b30a3668909a38e.reference = {
    __cReference: true,
    get value() { return SIXPAK____header_global_c3f40fc803a870f3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:224
export const FIRSTAID____header_global_c20e2756524eb25c = ((((((53) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7dcb0dad593f699dd8de10c6() {
  return __cxx_static_address_7dcb0dad593f699dd8de10c6.reference || (__cxx_static_address_7dcb0dad593f699dd8de10c6.reference = {
    __cReference: true,
    get value() { return FIRSTAID____header_global_c20e2756524eb25c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:225
export const SHIELD____header_global_5ac3522d4f66bdba = ((((((54) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8bb6df9fedca3e72822acdd4() {
  return __cxx_static_address_8bb6df9fedca3e72822acdd4.reference || (__cxx_static_address_8bb6df9fedca3e72822acdd4.reference = {
    __cReference: true,
    get value() { return SHIELD____header_global_5ac3522d4f66bdba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:226
export const STEROIDS____header_global_81df0910659236dc = ((((((55) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6a095011fdae1ec1679fa3a6() {
  return __cxx_static_address_6a095011fdae1ec1679fa3a6.reference || (__cxx_static_address_6a095011fdae1ec1679fa3a6.reference = {
    __cReference: true,
    get value() { return STEROIDS____header_global_81df0910659236dc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:227
export const AIRTANK____header_global_f234a4c70585e620 = ((((((56) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a2156e413e7dcc132fdbc3d6() {
  return __cxx_static_address_a2156e413e7dcc132fdbc3d6.reference || (__cxx_static_address_a2156e413e7dcc132fdbc3d6.reference = {
    __cReference: true,
    get value() { return AIRTANK____header_global_f234a4c70585e620; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:228
export const JETPACK____header_global_95a18e2ddc29affb = ((((((57) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9509dd3139cd2a91f7595d04() {
  return __cxx_static_address_9509dd3139cd2a91f7595d04.reference || (__cxx_static_address_9509dd3139cd2a91f7595d04.reference = {
    __cReference: true,
    get value() { return JETPACK____header_global_95a18e2ddc29affb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:229
export const HEATSENSOR____header_global_b50c89cf468ee838 = ((((((59) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1f9f3366c9eb17f8e765d3f1() {
  return __cxx_static_address_1f9f3366c9eb17f8e765d3f1.reference || (__cxx_static_address_1f9f3366c9eb17f8e765d3f1.reference = {
    __cReference: true,
    get value() { return HEATSENSOR____header_global_b50c89cf468ee838; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:230
export const ACCESSCARD____header_global_9e7cc2a113f0cbbb = ((((((60) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_35a4472910625255a9a3888a() {
  return __cxx_static_address_35a4472910625255a9a3888a.reference || (__cxx_static_address_35a4472910625255a9a3888a.reference = {
    __cReference: true,
    get value() { return ACCESSCARD____header_global_9e7cc2a113f0cbbb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:231
export const BOOTS____header_global_e2b9d0e3c59987c1 = ((((((61) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_37bc11dc2b78fc4830826165() {
  return __cxx_static_address_37bc11dc2b78fc4830826165.reference || (__cxx_static_address_37bc11dc2b78fc4830826165.reference = {
    __cReference: true,
    get value() { return BOOTS____header_global_e2b9d0e3c59987c1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:232
export const MIRRORBROKE____header_global_cdd89273ec158df9 = ((((((70) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_99fac583b7146720fa07afbc() {
  return __cxx_static_address_99fac583b7146720fa07afbc.reference || (__cxx_static_address_99fac583b7146720fa07afbc.reference = {
    __cReference: true,
    get value() { return MIRRORBROKE____header_global_cdd89273ec158df9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:233
export const CLOUDYOCEAN____header_global_f3faea80093859a6 = ((((((78) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0edb0f8a0f2e4e777af24ed4() {
  return __cxx_static_address_0edb0f8a0f2e4e777af24ed4.reference || (__cxx_static_address_0edb0f8a0f2e4e777af24ed4.reference = {
    __cReference: true,
    get value() { return CLOUDYOCEAN____header_global_f3faea80093859a6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:234
export const CLOUDYSKIES____header_global_4d7c8e4560133f9d = ((((((79) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_113ec868a68b94aa08a1b5be() {
  return __cxx_static_address_113ec868a68b94aa08a1b5be.reference || (__cxx_static_address_113ec868a68b94aa08a1b5be.reference = {
    __cReference: true,
    get value() { return CLOUDYSKIES____header_global_4d7c8e4560133f9d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:235
export const MOONSKY1____header_global_745c2033e6d9f38e = ((((((80) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9e657ccadf008c57be11258a() {
  return __cxx_static_address_9e657ccadf008c57be11258a.reference || (__cxx_static_address_9e657ccadf008c57be11258a.reference = {
    __cReference: true,
    get value() { return MOONSKY1____header_global_745c2033e6d9f38e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:236
export const BIGORBIT1____header_global_62c7826169828ebd = ((((((84) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_849bd8c79097b1f3f1048b9e() {
  return __cxx_static_address_849bd8c79097b1f3f1048b9e.reference || (__cxx_static_address_849bd8c79097b1f3f1048b9e.reference = {
    __cReference: true,
    get value() { return BIGORBIT1____header_global_62c7826169828ebd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:237
export const LA____header_global_a10100587ad4edf6 = ((((((89) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4281274ab893eb07a1fab82c() {
  return __cxx_static_address_4281274ab893eb07a1fab82c.reference || (__cxx_static_address_4281274ab893eb07a1fab82c.reference = {
    __cReference: true,
    get value() { return LA____header_global_a10100587ad4edf6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:238
export const ATOMICHEALTH____header_global_b4be24a6d1d027f8 = ((((((100) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_daacef0c3d8c84e9c3509267() {
  return __cxx_static_address_daacef0c3d8c84e9c3509267.reference || (__cxx_static_address_daacef0c3d8c84e9c3509267.reference = {
    __cReference: true,
    get value() { return ATOMICHEALTH____header_global_b4be24a6d1d027f8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:239
export const TECHLIGHT2____header_global_322944396237070a = ((((((120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_70741313b932bedef4d31090() {
  return __cxx_static_address_70741313b932bedef4d31090.reference || (__cxx_static_address_70741313b932bedef4d31090.reference = {
    __cReference: true,
    get value() { return TECHLIGHT2____header_global_322944396237070a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:240
export const TECHLIGHTBUST2____header_global_2fa67c3a75d9b5c5 = ((((((121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_079b179cba2a9380fb9395d8() {
  return __cxx_static_address_079b179cba2a9380fb9395d8.reference || (__cxx_static_address_079b179cba2a9380fb9395d8.reference = {
    __cReference: true,
    get value() { return TECHLIGHTBUST2____header_global_2fa67c3a75d9b5c5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:241
export const TECHLIGHT4____header_global_2608d0ad6fdb05f9 = ((((((122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e805172cfb1f75525a04f72a() {
  return __cxx_static_address_e805172cfb1f75525a04f72a.reference || (__cxx_static_address_e805172cfb1f75525a04f72a.reference = {
    __cReference: true,
    get value() { return TECHLIGHT4____header_global_2608d0ad6fdb05f9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:242
export const TECHLIGHTBUST4____header_global_dee9769febecba7b = ((((((123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_598a86c4bd89ea3a98da6378() {
  return __cxx_static_address_598a86c4bd89ea3a98da6378.reference || (__cxx_static_address_598a86c4bd89ea3a98da6378.reference = {
    __cReference: true,
    get value() { return TECHLIGHTBUST4____header_global_dee9769febecba7b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:243
export const WALLLIGHT4____header_global_c32fc24aa4e4ae25 = ((((((124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_52e8ab532b38aa4f2157e689() {
  return __cxx_static_address_52e8ab532b38aa4f2157e689.reference || (__cxx_static_address_52e8ab532b38aa4f2157e689.reference = {
    __cReference: true,
    get value() { return WALLLIGHT4____header_global_c32fc24aa4e4ae25; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:244
export const WALLLIGHTBUST4____header_global_90bad21edf51c030 = ((((((125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bc8c196dd4d9c55a4e739c79() {
  return __cxx_static_address_bc8c196dd4d9c55a4e739c79.reference || (__cxx_static_address_bc8c196dd4d9c55a4e739c79.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST4____header_global_90bad21edf51c030; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:245
export const ACCESSSWITCH____header_global_a62513a1865ccf55 = ((((((130) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_18db34a89014dc79b31f3213() {
  return __cxx_static_address_18db34a89014dc79b31f3213.reference || (__cxx_static_address_18db34a89014dc79b31f3213.reference = {
    __cReference: true,
    get value() { return ACCESSSWITCH____header_global_a62513a1865ccf55; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:246
export const SLOTDOOR____header_global_e6fccf3cc5a16399 = ((((((132) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1f0ae89d89cd79a29ff5e096() {
  return __cxx_static_address_1f0ae89d89cd79a29ff5e096.reference || (__cxx_static_address_1f0ae89d89cd79a29ff5e096.reference = {
    __cReference: true,
    get value() { return SLOTDOOR____header_global_e6fccf3cc5a16399; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:247
export const LIGHTSWITCH____header_global_be2580e2f8bed469 = ((((((134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0dd4c0dd58d1e270cf645445() {
  return __cxx_static_address_0dd4c0dd58d1e270cf645445.reference || (__cxx_static_address_0dd4c0dd58d1e270cf645445.reference = {
    __cReference: true,
    get value() { return LIGHTSWITCH____header_global_be2580e2f8bed469; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:248
export const SPACEDOORSWITCH____header_global_516a8621d3534df1 = ((((((136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a1bb2aa7155f01a945bb5909() {
  return __cxx_static_address_a1bb2aa7155f01a945bb5909.reference || (__cxx_static_address_a1bb2aa7155f01a945bb5909.reference = {
    __cReference: true,
    get value() { return SPACEDOORSWITCH____header_global_516a8621d3534df1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:249
export const SPACELIGHTSWITCH____header_global_1cc4b3e1a33a6d88 = ((((((138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_40812f6efb70ee7dae5c7bc8() {
  return __cxx_static_address_40812f6efb70ee7dae5c7bc8.reference || (__cxx_static_address_40812f6efb70ee7dae5c7bc8.reference = {
    __cReference: true,
    get value() { return SPACELIGHTSWITCH____header_global_1cc4b3e1a33a6d88; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:250
export const FRANKENSTINESWITCH____header_global_e5831250891e0ccf = ((((((140) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dad0b3460d9d522afce94b68() {
  return __cxx_static_address_dad0b3460d9d522afce94b68.reference || (__cxx_static_address_dad0b3460d9d522afce94b68.reference = {
    __cReference: true,
    get value() { return FRANKENSTINESWITCH____header_global_e5831250891e0ccf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:251
export const NUKEBUTTON____header_global_60e3f3c1ff3d404f = ((((((142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9f4d3d5bf99329e2a482a641() {
  return __cxx_static_address_9f4d3d5bf99329e2a482a641.reference || (__cxx_static_address_9f4d3d5bf99329e2a482a641.reference = {
    __cReference: true,
    get value() { return NUKEBUTTON____header_global_60e3f3c1ff3d404f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:252
export const MULTISWITCH____header_global_cec12df8bbbfb01d = ((((((146) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6397f6bdff5e2be72ec88d3b() {
  return __cxx_static_address_6397f6bdff5e2be72ec88d3b.reference || (__cxx_static_address_6397f6bdff5e2be72ec88d3b.reference = {
    __cReference: true,
    get value() { return MULTISWITCH____header_global_cec12df8bbbfb01d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:253
export const DOORTILE5____header_global_e4c468ce86c6d6bf = ((((((150) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d0d1647ad58ec9491e039371() {
  return __cxx_static_address_d0d1647ad58ec9491e039371.reference || (__cxx_static_address_d0d1647ad58ec9491e039371.reference = {
    __cReference: true,
    get value() { return DOORTILE5____header_global_e4c468ce86c6d6bf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:254
export const DOORTILE6____header_global_1c9006e98d0c6801 = ((((((151) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_972f774ff801842a5ea3018d() {
  return __cxx_static_address_972f774ff801842a5ea3018d.reference || (__cxx_static_address_972f774ff801842a5ea3018d.reference = {
    __cReference: true,
    get value() { return DOORTILE6____header_global_1c9006e98d0c6801; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:255
export const DOORTILE1____header_global_a4accc0013cead35 = ((((((152) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f1bac876e5f3ca53996301a0() {
  return __cxx_static_address_f1bac876e5f3ca53996301a0.reference || (__cxx_static_address_f1bac876e5f3ca53996301a0.reference = {
    __cReference: true,
    get value() { return DOORTILE1____header_global_a4accc0013cead35; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:256
export const DOORTILE2____header_global_e1f901db6ac16396 = ((((((153) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dcc42496df0efe2394c2272c() {
  return __cxx_static_address_dcc42496df0efe2394c2272c.reference || (__cxx_static_address_dcc42496df0efe2394c2272c.reference = {
    __cReference: true,
    get value() { return DOORTILE2____header_global_e1f901db6ac16396; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:257
export const DOORTILE3____header_global_328f570dbd5a661c = ((((((154) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bfe3de7f8cd0a79b426d9886() {
  return __cxx_static_address_bfe3de7f8cd0a79b426d9886.reference || (__cxx_static_address_bfe3de7f8cd0a79b426d9886.reference = {
    __cReference: true,
    get value() { return DOORTILE3____header_global_328f570dbd5a661c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:258
export const DOORTILE4____header_global_99af01e72a5669dc = ((((((155) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f70af0656ae912d73bea6f95() {
  return __cxx_static_address_f70af0656ae912d73bea6f95.reference || (__cxx_static_address_f70af0656ae912d73bea6f95.reference = {
    __cReference: true,
    get value() { return DOORTILE4____header_global_99af01e72a5669dc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:259
export const DOORTILE7____header_global_5fa1569dba86b7aa = ((((((156) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f4c477122b8ad8cae88546be() {
  return __cxx_static_address_f4c477122b8ad8cae88546be.reference || (__cxx_static_address_f4c477122b8ad8cae88546be.reference = {
    __cReference: true,
    get value() { return DOORTILE7____header_global_5fa1569dba86b7aa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:260
export const DOORTILE8____header_global_fcee4c831b77c5cf = ((((((157) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e2fa5e3d97c2560ef7a7648d() {
  return __cxx_static_address_e2fa5e3d97c2560ef7a7648d.reference || (__cxx_static_address_e2fa5e3d97c2560ef7a7648d.reference = {
    __cReference: true,
    get value() { return DOORTILE8____header_global_fcee4c831b77c5cf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:261
export const DOORTILE9____header_global_88f307a25625ac96 = ((((((158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e8e3c22664dcb95eb418fbde() {
  return __cxx_static_address_e8e3c22664dcb95eb418fbde.reference || (__cxx_static_address_e8e3c22664dcb95eb418fbde.reference = {
    __cReference: true,
    get value() { return DOORTILE9____header_global_88f307a25625ac96; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:262
export const DOORTILE10____header_global_00b66c5854201555 = ((((((159) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_109075c01869127d84148034() {
  return __cxx_static_address_109075c01869127d84148034.reference || (__cxx_static_address_109075c01869127d84148034.reference = {
    __cReference: true,
    get value() { return DOORTILE10____header_global_00b66c5854201555; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:263
export const DOORSHOCK____header_global_e4581a1d3b205b29 = ((((((160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4e08ea46b1128869a090e587() {
  return __cxx_static_address_4e08ea46b1128869a090e587.reference || (__cxx_static_address_4e08ea46b1128869a090e587.reference = {
    __cReference: true,
    get value() { return DOORSHOCK____header_global_e4581a1d3b205b29; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:264
export const DIPSWITCH____header_global_a7fc051575b966ee = ((((((162) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3c1d31dd5fee661db1d5707f() {
  return __cxx_static_address_3c1d31dd5fee661db1d5707f.reference || (__cxx_static_address_3c1d31dd5fee661db1d5707f.reference = {
    __cReference: true,
    get value() { return DIPSWITCH____header_global_a7fc051575b966ee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:265
export const DIPSWITCH2____header_global_cc39b4d89f37c226 = ((((((164) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fba80a9818118dc28298660b() {
  return __cxx_static_address_fba80a9818118dc28298660b.reference || (__cxx_static_address_fba80a9818118dc28298660b.reference = {
    __cReference: true,
    get value() { return DIPSWITCH2____header_global_cc39b4d89f37c226; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:266
export const TECHSWITCH____header_global_caa8ff0224368236 = ((((((166) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5a83b8781359ea60c1f3ee38() {
  return __cxx_static_address_5a83b8781359ea60c1f3ee38.reference || (__cxx_static_address_5a83b8781359ea60c1f3ee38.reference = {
    __cReference: true,
    get value() { return TECHSWITCH____header_global_caa8ff0224368236; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:267
export const DIPSWITCH3____header_global_5f3235c3753841e2 = ((((((168) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_285f05e6a3bd7d4662668bc0() {
  return __cxx_static_address_285f05e6a3bd7d4662668bc0.reference || (__cxx_static_address_285f05e6a3bd7d4662668bc0.reference = {
    __cReference: true,
    get value() { return DIPSWITCH3____header_global_5f3235c3753841e2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:268
export const ACCESSSWITCH2____header_global_bf4b2be23753abef = ((((((170) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_01347d4bd87313876d0a1a19() {
  return __cxx_static_address_01347d4bd87313876d0a1a19.reference || (__cxx_static_address_01347d4bd87313876d0a1a19.reference = {
    __cReference: true,
    get value() { return ACCESSSWITCH2____header_global_bf4b2be23753abef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:269
export const FLOORSLIME____header_global_b95bd32b20bd73fa = ((((((200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c0e47367d947298d1d4a4076() {
  return __cxx_static_address_c0e47367d947298d1d4a4076.reference || (__cxx_static_address_c0e47367d947298d1d4a4076.reference = {
    __cReference: true,
    get value() { return FLOORSLIME____header_global_b95bd32b20bd73fa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:270
export const BIGFORCE____header_global_f7777961085ef913 = ((((((230) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_04a712f4d1e22537d2b3dabb() {
  return __cxx_static_address_04a712f4d1e22537d2b3dabb.reference || (__cxx_static_address_04a712f4d1e22537d2b3dabb.reference = {
    __cReference: true,
    get value() { return BIGFORCE____header_global_f7777961085ef913; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:271
export const MASKWALL9____header_global_a45f3c3c0f23d2cb = ((((((255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_21c2a7d3a665227e5a6bf21b() {
  return __cxx_static_address_21c2a7d3a665227e5a6bf21b.reference || (__cxx_static_address_21c2a7d3a665227e5a6bf21b.reference = {
    __cReference: true,
    get value() { return MASKWALL9____header_global_a45f3c3c0f23d2cb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:272
export const SCREENBREAK1____header_global_2f95e987a1931afa = ((((((263) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b47a668e81916001d036774e() {
  return __cxx_static_address_b47a668e81916001d036774e.reference || (__cxx_static_address_b47a668e81916001d036774e.reference = {
    __cReference: true,
    get value() { return SCREENBREAK1____header_global_2f95e987a1931afa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:273
export const SCREENBREAK2____header_global_1e44a72b6dff07ad = ((((((264) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3423fc25a8726e772fc91994() {
  return __cxx_static_address_3423fc25a8726e772fc91994.reference || (__cxx_static_address_3423fc25a8726e772fc91994.reference = {
    __cReference: true,
    get value() { return SCREENBREAK2____header_global_1e44a72b6dff07ad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:274
export const SCREENBREAK3____header_global_96706234de7744e0 = ((((((265) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_68debd3e3074c1f5a0b252da() {
  return __cxx_static_address_68debd3e3074c1f5a0b252da.reference || (__cxx_static_address_68debd3e3074c1f5a0b252da.reference = {
    __cReference: true,
    get value() { return SCREENBREAK3____header_global_96706234de7744e0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:275
export const SCREENBREAK4____header_global_91073fde1c05dff8 = ((((((266) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2352a3f41ebe3c343edd6773() {
  return __cxx_static_address_2352a3f41ebe3c343edd6773.reference || (__cxx_static_address_2352a3f41ebe3c343edd6773.reference = {
    __cReference: true,
    get value() { return SCREENBREAK4____header_global_91073fde1c05dff8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:276
export const SCREENBREAK5____header_global_031987899ebfa5da = ((((((267) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0c4e079dba4afb5deed37f7f() {
  return __cxx_static_address_0c4e079dba4afb5deed37f7f.reference || (__cxx_static_address_0c4e079dba4afb5deed37f7f.reference = {
    __cReference: true,
    get value() { return SCREENBREAK5____header_global_031987899ebfa5da; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:277
export const SCREENBREAK6____header_global_03efc8d9d7b109d7 = ((((((268) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e42ee5cfc7b06eae68d6f51() {
  return __cxx_static_address_1e42ee5cfc7b06eae68d6f51.reference || (__cxx_static_address_1e42ee5cfc7b06eae68d6f51.reference = {
    __cReference: true,
    get value() { return SCREENBREAK6____header_global_03efc8d9d7b109d7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:278
export const SCREENBREAK7____header_global_44d7404c3f4720ac = ((((((269) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8dbe66c0cca7a0d95b35e35d() {
  return __cxx_static_address_8dbe66c0cca7a0d95b35e35d.reference || (__cxx_static_address_8dbe66c0cca7a0d95b35e35d.reference = {
    __cReference: true,
    get value() { return SCREENBREAK7____header_global_44d7404c3f4720ac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:279
export const SCREENBREAK8____header_global_0e2adf17483dc269 = ((((((270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f17969f0922e8b3c10dc44db() {
  return __cxx_static_address_f17969f0922e8b3c10dc44db.reference || (__cxx_static_address_f17969f0922e8b3c10dc44db.reference = {
    __cReference: true,
    get value() { return SCREENBREAK8____header_global_0e2adf17483dc269; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:280
export const SCREENBREAK9____header_global_d3f0e16f3bba8170 = ((((((271) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c9cada16e03fc75259e06be0() {
  return __cxx_static_address_c9cada16e03fc75259e06be0.reference || (__cxx_static_address_c9cada16e03fc75259e06be0.reference = {
    __cReference: true,
    get value() { return SCREENBREAK9____header_global_d3f0e16f3bba8170; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:281
export const SCREENBREAK10____header_global_d3bb932b76fcac5a = ((((((272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fecfa191808f1bc8d5745810() {
  return __cxx_static_address_fecfa191808f1bc8d5745810.reference || (__cxx_static_address_fecfa191808f1bc8d5745810.reference = {
    __cReference: true,
    get value() { return SCREENBREAK10____header_global_d3bb932b76fcac5a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:282
export const SCREENBREAK11____header_global_9f2fc0c90bae3584 = ((((((273) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b46e95fce0e99c0ede6aa34f() {
  return __cxx_static_address_b46e95fce0e99c0ede6aa34f.reference || (__cxx_static_address_b46e95fce0e99c0ede6aa34f.reference = {
    __cReference: true,
    get value() { return SCREENBREAK11____header_global_9f2fc0c90bae3584; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:283
export const SCREENBREAK12____header_global_943497b0d557e052 = ((((((274) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7f71a29683d1fd8ad342d730() {
  return __cxx_static_address_7f71a29683d1fd8ad342d730.reference || (__cxx_static_address_7f71a29683d1fd8ad342d730.reference = {
    __cReference: true,
    get value() { return SCREENBREAK12____header_global_943497b0d557e052; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:284
export const SCREENBREAK13____header_global_7b174b579dcf84f7 = ((((((275) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_25170cda927da142f1dd4d4f() {
  return __cxx_static_address_25170cda927da142f1dd4d4f.reference || (__cxx_static_address_25170cda927da142f1dd4d4f.reference = {
    __cReference: true,
    get value() { return SCREENBREAK13____header_global_7b174b579dcf84f7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:285
export const MASKWALL1____header_global_f9aba39a498c1ba0 = ((((((285) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e5c66abbb7ac964488062b09() {
  return __cxx_static_address_e5c66abbb7ac964488062b09.reference || (__cxx_static_address_e5c66abbb7ac964488062b09.reference = {
    __cReference: true,
    get value() { return MASKWALL1____header_global_f9aba39a498c1ba0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:286
export const W_TECHWALL1____header_global_968ee22db7a80156 = ((((((293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fc041ae9159994c302be7acc() {
  return __cxx_static_address_fc041ae9159994c302be7acc.reference || (__cxx_static_address_fc041ae9159994c302be7acc.reference = {
    __cReference: true,
    get value() { return W_TECHWALL1____header_global_968ee22db7a80156; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:287
export const W_TECHWALL2____header_global_339adcb7dbacb8b5 = ((((((297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e16b4caa0254792c81ec0830() {
  return __cxx_static_address_e16b4caa0254792c81ec0830.reference || (__cxx_static_address_e16b4caa0254792c81ec0830.reference = {
    __cReference: true,
    get value() { return W_TECHWALL2____header_global_339adcb7dbacb8b5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:288
export const W_TECHWALL15____header_global_11562fd06164da69 = ((((((299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_34406ce292323744dadc8e75() {
  return __cxx_static_address_34406ce292323744dadc8e75.reference || (__cxx_static_address_34406ce292323744dadc8e75.reference = {
    __cReference: true,
    get value() { return W_TECHWALL15____header_global_11562fd06164da69; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:289
export const W_TECHWALL3____header_global_a01c2e5b52c3011b = ((((((301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a1d271c5624bdcd767e2e229() {
  return __cxx_static_address_a1d271c5624bdcd767e2e229.reference || (__cxx_static_address_a1d271c5624bdcd767e2e229.reference = {
    __cReference: true,
    get value() { return W_TECHWALL3____header_global_a01c2e5b52c3011b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:290
export const W_TECHWALL4____header_global_426f677e90f1fe6a = ((((((305) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d3f269c37a8d245ff5e32109() {
  return __cxx_static_address_d3f269c37a8d245ff5e32109.reference || (__cxx_static_address_d3f269c37a8d245ff5e32109.reference = {
    __cReference: true,
    get value() { return W_TECHWALL4____header_global_426f677e90f1fe6a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:291
export const W_TECHWALL10____header_global_a90a266f29ed4e9a = ((((((306) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_df276328efd28990239c922e() {
  return __cxx_static_address_df276328efd28990239c922e.reference || (__cxx_static_address_df276328efd28990239c922e.reference = {
    __cReference: true,
    get value() { return W_TECHWALL10____header_global_a90a266f29ed4e9a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:292
export const W_TECHWALL16____header_global_7172283db24ab6f3 = ((((((307) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d04636e481cc00e688827cb8() {
  return __cxx_static_address_d04636e481cc00e688827cb8.reference || (__cxx_static_address_d04636e481cc00e688827cb8.reference = {
    __cReference: true,
    get value() { return W_TECHWALL16____header_global_7172283db24ab6f3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:293
export const WATERTILE2____header_global_ea28a63e88152798 = ((((((336) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_739c36d367adbcee8f70c755() {
  return __cxx_static_address_739c36d367adbcee8f70c755.reference || (__cxx_static_address_739c36d367adbcee8f70c755.reference = {
    __cReference: true,
    get value() { return WATERTILE2____header_global_ea28a63e88152798; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:294
export const BPANNEL1____header_global_522d2475281129b1 = ((((((341) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9f6589e7c0b038fc04e3f07e() {
  return __cxx_static_address_9f6589e7c0b038fc04e3f07e.reference || (__cxx_static_address_9f6589e7c0b038fc04e3f07e.reference = {
    __cReference: true,
    get value() { return BPANNEL1____header_global_522d2475281129b1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:295
export const PANNEL1____header_global_6d45cef97fda9750 = ((((((342) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b15f40d758443e33350d29ed() {
  return __cxx_static_address_b15f40d758443e33350d29ed.reference || (__cxx_static_address_b15f40d758443e33350d29ed.reference = {
    __cReference: true,
    get value() { return PANNEL1____header_global_6d45cef97fda9750; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:296
export const PANNEL2____header_global_dc3c144ae1b816b7 = ((((((343) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_18cc9c438152d817f595e857() {
  return __cxx_static_address_18cc9c438152d817f595e857.reference || (__cxx_static_address_18cc9c438152d817f595e857.reference = {
    __cReference: true,
    get value() { return PANNEL2____header_global_dc3c144ae1b816b7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:297
export const STATIC____header_global_1ff700adb121cc5a = ((((((351) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_64016afcf7581434be5cf960() {
  return __cxx_static_address_64016afcf7581434be5cf960.reference || (__cxx_static_address_64016afcf7581434be5cf960.reference = {
    __cReference: true,
    get value() { return STATIC____header_global_1ff700adb121cc5a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:298
export const W_SCREENBREAK____header_global_42a6118f86782e58 = ((((((357) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b259c649fd69403fd1e5c0ba() {
  return __cxx_static_address_b259c649fd69403fd1e5c0ba.reference || (__cxx_static_address_b259c649fd69403fd1e5c0ba.reference = {
    __cReference: true,
    get value() { return W_SCREENBREAK____header_global_42a6118f86782e58; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:299
export const W_HITTECHWALL3____header_global_49227790da5e8e2d = ((((((360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6045a0283f2526f589d20061() {
  return __cxx_static_address_6045a0283f2526f589d20061.reference || (__cxx_static_address_6045a0283f2526f589d20061.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL3____header_global_49227790da5e8e2d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:300
export const W_HITTECHWALL4____header_global_17e63e2c781832af = ((((((361) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b4fea66a9bb85bff326c4144() {
  return __cxx_static_address_b4fea66a9bb85bff326c4144.reference || (__cxx_static_address_b4fea66a9bb85bff326c4144.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL4____header_global_17e63e2c781832af; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:301
export const W_HITTECHWALL2____header_global_b8f9d8fd8f312de2 = ((((((362) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_54a97fbeb17e105f34ee09df() {
  return __cxx_static_address_54a97fbeb17e105f34ee09df.reference || (__cxx_static_address_54a97fbeb17e105f34ee09df.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL2____header_global_b8f9d8fd8f312de2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:302
export const W_HITTECHWALL1____header_global_d47c2225c5905015 = ((((((363) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a333e24611e632c7bc5c0014() {
  return __cxx_static_address_a333e24611e632c7bc5c0014.reference || (__cxx_static_address_a333e24611e632c7bc5c0014.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL1____header_global_d47c2225c5905015; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:303
export const MASKWALL10____header_global_4cc96d9ff8e67838 = ((((((387) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_110e2ff971ee85639b945127() {
  return __cxx_static_address_110e2ff971ee85639b945127.reference || (__cxx_static_address_110e2ff971ee85639b945127.reference = {
    __cReference: true,
    get value() { return MASKWALL10____header_global_4cc96d9ff8e67838; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:304
export const MASKWALL11____header_global_0e6adea30262515a = ((((((391) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cd92f9771da5178898ce332b() {
  return __cxx_static_address_cd92f9771da5178898ce332b.reference || (__cxx_static_address_cd92f9771da5178898ce332b.reference = {
    __cReference: true,
    get value() { return MASKWALL11____header_global_0e6adea30262515a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:305
export const DOORTILE22____header_global_9c117b5dfa0460a7 = ((((((395) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f3dc49c29b910df6ec6c54a0() {
  return __cxx_static_address_f3dc49c29b910df6ec6c54a0.reference || (__cxx_static_address_f3dc49c29b910df6ec6c54a0.reference = {
    __cReference: true,
    get value() { return DOORTILE22____header_global_9c117b5dfa0460a7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:306
export const FANSPRITE____header_global_e070fdd6e82c27d1 = ((((((407) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7a7ac724f34a6585e7775d14() {
  return __cxx_static_address_7a7ac724f34a6585e7775d14.reference || (__cxx_static_address_7a7ac724f34a6585e7775d14.reference = {
    __cReference: true,
    get value() { return FANSPRITE____header_global_e070fdd6e82c27d1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:307
export const FANSPRITEBROKE____header_global_6cfd1697e1af888d = ((((((411) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dcb1655566457728ea71f4a3() {
  return __cxx_static_address_dcb1655566457728ea71f4a3.reference || (__cxx_static_address_dcb1655566457728ea71f4a3.reference = {
    __cReference: true,
    get value() { return FANSPRITEBROKE____header_global_6cfd1697e1af888d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:308
export const FANSHADOW____header_global_ba257f0b957dc3f8 = ((((((412) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e20b5aee9dcc429a8f71cc8f() {
  return __cxx_static_address_e20b5aee9dcc429a8f71cc8f.reference || (__cxx_static_address_e20b5aee9dcc429a8f71cc8f.reference = {
    __cReference: true,
    get value() { return FANSHADOW____header_global_ba257f0b957dc3f8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:309
export const FANSHADOWBROKE____header_global_5ee4b7c2b5ebc669 = ((((((416) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ae91d547d15fecc82efe2201() {
  return __cxx_static_address_ae91d547d15fecc82efe2201.reference || (__cxx_static_address_ae91d547d15fecc82efe2201.reference = {
    __cReference: true,
    get value() { return FANSHADOWBROKE____header_global_5ee4b7c2b5ebc669; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:310
export const DOORTILE18____header_global_a2c70157221dd388 = ((((((447) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_68d08ed9fb4c76326c711822() {
  return __cxx_static_address_68d08ed9fb4c76326c711822.reference || (__cxx_static_address_68d08ed9fb4c76326c711822.reference = {
    __cReference: true,
    get value() { return DOORTILE18____header_global_a2c70157221dd388; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:311
export const DOORTILE19____header_global_1c53d039838c616e = ((((((448) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fc88ef8d079521f7fa2be8a7() {
  return __cxx_static_address_fc88ef8d079521f7fa2be8a7.reference || (__cxx_static_address_fc88ef8d079521f7fa2be8a7.reference = {
    __cReference: true,
    get value() { return DOORTILE19____header_global_1c53d039838c616e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:312
export const DOORTILE20____header_global_d17608119fe70c67 = ((((((449) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4e669411eebcb6f88fcb50ae() {
  return __cxx_static_address_4e669411eebcb6f88fcb50ae.reference || (__cxx_static_address_4e669411eebcb6f88fcb50ae.reference = {
    __cReference: true,
    get value() { return DOORTILE20____header_global_d17608119fe70c67; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:313
export const VIEWSCREEN2____header_global_d17d259e5b2e2476 = ((((((499) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cf0b19daa952025ab428f725() {
  return __cxx_static_address_cf0b19daa952025ab428f725.reference || (__cxx_static_address_cf0b19daa952025ab428f725.reference = {
    __cReference: true,
    get value() { return VIEWSCREEN2____header_global_d17d259e5b2e2476; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:314
export const VIEWSCREEN____header_global_729526d0698cf9a1 = ((((((502) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_78a2041af9b196f2d5237e52() {
  return __cxx_static_address_78a2041af9b196f2d5237e52.reference || (__cxx_static_address_78a2041af9b196f2d5237e52.reference = {
    __cReference: true,
    get value() { return VIEWSCREEN____header_global_729526d0698cf9a1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:315
export const GLASS____header_global_b206e09d2d96ad0f = ((((((503) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_70e1c34ad31a646c780f8dfa() {
  return __cxx_static_address_70e1c34ad31a646c780f8dfa.reference || (__cxx_static_address_70e1c34ad31a646c780f8dfa.reference = {
    __cReference: true,
    get value() { return GLASS____header_global_b206e09d2d96ad0f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:316
export const GLASS2____header_global_702cfccf3caacacf = ((((((504) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9320911854d498622e10002b() {
  return __cxx_static_address_9320911854d498622e10002b.reference || (__cxx_static_address_9320911854d498622e10002b.reference = {
    __cReference: true,
    get value() { return GLASS2____header_global_702cfccf3caacacf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:317
export const STAINGLASS1____header_global_3e431186af0d5f0f = ((((((510) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6388c88c587955c92376b3f1() {
  return __cxx_static_address_6388c88c587955c92376b3f1.reference || (__cxx_static_address_6388c88c587955c92376b3f1.reference = {
    __cReference: true,
    get value() { return STAINGLASS1____header_global_3e431186af0d5f0f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:318
export const MASKWALL5____header_global_8cd4f96802f3903a = ((((((514) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_66b3078fac54a19a49722843() {
  return __cxx_static_address_66b3078fac54a19a49722843.reference || (__cxx_static_address_66b3078fac54a19a49722843.reference = {
    __cReference: true,
    get value() { return MASKWALL5____header_global_8cd4f96802f3903a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:319
export const SATELITE____header_global_6526ac0f783a1ac3 = ((((((516) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fc7d4fbebd051d93c6a0a973() {
  return __cxx_static_address_fc7d4fbebd051d93c6a0a973.reference || (__cxx_static_address_fc7d4fbebd051d93c6a0a973.reference = {
    __cReference: true,
    get value() { return SATELITE____header_global_6526ac0f783a1ac3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:320
export const FUELPOD____header_global_4656cec7a6e4e560 = ((((((517) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0bdebda0a2edbd672b2a1d72() {
  return __cxx_static_address_0bdebda0a2edbd672b2a1d72.reference || (__cxx_static_address_0bdebda0a2edbd672b2a1d72.reference = {
    __cReference: true,
    get value() { return FUELPOD____header_global_4656cec7a6e4e560; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:321
export const CRACK1____header_global_e9c6827e20f1ce3d = ((((((546) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_036631bf03bb7dfab8f44401() {
  return __cxx_static_address_036631bf03bb7dfab8f44401.reference || (__cxx_static_address_036631bf03bb7dfab8f44401.reference = {
    __cReference: true,
    get value() { return CRACK1____header_global_e9c6827e20f1ce3d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:322
export const CRACK2____header_global_603464b8395e5ab9 = ((((((547) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9818d748b32ea6f8465026fe() {
  return __cxx_static_address_9818d748b32ea6f8465026fe.reference || (__cxx_static_address_9818d748b32ea6f8465026fe.reference = {
    __cReference: true,
    get value() { return CRACK2____header_global_603464b8395e5ab9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:323
export const CRACK3____header_global_52130d35b5deedc3 = ((((((548) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e8edf292dfd54cc3a5a13d59() {
  return __cxx_static_address_e8edf292dfd54cc3a5a13d59.reference || (__cxx_static_address_e8edf292dfd54cc3a5a13d59.reference = {
    __cReference: true,
    get value() { return CRACK3____header_global_52130d35b5deedc3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:324
export const CRACK4____header_global_a3f433f3ecb75180 = ((((((549) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8ebb4aeca5b0cb9fc11fe951() {
  return __cxx_static_address_8ebb4aeca5b0cb9fc11fe951.reference || (__cxx_static_address_8ebb4aeca5b0cb9fc11fe951.reference = {
    __cReference: true,
    get value() { return CRACK4____header_global_a3f433f3ecb75180; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:325
export const FOOTPRINTS____header_global_123ee4ae17e3adf8 = ((((((550) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_44a650a2f5966f2716a7e9dc() {
  return __cxx_static_address_44a650a2f5966f2716a7e9dc.reference || (__cxx_static_address_44a650a2f5966f2716a7e9dc.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS____header_global_123ee4ae17e3adf8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:326
export const DOMELITE____header_global_ecc3b8bbda59de2f = ((((((551) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_239b9a0f5e42372c5f742257() {
  return __cxx_static_address_239b9a0f5e42372c5f742257.reference || (__cxx_static_address_239b9a0f5e42372c5f742257.reference = {
    __cReference: true,
    get value() { return DOMELITE____header_global_ecc3b8bbda59de2f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:327
export const CAMERAPOLE____header_global_11095c7cd4c6a8da = ((((((554) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f9c6a4f7b3693140ea5d43f0() {
  return __cxx_static_address_f9c6a4f7b3693140ea5d43f0.reference || (__cxx_static_address_f9c6a4f7b3693140ea5d43f0.reference = {
    __cReference: true,
    get value() { return CAMERAPOLE____header_global_11095c7cd4c6a8da; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:328
export const CHAIR1____header_global_37eb5366f4f4a928 = ((((((556) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_38f8c34a3ac64365dbc89af1() {
  return __cxx_static_address_38f8c34a3ac64365dbc89af1.reference || (__cxx_static_address_38f8c34a3ac64365dbc89af1.reference = {
    __cReference: true,
    get value() { return CHAIR1____header_global_37eb5366f4f4a928; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:329
export const CHAIR2____header_global_a068f492cf97a05e = ((((((557) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1d579605977f60e77bc12b5e() {
  return __cxx_static_address_1d579605977f60e77bc12b5e.reference || (__cxx_static_address_1d579605977f60e77bc12b5e.reference = {
    __cReference: true,
    get value() { return CHAIR2____header_global_a068f492cf97a05e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:330
export const BROKENCHAIR____header_global_ce25d55cd1218818 = ((((((559) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4ea0201db35445abd7b8efc1() {
  return __cxx_static_address_4ea0201db35445abd7b8efc1.reference || (__cxx_static_address_4ea0201db35445abd7b8efc1.reference = {
    __cReference: true,
    get value() { return BROKENCHAIR____header_global_ce25d55cd1218818; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:331
export const MIRROR____header_global_ab345ed9bb4e5d36 = ((((((560) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_713f14e1f888b54b33bd6e6b() {
  return __cxx_static_address_713f14e1f888b54b33bd6e6b.reference || (__cxx_static_address_713f14e1f888b54b33bd6e6b.reference = {
    __cReference: true,
    get value() { return MIRROR____header_global_ab345ed9bb4e5d36; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:332
export const WATERFOUNTAIN____header_global_cfe90f88c5577417 = ((((((563) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f757057140879ec3247046b6() {
  return __cxx_static_address_f757057140879ec3247046b6.reference || (__cxx_static_address_f757057140879ec3247046b6.reference = {
    __cReference: true,
    get value() { return WATERFOUNTAIN____header_global_cfe90f88c5577417; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:333
export const WATERFOUNTAINBROKE____header_global_bcf380f7801c4db8 = ((((((567) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c12f7109c692b0f9aa62630d() {
  return __cxx_static_address_c12f7109c692b0f9aa62630d.reference || (__cxx_static_address_c12f7109c692b0f9aa62630d.reference = {
    __cReference: true,
    get value() { return WATERFOUNTAINBROKE____header_global_bcf380f7801c4db8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:334
export const FEMMAG1____header_global_2f6f2aeab39e5f14 = ((((((568) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_42e9eb7cda3aa208ce57f381() {
  return __cxx_static_address_42e9eb7cda3aa208ce57f381.reference || (__cxx_static_address_42e9eb7cda3aa208ce57f381.reference = {
    __cReference: true,
    get value() { return FEMMAG1____header_global_2f6f2aeab39e5f14; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:335
export const TOILET____header_global_02f3d280a25f48af = ((((((569) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d5084c3053a48792939099b0() {
  return __cxx_static_address_d5084c3053a48792939099b0.reference || (__cxx_static_address_d5084c3053a48792939099b0.reference = {
    __cReference: true,
    get value() { return TOILET____header_global_02f3d280a25f48af; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:336
export const STALL____header_global_adfe256499cae819 = ((((((571) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ec1be2a8c9f5ebddb3dab9c7() {
  return __cxx_static_address_ec1be2a8c9f5ebddb3dab9c7.reference || (__cxx_static_address_ec1be2a8c9f5ebddb3dab9c7.reference = {
    __cReference: true,
    get value() { return STALL____header_global_adfe256499cae819; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:337
export const STALLBROKE____header_global_0da76a58497f7a44 = ((((((573) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5d8966a8a8c408cd6fddd039() {
  return __cxx_static_address_5d8966a8a8c408cd6fddd039.reference || (__cxx_static_address_5d8966a8a8c408cd6fddd039.reference = {
    __cReference: true,
    get value() { return STALLBROKE____header_global_0da76a58497f7a44; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:338
export const FEMMAG2____header_global_0b4c498de7efd207 = ((((((577) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_46064449ca886f435aa39caf() {
  return __cxx_static_address_46064449ca886f435aa39caf.reference || (__cxx_static_address_46064449ca886f435aa39caf.reference = {
    __cReference: true,
    get value() { return FEMMAG2____header_global_0b4c498de7efd207; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:339
export const REACTOR2____header_global_9daf5ab68ea6970a = ((((((578) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2118f33bfb046fe660eb7ee3() {
  return __cxx_static_address_2118f33bfb046fe660eb7ee3.reference || (__cxx_static_address_2118f33bfb046fe660eb7ee3.reference = {
    __cReference: true,
    get value() { return REACTOR2____header_global_9daf5ab68ea6970a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:340
export const REACTOR2BURNT____header_global_ef5298e086da6590 = ((((((579) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2ea0b5bca43386126080b87c() {
  return __cxx_static_address_2ea0b5bca43386126080b87c.reference || (__cxx_static_address_2ea0b5bca43386126080b87c.reference = {
    __cReference: true,
    get value() { return REACTOR2BURNT____header_global_ef5298e086da6590; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:341
export const REACTOR2SPARK____header_global_a58a2658a932f6ac = ((((((580) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1a2fc66d09372147038869ee() {
  return __cxx_static_address_1a2fc66d09372147038869ee.reference || (__cxx_static_address_1a2fc66d09372147038869ee.reference = {
    __cReference: true,
    get value() { return REACTOR2SPARK____header_global_a58a2658a932f6ac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:342
export const GRATE1____header_global_93c2446bdc53d653 = ((((((595) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_315692e2e42d4fae5afa8260() {
  return __cxx_static_address_315692e2e42d4fae5afa8260.reference || (__cxx_static_address_315692e2e42d4fae5afa8260.reference = {
    __cReference: true,
    get value() { return GRATE1____header_global_93c2446bdc53d653; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:343
export const BGRATE1____header_global_51c202ec6b89cb76 = ((((((596) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6e96cdd732c834b1984ba183() {
  return __cxx_static_address_6e96cdd732c834b1984ba183.reference || (__cxx_static_address_6e96cdd732c834b1984ba183.reference = {
    __cReference: true,
    get value() { return BGRATE1____header_global_51c202ec6b89cb76; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:344
export const SOLARPANNEL____header_global_ba399b64909fc59a = ((((((602) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ab978ee6ef360d23ae1db674() {
  return __cxx_static_address_ab978ee6ef360d23ae1db674.reference || (__cxx_static_address_ab978ee6ef360d23ae1db674.reference = {
    __cReference: true,
    get value() { return SOLARPANNEL____header_global_ba399b64909fc59a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:345
export const NAKED1____header_global_35bfe3f16c524d3f = ((((((603) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_574d4da87a33b5045788a47d() {
  return __cxx_static_address_574d4da87a33b5045788a47d.reference || (__cxx_static_address_574d4da87a33b5045788a47d.reference = {
    __cReference: true,
    get value() { return NAKED1____header_global_35bfe3f16c524d3f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:346
export const ANTENNA____header_global_6add86aae622d46c = ((((((607) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5a1d2d0157807dda65ccc02c() {
  return __cxx_static_address_5a1d2d0157807dda65ccc02c.reference || (__cxx_static_address_5a1d2d0157807dda65ccc02c.reference = {
    __cReference: true,
    get value() { return ANTENNA____header_global_6add86aae622d46c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:347
export const MASKWALL12____header_global_1b0f5c18c14900b6 = ((((((609) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_141a477b0e1b92d9316f88d2() {
  return __cxx_static_address_141a477b0e1b92d9316f88d2.reference || (__cxx_static_address_141a477b0e1b92d9316f88d2.reference = {
    __cReference: true,
    get value() { return MASKWALL12____header_global_1b0f5c18c14900b6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:348
export const TOILETBROKE____header_global_47beffb2a43aa532 = ((((((615) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f7d7b748c632d7fff72fc57b() {
  return __cxx_static_address_f7d7b748c632d7fff72fc57b.reference || (__cxx_static_address_f7d7b748c632d7fff72fc57b.reference = {
    __cReference: true,
    get value() { return TOILETBROKE____header_global_47beffb2a43aa532; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:349
export const PIPE2____header_global_4b2bc49e92d6d596 = ((((((616) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_faf01c0f71e7b66c366c7312() {
  return __cxx_static_address_faf01c0f71e7b66c366c7312.reference || (__cxx_static_address_faf01c0f71e7b66c366c7312.reference = {
    __cReference: true,
    get value() { return PIPE2____header_global_4b2bc49e92d6d596; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:350
export const PIPE1B____header_global_851ffa5ea435950b = ((((((617) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_99cf49c7c1bbe87ada24b75e() {
  return __cxx_static_address_99cf49c7c1bbe87ada24b75e.reference || (__cxx_static_address_99cf49c7c1bbe87ada24b75e.reference = {
    __cReference: true,
    get value() { return PIPE1B____header_global_851ffa5ea435950b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:351
export const PIPE3____header_global_a5eff4ba7b1a1f0e = ((((((618) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bec6f77ef19fbe2a7f4fe78a() {
  return __cxx_static_address_bec6f77ef19fbe2a7f4fe78a.reference || (__cxx_static_address_bec6f77ef19fbe2a7f4fe78a.reference = {
    __cReference: true,
    get value() { return PIPE3____header_global_a5eff4ba7b1a1f0e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:352
export const PIPE1____header_global_5f1a54dda2f36e10 = ((((((619) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1ae573b7ee7b5c0d5c43ffbf() {
  return __cxx_static_address_1ae573b7ee7b5c0d5c43ffbf.reference || (__cxx_static_address_1ae573b7ee7b5c0d5c43ffbf.reference = {
    __cReference: true,
    get value() { return PIPE1____header_global_5f1a54dda2f36e10; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:353
export const CAMERA1____header_global_0cf05e5dcdec4794 = ((((((621) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b90b8009221d24f825c1b9bf() {
  return __cxx_static_address_b90b8009221d24f825c1b9bf.reference || (__cxx_static_address_b90b8009221d24f825c1b9bf.reference = {
    __cReference: true,
    get value() { return CAMERA1____header_global_0cf05e5dcdec4794; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:354
export const PIPE2B____header_global_e17f37fea42f563c = ((((((633) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6d10c46f5e1baf8f8cc45564() {
  return __cxx_static_address_6d10c46f5e1baf8f8cc45564.reference || (__cxx_static_address_6d10c46f5e1baf8f8cc45564.reference = {
    __cReference: true,
    get value() { return PIPE2B____header_global_e17f37fea42f563c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:355
export const BOLT1____header_global_b64776d58dcbd9aa = ((((((634) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b9625df2be42ad18678f9cf7() {
  return __cxx_static_address_b9625df2be42ad18678f9cf7.reference || (__cxx_static_address_b9625df2be42ad18678f9cf7.reference = {
    __cReference: true,
    get value() { return BOLT1____header_global_b64776d58dcbd9aa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:356
export const W_NUMBERS____header_global_1aac51d2002d9837 = ((((((640) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c715ddb85344732eb47027d9() {
  return __cxx_static_address_c715ddb85344732eb47027d9.reference || (__cxx_static_address_c715ddb85344732eb47027d9.reference = {
    __cReference: true,
    get value() { return W_NUMBERS____header_global_1aac51d2002d9837; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:357
export const WATERDRIP____header_global_eeb9be1d83040724 = ((((((660) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ccb28c880781a5af847d5dac() {
  return __cxx_static_address_ccb28c880781a5af847d5dac.reference || (__cxx_static_address_ccb28c880781a5af847d5dac.reference = {
    __cReference: true,
    get value() { return WATERDRIP____header_global_eeb9be1d83040724; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:358
export const WATERBUBBLE____header_global_c79ed58334d6d241 = ((((((661) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3f3f763ba289f64205130d92() {
  return __cxx_static_address_3f3f763ba289f64205130d92.reference || (__cxx_static_address_3f3f763ba289f64205130d92.reference = {
    __cReference: true,
    get value() { return WATERBUBBLE____header_global_c79ed58334d6d241; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:359
export const WATERBUBBLEMAKER____header_global_e4c5f3d9501a7e15 = ((((((662) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_74e73b8d215f32cb3b450f8a() {
  return __cxx_static_address_74e73b8d215f32cb3b450f8a.reference || (__cxx_static_address_74e73b8d215f32cb3b450f8a.reference = {
    __cReference: true,
    get value() { return WATERBUBBLEMAKER____header_global_e4c5f3d9501a7e15; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:360
export const W_FORCEFIELD____header_global_277c6e24689c5034 = ((((((663) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ca5bf88098e111678682a184() {
  return __cxx_static_address_ca5bf88098e111678682a184.reference || (__cxx_static_address_ca5bf88098e111678682a184.reference = {
    __cReference: true,
    get value() { return W_FORCEFIELD____header_global_277c6e24689c5034; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:361
export const VACUUM____header_global_feaeb21427dd55a6 = ((((((669) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3f346744e914153361841b27() {
  return __cxx_static_address_3f346744e914153361841b27.reference || (__cxx_static_address_3f346744e914153361841b27.reference = {
    __cReference: true,
    get value() { return VACUUM____header_global_feaeb21427dd55a6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:362
export const FOOTPRINTS2____header_global_e9b8419e0009c1f5 = ((((((672) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6f7fd7a2683a90fdddd4da8a() {
  return __cxx_static_address_6f7fd7a2683a90fdddd4da8a.reference || (__cxx_static_address_6f7fd7a2683a90fdddd4da8a.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS2____header_global_e9b8419e0009c1f5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:363
export const FOOTPRINTS3____header_global_9cad522b9dd2d938 = ((((((673) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_972e632d9f06c23e3fc1d92c() {
  return __cxx_static_address_972e632d9f06c23e3fc1d92c.reference || (__cxx_static_address_972e632d9f06c23e3fc1d92c.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS3____header_global_9cad522b9dd2d938; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:364
export const FOOTPRINTS4____header_global_d18ac0fa7950fe1f = ((((((674) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_68d79a710be746de65500dae() {
  return __cxx_static_address_68d79a710be746de65500dae.reference || (__cxx_static_address_68d79a710be746de65500dae.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS4____header_global_d18ac0fa7950fe1f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:365
export const EGG____header_global_a04d030a4306136c = ((((((675) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8f46d80416b397ed0528555d() {
  return __cxx_static_address_8f46d80416b397ed0528555d.reference || (__cxx_static_address_8f46d80416b397ed0528555d.reference = {
    __cReference: true,
    get value() { return EGG____header_global_a04d030a4306136c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:366
export const SCALE____header_global_ec61052b80e61520 = ((((((678) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bb3be62846d2ac50b982f29d() {
  return __cxx_static_address_bb3be62846d2ac50b982f29d.reference || (__cxx_static_address_bb3be62846d2ac50b982f29d.reference = {
    __cReference: true,
    get value() { return SCALE____header_global_ec61052b80e61520; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:367
export const CHAIR3____header_global_0c102cee203ff966 = ((((((680) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e82dd79465fa001595f153d() {
  return __cxx_static_address_1e82dd79465fa001595f153d.reference || (__cxx_static_address_1e82dd79465fa001595f153d.reference = {
    __cReference: true,
    get value() { return CHAIR3____header_global_0c102cee203ff966; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:368
export const CAMERALIGHT____header_global_36ef51a95a31032a = ((((((685) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cea266fed3d61402f47dabc9() {
  return __cxx_static_address_cea266fed3d61402f47dabc9.reference || (__cxx_static_address_cea266fed3d61402f47dabc9.reference = {
    __cReference: true,
    get value() { return CAMERALIGHT____header_global_36ef51a95a31032a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:369
export const MOVIECAMERA____header_global_f7a510fa83120dcc = ((((((686) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_36e07406d6b780778481483a() {
  return __cxx_static_address_36e07406d6b780778481483a.reference || (__cxx_static_address_36e07406d6b780778481483a.reference = {
    __cReference: true,
    get value() { return MOVIECAMERA____header_global_f7a510fa83120dcc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:370
export const IVUNIT____header_global_4ad6e920f9b8b4e6 = ((((((689) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b036b017c09e16afab383b9c() {
  return __cxx_static_address_b036b017c09e16afab383b9c.reference || (__cxx_static_address_b036b017c09e16afab383b9c.reference = {
    __cReference: true,
    get value() { return IVUNIT____header_global_4ad6e920f9b8b4e6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:371
export const POT1____header_global_ee917d317c6b6ae4 = ((((((694) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e0a64b556c0d241382721271() {
  return __cxx_static_address_e0a64b556c0d241382721271.reference || (__cxx_static_address_e0a64b556c0d241382721271.reference = {
    __cReference: true,
    get value() { return POT1____header_global_ee917d317c6b6ae4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:372
export const POT2____header_global_0a0be5b4ea9bad80 = ((((((695) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_075f33f607e4342331db6cea() {
  return __cxx_static_address_075f33f607e4342331db6cea.reference || (__cxx_static_address_075f33f607e4342331db6cea.reference = {
    __cReference: true,
    get value() { return POT2____header_global_0a0be5b4ea9bad80; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:373
export const POT3____header_global_aae06005936f0f86 = ((((((697) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e5ffcd6eb3662e76b768345() {
  return __cxx_static_address_1e5ffcd6eb3662e76b768345.reference || (__cxx_static_address_1e5ffcd6eb3662e76b768345.reference = {
    __cReference: true,
    get value() { return POT3____header_global_aae06005936f0f86; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:374
export const PIPE3B____header_global_b40807b7b45ae5eb = ((((((700) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6613b4a0571cc890546fc4ee() {
  return __cxx_static_address_6613b4a0571cc890546fc4ee.reference || (__cxx_static_address_6613b4a0571cc890546fc4ee.reference = {
    __cReference: true,
    get value() { return PIPE3B____header_global_b40807b7b45ae5eb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:375
export const WALLLIGHT3____header_global_1fba26e703d4670d = ((((((701) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_30edec78f4c6434b4ad8110e() {
  return __cxx_static_address_30edec78f4c6434b4ad8110e.reference || (__cxx_static_address_30edec78f4c6434b4ad8110e.reference = {
    __cReference: true,
    get value() { return WALLLIGHT3____header_global_1fba26e703d4670d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:376
export const WALLLIGHTBUST3____header_global_db32d2032de8124d = ((((((702) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5dcfb19c963f4ed0649d294d() {
  return __cxx_static_address_5dcfb19c963f4ed0649d294d.reference || (__cxx_static_address_5dcfb19c963f4ed0649d294d.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST3____header_global_db32d2032de8124d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:377
export const WALLLIGHT1____header_global_2fe81dbf206ad29e = ((((((703) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_74ebfb5c016befdac6c689be() {
  return __cxx_static_address_74ebfb5c016befdac6c689be.reference || (__cxx_static_address_74ebfb5c016befdac6c689be.reference = {
    __cReference: true,
    get value() { return WALLLIGHT1____header_global_2fe81dbf206ad29e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:378
export const WALLLIGHTBUST1____header_global_494d7f40873dfb32 = ((((((704) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_718a09bc059dc5794f3fc235() {
  return __cxx_static_address_718a09bc059dc5794f3fc235.reference || (__cxx_static_address_718a09bc059dc5794f3fc235.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST1____header_global_494d7f40873dfb32; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:379
export const WALLLIGHT2____header_global_54c26f1c46ee6438 = ((((((705) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6728e2002d9b1dc7d435fed7() {
  return __cxx_static_address_6728e2002d9b1dc7d435fed7.reference || (__cxx_static_address_6728e2002d9b1dc7d435fed7.reference = {
    __cReference: true,
    get value() { return WALLLIGHT2____header_global_54c26f1c46ee6438; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:380
export const WALLLIGHTBUST2____header_global_c4e5326ccb2e0c9b = ((((((706) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_791bcccae50dc49b09f96a45() {
  return __cxx_static_address_791bcccae50dc49b09f96a45.reference || (__cxx_static_address_791bcccae50dc49b09f96a45.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST2____header_global_c4e5326ccb2e0c9b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:381
export const LIGHTSWITCH2____header_global_7f9f84af50f4916c = ((((((712) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_46e509ff0197e62bf0fca649() {
  return __cxx_static_address_46e509ff0197e62bf0fca649.reference || (__cxx_static_address_46e509ff0197e62bf0fca649.reference = {
    __cReference: true,
    get value() { return LIGHTSWITCH2____header_global_7f9f84af50f4916c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:382
export const WAITTOBESEATED____header_global_fcc21398720d78b0 = ((((((716) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_56b858667032ceb07d4812c7() {
  return __cxx_static_address_56b858667032ceb07d4812c7.reference || (__cxx_static_address_56b858667032ceb07d4812c7.reference = {
    __cReference: true,
    get value() { return WAITTOBESEATED____header_global_fcc21398720d78b0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:383
export const DOORTILE14____header_global_f73b7a353a9311a9 = ((((((717) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_af2555c124e31d75c8ca9692() {
  return __cxx_static_address_af2555c124e31d75c8ca9692.reference || (__cxx_static_address_af2555c124e31d75c8ca9692.reference = {
    __cReference: true,
    get value() { return DOORTILE14____header_global_f73b7a353a9311a9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:384
export const STATUE____header_global_a4becdcdd8e60ae1 = ((((((753) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_25c122916a1a739eec58d8d6() {
  return __cxx_static_address_25c122916a1a739eec58d8d6.reference || (__cxx_static_address_25c122916a1a739eec58d8d6.reference = {
    __cReference: true,
    get value() { return STATUE____header_global_a4becdcdd8e60ae1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:385
export const MIKE____header_global_d39fe5cbe0336ad4 = ((((((762) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_368c64957fff48bc1fcdc00b() {
  return __cxx_static_address_368c64957fff48bc1fcdc00b.reference || (__cxx_static_address_368c64957fff48bc1fcdc00b.reference = {
    __cReference: true,
    get value() { return MIKE____header_global_d39fe5cbe0336ad4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:386
export const VASE____header_global_44f1f606b8bde33c = ((((((765) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c6c02d76966db55aa9c35f02() {
  return __cxx_static_address_c6c02d76966db55aa9c35f02.reference || (__cxx_static_address_c6c02d76966db55aa9c35f02.reference = {
    __cReference: true,
    get value() { return VASE____header_global_44f1f606b8bde33c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:387
export const SUSHIPLATE1____header_global_0cccbb5da7d905d0 = ((((((768) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a24c59c12c8a2b1be8937709() {
  return __cxx_static_address_a24c59c12c8a2b1be8937709.reference || (__cxx_static_address_a24c59c12c8a2b1be8937709.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE1____header_global_0cccbb5da7d905d0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:388
export const SUSHIPLATE2____header_global_d259474d8deac0ff = ((((((769) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_92c972c3752a6ab36e1069d4() {
  return __cxx_static_address_92c972c3752a6ab36e1069d4.reference || (__cxx_static_address_92c972c3752a6ab36e1069d4.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE2____header_global_d259474d8deac0ff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:389
export const SUSHIPLATE3____header_global_5acbb6972ccb4fa8 = ((((((774) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1ea0530edce67b7b60813de4() {
  return __cxx_static_address_1ea0530edce67b7b60813de4.reference || (__cxx_static_address_1ea0530edce67b7b60813de4.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE3____header_global_5acbb6972ccb4fa8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:390
export const SUSHIPLATE4____header_global_309da3b9a1f69984 = ((((((779) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_569a521f898df3d5d5284de7() {
  return __cxx_static_address_569a521f898df3d5d5284de7.reference || (__cxx_static_address_569a521f898df3d5d5284de7.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE4____header_global_309da3b9a1f69984; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:391
export const DOORTILE16____header_global_b02bc9ba5647f08b = ((((((781) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_999814dad11d0cab04b1e0fa() {
  return __cxx_static_address_999814dad11d0cab04b1e0fa.reference || (__cxx_static_address_999814dad11d0cab04b1e0fa.reference = {
    __cReference: true,
    get value() { return DOORTILE16____header_global_b02bc9ba5647f08b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:392
export const SUSHIPLATE5____header_global_a4531259f7463587 = ((((((792) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_65a14fd4c282d8167a05b6f9() {
  return __cxx_static_address_65a14fd4c282d8167a05b6f9.reference || (__cxx_static_address_65a14fd4c282d8167a05b6f9.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE5____header_global_a4531259f7463587; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:393
export const OJ____header_global_35c1eafbd9ae2e7b = ((((((806) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2951d93c794a065cb9d7410a() {
  return __cxx_static_address_2951d93c794a065cb9d7410a.reference || (__cxx_static_address_2951d93c794a065cb9d7410a.reference = {
    __cReference: true,
    get value() { return OJ____header_global_35c1eafbd9ae2e7b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:394
export const MASKWALL13____header_global_8a4bac26287c2224 = ((((((830) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b632ea099f056e30008553a0() {
  return __cxx_static_address_b632ea099f056e30008553a0.reference || (__cxx_static_address_b632ea099f056e30008553a0.reference = {
    __cReference: true,
    get value() { return MASKWALL13____header_global_8a4bac26287c2224; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:395
export const HURTRAIL____header_global_3a91c067b981f29b = ((((((859) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d85a95b03100bc387d4df1ea() {
  return __cxx_static_address_d85a95b03100bc387d4df1ea.reference || (__cxx_static_address_d85a95b03100bc387d4df1ea.reference = {
    __cReference: true,
    get value() { return HURTRAIL____header_global_3a91c067b981f29b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:396
export const POWERSWITCH1____header_global_950add91d5776277 = ((((((860) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_859183d779264bdacdce3af7() {
  return __cxx_static_address_859183d779264bdacdce3af7.reference || (__cxx_static_address_859183d779264bdacdce3af7.reference = {
    __cReference: true,
    get value() { return POWERSWITCH1____header_global_950add91d5776277; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:397
export const LOCKSWITCH1____header_global_3bb2967f8898bcb9 = ((((((862) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3a0d01b78cf52618f55f1642() {
  return __cxx_static_address_3a0d01b78cf52618f55f1642.reference || (__cxx_static_address_3a0d01b78cf52618f55f1642.reference = {
    __cReference: true,
    get value() { return LOCKSWITCH1____header_global_3bb2967f8898bcb9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:398
export const POWERSWITCH2____header_global_32d7c34b1961278d = ((((((864) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_893a44652c10287fe280fbe4() {
  return __cxx_static_address_893a44652c10287fe280fbe4.reference || (__cxx_static_address_893a44652c10287fe280fbe4.reference = {
    __cReference: true,
    get value() { return POWERSWITCH2____header_global_32d7c34b1961278d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:399
export const ATM____header_global_d606c72d4d28eff7 = ((((((867) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ac8d82dd9a050ca3d6d20593() {
  return __cxx_static_address_ac8d82dd9a050ca3d6d20593.reference || (__cxx_static_address_ac8d82dd9a050ca3d6d20593.reference = {
    __cReference: true,
    get value() { return ATM____header_global_d606c72d4d28eff7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:400
export const STATUEFLASH____header_global_0960428f3bfb5a42 = ((((((869) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_af0f7bdf391185547f8a78eb() {
  return __cxx_static_address_af0f7bdf391185547f8a78eb.reference || (__cxx_static_address_af0f7bdf391185547f8a78eb.reference = {
    __cReference: true,
    get value() { return STATUEFLASH____header_global_0960428f3bfb5a42; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:401
export const ATMBROKE____header_global_692d3b6a6b6603cd = ((((((888) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5f211f6cf7bd64e13e58b731() {
  return __cxx_static_address_5f211f6cf7bd64e13e58b731.reference || (__cxx_static_address_5f211f6cf7bd64e13e58b731.reference = {
    __cReference: true,
    get value() { return ATMBROKE____header_global_692d3b6a6b6603cd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:402
export const STRIPEBALL____header_global_bfc70d746c8bc263 = ((((((901) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6da7c255b9c25a0454dc8bbe() {
  return __cxx_static_address_6da7c255b9c25a0454dc8bbe.reference || (__cxx_static_address_6da7c255b9c25a0454dc8bbe.reference = {
    __cReference: true,
    get value() { return STRIPEBALL____header_global_bfc70d746c8bc263; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:403
export const QUEBALL____header_global_11f32114237313c8 = ((((((902) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0ef7f4e0e697b5056571c28d() {
  return __cxx_static_address_0ef7f4e0e697b5056571c28d.reference || (__cxx_static_address_0ef7f4e0e697b5056571c28d.reference = {
    __cReference: true,
    get value() { return QUEBALL____header_global_11f32114237313c8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:404
export const POCKET____header_global_e9431e808a6e2abd = ((((((903) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_180f052c7737e78863f1c33a() {
  return __cxx_static_address_180f052c7737e78863f1c33a.reference || (__cxx_static_address_180f052c7737e78863f1c33a.reference = {
    __cReference: true,
    get value() { return POCKET____header_global_e9431e808a6e2abd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:405
export const WOODENHORSE____header_global_14e4af81abf55a28 = ((((((904) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cf6cb8e611107f7cda2c130d() {
  return __cxx_static_address_cf6cb8e611107f7cda2c130d.reference || (__cxx_static_address_cf6cb8e611107f7cda2c130d.reference = {
    __cReference: true,
    get value() { return WOODENHORSE____header_global_14e4af81abf55a28; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:406
export const TREE1____header_global_390f742addf25286 = ((((((908) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7642ffc0a8394a53304d54fb() {
  return __cxx_static_address_7642ffc0a8394a53304d54fb.reference || (__cxx_static_address_7642ffc0a8394a53304d54fb.reference = {
    __cReference: true,
    get value() { return TREE1____header_global_390f742addf25286; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:407
export const TREE2____header_global_cd596d2510d8e718 = ((((((910) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6e2c6ef4489642994bfea155() {
  return __cxx_static_address_6e2c6ef4489642994bfea155.reference || (__cxx_static_address_6e2c6ef4489642994bfea155.reference = {
    __cReference: true,
    get value() { return TREE2____header_global_cd596d2510d8e718; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:408
export const CACTUS____header_global_60a6dc2cb45b3339 = ((((((911) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d2f4e6e844c248b9f28c88ac() {
  return __cxx_static_address_d2f4e6e844c248b9f28c88ac.reference || (__cxx_static_address_d2f4e6e844c248b9f28c88ac.reference = {
    __cReference: true,
    get value() { return CACTUS____header_global_60a6dc2cb45b3339; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:409
export const MASKWALL2____header_global_834c354df33832cf = ((((((913) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4ed3120a389e74c227830df9() {
  return __cxx_static_address_4ed3120a389e74c227830df9.reference || (__cxx_static_address_4ed3120a389e74c227830df9.reference = {
    __cReference: true,
    get value() { return MASKWALL2____header_global_834c354df33832cf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:410
export const MASKWALL3____header_global_053fb97935f2c9fe = ((((((914) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_206dd8c391cb706a81f7a533() {
  return __cxx_static_address_206dd8c391cb706a81f7a533.reference || (__cxx_static_address_206dd8c391cb706a81f7a533.reference = {
    __cReference: true,
    get value() { return MASKWALL3____header_global_053fb97935f2c9fe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:411
export const MASKWALL4____header_global_a1287f200acdbe40 = ((((((915) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_468faca55122303523573953() {
  return __cxx_static_address_468faca55122303523573953.reference || (__cxx_static_address_468faca55122303523573953.reference = {
    __cReference: true,
    get value() { return MASKWALL4____header_global_a1287f200acdbe40; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:412
export const FIREEXT____header_global_b47bba913ed12e71 = ((((((916) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3e8b21a0e52f9fa6aff986ef() {
  return __cxx_static_address_3e8b21a0e52f9fa6aff986ef.reference || (__cxx_static_address_3e8b21a0e52f9fa6aff986ef.reference = {
    __cReference: true,
    get value() { return FIREEXT____header_global_b47bba913ed12e71; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:413
export const TOILETWATER____header_global_86170f5022ae5158 = ((((((921) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_64d969413f5b053edffa6f12() {
  return __cxx_static_address_64d969413f5b053edffa6f12.reference || (__cxx_static_address_64d969413f5b053edffa6f12.reference = {
    __cReference: true,
    get value() { return TOILETWATER____header_global_86170f5022ae5158; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:414
export const NEON1____header_global_4077e956aacd07a5 = ((((((925) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_602f7af59ea7b9bc39123003() {
  return __cxx_static_address_602f7af59ea7b9bc39123003.reference || (__cxx_static_address_602f7af59ea7b9bc39123003.reference = {
    __cReference: true,
    get value() { return NEON1____header_global_4077e956aacd07a5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:415
export const NEON2____header_global_5b301c625a5162da = ((((((926) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_de4d89657415344b0b4d57b3() {
  return __cxx_static_address_de4d89657415344b0b4d57b3.reference || (__cxx_static_address_de4d89657415344b0b4d57b3.reference = {
    __cReference: true,
    get value() { return NEON2____header_global_5b301c625a5162da; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:416
export const CACTUSBROKE____header_global_97af0872465425e5 = ((((((939) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c59b8f163433e6ae79efbab2() {
  return __cxx_static_address_c59b8f163433e6ae79efbab2.reference || (__cxx_static_address_c59b8f163433e6ae79efbab2.reference = {
    __cReference: true,
    get value() { return CACTUSBROKE____header_global_97af0872465425e5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:417
export const BOUNCEMINE____header_global_b4a094a4685ec7ac = ((((((940) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cb61d58cad7033a085d8225c() {
  return __cxx_static_address_cb61d58cad7033a085d8225c.reference || (__cxx_static_address_cb61d58cad7033a085d8225c.reference = {
    __cReference: true,
    get value() { return BOUNCEMINE____header_global_b4a094a4685ec7ac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:418
export const BROKEFIREHYDRENT____header_global_53c0d18219fb6dd4 = ((((((950) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c3287c2d27ec1db1df84772c() {
  return __cxx_static_address_c3287c2d27ec1db1df84772c.reference || (__cxx_static_address_c3287c2d27ec1db1df84772c.reference = {
    __cReference: true,
    get value() { return BROKEFIREHYDRENT____header_global_53c0d18219fb6dd4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:419
export const BOX____header_global_69995cf6769decd7 = ((((((951) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6f2608a93529a97f1da8e5c0() {
  return __cxx_static_address_6f2608a93529a97f1da8e5c0.reference || (__cxx_static_address_6f2608a93529a97f1da8e5c0.reference = {
    __cReference: true,
    get value() { return BOX____header_global_69995cf6769decd7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:420
export const BULLETHOLE____header_global_b9ee152ca79c4264 = ((((((952) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ea1783b477b7a0d9f587eb1c() {
  return __cxx_static_address_ea1783b477b7a0d9f587eb1c.reference || (__cxx_static_address_ea1783b477b7a0d9f587eb1c.reference = {
    __cReference: true,
    get value() { return BULLETHOLE____header_global_b9ee152ca79c4264; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:421
export const BOTTLE1____header_global_2f5d2054032b32e8 = ((((((954) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_09b26fe3e25ce6aa506fb8d6() {
  return __cxx_static_address_09b26fe3e25ce6aa506fb8d6.reference || (__cxx_static_address_09b26fe3e25ce6aa506fb8d6.reference = {
    __cReference: true,
    get value() { return BOTTLE1____header_global_2f5d2054032b32e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:422
export const BOTTLE2____header_global_b3000c25b2b6434e = ((((((955) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7ce1ed70b0218975dcde7345() {
  return __cxx_static_address_7ce1ed70b0218975dcde7345.reference || (__cxx_static_address_7ce1ed70b0218975dcde7345.reference = {
    __cReference: true,
    get value() { return BOTTLE2____header_global_b3000c25b2b6434e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:423
export const BOTTLE3____header_global_5585272c207b5081 = ((((((956) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bce6cfcf0016cf1358a691f4() {
  return __cxx_static_address_bce6cfcf0016cf1358a691f4.reference || (__cxx_static_address_bce6cfcf0016cf1358a691f4.reference = {
    __cReference: true,
    get value() { return BOTTLE3____header_global_5585272c207b5081; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:424
export const BOTTLE4____header_global_ce733934592e62f4 = ((((((957) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b2b939de80d294aa781ab435() {
  return __cxx_static_address_b2b939de80d294aa781ab435.reference || (__cxx_static_address_b2b939de80d294aa781ab435.reference = {
    __cReference: true,
    get value() { return BOTTLE4____header_global_ce733934592e62f4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:425
export const FEMPIC5____header_global_b63e2388fbe22a57 = ((((((963) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1a42fcaddfcd36b5bee4fe1c() {
  return __cxx_static_address_1a42fcaddfcd36b5bee4fe1c.reference || (__cxx_static_address_1a42fcaddfcd36b5bee4fe1c.reference = {
    __cReference: true,
    get value() { return FEMPIC5____header_global_b63e2388fbe22a57; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:426
export const FEMPIC6____header_global_f8b04bf5eb8eea1d = ((((((964) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ec17a7a9b6bb018857092256() {
  return __cxx_static_address_ec17a7a9b6bb018857092256.reference || (__cxx_static_address_ec17a7a9b6bb018857092256.reference = {
    __cReference: true,
    get value() { return FEMPIC6____header_global_f8b04bf5eb8eea1d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:427
export const FEMPIC7____header_global_abdcf78ef0d6ace6 = ((((((965) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e933fdac0c2d90732cd5eb33() {
  return __cxx_static_address_e933fdac0c2d90732cd5eb33.reference || (__cxx_static_address_e933fdac0c2d90732cd5eb33.reference = {
    __cReference: true,
    get value() { return FEMPIC7____header_global_abdcf78ef0d6ace6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:428
export const HYDROPLANT____header_global_2852fa3a116d543d = ((((((969) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_379c0cdae4017b20ed780e93() {
  return __cxx_static_address_379c0cdae4017b20ed780e93.reference || (__cxx_static_address_379c0cdae4017b20ed780e93.reference = {
    __cReference: true,
    get value() { return HYDROPLANT____header_global_2852fa3a116d543d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:429
export const OCEANSPRITE1____header_global_9d3b21535d5661a6 = ((((((971) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9a0fbef0576fdc327ab58306() {
  return __cxx_static_address_9a0fbef0576fdc327ab58306.reference || (__cxx_static_address_9a0fbef0576fdc327ab58306.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE1____header_global_9d3b21535d5661a6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:430
export const OCEANSPRITE2____header_global_3d5d0dcd38330ae2 = ((((((972) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7a488bb0c1394b457dee96a0() {
  return __cxx_static_address_7a488bb0c1394b457dee96a0.reference || (__cxx_static_address_7a488bb0c1394b457dee96a0.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE2____header_global_3d5d0dcd38330ae2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:431
export const OCEANSPRITE3____header_global_1b5cb7eb5741d6b1 = ((((((973) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c22a91a33cd8ed85025c4208() {
  return __cxx_static_address_c22a91a33cd8ed85025c4208.reference || (__cxx_static_address_c22a91a33cd8ed85025c4208.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE3____header_global_1b5cb7eb5741d6b1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:432
export const OCEANSPRITE4____header_global_b5d43eb7cf5fc38b = ((((((974) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_57cd509309e1b50b1a5fd320() {
  return __cxx_static_address_57cd509309e1b50b1a5fd320.reference || (__cxx_static_address_57cd509309e1b50b1a5fd320.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE4____header_global_b5d43eb7cf5fc38b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:433
export const OCEANSPRITE5____header_global_c7267f51376e2c03 = ((((((975) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a7c1ee8f7d2062ccd0bad2d2() {
  return __cxx_static_address_a7c1ee8f7d2062ccd0bad2d2.reference || (__cxx_static_address_a7c1ee8f7d2062ccd0bad2d2.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE5____header_global_c7267f51376e2c03; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:434
export const GENERICPOLE____header_global_1a58cb0a29880487 = ((((((977) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e939259ae648a2a4a082358e() {
  return __cxx_static_address_e939259ae648a2a4a082358e.reference || (__cxx_static_address_e939259ae648a2a4a082358e.reference = {
    __cReference: true,
    get value() { return GENERICPOLE____header_global_1a58cb0a29880487; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:435
export const CONE____header_global_137eb5cbf1aa3006 = ((((((978) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_65f2534d302e5bbcb2057b56() {
  return __cxx_static_address_65f2534d302e5bbcb2057b56.reference || (__cxx_static_address_65f2534d302e5bbcb2057b56.reference = {
    __cReference: true,
    get value() { return CONE____header_global_137eb5cbf1aa3006; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:436
export const HANGLIGHT____header_global_5d9a68936e679002 = ((((((979) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_70339654d64d17a0717a4c6c() {
  return __cxx_static_address_70339654d64d17a0717a4c6c.reference || (__cxx_static_address_70339654d64d17a0717a4c6c.reference = {
    __cReference: true,
    get value() { return HANGLIGHT____header_global_5d9a68936e679002; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:437
export const HYDRENT____header_global_31639aae947212ba = ((((((981) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_75a6762aa482116eeb8c148e() {
  return __cxx_static_address_75a6762aa482116eeb8c148e.reference || (__cxx_static_address_75a6762aa482116eeb8c148e.reference = {
    __cReference: true,
    get value() { return HYDRENT____header_global_31639aae947212ba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:438
export const MASKWALL14____header_global_425c3cd389afce07 = ((((((988) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_05776638bb864951ad424593() {
  return __cxx_static_address_05776638bb864951ad424593.reference || (__cxx_static_address_05776638bb864951ad424593.reference = {
    __cReference: true,
    get value() { return MASKWALL14____header_global_425c3cd389afce07; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:439
export const TIRE____header_global_89ba39926c78aa7a = ((((((990) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8291265a0385b5a458808432() {
  return __cxx_static_address_8291265a0385b5a458808432.reference || (__cxx_static_address_8291265a0385b5a458808432.reference = {
    __cReference: true,
    get value() { return TIRE____header_global_89ba39926c78aa7a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:440
export const PIPE5____header_global_0a4417c63c2da319 = ((((((994) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1b038b453083b941c84dc93f() {
  return __cxx_static_address_1b038b453083b941c84dc93f.reference || (__cxx_static_address_1b038b453083b941c84dc93f.reference = {
    __cReference: true,
    get value() { return PIPE5____header_global_0a4417c63c2da319; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:441
export const PIPE6____header_global_fed8d230ccb5bf84 = ((((((995) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a627d22f9dc7e2252e53aa8a() {
  return __cxx_static_address_a627d22f9dc7e2252e53aa8a.reference || (__cxx_static_address_a627d22f9dc7e2252e53aa8a.reference = {
    __cReference: true,
    get value() { return PIPE6____header_global_fed8d230ccb5bf84; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:442
export const PIPE4____header_global_c3dd80a5d2345fb2 = ((((((996) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bc07c0d1d0712326b5c965e0() {
  return __cxx_static_address_bc07c0d1d0712326b5c965e0.reference || (__cxx_static_address_bc07c0d1d0712326b5c965e0.reference = {
    __cReference: true,
    get value() { return PIPE4____header_global_c3dd80a5d2345fb2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:443
export const PIPE4B____header_global_a5d70bf12168e30c = ((((((997) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d6c1ba4b5b97138aba895c0c() {
  return __cxx_static_address_d6c1ba4b5b97138aba895c0c.reference || (__cxx_static_address_d6c1ba4b5b97138aba895c0c.reference = {
    __cReference: true,
    get value() { return PIPE4B____header_global_a5d70bf12168e30c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:444
export const BROKEHYDROPLANT____header_global_f5991c788f1d7d6d = ((((((1003) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f89f242b62c40b488a052fe0() {
  return __cxx_static_address_f89f242b62c40b488a052fe0.reference || (__cxx_static_address_f89f242b62c40b488a052fe0.reference = {
    __cReference: true,
    get value() { return BROKEHYDROPLANT____header_global_f5991c788f1d7d6d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:445
export const PIPE5B____header_global_f29b22721c6dd46a = ((((((1005) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_28a6175b5a89b372da315960() {
  return __cxx_static_address_28a6175b5a89b372da315960.reference || (__cxx_static_address_28a6175b5a89b372da315960.reference = {
    __cReference: true,
    get value() { return PIPE5B____header_global_f29b22721c6dd46a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:446
export const NEON3____header_global_862d8af62bbde119 = ((((((1007) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a77360ec5410c9d9ff4bf1fb() {
  return __cxx_static_address_a77360ec5410c9d9ff4bf1fb.reference || (__cxx_static_address_a77360ec5410c9d9ff4bf1fb.reference = {
    __cReference: true,
    get value() { return NEON3____header_global_862d8af62bbde119; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:447
export const NEON4____header_global_e7ced58abeaf61c2 = ((((((1008) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c3ad04147ea275164072729c() {
  return __cxx_static_address_c3ad04147ea275164072729c.reference || (__cxx_static_address_c3ad04147ea275164072729c.reference = {
    __cReference: true,
    get value() { return NEON4____header_global_e7ced58abeaf61c2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:448
export const NEON5____header_global_8dd93d2bed88e6b6 = ((((((1009) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a7f808a870e09b7407bd4753() {
  return __cxx_static_address_a7f808a870e09b7407bd4753.reference || (__cxx_static_address_a7f808a870e09b7407bd4753.reference = {
    __cReference: true,
    get value() { return NEON5____header_global_8dd93d2bed88e6b6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:449
export const BOTTLE5____header_global_36325d6e936f39a4 = ((((((1012) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bb2230a891231fd774198b4e() {
  return __cxx_static_address_bb2230a891231fd774198b4e.reference || (__cxx_static_address_bb2230a891231fd774198b4e.reference = {
    __cReference: true,
    get value() { return BOTTLE5____header_global_36325d6e936f39a4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:450
export const BOTTLE6____header_global_0bbf2095379f1b22 = ((((((1013) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a1a9017dae748c4e469d88db() {
  return __cxx_static_address_a1a9017dae748c4e469d88db.reference || (__cxx_static_address_a1a9017dae748c4e469d88db.reference = {
    __cReference: true,
    get value() { return BOTTLE6____header_global_0bbf2095379f1b22; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:451
export const BOTTLE8____header_global_86edc7bc93a6c5bb = ((((((1014) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_684b6e89d7e6f515753bfc41() {
  return __cxx_static_address_684b6e89d7e6f515753bfc41.reference || (__cxx_static_address_684b6e89d7e6f515753bfc41.reference = {
    __cReference: true,
    get value() { return BOTTLE8____header_global_86edc7bc93a6c5bb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:452
export const SPOTLITE____header_global_4bb672c7de1e033c = ((((((1020) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_afbdba9684272a346d5be8b9() {
  return __cxx_static_address_afbdba9684272a346d5be8b9.reference || (__cxx_static_address_afbdba9684272a346d5be8b9.reference = {
    __cReference: true,
    get value() { return SPOTLITE____header_global_4bb672c7de1e033c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:453
export const MASKWALL15____header_global_51d32fe5780909ff = ((((((1024) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b28258af67a98accfa11c4c6() {
  return __cxx_static_address_b28258af67a98accfa11c4c6.reference || (__cxx_static_address_b28258af67a98accfa11c4c6.reference = {
    __cReference: true,
    get value() { return MASKWALL15____header_global_51d32fe5780909ff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:454
export const BOTTLE7____header_global_84c164f32474d53f = ((((((1025) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a00bb9d5af02d504cbd688c3() {
  return __cxx_static_address_a00bb9d5af02d504cbd688c3.reference || (__cxx_static_address_a00bb9d5af02d504cbd688c3.reference = {
    __cReference: true,
    get value() { return BOTTLE7____header_global_84c164f32474d53f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:455
export const HORSEONSIDE____header_global_7e28edbc237ba298 = ((((((1026) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2edda82cef0a2f6615fa30a1() {
  return __cxx_static_address_2edda82cef0a2f6615fa30a1.reference || (__cxx_static_address_2edda82cef0a2f6615fa30a1.reference = {
    __cReference: true,
    get value() { return HORSEONSIDE____header_global_7e28edbc237ba298; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:456
export const GLASSPIECES____header_global_7cd4e84012623876 = ((((((1031) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b52d1f18b5652f77da52e3e4() {
  return __cxx_static_address_b52d1f18b5652f77da52e3e4.reference || (__cxx_static_address_b52d1f18b5652f77da52e3e4.reference = {
    __cReference: true,
    get value() { return GLASSPIECES____header_global_7cd4e84012623876; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:457
export const NEON6____header_global_71c523c487e3ed53 = ((((((1046) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d64d8c0604002054c5724d46() {
  return __cxx_static_address_d64d8c0604002054c5724d46.reference || (__cxx_static_address_d64d8c0604002054c5724d46.reference = {
    __cReference: true,
    get value() { return NEON6____header_global_71c523c487e3ed53; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:458
export const MASKWALL6____header_global_ba3fabcd80008aa2 = ((((((1059) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ad09dfb51ddb4a069f0e2e62() {
  return __cxx_static_address_ad09dfb51ddb4a069f0e2e62.reference || (__cxx_static_address_ad09dfb51ddb4a069f0e2e62.reference = {
    __cReference: true,
    get value() { return MASKWALL6____header_global_ba3fabcd80008aa2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:459
export const RUBBERCAN____header_global_2777b7f351c82440 = ((((((1062) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_095ea8157f3e12267460e283() {
  return __cxx_static_address_095ea8157f3e12267460e283.reference || (__cxx_static_address_095ea8157f3e12267460e283.reference = {
    __cReference: true,
    get value() { return RUBBERCAN____header_global_2777b7f351c82440; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:460
export const PLUG____header_global_5844fe0e278a3b9e = ((((((1069) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4e7e01a54ffaa0fb55ac8e1e() {
  return __cxx_static_address_4e7e01a54ffaa0fb55ac8e1e.reference || (__cxx_static_address_4e7e01a54ffaa0fb55ac8e1e.reference = {
    __cReference: true,
    get value() { return PLUG____header_global_5844fe0e278a3b9e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:461
export const OOZFILTER____header_global_baef3bf2a4d708f5 = ((((((1079) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_42272eee172114d2a0cce7f8() {
  return __cxx_static_address_42272eee172114d2a0cce7f8.reference || (__cxx_static_address_42272eee172114d2a0cce7f8.reference = {
    __cReference: true,
    get value() { return OOZFILTER____header_global_baef3bf2a4d708f5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:462
export const FLOORPLASMA____header_global_9dae1a75d5d05984 = ((((((1082) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ba403db00dab21f5c824f26e() {
  return __cxx_static_address_ba403db00dab21f5c824f26e.reference || (__cxx_static_address_ba403db00dab21f5c824f26e.reference = {
    __cReference: true,
    get value() { return FLOORPLASMA____header_global_9dae1a75d5d05984; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:463
export const REACTOR____header_global_7211f850fba360fa = ((((((1088) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2b93fd3090785ef4eeba7c7c() {
  return __cxx_static_address_2b93fd3090785ef4eeba7c7c.reference || (__cxx_static_address_2b93fd3090785ef4eeba7c7c.reference = {
    __cReference: true,
    get value() { return REACTOR____header_global_7211f850fba360fa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:464
export const REACTORSPARK____header_global_d9c3b37d749fc553 = ((((((1092) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6b3c5c6fa48ea5501f561dc0() {
  return __cxx_static_address_6b3c5c6fa48ea5501f561dc0.reference || (__cxx_static_address_6b3c5c6fa48ea5501f561dc0.reference = {
    __cReference: true,
    get value() { return REACTORSPARK____header_global_d9c3b37d749fc553; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:465
export const REACTORBURNT____header_global_b5cfa98edf0bebee = ((((((1096) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bf9686d77ab9c1be5b0a5575() {
  return __cxx_static_address_bf9686d77ab9c1be5b0a5575.reference || (__cxx_static_address_bf9686d77ab9c1be5b0a5575.reference = {
    __cReference: true,
    get value() { return REACTORBURNT____header_global_b5cfa98edf0bebee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:466
export const DOORTILE15____header_global_53343eaa708460e7 = ((((((1102) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cbbb2c80b921df1c5726dedd() {
  return __cxx_static_address_cbbb2c80b921df1c5726dedd.reference || (__cxx_static_address_cbbb2c80b921df1c5726dedd.reference = {
    __cReference: true,
    get value() { return DOORTILE15____header_global_53343eaa708460e7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:467
export const HANDSWITCH____header_global_120fe6c806417cd9 = ((((((1111) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c0d830fb6eca5de8579457eb() {
  return __cxx_static_address_c0d830fb6eca5de8579457eb.reference || (__cxx_static_address_c0d830fb6eca5de8579457eb.reference = {
    __cReference: true,
    get value() { return HANDSWITCH____header_global_120fe6c806417cd9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:468
export const CIRCLEPANNEL____header_global_9d91258de1cc837a = ((((((1113) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cd5e589120996f7377276da7() {
  return __cxx_static_address_cd5e589120996f7377276da7.reference || (__cxx_static_address_cd5e589120996f7377276da7.reference = {
    __cReference: true,
    get value() { return CIRCLEPANNEL____header_global_9d91258de1cc837a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:469
export const CIRCLEPANNELBROKE____header_global_35b43a230f47c190 = ((((((1114) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d94aa63729a6923d9dca8427() {
  return __cxx_static_address_d94aa63729a6923d9dca8427.reference || (__cxx_static_address_d94aa63729a6923d9dca8427.reference = {
    __cReference: true,
    get value() { return CIRCLEPANNELBROKE____header_global_35b43a230f47c190; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:470
export const PULLSWITCH____header_global_f5e74414efae00ca = ((((((1122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9eecad9a21d3bd50837f1764() {
  return __cxx_static_address_9eecad9a21d3bd50837f1764.reference || (__cxx_static_address_9eecad9a21d3bd50837f1764.reference = {
    __cReference: true,
    get value() { return PULLSWITCH____header_global_f5e74414efae00ca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:471
export const MASKWALL8____header_global_4223193c46d85a8d = ((((((1124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9fe9d3ae727de9efaaac80e2() {
  return __cxx_static_address_9fe9d3ae727de9efaaac80e2.reference || (__cxx_static_address_9fe9d3ae727de9efaaac80e2.reference = {
    __cReference: true,
    get value() { return MASKWALL8____header_global_4223193c46d85a8d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:472
export const BIGHOLE____header_global_695a64dd1b91f12f = ((((((1141) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b6bf1366ecbd9e482550b567() {
  return __cxx_static_address_b6bf1366ecbd9e482550b567.reference || (__cxx_static_address_b6bf1366ecbd9e482550b567.reference = {
    __cReference: true,
    get value() { return BIGHOLE____header_global_695a64dd1b91f12f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:473
export const ALIENSWITCH____header_global_9f8b3c28661293a1 = ((((((1142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8bc9ae4f8d5dcaf1a03e2b73() {
  return __cxx_static_address_8bc9ae4f8d5dcaf1a03e2b73.reference || (__cxx_static_address_8bc9ae4f8d5dcaf1a03e2b73.reference = {
    __cReference: true,
    get value() { return ALIENSWITCH____header_global_9f8b3c28661293a1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:474
export const DOORTILE21____header_global_ca4cf6f64cea035b = ((((((1144) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_72fb52ce192a3fbc24d8d7d1() {
  return __cxx_static_address_72fb52ce192a3fbc24d8d7d1.reference || (__cxx_static_address_72fb52ce192a3fbc24d8d7d1.reference = {
    __cReference: true,
    get value() { return DOORTILE21____header_global_ca4cf6f64cea035b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:475
export const HANDPRINTSWITCH____header_global_0ac31da454129730 = ((((((1155) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_57f8b77f625314c9fcc1a630() {
  return __cxx_static_address_57f8b77f625314c9fcc1a630.reference || (__cxx_static_address_57f8b77f625314c9fcc1a630.reference = {
    __cReference: true,
    get value() { return HANDPRINTSWITCH____header_global_0ac31da454129730; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:476
export const BOTTLE10____header_global_e68f7cf1efd1ae50 = ((((((1157) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ff6ae0a6d5ca0f1990806ed7() {
  return __cxx_static_address_ff6ae0a6d5ca0f1990806ed7.reference || (__cxx_static_address_ff6ae0a6d5ca0f1990806ed7.reference = {
    __cReference: true,
    get value() { return BOTTLE10____header_global_e68f7cf1efd1ae50; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:477
export const BOTTLE11____header_global_629e02983d409194 = ((((((1158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_20a491856f97a80f6d8e2c71() {
  return __cxx_static_address_20a491856f97a80f6d8e2c71.reference || (__cxx_static_address_20a491856f97a80f6d8e2c71.reference = {
    __cReference: true,
    get value() { return BOTTLE11____header_global_629e02983d409194; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:478
export const BOTTLE12____header_global_ac56cebbb71d6d98 = ((((((1159) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0487a2a02ecf50abe6f336f2() {
  return __cxx_static_address_0487a2a02ecf50abe6f336f2.reference || (__cxx_static_address_0487a2a02ecf50abe6f336f2.reference = {
    __cReference: true,
    get value() { return BOTTLE12____header_global_ac56cebbb71d6d98; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:479
export const BOTTLE13____header_global_74a83199cee2b805 = ((((((1160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d22189fe8d62d6c33206965a() {
  return __cxx_static_address_d22189fe8d62d6c33206965a.reference || (__cxx_static_address_d22189fe8d62d6c33206965a.reference = {
    __cReference: true,
    get value() { return BOTTLE13____header_global_74a83199cee2b805; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:480
export const BOTTLE14____header_global_4f8f465745858780 = ((((((1161) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_884a7efbd1a623e2b7a2320b() {
  return __cxx_static_address_884a7efbd1a623e2b7a2320b.reference || (__cxx_static_address_884a7efbd1a623e2b7a2320b.reference = {
    __cReference: true,
    get value() { return BOTTLE14____header_global_4f8f465745858780; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:481
export const BOTTLE15____header_global_350e90ede704ecc5 = ((((((1162) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ba3650a6ff0131947c20a210() {
  return __cxx_static_address_ba3650a6ff0131947c20a210.reference || (__cxx_static_address_ba3650a6ff0131947c20a210.reference = {
    __cReference: true,
    get value() { return BOTTLE15____header_global_350e90ede704ecc5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:482
export const BOTTLE16____header_global_f09ad308fba1b18f = ((((((1163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0c076cff935d45011960cbe5() {
  return __cxx_static_address_0c076cff935d45011960cbe5.reference || (__cxx_static_address_0c076cff935d45011960cbe5.reference = {
    __cReference: true,
    get value() { return BOTTLE16____header_global_f09ad308fba1b18f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:483
export const BOTTLE17____header_global_c26e0bdc92dfe99a = ((((((1164) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_817625fe8f5b8d052874271c() {
  return __cxx_static_address_817625fe8f5b8d052874271c.reference || (__cxx_static_address_817625fe8f5b8d052874271c.reference = {
    __cReference: true,
    get value() { return BOTTLE17____header_global_c26e0bdc92dfe99a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:484
export const BOTTLE18____header_global_050a1829018a1fd3 = ((((((1165) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_813d627903ea166896ad16cf() {
  return __cxx_static_address_813d627903ea166896ad16cf.reference || (__cxx_static_address_813d627903ea166896ad16cf.reference = {
    __cReference: true,
    get value() { return BOTTLE18____header_global_050a1829018a1fd3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:485
export const BOTTLE19____header_global_e031791bd2d5adf3 = ((((((1166) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7d5ecb314b90dd7455c34ec3() {
  return __cxx_static_address_7d5ecb314b90dd7455c34ec3.reference || (__cxx_static_address_7d5ecb314b90dd7455c34ec3.reference = {
    __cReference: true,
    get value() { return BOTTLE19____header_global_e031791bd2d5adf3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:486
export const DOORTILE17____header_global_b6bf81041f5db443 = ((((((1169) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8d4b0c10c24165d577bec628() {
  return __cxx_static_address_8d4b0c10c24165d577bec628.reference || (__cxx_static_address_8d4b0c10c24165d577bec628.reference = {
    __cReference: true,
    get value() { return DOORTILE17____header_global_b6bf81041f5db443; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:487
export const MASKWALL7____header_global_f6f9dbdd87468445 = ((((((1174) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6ecdc5b03f56ffec295e87e0() {
  return __cxx_static_address_6ecdc5b03f56ffec295e87e0.reference || (__cxx_static_address_6ecdc5b03f56ffec295e87e0.reference = {
    __cReference: true,
    get value() { return MASKWALL7____header_global_f6f9dbdd87468445; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:488
export const DOORTILE11____header_global_13f7187884cf63fa = ((((((1178) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2b0a42d1f6a73acd6ccea56b() {
  return __cxx_static_address_2b0a42d1f6a73acd6ccea56b.reference || (__cxx_static_address_2b0a42d1f6a73acd6ccea56b.reference = {
    __cReference: true,
    get value() { return DOORTILE11____header_global_13f7187884cf63fa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:489
export const DOORTILE12____header_global_85461fa5cd705ee9 = ((((((1179) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b4844b3dd9973a905cf7877b() {
  return __cxx_static_address_b4844b3dd9973a905cf7877b.reference || (__cxx_static_address_b4844b3dd9973a905cf7877b.reference = {
    __cReference: true,
    get value() { return DOORTILE12____header_global_85461fa5cd705ee9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:490
export const VENDMACHINE____header_global_b4b6ed1587ed60f0 = ((((((1212) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_24390e0af0e41ded42d3d911() {
  return __cxx_static_address_24390e0af0e41ded42d3d911.reference || (__cxx_static_address_24390e0af0e41ded42d3d911.reference = {
    __cReference: true,
    get value() { return VENDMACHINE____header_global_b4b6ed1587ed60f0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:491
export const COLAMACHINE____header_global_e1e7f38de6f238d0 = ((((((1215) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cd59e6554e2dca200d576e75() {
  return __cxx_static_address_cd59e6554e2dca200d576e75.reference || (__cxx_static_address_cd59e6554e2dca200d576e75.reference = {
    __cReference: true,
    get value() { return COLAMACHINE____header_global_e1e7f38de6f238d0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:492
export const CRANEPOLE____header_global_aed774cfd74c2ef0 = ((((((1221) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_67eee8789d21da7e5bc2c6a1() {
  return __cxx_static_address_67eee8789d21da7e5bc2c6a1.reference || (__cxx_static_address_67eee8789d21da7e5bc2c6a1.reference = {
    __cReference: true,
    get value() { return CRANEPOLE____header_global_aed774cfd74c2ef0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:493
export const CRANE____header_global_29c50939f4bc6e01 = ((((((1222) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_de742eea735173e386bef242() {
  return __cxx_static_address_de742eea735173e386bef242.reference || (__cxx_static_address_de742eea735173e386bef242.reference = {
    __cReference: true,
    get value() { return CRANE____header_global_29c50939f4bc6e01; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:494
export const BARBROKE____header_global_b1053209c59cfc85 = ((((((1225) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4440faa9643ae2f39573d4e8() {
  return __cxx_static_address_4440faa9643ae2f39573d4e8.reference || (__cxx_static_address_4440faa9643ae2f39573d4e8.reference = {
    __cReference: true,
    get value() { return BARBROKE____header_global_b1053209c59cfc85; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:495
export const BLOODPOOL____header_global_74763135923614b8 = ((((((1226) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ba9c6910cb127733ab355496() {
  return __cxx_static_address_ba9c6910cb127733ab355496.reference || (__cxx_static_address_ba9c6910cb127733ab355496.reference = {
    __cReference: true,
    get value() { return BLOODPOOL____header_global_74763135923614b8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:496
export const NUKEBARREL____header_global_5c0b6d8b7650c84e = ((((((1227) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f466791ec1c472f4466bf001() {
  return __cxx_static_address_f466791ec1c472f4466bf001.reference || (__cxx_static_address_f466791ec1c472f4466bf001.reference = {
    __cReference: true,
    get value() { return NUKEBARREL____header_global_5c0b6d8b7650c84e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:497
export const NUKEBARRELDENTED____header_global_306d5a43ea60ec9b = ((((((1228) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_59b07947dd75653380c63f1c() {
  return __cxx_static_address_59b07947dd75653380c63f1c.reference || (__cxx_static_address_59b07947dd75653380c63f1c.reference = {
    __cReference: true,
    get value() { return NUKEBARRELDENTED____header_global_306d5a43ea60ec9b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:498
export const NUKEBARRELLEAKED____header_global_9ad31376227a0360 = ((((((1229) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3d73a2038686c9cadc1ba3a1() {
  return __cxx_static_address_3d73a2038686c9cadc1ba3a1.reference || (__cxx_static_address_3d73a2038686c9cadc1ba3a1.reference = {
    __cReference: true,
    get value() { return NUKEBARRELLEAKED____header_global_9ad31376227a0360; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:499
export const CANWITHSOMETHING____header_global_0af16130509d7705 = ((((((1232) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b07e762eec4c56cf1e6e1981() {
  return __cxx_static_address_b07e762eec4c56cf1e6e1981.reference || (__cxx_static_address_b07e762eec4c56cf1e6e1981.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING____header_global_0af16130509d7705; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:500
export const MONEY____header_global_e3c2b902f72729bd = ((((((1233) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_62ecedd4509a585123d623a8() {
  return __cxx_static_address_62ecedd4509a585123d623a8.reference || (__cxx_static_address_62ecedd4509a585123d623a8.reference = {
    __cReference: true,
    get value() { return MONEY____header_global_e3c2b902f72729bd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:501
export const BANNER____header_global_e1655202b3ee7614 = ((((((1236) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a86f10d818997dee385ae8c4() {
  return __cxx_static_address_a86f10d818997dee385ae8c4.reference || (__cxx_static_address_a86f10d818997dee385ae8c4.reference = {
    __cReference: true,
    get value() { return BANNER____header_global_e1655202b3ee7614; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:502
export const EXPLODINGBARREL____header_global_e8d279f4b6fbbb8d = ((((((1238) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_24ddcfe922638bf141d3398b() {
  return __cxx_static_address_24ddcfe922638bf141d3398b.reference || (__cxx_static_address_24ddcfe922638bf141d3398b.reference = {
    __cReference: true,
    get value() { return EXPLODINGBARREL____header_global_e8d279f4b6fbbb8d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:503
export const EXPLODINGBARREL2____header_global_b0844b8878c47bbc = ((((((1239) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_28255b4e0af5a46219a92019() {
  return __cxx_static_address_28255b4e0af5a46219a92019.reference || (__cxx_static_address_28255b4e0af5a46219a92019.reference = {
    __cReference: true,
    get value() { return EXPLODINGBARREL2____header_global_b0844b8878c47bbc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:504
export const FIREBARREL____header_global_eeb99729ef432d52 = ((((((1240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b4a50bf01d24c230fd8989d9() {
  return __cxx_static_address_b4a50bf01d24c230fd8989d9.reference || (__cxx_static_address_b4a50bf01d24c230fd8989d9.reference = {
    __cReference: true,
    get value() { return FIREBARREL____header_global_eeb99729ef432d52; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:505
export const SEENINE____header_global_8152f4da72016bdb = ((((((1247) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dc90ef13aa1015011caeb809() {
  return __cxx_static_address_dc90ef13aa1015011caeb809.reference || (__cxx_static_address_dc90ef13aa1015011caeb809.reference = {
    __cReference: true,
    get value() { return SEENINE____header_global_8152f4da72016bdb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:506
export const SEENINEDEAD____header_global_b4ea95c6197258e4 = ((((((1248) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1dee8f584b301da01ab4800f() {
  return __cxx_static_address_1dee8f584b301da01ab4800f.reference || (__cxx_static_address_1dee8f584b301da01ab4800f.reference = {
    __cReference: true,
    get value() { return SEENINEDEAD____header_global_b4ea95c6197258e4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:507
export const STEAM____header_global_8599a8a0e3a49332 = ((((((1250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bfd57c2ec82af1a936fd6d1f() {
  return __cxx_static_address_bfd57c2ec82af1a936fd6d1f.reference || (__cxx_static_address_bfd57c2ec82af1a936fd6d1f.reference = {
    __cReference: true,
    get value() { return STEAM____header_global_8599a8a0e3a49332; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:508
export const CEILINGSTEAM____header_global_6eb4318cf15b059c = ((((((1255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_08bc7a3ca25800e0f622b865() {
  return __cxx_static_address_08bc7a3ca25800e0f622b865.reference || (__cxx_static_address_08bc7a3ca25800e0f622b865.reference = {
    __cReference: true,
    get value() { return CEILINGSTEAM____header_global_6eb4318cf15b059c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:509
export const PIPE6B____header_global_9d284dfdfad96090 = ((((((1260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fe1224cf3b84bd835dc5748b() {
  return __cxx_static_address_fe1224cf3b84bd835dc5748b.reference || (__cxx_static_address_fe1224cf3b84bd835dc5748b.reference = {
    __cReference: true,
    get value() { return PIPE6B____header_global_9d284dfdfad96090; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:510
export const TRANSPORTERBEAM____header_global_bf0e3e8f59db6f53 = ((((((1261) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c8b72ce4ceb9f6cb74254bb2() {
  return __cxx_static_address_c8b72ce4ceb9f6cb74254bb2.reference || (__cxx_static_address_c8b72ce4ceb9f6cb74254bb2.reference = {
    __cReference: true,
    get value() { return TRANSPORTERBEAM____header_global_bf0e3e8f59db6f53; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:511
export const RAT____header_global_b91bf4a42fc827aa = ((((((1267) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f1a7e008c88cd2d19444ddd1() {
  return __cxx_static_address_f1a7e008c88cd2d19444ddd1.reference || (__cxx_static_address_f1a7e008c88cd2d19444ddd1.reference = {
    __cReference: true,
    get value() { return RAT____header_global_b91bf4a42fc827aa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:512
export const TRASH____header_global_92e87d8297d955e3 = ((((((1272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_db9c5092611c4185928448e5() {
  return __cxx_static_address_db9c5092611c4185928448e5.reference || (__cxx_static_address_db9c5092611c4185928448e5.reference = {
    __cReference: true,
    get value() { return TRASH____header_global_92e87d8297d955e3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:513
export const FEMPIC1____header_global_24a32984c909702b = ((((((1280) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8761f1c6b7f00d95fafa7707() {
  return __cxx_static_address_8761f1c6b7f00d95fafa7707.reference || (__cxx_static_address_8761f1c6b7f00d95fafa7707.reference = {
    __cReference: true,
    get value() { return FEMPIC1____header_global_24a32984c909702b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:514
export const FEMPIC2____header_global_e44356fdcb9e47c7 = ((((((1289) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4ffd095a50cb667de1bb164c() {
  return __cxx_static_address_4ffd095a50cb667de1bb164c.reference || (__cxx_static_address_4ffd095a50cb667de1bb164c.reference = {
    __cReference: true,
    get value() { return FEMPIC2____header_global_e44356fdcb9e47c7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:515
export const BLANKSCREEN____header_global_e4c43c3265fa1db8 = ((((((1293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_47393bf65cea7521167406a1() {
  return __cxx_static_address_47393bf65cea7521167406a1.reference || (__cxx_static_address_47393bf65cea7521167406a1.reference = {
    __cReference: true,
    get value() { return BLANKSCREEN____header_global_e4c43c3265fa1db8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:516
export const PODFEM1____header_global_37b0b5eebc7c7d91 = ((((((1294) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7eb92e12e56f2dc438f724c2() {
  return __cxx_static_address_7eb92e12e56f2dc438f724c2.reference || (__cxx_static_address_7eb92e12e56f2dc438f724c2.reference = {
    __cReference: true,
    get value() { return PODFEM1____header_global_37b0b5eebc7c7d91; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:517
export const FEMPIC3____header_global_2a1980d8992eab2b = ((((((1298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_005206667cbba6387202edd3() {
  return __cxx_static_address_005206667cbba6387202edd3.reference || (__cxx_static_address_005206667cbba6387202edd3.reference = {
    __cReference: true,
    get value() { return FEMPIC3____header_global_2a1980d8992eab2b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:518
export const FEMPIC4____header_global_6fe523306e19e05c = ((((((1306) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_edf70ff5deaadb8de4af300e() {
  return __cxx_static_address_edf70ff5deaadb8de4af300e.reference || (__cxx_static_address_edf70ff5deaadb8de4af300e.reference = {
    __cReference: true,
    get value() { return FEMPIC4____header_global_6fe523306e19e05c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:519
export const FEM1____header_global_6f0a810c81b63c57 = ((((((1312) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bcd9ce4cbbfedcb4f0b0d7fd() {
  return __cxx_static_address_bcd9ce4cbbfedcb4f0b0d7fd.reference || (__cxx_static_address_bcd9ce4cbbfedcb4f0b0d7fd.reference = {
    __cReference: true,
    get value() { return FEM1____header_global_6f0a810c81b63c57; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:520
export const FEM2____header_global_cf979f470cd9fc5d = ((((((1317) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0e92cc43006a28dee95b49d6() {
  return __cxx_static_address_0e92cc43006a28dee95b49d6.reference || (__cxx_static_address_0e92cc43006a28dee95b49d6.reference = {
    __cReference: true,
    get value() { return FEM2____header_global_cf979f470cd9fc5d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:521
export const FEM3____header_global_ce41535671d56865 = ((((((1321) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b2b01cb8d1b7ac07a5c266e6() {
  return __cxx_static_address_b2b01cb8d1b7ac07a5c266e6.reference || (__cxx_static_address_b2b01cb8d1b7ac07a5c266e6.reference = {
    __cReference: true,
    get value() { return FEM3____header_global_ce41535671d56865; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:522
export const FEM5____header_global_452ac13de5a66b69 = ((((((1323) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ca297d7157d5855a65df04ce() {
  return __cxx_static_address_ca297d7157d5855a65df04ce.reference || (__cxx_static_address_ca297d7157d5855a65df04ce.reference = {
    __cReference: true,
    get value() { return FEM5____header_global_452ac13de5a66b69; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:523
export const BLOODYPOLE____header_global_ca06c2b1dc6eb154 = ((((((1324) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c6ea4a0fe47bf2a6f97d5199() {
  return __cxx_static_address_c6ea4a0fe47bf2a6f97d5199.reference || (__cxx_static_address_c6ea4a0fe47bf2a6f97d5199.reference = {
    __cReference: true,
    get value() { return BLOODYPOLE____header_global_ca06c2b1dc6eb154; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:524
export const FEM4____header_global_3476234642d2779b = ((((((1325) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_25ed988d78e4d270fe621e3e() {
  return __cxx_static_address_25ed988d78e4d270fe621e3e.reference || (__cxx_static_address_25ed988d78e4d270fe621e3e.reference = {
    __cReference: true,
    get value() { return FEM4____header_global_3476234642d2779b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:525
export const FEM6____header_global_641ad94fa931cbe6 = ((((((1334) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8a5d4850acdb279c16ee445c() {
  return __cxx_static_address_8a5d4850acdb279c16ee445c.reference || (__cxx_static_address_8a5d4850acdb279c16ee445c.reference = {
    __cReference: true,
    get value() { return FEM6____header_global_641ad94fa931cbe6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:526
export const FEM6PAD____header_global_432c86b155e8adfc = ((((((1335) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_32b0c92af915bb6a8ded2d86() {
  return __cxx_static_address_32b0c92af915bb6a8ded2d86.reference || (__cxx_static_address_32b0c92af915bb6a8ded2d86.reference = {
    __cReference: true,
    get value() { return FEM6PAD____header_global_432c86b155e8adfc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:527
export const FEM8____header_global_fb6a9d980a383a28 = ((((((1336) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e8d42a3b2dee1ee5f75eaea3() {
  return __cxx_static_address_e8d42a3b2dee1ee5f75eaea3.reference || (__cxx_static_address_e8d42a3b2dee1ee5f75eaea3.reference = {
    __cReference: true,
    get value() { return FEM8____header_global_fb6a9d980a383a28; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:528
export const HELECOPT____header_global_7df7ced28d23feb8 = ((((((1346) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8eae5d35fd12cb3dd0af249f() {
  return __cxx_static_address_8eae5d35fd12cb3dd0af249f.reference || (__cxx_static_address_8eae5d35fd12cb3dd0af249f.reference = {
    __cReference: true,
    get value() { return HELECOPT____header_global_7df7ced28d23feb8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:529
export const FETUSJIB____header_global_e0ce1d12041a3334 = ((((((1347) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c65a6dddadb0d83acd5decd3() {
  return __cxx_static_address_c65a6dddadb0d83acd5decd3.reference || (__cxx_static_address_c65a6dddadb0d83acd5decd3.reference = {
    __cReference: true,
    get value() { return FETUSJIB____header_global_e0ce1d12041a3334; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:530
export const HOLODUKE____header_global_8f85afaa4c13b867 = ((((((1348) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2d28e3735c218a99a8159a29() {
  return __cxx_static_address_2d28e3735c218a99a8159a29.reference || (__cxx_static_address_2d28e3735c218a99a8159a29.reference = {
    __cReference: true,
    get value() { return HOLODUKE____header_global_8f85afaa4c13b867; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:531
export const SPACEMARINE____header_global_bcf1fab4924742fb = ((((((1353) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_226094cea4754c917fe22b11() {
  return __cxx_static_address_226094cea4754c917fe22b11.reference || (__cxx_static_address_226094cea4754c917fe22b11.reference = {
    __cReference: true,
    get value() { return SPACEMARINE____header_global_bcf1fab4924742fb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:532
export const INDY____header_global_8d97df73e7079684 = ((((((1355) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5d1d3eb607cbd853cea039bf() {
  return __cxx_static_address_5d1d3eb607cbd853cea039bf.reference || (__cxx_static_address_5d1d3eb607cbd853cea039bf.reference = {
    __cReference: true,
    get value() { return INDY____header_global_8d97df73e7079684; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:533
export const FETUS____header_global_89580c88ca33e9e3 = ((((((1358) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2c2118a4730369a46617f877() {
  return __cxx_static_address_2c2118a4730369a46617f877.reference || (__cxx_static_address_2c2118a4730369a46617f877.reference = {
    __cReference: true,
    get value() { return FETUS____header_global_89580c88ca33e9e3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:534
export const FETUSBROKE____header_global_885e1cf6b481d541 = ((((((1359) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b2dd8ff4181a15af8e76b6fe() {
  return __cxx_static_address_b2dd8ff4181a15af8e76b6fe.reference || (__cxx_static_address_b2dd8ff4181a15af8e76b6fe.reference = {
    __cReference: true,
    get value() { return FETUSBROKE____header_global_885e1cf6b481d541; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:535
export const MONK____header_global_fe45a5a5a1d202fb = ((((((1352) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9cc96398a1c0f34910a883bc() {
  return __cxx_static_address_9cc96398a1c0f34910a883bc.reference || (__cxx_static_address_9cc96398a1c0f34910a883bc.reference = {
    __cReference: true,
    get value() { return MONK____header_global_fe45a5a5a1d202fb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:536
export const LUKE____header_global_ef7dea4d04ada500 = ((((((1354) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e63d09b3b7eb93103704caf4() {
  return __cxx_static_address_e63d09b3b7eb93103704caf4.reference || (__cxx_static_address_e63d09b3b7eb93103704caf4.reference = {
    __cReference: true,
    get value() { return LUKE____header_global_ef7dea4d04ada500; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:537
export const COOLEXPLOSION1____header_global_49338da3dd1dc090 = ((((((1360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a11326b1dad39646fbf74912() {
  return __cxx_static_address_a11326b1dad39646fbf74912.reference || (__cxx_static_address_a11326b1dad39646fbf74912.reference = {
    __cReference: true,
    get value() { return COOLEXPLOSION1____header_global_49338da3dd1dc090; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:538
export const WATERSPLASH2____header_global_375767245196c482 = ((((((1380) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7c8a4446939fea1256ab02ba() {
  return __cxx_static_address_7c8a4446939fea1256ab02ba.reference || (__cxx_static_address_7c8a4446939fea1256ab02ba.reference = {
    __cReference: true,
    get value() { return WATERSPLASH2____header_global_375767245196c482; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:539
export const FIREVASE____header_global_42ad454eafbb15ce = ((((((1390) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_47cc3ba0e1e4649c64fea1db() {
  return __cxx_static_address_47cc3ba0e1e4649c64fea1db.reference || (__cxx_static_address_47cc3ba0e1e4649c64fea1db.reference = {
    __cReference: true,
    get value() { return FIREVASE____header_global_42ad454eafbb15ce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:540
export const FEM7____header_global_8f504eb2bedfb92c = ((((((1395) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0a0e47c94ba2644d370e0aae() {
  return __cxx_static_address_0a0e47c94ba2644d370e0aae.reference || (__cxx_static_address_0a0e47c94ba2644d370e0aae.reference = {
    __cReference: true,
    get value() { return FEM7____header_global_8f504eb2bedfb92c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:541
export const APLAYERTOP____header_global_17795e063a1f2c33 = ((((((1400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fae073439749bed60345ec4c() {
  return __cxx_static_address_fae073439749bed60345ec4c.reference || (__cxx_static_address_fae073439749bed60345ec4c.reference = {
    __cReference: true,
    get value() { return APLAYERTOP____header_global_17795e063a1f2c33; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:542
export const APLAYER____header_global_9e3efdfd094f4f97 = ((((((1405) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9b99c4f1263be7edda5a4395() {
  return __cxx_static_address_9b99c4f1263be7edda5a4395.reference || (__cxx_static_address_9b99c4f1263be7edda5a4395.reference = {
    __cReference: true,
    get value() { return APLAYER____header_global_9e3efdfd094f4f97; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:543
export const PLAYERONWATER____header_global_ae92a50733efe660 = ((((((1420) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dbd1fa3a47f9a804f36f1b06() {
  return __cxx_static_address_dbd1fa3a47f9a804f36f1b06.reference || (__cxx_static_address_dbd1fa3a47f9a804f36f1b06.reference = {
    __cReference: true,
    get value() { return PLAYERONWATER____header_global_ae92a50733efe660; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:544
export const DUKELYINGDEAD____header_global_535491374a865213 = ((((((1518) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5cadb5cf4816997c5023230a() {
  return __cxx_static_address_5cadb5cf4816997c5023230a.reference || (__cxx_static_address_5cadb5cf4816997c5023230a.reference = {
    __cReference: true,
    get value() { return DUKELYINGDEAD____header_global_535491374a865213; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:545
export const DUKETORSO____header_global_02e7ea8f8490f860 = ((((((1520) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bb9c764900eff308db5ea0d0() {
  return __cxx_static_address_bb9c764900eff308db5ea0d0.reference || (__cxx_static_address_bb9c764900eff308db5ea0d0.reference = {
    __cReference: true,
    get value() { return DUKETORSO____header_global_02e7ea8f8490f860; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:546
export const DUKEGUN____header_global_ad78070747cee8eb = ((((((1528) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ea558bfcc818fed4f78cfee6() {
  return __cxx_static_address_ea558bfcc818fed4f78cfee6.reference || (__cxx_static_address_ea558bfcc818fed4f78cfee6.reference = {
    __cReference: true,
    get value() { return DUKEGUN____header_global_ad78070747cee8eb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:547
export const DUKELEG____header_global_5e4bcaded67fc2b1 = ((((((1536) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ac846a01f1a2c83f01a89a7d() {
  return __cxx_static_address_ac846a01f1a2c83f01a89a7d.reference || (__cxx_static_address_ac846a01f1a2c83f01a89a7d.reference = {
    __cReference: true,
    get value() { return DUKELEG____header_global_5e4bcaded67fc2b1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:548
export const SHARK____header_global_df1e04d6095581e1 = ((((((1550) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_76183b2851639cc7d69c0ed1() {
  return __cxx_static_address_76183b2851639cc7d69c0ed1.reference || (__cxx_static_address_76183b2851639cc7d69c0ed1.reference = {
    __cReference: true,
    get value() { return SHARK____header_global_df1e04d6095581e1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:549
export const BLOOD____header_global_0800246c8ae9065a = ((((((1620) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1829c5184d2b7e9d9cf6420e() {
  return __cxx_static_address_1829c5184d2b7e9d9cf6420e.reference || (__cxx_static_address_1829c5184d2b7e9d9cf6420e.reference = {
    __cReference: true,
    get value() { return BLOOD____header_global_0800246c8ae9065a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:550
export const FIRELASER____header_global_2d5ff8785631fa95 = ((((((1625) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7ec28df89f08c88bbc816603() {
  return __cxx_static_address_7ec28df89f08c88bbc816603.reference || (__cxx_static_address_7ec28df89f08c88bbc816603.reference = {
    __cReference: true,
    get value() { return FIRELASER____header_global_2d5ff8785631fa95; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:551
export const TRANSPORTERSTAR____header_global_76a096d235c4c0cf = ((((((1630) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b46e918b7f6173177766566c() {
  return __cxx_static_address_b46e918b7f6173177766566c.reference || (__cxx_static_address_b46e918b7f6173177766566c.reference = {
    __cReference: true,
    get value() { return TRANSPORTERSTAR____header_global_76a096d235c4c0cf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:552
export const SPIT____header_global_8a870de32a338236 = ((((((1636) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_25a46e62e2db9d8730f03c73() {
  return __cxx_static_address_25a46e62e2db9d8730f03c73.reference || (__cxx_static_address_25a46e62e2db9d8730f03c73.reference = {
    __cReference: true,
    get value() { return SPIT____header_global_8a870de32a338236; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:553
export const LOOGIE____header_global_ff313a631ef7eb54 = ((((((1637) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dcf610460ec47966f17085a0() {
  return __cxx_static_address_dcf610460ec47966f17085a0.reference || (__cxx_static_address_dcf610460ec47966f17085a0.reference = {
    __cReference: true,
    get value() { return LOOGIE____header_global_ff313a631ef7eb54; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:554
export const FIST____header_global_dcbd6db57c291462 = ((((((1640) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f7693a39bded49d892cf72a9() {
  return __cxx_static_address_f7693a39bded49d892cf72a9.reference || (__cxx_static_address_f7693a39bded49d892cf72a9.reference = {
    __cReference: true,
    get value() { return FIST____header_global_dcbd6db57c291462; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:555
export const FREEZEBLAST____header_global_456eda72281c363f = ((((((1641) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2bb39717c33871bccb1b5c13() {
  return __cxx_static_address_2bb39717c33871bccb1b5c13.reference || (__cxx_static_address_2bb39717c33871bccb1b5c13.reference = {
    __cReference: true,
    get value() { return FREEZEBLAST____header_global_456eda72281c363f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:556
export const SHRINKSPARK____header_global_893a076e14a97aaa = ((((((1646) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e5c8c981cff0aed22bc0cb07() {
  return __cxx_static_address_e5c8c981cff0aed22bc0cb07.reference || (__cxx_static_address_e5c8c981cff0aed22bc0cb07.reference = {
    __cReference: true,
    get value() { return SHRINKSPARK____header_global_893a076e14a97aaa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:557
export const TONGUE____header_global_9786ada744934704 = ((((((1647) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1842d707a3aba7e48ecdd7fe() {
  return __cxx_static_address_1842d707a3aba7e48ecdd7fe.reference || (__cxx_static_address_1842d707a3aba7e48ecdd7fe.reference = {
    __cReference: true,
    get value() { return TONGUE____header_global_9786ada744934704; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:558
export const MORTER____header_global_10722eb5ca385efe = ((((((1650) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c1fe0787e9dc8bcffecd54f0() {
  return __cxx_static_address_c1fe0787e9dc8bcffecd54f0.reference || (__cxx_static_address_c1fe0787e9dc8bcffecd54f0.reference = {
    __cReference: true,
    get value() { return MORTER____header_global_10722eb5ca385efe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:559
export const SHRINKEREXPLOSION____header_global_ff72ced3f7bff2c9 = ((((((1656) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c8747c096c40013106612c33() {
  return __cxx_static_address_c8747c096c40013106612c33.reference || (__cxx_static_address_c8747c096c40013106612c33.reference = {
    __cReference: true,
    get value() { return SHRINKEREXPLOSION____header_global_ff72ced3f7bff2c9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:560
export const RADIUSEXPLOSION____header_global_92fe2eee3cde3dda = ((((((1670) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6f17d3f62c31a1784c170419() {
  return __cxx_static_address_6f17d3f62c31a1784c170419.reference || (__cxx_static_address_6f17d3f62c31a1784c170419.reference = {
    __cReference: true,
    get value() { return RADIUSEXPLOSION____header_global_92fe2eee3cde3dda; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:561
export const FORCERIPPLE____header_global_aa206a77abac3146 = ((((((1671) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a5e255e054c799fabcb8665c() {
  return __cxx_static_address_a5e255e054c799fabcb8665c.reference || (__cxx_static_address_a5e255e054c799fabcb8665c.reference = {
    __cReference: true,
    get value() { return FORCERIPPLE____header_global_aa206a77abac3146; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:562
export const LIZTROOP____header_global_d4aa90fa9259b184 = ((((((1680) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_111a3aae5770f78b6c073164() {
  return __cxx_static_address_111a3aae5770f78b6c073164.reference || (__cxx_static_address_111a3aae5770f78b6c073164.reference = {
    __cReference: true,
    get value() { return LIZTROOP____header_global_d4aa90fa9259b184; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:563
export const LIZTROOPRUNNING____header_global_c676c78e55199e48 = ((((((1681) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9e70e98151b84d2763126264() {
  return __cxx_static_address_9e70e98151b84d2763126264.reference || (__cxx_static_address_9e70e98151b84d2763126264.reference = {
    __cReference: true,
    get value() { return LIZTROOPRUNNING____header_global_c676c78e55199e48; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:564
export const LIZTROOPSTAYPUT____header_global_8dbf9ed05de2fa9d = ((((((1682) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_080ce240885cd4c66d0b6094() {
  return __cxx_static_address_080ce240885cd4c66d0b6094.reference || (__cxx_static_address_080ce240885cd4c66d0b6094.reference = {
    __cReference: true,
    get value() { return LIZTROOPSTAYPUT____header_global_8dbf9ed05de2fa9d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:565
export const LIZTROOPSHOOT____header_global_5d57cf26605c6806 = ((((((1715) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c51ded914ff8049d42242528() {
  return __cxx_static_address_c51ded914ff8049d42242528.reference || (__cxx_static_address_c51ded914ff8049d42242528.reference = {
    __cReference: true,
    get value() { return LIZTROOPSHOOT____header_global_5d57cf26605c6806; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:566
export const LIZTROOPJETPACK____header_global_b55058e7d131abdf = ((((((1725) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_56559ca0e10ea9acebac8be4() {
  return __cxx_static_address_56559ca0e10ea9acebac8be4.reference || (__cxx_static_address_56559ca0e10ea9acebac8be4.reference = {
    __cReference: true,
    get value() { return LIZTROOPJETPACK____header_global_b55058e7d131abdf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:567
export const LIZTROOPONTOILET____header_global_9837b7e9d9f38301 = ((((((1741) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5ba7c6d952d1a9b3135585b1() {
  return __cxx_static_address_5ba7c6d952d1a9b3135585b1.reference || (__cxx_static_address_5ba7c6d952d1a9b3135585b1.reference = {
    __cReference: true,
    get value() { return LIZTROOPONTOILET____header_global_9837b7e9d9f38301; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:568
export const LIZTROOPJUSTSIT____header_global_676b96a6909217ff = ((((((1742) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_467d6d051a99ac8f6ff13483() {
  return __cxx_static_address_467d6d051a99ac8f6ff13483.reference || (__cxx_static_address_467d6d051a99ac8f6ff13483.reference = {
    __cReference: true,
    get value() { return LIZTROOPJUSTSIT____header_global_676b96a6909217ff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:569
export const LIZTROOPDUCKING____header_global_b5bd3f44dd8f5e82 = ((((((1744) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_84768aeeb774e5b34bf1792a() {
  return __cxx_static_address_84768aeeb774e5b34bf1792a.reference || (__cxx_static_address_84768aeeb774e5b34bf1792a.reference = {
    __cReference: true,
    get value() { return LIZTROOPDUCKING____header_global_b5bd3f44dd8f5e82; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:570
export const HEADJIB1____header_global_380a07f0fa6b1af2 = ((((((1768) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b1737d633bd2a2f26b91fe15() {
  return __cxx_static_address_b1737d633bd2a2f26b91fe15.reference || (__cxx_static_address_b1737d633bd2a2f26b91fe15.reference = {
    __cReference: true,
    get value() { return HEADJIB1____header_global_380a07f0fa6b1af2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:571
export const ARMJIB1____header_global_7ac999401094386f = ((((((1772) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d9aa0a45a3bab04e6d6397e9() {
  return __cxx_static_address_d9aa0a45a3bab04e6d6397e9.reference || (__cxx_static_address_d9aa0a45a3bab04e6d6397e9.reference = {
    __cReference: true,
    get value() { return ARMJIB1____header_global_7ac999401094386f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:572
export const LEGJIB1____header_global_9970fb2ac5eccab2 = ((((((1776) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7494cdef5a467dc65e61ef56() {
  return __cxx_static_address_7494cdef5a467dc65e61ef56.reference || (__cxx_static_address_7494cdef5a467dc65e61ef56.reference = {
    __cReference: true,
    get value() { return LEGJIB1____header_global_9970fb2ac5eccab2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:573
export const OCTABRAIN____header_global_b07500c934be4e3e = ((((((1820) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_657b06142bb6c5d39a22337d() {
  return __cxx_static_address_657b06142bb6c5d39a22337d.reference || (__cxx_static_address_657b06142bb6c5d39a22337d.reference = {
    __cReference: true,
    get value() { return OCTABRAIN____header_global_b07500c934be4e3e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:574
export const OCTABRAINSTAYPUT____header_global_6f864a0b3b0a8c2c = ((((((1821) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aa4e9303af28aaf9587044ab() {
  return __cxx_static_address_aa4e9303af28aaf9587044ab.reference || (__cxx_static_address_aa4e9303af28aaf9587044ab.reference = {
    __cReference: true,
    get value() { return OCTABRAINSTAYPUT____header_global_6f864a0b3b0a8c2c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:575
export const INNERJAW____header_global_1425ffebe0d70902 = ((((((1860) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e1268f3b3c03b4e7367b525a() {
  return __cxx_static_address_e1268f3b3c03b4e7367b525a.reference || (__cxx_static_address_e1268f3b3c03b4e7367b525a.reference = {
    __cReference: true,
    get value() { return INNERJAW____header_global_1425ffebe0d70902; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:576
export const DRONE____header_global_7657fd6f1251e751 = ((((((1880) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6a282a9737f34a4e332538e0() {
  return __cxx_static_address_6a282a9737f34a4e332538e0.reference || (__cxx_static_address_6a282a9737f34a4e332538e0.reference = {
    __cReference: true,
    get value() { return DRONE____header_global_7657fd6f1251e751; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:577
export const EXPLOSION2____header_global_86fe42622641c99c = ((((((1890) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7ce8072b6aee3ab812f231b9() {
  return __cxx_static_address_7ce8072b6aee3ab812f231b9.reference || (__cxx_static_address_7ce8072b6aee3ab812f231b9.reference = {
    __cReference: true,
    get value() { return EXPLOSION2____header_global_86fe42622641c99c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:578
export const COMMANDER____header_global_132b91796e48f555 = ((((((1920) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7b064dc54af6928b8423383a() {
  return __cxx_static_address_7b064dc54af6928b8423383a.reference || (__cxx_static_address_7b064dc54af6928b8423383a.reference = {
    __cReference: true,
    get value() { return COMMANDER____header_global_132b91796e48f555; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:579
export const COMMANDERSTAYPUT____header_global_f881ad5577bff169 = ((((((1921) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1706e2d4f60c90a2a73435bb() {
  return __cxx_static_address_1706e2d4f60c90a2a73435bb.reference || (__cxx_static_address_1706e2d4f60c90a2a73435bb.reference = {
    __cReference: true,
    get value() { return COMMANDERSTAYPUT____header_global_f881ad5577bff169; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:580
export const RECON____header_global_3d1194672ff3d3f5 = ((((((1960) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c02474b29dd39104ca65fa22() {
  return __cxx_static_address_c02474b29dd39104ca65fa22.reference || (__cxx_static_address_c02474b29dd39104ca65fa22.reference = {
    __cReference: true,
    get value() { return RECON____header_global_3d1194672ff3d3f5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:581
export const TANK____header_global_c36d168cfbcc6161 = ((((((1975) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8cb43a5436ceecf4e3f1261b() {
  return __cxx_static_address_8cb43a5436ceecf4e3f1261b.reference || (__cxx_static_address_8cb43a5436ceecf4e3f1261b.reference = {
    __cReference: true,
    get value() { return TANK____header_global_c36d168cfbcc6161; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:582
export const PIGCOP____header_global_7f94d9837fb280ca = ((((((2000) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c15f72878a3a3c45e0323e10() {
  return __cxx_static_address_c15f72878a3a3c45e0323e10.reference || (__cxx_static_address_c15f72878a3a3c45e0323e10.reference = {
    __cReference: true,
    get value() { return PIGCOP____header_global_7f94d9837fb280ca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:583
export const PIGCOPSTAYPUT____header_global_99139048ce2a904f = ((((((2001) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4a4165f6a52015b8c2d1c388() {
  return __cxx_static_address_4a4165f6a52015b8c2d1c388.reference || (__cxx_static_address_4a4165f6a52015b8c2d1c388.reference = {
    __cReference: true,
    get value() { return PIGCOPSTAYPUT____header_global_99139048ce2a904f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:584
export const PIGCOPDIVE____header_global_3363766b166d9db3 = ((((((2045) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_28930b764519ae56cbb03ad3() {
  return __cxx_static_address_28930b764519ae56cbb03ad3.reference || (__cxx_static_address_28930b764519ae56cbb03ad3.reference = {
    __cReference: true,
    get value() { return PIGCOPDIVE____header_global_3363766b166d9db3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:585
export const LIZMAN____header_global_399eca3f18a16a3d = ((((((2120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2c05b81a4f4420fa73173a9b() {
  return __cxx_static_address_2c05b81a4f4420fa73173a9b.reference || (__cxx_static_address_2c05b81a4f4420fa73173a9b.reference = {
    __cReference: true,
    get value() { return LIZMAN____header_global_399eca3f18a16a3d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:586
export const LIZMANSTAYPUT____header_global_351cd87ecd87114a = ((((((2121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_74821ccc8874541f3062e0ce() {
  return __cxx_static_address_74821ccc8874541f3062e0ce.reference || (__cxx_static_address_74821ccc8874541f3062e0ce.reference = {
    __cReference: true,
    get value() { return LIZMANSTAYPUT____header_global_351cd87ecd87114a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:587
export const LIZMANSPITTING____header_global_9db5f3e193021b34 = ((((((2150) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e12568d86fb052d006fbf36() {
  return __cxx_static_address_1e12568d86fb052d006fbf36.reference || (__cxx_static_address_1e12568d86fb052d006fbf36.reference = {
    __cReference: true,
    get value() { return LIZMANSPITTING____header_global_9db5f3e193021b34; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:588
export const LIZMANFEEDING____header_global_dd431ea0abe92f47 = ((((((2160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dfc0f71e7de17292f9ab84bc() {
  return __cxx_static_address_dfc0f71e7de17292f9ab84bc.reference || (__cxx_static_address_dfc0f71e7de17292f9ab84bc.reference = {
    __cReference: true,
    get value() { return LIZMANFEEDING____header_global_dd431ea0abe92f47; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:589
export const LIZMANJUMP____header_global_6f956ac5b63b43ee = ((((((2165) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ef7ad33d8c67652263469c6c() {
  return __cxx_static_address_ef7ad33d8c67652263469c6c.reference || (__cxx_static_address_ef7ad33d8c67652263469c6c.reference = {
    __cReference: true,
    get value() { return LIZMANJUMP____header_global_6f956ac5b63b43ee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:590
export const FECES____header_global_2a449ff4be484798 = ((((((2200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0c32f704f9a783861909f76d() {
  return __cxx_static_address_0c32f704f9a783861909f76d.reference || (__cxx_static_address_0c32f704f9a783861909f76d.reference = {
    __cReference: true,
    get value() { return FECES____header_global_2a449ff4be484798; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:591
export const LIZMANHEAD1____header_global_71c39fe7b0ac5c40 = ((((((2201) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9fc3dd28c1805a317ea4f357() {
  return __cxx_static_address_9fc3dd28c1805a317ea4f357.reference || (__cxx_static_address_9fc3dd28c1805a317ea4f357.reference = {
    __cReference: true,
    get value() { return LIZMANHEAD1____header_global_71c39fe7b0ac5c40; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:592
export const LIZMANARM1____header_global_7bb820dcc9ad26c7 = ((((((2205) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4a18cb90bf9fa15c5cbf4404() {
  return __cxx_static_address_4a18cb90bf9fa15c5cbf4404.reference || (__cxx_static_address_4a18cb90bf9fa15c5cbf4404.reference = {
    __cReference: true,
    get value() { return LIZMANARM1____header_global_7bb820dcc9ad26c7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:593
export const LIZMANLEG1____header_global_bbcb6aa5dca004c8 = ((((((2209) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_21546b34879276d51018bc62() {
  return __cxx_static_address_21546b34879276d51018bc62.reference || (__cxx_static_address_21546b34879276d51018bc62.reference = {
    __cReference: true,
    get value() { return LIZMANLEG1____header_global_bbcb6aa5dca004c8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:594
export const EXPLOSION2BOT____header_global_07534d3eda8bd7df = ((((((2219) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7e970bf950ea684e2a42238f() {
  return __cxx_static_address_7e970bf950ea684e2a42238f.reference || (__cxx_static_address_7e970bf950ea684e2a42238f.reference = {
    __cReference: true,
    get value() { return EXPLOSION2BOT____header_global_07534d3eda8bd7df; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:595
export const JIBS1____header_global_9ded503d06437ac1 = ((((((2245) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_23089d717cd69229bf8ea27f() {
  return __cxx_static_address_23089d717cd69229bf8ea27f.reference || (__cxx_static_address_23089d717cd69229bf8ea27f.reference = {
    __cReference: true,
    get value() { return JIBS1____header_global_9ded503d06437ac1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:596
export const JIBS2____header_global_5eef34f8f3ef46d8 = ((((((2250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3f94f1de1201b84f872955d8() {
  return __cxx_static_address_3f94f1de1201b84f872955d8.reference || (__cxx_static_address_3f94f1de1201b84f872955d8.reference = {
    __cReference: true,
    get value() { return JIBS2____header_global_5eef34f8f3ef46d8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:597
export const JIBS3____header_global_715aa22f9958feb9 = ((((((2255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_65a2002a4ca73aad407c94b2() {
  return __cxx_static_address_65a2002a4ca73aad407c94b2.reference || (__cxx_static_address_65a2002a4ca73aad407c94b2.reference = {
    __cReference: true,
    get value() { return JIBS3____header_global_715aa22f9958feb9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:598
export const JIBS4____header_global_b0eea01c3daa526c = ((((((2260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7ed423550d98d80c98da61b3() {
  return __cxx_static_address_7ed423550d98d80c98da61b3.reference || (__cxx_static_address_7ed423550d98d80c98da61b3.reference = {
    __cReference: true,
    get value() { return JIBS4____header_global_b0eea01c3daa526c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:599
export const JIBS5____header_global_c9323bf71b02e1e6 = ((((((2265) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_45975aa3d45b4ffac92bd7d5() {
  return __cxx_static_address_45975aa3d45b4ffac92bd7d5.reference || (__cxx_static_address_45975aa3d45b4ffac92bd7d5.reference = {
    __cReference: true,
    get value() { return JIBS5____header_global_c9323bf71b02e1e6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:600
export const BURNING____header_global_3605fd069d31651a = ((((((2270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7c9b745196109e33550cd8cb() {
  return __cxx_static_address_7c9b745196109e33550cd8cb.reference || (__cxx_static_address_7c9b745196109e33550cd8cb.reference = {
    __cReference: true,
    get value() { return BURNING____header_global_3605fd069d31651a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:601
export const FIRE____header_global_a1086184c4bca1aa = ((((((2271) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_40ac4cb8bf59fd7b97a529f9() {
  return __cxx_static_address_40ac4cb8bf59fd7b97a529f9.reference || (__cxx_static_address_40ac4cb8bf59fd7b97a529f9.reference = {
    __cReference: true,
    get value() { return FIRE____header_global_a1086184c4bca1aa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:602
export const JIBS6____header_global_213a1963237470bb = ((((((2286) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c9924971bc9376800b147704() {
  return __cxx_static_address_c9924971bc9376800b147704.reference || (__cxx_static_address_c9924971bc9376800b147704.reference = {
    __cReference: true,
    get value() { return JIBS6____header_global_213a1963237470bb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:603
export const BLOODSPLAT1____header_global_fa70c3b0fb099017 = ((((((2296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5b418f24d94e5cfcea42371a() {
  return __cxx_static_address_5b418f24d94e5cfcea42371a.reference || (__cxx_static_address_5b418f24d94e5cfcea42371a.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT1____header_global_fa70c3b0fb099017; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:604
export const BLOODSPLAT3____header_global_c6baeeff5a76d685 = ((((((2297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9a79c105c78fa691dd5e42b3() {
  return __cxx_static_address_9a79c105c78fa691dd5e42b3.reference || (__cxx_static_address_9a79c105c78fa691dd5e42b3.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT3____header_global_c6baeeff5a76d685; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:605
export const BLOODSPLAT2____header_global_9f8555db88daab3c = ((((((2298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_422e0aa271263b410a5f7771() {
  return __cxx_static_address_422e0aa271263b410a5f7771.reference || (__cxx_static_address_422e0aa271263b410a5f7771.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT2____header_global_9f8555db88daab3c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:606
export const BLOODSPLAT4____header_global_85c6f3d390305e2b = ((((((2299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_51271e2e6ff8e3a744b384cf() {
  return __cxx_static_address_51271e2e6ff8e3a744b384cf.reference || (__cxx_static_address_51271e2e6ff8e3a744b384cf.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT4____header_global_85c6f3d390305e2b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:607
export const OOZ____header_global_73cc936a0110ac31 = ((((((2300) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8eec8201a7d507e35c08b766() {
  return __cxx_static_address_8eec8201a7d507e35c08b766.reference || (__cxx_static_address_8eec8201a7d507e35c08b766.reference = {
    __cReference: true,
    get value() { return OOZ____header_global_73cc936a0110ac31; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:608
export const OOZ2____header_global_3a29d67459473e71 = ((((((2309) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_14de268dd0a896266e0336ba() {
  return __cxx_static_address_14de268dd0a896266e0336ba.reference || (__cxx_static_address_14de268dd0a896266e0336ba.reference = {
    __cReference: true,
    get value() { return OOZ2____header_global_3a29d67459473e71; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:609
export const WALLBLOOD1____header_global_a4f2d4ce82aa0da2 = ((((((2301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ef9aa0262ce4a5ab4c2fe44f() {
  return __cxx_static_address_ef9aa0262ce4a5ab4c2fe44f.reference || (__cxx_static_address_ef9aa0262ce4a5ab4c2fe44f.reference = {
    __cReference: true,
    get value() { return WALLBLOOD1____header_global_a4f2d4ce82aa0da2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:610
export const WALLBLOOD2____header_global_f8f96d8699e21f10 = ((((((2302) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e7647a52eb5c97e7f893e364() {
  return __cxx_static_address_e7647a52eb5c97e7f893e364.reference || (__cxx_static_address_e7647a52eb5c97e7f893e364.reference = {
    __cReference: true,
    get value() { return WALLBLOOD2____header_global_f8f96d8699e21f10; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:611
export const WALLBLOOD3____header_global_c325e566852e437b = ((((((2303) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c2507053cad0fcf3650ddc05() {
  return __cxx_static_address_c2507053cad0fcf3650ddc05.reference || (__cxx_static_address_c2507053cad0fcf3650ddc05.reference = {
    __cReference: true,
    get value() { return WALLBLOOD3____header_global_c325e566852e437b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:612
export const WALLBLOOD4____header_global_170cc2b2637b9029 = ((((((2304) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_25732801fc0f5fe9ea1c8311() {
  return __cxx_static_address_25732801fc0f5fe9ea1c8311.reference || (__cxx_static_address_25732801fc0f5fe9ea1c8311.reference = {
    __cReference: true,
    get value() { return WALLBLOOD4____header_global_170cc2b2637b9029; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:613
export const WALLBLOOD5____header_global_d270ab014fa4367c = ((((((2305) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_330ebafdabd1bc90062e4471() {
  return __cxx_static_address_330ebafdabd1bc90062e4471.reference || (__cxx_static_address_330ebafdabd1bc90062e4471.reference = {
    __cReference: true,
    get value() { return WALLBLOOD5____header_global_d270ab014fa4367c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:614
export const WALLBLOOD7____header_global_96e9343dd70ab28c = ((((((2307) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a09fa91fbf6725c0225b2a9c() {
  return __cxx_static_address_a09fa91fbf6725c0225b2a9c.reference || (__cxx_static_address_a09fa91fbf6725c0225b2a9c.reference = {
    __cReference: true,
    get value() { return WALLBLOOD7____header_global_96e9343dd70ab28c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:615
export const WALLBLOOD8____header_global_fc273363b4aa3c8d = ((((((2308) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7b6e90abb51460ed1193d1aa() {
  return __cxx_static_address_7b6e90abb51460ed1193d1aa.reference || (__cxx_static_address_7b6e90abb51460ed1193d1aa.reference = {
    __cReference: true,
    get value() { return WALLBLOOD8____header_global_fc273363b4aa3c8d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:616
export const BURNING2____header_global_6cad69d8d05317f2 = ((((((2310) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_83a2396b1b5983b6ae7b4444() {
  return __cxx_static_address_83a2396b1b5983b6ae7b4444.reference || (__cxx_static_address_83a2396b1b5983b6ae7b4444.reference = {
    __cReference: true,
    get value() { return BURNING2____header_global_6cad69d8d05317f2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:617
export const FIRE2____header_global_f298cda19adccbb8 = ((((((2311) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a2cdf9b2e26554113c5a903a() {
  return __cxx_static_address_a2cdf9b2e26554113c5a903a.reference || (__cxx_static_address_a2cdf9b2e26554113c5a903a.reference = {
    __cReference: true,
    get value() { return FIRE2____header_global_f298cda19adccbb8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:618
export const CRACKKNUCKLES____header_global_384ce3b201d5979c = ((((((2324) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d9361cf11e5af8e481fcb16f() {
  return __cxx_static_address_d9361cf11e5af8e481fcb16f.reference || (__cxx_static_address_d9361cf11e5af8e481fcb16f.reference = {
    __cReference: true,
    get value() { return CRACKKNUCKLES____header_global_384ce3b201d5979c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:619
export const SMALLSMOKE____header_global_20365b075672fed7 = ((((((2329) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ddbab293b7f47f5bcbac6bfa() {
  return __cxx_static_address_ddbab293b7f47f5bcbac6bfa.reference || (__cxx_static_address_ddbab293b7f47f5bcbac6bfa.reference = {
    __cReference: true,
    get value() { return SMALLSMOKE____header_global_20365b075672fed7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:620
export const FLOORFLAME____header_global_45e5a768b3551977 = ((((((2333) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a9da7625157bfa1ef18c367c() {
  return __cxx_static_address_a9da7625157bfa1ef18c367c.reference || (__cxx_static_address_a9da7625157bfa1ef18c367c.reference = {
    __cReference: true,
    get value() { return FLOORFLAME____header_global_45e5a768b3551977; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:621
export const ROTATEGUN____header_global_a24b59cf49a9d4c9 = ((((((2360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_13bacb5f0bead97696b38197() {
  return __cxx_static_address_13bacb5f0bead97696b38197.reference || (__cxx_static_address_13bacb5f0bead97696b38197.reference = {
    __cReference: true,
    get value() { return ROTATEGUN____header_global_a24b59cf49a9d4c9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:622
export const GREENSLIME____header_global_d7e1666b3fda0cc4 = ((((((2370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_93de5cc069c9500001e3c24b() {
  return __cxx_static_address_93de5cc069c9500001e3c24b.reference || (__cxx_static_address_93de5cc069c9500001e3c24b.reference = {
    __cReference: true,
    get value() { return GREENSLIME____header_global_d7e1666b3fda0cc4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:623
export const WATERDRIPSPLASH____header_global_dcd69380d6ce5629 = ((((((2380) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5b40c7412c61d54f1f6cd6e2() {
  return __cxx_static_address_5b40c7412c61d54f1f6cd6e2.reference || (__cxx_static_address_5b40c7412c61d54f1f6cd6e2.reference = {
    __cReference: true,
    get value() { return WATERDRIPSPLASH____header_global_dcd69380d6ce5629; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:624
export const SCRAP6____header_global_2f7e3f04bad872a3 = ((((((2390) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f8877751ce9f4494597dac77() {
  return __cxx_static_address_f8877751ce9f4494597dac77.reference || (__cxx_static_address_f8877751ce9f4494597dac77.reference = {
    __cReference: true,
    get value() { return SCRAP6____header_global_2f7e3f04bad872a3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:625
export const SCRAP1____header_global_36ac7b54713e64b0 = ((((((2400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9262486ede6ddb984ab59b7a() {
  return __cxx_static_address_9262486ede6ddb984ab59b7a.reference || (__cxx_static_address_9262486ede6ddb984ab59b7a.reference = {
    __cReference: true,
    get value() { return SCRAP1____header_global_36ac7b54713e64b0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:626
export const SCRAP2____header_global_d02d8416e4809853 = ((((((2404) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_def5e962f711367f73d8a53e() {
  return __cxx_static_address_def5e962f711367f73d8a53e.reference || (__cxx_static_address_def5e962f711367f73d8a53e.reference = {
    __cReference: true,
    get value() { return SCRAP2____header_global_d02d8416e4809853; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:627
export const SCRAP3____header_global_f26a438a771d7300 = ((((((2408) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4d74dd3a743579d31c2fc25a() {
  return __cxx_static_address_4d74dd3a743579d31c2fc25a.reference || (__cxx_static_address_4d74dd3a743579d31c2fc25a.reference = {
    __cReference: true,
    get value() { return SCRAP3____header_global_f26a438a771d7300; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:628
export const SCRAP4____header_global_860bba908ecd9a3e = ((((((2412) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7d6ffb7af763640d98fe5486() {
  return __cxx_static_address_7d6ffb7af763640d98fe5486.reference || (__cxx_static_address_7d6ffb7af763640d98fe5486.reference = {
    __cReference: true,
    get value() { return SCRAP4____header_global_860bba908ecd9a3e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:629
export const SCRAP5____header_global_926dbc3c9c1af524 = ((((((2416) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1a85b37e7e1f9a8e895fb8a7() {
  return __cxx_static_address_1a85b37e7e1f9a8e895fb8a7.reference || (__cxx_static_address_1a85b37e7e1f9a8e895fb8a7.reference = {
    __cReference: true,
    get value() { return SCRAP5____header_global_926dbc3c9c1af524; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:630
export const ORGANTIC____header_global_9d05b31e79b3fadd = ((((((2420) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8b3571ccdafb65b6601db029() {
  return __cxx_static_address_8b3571ccdafb65b6601db029.reference || (__cxx_static_address_8b3571ccdafb65b6601db029.reference = {
    __cReference: true,
    get value() { return ORGANTIC____header_global_9d05b31e79b3fadd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:631
export const BETAVERSION____header_global_46aa484a55e684f2 = ((((((2440) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_28b7eae1d7c7f987ab00e7df() {
  return __cxx_static_address_28b7eae1d7c7f987ab00e7df.reference || (__cxx_static_address_28b7eae1d7c7f987ab00e7df.reference = {
    __cReference: true,
    get value() { return BETAVERSION____header_global_46aa484a55e684f2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:632
export const SELECTDIR____header_global_4b27501d6f8c906f = ((((((2444) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_02993cc9d82fe5f8b93a9990() {
  return __cxx_static_address_02993cc9d82fe5f8b93a9990.reference || (__cxx_static_address_02993cc9d82fe5f8b93a9990.reference = {
    __cReference: true,
    get value() { return SELECTDIR____header_global_4b27501d6f8c906f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:633
export const F1HELP____header_global_b86288de7390149a = ((((((2445) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f5dba3ea94a808ccacfa0fc2() {
  return __cxx_static_address_f5dba3ea94a808ccacfa0fc2.reference || (__cxx_static_address_f5dba3ea94a808ccacfa0fc2.reference = {
    __cReference: true,
    get value() { return F1HELP____header_global_b86288de7390149a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:634
export const GROWSPARK____header_global_a3032d7301cf9e9e = ((((((2448) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4e4000e4fe994c32c52f96ae() {
  return __cxx_static_address_4e4000e4fe994c32c52f96ae.reference || (__cxx_static_address_4e4000e4fe994c32c52f96ae.reference = {
    __cReference: true,
    get value() { return GROWSPARK____header_global_a3032d7301cf9e9e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:635
export const MENUSCREEN____header_global_55fd6c11e682d435 = ((((((2456) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_67877d39d2029e93ba43b3cc() {
  return __cxx_static_address_67877d39d2029e93ba43b3cc.reference || (__cxx_static_address_67877d39d2029e93ba43b3cc.reference = {
    __cReference: true,
    get value() { return MENUSCREEN____header_global_55fd6c11e682d435; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:636
export const MENUBAR____header_global_c8426e245e59821f = ((((((2457) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_17e4b23e8d8e98213a08872c() {
  return __cxx_static_address_17e4b23e8d8e98213a08872c.reference || (__cxx_static_address_17e4b23e8d8e98213a08872c.reference = {
    __cReference: true,
    get value() { return MENUBAR____header_global_c8426e245e59821f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:637
export const KILLSICON____header_global_9ae7fd1ada96e71e = ((((((2458) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8c7cfe8e40d3f3b70633874a() {
  return __cxx_static_address_8c7cfe8e40d3f3b70633874a.reference || (__cxx_static_address_8c7cfe8e40d3f3b70633874a.reference = {
    __cReference: true,
    get value() { return KILLSICON____header_global_9ae7fd1ada96e71e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:638
export const FIRSTAID_ICON____header_global_783b9d532edcc3e7 = ((((((2460) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_80c81a177ae3a0f71e9f7419() {
  return __cxx_static_address_80c81a177ae3a0f71e9f7419.reference || (__cxx_static_address_80c81a177ae3a0f71e9f7419.reference = {
    __cReference: true,
    get value() { return FIRSTAID_ICON____header_global_783b9d532edcc3e7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:639
export const HEAT_ICON____header_global_ec0a742d04e68bf6 = ((((((2461) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_305b95232a241576578f8a15() {
  return __cxx_static_address_305b95232a241576578f8a15.reference || (__cxx_static_address_305b95232a241576578f8a15.reference = {
    __cReference: true,
    get value() { return HEAT_ICON____header_global_ec0a742d04e68bf6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:640
export const BOTTOMSTATUSBAR____header_global_dc84b38771c27db4 = ((((((2462) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_003c1e351ee0f454f3a6b2ec() {
  return __cxx_static_address_003c1e351ee0f454f3a6b2ec.reference || (__cxx_static_address_003c1e351ee0f454f3a6b2ec.reference = {
    __cReference: true,
    get value() { return BOTTOMSTATUSBAR____header_global_dc84b38771c27db4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:641
export const BOOT_ICON____header_global_01931e3a03efc24b = ((((((2463) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e84c9b353a88ee8472099b7a() {
  return __cxx_static_address_e84c9b353a88ee8472099b7a.reference || (__cxx_static_address_e84c9b353a88ee8472099b7a.reference = {
    __cReference: true,
    get value() { return BOOT_ICON____header_global_01931e3a03efc24b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:642
export const FRAGBAR____header_global_5a5696e222edac40 = ((((((2465) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_756ac9035a30fc22234d4a3e() {
  return __cxx_static_address_756ac9035a30fc22234d4a3e.reference || (__cxx_static_address_756ac9035a30fc22234d4a3e.reference = {
    __cReference: true,
    get value() { return FRAGBAR____header_global_5a5696e222edac40; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:643
export const JETPACK_ICON____header_global_d0a2bbea1807f7a9 = ((((((2467) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_06273a00de791c19382b8dd5() {
  return __cxx_static_address_06273a00de791c19382b8dd5.reference || (__cxx_static_address_06273a00de791c19382b8dd5.reference = {
    __cReference: true,
    get value() { return JETPACK_ICON____header_global_d0a2bbea1807f7a9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:644
export const AIRTANK_ICON____header_global_5c9eb160f5c9b5b8 = ((((((2468) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c60cc17a838cfecd3215e222() {
  return __cxx_static_address_c60cc17a838cfecd3215e222.reference || (__cxx_static_address_c60cc17a838cfecd3215e222.reference = {
    __cReference: true,
    get value() { return AIRTANK_ICON____header_global_5c9eb160f5c9b5b8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:645
export const STEROIDS_ICON____header_global_b61e8a40f969580d = ((((((2469) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b386e72f5bd7711519d17df5() {
  return __cxx_static_address_b386e72f5bd7711519d17df5.reference || (__cxx_static_address_b386e72f5bd7711519d17df5.reference = {
    __cReference: true,
    get value() { return STEROIDS_ICON____header_global_b61e8a40f969580d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:646
export const HOLODUKE_ICON____header_global_f4c2ac2c6f9e4a95 = ((((((2470) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6fe679be5ad6797df145bd8a() {
  return __cxx_static_address_6fe679be5ad6797df145bd8a.reference || (__cxx_static_address_6fe679be5ad6797df145bd8a.reference = {
    __cReference: true,
    get value() { return HOLODUKE_ICON____header_global_f4c2ac2c6f9e4a95; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:647
export const ACCESS_ICON____header_global_64c8c3e1b947c71c = ((((((2471) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ee2985efcfb78d788932252a() {
  return __cxx_static_address_ee2985efcfb78d788932252a.reference || (__cxx_static_address_ee2985efcfb78d788932252a.reference = {
    __cReference: true,
    get value() { return ACCESS_ICON____header_global_64c8c3e1b947c71c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:648
export const DIGITALNUM____header_global_6c74d923de0a1539 = ((((((2472) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ac473dc06f4bb964fce0f21c() {
  return __cxx_static_address_ac473dc06f4bb964fce0f21c.reference || (__cxx_static_address_ac473dc06f4bb964fce0f21c.reference = {
    __cReference: true,
    get value() { return DIGITALNUM____header_global_6c74d923de0a1539; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:649
export const DUKECAR____header_global_eb5ac51b1b4849e5 = ((((((2491) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e0dca04261f4e1654db32603() {
  return __cxx_static_address_e0dca04261f4e1654db32603.reference || (__cxx_static_address_e0dca04261f4e1654db32603.reference = {
    __cReference: true,
    get value() { return DUKECAR____header_global_eb5ac51b1b4849e5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:650
export const CAMCORNER____header_global_56c57059c5e82545 = ((((((2482) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9c04d89f7fce9c84469f5eb9() {
  return __cxx_static_address_9c04d89f7fce9c84469f5eb9.reference || (__cxx_static_address_9c04d89f7fce9c84469f5eb9.reference = {
    __cReference: true,
    get value() { return CAMCORNER____header_global_56c57059c5e82545; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:651
export const CAMLIGHT____header_global_7bdf42c0d429869a = ((((((2484) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8319721af5f42f8f54fd7574() {
  return __cxx_static_address_8319721af5f42f8f54fd7574.reference || (__cxx_static_address_8319721af5f42f8f54fd7574.reference = {
    __cReference: true,
    get value() { return CAMLIGHT____header_global_7bdf42c0d429869a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:652
export const SLIDEBAR____header_global_2e5a04880a4f6a3b = ((((((2489) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d539e3c6fae672bcd7904e1c() {
  return __cxx_static_address_d539e3c6fae672bcd7904e1c.reference || (__cxx_static_address_d539e3c6fae672bcd7904e1c.reference = {
    __cReference: true,
    get value() { return SLIDEBAR____header_global_2e5a04880a4f6a3b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:653
export const DREALMS____header_global_de689a8f187ba782 = ((((((2492) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ec7dcd36091f30ecc32003c0() {
  return __cxx_static_address_ec7dcd36091f30ecc32003c0.reference || (__cxx_static_address_ec7dcd36091f30ecc32003c0.reference = {
    __cReference: true,
    get value() { return DREALMS____header_global_de689a8f187ba782; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:654
export const BETASCREEN____header_global_799a64264bf2a770 = ((((((2493) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5e50f5e27def56ae2ac5c563() {
  return __cxx_static_address_5e50f5e27def56ae2ac5c563.reference || (__cxx_static_address_5e50f5e27def56ae2ac5c563.reference = {
    __cReference: true,
    get value() { return BETASCREEN____header_global_799a64264bf2a770; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:655
export const WINDOWBORDER1____header_global_7676bec86b06ea61 = ((((((2494) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8e9cbf608433ccbcd87d53b9() {
  return __cxx_static_address_8e9cbf608433ccbcd87d53b9.reference || (__cxx_static_address_8e9cbf608433ccbcd87d53b9.reference = {
    __cReference: true,
    get value() { return WINDOWBORDER1____header_global_7676bec86b06ea61; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:656
export const TEXTBOX____header_global_1037d381a942a17b = ((((((2495) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2735d917fc65a642bcbcf344() {
  return __cxx_static_address_2735d917fc65a642bcbcf344.reference || (__cxx_static_address_2735d917fc65a642bcbcf344.reference = {
    __cReference: true,
    get value() { return TEXTBOX____header_global_1037d381a942a17b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:657
export const WINDOWBORDER2____header_global_443d582de4167550 = ((((((2496) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c72c723c558a26cabeea1ebf() {
  return __cxx_static_address_c72c723c558a26cabeea1ebf.reference || (__cxx_static_address_c72c723c558a26cabeea1ebf.reference = {
    __cReference: true,
    get value() { return WINDOWBORDER2____header_global_443d582de4167550; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:658
export const DUKENUKEM____header_global_06c0b8d4ef19f498 = ((((((2497) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c58aaa28d49296de3f7394d1() {
  return __cxx_static_address_c58aaa28d49296de3f7394d1.reference || (__cxx_static_address_c58aaa28d49296de3f7394d1.reference = {
    __cReference: true,
    get value() { return DUKENUKEM____header_global_06c0b8d4ef19f498; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:659
export const THREEDEE____header_global_3b20b7e9357c8eca = ((((((2498) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_26c19bf0bee3437bd3121141() {
  return __cxx_static_address_26c19bf0bee3437bd3121141.reference || (__cxx_static_address_26c19bf0bee3437bd3121141.reference = {
    __cReference: true,
    get value() { return THREEDEE____header_global_3b20b7e9357c8eca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:660
export const INGAMEDUKETHREEDEE____header_global_6c5b57f01181c0d2 = ((((((2499) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1c9d3ed61582ad40b2240af6() {
  return __cxx_static_address_1c9d3ed61582ad40b2240af6.reference || (__cxx_static_address_1c9d3ed61582ad40b2240af6.reference = {
    __cReference: true,
    get value() { return INGAMEDUKETHREEDEE____header_global_6c5b57f01181c0d2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:661
export const TENSCREEN____header_global_5efffae4a8105dac = ((((((2500) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2898afeadb01c0dd9722c313() {
  return __cxx_static_address_2898afeadb01c0dd9722c313.reference || (__cxx_static_address_2898afeadb01c0dd9722c313.reference = {
    __cReference: true,
    get value() { return TENSCREEN____header_global_5efffae4a8105dac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:662
export const PLUTOPAKSPRITE____header_global_c19ce19695d0d1be = ((((((2501) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e669ad33492aa42c4292b7c9() {
  return __cxx_static_address_e669ad33492aa42c4292b7c9.reference || (__cxx_static_address_e669ad33492aa42c4292b7c9.reference = {
    __cReference: true,
    get value() { return PLUTOPAKSPRITE____header_global_c19ce19695d0d1be; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:663
export const DEVISTATOR____header_global_c26cc772a43bbf9f = ((((((2510) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_35ac2ea2b35238894f910389() {
  return __cxx_static_address_35ac2ea2b35238894f910389.reference || (__cxx_static_address_35ac2ea2b35238894f910389.reference = {
    __cReference: true,
    get value() { return DEVISTATOR____header_global_c26cc772a43bbf9f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:664
export const KNEE____header_global_a375fbd51e73bcca = ((((((2521) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5618030b3602eab790452de9() {
  return __cxx_static_address_5618030b3602eab790452de9.reference || (__cxx_static_address_5618030b3602eab790452de9.reference = {
    __cReference: true,
    get value() { return KNEE____header_global_a375fbd51e73bcca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:665
export const CROSSHAIR____header_global_aa64574709396b38 = ((((((2523) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cc4bdb9b14a6e96ed34df3b4() {
  return __cxx_static_address_cc4bdb9b14a6e96ed34df3b4.reference || (__cxx_static_address_cc4bdb9b14a6e96ed34df3b4.reference = {
    __cReference: true,
    get value() { return CROSSHAIR____header_global_aa64574709396b38; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:666
export const FIRSTGUN____header_global_daa87974f95724b0 = ((((((2524) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b0eb0079a9f73ee5e76d0d6f() {
  return __cxx_static_address_b0eb0079a9f73ee5e76d0d6f.reference || (__cxx_static_address_b0eb0079a9f73ee5e76d0d6f.reference = {
    __cReference: true,
    get value() { return FIRSTGUN____header_global_daa87974f95724b0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:667
export const FIRSTGUNRELOAD____header_global_82f7ba814dc70777 = ((((((2528) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3163de7e48b00ff94cab671e() {
  return __cxx_static_address_3163de7e48b00ff94cab671e.reference || (__cxx_static_address_3163de7e48b00ff94cab671e.reference = {
    __cReference: true,
    get value() { return FIRSTGUNRELOAD____header_global_82f7ba814dc70777; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:668
export const SHELL____header_global_0eae6971a9f4c15b = ((((((2533) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_34cb584abbf9a6225d4f6f09() {
  return __cxx_static_address_34cb584abbf9a6225d4f6f09.reference || (__cxx_static_address_34cb584abbf9a6225d4f6f09.reference = {
    __cReference: true,
    get value() { return SHELL____header_global_0eae6971a9f4c15b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:669
export const SHOTGUNSHELL____header_global_80e72db4257fc143 = ((((((2535) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7e8ce737f3b73ed3eee500e4() {
  return __cxx_static_address_7e8ce737f3b73ed3eee500e4.reference || (__cxx_static_address_7e8ce737f3b73ed3eee500e4.reference = {
    __cReference: true,
    get value() { return SHOTGUNSHELL____header_global_80e72db4257fc143; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:670
export const CHAINGUN____header_global_20768cc68c4204f4 = ((((((2536) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_04d4b6fe1380e7149692ffd7() {
  return __cxx_static_address_04d4b6fe1380e7149692ffd7.reference || (__cxx_static_address_04d4b6fe1380e7149692ffd7.reference = {
    __cReference: true,
    get value() { return CHAINGUN____header_global_20768cc68c4204f4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:671
export const RPGGUN____header_global_fb74ee1e297ec5b9 = ((((((2544) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ad2c0392e7edd2338b78e994() {
  return __cxx_static_address_ad2c0392e7edd2338b78e994.reference || (__cxx_static_address_ad2c0392e7edd2338b78e994.reference = {
    __cReference: true,
    get value() { return RPGGUN____header_global_fb74ee1e297ec5b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:672
export const FREEZE____header_global_2e766922a40ef38a = ((((((2548) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_14011a55313e88e87999fea7() {
  return __cxx_static_address_14011a55313e88e87999fea7.reference || (__cxx_static_address_14011a55313e88e87999fea7.reference = {
    __cReference: true,
    get value() { return FREEZE____header_global_2e766922a40ef38a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:673
export const SHRINKER____header_global_755ac5a594321147 = ((((((2556) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_defe666a28d2b83e13d49ebe() {
  return __cxx_static_address_defe666a28d2b83e13d49ebe.reference || (__cxx_static_address_defe666a28d2b83e13d49ebe.reference = {
    __cReference: true,
    get value() { return SHRINKER____header_global_755ac5a594321147; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:674
export const HANDHOLDINGLASER____header_global_6bbb05b0597d3535 = ((((((2563) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b8f8eb2481ff31ee42338b12() {
  return __cxx_static_address_b8f8eb2481ff31ee42338b12.reference || (__cxx_static_address_b8f8eb2481ff31ee42338b12.reference = {
    __cReference: true,
    get value() { return HANDHOLDINGLASER____header_global_6bbb05b0597d3535; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:675
export const TRIPBOMB____header_global_b5f778d958e5e860 = ((((((2566) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ff37265cb57b49b337b0e709() {
  return __cxx_static_address_ff37265cb57b49b337b0e709.reference || (__cxx_static_address_ff37265cb57b49b337b0e709.reference = {
    __cReference: true,
    get value() { return TRIPBOMB____header_global_b5f778d958e5e860; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:676
export const LASERLINE____header_global_5004f0a924296539 = ((((((2567) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8c8f1f20bd1534b4f352c6b4() {
  return __cxx_static_address_8c8f1f20bd1534b4f352c6b4.reference || (__cxx_static_address_8c8f1f20bd1534b4f352c6b4.reference = {
    __cReference: true,
    get value() { return LASERLINE____header_global_5004f0a924296539; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:677
export const HANDHOLDINGACCESS____header_global_42bd44bcaa2ba9e6 = ((((((2568) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_745892ce92da88818facf2dd() {
  return __cxx_static_address_745892ce92da88818facf2dd.reference || (__cxx_static_address_745892ce92da88818facf2dd.reference = {
    __cReference: true,
    get value() { return HANDHOLDINGACCESS____header_global_42bd44bcaa2ba9e6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:678
export const HANDREMOTE____header_global_f90fa5a0f93525b3 = ((((((2570) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_34cfb47754e7ed8e0ed92c48() {
  return __cxx_static_address_34cfb47754e7ed8e0ed92c48.reference || (__cxx_static_address_34cfb47754e7ed8e0ed92c48.reference = {
    __cReference: true,
    get value() { return HANDREMOTE____header_global_f90fa5a0f93525b3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:679
export const HANDTHROW____header_global_311ab244f8d08cf6 = ((((((2573) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_239e29b60bf0d8d0d50b0d2c() {
  return __cxx_static_address_239e29b60bf0d8d0d50b0d2c.reference || (__cxx_static_address_239e29b60bf0d8d0d50b0d2c.reference = {
    __cReference: true,
    get value() { return HANDTHROW____header_global_311ab244f8d08cf6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:680
export const TIP____header_global_102c6bd2fd734406 = ((((((2576) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_80239629d597f5f899238545() {
  return __cxx_static_address_80239629d597f5f899238545.reference || (__cxx_static_address_80239629d597f5f899238545.reference = {
    __cReference: true,
    get value() { return TIP____header_global_102c6bd2fd734406; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:681
export const SCUBAMASK____header_global_151ae8bc61919f58 = ((((((2581) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_56a21d33245ff5336ebf7ccc() {
  return __cxx_static_address_56a21d33245ff5336ebf7ccc.reference || (__cxx_static_address_56a21d33245ff5336ebf7ccc.reference = {
    __cReference: true,
    get value() { return SCUBAMASK____header_global_151ae8bc61919f58; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:682
export const FORCESPHERE____header_global_5a109f3f183db776 = ((((((2590) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a1a68fd58029d5261804feed() {
  return __cxx_static_address_a1a68fd58029d5261804feed.reference || (__cxx_static_address_a1a68fd58029d5261804feed.reference = {
    __cReference: true,
    get value() { return FORCESPHERE____header_global_5a109f3f183db776; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:683
export const SHOTSPARK1____header_global_f9eba9ac6bbcd419 = ((((((2595) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0220dc776fd96e409c7647b6() {
  return __cxx_static_address_0220dc776fd96e409c7647b6.reference || (__cxx_static_address_0220dc776fd96e409c7647b6.reference = {
    __cReference: true,
    get value() { return SHOTSPARK1____header_global_f9eba9ac6bbcd419; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:684
export const RPG____header_global_87dd1460e8ac1307 = ((((((2605) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_66fb95c63d313d93d14c9367() {
  return __cxx_static_address_66fb95c63d313d93d14c9367.reference || (__cxx_static_address_66fb95c63d313d93d14c9367.reference = {
    __cReference: true,
    get value() { return RPG____header_global_87dd1460e8ac1307; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:685
export const LASERSITE____header_global_dc927895f92e69b8 = ((((((2612) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4157d89ce09e5d275b815646() {
  return __cxx_static_address_4157d89ce09e5d275b815646.reference || (__cxx_static_address_4157d89ce09e5d275b815646.reference = {
    __cReference: true,
    get value() { return LASERSITE____header_global_dc927895f92e69b8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:686
export const SHOTGUN____header_global_4eeffd57fdf7071e = ((((((2613) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3f68df2de13d8ec6710872de() {
  return __cxx_static_address_3f68df2de13d8ec6710872de.reference || (__cxx_static_address_3f68df2de13d8ec6710872de.reference = {
    __cReference: true,
    get value() { return SHOTGUN____header_global_4eeffd57fdf7071e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:687
export const BOSS1____header_global_70003a5786d83ea1 = ((((((2630) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_965e7d75b6ee88d847a69284() {
  return __cxx_static_address_965e7d75b6ee88d847a69284.reference || (__cxx_static_address_965e7d75b6ee88d847a69284.reference = {
    __cReference: true,
    get value() { return BOSS1____header_global_70003a5786d83ea1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:688
export const BOSS1STAYPUT____header_global_f9a13bcb35ea6bd4 = ((((((2631) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5170152f028b83b6faf89ac6() {
  return __cxx_static_address_5170152f028b83b6faf89ac6.reference || (__cxx_static_address_5170152f028b83b6faf89ac6.reference = {
    __cReference: true,
    get value() { return BOSS1STAYPUT____header_global_f9a13bcb35ea6bd4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:689
export const BOSS1SHOOT____header_global_abc6b5926f1c4416 = ((((((2660) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_16a2d052876dad677c2d362c() {
  return __cxx_static_address_16a2d052876dad677c2d362c.reference || (__cxx_static_address_16a2d052876dad677c2d362c.reference = {
    __cReference: true,
    get value() { return BOSS1SHOOT____header_global_abc6b5926f1c4416; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:690
export const BOSS1LOB____header_global_0a7a47619df44a80 = ((((((2670) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_294b856551539ad91d6276ef() {
  return __cxx_static_address_294b856551539ad91d6276ef.reference || (__cxx_static_address_294b856551539ad91d6276ef.reference = {
    __cReference: true,
    get value() { return BOSS1LOB____header_global_0a7a47619df44a80; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:691
export const BOSSTOP____header_global_883bd639c090ef68 = ((((((2696) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9976550bf781323ee18d23b8() {
  return __cxx_static_address_9976550bf781323ee18d23b8.reference || (__cxx_static_address_9976550bf781323ee18d23b8.reference = {
    __cReference: true,
    get value() { return BOSSTOP____header_global_883bd639c090ef68; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:692
export const BOSS2____header_global_9281703b399a58cf = ((((((2710) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2388e5d2c0425579b127e995() {
  return __cxx_static_address_2388e5d2c0425579b127e995.reference || (__cxx_static_address_2388e5d2c0425579b127e995.reference = {
    __cReference: true,
    get value() { return BOSS2____header_global_9281703b399a58cf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:693
export const BOSS3____header_global_6fe1343a82321b3e = ((((((2760) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7ac4249434fbfca6f22ba896() {
  return __cxx_static_address_7ac4249434fbfca6f22ba896.reference || (__cxx_static_address_7ac4249434fbfca6f22ba896.reference = {
    __cReference: true,
    get value() { return BOSS3____header_global_6fe1343a82321b3e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:694
export const SPINNINGNUKEICON____header_global_7430a31cc43c97e8 = ((((((2813) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f88ca677ae15ef2d841ec7b7() {
  return __cxx_static_address_f88ca677ae15ef2d841ec7b7.reference || (__cxx_static_address_f88ca677ae15ef2d841ec7b7.reference = {
    __cReference: true,
    get value() { return SPINNINGNUKEICON____header_global_7430a31cc43c97e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:695
export const SMALLFNTCURSOR____header_global_e935e803c9ec78e2 = ((((((2821) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9453480aa30a137f48b7d592() {
  return __cxx_static_address_9453480aa30a137f48b7d592.reference || (__cxx_static_address_9453480aa30a137f48b7d592.reference = {
    __cReference: true,
    get value() { return SMALLFNTCURSOR____header_global_e935e803c9ec78e2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:696
export const STARTALPHANUM____header_global_19fec6fdfe0bdac3 = ((((((2822) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1cbf01fa5fd596bb38ae2ce2() {
  return __cxx_static_address_1cbf01fa5fd596bb38ae2ce2.reference || (__cxx_static_address_1cbf01fa5fd596bb38ae2ce2.reference = {
    __cReference: true,
    get value() { return STARTALPHANUM____header_global_19fec6fdfe0bdac3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:697
export const ENDALPHANUM____header_global_6210bd4f6f594592 = ((((((2915) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0ca87788335c64fc9cc95b46() {
  return __cxx_static_address_0ca87788335c64fc9cc95b46.reference || (__cxx_static_address_0ca87788335c64fc9cc95b46.reference = {
    __cReference: true,
    get value() { return ENDALPHANUM____header_global_6210bd4f6f594592; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:698
export const BIGALPHANUM____header_global_947644bf99e2ec2b = ((((((2940) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_55a84225692a3f3c04be61d5() {
  return __cxx_static_address_55a84225692a3f3c04be61d5.reference || (__cxx_static_address_55a84225692a3f3c04be61d5.reference = {
    __cReference: true,
    get value() { return BIGALPHANUM____header_global_947644bf99e2ec2b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:699
export const BIGPERIOD____header_global_e39055558b3ec66e = ((((((3002) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_47610d499f470179b98c6d98() {
  return __cxx_static_address_47610d499f470179b98c6d98.reference || (__cxx_static_address_47610d499f470179b98c6d98.reference = {
    __cReference: true,
    get value() { return BIGPERIOD____header_global_e39055558b3ec66e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:700
export const BIGCOMMA____header_global_7d0bcead8caaeb26 = ((((((3003) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6b18fd3bcdb651b608a21b45() {
  return __cxx_static_address_6b18fd3bcdb651b608a21b45.reference || (__cxx_static_address_6b18fd3bcdb651b608a21b45.reference = {
    __cReference: true,
    get value() { return BIGCOMMA____header_global_7d0bcead8caaeb26; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:701
export const BIGX____header_global_78c6407f8ad28a07 = ((((((3004) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8899064d269c75324be1b45b() {
  return __cxx_static_address_8899064d269c75324be1b45b.reference || (__cxx_static_address_8899064d269c75324be1b45b.reference = {
    __cReference: true,
    get value() { return BIGX____header_global_78c6407f8ad28a07; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:702
export const BIGQ____header_global_261a6e483ed03d52 = ((((((3005) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ac8035ce9a8e61926326e798() {
  return __cxx_static_address_ac8035ce9a8e61926326e798.reference || (__cxx_static_address_ac8035ce9a8e61926326e798.reference = {
    __cReference: true,
    get value() { return BIGQ____header_global_261a6e483ed03d52; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:703
export const BIGSEMI____header_global_7a677a08dc293700 = ((((((3006) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d35090445178e4d394804bd2() {
  return __cxx_static_address_d35090445178e4d394804bd2.reference || (__cxx_static_address_d35090445178e4d394804bd2.reference = {
    __cReference: true,
    get value() { return BIGSEMI____header_global_7a677a08dc293700; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:704
export const BIGCOLIN____header_global_5ba059214ffa3e04 = ((((((3007) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_016ba32e666f08db7f764f60() {
  return __cxx_static_address_016ba32e666f08db7f764f60.reference || (__cxx_static_address_016ba32e666f08db7f764f60.reference = {
    __cReference: true,
    get value() { return BIGCOLIN____header_global_5ba059214ffa3e04; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:705
export const THREEBYFIVE____header_global_6c01fc73d6eb77ed = ((((((3010) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4e6b6ad075e8da16cd16d06f() {
  return __cxx_static_address_4e6b6ad075e8da16cd16d06f.reference || (__cxx_static_address_4e6b6ad075e8da16cd16d06f.reference = {
    __cReference: true,
    get value() { return THREEBYFIVE____header_global_6c01fc73d6eb77ed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:706
export const BIGAPPOS____header_global_d22121de708a9fce = ((((((3022) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ff1fd3b4c7249cb20ca8932a() {
  return __cxx_static_address_ff1fd3b4c7249cb20ca8932a.reference || (__cxx_static_address_ff1fd3b4c7249cb20ca8932a.reference = {
    __cReference: true,
    get value() { return BIGAPPOS____header_global_d22121de708a9fce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:707
export const MINIFONT____header_global_48857050a7161227 = ((((((3072) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8503ab07cebc15bf9ac8321f() {
  return __cxx_static_address_8503ab07cebc15bf9ac8321f.reference || (__cxx_static_address_8503ab07cebc15bf9ac8321f.reference = {
    __cReference: true,
    get value() { return MINIFONT____header_global_48857050a7161227; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:708
export const RESPAWNMARKERRED____header_global_15388cd3fac354b5 = ((((((3190) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8f802bf641eaab55ba5c5a4c() {
  return __cxx_static_address_8f802bf641eaab55ba5c5a4c.reference || (__cxx_static_address_8f802bf641eaab55ba5c5a4c.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERRED____header_global_15388cd3fac354b5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:709
export const RESPAWNMARKERYELLOW____header_global_ff4085e8c4a5377a = ((((((3200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_414483b60903557059a00329() {
  return __cxx_static_address_414483b60903557059a00329.reference || (__cxx_static_address_414483b60903557059a00329.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERYELLOW____header_global_ff4085e8c4a5377a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:710
export const RESPAWNMARKERGREEN____header_global_48c60a692e8cfa87 = ((((((3210) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0785a3792f06b96f2b49fe8a() {
  return __cxx_static_address_0785a3792f06b96f2b49fe8a.reference || (__cxx_static_address_0785a3792f06b96f2b49fe8a.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERGREEN____header_global_48c60a692e8cfa87; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:711
export const BONUSSCREEN____header_global_47b6b12610218611 = ((((((3240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_51c22f114f410f6387516ceb() {
  return __cxx_static_address_51c22f114f410f6387516ceb.reference || (__cxx_static_address_51c22f114f410f6387516ceb.reference = {
    __cReference: true,
    get value() { return BONUSSCREEN____header_global_47b6b12610218611; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:712
export const VIEWBORDER____header_global_ff0352c58f6be975 = ((((((3250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3197791a280cb0ec28732478() {
  return __cxx_static_address_3197791a280cb0ec28732478.reference || (__cxx_static_address_3197791a280cb0ec28732478.reference = {
    __cReference: true,
    get value() { return VIEWBORDER____header_global_ff0352c58f6be975; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:713
export const VICTORY1____header_global_e03caed571347241 = ((((((3260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_726bbdf2ed35a14d07128e8b() {
  return __cxx_static_address_726bbdf2ed35a14d07128e8b.reference || (__cxx_static_address_726bbdf2ed35a14d07128e8b.reference = {
    __cReference: true,
    get value() { return VICTORY1____header_global_e03caed571347241; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:714
export const ORDERING____header_global_310eb3525382ddc7 = ((((((3270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_43c28ed3e67e13c116c84621() {
  return __cxx_static_address_43c28ed3e67e13c116c84621.reference || (__cxx_static_address_43c28ed3e67e13c116c84621.reference = {
    __cReference: true,
    get value() { return ORDERING____header_global_310eb3525382ddc7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:715
export const TEXTSTORY____header_global_8face0630fe97bcd = ((((((3280) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bbb0193bf03bb8d003301566() {
  return __cxx_static_address_bbb0193bf03bb8d003301566.reference || (__cxx_static_address_bbb0193bf03bb8d003301566.reference = {
    __cReference: true,
    get value() { return TEXTSTORY____header_global_8face0630fe97bcd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:716
export const LOADSCREEN____header_global_75034a5a9db43301 = ((((((3281) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_593d45b0f00625a75ca31c7e() {
  return __cxx_static_address_593d45b0f00625a75ca31c7e.reference || (__cxx_static_address_593d45b0f00625a75ca31c7e.reference = {
    __cReference: true,
    get value() { return LOADSCREEN____header_global_75034a5a9db43301; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:717
export const BORNTOBEWILDSCREEN____header_global_154fe356de9fae21 = ((((((3370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f638172423608463512c3caa() {
  return __cxx_static_address_f638172423608463512c3caa.reference || (__cxx_static_address_f638172423608463512c3caa.reference = {
    __cReference: true,
    get value() { return BORNTOBEWILDSCREEN____header_global_154fe356de9fae21; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:718
export const BLIMP____header_global_f901901febddf602 = ((((((3400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a03af4d0864d3e2b1be035a7() {
  return __cxx_static_address_a03af4d0864d3e2b1be035a7.reference || (__cxx_static_address_a03af4d0864d3e2b1be035a7.reference = {
    __cReference: true,
    get value() { return BLIMP____header_global_f901901febddf602; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:719
export const FEM9____header_global_1911d893a60eb65a = ((((((3450) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_57ca5201fed8b72e6016906e() {
  return __cxx_static_address_57ca5201fed8b72e6016906e.reference || (__cxx_static_address_57ca5201fed8b72e6016906e.reference = {
    __cReference: true,
    get value() { return FEM9____header_global_1911d893a60eb65a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:720
export const FRAMEEFFECT1_13____header_global_b73f78386945dc1d = ((((((3999) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4e6451c285d6d9acf21defe4() {
  return __cxx_static_address_4e6451c285d6d9acf21defe4.reference || (__cxx_static_address_4e6451c285d6d9acf21defe4.reference = {
    __cReference: true,
    get value() { return FRAMEEFFECT1_13____header_global_b73f78386945dc1d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:721
export const FRAMEEFFECT1____header_global_f262c644f97350ba = ((((((4095) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c8aa4794f2dba008bc284b0b() {
  return __cxx_static_address_c8aa4794f2dba008bc284b0b.reference || (__cxx_static_address_c8aa4794f2dba008bc284b0b.reference = {
    __cReference: true,
    get value() { return FRAMEEFFECT1____header_global_f262c644f97350ba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:722
export const PANNEL3____header_global_0e0a3d72047b5b5d = ((((((4099) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_12e33f13c5a6a0616a7f3d3c() {
  return __cxx_static_address_12e33f13c5a6a0616a7f3d3c.reference || (__cxx_static_address_12e33f13c5a6a0616a7f3d3c.reference = {
    __cReference: true,
    get value() { return PANNEL3____header_global_0e0a3d72047b5b5d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:723
export const SCREENBREAK14____header_global_dee16fd82a4a171d = ((((((4120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_faa3e293d65e250f71dc9ab3() {
  return __cxx_static_address_faa3e293d65e250f71dc9ab3.reference || (__cxx_static_address_faa3e293d65e250f71dc9ab3.reference = {
    __cReference: true,
    get value() { return SCREENBREAK14____header_global_dee16fd82a4a171d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:724
export const SCREENBREAK15____header_global_dc4ed6f76bac2e46 = ((((((4123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5d72e39dc4ae6201c935198c() {
  return __cxx_static_address_5d72e39dc4ae6201c935198c.reference || (__cxx_static_address_5d72e39dc4ae6201c935198c.reference = {
    __cReference: true,
    get value() { return SCREENBREAK15____header_global_dc4ed6f76bac2e46; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:725
export const SCREENBREAK19____header_global_0e1354af841de28b = ((((((4125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7813157b52732df7cf382e1c() {
  return __cxx_static_address_7813157b52732df7cf382e1c.reference || (__cxx_static_address_7813157b52732df7cf382e1c.reference = {
    __cReference: true,
    get value() { return SCREENBREAK19____header_global_0e1354af841de28b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:726
export const SCREENBREAK16____header_global_37c89682c0142899 = ((((((4127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e06b375b3d96117b5cceab64() {
  return __cxx_static_address_e06b375b3d96117b5cceab64.reference || (__cxx_static_address_e06b375b3d96117b5cceab64.reference = {
    __cReference: true,
    get value() { return SCREENBREAK16____header_global_37c89682c0142899; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:727
export const SCREENBREAK17____header_global_05fffe3d31571f8f = ((((((4128) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9e39aec95db771f16bb5af71() {
  return __cxx_static_address_9e39aec95db771f16bb5af71.reference || (__cxx_static_address_9e39aec95db771f16bb5af71.reference = {
    __cReference: true,
    get value() { return SCREENBREAK17____header_global_05fffe3d31571f8f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:728
export const SCREENBREAK18____header_global_29b866e8be3bb0e5 = ((((((4129) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_499554cb254f0c95f98d0215() {
  return __cxx_static_address_499554cb254f0c95f98d0215.reference || (__cxx_static_address_499554cb254f0c95f98d0215.reference = {
    __cReference: true,
    get value() { return SCREENBREAK18____header_global_29b866e8be3bb0e5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:729
export const W_TECHWALL11____header_global_238670e80820cc59 = ((((((4130) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2dc115ed02a63944e1299839() {
  return __cxx_static_address_2dc115ed02a63944e1299839.reference || (__cxx_static_address_2dc115ed02a63944e1299839.reference = {
    __cReference: true,
    get value() { return W_TECHWALL11____header_global_238670e80820cc59; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:730
export const W_TECHWALL12____header_global_26219b5b32a32390 = ((((((4131) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1c16d1d97bc972539543f0df() {
  return __cxx_static_address_1c16d1d97bc972539543f0df.reference || (__cxx_static_address_1c16d1d97bc972539543f0df.reference = {
    __cReference: true,
    get value() { return W_TECHWALL12____header_global_26219b5b32a32390; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:731
export const W_TECHWALL13____header_global_0aab4e8d35e8a537 = ((((((4132) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ee5da9596ee03e68bb7a4853() {
  return __cxx_static_address_ee5da9596ee03e68bb7a4853.reference || (__cxx_static_address_ee5da9596ee03e68bb7a4853.reference = {
    __cReference: true,
    get value() { return W_TECHWALL13____header_global_0aab4e8d35e8a537; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:732
export const W_TECHWALL14____header_global_7cb84cc4d7a806e5 = ((((((4133) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_300b5edbb5cb32dd843148b0() {
  return __cxx_static_address_300b5edbb5cb32dd843148b0.reference || (__cxx_static_address_300b5edbb5cb32dd843148b0.reference = {
    __cReference: true,
    get value() { return W_TECHWALL14____header_global_7cb84cc4d7a806e5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:733
export const W_TECHWALL5____header_global_178d8e591395d7a4 = ((((((4134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3fb38733c254ce53fb9aa218() {
  return __cxx_static_address_3fb38733c254ce53fb9aa218.reference || (__cxx_static_address_3fb38733c254ce53fb9aa218.reference = {
    __cReference: true,
    get value() { return W_TECHWALL5____header_global_178d8e591395d7a4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:734
export const W_TECHWALL6____header_global_c65eee0062bdd03a = ((((((4136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5c7b162807cdbdf05ebad60b() {
  return __cxx_static_address_5c7b162807cdbdf05ebad60b.reference || (__cxx_static_address_5c7b162807cdbdf05ebad60b.reference = {
    __cReference: true,
    get value() { return W_TECHWALL6____header_global_c65eee0062bdd03a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:735
export const W_TECHWALL7____header_global_babb1b934069f983 = ((((((4138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_82beebd01c3811ee69cd4fad() {
  return __cxx_static_address_82beebd01c3811ee69cd4fad.reference || (__cxx_static_address_82beebd01c3811ee69cd4fad.reference = {
    __cReference: true,
    get value() { return W_TECHWALL7____header_global_babb1b934069f983; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:736
export const W_TECHWALL8____header_global_9454b359a1b676dd = ((((((4140) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d5ba04d0621dc1cffa0da085() {
  return __cxx_static_address_d5ba04d0621dc1cffa0da085.reference || (__cxx_static_address_d5ba04d0621dc1cffa0da085.reference = {
    __cReference: true,
    get value() { return W_TECHWALL8____header_global_9454b359a1b676dd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:737
export const W_TECHWALL9____header_global_4313a044e54eb8e9 = ((((((4142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1a833b0900bc46cd55e14b64() {
  return __cxx_static_address_1a833b0900bc46cd55e14b64.reference || (__cxx_static_address_1a833b0900bc46cd55e14b64.reference = {
    __cReference: true,
    get value() { return W_TECHWALL9____header_global_4313a044e54eb8e9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:738
export const BPANNEL3____header_global_86d04916f3f52315 = ((((((4100) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d6c6fc300a202096c083ad2f() {
  return __cxx_static_address_d6c6fc300a202096c083ad2f.reference || (__cxx_static_address_d6c6fc300a202096c083ad2f.reference = {
    __cReference: true,
    get value() { return BPANNEL3____header_global_86d04916f3f52315; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:739
export const W_HITTECHWALL16____header_global_c34adf9dcd0815b7 = ((((((4144) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_93a4535061ca87a700892a15() {
  return __cxx_static_address_93a4535061ca87a700892a15.reference || (__cxx_static_address_93a4535061ca87a700892a15.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL16____header_global_c34adf9dcd0815b7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:740
export const W_HITTECHWALL10____header_global_1662e62441260699 = ((((((4145) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c96557b7132cf7488716163b() {
  return __cxx_static_address_c96557b7132cf7488716163b.reference || (__cxx_static_address_c96557b7132cf7488716163b.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL10____header_global_1662e62441260699; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:741
export const W_HITTECHWALL15____header_global_f06b24155aebb3ee = ((((((4147) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4b35498680291679a46d39b6() {
  return __cxx_static_address_4b35498680291679a46d39b6.reference || (__cxx_static_address_4b35498680291679a46d39b6.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL15____header_global_f06b24155aebb3ee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:742
export const W_MILKSHELF____header_global_cfb7e91958131b93 = ((((((4181) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7619b0cffec25c5c9fb81dc9() {
  return __cxx_static_address_7619b0cffec25c5c9fb81dc9.reference || (__cxx_static_address_7619b0cffec25c5c9fb81dc9.reference = {
    __cReference: true,
    get value() { return W_MILKSHELF____header_global_cfb7e91958131b93; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:743
export const W_MILKSHELFBROKE____header_global_5df2ad1a506fa87d = ((((((4203) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9313d1c6d6f076e101c20f40() {
  return __cxx_static_address_9313d1c6d6f076e101c20f40.reference || (__cxx_static_address_9313d1c6d6f076e101c20f40.reference = {
    __cReference: true,
    get value() { return W_MILKSHELFBROKE____header_global_5df2ad1a506fa87d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:744
export const PURPLELAVA____header_global_1802ac85ebcf4908 = ((((((4240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_08c821ffafe3147ed1f488fc() {
  return __cxx_static_address_08c821ffafe3147ed1f488fc.reference || (__cxx_static_address_08c821ffafe3147ed1f488fc.reference = {
    __cReference: true,
    get value() { return PURPLELAVA____header_global_1802ac85ebcf4908; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:745
export const TARGET____header_global_afc123de24f79e81 = ((((((4359) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2ba705cc21883cc2f0d844eb() {
  return __cxx_static_address_2ba705cc21883cc2f0d844eb.reference || (__cxx_static_address_2ba705cc21883cc2f0d844eb.reference = {
    __cReference: true,
    get value() { return TARGET____header_global_afc123de24f79e81; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:746
export const DUCK____header_global_6903a43118f2db5a = ((((((4361) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_18ab87ba76a69fd7f65d6307() {
  return __cxx_static_address_18ab87ba76a69fd7f65d6307.reference || (__cxx_static_address_18ab87ba76a69fd7f65d6307.reference = {
    __cReference: true,
    get value() { return DUCK____header_global_6903a43118f2db5a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:747
export const PUKE____header_global_06f0d624fc1dbc0a = ((((((4389) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_212d74bca2ac2388b728b2a1() {
  return __cxx_static_address_212d74bca2ac2388b728b2a1.reference || (__cxx_static_address_212d74bca2ac2388b728b2a1.reference = {
    __cReference: true,
    get value() { return PUKE____header_global_06f0d624fc1dbc0a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:748
export const DOORTILE23____header_global_3a879bb2bf2f68bc = ((((((4391) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0943fcd5c5a080b45e046968() {
  return __cxx_static_address_0943fcd5c5a080b45e046968.reference || (__cxx_static_address_0943fcd5c5a080b45e046968.reference = {
    __cReference: true,
    get value() { return DOORTILE23____header_global_3a879bb2bf2f68bc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:749
export const SPEAKER____header_global_8d03070ef8f172a8 = ((((((4397) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3c76382c78fd3143bf4b1d70() {
  return __cxx_static_address_3c76382c78fd3143bf4b1d70.reference || (__cxx_static_address_3c76382c78fd3143bf4b1d70.reference = {
    __cReference: true,
    get value() { return SPEAKER____header_global_8d03070ef8f172a8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:750
export const MAIL____header_global_b356f63c875ca61c = ((((((4410) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2cdd3f8f345c48056a066932() {
  return __cxx_static_address_2cdd3f8f345c48056a066932.reference || (__cxx_static_address_2cdd3f8f345c48056a066932.reference = {
    __cReference: true,
    get value() { return MAIL____header_global_b356f63c875ca61c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:751
export const HOTMEAT____header_global_6510c06d25f15e2d = ((((((4427) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bd974f4c3a8cfe11be4d319e() {
  return __cxx_static_address_bd974f4c3a8cfe11be4d319e.reference || (__cxx_static_address_bd974f4c3a8cfe11be4d319e.reference = {
    __cReference: true,
    get value() { return HOTMEAT____header_global_6510c06d25f15e2d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:752
export const TRIPODCAMERA____header_global_b9f13bb3cc70b0eb = ((((((4444) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3fe6f783cce779a7a0d53e42() {
  return __cxx_static_address_3fe6f783cce779a7a0d53e42.reference || (__cxx_static_address_3fe6f783cce779a7a0d53e42.reference = {
    __cReference: true,
    get value() { return TRIPODCAMERA____header_global_b9f13bb3cc70b0eb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:753
export const PAPER____header_global_acfea3507274fab2 = ((((((4460) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f57a5945276806ca5e0c16e8() {
  return __cxx_static_address_f57a5945276806ca5e0c16e8.reference || (__cxx_static_address_f57a5945276806ca5e0c16e8.reference = {
    __cReference: true,
    get value() { return PAPER____header_global_acfea3507274fab2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:754
export const GENERICPOLE2____header_global_7e082cbf7c0acc7e = ((((((4465) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d7948d9511ba79321a3884e1() {
  return __cxx_static_address_d7948d9511ba79321a3884e1.reference || (__cxx_static_address_d7948d9511ba79321a3884e1.reference = {
    __cReference: true,
    get value() { return GENERICPOLE2____header_global_7e082cbf7c0acc7e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:755
export const XXXSTACY____header_global_5bbd08228ea6ba35 = ((((((4470) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_489c5b88427a6dd69ac87379() {
  return __cxx_static_address_489c5b88427a6dd69ac87379.reference || (__cxx_static_address_489c5b88427a6dd69ac87379.reference = {
    __cReference: true,
    get value() { return XXXSTACY____header_global_5bbd08228ea6ba35; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:756
export const LETTER____header_global_04d2d2c6238b504e = ((((((4502) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dacfb90345301fe7f38e52b1() {
  return __cxx_static_address_dacfb90345301fe7f38e52b1.reference || (__cxx_static_address_dacfb90345301fe7f38e52b1.reference = {
    __cReference: true,
    get value() { return LETTER____header_global_04d2d2c6238b504e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:757
export const SIDEBOLT1____header_global_871990fe296de4d0 = ((((((4525) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b7f2ff69eafdcc154a99fc26() {
  return __cxx_static_address_b7f2ff69eafdcc154a99fc26.reference || (__cxx_static_address_b7f2ff69eafdcc154a99fc26.reference = {
    __cReference: true,
    get value() { return SIDEBOLT1____header_global_871990fe296de4d0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:758
export const FOODOBJECT16____header_global_993f276e2c1b122a = ((((((4545) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9e346c98152b2f3842a1a90d() {
  return __cxx_static_address_9e346c98152b2f3842a1a90d.reference || (__cxx_static_address_9e346c98152b2f3842a1a90d.reference = {
    __cReference: true,
    get value() { return FOODOBJECT16____header_global_993f276e2c1b122a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:759
export const TAMPON____header_global_126417a525a8c812 = ((((((4557) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_395723b077be67083f32948f() {
  return __cxx_static_address_395723b077be67083f32948f.reference || (__cxx_static_address_395723b077be67083f32948f.reference = {
    __cReference: true,
    get value() { return TAMPON____header_global_126417a525a8c812; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:760
export const CANWITHSOMETHING2____header_global_c16678a5828fcf5a = ((((((4580) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4f2655e31ec82cddc4327af1() {
  return __cxx_static_address_4f2655e31ec82cddc4327af1.reference || (__cxx_static_address_4f2655e31ec82cddc4327af1.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING2____header_global_c16678a5828fcf5a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:761
export const CANWITHSOMETHING3____header_global_c0559fd5ce7e8b6d = ((((((4581) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b982f9591016479b869e3908() {
  return __cxx_static_address_b982f9591016479b869e3908.reference || (__cxx_static_address_b982f9591016479b869e3908.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING3____header_global_c0559fd5ce7e8b6d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:762
export const CANWITHSOMETHING4____header_global_c1ad959569283600 = ((((((4582) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a32ddbce9b24f769af4832d0() {
  return __cxx_static_address_a32ddbce9b24f769af4832d0.reference || (__cxx_static_address_a32ddbce9b24f769af4832d0.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING4____header_global_c1ad959569283600; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:763
export const DOLPHIN1____header_global_e8375d570cf75ae7 = ((((((4591) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_079e1869fcf95329dd6014ac() {
  return __cxx_static_address_079e1869fcf95329dd6014ac.reference || (__cxx_static_address_079e1869fcf95329dd6014ac.reference = {
    __cReference: true,
    get value() { return DOLPHIN1____header_global_e8375d570cf75ae7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:764
export const DOLPHIN2____header_global_efba28b2e2534095 = ((((((4592) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_12133f0bccf5ea70d394b774() {
  return __cxx_static_address_12133f0bccf5ea70d394b774.reference || (__cxx_static_address_12133f0bccf5ea70d394b774.reference = {
    __cReference: true,
    get value() { return DOLPHIN2____header_global_efba28b2e2534095; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:765
export const NEWBEAST____header_global_12d756315474ac03 = ((((((4610) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7aee2885cf7c4c79b0424525() {
  return __cxx_static_address_7aee2885cf7c4c79b0424525.reference || (__cxx_static_address_7aee2885cf7c4c79b0424525.reference = {
    __cReference: true,
    get value() { return NEWBEAST____header_global_12d756315474ac03; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:766
export const NEWBEASTSTAYPUT____header_global_0e5183d036eade76 = ((((((4611) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5ee487d24f50c6dbe860d512() {
  return __cxx_static_address_5ee487d24f50c6dbe860d512.reference || (__cxx_static_address_5ee487d24f50c6dbe860d512.reference = {
    __cReference: true,
    get value() { return NEWBEASTSTAYPUT____header_global_0e5183d036eade76; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:767
export const BOSS4____header_global_2b48f3474bb80a3e = ((((((4740) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aab9fed2a117ed26f2ac020d() {
  return __cxx_static_address_aab9fed2a117ed26f2ac020d.reference || (__cxx_static_address_aab9fed2a117ed26f2ac020d.reference = {
    __cReference: true,
    get value() { return BOSS4____header_global_2b48f3474bb80a3e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:768
export const BOSS4STAYPUT____header_global_fb80087818bee80d = ((((((4741) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e26589c3fd62fa5200865ec2() {
  return __cxx_static_address_e26589c3fd62fa5200865ec2.reference || (__cxx_static_address_e26589c3fd62fa5200865ec2.reference = {
    __cReference: true,
    get value() { return BOSS4STAYPUT____header_global_fb80087818bee80d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:769
export const FEM10____header_global_71a0f73f83d30a60 = ((((((4864) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_67e39c0542a4d2f3c88c497d() {
  return __cxx_static_address_67e39c0542a4d2f3c88c497d.reference || (__cxx_static_address_67e39c0542a4d2f3c88c497d.reference = {
    __cReference: true,
    get value() { return FEM10____header_global_71a0f73f83d30a60; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:770
export const TOUGHGAL____header_global_3dfb4df4c0732e53 = ((((((4866) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b31668ff5cd3231acf1a4d8c() {
  return __cxx_static_address_b31668ff5cd3231acf1a4d8c.reference || (__cxx_static_address_b31668ff5cd3231acf1a4d8c.reference = {
    __cReference: true,
    get value() { return TOUGHGAL____header_global_3dfb4df4c0732e53; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:771
export const MAN____header_global_f8e08c6a58fdf436 = ((((((4871) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_22d49a9cd75c39655488dc31() {
  return __cxx_static_address_22d49a9cd75c39655488dc31.reference || (__cxx_static_address_22d49a9cd75c39655488dc31.reference = {
    __cReference: true,
    get value() { return MAN____header_global_f8e08c6a58fdf436; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:772
export const MAN2____header_global_9f16c49f84212ce6 = ((((((4872) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_35d6e9f7be94f76af762bccb() {
  return __cxx_static_address_35d6e9f7be94f76af762bccb.reference || (__cxx_static_address_35d6e9f7be94f76af762bccb.reference = {
    __cReference: true,
    get value() { return MAN2____header_global_9f16c49f84212ce6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:773
export const WOMAN____header_global_327f1ab63f83ee59 = ((((((4874) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a2d0e995b7ef1a569ae00538() {
  return __cxx_static_address_a2d0e995b7ef1a569ae00538.reference || (__cxx_static_address_a2d0e995b7ef1a569ae00538.reference = {
    __cReference: true,
    get value() { return WOMAN____header_global_327f1ab63f83ee59; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:774
export const NATURALLIGHTNING____header_global_32d1ad6f25819841 = ((((((4890) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b22dc642f7f7c89cfd32d7f6() {
  return __cxx_static_address_b22dc642f7f7c89cfd32d7f6.reference || (__cxx_static_address_b22dc642f7f7c89cfd32d7f6.reference = {
    __cReference: true,
    get value() { return NATURALLIGHTNING____header_global_32d1ad6f25819841; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:775
export const WEATHERWARN____header_global_7c3c9a97363f4d86 = ((((((4893) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a74973c2f906507921394fd9() {
  return __cxx_static_address_a74973c2f906507921394fd9.reference || (__cxx_static_address_a74973c2f906507921394fd9.reference = {
    __cReference: true,
    get value() { return WEATHERWARN____header_global_7c3c9a97363f4d86; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:776
export const DUKETAG____header_global_22683ec9bf70d9de = ((((((4900) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e90017466e59f2f658d7f6e0() {
  return __cxx_static_address_e90017466e59f2f658d7f6e0.reference || (__cxx_static_address_e90017466e59f2f658d7f6e0.reference = {
    __cReference: true,
    get value() { return DUKETAG____header_global_22683ec9bf70d9de; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:777
export const SIGN1____header_global_c2b54d769df96e33 = ((((((4909) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d4f6aa12371d2e4c17b2fddb() {
  return __cxx_static_address_d4f6aa12371d2e4c17b2fddb.reference || (__cxx_static_address_d4f6aa12371d2e4c17b2fddb.reference = {
    __cReference: true,
    get value() { return SIGN1____header_global_c2b54d769df96e33; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:778
export const SIGN2____header_global_e377521624d13abc = ((((((4912) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5a40a245c5c647f9f3836817() {
  return __cxx_static_address_5a40a245c5c647f9f3836817.reference || (__cxx_static_address_5a40a245c5c647f9f3836817.reference = {
    __cReference: true,
    get value() { return SIGN2____header_global_e377521624d13abc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:779
export const JURYGUY____header_global_d5f47c33b1b58fb2 = ((((((4943) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4adb69d4e6d50c43be1c6bdb() {
  return __cxx_static_address_4adb69d4e6d50c43be1c6bdb.reference || (__cxx_static_address_4adb69d4e6d50c43be1c6bdb.reference = {
    __cReference: true,
    get value() { return JURYGUY____header_global_d5f47c33b1b58fb2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:780
export const WIDESCREENSTATUSBAR____header_global_efd68f56b72e75e9 = ((((((5120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0155ae3df04e08af640ce0f8() {
  return __cxx_static_address_0155ae3df04e08af640ce0f8.reference || (__cxx_static_address_0155ae3df04e08af640ce0f8.reference = {
    __cReference: true,
    get value() { return WIDESCREENSTATUSBAR____header_global_efd68f56b72e75e9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:781
export const RPGGUNWIDE____header_global_7ecadfd59e7ffdb3 = ((((((5121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0936fbe556152ade8a6e30df() {
  return __cxx_static_address_0936fbe556152ade8a6e30df.reference || (__cxx_static_address_0936fbe556152ade8a6e30df.reference = {
    __cReference: true,
    get value() { return RPGGUNWIDE____header_global_7ecadfd59e7ffdb3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:782
export const FIRSTGUNRELOADWIDE____header_global_6a983b5abe007734 = ((((((5122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a9313626825f0bc503ecb628() {
  return __cxx_static_address_a9313626825f0bc503ecb628.reference || (__cxx_static_address_a9313626825f0bc503ecb628.reference = {
    __cReference: true,
    get value() { return FIRSTGUNRELOADWIDE____header_global_6a983b5abe007734; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:783
export const FREEZEWIDE____header_global_2f9ef4523b228d1c = ((((((5123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1fe752ed8d7a46003e02dac3() {
  return __cxx_static_address_1fe752ed8d7a46003e02dac3.reference || (__cxx_static_address_1fe752ed8d7a46003e02dac3.reference = {
    __cReference: true,
    get value() { return FREEZEWIDE____header_global_2f9ef4523b228d1c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:784
export const FREEZEFIREWIDE____header_global_7f941e46464c2182 = ((((((5124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9e5821819144875aa908f060() {
  return __cxx_static_address_9e5821819144875aa908f060.reference || (__cxx_static_address_9e5821819144875aa908f060.reference = {
    __cReference: true,
    get value() { return FREEZEFIREWIDE____header_global_7f941e46464c2182; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:785
export const SHRINKERWIDE____header_global_2e59a81f374a2b68 = ((((((5127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6de6428a3cc33968b2317c5e() {
  return __cxx_static_address_6de6428a3cc33968b2317c5e.reference || (__cxx_static_address_6de6428a3cc33968b2317c5e.reference = {
    __cReference: true,
    get value() { return SHRINKERWIDE____header_global_2e59a81f374a2b68; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:786
export const CRACKKNUCKLESWIDE____header_global_ff7b68d7eae3f5ca = ((((((5129) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e20cdd291c7f0d7a45c95a9d() {
  return __cxx_static_address_e20cdd291c7f0d7a45c95a9d.reference || (__cxx_static_address_e20cdd291c7f0d7a45c95a9d.reference = {
    __cReference: true,
    get value() { return CRACKKNUCKLESWIDE____header_global_ff7b68d7eae3f5ca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:787
export const FLAMETHROWERSPRITE____header_global_6fb6813069b2f58b = ((((((5134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_59461f319f74fae534a24557() {
  return __cxx_static_address_59461f319f74fae534a24557.reference || (__cxx_static_address_59461f319f74fae534a24557.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERSPRITE____header_global_6fb6813069b2f58b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:788
export const FLAMETHROWERAMMO____header_global_25285185a366604e = ((((((5135) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5afa60231828f885c8093c6c() {
  return __cxx_static_address_5afa60231828f885c8093c6c.reference || (__cxx_static_address_5afa60231828f885c8093c6c.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERAMMO____header_global_25285185a366604e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:789
export const FLAMETHROWER____header_global_51f6a03332832d5d = ((((((5138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9ac322c3a799e9e3d9cfdd6c() {
  return __cxx_static_address_9ac322c3a799e9e3d9cfdd6c.reference || (__cxx_static_address_9ac322c3a799e9e3d9cfdd6c.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER____header_global_51f6a03332832d5d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:790
export const FLAMETHROWERFIRE____header_global_6624920b98d79261 = ((((((5139) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_02af3f0cf0b8c4caca6537e4() {
  return __cxx_static_address_02af3f0cf0b8c4caca6537e4.reference || (__cxx_static_address_02af3f0cf0b8c4caca6537e4.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERFIRE____header_global_6624920b98d79261; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:791
export const FLAMETHROWERFLAME____header_global_5a117844cc9661cb = ((((((1891) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9b7d2a3e037fbf98e67ca982() {
  return __cxx_static_address_9b7d2a3e037fbf98e67ca982.reference || (__cxx_static_address_9b7d2a3e037fbf98e67ca982.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERFLAME____header_global_5a117844cc9661cb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:792
export const FLAMETHROWERPILOT____header_global_02553ed7dfff5ca7 = ((((((5174) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e9f1770be10d9d2da7323636() {
  return __cxx_static_address_e9f1770be10d9d2da7323636.reference || (__cxx_static_address_e9f1770be10d9d2da7323636.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERPILOT____header_global_02553ed7dfff5ca7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:793
export const FIREBALL____header_global_a38ed23f05b6029d = ((((((5163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ce9ca81830cd32cfa968ccf2() {
  return __cxx_static_address_ce9ca81830cd32cfa968ccf2.reference || (__cxx_static_address_ce9ca81830cd32cfa968ccf2.reference = {
    __cReference: true,
    get value() { return FIREBALL____header_global_a38ed23f05b6029d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:794
export const ONFIRE____header_global_eae9bc02c54859ff = ((((((5152) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_813c4a27aad521f46d5d00aa() {
  return __cxx_static_address_813c4a27aad521f46d5d00aa.reference || (__cxx_static_address_813c4a27aad521f46d5d00aa.reference = {
    __cReference: true,
    get value() { return ONFIRE____header_global_eae9bc02c54859ff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:795
export const ONFIRESMOKE____header_global_b0a808e493ab2436 = ((((((5143) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e7bf4c7a1a25892ccb3c771() {
  return __cxx_static_address_1e7bf4c7a1a25892ccb3c771.reference || (__cxx_static_address_1e7bf4c7a1a25892ccb3c771.reference = {
    __cReference: true,
    get value() { return ONFIRESMOKE____header_global_b0a808e493ab2436; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:796
export const BURNEDCORPSE____header_global_5cfd6c5705da1bb5 = ((((((5173) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_23635eed4afcfc0eb48dc13a() {
  return __cxx_static_address_23635eed4afcfc0eb48dc13a.reference || (__cxx_static_address_23635eed4afcfc0eb48dc13a.reference = {
    __cReference: true,
    get value() { return BURNEDCORPSE____header_global_5cfd6c5705da1bb5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:797
export const WHISPYSMOKE____header_global_c4350e6e1341ec47 = ((((((5268) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b4eb4a922a6e2693455a2a2c() {
  return __cxx_static_address_b4eb4a922a6e2693455a2a2c.reference || (__cxx_static_address_b4eb4a922a6e2693455a2a2c.reference = {
    __cReference: true,
    get value() { return WHISPYSMOKE____header_global_c4350e6e1341ec47; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:798
export const FIREFLY____header_global_c76be19afb5ca7bd = ((((((5180) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a5b325e333d70767654594ec() {
  return __cxx_static_address_a5b325e333d70767654594ec.reference || (__cxx_static_address_a5b325e333d70767654594ec.reference = {
    __cReference: true,
    get value() { return FIREFLY____header_global_c76be19afb5ca7bd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:799
export const FIREFLYSHRINKEFFECT____header_global_ec5d03f035bf799e = ((((((5360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_13583388b934b0223d43ad50() {
  return __cxx_static_address_13583388b934b0223d43ad50.reference || (__cxx_static_address_13583388b934b0223d43ad50.reference = {
    __cReference: true,
    get value() { return FIREFLYSHRINKEFFECT____header_global_ec5d03f035bf799e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:800
export const FIREFLYGROWEFFECT____header_global_be155f8eccbf08aa = ((((((5367) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ca6e2bd92c5ee7bbe56b82aa() {
  return __cxx_static_address_ca6e2bd92c5ee7bbe56b82aa.reference || (__cxx_static_address_ca6e2bd92c5ee7bbe56b82aa.reference = {
    __cReference: true,
    get value() { return FIREFLYGROWEFFECT____header_global_be155f8eccbf08aa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:801
export const FIREFLYFLYINGEFFECT____header_global_61c9de913abd5dfd = ((((((5296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3481702ddae71823aebcb216() {
  return __cxx_static_address_3481702ddae71823aebcb216.reference || (__cxx_static_address_3481702ddae71823aebcb216.reference = {
    __cReference: true,
    get value() { return FIREFLYFLYINGEFFECT____header_global_61c9de913abd5dfd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:802
export const BOSS5____header_global_5760d835d1d4d816 = ((((((5310) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_05253c20da060ead02c1304b() {
  return __cxx_static_address_05253c20da060ead02c1304b.reference || (__cxx_static_address_05253c20da060ead02c1304b.reference = {
    __cReference: true,
    get value() { return BOSS5____header_global_5760d835d1d4d816; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:803
export const BOSS5STAYPUT____header_global_0af8c9948fc47795 = ((((((5311) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_411b562c3b5acec45fe73eba() {
  return __cxx_static_address_411b562c3b5acec45fe73eba.reference || (__cxx_static_address_411b562c3b5acec45fe73eba.reference = {
    __cReference: true,
    get value() { return BOSS5STAYPUT____header_global_0af8c9948fc47795; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:804
export const LAVAPOOL____header_global_3a3df3a986902a58 = ((((((5304) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_de598c4d09b770a7f195f74b() {
  return __cxx_static_address_de598c4d09b770a7f195f74b.reference || (__cxx_static_address_de598c4d09b770a7f195f74b.reference = {
    __cReference: true,
    get value() { return LAVAPOOL____header_global_3a3df3a986902a58; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:805
export const LAVASPLASH____header_global_38f880696e69d25b = ((((((5371) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9045063a69949c2fc9b8a470() {
  return __cxx_static_address_9045063a69949c2fc9b8a470.reference || (__cxx_static_address_9045063a69949c2fc9b8a470.reference = {
    __cReference: true,
    get value() { return LAVASPLASH____header_global_38f880696e69d25b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:806
export const LAVAPOOLBUBBLE____header_global_e47cbd6629b518a8 = ((((((5207) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_13786957dbcf10c7e5495a89() {
  return __cxx_static_address_13786957dbcf10c7e5495a89.reference || (__cxx_static_address_13786957dbcf10c7e5495a89.reference = {
    __cReference: true,
    get value() { return LAVAPOOLBUBBLE____header_global_e47cbd6629b518a8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:807
export const BOSS2STAYPUT____header_global_625b9ec4c18478bd = ((((((2711) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8ecd2fc5e7930d50aebd3842() {
  return __cxx_static_address_8ecd2fc5e7930d50aebd3842.reference || (__cxx_static_address_8ecd2fc5e7930d50aebd3842.reference = {
    __cReference: true,
    get value() { return BOSS2STAYPUT____header_global_625b9ec4c18478bd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:808
export const BOSS3STAYPUT____header_global_abb9ccf7859c1e4e = ((((((2761) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9dae20baf7c74e3023406695() {
  return __cxx_static_address_9dae20baf7c74e3023406695.reference || (__cxx_static_address_9dae20baf7c74e3023406695.reference = {
    __cReference: true,
    get value() { return BOSS3STAYPUT____header_global_abb9ccf7859c1e4e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:809
export const E32_TILE5736____header_global_9bdeaf6b81b8bf81 = ((((((5736) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ba3c2cea16ef233c7381eb99() {
  return __cxx_static_address_ba3c2cea16ef233c7381eb99.reference || (__cxx_static_address_ba3c2cea16ef233c7381eb99.reference = {
    __cReference: true,
    get value() { return E32_TILE5736____header_global_9bdeaf6b81b8bf81; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:810
export const E32_TILE5737____header_global_5e6a1b829ae834cb = ((((((5737) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8606272acc51b373b8a7fab7() {
  return __cxx_static_address_8606272acc51b373b8a7fab7.reference || (__cxx_static_address_8606272acc51b373b8a7fab7.reference = {
    __cReference: true,
    get value() { return E32_TILE5737____header_global_5e6a1b829ae834cb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:811
export const E32_TILE5846____header_global_ce44542c2a6a54e7 = ((((((5846) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5bc34492ae42fd36bb1d6450() {
  return __cxx_static_address_5bc34492ae42fd36bb1d6450.reference || (__cxx_static_address_5bc34492ae42fd36bb1d6450.reference = {
    __cReference: true,
    get value() { return E32_TILE5846____header_global_ce44542c2a6a54e7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/network.h:180
export const cSnapshotMemUsage__header_global_2708801c7529f474 = u64((BigInt(u64(64)) * BigInt((BigInt((BigInt((BigInt(72) * BigInt(u64(16384)))) + BigInt((BigInt(96) * BigInt(u64(4096)))))) + BigInt((BigInt(296) * BigInt(u64(16384))))))));
function __cxx_static_address_7ce41b05f74e277ddccc2837() {
  return __cxx_static_address_7ce41b05f74e277ddccc2837.reference || (__cxx_static_address_7ce41b05f74e277ddccc2837.reference = {
    __cReference: true,
    get value() { return cSnapshotMemUsage__header_global_2708801c7529f474; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/gamedef.cpp:52
export let g_scriptVersion = i32(13);
export function __cxx_global_cell_f7e268c20b879c2fe3740be6() {
  return __cxx_global_cell_f7e268c20b879c2fe3740be6.reference || (__cxx_global_cell_f7e268c20b879c2fe3740be6.reference = {
    __cReference: true,
    get value() { return g_scriptVersion; },
    set value(__cxx_lvalue_0) { g_scriptVersion = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/gamedef.cpp:54
export let g_scriptFileName = (() => { const bytes = new Uint8Array(256); bytes.set([40, 110, 111, 110, 101, 41]); return bytes; })();
function __cxx_static_address_2c7b3414dcc57a82accdfa85() {
  return __cxx_static_address_2c7b3414dcc57a82accdfa85.reference || (__cxx_static_address_2c7b3414dcc57a82accdfa85.reference = {
    __cReference: true,
    get value() { return g_scriptFileName; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/gamedef.cpp:56
export let g_totalLines = 0;
export function __cxx_global_cell_b8091875b3f39fe3d62b8019() {
  return __cxx_global_cell_b8091875b3f39fe3d62b8019.reference || (__cxx_global_cell_b8091875b3f39fe3d62b8019.reference = {
    __cReference: true,
    get value() { return g_totalLines; },
    set value(__cxx_lvalue_0) { g_totalLines = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/gamedef.cpp:57
export let g_lineNumber = 0;
export function __cxx_global_cell_06245cf7a06b2fd69750f440() {
  return __cxx_global_cell_06245cf7a06b2fd69750f440.reference || (__cxx_global_cell_06245cf7a06b2fd69750f440.reference = {
    __cReference: true,
    get value() { return g_lineNumber; },
    set value(__cxx_lvalue_0) { g_lineNumber = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/gamedef.cpp:58
export let g_szBuf = new Uint8Array(1024);
function __cxx_static_address_fadadfa38f69f3d5308b1304() {
  return __cxx_static_address_fadadfa38f69f3d5308b1304.reference || (__cxx_static_address_fadadfa38f69f3d5308b1304.reference = {
    __cReference: true,
    get value() { return g_szBuf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/gamedef.cpp:60
export let textptr = null;
function __cxx_static_address_e2c5808de82af938e5d43808() {
  return __cxx_static_address_e2c5808de82af938e5d43808.reference || (__cxx_static_address_e2c5808de82af938e5d43808.reference = {
    __cReference: true,
    get value() { return textptr; },
    set value(__cxx_lvalue_0) { textptr = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/duke3d/src/gamedef.cpp:62
export let g_szCurrentBlockName = (() => { const bytes = new Uint8Array(64); bytes.set([40, 110, 111, 110, 101, 41]); return bytes; })();
function __cxx_static_address_501929f182a6e7eae833bc82() {
  return __cxx_static_address_501929f182a6e7eae833bc82.reference || (__cxx_static_address_501929f182a6e7eae833bc82.reference = {
    __cReference: true,
    get value() { return g_szCurrentBlockName; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/gamedef.cpp:63
export let g_szLastBlockName = (() => { const bytes = new Uint8Array(64); bytes.set([78, 85, 76, 76]); return bytes; })();
function __cxx_static_address_21fc654e30adb9e60fcf1a9d() {
  return __cxx_static_address_21fc654e30adb9e60fcf1a9d.reference || (__cxx_static_address_21fc654e30adb9e60fcf1a9d.reference = {
    __cReference: true,
    get value() { return g_szLastBlockName; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/gamedef.cpp:65
export let g_checkingCase = false;
function __cxx_static_address_4380ab74fa8539415332e70f() {
  return __cxx_static_address_4380ab74fa8539415332e70f.reference || (__cxx_static_address_4380ab74fa8539415332e70f.reference = {
    __cReference: true,
    get value() { return g_checkingCase; },
    set value(__cxx_lvalue_0) { g_checkingCase = Boolean(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/gamedef.cpp:66
export let g_dynamicSoundMapping = false;
function __cxx_static_address_f9f39e1d0a9265c0804182ff() {
  return __cxx_static_address_f9f39e1d0a9265c0804182ff.reference || (__cxx_static_address_f9f39e1d0a9265c0804182ff.reference = {
    __cReference: true,
    get value() { return g_dynamicSoundMapping; },
    set value(__cxx_lvalue_0) { g_dynamicSoundMapping = Boolean(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/gamedef.cpp:67
export let g_dynamicTileMapping = false;
function __cxx_static_address_40fc6be02ba2c8a78347819d() {
  return __cxx_static_address_40fc6be02ba2c8a78347819d.reference || (__cxx_static_address_40fc6be02ba2c8a78347819d.reference = {
    __cReference: true,
    get value() { return g_dynamicTileMapping; },
    set value(__cxx_lvalue_0) { g_dynamicTileMapping = Boolean(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/gamedef.cpp:68
export let g_labelsOnly = false;
function __cxx_static_address_c0d7a45cf66da756fe7006ee() {
  return __cxx_static_address_c0d7a45cf66da756fe7006ee.reference || (__cxx_static_address_c0d7a45cf66da756fe7006ee.reference = {
    __cReference: true,
    get value() { return g_labelsOnly; },
    set value(__cxx_lvalue_0) { g_labelsOnly = Boolean(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/gamedef.cpp:69
export let g_skipBranch = false;
function __cxx_static_address_f12cff23ac9a70d73719e4d2() {
  return __cxx_static_address_f12cff23ac9a70d73719e4d2.reference || (__cxx_static_address_f12cff23ac9a70d73719e4d2.reference = {
    __cReference: true,
    get value() { return g_skipBranch; },
    set value(__cxx_lvalue_0) { g_skipBranch = Boolean(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/gamedef.cpp:70
export let g_switchCountPhase = Boolean(false);
function __cxx_static_address_1eefe906f3e1891f499f47e6() {
  return __cxx_static_address_1eefe906f3e1891f499f47e6.reference || (__cxx_static_address_1eefe906f3e1891f499f47e6.reference = {
    __cReference: true,
    get value() { return g_switchCountPhase; },
    set value(__cxx_lvalue_0) { g_switchCountPhase = Boolean(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/gamedef.cpp:72
export let g_processingState = 0;
function __cxx_static_address_8ebe202ae5fb6c8c9971153e() {
  return __cxx_static_address_8ebe202ae5fb6c8c9971153e.reference || (__cxx_static_address_8ebe202ae5fb6c8c9971153e.reference = {
    __cReference: true,
    get value() { return g_processingState; },
    set value(__cxx_lvalue_0) { g_processingState = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/gamedef.cpp:73
export let g_checkingIfElse = 0;
function __cxx_static_address_a350aa304093508ff5623d91() {
  return __cxx_static_address_a350aa304093508ff5623d91.reference || (__cxx_static_address_a350aa304093508ff5623d91.reference = {
    __cReference: true,
    get value() { return g_checkingIfElse; },
    set value(__cxx_lvalue_0) { g_checkingIfElse = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/gamedef.cpp:74
export let g_checkingSwitch = 0;
function __cxx_static_address_b11076f07e390f3d0edca60c() {
  return __cxx_static_address_b11076f07e390f3d0edca60c.reference || (__cxx_static_address_b11076f07e390f3d0edca60c.reference = {
    __cReference: true,
    get value() { return g_checkingSwitch; },
    set value(__cxx_lvalue_0) { g_checkingSwitch = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/gamedef.cpp:75
export let g_checkingLoop = 0;
function __cxx_static_address_e9c3eabf5b2a06cbdb663d17() {
  return __cxx_static_address_e9c3eabf5b2a06cbdb663d17.reference || (__cxx_static_address_e9c3eabf5b2a06cbdb663d17.reference = {
    __cReference: true,
    get value() { return g_checkingLoop; },
    set value(__cxx_lvalue_0) { g_checkingLoop = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/gamedef.cpp:76
export let g_lastKeyword = i32((-1));
function __cxx_static_address_7a26eced847ceaeb503b3b00() {
  return __cxx_static_address_7a26eced847ceaeb503b3b00.reference || (__cxx_static_address_7a26eced847ceaeb503b3b00.reference = {
    __cReference: true,
    get value() { return g_lastKeyword; },
    set value(__cxx_lvalue_0) { g_lastKeyword = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/gamedef.cpp:77
export let g_numBraces = 0;
function __cxx_static_address_fcad07c903c24c68027e9027() {
  return __cxx_static_address_fcad07c903c24c68027e9027.reference || (__cxx_static_address_fcad07c903c24c68027e9027.reference = {
    __cReference: true,
    get value() { return g_numBraces; },
    set value(__cxx_lvalue_0) { g_numBraces = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/gamedef.cpp:78
export let g_numCases = 0;
function __cxx_static_address_d53be4163c250c6f8c0cd7c9() {
  return __cxx_static_address_d53be4163c250c6f8c0cd7c9.reference || (__cxx_static_address_d53be4163c250c6f8c0cd7c9.reference = {
    __cReference: true,
    get value() { return g_numCases; },
    set value(__cxx_lvalue_0) { g_numCases = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/gamedef.cpp:80
export let apScriptGameEventEnd = null;
function __cxx_static_address_70fec3f36a7477e9c86b929a() {
  return __cxx_static_address_70fec3f36a7477e9c86b929a.reference || (__cxx_static_address_70fec3f36a7477e9c86b929a.reference = {
    __cReference: true,
    get value() { return apScriptGameEventEnd; },
    set value(__cxx_lvalue_0) { apScriptGameEventEnd = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/duke3d/src/gamedef.cpp:81
export let g_scriptActorOffset = 0n;
function __cxx_static_address_06390b4cc7aa0b9ca95fea1a() {
  return __cxx_static_address_06390b4cc7aa0b9ca95fea1a.reference || (__cxx_static_address_06390b4cc7aa0b9ca95fea1a.reference = {
    __cReference: true,
    get value() { return g_scriptActorOffset; },
    set value(__cxx_lvalue_0) { g_scriptActorOffset = i64(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/gamedef.cpp:82
export let g_scriptEventBreakOffset = 0n;
function __cxx_static_address_8ebd5f91aa4c39750d2b9680() {
  return __cxx_static_address_8ebd5f91aa4c39750d2b9680.reference || (__cxx_static_address_8ebd5f91aa4c39750d2b9680.reference = {
    __cReference: true,
    get value() { return g_scriptEventBreakOffset; },
    set value(__cxx_lvalue_0) { g_scriptEventBreakOffset = i64(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/gamedef.cpp:83
export let g_scriptEventChainOffset = 0n;
function __cxx_static_address_06228f8a1171bee01cc70d90() {
  return __cxx_static_address_06228f8a1171bee01cc70d90.reference || (__cxx_static_address_06228f8a1171bee01cc70d90.reference = {
    __cReference: true,
    get value() { return g_scriptEventChainOffset; },
    set value(__cxx_lvalue_0) { g_scriptEventChainOffset = i64(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_8aedb36c968ce828 = i32(2147483647);
function __cxx_static_address_ee4467d7e4b1da99e65ba615() {
  return __cxx_static_address_ee4467d7e4b1da99e65ba615.reference || (__cxx_static_address_ee4467d7e4b1da99e65ba615.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_8aedb36c968ce828; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_2b2ad8e2f74e17d2 = i32(2147483648);
function __cxx_static_address_0a5451428c722147eee7800f() {
  return __cxx_static_address_0a5451428c722147eee7800f.reference || (__cxx_static_address_0a5451428c722147eee7800f.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_2b2ad8e2f74e17d2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_c4c69d5fa54b876c = i32(2147483648);
function __cxx_static_address_58392cf0dc1273bc6d41534f() {
  return __cxx_static_address_58392cf0dc1273bc6d41534f.reference || (__cxx_static_address_58392cf0dc1273bc6d41534f.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_c4c69d5fa54b876c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_2d92bea5e7ada969 = i32(65536);
function __cxx_static_address_95145e230d0328dedc54f19e() {
  return __cxx_static_address_95145e230d0328dedc54f19e.reference || (__cxx_static_address_95145e230d0328dedc54f19e.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_2d92bea5e7ada969; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_a07e3fde61de8202 = i32(32768);
function __cxx_static_address_ad709a68a866c54137ff6f05() {
  return __cxx_static_address_ad709a68a866c54137ff6f05.reference || (__cxx_static_address_ad709a68a866c54137ff6f05.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_a07e3fde61de8202; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_16d4cb628f7888fe = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_f0523db9fedee9f4db3b924d() {
  return __cxx_static_address_f0523db9fedee9f4db3b924d.reference || (__cxx_static_address_f0523db9fedee9f4db3b924d.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_16d4cb628f7888fe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/gamedef.cpp:84
export let g_scriptEventOffset = 0n;
function __cxx_static_address_1b72215e06b29e323e0d276a() {
  return __cxx_static_address_1b72215e06b29e323e0d276a.reference || (__cxx_static_address_1b72215e06b29e323e0d276a.reference = {
    __cReference: true,
    get value() { return g_scriptEventOffset; },
    set value(__cxx_lvalue_0) { g_scriptEventOffset = i64(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/gamedef.cpp:86
export let apScriptStateEnd = null;
function __cxx_static_address_dc507236dcff998b7d2ee4a1() {
  return __cxx_static_address_dc507236dcff998b7d2ee4a1.reference || (__cxx_static_address_dc507236dcff998b7d2ee4a1.reference = {
    __cReference: true,
    get value() { return apScriptStateEnd; },
    set value(__cxx_lvalue_0) { apScriptStateEnd = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/duke3d/src/gamedef.cpp:87
export let g_scriptStateBreakOffset = 0n;
function __cxx_static_address_27e510db74ae17f48cd242e3() {
  return __cxx_static_address_27e510db74ae17f48cd242e3.reference || (__cxx_static_address_27e510db74ae17f48cd242e3.reference = {
    __cReference: true,
    get value() { return g_scriptStateBreakOffset; },
    set value(__cxx_lvalue_0) { g_scriptStateBreakOffset = i64(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/gamedef.cpp:88
export let g_scriptStateChainOffset = 0n;
function __cxx_static_address_6277c8eb58c5bf822575f5c3() {
  return __cxx_static_address_6277c8eb58c5bf822575f5c3.reference || (__cxx_static_address_6277c8eb58c5bf822575f5c3.reference = {
    __cReference: true,
    get value() { return g_scriptStateChainOffset; },
    set value(__cxx_lvalue_0) { g_scriptStateChainOffset = i64(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/gamedef.cpp:92
export let g_caseTablePtr = null;
function __cxx_static_address_c5c44e0ed337eab087b41c2f() {
  return __cxx_static_address_c5c44e0ed337eab087b41c2f.reference || (__cxx_static_address_c5c44e0ed337eab087b41c2f.reference = {
    __cReference: true,
    get value() { return g_caseTablePtr; },
    set value(__cxx_lvalue_0) { g_caseTablePtr = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/duke3d/src/gamedef.cpp:97
export let g_errorCnt = 0;
export function __cxx_global_cell_a9ed12f504f4bd101d4746c6() {
  return __cxx_global_cell_a9ed12f504f4bd101d4746c6.reference || (__cxx_global_cell_a9ed12f504f4bd101d4746c6.reference = {
    __cReference: true,
    get value() { return g_errorCnt; },
    set value(__cxx_lvalue_0) { g_errorCnt = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/gamedef.cpp:98
export let g_warningCnt = 0;
export function __cxx_global_cell_778291b6375dd09957e56c1b() {
  return __cxx_global_cell_778291b6375dd09957e56c1b.reference || (__cxx_global_cell_778291b6375dd09957e56c1b.reference = {
    __cReference: true,
    get value() { return g_warningCnt; },
    set value(__cxx_lvalue_0) { g_warningCnt = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/gamedef.cpp:99
export let g_numXStrings = 0;
export function __cxx_global_cell_5cd4a87da022e338050a0e30() {
  return __cxx_global_cell_5cd4a87da022e338050a0e30.reference || (__cxx_global_cell_5cd4a87da022e338050a0e30.reference = {
    __cReference: true,
    get value() { return g_numXStrings; },
    set value(__cxx_lvalue_0) { g_numXStrings = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/gamedef.cpp:101
export let vmoffset = null;
export function __cxx_global_cell_781692351a9d53402cd867ca() {
  return __cxx_global_cell_781692351a9d53402cd867ca.reference || (__cxx_global_cell_781692351a9d53402cd867ca.reference = {
    __cReference: true,
    get value() { return vmoffset; },
    set value(__cxx_lvalue_0) { vmoffset = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/duke3d/src/gamedef.cpp:133
export let h_keywords = cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"prime": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "Uint32Array", "offset": 0, "size": 4}, "more": {"native": "Uint8Array", "offset": 4, "size": 1}}, "overlaps": false, "size": 5, "union": false}, "offset": 4}, "v": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "size": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "items": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": true, "size": 24, "union": false}, {"__cxx_anonymous_0": cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"prime": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "Uint32Array", "offset": 0, "size": 4}, "more": {"native": "Uint8Array", "offset": 4, "size": 1}}, "overlaps": false, "size": 5, "union": false}, "offset": 4}, "v": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "size": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": true, "size": 12, "union": true}, {"size": u32(i32((i32(448) >> 1)))}, null, {}), "items": null}, null, {});
function __cxx_static_address_d49b43ec9df2e70e05088d24() {
  return __cxx_static_address_d49b43ec9df2e70e05088d24.reference || (__cxx_static_address_d49b43ec9df2e70e05088d24.reference = {
    __cReference: true,
    get value() { return h_keywords; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/gamedef.cpp:134
export let h_iter = cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"prime": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "Uint32Array", "offset": 0, "size": 4}, "more": {"native": "Uint8Array", "offset": 4, "size": 1}}, "overlaps": false, "size": 5, "union": false}, "offset": 4}, "v": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "size": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "items": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": true, "size": 24, "union": false}, {"__cxx_anonymous_0": cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"prime": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "Uint32Array", "offset": 0, "size": 4}, "more": {"native": "Uint8Array", "offset": 4, "size": 1}}, "overlaps": false, "size": 5, "union": false}, "offset": 4}, "v": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "size": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": true, "size": 12, "union": true}, {"size": u32(i32((i32(12) >> 1)))}, null, {}), "items": null}, null, {});
function __cxx_static_address_7d62d0a0be2f41b3d20f464b() {
  return __cxx_static_address_7d62d0a0be2f41b3d20f464b.reference || (__cxx_static_address_7d62d0a0be2f41b3d20f464b.reference = {
    __cReference: true,
    get value() { return h_iter; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/gamedef.cpp:136
export let tables = cPointerArray(5, [__cxx_global_cell_f0457d06edefc3c775e2c32f(), __cxx_global_cell_2d12a4ce62b5a2309382b8ea(), __cxx_static_address_7d62d0a0be2f41b3d20f464b(), __cxx_static_address_d49b43ec9df2e70e05088d24(), __cxx_global_cell_d4103f960bb678857722381c()]);
function __cxx_static_address_67f5e09b9dfb8162d8a4a893() {
  return __cxx_static_address_67f5e09b9dfb8162d8a4a893.reference || (__cxx_static_address_67f5e09b9dfb8162d8a4a893.reference = {
    __cReference: true,
    get value() { return tables; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/gamedef.cpp:144
export let tables_free = cPointerArray(2, [__cxx_static_address_7d62d0a0be2f41b3d20f464b(), __cxx_static_address_d49b43ec9df2e70e05088d24()]);
function __cxx_static_address_1adc4e32938e0c017e5b3c51() {
  return __cxx_static_address_1adc4e32938e0c017e5b3c51.reference || (__cxx_static_address_1adc4e32938e0c017e5b3c51.reference = {
    __cReference: true,
    get value() { return tables_free; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/gamedef.cpp:149
export const vm_keywords = cByteRecordNDArray({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, [516], {}, [cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([97, 99, 116, 105, 111, 110, 0]), "val": i32(105)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([97, 99, 116, 105, 118, 97, 116, 101, 0]), "val": i32(395)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([97, 99, 116, 105, 118, 97, 116, 101, 98, 121, 115, 101, 99, 116, 111, 114, 0]), "val": i32(106)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([97, 99, 116, 105, 118, 97, 116, 101, 99, 104, 101, 97, 116, 0]), "val": i32(107)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([97, 99, 116, 111, 114, 0]), "val": i32(396)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([97, 99, 116, 111, 114, 115, 111, 117, 110, 100, 0]), "val": i32(108)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([97, 100, 100, 97, 109, 109, 111, 0]), "val": i32(109)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([97, 100, 100, 105, 110, 118, 101, 110, 116, 111, 114, 121, 0]), "val": i32(110)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([97, 100, 100, 107, 105, 108, 108, 115, 0]), "val": i32(111)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([97, 100, 100, 108, 111, 103, 0]), "val": i32(112)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([97, 100, 100, 108, 111, 103, 118, 97, 114, 0]), "val": i32(112)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([97, 100, 100, 112, 104, 101, 97, 108, 116, 104, 0]), "val": i32(113)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([97, 100, 100, 115, 116, 114, 101, 110, 103, 116, 104, 0]), "val": i32(114)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([97, 100, 100, 118, 97, 114, 0]), "val": i32(48)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([97, 100, 100, 118, 97, 114, 118, 97, 114, 0]), "val": i32(18)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([97, 100, 100, 119, 101, 97, 112, 111, 110, 0]), "val": i32(115)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([97, 100, 100, 119, 101, 97, 112, 111, 110, 118, 97, 114, 0]), "val": i32(115)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([97, 105, 0]), "val": i32(116)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([97, 110, 100, 118, 97, 114, 0]), "val": i32(49)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([97, 110, 100, 118, 97, 114, 118, 97, 114, 0]), "val": i32(19)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([97, 110, 103, 111, 102, 102, 0]), "val": i32(117)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([97, 110, 103, 111, 102, 102, 118, 97, 114, 0]), "val": i32(117)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([97, 112, 112, 101, 110, 100, 101, 118, 101, 110, 116, 0]), "val": i32(397)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([97, 112, 112, 101, 110, 100, 115, 116, 97, 116, 101, 0]), "val": i32(398)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([98, 101, 116, 97, 110, 97, 109, 101, 0]), "val": i32(399)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([98, 114, 101, 97, 107, 0]), "val": i32(118)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([99, 97, 99, 116, 111, 114, 0]), "val": i32(119)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([99, 97, 108, 99, 104, 121, 112, 111, 116, 101, 110, 117, 115, 101, 0]), "val": i32(120)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([99, 97, 110, 115, 101, 101, 0]), "val": i32(121)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([99, 97, 110, 115, 101, 101, 115, 112, 114, 0]), "val": i32(122)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([99, 97, 112, 105, 97, 0]), "val": i32(123)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([99, 97, 112, 105, 115, 0]), "val": i32(124)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([99, 97, 115, 101, 0]), "val": i32(400)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([99, 104, 97, 110, 103, 101, 115, 112, 114, 105, 116, 101, 115, 101, 99, 116, 0]), "val": i32(125)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([99, 104, 97, 110, 103, 101, 115, 112, 114, 105, 116, 101, 115, 116, 97, 116, 0]), "val": i32(126)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([99, 104, 101, 97, 116, 107, 101, 121, 115, 0]), "val": i32(401)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([99, 104, 101, 99, 107, 97, 99, 116, 105, 118, 97, 116, 111, 114, 109, 111, 116, 105, 111, 110, 0]), "val": i32(127)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([99, 104, 101, 99, 107, 97, 118, 97, 105, 108, 105, 110, 118, 101, 110, 0]), "val": i32(128)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([99, 104, 101, 99, 107, 97, 118, 97, 105, 108, 119, 101, 97, 112, 111, 110, 0]), "val": i32(129)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([99, 108, 97, 109, 112, 0]), "val": i32(130)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([99, 108, 101, 97, 114, 109, 97, 112, 115, 116, 97, 116, 101, 0]), "val": i32(131)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([99, 108, 105, 112, 100, 105, 115, 116, 0]), "val": i32(132)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([99, 108, 105, 112, 109, 111, 118, 101, 0]), "val": i32(133)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([99, 108, 105, 112, 109, 111, 118, 101, 110, 111, 115, 108, 105, 100, 101, 0]), "val": i32(134)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([99, 109, 101, 110, 117, 0]), "val": i32(135)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([99, 111, 110, 116, 105, 110, 117, 101, 0]), "val": i32(402)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([99, 111, 112, 121, 0]), "val": i32(136)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([99, 111, 115, 0]), "val": i32(137)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([99, 111, 117, 110, 116, 0]), "val": i32(138)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([99, 115, 116, 97, 116, 0]), "val": i32(139)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([99, 115, 116, 97, 116, 111, 114, 0]), "val": i32(140)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([100, 97, 109, 97, 103, 101, 101, 118, 101, 110, 116, 116, 105, 108, 101, 0]), "val": i32(403)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([100, 97, 109, 97, 103, 101, 101, 118, 101, 110, 116, 116, 105, 108, 101, 114, 97, 110, 103, 101, 0]), "val": i32(404)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([100, 101, 98, 114, 105, 115, 0]), "val": i32(141)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([100, 101, 98, 117, 103, 0]), "val": i32(142)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([100, 101, 102, 97, 117, 108, 116, 0]), "val": i32(405)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([100, 101, 102, 105, 110, 101, 0]), "val": i32(406)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([100, 101, 102, 105, 110, 101, 99, 104, 101, 97, 116, 0]), "val": i32(407)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([100, 101, 102, 105, 110, 101, 99, 104, 101, 97, 116, 100, 101, 115, 99, 114, 105, 112, 116, 105, 111, 110, 0]), "val": i32(408)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([100, 101, 102, 105, 110, 101, 103, 97, 109, 101, 102, 117, 110, 99, 110, 97, 109, 101, 0]), "val": i32(409)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([100, 101, 102, 105, 110, 101, 103, 97, 109, 101, 116, 121, 112, 101, 0]), "val": i32(410)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([100, 101, 102, 105, 110, 101, 108, 101, 118, 101, 108, 110, 97, 109, 101, 0]), "val": i32(411)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([100, 101, 102, 105, 110, 101, 112, 114, 111, 106, 101, 99, 116, 105, 108, 101, 0]), "val": i32(412)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([100, 101, 102, 105, 110, 101, 113, 117, 111, 116, 101, 0]), "val": i32(413)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([100, 101, 102, 105, 110, 101, 115, 107, 105, 108, 108, 110, 97, 109, 101, 0]), "val": i32(414)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([100, 101, 102, 105, 110, 101, 115, 111, 117, 110, 100, 0]), "val": i32(415)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([100, 101, 102, 105, 110, 101, 118, 111, 108, 117, 109, 101, 102, 108, 97, 103, 115, 0]), "val": i32(416)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([100, 101, 102, 105, 110, 101, 118, 111, 108, 117, 109, 101, 110, 97, 109, 101, 0]), "val": i32(417)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([100, 101, 102, 115, 116, 97, 116, 101, 0]), "val": i32(418)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([100, 105, 103, 105, 116, 97, 108, 110, 117, 109, 98, 101, 114, 0]), "val": i32(143)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([100, 105, 103, 105, 116, 97, 108, 110, 117, 109, 98, 101, 114, 122, 0]), "val": i32(144)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([100, 105, 115, 112, 108, 97, 121, 114, 97, 110, 100, 0]), "val": i32(145)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([100, 105, 115, 112, 108, 97, 121, 114, 97, 110, 100, 118, 97, 114, 0]), "val": i32(150)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([100, 105, 115, 112, 108, 97, 121, 114, 97, 110, 100, 118, 97, 114, 118, 97, 114, 0]), "val": i32(151)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([100, 105, 115, 116, 0]), "val": i32(146)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([100, 105, 118, 114, 0]), "val": i32(147)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([100, 105, 118, 114, 100, 0]), "val": i32(20)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([100, 105, 118, 114, 117, 0]), "val": i32(148)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([100, 105, 118, 115, 99, 97, 108, 101, 0]), "val": i32(149)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([100, 105, 118, 118, 97, 114, 0]), "val": i32(50)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([100, 105, 118, 118, 97, 114, 118, 97, 114, 0]), "val": i32(20)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([100, 114, 97, 103, 112, 111, 105, 110, 116, 0]), "val": i32(152)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([100, 114, 97, 119, 108, 105, 110, 101, 50, 53, 54, 0]), "val": i32(153)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([100, 114, 97, 119, 108, 105, 110, 101, 114, 103, 98, 0]), "val": i32(154)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([100, 121, 110, 97, 109, 105, 99, 114, 101, 109, 97, 112, 0]), "val": i32(419)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([100, 121, 110, 97, 109, 105, 99, 115, 111, 117, 110, 100, 114, 101, 109, 97, 112, 0]), "val": i32(420)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([101, 99, 104, 111, 0]), "val": i32(155)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([101, 108, 115, 101, 0]), "val": i32(63)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([101, 110, 100, 97, 0]), "val": i32(64)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([101, 110, 100, 101, 118, 101, 110, 116, 0]), "val": i32(65)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([101, 110, 100, 111, 102, 103, 97, 109, 101, 0]), "val": i32(156)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([101, 110, 100, 111, 102, 108, 101, 118, 101, 108, 0]), "val": i32(157)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([101, 110, 100, 115, 0]), "val": i32(66)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([101, 110, 100, 115, 119, 105, 116, 99, 104, 0]), "val": i32(67)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([101, 110, 104, 97, 110, 99, 101, 100, 0]), "val": i32(421)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([101, 113, 115, 112, 97, 119, 110, 118, 97, 114, 0]), "val": i32(158)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([101, 115, 104, 111, 111, 116, 118, 97, 114, 0]), "val": i32(159)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([101, 115, 112, 97, 119, 110, 118, 97, 114, 0]), "val": i32(160)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([101, 118, 101, 110, 116, 108, 111, 97, 100, 97, 99, 116, 111, 114, 0]), "val": i32(422)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([101, 120, 105, 116, 0]), "val": i32(161)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([101, 122, 115, 104, 111, 111, 116, 118, 97, 114, 0]), "val": i32(162)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([102, 97, 108, 108, 0]), "val": i32(163)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([102, 105, 110, 100, 110, 101, 97, 114, 97, 99, 116, 111, 114, 51, 100, 118, 97, 114, 0]), "val": i32(165)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([102, 105, 110, 100, 110, 101, 97, 114, 97, 99, 116, 111, 114, 118, 97, 114, 0]), "val": i32(164)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([102, 105, 110, 100, 110, 101, 97, 114, 97, 99, 116, 111, 114, 122, 118, 97, 114, 0]), "val": i32(166)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([102, 105, 110, 100, 110, 101, 97, 114, 115, 112, 114, 105, 116, 101, 51, 100, 118, 97, 114, 0]), "val": i32(168)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([102, 105, 110, 100, 110, 101, 97, 114, 115, 112, 114, 105, 116, 101, 118, 97, 114, 0]), "val": i32(167)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([102, 105, 110, 100, 110, 101, 97, 114, 115, 112, 114, 105, 116, 101, 122, 118, 97, 114, 0]), "val": i32(169)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([102, 105, 110, 100, 111, 116, 104, 101, 114, 112, 108, 97, 121, 101, 114, 0]), "val": i32(170)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([102, 105, 110, 100, 112, 108, 97, 121, 101, 114, 0]), "val": i32(171)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([102, 108, 97, 115, 104, 0]), "val": i32(172)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([102, 111, 114, 0]), "val": i32(173)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([103, 97, 109, 101, 97, 114, 114, 97, 121, 0]), "val": i32(423)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([103, 97, 109, 101, 115, 116, 97, 114, 116, 117, 112, 0]), "val": i32(424)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([103, 97, 109, 101, 116, 101, 120, 116, 0]), "val": i32(174)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([103, 97, 109, 101, 116, 101, 120, 116, 122, 0]), "val": i32(175)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([103, 97, 109, 101, 118, 97, 114, 0]), "val": i32(425)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([103, 101, 116, 97, 99, 116, 111, 114, 0]), "val": i32(89)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([103, 101, 116, 97, 99, 116, 111, 114, 97, 110, 103, 108, 101, 0]), "val": i32(176)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([103, 101, 116, 97, 99, 116, 111, 114, 118, 97, 114, 0]), "val": i32(91)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([103, 101, 116, 97, 110, 103, 108, 101, 0]), "val": i32(92)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([103, 101, 116, 97, 110, 103, 108, 101, 116, 111, 116, 97, 114, 103, 101, 116, 0]), "val": i32(177)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([103, 101, 116, 97, 114, 114, 97, 121, 115, 101, 113, 117, 101, 110, 99, 101, 0]), "val": i32(178)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([103, 101, 116, 97, 114, 114, 97, 121, 115, 105, 122, 101, 0]), "val": i32(179)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([103, 101, 116, 99, 101, 105, 108, 122, 111, 102, 115, 108, 111, 112, 101, 0]), "val": i32(180)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([103, 101, 116, 99, 108, 111, 115, 101, 115, 116, 99, 111, 108, 0]), "val": i32(181)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([103, 101, 116, 99, 117, 114, 114, 97, 100, 100, 114, 101, 115, 115, 0]), "val": i32(182)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([103, 101, 116, 102, 108, 111, 114, 122, 111, 102, 115, 108, 111, 112, 101, 0]), "val": i32(183)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([103, 101, 116, 103, 97, 109, 101, 102, 117, 110, 99, 98, 105, 110, 100, 0]), "val": i32(184)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([103, 101, 116, 105, 110, 99, 97, 110, 103, 108, 101, 0]), "val": i32(185)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([103, 101, 116, 105, 110, 112, 117, 116, 0]), "val": i32(186)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([103, 101, 116, 107, 101, 121, 110, 97, 109, 101, 0]), "val": i32(187)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([103, 101, 116, 108, 97, 115, 116, 112, 97, 108, 0]), "val": i32(188)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([103, 101, 116, 109, 117, 115, 105, 99, 112, 111, 115, 105, 116, 105, 111, 110, 0]), "val": i32(189)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([103, 101, 116, 110, 103, 99, 102, 108, 97, 103, 115, 0]), "val": i32(190)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([103, 101, 116, 112, 108, 97, 121, 101, 114, 0]), "val": i32(93)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([103, 101, 116, 112, 108, 97, 121, 101, 114, 97, 110, 103, 108, 101, 0]), "val": i32(191)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([103, 101, 116, 112, 108, 97, 121, 101, 114, 118, 97, 114, 0]), "val": i32(95)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([103, 101, 116, 112, 110, 97, 109, 101, 0]), "val": i32(192)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([103, 101, 116, 112, 114, 111, 106, 101, 99, 116, 105, 108, 101, 0]), "val": i32(96)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([103, 101, 116, 115, 101, 99, 116, 111, 114, 0]), "val": i32(97)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([103, 101, 116, 116, 101, 120, 116, 117, 114, 101, 99, 101, 105, 108, 105, 110, 103, 0]), "val": i32(193)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([103, 101, 116, 116, 101, 120, 116, 117, 114, 101, 102, 108, 111, 111, 114, 0]), "val": i32(194)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([103, 101, 116, 116, 104, 105, 115, 112, 114, 111, 106, 101, 99, 116, 105, 108, 101, 0]), "val": i32(195)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([103, 101, 116, 116, 105, 99, 107, 115, 0]), "val": i32(196)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([103, 101, 116, 116, 105, 108, 101, 100, 97, 116, 97, 0]), "val": i32(197)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([103, 101, 116, 116, 105, 109, 101, 100, 97, 116, 101, 0]), "val": i32(198)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([103, 101, 116, 116, 115, 112, 114, 0]), "val": i32(101)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([103, 101, 116, 117, 115, 101, 114, 100, 101, 102, 0]), "val": i32(102)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([103, 101, 116, 119, 97, 108, 108, 0]), "val": i32(103)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([103, 101, 116, 122, 114, 97, 110, 103, 101, 0]), "val": i32(199)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([103, 108, 111, 98, 97, 108, 115, 111, 117, 110, 100, 0]), "val": i32(200)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([103, 108, 111, 98, 97, 108, 115, 111, 117, 110, 100, 118, 97, 114, 0]), "val": i32(200)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([103, 109, 97, 120, 97, 109, 109, 111, 0]), "val": i32(201)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([103, 117, 110, 105, 113, 104, 117, 100, 105, 100, 0]), "val": i32(202)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([103, 117, 116, 115, 0]), "val": i32(203)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([104, 101, 97, 100, 115, 112, 114, 105, 116, 101, 115, 101, 99, 116, 0]), "val": i32(204)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([104, 101, 97, 100, 115, 112, 114, 105, 116, 101, 115, 116, 97, 116, 0]), "val": i32(205)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([104, 105, 116, 114, 97, 100, 105, 117, 115, 0]), "val": i32(206)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([104, 105, 116, 114, 97, 100, 105, 117, 115, 118, 97, 114, 0]), "val": i32(206)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([104, 105, 116, 115, 99, 97, 110, 0]), "val": i32(207)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 97, 99, 116, 105, 111, 110, 0]), "val": i32(208)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 97, 99, 116, 105, 111, 110, 99, 111, 117, 110, 116, 0]), "val": i32(209)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 97, 99, 116, 111, 114, 0]), "val": i32(210)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 97, 99, 116, 111, 114, 110, 111, 116, 115, 116, 97, 121, 112, 117, 116, 0]), "val": i32(211)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 97, 99, 116, 111, 114, 115, 111, 117, 110, 100, 0]), "val": i32(212)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 97, 105, 0]), "val": i32(213)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 97, 110, 103, 100, 105, 102, 102, 108, 0]), "val": i32(214)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 97, 119, 97, 121, 102, 114, 111, 109, 119, 97, 108, 108, 0]), "val": i32(215)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 98, 117, 108, 108, 101, 116, 110, 101, 97, 114, 0]), "val": i32(216)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 99, 97, 110, 115, 101, 101, 0]), "val": i32(217)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 99, 97, 110, 115, 101, 101, 116, 97, 114, 103, 101, 116, 0]), "val": i32(218)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 99, 97, 110, 115, 104, 111, 111, 116, 116, 97, 114, 103, 101, 116, 0]), "val": i32(219)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 99, 101, 105, 108, 105, 110, 103, 100, 105, 115, 116, 108, 0]), "val": i32(220)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 99, 108, 105, 101, 110, 116, 0]), "val": i32(221)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 99, 111, 117, 110, 116, 0]), "val": i32(222)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 99, 117, 116, 115, 99, 101, 110, 101, 0]), "val": i32(223)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 100, 101, 97, 100, 0]), "val": i32(224)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 102, 108, 111, 111, 114, 100, 105, 115, 116, 108, 0]), "val": i32(225)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 103, 97, 112, 122, 108, 0]), "val": i32(226)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 103, 111, 116, 119, 101, 97, 112, 111, 110, 99, 101, 0]), "val": i32(227)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 104, 105, 116, 115, 112, 97, 99, 101, 0]), "val": i32(228)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 104, 105, 116, 119, 101, 97, 112, 111, 110, 0]), "val": i32(229)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 105, 110, 111, 117, 116, 101, 114, 115, 112, 97, 99, 101, 0]), "val": i32(230)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 105, 110, 115, 112, 97, 99, 101, 0]), "val": i32(231)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 105, 110, 119, 97, 116, 101, 114, 0]), "val": i32(232)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 109, 111, 118, 101, 0]), "val": i32(233)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 109, 117, 108, 116, 105, 112, 108, 97, 121, 101, 114, 0]), "val": i32(234)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 110, 111, 115, 111, 117, 110, 100, 115, 0]), "val": i32(235)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 110, 111, 116, 109, 111, 118, 105, 110, 103, 0]), "val": i32(236)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 111, 110, 119, 97, 116, 101, 114, 0]), "val": i32(237)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 111, 117, 116, 115, 105, 100, 101, 0]), "val": i32(238)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 112, 0]), "val": i32(239)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 112, 100, 105, 115, 116, 103, 0]), "val": i32(240)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 112, 100, 105, 115, 116, 108, 0]), "val": i32(241)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 112, 104, 101, 97, 108, 116, 104, 108, 0]), "val": i32(242)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 112, 105, 110, 118, 101, 110, 116, 111, 114, 121, 0]), "val": i32(243)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 112, 108, 97, 121, 98, 97, 99, 107, 111, 110, 0]), "val": i32(244)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 112, 108, 97, 121, 101, 114, 115, 108, 0]), "val": i32(245)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 114, 101, 115, 112, 97, 119, 110, 0]), "val": i32(246)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 114, 110, 100, 0]), "val": i32(247)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 115, 101, 114, 118, 101, 114, 0]), "val": i32(248)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 115, 111, 117, 110, 100, 0]), "val": i32(249)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 115, 112, 97, 119, 110, 101, 100, 98, 121, 0]), "val": i32(250)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 115, 112, 114, 105, 116, 101, 112, 97, 108, 0]), "val": i32(251)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 115, 113, 117, 105, 115, 104, 101, 100, 0]), "val": i32(252)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 115, 116, 114, 101, 110, 103, 116, 104, 0]), "val": i32(253)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 118, 97, 114, 97, 0]), "val": i32(33)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 118, 97, 114, 97, 101, 0]), "val": i32(34)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 118, 97, 114, 97, 110, 100, 0]), "val": i32(35)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 118, 97, 114, 98, 0]), "val": i32(36)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 118, 97, 114, 98, 101, 0]), "val": i32(37)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 118, 97, 114, 98, 111, 116, 104, 0]), "val": i32(38)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 118, 97, 114, 101, 0]), "val": i32(39)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 118, 97, 114, 101, 105, 116, 104, 101, 114, 0]), "val": i32(40)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 118, 97, 114, 103, 0]), "val": i32(41)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 118, 97, 114, 103, 101, 0]), "val": i32(42)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 118, 97, 114, 108, 0]), "val": i32(43)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 118, 97, 114, 108, 101, 0]), "val": i32(44)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 118, 97, 114, 110, 0]), "val": i32(45)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 118, 97, 114, 111, 114, 0]), "val": i32(46)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 118, 97, 114, 118, 97, 114, 97, 0]), "val": i32(3)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 118, 97, 114, 118, 97, 114, 97, 101, 0]), "val": i32(4)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 118, 97, 114, 118, 97, 114, 97, 110, 100, 0]), "val": i32(5)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 118, 97, 114, 118, 97, 114, 98, 0]), "val": i32(6)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 118, 97, 114, 118, 97, 114, 98, 101, 0]), "val": i32(7)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 118, 97, 114, 118, 97, 114, 98, 111, 116, 104, 0]), "val": i32(8)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 118, 97, 114, 118, 97, 114, 101, 0]), "val": i32(9)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 118, 97, 114, 118, 97, 114, 101, 105, 116, 104, 101, 114, 0]), "val": i32(10)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 118, 97, 114, 118, 97, 114, 103, 0]), "val": i32(11)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 118, 97, 114, 118, 97, 114, 103, 101, 0]), "val": i32(12)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 118, 97, 114, 118, 97, 114, 108, 0]), "val": i32(13)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 118, 97, 114, 118, 97, 114, 108, 101, 0]), "val": i32(14)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 118, 97, 114, 118, 97, 114, 110, 0]), "val": i32(15)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 118, 97, 114, 118, 97, 114, 111, 114, 0]), "val": i32(16)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 118, 97, 114, 118, 97, 114, 120, 111, 114, 0]), "val": i32(17)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 118, 97, 114, 120, 111, 114, 0]), "val": i32(47)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 119, 97, 115, 119, 101, 97, 112, 111, 110, 0]), "val": i32(254)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 110, 99, 108, 117, 100, 101, 0]), "val": i32(426)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 110, 99, 108, 117, 100, 101, 100, 101, 102, 97, 117, 108, 116, 0]), "val": i32(427)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 110, 99, 108, 117, 100, 101, 111, 112, 116, 105, 111, 110, 97, 108, 0]), "val": i32(428)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 110, 105, 116, 116, 105, 109, 101, 114, 0]), "val": i32(255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 110, 115, 101, 114, 116, 115, 112, 114, 105, 116, 101, 113, 0]), "val": i32(256)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 110, 118, 0]), "val": i32(257)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([106, 117, 109, 112, 0]), "val": i32(258)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([107, 105, 108, 108, 105, 116, 0]), "val": i32(259)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([107, 108, 97, 98, 115, 0]), "val": i32(260)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([108, 100, 105, 115, 116, 0]), "val": i32(261)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([108, 105, 110, 101, 105, 110, 116, 101, 114, 115, 101, 99, 116, 0]), "val": i32(262)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([108, 111, 97, 100, 109, 97, 112, 115, 116, 97, 116, 101, 0]), "val": i32(263)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([108, 111, 99, 107, 112, 108, 97, 121, 101, 114, 0]), "val": i32(264)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([108, 111, 116, 115, 111, 102, 103, 108, 97, 115, 115, 0]), "val": i32(265)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([109, 97, 105, 108, 0]), "val": i32(266)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([109, 105, 107, 101, 115, 110, 100, 0]), "val": i32(267)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([109, 105, 110, 105, 116, 101, 120, 116, 0]), "val": i32(268)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([109, 111, 100, 118, 97, 114, 0]), "val": i32(51)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([109, 111, 100, 118, 97, 114, 118, 97, 114, 0]), "val": i32(21)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([109, 111, 110, 101, 121, 0]), "val": i32(269)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([109, 111, 118, 101, 0]), "val": i32(270)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([109, 111, 118, 101, 115, 101, 99, 116, 111, 114, 0]), "val": i32(271)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([109, 111, 118, 101, 115, 112, 114, 105, 116, 101, 0]), "val": i32(272)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([109, 117, 108, 115, 99, 97, 108, 101, 0]), "val": i32(273)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([109, 117, 108, 118, 97, 114, 0]), "val": i32(52)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([109, 117, 108, 118, 97, 114, 118, 97, 114, 0]), "val": i32(22)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([109, 117, 115, 105, 99, 0]), "val": i32(429)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([109, 121, 111, 115, 0]), "val": i32(274)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([109, 121, 111, 115, 112, 97, 108, 0]), "val": i32(275)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([109, 121, 111, 115, 112, 97, 108, 120, 0]), "val": i32(276)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([109, 121, 111, 115, 120, 0]), "val": i32(277)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([110, 101, 97, 114, 116, 97, 103, 0]), "val": i32(278)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([110, 101, 120, 116, 115, 101, 99, 116, 111, 114, 110, 101, 105, 103, 104, 98, 111, 114, 122, 0]), "val": i32(279)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([110, 101, 120, 116, 115, 112, 114, 105, 116, 101, 115, 101, 99, 116, 0]), "val": i32(280)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([110, 101, 120, 116, 115, 112, 114, 105, 116, 101, 115, 116, 97, 116, 0]), "val": i32(281)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([110, 117, 108, 108, 111, 112, 0]), "val": i32(282)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([111, 110, 101, 118, 101, 110, 116, 0]), "val": i32(430)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([111, 112, 101, 114, 97, 116, 101, 0]), "val": i32(283)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([111, 112, 101, 114, 97, 116, 101, 97, 99, 116, 105, 118, 97, 116, 111, 114, 115, 0]), "val": i32(284)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([111, 112, 101, 114, 97, 116, 101, 109, 97, 115, 116, 101, 114, 115, 119, 105, 116, 99, 104, 101, 115, 0]), "val": i32(285)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([111, 112, 101, 114, 97, 116, 101, 114, 101, 115, 112, 97, 119, 110, 115, 0]), "val": i32(286)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([111, 112, 101, 114, 97, 116, 101, 115, 101, 99, 116, 111, 114, 115, 0]), "val": i32(287)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([111, 114, 118, 97, 114, 0]), "val": i32(53)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([111, 114, 118, 97, 114, 118, 97, 114, 0]), "val": i32(23)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([112, 97, 108, 102, 114, 111, 109, 0]), "val": i32(288)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([112, 97, 112, 101, 114, 0]), "val": i32(289)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([112, 107, 105, 99, 107, 0]), "val": i32(290)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([112, 114, 101, 99, 97, 99, 104, 101, 0]), "val": i32(431)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([112, 114, 101, 112, 101, 110, 100, 115, 116, 97, 116, 101, 0]), "val": i32(432)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([112, 114, 101, 118, 115, 112, 114, 105, 116, 101, 115, 101, 99, 116, 0]), "val": i32(292)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([112, 114, 101, 118, 115, 112, 114, 105, 116, 101, 115, 116, 97, 116, 0]), "val": i32(293)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([112, 114, 101, 108, 111, 97, 100, 116, 114, 97, 99, 107, 115, 108, 111, 116, 102, 111, 114, 115, 119, 97, 112, 0]), "val": i32(291)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([112, 115, 116, 111, 109, 112, 0]), "val": i32(294)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([113, 103, 101, 116, 115, 121, 115, 115, 116, 114, 0]), "val": i32(295)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([113, 115, 112, 97, 119, 110, 118, 97, 114, 0]), "val": i32(296)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([113, 115, 112, 114, 105, 110, 116, 102, 0]), "val": i32(297)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([113, 115, 116, 114, 99, 97, 116, 0]), "val": i32(298)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([113, 115, 116, 114, 99, 109, 112, 0]), "val": i32(299)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([113, 115, 116, 114, 99, 112, 121, 0]), "val": i32(300)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([113, 115, 116, 114, 100, 105, 109, 0]), "val": i32(301)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([113, 115, 116, 114, 108, 101, 110, 0]), "val": i32(302)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([113, 115, 116, 114, 110, 99, 97, 116, 0]), "val": i32(303)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([113, 115, 117, 98, 115, 116, 114, 0]), "val": i32(304)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([113, 117, 97, 107, 101, 0]), "val": i32(305)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([113, 117, 111, 116, 101, 0]), "val": i32(306)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([114, 97, 110, 100, 118, 97, 114, 0]), "val": i32(54)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([114, 97, 110, 100, 118, 97, 114, 118, 97, 114, 0]), "val": i32(24)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([114, 97, 121, 105, 110, 116, 101, 114, 115, 101, 99, 116, 0]), "val": i32(307)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([114, 101, 97, 100, 97, 114, 114, 97, 121, 102, 114, 111, 109, 102, 105, 108, 101, 0]), "val": i32(308)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([114, 101, 97, 100, 103, 97, 109, 101, 118, 97, 114, 0]), "val": i32(309)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([114, 101, 100, 101, 102, 105, 110, 101, 113, 117, 111, 116, 101, 0]), "val": i32(310)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([114, 101, 115, 101, 116, 97, 99, 116, 105, 111, 110, 99, 111, 117, 110, 116, 0]), "val": i32(311)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([114, 101, 115, 101, 116, 99, 111, 117, 110, 116, 0]), "val": i32(312)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([114, 101, 115, 101, 116, 112, 108, 97, 121, 101, 114, 0]), "val": i32(313)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([114, 101, 115, 101, 116, 112, 108, 97, 121, 101, 114, 102, 108, 97, 103, 115, 0]), "val": i32(314)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([114, 101, 115, 105, 122, 101, 97, 114, 114, 97, 121, 0]), "val": i32(315)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([114, 101, 115, 112, 97, 119, 110, 104, 105, 116, 97, 103, 0]), "val": i32(316)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([114, 101, 116, 117, 114, 110, 0]), "val": i32(317)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([114, 111, 116, 97, 116, 101, 112, 111, 105, 110, 116, 0]), "val": i32(318)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([114, 111, 116, 97, 116, 101, 115, 112, 114, 105, 116, 101, 0]), "val": i32(319)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([114, 111, 116, 97, 116, 101, 115, 112, 114, 105, 116, 101, 49, 54, 0]), "val": i32(320)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([114, 111, 116, 97, 116, 101, 115, 112, 114, 105, 116, 101, 97, 0]), "val": i32(321)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 97, 118, 101, 0]), "val": i32(322)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 97, 118, 101, 103, 97, 109, 101, 118, 97, 114, 0]), "val": i32(323)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 97, 118, 101, 109, 97, 112, 115, 116, 97, 116, 101, 0]), "val": i32(324)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 97, 118, 101, 110, 110, 0]), "val": i32(325)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 99, 97, 108, 101, 118, 97, 114, 0]), "val": i32(326)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 99, 114, 101, 101, 110, 112, 97, 108, 0]), "val": i32(327)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 99, 114, 101, 101, 110, 115, 111, 117, 110, 100, 0]), "val": i32(328)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 99, 114, 101, 101, 110, 116, 101, 120, 116, 0]), "val": i32(329)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 99, 114, 105, 112, 116, 115, 105, 122, 101, 0]), "val": i32(433)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 101, 99, 116, 99, 108, 101, 97, 114, 105, 110, 116, 101, 114, 112, 111, 108, 97, 116, 105, 111, 110, 0]), "val": i32(330)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 101, 99, 116, 103, 101, 116, 104, 105, 116, 97, 103, 0]), "val": i32(331)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 101, 99, 116, 103, 101, 116, 108, 111, 116, 97, 103, 0]), "val": i32(332)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 101, 99, 116, 111, 114, 111, 102, 119, 97, 108, 108, 0]), "val": i32(333)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 101, 99, 116, 115, 101, 116, 105, 110, 116, 101, 114, 112, 111, 108, 97, 116, 105, 111, 110, 0]), "val": i32(334)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 101, 116, 97, 99, 116, 111, 114, 0]), "val": i32(71)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 101, 116, 97, 99, 116, 111, 114, 97, 110, 103, 108, 101, 0]), "val": i32(335)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 101, 116, 97, 99, 116, 111, 114, 115, 111, 117, 110, 100, 112, 105, 116, 99, 104, 0]), "val": i32(336)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 101, 116, 97, 99, 116, 111, 114, 118, 97, 114, 0]), "val": i32(73)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 101, 116, 97, 114, 114, 97, 121, 0]), "val": i32(74)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 101, 116, 97, 114, 114, 97, 121, 115, 101, 113, 117, 101, 110, 99, 101, 0]), "val": i32(75)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 101, 116, 97, 115, 112, 101, 99, 116, 0]), "val": i32(337)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 101, 116, 99, 102, 103, 110, 97, 109, 101, 0]), "val": i32(434)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 101, 116, 100, 101, 102, 110, 97, 109, 101, 0]), "val": i32(435)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 101, 116, 103, 97, 109, 101, 110, 97, 109, 101, 0]), "val": i32(436)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 101, 116, 103, 97, 109, 101, 112, 97, 108, 101, 116, 116, 101, 0]), "val": i32(338)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 101, 116, 105, 110, 112, 117, 116, 0]), "val": i32(339)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 101, 116, 109, 117, 115, 105, 99, 112, 111, 115, 105, 116, 105, 111, 110, 0]), "val": i32(340)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 101, 116, 110, 103, 99, 102, 108, 97, 103, 115, 0]), "val": i32(341)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 101, 116, 112, 108, 97, 121, 101, 114, 0]), "val": i32(76)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 101, 116, 112, 108, 97, 121, 101, 114, 97, 110, 103, 108, 101, 0]), "val": i32(342)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 101, 116, 112, 108, 97, 121, 101, 114, 118, 97, 114, 0]), "val": i32(78)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 101, 116, 112, 114, 111, 106, 101, 99, 116, 105, 108, 101, 0]), "val": i32(79)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 101, 116, 115, 101, 99, 116, 111, 114, 0]), "val": i32(80)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 101, 116, 115, 112, 114, 105, 116, 101, 0]), "val": i32(343)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 101, 116, 116, 104, 105, 115, 112, 114, 111, 106, 101, 99, 116, 105, 108, 101, 0]), "val": i32(84)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 101, 116, 116, 105, 108, 101, 100, 97, 116, 97, 0]), "val": i32(344)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 101, 116, 116, 115, 112, 114, 0]), "val": i32(85)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 101, 116, 117, 115, 101, 114, 100, 101, 102, 0]), "val": i32(86)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 101, 116, 118, 97, 114, 0]), "val": i32(55)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 101, 116, 118, 97, 114, 118, 97, 114, 0]), "val": i32(25)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 101, 116, 119, 97, 108, 108, 0]), "val": i32(87)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 104, 97, 100, 101, 116, 111, 0]), "val": i32(437)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 104, 105, 102, 116, 118, 97, 114, 108, 0]), "val": i32(56)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 104, 105, 102, 116, 118, 97, 114, 114, 0]), "val": i32(57)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 104, 105, 102, 116, 118, 97, 114, 118, 97, 114, 108, 0]), "val": i32(26)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 104, 105, 102, 116, 118, 97, 114, 118, 97, 114, 114, 0]), "val": i32(27)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 104, 111, 111, 116, 118, 97, 114, 0]), "val": i32(345)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 104, 111, 119, 118, 105, 101, 119, 0]), "val": i32(346)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 104, 111, 119, 118, 105, 101, 119, 117, 110, 98, 105, 97, 115, 101, 100, 0]), "val": i32(349)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 104, 111, 119, 118, 105, 101, 119, 113, 49, 54, 0]), "val": i32(347)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 104, 111, 119, 118, 105, 101, 119, 113, 49, 54, 117, 110, 98, 105, 97, 115, 101, 100, 0]), "val": i32(348)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 105, 110, 0]), "val": i32(350)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 105, 122, 101, 97, 116, 0]), "val": i32(351)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 105, 122, 101, 116, 111, 0]), "val": i32(352)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 108, 101, 101, 112, 116, 105, 109, 101, 0]), "val": i32(353)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 109, 97, 120, 97, 109, 109, 111, 0]), "val": i32(354)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 111, 117, 110, 100, 0]), "val": i32(355)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 111, 117, 110, 100, 111, 110, 99, 101, 0]), "val": i32(356)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 111, 117, 110, 100, 111, 110, 99, 101, 118, 97, 114, 0]), "val": i32(356)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 111, 117, 110, 100, 118, 97, 114, 0]), "val": i32(355)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 112, 97, 119, 110, 0]), "val": i32(357)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 112, 97, 119, 110, 99, 101, 105, 108, 105, 110, 103, 103, 108, 97, 115, 115, 0]), "val": i32(358)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 112, 97, 119, 110, 119, 97, 108, 108, 115, 116, 97, 105, 110, 101, 100, 103, 108, 97, 115, 115, 0]), "val": i32(360)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 112, 97, 119, 110, 119, 97, 108, 108, 103, 108, 97, 115, 115, 0]), "val": i32(359)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 112, 103, 101, 116, 104, 105, 116, 97, 103, 0]), "val": i32(361)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 112, 103, 101, 116, 108, 111, 116, 97, 103, 0]), "val": i32(362)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 112, 114, 105, 116, 101, 102, 108, 97, 103, 115, 0]), "val": i32(363)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 112, 114, 105, 116, 101, 110, 111, 112, 97, 108, 0]), "val": i32(438)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 112, 114, 105, 116, 101, 110, 111, 115, 104, 97, 100, 101, 0]), "val": i32(439)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 112, 114, 105, 116, 101, 110, 118, 103, 0]), "val": i32(440)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 112, 114, 105, 116, 101, 112, 97, 108, 0]), "val": i32(364)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 112, 114, 105, 116, 101, 115, 104, 97, 100, 111, 119, 0]), "val": i32(441)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 113, 114, 116, 0]), "val": i32(365)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 115, 112, 0]), "val": i32(366)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 116, 97, 114, 116, 99, 117, 116, 115, 99, 101, 110, 101, 0]), "val": i32(367)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 116, 97, 114, 116, 108, 101, 118, 101, 108, 0]), "val": i32(368)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 116, 97, 114, 116, 115, 99, 114, 101, 101, 110, 0]), "val": i32(369)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 116, 97, 114, 116, 116, 114, 97, 99, 107, 0]), "val": i32(370)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 116, 97, 114, 116, 116, 114, 97, 99, 107, 115, 108, 111, 116, 0]), "val": i32(371)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 116, 97, 114, 116, 116, 114, 97, 99, 107, 118, 97, 114, 0]), "val": i32(370)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 116, 97, 116, 101, 0]), "val": i32(70)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 116, 111, 112, 97, 99, 116, 111, 114, 115, 111, 117, 110, 100, 0]), "val": i32(372)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 116, 111, 112, 97, 108, 108, 109, 117, 115, 105, 99, 0]), "val": i32(373)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 116, 111, 112, 97, 108, 108, 115, 111, 117, 110, 100, 115, 0]), "val": i32(374)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 116, 111, 112, 115, 111, 117, 110, 100, 0]), "val": i32(375)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 116, 111, 112, 115, 111, 117, 110, 100, 118, 97, 114, 0]), "val": i32(375)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 116, 114, 101, 110, 103, 116, 104, 0]), "val": i32(376)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 117, 98, 118, 97, 114, 0]), "val": i32(58)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 117, 98, 118, 97, 114, 118, 97, 114, 0]), "val": i32(28)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 119, 105, 116, 99, 104, 0]), "val": i32(379)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 119, 97, 112, 97, 114, 114, 97, 121, 115, 0]), "val": i32(377)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 119, 97, 112, 116, 114, 97, 99, 107, 115, 108, 111, 116, 0]), "val": i32(378)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([116, 101, 114, 109, 105, 110, 97, 116, 101, 0]), "val": i32(380)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([116, 105, 109, 101, 0]), "val": i32(381)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([116, 105, 112, 0]), "val": i32(382)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([116, 111, 115, 115, 119, 101, 97, 112, 111, 110, 0]), "val": i32(383)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([117, 110, 100, 101, 102, 105, 110, 101, 99, 104, 101, 97, 116, 0]), "val": i32(442)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([117, 110, 100, 101, 102, 105, 110, 101, 103, 97, 109, 101, 102, 117, 110, 99, 0]), "val": i32(443)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([117, 110, 100, 101, 102, 105, 110, 101, 108, 101, 118, 101, 108, 0]), "val": i32(444)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([117, 110, 100, 101, 102, 105, 110, 101, 115, 107, 105, 108, 108, 0]), "val": i32(445)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([117, 110, 100, 101, 102, 105, 110, 101, 118, 111, 108, 117, 109, 101, 0]), "val": i32(446)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([117, 112, 100, 97, 116, 101, 115, 101, 99, 116, 111, 114, 0]), "val": i32(384)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([117, 112, 100, 97, 116, 101, 115, 101, 99, 116, 111, 114, 122, 0]), "val": i32(385)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([117, 112, 100, 97, 116, 101, 115, 101, 99, 116, 111, 114, 110, 101, 105, 103, 104, 98, 111, 114, 0]), "val": i32(386)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([117, 112, 100, 97, 116, 101, 115, 101, 99, 116, 111, 114, 110, 101, 105, 103, 104, 98, 111, 114, 122, 0]), "val": i32(387)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([117, 115, 101, 114, 97, 99, 116, 111, 114, 0]), "val": i32(447)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([117, 115, 101, 114, 113, 117, 111, 116, 101, 0]), "val": i32(388)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([119, 97, 99, 107, 112, 108, 97, 121, 101, 114, 0]), "val": i32(389)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([119, 104, 105, 108, 101, 118, 97, 114, 101, 0]), "val": i32(59)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([119, 104, 105, 108, 101, 118, 97, 114, 108, 0]), "val": i32(60)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([119, 104, 105, 108, 101, 118, 97, 114, 110, 0]), "val": i32(61)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([119, 104, 105, 108, 101, 118, 97, 114, 118, 97, 114, 101, 0]), "val": i32(29)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([119, 104, 105, 108, 101, 118, 97, 114, 118, 97, 114, 108, 0]), "val": i32(30)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([119, 104, 105, 108, 101, 118, 97, 114, 118, 97, 114, 110, 0]), "val": i32(31)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([119, 114, 105, 116, 101, 97, 114, 114, 97, 121, 116, 111, 102, 105, 108, 101, 0]), "val": i32(390)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([120, 111, 114, 118, 97, 114, 0]), "val": i32(62)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([120, 111, 114, 118, 97, 114, 118, 97, 114, 0]), "val": i32(32)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([121, 105, 101, 108, 100, 0]), "val": i32(391)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([95, 95, 121, 105, 101, 108, 100, 106, 117, 109, 112, 0]), "val": i32(392)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([122, 115, 104, 111, 111, 116, 118, 97, 114, 0]), "val": i32(393)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([123, 0]), "val": i32(68)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([125, 0]), "val": i32(69)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([35, 100, 101, 102, 105, 110, 101, 0]), "val": i32(406)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([35, 105, 110, 99, 108, 117, 100, 101, 0]), "val": i32(426)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([97, 108, 0]), "val": i32(112)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([118, 97, 114, 0]), "val": i32(425)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([97, 114, 114, 97, 121, 0]), "val": i32(423)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 104, 105, 102, 116, 108, 0]), "val": i32(26)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 104, 105, 102, 116, 114, 0]), "val": i32(27)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([114, 97, 110, 100, 0]), "val": i32(24)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 101, 116, 0]), "val": i32(25)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([97, 100, 100, 0]), "val": i32(18)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 117, 98, 0]), "val": i32(28)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([109, 117, 108, 0]), "val": i32(22)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([100, 105, 118, 0]), "val": i32(20)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([109, 111, 100, 0]), "val": i32(21)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([97, 110, 100, 0]), "val": i32(19)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([111, 114, 0]), "val": i32(23)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([120, 111, 114, 0]), "val": i32(32)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 97, 0]), "val": i32(3)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 97, 101, 0]), "val": i32(4)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 98, 0]), "val": i32(6)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 98, 101, 0]), "val": i32(7)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 108, 0]), "val": i32(13)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 108, 101, 0]), "val": i32(14)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 103, 0]), "val": i32(11)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 103, 101, 0]), "val": i32(12)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 101, 0]), "val": i32(9)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 110, 0]), "val": i32(15)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 97, 110, 100, 0]), "val": i32(5)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 111, 114, 0]), "val": i32(16)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 120, 111, 114, 0]), "val": i32(17)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 101, 105, 116, 104, 101, 114, 0]), "val": i32(10)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([105, 102, 98, 111, 116, 104, 0]), "val": i32(8)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([119, 104, 105, 108, 101, 101, 0]), "val": i32(29)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([119, 104, 105, 108, 101, 110, 0]), "val": i32(31)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([119, 104, 105, 108, 101, 108, 0]), "val": i32(30)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([97, 98, 115, 0]), "val": i32(260)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([103, 101, 116, 112, 0]), "val": i32(93)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([103, 101, 116, 112, 118, 0]), "val": i32(95)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([103, 101, 116, 115, 0]), "val": i32(97)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([103, 101, 116, 97, 0]), "val": i32(89)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([103, 101, 116, 97, 118, 0]), "val": i32(91)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([103, 101, 116, 119, 0]), "val": i32(103)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([103, 101, 116, 117, 0]), "val": i32(102)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([103, 101, 116, 105, 0]), "val": i32(186)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([103, 101, 116, 97, 114, 114, 97, 121, 115, 101, 113, 0]), "val": i32(178)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 101, 116, 112, 0]), "val": i32(76)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 101, 116, 112, 118, 0]), "val": i32(78)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 101, 116, 115, 0]), "val": i32(80)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 101, 116, 97, 0]), "val": i32(71)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 101, 116, 97, 118, 0]), "val": i32(73)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 101, 116, 119, 0]), "val": i32(87)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 101, 116, 117, 0]), "val": i32(86)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 101, 116, 105, 0]), "val": i32(339)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 101, 116, 97, 114, 114, 97, 121, 115, 101, 113, 0]), "val": i32(75)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 116, 114, 105, 110, 103, 0]), "val": i32(413)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([112, 114, 105, 110, 116, 0]), "val": i32(306)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([100, 99, 0]), "val": i32(407)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([100, 99, 100, 0]), "val": i32(408)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([117, 100, 99, 0]), "val": i32(442)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([99, 107, 0]), "val": i32(401)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([113, 112, 117, 116, 115, 0]), "val": i32(310)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([101, 115, 112, 97, 119, 110, 0]), "val": i32(160)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([113, 115, 112, 97, 119, 110, 0]), "val": i32(296)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([101, 113, 115, 112, 97, 119, 110, 0]), "val": i32(158)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([101, 115, 104, 111, 111, 116, 0]), "val": i32(159)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([122, 115, 104, 111, 111, 116, 0]), "val": i32(393)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([101, 122, 115, 104, 111, 111, 116, 0]), "val": i32(162)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 104, 111, 111, 116, 0]), "val": i32(345)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([102, 105, 110, 100, 110, 101, 97, 114, 97, 99, 116, 111, 114, 0]), "val": i32(164)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([102, 105, 110, 100, 110, 101, 97, 114, 97, 99, 116, 111, 114, 51, 100, 0]), "val": i32(165)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([102, 105, 110, 100, 110, 101, 97, 114, 97, 99, 116, 111, 114, 122, 0]), "val": i32(166)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([102, 105, 110, 100, 110, 101, 97, 114, 115, 112, 114, 105, 116, 101, 0]), "val": i32(167)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([102, 105, 110, 100, 110, 101, 97, 114, 115, 112, 114, 105, 116, 101, 51, 100, 0]), "val": i32(168)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([102, 105, 110, 100, 110, 101, 97, 114, 115, 112, 114, 105, 116, 101, 122, 0]), "val": i32(169)}, null, {})]);
function __cxx_static_address_117e66c5e5d0a5ac776feff5() {
  return __cxx_static_address_117e66c5e5d0a5ac776feff5.reference || (__cxx_static_address_117e66c5e5d0a5ac776feff5.reference = {
    __cReference: true,
    get value() { return vm_keywords; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/gamedef.cpp:679
export const varvartable = cByteRecordNDArray({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, [31], {}, [cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": i32(3), "y": i32(33)}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": i32(4), "y": i32(34)}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": i32(5), "y": i32(35)}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": i32(6), "y": i32(36)}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": i32(7), "y": i32(37)}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": i32(8), "y": i32(38)}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": i32(9), "y": i32(39)}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": i32(10), "y": i32(40)}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": i32(11), "y": i32(41)}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": i32(12), "y": i32(42)}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": i32(13), "y": i32(43)}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": i32(14), "y": i32(44)}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": i32(15), "y": i32(45)}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": i32(16), "y": i32(46)}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": i32(17), "y": i32(47)}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": i32(18), "y": i32(48)}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": i32(19), "y": i32(49)}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": i32(151), "y": i32(150)}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": i32(20), "y": i32(50)}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": i32(21), "y": i32(51)}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": i32(22), "y": i32(52)}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": i32(23), "y": i32(53)}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": i32(24), "y": i32(54)}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": i32(25), "y": i32(55)}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": i32(26), "y": i32(56)}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": i32(27), "y": i32(57)}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": i32(28), "y": i32(58)}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": i32(29), "y": i32(59)}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": i32(30), "y": i32(60)}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": i32(31), "y": i32(61)}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": i32(32), "y": i32(62)}, null, {})]);
function __cxx_static_address_00173703d9ca8f961882c6e3() {
  return __cxx_static_address_00173703d9ca8f961882c6e3.reference || (__cxx_static_address_00173703d9ca8f961882c6e3.reference = {
    __cReference: true,
    get value() { return varvartable; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/gamedef.cpp:715
export const globalvartable = cByteRecordNDArray({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, [1], {}, [cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": i32(55), "y": i32(0)}, null, {})]);
function __cxx_static_address_af821daadec5fc28d8adfac2() {
  return __cxx_static_address_af821daadec5fc28d8adfac2.reference || (__cxx_static_address_af821daadec5fc28d8adfac2.reference = {
    __cReference: true,
    get value() { return globalvartable; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/gamedef.cpp:752
export const playervartable = cByteRecordNDArray({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, [1], {}, [cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": i32(55), "y": i32(1)}, null, {})]);
function __cxx_static_address_127ef6ebcbc1f1d3b99ae585() {
  return __cxx_static_address_127ef6ebcbc1f1d3b99ae585.reference || (__cxx_static_address_127ef6ebcbc1f1d3b99ae585.reference = {
    __cReference: true,
    get value() { return playervartable; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/gamedef.cpp:789
export const actorvartable = cByteRecordNDArray({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, [1], {}, [cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": i32(55), "y": i32(2)}, null, {})]);
function __cxx_static_address_f2d9f01c36a9a1e812e2ca8b() {
  return __cxx_static_address_f2d9f01c36a9a1e812e2ca8b.reference || (__cxx_static_address_f2d9f01c36a9a1e812e2ca8b.reference = {
    __cReference: true,
    get value() { return actorvartable; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/gamedef.cpp:826
export let h_varvar = cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"count": {"native": "Uint32Array", "offset": 0, "size": 4}, "prime": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "Uint32Array", "offset": 0, "size": 4}, "more": {"native": "Uint8Array", "offset": 4, "size": 1}}, "overlaps": false, "size": 5, "union": false}, "offset": 4}, "v": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 8}, "items": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "size": 24, "union": false}, {"items": null, "__cxx_anonymous_1": cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"count": {"native": "Uint32Array", "offset": 0, "size": 4}, "prime": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "Uint32Array", "offset": 0, "size": 4}, "more": {"native": "Uint8Array", "offset": 4, "size": 1}}, "overlaps": false, "size": 5, "union": false}, "offset": 4}, "v": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, {"count": u32((BigInt((BigInt((BigInt(ARRAY_SIZE__header_78ca1afef65b(varvartable)) * BigInt(u64(4)))) / BigInt(u64(3)))) | BigInt(u64(1))))}, null, {})}, null, {});
function __cxx_static_address_2c502a82220a36abae3ae2b2() {
  return __cxx_static_address_2c502a82220a36abae3ae2b2.reference || (__cxx_static_address_2c502a82220a36abae3ae2b2.reference = {
    __cReference: true,
    get value() { return h_varvar; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/gamedef.cpp:827
export let h_globalvar = cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"count": {"native": "Uint32Array", "offset": 0, "size": 4}, "prime": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "Uint32Array", "offset": 0, "size": 4}, "more": {"native": "Uint8Array", "offset": 4, "size": 1}}, "overlaps": false, "size": 5, "union": false}, "offset": 4}, "v": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 8}, "items": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "size": 24, "union": false}, {"items": null, "__cxx_anonymous_1": cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"count": {"native": "Uint32Array", "offset": 0, "size": 4}, "prime": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "Uint32Array", "offset": 0, "size": 4}, "more": {"native": "Uint8Array", "offset": 4, "size": 1}}, "overlaps": false, "size": 5, "union": false}, "offset": 4}, "v": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, {"count": u32((BigInt((BigInt((BigInt(ARRAY_SIZE__header_1b7eba0688f8(globalvartable)) * BigInt(u64(4)))) / BigInt(u64(3)))) | BigInt(u64(1))))}, null, {})}, null, {});
function __cxx_static_address_b56202585616aa9c65ec503a() {
  return __cxx_static_address_b56202585616aa9c65ec503a.reference || (__cxx_static_address_b56202585616aa9c65ec503a.reference = {
    __cReference: true,
    get value() { return h_globalvar; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/gamedef.cpp:828
export let h_playervar = cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"count": {"native": "Uint32Array", "offset": 0, "size": 4}, "prime": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "Uint32Array", "offset": 0, "size": 4}, "more": {"native": "Uint8Array", "offset": 4, "size": 1}}, "overlaps": false, "size": 5, "union": false}, "offset": 4}, "v": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 8}, "items": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "size": 24, "union": false}, {"items": null, "__cxx_anonymous_1": cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"count": {"native": "Uint32Array", "offset": 0, "size": 4}, "prime": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "Uint32Array", "offset": 0, "size": 4}, "more": {"native": "Uint8Array", "offset": 4, "size": 1}}, "overlaps": false, "size": 5, "union": false}, "offset": 4}, "v": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, {"count": u32((BigInt((BigInt((BigInt(ARRAY_SIZE__header_1b7eba0688f8(playervartable)) * BigInt(u64(4)))) / BigInt(u64(3)))) | BigInt(u64(1))))}, null, {})}, null, {});
function __cxx_static_address_adb3542f30964081065bc3c4() {
  return __cxx_static_address_adb3542f30964081065bc3c4.reference || (__cxx_static_address_adb3542f30964081065bc3c4.reference = {
    __cReference: true,
    get value() { return h_playervar; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/gamedef.cpp:829
export let h_actorvar = cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"count": {"native": "Uint32Array", "offset": 0, "size": 4}, "prime": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "Uint32Array", "offset": 0, "size": 4}, "more": {"native": "Uint8Array", "offset": 4, "size": 1}}, "overlaps": false, "size": 5, "union": false}, "offset": 4}, "v": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 8}, "items": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "size": 24, "union": false}, {"items": null, "__cxx_anonymous_1": cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"count": {"native": "Uint32Array", "offset": 0, "size": 4}, "prime": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "Uint32Array", "offset": 0, "size": 4}, "more": {"native": "Uint8Array", "offset": 4, "size": 1}}, "overlaps": false, "size": 5, "union": false}, "offset": 4}, "v": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, {"count": u32((BigInt((BigInt((BigInt(ARRAY_SIZE__header_1b7eba0688f8(actorvartable)) * BigInt(u64(4)))) / BigInt(u64(3)))) | BigInt(u64(1))))}, null, {})}, null, {});
function __cxx_static_address_6e818e10e7fcc27dc3dc3c5b() {
  return __cxx_static_address_6e818e10e7fcc27dc3dc3c5b.reference || (__cxx_static_address_6e818e10e7fcc27dc3dc3c5b.reference = {
    __cReference: true,
    get value() { return h_actorvar; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/gamedef.cpp:831
export let inttables = cPointerArray(4, [__cxx_static_address_2c502a82220a36abae3ae2b2(), __cxx_static_address_b56202585616aa9c65ec503a(), __cxx_static_address_adb3542f30964081065bc3c4(), __cxx_static_address_6e818e10e7fcc27dc3dc3c5b()]);
function __cxx_static_address_b5e08239fa57c8aaa977e074() {
  return __cxx_static_address_b5e08239fa57c8aaa977e074.reference || (__cxx_static_address_b5e08239fa57c8aaa977e074.reference = {
    __cReference: true,
    get value() { return inttables; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/gamedef.cpp:839
export const iter_tokens = cByteRecordNDArray({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, [16], {}, [cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([97, 108, 108, 115, 112, 114, 105, 116, 101, 115, 0]), "val": i32(0)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([97, 108, 108, 115, 112, 114, 105, 116, 101, 115, 98, 121, 115, 116, 97, 116, 0]), "val": i32(10)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([97, 108, 108, 115, 112, 114, 105, 116, 101, 115, 98, 121, 115, 101, 99, 116, 0]), "val": i32(11)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([97, 108, 108, 115, 101, 99, 116, 111, 114, 115, 0]), "val": i32(1)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([97, 108, 108, 119, 97, 108, 108, 115, 0]), "val": i32(2)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([97, 99, 116, 105, 118, 101, 108, 105, 103, 104, 116, 115, 0]), "val": i32(3)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([100, 114, 97, 119, 110, 115, 112, 114, 105, 116, 101, 115, 0]), "val": i32(4)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 112, 114, 105, 116, 101, 115, 111, 102, 115, 101, 99, 116, 111, 114, 0]), "val": i32(5)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 112, 114, 105, 116, 101, 115, 111, 102, 115, 116, 97, 116, 117, 115, 0]), "val": i32(6)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([108, 111, 111, 112, 111, 102, 119, 97, 108, 108, 0]), "val": i32(8)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([119, 97, 108, 108, 115, 111, 102, 115, 101, 99, 116, 111, 114, 0]), "val": i32(7)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([114, 97, 110, 103, 101, 0]), "val": i32(9)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([108, 105, 103, 104, 116, 115, 0]), "val": i32(3)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 112, 114, 111, 102, 115, 101, 99, 0]), "val": i32(5)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 112, 114, 111, 102, 115, 116, 97, 116, 0]), "val": i32(6)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([119, 97, 108, 111, 102, 115, 101, 99, 0]), "val": i32(7)}, null, {})]);
function __cxx_static_address_921e14cca8533a203c9b9595() {
  return __cxx_static_address_921e14cca8533a203c9b9595.reference || (__cxx_static_address_921e14cca8533a203c9b9595.reference = {
    __cReference: true,
    get value() { return iter_tokens; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/gamedef.cpp:862
export const keywords_for_private_opcodes = cByteRecordNDArray({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, [12], {}, [cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([103, 101, 116, 97, 99, 116, 111, 114, 0]), "val": i32(99)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([103, 101, 116, 97, 99, 116, 111, 114, 0]), "val": i32(90)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([103, 101, 116, 97, 99, 116, 111, 114, 0]), "val": i32(100)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 101, 116, 97, 99, 116, 111, 114, 0]), "val": i32(82)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 101, 116, 97, 99, 116, 111, 114, 0]), "val": i32(72)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 101, 116, 97, 99, 116, 111, 114, 0]), "val": i32(83)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([103, 101, 116, 119, 97, 108, 108, 0]), "val": i32(104)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 101, 116, 119, 97, 108, 108, 0]), "val": i32(88)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([103, 101, 116, 115, 101, 99, 116, 111, 114, 0]), "val": i32(98)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 101, 116, 115, 101, 99, 116, 111, 114, 0]), "val": i32(81)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([103, 101, 116, 112, 108, 97, 121, 101, 114, 0]), "val": i32(94)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": Uint8Array.from([115, 101, 116, 112, 108, 97, 121, 101, 114, 0]), "val": i32(77)}, null, {})]);
function __cxx_static_address_047243f99888b4139e551cbe() {
  return __cxx_static_address_047243f99888b4139e551cbe.reference || (__cxx_static_address_047243f99888b4139e551cbe.reference = {
    __cReference: true,
    get value() { return keywords_for_private_opcodes; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/gamedef.cpp:882
const __cxx_literal_dfbf065ad551970f0547 = Uint8Array.from([60, 117, 110, 107, 110, 111, 119, 110, 32, 105, 110, 115, 116, 114, 117, 99, 116, 105, 111, 110, 62, 0]);
export function VM_GetKeywordForID(id) {
  {
    const __cxx_range_array_0 = vm_keywords;
    if (__cxx_range_array_0.length !== 516) throw new RangeError("C array extent mismatch");
    for (let __cxx_range_index_0 = 0; __cxx_range_index_0 < 516; ++__cxx_range_index_0) {
      if ((__cxx_range_array_0[__cxx_range_index_0].val == id)) {
        return __cxx_range_array_0[__cxx_range_index_0].token;
      }
    }
  }
  {
    const __cxx_range_array_1 = keywords_for_private_opcodes;
    if (__cxx_range_array_1.length !== 12) throw new RangeError("C array extent mismatch");
    for (let __cxx_range_index_1 = 0; __cxx_range_index_1 < 12; ++__cxx_range_index_1) {
      if ((__cxx_range_array_1[__cxx_range_index_1].val == id)) {
        return __cxx_range_array_1[__cxx_range_index_1].token;
      }
    }
  }
  return __cxx_literal_dfbf065ad551970f0547;
}

// C/C++ source: source/duke3d/src/gamedef.cpp:897
export const EventNames = cPointerArray(164, [Uint8Array.from([69, 86, 69, 78, 84, 95, 73, 78, 73, 84, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 69, 78, 84, 69, 82, 76, 69, 86, 69, 76, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 82, 69, 83, 69, 84, 87, 69, 65, 80, 79, 78, 83, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 82, 69, 83, 69, 84, 73, 78, 86, 69, 78, 84, 79, 82, 89, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 72, 79, 76, 83, 84, 69, 82, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 76, 79, 79, 75, 76, 69, 70, 84, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 76, 79, 79, 75, 82, 73, 71, 72, 84, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 83, 79, 65, 82, 85, 80, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 83, 79, 65, 82, 68, 79, 87, 78, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 67, 82, 79, 85, 67, 72, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 74, 85, 77, 80, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 82, 69, 84, 85, 82, 78, 84, 79, 67, 69, 78, 84, 69, 82, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 76, 79, 79, 75, 85, 80, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 76, 79, 79, 75, 68, 79, 87, 78, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 65, 73, 77, 85, 80, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 70, 73, 82, 69, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 67, 72, 65, 78, 71, 69, 87, 69, 65, 80, 79, 78, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 71, 69, 84, 83, 72, 79, 84, 82, 65, 78, 71, 69, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 71, 69, 84, 65, 85, 84, 79, 65, 73, 77, 65, 78, 71, 76, 69, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 71, 69, 84, 76, 79, 65, 68, 84, 73, 76, 69, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 67, 72, 69, 65, 84, 71, 69, 84, 83, 84, 69, 82, 79, 73, 68, 83, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 67, 72, 69, 65, 84, 71, 69, 84, 72, 69, 65, 84, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 67, 72, 69, 65, 84, 71, 69, 84, 66, 79, 79, 84, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 67, 72, 69, 65, 84, 71, 69, 84, 83, 72, 73, 69, 76, 68, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 67, 72, 69, 65, 84, 71, 69, 84, 83, 67, 85, 66, 65, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 67, 72, 69, 65, 84, 71, 69, 84, 72, 79, 76, 79, 68, 85, 75, 69, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 67, 72, 69, 65, 84, 71, 69, 84, 74, 69, 84, 80, 65, 67, 75, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 67, 72, 69, 65, 84, 71, 69, 84, 70, 73, 82, 83, 84, 65, 73, 68, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 81, 85, 73, 67, 75, 75, 73, 67, 75, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 73, 78, 86, 69, 78, 84, 79, 82, 89, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 85, 83, 69, 78, 73, 71, 72, 84, 86, 73, 83, 73, 79, 78, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 85, 83, 69, 83, 84, 69, 82, 79, 73, 68, 83, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 73, 78, 86, 69, 78, 84, 79, 82, 89, 76, 69, 70, 84, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 73, 78, 86, 69, 78, 84, 79, 82, 89, 82, 73, 71, 72, 84, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 72, 79, 76, 79, 68, 85, 75, 69, 79, 78, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 72, 79, 76, 79, 68, 85, 75, 69, 79, 70, 70, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 85, 83, 69, 77, 69, 68, 75, 73, 84, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 85, 83, 69, 74, 69, 84, 80, 65, 67, 75, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 84, 85, 82, 78, 65, 82, 79, 85, 78, 68, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 68, 73, 83, 80, 76, 65, 89, 87, 69, 65, 80, 79, 78, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 70, 73, 82, 69, 87, 69, 65, 80, 79, 78, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 83, 69, 76, 69, 67, 84, 87, 69, 65, 80, 79, 78, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 77, 79, 86, 69, 70, 79, 82, 87, 65, 82, 68, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 77, 79, 86, 69, 66, 65, 67, 75, 87, 65, 82, 68, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 84, 85, 82, 78, 76, 69, 70, 84, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 84, 85, 82, 78, 82, 73, 71, 72, 84, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 83, 84, 82, 65, 70, 69, 76, 69, 70, 84, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 83, 84, 82, 65, 70, 69, 82, 73, 71, 72, 84, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 87, 69, 65, 80, 75, 69, 89, 49, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 87, 69, 65, 80, 75, 69, 89, 50, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 87, 69, 65, 80, 75, 69, 89, 51, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 87, 69, 65, 80, 75, 69, 89, 52, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 87, 69, 65, 80, 75, 69, 89, 53, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 87, 69, 65, 80, 75, 69, 89, 54, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 87, 69, 65, 80, 75, 69, 89, 55, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 87, 69, 65, 80, 75, 69, 89, 56, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 87, 69, 65, 80, 75, 69, 89, 57, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 87, 69, 65, 80, 75, 69, 89, 49, 48, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 68, 82, 65, 87, 87, 69, 65, 80, 79, 78, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 68, 73, 83, 80, 76, 65, 89, 67, 82, 79, 83, 83, 72, 65, 73, 82, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 68, 73, 83, 80, 76, 65, 89, 82, 69, 83, 84, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 68, 73, 83, 80, 76, 65, 89, 83, 66, 65, 82, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 82, 69, 83, 69, 84, 80, 76, 65, 89, 69, 82, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 73, 78, 67, 85, 82, 68, 65, 77, 65, 71, 69, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 65, 73, 77, 68, 79, 87, 78, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 71, 65, 77, 69, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 80, 82, 69, 86, 73, 79, 85, 83, 87, 69, 65, 80, 79, 78, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 78, 69, 88, 84, 87, 69, 65, 80, 79, 78, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 83, 87, 73, 77, 85, 80, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 83, 87, 73, 77, 68, 79, 87, 78, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 71, 69, 84, 77, 69, 78, 85, 84, 73, 76, 69, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 83, 80, 65, 87, 78, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 76, 79, 71, 79, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 69, 71, 83, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 68, 79, 70, 73, 82, 69, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 80, 82, 69, 83, 83, 69, 68, 70, 73, 82, 69, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 85, 83, 69, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 80, 82, 79, 67, 69, 83, 83, 73, 78, 80, 85, 84, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 70, 65, 75, 69, 68, 79, 77, 79, 86, 69, 84, 72, 73, 78, 71, 83, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 68, 73, 83, 80, 76, 65, 89, 82, 79, 79, 77, 83, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 75, 73, 76, 76, 73, 84, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 76, 79, 65, 68, 65, 67, 84, 79, 82, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 68, 73, 83, 80, 76, 65, 89, 66, 79, 78, 85, 83, 83, 67, 82, 69, 69, 78, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 68, 73, 83, 80, 76, 65, 89, 77, 69, 78, 85, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 68, 73, 83, 80, 76, 65, 89, 77, 69, 78, 85, 82, 69, 83, 84, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 68, 73, 83, 80, 76, 65, 89, 76, 79, 65, 68, 73, 78, 71, 83, 67, 82, 69, 69, 78, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 65, 78, 73, 77, 65, 84, 69, 83, 80, 82, 73, 84, 69, 83, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 78, 69, 87, 71, 65, 77, 69, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 83, 79, 85, 78, 68, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 67, 72, 69, 67, 75, 84, 79, 85, 67, 72, 68, 65, 77, 65, 71, 69, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 67, 72, 69, 67, 75, 70, 76, 79, 79, 82, 68, 65, 77, 65, 71, 69, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 76, 79, 65, 68, 71, 65, 77, 69, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 83, 65, 86, 69, 71, 65, 77, 69, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 80, 82, 69, 71, 65, 77, 69, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 67, 72, 65, 78, 71, 69, 77, 69, 78, 85, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 68, 65, 77, 65, 71, 69, 72, 80, 76, 65, 78, 69, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 65, 67, 84, 73, 86, 65, 84, 69, 67, 72, 69, 65, 84, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 68, 73, 83, 80, 76, 65, 89, 73, 78, 65, 67, 84, 73, 86, 69, 77, 69, 78, 85, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 68, 73, 83, 80, 76, 65, 89, 73, 78, 65, 67, 84, 73, 86, 69, 77, 69, 78, 85, 82, 69, 83, 84, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 67, 85, 84, 83, 67, 69, 78, 69, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 68, 73, 83, 80, 76, 65, 89, 67, 85, 82, 83, 79, 82, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 68, 73, 83, 80, 76, 65, 89, 76, 69, 86, 69, 76, 83, 84, 65, 84, 83, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 68, 73, 83, 80, 76, 65, 89, 67, 65, 77, 69, 82, 65, 79, 83, 68, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 68, 73, 83, 80, 76, 65, 89, 82, 79, 79, 77, 83, 67, 65, 77, 69, 82, 65, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 68, 73, 83, 80, 76, 65, 89, 83, 84, 65, 82, 84, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 87, 79, 82, 76, 68, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 80, 82, 69, 87, 79, 82, 76, 68, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 80, 82, 69, 76, 69, 86, 69, 76, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 68, 73, 83, 80, 76, 65, 89, 83, 80, 73, 84, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 68, 73, 83, 80, 76, 65, 89, 70, 73, 83, 84, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 68, 73, 83, 80, 76, 65, 89, 75, 78, 69, 69, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 68, 73, 83, 80, 76, 65, 89, 75, 78, 85, 67, 75, 76, 69, 83, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 68, 73, 83, 80, 76, 65, 89, 83, 67, 85, 66, 65, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 68, 73, 83, 80, 76, 65, 89, 84, 73, 80, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 68, 73, 83, 80, 76, 65, 89, 65, 67, 67, 69, 83, 83, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 77, 79, 86, 69, 83, 69, 67, 84, 79, 82, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 77, 79, 86, 69, 69, 70, 70, 69, 67, 84, 79, 82, 83, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 68, 73, 83, 80, 76, 65, 89, 79, 86, 69, 82, 72, 69, 65, 68, 77, 65, 80, 84, 69, 88, 84, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 80, 82, 69, 76, 79, 65, 68, 71, 65, 77, 69, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 80, 79, 83, 84, 83, 65, 86, 69, 71, 65, 77, 69, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 80, 82, 69, 67, 85, 84, 83, 67, 69, 78, 69, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 83, 75, 73, 80, 67, 85, 84, 83, 67, 69, 78, 69, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 83, 67, 82, 69, 69, 78, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 68, 73, 83, 80, 76, 65, 89, 82, 79, 79, 77, 83, 69, 78, 68, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 68, 73, 83, 80, 76, 65, 89, 69, 78, 68, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 79, 80, 69, 78, 77, 69, 78, 85, 83, 79, 85, 78, 68, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 82, 69, 67, 79, 71, 83, 79, 85, 78, 68, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 85, 80, 68, 65, 84, 69, 83, 67, 82, 69, 69, 78, 65, 82, 69, 65, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 68, 73, 83, 80, 76, 65, 89, 66, 79, 82, 68, 69, 82, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 83, 69, 84, 68, 69, 70, 65, 85, 76, 84, 83, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 77, 65, 73, 78, 77, 69, 78, 85, 83, 67, 82, 69, 69, 78, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 78, 69, 87, 71, 65, 77, 69, 83, 67, 82, 69, 69, 78, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 69, 78, 68, 76, 69, 86, 69, 76, 83, 67, 82, 69, 69, 78, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 69, 88, 73, 84, 71, 65, 77, 69, 83, 67, 82, 69, 69, 78, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 69, 88, 73, 84, 80, 82, 79, 71, 82, 65, 77, 83, 67, 82, 69, 69, 78, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 65, 76, 84, 70, 73, 82, 69, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 65, 76, 84, 87, 69, 65, 80, 79, 78, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 68, 73, 83, 80, 76, 65, 89, 79, 86, 69, 82, 72, 69, 65, 68, 77, 65, 80, 80, 76, 65, 89, 69, 82, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 77, 69, 78, 85, 67, 85, 82, 83, 79, 82, 76, 69, 70, 84, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 77, 69, 78, 85, 67, 85, 82, 83, 79, 82, 82, 73, 71, 72, 84, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 77, 69, 78, 85, 67, 85, 82, 83, 79, 82, 83, 72, 65, 68, 69, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 77, 69, 78, 85, 83, 72, 65, 68, 69, 83, 69, 76, 69, 67, 84, 69, 68, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 80, 76, 65, 89, 76, 69, 86, 69, 76, 77, 85, 83, 73, 67, 83, 76, 79, 84, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 67, 79, 78, 84, 73, 78, 85, 69, 76, 69, 86, 69, 76, 77, 85, 83, 73, 67, 83, 76, 79, 84, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 68, 73, 83, 80, 76, 65, 89, 80, 79, 73, 78, 84, 69, 82, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 76, 65, 83, 84, 87, 69, 65, 80, 79, 78, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 68, 65, 77, 65, 71, 69, 83, 80, 82, 73, 84, 69, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 80, 79, 83, 84, 68, 65, 77, 65, 71, 69, 83, 80, 82, 73, 84, 69, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 68, 65, 77, 65, 71, 69, 87, 65, 76, 76, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 68, 65, 77, 65, 71, 69, 70, 76, 79, 79, 82, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 68, 65, 77, 65, 71, 69, 67, 69, 73, 76, 73, 78, 71, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 68, 73, 83, 80, 76, 65, 89, 82, 79, 79, 77, 83, 67, 65, 77, 69, 82, 65, 84, 73, 76, 69, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 82, 69, 83, 69, 84, 71, 79, 84, 80, 73, 67, 83, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 86, 65, 76, 73, 68, 65, 84, 69, 83, 84, 65, 82, 84, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 78, 69, 87, 71, 65, 77, 69, 67, 85, 83, 84, 79, 77, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 73, 78, 73, 84, 67, 79, 77, 80, 76, 69, 84, 69, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 67, 65, 80, 73, 82, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 80, 82, 69, 85, 80, 68, 65, 84, 69, 65, 78, 71, 76, 69, 83, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 80, 79, 83, 84, 85, 80, 68, 65, 84, 69, 65, 78, 71, 76, 69, 83, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 71, 69, 84, 66, 79, 78, 85, 83, 84, 73, 76, 69, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 80, 82, 69, 65, 67, 84, 79, 82, 68, 65, 77, 65, 71, 69, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 80, 82, 69, 87, 69, 65, 80, 79, 78, 83, 72, 79, 79, 84, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 80, 79, 83, 84, 87, 69, 65, 80, 79, 78, 83, 72, 79, 79, 84, 0]), Uint8Array.from([69, 86, 69, 78, 84, 95, 79, 80, 69, 82, 65, 84, 69, 65, 67, 84, 73, 86, 65, 84, 79, 82, 83, 0])]);
function __cxx_static_address_03855d3cecb738ccb938dfb4() {
  return __cxx_static_address_03855d3cecb738ccb938dfb4.reference || (__cxx_static_address_03855d3cecb738ccb938dfb4.reference = {
    __cReference: true,
    get value() { return EventNames; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/gamedef.cpp:1065
export let bitptr = null;
export function __cxx_global_cell_cc4a0559ddac06eb447295da() {
  return __cxx_global_cell_cc4a0559ddac06eb447295da.reference || (__cxx_global_cell_cc4a0559ddac06eb447295da.reference = {
    __cReference: true,
    get value() { return bitptr; },
    set value(__cxx_lvalue_0) { bitptr = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/duke3d/src/gamedef.cpp:1066
export let bitstate = null;
export function __cxx_global_cell_84099bb478ae12489bd3cc37() {
  return __cxx_global_cell_84099bb478ae12489bd3cc37.reference || (__cxx_global_cell_84099bb478ae12489bd3cc37.reference = {
    __cReference: true,
    get value() { return bitstate; },
    set value(__cxx_lvalue_0) { bitstate = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/duke3d/src/gamedef.cpp:1068
export let h_arrays = cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"prime": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "Uint32Array", "offset": 0, "size": 4}, "more": {"native": "Uint8Array", "offset": 4, "size": 1}}, "overlaps": false, "size": 5, "union": false}, "offset": 4}, "v": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "size": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "items": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": true, "size": 24, "union": false}, {"__cxx_anonymous_0": cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"prime": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "Uint32Array", "offset": 0, "size": 4}, "more": {"native": "Uint8Array", "offset": 4, "size": 1}}, "overlaps": false, "size": 5, "union": false}, "offset": 4}, "v": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "size": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": true, "size": 12, "union": true}, {"size": u32(i32((i32((2048 >> 2)) >> 1)))}, null, {}), "items": null}, null, {});
export function __cxx_global_cell_f0457d06edefc3c775e2c32f() {
  return __cxx_global_cell_f0457d06edefc3c775e2c32f.reference || (__cxx_global_cell_f0457d06edefc3c775e2c32f.reference = {
    __cReference: true,
    get value() { return h_arrays; },
    set value(__cxx_lvalue_0) { throw new TypeError("record address cannot replace original object storage"); }
  });
}

// C/C++ source: source/duke3d/src/gamedef.cpp:1069
export let h_gamevars = cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"prime": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "Uint32Array", "offset": 0, "size": 4}, "more": {"native": "Uint8Array", "offset": 4, "size": 1}}, "overlaps": false, "size": 5, "union": false}, "offset": 4}, "v": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "size": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "items": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": true, "size": 24, "union": false}, {"__cxx_anonymous_0": cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"prime": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "Uint32Array", "offset": 0, "size": 4}, "more": {"native": "Uint8Array", "offset": 4, "size": 1}}, "overlaps": false, "size": 5, "union": false}, "offset": 4}, "v": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "size": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": true, "size": 12, "union": true}, {"size": u32(i32((2048 >> 1)))}, null, {}), "items": null}, null, {});
export function __cxx_global_cell_2d12a4ce62b5a2309382b8ea() {
  return __cxx_global_cell_2d12a4ce62b5a2309382b8ea.reference || (__cxx_global_cell_2d12a4ce62b5a2309382b8ea.reference = {
    __cReference: true,
    get value() { return h_gamevars; },
    set value(__cxx_lvalue_0) { throw new TypeError("record address cannot replace original object storage"); }
  });
}

// C/C++ source: source/duke3d/src/gamedef.cpp:1070
export let h_labels = cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"prime": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "Uint32Array", "offset": 0, "size": 4}, "more": {"native": "Uint8Array", "offset": 4, "size": 1}}, "overlaps": false, "size": 5, "union": false}, "offset": 4}, "v": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "size": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "items": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": true, "size": 24, "union": false}, {"__cxx_anonymous_0": cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"prime": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "Uint32Array", "offset": 0, "size": 4}, "more": {"native": "Uint8Array", "offset": 4, "size": 1}}, "overlaps": false, "size": 5, "union": false}, "offset": 4}, "v": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "size": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": true, "size": 12, "union": true}, {"size": u32(i32((16384 >> 1)))}, null, {}), "items": null}, null, {});
export function __cxx_global_cell_d4103f960bb678857722381c() {
  return __cxx_global_cell_d4103f960bb678857722381c.reference || (__cxx_global_cell_d4103f960bb678857722381c.reference = {
    __cReference: true,
    get value() { return h_labels; },
    set value(__cxx_lvalue_0) { throw new TypeError("record address cannot replace original object storage"); }
  });
}

// C/C++ source: source/duke3d/src/gamedef.cpp:1127
export function ispecial(c) {
  return Boolean((((((((i32(c) == i32(32)) || (i32(c) == 13)) || (i32(c) == i32(40))) || (i32(c) == i32(41))) || (i32(c) == i32(44))) || (i32(c) == i32(59))) || (i32(c) == 10)));
}

// C/C++ source: source/duke3d/src/gamedef.cpp:1133
export function scriptSkipLine() {
  while ((((i32((cDeref(textptr, Uint8Array).value)) != 10) && (i32((cDeref(textptr, Uint8Array).value)) != 13)) && (i32((cDeref(textptr, Uint8Array).value)) != 0))) {
    ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return previous; })(__cxx_static_address_e2c5808de82af938e5d43808());
  }
}

// C/C++ source: source/duke3d/src/gamedef.cpp:1139
export function scriptSkipSpaces() {
  while (((i32((cDeref(textptr, Uint8Array).value)) == i32(32)) || (i32((cDeref(textptr, Uint8Array).value)) == i32(9)))) {
    ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return previous; })(__cxx_static_address_e2c5808de82af938e5d43808());
  }
}

// C/C++ source: source/duke3d/src/gamedef.cpp:2112
export function check_filename_case(fn) {
  (fn = fn);
}

// C/C++ source: source/duke3d/src/gamedef.cpp:2260
export let DefaultProjectile = cZeroAggregate({"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"bounces": {"native": "Int16Array", "offset": 38, "size": 2}, "bsound": {"native": "Int16Array", "offset": 40, "size": 2}, "clipdist": {"native": "Uint8Array", "offset": 57, "size": 1}, "cstat": {"native": "Int32Array", "offset": 4, "size": 4}, "decal": {"native": "Int16Array", "offset": 28, "size": 2}, "drop": {"native": "Int16Array", "offset": 34, "size": 2}, "extra": {"native": "Int16Array", "offset": 44, "size": 2}, "extra_rand": {"native": "Int16Array", "offset": 46, "size": 2}, "filler": {"length": 2, "native": "Int8Array", "offset": 58, "size": 2}, "flashcolor": {"native": "Int32Array", "offset": 16, "size": 4}, "hitradius": {"native": "Int32Array", "offset": 8, "size": 4}, "isound": {"native": "Int16Array", "offset": 24, "size": 2}, "movecnt": {"native": "Int8Array", "offset": 56, "size": 1}, "offset": {"native": "Int16Array", "offset": 36, "size": 2}, "pal": {"native": "Int8Array", "offset": 55, "size": 1}, "range": {"native": "Int32Array", "offset": 12, "size": 4}, "shade": {"native": "Int8Array", "offset": 52, "size": 1}, "sound": {"native": "Int16Array", "offset": 22, "size": 2}, "spawns": {"native": "Int16Array", "offset": 20, "size": 2}, "sxrepeat": {"native": "Int8Array", "offset": 48, "size": 1}, "syrepeat": {"native": "Int8Array", "offset": 49, "size": 1}, "tnum": {"native": "Int16Array", "offset": 32, "size": 2}, "toffset": {"native": "Int16Array", "offset": 42, "size": 2}, "trail": {"native": "Int16Array", "offset": 30, "size": 2}, "txrepeat": {"native": "Int8Array", "offset": 50, "size": 1}, "tyrepeat": {"native": "Int8Array", "offset": 51, "size": 1}, "userdata": {"native": "Int32Array", "offset": 60, "size": 4}, "vel": {"native": "Int16Array", "offset": 26, "size": 2}, "workslike": {"native": "Int32Array", "offset": 0, "size": 4}, "xrepeat": {"native": "Int8Array", "offset": 53, "size": 1}, "yrepeat": {"native": "Int8Array", "offset": 54, "size": 1}}, "overlaps": false, "size": 64, "union": false}}, {});
export function __cxx_global_cell_14b7a7066c3f6d3c98286359() {
  return __cxx_global_cell_14b7a7066c3f6d3c98286359.reference || (__cxx_global_cell_14b7a7066c3f6d3c98286359.reference = {
    __cReference: true,
    get value() { return DefaultProjectile; },
    set value(__cxx_lvalue_0) { throw new TypeError("record address cannot replace original object storage"); }
  });
}

// C/C++ source: source/duke3d/src/gamedef.cpp:6584
const __cxx_literal_843de48696b3364bae5b = Uint8Array.from([44, 32, 118, 48, 46, 57, 57, 32, 99, 111, 109, 112, 97, 116, 105, 98, 105, 108, 105, 116, 121, 32, 109, 111, 100, 101, 0]);
const __cxx_literal_978ce6dec003759eeb19 = Uint8Array.from([44, 32, 118, 49, 46, 48, 32, 99, 111, 109, 112, 97, 116, 105, 98, 105, 108, 105, 116, 121, 32, 109, 111, 100, 101, 0]);
const __cxx_literal_22ea88ba63e3864ddbae = Uint8Array.from([44, 32, 118, 49, 46, 49, 32, 99, 111, 109, 112, 97, 116, 105, 98, 105, 108, 105, 116, 121, 32, 109, 111, 100, 101, 0]);
const __cxx_literal_13942862018ce2122dcb = Uint8Array.from([44, 32, 118, 49, 46, 51, 68, 32, 99, 111, 109, 112, 97, 116, 105, 98, 105, 108, 105, 116, 121, 32, 109, 111, 100, 101, 0]);
const __cxx_literal_871ef636cb2e6cc3fb09 = Uint8Array.from([0]);
export function C_ScriptVersionString(version) {
  switch (version) {
    case 9: {
      return __cxx_literal_843de48696b3364bae5b;
    }
    case 10: {
      return __cxx_literal_978ce6dec003759eeb19;
    }
    case 11: {
      return __cxx_literal_22ea88ba63e3864ddbae;
    }
    case 13: {
      return __cxx_literal_13942862018ce2122dcb;
    }
  }
  return __cxx_literal_871ef636cb2e6cc3fb09;
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_9393851f0c146808 = new Uint8Array([((1) & 255), ((2) & 255), ((4) & 255), ((8) & 255), ((16) & 255), ((32) & 255), ((64) & 255), ((128) & 255)]);
function __cxx_static_address_9c31672c8543b035a0c00673() {
  return __cxx_static_address_9c31672c8543b035a0c00673.reference || (__cxx_static_address_9c31672c8543b035a0c00673.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_9393851f0c146808; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:172
export const g_defaultVideoModes__header_global_feadea99f9ddda20 = cByteRecordNDArray({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, [25], {}, [cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 2560, "y": 1440}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 2560, "y": 1200}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 2560, "y": 1080}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1920, "y": 1440}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1920, "y": 1200}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1920, "y": 1080}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1680, "y": 1050}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1600, "y": 1200}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1600, "y": 900}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1366, "y": 768}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1280, "y": 1024}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1280, "y": 960}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1280, "y": 720}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1152, "y": 864}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1024, "y": 768}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1024, "y": 600}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 800, "y": 600}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 640, "y": 480}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 640, "y": 400}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 512, "y": 384}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 480, "y": 360}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 400, "y": 300}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 320, "y": 240}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 320, "y": 200}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 0, "y": 0}, null, {})]);
function __cxx_static_address_fb78a1156186eb1a3025f02a() {
  return __cxx_static_address_fb78a1156186eb1a3025f02a.reference || (__cxx_static_address_fb78a1156186eb1a3025f02a.reference = {
    __cReference: true,
    get value() { return g_defaultVideoModes__header_global_feadea99f9ddda20; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:188
export const g_keyAsciiTable__header_global_b44e7d83054f8cc8 = new Uint8Array([((0) & 255), ((0) & 255), 49, 50, 51, 52, 53, 54, 55, 56, 57, 48, 45, 61, ((0) & 255), ((0) & 255), 113, 119, 101, 114, 116, 121, 117, 105, 111, 112, 91, 93, ((0) & 255), ((0) & 255), 97, 115, 100, 102, 103, 104, 106, 107, 108, 59, ((39) & 255), 96, ((0) & 255), ((92) & 255), 122, 120, 99, 118, 98, 110, 109, 44, 46, 47, ((0) & 255), 42, ((0) & 255), ((32) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255)]);
function __cxx_static_address_0b037ec21f4fd870df5b524e() {
  return __cxx_static_address_0b037ec21f4fd870df5b524e.reference || (__cxx_static_address_0b037ec21f4fd870df5b524e.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTable__header_global_b44e7d83054f8cc8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:196
export const g_keyAsciiTableShift__header_global_a373c5dd09b4bd38 = new Uint8Array([((0) & 255), ((0) & 255), 33, 64, 35, 36, 37, 94, 38, 42, 40, 41, 95, 43, ((0) & 255), ((0) & 255), 81, 87, 69, 82, 84, 89, 85, 73, 79, 80, 123, 125, ((0) & 255), ((0) & 255), 65, 83, 68, 70, 71, 72, 74, 75, 76, 58, 34, 126, ((0) & 255), 124, 90, 88, 67, 86, 66, 78, 77, 60, 62, 63, ((0) & 255), 42, ((0) & 255), ((32) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255)]);
function __cxx_static_address_f313fb9a38a397c20afa15d0() {
  return __cxx_static_address_f313fb9a38a397c20afa15d0.reference || (__cxx_static_address_f313fb9a38a397c20afa15d0.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTableShift__header_global_a373c5dd09b4bd38; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:895
export const pow2long__header_global_43a22d703d942d6d = new Int32Array([1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576, 2097152, 4194304, 8388608, 16777216, 33554432, 67108864, 134217728, 268435456, 536870912, 1073741824, 2147483647]);
function __cxx_static_address_a486dcc8eadf00f0af64e565() {
  return __cxx_static_address_a486dcc8eadf00f0af64e565.reference || (__cxx_static_address_a486dcc8eadf00f0af64e565.reference = {
    __cReference: true,
    get value() { return pow2long__header_global_43a22d703d942d6d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:907
export const pow2ulong__header_global_01f1bda5484e575e = new Uint32Array([u32(1), u32(2), u32(4), u32(8), u32(16), u32(32), u32(64), u32(128), u32(256), u32(512), u32(1024), u32(2048), u32(4096), u32(8192), u32(16384), u32(32768), u32(65536), u32(131072), u32(262144), u32(524288), u32(1048576), u32(2097152), u32(4194304), u32(8388608), u32(16777216), u32(33554432), u32(67108864), u32(134217728), u32(268435456), u32(536870912), u32(1073741824), u32(2147483648n)]);
function __cxx_static_address_b6744e0aff16e293e1de98ef() {
  return __cxx_static_address_b6744e0aff16e293e1de98ef.reference || (__cxx_static_address_b6744e0aff16e293e1de98ef.reference = {
    __cReference: true,
    get value() { return pow2ulong__header_global_01f1bda5484e575e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:919
export const pow264__header_global_34e4e5981bb2210b = new BigInt64Array([BigInt(i64(1)), BigInt(i64(2)), BigInt(i64(4)), BigInt(i64(8)), BigInt(i64(16)), BigInt(i64(32)), BigInt(i64(64)), BigInt(i64(128)), BigInt(i64(256)), BigInt(i64(512)), BigInt(i64(1024)), BigInt(i64(2048)), BigInt(i64(4096)), BigInt(i64(8192)), BigInt(i64(16384)), BigInt(i64(32768)), BigInt(i64(65536)), BigInt(i64(131072)), BigInt(i64(262144)), BigInt(i64(524288)), BigInt(i64(1048576)), BigInt(i64(2097152)), BigInt(i64(4194304)), BigInt(i64(8388608)), BigInt(i64(16777216)), BigInt(i64(33554432)), BigInt(i64(67108864)), BigInt(i64(134217728)), BigInt(i64(268435456)), BigInt(i64(536870912)), BigInt(i64(1073741824)), BigInt(2147483648n), BigInt(4294967296n), BigInt(8589934592n), BigInt(17179869184n), BigInt(34359738368n), BigInt(68719476736n), BigInt(137438953472n), BigInt(274877906944n), BigInt(549755813888n), BigInt(1099511627776n), BigInt(2199023255552n), BigInt(4398046511104n), BigInt(8796093022208n), BigInt(17592186044416n), BigInt(35184372088832n), BigInt(70368744177664n), BigInt(140737488355328n), BigInt(281474976710656n), BigInt(562949953421312n), BigInt(1125899906842624n), BigInt(2251799813685248n), BigInt(4503599627370496n), BigInt(9007199254740992n), BigInt(18014398509481984n), BigInt(36028797018963968n), BigInt(72057594037927936n), BigInt(144115188075855872n), BigInt(288230376151711744n), BigInt(576460752303423488n), BigInt(1152921504606846976n), BigInt(2305843009213693952n), BigInt(4611686018427387904n), BigInt(9223372036854775807n)]);
function __cxx_static_address_a2d9273875f07a94d678984b() {
  return __cxx_static_address_a2d9273875f07a94d678984b.reference || (__cxx_static_address_a2d9273875f07a94d678984b.reference = {
    __cReference: true,
    get value() { return pow264__header_global_34e4e5981bb2210b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/mact/include/keyboard.h:47
export const sctokeylut__header_global_7167dc91fd479953 = cByteRecordNDArray({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, [102], {}, [cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([69, 115, 99, 97, 112, 101, 0]), "sc": ((1) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([49, 0]), "sc": ((2) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([50, 0]), "sc": ((3) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([51, 0]), "sc": ((4) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([52, 0]), "sc": ((5) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([53, 0]), "sc": ((6) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([54, 0]), "sc": ((7) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([55, 0]), "sc": ((8) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([56, 0]), "sc": ((9) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([57, 0]), "sc": ((10) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([48, 0]), "sc": ((11) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([45, 0]), "sc": ((12) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([61, 0]), "sc": ((13) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([66, 97, 107, 83, 112, 99, 0]), "sc": ((14) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([84, 97, 98, 0]), "sc": ((15) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([81, 0]), "sc": ((16) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([87, 0]), "sc": ((17) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([69, 0]), "sc": ((18) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([82, 0]), "sc": ((19) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([84, 0]), "sc": ((20) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([89, 0]), "sc": ((21) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([85, 0]), "sc": ((22) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([73, 0]), "sc": ((23) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([79, 0]), "sc": ((24) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([80, 0]), "sc": ((25) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([91, 0]), "sc": ((26) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([93, 0]), "sc": ((27) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([69, 110, 116, 101, 114, 0]), "sc": ((28) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([76, 67, 116, 114, 108, 0]), "sc": ((29) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([65, 0]), "sc": ((30) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([83, 0]), "sc": ((31) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([68, 0]), "sc": ((32) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 0]), "sc": ((33) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([71, 0]), "sc": ((34) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([72, 0]), "sc": ((35) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([74, 0]), "sc": ((36) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 0]), "sc": ((37) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([76, 0]), "sc": ((38) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([59, 0]), "sc": ((39) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([39, 0]), "sc": ((40) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([96, 0]), "sc": ((41) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([76, 83, 104, 105, 102, 116, 0]), "sc": ((42) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([66, 97, 99, 107, 115, 108, 97, 115, 104, 0]), "sc": ((43) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([90, 0]), "sc": ((44) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([88, 0]), "sc": ((45) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([67, 0]), "sc": ((46) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([86, 0]), "sc": ((47) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([66, 0]), "sc": ((48) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([78, 0]), "sc": ((49) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([77, 0]), "sc": ((50) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([44, 0]), "sc": ((51) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([46, 0]), "sc": ((52) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([47, 0]), "sc": ((53) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([82, 83, 104, 105, 102, 116, 0]), "sc": ((54) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 42, 0]), "sc": ((55) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([76, 65, 108, 116, 0]), "sc": ((56) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([83, 112, 97, 99, 101, 0]), "sc": ((57) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([67, 97, 112, 76, 99, 107, 0]), "sc": ((58) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 49, 0]), "sc": ((59) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 50, 0]), "sc": ((60) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 51, 0]), "sc": ((61) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 52, 0]), "sc": ((62) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 53, 0]), "sc": ((63) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 54, 0]), "sc": ((64) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 55, 0]), "sc": ((65) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 56, 0]), "sc": ((66) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 57, 0]), "sc": ((67) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 49, 48, 0]), "sc": ((68) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([78, 117, 109, 76, 99, 107, 0]), "sc": ((69) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([83, 99, 114, 76, 99, 107, 0]), "sc": ((70) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 55, 0]), "sc": ((71) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 56, 0]), "sc": ((72) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 57, 0]), "sc": ((73) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 45, 0]), "sc": ((74) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 52, 0]), "sc": ((75) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 53, 0]), "sc": ((76) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 54, 0]), "sc": ((77) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 43, 0]), "sc": ((78) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 49, 0]), "sc": ((79) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 50, 0]), "sc": ((80) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 51, 0]), "sc": ((81) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 48, 0]), "sc": ((82) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 46, 0]), "sc": ((83) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([76, 101, 115, 115, 84, 104, 97, 110, 0]), "sc": ((86) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 49, 49, 0]), "sc": ((87) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 49, 50, 0]), "sc": ((88) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 100, 69, 110, 116, 0]), "sc": ((156) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([82, 67, 116, 114, 108, 0]), "sc": ((157) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 47, 0]), "sc": ((181) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([82, 65, 108, 116, 0]), "sc": ((184) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([80, 114, 116, 83, 99, 110, 0]), "sc": ((183) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([80, 97, 117, 115, 101, 0]), "sc": ((197) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([72, 111, 109, 101, 0]), "sc": ((199) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([85, 112, 0]), "sc": ((200) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([80, 103, 85, 112, 0]), "sc": ((201) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([76, 101, 102, 116, 0]), "sc": ((203) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([82, 105, 103, 104, 116, 0]), "sc": ((205) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([69, 110, 100, 0]), "sc": ((207) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([68, 111, 119, 110, 0]), "sc": ((208) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([80, 103, 68, 110, 0]), "sc": ((209) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([73, 110, 115, 101, 114, 116, 0]), "sc": ((210) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([68, 101, 108, 101, 116, 101, 0]), "sc": ((211) & 255)}, null, {})]);
function __cxx_static_address_bf2499a8344b485d5c712947() {
  return __cxx_static_address_bf2499a8344b485d5c712947.reference || (__cxx_static_address_bf2499a8344b485d5c712947.reference = {
    __cReference: true,
    get value() { return sctokeylut__header_global_7167dc91fd479953; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export function ARRAY_SIZE__header_78ca1afef65b(arg0) {
  return u64(31n);
}

export function ARRAY_SIZE__header_1b7eba0688f8(arg0) {
  return u64(1n);
}

export function bitmap_test__header_5cc6c8232c10(ptr, n) {

  return Boolean((i32((i32((cDeref(cPointerOffset(ptr, i32((n >> 3)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & i32((cDeref(cPointerOffset(pow2char__header_global_9393851f0c146808, i32((n & 7)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))) == i32((cDeref(cPointerOffset(pow2char__header_global_9393851f0c146808, i32((n & 7)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))));
}

export function SILENCE_UNUSED__header_19ce759deb00(arg0, arg1, arg2) {

}

// C/C++ source: @sysroot/usr/include/c++/12/bits/stl_algobase.h:230
export function min__template_774131ccff66371d(__a, __b) {
  if ((__b.value < __a.value)) {
    return __b;
  }
  return __a;
}

export function bitmap_clear__header_fe7b22c48bc9(ptr, n) {

  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = (((__cxx_lvalue_0.value & (~i32((cDeref(cPointerOffset(pow2char__header_global_9393851f0c146808, i32((n & 7)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))))) & 255)))(cDeref(cPointerOffset(ptr, i32((n >> 3)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array));
}

export function bitmap_set__header_da3c41727d5a(ptr, n) {

  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = (((__cxx_lvalue_0.value | i32((cDeref(cPointerOffset(pow2char__header_global_9393851f0c146808, i32((n & 7)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))) & 255)))(cDeref(cPointerOffset(ptr, i32((n >> 3)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array));
}

export function clamp__header_f1396d347458(__cxx_in, min, max) {
  return i32(((__cxx_in <= i32(min)) ? i32(min) : ((__cxx_in >= i32(max)) ? i32(max) : __cxx_in)));
}

export function ARRAY_SIZE__header_bd4fa82976e1(arg0) {
  return u64(1024n);
}

// C/C++ source: source/duke3d/src/gamedef.cpp:1235
export function Bstrncpyz__header_20d79fc0de0e(dst, src, n) {
  if ((n > u64(0))) {
    cByteMemory.memcpy(dst, src, (min__template_c237f4424e2bda8a(((__cxx_lvalue_0) => cRef(() => __cxx_lvalue_0, () => { throw new TypeError("const C++ reference write"); }))((BigInt(cByteMemory.strlen(src)) + BigInt(u64(1)))), ((__cxx_lvalue_1) => cRef(() => __cxx_lvalue_1, () => { throw new TypeError("const C++ reference write"); }))((BigInt(n) - BigInt(u64(1)))))).value);
    ((cDeref(cPointerOffset(dst, (BigInt(n) - BigInt(u64(1))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = ((0) & 255));
  }
  return dst;
}

export function ARRAY_SIZE__header_6acb20764cfa(arg0) {
  return u64(48n);
}

export function ARRAY_SIZE__header_fc0707ff3649(arg0) {
  return u64(6n);
}

export function swap__header_9ca3dca17ecb(a, b) {
  let t = i64((cDeref(a, BigInt64Array).value));
  ((cDeref(a, BigInt64Array).value) = i64((cDeref(b, BigInt64Array).value)));
  ((cDeref(b, BigInt64Array).value) = i64(t));
}

// C/C++ source: source/build/include/smmalloc.h:859
export function _sm_malloc(allocator, bytesCount, alignment) {
  return cRecordObject(allocator).Alloc(bytesCount, alignment);
}

// C/C++ source: source/build/include/smmalloc.h:866
export function _sm_realloc(allocator, p, bytesCount, alignment) {
  return cRecordObject(allocator).Realloc(p, bytesCount, alignment);
}

// C/C++ source: source/build/include/smmalloc.h:864
export function _sm_free(allocator, p) {
  return cRecordObject(allocator).Free(p);
}

// C/C++ source: @sysroot/usr/include/c++/12/bits/stl_algobase.h:230
export function min__template_c237f4424e2bda8a(__a, __b) {
  if ((__b.value < __a.value)) {
    return __b;
  }
  return __a;
}
