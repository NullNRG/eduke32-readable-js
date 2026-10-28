// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/duke3d/src/sector.cpp
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

const i32 = value => Number(value) | 0;
const u32 = value => Number(value) >>> 0;
const i64 = value => BigInt.asIntN(64, BigInt(value));
const u64 = value => BigInt.asUintN(64, BigInt(value));

// C/C++ source: source/build/include/fix16.h:111
export const fix16_rad_to_deg_mult__header_global_fd80642cbd2fc2a2 = i32(3754936);
function __cxx_static_address_9a14eda05a6dcc4f17d56c3e() {
  return __cxx_static_address_9a14eda05a6dcc4f17d56c3e.reference || (__cxx_static_address_9a14eda05a6dcc4f17d56c3e.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_fd80642cbd2fc2a2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_238b36c37aa98bb7 = i32(1144);
function __cxx_static_address_b8e8dd0b04ccad6589bb2f1e() {
  return __cxx_static_address_b8e8dd0b04ccad6589bb2f1e.reference || (__cxx_static_address_b8e8dd0b04ccad6589bb2f1e.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_238b36c37aa98bb7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:43
export const KICK_HIT____header_global_1be81c24cb7cc01b = ((((((0) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6fb0a6d3dd6f783c285116f8() {
  return __cxx_static_address_6fb0a6d3dd6f783c285116f8.reference || (__cxx_static_address_6fb0a6d3dd6f783c285116f8.reference = {
    __cReference: true,
    get value() { return KICK_HIT____header_global_1be81c24cb7cc01b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:44
export const PISTOL_RICOCHET____header_global_4c0e5c045d81669f = ((((((1) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f6d3f2fdd5ea3b71581add99() {
  return __cxx_static_address_f6d3f2fdd5ea3b71581add99.reference || (__cxx_static_address_f6d3f2fdd5ea3b71581add99.reference = {
    __cReference: true,
    get value() { return PISTOL_RICOCHET____header_global_4c0e5c045d81669f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:45
export const PISTOL_BODYHIT____header_global_01b6b0f10a62ba12 = ((((((2) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_51c05305cd21e3917ce73b65() {
  return __cxx_static_address_51c05305cd21e3917ce73b65.reference || (__cxx_static_address_51c05305cd21e3917ce73b65.reference = {
    __cReference: true,
    get value() { return PISTOL_BODYHIT____header_global_01b6b0f10a62ba12; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:46
export const PISTOL_FIRE____header_global_db470d1b61758aa1 = ((((((3) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8b09c2888e1fa8bc98b0b335() {
  return __cxx_static_address_8b09c2888e1fa8bc98b0b335.reference || (__cxx_static_address_8b09c2888e1fa8bc98b0b335.reference = {
    __cReference: true,
    get value() { return PISTOL_FIRE____header_global_db470d1b61758aa1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:47
export const EJECT_CLIP____header_global_7c7529cf81527bd8 = ((((((4) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fc27ca647fa887f50e17d225() {
  return __cxx_static_address_fc27ca647fa887f50e17d225.reference || (__cxx_static_address_fc27ca647fa887f50e17d225.reference = {
    __cReference: true,
    get value() { return EJECT_CLIP____header_global_7c7529cf81527bd8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:48
export const INSERT_CLIP____header_global_c247a13310356634 = ((((((5) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_53297f3bccea5757bde6b7a1() {
  return __cxx_static_address_53297f3bccea5757bde6b7a1.reference || (__cxx_static_address_53297f3bccea5757bde6b7a1.reference = {
    __cReference: true,
    get value() { return INSERT_CLIP____header_global_c247a13310356634; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:49
export const CHAINGUN_FIRE____header_global_ad720acc0b7f7d8f = ((((((6) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6d9462a65b17b261e2e705d3() {
  return __cxx_static_address_6d9462a65b17b261e2e705d3.reference || (__cxx_static_address_6d9462a65b17b261e2e705d3.reference = {
    __cReference: true,
    get value() { return CHAINGUN_FIRE____header_global_ad720acc0b7f7d8f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:50
export const RPG_SHOOT____header_global_6a45730cc3011050 = ((((((7) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b27f3c2fabaac9c39b2c4b32() {
  return __cxx_static_address_b27f3c2fabaac9c39b2c4b32.reference || (__cxx_static_address_b27f3c2fabaac9c39b2c4b32.reference = {
    __cReference: true,
    get value() { return RPG_SHOOT____header_global_6a45730cc3011050; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:51
export const POOLBALLHIT____header_global_01b9474a5a3bdcd5 = ((((((8) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_10deeccb85bbfebe0b836e1f() {
  return __cxx_static_address_10deeccb85bbfebe0b836e1f.reference || (__cxx_static_address_10deeccb85bbfebe0b836e1f.reference = {
    __cReference: true,
    get value() { return POOLBALLHIT____header_global_01b9474a5a3bdcd5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:52
export const RPG_EXPLODE____header_global_4ecf60ea44713dc1 = ((((((9) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2f4a8c03836d8d54b0ead37f() {
  return __cxx_static_address_2f4a8c03836d8d54b0ead37f.reference || (__cxx_static_address_2f4a8c03836d8d54b0ead37f.reference = {
    __cReference: true,
    get value() { return RPG_EXPLODE____header_global_4ecf60ea44713dc1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:53
export const CAT_FIRE____header_global_5c20e5abb718acd3 = ((((((10) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_14127c079941350b70d926f4() {
  return __cxx_static_address_14127c079941350b70d926f4.reference || (__cxx_static_address_14127c079941350b70d926f4.reference = {
    __cReference: true,
    get value() { return CAT_FIRE____header_global_5c20e5abb718acd3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:54
export const SHRINKER_FIRE____header_global_1409fb922a0b5356 = ((((((11) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ea204b60114d93bea3d76c19() {
  return __cxx_static_address_ea204b60114d93bea3d76c19.reference || (__cxx_static_address_ea204b60114d93bea3d76c19.reference = {
    __cReference: true,
    get value() { return SHRINKER_FIRE____header_global_1409fb922a0b5356; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:55
export const PIPEBOMB_BOUNCE____header_global_a5d477e0c9d26046 = ((((((13) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4514d5d2384333b7fd1c3261() {
  return __cxx_static_address_4514d5d2384333b7fd1c3261.reference || (__cxx_static_address_4514d5d2384333b7fd1c3261.reference = {
    __cReference: true,
    get value() { return PIPEBOMB_BOUNCE____header_global_a5d477e0c9d26046; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:56
export const PIPEBOMB_EXPLODE____header_global_6d1785b7c66988bd = ((((((14) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f1b352b6065006e065431c81() {
  return __cxx_static_address_f1b352b6065006e065431c81.reference || (__cxx_static_address_f1b352b6065006e065431c81.reference = {
    __cReference: true,
    get value() { return PIPEBOMB_EXPLODE____header_global_6d1785b7c66988bd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:57
export const LASERTRIP_ONWALL____header_global_8d0e250bbc6d83e2 = ((((((15) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_615d5fdae53b8ebfaf81319c() {
  return __cxx_static_address_615d5fdae53b8ebfaf81319c.reference || (__cxx_static_address_615d5fdae53b8ebfaf81319c.reference = {
    __cReference: true,
    get value() { return LASERTRIP_ONWALL____header_global_8d0e250bbc6d83e2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:58
export const LASERTRIP_ARMING____header_global_38b0ace22dd3241f = ((((((16) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e055a42e2939c95dd7b08a11() {
  return __cxx_static_address_e055a42e2939c95dd7b08a11.reference || (__cxx_static_address_e055a42e2939c95dd7b08a11.reference = {
    __cReference: true,
    get value() { return LASERTRIP_ARMING____header_global_38b0ace22dd3241f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:59
export const LASERTRIP_EXPLODE____header_global_24c1ac11112b071b = ((((((17) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2d95964ab06798654ebcbd86() {
  return __cxx_static_address_2d95964ab06798654ebcbd86.reference || (__cxx_static_address_2d95964ab06798654ebcbd86.reference = {
    __cReference: true,
    get value() { return LASERTRIP_EXPLODE____header_global_24c1ac11112b071b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:60
export const VENT_BUST____header_global_984f532be3a4fc24 = ((((((18) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bfcfee9d14e1f21fbef3c1bf() {
  return __cxx_static_address_bfcfee9d14e1f21fbef3c1bf.reference || (__cxx_static_address_bfcfee9d14e1f21fbef3c1bf.reference = {
    __cReference: true,
    get value() { return VENT_BUST____header_global_984f532be3a4fc24; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:61
export const GLASS_BREAKING____header_global_6353fe921143ad82 = ((((((19) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_401a2e5e0c189dafd9333265() {
  return __cxx_static_address_401a2e5e0c189dafd9333265.reference || (__cxx_static_address_401a2e5e0c189dafd9333265.reference = {
    __cReference: true,
    get value() { return GLASS_BREAKING____header_global_6353fe921143ad82; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:62
export const GLASS_HEAVYBREAK____header_global_c15f5548acd8be18 = ((((((20) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fe75a24e0a831f514b8b8372() {
  return __cxx_static_address_fe75a24e0a831f514b8b8372.reference || (__cxx_static_address_fe75a24e0a831f514b8b8372.reference = {
    __cReference: true,
    get value() { return GLASS_HEAVYBREAK____header_global_c15f5548acd8be18; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:63
export const SHORT_CIRCUIT____header_global_648ce61f4c7044dd = ((((((21) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c4f754c42dc1955be52fbe89() {
  return __cxx_static_address_c4f754c42dc1955be52fbe89.reference || (__cxx_static_address_c4f754c42dc1955be52fbe89.reference = {
    __cReference: true,
    get value() { return SHORT_CIRCUIT____header_global_648ce61f4c7044dd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:64
export const ITEM_SPLASH____header_global_7f1ce827533fb16b = ((((((22) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0b6342ebf720b844b7741f37() {
  return __cxx_static_address_0b6342ebf720b844b7741f37.reference || (__cxx_static_address_0b6342ebf720b844b7741f37.reference = {
    __cReference: true,
    get value() { return ITEM_SPLASH____header_global_7f1ce827533fb16b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:65
export const DUKE_GASP____header_global_2862321ca5aefd5b = ((((((25) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0f9cd9d061b25f29828914f5() {
  return __cxx_static_address_0f9cd9d061b25f29828914f5.reference || (__cxx_static_address_0f9cd9d061b25f29828914f5.reference = {
    __cReference: true,
    get value() { return DUKE_GASP____header_global_2862321ca5aefd5b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:66
export const SLIM_RECOG____header_global_b498a43adc053267 = ((((((26) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_51abc1492deccf01a29d5c56() {
  return __cxx_static_address_51abc1492deccf01a29d5c56.reference || (__cxx_static_address_51abc1492deccf01a29d5c56.reference = {
    __cReference: true,
    get value() { return SLIM_RECOG____header_global_b498a43adc053267; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:67
export const DUKE_URINATE____header_global_12e0580594822981 = ((((((28) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d4b6e774dfa897e40a584882() {
  return __cxx_static_address_d4b6e774dfa897e40a584882.reference || (__cxx_static_address_d4b6e774dfa897e40a584882.reference = {
    __cReference: true,
    get value() { return DUKE_URINATE____header_global_12e0580594822981; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:68
export const ENDSEQVOL3SND2____header_global_263852ae1a72bcc1 = ((((((29) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8f33af83936aeaeed055faed() {
  return __cxx_static_address_8f33af83936aeaeed055faed.reference || (__cxx_static_address_8f33af83936aeaeed055faed.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND2____header_global_263852ae1a72bcc1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:69
export const ENDSEQVOL3SND3____header_global_f1c557ec01f3aee3 = ((((((30) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d43e4ed75354f06a4602b563() {
  return __cxx_static_address_d43e4ed75354f06a4602b563.reference || (__cxx_static_address_d43e4ed75354f06a4602b563.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND3____header_global_f1c557ec01f3aee3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:70
export const DUKE_CRACK____header_global_750a7a62fbcbd4df = ((((((33) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fe0144eb7e336c7f001dfa30() {
  return __cxx_static_address_fe0144eb7e336c7f001dfa30.reference || (__cxx_static_address_fe0144eb7e336c7f001dfa30.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK____header_global_750a7a62fbcbd4df; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:71
export const SLIM_ATTACK____header_global_1021e0f5e8380809 = ((((((34) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_55fadd72166ba8e5885db84f() {
  return __cxx_static_address_55fadd72166ba8e5885db84f.reference || (__cxx_static_address_55fadd72166ba8e5885db84f.reference = {
    __cReference: true,
    get value() { return SLIM_ATTACK____header_global_1021e0f5e8380809; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:72
export const SOMETHINGHITFORCE____header_global_ac05a5f22d84497f = ((((((35) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_85c5a33833ba4775af470b79() {
  return __cxx_static_address_85c5a33833ba4775af470b79.reference || (__cxx_static_address_85c5a33833ba4775af470b79.reference = {
    __cReference: true,
    get value() { return SOMETHINGHITFORCE____header_global_ac05a5f22d84497f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:73
export const DUKE_DRINKING____header_global_acc3186d6fb5f1a6 = ((((((36) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_334d2758e85bbaad1c552957() {
  return __cxx_static_address_334d2758e85bbaad1c552957.reference || (__cxx_static_address_334d2758e85bbaad1c552957.reference = {
    __cReference: true,
    get value() { return DUKE_DRINKING____header_global_acc3186d6fb5f1a6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:74
export const DUKE_GRUNT____header_global_ba9e12ca6077e261 = ((((((38) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eec4ef60deccc67c4de7d663() {
  return __cxx_static_address_eec4ef60deccc67c4de7d663.reference || (__cxx_static_address_eec4ef60deccc67c4de7d663.reference = {
    __cReference: true,
    get value() { return DUKE_GRUNT____header_global_ba9e12ca6077e261; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:75
export const DUKE_HARTBEAT____header_global_78117741c8f6c50b = ((((((39) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ef92fa45905a08ea11b80e34() {
  return __cxx_static_address_ef92fa45905a08ea11b80e34.reference || (__cxx_static_address_ef92fa45905a08ea11b80e34.reference = {
    __cReference: true,
    get value() { return DUKE_HARTBEAT____header_global_78117741c8f6c50b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:76
export const DUKE_ONWATER____header_global_37a657133644e914 = ((((((40) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_501cf0f4595da58bb4759fc8() {
  return __cxx_static_address_501cf0f4595da58bb4759fc8.reference || (__cxx_static_address_501cf0f4595da58bb4759fc8.reference = {
    __cReference: true,
    get value() { return DUKE_ONWATER____header_global_37a657133644e914; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:77
export const DUKE_LAND____header_global_3ae4220bcb966445 = ((((((42) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e16e0d7012864c95c7e67112() {
  return __cxx_static_address_e16e0d7012864c95c7e67112.reference || (__cxx_static_address_e16e0d7012864c95c7e67112.reference = {
    __cReference: true,
    get value() { return DUKE_LAND____header_global_3ae4220bcb966445; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:78
export const DUKE_WALKINDUCTS____header_global_1fa27d3c56dcc849 = ((((((43) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1af9c03f2b665d1925242d69() {
  return __cxx_static_address_1af9c03f2b665d1925242d69.reference || (__cxx_static_address_1af9c03f2b665d1925242d69.reference = {
    __cReference: true,
    get value() { return DUKE_WALKINDUCTS____header_global_1fa27d3c56dcc849; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:79
export const DUKE_UNDERWATER____header_global_43f7bfac6d272ed2 = ((((((48) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dcf5c3db610d0dca7cac72e9() {
  return __cxx_static_address_dcf5c3db610d0dca7cac72e9.reference || (__cxx_static_address_dcf5c3db610d0dca7cac72e9.reference = {
    __cReference: true,
    get value() { return DUKE_UNDERWATER____header_global_43f7bfac6d272ed2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:80
export const DUKE_JETPACK_ON____header_global_72af66a4e4c24474 = ((((((49) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_460ae88c1c19d1a9dfefd135() {
  return __cxx_static_address_460ae88c1c19d1a9dfefd135.reference || (__cxx_static_address_460ae88c1c19d1a9dfefd135.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_ON____header_global_72af66a4e4c24474; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:81
export const DUKE_JETPACK_IDLE____header_global_6d7f1aaadc8772e3 = ((((((50) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d38ae52132d464dfc4447944() {
  return __cxx_static_address_d38ae52132d464dfc4447944.reference || (__cxx_static_address_d38ae52132d464dfc4447944.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_IDLE____header_global_6d7f1aaadc8772e3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:82
export const DUKE_JETPACK_OFF____header_global_2e8320d0e8caa7eb = ((((((51) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4c81cf3a0d5543ab5c4527ca() {
  return __cxx_static_address_4c81cf3a0d5543ab5c4527ca.reference || (__cxx_static_address_4c81cf3a0d5543ab5c4527ca.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_OFF____header_global_2e8320d0e8caa7eb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:83
export const DUKETALKTOBOSS____header_global_68b9c179e17dd291 = ((((((56) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d3073ffef9871e60f8219e87() {
  return __cxx_static_address_d3073ffef9871e60f8219e87.reference || (__cxx_static_address_d3073ffef9871e60f8219e87.reference = {
    __cReference: true,
    get value() { return DUKETALKTOBOSS____header_global_68b9c179e17dd291; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:84
export const SQUISHED____header_global_ef432dfec9cef907 = ((((((69) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_79e38509db5e7d5b9ec0b437() {
  return __cxx_static_address_79e38509db5e7d5b9ec0b437.reference || (__cxx_static_address_79e38509db5e7d5b9ec0b437.reference = {
    __cReference: true,
    get value() { return SQUISHED____header_global_ef432dfec9cef907; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:85
export const TELEPORTER____header_global_91a36fc2c055fe7e = ((((((70) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_88fcbfe2ffc0571d17c7c9a3() {
  return __cxx_static_address_88fcbfe2ffc0571d17c7c9a3.reference || (__cxx_static_address_88fcbfe2ffc0571d17c7c9a3.reference = {
    __cReference: true,
    get value() { return TELEPORTER____header_global_91a36fc2c055fe7e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:86
export const ELEVATOR_ON____header_global_fc64dc37664b072e = ((((((71) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_39f1f0d7f45f4809c9fdb098() {
  return __cxx_static_address_39f1f0d7f45f4809c9fdb098.reference || (__cxx_static_address_39f1f0d7f45f4809c9fdb098.reference = {
    __cReference: true,
    get value() { return ELEVATOR_ON____header_global_fc64dc37664b072e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:87
export const ELEVATOR_OFF____header_global_df5520a83a7f55ca = ((((((73) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_657bfddb8f0dd03f6383b7cb() {
  return __cxx_static_address_657bfddb8f0dd03f6383b7cb.reference || (__cxx_static_address_657bfddb8f0dd03f6383b7cb.reference = {
    __cReference: true,
    get value() { return ELEVATOR_OFF____header_global_df5520a83a7f55ca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:88
export const SUBWAY____header_global_7faf0a441f856a40 = ((((((75) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_165a846fa8e10fb859fa40e7() {
  return __cxx_static_address_165a846fa8e10fb859fa40e7.reference || (__cxx_static_address_165a846fa8e10fb859fa40e7.reference = {
    __cReference: true,
    get value() { return SUBWAY____header_global_7faf0a441f856a40; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:89
export const SWITCH_ON____header_global_4a4db62813b4bde4 = ((((((76) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4bd68091208c0e15532df4e6() {
  return __cxx_static_address_4bd68091208c0e15532df4e6.reference || (__cxx_static_address_4bd68091208c0e15532df4e6.reference = {
    __cReference: true,
    get value() { return SWITCH_ON____header_global_4a4db62813b4bde4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:90
export const FLUSH_TOILET____header_global_3170a6e954d9ddfe = ((((((79) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f0a92247ef26730cc8c5085c() {
  return __cxx_static_address_f0a92247ef26730cc8c5085c.reference || (__cxx_static_address_f0a92247ef26730cc8c5085c.reference = {
    __cReference: true,
    get value() { return FLUSH_TOILET____header_global_3170a6e954d9ddfe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:91
export const EARTHQUAKE____header_global_4d5a50545e9cbf4d = ((((((81) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2638dbdc9b921f5ae93a0ca9() {
  return __cxx_static_address_2638dbdc9b921f5ae93a0ca9.reference || (__cxx_static_address_2638dbdc9b921f5ae93a0ca9.reference = {
    __cReference: true,
    get value() { return EARTHQUAKE____header_global_4d5a50545e9cbf4d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:92
export const END_OF_LEVEL_WARN____header_global_ff424befbaafac3c = ((((((83) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ef758f71781a554d389152ec() {
  return __cxx_static_address_ef758f71781a554d389152ec.reference || (__cxx_static_address_ef758f71781a554d389152ec.reference = {
    __cReference: true,
    get value() { return END_OF_LEVEL_WARN____header_global_ff424befbaafac3c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:93
export const WIND_AMBIENCE____header_global_a20debd2a29c5dc8 = ((((((91) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_95a0b4ceaacb97cc40bc3589() {
  return __cxx_static_address_95a0b4ceaacb97cc40bc3589.reference || (__cxx_static_address_95a0b4ceaacb97cc40bc3589.reference = {
    __cReference: true,
    get value() { return WIND_AMBIENCE____header_global_a20debd2a29c5dc8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:94
export const SOMETHING_DRIPPING____header_global_61c73bf2d2e5f2ee = ((((((92) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e0cb692310bba84ee40fb602() {
  return __cxx_static_address_e0cb692310bba84ee40fb602.reference || (__cxx_static_address_e0cb692310bba84ee40fb602.reference = {
    __cReference: true,
    get value() { return SOMETHING_DRIPPING____header_global_61c73bf2d2e5f2ee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:95
export const BOS1_RECOG____header_global_0cf7bccdd6498925 = ((((((97) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_53802c4a694ffe7e05e62d17() {
  return __cxx_static_address_53802c4a694ffe7e05e62d17.reference || (__cxx_static_address_53802c4a694ffe7e05e62d17.reference = {
    __cReference: true,
    get value() { return BOS1_RECOG____header_global_0cf7bccdd6498925; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:96
export const BOS2_RECOG____header_global_d2d60ac120d2aaac = ((((((102) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_056cc31453e84d5de3ef2b14() {
  return __cxx_static_address_056cc31453e84d5de3ef2b14.reference || (__cxx_static_address_056cc31453e84d5de3ef2b14.reference = {
    __cReference: true,
    get value() { return BOS2_RECOG____header_global_d2d60ac120d2aaac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:97
export const DUKE_GETWEAPON2____header_global_e65e3fff79faf6a6 = ((((((107) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2a158e6e156a586b4bc83aa6() {
  return __cxx_static_address_2a158e6e156a586b4bc83aa6.reference || (__cxx_static_address_2a158e6e156a586b4bc83aa6.reference = {
    __cReference: true,
    get value() { return DUKE_GETWEAPON2____header_global_e65e3fff79faf6a6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:98
export const SHOTGUN_FIRE____header_global_6f65c698fd30cda8 = ((((((109) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bf5184391a6a17bdbcbc35a2() {
  return __cxx_static_address_bf5184391a6a17bdbcbc35a2.reference || (__cxx_static_address_bf5184391a6a17bdbcbc35a2.reference = {
    __cReference: true,
    get value() { return SHOTGUN_FIRE____header_global_6f65c698fd30cda8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:99
export const PRED_RECOG____header_global_e3b84de97febf4e7 = ((((((111) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7958e70f25860ecbf6edf14b() {
  return __cxx_static_address_7958e70f25860ecbf6edf14b.reference || (__cxx_static_address_7958e70f25860ecbf6edf14b.reference = {
    __cReference: true,
    get value() { return PRED_RECOG____header_global_e3b84de97febf4e7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:100
export const CAPT_RECOG____header_global_0bc15febd4797372 = ((((((117) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2518caac38ff305be6a3dede() {
  return __cxx_static_address_2518caac38ff305be6a3dede.reference || (__cxx_static_address_2518caac38ff305be6a3dede.reference = {
    __cReference: true,
    get value() { return CAPT_RECOG____header_global_0bc15febd4797372; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:101
export const PIG_RECOG____header_global_d2528170b53c4826 = ((((((121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e1dfd593327afa50d74377ad() {
  return __cxx_static_address_e1dfd593327afa50d74377ad.reference || (__cxx_static_address_e1dfd593327afa50d74377ad.reference = {
    __cReference: true,
    get value() { return PIG_RECOG____header_global_d2528170b53c4826; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:102
export const RECO_ROAM____header_global_afaf02b36f8a2ddd = ((((((125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_042fe093ca4d3bbb2605fb30() {
  return __cxx_static_address_042fe093ca4d3bbb2605fb30.reference || (__cxx_static_address_042fe093ca4d3bbb2605fb30.reference = {
    __cReference: true,
    get value() { return RECO_ROAM____header_global_afaf02b36f8a2ddd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:103
export const RECO_RECOG____header_global_247a8a0bdf3a5851 = ((((((126) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ede5e94e656061503718b95f() {
  return __cxx_static_address_ede5e94e656061503718b95f.reference || (__cxx_static_address_ede5e94e656061503718b95f.reference = {
    __cReference: true,
    get value() { return RECO_RECOG____header_global_247a8a0bdf3a5851; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:104
export const RECO_ATTACK____header_global_6e95b6f8f1daf37a = ((((((127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_69c2fd88f21ab080adf154c1() {
  return __cxx_static_address_69c2fd88f21ab080adf154c1.reference || (__cxx_static_address_69c2fd88f21ab080adf154c1.reference = {
    __cReference: true,
    get value() { return RECO_ATTACK____header_global_6e95b6f8f1daf37a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:105
export const RECO_PAIN____header_global_b6dc4b254507421f = ((((((128) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d3f2283aa10380365c7fe492() {
  return __cxx_static_address_d3f2283aa10380365c7fe492.reference || (__cxx_static_address_d3f2283aa10380365c7fe492.reference = {
    __cReference: true,
    get value() { return RECO_PAIN____header_global_b6dc4b254507421f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:106
export const DRON_RECOG____header_global_a4f0d97a8fa95ded = ((((((131) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6c3dd22d7c542677f51e400d() {
  return __cxx_static_address_6c3dd22d7c542677f51e400d.reference || (__cxx_static_address_6c3dd22d7c542677f51e400d.reference = {
    __cReference: true,
    get value() { return DRON_RECOG____header_global_a4f0d97a8fa95ded; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:107
export const COMM_RECOG____header_global_1c87c291421566a2 = ((((((136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_16ff775921aed9f5f58047db() {
  return __cxx_static_address_16ff775921aed9f5f58047db.reference || (__cxx_static_address_16ff775921aed9f5f58047db.reference = {
    __cReference: true,
    get value() { return COMM_RECOG____header_global_1c87c291421566a2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:108
export const OCTA_RECOG____header_global_0926614e32139781 = ((((((141) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_489d46c3e2fde369f259ed57() {
  return __cxx_static_address_489d46c3e2fde369f259ed57.reference || (__cxx_static_address_489d46c3e2fde369f259ed57.reference = {
    __cReference: true,
    get value() { return OCTA_RECOG____header_global_0926614e32139781; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:109
export const TURR_RECOG____header_global_f57bf816cf02aadd = ((((((146) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0d36795a88365ead46026674() {
  return __cxx_static_address_0d36795a88365ead46026674.reference || (__cxx_static_address_0d36795a88365ead46026674.reference = {
    __cReference: true,
    get value() { return TURR_RECOG____header_global_f57bf816cf02aadd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:110
export const SLIM_DYING____header_global_b0dc784f847b8903 = ((((((149) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a303450d401b20c93db54266() {
  return __cxx_static_address_a303450d401b20c93db54266.reference || (__cxx_static_address_a303450d401b20c93db54266.reference = {
    __cReference: true,
    get value() { return SLIM_DYING____header_global_b0dc784f847b8903; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:111
export const BOS3_RECOG____header_global_d3e770edf0cf16ca = ((((((151) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_51c483971f6e8bd44fe0b693() {
  return __cxx_static_address_51c483971f6e8bd44fe0b693.reference || (__cxx_static_address_51c483971f6e8bd44fe0b693.reference = {
    __cReference: true,
    get value() { return BOS3_RECOG____header_global_d3e770edf0cf16ca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:112
export const BOS1_WALK____header_global_eae0b9489beec16a = ((((((156) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dc05e11b685dcf054c6b3d25() {
  return __cxx_static_address_dc05e11b685dcf054c6b3d25.reference || (__cxx_static_address_dc05e11b685dcf054c6b3d25.reference = {
    __cReference: true,
    get value() { return BOS1_WALK____header_global_eae0b9489beec16a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:113
export const THUD____header_global_46a750ed955d5096 = ((((((158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c59186511ecdbb9834112df3() {
  return __cxx_static_address_c59186511ecdbb9834112df3.reference || (__cxx_static_address_c59186511ecdbb9834112df3.reference = {
    __cReference: true,
    get value() { return THUD____header_global_46a750ed955d5096; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:114
export const WIERDSHOT_FLY____header_global_5e0906a7d6289803 = ((((((160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_15330a22683fe21e4a88a405() {
  return __cxx_static_address_15330a22683fe21e4a88a405.reference || (__cxx_static_address_15330a22683fe21e4a88a405.reference = {
    __cReference: true,
    get value() { return WIERDSHOT_FLY____header_global_5e0906a7d6289803; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:115
export const SLIM_ROAM____header_global_a65bab65825820ab = ((((((163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e8c72fed43d5a9bfcbae0375() {
  return __cxx_static_address_e8c72fed43d5a9bfcbae0375.reference || (__cxx_static_address_e8c72fed43d5a9bfcbae0375.reference = {
    __cReference: true,
    get value() { return SLIM_ROAM____header_global_a65bab65825820ab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:116
export const SHOTGUN_COCK____header_global_fafe69762e25ecc7 = ((((((169) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bc6ec74967e12f96e25ca630() {
  return __cxx_static_address_bc6ec74967e12f96e25ca630.reference || (__cxx_static_address_bc6ec74967e12f96e25ca630.reference = {
    __cReference: true,
    get value() { return SHOTGUN_COCK____header_global_fafe69762e25ecc7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:117
export const GENERIC_AMBIENCE17____header_global_c73737cf2750659a = ((((((177) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6011a9b218761892c8e5ce38() {
  return __cxx_static_address_6011a9b218761892c8e5ce38.reference || (__cxx_static_address_6011a9b218761892c8e5ce38.reference = {
    __cReference: true,
    get value() { return GENERIC_AMBIENCE17____header_global_c73737cf2750659a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:118
export const BONUS_SPEECH1____header_global_00f666741f29bd20 = ((((((195) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6c068e063b659cb2c9cc7d6c() {
  return __cxx_static_address_6c068e063b659cb2c9cc7d6c.reference || (__cxx_static_address_6c068e063b659cb2c9cc7d6c.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH1____header_global_00f666741f29bd20; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:119
export const BONUS_SPEECH2____header_global_e0fef84cf710ada3 = ((((((196) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c23c019b1a513e15cdcc7864() {
  return __cxx_static_address_c23c019b1a513e15cdcc7864.reference || (__cxx_static_address_c23c019b1a513e15cdcc7864.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH2____header_global_e0fef84cf710ada3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:120
export const BONUS_SPEECH3____header_global_52dfe4b85ef3a484 = ((((((197) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d6584d37394c5f716c3d2b95() {
  return __cxx_static_address_d6584d37394c5f716c3d2b95.reference || (__cxx_static_address_d6584d37394c5f716c3d2b95.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH3____header_global_52dfe4b85ef3a484; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:121
export const BONUS_SPEECH4____header_global_5c32a971aa814dc0 = ((((((199) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6379dc87042702c4b85cb267() {
  return __cxx_static_address_6379dc87042702c4b85cb267.reference || (__cxx_static_address_6379dc87042702c4b85cb267.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH4____header_global_5c32a971aa814dc0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:122
export const DUKE_LAND_HURT____header_global_a8e906fadde3edb5 = ((((((200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_47ddccf872e587ec8fd0d9d9() {
  return __cxx_static_address_47ddccf872e587ec8fd0d9d9.reference || (__cxx_static_address_47ddccf872e587ec8fd0d9d9.reference = {
    __cReference: true,
    get value() { return DUKE_LAND_HURT____header_global_a8e906fadde3edb5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:123
export const DUKE_SEARCH2____header_global_2f56e19173fe4be1 = ((((((207) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_424600a42a8fa80232f3e0ee() {
  return __cxx_static_address_424600a42a8fa80232f3e0ee.reference || (__cxx_static_address_424600a42a8fa80232f3e0ee.reference = {
    __cReference: true,
    get value() { return DUKE_SEARCH2____header_global_2f56e19173fe4be1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:124
export const DUKE_CRACK2____header_global_4c6216b69c6559e6 = ((((((208) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_09358c87a729f352d64a6d74() {
  return __cxx_static_address_09358c87a729f352d64a6d74.reference || (__cxx_static_address_09358c87a729f352d64a6d74.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK2____header_global_4c6216b69c6559e6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:125
export const DUKE_SEARCH____header_global_a723a4573830f5c0 = ((((((209) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_15a10911a117a76ed8f1a982() {
  return __cxx_static_address_15a10911a117a76ed8f1a982.reference || (__cxx_static_address_15a10911a117a76ed8f1a982.reference = {
    __cReference: true,
    get value() { return DUKE_SEARCH____header_global_a723a4573830f5c0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:126
export const DUKE_GET____header_global_0f1e38672b2f8ee6 = ((((((210) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2a389e698837820876646b16() {
  return __cxx_static_address_2a389e698837820876646b16.reference || (__cxx_static_address_2a389e698837820876646b16.reference = {
    __cReference: true,
    get value() { return DUKE_GET____header_global_0f1e38672b2f8ee6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:127
export const DUKE_LONGTERM_PAIN____header_global_80fbb7e3fcbc5e9c = ((((((211) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_de6e15eecd3ab25e23f89e74() {
  return __cxx_static_address_de6e15eecd3ab25e23f89e74.reference || (__cxx_static_address_de6e15eecd3ab25e23f89e74.reference = {
    __cReference: true,
    get value() { return DUKE_LONGTERM_PAIN____header_global_80fbb7e3fcbc5e9c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:128
export const MONITOR_ACTIVE____header_global_6619226b4929e3e0 = ((((((212) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6778a88604300780ddad6b79() {
  return __cxx_static_address_6778a88604300780ddad6b79.reference || (__cxx_static_address_6778a88604300780ddad6b79.reference = {
    __cReference: true,
    get value() { return MONITOR_ACTIVE____header_global_6619226b4929e3e0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:129
export const NITEVISION_ONOFF____header_global_e81893f6999f9e38 = ((((((213) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e9ba0cdd428024f06cb90c53() {
  return __cxx_static_address_e9ba0cdd428024f06cb90c53.reference || (__cxx_static_address_e9ba0cdd428024f06cb90c53.reference = {
    __cReference: true,
    get value() { return NITEVISION_ONOFF____header_global_e81893f6999f9e38; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:130
export const DUKE_CRACK_FIRST____header_global_c0481a141fb3eb5f = ((((((215) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_22e9c6cc72ab9620d8cafcf5() {
  return __cxx_static_address_22e9c6cc72ab9620d8cafcf5.reference || (__cxx_static_address_22e9c6cc72ab9620d8cafcf5.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK_FIRST____header_global_c0481a141fb3eb5f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:131
export const DUKE_USEMEDKIT____header_global_5f3a8a52a6583ac9 = ((((((216) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_801c0afb037d44da9adcada2() {
  return __cxx_static_address_801c0afb037d44da9adcada2.reference || (__cxx_static_address_801c0afb037d44da9adcada2.reference = {
    __cReference: true,
    get value() { return DUKE_USEMEDKIT____header_global_5f3a8a52a6583ac9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:132
export const DUKE_TAKEPILLS____header_global_a14256555d12716c = ((((((217) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4af87d0e536a504a6d8a534b() {
  return __cxx_static_address_4af87d0e536a504a6d8a534b.reference || (__cxx_static_address_4af87d0e536a504a6d8a534b.reference = {
    __cReference: true,
    get value() { return DUKE_TAKEPILLS____header_global_a14256555d12716c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:133
export const DUKE_PISSRELIEF____header_global_5cdd0f10646a5ffa = ((((((218) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2c0c30662c26a245e410331d() {
  return __cxx_static_address_2c0c30662c26a245e410331d.reference || (__cxx_static_address_2c0c30662c26a245e410331d.reference = {
    __cReference: true,
    get value() { return DUKE_PISSRELIEF____header_global_5cdd0f10646a5ffa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:134
export const SELECT_WEAPON____header_global_48ac11c63c4617ee = ((((((219) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3bcbf0f1bc138b7920de321c() {
  return __cxx_static_address_3bcbf0f1bc138b7920de321c.reference || (__cxx_static_address_3bcbf0f1bc138b7920de321c.reference = {
    __cReference: true,
    get value() { return SELECT_WEAPON____header_global_48ac11c63c4617ee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:135
export const JIBBED_ACTOR5____header_global_77cde34bd838ebb3 = ((((((226) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9437bff4b37f300d5ab676e6() {
  return __cxx_static_address_9437bff4b37f300d5ab676e6.reference || (__cxx_static_address_9437bff4b37f300d5ab676e6.reference = {
    __cReference: true,
    get value() { return JIBBED_ACTOR5____header_global_77cde34bd838ebb3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:136
export const JIBBED_ACTOR6____header_global_aa712654c60bb41a = ((((((227) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_27f8ee0bc5a5102a85027d91() {
  return __cxx_static_address_27f8ee0bc5a5102a85027d91.reference || (__cxx_static_address_27f8ee0bc5a5102a85027d91.reference = {
    __cReference: true,
    get value() { return JIBBED_ACTOR6____header_global_aa712654c60bb41a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:137
export const DUKE_GOTHEALTHATLOW____header_global_7aee10e52ca8d793 = ((((((229) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7eae73e7d7da95fa2822ec4d() {
  return __cxx_static_address_7eae73e7d7da95fa2822ec4d.reference || (__cxx_static_address_7eae73e7d7da95fa2822ec4d.reference = {
    __cReference: true,
    get value() { return DUKE_GOTHEALTHATLOW____header_global_7aee10e52ca8d793; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:138
export const BOSSTALKTODUKE____header_global_01757480ef0f42c8 = ((((((230) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b3dc3c451a4a96b01da988df() {
  return __cxx_static_address_b3dc3c451a4a96b01da988df.reference || (__cxx_static_address_b3dc3c451a4a96b01da988df.reference = {
    __cReference: true,
    get value() { return BOSSTALKTODUKE____header_global_01757480ef0f42c8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:139
export const WAR_AMBIENCE2____header_global_d8b5c6639f0555e7 = ((((((232) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d58887848d3d1598d7e7aeab() {
  return __cxx_static_address_d58887848d3d1598d7e7aeab.reference || (__cxx_static_address_d58887848d3d1598d7e7aeab.reference = {
    __cReference: true,
    get value() { return WAR_AMBIENCE2____header_global_d8b5c6639f0555e7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:140
export const EXITMENUSOUND____header_global_c6158b3c4f174bfe = ((((((243) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_140db3b1b1639926f16e61b5() {
  return __cxx_static_address_140db3b1b1639926f16e61b5.reference || (__cxx_static_address_140db3b1b1639926f16e61b5.reference = {
    __cReference: true,
    get value() { return EXITMENUSOUND____header_global_c6158b3c4f174bfe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:141
export const FLY_BY____header_global_a9675c67a1803031 = ((((((244) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_31090c1e45e4c2bb3e1178a3() {
  return __cxx_static_address_31090c1e45e4c2bb3e1178a3.reference || (__cxx_static_address_31090c1e45e4c2bb3e1178a3.reference = {
    __cReference: true,
    get value() { return FLY_BY____header_global_a9675c67a1803031; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:142
export const DUKE_SCREAM____header_global_3cf4e103fd97e84f = ((((((245) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_37cc0a965b0e97bbce0d7539() {
  return __cxx_static_address_37cc0a965b0e97bbce0d7539.reference || (__cxx_static_address_37cc0a965b0e97bbce0d7539.reference = {
    __cReference: true,
    get value() { return DUKE_SCREAM____header_global_3cf4e103fd97e84f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:143
export const SHRINKER_HIT____header_global_47b0116514a97aaa = ((((((246) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f23330e1329769875c4a6c24() {
  return __cxx_static_address_f23330e1329769875c4a6c24.reference || (__cxx_static_address_f23330e1329769875c4a6c24.reference = {
    __cReference: true,
    get value() { return SHRINKER_HIT____header_global_47b0116514a97aaa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:144
export const RATTY____header_global_429f57107c351590 = ((((((247) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eb5d72eb57ec29fad7a8fcd6() {
  return __cxx_static_address_eb5d72eb57ec29fad7a8fcd6.reference || (__cxx_static_address_eb5d72eb57ec29fad7a8fcd6.reference = {
    __cReference: true,
    get value() { return RATTY____header_global_429f57107c351590; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:145
export const BONUSMUSIC____header_global_f8c58bbceee78736 = ((((((249) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fd097a3978fff4a95804a127() {
  return __cxx_static_address_fd097a3978fff4a95804a127.reference || (__cxx_static_address_fd097a3978fff4a95804a127.reference = {
    __cReference: true,
    get value() { return BONUSMUSIC____header_global_f8c58bbceee78736; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:146
export const DUKE_GETWEAPON6____header_global_8189042826a44071 = ((((((264) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fed4433e0bb1b47f8f7b1301() {
  return __cxx_static_address_fed4433e0bb1b47f8f7b1301.reference || (__cxx_static_address_fed4433e0bb1b47f8f7b1301.reference = {
    __cReference: true,
    get value() { return DUKE_GETWEAPON6____header_global_8189042826a44071; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:147
export const ALIEN_SWITCH1____header_global_9cbe2aee8a0f2d05 = ((((((272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8c532395fa58a43fce042425() {
  return __cxx_static_address_8c532395fa58a43fce042425.reference || (__cxx_static_address_8c532395fa58a43fce042425.reference = {
    __cReference: true,
    get value() { return ALIEN_SWITCH1____header_global_9cbe2aee8a0f2d05; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:148
export const RIPHEADNECK____header_global_92a2cef5e5c0b002 = ((((((284) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_867764fbe6b84de6cd92c2d0() {
  return __cxx_static_address_867764fbe6b84de6cd92c2d0.reference || (__cxx_static_address_867764fbe6b84de6cd92c2d0.reference = {
    __cReference: true,
    get value() { return RIPHEADNECK____header_global_92a2cef5e5c0b002; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:149
export const ENDSEQVOL3SND4____header_global_839bef44728d3ad1 = ((((((288) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_347d884e1385f56339828539() {
  return __cxx_static_address_347d884e1385f56339828539.reference || (__cxx_static_address_347d884e1385f56339828539.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND4____header_global_839bef44728d3ad1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:150
export const ENDSEQVOL3SND5____header_global_fbec1fba26e7c2b3 = ((((((289) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b01f907829a9e73921b40d37() {
  return __cxx_static_address_b01f907829a9e73921b40d37.reference || (__cxx_static_address_b01f907829a9e73921b40d37.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND5____header_global_fbec1fba26e7c2b3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:151
export const ENDSEQVOL3SND6____header_global_3bde997f71968bdd = ((((((290) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dc82095b18bec68309b08999() {
  return __cxx_static_address_dc82095b18bec68309b08999.reference || (__cxx_static_address_dc82095b18bec68309b08999.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND6____header_global_3bde997f71968bdd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:152
export const ENDSEQVOL3SND7____header_global_a635b737c2e64722 = ((((((291) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7a1f71532e4c4bf95976656e() {
  return __cxx_static_address_7a1f71532e4c4bf95976656e.reference || (__cxx_static_address_7a1f71532e4c4bf95976656e.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND7____header_global_a635b737c2e64722; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:153
export const ENDSEQVOL3SND8____header_global_fba487741e43906c = ((((((292) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bfbc4a206b8a09dd5a4bbd08() {
  return __cxx_static_address_bfbc4a206b8a09dd5a4bbd08.reference || (__cxx_static_address_bfbc4a206b8a09dd5a4bbd08.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND8____header_global_fba487741e43906c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:154
export const ENDSEQVOL3SND9____header_global_c1461398856d42f2 = ((((((293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9fc6dd3eea1868aa6bfbe0b9() {
  return __cxx_static_address_9fc6dd3eea1868aa6bfbe0b9.reference || (__cxx_static_address_9fc6dd3eea1868aa6bfbe0b9.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND9____header_global_c1461398856d42f2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:155
export const WHIPYOURASS____header_global_f65955a4dbec3eec = ((((((294) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_79cb9d4447871dcf963a7b6d() {
  return __cxx_static_address_79cb9d4447871dcf963a7b6d.reference || (__cxx_static_address_79cb9d4447871dcf963a7b6d.reference = {
    __cReference: true,
    get value() { return WHIPYOURASS____header_global_f65955a4dbec3eec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:156
export const ENDSEQVOL2SND1____header_global_bc6a0a59806b5393 = ((((((295) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1c83bc5574071f78390a4673() {
  return __cxx_static_address_1c83bc5574071f78390a4673.reference || (__cxx_static_address_1c83bc5574071f78390a4673.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND1____header_global_bc6a0a59806b5393; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:157
export const ENDSEQVOL2SND2____header_global_b848c9358dd15d19 = ((((((296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_535ce9f8ca20e33faf6bcc01() {
  return __cxx_static_address_535ce9f8ca20e33faf6bcc01.reference || (__cxx_static_address_535ce9f8ca20e33faf6bcc01.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND2____header_global_b848c9358dd15d19; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:158
export const ENDSEQVOL2SND3____header_global_de8fd06fae7804df = ((((((297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b7240967f71612b83086fbf1() {
  return __cxx_static_address_b7240967f71612b83086fbf1.reference || (__cxx_static_address_b7240967f71612b83086fbf1.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND3____header_global_de8fd06fae7804df; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:159
export const ENDSEQVOL2SND4____header_global_f4458fd2d9f84317 = ((((((298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8add29017b4e53f77fe65bb7() {
  return __cxx_static_address_8add29017b4e53f77fe65bb7.reference || (__cxx_static_address_8add29017b4e53f77fe65bb7.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND4____header_global_f4458fd2d9f84317; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:160
export const ENDSEQVOL2SND5____header_global_1759d4d0033ac3e2 = ((((((299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_57038c08341b6476f374b0da() {
  return __cxx_static_address_57038c08341b6476f374b0da.reference || (__cxx_static_address_57038c08341b6476f374b0da.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND5____header_global_1759d4d0033ac3e2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:161
export const ENDSEQVOL2SND6____header_global_d41ea984d160e24d = ((((((300) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b1fc11d3f4d736bea7af5b52() {
  return __cxx_static_address_b1fc11d3f4d736bea7af5b52.reference || (__cxx_static_address_b1fc11d3f4d736bea7af5b52.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND6____header_global_d41ea984d160e24d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:162
export const ENDSEQVOL2SND7____header_global_5aabcc4aaae79650 = ((((((301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8854566917059b8729f75f83() {
  return __cxx_static_address_8854566917059b8729f75f83.reference || (__cxx_static_address_8854566917059b8729f75f83.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND7____header_global_5aabcc4aaae79650; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:163
export const SOMETHINGFROZE____header_global_e7a0c2fe5c422b24 = ((((((303) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ca352b5ffa865e3b776a8fb9() {
  return __cxx_static_address_ca352b5ffa865e3b776a8fb9.reference || (__cxx_static_address_ca352b5ffa865e3b776a8fb9.reference = {
    __cReference: true,
    get value() { return SOMETHINGFROZE____header_global_e7a0c2fe5c422b24; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:164
export const WIND_REPEAT____header_global_1a097fb89d67111f = ((((((308) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ebd9af6a2b5f1cf10a49839b() {
  return __cxx_static_address_ebd9af6a2b5f1cf10a49839b.reference || (__cxx_static_address_ebd9af6a2b5f1cf10a49839b.reference = {
    __cReference: true,
    get value() { return WIND_REPEAT____header_global_1a097fb89d67111f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:165
export const BOS4_RECOG____header_global_0d1fd27ea9c3b835 = ((((((342) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b0aa1aaaf88f195641ae940d() {
  return __cxx_static_address_b0aa1aaaf88f195641ae940d.reference || (__cxx_static_address_b0aa1aaaf88f195641ae940d.reference = {
    __cReference: true,
    get value() { return BOS4_RECOG____header_global_0d1fd27ea9c3b835; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:166
export const LIGHTNING_SLAP____header_global_2e77e3d056a2cc1b = ((((((351) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6f64452d7c3d780e943ab8d4() {
  return __cxx_static_address_6f64452d7c3d780e943ab8d4.reference || (__cxx_static_address_6f64452d7c3d780e943ab8d4.reference = {
    __cReference: true,
    get value() { return LIGHTNING_SLAP____header_global_2e77e3d056a2cc1b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:167
export const THUNDER____header_global_c5d06ded38e8fba1 = ((((((352) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_389a986e0d9f48c0034ff830() {
  return __cxx_static_address_389a986e0d9f48c0034ff830.reference || (__cxx_static_address_389a986e0d9f48c0034ff830.reference = {
    __cReference: true,
    get value() { return THUNDER____header_global_c5d06ded38e8fba1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:168
export const INTRO4_1____header_global_f8852d77ad47263e = ((((((363) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0603dbbb8adec39ec451e46f() {
  return __cxx_static_address_0603dbbb8adec39ec451e46f.reference || (__cxx_static_address_0603dbbb8adec39ec451e46f.reference = {
    __cReference: true,
    get value() { return INTRO4_1____header_global_f8852d77ad47263e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:169
export const INTRO4_2____header_global_a21a4bf6d2977a33 = ((((((364) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eda4f50a41b55eea0c5d9dd0() {
  return __cxx_static_address_eda4f50a41b55eea0c5d9dd0.reference || (__cxx_static_address_eda4f50a41b55eea0c5d9dd0.reference = {
    __cReference: true,
    get value() { return INTRO4_2____header_global_a21a4bf6d2977a33; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:170
export const INTRO4_3____header_global_18a84170d61d42f4 = ((((((365) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2be806d76ea9bcd8eb448571() {
  return __cxx_static_address_2be806d76ea9bcd8eb448571.reference || (__cxx_static_address_2be806d76ea9bcd8eb448571.reference = {
    __cReference: true,
    get value() { return INTRO4_3____header_global_18a84170d61d42f4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:171
export const INTRO4_4____header_global_ad2153c60d813f33 = ((((((366) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3e614abb2782df6b42ef4171() {
  return __cxx_static_address_3e614abb2782df6b42ef4171.reference || (__cxx_static_address_3e614abb2782df6b42ef4171.reference = {
    __cReference: true,
    get value() { return INTRO4_4____header_global_ad2153c60d813f33; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:172
export const INTRO4_5____header_global_4fe47dc1e827e884 = ((((((367) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_db79da89918f249da1fb9305() {
  return __cxx_static_address_db79da89918f249da1fb9305.reference || (__cxx_static_address_db79da89918f249da1fb9305.reference = {
    __cReference: true,
    get value() { return INTRO4_5____header_global_4fe47dc1e827e884; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:173
export const INTRO4_6____header_global_09c8998d0681fc64 = ((((((368) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a724ba43de04b92c3da511eb() {
  return __cxx_static_address_a724ba43de04b92c3da511eb.reference || (__cxx_static_address_a724ba43de04b92c3da511eb.reference = {
    __cReference: true,
    get value() { return INTRO4_6____header_global_09c8998d0681fc64; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:174
export const BOSS4_DEADSPEECH____header_global_029661c1bafe4569 = ((((((370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a1a1a35e2079e506e1e7e691() {
  return __cxx_static_address_a1a1a35e2079e506e1e7e691.reference || (__cxx_static_address_a1a1a35e2079e506e1e7e691.reference = {
    __cReference: true,
    get value() { return BOSS4_DEADSPEECH____header_global_029661c1bafe4569; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:175
export const BOSS4_FIRSTSEE____header_global_00a83a041e252944 = ((((((371) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e46c4dfaacc40812972f5e14() {
  return __cxx_static_address_e46c4dfaacc40812972f5e14.reference || (__cxx_static_address_e46c4dfaacc40812972f5e14.reference = {
    __cReference: true,
    get value() { return BOSS4_FIRSTSEE____header_global_00a83a041e252944; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:176
export const VOL4ENDSND1____header_global_f17297e28a6f7a68 = ((((((384) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d0baa0f33a90e268cc687c0e() {
  return __cxx_static_address_d0baa0f33a90e268cc687c0e.reference || (__cxx_static_address_d0baa0f33a90e268cc687c0e.reference = {
    __cReference: true,
    get value() { return VOL4ENDSND1____header_global_f17297e28a6f7a68; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:177
export const VOL4ENDSND2____header_global_c35c5c1784017bec = ((((((385) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_43410ffa8790cf66ee11ca81() {
  return __cxx_static_address_43410ffa8790cf66ee11ca81.reference || (__cxx_static_address_43410ffa8790cf66ee11ca81.reference = {
    __cReference: true,
    get value() { return VOL4ENDSND2____header_global_c35c5c1784017bec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:178
export const EXPANDERSHOOT____header_global_b037ea0f46ca41f1 = ((((((388) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_001df49d66cf143f74ea522b() {
  return __cxx_static_address_001df49d66cf143f74ea522b.reference || (__cxx_static_address_001df49d66cf143f74ea522b.reference = {
    __cReference: true,
    get value() { return EXPANDERSHOOT____header_global_b037ea0f46ca41f1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:179
export const INTRO4_B____header_global_f0573f03f080267d = ((((((392) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5bf275ddce1346e5d04f790f() {
  return __cxx_static_address_5bf275ddce1346e5d04f790f.reference || (__cxx_static_address_5bf275ddce1346e5d04f790f.reference = {
    __cReference: true,
    get value() { return INTRO4_B____header_global_f0573f03f080267d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:180
export const BIGBANG____header_global_b71f83737fd03ffe = ((((((393) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dfbf91fb721bbbb40d8ad02f() {
  return __cxx_static_address_dfbf91fb721bbbb40d8ad02f.reference || (__cxx_static_address_dfbf91fb721bbbb40d8ad02f.reference = {
    __cReference: true,
    get value() { return BIGBANG____header_global_b71f83737fd03ffe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:181
export const FLAMETHROWER_INTRO____header_global_2e3d69df2ef13d0b = ((((((398) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bdacc61cb7f62ccca0153b5c() {
  return __cxx_static_address_bdacc61cb7f62ccca0153b5c.reference || (__cxx_static_address_bdacc61cb7f62ccca0153b5c.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_INTRO____header_global_2e3d69df2ef13d0b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:182
export const FLAMETHROWER_LOOP____header_global_aedd453fb3a3e469 = ((((((399) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ef4fb1e8f493fc059eb1cc33() {
  return __cxx_static_address_ef4fb1e8f493fc059eb1cc33.reference || (__cxx_static_address_ef4fb1e8f493fc059eb1cc33.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_LOOP____header_global_aedd453fb3a3e469; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:183
export const FLAMETHROWER_END____header_global_7d4c49ae2d3b40d3 = ((((((400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_88a7e7dd0386bd5c690025fc() {
  return __cxx_static_address_88a7e7dd0386bd5c690025fc.reference || (__cxx_static_address_88a7e7dd0386bd5c690025fc.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_END____header_global_7d4c49ae2d3b40d3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:184
export const E5L7_DUKE_QUIT_YOU____header_global_88c778dd579f6966 = ((((((401) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6e09197d80c00bf318a2e425() {
  return __cxx_static_address_6e09197d80c00bf318a2e425.reference || (__cxx_static_address_6e09197d80c00bf318a2e425.reference = {
    __cReference: true,
    get value() { return E5L7_DUKE_QUIT_YOU____header_global_88c778dd579f6966; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:187
export const SECTOREFFECTOR____header_global_8fa98c4c2f9e1659 = ((((((1) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a60627dc048396098f8b9a78() {
  return __cxx_static_address_a60627dc048396098f8b9a78.reference || (__cxx_static_address_a60627dc048396098f8b9a78.reference = {
    __cReference: true,
    get value() { return SECTOREFFECTOR____header_global_8fa98c4c2f9e1659; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:188
export const ACTIVATOR____header_global_3646265701d30bf9 = ((((((2) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_abcfbb22468a1df99d47c62f() {
  return __cxx_static_address_abcfbb22468a1df99d47c62f.reference || (__cxx_static_address_abcfbb22468a1df99d47c62f.reference = {
    __cReference: true,
    get value() { return ACTIVATOR____header_global_3646265701d30bf9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:189
export const TOUCHPLATE____header_global_8bc8f90f7bd294ea = ((((((3) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9aae227c030b7499e1db0ef1() {
  return __cxx_static_address_9aae227c030b7499e1db0ef1.reference || (__cxx_static_address_9aae227c030b7499e1db0ef1.reference = {
    __cReference: true,
    get value() { return TOUCHPLATE____header_global_8bc8f90f7bd294ea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:190
export const ACTIVATORLOCKED____header_global_8a73a24c27f219cc = ((((((4) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_494570f6acde10c57a4290da() {
  return __cxx_static_address_494570f6acde10c57a4290da.reference || (__cxx_static_address_494570f6acde10c57a4290da.reference = {
    __cReference: true,
    get value() { return ACTIVATORLOCKED____header_global_8a73a24c27f219cc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:191
export const MUSICANDSFX____header_global_926d01c21158cce0 = ((((((5) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7b728ef6c6b9580385b1345d() {
  return __cxx_static_address_7b728ef6c6b9580385b1345d.reference || (__cxx_static_address_7b728ef6c6b9580385b1345d.reference = {
    __cReference: true,
    get value() { return MUSICANDSFX____header_global_926d01c21158cce0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:192
export const LOCATORS____header_global_298e51d4b8adcaa3 = ((((((6) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_97e30cea5454cc0344c29e1d() {
  return __cxx_static_address_97e30cea5454cc0344c29e1d.reference || (__cxx_static_address_97e30cea5454cc0344c29e1d.reference = {
    __cReference: true,
    get value() { return LOCATORS____header_global_298e51d4b8adcaa3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:193
export const CYCLER____header_global_d9963417df32b4d3 = ((((((7) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1a44ed493a6a9a503edaef87() {
  return __cxx_static_address_1a44ed493a6a9a503edaef87.reference || (__cxx_static_address_1a44ed493a6a9a503edaef87.reference = {
    __cReference: true,
    get value() { return CYCLER____header_global_d9963417df32b4d3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:194
export const MASTERSWITCH____header_global_78fdab20033f7fba = ((((((8) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9cc30128293b5ce7896095bf() {
  return __cxx_static_address_9cc30128293b5ce7896095bf.reference || (__cxx_static_address_9cc30128293b5ce7896095bf.reference = {
    __cReference: true,
    get value() { return MASTERSWITCH____header_global_78fdab20033f7fba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:195
export const RESPAWN____header_global_db58a21f4578b1e3 = ((((((9) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9a3a9db78df49c017c9d8e6c() {
  return __cxx_static_address_9a3a9db78df49c017c9d8e6c.reference || (__cxx_static_address_9a3a9db78df49c017c9d8e6c.reference = {
    __cReference: true,
    get value() { return RESPAWN____header_global_db58a21f4578b1e3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:196
export const GPSPEED____header_global_6a3540d861b28122 = ((((((10) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_294eb669846ce53b4e6499a6() {
  return __cxx_static_address_294eb669846ce53b4e6499a6.reference || (__cxx_static_address_294eb669846ce53b4e6499a6.reference = {
    __cReference: true,
    get value() { return GPSPEED____header_global_6a3540d861b28122; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:197
export const FOF____header_global_a8d2a7d4f5ae9aba = ((((((13) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9ee2f22984f67199bd84c8bb() {
  return __cxx_static_address_9ee2f22984f67199bd84c8bb.reference || (__cxx_static_address_9ee2f22984f67199bd84c8bb.reference = {
    __cReference: true,
    get value() { return FOF____header_global_a8d2a7d4f5ae9aba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:198
export const ARROW____header_global_46162ac71c07617f = ((((((20) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_929b18fe8bc4fdfba765cc00() {
  return __cxx_static_address_929b18fe8bc4fdfba765cc00.reference || (__cxx_static_address_929b18fe8bc4fdfba765cc00.reference = {
    __cReference: true,
    get value() { return ARROW____header_global_46162ac71c07617f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:199
export const FIRSTGUNSPRITE____header_global_d5b9c17c339d56b9 = ((((((21) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d9b46a679d2fc00313483e04() {
  return __cxx_static_address_d9b46a679d2fc00313483e04.reference || (__cxx_static_address_d9b46a679d2fc00313483e04.reference = {
    __cReference: true,
    get value() { return FIRSTGUNSPRITE____header_global_d5b9c17c339d56b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:200
export const CHAINGUNSPRITE____header_global_e1d9e2ba7faafe51 = ((((((22) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_189314231d668ac43e08f66d() {
  return __cxx_static_address_189314231d668ac43e08f66d.reference || (__cxx_static_address_189314231d668ac43e08f66d.reference = {
    __cReference: true,
    get value() { return CHAINGUNSPRITE____header_global_e1d9e2ba7faafe51; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:201
export const RPGSPRITE____header_global_33c39e8bf7ab165d = ((((((23) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4601254ca3327502eb31d580() {
  return __cxx_static_address_4601254ca3327502eb31d580.reference || (__cxx_static_address_4601254ca3327502eb31d580.reference = {
    __cReference: true,
    get value() { return RPGSPRITE____header_global_33c39e8bf7ab165d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:202
export const FREEZESPRITE____header_global_6288675d87fdc69e = ((((((24) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ec801f2e1b1a817cd84bce7b() {
  return __cxx_static_address_ec801f2e1b1a817cd84bce7b.reference || (__cxx_static_address_ec801f2e1b1a817cd84bce7b.reference = {
    __cReference: true,
    get value() { return FREEZESPRITE____header_global_6288675d87fdc69e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:203
export const SHRINKERSPRITE____header_global_bafe5f313bcacf34 = ((((((25) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5678fb826d6510977bab8bf6() {
  return __cxx_static_address_5678fb826d6510977bab8bf6.reference || (__cxx_static_address_5678fb826d6510977bab8bf6.reference = {
    __cReference: true,
    get value() { return SHRINKERSPRITE____header_global_bafe5f313bcacf34; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:204
export const HEAVYHBOMB____header_global_8e82d55baffefad6 = ((((((26) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_33adff93e4e0c80b761f3b05() {
  return __cxx_static_address_33adff93e4e0c80b761f3b05.reference || (__cxx_static_address_33adff93e4e0c80b761f3b05.reference = {
    __cReference: true,
    get value() { return HEAVYHBOMB____header_global_8e82d55baffefad6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:205
export const TRIPBOMBSPRITE____header_global_2958067e6e2fe0d6 = ((((((27) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b78574153c43aed815d3052a() {
  return __cxx_static_address_b78574153c43aed815d3052a.reference || (__cxx_static_address_b78574153c43aed815d3052a.reference = {
    __cReference: true,
    get value() { return TRIPBOMBSPRITE____header_global_2958067e6e2fe0d6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:206
export const SHOTGUNSPRITE____header_global_e14ba0997f748482 = ((((((28) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a87134cce59c3fdb4aafb651() {
  return __cxx_static_address_a87134cce59c3fdb4aafb651.reference || (__cxx_static_address_a87134cce59c3fdb4aafb651.reference = {
    __cReference: true,
    get value() { return SHOTGUNSPRITE____header_global_e14ba0997f748482; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:207
export const DEVISTATORSPRITE____header_global_09c8a74a7d056071 = ((((((29) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_76daa8c05667d08612331502() {
  return __cxx_static_address_76daa8c05667d08612331502.reference || (__cxx_static_address_76daa8c05667d08612331502.reference = {
    __cReference: true,
    get value() { return DEVISTATORSPRITE____header_global_09c8a74a7d056071; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:208
export const HEALTHBOX____header_global_c681415ffefac13c = ((((((30) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_32171f9a888801cd8ec2cd74() {
  return __cxx_static_address_32171f9a888801cd8ec2cd74.reference || (__cxx_static_address_32171f9a888801cd8ec2cd74.reference = {
    __cReference: true,
    get value() { return HEALTHBOX____header_global_c681415ffefac13c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:209
export const AMMOBOX____header_global_99e36d666f1546d7 = ((((((31) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8c8ca5a66c34bc2b3c999f33() {
  return __cxx_static_address_8c8ca5a66c34bc2b3c999f33.reference || (__cxx_static_address_8c8ca5a66c34bc2b3c999f33.reference = {
    __cReference: true,
    get value() { return AMMOBOX____header_global_99e36d666f1546d7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:210
export const GROWSPRITEICON____header_global_286ad50929155749 = ((((((32) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3e2c2f5303e51dfe50c2824f() {
  return __cxx_static_address_3e2c2f5303e51dfe50c2824f.reference || (__cxx_static_address_3e2c2f5303e51dfe50c2824f.reference = {
    __cReference: true,
    get value() { return GROWSPRITEICON____header_global_286ad50929155749; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:211
export const INVENTORYBOX____header_global_e3d72644a832e150 = ((((((33) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a9912282edc5632a7f597e79() {
  return __cxx_static_address_a9912282edc5632a7f597e79.reference || (__cxx_static_address_a9912282edc5632a7f597e79.reference = {
    __cReference: true,
    get value() { return INVENTORYBOX____header_global_e3d72644a832e150; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:212
export const FREEZEAMMO____header_global_8d8f3e649fa2261e = ((((((37) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9329e4e7e6ee85d27e479ff2() {
  return __cxx_static_address_9329e4e7e6ee85d27e479ff2.reference || (__cxx_static_address_9329e4e7e6ee85d27e479ff2.reference = {
    __cReference: true,
    get value() { return FREEZEAMMO____header_global_8d8f3e649fa2261e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:213
export const AMMO____header_global_d502661d040e323c = ((((((40) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_77d3fd365a649e5061e6f917() {
  return __cxx_static_address_77d3fd365a649e5061e6f917.reference || (__cxx_static_address_77d3fd365a649e5061e6f917.reference = {
    __cReference: true,
    get value() { return AMMO____header_global_d502661d040e323c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:214
export const BATTERYAMMO____header_global_188296dab413a99b = ((((((41) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9dfd932200b318fedc4682a3() {
  return __cxx_static_address_9dfd932200b318fedc4682a3.reference || (__cxx_static_address_9dfd932200b318fedc4682a3.reference = {
    __cReference: true,
    get value() { return BATTERYAMMO____header_global_188296dab413a99b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:215
export const DEVISTATORAMMO____header_global_0952fd6d784dc11f = ((((((42) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7348ef96350e732f233dcd3d() {
  return __cxx_static_address_7348ef96350e732f233dcd3d.reference || (__cxx_static_address_7348ef96350e732f233dcd3d.reference = {
    __cReference: true,
    get value() { return DEVISTATORAMMO____header_global_0952fd6d784dc11f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:216
export const RPGAMMO____header_global_e78918649e3a1152 = ((((((44) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a7160896d7fbbef078e5db06() {
  return __cxx_static_address_a7160896d7fbbef078e5db06.reference || (__cxx_static_address_a7160896d7fbbef078e5db06.reference = {
    __cReference: true,
    get value() { return RPGAMMO____header_global_e78918649e3a1152; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:217
export const GROWAMMO____header_global_f3cf8457c31c0256 = ((((((45) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2763676b6d0e5f5433eeeef9() {
  return __cxx_static_address_2763676b6d0e5f5433eeeef9.reference || (__cxx_static_address_2763676b6d0e5f5433eeeef9.reference = {
    __cReference: true,
    get value() { return GROWAMMO____header_global_f3cf8457c31c0256; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:218
export const CRYSTALAMMO____header_global_272c4b23481532ad = ((((((46) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7ef089a95b61386db3143013() {
  return __cxx_static_address_7ef089a95b61386db3143013.reference || (__cxx_static_address_7ef089a95b61386db3143013.reference = {
    __cReference: true,
    get value() { return CRYSTALAMMO____header_global_272c4b23481532ad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:219
export const HBOMBAMMO____header_global_c699fbf41eab4c7b = ((((((47) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b5b50a2a1c14b1d5357f1073() {
  return __cxx_static_address_b5b50a2a1c14b1d5357f1073.reference || (__cxx_static_address_b5b50a2a1c14b1d5357f1073.reference = {
    __cReference: true,
    get value() { return HBOMBAMMO____header_global_c699fbf41eab4c7b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:220
export const AMMOLOTS____header_global_147e108186a65f44 = ((((((48) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d16f8038e1d4a3ec71457eed() {
  return __cxx_static_address_d16f8038e1d4a3ec71457eed.reference || (__cxx_static_address_d16f8038e1d4a3ec71457eed.reference = {
    __cReference: true,
    get value() { return AMMOLOTS____header_global_147e108186a65f44; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:221
export const SHOTGUNAMMO____header_global_74c453623294ca1d = ((((((49) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_55128e1924135dd7fa3a341b() {
  return __cxx_static_address_55128e1924135dd7fa3a341b.reference || (__cxx_static_address_55128e1924135dd7fa3a341b.reference = {
    __cReference: true,
    get value() { return SHOTGUNAMMO____header_global_74c453623294ca1d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:222
export const COLA____header_global_17e0036e18a8bbe2 = ((((((51) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a0912febfb6c25bc310c6a5e() {
  return __cxx_static_address_a0912febfb6c25bc310c6a5e.reference || (__cxx_static_address_a0912febfb6c25bc310c6a5e.reference = {
    __cReference: true,
    get value() { return COLA____header_global_17e0036e18a8bbe2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:223
export const SIXPAK____header_global_274bde3243121eba = ((((((52) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_54e349a1632785e549410bdf() {
  return __cxx_static_address_54e349a1632785e549410bdf.reference || (__cxx_static_address_54e349a1632785e549410bdf.reference = {
    __cReference: true,
    get value() { return SIXPAK____header_global_274bde3243121eba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:224
export const FIRSTAID____header_global_148b6f4718df6395 = ((((((53) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4c78da476646b200ba1f043f() {
  return __cxx_static_address_4c78da476646b200ba1f043f.reference || (__cxx_static_address_4c78da476646b200ba1f043f.reference = {
    __cReference: true,
    get value() { return FIRSTAID____header_global_148b6f4718df6395; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:225
export const SHIELD____header_global_65bbba18c9d152b2 = ((((((54) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_87e498394696e63afe0f260a() {
  return __cxx_static_address_87e498394696e63afe0f260a.reference || (__cxx_static_address_87e498394696e63afe0f260a.reference = {
    __cReference: true,
    get value() { return SHIELD____header_global_65bbba18c9d152b2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:226
export const STEROIDS____header_global_c0731cef6f19111a = ((((((55) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_544b8d0a7f21ab1c6b6705e8() {
  return __cxx_static_address_544b8d0a7f21ab1c6b6705e8.reference || (__cxx_static_address_544b8d0a7f21ab1c6b6705e8.reference = {
    __cReference: true,
    get value() { return STEROIDS____header_global_c0731cef6f19111a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:227
export const AIRTANK____header_global_c4a5bf99c77bbd63 = ((((((56) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bf97fe338a7022059c7fb433() {
  return __cxx_static_address_bf97fe338a7022059c7fb433.reference || (__cxx_static_address_bf97fe338a7022059c7fb433.reference = {
    __cReference: true,
    get value() { return AIRTANK____header_global_c4a5bf99c77bbd63; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:228
export const JETPACK____header_global_e6e0ce201043caf3 = ((((((57) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_66d95e27be85e8665f49d67c() {
  return __cxx_static_address_66d95e27be85e8665f49d67c.reference || (__cxx_static_address_66d95e27be85e8665f49d67c.reference = {
    __cReference: true,
    get value() { return JETPACK____header_global_e6e0ce201043caf3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:229
export const HEATSENSOR____header_global_edc89176710d051e = ((((((59) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d0341c2f118e70190114dc03() {
  return __cxx_static_address_d0341c2f118e70190114dc03.reference || (__cxx_static_address_d0341c2f118e70190114dc03.reference = {
    __cReference: true,
    get value() { return HEATSENSOR____header_global_edc89176710d051e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:230
export const ACCESSCARD____header_global_f57b24bf6c8ae716 = ((((((60) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a123a736d63b87f037344466() {
  return __cxx_static_address_a123a736d63b87f037344466.reference || (__cxx_static_address_a123a736d63b87f037344466.reference = {
    __cReference: true,
    get value() { return ACCESSCARD____header_global_f57b24bf6c8ae716; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:231
export const BOOTS____header_global_d10f3c9340b27e53 = ((((((61) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0ea87f9365c4d56fc8b566c8() {
  return __cxx_static_address_0ea87f9365c4d56fc8b566c8.reference || (__cxx_static_address_0ea87f9365c4d56fc8b566c8.reference = {
    __cReference: true,
    get value() { return BOOTS____header_global_d10f3c9340b27e53; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:232
export const MIRRORBROKE____header_global_800694ec0a628c81 = ((((((70) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4a34dfdfac14705b1efba4aa() {
  return __cxx_static_address_4a34dfdfac14705b1efba4aa.reference || (__cxx_static_address_4a34dfdfac14705b1efba4aa.reference = {
    __cReference: true,
    get value() { return MIRRORBROKE____header_global_800694ec0a628c81; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:233
export const CLOUDYOCEAN____header_global_4cc02fb880198cb1 = ((((((78) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_50b936d5000d0345dd14c2e3() {
  return __cxx_static_address_50b936d5000d0345dd14c2e3.reference || (__cxx_static_address_50b936d5000d0345dd14c2e3.reference = {
    __cReference: true,
    get value() { return CLOUDYOCEAN____header_global_4cc02fb880198cb1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:234
export const CLOUDYSKIES____header_global_d2336dc7513ca677 = ((((((79) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b4634fe3fe1bd03bc66b5793() {
  return __cxx_static_address_b4634fe3fe1bd03bc66b5793.reference || (__cxx_static_address_b4634fe3fe1bd03bc66b5793.reference = {
    __cReference: true,
    get value() { return CLOUDYSKIES____header_global_d2336dc7513ca677; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:235
export const MOONSKY1____header_global_d8cce064a9dc56ac = ((((((80) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b3ef10bcee783d5ce8a34101() {
  return __cxx_static_address_b3ef10bcee783d5ce8a34101.reference || (__cxx_static_address_b3ef10bcee783d5ce8a34101.reference = {
    __cReference: true,
    get value() { return MOONSKY1____header_global_d8cce064a9dc56ac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:236
export const BIGORBIT1____header_global_f7fb8ab3977d12c0 = ((((((84) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f44185279d18b0cf396f559d() {
  return __cxx_static_address_f44185279d18b0cf396f559d.reference || (__cxx_static_address_f44185279d18b0cf396f559d.reference = {
    __cReference: true,
    get value() { return BIGORBIT1____header_global_f7fb8ab3977d12c0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:237
export const LA____header_global_c2fe699daa594a27 = ((((((89) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_97c33e5410ec0945cf3103f2() {
  return __cxx_static_address_97c33e5410ec0945cf3103f2.reference || (__cxx_static_address_97c33e5410ec0945cf3103f2.reference = {
    __cReference: true,
    get value() { return LA____header_global_c2fe699daa594a27; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:238
export const ATOMICHEALTH____header_global_1b4f0e84bdaf14dc = ((((((100) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_950bf68ec2196d18675f099a() {
  return __cxx_static_address_950bf68ec2196d18675f099a.reference || (__cxx_static_address_950bf68ec2196d18675f099a.reference = {
    __cReference: true,
    get value() { return ATOMICHEALTH____header_global_1b4f0e84bdaf14dc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:239
export const TECHLIGHT2____header_global_6efc32c3db91d6d8 = ((((((120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3b01a49fdd4061638590ddfa() {
  return __cxx_static_address_3b01a49fdd4061638590ddfa.reference || (__cxx_static_address_3b01a49fdd4061638590ddfa.reference = {
    __cReference: true,
    get value() { return TECHLIGHT2____header_global_6efc32c3db91d6d8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:240
export const TECHLIGHTBUST2____header_global_1be666c56802eec3 = ((((((121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_80879d367a3cfdc8d9dde5aa() {
  return __cxx_static_address_80879d367a3cfdc8d9dde5aa.reference || (__cxx_static_address_80879d367a3cfdc8d9dde5aa.reference = {
    __cReference: true,
    get value() { return TECHLIGHTBUST2____header_global_1be666c56802eec3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:241
export const TECHLIGHT4____header_global_0561536f954c8a8a = ((((((122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_86556c324bbeb73ae26cd414() {
  return __cxx_static_address_86556c324bbeb73ae26cd414.reference || (__cxx_static_address_86556c324bbeb73ae26cd414.reference = {
    __cReference: true,
    get value() { return TECHLIGHT4____header_global_0561536f954c8a8a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:242
export const TECHLIGHTBUST4____header_global_53c17b7bdd92e49f = ((((((123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_95b9099fadd8b89ec9ecdcac() {
  return __cxx_static_address_95b9099fadd8b89ec9ecdcac.reference || (__cxx_static_address_95b9099fadd8b89ec9ecdcac.reference = {
    __cReference: true,
    get value() { return TECHLIGHTBUST4____header_global_53c17b7bdd92e49f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:243
export const WALLLIGHT4____header_global_d459093d3adb2aaa = ((((((124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dc3a48c232f4dd990273678a() {
  return __cxx_static_address_dc3a48c232f4dd990273678a.reference || (__cxx_static_address_dc3a48c232f4dd990273678a.reference = {
    __cReference: true,
    get value() { return WALLLIGHT4____header_global_d459093d3adb2aaa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:244
export const WALLLIGHTBUST4____header_global_56c91b596184ab9f = ((((((125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f4c7ba8db057d30f786122a0() {
  return __cxx_static_address_f4c7ba8db057d30f786122a0.reference || (__cxx_static_address_f4c7ba8db057d30f786122a0.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST4____header_global_56c91b596184ab9f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:245
export const ACCESSSWITCH____header_global_9f33882d527938ff = ((((((130) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6b08d83d5d5d507c5f469a10() {
  return __cxx_static_address_6b08d83d5d5d507c5f469a10.reference || (__cxx_static_address_6b08d83d5d5d507c5f469a10.reference = {
    __cReference: true,
    get value() { return ACCESSSWITCH____header_global_9f33882d527938ff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:246
export const SLOTDOOR____header_global_55b9a4f93b9e6b3e = ((((((132) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8ccd3f7bb3d0c3ba690921a5() {
  return __cxx_static_address_8ccd3f7bb3d0c3ba690921a5.reference || (__cxx_static_address_8ccd3f7bb3d0c3ba690921a5.reference = {
    __cReference: true,
    get value() { return SLOTDOOR____header_global_55b9a4f93b9e6b3e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:247
export const LIGHTSWITCH____header_global_545058778a674bd7 = ((((((134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2fe7db02e4c530b039e98c73() {
  return __cxx_static_address_2fe7db02e4c530b039e98c73.reference || (__cxx_static_address_2fe7db02e4c530b039e98c73.reference = {
    __cReference: true,
    get value() { return LIGHTSWITCH____header_global_545058778a674bd7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:248
export const SPACEDOORSWITCH____header_global_31584020e9bff5b9 = ((((((136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5d407629b6257fbeac53296b() {
  return __cxx_static_address_5d407629b6257fbeac53296b.reference || (__cxx_static_address_5d407629b6257fbeac53296b.reference = {
    __cReference: true,
    get value() { return SPACEDOORSWITCH____header_global_31584020e9bff5b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:249
export const SPACELIGHTSWITCH____header_global_83d69b0fc8de3ee0 = ((((((138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4a04cfd5ecfcc16d785556c2() {
  return __cxx_static_address_4a04cfd5ecfcc16d785556c2.reference || (__cxx_static_address_4a04cfd5ecfcc16d785556c2.reference = {
    __cReference: true,
    get value() { return SPACELIGHTSWITCH____header_global_83d69b0fc8de3ee0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:250
export const FRANKENSTINESWITCH____header_global_4a666205cde06202 = ((((((140) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e83cd6308bfc89a5d7b89247() {
  return __cxx_static_address_e83cd6308bfc89a5d7b89247.reference || (__cxx_static_address_e83cd6308bfc89a5d7b89247.reference = {
    __cReference: true,
    get value() { return FRANKENSTINESWITCH____header_global_4a666205cde06202; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:251
export const NUKEBUTTON____header_global_9ec64c41306d8662 = ((((((142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cc28f57677ba0f48cd49aa0b() {
  return __cxx_static_address_cc28f57677ba0f48cd49aa0b.reference || (__cxx_static_address_cc28f57677ba0f48cd49aa0b.reference = {
    __cReference: true,
    get value() { return NUKEBUTTON____header_global_9ec64c41306d8662; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:252
export const MULTISWITCH____header_global_fa0ab7eb1a6ee27a = ((((((146) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6328b9c0060055b5fd9a2135() {
  return __cxx_static_address_6328b9c0060055b5fd9a2135.reference || (__cxx_static_address_6328b9c0060055b5fd9a2135.reference = {
    __cReference: true,
    get value() { return MULTISWITCH____header_global_fa0ab7eb1a6ee27a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:253
export const DOORTILE5____header_global_e26b52b4b406ddbf = ((((((150) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4689f0e6b2892daeea3f35a5() {
  return __cxx_static_address_4689f0e6b2892daeea3f35a5.reference || (__cxx_static_address_4689f0e6b2892daeea3f35a5.reference = {
    __cReference: true,
    get value() { return DOORTILE5____header_global_e26b52b4b406ddbf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:254
export const DOORTILE6____header_global_00a348723d685355 = ((((((151) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3f3072f9122edbe94cd40ce0() {
  return __cxx_static_address_3f3072f9122edbe94cd40ce0.reference || (__cxx_static_address_3f3072f9122edbe94cd40ce0.reference = {
    __cReference: true,
    get value() { return DOORTILE6____header_global_00a348723d685355; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:255
export const DOORTILE1____header_global_49f7f088bdd0fcd2 = ((((((152) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3ffd78333decc1f033a8e8c1() {
  return __cxx_static_address_3ffd78333decc1f033a8e8c1.reference || (__cxx_static_address_3ffd78333decc1f033a8e8c1.reference = {
    __cReference: true,
    get value() { return DOORTILE1____header_global_49f7f088bdd0fcd2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:256
export const DOORTILE2____header_global_d4472b3c51f690d6 = ((((((153) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_62abcab4c475db6816c9c9c0() {
  return __cxx_static_address_62abcab4c475db6816c9c9c0.reference || (__cxx_static_address_62abcab4c475db6816c9c9c0.reference = {
    __cReference: true,
    get value() { return DOORTILE2____header_global_d4472b3c51f690d6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:257
export const DOORTILE3____header_global_bad7b2b1f92958ad = ((((((154) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_950ffb07edce804e35cb4774() {
  return __cxx_static_address_950ffb07edce804e35cb4774.reference || (__cxx_static_address_950ffb07edce804e35cb4774.reference = {
    __cReference: true,
    get value() { return DOORTILE3____header_global_bad7b2b1f92958ad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:258
export const DOORTILE4____header_global_0cf0af0b0f5176c1 = ((((((155) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_534e7fa07deec11089738c94() {
  return __cxx_static_address_534e7fa07deec11089738c94.reference || (__cxx_static_address_534e7fa07deec11089738c94.reference = {
    __cReference: true,
    get value() { return DOORTILE4____header_global_0cf0af0b0f5176c1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:259
export const DOORTILE7____header_global_afafef20d297cf3b = ((((((156) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a1386a6e545161e66abd31a2() {
  return __cxx_static_address_a1386a6e545161e66abd31a2.reference || (__cxx_static_address_a1386a6e545161e66abd31a2.reference = {
    __cReference: true,
    get value() { return DOORTILE7____header_global_afafef20d297cf3b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:260
export const DOORTILE8____header_global_726dccbe4c5ab9d6 = ((((((157) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5c8e40ba779c8a2c1fb833bf() {
  return __cxx_static_address_5c8e40ba779c8a2c1fb833bf.reference || (__cxx_static_address_5c8e40ba779c8a2c1fb833bf.reference = {
    __cReference: true,
    get value() { return DOORTILE8____header_global_726dccbe4c5ab9d6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:261
export const DOORTILE9____header_global_50a5316535d9adbf = ((((((158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_34f98043335a847a733ad186() {
  return __cxx_static_address_34f98043335a847a733ad186.reference || (__cxx_static_address_34f98043335a847a733ad186.reference = {
    __cReference: true,
    get value() { return DOORTILE9____header_global_50a5316535d9adbf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:262
export const DOORTILE10____header_global_823b4f0dbca30194 = ((((((159) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_073ba19c3fe27dcc9ffc2b03() {
  return __cxx_static_address_073ba19c3fe27dcc9ffc2b03.reference || (__cxx_static_address_073ba19c3fe27dcc9ffc2b03.reference = {
    __cReference: true,
    get value() { return DOORTILE10____header_global_823b4f0dbca30194; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:263
export const DOORSHOCK____header_global_d919adac0239104c = ((((((160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5799e92d55926cfae6fa95ae() {
  return __cxx_static_address_5799e92d55926cfae6fa95ae.reference || (__cxx_static_address_5799e92d55926cfae6fa95ae.reference = {
    __cReference: true,
    get value() { return DOORSHOCK____header_global_d919adac0239104c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:264
export const DIPSWITCH____header_global_9acd69f4dd3ea765 = ((((((162) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d018cff5df1e5c01e4b3a6e4() {
  return __cxx_static_address_d018cff5df1e5c01e4b3a6e4.reference || (__cxx_static_address_d018cff5df1e5c01e4b3a6e4.reference = {
    __cReference: true,
    get value() { return DIPSWITCH____header_global_9acd69f4dd3ea765; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:265
export const DIPSWITCH2____header_global_e0607ffe2ee59b0b = ((((((164) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_53a1b92109c46eebb74c21f8() {
  return __cxx_static_address_53a1b92109c46eebb74c21f8.reference || (__cxx_static_address_53a1b92109c46eebb74c21f8.reference = {
    __cReference: true,
    get value() { return DIPSWITCH2____header_global_e0607ffe2ee59b0b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:266
export const TECHSWITCH____header_global_aa4edc00bbdbd0c1 = ((((((166) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_370a88b9695e971f0387718c() {
  return __cxx_static_address_370a88b9695e971f0387718c.reference || (__cxx_static_address_370a88b9695e971f0387718c.reference = {
    __cReference: true,
    get value() { return TECHSWITCH____header_global_aa4edc00bbdbd0c1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:267
export const DIPSWITCH3____header_global_db48ee8449c4ba02 = ((((((168) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2392ef139c00300393d24195() {
  return __cxx_static_address_2392ef139c00300393d24195.reference || (__cxx_static_address_2392ef139c00300393d24195.reference = {
    __cReference: true,
    get value() { return DIPSWITCH3____header_global_db48ee8449c4ba02; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:268
export const ACCESSSWITCH2____header_global_f11492d0cdae948a = ((((((170) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d3754a33ffa3454f0152f8b6() {
  return __cxx_static_address_d3754a33ffa3454f0152f8b6.reference || (__cxx_static_address_d3754a33ffa3454f0152f8b6.reference = {
    __cReference: true,
    get value() { return ACCESSSWITCH2____header_global_f11492d0cdae948a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:269
export const FLOORSLIME____header_global_d173c7a35fd84d21 = ((((((200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3cd9bc1c4a034a11dd965a1f() {
  return __cxx_static_address_3cd9bc1c4a034a11dd965a1f.reference || (__cxx_static_address_3cd9bc1c4a034a11dd965a1f.reference = {
    __cReference: true,
    get value() { return FLOORSLIME____header_global_d173c7a35fd84d21; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:270
export const BIGFORCE____header_global_f4219606ab7a97f8 = ((((((230) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5c8dab3ec033fe77a96f894b() {
  return __cxx_static_address_5c8dab3ec033fe77a96f894b.reference || (__cxx_static_address_5c8dab3ec033fe77a96f894b.reference = {
    __cReference: true,
    get value() { return BIGFORCE____header_global_f4219606ab7a97f8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:271
export const MASKWALL9____header_global_c5d92cf92c2c6ea6 = ((((((255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0d7bcd1fbea57532dbad19cb() {
  return __cxx_static_address_0d7bcd1fbea57532dbad19cb.reference || (__cxx_static_address_0d7bcd1fbea57532dbad19cb.reference = {
    __cReference: true,
    get value() { return MASKWALL9____header_global_c5d92cf92c2c6ea6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:272
export const SCREENBREAK1____header_global_0794f08bb78a39db = ((((((263) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4372e2e5241024955d79d07f() {
  return __cxx_static_address_4372e2e5241024955d79d07f.reference || (__cxx_static_address_4372e2e5241024955d79d07f.reference = {
    __cReference: true,
    get value() { return SCREENBREAK1____header_global_0794f08bb78a39db; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:273
export const SCREENBREAK2____header_global_a9566208164ad171 = ((((((264) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_91aad4e66a6237202e218ce3() {
  return __cxx_static_address_91aad4e66a6237202e218ce3.reference || (__cxx_static_address_91aad4e66a6237202e218ce3.reference = {
    __cReference: true,
    get value() { return SCREENBREAK2____header_global_a9566208164ad171; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:274
export const SCREENBREAK3____header_global_3b23f6b7c1552122 = ((((((265) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dc37589410422c4cf20cb30a() {
  return __cxx_static_address_dc37589410422c4cf20cb30a.reference || (__cxx_static_address_dc37589410422c4cf20cb30a.reference = {
    __cReference: true,
    get value() { return SCREENBREAK3____header_global_3b23f6b7c1552122; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:275
export const SCREENBREAK4____header_global_598536414e8a4d85 = ((((((266) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2d56fcaaf8630afd4ad3635d() {
  return __cxx_static_address_2d56fcaaf8630afd4ad3635d.reference || (__cxx_static_address_2d56fcaaf8630afd4ad3635d.reference = {
    __cReference: true,
    get value() { return SCREENBREAK4____header_global_598536414e8a4d85; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:276
export const SCREENBREAK5____header_global_b5bfd80932301d31 = ((((((267) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_15fca18e902a420d52c35fd2() {
  return __cxx_static_address_15fca18e902a420d52c35fd2.reference || (__cxx_static_address_15fca18e902a420d52c35fd2.reference = {
    __cReference: true,
    get value() { return SCREENBREAK5____header_global_b5bfd80932301d31; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:277
export const SCREENBREAK6____header_global_977feb89720d8580 = ((((((268) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_de5940756e1c20e591dc3271() {
  return __cxx_static_address_de5940756e1c20e591dc3271.reference || (__cxx_static_address_de5940756e1c20e591dc3271.reference = {
    __cReference: true,
    get value() { return SCREENBREAK6____header_global_977feb89720d8580; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:278
export const SCREENBREAK7____header_global_43dd15d78dad0f9b = ((((((269) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2d135b61c07ef09cfb853cee() {
  return __cxx_static_address_2d135b61c07ef09cfb853cee.reference || (__cxx_static_address_2d135b61c07ef09cfb853cee.reference = {
    __cReference: true,
    get value() { return SCREENBREAK7____header_global_43dd15d78dad0f9b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:279
export const SCREENBREAK8____header_global_62e9da66f6bc862f = ((((((270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a8d8f309f25caa2e567f1bda() {
  return __cxx_static_address_a8d8f309f25caa2e567f1bda.reference || (__cxx_static_address_a8d8f309f25caa2e567f1bda.reference = {
    __cReference: true,
    get value() { return SCREENBREAK8____header_global_62e9da66f6bc862f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:280
export const SCREENBREAK9____header_global_71c36da99c7c0d19 = ((((((271) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6b58d520590364b8cf9bb70d() {
  return __cxx_static_address_6b58d520590364b8cf9bb70d.reference || (__cxx_static_address_6b58d520590364b8cf9bb70d.reference = {
    __cReference: true,
    get value() { return SCREENBREAK9____header_global_71c36da99c7c0d19; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:281
export const SCREENBREAK10____header_global_5ffe0daf26d69e92 = ((((((272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0f8d255dffffae85dc8566cf() {
  return __cxx_static_address_0f8d255dffffae85dc8566cf.reference || (__cxx_static_address_0f8d255dffffae85dc8566cf.reference = {
    __cReference: true,
    get value() { return SCREENBREAK10____header_global_5ffe0daf26d69e92; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:282
export const SCREENBREAK11____header_global_298b1162ace5aa05 = ((((((273) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9a5efbbe9d584ad54d11482b() {
  return __cxx_static_address_9a5efbbe9d584ad54d11482b.reference || (__cxx_static_address_9a5efbbe9d584ad54d11482b.reference = {
    __cReference: true,
    get value() { return SCREENBREAK11____header_global_298b1162ace5aa05; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:283
export const SCREENBREAK12____header_global_634630aaa77782e4 = ((((((274) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cd3d72cb17e005e1bbfc8351() {
  return __cxx_static_address_cd3d72cb17e005e1bbfc8351.reference || (__cxx_static_address_cd3d72cb17e005e1bbfc8351.reference = {
    __cReference: true,
    get value() { return SCREENBREAK12____header_global_634630aaa77782e4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:284
export const SCREENBREAK13____header_global_ce3b6ab9960e1be4 = ((((((275) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_05720e349f02b27fde7c68c8() {
  return __cxx_static_address_05720e349f02b27fde7c68c8.reference || (__cxx_static_address_05720e349f02b27fde7c68c8.reference = {
    __cReference: true,
    get value() { return SCREENBREAK13____header_global_ce3b6ab9960e1be4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:285
export const MASKWALL1____header_global_48081493f647d676 = ((((((285) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_562eb5af5b1b5c47dc42ffa4() {
  return __cxx_static_address_562eb5af5b1b5c47dc42ffa4.reference || (__cxx_static_address_562eb5af5b1b5c47dc42ffa4.reference = {
    __cReference: true,
    get value() { return MASKWALL1____header_global_48081493f647d676; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:286
export const W_TECHWALL1____header_global_6d3cb97ae2025cf7 = ((((((293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_32cd1f543a902d7a24d2fb63() {
  return __cxx_static_address_32cd1f543a902d7a24d2fb63.reference || (__cxx_static_address_32cd1f543a902d7a24d2fb63.reference = {
    __cReference: true,
    get value() { return W_TECHWALL1____header_global_6d3cb97ae2025cf7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:287
export const W_TECHWALL2____header_global_769e4d74b2e6af85 = ((((((297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_715708252d50656a03fbc9d3() {
  return __cxx_static_address_715708252d50656a03fbc9d3.reference || (__cxx_static_address_715708252d50656a03fbc9d3.reference = {
    __cReference: true,
    get value() { return W_TECHWALL2____header_global_769e4d74b2e6af85; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:288
export const W_TECHWALL15____header_global_85eb58a9fcefa5eb = ((((((299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_89115b2f355dbcdd2e2bdffc() {
  return __cxx_static_address_89115b2f355dbcdd2e2bdffc.reference || (__cxx_static_address_89115b2f355dbcdd2e2bdffc.reference = {
    __cReference: true,
    get value() { return W_TECHWALL15____header_global_85eb58a9fcefa5eb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:289
export const W_TECHWALL3____header_global_f14e26de7c68505e = ((((((301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2cd939c8973f389e6679e747() {
  return __cxx_static_address_2cd939c8973f389e6679e747.reference || (__cxx_static_address_2cd939c8973f389e6679e747.reference = {
    __cReference: true,
    get value() { return W_TECHWALL3____header_global_f14e26de7c68505e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:290
export const W_TECHWALL4____header_global_d0934416ed0c9942 = ((((((305) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dad0824150d4fb0d34a5d5b7() {
  return __cxx_static_address_dad0824150d4fb0d34a5d5b7.reference || (__cxx_static_address_dad0824150d4fb0d34a5d5b7.reference = {
    __cReference: true,
    get value() { return W_TECHWALL4____header_global_d0934416ed0c9942; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:291
export const W_TECHWALL10____header_global_3ba086dcd085b98d = ((((((306) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a8e0031e3c2835569abbb48c() {
  return __cxx_static_address_a8e0031e3c2835569abbb48c.reference || (__cxx_static_address_a8e0031e3c2835569abbb48c.reference = {
    __cReference: true,
    get value() { return W_TECHWALL10____header_global_3ba086dcd085b98d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:292
export const W_TECHWALL16____header_global_bb8664bc255c917e = ((((((307) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f290dcb34e00f2cea42cd030() {
  return __cxx_static_address_f290dcb34e00f2cea42cd030.reference || (__cxx_static_address_f290dcb34e00f2cea42cd030.reference = {
    __cReference: true,
    get value() { return W_TECHWALL16____header_global_bb8664bc255c917e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:293
export const WATERTILE2____header_global_5ca4f904133cea4c = ((((((336) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2abf4b4272801ef1bccb9c6b() {
  return __cxx_static_address_2abf4b4272801ef1bccb9c6b.reference || (__cxx_static_address_2abf4b4272801ef1bccb9c6b.reference = {
    __cReference: true,
    get value() { return WATERTILE2____header_global_5ca4f904133cea4c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:294
export const BPANNEL1____header_global_48f44aa84f558f99 = ((((((341) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8bda511a2e03007d0504f0d6() {
  return __cxx_static_address_8bda511a2e03007d0504f0d6.reference || (__cxx_static_address_8bda511a2e03007d0504f0d6.reference = {
    __cReference: true,
    get value() { return BPANNEL1____header_global_48f44aa84f558f99; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:295
export const PANNEL1____header_global_b6d4ff0395738f37 = ((((((342) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_243f9176ba364be8a00709df() {
  return __cxx_static_address_243f9176ba364be8a00709df.reference || (__cxx_static_address_243f9176ba364be8a00709df.reference = {
    __cReference: true,
    get value() { return PANNEL1____header_global_b6d4ff0395738f37; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:296
export const PANNEL2____header_global_a382a1b1e5902973 = ((((((343) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e4dbb064355ede81f817c252() {
  return __cxx_static_address_e4dbb064355ede81f817c252.reference || (__cxx_static_address_e4dbb064355ede81f817c252.reference = {
    __cReference: true,
    get value() { return PANNEL2____header_global_a382a1b1e5902973; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:297
export const STATIC____header_global_698491e8cd552b5d = ((((((351) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bc11741e8a71e914c76bc799() {
  return __cxx_static_address_bc11741e8a71e914c76bc799.reference || (__cxx_static_address_bc11741e8a71e914c76bc799.reference = {
    __cReference: true,
    get value() { return STATIC____header_global_698491e8cd552b5d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:298
export const W_SCREENBREAK____header_global_b1579cf2632779f1 = ((((((357) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0ebe9130254d5d5bc41745de() {
  return __cxx_static_address_0ebe9130254d5d5bc41745de.reference || (__cxx_static_address_0ebe9130254d5d5bc41745de.reference = {
    __cReference: true,
    get value() { return W_SCREENBREAK____header_global_b1579cf2632779f1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:299
export const W_HITTECHWALL3____header_global_023f705d9d9269d7 = ((((((360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dcc82f91800b5ced004813ca() {
  return __cxx_static_address_dcc82f91800b5ced004813ca.reference || (__cxx_static_address_dcc82f91800b5ced004813ca.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL3____header_global_023f705d9d9269d7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:300
export const W_HITTECHWALL4____header_global_3545d0948f4a3c87 = ((((((361) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1cceaa0e781cb61c4dc81c4c() {
  return __cxx_static_address_1cceaa0e781cb61c4dc81c4c.reference || (__cxx_static_address_1cceaa0e781cb61c4dc81c4c.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL4____header_global_3545d0948f4a3c87; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:301
export const W_HITTECHWALL2____header_global_8191ac25a70dec36 = ((((((362) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b9cb18a7eabed059e61bfbb8() {
  return __cxx_static_address_b9cb18a7eabed059e61bfbb8.reference || (__cxx_static_address_b9cb18a7eabed059e61bfbb8.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL2____header_global_8191ac25a70dec36; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:302
export const W_HITTECHWALL1____header_global_c01366580bf07dfd = ((((((363) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ef4e601504a125783b21a516() {
  return __cxx_static_address_ef4e601504a125783b21a516.reference || (__cxx_static_address_ef4e601504a125783b21a516.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL1____header_global_c01366580bf07dfd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:303
export const MASKWALL10____header_global_251f72ece0e099f3 = ((((((387) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a8fe494a9b5e61a3f5ebcb7c() {
  return __cxx_static_address_a8fe494a9b5e61a3f5ebcb7c.reference || (__cxx_static_address_a8fe494a9b5e61a3f5ebcb7c.reference = {
    __cReference: true,
    get value() { return MASKWALL10____header_global_251f72ece0e099f3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:304
export const MASKWALL11____header_global_1a59ed97cd8800fe = ((((((391) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f90735d1f593609e5ee52ce0() {
  return __cxx_static_address_f90735d1f593609e5ee52ce0.reference || (__cxx_static_address_f90735d1f593609e5ee52ce0.reference = {
    __cReference: true,
    get value() { return MASKWALL11____header_global_1a59ed97cd8800fe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:305
export const DOORTILE22____header_global_624ed63fabe7d953 = ((((((395) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cab07bd705f00b90146e53a5() {
  return __cxx_static_address_cab07bd705f00b90146e53a5.reference || (__cxx_static_address_cab07bd705f00b90146e53a5.reference = {
    __cReference: true,
    get value() { return DOORTILE22____header_global_624ed63fabe7d953; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:306
export const FANSPRITE____header_global_e0bfe31ead579bb4 = ((((((407) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4ca82b859c6b51464a2a8d0b() {
  return __cxx_static_address_4ca82b859c6b51464a2a8d0b.reference || (__cxx_static_address_4ca82b859c6b51464a2a8d0b.reference = {
    __cReference: true,
    get value() { return FANSPRITE____header_global_e0bfe31ead579bb4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:307
export const FANSPRITEBROKE____header_global_3b7c500451aee01b = ((((((411) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_69f5f20b0c1e23bd0d0ef7c6() {
  return __cxx_static_address_69f5f20b0c1e23bd0d0ef7c6.reference || (__cxx_static_address_69f5f20b0c1e23bd0d0ef7c6.reference = {
    __cReference: true,
    get value() { return FANSPRITEBROKE____header_global_3b7c500451aee01b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:308
export const FANSHADOW____header_global_77414a103d9b21e6 = ((((((412) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7ce8fb2390ab8ed7a6c6512a() {
  return __cxx_static_address_7ce8fb2390ab8ed7a6c6512a.reference || (__cxx_static_address_7ce8fb2390ab8ed7a6c6512a.reference = {
    __cReference: true,
    get value() { return FANSHADOW____header_global_77414a103d9b21e6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:309
export const FANSHADOWBROKE____header_global_0357e97ae3700deb = ((((((416) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0397f06b0fa39703e7d6faa3() {
  return __cxx_static_address_0397f06b0fa39703e7d6faa3.reference || (__cxx_static_address_0397f06b0fa39703e7d6faa3.reference = {
    __cReference: true,
    get value() { return FANSHADOWBROKE____header_global_0357e97ae3700deb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:310
export const DOORTILE18____header_global_c55fd50c2f92b77f = ((((((447) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_daa5f6776852fc6044610317() {
  return __cxx_static_address_daa5f6776852fc6044610317.reference || (__cxx_static_address_daa5f6776852fc6044610317.reference = {
    __cReference: true,
    get value() { return DOORTILE18____header_global_c55fd50c2f92b77f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:311
export const DOORTILE19____header_global_5b673c84d0c6ebe1 = ((((((448) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a27f882ade3931a4d7a06c2b() {
  return __cxx_static_address_a27f882ade3931a4d7a06c2b.reference || (__cxx_static_address_a27f882ade3931a4d7a06c2b.reference = {
    __cReference: true,
    get value() { return DOORTILE19____header_global_5b673c84d0c6ebe1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:312
export const DOORTILE20____header_global_fe0a4d073e6c2d1f = ((((((449) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4aaedfc9e20b2ff69ac77723() {
  return __cxx_static_address_4aaedfc9e20b2ff69ac77723.reference || (__cxx_static_address_4aaedfc9e20b2ff69ac77723.reference = {
    __cReference: true,
    get value() { return DOORTILE20____header_global_fe0a4d073e6c2d1f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:313
export const VIEWSCREEN2____header_global_82fe28e34e4597d7 = ((((((499) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d263e638a39f8136e52ad9c3() {
  return __cxx_static_address_d263e638a39f8136e52ad9c3.reference || (__cxx_static_address_d263e638a39f8136e52ad9c3.reference = {
    __cReference: true,
    get value() { return VIEWSCREEN2____header_global_82fe28e34e4597d7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:314
export const VIEWSCREEN____header_global_5bc7761ab45bd25d = ((((((502) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5eae721c68ef67e4131d49f1() {
  return __cxx_static_address_5eae721c68ef67e4131d49f1.reference || (__cxx_static_address_5eae721c68ef67e4131d49f1.reference = {
    __cReference: true,
    get value() { return VIEWSCREEN____header_global_5bc7761ab45bd25d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:315
export const GLASS____header_global_4ab24843bca280df = ((((((503) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bdfd930b55ccd63b183e775c() {
  return __cxx_static_address_bdfd930b55ccd63b183e775c.reference || (__cxx_static_address_bdfd930b55ccd63b183e775c.reference = {
    __cReference: true,
    get value() { return GLASS____header_global_4ab24843bca280df; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:316
export const GLASS2____header_global_04d97cc381104007 = ((((((504) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0b2f5f1b5ab2e5aace754564() {
  return __cxx_static_address_0b2f5f1b5ab2e5aace754564.reference || (__cxx_static_address_0b2f5f1b5ab2e5aace754564.reference = {
    __cReference: true,
    get value() { return GLASS2____header_global_04d97cc381104007; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:317
export const STAINGLASS1____header_global_6caa4b6c75d235e4 = ((((((510) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a4e2c303beb121c00db826c5() {
  return __cxx_static_address_a4e2c303beb121c00db826c5.reference || (__cxx_static_address_a4e2c303beb121c00db826c5.reference = {
    __cReference: true,
    get value() { return STAINGLASS1____header_global_6caa4b6c75d235e4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:318
export const MASKWALL5____header_global_d62a7ebcf7475288 = ((((((514) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_690c31366f93903435e452c9() {
  return __cxx_static_address_690c31366f93903435e452c9.reference || (__cxx_static_address_690c31366f93903435e452c9.reference = {
    __cReference: true,
    get value() { return MASKWALL5____header_global_d62a7ebcf7475288; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:319
export const SATELITE____header_global_e46cfb1a4a293a38 = ((((((516) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_72d0eafefcf271dab5ab928e() {
  return __cxx_static_address_72d0eafefcf271dab5ab928e.reference || (__cxx_static_address_72d0eafefcf271dab5ab928e.reference = {
    __cReference: true,
    get value() { return SATELITE____header_global_e46cfb1a4a293a38; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:320
export const FUELPOD____header_global_e894b18932800919 = ((((((517) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dee252c0f268730a037cb3de() {
  return __cxx_static_address_dee252c0f268730a037cb3de.reference || (__cxx_static_address_dee252c0f268730a037cb3de.reference = {
    __cReference: true,
    get value() { return FUELPOD____header_global_e894b18932800919; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:321
export const CRACK1____header_global_c2103b74ad01a890 = ((((((546) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b2c1fab145d3a3b263f12f49() {
  return __cxx_static_address_b2c1fab145d3a3b263f12f49.reference || (__cxx_static_address_b2c1fab145d3a3b263f12f49.reference = {
    __cReference: true,
    get value() { return CRACK1____header_global_c2103b74ad01a890; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:322
export const CRACK2____header_global_16424e120a058b7c = ((((((547) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9f1899cdedb7bb575ad16b6e() {
  return __cxx_static_address_9f1899cdedb7bb575ad16b6e.reference || (__cxx_static_address_9f1899cdedb7bb575ad16b6e.reference = {
    __cReference: true,
    get value() { return CRACK2____header_global_16424e120a058b7c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:323
export const CRACK3____header_global_64eed7a7761e9309 = ((((((548) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8091080342efa19e2697b4e4() {
  return __cxx_static_address_8091080342efa19e2697b4e4.reference || (__cxx_static_address_8091080342efa19e2697b4e4.reference = {
    __cReference: true,
    get value() { return CRACK3____header_global_64eed7a7761e9309; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:324
export const CRACK4____header_global_cf64a4cedfb10947 = ((((((549) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_edb51c9facd4ff47a129534a() {
  return __cxx_static_address_edb51c9facd4ff47a129534a.reference || (__cxx_static_address_edb51c9facd4ff47a129534a.reference = {
    __cReference: true,
    get value() { return CRACK4____header_global_cf64a4cedfb10947; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:325
export const FOOTPRINTS____header_global_0c1b08b61743cb64 = ((((((550) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ba104bedd553f57e065e3af8() {
  return __cxx_static_address_ba104bedd553f57e065e3af8.reference || (__cxx_static_address_ba104bedd553f57e065e3af8.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS____header_global_0c1b08b61743cb64; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:326
export const DOMELITE____header_global_922bb76de0d92f34 = ((((((551) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_227a5c1aec5926e5b6fa2c3b() {
  return __cxx_static_address_227a5c1aec5926e5b6fa2c3b.reference || (__cxx_static_address_227a5c1aec5926e5b6fa2c3b.reference = {
    __cReference: true,
    get value() { return DOMELITE____header_global_922bb76de0d92f34; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:327
export const CAMERAPOLE____header_global_72ffed4ea0a4b27e = ((((((554) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d23322ca547e9adac7743c57() {
  return __cxx_static_address_d23322ca547e9adac7743c57.reference || (__cxx_static_address_d23322ca547e9adac7743c57.reference = {
    __cReference: true,
    get value() { return CAMERAPOLE____header_global_72ffed4ea0a4b27e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:328
export const CHAIR1____header_global_fcacae34bb805b7b = ((((((556) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_acfc47d6e08f9a028657567e() {
  return __cxx_static_address_acfc47d6e08f9a028657567e.reference || (__cxx_static_address_acfc47d6e08f9a028657567e.reference = {
    __cReference: true,
    get value() { return CHAIR1____header_global_fcacae34bb805b7b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:329
export const CHAIR2____header_global_efc67cb4e78a0fb5 = ((((((557) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1a2e7868b3b6a8f3cce2d42f() {
  return __cxx_static_address_1a2e7868b3b6a8f3cce2d42f.reference || (__cxx_static_address_1a2e7868b3b6a8f3cce2d42f.reference = {
    __cReference: true,
    get value() { return CHAIR2____header_global_efc67cb4e78a0fb5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:330
export const BROKENCHAIR____header_global_e32b84a663def04b = ((((((559) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eb6bf3e58632edec7910180e() {
  return __cxx_static_address_eb6bf3e58632edec7910180e.reference || (__cxx_static_address_eb6bf3e58632edec7910180e.reference = {
    __cReference: true,
    get value() { return BROKENCHAIR____header_global_e32b84a663def04b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:331
export const MIRROR____header_global_c9e13eef8b7f67f8 = ((((((560) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_08e68a39c9cc18ef2512dbf9() {
  return __cxx_static_address_08e68a39c9cc18ef2512dbf9.reference || (__cxx_static_address_08e68a39c9cc18ef2512dbf9.reference = {
    __cReference: true,
    get value() { return MIRROR____header_global_c9e13eef8b7f67f8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:332
export const WATERFOUNTAIN____header_global_6d161fd71fd9d2e8 = ((((((563) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_69d3d61425c6e61a258dd19c() {
  return __cxx_static_address_69d3d61425c6e61a258dd19c.reference || (__cxx_static_address_69d3d61425c6e61a258dd19c.reference = {
    __cReference: true,
    get value() { return WATERFOUNTAIN____header_global_6d161fd71fd9d2e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:333
export const WATERFOUNTAINBROKE____header_global_983806ed2b08e96d = ((((((567) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_83006ead5d8b2fb57cb20985() {
  return __cxx_static_address_83006ead5d8b2fb57cb20985.reference || (__cxx_static_address_83006ead5d8b2fb57cb20985.reference = {
    __cReference: true,
    get value() { return WATERFOUNTAINBROKE____header_global_983806ed2b08e96d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:334
export const FEMMAG1____header_global_c401a022cb5944ec = ((((((568) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8e6938dea807facf4d871d08() {
  return __cxx_static_address_8e6938dea807facf4d871d08.reference || (__cxx_static_address_8e6938dea807facf4d871d08.reference = {
    __cReference: true,
    get value() { return FEMMAG1____header_global_c401a022cb5944ec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:335
export const TOILET____header_global_82755d8cb4691d90 = ((((((569) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2acbdac76684b5e020ec2f36() {
  return __cxx_static_address_2acbdac76684b5e020ec2f36.reference || (__cxx_static_address_2acbdac76684b5e020ec2f36.reference = {
    __cReference: true,
    get value() { return TOILET____header_global_82755d8cb4691d90; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:336
export const STALL____header_global_246154220d3e85e6 = ((((((571) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5203da5b0226769b2fbcc60f() {
  return __cxx_static_address_5203da5b0226769b2fbcc60f.reference || (__cxx_static_address_5203da5b0226769b2fbcc60f.reference = {
    __cReference: true,
    get value() { return STALL____header_global_246154220d3e85e6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:337
export const STALLBROKE____header_global_034507f38bd5b6fe = ((((((573) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f995031062eeaf57c72ea575() {
  return __cxx_static_address_f995031062eeaf57c72ea575.reference || (__cxx_static_address_f995031062eeaf57c72ea575.reference = {
    __cReference: true,
    get value() { return STALLBROKE____header_global_034507f38bd5b6fe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:338
export const FEMMAG2____header_global_7b5832980949beb2 = ((((((577) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_39c86230da6ee4b4a0d6896f() {
  return __cxx_static_address_39c86230da6ee4b4a0d6896f.reference || (__cxx_static_address_39c86230da6ee4b4a0d6896f.reference = {
    __cReference: true,
    get value() { return FEMMAG2____header_global_7b5832980949beb2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:339
export const REACTOR2____header_global_c972fa95c3bba7e0 = ((((((578) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bb2c87e6f2675e02f2adc3d3() {
  return __cxx_static_address_bb2c87e6f2675e02f2adc3d3.reference || (__cxx_static_address_bb2c87e6f2675e02f2adc3d3.reference = {
    __cReference: true,
    get value() { return REACTOR2____header_global_c972fa95c3bba7e0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:340
export const REACTOR2BURNT____header_global_ab79373e344e8776 = ((((((579) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_89eeb11f1623af3340263465() {
  return __cxx_static_address_89eeb11f1623af3340263465.reference || (__cxx_static_address_89eeb11f1623af3340263465.reference = {
    __cReference: true,
    get value() { return REACTOR2BURNT____header_global_ab79373e344e8776; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:341
export const REACTOR2SPARK____header_global_3ea5008e42ea2635 = ((((((580) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_63a13d265ee3fd491bc980ba() {
  return __cxx_static_address_63a13d265ee3fd491bc980ba.reference || (__cxx_static_address_63a13d265ee3fd491bc980ba.reference = {
    __cReference: true,
    get value() { return REACTOR2SPARK____header_global_3ea5008e42ea2635; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:342
export const GRATE1____header_global_6c106fa413d6fa75 = ((((((595) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d95f8ecfc02f55206425a37a() {
  return __cxx_static_address_d95f8ecfc02f55206425a37a.reference || (__cxx_static_address_d95f8ecfc02f55206425a37a.reference = {
    __cReference: true,
    get value() { return GRATE1____header_global_6c106fa413d6fa75; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:343
export const BGRATE1____header_global_f9050ef7b05b44d7 = ((((((596) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d0c85d50d13e39833b4b8f7e() {
  return __cxx_static_address_d0c85d50d13e39833b4b8f7e.reference || (__cxx_static_address_d0c85d50d13e39833b4b8f7e.reference = {
    __cReference: true,
    get value() { return BGRATE1____header_global_f9050ef7b05b44d7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:344
export const SOLARPANNEL____header_global_7ce8977ce355139c = ((((((602) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f4fa2e45fc341b80fbf14598() {
  return __cxx_static_address_f4fa2e45fc341b80fbf14598.reference || (__cxx_static_address_f4fa2e45fc341b80fbf14598.reference = {
    __cReference: true,
    get value() { return SOLARPANNEL____header_global_7ce8977ce355139c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:345
export const NAKED1____header_global_be62a967deeeeae9 = ((((((603) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1f9b36a1f8a1d5beaa1582da() {
  return __cxx_static_address_1f9b36a1f8a1d5beaa1582da.reference || (__cxx_static_address_1f9b36a1f8a1d5beaa1582da.reference = {
    __cReference: true,
    get value() { return NAKED1____header_global_be62a967deeeeae9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:346
export const ANTENNA____header_global_63cbe1c5a0b60b24 = ((((((607) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a12cade4bcb4ff1b583e5d3f() {
  return __cxx_static_address_a12cade4bcb4ff1b583e5d3f.reference || (__cxx_static_address_a12cade4bcb4ff1b583e5d3f.reference = {
    __cReference: true,
    get value() { return ANTENNA____header_global_63cbe1c5a0b60b24; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:347
export const MASKWALL12____header_global_435eaaf9cdbe8fb0 = ((((((609) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a0ee4e8187e034050f63fff7() {
  return __cxx_static_address_a0ee4e8187e034050f63fff7.reference || (__cxx_static_address_a0ee4e8187e034050f63fff7.reference = {
    __cReference: true,
    get value() { return MASKWALL12____header_global_435eaaf9cdbe8fb0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:348
export const TOILETBROKE____header_global_1b39ecdb8dfc3f34 = ((((((615) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_540d4298184997e8bd8ead15() {
  return __cxx_static_address_540d4298184997e8bd8ead15.reference || (__cxx_static_address_540d4298184997e8bd8ead15.reference = {
    __cReference: true,
    get value() { return TOILETBROKE____header_global_1b39ecdb8dfc3f34; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:349
export const PIPE2____header_global_69f24f5eece3c028 = ((((((616) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_79910667bdcb622e0c47a487() {
  return __cxx_static_address_79910667bdcb622e0c47a487.reference || (__cxx_static_address_79910667bdcb622e0c47a487.reference = {
    __cReference: true,
    get value() { return PIPE2____header_global_69f24f5eece3c028; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:350
export const PIPE1B____header_global_c01b49f8c1659cff = ((((((617) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b53f80397dffb347213fe6dc() {
  return __cxx_static_address_b53f80397dffb347213fe6dc.reference || (__cxx_static_address_b53f80397dffb347213fe6dc.reference = {
    __cReference: true,
    get value() { return PIPE1B____header_global_c01b49f8c1659cff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:351
export const PIPE3____header_global_2dafc21d4ea76218 = ((((((618) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4381980068961fe2e20c1f66() {
  return __cxx_static_address_4381980068961fe2e20c1f66.reference || (__cxx_static_address_4381980068961fe2e20c1f66.reference = {
    __cReference: true,
    get value() { return PIPE3____header_global_2dafc21d4ea76218; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:352
export const PIPE1____header_global_56539c01c677d7e6 = ((((((619) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c9827d649eae5a2dce0dc0d3() {
  return __cxx_static_address_c9827d649eae5a2dce0dc0d3.reference || (__cxx_static_address_c9827d649eae5a2dce0dc0d3.reference = {
    __cReference: true,
    get value() { return PIPE1____header_global_56539c01c677d7e6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:353
export const CAMERA1____header_global_f63ad41195ff3b65 = ((((((621) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0ba0f5687a258d2c3df35500() {
  return __cxx_static_address_0ba0f5687a258d2c3df35500.reference || (__cxx_static_address_0ba0f5687a258d2c3df35500.reference = {
    __cReference: true,
    get value() { return CAMERA1____header_global_f63ad41195ff3b65; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:354
export const PIPE2B____header_global_2a2eab097efca499 = ((((((633) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_76af740af798c8a510df2bde() {
  return __cxx_static_address_76af740af798c8a510df2bde.reference || (__cxx_static_address_76af740af798c8a510df2bde.reference = {
    __cReference: true,
    get value() { return PIPE2B____header_global_2a2eab097efca499; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:355
export const BOLT1____header_global_e405055efb7a2221 = ((((((634) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0cb59416c8624ece953a8989() {
  return __cxx_static_address_0cb59416c8624ece953a8989.reference || (__cxx_static_address_0cb59416c8624ece953a8989.reference = {
    __cReference: true,
    get value() { return BOLT1____header_global_e405055efb7a2221; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:356
export const W_NUMBERS____header_global_377f2e73b639eaaf = ((((((640) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9f1abdc47d44a7f1c19b43d4() {
  return __cxx_static_address_9f1abdc47d44a7f1c19b43d4.reference || (__cxx_static_address_9f1abdc47d44a7f1c19b43d4.reference = {
    __cReference: true,
    get value() { return W_NUMBERS____header_global_377f2e73b639eaaf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:357
export const WATERDRIP____header_global_dadabde3eda2dd8a = ((((((660) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a7302e8341c5af746face932() {
  return __cxx_static_address_a7302e8341c5af746face932.reference || (__cxx_static_address_a7302e8341c5af746face932.reference = {
    __cReference: true,
    get value() { return WATERDRIP____header_global_dadabde3eda2dd8a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:358
export const WATERBUBBLE____header_global_17c7f892c344fb75 = ((((((661) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f19c1bd4dc3698489f10be06() {
  return __cxx_static_address_f19c1bd4dc3698489f10be06.reference || (__cxx_static_address_f19c1bd4dc3698489f10be06.reference = {
    __cReference: true,
    get value() { return WATERBUBBLE____header_global_17c7f892c344fb75; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:359
export const WATERBUBBLEMAKER____header_global_cd55a26aabfde19d = ((((((662) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_30f545c1773cc8109cd1e20d() {
  return __cxx_static_address_30f545c1773cc8109cd1e20d.reference || (__cxx_static_address_30f545c1773cc8109cd1e20d.reference = {
    __cReference: true,
    get value() { return WATERBUBBLEMAKER____header_global_cd55a26aabfde19d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:360
export const W_FORCEFIELD____header_global_044e1521aa2c46f3 = ((((((663) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4b0cf95be39459bef6362f36() {
  return __cxx_static_address_4b0cf95be39459bef6362f36.reference || (__cxx_static_address_4b0cf95be39459bef6362f36.reference = {
    __cReference: true,
    get value() { return W_FORCEFIELD____header_global_044e1521aa2c46f3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:361
export const VACUUM____header_global_4ca97fc1006775dd = ((((((669) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_688f83eb9d1f067c95c0c2e5() {
  return __cxx_static_address_688f83eb9d1f067c95c0c2e5.reference || (__cxx_static_address_688f83eb9d1f067c95c0c2e5.reference = {
    __cReference: true,
    get value() { return VACUUM____header_global_4ca97fc1006775dd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:362
export const FOOTPRINTS2____header_global_4a6c1009db2e99bf = ((((((672) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eb54fb409478c77f66f5127c() {
  return __cxx_static_address_eb54fb409478c77f66f5127c.reference || (__cxx_static_address_eb54fb409478c77f66f5127c.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS2____header_global_4a6c1009db2e99bf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:363
export const FOOTPRINTS3____header_global_f1885ef7e5c47aee = ((((((673) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_16ab6fd5026194534aec9888() {
  return __cxx_static_address_16ab6fd5026194534aec9888.reference || (__cxx_static_address_16ab6fd5026194534aec9888.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS3____header_global_f1885ef7e5c47aee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:364
export const FOOTPRINTS4____header_global_f52ff85a5f15452f = ((((((674) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_81d9d5be54b48b26b03a398c() {
  return __cxx_static_address_81d9d5be54b48b26b03a398c.reference || (__cxx_static_address_81d9d5be54b48b26b03a398c.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS4____header_global_f52ff85a5f15452f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:365
export const EGG____header_global_e90be04c5d4772d4 = ((((((675) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1db5a62ff839cc2df2bc8a48() {
  return __cxx_static_address_1db5a62ff839cc2df2bc8a48.reference || (__cxx_static_address_1db5a62ff839cc2df2bc8a48.reference = {
    __cReference: true,
    get value() { return EGG____header_global_e90be04c5d4772d4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:366
export const SCALE____header_global_ab846a1ea2a536f6 = ((((((678) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_209a49323fb23a4608037c38() {
  return __cxx_static_address_209a49323fb23a4608037c38.reference || (__cxx_static_address_209a49323fb23a4608037c38.reference = {
    __cReference: true,
    get value() { return SCALE____header_global_ab846a1ea2a536f6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:367
export const CHAIR3____header_global_6e0dcfef95acacb0 = ((((((680) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_96290061808754466ba6f2f1() {
  return __cxx_static_address_96290061808754466ba6f2f1.reference || (__cxx_static_address_96290061808754466ba6f2f1.reference = {
    __cReference: true,
    get value() { return CHAIR3____header_global_6e0dcfef95acacb0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:368
export const CAMERALIGHT____header_global_f19162b0fb30ffe8 = ((((((685) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f9199c0683a570ce0f960854() {
  return __cxx_static_address_f9199c0683a570ce0f960854.reference || (__cxx_static_address_f9199c0683a570ce0f960854.reference = {
    __cReference: true,
    get value() { return CAMERALIGHT____header_global_f19162b0fb30ffe8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:369
export const MOVIECAMERA____header_global_dacd80f7bde76c3c = ((((((686) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6473be07d990c18641e6ddbb() {
  return __cxx_static_address_6473be07d990c18641e6ddbb.reference || (__cxx_static_address_6473be07d990c18641e6ddbb.reference = {
    __cReference: true,
    get value() { return MOVIECAMERA____header_global_dacd80f7bde76c3c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:370
export const IVUNIT____header_global_5781d144ab4439dd = ((((((689) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d5a8612d013f650e95710dd5() {
  return __cxx_static_address_d5a8612d013f650e95710dd5.reference || (__cxx_static_address_d5a8612d013f650e95710dd5.reference = {
    __cReference: true,
    get value() { return IVUNIT____header_global_5781d144ab4439dd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:371
export const POT1____header_global_de383b882602f789 = ((((((694) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3348bfbcb2bf9c10a0cebf0d() {
  return __cxx_static_address_3348bfbcb2bf9c10a0cebf0d.reference || (__cxx_static_address_3348bfbcb2bf9c10a0cebf0d.reference = {
    __cReference: true,
    get value() { return POT1____header_global_de383b882602f789; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:372
export const POT2____header_global_0e3d95a1fa4febee = ((((((695) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_061b9ddb409fa6e5c9b41584() {
  return __cxx_static_address_061b9ddb409fa6e5c9b41584.reference || (__cxx_static_address_061b9ddb409fa6e5c9b41584.reference = {
    __cReference: true,
    get value() { return POT2____header_global_0e3d95a1fa4febee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:373
export const POT3____header_global_8aa3e4827176c2c4 = ((((((697) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c53a78f64d75dce05f6a3d30() {
  return __cxx_static_address_c53a78f64d75dce05f6a3d30.reference || (__cxx_static_address_c53a78f64d75dce05f6a3d30.reference = {
    __cReference: true,
    get value() { return POT3____header_global_8aa3e4827176c2c4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:374
export const PIPE3B____header_global_2e3ce9a7992f0253 = ((((((700) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1fc11dd64dcef9087a079f23() {
  return __cxx_static_address_1fc11dd64dcef9087a079f23.reference || (__cxx_static_address_1fc11dd64dcef9087a079f23.reference = {
    __cReference: true,
    get value() { return PIPE3B____header_global_2e3ce9a7992f0253; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:375
export const WALLLIGHT3____header_global_6f995a6549ba9871 = ((((((701) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_40c0d3754f0d82730e0022cc() {
  return __cxx_static_address_40c0d3754f0d82730e0022cc.reference || (__cxx_static_address_40c0d3754f0d82730e0022cc.reference = {
    __cReference: true,
    get value() { return WALLLIGHT3____header_global_6f995a6549ba9871; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:376
export const WALLLIGHTBUST3____header_global_b00d7cadd2536d1b = ((((((702) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8b3f421395e38d4bc1fa25f8() {
  return __cxx_static_address_8b3f421395e38d4bc1fa25f8.reference || (__cxx_static_address_8b3f421395e38d4bc1fa25f8.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST3____header_global_b00d7cadd2536d1b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:377
export const WALLLIGHT1____header_global_e329b323b77e65a7 = ((((((703) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5dbb21343b4beb48e685449c() {
  return __cxx_static_address_5dbb21343b4beb48e685449c.reference || (__cxx_static_address_5dbb21343b4beb48e685449c.reference = {
    __cReference: true,
    get value() { return WALLLIGHT1____header_global_e329b323b77e65a7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:378
export const WALLLIGHTBUST1____header_global_163706f9832360f0 = ((((((704) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f1c4a82321466bd72e333e24() {
  return __cxx_static_address_f1c4a82321466bd72e333e24.reference || (__cxx_static_address_f1c4a82321466bd72e333e24.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST1____header_global_163706f9832360f0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:379
export const WALLLIGHT2____header_global_c9e9506e1bdc83b6 = ((((((705) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_526189cd9ad18091139fef2b() {
  return __cxx_static_address_526189cd9ad18091139fef2b.reference || (__cxx_static_address_526189cd9ad18091139fef2b.reference = {
    __cReference: true,
    get value() { return WALLLIGHT2____header_global_c9e9506e1bdc83b6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:380
export const WALLLIGHTBUST2____header_global_0e39e955b9fc48f3 = ((((((706) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_965e80c556a97c6810e14d60() {
  return __cxx_static_address_965e80c556a97c6810e14d60.reference || (__cxx_static_address_965e80c556a97c6810e14d60.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST2____header_global_0e39e955b9fc48f3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:381
export const LIGHTSWITCH2____header_global_70675823835a8f95 = ((((((712) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2f988fc94c6322720975c659() {
  return __cxx_static_address_2f988fc94c6322720975c659.reference || (__cxx_static_address_2f988fc94c6322720975c659.reference = {
    __cReference: true,
    get value() { return LIGHTSWITCH2____header_global_70675823835a8f95; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:382
export const WAITTOBESEATED____header_global_3924e22b42f91fca = ((((((716) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_921555f13b9930bb006ff885() {
  return __cxx_static_address_921555f13b9930bb006ff885.reference || (__cxx_static_address_921555f13b9930bb006ff885.reference = {
    __cReference: true,
    get value() { return WAITTOBESEATED____header_global_3924e22b42f91fca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:383
export const DOORTILE14____header_global_76103e7d162bc44a = ((((((717) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_97bd6d22ddd762e962c8f235() {
  return __cxx_static_address_97bd6d22ddd762e962c8f235.reference || (__cxx_static_address_97bd6d22ddd762e962c8f235.reference = {
    __cReference: true,
    get value() { return DOORTILE14____header_global_76103e7d162bc44a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:384
export const STATUE____header_global_983df15dd1cc4174 = ((((((753) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e95a68f42395aa1fa07f7c88() {
  return __cxx_static_address_e95a68f42395aa1fa07f7c88.reference || (__cxx_static_address_e95a68f42395aa1fa07f7c88.reference = {
    __cReference: true,
    get value() { return STATUE____header_global_983df15dd1cc4174; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:385
export const MIKE____header_global_00faa65849f0e9b4 = ((((((762) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a1df9cfe4e3d947e97da14d8() {
  return __cxx_static_address_a1df9cfe4e3d947e97da14d8.reference || (__cxx_static_address_a1df9cfe4e3d947e97da14d8.reference = {
    __cReference: true,
    get value() { return MIKE____header_global_00faa65849f0e9b4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:386
export const VASE____header_global_807204cfc8bde7d4 = ((((((765) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_758e51fc36f4b3ac8c408edf() {
  return __cxx_static_address_758e51fc36f4b3ac8c408edf.reference || (__cxx_static_address_758e51fc36f4b3ac8c408edf.reference = {
    __cReference: true,
    get value() { return VASE____header_global_807204cfc8bde7d4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:387
export const SUSHIPLATE1____header_global_6520e8a84d405fa8 = ((((((768) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c49c00e910745a88b92800e8() {
  return __cxx_static_address_c49c00e910745a88b92800e8.reference || (__cxx_static_address_c49c00e910745a88b92800e8.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE1____header_global_6520e8a84d405fa8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:388
export const SUSHIPLATE2____header_global_c9f8a2676c538f57 = ((((((769) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9c6f0107b3cf47a06e99e310() {
  return __cxx_static_address_9c6f0107b3cf47a06e99e310.reference || (__cxx_static_address_9c6f0107b3cf47a06e99e310.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE2____header_global_c9f8a2676c538f57; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:389
export const SUSHIPLATE3____header_global_f6607d0f5223ccf5 = ((((((774) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_816ab97f072de24d0d29e745() {
  return __cxx_static_address_816ab97f072de24d0d29e745.reference || (__cxx_static_address_816ab97f072de24d0d29e745.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE3____header_global_f6607d0f5223ccf5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:390
export const SUSHIPLATE4____header_global_0b61fdb2ed023d75 = ((((((779) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_24836fc36c9713b73581a179() {
  return __cxx_static_address_24836fc36c9713b73581a179.reference || (__cxx_static_address_24836fc36c9713b73581a179.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE4____header_global_0b61fdb2ed023d75; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:391
export const DOORTILE16____header_global_2dbc229b61bada71 = ((((((781) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d16e00ec05f5b49cadeb9f61() {
  return __cxx_static_address_d16e00ec05f5b49cadeb9f61.reference || (__cxx_static_address_d16e00ec05f5b49cadeb9f61.reference = {
    __cReference: true,
    get value() { return DOORTILE16____header_global_2dbc229b61bada71; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:392
export const SUSHIPLATE5____header_global_398e516f19110e08 = ((((((792) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2235d047f83557b2f4c7ed32() {
  return __cxx_static_address_2235d047f83557b2f4c7ed32.reference || (__cxx_static_address_2235d047f83557b2f4c7ed32.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE5____header_global_398e516f19110e08; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:393
export const OJ____header_global_4c37c4a01352ac37 = ((((((806) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4e821c4dddbd6781ecc2ec0e() {
  return __cxx_static_address_4e821c4dddbd6781ecc2ec0e.reference || (__cxx_static_address_4e821c4dddbd6781ecc2ec0e.reference = {
    __cReference: true,
    get value() { return OJ____header_global_4c37c4a01352ac37; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:394
export const MASKWALL13____header_global_60ee6b6411dccbf0 = ((((((830) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_36c20377a7572f0facbe2f5d() {
  return __cxx_static_address_36c20377a7572f0facbe2f5d.reference || (__cxx_static_address_36c20377a7572f0facbe2f5d.reference = {
    __cReference: true,
    get value() { return MASKWALL13____header_global_60ee6b6411dccbf0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:395
export const HURTRAIL____header_global_b3c8fd286789dab9 = ((((((859) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4f74f4180c38153cb5b5b0b3() {
  return __cxx_static_address_4f74f4180c38153cb5b5b0b3.reference || (__cxx_static_address_4f74f4180c38153cb5b5b0b3.reference = {
    __cReference: true,
    get value() { return HURTRAIL____header_global_b3c8fd286789dab9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:396
export const POWERSWITCH1____header_global_89010328f2d05ac3 = ((((((860) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_641fe200e7e33b568dad5799() {
  return __cxx_static_address_641fe200e7e33b568dad5799.reference || (__cxx_static_address_641fe200e7e33b568dad5799.reference = {
    __cReference: true,
    get value() { return POWERSWITCH1____header_global_89010328f2d05ac3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:397
export const LOCKSWITCH1____header_global_fdcf5c64e70ea4f3 = ((((((862) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c0d6750ce8d86ab443d1c61f() {
  return __cxx_static_address_c0d6750ce8d86ab443d1c61f.reference || (__cxx_static_address_c0d6750ce8d86ab443d1c61f.reference = {
    __cReference: true,
    get value() { return LOCKSWITCH1____header_global_fdcf5c64e70ea4f3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:398
export const POWERSWITCH2____header_global_a033edf2890333ba = ((((((864) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b7a5320d2afee5cbba1b9f89() {
  return __cxx_static_address_b7a5320d2afee5cbba1b9f89.reference || (__cxx_static_address_b7a5320d2afee5cbba1b9f89.reference = {
    __cReference: true,
    get value() { return POWERSWITCH2____header_global_a033edf2890333ba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:399
export const ATM____header_global_9be92beae083b116 = ((((((867) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f02a1b03fda0c598c338d81c() {
  return __cxx_static_address_f02a1b03fda0c598c338d81c.reference || (__cxx_static_address_f02a1b03fda0c598c338d81c.reference = {
    __cReference: true,
    get value() { return ATM____header_global_9be92beae083b116; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:400
export const STATUEFLASH____header_global_a1f7caa2634ef0f0 = ((((((869) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c1121d90ec4a46a08e86c709() {
  return __cxx_static_address_c1121d90ec4a46a08e86c709.reference || (__cxx_static_address_c1121d90ec4a46a08e86c709.reference = {
    __cReference: true,
    get value() { return STATUEFLASH____header_global_a1f7caa2634ef0f0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:401
export const ATMBROKE____header_global_642f89788c49b4fc = ((((((888) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a86077208164d08782cba626() {
  return __cxx_static_address_a86077208164d08782cba626.reference || (__cxx_static_address_a86077208164d08782cba626.reference = {
    __cReference: true,
    get value() { return ATMBROKE____header_global_642f89788c49b4fc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:402
export const STRIPEBALL____header_global_6a060297a9ea3401 = ((((((901) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0be2cbd06d12b3a2f765b32a() {
  return __cxx_static_address_0be2cbd06d12b3a2f765b32a.reference || (__cxx_static_address_0be2cbd06d12b3a2f765b32a.reference = {
    __cReference: true,
    get value() { return STRIPEBALL____header_global_6a060297a9ea3401; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:403
export const QUEBALL____header_global_2e4735fc2c3cdec9 = ((((((902) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fcbf87e8ce2832ec9693ed30() {
  return __cxx_static_address_fcbf87e8ce2832ec9693ed30.reference || (__cxx_static_address_fcbf87e8ce2832ec9693ed30.reference = {
    __cReference: true,
    get value() { return QUEBALL____header_global_2e4735fc2c3cdec9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:404
export const POCKET____header_global_5821834ae78d6499 = ((((((903) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_26af9f5fec2a157ccdfd3941() {
  return __cxx_static_address_26af9f5fec2a157ccdfd3941.reference || (__cxx_static_address_26af9f5fec2a157ccdfd3941.reference = {
    __cReference: true,
    get value() { return POCKET____header_global_5821834ae78d6499; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:405
export const WOODENHORSE____header_global_1eff7314989ab887 = ((((((904) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_882bdd75e12f125889cd73a2() {
  return __cxx_static_address_882bdd75e12f125889cd73a2.reference || (__cxx_static_address_882bdd75e12f125889cd73a2.reference = {
    __cReference: true,
    get value() { return WOODENHORSE____header_global_1eff7314989ab887; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:406
export const TREE1____header_global_d8c6663cedbbbda2 = ((((((908) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d6d41dbf2f9370e2ab43f3a7() {
  return __cxx_static_address_d6d41dbf2f9370e2ab43f3a7.reference || (__cxx_static_address_d6d41dbf2f9370e2ab43f3a7.reference = {
    __cReference: true,
    get value() { return TREE1____header_global_d8c6663cedbbbda2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:407
export const TREE2____header_global_cf3dc937da4e4d35 = ((((((910) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b125d33e2b5c2966bb4a53ed() {
  return __cxx_static_address_b125d33e2b5c2966bb4a53ed.reference || (__cxx_static_address_b125d33e2b5c2966bb4a53ed.reference = {
    __cReference: true,
    get value() { return TREE2____header_global_cf3dc937da4e4d35; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:408
export const CACTUS____header_global_bd832760691edbc3 = ((((((911) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c2a30447cdc6e744417b9c63() {
  return __cxx_static_address_c2a30447cdc6e744417b9c63.reference || (__cxx_static_address_c2a30447cdc6e744417b9c63.reference = {
    __cReference: true,
    get value() { return CACTUS____header_global_bd832760691edbc3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:409
export const MASKWALL2____header_global_c01a19d7e7ef70fb = ((((((913) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fc541f942d151b51c5d689a1() {
  return __cxx_static_address_fc541f942d151b51c5d689a1.reference || (__cxx_static_address_fc541f942d151b51c5d689a1.reference = {
    __cReference: true,
    get value() { return MASKWALL2____header_global_c01a19d7e7ef70fb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:410
export const MASKWALL3____header_global_bea47f66c4746ed5 = ((((((914) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_96142c318bbbfc897cde8ca2() {
  return __cxx_static_address_96142c318bbbfc897cde8ca2.reference || (__cxx_static_address_96142c318bbbfc897cde8ca2.reference = {
    __cReference: true,
    get value() { return MASKWALL3____header_global_bea47f66c4746ed5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:411
export const MASKWALL4____header_global_ffa8e952a50755fd = ((((((915) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5da9e9aa3ab43db1e2fe606b() {
  return __cxx_static_address_5da9e9aa3ab43db1e2fe606b.reference || (__cxx_static_address_5da9e9aa3ab43db1e2fe606b.reference = {
    __cReference: true,
    get value() { return MASKWALL4____header_global_ffa8e952a50755fd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:412
export const FIREEXT____header_global_ac3192267b752afd = ((((((916) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ed1426416f727b088380a4fc() {
  return __cxx_static_address_ed1426416f727b088380a4fc.reference || (__cxx_static_address_ed1426416f727b088380a4fc.reference = {
    __cReference: true,
    get value() { return FIREEXT____header_global_ac3192267b752afd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:413
export const TOILETWATER____header_global_2e303a736dd9645e = ((((((921) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8a6ae8d0e28c6b8e9e612f73() {
  return __cxx_static_address_8a6ae8d0e28c6b8e9e612f73.reference || (__cxx_static_address_8a6ae8d0e28c6b8e9e612f73.reference = {
    __cReference: true,
    get value() { return TOILETWATER____header_global_2e303a736dd9645e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:414
export const NEON1____header_global_e2606cb61434ddcb = ((((((925) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a1204a086b69fe5aed8eb2b0() {
  return __cxx_static_address_a1204a086b69fe5aed8eb2b0.reference || (__cxx_static_address_a1204a086b69fe5aed8eb2b0.reference = {
    __cReference: true,
    get value() { return NEON1____header_global_e2606cb61434ddcb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:415
export const NEON2____header_global_dc5440d2269ca33e = ((((((926) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8ee8714de9a0217ffeac3b29() {
  return __cxx_static_address_8ee8714de9a0217ffeac3b29.reference || (__cxx_static_address_8ee8714de9a0217ffeac3b29.reference = {
    __cReference: true,
    get value() { return NEON2____header_global_dc5440d2269ca33e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:416
export const CACTUSBROKE____header_global_a8fdaeb7ec5cba46 = ((((((939) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cc4d193fb4cc682ab3bfa2dd() {
  return __cxx_static_address_cc4d193fb4cc682ab3bfa2dd.reference || (__cxx_static_address_cc4d193fb4cc682ab3bfa2dd.reference = {
    __cReference: true,
    get value() { return CACTUSBROKE____header_global_a8fdaeb7ec5cba46; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:417
export const BOUNCEMINE____header_global_11eea1799f7f6714 = ((((((940) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4e38a600278ad07622ff91c9() {
  return __cxx_static_address_4e38a600278ad07622ff91c9.reference || (__cxx_static_address_4e38a600278ad07622ff91c9.reference = {
    __cReference: true,
    get value() { return BOUNCEMINE____header_global_11eea1799f7f6714; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:418
export const BROKEFIREHYDRENT____header_global_75c79563b6d51d1d = ((((((950) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_748d1cd9f95ea8b7f3133fa2() {
  return __cxx_static_address_748d1cd9f95ea8b7f3133fa2.reference || (__cxx_static_address_748d1cd9f95ea8b7f3133fa2.reference = {
    __cReference: true,
    get value() { return BROKEFIREHYDRENT____header_global_75c79563b6d51d1d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:419
export const BOX____header_global_2ff9ed802b7fdb40 = ((((((951) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4fd774a113a63486425beea6() {
  return __cxx_static_address_4fd774a113a63486425beea6.reference || (__cxx_static_address_4fd774a113a63486425beea6.reference = {
    __cReference: true,
    get value() { return BOX____header_global_2ff9ed802b7fdb40; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:420
export const BULLETHOLE____header_global_8f09b675d44eb012 = ((((((952) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_af6efd2ddcd2e4e0b3713c08() {
  return __cxx_static_address_af6efd2ddcd2e4e0b3713c08.reference || (__cxx_static_address_af6efd2ddcd2e4e0b3713c08.reference = {
    __cReference: true,
    get value() { return BULLETHOLE____header_global_8f09b675d44eb012; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:421
export const BOTTLE1____header_global_de9b5a44295eb15d = ((((((954) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ab43f25a2cf7ccc540d928af() {
  return __cxx_static_address_ab43f25a2cf7ccc540d928af.reference || (__cxx_static_address_ab43f25a2cf7ccc540d928af.reference = {
    __cReference: true,
    get value() { return BOTTLE1____header_global_de9b5a44295eb15d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:422
export const BOTTLE2____header_global_0ccf2e472702f123 = ((((((955) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_61e5e3a792ebb688d329b57d() {
  return __cxx_static_address_61e5e3a792ebb688d329b57d.reference || (__cxx_static_address_61e5e3a792ebb688d329b57d.reference = {
    __cReference: true,
    get value() { return BOTTLE2____header_global_0ccf2e472702f123; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:423
export const BOTTLE3____header_global_0c01d9c1790d368e = ((((((956) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e351fad7580ed73f8cee0651() {
  return __cxx_static_address_e351fad7580ed73f8cee0651.reference || (__cxx_static_address_e351fad7580ed73f8cee0651.reference = {
    __cReference: true,
    get value() { return BOTTLE3____header_global_0c01d9c1790d368e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:424
export const BOTTLE4____header_global_bc741894aaea8349 = ((((((957) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e7b6d3e53423308728a82f90() {
  return __cxx_static_address_e7b6d3e53423308728a82f90.reference || (__cxx_static_address_e7b6d3e53423308728a82f90.reference = {
    __cReference: true,
    get value() { return BOTTLE4____header_global_bc741894aaea8349; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:425
export const FEMPIC5____header_global_7c31107a6b261257 = ((((((963) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d7a1669cf4dfbacd9048c27b() {
  return __cxx_static_address_d7a1669cf4dfbacd9048c27b.reference || (__cxx_static_address_d7a1669cf4dfbacd9048c27b.reference = {
    __cReference: true,
    get value() { return FEMPIC5____header_global_7c31107a6b261257; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:426
export const FEMPIC6____header_global_4eb3d9f032d09c7a = ((((((964) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_be0dbd6f0e9f9520ab76db88() {
  return __cxx_static_address_be0dbd6f0e9f9520ab76db88.reference || (__cxx_static_address_be0dbd6f0e9f9520ab76db88.reference = {
    __cReference: true,
    get value() { return FEMPIC6____header_global_4eb3d9f032d09c7a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:427
export const FEMPIC7____header_global_5f88237f1fcab15c = ((((((965) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7c68b79baccf7421a14d3ae7() {
  return __cxx_static_address_7c68b79baccf7421a14d3ae7.reference || (__cxx_static_address_7c68b79baccf7421a14d3ae7.reference = {
    __cReference: true,
    get value() { return FEMPIC7____header_global_5f88237f1fcab15c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:428
export const HYDROPLANT____header_global_c18e7a3c6a4aba7d = ((((((969) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6cb5c6840fac8a284bf32cf6() {
  return __cxx_static_address_6cb5c6840fac8a284bf32cf6.reference || (__cxx_static_address_6cb5c6840fac8a284bf32cf6.reference = {
    __cReference: true,
    get value() { return HYDROPLANT____header_global_c18e7a3c6a4aba7d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:429
export const OCEANSPRITE1____header_global_834d176ee12156d6 = ((((((971) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e5f219ff96f161a7c0ffaa33() {
  return __cxx_static_address_e5f219ff96f161a7c0ffaa33.reference || (__cxx_static_address_e5f219ff96f161a7c0ffaa33.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE1____header_global_834d176ee12156d6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:430
export const OCEANSPRITE2____header_global_8dccba78ade206d5 = ((((((972) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cd77ccb0b617aff9a4484ff1() {
  return __cxx_static_address_cd77ccb0b617aff9a4484ff1.reference || (__cxx_static_address_cd77ccb0b617aff9a4484ff1.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE2____header_global_8dccba78ade206d5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:431
export const OCEANSPRITE3____header_global_c185cf17755fc006 = ((((((973) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fcb4a75cd43a217ab712f2fd() {
  return __cxx_static_address_fcb4a75cd43a217ab712f2fd.reference || (__cxx_static_address_fcb4a75cd43a217ab712f2fd.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE3____header_global_c185cf17755fc006; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:432
export const OCEANSPRITE4____header_global_c71c3e010d23ea84 = ((((((974) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bf845947f3c3ecbfdb3c1fb6() {
  return __cxx_static_address_bf845947f3c3ecbfdb3c1fb6.reference || (__cxx_static_address_bf845947f3c3ecbfdb3c1fb6.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE4____header_global_c71c3e010d23ea84; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:433
export const OCEANSPRITE5____header_global_30374fb755db864f = ((((((975) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b82c27be6571712e670a827f() {
  return __cxx_static_address_b82c27be6571712e670a827f.reference || (__cxx_static_address_b82c27be6571712e670a827f.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE5____header_global_30374fb755db864f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:434
export const GENERICPOLE____header_global_3ddb4aabaceb74af = ((((((977) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_948cab464e7ec8165af508e9() {
  return __cxx_static_address_948cab464e7ec8165af508e9.reference || (__cxx_static_address_948cab464e7ec8165af508e9.reference = {
    __cReference: true,
    get value() { return GENERICPOLE____header_global_3ddb4aabaceb74af; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:435
export const CONE____header_global_5fa29d437b51c3b3 = ((((((978) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ff9b03b49922b9b517015797() {
  return __cxx_static_address_ff9b03b49922b9b517015797.reference || (__cxx_static_address_ff9b03b49922b9b517015797.reference = {
    __cReference: true,
    get value() { return CONE____header_global_5fa29d437b51c3b3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:436
export const HANGLIGHT____header_global_121df5c99dea5276 = ((((((979) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8ec85dc1644e71f4b02e1f9a() {
  return __cxx_static_address_8ec85dc1644e71f4b02e1f9a.reference || (__cxx_static_address_8ec85dc1644e71f4b02e1f9a.reference = {
    __cReference: true,
    get value() { return HANGLIGHT____header_global_121df5c99dea5276; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:437
export const HYDRENT____header_global_16619f04514a9005 = ((((((981) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c51fb97e5327859849988109() {
  return __cxx_static_address_c51fb97e5327859849988109.reference || (__cxx_static_address_c51fb97e5327859849988109.reference = {
    __cReference: true,
    get value() { return HYDRENT____header_global_16619f04514a9005; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:438
export const MASKWALL14____header_global_6fe399148b4bc288 = ((((((988) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_74b1200a25919a98bd33423c() {
  return __cxx_static_address_74b1200a25919a98bd33423c.reference || (__cxx_static_address_74b1200a25919a98bd33423c.reference = {
    __cReference: true,
    get value() { return MASKWALL14____header_global_6fe399148b4bc288; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:439
export const TIRE____header_global_4bfcdd803a8e2168 = ((((((990) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9b18cf111fc2266fb020b6a3() {
  return __cxx_static_address_9b18cf111fc2266fb020b6a3.reference || (__cxx_static_address_9b18cf111fc2266fb020b6a3.reference = {
    __cReference: true,
    get value() { return TIRE____header_global_4bfcdd803a8e2168; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:440
export const PIPE5____header_global_27b2f11f9f80d06b = ((((((994) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_394c03c2c2a31ccddf1bc336() {
  return __cxx_static_address_394c03c2c2a31ccddf1bc336.reference || (__cxx_static_address_394c03c2c2a31ccddf1bc336.reference = {
    __cReference: true,
    get value() { return PIPE5____header_global_27b2f11f9f80d06b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:441
export const PIPE6____header_global_aaa5f4a29f79cf20 = ((((((995) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_afb09eaaf5a3b685aae7a2e6() {
  return __cxx_static_address_afb09eaaf5a3b685aae7a2e6.reference || (__cxx_static_address_afb09eaaf5a3b685aae7a2e6.reference = {
    __cReference: true,
    get value() { return PIPE6____header_global_aaa5f4a29f79cf20; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:442
export const PIPE4____header_global_738fd239231416ac = ((((((996) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ea913da834a395e1fc44d1e8() {
  return __cxx_static_address_ea913da834a395e1fc44d1e8.reference || (__cxx_static_address_ea913da834a395e1fc44d1e8.reference = {
    __cReference: true,
    get value() { return PIPE4____header_global_738fd239231416ac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:443
export const PIPE4B____header_global_ba0eddbc919a4f48 = ((((((997) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_742081cba9d0e0fedfe1d9a8() {
  return __cxx_static_address_742081cba9d0e0fedfe1d9a8.reference || (__cxx_static_address_742081cba9d0e0fedfe1d9a8.reference = {
    __cReference: true,
    get value() { return PIPE4B____header_global_ba0eddbc919a4f48; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:444
export const BROKEHYDROPLANT____header_global_6e1b4c2d12b0c34c = ((((((1003) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5b09acbebb07e6a010193b30() {
  return __cxx_static_address_5b09acbebb07e6a010193b30.reference || (__cxx_static_address_5b09acbebb07e6a010193b30.reference = {
    __cReference: true,
    get value() { return BROKEHYDROPLANT____header_global_6e1b4c2d12b0c34c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:445
export const PIPE5B____header_global_19635c26e445be94 = ((((((1005) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e97363baae207aceadb5cc23() {
  return __cxx_static_address_e97363baae207aceadb5cc23.reference || (__cxx_static_address_e97363baae207aceadb5cc23.reference = {
    __cReference: true,
    get value() { return PIPE5B____header_global_19635c26e445be94; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:446
export const NEON3____header_global_b696734b3175a5ed = ((((((1007) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_85f2fb961516435ffca98dcf() {
  return __cxx_static_address_85f2fb961516435ffca98dcf.reference || (__cxx_static_address_85f2fb961516435ffca98dcf.reference = {
    __cReference: true,
    get value() { return NEON3____header_global_b696734b3175a5ed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:447
export const NEON4____header_global_9f31a910c8b23898 = ((((((1008) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bdbc7167414023a65ffaa2d3() {
  return __cxx_static_address_bdbc7167414023a65ffaa2d3.reference || (__cxx_static_address_bdbc7167414023a65ffaa2d3.reference = {
    __cReference: true,
    get value() { return NEON4____header_global_9f31a910c8b23898; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:448
export const NEON5____header_global_e80a00f90aaa47d3 = ((((((1009) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a3d58a8ab94bcf7b26b52c88() {
  return __cxx_static_address_a3d58a8ab94bcf7b26b52c88.reference || (__cxx_static_address_a3d58a8ab94bcf7b26b52c88.reference = {
    __cReference: true,
    get value() { return NEON5____header_global_e80a00f90aaa47d3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:449
export const BOTTLE5____header_global_318105ed25a99f0e = ((((((1012) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_60de4718f961acbced1806df() {
  return __cxx_static_address_60de4718f961acbced1806df.reference || (__cxx_static_address_60de4718f961acbced1806df.reference = {
    __cReference: true,
    get value() { return BOTTLE5____header_global_318105ed25a99f0e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:450
export const BOTTLE6____header_global_7a00902797fe4828 = ((((((1013) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_af5ce53c59fcb5199a90babd() {
  return __cxx_static_address_af5ce53c59fcb5199a90babd.reference || (__cxx_static_address_af5ce53c59fcb5199a90babd.reference = {
    __cReference: true,
    get value() { return BOTTLE6____header_global_7a00902797fe4828; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:451
export const BOTTLE8____header_global_dd7a2697e1896f88 = ((((((1014) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7d1f2ca53ccab6e32ccf3596() {
  return __cxx_static_address_7d1f2ca53ccab6e32ccf3596.reference || (__cxx_static_address_7d1f2ca53ccab6e32ccf3596.reference = {
    __cReference: true,
    get value() { return BOTTLE8____header_global_dd7a2697e1896f88; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:452
export const SPOTLITE____header_global_2a569cfeae1acbe3 = ((((((1020) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_55674580aabebe2d46edd7c3() {
  return __cxx_static_address_55674580aabebe2d46edd7c3.reference || (__cxx_static_address_55674580aabebe2d46edd7c3.reference = {
    __cReference: true,
    get value() { return SPOTLITE____header_global_2a569cfeae1acbe3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:453
export const MASKWALL15____header_global_f819ae0d46cbb737 = ((((((1024) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fadf603351cbaaccbae2d09f() {
  return __cxx_static_address_fadf603351cbaaccbae2d09f.reference || (__cxx_static_address_fadf603351cbaaccbae2d09f.reference = {
    __cReference: true,
    get value() { return MASKWALL15____header_global_f819ae0d46cbb737; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:454
export const BOTTLE7____header_global_47fe249071b27b80 = ((((((1025) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_000cca90020caabebb7402fd() {
  return __cxx_static_address_000cca90020caabebb7402fd.reference || (__cxx_static_address_000cca90020caabebb7402fd.reference = {
    __cReference: true,
    get value() { return BOTTLE7____header_global_47fe249071b27b80; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:455
export const HORSEONSIDE____header_global_39822d553fe63759 = ((((((1026) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c973e3abb58a7fe513cc209c() {
  return __cxx_static_address_c973e3abb58a7fe513cc209c.reference || (__cxx_static_address_c973e3abb58a7fe513cc209c.reference = {
    __cReference: true,
    get value() { return HORSEONSIDE____header_global_39822d553fe63759; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:456
export const GLASSPIECES____header_global_31838994053cb67f = ((((((1031) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b6d87231f965adad97f65896() {
  return __cxx_static_address_b6d87231f965adad97f65896.reference || (__cxx_static_address_b6d87231f965adad97f65896.reference = {
    __cReference: true,
    get value() { return GLASSPIECES____header_global_31838994053cb67f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:457
export const NEON6____header_global_c9f4d1d51c4dc9b4 = ((((((1046) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c0bbab7a2c66430bb1dff647() {
  return __cxx_static_address_c0bbab7a2c66430bb1dff647.reference || (__cxx_static_address_c0bbab7a2c66430bb1dff647.reference = {
    __cReference: true,
    get value() { return NEON6____header_global_c9f4d1d51c4dc9b4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:458
export const MASKWALL6____header_global_d00575ab6f86dce3 = ((((((1059) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_90bd03475dc18d627c7822bf() {
  return __cxx_static_address_90bd03475dc18d627c7822bf.reference || (__cxx_static_address_90bd03475dc18d627c7822bf.reference = {
    __cReference: true,
    get value() { return MASKWALL6____header_global_d00575ab6f86dce3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:459
export const RUBBERCAN____header_global_ff2eeba081902aa0 = ((((((1062) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2581250860875b44e4f4d5fa() {
  return __cxx_static_address_2581250860875b44e4f4d5fa.reference || (__cxx_static_address_2581250860875b44e4f4d5fa.reference = {
    __cReference: true,
    get value() { return RUBBERCAN____header_global_ff2eeba081902aa0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:460
export const PLUG____header_global_b348ced2d74df437 = ((((((1069) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e5ff14ab693d3af3662d2f6e() {
  return __cxx_static_address_e5ff14ab693d3af3662d2f6e.reference || (__cxx_static_address_e5ff14ab693d3af3662d2f6e.reference = {
    __cReference: true,
    get value() { return PLUG____header_global_b348ced2d74df437; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:461
export const OOZFILTER____header_global_94f9a672cd9aaf5c = ((((((1079) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_92be123cd18d4f8075252672() {
  return __cxx_static_address_92be123cd18d4f8075252672.reference || (__cxx_static_address_92be123cd18d4f8075252672.reference = {
    __cReference: true,
    get value() { return OOZFILTER____header_global_94f9a672cd9aaf5c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:462
export const FLOORPLASMA____header_global_82085c7e93f7237d = ((((((1082) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_72ff02044de8f593329a75c4() {
  return __cxx_static_address_72ff02044de8f593329a75c4.reference || (__cxx_static_address_72ff02044de8f593329a75c4.reference = {
    __cReference: true,
    get value() { return FLOORPLASMA____header_global_82085c7e93f7237d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:463
export const REACTOR____header_global_d116a24ad28d23fd = ((((((1088) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_51dc7c4fd7858d808a293802() {
  return __cxx_static_address_51dc7c4fd7858d808a293802.reference || (__cxx_static_address_51dc7c4fd7858d808a293802.reference = {
    __cReference: true,
    get value() { return REACTOR____header_global_d116a24ad28d23fd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:464
export const REACTORSPARK____header_global_01d5a5c418a1538b = ((((((1092) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_60bdd54efb44d0e58155eaea() {
  return __cxx_static_address_60bdd54efb44d0e58155eaea.reference || (__cxx_static_address_60bdd54efb44d0e58155eaea.reference = {
    __cReference: true,
    get value() { return REACTORSPARK____header_global_01d5a5c418a1538b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:465
export const REACTORBURNT____header_global_2120517dde0dba37 = ((((((1096) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7bb2c3f4847d9eeaabe5faef() {
  return __cxx_static_address_7bb2c3f4847d9eeaabe5faef.reference || (__cxx_static_address_7bb2c3f4847d9eeaabe5faef.reference = {
    __cReference: true,
    get value() { return REACTORBURNT____header_global_2120517dde0dba37; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:466
export const DOORTILE15____header_global_e24763cb48132d00 = ((((((1102) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1548313877eb7cd73c409e30() {
  return __cxx_static_address_1548313877eb7cd73c409e30.reference || (__cxx_static_address_1548313877eb7cd73c409e30.reference = {
    __cReference: true,
    get value() { return DOORTILE15____header_global_e24763cb48132d00; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:467
export const HANDSWITCH____header_global_4d69db733615a2d8 = ((((((1111) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7047f640884f3a4dca7b3b33() {
  return __cxx_static_address_7047f640884f3a4dca7b3b33.reference || (__cxx_static_address_7047f640884f3a4dca7b3b33.reference = {
    __cReference: true,
    get value() { return HANDSWITCH____header_global_4d69db733615a2d8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:468
export const CIRCLEPANNEL____header_global_d424d6ca827b6ad8 = ((((((1113) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7ebf654da01fb2f28953b040() {
  return __cxx_static_address_7ebf654da01fb2f28953b040.reference || (__cxx_static_address_7ebf654da01fb2f28953b040.reference = {
    __cReference: true,
    get value() { return CIRCLEPANNEL____header_global_d424d6ca827b6ad8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:469
export const CIRCLEPANNELBROKE____header_global_b729fe6e09cc3d4c = ((((((1114) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_97f073308a3bc21e6e3b3317() {
  return __cxx_static_address_97f073308a3bc21e6e3b3317.reference || (__cxx_static_address_97f073308a3bc21e6e3b3317.reference = {
    __cReference: true,
    get value() { return CIRCLEPANNELBROKE____header_global_b729fe6e09cc3d4c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:470
export const PULLSWITCH____header_global_5339fa2754973089 = ((((((1122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ea46bb404cccf633b38302cf() {
  return __cxx_static_address_ea46bb404cccf633b38302cf.reference || (__cxx_static_address_ea46bb404cccf633b38302cf.reference = {
    __cReference: true,
    get value() { return PULLSWITCH____header_global_5339fa2754973089; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:471
export const MASKWALL8____header_global_e83670e3c6661179 = ((((((1124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f4d444508ce329ef769fcd5d() {
  return __cxx_static_address_f4d444508ce329ef769fcd5d.reference || (__cxx_static_address_f4d444508ce329ef769fcd5d.reference = {
    __cReference: true,
    get value() { return MASKWALL8____header_global_e83670e3c6661179; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:472
export const BIGHOLE____header_global_2ec26ef64184e959 = ((((((1141) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_87538f9904b872cb203e151e() {
  return __cxx_static_address_87538f9904b872cb203e151e.reference || (__cxx_static_address_87538f9904b872cb203e151e.reference = {
    __cReference: true,
    get value() { return BIGHOLE____header_global_2ec26ef64184e959; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:473
export const ALIENSWITCH____header_global_4b15a3f25b36af96 = ((((((1142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1d5f1c892597a9ce424c1d4d() {
  return __cxx_static_address_1d5f1c892597a9ce424c1d4d.reference || (__cxx_static_address_1d5f1c892597a9ce424c1d4d.reference = {
    __cReference: true,
    get value() { return ALIENSWITCH____header_global_4b15a3f25b36af96; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:474
export const DOORTILE21____header_global_89a6b27914796f2c = ((((((1144) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d72db3b01b1ec19b50ad7835() {
  return __cxx_static_address_d72db3b01b1ec19b50ad7835.reference || (__cxx_static_address_d72db3b01b1ec19b50ad7835.reference = {
    __cReference: true,
    get value() { return DOORTILE21____header_global_89a6b27914796f2c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:475
export const HANDPRINTSWITCH____header_global_ae635e2246a82bd6 = ((((((1155) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_83ddf6c73ae42f6e3df8fc2d() {
  return __cxx_static_address_83ddf6c73ae42f6e3df8fc2d.reference || (__cxx_static_address_83ddf6c73ae42f6e3df8fc2d.reference = {
    __cReference: true,
    get value() { return HANDPRINTSWITCH____header_global_ae635e2246a82bd6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:476
export const BOTTLE10____header_global_e39fb332361582d3 = ((((((1157) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_981825ea1a1a99d90963abbe() {
  return __cxx_static_address_981825ea1a1a99d90963abbe.reference || (__cxx_static_address_981825ea1a1a99d90963abbe.reference = {
    __cReference: true,
    get value() { return BOTTLE10____header_global_e39fb332361582d3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:477
export const BOTTLE11____header_global_14611032f1c11a55 = ((((((1158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_40b2f24fcf2e2450a64d99d2() {
  return __cxx_static_address_40b2f24fcf2e2450a64d99d2.reference || (__cxx_static_address_40b2f24fcf2e2450a64d99d2.reference = {
    __cReference: true,
    get value() { return BOTTLE11____header_global_14611032f1c11a55; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:478
export const BOTTLE12____header_global_5e8a1ad0c2e744b8 = ((((((1159) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_484756b6a0f81ddf57ac3c44() {
  return __cxx_static_address_484756b6a0f81ddf57ac3c44.reference || (__cxx_static_address_484756b6a0f81ddf57ac3c44.reference = {
    __cReference: true,
    get value() { return BOTTLE12____header_global_5e8a1ad0c2e744b8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:479
export const BOTTLE13____header_global_480f7a5286640357 = ((((((1160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8fe614aa1d9dbcd6795ae5e6() {
  return __cxx_static_address_8fe614aa1d9dbcd6795ae5e6.reference || (__cxx_static_address_8fe614aa1d9dbcd6795ae5e6.reference = {
    __cReference: true,
    get value() { return BOTTLE13____header_global_480f7a5286640357; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:480
export const BOTTLE14____header_global_35f27741cc93ca37 = ((((((1161) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7879a2ed8adcdbe97aef5707() {
  return __cxx_static_address_7879a2ed8adcdbe97aef5707.reference || (__cxx_static_address_7879a2ed8adcdbe97aef5707.reference = {
    __cReference: true,
    get value() { return BOTTLE14____header_global_35f27741cc93ca37; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:481
export const BOTTLE15____header_global_76d76bc13634b8ab = ((((((1162) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c5d2f54c30cb8dc6757b778d() {
  return __cxx_static_address_c5d2f54c30cb8dc6757b778d.reference || (__cxx_static_address_c5d2f54c30cb8dc6757b778d.reference = {
    __cReference: true,
    get value() { return BOTTLE15____header_global_76d76bc13634b8ab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:482
export const BOTTLE16____header_global_b0fe294848c260cb = ((((((1163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_206cd429e4ff4cf95f78b970() {
  return __cxx_static_address_206cd429e4ff4cf95f78b970.reference || (__cxx_static_address_206cd429e4ff4cf95f78b970.reference = {
    __cReference: true,
    get value() { return BOTTLE16____header_global_b0fe294848c260cb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:483
export const BOTTLE17____header_global_1bb07ba8f1d36c13 = ((((((1164) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_337d3c86707883c2af99351f() {
  return __cxx_static_address_337d3c86707883c2af99351f.reference || (__cxx_static_address_337d3c86707883c2af99351f.reference = {
    __cReference: true,
    get value() { return BOTTLE17____header_global_1bb07ba8f1d36c13; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:484
export const BOTTLE18____header_global_ac57ebc328d5668f = ((((((1165) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_661ad42a7d3f113dace67524() {
  return __cxx_static_address_661ad42a7d3f113dace67524.reference || (__cxx_static_address_661ad42a7d3f113dace67524.reference = {
    __cReference: true,
    get value() { return BOTTLE18____header_global_ac57ebc328d5668f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:485
export const BOTTLE19____header_global_bf682d91e2f20443 = ((((((1166) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c2345b4bb838820fc9c68b4b() {
  return __cxx_static_address_c2345b4bb838820fc9c68b4b.reference || (__cxx_static_address_c2345b4bb838820fc9c68b4b.reference = {
    __cReference: true,
    get value() { return BOTTLE19____header_global_bf682d91e2f20443; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:486
export const DOORTILE17____header_global_a5c5c5223383cc27 = ((((((1169) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_15bd89707c9a440df43f6d71() {
  return __cxx_static_address_15bd89707c9a440df43f6d71.reference || (__cxx_static_address_15bd89707c9a440df43f6d71.reference = {
    __cReference: true,
    get value() { return DOORTILE17____header_global_a5c5c5223383cc27; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:487
export const MASKWALL7____header_global_983efaff0cf9a281 = ((((((1174) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6b006cc180e01d480e4fba67() {
  return __cxx_static_address_6b006cc180e01d480e4fba67.reference || (__cxx_static_address_6b006cc180e01d480e4fba67.reference = {
    __cReference: true,
    get value() { return MASKWALL7____header_global_983efaff0cf9a281; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:488
export const DOORTILE11____header_global_74b4f436484309c0 = ((((((1178) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3b6f62ed31d031ab5866ef14() {
  return __cxx_static_address_3b6f62ed31d031ab5866ef14.reference || (__cxx_static_address_3b6f62ed31d031ab5866ef14.reference = {
    __cReference: true,
    get value() { return DOORTILE11____header_global_74b4f436484309c0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:489
export const DOORTILE12____header_global_3e426914081ab196 = ((((((1179) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5b27e6dc4529f2795f642d3e() {
  return __cxx_static_address_5b27e6dc4529f2795f642d3e.reference || (__cxx_static_address_5b27e6dc4529f2795f642d3e.reference = {
    __cReference: true,
    get value() { return DOORTILE12____header_global_3e426914081ab196; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:490
export const VENDMACHINE____header_global_c871c04a83deed82 = ((((((1212) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b0b72d6ab01bdddda122cb8e() {
  return __cxx_static_address_b0b72d6ab01bdddda122cb8e.reference || (__cxx_static_address_b0b72d6ab01bdddda122cb8e.reference = {
    __cReference: true,
    get value() { return VENDMACHINE____header_global_c871c04a83deed82; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:491
export const COLAMACHINE____header_global_02e9c78c36b674b6 = ((((((1215) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_652c1f326a1f2ff3909e3806() {
  return __cxx_static_address_652c1f326a1f2ff3909e3806.reference || (__cxx_static_address_652c1f326a1f2ff3909e3806.reference = {
    __cReference: true,
    get value() { return COLAMACHINE____header_global_02e9c78c36b674b6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:492
export const CRANEPOLE____header_global_7fd162f12d99eac6 = ((((((1221) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a8e8268e3249ea1258d8b489() {
  return __cxx_static_address_a8e8268e3249ea1258d8b489.reference || (__cxx_static_address_a8e8268e3249ea1258d8b489.reference = {
    __cReference: true,
    get value() { return CRANEPOLE____header_global_7fd162f12d99eac6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:493
export const CRANE____header_global_77e8fe4fb4880cbd = ((((((1222) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2c69ec8bd56497f630452199() {
  return __cxx_static_address_2c69ec8bd56497f630452199.reference || (__cxx_static_address_2c69ec8bd56497f630452199.reference = {
    __cReference: true,
    get value() { return CRANE____header_global_77e8fe4fb4880cbd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:494
export const BARBROKE____header_global_5cb2f5923a6c366a = ((((((1225) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_babacabd47b095495f5caabf() {
  return __cxx_static_address_babacabd47b095495f5caabf.reference || (__cxx_static_address_babacabd47b095495f5caabf.reference = {
    __cReference: true,
    get value() { return BARBROKE____header_global_5cb2f5923a6c366a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:495
export const BLOODPOOL____header_global_49566db89cdd1cc9 = ((((((1226) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_692497bee9cfb7d94b81946f() {
  return __cxx_static_address_692497bee9cfb7d94b81946f.reference || (__cxx_static_address_692497bee9cfb7d94b81946f.reference = {
    __cReference: true,
    get value() { return BLOODPOOL____header_global_49566db89cdd1cc9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:496
export const NUKEBARREL____header_global_bc975e84157c5fe2 = ((((((1227) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_93105277233382eed36e5f6f() {
  return __cxx_static_address_93105277233382eed36e5f6f.reference || (__cxx_static_address_93105277233382eed36e5f6f.reference = {
    __cReference: true,
    get value() { return NUKEBARREL____header_global_bc975e84157c5fe2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:497
export const NUKEBARRELDENTED____header_global_b64da5616c2ea8e7 = ((((((1228) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fcb6387aa7e0a67e5144b96b() {
  return __cxx_static_address_fcb6387aa7e0a67e5144b96b.reference || (__cxx_static_address_fcb6387aa7e0a67e5144b96b.reference = {
    __cReference: true,
    get value() { return NUKEBARRELDENTED____header_global_b64da5616c2ea8e7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:498
export const NUKEBARRELLEAKED____header_global_af3738c80969b634 = ((((((1229) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e4c5178c9f0b8ebe8d21d93() {
  return __cxx_static_address_1e4c5178c9f0b8ebe8d21d93.reference || (__cxx_static_address_1e4c5178c9f0b8ebe8d21d93.reference = {
    __cReference: true,
    get value() { return NUKEBARRELLEAKED____header_global_af3738c80969b634; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:499
export const CANWITHSOMETHING____header_global_f752245de8ee1c36 = ((((((1232) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e128d6398d5db267c75af728() {
  return __cxx_static_address_e128d6398d5db267c75af728.reference || (__cxx_static_address_e128d6398d5db267c75af728.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING____header_global_f752245de8ee1c36; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:500
export const MONEY____header_global_a8716cc923c1ebba = ((((((1233) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_be87e67ff3a516af17f27e53() {
  return __cxx_static_address_be87e67ff3a516af17f27e53.reference || (__cxx_static_address_be87e67ff3a516af17f27e53.reference = {
    __cReference: true,
    get value() { return MONEY____header_global_a8716cc923c1ebba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:501
export const BANNER____header_global_dc9027579b909b02 = ((((((1236) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_38af7ef8525a9ce112d773f8() {
  return __cxx_static_address_38af7ef8525a9ce112d773f8.reference || (__cxx_static_address_38af7ef8525a9ce112d773f8.reference = {
    __cReference: true,
    get value() { return BANNER____header_global_dc9027579b909b02; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:502
export const EXPLODINGBARREL____header_global_f85efe361ff237ef = ((((((1238) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9b2f103267787c8a6ab0c03f() {
  return __cxx_static_address_9b2f103267787c8a6ab0c03f.reference || (__cxx_static_address_9b2f103267787c8a6ab0c03f.reference = {
    __cReference: true,
    get value() { return EXPLODINGBARREL____header_global_f85efe361ff237ef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:503
export const EXPLODINGBARREL2____header_global_57e5af0289083d2f = ((((((1239) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_75696427a6c248ef032523dd() {
  return __cxx_static_address_75696427a6c248ef032523dd.reference || (__cxx_static_address_75696427a6c248ef032523dd.reference = {
    __cReference: true,
    get value() { return EXPLODINGBARREL2____header_global_57e5af0289083d2f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:504
export const FIREBARREL____header_global_15ef37498d1116a7 = ((((((1240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5c4407d6af43e0e1c1ba7e12() {
  return __cxx_static_address_5c4407d6af43e0e1c1ba7e12.reference || (__cxx_static_address_5c4407d6af43e0e1c1ba7e12.reference = {
    __cReference: true,
    get value() { return FIREBARREL____header_global_15ef37498d1116a7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:505
export const SEENINE____header_global_a1d1800ea5cb302b = ((((((1247) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d002b06f032e5c5a82711a65() {
  return __cxx_static_address_d002b06f032e5c5a82711a65.reference || (__cxx_static_address_d002b06f032e5c5a82711a65.reference = {
    __cReference: true,
    get value() { return SEENINE____header_global_a1d1800ea5cb302b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:506
export const SEENINEDEAD____header_global_76946c92cf947c8c = ((((((1248) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3a017c7f85fa43a826401194() {
  return __cxx_static_address_3a017c7f85fa43a826401194.reference || (__cxx_static_address_3a017c7f85fa43a826401194.reference = {
    __cReference: true,
    get value() { return SEENINEDEAD____header_global_76946c92cf947c8c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:507
export const STEAM____header_global_c2d06612e0c874f6 = ((((((1250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f3ec8a481271d1ff62f68281() {
  return __cxx_static_address_f3ec8a481271d1ff62f68281.reference || (__cxx_static_address_f3ec8a481271d1ff62f68281.reference = {
    __cReference: true,
    get value() { return STEAM____header_global_c2d06612e0c874f6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:508
export const CEILINGSTEAM____header_global_cbacfb0b07a59509 = ((((((1255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_26781ecba1601d8ec12df287() {
  return __cxx_static_address_26781ecba1601d8ec12df287.reference || (__cxx_static_address_26781ecba1601d8ec12df287.reference = {
    __cReference: true,
    get value() { return CEILINGSTEAM____header_global_cbacfb0b07a59509; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:509
export const PIPE6B____header_global_5e263e8f8a144d25 = ((((((1260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_315e30052052156a87480397() {
  return __cxx_static_address_315e30052052156a87480397.reference || (__cxx_static_address_315e30052052156a87480397.reference = {
    __cReference: true,
    get value() { return PIPE6B____header_global_5e263e8f8a144d25; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:510
export const TRANSPORTERBEAM____header_global_f2ed6c7b6483a1ad = ((((((1261) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b2730459b69a75f9cc09b0cc() {
  return __cxx_static_address_b2730459b69a75f9cc09b0cc.reference || (__cxx_static_address_b2730459b69a75f9cc09b0cc.reference = {
    __cReference: true,
    get value() { return TRANSPORTERBEAM____header_global_f2ed6c7b6483a1ad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:511
export const RAT____header_global_872ff57a63fc0c20 = ((((((1267) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a840612d78ddccda1e376cef() {
  return __cxx_static_address_a840612d78ddccda1e376cef.reference || (__cxx_static_address_a840612d78ddccda1e376cef.reference = {
    __cReference: true,
    get value() { return RAT____header_global_872ff57a63fc0c20; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:512
export const TRASH____header_global_e92afb937907ad43 = ((((((1272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4362d993c0a1eb6b73fd89e1() {
  return __cxx_static_address_4362d993c0a1eb6b73fd89e1.reference || (__cxx_static_address_4362d993c0a1eb6b73fd89e1.reference = {
    __cReference: true,
    get value() { return TRASH____header_global_e92afb937907ad43; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:513
export const FEMPIC1____header_global_c29a813918143b8b = ((((((1280) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_92cf4e82c7075c76d4813879() {
  return __cxx_static_address_92cf4e82c7075c76d4813879.reference || (__cxx_static_address_92cf4e82c7075c76d4813879.reference = {
    __cReference: true,
    get value() { return FEMPIC1____header_global_c29a813918143b8b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:514
export const FEMPIC2____header_global_42092cf308837559 = ((((((1289) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5696ac16440573774670ead1() {
  return __cxx_static_address_5696ac16440573774670ead1.reference || (__cxx_static_address_5696ac16440573774670ead1.reference = {
    __cReference: true,
    get value() { return FEMPIC2____header_global_42092cf308837559; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:515
export const BLANKSCREEN____header_global_1f7476bb0957743f = ((((((1293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a8d9d65cc82054f6f2d1681c() {
  return __cxx_static_address_a8d9d65cc82054f6f2d1681c.reference || (__cxx_static_address_a8d9d65cc82054f6f2d1681c.reference = {
    __cReference: true,
    get value() { return BLANKSCREEN____header_global_1f7476bb0957743f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:516
export const PODFEM1____header_global_9dfb823736ed0499 = ((((((1294) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3da5f0d560cec9b5ab0b2f53() {
  return __cxx_static_address_3da5f0d560cec9b5ab0b2f53.reference || (__cxx_static_address_3da5f0d560cec9b5ab0b2f53.reference = {
    __cReference: true,
    get value() { return PODFEM1____header_global_9dfb823736ed0499; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:517
export const FEMPIC3____header_global_084e1aa5c32c3fed = ((((((1298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_92107c0050fceb439f3539ae() {
  return __cxx_static_address_92107c0050fceb439f3539ae.reference || (__cxx_static_address_92107c0050fceb439f3539ae.reference = {
    __cReference: true,
    get value() { return FEMPIC3____header_global_084e1aa5c32c3fed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:518
export const FEMPIC4____header_global_9e9d9896706c6d19 = ((((((1306) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aaf8d7f178c050abc2d89769() {
  return __cxx_static_address_aaf8d7f178c050abc2d89769.reference || (__cxx_static_address_aaf8d7f178c050abc2d89769.reference = {
    __cReference: true,
    get value() { return FEMPIC4____header_global_9e9d9896706c6d19; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:519
export const FEM1____header_global_7fccfb8b21446a32 = ((((((1312) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1972f71a9f3e13101b146079() {
  return __cxx_static_address_1972f71a9f3e13101b146079.reference || (__cxx_static_address_1972f71a9f3e13101b146079.reference = {
    __cReference: true,
    get value() { return FEM1____header_global_7fccfb8b21446a32; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:520
export const FEM2____header_global_604fd79ea5a85538 = ((((((1317) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c579fe333e9f55b144ca2bd4() {
  return __cxx_static_address_c579fe333e9f55b144ca2bd4.reference || (__cxx_static_address_c579fe333e9f55b144ca2bd4.reference = {
    __cReference: true,
    get value() { return FEM2____header_global_604fd79ea5a85538; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:521
export const FEM3____header_global_168ea18ee2ca5b4f = ((((((1321) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b8998e6b57c962ca7ff3dbc7() {
  return __cxx_static_address_b8998e6b57c962ca7ff3dbc7.reference || (__cxx_static_address_b8998e6b57c962ca7ff3dbc7.reference = {
    __cReference: true,
    get value() { return FEM3____header_global_168ea18ee2ca5b4f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:522
export const FEM5____header_global_4eb833006815cf45 = ((((((1323) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2b6a2ee999f5205ae3392818() {
  return __cxx_static_address_2b6a2ee999f5205ae3392818.reference || (__cxx_static_address_2b6a2ee999f5205ae3392818.reference = {
    __cReference: true,
    get value() { return FEM5____header_global_4eb833006815cf45; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:523
export const BLOODYPOLE____header_global_f96b7637996c328c = ((((((1324) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_031734d63ef41159554ae27c() {
  return __cxx_static_address_031734d63ef41159554ae27c.reference || (__cxx_static_address_031734d63ef41159554ae27c.reference = {
    __cReference: true,
    get value() { return BLOODYPOLE____header_global_f96b7637996c328c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:524
export const FEM4____header_global_0ff3abca1be37549 = ((((((1325) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_581e6c22f81cb8b265c0d141() {
  return __cxx_static_address_581e6c22f81cb8b265c0d141.reference || (__cxx_static_address_581e6c22f81cb8b265c0d141.reference = {
    __cReference: true,
    get value() { return FEM4____header_global_0ff3abca1be37549; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:525
export const FEM6____header_global_94ae7acb6dee68f7 = ((((((1334) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f29eb990717a18341e6a2b6a() {
  return __cxx_static_address_f29eb990717a18341e6a2b6a.reference || (__cxx_static_address_f29eb990717a18341e6a2b6a.reference = {
    __cReference: true,
    get value() { return FEM6____header_global_94ae7acb6dee68f7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:526
export const FEM6PAD____header_global_d5dbe577613bf681 = ((((((1335) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0c041bcc81fc40d5dc533587() {
  return __cxx_static_address_0c041bcc81fc40d5dc533587.reference || (__cxx_static_address_0c041bcc81fc40d5dc533587.reference = {
    __cReference: true,
    get value() { return FEM6PAD____header_global_d5dbe577613bf681; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:527
export const FEM8____header_global_53527dbbe9ea99df = ((((((1336) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_59f1c6383e9f1d2f73efc86c() {
  return __cxx_static_address_59f1c6383e9f1d2f73efc86c.reference || (__cxx_static_address_59f1c6383e9f1d2f73efc86c.reference = {
    __cReference: true,
    get value() { return FEM8____header_global_53527dbbe9ea99df; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:528
export const HELECOPT____header_global_2bd1ca68b019170d = ((((((1346) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0a0f93efa4f95aa6994b632c() {
  return __cxx_static_address_0a0f93efa4f95aa6994b632c.reference || (__cxx_static_address_0a0f93efa4f95aa6994b632c.reference = {
    __cReference: true,
    get value() { return HELECOPT____header_global_2bd1ca68b019170d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:529
export const FETUSJIB____header_global_054e0e1f04eac3e1 = ((((((1347) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cda63a20973b457677a12b8e() {
  return __cxx_static_address_cda63a20973b457677a12b8e.reference || (__cxx_static_address_cda63a20973b457677a12b8e.reference = {
    __cReference: true,
    get value() { return FETUSJIB____header_global_054e0e1f04eac3e1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:530
export const HOLODUKE____header_global_05784b79f70763ba = ((((((1348) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0bc8d38ed9b0719ccc714dea() {
  return __cxx_static_address_0bc8d38ed9b0719ccc714dea.reference || (__cxx_static_address_0bc8d38ed9b0719ccc714dea.reference = {
    __cReference: true,
    get value() { return HOLODUKE____header_global_05784b79f70763ba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:531
export const SPACEMARINE____header_global_c5d17e5e4332d74c = ((((((1353) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9e85637052d80ea93b039049() {
  return __cxx_static_address_9e85637052d80ea93b039049.reference || (__cxx_static_address_9e85637052d80ea93b039049.reference = {
    __cReference: true,
    get value() { return SPACEMARINE____header_global_c5d17e5e4332d74c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:532
export const INDY____header_global_569c63e3cc51f0a5 = ((((((1355) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f7fc883fe0aa8d33d0407d44() {
  return __cxx_static_address_f7fc883fe0aa8d33d0407d44.reference || (__cxx_static_address_f7fc883fe0aa8d33d0407d44.reference = {
    __cReference: true,
    get value() { return INDY____header_global_569c63e3cc51f0a5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:533
export const FETUS____header_global_9bc5bf3cf879338f = ((((((1358) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4eb3fdcfa01964349f5f40f8() {
  return __cxx_static_address_4eb3fdcfa01964349f5f40f8.reference || (__cxx_static_address_4eb3fdcfa01964349f5f40f8.reference = {
    __cReference: true,
    get value() { return FETUS____header_global_9bc5bf3cf879338f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:534
export const FETUSBROKE____header_global_49412f06448f3ca8 = ((((((1359) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dcdb56c5fbf50c6dbc558e13() {
  return __cxx_static_address_dcdb56c5fbf50c6dbc558e13.reference || (__cxx_static_address_dcdb56c5fbf50c6dbc558e13.reference = {
    __cReference: true,
    get value() { return FETUSBROKE____header_global_49412f06448f3ca8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:535
export const MONK____header_global_f68bd9eebe807ab7 = ((((((1352) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cd36719a543b00d52cc8519c() {
  return __cxx_static_address_cd36719a543b00d52cc8519c.reference || (__cxx_static_address_cd36719a543b00d52cc8519c.reference = {
    __cReference: true,
    get value() { return MONK____header_global_f68bd9eebe807ab7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:536
export const LUKE____header_global_909c940becd87ffc = ((((((1354) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_909f24198855b10960f798dc() {
  return __cxx_static_address_909f24198855b10960f798dc.reference || (__cxx_static_address_909f24198855b10960f798dc.reference = {
    __cReference: true,
    get value() { return LUKE____header_global_909c940becd87ffc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:537
export const COOLEXPLOSION1____header_global_1184263ce9bd3fa0 = ((((((1360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_11de492af40518a47ede4ee9() {
  return __cxx_static_address_11de492af40518a47ede4ee9.reference || (__cxx_static_address_11de492af40518a47ede4ee9.reference = {
    __cReference: true,
    get value() { return COOLEXPLOSION1____header_global_1184263ce9bd3fa0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:538
export const WATERSPLASH2____header_global_30cda03502fd93e3 = ((((((1380) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_51b003b7c2bef07cc18a7c60() {
  return __cxx_static_address_51b003b7c2bef07cc18a7c60.reference || (__cxx_static_address_51b003b7c2bef07cc18a7c60.reference = {
    __cReference: true,
    get value() { return WATERSPLASH2____header_global_30cda03502fd93e3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:539
export const FIREVASE____header_global_cf048b35a7cf7c57 = ((((((1390) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0494d57ce6d9fc6b8304f478() {
  return __cxx_static_address_0494d57ce6d9fc6b8304f478.reference || (__cxx_static_address_0494d57ce6d9fc6b8304f478.reference = {
    __cReference: true,
    get value() { return FIREVASE____header_global_cf048b35a7cf7c57; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:540
export const FEM7____header_global_d19f121dc0c3cf02 = ((((((1395) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_41e35b5bd3bfab61403d3540() {
  return __cxx_static_address_41e35b5bd3bfab61403d3540.reference || (__cxx_static_address_41e35b5bd3bfab61403d3540.reference = {
    __cReference: true,
    get value() { return FEM7____header_global_d19f121dc0c3cf02; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:541
export const APLAYERTOP____header_global_01c847f08aa7d0ea = ((((((1400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6b71e2a9768e56ef3fd6efa2() {
  return __cxx_static_address_6b71e2a9768e56ef3fd6efa2.reference || (__cxx_static_address_6b71e2a9768e56ef3fd6efa2.reference = {
    __cReference: true,
    get value() { return APLAYERTOP____header_global_01c847f08aa7d0ea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:542
export const APLAYER____header_global_ed53b3dca1897816 = ((((((1405) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fd105add06687e7761aa994b() {
  return __cxx_static_address_fd105add06687e7761aa994b.reference || (__cxx_static_address_fd105add06687e7761aa994b.reference = {
    __cReference: true,
    get value() { return APLAYER____header_global_ed53b3dca1897816; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:543
export const PLAYERONWATER____header_global_2d27f8c77cb9ae1f = ((((((1420) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8fbe9b5c20363a964778b779() {
  return __cxx_static_address_8fbe9b5c20363a964778b779.reference || (__cxx_static_address_8fbe9b5c20363a964778b779.reference = {
    __cReference: true,
    get value() { return PLAYERONWATER____header_global_2d27f8c77cb9ae1f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:544
export const DUKELYINGDEAD____header_global_fd0549a8b5eacc71 = ((((((1518) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9a0684f5f8729037c3269ba0() {
  return __cxx_static_address_9a0684f5f8729037c3269ba0.reference || (__cxx_static_address_9a0684f5f8729037c3269ba0.reference = {
    __cReference: true,
    get value() { return DUKELYINGDEAD____header_global_fd0549a8b5eacc71; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:545
export const DUKETORSO____header_global_907d1e822720716c = ((((((1520) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_635a247ceead208a3ab182bf() {
  return __cxx_static_address_635a247ceead208a3ab182bf.reference || (__cxx_static_address_635a247ceead208a3ab182bf.reference = {
    __cReference: true,
    get value() { return DUKETORSO____header_global_907d1e822720716c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:546
export const DUKEGUN____header_global_f06998ea80ad7900 = ((((((1528) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a85657d307683d5727d19efc() {
  return __cxx_static_address_a85657d307683d5727d19efc.reference || (__cxx_static_address_a85657d307683d5727d19efc.reference = {
    __cReference: true,
    get value() { return DUKEGUN____header_global_f06998ea80ad7900; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:547
export const DUKELEG____header_global_e856717f734564c2 = ((((((1536) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eee23972ce7317d4f87e46dc() {
  return __cxx_static_address_eee23972ce7317d4f87e46dc.reference || (__cxx_static_address_eee23972ce7317d4f87e46dc.reference = {
    __cReference: true,
    get value() { return DUKELEG____header_global_e856717f734564c2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:548
export const SHARK____header_global_7f1f790b280b5f46 = ((((((1550) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c25eb1a24b908eee29c74efd() {
  return __cxx_static_address_c25eb1a24b908eee29c74efd.reference || (__cxx_static_address_c25eb1a24b908eee29c74efd.reference = {
    __cReference: true,
    get value() { return SHARK____header_global_7f1f790b280b5f46; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:549
export const BLOOD____header_global_4af4830f2f2126c3 = ((((((1620) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2052f124709c2297271c60b6() {
  return __cxx_static_address_2052f124709c2297271c60b6.reference || (__cxx_static_address_2052f124709c2297271c60b6.reference = {
    __cReference: true,
    get value() { return BLOOD____header_global_4af4830f2f2126c3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:550
export const FIRELASER____header_global_dae464110b817680 = ((((((1625) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_931623dbc88cbaac3a2166e4() {
  return __cxx_static_address_931623dbc88cbaac3a2166e4.reference || (__cxx_static_address_931623dbc88cbaac3a2166e4.reference = {
    __cReference: true,
    get value() { return FIRELASER____header_global_dae464110b817680; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:551
export const TRANSPORTERSTAR____header_global_614d0de2a21b5d9d = ((((((1630) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_65018ea0d0b3268233912bd9() {
  return __cxx_static_address_65018ea0d0b3268233912bd9.reference || (__cxx_static_address_65018ea0d0b3268233912bd9.reference = {
    __cReference: true,
    get value() { return TRANSPORTERSTAR____header_global_614d0de2a21b5d9d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:552
export const SPIT____header_global_d7b584f4bc1ce275 = ((((((1636) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_89c3e51707ab5208d789a83e() {
  return __cxx_static_address_89c3e51707ab5208d789a83e.reference || (__cxx_static_address_89c3e51707ab5208d789a83e.reference = {
    __cReference: true,
    get value() { return SPIT____header_global_d7b584f4bc1ce275; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:553
export const LOOGIE____header_global_83e63d45db76604b = ((((((1637) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_21e995c1e56daaca4ea873bd() {
  return __cxx_static_address_21e995c1e56daaca4ea873bd.reference || (__cxx_static_address_21e995c1e56daaca4ea873bd.reference = {
    __cReference: true,
    get value() { return LOOGIE____header_global_83e63d45db76604b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:554
export const FIST____header_global_b2bce9c02beab7c7 = ((((((1640) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b7a32519519768f8be79ba24() {
  return __cxx_static_address_b7a32519519768f8be79ba24.reference || (__cxx_static_address_b7a32519519768f8be79ba24.reference = {
    __cReference: true,
    get value() { return FIST____header_global_b2bce9c02beab7c7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:555
export const FREEZEBLAST____header_global_7a718b5debeb66fc = ((((((1641) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fe52ce1779a1ca092811bcfe() {
  return __cxx_static_address_fe52ce1779a1ca092811bcfe.reference || (__cxx_static_address_fe52ce1779a1ca092811bcfe.reference = {
    __cReference: true,
    get value() { return FREEZEBLAST____header_global_7a718b5debeb66fc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:556
export const SHRINKSPARK____header_global_a676580a5cabed12 = ((((((1646) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8a8f392b65fc0a53c38b05d2() {
  return __cxx_static_address_8a8f392b65fc0a53c38b05d2.reference || (__cxx_static_address_8a8f392b65fc0a53c38b05d2.reference = {
    __cReference: true,
    get value() { return SHRINKSPARK____header_global_a676580a5cabed12; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:557
export const TONGUE____header_global_02cd9aa043743c2d = ((((((1647) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a884a051b814b3ff9872c949() {
  return __cxx_static_address_a884a051b814b3ff9872c949.reference || (__cxx_static_address_a884a051b814b3ff9872c949.reference = {
    __cReference: true,
    get value() { return TONGUE____header_global_02cd9aa043743c2d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:558
export const MORTER____header_global_d1615bd220496736 = ((((((1650) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2c866b2aaf488b9e0777f076() {
  return __cxx_static_address_2c866b2aaf488b9e0777f076.reference || (__cxx_static_address_2c866b2aaf488b9e0777f076.reference = {
    __cReference: true,
    get value() { return MORTER____header_global_d1615bd220496736; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:559
export const SHRINKEREXPLOSION____header_global_6c7a22615b6ab5c0 = ((((((1656) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a3a658006ec0fd4f9265f8e0() {
  return __cxx_static_address_a3a658006ec0fd4f9265f8e0.reference || (__cxx_static_address_a3a658006ec0fd4f9265f8e0.reference = {
    __cReference: true,
    get value() { return SHRINKEREXPLOSION____header_global_6c7a22615b6ab5c0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:560
export const RADIUSEXPLOSION____header_global_f21443c936ecbd7d = ((((((1670) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_27f806dfc3d8d62a2c556542() {
  return __cxx_static_address_27f806dfc3d8d62a2c556542.reference || (__cxx_static_address_27f806dfc3d8d62a2c556542.reference = {
    __cReference: true,
    get value() { return RADIUSEXPLOSION____header_global_f21443c936ecbd7d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:561
export const FORCERIPPLE____header_global_9af4011d7965dfcc = ((((((1671) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_91a0ac3bdd8f02d4056e2fa0() {
  return __cxx_static_address_91a0ac3bdd8f02d4056e2fa0.reference || (__cxx_static_address_91a0ac3bdd8f02d4056e2fa0.reference = {
    __cReference: true,
    get value() { return FORCERIPPLE____header_global_9af4011d7965dfcc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:562
export const LIZTROOP____header_global_28826dcba16eb636 = ((((((1680) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_57af34c042677013fd58f891() {
  return __cxx_static_address_57af34c042677013fd58f891.reference || (__cxx_static_address_57af34c042677013fd58f891.reference = {
    __cReference: true,
    get value() { return LIZTROOP____header_global_28826dcba16eb636; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:563
export const LIZTROOPRUNNING____header_global_92bcf8379484ba52 = ((((((1681) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5e720797c72e8d78a2dca04d() {
  return __cxx_static_address_5e720797c72e8d78a2dca04d.reference || (__cxx_static_address_5e720797c72e8d78a2dca04d.reference = {
    __cReference: true,
    get value() { return LIZTROOPRUNNING____header_global_92bcf8379484ba52; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:564
export const LIZTROOPSTAYPUT____header_global_fa7f9d419fd89717 = ((((((1682) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7d01eeed8af7aa18df1f572c() {
  return __cxx_static_address_7d01eeed8af7aa18df1f572c.reference || (__cxx_static_address_7d01eeed8af7aa18df1f572c.reference = {
    __cReference: true,
    get value() { return LIZTROOPSTAYPUT____header_global_fa7f9d419fd89717; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:565
export const LIZTROOPSHOOT____header_global_6289206599caf827 = ((((((1715) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ab3ec91ceb5049c75ae880e3() {
  return __cxx_static_address_ab3ec91ceb5049c75ae880e3.reference || (__cxx_static_address_ab3ec91ceb5049c75ae880e3.reference = {
    __cReference: true,
    get value() { return LIZTROOPSHOOT____header_global_6289206599caf827; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:566
export const LIZTROOPJETPACK____header_global_3e464f40650910e7 = ((((((1725) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_de3926736975465a7df904f8() {
  return __cxx_static_address_de3926736975465a7df904f8.reference || (__cxx_static_address_de3926736975465a7df904f8.reference = {
    __cReference: true,
    get value() { return LIZTROOPJETPACK____header_global_3e464f40650910e7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:567
export const LIZTROOPONTOILET____header_global_4988194f11413fe7 = ((((((1741) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_802871bb634efb761fe6abfe() {
  return __cxx_static_address_802871bb634efb761fe6abfe.reference || (__cxx_static_address_802871bb634efb761fe6abfe.reference = {
    __cReference: true,
    get value() { return LIZTROOPONTOILET____header_global_4988194f11413fe7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:568
export const LIZTROOPJUSTSIT____header_global_0d7a1df9fa43f2cd = ((((((1742) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0f6a26ac55f952b0b96fe229() {
  return __cxx_static_address_0f6a26ac55f952b0b96fe229.reference || (__cxx_static_address_0f6a26ac55f952b0b96fe229.reference = {
    __cReference: true,
    get value() { return LIZTROOPJUSTSIT____header_global_0d7a1df9fa43f2cd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:569
export const LIZTROOPDUCKING____header_global_07801e22f35993a9 = ((((((1744) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2cdb89e85d833ee11938781f() {
  return __cxx_static_address_2cdb89e85d833ee11938781f.reference || (__cxx_static_address_2cdb89e85d833ee11938781f.reference = {
    __cReference: true,
    get value() { return LIZTROOPDUCKING____header_global_07801e22f35993a9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:570
export const HEADJIB1____header_global_1f73075f0144db38 = ((((((1768) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5a9a8952a094d9fc3665472d() {
  return __cxx_static_address_5a9a8952a094d9fc3665472d.reference || (__cxx_static_address_5a9a8952a094d9fc3665472d.reference = {
    __cReference: true,
    get value() { return HEADJIB1____header_global_1f73075f0144db38; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:571
export const ARMJIB1____header_global_0e87e240ad8f2b39 = ((((((1772) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_42c94f5c2c3b9baf1d349da3() {
  return __cxx_static_address_42c94f5c2c3b9baf1d349da3.reference || (__cxx_static_address_42c94f5c2c3b9baf1d349da3.reference = {
    __cReference: true,
    get value() { return ARMJIB1____header_global_0e87e240ad8f2b39; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:572
export const LEGJIB1____header_global_53736d13110e9c65 = ((((((1776) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_41842901ccb205ae1183b7e5() {
  return __cxx_static_address_41842901ccb205ae1183b7e5.reference || (__cxx_static_address_41842901ccb205ae1183b7e5.reference = {
    __cReference: true,
    get value() { return LEGJIB1____header_global_53736d13110e9c65; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:573
export const OCTABRAIN____header_global_756238209727007f = ((((((1820) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1da5d0f7e35a7b2b363e516c() {
  return __cxx_static_address_1da5d0f7e35a7b2b363e516c.reference || (__cxx_static_address_1da5d0f7e35a7b2b363e516c.reference = {
    __cReference: true,
    get value() { return OCTABRAIN____header_global_756238209727007f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:574
export const OCTABRAINSTAYPUT____header_global_a56796b561c2bc24 = ((((((1821) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a7c58877d6d2b0199cca88df() {
  return __cxx_static_address_a7c58877d6d2b0199cca88df.reference || (__cxx_static_address_a7c58877d6d2b0199cca88df.reference = {
    __cReference: true,
    get value() { return OCTABRAINSTAYPUT____header_global_a56796b561c2bc24; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:575
export const INNERJAW____header_global_5401d7b59e1f7d81 = ((((((1860) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_312b6df60b1c99e137b216d0() {
  return __cxx_static_address_312b6df60b1c99e137b216d0.reference || (__cxx_static_address_312b6df60b1c99e137b216d0.reference = {
    __cReference: true,
    get value() { return INNERJAW____header_global_5401d7b59e1f7d81; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:576
export const DRONE____header_global_6210f64b6fe0b482 = ((((((1880) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a08518c3e30772d524c2b6e3() {
  return __cxx_static_address_a08518c3e30772d524c2b6e3.reference || (__cxx_static_address_a08518c3e30772d524c2b6e3.reference = {
    __cReference: true,
    get value() { return DRONE____header_global_6210f64b6fe0b482; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:577
export const EXPLOSION2____header_global_bd9b917b568e6610 = ((((((1890) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7470002d16745c19a8f1b89b() {
  return __cxx_static_address_7470002d16745c19a8f1b89b.reference || (__cxx_static_address_7470002d16745c19a8f1b89b.reference = {
    __cReference: true,
    get value() { return EXPLOSION2____header_global_bd9b917b568e6610; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:578
export const COMMANDER____header_global_ec5d2c5df052d636 = ((((((1920) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b55f31b336804cc9587e7de2() {
  return __cxx_static_address_b55f31b336804cc9587e7de2.reference || (__cxx_static_address_b55f31b336804cc9587e7de2.reference = {
    __cReference: true,
    get value() { return COMMANDER____header_global_ec5d2c5df052d636; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:579
export const COMMANDERSTAYPUT____header_global_4545cb792a4fe893 = ((((((1921) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_af300b8aca85f57da9b47748() {
  return __cxx_static_address_af300b8aca85f57da9b47748.reference || (__cxx_static_address_af300b8aca85f57da9b47748.reference = {
    __cReference: true,
    get value() { return COMMANDERSTAYPUT____header_global_4545cb792a4fe893; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:580
export const RECON____header_global_8cb3a4bb72870e46 = ((((((1960) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bc86b38f798fba67c1539df2() {
  return __cxx_static_address_bc86b38f798fba67c1539df2.reference || (__cxx_static_address_bc86b38f798fba67c1539df2.reference = {
    __cReference: true,
    get value() { return RECON____header_global_8cb3a4bb72870e46; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:581
export const TANK____header_global_86855b8384d9f280 = ((((((1975) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6502a3606717d1c4063f4bec() {
  return __cxx_static_address_6502a3606717d1c4063f4bec.reference || (__cxx_static_address_6502a3606717d1c4063f4bec.reference = {
    __cReference: true,
    get value() { return TANK____header_global_86855b8384d9f280; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:582
export const PIGCOP____header_global_4f6ad0369c69df40 = ((((((2000) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a2995c8cdc3c2091318e941f() {
  return __cxx_static_address_a2995c8cdc3c2091318e941f.reference || (__cxx_static_address_a2995c8cdc3c2091318e941f.reference = {
    __cReference: true,
    get value() { return PIGCOP____header_global_4f6ad0369c69df40; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:583
export const PIGCOPSTAYPUT____header_global_1aba59126852b71d = ((((((2001) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8b8041b54bfaddec07853fa3() {
  return __cxx_static_address_8b8041b54bfaddec07853fa3.reference || (__cxx_static_address_8b8041b54bfaddec07853fa3.reference = {
    __cReference: true,
    get value() { return PIGCOPSTAYPUT____header_global_1aba59126852b71d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:584
export const PIGCOPDIVE____header_global_c4da74d9e0256b2b = ((((((2045) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b7bf5854110a77dcdaa112f3() {
  return __cxx_static_address_b7bf5854110a77dcdaa112f3.reference || (__cxx_static_address_b7bf5854110a77dcdaa112f3.reference = {
    __cReference: true,
    get value() { return PIGCOPDIVE____header_global_c4da74d9e0256b2b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:585
export const LIZMAN____header_global_beb4a807111a3543 = ((((((2120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_341e189f223ca3c7a4cc3dd2() {
  return __cxx_static_address_341e189f223ca3c7a4cc3dd2.reference || (__cxx_static_address_341e189f223ca3c7a4cc3dd2.reference = {
    __cReference: true,
    get value() { return LIZMAN____header_global_beb4a807111a3543; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:586
export const LIZMANSTAYPUT____header_global_33df824823d5f4a7 = ((((((2121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_92919310319fb173f83248d9() {
  return __cxx_static_address_92919310319fb173f83248d9.reference || (__cxx_static_address_92919310319fb173f83248d9.reference = {
    __cReference: true,
    get value() { return LIZMANSTAYPUT____header_global_33df824823d5f4a7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:587
export const LIZMANSPITTING____header_global_21eb247bc70562d1 = ((((((2150) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_abcd077b0f3de5c019157ad2() {
  return __cxx_static_address_abcd077b0f3de5c019157ad2.reference || (__cxx_static_address_abcd077b0f3de5c019157ad2.reference = {
    __cReference: true,
    get value() { return LIZMANSPITTING____header_global_21eb247bc70562d1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:588
export const LIZMANFEEDING____header_global_2b180a404f2bca5f = ((((((2160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d8f1153c2f4b0ac9ded68b3e() {
  return __cxx_static_address_d8f1153c2f4b0ac9ded68b3e.reference || (__cxx_static_address_d8f1153c2f4b0ac9ded68b3e.reference = {
    __cReference: true,
    get value() { return LIZMANFEEDING____header_global_2b180a404f2bca5f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:589
export const LIZMANJUMP____header_global_f36cc0a1b7bd9329 = ((((((2165) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_12e156fa0d5ce1f241c5ea75() {
  return __cxx_static_address_12e156fa0d5ce1f241c5ea75.reference || (__cxx_static_address_12e156fa0d5ce1f241c5ea75.reference = {
    __cReference: true,
    get value() { return LIZMANJUMP____header_global_f36cc0a1b7bd9329; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:590
export const FECES____header_global_65953eaeff160257 = ((((((2200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a87f279573789fafa70b5e87() {
  return __cxx_static_address_a87f279573789fafa70b5e87.reference || (__cxx_static_address_a87f279573789fafa70b5e87.reference = {
    __cReference: true,
    get value() { return FECES____header_global_65953eaeff160257; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:591
export const LIZMANHEAD1____header_global_82cc30ad095e153d = ((((((2201) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_27813360e4b524e5dda8d6a4() {
  return __cxx_static_address_27813360e4b524e5dda8d6a4.reference || (__cxx_static_address_27813360e4b524e5dda8d6a4.reference = {
    __cReference: true,
    get value() { return LIZMANHEAD1____header_global_82cc30ad095e153d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:592
export const LIZMANARM1____header_global_770621ba6ecd9ed2 = ((((((2205) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6db1421b5f1b71389a39ff1b() {
  return __cxx_static_address_6db1421b5f1b71389a39ff1b.reference || (__cxx_static_address_6db1421b5f1b71389a39ff1b.reference = {
    __cReference: true,
    get value() { return LIZMANARM1____header_global_770621ba6ecd9ed2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:593
export const LIZMANLEG1____header_global_b6a1e8281ad8083b = ((((((2209) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7d7186da9e3fec50528f2a68() {
  return __cxx_static_address_7d7186da9e3fec50528f2a68.reference || (__cxx_static_address_7d7186da9e3fec50528f2a68.reference = {
    __cReference: true,
    get value() { return LIZMANLEG1____header_global_b6a1e8281ad8083b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:594
export const EXPLOSION2BOT____header_global_3042be44bbd53f1f = ((((((2219) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b34154d39fb7363b8ffbd5d1() {
  return __cxx_static_address_b34154d39fb7363b8ffbd5d1.reference || (__cxx_static_address_b34154d39fb7363b8ffbd5d1.reference = {
    __cReference: true,
    get value() { return EXPLOSION2BOT____header_global_3042be44bbd53f1f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:595
export const JIBS1____header_global_1580e454f55694ec = ((((((2245) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f33e653aea5d140fc5222bb1() {
  return __cxx_static_address_f33e653aea5d140fc5222bb1.reference || (__cxx_static_address_f33e653aea5d140fc5222bb1.reference = {
    __cReference: true,
    get value() { return JIBS1____header_global_1580e454f55694ec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:596
export const JIBS2____header_global_88b6526f303b2c04 = ((((((2250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0a3afa02ad20afc248c542d1() {
  return __cxx_static_address_0a3afa02ad20afc248c542d1.reference || (__cxx_static_address_0a3afa02ad20afc248c542d1.reference = {
    __cReference: true,
    get value() { return JIBS2____header_global_88b6526f303b2c04; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:597
export const JIBS3____header_global_325e0581879d89f4 = ((((((2255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6c3816318fc7e755decc2bf5() {
  return __cxx_static_address_6c3816318fc7e755decc2bf5.reference || (__cxx_static_address_6c3816318fc7e755decc2bf5.reference = {
    __cReference: true,
    get value() { return JIBS3____header_global_325e0581879d89f4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:598
export const JIBS4____header_global_b63355b3cfbe2b4c = ((((((2260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c3e1c2fbafeca48269d08e9b() {
  return __cxx_static_address_c3e1c2fbafeca48269d08e9b.reference || (__cxx_static_address_c3e1c2fbafeca48269d08e9b.reference = {
    __cReference: true,
    get value() { return JIBS4____header_global_b63355b3cfbe2b4c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:599
export const JIBS5____header_global_a11a9eeec4a69841 = ((((((2265) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_74ac806e0daaed168749c0fd() {
  return __cxx_static_address_74ac806e0daaed168749c0fd.reference || (__cxx_static_address_74ac806e0daaed168749c0fd.reference = {
    __cReference: true,
    get value() { return JIBS5____header_global_a11a9eeec4a69841; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:600
export const BURNING____header_global_d9de698ecb7667d6 = ((((((2270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bdf503b12749d47175e66fa7() {
  return __cxx_static_address_bdf503b12749d47175e66fa7.reference || (__cxx_static_address_bdf503b12749d47175e66fa7.reference = {
    __cReference: true,
    get value() { return BURNING____header_global_d9de698ecb7667d6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:601
export const FIRE____header_global_a2cf9625ced12c61 = ((((((2271) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8d5aac725986b34f0c0ed284() {
  return __cxx_static_address_8d5aac725986b34f0c0ed284.reference || (__cxx_static_address_8d5aac725986b34f0c0ed284.reference = {
    __cReference: true,
    get value() { return FIRE____header_global_a2cf9625ced12c61; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:602
export const JIBS6____header_global_88c604a91b056fdf = ((((((2286) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fd62b7635d138e77c79cdaed() {
  return __cxx_static_address_fd62b7635d138e77c79cdaed.reference || (__cxx_static_address_fd62b7635d138e77c79cdaed.reference = {
    __cReference: true,
    get value() { return JIBS6____header_global_88c604a91b056fdf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:603
export const BLOODSPLAT1____header_global_396893e43186b828 = ((((((2296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f1633c5fd8338e8e07e420b3() {
  return __cxx_static_address_f1633c5fd8338e8e07e420b3.reference || (__cxx_static_address_f1633c5fd8338e8e07e420b3.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT1____header_global_396893e43186b828; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:604
export const BLOODSPLAT3____header_global_12f04b2b31f5ff89 = ((((((2297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8feb35fc68acc97a19bcd285() {
  return __cxx_static_address_8feb35fc68acc97a19bcd285.reference || (__cxx_static_address_8feb35fc68acc97a19bcd285.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT3____header_global_12f04b2b31f5ff89; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:605
export const BLOODSPLAT2____header_global_028ac71512181699 = ((((((2298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_83cdb591ad892e024edfb4b3() {
  return __cxx_static_address_83cdb591ad892e024edfb4b3.reference || (__cxx_static_address_83cdb591ad892e024edfb4b3.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT2____header_global_028ac71512181699; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:606
export const BLOODSPLAT4____header_global_801b1ffe8e414122 = ((((((2299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7176af115bc4fc1b30e5b57e() {
  return __cxx_static_address_7176af115bc4fc1b30e5b57e.reference || (__cxx_static_address_7176af115bc4fc1b30e5b57e.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT4____header_global_801b1ffe8e414122; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:607
export const OOZ____header_global_202f618a3f3449b8 = ((((((2300) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_af835b4020d93561949b44cf() {
  return __cxx_static_address_af835b4020d93561949b44cf.reference || (__cxx_static_address_af835b4020d93561949b44cf.reference = {
    __cReference: true,
    get value() { return OOZ____header_global_202f618a3f3449b8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:608
export const OOZ2____header_global_894ed427d26d5bb1 = ((((((2309) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_41eda33d5681f5d01f6e2e5c() {
  return __cxx_static_address_41eda33d5681f5d01f6e2e5c.reference || (__cxx_static_address_41eda33d5681f5d01f6e2e5c.reference = {
    __cReference: true,
    get value() { return OOZ2____header_global_894ed427d26d5bb1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:609
export const WALLBLOOD1____header_global_9aba3d6ffb3b69a7 = ((((((2301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_696ab3c5bc52b8a03c61b90a() {
  return __cxx_static_address_696ab3c5bc52b8a03c61b90a.reference || (__cxx_static_address_696ab3c5bc52b8a03c61b90a.reference = {
    __cReference: true,
    get value() { return WALLBLOOD1____header_global_9aba3d6ffb3b69a7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:610
export const WALLBLOOD2____header_global_c4a126aea806197d = ((((((2302) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d409b97a436ff28968012377() {
  return __cxx_static_address_d409b97a436ff28968012377.reference || (__cxx_static_address_d409b97a436ff28968012377.reference = {
    __cReference: true,
    get value() { return WALLBLOOD2____header_global_c4a126aea806197d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:611
export const WALLBLOOD3____header_global_a454aad0d2e91101 = ((((((2303) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_57f7db102a9bcc85aac28c88() {
  return __cxx_static_address_57f7db102a9bcc85aac28c88.reference || (__cxx_static_address_57f7db102a9bcc85aac28c88.reference = {
    __cReference: true,
    get value() { return WALLBLOOD3____header_global_a454aad0d2e91101; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:612
export const WALLBLOOD4____header_global_797bd825c3cb0873 = ((((((2304) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a8c76c1730651f8d25e1306b() {
  return __cxx_static_address_a8c76c1730651f8d25e1306b.reference || (__cxx_static_address_a8c76c1730651f8d25e1306b.reference = {
    __cReference: true,
    get value() { return WALLBLOOD4____header_global_797bd825c3cb0873; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:613
export const WALLBLOOD5____header_global_315238e736a482f0 = ((((((2305) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cd3d17b28c26b64c3b6e2057() {
  return __cxx_static_address_cd3d17b28c26b64c3b6e2057.reference || (__cxx_static_address_cd3d17b28c26b64c3b6e2057.reference = {
    __cReference: true,
    get value() { return WALLBLOOD5____header_global_315238e736a482f0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:614
export const WALLBLOOD7____header_global_ac57af524448381d = ((((((2307) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_050d6f48397647040f551339() {
  return __cxx_static_address_050d6f48397647040f551339.reference || (__cxx_static_address_050d6f48397647040f551339.reference = {
    __cReference: true,
    get value() { return WALLBLOOD7____header_global_ac57af524448381d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:615
export const WALLBLOOD8____header_global_1adba4d8fa2333b0 = ((((((2308) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8c33428ceb4e117412efcf32() {
  return __cxx_static_address_8c33428ceb4e117412efcf32.reference || (__cxx_static_address_8c33428ceb4e117412efcf32.reference = {
    __cReference: true,
    get value() { return WALLBLOOD8____header_global_1adba4d8fa2333b0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:616
export const BURNING2____header_global_e7f66e329bf1369d = ((((((2310) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f429dcde4c20e7caa0a0dac1() {
  return __cxx_static_address_f429dcde4c20e7caa0a0dac1.reference || (__cxx_static_address_f429dcde4c20e7caa0a0dac1.reference = {
    __cReference: true,
    get value() { return BURNING2____header_global_e7f66e329bf1369d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:617
export const FIRE2____header_global_04234a369eea0024 = ((((((2311) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1a655ef63c80010c5ee57127() {
  return __cxx_static_address_1a655ef63c80010c5ee57127.reference || (__cxx_static_address_1a655ef63c80010c5ee57127.reference = {
    __cReference: true,
    get value() { return FIRE2____header_global_04234a369eea0024; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:618
export const CRACKKNUCKLES____header_global_51b5f43758c659c4 = ((((((2324) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aa1c88950cd704c8e1304007() {
  return __cxx_static_address_aa1c88950cd704c8e1304007.reference || (__cxx_static_address_aa1c88950cd704c8e1304007.reference = {
    __cReference: true,
    get value() { return CRACKKNUCKLES____header_global_51b5f43758c659c4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:619
export const SMALLSMOKE____header_global_4279ccd7da2f5d8f = ((((((2329) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1fe158b811ad7c166a0da9ee() {
  return __cxx_static_address_1fe158b811ad7c166a0da9ee.reference || (__cxx_static_address_1fe158b811ad7c166a0da9ee.reference = {
    __cReference: true,
    get value() { return SMALLSMOKE____header_global_4279ccd7da2f5d8f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:620
export const FLOORFLAME____header_global_8a2972b3bd999a0d = ((((((2333) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_33b1c0fea294c8ecc6286d4a() {
  return __cxx_static_address_33b1c0fea294c8ecc6286d4a.reference || (__cxx_static_address_33b1c0fea294c8ecc6286d4a.reference = {
    __cReference: true,
    get value() { return FLOORFLAME____header_global_8a2972b3bd999a0d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:621
export const ROTATEGUN____header_global_38b3a4ebefd37770 = ((((((2360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_06af82406e3a3029fb23f4e5() {
  return __cxx_static_address_06af82406e3a3029fb23f4e5.reference || (__cxx_static_address_06af82406e3a3029fb23f4e5.reference = {
    __cReference: true,
    get value() { return ROTATEGUN____header_global_38b3a4ebefd37770; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:622
export const GREENSLIME____header_global_76a4455b3df2a1bb = ((((((2370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4eebf283e0f1ebd7e078d1ed() {
  return __cxx_static_address_4eebf283e0f1ebd7e078d1ed.reference || (__cxx_static_address_4eebf283e0f1ebd7e078d1ed.reference = {
    __cReference: true,
    get value() { return GREENSLIME____header_global_76a4455b3df2a1bb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:623
export const WATERDRIPSPLASH____header_global_1de817081adba1e7 = ((((((2380) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fd25b6fa5dcf91ee92893cb5() {
  return __cxx_static_address_fd25b6fa5dcf91ee92893cb5.reference || (__cxx_static_address_fd25b6fa5dcf91ee92893cb5.reference = {
    __cReference: true,
    get value() { return WATERDRIPSPLASH____header_global_1de817081adba1e7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:624
export const SCRAP6____header_global_bd14354d696d0006 = ((((((2390) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c4f1c85a0faa186e83c393ca() {
  return __cxx_static_address_c4f1c85a0faa186e83c393ca.reference || (__cxx_static_address_c4f1c85a0faa186e83c393ca.reference = {
    __cReference: true,
    get value() { return SCRAP6____header_global_bd14354d696d0006; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:625
export const SCRAP1____header_global_0eccf50c2423ee01 = ((((((2400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a12a756f23507e45515a4c96() {
  return __cxx_static_address_a12a756f23507e45515a4c96.reference || (__cxx_static_address_a12a756f23507e45515a4c96.reference = {
    __cReference: true,
    get value() { return SCRAP1____header_global_0eccf50c2423ee01; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:626
export const SCRAP2____header_global_313f546b2212dcc3 = ((((((2404) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_358d8b635a90acc47aba83b5() {
  return __cxx_static_address_358d8b635a90acc47aba83b5.reference || (__cxx_static_address_358d8b635a90acc47aba83b5.reference = {
    __cReference: true,
    get value() { return SCRAP2____header_global_313f546b2212dcc3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:627
export const SCRAP3____header_global_3d701de54da1bb7a = ((((((2408) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_66d43d40dcee24c760dda81a() {
  return __cxx_static_address_66d43d40dcee24c760dda81a.reference || (__cxx_static_address_66d43d40dcee24c760dda81a.reference = {
    __cReference: true,
    get value() { return SCRAP3____header_global_3d701de54da1bb7a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:628
export const SCRAP4____header_global_72483ab5ab6de3a1 = ((((((2412) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0e0c154ee85c6f61d33f0f4c() {
  return __cxx_static_address_0e0c154ee85c6f61d33f0f4c.reference || (__cxx_static_address_0e0c154ee85c6f61d33f0f4c.reference = {
    __cReference: true,
    get value() { return SCRAP4____header_global_72483ab5ab6de3a1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:629
export const SCRAP5____header_global_3196242e4ee86c68 = ((((((2416) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cee769cb45b962a5d49adaf8() {
  return __cxx_static_address_cee769cb45b962a5d49adaf8.reference || (__cxx_static_address_cee769cb45b962a5d49adaf8.reference = {
    __cReference: true,
    get value() { return SCRAP5____header_global_3196242e4ee86c68; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:630
export const ORGANTIC____header_global_482b1b49060690b4 = ((((((2420) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9f294d15d682fb6eddceb3c1() {
  return __cxx_static_address_9f294d15d682fb6eddceb3c1.reference || (__cxx_static_address_9f294d15d682fb6eddceb3c1.reference = {
    __cReference: true,
    get value() { return ORGANTIC____header_global_482b1b49060690b4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:631
export const BETAVERSION____header_global_87cb6c2571bae5c1 = ((((((2440) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e051cf3ce049a08d55688cc9() {
  return __cxx_static_address_e051cf3ce049a08d55688cc9.reference || (__cxx_static_address_e051cf3ce049a08d55688cc9.reference = {
    __cReference: true,
    get value() { return BETAVERSION____header_global_87cb6c2571bae5c1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:632
export const SELECTDIR____header_global_cead64383648c607 = ((((((2444) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bfb1dc9c0361b9cc02200716() {
  return __cxx_static_address_bfb1dc9c0361b9cc02200716.reference || (__cxx_static_address_bfb1dc9c0361b9cc02200716.reference = {
    __cReference: true,
    get value() { return SELECTDIR____header_global_cead64383648c607; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:633
export const F1HELP____header_global_ec83a8a1bb5e927d = ((((((2445) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0651747835a833f8fc57cf95() {
  return __cxx_static_address_0651747835a833f8fc57cf95.reference || (__cxx_static_address_0651747835a833f8fc57cf95.reference = {
    __cReference: true,
    get value() { return F1HELP____header_global_ec83a8a1bb5e927d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:634
export const GROWSPARK____header_global_3e6b26df9181fca9 = ((((((2448) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_61e9babd8488ddaec1e562c3() {
  return __cxx_static_address_61e9babd8488ddaec1e562c3.reference || (__cxx_static_address_61e9babd8488ddaec1e562c3.reference = {
    __cReference: true,
    get value() { return GROWSPARK____header_global_3e6b26df9181fca9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:635
export const MENUSCREEN____header_global_1eefb6e3688c6b9d = ((((((2456) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_587ba88289f80308c1ac50e2() {
  return __cxx_static_address_587ba88289f80308c1ac50e2.reference || (__cxx_static_address_587ba88289f80308c1ac50e2.reference = {
    __cReference: true,
    get value() { return MENUSCREEN____header_global_1eefb6e3688c6b9d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:636
export const MENUBAR____header_global_b9cf4b10dbd072f1 = ((((((2457) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2aa2bf1ba8ecfb16ba63676f() {
  return __cxx_static_address_2aa2bf1ba8ecfb16ba63676f.reference || (__cxx_static_address_2aa2bf1ba8ecfb16ba63676f.reference = {
    __cReference: true,
    get value() { return MENUBAR____header_global_b9cf4b10dbd072f1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:637
export const KILLSICON____header_global_5da74d2cd6cb1d1d = ((((((2458) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7a861c8f65c2c9f733d99659() {
  return __cxx_static_address_7a861c8f65c2c9f733d99659.reference || (__cxx_static_address_7a861c8f65c2c9f733d99659.reference = {
    __cReference: true,
    get value() { return KILLSICON____header_global_5da74d2cd6cb1d1d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:638
export const FIRSTAID_ICON____header_global_c17294eed2718174 = ((((((2460) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c48b94115591f984d8ad6935() {
  return __cxx_static_address_c48b94115591f984d8ad6935.reference || (__cxx_static_address_c48b94115591f984d8ad6935.reference = {
    __cReference: true,
    get value() { return FIRSTAID_ICON____header_global_c17294eed2718174; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:639
export const HEAT_ICON____header_global_beb99d7d8c776566 = ((((((2461) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c27945085b76540621321416() {
  return __cxx_static_address_c27945085b76540621321416.reference || (__cxx_static_address_c27945085b76540621321416.reference = {
    __cReference: true,
    get value() { return HEAT_ICON____header_global_beb99d7d8c776566; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:640
export const BOTTOMSTATUSBAR____header_global_ee7416da3b34a5b7 = ((((((2462) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1871de68995407360eaa17c5() {
  return __cxx_static_address_1871de68995407360eaa17c5.reference || (__cxx_static_address_1871de68995407360eaa17c5.reference = {
    __cReference: true,
    get value() { return BOTTOMSTATUSBAR____header_global_ee7416da3b34a5b7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:641
export const BOOT_ICON____header_global_8a25d5c57bb90a5b = ((((((2463) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_63698baf0ae18230d573e44b() {
  return __cxx_static_address_63698baf0ae18230d573e44b.reference || (__cxx_static_address_63698baf0ae18230d573e44b.reference = {
    __cReference: true,
    get value() { return BOOT_ICON____header_global_8a25d5c57bb90a5b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:642
export const FRAGBAR____header_global_b8bd63910a834dcf = ((((((2465) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_def73ca5a5ff14eed331942d() {
  return __cxx_static_address_def73ca5a5ff14eed331942d.reference || (__cxx_static_address_def73ca5a5ff14eed331942d.reference = {
    __cReference: true,
    get value() { return FRAGBAR____header_global_b8bd63910a834dcf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:643
export const JETPACK_ICON____header_global_4187fbb86379cdff = ((((((2467) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e68c0e61623a71956840f689() {
  return __cxx_static_address_e68c0e61623a71956840f689.reference || (__cxx_static_address_e68c0e61623a71956840f689.reference = {
    __cReference: true,
    get value() { return JETPACK_ICON____header_global_4187fbb86379cdff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:644
export const AIRTANK_ICON____header_global_3bdb5b2ea23c96a5 = ((((((2468) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5348c2b7cf085f57225e7d81() {
  return __cxx_static_address_5348c2b7cf085f57225e7d81.reference || (__cxx_static_address_5348c2b7cf085f57225e7d81.reference = {
    __cReference: true,
    get value() { return AIRTANK_ICON____header_global_3bdb5b2ea23c96a5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:645
export const STEROIDS_ICON____header_global_ffdbe9605aba3b6c = ((((((2469) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6984b0f78d1a0068d5b079b9() {
  return __cxx_static_address_6984b0f78d1a0068d5b079b9.reference || (__cxx_static_address_6984b0f78d1a0068d5b079b9.reference = {
    __cReference: true,
    get value() { return STEROIDS_ICON____header_global_ffdbe9605aba3b6c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:646
export const HOLODUKE_ICON____header_global_1ca5651a892268eb = ((((((2470) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6d8ac700286e3e55d0d90760() {
  return __cxx_static_address_6d8ac700286e3e55d0d90760.reference || (__cxx_static_address_6d8ac700286e3e55d0d90760.reference = {
    __cReference: true,
    get value() { return HOLODUKE_ICON____header_global_1ca5651a892268eb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:647
export const ACCESS_ICON____header_global_805e5194621eb049 = ((((((2471) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f11686abbc219e108d3e2cf1() {
  return __cxx_static_address_f11686abbc219e108d3e2cf1.reference || (__cxx_static_address_f11686abbc219e108d3e2cf1.reference = {
    __cReference: true,
    get value() { return ACCESS_ICON____header_global_805e5194621eb049; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:648
export const DIGITALNUM____header_global_2b1400959a0cfd99 = ((((((2472) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a55d6e9a377ec01a150fc283() {
  return __cxx_static_address_a55d6e9a377ec01a150fc283.reference || (__cxx_static_address_a55d6e9a377ec01a150fc283.reference = {
    __cReference: true,
    get value() { return DIGITALNUM____header_global_2b1400959a0cfd99; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:649
export const DUKECAR____header_global_0f789ff096019085 = ((((((2491) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1fd35d39c510fdebfb5cb027() {
  return __cxx_static_address_1fd35d39c510fdebfb5cb027.reference || (__cxx_static_address_1fd35d39c510fdebfb5cb027.reference = {
    __cReference: true,
    get value() { return DUKECAR____header_global_0f789ff096019085; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:650
export const CAMCORNER____header_global_439339bb0179f6f4 = ((((((2482) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5000ddde592895ad337537dc() {
  return __cxx_static_address_5000ddde592895ad337537dc.reference || (__cxx_static_address_5000ddde592895ad337537dc.reference = {
    __cReference: true,
    get value() { return CAMCORNER____header_global_439339bb0179f6f4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:651
export const CAMLIGHT____header_global_4be81b3c4634651d = ((((((2484) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9daa7eb1cd47349f8345d7bb() {
  return __cxx_static_address_9daa7eb1cd47349f8345d7bb.reference || (__cxx_static_address_9daa7eb1cd47349f8345d7bb.reference = {
    __cReference: true,
    get value() { return CAMLIGHT____header_global_4be81b3c4634651d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:652
export const SLIDEBAR____header_global_a0742b92f7f27f02 = ((((((2489) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5355c4778d295bd11243e613() {
  return __cxx_static_address_5355c4778d295bd11243e613.reference || (__cxx_static_address_5355c4778d295bd11243e613.reference = {
    __cReference: true,
    get value() { return SLIDEBAR____header_global_a0742b92f7f27f02; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:653
export const DREALMS____header_global_0270bd94a24f426d = ((((((2492) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c400575aa550bf25162c0c1f() {
  return __cxx_static_address_c400575aa550bf25162c0c1f.reference || (__cxx_static_address_c400575aa550bf25162c0c1f.reference = {
    __cReference: true,
    get value() { return DREALMS____header_global_0270bd94a24f426d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:654
export const BETASCREEN____header_global_05b1b9ff238de608 = ((((((2493) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5e25528e84e51e7f585ecb33() {
  return __cxx_static_address_5e25528e84e51e7f585ecb33.reference || (__cxx_static_address_5e25528e84e51e7f585ecb33.reference = {
    __cReference: true,
    get value() { return BETASCREEN____header_global_05b1b9ff238de608; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:655
export const WINDOWBORDER1____header_global_3ef38ac9d515318b = ((((((2494) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_110aa3df283e163f7e881fe4() {
  return __cxx_static_address_110aa3df283e163f7e881fe4.reference || (__cxx_static_address_110aa3df283e163f7e881fe4.reference = {
    __cReference: true,
    get value() { return WINDOWBORDER1____header_global_3ef38ac9d515318b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:656
export const TEXTBOX____header_global_ba9c6d833f1cc2b4 = ((((((2495) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_50907927c8741aba1bcd4873() {
  return __cxx_static_address_50907927c8741aba1bcd4873.reference || (__cxx_static_address_50907927c8741aba1bcd4873.reference = {
    __cReference: true,
    get value() { return TEXTBOX____header_global_ba9c6d833f1cc2b4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:657
export const WINDOWBORDER2____header_global_9def7f26baeee31c = ((((((2496) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6ac4cc5088da8fb2c12fc509() {
  return __cxx_static_address_6ac4cc5088da8fb2c12fc509.reference || (__cxx_static_address_6ac4cc5088da8fb2c12fc509.reference = {
    __cReference: true,
    get value() { return WINDOWBORDER2____header_global_9def7f26baeee31c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:658
export const DUKENUKEM____header_global_be28788c2cc548dc = ((((((2497) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d1d5d7068b635a8b7139bd29() {
  return __cxx_static_address_d1d5d7068b635a8b7139bd29.reference || (__cxx_static_address_d1d5d7068b635a8b7139bd29.reference = {
    __cReference: true,
    get value() { return DUKENUKEM____header_global_be28788c2cc548dc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:659
export const THREEDEE____header_global_3b4b3f5aa7597457 = ((((((2498) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3b1a899e624b33d84ccf58e9() {
  return __cxx_static_address_3b1a899e624b33d84ccf58e9.reference || (__cxx_static_address_3b1a899e624b33d84ccf58e9.reference = {
    __cReference: true,
    get value() { return THREEDEE____header_global_3b4b3f5aa7597457; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:660
export const INGAMEDUKETHREEDEE____header_global_31aa060bee45faed = ((((((2499) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_493e45b21cc4877725c313a3() {
  return __cxx_static_address_493e45b21cc4877725c313a3.reference || (__cxx_static_address_493e45b21cc4877725c313a3.reference = {
    __cReference: true,
    get value() { return INGAMEDUKETHREEDEE____header_global_31aa060bee45faed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:661
export const TENSCREEN____header_global_afeb83b336a5dd39 = ((((((2500) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_458311d36c8470ff7e5b53ea() {
  return __cxx_static_address_458311d36c8470ff7e5b53ea.reference || (__cxx_static_address_458311d36c8470ff7e5b53ea.reference = {
    __cReference: true,
    get value() { return TENSCREEN____header_global_afeb83b336a5dd39; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:662
export const PLUTOPAKSPRITE____header_global_14d87112aa4d262d = ((((((2501) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_689185cb5a3c54b3bf881e7d() {
  return __cxx_static_address_689185cb5a3c54b3bf881e7d.reference || (__cxx_static_address_689185cb5a3c54b3bf881e7d.reference = {
    __cReference: true,
    get value() { return PLUTOPAKSPRITE____header_global_14d87112aa4d262d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:663
export const DEVISTATOR____header_global_e581144dc61b0442 = ((((((2510) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_18ea680f84180402545d00c1() {
  return __cxx_static_address_18ea680f84180402545d00c1.reference || (__cxx_static_address_18ea680f84180402545d00c1.reference = {
    __cReference: true,
    get value() { return DEVISTATOR____header_global_e581144dc61b0442; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:664
export const KNEE____header_global_a681a2818444291c = ((((((2521) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bf375ec458e4606ba4175ab5() {
  return __cxx_static_address_bf375ec458e4606ba4175ab5.reference || (__cxx_static_address_bf375ec458e4606ba4175ab5.reference = {
    __cReference: true,
    get value() { return KNEE____header_global_a681a2818444291c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:665
export const CROSSHAIR____header_global_e1c658d4b2ade50e = ((((((2523) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ef94532ed3e819765e41cfc9() {
  return __cxx_static_address_ef94532ed3e819765e41cfc9.reference || (__cxx_static_address_ef94532ed3e819765e41cfc9.reference = {
    __cReference: true,
    get value() { return CROSSHAIR____header_global_e1c658d4b2ade50e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:666
export const FIRSTGUN____header_global_9fab847f338002c5 = ((((((2524) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0567d02bb18526606c540e0c() {
  return __cxx_static_address_0567d02bb18526606c540e0c.reference || (__cxx_static_address_0567d02bb18526606c540e0c.reference = {
    __cReference: true,
    get value() { return FIRSTGUN____header_global_9fab847f338002c5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:667
export const FIRSTGUNRELOAD____header_global_9300b7fdbed8524f = ((((((2528) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c9e1af8b4ac5ad05932c5b86() {
  return __cxx_static_address_c9e1af8b4ac5ad05932c5b86.reference || (__cxx_static_address_c9e1af8b4ac5ad05932c5b86.reference = {
    __cReference: true,
    get value() { return FIRSTGUNRELOAD____header_global_9300b7fdbed8524f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:668
export const SHELL____header_global_57714afbaca4a5c4 = ((((((2533) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c430fc2aa79d355779400756() {
  return __cxx_static_address_c430fc2aa79d355779400756.reference || (__cxx_static_address_c430fc2aa79d355779400756.reference = {
    __cReference: true,
    get value() { return SHELL____header_global_57714afbaca4a5c4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:669
export const SHOTGUNSHELL____header_global_09a18bb9f9b6d6be = ((((((2535) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8f547b69b94b72c2396829a8() {
  return __cxx_static_address_8f547b69b94b72c2396829a8.reference || (__cxx_static_address_8f547b69b94b72c2396829a8.reference = {
    __cReference: true,
    get value() { return SHOTGUNSHELL____header_global_09a18bb9f9b6d6be; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:670
export const CHAINGUN____header_global_3854090cd30a0633 = ((((((2536) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9a9bb9b694149c1727716896() {
  return __cxx_static_address_9a9bb9b694149c1727716896.reference || (__cxx_static_address_9a9bb9b694149c1727716896.reference = {
    __cReference: true,
    get value() { return CHAINGUN____header_global_3854090cd30a0633; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:671
export const RPGGUN____header_global_7d12dc2880e4a3b9 = ((((((2544) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1d6ab5ecf550639d7bf5eb7f() {
  return __cxx_static_address_1d6ab5ecf550639d7bf5eb7f.reference || (__cxx_static_address_1d6ab5ecf550639d7bf5eb7f.reference = {
    __cReference: true,
    get value() { return RPGGUN____header_global_7d12dc2880e4a3b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:672
export const FREEZE____header_global_acf66477047e0523 = ((((((2548) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b97761f27fa276abc9a0ce4f() {
  return __cxx_static_address_b97761f27fa276abc9a0ce4f.reference || (__cxx_static_address_b97761f27fa276abc9a0ce4f.reference = {
    __cReference: true,
    get value() { return FREEZE____header_global_acf66477047e0523; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:673
export const SHRINKER____header_global_b1b5122b6e0b922e = ((((((2556) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_58a672c12aa8d6c9138c9e9e() {
  return __cxx_static_address_58a672c12aa8d6c9138c9e9e.reference || (__cxx_static_address_58a672c12aa8d6c9138c9e9e.reference = {
    __cReference: true,
    get value() { return SHRINKER____header_global_b1b5122b6e0b922e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:674
export const HANDHOLDINGLASER____header_global_eaad155eca509985 = ((((((2563) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5d7d393c19ee6c42da9cb58f() {
  return __cxx_static_address_5d7d393c19ee6c42da9cb58f.reference || (__cxx_static_address_5d7d393c19ee6c42da9cb58f.reference = {
    __cReference: true,
    get value() { return HANDHOLDINGLASER____header_global_eaad155eca509985; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:675
export const TRIPBOMB____header_global_5ab66384804f0287 = ((((((2566) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_71e42aedffc9249234811dc2() {
  return __cxx_static_address_71e42aedffc9249234811dc2.reference || (__cxx_static_address_71e42aedffc9249234811dc2.reference = {
    __cReference: true,
    get value() { return TRIPBOMB____header_global_5ab66384804f0287; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:676
export const LASERLINE____header_global_404f39c42851de0f = ((((((2567) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d20e857f1394ce239a6414a4() {
  return __cxx_static_address_d20e857f1394ce239a6414a4.reference || (__cxx_static_address_d20e857f1394ce239a6414a4.reference = {
    __cReference: true,
    get value() { return LASERLINE____header_global_404f39c42851de0f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:677
export const HANDHOLDINGACCESS____header_global_30e94bd4d4d3df3b = ((((((2568) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3a46fd9a23177e04bce033a8() {
  return __cxx_static_address_3a46fd9a23177e04bce033a8.reference || (__cxx_static_address_3a46fd9a23177e04bce033a8.reference = {
    __cReference: true,
    get value() { return HANDHOLDINGACCESS____header_global_30e94bd4d4d3df3b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:678
export const HANDREMOTE____header_global_a7e6eccc7c3fd228 = ((((((2570) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_483ea651010780e8dc659839() {
  return __cxx_static_address_483ea651010780e8dc659839.reference || (__cxx_static_address_483ea651010780e8dc659839.reference = {
    __cReference: true,
    get value() { return HANDREMOTE____header_global_a7e6eccc7c3fd228; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:679
export const HANDTHROW____header_global_71743e5934980180 = ((((((2573) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2d69c29e66bbe97bd110bce7() {
  return __cxx_static_address_2d69c29e66bbe97bd110bce7.reference || (__cxx_static_address_2d69c29e66bbe97bd110bce7.reference = {
    __cReference: true,
    get value() { return HANDTHROW____header_global_71743e5934980180; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:680
export const TIP____header_global_9157a37b18cad125 = ((((((2576) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1049e95d53c1941a7a795fd8() {
  return __cxx_static_address_1049e95d53c1941a7a795fd8.reference || (__cxx_static_address_1049e95d53c1941a7a795fd8.reference = {
    __cReference: true,
    get value() { return TIP____header_global_9157a37b18cad125; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:681
export const SCUBAMASK____header_global_dddd25deed778568 = ((((((2581) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2a3f19104c3761f4c8d36f76() {
  return __cxx_static_address_2a3f19104c3761f4c8d36f76.reference || (__cxx_static_address_2a3f19104c3761f4c8d36f76.reference = {
    __cReference: true,
    get value() { return SCUBAMASK____header_global_dddd25deed778568; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:682
export const FORCESPHERE____header_global_b719c76e13d78c32 = ((((((2590) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8c1a22a88ca8a4e12c74a2b1() {
  return __cxx_static_address_8c1a22a88ca8a4e12c74a2b1.reference || (__cxx_static_address_8c1a22a88ca8a4e12c74a2b1.reference = {
    __cReference: true,
    get value() { return FORCESPHERE____header_global_b719c76e13d78c32; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:683
export const SHOTSPARK1____header_global_62d58f74fcb536d5 = ((((((2595) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c35f655fd50acac6216113ae() {
  return __cxx_static_address_c35f655fd50acac6216113ae.reference || (__cxx_static_address_c35f655fd50acac6216113ae.reference = {
    __cReference: true,
    get value() { return SHOTSPARK1____header_global_62d58f74fcb536d5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:684
export const RPG____header_global_4258bce77e6ba38c = ((((((2605) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b31ca383bed094a5274aa374() {
  return __cxx_static_address_b31ca383bed094a5274aa374.reference || (__cxx_static_address_b31ca383bed094a5274aa374.reference = {
    __cReference: true,
    get value() { return RPG____header_global_4258bce77e6ba38c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:685
export const LASERSITE____header_global_21b716e2c7e416b9 = ((((((2612) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_642df5f662eb8bb6df143df8() {
  return __cxx_static_address_642df5f662eb8bb6df143df8.reference || (__cxx_static_address_642df5f662eb8bb6df143df8.reference = {
    __cReference: true,
    get value() { return LASERSITE____header_global_21b716e2c7e416b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:686
export const SHOTGUN____header_global_8321ac92ac6dff06 = ((((((2613) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_00b43731d53aae7d607f6b40() {
  return __cxx_static_address_00b43731d53aae7d607f6b40.reference || (__cxx_static_address_00b43731d53aae7d607f6b40.reference = {
    __cReference: true,
    get value() { return SHOTGUN____header_global_8321ac92ac6dff06; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:687
export const BOSS1____header_global_534c77cbea397324 = ((((((2630) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7ac02b2a5db6291404911636() {
  return __cxx_static_address_7ac02b2a5db6291404911636.reference || (__cxx_static_address_7ac02b2a5db6291404911636.reference = {
    __cReference: true,
    get value() { return BOSS1____header_global_534c77cbea397324; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:688
export const BOSS1STAYPUT____header_global_d5229d6378e52616 = ((((((2631) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7d410354b22610fa9dee4b8a() {
  return __cxx_static_address_7d410354b22610fa9dee4b8a.reference || (__cxx_static_address_7d410354b22610fa9dee4b8a.reference = {
    __cReference: true,
    get value() { return BOSS1STAYPUT____header_global_d5229d6378e52616; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:689
export const BOSS1SHOOT____header_global_3dbaebfb925461de = ((((((2660) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8bedcc412b94df78378c408b() {
  return __cxx_static_address_8bedcc412b94df78378c408b.reference || (__cxx_static_address_8bedcc412b94df78378c408b.reference = {
    __cReference: true,
    get value() { return BOSS1SHOOT____header_global_3dbaebfb925461de; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:690
export const BOSS1LOB____header_global_cdf00be04b88291d = ((((((2670) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_908d2794fd85a8bf377c328a() {
  return __cxx_static_address_908d2794fd85a8bf377c328a.reference || (__cxx_static_address_908d2794fd85a8bf377c328a.reference = {
    __cReference: true,
    get value() { return BOSS1LOB____header_global_cdf00be04b88291d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:691
export const BOSSTOP____header_global_fae5c78e82e971dc = ((((((2696) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_29f13989132bb0d7a1c80a31() {
  return __cxx_static_address_29f13989132bb0d7a1c80a31.reference || (__cxx_static_address_29f13989132bb0d7a1c80a31.reference = {
    __cReference: true,
    get value() { return BOSSTOP____header_global_fae5c78e82e971dc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:692
export const BOSS2____header_global_36a9b4081728296d = ((((((2710) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ecd77d98686e97d77cde2335() {
  return __cxx_static_address_ecd77d98686e97d77cde2335.reference || (__cxx_static_address_ecd77d98686e97d77cde2335.reference = {
    __cReference: true,
    get value() { return BOSS2____header_global_36a9b4081728296d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:693
export const BOSS3____header_global_d248941f1144a087 = ((((((2760) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_42cdb6710966d2825e675ea4() {
  return __cxx_static_address_42cdb6710966d2825e675ea4.reference || (__cxx_static_address_42cdb6710966d2825e675ea4.reference = {
    __cReference: true,
    get value() { return BOSS3____header_global_d248941f1144a087; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:694
export const SPINNINGNUKEICON____header_global_1fd0d63b2bc8a240 = ((((((2813) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3ca7188c1d884911a59f4f21() {
  return __cxx_static_address_3ca7188c1d884911a59f4f21.reference || (__cxx_static_address_3ca7188c1d884911a59f4f21.reference = {
    __cReference: true,
    get value() { return SPINNINGNUKEICON____header_global_1fd0d63b2bc8a240; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:695
export const SMALLFNTCURSOR____header_global_47a6d4d47d7536db = ((((((2821) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7035d96a51e1a740573ec625() {
  return __cxx_static_address_7035d96a51e1a740573ec625.reference || (__cxx_static_address_7035d96a51e1a740573ec625.reference = {
    __cReference: true,
    get value() { return SMALLFNTCURSOR____header_global_47a6d4d47d7536db; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:696
export const STARTALPHANUM____header_global_47de991d60ed1d45 = ((((((2822) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4416ade31e943db6b42a0909() {
  return __cxx_static_address_4416ade31e943db6b42a0909.reference || (__cxx_static_address_4416ade31e943db6b42a0909.reference = {
    __cReference: true,
    get value() { return STARTALPHANUM____header_global_47de991d60ed1d45; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:697
export const ENDALPHANUM____header_global_05b6f3fff70bd588 = ((((((2915) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ba61b90f31bcdde51cce2eda() {
  return __cxx_static_address_ba61b90f31bcdde51cce2eda.reference || (__cxx_static_address_ba61b90f31bcdde51cce2eda.reference = {
    __cReference: true,
    get value() { return ENDALPHANUM____header_global_05b6f3fff70bd588; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:698
export const BIGALPHANUM____header_global_cb4173cd56297df1 = ((((((2940) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5efce6c5b3f0d88f31363ecb() {
  return __cxx_static_address_5efce6c5b3f0d88f31363ecb.reference || (__cxx_static_address_5efce6c5b3f0d88f31363ecb.reference = {
    __cReference: true,
    get value() { return BIGALPHANUM____header_global_cb4173cd56297df1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:699
export const BIGPERIOD____header_global_d1996c898fc97857 = ((((((3002) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f920ea9ee41170e1227eed06() {
  return __cxx_static_address_f920ea9ee41170e1227eed06.reference || (__cxx_static_address_f920ea9ee41170e1227eed06.reference = {
    __cReference: true,
    get value() { return BIGPERIOD____header_global_d1996c898fc97857; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:700
export const BIGCOMMA____header_global_e2788b665d1d52ca = ((((((3003) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8e070c90981395710e17f155() {
  return __cxx_static_address_8e070c90981395710e17f155.reference || (__cxx_static_address_8e070c90981395710e17f155.reference = {
    __cReference: true,
    get value() { return BIGCOMMA____header_global_e2788b665d1d52ca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:701
export const BIGX____header_global_5fa7062469122b1f = ((((((3004) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_673c6dcaae7c4b63337625d8() {
  return __cxx_static_address_673c6dcaae7c4b63337625d8.reference || (__cxx_static_address_673c6dcaae7c4b63337625d8.reference = {
    __cReference: true,
    get value() { return BIGX____header_global_5fa7062469122b1f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:702
export const BIGQ____header_global_49ae6ebcadd36571 = ((((((3005) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cf8197dc9b7dfc2d33c4ab35() {
  return __cxx_static_address_cf8197dc9b7dfc2d33c4ab35.reference || (__cxx_static_address_cf8197dc9b7dfc2d33c4ab35.reference = {
    __cReference: true,
    get value() { return BIGQ____header_global_49ae6ebcadd36571; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:703
export const BIGSEMI____header_global_4981c60e7bd661db = ((((((3006) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c04da6c3de011e2d94241f6e() {
  return __cxx_static_address_c04da6c3de011e2d94241f6e.reference || (__cxx_static_address_c04da6c3de011e2d94241f6e.reference = {
    __cReference: true,
    get value() { return BIGSEMI____header_global_4981c60e7bd661db; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:704
export const BIGCOLIN____header_global_bcb953692632cfd1 = ((((((3007) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_03d9c419a88397cba8371e53() {
  return __cxx_static_address_03d9c419a88397cba8371e53.reference || (__cxx_static_address_03d9c419a88397cba8371e53.reference = {
    __cReference: true,
    get value() { return BIGCOLIN____header_global_bcb953692632cfd1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:705
export const THREEBYFIVE____header_global_397615e1ca3cf41e = ((((((3010) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7431a07a29491a3153a24835() {
  return __cxx_static_address_7431a07a29491a3153a24835.reference || (__cxx_static_address_7431a07a29491a3153a24835.reference = {
    __cReference: true,
    get value() { return THREEBYFIVE____header_global_397615e1ca3cf41e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:706
export const BIGAPPOS____header_global_72b31fc958e3a0cf = ((((((3022) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_be480ffd6ea1c665ed47dabf() {
  return __cxx_static_address_be480ffd6ea1c665ed47dabf.reference || (__cxx_static_address_be480ffd6ea1c665ed47dabf.reference = {
    __cReference: true,
    get value() { return BIGAPPOS____header_global_72b31fc958e3a0cf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:707
export const MINIFONT____header_global_80edc052bb3e4d2b = ((((((3072) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ebe1b8dba19825b3520a6836() {
  return __cxx_static_address_ebe1b8dba19825b3520a6836.reference || (__cxx_static_address_ebe1b8dba19825b3520a6836.reference = {
    __cReference: true,
    get value() { return MINIFONT____header_global_80edc052bb3e4d2b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:708
export const RESPAWNMARKERRED____header_global_7514202374112eeb = ((((((3190) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a974009d8c94d5d28c45cc68() {
  return __cxx_static_address_a974009d8c94d5d28c45cc68.reference || (__cxx_static_address_a974009d8c94d5d28c45cc68.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERRED____header_global_7514202374112eeb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:709
export const RESPAWNMARKERYELLOW____header_global_df5bd87ccfb54f23 = ((((((3200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d91564baa541f682620d1b59() {
  return __cxx_static_address_d91564baa541f682620d1b59.reference || (__cxx_static_address_d91564baa541f682620d1b59.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERYELLOW____header_global_df5bd87ccfb54f23; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:710
export const RESPAWNMARKERGREEN____header_global_d0ea473ff0ddd6cf = ((((((3210) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_902191696d6d45b3a383fc69() {
  return __cxx_static_address_902191696d6d45b3a383fc69.reference || (__cxx_static_address_902191696d6d45b3a383fc69.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERGREEN____header_global_d0ea473ff0ddd6cf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:711
export const BONUSSCREEN____header_global_0dc55170bf95a7d8 = ((((((3240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1bf46e099e8a604f426b32ca() {
  return __cxx_static_address_1bf46e099e8a604f426b32ca.reference || (__cxx_static_address_1bf46e099e8a604f426b32ca.reference = {
    __cReference: true,
    get value() { return BONUSSCREEN____header_global_0dc55170bf95a7d8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:712
export const VIEWBORDER____header_global_f17b229b3cb122d0 = ((((((3250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2ef644e0ffacb73f667461bd() {
  return __cxx_static_address_2ef644e0ffacb73f667461bd.reference || (__cxx_static_address_2ef644e0ffacb73f667461bd.reference = {
    __cReference: true,
    get value() { return VIEWBORDER____header_global_f17b229b3cb122d0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:713
export const VICTORY1____header_global_9680b0f1edfe24b6 = ((((((3260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d14aa101efab9fce3bff3a19() {
  return __cxx_static_address_d14aa101efab9fce3bff3a19.reference || (__cxx_static_address_d14aa101efab9fce3bff3a19.reference = {
    __cReference: true,
    get value() { return VICTORY1____header_global_9680b0f1edfe24b6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:714
export const ORDERING____header_global_601e2cb9ffc39805 = ((((((3270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_26cbe0da9023cfe535afb28b() {
  return __cxx_static_address_26cbe0da9023cfe535afb28b.reference || (__cxx_static_address_26cbe0da9023cfe535afb28b.reference = {
    __cReference: true,
    get value() { return ORDERING____header_global_601e2cb9ffc39805; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:715
export const TEXTSTORY____header_global_f4528b2fc1023be1 = ((((((3280) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7ac45c29dba9b5614742d1ec() {
  return __cxx_static_address_7ac45c29dba9b5614742d1ec.reference || (__cxx_static_address_7ac45c29dba9b5614742d1ec.reference = {
    __cReference: true,
    get value() { return TEXTSTORY____header_global_f4528b2fc1023be1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:716
export const LOADSCREEN____header_global_086d53b70c030ddd = ((((((3281) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2e4c0f300a4b2037013478cc() {
  return __cxx_static_address_2e4c0f300a4b2037013478cc.reference || (__cxx_static_address_2e4c0f300a4b2037013478cc.reference = {
    __cReference: true,
    get value() { return LOADSCREEN____header_global_086d53b70c030ddd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:717
export const BORNTOBEWILDSCREEN____header_global_e64d41211de841da = ((((((3370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7fdc315dc7ad08fa608c14d8() {
  return __cxx_static_address_7fdc315dc7ad08fa608c14d8.reference || (__cxx_static_address_7fdc315dc7ad08fa608c14d8.reference = {
    __cReference: true,
    get value() { return BORNTOBEWILDSCREEN____header_global_e64d41211de841da; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:718
export const BLIMP____header_global_37b434722ebd5fc1 = ((((((3400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dbe53426dcafa228274011c1() {
  return __cxx_static_address_dbe53426dcafa228274011c1.reference || (__cxx_static_address_dbe53426dcafa228274011c1.reference = {
    __cReference: true,
    get value() { return BLIMP____header_global_37b434722ebd5fc1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:719
export const FEM9____header_global_2271e3b2eebd1db4 = ((((((3450) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7083dbd2baeb7ec1c9b86b1a() {
  return __cxx_static_address_7083dbd2baeb7ec1c9b86b1a.reference || (__cxx_static_address_7083dbd2baeb7ec1c9b86b1a.reference = {
    __cReference: true,
    get value() { return FEM9____header_global_2271e3b2eebd1db4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:720
export const FRAMEEFFECT1_13____header_global_51e9b9f24bcce25b = ((((((3999) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_72daa89895896f6c28617502() {
  return __cxx_static_address_72daa89895896f6c28617502.reference || (__cxx_static_address_72daa89895896f6c28617502.reference = {
    __cReference: true,
    get value() { return FRAMEEFFECT1_13____header_global_51e9b9f24bcce25b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:721
export const FRAMEEFFECT1____header_global_02127ef19eaef59a = ((((((4095) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ab75c0cf76b0e13303bd08d5() {
  return __cxx_static_address_ab75c0cf76b0e13303bd08d5.reference || (__cxx_static_address_ab75c0cf76b0e13303bd08d5.reference = {
    __cReference: true,
    get value() { return FRAMEEFFECT1____header_global_02127ef19eaef59a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:722
export const PANNEL3____header_global_32cf5faaa02d0ba0 = ((((((4099) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_792833b84271aae57aa2290e() {
  return __cxx_static_address_792833b84271aae57aa2290e.reference || (__cxx_static_address_792833b84271aae57aa2290e.reference = {
    __cReference: true,
    get value() { return PANNEL3____header_global_32cf5faaa02d0ba0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:723
export const SCREENBREAK14____header_global_47e0563a2dbc74e1 = ((((((4120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d6594e63269959f268e5681a() {
  return __cxx_static_address_d6594e63269959f268e5681a.reference || (__cxx_static_address_d6594e63269959f268e5681a.reference = {
    __cReference: true,
    get value() { return SCREENBREAK14____header_global_47e0563a2dbc74e1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:724
export const SCREENBREAK15____header_global_0d75e316f6c2abf5 = ((((((4123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6433004adbbe8f2fa2f91982() {
  return __cxx_static_address_6433004adbbe8f2fa2f91982.reference || (__cxx_static_address_6433004adbbe8f2fa2f91982.reference = {
    __cReference: true,
    get value() { return SCREENBREAK15____header_global_0d75e316f6c2abf5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:725
export const SCREENBREAK19____header_global_c94a8d4ce1aea488 = ((((((4125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1edd758195ce72ee02d06853() {
  return __cxx_static_address_1edd758195ce72ee02d06853.reference || (__cxx_static_address_1edd758195ce72ee02d06853.reference = {
    __cReference: true,
    get value() { return SCREENBREAK19____header_global_c94a8d4ce1aea488; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:726
export const SCREENBREAK16____header_global_4b5ded4fd48b4b56 = ((((((4127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6264251c2c278813eaddb2c9() {
  return __cxx_static_address_6264251c2c278813eaddb2c9.reference || (__cxx_static_address_6264251c2c278813eaddb2c9.reference = {
    __cReference: true,
    get value() { return SCREENBREAK16____header_global_4b5ded4fd48b4b56; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:727
export const SCREENBREAK17____header_global_bfdf490713022545 = ((((((4128) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1322f8d185d402b4d43483b4() {
  return __cxx_static_address_1322f8d185d402b4d43483b4.reference || (__cxx_static_address_1322f8d185d402b4d43483b4.reference = {
    __cReference: true,
    get value() { return SCREENBREAK17____header_global_bfdf490713022545; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:728
export const SCREENBREAK18____header_global_31d756d145dc9294 = ((((((4129) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eeaf74eb853b9e86b246c6f1() {
  return __cxx_static_address_eeaf74eb853b9e86b246c6f1.reference || (__cxx_static_address_eeaf74eb853b9e86b246c6f1.reference = {
    __cReference: true,
    get value() { return SCREENBREAK18____header_global_31d756d145dc9294; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:729
export const W_TECHWALL11____header_global_81f904de5ae8cc0b = ((((((4130) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_96c048170b5544e1a2ca4c3a() {
  return __cxx_static_address_96c048170b5544e1a2ca4c3a.reference || (__cxx_static_address_96c048170b5544e1a2ca4c3a.reference = {
    __cReference: true,
    get value() { return W_TECHWALL11____header_global_81f904de5ae8cc0b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:730
export const W_TECHWALL12____header_global_a7f2413108e1d086 = ((((((4131) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_545b17c8b0d6314eba7130f0() {
  return __cxx_static_address_545b17c8b0d6314eba7130f0.reference || (__cxx_static_address_545b17c8b0d6314eba7130f0.reference = {
    __cReference: true,
    get value() { return W_TECHWALL12____header_global_a7f2413108e1d086; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:731
export const W_TECHWALL13____header_global_46960331d1d57a6d = ((((((4132) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ab65d2cf93afad5628abd124() {
  return __cxx_static_address_ab65d2cf93afad5628abd124.reference || (__cxx_static_address_ab65d2cf93afad5628abd124.reference = {
    __cReference: true,
    get value() { return W_TECHWALL13____header_global_46960331d1d57a6d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:732
export const W_TECHWALL14____header_global_dae1e82526d4e345 = ((((((4133) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3d6f7c31b0c7657182d493bf() {
  return __cxx_static_address_3d6f7c31b0c7657182d493bf.reference || (__cxx_static_address_3d6f7c31b0c7657182d493bf.reference = {
    __cReference: true,
    get value() { return W_TECHWALL14____header_global_dae1e82526d4e345; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:733
export const W_TECHWALL5____header_global_fe4e2150ec7b7025 = ((((((4134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3ff418de367c11a8a6c0892e() {
  return __cxx_static_address_3ff418de367c11a8a6c0892e.reference || (__cxx_static_address_3ff418de367c11a8a6c0892e.reference = {
    __cReference: true,
    get value() { return W_TECHWALL5____header_global_fe4e2150ec7b7025; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:734
export const W_TECHWALL6____header_global_02e8b73a36bda054 = ((((((4136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8f17e8824bf1de9ee1e36de8() {
  return __cxx_static_address_8f17e8824bf1de9ee1e36de8.reference || (__cxx_static_address_8f17e8824bf1de9ee1e36de8.reference = {
    __cReference: true,
    get value() { return W_TECHWALL6____header_global_02e8b73a36bda054; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:735
export const W_TECHWALL7____header_global_715bb81eca55939d = ((((((4138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_851d5d98f980602dc235c3e0() {
  return __cxx_static_address_851d5d98f980602dc235c3e0.reference || (__cxx_static_address_851d5d98f980602dc235c3e0.reference = {
    __cReference: true,
    get value() { return W_TECHWALL7____header_global_715bb81eca55939d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:736
export const W_TECHWALL8____header_global_f8682fbda881c5c1 = ((((((4140) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3fe9e484a11a50f9b2caa4f5() {
  return __cxx_static_address_3fe9e484a11a50f9b2caa4f5.reference || (__cxx_static_address_3fe9e484a11a50f9b2caa4f5.reference = {
    __cReference: true,
    get value() { return W_TECHWALL8____header_global_f8682fbda881c5c1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:737
export const W_TECHWALL9____header_global_81696e5f5e18767b = ((((((4142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f05590ffdf899ed2994719e5() {
  return __cxx_static_address_f05590ffdf899ed2994719e5.reference || (__cxx_static_address_f05590ffdf899ed2994719e5.reference = {
    __cReference: true,
    get value() { return W_TECHWALL9____header_global_81696e5f5e18767b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:738
export const BPANNEL3____header_global_67e3b06ba5eda523 = ((((((4100) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_55d4a577ee1ae108cbd8ab1d() {
  return __cxx_static_address_55d4a577ee1ae108cbd8ab1d.reference || (__cxx_static_address_55d4a577ee1ae108cbd8ab1d.reference = {
    __cReference: true,
    get value() { return BPANNEL3____header_global_67e3b06ba5eda523; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:739
export const W_HITTECHWALL16____header_global_33fbb820aee1909c = ((((((4144) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_209693c23f5d00fececd079d() {
  return __cxx_static_address_209693c23f5d00fececd079d.reference || (__cxx_static_address_209693c23f5d00fececd079d.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL16____header_global_33fbb820aee1909c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:740
export const W_HITTECHWALL10____header_global_64c0805b3173fe49 = ((((((4145) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_657cc9b49e2dbb372fb6db82() {
  return __cxx_static_address_657cc9b49e2dbb372fb6db82.reference || (__cxx_static_address_657cc9b49e2dbb372fb6db82.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL10____header_global_64c0805b3173fe49; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:741
export const W_HITTECHWALL15____header_global_cd5f77f80648b24d = ((((((4147) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_74652677cb28e93ef16f6759() {
  return __cxx_static_address_74652677cb28e93ef16f6759.reference || (__cxx_static_address_74652677cb28e93ef16f6759.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL15____header_global_cd5f77f80648b24d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:742
export const W_MILKSHELF____header_global_9a605796b33b9757 = ((((((4181) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d368569d1c9b265374d0bedf() {
  return __cxx_static_address_d368569d1c9b265374d0bedf.reference || (__cxx_static_address_d368569d1c9b265374d0bedf.reference = {
    __cReference: true,
    get value() { return W_MILKSHELF____header_global_9a605796b33b9757; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:743
export const W_MILKSHELFBROKE____header_global_42d35059324fc3ae = ((((((4203) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_853a34efc12b335a25adb235() {
  return __cxx_static_address_853a34efc12b335a25adb235.reference || (__cxx_static_address_853a34efc12b335a25adb235.reference = {
    __cReference: true,
    get value() { return W_MILKSHELFBROKE____header_global_42d35059324fc3ae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:744
export const PURPLELAVA____header_global_469ae8a9c8132a60 = ((((((4240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e00f6b8f6a032abc58c72df8() {
  return __cxx_static_address_e00f6b8f6a032abc58c72df8.reference || (__cxx_static_address_e00f6b8f6a032abc58c72df8.reference = {
    __cReference: true,
    get value() { return PURPLELAVA____header_global_469ae8a9c8132a60; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:745
export const TARGET____header_global_b475bfecaa40c81b = ((((((4359) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_41c661aa08eee27765f17ffe() {
  return __cxx_static_address_41c661aa08eee27765f17ffe.reference || (__cxx_static_address_41c661aa08eee27765f17ffe.reference = {
    __cReference: true,
    get value() { return TARGET____header_global_b475bfecaa40c81b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:746
export const DUCK____header_global_6b9b05025942a601 = ((((((4361) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_24e35f0ece9fc3816cb3d318() {
  return __cxx_static_address_24e35f0ece9fc3816cb3d318.reference || (__cxx_static_address_24e35f0ece9fc3816cb3d318.reference = {
    __cReference: true,
    get value() { return DUCK____header_global_6b9b05025942a601; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:747
export const PUKE____header_global_8237b8bc3e491b7e = ((((((4389) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_19ae19923acac1e1c278c1c0() {
  return __cxx_static_address_19ae19923acac1e1c278c1c0.reference || (__cxx_static_address_19ae19923acac1e1c278c1c0.reference = {
    __cReference: true,
    get value() { return PUKE____header_global_8237b8bc3e491b7e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:748
export const DOORTILE23____header_global_875e18cf117bd11b = ((((((4391) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ff8e975eec3ebe673a225324() {
  return __cxx_static_address_ff8e975eec3ebe673a225324.reference || (__cxx_static_address_ff8e975eec3ebe673a225324.reference = {
    __cReference: true,
    get value() { return DOORTILE23____header_global_875e18cf117bd11b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:749
export const SPEAKER____header_global_05138fff25f43546 = ((((((4397) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a54aa38f02d0de4d66b97823() {
  return __cxx_static_address_a54aa38f02d0de4d66b97823.reference || (__cxx_static_address_a54aa38f02d0de4d66b97823.reference = {
    __cReference: true,
    get value() { return SPEAKER____header_global_05138fff25f43546; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:750
export const MAIL____header_global_cf06b6a5d05d5cc9 = ((((((4410) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dbcd61a6a8c523c3645e4abd() {
  return __cxx_static_address_dbcd61a6a8c523c3645e4abd.reference || (__cxx_static_address_dbcd61a6a8c523c3645e4abd.reference = {
    __cReference: true,
    get value() { return MAIL____header_global_cf06b6a5d05d5cc9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:751
export const HOTMEAT____header_global_e6dfaf1694e82c4c = ((((((4427) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eb671b2feaae8329a30a5e66() {
  return __cxx_static_address_eb671b2feaae8329a30a5e66.reference || (__cxx_static_address_eb671b2feaae8329a30a5e66.reference = {
    __cReference: true,
    get value() { return HOTMEAT____header_global_e6dfaf1694e82c4c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:752
export const TRIPODCAMERA____header_global_8f0bf7c67b81adbb = ((((((4444) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3819878100dbc685e2669f22() {
  return __cxx_static_address_3819878100dbc685e2669f22.reference || (__cxx_static_address_3819878100dbc685e2669f22.reference = {
    __cReference: true,
    get value() { return TRIPODCAMERA____header_global_8f0bf7c67b81adbb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:753
export const PAPER____header_global_33df0dc3e7490be1 = ((((((4460) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6460c8d904f437977fe2d3d7() {
  return __cxx_static_address_6460c8d904f437977fe2d3d7.reference || (__cxx_static_address_6460c8d904f437977fe2d3d7.reference = {
    __cReference: true,
    get value() { return PAPER____header_global_33df0dc3e7490be1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:754
export const GENERICPOLE2____header_global_5e019a42c611f5c7 = ((((((4465) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9ec8bea0245ae0b511169f48() {
  return __cxx_static_address_9ec8bea0245ae0b511169f48.reference || (__cxx_static_address_9ec8bea0245ae0b511169f48.reference = {
    __cReference: true,
    get value() { return GENERICPOLE2____header_global_5e019a42c611f5c7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:755
export const XXXSTACY____header_global_43c569f705502514 = ((((((4470) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bf72e70e645ee4c8c76b6d1a() {
  return __cxx_static_address_bf72e70e645ee4c8c76b6d1a.reference || (__cxx_static_address_bf72e70e645ee4c8c76b6d1a.reference = {
    __cReference: true,
    get value() { return XXXSTACY____header_global_43c569f705502514; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:756
export const LETTER____header_global_32b6941dd8ae62ab = ((((((4502) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_542efd7d65dc09a723d34365() {
  return __cxx_static_address_542efd7d65dc09a723d34365.reference || (__cxx_static_address_542efd7d65dc09a723d34365.reference = {
    __cReference: true,
    get value() { return LETTER____header_global_32b6941dd8ae62ab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:757
export const SIDEBOLT1____header_global_070d2c420850ebd3 = ((((((4525) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7d9d738d4c98bdc45b8cc066() {
  return __cxx_static_address_7d9d738d4c98bdc45b8cc066.reference || (__cxx_static_address_7d9d738d4c98bdc45b8cc066.reference = {
    __cReference: true,
    get value() { return SIDEBOLT1____header_global_070d2c420850ebd3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:758
export const FOODOBJECT16____header_global_4f3ad7e577cc6b2a = ((((((4545) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ab311c8b77d7cc640670f29e() {
  return __cxx_static_address_ab311c8b77d7cc640670f29e.reference || (__cxx_static_address_ab311c8b77d7cc640670f29e.reference = {
    __cReference: true,
    get value() { return FOODOBJECT16____header_global_4f3ad7e577cc6b2a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:759
export const TAMPON____header_global_0d272de9cc84ec49 = ((((((4557) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_028aa0e227410615bf0c7a47() {
  return __cxx_static_address_028aa0e227410615bf0c7a47.reference || (__cxx_static_address_028aa0e227410615bf0c7a47.reference = {
    __cReference: true,
    get value() { return TAMPON____header_global_0d272de9cc84ec49; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:760
export const CANWITHSOMETHING2____header_global_a9a6ab16873a6866 = ((((((4580) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f1f0506cc32b1a6f41f86b09() {
  return __cxx_static_address_f1f0506cc32b1a6f41f86b09.reference || (__cxx_static_address_f1f0506cc32b1a6f41f86b09.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING2____header_global_a9a6ab16873a6866; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:761
export const CANWITHSOMETHING3____header_global_a3b54fe41df7d8da = ((((((4581) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8ab16b51b9d17af87340bb61() {
  return __cxx_static_address_8ab16b51b9d17af87340bb61.reference || (__cxx_static_address_8ab16b51b9d17af87340bb61.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING3____header_global_a3b54fe41df7d8da; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:762
export const CANWITHSOMETHING4____header_global_4e0311c43971ea9a = ((((((4582) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0db999a97483536e06319203() {
  return __cxx_static_address_0db999a97483536e06319203.reference || (__cxx_static_address_0db999a97483536e06319203.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING4____header_global_4e0311c43971ea9a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:763
export const DOLPHIN1____header_global_8b3ce3ef76128257 = ((((((4591) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_269cdff15bc720fab2c387f2() {
  return __cxx_static_address_269cdff15bc720fab2c387f2.reference || (__cxx_static_address_269cdff15bc720fab2c387f2.reference = {
    __cReference: true,
    get value() { return DOLPHIN1____header_global_8b3ce3ef76128257; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:764
export const DOLPHIN2____header_global_f5c86676bca76507 = ((((((4592) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ae452865e3d9ec7ca7ce3ea2() {
  return __cxx_static_address_ae452865e3d9ec7ca7ce3ea2.reference || (__cxx_static_address_ae452865e3d9ec7ca7ce3ea2.reference = {
    __cReference: true,
    get value() { return DOLPHIN2____header_global_f5c86676bca76507; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:765
export const NEWBEAST____header_global_0f07b9c02b14cf1e = ((((((4610) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_efabede96cd55f5c50c51268() {
  return __cxx_static_address_efabede96cd55f5c50c51268.reference || (__cxx_static_address_efabede96cd55f5c50c51268.reference = {
    __cReference: true,
    get value() { return NEWBEAST____header_global_0f07b9c02b14cf1e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:766
export const NEWBEASTSTAYPUT____header_global_60b57027e4afe3fb = ((((((4611) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5fb859e3c446714051b88199() {
  return __cxx_static_address_5fb859e3c446714051b88199.reference || (__cxx_static_address_5fb859e3c446714051b88199.reference = {
    __cReference: true,
    get value() { return NEWBEASTSTAYPUT____header_global_60b57027e4afe3fb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:767
export const BOSS4____header_global_cb93cc4ebc638202 = ((((((4740) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4e5d7308823cf77da336cef0() {
  return __cxx_static_address_4e5d7308823cf77da336cef0.reference || (__cxx_static_address_4e5d7308823cf77da336cef0.reference = {
    __cReference: true,
    get value() { return BOSS4____header_global_cb93cc4ebc638202; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:768
export const BOSS4STAYPUT____header_global_c278bffd1d1c4612 = ((((((4741) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ce3e73ee2ec82c7a60939afe() {
  return __cxx_static_address_ce3e73ee2ec82c7a60939afe.reference || (__cxx_static_address_ce3e73ee2ec82c7a60939afe.reference = {
    __cReference: true,
    get value() { return BOSS4STAYPUT____header_global_c278bffd1d1c4612; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:769
export const FEM10____header_global_a4015380856a171d = ((((((4864) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f892488c9bf43083a2a6a1f8() {
  return __cxx_static_address_f892488c9bf43083a2a6a1f8.reference || (__cxx_static_address_f892488c9bf43083a2a6a1f8.reference = {
    __cReference: true,
    get value() { return FEM10____header_global_a4015380856a171d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:770
export const TOUGHGAL____header_global_25607c4ca4fd3251 = ((((((4866) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8444b4d79682f08ab0023d1b() {
  return __cxx_static_address_8444b4d79682f08ab0023d1b.reference || (__cxx_static_address_8444b4d79682f08ab0023d1b.reference = {
    __cReference: true,
    get value() { return TOUGHGAL____header_global_25607c4ca4fd3251; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:771
export const MAN____header_global_ad035fc700b4bc0b = ((((((4871) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6f28d9895c1189357c9d144d() {
  return __cxx_static_address_6f28d9895c1189357c9d144d.reference || (__cxx_static_address_6f28d9895c1189357c9d144d.reference = {
    __cReference: true,
    get value() { return MAN____header_global_ad035fc700b4bc0b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:772
export const MAN2____header_global_fd133e6e791a02a8 = ((((((4872) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a682feb0339af920107767b9() {
  return __cxx_static_address_a682feb0339af920107767b9.reference || (__cxx_static_address_a682feb0339af920107767b9.reference = {
    __cReference: true,
    get value() { return MAN2____header_global_fd133e6e791a02a8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:773
export const WOMAN____header_global_6ccdfc848f2376f3 = ((((((4874) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b01b1fd41cc63826106308ec() {
  return __cxx_static_address_b01b1fd41cc63826106308ec.reference || (__cxx_static_address_b01b1fd41cc63826106308ec.reference = {
    __cReference: true,
    get value() { return WOMAN____header_global_6ccdfc848f2376f3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:774
export const NATURALLIGHTNING____header_global_90f3e336e02bc37c = ((((((4890) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5c544f0bee8153c20c89b6fe() {
  return __cxx_static_address_5c544f0bee8153c20c89b6fe.reference || (__cxx_static_address_5c544f0bee8153c20c89b6fe.reference = {
    __cReference: true,
    get value() { return NATURALLIGHTNING____header_global_90f3e336e02bc37c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:775
export const WEATHERWARN____header_global_6f45d14b05947af9 = ((((((4893) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7d974c17c31af9d0209b45cc() {
  return __cxx_static_address_7d974c17c31af9d0209b45cc.reference || (__cxx_static_address_7d974c17c31af9d0209b45cc.reference = {
    __cReference: true,
    get value() { return WEATHERWARN____header_global_6f45d14b05947af9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:776
export const DUKETAG____header_global_5608eb95278dfc73 = ((((((4900) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3364e241eb9b745647d7df55() {
  return __cxx_static_address_3364e241eb9b745647d7df55.reference || (__cxx_static_address_3364e241eb9b745647d7df55.reference = {
    __cReference: true,
    get value() { return DUKETAG____header_global_5608eb95278dfc73; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:777
export const SIGN1____header_global_e395f85f75cb0d7b = ((((((4909) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_17c43ee10a6fdf323f4dc960() {
  return __cxx_static_address_17c43ee10a6fdf323f4dc960.reference || (__cxx_static_address_17c43ee10a6fdf323f4dc960.reference = {
    __cReference: true,
    get value() { return SIGN1____header_global_e395f85f75cb0d7b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:778
export const SIGN2____header_global_5f74aa01cab88fde = ((((((4912) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_30dae81a38b38ff4e0fa105c() {
  return __cxx_static_address_30dae81a38b38ff4e0fa105c.reference || (__cxx_static_address_30dae81a38b38ff4e0fa105c.reference = {
    __cReference: true,
    get value() { return SIGN2____header_global_5f74aa01cab88fde; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:779
export const JURYGUY____header_global_eb879fbec451d967 = ((((((4943) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d444d901fbe6bfee44c02fce() {
  return __cxx_static_address_d444d901fbe6bfee44c02fce.reference || (__cxx_static_address_d444d901fbe6bfee44c02fce.reference = {
    __cReference: true,
    get value() { return JURYGUY____header_global_eb879fbec451d967; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:780
export const WIDESCREENSTATUSBAR____header_global_3f545b2284433072 = ((((((5120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ed1e4dc60f89d266b5d7513f() {
  return __cxx_static_address_ed1e4dc60f89d266b5d7513f.reference || (__cxx_static_address_ed1e4dc60f89d266b5d7513f.reference = {
    __cReference: true,
    get value() { return WIDESCREENSTATUSBAR____header_global_3f545b2284433072; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:781
export const RPGGUNWIDE____header_global_f5b025eaaf137db6 = ((((((5121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_21223a01288d72c71555b746() {
  return __cxx_static_address_21223a01288d72c71555b746.reference || (__cxx_static_address_21223a01288d72c71555b746.reference = {
    __cReference: true,
    get value() { return RPGGUNWIDE____header_global_f5b025eaaf137db6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:782
export const FIRSTGUNRELOADWIDE____header_global_d51c609c651316b8 = ((((((5122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5c3878631236c1ee0e452b03() {
  return __cxx_static_address_5c3878631236c1ee0e452b03.reference || (__cxx_static_address_5c3878631236c1ee0e452b03.reference = {
    __cReference: true,
    get value() { return FIRSTGUNRELOADWIDE____header_global_d51c609c651316b8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:783
export const FREEZEWIDE____header_global_3b3d67787f19385e = ((((((5123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b55374e8367480949e471854() {
  return __cxx_static_address_b55374e8367480949e471854.reference || (__cxx_static_address_b55374e8367480949e471854.reference = {
    __cReference: true,
    get value() { return FREEZEWIDE____header_global_3b3d67787f19385e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:784
export const FREEZEFIREWIDE____header_global_f601b80bc38b1c26 = ((((((5124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_91c790e988053b7ded200450() {
  return __cxx_static_address_91c790e988053b7ded200450.reference || (__cxx_static_address_91c790e988053b7ded200450.reference = {
    __cReference: true,
    get value() { return FREEZEFIREWIDE____header_global_f601b80bc38b1c26; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:785
export const SHRINKERWIDE____header_global_0361b0c7e4616cc5 = ((((((5127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e9b8af436b19deeacf6f2e09() {
  return __cxx_static_address_e9b8af436b19deeacf6f2e09.reference || (__cxx_static_address_e9b8af436b19deeacf6f2e09.reference = {
    __cReference: true,
    get value() { return SHRINKERWIDE____header_global_0361b0c7e4616cc5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:786
export const CRACKKNUCKLESWIDE____header_global_6b314a6ef9a6a574 = ((((((5129) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bffc64026549ffe61efbe6c8() {
  return __cxx_static_address_bffc64026549ffe61efbe6c8.reference || (__cxx_static_address_bffc64026549ffe61efbe6c8.reference = {
    __cReference: true,
    get value() { return CRACKKNUCKLESWIDE____header_global_6b314a6ef9a6a574; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:787
export const FLAMETHROWERSPRITE____header_global_3fce46f668938155 = ((((((5134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_574b2e94b2d09473209d4f3a() {
  return __cxx_static_address_574b2e94b2d09473209d4f3a.reference || (__cxx_static_address_574b2e94b2d09473209d4f3a.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERSPRITE____header_global_3fce46f668938155; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:788
export const FLAMETHROWERAMMO____header_global_c5651ffa5c92c37b = ((((((5135) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0848d7b07f470218985133cb() {
  return __cxx_static_address_0848d7b07f470218985133cb.reference || (__cxx_static_address_0848d7b07f470218985133cb.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERAMMO____header_global_c5651ffa5c92c37b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:789
export const FLAMETHROWER____header_global_5ed393e5e4644e30 = ((((((5138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aaf5755c877bf2f2ebd42dc8() {
  return __cxx_static_address_aaf5755c877bf2f2ebd42dc8.reference || (__cxx_static_address_aaf5755c877bf2f2ebd42dc8.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER____header_global_5ed393e5e4644e30; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:790
export const FLAMETHROWERFIRE____header_global_6144c9645ec6e590 = ((((((5139) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_07d6d244b0be7993af993c03() {
  return __cxx_static_address_07d6d244b0be7993af993c03.reference || (__cxx_static_address_07d6d244b0be7993af993c03.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERFIRE____header_global_6144c9645ec6e590; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:791
export const FLAMETHROWERFLAME____header_global_090917c61143bfaf = ((((((1891) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_187f95e587bb27de430a20cf() {
  return __cxx_static_address_187f95e587bb27de430a20cf.reference || (__cxx_static_address_187f95e587bb27de430a20cf.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERFLAME____header_global_090917c61143bfaf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:792
export const FLAMETHROWERPILOT____header_global_a30c89ea0d4b6bf6 = ((((((5174) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_219f0d3c81655c1067eea1e2() {
  return __cxx_static_address_219f0d3c81655c1067eea1e2.reference || (__cxx_static_address_219f0d3c81655c1067eea1e2.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERPILOT____header_global_a30c89ea0d4b6bf6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:793
export const FIREBALL____header_global_fba0da9f46a67082 = ((((((5163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6e5f3046ca12ec565744a8e3() {
  return __cxx_static_address_6e5f3046ca12ec565744a8e3.reference || (__cxx_static_address_6e5f3046ca12ec565744a8e3.reference = {
    __cReference: true,
    get value() { return FIREBALL____header_global_fba0da9f46a67082; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:794
export const ONFIRE____header_global_e21e2b881297c489 = ((((((5152) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d36eb42a169db48e31b7da6d() {
  return __cxx_static_address_d36eb42a169db48e31b7da6d.reference || (__cxx_static_address_d36eb42a169db48e31b7da6d.reference = {
    __cReference: true,
    get value() { return ONFIRE____header_global_e21e2b881297c489; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:795
export const ONFIRESMOKE____header_global_05b9caacc9817de2 = ((((((5143) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f14a572115b9257acb412576() {
  return __cxx_static_address_f14a572115b9257acb412576.reference || (__cxx_static_address_f14a572115b9257acb412576.reference = {
    __cReference: true,
    get value() { return ONFIRESMOKE____header_global_05b9caacc9817de2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:796
export const BURNEDCORPSE____header_global_abc57b1d77848003 = ((((((5173) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5dac2b3cdc8386996f6d1991() {
  return __cxx_static_address_5dac2b3cdc8386996f6d1991.reference || (__cxx_static_address_5dac2b3cdc8386996f6d1991.reference = {
    __cReference: true,
    get value() { return BURNEDCORPSE____header_global_abc57b1d77848003; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:797
export const WHISPYSMOKE____header_global_a107e6a916ba4de0 = ((((((5268) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_60d6efc5920029177155e0b0() {
  return __cxx_static_address_60d6efc5920029177155e0b0.reference || (__cxx_static_address_60d6efc5920029177155e0b0.reference = {
    __cReference: true,
    get value() { return WHISPYSMOKE____header_global_a107e6a916ba4de0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:798
export const FIREFLY____header_global_365f10e4b18d622c = ((((((5180) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b61892bbd4e167dd90d4a0f0() {
  return __cxx_static_address_b61892bbd4e167dd90d4a0f0.reference || (__cxx_static_address_b61892bbd4e167dd90d4a0f0.reference = {
    __cReference: true,
    get value() { return FIREFLY____header_global_365f10e4b18d622c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:799
export const FIREFLYSHRINKEFFECT____header_global_6c48815470a959de = ((((((5360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9bd6650018838ebe3c9e0478() {
  return __cxx_static_address_9bd6650018838ebe3c9e0478.reference || (__cxx_static_address_9bd6650018838ebe3c9e0478.reference = {
    __cReference: true,
    get value() { return FIREFLYSHRINKEFFECT____header_global_6c48815470a959de; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:800
export const FIREFLYGROWEFFECT____header_global_677074a346518902 = ((((((5367) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_398d3b80bfed2f4dd853e7b6() {
  return __cxx_static_address_398d3b80bfed2f4dd853e7b6.reference || (__cxx_static_address_398d3b80bfed2f4dd853e7b6.reference = {
    __cReference: true,
    get value() { return FIREFLYGROWEFFECT____header_global_677074a346518902; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:801
export const FIREFLYFLYINGEFFECT____header_global_c50b7f6fdea62744 = ((((((5296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a1878f20a494c1a693290d92() {
  return __cxx_static_address_a1878f20a494c1a693290d92.reference || (__cxx_static_address_a1878f20a494c1a693290d92.reference = {
    __cReference: true,
    get value() { return FIREFLYFLYINGEFFECT____header_global_c50b7f6fdea62744; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:802
export const BOSS5____header_global_c929edc76cabfc20 = ((((((5310) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3c7f01eb2f99e1a02ebfc6af() {
  return __cxx_static_address_3c7f01eb2f99e1a02ebfc6af.reference || (__cxx_static_address_3c7f01eb2f99e1a02ebfc6af.reference = {
    __cReference: true,
    get value() { return BOSS5____header_global_c929edc76cabfc20; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:803
export const BOSS5STAYPUT____header_global_807f6d9b053447eb = ((((((5311) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bb942665af0f178aee69729c() {
  return __cxx_static_address_bb942665af0f178aee69729c.reference || (__cxx_static_address_bb942665af0f178aee69729c.reference = {
    __cReference: true,
    get value() { return BOSS5STAYPUT____header_global_807f6d9b053447eb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:804
export const LAVAPOOL____header_global_f9e7d881e9f6c901 = ((((((5304) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_565c813ec8d1d71829ef1449() {
  return __cxx_static_address_565c813ec8d1d71829ef1449.reference || (__cxx_static_address_565c813ec8d1d71829ef1449.reference = {
    __cReference: true,
    get value() { return LAVAPOOL____header_global_f9e7d881e9f6c901; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:805
export const LAVASPLASH____header_global_52927a789c5df448 = ((((((5371) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c37f14ca9abf1ca5edc586ce() {
  return __cxx_static_address_c37f14ca9abf1ca5edc586ce.reference || (__cxx_static_address_c37f14ca9abf1ca5edc586ce.reference = {
    __cReference: true,
    get value() { return LAVASPLASH____header_global_52927a789c5df448; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:806
export const LAVAPOOLBUBBLE____header_global_aee3b2dfd4408628 = ((((((5207) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_92909f45c18853b045068985() {
  return __cxx_static_address_92909f45c18853b045068985.reference || (__cxx_static_address_92909f45c18853b045068985.reference = {
    __cReference: true,
    get value() { return LAVAPOOLBUBBLE____header_global_aee3b2dfd4408628; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:807
export const BOSS2STAYPUT____header_global_267659eafb1009ba = ((((((2711) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0d1f735568b01397cfc528c7() {
  return __cxx_static_address_0d1f735568b01397cfc528c7.reference || (__cxx_static_address_0d1f735568b01397cfc528c7.reference = {
    __cReference: true,
    get value() { return BOSS2STAYPUT____header_global_267659eafb1009ba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:808
export const BOSS3STAYPUT____header_global_d22751cc01d5db34 = ((((((2761) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ed1ef8b2a14efe79409bcd93() {
  return __cxx_static_address_ed1ef8b2a14efe79409bcd93.reference || (__cxx_static_address_ed1ef8b2a14efe79409bcd93.reference = {
    __cReference: true,
    get value() { return BOSS3STAYPUT____header_global_d22751cc01d5db34; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:809
export const E32_TILE5736____header_global_01a6e32c859e216a = ((((((5736) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4ed231b90130bc4e23e8c81c() {
  return __cxx_static_address_4ed231b90130bc4e23e8c81c.reference || (__cxx_static_address_4ed231b90130bc4e23e8c81c.reference = {
    __cReference: true,
    get value() { return E32_TILE5736____header_global_01a6e32c859e216a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:810
export const E32_TILE5737____header_global_f53904a886122e6a = ((((((5737) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_609f939003951848918fb863() {
  return __cxx_static_address_609f939003951848918fb863.reference || (__cxx_static_address_609f939003951848918fb863.reference = {
    __cReference: true,
    get value() { return E32_TILE5737____header_global_f53904a886122e6a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:811
export const E32_TILE5846____header_global_20dcb71276587af6 = ((((((5846) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1fd9787021f9360b0b8f49e5() {
  return __cxx_static_address_1fd9787021f9360b0b8f49e5.reference || (__cxx_static_address_1fd9787021f9360b0b8f49e5.reference = {
    __cReference: true,
    get value() { return E32_TILE5846____header_global_20dcb71276587af6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/network.h:180
export const cSnapshotMemUsage__header_global_363690280e99ee8c = u64((BigInt(u64(64)) * BigInt((BigInt((BigInt((BigInt(72) * BigInt(u64(16384)))) + BigInt((BigInt(96) * BigInt(u64(4096)))))) + BigInt((BigInt(296) * BigInt(u64(16384))))))));
function __cxx_static_address_19c65c07ec0f2f3d07537bbc() {
  return __cxx_static_address_19c65c07ec0f2f3d07537bbc.reference || (__cxx_static_address_19c65c07ec0f2f3d07537bbc.reference = {
    __cReference: true,
    get value() { return cSnapshotMemUsage__header_global_363690280e99ee8c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/sector.cpp:30
export let g_haltSoundHack = i32(0);
function __cxx_static_address_a755379f82656099b91abe38() {
  return __cxx_static_address_a755379f82656099b91abe38.reference || (__cxx_static_address_a755379f82656099b91abe38.reference = {
    __cReference: true,
    get value() { return g_haltSoundHack; },
    set value(__cxx_lvalue_0) { g_haltSoundHack = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_45f2bccdaa44f5f7 = i32(2147483647);
function __cxx_static_address_efcae7f01646f2e49ca62daa() {
  return __cxx_static_address_efcae7f01646f2e49ca62daa.reference || (__cxx_static_address_efcae7f01646f2e49ca62daa.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_45f2bccdaa44f5f7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_2a6f12e3d6377232 = i32(2147483648);
function __cxx_static_address_e0fac40c50b335e68ba77a45() {
  return __cxx_static_address_e0fac40c50b335e68ba77a45.reference || (__cxx_static_address_e0fac40c50b335e68ba77a45.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_2a6f12e3d6377232; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_d78f9e06b774e062 = i32(2147483648);
function __cxx_static_address_e12a4eb997f1fc7c00cfbfd5() {
  return __cxx_static_address_e12a4eb997f1fc7c00cfbfd5.reference || (__cxx_static_address_e12a4eb997f1fc7c00cfbfd5.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_d78f9e06b774e062; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_d2163481bd24d13c = i32(65536);
function __cxx_static_address_af4e77c0f4b300d8c20d88e1() {
  return __cxx_static_address_af4e77c0f4b300d8c20d88e1.reference || (__cxx_static_address_af4e77c0f4b300d8c20d88e1.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_d2163481bd24d13c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_51e00d4c374317d9 = i32(32768);
function __cxx_static_address_d2b8b37897de5ac0a5a09cca() {
  return __cxx_static_address_d2b8b37897de5ac0a5a09cca.reference || (__cxx_static_address_d2b8b37897de5ac0a5a09cca.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_51e00d4c374317d9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_e511c9213895eebe = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_6847b9f1c61548ad77bdf07f() {
  return __cxx_static_address_6847b9f1c61548ad77bdf07f.reference || (__cxx_static_address_6847b9f1c61548ad77bdf07f.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_e511c9213895eebe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/sector.cpp:183
export function isanunderoperator(lotag) {
  switch (i32((lotag & 255))) {
    case i32(15):
    case i32(16):
    case i32(17):
    case i32(18):
    case i32(19):
    case i32(22):
    case i32(26): {
      return i32(1);
    }
  }
  return i32(0);
}

// C/C++ source: source/duke3d/src/sector.cpp:199
export function isanearoperator(lotag) {
  switch (i32((lotag & 255))) {
    case i32(9):
    case i32(15):
    case i32(16):
    case i32(17):
    case i32(18):
    case i32(19):
    case i32(20):
    case i32(21):
    case i32(22):
    case i32(23):
    case i32(25):
    case i32(26):
    case i32(29): {
      return i32(1);
    }
  }
  return i32(0);
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_ddd809fa720cda74 = new Uint8Array([((1) & 255), ((2) & 255), ((4) & 255), ((8) & 255), ((16) & 255), ((32) & 255), ((64) & 255), ((128) & 255)]);
function __cxx_static_address_88f1c0a787391c6f3a4ae54a() {
  return __cxx_static_address_88f1c0a787391c6f3a4ae54a.reference || (__cxx_static_address_88f1c0a787391c6f3a4ae54a.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_ddd809fa720cda74; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:172
export const g_defaultVideoModes__header_global_8ebf2fcc97528f5b = cByteRecordNDArray({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, [25], {}, [cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 2560, "y": 1440}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 2560, "y": 1200}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 2560, "y": 1080}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1920, "y": 1440}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1920, "y": 1200}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1920, "y": 1080}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1680, "y": 1050}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1600, "y": 1200}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1600, "y": 900}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1366, "y": 768}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1280, "y": 1024}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1280, "y": 960}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1280, "y": 720}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1152, "y": 864}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1024, "y": 768}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1024, "y": 600}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 800, "y": 600}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 640, "y": 480}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 640, "y": 400}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 512, "y": 384}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 480, "y": 360}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 400, "y": 300}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 320, "y": 240}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 320, "y": 200}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 0, "y": 0}, null, {})]);
function __cxx_static_address_daaf7ed27b185579e4ab9915() {
  return __cxx_static_address_daaf7ed27b185579e4ab9915.reference || (__cxx_static_address_daaf7ed27b185579e4ab9915.reference = {
    __cReference: true,
    get value() { return g_defaultVideoModes__header_global_8ebf2fcc97528f5b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:188
export const g_keyAsciiTable__header_global_7946ef62aa08a6fc = new Uint8Array([((0) & 255), ((0) & 255), 49, 50, 51, 52, 53, 54, 55, 56, 57, 48, 45, 61, ((0) & 255), ((0) & 255), 113, 119, 101, 114, 116, 121, 117, 105, 111, 112, 91, 93, ((0) & 255), ((0) & 255), 97, 115, 100, 102, 103, 104, 106, 107, 108, 59, ((39) & 255), 96, ((0) & 255), ((92) & 255), 122, 120, 99, 118, 98, 110, 109, 44, 46, 47, ((0) & 255), 42, ((0) & 255), ((32) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255)]);
function __cxx_static_address_55efe239672f41908a731056() {
  return __cxx_static_address_55efe239672f41908a731056.reference || (__cxx_static_address_55efe239672f41908a731056.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTable__header_global_7946ef62aa08a6fc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:196
export const g_keyAsciiTableShift__header_global_4455bfc80e200eef = new Uint8Array([((0) & 255), ((0) & 255), 33, 64, 35, 36, 37, 94, 38, 42, 40, 41, 95, 43, ((0) & 255), ((0) & 255), 81, 87, 69, 82, 84, 89, 85, 73, 79, 80, 123, 125, ((0) & 255), ((0) & 255), 65, 83, 68, 70, 71, 72, 74, 75, 76, 58, 34, 126, ((0) & 255), 124, 90, 88, 67, 86, 66, 78, 77, 60, 62, 63, ((0) & 255), 42, ((0) & 255), ((32) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255)]);
function __cxx_static_address_07cb7d570dfbe076376dbcd9() {
  return __cxx_static_address_07cb7d570dfbe076376dbcd9.reference || (__cxx_static_address_07cb7d570dfbe076376dbcd9.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTableShift__header_global_4455bfc80e200eef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:895
export const pow2long__header_global_e36e227376e57354 = new Int32Array([1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576, 2097152, 4194304, 8388608, 16777216, 33554432, 67108864, 134217728, 268435456, 536870912, 1073741824, 2147483647]);
function __cxx_static_address_fb725259965b1bbb8f69a564() {
  return __cxx_static_address_fb725259965b1bbb8f69a564.reference || (__cxx_static_address_fb725259965b1bbb8f69a564.reference = {
    __cReference: true,
    get value() { return pow2long__header_global_e36e227376e57354; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:907
export const pow2ulong__header_global_839da6b9186cd4ba = new Uint32Array([u32(1), u32(2), u32(4), u32(8), u32(16), u32(32), u32(64), u32(128), u32(256), u32(512), u32(1024), u32(2048), u32(4096), u32(8192), u32(16384), u32(32768), u32(65536), u32(131072), u32(262144), u32(524288), u32(1048576), u32(2097152), u32(4194304), u32(8388608), u32(16777216), u32(33554432), u32(67108864), u32(134217728), u32(268435456), u32(536870912), u32(1073741824), u32(2147483648n)]);
function __cxx_static_address_9029301ea99ce230b91a3b0f() {
  return __cxx_static_address_9029301ea99ce230b91a3b0f.reference || (__cxx_static_address_9029301ea99ce230b91a3b0f.reference = {
    __cReference: true,
    get value() { return pow2ulong__header_global_839da6b9186cd4ba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:919
export const pow264__header_global_b944821b6a09238d = new BigInt64Array([BigInt(i64(1)), BigInt(i64(2)), BigInt(i64(4)), BigInt(i64(8)), BigInt(i64(16)), BigInt(i64(32)), BigInt(i64(64)), BigInt(i64(128)), BigInt(i64(256)), BigInt(i64(512)), BigInt(i64(1024)), BigInt(i64(2048)), BigInt(i64(4096)), BigInt(i64(8192)), BigInt(i64(16384)), BigInt(i64(32768)), BigInt(i64(65536)), BigInt(i64(131072)), BigInt(i64(262144)), BigInt(i64(524288)), BigInt(i64(1048576)), BigInt(i64(2097152)), BigInt(i64(4194304)), BigInt(i64(8388608)), BigInt(i64(16777216)), BigInt(i64(33554432)), BigInt(i64(67108864)), BigInt(i64(134217728)), BigInt(i64(268435456)), BigInt(i64(536870912)), BigInt(i64(1073741824)), BigInt(2147483648n), BigInt(4294967296n), BigInt(8589934592n), BigInt(17179869184n), BigInt(34359738368n), BigInt(68719476736n), BigInt(137438953472n), BigInt(274877906944n), BigInt(549755813888n), BigInt(1099511627776n), BigInt(2199023255552n), BigInt(4398046511104n), BigInt(8796093022208n), BigInt(17592186044416n), BigInt(35184372088832n), BigInt(70368744177664n), BigInt(140737488355328n), BigInt(281474976710656n), BigInt(562949953421312n), BigInt(1125899906842624n), BigInt(2251799813685248n), BigInt(4503599627370496n), BigInt(9007199254740992n), BigInt(18014398509481984n), BigInt(36028797018963968n), BigInt(72057594037927936n), BigInt(144115188075855872n), BigInt(288230376151711744n), BigInt(576460752303423488n), BigInt(1152921504606846976n), BigInt(2305843009213693952n), BigInt(4611686018427387904n), BigInt(9223372036854775807n)]);
function __cxx_static_address_5081cc3f3e839956e7e22697() {
  return __cxx_static_address_5081cc3f3e839956e7e22697.reference || (__cxx_static_address_5081cc3f3e839956e7e22697.reference = {
    __cReference: true,
    get value() { return pow264__header_global_b944821b6a09238d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/mact/include/keyboard.h:47
export const sctokeylut__header_global_78604515e426d980 = cByteRecordNDArray({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, [102], {}, [cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([69, 115, 99, 97, 112, 101, 0]), "sc": ((1) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([49, 0]), "sc": ((2) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([50, 0]), "sc": ((3) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([51, 0]), "sc": ((4) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([52, 0]), "sc": ((5) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([53, 0]), "sc": ((6) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([54, 0]), "sc": ((7) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([55, 0]), "sc": ((8) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([56, 0]), "sc": ((9) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([57, 0]), "sc": ((10) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([48, 0]), "sc": ((11) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([45, 0]), "sc": ((12) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([61, 0]), "sc": ((13) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([66, 97, 107, 83, 112, 99, 0]), "sc": ((14) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([84, 97, 98, 0]), "sc": ((15) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([81, 0]), "sc": ((16) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([87, 0]), "sc": ((17) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([69, 0]), "sc": ((18) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([82, 0]), "sc": ((19) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([84, 0]), "sc": ((20) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([89, 0]), "sc": ((21) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([85, 0]), "sc": ((22) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([73, 0]), "sc": ((23) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([79, 0]), "sc": ((24) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([80, 0]), "sc": ((25) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([91, 0]), "sc": ((26) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([93, 0]), "sc": ((27) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([69, 110, 116, 101, 114, 0]), "sc": ((28) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([76, 67, 116, 114, 108, 0]), "sc": ((29) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([65, 0]), "sc": ((30) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([83, 0]), "sc": ((31) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([68, 0]), "sc": ((32) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 0]), "sc": ((33) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([71, 0]), "sc": ((34) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([72, 0]), "sc": ((35) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([74, 0]), "sc": ((36) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 0]), "sc": ((37) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([76, 0]), "sc": ((38) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([59, 0]), "sc": ((39) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([39, 0]), "sc": ((40) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([96, 0]), "sc": ((41) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([76, 83, 104, 105, 102, 116, 0]), "sc": ((42) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([66, 97, 99, 107, 115, 108, 97, 115, 104, 0]), "sc": ((43) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([90, 0]), "sc": ((44) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([88, 0]), "sc": ((45) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([67, 0]), "sc": ((46) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([86, 0]), "sc": ((47) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([66, 0]), "sc": ((48) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([78, 0]), "sc": ((49) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([77, 0]), "sc": ((50) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([44, 0]), "sc": ((51) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([46, 0]), "sc": ((52) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([47, 0]), "sc": ((53) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([82, 83, 104, 105, 102, 116, 0]), "sc": ((54) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 42, 0]), "sc": ((55) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([76, 65, 108, 116, 0]), "sc": ((56) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([83, 112, 97, 99, 101, 0]), "sc": ((57) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([67, 97, 112, 76, 99, 107, 0]), "sc": ((58) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 49, 0]), "sc": ((59) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 50, 0]), "sc": ((60) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 51, 0]), "sc": ((61) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 52, 0]), "sc": ((62) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 53, 0]), "sc": ((63) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 54, 0]), "sc": ((64) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 55, 0]), "sc": ((65) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 56, 0]), "sc": ((66) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 57, 0]), "sc": ((67) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 49, 48, 0]), "sc": ((68) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([78, 117, 109, 76, 99, 107, 0]), "sc": ((69) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([83, 99, 114, 76, 99, 107, 0]), "sc": ((70) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 55, 0]), "sc": ((71) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 56, 0]), "sc": ((72) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 57, 0]), "sc": ((73) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 45, 0]), "sc": ((74) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 52, 0]), "sc": ((75) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 53, 0]), "sc": ((76) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 54, 0]), "sc": ((77) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 43, 0]), "sc": ((78) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 49, 0]), "sc": ((79) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 50, 0]), "sc": ((80) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 51, 0]), "sc": ((81) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 48, 0]), "sc": ((82) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 46, 0]), "sc": ((83) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([76, 101, 115, 115, 84, 104, 97, 110, 0]), "sc": ((86) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 49, 49, 0]), "sc": ((87) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 49, 50, 0]), "sc": ((88) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 100, 69, 110, 116, 0]), "sc": ((156) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([82, 67, 116, 114, 108, 0]), "sc": ((157) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 47, 0]), "sc": ((181) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([82, 65, 108, 116, 0]), "sc": ((184) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([80, 114, 116, 83, 99, 110, 0]), "sc": ((183) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([80, 97, 117, 115, 101, 0]), "sc": ((197) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([72, 111, 109, 101, 0]), "sc": ((199) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([85, 112, 0]), "sc": ((200) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([80, 103, 85, 112, 0]), "sc": ((201) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([76, 101, 102, 116, 0]), "sc": ((203) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([82, 105, 103, 104, 116, 0]), "sc": ((205) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([69, 110, 100, 0]), "sc": ((207) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([68, 111, 119, 110, 0]), "sc": ((208) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([80, 103, 68, 110, 0]), "sc": ((209) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([73, 110, 115, 101, 114, 116, 0]), "sc": ((210) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([68, 101, 108, 101, 116, 101, 0]), "sc": ((211) & 255)}, null, {})]);
function __cxx_static_address_dd64aa1a17aef1bf68131989() {
  return __cxx_static_address_dd64aa1a17aef1bf68131989.reference || (__cxx_static_address_dd64aa1a17aef1bf68131989.reference = {
    __cReference: true,
    get value() { return sctokeylut__header_global_78604515e426d980; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/sector.cpp:611
let __static_G_GetViewscreenSizeShift__header_0e6ffcf8c051_mask = i32((i32((1 << 2)) - 1));
export function G_GetViewscreenSizeShift__header_0e6ffcf8c051(spr) {

  let rem = i32((i32((i32(cRecordObject(spr).xrepeat) & __static_G_GetViewscreenSizeShift__header_0e6ffcf8c051_mask)) | i32((i32(cRecordObject(spr).yrepeat) & __static_G_GetViewscreenSizeShift__header_0e6ffcf8c051_mask))));
  for (let i = i32(0); (i < 2); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
    if (Boolean(i32((rem & i32((1 << i)))))) {
      return i32(i);
    }
  }
  return i32(2);
}

// C/C++ source: source/duke3d/src/sector.cpp:42
export function fix16_to_int__header_73d5e0198bbe(a) {
  return i32(Math.trunc(i32((a + ((a >= 0) ? fix16_half__header_global_51e00d4c374317d9 : (-fix16_half__header_global_51e00d4c374317d9)))) / fix16_one__header_global_d2163481bd24d13c));
}

export function ARRAY_SIZE__header_4a75ebea0cc4(arg0) {
  return u64(8n);
}

// C/C++ source: source/duke3d/src/sector.cpp:382
export function P_PalFrom__header_62c3e93549a3(pPlayer, f, r, g, b) {
  (cRecordObject(pPlayer).pals.f = ((((f) & 255)) & 255));
  (cRecordObject(pPlayer).pals.r = ((((r) & 255)) & 255));
  (cRecordObject(pPlayer).pals.g = ((((g) & 255)) & 255));
  (cRecordObject(pPlayer).pals.b = ((((b) & 255)) & 255));
}

// C/C++ source: source/duke3d/src/sector.cpp:46
export function fix16_from_int__header_778bfc1e6307(a) {
  return i32(Math.imul(a, fix16_one__header_global_d2163481bd24d13c));
}

// C/C++ source: source/duke3d/src/sector.cpp:422
export function P_GetP__header_6d9dfc7d6421(pSprite) {
  let playerNum = i32(cRecordObject(cRecordPointer(pSprite, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {})).__cxx_anonymous_15.__cxx_anonymous_0.yvel);
  if ((u32(playerNum) >= u32(16))) {
    (playerNum = i32(0));
  }
  return i32(playerNum);
}
