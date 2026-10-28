// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/mact/src/control.cpp
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
export const fix16_rad_to_deg_mult__header_global_63825e52269a1085 = i32(3754936);
function __cxx_static_address_c5d172d3b253624b496c7065() {
  return __cxx_static_address_c5d172d3b253624b496c7065.reference || (__cxx_static_address_c5d172d3b253624b496c7065.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_63825e52269a1085; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_a4db6622df338738 = i32(1144);
function __cxx_static_address_c7e79a3263f54197417f99ac() {
  return __cxx_static_address_c7e79a3263f54197417f99ac.reference || (__cxx_static_address_c7e79a3263f54197417f99ac.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_a4db6622df338738; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/mact/src/control.cpp:30
export let CONTROL_Started = Boolean(false);
export function __cxx_global_cell_2688171c8879a106600f1781() {
  return __cxx_global_cell_2688171c8879a106600f1781.reference || (__cxx_global_cell_2688171c8879a106600f1781.reference = {
    __cReference: true,
    get value() { return CONTROL_Started; },
    set value(__cxx_lvalue_0) { CONTROL_Started = Boolean(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/mact/src/control.cpp:31
export let CONTROL_MouseEnabled = Boolean(false);
export function __cxx_global_cell_86fecaa07f75517afdefdaa7() {
  return __cxx_global_cell_86fecaa07f75517afdefdaa7.reference || (__cxx_global_cell_86fecaa07f75517afdefdaa7.reference = {
    __cReference: true,
    get value() { return CONTROL_MouseEnabled; },
    set value(__cxx_lvalue_0) { CONTROL_MouseEnabled = Boolean(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/mact/src/control.cpp:32
export let CONTROL_MousePresent = Boolean(false);
export function __cxx_global_cell_b9b68728d746171839cea44e() {
  return __cxx_global_cell_b9b68728d746171839cea44e.reference || (__cxx_global_cell_b9b68728d746171839cea44e.reference = {
    __cReference: true,
    get value() { return CONTROL_MousePresent; },
    set value(__cxx_lvalue_0) { CONTROL_MousePresent = Boolean(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/mact/src/control.cpp:33
export let CONTROL_JoyPresent = Boolean(false);
export function __cxx_global_cell_c28e8fde50b0de0481978ac3() {
  return __cxx_global_cell_c28e8fde50b0de0481978ac3.reference || (__cxx_global_cell_c28e8fde50b0de0481978ac3.reference = {
    __cReference: true,
    get value() { return CONTROL_JoyPresent; },
    set value(__cxx_lvalue_0) { CONTROL_JoyPresent = Boolean(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/mact/src/control.cpp:34
export let CONTROL_JoystickEnabled = Boolean(false);
export function __cxx_global_cell_c854633804f5e8ca5d3d09be() {
  return __cxx_global_cell_c854633804f5e8ca5d3d09be.reference || (__cxx_global_cell_c854633804f5e8ca5d3d09be.reference = {
    __cReference: true,
    get value() { return CONTROL_JoystickEnabled; },
    set value(__cxx_lvalue_0) { CONTROL_JoystickEnabled = Boolean(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/mact/src/control.cpp:36
export let CONTROL_ButtonState = u64(0);
export function __cxx_global_cell_8dc312bd7532d829a4303d41() {
  return __cxx_global_cell_8dc312bd7532d829a4303d41.reference || (__cxx_global_cell_8dc312bd7532d829a4303d41.reference = {
    __cReference: true,
    get value() { return CONTROL_ButtonState; },
    set value(__cxx_lvalue_0) { CONTROL_ButtonState = u64(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/mact/src/control.cpp:37
export let CONTROL_ButtonHeldState = u64(0);
export function __cxx_global_cell_b8312e111f6fe15957946ec8() {
  return __cxx_global_cell_b8312e111f6fe15957946ec8.reference || (__cxx_global_cell_b8312e111f6fe15957946ec8.reference = {
    __cReference: true,
    get value() { return CONTROL_ButtonHeldState; },
    set value(__cxx_lvalue_0) { CONTROL_ButtonHeldState = u64(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/mact/src/control.cpp:39
export let CONTROL_LastSeenInput = 0;
export function __cxx_global_cell_9e4cb87c453b25482a00c2b9() {
  return __cxx_global_cell_9e4cb87c453b25482a00c2b9.reference || (__cxx_global_cell_9e4cb87c453b25482a00c2b9.reference = {
    __cReference: true,
    get value() { return CONTROL_LastSeenInput; },
    set value(__cxx_lvalue_0) { CONTROL_LastSeenInput = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/mact/src/control.cpp:41
export let CONTROL_MouseAxesSensitivity = new Float32Array([Math.fround(25), Math.fround(25)]);
function __cxx_static_address_b188e463e251774a5a536ec2() {
  return __cxx_static_address_b188e463e251774a5a536ec2.reference || (__cxx_static_address_b188e463e251774a5a536ec2.reference = {
    __cReference: true,
    get value() { return CONTROL_MouseAxesSensitivity; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/mact/src/control.cpp:42
export let CONTROL_MouseSensitivity = Math.fround(Math.fround(25));
export function __cxx_global_cell_193dab9403d93f8a48781171() {
  return __cxx_global_cell_193dab9403d93f8a48781171.reference || (__cxx_global_cell_193dab9403d93f8a48781171.reference = {
    __cReference: true,
    get value() { return CONTROL_MouseSensitivity; },
    set value(__cxx_lvalue_0) { CONTROL_MouseSensitivity = Math.fround(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/mact/src/control.cpp:43
export let CONTROL_MouseSensitivityUnit = Math.fround(Math.fround(0.0313370004));
export function __cxx_global_cell_704184617e9508f023e26f36() {
  return __cxx_global_cell_704184617e9508f023e26f36.reference || (__cxx_global_cell_704184617e9508f023e26f36.reference = {
    __cReference: true,
    get value() { return CONTROL_MouseSensitivityUnit; },
    set value(__cxx_lvalue_0) { CONTROL_MouseSensitivityUnit = Math.fround(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/mact/src/control.cpp:44
export let CONTROL_JoySensitivityUnit = Math.fround(Math.fround(0.200000003));
export function __cxx_global_cell_13fe4069a00cd4e00ddcfee4() {
  return __cxx_global_cell_13fe4069a00cd4e00ddcfee4.reference || (__cxx_global_cell_13fe4069a00cd4e00ddcfee4.reference = {
    __cReference: true,
    get value() { return CONTROL_JoySensitivityUnit; },
    set value(__cxx_lvalue_0) { CONTROL_JoySensitivityUnit = Math.fround(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/mact/src/control.cpp:46
export let CONTROL_NumMouseButtons = i32(0);
function __cxx_static_address_c46ff66dbf70a8b13b808531() {
  return __cxx_static_address_c46ff66dbf70a8b13b808531.reference || (__cxx_static_address_c46ff66dbf70a8b13b808531.reference = {
    __cReference: true,
    get value() { return CONTROL_NumMouseButtons; },
    set value(__cxx_lvalue_0) { CONTROL_NumMouseButtons = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/mact/src/control.cpp:47
export let CONTROL_NumJoyButtons = i32(0);
function __cxx_static_address_40662c34a0c9dadd50c0dfb4() {
  return __cxx_static_address_40662c34a0c9dadd50c0dfb4.reference || (__cxx_static_address_40662c34a0c9dadd50c0dfb4.reference = {
    __cReference: true,
    get value() { return CONTROL_NumJoyButtons; },
    set value(__cxx_lvalue_0) { CONTROL_NumJoyButtons = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/mact/src/control.cpp:48
export let CONTROL_NumJoyAxes = i32(0);
function __cxx_static_address_824f8026f7e76ffc76c8f2d6() {
  return __cxx_static_address_824f8026f7e76ffc76c8f2d6.reference || (__cxx_static_address_824f8026f7e76ffc76c8f2d6.reference = {
    __cReference: true,
    get value() { return CONTROL_NumJoyAxes; },
    set value(__cxx_lvalue_0) { CONTROL_NumJoyAxes = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/mact/src/control.cpp:50
export let CONTROL_Flags = cByteRecordNDArray({"align": 4, "arrayAlign": 1, "fields": {"active": {"native": "Uint8Array", "offset": 0, "size": 1}, "buttonheld": {"native": "Uint8Array", "offset": 3, "size": 1}, "cleared": {"native": "Int32Array", "offset": 4, "size": 4}, "toggle": {"native": "Uint8Array", "offset": 2, "size": 1}, "used": {"native": "Uint8Array", "offset": 1, "size": 1}}, "overlaps": false, "size": 8, "union": false}, [64], {}, []);
function __cxx_static_address_b4bb6c8e05885c434679d582() {
  return __cxx_static_address_b4bb6c8e05885c434679d582.reference || (__cxx_static_address_b4bb6c8e05885c434679d582.reference = {
    __cReference: true,
    get value() { return CONTROL_Flags; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/mact/src/control.cpp:52
export let CONTROL_KeyMapping = cByteRecordNDArray({"align": 1, "arrayAlign": 1, "fields": {"keyPrimary": {"native": "Uint8Array", "offset": 0, "size": 1}, "keySecondary": {"native": "Uint8Array", "offset": 1, "size": 1}}, "overlaps": false, "size": 2, "union": false}, [64], {}, []);
function __cxx_static_address_da21c859223524cc8f8945f0() {
  return __cxx_static_address_da21c859223524cc8f8945f0.reference || (__cxx_static_address_da21c859223524cc8f8945f0.reference = {
    __cReference: true,
    get value() { return CONTROL_KeyMapping; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_57e6e5761424b79c = i32(2147483647);
function __cxx_static_address_15e742ec90599a30663f9a9d() {
  return __cxx_static_address_15e742ec90599a30663f9a9d.reference || (__cxx_static_address_15e742ec90599a30663f9a9d.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_57e6e5761424b79c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_92d0971f0e13286d = i32(2147483648);
function __cxx_static_address_658533379efba322655a0e9d() {
  return __cxx_static_address_658533379efba322655a0e9d.reference || (__cxx_static_address_658533379efba322655a0e9d.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_92d0971f0e13286d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_c6ff0280e399ded2 = i32(2147483648);
function __cxx_static_address_08dfcec6c73e8dc8baf655df() {
  return __cxx_static_address_08dfcec6c73e8dc8baf655df.reference || (__cxx_static_address_08dfcec6c73e8dc8baf655df.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_c6ff0280e399ded2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_34f70bfb45d24435 = i32(65536);
function __cxx_static_address_927bb3cc28e9ae775723e9da() {
  return __cxx_static_address_927bb3cc28e9ae775723e9da.reference || (__cxx_static_address_927bb3cc28e9ae775723e9da.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_34f70bfb45d24435; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_69830a0e56ab151b = i32(32768);
function __cxx_static_address_dc78edfe41d3ff13fac6ba19() {
  return __cxx_static_address_dc78edfe41d3ff13fac6ba19.reference || (__cxx_static_address_dc78edfe41d3ff13fac6ba19.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_69830a0e56ab151b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_ce51c85b2c9aff88 = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_466b291efa571fbab04c7ccc() {
  return __cxx_static_address_466b291efa571fbab04c7ccc.reference || (__cxx_static_address_466b291efa571fbab04c7ccc.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_ce51c85b2c9aff88; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/mact/src/control.cpp:54
export let joyAxes = Array.from({length:9}, () => cZeroAggregate({"record": {"axis": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"analog": {"native": "Int32Array", "offset": 0, "size": 4}, "digital": {"native": "Int8Array", "offset": 4, "size": 1}, "digitalCleared": {"native": "Int8Array", "offset": 5, "size": 1}}, "overlaps": false, "size": 8, "union": false}}, "deadzone": {"scalar": "unsigned short"}, "invert": {"scalar": "bool"}, "last": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"analog": {"native": "Int32Array", "offset": 0, "size": 4}, "digital": {"native": "Int8Array", "offset": 4, "size": 1}, "digitalCleared": {"native": "Int8Array", "offset": 5, "size": 1}}, "overlaps": false, "size": 8, "union": false}}, "mapping": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"analogmap": {"native": "Uint8Array", "offset": 0, "size": 1}, "maxmap": {"native": "Uint8Array", "offset": 2, "size": 1}, "minmap": {"native": "Uint8Array", "offset": 1, "size": 1}}, "overlaps": false, "size": 3, "union": false}}, "saturation": {"scalar": "unsigned short"}, "sensitivity": {"scalar": "float"}}}));
function __cxx_static_address_278c276a827b54c2192a2ad4() {
  return __cxx_static_address_278c276a827b54c2192a2ad4.reference || (__cxx_static_address_278c276a827b54c2192a2ad4.reference = {
    __cReference: true,
    get value() { return joyAxes; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/mact/src/control.cpp:56
export let mouseButtons = cByteRecordNDArray({"align": 4, "arrayAlign": 1, "fields": {"clicked": {"native": "Int32Array", "offset": 4, "size": 4}, "clickedCount": {"native": "Int32Array", "offset": 20, "size": 4}, "clickedState": {"native": "Int32Array", "offset": 8, "size": 4}, "clickedTime": {"native": "Int32Array", "offset": 12, "size": 4}, "mapping": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"doubleclicked": {"native": "Uint8Array", "offset": 1, "size": 1}, "singleclicked": {"native": "Uint8Array", "offset": 0, "size": 1}}, "overlaps": false, "size": 2, "union": false}, "offset": 0}, "state": {"native": "Int32Array", "offset": 16, "size": 4}}, "overlaps": false, "size": 24, "union": false}, [10], {}, []);
function __cxx_static_address_fda1837bae56e42a230910d2() {
  return __cxx_static_address_fda1837bae56e42a230910d2.reference || (__cxx_static_address_fda1837bae56e42a230910d2.reference = {
    __cReference: true,
    get value() { return mouseButtons; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/mact/src/control.cpp:57
export let joyButtons = cByteRecordNDArray({"align": 4, "arrayAlign": 1, "fields": {"clicked": {"native": "Int32Array", "offset": 4, "size": 4}, "clickedCount": {"native": "Int32Array", "offset": 20, "size": 4}, "clickedState": {"native": "Int32Array", "offset": 8, "size": 4}, "clickedTime": {"native": "Int32Array", "offset": 12, "size": 4}, "mapping": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"doubleclicked": {"native": "Uint8Array", "offset": 1, "size": 1}, "singleclicked": {"native": "Uint8Array", "offset": 0, "size": 1}}, "overlaps": false, "size": 2, "union": false}, "offset": 0}, "state": {"native": "Int32Array", "offset": 16, "size": 4}}, "overlaps": false, "size": 24, "union": false}, [32], {}, []);
function __cxx_static_address_39174322afa70bb3a007d85b() {
  return __cxx_static_address_39174322afa70bb3a007d85b.reference || (__cxx_static_address_39174322afa70bb3a007d85b.reference = {
    __cReference: true,
    get value() { return joyButtons; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/mact/src/control.cpp:61
export let ExtGetTime = null;
function __cxx_static_address_e0779d8c54d730200ae85183() {
  return __cxx_static_address_e0779d8c54d730200ae85183.reference || (__cxx_static_address_e0779d8c54d730200ae85183.reference = {
    __cReference: true,
    get value() { return ExtGetTime; },
    set value(__cxx_lvalue_0) { ExtGetTime = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/mact/src/control.cpp:62
export let ticrate = 0;
function __cxx_static_address_2cb0b96bc87c3c66bc327f51() {
  return __cxx_static_address_2cb0b96bc87c3c66bc327f51.reference || (__cxx_static_address_2cb0b96bc87c3c66bc327f51.reference = {
    __cReference: true,
    get value() { return ticrate; },
    set value(__cxx_lvalue_0) { ticrate = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/mact/src/control.cpp:63
export let CONTROL_DoubleClickSpeed = 0;
function __cxx_static_address_5ab620eabccd7f7e9a2e183a() {
  return __cxx_static_address_5ab620eabccd7f7e9a2e183a.reference || (__cxx_static_address_5ab620eabccd7f7e9a2e183a.reference = {
    __cReference: true,
    get value() { return CONTROL_DoubleClickSpeed; },
    set value(__cxx_lvalue_0) { CONTROL_DoubleClickSpeed = ((__cxx_lvalue_0) & 255); }
  });
}

// C/C++ source: source/mact/src/control.cpp:65
export let CONTROL_ButtonFlags = new Int32Array(64);
function __cxx_static_address_effcb8a2d527a6b6e2c9da98() {
  return __cxx_static_address_effcb8a2d527a6b6e2c9da98.reference || (__cxx_static_address_effcb8a2d527a6b6e2c9da98.reference = {
    __cReference: true,
    get value() { return CONTROL_ButtonFlags; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/mact/src/control.cpp:66
export let CONTROL_KeyBinds = cByteRecordNDArray({"align": 8, "arrayAlign": 1, "fields": {"cmdstr": {"offset": 8, "pointer": true, "size": 8}, "key": {"offset": 0, "pointer": true, "size": 8}, "laststate": {"native": "Uint8Array", "offset": 17, "size": 1}, "repeat": {"native": "Uint8Array", "offset": 16, "size": 1}}, "overlaps": false, "size": 24, "union": false}, [266], {}, []);
function __cxx_static_address_9fe3c4beb7486d1a76296afb() {
  return __cxx_static_address_9fe3c4beb7486d1a76296afb.reference || (__cxx_static_address_9fe3c4beb7486d1a76296afb.reference = {
    __cReference: true,
    get value() { return CONTROL_KeyBinds; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/mact/src/control.cpp:67
export let CONTROL_BindsEnabled = Boolean(Boolean(0));
export function __cxx_global_cell_1e65dc992d264e8759155996() {
  return __cxx_global_cell_1e65dc992d264e8759155996.reference || (__cxx_global_cell_1e65dc992d264e8759155996.reference = {
    __cReference: true,
    get value() { return CONTROL_BindsEnabled; },
    set value(__cxx_lvalue_0) { CONTROL_BindsEnabled = Boolean(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/mact/src/control.cpp:112
let __static_controlGetTime_t = i32(0);
export function controlGetTime() {

  (__static_controlGetTime_t = i32((Number(__static_controlGetTime_t) + Number(5))));
  return i32(__static_controlGetTime_t);
}

// C/C++ source: source/mact/src/control.cpp:119
export function controlSetFlag(which, active) {
  if ((u32(which) >= u32(64))) {
    return;
  }
  let flags = (cPointerElementRef(CONTROL_Flags, which).value);
  if ((i32(flags.toggle) == 0)) {
    (flags.active = ((((active) & 255)) & 255));
  } else {
    if (Boolean(active)) {
      (flags.buttonheld = ((((0) & 255)) & 255));
    } else {
      if ((i32(flags.buttonheld) == 0)) {
        (flags.buttonheld = ((((1) & 255)) & 255));
        (flags.active = (((((Boolean(flags.active) ? 0 : 1)) & 255)) & 255));
      }
    }
  }
}

// C/C++ source: source/mact/src/control.cpp:169
export function CONTROL_DefineFlag(which, toggle) {
  if ((u32(which) >= u32(64))) {
    return;
  }
  let flags = (cPointerElementRef(CONTROL_Flags, which).value);
  (flags.active = ((((0) & 255)) & 255));
  (flags.buttonheld = ((((0) & 255)) & 255));
  (flags.cleared = i32(0));
  (flags.toggle = ((((toggle) & 255)) & 255));
  (flags.used = ((((1) & 255)) & 255));
}

// C/C++ source: source/mact/src/control.cpp:182
export function CONTROL_MapKey(which, key1, key2) {
  if ((u32(which) >= u32(64))) {
    return;
  }
  ((cPointerElementRef(CONTROL_KeyMapping, which).value).keyPrimary = (((((Boolean(key1) ? i32(key1) : 127)) & 255)) & 255));
  ((cPointerElementRef(CONTROL_KeyMapping, which).value).keySecondary = (((((Boolean(key2) ? i32(key2) : 127)) & 255)) & 255));
}

// C/C++ source: source/mact/src/control.cpp:224
export function CONTROL_MapButton(whichfunction, whichbutton, doubleclicked, device) {
  let set;
  if ((u32(whichfunction) >= u32(64))) {
    (whichfunction = i32(127));
  }
  switch (i32(device)) {
    case i32(1): {
      if ((u32(whichbutton) >= u32(10))) {
        return;
      }
    }
    (set = cObjectFieldRef((cPointerElementRef(mouseButtons, whichbutton).value), "mapping"));
    break;
    case i32(2): {
      if ((u32(whichbutton) >= u32(32))) {
        return;
      }
    }
    (set = cObjectFieldRef((cPointerElementRef(joyButtons, whichbutton).value), "mapping"));
    break;
    default: {
      return;
    }
  }
  if (Boolean(doubleclicked)) {
    (cRecordObject(set).doubleclicked = ((((whichfunction) & 255)) & 255));
  } else {
    (cRecordObject(set).singleclicked = ((((whichfunction) & 255)) & 255));
  }
}

// C/C++ source: source/mact/src/control.cpp:254
export function CONTROL_MapAnalogAxis(whichaxis, whichanalog) {
  let set = (cPointerElementRef(joyAxes, whichaxis).value).mapping;
  if (((u32(whichanalog) >= u32(6)) && (whichanalog != (-1)))) {
    return;
  }
  (set.analogmap = ((((whichanalog) & 255)) & 255));
}

// C/C++ source: source/mact/src/control.cpp:264
export function JOYSTICK_SetDeadZone(axis, dead, satur) {
  ((cPointerElementRef(joyAxes, axis).value).deadzone = ((dead) & 65535));
  ((cPointerElementRef(joyAxes, axis).value).saturation = ((satur) & 65535));
}

// C/C++ source: source/mact/src/control.cpp:270
export function CONTROL_SetAnalogAxisScale(whichaxis, axisscale, device) {
  let set;
  switch (i32(device)) {
    case i32(1): {
      if ((u64(u32(whichaxis)) >= ARRAY_SIZE__header_106279cee3be(CONTROL_MouseAxesSensitivity))) {
        return;
      }
    }
    (set = cPointerOffset(CONTROL_MouseAxesSensitivity, whichaxis, Float32Array.BYTES_PER_ELEMENT));
    break;
    case i32(2): {
      if ((u32(whichaxis) >= u32(9))) {
        return;
      }
    }
    (set = cObjectFieldRef((cPointerElementRef(joyAxes, whichaxis).value), "sensitivity"));
    break;
    default: {
      return;
    }
  }
  ((cDeref(set, Float32Array).value) = Math.fround(Math.fround((Math.fround(Math.fround(axisscale)) / Math.fround(24576)))));
}

// C/C++ source: source/mact/src/control.cpp:297
export function CONTROL_SetAnalogAxisSensitivity(whichaxis, axissens, device) {
  let set;
  switch (i32(device)) {
    case i32(1): {
      if ((u64(u32(whichaxis)) >= ARRAY_SIZE__header_106279cee3be(CONTROL_MouseAxesSensitivity))) {
        return;
      }
    }
    (set = cPointerOffset(CONTROL_MouseAxesSensitivity, whichaxis, Float32Array.BYTES_PER_ELEMENT));
    break;
    case i32(2): {
      if ((u32(whichaxis) >= u32(9))) {
        return;
      }
    }
    (set = cObjectFieldRef((cPointerElementRef(joyAxes, whichaxis).value), "sensitivity"));
    break;
    default: {
      return;
    }
  }
  ((cDeref(set, Float32Array).value) = Math.fround(axissens));
}

// C/C++ source: source/mact/src/control.cpp:324
export function CONTROL_SetAnalogAxisInvert(whichaxis, invert) {
  let set = cObjectFieldRef((cPointerElementRef(joyAxes, whichaxis).value), "invert");
  ((cDeref(set, Uint8Array).value) = Boolean(Boolean(invert)));
}

// C/C++ source: source/mact/src/control.cpp:330
export function CONTROL_MapDigitalAxis(whichaxis, whichfunction, direction) {
  let set = (cPointerElementRef(joyAxes, whichaxis).value).mapping;
  if ((u32(whichfunction) >= u32(64))) {
    (whichfunction = i32(127));
  }
  switch (direction) {
    case i32(0):
    case i32(2): {
      (set.minmap = ((((whichfunction) & 255)) & 255));
    }
    break;
    case i32(1):
    case i32(3): {
      (set.maxmap = ((((whichfunction) & 255)) & 255));
    }
    break;
    default: {
      break;
    }
  }
}

// C/C++ source: source/mact/src/control.cpp:351
export function CONTROL_ClearAssignments() {
  cByteMemory.memset(joyAxes, 0, 288);
  cByteMemory.memset(joyButtons, 0, 768);
  {
    const __cxx_range_array_0 = joyButtons;
    if (__cxx_range_array_0.length !== 32) throw new RangeError("C array extent mismatch");
    for (let __cxx_range_index_0 = 0; __cxx_range_index_0 < 32; ++__cxx_range_index_0) {
      (__cxx_range_array_0[__cxx_range_index_0].mapping.doubleclicked = ((((127) & 255)) & 255));
      (__cxx_range_array_0[__cxx_range_index_0].mapping.singleclicked = ((((127) & 255)) & 255));
    }
  }
  cByteMemory.memset(mouseButtons, 0, 240);
  {
    const __cxx_range_array_1 = mouseButtons;
    if (__cxx_range_array_1.length !== 10) throw new RangeError("C array extent mismatch");
    for (let __cxx_range_index_1 = 0; __cxx_range_index_1 < 10; ++__cxx_range_index_1) {
      (__cxx_range_array_1[__cxx_range_index_1].mapping.doubleclicked = ((((127) & 255)) & 255));
      (__cxx_range_array_1[__cxx_range_index_1].mapping.singleclicked = ((((127) & 255)) & 255));
    }
  }
  cByteMemory.memset(CONTROL_KeyMapping, 127, 128);
  {
    const __cxx_range_array_2 = CONTROL_MouseAxesSensitivity;
    if (__cxx_range_array_2.length !== 2) throw new RangeError("C array extent mismatch");
    for (let __cxx_range_index_2 = 0; __cxx_range_index_2 < 2; ++__cxx_range_index_2) {
      (__cxx_range_array_2[__cxx_range_index_2] = Math.fround(Math.fround(25)));
    }
  }
  {
    const __cxx_range_array_3 = joyAxes;
    if (__cxx_range_array_3.length !== 9) throw new RangeError("C array extent mismatch");
    for (let __cxx_range_index_3 = 0; __cxx_range_index_3 < 9; ++__cxx_range_index_3) {
      (__cxx_range_array_3[__cxx_range_index_3].sensitivity = Math.fround(Math.fround((Math.fround(65536) / Math.fround(16384)))));
    }
  }
}

// C/C++ source: source/mact/src/control.cpp:379
export function controlHandleClickStates(bits, tm, NumButtons, b) {
  let i = i32((NumButtons - 1));
  let retval = i32(0);
  for (; (i >= 0); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous - 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
    let bs = i32((i32((bits >> i)) & 1));
    ((cPointerElementRef(b, i).value).state = i32(bs));
    ((cPointerElementRef(b, i).value).clickedState = i32(0));
    if (Boolean(bs)) {
      (retval = i32(1));
      if (((cPointerElementRef(b, i).value).clicked == 0)) {
        ((cPointerElementRef(b, i).value).clicked = i32(1));
        if ((((cPointerElementRef(b, i).value).clickedCount == 0) || (tm > (cPointerElementRef(b, i).value).clickedTime))) {
          ((cPointerElementRef(b, i).value).clickedTime = i32((tm + i32(CONTROL_DoubleClickSpeed))));
          ((cPointerElementRef(b, i).value).clickedCount = i32(1));
        } else {
          if ((tm < (cPointerElementRef(b, i).value).clickedTime)) {
            ((cPointerElementRef(b, i).value).clickedState = i32(1));
            ((cPointerElementRef(b, i).value).clickedTime = i32(0));
            ((cPointerElementRef(b, i).value).clickedCount = i32(2));
          }
        }
      } else {
        if (((cPointerElementRef(b, i).value).clickedCount == 2)) {
          ((cPointerElementRef(b, i).value).clickedState = i32(1));
        }
      }
      continue;
    }
    if (((cPointerElementRef(b, i).value).clickedCount == 2)) {
      ((cPointerElementRef(b, i).value).clickedCount = i32(0));
    }
    ((cPointerElementRef(b, i).value).clicked = i32(0));
  }
  return i32(retval);
}

// C/C++ source: source/mact/src/control.cpp:442
export function controllerDigitizeAxis(axis) {
  let set = (cPointerElementRef(joyAxes, axis).value).axis;
  let lastset = (cPointerElementRef(joyAxes, axis).value).last;
  (set.digitalCleared = (((lastset.digitalCleared) << 24) >> 24));
  if ((set.analog > 0)) {
    if (((set.analog > Math.trunc(i32(Math.imul(512, 32767)) / 10000)) || ((set.analog > Math.trunc(i32(Math.imul(128, 32767)) / 10000)) && (i32(lastset.digital) == 1)))) {
      (set.digital = ((((((1) << 24) >> 24)) << 24) >> 24));
    } else {
      (set.digitalCleared = ((((((0) << 24) >> 24)) << 24) >> 24));
    }
    return i32(1);
  } else {
    if ((set.analog < 0)) {
      if (((set.analog < (-Math.trunc(i32(Math.imul(512, 32767)) / 10000))) || ((set.analog < (-Math.trunc(i32(Math.imul(128, 32767)) / 10000))) && (i32(lastset.digital) == (-1))))) {
        (set.digital = (((((((-1)) << 24) >> 24)) << 24) >> 24));
      } else {
        (set.digitalCleared = ((((((0) << 24) >> 24)) << 24) >> 24));
      }
      return i32(1);
    } else {
      (set.digitalCleared = ((((((0) << 24) >> 24)) << 24) >> 24));
    }
  }
  return i32(0);
}

// C/C++ source: source/mact/src/control.cpp:540
export function controlUpdateFlagsFromAxes(p1) {
  if (Boolean(CONTROL_NumJoyAxes)) {
    let axis = i32((CONTROL_NumJoyAxes - 1));
    let retval = i32(0);
    do {
      let a = (cPointerElementRef(joyAxes, axis).value);
      if ((!Boolean(a.axis.digital))) {
        continue;
      }
      let j = i32(((i32(a.axis.digital) < 0) ? a.mapping.minmap : a.mapping.maxmap));
      if ((j != 127)) {
        ((cDeref(cPointerOffset(p1, j, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(1));
        (retval = i32(1));
      }
    } while (Boolean(((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous - 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => axis, __cxx_lvalue_1 => { axis = __cxx_lvalue_1; }))));
    if (Boolean(retval)) {
      (CONTROL_LastSeenInput = 1);
    }
  }
}

// C/C++ source: source/mact/src/control.cpp:630
export function CONTROL_ClearButton(whichbutton) {
  if ((u32(whichbutton) >= u32(64))) {
    return;
  }
  (CONTROL_ButtonState = u64((BigInt(CONTROL_ButtonState) & BigInt((~(BigInt(u64(1)) << BigInt(u64(whichbutton))))))));
  ((cPointerElementRef(CONTROL_Flags, whichbutton).value).cleared = i32(1));
}

// C/C++ source: source/mact/src/control.cpp:642
export function CONTROL_ClearAllButtons() {
  (CONTROL_ButtonHeldState = u64(0));
  (CONTROL_ButtonState = u64(0));
  {
    const __cxx_range_array_0 = CONTROL_Flags;
    if (__cxx_range_array_0.length !== 64) throw new RangeError("C array extent mismatch");
    for (let __cxx_range_index_0 = 0; __cxx_range_index_0 < 64; ++__cxx_range_index_0) {
      (__cxx_range_array_0[__cxx_range_index_0].cleared = i32(1));
    }
  }
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_40cb3de37650d9cd = new Uint8Array([((1) & 255), ((2) & 255), ((4) & 255), ((8) & 255), ((16) & 255), ((32) & 255), ((64) & 255), ((128) & 255)]);
function __cxx_static_address_fc267edcd91a1bd64803fc9e() {
  return __cxx_static_address_fc267edcd91a1bd64803fc9e.reference || (__cxx_static_address_fc267edcd91a1bd64803fc9e.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_40cb3de37650d9cd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:172
export const g_defaultVideoModes__header_global_27b8cad88ead23c5 = cByteRecordNDArray({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, [25], {}, [cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 2560, "y": 1440}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 2560, "y": 1200}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 2560, "y": 1080}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1920, "y": 1440}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1920, "y": 1200}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1920, "y": 1080}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1680, "y": 1050}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1600, "y": 1200}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1600, "y": 900}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1366, "y": 768}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1280, "y": 1024}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1280, "y": 960}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1280, "y": 720}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1152, "y": 864}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1024, "y": 768}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1024, "y": 600}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 800, "y": 600}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 640, "y": 480}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 640, "y": 400}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 512, "y": 384}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 480, "y": 360}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 400, "y": 300}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 320, "y": 240}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 320, "y": 200}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 0, "y": 0}, null, {})]);
function __cxx_static_address_6c74f222ba1d96406045e017() {
  return __cxx_static_address_6c74f222ba1d96406045e017.reference || (__cxx_static_address_6c74f222ba1d96406045e017.reference = {
    __cReference: true,
    get value() { return g_defaultVideoModes__header_global_27b8cad88ead23c5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:188
export const g_keyAsciiTable__header_global_13247ae225701fd3 = new Uint8Array([((0) & 255), ((0) & 255), 49, 50, 51, 52, 53, 54, 55, 56, 57, 48, 45, 61, ((0) & 255), ((0) & 255), 113, 119, 101, 114, 116, 121, 117, 105, 111, 112, 91, 93, ((0) & 255), ((0) & 255), 97, 115, 100, 102, 103, 104, 106, 107, 108, 59, ((39) & 255), 96, ((0) & 255), ((92) & 255), 122, 120, 99, 118, 98, 110, 109, 44, 46, 47, ((0) & 255), 42, ((0) & 255), ((32) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255)]);
function __cxx_static_address_18809b1c407a8eb63e902132() {
  return __cxx_static_address_18809b1c407a8eb63e902132.reference || (__cxx_static_address_18809b1c407a8eb63e902132.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTable__header_global_13247ae225701fd3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:196
export const g_keyAsciiTableShift__header_global_4a7aaf6c61fc3b93 = new Uint8Array([((0) & 255), ((0) & 255), 33, 64, 35, 36, 37, 94, 38, 42, 40, 41, 95, 43, ((0) & 255), ((0) & 255), 81, 87, 69, 82, 84, 89, 85, 73, 79, 80, 123, 125, ((0) & 255), ((0) & 255), 65, 83, 68, 70, 71, 72, 74, 75, 76, 58, 34, 126, ((0) & 255), 124, 90, 88, 67, 86, 66, 78, 77, 60, 62, 63, ((0) & 255), 42, ((0) & 255), ((32) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255)]);
function __cxx_static_address_c19c484b56b4c6df4a1f1199() {
  return __cxx_static_address_c19c484b56b4c6df4a1f1199.reference || (__cxx_static_address_c19c484b56b4c6df4a1f1199.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTableShift__header_global_4a7aaf6c61fc3b93; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/mact/include/keyboard.h:47
export const sctokeylut__header_global_057facea8ec54ebd = cByteRecordNDArray({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, [102], {}, [cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([69, 115, 99, 97, 112, 101, 0]), "sc": ((1) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([49, 0]), "sc": ((2) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([50, 0]), "sc": ((3) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([51, 0]), "sc": ((4) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([52, 0]), "sc": ((5) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([53, 0]), "sc": ((6) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([54, 0]), "sc": ((7) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([55, 0]), "sc": ((8) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([56, 0]), "sc": ((9) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([57, 0]), "sc": ((10) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([48, 0]), "sc": ((11) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([45, 0]), "sc": ((12) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([61, 0]), "sc": ((13) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([66, 97, 107, 83, 112, 99, 0]), "sc": ((14) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([84, 97, 98, 0]), "sc": ((15) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([81, 0]), "sc": ((16) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([87, 0]), "sc": ((17) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([69, 0]), "sc": ((18) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([82, 0]), "sc": ((19) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([84, 0]), "sc": ((20) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([89, 0]), "sc": ((21) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([85, 0]), "sc": ((22) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([73, 0]), "sc": ((23) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([79, 0]), "sc": ((24) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([80, 0]), "sc": ((25) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([91, 0]), "sc": ((26) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([93, 0]), "sc": ((27) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([69, 110, 116, 101, 114, 0]), "sc": ((28) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([76, 67, 116, 114, 108, 0]), "sc": ((29) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([65, 0]), "sc": ((30) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([83, 0]), "sc": ((31) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([68, 0]), "sc": ((32) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 0]), "sc": ((33) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([71, 0]), "sc": ((34) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([72, 0]), "sc": ((35) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([74, 0]), "sc": ((36) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 0]), "sc": ((37) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([76, 0]), "sc": ((38) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([59, 0]), "sc": ((39) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([39, 0]), "sc": ((40) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([96, 0]), "sc": ((41) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([76, 83, 104, 105, 102, 116, 0]), "sc": ((42) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([66, 97, 99, 107, 115, 108, 97, 115, 104, 0]), "sc": ((43) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([90, 0]), "sc": ((44) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([88, 0]), "sc": ((45) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([67, 0]), "sc": ((46) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([86, 0]), "sc": ((47) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([66, 0]), "sc": ((48) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([78, 0]), "sc": ((49) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([77, 0]), "sc": ((50) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([44, 0]), "sc": ((51) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([46, 0]), "sc": ((52) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([47, 0]), "sc": ((53) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([82, 83, 104, 105, 102, 116, 0]), "sc": ((54) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 42, 0]), "sc": ((55) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([76, 65, 108, 116, 0]), "sc": ((56) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([83, 112, 97, 99, 101, 0]), "sc": ((57) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([67, 97, 112, 76, 99, 107, 0]), "sc": ((58) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 49, 0]), "sc": ((59) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 50, 0]), "sc": ((60) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 51, 0]), "sc": ((61) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 52, 0]), "sc": ((62) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 53, 0]), "sc": ((63) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 54, 0]), "sc": ((64) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 55, 0]), "sc": ((65) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 56, 0]), "sc": ((66) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 57, 0]), "sc": ((67) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 49, 48, 0]), "sc": ((68) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([78, 117, 109, 76, 99, 107, 0]), "sc": ((69) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([83, 99, 114, 76, 99, 107, 0]), "sc": ((70) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 55, 0]), "sc": ((71) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 56, 0]), "sc": ((72) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 57, 0]), "sc": ((73) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 45, 0]), "sc": ((74) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 52, 0]), "sc": ((75) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 53, 0]), "sc": ((76) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 54, 0]), "sc": ((77) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 43, 0]), "sc": ((78) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 49, 0]), "sc": ((79) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 50, 0]), "sc": ((80) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 51, 0]), "sc": ((81) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 48, 0]), "sc": ((82) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 46, 0]), "sc": ((83) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([76, 101, 115, 115, 84, 104, 97, 110, 0]), "sc": ((86) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 49, 49, 0]), "sc": ((87) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([70, 49, 50, 0]), "sc": ((88) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 100, 69, 110, 116, 0]), "sc": ((156) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([82, 67, 116, 114, 108, 0]), "sc": ((157) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([75, 112, 97, 100, 47, 0]), "sc": ((181) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([82, 65, 108, 116, 0]), "sc": ((184) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([80, 114, 116, 83, 99, 110, 0]), "sc": ((183) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([80, 97, 117, 115, 101, 0]), "sc": ((197) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([72, 111, 109, 101, 0]), "sc": ((199) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([85, 112, 0]), "sc": ((200) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([80, 103, 85, 112, 0]), "sc": ((201) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([76, 101, 102, 116, 0]), "sc": ((203) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([82, 105, 103, 104, 116, 0]), "sc": ((205) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([69, 110, 100, 0]), "sc": ((207) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([68, 111, 119, 110, 0]), "sc": ((208) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([80, 103, 68, 110, 0]), "sc": ((209) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([73, 110, 115, 101, 114, 116, 0]), "sc": ((210) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, {"key": Uint8Array.from([68, 101, 108, 101, 116, 101, 0]), "sc": ((211) & 255)}, null, {})]);
function __cxx_static_address_87b723d274a403ebeabbd996() {
  return __cxx_static_address_87b723d274a403ebeabbd996.reference || (__cxx_static_address_87b723d274a403ebeabbd996.reference = {
    __cReference: true,
    get value() { return sctokeylut__header_global_057facea8ec54ebd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:895
export const pow2long__header_global_fc01932e5e0269a6 = new Int32Array([1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576, 2097152, 4194304, 8388608, 16777216, 33554432, 67108864, 134217728, 268435456, 536870912, 1073741824, 2147483647]);
function __cxx_static_address_a0b217710d0e8f66ef9f649e() {
  return __cxx_static_address_a0b217710d0e8f66ef9f649e.reference || (__cxx_static_address_a0b217710d0e8f66ef9f649e.reference = {
    __cReference: true,
    get value() { return pow2long__header_global_fc01932e5e0269a6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:907
export const pow2ulong__header_global_408d729c39d6207f = new Uint32Array([u32(1), u32(2), u32(4), u32(8), u32(16), u32(32), u32(64), u32(128), u32(256), u32(512), u32(1024), u32(2048), u32(4096), u32(8192), u32(16384), u32(32768), u32(65536), u32(131072), u32(262144), u32(524288), u32(1048576), u32(2097152), u32(4194304), u32(8388608), u32(16777216), u32(33554432), u32(67108864), u32(134217728), u32(268435456), u32(536870912), u32(1073741824), u32(2147483648n)]);
function __cxx_static_address_4326b10511633296cc0ebd41() {
  return __cxx_static_address_4326b10511633296cc0ebd41.reference || (__cxx_static_address_4326b10511633296cc0ebd41.reference = {
    __cReference: true,
    get value() { return pow2ulong__header_global_408d729c39d6207f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:919
export const pow264__header_global_8e0cd082eb4a1fe2 = new BigInt64Array([BigInt(i64(1)), BigInt(i64(2)), BigInt(i64(4)), BigInt(i64(8)), BigInt(i64(16)), BigInt(i64(32)), BigInt(i64(64)), BigInt(i64(128)), BigInt(i64(256)), BigInt(i64(512)), BigInt(i64(1024)), BigInt(i64(2048)), BigInt(i64(4096)), BigInt(i64(8192)), BigInt(i64(16384)), BigInt(i64(32768)), BigInt(i64(65536)), BigInt(i64(131072)), BigInt(i64(262144)), BigInt(i64(524288)), BigInt(i64(1048576)), BigInt(i64(2097152)), BigInt(i64(4194304)), BigInt(i64(8388608)), BigInt(i64(16777216)), BigInt(i64(33554432)), BigInt(i64(67108864)), BigInt(i64(134217728)), BigInt(i64(268435456)), BigInt(i64(536870912)), BigInt(i64(1073741824)), BigInt(2147483648n), BigInt(4294967296n), BigInt(8589934592n), BigInt(17179869184n), BigInt(34359738368n), BigInt(68719476736n), BigInt(137438953472n), BigInt(274877906944n), BigInt(549755813888n), BigInt(1099511627776n), BigInt(2199023255552n), BigInt(4398046511104n), BigInt(8796093022208n), BigInt(17592186044416n), BigInt(35184372088832n), BigInt(70368744177664n), BigInt(140737488355328n), BigInt(281474976710656n), BigInt(562949953421312n), BigInt(1125899906842624n), BigInt(2251799813685248n), BigInt(4503599627370496n), BigInt(9007199254740992n), BigInt(18014398509481984n), BigInt(36028797018963968n), BigInt(72057594037927936n), BigInt(144115188075855872n), BigInt(288230376151711744n), BigInt(576460752303423488n), BigInt(1152921504606846976n), BigInt(2305843009213693952n), BigInt(4611686018427387904n), BigInt(9223372036854775807n)]);
function __cxx_static_address_e2a79a2cb18473a8b94c1bd7() {
  return __cxx_static_address_e2a79a2cb18473a8b94c1bd7.reference || (__cxx_static_address_e2a79a2cb18473a8b94c1bd7.reference = {
    __cReference: true,
    get value() { return pow264__header_global_8e0cd082eb4a1fe2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export function clamp__header_e9a9456e345c(__cxx_in, min, max) {
  return Math.fround(((__cxx_in <= Math.fround(Math.fround(min))) ? Math.fround(Math.fround(min)) : ((__cxx_in >= Math.fround(Math.fround(max))) ? Math.fround(Math.fround(max)) : __cxx_in)));
}

export function ARRAY_SIZE__header_106279cee3be(arg0) {
  return u64(2n);
}

// C/C++ source: source/mact/src/control.cpp:328
export function ksgn__header_47c00fdfb968(a) {
  return i32((i32((a > 0)) - i32((a < 0))));
}

// C/C++ source: @sysroot/usr/include/c++/12/bits/stl_algobase.h:230
export function min__template_774131ccff66371d(__a, __b) {
  if ((__b.value < __a.value)) {
    return __b;
  }
  return __a;
}

export function SILENCE_UNUSED__header_2ebdc4f6e1ec(arg0) {

}

// C/C++ source: source/build/include/smmalloc.h:864
export function _sm_free(allocator, p) {
  return cRecordObject(allocator).Free(p);
}

// C/C++ source: source/build/include/smmalloc.h:859
export function _sm_malloc(allocator, bytesCount, alignment) {
  return cRecordObject(allocator).Alloc(bytesCount, alignment);
}
