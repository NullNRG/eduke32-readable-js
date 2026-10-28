// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/duke3d/src/player.cpp
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
export const fix16_rad_to_deg_mult__header_global_52e3b986e49bddf7 = i32(3754936);
function __cxx_static_address_985fd156228922e275a3b848() {
  return __cxx_static_address_985fd156228922e275a3b848.reference || (__cxx_static_address_985fd156228922e275a3b848.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_52e3b986e49bddf7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_496dfdcb35bfeb40 = i32(1144);
function __cxx_static_address_dc04082261a18c9379f66a59() {
  return __cxx_static_address_dc04082261a18c9379f66a59.reference || (__cxx_static_address_dc04082261a18c9379f66a59.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_496dfdcb35bfeb40; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:43
export const KICK_HIT____header_global_965bfb8c001e05e6 = ((((((0) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ca4c6910c3a7a7722df925d2() {
  return __cxx_static_address_ca4c6910c3a7a7722df925d2.reference || (__cxx_static_address_ca4c6910c3a7a7722df925d2.reference = {
    __cReference: true,
    get value() { return KICK_HIT____header_global_965bfb8c001e05e6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:44
export const PISTOL_RICOCHET____header_global_c35016d6110b4d33 = ((((((1) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_36188fe144cb7db8b3157310() {
  return __cxx_static_address_36188fe144cb7db8b3157310.reference || (__cxx_static_address_36188fe144cb7db8b3157310.reference = {
    __cReference: true,
    get value() { return PISTOL_RICOCHET____header_global_c35016d6110b4d33; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:45
export const PISTOL_BODYHIT____header_global_d7a6a0ae757026a1 = ((((((2) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f31c881f77397468914a357e() {
  return __cxx_static_address_f31c881f77397468914a357e.reference || (__cxx_static_address_f31c881f77397468914a357e.reference = {
    __cReference: true,
    get value() { return PISTOL_BODYHIT____header_global_d7a6a0ae757026a1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:46
export const PISTOL_FIRE____header_global_9ee53d582d665ad6 = ((((((3) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f3e8edf278075bff87f13901() {
  return __cxx_static_address_f3e8edf278075bff87f13901.reference || (__cxx_static_address_f3e8edf278075bff87f13901.reference = {
    __cReference: true,
    get value() { return PISTOL_FIRE____header_global_9ee53d582d665ad6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:47
export const EJECT_CLIP____header_global_530f70afb3d11c64 = ((((((4) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a76f8e65e6e8e37167d91a82() {
  return __cxx_static_address_a76f8e65e6e8e37167d91a82.reference || (__cxx_static_address_a76f8e65e6e8e37167d91a82.reference = {
    __cReference: true,
    get value() { return EJECT_CLIP____header_global_530f70afb3d11c64; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:48
export const INSERT_CLIP____header_global_a943f05fc1ae6ef4 = ((((((5) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_db4b6fda4faed85626f3dfe6() {
  return __cxx_static_address_db4b6fda4faed85626f3dfe6.reference || (__cxx_static_address_db4b6fda4faed85626f3dfe6.reference = {
    __cReference: true,
    get value() { return INSERT_CLIP____header_global_a943f05fc1ae6ef4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:49
export const CHAINGUN_FIRE____header_global_15f96bb6f9dbcd16 = ((((((6) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6eed07a681c4f5a2e8773f49() {
  return __cxx_static_address_6eed07a681c4f5a2e8773f49.reference || (__cxx_static_address_6eed07a681c4f5a2e8773f49.reference = {
    __cReference: true,
    get value() { return CHAINGUN_FIRE____header_global_15f96bb6f9dbcd16; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:50
export const RPG_SHOOT____header_global_15936b88b9c0fdc9 = ((((((7) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_efffcb6ca172cdc6a3bf8d52() {
  return __cxx_static_address_efffcb6ca172cdc6a3bf8d52.reference || (__cxx_static_address_efffcb6ca172cdc6a3bf8d52.reference = {
    __cReference: true,
    get value() { return RPG_SHOOT____header_global_15936b88b9c0fdc9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:51
export const POOLBALLHIT____header_global_2e2bfefe3c65674c = ((((((8) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ad90f5e401ef16245886e0d6() {
  return __cxx_static_address_ad90f5e401ef16245886e0d6.reference || (__cxx_static_address_ad90f5e401ef16245886e0d6.reference = {
    __cReference: true,
    get value() { return POOLBALLHIT____header_global_2e2bfefe3c65674c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:52
export const RPG_EXPLODE____header_global_3e3139d65251dc45 = ((((((9) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c4e5d02f44e082f455eec64b() {
  return __cxx_static_address_c4e5d02f44e082f455eec64b.reference || (__cxx_static_address_c4e5d02f44e082f455eec64b.reference = {
    __cReference: true,
    get value() { return RPG_EXPLODE____header_global_3e3139d65251dc45; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:53
export const CAT_FIRE____header_global_a61ee1553cc337d0 = ((((((10) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1b3c651db8441bc334dbc091() {
  return __cxx_static_address_1b3c651db8441bc334dbc091.reference || (__cxx_static_address_1b3c651db8441bc334dbc091.reference = {
    __cReference: true,
    get value() { return CAT_FIRE____header_global_a61ee1553cc337d0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:54
export const SHRINKER_FIRE____header_global_8b9d0fca2d64c367 = ((((((11) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b3fb91a284b2cc3263c004c7() {
  return __cxx_static_address_b3fb91a284b2cc3263c004c7.reference || (__cxx_static_address_b3fb91a284b2cc3263c004c7.reference = {
    __cReference: true,
    get value() { return SHRINKER_FIRE____header_global_8b9d0fca2d64c367; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:55
export const PIPEBOMB_BOUNCE____header_global_9867958abae6c287 = ((((((13) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aaa2308f6c37ab42492444e2() {
  return __cxx_static_address_aaa2308f6c37ab42492444e2.reference || (__cxx_static_address_aaa2308f6c37ab42492444e2.reference = {
    __cReference: true,
    get value() { return PIPEBOMB_BOUNCE____header_global_9867958abae6c287; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:56
export const PIPEBOMB_EXPLODE____header_global_737d6286d118c146 = ((((((14) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_86a01ce03231a007c670b453() {
  return __cxx_static_address_86a01ce03231a007c670b453.reference || (__cxx_static_address_86a01ce03231a007c670b453.reference = {
    __cReference: true,
    get value() { return PIPEBOMB_EXPLODE____header_global_737d6286d118c146; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:57
export const LASERTRIP_ONWALL____header_global_8a60cfe29d7f46a6 = ((((((15) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_53db73c4df7d6b8d8641c80f() {
  return __cxx_static_address_53db73c4df7d6b8d8641c80f.reference || (__cxx_static_address_53db73c4df7d6b8d8641c80f.reference = {
    __cReference: true,
    get value() { return LASERTRIP_ONWALL____header_global_8a60cfe29d7f46a6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:58
export const LASERTRIP_ARMING____header_global_2d99699b08da06a0 = ((((((16) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fada4d8832eacef4fd0e4e7f() {
  return __cxx_static_address_fada4d8832eacef4fd0e4e7f.reference || (__cxx_static_address_fada4d8832eacef4fd0e4e7f.reference = {
    __cReference: true,
    get value() { return LASERTRIP_ARMING____header_global_2d99699b08da06a0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:59
export const LASERTRIP_EXPLODE____header_global_a6157f47772c1b76 = ((((((17) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_678cae823e9588960f46837d() {
  return __cxx_static_address_678cae823e9588960f46837d.reference || (__cxx_static_address_678cae823e9588960f46837d.reference = {
    __cReference: true,
    get value() { return LASERTRIP_EXPLODE____header_global_a6157f47772c1b76; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:60
export const VENT_BUST____header_global_145a057cb7eab9fa = ((((((18) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_96532ecb2ca0f44e7eda0e07() {
  return __cxx_static_address_96532ecb2ca0f44e7eda0e07.reference || (__cxx_static_address_96532ecb2ca0f44e7eda0e07.reference = {
    __cReference: true,
    get value() { return VENT_BUST____header_global_145a057cb7eab9fa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:61
export const GLASS_BREAKING____header_global_fe962bac29e6a4a4 = ((((((19) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7c5acaef9c67246f2f04c53a() {
  return __cxx_static_address_7c5acaef9c67246f2f04c53a.reference || (__cxx_static_address_7c5acaef9c67246f2f04c53a.reference = {
    __cReference: true,
    get value() { return GLASS_BREAKING____header_global_fe962bac29e6a4a4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:62
export const GLASS_HEAVYBREAK____header_global_6428313d86251dab = ((((((20) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8a5e25b3f1941f0898cbdb58() {
  return __cxx_static_address_8a5e25b3f1941f0898cbdb58.reference || (__cxx_static_address_8a5e25b3f1941f0898cbdb58.reference = {
    __cReference: true,
    get value() { return GLASS_HEAVYBREAK____header_global_6428313d86251dab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:63
export const SHORT_CIRCUIT____header_global_19b6d71685511af9 = ((((((21) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_913603700e8b4d41e035cce2() {
  return __cxx_static_address_913603700e8b4d41e035cce2.reference || (__cxx_static_address_913603700e8b4d41e035cce2.reference = {
    __cReference: true,
    get value() { return SHORT_CIRCUIT____header_global_19b6d71685511af9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:64
export const ITEM_SPLASH____header_global_626883707f88a5ab = ((((((22) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8c98cec80119de4a4b7e0a5a() {
  return __cxx_static_address_8c98cec80119de4a4b7e0a5a.reference || (__cxx_static_address_8c98cec80119de4a4b7e0a5a.reference = {
    __cReference: true,
    get value() { return ITEM_SPLASH____header_global_626883707f88a5ab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:65
export const DUKE_GASP____header_global_7f49d50b8d87bb01 = ((((((25) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_638a8f9940623d8729f5ff80() {
  return __cxx_static_address_638a8f9940623d8729f5ff80.reference || (__cxx_static_address_638a8f9940623d8729f5ff80.reference = {
    __cReference: true,
    get value() { return DUKE_GASP____header_global_7f49d50b8d87bb01; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:66
export const SLIM_RECOG____header_global_9bb1adde434ea3ed = ((((((26) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1625ecda7e4df1cbd6a509b0() {
  return __cxx_static_address_1625ecda7e4df1cbd6a509b0.reference || (__cxx_static_address_1625ecda7e4df1cbd6a509b0.reference = {
    __cReference: true,
    get value() { return SLIM_RECOG____header_global_9bb1adde434ea3ed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:67
export const DUKE_URINATE____header_global_ad1c2c35d41c1049 = ((((((28) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0cb846cd7211f512ce1376de() {
  return __cxx_static_address_0cb846cd7211f512ce1376de.reference || (__cxx_static_address_0cb846cd7211f512ce1376de.reference = {
    __cReference: true,
    get value() { return DUKE_URINATE____header_global_ad1c2c35d41c1049; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:68
export const ENDSEQVOL3SND2____header_global_1dfdfe1fdd3aab62 = ((((((29) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c28628c31e6b763dfad8f5f9() {
  return __cxx_static_address_c28628c31e6b763dfad8f5f9.reference || (__cxx_static_address_c28628c31e6b763dfad8f5f9.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND2____header_global_1dfdfe1fdd3aab62; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:69
export const ENDSEQVOL3SND3____header_global_8c26d70b8c9dc050 = ((((((30) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5567da52888175e99d678529() {
  return __cxx_static_address_5567da52888175e99d678529.reference || (__cxx_static_address_5567da52888175e99d678529.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND3____header_global_8c26d70b8c9dc050; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:70
export const DUKE_CRACK____header_global_d23206938dae9b70 = ((((((33) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7b55a6fe837efceabc92fd5c() {
  return __cxx_static_address_7b55a6fe837efceabc92fd5c.reference || (__cxx_static_address_7b55a6fe837efceabc92fd5c.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK____header_global_d23206938dae9b70; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:71
export const SLIM_ATTACK____header_global_42e0f26d845b8a70 = ((((((34) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9fd8fae1ad5d983a2a98494e() {
  return __cxx_static_address_9fd8fae1ad5d983a2a98494e.reference || (__cxx_static_address_9fd8fae1ad5d983a2a98494e.reference = {
    __cReference: true,
    get value() { return SLIM_ATTACK____header_global_42e0f26d845b8a70; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:72
export const SOMETHINGHITFORCE____header_global_f1ff609687ba3907 = ((((((35) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9bb3c5497f0dad87c47a90fb() {
  return __cxx_static_address_9bb3c5497f0dad87c47a90fb.reference || (__cxx_static_address_9bb3c5497f0dad87c47a90fb.reference = {
    __cReference: true,
    get value() { return SOMETHINGHITFORCE____header_global_f1ff609687ba3907; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:73
export const DUKE_DRINKING____header_global_e522950dae2c111f = ((((((36) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6cafd704a0b7c248b4816997() {
  return __cxx_static_address_6cafd704a0b7c248b4816997.reference || (__cxx_static_address_6cafd704a0b7c248b4816997.reference = {
    __cReference: true,
    get value() { return DUKE_DRINKING____header_global_e522950dae2c111f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:74
export const DUKE_GRUNT____header_global_aa5821f190eb8ae0 = ((((((38) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c6c424aa770d5aac2a8d20d3() {
  return __cxx_static_address_c6c424aa770d5aac2a8d20d3.reference || (__cxx_static_address_c6c424aa770d5aac2a8d20d3.reference = {
    __cReference: true,
    get value() { return DUKE_GRUNT____header_global_aa5821f190eb8ae0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:75
export const DUKE_HARTBEAT____header_global_35d87f11be62cee7 = ((((((39) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fdadfe198fe66c8d5cd2f936() {
  return __cxx_static_address_fdadfe198fe66c8d5cd2f936.reference || (__cxx_static_address_fdadfe198fe66c8d5cd2f936.reference = {
    __cReference: true,
    get value() { return DUKE_HARTBEAT____header_global_35d87f11be62cee7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:76
export const DUKE_ONWATER____header_global_e38c5c8a95958cc2 = ((((((40) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8fe1e0292b0e60484b1608f6() {
  return __cxx_static_address_8fe1e0292b0e60484b1608f6.reference || (__cxx_static_address_8fe1e0292b0e60484b1608f6.reference = {
    __cReference: true,
    get value() { return DUKE_ONWATER____header_global_e38c5c8a95958cc2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:77
export const DUKE_LAND____header_global_a6964a097a9ecea4 = ((((((42) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e10af37b9b640bdee1506054() {
  return __cxx_static_address_e10af37b9b640bdee1506054.reference || (__cxx_static_address_e10af37b9b640bdee1506054.reference = {
    __cReference: true,
    get value() { return DUKE_LAND____header_global_a6964a097a9ecea4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:78
export const DUKE_WALKINDUCTS____header_global_0921e198f43dae28 = ((((((43) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5f3b3bd3a5c7f494be132c39() {
  return __cxx_static_address_5f3b3bd3a5c7f494be132c39.reference || (__cxx_static_address_5f3b3bd3a5c7f494be132c39.reference = {
    __cReference: true,
    get value() { return DUKE_WALKINDUCTS____header_global_0921e198f43dae28; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:79
export const DUKE_UNDERWATER____header_global_bbcaef67cefc5ecd = ((((((48) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eafd2aa3cfce2df613719cd0() {
  return __cxx_static_address_eafd2aa3cfce2df613719cd0.reference || (__cxx_static_address_eafd2aa3cfce2df613719cd0.reference = {
    __cReference: true,
    get value() { return DUKE_UNDERWATER____header_global_bbcaef67cefc5ecd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:80
export const DUKE_JETPACK_ON____header_global_bb9c21b6e494842f = ((((((49) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e223cc9c73e0452b48a512e1() {
  return __cxx_static_address_e223cc9c73e0452b48a512e1.reference || (__cxx_static_address_e223cc9c73e0452b48a512e1.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_ON____header_global_bb9c21b6e494842f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:81
export const DUKE_JETPACK_IDLE____header_global_fe7f61dca38a63c6 = ((((((50) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4234ec7bc3c1c318522e2760() {
  return __cxx_static_address_4234ec7bc3c1c318522e2760.reference || (__cxx_static_address_4234ec7bc3c1c318522e2760.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_IDLE____header_global_fe7f61dca38a63c6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:82
export const DUKE_JETPACK_OFF____header_global_78d86e618049279b = ((((((51) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_633d34d0494006bc40a875fe() {
  return __cxx_static_address_633d34d0494006bc40a875fe.reference || (__cxx_static_address_633d34d0494006bc40a875fe.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_OFF____header_global_78d86e618049279b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:83
export const DUKETALKTOBOSS____header_global_eec9e0279c6d2394 = ((((((56) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7e1ef45ba7b5d0662643443b() {
  return __cxx_static_address_7e1ef45ba7b5d0662643443b.reference || (__cxx_static_address_7e1ef45ba7b5d0662643443b.reference = {
    __cReference: true,
    get value() { return DUKETALKTOBOSS____header_global_eec9e0279c6d2394; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:84
export const SQUISHED____header_global_c757001b1d2811c3 = ((((((69) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_599619250085edc0cb3f985d() {
  return __cxx_static_address_599619250085edc0cb3f985d.reference || (__cxx_static_address_599619250085edc0cb3f985d.reference = {
    __cReference: true,
    get value() { return SQUISHED____header_global_c757001b1d2811c3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:85
export const TELEPORTER____header_global_6431e0d382b1f4b6 = ((((((70) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3c339fdf5e93b2b7153900f8() {
  return __cxx_static_address_3c339fdf5e93b2b7153900f8.reference || (__cxx_static_address_3c339fdf5e93b2b7153900f8.reference = {
    __cReference: true,
    get value() { return TELEPORTER____header_global_6431e0d382b1f4b6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:86
export const ELEVATOR_ON____header_global_fe36704cf8a7f10e = ((((((71) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e702a4c6c857b914037321c2() {
  return __cxx_static_address_e702a4c6c857b914037321c2.reference || (__cxx_static_address_e702a4c6c857b914037321c2.reference = {
    __cReference: true,
    get value() { return ELEVATOR_ON____header_global_fe36704cf8a7f10e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:87
export const ELEVATOR_OFF____header_global_dd763e1bbabc29c3 = ((((((73) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1020624befb183ce85f93e33() {
  return __cxx_static_address_1020624befb183ce85f93e33.reference || (__cxx_static_address_1020624befb183ce85f93e33.reference = {
    __cReference: true,
    get value() { return ELEVATOR_OFF____header_global_dd763e1bbabc29c3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:88
export const SUBWAY____header_global_0ebbedcbc315b07a = ((((((75) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b898386edec86b96d3440667() {
  return __cxx_static_address_b898386edec86b96d3440667.reference || (__cxx_static_address_b898386edec86b96d3440667.reference = {
    __cReference: true,
    get value() { return SUBWAY____header_global_0ebbedcbc315b07a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:89
export const SWITCH_ON____header_global_bf33c87e5abaa186 = ((((((76) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d5bdc190538ec74eb8cf3a8d() {
  return __cxx_static_address_d5bdc190538ec74eb8cf3a8d.reference || (__cxx_static_address_d5bdc190538ec74eb8cf3a8d.reference = {
    __cReference: true,
    get value() { return SWITCH_ON____header_global_bf33c87e5abaa186; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:90
export const FLUSH_TOILET____header_global_71f5ad1b2a12e1d5 = ((((((79) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7b152374c2855413a69992e8() {
  return __cxx_static_address_7b152374c2855413a69992e8.reference || (__cxx_static_address_7b152374c2855413a69992e8.reference = {
    __cReference: true,
    get value() { return FLUSH_TOILET____header_global_71f5ad1b2a12e1d5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:91
export const EARTHQUAKE____header_global_ef9f98ace1f50cb7 = ((((((81) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c480923635c0312d0175e169() {
  return __cxx_static_address_c480923635c0312d0175e169.reference || (__cxx_static_address_c480923635c0312d0175e169.reference = {
    __cReference: true,
    get value() { return EARTHQUAKE____header_global_ef9f98ace1f50cb7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:92
export const END_OF_LEVEL_WARN____header_global_551640ab688059f7 = ((((((83) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0e7c10399aca42a4b5bf5351() {
  return __cxx_static_address_0e7c10399aca42a4b5bf5351.reference || (__cxx_static_address_0e7c10399aca42a4b5bf5351.reference = {
    __cReference: true,
    get value() { return END_OF_LEVEL_WARN____header_global_551640ab688059f7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:93
export const WIND_AMBIENCE____header_global_8b848fe78c4b2387 = ((((((91) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5f126950b6d7447ac37af3bd() {
  return __cxx_static_address_5f126950b6d7447ac37af3bd.reference || (__cxx_static_address_5f126950b6d7447ac37af3bd.reference = {
    __cReference: true,
    get value() { return WIND_AMBIENCE____header_global_8b848fe78c4b2387; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:94
export const SOMETHING_DRIPPING____header_global_c6df30bf51e4a966 = ((((((92) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a36be037ba1aa5802c388e95() {
  return __cxx_static_address_a36be037ba1aa5802c388e95.reference || (__cxx_static_address_a36be037ba1aa5802c388e95.reference = {
    __cReference: true,
    get value() { return SOMETHING_DRIPPING____header_global_c6df30bf51e4a966; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:95
export const BOS1_RECOG____header_global_97e1a7e627b13b65 = ((((((97) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b64f9c9df06edb3339e22e44() {
  return __cxx_static_address_b64f9c9df06edb3339e22e44.reference || (__cxx_static_address_b64f9c9df06edb3339e22e44.reference = {
    __cReference: true,
    get value() { return BOS1_RECOG____header_global_97e1a7e627b13b65; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:96
export const BOS2_RECOG____header_global_e7f7ae9f1182882a = ((((((102) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2b4c93ff0523de8f748857dd() {
  return __cxx_static_address_2b4c93ff0523de8f748857dd.reference || (__cxx_static_address_2b4c93ff0523de8f748857dd.reference = {
    __cReference: true,
    get value() { return BOS2_RECOG____header_global_e7f7ae9f1182882a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:97
export const DUKE_GETWEAPON2____header_global_f0655a0fcf2892a1 = ((((((107) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a065124e656c393adf5c156c() {
  return __cxx_static_address_a065124e656c393adf5c156c.reference || (__cxx_static_address_a065124e656c393adf5c156c.reference = {
    __cReference: true,
    get value() { return DUKE_GETWEAPON2____header_global_f0655a0fcf2892a1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:98
export const SHOTGUN_FIRE____header_global_ec623b47e657a443 = ((((((109) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_38288400e2b56a6c15001f37() {
  return __cxx_static_address_38288400e2b56a6c15001f37.reference || (__cxx_static_address_38288400e2b56a6c15001f37.reference = {
    __cReference: true,
    get value() { return SHOTGUN_FIRE____header_global_ec623b47e657a443; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:99
export const PRED_RECOG____header_global_aa0bc329acf93985 = ((((((111) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b1961bf394de52d9eb849bd4() {
  return __cxx_static_address_b1961bf394de52d9eb849bd4.reference || (__cxx_static_address_b1961bf394de52d9eb849bd4.reference = {
    __cReference: true,
    get value() { return PRED_RECOG____header_global_aa0bc329acf93985; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:100
export const CAPT_RECOG____header_global_9c918cf1f3e28eaf = ((((((117) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_14d5f10fd3643689ca6eb759() {
  return __cxx_static_address_14d5f10fd3643689ca6eb759.reference || (__cxx_static_address_14d5f10fd3643689ca6eb759.reference = {
    __cReference: true,
    get value() { return CAPT_RECOG____header_global_9c918cf1f3e28eaf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:101
export const PIG_RECOG____header_global_42603a7c7b8e954d = ((((((121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_50f620bb98632a51f22c7417() {
  return __cxx_static_address_50f620bb98632a51f22c7417.reference || (__cxx_static_address_50f620bb98632a51f22c7417.reference = {
    __cReference: true,
    get value() { return PIG_RECOG____header_global_42603a7c7b8e954d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:102
export const RECO_ROAM____header_global_caf5bf75c370c181 = ((((((125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2ef14daf29f88a95650a1a11() {
  return __cxx_static_address_2ef14daf29f88a95650a1a11.reference || (__cxx_static_address_2ef14daf29f88a95650a1a11.reference = {
    __cReference: true,
    get value() { return RECO_ROAM____header_global_caf5bf75c370c181; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:103
export const RECO_RECOG____header_global_66eee0c42062ff8b = ((((((126) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c8cde83558b52dd4db224f5f() {
  return __cxx_static_address_c8cde83558b52dd4db224f5f.reference || (__cxx_static_address_c8cde83558b52dd4db224f5f.reference = {
    __cReference: true,
    get value() { return RECO_RECOG____header_global_66eee0c42062ff8b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:104
export const RECO_ATTACK____header_global_79af9b42ae257637 = ((((((127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fe1e2c5a4940443cdc1259e8() {
  return __cxx_static_address_fe1e2c5a4940443cdc1259e8.reference || (__cxx_static_address_fe1e2c5a4940443cdc1259e8.reference = {
    __cReference: true,
    get value() { return RECO_ATTACK____header_global_79af9b42ae257637; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:105
export const RECO_PAIN____header_global_8c14ede6ddca365d = ((((((128) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cf0351b5f31649839e7f8c8f() {
  return __cxx_static_address_cf0351b5f31649839e7f8c8f.reference || (__cxx_static_address_cf0351b5f31649839e7f8c8f.reference = {
    __cReference: true,
    get value() { return RECO_PAIN____header_global_8c14ede6ddca365d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:106
export const DRON_RECOG____header_global_f5b2f58f89a659a3 = ((((((131) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_92d38f61cf726879cb706795() {
  return __cxx_static_address_92d38f61cf726879cb706795.reference || (__cxx_static_address_92d38f61cf726879cb706795.reference = {
    __cReference: true,
    get value() { return DRON_RECOG____header_global_f5b2f58f89a659a3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:107
export const COMM_RECOG____header_global_6b8cf782ff932d9c = ((((((136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_19dc93e737f74492e57b4aa4() {
  return __cxx_static_address_19dc93e737f74492e57b4aa4.reference || (__cxx_static_address_19dc93e737f74492e57b4aa4.reference = {
    __cReference: true,
    get value() { return COMM_RECOG____header_global_6b8cf782ff932d9c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:108
export const OCTA_RECOG____header_global_87f5b867ccb09a30 = ((((((141) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3e931b68e7bb582a11f1c4fb() {
  return __cxx_static_address_3e931b68e7bb582a11f1c4fb.reference || (__cxx_static_address_3e931b68e7bb582a11f1c4fb.reference = {
    __cReference: true,
    get value() { return OCTA_RECOG____header_global_87f5b867ccb09a30; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:109
export const TURR_RECOG____header_global_23fc39df56748887 = ((((((146) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0efba122f0fc59f7312e299d() {
  return __cxx_static_address_0efba122f0fc59f7312e299d.reference || (__cxx_static_address_0efba122f0fc59f7312e299d.reference = {
    __cReference: true,
    get value() { return TURR_RECOG____header_global_23fc39df56748887; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:110
export const SLIM_DYING____header_global_298a59bc351e44de = ((((((149) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ad0efa7ee9209d4df3205723() {
  return __cxx_static_address_ad0efa7ee9209d4df3205723.reference || (__cxx_static_address_ad0efa7ee9209d4df3205723.reference = {
    __cReference: true,
    get value() { return SLIM_DYING____header_global_298a59bc351e44de; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:111
export const BOS3_RECOG____header_global_44f688baa38e93a3 = ((((((151) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_18d85b72d43b3ac32c29474e() {
  return __cxx_static_address_18d85b72d43b3ac32c29474e.reference || (__cxx_static_address_18d85b72d43b3ac32c29474e.reference = {
    __cReference: true,
    get value() { return BOS3_RECOG____header_global_44f688baa38e93a3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:112
export const BOS1_WALK____header_global_f99cfe41644f914e = ((((((156) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_30b7907c21f1dcb358155821() {
  return __cxx_static_address_30b7907c21f1dcb358155821.reference || (__cxx_static_address_30b7907c21f1dcb358155821.reference = {
    __cReference: true,
    get value() { return BOS1_WALK____header_global_f99cfe41644f914e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:113
export const THUD____header_global_dcc51d0bf2ce752c = ((((((158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_93ba56d8447506452091683f() {
  return __cxx_static_address_93ba56d8447506452091683f.reference || (__cxx_static_address_93ba56d8447506452091683f.reference = {
    __cReference: true,
    get value() { return THUD____header_global_dcc51d0bf2ce752c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:114
export const WIERDSHOT_FLY____header_global_27e626a40d732049 = ((((((160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_efdf72cddf3b75fde3341ff4() {
  return __cxx_static_address_efdf72cddf3b75fde3341ff4.reference || (__cxx_static_address_efdf72cddf3b75fde3341ff4.reference = {
    __cReference: true,
    get value() { return WIERDSHOT_FLY____header_global_27e626a40d732049; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:115
export const SLIM_ROAM____header_global_bf91503fa2f0b097 = ((((((163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5efe892abfa5c52110163854() {
  return __cxx_static_address_5efe892abfa5c52110163854.reference || (__cxx_static_address_5efe892abfa5c52110163854.reference = {
    __cReference: true,
    get value() { return SLIM_ROAM____header_global_bf91503fa2f0b097; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:116
export const SHOTGUN_COCK____header_global_fff8b9bcf0d8f285 = ((((((169) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_95f6edc2007e88174fe57f1e() {
  return __cxx_static_address_95f6edc2007e88174fe57f1e.reference || (__cxx_static_address_95f6edc2007e88174fe57f1e.reference = {
    __cReference: true,
    get value() { return SHOTGUN_COCK____header_global_fff8b9bcf0d8f285; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:117
export const GENERIC_AMBIENCE17____header_global_25aa047c119ddae2 = ((((((177) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a9551e1b71946d32e07d5650() {
  return __cxx_static_address_a9551e1b71946d32e07d5650.reference || (__cxx_static_address_a9551e1b71946d32e07d5650.reference = {
    __cReference: true,
    get value() { return GENERIC_AMBIENCE17____header_global_25aa047c119ddae2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:118
export const BONUS_SPEECH1____header_global_df80a90a30232e09 = ((((((195) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bf1bb46d20e849988c69ba72() {
  return __cxx_static_address_bf1bb46d20e849988c69ba72.reference || (__cxx_static_address_bf1bb46d20e849988c69ba72.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH1____header_global_df80a90a30232e09; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:119
export const BONUS_SPEECH2____header_global_ea8058ca8c842d43 = ((((((196) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fcce35a793373f735f8e7c28() {
  return __cxx_static_address_fcce35a793373f735f8e7c28.reference || (__cxx_static_address_fcce35a793373f735f8e7c28.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH2____header_global_ea8058ca8c842d43; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:120
export const BONUS_SPEECH3____header_global_b06dbc3bee9724fb = ((((((197) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d750ef959617257a6f55ecb7() {
  return __cxx_static_address_d750ef959617257a6f55ecb7.reference || (__cxx_static_address_d750ef959617257a6f55ecb7.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH3____header_global_b06dbc3bee9724fb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:121
export const BONUS_SPEECH4____header_global_6821d7a6d99e2e61 = ((((((199) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_34d42bd1ec83b37b7830f16a() {
  return __cxx_static_address_34d42bd1ec83b37b7830f16a.reference || (__cxx_static_address_34d42bd1ec83b37b7830f16a.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH4____header_global_6821d7a6d99e2e61; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:122
export const DUKE_LAND_HURT____header_global_a64e891c2cba4148 = ((((((200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0f6102271f3fc9b30272585d() {
  return __cxx_static_address_0f6102271f3fc9b30272585d.reference || (__cxx_static_address_0f6102271f3fc9b30272585d.reference = {
    __cReference: true,
    get value() { return DUKE_LAND_HURT____header_global_a64e891c2cba4148; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:123
export const DUKE_SEARCH2____header_global_bb79a56558cd813d = ((((((207) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9f33425e7d4ec2c52e01b18c() {
  return __cxx_static_address_9f33425e7d4ec2c52e01b18c.reference || (__cxx_static_address_9f33425e7d4ec2c52e01b18c.reference = {
    __cReference: true,
    get value() { return DUKE_SEARCH2____header_global_bb79a56558cd813d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:124
export const DUKE_CRACK2____header_global_5d67253653762cf4 = ((((((208) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3da1deed8150a55de0f531ce() {
  return __cxx_static_address_3da1deed8150a55de0f531ce.reference || (__cxx_static_address_3da1deed8150a55de0f531ce.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK2____header_global_5d67253653762cf4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:125
export const DUKE_SEARCH____header_global_572ac3e42c10a512 = ((((((209) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ab891d4e3441e8ee6e50843c() {
  return __cxx_static_address_ab891d4e3441e8ee6e50843c.reference || (__cxx_static_address_ab891d4e3441e8ee6e50843c.reference = {
    __cReference: true,
    get value() { return DUKE_SEARCH____header_global_572ac3e42c10a512; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:126
export const DUKE_GET____header_global_e7d043e4155de9c6 = ((((((210) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ceeeb20021476e8d200434cb() {
  return __cxx_static_address_ceeeb20021476e8d200434cb.reference || (__cxx_static_address_ceeeb20021476e8d200434cb.reference = {
    __cReference: true,
    get value() { return DUKE_GET____header_global_e7d043e4155de9c6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:127
export const DUKE_LONGTERM_PAIN____header_global_b87c232fae9a215d = ((((((211) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_740af4de81269400cc896f8d() {
  return __cxx_static_address_740af4de81269400cc896f8d.reference || (__cxx_static_address_740af4de81269400cc896f8d.reference = {
    __cReference: true,
    get value() { return DUKE_LONGTERM_PAIN____header_global_b87c232fae9a215d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:128
export const MONITOR_ACTIVE____header_global_be7f06465b2cffed = ((((((212) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_56c1a708a6b1f0d6199164ff() {
  return __cxx_static_address_56c1a708a6b1f0d6199164ff.reference || (__cxx_static_address_56c1a708a6b1f0d6199164ff.reference = {
    __cReference: true,
    get value() { return MONITOR_ACTIVE____header_global_be7f06465b2cffed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:129
export const NITEVISION_ONOFF____header_global_0a4f38563b421003 = ((((((213) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1b6d4d662964e8fc27a8c159() {
  return __cxx_static_address_1b6d4d662964e8fc27a8c159.reference || (__cxx_static_address_1b6d4d662964e8fc27a8c159.reference = {
    __cReference: true,
    get value() { return NITEVISION_ONOFF____header_global_0a4f38563b421003; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:130
export const DUKE_CRACK_FIRST____header_global_90d927f848fde779 = ((((((215) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_78c5441b089b4a0b54dfdc3b() {
  return __cxx_static_address_78c5441b089b4a0b54dfdc3b.reference || (__cxx_static_address_78c5441b089b4a0b54dfdc3b.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK_FIRST____header_global_90d927f848fde779; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:131
export const DUKE_USEMEDKIT____header_global_56750619259302c8 = ((((((216) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_62ecc2b3ddc47be4fd155269() {
  return __cxx_static_address_62ecc2b3ddc47be4fd155269.reference || (__cxx_static_address_62ecc2b3ddc47be4fd155269.reference = {
    __cReference: true,
    get value() { return DUKE_USEMEDKIT____header_global_56750619259302c8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:132
export const DUKE_TAKEPILLS____header_global_4f4a3a60cc3f3832 = ((((((217) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bd9b0d1284cf628b117dd458() {
  return __cxx_static_address_bd9b0d1284cf628b117dd458.reference || (__cxx_static_address_bd9b0d1284cf628b117dd458.reference = {
    __cReference: true,
    get value() { return DUKE_TAKEPILLS____header_global_4f4a3a60cc3f3832; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:133
export const DUKE_PISSRELIEF____header_global_b4cbeab82827a13b = ((((((218) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_06b99c5a5da07fbb77f5cea8() {
  return __cxx_static_address_06b99c5a5da07fbb77f5cea8.reference || (__cxx_static_address_06b99c5a5da07fbb77f5cea8.reference = {
    __cReference: true,
    get value() { return DUKE_PISSRELIEF____header_global_b4cbeab82827a13b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:134
export const SELECT_WEAPON____header_global_dae2dde81ca57177 = ((((((219) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8ebcb370d17b02da2565bfc8() {
  return __cxx_static_address_8ebcb370d17b02da2565bfc8.reference || (__cxx_static_address_8ebcb370d17b02da2565bfc8.reference = {
    __cReference: true,
    get value() { return SELECT_WEAPON____header_global_dae2dde81ca57177; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:135
export const JIBBED_ACTOR5____header_global_fc63bb131b62ac42 = ((((((226) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f5ff602faf57ccf63c1fecc5() {
  return __cxx_static_address_f5ff602faf57ccf63c1fecc5.reference || (__cxx_static_address_f5ff602faf57ccf63c1fecc5.reference = {
    __cReference: true,
    get value() { return JIBBED_ACTOR5____header_global_fc63bb131b62ac42; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:136
export const JIBBED_ACTOR6____header_global_5b9c59dde39427dc = ((((((227) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2464ec60c3d58914f9c87490() {
  return __cxx_static_address_2464ec60c3d58914f9c87490.reference || (__cxx_static_address_2464ec60c3d58914f9c87490.reference = {
    __cReference: true,
    get value() { return JIBBED_ACTOR6____header_global_5b9c59dde39427dc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:137
export const DUKE_GOTHEALTHATLOW____header_global_730c1d3f88f0c217 = ((((((229) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_04f3a53547aa20dcdd060412() {
  return __cxx_static_address_04f3a53547aa20dcdd060412.reference || (__cxx_static_address_04f3a53547aa20dcdd060412.reference = {
    __cReference: true,
    get value() { return DUKE_GOTHEALTHATLOW____header_global_730c1d3f88f0c217; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:138
export const BOSSTALKTODUKE____header_global_784202b7c9108b52 = ((((((230) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5b690f8804acd77b0f2c75f6() {
  return __cxx_static_address_5b690f8804acd77b0f2c75f6.reference || (__cxx_static_address_5b690f8804acd77b0f2c75f6.reference = {
    __cReference: true,
    get value() { return BOSSTALKTODUKE____header_global_784202b7c9108b52; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:139
export const WAR_AMBIENCE2____header_global_d9522f8ddd5ad2d5 = ((((((232) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f57b52dd0a6d82fa5413e765() {
  return __cxx_static_address_f57b52dd0a6d82fa5413e765.reference || (__cxx_static_address_f57b52dd0a6d82fa5413e765.reference = {
    __cReference: true,
    get value() { return WAR_AMBIENCE2____header_global_d9522f8ddd5ad2d5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:140
export const EXITMENUSOUND____header_global_22f93fab0fa6f17b = ((((((243) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6fc86b7b79f274c76540f842() {
  return __cxx_static_address_6fc86b7b79f274c76540f842.reference || (__cxx_static_address_6fc86b7b79f274c76540f842.reference = {
    __cReference: true,
    get value() { return EXITMENUSOUND____header_global_22f93fab0fa6f17b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:141
export const FLY_BY____header_global_f7ebfab2d9080823 = ((((((244) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c5b65892d01d4484306709a7() {
  return __cxx_static_address_c5b65892d01d4484306709a7.reference || (__cxx_static_address_c5b65892d01d4484306709a7.reference = {
    __cReference: true,
    get value() { return FLY_BY____header_global_f7ebfab2d9080823; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:142
export const DUKE_SCREAM____header_global_2cb61bb455dace12 = ((((((245) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_89ab91a1d69b0752005a1881() {
  return __cxx_static_address_89ab91a1d69b0752005a1881.reference || (__cxx_static_address_89ab91a1d69b0752005a1881.reference = {
    __cReference: true,
    get value() { return DUKE_SCREAM____header_global_2cb61bb455dace12; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:143
export const SHRINKER_HIT____header_global_a72b5e3b1bd5b1d4 = ((((((246) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_faa23215093f3bd9d649ff95() {
  return __cxx_static_address_faa23215093f3bd9d649ff95.reference || (__cxx_static_address_faa23215093f3bd9d649ff95.reference = {
    __cReference: true,
    get value() { return SHRINKER_HIT____header_global_a72b5e3b1bd5b1d4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:144
export const RATTY____header_global_ad4210a63131d812 = ((((((247) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7ab0e1c2cb9bb4427fd9564e() {
  return __cxx_static_address_7ab0e1c2cb9bb4427fd9564e.reference || (__cxx_static_address_7ab0e1c2cb9bb4427fd9564e.reference = {
    __cReference: true,
    get value() { return RATTY____header_global_ad4210a63131d812; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:145
export const BONUSMUSIC____header_global_6d65833e03654f1d = ((((((249) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_64c3256b9982f81a825d2c57() {
  return __cxx_static_address_64c3256b9982f81a825d2c57.reference || (__cxx_static_address_64c3256b9982f81a825d2c57.reference = {
    __cReference: true,
    get value() { return BONUSMUSIC____header_global_6d65833e03654f1d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:146
export const DUKE_GETWEAPON6____header_global_e9d246ba81a4cf93 = ((((((264) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7007f9f877904b6f6fa5c357() {
  return __cxx_static_address_7007f9f877904b6f6fa5c357.reference || (__cxx_static_address_7007f9f877904b6f6fa5c357.reference = {
    __cReference: true,
    get value() { return DUKE_GETWEAPON6____header_global_e9d246ba81a4cf93; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:147
export const ALIEN_SWITCH1____header_global_1656a46c442319c0 = ((((((272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_26362d6c51cc5a58fb24d586() {
  return __cxx_static_address_26362d6c51cc5a58fb24d586.reference || (__cxx_static_address_26362d6c51cc5a58fb24d586.reference = {
    __cReference: true,
    get value() { return ALIEN_SWITCH1____header_global_1656a46c442319c0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:148
export const RIPHEADNECK____header_global_19537f9f1ab39076 = ((((((284) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2ac0d361c73dab1a4be0a4f6() {
  return __cxx_static_address_2ac0d361c73dab1a4be0a4f6.reference || (__cxx_static_address_2ac0d361c73dab1a4be0a4f6.reference = {
    __cReference: true,
    get value() { return RIPHEADNECK____header_global_19537f9f1ab39076; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:149
export const ENDSEQVOL3SND4____header_global_45453d09703bc0fe = ((((((288) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0b1e0cb5211318ae9598fdb9() {
  return __cxx_static_address_0b1e0cb5211318ae9598fdb9.reference || (__cxx_static_address_0b1e0cb5211318ae9598fdb9.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND4____header_global_45453d09703bc0fe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:150
export const ENDSEQVOL3SND5____header_global_7c6b086e6dc1cdf3 = ((((((289) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d7c9caa975cfa48244d71ac6() {
  return __cxx_static_address_d7c9caa975cfa48244d71ac6.reference || (__cxx_static_address_d7c9caa975cfa48244d71ac6.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND5____header_global_7c6b086e6dc1cdf3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:151
export const ENDSEQVOL3SND6____header_global_f402a23b8fec1e3b = ((((((290) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3bbfd7bbf57fa20aabe0a147() {
  return __cxx_static_address_3bbfd7bbf57fa20aabe0a147.reference || (__cxx_static_address_3bbfd7bbf57fa20aabe0a147.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND6____header_global_f402a23b8fec1e3b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:152
export const ENDSEQVOL3SND7____header_global_1659f66b125fcf5b = ((((((291) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_161f0e20bd19608c48ad8113() {
  return __cxx_static_address_161f0e20bd19608c48ad8113.reference || (__cxx_static_address_161f0e20bd19608c48ad8113.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND7____header_global_1659f66b125fcf5b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:153
export const ENDSEQVOL3SND8____header_global_3bd404fd287b4308 = ((((((292) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0deb236718cc7dbb60c69b6d() {
  return __cxx_static_address_0deb236718cc7dbb60c69b6d.reference || (__cxx_static_address_0deb236718cc7dbb60c69b6d.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND8____header_global_3bd404fd287b4308; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:154
export const ENDSEQVOL3SND9____header_global_4f8d3523ff0458a0 = ((((((293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e5aaa71011caa4f57d816eae() {
  return __cxx_static_address_e5aaa71011caa4f57d816eae.reference || (__cxx_static_address_e5aaa71011caa4f57d816eae.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND9____header_global_4f8d3523ff0458a0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:155
export const WHIPYOURASS____header_global_5b61b2cbe0d6f6b2 = ((((((294) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_87dceda5f7b87050dd7383ec() {
  return __cxx_static_address_87dceda5f7b87050dd7383ec.reference || (__cxx_static_address_87dceda5f7b87050dd7383ec.reference = {
    __cReference: true,
    get value() { return WHIPYOURASS____header_global_5b61b2cbe0d6f6b2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:156
export const ENDSEQVOL2SND1____header_global_fb900b117c0292b4 = ((((((295) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_114ef800cf561c2d75a7f24d() {
  return __cxx_static_address_114ef800cf561c2d75a7f24d.reference || (__cxx_static_address_114ef800cf561c2d75a7f24d.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND1____header_global_fb900b117c0292b4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:157
export const ENDSEQVOL2SND2____header_global_9f021ba20f71d8f7 = ((((((296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4ca85a8c114e1426431fafb8() {
  return __cxx_static_address_4ca85a8c114e1426431fafb8.reference || (__cxx_static_address_4ca85a8c114e1426431fafb8.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND2____header_global_9f021ba20f71d8f7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:158
export const ENDSEQVOL2SND3____header_global_d8a792d931689c82 = ((((((297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e18a29759be3c89f266af9d2() {
  return __cxx_static_address_e18a29759be3c89f266af9d2.reference || (__cxx_static_address_e18a29759be3c89f266af9d2.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND3____header_global_d8a792d931689c82; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:159
export const ENDSEQVOL2SND4____header_global_ac77d8241965fd1c = ((((((298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4f94ed375d82e784bef44e6c() {
  return __cxx_static_address_4f94ed375d82e784bef44e6c.reference || (__cxx_static_address_4f94ed375d82e784bef44e6c.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND4____header_global_ac77d8241965fd1c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:160
export const ENDSEQVOL2SND5____header_global_5b1d8e78d39e3dc8 = ((((((299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_56daf5714056df2335204599() {
  return __cxx_static_address_56daf5714056df2335204599.reference || (__cxx_static_address_56daf5714056df2335204599.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND5____header_global_5b1d8e78d39e3dc8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:161
export const ENDSEQVOL2SND6____header_global_f2b9469d680433d8 = ((((((300) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2c3f2142c728016744f9d556() {
  return __cxx_static_address_2c3f2142c728016744f9d556.reference || (__cxx_static_address_2c3f2142c728016744f9d556.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND6____header_global_f2b9469d680433d8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:162
export const ENDSEQVOL2SND7____header_global_9ca39d255ea4b8b8 = ((((((301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0ca59f31149e6518cc9b5377() {
  return __cxx_static_address_0ca59f31149e6518cc9b5377.reference || (__cxx_static_address_0ca59f31149e6518cc9b5377.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND7____header_global_9ca39d255ea4b8b8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:163
export const SOMETHINGFROZE____header_global_35256f89912d8a00 = ((((((303) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_280b568ad1764ee9b3fa3047() {
  return __cxx_static_address_280b568ad1764ee9b3fa3047.reference || (__cxx_static_address_280b568ad1764ee9b3fa3047.reference = {
    __cReference: true,
    get value() { return SOMETHINGFROZE____header_global_35256f89912d8a00; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:164
export const WIND_REPEAT____header_global_409bd031f9f7602f = ((((((308) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d2b0590d9328c7065e62baf1() {
  return __cxx_static_address_d2b0590d9328c7065e62baf1.reference || (__cxx_static_address_d2b0590d9328c7065e62baf1.reference = {
    __cReference: true,
    get value() { return WIND_REPEAT____header_global_409bd031f9f7602f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:165
export const BOS4_RECOG____header_global_ff1b5737a63bfa18 = ((((((342) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_184bd6cef29dca4be481a0b7() {
  return __cxx_static_address_184bd6cef29dca4be481a0b7.reference || (__cxx_static_address_184bd6cef29dca4be481a0b7.reference = {
    __cReference: true,
    get value() { return BOS4_RECOG____header_global_ff1b5737a63bfa18; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:166
export const LIGHTNING_SLAP____header_global_2acfed49495ba1dd = ((((((351) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_66452940ccd63b9db4b74985() {
  return __cxx_static_address_66452940ccd63b9db4b74985.reference || (__cxx_static_address_66452940ccd63b9db4b74985.reference = {
    __cReference: true,
    get value() { return LIGHTNING_SLAP____header_global_2acfed49495ba1dd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:167
export const THUNDER____header_global_d929cbeb882af429 = ((((((352) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d6ee9d4da6e6f5ff48ba037f() {
  return __cxx_static_address_d6ee9d4da6e6f5ff48ba037f.reference || (__cxx_static_address_d6ee9d4da6e6f5ff48ba037f.reference = {
    __cReference: true,
    get value() { return THUNDER____header_global_d929cbeb882af429; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:168
export const INTRO4_1____header_global_058167e8f13fb29e = ((((((363) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_73367703316729424c135105() {
  return __cxx_static_address_73367703316729424c135105.reference || (__cxx_static_address_73367703316729424c135105.reference = {
    __cReference: true,
    get value() { return INTRO4_1____header_global_058167e8f13fb29e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:169
export const INTRO4_2____header_global_57908bd51b786e1b = ((((((364) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ffa6592c71030cacbbffca48() {
  return __cxx_static_address_ffa6592c71030cacbbffca48.reference || (__cxx_static_address_ffa6592c71030cacbbffca48.reference = {
    __cReference: true,
    get value() { return INTRO4_2____header_global_57908bd51b786e1b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:170
export const INTRO4_3____header_global_1eab096d41207254 = ((((((365) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_db17765b23a6cc094974381b() {
  return __cxx_static_address_db17765b23a6cc094974381b.reference || (__cxx_static_address_db17765b23a6cc094974381b.reference = {
    __cReference: true,
    get value() { return INTRO4_3____header_global_1eab096d41207254; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:171
export const INTRO4_4____header_global_1a8c63b12e6c9e63 = ((((((366) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1ba7082aaedce50f130c80fd() {
  return __cxx_static_address_1ba7082aaedce50f130c80fd.reference || (__cxx_static_address_1ba7082aaedce50f130c80fd.reference = {
    __cReference: true,
    get value() { return INTRO4_4____header_global_1a8c63b12e6c9e63; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:172
export const INTRO4_5____header_global_da401dd757adbc3a = ((((((367) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_da3f37d97fc2a6261c6aba56() {
  return __cxx_static_address_da3f37d97fc2a6261c6aba56.reference || (__cxx_static_address_da3f37d97fc2a6261c6aba56.reference = {
    __cReference: true,
    get value() { return INTRO4_5____header_global_da401dd757adbc3a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:173
export const INTRO4_6____header_global_f91557e5d6a54243 = ((((((368) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7f7d189e1b6d9b1730219667() {
  return __cxx_static_address_7f7d189e1b6d9b1730219667.reference || (__cxx_static_address_7f7d189e1b6d9b1730219667.reference = {
    __cReference: true,
    get value() { return INTRO4_6____header_global_f91557e5d6a54243; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:174
export const BOSS4_DEADSPEECH____header_global_d898fbc865166fb7 = ((((((370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c674ffc67b9bb43f5749f328() {
  return __cxx_static_address_c674ffc67b9bb43f5749f328.reference || (__cxx_static_address_c674ffc67b9bb43f5749f328.reference = {
    __cReference: true,
    get value() { return BOSS4_DEADSPEECH____header_global_d898fbc865166fb7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:175
export const BOSS4_FIRSTSEE____header_global_7768f9003c96e3f7 = ((((((371) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_afb78f16ff12c1cebcf5c4ee() {
  return __cxx_static_address_afb78f16ff12c1cebcf5c4ee.reference || (__cxx_static_address_afb78f16ff12c1cebcf5c4ee.reference = {
    __cReference: true,
    get value() { return BOSS4_FIRSTSEE____header_global_7768f9003c96e3f7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:176
export const VOL4ENDSND1____header_global_5a5a89f3d37f5e3f = ((((((384) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c1252da413a906d03a6aa52c() {
  return __cxx_static_address_c1252da413a906d03a6aa52c.reference || (__cxx_static_address_c1252da413a906d03a6aa52c.reference = {
    __cReference: true,
    get value() { return VOL4ENDSND1____header_global_5a5a89f3d37f5e3f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:177
export const VOL4ENDSND2____header_global_75ae7c1b77104a26 = ((((((385) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8597bb48b7993ba453721eea() {
  return __cxx_static_address_8597bb48b7993ba453721eea.reference || (__cxx_static_address_8597bb48b7993ba453721eea.reference = {
    __cReference: true,
    get value() { return VOL4ENDSND2____header_global_75ae7c1b77104a26; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:178
export const EXPANDERSHOOT____header_global_7dfdfc9f7fab8fd2 = ((((((388) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f7ff46b26f75f95deaf49426() {
  return __cxx_static_address_f7ff46b26f75f95deaf49426.reference || (__cxx_static_address_f7ff46b26f75f95deaf49426.reference = {
    __cReference: true,
    get value() { return EXPANDERSHOOT____header_global_7dfdfc9f7fab8fd2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:179
export const INTRO4_B____header_global_7b4d00d33c3b38a0 = ((((((392) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f3234849d58e49e890f415ca() {
  return __cxx_static_address_f3234849d58e49e890f415ca.reference || (__cxx_static_address_f3234849d58e49e890f415ca.reference = {
    __cReference: true,
    get value() { return INTRO4_B____header_global_7b4d00d33c3b38a0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:180
export const BIGBANG____header_global_22fd4b5ee62852dc = ((((((393) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5bb7bb5037037125857db0fa() {
  return __cxx_static_address_5bb7bb5037037125857db0fa.reference || (__cxx_static_address_5bb7bb5037037125857db0fa.reference = {
    __cReference: true,
    get value() { return BIGBANG____header_global_22fd4b5ee62852dc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:181
export const FLAMETHROWER_INTRO____header_global_e7a1066ee8104924 = ((((((398) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_52dc5e0112358d84cbf70b01() {
  return __cxx_static_address_52dc5e0112358d84cbf70b01.reference || (__cxx_static_address_52dc5e0112358d84cbf70b01.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_INTRO____header_global_e7a1066ee8104924; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:182
export const FLAMETHROWER_LOOP____header_global_3b68d732d86fa041 = ((((((399) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d6c1945ae79b2c8e9bb957b5() {
  return __cxx_static_address_d6c1945ae79b2c8e9bb957b5.reference || (__cxx_static_address_d6c1945ae79b2c8e9bb957b5.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_LOOP____header_global_3b68d732d86fa041; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:183
export const FLAMETHROWER_END____header_global_76b26ccd6c528354 = ((((((400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_55458350fedb3614cd602385() {
  return __cxx_static_address_55458350fedb3614cd602385.reference || (__cxx_static_address_55458350fedb3614cd602385.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_END____header_global_76b26ccd6c528354; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:184
export const E5L7_DUKE_QUIT_YOU____header_global_73336ee237f11fcd = ((((((401) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_346c5a0b588c6b18e41c34e0() {
  return __cxx_static_address_346c5a0b588c6b18e41c34e0.reference || (__cxx_static_address_346c5a0b588c6b18e41c34e0.reference = {
    __cReference: true,
    get value() { return E5L7_DUKE_QUIT_YOU____header_global_73336ee237f11fcd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:187
export const SECTOREFFECTOR____header_global_c8a197a4b800c2b9 = ((((((1) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7219fb575d1d967f154b8a84() {
  return __cxx_static_address_7219fb575d1d967f154b8a84.reference || (__cxx_static_address_7219fb575d1d967f154b8a84.reference = {
    __cReference: true,
    get value() { return SECTOREFFECTOR____header_global_c8a197a4b800c2b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:188
export const ACTIVATOR____header_global_ac5c34f798d08426 = ((((((2) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7bf6604e692c2c470ad0d4ba() {
  return __cxx_static_address_7bf6604e692c2c470ad0d4ba.reference || (__cxx_static_address_7bf6604e692c2c470ad0d4ba.reference = {
    __cReference: true,
    get value() { return ACTIVATOR____header_global_ac5c34f798d08426; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:189
export const TOUCHPLATE____header_global_1786e1e90ca6ecda = ((((((3) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_70e878f76ec6741b8cbc0c8a() {
  return __cxx_static_address_70e878f76ec6741b8cbc0c8a.reference || (__cxx_static_address_70e878f76ec6741b8cbc0c8a.reference = {
    __cReference: true,
    get value() { return TOUCHPLATE____header_global_1786e1e90ca6ecda; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:190
export const ACTIVATORLOCKED____header_global_2314b95cb391b2cc = ((((((4) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_99eb044908688eb85f93de57() {
  return __cxx_static_address_99eb044908688eb85f93de57.reference || (__cxx_static_address_99eb044908688eb85f93de57.reference = {
    __cReference: true,
    get value() { return ACTIVATORLOCKED____header_global_2314b95cb391b2cc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:191
export const MUSICANDSFX____header_global_b58344ca7d7626c8 = ((((((5) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_67a5212208dafaa76d6fbf66() {
  return __cxx_static_address_67a5212208dafaa76d6fbf66.reference || (__cxx_static_address_67a5212208dafaa76d6fbf66.reference = {
    __cReference: true,
    get value() { return MUSICANDSFX____header_global_b58344ca7d7626c8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:192
export const LOCATORS____header_global_fba4627f585cfa41 = ((((((6) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_798d41323411811c72d1458d() {
  return __cxx_static_address_798d41323411811c72d1458d.reference || (__cxx_static_address_798d41323411811c72d1458d.reference = {
    __cReference: true,
    get value() { return LOCATORS____header_global_fba4627f585cfa41; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:193
export const CYCLER____header_global_b7970af19278485b = ((((((7) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cebcff04307a3f64aa552a75() {
  return __cxx_static_address_cebcff04307a3f64aa552a75.reference || (__cxx_static_address_cebcff04307a3f64aa552a75.reference = {
    __cReference: true,
    get value() { return CYCLER____header_global_b7970af19278485b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:194
export const MASTERSWITCH____header_global_82dbcf26417aaaa3 = ((((((8) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9b7fffda6261d82cc9573405() {
  return __cxx_static_address_9b7fffda6261d82cc9573405.reference || (__cxx_static_address_9b7fffda6261d82cc9573405.reference = {
    __cReference: true,
    get value() { return MASTERSWITCH____header_global_82dbcf26417aaaa3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:195
export const RESPAWN____header_global_376d35abad6b3d86 = ((((((9) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e687f86a99c31b453224b097() {
  return __cxx_static_address_e687f86a99c31b453224b097.reference || (__cxx_static_address_e687f86a99c31b453224b097.reference = {
    __cReference: true,
    get value() { return RESPAWN____header_global_376d35abad6b3d86; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:196
export const GPSPEED____header_global_1a14c7341462b27d = ((((((10) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2cbdd977803e96da1b0396d3() {
  return __cxx_static_address_2cbdd977803e96da1b0396d3.reference || (__cxx_static_address_2cbdd977803e96da1b0396d3.reference = {
    __cReference: true,
    get value() { return GPSPEED____header_global_1a14c7341462b27d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:197
export const FOF____header_global_b7af53b8369ad927 = ((((((13) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_388245e5f16de263a20dd6df() {
  return __cxx_static_address_388245e5f16de263a20dd6df.reference || (__cxx_static_address_388245e5f16de263a20dd6df.reference = {
    __cReference: true,
    get value() { return FOF____header_global_b7af53b8369ad927; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:198
export const ARROW____header_global_a2cd1a234c22de0d = ((((((20) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0047dad985d01714ee52bc17() {
  return __cxx_static_address_0047dad985d01714ee52bc17.reference || (__cxx_static_address_0047dad985d01714ee52bc17.reference = {
    __cReference: true,
    get value() { return ARROW____header_global_a2cd1a234c22de0d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:199
export const FIRSTGUNSPRITE____header_global_c1c547544d39dbf0 = ((((((21) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1a89f1e513583e9971bd4d47() {
  return __cxx_static_address_1a89f1e513583e9971bd4d47.reference || (__cxx_static_address_1a89f1e513583e9971bd4d47.reference = {
    __cReference: true,
    get value() { return FIRSTGUNSPRITE____header_global_c1c547544d39dbf0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:200
export const CHAINGUNSPRITE____header_global_351a0ad962b59414 = ((((((22) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e4d7484277bedee6e275eab8() {
  return __cxx_static_address_e4d7484277bedee6e275eab8.reference || (__cxx_static_address_e4d7484277bedee6e275eab8.reference = {
    __cReference: true,
    get value() { return CHAINGUNSPRITE____header_global_351a0ad962b59414; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:201
export const RPGSPRITE____header_global_77326689676acde2 = ((((((23) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d25874d5ca6cb96cf930774c() {
  return __cxx_static_address_d25874d5ca6cb96cf930774c.reference || (__cxx_static_address_d25874d5ca6cb96cf930774c.reference = {
    __cReference: true,
    get value() { return RPGSPRITE____header_global_77326689676acde2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:202
export const FREEZESPRITE____header_global_92bb4eb5c06b9336 = ((((((24) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9eee6dfd6aa68d7b5c81dc77() {
  return __cxx_static_address_9eee6dfd6aa68d7b5c81dc77.reference || (__cxx_static_address_9eee6dfd6aa68d7b5c81dc77.reference = {
    __cReference: true,
    get value() { return FREEZESPRITE____header_global_92bb4eb5c06b9336; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:203
export const SHRINKERSPRITE____header_global_ec3659d1378fb0de = ((((((25) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3a8aa352d4f27cdaf804a7f9() {
  return __cxx_static_address_3a8aa352d4f27cdaf804a7f9.reference || (__cxx_static_address_3a8aa352d4f27cdaf804a7f9.reference = {
    __cReference: true,
    get value() { return SHRINKERSPRITE____header_global_ec3659d1378fb0de; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:204
export const HEAVYHBOMB____header_global_bccd3cd5afcfca14 = ((((((26) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_de58fe1820d4e923683be3f1() {
  return __cxx_static_address_de58fe1820d4e923683be3f1.reference || (__cxx_static_address_de58fe1820d4e923683be3f1.reference = {
    __cReference: true,
    get value() { return HEAVYHBOMB____header_global_bccd3cd5afcfca14; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:205
export const TRIPBOMBSPRITE____header_global_da14947c83fb8632 = ((((((27) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e3d0b956c824b04adb19dea4() {
  return __cxx_static_address_e3d0b956c824b04adb19dea4.reference || (__cxx_static_address_e3d0b956c824b04adb19dea4.reference = {
    __cReference: true,
    get value() { return TRIPBOMBSPRITE____header_global_da14947c83fb8632; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:206
export const SHOTGUNSPRITE____header_global_d4a6bd7f9f5dca82 = ((((((28) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4017e0cef99f76d26cf5cf26() {
  return __cxx_static_address_4017e0cef99f76d26cf5cf26.reference || (__cxx_static_address_4017e0cef99f76d26cf5cf26.reference = {
    __cReference: true,
    get value() { return SHOTGUNSPRITE____header_global_d4a6bd7f9f5dca82; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:207
export const DEVISTATORSPRITE____header_global_66a28dddef5a11b5 = ((((((29) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_50b9d8644627bd59ec3922ba() {
  return __cxx_static_address_50b9d8644627bd59ec3922ba.reference || (__cxx_static_address_50b9d8644627bd59ec3922ba.reference = {
    __cReference: true,
    get value() { return DEVISTATORSPRITE____header_global_66a28dddef5a11b5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:208
export const HEALTHBOX____header_global_643eacde6d200b74 = ((((((30) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_30d88816312a146ac8a5520d() {
  return __cxx_static_address_30d88816312a146ac8a5520d.reference || (__cxx_static_address_30d88816312a146ac8a5520d.reference = {
    __cReference: true,
    get value() { return HEALTHBOX____header_global_643eacde6d200b74; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:209
export const AMMOBOX____header_global_b02fe7bf29df25d1 = ((((((31) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e5fec3a2699502abc73e1ed9() {
  return __cxx_static_address_e5fec3a2699502abc73e1ed9.reference || (__cxx_static_address_e5fec3a2699502abc73e1ed9.reference = {
    __cReference: true,
    get value() { return AMMOBOX____header_global_b02fe7bf29df25d1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:210
export const GROWSPRITEICON____header_global_92ae265dd97b91f3 = ((((((32) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c6fbda95f08e553929531be9() {
  return __cxx_static_address_c6fbda95f08e553929531be9.reference || (__cxx_static_address_c6fbda95f08e553929531be9.reference = {
    __cReference: true,
    get value() { return GROWSPRITEICON____header_global_92ae265dd97b91f3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:211
export const INVENTORYBOX____header_global_37089af3ebdae1e7 = ((((((33) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7e0a70963092c3cde82affa8() {
  return __cxx_static_address_7e0a70963092c3cde82affa8.reference || (__cxx_static_address_7e0a70963092c3cde82affa8.reference = {
    __cReference: true,
    get value() { return INVENTORYBOX____header_global_37089af3ebdae1e7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:212
export const FREEZEAMMO____header_global_37febf5ee8a65ab6 = ((((((37) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_76e9e3440a1d06e58a2c2b1f() {
  return __cxx_static_address_76e9e3440a1d06e58a2c2b1f.reference || (__cxx_static_address_76e9e3440a1d06e58a2c2b1f.reference = {
    __cReference: true,
    get value() { return FREEZEAMMO____header_global_37febf5ee8a65ab6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:213
export const AMMO____header_global_dde4ae343009d359 = ((((((40) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_967dd19edd9762c8cbc74631() {
  return __cxx_static_address_967dd19edd9762c8cbc74631.reference || (__cxx_static_address_967dd19edd9762c8cbc74631.reference = {
    __cReference: true,
    get value() { return AMMO____header_global_dde4ae343009d359; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:214
export const BATTERYAMMO____header_global_4203c2c91f7ae31c = ((((((41) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_87ee45ad9312ebb2a4f102e0() {
  return __cxx_static_address_87ee45ad9312ebb2a4f102e0.reference || (__cxx_static_address_87ee45ad9312ebb2a4f102e0.reference = {
    __cReference: true,
    get value() { return BATTERYAMMO____header_global_4203c2c91f7ae31c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:215
export const DEVISTATORAMMO____header_global_733118d20fae77df = ((((((42) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_24728054f9d2752e00714311() {
  return __cxx_static_address_24728054f9d2752e00714311.reference || (__cxx_static_address_24728054f9d2752e00714311.reference = {
    __cReference: true,
    get value() { return DEVISTATORAMMO____header_global_733118d20fae77df; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:216
export const RPGAMMO____header_global_26aa173cc1095ca0 = ((((((44) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6d10f51b56811c9db2f991da() {
  return __cxx_static_address_6d10f51b56811c9db2f991da.reference || (__cxx_static_address_6d10f51b56811c9db2f991da.reference = {
    __cReference: true,
    get value() { return RPGAMMO____header_global_26aa173cc1095ca0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:217
export const GROWAMMO____header_global_393926bf22b552b7 = ((((((45) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4d953abde881f610fec7c470() {
  return __cxx_static_address_4d953abde881f610fec7c470.reference || (__cxx_static_address_4d953abde881f610fec7c470.reference = {
    __cReference: true,
    get value() { return GROWAMMO____header_global_393926bf22b552b7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:218
export const CRYSTALAMMO____header_global_a3b2e00e2cfb12fe = ((((((46) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3dcef1c668c68058a4badecb() {
  return __cxx_static_address_3dcef1c668c68058a4badecb.reference || (__cxx_static_address_3dcef1c668c68058a4badecb.reference = {
    __cReference: true,
    get value() { return CRYSTALAMMO____header_global_a3b2e00e2cfb12fe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:219
export const HBOMBAMMO____header_global_6658f8dea0d2ef23 = ((((((47) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c941f2935dc659fa408c3067() {
  return __cxx_static_address_c941f2935dc659fa408c3067.reference || (__cxx_static_address_c941f2935dc659fa408c3067.reference = {
    __cReference: true,
    get value() { return HBOMBAMMO____header_global_6658f8dea0d2ef23; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:220
export const AMMOLOTS____header_global_470fe356cd04b57e = ((((((48) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d1883b22114cd007543f15e2() {
  return __cxx_static_address_d1883b22114cd007543f15e2.reference || (__cxx_static_address_d1883b22114cd007543f15e2.reference = {
    __cReference: true,
    get value() { return AMMOLOTS____header_global_470fe356cd04b57e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:221
export const SHOTGUNAMMO____header_global_70b1817f5baa2cff = ((((((49) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_abf9dcbf45e1a57434805ce2() {
  return __cxx_static_address_abf9dcbf45e1a57434805ce2.reference || (__cxx_static_address_abf9dcbf45e1a57434805ce2.reference = {
    __cReference: true,
    get value() { return SHOTGUNAMMO____header_global_70b1817f5baa2cff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:222
export const COLA____header_global_25afd2ccc7031993 = ((((((51) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_be145f3a060a70713afd0368() {
  return __cxx_static_address_be145f3a060a70713afd0368.reference || (__cxx_static_address_be145f3a060a70713afd0368.reference = {
    __cReference: true,
    get value() { return COLA____header_global_25afd2ccc7031993; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:223
export const SIXPAK____header_global_bcf9764cb1c0d52c = ((((((52) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f9723288986bc5c63a0fd142() {
  return __cxx_static_address_f9723288986bc5c63a0fd142.reference || (__cxx_static_address_f9723288986bc5c63a0fd142.reference = {
    __cReference: true,
    get value() { return SIXPAK____header_global_bcf9764cb1c0d52c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:224
export const FIRSTAID____header_global_cf90fb367515deeb = ((((((53) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_55d147cfdcf42b4d75dd6dc9() {
  return __cxx_static_address_55d147cfdcf42b4d75dd6dc9.reference || (__cxx_static_address_55d147cfdcf42b4d75dd6dc9.reference = {
    __cReference: true,
    get value() { return FIRSTAID____header_global_cf90fb367515deeb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:225
export const SHIELD____header_global_6efaab469143324f = ((((((54) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_90602ce11b1a531237e20fa9() {
  return __cxx_static_address_90602ce11b1a531237e20fa9.reference || (__cxx_static_address_90602ce11b1a531237e20fa9.reference = {
    __cReference: true,
    get value() { return SHIELD____header_global_6efaab469143324f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:226
export const STEROIDS____header_global_3dcbde90093b48a4 = ((((((55) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6ccf0e2562c22a2cf1388b76() {
  return __cxx_static_address_6ccf0e2562c22a2cf1388b76.reference || (__cxx_static_address_6ccf0e2562c22a2cf1388b76.reference = {
    __cReference: true,
    get value() { return STEROIDS____header_global_3dcbde90093b48a4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:227
export const AIRTANK____header_global_87f91078bb60e360 = ((((((56) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_48ebca5ee28bb2d27dca0f3e() {
  return __cxx_static_address_48ebca5ee28bb2d27dca0f3e.reference || (__cxx_static_address_48ebca5ee28bb2d27dca0f3e.reference = {
    __cReference: true,
    get value() { return AIRTANK____header_global_87f91078bb60e360; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:228
export const JETPACK____header_global_ccd2413a7dd7dc15 = ((((((57) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_60f0b37b8e5348a10fb0bec1() {
  return __cxx_static_address_60f0b37b8e5348a10fb0bec1.reference || (__cxx_static_address_60f0b37b8e5348a10fb0bec1.reference = {
    __cReference: true,
    get value() { return JETPACK____header_global_ccd2413a7dd7dc15; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:229
export const HEATSENSOR____header_global_8647463d945315d0 = ((((((59) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_20c9e7bea5dda42752ac7b03() {
  return __cxx_static_address_20c9e7bea5dda42752ac7b03.reference || (__cxx_static_address_20c9e7bea5dda42752ac7b03.reference = {
    __cReference: true,
    get value() { return HEATSENSOR____header_global_8647463d945315d0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:230
export const ACCESSCARD____header_global_20ffd7340e62f4f5 = ((((((60) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5e718da5d9a2b675ec1c666c() {
  return __cxx_static_address_5e718da5d9a2b675ec1c666c.reference || (__cxx_static_address_5e718da5d9a2b675ec1c666c.reference = {
    __cReference: true,
    get value() { return ACCESSCARD____header_global_20ffd7340e62f4f5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:231
export const BOOTS____header_global_0b36839af9924f45 = ((((((61) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1fbe944502c07f52c4e6a92b() {
  return __cxx_static_address_1fbe944502c07f52c4e6a92b.reference || (__cxx_static_address_1fbe944502c07f52c4e6a92b.reference = {
    __cReference: true,
    get value() { return BOOTS____header_global_0b36839af9924f45; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:232
export const MIRRORBROKE____header_global_a2cb9803c744e54f = ((((((70) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_362cbf74196d6d97bfb79c51() {
  return __cxx_static_address_362cbf74196d6d97bfb79c51.reference || (__cxx_static_address_362cbf74196d6d97bfb79c51.reference = {
    __cReference: true,
    get value() { return MIRRORBROKE____header_global_a2cb9803c744e54f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:233
export const CLOUDYOCEAN____header_global_d6e50728316e571e = ((((((78) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3625d340363cf6e100c50cda() {
  return __cxx_static_address_3625d340363cf6e100c50cda.reference || (__cxx_static_address_3625d340363cf6e100c50cda.reference = {
    __cReference: true,
    get value() { return CLOUDYOCEAN____header_global_d6e50728316e571e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:234
export const CLOUDYSKIES____header_global_c0df79a726f54be0 = ((((((79) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3db75b1c3c60903546221d74() {
  return __cxx_static_address_3db75b1c3c60903546221d74.reference || (__cxx_static_address_3db75b1c3c60903546221d74.reference = {
    __cReference: true,
    get value() { return CLOUDYSKIES____header_global_c0df79a726f54be0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:235
export const MOONSKY1____header_global_3b8fd35cbe5d1a1a = ((((((80) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_75c1f1c5e03211435315265e() {
  return __cxx_static_address_75c1f1c5e03211435315265e.reference || (__cxx_static_address_75c1f1c5e03211435315265e.reference = {
    __cReference: true,
    get value() { return MOONSKY1____header_global_3b8fd35cbe5d1a1a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:236
export const BIGORBIT1____header_global_d0c002dc2430319c = ((((((84) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_17fe1536e42b89e83c251e75() {
  return __cxx_static_address_17fe1536e42b89e83c251e75.reference || (__cxx_static_address_17fe1536e42b89e83c251e75.reference = {
    __cReference: true,
    get value() { return BIGORBIT1____header_global_d0c002dc2430319c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:237
export const LA____header_global_23aa183bda35dfb0 = ((((((89) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dea0722ca314e0e311c3756b() {
  return __cxx_static_address_dea0722ca314e0e311c3756b.reference || (__cxx_static_address_dea0722ca314e0e311c3756b.reference = {
    __cReference: true,
    get value() { return LA____header_global_23aa183bda35dfb0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:238
export const ATOMICHEALTH____header_global_38413d2976a95e83 = ((((((100) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e41178c3c35c0e741a09a48e() {
  return __cxx_static_address_e41178c3c35c0e741a09a48e.reference || (__cxx_static_address_e41178c3c35c0e741a09a48e.reference = {
    __cReference: true,
    get value() { return ATOMICHEALTH____header_global_38413d2976a95e83; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:239
export const TECHLIGHT2____header_global_d793c7d5b23c7775 = ((((((120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4ce8a77fc8a49b4ad54c0253() {
  return __cxx_static_address_4ce8a77fc8a49b4ad54c0253.reference || (__cxx_static_address_4ce8a77fc8a49b4ad54c0253.reference = {
    __cReference: true,
    get value() { return TECHLIGHT2____header_global_d793c7d5b23c7775; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:240
export const TECHLIGHTBUST2____header_global_106fa5f78f7ae252 = ((((((121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_65a8063b390486a2f6bbf6a9() {
  return __cxx_static_address_65a8063b390486a2f6bbf6a9.reference || (__cxx_static_address_65a8063b390486a2f6bbf6a9.reference = {
    __cReference: true,
    get value() { return TECHLIGHTBUST2____header_global_106fa5f78f7ae252; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:241
export const TECHLIGHT4____header_global_5664e7f4ab48050e = ((((((122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7201c1131351b53ed6c2e33e() {
  return __cxx_static_address_7201c1131351b53ed6c2e33e.reference || (__cxx_static_address_7201c1131351b53ed6c2e33e.reference = {
    __cReference: true,
    get value() { return TECHLIGHT4____header_global_5664e7f4ab48050e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:242
export const TECHLIGHTBUST4____header_global_66c900e235a43f9f = ((((((123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_97e80b249ce8bd91a633f3d2() {
  return __cxx_static_address_97e80b249ce8bd91a633f3d2.reference || (__cxx_static_address_97e80b249ce8bd91a633f3d2.reference = {
    __cReference: true,
    get value() { return TECHLIGHTBUST4____header_global_66c900e235a43f9f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:243
export const WALLLIGHT4____header_global_86012415c3ffbdb7 = ((((((124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_131f124331bd20f0470061c5() {
  return __cxx_static_address_131f124331bd20f0470061c5.reference || (__cxx_static_address_131f124331bd20f0470061c5.reference = {
    __cReference: true,
    get value() { return WALLLIGHT4____header_global_86012415c3ffbdb7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:244
export const WALLLIGHTBUST4____header_global_9d7657fb4dddb881 = ((((((125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a5dd7c7de8d19abb2aff23e6() {
  return __cxx_static_address_a5dd7c7de8d19abb2aff23e6.reference || (__cxx_static_address_a5dd7c7de8d19abb2aff23e6.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST4____header_global_9d7657fb4dddb881; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:245
export const ACCESSSWITCH____header_global_6647caddf7517938 = ((((((130) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e7983e2a632401ce428c5a7f() {
  return __cxx_static_address_e7983e2a632401ce428c5a7f.reference || (__cxx_static_address_e7983e2a632401ce428c5a7f.reference = {
    __cReference: true,
    get value() { return ACCESSSWITCH____header_global_6647caddf7517938; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:246
export const SLOTDOOR____header_global_3fcef6dc3a1b5d45 = ((((((132) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9b81f5d9c691010dab17d0c4() {
  return __cxx_static_address_9b81f5d9c691010dab17d0c4.reference || (__cxx_static_address_9b81f5d9c691010dab17d0c4.reference = {
    __cReference: true,
    get value() { return SLOTDOOR____header_global_3fcef6dc3a1b5d45; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:247
export const LIGHTSWITCH____header_global_2cf73345682c7e84 = ((((((134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d2ecafbcc648e9f2fcefee06() {
  return __cxx_static_address_d2ecafbcc648e9f2fcefee06.reference || (__cxx_static_address_d2ecafbcc648e9f2fcefee06.reference = {
    __cReference: true,
    get value() { return LIGHTSWITCH____header_global_2cf73345682c7e84; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:248
export const SPACEDOORSWITCH____header_global_6ff3ad8580f7e483 = ((((((136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7e7583166e9a7b39fa32bce6() {
  return __cxx_static_address_7e7583166e9a7b39fa32bce6.reference || (__cxx_static_address_7e7583166e9a7b39fa32bce6.reference = {
    __cReference: true,
    get value() { return SPACEDOORSWITCH____header_global_6ff3ad8580f7e483; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:249
export const SPACELIGHTSWITCH____header_global_b02259c389f86c80 = ((((((138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6d0bc01a6f367a56883effde() {
  return __cxx_static_address_6d0bc01a6f367a56883effde.reference || (__cxx_static_address_6d0bc01a6f367a56883effde.reference = {
    __cReference: true,
    get value() { return SPACELIGHTSWITCH____header_global_b02259c389f86c80; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:250
export const FRANKENSTINESWITCH____header_global_85da26ba6e3aa239 = ((((((140) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ba8f1f85e2450e2e956ccc56() {
  return __cxx_static_address_ba8f1f85e2450e2e956ccc56.reference || (__cxx_static_address_ba8f1f85e2450e2e956ccc56.reference = {
    __cReference: true,
    get value() { return FRANKENSTINESWITCH____header_global_85da26ba6e3aa239; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:251
export const NUKEBUTTON____header_global_60aa1239cf7da0d4 = ((((((142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9ba26263891b53197ced3147() {
  return __cxx_static_address_9ba26263891b53197ced3147.reference || (__cxx_static_address_9ba26263891b53197ced3147.reference = {
    __cReference: true,
    get value() { return NUKEBUTTON____header_global_60aa1239cf7da0d4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:252
export const MULTISWITCH____header_global_0dfb516a132f5c43 = ((((((146) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d91794ea869737329902fd6e() {
  return __cxx_static_address_d91794ea869737329902fd6e.reference || (__cxx_static_address_d91794ea869737329902fd6e.reference = {
    __cReference: true,
    get value() { return MULTISWITCH____header_global_0dfb516a132f5c43; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:253
export const DOORTILE5____header_global_97ccfec384883d40 = ((((((150) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1528a88f3fb0e4e35b91be6b() {
  return __cxx_static_address_1528a88f3fb0e4e35b91be6b.reference || (__cxx_static_address_1528a88f3fb0e4e35b91be6b.reference = {
    __cReference: true,
    get value() { return DOORTILE5____header_global_97ccfec384883d40; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:254
export const DOORTILE6____header_global_1424a2c58e6b9eaf = ((((((151) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e9a9af80672b2d4065441c9f() {
  return __cxx_static_address_e9a9af80672b2d4065441c9f.reference || (__cxx_static_address_e9a9af80672b2d4065441c9f.reference = {
    __cReference: true,
    get value() { return DOORTILE6____header_global_1424a2c58e6b9eaf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:255
export const DOORTILE1____header_global_9c6dfd7dd892475e = ((((((152) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d39da3e08f9636995ba631a7() {
  return __cxx_static_address_d39da3e08f9636995ba631a7.reference || (__cxx_static_address_d39da3e08f9636995ba631a7.reference = {
    __cReference: true,
    get value() { return DOORTILE1____header_global_9c6dfd7dd892475e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:256
export const DOORTILE2____header_global_ff6e8c215b2ca3a7 = ((((((153) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0e3052220920782ba8ac237c() {
  return __cxx_static_address_0e3052220920782ba8ac237c.reference || (__cxx_static_address_0e3052220920782ba8ac237c.reference = {
    __cReference: true,
    get value() { return DOORTILE2____header_global_ff6e8c215b2ca3a7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:257
export const DOORTILE3____header_global_4ae7f78012aef2e7 = ((((((154) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_80eac65f355a593dd5cdbbd1() {
  return __cxx_static_address_80eac65f355a593dd5cdbbd1.reference || (__cxx_static_address_80eac65f355a593dd5cdbbd1.reference = {
    __cReference: true,
    get value() { return DOORTILE3____header_global_4ae7f78012aef2e7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:258
export const DOORTILE4____header_global_5a865372b54837d4 = ((((((155) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e5877b45908d0e4433deeafd() {
  return __cxx_static_address_e5877b45908d0e4433deeafd.reference || (__cxx_static_address_e5877b45908d0e4433deeafd.reference = {
    __cReference: true,
    get value() { return DOORTILE4____header_global_5a865372b54837d4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:259
export const DOORTILE7____header_global_39b26dbf3105d0b2 = ((((((156) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2799c26e9a761611a00a03fc() {
  return __cxx_static_address_2799c26e9a761611a00a03fc.reference || (__cxx_static_address_2799c26e9a761611a00a03fc.reference = {
    __cReference: true,
    get value() { return DOORTILE7____header_global_39b26dbf3105d0b2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:260
export const DOORTILE8____header_global_23d618928841fc2c = ((((((157) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3068b7dc6bddc60e3dd3a39b() {
  return __cxx_static_address_3068b7dc6bddc60e3dd3a39b.reference || (__cxx_static_address_3068b7dc6bddc60e3dd3a39b.reference = {
    __cReference: true,
    get value() { return DOORTILE8____header_global_23d618928841fc2c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:261
export const DOORTILE9____header_global_5ff312e06dbff172 = ((((((158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_781f1f7d4f146e51bbb26918() {
  return __cxx_static_address_781f1f7d4f146e51bbb26918.reference || (__cxx_static_address_781f1f7d4f146e51bbb26918.reference = {
    __cReference: true,
    get value() { return DOORTILE9____header_global_5ff312e06dbff172; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:262
export const DOORTILE10____header_global_3c22cab168574b32 = ((((((159) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b82666060f4428e509c9b968() {
  return __cxx_static_address_b82666060f4428e509c9b968.reference || (__cxx_static_address_b82666060f4428e509c9b968.reference = {
    __cReference: true,
    get value() { return DOORTILE10____header_global_3c22cab168574b32; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:263
export const DOORSHOCK____header_global_176cb6cebf4bdc89 = ((((((160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_215a95ad29b0c49df13ce2ec() {
  return __cxx_static_address_215a95ad29b0c49df13ce2ec.reference || (__cxx_static_address_215a95ad29b0c49df13ce2ec.reference = {
    __cReference: true,
    get value() { return DOORSHOCK____header_global_176cb6cebf4bdc89; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:264
export const DIPSWITCH____header_global_5ac3083fa563e513 = ((((((162) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_275522cad65a754afee6fb0d() {
  return __cxx_static_address_275522cad65a754afee6fb0d.reference || (__cxx_static_address_275522cad65a754afee6fb0d.reference = {
    __cReference: true,
    get value() { return DIPSWITCH____header_global_5ac3083fa563e513; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:265
export const DIPSWITCH2____header_global_ef84826794ff175d = ((((((164) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_656910722ac5deeefd9e0255() {
  return __cxx_static_address_656910722ac5deeefd9e0255.reference || (__cxx_static_address_656910722ac5deeefd9e0255.reference = {
    __cReference: true,
    get value() { return DIPSWITCH2____header_global_ef84826794ff175d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:266
export const TECHSWITCH____header_global_a3cb3006c19884b7 = ((((((166) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9ceae95f6361cdeb50fddbc3() {
  return __cxx_static_address_9ceae95f6361cdeb50fddbc3.reference || (__cxx_static_address_9ceae95f6361cdeb50fddbc3.reference = {
    __cReference: true,
    get value() { return TECHSWITCH____header_global_a3cb3006c19884b7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:267
export const DIPSWITCH3____header_global_53f41253104f9641 = ((((((168) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3192f8bac9ab2e959a9fbf26() {
  return __cxx_static_address_3192f8bac9ab2e959a9fbf26.reference || (__cxx_static_address_3192f8bac9ab2e959a9fbf26.reference = {
    __cReference: true,
    get value() { return DIPSWITCH3____header_global_53f41253104f9641; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:268
export const ACCESSSWITCH2____header_global_4a7ec4fcac75f0d5 = ((((((170) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_81de0a6f19b49299ba46e007() {
  return __cxx_static_address_81de0a6f19b49299ba46e007.reference || (__cxx_static_address_81de0a6f19b49299ba46e007.reference = {
    __cReference: true,
    get value() { return ACCESSSWITCH2____header_global_4a7ec4fcac75f0d5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:269
export const FLOORSLIME____header_global_bf866516f98b1834 = ((((((200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e9ded1ef1f508aa09c584684() {
  return __cxx_static_address_e9ded1ef1f508aa09c584684.reference || (__cxx_static_address_e9ded1ef1f508aa09c584684.reference = {
    __cReference: true,
    get value() { return FLOORSLIME____header_global_bf866516f98b1834; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:270
export const BIGFORCE____header_global_c178aebd25a4e4e9 = ((((((230) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3defeb0afb36916282cc2a2a() {
  return __cxx_static_address_3defeb0afb36916282cc2a2a.reference || (__cxx_static_address_3defeb0afb36916282cc2a2a.reference = {
    __cReference: true,
    get value() { return BIGFORCE____header_global_c178aebd25a4e4e9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:271
export const MASKWALL9____header_global_566260c0cb4d7d3e = ((((((255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3ef0908a1ec26bc6df9fa931() {
  return __cxx_static_address_3ef0908a1ec26bc6df9fa931.reference || (__cxx_static_address_3ef0908a1ec26bc6df9fa931.reference = {
    __cReference: true,
    get value() { return MASKWALL9____header_global_566260c0cb4d7d3e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:272
export const SCREENBREAK1____header_global_ca18d5e2bc594d9d = ((((((263) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a46732c0aced9d2ff32519f9() {
  return __cxx_static_address_a46732c0aced9d2ff32519f9.reference || (__cxx_static_address_a46732c0aced9d2ff32519f9.reference = {
    __cReference: true,
    get value() { return SCREENBREAK1____header_global_ca18d5e2bc594d9d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:273
export const SCREENBREAK2____header_global_4a732e7d33042467 = ((((((264) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e335158735e4f95675ad7ecf() {
  return __cxx_static_address_e335158735e4f95675ad7ecf.reference || (__cxx_static_address_e335158735e4f95675ad7ecf.reference = {
    __cReference: true,
    get value() { return SCREENBREAK2____header_global_4a732e7d33042467; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:274
export const SCREENBREAK3____header_global_7f978e10e23751db = ((((((265) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6791bbb7366d0be752e60532() {
  return __cxx_static_address_6791bbb7366d0be752e60532.reference || (__cxx_static_address_6791bbb7366d0be752e60532.reference = {
    __cReference: true,
    get value() { return SCREENBREAK3____header_global_7f978e10e23751db; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:275
export const SCREENBREAK4____header_global_7b983f98cbaa1e72 = ((((((266) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dac8bfa7c11fc4d7869eced3() {
  return __cxx_static_address_dac8bfa7c11fc4d7869eced3.reference || (__cxx_static_address_dac8bfa7c11fc4d7869eced3.reference = {
    __cReference: true,
    get value() { return SCREENBREAK4____header_global_7b983f98cbaa1e72; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:276
export const SCREENBREAK5____header_global_a2dd3bb94ffa95ae = ((((((267) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9cf45cdeff5150fa3a5e9af7() {
  return __cxx_static_address_9cf45cdeff5150fa3a5e9af7.reference || (__cxx_static_address_9cf45cdeff5150fa3a5e9af7.reference = {
    __cReference: true,
    get value() { return SCREENBREAK5____header_global_a2dd3bb94ffa95ae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:277
export const SCREENBREAK6____header_global_b64fe12639b23a3e = ((((((268) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f5276842d0402cffaa89e2dc() {
  return __cxx_static_address_f5276842d0402cffaa89e2dc.reference || (__cxx_static_address_f5276842d0402cffaa89e2dc.reference = {
    __cReference: true,
    get value() { return SCREENBREAK6____header_global_b64fe12639b23a3e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:278
export const SCREENBREAK7____header_global_6c857aacbf50adb6 = ((((((269) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4cf3e730979800f6b93ce733() {
  return __cxx_static_address_4cf3e730979800f6b93ce733.reference || (__cxx_static_address_4cf3e730979800f6b93ce733.reference = {
    __cReference: true,
    get value() { return SCREENBREAK7____header_global_6c857aacbf50adb6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:279
export const SCREENBREAK8____header_global_1f2b3487e0616d21 = ((((((270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_38614d2763a3434e23ab0068() {
  return __cxx_static_address_38614d2763a3434e23ab0068.reference || (__cxx_static_address_38614d2763a3434e23ab0068.reference = {
    __cReference: true,
    get value() { return SCREENBREAK8____header_global_1f2b3487e0616d21; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:280
export const SCREENBREAK9____header_global_eb345999a84cb5b1 = ((((((271) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a18720e784ed93c346186bf4() {
  return __cxx_static_address_a18720e784ed93c346186bf4.reference || (__cxx_static_address_a18720e784ed93c346186bf4.reference = {
    __cReference: true,
    get value() { return SCREENBREAK9____header_global_eb345999a84cb5b1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:281
export const SCREENBREAK10____header_global_8ae6ac99d4504b36 = ((((((272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dae38aedf9496cacb4409a65() {
  return __cxx_static_address_dae38aedf9496cacb4409a65.reference || (__cxx_static_address_dae38aedf9496cacb4409a65.reference = {
    __cReference: true,
    get value() { return SCREENBREAK10____header_global_8ae6ac99d4504b36; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:282
export const SCREENBREAK11____header_global_e9265b222663d3bc = ((((((273) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_95026bb17bbaa8b0d71ed78c() {
  return __cxx_static_address_95026bb17bbaa8b0d71ed78c.reference || (__cxx_static_address_95026bb17bbaa8b0d71ed78c.reference = {
    __cReference: true,
    get value() { return SCREENBREAK11____header_global_e9265b222663d3bc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:283
export const SCREENBREAK12____header_global_984512d764f60201 = ((((((274) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3247dca077b9fb7ee4d48548() {
  return __cxx_static_address_3247dca077b9fb7ee4d48548.reference || (__cxx_static_address_3247dca077b9fb7ee4d48548.reference = {
    __cReference: true,
    get value() { return SCREENBREAK12____header_global_984512d764f60201; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:284
export const SCREENBREAK13____header_global_e4fbb7208ccb2b9c = ((((((275) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9e9ac8cc0690d937cfa77f1b() {
  return __cxx_static_address_9e9ac8cc0690d937cfa77f1b.reference || (__cxx_static_address_9e9ac8cc0690d937cfa77f1b.reference = {
    __cReference: true,
    get value() { return SCREENBREAK13____header_global_e4fbb7208ccb2b9c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:285
export const MASKWALL1____header_global_01180e965dfe514e = ((((((285) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4cabe3a666dc28e9eee525de() {
  return __cxx_static_address_4cabe3a666dc28e9eee525de.reference || (__cxx_static_address_4cabe3a666dc28e9eee525de.reference = {
    __cReference: true,
    get value() { return MASKWALL1____header_global_01180e965dfe514e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:286
export const W_TECHWALL1____header_global_b455f774a8f86e4f = ((((((293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5ed6a37d344324400c95d92c() {
  return __cxx_static_address_5ed6a37d344324400c95d92c.reference || (__cxx_static_address_5ed6a37d344324400c95d92c.reference = {
    __cReference: true,
    get value() { return W_TECHWALL1____header_global_b455f774a8f86e4f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:287
export const W_TECHWALL2____header_global_f3e58a9272a73e17 = ((((((297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0cfb3eaf6b91e9751f61d107() {
  return __cxx_static_address_0cfb3eaf6b91e9751f61d107.reference || (__cxx_static_address_0cfb3eaf6b91e9751f61d107.reference = {
    __cReference: true,
    get value() { return W_TECHWALL2____header_global_f3e58a9272a73e17; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:288
export const W_TECHWALL15____header_global_eb2ee3fc097ee013 = ((((((299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2f66bc3da4acdc9b89c06940() {
  return __cxx_static_address_2f66bc3da4acdc9b89c06940.reference || (__cxx_static_address_2f66bc3da4acdc9b89c06940.reference = {
    __cReference: true,
    get value() { return W_TECHWALL15____header_global_eb2ee3fc097ee013; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:289
export const W_TECHWALL3____header_global_7082b549dde6fe1a = ((((((301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f9a6fa6d621f89f33c41c75e() {
  return __cxx_static_address_f9a6fa6d621f89f33c41c75e.reference || (__cxx_static_address_f9a6fa6d621f89f33c41c75e.reference = {
    __cReference: true,
    get value() { return W_TECHWALL3____header_global_7082b549dde6fe1a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:290
export const W_TECHWALL4____header_global_e9d1d50338ae6d75 = ((((((305) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_78b74211212f4931f3f97f9f() {
  return __cxx_static_address_78b74211212f4931f3f97f9f.reference || (__cxx_static_address_78b74211212f4931f3f97f9f.reference = {
    __cReference: true,
    get value() { return W_TECHWALL4____header_global_e9d1d50338ae6d75; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:291
export const W_TECHWALL10____header_global_af00c16800e2e036 = ((((((306) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2d9541a7b39f7912f0fa844e() {
  return __cxx_static_address_2d9541a7b39f7912f0fa844e.reference || (__cxx_static_address_2d9541a7b39f7912f0fa844e.reference = {
    __cReference: true,
    get value() { return W_TECHWALL10____header_global_af00c16800e2e036; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:292
export const W_TECHWALL16____header_global_b745f9f13425a3ad = ((((((307) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2586ee51fb0acc14718db0f7() {
  return __cxx_static_address_2586ee51fb0acc14718db0f7.reference || (__cxx_static_address_2586ee51fb0acc14718db0f7.reference = {
    __cReference: true,
    get value() { return W_TECHWALL16____header_global_b745f9f13425a3ad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:293
export const WATERTILE2____header_global_d5d6f254a846cffc = ((((((336) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f5c1c0b90070c3b5981d130e() {
  return __cxx_static_address_f5c1c0b90070c3b5981d130e.reference || (__cxx_static_address_f5c1c0b90070c3b5981d130e.reference = {
    __cReference: true,
    get value() { return WATERTILE2____header_global_d5d6f254a846cffc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:294
export const BPANNEL1____header_global_991b5804cf021547 = ((((((341) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_19812dbe0eba55e3ee0ba0be() {
  return __cxx_static_address_19812dbe0eba55e3ee0ba0be.reference || (__cxx_static_address_19812dbe0eba55e3ee0ba0be.reference = {
    __cReference: true,
    get value() { return BPANNEL1____header_global_991b5804cf021547; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:295
export const PANNEL1____header_global_ac5a2d1253e01b7e = ((((((342) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4328155c65353c1921fd1bc4() {
  return __cxx_static_address_4328155c65353c1921fd1bc4.reference || (__cxx_static_address_4328155c65353c1921fd1bc4.reference = {
    __cReference: true,
    get value() { return PANNEL1____header_global_ac5a2d1253e01b7e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:296
export const PANNEL2____header_global_2e1c0e58fe42e489 = ((((((343) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_835d78361ecf28aab6972bbf() {
  return __cxx_static_address_835d78361ecf28aab6972bbf.reference || (__cxx_static_address_835d78361ecf28aab6972bbf.reference = {
    __cReference: true,
    get value() { return PANNEL2____header_global_2e1c0e58fe42e489; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:297
export const STATIC____header_global_5a76efe127a64447 = ((((((351) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_73d119860b1b1c8aae3cda7d() {
  return __cxx_static_address_73d119860b1b1c8aae3cda7d.reference || (__cxx_static_address_73d119860b1b1c8aae3cda7d.reference = {
    __cReference: true,
    get value() { return STATIC____header_global_5a76efe127a64447; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:298
export const W_SCREENBREAK____header_global_4d0a1fe5643f4a53 = ((((((357) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cc2fe1d27601abf1f3bd9e2e() {
  return __cxx_static_address_cc2fe1d27601abf1f3bd9e2e.reference || (__cxx_static_address_cc2fe1d27601abf1f3bd9e2e.reference = {
    __cReference: true,
    get value() { return W_SCREENBREAK____header_global_4d0a1fe5643f4a53; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:299
export const W_HITTECHWALL3____header_global_ec4eb4dc8438e3a4 = ((((((360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_208c0a28d100fc3bc0d2e267() {
  return __cxx_static_address_208c0a28d100fc3bc0d2e267.reference || (__cxx_static_address_208c0a28d100fc3bc0d2e267.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL3____header_global_ec4eb4dc8438e3a4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:300
export const W_HITTECHWALL4____header_global_f6a4b6bc478f8952 = ((((((361) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9136a3a00c2580805718ffaa() {
  return __cxx_static_address_9136a3a00c2580805718ffaa.reference || (__cxx_static_address_9136a3a00c2580805718ffaa.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL4____header_global_f6a4b6bc478f8952; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:301
export const W_HITTECHWALL2____header_global_5ee889403ef53dc6 = ((((((362) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e57af3513627fbd78aaab771() {
  return __cxx_static_address_e57af3513627fbd78aaab771.reference || (__cxx_static_address_e57af3513627fbd78aaab771.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL2____header_global_5ee889403ef53dc6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:302
export const W_HITTECHWALL1____header_global_daa0eeb96ac8a657 = ((((((363) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_617c0c6dadb22a8cb51fa2a6() {
  return __cxx_static_address_617c0c6dadb22a8cb51fa2a6.reference || (__cxx_static_address_617c0c6dadb22a8cb51fa2a6.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL1____header_global_daa0eeb96ac8a657; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:303
export const MASKWALL10____header_global_8c96155ff55ca7d7 = ((((((387) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7921e6398b27a60e3873477e() {
  return __cxx_static_address_7921e6398b27a60e3873477e.reference || (__cxx_static_address_7921e6398b27a60e3873477e.reference = {
    __cReference: true,
    get value() { return MASKWALL10____header_global_8c96155ff55ca7d7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:304
export const MASKWALL11____header_global_75c9a49a7aade318 = ((((((391) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c658ddbe25d7a1c6580beb97() {
  return __cxx_static_address_c658ddbe25d7a1c6580beb97.reference || (__cxx_static_address_c658ddbe25d7a1c6580beb97.reference = {
    __cReference: true,
    get value() { return MASKWALL11____header_global_75c9a49a7aade318; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:305
export const DOORTILE22____header_global_c03a433cceb4061e = ((((((395) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_66b0ca4a77ccf3ee0b331482() {
  return __cxx_static_address_66b0ca4a77ccf3ee0b331482.reference || (__cxx_static_address_66b0ca4a77ccf3ee0b331482.reference = {
    __cReference: true,
    get value() { return DOORTILE22____header_global_c03a433cceb4061e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:306
export const FANSPRITE____header_global_2b544c706486d57e = ((((((407) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6610877ed1e00b4e6af56859() {
  return __cxx_static_address_6610877ed1e00b4e6af56859.reference || (__cxx_static_address_6610877ed1e00b4e6af56859.reference = {
    __cReference: true,
    get value() { return FANSPRITE____header_global_2b544c706486d57e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:307
export const FANSPRITEBROKE____header_global_2d19553176e12aac = ((((((411) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e35243e9e14c75622be10e15() {
  return __cxx_static_address_e35243e9e14c75622be10e15.reference || (__cxx_static_address_e35243e9e14c75622be10e15.reference = {
    __cReference: true,
    get value() { return FANSPRITEBROKE____header_global_2d19553176e12aac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:308
export const FANSHADOW____header_global_0105af172804cd07 = ((((((412) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9e9c26092a9d81303048464a() {
  return __cxx_static_address_9e9c26092a9d81303048464a.reference || (__cxx_static_address_9e9c26092a9d81303048464a.reference = {
    __cReference: true,
    get value() { return FANSHADOW____header_global_0105af172804cd07; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:309
export const FANSHADOWBROKE____header_global_ebae9f75421af759 = ((((((416) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_41cb3973211681873c00cad5() {
  return __cxx_static_address_41cb3973211681873c00cad5.reference || (__cxx_static_address_41cb3973211681873c00cad5.reference = {
    __cReference: true,
    get value() { return FANSHADOWBROKE____header_global_ebae9f75421af759; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:310
export const DOORTILE18____header_global_60db3f654b99ceac = ((((((447) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_696dd185f2f0d8f1d90fdb18() {
  return __cxx_static_address_696dd185f2f0d8f1d90fdb18.reference || (__cxx_static_address_696dd185f2f0d8f1d90fdb18.reference = {
    __cReference: true,
    get value() { return DOORTILE18____header_global_60db3f654b99ceac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:311
export const DOORTILE19____header_global_06890c05c9357176 = ((((((448) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_94fa140afef93a8c5b02c345() {
  return __cxx_static_address_94fa140afef93a8c5b02c345.reference || (__cxx_static_address_94fa140afef93a8c5b02c345.reference = {
    __cReference: true,
    get value() { return DOORTILE19____header_global_06890c05c9357176; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:312
export const DOORTILE20____header_global_112f42a43493610c = ((((((449) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_18b281ae1993ecf6eca9ba68() {
  return __cxx_static_address_18b281ae1993ecf6eca9ba68.reference || (__cxx_static_address_18b281ae1993ecf6eca9ba68.reference = {
    __cReference: true,
    get value() { return DOORTILE20____header_global_112f42a43493610c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:313
export const VIEWSCREEN2____header_global_c3a36def8f4d4558 = ((((((499) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7b51ef4b00cb2c596dae811a() {
  return __cxx_static_address_7b51ef4b00cb2c596dae811a.reference || (__cxx_static_address_7b51ef4b00cb2c596dae811a.reference = {
    __cReference: true,
    get value() { return VIEWSCREEN2____header_global_c3a36def8f4d4558; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:314
export const VIEWSCREEN____header_global_e4d8a6af7e40ddf9 = ((((((502) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a31d537c990186fe617161e4() {
  return __cxx_static_address_a31d537c990186fe617161e4.reference || (__cxx_static_address_a31d537c990186fe617161e4.reference = {
    __cReference: true,
    get value() { return VIEWSCREEN____header_global_e4d8a6af7e40ddf9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:315
export const GLASS____header_global_13492283cc5d2c04 = ((((((503) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3c2d960f7ccdc775086075ec() {
  return __cxx_static_address_3c2d960f7ccdc775086075ec.reference || (__cxx_static_address_3c2d960f7ccdc775086075ec.reference = {
    __cReference: true,
    get value() { return GLASS____header_global_13492283cc5d2c04; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:316
export const GLASS2____header_global_685ed5a65633b45f = ((((((504) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_27bc903afbc82717f6716425() {
  return __cxx_static_address_27bc903afbc82717f6716425.reference || (__cxx_static_address_27bc903afbc82717f6716425.reference = {
    __cReference: true,
    get value() { return GLASS2____header_global_685ed5a65633b45f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:317
export const STAINGLASS1____header_global_4e51185668bbd2f1 = ((((((510) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e3e30ec6c350b08f83442331() {
  return __cxx_static_address_e3e30ec6c350b08f83442331.reference || (__cxx_static_address_e3e30ec6c350b08f83442331.reference = {
    __cReference: true,
    get value() { return STAINGLASS1____header_global_4e51185668bbd2f1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:318
export const MASKWALL5____header_global_2c151beaa502b60d = ((((((514) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f61efb7d82c49bbbe2b261b8() {
  return __cxx_static_address_f61efb7d82c49bbbe2b261b8.reference || (__cxx_static_address_f61efb7d82c49bbbe2b261b8.reference = {
    __cReference: true,
    get value() { return MASKWALL5____header_global_2c151beaa502b60d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:319
export const SATELITE____header_global_f9c11115a996ade0 = ((((((516) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2ffb2d4124b3ea2337c585b3() {
  return __cxx_static_address_2ffb2d4124b3ea2337c585b3.reference || (__cxx_static_address_2ffb2d4124b3ea2337c585b3.reference = {
    __cReference: true,
    get value() { return SATELITE____header_global_f9c11115a996ade0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:320
export const FUELPOD____header_global_6dbf471168fdb24d = ((((((517) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_17d4e1167ec071f5859372f2() {
  return __cxx_static_address_17d4e1167ec071f5859372f2.reference || (__cxx_static_address_17d4e1167ec071f5859372f2.reference = {
    __cReference: true,
    get value() { return FUELPOD____header_global_6dbf471168fdb24d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:321
export const CRACK1____header_global_a0c5852a3e5ad94f = ((((((546) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5ae03e10ca6db5c5abd5285a() {
  return __cxx_static_address_5ae03e10ca6db5c5abd5285a.reference || (__cxx_static_address_5ae03e10ca6db5c5abd5285a.reference = {
    __cReference: true,
    get value() { return CRACK1____header_global_a0c5852a3e5ad94f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:322
export const CRACK2____header_global_9c77467cda21d3cb = ((((((547) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_49ebab8b5942a2be76fafac3() {
  return __cxx_static_address_49ebab8b5942a2be76fafac3.reference || (__cxx_static_address_49ebab8b5942a2be76fafac3.reference = {
    __cReference: true,
    get value() { return CRACK2____header_global_9c77467cda21d3cb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:323
export const CRACK3____header_global_c42646b501841b05 = ((((((548) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e2dfd5c9fb1a958abe567698() {
  return __cxx_static_address_e2dfd5c9fb1a958abe567698.reference || (__cxx_static_address_e2dfd5c9fb1a958abe567698.reference = {
    __cReference: true,
    get value() { return CRACK3____header_global_c42646b501841b05; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:324
export const CRACK4____header_global_310ccdf531c63310 = ((((((549) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c22acbc1f53c15223beebc8d() {
  return __cxx_static_address_c22acbc1f53c15223beebc8d.reference || (__cxx_static_address_c22acbc1f53c15223beebc8d.reference = {
    __cReference: true,
    get value() { return CRACK4____header_global_310ccdf531c63310; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:325
export const FOOTPRINTS____header_global_ba90538c6d9e7625 = ((((((550) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2f876da72ece73f205105485() {
  return __cxx_static_address_2f876da72ece73f205105485.reference || (__cxx_static_address_2f876da72ece73f205105485.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS____header_global_ba90538c6d9e7625; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:326
export const DOMELITE____header_global_4f672f97ae603eb4 = ((((((551) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0484e3e0d77c5dec1658d25b() {
  return __cxx_static_address_0484e3e0d77c5dec1658d25b.reference || (__cxx_static_address_0484e3e0d77c5dec1658d25b.reference = {
    __cReference: true,
    get value() { return DOMELITE____header_global_4f672f97ae603eb4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:327
export const CAMERAPOLE____header_global_d117ebd3d457fe3d = ((((((554) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0c27fc982c1e4b9cb0e63d28() {
  return __cxx_static_address_0c27fc982c1e4b9cb0e63d28.reference || (__cxx_static_address_0c27fc982c1e4b9cb0e63d28.reference = {
    __cReference: true,
    get value() { return CAMERAPOLE____header_global_d117ebd3d457fe3d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:328
export const CHAIR1____header_global_653b9e5a45b13677 = ((((((556) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bf94b4f83d042b3704e609e5() {
  return __cxx_static_address_bf94b4f83d042b3704e609e5.reference || (__cxx_static_address_bf94b4f83d042b3704e609e5.reference = {
    __cReference: true,
    get value() { return CHAIR1____header_global_653b9e5a45b13677; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:329
export const CHAIR2____header_global_87ccab0b76a212c3 = ((((((557) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_df26a9c9661a4ae8d48ed4fe() {
  return __cxx_static_address_df26a9c9661a4ae8d48ed4fe.reference || (__cxx_static_address_df26a9c9661a4ae8d48ed4fe.reference = {
    __cReference: true,
    get value() { return CHAIR2____header_global_87ccab0b76a212c3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:330
export const BROKENCHAIR____header_global_8c550ecfacf91178 = ((((((559) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6e7aa4a53f91e6d0825d3fb8() {
  return __cxx_static_address_6e7aa4a53f91e6d0825d3fb8.reference || (__cxx_static_address_6e7aa4a53f91e6d0825d3fb8.reference = {
    __cReference: true,
    get value() { return BROKENCHAIR____header_global_8c550ecfacf91178; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:331
export const MIRROR____header_global_df5694554199eb5a = ((((((560) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0f37bd0c51392f806789d477() {
  return __cxx_static_address_0f37bd0c51392f806789d477.reference || (__cxx_static_address_0f37bd0c51392f806789d477.reference = {
    __cReference: true,
    get value() { return MIRROR____header_global_df5694554199eb5a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:332
export const WATERFOUNTAIN____header_global_4cf6b45ef79128ae = ((((((563) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_48e4f6cb3fbfc96ffbfef157() {
  return __cxx_static_address_48e4f6cb3fbfc96ffbfef157.reference || (__cxx_static_address_48e4f6cb3fbfc96ffbfef157.reference = {
    __cReference: true,
    get value() { return WATERFOUNTAIN____header_global_4cf6b45ef79128ae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:333
export const WATERFOUNTAINBROKE____header_global_e5d28d41b389f392 = ((((((567) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5b80c078928926e256dd9cc6() {
  return __cxx_static_address_5b80c078928926e256dd9cc6.reference || (__cxx_static_address_5b80c078928926e256dd9cc6.reference = {
    __cReference: true,
    get value() { return WATERFOUNTAINBROKE____header_global_e5d28d41b389f392; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:334
export const FEMMAG1____header_global_62322034d62f17dd = ((((((568) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6a6cfe3286927b5617c59d60() {
  return __cxx_static_address_6a6cfe3286927b5617c59d60.reference || (__cxx_static_address_6a6cfe3286927b5617c59d60.reference = {
    __cReference: true,
    get value() { return FEMMAG1____header_global_62322034d62f17dd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:335
export const TOILET____header_global_e85d9129a2271bd5 = ((((((569) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ee8c3f53e0bb5da3cde984c1() {
  return __cxx_static_address_ee8c3f53e0bb5da3cde984c1.reference || (__cxx_static_address_ee8c3f53e0bb5da3cde984c1.reference = {
    __cReference: true,
    get value() { return TOILET____header_global_e85d9129a2271bd5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:336
export const STALL____header_global_f1f2b5a5d2b11bb5 = ((((((571) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c03e5c46e91814a136215ad9() {
  return __cxx_static_address_c03e5c46e91814a136215ad9.reference || (__cxx_static_address_c03e5c46e91814a136215ad9.reference = {
    __cReference: true,
    get value() { return STALL____header_global_f1f2b5a5d2b11bb5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:337
export const STALLBROKE____header_global_d2cc549d41da1523 = ((((((573) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_73652bb17fa211ded8512bbd() {
  return __cxx_static_address_73652bb17fa211ded8512bbd.reference || (__cxx_static_address_73652bb17fa211ded8512bbd.reference = {
    __cReference: true,
    get value() { return STALLBROKE____header_global_d2cc549d41da1523; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:338
export const FEMMAG2____header_global_5c35ea992211fd1b = ((((((577) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a5e04d5ba2ff6cbeee89d7b1() {
  return __cxx_static_address_a5e04d5ba2ff6cbeee89d7b1.reference || (__cxx_static_address_a5e04d5ba2ff6cbeee89d7b1.reference = {
    __cReference: true,
    get value() { return FEMMAG2____header_global_5c35ea992211fd1b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:339
export const REACTOR2____header_global_5aaedea2bede4a43 = ((((((578) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_62e18b637177993fd5240219() {
  return __cxx_static_address_62e18b637177993fd5240219.reference || (__cxx_static_address_62e18b637177993fd5240219.reference = {
    __cReference: true,
    get value() { return REACTOR2____header_global_5aaedea2bede4a43; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:340
export const REACTOR2BURNT____header_global_ffd177c48934155f = ((((((579) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dcd3c64ae6871e2629d920dc() {
  return __cxx_static_address_dcd3c64ae6871e2629d920dc.reference || (__cxx_static_address_dcd3c64ae6871e2629d920dc.reference = {
    __cReference: true,
    get value() { return REACTOR2BURNT____header_global_ffd177c48934155f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:341
export const REACTOR2SPARK____header_global_3b5c5cc64fefad77 = ((((((580) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5ea58a2319fcdeeaf19ea50f() {
  return __cxx_static_address_5ea58a2319fcdeeaf19ea50f.reference || (__cxx_static_address_5ea58a2319fcdeeaf19ea50f.reference = {
    __cReference: true,
    get value() { return REACTOR2SPARK____header_global_3b5c5cc64fefad77; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:342
export const GRATE1____header_global_ce7081dfe5f133dc = ((((((595) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_25a8c9e18c57a0f8684c4022() {
  return __cxx_static_address_25a8c9e18c57a0f8684c4022.reference || (__cxx_static_address_25a8c9e18c57a0f8684c4022.reference = {
    __cReference: true,
    get value() { return GRATE1____header_global_ce7081dfe5f133dc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:343
export const BGRATE1____header_global_89181dc369576931 = ((((((596) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_628c804f8985edf3954e9c18() {
  return __cxx_static_address_628c804f8985edf3954e9c18.reference || (__cxx_static_address_628c804f8985edf3954e9c18.reference = {
    __cReference: true,
    get value() { return BGRATE1____header_global_89181dc369576931; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:344
export const SOLARPANNEL____header_global_e597d9cbd914f8a9 = ((((((602) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fbd5ffc816003734e5623d40() {
  return __cxx_static_address_fbd5ffc816003734e5623d40.reference || (__cxx_static_address_fbd5ffc816003734e5623d40.reference = {
    __cReference: true,
    get value() { return SOLARPANNEL____header_global_e597d9cbd914f8a9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:345
export const NAKED1____header_global_313d1961f42aa0c0 = ((((((603) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8e1d1141315b14ee85494d1b() {
  return __cxx_static_address_8e1d1141315b14ee85494d1b.reference || (__cxx_static_address_8e1d1141315b14ee85494d1b.reference = {
    __cReference: true,
    get value() { return NAKED1____header_global_313d1961f42aa0c0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:346
export const ANTENNA____header_global_4a82337fc5fbf34c = ((((((607) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e0700947f249e95b74f41152() {
  return __cxx_static_address_e0700947f249e95b74f41152.reference || (__cxx_static_address_e0700947f249e95b74f41152.reference = {
    __cReference: true,
    get value() { return ANTENNA____header_global_4a82337fc5fbf34c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:347
export const MASKWALL12____header_global_8923a49a28ce0ee1 = ((((((609) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_51a8426bbcbca440500d298a() {
  return __cxx_static_address_51a8426bbcbca440500d298a.reference || (__cxx_static_address_51a8426bbcbca440500d298a.reference = {
    __cReference: true,
    get value() { return MASKWALL12____header_global_8923a49a28ce0ee1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:348
export const TOILETBROKE____header_global_c3e749ea91ee329e = ((((((615) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_123542e32c97c745a697fcc3() {
  return __cxx_static_address_123542e32c97c745a697fcc3.reference || (__cxx_static_address_123542e32c97c745a697fcc3.reference = {
    __cReference: true,
    get value() { return TOILETBROKE____header_global_c3e749ea91ee329e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:349
export const PIPE2____header_global_111caef32e7da0fe = ((((((616) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_746db36c882353867512417f() {
  return __cxx_static_address_746db36c882353867512417f.reference || (__cxx_static_address_746db36c882353867512417f.reference = {
    __cReference: true,
    get value() { return PIPE2____header_global_111caef32e7da0fe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:350
export const PIPE1B____header_global_c57655b3c4938689 = ((((((617) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7c9949a8570b7523829198d6() {
  return __cxx_static_address_7c9949a8570b7523829198d6.reference || (__cxx_static_address_7c9949a8570b7523829198d6.reference = {
    __cReference: true,
    get value() { return PIPE1B____header_global_c57655b3c4938689; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:351
export const PIPE3____header_global_83dcbde4003e176f = ((((((618) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_910203016af8b22226c3582b() {
  return __cxx_static_address_910203016af8b22226c3582b.reference || (__cxx_static_address_910203016af8b22226c3582b.reference = {
    __cReference: true,
    get value() { return PIPE3____header_global_83dcbde4003e176f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:352
export const PIPE1____header_global_4f1dd307e0fc6c60 = ((((((619) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f28ff5ef04d724d84dc3c91a() {
  return __cxx_static_address_f28ff5ef04d724d84dc3c91a.reference || (__cxx_static_address_f28ff5ef04d724d84dc3c91a.reference = {
    __cReference: true,
    get value() { return PIPE1____header_global_4f1dd307e0fc6c60; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:353
export const CAMERA1____header_global_29fe8e44a699e6f5 = ((((((621) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b24660a81884899eb8e5c2a8() {
  return __cxx_static_address_b24660a81884899eb8e5c2a8.reference || (__cxx_static_address_b24660a81884899eb8e5c2a8.reference = {
    __cReference: true,
    get value() { return CAMERA1____header_global_29fe8e44a699e6f5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:354
export const PIPE2B____header_global_5b31f0ed02add5ef = ((((((633) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_169c5c833aef621a54c092e9() {
  return __cxx_static_address_169c5c833aef621a54c092e9.reference || (__cxx_static_address_169c5c833aef621a54c092e9.reference = {
    __cReference: true,
    get value() { return PIPE2B____header_global_5b31f0ed02add5ef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:355
export const BOLT1____header_global_4406ab980531b90f = ((((((634) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_212f5c7949f8e08a43d03180() {
  return __cxx_static_address_212f5c7949f8e08a43d03180.reference || (__cxx_static_address_212f5c7949f8e08a43d03180.reference = {
    __cReference: true,
    get value() { return BOLT1____header_global_4406ab980531b90f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:356
export const W_NUMBERS____header_global_2f1765db4d5d06f3 = ((((((640) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cb427ec9000c13c293bf8871() {
  return __cxx_static_address_cb427ec9000c13c293bf8871.reference || (__cxx_static_address_cb427ec9000c13c293bf8871.reference = {
    __cReference: true,
    get value() { return W_NUMBERS____header_global_2f1765db4d5d06f3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:357
export const WATERDRIP____header_global_d08f91f2bf2f805f = ((((((660) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4dd368085bd20c66d9810f3a() {
  return __cxx_static_address_4dd368085bd20c66d9810f3a.reference || (__cxx_static_address_4dd368085bd20c66d9810f3a.reference = {
    __cReference: true,
    get value() { return WATERDRIP____header_global_d08f91f2bf2f805f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:358
export const WATERBUBBLE____header_global_10428a668d6cb4cd = ((((((661) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fa5ace5a232d590765477eaf() {
  return __cxx_static_address_fa5ace5a232d590765477eaf.reference || (__cxx_static_address_fa5ace5a232d590765477eaf.reference = {
    __cReference: true,
    get value() { return WATERBUBBLE____header_global_10428a668d6cb4cd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:359
export const WATERBUBBLEMAKER____header_global_de96249ca010f2bb = ((((((662) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7acdd49b637bfb32dc0711df() {
  return __cxx_static_address_7acdd49b637bfb32dc0711df.reference || (__cxx_static_address_7acdd49b637bfb32dc0711df.reference = {
    __cReference: true,
    get value() { return WATERBUBBLEMAKER____header_global_de96249ca010f2bb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:360
export const W_FORCEFIELD____header_global_845f4bcfacc9cb2a = ((((((663) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_050137d4c6183d528f44eb39() {
  return __cxx_static_address_050137d4c6183d528f44eb39.reference || (__cxx_static_address_050137d4c6183d528f44eb39.reference = {
    __cReference: true,
    get value() { return W_FORCEFIELD____header_global_845f4bcfacc9cb2a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:361
export const VACUUM____header_global_5ca61efc9156d67c = ((((((669) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_82292d40f89f6770577a01f4() {
  return __cxx_static_address_82292d40f89f6770577a01f4.reference || (__cxx_static_address_82292d40f89f6770577a01f4.reference = {
    __cReference: true,
    get value() { return VACUUM____header_global_5ca61efc9156d67c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:362
export const FOOTPRINTS2____header_global_1e2fd1f486828046 = ((((((672) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a21cf30f85b5dd7ccea79f5c() {
  return __cxx_static_address_a21cf30f85b5dd7ccea79f5c.reference || (__cxx_static_address_a21cf30f85b5dd7ccea79f5c.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS2____header_global_1e2fd1f486828046; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:363
export const FOOTPRINTS3____header_global_2700ba3935df3bd3 = ((((((673) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8178a485f76d576a5034b171() {
  return __cxx_static_address_8178a485f76d576a5034b171.reference || (__cxx_static_address_8178a485f76d576a5034b171.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS3____header_global_2700ba3935df3bd3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:364
export const FOOTPRINTS4____header_global_c94a34baade680dd = ((((((674) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c1668bd399efa682540f63d5() {
  return __cxx_static_address_c1668bd399efa682540f63d5.reference || (__cxx_static_address_c1668bd399efa682540f63d5.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS4____header_global_c94a34baade680dd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:365
export const EGG____header_global_38e1eec49ec35482 = ((((((675) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4330684efc492bd85d3bdd4f() {
  return __cxx_static_address_4330684efc492bd85d3bdd4f.reference || (__cxx_static_address_4330684efc492bd85d3bdd4f.reference = {
    __cReference: true,
    get value() { return EGG____header_global_38e1eec49ec35482; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:366
export const SCALE____header_global_7f6d6ad4359e149e = ((((((678) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ab7705feefa5411f65132f43() {
  return __cxx_static_address_ab7705feefa5411f65132f43.reference || (__cxx_static_address_ab7705feefa5411f65132f43.reference = {
    __cReference: true,
    get value() { return SCALE____header_global_7f6d6ad4359e149e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:367
export const CHAIR3____header_global_f9548849de5b23a1 = ((((((680) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0d22dfd76710579b767f0d0f() {
  return __cxx_static_address_0d22dfd76710579b767f0d0f.reference || (__cxx_static_address_0d22dfd76710579b767f0d0f.reference = {
    __cReference: true,
    get value() { return CHAIR3____header_global_f9548849de5b23a1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:368
export const CAMERALIGHT____header_global_0c01290958c9f214 = ((((((685) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f5ff7ea76db70d991abd6574() {
  return __cxx_static_address_f5ff7ea76db70d991abd6574.reference || (__cxx_static_address_f5ff7ea76db70d991abd6574.reference = {
    __cReference: true,
    get value() { return CAMERALIGHT____header_global_0c01290958c9f214; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:369
export const MOVIECAMERA____header_global_49aa0db3e83f63c9 = ((((((686) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fc5bcbd1ce5e356e7d57d4cb() {
  return __cxx_static_address_fc5bcbd1ce5e356e7d57d4cb.reference || (__cxx_static_address_fc5bcbd1ce5e356e7d57d4cb.reference = {
    __cReference: true,
    get value() { return MOVIECAMERA____header_global_49aa0db3e83f63c9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:370
export const IVUNIT____header_global_89399a5237ba7400 = ((((((689) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a399a95c420f33637897cb71() {
  return __cxx_static_address_a399a95c420f33637897cb71.reference || (__cxx_static_address_a399a95c420f33637897cb71.reference = {
    __cReference: true,
    get value() { return IVUNIT____header_global_89399a5237ba7400; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:371
export const POT1____header_global_da4d635efbed84bf = ((((((694) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fe131d8ba13eff6f14f53f72() {
  return __cxx_static_address_fe131d8ba13eff6f14f53f72.reference || (__cxx_static_address_fe131d8ba13eff6f14f53f72.reference = {
    __cReference: true,
    get value() { return POT1____header_global_da4d635efbed84bf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:372
export const POT2____header_global_5c32ffc9faa43693 = ((((((695) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9d4b74a750d6b0526ea6cbdc() {
  return __cxx_static_address_9d4b74a750d6b0526ea6cbdc.reference || (__cxx_static_address_9d4b74a750d6b0526ea6cbdc.reference = {
    __cReference: true,
    get value() { return POT2____header_global_5c32ffc9faa43693; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:373
export const POT3____header_global_2906d3c304fa6eeb = ((((((697) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_faf39a8d07184f8ea1e88e45() {
  return __cxx_static_address_faf39a8d07184f8ea1e88e45.reference || (__cxx_static_address_faf39a8d07184f8ea1e88e45.reference = {
    __cReference: true,
    get value() { return POT3____header_global_2906d3c304fa6eeb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:374
export const PIPE3B____header_global_33f7fd7f5c41baad = ((((((700) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bba2c09052f0bff8ca55cb05() {
  return __cxx_static_address_bba2c09052f0bff8ca55cb05.reference || (__cxx_static_address_bba2c09052f0bff8ca55cb05.reference = {
    __cReference: true,
    get value() { return PIPE3B____header_global_33f7fd7f5c41baad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:375
export const WALLLIGHT3____header_global_749c0649912c97dc = ((((((701) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_74f00f7dfa9c8853bda3de3a() {
  return __cxx_static_address_74f00f7dfa9c8853bda3de3a.reference || (__cxx_static_address_74f00f7dfa9c8853bda3de3a.reference = {
    __cReference: true,
    get value() { return WALLLIGHT3____header_global_749c0649912c97dc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:376
export const WALLLIGHTBUST3____header_global_85a0557b930d3ef7 = ((((((702) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_662d32d5d34f6e5964b68a5c() {
  return __cxx_static_address_662d32d5d34f6e5964b68a5c.reference || (__cxx_static_address_662d32d5d34f6e5964b68a5c.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST3____header_global_85a0557b930d3ef7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:377
export const WALLLIGHT1____header_global_7ca5b2b1d996749f = ((((((703) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7a43a810df732e4f435bb39e() {
  return __cxx_static_address_7a43a810df732e4f435bb39e.reference || (__cxx_static_address_7a43a810df732e4f435bb39e.reference = {
    __cReference: true,
    get value() { return WALLLIGHT1____header_global_7ca5b2b1d996749f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:378
export const WALLLIGHTBUST1____header_global_536326fe3d12e6d0 = ((((((704) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8be8d6d7281adf5a7cb1a8c5() {
  return __cxx_static_address_8be8d6d7281adf5a7cb1a8c5.reference || (__cxx_static_address_8be8d6d7281adf5a7cb1a8c5.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST1____header_global_536326fe3d12e6d0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:379
export const WALLLIGHT2____header_global_2cf11430a9875340 = ((((((705) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a1abdf8730864af2e55dd3ee() {
  return __cxx_static_address_a1abdf8730864af2e55dd3ee.reference || (__cxx_static_address_a1abdf8730864af2e55dd3ee.reference = {
    __cReference: true,
    get value() { return WALLLIGHT2____header_global_2cf11430a9875340; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:380
export const WALLLIGHTBUST2____header_global_35204111fa734749 = ((((((706) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_07889bf07554687bced92fe5() {
  return __cxx_static_address_07889bf07554687bced92fe5.reference || (__cxx_static_address_07889bf07554687bced92fe5.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST2____header_global_35204111fa734749; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:381
export const LIGHTSWITCH2____header_global_138d226d71e78fc7 = ((((((712) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0044d53691b836174b255745() {
  return __cxx_static_address_0044d53691b836174b255745.reference || (__cxx_static_address_0044d53691b836174b255745.reference = {
    __cReference: true,
    get value() { return LIGHTSWITCH2____header_global_138d226d71e78fc7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:382
export const WAITTOBESEATED____header_global_051ebe51c94b75e8 = ((((((716) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_670c4a686cb6c95a002aa22b() {
  return __cxx_static_address_670c4a686cb6c95a002aa22b.reference || (__cxx_static_address_670c4a686cb6c95a002aa22b.reference = {
    __cReference: true,
    get value() { return WAITTOBESEATED____header_global_051ebe51c94b75e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:383
export const DOORTILE14____header_global_ee0fdf72199060c7 = ((((((717) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c5cb3dcfc7a32c53a99a1595() {
  return __cxx_static_address_c5cb3dcfc7a32c53a99a1595.reference || (__cxx_static_address_c5cb3dcfc7a32c53a99a1595.reference = {
    __cReference: true,
    get value() { return DOORTILE14____header_global_ee0fdf72199060c7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:384
export const STATUE____header_global_12818776cffa2fdb = ((((((753) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a7a9e13149ea6a2fede4867d() {
  return __cxx_static_address_a7a9e13149ea6a2fede4867d.reference || (__cxx_static_address_a7a9e13149ea6a2fede4867d.reference = {
    __cReference: true,
    get value() { return STATUE____header_global_12818776cffa2fdb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:385
export const MIKE____header_global_9e1eacc58fa73ec9 = ((((((762) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_00acb7d4babc942fef68753e() {
  return __cxx_static_address_00acb7d4babc942fef68753e.reference || (__cxx_static_address_00acb7d4babc942fef68753e.reference = {
    __cReference: true,
    get value() { return MIKE____header_global_9e1eacc58fa73ec9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:386
export const VASE____header_global_4e64cb7d2200a120 = ((((((765) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_121f7d6a9749e0d04f778982() {
  return __cxx_static_address_121f7d6a9749e0d04f778982.reference || (__cxx_static_address_121f7d6a9749e0d04f778982.reference = {
    __cReference: true,
    get value() { return VASE____header_global_4e64cb7d2200a120; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:387
export const SUSHIPLATE1____header_global_19c21450d556813f = ((((((768) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b2bebc27a4f10872cbb41d17() {
  return __cxx_static_address_b2bebc27a4f10872cbb41d17.reference || (__cxx_static_address_b2bebc27a4f10872cbb41d17.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE1____header_global_19c21450d556813f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:388
export const SUSHIPLATE2____header_global_3780ae09dfc033f6 = ((((((769) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9e396c70a2e3306e3e627fc2() {
  return __cxx_static_address_9e396c70a2e3306e3e627fc2.reference || (__cxx_static_address_9e396c70a2e3306e3e627fc2.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE2____header_global_3780ae09dfc033f6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:389
export const SUSHIPLATE3____header_global_2b6873b4bad1a792 = ((((((774) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b656f4696cd250af95d13e8f() {
  return __cxx_static_address_b656f4696cd250af95d13e8f.reference || (__cxx_static_address_b656f4696cd250af95d13e8f.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE3____header_global_2b6873b4bad1a792; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:390
export const SUSHIPLATE4____header_global_eeccb40581a37822 = ((((((779) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e2d56a9221d2ff4082840684() {
  return __cxx_static_address_e2d56a9221d2ff4082840684.reference || (__cxx_static_address_e2d56a9221d2ff4082840684.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE4____header_global_eeccb40581a37822; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:391
export const DOORTILE16____header_global_f0bb8b8553267ac7 = ((((((781) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_24b3582d7c4fe5bf06a12678() {
  return __cxx_static_address_24b3582d7c4fe5bf06a12678.reference || (__cxx_static_address_24b3582d7c4fe5bf06a12678.reference = {
    __cReference: true,
    get value() { return DOORTILE16____header_global_f0bb8b8553267ac7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:392
export const SUSHIPLATE5____header_global_307b5d90ba8a0e0f = ((((((792) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1aecc5a96e31a29ddcd0aadb() {
  return __cxx_static_address_1aecc5a96e31a29ddcd0aadb.reference || (__cxx_static_address_1aecc5a96e31a29ddcd0aadb.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE5____header_global_307b5d90ba8a0e0f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:393
export const OJ____header_global_514dcc8777587d6a = ((((((806) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_435ec47070a5ac6a4e5188b8() {
  return __cxx_static_address_435ec47070a5ac6a4e5188b8.reference || (__cxx_static_address_435ec47070a5ac6a4e5188b8.reference = {
    __cReference: true,
    get value() { return OJ____header_global_514dcc8777587d6a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:394
export const MASKWALL13____header_global_0842b547a0c554f1 = ((((((830) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ce67904ee4627fbdb9be91bb() {
  return __cxx_static_address_ce67904ee4627fbdb9be91bb.reference || (__cxx_static_address_ce67904ee4627fbdb9be91bb.reference = {
    __cReference: true,
    get value() { return MASKWALL13____header_global_0842b547a0c554f1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:395
export const HURTRAIL____header_global_1b698d4e9db36c0c = ((((((859) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e90937825ea2a3de7f60aa7c() {
  return __cxx_static_address_e90937825ea2a3de7f60aa7c.reference || (__cxx_static_address_e90937825ea2a3de7f60aa7c.reference = {
    __cReference: true,
    get value() { return HURTRAIL____header_global_1b698d4e9db36c0c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:396
export const POWERSWITCH1____header_global_6c80161acfb884c3 = ((((((860) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6d86d3781529f0eeb08a8de6() {
  return __cxx_static_address_6d86d3781529f0eeb08a8de6.reference || (__cxx_static_address_6d86d3781529f0eeb08a8de6.reference = {
    __cReference: true,
    get value() { return POWERSWITCH1____header_global_6c80161acfb884c3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:397
export const LOCKSWITCH1____header_global_322654a70d13ee03 = ((((((862) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aa416e9ca6697adc67657be9() {
  return __cxx_static_address_aa416e9ca6697adc67657be9.reference || (__cxx_static_address_aa416e9ca6697adc67657be9.reference = {
    __cReference: true,
    get value() { return LOCKSWITCH1____header_global_322654a70d13ee03; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:398
export const POWERSWITCH2____header_global_9d49750337b129da = ((((((864) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f97de1b27d40e0e07f66b05a() {
  return __cxx_static_address_f97de1b27d40e0e07f66b05a.reference || (__cxx_static_address_f97de1b27d40e0e07f66b05a.reference = {
    __cReference: true,
    get value() { return POWERSWITCH2____header_global_9d49750337b129da; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:399
export const ATM____header_global_3f499537c7e504f8 = ((((((867) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6cf421edfd5a62f211eff29a() {
  return __cxx_static_address_6cf421edfd5a62f211eff29a.reference || (__cxx_static_address_6cf421edfd5a62f211eff29a.reference = {
    __cReference: true,
    get value() { return ATM____header_global_3f499537c7e504f8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:400
export const STATUEFLASH____header_global_70f729139003527c = ((((((869) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5d1cc648064d5451a9f695de() {
  return __cxx_static_address_5d1cc648064d5451a9f695de.reference || (__cxx_static_address_5d1cc648064d5451a9f695de.reference = {
    __cReference: true,
    get value() { return STATUEFLASH____header_global_70f729139003527c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:401
export const ATMBROKE____header_global_3806c804bfd9cdb7 = ((((((888) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1039a736cc01c0cf34f43f2d() {
  return __cxx_static_address_1039a736cc01c0cf34f43f2d.reference || (__cxx_static_address_1039a736cc01c0cf34f43f2d.reference = {
    __cReference: true,
    get value() { return ATMBROKE____header_global_3806c804bfd9cdb7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:402
export const STRIPEBALL____header_global_f869030fbc57e729 = ((((((901) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8408b18a7acf43e44a1053e3() {
  return __cxx_static_address_8408b18a7acf43e44a1053e3.reference || (__cxx_static_address_8408b18a7acf43e44a1053e3.reference = {
    __cReference: true,
    get value() { return STRIPEBALL____header_global_f869030fbc57e729; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:403
export const QUEBALL____header_global_761bf98d95179342 = ((((((902) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3c868801de47a5a3a29309c5() {
  return __cxx_static_address_3c868801de47a5a3a29309c5.reference || (__cxx_static_address_3c868801de47a5a3a29309c5.reference = {
    __cReference: true,
    get value() { return QUEBALL____header_global_761bf98d95179342; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:404
export const POCKET____header_global_eeb1eea367b26513 = ((((((903) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_524ba89899ba54fd60abbd75() {
  return __cxx_static_address_524ba89899ba54fd60abbd75.reference || (__cxx_static_address_524ba89899ba54fd60abbd75.reference = {
    __cReference: true,
    get value() { return POCKET____header_global_eeb1eea367b26513; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:405
export const WOODENHORSE____header_global_397160788da1cb82 = ((((((904) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bf0b0a608a56b3d69f550ed1() {
  return __cxx_static_address_bf0b0a608a56b3d69f550ed1.reference || (__cxx_static_address_bf0b0a608a56b3d69f550ed1.reference = {
    __cReference: true,
    get value() { return WOODENHORSE____header_global_397160788da1cb82; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:406
export const TREE1____header_global_3baf10d84e4f3ea4 = ((((((908) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0c654b9e4599b557946cf9da() {
  return __cxx_static_address_0c654b9e4599b557946cf9da.reference || (__cxx_static_address_0c654b9e4599b557946cf9da.reference = {
    __cReference: true,
    get value() { return TREE1____header_global_3baf10d84e4f3ea4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:407
export const TREE2____header_global_06664c03489c8ad8 = ((((((910) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_10a3c4b68e9e1f017ae1ddf9() {
  return __cxx_static_address_10a3c4b68e9e1f017ae1ddf9.reference || (__cxx_static_address_10a3c4b68e9e1f017ae1ddf9.reference = {
    __cReference: true,
    get value() { return TREE2____header_global_06664c03489c8ad8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:408
export const CACTUS____header_global_383fd4b0992fb818 = ((((((911) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6198895b29e2153db71c84f1() {
  return __cxx_static_address_6198895b29e2153db71c84f1.reference || (__cxx_static_address_6198895b29e2153db71c84f1.reference = {
    __cReference: true,
    get value() { return CACTUS____header_global_383fd4b0992fb818; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:409
export const MASKWALL2____header_global_d87cb81a146538f3 = ((((((913) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a071e9be96462478644e18b8() {
  return __cxx_static_address_a071e9be96462478644e18b8.reference || (__cxx_static_address_a071e9be96462478644e18b8.reference = {
    __cReference: true,
    get value() { return MASKWALL2____header_global_d87cb81a146538f3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:410
export const MASKWALL3____header_global_0d145f5bf1a05334 = ((((((914) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_303f83c9995c9608b40a4ede() {
  return __cxx_static_address_303f83c9995c9608b40a4ede.reference || (__cxx_static_address_303f83c9995c9608b40a4ede.reference = {
    __cReference: true,
    get value() { return MASKWALL3____header_global_0d145f5bf1a05334; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:411
export const MASKWALL4____header_global_158b54fa06029df1 = ((((((915) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_578a9692d02a588cdc5475a9() {
  return __cxx_static_address_578a9692d02a588cdc5475a9.reference || (__cxx_static_address_578a9692d02a588cdc5475a9.reference = {
    __cReference: true,
    get value() { return MASKWALL4____header_global_158b54fa06029df1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:412
export const FIREEXT____header_global_c1eab564133ac3d9 = ((((((916) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3e4a8694bb84085140044287() {
  return __cxx_static_address_3e4a8694bb84085140044287.reference || (__cxx_static_address_3e4a8694bb84085140044287.reference = {
    __cReference: true,
    get value() { return FIREEXT____header_global_c1eab564133ac3d9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:413
export const TOILETWATER____header_global_6bc38cf091c719d9 = ((((((921) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f6815e981005a46fc5cb3742() {
  return __cxx_static_address_f6815e981005a46fc5cb3742.reference || (__cxx_static_address_f6815e981005a46fc5cb3742.reference = {
    __cReference: true,
    get value() { return TOILETWATER____header_global_6bc38cf091c719d9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:414
export const NEON1____header_global_373242277097a478 = ((((((925) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5d6929a647f4831b3cba1ec7() {
  return __cxx_static_address_5d6929a647f4831b3cba1ec7.reference || (__cxx_static_address_5d6929a647f4831b3cba1ec7.reference = {
    __cReference: true,
    get value() { return NEON1____header_global_373242277097a478; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:415
export const NEON2____header_global_d08c28c6862af2c1 = ((((((926) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6e0782cf704c09a5bb0f4682() {
  return __cxx_static_address_6e0782cf704c09a5bb0f4682.reference || (__cxx_static_address_6e0782cf704c09a5bb0f4682.reference = {
    __cReference: true,
    get value() { return NEON2____header_global_d08c28c6862af2c1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:416
export const CACTUSBROKE____header_global_9db918f8c71de675 = ((((((939) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_45d86efdcc06c706cd303396() {
  return __cxx_static_address_45d86efdcc06c706cd303396.reference || (__cxx_static_address_45d86efdcc06c706cd303396.reference = {
    __cReference: true,
    get value() { return CACTUSBROKE____header_global_9db918f8c71de675; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:417
export const BOUNCEMINE____header_global_fc069048497b3dc4 = ((((((940) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e148b9c6ee5b88ab3a7c87ee() {
  return __cxx_static_address_e148b9c6ee5b88ab3a7c87ee.reference || (__cxx_static_address_e148b9c6ee5b88ab3a7c87ee.reference = {
    __cReference: true,
    get value() { return BOUNCEMINE____header_global_fc069048497b3dc4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:418
export const BROKEFIREHYDRENT____header_global_f447b7793408151d = ((((((950) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_319a76e96269ea8fa0403279() {
  return __cxx_static_address_319a76e96269ea8fa0403279.reference || (__cxx_static_address_319a76e96269ea8fa0403279.reference = {
    __cReference: true,
    get value() { return BROKEFIREHYDRENT____header_global_f447b7793408151d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:419
export const BOX____header_global_95c967c846937d25 = ((((((951) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b383a44600fbc21b740c90fc() {
  return __cxx_static_address_b383a44600fbc21b740c90fc.reference || (__cxx_static_address_b383a44600fbc21b740c90fc.reference = {
    __cReference: true,
    get value() { return BOX____header_global_95c967c846937d25; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:420
export const BULLETHOLE____header_global_8fd38ca732464216 = ((((((952) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e59f67bc47ec720a9ad4a360() {
  return __cxx_static_address_e59f67bc47ec720a9ad4a360.reference || (__cxx_static_address_e59f67bc47ec720a9ad4a360.reference = {
    __cReference: true,
    get value() { return BULLETHOLE____header_global_8fd38ca732464216; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:421
export const BOTTLE1____header_global_d091c0234aa3c3d8 = ((((((954) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dbed237462d1e0c338da8982() {
  return __cxx_static_address_dbed237462d1e0c338da8982.reference || (__cxx_static_address_dbed237462d1e0c338da8982.reference = {
    __cReference: true,
    get value() { return BOTTLE1____header_global_d091c0234aa3c3d8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:422
export const BOTTLE2____header_global_0405f5570c986416 = ((((((955) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ed15406467c5c67b9f321fd8() {
  return __cxx_static_address_ed15406467c5c67b9f321fd8.reference || (__cxx_static_address_ed15406467c5c67b9f321fd8.reference = {
    __cReference: true,
    get value() { return BOTTLE2____header_global_0405f5570c986416; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:423
export const BOTTLE3____header_global_e2b2025a0d794873 = ((((((956) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bf1bae407043e975cbd5b37c() {
  return __cxx_static_address_bf1bae407043e975cbd5b37c.reference || (__cxx_static_address_bf1bae407043e975cbd5b37c.reference = {
    __cReference: true,
    get value() { return BOTTLE3____header_global_e2b2025a0d794873; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:424
export const BOTTLE4____header_global_5cfedcc9fad60ff9 = ((((((957) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a3e165b932e19d70ed71c221() {
  return __cxx_static_address_a3e165b932e19d70ed71c221.reference || (__cxx_static_address_a3e165b932e19d70ed71c221.reference = {
    __cReference: true,
    get value() { return BOTTLE4____header_global_5cfedcc9fad60ff9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:425
export const FEMPIC5____header_global_6820dac2627bef45 = ((((((963) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9c47ee01001b4316fdd4b983() {
  return __cxx_static_address_9c47ee01001b4316fdd4b983.reference || (__cxx_static_address_9c47ee01001b4316fdd4b983.reference = {
    __cReference: true,
    get value() { return FEMPIC5____header_global_6820dac2627bef45; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:426
export const FEMPIC6____header_global_9ba40668c3356062 = ((((((964) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_633c4aa49e1867aca502f58b() {
  return __cxx_static_address_633c4aa49e1867aca502f58b.reference || (__cxx_static_address_633c4aa49e1867aca502f58b.reference = {
    __cReference: true,
    get value() { return FEMPIC6____header_global_9ba40668c3356062; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:427
export const FEMPIC7____header_global_2c79e535ab39b143 = ((((((965) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9c2989688bdf9dbeb54d6236() {
  return __cxx_static_address_9c2989688bdf9dbeb54d6236.reference || (__cxx_static_address_9c2989688bdf9dbeb54d6236.reference = {
    __cReference: true,
    get value() { return FEMPIC7____header_global_2c79e535ab39b143; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:428
export const HYDROPLANT____header_global_387e80896a15b64a = ((((((969) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_49856b000a22b298851a6bf4() {
  return __cxx_static_address_49856b000a22b298851a6bf4.reference || (__cxx_static_address_49856b000a22b298851a6bf4.reference = {
    __cReference: true,
    get value() { return HYDROPLANT____header_global_387e80896a15b64a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:429
export const OCEANSPRITE1____header_global_98206b679f01921e = ((((((971) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2504117063c0b212281c0c07() {
  return __cxx_static_address_2504117063c0b212281c0c07.reference || (__cxx_static_address_2504117063c0b212281c0c07.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE1____header_global_98206b679f01921e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:430
export const OCEANSPRITE2____header_global_e6e644b029d4eb51 = ((((((972) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1f0dfb6e2f40d7be9c0b1156() {
  return __cxx_static_address_1f0dfb6e2f40d7be9c0b1156.reference || (__cxx_static_address_1f0dfb6e2f40d7be9c0b1156.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE2____header_global_e6e644b029d4eb51; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:431
export const OCEANSPRITE3____header_global_eea137d884334d8b = ((((((973) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fff0c7ac8f061e598d8cd03c() {
  return __cxx_static_address_fff0c7ac8f061e598d8cd03c.reference || (__cxx_static_address_fff0c7ac8f061e598d8cd03c.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE3____header_global_eea137d884334d8b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:432
export const OCEANSPRITE4____header_global_47361eb40cde5172 = ((((((974) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_677f9a76f4f655e34bec0a04() {
  return __cxx_static_address_677f9a76f4f655e34bec0a04.reference || (__cxx_static_address_677f9a76f4f655e34bec0a04.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE4____header_global_47361eb40cde5172; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:433
export const OCEANSPRITE5____header_global_ac23932b095ba36c = ((((((975) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2f52ccd7f451001192574ffc() {
  return __cxx_static_address_2f52ccd7f451001192574ffc.reference || (__cxx_static_address_2f52ccd7f451001192574ffc.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE5____header_global_ac23932b095ba36c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:434
export const GENERICPOLE____header_global_c2830cc62fe39136 = ((((((977) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f4a06a1c1f2d5b75be87d259() {
  return __cxx_static_address_f4a06a1c1f2d5b75be87d259.reference || (__cxx_static_address_f4a06a1c1f2d5b75be87d259.reference = {
    __cReference: true,
    get value() { return GENERICPOLE____header_global_c2830cc62fe39136; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:435
export const CONE____header_global_4c265f730865cfef = ((((((978) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_514a21c7a5250f1625bf868e() {
  return __cxx_static_address_514a21c7a5250f1625bf868e.reference || (__cxx_static_address_514a21c7a5250f1625bf868e.reference = {
    __cReference: true,
    get value() { return CONE____header_global_4c265f730865cfef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:436
export const HANGLIGHT____header_global_6833c2767cbbe6f6 = ((((((979) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9b04f945222934b33fa84b68() {
  return __cxx_static_address_9b04f945222934b33fa84b68.reference || (__cxx_static_address_9b04f945222934b33fa84b68.reference = {
    __cReference: true,
    get value() { return HANGLIGHT____header_global_6833c2767cbbe6f6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:437
export const HYDRENT____header_global_735aa32acdcd9a81 = ((((((981) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0b91bd8e5c5c49d7b506666b() {
  return __cxx_static_address_0b91bd8e5c5c49d7b506666b.reference || (__cxx_static_address_0b91bd8e5c5c49d7b506666b.reference = {
    __cReference: true,
    get value() { return HYDRENT____header_global_735aa32acdcd9a81; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:438
export const MASKWALL14____header_global_5e5aa6a1c52ae458 = ((((((988) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_31bdab893dea76cc982cbdaa() {
  return __cxx_static_address_31bdab893dea76cc982cbdaa.reference || (__cxx_static_address_31bdab893dea76cc982cbdaa.reference = {
    __cReference: true,
    get value() { return MASKWALL14____header_global_5e5aa6a1c52ae458; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:439
export const TIRE____header_global_2bf43d200af010b0 = ((((((990) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f78e94154c3a66ad5580d97a() {
  return __cxx_static_address_f78e94154c3a66ad5580d97a.reference || (__cxx_static_address_f78e94154c3a66ad5580d97a.reference = {
    __cReference: true,
    get value() { return TIRE____header_global_2bf43d200af010b0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:440
export const PIPE5____header_global_e6011653c39e1c6c = ((((((994) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_34f47ff52d5e686addb6cf8d() {
  return __cxx_static_address_34f47ff52d5e686addb6cf8d.reference || (__cxx_static_address_34f47ff52d5e686addb6cf8d.reference = {
    __cReference: true,
    get value() { return PIPE5____header_global_e6011653c39e1c6c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:441
export const PIPE6____header_global_05540093fe5d4cbb = ((((((995) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c2208285249bf1ff30153bc9() {
  return __cxx_static_address_c2208285249bf1ff30153bc9.reference || (__cxx_static_address_c2208285249bf1ff30153bc9.reference = {
    __cReference: true,
    get value() { return PIPE6____header_global_05540093fe5d4cbb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:442
export const PIPE4____header_global_94fa7eb9ae6f5c8e = ((((((996) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4a33b477882b901acf239d77() {
  return __cxx_static_address_4a33b477882b901acf239d77.reference || (__cxx_static_address_4a33b477882b901acf239d77.reference = {
    __cReference: true,
    get value() { return PIPE4____header_global_94fa7eb9ae6f5c8e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:443
export const PIPE4B____header_global_a4aef269c7c9d61f = ((((((997) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_def8c217d3b163a7ad0ae1b9() {
  return __cxx_static_address_def8c217d3b163a7ad0ae1b9.reference || (__cxx_static_address_def8c217d3b163a7ad0ae1b9.reference = {
    __cReference: true,
    get value() { return PIPE4B____header_global_a4aef269c7c9d61f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:444
export const BROKEHYDROPLANT____header_global_4abd06ca62763d5e = ((((((1003) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eb0a57488bbf68c302fe11bb() {
  return __cxx_static_address_eb0a57488bbf68c302fe11bb.reference || (__cxx_static_address_eb0a57488bbf68c302fe11bb.reference = {
    __cReference: true,
    get value() { return BROKEHYDROPLANT____header_global_4abd06ca62763d5e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:445
export const PIPE5B____header_global_4a0296cab396d85f = ((((((1005) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_57ab113f204240ecc1636433() {
  return __cxx_static_address_57ab113f204240ecc1636433.reference || (__cxx_static_address_57ab113f204240ecc1636433.reference = {
    __cReference: true,
    get value() { return PIPE5B____header_global_4a0296cab396d85f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:446
export const NEON3____header_global_92d15de54445ff9e = ((((((1007) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_20e12f0fa0e2a0a65ed492fa() {
  return __cxx_static_address_20e12f0fa0e2a0a65ed492fa.reference || (__cxx_static_address_20e12f0fa0e2a0a65ed492fa.reference = {
    __cReference: true,
    get value() { return NEON3____header_global_92d15de54445ff9e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:447
export const NEON4____header_global_7add04c013bb0957 = ((((((1008) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0541bf130a28a3a55bbcabd0() {
  return __cxx_static_address_0541bf130a28a3a55bbcabd0.reference || (__cxx_static_address_0541bf130a28a3a55bbcabd0.reference = {
    __cReference: true,
    get value() { return NEON4____header_global_7add04c013bb0957; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:448
export const NEON5____header_global_468612ba6d63daf1 = ((((((1009) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cdd2bb564e94a7040e0c6996() {
  return __cxx_static_address_cdd2bb564e94a7040e0c6996.reference || (__cxx_static_address_cdd2bb564e94a7040e0c6996.reference = {
    __cReference: true,
    get value() { return NEON5____header_global_468612ba6d63daf1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:449
export const BOTTLE5____header_global_2349c0bff1c40085 = ((((((1012) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9f97ee958f0445079dfe34b4() {
  return __cxx_static_address_9f97ee958f0445079dfe34b4.reference || (__cxx_static_address_9f97ee958f0445079dfe34b4.reference = {
    __cReference: true,
    get value() { return BOTTLE5____header_global_2349c0bff1c40085; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:450
export const BOTTLE6____header_global_95c7042286f4da14 = ((((((1013) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4fd08c01514b96afb45a8d43() {
  return __cxx_static_address_4fd08c01514b96afb45a8d43.reference || (__cxx_static_address_4fd08c01514b96afb45a8d43.reference = {
    __cReference: true,
    get value() { return BOTTLE6____header_global_95c7042286f4da14; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:451
export const BOTTLE8____header_global_cdc82e93abafad51 = ((((((1014) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c09001da08c610f4e16cc217() {
  return __cxx_static_address_c09001da08c610f4e16cc217.reference || (__cxx_static_address_c09001da08c610f4e16cc217.reference = {
    __cReference: true,
    get value() { return BOTTLE8____header_global_cdc82e93abafad51; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:452
export const SPOTLITE____header_global_c490ceb32217f543 = ((((((1020) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e7fc2848f01785e477767fea() {
  return __cxx_static_address_e7fc2848f01785e477767fea.reference || (__cxx_static_address_e7fc2848f01785e477767fea.reference = {
    __cReference: true,
    get value() { return SPOTLITE____header_global_c490ceb32217f543; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:453
export const MASKWALL15____header_global_dac0f70423bba5c3 = ((((((1024) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_21bf7cc09b862520e1023b41() {
  return __cxx_static_address_21bf7cc09b862520e1023b41.reference || (__cxx_static_address_21bf7cc09b862520e1023b41.reference = {
    __cReference: true,
    get value() { return MASKWALL15____header_global_dac0f70423bba5c3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:454
export const BOTTLE7____header_global_1474948dbf0ff1cd = ((((((1025) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e289b0f3b41d916d3bdae7b1() {
  return __cxx_static_address_e289b0f3b41d916d3bdae7b1.reference || (__cxx_static_address_e289b0f3b41d916d3bdae7b1.reference = {
    __cReference: true,
    get value() { return BOTTLE7____header_global_1474948dbf0ff1cd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:455
export const HORSEONSIDE____header_global_cf3003aa394416ef = ((((((1026) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f2a5647314c3b93d5cf31ff4() {
  return __cxx_static_address_f2a5647314c3b93d5cf31ff4.reference || (__cxx_static_address_f2a5647314c3b93d5cf31ff4.reference = {
    __cReference: true,
    get value() { return HORSEONSIDE____header_global_cf3003aa394416ef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:456
export const GLASSPIECES____header_global_3433437c7bf8cd60 = ((((((1031) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1bb80ee7b60686fe0f260760() {
  return __cxx_static_address_1bb80ee7b60686fe0f260760.reference || (__cxx_static_address_1bb80ee7b60686fe0f260760.reference = {
    __cReference: true,
    get value() { return GLASSPIECES____header_global_3433437c7bf8cd60; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:457
export const NEON6____header_global_f7aa1c7beb542e52 = ((((((1046) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_79e632de2ffa2fca0316f6d9() {
  return __cxx_static_address_79e632de2ffa2fca0316f6d9.reference || (__cxx_static_address_79e632de2ffa2fca0316f6d9.reference = {
    __cReference: true,
    get value() { return NEON6____header_global_f7aa1c7beb542e52; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:458
export const MASKWALL6____header_global_73a293f85c292c30 = ((((((1059) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f8e0373b39a74055a6dfe7d0() {
  return __cxx_static_address_f8e0373b39a74055a6dfe7d0.reference || (__cxx_static_address_f8e0373b39a74055a6dfe7d0.reference = {
    __cReference: true,
    get value() { return MASKWALL6____header_global_73a293f85c292c30; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:459
export const RUBBERCAN____header_global_b66ac437356d6471 = ((((((1062) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4738894c7159d237d7c30594() {
  return __cxx_static_address_4738894c7159d237d7c30594.reference || (__cxx_static_address_4738894c7159d237d7c30594.reference = {
    __cReference: true,
    get value() { return RUBBERCAN____header_global_b66ac437356d6471; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:460
export const PLUG____header_global_eeeb72d94b6794a7 = ((((((1069) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_396e63ce498db08f2e9dd019() {
  return __cxx_static_address_396e63ce498db08f2e9dd019.reference || (__cxx_static_address_396e63ce498db08f2e9dd019.reference = {
    __cReference: true,
    get value() { return PLUG____header_global_eeeb72d94b6794a7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:461
export const OOZFILTER____header_global_ecbd201935540b57 = ((((((1079) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8be8ea154d9caafb671f5833() {
  return __cxx_static_address_8be8ea154d9caafb671f5833.reference || (__cxx_static_address_8be8ea154d9caafb671f5833.reference = {
    __cReference: true,
    get value() { return OOZFILTER____header_global_ecbd201935540b57; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:462
export const FLOORPLASMA____header_global_0a705f87b90a82d2 = ((((((1082) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_37c0f5d3204c6d187948b393() {
  return __cxx_static_address_37c0f5d3204c6d187948b393.reference || (__cxx_static_address_37c0f5d3204c6d187948b393.reference = {
    __cReference: true,
    get value() { return FLOORPLASMA____header_global_0a705f87b90a82d2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:463
export const REACTOR____header_global_30915e96a470a556 = ((((((1088) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3e841a4b5f949e34a52efd62() {
  return __cxx_static_address_3e841a4b5f949e34a52efd62.reference || (__cxx_static_address_3e841a4b5f949e34a52efd62.reference = {
    __cReference: true,
    get value() { return REACTOR____header_global_30915e96a470a556; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:464
export const REACTORSPARK____header_global_fb89a1b0a1eb0b7b = ((((((1092) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_48cb91f9f19a76fd0f31c479() {
  return __cxx_static_address_48cb91f9f19a76fd0f31c479.reference || (__cxx_static_address_48cb91f9f19a76fd0f31c479.reference = {
    __cReference: true,
    get value() { return REACTORSPARK____header_global_fb89a1b0a1eb0b7b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:465
export const REACTORBURNT____header_global_f5b9b8a83a4d5040 = ((((((1096) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_37944e7fac59ad5e9892333d() {
  return __cxx_static_address_37944e7fac59ad5e9892333d.reference || (__cxx_static_address_37944e7fac59ad5e9892333d.reference = {
    __cReference: true,
    get value() { return REACTORBURNT____header_global_f5b9b8a83a4d5040; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:466
export const DOORTILE15____header_global_7d7e5794706415fc = ((((((1102) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_15f08e6bb3a5ef8cc6e27d7f() {
  return __cxx_static_address_15f08e6bb3a5ef8cc6e27d7f.reference || (__cxx_static_address_15f08e6bb3a5ef8cc6e27d7f.reference = {
    __cReference: true,
    get value() { return DOORTILE15____header_global_7d7e5794706415fc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:467
export const HANDSWITCH____header_global_2c2f49cefcd0590a = ((((((1111) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_157652740bfa58efed57715f() {
  return __cxx_static_address_157652740bfa58efed57715f.reference || (__cxx_static_address_157652740bfa58efed57715f.reference = {
    __cReference: true,
    get value() { return HANDSWITCH____header_global_2c2f49cefcd0590a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:468
export const CIRCLEPANNEL____header_global_7ef4ae14c57295b1 = ((((((1113) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_463c1c5b9089b9dc2f7fe3f6() {
  return __cxx_static_address_463c1c5b9089b9dc2f7fe3f6.reference || (__cxx_static_address_463c1c5b9089b9dc2f7fe3f6.reference = {
    __cReference: true,
    get value() { return CIRCLEPANNEL____header_global_7ef4ae14c57295b1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:469
export const CIRCLEPANNELBROKE____header_global_6cfce5dcf5a41f60 = ((((((1114) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_27553415858c29355784639a() {
  return __cxx_static_address_27553415858c29355784639a.reference || (__cxx_static_address_27553415858c29355784639a.reference = {
    __cReference: true,
    get value() { return CIRCLEPANNELBROKE____header_global_6cfce5dcf5a41f60; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:470
export const PULLSWITCH____header_global_b1c7b9e37166e400 = ((((((1122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1dab4147cdf0638fe23b9987() {
  return __cxx_static_address_1dab4147cdf0638fe23b9987.reference || (__cxx_static_address_1dab4147cdf0638fe23b9987.reference = {
    __cReference: true,
    get value() { return PULLSWITCH____header_global_b1c7b9e37166e400; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:471
export const MASKWALL8____header_global_edd8de94a5f3fcc3 = ((((((1124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5e514fd220caf42c5b9e31f2() {
  return __cxx_static_address_5e514fd220caf42c5b9e31f2.reference || (__cxx_static_address_5e514fd220caf42c5b9e31f2.reference = {
    __cReference: true,
    get value() { return MASKWALL8____header_global_edd8de94a5f3fcc3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:472
export const BIGHOLE____header_global_f9b6320faf9112c4 = ((((((1141) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a638e26c3813dc4dfe2173ca() {
  return __cxx_static_address_a638e26c3813dc4dfe2173ca.reference || (__cxx_static_address_a638e26c3813dc4dfe2173ca.reference = {
    __cReference: true,
    get value() { return BIGHOLE____header_global_f9b6320faf9112c4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:473
export const ALIENSWITCH____header_global_95c05c3a7c1255b5 = ((((((1142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_660cb511ed252aa2e708945d() {
  return __cxx_static_address_660cb511ed252aa2e708945d.reference || (__cxx_static_address_660cb511ed252aa2e708945d.reference = {
    __cReference: true,
    get value() { return ALIENSWITCH____header_global_95c05c3a7c1255b5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:474
export const DOORTILE21____header_global_560534b3a490b8fa = ((((((1144) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_116d6c9b8be8debcd6e0b56b() {
  return __cxx_static_address_116d6c9b8be8debcd6e0b56b.reference || (__cxx_static_address_116d6c9b8be8debcd6e0b56b.reference = {
    __cReference: true,
    get value() { return DOORTILE21____header_global_560534b3a490b8fa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:475
export const HANDPRINTSWITCH____header_global_1c74ea574439b66d = ((((((1155) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d64ce4454145f6a093628dca() {
  return __cxx_static_address_d64ce4454145f6a093628dca.reference || (__cxx_static_address_d64ce4454145f6a093628dca.reference = {
    __cReference: true,
    get value() { return HANDPRINTSWITCH____header_global_1c74ea574439b66d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:476
export const BOTTLE10____header_global_6f1c514ec6e1d939 = ((((((1157) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_43eb366496d4c28e7303f279() {
  return __cxx_static_address_43eb366496d4c28e7303f279.reference || (__cxx_static_address_43eb366496d4c28e7303f279.reference = {
    __cReference: true,
    get value() { return BOTTLE10____header_global_6f1c514ec6e1d939; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:477
export const BOTTLE11____header_global_21970dd2535059b0 = ((((((1158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7c4fe021050ef67db614a13c() {
  return __cxx_static_address_7c4fe021050ef67db614a13c.reference || (__cxx_static_address_7c4fe021050ef67db614a13c.reference = {
    __cReference: true,
    get value() { return BOTTLE11____header_global_21970dd2535059b0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:478
export const BOTTLE12____header_global_925302ff5eb153e2 = ((((((1159) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_89a9e9849adc1f4e475ef95f() {
  return __cxx_static_address_89a9e9849adc1f4e475ef95f.reference || (__cxx_static_address_89a9e9849adc1f4e475ef95f.reference = {
    __cReference: true,
    get value() { return BOTTLE12____header_global_925302ff5eb153e2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:479
export const BOTTLE13____header_global_0e1e5d4e629cc5c4 = ((((((1160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6c610b6ed55c1f07dea6b63c() {
  return __cxx_static_address_6c610b6ed55c1f07dea6b63c.reference || (__cxx_static_address_6c610b6ed55c1f07dea6b63c.reference = {
    __cReference: true,
    get value() { return BOTTLE13____header_global_0e1e5d4e629cc5c4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:480
export const BOTTLE14____header_global_e07dd625e3e2ca77 = ((((((1161) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_db976ecc477ddb4f6ab45c5e() {
  return __cxx_static_address_db976ecc477ddb4f6ab45c5e.reference || (__cxx_static_address_db976ecc477ddb4f6ab45c5e.reference = {
    __cReference: true,
    get value() { return BOTTLE14____header_global_e07dd625e3e2ca77; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:481
export const BOTTLE15____header_global_39b3a3dd724afe4c = ((((((1162) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9878be362941eb284b8a504d() {
  return __cxx_static_address_9878be362941eb284b8a504d.reference || (__cxx_static_address_9878be362941eb284b8a504d.reference = {
    __cReference: true,
    get value() { return BOTTLE15____header_global_39b3a3dd724afe4c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:482
export const BOTTLE16____header_global_dc55797bba324a06 = ((((((1163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cc5b7fdcd28a0f81c3a9bcf0() {
  return __cxx_static_address_cc5b7fdcd28a0f81c3a9bcf0.reference || (__cxx_static_address_cc5b7fdcd28a0f81c3a9bcf0.reference = {
    __cReference: true,
    get value() { return BOTTLE16____header_global_dc55797bba324a06; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:483
export const BOTTLE17____header_global_3fab089a1ecb09e2 = ((((((1164) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_71633af1a697e5e0ef1cb049() {
  return __cxx_static_address_71633af1a697e5e0ef1cb049.reference || (__cxx_static_address_71633af1a697e5e0ef1cb049.reference = {
    __cReference: true,
    get value() { return BOTTLE17____header_global_3fab089a1ecb09e2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:484
export const BOTTLE18____header_global_848d1a5f5e98808e = ((((((1165) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b9dabd76b053bc5dcb622f04() {
  return __cxx_static_address_b9dabd76b053bc5dcb622f04.reference || (__cxx_static_address_b9dabd76b053bc5dcb622f04.reference = {
    __cReference: true,
    get value() { return BOTTLE18____header_global_848d1a5f5e98808e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:485
export const BOTTLE19____header_global_12978af0add73ab7 = ((((((1166) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_27b28217b66aeead505c5884() {
  return __cxx_static_address_27b28217b66aeead505c5884.reference || (__cxx_static_address_27b28217b66aeead505c5884.reference = {
    __cReference: true,
    get value() { return BOTTLE19____header_global_12978af0add73ab7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:486
export const DOORTILE17____header_global_d5d1fab6c4d25510 = ((((((1169) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_25f498a4d95d864644728381() {
  return __cxx_static_address_25f498a4d95d864644728381.reference || (__cxx_static_address_25f498a4d95d864644728381.reference = {
    __cReference: true,
    get value() { return DOORTILE17____header_global_d5d1fab6c4d25510; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:487
export const MASKWALL7____header_global_008644e5ff674e5c = ((((((1174) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a89ddbe3f863f1ca18cf4e57() {
  return __cxx_static_address_a89ddbe3f863f1ca18cf4e57.reference || (__cxx_static_address_a89ddbe3f863f1ca18cf4e57.reference = {
    __cReference: true,
    get value() { return MASKWALL7____header_global_008644e5ff674e5c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:488
export const DOORTILE11____header_global_840ac4559094fab2 = ((((((1178) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_688b75cbac8725ac92160262() {
  return __cxx_static_address_688b75cbac8725ac92160262.reference || (__cxx_static_address_688b75cbac8725ac92160262.reference = {
    __cReference: true,
    get value() { return DOORTILE11____header_global_840ac4559094fab2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:489
export const DOORTILE12____header_global_79983fe9d7b5120a = ((((((1179) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eb7151fec2d233e59f097494() {
  return __cxx_static_address_eb7151fec2d233e59f097494.reference || (__cxx_static_address_eb7151fec2d233e59f097494.reference = {
    __cReference: true,
    get value() { return DOORTILE12____header_global_79983fe9d7b5120a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:490
export const VENDMACHINE____header_global_9819fb791318378b = ((((((1212) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4767d18c5b9300985278c897() {
  return __cxx_static_address_4767d18c5b9300985278c897.reference || (__cxx_static_address_4767d18c5b9300985278c897.reference = {
    __cReference: true,
    get value() { return VENDMACHINE____header_global_9819fb791318378b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:491
export const COLAMACHINE____header_global_1ea1701439106310 = ((((((1215) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_df884c5a958b96d4ffad0024() {
  return __cxx_static_address_df884c5a958b96d4ffad0024.reference || (__cxx_static_address_df884c5a958b96d4ffad0024.reference = {
    __cReference: true,
    get value() { return COLAMACHINE____header_global_1ea1701439106310; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:492
export const CRANEPOLE____header_global_45b877734ed43881 = ((((((1221) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a906297e1de6f9841a6c2315() {
  return __cxx_static_address_a906297e1de6f9841a6c2315.reference || (__cxx_static_address_a906297e1de6f9841a6c2315.reference = {
    __cReference: true,
    get value() { return CRANEPOLE____header_global_45b877734ed43881; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:493
export const CRANE____header_global_b6edd2456d8d5ed1 = ((((((1222) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_424483930e45b3d68c1d5e18() {
  return __cxx_static_address_424483930e45b3d68c1d5e18.reference || (__cxx_static_address_424483930e45b3d68c1d5e18.reference = {
    __cReference: true,
    get value() { return CRANE____header_global_b6edd2456d8d5ed1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:494
export const BARBROKE____header_global_09eaa561dd563415 = ((((((1225) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_97ea4873d8ef61448d6f0d9c() {
  return __cxx_static_address_97ea4873d8ef61448d6f0d9c.reference || (__cxx_static_address_97ea4873d8ef61448d6f0d9c.reference = {
    __cReference: true,
    get value() { return BARBROKE____header_global_09eaa561dd563415; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:495
export const BLOODPOOL____header_global_f84d0472e70e0bf6 = ((((((1226) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0f31718ca97eef89d33814bd() {
  return __cxx_static_address_0f31718ca97eef89d33814bd.reference || (__cxx_static_address_0f31718ca97eef89d33814bd.reference = {
    __cReference: true,
    get value() { return BLOODPOOL____header_global_f84d0472e70e0bf6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:496
export const NUKEBARREL____header_global_e79d3a5f16a74a6a = ((((((1227) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d27277d1028ca27e2c22e637() {
  return __cxx_static_address_d27277d1028ca27e2c22e637.reference || (__cxx_static_address_d27277d1028ca27e2c22e637.reference = {
    __cReference: true,
    get value() { return NUKEBARREL____header_global_e79d3a5f16a74a6a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:497
export const NUKEBARRELDENTED____header_global_d48c62af901e666d = ((((((1228) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a3258b95b5510d75bc89908f() {
  return __cxx_static_address_a3258b95b5510d75bc89908f.reference || (__cxx_static_address_a3258b95b5510d75bc89908f.reference = {
    __cReference: true,
    get value() { return NUKEBARRELDENTED____header_global_d48c62af901e666d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:498
export const NUKEBARRELLEAKED____header_global_2b62f8d051b193b2 = ((((((1229) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2ae521bbce4a471678a3a89a() {
  return __cxx_static_address_2ae521bbce4a471678a3a89a.reference || (__cxx_static_address_2ae521bbce4a471678a3a89a.reference = {
    __cReference: true,
    get value() { return NUKEBARRELLEAKED____header_global_2b62f8d051b193b2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:499
export const CANWITHSOMETHING____header_global_7e59d51632d92ae0 = ((((((1232) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8054156e4ce4150fe6d352b9() {
  return __cxx_static_address_8054156e4ce4150fe6d352b9.reference || (__cxx_static_address_8054156e4ce4150fe6d352b9.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING____header_global_7e59d51632d92ae0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:500
export const MONEY____header_global_5121a84efe573e3c = ((((((1233) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_48a5374c336a741b9a883c62() {
  return __cxx_static_address_48a5374c336a741b9a883c62.reference || (__cxx_static_address_48a5374c336a741b9a883c62.reference = {
    __cReference: true,
    get value() { return MONEY____header_global_5121a84efe573e3c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:501
export const BANNER____header_global_c971ea517474c0af = ((((((1236) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9cb55dc5ff2c875cd182a522() {
  return __cxx_static_address_9cb55dc5ff2c875cd182a522.reference || (__cxx_static_address_9cb55dc5ff2c875cd182a522.reference = {
    __cReference: true,
    get value() { return BANNER____header_global_c971ea517474c0af; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:502
export const EXPLODINGBARREL____header_global_a6b0578eae92313e = ((((((1238) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3c776010d588428e1a8b2f03() {
  return __cxx_static_address_3c776010d588428e1a8b2f03.reference || (__cxx_static_address_3c776010d588428e1a8b2f03.reference = {
    __cReference: true,
    get value() { return EXPLODINGBARREL____header_global_a6b0578eae92313e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:503
export const EXPLODINGBARREL2____header_global_b77c34e4d7778ef1 = ((((((1239) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0487886e2fcb3a12ececdb2b() {
  return __cxx_static_address_0487886e2fcb3a12ececdb2b.reference || (__cxx_static_address_0487886e2fcb3a12ececdb2b.reference = {
    __cReference: true,
    get value() { return EXPLODINGBARREL2____header_global_b77c34e4d7778ef1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:504
export const FIREBARREL____header_global_0cb2530a3ab99d43 = ((((((1240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aa32e034f3abb7e18bea469e() {
  return __cxx_static_address_aa32e034f3abb7e18bea469e.reference || (__cxx_static_address_aa32e034f3abb7e18bea469e.reference = {
    __cReference: true,
    get value() { return FIREBARREL____header_global_0cb2530a3ab99d43; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:505
export const SEENINE____header_global_acd783d8f2c67f03 = ((((((1247) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9bc8c233a8df10c564fcb16e() {
  return __cxx_static_address_9bc8c233a8df10c564fcb16e.reference || (__cxx_static_address_9bc8c233a8df10c564fcb16e.reference = {
    __cReference: true,
    get value() { return SEENINE____header_global_acd783d8f2c67f03; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:506
export const SEENINEDEAD____header_global_2c991c0d29fe0769 = ((((((1248) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8a5b5664e7c7ca6e871901c1() {
  return __cxx_static_address_8a5b5664e7c7ca6e871901c1.reference || (__cxx_static_address_8a5b5664e7c7ca6e871901c1.reference = {
    __cReference: true,
    get value() { return SEENINEDEAD____header_global_2c991c0d29fe0769; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:507
export const STEAM____header_global_0e58ebecc29f86ec = ((((((1250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_716f35f6eeccbb746ee0ec4b() {
  return __cxx_static_address_716f35f6eeccbb746ee0ec4b.reference || (__cxx_static_address_716f35f6eeccbb746ee0ec4b.reference = {
    __cReference: true,
    get value() { return STEAM____header_global_0e58ebecc29f86ec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:508
export const CEILINGSTEAM____header_global_e81d4319be249aa2 = ((((((1255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ff4b42d046255fabd3cce1c9() {
  return __cxx_static_address_ff4b42d046255fabd3cce1c9.reference || (__cxx_static_address_ff4b42d046255fabd3cce1c9.reference = {
    __cReference: true,
    get value() { return CEILINGSTEAM____header_global_e81d4319be249aa2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:509
export const PIPE6B____header_global_c97726ccf0ccade0 = ((((((1260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0b49fc6473a7cd6c3bff2c75() {
  return __cxx_static_address_0b49fc6473a7cd6c3bff2c75.reference || (__cxx_static_address_0b49fc6473a7cd6c3bff2c75.reference = {
    __cReference: true,
    get value() { return PIPE6B____header_global_c97726ccf0ccade0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:510
export const TRANSPORTERBEAM____header_global_4e0b06341252677b = ((((((1261) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_76a39748a9e302b4db0eb392() {
  return __cxx_static_address_76a39748a9e302b4db0eb392.reference || (__cxx_static_address_76a39748a9e302b4db0eb392.reference = {
    __cReference: true,
    get value() { return TRANSPORTERBEAM____header_global_4e0b06341252677b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:511
export const RAT____header_global_de6a44a8301dbe7f = ((((((1267) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1bcdd4a52855ecd397f848ab() {
  return __cxx_static_address_1bcdd4a52855ecd397f848ab.reference || (__cxx_static_address_1bcdd4a52855ecd397f848ab.reference = {
    __cReference: true,
    get value() { return RAT____header_global_de6a44a8301dbe7f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:512
export const TRASH____header_global_a9f6ea4b01baeb8e = ((((((1272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_21f865bb3280f53625cae830() {
  return __cxx_static_address_21f865bb3280f53625cae830.reference || (__cxx_static_address_21f865bb3280f53625cae830.reference = {
    __cReference: true,
    get value() { return TRASH____header_global_a9f6ea4b01baeb8e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:513
export const FEMPIC1____header_global_265707fa0c79e45d = ((((((1280) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_08ba34f827720c126a649547() {
  return __cxx_static_address_08ba34f827720c126a649547.reference || (__cxx_static_address_08ba34f827720c126a649547.reference = {
    __cReference: true,
    get value() { return FEMPIC1____header_global_265707fa0c79e45d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:514
export const FEMPIC2____header_global_04c4c3768d6f4b2c = ((((((1289) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a9be743017f5c974eb197eac() {
  return __cxx_static_address_a9be743017f5c974eb197eac.reference || (__cxx_static_address_a9be743017f5c974eb197eac.reference = {
    __cReference: true,
    get value() { return FEMPIC2____header_global_04c4c3768d6f4b2c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:515
export const BLANKSCREEN____header_global_a7babcf75db0ee03 = ((((((1293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4f385271727d2710fca457ae() {
  return __cxx_static_address_4f385271727d2710fca457ae.reference || (__cxx_static_address_4f385271727d2710fca457ae.reference = {
    __cReference: true,
    get value() { return BLANKSCREEN____header_global_a7babcf75db0ee03; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:516
export const PODFEM1____header_global_014a0dbb5e244ded = ((((((1294) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d711c2cfa6a15db4870d5784() {
  return __cxx_static_address_d711c2cfa6a15db4870d5784.reference || (__cxx_static_address_d711c2cfa6a15db4870d5784.reference = {
    __cReference: true,
    get value() { return PODFEM1____header_global_014a0dbb5e244ded; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:517
export const FEMPIC3____header_global_799cbd3dbb16326c = ((((((1298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1ae935b4675efd8f878e7917() {
  return __cxx_static_address_1ae935b4675efd8f878e7917.reference || (__cxx_static_address_1ae935b4675efd8f878e7917.reference = {
    __cReference: true,
    get value() { return FEMPIC3____header_global_799cbd3dbb16326c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:518
export const FEMPIC4____header_global_fc7cf616f4d2fcae = ((((((1306) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_473471314c290878c6b232ba() {
  return __cxx_static_address_473471314c290878c6b232ba.reference || (__cxx_static_address_473471314c290878c6b232ba.reference = {
    __cReference: true,
    get value() { return FEMPIC4____header_global_fc7cf616f4d2fcae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:519
export const FEM1____header_global_8a5c87d1028d1e03 = ((((((1312) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b15ddc701443e0d040bdece5() {
  return __cxx_static_address_b15ddc701443e0d040bdece5.reference || (__cxx_static_address_b15ddc701443e0d040bdece5.reference = {
    __cReference: true,
    get value() { return FEM1____header_global_8a5c87d1028d1e03; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:520
export const FEM2____header_global_523f4aff15e176c3 = ((((((1317) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_098f3aee87abfc8abfce9a44() {
  return __cxx_static_address_098f3aee87abfc8abfce9a44.reference || (__cxx_static_address_098f3aee87abfc8abfce9a44.reference = {
    __cReference: true,
    get value() { return FEM2____header_global_523f4aff15e176c3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:521
export const FEM3____header_global_430d543bd232dcca = ((((((1321) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_06481a9711641e67c13f9327() {
  return __cxx_static_address_06481a9711641e67c13f9327.reference || (__cxx_static_address_06481a9711641e67c13f9327.reference = {
    __cReference: true,
    get value() { return FEM3____header_global_430d543bd232dcca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:522
export const FEM5____header_global_854351b46c4412f1 = ((((((1323) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_05f8f95cc363e86b05464f91() {
  return __cxx_static_address_05f8f95cc363e86b05464f91.reference || (__cxx_static_address_05f8f95cc363e86b05464f91.reference = {
    __cReference: true,
    get value() { return FEM5____header_global_854351b46c4412f1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:523
export const BLOODYPOLE____header_global_d75a2dfa5b37dfb6 = ((((((1324) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5ea2018a625bd6c82f5086f8() {
  return __cxx_static_address_5ea2018a625bd6c82f5086f8.reference || (__cxx_static_address_5ea2018a625bd6c82f5086f8.reference = {
    __cReference: true,
    get value() { return BLOODYPOLE____header_global_d75a2dfa5b37dfb6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:524
export const FEM4____header_global_b17dddc3b394d8c8 = ((((((1325) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5fd416173146e408652f4732() {
  return __cxx_static_address_5fd416173146e408652f4732.reference || (__cxx_static_address_5fd416173146e408652f4732.reference = {
    __cReference: true,
    get value() { return FEM4____header_global_b17dddc3b394d8c8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:525
export const FEM6____header_global_fa4440a165a8afc6 = ((((((1334) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b360c05482feff14e3047d37() {
  return __cxx_static_address_b360c05482feff14e3047d37.reference || (__cxx_static_address_b360c05482feff14e3047d37.reference = {
    __cReference: true,
    get value() { return FEM6____header_global_fa4440a165a8afc6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:526
export const FEM6PAD____header_global_c7422c5eec58fd7f = ((((((1335) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ca938c393afe664e527bb32b() {
  return __cxx_static_address_ca938c393afe664e527bb32b.reference || (__cxx_static_address_ca938c393afe664e527bb32b.reference = {
    __cReference: true,
    get value() { return FEM6PAD____header_global_c7422c5eec58fd7f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:527
export const FEM8____header_global_5d88719751140ba5 = ((((((1336) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b0c9d3dda3e7fc08e539d3cd() {
  return __cxx_static_address_b0c9d3dda3e7fc08e539d3cd.reference || (__cxx_static_address_b0c9d3dda3e7fc08e539d3cd.reference = {
    __cReference: true,
    get value() { return FEM8____header_global_5d88719751140ba5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:528
export const HELECOPT____header_global_57d2ce5a16df8469 = ((((((1346) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_32ba2f2207c287a194aa6ab2() {
  return __cxx_static_address_32ba2f2207c287a194aa6ab2.reference || (__cxx_static_address_32ba2f2207c287a194aa6ab2.reference = {
    __cReference: true,
    get value() { return HELECOPT____header_global_57d2ce5a16df8469; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:529
export const FETUSJIB____header_global_1701dfdd3caeb173 = ((((((1347) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_32b20d63a7f340668e79fe6e() {
  return __cxx_static_address_32b20d63a7f340668e79fe6e.reference || (__cxx_static_address_32b20d63a7f340668e79fe6e.reference = {
    __cReference: true,
    get value() { return FETUSJIB____header_global_1701dfdd3caeb173; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:530
export const HOLODUKE____header_global_4c5154d1078c7e90 = ((((((1348) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5d3b76b6d5a11ef736449975() {
  return __cxx_static_address_5d3b76b6d5a11ef736449975.reference || (__cxx_static_address_5d3b76b6d5a11ef736449975.reference = {
    __cReference: true,
    get value() { return HOLODUKE____header_global_4c5154d1078c7e90; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:531
export const SPACEMARINE____header_global_6cf89c13f0bdd418 = ((((((1353) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ca011acc827b790098936763() {
  return __cxx_static_address_ca011acc827b790098936763.reference || (__cxx_static_address_ca011acc827b790098936763.reference = {
    __cReference: true,
    get value() { return SPACEMARINE____header_global_6cf89c13f0bdd418; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:532
export const INDY____header_global_2a3e44a30fe1e820 = ((((((1355) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dadadf9fc74a56cbff2a7906() {
  return __cxx_static_address_dadadf9fc74a56cbff2a7906.reference || (__cxx_static_address_dadadf9fc74a56cbff2a7906.reference = {
    __cReference: true,
    get value() { return INDY____header_global_2a3e44a30fe1e820; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:533
export const FETUS____header_global_3da7af5aea6b0052 = ((((((1358) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_55ed47e1dd92da2f55fd46d8() {
  return __cxx_static_address_55ed47e1dd92da2f55fd46d8.reference || (__cxx_static_address_55ed47e1dd92da2f55fd46d8.reference = {
    __cReference: true,
    get value() { return FETUS____header_global_3da7af5aea6b0052; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:534
export const FETUSBROKE____header_global_ead42e0cfd6cd3a5 = ((((((1359) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_26a9a0632c6637af8d8f7036() {
  return __cxx_static_address_26a9a0632c6637af8d8f7036.reference || (__cxx_static_address_26a9a0632c6637af8d8f7036.reference = {
    __cReference: true,
    get value() { return FETUSBROKE____header_global_ead42e0cfd6cd3a5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:535
export const MONK____header_global_b0ab9b764771db32 = ((((((1352) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ef9e7aae853d9a007afe4e7f() {
  return __cxx_static_address_ef9e7aae853d9a007afe4e7f.reference || (__cxx_static_address_ef9e7aae853d9a007afe4e7f.reference = {
    __cReference: true,
    get value() { return MONK____header_global_b0ab9b764771db32; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:536
export const LUKE____header_global_a22bee9aac57cb53 = ((((((1354) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_650a0e6f12dc1e61f66a72bb() {
  return __cxx_static_address_650a0e6f12dc1e61f66a72bb.reference || (__cxx_static_address_650a0e6f12dc1e61f66a72bb.reference = {
    __cReference: true,
    get value() { return LUKE____header_global_a22bee9aac57cb53; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:537
export const COOLEXPLOSION1____header_global_eabdd39ae4e5d8ae = ((((((1360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6a95c6e1ed75230d8ec0824a() {
  return __cxx_static_address_6a95c6e1ed75230d8ec0824a.reference || (__cxx_static_address_6a95c6e1ed75230d8ec0824a.reference = {
    __cReference: true,
    get value() { return COOLEXPLOSION1____header_global_eabdd39ae4e5d8ae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:538
export const WATERSPLASH2____header_global_99e59ba794e56a92 = ((((((1380) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f805e47fe49e0922a6dcddcd() {
  return __cxx_static_address_f805e47fe49e0922a6dcddcd.reference || (__cxx_static_address_f805e47fe49e0922a6dcddcd.reference = {
    __cReference: true,
    get value() { return WATERSPLASH2____header_global_99e59ba794e56a92; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:539
export const FIREVASE____header_global_596664697e1396ca = ((((((1390) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c17754cfb61c18c9aacaf800() {
  return __cxx_static_address_c17754cfb61c18c9aacaf800.reference || (__cxx_static_address_c17754cfb61c18c9aacaf800.reference = {
    __cReference: true,
    get value() { return FIREVASE____header_global_596664697e1396ca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:540
export const FEM7____header_global_87dd912c0fafb8f1 = ((((((1395) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ce39d94314bfbd2cd19e118a() {
  return __cxx_static_address_ce39d94314bfbd2cd19e118a.reference || (__cxx_static_address_ce39d94314bfbd2cd19e118a.reference = {
    __cReference: true,
    get value() { return FEM7____header_global_87dd912c0fafb8f1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:541
export const APLAYERTOP____header_global_09d6424693db6b32 = ((((((1400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1d502662c39307c1722ceff3() {
  return __cxx_static_address_1d502662c39307c1722ceff3.reference || (__cxx_static_address_1d502662c39307c1722ceff3.reference = {
    __cReference: true,
    get value() { return APLAYERTOP____header_global_09d6424693db6b32; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:542
export const APLAYER____header_global_3616d73f719c8dab = ((((((1405) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6b571576d4a613f8f73d8d5e() {
  return __cxx_static_address_6b571576d4a613f8f73d8d5e.reference || (__cxx_static_address_6b571576d4a613f8f73d8d5e.reference = {
    __cReference: true,
    get value() { return APLAYER____header_global_3616d73f719c8dab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:543
export const PLAYERONWATER____header_global_2e89c3227c86cab3 = ((((((1420) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3f48716222ec18d2bab88640() {
  return __cxx_static_address_3f48716222ec18d2bab88640.reference || (__cxx_static_address_3f48716222ec18d2bab88640.reference = {
    __cReference: true,
    get value() { return PLAYERONWATER____header_global_2e89c3227c86cab3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:544
export const DUKELYINGDEAD____header_global_fceaa59d59221ea6 = ((((((1518) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0b2e0919adeaf7208c929119() {
  return __cxx_static_address_0b2e0919adeaf7208c929119.reference || (__cxx_static_address_0b2e0919adeaf7208c929119.reference = {
    __cReference: true,
    get value() { return DUKELYINGDEAD____header_global_fceaa59d59221ea6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:545
export const DUKETORSO____header_global_1ac1ff094ce3bc3c = ((((((1520) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_95750e2c2613e87cd1c67582() {
  return __cxx_static_address_95750e2c2613e87cd1c67582.reference || (__cxx_static_address_95750e2c2613e87cd1c67582.reference = {
    __cReference: true,
    get value() { return DUKETORSO____header_global_1ac1ff094ce3bc3c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:546
export const DUKEGUN____header_global_f0cccae63edd3dcb = ((((((1528) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1d35f72fe874f2e463e1b19f() {
  return __cxx_static_address_1d35f72fe874f2e463e1b19f.reference || (__cxx_static_address_1d35f72fe874f2e463e1b19f.reference = {
    __cReference: true,
    get value() { return DUKEGUN____header_global_f0cccae63edd3dcb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:547
export const DUKELEG____header_global_cfe8c62658dd8887 = ((((((1536) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_53615d8ff754232b8573b261() {
  return __cxx_static_address_53615d8ff754232b8573b261.reference || (__cxx_static_address_53615d8ff754232b8573b261.reference = {
    __cReference: true,
    get value() { return DUKELEG____header_global_cfe8c62658dd8887; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:548
export const SHARK____header_global_637a33d04137bfdc = ((((((1550) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_75798474d63e037a18869477() {
  return __cxx_static_address_75798474d63e037a18869477.reference || (__cxx_static_address_75798474d63e037a18869477.reference = {
    __cReference: true,
    get value() { return SHARK____header_global_637a33d04137bfdc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:549
export const BLOOD____header_global_9d6c57c52d3059b3 = ((((((1620) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0f22932a43fec7461e1839e2() {
  return __cxx_static_address_0f22932a43fec7461e1839e2.reference || (__cxx_static_address_0f22932a43fec7461e1839e2.reference = {
    __cReference: true,
    get value() { return BLOOD____header_global_9d6c57c52d3059b3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:550
export const FIRELASER____header_global_4f4f5389f5ffed16 = ((((((1625) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_14c356cec38a42cda9edcbd9() {
  return __cxx_static_address_14c356cec38a42cda9edcbd9.reference || (__cxx_static_address_14c356cec38a42cda9edcbd9.reference = {
    __cReference: true,
    get value() { return FIRELASER____header_global_4f4f5389f5ffed16; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:551
export const TRANSPORTERSTAR____header_global_d78753f6123c2dbe = ((((((1630) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_47607515cb62f9716d3fc794() {
  return __cxx_static_address_47607515cb62f9716d3fc794.reference || (__cxx_static_address_47607515cb62f9716d3fc794.reference = {
    __cReference: true,
    get value() { return TRANSPORTERSTAR____header_global_d78753f6123c2dbe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:552
export const SPIT____header_global_98b8a6c45352740e = ((((((1636) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ffe22a0360d0ab74e9681d67() {
  return __cxx_static_address_ffe22a0360d0ab74e9681d67.reference || (__cxx_static_address_ffe22a0360d0ab74e9681d67.reference = {
    __cReference: true,
    get value() { return SPIT____header_global_98b8a6c45352740e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:553
export const LOOGIE____header_global_0915c8d8d7ed7cf3 = ((((((1637) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e9703abdcac44fd797e5df13() {
  return __cxx_static_address_e9703abdcac44fd797e5df13.reference || (__cxx_static_address_e9703abdcac44fd797e5df13.reference = {
    __cReference: true,
    get value() { return LOOGIE____header_global_0915c8d8d7ed7cf3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:554
export const FIST____header_global_00cf3fcd15179276 = ((((((1640) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d70b18ef3893d8adf8ae7a99() {
  return __cxx_static_address_d70b18ef3893d8adf8ae7a99.reference || (__cxx_static_address_d70b18ef3893d8adf8ae7a99.reference = {
    __cReference: true,
    get value() { return FIST____header_global_00cf3fcd15179276; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:555
export const FREEZEBLAST____header_global_0556bea71aa19dde = ((((((1641) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b6c84c8f1744edc113083dd4() {
  return __cxx_static_address_b6c84c8f1744edc113083dd4.reference || (__cxx_static_address_b6c84c8f1744edc113083dd4.reference = {
    __cReference: true,
    get value() { return FREEZEBLAST____header_global_0556bea71aa19dde; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:556
export const SHRINKSPARK____header_global_9eccaa5c7d195af2 = ((((((1646) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5b5e60432aa3808e9b4fb3f3() {
  return __cxx_static_address_5b5e60432aa3808e9b4fb3f3.reference || (__cxx_static_address_5b5e60432aa3808e9b4fb3f3.reference = {
    __cReference: true,
    get value() { return SHRINKSPARK____header_global_9eccaa5c7d195af2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:557
export const TONGUE____header_global_0c74126ab6829e86 = ((((((1647) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6b72fa0b9beadcc6c4d22b52() {
  return __cxx_static_address_6b72fa0b9beadcc6c4d22b52.reference || (__cxx_static_address_6b72fa0b9beadcc6c4d22b52.reference = {
    __cReference: true,
    get value() { return TONGUE____header_global_0c74126ab6829e86; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:558
export const MORTER____header_global_15707563ea92b71f = ((((((1650) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_159f15b95f5552abd223ccb6() {
  return __cxx_static_address_159f15b95f5552abd223ccb6.reference || (__cxx_static_address_159f15b95f5552abd223ccb6.reference = {
    __cReference: true,
    get value() { return MORTER____header_global_15707563ea92b71f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:559
export const SHRINKEREXPLOSION____header_global_36d80a5e17aa6e1b = ((((((1656) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_88986d05d8bda41c2a9bf3b3() {
  return __cxx_static_address_88986d05d8bda41c2a9bf3b3.reference || (__cxx_static_address_88986d05d8bda41c2a9bf3b3.reference = {
    __cReference: true,
    get value() { return SHRINKEREXPLOSION____header_global_36d80a5e17aa6e1b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:560
export const RADIUSEXPLOSION____header_global_a68beb2c1c8488a3 = ((((((1670) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f9a8a7f4bee6d5c57ea2b9f2() {
  return __cxx_static_address_f9a8a7f4bee6d5c57ea2b9f2.reference || (__cxx_static_address_f9a8a7f4bee6d5c57ea2b9f2.reference = {
    __cReference: true,
    get value() { return RADIUSEXPLOSION____header_global_a68beb2c1c8488a3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:561
export const FORCERIPPLE____header_global_02ee9e4dd66c3ecd = ((((((1671) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_511764f305b102f9c2475c16() {
  return __cxx_static_address_511764f305b102f9c2475c16.reference || (__cxx_static_address_511764f305b102f9c2475c16.reference = {
    __cReference: true,
    get value() { return FORCERIPPLE____header_global_02ee9e4dd66c3ecd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:562
export const LIZTROOP____header_global_1a561e2df42aa72a = ((((((1680) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7ccd0c4f4da5eabd8347e729() {
  return __cxx_static_address_7ccd0c4f4da5eabd8347e729.reference || (__cxx_static_address_7ccd0c4f4da5eabd8347e729.reference = {
    __cReference: true,
    get value() { return LIZTROOP____header_global_1a561e2df42aa72a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:563
export const LIZTROOPRUNNING____header_global_0cb56102d92e0dd6 = ((((((1681) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_60e374f9461e0e1a8273e655() {
  return __cxx_static_address_60e374f9461e0e1a8273e655.reference || (__cxx_static_address_60e374f9461e0e1a8273e655.reference = {
    __cReference: true,
    get value() { return LIZTROOPRUNNING____header_global_0cb56102d92e0dd6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:564
export const LIZTROOPSTAYPUT____header_global_e505b6e14c57df3a = ((((((1682) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f4194089ac732ddcb268f1f5() {
  return __cxx_static_address_f4194089ac732ddcb268f1f5.reference || (__cxx_static_address_f4194089ac732ddcb268f1f5.reference = {
    __cReference: true,
    get value() { return LIZTROOPSTAYPUT____header_global_e505b6e14c57df3a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:565
export const LIZTROOPSHOOT____header_global_a335957d898c5027 = ((((((1715) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ebd45322b3737a41042cd343() {
  return __cxx_static_address_ebd45322b3737a41042cd343.reference || (__cxx_static_address_ebd45322b3737a41042cd343.reference = {
    __cReference: true,
    get value() { return LIZTROOPSHOOT____header_global_a335957d898c5027; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:566
export const LIZTROOPJETPACK____header_global_92bc1cf29a03d079 = ((((((1725) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_accab431886e1e931cfea5ed() {
  return __cxx_static_address_accab431886e1e931cfea5ed.reference || (__cxx_static_address_accab431886e1e931cfea5ed.reference = {
    __cReference: true,
    get value() { return LIZTROOPJETPACK____header_global_92bc1cf29a03d079; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:567
export const LIZTROOPONTOILET____header_global_0fc1bf607d3192fc = ((((((1741) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_11de2de9d2e8ac830e72fa11() {
  return __cxx_static_address_11de2de9d2e8ac830e72fa11.reference || (__cxx_static_address_11de2de9d2e8ac830e72fa11.reference = {
    __cReference: true,
    get value() { return LIZTROOPONTOILET____header_global_0fc1bf607d3192fc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:568
export const LIZTROOPJUSTSIT____header_global_57f39488076a2c02 = ((((((1742) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_622780cac919879639161840() {
  return __cxx_static_address_622780cac919879639161840.reference || (__cxx_static_address_622780cac919879639161840.reference = {
    __cReference: true,
    get value() { return LIZTROOPJUSTSIT____header_global_57f39488076a2c02; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:569
export const LIZTROOPDUCKING____header_global_b8fc5b25a38a1497 = ((((((1744) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ff5748916a0092c73610853d() {
  return __cxx_static_address_ff5748916a0092c73610853d.reference || (__cxx_static_address_ff5748916a0092c73610853d.reference = {
    __cReference: true,
    get value() { return LIZTROOPDUCKING____header_global_b8fc5b25a38a1497; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:570
export const HEADJIB1____header_global_5d13b3f58eb4ff8d = ((((((1768) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3b1b7e63ef8c146492159de7() {
  return __cxx_static_address_3b1b7e63ef8c146492159de7.reference || (__cxx_static_address_3b1b7e63ef8c146492159de7.reference = {
    __cReference: true,
    get value() { return HEADJIB1____header_global_5d13b3f58eb4ff8d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:571
export const ARMJIB1____header_global_41a8f8564e8a6dd1 = ((((((1772) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1a325e5109ea0d56b1aff601() {
  return __cxx_static_address_1a325e5109ea0d56b1aff601.reference || (__cxx_static_address_1a325e5109ea0d56b1aff601.reference = {
    __cReference: true,
    get value() { return ARMJIB1____header_global_41a8f8564e8a6dd1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:572
export const LEGJIB1____header_global_175c72f3b9518e85 = ((((((1776) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ccdf946546395dbfe7823ed7() {
  return __cxx_static_address_ccdf946546395dbfe7823ed7.reference || (__cxx_static_address_ccdf946546395dbfe7823ed7.reference = {
    __cReference: true,
    get value() { return LEGJIB1____header_global_175c72f3b9518e85; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:573
export const OCTABRAIN____header_global_1a24573d78b22279 = ((((((1820) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b230e497aff3306552088579() {
  return __cxx_static_address_b230e497aff3306552088579.reference || (__cxx_static_address_b230e497aff3306552088579.reference = {
    __cReference: true,
    get value() { return OCTABRAIN____header_global_1a24573d78b22279; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:574
export const OCTABRAINSTAYPUT____header_global_ca4c9f1f20ba5026 = ((((((1821) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e2be3e07a70af20f85c07515() {
  return __cxx_static_address_e2be3e07a70af20f85c07515.reference || (__cxx_static_address_e2be3e07a70af20f85c07515.reference = {
    __cReference: true,
    get value() { return OCTABRAINSTAYPUT____header_global_ca4c9f1f20ba5026; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:575
export const INNERJAW____header_global_ff6f2454c212b4c2 = ((((((1860) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4475aed8fa684516adbd9fcf() {
  return __cxx_static_address_4475aed8fa684516adbd9fcf.reference || (__cxx_static_address_4475aed8fa684516adbd9fcf.reference = {
    __cReference: true,
    get value() { return INNERJAW____header_global_ff6f2454c212b4c2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:576
export const DRONE____header_global_8e85df464f4e5085 = ((((((1880) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f37a952142282a743f25f237() {
  return __cxx_static_address_f37a952142282a743f25f237.reference || (__cxx_static_address_f37a952142282a743f25f237.reference = {
    __cReference: true,
    get value() { return DRONE____header_global_8e85df464f4e5085; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:577
export const EXPLOSION2____header_global_d89af8bec21f84d1 = ((((((1890) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dfbb13edd4ed9315acb05ceb() {
  return __cxx_static_address_dfbb13edd4ed9315acb05ceb.reference || (__cxx_static_address_dfbb13edd4ed9315acb05ceb.reference = {
    __cReference: true,
    get value() { return EXPLOSION2____header_global_d89af8bec21f84d1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:578
export const COMMANDER____header_global_cef0773c5a9aa4af = ((((((1920) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6362c4614306bef9f50f6514() {
  return __cxx_static_address_6362c4614306bef9f50f6514.reference || (__cxx_static_address_6362c4614306bef9f50f6514.reference = {
    __cReference: true,
    get value() { return COMMANDER____header_global_cef0773c5a9aa4af; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:579
export const COMMANDERSTAYPUT____header_global_ac68f043d2f5a187 = ((((((1921) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0aef2b575720f293ba32ba60() {
  return __cxx_static_address_0aef2b575720f293ba32ba60.reference || (__cxx_static_address_0aef2b575720f293ba32ba60.reference = {
    __cReference: true,
    get value() { return COMMANDERSTAYPUT____header_global_ac68f043d2f5a187; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:580
export const RECON____header_global_7f3828c18ad7eb24 = ((((((1960) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4848a77d34b2704fb7d029ba() {
  return __cxx_static_address_4848a77d34b2704fb7d029ba.reference || (__cxx_static_address_4848a77d34b2704fb7d029ba.reference = {
    __cReference: true,
    get value() { return RECON____header_global_7f3828c18ad7eb24; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:581
export const TANK____header_global_8e2be44622da8118 = ((((((1975) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_62df311844d30ec5c3d8678d() {
  return __cxx_static_address_62df311844d30ec5c3d8678d.reference || (__cxx_static_address_62df311844d30ec5c3d8678d.reference = {
    __cReference: true,
    get value() { return TANK____header_global_8e2be44622da8118; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:582
export const PIGCOP____header_global_524bc6c9e8ca6db9 = ((((((2000) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5ab17779cbcb72a9023e81de() {
  return __cxx_static_address_5ab17779cbcb72a9023e81de.reference || (__cxx_static_address_5ab17779cbcb72a9023e81de.reference = {
    __cReference: true,
    get value() { return PIGCOP____header_global_524bc6c9e8ca6db9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:583
export const PIGCOPSTAYPUT____header_global_39c9af62594c1246 = ((((((2001) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1ea9eca3ab4b3112d84f8142() {
  return __cxx_static_address_1ea9eca3ab4b3112d84f8142.reference || (__cxx_static_address_1ea9eca3ab4b3112d84f8142.reference = {
    __cReference: true,
    get value() { return PIGCOPSTAYPUT____header_global_39c9af62594c1246; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:584
export const PIGCOPDIVE____header_global_886419d625348e0e = ((((((2045) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_44b4e6907a7943cb6bb4c777() {
  return __cxx_static_address_44b4e6907a7943cb6bb4c777.reference || (__cxx_static_address_44b4e6907a7943cb6bb4c777.reference = {
    __cReference: true,
    get value() { return PIGCOPDIVE____header_global_886419d625348e0e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:585
export const LIZMAN____header_global_7e50ed8b46f62331 = ((((((2120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a114e4cb23c58e2a64102743() {
  return __cxx_static_address_a114e4cb23c58e2a64102743.reference || (__cxx_static_address_a114e4cb23c58e2a64102743.reference = {
    __cReference: true,
    get value() { return LIZMAN____header_global_7e50ed8b46f62331; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:586
export const LIZMANSTAYPUT____header_global_ea6d6f02e003d1f1 = ((((((2121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2f42826bf2e2e22d516831a8() {
  return __cxx_static_address_2f42826bf2e2e22d516831a8.reference || (__cxx_static_address_2f42826bf2e2e22d516831a8.reference = {
    __cReference: true,
    get value() { return LIZMANSTAYPUT____header_global_ea6d6f02e003d1f1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:587
export const LIZMANSPITTING____header_global_54eb1f690649fa93 = ((((((2150) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_37319b152afb5842c2c2fd54() {
  return __cxx_static_address_37319b152afb5842c2c2fd54.reference || (__cxx_static_address_37319b152afb5842c2c2fd54.reference = {
    __cReference: true,
    get value() { return LIZMANSPITTING____header_global_54eb1f690649fa93; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:588
export const LIZMANFEEDING____header_global_8c88fab117c220c5 = ((((((2160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9289507d17dbc56442e0419b() {
  return __cxx_static_address_9289507d17dbc56442e0419b.reference || (__cxx_static_address_9289507d17dbc56442e0419b.reference = {
    __cReference: true,
    get value() { return LIZMANFEEDING____header_global_8c88fab117c220c5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:589
export const LIZMANJUMP____header_global_14a98d19a61c3ff9 = ((((((2165) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ad29de552d6bd8d04c501ea5() {
  return __cxx_static_address_ad29de552d6bd8d04c501ea5.reference || (__cxx_static_address_ad29de552d6bd8d04c501ea5.reference = {
    __cReference: true,
    get value() { return LIZMANJUMP____header_global_14a98d19a61c3ff9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:590
export const FECES____header_global_bd8963c14b17eddd = ((((((2200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c2e6a9280a49e1b0a66e21ce() {
  return __cxx_static_address_c2e6a9280a49e1b0a66e21ce.reference || (__cxx_static_address_c2e6a9280a49e1b0a66e21ce.reference = {
    __cReference: true,
    get value() { return FECES____header_global_bd8963c14b17eddd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:591
export const LIZMANHEAD1____header_global_b27811536d6845b1 = ((((((2201) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4be947defbe0c03e284d23a7() {
  return __cxx_static_address_4be947defbe0c03e284d23a7.reference || (__cxx_static_address_4be947defbe0c03e284d23a7.reference = {
    __cReference: true,
    get value() { return LIZMANHEAD1____header_global_b27811536d6845b1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:592
export const LIZMANARM1____header_global_64dfc21f582d805d = ((((((2205) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_de3e4ecd939ea0a570c8ed98() {
  return __cxx_static_address_de3e4ecd939ea0a570c8ed98.reference || (__cxx_static_address_de3e4ecd939ea0a570c8ed98.reference = {
    __cReference: true,
    get value() { return LIZMANARM1____header_global_64dfc21f582d805d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:593
export const LIZMANLEG1____header_global_9c561da6686584b6 = ((((((2209) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_46aaf5b1ee5596478900112a() {
  return __cxx_static_address_46aaf5b1ee5596478900112a.reference || (__cxx_static_address_46aaf5b1ee5596478900112a.reference = {
    __cReference: true,
    get value() { return LIZMANLEG1____header_global_9c561da6686584b6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:594
export const EXPLOSION2BOT____header_global_a3099347bd812a23 = ((((((2219) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4c7d048c4b2c4b191b68c112() {
  return __cxx_static_address_4c7d048c4b2c4b191b68c112.reference || (__cxx_static_address_4c7d048c4b2c4b191b68c112.reference = {
    __cReference: true,
    get value() { return EXPLOSION2BOT____header_global_a3099347bd812a23; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:595
export const JIBS1____header_global_cce3e66248327993 = ((((((2245) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9ead83c813a4af243e753c37() {
  return __cxx_static_address_9ead83c813a4af243e753c37.reference || (__cxx_static_address_9ead83c813a4af243e753c37.reference = {
    __cReference: true,
    get value() { return JIBS1____header_global_cce3e66248327993; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:596
export const JIBS2____header_global_c9b14034f2c8da1e = ((((((2250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_74d706193fcbb48c167536d0() {
  return __cxx_static_address_74d706193fcbb48c167536d0.reference || (__cxx_static_address_74d706193fcbb48c167536d0.reference = {
    __cReference: true,
    get value() { return JIBS2____header_global_c9b14034f2c8da1e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:597
export const JIBS3____header_global_a717561af2c64a00 = ((((((2255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0b405d987aefbc4c1180c15c() {
  return __cxx_static_address_0b405d987aefbc4c1180c15c.reference || (__cxx_static_address_0b405d987aefbc4c1180c15c.reference = {
    __cReference: true,
    get value() { return JIBS3____header_global_a717561af2c64a00; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:598
export const JIBS4____header_global_6ae52db5ad2ac087 = ((((((2260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f38f7cc1237832c38afd44f9() {
  return __cxx_static_address_f38f7cc1237832c38afd44f9.reference || (__cxx_static_address_f38f7cc1237832c38afd44f9.reference = {
    __cReference: true,
    get value() { return JIBS4____header_global_6ae52db5ad2ac087; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:599
export const JIBS5____header_global_e9f71a6b7c9b9567 = ((((((2265) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7c84b11b4010c062c7f344e9() {
  return __cxx_static_address_7c84b11b4010c062c7f344e9.reference || (__cxx_static_address_7c84b11b4010c062c7f344e9.reference = {
    __cReference: true,
    get value() { return JIBS5____header_global_e9f71a6b7c9b9567; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:600
export const BURNING____header_global_cd9fe1947446f770 = ((((((2270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1d45e1da7fc5a0da640852f7() {
  return __cxx_static_address_1d45e1da7fc5a0da640852f7.reference || (__cxx_static_address_1d45e1da7fc5a0da640852f7.reference = {
    __cReference: true,
    get value() { return BURNING____header_global_cd9fe1947446f770; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:601
export const FIRE____header_global_70576f3dd8940277 = ((((((2271) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_36238d4713ebde5e23e67c59() {
  return __cxx_static_address_36238d4713ebde5e23e67c59.reference || (__cxx_static_address_36238d4713ebde5e23e67c59.reference = {
    __cReference: true,
    get value() { return FIRE____header_global_70576f3dd8940277; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:602
export const JIBS6____header_global_befc44c61a1bb511 = ((((((2286) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_355c6a069f5bd8aac7eb020f() {
  return __cxx_static_address_355c6a069f5bd8aac7eb020f.reference || (__cxx_static_address_355c6a069f5bd8aac7eb020f.reference = {
    __cReference: true,
    get value() { return JIBS6____header_global_befc44c61a1bb511; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:603
export const BLOODSPLAT1____header_global_089980692fa9275e = ((((((2296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d56676744cc89cae03f70d71() {
  return __cxx_static_address_d56676744cc89cae03f70d71.reference || (__cxx_static_address_d56676744cc89cae03f70d71.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT1____header_global_089980692fa9275e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:604
export const BLOODSPLAT3____header_global_fedd0240f4d81cd6 = ((((((2297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_39d3dc6cee56bd620412ff7d() {
  return __cxx_static_address_39d3dc6cee56bd620412ff7d.reference || (__cxx_static_address_39d3dc6cee56bd620412ff7d.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT3____header_global_fedd0240f4d81cd6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:605
export const BLOODSPLAT2____header_global_4eaca8296f535842 = ((((((2298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_49d036de98cd35b0f6753ef4() {
  return __cxx_static_address_49d036de98cd35b0f6753ef4.reference || (__cxx_static_address_49d036de98cd35b0f6753ef4.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT2____header_global_4eaca8296f535842; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:606
export const BLOODSPLAT4____header_global_94817c9c862991ff = ((((((2299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5ffc03353511440a2ae456bb() {
  return __cxx_static_address_5ffc03353511440a2ae456bb.reference || (__cxx_static_address_5ffc03353511440a2ae456bb.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT4____header_global_94817c9c862991ff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:607
export const OOZ____header_global_8620c6499bed6349 = ((((((2300) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_91472cb5560ec34aed142e59() {
  return __cxx_static_address_91472cb5560ec34aed142e59.reference || (__cxx_static_address_91472cb5560ec34aed142e59.reference = {
    __cReference: true,
    get value() { return OOZ____header_global_8620c6499bed6349; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:608
export const OOZ2____header_global_ccea34e6397398f5 = ((((((2309) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ede523ff8fe43478a1aaf054() {
  return __cxx_static_address_ede523ff8fe43478a1aaf054.reference || (__cxx_static_address_ede523ff8fe43478a1aaf054.reference = {
    __cReference: true,
    get value() { return OOZ2____header_global_ccea34e6397398f5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:609
export const WALLBLOOD1____header_global_e0f163cbcc97c469 = ((((((2301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_25b3f3e0eeeb14803259f347() {
  return __cxx_static_address_25b3f3e0eeeb14803259f347.reference || (__cxx_static_address_25b3f3e0eeeb14803259f347.reference = {
    __cReference: true,
    get value() { return WALLBLOOD1____header_global_e0f163cbcc97c469; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:610
export const WALLBLOOD2____header_global_853a5f9f6c5385bb = ((((((2302) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bb24663284cf686a85068088() {
  return __cxx_static_address_bb24663284cf686a85068088.reference || (__cxx_static_address_bb24663284cf686a85068088.reference = {
    __cReference: true,
    get value() { return WALLBLOOD2____header_global_853a5f9f6c5385bb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:611
export const WALLBLOOD3____header_global_1fe9e038eb33cf26 = ((((((2303) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8adff8f4f66dbe006dbc9f68() {
  return __cxx_static_address_8adff8f4f66dbe006dbc9f68.reference || (__cxx_static_address_8adff8f4f66dbe006dbc9f68.reference = {
    __cReference: true,
    get value() { return WALLBLOOD3____header_global_1fe9e038eb33cf26; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:612
export const WALLBLOOD4____header_global_d912c43807591513 = ((((((2304) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9fa6fac03fa8a2a5a8ce9076() {
  return __cxx_static_address_9fa6fac03fa8a2a5a8ce9076.reference || (__cxx_static_address_9fa6fac03fa8a2a5a8ce9076.reference = {
    __cReference: true,
    get value() { return WALLBLOOD4____header_global_d912c43807591513; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:613
export const WALLBLOOD5____header_global_dfbdc7d6df6be018 = ((((((2305) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c470c984bbc4ce2eeb61874f() {
  return __cxx_static_address_c470c984bbc4ce2eeb61874f.reference || (__cxx_static_address_c470c984bbc4ce2eeb61874f.reference = {
    __cReference: true,
    get value() { return WALLBLOOD5____header_global_dfbdc7d6df6be018; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:614
export const WALLBLOOD7____header_global_9384c0dffa1b5d80 = ((((((2307) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_17eef29fcc75ec3067b31857() {
  return __cxx_static_address_17eef29fcc75ec3067b31857.reference || (__cxx_static_address_17eef29fcc75ec3067b31857.reference = {
    __cReference: true,
    get value() { return WALLBLOOD7____header_global_9384c0dffa1b5d80; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:615
export const WALLBLOOD8____header_global_53e3eb30d1d659f0 = ((((((2308) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_450311fa87ba5caaf69d6f92() {
  return __cxx_static_address_450311fa87ba5caaf69d6f92.reference || (__cxx_static_address_450311fa87ba5caaf69d6f92.reference = {
    __cReference: true,
    get value() { return WALLBLOOD8____header_global_53e3eb30d1d659f0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:616
export const BURNING2____header_global_2b4c59345e2f75a4 = ((((((2310) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e9659d7bf1e9a2e3d3456b3f() {
  return __cxx_static_address_e9659d7bf1e9a2e3d3456b3f.reference || (__cxx_static_address_e9659d7bf1e9a2e3d3456b3f.reference = {
    __cReference: true,
    get value() { return BURNING2____header_global_2b4c59345e2f75a4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:617
export const FIRE2____header_global_89a1f09cf1b82ec9 = ((((((2311) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a385ffe24ca4bf01f5f2527c() {
  return __cxx_static_address_a385ffe24ca4bf01f5f2527c.reference || (__cxx_static_address_a385ffe24ca4bf01f5f2527c.reference = {
    __cReference: true,
    get value() { return FIRE2____header_global_89a1f09cf1b82ec9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:618
export const CRACKKNUCKLES____header_global_f292231150fd140f = ((((((2324) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_582c4d13100df7b14bd205e5() {
  return __cxx_static_address_582c4d13100df7b14bd205e5.reference || (__cxx_static_address_582c4d13100df7b14bd205e5.reference = {
    __cReference: true,
    get value() { return CRACKKNUCKLES____header_global_f292231150fd140f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:619
export const SMALLSMOKE____header_global_327f940100790b3d = ((((((2329) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a470bf27b8fbdb5bb0521de9() {
  return __cxx_static_address_a470bf27b8fbdb5bb0521de9.reference || (__cxx_static_address_a470bf27b8fbdb5bb0521de9.reference = {
    __cReference: true,
    get value() { return SMALLSMOKE____header_global_327f940100790b3d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:620
export const FLOORFLAME____header_global_7d468a253851868a = ((((((2333) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5f52b6c8dc6ce5a022c72196() {
  return __cxx_static_address_5f52b6c8dc6ce5a022c72196.reference || (__cxx_static_address_5f52b6c8dc6ce5a022c72196.reference = {
    __cReference: true,
    get value() { return FLOORFLAME____header_global_7d468a253851868a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:621
export const ROTATEGUN____header_global_3ba58e973cd1ab2b = ((((((2360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aaa661219e3547ba936c0a3e() {
  return __cxx_static_address_aaa661219e3547ba936c0a3e.reference || (__cxx_static_address_aaa661219e3547ba936c0a3e.reference = {
    __cReference: true,
    get value() { return ROTATEGUN____header_global_3ba58e973cd1ab2b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:622
export const GREENSLIME____header_global_02a1a3005e176598 = ((((((2370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6fae3587f13cc0618b3aaf56() {
  return __cxx_static_address_6fae3587f13cc0618b3aaf56.reference || (__cxx_static_address_6fae3587f13cc0618b3aaf56.reference = {
    __cReference: true,
    get value() { return GREENSLIME____header_global_02a1a3005e176598; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:623
export const WATERDRIPSPLASH____header_global_8066dd853841ed02 = ((((((2380) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_69dcca8e28c440d3247582af() {
  return __cxx_static_address_69dcca8e28c440d3247582af.reference || (__cxx_static_address_69dcca8e28c440d3247582af.reference = {
    __cReference: true,
    get value() { return WATERDRIPSPLASH____header_global_8066dd853841ed02; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:624
export const SCRAP6____header_global_10d63f7e82f36160 = ((((((2390) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a58dedf82153945b0da0549e() {
  return __cxx_static_address_a58dedf82153945b0da0549e.reference || (__cxx_static_address_a58dedf82153945b0da0549e.reference = {
    __cReference: true,
    get value() { return SCRAP6____header_global_10d63f7e82f36160; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:625
export const SCRAP1____header_global_2d10431decafa9b2 = ((((((2400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_504c8643cacc9858cc660325() {
  return __cxx_static_address_504c8643cacc9858cc660325.reference || (__cxx_static_address_504c8643cacc9858cc660325.reference = {
    __cReference: true,
    get value() { return SCRAP1____header_global_2d10431decafa9b2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:626
export const SCRAP2____header_global_2d1c725d461beac6 = ((((((2404) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_74f2380435d3a1fbcc2302ae() {
  return __cxx_static_address_74f2380435d3a1fbcc2302ae.reference || (__cxx_static_address_74f2380435d3a1fbcc2302ae.reference = {
    __cReference: true,
    get value() { return SCRAP2____header_global_2d1c725d461beac6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:627
export const SCRAP3____header_global_7c8e429eaea7a93f = ((((((2408) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4e2207a19c7b498c666916b9() {
  return __cxx_static_address_4e2207a19c7b498c666916b9.reference || (__cxx_static_address_4e2207a19c7b498c666916b9.reference = {
    __cReference: true,
    get value() { return SCRAP3____header_global_7c8e429eaea7a93f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:628
export const SCRAP4____header_global_cf23ab8b3a9d0a53 = ((((((2412) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_86a28270b669501cb97ec56a() {
  return __cxx_static_address_86a28270b669501cb97ec56a.reference || (__cxx_static_address_86a28270b669501cb97ec56a.reference = {
    __cReference: true,
    get value() { return SCRAP4____header_global_cf23ab8b3a9d0a53; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:629
export const SCRAP5____header_global_22d7eb1ee23db185 = ((((((2416) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_22b643eab8321e1ce9f6dbaf() {
  return __cxx_static_address_22b643eab8321e1ce9f6dbaf.reference || (__cxx_static_address_22b643eab8321e1ce9f6dbaf.reference = {
    __cReference: true,
    get value() { return SCRAP5____header_global_22d7eb1ee23db185; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:630
export const ORGANTIC____header_global_42f463dee2f343e5 = ((((((2420) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_062d5c1f88b34b75cfaa0896() {
  return __cxx_static_address_062d5c1f88b34b75cfaa0896.reference || (__cxx_static_address_062d5c1f88b34b75cfaa0896.reference = {
    __cReference: true,
    get value() { return ORGANTIC____header_global_42f463dee2f343e5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:631
export const BETAVERSION____header_global_c4936a365f1b26e6 = ((((((2440) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cbb1b4858e84399f37a32f3e() {
  return __cxx_static_address_cbb1b4858e84399f37a32f3e.reference || (__cxx_static_address_cbb1b4858e84399f37a32f3e.reference = {
    __cReference: true,
    get value() { return BETAVERSION____header_global_c4936a365f1b26e6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:632
export const SELECTDIR____header_global_a6b1b960f4042631 = ((((((2444) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_01e2fa93be759c466369658a() {
  return __cxx_static_address_01e2fa93be759c466369658a.reference || (__cxx_static_address_01e2fa93be759c466369658a.reference = {
    __cReference: true,
    get value() { return SELECTDIR____header_global_a6b1b960f4042631; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:633
export const F1HELP____header_global_8febf7e45d9bad2e = ((((((2445) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_49efaa005ed417851e2110d2() {
  return __cxx_static_address_49efaa005ed417851e2110d2.reference || (__cxx_static_address_49efaa005ed417851e2110d2.reference = {
    __cReference: true,
    get value() { return F1HELP____header_global_8febf7e45d9bad2e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:634
export const GROWSPARK____header_global_682a3b23716c03ae = ((((((2448) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b9b78b6025dda42854313401() {
  return __cxx_static_address_b9b78b6025dda42854313401.reference || (__cxx_static_address_b9b78b6025dda42854313401.reference = {
    __cReference: true,
    get value() { return GROWSPARK____header_global_682a3b23716c03ae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:635
export const MENUSCREEN____header_global_2cbf2bba062c5d3f = ((((((2456) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_31c9c7aaef845c1c0b35c99c() {
  return __cxx_static_address_31c9c7aaef845c1c0b35c99c.reference || (__cxx_static_address_31c9c7aaef845c1c0b35c99c.reference = {
    __cReference: true,
    get value() { return MENUSCREEN____header_global_2cbf2bba062c5d3f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:636
export const MENUBAR____header_global_84db1f3c6d728937 = ((((((2457) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c05a749c3782564196e198b1() {
  return __cxx_static_address_c05a749c3782564196e198b1.reference || (__cxx_static_address_c05a749c3782564196e198b1.reference = {
    __cReference: true,
    get value() { return MENUBAR____header_global_84db1f3c6d728937; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:637
export const KILLSICON____header_global_513cf2e0f650ea36 = ((((((2458) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_918ab9ef1d92aa04b598fd13() {
  return __cxx_static_address_918ab9ef1d92aa04b598fd13.reference || (__cxx_static_address_918ab9ef1d92aa04b598fd13.reference = {
    __cReference: true,
    get value() { return KILLSICON____header_global_513cf2e0f650ea36; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:638
export const FIRSTAID_ICON____header_global_cd793742db9e3f8e = ((((((2460) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_af25f539337f8a72bfc74456() {
  return __cxx_static_address_af25f539337f8a72bfc74456.reference || (__cxx_static_address_af25f539337f8a72bfc74456.reference = {
    __cReference: true,
    get value() { return FIRSTAID_ICON____header_global_cd793742db9e3f8e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:639
export const HEAT_ICON____header_global_b05cc17eb41dd980 = ((((((2461) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2038ec5032555e8ba874e457() {
  return __cxx_static_address_2038ec5032555e8ba874e457.reference || (__cxx_static_address_2038ec5032555e8ba874e457.reference = {
    __cReference: true,
    get value() { return HEAT_ICON____header_global_b05cc17eb41dd980; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:640
export const BOTTOMSTATUSBAR____header_global_f2638f5e0d27d43a = ((((((2462) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_62887e7c2d6eab23da912431() {
  return __cxx_static_address_62887e7c2d6eab23da912431.reference || (__cxx_static_address_62887e7c2d6eab23da912431.reference = {
    __cReference: true,
    get value() { return BOTTOMSTATUSBAR____header_global_f2638f5e0d27d43a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:641
export const BOOT_ICON____header_global_7bd995765627e632 = ((((((2463) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ee4743038e215dbae3458186() {
  return __cxx_static_address_ee4743038e215dbae3458186.reference || (__cxx_static_address_ee4743038e215dbae3458186.reference = {
    __cReference: true,
    get value() { return BOOT_ICON____header_global_7bd995765627e632; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:642
export const FRAGBAR____header_global_4d04c39ca984b570 = ((((((2465) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f61dec432dc8e235b71bdc23() {
  return __cxx_static_address_f61dec432dc8e235b71bdc23.reference || (__cxx_static_address_f61dec432dc8e235b71bdc23.reference = {
    __cReference: true,
    get value() { return FRAGBAR____header_global_4d04c39ca984b570; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:643
export const JETPACK_ICON____header_global_0b478cbb358ac2ba = ((((((2467) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_61d7c288f18e5e842c346923() {
  return __cxx_static_address_61d7c288f18e5e842c346923.reference || (__cxx_static_address_61d7c288f18e5e842c346923.reference = {
    __cReference: true,
    get value() { return JETPACK_ICON____header_global_0b478cbb358ac2ba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:644
export const AIRTANK_ICON____header_global_f9cea159debd0c0d = ((((((2468) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dee92540fc4de13a037f1c1c() {
  return __cxx_static_address_dee92540fc4de13a037f1c1c.reference || (__cxx_static_address_dee92540fc4de13a037f1c1c.reference = {
    __cReference: true,
    get value() { return AIRTANK_ICON____header_global_f9cea159debd0c0d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:645
export const STEROIDS_ICON____header_global_064c4f9b3ddd0b21 = ((((((2469) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_14e69c36c0525e12af752c27() {
  return __cxx_static_address_14e69c36c0525e12af752c27.reference || (__cxx_static_address_14e69c36c0525e12af752c27.reference = {
    __cReference: true,
    get value() { return STEROIDS_ICON____header_global_064c4f9b3ddd0b21; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:646
export const HOLODUKE_ICON____header_global_1dcf6cb981ab5a23 = ((((((2470) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c5a43e92f146a53e6319d151() {
  return __cxx_static_address_c5a43e92f146a53e6319d151.reference || (__cxx_static_address_c5a43e92f146a53e6319d151.reference = {
    __cReference: true,
    get value() { return HOLODUKE_ICON____header_global_1dcf6cb981ab5a23; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:647
export const ACCESS_ICON____header_global_dd9ac5801a99a055 = ((((((2471) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c74e5ea164b7468e3ef7371c() {
  return __cxx_static_address_c74e5ea164b7468e3ef7371c.reference || (__cxx_static_address_c74e5ea164b7468e3ef7371c.reference = {
    __cReference: true,
    get value() { return ACCESS_ICON____header_global_dd9ac5801a99a055; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:648
export const DIGITALNUM____header_global_fbae4ec0a30d806e = ((((((2472) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_51c98541dcd9fad7cdac9288() {
  return __cxx_static_address_51c98541dcd9fad7cdac9288.reference || (__cxx_static_address_51c98541dcd9fad7cdac9288.reference = {
    __cReference: true,
    get value() { return DIGITALNUM____header_global_fbae4ec0a30d806e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:649
export const DUKECAR____header_global_84e82075dd11fcfd = ((((((2491) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c0d95dbdb0f9542975ecb129() {
  return __cxx_static_address_c0d95dbdb0f9542975ecb129.reference || (__cxx_static_address_c0d95dbdb0f9542975ecb129.reference = {
    __cReference: true,
    get value() { return DUKECAR____header_global_84e82075dd11fcfd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:650
export const CAMCORNER____header_global_c9fccb3da514e62a = ((((((2482) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6e1c73a42ff5e3596770725b() {
  return __cxx_static_address_6e1c73a42ff5e3596770725b.reference || (__cxx_static_address_6e1c73a42ff5e3596770725b.reference = {
    __cReference: true,
    get value() { return CAMCORNER____header_global_c9fccb3da514e62a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:651
export const CAMLIGHT____header_global_3964af1ee40d7914 = ((((((2484) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dbcda6ad609c798cbb4cfdac() {
  return __cxx_static_address_dbcda6ad609c798cbb4cfdac.reference || (__cxx_static_address_dbcda6ad609c798cbb4cfdac.reference = {
    __cReference: true,
    get value() { return CAMLIGHT____header_global_3964af1ee40d7914; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:652
export const SLIDEBAR____header_global_f67f84f8f4e2abfd = ((((((2489) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0fcc00b67f888745822462ca() {
  return __cxx_static_address_0fcc00b67f888745822462ca.reference || (__cxx_static_address_0fcc00b67f888745822462ca.reference = {
    __cReference: true,
    get value() { return SLIDEBAR____header_global_f67f84f8f4e2abfd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:653
export const DREALMS____header_global_6e7ad434d3b13b2b = ((((((2492) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e04c7c65733ab82d6d87f14e() {
  return __cxx_static_address_e04c7c65733ab82d6d87f14e.reference || (__cxx_static_address_e04c7c65733ab82d6d87f14e.reference = {
    __cReference: true,
    get value() { return DREALMS____header_global_6e7ad434d3b13b2b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:654
export const BETASCREEN____header_global_156148e1ae4bea58 = ((((((2493) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b17590d2fbed588912d22000() {
  return __cxx_static_address_b17590d2fbed588912d22000.reference || (__cxx_static_address_b17590d2fbed588912d22000.reference = {
    __cReference: true,
    get value() { return BETASCREEN____header_global_156148e1ae4bea58; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:655
export const WINDOWBORDER1____header_global_f4fad0e2b0ff7937 = ((((((2494) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a7c3d4d059c28b5773a84d47() {
  return __cxx_static_address_a7c3d4d059c28b5773a84d47.reference || (__cxx_static_address_a7c3d4d059c28b5773a84d47.reference = {
    __cReference: true,
    get value() { return WINDOWBORDER1____header_global_f4fad0e2b0ff7937; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:656
export const TEXTBOX____header_global_25348d1ca2120e0f = ((((((2495) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_810fd05750e52e86674fd748() {
  return __cxx_static_address_810fd05750e52e86674fd748.reference || (__cxx_static_address_810fd05750e52e86674fd748.reference = {
    __cReference: true,
    get value() { return TEXTBOX____header_global_25348d1ca2120e0f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:657
export const WINDOWBORDER2____header_global_1dac53ec1d9a2bc9 = ((((((2496) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d727a9d6b15f33b7ddc7ac5e() {
  return __cxx_static_address_d727a9d6b15f33b7ddc7ac5e.reference || (__cxx_static_address_d727a9d6b15f33b7ddc7ac5e.reference = {
    __cReference: true,
    get value() { return WINDOWBORDER2____header_global_1dac53ec1d9a2bc9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:658
export const DUKENUKEM____header_global_d40a51d10d57701d = ((((((2497) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a0db10a14005fdfdc7e9e04f() {
  return __cxx_static_address_a0db10a14005fdfdc7e9e04f.reference || (__cxx_static_address_a0db10a14005fdfdc7e9e04f.reference = {
    __cReference: true,
    get value() { return DUKENUKEM____header_global_d40a51d10d57701d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:659
export const THREEDEE____header_global_b182b2551eeb0046 = ((((((2498) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6b346fcae0b5c110f14a3c85() {
  return __cxx_static_address_6b346fcae0b5c110f14a3c85.reference || (__cxx_static_address_6b346fcae0b5c110f14a3c85.reference = {
    __cReference: true,
    get value() { return THREEDEE____header_global_b182b2551eeb0046; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:660
export const INGAMEDUKETHREEDEE____header_global_f787ef7bc59412be = ((((((2499) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_453fd0e846f3ea0f118613f4() {
  return __cxx_static_address_453fd0e846f3ea0f118613f4.reference || (__cxx_static_address_453fd0e846f3ea0f118613f4.reference = {
    __cReference: true,
    get value() { return INGAMEDUKETHREEDEE____header_global_f787ef7bc59412be; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:661
export const TENSCREEN____header_global_a30a97fff38bd330 = ((((((2500) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_881ed94763b4bcf61e45a5eb() {
  return __cxx_static_address_881ed94763b4bcf61e45a5eb.reference || (__cxx_static_address_881ed94763b4bcf61e45a5eb.reference = {
    __cReference: true,
    get value() { return TENSCREEN____header_global_a30a97fff38bd330; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:662
export const PLUTOPAKSPRITE____header_global_9d533d30543404a7 = ((((((2501) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f9900aeeab8a41a05ce4f09e() {
  return __cxx_static_address_f9900aeeab8a41a05ce4f09e.reference || (__cxx_static_address_f9900aeeab8a41a05ce4f09e.reference = {
    __cReference: true,
    get value() { return PLUTOPAKSPRITE____header_global_9d533d30543404a7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:663
export const DEVISTATOR____header_global_a0ca0dfd5a70e884 = ((((((2510) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f39bfbe9718a25b5a4189afd() {
  return __cxx_static_address_f39bfbe9718a25b5a4189afd.reference || (__cxx_static_address_f39bfbe9718a25b5a4189afd.reference = {
    __cReference: true,
    get value() { return DEVISTATOR____header_global_a0ca0dfd5a70e884; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:664
export const KNEE____header_global_64c9e05c6ac7a4e1 = ((((((2521) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0515bc7b2f18d2518ed60bd4() {
  return __cxx_static_address_0515bc7b2f18d2518ed60bd4.reference || (__cxx_static_address_0515bc7b2f18d2518ed60bd4.reference = {
    __cReference: true,
    get value() { return KNEE____header_global_64c9e05c6ac7a4e1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:665
export const CROSSHAIR____header_global_d7eb13a658614f45 = ((((((2523) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3acf2592d1007505d70ea015() {
  return __cxx_static_address_3acf2592d1007505d70ea015.reference || (__cxx_static_address_3acf2592d1007505d70ea015.reference = {
    __cReference: true,
    get value() { return CROSSHAIR____header_global_d7eb13a658614f45; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:666
export const FIRSTGUN____header_global_090e5ccf6601bee6 = ((((((2524) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4bbb0df573b4947a4e5dc826() {
  return __cxx_static_address_4bbb0df573b4947a4e5dc826.reference || (__cxx_static_address_4bbb0df573b4947a4e5dc826.reference = {
    __cReference: true,
    get value() { return FIRSTGUN____header_global_090e5ccf6601bee6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:667
export const FIRSTGUNRELOAD____header_global_82e9170959fbec0e = ((((((2528) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2330603af6bae41b1fb00b96() {
  return __cxx_static_address_2330603af6bae41b1fb00b96.reference || (__cxx_static_address_2330603af6bae41b1fb00b96.reference = {
    __cReference: true,
    get value() { return FIRSTGUNRELOAD____header_global_82e9170959fbec0e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:668
export const SHELL____header_global_a8f9f877c9f16b55 = ((((((2533) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_78c6988e4bde231084f3bb7c() {
  return __cxx_static_address_78c6988e4bde231084f3bb7c.reference || (__cxx_static_address_78c6988e4bde231084f3bb7c.reference = {
    __cReference: true,
    get value() { return SHELL____header_global_a8f9f877c9f16b55; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:669
export const SHOTGUNSHELL____header_global_31ee7ec7e3428ab6 = ((((((2535) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_77ad0e1c8de9b54d6a2c7008() {
  return __cxx_static_address_77ad0e1c8de9b54d6a2c7008.reference || (__cxx_static_address_77ad0e1c8de9b54d6a2c7008.reference = {
    __cReference: true,
    get value() { return SHOTGUNSHELL____header_global_31ee7ec7e3428ab6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:670
export const CHAINGUN____header_global_7e6d9bc8b71c77e3 = ((((((2536) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_69e69a2011a4596fe5e818fe() {
  return __cxx_static_address_69e69a2011a4596fe5e818fe.reference || (__cxx_static_address_69e69a2011a4596fe5e818fe.reference = {
    __cReference: true,
    get value() { return CHAINGUN____header_global_7e6d9bc8b71c77e3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:671
export const RPGGUN____header_global_8e8d63add59e8d6e = ((((((2544) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c675dc89820163916c73d01a() {
  return __cxx_static_address_c675dc89820163916c73d01a.reference || (__cxx_static_address_c675dc89820163916c73d01a.reference = {
    __cReference: true,
    get value() { return RPGGUN____header_global_8e8d63add59e8d6e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:672
export const FREEZE____header_global_99ecf4117f493061 = ((((((2548) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_12f6efb51db729dda852a38d() {
  return __cxx_static_address_12f6efb51db729dda852a38d.reference || (__cxx_static_address_12f6efb51db729dda852a38d.reference = {
    __cReference: true,
    get value() { return FREEZE____header_global_99ecf4117f493061; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:673
export const SHRINKER____header_global_87954ae012f69d38 = ((((((2556) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_141b7deb9ede93459c3c3e41() {
  return __cxx_static_address_141b7deb9ede93459c3c3e41.reference || (__cxx_static_address_141b7deb9ede93459c3c3e41.reference = {
    __cReference: true,
    get value() { return SHRINKER____header_global_87954ae012f69d38; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:674
export const HANDHOLDINGLASER____header_global_e00a030b9107064f = ((((((2563) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9f4747b6fbb27ce73838bbe2() {
  return __cxx_static_address_9f4747b6fbb27ce73838bbe2.reference || (__cxx_static_address_9f4747b6fbb27ce73838bbe2.reference = {
    __cReference: true,
    get value() { return HANDHOLDINGLASER____header_global_e00a030b9107064f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:675
export const TRIPBOMB____header_global_4f4368184aa47a5c = ((((((2566) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3a88a68e7942c6797c506155() {
  return __cxx_static_address_3a88a68e7942c6797c506155.reference || (__cxx_static_address_3a88a68e7942c6797c506155.reference = {
    __cReference: true,
    get value() { return TRIPBOMB____header_global_4f4368184aa47a5c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:676
export const LASERLINE____header_global_22950b3fd06abc15 = ((((((2567) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0cb041985e8e247c55d8396f() {
  return __cxx_static_address_0cb041985e8e247c55d8396f.reference || (__cxx_static_address_0cb041985e8e247c55d8396f.reference = {
    __cReference: true,
    get value() { return LASERLINE____header_global_22950b3fd06abc15; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:677
export const HANDHOLDINGACCESS____header_global_4f83edfe5f2fd1be = ((((((2568) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eab614b393d936ccd36b9ff9() {
  return __cxx_static_address_eab614b393d936ccd36b9ff9.reference || (__cxx_static_address_eab614b393d936ccd36b9ff9.reference = {
    __cReference: true,
    get value() { return HANDHOLDINGACCESS____header_global_4f83edfe5f2fd1be; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:678
export const HANDREMOTE____header_global_e79e828b5ec854b7 = ((((((2570) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_255947e7e7e75b8c586c9ecc() {
  return __cxx_static_address_255947e7e7e75b8c586c9ecc.reference || (__cxx_static_address_255947e7e7e75b8c586c9ecc.reference = {
    __cReference: true,
    get value() { return HANDREMOTE____header_global_e79e828b5ec854b7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:679
export const HANDTHROW____header_global_4adf1f4212ddf2c2 = ((((((2573) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a0df7e681a624f4b04d78ab9() {
  return __cxx_static_address_a0df7e681a624f4b04d78ab9.reference || (__cxx_static_address_a0df7e681a624f4b04d78ab9.reference = {
    __cReference: true,
    get value() { return HANDTHROW____header_global_4adf1f4212ddf2c2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:680
export const TIP____header_global_cf3764f61aa10fef = ((((((2576) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8992be70116967d65c6d5c5f() {
  return __cxx_static_address_8992be70116967d65c6d5c5f.reference || (__cxx_static_address_8992be70116967d65c6d5c5f.reference = {
    __cReference: true,
    get value() { return TIP____header_global_cf3764f61aa10fef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:681
export const SCUBAMASK____header_global_085afa90d2d78bc5 = ((((((2581) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ceaf482dc80e456fad04a9cb() {
  return __cxx_static_address_ceaf482dc80e456fad04a9cb.reference || (__cxx_static_address_ceaf482dc80e456fad04a9cb.reference = {
    __cReference: true,
    get value() { return SCUBAMASK____header_global_085afa90d2d78bc5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:682
export const FORCESPHERE____header_global_ff235979e0cd28b7 = ((((((2590) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1a367ccbffbd17912b3b9424() {
  return __cxx_static_address_1a367ccbffbd17912b3b9424.reference || (__cxx_static_address_1a367ccbffbd17912b3b9424.reference = {
    __cReference: true,
    get value() { return FORCESPHERE____header_global_ff235979e0cd28b7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:683
export const SHOTSPARK1____header_global_ad751e4b3e7e74b5 = ((((((2595) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_48e3cafc2dc75162becea96f() {
  return __cxx_static_address_48e3cafc2dc75162becea96f.reference || (__cxx_static_address_48e3cafc2dc75162becea96f.reference = {
    __cReference: true,
    get value() { return SHOTSPARK1____header_global_ad751e4b3e7e74b5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:684
export const RPG____header_global_b5996448f42a983f = ((((((2605) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_69309d095b7663ef1533466e() {
  return __cxx_static_address_69309d095b7663ef1533466e.reference || (__cxx_static_address_69309d095b7663ef1533466e.reference = {
    __cReference: true,
    get value() { return RPG____header_global_b5996448f42a983f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:685
export const LASERSITE____header_global_f56b73e6b88cd5ce = ((((((2612) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a4ae4a5a45ae225bd03f8f9c() {
  return __cxx_static_address_a4ae4a5a45ae225bd03f8f9c.reference || (__cxx_static_address_a4ae4a5a45ae225bd03f8f9c.reference = {
    __cReference: true,
    get value() { return LASERSITE____header_global_f56b73e6b88cd5ce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:686
export const SHOTGUN____header_global_f6fbb34e5368d15a = ((((((2613) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1a93437e5a0d76989d84eb27() {
  return __cxx_static_address_1a93437e5a0d76989d84eb27.reference || (__cxx_static_address_1a93437e5a0d76989d84eb27.reference = {
    __cReference: true,
    get value() { return SHOTGUN____header_global_f6fbb34e5368d15a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:687
export const BOSS1____header_global_a703fc721053194c = ((((((2630) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8b400e56e080829041a71b1f() {
  return __cxx_static_address_8b400e56e080829041a71b1f.reference || (__cxx_static_address_8b400e56e080829041a71b1f.reference = {
    __cReference: true,
    get value() { return BOSS1____header_global_a703fc721053194c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:688
export const BOSS1STAYPUT____header_global_feaa4230a4626aab = ((((((2631) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_651a5a4e162d658cad1b6e8d() {
  return __cxx_static_address_651a5a4e162d658cad1b6e8d.reference || (__cxx_static_address_651a5a4e162d658cad1b6e8d.reference = {
    __cReference: true,
    get value() { return BOSS1STAYPUT____header_global_feaa4230a4626aab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:689
export const BOSS1SHOOT____header_global_2121aaa0a4e3d544 = ((((((2660) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4fd56dadd860d02134ba1a36() {
  return __cxx_static_address_4fd56dadd860d02134ba1a36.reference || (__cxx_static_address_4fd56dadd860d02134ba1a36.reference = {
    __cReference: true,
    get value() { return BOSS1SHOOT____header_global_2121aaa0a4e3d544; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:690
export const BOSS1LOB____header_global_1624d5fe6f19ebd6 = ((((((2670) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d113cffa90b499c4a9f82d2b() {
  return __cxx_static_address_d113cffa90b499c4a9f82d2b.reference || (__cxx_static_address_d113cffa90b499c4a9f82d2b.reference = {
    __cReference: true,
    get value() { return BOSS1LOB____header_global_1624d5fe6f19ebd6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:691
export const BOSSTOP____header_global_bde842282a33a4c3 = ((((((2696) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0d01254cd68d24caef67c8f7() {
  return __cxx_static_address_0d01254cd68d24caef67c8f7.reference || (__cxx_static_address_0d01254cd68d24caef67c8f7.reference = {
    __cReference: true,
    get value() { return BOSSTOP____header_global_bde842282a33a4c3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:692
export const BOSS2____header_global_8e83195220822d76 = ((((((2710) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ae18f47d93689d1567394f3d() {
  return __cxx_static_address_ae18f47d93689d1567394f3d.reference || (__cxx_static_address_ae18f47d93689d1567394f3d.reference = {
    __cReference: true,
    get value() { return BOSS2____header_global_8e83195220822d76; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:693
export const BOSS3____header_global_f6293e68c554198f = ((((((2760) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_62343a22133e6b82e9fba008() {
  return __cxx_static_address_62343a22133e6b82e9fba008.reference || (__cxx_static_address_62343a22133e6b82e9fba008.reference = {
    __cReference: true,
    get value() { return BOSS3____header_global_f6293e68c554198f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:694
export const SPINNINGNUKEICON____header_global_4d1821e38464e494 = ((((((2813) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c1ffeac3b0921ba4cfe12863() {
  return __cxx_static_address_c1ffeac3b0921ba4cfe12863.reference || (__cxx_static_address_c1ffeac3b0921ba4cfe12863.reference = {
    __cReference: true,
    get value() { return SPINNINGNUKEICON____header_global_4d1821e38464e494; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:695
export const SMALLFNTCURSOR____header_global_74413089d4b340fb = ((((((2821) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fcb31daf2d68677b60c3efd3() {
  return __cxx_static_address_fcb31daf2d68677b60c3efd3.reference || (__cxx_static_address_fcb31daf2d68677b60c3efd3.reference = {
    __cReference: true,
    get value() { return SMALLFNTCURSOR____header_global_74413089d4b340fb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:696
export const STARTALPHANUM____header_global_ac10d0839fd0f321 = ((((((2822) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e7d49cfa395a7d1138500c1d() {
  return __cxx_static_address_e7d49cfa395a7d1138500c1d.reference || (__cxx_static_address_e7d49cfa395a7d1138500c1d.reference = {
    __cReference: true,
    get value() { return STARTALPHANUM____header_global_ac10d0839fd0f321; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:697
export const ENDALPHANUM____header_global_04db9ff468455d77 = ((((((2915) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1954f1d723182df9563df01f() {
  return __cxx_static_address_1954f1d723182df9563df01f.reference || (__cxx_static_address_1954f1d723182df9563df01f.reference = {
    __cReference: true,
    get value() { return ENDALPHANUM____header_global_04db9ff468455d77; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:698
export const BIGALPHANUM____header_global_25b6caa9aea5d892 = ((((((2940) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9b8f95693d067d4ba166f4c3() {
  return __cxx_static_address_9b8f95693d067d4ba166f4c3.reference || (__cxx_static_address_9b8f95693d067d4ba166f4c3.reference = {
    __cReference: true,
    get value() { return BIGALPHANUM____header_global_25b6caa9aea5d892; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:699
export const BIGPERIOD____header_global_1afd99e7d8c4cb39 = ((((((3002) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_86087c42b58dfdaa367eb427() {
  return __cxx_static_address_86087c42b58dfdaa367eb427.reference || (__cxx_static_address_86087c42b58dfdaa367eb427.reference = {
    __cReference: true,
    get value() { return BIGPERIOD____header_global_1afd99e7d8c4cb39; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:700
export const BIGCOMMA____header_global_afeadc6cc6533520 = ((((((3003) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6259f7d6d779ee1e9deb516d() {
  return __cxx_static_address_6259f7d6d779ee1e9deb516d.reference || (__cxx_static_address_6259f7d6d779ee1e9deb516d.reference = {
    __cReference: true,
    get value() { return BIGCOMMA____header_global_afeadc6cc6533520; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:701
export const BIGX____header_global_7b58fecabfb4a0c5 = ((((((3004) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f2b29b23ea777228c46f4f43() {
  return __cxx_static_address_f2b29b23ea777228c46f4f43.reference || (__cxx_static_address_f2b29b23ea777228c46f4f43.reference = {
    __cReference: true,
    get value() { return BIGX____header_global_7b58fecabfb4a0c5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:702
export const BIGQ____header_global_00ed8f095e6012d0 = ((((((3005) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5837d104f9815d665d4425d8() {
  return __cxx_static_address_5837d104f9815d665d4425d8.reference || (__cxx_static_address_5837d104f9815d665d4425d8.reference = {
    __cReference: true,
    get value() { return BIGQ____header_global_00ed8f095e6012d0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:703
export const BIGSEMI____header_global_4abd85c2721774ef = ((((((3006) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7dfc42a84c4d1f418cc967cd() {
  return __cxx_static_address_7dfc42a84c4d1f418cc967cd.reference || (__cxx_static_address_7dfc42a84c4d1f418cc967cd.reference = {
    __cReference: true,
    get value() { return BIGSEMI____header_global_4abd85c2721774ef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:704
export const BIGCOLIN____header_global_bd546951c55e7208 = ((((((3007) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e4b3807dd7a9450a630cbc00() {
  return __cxx_static_address_e4b3807dd7a9450a630cbc00.reference || (__cxx_static_address_e4b3807dd7a9450a630cbc00.reference = {
    __cReference: true,
    get value() { return BIGCOLIN____header_global_bd546951c55e7208; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:705
export const THREEBYFIVE____header_global_ac86542acf6b7b37 = ((((((3010) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2583937e83e0c6903db43fb2() {
  return __cxx_static_address_2583937e83e0c6903db43fb2.reference || (__cxx_static_address_2583937e83e0c6903db43fb2.reference = {
    __cReference: true,
    get value() { return THREEBYFIVE____header_global_ac86542acf6b7b37; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:706
export const BIGAPPOS____header_global_799734c1a2e242aa = ((((((3022) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c8d63f38725f3b31dc8b0faf() {
  return __cxx_static_address_c8d63f38725f3b31dc8b0faf.reference || (__cxx_static_address_c8d63f38725f3b31dc8b0faf.reference = {
    __cReference: true,
    get value() { return BIGAPPOS____header_global_799734c1a2e242aa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:707
export const MINIFONT____header_global_151c60f0a3bd3732 = ((((((3072) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_74d4d70d40484124b8fbfa3f() {
  return __cxx_static_address_74d4d70d40484124b8fbfa3f.reference || (__cxx_static_address_74d4d70d40484124b8fbfa3f.reference = {
    __cReference: true,
    get value() { return MINIFONT____header_global_151c60f0a3bd3732; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:708
export const RESPAWNMARKERRED____header_global_eeabca376fe277be = ((((((3190) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ab8030026dcbec3e250cb3dc() {
  return __cxx_static_address_ab8030026dcbec3e250cb3dc.reference || (__cxx_static_address_ab8030026dcbec3e250cb3dc.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERRED____header_global_eeabca376fe277be; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:709
export const RESPAWNMARKERYELLOW____header_global_29b7898f9f76aedd = ((((((3200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d56757adbaacedc2c26f87e3() {
  return __cxx_static_address_d56757adbaacedc2c26f87e3.reference || (__cxx_static_address_d56757adbaacedc2c26f87e3.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERYELLOW____header_global_29b7898f9f76aedd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:710
export const RESPAWNMARKERGREEN____header_global_e879ccac527262c8 = ((((((3210) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_46b3f99d0eb212752db346f4() {
  return __cxx_static_address_46b3f99d0eb212752db346f4.reference || (__cxx_static_address_46b3f99d0eb212752db346f4.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERGREEN____header_global_e879ccac527262c8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:711
export const BONUSSCREEN____header_global_78c7a32c4020e3fc = ((((((3240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0ec544bb341167343e12b911() {
  return __cxx_static_address_0ec544bb341167343e12b911.reference || (__cxx_static_address_0ec544bb341167343e12b911.reference = {
    __cReference: true,
    get value() { return BONUSSCREEN____header_global_78c7a32c4020e3fc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:712
export const VIEWBORDER____header_global_33da5e2cf4b65ff2 = ((((((3250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6ed4f13e2ae63ff4157ac0d7() {
  return __cxx_static_address_6ed4f13e2ae63ff4157ac0d7.reference || (__cxx_static_address_6ed4f13e2ae63ff4157ac0d7.reference = {
    __cReference: true,
    get value() { return VIEWBORDER____header_global_33da5e2cf4b65ff2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:713
export const VICTORY1____header_global_edde57bf64864c9a = ((((((3260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_061d396dfcd27c3d362b3314() {
  return __cxx_static_address_061d396dfcd27c3d362b3314.reference || (__cxx_static_address_061d396dfcd27c3d362b3314.reference = {
    __cReference: true,
    get value() { return VICTORY1____header_global_edde57bf64864c9a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:714
export const ORDERING____header_global_a336a5594b87368a = ((((((3270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bf2b00ff17bcd1cd5375c931() {
  return __cxx_static_address_bf2b00ff17bcd1cd5375c931.reference || (__cxx_static_address_bf2b00ff17bcd1cd5375c931.reference = {
    __cReference: true,
    get value() { return ORDERING____header_global_a336a5594b87368a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:715
export const TEXTSTORY____header_global_fd477af39033394e = ((((((3280) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e6e1a68b508cf8ca155f907d() {
  return __cxx_static_address_e6e1a68b508cf8ca155f907d.reference || (__cxx_static_address_e6e1a68b508cf8ca155f907d.reference = {
    __cReference: true,
    get value() { return TEXTSTORY____header_global_fd477af39033394e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:716
export const LOADSCREEN____header_global_ca97809d44f88de2 = ((((((3281) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7d2d8f55c0ee9ec9ce34b9e8() {
  return __cxx_static_address_7d2d8f55c0ee9ec9ce34b9e8.reference || (__cxx_static_address_7d2d8f55c0ee9ec9ce34b9e8.reference = {
    __cReference: true,
    get value() { return LOADSCREEN____header_global_ca97809d44f88de2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:717
export const BORNTOBEWILDSCREEN____header_global_fa991f3615d02fec = ((((((3370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dbfe22a6decc4f604ffe8939() {
  return __cxx_static_address_dbfe22a6decc4f604ffe8939.reference || (__cxx_static_address_dbfe22a6decc4f604ffe8939.reference = {
    __cReference: true,
    get value() { return BORNTOBEWILDSCREEN____header_global_fa991f3615d02fec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:718
export const BLIMP____header_global_e9961d8d8207a25b = ((((((3400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e372a60038b675e4aef0736e() {
  return __cxx_static_address_e372a60038b675e4aef0736e.reference || (__cxx_static_address_e372a60038b675e4aef0736e.reference = {
    __cReference: true,
    get value() { return BLIMP____header_global_e9961d8d8207a25b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:719
export const FEM9____header_global_c6fab44d77337772 = ((((((3450) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d7a1239337c1e4257a7825d5() {
  return __cxx_static_address_d7a1239337c1e4257a7825d5.reference || (__cxx_static_address_d7a1239337c1e4257a7825d5.reference = {
    __cReference: true,
    get value() { return FEM9____header_global_c6fab44d77337772; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:720
export const FRAMEEFFECT1_13____header_global_68f9e51d44ae9e0b = ((((((3999) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fcbe762831a506b80fc90f53() {
  return __cxx_static_address_fcbe762831a506b80fc90f53.reference || (__cxx_static_address_fcbe762831a506b80fc90f53.reference = {
    __cReference: true,
    get value() { return FRAMEEFFECT1_13____header_global_68f9e51d44ae9e0b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:721
export const FRAMEEFFECT1____header_global_ab226f3d07368b7d = ((((((4095) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e1eb86a40826c5e66814a930() {
  return __cxx_static_address_e1eb86a40826c5e66814a930.reference || (__cxx_static_address_e1eb86a40826c5e66814a930.reference = {
    __cReference: true,
    get value() { return FRAMEEFFECT1____header_global_ab226f3d07368b7d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:722
export const PANNEL3____header_global_4879b07d0765b3c1 = ((((((4099) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_de1da6c94a089b71c0795845() {
  return __cxx_static_address_de1da6c94a089b71c0795845.reference || (__cxx_static_address_de1da6c94a089b71c0795845.reference = {
    __cReference: true,
    get value() { return PANNEL3____header_global_4879b07d0765b3c1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:723
export const SCREENBREAK14____header_global_505507a57a9da4fd = ((((((4120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c4920e02e777f20a91e17645() {
  return __cxx_static_address_c4920e02e777f20a91e17645.reference || (__cxx_static_address_c4920e02e777f20a91e17645.reference = {
    __cReference: true,
    get value() { return SCREENBREAK14____header_global_505507a57a9da4fd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:724
export const SCREENBREAK15____header_global_e100389cff9d3069 = ((((((4123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c7546c5aac073df7f3d1f933() {
  return __cxx_static_address_c7546c5aac073df7f3d1f933.reference || (__cxx_static_address_c7546c5aac073df7f3d1f933.reference = {
    __cReference: true,
    get value() { return SCREENBREAK15____header_global_e100389cff9d3069; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:725
export const SCREENBREAK19____header_global_00d251b20ab42e2a = ((((((4125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_62faedac4bedfddf1a682a9b() {
  return __cxx_static_address_62faedac4bedfddf1a682a9b.reference || (__cxx_static_address_62faedac4bedfddf1a682a9b.reference = {
    __cReference: true,
    get value() { return SCREENBREAK19____header_global_00d251b20ab42e2a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:726
export const SCREENBREAK16____header_global_4d812aa9004d96e8 = ((((((4127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_96e64d9becfdbd02cc1b412e() {
  return __cxx_static_address_96e64d9becfdbd02cc1b412e.reference || (__cxx_static_address_96e64d9becfdbd02cc1b412e.reference = {
    __cReference: true,
    get value() { return SCREENBREAK16____header_global_4d812aa9004d96e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:727
export const SCREENBREAK17____header_global_f86e4a28d9791df8 = ((((((4128) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_07ac1f95cf0dee49b52d4799() {
  return __cxx_static_address_07ac1f95cf0dee49b52d4799.reference || (__cxx_static_address_07ac1f95cf0dee49b52d4799.reference = {
    __cReference: true,
    get value() { return SCREENBREAK17____header_global_f86e4a28d9791df8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:728
export const SCREENBREAK18____header_global_edc59e609ec52a50 = ((((((4129) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_44c9d6edab878d778e22c6bc() {
  return __cxx_static_address_44c9d6edab878d778e22c6bc.reference || (__cxx_static_address_44c9d6edab878d778e22c6bc.reference = {
    __cReference: true,
    get value() { return SCREENBREAK18____header_global_edc59e609ec52a50; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:729
export const W_TECHWALL11____header_global_2ad407750cd7421e = ((((((4130) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ac8fa617eb0edd1399bcc32a() {
  return __cxx_static_address_ac8fa617eb0edd1399bcc32a.reference || (__cxx_static_address_ac8fa617eb0edd1399bcc32a.reference = {
    __cReference: true,
    get value() { return W_TECHWALL11____header_global_2ad407750cd7421e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:730
export const W_TECHWALL12____header_global_819f28ca9bd2f749 = ((((((4131) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c790df3244ff16337afeeca4() {
  return __cxx_static_address_c790df3244ff16337afeeca4.reference || (__cxx_static_address_c790df3244ff16337afeeca4.reference = {
    __cReference: true,
    get value() { return W_TECHWALL12____header_global_819f28ca9bd2f749; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:731
export const W_TECHWALL13____header_global_fafdcc2b2739b867 = ((((((4132) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_14aa1c44ce1af5c529eb2cf6() {
  return __cxx_static_address_14aa1c44ce1af5c529eb2cf6.reference || (__cxx_static_address_14aa1c44ce1af5c529eb2cf6.reference = {
    __cReference: true,
    get value() { return W_TECHWALL13____header_global_fafdcc2b2739b867; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:732
export const W_TECHWALL14____header_global_12f8e92f7afcc878 = ((((((4133) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_69f887c2d9b56d281fc9eb84() {
  return __cxx_static_address_69f887c2d9b56d281fc9eb84.reference || (__cxx_static_address_69f887c2d9b56d281fc9eb84.reference = {
    __cReference: true,
    get value() { return W_TECHWALL14____header_global_12f8e92f7afcc878; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:733
export const W_TECHWALL5____header_global_d9b2c14a88343a7e = ((((((4134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e52fb7ac176df54baaee63c3() {
  return __cxx_static_address_e52fb7ac176df54baaee63c3.reference || (__cxx_static_address_e52fb7ac176df54baaee63c3.reference = {
    __cReference: true,
    get value() { return W_TECHWALL5____header_global_d9b2c14a88343a7e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:734
export const W_TECHWALL6____header_global_3b4bf64f0fe54c58 = ((((((4136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_76ceb54c010cc63b9403af2b() {
  return __cxx_static_address_76ceb54c010cc63b9403af2b.reference || (__cxx_static_address_76ceb54c010cc63b9403af2b.reference = {
    __cReference: true,
    get value() { return W_TECHWALL6____header_global_3b4bf64f0fe54c58; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:735
export const W_TECHWALL7____header_global_09ec677d29c9d89a = ((((((4138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7b2925d0052caf5f80df2680() {
  return __cxx_static_address_7b2925d0052caf5f80df2680.reference || (__cxx_static_address_7b2925d0052caf5f80df2680.reference = {
    __cReference: true,
    get value() { return W_TECHWALL7____header_global_09ec677d29c9d89a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:736
export const W_TECHWALL8____header_global_9e700d64bd661c08 = ((((((4140) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a80bf9539289776f8f4f4222() {
  return __cxx_static_address_a80bf9539289776f8f4f4222.reference || (__cxx_static_address_a80bf9539289776f8f4f4222.reference = {
    __cReference: true,
    get value() { return W_TECHWALL8____header_global_9e700d64bd661c08; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:737
export const W_TECHWALL9____header_global_0248c1d4314e9e74 = ((((((4142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_450a305ac107e67ebfedb336() {
  return __cxx_static_address_450a305ac107e67ebfedb336.reference || (__cxx_static_address_450a305ac107e67ebfedb336.reference = {
    __cReference: true,
    get value() { return W_TECHWALL9____header_global_0248c1d4314e9e74; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:738
export const BPANNEL3____header_global_761495b1fd27076d = ((((((4100) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d1c068cd0bfa041c0c66dc9d() {
  return __cxx_static_address_d1c068cd0bfa041c0c66dc9d.reference || (__cxx_static_address_d1c068cd0bfa041c0c66dc9d.reference = {
    __cReference: true,
    get value() { return BPANNEL3____header_global_761495b1fd27076d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:739
export const W_HITTECHWALL16____header_global_e9fad0b2ebc45898 = ((((((4144) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_40553f9eeecad0df25f2fc58() {
  return __cxx_static_address_40553f9eeecad0df25f2fc58.reference || (__cxx_static_address_40553f9eeecad0df25f2fc58.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL16____header_global_e9fad0b2ebc45898; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:740
export const W_HITTECHWALL10____header_global_b179aeffdb09b4c9 = ((((((4145) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fc4dd45ebbdb6761168aac0f() {
  return __cxx_static_address_fc4dd45ebbdb6761168aac0f.reference || (__cxx_static_address_fc4dd45ebbdb6761168aac0f.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL10____header_global_b179aeffdb09b4c9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:741
export const W_HITTECHWALL15____header_global_a5845a8099cdd885 = ((((((4147) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_858ff2f64567cecdd40f61fb() {
  return __cxx_static_address_858ff2f64567cecdd40f61fb.reference || (__cxx_static_address_858ff2f64567cecdd40f61fb.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL15____header_global_a5845a8099cdd885; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:742
export const W_MILKSHELF____header_global_3ef845ce4f8599d9 = ((((((4181) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7c6557c9659655c3b8215ff4() {
  return __cxx_static_address_7c6557c9659655c3b8215ff4.reference || (__cxx_static_address_7c6557c9659655c3b8215ff4.reference = {
    __cReference: true,
    get value() { return W_MILKSHELF____header_global_3ef845ce4f8599d9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:743
export const W_MILKSHELFBROKE____header_global_9d9a10eb089b1542 = ((((((4203) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_71404b9281333849063c7085() {
  return __cxx_static_address_71404b9281333849063c7085.reference || (__cxx_static_address_71404b9281333849063c7085.reference = {
    __cReference: true,
    get value() { return W_MILKSHELFBROKE____header_global_9d9a10eb089b1542; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:744
export const PURPLELAVA____header_global_4b3d71dd9e2a0ffa = ((((((4240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e496612c04d984dd04b8417e() {
  return __cxx_static_address_e496612c04d984dd04b8417e.reference || (__cxx_static_address_e496612c04d984dd04b8417e.reference = {
    __cReference: true,
    get value() { return PURPLELAVA____header_global_4b3d71dd9e2a0ffa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:745
export const TARGET____header_global_51124fa2eb41dd54 = ((((((4359) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b074122e3ed8e9b80300f935() {
  return __cxx_static_address_b074122e3ed8e9b80300f935.reference || (__cxx_static_address_b074122e3ed8e9b80300f935.reference = {
    __cReference: true,
    get value() { return TARGET____header_global_51124fa2eb41dd54; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:746
export const DUCK____header_global_1bba63c543d87bbb = ((((((4361) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_23cb98bfc139e7880ec63f5e() {
  return __cxx_static_address_23cb98bfc139e7880ec63f5e.reference || (__cxx_static_address_23cb98bfc139e7880ec63f5e.reference = {
    __cReference: true,
    get value() { return DUCK____header_global_1bba63c543d87bbb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:747
export const PUKE____header_global_5353bbe5f9e053d8 = ((((((4389) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c36924bba71edbd0a467b156() {
  return __cxx_static_address_c36924bba71edbd0a467b156.reference || (__cxx_static_address_c36924bba71edbd0a467b156.reference = {
    __cReference: true,
    get value() { return PUKE____header_global_5353bbe5f9e053d8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:748
export const DOORTILE23____header_global_adf060165bb978e2 = ((((((4391) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9b15ff9973aa9c377dc4f2af() {
  return __cxx_static_address_9b15ff9973aa9c377dc4f2af.reference || (__cxx_static_address_9b15ff9973aa9c377dc4f2af.reference = {
    __cReference: true,
    get value() { return DOORTILE23____header_global_adf060165bb978e2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:749
export const SPEAKER____header_global_cfb4e217e8710490 = ((((((4397) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dc71547a6de6e011f370efe1() {
  return __cxx_static_address_dc71547a6de6e011f370efe1.reference || (__cxx_static_address_dc71547a6de6e011f370efe1.reference = {
    __cReference: true,
    get value() { return SPEAKER____header_global_cfb4e217e8710490; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:750
export const MAIL____header_global_404b99551d0a2994 = ((((((4410) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9d5bc6ce81d6085227c3953c() {
  return __cxx_static_address_9d5bc6ce81d6085227c3953c.reference || (__cxx_static_address_9d5bc6ce81d6085227c3953c.reference = {
    __cReference: true,
    get value() { return MAIL____header_global_404b99551d0a2994; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:751
export const HOTMEAT____header_global_00ef5319816d6978 = ((((((4427) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d9b14b26dba100cd95a3979d() {
  return __cxx_static_address_d9b14b26dba100cd95a3979d.reference || (__cxx_static_address_d9b14b26dba100cd95a3979d.reference = {
    __cReference: true,
    get value() { return HOTMEAT____header_global_00ef5319816d6978; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:752
export const TRIPODCAMERA____header_global_e17236cc9ec9160f = ((((((4444) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aa561f7550e0cdfd2c7f7cb0() {
  return __cxx_static_address_aa561f7550e0cdfd2c7f7cb0.reference || (__cxx_static_address_aa561f7550e0cdfd2c7f7cb0.reference = {
    __cReference: true,
    get value() { return TRIPODCAMERA____header_global_e17236cc9ec9160f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:753
export const PAPER____header_global_832356afe5aa36fa = ((((((4460) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_41824f681b173273bf716e62() {
  return __cxx_static_address_41824f681b173273bf716e62.reference || (__cxx_static_address_41824f681b173273bf716e62.reference = {
    __cReference: true,
    get value() { return PAPER____header_global_832356afe5aa36fa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:754
export const GENERICPOLE2____header_global_f0b90be36b5efa1e = ((((((4465) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e58c0a08fe39ea7f34bf18c3() {
  return __cxx_static_address_e58c0a08fe39ea7f34bf18c3.reference || (__cxx_static_address_e58c0a08fe39ea7f34bf18c3.reference = {
    __cReference: true,
    get value() { return GENERICPOLE2____header_global_f0b90be36b5efa1e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:755
export const XXXSTACY____header_global_4474d49ad4cdb31c = ((((((4470) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_99e268e2c7fa72253514114a() {
  return __cxx_static_address_99e268e2c7fa72253514114a.reference || (__cxx_static_address_99e268e2c7fa72253514114a.reference = {
    __cReference: true,
    get value() { return XXXSTACY____header_global_4474d49ad4cdb31c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:756
export const LETTER____header_global_28d2d134430361ca = ((((((4502) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2aceac1cf90906102db016c5() {
  return __cxx_static_address_2aceac1cf90906102db016c5.reference || (__cxx_static_address_2aceac1cf90906102db016c5.reference = {
    __cReference: true,
    get value() { return LETTER____header_global_28d2d134430361ca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:757
export const SIDEBOLT1____header_global_d4dbe19e6f1626e5 = ((((((4525) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2806030218b094ee875e182a() {
  return __cxx_static_address_2806030218b094ee875e182a.reference || (__cxx_static_address_2806030218b094ee875e182a.reference = {
    __cReference: true,
    get value() { return SIDEBOLT1____header_global_d4dbe19e6f1626e5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:758
export const FOODOBJECT16____header_global_b9e5da59cbb209b9 = ((((((4545) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f98e9425354ba7fae9797f81() {
  return __cxx_static_address_f98e9425354ba7fae9797f81.reference || (__cxx_static_address_f98e9425354ba7fae9797f81.reference = {
    __cReference: true,
    get value() { return FOODOBJECT16____header_global_b9e5da59cbb209b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:759
export const TAMPON____header_global_04ddf6d838a24812 = ((((((4557) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9b13ac8e7784ba953d9e1f8d() {
  return __cxx_static_address_9b13ac8e7784ba953d9e1f8d.reference || (__cxx_static_address_9b13ac8e7784ba953d9e1f8d.reference = {
    __cReference: true,
    get value() { return TAMPON____header_global_04ddf6d838a24812; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:760
export const CANWITHSOMETHING2____header_global_32731fdc0d3826a9 = ((((((4580) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fe1b60a65f7321963d63915c() {
  return __cxx_static_address_fe1b60a65f7321963d63915c.reference || (__cxx_static_address_fe1b60a65f7321963d63915c.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING2____header_global_32731fdc0d3826a9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:761
export const CANWITHSOMETHING3____header_global_035c1befa2feff61 = ((((((4581) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b39e44915538d9f91d607d40() {
  return __cxx_static_address_b39e44915538d9f91d607d40.reference || (__cxx_static_address_b39e44915538d9f91d607d40.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING3____header_global_035c1befa2feff61; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:762
export const CANWITHSOMETHING4____header_global_42c546f736c3e484 = ((((((4582) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a46ec42938f510fdfbf21026() {
  return __cxx_static_address_a46ec42938f510fdfbf21026.reference || (__cxx_static_address_a46ec42938f510fdfbf21026.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING4____header_global_42c546f736c3e484; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:763
export const DOLPHIN1____header_global_f660b54b8c7a53b9 = ((((((4591) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_02ed55a160c86d48cd860e19() {
  return __cxx_static_address_02ed55a160c86d48cd860e19.reference || (__cxx_static_address_02ed55a160c86d48cd860e19.reference = {
    __cReference: true,
    get value() { return DOLPHIN1____header_global_f660b54b8c7a53b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:764
export const DOLPHIN2____header_global_07d26ff43edfc3d2 = ((((((4592) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4be2db969ad59aaada7f34cb() {
  return __cxx_static_address_4be2db969ad59aaada7f34cb.reference || (__cxx_static_address_4be2db969ad59aaada7f34cb.reference = {
    __cReference: true,
    get value() { return DOLPHIN2____header_global_07d26ff43edfc3d2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:765
export const NEWBEAST____header_global_86f812581a668b9e = ((((((4610) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9ce55b64daf50868e95feae4() {
  return __cxx_static_address_9ce55b64daf50868e95feae4.reference || (__cxx_static_address_9ce55b64daf50868e95feae4.reference = {
    __cReference: true,
    get value() { return NEWBEAST____header_global_86f812581a668b9e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:766
export const NEWBEASTSTAYPUT____header_global_4bd053d3b82f0509 = ((((((4611) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_20a082a8f78e808f0d1a2149() {
  return __cxx_static_address_20a082a8f78e808f0d1a2149.reference || (__cxx_static_address_20a082a8f78e808f0d1a2149.reference = {
    __cReference: true,
    get value() { return NEWBEASTSTAYPUT____header_global_4bd053d3b82f0509; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:767
export const BOSS4____header_global_70888622ea09374c = ((((((4740) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b3d8b10a73d3dd1626d79dc7() {
  return __cxx_static_address_b3d8b10a73d3dd1626d79dc7.reference || (__cxx_static_address_b3d8b10a73d3dd1626d79dc7.reference = {
    __cReference: true,
    get value() { return BOSS4____header_global_70888622ea09374c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:768
export const BOSS4STAYPUT____header_global_a2dc2ae331eeec65 = ((((((4741) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fd029d09351bca14cc60a08f() {
  return __cxx_static_address_fd029d09351bca14cc60a08f.reference || (__cxx_static_address_fd029d09351bca14cc60a08f.reference = {
    __cReference: true,
    get value() { return BOSS4STAYPUT____header_global_a2dc2ae331eeec65; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:769
export const FEM10____header_global_8559d32f67741ce4 = ((((((4864) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a3eb50b70828b767cf9164b7() {
  return __cxx_static_address_a3eb50b70828b767cf9164b7.reference || (__cxx_static_address_a3eb50b70828b767cf9164b7.reference = {
    __cReference: true,
    get value() { return FEM10____header_global_8559d32f67741ce4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:770
export const TOUGHGAL____header_global_9334339177afc034 = ((((((4866) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_040cd944013a1be6d55f8b9d() {
  return __cxx_static_address_040cd944013a1be6d55f8b9d.reference || (__cxx_static_address_040cd944013a1be6d55f8b9d.reference = {
    __cReference: true,
    get value() { return TOUGHGAL____header_global_9334339177afc034; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:771
export const MAN____header_global_a86298c2ec38b98f = ((((((4871) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6bee879fcc3b12df709214dd() {
  return __cxx_static_address_6bee879fcc3b12df709214dd.reference || (__cxx_static_address_6bee879fcc3b12df709214dd.reference = {
    __cReference: true,
    get value() { return MAN____header_global_a86298c2ec38b98f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:772
export const MAN2____header_global_9e5e12264f112249 = ((((((4872) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1be5f629e801b1e45a4c1749() {
  return __cxx_static_address_1be5f629e801b1e45a4c1749.reference || (__cxx_static_address_1be5f629e801b1e45a4c1749.reference = {
    __cReference: true,
    get value() { return MAN2____header_global_9e5e12264f112249; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:773
export const WOMAN____header_global_0be6a080624e25aa = ((((((4874) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_816c85dbd9f0f0189bbaa768() {
  return __cxx_static_address_816c85dbd9f0f0189bbaa768.reference || (__cxx_static_address_816c85dbd9f0f0189bbaa768.reference = {
    __cReference: true,
    get value() { return WOMAN____header_global_0be6a080624e25aa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:774
export const NATURALLIGHTNING____header_global_1839e8f1b5b9110c = ((((((4890) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_647f423d282d784b574d3a37() {
  return __cxx_static_address_647f423d282d784b574d3a37.reference || (__cxx_static_address_647f423d282d784b574d3a37.reference = {
    __cReference: true,
    get value() { return NATURALLIGHTNING____header_global_1839e8f1b5b9110c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:775
export const WEATHERWARN____header_global_6e711cd132c5bb60 = ((((((4893) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_84d5f818fdf472c705628149() {
  return __cxx_static_address_84d5f818fdf472c705628149.reference || (__cxx_static_address_84d5f818fdf472c705628149.reference = {
    __cReference: true,
    get value() { return WEATHERWARN____header_global_6e711cd132c5bb60; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:776
export const DUKETAG____header_global_9babc4c13429459e = ((((((4900) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_81f15c511dd545dbd1e92031() {
  return __cxx_static_address_81f15c511dd545dbd1e92031.reference || (__cxx_static_address_81f15c511dd545dbd1e92031.reference = {
    __cReference: true,
    get value() { return DUKETAG____header_global_9babc4c13429459e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:777
export const SIGN1____header_global_6a805a4b1ff1e6ff = ((((((4909) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_119f1a387351e25f44eaf498() {
  return __cxx_static_address_119f1a387351e25f44eaf498.reference || (__cxx_static_address_119f1a387351e25f44eaf498.reference = {
    __cReference: true,
    get value() { return SIGN1____header_global_6a805a4b1ff1e6ff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:778
export const SIGN2____header_global_40324c05309d1df6 = ((((((4912) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7d6067e0efc43ed5d26c2918() {
  return __cxx_static_address_7d6067e0efc43ed5d26c2918.reference || (__cxx_static_address_7d6067e0efc43ed5d26c2918.reference = {
    __cReference: true,
    get value() { return SIGN2____header_global_40324c05309d1df6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:779
export const JURYGUY____header_global_47a1ad13152146d7 = ((((((4943) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_da30cdc69ffad038db610fc9() {
  return __cxx_static_address_da30cdc69ffad038db610fc9.reference || (__cxx_static_address_da30cdc69ffad038db610fc9.reference = {
    __cReference: true,
    get value() { return JURYGUY____header_global_47a1ad13152146d7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:780
export const WIDESCREENSTATUSBAR____header_global_b552a263392d02d8 = ((((((5120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e195d2c403b87b2bff9aa540() {
  return __cxx_static_address_e195d2c403b87b2bff9aa540.reference || (__cxx_static_address_e195d2c403b87b2bff9aa540.reference = {
    __cReference: true,
    get value() { return WIDESCREENSTATUSBAR____header_global_b552a263392d02d8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:781
export const RPGGUNWIDE____header_global_320ce7be85df1491 = ((((((5121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1a3df2dc771bb1953604aa12() {
  return __cxx_static_address_1a3df2dc771bb1953604aa12.reference || (__cxx_static_address_1a3df2dc771bb1953604aa12.reference = {
    __cReference: true,
    get value() { return RPGGUNWIDE____header_global_320ce7be85df1491; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:782
export const FIRSTGUNRELOADWIDE____header_global_1fc97a3494bdc0ea = ((((((5122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0b87b6902c37898097d64563() {
  return __cxx_static_address_0b87b6902c37898097d64563.reference || (__cxx_static_address_0b87b6902c37898097d64563.reference = {
    __cReference: true,
    get value() { return FIRSTGUNRELOADWIDE____header_global_1fc97a3494bdc0ea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:783
export const FREEZEWIDE____header_global_e5a15128a68b9e76 = ((((((5123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_726bd4f25cddb2944737d592() {
  return __cxx_static_address_726bd4f25cddb2944737d592.reference || (__cxx_static_address_726bd4f25cddb2944737d592.reference = {
    __cReference: true,
    get value() { return FREEZEWIDE____header_global_e5a15128a68b9e76; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:784
export const FREEZEFIREWIDE____header_global_8766eea5c7bdeaf6 = ((((((5124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_14045191bd37efe347c4f6f2() {
  return __cxx_static_address_14045191bd37efe347c4f6f2.reference || (__cxx_static_address_14045191bd37efe347c4f6f2.reference = {
    __cReference: true,
    get value() { return FREEZEFIREWIDE____header_global_8766eea5c7bdeaf6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:785
export const SHRINKERWIDE____header_global_1d6fcbffe56a4d74 = ((((((5127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f3363d5f3f39eaba64da11fe() {
  return __cxx_static_address_f3363d5f3f39eaba64da11fe.reference || (__cxx_static_address_f3363d5f3f39eaba64da11fe.reference = {
    __cReference: true,
    get value() { return SHRINKERWIDE____header_global_1d6fcbffe56a4d74; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:786
export const CRACKKNUCKLESWIDE____header_global_0a844544481c6e88 = ((((((5129) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cc117882162311de65a5472f() {
  return __cxx_static_address_cc117882162311de65a5472f.reference || (__cxx_static_address_cc117882162311de65a5472f.reference = {
    __cReference: true,
    get value() { return CRACKKNUCKLESWIDE____header_global_0a844544481c6e88; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:787
export const FLAMETHROWERSPRITE____header_global_1ea720e369320358 = ((((((5134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_088a3d5a3ba863d61c8d78dc() {
  return __cxx_static_address_088a3d5a3ba863d61c8d78dc.reference || (__cxx_static_address_088a3d5a3ba863d61c8d78dc.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERSPRITE____header_global_1ea720e369320358; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:788
export const FLAMETHROWERAMMO____header_global_97f7ae0cfb293b71 = ((((((5135) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0eb0d3421f46c78caefbd5d4() {
  return __cxx_static_address_0eb0d3421f46c78caefbd5d4.reference || (__cxx_static_address_0eb0d3421f46c78caefbd5d4.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERAMMO____header_global_97f7ae0cfb293b71; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:789
export const FLAMETHROWER____header_global_b3c6138d63f3a115 = ((((((5138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7fd57c4fe38fd6c9308d0316() {
  return __cxx_static_address_7fd57c4fe38fd6c9308d0316.reference || (__cxx_static_address_7fd57c4fe38fd6c9308d0316.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER____header_global_b3c6138d63f3a115; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:790
export const FLAMETHROWERFIRE____header_global_39758848f254bef6 = ((((((5139) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_747ea656418a41a43a2c3783() {
  return __cxx_static_address_747ea656418a41a43a2c3783.reference || (__cxx_static_address_747ea656418a41a43a2c3783.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERFIRE____header_global_39758848f254bef6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:791
export const FLAMETHROWERFLAME____header_global_997105afd9f8ee52 = ((((((1891) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_242e60e85154db03d4e5e0fb() {
  return __cxx_static_address_242e60e85154db03d4e5e0fb.reference || (__cxx_static_address_242e60e85154db03d4e5e0fb.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERFLAME____header_global_997105afd9f8ee52; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:792
export const FLAMETHROWERPILOT____header_global_6dd5520a75b10572 = ((((((5174) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7ea48466ff30ce3c164ebcdd() {
  return __cxx_static_address_7ea48466ff30ce3c164ebcdd.reference || (__cxx_static_address_7ea48466ff30ce3c164ebcdd.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERPILOT____header_global_6dd5520a75b10572; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:793
export const FIREBALL____header_global_b8c72319ebdc44dc = ((((((5163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f4df5d2e3187b68376816ce7() {
  return __cxx_static_address_f4df5d2e3187b68376816ce7.reference || (__cxx_static_address_f4df5d2e3187b68376816ce7.reference = {
    __cReference: true,
    get value() { return FIREBALL____header_global_b8c72319ebdc44dc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:794
export const ONFIRE____header_global_80e3899cc5d54277 = ((((((5152) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bea26c96e75f79d74b169ba1() {
  return __cxx_static_address_bea26c96e75f79d74b169ba1.reference || (__cxx_static_address_bea26c96e75f79d74b169ba1.reference = {
    __cReference: true,
    get value() { return ONFIRE____header_global_80e3899cc5d54277; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:795
export const ONFIRESMOKE____header_global_5bd2ee0d375a58a8 = ((((((5143) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_87438a101bc574443e184ffd() {
  return __cxx_static_address_87438a101bc574443e184ffd.reference || (__cxx_static_address_87438a101bc574443e184ffd.reference = {
    __cReference: true,
    get value() { return ONFIRESMOKE____header_global_5bd2ee0d375a58a8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:796
export const BURNEDCORPSE____header_global_e6f8bfe438b3a9d3 = ((((((5173) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_642c3379623bf0cd0228e08c() {
  return __cxx_static_address_642c3379623bf0cd0228e08c.reference || (__cxx_static_address_642c3379623bf0cd0228e08c.reference = {
    __cReference: true,
    get value() { return BURNEDCORPSE____header_global_e6f8bfe438b3a9d3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:797
export const WHISPYSMOKE____header_global_1683ff03ecf916dd = ((((((5268) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8c9df2723408d57e884c449f() {
  return __cxx_static_address_8c9df2723408d57e884c449f.reference || (__cxx_static_address_8c9df2723408d57e884c449f.reference = {
    __cReference: true,
    get value() { return WHISPYSMOKE____header_global_1683ff03ecf916dd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:798
export const FIREFLY____header_global_60124475f32db5e8 = ((((((5180) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5d37f823a7f2996e535fc834() {
  return __cxx_static_address_5d37f823a7f2996e535fc834.reference || (__cxx_static_address_5d37f823a7f2996e535fc834.reference = {
    __cReference: true,
    get value() { return FIREFLY____header_global_60124475f32db5e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:799
export const FIREFLYSHRINKEFFECT____header_global_8421b84a2b9f2a0a = ((((((5360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b76794521db9a77d06789863() {
  return __cxx_static_address_b76794521db9a77d06789863.reference || (__cxx_static_address_b76794521db9a77d06789863.reference = {
    __cReference: true,
    get value() { return FIREFLYSHRINKEFFECT____header_global_8421b84a2b9f2a0a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:800
export const FIREFLYGROWEFFECT____header_global_271e397156f03451 = ((((((5367) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0b3aef6f098ed297b6f66c42() {
  return __cxx_static_address_0b3aef6f098ed297b6f66c42.reference || (__cxx_static_address_0b3aef6f098ed297b6f66c42.reference = {
    __cReference: true,
    get value() { return FIREFLYGROWEFFECT____header_global_271e397156f03451; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:801
export const FIREFLYFLYINGEFFECT____header_global_39c1d01f25460ba6 = ((((((5296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_02c56dab13458c7669d6ad32() {
  return __cxx_static_address_02c56dab13458c7669d6ad32.reference || (__cxx_static_address_02c56dab13458c7669d6ad32.reference = {
    __cReference: true,
    get value() { return FIREFLYFLYINGEFFECT____header_global_39c1d01f25460ba6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:802
export const BOSS5____header_global_f547da701b1064a0 = ((((((5310) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_61fbd042335dfbea4192c81b() {
  return __cxx_static_address_61fbd042335dfbea4192c81b.reference || (__cxx_static_address_61fbd042335dfbea4192c81b.reference = {
    __cReference: true,
    get value() { return BOSS5____header_global_f547da701b1064a0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:803
export const BOSS5STAYPUT____header_global_9e16838c3bcfccfe = ((((((5311) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9981cdfd90cda22d6cfe1d38() {
  return __cxx_static_address_9981cdfd90cda22d6cfe1d38.reference || (__cxx_static_address_9981cdfd90cda22d6cfe1d38.reference = {
    __cReference: true,
    get value() { return BOSS5STAYPUT____header_global_9e16838c3bcfccfe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:804
export const LAVAPOOL____header_global_3caf608888cf85b5 = ((((((5304) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_de02728c3898a3dda90481b1() {
  return __cxx_static_address_de02728c3898a3dda90481b1.reference || (__cxx_static_address_de02728c3898a3dda90481b1.reference = {
    __cReference: true,
    get value() { return LAVAPOOL____header_global_3caf608888cf85b5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:805
export const LAVASPLASH____header_global_bdfad8f452fbff55 = ((((((5371) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_00cad1e96818b185345b68b7() {
  return __cxx_static_address_00cad1e96818b185345b68b7.reference || (__cxx_static_address_00cad1e96818b185345b68b7.reference = {
    __cReference: true,
    get value() { return LAVASPLASH____header_global_bdfad8f452fbff55; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:806
export const LAVAPOOLBUBBLE____header_global_4c5a554c7f8b3eb8 = ((((((5207) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e2456b0d05c07d1087caf267() {
  return __cxx_static_address_e2456b0d05c07d1087caf267.reference || (__cxx_static_address_e2456b0d05c07d1087caf267.reference = {
    __cReference: true,
    get value() { return LAVAPOOLBUBBLE____header_global_4c5a554c7f8b3eb8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:807
export const BOSS2STAYPUT____header_global_6915dd279e8eada2 = ((((((2711) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c22726fd9acc76ae8c4a77cf() {
  return __cxx_static_address_c22726fd9acc76ae8c4a77cf.reference || (__cxx_static_address_c22726fd9acc76ae8c4a77cf.reference = {
    __cReference: true,
    get value() { return BOSS2STAYPUT____header_global_6915dd279e8eada2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:808
export const BOSS3STAYPUT____header_global_0c393162a958fa86 = ((((((2761) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_19c787f23b61f57fe26ff967() {
  return __cxx_static_address_19c787f23b61f57fe26ff967.reference || (__cxx_static_address_19c787f23b61f57fe26ff967.reference = {
    __cReference: true,
    get value() { return BOSS3STAYPUT____header_global_0c393162a958fa86; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:809
export const E32_TILE5736____header_global_948af05bab57335b = ((((((5736) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3cc0f86d42f3416d348a7056() {
  return __cxx_static_address_3cc0f86d42f3416d348a7056.reference || (__cxx_static_address_3cc0f86d42f3416d348a7056.reference = {
    __cReference: true,
    get value() { return E32_TILE5736____header_global_948af05bab57335b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:810
export const E32_TILE5737____header_global_1c56c61ce5e3254b = ((((((5737) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_384dd8637616b64367e1bce1() {
  return __cxx_static_address_384dd8637616b64367e1bce1.reference || (__cxx_static_address_384dd8637616b64367e1bce1.reference = {
    __cReference: true,
    get value() { return E32_TILE5737____header_global_1c56c61ce5e3254b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:811
export const E32_TILE5846____header_global_6e92d3d58d29a5e3 = ((((((5846) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_604d77c1d6ade2abe5d99528() {
  return __cxx_static_address_604d77c1d6ade2abe5d99528.reference || (__cxx_static_address_604d77c1d6ade2abe5d99528.reference = {
    __cReference: true,
    get value() { return E32_TILE5846____header_global_6e92d3d58d29a5e3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/network.h:180
export const cSnapshotMemUsage__header_global_2f36f92b3ed61ec1 = u64((BigInt(u64(64)) * BigInt((BigInt((BigInt((BigInt(72) * BigInt(u64(16384)))) + BigInt((BigInt(96) * BigInt(u64(4096)))))) + BigInt((BigInt(296) * BigInt(u64(16384))))))));
function __cxx_static_address_1a6f6127dbfc307c85d47e32() {
  return __cxx_static_address_1a6f6127dbfc307c85d47e32.reference || (__cxx_static_address_1a6f6127dbfc307c85d47e32.reference = {
    __cReference: true,
    get value() { return cSnapshotMemUsage__header_global_2f36f92b3ed61ec1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/player.cpp:33
export let hudweap = cZeroAggregate({"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"count": {"native": "Int32Array", "offset": 4, "size": 4}, "cur": {"native": "Int32Array", "offset": 0, "size": 4}, "gunposx": {"native": "Int32Array", "offset": 8, "size": 4}, "gunposy": {"native": "Int32Array", "offset": 16, "size": 4}, "lookhalfang": {"native": "Int32Array", "offset": 12, "size": 4}, "lookhoriz": {"native": "Int32Array", "offset": 20, "size": 4}, "shade": {"native": "Int32Array", "offset": 24, "size": 4}}, "overlaps": false, "size": 28, "union": false}}, {});
export function __cxx_global_cell_428db7966f68b580bdb8b8d9() {
  return __cxx_global_cell_428db7966f68b580bdb8b8d9.reference || (__cxx_global_cell_428db7966f68b580bdb8b8d9.reference = {
    __cReference: true,
    get value() { return hudweap; },
    set value(__cxx_lvalue_0) { throw new TypeError("record address cannot replace original object storage"); }
  });
}

// C/C++ source: source/duke3d/src/player.cpp:41
export let g_numObituaries = i32(0);
export function __cxx_global_cell_14c7f525d32b0838223674c4() {
  return __cxx_global_cell_14c7f525d32b0838223674c4.reference || (__cxx_global_cell_14c7f525d32b0838223674c4.reference = {
    __cReference: true,
    get value() { return g_numObituaries; },
    set value(__cxx_lvalue_0) { g_numObituaries = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/player.cpp:42
export let g_numSelfObituaries = i32(0);
export function __cxx_global_cell_30b06f32517f69cb2a10e60b() {
  return __cxx_global_cell_30b06f32517f69cb2a10e60b.reference || (__cxx_global_cell_30b06f32517f69cb2a10e60b.reference = {
    __cReference: true,
    get value() { return g_numSelfObituaries; },
    set value(__cxx_lvalue_0) { g_numSelfObituaries = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/player.cpp:45
export const icon_to_inv = new Int32Array([i32(9), i32(9), i32(0), i32(3), i32(4), i32(7), i32(2), i32(10)]);
function __cxx_static_address_f3d10580ebb4182db57b5126() {
  return __cxx_static_address_f3d10580ebb4182db57b5126.reference || (__cxx_static_address_f3d10580ebb4182db57b5126.reference = {
    __cReference: true,
    get value() { return icon_to_inv; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/player.cpp:48
export const inv_to_icon = new Int32Array([i32(2), i32(0), i32(6), i32(3), i32(4), i32(0), i32(0), i32(5), i32(0), i32(1), i32(7)]);
function __cxx_static_address_9dac7c362e86873fadd7cfa9() {
  return __cxx_static_address_9dac7c362e86873fadd7cfa9.reference || (__cxx_static_address_9dac7c362e86873fadd7cfa9.reference = {
    __cReference: true,
    get value() { return inv_to_icon; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/player.cpp:51
export function P_AddKills(pPlayer, kills) {
  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = (((__cxx_lvalue_0.value + i32(kills))) & 65535)))(cObjectFieldRef(cRecordObject(pPlayer), "actors_killed"));
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_0b448614d4a66f61 = i32(2147483647);
function __cxx_static_address_3880294c641dae12f593d94b() {
  return __cxx_static_address_3880294c641dae12f593d94b.reference || (__cxx_static_address_3880294c641dae12f593d94b.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_0b448614d4a66f61; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_39c36475aea3e1be = i32(2147483648);
function __cxx_static_address_79bbc60282d43657c5c75e28() {
  return __cxx_static_address_79bbc60282d43657c5c75e28.reference || (__cxx_static_address_79bbc60282d43657c5c75e28.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_39c36475aea3e1be; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_c55028c5c1a917ee = i32(2147483648);
function __cxx_static_address_64b0ef877f82a80977e82f7b() {
  return __cxx_static_address_64b0ef877f82a80977e82f7b.reference || (__cxx_static_address_64b0ef877f82a80977e82f7b.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_c55028c5c1a917ee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_2c461fb32f9c4a2b = i32(65536);
function __cxx_static_address_d26a80c4078629cb3caf27d2() {
  return __cxx_static_address_d26a80c4078629cb3caf27d2.reference || (__cxx_static_address_d26a80c4078629cb3caf27d2.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_2c461fb32f9c4a2b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_2ad7c0423a279cb3 = i32(32768);
function __cxx_static_address_31348b4ab0fa16f1b6f728e2() {
  return __cxx_static_address_31348b4ab0fa16f1b6f728e2.reference || (__cxx_static_address_31348b4ab0fa16f1b6f728e2.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_2ad7c0423a279cb3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_5175b35ac918ddd0 = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_2a00fa8206ea27ec2015741d() {
  return __cxx_static_address_2a00fa8206ea27ec2015741d.reference || (__cxx_static_address_2a00fa8206ea27ec2015741d.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_5175b35ac918ddd0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/player.cpp:466
export let g_overrideShootZvel = i32(0);
function __cxx_static_address_6563939b9448798e04fd5300() {
  return __cxx_static_address_6563939b9448798e04fd5300.reference || (__cxx_static_address_6563939b9448798e04fd5300.reference = {
    __cReference: true,
    get value() { return g_overrideShootZvel; },
    set value(__cxx_lvalue_0) { g_overrideShootZvel = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/player.cpp:467
export let g_shootZvel = 0;
function __cxx_static_address_a0b71ca0bc515c251ec08557() {
  return __cxx_static_address_a0b71ca0bc515c251ec08557.reference || (__cxx_static_address_a0b71ca0bc515c251ec08557.reference = {
    __cReference: true,
    get value() { return g_shootZvel; },
    set value(__cxx_lvalue_0) { g_shootZvel = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/player.cpp:469
export function A_GetShootZvel(defaultZvel) {
  return i32((Boolean(g_overrideShootZvel) ? g_shootZvel : defaultZvel));
}

// C/C++ source: source/duke3d/src/player.cpp:1814
export function P_GetKneePal__cxx_6bbddfc0c522(pPlayer, hudPal) {
  return i32(((hudPal == 0) ? i32(cRecordObject(pPlayer).palookup) : hudPal));
}

// C/C++ source: source/duke3d/src/player.cpp:1866
export let g_dts_yadd = 0;
function __cxx_static_address_058a0f0dff68f9be1a15d9a5() {
  return __cxx_static_address_058a0f0dff68f9be1a15d9a5.reference || (__cxx_static_address_058a0f0dff68f9be1a15d9a5.reference = {
    __cReference: true,
    get value() { return g_dts_yadd; },
    set value(__cxx_lvalue_0) { g_dts_yadd = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/player.cpp:2185
export const access_tip_y = new Int8Array([(((0) << 24) >> 24), ((((-8)) << 24) >> 24), ((((-16)) << 24) >> 24), ((((-32)) << 24) >> 24), ((((-64)) << 24) >> 24), ((((-84)) << 24) >> 24), ((((-108)) << 24) >> 24), ((((-108)) << 24) >> 24), ((((-108)) << 24) >> 24), ((((-108)) << 24) >> 24), ((((-108)) << 24) >> 24), ((((-108)) << 24) >> 24), ((((-108)) << 24) >> 24), ((((-108)) << 24) >> 24), ((((-108)) << 24) >> 24), ((((-108)) << 24) >> 24), ((((-96)) << 24) >> 24), ((((-72)) << 24) >> 24), ((((-64)) << 24) >> 24), ((((-32)) << 24) >> 24), ((((-16)) << 24) >> 24), (((0) << 24) >> 24), (((16) << 24) >> 24), (((32) << 24) >> 24), (((48) << 24) >> 24)]);
function __cxx_static_address_50780600f101f8fa25de0f67() {
  return __cxx_static_address_50780600f101f8fa25de0f67.reference || (__cxx_static_address_50780600f101f8fa25de0f67.reference = {
    __cReference: true,
    get value() { return access_tip_y; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/player.cpp:3016
export let g_myAimMode = 0;
export function __cxx_global_cell_08999a64c4501ca30fea06a5() {
  return __cxx_global_cell_08999a64c4501ca30fea06a5.reference || (__cxx_global_cell_08999a64c4501ca30fea06a5.reference = {
    __cReference: true,
    get value() { return g_myAimMode; },
    set value(__cxx_lvalue_0) { g_myAimMode = i32(__cxx_lvalue_0); }
  });
}

export let g_myAimStat = 0;
export function __cxx_global_cell_019174bc8bf13cbbc09d6316() {
  return __cxx_global_cell_019174bc8bf13cbbc09d6316.reference || (__cxx_global_cell_019174bc8bf13cbbc09d6316.reference = {
    __cReference: true,
    get value() { return g_myAimStat; },
    set value(__cxx_lvalue_0) { g_myAimStat = i32(__cxx_lvalue_0); }
  });
}

export let g_oldAimStat = 0;
export function __cxx_global_cell_893713206cb0b1e122272078() {
  return __cxx_global_cell_893713206cb0b1e122272078.reference || (__cxx_global_cell_893713206cb0b1e122272078.reference = {
    __cReference: true,
    get value() { return g_oldAimStat; },
    set value(__cxx_lvalue_0) { g_oldAimStat = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/player.cpp:3017
export let g_lastInputTicks = 0n;
export function __cxx_global_cell_579cbee071346f2d65498ce0() {
  return __cxx_global_cell_579cbee071346f2d65498ce0.reference || (__cxx_global_cell_579cbee071346f2d65498ce0.reference = {
    __cReference: true,
    get value() { return g_lastInputTicks; },
    set value(__cxx_lvalue_0) { g_lastInputTicks = u64(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/player.cpp:3706
export let WeaponPickupSprites = new Int16Array([KNEE____header_global_64c9e05c6ac7a4e1, FIRSTGUNSPRITE____header_global_c1c547544d39dbf0, SHOTGUNSPRITE____header_global_d4a6bd7f9f5dca82, CHAINGUNSPRITE____header_global_351a0ad962b59414, RPGSPRITE____header_global_77326689676acde2, HEAVYHBOMB____header_global_bccd3cd5afcfca14, SHRINKERSPRITE____header_global_ec3659d1378fb0de, DEVISTATORSPRITE____header_global_66a28dddef5a11b5, TRIPBOMBSPRITE____header_global_da14947c83fb8632, FREEZESPRITE____header_global_92bb4eb5c06b9336, HEAVYHBOMB____header_global_bccd3cd5afcfca14, SHRINKERSPRITE____header_global_ec3659d1378fb0de, FLAMETHROWERSPRITE____header_global_1ea720e369320358]);
function __cxx_static_address_a7e906c48b6d1c3df7b44b59() {
  return __cxx_static_address_a7e906c48b6d1c3df7b44b59.reference || (__cxx_static_address_a7e906c48b6d1c3df7b44b59.reference = {
    __cReference: true,
    get value() { return WeaponPickupSprites; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/player.cpp:3731
export function P_AddAmmo(pPlayer, weaponNum, addAmount) {
  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = ((((__cxx_lvalue_0.value + addAmount)) << 16) >> 16)))(cDeref(cPointerOffset(cRecordObject(pPlayer).ammo_amount, weaponNum, Int16Array.BYTES_PER_ELEMENT), Int16Array));
  if ((i32((cDeref(cPointerOffset(cRecordObject(pPlayer).ammo_amount, weaponNum, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)) > i32((cDeref(cPointerOffset(cRecordObject(pPlayer).max_ammo_amount, weaponNum, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)))) {
    ((cDeref(cPointerOffset(cRecordObject(pPlayer).ammo_amount, weaponNum, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = ((((cDeref(cPointerOffset(cRecordObject(pPlayer).max_ammo_amount, weaponNum, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)) << 16) >> 16));
  }
}

// C/C++ source: source/duke3d/src/player.cpp:3824
export function P_SelectNextInvItem(pPlayer) {
  if ((i32((cDeref(cPointerOffset(cRecordObject(pPlayer).inv_amount, 9, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)) > 0)) {
    (cRecordObject(pPlayer).inven_icon = ((((1) & 255)) & 255));
  } else {
    if ((i32((cDeref(cPointerOffset(cRecordObject(pPlayer).inv_amount, 0, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)) > 0)) {
      (cRecordObject(pPlayer).inven_icon = ((((2) & 255)) & 255));
    } else {
      if ((i32((cDeref(cPointerOffset(cRecordObject(pPlayer).inv_amount, 4, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)) > 0)) {
        (cRecordObject(pPlayer).inven_icon = ((((4) & 255)) & 255));
      } else {
        if ((i32((cDeref(cPointerOffset(cRecordObject(pPlayer).inv_amount, 3, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)) > 0)) {
          (cRecordObject(pPlayer).inven_icon = ((((3) & 255)) & 255));
        } else {
          if ((i32((cDeref(cPointerOffset(cRecordObject(pPlayer).inv_amount, 7, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)) > 0)) {
            (cRecordObject(pPlayer).inven_icon = ((((5) & 255)) & 255));
          } else {
            if ((i32((cDeref(cPointerOffset(cRecordObject(pPlayer).inv_amount, 2, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)) > 0)) {
              (cRecordObject(pPlayer).inven_icon = ((((6) & 255)) & 255));
            } else {
              if ((i32((cDeref(cPointerOffset(cRecordObject(pPlayer).inv_amount, 10, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)) > 0)) {
                (cRecordObject(pPlayer).inven_icon = ((((7) & 255)) & 255));
              } else {
                (cRecordObject(pPlayer).inven_icon = ((((0) & 255)) & 255));
              }
            }
          }
        }
      }
    }
  }
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_27900b1d24a2ad8c = new Uint8Array([((1) & 255), ((2) & 255), ((4) & 255), ((8) & 255), ((16) & 255), ((32) & 255), ((64) & 255), ((128) & 255)]);
function __cxx_static_address_7dae49855cb6b1a7a7b3f460() {
  return __cxx_static_address_7dae49855cb6b1a7a7b3f460.reference || (__cxx_static_address_7dae49855cb6b1a7a7b3f460.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_27900b1d24a2ad8c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:172
export const g_defaultVideoModes__header_global_5c12b80e2ce95da0 = cByteRecordNDArray({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, [25], {}, [cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 2560, "y": 1440}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 2560, "y": 1200}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 2560, "y": 1080}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1920, "y": 1440}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1920, "y": 1200}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1920, "y": 1080}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1680, "y": 1050}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1600, "y": 1200}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1600, "y": 900}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1366, "y": 768}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1280, "y": 1024}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1280, "y": 960}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1280, "y": 720}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1152, "y": 864}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1024, "y": 768}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1024, "y": 600}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 800, "y": 600}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 640, "y": 480}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 640, "y": 400}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 512, "y": 384}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 480, "y": 360}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 400, "y": 300}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 320, "y": 240}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 320, "y": 200}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 0, "y": 0}, null, {})]);
function __cxx_static_address_64a9230ac3c0a477fbb19e47() {
  return __cxx_static_address_64a9230ac3c0a477fbb19e47.reference || (__cxx_static_address_64a9230ac3c0a477fbb19e47.reference = {
    __cReference: true,
    get value() { return g_defaultVideoModes__header_global_5c12b80e2ce95da0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:188
export const g_keyAsciiTable__header_global_92ea6392fc045c47 = new Uint8Array([((0) & 255), ((0) & 255), 49, 50, 51, 52, 53, 54, 55, 56, 57, 48, 45, 61, ((0) & 255), ((0) & 255), 113, 119, 101, 114, 116, 121, 117, 105, 111, 112, 91, 93, ((0) & 255), ((0) & 255), 97, 115, 100, 102, 103, 104, 106, 107, 108, 59, ((39) & 255), 96, ((0) & 255), ((92) & 255), 122, 120, 99, 118, 98, 110, 109, 44, 46, 47, ((0) & 255), 42, ((0) & 255), ((32) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255)]);
function __cxx_static_address_7b9759cc16de41ca985621f5() {
  return __cxx_static_address_7b9759cc16de41ca985621f5.reference || (__cxx_static_address_7b9759cc16de41ca985621f5.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTable__header_global_92ea6392fc045c47; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:196
export const g_keyAsciiTableShift__header_global_1b72e3f5b316fe97 = new Uint8Array([((0) & 255), ((0) & 255), 33, 64, 35, 36, 37, 94, 38, 42, 40, 41, 95, 43, ((0) & 255), ((0) & 255), 81, 87, 69, 82, 84, 89, 85, 73, 79, 80, 123, 125, ((0) & 255), ((0) & 255), 65, 83, 68, 70, 71, 72, 74, 75, 76, 58, 34, 126, ((0) & 255), 124, 90, 88, 67, 86, 66, 78, 77, 60, 62, 63, ((0) & 255), 42, ((0) & 255), ((32) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255)]);
function __cxx_static_address_b2b3570ac69e42452fb63759() {
  return __cxx_static_address_b2b3570ac69e42452fb63759.reference || (__cxx_static_address_b2b3570ac69e42452fb63759.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTableShift__header_global_1b72e3f5b316fe97; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:895
export const pow2long__header_global_41d69a2fc0e5a7b2 = new Int32Array([1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576, 2097152, 4194304, 8388608, 16777216, 33554432, 67108864, 134217728, 268435456, 536870912, 1073741824, 2147483647]);
function __cxx_static_address_e243c88a726f228eefe321b8() {
  return __cxx_static_address_e243c88a726f228eefe321b8.reference || (__cxx_static_address_e243c88a726f228eefe321b8.reference = {
    __cReference: true,
    get value() { return pow2long__header_global_41d69a2fc0e5a7b2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:907
export const pow2ulong__header_global_b62d22d9f8670b1a = new Uint32Array([u32(1), u32(2), u32(4), u32(8), u32(16), u32(32), u32(64), u32(128), u32(256), u32(512), u32(1024), u32(2048), u32(4096), u32(8192), u32(16384), u32(32768), u32(65536), u32(131072), u32(262144), u32(524288), u32(1048576), u32(2097152), u32(4194304), u32(8388608), u32(16777216), u32(33554432), u32(67108864), u32(134217728), u32(268435456), u32(536870912), u32(1073741824), u32(2147483648n)]);
function __cxx_static_address_ff1f6ad12497e5ebcb0049e6() {
  return __cxx_static_address_ff1f6ad12497e5ebcb0049e6.reference || (__cxx_static_address_ff1f6ad12497e5ebcb0049e6.reference = {
    __cReference: true,
    get value() { return pow2ulong__header_global_b62d22d9f8670b1a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:919
export const pow264__header_global_4af153ecf239a89e = new BigInt64Array([BigInt(i64(1)), BigInt(i64(2)), BigInt(i64(4)), BigInt(i64(8)), BigInt(i64(16)), BigInt(i64(32)), BigInt(i64(64)), BigInt(i64(128)), BigInt(i64(256)), BigInt(i64(512)), BigInt(i64(1024)), BigInt(i64(2048)), BigInt(i64(4096)), BigInt(i64(8192)), BigInt(i64(16384)), BigInt(i64(32768)), BigInt(i64(65536)), BigInt(i64(131072)), BigInt(i64(262144)), BigInt(i64(524288)), BigInt(i64(1048576)), BigInt(i64(2097152)), BigInt(i64(4194304)), BigInt(i64(8388608)), BigInt(i64(16777216)), BigInt(i64(33554432)), BigInt(i64(67108864)), BigInt(i64(134217728)), BigInt(i64(268435456)), BigInt(i64(536870912)), BigInt(i64(1073741824)), BigInt(2147483648n), BigInt(4294967296n), BigInt(8589934592n), BigInt(17179869184n), BigInt(34359738368n), BigInt(68719476736n), BigInt(137438953472n), BigInt(274877906944n), BigInt(549755813888n), BigInt(1099511627776n), BigInt(2199023255552n), BigInt(4398046511104n), BigInt(8796093022208n), BigInt(17592186044416n), BigInt(35184372088832n), BigInt(70368744177664n), BigInt(140737488355328n), BigInt(281474976710656n), BigInt(562949953421312n), BigInt(1125899906842624n), BigInt(2251799813685248n), BigInt(4503599627370496n), BigInt(9007199254740992n), BigInt(18014398509481984n), BigInt(36028797018963968n), BigInt(72057594037927936n), BigInt(144115188075855872n), BigInt(288230376151711744n), BigInt(576460752303423488n), BigInt(1152921504606846976n), BigInt(2305843009213693952n), BigInt(4611686018427387904n), BigInt(9223372036854775807n)]);
function __cxx_static_address_51dfcda3065d5727ca8c60bd() {
  return __cxx_static_address_51dfcda3065d5727ca8c60bd.reference || (__cxx_static_address_51dfcda3065d5727ca8c60bd.reference = {
    __cReference: true,
    get value() { return pow264__header_global_4af153ecf239a89e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/mact/include/keyboard.h:47
export const sctokeylut__header_global_f0a412521df3fb9d = cByteRecordNDArray({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, [102], {}, [cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([69, 115, 99, 97, 112, 101, 0]), "sc": ((1) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([49, 0]), "sc": ((2) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([50, 0]), "sc": ((3) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([51, 0]), "sc": ((4) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([52, 0]), "sc": ((5) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([53, 0]), "sc": ((6) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([54, 0]), "sc": ((7) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([55, 0]), "sc": ((8) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([56, 0]), "sc": ((9) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([57, 0]), "sc": ((10) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([48, 0]), "sc": ((11) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([45, 0]), "sc": ((12) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([61, 0]), "sc": ((13) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([66, 97, 107, 83, 112, 99, 0]), "sc": ((14) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([84, 97, 98, 0]), "sc": ((15) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([81, 0]), "sc": ((16) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([87, 0]), "sc": ((17) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([69, 0]), "sc": ((18) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([82, 0]), "sc": ((19) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([84, 0]), "sc": ((20) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([89, 0]), "sc": ((21) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([85, 0]), "sc": ((22) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([73, 0]), "sc": ((23) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([79, 0]), "sc": ((24) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([80, 0]), "sc": ((25) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([91, 0]), "sc": ((26) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([93, 0]), "sc": ((27) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([69, 110, 116, 101, 114, 0]), "sc": ((28) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([76, 67, 116, 114, 108, 0]), "sc": ((29) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([65, 0]), "sc": ((30) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([83, 0]), "sc": ((31) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([68, 0]), "sc": ((32) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 0]), "sc": ((33) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([71, 0]), "sc": ((34) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([72, 0]), "sc": ((35) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([74, 0]), "sc": ((36) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 0]), "sc": ((37) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([76, 0]), "sc": ((38) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([59, 0]), "sc": ((39) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([39, 0]), "sc": ((40) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([96, 0]), "sc": ((41) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([76, 83, 104, 105, 102, 116, 0]), "sc": ((42) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([66, 97, 99, 107, 115, 108, 97, 115, 104, 0]), "sc": ((43) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([90, 0]), "sc": ((44) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([88, 0]), "sc": ((45) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([67, 0]), "sc": ((46) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([86, 0]), "sc": ((47) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([66, 0]), "sc": ((48) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([78, 0]), "sc": ((49) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([77, 0]), "sc": ((50) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([44, 0]), "sc": ((51) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([46, 0]), "sc": ((52) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([47, 0]), "sc": ((53) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([82, 83, 104, 105, 102, 116, 0]), "sc": ((54) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 42, 0]), "sc": ((55) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([76, 65, 108, 116, 0]), "sc": ((56) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([83, 112, 97, 99, 101, 0]), "sc": ((57) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([67, 97, 112, 76, 99, 107, 0]), "sc": ((58) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 49, 0]), "sc": ((59) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 50, 0]), "sc": ((60) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 51, 0]), "sc": ((61) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 52, 0]), "sc": ((62) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 53, 0]), "sc": ((63) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 54, 0]), "sc": ((64) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 55, 0]), "sc": ((65) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 56, 0]), "sc": ((66) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 57, 0]), "sc": ((67) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 49, 48, 0]), "sc": ((68) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([78, 117, 109, 76, 99, 107, 0]), "sc": ((69) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([83, 99, 114, 76, 99, 107, 0]), "sc": ((70) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 55, 0]), "sc": ((71) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 56, 0]), "sc": ((72) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 57, 0]), "sc": ((73) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 45, 0]), "sc": ((74) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 52, 0]), "sc": ((75) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 53, 0]), "sc": ((76) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 54, 0]), "sc": ((77) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 43, 0]), "sc": ((78) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 49, 0]), "sc": ((79) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 50, 0]), "sc": ((80) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 51, 0]), "sc": ((81) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 48, 0]), "sc": ((82) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 46, 0]), "sc": ((83) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([76, 101, 115, 115, 84, 104, 97, 110, 0]), "sc": ((86) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 49, 49, 0]), "sc": ((87) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 49, 50, 0]), "sc": ((88) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 100, 69, 110, 116, 0]), "sc": ((156) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([82, 67, 116, 114, 108, 0]), "sc": ((157) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 47, 0]), "sc": ((181) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([82, 65, 108, 116, 0]), "sc": ((184) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([80, 114, 116, 83, 99, 110, 0]), "sc": ((183) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([80, 97, 117, 115, 101, 0]), "sc": ((197) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([72, 111, 109, 101, 0]), "sc": ((199) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([85, 112, 0]), "sc": ((200) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([80, 103, 85, 112, 0]), "sc": ((201) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([76, 101, 102, 116, 0]), "sc": ((203) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([82, 105, 103, 104, 116, 0]), "sc": ((205) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([69, 110, 100, 0]), "sc": ((207) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([68, 111, 119, 110, 0]), "sc": ((208) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([80, 103, 68, 110, 0]), "sc": ((209) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([73, 110, 115, 101, 114, 116, 0]), "sc": ((210) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([68, 101, 108, 101, 116, 101, 0]), "sc": ((211) & 255)}, null, {})]);
function __cxx_static_address_12475bfc23ac7d331de343bd() {
  return __cxx_static_address_12475bfc23ac7d331de343bd.reference || (__cxx_static_address_12475bfc23ac7d331de343bd.reference = {
    __cReference: true,
    get value() { return sctokeylut__header_global_f0a412521df3fb9d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/player.cpp:382
export function P_PalFrom__header_3684adea1d7b(pPlayer, f, r, g, b) {
  (cRecordObject(pPlayer).pals.f = ((((f) & 255)) & 255));
  (cRecordObject(pPlayer).pals.r = ((((r) & 255)) & 255));
  (cRecordObject(pPlayer).pals.g = ((((g) & 255)) & 255));
  (cRecordObject(pPlayer).pals.b = ((((b) & 255)) & 255));
}

// C/C++ source: source/duke3d/src/player.cpp:422
export function P_GetP__header_4cce6300c91a(pSprite) {
  let playerNum = i32(cRecordObject(cRecordPointer(pSprite, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {})).__cxx_anonymous_15.__cxx_anonymous_0.yvel);
  if ((u32(playerNum) >= u32(16))) {
    (playerNum = i32(0));
  }
  return i32(playerNum);
}

// C/C++ source: source/duke3d/src/player.cpp:42
export function fix16_to_int__header_796256d11627(a) {
  return i32(Math.trunc(i32((a + ((a >= 0) ? fix16_half__header_global_2ad7c0423a279cb3 : (-fix16_half__header_global_2ad7c0423a279cb3)))) / fix16_one__header_global_2c461fb32f9c4a2b));
}

export function clamp__header_1a6078e8fb11(__cxx_in, min, max) {
  return i32(((__cxx_in <= i32(min)) ? i32(min) : ((__cxx_in >= i32(max)) ? i32(max) : __cxx_in)));
}

// C/C++ source: source/duke3d/src/player.cpp:1462
export function redwallp__header_504951687d93(wal) {
  return i32(((i32(cRecordObject(wal).nextwall) >= 0) && (i32(cRecordObject(wal).nextsector) >= 0)));
}

export function clamp__header_fc244026f3a9(__cxx_in, min, max) {
  return i64(((__cxx_in <= i64(min)) ? i64(min) : ((__cxx_in >= i64(max)) ? i64(max) : __cxx_in)));
}

export function clamp__header_989782eba07a(__cxx_in, min, max) {
  return i32(((__cxx_in <= i32(min)) ? i32(min) : ((__cxx_in >= i32(max)) ? i32(max) : __cxx_in)));
}

export function ARRAY_SIZE__header_9f5e5a19557f(arg0) {
  return u64(6n);
}

// C/C++ source: source/duke3d/src/player.cpp:1396
export function logapproach__header_07315f18dded(val, targetval) {
  let dif = i32((targetval - val));
  return i32((Boolean(i32((dif >> 1))) ? i32((val + i32((dif >> 1)))) : targetval));
}

export function ARRAY_SIZE__header_3f8cb856063c(arg0) {
  return u64(12n);
}

export function ARRAY_SIZE__header_1e3ffb78ba59(arg0) {
  return u64(11n);
}

export function ARRAY_SIZE__header_dda1d72ca687(arg0) {
  return u64(25n);
}

export function ARRAY_SIZE__header_acd9c57eb29f(arg0) {
  return u64(21n);
}

export function ARRAY_SIZE__header_a85706b87159(arg0) {
  return u64(11n);
}

// C/C++ source: source/duke3d/src/player.cpp:328
export function ksgn__header_61a7fab69757(a) {
  return i32((i32((a > 0)) - i32((a < 0))));
}

export function ARRAY_SIZE__header_f801b3991048(arg0) {
  return u64(7n);
}

// C/C++ source: source/duke3d/src/player.cpp:43
export function fix16_to_float__header_8cd507b8715d(a) {
  return Math.fround(Math.fround((Math.fround(Math.fround(a)) * flt_f161r__header_global_5175b35ac918ddd0)));
}

// C/C++ source: source/duke3d/src/player.cpp:47
export function fix16_from_float__header_60ccdcc81717(a) {
  return i32(Math.fround((Math.fround((a * Math.fround(fix16_one__header_global_2c461fb32f9c4a2b))) + ((a >= Math.fround(0)) ? Math.fround(0.5) : (-Math.fround(0.5))))));
}

// C/C++ source: source/duke3d/src/player.cpp:66
export function fix16_clamp__header_37bbb080acbf(x, lo, hi) {
  return i32(clamp__header_989782eba07a(x, lo, hi));
}

// C/C++ source: source/duke3d/src/player.cpp:46
export function fix16_from_int__header_2eb952a67036(a) {
  return i32(Math.imul(a, fix16_one__header_global_2c461fb32f9c4a2b));
}

// C/C++ source: source/duke3d/src/player.cpp:1032
export function B_BUF32__header_4c587db017a9(buf, x) {
  ((cDeref(cTypedPointer(buf, Uint32Array), Uint32Array).value) = u32(x));
}

// C/C++ source: source/duke3d/src/player.cpp:1391
export function uhypsq__header_cab7502c6b44(dx, dy) {
  return u32((u32(Math.imul(u32(dx), u32(dx))) + u32(Math.imul(u32(dy), u32(dy)))));
}
