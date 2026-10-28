// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/duke3d/src/actors.cpp
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
export const fix16_rad_to_deg_mult__header_global_717eaaf5cc7b9e8a = i32(3754936);
function __cxx_static_address_34b989f9ee6d7a79af31ef01() {
  return __cxx_static_address_34b989f9ee6d7a79af31ef01.reference || (__cxx_static_address_34b989f9ee6d7a79af31ef01.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_717eaaf5cc7b9e8a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_6bd0d052953ce778 = i32(1144);
function __cxx_static_address_e787aff1dcd06753c2a45da3() {
  return __cxx_static_address_e787aff1dcd06753c2a45da3.reference || (__cxx_static_address_e787aff1dcd06753c2a45da3.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_6bd0d052953ce778; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:43
export const KICK_HIT____header_global_3427f35791f3cf68 = ((((((0) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_188e610bdd1afac18e2071bf() {
  return __cxx_static_address_188e610bdd1afac18e2071bf.reference || (__cxx_static_address_188e610bdd1afac18e2071bf.reference = {
    __cReference: true,
    get value() { return KICK_HIT____header_global_3427f35791f3cf68; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:44
export const PISTOL_RICOCHET____header_global_99e079c38c1f86c5 = ((((((1) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8cfe27fe37f148251b97ee21() {
  return __cxx_static_address_8cfe27fe37f148251b97ee21.reference || (__cxx_static_address_8cfe27fe37f148251b97ee21.reference = {
    __cReference: true,
    get value() { return PISTOL_RICOCHET____header_global_99e079c38c1f86c5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:45
export const PISTOL_BODYHIT____header_global_b621052e209f89e2 = ((((((2) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c21b23348f659dc9929eff50() {
  return __cxx_static_address_c21b23348f659dc9929eff50.reference || (__cxx_static_address_c21b23348f659dc9929eff50.reference = {
    __cReference: true,
    get value() { return PISTOL_BODYHIT____header_global_b621052e209f89e2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:46
export const PISTOL_FIRE____header_global_d34638e705d5bec3 = ((((((3) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4228919fae1e4f91af614002() {
  return __cxx_static_address_4228919fae1e4f91af614002.reference || (__cxx_static_address_4228919fae1e4f91af614002.reference = {
    __cReference: true,
    get value() { return PISTOL_FIRE____header_global_d34638e705d5bec3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:47
export const EJECT_CLIP____header_global_39d64f25e8c704b6 = ((((((4) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3d42afdaa130c725cf35ed93() {
  return __cxx_static_address_3d42afdaa130c725cf35ed93.reference || (__cxx_static_address_3d42afdaa130c725cf35ed93.reference = {
    __cReference: true,
    get value() { return EJECT_CLIP____header_global_39d64f25e8c704b6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:48
export const INSERT_CLIP____header_global_69f7a3c4a4dee193 = ((((((5) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2816c67f520976d85caaea75() {
  return __cxx_static_address_2816c67f520976d85caaea75.reference || (__cxx_static_address_2816c67f520976d85caaea75.reference = {
    __cReference: true,
    get value() { return INSERT_CLIP____header_global_69f7a3c4a4dee193; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:49
export const CHAINGUN_FIRE____header_global_cdde9bb6cf6b9d04 = ((((((6) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a6b6de9cd41e29453e78874c() {
  return __cxx_static_address_a6b6de9cd41e29453e78874c.reference || (__cxx_static_address_a6b6de9cd41e29453e78874c.reference = {
    __cReference: true,
    get value() { return CHAINGUN_FIRE____header_global_cdde9bb6cf6b9d04; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:50
export const RPG_SHOOT____header_global_581ab5f8723f1ab9 = ((((((7) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f5ee6efdf73c8d1e3c3bb010() {
  return __cxx_static_address_f5ee6efdf73c8d1e3c3bb010.reference || (__cxx_static_address_f5ee6efdf73c8d1e3c3bb010.reference = {
    __cReference: true,
    get value() { return RPG_SHOOT____header_global_581ab5f8723f1ab9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:51
export const POOLBALLHIT____header_global_4680e82343b48159 = ((((((8) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_813d93a3f71ebc84c4963b08() {
  return __cxx_static_address_813d93a3f71ebc84c4963b08.reference || (__cxx_static_address_813d93a3f71ebc84c4963b08.reference = {
    __cReference: true,
    get value() { return POOLBALLHIT____header_global_4680e82343b48159; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:52
export const RPG_EXPLODE____header_global_d25f1aab7e5e1247 = ((((((9) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fd9510e20905cbf455290e0d() {
  return __cxx_static_address_fd9510e20905cbf455290e0d.reference || (__cxx_static_address_fd9510e20905cbf455290e0d.reference = {
    __cReference: true,
    get value() { return RPG_EXPLODE____header_global_d25f1aab7e5e1247; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:53
export const CAT_FIRE____header_global_6203cf1ce0959cb2 = ((((((10) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9225f056824d3366df17787a() {
  return __cxx_static_address_9225f056824d3366df17787a.reference || (__cxx_static_address_9225f056824d3366df17787a.reference = {
    __cReference: true,
    get value() { return CAT_FIRE____header_global_6203cf1ce0959cb2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:54
export const SHRINKER_FIRE____header_global_31f5c50d4bbfe609 = ((((((11) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_192f63b98e6203b8dc927013() {
  return __cxx_static_address_192f63b98e6203b8dc927013.reference || (__cxx_static_address_192f63b98e6203b8dc927013.reference = {
    __cReference: true,
    get value() { return SHRINKER_FIRE____header_global_31f5c50d4bbfe609; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:55
export const PIPEBOMB_BOUNCE____header_global_3a30a160eab65610 = ((((((13) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fba3bffa9f7ecb5182588a51() {
  return __cxx_static_address_fba3bffa9f7ecb5182588a51.reference || (__cxx_static_address_fba3bffa9f7ecb5182588a51.reference = {
    __cReference: true,
    get value() { return PIPEBOMB_BOUNCE____header_global_3a30a160eab65610; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:56
export const PIPEBOMB_EXPLODE____header_global_e19c346a1cccb988 = ((((((14) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_92151a5bb7fd47117adf4e27() {
  return __cxx_static_address_92151a5bb7fd47117adf4e27.reference || (__cxx_static_address_92151a5bb7fd47117adf4e27.reference = {
    __cReference: true,
    get value() { return PIPEBOMB_EXPLODE____header_global_e19c346a1cccb988; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:57
export const LASERTRIP_ONWALL____header_global_8ad3e7f7cc77238f = ((((((15) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_189e7231c0c926ce1d1168d7() {
  return __cxx_static_address_189e7231c0c926ce1d1168d7.reference || (__cxx_static_address_189e7231c0c926ce1d1168d7.reference = {
    __cReference: true,
    get value() { return LASERTRIP_ONWALL____header_global_8ad3e7f7cc77238f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:58
export const LASERTRIP_ARMING____header_global_ef088ae93a178643 = ((((((16) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_db282c3ec4fd665909411568() {
  return __cxx_static_address_db282c3ec4fd665909411568.reference || (__cxx_static_address_db282c3ec4fd665909411568.reference = {
    __cReference: true,
    get value() { return LASERTRIP_ARMING____header_global_ef088ae93a178643; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:59
export const LASERTRIP_EXPLODE____header_global_64b28c3850d0c688 = ((((((17) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8ff7b0f699c5e71460a224cc() {
  return __cxx_static_address_8ff7b0f699c5e71460a224cc.reference || (__cxx_static_address_8ff7b0f699c5e71460a224cc.reference = {
    __cReference: true,
    get value() { return LASERTRIP_EXPLODE____header_global_64b28c3850d0c688; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:60
export const VENT_BUST____header_global_2ab246e8175b9466 = ((((((18) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_993d45446a024d1d5d32ad0f() {
  return __cxx_static_address_993d45446a024d1d5d32ad0f.reference || (__cxx_static_address_993d45446a024d1d5d32ad0f.reference = {
    __cReference: true,
    get value() { return VENT_BUST____header_global_2ab246e8175b9466; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:61
export const GLASS_BREAKING____header_global_660919ce51872641 = ((((((19) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f177c8f928382e61ef45ad38() {
  return __cxx_static_address_f177c8f928382e61ef45ad38.reference || (__cxx_static_address_f177c8f928382e61ef45ad38.reference = {
    __cReference: true,
    get value() { return GLASS_BREAKING____header_global_660919ce51872641; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:62
export const GLASS_HEAVYBREAK____header_global_e2acbc9a88cdd682 = ((((((20) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_deb9972dfa92ccc8fc2b4480() {
  return __cxx_static_address_deb9972dfa92ccc8fc2b4480.reference || (__cxx_static_address_deb9972dfa92ccc8fc2b4480.reference = {
    __cReference: true,
    get value() { return GLASS_HEAVYBREAK____header_global_e2acbc9a88cdd682; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:63
export const SHORT_CIRCUIT____header_global_22a0ecdac5d969ff = ((((((21) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_57462367a2686c3ef8130512() {
  return __cxx_static_address_57462367a2686c3ef8130512.reference || (__cxx_static_address_57462367a2686c3ef8130512.reference = {
    __cReference: true,
    get value() { return SHORT_CIRCUIT____header_global_22a0ecdac5d969ff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:64
export const ITEM_SPLASH____header_global_ef33142a81bfcb1a = ((((((22) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c561ed7df4a468170b6d78e2() {
  return __cxx_static_address_c561ed7df4a468170b6d78e2.reference || (__cxx_static_address_c561ed7df4a468170b6d78e2.reference = {
    __cReference: true,
    get value() { return ITEM_SPLASH____header_global_ef33142a81bfcb1a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:65
export const DUKE_GASP____header_global_2c69f737c606b60f = ((((((25) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_027c60018ba0cbe0cc04dcc0() {
  return __cxx_static_address_027c60018ba0cbe0cc04dcc0.reference || (__cxx_static_address_027c60018ba0cbe0cc04dcc0.reference = {
    __cReference: true,
    get value() { return DUKE_GASP____header_global_2c69f737c606b60f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:66
export const SLIM_RECOG____header_global_9ce90e727a77712a = ((((((26) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cc42e436e682c0d4efe07b23() {
  return __cxx_static_address_cc42e436e682c0d4efe07b23.reference || (__cxx_static_address_cc42e436e682c0d4efe07b23.reference = {
    __cReference: true,
    get value() { return SLIM_RECOG____header_global_9ce90e727a77712a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:67
export const DUKE_URINATE____header_global_dfd7b86e46751de8 = ((((((28) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_46617bf6b7ab64a4c96218bc() {
  return __cxx_static_address_46617bf6b7ab64a4c96218bc.reference || (__cxx_static_address_46617bf6b7ab64a4c96218bc.reference = {
    __cReference: true,
    get value() { return DUKE_URINATE____header_global_dfd7b86e46751de8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:68
export const ENDSEQVOL3SND2____header_global_9590b7b9ad6b49c2 = ((((((29) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ef9e2ef40b724c0d649a3159() {
  return __cxx_static_address_ef9e2ef40b724c0d649a3159.reference || (__cxx_static_address_ef9e2ef40b724c0d649a3159.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND2____header_global_9590b7b9ad6b49c2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:69
export const ENDSEQVOL3SND3____header_global_72942f2340785149 = ((((((30) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e6f139b0411c5f80f1436a84() {
  return __cxx_static_address_e6f139b0411c5f80f1436a84.reference || (__cxx_static_address_e6f139b0411c5f80f1436a84.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND3____header_global_72942f2340785149; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:70
export const DUKE_CRACK____header_global_a66251d46470e305 = ((((((33) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8a1c8103a541237d7ba7db26() {
  return __cxx_static_address_8a1c8103a541237d7ba7db26.reference || (__cxx_static_address_8a1c8103a541237d7ba7db26.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK____header_global_a66251d46470e305; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:71
export const SLIM_ATTACK____header_global_7f699faa3cdb9b31 = ((((((34) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_759f9a94095b6df3a5905f86() {
  return __cxx_static_address_759f9a94095b6df3a5905f86.reference || (__cxx_static_address_759f9a94095b6df3a5905f86.reference = {
    __cReference: true,
    get value() { return SLIM_ATTACK____header_global_7f699faa3cdb9b31; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:72
export const SOMETHINGHITFORCE____header_global_cc11859da85cc94f = ((((((35) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bd5cb29bec4b5d9bae237530() {
  return __cxx_static_address_bd5cb29bec4b5d9bae237530.reference || (__cxx_static_address_bd5cb29bec4b5d9bae237530.reference = {
    __cReference: true,
    get value() { return SOMETHINGHITFORCE____header_global_cc11859da85cc94f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:73
export const DUKE_DRINKING____header_global_b68baf3c697ede28 = ((((((36) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_487310039cf4b12c2ed28784() {
  return __cxx_static_address_487310039cf4b12c2ed28784.reference || (__cxx_static_address_487310039cf4b12c2ed28784.reference = {
    __cReference: true,
    get value() { return DUKE_DRINKING____header_global_b68baf3c697ede28; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:74
export const DUKE_GRUNT____header_global_0fe4defe2c3fdc05 = ((((((38) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_228a2ab2983e01527c1f8533() {
  return __cxx_static_address_228a2ab2983e01527c1f8533.reference || (__cxx_static_address_228a2ab2983e01527c1f8533.reference = {
    __cReference: true,
    get value() { return DUKE_GRUNT____header_global_0fe4defe2c3fdc05; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:75
export const DUKE_HARTBEAT____header_global_846a870d3634b049 = ((((((39) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cea20496a0ecc71c6156487e() {
  return __cxx_static_address_cea20496a0ecc71c6156487e.reference || (__cxx_static_address_cea20496a0ecc71c6156487e.reference = {
    __cReference: true,
    get value() { return DUKE_HARTBEAT____header_global_846a870d3634b049; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:76
export const DUKE_ONWATER____header_global_287dd996e5c5d28e = ((((((40) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_297d35bb27bb411c2cd2922a() {
  return __cxx_static_address_297d35bb27bb411c2cd2922a.reference || (__cxx_static_address_297d35bb27bb411c2cd2922a.reference = {
    __cReference: true,
    get value() { return DUKE_ONWATER____header_global_287dd996e5c5d28e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:77
export const DUKE_LAND____header_global_7a5f3201ee8d4ef8 = ((((((42) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_311221b2720cd1ae5095e40e() {
  return __cxx_static_address_311221b2720cd1ae5095e40e.reference || (__cxx_static_address_311221b2720cd1ae5095e40e.reference = {
    __cReference: true,
    get value() { return DUKE_LAND____header_global_7a5f3201ee8d4ef8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:78
export const DUKE_WALKINDUCTS____header_global_964e20060eb60d95 = ((((((43) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_802afd291b8a1ea20ea575ca() {
  return __cxx_static_address_802afd291b8a1ea20ea575ca.reference || (__cxx_static_address_802afd291b8a1ea20ea575ca.reference = {
    __cReference: true,
    get value() { return DUKE_WALKINDUCTS____header_global_964e20060eb60d95; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:79
export const DUKE_UNDERWATER____header_global_145743882fb9a64e = ((((((48) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eb55bb6d64d9daeb87f690e4() {
  return __cxx_static_address_eb55bb6d64d9daeb87f690e4.reference || (__cxx_static_address_eb55bb6d64d9daeb87f690e4.reference = {
    __cReference: true,
    get value() { return DUKE_UNDERWATER____header_global_145743882fb9a64e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:80
export const DUKE_JETPACK_ON____header_global_e7b6d5562bde5ba6 = ((((((49) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b6b602a6bfb4c571784dd9d1() {
  return __cxx_static_address_b6b602a6bfb4c571784dd9d1.reference || (__cxx_static_address_b6b602a6bfb4c571784dd9d1.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_ON____header_global_e7b6d5562bde5ba6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:81
export const DUKE_JETPACK_IDLE____header_global_1cf6e533d38b4872 = ((((((50) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5cda9be61afbd44bcec61d96() {
  return __cxx_static_address_5cda9be61afbd44bcec61d96.reference || (__cxx_static_address_5cda9be61afbd44bcec61d96.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_IDLE____header_global_1cf6e533d38b4872; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:82
export const DUKE_JETPACK_OFF____header_global_ce76339e69cc5a38 = ((((((51) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dcc69fc5faa95bef5fe78d91() {
  return __cxx_static_address_dcc69fc5faa95bef5fe78d91.reference || (__cxx_static_address_dcc69fc5faa95bef5fe78d91.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_OFF____header_global_ce76339e69cc5a38; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:83
export const DUKETALKTOBOSS____header_global_8c07303575c60433 = ((((((56) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_71ee1d1922af327fbc4da77d() {
  return __cxx_static_address_71ee1d1922af327fbc4da77d.reference || (__cxx_static_address_71ee1d1922af327fbc4da77d.reference = {
    __cReference: true,
    get value() { return DUKETALKTOBOSS____header_global_8c07303575c60433; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:84
export const SQUISHED____header_global_3348693c51b5fc8b = ((((((69) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3faf1162aaeeea160cf0a4f8() {
  return __cxx_static_address_3faf1162aaeeea160cf0a4f8.reference || (__cxx_static_address_3faf1162aaeeea160cf0a4f8.reference = {
    __cReference: true,
    get value() { return SQUISHED____header_global_3348693c51b5fc8b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:85
export const TELEPORTER____header_global_4283549938d9faac = ((((((70) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b497e8e4c7b3cd9ad9969821() {
  return __cxx_static_address_b497e8e4c7b3cd9ad9969821.reference || (__cxx_static_address_b497e8e4c7b3cd9ad9969821.reference = {
    __cReference: true,
    get value() { return TELEPORTER____header_global_4283549938d9faac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:86
export const ELEVATOR_ON____header_global_f92fcff0826ce998 = ((((((71) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ca2e0bb1796a7ebbb3712049() {
  return __cxx_static_address_ca2e0bb1796a7ebbb3712049.reference || (__cxx_static_address_ca2e0bb1796a7ebbb3712049.reference = {
    __cReference: true,
    get value() { return ELEVATOR_ON____header_global_f92fcff0826ce998; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:87
export const ELEVATOR_OFF____header_global_1786ae4911bb0dc7 = ((((((73) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_481941be301a756a8279fef8() {
  return __cxx_static_address_481941be301a756a8279fef8.reference || (__cxx_static_address_481941be301a756a8279fef8.reference = {
    __cReference: true,
    get value() { return ELEVATOR_OFF____header_global_1786ae4911bb0dc7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:88
export const SUBWAY____header_global_a2279f8cc7adafa3 = ((((((75) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2e005b1b4b2cfff6f326efd4() {
  return __cxx_static_address_2e005b1b4b2cfff6f326efd4.reference || (__cxx_static_address_2e005b1b4b2cfff6f326efd4.reference = {
    __cReference: true,
    get value() { return SUBWAY____header_global_a2279f8cc7adafa3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:89
export const SWITCH_ON____header_global_402f60698dff2c3e = ((((((76) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_53b266e71c57b692195f5614() {
  return __cxx_static_address_53b266e71c57b692195f5614.reference || (__cxx_static_address_53b266e71c57b692195f5614.reference = {
    __cReference: true,
    get value() { return SWITCH_ON____header_global_402f60698dff2c3e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:90
export const FLUSH_TOILET____header_global_e11934948ec3b9ac = ((((((79) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3c584c7c4bdd4a455d3a5201() {
  return __cxx_static_address_3c584c7c4bdd4a455d3a5201.reference || (__cxx_static_address_3c584c7c4bdd4a455d3a5201.reference = {
    __cReference: true,
    get value() { return FLUSH_TOILET____header_global_e11934948ec3b9ac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:91
export const EARTHQUAKE____header_global_457d7dbf51d5b0c5 = ((((((81) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3248df10bf96cfb70fe7ab4d() {
  return __cxx_static_address_3248df10bf96cfb70fe7ab4d.reference || (__cxx_static_address_3248df10bf96cfb70fe7ab4d.reference = {
    __cReference: true,
    get value() { return EARTHQUAKE____header_global_457d7dbf51d5b0c5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:92
export const END_OF_LEVEL_WARN____header_global_94eb65d9e574194c = ((((((83) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_69249fc4468f463094c19c43() {
  return __cxx_static_address_69249fc4468f463094c19c43.reference || (__cxx_static_address_69249fc4468f463094c19c43.reference = {
    __cReference: true,
    get value() { return END_OF_LEVEL_WARN____header_global_94eb65d9e574194c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:93
export const WIND_AMBIENCE____header_global_6624db9a5ce7bb7a = ((((((91) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4800338b759cf14a14c40492() {
  return __cxx_static_address_4800338b759cf14a14c40492.reference || (__cxx_static_address_4800338b759cf14a14c40492.reference = {
    __cReference: true,
    get value() { return WIND_AMBIENCE____header_global_6624db9a5ce7bb7a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:94
export const SOMETHING_DRIPPING____header_global_e73af060fb05aaf5 = ((((((92) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f3604ba37f389a5dddc8dbe2() {
  return __cxx_static_address_f3604ba37f389a5dddc8dbe2.reference || (__cxx_static_address_f3604ba37f389a5dddc8dbe2.reference = {
    __cReference: true,
    get value() { return SOMETHING_DRIPPING____header_global_e73af060fb05aaf5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:95
export const BOS1_RECOG____header_global_6c340cbeb6c5ec7c = ((((((97) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f9bb99505c42531f34a655de() {
  return __cxx_static_address_f9bb99505c42531f34a655de.reference || (__cxx_static_address_f9bb99505c42531f34a655de.reference = {
    __cReference: true,
    get value() { return BOS1_RECOG____header_global_6c340cbeb6c5ec7c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:96
export const BOS2_RECOG____header_global_66d9c3408ba02b21 = ((((((102) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_510d7e2b7b5e5df056591765() {
  return __cxx_static_address_510d7e2b7b5e5df056591765.reference || (__cxx_static_address_510d7e2b7b5e5df056591765.reference = {
    __cReference: true,
    get value() { return BOS2_RECOG____header_global_66d9c3408ba02b21; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:97
export const DUKE_GETWEAPON2____header_global_42dde208f337a250 = ((((((107) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_33d8c4eb624fc8b1c288afa4() {
  return __cxx_static_address_33d8c4eb624fc8b1c288afa4.reference || (__cxx_static_address_33d8c4eb624fc8b1c288afa4.reference = {
    __cReference: true,
    get value() { return DUKE_GETWEAPON2____header_global_42dde208f337a250; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:98
export const SHOTGUN_FIRE____header_global_ffb5a1c3d3ba0c50 = ((((((109) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4c3d27171992e0ac6b1726a7() {
  return __cxx_static_address_4c3d27171992e0ac6b1726a7.reference || (__cxx_static_address_4c3d27171992e0ac6b1726a7.reference = {
    __cReference: true,
    get value() { return SHOTGUN_FIRE____header_global_ffb5a1c3d3ba0c50; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:99
export const PRED_RECOG____header_global_ed4ca55ee70ceff5 = ((((((111) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3032e336194046fbf77be095() {
  return __cxx_static_address_3032e336194046fbf77be095.reference || (__cxx_static_address_3032e336194046fbf77be095.reference = {
    __cReference: true,
    get value() { return PRED_RECOG____header_global_ed4ca55ee70ceff5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:100
export const CAPT_RECOG____header_global_c8ffd58dab0c931f = ((((((117) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8b47e66ee9024ff0cdf149ca() {
  return __cxx_static_address_8b47e66ee9024ff0cdf149ca.reference || (__cxx_static_address_8b47e66ee9024ff0cdf149ca.reference = {
    __cReference: true,
    get value() { return CAPT_RECOG____header_global_c8ffd58dab0c931f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:101
export const PIG_RECOG____header_global_f3f7ada2ac641884 = ((((((121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_499b14339687ca1067f17a19() {
  return __cxx_static_address_499b14339687ca1067f17a19.reference || (__cxx_static_address_499b14339687ca1067f17a19.reference = {
    __cReference: true,
    get value() { return PIG_RECOG____header_global_f3f7ada2ac641884; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:102
export const RECO_ROAM____header_global_009d5ee90a289645 = ((((((125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_74c975371417fe4ba5eee6b7() {
  return __cxx_static_address_74c975371417fe4ba5eee6b7.reference || (__cxx_static_address_74c975371417fe4ba5eee6b7.reference = {
    __cReference: true,
    get value() { return RECO_ROAM____header_global_009d5ee90a289645; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:103
export const RECO_RECOG____header_global_4db2cd619343bc43 = ((((((126) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bc200b8b2c0fccb503e5ad9e() {
  return __cxx_static_address_bc200b8b2c0fccb503e5ad9e.reference || (__cxx_static_address_bc200b8b2c0fccb503e5ad9e.reference = {
    __cReference: true,
    get value() { return RECO_RECOG____header_global_4db2cd619343bc43; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:104
export const RECO_ATTACK____header_global_b8bdb333ef2dd866 = ((((((127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ba16913f005f15133c6c0fd5() {
  return __cxx_static_address_ba16913f005f15133c6c0fd5.reference || (__cxx_static_address_ba16913f005f15133c6c0fd5.reference = {
    __cReference: true,
    get value() { return RECO_ATTACK____header_global_b8bdb333ef2dd866; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:105
export const RECO_PAIN____header_global_b19b9a08c47ab794 = ((((((128) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2ca8e7dd2d8121d7f744168e() {
  return __cxx_static_address_2ca8e7dd2d8121d7f744168e.reference || (__cxx_static_address_2ca8e7dd2d8121d7f744168e.reference = {
    __cReference: true,
    get value() { return RECO_PAIN____header_global_b19b9a08c47ab794; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:106
export const DRON_RECOG____header_global_d2e6b72d255c414a = ((((((131) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_755045c0328672697855e2e4() {
  return __cxx_static_address_755045c0328672697855e2e4.reference || (__cxx_static_address_755045c0328672697855e2e4.reference = {
    __cReference: true,
    get value() { return DRON_RECOG____header_global_d2e6b72d255c414a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:107
export const COMM_RECOG____header_global_c2871de88c0e8fac = ((((((136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_41b3bc178c1290073590e0c8() {
  return __cxx_static_address_41b3bc178c1290073590e0c8.reference || (__cxx_static_address_41b3bc178c1290073590e0c8.reference = {
    __cReference: true,
    get value() { return COMM_RECOG____header_global_c2871de88c0e8fac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:108
export const OCTA_RECOG____header_global_d9ccc447e978ed2c = ((((((141) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c33bb69282cad2a860680d94() {
  return __cxx_static_address_c33bb69282cad2a860680d94.reference || (__cxx_static_address_c33bb69282cad2a860680d94.reference = {
    __cReference: true,
    get value() { return OCTA_RECOG____header_global_d9ccc447e978ed2c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:109
export const TURR_RECOG____header_global_753a5514354cbf2c = ((((((146) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7f8933d053e1a5e7f0d6729a() {
  return __cxx_static_address_7f8933d053e1a5e7f0d6729a.reference || (__cxx_static_address_7f8933d053e1a5e7f0d6729a.reference = {
    __cReference: true,
    get value() { return TURR_RECOG____header_global_753a5514354cbf2c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:110
export const SLIM_DYING____header_global_4b9ee979174450fe = ((((((149) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_536ccaa592d8abdaadbc124a() {
  return __cxx_static_address_536ccaa592d8abdaadbc124a.reference || (__cxx_static_address_536ccaa592d8abdaadbc124a.reference = {
    __cReference: true,
    get value() { return SLIM_DYING____header_global_4b9ee979174450fe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:111
export const BOS3_RECOG____header_global_5e48e3ca6bc615e9 = ((((((151) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fb0e5123096b4bad5a24bb63() {
  return __cxx_static_address_fb0e5123096b4bad5a24bb63.reference || (__cxx_static_address_fb0e5123096b4bad5a24bb63.reference = {
    __cReference: true,
    get value() { return BOS3_RECOG____header_global_5e48e3ca6bc615e9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:112
export const BOS1_WALK____header_global_dfedc1a1c469ecdb = ((((((156) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c177dd5556be58557aa74556() {
  return __cxx_static_address_c177dd5556be58557aa74556.reference || (__cxx_static_address_c177dd5556be58557aa74556.reference = {
    __cReference: true,
    get value() { return BOS1_WALK____header_global_dfedc1a1c469ecdb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:113
export const THUD____header_global_334f88b77b3a0c64 = ((((((158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_842425a2c8fad830d06cdab5() {
  return __cxx_static_address_842425a2c8fad830d06cdab5.reference || (__cxx_static_address_842425a2c8fad830d06cdab5.reference = {
    __cReference: true,
    get value() { return THUD____header_global_334f88b77b3a0c64; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:114
export const WIERDSHOT_FLY____header_global_3f30c2484699089e = ((((((160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_836647d8bb0dd465dd269aa8() {
  return __cxx_static_address_836647d8bb0dd465dd269aa8.reference || (__cxx_static_address_836647d8bb0dd465dd269aa8.reference = {
    __cReference: true,
    get value() { return WIERDSHOT_FLY____header_global_3f30c2484699089e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:115
export const SLIM_ROAM____header_global_1a59ee1b4b434773 = ((((((163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0667d3932af2b5593595fa6d() {
  return __cxx_static_address_0667d3932af2b5593595fa6d.reference || (__cxx_static_address_0667d3932af2b5593595fa6d.reference = {
    __cReference: true,
    get value() { return SLIM_ROAM____header_global_1a59ee1b4b434773; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:116
export const SHOTGUN_COCK____header_global_299f7660e0c4b461 = ((((((169) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0604dc787f6c89b7b73d9bc0() {
  return __cxx_static_address_0604dc787f6c89b7b73d9bc0.reference || (__cxx_static_address_0604dc787f6c89b7b73d9bc0.reference = {
    __cReference: true,
    get value() { return SHOTGUN_COCK____header_global_299f7660e0c4b461; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:117
export const GENERIC_AMBIENCE17____header_global_e9d2c4a58e7acb06 = ((((((177) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e120039446a49e171aff1dd() {
  return __cxx_static_address_1e120039446a49e171aff1dd.reference || (__cxx_static_address_1e120039446a49e171aff1dd.reference = {
    __cReference: true,
    get value() { return GENERIC_AMBIENCE17____header_global_e9d2c4a58e7acb06; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:118
export const BONUS_SPEECH1____header_global_b58b2d2b025494a5 = ((((((195) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5f4e8ee220750d9b17b5609a() {
  return __cxx_static_address_5f4e8ee220750d9b17b5609a.reference || (__cxx_static_address_5f4e8ee220750d9b17b5609a.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH1____header_global_b58b2d2b025494a5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:119
export const BONUS_SPEECH2____header_global_ff6f99a8dd112b4b = ((((((196) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c28a733b242b2f1874948ad3() {
  return __cxx_static_address_c28a733b242b2f1874948ad3.reference || (__cxx_static_address_c28a733b242b2f1874948ad3.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH2____header_global_ff6f99a8dd112b4b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:120
export const BONUS_SPEECH3____header_global_ba2a7afbd604ca44 = ((((((197) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_511d24f678eb31dbc5f0db13() {
  return __cxx_static_address_511d24f678eb31dbc5f0db13.reference || (__cxx_static_address_511d24f678eb31dbc5f0db13.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH3____header_global_ba2a7afbd604ca44; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:121
export const BONUS_SPEECH4____header_global_5346381e2b3ccdca = ((((((199) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1a1e331d430554b33c468143() {
  return __cxx_static_address_1a1e331d430554b33c468143.reference || (__cxx_static_address_1a1e331d430554b33c468143.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH4____header_global_5346381e2b3ccdca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:122
export const DUKE_LAND_HURT____header_global_8bf191ec7c173ea9 = ((((((200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_71173b575bbcf6e2903360e8() {
  return __cxx_static_address_71173b575bbcf6e2903360e8.reference || (__cxx_static_address_71173b575bbcf6e2903360e8.reference = {
    __cReference: true,
    get value() { return DUKE_LAND_HURT____header_global_8bf191ec7c173ea9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:123
export const DUKE_SEARCH2____header_global_106848aceefd0560 = ((((((207) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_76011d35d981488781c91dc8() {
  return __cxx_static_address_76011d35d981488781c91dc8.reference || (__cxx_static_address_76011d35d981488781c91dc8.reference = {
    __cReference: true,
    get value() { return DUKE_SEARCH2____header_global_106848aceefd0560; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:124
export const DUKE_CRACK2____header_global_e390059cdd3b8733 = ((((((208) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8eeaa5d8aea9f3aeb19a6b86() {
  return __cxx_static_address_8eeaa5d8aea9f3aeb19a6b86.reference || (__cxx_static_address_8eeaa5d8aea9f3aeb19a6b86.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK2____header_global_e390059cdd3b8733; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:125
export const DUKE_SEARCH____header_global_5ed2e8594392cf4a = ((((((209) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f0f7e71bbfc277ef8efa73cc() {
  return __cxx_static_address_f0f7e71bbfc277ef8efa73cc.reference || (__cxx_static_address_f0f7e71bbfc277ef8efa73cc.reference = {
    __cReference: true,
    get value() { return DUKE_SEARCH____header_global_5ed2e8594392cf4a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:126
export const DUKE_GET____header_global_36c74b4ba6948229 = ((((((210) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_005984026b61b1b085898de0() {
  return __cxx_static_address_005984026b61b1b085898de0.reference || (__cxx_static_address_005984026b61b1b085898de0.reference = {
    __cReference: true,
    get value() { return DUKE_GET____header_global_36c74b4ba6948229; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:127
export const DUKE_LONGTERM_PAIN____header_global_56daad76c7d8d156 = ((((((211) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a1c22a58e4657c6e2c5ee0a9() {
  return __cxx_static_address_a1c22a58e4657c6e2c5ee0a9.reference || (__cxx_static_address_a1c22a58e4657c6e2c5ee0a9.reference = {
    __cReference: true,
    get value() { return DUKE_LONGTERM_PAIN____header_global_56daad76c7d8d156; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:128
export const MONITOR_ACTIVE____header_global_050aa1fb6498e9d3 = ((((((212) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_20f8b746865114d7e10db7b8() {
  return __cxx_static_address_20f8b746865114d7e10db7b8.reference || (__cxx_static_address_20f8b746865114d7e10db7b8.reference = {
    __cReference: true,
    get value() { return MONITOR_ACTIVE____header_global_050aa1fb6498e9d3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:129
export const NITEVISION_ONOFF____header_global_715107e5d80d91b2 = ((((((213) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d08a1dd72e1c566f1db45670() {
  return __cxx_static_address_d08a1dd72e1c566f1db45670.reference || (__cxx_static_address_d08a1dd72e1c566f1db45670.reference = {
    __cReference: true,
    get value() { return NITEVISION_ONOFF____header_global_715107e5d80d91b2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:130
export const DUKE_CRACK_FIRST____header_global_ec69bfb65b2fd60f = ((((((215) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2d4858d505192561d4bfe378() {
  return __cxx_static_address_2d4858d505192561d4bfe378.reference || (__cxx_static_address_2d4858d505192561d4bfe378.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK_FIRST____header_global_ec69bfb65b2fd60f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:131
export const DUKE_USEMEDKIT____header_global_518873f136f240e5 = ((((((216) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_de91ec7c36ba345f975def76() {
  return __cxx_static_address_de91ec7c36ba345f975def76.reference || (__cxx_static_address_de91ec7c36ba345f975def76.reference = {
    __cReference: true,
    get value() { return DUKE_USEMEDKIT____header_global_518873f136f240e5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:132
export const DUKE_TAKEPILLS____header_global_20396e84f4eb66e2 = ((((((217) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5f072d0e7d147094c789f778() {
  return __cxx_static_address_5f072d0e7d147094c789f778.reference || (__cxx_static_address_5f072d0e7d147094c789f778.reference = {
    __cReference: true,
    get value() { return DUKE_TAKEPILLS____header_global_20396e84f4eb66e2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:133
export const DUKE_PISSRELIEF____header_global_f916c68b4dbc7747 = ((((((218) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f76501d3a105caf25e4f2b47() {
  return __cxx_static_address_f76501d3a105caf25e4f2b47.reference || (__cxx_static_address_f76501d3a105caf25e4f2b47.reference = {
    __cReference: true,
    get value() { return DUKE_PISSRELIEF____header_global_f916c68b4dbc7747; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:134
export const SELECT_WEAPON____header_global_20cb53ba352a7d70 = ((((((219) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3b53a0c56786df847f40bfbf() {
  return __cxx_static_address_3b53a0c56786df847f40bfbf.reference || (__cxx_static_address_3b53a0c56786df847f40bfbf.reference = {
    __cReference: true,
    get value() { return SELECT_WEAPON____header_global_20cb53ba352a7d70; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:135
export const JIBBED_ACTOR5____header_global_156b18172889388c = ((((((226) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6afb7b04e99e1b89677694bf() {
  return __cxx_static_address_6afb7b04e99e1b89677694bf.reference || (__cxx_static_address_6afb7b04e99e1b89677694bf.reference = {
    __cReference: true,
    get value() { return JIBBED_ACTOR5____header_global_156b18172889388c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:136
export const JIBBED_ACTOR6____header_global_69a437f9f87380ff = ((((((227) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_43ec540b876c59ce2d18d322() {
  return __cxx_static_address_43ec540b876c59ce2d18d322.reference || (__cxx_static_address_43ec540b876c59ce2d18d322.reference = {
    __cReference: true,
    get value() { return JIBBED_ACTOR6____header_global_69a437f9f87380ff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:137
export const DUKE_GOTHEALTHATLOW____header_global_8692f27fec04a278 = ((((((229) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_13df54356663924cdb57dc45() {
  return __cxx_static_address_13df54356663924cdb57dc45.reference || (__cxx_static_address_13df54356663924cdb57dc45.reference = {
    __cReference: true,
    get value() { return DUKE_GOTHEALTHATLOW____header_global_8692f27fec04a278; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:138
export const BOSSTALKTODUKE____header_global_7026e33513e473f8 = ((((((230) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9f87f399da3383e3cfc84662() {
  return __cxx_static_address_9f87f399da3383e3cfc84662.reference || (__cxx_static_address_9f87f399da3383e3cfc84662.reference = {
    __cReference: true,
    get value() { return BOSSTALKTODUKE____header_global_7026e33513e473f8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:139
export const WAR_AMBIENCE2____header_global_6ac94a3c2f123d6f = ((((((232) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_32d7f43dc7eb7fdd85b8a5f0() {
  return __cxx_static_address_32d7f43dc7eb7fdd85b8a5f0.reference || (__cxx_static_address_32d7f43dc7eb7fdd85b8a5f0.reference = {
    __cReference: true,
    get value() { return WAR_AMBIENCE2____header_global_6ac94a3c2f123d6f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:140
export const EXITMENUSOUND____header_global_ac78f3815ed1960a = ((((((243) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ebefa55c9c6c9454f5cb1acf() {
  return __cxx_static_address_ebefa55c9c6c9454f5cb1acf.reference || (__cxx_static_address_ebefa55c9c6c9454f5cb1acf.reference = {
    __cReference: true,
    get value() { return EXITMENUSOUND____header_global_ac78f3815ed1960a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:141
export const FLY_BY____header_global_48d8dca3b37aa7f0 = ((((((244) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_09125206fd9031f48923cb6f() {
  return __cxx_static_address_09125206fd9031f48923cb6f.reference || (__cxx_static_address_09125206fd9031f48923cb6f.reference = {
    __cReference: true,
    get value() { return FLY_BY____header_global_48d8dca3b37aa7f0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:142
export const DUKE_SCREAM____header_global_049c16432fbd34b7 = ((((((245) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_65632b35fb05816751f957e2() {
  return __cxx_static_address_65632b35fb05816751f957e2.reference || (__cxx_static_address_65632b35fb05816751f957e2.reference = {
    __cReference: true,
    get value() { return DUKE_SCREAM____header_global_049c16432fbd34b7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:143
export const SHRINKER_HIT____header_global_753c47261b070530 = ((((((246) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_40c28adc80ea178faf52afd6() {
  return __cxx_static_address_40c28adc80ea178faf52afd6.reference || (__cxx_static_address_40c28adc80ea178faf52afd6.reference = {
    __cReference: true,
    get value() { return SHRINKER_HIT____header_global_753c47261b070530; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:144
export const RATTY____header_global_b3ec7386d2e89de9 = ((((((247) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e7255c1f7e0c17a2e0c5784e() {
  return __cxx_static_address_e7255c1f7e0c17a2e0c5784e.reference || (__cxx_static_address_e7255c1f7e0c17a2e0c5784e.reference = {
    __cReference: true,
    get value() { return RATTY____header_global_b3ec7386d2e89de9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:145
export const BONUSMUSIC____header_global_738e0b4f65eee399 = ((((((249) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d698a7e0a74ecb31a548efda() {
  return __cxx_static_address_d698a7e0a74ecb31a548efda.reference || (__cxx_static_address_d698a7e0a74ecb31a548efda.reference = {
    __cReference: true,
    get value() { return BONUSMUSIC____header_global_738e0b4f65eee399; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:146
export const DUKE_GETWEAPON6____header_global_2b23eb92a5253347 = ((((((264) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b28e235159af4e377b72c470() {
  return __cxx_static_address_b28e235159af4e377b72c470.reference || (__cxx_static_address_b28e235159af4e377b72c470.reference = {
    __cReference: true,
    get value() { return DUKE_GETWEAPON6____header_global_2b23eb92a5253347; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:147
export const ALIEN_SWITCH1____header_global_5ddd9d9448ba4b54 = ((((((272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7c0c429d777b90e3e35ecb6e() {
  return __cxx_static_address_7c0c429d777b90e3e35ecb6e.reference || (__cxx_static_address_7c0c429d777b90e3e35ecb6e.reference = {
    __cReference: true,
    get value() { return ALIEN_SWITCH1____header_global_5ddd9d9448ba4b54; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:148
export const RIPHEADNECK____header_global_62c382358e931ff3 = ((((((284) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b845fae6993f7d448b707d42() {
  return __cxx_static_address_b845fae6993f7d448b707d42.reference || (__cxx_static_address_b845fae6993f7d448b707d42.reference = {
    __cReference: true,
    get value() { return RIPHEADNECK____header_global_62c382358e931ff3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:149
export const ENDSEQVOL3SND4____header_global_a6a3f3dc71cd3639 = ((((((288) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2b3a5940afa2e252632f150e() {
  return __cxx_static_address_2b3a5940afa2e252632f150e.reference || (__cxx_static_address_2b3a5940afa2e252632f150e.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND4____header_global_a6a3f3dc71cd3639; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:150
export const ENDSEQVOL3SND5____header_global_da164f67fcfc7ee1 = ((((((289) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_26cc58aa66121c693a2bfd48() {
  return __cxx_static_address_26cc58aa66121c693a2bfd48.reference || (__cxx_static_address_26cc58aa66121c693a2bfd48.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND5____header_global_da164f67fcfc7ee1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:151
export const ENDSEQVOL3SND6____header_global_d458329c6cd2fe70 = ((((((290) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a284bebe37a1c9861c808f10() {
  return __cxx_static_address_a284bebe37a1c9861c808f10.reference || (__cxx_static_address_a284bebe37a1c9861c808f10.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND6____header_global_d458329c6cd2fe70; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:152
export const ENDSEQVOL3SND7____header_global_1db1d731c50898e0 = ((((((291) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8855f49feb884733ee79b119() {
  return __cxx_static_address_8855f49feb884733ee79b119.reference || (__cxx_static_address_8855f49feb884733ee79b119.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND7____header_global_1db1d731c50898e0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:153
export const ENDSEQVOL3SND8____header_global_3045959de4da1b04 = ((((((292) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d9033e3b0f98ea4c34e8672a() {
  return __cxx_static_address_d9033e3b0f98ea4c34e8672a.reference || (__cxx_static_address_d9033e3b0f98ea4c34e8672a.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND8____header_global_3045959de4da1b04; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:154
export const ENDSEQVOL3SND9____header_global_a4a487f3ba40c02b = ((((((293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_802811fc8b759d07f6220cbf() {
  return __cxx_static_address_802811fc8b759d07f6220cbf.reference || (__cxx_static_address_802811fc8b759d07f6220cbf.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND9____header_global_a4a487f3ba40c02b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:155
export const WHIPYOURASS____header_global_15f7dade161fcfbf = ((((((294) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f610ae48bebbcc0814794318() {
  return __cxx_static_address_f610ae48bebbcc0814794318.reference || (__cxx_static_address_f610ae48bebbcc0814794318.reference = {
    __cReference: true,
    get value() { return WHIPYOURASS____header_global_15f7dade161fcfbf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:156
export const ENDSEQVOL2SND1____header_global_264f02c70e76d6b7 = ((((((295) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5c21f927d2d1808dca5c8db6() {
  return __cxx_static_address_5c21f927d2d1808dca5c8db6.reference || (__cxx_static_address_5c21f927d2d1808dca5c8db6.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND1____header_global_264f02c70e76d6b7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:157
export const ENDSEQVOL2SND2____header_global_27d72a546b6485f7 = ((((((296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7939b616220c2b7cf9df70a2() {
  return __cxx_static_address_7939b616220c2b7cf9df70a2.reference || (__cxx_static_address_7939b616220c2b7cf9df70a2.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND2____header_global_27d72a546b6485f7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:158
export const ENDSEQVOL2SND3____header_global_11e283f491d6586e = ((((((297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4b1644632c23d680f710ae9a() {
  return __cxx_static_address_4b1644632c23d680f710ae9a.reference || (__cxx_static_address_4b1644632c23d680f710ae9a.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND3____header_global_11e283f491d6586e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:159
export const ENDSEQVOL2SND4____header_global_361074649d14f6bd = ((((((298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a440d23dc606cb63d4dc8136() {
  return __cxx_static_address_a440d23dc606cb63d4dc8136.reference || (__cxx_static_address_a440d23dc606cb63d4dc8136.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND4____header_global_361074649d14f6bd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:160
export const ENDSEQVOL2SND5____header_global_862d57c0a66a54d0 = ((((((299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_21533cc98b333c8c4fce7b7c() {
  return __cxx_static_address_21533cc98b333c8c4fce7b7c.reference || (__cxx_static_address_21533cc98b333c8c4fce7b7c.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND5____header_global_862d57c0a66a54d0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:161
export const ENDSEQVOL2SND6____header_global_3257995eee25c7b9 = ((((((300) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8779b388fc7a8287b6ea54d1() {
  return __cxx_static_address_8779b388fc7a8287b6ea54d1.reference || (__cxx_static_address_8779b388fc7a8287b6ea54d1.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND6____header_global_3257995eee25c7b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:162
export const ENDSEQVOL2SND7____header_global_34ed34973cc0983c = ((((((301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c8b5a0a9e770c9ff5472e810() {
  return __cxx_static_address_c8b5a0a9e770c9ff5472e810.reference || (__cxx_static_address_c8b5a0a9e770c9ff5472e810.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND7____header_global_34ed34973cc0983c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:163
export const SOMETHINGFROZE____header_global_05dcba7a06fec34c = ((((((303) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2108be3b4b59e8856225619e() {
  return __cxx_static_address_2108be3b4b59e8856225619e.reference || (__cxx_static_address_2108be3b4b59e8856225619e.reference = {
    __cReference: true,
    get value() { return SOMETHINGFROZE____header_global_05dcba7a06fec34c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:164
export const WIND_REPEAT____header_global_a85ba2d325a93eb0 = ((((((308) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_263321a1b4b8f4daa63f1975() {
  return __cxx_static_address_263321a1b4b8f4daa63f1975.reference || (__cxx_static_address_263321a1b4b8f4daa63f1975.reference = {
    __cReference: true,
    get value() { return WIND_REPEAT____header_global_a85ba2d325a93eb0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:165
export const BOS4_RECOG____header_global_3bec2103c57451b5 = ((((((342) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_baf5ef67156a67d7dbcc2cf3() {
  return __cxx_static_address_baf5ef67156a67d7dbcc2cf3.reference || (__cxx_static_address_baf5ef67156a67d7dbcc2cf3.reference = {
    __cReference: true,
    get value() { return BOS4_RECOG____header_global_3bec2103c57451b5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:166
export const LIGHTNING_SLAP____header_global_e32cedf1fd39ac54 = ((((((351) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1c0c6a49e1295f8cc733d328() {
  return __cxx_static_address_1c0c6a49e1295f8cc733d328.reference || (__cxx_static_address_1c0c6a49e1295f8cc733d328.reference = {
    __cReference: true,
    get value() { return LIGHTNING_SLAP____header_global_e32cedf1fd39ac54; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:167
export const THUNDER____header_global_a2a9277ee6721310 = ((((((352) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b92ad0334a9db6815942b532() {
  return __cxx_static_address_b92ad0334a9db6815942b532.reference || (__cxx_static_address_b92ad0334a9db6815942b532.reference = {
    __cReference: true,
    get value() { return THUNDER____header_global_a2a9277ee6721310; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:168
export const INTRO4_1____header_global_fdd5e571b3c46ceb = ((((((363) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9cc289078323d8a41c61adfe() {
  return __cxx_static_address_9cc289078323d8a41c61adfe.reference || (__cxx_static_address_9cc289078323d8a41c61adfe.reference = {
    __cReference: true,
    get value() { return INTRO4_1____header_global_fdd5e571b3c46ceb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:169
export const INTRO4_2____header_global_c3fc67f810ce22d7 = ((((((364) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_99157c1823133f8871fce11a() {
  return __cxx_static_address_99157c1823133f8871fce11a.reference || (__cxx_static_address_99157c1823133f8871fce11a.reference = {
    __cReference: true,
    get value() { return INTRO4_2____header_global_c3fc67f810ce22d7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:170
export const INTRO4_3____header_global_cffe05cdc5fb4964 = ((((((365) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ccceeb621fec9f771a98198b() {
  return __cxx_static_address_ccceeb621fec9f771a98198b.reference || (__cxx_static_address_ccceeb621fec9f771a98198b.reference = {
    __cReference: true,
    get value() { return INTRO4_3____header_global_cffe05cdc5fb4964; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:171
export const INTRO4_4____header_global_3c7b807b417daaf8 = ((((((366) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_02c6d0061ad81886dca3bd50() {
  return __cxx_static_address_02c6d0061ad81886dca3bd50.reference || (__cxx_static_address_02c6d0061ad81886dca3bd50.reference = {
    __cReference: true,
    get value() { return INTRO4_4____header_global_3c7b807b417daaf8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:172
export const INTRO4_5____header_global_ebec9640e157a379 = ((((((367) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_81c0c350207493f514c04756() {
  return __cxx_static_address_81c0c350207493f514c04756.reference || (__cxx_static_address_81c0c350207493f514c04756.reference = {
    __cReference: true,
    get value() { return INTRO4_5____header_global_ebec9640e157a379; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:173
export const INTRO4_6____header_global_c676bfd739804244 = ((((((368) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_65ab63c9eccf9c9677284436() {
  return __cxx_static_address_65ab63c9eccf9c9677284436.reference || (__cxx_static_address_65ab63c9eccf9c9677284436.reference = {
    __cReference: true,
    get value() { return INTRO4_6____header_global_c676bfd739804244; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:174
export const BOSS4_DEADSPEECH____header_global_894f2de645d07fd8 = ((((((370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_189c03b56933c5199a7ac340() {
  return __cxx_static_address_189c03b56933c5199a7ac340.reference || (__cxx_static_address_189c03b56933c5199a7ac340.reference = {
    __cReference: true,
    get value() { return BOSS4_DEADSPEECH____header_global_894f2de645d07fd8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:175
export const BOSS4_FIRSTSEE____header_global_583f3327bd1d6177 = ((((((371) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e89f8da7aea39ee8f7c0860e() {
  return __cxx_static_address_e89f8da7aea39ee8f7c0860e.reference || (__cxx_static_address_e89f8da7aea39ee8f7c0860e.reference = {
    __cReference: true,
    get value() { return BOSS4_FIRSTSEE____header_global_583f3327bd1d6177; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:176
export const VOL4ENDSND1____header_global_d3b2fa18eed4bb86 = ((((((384) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_933513ba35b1ec30a4e89ca1() {
  return __cxx_static_address_933513ba35b1ec30a4e89ca1.reference || (__cxx_static_address_933513ba35b1ec30a4e89ca1.reference = {
    __cReference: true,
    get value() { return VOL4ENDSND1____header_global_d3b2fa18eed4bb86; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:177
export const VOL4ENDSND2____header_global_45cc1424a63d567f = ((((((385) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_584acf3886448e930fb61996() {
  return __cxx_static_address_584acf3886448e930fb61996.reference || (__cxx_static_address_584acf3886448e930fb61996.reference = {
    __cReference: true,
    get value() { return VOL4ENDSND2____header_global_45cc1424a63d567f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:178
export const EXPANDERSHOOT____header_global_e398cf864ab8a46e = ((((((388) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_44d2e307d64c0717904044fc() {
  return __cxx_static_address_44d2e307d64c0717904044fc.reference || (__cxx_static_address_44d2e307d64c0717904044fc.reference = {
    __cReference: true,
    get value() { return EXPANDERSHOOT____header_global_e398cf864ab8a46e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:179
export const INTRO4_B____header_global_5b65bf17bab04f09 = ((((((392) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_57cf02fcf1c6394ae0e2eb5a() {
  return __cxx_static_address_57cf02fcf1c6394ae0e2eb5a.reference || (__cxx_static_address_57cf02fcf1c6394ae0e2eb5a.reference = {
    __cReference: true,
    get value() { return INTRO4_B____header_global_5b65bf17bab04f09; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:180
export const BIGBANG____header_global_e348b96135d1e0d0 = ((((((393) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fed32ae44ffcb90cade2933a() {
  return __cxx_static_address_fed32ae44ffcb90cade2933a.reference || (__cxx_static_address_fed32ae44ffcb90cade2933a.reference = {
    __cReference: true,
    get value() { return BIGBANG____header_global_e348b96135d1e0d0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:181
export const FLAMETHROWER_INTRO____header_global_9ce1b2e924fd88a1 = ((((((398) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f655d6b03672272030a91a39() {
  return __cxx_static_address_f655d6b03672272030a91a39.reference || (__cxx_static_address_f655d6b03672272030a91a39.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_INTRO____header_global_9ce1b2e924fd88a1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:182
export const FLAMETHROWER_LOOP____header_global_a6bc80ddd2d6d597 = ((((((399) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ffacb5d53afb89b99e00294f() {
  return __cxx_static_address_ffacb5d53afb89b99e00294f.reference || (__cxx_static_address_ffacb5d53afb89b99e00294f.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_LOOP____header_global_a6bc80ddd2d6d597; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:183
export const FLAMETHROWER_END____header_global_8085b737484f9ec5 = ((((((400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_128b00c9da8ba7a82bc9f9fb() {
  return __cxx_static_address_128b00c9da8ba7a82bc9f9fb.reference || (__cxx_static_address_128b00c9da8ba7a82bc9f9fb.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_END____header_global_8085b737484f9ec5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:184
export const E5L7_DUKE_QUIT_YOU____header_global_60a1348e3485c9e7 = ((((((401) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fafd15bbf7f727ac80117eee() {
  return __cxx_static_address_fafd15bbf7f727ac80117eee.reference || (__cxx_static_address_fafd15bbf7f727ac80117eee.reference = {
    __cReference: true,
    get value() { return E5L7_DUKE_QUIT_YOU____header_global_60a1348e3485c9e7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:187
export const SECTOREFFECTOR____header_global_7f5ee0e1e263c8c5 = ((((((1) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f01bf12283272b6888f24075() {
  return __cxx_static_address_f01bf12283272b6888f24075.reference || (__cxx_static_address_f01bf12283272b6888f24075.reference = {
    __cReference: true,
    get value() { return SECTOREFFECTOR____header_global_7f5ee0e1e263c8c5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:188
export const ACTIVATOR____header_global_e659c08d6a247bed = ((((((2) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_440e6ffbd8e3bffc099f42f7() {
  return __cxx_static_address_440e6ffbd8e3bffc099f42f7.reference || (__cxx_static_address_440e6ffbd8e3bffc099f42f7.reference = {
    __cReference: true,
    get value() { return ACTIVATOR____header_global_e659c08d6a247bed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:189
export const TOUCHPLATE____header_global_fb8b5df327a26de0 = ((((((3) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b3e7dcc02ce6f2151f33c123() {
  return __cxx_static_address_b3e7dcc02ce6f2151f33c123.reference || (__cxx_static_address_b3e7dcc02ce6f2151f33c123.reference = {
    __cReference: true,
    get value() { return TOUCHPLATE____header_global_fb8b5df327a26de0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:190
export const ACTIVATORLOCKED____header_global_61a5a56bd28f72ee = ((((((4) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b1340429d7b904642a39c440() {
  return __cxx_static_address_b1340429d7b904642a39c440.reference || (__cxx_static_address_b1340429d7b904642a39c440.reference = {
    __cReference: true,
    get value() { return ACTIVATORLOCKED____header_global_61a5a56bd28f72ee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:191
export const MUSICANDSFX____header_global_e5aa2d377c9d70bd = ((((((5) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b62093ec62cd027738397783() {
  return __cxx_static_address_b62093ec62cd027738397783.reference || (__cxx_static_address_b62093ec62cd027738397783.reference = {
    __cReference: true,
    get value() { return MUSICANDSFX____header_global_e5aa2d377c9d70bd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:192
export const LOCATORS____header_global_6084fb91ad949781 = ((((((6) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_af87bc1c18ceae3bf4d97de1() {
  return __cxx_static_address_af87bc1c18ceae3bf4d97de1.reference || (__cxx_static_address_af87bc1c18ceae3bf4d97de1.reference = {
    __cReference: true,
    get value() { return LOCATORS____header_global_6084fb91ad949781; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:193
export const CYCLER____header_global_180abbc1e1f9f2e4 = ((((((7) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d84ce713ce9c995c7063e194() {
  return __cxx_static_address_d84ce713ce9c995c7063e194.reference || (__cxx_static_address_d84ce713ce9c995c7063e194.reference = {
    __cReference: true,
    get value() { return CYCLER____header_global_180abbc1e1f9f2e4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:194
export const MASTERSWITCH____header_global_0b54a317b990df72 = ((((((8) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3c280dbdabf988ead58b6d4f() {
  return __cxx_static_address_3c280dbdabf988ead58b6d4f.reference || (__cxx_static_address_3c280dbdabf988ead58b6d4f.reference = {
    __cReference: true,
    get value() { return MASTERSWITCH____header_global_0b54a317b990df72; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:195
export const RESPAWN____header_global_11182cfa674ef3a7 = ((((((9) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b8ab72cd0f57476dada29790() {
  return __cxx_static_address_b8ab72cd0f57476dada29790.reference || (__cxx_static_address_b8ab72cd0f57476dada29790.reference = {
    __cReference: true,
    get value() { return RESPAWN____header_global_11182cfa674ef3a7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:196
export const GPSPEED____header_global_115c8029511ce305 = ((((((10) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_acd85c6f064c04468cdb576f() {
  return __cxx_static_address_acd85c6f064c04468cdb576f.reference || (__cxx_static_address_acd85c6f064c04468cdb576f.reference = {
    __cReference: true,
    get value() { return GPSPEED____header_global_115c8029511ce305; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:197
export const FOF____header_global_ce86db21649d7e31 = ((((((13) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cb851a734b761f59910dead1() {
  return __cxx_static_address_cb851a734b761f59910dead1.reference || (__cxx_static_address_cb851a734b761f59910dead1.reference = {
    __cReference: true,
    get value() { return FOF____header_global_ce86db21649d7e31; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:198
export const ARROW____header_global_38398bf955d229c6 = ((((((20) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8a6a356b1c4148944e695c15() {
  return __cxx_static_address_8a6a356b1c4148944e695c15.reference || (__cxx_static_address_8a6a356b1c4148944e695c15.reference = {
    __cReference: true,
    get value() { return ARROW____header_global_38398bf955d229c6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:199
export const FIRSTGUNSPRITE____header_global_f0f223b890bef15d = ((((((21) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f40a8202ad01dac8f8048b26() {
  return __cxx_static_address_f40a8202ad01dac8f8048b26.reference || (__cxx_static_address_f40a8202ad01dac8f8048b26.reference = {
    __cReference: true,
    get value() { return FIRSTGUNSPRITE____header_global_f0f223b890bef15d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:200
export const CHAINGUNSPRITE____header_global_e41cae226f2535b6 = ((((((22) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ac627f7c934250d450fdc8d6() {
  return __cxx_static_address_ac627f7c934250d450fdc8d6.reference || (__cxx_static_address_ac627f7c934250d450fdc8d6.reference = {
    __cReference: true,
    get value() { return CHAINGUNSPRITE____header_global_e41cae226f2535b6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:201
export const RPGSPRITE____header_global_f1f3d9ef6f26ce10 = ((((((23) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_59daee9436a574acfa628286() {
  return __cxx_static_address_59daee9436a574acfa628286.reference || (__cxx_static_address_59daee9436a574acfa628286.reference = {
    __cReference: true,
    get value() { return RPGSPRITE____header_global_f1f3d9ef6f26ce10; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:202
export const FREEZESPRITE____header_global_e59b5582a85b4bf0 = ((((((24) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c2d61179fc6d07b4c37bf95e() {
  return __cxx_static_address_c2d61179fc6d07b4c37bf95e.reference || (__cxx_static_address_c2d61179fc6d07b4c37bf95e.reference = {
    __cReference: true,
    get value() { return FREEZESPRITE____header_global_e59b5582a85b4bf0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:203
export const SHRINKERSPRITE____header_global_d931fb62dfbfe72e = ((((((25) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b0aca817936780ea8821d4d5() {
  return __cxx_static_address_b0aca817936780ea8821d4d5.reference || (__cxx_static_address_b0aca817936780ea8821d4d5.reference = {
    __cReference: true,
    get value() { return SHRINKERSPRITE____header_global_d931fb62dfbfe72e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:204
export const HEAVYHBOMB____header_global_9617fc208f3e97aa = ((((((26) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_658ab8dd9fe314a051403159() {
  return __cxx_static_address_658ab8dd9fe314a051403159.reference || (__cxx_static_address_658ab8dd9fe314a051403159.reference = {
    __cReference: true,
    get value() { return HEAVYHBOMB____header_global_9617fc208f3e97aa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:205
export const TRIPBOMBSPRITE____header_global_74807dd1a2cd3695 = ((((((27) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_800159db5bb408e5620ddafa() {
  return __cxx_static_address_800159db5bb408e5620ddafa.reference || (__cxx_static_address_800159db5bb408e5620ddafa.reference = {
    __cReference: true,
    get value() { return TRIPBOMBSPRITE____header_global_74807dd1a2cd3695; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:206
export const SHOTGUNSPRITE____header_global_ffe54cfabe66b8b1 = ((((((28) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_28ab2b256a88d3c9c7a1b3a2() {
  return __cxx_static_address_28ab2b256a88d3c9c7a1b3a2.reference || (__cxx_static_address_28ab2b256a88d3c9c7a1b3a2.reference = {
    __cReference: true,
    get value() { return SHOTGUNSPRITE____header_global_ffe54cfabe66b8b1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:207
export const DEVISTATORSPRITE____header_global_44797d83623d42bc = ((((((29) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_97e2dc308d7179f11980df69() {
  return __cxx_static_address_97e2dc308d7179f11980df69.reference || (__cxx_static_address_97e2dc308d7179f11980df69.reference = {
    __cReference: true,
    get value() { return DEVISTATORSPRITE____header_global_44797d83623d42bc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:208
export const HEALTHBOX____header_global_3920e21f254e486c = ((((((30) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3388bc7415e7ac195dcf618e() {
  return __cxx_static_address_3388bc7415e7ac195dcf618e.reference || (__cxx_static_address_3388bc7415e7ac195dcf618e.reference = {
    __cReference: true,
    get value() { return HEALTHBOX____header_global_3920e21f254e486c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:209
export const AMMOBOX____header_global_b61b914003520c5b = ((((((31) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f37844f964e099d8f95d8caa() {
  return __cxx_static_address_f37844f964e099d8f95d8caa.reference || (__cxx_static_address_f37844f964e099d8f95d8caa.reference = {
    __cReference: true,
    get value() { return AMMOBOX____header_global_b61b914003520c5b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:210
export const GROWSPRITEICON____header_global_73bd58ac9d69767d = ((((((32) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d709d62207949c5be68c5c98() {
  return __cxx_static_address_d709d62207949c5be68c5c98.reference || (__cxx_static_address_d709d62207949c5be68c5c98.reference = {
    __cReference: true,
    get value() { return GROWSPRITEICON____header_global_73bd58ac9d69767d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:211
export const INVENTORYBOX____header_global_17003c41687ff16d = ((((((33) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ca0370256d662be9adffc4cf() {
  return __cxx_static_address_ca0370256d662be9adffc4cf.reference || (__cxx_static_address_ca0370256d662be9adffc4cf.reference = {
    __cReference: true,
    get value() { return INVENTORYBOX____header_global_17003c41687ff16d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:212
export const FREEZEAMMO____header_global_cc9aad10c6203c79 = ((((((37) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0471c3ce822bc6d9ecbd67b3() {
  return __cxx_static_address_0471c3ce822bc6d9ecbd67b3.reference || (__cxx_static_address_0471c3ce822bc6d9ecbd67b3.reference = {
    __cReference: true,
    get value() { return FREEZEAMMO____header_global_cc9aad10c6203c79; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:213
export const AMMO____header_global_9e68e988536fb609 = ((((((40) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f7f1b4cdafae44ee3630dbf1() {
  return __cxx_static_address_f7f1b4cdafae44ee3630dbf1.reference || (__cxx_static_address_f7f1b4cdafae44ee3630dbf1.reference = {
    __cReference: true,
    get value() { return AMMO____header_global_9e68e988536fb609; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:214
export const BATTERYAMMO____header_global_170a09e49e240908 = ((((((41) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a7266e062a1843812ca32330() {
  return __cxx_static_address_a7266e062a1843812ca32330.reference || (__cxx_static_address_a7266e062a1843812ca32330.reference = {
    __cReference: true,
    get value() { return BATTERYAMMO____header_global_170a09e49e240908; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:215
export const DEVISTATORAMMO____header_global_faf0658c1e21b10b = ((((((42) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f58fb0033f7e268eac1d9796() {
  return __cxx_static_address_f58fb0033f7e268eac1d9796.reference || (__cxx_static_address_f58fb0033f7e268eac1d9796.reference = {
    __cReference: true,
    get value() { return DEVISTATORAMMO____header_global_faf0658c1e21b10b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:216
export const RPGAMMO____header_global_02d8f6f23a72f5ce = ((((((44) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2f03fcee87a12de6e988185a() {
  return __cxx_static_address_2f03fcee87a12de6e988185a.reference || (__cxx_static_address_2f03fcee87a12de6e988185a.reference = {
    __cReference: true,
    get value() { return RPGAMMO____header_global_02d8f6f23a72f5ce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:217
export const GROWAMMO____header_global_8c98d9f2a4d15b46 = ((((((45) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_807cbd3105d9ab2a81132f26() {
  return __cxx_static_address_807cbd3105d9ab2a81132f26.reference || (__cxx_static_address_807cbd3105d9ab2a81132f26.reference = {
    __cReference: true,
    get value() { return GROWAMMO____header_global_8c98d9f2a4d15b46; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:218
export const CRYSTALAMMO____header_global_1f0d52066baf49f8 = ((((((46) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fc5b6e5aff9001d04babcbb9() {
  return __cxx_static_address_fc5b6e5aff9001d04babcbb9.reference || (__cxx_static_address_fc5b6e5aff9001d04babcbb9.reference = {
    __cReference: true,
    get value() { return CRYSTALAMMO____header_global_1f0d52066baf49f8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:219
export const HBOMBAMMO____header_global_a0c34c88ec5a57c8 = ((((((47) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_83d04f2ce34542f68e1e16ce() {
  return __cxx_static_address_83d04f2ce34542f68e1e16ce.reference || (__cxx_static_address_83d04f2ce34542f68e1e16ce.reference = {
    __cReference: true,
    get value() { return HBOMBAMMO____header_global_a0c34c88ec5a57c8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:220
export const AMMOLOTS____header_global_c341a6d93706bfb5 = ((((((48) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8943885bd39032c25bb18c99() {
  return __cxx_static_address_8943885bd39032c25bb18c99.reference || (__cxx_static_address_8943885bd39032c25bb18c99.reference = {
    __cReference: true,
    get value() { return AMMOLOTS____header_global_c341a6d93706bfb5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:221
export const SHOTGUNAMMO____header_global_7f7e914efc76b868 = ((((((49) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dd236d17ca845f865da7f578() {
  return __cxx_static_address_dd236d17ca845f865da7f578.reference || (__cxx_static_address_dd236d17ca845f865da7f578.reference = {
    __cReference: true,
    get value() { return SHOTGUNAMMO____header_global_7f7e914efc76b868; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:222
export const COLA____header_global_d507169b246b4e8f = ((((((51) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_edf65b151ee056fd535f0b22() {
  return __cxx_static_address_edf65b151ee056fd535f0b22.reference || (__cxx_static_address_edf65b151ee056fd535f0b22.reference = {
    __cReference: true,
    get value() { return COLA____header_global_d507169b246b4e8f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:223
export const SIXPAK____header_global_b4ae39d88f99432f = ((((((52) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ddc14f93fefdd9e30434cff4() {
  return __cxx_static_address_ddc14f93fefdd9e30434cff4.reference || (__cxx_static_address_ddc14f93fefdd9e30434cff4.reference = {
    __cReference: true,
    get value() { return SIXPAK____header_global_b4ae39d88f99432f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:224
export const FIRSTAID____header_global_8bf871417fb29cb0 = ((((((53) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c6c3c422cd01ddc969e77aad() {
  return __cxx_static_address_c6c3c422cd01ddc969e77aad.reference || (__cxx_static_address_c6c3c422cd01ddc969e77aad.reference = {
    __cReference: true,
    get value() { return FIRSTAID____header_global_8bf871417fb29cb0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:225
export const SHIELD____header_global_03aeabb8f74fd109 = ((((((54) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c623ee89a8f67f9cd7ef9821() {
  return __cxx_static_address_c623ee89a8f67f9cd7ef9821.reference || (__cxx_static_address_c623ee89a8f67f9cd7ef9821.reference = {
    __cReference: true,
    get value() { return SHIELD____header_global_03aeabb8f74fd109; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:226
export const STEROIDS____header_global_45b5550debbb3201 = ((((((55) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9f3695599213b76b3b548e43() {
  return __cxx_static_address_9f3695599213b76b3b548e43.reference || (__cxx_static_address_9f3695599213b76b3b548e43.reference = {
    __cReference: true,
    get value() { return STEROIDS____header_global_45b5550debbb3201; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:227
export const AIRTANK____header_global_f176c98c8a83c10b = ((((((56) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_923a7875b3746e4fe4b53db2() {
  return __cxx_static_address_923a7875b3746e4fe4b53db2.reference || (__cxx_static_address_923a7875b3746e4fe4b53db2.reference = {
    __cReference: true,
    get value() { return AIRTANK____header_global_f176c98c8a83c10b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:228
export const JETPACK____header_global_58d689194bad145c = ((((((57) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6b4304c734617c7c103dbe9d() {
  return __cxx_static_address_6b4304c734617c7c103dbe9d.reference || (__cxx_static_address_6b4304c734617c7c103dbe9d.reference = {
    __cReference: true,
    get value() { return JETPACK____header_global_58d689194bad145c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:229
export const HEATSENSOR____header_global_53182696a7aae4dd = ((((((59) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bacdab18436de03b068a6eef() {
  return __cxx_static_address_bacdab18436de03b068a6eef.reference || (__cxx_static_address_bacdab18436de03b068a6eef.reference = {
    __cReference: true,
    get value() { return HEATSENSOR____header_global_53182696a7aae4dd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:230
export const ACCESSCARD____header_global_7f6350f92546f5fe = ((((((60) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a8d9cd6693f04b5464c4633d() {
  return __cxx_static_address_a8d9cd6693f04b5464c4633d.reference || (__cxx_static_address_a8d9cd6693f04b5464c4633d.reference = {
    __cReference: true,
    get value() { return ACCESSCARD____header_global_7f6350f92546f5fe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:231
export const BOOTS____header_global_2e0f6449f327e93b = ((((((61) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b488b3d5f70cf18e366d1ea8() {
  return __cxx_static_address_b488b3d5f70cf18e366d1ea8.reference || (__cxx_static_address_b488b3d5f70cf18e366d1ea8.reference = {
    __cReference: true,
    get value() { return BOOTS____header_global_2e0f6449f327e93b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:232
export const MIRRORBROKE____header_global_f905a36f7263aa32 = ((((((70) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e7dfb6fc84c1588cddba8a14() {
  return __cxx_static_address_e7dfb6fc84c1588cddba8a14.reference || (__cxx_static_address_e7dfb6fc84c1588cddba8a14.reference = {
    __cReference: true,
    get value() { return MIRRORBROKE____header_global_f905a36f7263aa32; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:233
export const CLOUDYOCEAN____header_global_db05f65cd46c48a0 = ((((((78) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e201d65eb271fc371043f368() {
  return __cxx_static_address_e201d65eb271fc371043f368.reference || (__cxx_static_address_e201d65eb271fc371043f368.reference = {
    __cReference: true,
    get value() { return CLOUDYOCEAN____header_global_db05f65cd46c48a0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:234
export const CLOUDYSKIES____header_global_b450e66325615a7d = ((((((79) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f79a541372f459722f7e0b16() {
  return __cxx_static_address_f79a541372f459722f7e0b16.reference || (__cxx_static_address_f79a541372f459722f7e0b16.reference = {
    __cReference: true,
    get value() { return CLOUDYSKIES____header_global_b450e66325615a7d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:235
export const MOONSKY1____header_global_ba32827b7cdcbb48 = ((((((80) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b80e26a3d6752988e44503fe() {
  return __cxx_static_address_b80e26a3d6752988e44503fe.reference || (__cxx_static_address_b80e26a3d6752988e44503fe.reference = {
    __cReference: true,
    get value() { return MOONSKY1____header_global_ba32827b7cdcbb48; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:236
export const BIGORBIT1____header_global_356dba4cf08b6b3e = ((((((84) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ad30ad8dd714879f2ed458bf() {
  return __cxx_static_address_ad30ad8dd714879f2ed458bf.reference || (__cxx_static_address_ad30ad8dd714879f2ed458bf.reference = {
    __cReference: true,
    get value() { return BIGORBIT1____header_global_356dba4cf08b6b3e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:237
export const LA____header_global_ea65f9cb3e4e1227 = ((((((89) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_590e0933e9c648448da98a9b() {
  return __cxx_static_address_590e0933e9c648448da98a9b.reference || (__cxx_static_address_590e0933e9c648448da98a9b.reference = {
    __cReference: true,
    get value() { return LA____header_global_ea65f9cb3e4e1227; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:238
export const ATOMICHEALTH____header_global_0e1af4b0bcce5acd = ((((((100) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5b0778f39e3b16b9bcf5c089() {
  return __cxx_static_address_5b0778f39e3b16b9bcf5c089.reference || (__cxx_static_address_5b0778f39e3b16b9bcf5c089.reference = {
    __cReference: true,
    get value() { return ATOMICHEALTH____header_global_0e1af4b0bcce5acd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:239
export const TECHLIGHT2____header_global_c95508c33dace077 = ((((((120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a8d2f8e949ef77c1df4d9093() {
  return __cxx_static_address_a8d2f8e949ef77c1df4d9093.reference || (__cxx_static_address_a8d2f8e949ef77c1df4d9093.reference = {
    __cReference: true,
    get value() { return TECHLIGHT2____header_global_c95508c33dace077; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:240
export const TECHLIGHTBUST2____header_global_da9080bb2c9213c2 = ((((((121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bf88eacabeec43841109db4a() {
  return __cxx_static_address_bf88eacabeec43841109db4a.reference || (__cxx_static_address_bf88eacabeec43841109db4a.reference = {
    __cReference: true,
    get value() { return TECHLIGHTBUST2____header_global_da9080bb2c9213c2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:241
export const TECHLIGHT4____header_global_28fa953cd080b302 = ((((((122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ff566e1c7bc4c01987e57839() {
  return __cxx_static_address_ff566e1c7bc4c01987e57839.reference || (__cxx_static_address_ff566e1c7bc4c01987e57839.reference = {
    __cReference: true,
    get value() { return TECHLIGHT4____header_global_28fa953cd080b302; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:242
export const TECHLIGHTBUST4____header_global_6ec5d660da970de8 = ((((((123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e2d9a5e2522222750c6f402b() {
  return __cxx_static_address_e2d9a5e2522222750c6f402b.reference || (__cxx_static_address_e2d9a5e2522222750c6f402b.reference = {
    __cReference: true,
    get value() { return TECHLIGHTBUST4____header_global_6ec5d660da970de8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:243
export const WALLLIGHT4____header_global_63adf88987fa101c = ((((((124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_60efae2a80204efb8bd7e908() {
  return __cxx_static_address_60efae2a80204efb8bd7e908.reference || (__cxx_static_address_60efae2a80204efb8bd7e908.reference = {
    __cReference: true,
    get value() { return WALLLIGHT4____header_global_63adf88987fa101c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:244
export const WALLLIGHTBUST4____header_global_0ef0048f137d4f70 = ((((((125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_283202ecc1083ad3bef702c9() {
  return __cxx_static_address_283202ecc1083ad3bef702c9.reference || (__cxx_static_address_283202ecc1083ad3bef702c9.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST4____header_global_0ef0048f137d4f70; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:245
export const ACCESSSWITCH____header_global_db679dc25459d75c = ((((((130) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0510bb35f11f5d3dcf5f242f() {
  return __cxx_static_address_0510bb35f11f5d3dcf5f242f.reference || (__cxx_static_address_0510bb35f11f5d3dcf5f242f.reference = {
    __cReference: true,
    get value() { return ACCESSSWITCH____header_global_db679dc25459d75c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:246
export const SLOTDOOR____header_global_db0a1f07df5d09a7 = ((((((132) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_86d77ff76464579fa0dadeac() {
  return __cxx_static_address_86d77ff76464579fa0dadeac.reference || (__cxx_static_address_86d77ff76464579fa0dadeac.reference = {
    __cReference: true,
    get value() { return SLOTDOOR____header_global_db0a1f07df5d09a7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:247
export const LIGHTSWITCH____header_global_0f5f1070533b382c = ((((((134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_32390e26bbb21f8bcfb5959c() {
  return __cxx_static_address_32390e26bbb21f8bcfb5959c.reference || (__cxx_static_address_32390e26bbb21f8bcfb5959c.reference = {
    __cReference: true,
    get value() { return LIGHTSWITCH____header_global_0f5f1070533b382c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:248
export const SPACEDOORSWITCH____header_global_e70713f48be3bca5 = ((((((136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a8126bc7df78ae28df60e408() {
  return __cxx_static_address_a8126bc7df78ae28df60e408.reference || (__cxx_static_address_a8126bc7df78ae28df60e408.reference = {
    __cReference: true,
    get value() { return SPACEDOORSWITCH____header_global_e70713f48be3bca5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:249
export const SPACELIGHTSWITCH____header_global_005c480048186240 = ((((((138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d1743f5fce8d9bc8ee05ab08() {
  return __cxx_static_address_d1743f5fce8d9bc8ee05ab08.reference || (__cxx_static_address_d1743f5fce8d9bc8ee05ab08.reference = {
    __cReference: true,
    get value() { return SPACELIGHTSWITCH____header_global_005c480048186240; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:250
export const FRANKENSTINESWITCH____header_global_3281fad6c482eca0 = ((((((140) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2136ce12405dd30043b9591a() {
  return __cxx_static_address_2136ce12405dd30043b9591a.reference || (__cxx_static_address_2136ce12405dd30043b9591a.reference = {
    __cReference: true,
    get value() { return FRANKENSTINESWITCH____header_global_3281fad6c482eca0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:251
export const NUKEBUTTON____header_global_6f91dffcfab53fc2 = ((((((142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1ff4870eccdfbdfcdf102951() {
  return __cxx_static_address_1ff4870eccdfbdfcdf102951.reference || (__cxx_static_address_1ff4870eccdfbdfcdf102951.reference = {
    __cReference: true,
    get value() { return NUKEBUTTON____header_global_6f91dffcfab53fc2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:252
export const MULTISWITCH____header_global_ee81ca9e14dc8abd = ((((((146) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_16cc5186289ef370b566d530() {
  return __cxx_static_address_16cc5186289ef370b566d530.reference || (__cxx_static_address_16cc5186289ef370b566d530.reference = {
    __cReference: true,
    get value() { return MULTISWITCH____header_global_ee81ca9e14dc8abd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:253
export const DOORTILE5____header_global_a9eaf31096554ffb = ((((((150) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_84c9eac926e71bc961b6e4df() {
  return __cxx_static_address_84c9eac926e71bc961b6e4df.reference || (__cxx_static_address_84c9eac926e71bc961b6e4df.reference = {
    __cReference: true,
    get value() { return DOORTILE5____header_global_a9eaf31096554ffb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:254
export const DOORTILE6____header_global_ffb71ddcca022569 = ((((((151) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d9cbc173f3201343ffce9d57() {
  return __cxx_static_address_d9cbc173f3201343ffce9d57.reference || (__cxx_static_address_d9cbc173f3201343ffce9d57.reference = {
    __cReference: true,
    get value() { return DOORTILE6____header_global_ffb71ddcca022569; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:255
export const DOORTILE1____header_global_10b71df6a73543a9 = ((((((152) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d11cdedd68f764b5be1cbda8() {
  return __cxx_static_address_d11cdedd68f764b5be1cbda8.reference || (__cxx_static_address_d11cdedd68f764b5be1cbda8.reference = {
    __cReference: true,
    get value() { return DOORTILE1____header_global_10b71df6a73543a9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:256
export const DOORTILE2____header_global_425173308fe20192 = ((((((153) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9e1c1e3b178ee530a077b51b() {
  return __cxx_static_address_9e1c1e3b178ee530a077b51b.reference || (__cxx_static_address_9e1c1e3b178ee530a077b51b.reference = {
    __cReference: true,
    get value() { return DOORTILE2____header_global_425173308fe20192; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:257
export const DOORTILE3____header_global_6a473b4393b8d9f4 = ((((((154) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_58d9ed43a0739fb87e5c110f() {
  return __cxx_static_address_58d9ed43a0739fb87e5c110f.reference || (__cxx_static_address_58d9ed43a0739fb87e5c110f.reference = {
    __cReference: true,
    get value() { return DOORTILE3____header_global_6a473b4393b8d9f4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:258
export const DOORTILE4____header_global_b12beb053a684bbb = ((((((155) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6ffefcfafb670ab7cb5db30e() {
  return __cxx_static_address_6ffefcfafb670ab7cb5db30e.reference || (__cxx_static_address_6ffefcfafb670ab7cb5db30e.reference = {
    __cReference: true,
    get value() { return DOORTILE4____header_global_b12beb053a684bbb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:259
export const DOORTILE7____header_global_f89c122059a393ec = ((((((156) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d97551c39d2993366bc093d0() {
  return __cxx_static_address_d97551c39d2993366bc093d0.reference || (__cxx_static_address_d97551c39d2993366bc093d0.reference = {
    __cReference: true,
    get value() { return DOORTILE7____header_global_f89c122059a393ec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:260
export const DOORTILE8____header_global_1c7992eec307756d = ((((((157) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0572c8a68dfd55480991016d() {
  return __cxx_static_address_0572c8a68dfd55480991016d.reference || (__cxx_static_address_0572c8a68dfd55480991016d.reference = {
    __cReference: true,
    get value() { return DOORTILE8____header_global_1c7992eec307756d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:261
export const DOORTILE9____header_global_2cbaced61fce4ad5 = ((((((158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b433e6a668df005cfb4ccd45() {
  return __cxx_static_address_b433e6a668df005cfb4ccd45.reference || (__cxx_static_address_b433e6a668df005cfb4ccd45.reference = {
    __cReference: true,
    get value() { return DOORTILE9____header_global_2cbaced61fce4ad5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:262
export const DOORTILE10____header_global_8447254cf1701de3 = ((((((159) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8e3e83a46c27f1f10c17e8dc() {
  return __cxx_static_address_8e3e83a46c27f1f10c17e8dc.reference || (__cxx_static_address_8e3e83a46c27f1f10c17e8dc.reference = {
    __cReference: true,
    get value() { return DOORTILE10____header_global_8447254cf1701de3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:263
export const DOORSHOCK____header_global_79177cd9ab4bcf19 = ((((((160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_781fa1376868092a18a121b4() {
  return __cxx_static_address_781fa1376868092a18a121b4.reference || (__cxx_static_address_781fa1376868092a18a121b4.reference = {
    __cReference: true,
    get value() { return DOORSHOCK____header_global_79177cd9ab4bcf19; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:264
export const DIPSWITCH____header_global_7d5336029ca0cee5 = ((((((162) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9f95500df35d225200616693() {
  return __cxx_static_address_9f95500df35d225200616693.reference || (__cxx_static_address_9f95500df35d225200616693.reference = {
    __cReference: true,
    get value() { return DIPSWITCH____header_global_7d5336029ca0cee5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:265
export const DIPSWITCH2____header_global_8e96969977ea22bd = ((((((164) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_055836afc9f64dae1802f689() {
  return __cxx_static_address_055836afc9f64dae1802f689.reference || (__cxx_static_address_055836afc9f64dae1802f689.reference = {
    __cReference: true,
    get value() { return DIPSWITCH2____header_global_8e96969977ea22bd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:266
export const TECHSWITCH____header_global_126a0c5d38c2f4ce = ((((((166) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1aaf12becfc2484d49d033f5() {
  return __cxx_static_address_1aaf12becfc2484d49d033f5.reference || (__cxx_static_address_1aaf12becfc2484d49d033f5.reference = {
    __cReference: true,
    get value() { return TECHSWITCH____header_global_126a0c5d38c2f4ce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:267
export const DIPSWITCH3____header_global_0c6845106e5a5335 = ((((((168) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f2d8cb4aa800b9af9159240a() {
  return __cxx_static_address_f2d8cb4aa800b9af9159240a.reference || (__cxx_static_address_f2d8cb4aa800b9af9159240a.reference = {
    __cReference: true,
    get value() { return DIPSWITCH3____header_global_0c6845106e5a5335; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:268
export const ACCESSSWITCH2____header_global_421407098e4c4940 = ((((((170) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e2afee1c4152e2a877877d07() {
  return __cxx_static_address_e2afee1c4152e2a877877d07.reference || (__cxx_static_address_e2afee1c4152e2a877877d07.reference = {
    __cReference: true,
    get value() { return ACCESSSWITCH2____header_global_421407098e4c4940; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:269
export const FLOORSLIME____header_global_36534b928de0bc84 = ((((((200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_898e244626f9021f6c9514b2() {
  return __cxx_static_address_898e244626f9021f6c9514b2.reference || (__cxx_static_address_898e244626f9021f6c9514b2.reference = {
    __cReference: true,
    get value() { return FLOORSLIME____header_global_36534b928de0bc84; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:270
export const BIGFORCE____header_global_722ac17a9d5e6eab = ((((((230) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0ca5488d9be03b80a2050d0b() {
  return __cxx_static_address_0ca5488d9be03b80a2050d0b.reference || (__cxx_static_address_0ca5488d9be03b80a2050d0b.reference = {
    __cReference: true,
    get value() { return BIGFORCE____header_global_722ac17a9d5e6eab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:271
export const MASKWALL9____header_global_6625f4b52b33bae0 = ((((((255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cc56cfbbc757df8cfac3eec2() {
  return __cxx_static_address_cc56cfbbc757df8cfac3eec2.reference || (__cxx_static_address_cc56cfbbc757df8cfac3eec2.reference = {
    __cReference: true,
    get value() { return MASKWALL9____header_global_6625f4b52b33bae0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:272
export const SCREENBREAK1____header_global_dbd16896d255c638 = ((((((263) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_270319bc9c8af0fdf7a36979() {
  return __cxx_static_address_270319bc9c8af0fdf7a36979.reference || (__cxx_static_address_270319bc9c8af0fdf7a36979.reference = {
    __cReference: true,
    get value() { return SCREENBREAK1____header_global_dbd16896d255c638; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:273
export const SCREENBREAK2____header_global_01e7298c0bfd5bd5 = ((((((264) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4b1bc3ffc4c4b84864c5ccad() {
  return __cxx_static_address_4b1bc3ffc4c4b84864c5ccad.reference || (__cxx_static_address_4b1bc3ffc4c4b84864c5ccad.reference = {
    __cReference: true,
    get value() { return SCREENBREAK2____header_global_01e7298c0bfd5bd5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:274
export const SCREENBREAK3____header_global_fbb8eb772de5f0e0 = ((((((265) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_be4b43d620df54a4739d006e() {
  return __cxx_static_address_be4b43d620df54a4739d006e.reference || (__cxx_static_address_be4b43d620df54a4739d006e.reference = {
    __cReference: true,
    get value() { return SCREENBREAK3____header_global_fbb8eb772de5f0e0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:275
export const SCREENBREAK4____header_global_7ce02b6ad4f7cfd0 = ((((((266) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b0af943d0c0bd880310ad6f4() {
  return __cxx_static_address_b0af943d0c0bd880310ad6f4.reference || (__cxx_static_address_b0af943d0c0bd880310ad6f4.reference = {
    __cReference: true,
    get value() { return SCREENBREAK4____header_global_7ce02b6ad4f7cfd0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:276
export const SCREENBREAK5____header_global_dd91246b3a771303 = ((((((267) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4e9c446b32fe60080cb87ba3() {
  return __cxx_static_address_4e9c446b32fe60080cb87ba3.reference || (__cxx_static_address_4e9c446b32fe60080cb87ba3.reference = {
    __cReference: true,
    get value() { return SCREENBREAK5____header_global_dd91246b3a771303; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:277
export const SCREENBREAK6____header_global_5ed88710178f8de6 = ((((((268) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8b7d8091070d7d7d80f8413d() {
  return __cxx_static_address_8b7d8091070d7d7d80f8413d.reference || (__cxx_static_address_8b7d8091070d7d7d80f8413d.reference = {
    __cReference: true,
    get value() { return SCREENBREAK6____header_global_5ed88710178f8de6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:278
export const SCREENBREAK7____header_global_05923a502d2d947e = ((((((269) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_113af1ca1345a43bb005dd9f() {
  return __cxx_static_address_113af1ca1345a43bb005dd9f.reference || (__cxx_static_address_113af1ca1345a43bb005dd9f.reference = {
    __cReference: true,
    get value() { return SCREENBREAK7____header_global_05923a502d2d947e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:279
export const SCREENBREAK8____header_global_57288e075a1cd1c0 = ((((((270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_969458f6e6efef2d61b41b1e() {
  return __cxx_static_address_969458f6e6efef2d61b41b1e.reference || (__cxx_static_address_969458f6e6efef2d61b41b1e.reference = {
    __cReference: true,
    get value() { return SCREENBREAK8____header_global_57288e075a1cd1c0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:280
export const SCREENBREAK9____header_global_f0c614a18d2adf8a = ((((((271) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_49e0b9d0cedf067e661471be() {
  return __cxx_static_address_49e0b9d0cedf067e661471be.reference || (__cxx_static_address_49e0b9d0cedf067e661471be.reference = {
    __cReference: true,
    get value() { return SCREENBREAK9____header_global_f0c614a18d2adf8a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:281
export const SCREENBREAK10____header_global_05d1c96093cd7c13 = ((((((272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0cf8c823e47d8a264a86847f() {
  return __cxx_static_address_0cf8c823e47d8a264a86847f.reference || (__cxx_static_address_0cf8c823e47d8a264a86847f.reference = {
    __cReference: true,
    get value() { return SCREENBREAK10____header_global_05d1c96093cd7c13; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:282
export const SCREENBREAK11____header_global_6965fa6b04e98907 = ((((((273) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f981b7f264202d4f39aef290() {
  return __cxx_static_address_f981b7f264202d4f39aef290.reference || (__cxx_static_address_f981b7f264202d4f39aef290.reference = {
    __cReference: true,
    get value() { return SCREENBREAK11____header_global_6965fa6b04e98907; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:283
export const SCREENBREAK12____header_global_97e8e34915f73592 = ((((((274) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e2ec7d8993afa4e81ca5f85b() {
  return __cxx_static_address_e2ec7d8993afa4e81ca5f85b.reference || (__cxx_static_address_e2ec7d8993afa4e81ca5f85b.reference = {
    __cReference: true,
    get value() { return SCREENBREAK12____header_global_97e8e34915f73592; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:284
export const SCREENBREAK13____header_global_450e482f4a99b548 = ((((((275) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cda88e75b1b1dbc4de761838() {
  return __cxx_static_address_cda88e75b1b1dbc4de761838.reference || (__cxx_static_address_cda88e75b1b1dbc4de761838.reference = {
    __cReference: true,
    get value() { return SCREENBREAK13____header_global_450e482f4a99b548; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:285
export const MASKWALL1____header_global_00008f7722f92258 = ((((((285) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bfa4a4c803250be1445a5171() {
  return __cxx_static_address_bfa4a4c803250be1445a5171.reference || (__cxx_static_address_bfa4a4c803250be1445a5171.reference = {
    __cReference: true,
    get value() { return MASKWALL1____header_global_00008f7722f92258; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:286
export const W_TECHWALL1____header_global_8608eac55323e006 = ((((((293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d282249f430dae212d754ad9() {
  return __cxx_static_address_d282249f430dae212d754ad9.reference || (__cxx_static_address_d282249f430dae212d754ad9.reference = {
    __cReference: true,
    get value() { return W_TECHWALL1____header_global_8608eac55323e006; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:287
export const W_TECHWALL2____header_global_ccf55a598db9e771 = ((((((297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bb98ebbc4912ccad10552e68() {
  return __cxx_static_address_bb98ebbc4912ccad10552e68.reference || (__cxx_static_address_bb98ebbc4912ccad10552e68.reference = {
    __cReference: true,
    get value() { return W_TECHWALL2____header_global_ccf55a598db9e771; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:288
export const W_TECHWALL15____header_global_959154c7c539ed31 = ((((((299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1fcbe6c3d260247fcb3a4b13() {
  return __cxx_static_address_1fcbe6c3d260247fcb3a4b13.reference || (__cxx_static_address_1fcbe6c3d260247fcb3a4b13.reference = {
    __cReference: true,
    get value() { return W_TECHWALL15____header_global_959154c7c539ed31; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:289
export const W_TECHWALL3____header_global_a8303321c1480835 = ((((((301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4e24f3a844d64c5088a6875b() {
  return __cxx_static_address_4e24f3a844d64c5088a6875b.reference || (__cxx_static_address_4e24f3a844d64c5088a6875b.reference = {
    __cReference: true,
    get value() { return W_TECHWALL3____header_global_a8303321c1480835; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:290
export const W_TECHWALL4____header_global_a4bcd7cf22f603b7 = ((((((305) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_abe493e6aabaf2b1560f1de6() {
  return __cxx_static_address_abe493e6aabaf2b1560f1de6.reference || (__cxx_static_address_abe493e6aabaf2b1560f1de6.reference = {
    __cReference: true,
    get value() { return W_TECHWALL4____header_global_a4bcd7cf22f603b7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:291
export const W_TECHWALL10____header_global_09cc45e808ec55e9 = ((((((306) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_32ae5c5c9ea83893056abe9c() {
  return __cxx_static_address_32ae5c5c9ea83893056abe9c.reference || (__cxx_static_address_32ae5c5c9ea83893056abe9c.reference = {
    __cReference: true,
    get value() { return W_TECHWALL10____header_global_09cc45e808ec55e9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:292
export const W_TECHWALL16____header_global_ac9aae1fc0db2bc5 = ((((((307) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e5fd2856c8e80bd07fcadb30() {
  return __cxx_static_address_e5fd2856c8e80bd07fcadb30.reference || (__cxx_static_address_e5fd2856c8e80bd07fcadb30.reference = {
    __cReference: true,
    get value() { return W_TECHWALL16____header_global_ac9aae1fc0db2bc5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:293
export const WATERTILE2____header_global_60be6a1e48299b1f = ((((((336) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e19d82eb7253d1239639f5ad() {
  return __cxx_static_address_e19d82eb7253d1239639f5ad.reference || (__cxx_static_address_e19d82eb7253d1239639f5ad.reference = {
    __cReference: true,
    get value() { return WATERTILE2____header_global_60be6a1e48299b1f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:294
export const BPANNEL1____header_global_9ea351fc939241bd = ((((((341) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0a22b579edcdc027f1a453aa() {
  return __cxx_static_address_0a22b579edcdc027f1a453aa.reference || (__cxx_static_address_0a22b579edcdc027f1a453aa.reference = {
    __cReference: true,
    get value() { return BPANNEL1____header_global_9ea351fc939241bd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:295
export const PANNEL1____header_global_7909addc6aa3fe7d = ((((((342) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_02dacfdfda1fc18fe8980cc1() {
  return __cxx_static_address_02dacfdfda1fc18fe8980cc1.reference || (__cxx_static_address_02dacfdfda1fc18fe8980cc1.reference = {
    __cReference: true,
    get value() { return PANNEL1____header_global_7909addc6aa3fe7d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:296
export const PANNEL2____header_global_2dc8a275e0f86618 = ((((((343) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_302f1629b67f91ac65e66fad() {
  return __cxx_static_address_302f1629b67f91ac65e66fad.reference || (__cxx_static_address_302f1629b67f91ac65e66fad.reference = {
    __cReference: true,
    get value() { return PANNEL2____header_global_2dc8a275e0f86618; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:297
export const STATIC____header_global_19290d990d23f8d7 = ((((((351) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0836a084eb5797cc6f931afb() {
  return __cxx_static_address_0836a084eb5797cc6f931afb.reference || (__cxx_static_address_0836a084eb5797cc6f931afb.reference = {
    __cReference: true,
    get value() { return STATIC____header_global_19290d990d23f8d7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:298
export const W_SCREENBREAK____header_global_04d600e1ef9550c3 = ((((((357) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_22cf7044731f611cd819c5a4() {
  return __cxx_static_address_22cf7044731f611cd819c5a4.reference || (__cxx_static_address_22cf7044731f611cd819c5a4.reference = {
    __cReference: true,
    get value() { return W_SCREENBREAK____header_global_04d600e1ef9550c3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:299
export const W_HITTECHWALL3____header_global_f12457f80afa4d11 = ((((((360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d2cf138f8b07e289c7fb5019() {
  return __cxx_static_address_d2cf138f8b07e289c7fb5019.reference || (__cxx_static_address_d2cf138f8b07e289c7fb5019.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL3____header_global_f12457f80afa4d11; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:300
export const W_HITTECHWALL4____header_global_b430636306a6d361 = ((((((361) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_067106da350fcc10541797a3() {
  return __cxx_static_address_067106da350fcc10541797a3.reference || (__cxx_static_address_067106da350fcc10541797a3.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL4____header_global_b430636306a6d361; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:301
export const W_HITTECHWALL2____header_global_4d8ae7baa76df852 = ((((((362) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_43be87de887ad373002c9e0f() {
  return __cxx_static_address_43be87de887ad373002c9e0f.reference || (__cxx_static_address_43be87de887ad373002c9e0f.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL2____header_global_4d8ae7baa76df852; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:302
export const W_HITTECHWALL1____header_global_95fce6a6fbda9aa7 = ((((((363) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_312b04111595252d91d3e333() {
  return __cxx_static_address_312b04111595252d91d3e333.reference || (__cxx_static_address_312b04111595252d91d3e333.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL1____header_global_95fce6a6fbda9aa7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:303
export const MASKWALL10____header_global_0cc03d0c1d9e09bb = ((((((387) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c3692265ff6260a7a88dae5d() {
  return __cxx_static_address_c3692265ff6260a7a88dae5d.reference || (__cxx_static_address_c3692265ff6260a7a88dae5d.reference = {
    __cReference: true,
    get value() { return MASKWALL10____header_global_0cc03d0c1d9e09bb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:304
export const MASKWALL11____header_global_5862dc456414cd42 = ((((((391) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5a17315a0f848c2f72bb16bd() {
  return __cxx_static_address_5a17315a0f848c2f72bb16bd.reference || (__cxx_static_address_5a17315a0f848c2f72bb16bd.reference = {
    __cReference: true,
    get value() { return MASKWALL11____header_global_5862dc456414cd42; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:305
export const DOORTILE22____header_global_6d5a088f9cf20086 = ((((((395) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_43c89ac1de9995ce2c47e857() {
  return __cxx_static_address_43c89ac1de9995ce2c47e857.reference || (__cxx_static_address_43c89ac1de9995ce2c47e857.reference = {
    __cReference: true,
    get value() { return DOORTILE22____header_global_6d5a088f9cf20086; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:306
export const FANSPRITE____header_global_e0e5690f02406a10 = ((((((407) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bb02dc3602cf5507cf74114e() {
  return __cxx_static_address_bb02dc3602cf5507cf74114e.reference || (__cxx_static_address_bb02dc3602cf5507cf74114e.reference = {
    __cReference: true,
    get value() { return FANSPRITE____header_global_e0e5690f02406a10; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:307
export const FANSPRITEBROKE____header_global_5ae17732153e383f = ((((((411) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_658ef052586e3f9d27efbac5() {
  return __cxx_static_address_658ef052586e3f9d27efbac5.reference || (__cxx_static_address_658ef052586e3f9d27efbac5.reference = {
    __cReference: true,
    get value() { return FANSPRITEBROKE____header_global_5ae17732153e383f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:308
export const FANSHADOW____header_global_1b721b0c1c3b8e01 = ((((((412) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_758603757dc16f3a73d92ebb() {
  return __cxx_static_address_758603757dc16f3a73d92ebb.reference || (__cxx_static_address_758603757dc16f3a73d92ebb.reference = {
    __cReference: true,
    get value() { return FANSHADOW____header_global_1b721b0c1c3b8e01; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:309
export const FANSHADOWBROKE____header_global_bcfa1eec39419618 = ((((((416) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f1ed8e6bb69314c0b6831688() {
  return __cxx_static_address_f1ed8e6bb69314c0b6831688.reference || (__cxx_static_address_f1ed8e6bb69314c0b6831688.reference = {
    __cReference: true,
    get value() { return FANSHADOWBROKE____header_global_bcfa1eec39419618; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:310
export const DOORTILE18____header_global_e18d17df9d621cb5 = ((((((447) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eb310a83ee21d6c1317c0985() {
  return __cxx_static_address_eb310a83ee21d6c1317c0985.reference || (__cxx_static_address_eb310a83ee21d6c1317c0985.reference = {
    __cReference: true,
    get value() { return DOORTILE18____header_global_e18d17df9d621cb5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:311
export const DOORTILE19____header_global_56d22b50fd2edca9 = ((((((448) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cab9f13347faac501e7b4f6f() {
  return __cxx_static_address_cab9f13347faac501e7b4f6f.reference || (__cxx_static_address_cab9f13347faac501e7b4f6f.reference = {
    __cReference: true,
    get value() { return DOORTILE19____header_global_56d22b50fd2edca9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:312
export const DOORTILE20____header_global_01785066b3949f28 = ((((((449) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cd5a7f21781e1675078ccf62() {
  return __cxx_static_address_cd5a7f21781e1675078ccf62.reference || (__cxx_static_address_cd5a7f21781e1675078ccf62.reference = {
    __cReference: true,
    get value() { return DOORTILE20____header_global_01785066b3949f28; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:313
export const VIEWSCREEN2____header_global_dd80f413da2c2e29 = ((((((499) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fef917ae6279f7371bb9740a() {
  return __cxx_static_address_fef917ae6279f7371bb9740a.reference || (__cxx_static_address_fef917ae6279f7371bb9740a.reference = {
    __cReference: true,
    get value() { return VIEWSCREEN2____header_global_dd80f413da2c2e29; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:314
export const VIEWSCREEN____header_global_5ce87691631d77e7 = ((((((502) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_92e0dfcd68a2e02dd36c3f34() {
  return __cxx_static_address_92e0dfcd68a2e02dd36c3f34.reference || (__cxx_static_address_92e0dfcd68a2e02dd36c3f34.reference = {
    __cReference: true,
    get value() { return VIEWSCREEN____header_global_5ce87691631d77e7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:315
export const GLASS____header_global_eb38896d8f46f13d = ((((((503) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_56632cecb18122ebb5238079() {
  return __cxx_static_address_56632cecb18122ebb5238079.reference || (__cxx_static_address_56632cecb18122ebb5238079.reference = {
    __cReference: true,
    get value() { return GLASS____header_global_eb38896d8f46f13d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:316
export const GLASS2____header_global_ca00791d8837bc5f = ((((((504) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_584438f194d1e81f777080ec() {
  return __cxx_static_address_584438f194d1e81f777080ec.reference || (__cxx_static_address_584438f194d1e81f777080ec.reference = {
    __cReference: true,
    get value() { return GLASS2____header_global_ca00791d8837bc5f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:317
export const STAINGLASS1____header_global_2a25d4098c44f2db = ((((((510) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cd6f6b86c52aab36730abdcc() {
  return __cxx_static_address_cd6f6b86c52aab36730abdcc.reference || (__cxx_static_address_cd6f6b86c52aab36730abdcc.reference = {
    __cReference: true,
    get value() { return STAINGLASS1____header_global_2a25d4098c44f2db; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:318
export const MASKWALL5____header_global_0b2e27deb031153c = ((((((514) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0a015d610df01b3ccda22767() {
  return __cxx_static_address_0a015d610df01b3ccda22767.reference || (__cxx_static_address_0a015d610df01b3ccda22767.reference = {
    __cReference: true,
    get value() { return MASKWALL5____header_global_0b2e27deb031153c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:319
export const SATELITE____header_global_9ebcd36801a45894 = ((((((516) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4c30cd5e139ae97b8c8159a8() {
  return __cxx_static_address_4c30cd5e139ae97b8c8159a8.reference || (__cxx_static_address_4c30cd5e139ae97b8c8159a8.reference = {
    __cReference: true,
    get value() { return SATELITE____header_global_9ebcd36801a45894; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:320
export const FUELPOD____header_global_c51b93436793c3eb = ((((((517) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_12b192110b2ff7d06c8ec9e3() {
  return __cxx_static_address_12b192110b2ff7d06c8ec9e3.reference || (__cxx_static_address_12b192110b2ff7d06c8ec9e3.reference = {
    __cReference: true,
    get value() { return FUELPOD____header_global_c51b93436793c3eb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:321
export const CRACK1____header_global_8ed3c1311503ed1e = ((((((546) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_57d07682fdd944b329f50c04() {
  return __cxx_static_address_57d07682fdd944b329f50c04.reference || (__cxx_static_address_57d07682fdd944b329f50c04.reference = {
    __cReference: true,
    get value() { return CRACK1____header_global_8ed3c1311503ed1e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:322
export const CRACK2____header_global_a2485e4d4490b9bc = ((((((547) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_932183c3f45bc9882e276eb7() {
  return __cxx_static_address_932183c3f45bc9882e276eb7.reference || (__cxx_static_address_932183c3f45bc9882e276eb7.reference = {
    __cReference: true,
    get value() { return CRACK2____header_global_a2485e4d4490b9bc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:323
export const CRACK3____header_global_774142724249a7e1 = ((((((548) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4fcefca3c3a2f8d19ee9cbb1() {
  return __cxx_static_address_4fcefca3c3a2f8d19ee9cbb1.reference || (__cxx_static_address_4fcefca3c3a2f8d19ee9cbb1.reference = {
    __cReference: true,
    get value() { return CRACK3____header_global_774142724249a7e1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:324
export const CRACK4____header_global_51ec1a41afb2b4cc = ((((((549) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_114d6265a2cfe31b2a6424e5() {
  return __cxx_static_address_114d6265a2cfe31b2a6424e5.reference || (__cxx_static_address_114d6265a2cfe31b2a6424e5.reference = {
    __cReference: true,
    get value() { return CRACK4____header_global_51ec1a41afb2b4cc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:325
export const FOOTPRINTS____header_global_eb96c812f6ec374f = ((((((550) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cc0ce921d11d6574169ce3b9() {
  return __cxx_static_address_cc0ce921d11d6574169ce3b9.reference || (__cxx_static_address_cc0ce921d11d6574169ce3b9.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS____header_global_eb96c812f6ec374f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:326
export const DOMELITE____header_global_2e4d35e06f457032 = ((((((551) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_04839b7fb9100c1a8f2d42ef() {
  return __cxx_static_address_04839b7fb9100c1a8f2d42ef.reference || (__cxx_static_address_04839b7fb9100c1a8f2d42ef.reference = {
    __cReference: true,
    get value() { return DOMELITE____header_global_2e4d35e06f457032; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:327
export const CAMERAPOLE____header_global_7b5a5924d2827182 = ((((((554) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6a937dd1705d6def8f19ddd0() {
  return __cxx_static_address_6a937dd1705d6def8f19ddd0.reference || (__cxx_static_address_6a937dd1705d6def8f19ddd0.reference = {
    __cReference: true,
    get value() { return CAMERAPOLE____header_global_7b5a5924d2827182; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:328
export const CHAIR1____header_global_c52b09ad9d6a8452 = ((((((556) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8ce2d55c24cfe5adc4aa8f92() {
  return __cxx_static_address_8ce2d55c24cfe5adc4aa8f92.reference || (__cxx_static_address_8ce2d55c24cfe5adc4aa8f92.reference = {
    __cReference: true,
    get value() { return CHAIR1____header_global_c52b09ad9d6a8452; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:329
export const CHAIR2____header_global_c3fa651d5b7fb4ab = ((((((557) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_507b8b695fc8978e9ab244cc() {
  return __cxx_static_address_507b8b695fc8978e9ab244cc.reference || (__cxx_static_address_507b8b695fc8978e9ab244cc.reference = {
    __cReference: true,
    get value() { return CHAIR2____header_global_c3fa651d5b7fb4ab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:330
export const BROKENCHAIR____header_global_90c988d876cb38cf = ((((((559) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7d3c438368e334e325fac0dc() {
  return __cxx_static_address_7d3c438368e334e325fac0dc.reference || (__cxx_static_address_7d3c438368e334e325fac0dc.reference = {
    __cReference: true,
    get value() { return BROKENCHAIR____header_global_90c988d876cb38cf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:331
export const MIRROR____header_global_68930fdf6b124eea = ((((((560) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cb39a97a0aadf48ce2b77a40() {
  return __cxx_static_address_cb39a97a0aadf48ce2b77a40.reference || (__cxx_static_address_cb39a97a0aadf48ce2b77a40.reference = {
    __cReference: true,
    get value() { return MIRROR____header_global_68930fdf6b124eea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:332
export const WATERFOUNTAIN____header_global_842f246fcb6a8e81 = ((((((563) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4cf36074dd2f05170edbbbe1() {
  return __cxx_static_address_4cf36074dd2f05170edbbbe1.reference || (__cxx_static_address_4cf36074dd2f05170edbbbe1.reference = {
    __cReference: true,
    get value() { return WATERFOUNTAIN____header_global_842f246fcb6a8e81; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:333
export const WATERFOUNTAINBROKE____header_global_e811d19c2af9cf12 = ((((((567) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b0c29b0df8b8097d8f2acb15() {
  return __cxx_static_address_b0c29b0df8b8097d8f2acb15.reference || (__cxx_static_address_b0c29b0df8b8097d8f2acb15.reference = {
    __cReference: true,
    get value() { return WATERFOUNTAINBROKE____header_global_e811d19c2af9cf12; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:334
export const FEMMAG1____header_global_33d82a27a81a162c = ((((((568) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_82a836f7467b653d3b1e66a0() {
  return __cxx_static_address_82a836f7467b653d3b1e66a0.reference || (__cxx_static_address_82a836f7467b653d3b1e66a0.reference = {
    __cReference: true,
    get value() { return FEMMAG1____header_global_33d82a27a81a162c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:335
export const TOILET____header_global_9d60d6d9636277e2 = ((((((569) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7738850dd355973de40ce089() {
  return __cxx_static_address_7738850dd355973de40ce089.reference || (__cxx_static_address_7738850dd355973de40ce089.reference = {
    __cReference: true,
    get value() { return TOILET____header_global_9d60d6d9636277e2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:336
export const STALL____header_global_a12483096f0e12af = ((((((571) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1d8f1e1f6e01c278185680f9() {
  return __cxx_static_address_1d8f1e1f6e01c278185680f9.reference || (__cxx_static_address_1d8f1e1f6e01c278185680f9.reference = {
    __cReference: true,
    get value() { return STALL____header_global_a12483096f0e12af; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:337
export const STALLBROKE____header_global_24497e39d1324c9d = ((((((573) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_19720552ad8b490b74495728() {
  return __cxx_static_address_19720552ad8b490b74495728.reference || (__cxx_static_address_19720552ad8b490b74495728.reference = {
    __cReference: true,
    get value() { return STALLBROKE____header_global_24497e39d1324c9d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:338
export const FEMMAG2____header_global_1635d7b3ffb16c4e = ((((((577) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8adaea4859030c8305ce07c1() {
  return __cxx_static_address_8adaea4859030c8305ce07c1.reference || (__cxx_static_address_8adaea4859030c8305ce07c1.reference = {
    __cReference: true,
    get value() { return FEMMAG2____header_global_1635d7b3ffb16c4e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:339
export const REACTOR2____header_global_31040b04cb3b5a0a = ((((((578) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c1608d07477905ac5b521690() {
  return __cxx_static_address_c1608d07477905ac5b521690.reference || (__cxx_static_address_c1608d07477905ac5b521690.reference = {
    __cReference: true,
    get value() { return REACTOR2____header_global_31040b04cb3b5a0a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:340
export const REACTOR2BURNT____header_global_fa1eb5975d06a908 = ((((((579) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f082852d956b7e17018e1f58() {
  return __cxx_static_address_f082852d956b7e17018e1f58.reference || (__cxx_static_address_f082852d956b7e17018e1f58.reference = {
    __cReference: true,
    get value() { return REACTOR2BURNT____header_global_fa1eb5975d06a908; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:341
export const REACTOR2SPARK____header_global_61d6c9dfdfdc6de3 = ((((((580) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5f081afb2eac559208d2e2c7() {
  return __cxx_static_address_5f081afb2eac559208d2e2c7.reference || (__cxx_static_address_5f081afb2eac559208d2e2c7.reference = {
    __cReference: true,
    get value() { return REACTOR2SPARK____header_global_61d6c9dfdfdc6de3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:342
export const GRATE1____header_global_a0e0181a305d3ae2 = ((((((595) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1945e1fe2f592897a2935265() {
  return __cxx_static_address_1945e1fe2f592897a2935265.reference || (__cxx_static_address_1945e1fe2f592897a2935265.reference = {
    __cReference: true,
    get value() { return GRATE1____header_global_a0e0181a305d3ae2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:343
export const BGRATE1____header_global_ab9a0050669441b1 = ((((((596) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_391076c7c59df30d18a0f21a() {
  return __cxx_static_address_391076c7c59df30d18a0f21a.reference || (__cxx_static_address_391076c7c59df30d18a0f21a.reference = {
    __cReference: true,
    get value() { return BGRATE1____header_global_ab9a0050669441b1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:344
export const SOLARPANNEL____header_global_bfa6ad4724dbad69 = ((((((602) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7f1aae067532c220701fc029() {
  return __cxx_static_address_7f1aae067532c220701fc029.reference || (__cxx_static_address_7f1aae067532c220701fc029.reference = {
    __cReference: true,
    get value() { return SOLARPANNEL____header_global_bfa6ad4724dbad69; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:345
export const NAKED1____header_global_3b1f045cade6e433 = ((((((603) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c3daf92011dd618bc198a617() {
  return __cxx_static_address_c3daf92011dd618bc198a617.reference || (__cxx_static_address_c3daf92011dd618bc198a617.reference = {
    __cReference: true,
    get value() { return NAKED1____header_global_3b1f045cade6e433; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:346
export const ANTENNA____header_global_f88cf26670eddadc = ((((((607) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7c175fd7c35df13e4d15205e() {
  return __cxx_static_address_7c175fd7c35df13e4d15205e.reference || (__cxx_static_address_7c175fd7c35df13e4d15205e.reference = {
    __cReference: true,
    get value() { return ANTENNA____header_global_f88cf26670eddadc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:347
export const MASKWALL12____header_global_64d15ebe7879d1b9 = ((((((609) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b1ae3ff69933db06e21e3534() {
  return __cxx_static_address_b1ae3ff69933db06e21e3534.reference || (__cxx_static_address_b1ae3ff69933db06e21e3534.reference = {
    __cReference: true,
    get value() { return MASKWALL12____header_global_64d15ebe7879d1b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:348
export const TOILETBROKE____header_global_128f5e537ed6527d = ((((((615) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_56111f87d8bdc5b820cdf092() {
  return __cxx_static_address_56111f87d8bdc5b820cdf092.reference || (__cxx_static_address_56111f87d8bdc5b820cdf092.reference = {
    __cReference: true,
    get value() { return TOILETBROKE____header_global_128f5e537ed6527d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:349
export const PIPE2____header_global_008c0d1fd489a62c = ((((((616) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_29a4fd68d850fc3932576e1b() {
  return __cxx_static_address_29a4fd68d850fc3932576e1b.reference || (__cxx_static_address_29a4fd68d850fc3932576e1b.reference = {
    __cReference: true,
    get value() { return PIPE2____header_global_008c0d1fd489a62c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:350
export const PIPE1B____header_global_42512eafdfb31a88 = ((((((617) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_34d641a093847b5d3c24a153() {
  return __cxx_static_address_34d641a093847b5d3c24a153.reference || (__cxx_static_address_34d641a093847b5d3c24a153.reference = {
    __cReference: true,
    get value() { return PIPE1B____header_global_42512eafdfb31a88; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:351
export const PIPE3____header_global_71e23eb64f2d1d8a = ((((((618) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_00f78b7383143c72c05943e9() {
  return __cxx_static_address_00f78b7383143c72c05943e9.reference || (__cxx_static_address_00f78b7383143c72c05943e9.reference = {
    __cReference: true,
    get value() { return PIPE3____header_global_71e23eb64f2d1d8a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:352
export const PIPE1____header_global_334db4dd80f7808e = ((((((619) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_46350b955eab0b9083cb1fa7() {
  return __cxx_static_address_46350b955eab0b9083cb1fa7.reference || (__cxx_static_address_46350b955eab0b9083cb1fa7.reference = {
    __cReference: true,
    get value() { return PIPE1____header_global_334db4dd80f7808e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:353
export const CAMERA1____header_global_2c108357123a2d74 = ((((((621) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_76735d782d691a6ddc7f69e5() {
  return __cxx_static_address_76735d782d691a6ddc7f69e5.reference || (__cxx_static_address_76735d782d691a6ddc7f69e5.reference = {
    __cReference: true,
    get value() { return CAMERA1____header_global_2c108357123a2d74; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:354
export const PIPE2B____header_global_a129ef66f4a1dff4 = ((((((633) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_45575fb47c48590040d99904() {
  return __cxx_static_address_45575fb47c48590040d99904.reference || (__cxx_static_address_45575fb47c48590040d99904.reference = {
    __cReference: true,
    get value() { return PIPE2B____header_global_a129ef66f4a1dff4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:355
export const BOLT1____header_global_ed475865f1b51d6e = ((((((634) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2766a3c7f90bd93d6f5680c9() {
  return __cxx_static_address_2766a3c7f90bd93d6f5680c9.reference || (__cxx_static_address_2766a3c7f90bd93d6f5680c9.reference = {
    __cReference: true,
    get value() { return BOLT1____header_global_ed475865f1b51d6e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:356
export const W_NUMBERS____header_global_966f5c97da3f8805 = ((((((640) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bb99fbaedcba38d8761e43b2() {
  return __cxx_static_address_bb99fbaedcba38d8761e43b2.reference || (__cxx_static_address_bb99fbaedcba38d8761e43b2.reference = {
    __cReference: true,
    get value() { return W_NUMBERS____header_global_966f5c97da3f8805; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:357
export const WATERDRIP____header_global_3459d4772b2f1bbc = ((((((660) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_285e1cb7da1eac6b746a8e71() {
  return __cxx_static_address_285e1cb7da1eac6b746a8e71.reference || (__cxx_static_address_285e1cb7da1eac6b746a8e71.reference = {
    __cReference: true,
    get value() { return WATERDRIP____header_global_3459d4772b2f1bbc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:358
export const WATERBUBBLE____header_global_6315f3cd61681353 = ((((((661) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7d54b0b2c0e0e024869dccd6() {
  return __cxx_static_address_7d54b0b2c0e0e024869dccd6.reference || (__cxx_static_address_7d54b0b2c0e0e024869dccd6.reference = {
    __cReference: true,
    get value() { return WATERBUBBLE____header_global_6315f3cd61681353; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:359
export const WATERBUBBLEMAKER____header_global_498667646dcc534e = ((((((662) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a86102048e540b9b2001296d() {
  return __cxx_static_address_a86102048e540b9b2001296d.reference || (__cxx_static_address_a86102048e540b9b2001296d.reference = {
    __cReference: true,
    get value() { return WATERBUBBLEMAKER____header_global_498667646dcc534e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:360
export const W_FORCEFIELD____header_global_b7bffdda0dec2594 = ((((((663) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5fa48bb72fdc782fe5b4f3e8() {
  return __cxx_static_address_5fa48bb72fdc782fe5b4f3e8.reference || (__cxx_static_address_5fa48bb72fdc782fe5b4f3e8.reference = {
    __cReference: true,
    get value() { return W_FORCEFIELD____header_global_b7bffdda0dec2594; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:361
export const VACUUM____header_global_10db8291fbd7ed71 = ((((((669) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f36366ac854f8bf65611a4b2() {
  return __cxx_static_address_f36366ac854f8bf65611a4b2.reference || (__cxx_static_address_f36366ac854f8bf65611a4b2.reference = {
    __cReference: true,
    get value() { return VACUUM____header_global_10db8291fbd7ed71; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:362
export const FOOTPRINTS2____header_global_5e954088c7495274 = ((((((672) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_49500d3b6ec9fa4c494e0279() {
  return __cxx_static_address_49500d3b6ec9fa4c494e0279.reference || (__cxx_static_address_49500d3b6ec9fa4c494e0279.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS2____header_global_5e954088c7495274; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:363
export const FOOTPRINTS3____header_global_2223f556ed51753e = ((((((673) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_de5e1a2ba99e03092e268faf() {
  return __cxx_static_address_de5e1a2ba99e03092e268faf.reference || (__cxx_static_address_de5e1a2ba99e03092e268faf.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS3____header_global_2223f556ed51753e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:364
export const FOOTPRINTS4____header_global_913a350ced07dadc = ((((((674) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ed9ea1bc0be8f539a1439b57() {
  return __cxx_static_address_ed9ea1bc0be8f539a1439b57.reference || (__cxx_static_address_ed9ea1bc0be8f539a1439b57.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS4____header_global_913a350ced07dadc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:365
export const EGG____header_global_618d66b509da15d4 = ((((((675) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c52590cc70e13d598e295aae() {
  return __cxx_static_address_c52590cc70e13d598e295aae.reference || (__cxx_static_address_c52590cc70e13d598e295aae.reference = {
    __cReference: true,
    get value() { return EGG____header_global_618d66b509da15d4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:366
export const SCALE____header_global_6cec5884ed19eca1 = ((((((678) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f98efe45c819289a90ebaac3() {
  return __cxx_static_address_f98efe45c819289a90ebaac3.reference || (__cxx_static_address_f98efe45c819289a90ebaac3.reference = {
    __cReference: true,
    get value() { return SCALE____header_global_6cec5884ed19eca1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:367
export const CHAIR3____header_global_38c9b3d23261467a = ((((((680) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6f2d284974a2b27b224d4e86() {
  return __cxx_static_address_6f2d284974a2b27b224d4e86.reference || (__cxx_static_address_6f2d284974a2b27b224d4e86.reference = {
    __cReference: true,
    get value() { return CHAIR3____header_global_38c9b3d23261467a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:368
export const CAMERALIGHT____header_global_27d5cc2296bb7f9e = ((((((685) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8d068aa0548c056a77624120() {
  return __cxx_static_address_8d068aa0548c056a77624120.reference || (__cxx_static_address_8d068aa0548c056a77624120.reference = {
    __cReference: true,
    get value() { return CAMERALIGHT____header_global_27d5cc2296bb7f9e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:369
export const MOVIECAMERA____header_global_051547fb2bfd87c1 = ((((((686) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b7f30d36be79b64dbf7ac96e() {
  return __cxx_static_address_b7f30d36be79b64dbf7ac96e.reference || (__cxx_static_address_b7f30d36be79b64dbf7ac96e.reference = {
    __cReference: true,
    get value() { return MOVIECAMERA____header_global_051547fb2bfd87c1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:370
export const IVUNIT____header_global_b9bdceec1a03fcc8 = ((((((689) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5fa43217e5488ef8205167eb() {
  return __cxx_static_address_5fa43217e5488ef8205167eb.reference || (__cxx_static_address_5fa43217e5488ef8205167eb.reference = {
    __cReference: true,
    get value() { return IVUNIT____header_global_b9bdceec1a03fcc8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:371
export const POT1____header_global_f709f3b0f40e6751 = ((((((694) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c6a2bd4b648ad343be229663() {
  return __cxx_static_address_c6a2bd4b648ad343be229663.reference || (__cxx_static_address_c6a2bd4b648ad343be229663.reference = {
    __cReference: true,
    get value() { return POT1____header_global_f709f3b0f40e6751; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:372
export const POT2____header_global_09c1dc75ddadfc73 = ((((((695) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_22c11b499179e7b4b6f6a3b8() {
  return __cxx_static_address_22c11b499179e7b4b6f6a3b8.reference || (__cxx_static_address_22c11b499179e7b4b6f6a3b8.reference = {
    __cReference: true,
    get value() { return POT2____header_global_09c1dc75ddadfc73; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:373
export const POT3____header_global_9ac711379567b9b6 = ((((((697) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_47095e2e00850851eb9b57d5() {
  return __cxx_static_address_47095e2e00850851eb9b57d5.reference || (__cxx_static_address_47095e2e00850851eb9b57d5.reference = {
    __cReference: true,
    get value() { return POT3____header_global_9ac711379567b9b6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:374
export const PIPE3B____header_global_90dc117eb3dedd6f = ((((((700) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bc8fc7fefd05318b7db697a5() {
  return __cxx_static_address_bc8fc7fefd05318b7db697a5.reference || (__cxx_static_address_bc8fc7fefd05318b7db697a5.reference = {
    __cReference: true,
    get value() { return PIPE3B____header_global_90dc117eb3dedd6f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:375
export const WALLLIGHT3____header_global_f17ae53f4082c00b = ((((((701) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aad63eb88ae35c76b1703459() {
  return __cxx_static_address_aad63eb88ae35c76b1703459.reference || (__cxx_static_address_aad63eb88ae35c76b1703459.reference = {
    __cReference: true,
    get value() { return WALLLIGHT3____header_global_f17ae53f4082c00b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:376
export const WALLLIGHTBUST3____header_global_1425fb68acb51873 = ((((((702) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_da0729bdc692cde66e58a122() {
  return __cxx_static_address_da0729bdc692cde66e58a122.reference || (__cxx_static_address_da0729bdc692cde66e58a122.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST3____header_global_1425fb68acb51873; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:377
export const WALLLIGHT1____header_global_ddb0e33ef476578d = ((((((703) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_61ea7640b8deb176b6dd1aaf() {
  return __cxx_static_address_61ea7640b8deb176b6dd1aaf.reference || (__cxx_static_address_61ea7640b8deb176b6dd1aaf.reference = {
    __cReference: true,
    get value() { return WALLLIGHT1____header_global_ddb0e33ef476578d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:378
export const WALLLIGHTBUST1____header_global_6fbc67d4539bdcbd = ((((((704) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_971a583c8dc2ce13c346d269() {
  return __cxx_static_address_971a583c8dc2ce13c346d269.reference || (__cxx_static_address_971a583c8dc2ce13c346d269.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST1____header_global_6fbc67d4539bdcbd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:379
export const WALLLIGHT2____header_global_116f90166c26b7e0 = ((((((705) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6a009aada48684a5576e0d49() {
  return __cxx_static_address_6a009aada48684a5576e0d49.reference || (__cxx_static_address_6a009aada48684a5576e0d49.reference = {
    __cReference: true,
    get value() { return WALLLIGHT2____header_global_116f90166c26b7e0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:380
export const WALLLIGHTBUST2____header_global_2c8f4d917bf3e385 = ((((((706) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1b02dc85c1bda478a6f08451() {
  return __cxx_static_address_1b02dc85c1bda478a6f08451.reference || (__cxx_static_address_1b02dc85c1bda478a6f08451.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST2____header_global_2c8f4d917bf3e385; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:381
export const LIGHTSWITCH2____header_global_a472cd050b62c8c6 = ((((((712) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b890492112578b641a66c517() {
  return __cxx_static_address_b890492112578b641a66c517.reference || (__cxx_static_address_b890492112578b641a66c517.reference = {
    __cReference: true,
    get value() { return LIGHTSWITCH2____header_global_a472cd050b62c8c6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:382
export const WAITTOBESEATED____header_global_cc55a114a28a8fbf = ((((((716) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0bf4f13c4adaf705af8729cf() {
  return __cxx_static_address_0bf4f13c4adaf705af8729cf.reference || (__cxx_static_address_0bf4f13c4adaf705af8729cf.reference = {
    __cReference: true,
    get value() { return WAITTOBESEATED____header_global_cc55a114a28a8fbf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:383
export const DOORTILE14____header_global_97b2c5a35ca93e34 = ((((((717) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_67be3ab3acf64d0e9e70c3df() {
  return __cxx_static_address_67be3ab3acf64d0e9e70c3df.reference || (__cxx_static_address_67be3ab3acf64d0e9e70c3df.reference = {
    __cReference: true,
    get value() { return DOORTILE14____header_global_97b2c5a35ca93e34; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:384
export const STATUE____header_global_71ae7df0d15df2ea = ((((((753) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ee5b38b81f6823fe22a2d015() {
  return __cxx_static_address_ee5b38b81f6823fe22a2d015.reference || (__cxx_static_address_ee5b38b81f6823fe22a2d015.reference = {
    __cReference: true,
    get value() { return STATUE____header_global_71ae7df0d15df2ea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:385
export const MIKE____header_global_1505372073d4f9d1 = ((((((762) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_623329053850787cd5750855() {
  return __cxx_static_address_623329053850787cd5750855.reference || (__cxx_static_address_623329053850787cd5750855.reference = {
    __cReference: true,
    get value() { return MIKE____header_global_1505372073d4f9d1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:386
export const VASE____header_global_b50626f05e3923c1 = ((((((765) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_016bd01035a935c5c3ecb874() {
  return __cxx_static_address_016bd01035a935c5c3ecb874.reference || (__cxx_static_address_016bd01035a935c5c3ecb874.reference = {
    __cReference: true,
    get value() { return VASE____header_global_b50626f05e3923c1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:387
export const SUSHIPLATE1____header_global_52b72bf940f2cd4d = ((((((768) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_808d6f2bad18da46d7baba1b() {
  return __cxx_static_address_808d6f2bad18da46d7baba1b.reference || (__cxx_static_address_808d6f2bad18da46d7baba1b.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE1____header_global_52b72bf940f2cd4d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:388
export const SUSHIPLATE2____header_global_d82f96e047ce3162 = ((((((769) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1977c7f3be98d8e548e05b24() {
  return __cxx_static_address_1977c7f3be98d8e548e05b24.reference || (__cxx_static_address_1977c7f3be98d8e548e05b24.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE2____header_global_d82f96e047ce3162; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:389
export const SUSHIPLATE3____header_global_e42cc974f2218f84 = ((((((774) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b3c4bdb0349c4a19c237cdef() {
  return __cxx_static_address_b3c4bdb0349c4a19c237cdef.reference || (__cxx_static_address_b3c4bdb0349c4a19c237cdef.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE3____header_global_e42cc974f2218f84; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:390
export const SUSHIPLATE4____header_global_3af96ce9dfa9630d = ((((((779) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fc1ad83eb0fa77ac9472bce7() {
  return __cxx_static_address_fc1ad83eb0fa77ac9472bce7.reference || (__cxx_static_address_fc1ad83eb0fa77ac9472bce7.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE4____header_global_3af96ce9dfa9630d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:391
export const DOORTILE16____header_global_0c971bbd3ae22b1a = ((((((781) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2ca633e9ef5c4fa90d2304e0() {
  return __cxx_static_address_2ca633e9ef5c4fa90d2304e0.reference || (__cxx_static_address_2ca633e9ef5c4fa90d2304e0.reference = {
    __cReference: true,
    get value() { return DOORTILE16____header_global_0c971bbd3ae22b1a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:392
export const SUSHIPLATE5____header_global_6d0a1c14a1d92340 = ((((((792) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7fa297b86938a75e836a22c2() {
  return __cxx_static_address_7fa297b86938a75e836a22c2.reference || (__cxx_static_address_7fa297b86938a75e836a22c2.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE5____header_global_6d0a1c14a1d92340; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:393
export const OJ____header_global_fd09062f0ed8a6be = ((((((806) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_db78ae030cbfac613d079ac9() {
  return __cxx_static_address_db78ae030cbfac613d079ac9.reference || (__cxx_static_address_db78ae030cbfac613d079ac9.reference = {
    __cReference: true,
    get value() { return OJ____header_global_fd09062f0ed8a6be; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:394
export const MASKWALL13____header_global_b796fdd1ec84152b = ((((((830) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d1ca53824e39854fd0f96638() {
  return __cxx_static_address_d1ca53824e39854fd0f96638.reference || (__cxx_static_address_d1ca53824e39854fd0f96638.reference = {
    __cReference: true,
    get value() { return MASKWALL13____header_global_b796fdd1ec84152b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:395
export const HURTRAIL____header_global_a9b0ed14dc0d1f4d = ((((((859) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c88b8f5eae5d1b8233eac4ae() {
  return __cxx_static_address_c88b8f5eae5d1b8233eac4ae.reference || (__cxx_static_address_c88b8f5eae5d1b8233eac4ae.reference = {
    __cReference: true,
    get value() { return HURTRAIL____header_global_a9b0ed14dc0d1f4d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:396
export const POWERSWITCH1____header_global_5a2fc59d5183a8c3 = ((((((860) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c6889a37ee144bf1a4088c78() {
  return __cxx_static_address_c6889a37ee144bf1a4088c78.reference || (__cxx_static_address_c6889a37ee144bf1a4088c78.reference = {
    __cReference: true,
    get value() { return POWERSWITCH1____header_global_5a2fc59d5183a8c3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:397
export const LOCKSWITCH1____header_global_71ba3c061f280ae4 = ((((((862) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_084ee90ec438b60def93e6a2() {
  return __cxx_static_address_084ee90ec438b60def93e6a2.reference || (__cxx_static_address_084ee90ec438b60def93e6a2.reference = {
    __cReference: true,
    get value() { return LOCKSWITCH1____header_global_71ba3c061f280ae4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:398
export const POWERSWITCH2____header_global_922af886547fede2 = ((((((864) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9e9df328a1d8375d962522af() {
  return __cxx_static_address_9e9df328a1d8375d962522af.reference || (__cxx_static_address_9e9df328a1d8375d962522af.reference = {
    __cReference: true,
    get value() { return POWERSWITCH2____header_global_922af886547fede2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:399
export const ATM____header_global_2a1669e6b4d71268 = ((((((867) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e981f7a9f37f11aab2a03950() {
  return __cxx_static_address_e981f7a9f37f11aab2a03950.reference || (__cxx_static_address_e981f7a9f37f11aab2a03950.reference = {
    __cReference: true,
    get value() { return ATM____header_global_2a1669e6b4d71268; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:400
export const STATUEFLASH____header_global_07a1b2adbbe9b68f = ((((((869) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8a2b8f5d7b37d60349c97a03() {
  return __cxx_static_address_8a2b8f5d7b37d60349c97a03.reference || (__cxx_static_address_8a2b8f5d7b37d60349c97a03.reference = {
    __cReference: true,
    get value() { return STATUEFLASH____header_global_07a1b2adbbe9b68f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:401
export const ATMBROKE____header_global_60e2f7cf1b64dca1 = ((((((888) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_52761e6e9f8c2118b0b9c8ec() {
  return __cxx_static_address_52761e6e9f8c2118b0b9c8ec.reference || (__cxx_static_address_52761e6e9f8c2118b0b9c8ec.reference = {
    __cReference: true,
    get value() { return ATMBROKE____header_global_60e2f7cf1b64dca1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:402
export const STRIPEBALL____header_global_588a8c9f559af2da = ((((((901) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9ddc0bb0fa9931010d13ea7d() {
  return __cxx_static_address_9ddc0bb0fa9931010d13ea7d.reference || (__cxx_static_address_9ddc0bb0fa9931010d13ea7d.reference = {
    __cReference: true,
    get value() { return STRIPEBALL____header_global_588a8c9f559af2da; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:403
export const QUEBALL____header_global_884b4a2c6752c1d2 = ((((((902) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b4b90bed963fba2921e92981() {
  return __cxx_static_address_b4b90bed963fba2921e92981.reference || (__cxx_static_address_b4b90bed963fba2921e92981.reference = {
    __cReference: true,
    get value() { return QUEBALL____header_global_884b4a2c6752c1d2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:404
export const POCKET____header_global_2137b79398a6df45 = ((((((903) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a664c74996746d349ce84c16() {
  return __cxx_static_address_a664c74996746d349ce84c16.reference || (__cxx_static_address_a664c74996746d349ce84c16.reference = {
    __cReference: true,
    get value() { return POCKET____header_global_2137b79398a6df45; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:405
export const WOODENHORSE____header_global_b3055e69bd33175a = ((((((904) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_03457e94c4a54e68a7b2f0e5() {
  return __cxx_static_address_03457e94c4a54e68a7b2f0e5.reference || (__cxx_static_address_03457e94c4a54e68a7b2f0e5.reference = {
    __cReference: true,
    get value() { return WOODENHORSE____header_global_b3055e69bd33175a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:406
export const TREE1____header_global_5bcc66a376b84506 = ((((((908) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_93f385d77bfce24fc1779ad8() {
  return __cxx_static_address_93f385d77bfce24fc1779ad8.reference || (__cxx_static_address_93f385d77bfce24fc1779ad8.reference = {
    __cReference: true,
    get value() { return TREE1____header_global_5bcc66a376b84506; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:407
export const TREE2____header_global_cc8ac7618afa3c3c = ((((((910) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_65754b99429f3ef5e6a08eaa() {
  return __cxx_static_address_65754b99429f3ef5e6a08eaa.reference || (__cxx_static_address_65754b99429f3ef5e6a08eaa.reference = {
    __cReference: true,
    get value() { return TREE2____header_global_cc8ac7618afa3c3c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:408
export const CACTUS____header_global_60e0d809387878e1 = ((((((911) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_44446fc3449cdfe2f30ecf3a() {
  return __cxx_static_address_44446fc3449cdfe2f30ecf3a.reference || (__cxx_static_address_44446fc3449cdfe2f30ecf3a.reference = {
    __cReference: true,
    get value() { return CACTUS____header_global_60e0d809387878e1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:409
export const MASKWALL2____header_global_a16f5b2ce89b057e = ((((((913) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_163d1511e302a5f98e1941ec() {
  return __cxx_static_address_163d1511e302a5f98e1941ec.reference || (__cxx_static_address_163d1511e302a5f98e1941ec.reference = {
    __cReference: true,
    get value() { return MASKWALL2____header_global_a16f5b2ce89b057e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:410
export const MASKWALL3____header_global_4873897741cad0cf = ((((((914) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_746b93a6761bfa52bd9a5d31() {
  return __cxx_static_address_746b93a6761bfa52bd9a5d31.reference || (__cxx_static_address_746b93a6761bfa52bd9a5d31.reference = {
    __cReference: true,
    get value() { return MASKWALL3____header_global_4873897741cad0cf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:411
export const MASKWALL4____header_global_3556f51f99ef642a = ((((((915) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e2e9b55d8f4e309c4b4aa3a6() {
  return __cxx_static_address_e2e9b55d8f4e309c4b4aa3a6.reference || (__cxx_static_address_e2e9b55d8f4e309c4b4aa3a6.reference = {
    __cReference: true,
    get value() { return MASKWALL4____header_global_3556f51f99ef642a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:412
export const FIREEXT____header_global_016d08fbce569160 = ((((((916) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aaa83868dc8bd25d42c4e7f3() {
  return __cxx_static_address_aaa83868dc8bd25d42c4e7f3.reference || (__cxx_static_address_aaa83868dc8bd25d42c4e7f3.reference = {
    __cReference: true,
    get value() { return FIREEXT____header_global_016d08fbce569160; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:413
export const TOILETWATER____header_global_f49aa18e2942cff9 = ((((((921) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2077423a26bc7576f4f1c9a9() {
  return __cxx_static_address_2077423a26bc7576f4f1c9a9.reference || (__cxx_static_address_2077423a26bc7576f4f1c9a9.reference = {
    __cReference: true,
    get value() { return TOILETWATER____header_global_f49aa18e2942cff9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:414
export const NEON1____header_global_868312d1e47beda5 = ((((((925) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bf194e8d226551fd28e4ed52() {
  return __cxx_static_address_bf194e8d226551fd28e4ed52.reference || (__cxx_static_address_bf194e8d226551fd28e4ed52.reference = {
    __cReference: true,
    get value() { return NEON1____header_global_868312d1e47beda5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:415
export const NEON2____header_global_c48eb86c4a5d8695 = ((((((926) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e49f76ead7da967565c24675() {
  return __cxx_static_address_e49f76ead7da967565c24675.reference || (__cxx_static_address_e49f76ead7da967565c24675.reference = {
    __cReference: true,
    get value() { return NEON2____header_global_c48eb86c4a5d8695; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:416
export const CACTUSBROKE____header_global_f7d653947f75afda = ((((((939) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fe4a4ba0ed174283aa6f4c93() {
  return __cxx_static_address_fe4a4ba0ed174283aa6f4c93.reference || (__cxx_static_address_fe4a4ba0ed174283aa6f4c93.reference = {
    __cReference: true,
    get value() { return CACTUSBROKE____header_global_f7d653947f75afda; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:417
export const BOUNCEMINE____header_global_29851d30d25da60e = ((((((940) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0bab7f6224fcd6acf7742e04() {
  return __cxx_static_address_0bab7f6224fcd6acf7742e04.reference || (__cxx_static_address_0bab7f6224fcd6acf7742e04.reference = {
    __cReference: true,
    get value() { return BOUNCEMINE____header_global_29851d30d25da60e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:418
export const BROKEFIREHYDRENT____header_global_a2bf4a2c441bf549 = ((((((950) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9ec8d204a6abd473b6c6065f() {
  return __cxx_static_address_9ec8d204a6abd473b6c6065f.reference || (__cxx_static_address_9ec8d204a6abd473b6c6065f.reference = {
    __cReference: true,
    get value() { return BROKEFIREHYDRENT____header_global_a2bf4a2c441bf549; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:419
export const BOX____header_global_fe899999133e0482 = ((((((951) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c885b7a57bf41078b7bb4e16() {
  return __cxx_static_address_c885b7a57bf41078b7bb4e16.reference || (__cxx_static_address_c885b7a57bf41078b7bb4e16.reference = {
    __cReference: true,
    get value() { return BOX____header_global_fe899999133e0482; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:420
export const BULLETHOLE____header_global_4957c94765e84243 = ((((((952) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d96edcee59c665a2ba1c7d5b() {
  return __cxx_static_address_d96edcee59c665a2ba1c7d5b.reference || (__cxx_static_address_d96edcee59c665a2ba1c7d5b.reference = {
    __cReference: true,
    get value() { return BULLETHOLE____header_global_4957c94765e84243; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:421
export const BOTTLE1____header_global_2f8e2a7ec7259f8c = ((((((954) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_23782a735f423d26b5642a2d() {
  return __cxx_static_address_23782a735f423d26b5642a2d.reference || (__cxx_static_address_23782a735f423d26b5642a2d.reference = {
    __cReference: true,
    get value() { return BOTTLE1____header_global_2f8e2a7ec7259f8c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:422
export const BOTTLE2____header_global_fe40dd54abe0ac3a = ((((((955) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aa2c74e29c95295272efbd35() {
  return __cxx_static_address_aa2c74e29c95295272efbd35.reference || (__cxx_static_address_aa2c74e29c95295272efbd35.reference = {
    __cReference: true,
    get value() { return BOTTLE2____header_global_fe40dd54abe0ac3a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:423
export const BOTTLE3____header_global_3ed35f16acfe2752 = ((((((956) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8c1ae6ea0c760594ceb197e8() {
  return __cxx_static_address_8c1ae6ea0c760594ceb197e8.reference || (__cxx_static_address_8c1ae6ea0c760594ceb197e8.reference = {
    __cReference: true,
    get value() { return BOTTLE3____header_global_3ed35f16acfe2752; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:424
export const BOTTLE4____header_global_0104b5f5448551c5 = ((((((957) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d9d839aa14b9a55ea80460ac() {
  return __cxx_static_address_d9d839aa14b9a55ea80460ac.reference || (__cxx_static_address_d9d839aa14b9a55ea80460ac.reference = {
    __cReference: true,
    get value() { return BOTTLE4____header_global_0104b5f5448551c5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:425
export const FEMPIC5____header_global_b914d760d258e298 = ((((((963) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9c174e0d980665e60f096805() {
  return __cxx_static_address_9c174e0d980665e60f096805.reference || (__cxx_static_address_9c174e0d980665e60f096805.reference = {
    __cReference: true,
    get value() { return FEMPIC5____header_global_b914d760d258e298; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:426
export const FEMPIC6____header_global_c4138ad5e15f1756 = ((((((964) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_103932bab8eaf88dd9ed568e() {
  return __cxx_static_address_103932bab8eaf88dd9ed568e.reference || (__cxx_static_address_103932bab8eaf88dd9ed568e.reference = {
    __cReference: true,
    get value() { return FEMPIC6____header_global_c4138ad5e15f1756; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:427
export const FEMPIC7____header_global_6067b255eb2f2ede = ((((((965) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_28574e93d2af28a5aa30d721() {
  return __cxx_static_address_28574e93d2af28a5aa30d721.reference || (__cxx_static_address_28574e93d2af28a5aa30d721.reference = {
    __cReference: true,
    get value() { return FEMPIC7____header_global_6067b255eb2f2ede; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:428
export const HYDROPLANT____header_global_02cc4f8089046ef5 = ((((((969) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e1ea0a7d70339fe88c92549d() {
  return __cxx_static_address_e1ea0a7d70339fe88c92549d.reference || (__cxx_static_address_e1ea0a7d70339fe88c92549d.reference = {
    __cReference: true,
    get value() { return HYDROPLANT____header_global_02cc4f8089046ef5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:429
export const OCEANSPRITE1____header_global_2412f06e3c3ff659 = ((((((971) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3a0902149e2b663889615a5a() {
  return __cxx_static_address_3a0902149e2b663889615a5a.reference || (__cxx_static_address_3a0902149e2b663889615a5a.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE1____header_global_2412f06e3c3ff659; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:430
export const OCEANSPRITE2____header_global_5077ce558ebcc21c = ((((((972) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9bb8d00c72d3232b963e3be1() {
  return __cxx_static_address_9bb8d00c72d3232b963e3be1.reference || (__cxx_static_address_9bb8d00c72d3232b963e3be1.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE2____header_global_5077ce558ebcc21c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:431
export const OCEANSPRITE3____header_global_698ab87c5d10988a = ((((((973) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8e60493c203bb39f0aa914f7() {
  return __cxx_static_address_8e60493c203bb39f0aa914f7.reference || (__cxx_static_address_8e60493c203bb39f0aa914f7.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE3____header_global_698ab87c5d10988a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:432
export const OCEANSPRITE4____header_global_58b2b436a7caf0dd = ((((((974) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_defa119ca52ac307d726456d() {
  return __cxx_static_address_defa119ca52ac307d726456d.reference || (__cxx_static_address_defa119ca52ac307d726456d.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE4____header_global_58b2b436a7caf0dd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:433
export const OCEANSPRITE5____header_global_6b811cf7ded4f7ba = ((((((975) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d87d47b3105ff5f1b5e14631() {
  return __cxx_static_address_d87d47b3105ff5f1b5e14631.reference || (__cxx_static_address_d87d47b3105ff5f1b5e14631.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE5____header_global_6b811cf7ded4f7ba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:434
export const GENERICPOLE____header_global_4242d279bbbbc678 = ((((((977) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_252e1ce9f779f0576ccd140c() {
  return __cxx_static_address_252e1ce9f779f0576ccd140c.reference || (__cxx_static_address_252e1ce9f779f0576ccd140c.reference = {
    __cReference: true,
    get value() { return GENERICPOLE____header_global_4242d279bbbbc678; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:435
export const CONE____header_global_aca9ad15421adf8a = ((((((978) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_98b53bdbe9e55c86226247ec() {
  return __cxx_static_address_98b53bdbe9e55c86226247ec.reference || (__cxx_static_address_98b53bdbe9e55c86226247ec.reference = {
    __cReference: true,
    get value() { return CONE____header_global_aca9ad15421adf8a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:436
export const HANGLIGHT____header_global_aee50458c6f862e5 = ((((((979) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ff8cd38ef7d39d6fb0a27a8c() {
  return __cxx_static_address_ff8cd38ef7d39d6fb0a27a8c.reference || (__cxx_static_address_ff8cd38ef7d39d6fb0a27a8c.reference = {
    __cReference: true,
    get value() { return HANGLIGHT____header_global_aee50458c6f862e5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:437
export const HYDRENT____header_global_57b7181742137e80 = ((((((981) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_86739810e48df62521827a51() {
  return __cxx_static_address_86739810e48df62521827a51.reference || (__cxx_static_address_86739810e48df62521827a51.reference = {
    __cReference: true,
    get value() { return HYDRENT____header_global_57b7181742137e80; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:438
export const MASKWALL14____header_global_7afd20ad34b9198b = ((((((988) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d3c6769dc58ab4103ab481cd() {
  return __cxx_static_address_d3c6769dc58ab4103ab481cd.reference || (__cxx_static_address_d3c6769dc58ab4103ab481cd.reference = {
    __cReference: true,
    get value() { return MASKWALL14____header_global_7afd20ad34b9198b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:439
export const TIRE____header_global_ee544d0ffffcecf8 = ((((((990) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d9d182d44f5475258b99eae5() {
  return __cxx_static_address_d9d182d44f5475258b99eae5.reference || (__cxx_static_address_d9d182d44f5475258b99eae5.reference = {
    __cReference: true,
    get value() { return TIRE____header_global_ee544d0ffffcecf8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:440
export const PIPE5____header_global_cad54e911369cfae = ((((((994) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8c16ca27a83ddba2a624e9e3() {
  return __cxx_static_address_8c16ca27a83ddba2a624e9e3.reference || (__cxx_static_address_8c16ca27a83ddba2a624e9e3.reference = {
    __cReference: true,
    get value() { return PIPE5____header_global_cad54e911369cfae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:441
export const PIPE6____header_global_127f89f887571cda = ((((((995) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5ad5e7a280c545ba569c1441() {
  return __cxx_static_address_5ad5e7a280c545ba569c1441.reference || (__cxx_static_address_5ad5e7a280c545ba569c1441.reference = {
    __cReference: true,
    get value() { return PIPE6____header_global_127f89f887571cda; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:442
export const PIPE4____header_global_c222560894b87c90 = ((((((996) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8397734a22b5d59cc66e6491() {
  return __cxx_static_address_8397734a22b5d59cc66e6491.reference || (__cxx_static_address_8397734a22b5d59cc66e6491.reference = {
    __cReference: true,
    get value() { return PIPE4____header_global_c222560894b87c90; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:443
export const PIPE4B____header_global_2d85458664d55671 = ((((((997) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_07d34e64afef7f9f399b08a2() {
  return __cxx_static_address_07d34e64afef7f9f399b08a2.reference || (__cxx_static_address_07d34e64afef7f9f399b08a2.reference = {
    __cReference: true,
    get value() { return PIPE4B____header_global_2d85458664d55671; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:444
export const BROKEHYDROPLANT____header_global_e11cc6d2f5f579db = ((((((1003) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e0a9c2ba8e17aedf5ca7b909() {
  return __cxx_static_address_e0a9c2ba8e17aedf5ca7b909.reference || (__cxx_static_address_e0a9c2ba8e17aedf5ca7b909.reference = {
    __cReference: true,
    get value() { return BROKEHYDROPLANT____header_global_e11cc6d2f5f579db; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:445
export const PIPE5B____header_global_50fda9fe089804fa = ((((((1005) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b727f1f0092d2471b1779747() {
  return __cxx_static_address_b727f1f0092d2471b1779747.reference || (__cxx_static_address_b727f1f0092d2471b1779747.reference = {
    __cReference: true,
    get value() { return PIPE5B____header_global_50fda9fe089804fa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:446
export const NEON3____header_global_5a886ee1a25273d3 = ((((((1007) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b5986a6c484e4e567728a890() {
  return __cxx_static_address_b5986a6c484e4e567728a890.reference || (__cxx_static_address_b5986a6c484e4e567728a890.reference = {
    __cReference: true,
    get value() { return NEON3____header_global_5a886ee1a25273d3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:447
export const NEON4____header_global_8d79d507881f535a = ((((((1008) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_99290053f25d9d594375a01e() {
  return __cxx_static_address_99290053f25d9d594375a01e.reference || (__cxx_static_address_99290053f25d9d594375a01e.reference = {
    __cReference: true,
    get value() { return NEON4____header_global_8d79d507881f535a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:448
export const NEON5____header_global_8f698c2c4d9de092 = ((((((1009) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_51e965753913dd47834d0992() {
  return __cxx_static_address_51e965753913dd47834d0992.reference || (__cxx_static_address_51e965753913dd47834d0992.reference = {
    __cReference: true,
    get value() { return NEON5____header_global_8f698c2c4d9de092; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:449
export const BOTTLE5____header_global_25c9cc39f5840fc7 = ((((((1012) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0364952967b072cc565c96da() {
  return __cxx_static_address_0364952967b072cc565c96da.reference || (__cxx_static_address_0364952967b072cc565c96da.reference = {
    __cReference: true,
    get value() { return BOTTLE5____header_global_25c9cc39f5840fc7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:450
export const BOTTLE6____header_global_3034a0b687c51d26 = ((((((1013) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_890c199e4985af6eba301652() {
  return __cxx_static_address_890c199e4985af6eba301652.reference || (__cxx_static_address_890c199e4985af6eba301652.reference = {
    __cReference: true,
    get value() { return BOTTLE6____header_global_3034a0b687c51d26; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:451
export const BOTTLE8____header_global_bab186b6eca37adc = ((((((1014) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_90b18e3946330dabc384e02c() {
  return __cxx_static_address_90b18e3946330dabc384e02c.reference || (__cxx_static_address_90b18e3946330dabc384e02c.reference = {
    __cReference: true,
    get value() { return BOTTLE8____header_global_bab186b6eca37adc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:452
export const SPOTLITE____header_global_9fdc156ab10f1c03 = ((((((1020) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d9b2d14c706e1a3daff2ed81() {
  return __cxx_static_address_d9b2d14c706e1a3daff2ed81.reference || (__cxx_static_address_d9b2d14c706e1a3daff2ed81.reference = {
    __cReference: true,
    get value() { return SPOTLITE____header_global_9fdc156ab10f1c03; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:453
export const MASKWALL15____header_global_08786b02cc565b85 = ((((((1024) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_58b2f5c3f73f44a35bc6a693() {
  return __cxx_static_address_58b2f5c3f73f44a35bc6a693.reference || (__cxx_static_address_58b2f5c3f73f44a35bc6a693.reference = {
    __cReference: true,
    get value() { return MASKWALL15____header_global_08786b02cc565b85; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:454
export const BOTTLE7____header_global_85a6a46014d977e1 = ((((((1025) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_72c4b0f20b015488a80c13db() {
  return __cxx_static_address_72c4b0f20b015488a80c13db.reference || (__cxx_static_address_72c4b0f20b015488a80c13db.reference = {
    __cReference: true,
    get value() { return BOTTLE7____header_global_85a6a46014d977e1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:455
export const HORSEONSIDE____header_global_4ad2de3cf95893bf = ((((((1026) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_82779b6c4c27c9fc25b5e796() {
  return __cxx_static_address_82779b6c4c27c9fc25b5e796.reference || (__cxx_static_address_82779b6c4c27c9fc25b5e796.reference = {
    __cReference: true,
    get value() { return HORSEONSIDE____header_global_4ad2de3cf95893bf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:456
export const GLASSPIECES____header_global_4baf7cdbbed35947 = ((((((1031) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8612e9dcd9c4b7e0bb087937() {
  return __cxx_static_address_8612e9dcd9c4b7e0bb087937.reference || (__cxx_static_address_8612e9dcd9c4b7e0bb087937.reference = {
    __cReference: true,
    get value() { return GLASSPIECES____header_global_4baf7cdbbed35947; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:457
export const NEON6____header_global_476ad8182fc299c9 = ((((((1046) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7054e80880f9d13d0f5a81d4() {
  return __cxx_static_address_7054e80880f9d13d0f5a81d4.reference || (__cxx_static_address_7054e80880f9d13d0f5a81d4.reference = {
    __cReference: true,
    get value() { return NEON6____header_global_476ad8182fc299c9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:458
export const MASKWALL6____header_global_7dba7f0312bb71d1 = ((((((1059) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ee792fee2a7916f8692682cd() {
  return __cxx_static_address_ee792fee2a7916f8692682cd.reference || (__cxx_static_address_ee792fee2a7916f8692682cd.reference = {
    __cReference: true,
    get value() { return MASKWALL6____header_global_7dba7f0312bb71d1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:459
export const RUBBERCAN____header_global_68adfa1453a2485c = ((((((1062) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c30b3414ef85de9c97ec54d5() {
  return __cxx_static_address_c30b3414ef85de9c97ec54d5.reference || (__cxx_static_address_c30b3414ef85de9c97ec54d5.reference = {
    __cReference: true,
    get value() { return RUBBERCAN____header_global_68adfa1453a2485c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:460
export const PLUG____header_global_947759166dd7ca8d = ((((((1069) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9e1305a215442ba08d1133af() {
  return __cxx_static_address_9e1305a215442ba08d1133af.reference || (__cxx_static_address_9e1305a215442ba08d1133af.reference = {
    __cReference: true,
    get value() { return PLUG____header_global_947759166dd7ca8d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:461
export const OOZFILTER____header_global_17cd698c525c68cc = ((((((1079) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_01746a71b8da3de64c3419f3() {
  return __cxx_static_address_01746a71b8da3de64c3419f3.reference || (__cxx_static_address_01746a71b8da3de64c3419f3.reference = {
    __cReference: true,
    get value() { return OOZFILTER____header_global_17cd698c525c68cc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:462
export const FLOORPLASMA____header_global_5d9651c99a303701 = ((((((1082) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2d0e22d1903ad3342f1c6d21() {
  return __cxx_static_address_2d0e22d1903ad3342f1c6d21.reference || (__cxx_static_address_2d0e22d1903ad3342f1c6d21.reference = {
    __cReference: true,
    get value() { return FLOORPLASMA____header_global_5d9651c99a303701; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:463
export const REACTOR____header_global_28fc2a259f7507e8 = ((((((1088) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4713e03f6b4e9397ccccbb14() {
  return __cxx_static_address_4713e03f6b4e9397ccccbb14.reference || (__cxx_static_address_4713e03f6b4e9397ccccbb14.reference = {
    __cReference: true,
    get value() { return REACTOR____header_global_28fc2a259f7507e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:464
export const REACTORSPARK____header_global_821a3589c33a157d = ((((((1092) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_09fb7d08c5c4b300f203d546() {
  return __cxx_static_address_09fb7d08c5c4b300f203d546.reference || (__cxx_static_address_09fb7d08c5c4b300f203d546.reference = {
    __cReference: true,
    get value() { return REACTORSPARK____header_global_821a3589c33a157d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:465
export const REACTORBURNT____header_global_fbafb8e32b58eaa4 = ((((((1096) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3b18576bb32319de5c314ee8() {
  return __cxx_static_address_3b18576bb32319de5c314ee8.reference || (__cxx_static_address_3b18576bb32319de5c314ee8.reference = {
    __cReference: true,
    get value() { return REACTORBURNT____header_global_fbafb8e32b58eaa4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:466
export const DOORTILE15____header_global_0fec92debc77663b = ((((((1102) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a02a5e7527c50f9df9aee99d() {
  return __cxx_static_address_a02a5e7527c50f9df9aee99d.reference || (__cxx_static_address_a02a5e7527c50f9df9aee99d.reference = {
    __cReference: true,
    get value() { return DOORTILE15____header_global_0fec92debc77663b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:467
export const HANDSWITCH____header_global_7fdfa7434c6d8baf = ((((((1111) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6ac45f5c6e2abb8c06511763() {
  return __cxx_static_address_6ac45f5c6e2abb8c06511763.reference || (__cxx_static_address_6ac45f5c6e2abb8c06511763.reference = {
    __cReference: true,
    get value() { return HANDSWITCH____header_global_7fdfa7434c6d8baf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:468
export const CIRCLEPANNEL____header_global_690f43873479564b = ((((((1113) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2cd4330cae0d63d1ef9f6276() {
  return __cxx_static_address_2cd4330cae0d63d1ef9f6276.reference || (__cxx_static_address_2cd4330cae0d63d1ef9f6276.reference = {
    __cReference: true,
    get value() { return CIRCLEPANNEL____header_global_690f43873479564b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:469
export const CIRCLEPANNELBROKE____header_global_6c634bda7b6b7b96 = ((((((1114) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_87f648528067581fb09a4972() {
  return __cxx_static_address_87f648528067581fb09a4972.reference || (__cxx_static_address_87f648528067581fb09a4972.reference = {
    __cReference: true,
    get value() { return CIRCLEPANNELBROKE____header_global_6c634bda7b6b7b96; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:470
export const PULLSWITCH____header_global_defc2f42a12969db = ((((((1122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7dcfd3678dad24c71d4bbdd1() {
  return __cxx_static_address_7dcfd3678dad24c71d4bbdd1.reference || (__cxx_static_address_7dcfd3678dad24c71d4bbdd1.reference = {
    __cReference: true,
    get value() { return PULLSWITCH____header_global_defc2f42a12969db; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:471
export const MASKWALL8____header_global_84a1e9fac7d3a192 = ((((((1124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4b3282461d24872e3946bffd() {
  return __cxx_static_address_4b3282461d24872e3946bffd.reference || (__cxx_static_address_4b3282461d24872e3946bffd.reference = {
    __cReference: true,
    get value() { return MASKWALL8____header_global_84a1e9fac7d3a192; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:472
export const BIGHOLE____header_global_0f9e75af937b9f56 = ((((((1141) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_851242c2e24533cfa28f2eb5() {
  return __cxx_static_address_851242c2e24533cfa28f2eb5.reference || (__cxx_static_address_851242c2e24533cfa28f2eb5.reference = {
    __cReference: true,
    get value() { return BIGHOLE____header_global_0f9e75af937b9f56; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:473
export const ALIENSWITCH____header_global_32cf31332a7ba61e = ((((((1142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e3dbbfcbd69a42edb6e4a351() {
  return __cxx_static_address_e3dbbfcbd69a42edb6e4a351.reference || (__cxx_static_address_e3dbbfcbd69a42edb6e4a351.reference = {
    __cReference: true,
    get value() { return ALIENSWITCH____header_global_32cf31332a7ba61e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:474
export const DOORTILE21____header_global_b407a59f4ad6cdaa = ((((((1144) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_84c8af5c64d2cabab1bb63e1() {
  return __cxx_static_address_84c8af5c64d2cabab1bb63e1.reference || (__cxx_static_address_84c8af5c64d2cabab1bb63e1.reference = {
    __cReference: true,
    get value() { return DOORTILE21____header_global_b407a59f4ad6cdaa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:475
export const HANDPRINTSWITCH____header_global_c51014f7df636f99 = ((((((1155) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_36ddfe30fded306d68c54a5d() {
  return __cxx_static_address_36ddfe30fded306d68c54a5d.reference || (__cxx_static_address_36ddfe30fded306d68c54a5d.reference = {
    __cReference: true,
    get value() { return HANDPRINTSWITCH____header_global_c51014f7df636f99; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:476
export const BOTTLE10____header_global_ae723e31cec50b97 = ((((((1157) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8d6bbd80b1f9ce3597a2f1c5() {
  return __cxx_static_address_8d6bbd80b1f9ce3597a2f1c5.reference || (__cxx_static_address_8d6bbd80b1f9ce3597a2f1c5.reference = {
    __cReference: true,
    get value() { return BOTTLE10____header_global_ae723e31cec50b97; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:477
export const BOTTLE11____header_global_0726689f11240a9f = ((((((1158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9b2bf2625233da62f4fee10a() {
  return __cxx_static_address_9b2bf2625233da62f4fee10a.reference || (__cxx_static_address_9b2bf2625233da62f4fee10a.reference = {
    __cReference: true,
    get value() { return BOTTLE11____header_global_0726689f11240a9f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:478
export const BOTTLE12____header_global_ef35c839219cd97f = ((((((1159) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9f11034e03cdc04dc09ece61() {
  return __cxx_static_address_9f11034e03cdc04dc09ece61.reference || (__cxx_static_address_9f11034e03cdc04dc09ece61.reference = {
    __cReference: true,
    get value() { return BOTTLE12____header_global_ef35c839219cd97f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:479
export const BOTTLE13____header_global_9b5536226969d3d1 = ((((((1160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b0293dd621f2b4167bfffdaf() {
  return __cxx_static_address_b0293dd621f2b4167bfffdaf.reference || (__cxx_static_address_b0293dd621f2b4167bfffdaf.reference = {
    __cReference: true,
    get value() { return BOTTLE13____header_global_9b5536226969d3d1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:480
export const BOTTLE14____header_global_50490da084252540 = ((((((1161) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2dde5d6536e46d67ec4f491c() {
  return __cxx_static_address_2dde5d6536e46d67ec4f491c.reference || (__cxx_static_address_2dde5d6536e46d67ec4f491c.reference = {
    __cReference: true,
    get value() { return BOTTLE14____header_global_50490da084252540; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:481
export const BOTTLE15____header_global_a4040490dc12af8c = ((((((1162) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_760c8772ca097ca39bbdb50c() {
  return __cxx_static_address_760c8772ca097ca39bbdb50c.reference || (__cxx_static_address_760c8772ca097ca39bbdb50c.reference = {
    __cReference: true,
    get value() { return BOTTLE15____header_global_a4040490dc12af8c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:482
export const BOTTLE16____header_global_26eff58b2bef33bc = ((((((1163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5da831b21934f4ef101d93bf() {
  return __cxx_static_address_5da831b21934f4ef101d93bf.reference || (__cxx_static_address_5da831b21934f4ef101d93bf.reference = {
    __cReference: true,
    get value() { return BOTTLE16____header_global_26eff58b2bef33bc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:483
export const BOTTLE17____header_global_ff10947c2baf8cd6 = ((((((1164) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cbe7bdee0d9dcbd2d3914900() {
  return __cxx_static_address_cbe7bdee0d9dcbd2d3914900.reference || (__cxx_static_address_cbe7bdee0d9dcbd2d3914900.reference = {
    __cReference: true,
    get value() { return BOTTLE17____header_global_ff10947c2baf8cd6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:484
export const BOTTLE18____header_global_f489e71013f15076 = ((((((1165) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ea9cf58e9ab7493801c2508c() {
  return __cxx_static_address_ea9cf58e9ab7493801c2508c.reference || (__cxx_static_address_ea9cf58e9ab7493801c2508c.reference = {
    __cReference: true,
    get value() { return BOTTLE18____header_global_f489e71013f15076; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:485
export const BOTTLE19____header_global_612ef6078366b2b2 = ((((((1166) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_358e7563716e381c37c3ce8c() {
  return __cxx_static_address_358e7563716e381c37c3ce8c.reference || (__cxx_static_address_358e7563716e381c37c3ce8c.reference = {
    __cReference: true,
    get value() { return BOTTLE19____header_global_612ef6078366b2b2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:486
export const DOORTILE17____header_global_dc675d750fcad7f3 = ((((((1169) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a9e891eb584050d7573775b0() {
  return __cxx_static_address_a9e891eb584050d7573775b0.reference || (__cxx_static_address_a9e891eb584050d7573775b0.reference = {
    __cReference: true,
    get value() { return DOORTILE17____header_global_dc675d750fcad7f3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:487
export const MASKWALL7____header_global_6b225b961ca13420 = ((((((1174) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_13a034425adf0eec0d0c3e1d() {
  return __cxx_static_address_13a034425adf0eec0d0c3e1d.reference || (__cxx_static_address_13a034425adf0eec0d0c3e1d.reference = {
    __cReference: true,
    get value() { return MASKWALL7____header_global_6b225b961ca13420; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:488
export const DOORTILE11____header_global_881ec7a995966929 = ((((((1178) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_874c9dba09c7679b80eb7968() {
  return __cxx_static_address_874c9dba09c7679b80eb7968.reference || (__cxx_static_address_874c9dba09c7679b80eb7968.reference = {
    __cReference: true,
    get value() { return DOORTILE11____header_global_881ec7a995966929; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:489
export const DOORTILE12____header_global_852cb8e67ac9daf1 = ((((((1179) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_66cb9b2b17511c0d9d57164d() {
  return __cxx_static_address_66cb9b2b17511c0d9d57164d.reference || (__cxx_static_address_66cb9b2b17511c0d9d57164d.reference = {
    __cReference: true,
    get value() { return DOORTILE12____header_global_852cb8e67ac9daf1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:490
export const VENDMACHINE____header_global_731bb28e6f498480 = ((((((1212) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9bec3c81be4a01364eccdd7a() {
  return __cxx_static_address_9bec3c81be4a01364eccdd7a.reference || (__cxx_static_address_9bec3c81be4a01364eccdd7a.reference = {
    __cReference: true,
    get value() { return VENDMACHINE____header_global_731bb28e6f498480; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:491
export const COLAMACHINE____header_global_c8baaed6e15faa73 = ((((((1215) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_878e38c096aa7447a0c1d20b() {
  return __cxx_static_address_878e38c096aa7447a0c1d20b.reference || (__cxx_static_address_878e38c096aa7447a0c1d20b.reference = {
    __cReference: true,
    get value() { return COLAMACHINE____header_global_c8baaed6e15faa73; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:492
export const CRANEPOLE____header_global_292cb721a68cd45d = ((((((1221) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bc258c978b0682240c93013e() {
  return __cxx_static_address_bc258c978b0682240c93013e.reference || (__cxx_static_address_bc258c978b0682240c93013e.reference = {
    __cReference: true,
    get value() { return CRANEPOLE____header_global_292cb721a68cd45d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:493
export const CRANE____header_global_f6d8d31c9a434098 = ((((((1222) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f96744ec1933b88a44d076d1() {
  return __cxx_static_address_f96744ec1933b88a44d076d1.reference || (__cxx_static_address_f96744ec1933b88a44d076d1.reference = {
    __cReference: true,
    get value() { return CRANE____header_global_f6d8d31c9a434098; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:494
export const BARBROKE____header_global_2e587036a2c27e1d = ((((((1225) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d5f32f83fe48bb0279f429b4() {
  return __cxx_static_address_d5f32f83fe48bb0279f429b4.reference || (__cxx_static_address_d5f32f83fe48bb0279f429b4.reference = {
    __cReference: true,
    get value() { return BARBROKE____header_global_2e587036a2c27e1d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:495
export const BLOODPOOL____header_global_52fc96100a93d94f = ((((((1226) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9ab4296d5546fbc82ceebed3() {
  return __cxx_static_address_9ab4296d5546fbc82ceebed3.reference || (__cxx_static_address_9ab4296d5546fbc82ceebed3.reference = {
    __cReference: true,
    get value() { return BLOODPOOL____header_global_52fc96100a93d94f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:496
export const NUKEBARREL____header_global_11e21949181c8885 = ((((((1227) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1a5bac9039b4d0a841d4e180() {
  return __cxx_static_address_1a5bac9039b4d0a841d4e180.reference || (__cxx_static_address_1a5bac9039b4d0a841d4e180.reference = {
    __cReference: true,
    get value() { return NUKEBARREL____header_global_11e21949181c8885; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:497
export const NUKEBARRELDENTED____header_global_101263709aeec115 = ((((((1228) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5e26ba95b35e9d62e19d4370() {
  return __cxx_static_address_5e26ba95b35e9d62e19d4370.reference || (__cxx_static_address_5e26ba95b35e9d62e19d4370.reference = {
    __cReference: true,
    get value() { return NUKEBARRELDENTED____header_global_101263709aeec115; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:498
export const NUKEBARRELLEAKED____header_global_8c06107d00cb2450 = ((((((1229) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_30ec727f0d29238c8ecdefc2() {
  return __cxx_static_address_30ec727f0d29238c8ecdefc2.reference || (__cxx_static_address_30ec727f0d29238c8ecdefc2.reference = {
    __cReference: true,
    get value() { return NUKEBARRELLEAKED____header_global_8c06107d00cb2450; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:499
export const CANWITHSOMETHING____header_global_8d83ed5d9798883c = ((((((1232) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0cd6cff33f86693d7cf5da3d() {
  return __cxx_static_address_0cd6cff33f86693d7cf5da3d.reference || (__cxx_static_address_0cd6cff33f86693d7cf5da3d.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING____header_global_8d83ed5d9798883c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:500
export const MONEY____header_global_675edad4ae673c17 = ((((((1233) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d0cf585b147177c2aed588eb() {
  return __cxx_static_address_d0cf585b147177c2aed588eb.reference || (__cxx_static_address_d0cf585b147177c2aed588eb.reference = {
    __cReference: true,
    get value() { return MONEY____header_global_675edad4ae673c17; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:501
export const BANNER____header_global_31de2e21ff8bfd1e = ((((((1236) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b87a0e85fbbec5dafc6ffefd() {
  return __cxx_static_address_b87a0e85fbbec5dafc6ffefd.reference || (__cxx_static_address_b87a0e85fbbec5dafc6ffefd.reference = {
    __cReference: true,
    get value() { return BANNER____header_global_31de2e21ff8bfd1e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:502
export const EXPLODINGBARREL____header_global_f4e780eef561f500 = ((((((1238) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d01550bb2cf5ebb15c2e60c0() {
  return __cxx_static_address_d01550bb2cf5ebb15c2e60c0.reference || (__cxx_static_address_d01550bb2cf5ebb15c2e60c0.reference = {
    __cReference: true,
    get value() { return EXPLODINGBARREL____header_global_f4e780eef561f500; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:503
export const EXPLODINGBARREL2____header_global_e031fddb621fc321 = ((((((1239) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_00e9b8edfe627e059c78f327() {
  return __cxx_static_address_00e9b8edfe627e059c78f327.reference || (__cxx_static_address_00e9b8edfe627e059c78f327.reference = {
    __cReference: true,
    get value() { return EXPLODINGBARREL2____header_global_e031fddb621fc321; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:504
export const FIREBARREL____header_global_1a8d083d9ad5e2e2 = ((((((1240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_735a04d0d63aec3bb601aa60() {
  return __cxx_static_address_735a04d0d63aec3bb601aa60.reference || (__cxx_static_address_735a04d0d63aec3bb601aa60.reference = {
    __cReference: true,
    get value() { return FIREBARREL____header_global_1a8d083d9ad5e2e2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:505
export const SEENINE____header_global_cc2d63cca23b4728 = ((((((1247) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_00fecb1c8aad31bc3ca089f3() {
  return __cxx_static_address_00fecb1c8aad31bc3ca089f3.reference || (__cxx_static_address_00fecb1c8aad31bc3ca089f3.reference = {
    __cReference: true,
    get value() { return SEENINE____header_global_cc2d63cca23b4728; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:506
export const SEENINEDEAD____header_global_e421823445061010 = ((((((1248) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e9040550bef0619235f7c44a() {
  return __cxx_static_address_e9040550bef0619235f7c44a.reference || (__cxx_static_address_e9040550bef0619235f7c44a.reference = {
    __cReference: true,
    get value() { return SEENINEDEAD____header_global_e421823445061010; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:507
export const STEAM____header_global_ecf93f2e817d4195 = ((((((1250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b5322e83fb5d9b7f1d879662() {
  return __cxx_static_address_b5322e83fb5d9b7f1d879662.reference || (__cxx_static_address_b5322e83fb5d9b7f1d879662.reference = {
    __cReference: true,
    get value() { return STEAM____header_global_ecf93f2e817d4195; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:508
export const CEILINGSTEAM____header_global_b3d08afd5a7faf57 = ((((((1255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_abd441b2fbf5bfe736a1d4a8() {
  return __cxx_static_address_abd441b2fbf5bfe736a1d4a8.reference || (__cxx_static_address_abd441b2fbf5bfe736a1d4a8.reference = {
    __cReference: true,
    get value() { return CEILINGSTEAM____header_global_b3d08afd5a7faf57; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:509
export const PIPE6B____header_global_638ba24eceb79cea = ((((((1260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1a890e6353c9a0a2723ad698() {
  return __cxx_static_address_1a890e6353c9a0a2723ad698.reference || (__cxx_static_address_1a890e6353c9a0a2723ad698.reference = {
    __cReference: true,
    get value() { return PIPE6B____header_global_638ba24eceb79cea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:510
export const TRANSPORTERBEAM____header_global_7de05fcebed515bd = ((((((1261) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ce1c9810b3d6f6008cc775fe() {
  return __cxx_static_address_ce1c9810b3d6f6008cc775fe.reference || (__cxx_static_address_ce1c9810b3d6f6008cc775fe.reference = {
    __cReference: true,
    get value() { return TRANSPORTERBEAM____header_global_7de05fcebed515bd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:511
export const RAT____header_global_781bc306e45f266d = ((((((1267) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4c8a0cddabb4ead999cfa164() {
  return __cxx_static_address_4c8a0cddabb4ead999cfa164.reference || (__cxx_static_address_4c8a0cddabb4ead999cfa164.reference = {
    __cReference: true,
    get value() { return RAT____header_global_781bc306e45f266d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:512
export const TRASH____header_global_64741b4fc55c7c05 = ((((((1272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e0c4b757cdc95d3be4ce8974() {
  return __cxx_static_address_e0c4b757cdc95d3be4ce8974.reference || (__cxx_static_address_e0c4b757cdc95d3be4ce8974.reference = {
    __cReference: true,
    get value() { return TRASH____header_global_64741b4fc55c7c05; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:513
export const FEMPIC1____header_global_db0aefbe3b1f5b74 = ((((((1280) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cab3db547a5a79b2230e7469() {
  return __cxx_static_address_cab3db547a5a79b2230e7469.reference || (__cxx_static_address_cab3db547a5a79b2230e7469.reference = {
    __cReference: true,
    get value() { return FEMPIC1____header_global_db0aefbe3b1f5b74; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:514
export const FEMPIC2____header_global_5b601c289e5eac78 = ((((((1289) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c611f178824caf573b1700ce() {
  return __cxx_static_address_c611f178824caf573b1700ce.reference || (__cxx_static_address_c611f178824caf573b1700ce.reference = {
    __cReference: true,
    get value() { return FEMPIC2____header_global_5b601c289e5eac78; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:515
export const BLANKSCREEN____header_global_47d3a8c777d0d44e = ((((((1293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d3925ddf620d9674c9d2552b() {
  return __cxx_static_address_d3925ddf620d9674c9d2552b.reference || (__cxx_static_address_d3925ddf620d9674c9d2552b.reference = {
    __cReference: true,
    get value() { return BLANKSCREEN____header_global_47d3a8c777d0d44e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:516
export const PODFEM1____header_global_f1607e7711c3073b = ((((((1294) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aa7b5e9180922803fdfde85f() {
  return __cxx_static_address_aa7b5e9180922803fdfde85f.reference || (__cxx_static_address_aa7b5e9180922803fdfde85f.reference = {
    __cReference: true,
    get value() { return PODFEM1____header_global_f1607e7711c3073b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:517
export const FEMPIC3____header_global_c2cbf0dc414b7fe8 = ((((((1298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cfa2a29231e1da42cfe13fd5() {
  return __cxx_static_address_cfa2a29231e1da42cfe13fd5.reference || (__cxx_static_address_cfa2a29231e1da42cfe13fd5.reference = {
    __cReference: true,
    get value() { return FEMPIC3____header_global_c2cbf0dc414b7fe8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:518
export const FEMPIC4____header_global_c2376ea0185d3ff8 = ((((((1306) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2f38f84e0a42e8dcb280877f() {
  return __cxx_static_address_2f38f84e0a42e8dcb280877f.reference || (__cxx_static_address_2f38f84e0a42e8dcb280877f.reference = {
    __cReference: true,
    get value() { return FEMPIC4____header_global_c2376ea0185d3ff8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:519
export const FEM1____header_global_d4cfb08c9c72fb0c = ((((((1312) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_609307b265c576179d9207ce() {
  return __cxx_static_address_609307b265c576179d9207ce.reference || (__cxx_static_address_609307b265c576179d9207ce.reference = {
    __cReference: true,
    get value() { return FEM1____header_global_d4cfb08c9c72fb0c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:520
export const FEM2____header_global_6206cf6d5a8636a2 = ((((((1317) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_36b28ab923eb8bed047a68ed() {
  return __cxx_static_address_36b28ab923eb8bed047a68ed.reference || (__cxx_static_address_36b28ab923eb8bed047a68ed.reference = {
    __cReference: true,
    get value() { return FEM2____header_global_6206cf6d5a8636a2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:521
export const FEM3____header_global_80489ad8aa16c9b5 = ((((((1321) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_12c8f801ce5ca540dbc3dc7f() {
  return __cxx_static_address_12c8f801ce5ca540dbc3dc7f.reference || (__cxx_static_address_12c8f801ce5ca540dbc3dc7f.reference = {
    __cReference: true,
    get value() { return FEM3____header_global_80489ad8aa16c9b5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:522
export const FEM5____header_global_a5558b0df64b7a58 = ((((((1323) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_29bc400af4e1563011f1b9d3() {
  return __cxx_static_address_29bc400af4e1563011f1b9d3.reference || (__cxx_static_address_29bc400af4e1563011f1b9d3.reference = {
    __cReference: true,
    get value() { return FEM5____header_global_a5558b0df64b7a58; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:523
export const BLOODYPOLE____header_global_08eb1cac8d3f9cd5 = ((((((1324) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_83a589c31e183556493a817b() {
  return __cxx_static_address_83a589c31e183556493a817b.reference || (__cxx_static_address_83a589c31e183556493a817b.reference = {
    __cReference: true,
    get value() { return BLOODYPOLE____header_global_08eb1cac8d3f9cd5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:524
export const FEM4____header_global_d17caa4ad636c496 = ((((((1325) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_844d5d56e99e7037af811f36() {
  return __cxx_static_address_844d5d56e99e7037af811f36.reference || (__cxx_static_address_844d5d56e99e7037af811f36.reference = {
    __cReference: true,
    get value() { return FEM4____header_global_d17caa4ad636c496; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:525
export const FEM6____header_global_f3bc54dea585ad9a = ((((((1334) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_80cc7597ad3e2d7c58914e47() {
  return __cxx_static_address_80cc7597ad3e2d7c58914e47.reference || (__cxx_static_address_80cc7597ad3e2d7c58914e47.reference = {
    __cReference: true,
    get value() { return FEM6____header_global_f3bc54dea585ad9a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:526
export const FEM6PAD____header_global_586437065e40a3f6 = ((((((1335) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f2e687d53254a112f59c59f2() {
  return __cxx_static_address_f2e687d53254a112f59c59f2.reference || (__cxx_static_address_f2e687d53254a112f59c59f2.reference = {
    __cReference: true,
    get value() { return FEM6PAD____header_global_586437065e40a3f6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:527
export const FEM8____header_global_d0b17b9f75ff1067 = ((((((1336) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9c890b488eeb212dcc1513e8() {
  return __cxx_static_address_9c890b488eeb212dcc1513e8.reference || (__cxx_static_address_9c890b488eeb212dcc1513e8.reference = {
    __cReference: true,
    get value() { return FEM8____header_global_d0b17b9f75ff1067; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:528
export const HELECOPT____header_global_deade069a50d873f = ((((((1346) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_626dfa45074dce69b21648c0() {
  return __cxx_static_address_626dfa45074dce69b21648c0.reference || (__cxx_static_address_626dfa45074dce69b21648c0.reference = {
    __cReference: true,
    get value() { return HELECOPT____header_global_deade069a50d873f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:529
export const FETUSJIB____header_global_61b34b5e9aa2785d = ((((((1347) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_31d432022094e437534bfa54() {
  return __cxx_static_address_31d432022094e437534bfa54.reference || (__cxx_static_address_31d432022094e437534bfa54.reference = {
    __cReference: true,
    get value() { return FETUSJIB____header_global_61b34b5e9aa2785d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:530
export const HOLODUKE____header_global_a7ad291f9d5081ef = ((((((1348) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_05adb6e10999652664717e6e() {
  return __cxx_static_address_05adb6e10999652664717e6e.reference || (__cxx_static_address_05adb6e10999652664717e6e.reference = {
    __cReference: true,
    get value() { return HOLODUKE____header_global_a7ad291f9d5081ef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:531
export const SPACEMARINE____header_global_5d4b22e7b2d2a90e = ((((((1353) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fc0fbde56ece62cabdd4ff52() {
  return __cxx_static_address_fc0fbde56ece62cabdd4ff52.reference || (__cxx_static_address_fc0fbde56ece62cabdd4ff52.reference = {
    __cReference: true,
    get value() { return SPACEMARINE____header_global_5d4b22e7b2d2a90e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:532
export const INDY____header_global_8d3f2c07a2d5660c = ((((((1355) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2e357c8ab5df2e3ccc4627db() {
  return __cxx_static_address_2e357c8ab5df2e3ccc4627db.reference || (__cxx_static_address_2e357c8ab5df2e3ccc4627db.reference = {
    __cReference: true,
    get value() { return INDY____header_global_8d3f2c07a2d5660c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:533
export const FETUS____header_global_d7d77200bdbf6fea = ((((((1358) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5c3cd2362dca77aa25bc46c8() {
  return __cxx_static_address_5c3cd2362dca77aa25bc46c8.reference || (__cxx_static_address_5c3cd2362dca77aa25bc46c8.reference = {
    __cReference: true,
    get value() { return FETUS____header_global_d7d77200bdbf6fea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:534
export const FETUSBROKE____header_global_d0cbe88cb2b5022b = ((((((1359) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_465ac892b9724be3220b7ee3() {
  return __cxx_static_address_465ac892b9724be3220b7ee3.reference || (__cxx_static_address_465ac892b9724be3220b7ee3.reference = {
    __cReference: true,
    get value() { return FETUSBROKE____header_global_d0cbe88cb2b5022b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:535
export const MONK____header_global_21e88f18db46e001 = ((((((1352) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c31ddda10928f067e7569e75() {
  return __cxx_static_address_c31ddda10928f067e7569e75.reference || (__cxx_static_address_c31ddda10928f067e7569e75.reference = {
    __cReference: true,
    get value() { return MONK____header_global_21e88f18db46e001; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:536
export const LUKE____header_global_d993df0bc5fd7d01 = ((((((1354) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5c257588ef2c51d34581c2fb() {
  return __cxx_static_address_5c257588ef2c51d34581c2fb.reference || (__cxx_static_address_5c257588ef2c51d34581c2fb.reference = {
    __cReference: true,
    get value() { return LUKE____header_global_d993df0bc5fd7d01; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:537
export const COOLEXPLOSION1____header_global_b3a0f2b7c19d0d57 = ((((((1360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_56f3c0b60d3ecfe618109095() {
  return __cxx_static_address_56f3c0b60d3ecfe618109095.reference || (__cxx_static_address_56f3c0b60d3ecfe618109095.reference = {
    __cReference: true,
    get value() { return COOLEXPLOSION1____header_global_b3a0f2b7c19d0d57; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:538
export const WATERSPLASH2____header_global_d84966c10731782b = ((((((1380) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d90f1e5d870a4bb79fb372dd() {
  return __cxx_static_address_d90f1e5d870a4bb79fb372dd.reference || (__cxx_static_address_d90f1e5d870a4bb79fb372dd.reference = {
    __cReference: true,
    get value() { return WATERSPLASH2____header_global_d84966c10731782b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:539
export const FIREVASE____header_global_a7f4a9a37503d714 = ((((((1390) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_032b99cf6f53d1ad963f9706() {
  return __cxx_static_address_032b99cf6f53d1ad963f9706.reference || (__cxx_static_address_032b99cf6f53d1ad963f9706.reference = {
    __cReference: true,
    get value() { return FIREVASE____header_global_a7f4a9a37503d714; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:540
export const FEM7____header_global_61c8c3e1723de3cb = ((((((1395) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_337a4cfb5885b104076f2f86() {
  return __cxx_static_address_337a4cfb5885b104076f2f86.reference || (__cxx_static_address_337a4cfb5885b104076f2f86.reference = {
    __cReference: true,
    get value() { return FEM7____header_global_61c8c3e1723de3cb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:541
export const APLAYERTOP____header_global_7ffed2a72ad66015 = ((((((1400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_24d34f0263e07c125ac4a31e() {
  return __cxx_static_address_24d34f0263e07c125ac4a31e.reference || (__cxx_static_address_24d34f0263e07c125ac4a31e.reference = {
    __cReference: true,
    get value() { return APLAYERTOP____header_global_7ffed2a72ad66015; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:542
export const APLAYER____header_global_bee597ef7fa06f95 = ((((((1405) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ef63cabaa47dad59f7e3ea2d() {
  return __cxx_static_address_ef63cabaa47dad59f7e3ea2d.reference || (__cxx_static_address_ef63cabaa47dad59f7e3ea2d.reference = {
    __cReference: true,
    get value() { return APLAYER____header_global_bee597ef7fa06f95; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:543
export const PLAYERONWATER____header_global_867b3bf5236dd2e3 = ((((((1420) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7ea74d1cb6b4304072fa94f9() {
  return __cxx_static_address_7ea74d1cb6b4304072fa94f9.reference || (__cxx_static_address_7ea74d1cb6b4304072fa94f9.reference = {
    __cReference: true,
    get value() { return PLAYERONWATER____header_global_867b3bf5236dd2e3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:544
export const DUKELYINGDEAD____header_global_6f36ae60700f80ae = ((((((1518) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c8b8a6d1d2ad6e0a29c50d79() {
  return __cxx_static_address_c8b8a6d1d2ad6e0a29c50d79.reference || (__cxx_static_address_c8b8a6d1d2ad6e0a29c50d79.reference = {
    __cReference: true,
    get value() { return DUKELYINGDEAD____header_global_6f36ae60700f80ae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:545
export const DUKETORSO____header_global_b47e53e71e7104c8 = ((((((1520) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d7b269b63c117c427966e84a() {
  return __cxx_static_address_d7b269b63c117c427966e84a.reference || (__cxx_static_address_d7b269b63c117c427966e84a.reference = {
    __cReference: true,
    get value() { return DUKETORSO____header_global_b47e53e71e7104c8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:546
export const DUKEGUN____header_global_c2203292675c30f1 = ((((((1528) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_44c63110f5a23f76bea371aa() {
  return __cxx_static_address_44c63110f5a23f76bea371aa.reference || (__cxx_static_address_44c63110f5a23f76bea371aa.reference = {
    __cReference: true,
    get value() { return DUKEGUN____header_global_c2203292675c30f1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:547
export const DUKELEG____header_global_5477046b6ae8a090 = ((((((1536) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_205632987d6769ae7d7527b5() {
  return __cxx_static_address_205632987d6769ae7d7527b5.reference || (__cxx_static_address_205632987d6769ae7d7527b5.reference = {
    __cReference: true,
    get value() { return DUKELEG____header_global_5477046b6ae8a090; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:548
export const SHARK____header_global_7faa407988adb2ec = ((((((1550) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5c0b61edff2847470d2c46be() {
  return __cxx_static_address_5c0b61edff2847470d2c46be.reference || (__cxx_static_address_5c0b61edff2847470d2c46be.reference = {
    __cReference: true,
    get value() { return SHARK____header_global_7faa407988adb2ec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:549
export const BLOOD____header_global_fdedec5c3d61689a = ((((((1620) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_876b51d1c67d152e856beae3() {
  return __cxx_static_address_876b51d1c67d152e856beae3.reference || (__cxx_static_address_876b51d1c67d152e856beae3.reference = {
    __cReference: true,
    get value() { return BLOOD____header_global_fdedec5c3d61689a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:550
export const FIRELASER____header_global_b96a6cc12516df78 = ((((((1625) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_124f1e08164a8b4241caedac() {
  return __cxx_static_address_124f1e08164a8b4241caedac.reference || (__cxx_static_address_124f1e08164a8b4241caedac.reference = {
    __cReference: true,
    get value() { return FIRELASER____header_global_b96a6cc12516df78; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:551
export const TRANSPORTERSTAR____header_global_fb0f61d07d5f61d7 = ((((((1630) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2634e1194a789df244307139() {
  return __cxx_static_address_2634e1194a789df244307139.reference || (__cxx_static_address_2634e1194a789df244307139.reference = {
    __cReference: true,
    get value() { return TRANSPORTERSTAR____header_global_fb0f61d07d5f61d7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:552
export const SPIT____header_global_e5a330bd0b826c1e = ((((((1636) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e1bff02955a72813c12b1b19() {
  return __cxx_static_address_e1bff02955a72813c12b1b19.reference || (__cxx_static_address_e1bff02955a72813c12b1b19.reference = {
    __cReference: true,
    get value() { return SPIT____header_global_e5a330bd0b826c1e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:553
export const LOOGIE____header_global_a081d0a053f5e7d5 = ((((((1637) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c69c11c568f7d4e357638682() {
  return __cxx_static_address_c69c11c568f7d4e357638682.reference || (__cxx_static_address_c69c11c568f7d4e357638682.reference = {
    __cReference: true,
    get value() { return LOOGIE____header_global_a081d0a053f5e7d5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:554
export const FIST____header_global_8ca1a44f4f757e99 = ((((((1640) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ca22b82c8ce531dc6561c559() {
  return __cxx_static_address_ca22b82c8ce531dc6561c559.reference || (__cxx_static_address_ca22b82c8ce531dc6561c559.reference = {
    __cReference: true,
    get value() { return FIST____header_global_8ca1a44f4f757e99; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:555
export const FREEZEBLAST____header_global_05b5f6eca1cf3c27 = ((((((1641) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_956e10be991c93e9356d46eb() {
  return __cxx_static_address_956e10be991c93e9356d46eb.reference || (__cxx_static_address_956e10be991c93e9356d46eb.reference = {
    __cReference: true,
    get value() { return FREEZEBLAST____header_global_05b5f6eca1cf3c27; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:556
export const SHRINKSPARK____header_global_21fa2b337cb149f1 = ((((((1646) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c8ede68c817beb27786b42d1() {
  return __cxx_static_address_c8ede68c817beb27786b42d1.reference || (__cxx_static_address_c8ede68c817beb27786b42d1.reference = {
    __cReference: true,
    get value() { return SHRINKSPARK____header_global_21fa2b337cb149f1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:557
export const TONGUE____header_global_c1630c08a3f7ede7 = ((((((1647) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fde8df5739ebfa3a226ce61e() {
  return __cxx_static_address_fde8df5739ebfa3a226ce61e.reference || (__cxx_static_address_fde8df5739ebfa3a226ce61e.reference = {
    __cReference: true,
    get value() { return TONGUE____header_global_c1630c08a3f7ede7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:558
export const MORTER____header_global_b47e32385486f8d5 = ((((((1650) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_98561c163fcca2292efb3cd9() {
  return __cxx_static_address_98561c163fcca2292efb3cd9.reference || (__cxx_static_address_98561c163fcca2292efb3cd9.reference = {
    __cReference: true,
    get value() { return MORTER____header_global_b47e32385486f8d5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:559
export const SHRINKEREXPLOSION____header_global_1875c869b4e431db = ((((((1656) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b0cb0e6771a16889a887e539() {
  return __cxx_static_address_b0cb0e6771a16889a887e539.reference || (__cxx_static_address_b0cb0e6771a16889a887e539.reference = {
    __cReference: true,
    get value() { return SHRINKEREXPLOSION____header_global_1875c869b4e431db; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:560
export const RADIUSEXPLOSION____header_global_c1b2d563e0b79eb2 = ((((((1670) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_df9ea13cb60177ca1073944a() {
  return __cxx_static_address_df9ea13cb60177ca1073944a.reference || (__cxx_static_address_df9ea13cb60177ca1073944a.reference = {
    __cReference: true,
    get value() { return RADIUSEXPLOSION____header_global_c1b2d563e0b79eb2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:561
export const FORCERIPPLE____header_global_c00090febe387840 = ((((((1671) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_72423e82500bfa6d9f4b4137() {
  return __cxx_static_address_72423e82500bfa6d9f4b4137.reference || (__cxx_static_address_72423e82500bfa6d9f4b4137.reference = {
    __cReference: true,
    get value() { return FORCERIPPLE____header_global_c00090febe387840; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:562
export const LIZTROOP____header_global_4afd98557e7ba2f4 = ((((((1680) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e854c7ebaf7acd0df2c67037() {
  return __cxx_static_address_e854c7ebaf7acd0df2c67037.reference || (__cxx_static_address_e854c7ebaf7acd0df2c67037.reference = {
    __cReference: true,
    get value() { return LIZTROOP____header_global_4afd98557e7ba2f4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:563
export const LIZTROOPRUNNING____header_global_7de82d9dbf3f077b = ((((((1681) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e1cfebab45d827e91b3c9d72() {
  return __cxx_static_address_e1cfebab45d827e91b3c9d72.reference || (__cxx_static_address_e1cfebab45d827e91b3c9d72.reference = {
    __cReference: true,
    get value() { return LIZTROOPRUNNING____header_global_7de82d9dbf3f077b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:564
export const LIZTROOPSTAYPUT____header_global_ff988352727af75b = ((((((1682) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e28bd762281b23e601594f18() {
  return __cxx_static_address_e28bd762281b23e601594f18.reference || (__cxx_static_address_e28bd762281b23e601594f18.reference = {
    __cReference: true,
    get value() { return LIZTROOPSTAYPUT____header_global_ff988352727af75b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:565
export const LIZTROOPSHOOT____header_global_d645159a544a7e75 = ((((((1715) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0e1979d11ec8cab827d243ab() {
  return __cxx_static_address_0e1979d11ec8cab827d243ab.reference || (__cxx_static_address_0e1979d11ec8cab827d243ab.reference = {
    __cReference: true,
    get value() { return LIZTROOPSHOOT____header_global_d645159a544a7e75; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:566
export const LIZTROOPJETPACK____header_global_915c9d0e1ab28d87 = ((((((1725) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_13d59c359824227206c4fa7d() {
  return __cxx_static_address_13d59c359824227206c4fa7d.reference || (__cxx_static_address_13d59c359824227206c4fa7d.reference = {
    __cReference: true,
    get value() { return LIZTROOPJETPACK____header_global_915c9d0e1ab28d87; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:567
export const LIZTROOPONTOILET____header_global_e363f43559b2bb97 = ((((((1741) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_94ba7a096f25ed94d15af6d3() {
  return __cxx_static_address_94ba7a096f25ed94d15af6d3.reference || (__cxx_static_address_94ba7a096f25ed94d15af6d3.reference = {
    __cReference: true,
    get value() { return LIZTROOPONTOILET____header_global_e363f43559b2bb97; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:568
export const LIZTROOPJUSTSIT____header_global_692125eacb6305ec = ((((((1742) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4b39adc9e78dcf9227736e14() {
  return __cxx_static_address_4b39adc9e78dcf9227736e14.reference || (__cxx_static_address_4b39adc9e78dcf9227736e14.reference = {
    __cReference: true,
    get value() { return LIZTROOPJUSTSIT____header_global_692125eacb6305ec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:569
export const LIZTROOPDUCKING____header_global_17cdb0ff0c3b0559 = ((((((1744) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b6df6590cf24a1301eda948d() {
  return __cxx_static_address_b6df6590cf24a1301eda948d.reference || (__cxx_static_address_b6df6590cf24a1301eda948d.reference = {
    __cReference: true,
    get value() { return LIZTROOPDUCKING____header_global_17cdb0ff0c3b0559; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:570
export const HEADJIB1____header_global_2831af860da31fe0 = ((((((1768) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c465e6d49aa36cac62a25a03() {
  return __cxx_static_address_c465e6d49aa36cac62a25a03.reference || (__cxx_static_address_c465e6d49aa36cac62a25a03.reference = {
    __cReference: true,
    get value() { return HEADJIB1____header_global_2831af860da31fe0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:571
export const ARMJIB1____header_global_abd852cd35c535cc = ((((((1772) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1fc9b2e8672ac702324653f6() {
  return __cxx_static_address_1fc9b2e8672ac702324653f6.reference || (__cxx_static_address_1fc9b2e8672ac702324653f6.reference = {
    __cReference: true,
    get value() { return ARMJIB1____header_global_abd852cd35c535cc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:572
export const LEGJIB1____header_global_a400b83b770f2a3e = ((((((1776) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_02c493063ab6f1bdb53a0e6b() {
  return __cxx_static_address_02c493063ab6f1bdb53a0e6b.reference || (__cxx_static_address_02c493063ab6f1bdb53a0e6b.reference = {
    __cReference: true,
    get value() { return LEGJIB1____header_global_a400b83b770f2a3e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:573
export const OCTABRAIN____header_global_cb570cdb4aec0fb0 = ((((((1820) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e4f6d5b762fac81cd62fff25() {
  return __cxx_static_address_e4f6d5b762fac81cd62fff25.reference || (__cxx_static_address_e4f6d5b762fac81cd62fff25.reference = {
    __cReference: true,
    get value() { return OCTABRAIN____header_global_cb570cdb4aec0fb0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:574
export const OCTABRAINSTAYPUT____header_global_44aec6989f50996b = ((((((1821) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9725a132e41ed5c6be3e95c6() {
  return __cxx_static_address_9725a132e41ed5c6be3e95c6.reference || (__cxx_static_address_9725a132e41ed5c6be3e95c6.reference = {
    __cReference: true,
    get value() { return OCTABRAINSTAYPUT____header_global_44aec6989f50996b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:575
export const INNERJAW____header_global_25b37db97bb203a0 = ((((((1860) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9fcaf17b9e641bac825f50b1() {
  return __cxx_static_address_9fcaf17b9e641bac825f50b1.reference || (__cxx_static_address_9fcaf17b9e641bac825f50b1.reference = {
    __cReference: true,
    get value() { return INNERJAW____header_global_25b37db97bb203a0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:576
export const DRONE____header_global_7a8ba27bdc98882e = ((((((1880) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3698fd71356ef294984aac75() {
  return __cxx_static_address_3698fd71356ef294984aac75.reference || (__cxx_static_address_3698fd71356ef294984aac75.reference = {
    __cReference: true,
    get value() { return DRONE____header_global_7a8ba27bdc98882e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:577
export const EXPLOSION2____header_global_af365c7071fb0b38 = ((((((1890) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0fd4f56fb40474987d7e466c() {
  return __cxx_static_address_0fd4f56fb40474987d7e466c.reference || (__cxx_static_address_0fd4f56fb40474987d7e466c.reference = {
    __cReference: true,
    get value() { return EXPLOSION2____header_global_af365c7071fb0b38; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:578
export const COMMANDER____header_global_20b22e0dcca4edf5 = ((((((1920) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7ace923f1facba106fe930d1() {
  return __cxx_static_address_7ace923f1facba106fe930d1.reference || (__cxx_static_address_7ace923f1facba106fe930d1.reference = {
    __cReference: true,
    get value() { return COMMANDER____header_global_20b22e0dcca4edf5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:579
export const COMMANDERSTAYPUT____header_global_de66f172d5634137 = ((((((1921) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_032bb3819869e77e5c32bac8() {
  return __cxx_static_address_032bb3819869e77e5c32bac8.reference || (__cxx_static_address_032bb3819869e77e5c32bac8.reference = {
    __cReference: true,
    get value() { return COMMANDERSTAYPUT____header_global_de66f172d5634137; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:580
export const RECON____header_global_263a0f43eb51002f = ((((((1960) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bc24e95aad1695594918403a() {
  return __cxx_static_address_bc24e95aad1695594918403a.reference || (__cxx_static_address_bc24e95aad1695594918403a.reference = {
    __cReference: true,
    get value() { return RECON____header_global_263a0f43eb51002f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:581
export const TANK____header_global_bed926f3a1877d2f = ((((((1975) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_027a508a57aff39bda0d3295() {
  return __cxx_static_address_027a508a57aff39bda0d3295.reference || (__cxx_static_address_027a508a57aff39bda0d3295.reference = {
    __cReference: true,
    get value() { return TANK____header_global_bed926f3a1877d2f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:582
export const PIGCOP____header_global_cc68dbb15abba026 = ((((((2000) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_20841031a9ad084c3718e4be() {
  return __cxx_static_address_20841031a9ad084c3718e4be.reference || (__cxx_static_address_20841031a9ad084c3718e4be.reference = {
    __cReference: true,
    get value() { return PIGCOP____header_global_cc68dbb15abba026; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:583
export const PIGCOPSTAYPUT____header_global_2ca7f523a6c75600 = ((((((2001) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6c218488aefb3a4fe5835513() {
  return __cxx_static_address_6c218488aefb3a4fe5835513.reference || (__cxx_static_address_6c218488aefb3a4fe5835513.reference = {
    __cReference: true,
    get value() { return PIGCOPSTAYPUT____header_global_2ca7f523a6c75600; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:584
export const PIGCOPDIVE____header_global_6ebc9d16a4012e63 = ((((((2045) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c39501cc1dc2ce3e402f8760() {
  return __cxx_static_address_c39501cc1dc2ce3e402f8760.reference || (__cxx_static_address_c39501cc1dc2ce3e402f8760.reference = {
    __cReference: true,
    get value() { return PIGCOPDIVE____header_global_6ebc9d16a4012e63; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:585
export const LIZMAN____header_global_8c3f33ca697ba88a = ((((((2120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_473c07942a9874ca8455e2ba() {
  return __cxx_static_address_473c07942a9874ca8455e2ba.reference || (__cxx_static_address_473c07942a9874ca8455e2ba.reference = {
    __cReference: true,
    get value() { return LIZMAN____header_global_8c3f33ca697ba88a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:586
export const LIZMANSTAYPUT____header_global_f219d3d4c8d78c58 = ((((((2121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c70c47dd7f7a767dcf9e5ea4() {
  return __cxx_static_address_c70c47dd7f7a767dcf9e5ea4.reference || (__cxx_static_address_c70c47dd7f7a767dcf9e5ea4.reference = {
    __cReference: true,
    get value() { return LIZMANSTAYPUT____header_global_f219d3d4c8d78c58; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:587
export const LIZMANSPITTING____header_global_868943dc596f3106 = ((((((2150) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fde90d2de54ce5b74cda6951() {
  return __cxx_static_address_fde90d2de54ce5b74cda6951.reference || (__cxx_static_address_fde90d2de54ce5b74cda6951.reference = {
    __cReference: true,
    get value() { return LIZMANSPITTING____header_global_868943dc596f3106; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:588
export const LIZMANFEEDING____header_global_be10412b6a100fd1 = ((((((2160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3bf1c68da5fd6bfa13a24986() {
  return __cxx_static_address_3bf1c68da5fd6bfa13a24986.reference || (__cxx_static_address_3bf1c68da5fd6bfa13a24986.reference = {
    __cReference: true,
    get value() { return LIZMANFEEDING____header_global_be10412b6a100fd1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:589
export const LIZMANJUMP____header_global_4a5ee762fe7f00bb = ((((((2165) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b3db1bc6dbfc5eea96419454() {
  return __cxx_static_address_b3db1bc6dbfc5eea96419454.reference || (__cxx_static_address_b3db1bc6dbfc5eea96419454.reference = {
    __cReference: true,
    get value() { return LIZMANJUMP____header_global_4a5ee762fe7f00bb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:590
export const FECES____header_global_dea28ff57641bc0b = ((((((2200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cc8e7ed21a64beb38f216026() {
  return __cxx_static_address_cc8e7ed21a64beb38f216026.reference || (__cxx_static_address_cc8e7ed21a64beb38f216026.reference = {
    __cReference: true,
    get value() { return FECES____header_global_dea28ff57641bc0b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:591
export const LIZMANHEAD1____header_global_de0c345a9a29a1e1 = ((((((2201) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8dae4bbd59713d97d0797a75() {
  return __cxx_static_address_8dae4bbd59713d97d0797a75.reference || (__cxx_static_address_8dae4bbd59713d97d0797a75.reference = {
    __cReference: true,
    get value() { return LIZMANHEAD1____header_global_de0c345a9a29a1e1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:592
export const LIZMANARM1____header_global_215dafd0fcc9653b = ((((((2205) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_91268f6bdd65f4e8668f4a72() {
  return __cxx_static_address_91268f6bdd65f4e8668f4a72.reference || (__cxx_static_address_91268f6bdd65f4e8668f4a72.reference = {
    __cReference: true,
    get value() { return LIZMANARM1____header_global_215dafd0fcc9653b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:593
export const LIZMANLEG1____header_global_d8f9def275901182 = ((((((2209) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d1d9df7a87b44c26cf69ddac() {
  return __cxx_static_address_d1d9df7a87b44c26cf69ddac.reference || (__cxx_static_address_d1d9df7a87b44c26cf69ddac.reference = {
    __cReference: true,
    get value() { return LIZMANLEG1____header_global_d8f9def275901182; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:594
export const EXPLOSION2BOT____header_global_bcd5215c21cd453f = ((((((2219) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ee4c0e2ef8d9727382324f15() {
  return __cxx_static_address_ee4c0e2ef8d9727382324f15.reference || (__cxx_static_address_ee4c0e2ef8d9727382324f15.reference = {
    __cReference: true,
    get value() { return EXPLOSION2BOT____header_global_bcd5215c21cd453f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:595
export const JIBS1____header_global_8e2ccf0b61fce91c = ((((((2245) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_be6e3db505b833974cc4df92() {
  return __cxx_static_address_be6e3db505b833974cc4df92.reference || (__cxx_static_address_be6e3db505b833974cc4df92.reference = {
    __cReference: true,
    get value() { return JIBS1____header_global_8e2ccf0b61fce91c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:596
export const JIBS2____header_global_324ff9f390631c84 = ((((((2250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_916d777a1ad05c905ecbad5b() {
  return __cxx_static_address_916d777a1ad05c905ecbad5b.reference || (__cxx_static_address_916d777a1ad05c905ecbad5b.reference = {
    __cReference: true,
    get value() { return JIBS2____header_global_324ff9f390631c84; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:597
export const JIBS3____header_global_1bd329cf9aaa9aaf = ((((((2255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f275e6abe2b2d912ca2560ca() {
  return __cxx_static_address_f275e6abe2b2d912ca2560ca.reference || (__cxx_static_address_f275e6abe2b2d912ca2560ca.reference = {
    __cReference: true,
    get value() { return JIBS3____header_global_1bd329cf9aaa9aaf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:598
export const JIBS4____header_global_37103c333e8f99f2 = ((((((2260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f4560425e80c9089c28eb2d6() {
  return __cxx_static_address_f4560425e80c9089c28eb2d6.reference || (__cxx_static_address_f4560425e80c9089c28eb2d6.reference = {
    __cReference: true,
    get value() { return JIBS4____header_global_37103c333e8f99f2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:599
export const JIBS5____header_global_0484161cc0c938df = ((((((2265) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_78cc6d2231432df5afb505c3() {
  return __cxx_static_address_78cc6d2231432df5afb505c3.reference || (__cxx_static_address_78cc6d2231432df5afb505c3.reference = {
    __cReference: true,
    get value() { return JIBS5____header_global_0484161cc0c938df; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:600
export const BURNING____header_global_e742b97f48012a9f = ((((((2270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a0dda3165065f854ff318565() {
  return __cxx_static_address_a0dda3165065f854ff318565.reference || (__cxx_static_address_a0dda3165065f854ff318565.reference = {
    __cReference: true,
    get value() { return BURNING____header_global_e742b97f48012a9f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:601
export const FIRE____header_global_17630802e38b00f9 = ((((((2271) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_132e8d30e75b99d1e827036a() {
  return __cxx_static_address_132e8d30e75b99d1e827036a.reference || (__cxx_static_address_132e8d30e75b99d1e827036a.reference = {
    __cReference: true,
    get value() { return FIRE____header_global_17630802e38b00f9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:602
export const JIBS6____header_global_9923519005a80d70 = ((((((2286) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8b39b18f50500023e604d2ab() {
  return __cxx_static_address_8b39b18f50500023e604d2ab.reference || (__cxx_static_address_8b39b18f50500023e604d2ab.reference = {
    __cReference: true,
    get value() { return JIBS6____header_global_9923519005a80d70; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:603
export const BLOODSPLAT1____header_global_75f4fa6d1df5a22a = ((((((2296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7baddf7677c960bb70ee6a6a() {
  return __cxx_static_address_7baddf7677c960bb70ee6a6a.reference || (__cxx_static_address_7baddf7677c960bb70ee6a6a.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT1____header_global_75f4fa6d1df5a22a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:604
export const BLOODSPLAT3____header_global_2db5e01e3f3161fb = ((((((2297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e3a2b6c631ca97d8f522b353() {
  return __cxx_static_address_e3a2b6c631ca97d8f522b353.reference || (__cxx_static_address_e3a2b6c631ca97d8f522b353.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT3____header_global_2db5e01e3f3161fb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:605
export const BLOODSPLAT2____header_global_de5c6d2b33f76e3a = ((((((2298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_91855b25f7f99a121b4ece83() {
  return __cxx_static_address_91855b25f7f99a121b4ece83.reference || (__cxx_static_address_91855b25f7f99a121b4ece83.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT2____header_global_de5c6d2b33f76e3a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:606
export const BLOODSPLAT4____header_global_7b899f36d498f5d4 = ((((((2299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6d25a2fd0026ee3c7046f0d0() {
  return __cxx_static_address_6d25a2fd0026ee3c7046f0d0.reference || (__cxx_static_address_6d25a2fd0026ee3c7046f0d0.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT4____header_global_7b899f36d498f5d4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:607
export const OOZ____header_global_43653e0390d933dc = ((((((2300) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_61f9e352dafe3db05587d620() {
  return __cxx_static_address_61f9e352dafe3db05587d620.reference || (__cxx_static_address_61f9e352dafe3db05587d620.reference = {
    __cReference: true,
    get value() { return OOZ____header_global_43653e0390d933dc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:608
export const OOZ2____header_global_094bb98eda9be31e = ((((((2309) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_19b0d5b83b4ba17297a7b222() {
  return __cxx_static_address_19b0d5b83b4ba17297a7b222.reference || (__cxx_static_address_19b0d5b83b4ba17297a7b222.reference = {
    __cReference: true,
    get value() { return OOZ2____header_global_094bb98eda9be31e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:609
export const WALLBLOOD1____header_global_53f1b92a889b4208 = ((((((2301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5b5380a00332965ad92748b2() {
  return __cxx_static_address_5b5380a00332965ad92748b2.reference || (__cxx_static_address_5b5380a00332965ad92748b2.reference = {
    __cReference: true,
    get value() { return WALLBLOOD1____header_global_53f1b92a889b4208; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:610
export const WALLBLOOD2____header_global_20e4c408b5760201 = ((((((2302) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d0cf6a09dfcd6fbc55ee0e31() {
  return __cxx_static_address_d0cf6a09dfcd6fbc55ee0e31.reference || (__cxx_static_address_d0cf6a09dfcd6fbc55ee0e31.reference = {
    __cReference: true,
    get value() { return WALLBLOOD2____header_global_20e4c408b5760201; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:611
export const WALLBLOOD3____header_global_d9259cf030aabcd6 = ((((((2303) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ab7845108e26e98c4395a428() {
  return __cxx_static_address_ab7845108e26e98c4395a428.reference || (__cxx_static_address_ab7845108e26e98c4395a428.reference = {
    __cReference: true,
    get value() { return WALLBLOOD3____header_global_d9259cf030aabcd6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:612
export const WALLBLOOD4____header_global_38c7a116602a2752 = ((((((2304) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a453bd7c41a5d28947d0c945() {
  return __cxx_static_address_a453bd7c41a5d28947d0c945.reference || (__cxx_static_address_a453bd7c41a5d28947d0c945.reference = {
    __cReference: true,
    get value() { return WALLBLOOD4____header_global_38c7a116602a2752; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:613
export const WALLBLOOD5____header_global_eb666ee80dd27222 = ((((((2305) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_036df109382cf21e2fd98adf() {
  return __cxx_static_address_036df109382cf21e2fd98adf.reference || (__cxx_static_address_036df109382cf21e2fd98adf.reference = {
    __cReference: true,
    get value() { return WALLBLOOD5____header_global_eb666ee80dd27222; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:614
export const WALLBLOOD7____header_global_5e5b498c2135b8a6 = ((((((2307) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_174021a4d13937c2dbf85d4a() {
  return __cxx_static_address_174021a4d13937c2dbf85d4a.reference || (__cxx_static_address_174021a4d13937c2dbf85d4a.reference = {
    __cReference: true,
    get value() { return WALLBLOOD7____header_global_5e5b498c2135b8a6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:615
export const WALLBLOOD8____header_global_d4e48fefc53712cd = ((((((2308) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5584717ec1951704f1dbd088() {
  return __cxx_static_address_5584717ec1951704f1dbd088.reference || (__cxx_static_address_5584717ec1951704f1dbd088.reference = {
    __cReference: true,
    get value() { return WALLBLOOD8____header_global_d4e48fefc53712cd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:616
export const BURNING2____header_global_ac9002c2273bbc0c = ((((((2310) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d9a5dddca143c450c44f69c4() {
  return __cxx_static_address_d9a5dddca143c450c44f69c4.reference || (__cxx_static_address_d9a5dddca143c450c44f69c4.reference = {
    __cReference: true,
    get value() { return BURNING2____header_global_ac9002c2273bbc0c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:617
export const FIRE2____header_global_293d3c69726db2bf = ((((((2311) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a622d71aba2f353b2572127c() {
  return __cxx_static_address_a622d71aba2f353b2572127c.reference || (__cxx_static_address_a622d71aba2f353b2572127c.reference = {
    __cReference: true,
    get value() { return FIRE2____header_global_293d3c69726db2bf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:618
export const CRACKKNUCKLES____header_global_537f452c52e7fdf1 = ((((((2324) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ed03ca0ba8163b62698c7c29() {
  return __cxx_static_address_ed03ca0ba8163b62698c7c29.reference || (__cxx_static_address_ed03ca0ba8163b62698c7c29.reference = {
    __cReference: true,
    get value() { return CRACKKNUCKLES____header_global_537f452c52e7fdf1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:619
export const SMALLSMOKE____header_global_99b4aa94de8de095 = ((((((2329) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4fb91aed6eaf677726091698() {
  return __cxx_static_address_4fb91aed6eaf677726091698.reference || (__cxx_static_address_4fb91aed6eaf677726091698.reference = {
    __cReference: true,
    get value() { return SMALLSMOKE____header_global_99b4aa94de8de095; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:620
export const FLOORFLAME____header_global_c48ead3d976ec08a = ((((((2333) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d2a50d34d34e39477f67b94d() {
  return __cxx_static_address_d2a50d34d34e39477f67b94d.reference || (__cxx_static_address_d2a50d34d34e39477f67b94d.reference = {
    __cReference: true,
    get value() { return FLOORFLAME____header_global_c48ead3d976ec08a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:621
export const ROTATEGUN____header_global_b957c0b86809006b = ((((((2360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_71b356b39b2e722252482df3() {
  return __cxx_static_address_71b356b39b2e722252482df3.reference || (__cxx_static_address_71b356b39b2e722252482df3.reference = {
    __cReference: true,
    get value() { return ROTATEGUN____header_global_b957c0b86809006b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:622
export const GREENSLIME____header_global_8e69133552d11a0d = ((((((2370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e7a9a098b34bc16a000d2d24() {
  return __cxx_static_address_e7a9a098b34bc16a000d2d24.reference || (__cxx_static_address_e7a9a098b34bc16a000d2d24.reference = {
    __cReference: true,
    get value() { return GREENSLIME____header_global_8e69133552d11a0d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:623
export const WATERDRIPSPLASH____header_global_1ed634c60e0e89aa = ((((((2380) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d83c78b89d82df8d551b05aa() {
  return __cxx_static_address_d83c78b89d82df8d551b05aa.reference || (__cxx_static_address_d83c78b89d82df8d551b05aa.reference = {
    __cReference: true,
    get value() { return WATERDRIPSPLASH____header_global_1ed634c60e0e89aa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:624
export const SCRAP6____header_global_21fa9052bdc58b13 = ((((((2390) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_358093387418141fded189ec() {
  return __cxx_static_address_358093387418141fded189ec.reference || (__cxx_static_address_358093387418141fded189ec.reference = {
    __cReference: true,
    get value() { return SCRAP6____header_global_21fa9052bdc58b13; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:625
export const SCRAP1____header_global_b1873faee9361408 = ((((((2400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_94d8f8dedd223a3c38deaca1() {
  return __cxx_static_address_94d8f8dedd223a3c38deaca1.reference || (__cxx_static_address_94d8f8dedd223a3c38deaca1.reference = {
    __cReference: true,
    get value() { return SCRAP1____header_global_b1873faee9361408; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:626
export const SCRAP2____header_global_6e47d08ae1d94637 = ((((((2404) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e057075728f626e22812c263() {
  return __cxx_static_address_e057075728f626e22812c263.reference || (__cxx_static_address_e057075728f626e22812c263.reference = {
    __cReference: true,
    get value() { return SCRAP2____header_global_6e47d08ae1d94637; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:627
export const SCRAP3____header_global_fab22b54e2201809 = ((((((2408) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7a951456d39dd23119ebb093() {
  return __cxx_static_address_7a951456d39dd23119ebb093.reference || (__cxx_static_address_7a951456d39dd23119ebb093.reference = {
    __cReference: true,
    get value() { return SCRAP3____header_global_fab22b54e2201809; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:628
export const SCRAP4____header_global_8797dee219b52065 = ((((((2412) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_daf521e5f5a66cb92483228b() {
  return __cxx_static_address_daf521e5f5a66cb92483228b.reference || (__cxx_static_address_daf521e5f5a66cb92483228b.reference = {
    __cReference: true,
    get value() { return SCRAP4____header_global_8797dee219b52065; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:629
export const SCRAP5____header_global_3dece78f64b1b0a0 = ((((((2416) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dea2dcfcd37079d4a9fb93d7() {
  return __cxx_static_address_dea2dcfcd37079d4a9fb93d7.reference || (__cxx_static_address_dea2dcfcd37079d4a9fb93d7.reference = {
    __cReference: true,
    get value() { return SCRAP5____header_global_3dece78f64b1b0a0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:630
export const ORGANTIC____header_global_bbe5b82b32a9ffb5 = ((((((2420) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6b862e5e26eb3253550055dc() {
  return __cxx_static_address_6b862e5e26eb3253550055dc.reference || (__cxx_static_address_6b862e5e26eb3253550055dc.reference = {
    __cReference: true,
    get value() { return ORGANTIC____header_global_bbe5b82b32a9ffb5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:631
export const BETAVERSION____header_global_43ebddca7c4b847e = ((((((2440) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8df51c4cefca541612cfe414() {
  return __cxx_static_address_8df51c4cefca541612cfe414.reference || (__cxx_static_address_8df51c4cefca541612cfe414.reference = {
    __cReference: true,
    get value() { return BETAVERSION____header_global_43ebddca7c4b847e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:632
export const SELECTDIR____header_global_48a2ab1da816c485 = ((((((2444) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c54021233e531689cd9592af() {
  return __cxx_static_address_c54021233e531689cd9592af.reference || (__cxx_static_address_c54021233e531689cd9592af.reference = {
    __cReference: true,
    get value() { return SELECTDIR____header_global_48a2ab1da816c485; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:633
export const F1HELP____header_global_4cf2a4b54c5c422e = ((((((2445) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_49ea7466d1a8691afcce588f() {
  return __cxx_static_address_49ea7466d1a8691afcce588f.reference || (__cxx_static_address_49ea7466d1a8691afcce588f.reference = {
    __cReference: true,
    get value() { return F1HELP____header_global_4cf2a4b54c5c422e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:634
export const GROWSPARK____header_global_f947cd59c1593afc = ((((((2448) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_de6f11998f8ee6d3e36d6436() {
  return __cxx_static_address_de6f11998f8ee6d3e36d6436.reference || (__cxx_static_address_de6f11998f8ee6d3e36d6436.reference = {
    __cReference: true,
    get value() { return GROWSPARK____header_global_f947cd59c1593afc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:635
export const MENUSCREEN____header_global_bd9a5f67002eb852 = ((((((2456) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_04627921137c2cf6204fbad5() {
  return __cxx_static_address_04627921137c2cf6204fbad5.reference || (__cxx_static_address_04627921137c2cf6204fbad5.reference = {
    __cReference: true,
    get value() { return MENUSCREEN____header_global_bd9a5f67002eb852; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:636
export const MENUBAR____header_global_f151eaa82b27d04d = ((((((2457) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2565e4866754dfb1131775d3() {
  return __cxx_static_address_2565e4866754dfb1131775d3.reference || (__cxx_static_address_2565e4866754dfb1131775d3.reference = {
    __cReference: true,
    get value() { return MENUBAR____header_global_f151eaa82b27d04d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:637
export const KILLSICON____header_global_7aa19ff32b358c99 = ((((((2458) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_79d5e952f4f1010a555e7600() {
  return __cxx_static_address_79d5e952f4f1010a555e7600.reference || (__cxx_static_address_79d5e952f4f1010a555e7600.reference = {
    __cReference: true,
    get value() { return KILLSICON____header_global_7aa19ff32b358c99; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:638
export const FIRSTAID_ICON____header_global_a6b1c95bcfb14af2 = ((((((2460) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3561f46a8963da8c0b5e2625() {
  return __cxx_static_address_3561f46a8963da8c0b5e2625.reference || (__cxx_static_address_3561f46a8963da8c0b5e2625.reference = {
    __cReference: true,
    get value() { return FIRSTAID_ICON____header_global_a6b1c95bcfb14af2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:639
export const HEAT_ICON____header_global_0639993f92042992 = ((((((2461) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4104228283639644ce9ae272() {
  return __cxx_static_address_4104228283639644ce9ae272.reference || (__cxx_static_address_4104228283639644ce9ae272.reference = {
    __cReference: true,
    get value() { return HEAT_ICON____header_global_0639993f92042992; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:640
export const BOTTOMSTATUSBAR____header_global_ccbf98cc54a91e26 = ((((((2462) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f337c352929989a06e13986f() {
  return __cxx_static_address_f337c352929989a06e13986f.reference || (__cxx_static_address_f337c352929989a06e13986f.reference = {
    __cReference: true,
    get value() { return BOTTOMSTATUSBAR____header_global_ccbf98cc54a91e26; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:641
export const BOOT_ICON____header_global_09523da94481c312 = ((((((2463) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cfd3eb5bdca50215a64a0637() {
  return __cxx_static_address_cfd3eb5bdca50215a64a0637.reference || (__cxx_static_address_cfd3eb5bdca50215a64a0637.reference = {
    __cReference: true,
    get value() { return BOOT_ICON____header_global_09523da94481c312; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:642
export const FRAGBAR____header_global_a1e6918e01016d4f = ((((((2465) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2daad24506773e34b0068273() {
  return __cxx_static_address_2daad24506773e34b0068273.reference || (__cxx_static_address_2daad24506773e34b0068273.reference = {
    __cReference: true,
    get value() { return FRAGBAR____header_global_a1e6918e01016d4f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:643
export const JETPACK_ICON____header_global_3bfbcc1fbf351854 = ((((((2467) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c21ccd0c634c356aa66d20ff() {
  return __cxx_static_address_c21ccd0c634c356aa66d20ff.reference || (__cxx_static_address_c21ccd0c634c356aa66d20ff.reference = {
    __cReference: true,
    get value() { return JETPACK_ICON____header_global_3bfbcc1fbf351854; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:644
export const AIRTANK_ICON____header_global_62cf1c7a0999f16a = ((((((2468) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_80fdbb877e3d59b3241deec2() {
  return __cxx_static_address_80fdbb877e3d59b3241deec2.reference || (__cxx_static_address_80fdbb877e3d59b3241deec2.reference = {
    __cReference: true,
    get value() { return AIRTANK_ICON____header_global_62cf1c7a0999f16a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:645
export const STEROIDS_ICON____header_global_0e5be2008dfeb544 = ((((((2469) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_23efc1b56fea74c8e8eb11f4() {
  return __cxx_static_address_23efc1b56fea74c8e8eb11f4.reference || (__cxx_static_address_23efc1b56fea74c8e8eb11f4.reference = {
    __cReference: true,
    get value() { return STEROIDS_ICON____header_global_0e5be2008dfeb544; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:646
export const HOLODUKE_ICON____header_global_3700a943ec4ea309 = ((((((2470) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c453623b0cde7b3c1776d2ff() {
  return __cxx_static_address_c453623b0cde7b3c1776d2ff.reference || (__cxx_static_address_c453623b0cde7b3c1776d2ff.reference = {
    __cReference: true,
    get value() { return HOLODUKE_ICON____header_global_3700a943ec4ea309; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:647
export const ACCESS_ICON____header_global_04f72bdeb448d800 = ((((((2471) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_83e6bc31a4bc517bd2e294e4() {
  return __cxx_static_address_83e6bc31a4bc517bd2e294e4.reference || (__cxx_static_address_83e6bc31a4bc517bd2e294e4.reference = {
    __cReference: true,
    get value() { return ACCESS_ICON____header_global_04f72bdeb448d800; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:648
export const DIGITALNUM____header_global_4dbb07fb734b3359 = ((((((2472) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_31283317f9cc277345d9b424() {
  return __cxx_static_address_31283317f9cc277345d9b424.reference || (__cxx_static_address_31283317f9cc277345d9b424.reference = {
    __cReference: true,
    get value() { return DIGITALNUM____header_global_4dbb07fb734b3359; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:649
export const DUKECAR____header_global_5453820fc593e13f = ((((((2491) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_60928dff5704f8fdc36d0f11() {
  return __cxx_static_address_60928dff5704f8fdc36d0f11.reference || (__cxx_static_address_60928dff5704f8fdc36d0f11.reference = {
    __cReference: true,
    get value() { return DUKECAR____header_global_5453820fc593e13f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:650
export const CAMCORNER____header_global_382e18805cb2a4d5 = ((((((2482) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dc1cb5b1e67a728091463b03() {
  return __cxx_static_address_dc1cb5b1e67a728091463b03.reference || (__cxx_static_address_dc1cb5b1e67a728091463b03.reference = {
    __cReference: true,
    get value() { return CAMCORNER____header_global_382e18805cb2a4d5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:651
export const CAMLIGHT____header_global_1245522e15d43b21 = ((((((2484) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_219f4af2b3c7c6f4f6ed66c9() {
  return __cxx_static_address_219f4af2b3c7c6f4f6ed66c9.reference || (__cxx_static_address_219f4af2b3c7c6f4f6ed66c9.reference = {
    __cReference: true,
    get value() { return CAMLIGHT____header_global_1245522e15d43b21; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:652
export const SLIDEBAR____header_global_3f4b43bbcff7ee41 = ((((((2489) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_538be78307ced6db96da7b74() {
  return __cxx_static_address_538be78307ced6db96da7b74.reference || (__cxx_static_address_538be78307ced6db96da7b74.reference = {
    __cReference: true,
    get value() { return SLIDEBAR____header_global_3f4b43bbcff7ee41; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:653
export const DREALMS____header_global_d34a9870d07e6abb = ((((((2492) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5f19fdda72c87e1018cb8244() {
  return __cxx_static_address_5f19fdda72c87e1018cb8244.reference || (__cxx_static_address_5f19fdda72c87e1018cb8244.reference = {
    __cReference: true,
    get value() { return DREALMS____header_global_d34a9870d07e6abb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:654
export const BETASCREEN____header_global_78641f983a6d129b = ((((((2493) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e702d14e52a2176f53a721d5() {
  return __cxx_static_address_e702d14e52a2176f53a721d5.reference || (__cxx_static_address_e702d14e52a2176f53a721d5.reference = {
    __cReference: true,
    get value() { return BETASCREEN____header_global_78641f983a6d129b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:655
export const WINDOWBORDER1____header_global_e277adfa5a3c92a6 = ((((((2494) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ebe172edd99069343e6109e4() {
  return __cxx_static_address_ebe172edd99069343e6109e4.reference || (__cxx_static_address_ebe172edd99069343e6109e4.reference = {
    __cReference: true,
    get value() { return WINDOWBORDER1____header_global_e277adfa5a3c92a6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:656
export const TEXTBOX____header_global_ef05dddeb60826ad = ((((((2495) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9ee2865774488121e37c48d2() {
  return __cxx_static_address_9ee2865774488121e37c48d2.reference || (__cxx_static_address_9ee2865774488121e37c48d2.reference = {
    __cReference: true,
    get value() { return TEXTBOX____header_global_ef05dddeb60826ad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:657
export const WINDOWBORDER2____header_global_c63b57b52ca2a6f7 = ((((((2496) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_07b5cead2aaecad9cc733dfa() {
  return __cxx_static_address_07b5cead2aaecad9cc733dfa.reference || (__cxx_static_address_07b5cead2aaecad9cc733dfa.reference = {
    __cReference: true,
    get value() { return WINDOWBORDER2____header_global_c63b57b52ca2a6f7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:658
export const DUKENUKEM____header_global_59f72f5bbf59c1b9 = ((((((2497) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9638b781b9c8d219bc3e14b4() {
  return __cxx_static_address_9638b781b9c8d219bc3e14b4.reference || (__cxx_static_address_9638b781b9c8d219bc3e14b4.reference = {
    __cReference: true,
    get value() { return DUKENUKEM____header_global_59f72f5bbf59c1b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:659
export const THREEDEE____header_global_4e273da9e806a5f6 = ((((((2498) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_68cc69a538ff98070963b31b() {
  return __cxx_static_address_68cc69a538ff98070963b31b.reference || (__cxx_static_address_68cc69a538ff98070963b31b.reference = {
    __cReference: true,
    get value() { return THREEDEE____header_global_4e273da9e806a5f6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:660
export const INGAMEDUKETHREEDEE____header_global_7427526b2e175b57 = ((((((2499) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_86f0d402cf6b54b730e19c17() {
  return __cxx_static_address_86f0d402cf6b54b730e19c17.reference || (__cxx_static_address_86f0d402cf6b54b730e19c17.reference = {
    __cReference: true,
    get value() { return INGAMEDUKETHREEDEE____header_global_7427526b2e175b57; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:661
export const TENSCREEN____header_global_b7c90980b6c26459 = ((((((2500) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6358101299d21a3b06c40962() {
  return __cxx_static_address_6358101299d21a3b06c40962.reference || (__cxx_static_address_6358101299d21a3b06c40962.reference = {
    __cReference: true,
    get value() { return TENSCREEN____header_global_b7c90980b6c26459; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:662
export const PLUTOPAKSPRITE____header_global_d367000f40d825fd = ((((((2501) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_21b69f67e0e416a9393208e9() {
  return __cxx_static_address_21b69f67e0e416a9393208e9.reference || (__cxx_static_address_21b69f67e0e416a9393208e9.reference = {
    __cReference: true,
    get value() { return PLUTOPAKSPRITE____header_global_d367000f40d825fd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:663
export const DEVISTATOR____header_global_c9c1cd3507f331b5 = ((((((2510) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_21bbbde26c47315475684ab6() {
  return __cxx_static_address_21bbbde26c47315475684ab6.reference || (__cxx_static_address_21bbbde26c47315475684ab6.reference = {
    __cReference: true,
    get value() { return DEVISTATOR____header_global_c9c1cd3507f331b5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:664
export const KNEE____header_global_328e51abe8aef0bc = ((((((2521) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_81bf6afa2b6a51f5b2ccbefd() {
  return __cxx_static_address_81bf6afa2b6a51f5b2ccbefd.reference || (__cxx_static_address_81bf6afa2b6a51f5b2ccbefd.reference = {
    __cReference: true,
    get value() { return KNEE____header_global_328e51abe8aef0bc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:665
export const CROSSHAIR____header_global_388ce9847d025327 = ((((((2523) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_01fa4e09e94828627be736d7() {
  return __cxx_static_address_01fa4e09e94828627be736d7.reference || (__cxx_static_address_01fa4e09e94828627be736d7.reference = {
    __cReference: true,
    get value() { return CROSSHAIR____header_global_388ce9847d025327; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:666
export const FIRSTGUN____header_global_9645b4d46fdb5ce6 = ((((((2524) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e8fdd05826448f4ed8ab0c9e() {
  return __cxx_static_address_e8fdd05826448f4ed8ab0c9e.reference || (__cxx_static_address_e8fdd05826448f4ed8ab0c9e.reference = {
    __cReference: true,
    get value() { return FIRSTGUN____header_global_9645b4d46fdb5ce6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:667
export const FIRSTGUNRELOAD____header_global_8c6e178c4cc85fcc = ((((((2528) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ca58820133b431546fd281db() {
  return __cxx_static_address_ca58820133b431546fd281db.reference || (__cxx_static_address_ca58820133b431546fd281db.reference = {
    __cReference: true,
    get value() { return FIRSTGUNRELOAD____header_global_8c6e178c4cc85fcc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:668
export const SHELL____header_global_651e84895e6f42dc = ((((((2533) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_606c4afd51c868863a2dbb90() {
  return __cxx_static_address_606c4afd51c868863a2dbb90.reference || (__cxx_static_address_606c4afd51c868863a2dbb90.reference = {
    __cReference: true,
    get value() { return SHELL____header_global_651e84895e6f42dc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:669
export const SHOTGUNSHELL____header_global_7184f1c98b57a6a3 = ((((((2535) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bcf7378d0ecfafad4960f606() {
  return __cxx_static_address_bcf7378d0ecfafad4960f606.reference || (__cxx_static_address_bcf7378d0ecfafad4960f606.reference = {
    __cReference: true,
    get value() { return SHOTGUNSHELL____header_global_7184f1c98b57a6a3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:670
export const CHAINGUN____header_global_062de699ee732115 = ((((((2536) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8c23f5a5fa9c7b04816f1ba0() {
  return __cxx_static_address_8c23f5a5fa9c7b04816f1ba0.reference || (__cxx_static_address_8c23f5a5fa9c7b04816f1ba0.reference = {
    __cReference: true,
    get value() { return CHAINGUN____header_global_062de699ee732115; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:671
export const RPGGUN____header_global_4640d9537201c5b0 = ((((((2544) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7a02e267aa41ed8c9f551907() {
  return __cxx_static_address_7a02e267aa41ed8c9f551907.reference || (__cxx_static_address_7a02e267aa41ed8c9f551907.reference = {
    __cReference: true,
    get value() { return RPGGUN____header_global_4640d9537201c5b0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:672
export const FREEZE____header_global_31a3654100995856 = ((((((2548) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a66a52fc46a7c91fa14a0f0b() {
  return __cxx_static_address_a66a52fc46a7c91fa14a0f0b.reference || (__cxx_static_address_a66a52fc46a7c91fa14a0f0b.reference = {
    __cReference: true,
    get value() { return FREEZE____header_global_31a3654100995856; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:673
export const SHRINKER____header_global_6c91c8ca5f454136 = ((((((2556) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_70f734500ecd8ac70a341e64() {
  return __cxx_static_address_70f734500ecd8ac70a341e64.reference || (__cxx_static_address_70f734500ecd8ac70a341e64.reference = {
    __cReference: true,
    get value() { return SHRINKER____header_global_6c91c8ca5f454136; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:674
export const HANDHOLDINGLASER____header_global_4d5b18a79b3ea08d = ((((((2563) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_911b3837d20163afd918e2dd() {
  return __cxx_static_address_911b3837d20163afd918e2dd.reference || (__cxx_static_address_911b3837d20163afd918e2dd.reference = {
    __cReference: true,
    get value() { return HANDHOLDINGLASER____header_global_4d5b18a79b3ea08d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:675
export const TRIPBOMB____header_global_a63b55e547366f1c = ((((((2566) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b2844dcfd56dddfc92618041() {
  return __cxx_static_address_b2844dcfd56dddfc92618041.reference || (__cxx_static_address_b2844dcfd56dddfc92618041.reference = {
    __cReference: true,
    get value() { return TRIPBOMB____header_global_a63b55e547366f1c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:676
export const LASERLINE____header_global_8b6554545661762f = ((((((2567) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_981ad3f5b22b39ef56e4338a() {
  return __cxx_static_address_981ad3f5b22b39ef56e4338a.reference || (__cxx_static_address_981ad3f5b22b39ef56e4338a.reference = {
    __cReference: true,
    get value() { return LASERLINE____header_global_8b6554545661762f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:677
export const HANDHOLDINGACCESS____header_global_8691df05009ed4f8 = ((((((2568) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8134ab63094de70442128c12() {
  return __cxx_static_address_8134ab63094de70442128c12.reference || (__cxx_static_address_8134ab63094de70442128c12.reference = {
    __cReference: true,
    get value() { return HANDHOLDINGACCESS____header_global_8691df05009ed4f8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:678
export const HANDREMOTE____header_global_6f7436219ca594b8 = ((((((2570) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d3ca3f2c71b26c1beedb5c8e() {
  return __cxx_static_address_d3ca3f2c71b26c1beedb5c8e.reference || (__cxx_static_address_d3ca3f2c71b26c1beedb5c8e.reference = {
    __cReference: true,
    get value() { return HANDREMOTE____header_global_6f7436219ca594b8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:679
export const HANDTHROW____header_global_9dc29f342f8a168e = ((((((2573) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d93ec04c1d745e49512c2507() {
  return __cxx_static_address_d93ec04c1d745e49512c2507.reference || (__cxx_static_address_d93ec04c1d745e49512c2507.reference = {
    __cReference: true,
    get value() { return HANDTHROW____header_global_9dc29f342f8a168e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:680
export const TIP____header_global_e1484cb6c2e9f14b = ((((((2576) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_90057f2032edd2508e0cf41f() {
  return __cxx_static_address_90057f2032edd2508e0cf41f.reference || (__cxx_static_address_90057f2032edd2508e0cf41f.reference = {
    __cReference: true,
    get value() { return TIP____header_global_e1484cb6c2e9f14b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:681
export const SCUBAMASK____header_global_ac27f4b5787d9d5b = ((((((2581) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_75e104a9377a42012ec0ce8b() {
  return __cxx_static_address_75e104a9377a42012ec0ce8b.reference || (__cxx_static_address_75e104a9377a42012ec0ce8b.reference = {
    __cReference: true,
    get value() { return SCUBAMASK____header_global_ac27f4b5787d9d5b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:682
export const FORCESPHERE____header_global_166dee58b9036547 = ((((((2590) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bd5f5588ade562ba85f3b601() {
  return __cxx_static_address_bd5f5588ade562ba85f3b601.reference || (__cxx_static_address_bd5f5588ade562ba85f3b601.reference = {
    __cReference: true,
    get value() { return FORCESPHERE____header_global_166dee58b9036547; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:683
export const SHOTSPARK1____header_global_6ec3e2da53050da0 = ((((((2595) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_07072d76c8ae570e4dad6b93() {
  return __cxx_static_address_07072d76c8ae570e4dad6b93.reference || (__cxx_static_address_07072d76c8ae570e4dad6b93.reference = {
    __cReference: true,
    get value() { return SHOTSPARK1____header_global_6ec3e2da53050da0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:684
export const RPG____header_global_51d4597e6e2351fd = ((((((2605) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b5ba3f11605d1e85fce8a489() {
  return __cxx_static_address_b5ba3f11605d1e85fce8a489.reference || (__cxx_static_address_b5ba3f11605d1e85fce8a489.reference = {
    __cReference: true,
    get value() { return RPG____header_global_51d4597e6e2351fd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:685
export const LASERSITE____header_global_22a6b1ce9882d229 = ((((((2612) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eb5bdae1eb25e30a5ad15089() {
  return __cxx_static_address_eb5bdae1eb25e30a5ad15089.reference || (__cxx_static_address_eb5bdae1eb25e30a5ad15089.reference = {
    __cReference: true,
    get value() { return LASERSITE____header_global_22a6b1ce9882d229; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:686
export const SHOTGUN____header_global_91a0c3c47238962d = ((((((2613) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_63794c1757f1f03c7286c183() {
  return __cxx_static_address_63794c1757f1f03c7286c183.reference || (__cxx_static_address_63794c1757f1f03c7286c183.reference = {
    __cReference: true,
    get value() { return SHOTGUN____header_global_91a0c3c47238962d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:687
export const BOSS1____header_global_0e1125a99773b2bd = ((((((2630) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_af4607e8d8fd7e54e00d94fc() {
  return __cxx_static_address_af4607e8d8fd7e54e00d94fc.reference || (__cxx_static_address_af4607e8d8fd7e54e00d94fc.reference = {
    __cReference: true,
    get value() { return BOSS1____header_global_0e1125a99773b2bd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:688
export const BOSS1STAYPUT____header_global_5b2be1e4f8c6940f = ((((((2631) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_98270f66f90f579c2398dcaf() {
  return __cxx_static_address_98270f66f90f579c2398dcaf.reference || (__cxx_static_address_98270f66f90f579c2398dcaf.reference = {
    __cReference: true,
    get value() { return BOSS1STAYPUT____header_global_5b2be1e4f8c6940f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:689
export const BOSS1SHOOT____header_global_a55415229a8931db = ((((((2660) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fef17724e9a629608cf7d521() {
  return __cxx_static_address_fef17724e9a629608cf7d521.reference || (__cxx_static_address_fef17724e9a629608cf7d521.reference = {
    __cReference: true,
    get value() { return BOSS1SHOOT____header_global_a55415229a8931db; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:690
export const BOSS1LOB____header_global_e54829d699b24ece = ((((((2670) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e39ebf7fe3d8939891b8ec13() {
  return __cxx_static_address_e39ebf7fe3d8939891b8ec13.reference || (__cxx_static_address_e39ebf7fe3d8939891b8ec13.reference = {
    __cReference: true,
    get value() { return BOSS1LOB____header_global_e54829d699b24ece; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:691
export const BOSSTOP____header_global_10a14b54fd755a51 = ((((((2696) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_91e06e53b31ce3da97787860() {
  return __cxx_static_address_91e06e53b31ce3da97787860.reference || (__cxx_static_address_91e06e53b31ce3da97787860.reference = {
    __cReference: true,
    get value() { return BOSSTOP____header_global_10a14b54fd755a51; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:692
export const BOSS2____header_global_4f534aee227af086 = ((((((2710) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0821cd95b3caf06bfd8ad725() {
  return __cxx_static_address_0821cd95b3caf06bfd8ad725.reference || (__cxx_static_address_0821cd95b3caf06bfd8ad725.reference = {
    __cReference: true,
    get value() { return BOSS2____header_global_4f534aee227af086; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:693
export const BOSS3____header_global_ff3b12cc6de6d371 = ((((((2760) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c3bc6e685a259b1443de3f58() {
  return __cxx_static_address_c3bc6e685a259b1443de3f58.reference || (__cxx_static_address_c3bc6e685a259b1443de3f58.reference = {
    __cReference: true,
    get value() { return BOSS3____header_global_ff3b12cc6de6d371; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:694
export const SPINNINGNUKEICON____header_global_2ae468202c56f2fa = ((((((2813) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5b86f746897c6b15b29c0ba1() {
  return __cxx_static_address_5b86f746897c6b15b29c0ba1.reference || (__cxx_static_address_5b86f746897c6b15b29c0ba1.reference = {
    __cReference: true,
    get value() { return SPINNINGNUKEICON____header_global_2ae468202c56f2fa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:695
export const SMALLFNTCURSOR____header_global_017c2e843e0a775c = ((((((2821) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_965894e2bd8e39cbbde5192f() {
  return __cxx_static_address_965894e2bd8e39cbbde5192f.reference || (__cxx_static_address_965894e2bd8e39cbbde5192f.reference = {
    __cReference: true,
    get value() { return SMALLFNTCURSOR____header_global_017c2e843e0a775c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:696
export const STARTALPHANUM____header_global_ccbeff5f587aa1d7 = ((((((2822) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1db9b936b7949a0e9f3da92d() {
  return __cxx_static_address_1db9b936b7949a0e9f3da92d.reference || (__cxx_static_address_1db9b936b7949a0e9f3da92d.reference = {
    __cReference: true,
    get value() { return STARTALPHANUM____header_global_ccbeff5f587aa1d7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:697
export const ENDALPHANUM____header_global_1aefe8172fb8a8d6 = ((((((2915) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_168789cf1789bc3f127af721() {
  return __cxx_static_address_168789cf1789bc3f127af721.reference || (__cxx_static_address_168789cf1789bc3f127af721.reference = {
    __cReference: true,
    get value() { return ENDALPHANUM____header_global_1aefe8172fb8a8d6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:698
export const BIGALPHANUM____header_global_aa4fd5d8c258c9b9 = ((((((2940) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e6f335b875b4b7cc7e5b952e() {
  return __cxx_static_address_e6f335b875b4b7cc7e5b952e.reference || (__cxx_static_address_e6f335b875b4b7cc7e5b952e.reference = {
    __cReference: true,
    get value() { return BIGALPHANUM____header_global_aa4fd5d8c258c9b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:699
export const BIGPERIOD____header_global_840e57568676492a = ((((((3002) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c5a77c575800d425c3e93942() {
  return __cxx_static_address_c5a77c575800d425c3e93942.reference || (__cxx_static_address_c5a77c575800d425c3e93942.reference = {
    __cReference: true,
    get value() { return BIGPERIOD____header_global_840e57568676492a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:700
export const BIGCOMMA____header_global_91d64ce029aaefcc = ((((((3003) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_777137c8e6fb6b19a70af4b6() {
  return __cxx_static_address_777137c8e6fb6b19a70af4b6.reference || (__cxx_static_address_777137c8e6fb6b19a70af4b6.reference = {
    __cReference: true,
    get value() { return BIGCOMMA____header_global_91d64ce029aaefcc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:701
export const BIGX____header_global_6a40af436c1cc78f = ((((((3004) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7a721f6333a2922f1cc9c75e() {
  return __cxx_static_address_7a721f6333a2922f1cc9c75e.reference || (__cxx_static_address_7a721f6333a2922f1cc9c75e.reference = {
    __cReference: true,
    get value() { return BIGX____header_global_6a40af436c1cc78f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:702
export const BIGQ____header_global_a97ea69017dec137 = ((((((3005) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_63503ccd29131fee7e99d7f4() {
  return __cxx_static_address_63503ccd29131fee7e99d7f4.reference || (__cxx_static_address_63503ccd29131fee7e99d7f4.reference = {
    __cReference: true,
    get value() { return BIGQ____header_global_a97ea69017dec137; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:703
export const BIGSEMI____header_global_1e8c6574a6b364cc = ((((((3006) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5dbc1a8561531c49c846a876() {
  return __cxx_static_address_5dbc1a8561531c49c846a876.reference || (__cxx_static_address_5dbc1a8561531c49c846a876.reference = {
    __cReference: true,
    get value() { return BIGSEMI____header_global_1e8c6574a6b364cc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:704
export const BIGCOLIN____header_global_56baa13991552ce6 = ((((((3007) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ef88d121c2007790f015ba7e() {
  return __cxx_static_address_ef88d121c2007790f015ba7e.reference || (__cxx_static_address_ef88d121c2007790f015ba7e.reference = {
    __cReference: true,
    get value() { return BIGCOLIN____header_global_56baa13991552ce6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:705
export const THREEBYFIVE____header_global_8d775bec3bef3d24 = ((((((3010) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b9fcaac40534e509c29b6ca6() {
  return __cxx_static_address_b9fcaac40534e509c29b6ca6.reference || (__cxx_static_address_b9fcaac40534e509c29b6ca6.reference = {
    __cReference: true,
    get value() { return THREEBYFIVE____header_global_8d775bec3bef3d24; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:706
export const BIGAPPOS____header_global_aaf1040302e56d10 = ((((((3022) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0f25392ff233b2988089d4e3() {
  return __cxx_static_address_0f25392ff233b2988089d4e3.reference || (__cxx_static_address_0f25392ff233b2988089d4e3.reference = {
    __cReference: true,
    get value() { return BIGAPPOS____header_global_aaf1040302e56d10; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:707
export const MINIFONT____header_global_c089faa4c2d45b31 = ((((((3072) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_433cefd27af7c851f7b0bf07() {
  return __cxx_static_address_433cefd27af7c851f7b0bf07.reference || (__cxx_static_address_433cefd27af7c851f7b0bf07.reference = {
    __cReference: true,
    get value() { return MINIFONT____header_global_c089faa4c2d45b31; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:708
export const RESPAWNMARKERRED____header_global_bf2cd063497f6102 = ((((((3190) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_faa0d3e28b6db647bc0f984a() {
  return __cxx_static_address_faa0d3e28b6db647bc0f984a.reference || (__cxx_static_address_faa0d3e28b6db647bc0f984a.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERRED____header_global_bf2cd063497f6102; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:709
export const RESPAWNMARKERYELLOW____header_global_b9b463f2f05f98f2 = ((((((3200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fd57e2cad3d9dea2a622c526() {
  return __cxx_static_address_fd57e2cad3d9dea2a622c526.reference || (__cxx_static_address_fd57e2cad3d9dea2a622c526.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERYELLOW____header_global_b9b463f2f05f98f2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:710
export const RESPAWNMARKERGREEN____header_global_b80c32cbc1740096 = ((((((3210) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_36e0c07b4e505bd5822369e1() {
  return __cxx_static_address_36e0c07b4e505bd5822369e1.reference || (__cxx_static_address_36e0c07b4e505bd5822369e1.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERGREEN____header_global_b80c32cbc1740096; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:711
export const BONUSSCREEN____header_global_89775822ce5e6b85 = ((((((3240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1445c09665a79fbfbf2002b8() {
  return __cxx_static_address_1445c09665a79fbfbf2002b8.reference || (__cxx_static_address_1445c09665a79fbfbf2002b8.reference = {
    __cReference: true,
    get value() { return BONUSSCREEN____header_global_89775822ce5e6b85; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:712
export const VIEWBORDER____header_global_c85c930adc757e17 = ((((((3250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9c68de1dbc1ffcb30487de9e() {
  return __cxx_static_address_9c68de1dbc1ffcb30487de9e.reference || (__cxx_static_address_9c68de1dbc1ffcb30487de9e.reference = {
    __cReference: true,
    get value() { return VIEWBORDER____header_global_c85c930adc757e17; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:713
export const VICTORY1____header_global_4eb3f267035cbddd = ((((((3260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8d71761d46f6845bf4ff2af8() {
  return __cxx_static_address_8d71761d46f6845bf4ff2af8.reference || (__cxx_static_address_8d71761d46f6845bf4ff2af8.reference = {
    __cReference: true,
    get value() { return VICTORY1____header_global_4eb3f267035cbddd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:714
export const ORDERING____header_global_2a8aad1255f46758 = ((((((3270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5f4c987c2ede818ca73ad3c2() {
  return __cxx_static_address_5f4c987c2ede818ca73ad3c2.reference || (__cxx_static_address_5f4c987c2ede818ca73ad3c2.reference = {
    __cReference: true,
    get value() { return ORDERING____header_global_2a8aad1255f46758; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:715
export const TEXTSTORY____header_global_964b31d6b0dbff38 = ((((((3280) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4b4de2a6e5141deda9d0e3cc() {
  return __cxx_static_address_4b4de2a6e5141deda9d0e3cc.reference || (__cxx_static_address_4b4de2a6e5141deda9d0e3cc.reference = {
    __cReference: true,
    get value() { return TEXTSTORY____header_global_964b31d6b0dbff38; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:716
export const LOADSCREEN____header_global_75aac21af37d0592 = ((((((3281) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e58f34b88abcdb083d58aeb5() {
  return __cxx_static_address_e58f34b88abcdb083d58aeb5.reference || (__cxx_static_address_e58f34b88abcdb083d58aeb5.reference = {
    __cReference: true,
    get value() { return LOADSCREEN____header_global_75aac21af37d0592; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:717
export const BORNTOBEWILDSCREEN____header_global_3af798254893b58a = ((((((3370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_83ea428ea9bf0b13d54c0bae() {
  return __cxx_static_address_83ea428ea9bf0b13d54c0bae.reference || (__cxx_static_address_83ea428ea9bf0b13d54c0bae.reference = {
    __cReference: true,
    get value() { return BORNTOBEWILDSCREEN____header_global_3af798254893b58a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:718
export const BLIMP____header_global_9741e84e3b9f90ad = ((((((3400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2059eb68727312012b579def() {
  return __cxx_static_address_2059eb68727312012b579def.reference || (__cxx_static_address_2059eb68727312012b579def.reference = {
    __cReference: true,
    get value() { return BLIMP____header_global_9741e84e3b9f90ad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:719
export const FEM9____header_global_94441e63afcf7f52 = ((((((3450) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0a99cd76def56b42554f062f() {
  return __cxx_static_address_0a99cd76def56b42554f062f.reference || (__cxx_static_address_0a99cd76def56b42554f062f.reference = {
    __cReference: true,
    get value() { return FEM9____header_global_94441e63afcf7f52; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:720
export const FRAMEEFFECT1_13____header_global_18724ba9d5248c0b = ((((((3999) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c20d7eb3fec47622652f7a42() {
  return __cxx_static_address_c20d7eb3fec47622652f7a42.reference || (__cxx_static_address_c20d7eb3fec47622652f7a42.reference = {
    __cReference: true,
    get value() { return FRAMEEFFECT1_13____header_global_18724ba9d5248c0b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:721
export const FRAMEEFFECT1____header_global_b229e01b88ec14fb = ((((((4095) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2dc25029677eea5d4deaeabe() {
  return __cxx_static_address_2dc25029677eea5d4deaeabe.reference || (__cxx_static_address_2dc25029677eea5d4deaeabe.reference = {
    __cReference: true,
    get value() { return FRAMEEFFECT1____header_global_b229e01b88ec14fb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:722
export const PANNEL3____header_global_d0caa25c64287698 = ((((((4099) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_66e4102eb96968057846e26b() {
  return __cxx_static_address_66e4102eb96968057846e26b.reference || (__cxx_static_address_66e4102eb96968057846e26b.reference = {
    __cReference: true,
    get value() { return PANNEL3____header_global_d0caa25c64287698; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:723
export const SCREENBREAK14____header_global_59e81035d9aaa1cc = ((((((4120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0a5d62c0910cad2ba90c6d88() {
  return __cxx_static_address_0a5d62c0910cad2ba90c6d88.reference || (__cxx_static_address_0a5d62c0910cad2ba90c6d88.reference = {
    __cReference: true,
    get value() { return SCREENBREAK14____header_global_59e81035d9aaa1cc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:724
export const SCREENBREAK15____header_global_eff85e86ba63795c = ((((((4123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b57e50d6777bad3779bde284() {
  return __cxx_static_address_b57e50d6777bad3779bde284.reference || (__cxx_static_address_b57e50d6777bad3779bde284.reference = {
    __cReference: true,
    get value() { return SCREENBREAK15____header_global_eff85e86ba63795c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:725
export const SCREENBREAK19____header_global_3916b3c5d312d923 = ((((((4125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3bcdc2ed0f303a6606fa6a86() {
  return __cxx_static_address_3bcdc2ed0f303a6606fa6a86.reference || (__cxx_static_address_3bcdc2ed0f303a6606fa6a86.reference = {
    __cReference: true,
    get value() { return SCREENBREAK19____header_global_3916b3c5d312d923; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:726
export const SCREENBREAK16____header_global_06c141ff6ef07e9d = ((((((4127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_87b1d79849d3eb9aac42db8d() {
  return __cxx_static_address_87b1d79849d3eb9aac42db8d.reference || (__cxx_static_address_87b1d79849d3eb9aac42db8d.reference = {
    __cReference: true,
    get value() { return SCREENBREAK16____header_global_06c141ff6ef07e9d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:727
export const SCREENBREAK17____header_global_890645a5b2d4a400 = ((((((4128) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_21ffb40253a02499a2a9780a() {
  return __cxx_static_address_21ffb40253a02499a2a9780a.reference || (__cxx_static_address_21ffb40253a02499a2a9780a.reference = {
    __cReference: true,
    get value() { return SCREENBREAK17____header_global_890645a5b2d4a400; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:728
export const SCREENBREAK18____header_global_e32ac2a91b7a723d = ((((((4129) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9da5f996d6978044de4f0058() {
  return __cxx_static_address_9da5f996d6978044de4f0058.reference || (__cxx_static_address_9da5f996d6978044de4f0058.reference = {
    __cReference: true,
    get value() { return SCREENBREAK18____header_global_e32ac2a91b7a723d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:729
export const W_TECHWALL11____header_global_d3fcf7d3cfa555f4 = ((((((4130) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6bea5f7b4e4492a8a8b485b0() {
  return __cxx_static_address_6bea5f7b4e4492a8a8b485b0.reference || (__cxx_static_address_6bea5f7b4e4492a8a8b485b0.reference = {
    __cReference: true,
    get value() { return W_TECHWALL11____header_global_d3fcf7d3cfa555f4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:730
export const W_TECHWALL12____header_global_3215f0911d513642 = ((((((4131) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a5fbb69d097567ea61276276() {
  return __cxx_static_address_a5fbb69d097567ea61276276.reference || (__cxx_static_address_a5fbb69d097567ea61276276.reference = {
    __cReference: true,
    get value() { return W_TECHWALL12____header_global_3215f0911d513642; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:731
export const W_TECHWALL13____header_global_e8d4dcb98a9862ed = ((((((4132) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5290c8fd34284855487b5495() {
  return __cxx_static_address_5290c8fd34284855487b5495.reference || (__cxx_static_address_5290c8fd34284855487b5495.reference = {
    __cReference: true,
    get value() { return W_TECHWALL13____header_global_e8d4dcb98a9862ed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:732
export const W_TECHWALL14____header_global_d00f25d1162e98da = ((((((4133) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6eb370bf8275daee26f7b014() {
  return __cxx_static_address_6eb370bf8275daee26f7b014.reference || (__cxx_static_address_6eb370bf8275daee26f7b014.reference = {
    __cReference: true,
    get value() { return W_TECHWALL14____header_global_d00f25d1162e98da; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:733
export const W_TECHWALL5____header_global_71374afdec6710d9 = ((((((4134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4f674f79b9d1b1830779970d() {
  return __cxx_static_address_4f674f79b9d1b1830779970d.reference || (__cxx_static_address_4f674f79b9d1b1830779970d.reference = {
    __cReference: true,
    get value() { return W_TECHWALL5____header_global_71374afdec6710d9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:734
export const W_TECHWALL6____header_global_61dd6285073649f7 = ((((((4136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_19c93213e77a1eb4157fed42() {
  return __cxx_static_address_19c93213e77a1eb4157fed42.reference || (__cxx_static_address_19c93213e77a1eb4157fed42.reference = {
    __cReference: true,
    get value() { return W_TECHWALL6____header_global_61dd6285073649f7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:735
export const W_TECHWALL7____header_global_19f60c334c185377 = ((((((4138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6204fbc7cde7ceaeff9dcd49() {
  return __cxx_static_address_6204fbc7cde7ceaeff9dcd49.reference || (__cxx_static_address_6204fbc7cde7ceaeff9dcd49.reference = {
    __cReference: true,
    get value() { return W_TECHWALL7____header_global_19f60c334c185377; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:736
export const W_TECHWALL8____header_global_19141429a28b699e = ((((((4140) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c269cbfe9d4ff13cb56e5f9c() {
  return __cxx_static_address_c269cbfe9d4ff13cb56e5f9c.reference || (__cxx_static_address_c269cbfe9d4ff13cb56e5f9c.reference = {
    __cReference: true,
    get value() { return W_TECHWALL8____header_global_19141429a28b699e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:737
export const W_TECHWALL9____header_global_64120bd8eb0f4d06 = ((((((4142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c914ebbff21b69675a9b0497() {
  return __cxx_static_address_c914ebbff21b69675a9b0497.reference || (__cxx_static_address_c914ebbff21b69675a9b0497.reference = {
    __cReference: true,
    get value() { return W_TECHWALL9____header_global_64120bd8eb0f4d06; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:738
export const BPANNEL3____header_global_0f9fe588d64c8c6f = ((((((4100) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_77214d4ed324f9604bac33a8() {
  return __cxx_static_address_77214d4ed324f9604bac33a8.reference || (__cxx_static_address_77214d4ed324f9604bac33a8.reference = {
    __cReference: true,
    get value() { return BPANNEL3____header_global_0f9fe588d64c8c6f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:739
export const W_HITTECHWALL16____header_global_ff88e63493443248 = ((((((4144) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6c0cd4adec0eb162f54ccf58() {
  return __cxx_static_address_6c0cd4adec0eb162f54ccf58.reference || (__cxx_static_address_6c0cd4adec0eb162f54ccf58.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL16____header_global_ff88e63493443248; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:740
export const W_HITTECHWALL10____header_global_c2ac9befdc9640c0 = ((((((4145) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8fd9470b291df2765e8a4e1d() {
  return __cxx_static_address_8fd9470b291df2765e8a4e1d.reference || (__cxx_static_address_8fd9470b291df2765e8a4e1d.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL10____header_global_c2ac9befdc9640c0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:741
export const W_HITTECHWALL15____header_global_c2e11cd1eae55819 = ((((((4147) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_74f066cfe3d011edf93e113c() {
  return __cxx_static_address_74f066cfe3d011edf93e113c.reference || (__cxx_static_address_74f066cfe3d011edf93e113c.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL15____header_global_c2e11cd1eae55819; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:742
export const W_MILKSHELF____header_global_2933e0f013a14650 = ((((((4181) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_988d2a4fb32b13fe5aa4b5de() {
  return __cxx_static_address_988d2a4fb32b13fe5aa4b5de.reference || (__cxx_static_address_988d2a4fb32b13fe5aa4b5de.reference = {
    __cReference: true,
    get value() { return W_MILKSHELF____header_global_2933e0f013a14650; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:743
export const W_MILKSHELFBROKE____header_global_355c0e7889cbf896 = ((((((4203) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c0ab1c4a69da128780b364c3() {
  return __cxx_static_address_c0ab1c4a69da128780b364c3.reference || (__cxx_static_address_c0ab1c4a69da128780b364c3.reference = {
    __cReference: true,
    get value() { return W_MILKSHELFBROKE____header_global_355c0e7889cbf896; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:744
export const PURPLELAVA____header_global_5fd1986a2c5fb1fb = ((((((4240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a9c5fa4100849802339764bd() {
  return __cxx_static_address_a9c5fa4100849802339764bd.reference || (__cxx_static_address_a9c5fa4100849802339764bd.reference = {
    __cReference: true,
    get value() { return PURPLELAVA____header_global_5fd1986a2c5fb1fb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:745
export const TARGET____header_global_e0935fc3e07c00ff = ((((((4359) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3534c2e3f0148e0cb2c76c58() {
  return __cxx_static_address_3534c2e3f0148e0cb2c76c58.reference || (__cxx_static_address_3534c2e3f0148e0cb2c76c58.reference = {
    __cReference: true,
    get value() { return TARGET____header_global_e0935fc3e07c00ff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:746
export const DUCK____header_global_499fe0e701004566 = ((((((4361) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b116ecaf6a5800682a6e31fb() {
  return __cxx_static_address_b116ecaf6a5800682a6e31fb.reference || (__cxx_static_address_b116ecaf6a5800682a6e31fb.reference = {
    __cReference: true,
    get value() { return DUCK____header_global_499fe0e701004566; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:747
export const PUKE____header_global_775bc0eca5a36c90 = ((((((4389) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2614640a84e7cd4b82269b1c() {
  return __cxx_static_address_2614640a84e7cd4b82269b1c.reference || (__cxx_static_address_2614640a84e7cd4b82269b1c.reference = {
    __cReference: true,
    get value() { return PUKE____header_global_775bc0eca5a36c90; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:748
export const DOORTILE23____header_global_6188cfb4d91b734f = ((((((4391) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e0e04e45e303111491c6b2b9() {
  return __cxx_static_address_e0e04e45e303111491c6b2b9.reference || (__cxx_static_address_e0e04e45e303111491c6b2b9.reference = {
    __cReference: true,
    get value() { return DOORTILE23____header_global_6188cfb4d91b734f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:749
export const SPEAKER____header_global_8e6ae78b7be7171e = ((((((4397) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_772171282f9f7dccedb5a14b() {
  return __cxx_static_address_772171282f9f7dccedb5a14b.reference || (__cxx_static_address_772171282f9f7dccedb5a14b.reference = {
    __cReference: true,
    get value() { return SPEAKER____header_global_8e6ae78b7be7171e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:750
export const MAIL____header_global_cbbdb0b671a8014c = ((((((4410) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a28cf70353735c0c3607af7a() {
  return __cxx_static_address_a28cf70353735c0c3607af7a.reference || (__cxx_static_address_a28cf70353735c0c3607af7a.reference = {
    __cReference: true,
    get value() { return MAIL____header_global_cbbdb0b671a8014c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:751
export const HOTMEAT____header_global_71fd3b9252c867ab = ((((((4427) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ec4244fca71e413ca0c58656() {
  return __cxx_static_address_ec4244fca71e413ca0c58656.reference || (__cxx_static_address_ec4244fca71e413ca0c58656.reference = {
    __cReference: true,
    get value() { return HOTMEAT____header_global_71fd3b9252c867ab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:752
export const TRIPODCAMERA____header_global_74aa656aaca0b20b = ((((((4444) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a10b2fb8040902cfb9fe6fae() {
  return __cxx_static_address_a10b2fb8040902cfb9fe6fae.reference || (__cxx_static_address_a10b2fb8040902cfb9fe6fae.reference = {
    __cReference: true,
    get value() { return TRIPODCAMERA____header_global_74aa656aaca0b20b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:753
export const PAPER____header_global_3d54b607f2410ae0 = ((((((4460) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6b3b2987456ce8ec09badb79() {
  return __cxx_static_address_6b3b2987456ce8ec09badb79.reference || (__cxx_static_address_6b3b2987456ce8ec09badb79.reference = {
    __cReference: true,
    get value() { return PAPER____header_global_3d54b607f2410ae0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:754
export const GENERICPOLE2____header_global_2ec2e074243d45d9 = ((((((4465) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_814f1ff315b742eae344c69b() {
  return __cxx_static_address_814f1ff315b742eae344c69b.reference || (__cxx_static_address_814f1ff315b742eae344c69b.reference = {
    __cReference: true,
    get value() { return GENERICPOLE2____header_global_2ec2e074243d45d9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:755
export const XXXSTACY____header_global_4f96b07793bfdeea = ((((((4470) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_513ead7af5087fa721507079() {
  return __cxx_static_address_513ead7af5087fa721507079.reference || (__cxx_static_address_513ead7af5087fa721507079.reference = {
    __cReference: true,
    get value() { return XXXSTACY____header_global_4f96b07793bfdeea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:756
export const LETTER____header_global_cc0ff3269e33ccbe = ((((((4502) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e366b616bed76521a170312b() {
  return __cxx_static_address_e366b616bed76521a170312b.reference || (__cxx_static_address_e366b616bed76521a170312b.reference = {
    __cReference: true,
    get value() { return LETTER____header_global_cc0ff3269e33ccbe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:757
export const SIDEBOLT1____header_global_b56811a53cdeac73 = ((((((4525) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_20caf4c5ace220e9c978bd91() {
  return __cxx_static_address_20caf4c5ace220e9c978bd91.reference || (__cxx_static_address_20caf4c5ace220e9c978bd91.reference = {
    __cReference: true,
    get value() { return SIDEBOLT1____header_global_b56811a53cdeac73; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:758
export const FOODOBJECT16____header_global_e582ee10ae3cc474 = ((((((4545) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_84af42b6acdc65e25923bd27() {
  return __cxx_static_address_84af42b6acdc65e25923bd27.reference || (__cxx_static_address_84af42b6acdc65e25923bd27.reference = {
    __cReference: true,
    get value() { return FOODOBJECT16____header_global_e582ee10ae3cc474; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:759
export const TAMPON____header_global_536b71d55e89e05c = ((((((4557) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a805c18a57db3dd3505f297c() {
  return __cxx_static_address_a805c18a57db3dd3505f297c.reference || (__cxx_static_address_a805c18a57db3dd3505f297c.reference = {
    __cReference: true,
    get value() { return TAMPON____header_global_536b71d55e89e05c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:760
export const CANWITHSOMETHING2____header_global_b9630594f354ae0c = ((((((4580) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_019cfa97b0c3783b693c63a6() {
  return __cxx_static_address_019cfa97b0c3783b693c63a6.reference || (__cxx_static_address_019cfa97b0c3783b693c63a6.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING2____header_global_b9630594f354ae0c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:761
export const CANWITHSOMETHING3____header_global_f0de2a655c3703fe = ((((((4581) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_86a923ef11d5c033a0229136() {
  return __cxx_static_address_86a923ef11d5c033a0229136.reference || (__cxx_static_address_86a923ef11d5c033a0229136.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING3____header_global_f0de2a655c3703fe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:762
export const CANWITHSOMETHING4____header_global_1a080e4827a4e97f = ((((((4582) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b80b830b90b6f59411cdff0e() {
  return __cxx_static_address_b80b830b90b6f59411cdff0e.reference || (__cxx_static_address_b80b830b90b6f59411cdff0e.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING4____header_global_1a080e4827a4e97f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:763
export const DOLPHIN1____header_global_89c94ee5032f3770 = ((((((4591) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_38e57e1e40b1cf14a90a0399() {
  return __cxx_static_address_38e57e1e40b1cf14a90a0399.reference || (__cxx_static_address_38e57e1e40b1cf14a90a0399.reference = {
    __cReference: true,
    get value() { return DOLPHIN1____header_global_89c94ee5032f3770; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:764
export const DOLPHIN2____header_global_4f7d85f12bb7821f = ((((((4592) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a3ad3cbcdf1346bf44e01cc5() {
  return __cxx_static_address_a3ad3cbcdf1346bf44e01cc5.reference || (__cxx_static_address_a3ad3cbcdf1346bf44e01cc5.reference = {
    __cReference: true,
    get value() { return DOLPHIN2____header_global_4f7d85f12bb7821f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:765
export const NEWBEAST____header_global_863b2dd4d5e5854f = ((((((4610) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b698ae60a0652ed737ce8fea() {
  return __cxx_static_address_b698ae60a0652ed737ce8fea.reference || (__cxx_static_address_b698ae60a0652ed737ce8fea.reference = {
    __cReference: true,
    get value() { return NEWBEAST____header_global_863b2dd4d5e5854f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:766
export const NEWBEASTSTAYPUT____header_global_878057bc257c37a4 = ((((((4611) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2e2d9fa9b03d7f99e5374096() {
  return __cxx_static_address_2e2d9fa9b03d7f99e5374096.reference || (__cxx_static_address_2e2d9fa9b03d7f99e5374096.reference = {
    __cReference: true,
    get value() { return NEWBEASTSTAYPUT____header_global_878057bc257c37a4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:767
export const BOSS4____header_global_403b90fb7ba4aed4 = ((((((4740) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4021208075311de1a8956f3b() {
  return __cxx_static_address_4021208075311de1a8956f3b.reference || (__cxx_static_address_4021208075311de1a8956f3b.reference = {
    __cReference: true,
    get value() { return BOSS4____header_global_403b90fb7ba4aed4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:768
export const BOSS4STAYPUT____header_global_392ba39e45e45f90 = ((((((4741) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_840389337079e526524917ba() {
  return __cxx_static_address_840389337079e526524917ba.reference || (__cxx_static_address_840389337079e526524917ba.reference = {
    __cReference: true,
    get value() { return BOSS4STAYPUT____header_global_392ba39e45e45f90; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:769
export const FEM10____header_global_12bb3fc469bf3905 = ((((((4864) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_21cb18121913392378077e7b() {
  return __cxx_static_address_21cb18121913392378077e7b.reference || (__cxx_static_address_21cb18121913392378077e7b.reference = {
    __cReference: true,
    get value() { return FEM10____header_global_12bb3fc469bf3905; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:770
export const TOUGHGAL____header_global_67407d10d274c355 = ((((((4866) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bee8e680b4e1a11bfe0d4011() {
  return __cxx_static_address_bee8e680b4e1a11bfe0d4011.reference || (__cxx_static_address_bee8e680b4e1a11bfe0d4011.reference = {
    __cReference: true,
    get value() { return TOUGHGAL____header_global_67407d10d274c355; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:771
export const MAN____header_global_9b5490911adf7b4c = ((((((4871) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4489c89d39ee505424fb83d0() {
  return __cxx_static_address_4489c89d39ee505424fb83d0.reference || (__cxx_static_address_4489c89d39ee505424fb83d0.reference = {
    __cReference: true,
    get value() { return MAN____header_global_9b5490911adf7b4c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:772
export const MAN2____header_global_3a55d6cf257c3ecb = ((((((4872) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4157dc459d10076d62c4dea4() {
  return __cxx_static_address_4157dc459d10076d62c4dea4.reference || (__cxx_static_address_4157dc459d10076d62c4dea4.reference = {
    __cReference: true,
    get value() { return MAN2____header_global_3a55d6cf257c3ecb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:773
export const WOMAN____header_global_42d391c06fbffd4b = ((((((4874) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3b46842eb395f132498af91b() {
  return __cxx_static_address_3b46842eb395f132498af91b.reference || (__cxx_static_address_3b46842eb395f132498af91b.reference = {
    __cReference: true,
    get value() { return WOMAN____header_global_42d391c06fbffd4b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:774
export const NATURALLIGHTNING____header_global_8367ea09d41a655f = ((((((4890) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f3c4ea44809ede4ae3c22e67() {
  return __cxx_static_address_f3c4ea44809ede4ae3c22e67.reference || (__cxx_static_address_f3c4ea44809ede4ae3c22e67.reference = {
    __cReference: true,
    get value() { return NATURALLIGHTNING____header_global_8367ea09d41a655f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:775
export const WEATHERWARN____header_global_021503a8013171a9 = ((((((4893) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5ae0ed4b0c84ee0522f97234() {
  return __cxx_static_address_5ae0ed4b0c84ee0522f97234.reference || (__cxx_static_address_5ae0ed4b0c84ee0522f97234.reference = {
    __cReference: true,
    get value() { return WEATHERWARN____header_global_021503a8013171a9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:776
export const DUKETAG____header_global_5e64604a00d8ad8d = ((((((4900) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a03a89fe68868fba88a5afb0() {
  return __cxx_static_address_a03a89fe68868fba88a5afb0.reference || (__cxx_static_address_a03a89fe68868fba88a5afb0.reference = {
    __cReference: true,
    get value() { return DUKETAG____header_global_5e64604a00d8ad8d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:777
export const SIGN1____header_global_8515f05e874bc461 = ((((((4909) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0b14bacd9b498e7814e79aaa() {
  return __cxx_static_address_0b14bacd9b498e7814e79aaa.reference || (__cxx_static_address_0b14bacd9b498e7814e79aaa.reference = {
    __cReference: true,
    get value() { return SIGN1____header_global_8515f05e874bc461; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:778
export const SIGN2____header_global_77427c383c1824f1 = ((((((4912) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d81843d0ab7a53cde7544c71() {
  return __cxx_static_address_d81843d0ab7a53cde7544c71.reference || (__cxx_static_address_d81843d0ab7a53cde7544c71.reference = {
    __cReference: true,
    get value() { return SIGN2____header_global_77427c383c1824f1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:779
export const JURYGUY____header_global_9d5986270b8f60ad = ((((((4943) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_55976a35ebba160e15f44a67() {
  return __cxx_static_address_55976a35ebba160e15f44a67.reference || (__cxx_static_address_55976a35ebba160e15f44a67.reference = {
    __cReference: true,
    get value() { return JURYGUY____header_global_9d5986270b8f60ad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:780
export const WIDESCREENSTATUSBAR____header_global_1602490c6f5b615a = ((((((5120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cc3db15572653b703df66237() {
  return __cxx_static_address_cc3db15572653b703df66237.reference || (__cxx_static_address_cc3db15572653b703df66237.reference = {
    __cReference: true,
    get value() { return WIDESCREENSTATUSBAR____header_global_1602490c6f5b615a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:781
export const RPGGUNWIDE____header_global_e3062c30995d6358 = ((((((5121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_70c7a1ba33f2ac0b90fc1fbc() {
  return __cxx_static_address_70c7a1ba33f2ac0b90fc1fbc.reference || (__cxx_static_address_70c7a1ba33f2ac0b90fc1fbc.reference = {
    __cReference: true,
    get value() { return RPGGUNWIDE____header_global_e3062c30995d6358; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:782
export const FIRSTGUNRELOADWIDE____header_global_40d288e5fa3c7bb1 = ((((((5122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1091d27bcbe6a03299f8f121() {
  return __cxx_static_address_1091d27bcbe6a03299f8f121.reference || (__cxx_static_address_1091d27bcbe6a03299f8f121.reference = {
    __cReference: true,
    get value() { return FIRSTGUNRELOADWIDE____header_global_40d288e5fa3c7bb1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:783
export const FREEZEWIDE____header_global_4340f7ff75f69639 = ((((((5123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_00ab4930f99ed85428092eda() {
  return __cxx_static_address_00ab4930f99ed85428092eda.reference || (__cxx_static_address_00ab4930f99ed85428092eda.reference = {
    __cReference: true,
    get value() { return FREEZEWIDE____header_global_4340f7ff75f69639; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:784
export const FREEZEFIREWIDE____header_global_df41d14179b62903 = ((((((5124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fd881d5835bc706a88c6c120() {
  return __cxx_static_address_fd881d5835bc706a88c6c120.reference || (__cxx_static_address_fd881d5835bc706a88c6c120.reference = {
    __cReference: true,
    get value() { return FREEZEFIREWIDE____header_global_df41d14179b62903; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:785
export const SHRINKERWIDE____header_global_3f852ef0b2931b60 = ((((((5127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9b279610a63e763678a2305e() {
  return __cxx_static_address_9b279610a63e763678a2305e.reference || (__cxx_static_address_9b279610a63e763678a2305e.reference = {
    __cReference: true,
    get value() { return SHRINKERWIDE____header_global_3f852ef0b2931b60; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:786
export const CRACKKNUCKLESWIDE____header_global_dabd6f23bb20ef4b = ((((((5129) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_47bbc15ba206369453b57d70() {
  return __cxx_static_address_47bbc15ba206369453b57d70.reference || (__cxx_static_address_47bbc15ba206369453b57d70.reference = {
    __cReference: true,
    get value() { return CRACKKNUCKLESWIDE____header_global_dabd6f23bb20ef4b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:787
export const FLAMETHROWERSPRITE____header_global_cd1f061e16470bc2 = ((((((5134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_32aad2c0250fc216250da4f2() {
  return __cxx_static_address_32aad2c0250fc216250da4f2.reference || (__cxx_static_address_32aad2c0250fc216250da4f2.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERSPRITE____header_global_cd1f061e16470bc2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:788
export const FLAMETHROWERAMMO____header_global_97c086a97c7f958a = ((((((5135) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0b4661df0a04399b65d147f4() {
  return __cxx_static_address_0b4661df0a04399b65d147f4.reference || (__cxx_static_address_0b4661df0a04399b65d147f4.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERAMMO____header_global_97c086a97c7f958a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:789
export const FLAMETHROWER____header_global_f29e081e2b78bb4e = ((((((5138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7d2c5222ccff489f2509dd06() {
  return __cxx_static_address_7d2c5222ccff489f2509dd06.reference || (__cxx_static_address_7d2c5222ccff489f2509dd06.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER____header_global_f29e081e2b78bb4e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:790
export const FLAMETHROWERFIRE____header_global_5c2edb0cd07424aa = ((((((5139) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9303a6950f134e1309eb104c() {
  return __cxx_static_address_9303a6950f134e1309eb104c.reference || (__cxx_static_address_9303a6950f134e1309eb104c.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERFIRE____header_global_5c2edb0cd07424aa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:791
export const FLAMETHROWERFLAME____header_global_2356f1063019ce9e = ((((((1891) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4cfa00a0ac5325c002d811f4() {
  return __cxx_static_address_4cfa00a0ac5325c002d811f4.reference || (__cxx_static_address_4cfa00a0ac5325c002d811f4.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERFLAME____header_global_2356f1063019ce9e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:792
export const FLAMETHROWERPILOT____header_global_607282ee6d37a8f7 = ((((((5174) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7f015c322b38569b188fb3fa() {
  return __cxx_static_address_7f015c322b38569b188fb3fa.reference || (__cxx_static_address_7f015c322b38569b188fb3fa.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERPILOT____header_global_607282ee6d37a8f7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:793
export const FIREBALL____header_global_c953c4ba01557f40 = ((((((5163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_20734494be37cc7fb5a98827() {
  return __cxx_static_address_20734494be37cc7fb5a98827.reference || (__cxx_static_address_20734494be37cc7fb5a98827.reference = {
    __cReference: true,
    get value() { return FIREBALL____header_global_c953c4ba01557f40; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:794
export const ONFIRE____header_global_0393fb84d62afadf = ((((((5152) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8d93fc5fdc1c5571830b98bd() {
  return __cxx_static_address_8d93fc5fdc1c5571830b98bd.reference || (__cxx_static_address_8d93fc5fdc1c5571830b98bd.reference = {
    __cReference: true,
    get value() { return ONFIRE____header_global_0393fb84d62afadf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:795
export const ONFIRESMOKE____header_global_6e76be8d914b4840 = ((((((5143) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_932850dcc5b83bcf164969ff() {
  return __cxx_static_address_932850dcc5b83bcf164969ff.reference || (__cxx_static_address_932850dcc5b83bcf164969ff.reference = {
    __cReference: true,
    get value() { return ONFIRESMOKE____header_global_6e76be8d914b4840; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:796
export const BURNEDCORPSE____header_global_edc38636dbd4eda9 = ((((((5173) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e19608c48d9f7b3399d17184() {
  return __cxx_static_address_e19608c48d9f7b3399d17184.reference || (__cxx_static_address_e19608c48d9f7b3399d17184.reference = {
    __cReference: true,
    get value() { return BURNEDCORPSE____header_global_edc38636dbd4eda9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:797
export const WHISPYSMOKE____header_global_dd47bf671f12d74d = ((((((5268) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_30c6c9330aad09386dbf2c60() {
  return __cxx_static_address_30c6c9330aad09386dbf2c60.reference || (__cxx_static_address_30c6c9330aad09386dbf2c60.reference = {
    __cReference: true,
    get value() { return WHISPYSMOKE____header_global_dd47bf671f12d74d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:798
export const FIREFLY____header_global_d2a5bd0f13f55c21 = ((((((5180) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_88ad4dd590a9e0fb0e4c50d2() {
  return __cxx_static_address_88ad4dd590a9e0fb0e4c50d2.reference || (__cxx_static_address_88ad4dd590a9e0fb0e4c50d2.reference = {
    __cReference: true,
    get value() { return FIREFLY____header_global_d2a5bd0f13f55c21; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:799
export const FIREFLYSHRINKEFFECT____header_global_c69394f1d16a1adc = ((((((5360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ece75e86abf06180b5d90cab() {
  return __cxx_static_address_ece75e86abf06180b5d90cab.reference || (__cxx_static_address_ece75e86abf06180b5d90cab.reference = {
    __cReference: true,
    get value() { return FIREFLYSHRINKEFFECT____header_global_c69394f1d16a1adc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:800
export const FIREFLYGROWEFFECT____header_global_5c679494169eaa93 = ((((((5367) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ce59ed0352b3eecaefbdc7b0() {
  return __cxx_static_address_ce59ed0352b3eecaefbdc7b0.reference || (__cxx_static_address_ce59ed0352b3eecaefbdc7b0.reference = {
    __cReference: true,
    get value() { return FIREFLYGROWEFFECT____header_global_5c679494169eaa93; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:801
export const FIREFLYFLYINGEFFECT____header_global_35494f7f2c1423a9 = ((((((5296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_256fd324f0e0e384accf7515() {
  return __cxx_static_address_256fd324f0e0e384accf7515.reference || (__cxx_static_address_256fd324f0e0e384accf7515.reference = {
    __cReference: true,
    get value() { return FIREFLYFLYINGEFFECT____header_global_35494f7f2c1423a9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:802
export const BOSS5____header_global_8c3e2937f15417fc = ((((((5310) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_86cbd041c125220d5a3a9b72() {
  return __cxx_static_address_86cbd041c125220d5a3a9b72.reference || (__cxx_static_address_86cbd041c125220d5a3a9b72.reference = {
    __cReference: true,
    get value() { return BOSS5____header_global_8c3e2937f15417fc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:803
export const BOSS5STAYPUT____header_global_2eeffd3c54fec82f = ((((((5311) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bfcbd8b673966b1ea41c8ca1() {
  return __cxx_static_address_bfcbd8b673966b1ea41c8ca1.reference || (__cxx_static_address_bfcbd8b673966b1ea41c8ca1.reference = {
    __cReference: true,
    get value() { return BOSS5STAYPUT____header_global_2eeffd3c54fec82f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:804
export const LAVAPOOL____header_global_b16a5378a0730829 = ((((((5304) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_98402d7c281aab3c57d05dfe() {
  return __cxx_static_address_98402d7c281aab3c57d05dfe.reference || (__cxx_static_address_98402d7c281aab3c57d05dfe.reference = {
    __cReference: true,
    get value() { return LAVAPOOL____header_global_b16a5378a0730829; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:805
export const LAVASPLASH____header_global_6011181dd618ac08 = ((((((5371) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1b210f54a40f0a466becda17() {
  return __cxx_static_address_1b210f54a40f0a466becda17.reference || (__cxx_static_address_1b210f54a40f0a466becda17.reference = {
    __cReference: true,
    get value() { return LAVASPLASH____header_global_6011181dd618ac08; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:806
export const LAVAPOOLBUBBLE____header_global_c6ad42f1fcb9d135 = ((((((5207) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_053ae90097791874eb1aa9f4() {
  return __cxx_static_address_053ae90097791874eb1aa9f4.reference || (__cxx_static_address_053ae90097791874eb1aa9f4.reference = {
    __cReference: true,
    get value() { return LAVAPOOLBUBBLE____header_global_c6ad42f1fcb9d135; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:807
export const BOSS2STAYPUT____header_global_b5ce75b611c0157c = ((((((2711) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d64a99342238f5534215c09e() {
  return __cxx_static_address_d64a99342238f5534215c09e.reference || (__cxx_static_address_d64a99342238f5534215c09e.reference = {
    __cReference: true,
    get value() { return BOSS2STAYPUT____header_global_b5ce75b611c0157c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:808
export const BOSS3STAYPUT____header_global_e59aca731b2cace0 = ((((((2761) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bf75c23e62226ca1f3ab7b21() {
  return __cxx_static_address_bf75c23e62226ca1f3ab7b21.reference || (__cxx_static_address_bf75c23e62226ca1f3ab7b21.reference = {
    __cReference: true,
    get value() { return BOSS3STAYPUT____header_global_e59aca731b2cace0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:809
export const E32_TILE5736____header_global_bc6c19983dff80bd = ((((((5736) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7613e4bcd959d6079510e0e1() {
  return __cxx_static_address_7613e4bcd959d6079510e0e1.reference || (__cxx_static_address_7613e4bcd959d6079510e0e1.reference = {
    __cReference: true,
    get value() { return E32_TILE5736____header_global_bc6c19983dff80bd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:810
export const E32_TILE5737____header_global_c7c42618aeb11e9d = ((((((5737) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_055caa32d449312c5a609cd3() {
  return __cxx_static_address_055caa32d449312c5a609cd3.reference || (__cxx_static_address_055caa32d449312c5a609cd3.reference = {
    __cReference: true,
    get value() { return E32_TILE5737____header_global_c7c42618aeb11e9d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:811
export const E32_TILE5846____header_global_6c1d6939eae805fe = ((((((5846) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5a7354d30ab0e4fb64db4074() {
  return __cxx_static_address_5a7354d30ab0e4fb64db4074.reference || (__cxx_static_address_5a7354d30ab0e4fb64db4074.reference = {
    __cReference: true,
    get value() { return E32_TILE5846____header_global_6c1d6939eae805fe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/network.h:180
export const cSnapshotMemUsage__header_global_24ebe4cb50da5795 = u64((BigInt(u64(64)) * BigInt((BigInt((BigInt((BigInt(72) * BigInt(u64(16384)))) + BigInt((BigInt(96) * BigInt(u64(4096)))))) + BigInt((BigInt(296) * BigInt(u64(16384))))))));
function __cxx_static_address_2aaf7b62e7f33d037f8be2ec() {
  return __cxx_static_address_2aaf7b62e7f33d037f8be2ec.reference || (__cxx_static_address_2aaf7b62e7f33d037f8be2ec.reference = {
    __cReference: true,
    get value() { return cSnapshotMemUsage__header_global_24ebe4cb50da5795; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/vec.h:9
export function __cxx_record_vec2_2150e186aab2ebda() {
  return __cxx_record_vec2_2150e186aab2ebda.type || (__cxx_record_vec2_2150e186aab2ebda.type = class __cxx_record_vec2_2150e186aab2ebda__implementation {
  constructor() {
    return Object.setPrototypeOf(cZeroAggregate({"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}}, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), new.target.prototype);
  }
  __cxx_operator_afad51d27c05cd5d(rhs) {
    ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = i32((Number(__cxx_lvalue_0.value) + Number(rhs.x)))))(cObjectFieldRef(this, "x"));
    ((__cxx_lvalue_1) => (__cxx_lvalue_1.value = i32((Number(__cxx_lvalue_1.value) + Number(rhs.y)))))(cObjectFieldRef(this, "y"));
    return this;
  }
  __cxx_operator_db23490d79e044bc(rhs) {
    ((__cxx_lvalue_2) => (__cxx_lvalue_2.value = i32((Number(__cxx_lvalue_2.value) - Number(rhs.x)))))(cObjectFieldRef(this, "x"));
    ((__cxx_lvalue_3) => (__cxx_lvalue_3.value = i32((Number(__cxx_lvalue_3.value) - Number(rhs.y)))))(cObjectFieldRef(this, "y"));
    return this;
  }
  __cxx_operator_1dacbd87a6392785(rhs) {
    return cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": i32((this.x - rhs.x)), "y": i32((this.y - rhs.y))}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype});
  }
});
}

// C/C++ source: source/duke3d/src/actors.cpp:3420
export class SpriteTracerData {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.xVel = 0;
    this.yVel = 0;
    this.zVel = 0;

  }
}

// C/C++ source: source/duke3d/src/actors.cpp:41
export let g_radiusDmgStatnums = new Uint8Array(128);
function __cxx_static_address_8914a219ba61db83076bee19() {
  return __cxx_static_address_8914a219ba61db83076bee19.reference || (__cxx_static_address_8914a219ba61db83076bee19.reference = {
    __cReference: true,
    get value() { return g_radiusDmgStatnums; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/actors.cpp:45
export let otherp = 0;
export function __cxx_global_cell_a4c3fe8b92fc93fb63a5898c() {
  return __cxx_global_cell_a4c3fe8b92fc93fb63a5898c.reference || (__cxx_global_cell_a4c3fe8b92fc93fb63a5898c.reference = {
    __cReference: true,
    get value() { return otherp; },
    set value(__cxx_lvalue_0) { otherp = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_61b71755af9dcb40 = i32(2147483647);
function __cxx_static_address_1df001222a28ca5edeaca5a7() {
  return __cxx_static_address_1df001222a28ca5edeaca5a7.reference || (__cxx_static_address_1df001222a28ca5edeaca5a7.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_61b71755af9dcb40; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_109563c5e2c8c4bb = i32(2147483648);
function __cxx_static_address_3ef778aec0bf766e20dfd9ed() {
  return __cxx_static_address_3ef778aec0bf766e20dfd9ed.reference || (__cxx_static_address_3ef778aec0bf766e20dfd9ed.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_109563c5e2c8c4bb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_7a95e00b6b80053f = i32(2147483648);
function __cxx_static_address_e7817b7ca4e89161103fd5f7() {
  return __cxx_static_address_e7817b7ca4e89161103fd5f7.reference || (__cxx_static_address_e7817b7ca4e89161103fd5f7.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_7a95e00b6b80053f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_747e94b3fc826065 = i32(65536);
function __cxx_static_address_1445da6a0455a7ce4febb52e() {
  return __cxx_static_address_1445da6a0455a7ce4febb52e.reference || (__cxx_static_address_1445da6a0455a7ce4febb52e.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_747e94b3fc826065; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_8b0cd8e30e9610e1 = i32(32768);
function __cxx_static_address_e45d054fa58e2cd2c86c86ee() {
  return __cxx_static_address_e45d054fa58e2cd2c86c86ee.reference || (__cxx_static_address_e45d054fa58e2cd2c86c86ee.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_8b0cd8e30e9610e1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_e1678c1c4a1561a9 = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_17b6ddf73381a01c9e664489() {
  return __cxx_static_address_17b6ddf73381a01c9e664489.reference || (__cxx_static_address_17b6ddf73381a01c9e664489.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_e1678c1c4a1561a9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/vec.h:25
export function __cxx_record_vec3_82cfac1168cb3a1b() {
  return __cxx_record_vec3_82cfac1168cb3a1b.type || (__cxx_record_vec3_82cfac1168cb3a1b.type = class __cxx_record_vec3_82cfac1168cb3a1b__implementation {
  constructor() {
    return Object.setPrototypeOf(cZeroAggregate({"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "prototype": "__cxx_record_vec3_82cfac1168cb3a1b", "size": 12, "union": false}}, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype, "__cxx_record_vec3_82cfac1168cb3a1b": () => __cxx_record_vec3_82cfac1168cb3a1b().prototype}), new.target.prototype);
  }
  __cxx_operator_e606bd3865c9d3c9(rhs) {
    return cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "prototype": "__cxx_record_vec3_82cfac1168cb3a1b", "size": 12, "union": false}, {"__cxx_anonymous_0": cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, {"__cxx_anonymous_0": cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, {"x": i32((this.__cxx_anonymous_0.__cxx_anonymous_0.x + rhs.__cxx_anonymous_0.__cxx_anonymous_0.x)), "y": i32((this.__cxx_anonymous_0.__cxx_anonymous_0.y + rhs.__cxx_anonymous_0.__cxx_anonymous_0.y)), "z": i32((this.__cxx_anonymous_0.__cxx_anonymous_0.z + rhs.__cxx_anonymous_0.__cxx_anonymous_0.z))}, null, {})}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype})}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype, "__cxx_record_vec3_82cfac1168cb3a1b": () => __cxx_record_vec3_82cfac1168cb3a1b().prototype});
  }
  __cxx_operator_b7692188fdceca8e(rhs) {
    return cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "prototype": "__cxx_record_vec3_82cfac1168cb3a1b", "size": 12, "union": false}, {"__cxx_anonymous_0": cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, {"__cxx_anonymous_0": cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, {"x": i32((this.__cxx_anonymous_0.__cxx_anonymous_0.x - rhs.__cxx_anonymous_0.__cxx_anonymous_0.x)), "y": i32((this.__cxx_anonymous_0.__cxx_anonymous_0.y - rhs.__cxx_anonymous_0.__cxx_anonymous_0.y)), "z": i32((this.__cxx_anonymous_0.__cxx_anonymous_0.z - rhs.__cxx_anonymous_0.__cxx_anonymous_0.z))}, null, {})}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype})}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype, "__cxx_record_vec3_82cfac1168cb3a1b": () => __cxx_record_vec3_82cfac1168cb3a1b().prototype});
  }
  __cxx_operator_325ba4391061c66e(rhs) {
    this.__cxx_anonymous_0.xy.__cxx_operator_afad51d27c05cd5d(cCopyAggregate(rhs, {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}}));
    return this;
  }
});
}

// C/C++ source: source/duke3d/src/actors.cpp:783
export let block_deletesprite = i32(0);
export function __cxx_global_cell_14f28ae14cb6c4eab34e859f() {
  return __cxx_global_cell_14f28ae14cb6c4eab34e859f.reference || (__cxx_global_cell_14f28ae14cb6c4eab34e859f.reference = {
    __cReference: true,
    get value() { return block_deletesprite; },
    set value(__cxx_lvalue_0) { block_deletesprite = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/actors.cpp:982
export function G_AddGameLight(spriteNum, sectNum, offset, lightRange, lightRadius, lightHoriz, lightColor, lightPrio) {
  let unusedParameterWarningsOnConstReferencesSuck = cCopyAggregate(offset, {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "prototype": "__cxx_record_vec3_82cfac1168cb3a1b", "size": 12, "union": false}});
  cAssignAggregate(unusedParameterWarningsOnConstReferencesSuck, unusedParameterWarningsOnConstReferencesSuck, {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "prototype": "__cxx_record_vec3_82cfac1168cb3a1b", "size": 12, "union": false}});
  (lightRadius = i32(lightRadius));
  (spriteNum = i32(spriteNum));
  (sectNum = i32(sectNum));
  (lightRange = i32(lightRange));
  (lightHoriz = i32(lightHoriz));
  (lightColor = u32(lightColor));
  (lightPrio = i32(lightPrio));
}

// C/C++ source: source/duke3d/src/actors.cpp:1089
export function G_InterpolateLights(smoothratio) {
  (smoothratio = i32(smoothratio));
}

// C/C++ source: source/duke3d/src/actors.cpp:9269
export function G_RefreshLights() {

}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_9d81eb163dbac054 = new Uint8Array([((1) & 255), ((2) & 255), ((4) & 255), ((8) & 255), ((16) & 255), ((32) & 255), ((64) & 255), ((128) & 255)]);
function __cxx_static_address_bb561774fc11b8b24ddb06c3() {
  return __cxx_static_address_bb561774fc11b8b24ddb06c3.reference || (__cxx_static_address_bb561774fc11b8b24ddb06c3.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_9d81eb163dbac054; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:172
export const g_defaultVideoModes__header_global_08d11a1245df156a = cByteRecordNDArray({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, [25], {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}, [cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 2560, "y": 1440}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 2560, "y": 1200}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 2560, "y": 1080}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 1920, "y": 1440}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 1920, "y": 1200}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 1920, "y": 1080}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 1680, "y": 1050}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 1600, "y": 1200}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 1600, "y": 900}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 1366, "y": 768}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 1280, "y": 1024}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 1280, "y": 960}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 1280, "y": 720}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 1152, "y": 864}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 1024, "y": 768}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 1024, "y": 600}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 800, "y": 600}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 640, "y": 480}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 640, "y": 400}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 512, "y": 384}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 480, "y": 360}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 400, "y": 300}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 320, "y": 240}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 320, "y": 200}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 0, "y": 0}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype})]);
function __cxx_static_address_1c159927941234b6336231b4() {
  return __cxx_static_address_1c159927941234b6336231b4.reference || (__cxx_static_address_1c159927941234b6336231b4.reference = {
    __cReference: true,
    get value() { return g_defaultVideoModes__header_global_08d11a1245df156a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:188
export const g_keyAsciiTable__header_global_449d9b71841d1cbc = new Uint8Array([((0) & 255), ((0) & 255), 49, 50, 51, 52, 53, 54, 55, 56, 57, 48, 45, 61, ((0) & 255), ((0) & 255), 113, 119, 101, 114, 116, 121, 117, 105, 111, 112, 91, 93, ((0) & 255), ((0) & 255), 97, 115, 100, 102, 103, 104, 106, 107, 108, 59, ((39) & 255), 96, ((0) & 255), ((92) & 255), 122, 120, 99, 118, 98, 110, 109, 44, 46, 47, ((0) & 255), 42, ((0) & 255), ((32) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255)]);
function __cxx_static_address_95c10ff0cfdb994ead29dea5() {
  return __cxx_static_address_95c10ff0cfdb994ead29dea5.reference || (__cxx_static_address_95c10ff0cfdb994ead29dea5.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTable__header_global_449d9b71841d1cbc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:196
export const g_keyAsciiTableShift__header_global_61e83b0c9a3ba5fb = new Uint8Array([((0) & 255), ((0) & 255), 33, 64, 35, 36, 37, 94, 38, 42, 40, 41, 95, 43, ((0) & 255), ((0) & 255), 81, 87, 69, 82, 84, 89, 85, 73, 79, 80, 123, 125, ((0) & 255), ((0) & 255), 65, 83, 68, 70, 71, 72, 74, 75, 76, 58, 34, 126, ((0) & 255), 124, 90, 88, 67, 86, 66, 78, 77, 60, 62, 63, ((0) & 255), 42, ((0) & 255), ((32) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255)]);
function __cxx_static_address_01460dfe4774a7abcfb2b0ca() {
  return __cxx_static_address_01460dfe4774a7abcfb2b0ca.reference || (__cxx_static_address_01460dfe4774a7abcfb2b0ca.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTableShift__header_global_61e83b0c9a3ba5fb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:895
export const pow2long__header_global_ae3747aac7b16231 = new Int32Array([1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576, 2097152, 4194304, 8388608, 16777216, 33554432, 67108864, 134217728, 268435456, 536870912, 1073741824, 2147483647]);
function __cxx_static_address_7e7bbc8ecf23717464f5362a() {
  return __cxx_static_address_7e7bbc8ecf23717464f5362a.reference || (__cxx_static_address_7e7bbc8ecf23717464f5362a.reference = {
    __cReference: true,
    get value() { return pow2long__header_global_ae3747aac7b16231; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:907
export const pow2ulong__header_global_9efd1719d2542c49 = new Uint32Array([u32(1), u32(2), u32(4), u32(8), u32(16), u32(32), u32(64), u32(128), u32(256), u32(512), u32(1024), u32(2048), u32(4096), u32(8192), u32(16384), u32(32768), u32(65536), u32(131072), u32(262144), u32(524288), u32(1048576), u32(2097152), u32(4194304), u32(8388608), u32(16777216), u32(33554432), u32(67108864), u32(134217728), u32(268435456), u32(536870912), u32(1073741824), u32(2147483648n)]);
function __cxx_static_address_521b96c6d4574ca1456e08fe() {
  return __cxx_static_address_521b96c6d4574ca1456e08fe.reference || (__cxx_static_address_521b96c6d4574ca1456e08fe.reference = {
    __cReference: true,
    get value() { return pow2ulong__header_global_9efd1719d2542c49; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:919
export const pow264__header_global_082cb19e656cdf5f = new BigInt64Array([BigInt(i64(1)), BigInt(i64(2)), BigInt(i64(4)), BigInt(i64(8)), BigInt(i64(16)), BigInt(i64(32)), BigInt(i64(64)), BigInt(i64(128)), BigInt(i64(256)), BigInt(i64(512)), BigInt(i64(1024)), BigInt(i64(2048)), BigInt(i64(4096)), BigInt(i64(8192)), BigInt(i64(16384)), BigInt(i64(32768)), BigInt(i64(65536)), BigInt(i64(131072)), BigInt(i64(262144)), BigInt(i64(524288)), BigInt(i64(1048576)), BigInt(i64(2097152)), BigInt(i64(4194304)), BigInt(i64(8388608)), BigInt(i64(16777216)), BigInt(i64(33554432)), BigInt(i64(67108864)), BigInt(i64(134217728)), BigInt(i64(268435456)), BigInt(i64(536870912)), BigInt(i64(1073741824)), BigInt(2147483648n), BigInt(4294967296n), BigInt(8589934592n), BigInt(17179869184n), BigInt(34359738368n), BigInt(68719476736n), BigInt(137438953472n), BigInt(274877906944n), BigInt(549755813888n), BigInt(1099511627776n), BigInt(2199023255552n), BigInt(4398046511104n), BigInt(8796093022208n), BigInt(17592186044416n), BigInt(35184372088832n), BigInt(70368744177664n), BigInt(140737488355328n), BigInt(281474976710656n), BigInt(562949953421312n), BigInt(1125899906842624n), BigInt(2251799813685248n), BigInt(4503599627370496n), BigInt(9007199254740992n), BigInt(18014398509481984n), BigInt(36028797018963968n), BigInt(72057594037927936n), BigInt(144115188075855872n), BigInt(288230376151711744n), BigInt(576460752303423488n), BigInt(1152921504606846976n), BigInt(2305843009213693952n), BigInt(4611686018427387904n), BigInt(9223372036854775807n)]);
function __cxx_static_address_573170ca929395df6f868ce3() {
  return __cxx_static_address_573170ca929395df6f868ce3.reference || (__cxx_static_address_573170ca929395df6f868ce3.reference = {
    __cReference: true,
    get value() { return pow264__header_global_082cb19e656cdf5f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/mact/include/keyboard.h:47
export const sctokeylut__header_global_5a192e62733bb73f = cByteRecordNDArray({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, [102], {}, [cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([69, 115, 99, 97, 112, 101, 0]), "sc": ((1) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([49, 0]), "sc": ((2) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([50, 0]), "sc": ((3) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([51, 0]), "sc": ((4) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([52, 0]), "sc": ((5) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([53, 0]), "sc": ((6) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([54, 0]), "sc": ((7) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([55, 0]), "sc": ((8) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([56, 0]), "sc": ((9) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([57, 0]), "sc": ((10) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([48, 0]), "sc": ((11) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([45, 0]), "sc": ((12) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([61, 0]), "sc": ((13) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([66, 97, 107, 83, 112, 99, 0]), "sc": ((14) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([84, 97, 98, 0]), "sc": ((15) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([81, 0]), "sc": ((16) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([87, 0]), "sc": ((17) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([69, 0]), "sc": ((18) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([82, 0]), "sc": ((19) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([84, 0]), "sc": ((20) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([89, 0]), "sc": ((21) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([85, 0]), "sc": ((22) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([73, 0]), "sc": ((23) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([79, 0]), "sc": ((24) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([80, 0]), "sc": ((25) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([91, 0]), "sc": ((26) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([93, 0]), "sc": ((27) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([69, 110, 116, 101, 114, 0]), "sc": ((28) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([76, 67, 116, 114, 108, 0]), "sc": ((29) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([65, 0]), "sc": ((30) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([83, 0]), "sc": ((31) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([68, 0]), "sc": ((32) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 0]), "sc": ((33) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([71, 0]), "sc": ((34) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([72, 0]), "sc": ((35) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([74, 0]), "sc": ((36) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 0]), "sc": ((37) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([76, 0]), "sc": ((38) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([59, 0]), "sc": ((39) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([39, 0]), "sc": ((40) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([96, 0]), "sc": ((41) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([76, 83, 104, 105, 102, 116, 0]), "sc": ((42) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([66, 97, 99, 107, 115, 108, 97, 115, 104, 0]), "sc": ((43) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([90, 0]), "sc": ((44) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([88, 0]), "sc": ((45) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([67, 0]), "sc": ((46) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([86, 0]), "sc": ((47) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([66, 0]), "sc": ((48) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([78, 0]), "sc": ((49) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([77, 0]), "sc": ((50) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([44, 0]), "sc": ((51) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([46, 0]), "sc": ((52) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([47, 0]), "sc": ((53) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([82, 83, 104, 105, 102, 116, 0]), "sc": ((54) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 42, 0]), "sc": ((55) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([76, 65, 108, 116, 0]), "sc": ((56) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([83, 112, 97, 99, 101, 0]), "sc": ((57) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([67, 97, 112, 76, 99, 107, 0]), "sc": ((58) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 49, 0]), "sc": ((59) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 50, 0]), "sc": ((60) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 51, 0]), "sc": ((61) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 52, 0]), "sc": ((62) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 53, 0]), "sc": ((63) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 54, 0]), "sc": ((64) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 55, 0]), "sc": ((65) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 56, 0]), "sc": ((66) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 57, 0]), "sc": ((67) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 49, 48, 0]), "sc": ((68) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([78, 117, 109, 76, 99, 107, 0]), "sc": ((69) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([83, 99, 114, 76, 99, 107, 0]), "sc": ((70) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 55, 0]), "sc": ((71) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 56, 0]), "sc": ((72) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 57, 0]), "sc": ((73) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 45, 0]), "sc": ((74) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 52, 0]), "sc": ((75) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 53, 0]), "sc": ((76) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 54, 0]), "sc": ((77) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 43, 0]), "sc": ((78) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 49, 0]), "sc": ((79) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 50, 0]), "sc": ((80) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 51, 0]), "sc": ((81) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 48, 0]), "sc": ((82) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 46, 0]), "sc": ((83) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([76, 101, 115, 115, 84, 104, 97, 110, 0]), "sc": ((86) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 49, 49, 0]), "sc": ((87) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 49, 50, 0]), "sc": ((88) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 100, 69, 110, 116, 0]), "sc": ((156) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([82, 67, 116, 114, 108, 0]), "sc": ((157) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 47, 0]), "sc": ((181) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([82, 65, 108, 116, 0]), "sc": ((184) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([80, 114, 116, 83, 99, 110, 0]), "sc": ((183) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([80, 97, 117, 115, 101, 0]), "sc": ((197) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([72, 111, 109, 101, 0]), "sc": ((199) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([85, 112, 0]), "sc": ((200) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([80, 103, 85, 112, 0]), "sc": ((201) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([76, 101, 102, 116, 0]), "sc": ((203) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([82, 105, 103, 104, 116, 0]), "sc": ((205) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([69, 110, 100, 0]), "sc": ((207) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([68, 111, 119, 110, 0]), "sc": ((208) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([80, 103, 68, 110, 0]), "sc": ((209) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([73, 110, 115, 101, 114, 116, 0]), "sc": ((210) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([68, 101, 108, 101, 116, 101, 0]), "sc": ((211) & 255)}, null, {})]);
function __cxx_static_address_9dc6a3a3e04145daa954515e() {
  return __cxx_static_address_9dc6a3a3e04145daa954515e.reference || (__cxx_static_address_9dc6a3a3e04145daa954515e.reference = {
    __cReference: true,
    get value() { return sctokeylut__header_global_5a192e62733bb73f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/actors.cpp:422
export function P_GetP__header_010f5d5cb420(pSprite) {
  let playerNum = i32(cRecordObject(cRecordPointer(pSprite, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "prototype": "__cxx_record_vec3_82cfac1168cb3a1b", "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype, "__cxx_record_vec3_82cfac1168cb3a1b": () => __cxx_record_vec3_82cfac1168cb3a1b().prototype})).__cxx_anonymous_15.__cxx_anonymous_0.yvel);
  if ((u32(playerNum) >= u32(16))) {
    (playerNum = i32(0));
  }
  return i32(playerNum);
}

export function bitmap_test__header_d8d52c1c1bab(ptr, n) {

  return Boolean((i32((i32((cDeref(cPointerOffset(ptr, i32((n >> 3)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & i32((cDeref(cPointerOffset(pow2char__header_global_9d81eb163dbac054, i32((n & 7)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))) == i32((cDeref(cPointerOffset(pow2char__header_global_9d81eb163dbac054, i32((n & 7)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))));
}

export function bitmap_set__header_27edc48e62ee(ptr, n) {

  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = (((__cxx_lvalue_0.value | i32((cDeref(cPointerOffset(pow2char__header_global_9d81eb163dbac054, i32((n & 7)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))) & 255)))(cDeref(cPointerOffset(ptr, i32((n >> 3)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array));
}

// C/C++ source: source/duke3d/src/actors.cpp:207
export function yax_waltosecmask__header_7e470ba79093(walclipmask) {
  return i32((i32((i32((walclipmask & 1)) << 9)) | i32((i32((walclipmask & 64)) << 5))));
}

export function clamp__header_121770548bd0(__cxx_in, min, max) {
  return i32(((__cxx_in <= i32(min)) ? i32(min) : ((__cxx_in >= i32(max)) ? i32(max) : __cxx_in)));
}

// C/C++ source: source/duke3d/src/actors.cpp:42
export function fix16_to_int__header_d7bc046c364e(a) {
  return i32(Math.trunc(i32((a + ((a >= 0) ? fix16_half__header_global_8b0cd8e30e9610e1 : (-fix16_half__header_global_8b0cd8e30e9610e1)))) / fix16_one__header_global_747e94b3fc826065));
}

// C/C++ source: source/duke3d/src/actors.cpp:46
export function fix16_from_int__header_5600c39c7065(a) {
  return i32(Math.imul(a, fix16_one__header_global_747e94b3fc826065));
}

// C/C++ source: source/duke3d/src/actors.cpp:1396
export function logapproach__header_2901b34856bd(val, targetval) {
  let dif = i32((targetval - val));
  return i32((Boolean(i32((dif >> 1))) ? i32((val + i32((dif >> 1)))) : targetval));
}

// C/C++ source: source/duke3d/src/actors.cpp:328
export function ksgn__header_14535f59ba5f(a) {
  return i32((i32((a > 0)) - i32((a < 0))));
}

export function ARRAY_SIZE__header_e32516606678(arg0) {
  return u64(8n);
}

// C/C++ source: source/duke3d/src/actors.cpp:382
export function P_PalFrom__header_0e1a5680949a(pPlayer, f, r, g, b) {
  (cRecordObject(pPlayer).pals.f = ((((f) & 255)) & 255));
  (cRecordObject(pPlayer).pals.r = ((((r) & 255)) & 255));
  (cRecordObject(pPlayer).pals.g = ((((g) & 255)) & 255));
  (cRecordObject(pPlayer).pals.b = ((((b) & 255)) & 255));
}

export function clamp2__header_36725f77f7c9(__cxx_in, min, max) {
  return i32(((__cxx_in >= i32(max)) ? i32(max) : ((__cxx_in <= i32(min)) ? i32(min) : __cxx_in)));
}
